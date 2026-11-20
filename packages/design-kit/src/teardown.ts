/*
 * How an attach takes itself down, kept in one place so every attach keeps record 22's contract the
 * same way rather than each with flags of its own. The package's exports name only the controls,
 * the hooks and the rest, so a page never reaches this module.
 */

/**
 * What an attach takes down when it is let go. Its listeners take `signal`, so they come off
 * together, and what a signal cannot take off, an observer, a timer or a frame, is kept with `add`
 * as the attach sets it up. A callback that may still come after the teardown, as a promise's
 * answer can, reads `signal.aborted` and does nothing.
 */
export type Teardown = {
    /** Given to every listener the attach adds, and aborted as the teardown runs. */
    readonly signal: AbortSignal;
    /** Keeps what undoes part of the attach, run in the order kept as the teardown runs. */
    readonly add: (undo: () => void) => void;
    /** Takes everything down, once, so a second call, or one after the page's abort, does nothing. */
    readonly stop: () => void;
};

/**
 * The teardown for one attach, run when the page's `signal` aborts or when the attach's detach,
 * which is `stop`, is called, whichever comes first. A signal already aborted gives null, so the
 * attach attaches nothing. The listener on the page's signal comes off with the teardown, so a
 * signal the page keeps for longer holds nothing of a piece already taken down.
 */
export const teardown = (given?: AbortSignal): Teardown | null => {
    if (given?.aborted) return null;
    const own = new AbortController();
    const { signal } = own;
    const undos: (() => void)[] = [];
    const stop = () => {
        if (signal.aborted) return;
        own.abort();
        for (const undo of undos) undo();
    };
    given?.addEventListener('abort', stop, { signal });
    return {
        signal,
        add: (undo) => {
            undos.push(undo);
        },
        stop,
    };
};
