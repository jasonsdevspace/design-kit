import { byIdOutward, isOff } from './find.js';
import {
    deepActive,
    focusFirst,
    type FocusTarget,
    homeOf,
    isBlank,
    type MoveFocusOptions,
    seen,
    seenNow,
} from './focus.js';
import { handed, inputs, press, restoring, sightChanges } from './state.js';
import { teardown } from './teardown.js';

/*
 * A page's requests to move focus once a change is drawn, `moveFocus` and `focusOnArrival`, which
 * land in a frame where focus is still free, and drop where the page went out of sight. The form
 * refuses through `moveFocus` too. No entry of the package names this module, so a page imports it
 * only through `./controls`.
 */

/**
 * A place to focus, or nothing where it is an id with no element yet or a control marked off. An id
 * is looked for in the root of the element given, as where focus was when it was asked for, then in
 * each root around it out to that element's document.
 */
const placeOf = (target: FocusTarget, near?: Node | null): Element | null => {
    const place =
        typeof target === 'string'
            ? byIdOutward(near, target)
            : typeof target === 'function'
              ? target()
              : (target ?? null);
    return place && !isOff(place) ? place : null;
};

/**
 * How late a frame may come before its request is dropped, in milliseconds, a backstop for a frame
 * held back with the page in sight, as a browser holds a frame out of view with no event. It is
 * far past any render, since a render held past it on a page in sight would lose its request and
 * leave focus where a removed control left it, on the page's body.
 */
const STALE = 10_000;

/**
 * Where focus was as a request is asked, both taken from one read at that moment: the element as
 * the deep reader gives it, or the one a page gives as `from`, and the page's view of it through
 * `seen`, which is the frame where focus was inside one. A request compares the element in its own
 * document while that document has a window, else the page's view in the page, and looks an id and
 * its home up from the page's view.
 */
export type FocusWas = { readonly from: Element | null; readonly page: Element | null };

/** Where focus is as a request is asked, or where the page says it was, as a request keeps it. */
export const focusWas = (given?: Element | null): FocusWas => {
    const from = given === undefined ? deepActive() : given;
    return { from, page: seen(from, document) };
};

/**
 * When a request was asked, how many times the page had gone out of sight or come back by then, or
 * NaN, which matches no count, where the page was out of sight as it was asked, and where focus was.
 */
type Asked = FocusWas & { readonly at: number; readonly sight: number };

/**
 * The moment a request is asked, from where focus is or from the place a page gives. One asked out
 * of sight is dropped whichever comes first as the page comes back, its frame or the event that
 * counts the return.
 */
const askedNow = (given: Element | null | undefined): Asked => ({
    ...focusWas(given),
    at: performance.now(),
    sight: document.hidden ? NaN : sightChanges,
});

/** Whether a request may still land, in sight and unchanged since it was asked, and in time. */
const live = (asked: Asked) =>
    !document.hidden && sightChanges === asked.sight && performance.now() - asked.at <= STALE;

/**
 * Whether focus, as the request's view gives it, is still free for the request: nowhere, where it
 * was when the request was asked, or where the kit has handed it back since. A body no one can type
 * in that the view reads as itself, which is only one around the request's document, the page's
 * around a frame, counts as free as the page's own body does, since Chromium drops focus there from
 * a frame the page hides while a request asked inside it waits.
 */
const isFree = (
    now: Element | null,
    view: (element: Element | null) => Element | null,
    was: Element | null,
    at: number
): boolean =>
    !now || isBlank(now) || now === view(was) || (now === view(handed.to) && handed.at >= at);

/**
 * What a request compares focus with, in the document it sits in, as a piece in that document sees
 * focus: where focus was, while its document is still the one its window shows, else the page's
 * view of it, compared in the page's document, for a frame that left the page or loaded another
 * page since. The window is asked for its document, since Firefox still gives the window of a
 * document its frame has left.
 */
const comparedOf = ({ from, page }: FocusWas): Element | null =>
    from && from.ownerDocument.defaultView?.document === from.ownerDocument ? from : page;

/**
 * Focuses a request's target or a fallback, where focus is still where it was, or where the kit has
 * handed it back since the request was asked, and the request is live.
 */
const land = (target: FocusTarget, fallbacks: readonly FocusTarget[] | undefined, asked: Asked) => {
    if (!live(asked)) return;
    const { from, page } = asked;
    const was = comparedOf(asked);
    const doc = was?.ownerDocument ?? document;
    const now = seenNow(doc);
    const view = (element: Element | null) => seen(element, doc);
    // A dialog taken from the page with no takedown hands nothing back, so its place goes.
    for (const [dialog] of restoring) if (!dialog.isConnected) restoring.delete(dialog);
    // Focus on what had it as a dialog opened is free while that dialog is closed and its close
    // not yet handled, since the browser put it there as the dialog closed. A request that lands
    // takes that place from the dialog, so its close event leaves focus where the request put it.
    const restored = [...restoring].filter(([dialog, to]) => view(to) === now && !dialog.open);
    if (!isFree(now, view, was, asked.at) && !restored[0]) return;
    const near = page ?? from;
    const place = placeOf(target, near);
    if (
        focusFirst(
            place,
            ...(fallbacks ?? []).map((fallback) => placeOf(fallback, near)),
            homeOf(place ?? near ?? document.body)
        )
    )
        for (const [dialog] of restored) restoring.delete(dialog);
};

/**
 * Moves focus to a control once a change is drawn, such as the field a refusal points at or the
 * next player's entry, and returns what calls it off before it lands, as its `signal` does a
 * microtask after it aborts, which is still before the frame the request waits for. It waits for
 * the next frame, so a page that draws the control in answer to the same press or key has drawn it,
 * and finds an id then. A change React draws later, in a transition or behind a suspense, asks from
 * an effect once it is drawn. Where the target is gone from the page, hidden, inert, disabled or
 * off, focus goes to the first fallback that takes it, and then to the app frame's body or the
 * page's main content, by the walk a closing panel hands focus back by, so it does not fall to the
 * page. Focus a visitor has moved since the request is left where they put it: focus is free only
 * while it is where it was when asked, inside a frame of the page's own origin too, on the page's
 * body, on the page's body around a frame the page hides while a request asked inside it waits, or
 * where the kit has handed it back since, as a toast, a dialog or a panel does as it closes and a stepper as it is taken down, or on
 * what the browser hands it to as a dialog closes, until the dialog's close is handled. A request
 * made while the page is out of sight, or before it goes, is dropped, so focus does not jump when
 * the visitor comes back, and so is one whose frame comes more than ten seconds late, while one a
 * long render holds on a page in sight for less still lands. Each request is new, so a control
 * asked for twice is focused twice.
 */
export const moveFocus = (target: FocusTarget, options: MoveFocusOptions = {}): (() => void) => {
    // Aborting calls off a request that has not landed, as the function it returns does, and one
    // already landed is left where it put focus. A signal already aborted asks for nothing.
    if (options.signal?.aborted) return () => undefined;
    const down = teardown(options.signal);
    const asked = askedNow(options.from);
    const frame = window.requestAnimationFrame(() => {
        // Stopped as it lands, so a signal the page keeps for longer holds nothing of the request.
        down.stop();
        land(target, options.fallbacks, asked);
    });
    down.add(() => {
        window.cancelAnimationFrame(frame);
    });
    return down.stop;
};

/** How long a press may wait for the view it brings, in milliseconds, as one a slow load brings. */
const PRESS_LIVES = 5000;

/** How a view asks to take focus as it arrives. */
export type ArrivalOptions = MoveFocusOptions & {
    /**
     * Whether the view was drawn before and changed on a press of the page's, as a round that moves
     * on, so it takes focus whatever the visitor's last input was, and spends the press.
     */
    readonly changed?: boolean | undefined;
};

/** A view asking to take focus for a press. */
type Arrival = {
    readonly heading: FocusTarget;
    readonly fallbacks: readonly FocusTarget[] | undefined;
    /**
     * When the view asked and where focus was, so one asked before the page went out of sight
     * lands nothing.
     */
    readonly asked: Asked;
    /** Calls the view's request off, and lets go of the signal it was given. */
    readonly stop: () => void;
};
/** The views asking for the press now being answered, landed together in one frame. */
let arriving: {
    readonly views: Set<Arrival>;
    readonly frame: number;
    readonly at: number;
    readonly press: number | null;
} | null = null;

/**
 * Moves focus to a view's heading as it is first drawn, as `moveFocus` does, where the visitor's
 * last input, on the page or inside a frame of its own origin, was a press on a button or a link,
 * or a submit, in the last five seconds that no view has taken focus for, and returns what calls it
 * off. A view drawn as the page first draws takes nothing, nor one drawn after a key that moves or
 * types, such as Tab or an arrow along a row of tabs, after a press on nothing, on a control that
 * is off or in a row of tabs, or long after the press, as one a poll brings. Views first drawn for
 * the same press land together in one frame, and the one first in the page takes focus, so a view's
 * title is heard before a section of it. A request called off before it lands hands its press back
 * where no input has come since, so a view asked for again, as React asks again in development,
 * takes focus. A view already drawn that changed on a press asks with `changed`, so it takes focus
 * whatever the last input was, lands with the views first drawn for the same press, and spends the
 * press. Its `signal` calls the request off as the function it returns does, a microtask after it
 * aborts, as `moveFocus` has it, and a signal already aborted asks for nothing and leaves the press
 * for another view. A view is dropped as a request to `moveFocus` is, and one asked once the page
 * is back in sight lands without the views asked before it went.
 */
export const focusOnArrival = (
    heading: FocusTarget,
    options: ArrivalOptions = {}
): (() => void) => {
    // Read before the press, so a signal already aborted spends none.
    if (options.signal?.aborted) return () => undefined;
    if (!arriving) {
        const fresh = press.at !== null && performance.now() - press.at <= PRESS_LIVES;
        if (!fresh && !options.changed) return () => undefined;
        const pressed = press.at;
        press.at = null;
        const views = new Set<Arrival>();
        const frame = window.requestAnimationFrame(() => {
            arriving = null;
            // Stopped as they land, so a signal the page keeps for longer holds nothing of a view.
            const asked = [...views];
            for (const view of asked) view.stop();
            // A view asked since the page went out of sight or came back lands without the others.
            const asking = asked.filter((view) => live(view.asked));
            const places = asking.flatMap((view) => {
                const place = placeOf(view.heading, view.asked.page ?? view.asked.from);
                return place?.isConnected ? [{ view, place }] : [];
            });
            places.sort((one, other) =>
                one.place.compareDocumentPosition(other.place) & Node.DOCUMENT_POSITION_PRECEDING
                    ? 1
                    : -1
            );
            const [first] = places;
            if (first) land(first.place, first.view.fallbacks, first.view.asked);
            else {
                // No heading is there to take focus, so the first view asked goes by its fallbacks.
                const [view] = asking;
                if (view) land(view.heading, view.fallbacks, view.asked);
            }
        });
        arriving = { views, frame, at: inputs, press: pressed };
    }
    const batch = arriving;
    const down = teardown(options.signal);
    const view: Arrival = {
        heading,
        fallbacks: options.fallbacks,
        asked: askedNow(options.from),
        stop: down.stop,
    };
    batch.views.add(view);
    down.add(() => {
        batch.views.delete(view);
        if (batch.views.size > 0 || arriving !== batch) return;
        window.cancelAnimationFrame(batch.frame);
        arriving = null;
        if (inputs === batch.at) press.at = batch.press;
    });
    return down.stop;
};
