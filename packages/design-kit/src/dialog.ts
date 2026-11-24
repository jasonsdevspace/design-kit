import { FOCUSABLE, isElement } from './find.js';
import { activeIn, focusedNow, handBackIn, holds, mayHandBack } from './focus.js';
import { restore } from './marks.js';
import { restoring } from './state.js';
import { type AttachOptions, join, keep, type Kept, teardown } from './teardown.js';

/*
 * The dialog, which closes on a tap on its scrim and hands focus back to what opened it, and keeps
 * in the shared state what the browser hands focus to as it closes, for a focus request to read. No
 * entry of the package names this module, so a page imports it only through `./controls`.
 */

/**
 * What a page hands the function that opens a dialog, to say where focus goes back to: the element
 * itself, or the event, a page's own or React's, whose press opened it.
 */
export type DialogOpener =
    Element | { readonly target: EventTarget | null; readonly currentTarget?: EventTarget | null };

/** Opens a dialog as a modal, over the page, remembering where focus goes back to on close. */
export type OpenDialog = (from?: DialogOpener) => void;

/** How a dialog is attached, and the signal that holds it. */
export type DialogOptions = AttachOptions & {
    /**
     * Stays open on Escape, a phone's Back and a tap on the scrim, for a dialog that must be
     * answered.
     */
    readonly stay?: boolean | undefined;
    /**
     * Where focus goes when nothing had focus as the dialog opened or what opened it no longer
     * takes focus. It may give any HTML or SVG element that takes focus, an SVG link among them.
     */
    readonly returnTo?: (() => Element | null) | undefined;
};

const attachedDialogs = new WeakMap<HTMLDialogElement, Kept<OpenDialog, DialogOptions>>();

/**
 * Moves focus off a dialog's corner Close as it opens, to the first field or answer after it that
 * takes focus in the order, else to the title. A link or button among the dialog's words is passed
 * over, so a long dialog opens at its top rather than scrolled down to it.
 */
const moveOffClose = (dialog: HTMLDialogElement, close: Element): void => {
    for (const next of dialog.querySelectorAll<HTMLElement>(
        ':is(input, select, textarea):not([tabindex="-1"]), .dk-dialog-actions > *'
    )) {
        if (close.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_PRECEDING) continue;
        // A radio whose group has a checked one is not where the order goes.
        const name = next.getAttribute('name');
        if (
            next.matches('input[type="radio"]:not(:checked)') &&
            name &&
            dialog.querySelector(`input[type="radio"][name="${CSS.escape(name)}"]:checked`)
        ) {
            continue;
        }
        next.focus();
        if (activeIn(dialog.ownerDocument) === next) return;
    }
    const title = dialog.querySelector<HTMLElement>('.dk-dialog-title');
    if (!title) return;
    // A title the page gave no place in the order borrows one, and gives it back as focus leaves.
    if (!title.hasAttribute('tabindex')) {
        title.tabIndex = -1;
        title.addEventListener(
            'blur',
            () => {
                if (title.getAttribute('tabindex') === '-1') title.removeAttribute('tabindex');
            },
            { once: true }
        );
    }
    title.focus();
};

/**
 * The element focus goes back to, from what the page handed over, else what had focus in the
 * dialog's document, an element of a frame the page drives among them.
 */
const openerOf = (from: DialogOpener | undefined, doc: Document): Element | null => {
    const found = isElement(from)
        ? from
        : from
          ? ((isElement(from.target)
                ? from.target.closest(`:is(${FOCUSABLE}):not([tabindex="-1"])`)
                : null) ?? (isElement(from.currentTarget) ? from.currentTarget : null))
          : null;
    if (found && found !== doc.body) return found;
    // The body, where nothing has focus, is no opener, so focus goes where returnTo says.
    return focusedNow(doc);
};

/**
 * Makes a dialog do what the native element does not do alone, and returns the function that opens
 * it. The element holds focus inside, closes on Escape and makes the page behind it inert. This
 * closes it on a tap on the scrim around it, one that starts and ends there so a drag out of the
 * dialog closes nothing, and on close returns focus to what opened it. That is the element the
 * press that opened it landed on, found from the event a page's listener or React's hands over,
 * since a browser that gives a pressed button no focus leaves nothing else, or else what had focus.
 * Where nothing had focus, or that no longer takes focus, focus goes where `returnTo` says. A
 * `moveFocus` request asked in the task that closes it, takes it away or takes it down lands in
 * place of the opener, since a request takes focus the kit, or the browser as the dialog closes,
 * hands back after it was asked as free. Focus the page moves elsewhere in that task stays, while
 * focus it puts back on what had focus as the dialog opened counts as the browser's handback. One
 * asked in an earlier task lands only where its frame comes after the close, so a page that awaits
 * before closing asks again just before it closes.
 *
 * A dialog that must be answered is attached to stay, and then stays open on Escape, a phone's Back
 * and the scrim, by the closedby attribute where the browser reads it, since one that limits how
 * often a page may refuse a close does not hold a refusal past the first. Attaching it again with
 * options replaces them, by the rule for whose options apply in the reference's Taking a control
 * down, attaching it again with none, or with no key but `signal` given a value, as `{}` or
 * `{ stay: undefined }`, leaves them as they were, and either returns the same function, an open
 * dialog staying open. Its listeners are on the dialog, so a dialog taken from the page takes them
 * with it. It reads focus and finds its opener in the document it sits in as it is attached, a
 * frame's where the page attaches it inside one. Taken down by its `signal`, an open dialog closes,
 * focus goes back to what opened it where focus is in the dialog, inside a shadow tree within it
 * too, has fallen to the body or is still where the browser handed it as the dialog closed, its
 * listeners come off, the page's own closedby is put back, and the function that opens it does
 * nothing.
 */
export const attachDialog = (dialog: HTMLDialogElement, options?: DialogOptions): OpenDialog => {
    // A signal already aborted does nothing, so even new options for a dialog already attached are
    // not taken.
    if (options?.signal?.aborted) return () => undefined;
    const already = join(attachedDialogs, dialog, options);
    if (already) return already;
    const down = teardown(options?.signal, options);
    const { signal } = down;
    // The document the dialog sits in, a frame's where the page attaches it inside one, where focus
    // is read and handed back, since the page sees focus anywhere in a frame as the frame.
    const doc = dialog.ownerDocument;
    // The page's own closedby, which the dialog holds while attached and puts back as it is let go.
    const own = dialog.getAttribute('closedby');
    let settings: DialogOptions = {};
    const set = (next: DialogOptions) => {
        settings = next;
        if (settings.stay === true) dialog.setAttribute('closedby', 'none');
        else dialog.removeAttribute('closedby');
    };
    set(options ?? {});
    let opener: Element | null = null;
    let startedOutside = false;
    const outside = (event: MouseEvent) => {
        if (event.target !== dialog) return false;
        const box = dialog.getBoundingClientRect();
        return (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
        );
    };
    dialog.addEventListener(
        'pointerdown',
        (event) => {
            startedOutside = outside(event);
        },
        { signal }
    );
    dialog.addEventListener(
        'click',
        (event) => {
            if (settings.stay !== true && startedOutside && outside(event)) dialog.close();
            startedOutside = false;
        },
        { signal }
    );
    dialog.addEventListener(
        'cancel',
        (event) => {
            if (settings.stay === true) event.preventDefault();
        },
        { signal }
    );
    // Whether focus is the kit's to hand back, read the same way by the close event and the
    // takedown: still on what the browser handed it to as the dialog closed, or by the rule every
    // piece hands it back by. Focus a request or the page has put anywhere else stays.
    const handsBack = () =>
        restoring.get(dialog) === focusedNow(doc) || mayHandBack(dialog, true, doc);
    const onClose = (back: boolean) => {
        // The browser fires close a moment after the dialog closes, so one that arrives once the
        // dialog is open again belongs to an earlier closing and leaves this opening's opener be.
        if (dialog.open) return;
        // What the browser handed focus to as the dialog closed comes last, so where the opener
        // has gone and nothing else takes focus, that place counts as handed back, and a request
        // asked in the task that closed the dialog still lands.
        if (back) handBackIn(doc, opener, settings.returnTo?.(), restoring.get(dialog));
        opener = null;
        restoring.delete(dialog);
    };
    dialog.addEventListener('close', () => onClose(handsBack()), { signal });
    const open: OpenDialog = (from) => {
        if (dialog.open || signal.aborted) return;
        opener = openerOf(from, doc);
        // Where nothing had focus, the browser hands it nowhere as the dialog closes.
        const before = focusedNow(doc);
        if (before) restoring.set(dialog, before);
        else restoring.delete(dialog);
        dialog.showModal();
        // A Close in the corner never takes focus as the dialog opens, which it would where nothing
        // in the dialog asks for focus, as when React's autoFocus writes no attribute.
        const close = dialog.querySelector(':scope > .dk-close');
        if (close && holds(close, activeIn(doc) ?? null)) moveOffClose(dialog, close);
    };
    // A dialog let go while open closes, so the page behind is no longer inert, and focus goes back
    // at once, open or closed in the same task, since the close event that would hand it back comes
    // after its listener is off. It goes back by the same rule as that event, read before the close
    // moves it, so focus the page set in the abort's task stays. That event is stopped where it
    // lands, so an attach made since never takes it for a closing of its own and sends focus to its
    // returnTo. The listener that stops it takes no signal, since it is added once the attach's
    // signal has aborted, and a close event always follows to take it off, from the close just after
    // it or from one the page made that is still on its way.
    down.add(() => {
        // Put back where it still holds what the dialog set, so a closedby the page set since,
        // while the dialog was not attached to stay, stays. Put back first, so a page that attaches
        // the dialog again as focus goes back reads its own and keeps what that attach sets.
        if (settings.stay || !dialog.hasAttribute('closedby')) restore(dialog, 'closedby', own);
        if (dialog.open || opener) {
            const back = handsBack();
            dialog.addEventListener('close', (event) => event.stopImmediatePropagation(), {
                once: true,
            });
            dialog.close();
            onClose(back);
        }
        restoring.delete(dialog);
    });
    down.set = set;
    return keep(attachedDialogs, dialog, down, open);
};
