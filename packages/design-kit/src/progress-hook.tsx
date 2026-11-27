'use client';

import { type RefCallback, useCallback, useEffect, useRef } from 'react';

import { attachProgress, type ProgressOptions } from './controls.js';
import { useLiveRef } from './hook-ref.js';
import { useSpeaker } from './status-hooks.js';

/*
 * The hook that says a progress bar's steps, apart from the others, so only a page with one sends
 * its code.
 */

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
