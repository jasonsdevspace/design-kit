import { describe, expect, it } from 'vitest';

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
});
