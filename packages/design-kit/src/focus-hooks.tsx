'use client';

import { type RefCallback, useCallback, useEffect, useRef } from 'react';

import { useAfterCommit } from './after-commit.js';
import { focusOnArrival, type FocusTarget, moveFocus, type MoveFocusOptions } from './controls.js';
import { useLiveRef } from './hook-ref.js';
import { byIdOutward, focusWas, hearClosed, pressedNear } from './request.js';

/*
 * The hooks that move focus, once the change that asks is drawn and as a view arrives. They make
 * their request after a commit by the module they share with the form's refusal, so a page that
 * moves focus and refuses no form sends no form code.
 */

/** Moves focus to a control once the change that asked for it is drawn, as `moveFocus` does. */
export type FocusAfterDraw = (target: FocusTarget, options?: MoveFocusOptions) => () => void;

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
 * was as it was asked, or where the `from` it was given is, then in each root around it out to the
 * page. Focus has most often fallen to the page's body by then, so a widget drawn inside a shadow
 * root passes `from`, an element still in that root, to find its own control, and with no `from` an
 * id is found there only while focus is still in that root.
 */
export const useFocusAfterDraw = (): FocusAfterDraw => {
    const afterCommit = useAfterCommit(true);
    return useCallback<FocusAfterDraw>(
        (target, options) => {
            // Read through the target where it is an element, the one target that is an object,
            // into a closed root it sits in.
            const { from, page } = focusWas(
                options?.from,
                typeof target === 'object' ? target : null
            );
            // Where focus was as the page sees it, read as the request is asked, since a late request
            // is made with no place focus was, which is where `moveFocus` would look for an id. An
            // id is looked for from there by the same walk `moveFocus` takes, in that root and then
            // in each root around it.
            const near = page ?? from;
            const within = (place: FocusTarget): FocusTarget =>
                typeof place === 'string' ? () => byIdOutward(near, place) : place;
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
            ? byIdOutward(null, target)
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
 * them as they choose. Inside a closed shadow root the kit has read focus in, a view a press there
 * draws for the first time reads where focus was through the control pressed.
 */
export const useArrivalFocus = <Heading extends HTMLElement>(
    key: ArrivalKey
): RefCallback<Heading> => {
    const heading = useRef<Heading | null>(null);
    const seen = useRef<{ readonly key: ArrivalKey; readonly first: boolean } | null>(null);
    // Where focus was as the change began, read as the view draws, before anything in it can take
    // focus, so a field the view focuses itself is not taken for the visitor's own place. Read
    // into each shadow root and each frame of the page's own origin that holds it, as the request
    // compares it when it lands, so a press inside one is not taken for focus the visitor moved. As
    // the view first draws its heading is not there yet, so the read goes through the control the
    // press that brings it was made on, inside a closed shadow root the kit hears too.
    const from = useRef<Element | null>(null);
    if (
        (seen.current === null || !Object.is(seen.current.key, key)) &&
        typeof document !== 'undefined'
    )
        from.current = focusWas(undefined, heading.current ?? pressedNear()).from;
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
        // A closed shadow root the heading sits in is heard from here on, so a press inside it is
        // noted with the control it was made on.
        hearClosed(element);
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
