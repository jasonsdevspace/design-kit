import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';

import { box, sideways, style, writePage } from './page.js';

/*
 * A list of rows as a browser draws it: a rule between rows and none after the last, in both themes
 * and in forced colors, each row at the target or the larger one, a link row one stop named by its
 * words, title first, with its ring around the whole row, its words on the column's line under an
 * eyebrow, a button at a row's end its own stop named for what it does and to which row, a long
 * title wrapping with the end beside its first line, the list saying how many rows it holds and an
 * empty one not drawn, the keyboard's order, and no audit findings in either theme.
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
        `<span class="dk-visually-hidden">, </span>` +
        `<span class="dk-row-detail" id="g${id}-d">${detail}</span></span>` +
        `<span class="dk-visually-hidden">, </span>` +
        `<span class="dk-row-figure" id="g${id}-s">${score}<span class="dk-visually-hidden"> points</span></span>` +
        `<span class="dk-row-sign" aria-hidden="true">›</span></a></li>`
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
            `<div class="dk-app"><main class="dk-app-body"><h1>History</h1><ul class="dk-rows${tall ? ' dk-rows-tall' : ''}" role="list" aria-label="Games">${gameRows}</ul>` +
            `<h2>Players</h2><ul class="dk-rows" role="list" aria-label="Players">${playerRows}</ul>` +
            '<ul class="dk-rows" role="list" aria-label="Places"><li><a class="dk-row" href="#home" id="one-line">' +
            '<span class="dk-row-text"><span class="dk-row-title">Home</span></span></a></li></ul>' +
            '<ul class="dk-rows" role="list" aria-label="Nothing yet" id="empty">\n    \n</ul></main></div>',
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
    const ruleColor = (on: Page) =>
        items(games(on))
            .nth(1)
            .evaluate((row) => getComputedStyle(row).borderTopColor);
    for (const theme of ['light', 'dark'] as const) {
        await open(page, { theme });
        expect(await rules(page), theme).toEqual(expected);
    }
    const context = await browser.newContext({ forcedColors: 'active' });
    try {
        const forced = await context.newPage();
        await open(forced);
        expect(await rules(forced)).toEqual(expected);
        // The rule takes the system's text color, so it is drawn and seen.
        const text = await forced.evaluate(() => {
            const probe = document.createElement('span');
            probe.style.color = 'CanvasText';
            document.body.append(probe);
            const resolved = getComputedStyle(probe).color;
            probe.remove();
            return resolved;
        });
        expect(await ruleColor(forced)).toBe(text);
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
    // A comma between the parts, with the space a browser may put before it, which is not read.
    await expect(link).toHaveAccessibleName(/^Flip 7 ?, Four players, won by Ana ?, 212 points$/);
    // A chevron says it leads somewhere, and is passed over by a screen reader.
    const sign = link.locator('.dk-row-sign');
    await expect(sign).toBeVisible();
    await expect(sign).toHaveAttribute('aria-hidden', 'true');
    // It sits at the row's end, after the figure.
    expect((await box(sign, 'the sign')).x).toBeGreaterThan(
        (await box(link.locator('.dk-row-figure'), 'the figure')).x
    );
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    const ring = await style(link, 'outline-style', 'outline-offset', 'outline-width');
    expect(ring['outline-style']).toBe('solid');
    expect(parseFloat(ring['outline-offset'] ?? '')).toBe(-parseFloat(ring['outline-width'] ?? ''));
    // The link is the row, as wide as its item and the room its ring takes past it either side.
    const row = await box(link, 'the row');
    const item = await box(items(games(page)).first(), 'the item');
    // The room is the row's own inset, which is what its ring takes.
    const room = parseFloat((await style(link, 'padding-left'))['padding-left'] ?? '');
    expect([row.x, row.width]).toEqual([item.x - room, item.width + 2 * room]);
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
    await open(page);
    const row = await box(page.locator('#one-line'), 'the row');
    const text = await box(page.locator('#one-line .dk-row-text'), 'the text');
    expect(row.height).toBeGreaterThan(text.height + 8);
    expect(Math.abs(text.y - row.y - (bottom(row) - bottom(text)))).toBeLessThanOrEqual(1);
    expect(await style(page.locator('#g12-s'), 'font-variant-numeric', 'text-align')).toEqual({
        'font-variant-numeric': 'tabular-nums',
        'text-align': 'end',
    });
});

test('says how many rows a list holds, and draws an empty list not at all', async ({ page }) => {
    await open(page);
    await expect(items(games(page))).toHaveCount(GAMES.length);
    // Not drawn, though a line break sits in it, and so not a list a screen reader finds.
    expect((await style(page.locator('#empty'), 'display')).display).toBe('none');
    await expect(page.getByRole('list', { name: 'Nothing yet' })).toHaveCount(0);
});

test('keeps a row with a button as tall as one without, the button in the middle and every ring off the words', async ({
    page,
}) => {
    await open(page);
    const player = page.getByRole('list', { name: 'Players' }).locator('.dk-row').first();
    const game = games(page).locator('.dk-row').first();
    const button = await box(player.getByRole('button'), 'the button');
    const held = await box(player, 'the row');
    expect(held.height).toBeLessThanOrEqual((await box(game, 'a game')).height + 2);
    expect(Math.abs(button.y - held.y - (bottom(held) - bottom(button)))).toBeLessThanOrEqual(1);
    // The row's words start past the room a ring drawn inside it takes.
    const ring = await style(game, 'outline-width', 'outline-offset', 'padding-left');
    expect(parseFloat(ring['padding-left'] ?? '')).toBeGreaterThanOrEqual(4);
});

for (const theme of ['light', 'dark'] as const) {
    test(`has no audit findings in the ${theme} theme`, async ({ page }) => {
        await open(page, { theme });
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });
}

test("starts a row's words on the column's line, under an eyebrow, on a page and in a panel", async ({
    page,
}) => {
    for (const panel of [false, true]) {
        const list = `<p class="dk-eyebrow" id="eyebrow">Recent</p><ul class="dk-rows" role="list" aria-label="Games">${gameRows}</ul>`;
        await writePage(page, {
            width: 390,
            title: 'History',
            body: `<main><h1>History</h1>${panel ? `<div class="dk-panel">${list}</div>` : list}</main>`,
        });
        const eyebrow = await box(page.locator('#eyebrow'), 'the eyebrow');
        const title = await box(page.locator('#g12'), "a row's title");
        expect(title.x, `panel: ${String(panel)}`).toBeCloseTo(eyebrow.x, 0);
    }
});
