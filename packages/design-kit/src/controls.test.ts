import { describe, expect, it } from 'vitest';

/*
 * The controls as a page's bundler takes them: a module that runs nothing when it is imported, so
 * it loads in Node and in a page that never attaches a control. Its budget is held beside the
 * sheets' in the repository's own tests, which measure it as a page's bundler sends it.
 */

describe('the controls', () => {
    it('load in plain Node without reaching for the browser', async () => {
        const controls = await import('./controls.js');
        expect(Object.keys(controls).sort()).toEqual([
            'attachCopyButton',
            'attachDialog',
            'attachPanel',
            'attachStatus',
            'attachStepper',
            'attachTable',
            'attachThemeSwitch',
            'attachToast',
            'chooseTheme',
        ]);
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
