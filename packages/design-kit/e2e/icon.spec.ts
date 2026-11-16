import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { icon } from '../examples/examples.js';
import { colorOf, writePage } from './page.js';

/*
 * An icon as each engine draws it: one em square in a line of text, a doubled line, a link and a
 * small caption, stroked in its line's color with no fill and a stroke that does not scale with
 * the drawing, at least one and a half pixels, a tab bar's icon at the bar's own size, the
 * system's text and link colors in forced colors, and a toggle whose face is an icon alone named
 * by its words out of sight, with no audit findings.
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
        `</main><nav class="dk-tabbar" aria-label="Places"><a href="#home" aria-current="page">${glyph('in-bar')}<span>Home</span></a></nav>`
    );
})();

/** An icon's drawn height, its line's font size, and its stroke. */
const iconLook = (page: Page, id: string) =>
    page.locator(`#${id}`).evaluate((icon) => {
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

test("sizes an icon to its line's text, strokes it in the text's color at a weight that holds, and names its control by its words", async ({
    page,
}) => {
    for (const theme of ['light', 'dark'] as const) {
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
        expect((await iconLook(page, 'small')).width).toBe('1.5px');
        // A tab bar keeps its own larger icon, at the stroke an icon of that size takes.
        expect(await iconLook(page, 'in-bar')).toMatchObject({ height: 24, width: '3px' });
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
    }
});

test("redraws an icon in the system's text and link colors in forced colors", async ({
    page,
    browserName,
}) => {
    test.skip(browserName === 'webkit', 'WebKit has no forced colors to draw');
    await writePage(page, { title: 'Icons', body: ICONS });
    await page.emulateMedia({ forcedColors: 'active' });
    expect((await iconLook(page, 'in-text')).stroke).toBe(await colorOf(page, 'CanvasText'));
    expect((await iconLook(page, 'in-link')).stroke).toBe(await colorOf(page, 'LinkText'));
});
