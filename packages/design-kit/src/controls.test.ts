import { getEventListeners } from 'node:events';

import { describe, expect, it, vi } from 'vitest';

/*
 * The controls as a page's bundler takes them: a module that runs nothing when it is imported but a
 * listener on a page's document, so it loads in Node and in a page that never attaches a control.
 * Its budget is held beside the sheets' in the repository's own tests, which measure it as a page's
 * bundler sends it.
 */

describe('the controls', () => {
    it('load in plain Node without reaching for the browser', async () => {
        const controls = await import('./controls.js');
        // Only functions, which run nothing until a page calls one. Which functions is held in
        // smoke/exports.mjs, which the package's test compares with this module.
        expect(Object.keys(controls).length).toBeGreaterThan(0);
        for (const value of Object.values(controls)) expect(typeof value).toBe('function');
    });

    it('returns the function a status line was first attached with when it is attached again', async () => {
        const { attachStatus } = await import('./controls.js');
        // Attaching touches nothing on the line until a message is said, so any object stands in.
        const line = {} as HTMLElement;
        const say = attachStatus(line);
        expect(attachStatus(line)).toBe(say);
        expect(attachStatus({} as HTMLElement)).not.toBe(say);
    });

    it('takes down the old attach of a line let go of and attached afresh', async () => {
        const { attachStatus } = await import('./controls.js');
        const { releaseLine } = await import('./line.js');
        // Letting a line go clears its timers, which Node keeps on the global object.
        vi.stubGlobal('window', globalThis);
        try {
            const line = {} as HTMLElement;
            const page = new AbortController();
            const first = attachStatus(line, { signal: page.signal });
            expect(getEventListeners(page.signal, 'abort')).toHaveLength(1);
            // As a toast's teardown lets its own line go and a later attach takes it.
            releaseLine(line);
            const again = attachStatus(line);
            expect(again).not.toBe(first);
            // The old attach is taken down, so the page's signal holds nothing of it, and its
            // abort leaves the newer attach in place.
            expect(getEventListeners(page.signal, 'abort')).toHaveLength(0);
            page.abort();
            expect(attachStatus(line)).toBe(again);
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('refuses a toast missing a part even when given a signal already aborted', async () => {
        const { attachToast } = await import('./controls.js');
        const empty = { querySelector: () => null } as unknown as HTMLElement;
        expect(() => attachToast(empty, { signal: AbortSignal.abort() })).toThrow(
            'a toast needs its message'
        );
    });
});
