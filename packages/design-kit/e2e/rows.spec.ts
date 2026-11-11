import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';

import { box, sideways, style, writePage } from './page.js';

/*
 * A list of rows as a browser draws it: a rule between rows and none after the last, in both
 * themes and in forced colors, each row at the target or the larger one, a link row one stop named
 * by its words, title first, with its ring around the whole row, a button at a row's end its own stop named for
 * what it does and to which row, a long title wrapping with the end beside its first line, the
 * list saying how many rows it holds and an empty one not drawn, the keyboard's order, and no
 * audit findings in either theme.
 */

const GAMES = [
    ['12', 'Flip 7', 'Four players, won by Ana', '212'],
    ['11', 'Skyjo', 'Three players, won by Ben', '-4'],
    [
        '10',
        'Wizard, the long game on Saturday night that ran past midnight and into the morning',
        'Five players, won by Cal',
        '180',
    ],
] as const;

const gameRows = GAMES.map(
    ([id, title, detail, score]) =>
        `<li><a class="dk-row" href="#game-${id}">` +
        `<span class="dk-row-text"><span class="dk-row-title" id="g${id}">${title}</span>` +
        `<span class="dk-row-detail" id="g${id}-d">${detail}</span></span>` +
        `<span class="dk-row-figure" id="g${id}-s">${score}</span></a></li>`
).join('');

const playerRows = ['Ana', 'Ben']
    .map(
        (name) =>
            `<li><div class="dk-row"><span class="dk-row-text"><span class="dk-row-title">${name}</span>` +
            `<span class="dk-row-detail">Played 12 games</span></span>` +
            `<button type="button" class="dk-button dk-button-text">Remove<span class="dk-visually-hidden"> ${name}</span></button></div></li>`
    )
    .join('');

const open = async (
    page: Page,
    {
        width = 390,
        theme = 'light',
        tall = false,
    }: { readonly width?: number; readonly theme?: 'light' | 'dark'; readonly tall?: boolean } = {}
): Promise<void> => {
    await writePage(page, {
        width,
        theme,
        title: 'History',
        body:
            `<main><h1>History</h1><ul class="dk-rows${tall ? ' dk-rows-tall' : ''}" role="list" aria-label="Games">${gameRows}</ul>` +
            `<h2>Players</h2><ul class="dk-rows" role="list" aria-label="Players">${playerRows}</ul>` +
            '<ul class="dk-rows" role="list" aria-label="Nothing yet" id="empty"></ul></main>',
    });
};

const games = (page: Page): Locator => page.getByRole('list', { name: 'Games' });
const items = (list: Locator): Locator => list.getByRole('listitem');

/** Where a drawn element ends, down the page. */
const bottom = (drawn: { y: number; height: number }): number => drawn.y + drawn.height;

test('draws a rule between rows and none after the last, in both themes and forced colors', async ({
    page,
    browser,
}) => {
    const rules = async (on: Page) =>
        items(games(on)).evaluateAll((rows) =>
            rows.map((row) => {
                const drawn = getComputedStyle(row);
                return [drawn.borderTopStyle, drawn.borderBottomStyle];
            })
        );
    const expected = [
        ['none', 'none'],
        ['solid', 'none'],
        ['solid', 'none'],
    ];
    for (const theme of ['light', 'dark'] as const) {
        await open(page, { theme });
        expect(await rules(page), theme).toEqual(expected);
    }
    const context = await browser.newContext({ forcedColors: 'active' });
    try {
        const forced = await context.newPage();
        await open(forced);
        expect(await rules(forced)).toEqual(expected);
    } finally {
        await context.close();
    }
});

test('draws each row at the target, and the larger target in a tall list', async ({ page }) => {
    for (const [tall, least] of [
        [false, 44],
        [true, 56],
    ] as const) {
        await open(page, { tall });
        for (const row of await games(page).locator('.dk-row').all()) {
            expect(
                (await box(row, 'a row')).height,
                `tall: ${String(tall)}`
            ).toBeGreaterThanOrEqual(least);
        }
    }
});

test('makes a link row one stop named by its words, title first, with its ring around the whole row', async ({
    page,
}) => {
    await open(page);
    const link = games(page).getByRole('link').first();
    await expect(link).toHaveAccessibleName(/^Flip 7\s*Four players, won by Ana\s*212$/);
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    const ring = await style(link, 'outline-style', 'outline-offset', 'outline-width');
    expect(ring['outline-style']).toBe('solid');
    expect(parseFloat(ring['outline-offset'] ?? '')).toBe(-parseFloat(ring['outline-width'] ?? ''));
    // The link is the row, as wide as its item.
    const row = await box(link, 'the row');
    const item = await box(items(games(page)).first(), 'the item');
    expect([row.x, row.width]).toEqual([item.x, item.width]);
});

test("makes a button at a row's end its own stop, named for what it does and to which row", async ({
    page,
}) => {
    await open(page);
    const players = page.getByRole('list', { name: 'Players' });
    await expect(players.getByRole('button')).toHaveText(['Remove Ana', 'Remove Ben']);
    await expect(players.getByRole('button', { name: 'Remove Ana' })).toBeVisible();
    // The keyboard goes through every game, then each player's button, and nothing else.
    const reached: string[] = [];
    for (let stop = 0; stop < GAMES.length + 2; stop += 1) {
        await page.keyboard.press('Tab');
        reached.push(
            await page.evaluate(
                () =>
                    document.activeElement?.querySelector('[id]')?.id ??
                    document.activeElement?.textContent ??
                    ''
            )
        );
    }
    expect(reached).toEqual(['g12', 'g11', 'g10', 'Remove Ana', 'Remove Ben']);
});

test('wraps a long title, and keeps the end beside its first line', async ({ page }) => {
    await open(page, { width: 320 });
    const title = page.locator('#g10');
    const lines = await title.evaluate((element) => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return [...range.getClientRects()].map((rect) => ({ y: rect.y, height: rect.height }));
    });
    expect(lines.length).toBeGreaterThan(1);
    const first = lines[0] ?? { y: 0, height: 0 };
    const end = await box(page.locator('#g10-s'), 'the figure');
    const middle = end.y + end.height / 2;
    expect(middle).toBeGreaterThanOrEqual(first.y);
    expect(middle).toBeLessThanOrEqual(bottom(first));
    // The row grew to hold the title, and nothing runs past the screen.
    expect(bottom(await box(page.locator('#g10-d'), 'the detail'))).toBeLessThanOrEqual(
        bottom(await box(items(games(page)).nth(2), 'the row'))
    );
    expect(await sideways(page)).toBe(0);
});

test('lines a row of one line up in the middle of its height, and its figures in one width', async ({
    page,
}) => {
    await open(page, { tall: true });
    const row = await box(games(page).locator('.dk-row').first(), 'the row');
    const text = await box(games(page).locator('.dk-row-text').first(), 'the text');
    expect(Math.abs(text.y - row.y - (bottom(row) - bottom(text)))).toBeLessThanOrEqual(1);
    expect(await style(page.locator('#g12-s'), 'font-variant-numeric', 'text-align')).toEqual({
        'font-variant-numeric': 'tabular-nums',
        'text-align': 'end',
    });
});

test('says how many rows a list holds, and draws an empty list not at all', async ({ page }) => {
    await open(page);
    await expect(items(games(page))).toHaveCount(GAMES.length);
    await expect(page.locator('#empty')).toBeHidden();
});

for (const theme of ['light', 'dark'] as const) {
    test(`has no audit findings in the ${theme} theme`, async ({ page }) => {
        await open(page, { theme });
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });
}
