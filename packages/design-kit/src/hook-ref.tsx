'use client';

import { type RefCallback, useCallback, useState } from 'react';

/*
 * The ref every hook attaches through, which makes a controller for each element it lands on and
 * takes that element's part down as it leaves.
 */

/** An element a hook holds: the signal its attach was given, and what takes its part down. */
export type Held = { readonly signal: AbortSignal; readonly down: () => void };

/**
 * The ref of a hook that attaches to each element it lands on, and the elements attached now, the
 * oldest first, each with the signal its attach was given. `attach` attaches one element with the
 * signal of a controller the ref makes for it, and may return more to undo. The cleanup the ref
 * returns aborts that controller, drops the element and runs that undo at once, and the kit keeps
 * the control a microtask after the last signal holding it aborts, as record 23 has it, so a ref
 * made afresh on every render, which React calls with the same element right after the old ref's
 * cleanup, keeps the control. React 19 never calls with null where the ref returned a cleanup, but
 * a helper written to merge refs before it does calls with null, dropping the cleanup, so a null
 * call lets every element go, since it does not say which left.
 */
export const useLiveRef = <Attached extends Element>(
    attach: (element: Attached, signal: AbortSignal) => (() => void) | undefined
): readonly [RefCallback<Attached>, ReadonlyMap<Attached, Held>] => {
    const [elements] = useState(() => new Map<Attached, Held>());
    const ref = useCallback(
        (element: Attached | null) => {
            if (!element) {
                for (const held of [...elements.values()]) held.down();
                return;
            }
            const already = elements.get(element);
            if (already) return already.down;
            const controller = new AbortController();
            const undo = attach(element, controller.signal);
            const held: Held = {
                signal: controller.signal,
                down: () => {
                    if (controller.signal.aborted) return;
                    controller.abort();
                    // Only this element's own attach is undone, so a down kept from an older one
                    // leaves a newer attach of the element alone.
                    if (elements.get(element) !== held) return;
                    elements.delete(element);
                    undo?.();
                },
            };
            elements.set(element, held);
            return held.down;
        },
        [attach, elements]
    );
    return [ref, elements] as const;
};
