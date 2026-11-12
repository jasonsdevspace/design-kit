import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { box, sheet, sideways, style, writePage } from './page.js';
import { textSize } from './text-size.js';

/*
 * An app's frame as a browser draws it, in Chromium and in WebKit, since a bar that stays put and
 * a height that follows the browser's own bars are where Safari differs: the bar, the body and the
 * dock in view with only the body scrolling, the bar clear of the top safe area and the last row
 * clear of the bottom one, one top heading, the body's last line scrolled clear of everything
 * below it at a doubled text size with a few lines kept for the body, the page scrolled whole where
 * a doubled text size leaves too little height, nothing out of sight lengthening the page, a toast's place above the dock whatever the dock holds, the
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

/**
 * The visitor's text size doubled. Chromium takes the browser's own setting, which every rem is
 * drawn from, a media query's included. WebKit takes a root size, which no media query reads, so a
 * test of what a media query does at twice the text size asks for the setting and runs in Chromium
 * alone, and the rest run in both.
 */
const doubled = async (
    page: Page,
    browserName: string,
    { setting = false }: { readonly setting?: boolean } = {}
): Promise<void> => {
    if (browserName === 'chromium') {
        await textSize(page, 2);
        return;
    }
    test.skip(setting, 'only the browser setting reaches a media query, set through Chromium');
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
};

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
${
    toast
        ? '<div class="dk-app-toast"><div class="dk-toast dk-toast-shown" id="toast"><p class="dk-toast-message" aria-hidden="true">Round saved.</p><p class="dk-visually-hidden dk-toast-status" role="status">Round saved. Undo is available.</p><button type="button" class="dk-button dk-button-text dk-toast-action">Undo</button><button type="button" class="dk-button dk-button-text dk-toast-close" aria-label="Dismiss">×</button></div></div>'
        : ''
}
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
    // The last part's ground runs down under the home indicator, and what it holds ends above it.
    const low = await box(dock(page), 'the dock');
    expect(bottom(low)).toBe(700);
    expect(low.x).toBe(SAFE.left);
    expect(low.x + low.width).toBe(390 - SAFE.right);
    const save = await box(page.getByRole('button', { name: 'Save the round' }), 'the button');
    expect(bottom(save)).toBeLessThanOrEqual(700 - SAFE.bottom);

    // With a tab bar in its place, that is the row at the edge, and the dock sits on it.
    await open(page, { css: SAFE_CSS, tabs: true });
    const tabs = await box(page.locator('.dk-app-tabs'), 'the tab bar');
    expect(bottom(tabs)).toBe(700);
    expect(bottom(await box(page.locator('.dk-app-tabs a').first(), 'a link'))).toBeLessThanOrEqual(
        700 - SAFE.bottom
    );
    expect(bottom(await box(dock(page), 'the dock'))).toBe(tabs.y);

    // With neither, the body scrolls its last line clear of the edge the phone keeps.
    await open(page, { css: SAFE_CSS, dock: 0 });
    expect(bottom(await box(body(page), 'the body'))).toBe(700);
    await scrollToEnd(page);
    expect(bottom(await box(page.locator('#last'), 'the last line'))).toBeLessThanOrEqual(
        700 - SAFE.bottom
    );
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
    browserName,
}) => {
    // A phone held upright, tall enough at twice the text size to keep the frame, with a title
    // long enough to take two lines.
    await open(page, {
        height: 844,
        title: 'Round 3 of the game at the cabin',
        dock: 2,
        toast: true,
        tabs: true,
    });
    await doubled(page, browserName);
    await scrollToEnd(page);
    const last = await box(page.locator('#last'), 'the last line');
    for (const below of ['.dk-app-toast', '.dk-app-dock', '.dk-app-tabs']) {
        expect(bottom(last), below).toBeLessThanOrEqual((await box(page.locator(below), below)).y);
    }
    // The body keeps a few lines of its own, 8rem at twice the text size, however much the rows
    // around it hold, and the page scrolls to whatever no longer fits.
    expect((await box(body(page), 'the body')).height).toBeGreaterThanOrEqual(8 * 32);
    // The toast floats over the body and the title takes a row of its own, so the rows fit the
    // screen and the tab bar is at its foot with nothing to scroll.
    expect(bottom(await box(page.locator('.dk-app-tabs'), 'the tab bar'))).toBe(844);
    expect(await pageScroll(page)).toBe(0);
});

test('carries a swipe that reaches the end of the body on to the page, and ends clear of the home indicator', async ({
    page,
    browserName,
}) => {
    // A title long enough that the rows come to more than the screen and the page scrolls whole.
    await open(page, {
        height: 844,
        css: SAFE_CSS,
        title: 'The seventeenth round of a very long game of Wizard. '.repeat(3),
        dock: 2,
        toast: true,
        tabs: true,
    });
    await doubled(page, browserName);
    expect(await pageScroll(page)).toBeGreaterThan(0);
    const drawn = await box(body(page), 'the body');
    await page.mouse.move(drawn.x + drawn.width / 2, drawn.y + drawn.height / 2);
    // Wheel turns over the body, past its end, until the page has scrolled as far as it goes.
    for (let turn = 0; turn < 60; turn += 1) await page.mouse.wheel(0, 400);
    await expect
        .poll(() => page.evaluate(() => window.scrollY))
        .toBeGreaterThanOrEqual((await pageScroll(page)) - 1);
    // The bar's ground runs to the screen's edge, and its links end clear of the home indicator.
    expect(Math.round(bottom(await box(page.locator('.dk-app-tabs'), 'the tab bar')))).toBe(844);
    expect(bottom(await box(page.locator('.dk-app-tabs a').first(), 'a link'))).toBeLessThanOrEqual(
        844 - SAFE.bottom + 1
    );
});

test('scrolls the page whole on a phone too short at a doubled text size for a body between the bar and the dock', async ({
    page,
    browserName,
}) => {
    await open(page, { height: 700, dock: 2, toast: true, tabs: true });
    await doubled(page, browserName, { setting: true });
    // 700px is under 24rem at twice the text size, so the frame is as long as what it holds.
    expect(await body(page).evaluate((element) => getComputedStyle(element).overflowY)).toBe(
        'visible'
    );
    expect(await pageScroll(page)).toBeGreaterThan(0);
    const last = await box(page.locator('#last'), 'the last line');
    expect(bottom(last)).toBeLessThanOrEqual((await box(page.locator('.dk-app-toast'), 'toast')).y);
});

test('keeps what the body holds out of sight from lengthening the page', async ({ page }) => {
    await open(page);
    // Words for a screen reader alone, as a row or a stepper carries, low in the body.
    await body(page).evaluate((element) => {
        const hidden = document.createElement('span');
        hidden.className = 'dk-visually-hidden';
        hidden.textContent = ' points';
        element.append(hidden);
    });
    expect(await pageScroll(page)).toBe(0);
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

test('wraps a long title at a large text size, and cuts nothing off', async ({
    page,
    browserName,
}) => {
    const title = 'The seventeenth round of a very long game of Wizard';
    await open(page, { width: 320, height: 900, title });
    await doubled(page, browserName);
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
});

test("gives the title the bar's whole width under its action on a phone at twice the text size", async ({
    page,
    browserName,
}) => {
    await open(page, { width: 390, height: 844, title: 'Round 3 of the game at the cabin' });
    await doubled(page, browserName, { setting: true });
    const heading = page.locator('.dk-app-title');
    const title = await box(heading, 'the title');
    const action = await box(page.getByRole('button', { name: 'Scores' }), 'the action');
    // The action on a row of its own above, at the end, and the title across the bar below it.
    expect(bottom(action)).toBeLessThanOrEqual(title.y + 1);
    expect(action.x + action.width).toBeGreaterThan(390 - 64);
    const top = await box(bar(page), 'the bar');
    expect(title.width).toBeGreaterThan(top.width - 2 * 32 - 2);
    const line = parseFloat((await style(heading, 'line-height'))['line-height'] ?? '');
    expect(title.height).toBeLessThanOrEqual(line * 2 + 1);
    // Still the bar's first element, so a screen reader meets the title before the action.
    expect(await bar(page).evaluate((element) => element.firstElementChild?.className)).toBe(
        'dk-app-title'
    );
    expect(await sideways(page)).toBe(0);
});

test("keeps the bar's rule in sight over a toast at twice the text size on a narrow phone", async ({
    page,
    browserName,
}) => {
    await open(page, {
        width: 320,
        height: 844,
        title: 'Round 3 of the game at the cabin',
        toast: true,
    });
    await doubled(page, browserName, { setting: true });
    const top = await box(bar(page), 'the bar');
    // What is drawn on the bar's last pixel row, its rule, is the bar's own.
    expect(
        await page.evaluate(
            ([x, y]) => document.elementFromPoint(x, y)?.closest('.dk-app-bar') !== null,
            [top.x + top.width / 2, top.y + top.height - 0.5] as const
        )
    ).toBe(true);
    // The toast's place opens on a rule of its own, under which the body scrolls.
    await expect(page.locator('.dk-app-toast')).toHaveCSS('border-top-style', 'solid');
});

test('squeezes no row where the bar and the dock come to more than the screen, and scrolls the page', async ({
    page,
    browserName,
}) => {
    const title = 'The seventeenth round of a very long game of Wizard. '.repeat(3);
    await open(page, { width: 320, height: 900, title, dock: 2 });
    await doubled(page, browserName);
    const top = await box(bar(page), 'the bar');
    expect(bottom(await box(page.locator('.dk-app-title'), 'the title'))).toBeLessThanOrEqual(
        bottom(top)
    );
    // The dock starts where the bar ends, whole, and the page scrolls down to it.
    const low = await box(dock(page), 'the dock');
    expect(low.y).toBeGreaterThanOrEqual(bottom(top));
    expect(bottom(low)).toBeGreaterThan(900);
    expect(await pageScroll(page)).toBeGreaterThanOrEqual(bottom(low) - 900);
    expect((await box(body(page), 'the body')).height).toBeGreaterThanOrEqual(8 * 32);
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

test('draws the skip link below the top safe area and past the side one', async ({ page }) => {
    await writePage(page, {
        width: 390,
        height: 700,
        css: SAFE_CSS,
        title: 'Round 3',
        body: `<a class="dk-skip" href="#main-content">Skip to content</a>${screen()}`,
    });
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await skip.focus();
    const drawn = await box(skip, 'the skip link');
    expect(drawn.y).toBeGreaterThanOrEqual(SAFE.top);
    // The side the phone keeps, then the inset every page's links start at.
    expect(drawn.x).toBeGreaterThanOrEqual(SAFE.left + 16);
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
        // The toast rises into place, so the audit reads its colors once it has arrived.
        await page.waitForFunction(() => document.getAnimations().length === 0);
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations).toEqual([]);
    });
}
