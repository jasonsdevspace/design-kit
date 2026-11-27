import { isElement, rootOf } from './find.js';
import { crossed, deepActive, docIn, handed } from './state.js';
import type { AttachOptions } from './teardown.js';

export { deepActive };

/*
 * How the controls move focus and hand it back: the one view of focus read from the page down
 * through shadow roots and frames of the page's own origin, by the reader the state module holds
 * and this module gives again, the walk that focuses the first place that takes it, and the one
 * rule by which a piece closing or leaving hands focus back. No entry of the package names this
 * module, so a page imports it only through `./controls`.
 */

/**
 * Whether an element is a body no one can type in, which stands in where nothing has focus, unlike
 * the body of an editor, editable or in design mode.
 */
export const isBlank = (element: Element): boolean =>
    element.localName === 'body' &&
    !(element as HTMLElement).isContentEditable &&
    element.ownerDocument.designMode !== 'on';

/** Whether a document is the one given or sits in a frame inside it, at any depth. */
const within = (inner: Document, outer: Document): boolean => {
    for (let at: Document | undefined = inner; at; at = at.defaultView?.frameElement?.ownerDocument)
        if (at === outer) return true;
    return false;
};

/**
 * Focus on an element as a piece in the document given sees it, the page's where none is given: the
 * one view every comparison and every judgment of nowhere reads, both sides through the same
 * document. A blank body of that document is nothing, so null. An element of that document or of
 * one around it is itself, while one of any other frame, one the document holds or one beside it,
 * reads as the frame that holds it at the document's level, so focus inside a nested frame or a
 * frame beside it counts as on that frame, and a blank body around the document as elsewhere.
 */
export const seen = (element: Element | null, doc: Document = document): Element | null => {
    if (!element || (element.ownerDocument === doc && isBlank(element))) return null;
    let at = element;
    while (!within(doc, at.ownerDocument)) {
        const frame = at.ownerDocument.defaultView?.frameElement ?? frameAcross(at);
        if (!frame) break;
        at = frame;
    }
    return at;
};

/**
 * The frame that holds an element's window through a frame of another origin, whose element the
 * window cannot name: found by climbing the element's windows to the first whose parent's document
 * can be read, then the frame there that shows it, as the reader kept it as it went through, else
 * by a search of that document's frames, in its open shadow roots too.
 */
const frameAcross = (element: Element): Element | null => {
    let win: Window | null = element.ownerDocument.defaultView;
    while (win && win.parent !== win && !docIn(win.parent)) win = win.parent;
    const parent = win && win.parent !== win ? docIn(win.parent) : null;
    if (!win || !parent) return null;
    const kept = crossed.get(win);
    if (kept?.isConnected && (kept as Partial<HTMLIFrameElement>).contentWindow === win)
        return kept;
    const search = (root: Document | ShadowRoot): Element | null => {
        for (const frame of root.querySelectorAll('iframe, frame, object'))
            if ((frame as Partial<HTMLIFrameElement>).contentWindow === win) return frame;
        for (const host of root.querySelectorAll('*')) {
            const inner = host.shadowRoot && search(host.shadowRoot);
            if (inner) return inner;
        }
        return null;
    };
    return search(parent);
};

/**
 * What has focus as a piece in the document given sees it, read from the page down, and into each
 * closed shadow root around the node given, which a piece holds.
 */
export const seenNow = (doc?: Document, near?: Node | null): Element | null =>
    seen(deepActive(near), doc);

/**
 * The document a piece reads focus in: the one its element sits in, or the page's where that one
 * has no window, as a template's copy has before the page takes it in.
 */
export const docOf = (element: Element): Document =>
    element.ownerDocument.defaultView ? element.ownerDocument : document;

/** Whether focus is on the element given, as a piece in the element's document sees it. */
export const isFocused = (element: Element): boolean => {
    const doc = docOf(element);
    return seenNow(doc, element) === seen(element, doc);
};

/**
 * What a piece in the document given keeps as a place to hand focus back to: the element that has
 * focus, read from the page down, kept as it is so a control inside a nested frame is reached, but
 * a blank body as the piece sees it, so one of another frame is kept as that frame.
 */
export const placeNow = (doc: Document, near?: Node | null): Element | null => {
    const raw = deepActive(near);
    return raw && isBlank(raw) ? seen(raw, doc) : raw;
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

/**
 * A place focus may be handed to, or a function that gives more of them when it is reached, one at a
 * time where the walk that finds them is long.
 */
type Place = Element | null | undefined | (() => Iterable<Element>);

/** The place the last walk focused, so a handback keeps it as a piece around it reads it. */
let taken: Element | null = null;

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
    const before = deepActive(place);
    (place as HTMLElement).focus({ preventScroll: place.matches('.dk-app-body') });
    const now = deepActive(place);
    const at = (element: Element | null) => seen(element, place.ownerDocument);
    if (holds(place, now) && (at(now) !== at(before) || place === at(before))) {
        taken = place;
        return true;
    }
    // Focus that fell to a blank body, the page's or a frame's, is no move of the page's.
    return now && now !== before && !isBlank(now) ? false : undefined;
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
 * is read through `seen` for the piece's own document, so focus inside a frame counts as in a piece
 * in that frame or one that holds the frame, a blank body of the piece's document as nowhere, and
 * any other as elsewhere. The toast, the dialog and the panels hand focus back by this one rule.
 * The stepper does not use it, and hands focus back only where focus is on one of the buttons it
 * hides.
 */
export const mayHandBack = (piece: Element, had: boolean): boolean => {
    const at = seenNow(piece.ownerDocument, piece);
    return at ? holds(piece, at) : had;
};

/**
 * Hands focus back to the first of the places given that takes it, as `focusFirst` does, and keeps
 * the place it focused, so a request asked before it finds that focus free and not the visitor's.
 * A walk that focuses nothing keeps nothing, so focus a page moved during it stays the page's.
 * Returns whether it focused a place.
 */
export const handBack = (...places: readonly Place[]): boolean => {
    if (!focusFirst(...places)) return false;
    handed.to = deepActive(taken);
    handed.at = performance.now();
    return true;
};

/** Where focus is asked to go: an element, an element's id, one found as focus moves, or nothing. */
export type FocusTarget = Element | string | (() => Element | null) | null | undefined;

/**
 * The frames a control sits inside, from its own document out to the one given, the innermost
 * first, read through each document's window while it has one, and whether that walk reached the
 * document given, which it does not for a control on the page or in a frame beside that document.
 * Given no document, it walks out as far as each window's frame can be read.
 */
export const framesOf = (control: Element | null, doc: Document | null): [Element[], boolean] => {
    const via: Element[] = [];
    let at = control?.ownerDocument;
    while (at && at !== doc) {
        const frame = at.defaultView?.frameElement;
        if (!frame) break;
        via.push(frame);
        at = frame.ownerDocument;
    }
    return [via, at === doc];
};

/**
 * Where focus goes when nothing nearer takes it, as every place in order, so one that refuses
 * focus, as a main with no tabindex does, passes to the next: from the element out through the
 * page as it is drawn, through the slot an element is drawn in and the host of each shadow root,
 * the body of each app frame it is in and each main content it is in, and as the walk leaves a
 * root, that root's main content. So a widget's own main content comes before the app frame around
 * the widget, a piece inside a widget in an app a component draws, or slotted into one, finds the
 * app's body, and the walk ends at the main content of the document the element sits in, the
 * page's or a frame's.
 */
export const homeOf =
    (element: Element): (() => readonly Element[]) =>
    () => {
        const homes: Element[] = [];
        const add = (home: Element | null | undefined) => {
            if (home && !homes.includes(home)) homes.push(home);
        };
        let at: Element | null = element;
        while (at) {
            if (at.matches('.dk-app')) add(at.querySelector(':scope > .dk-app-body'));
            if (at.matches('main')) add(at);
            // The host is read from a shadow root alone, since a document's named form or frame
            // called host would answer for it.
            const parent: Node | null = at.parentNode;
            const up: Element | null =
                at.assignedSlot ??
                at.parentElement ??
                (parent?.nodeType === 11 ? (parent as ShadowRoot).host : null);
            if (!up || rootOf(up) !== rootOf(at)) add(rootOf(at).querySelector('main'));
            at = up;
        }
        return homes;
    };

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
 * when it was asked for. Focus inside a frame reads as the frame, as the page sees it.
 */
export const activeOf = (): Element | null => activeIn(document) ?? null;

/** What has focus in the document or shadow root given, followed into each shadow root. */
const activeIn = (root: DocumentOrShadowRoot | null | undefined): Element | null | undefined => {
    let active = root?.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active;
};
