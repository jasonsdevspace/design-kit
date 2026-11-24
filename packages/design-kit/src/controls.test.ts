import { getEventListeners } from 'node:events';

import { describe, expect, it, vi } from 'vitest';

import * as controls from './controls.js';

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

    it('reach the React modules only through the entry, so a page holds one copy of the state', async () => {
        const { readFileSync } = await import('node:fs');
        const imported = ['./react.tsx', './hooks.tsx'].flatMap((file) =>
            [
                ...readFileSync(new URL(file, import.meta.url), 'utf8').matchAll(
                    /^(?:import|export)\b[^;]*?['"](\.\/[\w-]+\.js)['"]/gms
                ),
            ].map(([, path]) => path)
        );
        expect(imported).toContain('./controls.js');
        expect(new Set(imported)).toEqual(new Set(['./controls.js', './hooks.js', './theme.js']));
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

    /*
     * Every attach that needs a part, each given markup without it and a signal already aborted.
     * An attach reads only what it asks its element for, so a plain object stands in for each.
     */
    const nothing = { closest: () => null, matches: () => false, querySelector: () => null };
    const missing: readonly (readonly [string, (signal: AbortSignal) => unknown, string])[] = [
        [
            'a toast with no message',
            (signal) => controls.attachToast(nothing as unknown as HTMLElement, { signal }),
            'a toast needs its message',
        ],
        [
            'a stepper with no value',
            (signal) => controls.attachStepper(nothing as unknown as HTMLElement, { signal }),
            'a stepper needs its value',
        ],
        [
            'a stepper with no buttons whose value can be changed',
            (signal) => {
                const field = {
                    ...nothing,
                    querySelector: (part: string) =>
                        part === '.dk-stepper-value' ? { readOnly: false } : null,
                };
                return controls.attachStepper(field as unknown as HTMLElement, { signal });
            },
            'a stepper needs its two buttons, or a read-only value',
        ],
        [
            "a panel's button with no aria-controls",
            (signal) => {
                const button = { getAttribute: () => null };
                return controls.attachPanel(button as unknown as HTMLButtonElement, { signal });
            },
            "a panel's button needs aria-controls",
        ],
        [
            'a table with no frame',
            (signal) => controls.attachTable(nothing as unknown as HTMLElement, { signal }),
            'a table needs its frame',
        ],
    ];

    it.each(missing)(
        'refuses %s even when given a signal already aborted',
        (_markup, attach, error) => {
            expect(() => attach(AbortSignal.abort())).toThrow(error);
        }
    );

    it('throws only errors whose words a case above holds to a signal already aborted', async () => {
        const { readdirSync, readFileSync } = await import('node:fs');
        const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');
        // Every module of the source but the build's plugin, so an internal module the entry does
        // not name, as the marks, is read too, by the pattern the package's layout reads them by.
        const parts = readdirSync(new URL('./', import.meta.url))
            .filter((file) => /^[^.]+\.ts$/.test(file) && file !== 'vite.ts')
            .map((file) => `./${file}`);
        expect(parts).toEqual(expect.arrayContaining(['./stepper.ts', './marks.ts']));
        const source = parts.map(read).join('\n');
        // The modules' code without their comments, which speak of what throws.
        const code = source
            .split('\n')
            .filter((line) => !/^\s*(\/\/|\/?\*)/.test(line))
            .join('\n');
        // Each error thrown, of any kind, by the words it opens with, up to a part it names.
        const thrown = [...code.matchAll(/\bthrow new \w*Error\(\s*[`'"](.*?)[`'"]\s*\)/g)].map(
            ([, words]) => (words ?? '').replace(/\$\{.*$/, '')
        );
        // Every throw is one of those, so none in another form goes unread.
        expect(thrown).toHaveLength(code.match(/\bthrow\b/g)?.length ?? 0);
        expect(thrown.length).toBeGreaterThan(0);
        // The cases above find each thrown under a signal already aborted, which holds each to
        // being told before the signal is read, so an attach that gains a throw gains a case.
        for (const words of thrown) {
            expect(words.trim()).not.toBe('');
            expect(missing.some(([, , error]) => error.startsWith(words))).toBe(true);
        }
    });
});
