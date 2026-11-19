import { createContext, type ReactNode, useCallback, useContext, useRef } from 'react';

import { attachStatus, type Say, type SayOptions } from './controls.js';

/*
 * The kit's React hooks, each a thin wrapper over an attach function from `./controls`, as decision
 * 20 has it: it attaches through a ref, keeps only the attach's handle, and returns what the attach
 * returns, the same across renders. `./react` exports them beside the markup, whose components run
 * no effect.
 */

/** What a status provider hands the parts of the page under it. */
const Speaker = createContext<Say | null>(null);

/** The props of a status provider. */
export type StatusProviderProps = {
    /** The part of the page that speaks on this line. */
    readonly children?: ReactNode;
};

/**
 * Draws a page's status line, out of sight and on the page from the first draw, and hands every
 * part of the page under it the function that says a message on it, through `useStatus`. The line
 * is the markup `StatusLine` draws, attached by `attachStatus` as it lands. Words said before it is
 * attached, as a child's own effect can, since a provider's effects run after its children's, are
 * held and said once it is, the last of them alone, as a later message replaces an earlier one. A
 * provider inside another, as in a dialog, takes the calls of the parts under it on a line of its
 * own.
 */
export const StatusProvider = ({ children }: StatusProviderProps) => {
    const handle = useRef<Say | null>(null);
    const held = useRef<readonly [string, SayOptions | undefined] | null>(null);
    const line = useCallback((element: HTMLParagraphElement | null) => {
        if (!element) {
            handle.current = null;
            return;
        }
        handle.current = attachStatus(element);
        const waiting = held.current;
        held.current = null;
        if (waiting) handle.current(...waiting);
    }, []);
    const speak = useCallback<Say>((message, options) => {
        if (handle.current) handle.current(message, options);
        else held.current = [message, options];
    }, []);
    return (
        <Speaker.Provider value={speak}>
            <p ref={line} className="dk-visually-hidden" role="status" />
            {children}
        </Speaker.Provider>
    );
};

/**
 * The function that says a message on the status line of the nearest `StatusProvider` above, the
 * same across renders. A part of a page with no provider above it throws, since its words would
 * reach no one.
 */
export const useStatus = (): Say => {
    const speak = useContext(Speaker);
    if (!speak) throw new Error('useStatus needs a StatusProvider above it');
    return speak;
};
