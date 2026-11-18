import { expect, type Locator, type Page, test } from '@playwright/test';

import { box, sideways, writePage } from './page.js';
import { doubled } from './text-size.js';

/*
 * The columns a grid of buttons draws where those asked for do not fit, in every engine, since
 * they rest on each engine's sums of a share and its clamps: the most that fit and divide its
 * cells evenly for a count some smaller count divides, as many as fit for any other, a grid of
 * fewer cells than the columns asked for in the tracks it drew before, one column where no more
 * fit, every cell at the target and none wider than the grid.
 */

/** A page of plain keys in a grid asking for some columns, inside an app frame's gutters. */
const keys = async (
    page: Page,
    {
        count,
        columns,
        width,
        tall = false,
    }: { count: number; columns: number; width: number; tall?: boolean }
): Promise<Locator> => {
    await writePage(page, {
        width,
        title: 'Keys',
        css: 'main { padding-inline: var(--dk-space-4); }',
        body:
            `<main><div class="dk-button-grid${tall ? ' dk-button-grid-tall' : ''}" role="group" aria-label="Keys" style="--dk-button-grid-columns: ${String(columns)}">` +
            Array.from(
                { length: count },
                (_, at) => `<button type="button" class="dk-button">${String(at)}</button>`
            ).join('') +
            '</div></main>',
    });
    return page.getByRole('group', { name: 'Keys' });
};

/** Sets the grid's own width, so one page measures every width without being written again. */
const widen = (grid: Locator, width: number) =>
    grid.evaluate((element, px) => {
        if (element instanceof HTMLElement) element.style.width = `${String(px)}px`;
    }, width);

/** How many columns a grid draws, from where its first row's cells start. */
const columnsOf = async (grid: Locator): Promise<number> => {
    const starts = await grid
        .getByRole('button')
        .evaluateAll((cells) => cells.map((cell) => Math.round(cell.getBoundingClientRect().y)));
    return starts.filter((y) => y === starts[0]).length;
};

/**
 * The grid's width, its gap, the least width a cell is held to, measured beside the grid so its
 * count of cells stays as it is, and the widest cell and how far the cells reach past its edge.
 */
const measures = (grid: Locator, tall = false) =>
    grid.evaluate(
        (element, target) => {
            const probe = document.createElement('div');
            probe.style.width = `var(${target})`;
            element.after(probe);
            const least = probe.getBoundingClientRect().width;
            probe.remove();
            const cells = [...element.children].map((cell) => cell.getBoundingClientRect().width);
            return {
                width: element.clientWidth,
                gap: Number.parseFloat(getComputedStyle(element).columnGap),
                least,
                widest: Math.max(...cells),
                narrowest: Math.min(...cells),
                past: element.scrollWidth - element.clientWidth,
            };
        },
        tall ? '--dk-target-large' : '--dk-target'
    );

/** Each count of cells the grid evens out, and the counts it draws, most first. */
const EVEN: Readonly<Partial<Record<number, readonly number[]>>> = {
    4: [4, 2],
    6: [6, 3, 2],
    8: [4, 2],
    9: [3, 2],
    10: [5, 2],
    12: [6, 4, 3, 2],
};

/** The tracks the grid should draw, worked out from its measures by the rule the sheet keeps. */
const share = (width: number, gap: number, columns: number) =>
    (width - (columns - 1) * gap) / columns;

const expected = (
    count: number,
    asked: number,
    { width, gap, least }: { width: number; gap: number; least: number }
): number => {
    const fits = (columns: number) => share(width, gap, columns) >= least;
    if (fits(asked)) return asked;
    let most = 1;
    while (most < asked && fits(most + 1)) most += 1;
    const even = EVEN[count];
    // A grid holding no more cells than fit in a row lays them out in as many tracks as fit.
    if (even === undefined || most >= count) return most;
    return even.find((columns) => columns <= asked && fits(columns)) ?? 1;
};

for (const [name, tall, twice] of [
    ['a grid', false, false],
    ['a tall grid', true, false],
    ['a grid at twice the text size', false, true],
] as const) {
    test(`draws ${name} in the most columns that fit and divide its cells, where those asked for do not fit`, async ({
        page,
        browserName,
    }) => {
        for (const count of [4, 6, 8, 9, 10, 12, 13]) {
            const grid = await keys(page, { count, columns: 6, width: 1280, tall });
            if (twice) await doubled(page, browserName);
            for (let width = 120; width <= 640; width += 7) {
                await widen(grid, width);
                const drawn = await columnsOf(grid);
                const { least, widest, narrowest, past, ...rest } = await measures(grid, tall);
                const label = `${String(count)} cells in ${String(width)}px`;
                // No cell is ever wider than the grid, at any width.
                expect(past, label).toBeLessThanOrEqual(0);
                // Where a share lands on the target, each engine rounds it its own way, so either
                // count of columns is right there.
                const edge = [2, 3, 4, 5, 6].some(
                    (columns) => Math.abs(share(rest.width, rest.gap, columns) - least) < 0.5
                );
                if (edge) continue;
                const tracks = expected(count, 6, { least, ...rest });
                // A row shows no more cells than the grid holds.
                expect(drawn, label).toBe(Math.min(count, tracks));
                // Fewer columns than asked, past two, divide the cells of a count it evens out.
                if (EVEN[count] !== undefined && drawn > 2 && drawn < Math.min(count, 6)) {
                    expect(count % drawn, label).toBe(0);
                }
                // Each cell takes its track's even share, at least the target where one fits.
                expect(widest, label).toBeCloseTo(share(rest.width, rest.gap, tracks), 0);
                if (rest.width >= least) {
                    expect(narrowest, label).toBeGreaterThanOrEqual(least - 1);
                }
            }
        }
    });
}

test('draws one column across the grid where it asks for one, whatever it holds', async ({
    page,
}) => {
    for (const count of [4, 6, 12]) {
        const grid = await keys(page, { count, columns: 1, width: 1280 });
        for (const width of [60, 90, 200]) {
            await widen(grid, width);
            expect(await columnsOf(grid), `${String(count)} in ${String(width)}px`).toBe(1);
            const { widest, past } = await measures(grid);
            expect(widest).toBeCloseTo(width, 0);
            expect(past).toBeLessThanOrEqual(0);
        }
    }
});

test('counts its cells again as a page takes one away and adds one', async ({ page }) => {
    const grid = await keys(page, { count: 7, columns: 6, width: 320 });
    expect(await columnsOf(grid)).toBe(5);
    await grid.evaluate((element) => {
        element.lastElementChild?.remove();
    });
    expect(await columnsOf(grid)).toBe(3);
    await grid.evaluate((element) => {
        element.append(element.lastElementChild?.cloneNode(true) ?? '');
    });
    expect(await columnsOf(grid)).toBe(5);
    await grid.evaluate((element) => {
        element.lastElementChild?.remove();
    });
    expect(await columnsOf(grid)).toBe(3);
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

test('keeps four cells asked for in six in one row on a phone, at the width of the tracks that fit', async ({
    page,
}) => {
    for (const width of [240, 320, 390]) {
        const grid = await keys(page, { count: 4, columns: 6, width });
        expect(await columnsOf(grid), `${String(width)}px`).toBe(4);
    }
});
