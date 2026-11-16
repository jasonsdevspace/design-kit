import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { copyButton, eyebrow, pills, tabs, themeSwitch } from '../examples/examples.js';
import {
    backplateUnderWords,
    colorOf,
    forceColors,
    pixels,
    ringByKeyboard,
    style,
    writePage,
} from './page.js';
import { cutOff, SPACED } from './spacing.js';
import { textSize } from './text-size.js';

/*
 * The theme switch, the pill, the tab, the eyebrow and the copy button's words as a browser draws
 * them from the kit's sheets, from the examples the reference prints: the chosen theme told apart by an edge rather
 * than a fill alone, a target the field's height and a thumb's on a phone, no word moving as
 * the choice moves, the switch collapsed to its name and one button in a demo's strip on a screen
 * narrower than 20rem and the row of choices everywhere else, a chip that never reads as a
 * control, the current page among pills marked by weight, a copy button as wide as its longest
 * word, the chosen tab told by its text, its weight and an accent line whether it is a tab, a page
 * or a toggle, an eyebrow in caps at the caption size, no word cut off under the wider spacing a
 * visitor may set, and the focus ring and a button's hover edge in the focus color a page sets,
 * with no audit findings in either theme.
 */

/**
 * Each piece as the reference prints it, shown as a page's script shows the switch and the copy
 * button.
 */
const drawn = (example: ReactElement) => renderToStaticMarkup(example);
/** A control shown, as a page's script shows it once attached. */
const shown = (markup: string) => {
    if (!markup.includes(' hidden=""')) throw new Error('the control is not hidden to show');
    return markup.replaceAll(' hidden=""', '');
};
/** The switch with Light chosen as the page is parsed, so no transition is under way when read. */
const withLight = (markup: string) => {
    const checked = markup.replace('value="light"/>', 'value="light" checked=""/>');
    if (checked === markup) throw new Error('the switch draws no Light radio to check');
    return checked;
};
// The switch first, so one Tab reaches it.
const PIECES = [
    withLight(shown(drawn(themeSwitch))),
    drawn(pills),
    drawn(tabs),
    drawn(eyebrow),
    shown(drawn(copyButton)),
].join('');

const open = async (
    page: Page,
    {
        width = 1280,
        theme = 'light',
        css = '',
    }: { width?: number; theme?: 'light' | 'dark'; css?: string } = {}
) => {
    await writePage(page, {
        width,
        theme,
        css,
        title: 'Pieces',
        body: `<main><h1>Pieces</h1>${PIECES}<button type="button" class="dk-button">Filters</button></main>`,
    });
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

/** The switch moved into a strip's section for switches, as a demo's script puts it there. */
const inStrip = (page: Page) =>
    page.locator('.dk-theme-switch').evaluate((group) => {
        const tools = document.createElement('section');
        tools.className = 'dk-strip-tools';
        group.replaceWith(tools);
        tools.append(group);
    });

test("collapses to its name and one button naming the choice in a demo's strip narrower than 20rem", async ({
    page,
}) => {
    // A 320px screen with the browser's text at twice the usual size is 10rem wide.
    await textSize(page, 2);
    await open(page, { width: 320, css: 'main { width: 280px; }' });
    await inStrip(page);
    const button = page.getByRole('button', { name: 'Theme System' });
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    for (const name of ['System', 'Light', 'Dark']) {
        await expect(page.getByRole('radio', { name })).toBeHidden();
    }
    // The name and the button on one row, inside the strip's section, and drawn as the chosen
    // word is, with the same edge.
    const fit = await page.locator('.dk-strip-tools').evaluate((tools) => {
        const room = tools.getBoundingClientRect();
        const parts = [...tools.querySelectorAll('.dk-theme-switch-name, .dk-theme-switch-button')];
        const boxes = parts.map((part) => part.getBoundingClientRect());
        return {
            inside: boxes.map(
                (box) => box.left >= room.left - 0.5 && box.right <= room.right + 0.5
            ),
            rows: new Set(boxes.map((box) => Math.round(box.top + box.height / 2))).size,
            pageScrolls:
                document.documentElement.scrollWidth > document.documentElement.clientWidth,
        };
    });
    expect(fit).toEqual({ inside: [true, true], rows: 1, pageScrolls: false });
    const look = await button.evaluate((element: HTMLElement) => {
        const style = getComputedStyle(element);
        return {
            edge: style.borderTopColor,
            shadow: style.boxShadow,
            height: element.offsetHeight,
        };
    });
    expect(look.edge).toBe('rgb(31, 79, 216)');
    expect(look.shadow).toContain('inset');
    // One control tall, so the room the strip keeps holds it.
    expect(look.height).toBeGreaterThanOrEqual(44);
});

test("keeps the row of three choices in a demo's strip at 20rem and wider, and outside the strip at any width", async ({
    page,
    browserName,
}) => {
    // 320px at the usual text size is 20rem, where every phone sits, and a wide screen at twice
    // the text is 40rem, which only Chromium sets from a test.
    for (const [width, scale] of [
        [320, 1],
        ...(browserName === 'chromium' ? ([[1280, 2]] as const) : []),
    ] as const) {
        await textSize(page, scale);
        await open(page, { width, css: 'main { padding-inline: 20px; }' });
        await inStrip(page);
        await expect(page.getByRole('button', { name: 'Theme System' })).toBeHidden();
        const fit = await switchFit(page, '.dk-strip-tools');
        expect(fit.rows, `${String(width)}px at text ${String(scale)}`).toBe(1);
        expect(fit.pageScrolls).toBe(false);
    }
    // Outside the strip the switch wraps instead, and draws no button, however narrow its column.
    // A column narrower than the three choices in any engine's own font.
    await open(page, { width: 320, css: 'main { width: 200px; }' });
    await expect(page.getByRole('button', { name: 'Theme System' })).toBeHidden();
    expect((await switchFit(page)).rows).toBeGreaterThan(1);
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
const tabColors = async (page: Page) => ({
    text: await colorOf(page, 'var(--dk-fg)'),
    muted: await colorOf(page, 'var(--dk-muted)'),
    accent: await colorOf(page, 'var(--dk-accent)'),
    selection: await colorOf(page, 'Highlight'),
    selectionText: await colorOf(page, 'HighlightText'),
});

test("marks the chosen tab by the page's text over an accent line, and by the system's selection in forced colors, the others on the rule's line", async ({
    page,
}) => {
    for (const theme of ['light', 'dark'] as const) {
        for (const forcedColors of ['none', 'active'] as const) {
            await forceColors(page, forcedColors === 'active');
            await open(page, { theme });
            const at = `${theme} theme, forced colors ${forcedColors}`;
            const chosen = await tabLook(page.getByRole('tab', { name: 'Markup' }));
            const resting = await tabLook(page.getByRole('tab', { name: 'React' }));
            const colors = await tabColors(page);
            expect(chosen.weight, at).toBe(resting.weight);
            expect(chosen.lineWidth, at).toBe('2px');
            expect(resting.lineWidth, at).toBe('1px');
            if (forcedColors === 'none') {
                expect(chosen, at).toMatchObject({ color: colors.text, line: colors.accent });
                expect(resting, at).toMatchObject({
                    color: colors.muted,
                    line: await colorOf(page, 'var(--dk-line)'),
                });
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

/** A masthead of the page's own with a rule at its foot, a tab row on it, and a plain row after. */
const ON_RULE = `<main><header class="masthead"><h1>Shelf</h1><ul class="dk-tabs dk-tabs-on-rule" role="list" aria-label="Categories"><li><a class="dk-tab" href="#all" aria-current="page">All</a></li><li><a class="dk-tab" href="#books">Books</a></li></ul></header><div class="dk-tabs" id="plain"><button type="button" class="dk-tab" aria-pressed="true">Open</button></div></main>`;

/** The masthead's rule, and a bar that centers a row beside a taller button, as a code bar does. */
const MASTHEAD = {
    block: '.masthead { border-bottom: 1px solid var(--dk-line); }',
    bar: '.masthead { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--dk-line); } .masthead h1 { min-height: 4rem; margin: 0; }',
};

/** Where the row, the chosen tab and the resting tab end against the masthead's foot. */
const onRule = (page: Page) =>
    page.evaluate(() => {
        const foot = (selector: string) =>
            document.querySelector(selector)?.getBoundingClientRect().bottom ?? 0;
        const edge = (selector: string) =>
            getComputedStyle(document.querySelector(selector) ?? document.body).borderBottomWidth;
        const masthead = foot('.masthead');
        return {
            row: edge('.dk-tabs-on-rule'),
            chosen: foot('[aria-current]') - masthead,
            chosenLine: edge('[aria-current]'),
            resting: foot('[href="#books"]') - masthead,
            restingLine: edge('[href="#books"]'),
            plain: edge('#plain'),
        };
    });

/** Draws one case of a row on a masthead's rule, and checks it ends on the one rule. */
const holdsOnRule = async (
    page: Page,
    {
        theme,
        shape,
        forced,
    }: { theme: 'light' | 'dark'; shape: keyof typeof MASTHEAD; forced: boolean }
) => {
    await forceColors(page, forced);
    await writePage(page, { theme, title: 'Tabs on a rule', css: MASTHEAD[shape], body: ON_RULE });
    const what = `${theme}, ${shape}${forced ? ', forced colors' : ''}`;
    // One rule, the masthead's: the chosen line ends on its foot, a resting tab's edge lies on it.
    expect(await onRule(page), what).toEqual({
        row: '0px',
        chosen: 0,
        chosenLine: '2px',
        resting: 0,
        restingLine: '1px',
        plain: '1px',
    });
    // The chosen tab's mark is the accent line, and the system's selection in forced colors,
    // reaching the rule either way.
    const chosen = await tabLook(page.getByRole('link', { name: 'All' }));
    const colors = await tabColors(page);
    expect(forced ? chosen.ground : chosen.line, what).toBe(
        forced ? colors.selection : colors.accent
    );
};

/** A shot of the one pixel at a point, to hold against another. */
const pixelAt = (page: Page, x: number, y: number) =>
    page.screenshot({ clip: { x, y, width: 1, height: 1 } });

test('stands every tab on a line when the row wraps, in both themes and forced colors', async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    for (const forced of [false, true])
        for (const theme of ['light', 'dark'] as const) {
            await forceColors(page, forced);
            await writePage(page, {
                theme,
                title: 'Code',
                css: '.bar { width: 190px; }',
                body: `<main><div class="bar"><div class="dk-tabs" role="tablist" aria-label="The code"><button type="button" class="dk-tab" role="tab" aria-selected="true">Markup</button><button type="button" class="dk-tab" role="tab" aria-selected="false">React</button><button type="button" class="dk-tab" role="tab" aria-selected="false">Vue</button></div></div></main>`,
            });
            await textSize(page, 2);
            const what = `${theme}${forced ? ', forced colors' : ''}`;
            const tabs = await page.getByRole('tab').all();
            const boxes = await Promise.all(tabs.map(async (tab) => (await tab.boundingBox())!));
            // The row wraps, so some tab stands on a line above another.
            expect(new Set(boxes.map(({ y }) => Math.round(y))).size, what).toBeGreaterThan(1);
            // The page's own ground, read to the side of the bar, clear of every tab.
            const ground = await pixelAt(page, 250, Math.round(boxes[0]?.y ?? 0) + 2);
            for (const [at, { x, y, width, height }] of boxes.entries()) {
                // The pixel row at the tab's foot, in its middle, is a line rather than the ground.
                const foot = await pixelAt(
                    page,
                    Math.round(x + width / 2),
                    Math.floor(y + height - 1)
                );
                expect(foot.equals(ground), `${what}, tab ${String(at)}`).toBe(false);
            }
        }
});

test("lays a tab row on its container's rule, the chosen line over it, and a plain row as it was", async ({
    page,
}) => {
    for (const forced of [false, true])
        for (const theme of ['light', 'dark'] as const)
            for (const shape of ['block', 'bar'] as const)
                await holdsOnRule(page, { theme, shape, forced });
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
    // A 320px screen with a 20px gutter.
    await open(page, { width: 320, css: `main { padding-inline: 20px; } ${SPACED}` });
    expect(
        await cutOff(page, '.dk-pill, .dk-copy, .dk-theme-switch, .dk-tab, .dk-eyebrow')
    ).toEqual([]);
    const fit = await switchFit(page);
    expect(fit.inside).toEqual([true, true, true, true]);
    expect(fit.pageScrolls).toBe(false);
});

test('draws an eyebrow in caps at the caption size in the muted text, tracked, with no margin of its own', async ({
    page,
}) => {
    await open(page);
    const eyebrow = page.locator('.dk-eyebrow');
    const drawn = await eyebrow.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
            transform: style.textTransform,
            size: style.fontSize,
            color: style.color,
            tracking: style.letterSpacing,
            margin: style.marginBlock,
        };
    });
    expect({ transform: drawn.transform, color: drawn.color, margin: drawn.margin }).toEqual({
        transform: 'uppercase',
        color: 'rgb(92, 92, 92)',
        margin: '0px',
    });
    // Within a twentieth of a pixel, as an engine rounds a length.
    expect(pixels(drawn.size)).toBeCloseTo(13.6, 1);
    expect(pixels(drawn.tracking)).toBeCloseTo(0.816, 1);
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
    browserName,
}) => {
    await open(page, {
        css: 'main { --dk-accent: light-dark(rgb(0, 112, 64), rgb(0, 112, 64)); }',
    });
    await ringByKeyboard(page.getByRole('button', { name: 'Filters' }), browserName);
    expect(
        await page
            .getByRole('button', { name: 'Filters' })
            .evaluate((element) => getComputedStyle(element).outlineColor)
    ).toBe('rgb(0, 112, 64)');
});

for (const theme of ['light', 'dark'] as const) {
    test(`has no audit findings in the ${theme} theme`, async ({ page }) => {
        await open(page, { theme });
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations.map(({ id }) => id)).toEqual([]);
    });
}

/** Each kind of chosen thing the kit draws in the selection's colors, beside one at rest. */
const CHOSEN = `<main><h1>Chosen</h1>
<ul class="dk-pills" role="list"><li><a class="dk-pill" href="#home" aria-current="page" id="pill">Home</a></li><li><a class="dk-pill" href="#about">About</a></li></ul>
<div class="dk-tabs" role="tablist" aria-label="Code"><button type="button" class="dk-tab" role="tab" aria-selected="true" id="tab">Markup</button><button type="button" class="dk-tab" role="tab" aria-selected="false">React</button></div>
<ul class="dk-tabs" role="list"><li><a class="dk-tab" href="#all" aria-current="page" id="tab-link">All</a></li></ul>
<div class="dk-tabs"><button type="button" class="dk-tab" aria-pressed="true" id="tab-toggle">Open</button></div>
<p><button type="button" class="dk-button" aria-pressed="true" id="toggle">Members only</button> <button type="button" class="dk-button" aria-expanded="true" id="open">Filters</button></p>
<div class="dk-theme-switch" role="radiogroup" aria-label="Theme"><label class="dk-theme-switch-choice"><input type="radio" name="theme" checked><span id="theme">System</span></label><label class="dk-theme-switch-choice"><input type="radio" name="theme"><span>Light</span></label></div>
<div class="dk-button-grid"><button type="button" class="dk-button" aria-pressed="true" id="cell">Bid 3</button><button type="button" class="dk-button" aria-pressed="false">Bid 4</button></div>
<nav class="dk-tabbar" aria-label="Sections"><ul><li><a href="#play" aria-current="page" id="bar">Play</a></li><li><a href="#history">History</a></li></ul></nav></main>`;

/**
 * The theme switch in a demo's strip, which collapses to its name and one button drawn as the
 * chosen word is on a screen under 20rem wide, the width it is written at.
 */
const COLLAPSED = {
    width: 300,
    body: `<main><h1>Chosen</h1><div class="dk-strip"><section class="dk-strip-tools" aria-label="Theme">${shown(drawn(themeSwitch))}</section></div></main>`,
};

test("draws every chosen thing's words in forced colors, on the system's selection", async ({
    page,
}) => {
    // Forced before the page is written, so no ground is still easing from the author's color.
    await forceColors(page);
    for (const [written, ids] of [
        [
            { body: CHOSEN },
            ['pill', 'tab', 'tab-link', 'tab-toggle', 'toggle', 'open', 'theme', 'cell', 'bar'],
        ],
        [COLLAPSED, ['theme-button']],
    ] as const) {
        await writePage(page, { title: 'Chosen', ...written });
        const selection = await colorOf(page, 'Highlight');
        // On the selection, its words show as the selection's text where a backplate would
        // paint them over.
        for (const id of ids) {
            const chosen = page.locator(`#${id}`);
            await expect(chosen, id).toBeVisible();
            expect((await style(chosen, 'background-color'))['background-color'], id).toBe(
                selection
            );
            expect(await backplateUnderWords(chosen), id).toBeLessThan(0.8);
        }
    }
});

test('underlines a pill and a tab under a press in forced colors, where their color is replaced', async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'only Chromium draws forced colors here');
    await writePage(page, {
        title: 'Pressed',
        body:
            '<main><nav aria-label="Site"><ul class="dk-pills" role="list"><li><a class="dk-pill" href="#about" id="pill">About</a></li></ul></nav>' +
            '<nav aria-label="Categories"><ul class="dk-tabs" role="list"><li><a class="dk-tab" href="#books" id="tab">Books</a></li></ul></nav></main>',
    });
    await forceColors(page);
    for (const selector of ['#pill', '#tab']) {
        const target = page.locator(selector);
        expect((await style(target, 'text-decoration-line'))['text-decoration-line']).toBe('none');
        const drawn = await target.boundingBox();
        if (!drawn) throw new Error(`${selector} is not drawn`);
        await page.mouse.move(drawn.x + 4, drawn.y + drawn.height / 2);
        await page.mouse.down();
        expect(
            (await style(target, 'text-decoration-line'))['text-decoration-line'],
            selector
        ).toBe('underline');
        await page.mouse.up();
        await page.mouse.move(0, 0);
    }
});

test("changes a resting pill, a resting tab and the site's brand under a pressing thumb, where nothing hovers", async ({
    browser,
    browserName,
}) => {
    test.skip(browserName === 'firefox', 'Firefox emulates no touch screen');
    const context = await browser.newContext({ hasTouch: true, isMobile: true });
    try {
        const page = await context.newPage();
        await writePage(page, {
            width: 390,
            title: 'Pressed',
            body:
                '<header class="dk-site-header"><a class="dk-site-brand" href="#home">Scorekeeper</a>' +
                '<nav aria-label="Site"><ul class="dk-pills" role="list"><li><a class="dk-pill" href="#home" aria-current="page">Home</a></li><li><a class="dk-pill" href="#about" id="resting-pill">About</a></li></ul></nav></header>' +
                '<main><nav aria-label="Categories"><ul class="dk-tabs" role="list"><li><a class="dk-tab" href="#all" aria-current="page">All</a></li><li><a class="dk-tab" href="#books" id="resting-tab">Books</a></li></ul></nav></main>',
        });
        expect(await page.evaluate(() => matchMedia('(hover: hover)').matches)).toBe(false);
        const text = await colorOf(page, 'var(--dk-fg)');
        for (const [selector, property, pressed] of [
            ['#resting-pill', 'color', text],
            ['#resting-tab', 'color', text],
            ['.dk-site-brand', 'text-decoration-line', 'underline'],
        ] as const) {
            const target = page.locator(selector);
            const resting = (await style(target, property))[property];
            expect(resting, selector).not.toBe(pressed);
            const drawn = await target.boundingBox();
            if (!drawn) throw new Error(`${selector} is not drawn`);
            await page.mouse.move(drawn.x + 4, drawn.y + drawn.height / 2);
            await page.mouse.down();
            // A pill and a tab ease to the text color, so the pressed color is waited for.
            await expect
                .poll(async () => (await style(target, property))[property], { message: selector })
                .toBe(pressed);
            await page.mouse.up();
            await page.mouse.move(0, 0);
        }
    } finally {
        await context.close();
    }
});

test("rings every chosen thing in the system's text in forced colors, the theme word too", async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'only Chromium draws forced colors here');
    await forceColors(page);
    // Each chosen thing, the element focus lands on, the one its ring is drawn on, and the ring's
    // color: the system's text, or the selection's text on the tab bar's current place, whose ring
    // is drawn inside it on the selection.
    for (const [written, rings] of [
        [
            { body: CHOSEN },
            [
                ['#pill', '#pill', 'CanvasText'],
                ['#toggle', '#toggle', 'CanvasText'],
                ['#open', '#open', 'CanvasText'],
                ['#cell', '#cell', 'CanvasText'],
                ['#tab', '#tab', 'CanvasText'],
                ['#tab-toggle', '#tab-toggle', 'CanvasText'],
                ['#tab-link', '#tab-link', 'CanvasText'],
                ['.dk-theme-switch input:checked', '#theme', 'CanvasText'],
                ['#bar', '#bar', 'HighlightText'],
            ],
        ],
        [COLLAPSED, [['#theme-button', '#theme-button', 'CanvasText']]],
    ] as const) {
        await writePage(page, { title: 'Chosen', ...written });
        for (const [focused, ringed, color] of rings) {
            await ringByKeyboard(page.locator(focused), browserName);
            expect(
                (await style(page.locator(ringed), 'outline-color'))['outline-color'],
                ringed
            ).toBe(await colorOf(page, color));
        }
    }
});
