import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { stacks } from '../examples/examples.js';
import { box, forceColors, lengthOf, sideways, style, writePage } from './page.js';
import { cutOff, SPACED } from './spacing.js';
import { doubled } from './text-size.js';

/*
 * A stack's steps, as the reference draws them on a content page: a label a pair's step over its
 * value, a heading a heading's step over the list it heads and the list's items at that step, a
 * plain stack at the step of what holds it or a whole step where nothing does, a stack in a pair at
 * the pair's step, a named step kept under a title and a section's heading, a step class with no
 * stack doing nothing, no step for a piece hidden or visually hidden, a stack on a list with no
 * marker, indent or room of its own, the example's role kept and a list nested in an item keeping
 * its markers, and the example with a long name whole on a 320px phone at twice the text size and
 * under wider spacing, with no audit findings in either theme or in forced colors.
 */

const EXAMPLE = renderToStaticMarkup(stacks);

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
        title: 'Stacks',
        body: `<main class="dk-page"><h1>Scores</h1>${body}</main>`,
        theme,
        css,
        width,
    });

/** The space between the bottom of one piece and the top of the next, in whole pixels. */
const between = async (first: Locator, second: Locator) => {
    const above = await box(first);
    const below = await box(second);
    return Math.round(below.y - (above.y + above.height));
};

test("spaces a pair, a heading's stack and its list at their steps", async ({ page }) => {
    await draw(page, EXAMPLE);
    const heading = await lengthOf(page, 'var(--dk-space-3)');
    const pair = page.locator('.dk-stack-pair > p');
    expect(await between(pair.nth(0), pair.nth(1))).toBe(await lengthOf(page, 'var(--dk-space-2)'));
    expect(await between(page.locator('h2'), page.locator('ul'))).toBe(heading);
    const items = page.locator('li');
    expect(await between(items.nth(0), items.nth(1))).toBe(heading);
});

test('spaces a plain stack at the step of what holds it, and a stack in a pair at the pair step', async ({
    page,
}) => {
    await draw(
        page,
        '<div class="dk-stack" id="plain"><p id="a">One</p><p id="b">Two</p></div>' +
            '<div class="dk-stack dk-stack-pair"><p id="c">Name</p>' +
            '<div class="dk-stack" id="inner"><p id="d">Three</p><p id="e">Four</p></div></div>'
    );
    expect(await between(page.locator('#a'), page.locator('#b'))).toBe(
        await lengthOf(page, 'var(--dk-space-4)')
    );
    const pair = await lengthOf(page, 'var(--dk-space-2)');
    expect(await between(page.locator('#c'), page.locator('#inner'))).toBe(pair);
    expect(await between(page.locator('#d'), page.locator('#e'))).toBe(pair);
});

test('keeps a named step under a title and under a page section heading', async ({ page }) => {
    await draw(
        page,
        '<div class="dk-stack dk-stack-heading"><h1 id="title">Round 3</h1><p id="a">Ann</p></div>' +
            '<section class="dk-stack dk-stack-pair"><h2 id="name">Next to play</h2><p id="b">Ann</p></section>'
    );
    expect(await between(page.locator('#title'), page.locator('#a'))).toBe(
        await lengthOf(page, 'var(--dk-space-3)')
    );
    expect(await between(page.locator('#name'), page.locator('#b'))).toBe(
        await lengthOf(page, 'var(--dk-space-2)')
    );
});

test('gives a step class alone nothing, and a stack outside any container only its named step', async ({
    page,
}) => {
    await writePage(page, {
        title: 'Stacks',
        body:
            '<div class="dk-stack dk-stack-pair"><p id="a">Next to play</p><p id="b">Ann</p></div>' +
            '<main class="dk-page"><div class="dk-stack-pair"><div class="dk-stack">' +
            '<p id="c">One</p><p id="d">Two</p></div></div></main>',
    });
    expect(await between(page.locator('#a'), page.locator('#b'))).toBe(
        await lengthOf(page, 'var(--dk-space-2)')
    );
    expect(await between(page.locator('#c'), page.locator('#d'))).toBe(
        await lengthOf(page, 'var(--dk-space-4)')
    );
});

for (const step of ['', 'dk-stack-pair', 'dk-stack-heading'])
    test(`adds no step for a hidden piece in a ${step || 'plain'} stack`, async ({ page }) => {
        await draw(
            page,
            `<div class="dk-stack ${step}" id="shown"><p id="a">One</p><p id="b">Two</p></div>` +
                `<div class="dk-stack ${step}" id="hiding"><p hidden>Gone</p><p id="c">One</p>` +
                '<p class="dk-visually-hidden">Unseen</p><p hidden>Gone</p><p id="d">Two</p></div>'
        );
        expect(await between(page.locator('#c'), page.locator('#d'))).toBe(
            await between(page.locator('#a'), page.locator('#b'))
        );
        expect((await box(page.locator('#c'))).y).toBe((await box(page.locator('#hiding'))).y);
    });

test('draws a stack on a list with no marker, indent or room of its own', async ({ page }) => {
    await writePage(page, {
        title: 'Stacks',
        body:
            '<ol class="dk-stack" role="list" id="alone"><li>Ann</li>' +
            '<li>Ben<ul id="nested"><li>Ten points</li></ul></li></ol>',
    });
    const list = page.locator('#alone');
    expect(
        await style(list, 'list-style-type', 'padding-inline-start', 'margin-top', 'margin-bottom')
    ).toEqual({
        'list-style-type': 'none',
        'padding-inline-start': '0px',
        'margin-top': '0px',
        'margin-bottom': '0px',
    });
    expect((await box(list.locator('li').first())).x).toBe((await box(list)).x);
    // A list nested in an item keeps its own markers and indent.
    const nested = await style(page.locator('#nested'), 'list-style-type', 'padding-inline-start');
    expect(nested['list-style-type']).not.toBe('none');
    expect(nested['padding-inline-start']).not.toBe('0px');
});

test("writes the list's role in the example, which Safari drops with the markers", async ({
    page,
}) => {
    await draw(page, EXAMPLE);
    await expect(page.locator('ul.dk-stack')).toHaveAttribute('role', 'list');
});

/** The example with a name too long for a phone's line, so its pair wraps. */
const LONG = EXAMPLE.replace('<p>Ann</p>', '<p id="long">Bartholomew-Featherstonehaugh Smythe</p>');

test('stays whole on a 320px phone at twice the text size, a wrapped pair at its step', async ({
    page,
    browserName,
}) => {
    await draw(page, LONG, { width: 320 });
    await doubled(page, browserName);
    expect(await sideways(page)).toBe(0);
    expect(await cutOff(page, 'div, ul, li, p, h2')).toEqual([]);
    const pair = page.locator('.dk-stack-pair > p');
    expect(await between(pair.nth(0), pair.nth(1))).toBe(await lengthOf(page, 'var(--dk-space-2)'));
});

test('keeps its steps between the pieces under wider text spacing', async ({ page }) => {
    await draw(page, LONG, { css: SPACED, width: 320 });
    expect(await sideways(page)).toBe(0);
    expect(await cutOff(page, 'div, ul, li, p, h2')).toEqual([]);
    const pair = page.locator('.dk-stack-pair > p');
    // The reader's own room under a paragraph is added to the step, never taken away.
    expect(await between(pair.nth(0), pair.nth(1))).toBeGreaterThanOrEqual(
        await lengthOf(page, 'var(--dk-space-2)')
    );
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
