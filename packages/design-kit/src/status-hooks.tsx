'use client';

import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useLayoutEffect,
    useRef,
} from 'react';

import { attachStatus, type Say } from './controls.js';
import { useLiveRef } from './hook-ref.js';

/*
 * The status line the hooks that speak say their words on: the provider that draws it, the
 * function that says on it, and what a hook that speaks hands its attach. A page that keeps only a
 * status line imports this module and none of the other hooks.
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
 * page are held, the last firm and the last polite, and said in order once it is, so polite words
 * wait behind firm words as they would on the line, and words said once it has gone are dropped. A
 * provider inside another, as inside a dialog, takes the calls of the parts under it on a line of
 * its own, so the provider sits inside the dialog element itself.
 */
export const StatusProvider = ({ children }: StatusProviderProps) => {
    const handle = useRef<Say | null>(null);
    const held = useRef<Parameters<Say>[]>([]);
    const gone = useRef(false);
    const drawn = useRef<HTMLParagraphElement | null>(null);
    // The moments set to say held words, called off if the line goes before they come.
    const later = useRef<number[]>([]);
    const attachLine = useCallback((element: HTMLParagraphElement, signal: AbortSignal) => {
        gone.current = false;
        drawn.current = element;
        // React's second run in development aborts the line's signal and attaches it again in one
        // commit, so the attach joins the line's control before its takedown lands and returns the
        // same function, its words kept.
        handle.current = attachStatus(element, { signal });
        const [first, ...rest] = held.current;
        held.current = [];
        if (first) handle.current(...first);
        // Each later message in a moment of its own, as each was said apart from the first, so
        // polite words wait behind firm words rather than giving way as to a result said with them.
        later.current = [
            ...later.current,
            ...rest.map((call) =>
                window.setTimeout(() => {
                    handle.current?.(...call);
                })
            ),
        ];
        return () => {
            drawn.current = null;
            handle.current = null;
            held.current = [];
            gone.current = true;
            // The moments set for held words say them on whichever line is attached as they come,
            // so they outlast the second run, which draws a line again in the same commit, and are
            // called off a microtask later where no line is drawn by then.
            queueMicrotask(() => {
                if (drawn.current) return;
                for (const timer of later.current) window.clearTimeout(timer);
                later.current = [];
            });
        };
    }, []);
    const [line] = useLiveRef(attachLine);
    const speak = useCallback<Say>((message, options) => {
        if (handle.current) handle.current(message, options);
        else if (!gone.current) {
            // The last firm and the last polite words alone, in the order said, since each takes
            // the place of the one before it of its kind as it would on the line.
            const polite = Boolean(options?.polite);
            held.current = [
                ...held.current.filter(([, given]) => Boolean(given?.polite) !== polite),
                [message, options],
            ];
        }
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

/**
 * The function a hook that speaks hands its attach, the same across renders, which says through the
 * page's `say` where it gives one, else on the status line of the nearest `StatusProvider`. Both
 * are kept current in a layout effect, since a form's refusal is made in one and speaks through the
 * latest. A hook with neither throws, naming itself, since its words would reach no one.
 */
export const useSpeaker = (name: string, say: Say | undefined): Say => {
    const speaker = useContext(Speaker);
    if (!speaker && !say)
        throw new Error(`${name} needs a StatusProvider above it, or a say of its own`);
    const latest = useRef(say ?? speaker);
    useLayoutEffect(() => {
        latest.current = say ?? speaker;
    });
    return useCallback<Say>((words, how) => {
        latest.current?.(words, how);
    }, []);
};
