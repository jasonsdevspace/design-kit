'use client';

import {
    createContext,
    type ReactNode,
    type RefCallback,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
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
 * no effect. Each ref makes an `AbortController` as its element arrives, hands its attach the
 * signal, as record 22 has every attach take, and returns the cleanup that aborts it, which React
 * 19 calls as the element leaves in place of calling the ref with null. The kit takes the control
 * down a microtask after the last signal holding it aborts, as record 23 has it, so a ref made
 * afresh on every render, a ref that merges two hooks and React's second run in development keep
 * it, and two hooks on one element each hold it.
 */

/** An element a hook holds: the signal its attach was given, and what takes its part down. */
type Held = { readonly signal: AbortSignal; readonly down: () => void };

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
const useLiveRef = <Attached extends Element>(
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
const useSpeaker = (name: string, say: Say | undefined): Say => {
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

/** Moves focus to a control once the change that asked for it is drawn, as `moveFocus` does. */
export type FocusAfterDraw = (target: FocusTarget, options?: MoveFocusOptions) => () => void;

/**
 * Makes a request once the render it was asked in commits, and returns what calls it off. The
 * request is told whether it is made late, once its owner has gone, and may then give null, which
 * keeps it held until the owner's effects come back.
 */
type AfterCommit = (request: (late: boolean) => (() => void) | null) => () => void;

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
const useAfterCommit = (landsAtUnmount: boolean): AfterCommit => {
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

/**
 * The function that moves focus to a control once the change asking for it is drawn, the same
 * across renders, by `moveFocus`: to an element or an id, with fallbacks where it is gone, and
 * never from where a visitor has moved focus, read as focus stood when it was asked, inside a
 * shadow root too. It is called in the press or key handler that makes the change, after an await
 * in it too, or in an effect with dependencies once a change React draws later is drawn, never as
 * the component renders nor in an effect that runs on every render, since asking renders the
 * component again. A change made in a transition is asked for inside the same `startTransition`, so
 * the request waits for the render that draws it. A change drawn in another React root is not
 * waited for. Each call is a new request that takes the place of one not yet landed, so the last
 * asked for wins, and returns what calls that request off, which is all that does: nothing at
 * unmount calls a request off. One still waiting when the component unmounts, or when an `Activity`
 * hides it, is made then, with where focus was read as it was asked, so a row that asks for focus
 * on the next one as it is removed moves focus there, after an await, from a timer or in a
 * transition too, and `moveFocus` lands it only where focus is still there or has fallen to the
 * page's body. A request in a transition an urgent update overtook lands before the transition
 * draws, so it goes to its fallbacks where the transition draws its target. One asked after the
 * component has gone, as a panel that closes and then asks after an await, waits a frame and is
 * made late, taking focus only from the page's body, whatever `from` it was given, and only where
 * its target is in sight, so one whose target an `Activity` hides with the component is held until
 * it shows. A late request still finds an id, its target's or a fallback's, in the root where focus
 * was as it was asked, or where the `from` it was given is. Focus has most often fallen to the
 * page's body by then, so a widget drawn inside a shadow root passes `from`, an element still in
 * that root, to find its own control, and with no `from` an id is found there only while focus is
 * still in that root.
 */
export const useFocusAfterDraw = (): FocusAfterDraw => {
    const afterCommit = useAfterCommit(true);
    return useCallback<FocusAfterDraw>(
        (target, options) => {
            const from = options?.from === undefined ? activeOf() : options.from;
            // The root focus was in, read as the request is asked, since a late request is made
            // with no place focus was, which is where `moveFocus` would look for an id.
            const root = from?.getRootNode();
            const within = (place: FocusTarget): FocusTarget =>
                typeof place === 'string' && root instanceof ShadowRoot
                    ? () => root.getElementById(place)
                    : place;
            // No signal tied to the component goes with the request, since the unmount that makes
            // a request still waiting would abort it too, so it is called off only by what
            // moveFocus returns.
            return afterCommit((late) => {
                if (!late) return moveFocus(target, { ...options, from });
                const found = within(target);
                return inSight(found)
                    ? moveFocus(found, {
                          ...options,
                          fallbacks: options?.fallbacks?.map(within),
                          from: null,
                      })
                    : null;
            });
        },
        [afterCommit]
    );
};

/**
 * Whether a request's target is drawn and in sight now, as `moveFocus` finds it, so a late request
 * waits for a target an Activity hides rather than going to the fallbacks.
 */
const inSight = (target: FocusTarget): boolean => {
    const place =
        typeof target === 'string'
            ? document.getElementById(target)
            : typeof target === 'function'
              ? target()
              : target;
    return place instanceof Element && place.isConnected && place.checkVisibility();
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
    // focus, so a field the view focuses itself is not taken for the visitor's own place. Read
    // into each shadow root that holds it, as the request compares it when it lands, so a press
    // inside one is not taken for focus the visitor moved.
    const from = useRef<Element | null>(null);
    if (
        (seen.current === null || !Object.is(seen.current.key, key)) &&
        typeof document !== 'undefined'
    )
        from.current = activeOf();
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
    const attachHeading = useCallback((element: Heading) => {
        heading.current = element;
        // Only an element that cannot take focus by itself, such as a heading or a link with no
        // address, so a button, a link or a field keeps its place in the Tab order.
        const takes = element.tabIndex >= 0 && !element.matches('a:not([href]), area:not([href])');
        if (!element.hasAttribute('tabindex') && !takes) element.tabIndex = -1;
        return () => {
            if (heading.current === element) heading.current = null;
        };
    }, []);
    return useLiveRef(attachHeading)[0];
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
    const say = useSpeaker('useFormRefusal', options.say);
    const latest = useRef(options);
    useLayoutEffect(() => {
        latest.current = options;
    });
    // What refuses through each form attached now, the newest last, so one ref on two forms keeps
    // refusing through the one left as the other goes.
    const [refusers] = useState(() => new Map<Form, Refuse>());
    // A refusal still waiting as the form's component unmounts is called off, since the form it
    // would point at and speak for is leaving with it.
    const afterCommit = useAfterCommit(false);
    // Where focus was as the refusal was asked for, not as the render that draws the errors
    // commits, so a visitor who moved it since is not pulled back.
    const refuseThrough = useCallback(
        (pick: () => Refuse | undefined): Refuse =>
            (asked) => {
                const from = asked?.from === undefined ? activeOf() : asked.from;
                return afterCommit(() => pick()?.({ from }) ?? (() => undefined));
            },
        [afterCommit]
    );
    // The page's own refusal goes through the newest form attached, and each form's own failed
    // submit through that form.
    const refuse = useMemo(
        () => refuseThrough(() => [...refusers.values()].at(-1)),
        [refuseThrough, refusers]
    );
    const attachOne = useCallback(
        (form: Form, signal: AbortSignal) => {
            const handle = attachForm(form, {
                signal,
                say,
                summary: () => latest.current.summary?.() ?? null,
                // Read as each failure is put in words, so words written inline on every render are
                // never set again.
                errorWords: new Proxy(
                    {},
                    {
                        get: (_, failure) =>
                            typeof failure === 'string'
                                ? latest.current.errorWords?.[failure as Failure]
                                : undefined,
                    }
                ),
                // A refusal of its own, made once the errors the page sets are drawn.
                invalid: (failures) => {
                    latest.current.invalid(failures);
                    refuseThrough(() => refusers.get(form))();
                },
            });
            refusers.set(form, handle);
            return () => {
                refusers.delete(form);
            };
        },
        [say, refuseThrough, refusers]
    );
    const [ref] = useLiveRef(attachOne);
    return [ref, refuse] as const;
};

/**
 * A ref for a group of cells, such as a grid of buttons or a row of tabs, which `attachRoving`
 * gives one stop for the Tab key and the arrow keys, Home and End. The page's `current` and
 * `onMove` are read as the keys land, so functions written inline on every render are never set
 * again, and the group is attached again only when its orientation, or whether it names a current
 * cell, changes. A group swapped for another is taken down and the new one attached, and the group
 * is taken down when the component unmounts.
 */
export const useRoving = <Group extends HTMLElement>(
    options: RovingOptions = {}
): RefCallback<Group> => {
    const latest = useRef(options);
    useEffect(() => {
        latest.current = options;
    });
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
    const attachOne = useCallback(
        (element: Group, signal: AbortSignal) => {
            const now = latest.current;
            shape.current = `${now.orientation ?? ''}|${String(now.current !== undefined)}`;
            attachRoving(element, { ...wired(), signal });
            return undefined;
        },
        [wired]
    );
    const [ref, groups] = useLiveRef(attachOne);
    // Every group attached now takes the new options, so one ref on two groups keeps both. Each is
    // attached with its own signal, so the options are this hook's where another hook shares the
    // group.
    useEffect(() => {
        const now = `${orientation ?? ''}|${String(names)}`;
        if (groups.size === 0 || shape.current === now) return;
        shape.current = now;
        for (const [group, { signal }] of groups) attachRoving(group, { ...wired(), signal });
    }, [orientation, names, wired, groups]);
    return ref;
};

/**
 * A ref for a button that can be busy, which `attachBusy` makes ignore presses while busy and say
 * its busy words once the wait outlasts --dk-wait, on the status line of the nearest
 * `StatusProvider`, or through the `say` given. The `Button` drawn with `busy` marks it. A button
 * swapped for another is taken down and the new one attached, and with no provider above it and no
 * `say`, it throws, since its words would reach no one.
 */
export const useBusy = <Busy extends HTMLElement>(
    options: Pick<BusyOptions, 'say'> = {}
): RefCallback<Busy> => {
    const say = useSpeaker('useBusy', options.say);
    const attachOne = useCallback(
        (button: Busy, signal: AbortSignal) => {
            attachBusy(button, { say, signal });
            return undefined;
        },
        [say]
    );
    return useLiveRef(attachOne)[0];
};

/**
 * A ref for a `progress` element, which `attachProgress` says at the steps given, each quarter
 * until a page gives others, and once at the end, or the `done` words in its place, on the status
 * line of the nearest `StatusProvider` or through the `say` given, politely, as the status line's
 * policy has it. New steps or `done` words are passed to the attach only when they change. A bar
 * swapped for another is taken down and the new one attached, and with no provider above it and no
 * `say`, it throws, since its words would reach no one.
 */
export const useProgress = (
    options: Pick<ProgressOptions, 'say' | 'steps' | 'done'> = {}
): RefCallback<HTMLProgressElement> => {
    const say = useSpeaker('useProgress', options.say);
    const { steps, done } = options;
    const given = useRef({ steps, done });
    const optionsFor = useCallback(
        (next: { steps: number | undefined; done: string | undefined }): ProgressOptions => ({
            ...next,
            say,
        }),
        [say]
    );
    const attachOne = useCallback(
        (progress: HTMLProgressElement, signal: AbortSignal) => {
            attachProgress(progress, { ...optionsFor(given.current), signal });
            return undefined;
        },
        [optionsFor]
    );
    const [ref, bars] = useLiveRef(attachOne);
    // Every bar attached now takes the new steps or words, so one ref on two bars keeps both, each
    // with its own signal, so the options are this hook's where another hook shares the bar.
    useEffect(() => {
        if (given.current.steps === steps && given.current.done === done) return;
        given.current = { steps, done };
        for (const [bar, { signal }] of bars)
            attachProgress(bar, { ...optionsFor(given.current), signal });
    }, [steps, done, optionsFor, bars]);
    return ref;
};
