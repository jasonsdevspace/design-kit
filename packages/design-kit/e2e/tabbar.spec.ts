import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';

import { box, sideways, style, writePage } from './page.js';

/*
 * A tab bar as a browser draws it, in Chromium and in WebKit, since a bar stuck to the bottom of
 * the screen is where Safari differs: at the bottom while the page scrolls and on a page shorter
 * than the screen, clear of the home indicator, the page's last line scrolled clear of it, the
 * current link told apart by more than its color, forced colors included, from two to five links
 * sharing a phone's narrowest width, a long label wrapping at a doubled text size with the bar
 * grown to hold it, every link at the larger target, the app's column on a wide screen, the last
 * row of an app's frame and the keyboard's last stops there, nothing on paper, and no audit
 * findings in either theme.
 */

const SAFE_BOTTOM = 34;
const SAFE_CSS = `:root { --dk-safe-bottom: ${String(SAFE_BOTTOM)}px; }`;

/** The visitor's text size doubled, which every rem in the bar is drawn from. */
const DOUBLED = 'html { font-size: 200%; }';

const ICON =
    '<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="currentColor"/></svg>';

const PLACES = ['Play', 'History', 'Players', 'Options', 'About'];

/** A bar of the places named, the first the one the visitor is in. */
const tabBar = (places: readonly string[], slot = ''): string =>
    `<nav class="${slot}dk-tabbar" aria-label="Sections"><ul>${places
        .map(
            (place, index) =>
                `<li><a href="#${String(index)}"${index === 0 ? ' aria-current="page"' : ''}>${ICON}${place}</a></li>`
        )
        .join('')}</ul></nav>`;

const lines = (count: number): string =>
    Array.from(
        { length: count },
        (_, index) => `<p>Game ${String(index + 1)} of the season.</p>`
    ).join('');

/** A page that scrolls whole and ends in the bar, as the reference writes it. */
const open = async (
    page: Page,
    {
        width = 390,
        height = 700,
        theme = 'light',
        css = '',
        places = PLACES.slice(0, 3),
        count = 40,
    }: {
        readonly width?: number;
        readonly height?: number;
        readonly theme?: 'light' | 'dark';
        readonly css?: string;
        readonly places?: readonly string[];
        readonly count?: number;
    } = {}
): Promise<void> => {
    await writePage(page, {
        width,
        height,
        theme,
        css,
        title: 'History',
        body: `<main><h1>History</h1><p><a href="#first">The first game</a></p>${lines(count)}<p id="last">The last line.</p></main>${tabBar(places)}`,
    });
    await page.evaluate(() => {
        document.body.classList.add('dk-tabbar-page');
    });
};

const bar = (page: Page): Locator => page.locator('.dk-tabbar');
const links = (page: Page): Locator => page.locator('.dk-tabbar a');

/** Where a drawn element ends, down the page. */
const bottom = (drawn: { y: number; height: number }): number => drawn.y + drawn.height;

const scrollToEnd = (page: Page): Promise<void> =>
    page.evaluate(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
    });

test('stays at the bottom of the screen while the page scrolls, and on a page shorter than the screen', async ({
    page,
}) => {
    await open(page);
    expect(bottom(await box(bar(page), 'the bar'))).toBe(700);
    await page.evaluate(() => {
        window.scrollTo(0, 300);
    });
    expect(await page.evaluate(() => window.scrollY)).toBe(300);
    expect(bottom(await box(bar(page), 'the bar'))).toBe(700);
    await scrollToEnd(page);
    expect(bottom(await box(bar(page), 'the bar'))).toBe(700);

    await open(page, { count: 1 });
    expect(bottom(await box(bar(page), 'the bar'))).toBe(700);
    expect(
        await page.evaluate(
            () => document.documentElement.scrollHeight - document.documentElement.clientHeight
        )
    ).toBe(0);
});

test('clears the home indicator, by the bottom safe area token', async ({ page }) => {
    await open(page, { css: SAFE_CSS });
    // The bar's ground runs to the edge, and its links end above what the phone keeps.
    expect(bottom(await box(bar(page), 'the bar'))).toBe(700);
    for (const link of await links(page).all()) {
        expect(bottom(await box(link, 'a link'))).toBe(700 - SAFE_BOTTOM);
    }
});

test("scrolls the page's last line clear of the bar", async ({ page }) => {
    await open(page, { css: SAFE_CSS });
    await expect(page.locator('#last')).not.toBeInViewport();
    await scrollToEnd(page);
    expect(bottom(await box(page.locator('#last'), 'the last line'))).toBeLessThanOrEqual(
        (await box(bar(page), 'the bar')).y
    );
});

test('tells the current link apart by its weight and a line, forced colors included', async ({
    page,
}) => {
    await open(page);
    const current = page.getByRole('link', { name: 'Play', exact: true });
    const other = page.getByRole('link', { name: 'History' });
    await expect(current).toHaveAttribute('aria-current', 'page');
    const told = ['font-weight', 'border-top-width', 'border-top-style'];
    const marked = await style(current, ...told);
    const resting = await style(other, ...told);
    expect([marked['border-top-width'], marked['border-top-style']]).toEqual(['2px', 'solid']);
    expect(resting['border-top-width']).toBe('0px');
    expect(Number(marked['font-weight'])).toBeGreaterThan(Number(resting['font-weight']));
    // The line takes the room the others pad by, so every label sits at one height.
    expect((await box(current.locator('svg'), 'the icon')).y).toBe(
        (await box(other.locator('svg'), 'the icon')).y
    );

    await page.emulateMedia({ forcedColors: 'active' });
    expect((await style(current, 'border-top-width'))['border-top-width']).toBe('2px');
    expect((await style(other, 'border-top-width'))['border-top-width']).toBe('0px');
});

test("shares a phone's narrowest width evenly, from two links to five", async ({ page }) => {
    for (const count of [2, 3, 4, 5]) {
        await open(page, { width: 320, places: PLACES.slice(0, count) });
        const drawn = await Promise.all(
            (await links(page).all()).map((link) => box(link, 'a link'))
        );
        expect(drawn, `${String(count)} links`).toHaveLength(count);
        for (const link of drawn) {
            expect(link.width, `${String(count)} links`).toBeCloseTo(320 / count, 0);
        }
        expect(drawn[0]?.x, `${String(count)} links`).toBe(0);
        expect(await sideways(page), `${String(count)} links`).toBe(0);
    }
});

test('wraps a long label at a doubled text size, and grows to hold it', async ({ page }) => {
    const places = ['Play', 'Games played before', 'Players', 'Options', 'About'];
    await open(page, { width: 320, places });
    const before = (await box(bar(page), 'the bar')).height;
    await open(page, { width: 320, css: DOUBLED, places });
    const grown = await box(bar(page), 'the bar');
    expect(grown.height).toBeGreaterThan(before);
    expect(bottom(grown)).toBe(700);
    for (const link of await links(page).all()) {
        const drawn = await box(link, 'a link');
        // No label wider or taller than its link, and no link outside the bar.
        expect(
            await link.evaluate((element) => [
                element.scrollWidth - element.clientWidth,
                element.scrollHeight - element.clientHeight,
            ])
        ).toEqual([0, 0]);
        expect(drawn.y).toBeGreaterThanOrEqual(grown.y);
        expect(bottom(drawn)).toBeLessThanOrEqual(bottom(grown));
    }
    expect(await sideways(page)).toBe(0);
});

test('draws every link at the larger target or taller, with its icon over its label', async ({
    page,
}) => {
    await open(page);
    for (const link of await links(page).all()) {
        const drawn = await box(link, 'a link');
        expect(drawn.height).toBeGreaterThanOrEqual(56);
        const icon = await box(link.locator('svg'), 'the icon');
        expect([icon.width, icon.height]).toEqual([24, 24]);
        expect(bottom(icon)).toBeLessThan(bottom(drawn));
    }
});

test("is the app's column in the middle of a wide screen", async ({ page }) => {
    await open(page, { width: 1280 });
    const wide = await box(bar(page), 'the bar');
    expect(wide.width).toBe(448);
    expect(wide.x).toBe((1280 - 448) / 2);
    expect(bottom(wide)).toBe(700);
});

test("is the last row of an app's frame, clear of the home indicator once, and the keyboard's last stops", async ({
    page,
    browserName,
}) => {
    await writePage(page, {
        width: 390,
        height: 700,
        css: SAFE_CSS,
        title: 'Round 3',
        body: `<div class="dk-app">
<header class="dk-app-bar"><h1 class="dk-app-title">Round 3</h1></header>
<main class="dk-app-body" tabindex="0">${lines(40)}</main>
<section class="dk-app-dock" aria-label="Actions"><button type="button" class="dk-button dk-button-accent dk-button-tall">Save the round</button></section>
${tabBar(PLACES.slice(0, 3), 'dk-app-tabs ')}
</div>`,
    });
    const drawn = await box(bar(page), 'the bar');
    expect(bottom(drawn)).toBe(700 - SAFE_BOTTOM);
    expect(drawn.width).toBe(390);
    expect(drawn.y).toBe(bottom(await box(page.locator('.dk-app-dock'), 'the dock')));
    // The frame clears the edge, so the bar pads by nothing of its own.
    expect(bottom(await box(links(page).first(), 'a link'))).toBe(bottom(drawn));

    // Safari on a Mac keeps the plain Tab key for fields, and reaches a link with Option held.
    const tab = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
    const reached: string[] = [];
    for (let stop = 0; stop < 5; stop += 1) {
        await page.keyboard.press(tab);
        reached.push(
            await page.evaluate(() => {
                const at = document.activeElement;
                return at?.tagName === 'MAIN' ? 'the body' : (at?.textContent.trim() ?? 'nothing');
            })
        );
    }
    expect(reached).toEqual(['the body', 'Save the round', 'Play', 'History', 'Players']);
});

test("draws a link's focus ring inside the bar, where the screen's edge would cut it", async ({
    page,
}) => {
    await open(page);
    const link = links(page).first();
    await link.focus();
    const ring = await style(link, 'outline-offset', 'outline-width');
    expect(parseFloat(ring['outline-offset'] ?? '')).toBe(-parseFloat(ring['outline-width'] ?? ''));
});

test('does not print', async ({ page }) => {
    await open(page);
    await page.emulateMedia({ media: 'print' });
    await expect(bar(page)).toBeHidden();
});

for (const theme of ['light', 'dark'] as const) {
    test(`has no audit findings in the ${theme} theme`, async ({ page }) => {
        await open(page, { theme, places: PLACES });
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
    });
}
