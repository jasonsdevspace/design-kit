import { claimLine, lineOf, releaseLine, sayOn } from './line.js';
import { type AttachOptions, join, keep, type Kept, teardown } from './teardown.js';

/*
 * `attachStatus`, which hands a page the function that says a message on a status line, and the
 * types of what it says. The line's state and speech, which every piece that speaks shares, are in
 * the line module. No entry of the package names this module, so a page imports it only through
 * `./controls`.
 */

/** How a message is said on a status line. */
export type SayOptions = {
    /**
     * How long, in milliseconds, the words wait to stop changing before they are said, for words
     * that change with each press, such as a count still to enter. Words said again within it take
     * the place of those not yet said, and only the last is said.
     */
    readonly settle?: number | undefined;
    /**
     * For words that should give way to a result, such as progress or a busy button's notice:
     * left unsaid where firm words are said in the same moment or still settle, and said once the
     * line is free where firm words are on it. Given as a function, they wait for any words.
     */
    readonly polite?: boolean | undefined;
};

/**
 * Says a message on a status line, at once or once its words stop changing. A message given as a
 * function is read as it is put on the line, and one that gives nothing by then is not said, for
 * words that may no longer be true, such as a busy button's once its work is done.
 */
export type Say = (message: string | (() => string | null), options?: SayOptions) => void;

/**
 * The function each attached line says by, kept so attaching it again returns the same one, and
 * what takes that attach down.
 */
const attachedLines = new WeakMap<HTMLElement, Kept<Say>>();

/**
 * Returns the function that says a message on a status line, which a page draws out of sight and
 * puts on the page from the start, so a screen reader hears each message without focus moving. A
 * message is put in a moment after the line is emptied, so the same words said twice are heard
 * twice, and leaves after a while, so reading by line finds no old words. A message is said at once
 * unless it asks to settle, when it waits that long for its words to stop changing, and words said
 * again in the meantime take its place. Firm words said on the line drop words still settling, and
 * polite words give way to firm words said with them or still settling, and wait for firm words
 * being said, so the last words said are the ones heard. A screen keeps a line of its own for this,
 * as a toast and a stepper keep theirs. It speaks through the same function as the copy button and
 * the stepper, so a line handed to a copy button too keeps one timer, and a later message replaces
 * an earlier one. Attached again, a line returns the function it returned first, its `signal` one
 * more holder, unless the line was let go of, when it returns one afresh and the old attach is
 * taken down at once. Taken down by its `signal`, as `StatusProvider` takes its line down when it
 * unmounts, it lets the line go, so no piece says anything on it until it is attached again. The
 * function an attach returned says nothing once that attach is taken down, while a piece given the
 * line itself speaks on its next attach. A signal already aborted returns a function that says
 * nothing.
 */
export const attachStatus = (line: HTMLElement, options?: AttachOptions): Say => {
    // A signal already aborted does nothing, even to a line already attached.
    if (options?.signal?.aborted) return () => undefined;
    // A line let go of while still attached, as a toast's own line is when the toast is taken down,
    // is attached afresh, and its old attach taken down first, which drops it from the map, so the
    // old attach's signal holds nothing of it and the join below finds none.
    if (lineOf(line).released) attachedLines.get(line)?.down.stop();
    const already = join(attachedLines, line, options);
    if (already) return already;
    const down = teardown(options?.signal);
    claimLine(line);
    const speak: Say = (message, given) => {
        if (!down.signal.aborted) sayOn(line, message, given);
    };
    down.add(() => {
        releaseLine(line);
    });
    return keep(attachedLines, line, down, speak);
};
