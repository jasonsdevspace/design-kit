'use client';

import { type RefCallback, useCallback } from 'react';

import { attachBusy, type BusyOptions } from './controls.js';
import { useLiveRef } from './hook-ref.js';
import { useSpeaker } from './status-hooks.js';

/*
 * The hook for a button that can be busy, apart from the others, so only a page with one sends its
 * code.
 */

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
