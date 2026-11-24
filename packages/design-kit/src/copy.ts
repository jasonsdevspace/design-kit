import { SAID_FOR, say } from './line.js';
import { type AttachOptions, join, keep, type Kept, teardown } from './teardown.js';

/*
 * The copy button, which copies a block or selects it where the browser refuses the clipboard, and
 * says which. No entry of the package exports this module, so a page never reaches it.
 */

/** What a copy button reads, which attaching it again replaces, and the signal that holds it. */
export type CopyOptions = AttachOptions & {
    readonly source: () => HTMLElement;
    readonly status: HTMLElement;
};
const attachedButtons = new WeakMap<HTMLElement, Kept<() => void, CopyOptions>>();

/** Selects all of an element's text, for a visitor to copy with their own keys. */
const select = (element: HTMLElement) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
};

/** How to copy what is selected, in a keyboard's keys where a pointer can hover, else in words. */
const howToCopy = () => {
    try {
        if (window.matchMedia('(any-hover: hover)').matches) {
            return 'Selected. Press Control and C, or Command and C on a Mac, to copy.';
        }
    } catch {
        return "Selected. Copy it with your keys or your device's copy command.";
    }
    return "Selected. Copy it with your device's copy command.";
};

const copied = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
};

/**
 * Makes a copy button work: copies the text of the element `source` gives when it is pressed, or
 * selects it where the browser refuses the clipboard, shows Copied or Selected for a moment, and
 * says which on the page's status line. `source` is read at each press, so a button beside tabs
 * copies the block its tab shows. Attaching it again takes the new `source` and `status`, so a page
 * that draws the button again with a new source copies from that one, puts a word shown for the
 * last source back to Copy where the new source gives another element, and returns what it
 * returned the first time. Its `signal` takes it down as the function it returns does. A signal
 * already aborted does nothing, so a button not yet attached stays hidden and one already attached
 * stays as it is.
 */
export const attachCopyButton = (button: HTMLButtonElement, options: CopyOptions): (() => void) => {
    // A signal already aborted does nothing, so even new options for a button already attached are
    // not taken.
    if (options.signal?.aborted) return () => undefined;
    const already = join(attachedButtons, button, options);
    if (already) return already;
    const down = teardown(options.signal, options);
    let { source, status } = options;
    const words = [...button.querySelectorAll<HTMLElement>('.dk-copy-words > *')];
    let timer = 0;
    // The element the word shown was copied from, while one is shown.
    let copiedFrom: HTMLElement | null = null;
    const showWord = (index: number) => {
        words.forEach((word, at) => {
            if (at === index) word.removeAttribute('aria-hidden');
            else word.setAttribute('aria-hidden', 'true');
        });
    };
    const onClick = () => {
        const pressed = source();
        void copied(pressed.textContent).then((done) => {
            if (down.signal.aborted) return;
            // A source changed while the clipboard answered is not selected, and the button is left
            // as the change left it, but the status line still says what happened.
            if (source() !== pressed) {
                say(status, done ? 'Copied.' : 'Not copied. Press Copy again.');
                return;
            }
            if (!done) select(pressed);
            copiedFrom = pressed;
            showWord(done ? 1 : 2);
            say(status, done ? 'Copied.' : howToCopy());
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                copiedFrom = null;
                showWord(0);
            }, SAID_FOR);
        });
    };
    // A word shown for the element a press copied is put back to Copy where the new source gives
    // another, so it never claims that one copied, and kept where it gives the same. The source is
    // read only while a word is shown, and one that throws, as one reading a ref not yet drawn
    // does, counts as another.
    // Options with no source or status line, as the `{}` a holder that gave none goes back to, keep
    // the ones the button has, since a copy button has neither of its own.
    const set = (next: Partial<CopyOptions>) => {
        ({ source = source, status = status } = next);
        if (!copiedFrom) return;
        try {
            if (source() === copiedFrom) return;
        } catch {
            // Taken as another element.
        }
        copiedFrom = null;
        window.clearTimeout(timer);
        showWord(0);
    };
    button.addEventListener('click', onClick, { signal: down.signal });
    button.hidden = false;
    down.add(() => {
        window.clearTimeout(timer);
        showWord(0);
        button.hidden = true;
    });
    down.set = set;
    return keep(attachedButtons, button, down, down.stop);
};
