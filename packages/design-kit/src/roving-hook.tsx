'use client';

import { type RefCallback, useCallback, useEffect, useRef } from 'react';

import { attachRoving, type RovingOptions } from './controls.js';
import { useLiveRef } from './hook-ref.js';

/*
 * The hook for a group of cells the arrow keys move through, apart from the others, so only a page
 * with such a group sends its code.
 */

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
