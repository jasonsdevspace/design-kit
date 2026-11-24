import { rootOf } from './find.js';
import { handed } from './state.js';
import type { AttachOptions } from './teardown.js';

/*
 * How the controls move focus and hand it back: what has focus, through shadow roots, the walk that
 * focuses the first place that takes it, and the one rule by which a piece closing or leaving hands
 * focus back. No entry of the package exports this module, so a page never reaches it.
 */

/** What has focus, or null where nothing does and the page's body stands in for it. */
export const focusedNow = (): Element | null => {
    const active = activeOf();
    return active === document.body ? null : active;
};

/**
 * Whether a node is the place or inside it, through the shadow trees it holds and the slots a node
 * is drawn in, so a control slotted into a piece drawn inside a shadow root counts as in it.
 */
export const holds = (place: Element, node: Node | null): boolean => {
    let inside = node;
    while (inside && inside !== place)
        inside =
            (inside as Partial<Element>).assignedSlot ??
            inside.parentNode ??
            (inside as Partial<ShadowRoot>).host ??
            null;
    return !!inside;
};

/** A place focus may be handed to, or a function that gives more of them when it is reached. */
type Place = Element | null | undefined | (() => readonly Element[]);

/**
 * Tries one place of a walk: true where it took focus, false where a page's own listener moved
 * focus elsewhere as it was tried, which ends the walk, and nothing where the place is no element
 * that takes focus or refused it, so the walk goes on.
 */
const tryFocus = (place: Element | null | undefined): boolean | undefined => {
    if (
        !(place instanceof HTMLElement || place instanceof SVGElement) ||
        !place.isConnected ||
        place === document.body
    )
        return undefined;
    const before = focusedNow();
    place.focus({ preventScroll: place.matches('.dk-app-body') });
    const now = focusedNow();
    if (holds(place, now) && (now !== before || place === before)) return true;
    return now && now !== before ? false : undefined;
};

/**
 * Focuses the first of the elements given that takes focus, an HTML control or an SVG one such as a
 * link in an inline chart, so focus never falls to nowhere while a place for it is named. One gone
 * from the page is skipped, and one that is hidden, inert or disabled is passed over as the browser
 * refuses it focus. A control marked off is left out only where a caller checks for it, as a panel
 * does for its buttons and a focus request for its target, so the toast and the dialog hand focus
 * to one. Focus that moves onto a place or inside it, in a shadow tree it holds or on a control
 * slotted into it too, as a host that delegates focus or a widget that forwards it, counts as
 * taken, as does a place that has focus already, while a place that refuses focus is passed over
 * though focus is inside it. Where a page's own listener moves focus elsewhere as one is tried, the
 * walk stops and that focus stays. A function among the places gives more of them, and is called
 * only once every place before it has refused focus, so places that cost a search of the page are
 * looked for only where they are needed, in the same walk.
 */
export const focusFirst = (...places: readonly Place[]): boolean => {
    for (const given of places)
        // An element is never called, though an object or an embed is a function to some
        // browsers.
        for (const place of typeof given === 'function' && !(given instanceof Element)
            ? given()
            : [given]) {
            const took = tryFocus(place);
            if (took !== undefined) return took;
        }
    return false;
};

/**
 * Whether a piece closing or leaving may hand focus back: where focus is in it, inside a shadow
 * tree within it or on a control slotted into it too, or where focus is on the body or nowhere and
 * the piece had focus as it left, so focus a visitor or the page has put anywhere else stays. The
 * toast, the dialog and the panels hand focus back by this one rule. The stepper does not use it,
 * and hands focus back only where focus is on one of the buttons it hides.
 */
export const mayHandBack = (piece: Element, had: boolean): boolean => {
    const active = focusedNow();
    return active ? holds(piece, active) : had;
};

/**
 * Hands focus back to the first of the places given that takes it, as `focusFirst` does, and keeps
 * the place it focused, so a request asked before it finds that focus free and not the visitor's.
 * A walk that focuses nothing keeps nothing, so focus a page moved during it stays the page's.
 * Returns whether it focused a place.
 */
export const handBack = (...places: readonly Place[]): boolean => {
    if (!focusFirst(...places)) return false;
    handed.to = activeOf();
    handed.at = performance.now();
    return true;
};

/** Where focus is asked to go: an element, an element's id, one found as focus moves, or nothing. */
export type FocusTarget = Element | string | (() => Element | null) | null | undefined;

/** Where focus goes when nothing nearer takes it, the app frame's body or the main content. */
export const homeOf = (element: Element): Element | null =>
    element.closest('.dk-app')?.querySelector('.dk-app-body') ??
    rootOf(element).querySelector('main') ??
    document.querySelector('main');

/**
 * How focus is moved after a change, and the signal that calls the request off. A request asked as
 * its component unmounts is meant to land, as record 20 has it, so it is given no signal that the
 * same unmount aborts.
 */
export type MoveFocusOptions = AttachOptions & {
    /** Where focus goes, in order, when the target is gone, hidden, inert, disabled or off. */
    readonly fallbacks?: readonly FocusTarget[] | undefined;
    /**
     * Where focus was when the change was asked for, for a request made after the change began,
     * such as from an effect, so focus a view placed as it drew is not taken for the visitor's.
     */
    readonly from?: Element | null | undefined;
};

/**
 * What has focus, followed into each shadow root that holds it, as a request reads where focus was
 * when it was asked for.
 */
export const activeOf = (): Element | null => activeIn(document) ?? null;

/** What has focus in the document or shadow root given, followed into each shadow root. */
export const activeIn = (
    root: DocumentOrShadowRoot | null | undefined
): Element | null | undefined => {
    let active = root?.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active;
};
