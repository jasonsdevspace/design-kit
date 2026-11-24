import { isElement, rootOf } from './find.js';
import { handed } from './state.js';
import type { AttachOptions } from './teardown.js';

/*
 * How the controls move focus and hand it back: what has focus, read from the page down through
 * shadow roots and frames of the page's own origin, the walk that
 * focuses the first place that takes it, and the one rule by which a piece closing or leaving hands
 * focus back. No entry of the package names this module, so a page imports it only through
 * `./controls`.
 */

/**
 * Whether an element is a body no one can type in, which stands in where nothing has focus, unlike
 * the body of an editor, editable or in design mode.
 */
export const isBlank = (element: Element): boolean =>
    element.localName === 'body' &&
    !(element as HTMLElement).isContentEditable &&
    element.ownerDocument.designMode !== 'on';

/**
 * What has focus, read as `activeOf` reads it, as a piece in the document given sees it, the page's
 * where none is given. A blank body in that document is nothing, so null, while one in any other
 * document is the frame that holds it, or that body where no frame does, so focus a visitor put in
 * another document counts as elsewhere. An editor's body counts as focus wherever it is. The one
 * place that decides what a body means.
 */
export const focusedNow = (doc: Document = document): Element | null => {
    const active = activeOf();
    if (!active || !isBlank(active)) return active;
    return active.ownerDocument === doc
        ? null
        : (active.ownerDocument.defaultView?.frameElement ?? active);
};

/**
 * Whether a node is the place or inside it, through the shadow trees it holds, the slots a node is
 * drawn in and the frames of the page's own origin it holds, so a control slotted into a piece
 * drawn inside a shadow root counts as in it, and so does focus inside a frame the piece holds.
 */
export const holds = (place: Element, node: Node | null): boolean => {
    let inside = node;
    while (inside && inside !== place)
        inside =
            (inside as Partial<Element>).assignedSlot ??
            inside.parentNode ??
            (inside as Partial<ShadowRoot>).host ??
            (inside as Partial<Document>).defaultView?.frameElement ??
            null;
    return !!inside;
};

/** A place focus may be handed to, or a function that gives more of them when it is reached. */
type Place = Element | null | undefined | (() => readonly Element[]);

/**
 * Tries one place of a walk: true where it took focus, false where a page's own listener moved
 * focus elsewhere as it was tried, which ends the walk, and nothing where the place is no element
 * that takes focus or refused it, so the walk goes on. An element that can be focused is tried,
 * told by its own `focus` rather than by a window's classes, so one of a frame's and one the page
 * made and moved into a frame both count, and one whose document has lost its window, as a frame's
 * that loaded its page again, is passed over. A frame that takes focus with nothing focused inside
 * it counts as taken.
 */
const tryFocus = (place: Element | null | undefined): boolean | undefined => {
    if (
        !place?.ownerDocument.defaultView ||
        typeof (place as Partial<HTMLElement>).focus !== 'function' ||
        !place.isConnected ||
        isBlank(place)
    )
        return undefined;
    const before = activeOf();
    (place as HTMLElement).focus({ preventScroll: place.matches('.dk-app-body') });
    const now = activeOf();
    if (holds(place, now) && (now !== before || place === before)) return true;
    return now !== before && focusedNow(place.ownerDocument) ? false : undefined;
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
        for (const place of typeof given === 'function' && !isElement(given) ? given() : [given]) {
            const took = tryFocus(place);
            if (took !== undefined) return took;
        }
    return false;
};

/**
 * Whether a piece closing or leaving may hand focus back: where focus is in it, inside a shadow
 * tree within it or on a control slotted into it too, or where focus is on the body or nowhere and
 * the piece had focus as it left, so focus a visitor or the page has put anywhere else stays. Focus
 * is read from the page down, so focus inside a frame counts as in a piece in that frame and as
 * nowhere else. The toast, the dialog and the panels hand focus back by this one rule. The stepper
 * does not use it, and hands focus back only where focus is on one of the buttons it hides.
 */
export const mayHandBack = (piece: Element, had: boolean): boolean => {
    const active = focusedNow(piece.ownerDocument);
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

/**
 * Where focus goes when nothing nearer takes it, the app frame's body or the main content, looked
 * for in the shadow root the element sits in, then in the document it sits in, the page's or a
 * frame's.
 */
export const homeOf = (element: Element): Element | null =>
    element.closest('.dk-app')?.querySelector('.dk-app-body') ??
    rootOf(element).querySelector('main') ??
    element.ownerDocument.querySelector('main');

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
 * What has focus, read from the page down: followed into each shadow root that holds it, and into
 * each frame of the page's own origin that has it, an object showing a document among them, to the
 * control focused inside the frame or to the frame's body where nothing is. A frame of another
 * origin shows nothing inside, so focus there reads as the frame. A frame's own record is read only
 * while focus is in the frame, so a control it last focused is never taken for focus once a visitor
 * has moved on. A request reads where focus was when it was asked for by it.
 */
export const activeOf = (): Element | null => {
    let active = document.activeElement;
    for (
        let next;
        (next =
            active?.shadowRoot?.activeElement ??
            (active as Partial<HTMLIFrameElement> | null)?.contentDocument?.activeElement);
    )
        active = next;
    return active;
};
