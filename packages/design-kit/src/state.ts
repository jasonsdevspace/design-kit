import { isElement, isOff } from './find.js';

/*
 * The state the parts of the controls share, held once for a page however its bundler splits them:
 * the visitor's last press and how many inputs they have made, how many times the page has gone out
 * of sight or come back, the focus the kit last handed back, what the browser hands focus back to
 * as each dialog closes, and the forms the kit checks with the steppers in them. It is the one
 * module of the controls that does something as it loads, adding the listeners that note inputs on
 * the page and in each frame of its own origin, and the page going out of sight, so the package
 * names it in `sideEffects`. A plain value is written only here, and what another module writes is
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
        hearIn(event.target);
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

/**
 * Hears the inputs made in a document and the load of each frame in it, then hears each frame of
 * the page's own origin the document holds, so the page and its frames, at any depth through such
 * frames, are heard as they are found, and a frame's page as it loads. A press or a key inside such
 * a frame counts as one on the page does. Nothing is heard inside a frame of another origin, which
 * shows no document, or in any frame it holds, inside a frame within a shadow root, whose load goes
 * no further than that root, or in a frame's page before its load, where the module did not find
 * the frame showing that page as it loaded, as with a frame added later or one that goes on to
 * another page. The DOM ignores a listener added again with the same type, callback and capture, so
 * a document is heard once however often it is reached, a document written again with `open()`,
 * which loses its listeners, is heard again at its load, and a frame that leaves the page or loads
 * another page takes its document's listeners with it.
 */
const hear = (doc: Document) => {
    for (const type of ['keydown', 'click', 'submit', 'load'])
        doc.addEventListener(type, heard, true);
    for (const frame of doc.querySelectorAll('iframe, frame, object')) hearIn(frame);
};
/** Hears the document a frame shows, where it shows a document of the page's own origin. */
const hearIn = (frame: EventTarget | null) => {
    const inner = (frame as Partial<HTMLIFrameElement> | null)?.contentDocument;
    if (inner?.nodeType === 9) hear(inner);
};

// The one thing the module does as it loads, in a page, so the press that brings a page's first
// view is heard and a request made before the page went out of sight is known. It notes inputs and
// frames loading, on the page and in each frame of its own origin, and each time the page goes out
// of sight or comes back, and nothing else.
if (typeof document !== 'undefined') {
    hear(document);
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
