import { readFileSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

/*
 * The theme switch, the pill and the copy button's words as a browser draws them from the kit's
 * sheets, in markup written by hand: the chosen theme told apart by an edge rather than a fill
 * alone, a target the field's height and a thumb's on a phone, no word moving as the choice
 * moves, a chip that never reads as a control, the current page among pills marked by weight, a
 * copy button as wide as its longest word, and the focus ring and a button's hover edge in the
 * focus color a page sets, with no audit findings in either theme.
 */

const sheet = (name: string) => readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8');
const KIT = ['tokens.css', 'base.css', 'components.css'].map(sheet).join('\n');

const SWITCH = `<div class="dk-theme-switch" role="radiogroup" aria-labelledby="theme-name" aria-describedby="theme-note">
    <span class="dk-theme-switch-name" id="theme-name">Theme</span>
    <label class="dk-theme-switch-choice"><input type="radio" name="dk-theme" value="system"><span>System</span></label>
    <label class="dk-theme-switch-choice"><input type="radio" name="dk-theme" value="light" checked><span>Light</span></label>
    <label class="dk-theme-switch-choice"><input type="radio" name="dk-theme" value="dark"><span>Dark</span></label>
    <span class="dk-visually-hidden" id="theme-note">Your choice is saved for every page on jasonsdevspace.com.</span>
</div>`;

const PILLS = `<ul class="dk-pills" role="list"><li class="dk-pill">TypeScript</li><li class="dk-pill">React</li></ul>
<nav aria-label="Pages"><ul class="dk-pills" role="list">
    <li><a class="dk-pill" href="#home" aria-current="page">Home</a></li>
    <li><a class="dk-pill" href="#tokens">Tokens</a></li>
</ul></nav>`;

const COPY = `<button type="button" class="dk-button dk-copy">
    <span class="dk-copy-words"><span>Copy</span><span aria-hidden="true">Copied</span><span aria-hidden="true">Selected</span></span>
    <span class="dk-visually-hidden"> install command</span>
</button>
<p class="dk-visually-hidden" role="status"></p>`;

const open = async (
    page: Page,
    {
        width = 1280,
        theme = 'light',
        css = '',
    }: { width?: number; theme?: string; css?: string } = {}
) => {
    await page.setViewportSize({ width, height: 900 });
    await page.setContent(
        `<!doctype html><html lang="en" data-theme="${theme}"><head><title>Pieces</title>` +
            `<style>${KIT}${css}</style></head><body><main><h1>Pieces</h1>${SWITCH}${PILLS}${COPY}` +
            `<button type="button" class="dk-button">Filters</button></main></body></html>`
    );
};

const word = (page: Page, name: string) =>
    page.locator('.dk-theme-switch-choice', { hasText: name }).locator('span');

test('marks the chosen theme by an edge in the accent, not by its ground alone', async ({
    page,
}) => {
    await open(page);
    const chosen = await word(page, 'Light').evaluate((element) => {
        const style = getComputedStyle(element);
        return { edge: style.borderTopColor, shadow: style.boxShadow };
    });
    expect(chosen.edge).toBe('rgb(31, 79, 216)');
    expect(chosen.shadow).toContain('inset');
    const resting = await word(page, 'Dark').evaluate(
        (element) => getComputedStyle(element).borderTopColor
    );
    expect(resting).toBe('rgba(0, 0, 0, 0)');
});

test('keeps every word in place as the choice moves', async ({ page }) => {
    await open(page);
    const places = () =>
        Promise.all(
            ['System', 'Light', 'Dark'].map(
                async (name) => (await word(page, name).boundingBox())?.x
            )
        );
    const before = await places();
    await page.getByRole('radio', { name: 'Dark' }).check();
    expect(await places()).toEqual(before);
});

test('makes each choice the field height tall, and a thumb wide and tall on a phone', async ({
    page,
}) => {
    for (const [width, size] of [
        [1280, 36],
        [375, 44],
    ] as const) {
        await open(page, { width });
        const box = await page.locator('.dk-theme-switch-choice').first().boundingBox();
        expect(Math.round(box?.height ?? 0)).toBe(size);
        if (width === 375) expect(Math.round(box?.width ?? 0)).toBeGreaterThanOrEqual(size);
    }
});

/** Where each of the switch's choices sits against the switch's own box, and how far it scrolls. */
const switchFit = (page: Page) =>
    page.locator('.dk-theme-switch').evaluate((group) => {
        const room = group.getBoundingClientRect();
        const choices = [...group.querySelectorAll('.dk-theme-switch-choice')].map((choice) => {
            const box = choice.getBoundingClientRect();
            return {
                inside: box.left >= room.left - 0.5 && box.right <= room.right + 0.5,
                top: Math.round(box.top),
            };
        });
        return { choices, scrolls: group.scrollWidth > group.clientWidth };
    });

test('wraps its choices in a narrow column at a large text size, rather than scroll them away', async ({
    page,
}) => {
    // A 320px screen with a 20px gutter, and the browser's text at twice the usual size.
    await open(page, { width: 320, css: 'html { font-size: 200%; } main { width: 280px; }' });
    const { choices, scrolls } = await switchFit(page);
    expect(scrolls).toBe(false);
    expect(choices.map(({ inside }) => inside)).toEqual([true, true, true]);
});

test('keeps its choices on one row at the usual text size, at every width', async ({ page }) => {
    for (const width of [320, 375, 768, 1280]) {
        await open(page, { width, css: 'main { padding-inline: 20px; }' });
        const { choices, scrolls } = await switchFit(page);
        expect(scrolls, `${width}px`).toBe(false);
        expect(new Set(choices.map(({ top }) => top)).size, `${width}px`).toBe(1);
    }
});

test('draws a chip that never reads as a control, and marks the current page by weight', async ({
    page,
}) => {
    await open(page);
    const chip = page.locator('li.dk-pill').first();
    expect(Math.round((await chip.boundingBox())?.height ?? 0)).toBeLessThan(36);
    const weight = (name: string) =>
        page
            .getByRole('link', { name })
            .evaluate((element) => getComputedStyle(element).fontWeight);
    expect(await weight('Home')).toBe('600');
    expect(await weight('Tokens')).toBe('400');
    await open(page, { width: 375 });
    expect(
        Math.round((await page.getByRole('link', { name: 'Tokens' }).boundingBox())?.height ?? 0)
    ).toBe(44);
});

test('keeps the copy button as wide as its longest word, whichever word shows', async ({
    page,
}) => {
    await open(page);
    const button = page.locator('.dk-copy');
    await expect(button).toHaveAccessibleName('Copy install command');
    const width = async () => Math.round((await button.boundingBox())?.width ?? 0);
    const resting = await width();
    await button.evaluate((element) => {
        const [copy, copied] = element.querySelectorAll('.dk-copy-words > span');
        copy?.setAttribute('aria-hidden', 'true');
        copied?.removeAttribute('aria-hidden');
    });
    expect(await width()).toBe(resting);
    await expect(button).toHaveAccessibleName('Copied install command');
});

test("rings focus and edges a pointer's button in the focus color a page sets", async ({
    page,
}) => {
    await open(page, { css: ':root { --dk-focus: rgb(0, 128, 128); }' });
    await page.keyboard.press('Tab');
    const ring = await page.evaluate(() =>
        document.activeElement === null ? '' : getComputedStyle(document.activeElement).outlineColor
    );
    expect(ring).toBe('rgb(0, 128, 128)');
    await page.getByRole('button', { name: 'Filters' }).hover();
    await expect
        .poll(() =>
            page
                .getByRole('button', { name: 'Filters' })
                .evaluate((element) => getComputedStyle(element).borderTopColor)
        )
        .toBe('rgb(0, 128, 128)');
});

test("draws the switch's own ring, on the chosen word, in the focus color", async ({ page }) => {
    await open(page, { css: ':root { --dk-focus: rgb(0, 128, 128); }' });
    await page.keyboard.press('Tab');
    await expect(page.getByRole('radio', { name: 'Light' })).toBeFocused();
    const ring = await word(page, 'Light').evaluate((element) => {
        const style = getComputedStyle(element);
        return { color: style.outlineColor, style: style.outlineStyle };
    });
    expect(ring).toEqual({ color: 'rgb(0, 128, 128)', style: 'solid' });
});

test('rings in the accent a part of the page sets, where the page sets no focus color', async ({
    page,
}) => {
    await open(page, {
        css: 'main { --dk-accent: light-dark(rgb(0, 112, 64), rgb(0, 112, 64)); }',
    });
    await page.getByRole('button', { name: 'Filters' }).focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    expect(
        await page
            .getByRole('button', { name: 'Filters' })
            .evaluate((element) => getComputedStyle(element).outlineColor)
    ).toBe('rgb(0, 112, 64)');
});

for (const theme of ['light', 'dark']) {
    test(`has no audit findings in the ${theme} theme`, async ({ page }) => {
        await open(page, { theme });
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations.map(({ id }) => id)).toEqual([]);
    });
}
