/*
 * How an attach takes itself down, kept in one place so each attach keeps record 22's contract the
 * same way rather than with flags of its own. No entry of the package exports this module, so a
 * page never reaches it.
 */

/**
 * What an attach takes down when it is let go. Its listeners take `signal`, so they come off
 * together, and what a signal cannot take off, an observer, a timer or a frame, is kept with `add`.
 * Work set after the attach is set up follows one of two rules: it lives in a variable an undo kept
 * at setup clears, or its callback reads `signal.aborted` and does nothing. Anything that waits
 * longer than one task, a timer or a frame, is cleared by an undo rather than left to check.
 */
export type Teardown = {
    /** Given to every listener the attach adds, and aborted as the teardown runs. */
    readonly signal: AbortSignal;
    /**
     * Keeps what undoes part of the attach, run in the order kept as the teardown runs, or at once
     * where the teardown has already run.
     */
    readonly add: (undo: () => void) => void;
    /**
     * Takes everything down once, so calling it again, after the page's abort or after the same
     * element was attached anew, does nothing and leaves that newer attach alone.
     */
    readonly stop: () => void;
};

/**
 * The teardown for one attach, run when the page's `signal` aborts or when the attach's detach,
 * which is `stop`, is called, whichever comes first. A signal already aborted gives a teardown
 * already stopped, whose `add` runs each undo at once, so an attach that forgot its own early check
 * takes down what it sets up rather than living on. The listener on the page's signal comes off
 * with the teardown, so a signal the page keeps for longer holds nothing of a piece already taken
 * down. Until then that signal keeps the piece alive, so a page hands over one that lives no longer
 * than the piece.
 */
export const teardown = (given?: AbortSignal): Teardown => {
    const own = new AbortController();
    const { signal } = own;
    const undos: (() => void)[] = [];
    const stop = () => {
        if (signal.aborted) return;
        own.abort();
        // Each undo runs even where one before it throws, so a teardown is never left half done,
        // and the error is still reported as an uncaught one would be.
        for (const undo of undos) {
            try {
                undo();
            } catch (error) {
                reportError(error);
            }
        }
    };
    if (given?.aborted) stop();
    else given?.addEventListener('abort', stop, { signal });
    return {
        signal,
        add: (undo) => {
            if (signal.aborted) undo();
            else undos.push(undo);
        },
        stop,
    };
};
