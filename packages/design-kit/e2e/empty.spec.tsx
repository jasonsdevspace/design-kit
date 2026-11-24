import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { empty, rows } from '../examples/examples.js';
import { bundle } from './bundle.js';
import {
    box,
    colorOf,
    forceColors,
    hearing,
    lengthOf,
    servePage,
    sideways,
    style,
    writePage,
} from './page.js';
import { cutOff, SPACED } from './spacing.js';
import { doubled } from './text-size.js';

/*
 * An empty state, as the reference draws it: in a list's place with no ground, no edge and no room
 * at its sides, its words starting where a row's title does, muted at the body size, its button a
 * plain one under them, whole on a 320px phone at twice the text size and under wider spacing with
 * no audit findings in either theme or in forced colors, and the reference's saved games, a search
 * that matches nothing drawing it and saying so on the status line, and clearing the search
 * bringing the list back with focus on the search field.
 */

const EMPTY = renderToStaticMarkup(empty);
const ROWS = renderToStaticMarkup(rows);

const draw = (
    page: Page,
    body: string,
    {
        theme = 'light',
        css = '',
        width = 1280,
    }: { readonly theme?: 'light' | 'dark'; readonly css?: string; readonly width?: number } = {}
) =>
    writePage(page, {
        title: 'Empty',
        body: `<main class="dk-page"><h1>Players</h1>${body}</main>`,
        theme,
        css,
        width,
    });

test('draws no ground and no edge, its words where a row title starts in a page', async ({
    page,
}) => {
    await draw(page, `${EMPTY}${ROWS}`);
    const look = await style(
        page.locator('.dk-empty'),
        'background-color',
        'border-top-width',
        'padding-top',
        'padding-bottom'
    );
    const step = `${String(await lengthOf(page, 'var(--dk-space-3)'))}px`;
    expect(look).toEqual({
        'background-color': 'rgba(0, 0, 0, 0)',
        'border-top-width': '0px',
        'padding-top': step,
        'padding-bottom': step,
    });
    const words = (await box(page.locator('.dk-empty > p'))).x;
    expect(words).toBe((await box(page.locator('.dk-row-title').first())).x);
    expect(words).toBe((await box(page.locator('main > h1'))).x);
});

test('starts its words where a row title does at a bare edge too', async ({ page }) => {
    await writePage(page, { title: 'Empty', body: `<div>${EMPTY}${ROWS}</div>` });
    expect((await box(page.locator('.dk-empty > p'))).x).toBe(
        (await box(page.locator('.dk-row-title').first())).x
    );
    expect(await sideways(page)).toBe(0);
});

test('is not live, so it is read where it is', async ({ page }) => {
    await draw(page, EMPTY);
    expect(
        await page.evaluate(
            () =>
                [...document.querySelectorAll('.dk-empty, .dk-empty *')].filter(
                    (element) => element.hasAttribute('role') || element.hasAttribute('aria-live')
                ).length
        )
    ).toBe(0);
});

test('draws its words muted at the body size and a plain button under them', async ({ page }) => {
    await draw(page, EMPTY);
    const words = await style(page.locator('.dk-empty > p'), 'color', 'font-size', 'margin-top');
    expect(words.color).toBe(await colorOf(page, 'var(--dk-muted)'));
    expect(words['font-size']).toBe((await style(page.locator('main'), 'font-size'))['font-size']);
    expect(words['margin-top']).toBe('0px');
    const button = page.getByRole('button', { name: 'Add a player' });
    await expect(button).not.toHaveClass(/dk-button-accent/);
    const said = await box(page.locator('.dk-empty > p'));
    const action = await box(button);
    expect(Math.round(action.y - (said.y + said.height))).toBe(
        await lengthOf(page, 'var(--dk-space-3)')
    );
});

test('stays whole on a 320px phone at twice the text size', async ({ page, browserName }) => {
    await draw(
        page,
        EMPTY.replace('No players yet.', 'No players have been added to this game yet.'),
        {
            width: 320,
        }
    );
    await doubled(page, browserName);
    expect(await sideways(page)).toBe(0);
    expect(await cutOff(page, '.dk-empty, .dk-empty > *')).toEqual([]);
});

test('stays whole under wider text spacing', async ({ page }) => {
    await draw(page, EMPTY, { css: SPACED, width: 320 });
    expect(await sideways(page)).toBe(0);
    expect(await cutOff(page, '.dk-empty, .dk-empty > *')).toEqual([]);
});

for (const colors of ['light', 'dark', 'forced'] as const) {
    test(`has no audit findings in ${colors === 'forced' ? 'forced colors' : `the ${colors} theme`}`, async ({
        page,
    }) => {
        if (colors === 'forced') await forceColors(page);
        await draw(page, EMPTY, { theme: colors === 'dark' ? 'dark' : 'light' });
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations.map(({ id }) => id)).toEqual([]);
    });
}

test.describe('the saved games', () => {
    let app = '';

    test.beforeAll(async () => {
        test.setTimeout(120_000);
        app = hearing('#root > p[role="status"]') + (await bundle('empty-page.tsx'));
    });

    const open = async (page: Page) => {
        await servePage(page, { title: 'Games', body: '<div id="root"></div>', script: app });
        await expect(page.getByRole('heading', { name: 'Saved games' })).toBeVisible();
    };

    const heard = (page: Page) =>
        page.evaluate(() => (window as unknown as { heard: string[] }).heard);

    test('waits for typing to stop, then says the search matches nothing and names it', async ({
        page,
    }) => {
        await open(page);
        await page.getByLabel('Search the games').pressSequentially('Chss', { delay: 50 });
        await expect(page.getByRole('list')).toHaveCount(0);
        await expect(page.locator('.dk-empty > p')).toHaveText('No games match “Chss”.');
        await expect.poll(() => heard(page)).toEqual(['No games match “Chss”.']);
    });

    test('says how many games match a search that finds some', async ({ page }) => {
        await open(page);
        await page.getByLabel('Search the games').pressSequentially('sky', { delay: 50 });
        await expect(page.getByRole('listitem')).toHaveCount(1);
        await expect.poll(() => heard(page)).toEqual(['1 game matches.']);
    });

    for (const how of ['Enter', 'click'] as const)
        test(`brings the list back with focus on the search when Clear is pressed by ${how === 'click' ? 'a pointer' : 'Enter'}`, async ({
            page,
        }) => {
            await open(page);
            const search = page.getByLabel('Search the games');
            await search.fill('Chess');
            const clear = page.getByRole('button', { name: 'Clear the search' });
            if (how === 'click') await clear.click();
            else await clear.press('Enter');
            await expect(search).toBeFocused();
            await expect(search).toHaveValue('');
            await expect(page.getByRole('listitem')).toHaveCount(3);
            await expect.poll(() => heard(page)).toContain('Search cleared, 3 games.');
        });

    test('brings the list back when the search is emptied in the field itself', async ({
        page,
    }) => {
        await open(page);
        const search = page.getByLabel('Search the games');
        await search.fill('Chess');
        await search.press('ControlOrMeta+a');
        await search.press('Backspace');
        await expect(search).toBeFocused();
        await expect(page.getByRole('listitem')).toHaveCount(3);
        await expect.poll(() => heard(page)).toContain('3 games match.');
    });

    test('has no audit findings with the empty state drawn', async ({ page }) => {
        await open(page);
        await page.getByLabel('Search the games').fill('Chess');
        await expect(page.locator('.dk-empty')).toBeVisible();
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations.map(({ id }) => id)).toEqual([]);
    });
});
