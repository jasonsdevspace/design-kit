import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { dockInline } from '../examples/examples.js';
import { box, forceColors, lengthOf, sideways, writePage } from './page.js';
import { cutOff, SPACED } from './spacing.js';
import { textSize } from './text-size.js';

/*
 * A compact action beside the dock's main one, as the reference draws it and with the longest
 * labels a screen might give it: Scores and the main action on one row on a 320px phone, at the
 * usual text size in every engine and at twice the text size in Chromium, the compact one first and at its own width,
 * the main one taking the rest and never under the target, both one height and at least the
 * target tall, two rows rather than a page scrolled sideways where the two cannot share one,
 * every word whole, and no audit findings in either theme or in forced colors.
 */

const row = (compact: string, main: string) =>
    `<main><h1>Round 3</h1></main><section class="dk-app-dock" aria-label="Actions">` +
    `<div class="dk-app-dock-inline"><button type="button" class="dk-button dk-button-tall">${compact}</button>` +
    `<button type="button" class="dk-button dk-button-accent dk-button-tall">${main}</button></div></section>`;

const draw = (page: Page, body: string, theme: 'light' | 'dark' = 'light', css = '') =>
    writePage(page, { title: 'Dock', body, theme, css, width: 320, height: 640 });

const pair = async (page: Page) => {
    const [compact, main] = await Promise.all(
        [0, 1].map((at) => box(page.locator('.dk-app-dock-inline > button').nth(at), 'a button'))
    );
    if (!compact || !main) throw new Error('expected two buttons');
    return { compact, main };
};

for (const scale of [1, 2]) {
    test(`holds Scores and a main action on one row on a 320px phone at ${String(scale)}x the text size`, async ({
        page,
    }) => {
        await textSize(page, scale);
        await draw(page, row('Scores', 'Save the round'));
        const { compact, main } = await pair(page);
        expect(Math.round(compact.y)).toBe(Math.round(main.y));
        expect(compact.x).toBeLessThan(main.x);
        expect(Math.round(compact.height)).toBe(Math.round(main.height));
        expect(compact.height).toBeGreaterThanOrEqual(
            (await lengthOf(page, 'var(--dk-target)')) - 1
        );
        expect(main.width).toBeGreaterThanOrEqual((await lengthOf(page, 'var(--dk-target)')) - 1);
        expect(await sideways(page)).toBe(0);
        expect(await cutOff(page, '.dk-app-dock-inline > .dk-button')).toEqual([]);
    });
}

test('takes two rows, rather than a page scrolled sideways or a word cut, where the two cannot share one', async ({
    page,
}) => {
    await textSize(page, 2);
    for (const [compact, main] of [
        ['Show the scores', 'Save the round'],
        ['Scoreboard', 'Save the round'],
        ['Scoreboard', 'Continue'],
    ] as const) {
        await draw(page, row(compact, main));
        expect(await sideways(page), compact).toBe(0);
        expect(await cutOff(page, '.dk-app-dock-inline > .dk-button'), compact).toEqual([]);
    }
});

test("draws the reference's pair with the main action last in the keyboard order", async ({
    page,
}) => {
    await draw(page, `<main><h1>Round 3</h1></main>${renderToStaticMarkup(dockInline)}`);
    const names = await page
        .locator('.dk-app-dock-inline > button')
        .evaluateAll((buttons) => buttons.map((button) => button.textContent.trim()));
    expect(names).toEqual(['Scores', 'Save the round']);
});

test('keeps every word whole under wider spacing', async ({ page }) => {
    await draw(page, row('Scoreboard', 'Save the round'), 'light', SPACED);
    expect(await cutOff(page, '.dk-app-dock-inline > .dk-button')).toEqual([]);
});

for (const colors of ['light', 'dark', 'forced'] as const) {
    test(`has no audit findings in ${colors === 'forced' ? 'forced colors' : `the ${colors} theme`}`, async ({
        page,
    }) => {
        if (colors === 'forced') await forceColors(page);
        await draw(page, row('Scores', 'Save the round'), colors === 'dark' ? 'dark' : 'light');
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations.map(({ id }) => id)).toEqual([]);
    });
}
