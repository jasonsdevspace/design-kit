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
            'attachStepper',
            'attachTable',
            'attachThemeSwitch',
            'attachToast',
            'chooseTheme',
        ]);
    });
});
