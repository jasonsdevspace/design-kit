import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { icon } from '../examples/examples.js';
import { channels, colorOf, forceColors, pixels, writePage } from './page.js';
import { textSize } from './text-size.js';

/*
 * An icon as each engine draws it: one em square in a line of text, a doubled line, a link and a
 * small caption, stroked in its line's color with no fill and a stroke that does not scale with
 * the drawing, measured in pixels on a doubled line, at least one and a half pixels, a tab bar's
 * icon at the bar's own size and a lighter stroke, an icon-only button's icon larger than its
 * text, both doubling at twice the text size, the system's text and link colors in forced
 * colors, and a toggle whose face is an icon alone named by its words out of sight, with no audit
 * findings.
 */
/** An icon in a line of text, in a doubled line, in a link, in a small caption, and in a tab bar. */
const ICONS = (() => {
    const glyph = (id: string) =>
        `<svg class="dk-icon" id="${id}" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`;
    return (
        `<main><h1>Icons</h1><p>${glyph('in-text')} Add a player</p>` +
        `<p style="font-size: 2em">${glyph('doubled')} Add a player</p>` +
        `<p><a href="#players">${glyph('in-link')} Players</a></p>` +
        `<p style="font-size: 0.5rem">${glyph('small')} A caption</p>` +
        renderToStaticMarkup(icon) +
        `</main><nav class="dk-tabbar" aria-label="Places"><a href="#home" aria-current="page">${glyph('in-bar')}<span>Home ${glyph('in-label')}</span></a></nav>`
    );
})();

/** An icon's drawn height, its line's font size, and its stroke. */
const iconLook = (page: Page, id: string) => lookOf(page.locator(`#${id}`));

/** The same, for an icon found another way. */
const lookOf = (icon: Locator) =>
    icon.evaluate((icon) => {
        const style = getComputedStyle(icon);
        const line = getComputedStyle(icon.parentElement ?? icon);
        return {
            height: Math.round(icon.getBoundingClientRect().height),
            font: Math.round(parseFloat(line.fontSize)),
            stroke: style.stroke,
            color: line.color,
            width: style.strokeWidth,
            fill: style.fill,
            scaling: getComputedStyle(icon.firstElementChild ?? icon).vectorEffect,
        };
    });

/**
 * How wide the icon's upright stroke is drawn, in pixels, read from a screenshot of one row of
 * pixels across it, a quarter of the way down, clear of the crossing stroke. Each pixel counts by
 * how far it is from the ground toward the stroke's color, so a stroke whose edges are softened
 * still sums to its width, and the sum is taken back to CSS pixels from a screen that draws more.
 */
const strokeDrawn = async (page: Page, id: string): Promise<number> => {
    const icon = page.locator(`#${id}`);
    const drawn = await icon.boundingBox();
    if (!drawn) throw new Error(`expected ${id} to be drawn`);
    const shot = await page.screenshot({
        clip: {
            x: drawn.x,
            y: Math.round(drawn.y + drawn.height / 4),
            width: drawn.width,
            height: 1,
        },
    });
    const stroke = channels(
        await icon.evaluate((element) => getComputedStyle(element).stroke)
    ).slice(0, 3);
    return page.evaluate(
        async ([png, ink = [], across]) => {
            const image = new Image();
            image.src = `data:image/png;base64,${png}`;
            await image.decode();
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = 1;
            const context = canvas.getContext('2d');
            context?.drawImage(image, 0, 0);
            const row = context?.getImageData(0, 0, image.width, 1).data ?? new Uint8ClampedArray();
            // The ground is the row's first pixel, at the icon's edge, which the stroke never
            // reaches.
            const ground = [...row.slice(0, 3)];
            const channel = [0, 1, 2].reduce((best, at) =>
                Math.abs((ink[at] ?? 0) - (ground[at] ?? 0)) >
                Math.abs((ink[best] ?? 0) - (ground[best] ?? 0))
                    ? at
                    : best
            );
            const span = (ink[channel] ?? 0) - (ground[channel] ?? 0);
            let width = 0;
            for (let x = 0; x < image.width; x += 1)
                width += ((row[x * 4 + channel] ?? 0) - (ground[channel] ?? 0)) / span;
            return width / (image.width / across);
        },
        [shot.toString('base64'), stroke, drawn.width] as const
    );
};

for (const theme of ['light', 'dark'] as const)
    test(`sizes an icon to its line's text, strokes it in the text's color at a weight that holds, and names its control by its words, in the ${theme} theme`, async ({
        page,
    }) => {
        await writePage(page, { theme, title: 'Icons', body: ICONS });
        for (const id of ['in-text', 'doubled', 'in-link', 'small']) {
            const look = await iconLook(page, id);
            expect(look.height, `${theme}, ${id}`).toBe(look.font);
            expect(look.stroke, `${theme}, ${id}`).toBe(look.color);
            expect([look.fill, look.scaling], `${theme}, ${id}`).toEqual([
                'none',
                'non-scaling-stroke',
            ]);
        }
        expect((await iconLook(page, 'in-text')).width).toBe('2px');
        // The doubled icon is drawn at a third more than its own 24 units, so a stroke that scaled
        // with the drawing would be drawn a third wider than the width it is given.
        const doubled = pixels((await iconLook(page, 'doubled')).width);
        expect(doubled, theme).toBe(4);
        expect(await strokeDrawn(page, 'doubled'), `${theme}, the doubled stroke`).toBeCloseTo(
            doubled,
            0
        );
        expect((await iconLook(page, 'small')).width).toBe('1.5px');
        // A tab bar's icon and an icon-only button's are larger than their text, 1.5rem and
        // 1.25rem, and each is stroked at two in twenty four of its own size by one rule.
        const bar = await iconLook(page, 'in-bar');
        const alone = await lookOf(page.locator('button[aria-pressed] svg'));
        expect([bar.height, alone.height]).toEqual([24, 20]);
        // An icon in a tab's label is not the tab's icon, so it keeps its label's size.
        const inLabel = await iconLook(page, 'in-label');
        expect(inLabel.height).toBe(inLabel.font);
        for (const look of [bar, alone])
            expect(pixels(look.width), `${theme}, ${String(look.height)}`).toBeCloseTo(
                look.height / 12,
                1
            );
        // A mark drawn in fill takes no outline.
        const star = page.locator('button[aria-pressed] path');
        expect(await star.evaluate((path) => getComputedStyle(path).stroke), theme).toBe('none');
        // A control whose face is an icon alone is named by its words out of sight.
        await expect(page.locator('button[aria-pressed]')).toHaveAccessibleName('Favorite game');
        const results = await new AxeBuilder({ page }).analyze();
        expect(
            results.violations.map(({ id }) => id),
            theme
        ).toEqual([]);
    });

test("grows an icon-only button's icon with the text, to twice its size at twice the text size", async ({
    page,
}) => {
    await textSize(page, 2);
    await writePage(page, { title: 'Icons', body: ICONS });
    const bar = await iconLook(page, 'in-bar');
    const alone = await lookOf(page.locator('button[aria-pressed] svg'));
    expect([bar.height, alone.height]).toEqual([48, 40]);
    for (const look of [bar, alone]) expect(pixels(look.width)).toBeCloseTo(look.height / 12, 1);
});

test("redraws an icon in the system's text and link colors in forced colors", async ({
    page,
    browserName,
}) => {
    test.skip(browserName === 'webkit', 'WebKit has no forced colors to draw');
    await forceColors(page);
    await writePage(page, { title: 'Icons', body: ICONS });
    expect((await iconLook(page, 'in-text')).stroke).toBe(await colorOf(page, 'CanvasText'));
    expect((await iconLook(page, 'in-link')).stroke).toBe(await colorOf(page, 'LinkText'));
});
