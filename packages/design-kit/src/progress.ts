import { namedText } from './find.js';
import { speakOn, unsay } from './line.js';
import type { Say } from './status.js';
import { type AttachOptions, join, keep, type Kept, teardown } from './teardown.js';

/*
 * Progress, which says how far a bar has come at the steps a page sets and once at the end. No
 * entry of the package exports this module, so a page never reaches it.
 */

/**
 * How progress is said, for the steps it is said at, where, and what is said at the end, and the
 * signal that holds it.
 */
export type ProgressOptions = AttachOptions & {
    /**
     * How many equal steps the amount is said at, 4 for each quarter until a page sets it. The end
     * is said once whatever the steps.
     */
    readonly steps?: number | undefined;
    /** What is said at the end in place of the label and the words, such as "Imported 40 products." */
    readonly done?: string | undefined;
    /** The status line progress is said on, such as the screen's own. */
    readonly status?: HTMLElement | null | undefined;
    /** What says progress, for a page that has one already, such as React's `useStatus`. */
    readonly say?: Say | undefined;
};

/** How many steps a bar is said at, so steps given again as the same count compare equal. */
const countOf = ({ steps }: ProgressOptions) => Math.max(1, Math.floor(steps ?? 4));

/** The least time between two steps said, in milliseconds, so one is heard before the next. */
const STEP_GAP = 3000;

const attachedProgress = new WeakMap<HTMLProgressElement, Kept<() => void, ProgressOptions>>();

/** An element's name as a screen reader reads it: its label, the words it names, or its own. */
const nameOf = (element: HTMLProgressElement) =>
    [
        element.labels[0]?.textContent.trim() ?? '',
        namedText(element, 'aria-labelledby'),
        (element.getAttribute('aria-label') ?? '').trim(),
    ].find((name) => name !== '') ?? '';

/**
 * Says how far a `progress` element has come on the status line given, at the steps the page sets,
 * each quarter until it sets others, and once at the end, and returns what takes it down. What is
 * said is the bar's name and the words that describe it, such as "Importing products, 12 of 40.",
 * read as the step is crossed, or how far it has come in hundredths where it has no words. Each is
 * said at once, with no wait for the amount to stop changing, since a steady import never stops, at
 * least three seconds after the last step so one is heard before the next, while the end never
 * waits. Every word it says is polite, so it gives way to a result said with it and waits for firm
 * words being said, and a page's own result or failure is never put out by it. The end, or the
 * `done` words in its place, is said once, until the amount goes back for another run. The amount a
 * bar first shows, as it is attached or once it is known, is not said, though an amount that
 * becomes known at the end, after the bar is attached, is, and a bar with no amount says nothing.
 * Attached again, a bar returns what it returned first and runs on the options of its newest
 * holder, counting its steps again only where they change. Taken down, by what it returns or by its
 * `signal`, it says nothing more on its status line, and a step still waiting there is left
 * unsaid.
 */
export const attachProgress = (
    progress: HTMLProgressElement,
    options?: ProgressOptions
): (() => void) => {
    // A signal already aborted does nothing, so even new options for a bar already attached are not
    // taken.
    if (options?.signal?.aborted) return () => undefined;
    const already = join(attachedProgress, progress, options);
    if (already) return already;
    const down = teardown(options?.signal, options);
    let chosen: ProgressOptions = options ?? {};
    const known = () => progress.hasAttribute('value');
    const stepOf = () => {
        const steps = countOf(chosen);
        // A hair over, so a boundary a fraction lands just under, as 57 hundredths does, counts.
        return Math.floor(Math.min(1, progress.position) * steps + 1e-9);
    };
    let reached = known() ? stepOf() : -1;
    let ended = known() && progress.position >= 1;
    let lastSaid = -Infinity;
    const words = () => {
        const name = nameOf(progress);
        const amount =
            namedText(progress, 'aria-describedby') ||
            `${String(Math.round(progress.position * 100))}%`;
        const said = name ? `${name}, ${amount}` : amount;
        return /[.!?]$/.test(said) ? said : `${said}.`;
    };
    let last = '';
    const speak = (message: string) => {
        last = message;
        speakOn(chosen, message, { polite: true });
    };
    const check = () => {
        if (!known()) {
            reached = -1;
            ended = false;
            return;
        }
        const now = stepOf();
        const first = reached < 0;
        if (progress.position >= 1) {
            if (!ended) speak(chosen.done ?? words());
            ended = true;
            reached = now;
            return;
        }
        if (first || now < reached || ended) {
            // The amount first known, or gone back for a new run, is where saying starts from.
            ended = false;
            reached = now;
            return;
        }
        if (now > reached) {
            reached = now;
            const at = performance.now();
            if (at - lastSaid < STEP_GAP) return;
            lastSaid = at;
            speak(words());
        }
    };
    const kept = new MutationObserver(check);
    kept.observe(progress, { attributeFilter: ['value', 'max'] });
    down.add(() => {
        kept.disconnect();
        // The last step said is taken off the bar's line, or out of its wait there, so a step
        // still to be heard is never said once the bar is let go. A page's own `say` keeps what
        // it was handed.
        if (!chosen.say && chosen.status) unsay(chosen.status, last);
    });
    down.set = (next) => {
        const moved = countOf(next) !== countOf(chosen);
        chosen = next;
        // Counted again in new steps, so the next step is one of them. The same steps leave the
        // count alone, so a step whose record is still to come is still heard.
        if (moved && known()) reached = stepOf();
    };
    return keep(attachedProgress, progress, down, down.stop);
};
