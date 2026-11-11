import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';

import { box, style, writePage } from './page.js';

/*
 * A table that pins its first column, as a browser draws it: the column naming each row in view
 * while the rest scrolls sideways, the cells passing under it never showing through, on the page's
 * ground and on a panel's, in both themes and in forced colors, its rule traveling with it, its
 * frame named and scrolled by the keyboard, a table without the class unchanged, and no audit
 * findings in either theme.
 */

const PLAYERS = ['Ana', 'Ben', 'Cal', 'Dee', 'Eli', 'Fay', 'Gus', 'Hal'];
const ROUNDS = 12;

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
        `<tr><th scope="row">${player}</th>${Array.from(
            { length: ROUNDS },
            (_, round) => `<td class="dk-table-number">${String((row + 1) * (round + 3))}</td>`
        ).join('')}</tr>`
).join('')}</tbody></table></div>`;

const open = async (
    page: Page,
    {
        theme = 'light',
        pinned = true,
        panel = false,
    }: {
        readonly theme?: 'light' | 'dark';
        readonly pinned?: boolean;
        readonly panel?: boolean;
    } = {}
): Promise<void> => {
    const held = table(pinned);
    await writePage(page, {
        width: 360,
        theme,
        title: 'Scores',
        body: `<main><h1>Scores</h1>${panel ? `<div class="dk-panel">${held}</div>` : held}</main>`,
    });
};

const frame = (page: Page): Locator => page.getByRole('region', { name: 'Scores by round' });
const cell = (page: Page, name: string): Locator =>
    page.getByRole('rowheader', { name, exact: true });

const scrollBy = (page: Page, across: number): Promise<void> =>
    frame(page).evaluate((element, by) => {
        element.scrollLeft += by;
    }, across);

/** The element drawn on top at the middle of the one the locator finds. */
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

test('keeps the column naming each row in view while the rest scrolls sideways', async ({
    page,
}) => {
    await open(page);
    const start = await box(frame(page), 'the frame');
    const round = page.getByRole('columnheader', { name: 'Round 1', exact: true });
    const before = await box(round, 'a round');
    await scrollBy(page, 200);
    expect(await frame(page).evaluate((element) => element.scrollLeft)).toBe(200);
    expect((await box(cell(page, 'Ana'), 'the pinned cell')).x).toBe(start.x);
    expect((await box(round, 'a round')).x).toBe(before.x - 200);
    expect((await box(page.getByRole('columnheader', { name: 'Player' }), 'its head')).x).toBe(
        start.x
    );
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
            // The pinned cells take the ground of what holds the table, which is opaque.
            const ground = (
                await style(page.locator(panel ? '.dk-panel' : 'body'), 'background-color')
            )['background-color'];
            expect(
                (await style(cell(page, 'Ana'), 'background-color'))['background-color'],
                what
            ).toBe(ground);
        }
    }
});

test('keeps the pinned cells on top in forced colors', async ({ browser }) => {
    const context = await browser.newContext({ forcedColors: 'active' });
    try {
        const page = await context.newPage();
        await open(page);
        await scrollBy(page, 120);
        for (const player of PLAYERS) expect(await onTop(page, cell(page, player))).toBe(player);
    } finally {
        await context.close();
    }
});

test("draws each row's rule under a pinned cell as it travels, and a rule where the column stops", async ({
    page,
}) => {
    await open(page);
    await scrollBy(page, 120);
    const pinned = await box(cell(page, 'Ana'), 'the pinned cell');
    const next = await box(page.getByRole('cell').first(), 'a cell');
    expect(
        await style(cell(page, 'Ana'), 'border-bottom-width', 'border-inline-end-style')
    ).toEqual({ 'border-bottom-width': '1px', 'border-inline-end-style': 'solid' });
    // The pinned cell's rule lies level with the rule of the cells beside it.
    expect(pinned.y + pinned.height).toBe(next.y + next.height);
});

test('takes the keyboard into its frame, named, and scrolls by the arrow keys', async ({
    page,
}) => {
    await open(page);
    await expect(frame(page)).toBeVisible();
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
