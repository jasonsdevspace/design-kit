import { isOff } from './find.js';
import { activeIn, activeOf, focusedNow, handBack, holds, homeOf, mayHandBack } from './focus.js';
import { claimLine, hush, releaseLine, say } from './line.js';
import { type AttachOptions, join, keep, type Kept, teardown } from './teardown.js';

/*
 * The toast, which shows a message with one action or none, keeps room for itself in an app's
 * frame, and hands focus back as it leaves. No entry of the package exports this module, so a page
 * never reaches it.
 */

/** How long a toast with no action stays while nothing holds it, in milliseconds. */
const TOAST_FOR = 5000;

/** What a toast offers beside its message: the action's words, and what choosing it does. */
export type ToastAction = { readonly label: string; readonly onAction: () => void };

/** Shows a message in a toast, with one action or none, and returns what dismisses that message. */
export type ShowToast = (message: string, action?: ToastAction) => () => void;

const attachedToasts = new WeakMap<HTMLElement, Kept<ShowToast>>();

/**
 * The rows a toast takes, its content's height over the target's length, from one to five, or none
 * for a toast with no size or a target with no length.
 */
const rowsOf = (element: HTMLElement, target: number): string | undefined => {
    if (!target || !element.clientHeight) return undefined;
    const edges = getComputedStyle(element);
    const held =
        element.clientHeight - parseFloat(edges.paddingTop) - parseFloat(edges.paddingBottom);
    return String(Math.min(5, Math.max(1, Math.ceil(held / target - 0.02))));
};

/** Writes a data attribute only where its value changes, or takes it off where none is given. */
const markWith = (element: HTMLElement, name: string, value?: string) => {
    if (value === undefined) delete element.dataset[name];
    else if (element.dataset[name] !== value) element.dataset[name] = value;
};

/**
 * A frame's own part, its body or its dock: the frame's child of that name first, then one deeper
 * in the frame, inside a form for one, but never a part of a picture of a frame the frame holds.
 */
const partOf = (frame: HTMLElement | undefined, name: string) =>
    frame?.querySelector(`:scope > .dk-app-${name}`) ??
    frame?.querySelector(`.dk-app-${name}:not(.dk-picture, .dk-picture *)`);

/**
 * Marks the frame a toast sits in with the rows the sheet keeps room for in its body, and says
 * whether the toast floats over that body. The sheet floats the toast and keeps the room only for a
 * body that is the frame's own child. A body anywhere else in the frame, inside a form for one,
 * takes no mark, and its toast takes its row above the dock, as does one whose body would keep less
 * than a row and a half above the room. A frame with no body, or a toast not yet measured, is left
 * floating.
 */
const floatsIn = (frame: HTMLElement, rows: string | undefined, target: number): boolean => {
    const body = partOf(frame, 'body');
    const own = body?.parentElement === frame;
    // An unmeasured toast keeps the two rows the sheet gives a mark with no count.
    markWith(frame, 'toastRows', own ? (rows ?? '') : undefined);
    if (!body || rows === undefined) return true;
    if (!own) return false;
    const room = body.clientHeight - parseFloat(getComputedStyle(body).scrollPaddingBottom);
    return room >= 1.5 * target;
};

/**
 * Marks a shown toast with the rows it takes, its content's height over the target's length, which
 * the sheet's room counts by, from one to five, so the sheet keeps that much room for it. In an
 * app's frame it writes the same count on the frame, as data-toast-rows, empty for a toast it could
 * not measure, since the sheet keeps the room in the frame's body by that mark, where a rule that
 * read the toast from the frame would have Chromium restyle the whole frame for every change in
 * it. The mark is on the frame, the toast's own ancestor, so it lasts as long as the toast does,
 * through a body the page draws afresh. Where the body would keep less than a row and a half above
 * that room, or is not the frame's own child, it marks the toast to take its row above the dock
 * instead, takes the frame's mark off, and scrolls the page by as much as the dock moved, so the
 * dock stays under the thumb. All are attributes rather than styles, so a page's policy may refuse
 * every style it did not serve, and each is written only where it changes, so measuring a floating
 * toast that has not changed restyles nothing. A toast in a container out of sight, which has no
 * size, is left unmarked until it is measured again. It takes the frame it marked last and returns
 * the one it found, marked or not, so the mark comes off a frame the toast has left and a dismiss
 * takes it off the element that carries it.
 */
const measureToast = (
    element: HTMLElement,
    close: HTMLElement,
    marked?: HTMLElement
): HTMLElement | undefined => {
    const frame = element.closest<HTMLElement>('.dk-app') ?? undefined;
    const dock = partOf(frame, 'dock');
    // A frame the toast marked and has since left keeps no room for it.
    if (marked !== frame) delete marked?.dataset['toastRows'];
    const target = parseFloat(getComputedStyle(close).minWidth);
    const before = dock?.getBoundingClientRect().top ?? 0;
    delete element.dataset['row'];
    const rows = rowsOf(element, target);
    markWith(element, 'rows', rows);
    if (frame && !floatsIn(frame, rows, target)) {
        element.dataset['row'] = '';
        delete frame.dataset['toastRows'];
        window.scrollBy(0, (dock?.getBoundingClientRect().top ?? 0) - before);
    }
    return frame;
};

/**
 * Scrolls the control that had focus as a message came, where a shown toast covers it, clear of the
 * toast by the scroll padding the sheet keeps under it. The toast is measured where it comes to
 * rest, without the rise it starts its entrance on, read from its computed translate and taken as
 * none where that is not in pixels. Where focus was in a frame of the page's own origin, it
 * measures the control read inside the frame, placed past the frame's border and padding, scaled
 * across and down as the frame is drawn, and cut to what the frame shows inside its scrollbars, so
 * a control the frame has scrolled out of sight counts as covered nowhere. A frame rotated or
 * skewed is measured by its bounding box. That control's own scroll into view moves the frame's
 * document and the page. One the toast leaves alone, beside it or above it, or one taller than the
 * room above the toast, such as the body of the app's frame, stays where it is.
 */
const clearOf = (element: HTMLElement, active: Element, inner: Element | null | undefined) => {
    const control = inner ?? active;
    const card = element.getBoundingClientRect();
    const rise = Number(
        /^\S+ (-?[\d.]+)px/.exec(String(getComputedStyle(element).translate))?.[1] ?? 0
    );
    let { top, right, bottom, left, height } = control.getBoundingClientRect();
    if (inner) {
        const frame = active as HTMLElement;
        const place = frame.getBoundingClientRect();
        const edges = getComputedStyle(frame);
        const across = place.width / frame.offsetWidth;
        const down = place.height / frame.offsetHeight;
        const x = place.left + (frame.clientLeft + parseFloat(edges.paddingLeft)) * across;
        const y = place.top + (frame.clientTop + parseFloat(edges.paddingTop)) * down;
        const view = inner.ownerDocument.scrollingElement ?? inner.ownerDocument.documentElement;
        [top, right, bottom, left, height] = [
            y + Math.max(top, 0) * down,
            x + Math.min(right, view.clientWidth) * across,
            y + Math.min(bottom, view.clientHeight) * down,
            x + Math.max(left, 0) * across,
            height * down,
        ];
    }
    if (
        bottom > Math.max(top, card.top - rise) &&
        top < card.bottom - rise &&
        right > Math.max(left, card.left) &&
        left < card.right &&
        height < card.top - rise
    )
        control.scrollIntoView({ block: 'nearest' });
};

/**
 * Makes a toast work, and returns the function that shows a message in it. The message is drawn in
 * the toast and said on its status line, which is on the page from the start, so a screen reader
 * hears it without focus moving, with the action's name when it has one, so a visitor who cannot
 * see it learns there is a way back. The line keeps it until the toast leaves, and is what a screen
 * reader reads in the toast, since the words drawn are hidden from it. The same words shown twice
 * are heard twice. A shown toast is marked by its data-shown attribute, which a page that draws it
 * again, as React does with its class, leaves alone. The dk-toast-shown class is set beside it for
 * a page that reads it, though such a redraw takes the class away while the toast stays shown. In
 * an app's frame the frame carries data-toast-rows while the toast floats over its body, the rows
 * the sheet keeps room for there, written as the toast is measured and taken off as it leaves. As a
 * message shows, the control that has focus is scrolled clear of the toast where the toast,
 * measured where it comes to rest, would cover it across as well as down. With focus inside a frame
 * of the page's own origin, that is the control that has focus there, read as the message comes and
 * measured where the frame places it, past the frame's border and padding, scaled across and down
 * as the frame is drawn and cut to what the frame shows inside its scrollbars, so a tall frame does
 * not hide it. A frame of another origin, or one where only its body has focus, is measured whole.
 *
 * A toast leaves when its close button, its action or Escape with focus in it dismisses it, or the
 * next message replaces it. One with an action stays until then, since a timer would take the
 * action away from anyone slower than it. One with no action also leaves after five seconds, a wait
 * held while the pointer is over it or focus is in it. When a toast leaves with focus in it, focus
 * goes to the first of these that takes it: the control focus last came into the toast from, then
 * the control outside the toast that had focus as the latest message came, then the body of the
 * app's frame, or on a page with no frame its main content. The first is passed over where focus
 * last came into the toast from nowhere. Focus goes back only where it is in the toast, inside a
 * shadow tree within it or on a control slotted into it too, or where the page has taken the toast
 * away with focus in it so that focus has fallen to the body or to nothing, while focus a visitor
 * has put anywhere else stays. Its Close and its action take a tabindex of 0 where the page set
 * none, so Safari, which focuses a pressed button only where it has one, leaves focus in the toast
 * on a press or a tap and focus can go back as it leaves. Attaching a toast again returns the same
 * function, its message still shown. Taken down by its `signal`, it dismisses its message as its
 * Close does, the mark on its frame with it, takes off its listeners, its observer, its listener on
 * the window's size and its timer, takes away the tabindex it added and lets its line go, and the
 * function it returned, and what that returned, do nothing after. A signal already aborted returns
 * a function that shows nothing.
 *
 * Focus leaves the toast where nothing on the list takes it, so it falls to the page's body rather
 * than staying on the toast's hidden button. The toast takes off its shown state before it hands
 * focus back, so the room the sheet keeps under a shown toast does not scroll the control focus
 * goes to. Where a page's own listener moves focus elsewhere as the toast hands it back, the toast
 * goes no further down the list and that focus stays. A page sees focus inside a frame only as the
 * frame, and focus that comes into the toast from inside a frame as coming from nowhere. Where its
 * handback focuses a frame of the page's own origin, it goes on to the control that had focus there
 * as the latest message came, read as the message came, and stays on the frame where that control
 * is gone, marked off, on a page the frame has since replaced, and on a frame of another origin. A
 * frame inside that frame is not followed, so focus goes back to the inner frame itself. Firefox
 * does not focus a frame of another origin while a key is being pressed, so a dismiss by keyboard
 * there goes on down the list.
 */
export const attachToast = (element: HTMLElement, options?: AttachOptions): ShowToast => {
    const idle: ShowToast = () => () => undefined;
    // A toast already attached is handed back as it is, before its parts are looked for, so one
    // whose markup has since lost a part still returns what shows a message. A signal already
    // aborted does nothing to it.
    const already = join(attachedToasts, element, options, idle);
    if (already) return already;
    const part = <T extends HTMLElement>(name: string) => {
        const found = element.querySelector<T>(`.dk-toast-${name}`);
        if (!found) throw new Error(`a toast needs its ${name}`);
        return found;
    };
    const message = part('message');
    const status = part('status');
    const actionButton = part<HTMLButtonElement>('action');
    const close = part<HTMLButtonElement>('close');
    // Checked after the parts, so markup missing one throws at its first attach whatever the
    // signal.
    if (options?.signal?.aborted) return idle;
    const down = teardown(options?.signal);
    const { signal } = down;
    // Safari focuses a pressed button only where it has a tabindex, so a press of either button
    // leaves focus in the toast and it goes back as the toast hides. A page's own is kept.
    const given = [actionButton, close].filter((button) => !button.hasAttribute('tabindex'));
    for (const button of given) button.tabIndex = 0;
    // The toast's own line, let go of as an earlier attach was taken down, speaks for this one.
    claimLine(status);
    // The frame the toast last marked, so the mark comes off the element that carries it.
    let marked: HTMLElement | undefined;
    // While a message is shown, the toast is measured again whenever its size or the screen's
    // changes, a turned phone or a new text size among them, so its room never goes stale.
    const remeasure = () => {
        marked = measureToast(element, close, marked);
    };
    const watch = new ResizeObserver(remeasure);
    let timer = 0;
    // Each message's number, which only grows, so what dismisses one never dismisses a later one.
    let count = 0;
    let shown = 0;
    let hovered = false;
    let focused = false;
    // Whether focus was in the toast as it was taken from the page, read for the handback alone.
    let leftWith = false;
    let onAction: (() => void) | undefined;
    // The control focus came into the toast from, where focus was as the latest message came, and
    // the element that last lost focus, read inside open shadow roots, which an event's related
    // target names only by its host.
    let cameFrom: Element | undefined;
    let arrivedAt: Element | undefined;
    let lost: Element | undefined;
    // The control that had focus inside a frame of the page's own origin as the latest message
    // came, read then, inside an open shadow root too, since the page sees focus inside a frame
    // only as the frame and the frame's document drops its focus to its body once focus leaves.
    let inFrame: Element | null | undefined;
    const insideOf = (frame: Element | null) => {
        const inner = (frame as HTMLIFrameElement | null)?.contentDocument;
        const held = activeIn(inner);
        return held === inner?.body ? undefined : held;
    };
    const wait = () => {
        window.clearTimeout(timer);
        if (shown && !onAction && !hovered && !focused) {
            timer = window.setTimeout(dismiss, TOAST_FOR);
        }
    };
    const dismiss = () => {
        window.clearTimeout(timer);
        // Focus goes back by the rule every piece hands it back by, the toast having had it as it
        // left where focus was in it as it was taken from the page.
        const hadFocus = mayHandBack(element, !element.isConnected && (focused || leftWith));
        shown = 0;
        focused = false;
        leftWith = false;
        onAction = undefined;
        // Focus that was in the toast goes back to the control it came in from, then to where it
        // was as the message came, on to the control inside it where that is a frame of the page's
        // own origin, then to the body of the app's frame or the page's main content. The shown
        // state and the mark on the frame come off first, so the room the sheet keeps under a shown
        // toast is gone and the control focus goes to is not scrolled clear of a toast that is
        // leaving. The buttons stay drawn until after, so no engine moves focus off a hidden button
        // ahead of the handback, and where nothing takes focus, it leaves the toast for the page's
        // body rather than staying on a hidden button, as WebKit and Firefox would leave it.
        element.classList.remove('dk-toast-shown');
        delete element.dataset['shown'];
        delete element.dataset['rows'];
        delete element.dataset['row'];
        // Off the frame the toast marked, and off the one it sits in, which a page that drew the
        // toast shown marked itself.
        delete marked?.dataset['toastRows'];
        delete element.closest<HTMLElement>('.dk-app')?.dataset['toastRows'];
        marked = undefined;
        if (hadFocus) {
            const handed = handBack(cameFrom, arrivedAt, homeOf(element));
            const now = activeOf();
            if (handed && now === arrivedAt && inFrame && !isOff(inFrame))
                (inFrame as HTMLElement).focus();
            else if (holds(element, now)) (now as HTMLElement).blur();
        }
        inFrame = undefined;
        message.textContent = '';
        actionButton.textContent = '';
        actionButton.hidden = true;
        close.hidden = true;
        watch.disconnect();
        window.removeEventListener('resize', remeasure);
        hush(status);
    };
    const show: ShowToast = (words, action) => {
        if (signal.aborted) return () => undefined;
        const active = focusedNow();
        if (!holds(element, active)) {
            arrivedAt = active ?? undefined;
            inFrame = insideOf(active);
        }
        const id = (shown = count += 1);
        message.textContent = words;
        say(status, action ? `${words} ${action.label} is available.` : words, true);
        // Focus on an action that this message does not have moves to the close button.
        if (!action && activeOf() === actionButton) close.focus();
        onAction = action?.onAction;
        actionButton.textContent = action?.label ?? '';
        actionButton.hidden = !action;
        close.hidden = false;
        element.classList.add('dk-toast-shown');
        element.dataset['shown'] = '';
        remeasure();
        watch.observe(element);
        // Added once however many messages are shown, as the DOM ignores the same listener again.
        window.addEventListener('resize', remeasure, { signal });
        // Only where focus was outside the toast as the message came, since focus in it needs no
        // room.
        if (arrivedAt === active) clearOf(element, arrivedAt, inFrame);
        wait();
        return () => {
            if (shown === id) dismiss();
        };
    };
    actionButton.addEventListener(
        'click',
        () => {
            const chosen = onAction;
            dismiss();
            chosen?.();
        },
        { signal }
    );
    close.addEventListener(
        'click',
        () => {
            dismiss();
        },
        { signal }
    );
    element.addEventListener(
        'keydown',
        (event) => {
            if (event.key === 'Escape' && shown) dismiss();
        },
        { signal }
    );
    // A pointer that rests where a toast was keeps holding the next one, until it moves away.
    element.addEventListener(
        'pointerenter',
        () => {
            hovered = true;
            wait();
        },
        { signal }
    );
    element.addEventListener(
        'pointerleave',
        () => {
            hovered = false;
            wait();
        },
        { signal }
    );
    element.addEventListener(
        'focusin',
        ({ relatedTarget }) => {
            // Each entry from outside names the control focus came in from, and one from nowhere
            // names none, so focus then goes back to where it was as the message came. The element
            // that last lost focus stands in only where the related target holds it, through the
            // shadow trees and slots `holds` climbs, since a page that stops a focusout leaves an
            // older one there.
            if (!holds(element, relatedTarget as Node | null)) {
                cameFrom = relatedTarget
                    ? ((holds(relatedTarget as Element, lost ?? null)
                          ? lost
                          : relatedTarget) as Element)
                    : undefined;
            }
            focused = true;
            wait();
        },
        { signal }
    );
    element.addEventListener(
        'focusout',
        () => {
            // Read a microtask later, where focus has settled, so focus that leaves and comes back
            // in one task stays in. Chromium fires focusout as a toast with focus in it is taken
            // from the page, and WebKit and Firefox fire none, so focus that left with the toast
            // is kept apart for the handback.
            queueMicrotask(() => {
                if (!element.isConnected) leftWith ||= focused;
                focused = element.isConnected && holds(element, activeOf());
                wait();
            });
        },
        { signal }
    );
    // Focus a visitor moves outside the toast, or a press while it is off the page, is theirs, so a
    // toast held off the page forgets it had focus and hands nothing back over their move.
    const forget = ({ type, target }: Event) => {
        if (type === 'focusin' ? !holds(element, target as Node) : !element.isConnected)
            focused = leftWith = false;
    };
    for (const type of ['focusin', 'pointerdown'])
        document.addEventListener(type, forget, { capture: true, signal });
    document.addEventListener(
        'focusout',
        (event) => {
            lost = event.composedPath()[0] as Element;
        },
        { capture: true, signal }
    );
    // Run once as the signal aborts, since a toast returns what shows a message and no detach.
    down.add(() => {
        dismiss();
        releaseLine(status);
        // A tabindex the page has set since is the page's.
        for (const button of given)
            if (button.getAttribute('tabindex') === '0') button.removeAttribute('tabindex');
    });
    return keep(attachedToasts, element, down, show);
};
