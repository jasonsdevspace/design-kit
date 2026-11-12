import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';

import { box, style, writePage } from './page.js';
import { textSize } from './text-size.js';

/*
 * A table that pins its first column, as a browser draws it: the column naming each row in view
 * while the rest scrolls sideways, the cells passing under it never showing through, its head
 * included, on the page's ground, a panel's or one a page sets, in both themes and in forced
 * colors, its rule traveling with it, what the keyboard reaches in a cell kept clear of it, its
 * frame named and scrolled by the keyboard, a table without the class unchanged, and no audit
 * findings in either theme.
 */

const PLAYERS = ['Ana', 'Ben', 'Cal', 'Dee', 'Eli', 'Fay', 'Gus', 'Hal'];
const ROUNDS = 12;

/** A score in Ana's sixth round is a link, as a page that edits a score in place writes it. */
const score = (row: number, round: number): string =>
    row === 0 && round === 5
        ? `<td class="dk-table-number"><a href="#edit" id="edit">${String(round + 3)}</a></td>`
        : `<td class="dk-table-number">${String((row + 1) * (round + 3))}</td>`;

const table = (
    pinned: boolean
): string => `<p class="dk-table-title" id="scores">Scores by round</p>
<div class="dk-table-scroll" role="region" aria-labelledby="scores" tabindex="0">
<table class="dk-table${pinned ? ' dk-table-pinned' : ''}" aria-labelledby="scores">
<thead><tr><th scope="col">Player</th>${Array.from(
    { length: ROUNDS },
    (_, round) => `<th scope="col" class="dk-table-number">Round ${String(round + 1)}</th>`
).join('')}</tr></thead>
<tbody>${PLAYERS.map(
    (player, row) =>
        `<tr><th scope="row">${player}</th>${Array.from({ length: ROUNDS }, (_, round) =>
            score(row, round)
        ).join('')}</tr>`
).join('')}</tbody></table></div>`;

const open = async (
    page: Page,
    {
        theme = 'light',
        pinned = true,
        panel = false,
        css = '',
        width = 360,
    }: {
        readonly theme?: 'light' | 'dark';
        readonly pinned?: boolean;
        readonly panel?: boolean;
        readonly css?: string;
        readonly width?: number;
    } = {}
): Promise<void> => {
    const held = table(pinned);
    await writePage(page, {
        width,
        theme,
        css,
        title: 'Scores',
        body: `<main><h1>Scores</h1>${panel ? `<div class="dk-panel">${held}</div>` : held}</main>`,
    });
};

const frame = (page: Page): Locator => page.getByRole('region', { name: 'Scores by round' });
const cell = (page: Page, name: string): Locator =>
    page.getByRole('rowheader', { name, exact: true });
const head = (page: Page): Locator => page.getByRole('columnheader', { name: 'Player' });

const scrollBy = (page: Page, across: number): Promise<void> =>
    frame(page).evaluate((element, by) => {
        element.scrollLeft += by;
    }, across);

/** The cell hit at the middle of the element the locator finds, which is the one on top. */
const onTop = async (page: Page, locator: Locator): Promise<string> => {
    const drawn = await box(locator, 'the cell');
    return page.evaluate(
        ([x, y]) => {
            const top = document.elementFromPoint(x ?? 0, y ?? 0);
            return top?.closest('th, td')?.textContent ?? '';
        },
        [drawn.x + drawn.width / 2, drawn.y + drawn.height / 2]
    );
};

const ground = (locator: Locator): Promise<string> =>
    style(locator, 'background-color').then((read) => read['background-color'] ?? '');

test('keeps the column naming each row in view while the rest scrolls sideways', async ({
    page,
}) => {
    await open(page);
    const start = await box(frame(page), 'the frame');
    const round = page.getByRole('columnheader', { name: 'Round 1', exact: true });
    const before = await box(round, 'a round');
    await scrollBy(page, 200);
    expect(await frame(page).evaluate((element) => element.scrollLeft)).toBe(200);
    expect((await box(cell(page, 'Ana'), 'the pinned cell')).x).toBeCloseTo(start.x, 0);
    expect((await box(head(page), 'its head')).x).toBeCloseTo(start.x, 0);
    expect((await box(round, 'a round')).x).toBeCloseTo(before.x - 200, 0);
});

test('lets nothing that passes under the pinned cells show through, on a page and on a panel, in both themes', async ({
    page,
}) => {
    for (const panel of [false, true]) {
        for (const theme of ['light', 'dark'] as const) {
            await open(page, { theme, panel });
            await scrollBy(page, 120);
            const what = `${theme}, panel: ${String(panel)}`;
            for (const player of PLAYERS) {
                expect(await onTop(page, cell(page, player)), what).toBe(player);
            }
            expect(await onTop(page, head(page)), what).toBe('Player');
            // The pinned cells take the ground of what holds the table, which is opaque.
            const held = await ground(page.locator(panel ? '.dk-panel' : 'body'));
            expect(await ground(cell(page, 'Ana')), what).toBe(held);
            expect(await ground(head(page)), what).toBe(held);
        }
    }
});

test('lets the column scroll with the rest on a phone at a large text size, and keeps it pinned on one at the usual size', async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    /** Whether the names stay where they were as the frame scrolls sideways. */
    const pinnedAt = async (width: number, scale: number) => {
        await open(page, { width });
        await textSize(page, scale);
        const start = (await box(cell(page, 'Ana'), 'a name')).x;
        await scrollBy(page, 120);
        const moved = Math.abs((await box(cell(page, 'Ana'), 'a name')).x - start) > 1;
        const room = await frame(page).evaluate(
            (element) => getComputedStyle(element).scrollPaddingInlineStart
        );
        return { pinned: !moved, room };
    };
    expect(await pinnedAt(320, 1)).toEqual({ pinned: true, room: '128px' });
    expect(await pinnedAt(360, 1.25)).toEqual({ pinned: true, room: '160px' });
    expect(await pinnedAt(430, 1.5)).toEqual({ pinned: true, room: '192px' });
    expect(await pinnedAt(320, 1.25)).toEqual({ pinned: false, room: '0px' });
    expect(await pinnedAt(360, 1.5)).toEqual({ pinned: false, room: '0px' });
    expect(await pinnedAt(390, 1.5)).toEqual({ pinned: false, room: '0px' });
    expect(await pinnedAt(320, 2)).toEqual({ pinned: false, room: '0px' });
    expect(await pinnedAt(390, 2)).toEqual({ pinned: false, room: '0px' });
});

test('takes the ground a page sets for a table on a ground of its own', async ({ page }) => {
    await open(page, { css: '.dk-table-scroll { --dk-table-ground: rgb(1, 2, 3); }' });
    expect(await ground(cell(page, 'Ana'))).toBe('rgb(1, 2, 3)');
});

test('keeps the pinned cells on top, on a ground that hides what passes under, in forced colors', async ({
    browser,
}) => {
    const context = await browser.newContext({ forcedColors: 'active' });
    try {
        const page = await context.newPage();
        await open(page);
        await scrollBy(page, 120);
        for (const player of PLAYERS) expect(await onTop(page, cell(page, player))).toBe(player);
        expect(await ground(cell(page, 'Ana'))).not.toBe('rgba(0, 0, 0, 0)');
    } finally {
        await context.close();
    }
});

test("draws each row's rule under a pinned cell as it travels, and a rule where the column stops", async ({
    page,
}) => {
    await open(page);
    await scrollBy(page, 120);
    expect(
        await style(cell(page, 'Ana'), 'border-bottom-width', 'border-inline-end-style')
    ).toEqual({ 'border-bottom-width': '1px', 'border-inline-end-style': 'solid' });
    // The pinned cell's rule lies level with the rule of the cells beside it in its row.
    const pinned = await box(cell(page, 'Ana'), 'the pinned cell');
    const beside = await box(
        page.getByRole('row', { name: /^Ana/ }).getByRole('cell').first(),
        "a cell in Ana's row"
    );
    expect(pinned.y + pinned.height).toBeCloseTo(beside.y + beside.height, 0);
});

test('scrolls what the keyboard reaches in a cell clear of the pinned column', async ({ page }) => {
    await open(page, { css: '.dk-table-scroll { --dk-table-pinned-size: 5rem; }' });
    const link = page.locator('#edit');
    // Scrolled until the link sits under the pinned cell, still inside the frame, where a browser
    // takes it as in view and would not scroll to it.
    const under = (await box(link, 'the link')).x - (await box(cell(page, 'Ana'), 'the cell')).x;
    await scrollBy(page, Math.round(under) - 8);
    expect(await onTop(page, link)).toBe('Ana');
    await link.focus();
    const pinned = await box(cell(page, 'Ana'), 'the pinned cell');
    expect((await box(link, 'the link')).x).toBeGreaterThanOrEqual(pinned.x + pinned.width - 1);
    expect(await onTop(page, link)).not.toBe('Ana');
});

test('takes the keyboard into its frame, named, and scrolls by the arrow keys', async ({
    page,
}) => {
    await open(page);
    await page.keyboard.press('Tab');
    await expect(frame(page)).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect
        .poll(() => frame(page).evaluate((element) => element.scrollLeft))
        .toBeGreaterThan(0);
    // A screen reader still reads it as one table, with its heads.
    await expect(page.getByRole('table', { name: 'Scores by round' })).toBeVisible();
    await expect(page.getByRole('rowheader')).toHaveCount(PLAYERS.length);
});

test('leaves a table without the class as it was', async ({ page }) => {
    await open(page, { pinned: false });
    expect(await style(cell(page, 'Ana'), 'position', 'background-color')).toEqual({
        position: 'static',
        'background-color': 'rgba(0, 0, 0, 0)',
    });
    expect((await style(page.locator('table'), 'border-collapse'))['border-collapse']).toBe(
        'collapse'
    );
    expect(
        (await style(frame(page), 'scroll-padding-inline-start'))['scroll-padding-inline-start']
    ).toBe('auto');
    await scrollBy(page, 120);
    expect((await box(cell(page, 'Ana'), 'the cell')).x).toBeLessThan(
        (await box(frame(page), 'the frame')).x
    );
});

for (const theme of ['light', 'dark'] as const) {
    test(`has no audit findings in the ${theme} theme`, async ({ page }) => {
        await open(page, { theme });
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });
}
