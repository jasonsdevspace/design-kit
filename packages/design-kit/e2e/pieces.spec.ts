import { readFileSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';

/*
 * The theme switch, the pill, the tab and the copy button's words as a browser draws them from
 * the kit's sheets, in markup written by hand: the chosen theme told apart by an edge rather
 * than a fill alone, a target the field's height and a thumb's on a phone, no word moving as
 * the choice moves, a chip that never reads as a control, the current page among pills marked
 * by weight, a copy button as wide as its longest word, the chosen tab told by its text, its
 * weight and an accent line whether it is a tab, a page or a toggle, no word cut off under the
 * wider spacing a visitor may set, and the focus ring and a button's hover edge in the focus color
 * a page sets, with no audit findings in either theme.
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

const TABS = `<div class="dk-tabs" role="tablist" aria-label="Code">
    <button type="button" class="dk-tab" role="tab" id="markup-tab" aria-selected="true" aria-controls="markup" tabindex="0">Markup</button>
    <button type="button" class="dk-tab" role="tab" id="react-tab" aria-selected="false" aria-controls="react" tabindex="-1">React</button>
</div>
<div id="markup" role="tabpanel" aria-labelledby="markup-tab"><p>The markup.</p></div>
<div id="react" role="tabpanel" aria-labelledby="react-tab" hidden><p>The React.</p></div>
<nav aria-label="Categories"><ul class="dk-tabs" role="list">
    <li><a class="dk-tab" href="#all" aria-current="page">All</a></li>
    <li><a class="dk-tab" href="#books">Books</a></li>
</ul></nav>
<div class="dk-tabs">
    <button type="button" class="dk-tab" aria-pressed="true">Open</button>
    <button type="button" class="dk-tab" aria-pressed="false">Go</button>
</div>`;

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
            `<style>${KIT}${css}</style></head><body><main><h1>Pieces</h1>${SWITCH}${PILLS}${TABS}${COPY}` +
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

/**
 * Where the switch's name and each of its choices sit against the switch's own box, how many rows
 * they take, and whether the switch or the page scrolls sideways.
 */
const switchFit = (page: Page, within = '') =>
    page.locator(`${within} .dk-theme-switch`.trim()).evaluate((group) => {
        const room = group.getBoundingClientRect();
        const parts = [...group.querySelectorAll('.dk-theme-switch-name, .dk-theme-switch-choice')];
        const boxes = parts.map((part) => part.getBoundingClientRect());
        const page = document.documentElement;
        return {
            inside: boxes.map(
                (box) => box.left >= room.left - 0.5 && box.right <= room.right + 0.5
            ),
            // Counted by their middles, since the name is shorter than a choice and centered beside it.
            rows: new Set(boxes.map((box) => Math.round(box.top + box.height / 2))).size,
            scrolls: group.scrollWidth > group.clientWidth,
            pageScrolls: page.scrollWidth > page.clientWidth,
        };
    });

test('wraps its choices in a narrow column at a large text size, rather than scroll them away', async ({
    page,
}) => {
    // A 320px screen with a 20px gutter, and the browser's text at twice the usual size.
    await open(page, { width: 320, css: 'html { font-size: 200%; } main { width: 280px; }' });
    const fit = await switchFit(page);
    expect(fit.rows).toBeGreaterThan(1);
    expect(fit.inside).toEqual([true, true, true, true]);
    expect(fit.scrolls).toBe(false);
    expect(fit.pageScrolls).toBe(false);
});

test('keeps its name and choices on one row at the usual text size, phone to wide', async ({
    page,
}) => {
    for (const width of [320, 375, 400, 700, 768, 1280]) {
        await open(page, { width, css: 'main { padding-inline: 20px; }' });
        const fit = await switchFit(page);
        expect(fit.rows, `${String(width)}px`).toBe(1);
        expect(fit.scrolls, `${String(width)}px`).toBe(false);
        expect(fit.pageScrolls, `${String(width)}px`).toBe(false);
    }
});

test("keeps one row in a demo's strip, whose room holds one row before it comes", async ({
    page,
}) => {
    await open(page, { width: 320, css: 'html { font-size: 200%; } main { width: 280px; }' });
    // The switch moved into a strip's section for switches, as a demo's script puts it there.
    await page.locator('.dk-theme-switch').evaluate((group) => {
        const tools = document.createElement('section');
        tools.className = 'dk-strip-tools';
        group.replaceWith(tools);
        tools.append(group);
    });
    const fit = await switchFit(page, '.dk-strip-tools');
    expect(fit.rows).toBe(1);
    expect(fit.pageScrolls).toBe(false);
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

/** How a tab is drawn: its text, its weight, the line under it and its depth, its ground, and any underline. */
const tabLook = (tab: Locator) =>
    tab.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
            color: style.color,
            weight: style.fontWeight,
            line: style.borderBottomColor,
            lineWidth: style.borderBottomWidth,
            ground: style.backgroundColor,
            underline: style.textDecorationLine,
        };
    });

/** The page's text, muted text and accent as it resolves them, and the system's selection colors. */
const tabColors = (page: Page) =>
    page.evaluate(() => {
        const probe = document.createElement('span');
        document.body.append(probe);
        const read = (property: 'color' | 'backgroundColor', value: string) => {
            probe.style[property] = value;
            return getComputedStyle(probe)[property];
        };
        const colors = {
            text: read('color', 'var(--dk-fg)'),
            muted: read('color', 'var(--dk-muted)'),
            accent: read('color', 'var(--dk-accent)'),
            selection: read('backgroundColor', 'Highlight'),
            selectionText: read('color', 'HighlightText'),
        };
        probe.remove();
        return colors;
    });

test("marks the chosen tab by the page's text over an accent line, and by the system's selection in forced colors, with no line under the others", async ({
    page,
}) => {
    for (const theme of ['light', 'dark'] as const) {
        for (const forcedColors of ['none', 'active'] as const) {
            await page.emulateMedia({ forcedColors });
            await open(page, { theme });
            const at = `${theme} theme, forced colors ${forcedColors}`;
            const chosen = await tabLook(page.getByRole('tab', { name: 'Markup' }));
            const resting = await tabLook(page.getByRole('tab', { name: 'React' }));
            const colors = await tabColors(page);
            expect(chosen.weight, at).toBe(resting.weight);
            expect(chosen.lineWidth, at).toBe('2px');
            expect(resting.lineWidth, at).toBe('0px');
            if (forcedColors === 'none') {
                expect(chosen, at).toMatchObject({ color: colors.text, line: colors.accent });
                expect(resting.color, at).toBe(colors.muted);
                expect(chosen.ground, at).toBe('rgba(0, 0, 0, 0)');
            } else {
                expect(chosen, at).toMatchObject({
                    color: colors.selectionText,
                    ground: colors.selection,
                });
                expect(resting.ground, at).not.toBe(colors.selection);
            }
        }
    }
    await page.emulateMedia({ forcedColors: 'none' });
});

test('draws a tab, a link among pages and a toggle alike, chosen or not', async ({ page }) => {
    await open(page);
    const tab = page.getByRole('tab', { name: 'Markup' });
    const link = page.getByRole('link', { name: 'All' });
    const toggle = page.getByRole('button', { name: 'Open' });
    const chosen = await tabLook(tab);
    expect(chosen.underline).toBe('none');
    expect(await tabLook(link)).toEqual(chosen);
    expect(await tabLook(toggle)).toEqual(chosen);
    const resting = await tabLook(page.getByRole('tab', { name: 'React' }));
    expect(resting).not.toEqual(chosen);
    expect(await tabLook(page.getByRole('link', { name: 'Books' }))).toEqual(resting);
    expect(await tabLook(page.getByRole('button', { name: 'Go' }))).toEqual(resting);
});

test('keeps every tab in place as the choice moves', async ({ page }) => {
    await open(page);
    const tabs = page.getByRole('tab');
    const places = async () =>
        Promise.all((await tabs.all()).map(async (tab) => (await tab.boundingBox())?.x));
    const before = await places();
    await tabs.evaluateAll((elements) => {
        for (const tab of elements) {
            tab.setAttribute('aria-selected', String(tab.getAttribute('aria-selected') !== 'true'));
        }
    });
    expect(await places()).toEqual(before);
});

test("keeps the chosen link's line on the rule when a neighbor's words wrap", async ({ page }) => {
    // A row a page keeps to one line, so a long name wraps its words beside the others.
    await open(page, { width: 320, css: '.dk-tabs { flex-wrap: nowrap; }' });
    const books = page.getByRole('link', { name: 'Books' });
    await books.evaluate((link) => {
        link.textContent = 'Books, music and film for the whole family';
    });
    const tall = await books.boundingBox();
    const chosen = await page.getByRole('link', { name: 'All' }).boundingBox();
    expect(tall?.height ?? 0).toBeGreaterThan(44);
    expect(Math.round(chosen?.height ?? 0)).toBe(Math.round(tall?.height ?? 0));
});

test("makes each tab the strip's height, and a thumb wide and tall on a phone", async ({
    page,
}) => {
    for (const [width, size] of [
        [1280, 40],
        [375, 44],
    ] as const) {
        await open(page, { width });
        const box = await page.getByRole('button', { name: 'Go' }).boundingBox();
        expect(Math.round(box?.height ?? 0), `${String(width)}px`).toBe(size);
        if (width === 375) expect(Math.round(box?.width ?? 0)).toBeGreaterThanOrEqual(size);
    }
});

test('cuts no word off the pill, the copy button or the switch under the wider spacing a visitor may set', async ({
    page,
}) => {
    // A 320px screen with a 20px gutter, and the spacing WCAG asks a page to survive, as a
    // visitor's own style sheet sets it.
    await open(page, {
        width: 320,
        css:
            'main { padding-inline: 20px; } * { line-height: 1.5 !important;' +
            ' letter-spacing: 0.12em !important; word-spacing: 0.16em !important }',
    });
    const cutOff = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('.dk-pill, .dk-copy, .dk-theme-switch')]
            .filter(
                (element) =>
                    element.scrollWidth > element.clientWidth + 1 ||
                    element.scrollHeight > element.clientHeight + 1
            )
            .map((element) => element.className)
    );
    expect(cutOff).toEqual([]);
    const fit = await switchFit(page);
    expect(fit.inside).toEqual([true, true, true, true]);
    expect(fit.pageScrolls).toBe(false);
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
