import { expect, type Locator, type Page, test } from '@playwright/test';

import { box, sideways, writePage } from './page.js';
import { doubled } from './text-size.js';

/*
 * The columns a grid of buttons draws where those asked for do not fit, in every engine, since
 * they rest on each engine's sums of a share and its clamps: the most that fit and divide its
 * cells evenly for a count some smaller count divides, as many as fit for any other, a grid of
 * fewer cells than the columns asked for in one row, and every cell at the target.
 */

/** A page of plain keys in a grid asking for some columns, inside an app frame's gutters. */
const keys = async (
    page: Page,
    { count, columns, width }: { count: number; columns: number; width: number }
): Promise<Locator> => {
    await writePage(page, {
        width,
        title: 'Keys',
        css: 'main { padding-inline: var(--dk-space-4); }',
        body:
            `<main><div class="dk-button-grid" role="group" aria-label="Keys" style="--dk-button-grid-columns: ${String(columns)}">` +
            Array.from(
                { length: count },
                (_, at) => `<button type="button" class="dk-button">${String(at)}</button>`
            ).join('') +
            '</div></main>',
    });
    return page.getByRole('group', { name: 'Keys' });
};

/** How many columns a grid draws, from where its first row's cells start. */
const columnsOf = async (grid: Locator): Promise<number> => {
    const starts = await grid
        .getByRole('button')
        .evaluateAll((cells) => cells.map((cell) => Math.round(cell.getBoundingClientRect().y)));
    return starts.filter((y) => y === starts[0]).length;
};

/** The grid's width, its gap and the target a cell is held to, as the browser draws them. */
const measures = (grid: Locator) =>
    grid.evaluate((element) => {
        const probe = document.createElement('div');
        probe.style.width = 'var(--dk-target)';
        element.after(probe);
        const least = probe.getBoundingClientRect().width;
        probe.remove();
        return {
            width: element.clientWidth,
            gap: Number.parseFloat(getComputedStyle(element).columnGap),
            least,
        };
    });

/** Each count of cells the grid evens out, and the counts it draws, most first. */
const EVEN: Readonly<Partial<Record<number, readonly number[]>>> = {
    4: [4, 2],
    6: [6, 3, 2],
    8: [4, 2],
    9: [3, 2],
    10: [5, 2],
    12: [6, 4, 3, 2],
};

/** The columns the grid should draw, worked out from its measures by the rule the sheet keeps. */
const expected = (
    count: number,
    asked: number,
    { width, gap, least }: { width: number; gap: number; least: number }
): number => {
    const fits = (columns: number) => (width - (columns - 1) * gap) / columns >= least;
    if (fits(asked)) return asked;
    const even = EVEN[count];
    if (even === undefined) {
        let most = 1;
        while (most < asked && fits(most + 1)) most += 1;
        return most;
    }
    return even.find((columns) => columns <= asked && fits(columns)) ?? 1;
};

test('draws the most columns that fit and divide its cells evenly, where those asked for do not fit', async ({
    page,
}) => {
    for (const count of [4, 6, 8, 9, 10, 12, 13]) {
        for (let width = 240; width <= 640; width += 11) {
            const grid = await keys(page, { count, columns: 6, width });
            const drawn = await columnsOf(grid);
            const { least, ...rest } = await measures(grid);
            const label = `${String(count)} cells at ${String(width)}px`;
            // A row shows no more cells than the grid holds.
            expect(drawn, label).toBe(Math.min(count, expected(count, 6, { least, ...rest })));
            // Where the columns asked for fit, the grid draws them, even or not.
            if (EVEN[count] !== undefined && drawn < Math.min(count, 6))
                expect(count % drawn, label).toBe(0);
            for (const cell of await grid.getByRole('button').all()) {
                expect((await box(cell, 'a cell')).width, label).toBeGreaterThanOrEqual(least);
            }
        }
    }
});

test('draws six asked in six as three on a phone, at the usual and at twice the text size', async ({
    page,
    browserName,
}) => {
    expect(await columnsOf(await keys(page, { count: 6, columns: 6, width: 320 }))).toBe(3);
    const grid = await keys(page, { count: 6, columns: 6, width: 390 });
    await doubled(page, browserName);
    expect(await columnsOf(grid)).toBe(3);
    const { least } = await measures(grid);
    for (const cell of await grid.getByRole('button').all()) {
        const drawn = await box(cell, 'a cell');
        expect(drawn.width).toBeGreaterThanOrEqual(least);
        expect(drawn.height).toBeGreaterThanOrEqual(least);
    }
    expect(await sideways(page)).toBe(0);
});

test('keeps a grid of fewer cells than the columns asked for in one row', async ({ page }) => {
    for (const width of [240, 320, 390]) {
        expect(await columnsOf(await keys(page, { count: 4, columns: 6, width }))).toBe(4);
    }
});
