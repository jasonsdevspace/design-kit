/*
 * How an attach takes itself down, kept in one place so each attach keeps record 22's contract,
 * and record 23's holders, the same way rather than with flags of its own. No entry of the package
 * exports this module, so a page never reaches it.
 */

/**
 * How a page takes a piece down with an `AbortSignal`, as records 22 and 23 have it. Each signal an
 * attach of the element is given holds the piece, and once every one of them has aborted, the piece
 * is taken down a microtask later, as its detach takes it down at once. An attach of the same
 * element before then keeps the piece as it was, so a page that aborts and attaches again in one
 * task, as a ref made afresh on every render does, keeps it, and one that attaches after a
 * microtask starts afresh. Attached again, a piece returns what its attach returned first and runs
 * on the options of its newest holder. A signal already aborted does nothing.
 */
export type AttachOptions = { readonly signal?: AbortSignal | undefined };

/**
 * What an attach takes down when it is let go. Its listeners take `signal`, so they come off
 * together, and what a signal cannot take off, an observer, a timer or a frame, is kept with `add`.
 * Work set after the attach is set up follows one of two rules: it lives in a variable an undo kept
 * at setup clears, or its callback reads `signal.aborted` and does nothing. Anything that waits
 * longer than one task, a timer or a frame, is cleared by an undo rather than left to check.
 */
export type Teardown<Options = AttachOptions> = {
    /** Given to every listener the attach adds, and aborted as the teardown runs. */
    readonly signal: AbortSignal;
    /**
     * Keeps what undoes part of the attach, run in the order kept as the teardown runs, or at once
     * where the teardown has already run.
     */
    readonly add: (undo: () => void) => void;
    /**
     * The detach: takes everything down at once, whoever holds the control, and once, so calling
     * it again, after the page's abort or after the same element was attached anew, does nothing
     * and leaves that newer attach alone.
     */
    readonly stop: () => void;
    /**
     * Joins a later call to the control: its signal as one more holder, and a call with no signal
     * as the page's own hold where nothing else holds the control or the page holds it already, a
     * call in the abort's task among them, and elsewhere as the newest holder's call. Its options
     * are kept as that holder's, a call that gives none keeping the ones it gave before, and apply
     * where the call has no signal, comes from the newest holder or comes from the holder whose
     * options apply.
     */
    readonly hold: (by: AbortSignal | undefined, options?: Options) => void;
    /**
     * What applies a holder's options to the control, given by the attach before `keep`. It is
     * handed `{}` where no holder left gave options, so each key may be missing.
     */
    set?: ((options: Partial<Options>) => void) | undefined;
};

/** A control kept by its element: what its attach returned, and its teardown. */
export type Kept<Handle, Options = AttachOptions> = {
    readonly handle: Handle;
    readonly down: Teardown<Options>;
};

/**
 * Options count as given only where a key of their own other than `signal` has a value, so `{}`,
 * `{ signal }` and options whose every other key is undefined are no options, and a call with them
 * leaves the last alone.
 */
const optionsIn = <Options>(options?: Options): Options | undefined => {
    for (const key of Object.keys(options ?? {}) as (keyof Options)[])
        if (key !== 'signal' && options?.[key] !== undefined) return options;
    return undefined;
};

/**
 * The teardown for one control, held by each signal an attach of its element is given. It runs a
 * microtask after the last holder's signal aborts, unless a later call holds it by then, or at once
 * on the detach, which is `stop`, whichever comes first. A signal already aborted gives a teardown
 * already stopped, whose own signal is aborted and whose `add` runs each undo at once, so the
 * helper never gives null. It is no guard: each attach checks for a signal already aborted before
 * it sets anything up, since what it registers after its undos would outlive them. The listener on
 * each holder's signal is added once and comes off as it runs or as the teardown runs, so a signal
 * the page keeps for longer holds nothing of a piece already taken down. Until then that signal
 * keeps the piece alive, so a page hands over one that lives no longer than the piece.
 */
export const teardown = <Options = AttachOptions>(
    given?: AbortSignal,
    options?: Options
): Teardown<Options> => {
    const own = new AbortController();
    const { signal } = own;
    const undos: (() => void)[] = [];
    // Each signal holding the control, the oldest first, with the options its last call gave. The
    // key undefined is a call without a signal, which no abort lets go of.
    const holders = new Map<AbortSignal | undefined, Options | undefined>();
    const newest = () => [...holders.keys()].at(-1);
    const stop = () => {
        if (signal.aborted) return;
        own.abort();
        // Taken off by name rather than given the control's own signal, which would keep a step on
        // it for every signal it has held.
        for (const by of holders.keys()) by?.removeEventListener('abort', release);
        holders.clear();
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
    // The holder whose options apply now, which a call with options from the newest holder takes,
    // and a call from that holder itself keeps. A call without a signal always applies, so the
    // page's own hold is never compared against it.
    let applied: AbortSignal | undefined;
    const release = ({ target }: Event) => {
        holders.delete(target as AbortSignal);
        // The last holder gone, the control waits a microtask for an attach of its element. Where
        // the holder whose options apply goes, the newest one left that gave options takes over in
        // that same microtask, unless a newer holder has given its own by then, as a ref made
        // afresh does, so the options do not pass to an older holder and back.
        // A control already taken down keeps no holders, so this finds none and stops nothing.
        queueMicrotask(() => {
            if (!holders.size) stop();
            else if (target === applied) {
                // Where no holder left gave options, none applies, so no aborted signal is kept,
                // and the control goes back to its defaults, as a first attach that gave none has
                // them.
                const next = [...holders].findLast(([, given]) => given);
                applied = next?.[0];
                down.set?.(next?.[1] ?? {});
            }
        });
    };
    const hold = (by: AbortSignal | undefined, next?: Options) => {
        if (signal.aborted) return;
        // Added once however many calls a signal makes, as the DOM ignores the same listener again.
        by?.addEventListener('abort', release, { once: true });
        // A call without a signal is filed under the page's own hold where nothing else holds the
        // control or the page holds it already, so its options stay with the page, and elsewhere
        // under the newest holder, so they leave with that holder. Its options apply at once.
        const key = by ?? (holders.size && !holders.has(undefined) ? newest() : undefined);
        // A call that gives no options keeps the ones its holder gave before, and a holder called
        // again keeps its place among the others.
        holders.set(key, next ?? holders.get(key));
        if (next && (!by || key === newest() || key === applied)) {
            applied = key;
            down.set?.(next);
        }
    };
    const down: Teardown<Options> = {
        signal,
        add: (undo) => {
            if (signal.aborted) undo();
            else undos.push(undo);
        },
        stop,
        hold,
    };
    if (given?.aborted) stop();
    else hold(given, optionsIn(options));
    return down;
};

/**
 * What an attach called again returns: the handle of the control attached to the element, with this
 * call joined to it, or nothing where none is attached. An attach that throws for a missing part
 * calls it before it looks for its parts or reads its signal, so a control already attached is
 * handed back as it is though its markup has since lost a part, and gives `idle`, what it returns
 * under a signal already aborted, which is returned for such a signal with nothing joined.
 */
export const join = <Key extends object, Handle, Options>(
    registry: WeakMap<Key, Kept<Handle, Options>>,
    element: Key,
    options?: Options & AttachOptions,
    idle?: Handle
): Handle | undefined => {
    const kept = registry.get(element);
    // A control taken down by now, or being taken down, as an attach made from its own takedown
    // finds it, is attached afresh.
    if (!kept || kept.down.signal.aborted) return undefined;
    if (idle && options?.signal?.aborted) return idle;
    kept.down.hold(options?.signal, optionsIn(options));
    return kept.handle;
};

/**
 * Keeps a control by its element until its teardown runs, and returns its handle. An attach whose
 * options can change gives the teardown its `set` first.
 */
export const keep = <Key extends object, Handle, Options>(
    registry: WeakMap<Key, Kept<Handle, Options>>,
    element: Key,
    down: Teardown<Options>,
    handle: Handle
): Handle => {
    registry.set(element, { handle, down });
    // Only this control's entry, so an attach made afresh from its own takedown keeps its own.
    down.add(() => {
        if (registry.get(element)?.down === down) registry.delete(element);
    });
    return handle;
};
