'use client';

import { useCallback, useLayoutEffect, useReducer, useRef } from 'react';

/*
 * What makes a hook's request once the render it was asked in commits, shared by the hooks that
 * move focus and the form's refusal.
 */

/**
 * Makes a request once the render it was asked in commits, and returns what calls it off. The
 * request is told whether it is made late, once its owner has gone, and may then give null, which
 * keeps it held until the owner's effects come back.
 */
export type AfterCommit = (request: (late: boolean) => (() => void) | null) => () => void;

/** A request owed until its owner commits, and what calls it off once it is made. */
type Owed = {
    readonly make: (late: boolean) => (() => void) | null;
    made: boolean;
    cancel: (() => void) | null;
};

/**
 * What makes a request once the render it was asked in commits, the same across renders, for the
 * hooks whose request reads what the page draws. React draws state set after an await in a task of
 * its own, which a frame can come before, so a request made at once would find a control not yet
 * drawn or still off, or a field not yet in error. Asking renders the owner in the same batch as
 * the page's change, and a layout effect makes the request once that render commits, so it lands
 * in the frame that paints the change. Each request takes the place of one not yet landed, and what
 * it returns calls off that request alone, so a stale one never calls off a newer. One asked as the
 * owner first draws, from a ref on its own markup or a child's layout effect, waits for the owner's
 * render like any other.
 *
 * The owner's cleanup runs as it unmounts, as an `Activity` hides it, and in React's second run in
 * development, and React tells a hook nothing of which. Where `landsAtUnmount` is given, a request
 * still waiting then is made, since the render it waits for may never come, and nothing at the
 * cleanup calls a request off: only what it returned or a newer request does. It stays the latest,
 * so one made in the second run is still the one a newer request takes the place of. Where it is
 * not given, a request still waiting or not yet landed is called off a microtask later, unless the
 * owner's setup has run again by then, as the second run brings it.
 *
 * A request asked after the cleanup waits a frame. Where the owner's effects have come back by
 * then, it waits for the owner's render as any request does. Otherwise it is made late, and a late
 * request that gives null, as one whose target an Activity hides, stays held until the owner's
 * effects come back, when the layout effect makes it.
 */
export const useAfterCommit = (landsAtUnmount: boolean): AfterCommit => {
    const latest = useRef<Owed | null>(null);
    const life = useRef<'pending' | 'mounted' | 'gone'>('pending');
    const [asked, ask] = useReducer((count: number) => count + 1, 0);
    // Runs as each render that asked commits, and again as the owner's effects come back, so a
    // request held while the owner was hidden is made as it shows.
    useLayoutEffect(() => {
        const owed = latest.current;
        if (!owed || owed.made) return;
        owed.made = true;
        owed.cancel = owed.make(false);
    }, [asked]);
    useLayoutEffect(() => {
        life.current = 'mounted';
        return () => {
            life.current = 'gone';
            const owed = latest.current;
            if (landsAtUnmount) {
                if (owed && !owed.made) {
                    owed.made = true;
                    owed.cancel = owed.make(false);
                }
                return;
            }
            queueMicrotask(() => {
                if (life.current === 'mounted' || !owed) return;
                if (latest.current === owed) latest.current = null;
                owed.made = true;
                owed.cancel?.();
            });
        };
    }, [landsAtUnmount]);
    return useCallback<AfterCommit>((make) => {
        latest.current?.cancel?.();
        const owed: Owed = { make, made: false, cancel: null };
        latest.current = owed;
        if (life.current !== 'gone') ask();
        else
            window.requestAnimationFrame(() => {
                if (owed.made || latest.current !== owed) return;
                if (life.current !== 'gone') {
                    ask();
                    return;
                }
                const cancel = make(true);
                if (!cancel) return;
                owed.made = true;
                owed.cancel = cancel;
            });
        return () => {
            owed.made = true;
            owed.cancel?.();
            if (latest.current === owed) latest.current = null;
        };
    }, []);
};
