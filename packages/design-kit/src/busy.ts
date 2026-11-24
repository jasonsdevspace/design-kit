import { speakOn } from './line.js';
import type { Say } from './status.js';
import { type AttachOptions, join, keep, type Kept, teardown } from './teardown.js';

/*
 * The busy button, which refuses a press while busy and says so once a wait is long enough to
 * notice. No entry of the package exports this module, so a page never reaches it.
 */

/**
 * How a busy button is attached, for the words it says once a wait is long enough to notice, and
 * the signal that holds it.
 */
export type BusyOptions = AttachOptions & {
    /** The status line the busy words are said on, such as the screen's own. */
    readonly status?: HTMLElement | null | undefined;
    /** What says the busy words, for a page that has one already, such as React's `useStatus`. */
    readonly say?: Say | undefined;
};

/**
 * The wait before a busy button says it is busy, the delay the sheet holds its look back by, read
 * as the button is drawn busy, so the words and the look keep one clock whatever --dk-wait is set
 * to, and a page that takes the delay away has the words said at once with the look.
 */
const waitOf = (button: Element): number => {
    const first = getComputedStyle(button).transitionDelay.split(',')[0]?.trim() ?? '';
    const amount = Number.parseFloat(first);
    if (Number.isNaN(amount)) return 0;
    return first.endsWith('ms') ? amount : amount * 1000;
};

const attachedBusy = new WeakMap<HTMLElement, Kept<() => void, BusyOptions>>();

/**
 * Makes a busy button work, one marked `data-busy` while what its press started runs, and returns
 * what takes it down. While it is busy the attach marks it `aria-disabled` too, where the page has
 * not, and takes away only the mark it set when the work is done. A press of a busy button, by a
 * pointer or by Enter or Space, is stopped before the button's own handlers and React's `onClick`
 * hear it, so a submit button submits nothing, though a capture listener further up still hears it.
 * Once the button has been busy for the wait the sheet holds its look back by, --dk-wait, its words
 * are said once on the status line, the `data-busy` value, or "Saving." where it is empty, so a
 * fast save says nothing. Words not yet on the line when the work is done are dropped, so a result
 * a toast says is never followed by a late "Saving.", and a button made busy again before the last
 * wait ended starts a wait of its own. Attached again, a button returns what it returned first and
 * runs on the options of its newest holder, a wait under way kept. Taken down, by what it returns
 * or by its `signal`, it takes away the mark it set and says nothing still waiting.
 */
export const attachBusy = (button: HTMLElement, options?: BusyOptions): (() => void) => {
    // A signal already aborted does nothing, so even new options for a button already attached are
    // not taken.
    if (options?.signal?.aborted) return () => undefined;
    const already = join(attachedBusy, button, options);
    if (already) return already;
    const down = teardown(options?.signal, options);
    let chosen: BusyOptions = options ?? {};
    let timer = 0;
    let marked = false;
    // Each busy run counts, so a notice waiting from a run that ended says nothing in another.
    let runs = 0;
    const busy = () => button.hasAttribute('data-busy');
    const speak = () => {
        if (!busy()) return;
        const given = button.getAttribute('data-busy') ?? '';
        const words = given === '' ? 'Saving.' : given;
        const run = runs;
        const still = () => (busy() && run === runs ? words : null);
        // Polite, as a notice that work goes on, so it gives way to a result, and the end of a
        // progress said beside it, which is polite too, takes its place rather than being dropped.
        speakOn(chosen, still, { polite: true });
    };
    const start = () => {
        runs += 1;
        window.clearTimeout(timer);
        if (button.getAttribute('aria-disabled') !== 'true') {
            button.setAttribute('aria-disabled', 'true');
            marked = true;
        }
        timer = window.setTimeout(speak, waitOf(button));
    };
    const end = () => {
        runs += 1;
        window.clearTimeout(timer);
        if (marked) button.removeAttribute('aria-disabled');
        marked = false;
    };
    // A record whose old value is null is the mark arriving, so a busy that ends and starts again
    // within one task still starts a wait of its own.
    const kept = new MutationObserver((records) => {
        if (!busy()) end();
        else if (records.some(({ oldValue }) => oldValue === null)) start();
    });
    kept.observe(button, { attributeFilter: ['data-busy'], attributeOldValue: true });
    const stop = (event: Event) => {
        if (!busy()) return;
        event.preventDefault();
        event.stopImmediatePropagation();
    };
    button.addEventListener('click', stop, { capture: true, signal: down.signal });
    if (busy()) start();
    // Ending clears the wait's timer and counts a run, so words already handed to the line find
    // their run over and are left unsaid.
    down.add(() => {
        kept.disconnect();
        end();
    });
    down.set = (next) => {
        chosen = next;
    };
    return keep(attachedBusy, button, down, down.stop);
};
