import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';

import {
    box,
    colorOf,
    contrast,
    forceColors,
    ringByKeyboard,
    sideways,
    style,
    tabKey,
    writePage,
} from './page.js';
import { cutOff, SPACED } from './spacing.js';
import { textSize } from './text-size.js';

/*
 * A list of rows as a browser draws it: a rule between rows and none after the last, in both themes
 * and in forced colors, each row at the target or the larger one, and a row of one line no taller,
 * a link row one stop named by its words, title first, with its ring around the whole row, its
 * words on the column's line under an eyebrow, a button at a row's end its own stop named for what
 * it does and to which row, a long title wrapping with the end beside its first line, the end
 * inside the row on a 320px phone at twice the text size, the list saying how many rows it holds
 * and an empty one not drawn, the keyboard's order, and no audit findings in either theme. A list
 * of tiles draws each link on the ground its page sets, or the surface with none, a gap and an edge
 * apart and inside the column of an app's body, with the row's sign, press and ring, a page's shadow
 * only where it sets one, the larger target with its detail inside it at twice the text size, its
 * edge in forced colors, an empty list not at all, and no audit findings in either theme with its
 * grounds set, and its words at 4.5 to 1 and its sign and ring at 3 to 1 on each of them and on the
 * surface.
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
            `<main><h1>History</h1><ul class="dk-rows${tall ? ' dk-rows-tall' : ''}" role="list" aria-label="Games">${gameRows}</ul>` +
            `<h2>Players</h2><ul class="dk-rows" role="list" aria-label="Players">${playerRows}</ul>` +
            '<ul class="dk-rows" role="list" aria-label="Places"><li><a class="dk-row" href="#home" id="one-line">' +
            '<span class="dk-row-text"><span class="dk-row-title">Home</span></span></a></li></ul>' +
            '<ul class="dk-rows" role="list" aria-label="Nothing yet" id="empty">\n    \n</ul></main>',
    });
};

const games = (page: Page): Locator => page.getByRole('list', { name: 'Games' });
const items = (list: Locator): Locator => list.getByRole('listitem');

/** Where a drawn element ends, down the page. */
const bottom = (drawn: { y: number; height: number }): number => drawn.y + drawn.height;

/** The rule above each row and below it, as drawn. */
const rules = (page: Page) =>
    items(games(page)).evaluateAll((rows) =>
        rows.map((row) => {
            const drawn = getComputedStyle(row);
            return [drawn.borderTopStyle, drawn.borderBottomStyle];
        })
    );

/** A rule between rows and none after the last. */
const RULES = [
    ['none', 'none'],
    ['solid', 'none'],
    ['solid', 'none'],
];

test('draws a rule between rows and none after the last, in both themes', async ({ page }) => {
    for (const theme of ['light', 'dark'] as const) {
        await open(page, { theme });
        expect(await rules(page), theme).toEqual(RULES);
    }
});

test("draws the rule between rows in the system's text color in forced colors", async ({
    page,
    browserName,
}) => {
    test.skip(browserName === 'webkit', 'WebKit has no forced colors to draw');
    await forceColors(page);
    await open(page);
    expect(await rules(page)).toEqual(RULES);
    // The rule takes the system's text color, so it is drawn and seen.
    expect(
        await items(games(page))
            .nth(1)
            .evaluate((row) => getComputedStyle(row).borderTopColor)
    ).toBe(await colorOf(page, 'CanvasText'));
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
    browserName,
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
    await page.keyboard.press(tabKey(browserName));
    await expect(link).toBeFocused();
    const ring = await style(link, 'outline-style', 'outline-offset', 'outline-width');
    expect(ring['outline-style']).toBe('solid');
    expect(parseFloat(ring['outline-offset'] ?? '')).toBe(-parseFloat(ring['outline-width'] ?? ''));
    // The link is the row, as wide as its item on a page with no padding of its own.
    const row = await box(link, 'the row');
    const item = await box(items(games(page)).first(), 'the item');
    expect([row.x, row.width]).toEqual([item.x, item.width]);
});

test("makes a button at a row's end its own stop, named for what it does and to which row", async ({
    page,
    browserName,
}) => {
    await open(page);
    const players = page.getByRole('list', { name: 'Players' });
    await expect(players.getByRole('button')).toHaveText(['Remove Ana', 'Remove Ben']);
    await expect(players.getByRole('button', { name: 'Remove Ana' })).toBeVisible();
    // The keyboard goes through every game, then each player's button, and nothing else.
    const reached: string[] = [];
    for (let stop = 0; stop < GAMES.length + 2; stop += 1) {
        await page.keyboard.press(tabKey(browserName));
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

test("starts a row's words on the column's line in what pads, and keeps it inside a bare page", async ({
    page,
}) => {
    const list = `<p class="dk-eyebrow" id="eyebrow">Recent</p><ul class="dk-rows" role="list" aria-label="Games">${gameRows}</ul>`;
    for (const [name, body] of [
        ['an explainer', `<main class="dk-explainer"><h1>History</h1>${list}</main>`],
        ['a panel', `<main><h1>History</h1><div class="dk-panel">${list}</div></main>`],
        [
            "an app's body",
            `<div class="dk-app"><main class="dk-app-body"><h1>History</h1>${list}</main></div>`,
        ],
    ] as const) {
        await writePage(page, { width: 320, title: 'History', body });
        const eyebrow = await box(page.locator('#eyebrow'), 'the eyebrow');
        const title = await box(page.locator('#g12'), "a row's title");
        expect(title.x, name).toBeCloseTo(eyebrow.x, 0);
        expect(await sideways(page), name).toBe(0);
    }
    // At a page's bare edge, and in a table's cell, the row stays inside, so nothing scrolls
    // sideways and its whole ring shows.
    for (const [name, body] of [
        ['a bare page', `<main>${list}</main>`],
        [
            "a table's cell",
            `<div class="dk-table-scroll" role="region" aria-label="Games" tabindex="0"><table class="dk-table"><tbody><tr><td><ul class="dk-rows" role="list" aria-label="Games">${gameRows}</ul></td></tr></tbody></table></div>`,
        ],
    ] as const) {
        await writePage(page, { width: 320, title: 'History', body });
        expect(await sideways(page), name).toBe(0);
        const row = await box(page.getByRole('link').first(), 'the row');
        const item = await box(page.locator('.dk-rows > li').first(), 'the item');
        expect([row.x, row.width], name).toEqual([item.x, item.width]);
        if (name === "a table's cell")
            expect(
                await page
                    .locator('.dk-table-scroll')
                    .evaluate((frame) => frame.scrollWidth - frame.clientWidth),
                name
            ).toBe(0);
    }
});

test('draws a row of one line at the target tall, no taller', async ({ page }) => {
    await open(page);
    expect((await box(page.locator('#one-line'), 'a row of one line')).height).toBeCloseTo(44, 0);
});

test("keeps a row's end inside the row on a 320px phone at twice the text size", async ({
    page,
}) => {
    await open(page, { width: 320 });
    await textSize(page, 2);
    // A title of one word too long for the row, which has to break inside it.
    await page.locator('#g11').evaluate((title) => {
        title.textContent = 'Skyjochampionshipfinal';
    });
    for (const row of await page.locator('.dk-row').all()) {
        const drawn = await box(row, 'a row');
        for (const end of await row.locator('.dk-row-figure, .dk-row-sign, .dk-button').all()) {
            const at = await box(end, "the row's end");
            expect(at.x + at.width).toBeLessThanOrEqual(drawn.x + drawn.width + 0.5);
        }
    }
    expect(await sideways(page)).toBe(0);
});

/** A list of tiles in an app's body, each game on a ground its page sets, or none. */
const tiles = (grounds = true): string =>
    `<div class="dk-app"><header class="dk-app-bar"><h1 class="dk-app-title">Play</h1></header><main class="dk-app-body" id="main-content" tabindex="0"><ul class="dk-rows dk-rows-tiles" role="list" aria-label="Start a new game">` +
    ['Flip 7', 'Skyjo', 'Wizard, the long game that runs past midnight and on into the morning']
        .map(
            (name, at) =>
                `<li><a class="dk-row${grounds ? ` ground-${String(at)}` : ''}" href="#game-${String(at)}"><span class="dk-row-text"><span class="dk-row-title">${name}</span><span class="dk-visually-hidden">, </span><span class="dk-row-detail">From 2 to 8 players, each with a hand of cards</span></span><span class="dk-row-sign" aria-hidden="true">›</span></a></li>`
        )
        .join('') +
    `</ul></main></div>`;

/** A ground for each tile, light in the light theme and deep in the dark one, as a page sets it. */
const GROUNDS_CSS =
    '.ground-0 { --dk-tile-ground: light-dark(rgb(255, 236, 214), rgb(74, 46, 20)); } ' +
    '.ground-1 { --dk-tile-ground: light-dark(rgb(220, 240, 255), rgb(20, 46, 74)); } ' +
    '.ground-2 { --dk-tile-ground: light-dark(rgb(232, 245, 222), rgb(30, 56, 20)); }';

const tileList = (page: Page): Locator => page.getByRole('list', { name: 'Start a new game' });

test('draws each tile on the ground its page sets, with an edge and a gap in place of the rule', async ({
    page,
}) => {
    await writePage(page, { width: 390, css: GROUNDS_CSS, title: 'Play', body: tiles() });
    const links = await tileList(page).getByRole('link').all();
    const grounds = await Promise.all(
        links.map(async (link) => (await style(link, 'background-color'))['background-color'])
    );
    expect(grounds).toEqual(['rgb(255, 236, 214)', 'rgb(220, 240, 255)', 'rgb(232, 245, 222)']);
    const [first, second] = await Promise.all(links.slice(0, 2).map((link) => box(link)));
    if (!first || !second) throw new Error('expected two tiles');
    expect(Math.round(second.y - (first.y + first.height))).toBe(12);
    for (const item of await items(tileList(page)).all())
        expect((await style(item, 'border-top-width'))['border-top-width']).toBe('0px');
    const edge = await style(
        tileList(page).getByRole('link').first(),
        'border-top-style',
        'border-top-width'
    );
    expect(edge).toEqual({ 'border-top-style': 'solid', 'border-top-width': '1px' });
    // Each keeps the row's sign that it leads somewhere, seen and hidden from a screen reader.
    for (const sign of await tileList(page).locator('.dk-row-sign').all()) {
        await expect(sign).toBeVisible();
        await expect(sign).toHaveAttribute('aria-hidden', 'true');
    }
    // A tile's title is at the lead size, as a place to go that stands alone.
    expect(
        (await style(tileList(page).locator('.dk-row-title').first(), 'font-size'))['font-size']
    ).toBe('17.6px');
    // A tile stays inside the column, where a row in an app's body reaches past it.
    const body = await box(page.locator('.dk-app-body'));
    expect(Math.round(first.x)).toBe(Math.round(body.x + 16));
});

/** What a value of the page's resolves to as a tile's shadow, a token's included. */
const shadowOf = (page: Page, value: string): Promise<string> =>
    page.evaluate((shadow) => {
        const probe = document.createElement('span');
        probe.style.boxShadow = shadow;
        document.body.append(probe);
        const resolved = getComputedStyle(probe).boxShadow;
        probe.remove();
        return resolved;
    }, value);

test('draws a tile on the surface with no ground set and no shadow, unless the page sets its own', async ({
    page,
}) => {
    for (const theme of ['light', 'dark'] as const) {
        await writePage(page, { width: 390, theme, title: 'Play', body: tiles(false) });
        const link = tileList(page).getByRole('link').first();
        expect((await style(link, 'box-shadow'))['box-shadow'], theme).toBe('none');
        expect((await style(link, 'background-color'))['background-color'], theme).toBe(
            await colorOf(page, 'var(--dk-surface)')
        );
    }
    await writePage(page, {
        width: 390,
        css: ':root { --dk-tile-shadow: 0 2px 0 rgb(0 0 0 / 0.5); }',
        title: 'Play',
        body: tiles(false),
    });
    const link = tileList(page).getByRole('link').first();
    const shadow = (await style(link, 'box-shadow'))['box-shadow'];
    expect(shadow).not.toBe('none');
    expect(shadow).toBe(await shadowOf(page, 'var(--dk-tile-shadow)'));
});

test("draws no tile's shadow in forced colors, a page's own included", async ({
    page,
    browserName,
}) => {
    test.skip(browserName === 'webkit', 'WebKit has no forced colors to draw');
    await forceColors(page);
    await writePage(page, {
        width: 390,
        css: ':root { --dk-tile-shadow: 0 2px 0 rgb(0 0 0 / 0.5); }',
        title: 'Play',
        body: tiles(false),
    });
    const link = tileList(page).getByRole('link').first();
    expect((await style(link, 'box-shadow'))['box-shadow']).toBe('none');
});

test("underlines a tile's title under a pointer, and rings it outside, as a separate control", async ({
    page,
    browserName,
}) => {
    await writePage(page, { width: 390, css: GROUNDS_CSS, title: 'Play', body: tiles() });
    const link = tileList(page).getByRole('link').first();
    const title = link.locator('.dk-row-title');
    await link.hover();
    expect((await style(title, 'text-decoration-line'))['text-decoration-line']).toBe('underline');
    await page.mouse.move(0, 0);
    await ringByKeyboard(link, browserName);
    const ring = await style(link, 'outline-style', 'outline-offset', 'outline-width');
    expect(ring['outline-style']).toBe('solid');
    expect(ring['outline-offset']).toBe('2px');
});

test("underlines a tile's title under a pressing thumb, on a phone where nothing hovers", async ({
    browser,
    browserName,
}) => {
    test.skip(browserName === 'firefox', 'Firefox emulates no touch screen');
    const context = await browser.newContext({ hasTouch: true, isMobile: true });
    try {
        const page = await context.newPage();
        await writePage(page, { width: 390, css: GROUNDS_CSS, title: 'Play', body: tiles() });
        expect(await page.evaluate(() => matchMedia('(hover: hover)').matches)).toBe(false);
        const link = tileList(page).getByRole('link').first();
        const title = link.locator('.dk-row-title');
        expect((await style(title, 'text-decoration-line'))['text-decoration-line']).toBe('none');
        const drawn = await box(link);
        await page.mouse.move(drawn.x + 20, drawn.y + 20);
        await page.mouse.down();
        expect((await style(title, 'text-decoration-line'))['text-decoration-line']).toBe(
            'underline'
        );
        await page.mouse.up();
    } finally {
        await context.close();
    }
});

test("keeps a tile's edge in forced colors, in the system's link color", async ({
    page,
    browserName,
}) => {
    test.skip(browserName === 'webkit', 'WebKit has no forced colors to draw');
    await forceColors(page);
    await writePage(page, { width: 390, css: GROUNDS_CSS, title: 'Play', body: tiles() });
    // A link takes the system's link color in forced colors, and its edge with it.
    const drawn = await style(
        tileList(page).getByRole('link').first(),
        'border-top-style',
        'border-top-color',
        'color',
        'box-shadow'
    );
    expect(drawn['border-top-style']).toBe('solid');
    expect(drawn['border-top-color']).toBe(drawn['color']);
    expect(drawn['color']).toBe(await colorOf(page, 'LinkText'));
    expect(drawn['box-shadow']).toBe('none');
});

test('draws an empty list of tiles not at all', async ({ page }) => {
    await writePage(page, {
        width: 390,
        title: 'Play',
        body: '<main id="main-content"><ul class="dk-rows dk-rows-tiles" role="list" aria-label="Start a new game">\n</ul></main>',
    });
    expect((await style(page.locator('.dk-rows-tiles'), 'display'))['display']).toBe('none');
});

test('keeps a tile at the larger target, its detail wrapping inside it at twice the text size', async ({
    page,
}) => {
    await textSize(page, 2);
    await writePage(page, { width: 320, css: GROUNDS_CSS, title: 'Play', body: tiles() });
    for (const link of await tileList(page).getByRole('link').all()) {
        const drawn = await box(link);
        expect((await style(link, 'min-height'))['min-height']).toBe('112px');
        expect(drawn.height).toBeGreaterThanOrEqual(112);
        const detail = await box(link.locator('.dk-row-detail'));
        expect(detail.x + detail.width).toBeLessThanOrEqual(drawn.x + drawn.width);
    }
    expect(await sideways(page)).toBe(0);
});

for (const theme of ['light', 'dark'] as const)
    test(`has no audit findings for a list of tiles in the ${theme} theme`, async ({ page }) => {
        await writePage(page, {
            width: 390,
            theme,
            css: GROUNDS_CSS,
            title: 'Play',
            body: tiles(),
        });
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations.map(({ id }) => id)).toEqual([]);
    });

/**
 * Reaches each link in a list of tiles by the keyboard, so its ring shows, and measures its title
 * and detail against its own ground at 4.5 to 1 and its sign at 3 to 1, and its ring, drawn outside
 * it, at 3 to 1 against what the list sits on, as drawn.
 */
const holdsItsRatios = async (list: Locator, at: string, browserName: string) => {
    const links = await list.getByRole('link').all();
    expect(links.length, at).toBeGreaterThan(0);
    const color = async (part: Locator, property = 'color') =>
        (await style(part, property))[property] ?? '';
    for (const link of links) {
        await ringByKeyboard(link, browserName);
        const ground = await color(link, 'background-color');
        const where = `${at}, ${ground}`;
        for (const [part, least] of [
            ['.dk-row-title', 4.5],
            ['.dk-row-detail', 4.5],
            ['.dk-row-sign', 3],
        ] as const)
            expect(
                contrast(await color(link.locator(part)), ground),
                `${where}, ${part}`
            ).toBeGreaterThanOrEqual(least);
        // The nearest ground under the tile, the page's where nothing between has one.
        const under = await link.evaluate((tile) => {
            for (let at = tile.parentElement; at; at = at.parentElement) {
                const drawn = getComputedStyle(at).backgroundColor;
                if (drawn !== 'rgba(0, 0, 0, 0)') return drawn;
            }
            return getComputedStyle(document.documentElement).backgroundColor;
        });
        expect(
            contrast(await color(link, 'outline-color'), under),
            `${where}, the ring on ${under}`
        ).toBeGreaterThanOrEqual(3);
    }
};

// The audit measures text and never the focus ring, and it holds the sign to the text's ratio
// rather than the one the reference names, so each part is measured on each ground here, on the
// grounds a page sets and on the surface a tile takes with none.
for (const theme of ['light', 'dark'] as const)
    for (const grounds of [true, false])
        test(`holds a tile's words at 4.5 to 1 and its sign and ring at 3 to 1, on ${grounds ? "the page's grounds" : 'the surface'} in the ${theme} theme`, async ({
            page,
            browserName,
        }) => {
            await writePage(page, {
                width: 390,
                theme,
                css: GROUNDS_CSS,
                title: 'Play',
                body: tiles(grounds),
            });
            await expect(tileList(page).getByRole('link')).toHaveCount(3);
            await holdsItsRatios(tileList(page), theme, browserName);
        });

for (const [where, width] of [
    ['a wide page', 1280],
    ['a phone', 390],
    ["an app's frame", 1280],
] as const)
    test(`starts a tile's words on the line a raised panel's start on above it, on ${where}`, async ({
        page,
    }) => {
        const body =
            '<div class="dk-panel dk-panel-raised"><p class="dk-panel-title">Flip 7, round 4</p></div>' +
            tiles(false)
                .replace(/^<div class="dk-app">.*?<ul/, '<ul')
                .replace(/<\/main><\/div>$/, '');
        await writePage(page, {
            width,
            title: 'Play',
            body:
                where === "an app's frame"
                    ? `<div class="dk-app"><main class="dk-app-body" id="main-content">${body}</main></div>`
                    : `<main id="main-content">${body}</main>`,
        });
        const panel = await box(page.locator('.dk-panel-title'), "the panel's title");
        const tile = await box(tileList(page).locator('.dk-row-title').first(), "a tile's title");
        expect(Math.round(tile.x), where).toBe(Math.round(panel.x));
    });

test("sets a tile's title in an explainer at the body size, as a panel's title there", async ({
    page,
}) => {
    await writePage(page, {
        title: 'How it works',
        body: `<main class="dk-explainer" id="main-content"><h1>How it works</h1>${tiles(false)
            .replace(/^<div class="dk-app">.*?<ul/, '<ul')
            .replace(/<\/main><\/div>$/, '')}</main>`,
    });
    expect(
        (await style(tileList(page).locator('.dk-row-title').first(), 'font-size'))['font-size']
    ).toBe('16px');
});

test("keeps a tile's whole ring in view as the keyboard scrolls an app's body to it", async ({
    page,
    browserName,
}) => {
    const many = Array.from(
        { length: 12 },
        (_, at) =>
            `<li><a class="dk-row" href="#game-${String(at)}"><span class="dk-row-text"><span class="dk-row-title">Game ${String(at + 1)}</span></span></a></li>`
    ).join('');
    await writePage(page, {
        width: 320,
        height: 568,
        title: 'Play',
        body: `<div class="dk-app"><header class="dk-app-bar"><h1 class="dk-app-title">Play</h1></header><main class="dk-app-body" id="main-content" tabindex="0"><ul class="dk-rows dk-rows-tiles" role="list" aria-label="Start a new game">${many}</ul></main></div>`,
    });
    const body = page.locator('.dk-app-body');
    await body.focus();
    const ring = 4;
    const links = await body.getByRole('link').all();
    // Forward from the body to the last tile, then back from it to the first.
    for (const [key, presses] of [
        [tabKey(browserName), links.length],
        [`Shift+${tabKey(browserName)}`, links.length - 1],
    ] as const) {
        // Each tile as the keyboard reaches it, since one scrolled just into view sits at the edge.
        for (let at = 0; at < presses; at += 1) {
            await page.keyboard.press(key);
            const focused = page.locator(':focus');
            await expect(focused).toHaveClass(/dk-row/);
            const [tile, port] = await Promise.all([
                box(focused, 'the focused tile'),
                body.evaluate((element) => {
                    const top = element.getBoundingClientRect().top + element.clientTop;
                    return { top, bottom: top + element.clientHeight };
                }),
            ]);
            const where = `${key}, press ${String(at + 1)}`;
            expect(tile.y - ring, where).toBeGreaterThanOrEqual(port.top - 0.5);
            expect(tile.y + tile.height + ring, where).toBeLessThanOrEqual(port.bottom + 0.5);
        }
    }
});

/** A picture drawn at once, of the shape a page's preview has. */
const PICTURE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90"><rect width="160" height="90" fill="#8a8a8a"/></svg>')}`;

/** A link row with a picture at its start, its title, its detail and its sign. */
const pictureRow = (name: string, at: number, size = ''): string =>
    `<li><a class="dk-row" href="#place-${String(at)}"><img class="dk-row-picture" src="${PICTURE}" alt=""${size}>` +
    `<span class="dk-row-text"><span class="dk-row-title">${name}</span><span class="dk-visually-hidden">, </span>` +
    `<span class="dk-row-detail">Played 12 games</span></span><span class="dk-row-sign" aria-hidden="true">›</span></a></li>`;

const NAMES = ['Ana', 'Benedict, who keeps the score for the whole table', 'Cal', 'Dee', 'Eve'];

const pictureList = (label: string, classes: string, size = ''): string =>
    `<ul class="dk-rows ${classes}" role="list" aria-label="${label}">${NAMES.map((name, at) => pictureRow(name, at, size)).join('')}</ul>`;

test('starts every title on one line beside a picture, in a row and a tile, with the ring clear of it', async ({
    page,
}) => {
    await writePage(page, {
        width: 390,
        title: 'Players',
        body: `<main><h1>Players</h1>${pictureList('Players', '')}${pictureList('Tiles', 'dk-rows-tiles')}${pictureList('Columns', 'dk-rows-tiles dk-rows-columns', ' width="160" height="90"')}</main>`,
    });
    for (const label of ['Players', 'Tiles', 'Columns']) {
        const links = await page.getByRole('list', { name: label }).getByRole('link').all();
        const starts = new Set<number>();
        for (const link of links) {
            const title = await box(link.locator('.dk-row-title'));
            starts.add(Math.round(title.x));
            await link.focus();
            const ring = parseFloat((await style(link, 'outline-width'))['outline-width'] ?? '0');
            const row = await box(link);
            const picture = await box(link.locator('.dk-row-picture'));
            expect(ring, label).toBeGreaterThan(0);
            expect(picture.x - row.x, label).toBeGreaterThan(ring);
            expect(picture.y - row.y, label).toBeGreaterThan(ring);
        }
        expect([...starts], label).toHaveLength(1);
        // The picture says nothing, so each link's name starts with its title.
        await expect(links[0] ?? page.locator('#none'), label).toHaveAccessibleName(/^Ana\b/);
    }
});

/** The tiles in columns, on a plain page, each with a picture across its top. */
const columns = (): string =>
    `<main><h1>Pages</h1>${pictureList('Pages', 'dk-rows-tiles dk-rows-columns', ' width="160" height="90"')}</main>`;

/** Each tile's place on the page, in the order written. */
const places = (page: Page) =>
    page
        .getByRole('list', { name: 'Pages' })
        .getByRole('link')
        .evaluateAll((links) =>
            links.map((link) => {
                const drawn = link.getBoundingClientRect();
                return {
                    x: Math.round(drawn.x),
                    y: Math.round(drawn.y),
                    height: Math.round(drawn.height),
                };
            })
        );

test('flows tiles into columns on a wide page, one column on a phone, in reading order for the keyboard', async ({
    page,
    browserName,
}) => {
    for (const width of [1280, 320]) {
        await writePage(page, { width, title: 'Pages', body: columns() });
        const drawn = await places(page);
        const across = new Set(drawn.map(({ x }) => x)).size;
        if (width === 1280) {
            expect(across, '1280px').toBeGreaterThan(1);
            expect(drawn[1]?.y, '1280px').toBe(drawn[0]?.y);
            // The tiles on one line end together, a long title's beside a short one's.
            expect(drawn[1]?.height, '1280px').toBe(drawn[0]?.height);
        } else expect(across, '320px').toBe(1);
        // Written order is reading order, row by row, and the keyboard's.
        const read = [...drawn.keys()].sort(
            (a, b) =>
                (drawn[a]?.y ?? 0) - (drawn[b]?.y ?? 0) || (drawn[a]?.x ?? 0) - (drawn[b]?.x ?? 0)
        );
        expect(read, `${String(width)}px`).toEqual([...drawn.keys()]);
        await page.getByRole('heading', { name: 'Pages' }).click();
        const visited: string[] = [];
        for (const _ of NAMES) {
            await page.keyboard.press(tabKey(browserName));
            visited.push(
                await page.evaluate(() => document.activeElement?.getAttribute('href') ?? '')
            );
        }
        expect(visited, `${String(width)}px`).toEqual(NAMES.map((_, at) => `#place-${String(at)}`));
        // The picture spans the tile's top at its own shape, with the title at the body size under it.
        const tile = page.getByRole('link').first();
        const picture = await box(tile.locator('.dk-row-picture'));
        const title = await box(tile.locator('.dk-row-title'));
        expect(Math.round(picture.height), `${String(width)}px`).toBe(
            Math.round((picture.width * 90) / 160)
        );
        expect(title.y, `${String(width)}px`).toBeGreaterThanOrEqual(picture.y + picture.height);
        expect((await style(tile.locator('.dk-row-title'), 'font-size'))['font-size']).toBe('16px');
    }
});

test('keeps tiles in one column on the narrowest phone at twice the text size and the wider spacing, a word cut off nowhere', async ({
    page,
}) => {
    // A row, a tile and a large picture a page sets, none scrolling sideways or cutting off a word.
    await textSize(page, 2);
    await writePage(page, {
        width: 320,
        title: 'Pages',
        css: `${SPACED} #large { --dk-row-picture-size: 6rem; }`,
        body:
            columns() +
            pictureList('Players', '') +
            pictureList('Tiles', 'dk-rows-tiles') +
            `<div id="large">${pictureList('Large', 'dk-rows-tiles')}</div>`,
    });
    expect(await sideways(page)).toBe(0);
    expect(new Set((await places(page)).map(({ x }) => x)).size).toBe(1);
    expect(await cutOff(page, '.dk-row-text')).toEqual([]);
});

for (const theme of ['light', 'dark'] as const)
    test(`steps a tile's ground off a plain panel to the page's, and off a raised one to the card's, in the ${theme} theme`, async ({
        page,
        browserName,
    }) => {
        await writePage(page, {
            theme,
            title: 'Grounds',
            body:
                `<main><h1>Grounds</h1><section class="dk-panel" aria-label="Plain">${pictureList('In a panel', 'dk-rows-tiles')}</section>` +
                `<section class="dk-panel dk-panel-raised" aria-label="Raised">${pictureList('In a raised panel', 'dk-rows-tiles dk-rows-columns')}</section></main>`,
        });
        const ground = (label: string) =>
            page
                .getByRole('list', { name: label })
                .getByRole('link')
                .first()
                .evaluate((link) => getComputedStyle(link).backgroundColor);
        expect(await ground('In a panel')).toBe(await colorOf(page, 'var(--dk-bg)'));
        expect(await ground('In a raised panel')).toBe(await colorOf(page, 'var(--dk-surface)'));
        // The title, the muted detail, the sign and the ring hold their ratios on each stepped ground.
        for (const label of ['In a panel', 'In a raised panel'])
            await holdsItsRatios(
                page.getByRole('list', { name: label }),
                `${theme}, ${label}`,
                browserName
            );
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations.map(({ id }) => id)).toEqual([]);
    });
