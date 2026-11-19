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
    attachForm,
    attachRoving,
    attachStatus,
    type FocusTarget,
    type FormOptions,
    moveFocus,
    type MoveFocusOptions,
    type Refuse,
    type RovingOptions,
    type Say,
    type SayOptions,
} from './controls.js';

/*
 * The kit's React hooks, each a thin wrapper over a function from `./controls`, as decision 20 has
 * it: one over an attach attaches through a ref and keeps only the attach's handle, one over a
 * function that acts once keeps only what calls it off, and each returns what the function returns,
 * the same across renders. `./react` exports them beside the markup, whose components run
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
export type FocusAfterDraw = (target: FocusTarget, options?: MoveFocusOptions) => () => void;

/**
 * The function that moves focus to a control once the change asking for it is drawn, the same
 * across renders, by `moveFocus`: to an element or an id, with fallbacks where it is gone, and
 * never from where a visitor has moved focus. It is called in the press or key handler that makes
 * the change, or in an effect once a change React draws later is drawn. Each call is a new request
 * that takes the place of one not yet landed, so the last asked for wins, and returns what calls it
 * off. A request not yet landed when the component unmounts is called off.
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
        waiting.current?.();
        const cancel = moveFocus(target, options);
        waiting.current = cancel;
        return cancel;
    }, []);
};

/** What a view's arrival is told apart by, compared by value, such as a round's number. */
export type ArrivalKey = string | number | boolean | null | undefined;

/** Whether a visitor has pressed or typed on the page yet, so a first draw can be told apart. */
let acted = false;
const listenForAction = () => {
    if (acted || typeof document === 'undefined') return;
    const heard = (event: Event) => {
        if (!event.isTrusted) return;
        acted = true;
        for (const type of ['pointerdown', 'keydown'] as const)
            document.removeEventListener(type, heard, true);
    };
    for (const type of ['pointerdown', 'keydown'] as const)
        document.addEventListener(type, heard, true);
};

/**
 * A ref for a view's heading, which takes focus when a visitor's action brings the view, so a
 * screen reader says where they are: when the key given changes, such as the round on screen, and
 * when a view is drawn after the visitor has pressed or typed, as a tab's view is. It never moves
 * focus as the page first draws, nor from focus the view placed itself as it drew, as a field with
 * autofocus does, nor from where a visitor has moved it. The key is a string, a number or a
 * boolean, compared by value, so a key drawn again with the same value moves nothing. The heading
 * takes a tabindex of -1 where it has none, so it can take focus at all. The key changes on a
 * visitor's press or submit, never as they choose in a list or a set of radios, which would move
 * them as they choose.
 */
export const useArrivalFocus = <Heading extends HTMLElement>(
    key: ArrivalKey
): RefCallback<Heading> => {
    listenForAction();
    const heading = useRef<Heading | null>(null);
    const seen = useRef<{ readonly key: ArrivalKey } | null>(null);
    // Where focus was as the change began, read as the view draws, before anything in it can take
    // focus, so a field the view focuses itself is not taken for the visitor's own place.
    const from = useRef<Element | null>(null);
    if (
        (seen.current === null || !Object.is(seen.current.key, key)) &&
        typeof document !== 'undefined'
    )
        from.current = document.activeElement;
    // The page's first draw is told by whether the visitor had acted when the view was first drawn.
    const arrivedByAction = useRef(acted);
    useEffect(() => {
        const first = seen.current === null;
        if (!first && Object.is(seen.current?.key, key)) return;
        seen.current = { key };
        if (first && !arrivedByAction.current) return;
        // Not called off as the effect is cleaned up, so React's second run of a new effect in
        // development, which finds the key already seen, leaves the request to land.
        moveFocus(heading.current, { from: from.current });
    }, [key]);
    return useCallback((element: Heading | null) => {
        heading.current = element;
        if (element && !element.hasAttribute('tabindex')) element.tabIndex = -1;
    }, []);
};

/**
 * A ref for a form and what refuses its submit, by `attachForm`: called once the page has drawn the
 * errors, it moves focus to the summary or the first field in error and says the refusal once, on
 * the status line of the nearest `StatusProvider`, or through the `say` given. The summary is read
 * as the refusal lands, so a function written inline on every render is never set again. What
 * refuses stays the same across renders, and does nothing until the form is drawn.
 */
export const useFormRefusal = <Form extends HTMLElement>(
    options: Pick<FormOptions, 'say' | 'summary'> = {}
): readonly [RefCallback<Form>, Refuse] => {
    const speaker = useContext(Speaker);
    const latest = useRef({ options, speaker });
    useEffect(() => {
        latest.current = { options, speaker };
    });
    const refuser = useRef<Refuse | null>(null);
    const ref = useCallback((form: Form | null) => {
        refuser.current = form
            ? attachForm(form, {
                  say: (words, settle) => {
                      const { options: now, speaker: line } = latest.current;
                      (now.say ?? line)?.(words, settle);
                  },
                  summary: () => latest.current.options.summary?.() ?? null,
              })
            : null;
    }, []);
    const refuse = useCallback<Refuse>(() => {
        refuser.current?.();
    }, []);
    return [ref, refuse] as const;
};

/**
 * A ref for a group of cells, such as a grid of buttons or a row of tabs, which `attachRoving`
 * gives one stop for the Tab key and the arrow keys, Home and End. The page's `current` and
 * `onMove` are read as the keys land, so functions written inline on every render are never set
 * again, and the group is attached again only when its orientation, or whether it names a current
 * cell, changes. A group swapped for another is let go and the new one attached, and the group is
 * let go when the component unmounts.
 */
export const useRoving = <Group extends HTMLElement>(
    options: RovingOptions = {}
): RefCallback<Group> => {
    const latest = useRef(options);
    useEffect(() => {
        latest.current = options;
    });
    const group = useRef<Group | null>(null);
    const detach = useRef<(() => void) | null>(null);
    const wired = useCallback(
        (): RovingOptions => ({
            orientation: latest.current.orientation,
            current: latest.current.current ? () => latest.current.current?.() ?? null : undefined,
            onMove: (cell) => {
                latest.current.onMove?.(cell);
            },
        }),
        []
    );
    const { orientation } = options;
    const names = options.current !== undefined;
    // What the group was last attached with, so it is attached again only when that changes.
    const shape = useRef<string | null>(null);
    useEffect(() => {
        const now = `${orientation ?? ''}|${String(names)}`;
        if (!group.current || shape.current === now) return;
        shape.current = now;
        attachRoving(group.current, wired());
    }, [orientation, names, wired]);
    return useCallback(
        (element: Group | null) => {
            if (element === group.current) return;
            detach.current?.();
            detach.current = null;
            group.current = element;
            if (!element) return;
            const now = latest.current;
            shape.current = `${now.orientation ?? ''}|${String(now.current !== undefined)}`;
            detach.current = attachRoving(element, wired());
        },
        [wired]
    );
};
