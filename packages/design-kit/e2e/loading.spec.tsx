import { expect, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { loading } from '../examples/examples.js';
import { writePage } from './page.js';
import { cutOff, SPACED } from './spacing.js';

/*
 * A part of the page that is loading, as the reference draws it: its line out of sight until the
 * wait outlasts --dk-wait, so a fast answer shows nothing, then shown in the muted text, the delay
 * kept under reduced motion and in forced colors, and its words whole under wider text spacing.
 */

const BODY = `<main>${renderToStaticMarkup(loading)}</main>`;

const visibility = (page: import('@playwright/test').Page) =>
    page.locator('.dk-loading').evaluate((line) => getComputedStyle(line).visibility);

for (const motion of ['no-preference', 'reduce'] as const) {
    test(`keeps the loading line out of sight for the wait, then shows it, with motion ${motion}`, async ({
        page,
    }) => {
        await page.emulateMedia({ reducedMotion: motion });
        // Ten seconds of wait, so the line's state before it ends is read with time to spare.
        await writePage(page, { title: 'Loading', body: BODY, css: ':root { --dk-wait: 10s; }' });
        expect(await visibility(page)).toBe('hidden');
        await writePage(page, { title: 'Loading', body: BODY, css: ':root { --dk-wait: 50ms; }' });
        await expect.poll(() => visibility(page)).toBe('visible');
    });
}

test('draws the loading line in the muted text, in forced colors too, and whole under wider spacing', async ({
    page,
}) => {
    await writePage(page, { title: 'Loading', body: BODY, css: SPACED });
    await expect.poll(() => visibility(page)).toBe('visible');
    expect(await cutOff(page, '.dk-loading')).toEqual([]);
    await page.emulateMedia({ forcedColors: 'active' });
    await expect(page.locator('.dk-loading')).toBeVisible();
});
