import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { loading } from '../examples/examples.js';
import { forceColors, sideways, style, writePage } from './page.js';
import { cutOff, SPACED } from './spacing.js';
import { textSize } from './text-size.js';

/*
 * A part of the page that is loading, as the reference draws it: its line out of sight until the
 * wait outlasts --dk-wait, so a fast answer shows nothing, the delay kept under reduced motion and
 * in forced colors, then shown in the muted text in both themes, whole under wider text spacing and
 * at 320px with twice the text size, with no audit findings.
 */

const BODY = `<main><h1>Shop</h1>${renderToStaticMarkup(loading)}</main>`;

const line = (page: Page) => page.locator('.dk-loading');
const shown = async (page: Page) => (await style(line(page), 'visibility'))['visibility'];

/** Draws the page with a wait of the length given, in the theme given. */
const draw = (page: Page, wait: string, theme: 'light' | 'dark' = 'light', css = '') =>
    writePage(page, {
        title: 'Loading',
        body: BODY,
        theme,
        css: `:root { --dk-wait: ${wait}; }${css}`,
    });

for (const motion of ['no-preference', 'reduce'] as const) {
    test(`keeps the loading line out of sight for the wait, then shows it, with motion ${motion}`, async ({
        page,
    }) => {
        await page.emulateMedia({ reducedMotion: motion });
        // Ten seconds of wait, so the line's state before it ends is read with time to spare.
        await draw(page, '10s');
        expect(await shown(page)).toBe('hidden');
        await draw(page, '50ms');
        await expect.poll(() => shown(page)).toBe('visible');
    });
}

test('keeps the wait in forced colors', async ({ page }) => {
    await forceColors(page);
    await draw(page, '10s');
    expect(await shown(page)).toBe('hidden');
    await draw(page, '50ms');
    await expect.poll(() => shown(page)).toBe('visible');
});

for (const theme of ['light', 'dark'] as const) {
    test(`draws the line in the muted text, with no audit findings, in the ${theme} theme`, async ({
        page,
    }) => {
        await draw(page, '0s', theme);
        await expect.poll(() => shown(page)).toBe('visible');
        const muted = await page.evaluate(() => {
            const probe = document.createElement('span');
            probe.style.color = 'var(--dk-muted)';
            document.body.append(probe);
            const color = getComputedStyle(probe).color;
            probe.remove();
            return color;
        });
        expect((await style(line(page), 'color'))['color']).toBe(muted);
        // The region is no longer busy for the audit, as a page takes the mark away once drawn.
        await page.locator('[aria-busy]').evaluate((region) => {
            region.removeAttribute('aria-busy');
        });
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations.map(({ id }) => id)).toEqual([]);
    });
}

test('keeps its words whole under wider spacing and at 320px with twice the text size', async ({
    page,
}) => {
    await draw(page, '0s', 'light', SPACED);
    await expect.poll(() => shown(page)).toBe('visible');
    expect(await cutOff(page, '.dk-loading')).toEqual([]);
    await textSize(page, 2);
    await writePage(page, { title: 'Loading', body: BODY, width: 320, height: 640 });
    await expect.poll(() => shown(page)).toBe('visible');
    expect(await sideways(page)).toBe(0);
    expect(await cutOff(page, '.dk-loading')).toEqual([]);
});
