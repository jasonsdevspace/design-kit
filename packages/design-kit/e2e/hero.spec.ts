import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { bands } from '../examples/examples.js';
import { box, forceColors, lengthOf, sideways, style, writePage } from './page.js';
import { brokenWords, cutOff, SPACED } from './spacing.js';
import { doubled } from './text-size.js';

/*
 * A hero, a band's words beside its picture: the words first and the picture after, one over the
 * other a step apart on a phone, side by side and centered on each other from 48rem, the picture at
 * --dk-band-hero-picture and never past 45% of the row, a display heading at 48rem broken between
 * words only, a picture filling its cell in its own proportions, the same spacing written on a band
 * or a content page as inside one, nothing pushed sideways on a 320px phone at twice the text size
 * or under wider spacing, and no audit findings in either theme or in forced colors.
 */

/** A picture made at 800 by 600, drawn in a flat color. */
const PICTURE =
    'data:image/svg+xml,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#888"/></svg>'
    );

const hero = (words = 'Keep score for any card game on one phone.') =>
    '<main><section class="dk-band" aria-labelledby="title"><div class="dk-band-hero">' +
    '<div class="dk-stack" id="words"><p class="dk-eyebrow">For game night</p>' +
    `<h1 id="title">Scorekeeper</h1><p class="dk-lead">${words}</p></div>` +
    `<img id="picture" src="${PICTURE}" width="800" height="600" alt="Cards laid out on a table" />` +
    '</div></section></main>';

const draw = async (
    page: Page,
    width: number,
    {
        body = hero(),
        theme = 'light',
        css = '',
    }: { readonly body?: string; readonly theme?: 'light' | 'dark'; readonly css?: string } = {}
) => {
    await writePage(page, { title: 'Hero', body, theme, css, width });
    await page.waitForFunction(() => [...document.images].every((image) => image.complete));
};

test('sets the words beside the picture from 48rem, centered, the picture at 28rem', async ({
    page,
}) => {
    await draw(page, 1280);
    const row = await box(page.locator('.dk-band-hero'));
    const words = await box(page.locator('#words'));
    const picture = await box(page.locator('#picture'));
    expect(words.x).toBeCloseTo(row.x, 0);
    expect(picture.x + picture.width).toBeCloseTo(row.x + row.width, 0);
    expect(Math.round(picture.width)).toBe(await lengthOf(page, '28rem'));
    expect(Math.round(picture.x - (words.x + words.width))).toBe(
        await lengthOf(page, 'var(--dk-space-6)')
    );
    expect(
        Math.abs(words.y + words.height / 2 - (picture.y + picture.height / 2))
    ).toBeLessThanOrEqual(1);
});

test('holds the picture to 45% of the row, and breaks a display heading between words only, at 48rem', async ({
    page,
}) => {
    await draw(page, 768);
    const row = await box(page.locator('.dk-band-hero'));
    const words = await box(page.locator('#words'));
    const picture = await box(page.locator('#picture'));
    expect(picture.y).toBeLessThan(words.y + words.height);
    expect(picture.width).toBeLessThanOrEqual(row.width * 0.45 + 1);
    expect(await brokenWords(page, '#words > *')).toEqual([]);
    expect(await sideways(page)).toBe(0);
});

test('sets the picture at the width a page names, held to 45% of the row', async ({ page }) => {
    await draw(page, 1280, { css: '.dk-band-hero { --dk-band-hero-picture: 20rem; }' });
    expect(Math.round((await box(page.locator('#picture'))).width)).toBe(
        await lengthOf(page, '20rem')
    );
    await draw(page, 1280, { css: '.dk-band-hero { --dk-band-hero-picture: 60rem; }' });
    const row = await box(page.locator('.dk-band-hero'));
    expect(Math.round((await box(page.locator('#picture'))).width)).toBe(
        Math.round(row.width * 0.45)
    );
});

test('stands the words over the picture a step apart on a phone, in their own proportions', async ({
    page,
}) => {
    await draw(page, 400);
    const words = await box(page.locator('#words'));
    const picture = await box(page.locator('#picture'));
    expect(Math.round(picture.y - (words.y + words.height))).toBe(
        await lengthOf(page, 'var(--dk-space-6)')
    );
    expect(picture.x).toBe(words.x);
    expect(picture.height / picture.width).toBeCloseTo(600 / 800, 2);
});

for (const holder of ['dk-band', 'dk-page'] as const) {
    test(`keeps its own spacing written on a ${holder === 'dk-band' ? 'band' : 'content page'}`, async ({
        page,
    }) => {
        const on = hero()
            .replace(
                '<section class="dk-band" aria-labelledby="title"><div class="dk-band-hero">',
                `<section class="${holder} dk-band-hero" aria-labelledby="title">`
            )
            .replace('</div></section></main>', '</section></main>');
        // Fails loudly if the fixture changes and the hero is no longer written on its holder.
        expect(on).toContain(`class="${holder} dk-band-hero"`);
        for (const width of [400, 1280]) {
            await draw(page, width, { body: on });
            expect(await style(page.locator('#picture'), 'margin-block-start')).toEqual({
                'margin-block-start': '0px',
            });
            if (holder === 'dk-band')
                expect(
                    Number.parseFloat(
                        (await style(page.locator('.dk-band-hero'), 'padding-top'))[
                            'padding-top'
                        ] ?? ''
                    )
                ).toBe(await lengthOf(page, 'var(--dk-space-7)'));
            const words = await box(page.locator('#words'));
            const picture = await box(page.locator('#picture'));
            if (width === 400)
                expect(Math.round(picture.y - (words.y + words.height))).toBe(
                    await lengthOf(page, 'var(--dk-space-6)')
                );
            else
                expect(
                    Math.abs(words.y + words.height / 2 - (picture.y + picture.height / 2))
                ).toBeLessThanOrEqual(1);
        }
    });
}

test('holds the picture to its named height on a wider phone, cropped', async ({ page }) => {
    await draw(page, 767);
    const picture = await box(page.locator('#picture'));
    expect(Math.round(picture.height)).toBe(await lengthOf(page, '28rem'));
    expect(picture.width).toBeGreaterThan(picture.height);
    await draw(page, 767, { css: '.dk-band-hero { --dk-band-hero-picture: 16rem; }' });
    expect(Math.round((await box(page.locator('#picture'))).height)).toBe(
        await lengthOf(page, '16rem')
    );
});

for (const [kind, markup] of [
    [
        'picture',
        `<picture id="cell"><source srcset="${PICTURE}" /><img id="inner" src="${PICTURE}" width="800" height="600" alt="" /></picture>`,
    ],
    [
        'figure',
        `<figure id="cell"><img id="inner" src="${PICTURE}" width="800" height="600" alt="" /><figcaption>The table after a round.</figcaption></figure>`,
    ],
] as const)
    test(`fits a picture in a ${kind} to its cell at every width`, async ({ page }) => {
        for (const width of [400, 1280]) {
            await draw(page, width, {
                body: hero()
                    .replace(/<img id="picture"[^>]*>/, markup)
                    .replace('#picture', '#inner'),
            });
            const cell = await box(page.locator('#cell'));
            const inner = await box(page.locator('#inner'));
            expect(inner.width).toBeLessThanOrEqual(cell.width + 1);
            expect(inner.x).toBeGreaterThanOrEqual(cell.x - 1);
            expect(await sideways(page)).toBe(0);
        }
    });

test("lays out the reference's band example with nothing pushed sideways", async ({ page }) => {
    for (const width of [320, 1280]) {
        await writePage(page, { title: 'Bands', body: renderToStaticMarkup(bands), width });
        expect(await sideways(page)).toBe(0);
        const picture = await box(page.locator('.dk-band-hero > img'));
        expect(picture.height).toBeGreaterThan(0);
    }
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map(({ id }) => id)).toEqual([]);
});

test('fills its cell beside taller words by cropping the picture, never stretching it', async ({
    page,
}) => {
    await draw(page, 1280, {
        body: hero('Keep score for any card game on one phone. '.repeat(40)),
    });
    const words = await box(page.locator('#words'));
    const picture = await box(page.locator('#picture'));
    expect(Math.round(picture.height)).toBe(Math.round(words.height));
    expect((await style(page.locator('#picture'), 'object-fit'))['object-fit']).toBe('cover');
});

test('pushes nothing sideways on a 320px phone at twice the text size', async ({
    page,
    browserName,
}) => {
    await draw(page, 320);
    await doubled(page, browserName);
    expect(await sideways(page)).toBe(0);
    expect(await cutOff(page, '#words, #words > *')).toEqual([]);
});

test('pushes nothing sideways written on a content page at 320px and twice the text size', async ({
    page,
    browserName,
}) => {
    const on = hero()
        .replace(
            '<section class="dk-band" aria-labelledby="title"><div class="dk-band-hero">',
            '<section class="dk-page dk-band-hero" aria-labelledby="title">'
        )
        .replace('</div></section></main>', '</section></main>');
    expect(on).toContain('class="dk-page dk-band-hero"');
    await draw(page, 320, { body: on });
    await doubled(page, browserName);
    expect(await sideways(page)).toBe(0);
    expect(await cutOff(page, '#words, #words > *')).toEqual([]);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map(({ id }) => id)).toEqual([]);
});

test('pushes nothing sideways under wider text spacing at 48rem', async ({ page }) => {
    await draw(page, 768, { css: SPACED });
    expect(await sideways(page)).toBe(0);
    expect(await cutOff(page, '#words, #words > *')).toEqual([]);
});

for (const colors of ['light', 'dark', 'forced'] as const) {
    test(`has no audit findings in ${colors === 'forced' ? 'forced colors' : `the ${colors} theme`}`, async ({
        page,
    }) => {
        if (colors === 'forced') await forceColors(page);
        await draw(page, 1280, { theme: colors === 'dark' ? 'dark' : 'light' });
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations.map(({ id }) => id)).toEqual([]);
    });
}
