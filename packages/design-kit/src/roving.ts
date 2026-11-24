import { isOff, takesFocus } from './find.js';
import { activeOf } from './focus.js';
import { type AttachOptions, join, keep, type Kept, teardown } from './teardown.js';

/*
 * A group of cells with one stop for the Tab key, moved among by the arrow keys, Home and End, and
 * each cell's own tabindex, put back as its group is let go. No entry of the package exports this
 * module, so a page never reaches it.
 */

/** How a group's cells are laid out, which sets the arrow keys that move among them. */
export type RovingOrientation = 'grid' | 'horizontal' | 'vertical';

/** How a group of cells is attached, and the signal that holds it. */
export type RovingOptions = AttachOptions & {
    /**
     * Grid moves by the arrows each way as the cells are drawn, horizontal by left and right alone,
     * vertical by up and down alone. A tablist takes its aria-orientation, else horizontal, and any
     * other group a grid.
     */
    readonly orientation?: RovingOrientation | undefined;
    /** The cell the Tab key lands on, such as the chosen tab, read as the stop is placed. */
    readonly current?: (() => Element | null) | undefined;
    /**
     * Called with the cell the arrows, Home or End moved focus to, for a page that chooses on it,
     * and never for a cell marked off, which is reached to hear why but never chosen.
     */
    readonly onMove?: ((cell: HTMLElement) => void) | undefined;
};

/** Where a cell is drawn. */
type Cell = {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
};

const ROVING_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];

/** The cell nearest across in the row above or below one, by where the cells are drawn. */
const acrossFrom = (at: number, boxes: readonly Cell[], down: boolean): number => {
    const here = boxes[at];
    if (!here) return at;
    const rows = boxes
        .map((box, index) => ({ box, index }))
        .filter(({ box }) =>
            down ? box.top >= here.top + here.height / 2 : box.top + box.height / 2 <= here.top
        );
    const first = rows.reduce<Cell | null>(
        (near, { box }) => (!near || (down ? box.top < near.top : box.top > near.top) ? box : near),
        null
    );
    if (!first) return at;
    // A cell is in that row when its middle falls within the row's height, so a cell drawn a
    // fraction of a pixel lower is not left out of it.
    const middle = here.left + here.width / 2;
    const row = rows.filter(({ box }) => {
        const center = box.top + box.height / 2;
        return center >= first.top && center <= first.top + first.height;
    });
    const distance = (box: Cell) => Math.abs(box.left + box.width / 2 - middle);
    return row.reduce((best, one) => (distance(one.box) < distance(best.box) ? one : best)).index;
};

/**
 * The cell a key moves to from a cell, or the cell itself where the key does not move this way. A
 * row or a column wraps from one end to the other, as the tabs pattern has it, and a grid stops at
 * its ends. The cells' boxes and the reading direction are read only for the keys that need them.
 */
const rovedTo = (
    key: string,
    at: number,
    cells: readonly HTMLElement[],
    group: { readonly orientation: RovingOrientation; readonly element: HTMLElement }
): number => {
    const last = cells.length - 1;
    if (key === 'Home') return 0;
    if (key === 'End') return last;
    const vertical = key === 'ArrowUp' || key === 'ArrowDown';
    const { orientation } = group;
    if (vertical ? orientation === 'horizontal' : orientation === 'vertical') return at;
    if (vertical && orientation === 'grid')
        return acrossFrom(
            at,
            cells.map((cell) => cell.getBoundingClientRect()),
            key === 'ArrowDown'
        );
    const rightToLeft = !vertical && getComputedStyle(group.element).direction === 'rtl';
    const back = vertical ? 'ArrowUp' : rightToLeft ? 'ArrowRight' : 'ArrowLeft';
    const step = key === back ? -1 : 1;
    if (orientation === 'grid') return Math.min(last, Math.max(0, at + step));
    return (at + step + cells.length) % cells.length;
};

const attachedGroups = new WeakMap<HTMLElement, Kept<() => void, RovingOptions>>();

const CELLS = ':scope > :is(button, a[href], [role="tab"])';

/**
 * The cells of a group: its buttons, links and tabs, in order, leaving out one that is disabled,
 * inert or out of sight, which could take no focus and so could not be the group's stop.
 */
const cellsIn = (group: HTMLElement): HTMLElement[] =>
    [...group.querySelectorAll<HTMLElement>(CELLS)].filter(takesFocus);

/** Each cell's own tabindex before a group was attached, put back as the group is let go. */
const ownTabIndex = new WeakMap<HTMLElement, string | null>();

/** The cell to hand focus to where one was taken out: the next still there, else the one before. */
const inPlaceOf = (
    gone: HTMLElement,
    before: readonly HTMLElement[],
    now: readonly HTMLElement[]
): HTMLElement | undefined => {
    const at = before.indexOf(gone);
    const after = before.slice(at + 1).find((cell) => now.includes(cell));
    return (
        after ??
        before
            .slice(0, Math.max(at, 0))
            .reverse()
            .find((cell) => now.includes(cell)) ??
        now[0]
    );
};

/**
 * Gives a group of cells, such as a grid of buttons or a row of tabs, one stop for the Tab key and
 * moves focus among its cells with the arrow keys, Home and End, and returns what takes it down. A
 * grid moves up and down to the nearest cell in the row above or below as the cells are drawn, so
 * it holds at any count of columns, and left and right follow the page's reading direction. A row
 * of tabs ignores up and down and wraps from one end to the other. An arrow held with Alt, Control
 * or Command is left to the browser. The stop is the cell the page names as current, else a
 * tablist's chosen tab, else the one focus last reached, else the first, and a cell that is
 * disabled, inert or out of sight is never the stop. The stop is placed as the group is attached,
 * as its cells change and as its size does, so a group attached while drawn at no size, in a closed
 * details, under hidden or display none, or in a dialog not yet open, has its stop once it shows. A
 * group under inert, or hidden in a way that keeps its size, is placed again only as its cells
 * change. A cell marked off keeps its place, as it does in the tab order, and is never handed to
 * `onMove`. The kit moves focus and the page chooses: a page that chooses a tab as focus reaches it
 * does so in `onMove`. A grid of buttons with the group's role, or none, takes the toolbar's, so a
 * screen reader says the arrows move within it. Where the cell that had focus is taken out, focus
 * goes to the next cell still there, or the one before. Taken down, by what it returns or by its
 * `signal`, each cell takes back its own tabindex and the grid its own role. Attached again, a
 * group returns what it returned first and runs on the options of its newest holder, its observers
 * kept.
 */
export const attachRoving = (group: HTMLElement, options?: RovingOptions): (() => void) => {
    // A signal already aborted does nothing, so even new options for a group already attached are
    // not taken.
    if (options?.signal?.aborted) return () => undefined;
    const already = join(attachedGroups, group, options);
    if (already) return already;
    const down = teardown(options?.signal, options);
    const { signal } = down;
    let chosen: RovingOptions = options ?? {};
    let last: HTMLElement | null = null;
    // The cell holding focus, so one taken out hands focus on only where it held it.
    let holding: HTMLElement | null = null;
    const tablist = group.getAttribute('role') === 'tablist';
    const orientation = (): RovingOrientation =>
        chosen.orientation ??
        (tablist
            ? group.getAttribute('aria-orientation') === 'vertical'
                ? 'vertical'
                : 'horizontal'
            : 'grid');
    const stopOf = (cells: readonly HTMLElement[]): HTMLElement | undefined => {
        const named =
            chosen.current?.() ?? (tablist ? group.querySelector('[aria-selected="true"]') : null);
        return (
            cells.find((cell) => cell === named) ?? cells.find((cell) => cell === last) ?? cells[0]
        );
    };
    const place = () => {
        const cells = cellsIn(group);
        const stop = stopOf(cells);
        for (const cell of group.querySelectorAll<HTMLElement>(CELLS)) {
            if (!ownTabIndex.has(cell)) ownTabIndex.set(cell, cell.getAttribute('tabindex'));
            const wanted = cell === stop ? '0' : '-1';
            if (cell.getAttribute('tabindex') !== wanted) cell.setAttribute('tabindex', wanted);
        }
    };
    const onKey = (event: KeyboardEvent) => {
        if (event.altKey || event.ctrlKey || event.metaKey || !ROVING_KEYS.includes(event.key))
            return;
        const cells = cellsIn(group);
        const from = cells.findIndex((cell) => cell === event.target);
        if (from < 0) return;
        const to = rovedTo(event.key, from, cells, { orientation: orientation(), element: group });
        const cell = cells[to];
        if (to === from || !cell) return;
        event.preventDefault();
        // Focus reaching the cell places the stop, through the group's focus listener.
        cell.focus();
        if (!isOff(cell)) chosen.onMove?.(cell);
    };
    const cellOf = (target: EventTarget | null) =>
        cellsIn(group).find((one) => target instanceof Node && one.contains(target));
    const onReach = (event: Event) => {
        const cell = cellOf(event.target);
        if (!cell) return;
        last = cell;
        if (event.type === 'focusin') holding = cell;
        place();
    };
    // Focus that went somewhere outside lets the group go, and so does focus that went to nothing
    // from a cell still on the page, as a press on the page's background sends it. Focus that went
    // to nothing as the cell holding it was taken out is still held here, so it is handed on.
    const onLeave = (event: FocusEvent) => {
        const to = event.relatedTarget;
        if (to instanceof Node) {
            if (!group.contains(to)) holding = null;
            return;
        }
        const from = event.target;
        queueMicrotask(() => {
            if (from instanceof Element && from.isConnected) holding = null;
        });
    };
    let before = cellsIn(group);
    // Run as the group's cells change and as its size does: a cell that went out, or out of sight,
    // hands its place to the next cell still there, and focus with it where it fell from that cell,
    // and the stop is placed again.
    const settle = () => {
        const cells = cellsIn(group);
        const gone = last && !cells.includes(last) ? last : null;
        if (gone) {
            const next = inPlaceOf(gone, before, cells) ?? null;
            last = next;
            const fell = activeOf() === document.body || activeOf() === null;
            if (holding === gone && fell && next) next.focus();
        }
        before = cells;
        place();
    };
    const kept = new MutationObserver(settle);
    kept.observe(group, {
        childList: true,
        subtree: true,
        attributeFilter: ['aria-selected', 'hidden', 'disabled', 'inert', 'class', 'style'],
    });
    // A group attached out of sight in a way that draws it at no size, in a closed details, under
    // hidden or display none, or in a dialog not yet open, has no cell in sight to take the stop,
    // and what shows it changes something outside the group, which the observer above does not
    // hear. Such a group is drawn at its own size once it shows, so watching its size places the
    // stop as it comes into sight. The watch also hears a cell a media query or a page's rule hides
    // as it resizes the group. It runs on each change of the group's size, such as each frame a
    // window is dragged or a font that loads, and each run checks whether each of the group's cells
    // is in sight, on a layout the observer runs after, and writes a tabindex only where one
    // changes. A group made inert, or hidden in a way that keeps its size, is not heard. Listening
    // for a details' toggle would miss a panel or a dialog. Giving the named or first cell the stop
    // while none is in sight cannot tell a cell hidden with its group from one hidden on its own,
    // which would keep the stop out of sight once the group shows.
    const drawn = new ResizeObserver(settle);
    drawn.observe(group);
    group.addEventListener('keydown', onKey, { signal });
    group.addEventListener('focusin', onReach, { signal });
    group.addEventListener('focusout', onLeave, { signal });
    // Safari leaves a tapped button without focus, so a press places the stop too.
    group.addEventListener('click', onReach, { signal });
    const ownRole = group.getAttribute('role');
    const toolbar = group.matches('.dk-button-grid') && (ownRole === null || ownRole === 'group');
    if (toolbar) group.setAttribute('role', 'toolbar');
    place();
    down.add(() => {
        kept.disconnect();
        drawn.disconnect();
        for (const cell of group.querySelectorAll<HTMLElement>(CELLS)) {
            if (!ownTabIndex.has(cell)) continue;
            const own = ownTabIndex.get(cell) ?? null;
            if (own === null) cell.removeAttribute('tabindex');
            else cell.setAttribute('tabindex', own);
            ownTabIndex.delete(cell);
        }
        if (toolbar) {
            if (ownRole === null) group.removeAttribute('role');
            else group.setAttribute('role', ownRole);
        }
    });
    down.set = (next) => {
        chosen = next;
        place();
    };
    return keep(attachedGroups, group, down, down.stop);
};
