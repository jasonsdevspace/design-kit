'use client';

import {
    createContext,
    type ReactNode,
    type RefCallback,
    useCallback,
    useContext,
    useEffect,
    useRef,
} from 'react';

import {
    attachStatus,
    type FocusTarget,
    moveFocus,
    type MoveFocusOptions,
    type Say,
    type SayOptions,
} from './controls.js';

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
 * is the markup `StatusLine` draws, attached by `attachStatus` as it lands, before the effects of
 * the parts under it run, so their first effects are heard. Words said before the line is in the
 * page are held and said once it is, the last of them alone, as a later message replaces an earlier
 * one, and words said once it has gone are dropped. A provider inside another, as inside a dialog,
 * takes the calls of the parts under it on a line of its own, so the provider sits inside the
 * dialog element itself.
 */
export const StatusProvider = ({ children }: StatusProviderProps) => {
    const handle = useRef<Say | null>(null);
    const held = useRef<readonly [string, SayOptions | undefined] | null>(null);
    const gone = useRef(false);
    const line = useCallback((element: HTMLParagraphElement | null) => {
        if (!element) {
            handle.current = null;
            held.current = null;
            gone.current = true;
            return;
        }
        gone.current = false;
        handle.current = attachStatus(element);
        const waiting = held.current;
        held.current = null;
        if (waiting) handle.current(...waiting);
    }, []);
    const speak = useCallback<Say>((message, options) => {
        if (handle.current) handle.current(message, options);
        else if (!gone.current) held.current = [message, options];
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

/** Moves focus to a control once the change that asked for it is drawn, as `moveFocus` does. */
export type FocusAfterDraw = (target: FocusTarget, options?: MoveFocusOptions) => void;

/**
 * The function that moves focus to a control once the change asking for it is drawn, the same
 * across renders, by `moveFocus`: to an element or an id, with fallbacks where it is gone, and
 * never from where a visitor has moved focus. Each call is a new request, so the same control asked
 * for twice is focused twice. A request still waiting when the component unmounts is called off.
 */
export const useFocusAfterDraw = (): FocusAfterDraw => {
    const waiting = useRef<(() => void) | null>(null);
    useEffect(
        () => () => {
            waiting.current?.();
        },
        []
    );
    return useCallback<FocusAfterDraw>((target, options) => {
        waiting.current = moveFocus(target, options);
    }, []);
};

/**
 * A ref for a view's heading, which takes focus when the key given changes, such as the round on
 * screen, so a screen reader says where a visitor's action brought them. It never moves focus as
 * the page first draws, only when the key changes after, and leaves focus a visitor has moved
 * since. The heading takes a tabindex of -1 where it has none, so it can take focus at all.
 */
export const useArrivalFocus = <Heading extends HTMLElement>(
    key: unknown
): RefCallback<Heading> => {
    const heading = useRef<Heading | null>(null);
    const seen = useRef(key);
    useEffect(() => {
        if (Object.is(seen.current, key)) return undefined;
        seen.current = key;
        return moveFocus(heading.current);
    }, [key]);
    return useCallback((element: Heading | null) => {
        heading.current = element;
        if (element && !element.hasAttribute('tabindex')) element.tabIndex = -1;
    }, []);
};
