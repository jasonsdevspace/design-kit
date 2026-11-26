import { isOff } from './find.js';
import { deepActive, framesOf, handBack, holds, homeOf, mayHandBack, placeNow } from './focus.js';
import { claimLine, hush, releaseLine, say } from './line.js';
import { type AttachOptions, join, keep, type Kept, teardown } from './teardown.js';

/*
 * The toast, which shows a message with one action or none, keeps room for itself in an app's
 * frame, and hands focus back as it leaves. No entry of the package names this module, so a page
 * imports it only through `./controls`.
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
        element.ownerDocument.defaultView?.scrollBy(
            0,
            (dock?.getBoundingClientRect().top ?? 0) - before
        );
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
const clearOf = (element: HTMLElement, control: Element, via: readonly Element[]) => {
    const card = element.getBoundingClientRect();
    const rise = Number(
        /^\S+ (-?[\d.]+)px/.exec(String(getComputedStyle(element).translate))?.[1] ?? 0
    );
    let { top, right, bottom, left, height } = control.getBoundingClientRect();
    // Placed out through each frame it sits inside, the innermost first, into the toast's view.
    let inner = control.ownerDocument;
    for (const frame of via as HTMLElement[]) {
        const place = frame.getBoundingClientRect();
        const edges = (frame.ownerDocument.defaultView ?? window).getComputedStyle(frame);
        const across = place.width / frame.offsetWidth;
        const down = place.height / frame.offsetHeight;
        const x = place.left + (frame.clientLeft + parseFloat(edges.paddingLeft)) * across;
        const y = place.top + (frame.clientTop + parseFloat(edges.paddingTop)) * down;
        const view = inner.scrollingElement ?? inner.documentElement;
        [top, right, bottom, left, height] = [
            y + Math.max(top, 0) * down,
            x + Math.min(right, view.clientWidth) * across,
            y + Math.min(bottom, view.clientHeight) * down,
            x + Math.max(left, 0) * across,
            height * down,
        ];
        inner = frame.ownerDocument;
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
 * measured where each frame around it places it, past the frame's border and padding, scaled across
 * and down as the frame is drawn and cut to what the frame shows inside its scrollbars, so a tall
 * frame does not hide it. A frame of another origin, or one where only its body has focus, is
 * measured whole.
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
 * F8 with no modifier, and not held, moves focus to a shown action from anywhere on the page, as
 * record 29 has it, and pressed with focus in the toast sends it back by the same list, the toast
 * still shown. A press the page has handled, one that converts text in an input method, one with no
 * action shown, and one with focus in another toast, which hears it itself, are left alone, and the
 * key keeps its default wherever no focus moved. The action carries `aria-keyshortcuts` while it is
 * shown, and the document hears the key only while a message with an action is shown. A toast the
 * page attaches inside a frame of its own origin hears the key in that frame's document, and
 * listens to that frame's window for its size and scrolls it, so F8 and the handback work there as
 * they do on the page. A toast stays in the document it was attached in, so a page that moves it
 * into another takes it down and attaches it again.
 *
 * Focus leaves the toast where nothing on the list takes it, so it falls to the page's body rather
 * than staying on the toast's hidden button. The toast takes off its shown state before it hands
 * focus back, so the room the sheet keeps under a shown toast does not scroll the control focus
 * goes to. Where a page's own listener moves focus elsewhere as the toast hands it back, the toast
 * goes no further down the list and that focus stays. Focus is read from the page down, into each
 * frame of the page's own origin that has it, so the control that had focus inside a frame as the
 * latest message came, inside a frame within it too, is where focus goes back, and focus that comes
 * into the toast from inside a frame counts as coming from nowhere. Focus goes to each frame around
 * that control instead, the innermost first, where it is gone, marked off or on a page the frame
 * has since replaced, and to the frame itself for a frame of another origin. Firefox does not focus
 * a frame of another origin while a key is being pressed, so a dismiss by keyboard there goes on
 * down the list.
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
    // The document the toast sits in, a frame's where the page attaches it inside one, where the
    // keys are heard. One with no window, as a template's copy or a parsed document is before the
    // page puts it in, counts as the page's, which takes the toast in.
    const doc = element.ownerDocument.defaultView ? element.ownerDocument : document;
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
    // The frames that control sits inside, from its own document out to the toast's, the innermost
    // first, read as the message came, since a frame that loads its page again leaves the control's
    // old document with no window to find them by.
    let via: Element[] = [];
    const wait = () => {
        window.clearTimeout(timer);
        if (shown && !onAction && !hovered && !focused) {
            timer = window.setTimeout(dismiss, TOAST_FOR);
        }
    };
    // Focus goes back to the control it came in from, then to where it was as the message came,
    // passed over inside a frame where it is marked off, then to each frame around it, the
    // innermost first, then to the body of the app's frame or the page's main content, as the toast
    // leaves or on F8 in it.
    const giveBack = () => {
        handBack(cameFrom, via[0] && isOff(arrivedAt) ? null : arrivedAt, ...via, homeOf(element));
    };
    // F8 with no modifier, and not held, moves focus to a shown action from anywhere on the page,
    // and from in the toast back by the walk a dismiss hands it back by, with the toast still
    // shown. The document hears it only while a message with an action is shown, so a toast hears
    // no key while it has nothing to offer and keeps nothing alive once it hides. A press a page
    // has handled, one that converts text in an input method, which Safari marks by key code 229,
    // one where focus is in another toast, which hears it itself, and one where focus stays put
    // keep their default.
    const onKey = (event: KeyboardEvent) => {
        if (
            event.key !== 'F8' ||
            event.repeat ||
            event.shiftKey ||
            event.ctrlKey ||
            event.altKey ||
            event.metaKey ||
            event.isComposing ||
            event.keyCode === 229 ||
            event.defaultPrevented ||
            !element.isConnected
        )
            return;
        const before = deepActive();
        if (holds(element, before)) giveBack();
        else if (before?.closest('.dk-toast')) return;
        else actionButton.focus();
        if (deepActive() !== before) event.preventDefault();
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
        // Focus that was in the toast goes back by its walk. The shown state and the mark on the
        // frame come off first, so the room the sheet keeps under a shown toast is gone and the
        // control focus goes to is not scrolled clear of a toast that is leaving. The buttons stay drawn until after, so no engine moves focus off a hidden button
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
            giveBack();
            const now = deepActive();
            if (holds(element, now)) (now as HTMLElement).blur();
        }
        via = [];
        message.textContent = '';
        actionButton.textContent = '';
        actionButton.hidden = true;
        actionButton.removeAttribute('aria-keyshortcuts');
        doc.removeEventListener('keydown', onKey);
        close.hidden = true;
        watch.disconnect();
        doc.defaultView?.removeEventListener('resize', remeasure);
        hush(status);
    };
    const show: ShowToast = (words, action) => {
        if (signal.aborted) return () => undefined;
        // Read as the toast's document sees it, so a blank body in another frame is that frame.
        const active = placeNow(doc);
        let reached = false;
        if (!holds(element, active))
            [arrivedAt, via, reached] = [active ?? undefined, ...framesOf(active, doc)];
        const id = (shown = count += 1);
        message.textContent = words;
        say(status, action ? `${words} ${action.label} is available.` : words, true);
        // Focus on an action that this message does not have moves to the close button.
        if (!action && deepActive() === actionButton) close.focus();
        onAction = action?.onAction;
        actionButton.textContent = action?.label ?? '';
        actionButton.hidden = !action;
        // Added once however many messages with an action are shown, as the DOM ignores the same
        // listener again, and taken off by a message with none.
        if (action) {
            actionButton.setAttribute('aria-keyshortcuts', 'F8');
            doc.addEventListener('keydown', onKey, { signal });
        } else {
            actionButton.removeAttribute('aria-keyshortcuts');
            doc.removeEventListener('keydown', onKey);
        }
        close.hidden = false;
        element.classList.add('dk-toast-shown');
        element.dataset['shown'] = '';
        remeasure();
        watch.observe(element);
        // Added once however many messages are shown, as the DOM ignores the same listener again.
        doc.defaultView?.addEventListener('resize', remeasure, { signal });
        // Only where focus was outside the toast as the message came, since focus in it needs no
        // room, and in the toast's document or a frame inside it, since a control on the page or
        // in another frame is measured in a view the toast is not drawn in.
        if (reached && arrivedAt) clearOf(element, arrivedAt, via);
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
                focused = element.isConnected && holds(element, deepActive());
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
        doc.addEventListener(type, forget, { capture: true, signal });
    doc.addEventListener(
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
