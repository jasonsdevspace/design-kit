import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { dockInline } from '../examples/examples.js';
import { box, forceColors, sideways, writePage } from './page.js';
import { cutOff, SPACED } from './spacing.js';
import { textSize } from './text-size.js';

/*
 * A compact action beside the dock's main one, as the reference draws it: the two on one row on a
 * 320px phone, at the usual text size in every engine and at twice the text size in Chromium, the
 * compact one at its own width and the main one taking the rest, both one height and at the larger
 * target, nothing scrolling sideways, every word whole under wider spacing, the main one last in
 * the keyboard's order, and no audit findings in either theme or in forced colors.
 */

const BODY = `<main><h1>Round 3</h1></main>${renderToStaticMarkup(dockInline)}`;

const draw = (page: Page, theme: 'light' | 'dark' = 'light', css = '') =>
    writePage(page, { title: 'Dock', body: BODY, theme, css, width: 320, height: 640 });

const onOneRow = async (page: Page) => {
    const compact = await box(
        page.getByRole('button', { name: 'Scoreboard' }),
        'the compact action'
    );
    const main = await box(page.getByRole('button', { name: 'Save the round' }), 'the main action');
    const dock = await box(page.locator('.dk-app-dock-inline'), 'the row');
    expect(Math.round(compact.y)).toBe(Math.round(main.y));
    expect(Math.round(compact.height)).toBe(Math.round(main.height));
    // The main action takes the rest of the row, never under the target's width, and the row
    // stays within the dock.
    const target = await page.evaluate(() => {
        const probe = document.createElement('div');
        probe.style.width = 'var(--dk-target)';
        document.body.append(probe);
        const width = probe.getBoundingClientRect().width;
        probe.remove();
        return width;
    });
    expect(main.width).toBeGreaterThanOrEqual(target - 1);
    expect(main.x + main.width).toBeLessThanOrEqual(dock.x + dock.width + 1);
    return { compact, main };
};

for (const scale of [1, 2]) {
    test(`holds the pair on one row on a 320px phone at ${String(scale)}x the text size`, async ({
        page,
    }) => {
        await textSize(page, scale);
        await draw(page);
        const { compact } = await onOneRow(page);
        // The larger target, in rems, at the text size drawn.
        expect(compact.height).toBeGreaterThanOrEqual(3.5 * 16 * scale - 1);
        expect(await sideways(page)).toBe(0);
        expect(await cutOff(page, '.dk-app-dock-inline > .dk-button')).toEqual([]);
    });
}

test('puts the main action last in the keyboard order', async ({ page }) => {
    await draw(page);
    const names = await page
        .locator('.dk-app-dock-inline > button')
        .evaluateAll((buttons) => buttons.map((button) => button.textContent.trim()));
    expect(names).toEqual(['Scoreboard', 'Save the round']);
});

test('keeps every word whole under wider spacing, and its edges in forced colors', async ({
    page,
}) => {
    await draw(page, 'light', SPACED);
    await onOneRow(page);
    expect(await cutOff(page, '.dk-app-dock-inline > .dk-button')).toEqual([]);
    await forceColors(page);
    await draw(page);
    await onOneRow(page);
});

for (const theme of ['light', 'dark'] as const) {
    test(`has no audit findings in the ${theme} theme`, async ({ page }) => {
        await draw(page, theme);
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations.map(({ id }) => id)).toEqual([]);
    });
}
