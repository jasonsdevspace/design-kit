import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { splitRow } from '../examples/examples.js';
import { box, colorOf, forceColors, lengthOf, sideways, style, writePage } from './page.js';
import { cutOff, SPACED } from './spacing.js';
import { doubled } from './text-size.js';

/*
 * A split row, a note and a large numeral, as the reference draws them on a content page, and a
 * group of sections narrowed by its least width: the row's start and end on one line, lined up on
 * their baseline, the end under the start a small step apart where they do not fit, a long first
 * word broken rather than the page pushed sideways at 320px and twice the text size, the note muted
 * at the small size and the normal weight beside a label's words, the numeral at its size in the
 * mono face with tabular figures and whole under wider spacing, the group's least width set by
 * --dk-sections-least, and no audit findings in either theme or in forced colors.
 */

const EXAMPLE = renderToStaticMarkup(splitRow);

/** The example with a name too long for a phone's line, written with no place to break it. */
const LONG = EXAMPLE.replace('<h2>Ana</h2>', '<h2>Bartholomewfeatherstonehaughsmythe</h2>');

/**
 * How far the numeral's text stands clear of the line above it and the line under it, each at
 * least zero where the figure runs into neither.
 */
const clearOfNeighbors = (page: Page) =>
    page.evaluate(() => {
        const figure = document.querySelector('.dk-numeral');
        const above = figure?.previousElementSibling?.getBoundingClientRect();
        const below = figure?.nextElementSibling?.getBoundingClientRect();
        if (!figure?.firstChild || !above || !below)
            throw new Error('expected a numeral between two lines');
        const range = document.createRange();
        range.selectNodeContents(figure.firstChild);
        const text = range.getBoundingClientRect();
        return {
            above: Math.round(text.top - above.bottom),
            below: Math.round(below.top - text.bottom),
        };
    });

/** The lines the numeral's figure is drawn on. */
const figureLines = (page: Page) =>
    page.evaluate(() => {
        const figure = document.querySelector('.dk-numeral')?.firstChild;
        if (!figure) throw new Error('expected a numeral');
        const range = document.createRange();
        range.selectNodeContents(figure);
        return new Set([...range.getClientRects()].map(({ top }) => Math.round(top))).size;
    });

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
        title: 'Split',
        body: `<main class="dk-page"><h1>Scores</h1>${body}</main>`,
        theme,
        css,
        width,
    });

test('sets the start and the end on one line, on their baseline, at the ends of the row', async ({
    page,
}) => {
    await draw(page, EXAMPLE);
    const row = await box(page.locator('.dk-split'));
    const name = await box(page.locator('.dk-split > h2'));
    const round = await box(page.locator('.dk-split > .dk-note'));
    expect(name.x).toBe(row.x);
    expect(Math.round(round.x + round.width)).toBe(Math.round(row.x + row.width));
    const baselines = await page.evaluate(() =>
        [...document.querySelectorAll('.dk-split > *')].map((piece) => {
            const probe = document.createElement('span');
            probe.style.display = 'inline-block';
            piece.prepend(probe);
            const at = probe.getBoundingClientRect().bottom;
            probe.remove();
            return Math.round(at);
        })
    );
    expect(new Set(baselines).size).toBe(1);
    expect(await style(page.locator('.dk-split > h2'), 'margin-top', 'margin-bottom')).toEqual({
        'margin-top': '0px',
        'margin-bottom': '0px',
    });
});

test('puts the end under the start a small step apart where they do not fit', async ({ page }) => {
    await draw(page, LONG, { width: 320 });
    const name = await box(page.locator('.dk-split > h2'));
    const round = await box(page.locator('.dk-split > .dk-note'));
    expect(Math.round(round.y - (name.y + name.height))).toBe(
        await lengthOf(page, 'var(--dk-space-1)')
    );
});

test('breaks a long first word rather than push the page sideways at twice the text size', async ({
    page,
    browserName,
}) => {
    await draw(page, LONG, { width: 320 });
    await doubled(page, browserName);
    expect(await sideways(page)).toBe(0);
    // The numeral's line is no taller than its figure, so its text stands past the line's box by
    // the face's own room above and below the digits, and must run into nothing around it.
    expect(await cutOff(page, '.dk-split, .dk-split > *, .dk-note')).toEqual([]);
    const clear = await clearOfNeighbors(page);
    expect(clear.above).toBeGreaterThanOrEqual(0);
    expect(clear.below).toBeGreaterThanOrEqual(0);
    const row = await box(page.locator('.dk-split'));
    const name = await box(page.locator('.dk-split > h2'));
    expect(name.x + name.width).toBeLessThanOrEqual(row.x + row.width + 1);
});

test('draws a note muted at the small size, and a numeral at its size in tabular mono', async ({
    page,
}) => {
    await draw(page, EXAMPLE);
    const note = await style(page.locator('.dk-split > .dk-note'), 'color', 'font-size');
    expect(note.color).toBe(await colorOf(page, 'var(--dk-muted)'));
    expect(Number.parseFloat(note['font-size'] ?? '')).toBeCloseTo(
        await lengthOf(page, 'var(--dk-text-small)'),
        1
    );
    const numeral = await style(
        page.locator('.dk-numeral'),
        'font-size',
        'font-variant-numeric',
        'font-weight',
        'line-height',
        'font-family'
    );
    const size = await lengthOf(page, 'var(--dk-text-numeral)');
    expect(numeral['font-size']).toBe(`${String(size)}px`);
    expect(numeral['font-variant-numeric']).toBe('tabular-nums');
    expect(numeral['font-weight']).toBe(
        await page.evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--dk-weight-strong').trim()
        )
    );
    expect(numeral['line-height']).toBe(`${String(size)}px`);
    expect(numeral['font-family']).toContain('monospace');
});

test("draws a note beside a label's words at the normal weight, not the label's", async ({
    page,
}) => {
    await draw(
        page,
        '<div class="dk-field"><label class="dk-field-label" for="tricks">Ana ' +
            '<span class="dk-note">deals</span></label><input class="dk-input" id="tricks"></div>'
    );
    const label = await style(page.locator('.dk-field-label'), 'font-weight');
    const note = await style(page.locator('.dk-field-label > .dk-note'), 'font-weight');
    const normal = await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--dk-weight-normal').trim()
    );
    expect(label['font-weight']).not.toBe(normal);
    expect(note['font-weight']).toBe(normal);
});

test('keeps the numeral and the row whole under wider text spacing', async ({ page }) => {
    await draw(page, LONG, { css: SPACED, width: 320 });
    expect(await sideways(page)).toBe(0);
    expect(await cutOff(page, '.dk-split, .dk-split > *, .dk-numeral, .dk-note')).toEqual([]);
    const numeral = await box(page.locator('.dk-numeral'));
    const glyphs = await page.evaluate(() => {
        const range = document.createRange();
        const figure = document.querySelector('.dk-numeral');
        if (!figure?.firstChild) return { top: 0, bottom: 0 };
        range.selectNodeContents(figure.firstChild);
        const { top, bottom } = range.getBoundingClientRect();
        return { top, bottom };
    });
    expect(glyphs.top).toBeGreaterThanOrEqual(numeral.y - 1);
    expect(glyphs.bottom).toBeLessThanOrEqual(numeral.y + numeral.height + 1);
});

test('reads the numeral with its unit', async ({ page }) => {
    await draw(page, EXAMPLE);
    await expect(page.locator('.dk-numeral')).toHaveText('212 points');
});

for (const score of ['-1234', '12345'])
    test(`keeps a score of ${score} on one line on a 320px phone at twice the text size`, async ({
        page,
        browserName,
    }) => {
        await draw(page, EXAMPLE.replace('212<', `${score}<`), { width: 320 });
        await doubled(page, browserName);
        expect(await figureLines(page)).toBe(1);
        expect(await sideways(page)).toBe(0);
    });

test('breaks a long word at the end of the row too', async ({ page, browserName }) => {
    await draw(
        page,
        '<div class="dk-split"><h2>Ana</h2><button type="button" class="dk-button">Reshuffleeverythingnow</button></div>',
        { width: 320 }
    );
    await doubled(page, browserName);
    expect(await sideways(page)).toBe(0);
});

test('holds a split row to the measure on a wide page', async ({ page }) => {
    await draw(page, EXAMPLE);
    const row = await box(page.locator('.dk-split'));
    expect(Math.round(row.width)).toBe(await lengthOf(page, 'var(--dk-measure)'));
});

const GROUP =
    '<div class="dk-sections" id="group">' +
    ['One', 'Two', 'Three', 'Four']
        .map((name) => `<section><h2>${name}</h2><p>Short.</p></section>`)
        .join('') +
    '</div>';

test('sets a group of sections at --dk-sections-least, 20rem until a page sets it', async ({
    page,
}) => {
    const columns = () =>
        page.evaluate(
            () =>
                getComputedStyle(document.querySelector('#group') as Element)
                    .gridTemplateColumns.split(' ')
                    .filter((track) => track !== '0px').length
        );
    await draw(page, GROUP, { width: 1000 });
    const usual = await columns();
    await draw(page, GROUP, { width: 1000, css: '#group { --dk-sections-least: 10rem; }' });
    expect(await columns()).toBeGreaterThan(usual);
    await draw(page, GROUP, { width: 320, css: '#group { --dk-sections-least: 30rem; }' });
    expect(await columns()).toBe(1);
    expect(await sideways(page)).toBe(0);
});

for (const colors of ['light', 'dark', 'forced'] as const) {
    test(`has no audit findings in ${colors === 'forced' ? 'forced colors' : `the ${colors} theme`}`, async ({
        page,
    }) => {
        if (colors === 'forced') await forceColors(page);
        await draw(page, EXAMPLE, { theme: colors === 'dark' ? 'dark' : 'light' });
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations.map(({ id }) => id)).toEqual([]);
    });
}
