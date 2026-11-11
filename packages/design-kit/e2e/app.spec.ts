import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { box, sheet, sideways, style, writePage } from './page.js';

/*
 * An app's frame as a browser draws it, in Chromium and in WebKit, since a bar that stays put and
 * a height that follows the browser's own bars are where Safari differs: the bar, the body and the
 * dock in view with only the body scrolling, the bar clear of the top safe area and the last row
 * clear of the bottom one, one top heading, the body's last line scrolled clear of everything
 * below it at a doubled text size, a toast's place above the dock whatever the dock holds, the
 * frame as tall as the screen at any height, a column in the middle of a wide screen and the full
 * width of a phone, a long title wrapping, the keyboard going bar, body, dock, the frame printing
 * whole, and no audit findings in either theme.
 */

/** What the phone keeps at each edge, set as a page sets the kit's tokens. */
const SAFE = { top: 47, right: 12, bottom: 34, left: 10 };
const SAFE_CSS = `:root {
    --dk-safe-top: ${String(SAFE.top)}px;
    --dk-safe-right: ${String(SAFE.right)}px;
    --dk-safe-bottom: ${String(SAFE.bottom)}px;
    --dk-safe-left: ${String(SAFE.left)}px;
}`;

/** The visitor's text size doubled, which every rem in the frame is drawn from. */
const DOUBLED = 'html { font-size: 200%; }';

const LINES = Array.from(
    { length: 40 },
    (_, index) => `<p>Round ${String(index + 1)} of the game so far.</p>`
).join('');

/** A screen in the frame, with the parts asked for. */
const screen = ({
    title = 'Round 3',
    dock = 1,
    toast = false,
    tabs = false,
}: {
    readonly title?: string;
    readonly dock?: 0 | 1 | 2;
    readonly toast?: boolean;
    readonly tabs?: boolean;
} = {}): string => `<div class="dk-app">
<header class="dk-app-bar">
<h1 class="dk-app-title">${title}</h1>
<button type="button" class="dk-button dk-button-text">Scores</button>
</header>
<main class="dk-app-body" id="main-content" tabindex="0">
<p><a href="#rules">How a round is scored</a></p>
${LINES}
<p id="last">The last line.</p>
</main>
${toast ? '<div class="dk-app-toast"><p id="toast" role="status">Round saved.</p></div>' : ''}
${
    dock > 0
        ? `<section class="dk-app-dock" aria-label="Actions">
<button type="button" class="dk-button dk-button-accent dk-button-tall">Save the round</button>
${dock > 1 ? '<button type="button" class="dk-button dk-button-tall">Skip a player</button>' : ''}
</section>`
        : ''
}
${
    tabs
        ? '<nav class="dk-app-tabs" aria-label="Sections"><a href="#game">Game</a> <a href="#history">History</a></nav>'
        : ''
}
</div>`;

const open = async (
    page: Page,
    {
        width = 390,
        height = 700,
        theme = 'light',
        css = '',
        ...parts
    }: Parameters<typeof screen>[0] & {
        readonly width?: number;
        readonly height?: number;
        readonly theme?: 'light' | 'dark';
        readonly css?: string;
    } = {}
): Promise<void> => {
    await writePage(page, { width, height, theme, css, title: 'Round 3', body: screen(parts) });
};

const bar = (page: Page) => page.locator('.dk-app-bar');
const body = (page: Page) => page.locator('.dk-app-body');
const dock = (page: Page) => page.locator('.dk-app-dock');

/** Where a drawn element ends, down the page. */
const bottom = (drawn: { y: number; height: number }): number => drawn.y + drawn.height;

/** The body scrolled as far as it goes. */
const scrollToEnd = (page: Page): Promise<void> =>
    body(page).evaluate((element) => {
        element.scrollTop = element.scrollHeight;
    });

/** How far the page itself scrolls down, which is nothing when only the body does. */
const pageScroll = (page: Page): Promise<number> =>
    page.evaluate(
        () => document.documentElement.scrollHeight - document.documentElement.clientHeight
    );

test('shows the bar, the body and the dock, and scrolls only the body', async ({ page }) => {
    await open(page);
    const before = {
        bar: await box(bar(page), 'the bar'),
        dock: await box(dock(page), 'the dock'),
    };
    expect(before.bar.y).toBe(0);
    expect(bottom(before.dock)).toBe(700);
    expect(await pageScroll(page)).toBe(0);
    await expect(page.locator('#last')).not.toBeInViewport();

    await scrollToEnd(page);
    expect(await body(page).evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await expect(page.locator('#last')).toBeInViewport();
    expect(await box(bar(page), 'the bar')).toEqual(before.bar);
    expect(await box(dock(page), 'the dock')).toEqual(before.dock);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('clears what the phone keeps at each edge, by the safe area tokens', async ({ page }) => {
    await open(page, { css: SAFE_CSS });
    const top = await box(bar(page), 'the bar');
    // The bar's ground runs up under the notch, and its words start below it.
    expect(top.y).toBe(0);
    expect(top.height).toBe(SAFE.top + 64 + 1);
    expect((await box(page.locator('.dk-app-title'), 'the title')).y).toBeGreaterThanOrEqual(
        SAFE.top
    );
    const low = await box(dock(page), 'the dock');
    expect(bottom(low)).toBe(700 - SAFE.bottom);
    expect(low.x).toBe(SAFE.left);
    expect(low.x + low.width).toBe(390 - SAFE.right);

    // With a tab bar in its place, that is the row at the edge, and the dock sits on it.
    await open(page, { css: SAFE_CSS, tabs: true });
    const tabs = await box(page.locator('.dk-app-tabs'), 'the tab bar');
    expect(bottom(tabs)).toBe(700 - SAFE.bottom);
    expect(bottom(await box(dock(page), 'the dock'))).toBe(tabs.y);

    // With neither, the body ends short of the edge the phone keeps.
    await open(page, { css: SAFE_CSS, dock: 0 });
    expect(bottom(await box(body(page), 'the body'))).toBe(700 - SAFE.bottom);
});

test("has one top heading, the bar's title", async ({ page }) => {
    await open(page);
    const headings = page.getByRole('heading', { level: 1 });
    await expect(headings).toHaveCount(1);
    await expect(headings).toHaveClass('dk-app-title');
    await expect(headings).toHaveText('Round 3');
});

test("scrolls the body's last line clear of everything below it, at a doubled text size", async ({
    page,
}) => {
    await open(page, { css: DOUBLED, dock: 2, toast: true, tabs: true });
    await scrollToEnd(page);
    const last = await box(page.locator('#last'), 'the last line');
    for (const below of ['.dk-app-toast', '.dk-app-dock', '.dk-app-tabs']) {
        expect(bottom(last), below).toBeLessThanOrEqual((await box(page.locator(below), below)).y);
    }
    // The rows below still fit, with room left for the body between them and the bar.
    expect(bottom(await box(page.locator('.dk-app-tabs'), 'the tab bar'))).toBe(700);
    expect((await box(body(page), 'the body')).height).toBeGreaterThan(0);
});

test("sets a toast above the dock and clear of the body's last line, with a dock of one row and of two", async ({
    page,
}) => {
    for (const rows of [1, 2] as const) {
        await open(page, { dock: rows, toast: true });
        await scrollToEnd(page);
        const toast = await box(page.locator('#toast'), 'the toast');
        const low = await box(dock(page), 'the dock');
        expect(bottom(toast), `${String(rows)} rows`).toBeLessThanOrEqual(low.y);
        expect(
            bottom(await box(page.locator('#last'), 'the last line')),
            `${String(rows)} rows`
        ).toBeLessThanOrEqual(toast.y);
        expect(bottom(low), `${String(rows)} rows`).toBe(700);
    }
    // A dock of two rows is taller, and the toast moved up by as much.
    await open(page, { dock: 1, toast: true });
    const one = await box(page.locator('#toast'), 'the toast');
    await open(page, { dock: 2, toast: true });
    expect((await box(page.locator('#toast'), 'the toast')).y).toBeLessThan(one.y);
});

test('is as tall as the screen at any height, by the dynamic height', async ({ page }) => {
    for (const height of [700, 500]) {
        await open(page, { height });
        const frame = await box(page.locator('.dk-app'), 'the frame');
        expect(frame.y, `${String(height)}px`).toBe(0);
        expect(frame.height, `${String(height)}px`).toBe(height);
    }
    // No test can move a phone browser's bars, so the unit itself is held: the dynamic height
    // last, after the plain one a browser without it reads.
    const rule = /:where\(\.dk-app\) \{[^}]*\}/.exec(sheet('components.css'))?.[0] ?? '';
    expect(rule).toMatch(/height: 100vh;\s+height: 100dvh;/);
});

test('is a column of 28rem in the middle of a wide screen, and the full width of a phone', async ({
    page,
}) => {
    await open(page, { width: 1280 });
    const wide = await box(page.locator('.dk-app'), 'the frame');
    expect(wide.width).toBe(448);
    expect(wide.x).toBe((1280 - 448) / 2);

    await open(page, { width: 320 });
    const narrow = await box(page.locator('.dk-app'), 'the frame');
    expect(narrow.x).toBe(0);
    expect(narrow.width).toBe(320);
    expect(await sideways(page)).toBe(0);
});

test('wraps a long title at a large text size, and cuts nothing off', async ({ page }) => {
    const title = 'The seventeenth round of a very long game of Wizard';
    await open(page, { width: 320, css: DOUBLED, title });
    const heading = page.locator('.dk-app-title');
    const drawn = await box(heading, 'the title');
    const line = parseFloat((await style(heading, 'line-height'))['line-height'] ?? '');
    expect(drawn.height).toBeGreaterThan(line * 1.5);
    // The bar grew to hold every line, with the action still beside it and inside the screen.
    const top = await box(bar(page), 'the bar');
    expect(bottom(drawn)).toBeLessThanOrEqual(bottom(top));
    const action = await box(page.getByRole('button', { name: 'Scores' }), 'the action');
    expect(action.x + action.width).toBeLessThanOrEqual(320);
    expect(
        await heading.evaluate((element) => element.scrollWidth - element.clientWidth)
    ).toBeLessThanOrEqual(0);
    expect(await sideways(page)).toBe(0);
    expect(await pageScroll(page)).toBe(0);
});

test('takes the keyboard through the bar, then the body, then the dock', async ({
    page,
    browserName,
}) => {
    await open(page, { tabs: true });
    // Safari on a Mac keeps the plain Tab key for fields, and reaches a link with Option held.
    const tab = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
    const reached: string[] = [];
    for (let stop = 0; stop < 6; stop += 1) {
        await page.keyboard.press(tab);
        reached.push(
            await page.evaluate(() => {
                const at = document.activeElement;
                return at?.tagName === 'MAIN' ? 'the body' : (at?.textContent.trim() ?? 'nothing');
            })
        );
    }
    expect(reached).toEqual([
        'Scores',
        'the body',
        'How a round is scored',
        'Save the round',
        'Game',
        'History',
    ]);
});

test("scrolls the body by the keyboard once it has focus, with its ring inside the screen's edges", async ({
    page,
}) => {
    await open(page);
    await body(page).focus();
    await page.keyboard.press('End');
    await expect(page.locator('#last')).toBeInViewport();
    const ring = await style(body(page), 'outline-offset', 'outline-width');
    expect(parseFloat(ring['outline-offset'] ?? '')).toBe(-parseFloat(ring['outline-width'] ?? ''));
});

test('lets the page scroll whole on a screen too short for a body between the bar and the dock', async ({
    page,
}) => {
    // A window of 1280 by 1024 zoomed to four times, and a small phone on its side.
    for (const [width, height] of [
        [320, 256],
        [568, 320],
    ] as const) {
        await open(page, { width, height, dock: 2, toast: true, tabs: true });
        const size = `${String(width)} by ${String(height)}`;
        expect(await pageScroll(page), size).toBeGreaterThan(0);
        expect((await style(body(page), 'overflow-y'))['overflow-y'], size).toBe('visible');
        // Every line of the body is drawn, the first under the bar and the last over the toast.
        const held = await box(body(page), 'the body');
        expect(held.y, size).toBeGreaterThanOrEqual(bottom(await box(bar(page), 'the bar')));
        expect(bottom(await box(page.locator('#last'), 'the last line')), size).toBeLessThanOrEqual(
            (await box(page.locator('.dk-app-toast'), 'the toast')).y
        );
        expect(await sideways(page), size).toBe(0);
    }
    // One step taller and the frame holds the screen again.
    await open(page, { width: 568, height: 385 });
    expect(await pageScroll(page)).toBe(0);
});

test('pads past a side safe area only by what the column leaves uncleared, on a phone on its side', async ({
    page,
}) => {
    const sides = ':root { --dk-safe-left: 47px; --dk-safe-right: 47px; }';
    // The column's margin, 198px, clears the notch, so the dock is the column's full width.
    await open(page, { width: 844, height: 390, css: sides });
    const wide = await box(dock(page), 'the dock');
    expect(wide.x).toBe((844 - 448) / 2);
    expect(wide.width).toBe(448);
    // A margin of 20px clears that much of it, and the frame pads the rest.
    await open(page, { width: 488, height: 390, css: sides });
    expect((await box(dock(page), 'the dock')).x).toBe(47);
});

test('draws the skip link below the top safe area', async ({ page }) => {
    await writePage(page, {
        width: 390,
        height: 700,
        css: SAFE_CSS,
        title: 'Round 3',
        body: `<a class="dk-skip" href="#main-content">Skip to content</a>${screen()}`,
    });
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await skip.focus();
    expect((await box(skip, 'the skip link')).y).toBeGreaterThanOrEqual(SAFE.top);
});

test('prints as long and as wide as what it holds, with the body whole', async ({ page }) => {
    await open(page, { width: 1280, css: SAFE_CSS });
    await page.emulateMedia({ media: 'print' });
    const frame = await box(page.locator('.dk-app'), 'the frame');
    expect(frame.height).toBeGreaterThan(700);
    expect(frame.width).toBeGreaterThan(448);
    expect(frame.x).toBeLessThan(100);
    expect((await style(body(page), 'overflow-y'))['overflow-y']).toBe('visible');
});

for (const theme of ['light', 'dark'] as const) {
    test(`has no audit findings in the ${theme} theme`, async ({ page }) => {
        await open(page, { theme, toast: true, tabs: true, dock: 2 });
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
    });
}
