import { isElement, isOff } from './find.js';

/*
 * The state the parts of the controls share, held once for a page however its bundler splits them:
 * the visitor's last press and how many inputs they have made, how many times the page has gone out
 * of sight or come back, the focus the kit last handed back, what the browser hands focus back to
 * as each dialog closes, and the forms the kit checks with the steppers in them. It is the one
 * module of the controls that does something as it loads, adding the listeners that note inputs on
 * the page and in each frame of its own origin, focus entering a frame, a frame's page going and the
 * page going out of sight, so the package names it in `sideEffects`. A plain value is written only here, and what another module writes is
 * held in an object or a map. No entry of the package names this module, so a page imports it only
 * through `./controls`.
 */

/** A button or a link by its role, which Enter presses, and Space too but for a link. */
const ROLE_ACTIVATOR = '[role="button"], [role="link"], [role="menuitem"]';
/** What a press is made on: a button or a link, native or by its role. */
const ACTIVATOR = [
    'button',
    'a[*|href]',
    'input[type="button"]',
    'input[type="submit"]',
    'input[type="reset"]',
    'input[type="image"]',
    'summary',
    ROLE_ACTIVATOR,
].join(', ');
/** Keys that move rather than press. */
const MOVES = [
    'Tab',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
    'PageUp',
    'PageDown',
];

/**
 * Whether an event presses a button or a link that is not off and is not in a row of tabs, told by
 * its type and its target's node type rather than the page's classes, which a frame's are not.
 */
const presses = (event: Event): boolean => {
    if (event.type === 'submit') return true;
    // The control itself, inside a shadow root too, where the document hears its host instead.
    const [target] = event.composedPath();
    if (!isElement(target) || target.closest('[role="tablist"]')) return false;
    if (event.type === 'keydown') {
        const { key } = event as KeyboardEvent;
        const own = target.closest(ROLE_ACTIVATOR);
        return (
            own === target &&
            !isOff(own) &&
            (key === 'Enter' || (key === ' ' && own.getAttribute('role') !== 'link'))
        );
    }
    const control = target.closest(ACTIVATOR);
    return control !== null && !isOff(control);
};

/**
 * How many times the page has gone out of sight or come back, the rule for which request is
 * dropped. A browser runs no frame while the page is out of sight, so a request that sees this
 * change before its frame was waiting while the visitor was away, and is dropped so focus does not
 * jump when they come back. The page is told it is going before it stops drawing, so a request
 * whose frame the browser runs on the way back, before it tells the page, is dropped too.
 */
export let sightChanges = 0;

/**
 * When the visitor's last input was a press on a button or a link, or a submit, that no view has
 * taken focus for, and how many inputs they have made, on the page or inside a frame of its own
 * origin, so a press handed back is not handed back over a later one. A press is any click or
 * submit, a script's among them, so a page's own `click()` and a test's count. A key that moves or
 * types clears it, so a Tab, an arrow along a row of tabs or typing in a field leaves none, as a
 * click on nothing does, while a pointer going down to scroll leaves it. A press on a control that
 * is off or in a row of tabs counts for nothing, since an off control only says why it is off and a
 * tab keeps focus as its panel changes, and Enter or Space on a control a page makes a button or a
 * link by its role counts, since no click follows them.
 */
export const press: { at: number | null } = { at: null };
export let inputs = 0;
const heard = (event: Event) => {
    if (event.type === 'load') {
        sweep((event.target as Partial<HTMLIFrameElement> | null)?.contentWindow);
        return;
    }
    if (event.type === 'keydown') {
        // A keydown with no key, as autofill sends, is no input of the visitor's.
        const { key } = event as Partial<KeyboardEvent>;
        if (typeof key !== 'string') return;
        if (presses(event)) press.at = performance.now();
        else if (key.length === 1 || MOVES.includes(key)) press.at = null;
        else return;
    } else press.at = presses(event) ? performance.now() : null;
    inputs += 1;
};
/** Clears a standing press as a key that moves focus does, so a later input is not handed back. */
const clear = () => {
    press.at = null;
    inputs += 1;
};

/** The document a window shows, where it is of the page's own origin, read in a try. */
const docIn = (win: Window | null | undefined): Document | null => {
    try {
        return win?.document ?? null;
    } catch {
        return null;
    }
};

/**
 * What has focus, read from the page down: followed into each shadow root that holds it, and into
 * each frame of the page's own origin that has it, an object showing a document among them, to the
 * control focused inside the frame or to the frame's body where nothing is. A frame of another
 * origin shows nothing inside, so focus there reads as the frame, and a closed shadow root as its
 * host. A frame's own record is read only while focus is in the frame, so a control it last focused
 * is never taken for focus once a visitor has moved on. Kept as it is wherever the kit stores where
 * focus was, and compared and judged only through `seen`. It sits here, beside the presses, so the
 * module that hears them reads focus by the one reader without the rest of the focus module.
 */
export const deepActive = (): Element | null => {
    let active = document.activeElement;
    for (
        let next;
        (next =
            active?.shadowRoot?.activeElement ??
            docIn((active as Partial<HTMLIFrameElement> | null)?.contentWindow)?.activeElement);
    )
        active = next;
    return active;
};

/**
 * Hears the inputs made in a document and the load of each frame in it, the blur of its window and,
 * for a frame's window, its page going. A press or a key inside a frame counts as one on the page
 * does. The DOM ignores a listener added again with the same type, callback and capture, so a
 * document and a window are heard once however often they are reached, a document written again
 * with `open()`, which loses its listeners, is heard again at its load, and a frame that leaves the
 * page or loads another page takes its document's listeners with it.
 */
const hear = (doc: Document) => {
    for (const type of ['keydown', 'click', 'submit', 'load'])
        doc.addEventListener(type, heard, true);
    const win = doc.defaultView;
    if (!win) return;
    win.addEventListener('blur', entered);
    if (win !== window) win.addEventListener('pagehide', next);
};
/**
 * Hears a window's document where it is of the page's own origin, and each window under it, so the
 * page and every frame of its own origin in its window tree are heard as they are found, at any
 * depth and through a frame of another origin too, an object and a frame element as an iframe is.
 * Nothing is heard inside a frame of another origin, which shows no document.
 */
const sweep = (win: Window | null | undefined) => {
    if (!win) return;
    const doc = docIn(win);
    if (doc) hear(doc);
    for (let i = 0; i < win.length; i += 1) sweep(win[i]);
};

/**
 * Hears a frame's document and the document of each frame around it, out to the page, and returns
 * whether any of those frames sits in a shadow root, where the walk of the window tree misses it.
 */
const hearOut = (inner: Document): boolean => {
    let missed = false;
    for (let doc: Document | undefined = inner; doc && doc !== document;) {
        sweep(doc.defaultView);
        const frame: Element | null | undefined = doc.defaultView?.frameElement;
        missed ||= frame?.getRootNode() !== frame?.ownerDocument;
        doc = frame?.ownerDocument;
    }
    return missed;
};
/**
 * Follows focus as it enters a frame, from the window that lost it. A read that ends inside a frame
 * of the page's own origin hears that frame and each around it, and one that ends on a body of the
 * window that lost focus, which Firefox reads during the blur, is read again a task later. Where the
 * read ends on a frame that shows no document, or on an element of that window that is no body, as
 * a closed shadow root's host is, focus sits in a frame nothing can hear while the page has focus,
 * so the press is cleared rather than left standing. A frame inside a shadow root is the one the
 * walk of the window tree misses, so where the read had to wait a task to find one, a click in it
 * may have come first and gone unheard, and the press is cleared as it is heard. Returns whether it
 * is done.
 */
const follow = (from: Window, late: boolean): boolean => {
    const at = deepActive();
    if (!at) return true;
    const own = at.ownerDocument;
    const inner = (at as Partial<HTMLIFrameElement>).contentWindow;
    if (inner === undefined && own.defaultView !== from) {
        if (hearOut(own) && late) clear();
        return true;
    }
    if (inner === undefined && at.localName === 'body') return false;
    sweep(inner);
    if (!docIn(inner) && document.hasFocus()) clear();
    return true;
};
/**
 * A heard window losing focus while the page keeps it, which is focus entering a frame, on a click
 * or a key, ahead of the frame's click. The window tree is walked at once, so a frame in it is heard
 * before that click, and focus is followed into a frame the walk does not reach, as one inside a
 * shadow root is, in a microtask, or in a task where Firefox still reads the body. Focus leaving the
 * browser window, where the page has focus no more, clears nothing.
 */
const entered = (event: Event) => {
    if (!document.hasFocus()) return;
    sweep(window);
    const from = event.currentTarget as Window;
    queueMicrotask(() => {
        if (!follow(from, false)) setTimeout(() => follow(from, true));
    });
};
/**
 * A heard frame's page going, as a form sent inside it or a new address takes it on. No event hands
 * the page the next document before its load, so the frame's window is read a task at a time, for a
 * short while, until it shows another document, which is heard at once. A page going into the back
 * and forward cache keeps its listeners and is passed over, a frame taken from the page ends the
 * reads, and a next page of another origin, which shows no document, clears the press where focus
 * reads as that frame.
 */
const next = (event: Event) => {
    if ((event as PageTransitionEvent).persisted) return;
    const win = event.currentTarget as Window;
    const old = docIn(win);
    let tries = 0;
    const read = () => {
        if (win.closed) return;
        const doc = docIn(win);
        if (!doc) {
            const at = deepActive() as Partial<HTMLIFrameElement> | null;
            if (at?.contentWindow === win && document.hasFocus()) clear();
        } else if (doc !== old) sweep(win);
        else if ((tries += 1) < 20) setTimeout(read);
    };
    setTimeout(read);
};

// The one thing the module does as it loads, in a page, so the press that brings a page's first
// view is heard and a request made before the page went out of sight is known. It notes inputs,
// frames loading, focus entering a frame and a frame's page going, on the page and in each frame of
// its own origin, and each time the page goes out of sight or comes back, and nothing else.
if (typeof document !== 'undefined') {
    sweep(window);
    document.addEventListener('visibilitychange', () => {
        sightChanges += 1;
    });
}

/** The element the kit last handed focus back to as a piece closed or left, and when. */
export const handed: { to: Element | null; at: number } = { to: null, at: 0 };

/**
 * For each attached dialog, what had focus as it opened, kept as the deep reader gives it, which
 * the browser may hand focus back to as the dialog closes, ahead of the close event, and focus that
 * reads the same through `seen`, for the dialog's document or for the page's, counts as so handed.
 * Kept until the dialog's close is handled or it is taken down, until a request lands while focus
 * is there, or until a request finds the dialog gone from the page.
 */
export const restoring = new Map<HTMLDialogElement, Element>();

/** What checks a form, and clears what its check drew, from an attach in it. */
export type Checker = {
    readonly check: (event: SubmitEvent, whole: HTMLFormElement) => void;
    readonly clear: () => boolean;
    readonly cleared: () => void;
};

/** A form the kit checks, with the attaches in it and the marks they set on fields not in error. */
export type CheckedForm = {
    readonly checkers: Checker[];
    readonly marks: Set<Element>;
    readonly stop: () => void;
};

/** The forms the kit checks, each once however many of its parts are attached. */
export const checkedForms = new WeakMap<HTMLFormElement, CheckedForm>();

/**
 * What each attached stepper does as its form refuses it or is reset, by its value: it takes back
 * its own words not yet said, so the form's message is the one message, and shows its own error.
 */
export const formSteppers = new WeakMap<Element, (reset: boolean) => void>();
