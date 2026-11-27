'use client';

import { type RefCallback, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useAfterCommit } from './after-commit.js';
import { attachForm, type Failure, type FormOptions, type Refuse } from './controls.js';
import { useLiveRef } from './hook-ref.js';
import { focusWas } from './request.js';
import { useSpeaker } from './status-hooks.js';

/*
 * The hook that refuses a form's submit, apart from the others, so only a page that refuses a form
 * sends the form's code.
 */

/**
 * A ref for a form and what refuses its submit, by `attachForm`: called once the page has set the
 * errors, it waits for the render that draws them, then moves focus to the summary or the first
 * field in error and says once, on the status line of the nearest `StatusProvider` or through the
 * `say` given, that field's name and error, or nothing over a summary, as `attachForm` has it. It
 * is called in the submit handler, after an await in it too, or in an effect with dependencies,
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
 * they are drawn. An attached stepper owns its error for every failure it holds, a blank or letters
 * among them, so one whose own error shows is left out of the first list `invalid` is handed, and
 * the first list can be empty on a refused submit. The second list holds every failure in the
 * form's order with the words its field shows, such a stepper's own error's words among them, for
 * an error summary. `invalid` is called only for a submit that fails, so the page's own submit
 * handler clears the errors it set. `errorWords` gives the words for each failure in place of the
 * kit's, read as each is put in words, never a stepper's own error's, which `rangeError` sets. A
 * reset after a refusal, with no passing submit or reset since, says the form is cleared.
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
    // commits, so a visitor who moved it since is not pulled back, read through the form it refuses
    // for, into a closed shadow root that form sits in.
    const refuseThrough = useCallback(
        (pick: () => Refuse | undefined, near: () => Form | undefined): Refuse =>
            (asked) => {
                const { from } = focusWas(asked?.from, near());
                return afterCommit(() => pick()?.({ from }) ?? (() => undefined));
            },
        [afterCommit]
    );
    // The page's own refusal goes through the newest form attached, and each form's own failed
    // submit through that form.
    const refuse = useMemo(
        () =>
            refuseThrough(
                () => [...refusers.values()].at(-1),
                () => [...refusers.keys()].at(-1)
            ),
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
                invalid: (failures, shown) => {
                    latest.current.invalid(failures, shown);
                    refuseThrough(
                        () => refusers.get(form),
                        () => form
                    )();
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
