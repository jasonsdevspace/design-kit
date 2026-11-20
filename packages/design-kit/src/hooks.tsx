'use client';

import {
    createContext,
    type ReactNode,
    type RefCallback,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useReducer,
    useRef,
} from 'react';

import {
    activeOf,
    attachBusy,
    attachForm,
    attachProgress,
    attachRoving,
    attachStatus,
    type BusyOptions,
    type Failure,
    focusOnArrival,
    type FocusTarget,
    type FormOptions,
    moveFocus,
    type MoveFocusOptions,
    type ProgressOptions,
    type Refuse,
    type RovingOptions,
    type Say,
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
 * page are held, the last firm and the last polite, and said in order once it is, so polite words
 * wait behind firm words as they would on the line, and words said once it has gone are dropped. A
 * provider inside another, as inside a dialog, takes the calls of the parts under it on a line of
 * its own, so the provider sits inside the dialog element itself.
 */
export const StatusProvider = ({ children }: StatusProviderProps) => {
    const handle = useRef<Say | null>(null);
    const held = useRef<Parameters<Say>[]>([]);
    const gone = useRef(false);
    const line = useCallback((element: HTMLParagraphElement | null) => {
        if (!element) {
            handle.current = null;
            held.current = [];
            gone.current = true;
            return;
        }
        gone.current = false;
        handle.current = attachStatus(element);
        const [first, ...later] = held.current;
        held.current = [];
        if (first) handle.current(...first);
        // Each later message in a moment of its own, as each was said apart from the first, so
        // polite words wait behind firm words rather than giving way as to a result said with them.
        const said = handle.current;
        for (const call of later)
            window.setTimeout(() => {
                said(...call);
            });
    }, []);
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

/** Moves focus to a control once the change that asked for it is drawn, as `moveFocus` does. */
export type FocusAfterDraw = (target: FocusTarget, options?: MoveFocusOptions) => () => void;

/** Makes a request once the render it was asked in commits, and returns what calls it off. */
type AfterCommit = (request: () => () => void) => () => void;

/** A request owed until its owner commits, and what calls it off once it is made. */
type Owed = { readonly make: () => () => void; made: boolean; cancel: (() => void) | null };

/**
 * What makes a request once the render it was asked in commits, the same across renders, for the
 * hooks whose request reads what the page draws. React draws state set after an await in a task of
 * its own, which a frame can come before, so a request made at once would find a control not yet
 * drawn or still off, or a field not yet in error. Asking renders the owner in the same batch as
 * the page's change, and a layout effect makes the request once that render commits, so it lands
 * in the frame that paints the change. Each request takes the place of one not yet landed, and what
 * it returns calls off that request alone, so a stale one never calls off a newer. A request made
 * once the owner has unmounted has no render to wait for and is made at once, and one not yet
 * landed as the owner unmounts is called off.
 */
const useAfterCommit = (): AfterCommit => {
    const latest = useRef<Owed | null>(null);
    const mounted = useRef(false);
    const [asked, ask] = useReducer((count: number) => count + 1, 0);
    useLayoutEffect(() => {
        const owed = latest.current;
        if (!owed || owed.made) return;
        owed.made = true;
        owed.cancel = owed.make();
    }, [asked]);
    useLayoutEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            latest.current?.cancel?.();
            latest.current = null;
        };
    }, []);
    return useCallback<AfterCommit>((make) => {
        latest.current?.cancel?.();
        const owed: Owed = { make, made: false, cancel: null };
        latest.current = owed;
        if (mounted.current) ask();
        else {
            owed.made = true;
            owed.cancel = make();
        }
        return () => {
            owed.made = true;
            owed.cancel?.();
            if (latest.current === owed) latest.current = null;
        };
    }, []);
};

/**
 * The function that moves focus to a control once the change asking for it is drawn, the same
 * across renders, by `moveFocus`: to an element or an id, with fallbacks where it is gone, and
 * never from where a visitor has moved focus, read as focus stood when it was asked, inside a
 * shadow root too. It is called in the press or key handler that makes the change, after an await
 * in it too, or in an effect with dependencies once a change React draws later is drawn, never as
 * the component renders nor in an effect that runs on every render, since asking renders the
 * component again. A change made in a transition is asked for inside the same `startTransition`,
 * so the request waits for the render that draws it. A change drawn in another React root is not
 * waited for. Each call is a new request that takes the place of one not yet landed, so the last
 * asked for wins, and returns what calls that request off. A request not yet landed when the
 * component unmounts is called off, and one asked for after it has unmounted is made at once.
 */
export const useFocusAfterDraw = (): FocusAfterDraw => {
    const afterCommit = useAfterCommit();
    return useCallback<FocusAfterDraw>(
        (target, options) => {
            const from = options?.from === undefined ? activeOf() : options.from;
            return afterCommit(() => moveFocus(target, { ...options, from }));
        },
        [afterCommit]
    );
};

/** What a view's arrival is told apart by, compared by value, such as a round's number. */
export type ArrivalKey = string | number | boolean | null | undefined;

/**
 * A ref for what a view's arrival focuses, such as its heading, which takes focus when a visitor's
 * press or submit brings the view, so a screen reader says where they are: when the key given
 * changes, such as the round on screen, and when a view is drawn by a press, as a tab bar's view
 * is, by `focusOnArrival`. It never moves focus as the page first draws, nor as a visitor moves
 * along a row of tabs with the arrow keys or Tabs past, nor from focus the view placed itself as it
 * drew, as a field with autofocus does, nor from where a visitor has moved it, and a view gone in
 * the frame it arrived in moves nothing. The key is a string, a number or a boolean, compared by
 * value, so a key drawn again with the same value moves nothing. A heading, or any element that
 * cannot take focus by itself, takes a tabindex of -1 where it has none, so it can take focus at
 * all, and a button, a link or a field keeps its place in the Tab order. The key changes on a
 * visitor's press or submit, never as they choose in a list or a set of radios, which would move
 * them as they choose.
 */
export const useArrivalFocus = <Heading extends HTMLElement>(
    key: ArrivalKey
): RefCallback<Heading> => {
    const heading = useRef<Heading | null>(null);
    const seen = useRef<{ readonly key: ArrivalKey; readonly first: boolean } | null>(null);
    // Where focus was as the change began, read as the view draws, before anything in it can take
    // focus, so a field the view focuses itself is not taken for the visitor's own place.
    const from = useRef<Element | null>(null);
    if (
        (seen.current === null || !Object.is(seen.current.key, key)) &&
        typeof document !== 'undefined'
    )
        from.current = document.activeElement;
    // Asks once for each key, since the effect runs again only when the key changes: as the view
    // first draws, by whether a press brought it, and as its key changes, whatever the last input,
    // since the page changes it on a press. The request is called off as the effect is cleaned up,
    // so React's second run in development asks again and a view gone before its frame moves
    // nothing.
    useEffect(() => {
        // Run again with the same key, as React runs a new effect twice in development, a first
        // draw is still one.
        const first =
            seen.current === null || (seen.current.first && Object.is(seen.current.key, key));
        seen.current = { key, first };
        // A key that changes joins the views a press draws, so the first in the page still takes
        // focus, and spends the press, so no view drawn later takes it again.
        return focusOnArrival(() => heading.current, { from: from.current, changed: !first });
    }, [key]);
    return useCallback((element: Heading | null) => {
        heading.current = element;
        // Only an element that cannot take focus by itself, such as a heading or a link with no
        // address, so a button, a link or a field keeps its place in the Tab order.
        const takes =
            element !== null &&
            element.tabIndex >= 0 &&
            !element.matches('a:not([href]), area:not([href])');
        if (element && !element.hasAttribute('tabindex') && !takes) element.tabIndex = -1;
    }, []);
};

/**
 * A ref for a form and what refuses its submit, by `attachForm`: called once the page has set the
 * errors, it waits for the render that draws them, then moves focus to the summary or the first
 * field in error and says once, on the status line of the nearest `StatusProvider` or through the
 * `say` given, that field's name and error, or nothing over a summary, as `attachForm` has it.
 * It is called in the submit handler, after an await in it too, or in an effect with dependencies,
 * never as the component renders nor in an effect that runs on every render, since refusing renders
 * the component again. Errors set in a transition are refused inside the same `startTransition`, so
 * the refusal waits for the render that draws them, and errors drawn in another React root are not
 * waited for. Where focus was is read as the refusal is asked for, so a visitor who moves focus
 * before the errors are drawn is not pulled back. The summary is read as the refusal lands, so a
 * function written inline on every render is never set again. What refuses stays the same across
 * renders, does nothing until the form is drawn, and returns what calls that refusal off, never a
 * later one, which unmounting does too. A form with no provider above it and no `say` throws, since
 * its refusal would reach no one. A submit whose fields fail the browser's constraints is stopped
 * before the page's handler, and the failures are handed to `invalid`, which the page must give,
 * since the markup is its own: it sets the page's errors from them, and the refusal follows once
 * they are drawn. `invalid` is called only for a submit that fails, so the page's own submit
 * handler clears the errors it set. `errorWords` gives the words for each failure in place of the
 * kit's, read as each is put in words.
 */
export const useFormRefusal = <Form extends HTMLElement>(
    options: Pick<FormOptions, 'say' | 'summary' | 'errorWords'> & {
        readonly invalid: NonNullable<FormOptions['invalid']>;
    }
): readonly [RefCallback<Form>, Refuse] => {
    const speaker = useContext(Speaker);
    if (!speaker && !options.say)
        throw new Error('useFormRefusal needs a StatusProvider above it, or a say of its own');
    const latest = useRef({ options, speaker });
    useLayoutEffect(() => {
        latest.current = { options, speaker };
    });
    const refuser = useRef<Refuse | null>(null);
    const afterCommit = useAfterCommit();
    // Where focus was as the refusal was asked for, not as the render that draws the errors
    // commits, so a visitor who moved it since is not pulled back.
    const refuse = useCallback<Refuse>(
        (asked) => {
            const from = asked?.from === undefined ? activeOf() : asked.from;
            return afterCommit(() => refuser.current?.({ from }) ?? (() => undefined));
        },
        [afterCommit]
    );
    const ref = useCallback(
        (form: Form | null) => {
            refuser.current = form
                ? attachForm(form, {
                      say: (words, settle) => {
                          const { options: now, speaker: line } = latest.current;
                          (now.say ?? line)?.(words, settle);
                      },
                      summary: () => latest.current.options.summary?.() ?? null,
                      // Read as each failure is put in words, so words written inline on every
                      // render are never set again.
                      errorWords: new Proxy(
                          {},
                          {
                              get: (_, failure) =>
                                  typeof failure === 'string'
                                      ? latest.current.options.errorWords?.[failure as Failure]
                                      : undefined,
                          }
                      ),
                      // A refusal of its own, made once the errors the page sets are drawn.
                      invalid: (failures) => {
                          latest.current.options.invalid(failures);
                          refuse();
                      },
                  })
                : null;
        },
        [refuse]
    );
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

/**
 * A ref for a button that can be busy, which `attachBusy` makes ignore presses while busy and say
 * its busy words once the wait outlasts --dk-wait, on the status line of the nearest
 * `StatusProvider`, or through the `say` given. The `Button` drawn with `busy` marks it. A button
 * swapped for another is let go and the new one attached, and with no provider above it and no
 * `say`, it throws, since its words would reach no one.
 */
export const useBusy = <Busy extends HTMLElement>(
    options: Pick<BusyOptions, 'say'> = {}
): RefCallback<Busy> => {
    const speaker = useContext(Speaker);
    if (!speaker && !options.say)
        throw new Error('useBusy needs a StatusProvider above it, or a say of its own');
    const latest = useRef({ options, speaker });
    useEffect(() => {
        latest.current = { options, speaker };
    });
    const detach = useRef<(() => void) | null>(null);
    return useCallback((button: Busy | null) => {
        detach.current?.();
        detach.current = button
            ? attachBusy(button, {
                  say: (words, settle) => {
                      const { options: now, speaker: line } = latest.current;
                      (now.say ?? line)?.(words, settle);
                  },
              })
            : null;
    }, []);
};

/**
 * A ref for a `progress` element, which `attachProgress` says at the steps given, each quarter
 * until a page gives others, and once at the end, or the `done` words in its place, on the status
 * line of the nearest `StatusProvider` or through the `say` given, politely, as the status line's
 * policy has it. New steps or `done` words are passed to the attach only when they change. A bar
 * swapped for another is let go and the new one attached, and with no provider above it and no
 * `say`, it throws, since its words would reach no one.
 */
export const useProgress = (
    options: Pick<ProgressOptions, 'say' | 'steps' | 'done'> = {}
): RefCallback<HTMLProgressElement> => {
    const speaker = useContext(Speaker);
    if (!speaker && !options.say)
        throw new Error('useProgress needs a StatusProvider above it, or a say of its own');
    const latest = useRef({ options, speaker });
    useEffect(() => {
        latest.current = { options, speaker };
    });
    const bar = useRef<HTMLProgressElement | null>(null);
    const detach = useRef<(() => void) | null>(null);
    const { steps, done } = options;
    const given = useRef({ steps, done });
    const optionsFor = useCallback(
        (next: { steps: number | undefined; done: string | undefined }): ProgressOptions => ({
            ...next,
            say: (words, how) => {
                const { options: now, speaker: line } = latest.current;
                (now.say ?? line)?.(words, how);
            },
        }),
        []
    );
    useEffect(() => {
        if (given.current.steps === steps && given.current.done === done) return;
        given.current = { steps, done };
        if (bar.current) attachProgress(bar.current, optionsFor(given.current));
    }, [steps, done, optionsFor]);
    return useCallback(
        (progress: HTMLProgressElement | null) => {
            detach.current?.();
            bar.current = progress;
            detach.current = progress ? attachProgress(progress, optionsFor(given.current)) : null;
        },
        [optionsFor]
    );
};
