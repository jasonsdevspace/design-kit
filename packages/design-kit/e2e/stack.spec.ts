import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { stacks } from '../examples/examples.js';
import { box, forceColors, lengthOf, sideways, style, writePage } from './page.js';
import { cutOff, SPACED } from './spacing.js';
import { textSize } from './text-size.js';

/*
 * A stack's steps, as the reference draws them on a content page: a heading a heading's step over
 * the list it heads, the list's items at that step, each name a pair's step over its points, a
 * plain stack at the step of what holds it, a stack inside a pair taking the pair's step, no step
 * for a piece hidden or visually hidden, a stack on a list with no marker, indent or room of its
 * own and its role kept, and the example whole on a 320px phone at twice the text size and under
 * wider spacing, with no audit findings in either theme or in forced colors.
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

test("spaces a heading's stack, its list and each pair at their steps", async ({ page }) => {
    await draw(page, EXAMPLE);
    const heading = await lengthOf(page, 'var(--dk-space-3)');
    const pair = await lengthOf(page, 'var(--dk-space-2)');
    expect(await between(page.locator('#round'), page.locator('ul'))).toBe(heading);
    const items = page.locator('li');
    expect(await between(items.nth(0), items.nth(1))).toBe(heading);
    for (const at of [0, 1]) {
        const lines = items.nth(at).locator('p');
        expect(await between(lines.nth(0), lines.nth(1))).toBe(pair);
    }
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

test('draws a stack on a list with no marker, indent or room of its own, and keeps its role', async ({
    page,
}) => {
    await writePage(page, {
        title: 'Stacks',
        body: '<ol class="dk-stack" role="list" id="alone"><li>Ann</li><li>Ben</li></ol>',
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
    await expect(page.getByRole('list')).toHaveCount(1);
    await expect(page.getByRole('listitem')).toHaveCount(2);
});

test('stays whole on a 320px phone at twice the text size', async ({ page }) => {
    await draw(page, EXAMPLE, { width: 320 });
    await textSize(page, 2);
    expect(await sideways(page)).toBe(0);
    expect(await cutOff(page, 'section, ul, li, p, h2')).toEqual([]);
});

test('keeps its steps between the pieces under wider text spacing', async ({ page }) => {
    await draw(page, EXAMPLE, { css: SPACED, width: 320 });
    expect(await sideways(page)).toBe(0);
    expect(await cutOff(page, 'section, ul, li, p, h2')).toEqual([]);
    const lines = page.locator('li').first().locator('p');
    // The reader's own room under a paragraph is added to the step, never taken away.
    expect(await between(lines.nth(0), lines.nth(1))).toBeGreaterThanOrEqual(
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
