import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';

import {
    box,
    colorOf,
    forceColors,
    settle,
    shadowOf,
    sheet,
    sideways,
    style,
    tabKey,
    writePage,
} from './page.js';
import { cutOff } from './spacing.js';
import { doubled } from './text-size.js';

/*
 * An app's frame as a browser draws it, in Chromium and in WebKit, since a bar that stays put and a
 * height that follows the browser's own bars are where Safari differs: the bar, the body and the
 * dock in view with only the body scrolling, the bar clear of the top safe area and the last row
 * clear of the bottom one, one top heading, the body's last line scrolled clear of everything below
 * it at a doubled text size with a few lines kept for the body, the page scrolled whole where a
 * doubled text size leaves too little height, nothing out of sight lengthening the page, a toast's
 * place above the dock whatever the dock holds, the frame as tall as the screen at any height and a
 * picture of one as tall as what it holds, clear of no safe area, a
 * column in the middle of a wide screen and the full width of a phone, a long title wrapping, one
 * long word breaking inside the bar on a 320px phone at twice the text size, the keyboard going
 * bar, body, dock, the frame printing whole, and no audit findings in either theme.
 */

/** What the phone keeps at each edge, set as a page sets the kit's tokens. */
const SAFE = { top: 47, right: 12, bottom: 34, left: 10 };
const SAFE_CSS = `:root {
    --dk-safe-top: ${String(SAFE.top)}px;
    --dk-safe-right: ${String(SAFE.right)}px;
    --dk-safe-bottom: ${String(SAFE.bottom)}px;
    --dk-safe-left: ${String(SAFE.left)}px;
}`;

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
        ? '<div class="dk-app-toast"><div class="dk-toast" data-shown id="toast"><p class="dk-toast-message" aria-hidden="true">Round saved.</p><p class="dk-visually-hidden dk-toast-status" role="status">Round saved. Undo is available.</p><div class="dk-toast-buttons"><button type="button" class="dk-button dk-button-text dk-toast-action">Undo</button><button type="button" class="dk-button dk-button-text dk-button-quiet dk-toast-close" aria-label="Close">×</button></div></div></div>'
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
    // A shown toast rises into place, so a test reads it once it has arrived, wherever a browser
    // would otherwise catch it on the way.
    if (parts.toast) await settle(page.locator('#toast'));
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
    // The page scrolls to whatever the rows leave below the screen, the tab bar included.
    const tabs = await box(page.locator('.dk-app-tabs'), 'the tab bar');
    expect(await pageScroll(page)).toBeGreaterThanOrEqual(bottom(tabs) - 844);
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
    // No test can move a phone browser's bars, so the unit itself is held: the dynamic height,
    // which every browser at the kit's floor reads.
    const rule = /:where\(\.dk-app\) \{[^}]*\}/.exec(sheet('components.css'))?.[0] ?? '';
    expect(rule).toMatch(/height: 100dvh;/);
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

test("keeps a floating toast's place to itself: over pinned cells, taking taps around the toast, and not on paper", async ({
    page,
}) => {
    await open(page, { toast: true });
    const place = page.locator('.dk-app-toast');
    // Over a pinned cell of the body's, which stands at the pinned order.
    await body(page).evaluate((element) => {
        const cell = document.createElement('p');
        cell.id = 'pinned';
        cell.style.position = 'relative';
        cell.style.zIndex = 'var(--dk-stack-pinned)';
        cell.textContent = 'Ana';
        element.prepend(cell);
    });
    const drawn = await box(place, "the toast's place");
    const card = await box(page.locator('#toast'), 'the toast');
    await page.locator('#pinned').evaluate((element, top) => {
        element.style.top = `${String(top - element.getBoundingClientRect().top)}px`;
    }, card.y + 4);
    const at = (x: number, y: number) =>
        page.evaluate(
            ([px, py]) =>
                document.elementFromPoint(px, py)?.closest('[class], [id]')?.className ?? '',
            [x, y] as const
        );
    expect(await at(card.x + card.width / 2, card.y + 2)).toContain('dk-toast');
    // A tap on the ground beside the toast lands on its place, never on the body hidden under it.
    expect(await at(drawn.x + 4, card.y + card.height / 2)).toBe('dk-app-toast');
    // The page under the frame neither bounces nor reloads on a pull.
    await expect(page.locator('html')).toHaveCSS('overscroll-behavior-y', 'none');
    // On paper the place keeps its row and draws no rule.
    await page.emulateMedia({ media: 'print' });
    await expect(place).toHaveCSS('border-top-style', 'none');
});

test('keeps a frame with no dock and no tab bar clear of the home indicator', async ({ page }) => {
    await open(page, { css: SAFE_CSS, dock: 0, toast: true });
    expect(bottom(await box(body(page), 'the body'))).toBe(700);
    await scrollToEnd(page);
    expect(bottom(await box(page.locator('#last'), 'the last line'))).toBeLessThanOrEqual(
        700 - SAFE.bottom
    );
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
    const tab = tabKey(browserName);
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

for (const [frame, width] of [
    ['a tab bar', 390],
    ['a tab bar', 1440],
    ["an app's frame", 1440],
] as const)
    test(`draws the skip link where the strip's links start on a page with ${frame}, ${String(width)} wide`, async ({
        page,
    }) => {
        const strip =
            '<div class="dk-strip"><nav class="dk-strip-links" aria-label="Portfolio"><a href="#home">Jason Poteet</a></nav></div>';
        const tabbar =
            '<nav class="dk-tabbar" aria-label="Sections"><ul><li><a href="#play" aria-current="page">Play</a></li></ul></nav>';
        const skip = '<a class="dk-skip" href="#main-content">Skip to content</a>';
        const main = '<main id="main-content" tabindex="-1"><h1>Round 3</h1></main>';
        await writePage(page, {
            width,
            height: 700,
            css: SAFE_CSS,
            title: 'Round 3',
            body:
                frame === 'a tab bar'
                    ? `${skip}${strip}${main}${tabbar}`
                    : `${skip}<div class="dk-app">${strip}${main}</div>`,
        });
        // A page that ends in a tab bar is its body, so the class goes on the body.
        if (frame === 'a tab bar')
            await page.evaluate(() => document.body.classList.add('dk-tabbar-page'));
        const link = page.getByRole('link', { name: 'Skip to content' });
        await link.focus();
        const at = (await box(link, 'the skip link')).x;
        // Past the side the phone keeps, and on the line the strip's first link starts on.
        expect(at).toBeGreaterThanOrEqual(SAFE.left + 16);
        const first = await box(page.getByRole('link', { name: 'Jason Poteet' }), 'the strip');
        expect(Math.round(at)).toBe(Math.round(first.x));
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

/** A control of each kind, as a screen of an app or a plain page holds them. */
const CONTROLS = `<button type="button" class="dk-button" data-kind="button">Undo</button>
<button type="button" class="dk-button dk-button-text" data-kind="text">Rules</button>
<button type="button" class="dk-button dk-button-text dk-button-quiet" data-kind="quiet"><span aria-hidden="true">×</span><span class="dk-visually-hidden">Close</span></button>
<button type="button" class="dk-button dk-button-tall" data-kind="tall">Next round</button>
<input class="dk-input" aria-label="Name" data-kind="field">
<select class="dk-select" aria-label="Game" data-kind="select"><option>Hearts</option></select>
<label class="dk-choice" data-kind="choice"><input type="checkbox"> Keep score</label>
<div class="dk-theme-switch" role="radiogroup" aria-label="Theme"><label class="dk-theme-switch-choice" data-kind="switch"><input type="radio" name="theme" checked><span>System</span></label></div>
<div class="dk-tabs" role="tablist" aria-label="Views"><button type="button" class="dk-tab" role="tab" aria-selected="true" data-kind="tab">All</button></div>
<ul class="dk-pills"><li><a class="dk-pill" href="#games" data-kind="pill">Games</a></li></ul>`;

/** The kinds that are the target tall in an app, and a field's height on a plain wide page. */
const HELD = ['button', 'quiet', 'field', 'select', 'choice', 'switch', 'tab', 'pill'];

type Sizes = Partial<Record<string, { readonly height: number; readonly width: number }>>;

/** The height and width of each kind of control in the element the selector finds. */
const sizes = (page: Page, within: string): Promise<Sizes> =>
    page.locator(`${within} [data-kind]`).evaluateAll((controls) =>
        Object.fromEntries(
            controls.map((control): [string, { height: number; width: number }] => {
                const drawn = control.getBoundingClientRect();
                return [
                    control.getAttribute('data-kind') ?? '',
                    { height: Math.round(drawn.height), width: Math.round(drawn.width) },
                ];
            })
        )
    );

test('holds every control in an app to the target on a wide screen, and leaves the rest of a page as it was', async ({
    page,
}) => {
    for (const { name, body, bodyClass } of [
        {
            name: 'a frame',
            body: `<div class="dk-app"><main class="dk-app-body" id="in">${CONTROLS}</main></div>`,
            bodyClass: '',
        },
        {
            name: 'a page that ends in a tab bar',
            body: `<main id="in">${CONTROLS}</main><nav class="dk-tabbar" aria-label="Places"></nav>`,
            bodyClass: 'dk-tabbar-page',
        },
        {
            name: "a dialog beside an app's frame",
            body: `<div class="dk-app"><main class="dk-app-body"></main></div><dialog class="dk-dialog" open id="in">${CONTROLS}</dialog>`,
            bodyClass: '',
        },
    ]) {
        await writePage(page, { width: 1280, title: 'Round 3', body });
        if (bodyClass)
            await page.evaluate((added) => {
                document.body.classList.add(added);
            }, bodyClass);
        const drawn = await sizes(page, '#in');
        for (const kind of HELD) expect(drawn[kind]?.height, `${name}, ${kind}`).toBe(44);
        // A text button keeps no least width, and a tall button its larger target.
        expect(drawn['text']?.height, `${name}, text`).toBe(44);
        expect(drawn['text']?.width, `${name}, text`).toBeLessThan(44);
        // A quiet button keeps a button's least width, so a × alone is the target across.
        expect(drawn['quiet']?.width, `${name}, quiet`).toBe(44);
        expect(drawn['tall']?.height, `${name}, tall`).toBe(56);
    }
    // Outside an app, a wide screen keeps the field's height for its controls.
    await writePage(page, {
        width: 1280,
        title: 'Round 3',
        body: `<main id="in">${CONTROLS}</main>`,
    });
    const plain = await sizes(page, '#in');
    for (const kind of HELD) expect(plain[kind]?.height, kind).toBeLessThan(44);
    expect([plain['quiet']?.width, plain['quiet']?.height], 'quiet').toEqual([36, 36]);
});

test("leaves a demo's strip as it is on a page that ends in a tab bar", async ({ page }) => {
    const strip = `<header class="dk-strip" id="in"><button type="button" class="dk-button" data-kind="button">Tour</button><div class="dk-theme-switch" role="radiogroup" aria-label="Theme"><label class="dk-theme-switch-choice" data-kind="switch"><input type="radio" name="theme" checked><span>System</span></label></div></header>`;
    await writePage(page, { width: 1280, title: 'Round 3', body: `${strip}<main></main>` });
    const plain = await sizes(page, '#in');
    await page.evaluate(() => {
        document.body.classList.add('dk-tabbar-page');
    });
    expect(await sizes(page, '#in')).toEqual(plain);
});

test("draws the toast's close button at the target both ways on a wide screen, in a frame or not", async ({
    page,
}) => {
    const toast = `<div class="dk-toast" data-shown><p class="dk-toast-message" aria-hidden="true">Round saved.</p><p class="dk-visually-hidden dk-toast-status" role="status"></p><div class="dk-toast-buttons"><button type="button" class="dk-button dk-button-text dk-toast-action" hidden></button><button type="button" class="dk-button dk-button-text dk-button-quiet dk-toast-close"><span aria-hidden="true">×</span><span class="dk-visually-hidden">Close</span></button></div></div>`;
    // With its group of buttons, and as a toast written before the group drew it.
    const flat = toast
        .replace('<div class="dk-toast-buttons">', '')
        .replace('</div></div>', '</div>');
    for (const [kind, drawn] of [
        ['with the group', toast],
        ['without the group', flat],
    ] as const) {
        for (const [name, body] of [
            ['a page', `<main><h1>Round 3</h1></main>${drawn}`],
            [
                'a frame',
                `<div class="dk-app"><main class="dk-app-body"><h1>Round 3</h1></main><div class="dk-app-toast">${drawn}</div></div>`,
            ],
        ] as const) {
            await writePage(page, { width: 1280, title: 'Round 3', body });
            const close = await box(
                page.getByRole('button', { name: 'Close' }),
                'the close button'
            );
            expect([Math.round(close.width), Math.round(close.height)], `${name} ${kind}`).toEqual([
                44, 44,
            ]);
        }
    }
});

test('breaks a title of one long word inside the bar on a 320px phone at twice the text size', async ({
    page,
    browserName,
}) => {
    await open(page, { width: 320, title: 'Scorekeepingchampionshipfinalround' });
    await doubled(page, browserName);
    const bar = await box(page.locator('.dk-app-bar'), 'the bar');
    const title = await box(page.locator('.dk-app-title'), 'the title');
    expect(title.x + title.width).toBeLessThanOrEqual(bar.x + bar.width + 0.5);
    // Its word breaks inside it, rather than run past its own box.
    expect(await cutOff(page, '.dk-app-title')).toEqual([]);
    expect(await sideways(page)).toBe(0);
});

/** A frame whose body holds a raised panel and a plain one, or the same two on a plain page. */
const panels = (framed: boolean): string => {
    const two =
        '<div class="dk-panel dk-panel-raised"><p class="dk-panel-title">Flip 7, round 4</p><p>Ana is next to score.</p></div>' +
        '<div class="dk-panel"><p>A plain panel.</p></div>';
    return framed
        ? `<div class="dk-app"><header class="dk-app-bar"><h1 class="dk-app-title">Play</h1></header><main class="dk-app-body" id="main-content" tabindex="0">${two}</main></div>`
        : `<main id="main-content">${two}</main>`;
};

for (const theme of ['light', 'dark'] as const)
    test(`draws a raised panel on the raised ground, lifted by the resting shadow or the page's own, in the ${theme} theme`, async ({
        page,
        browserName,
    }) => {
        const raised = page.locator('.dk-panel-raised');
        const plain = page.locator('.dk-panel:not(.dk-panel-raised)');
        await writePage(page, { width: 390, theme, title: 'Play', body: panels(true) });
        expect((await style(raised, 'background-color'))['background-color']).toBe(
            await colorOf(page, 'var(--dk-raised)')
        );
        // The resting shadow lifts it with no shadow of the page's own, and a plain panel casts none.
        const resting = await shadowOf(page, 'var(--dk-shadow-resting)');
        expect(resting).not.toBe('none');
        expect((await style(raised, 'box-shadow'))['box-shadow']).toBe(resting);
        expect((await style(plain, 'box-shadow'))['box-shadow']).toBe('none');
        // Forced colors draw no shadow, where an engine draws them.
        if (browserName !== 'webkit') {
            await forceColors(page);
            expect((await style(raised, 'box-shadow'))['box-shadow']).toBe('none');
            await forceColors(page, false);
        }
        // A plain panel stays on the card ground.
        expect((await style(plain, 'background-color'))['background-color']).toBe(
            await colorOf(page, 'var(--dk-surface)')
        );

        await writePage(page, {
            width: 390,
            theme,
            css: ':root { --dk-panel-shadow: 0 2px 0 rgb(0 0 0 / 0.5); }',
            title: 'Play',
            body: panels(true),
        });
        expect((await style(raised, 'box-shadow'))['box-shadow']).toBe(
            await shadowOf(page, 'var(--dk-panel-shadow)')
        );
        expect((await style(plain, 'box-shadow'))['box-shadow']).toBe('none');
    });

test("pads a panel alike at every width in an app's frame, and by the page's width outside one", async ({
    page,
}) => {
    const panel = '<div class="dk-panel"><p>A panel.</p></div>';
    // Each place with how many panels it holds, so a panel left unfound fails rather than passes
    // unread.
    const places = {
        frame: [panels(true), 2],
        'tab bar page': [
            `<div class="dk-tabbar-page"><main id="main-content">${panel}</main><nav class="dk-tabbar" aria-label="Sections"><ul><li><a href="./">Play</a></li></ul></nav></div>`,
            1,
        ],
        'dialog over a frame': [
            `${panels(true)}<dialog class="dk-dialog" open aria-label="Options">${panel}</dialog>`,
            1,
        ],
        plain: [panels(false), 2],
        'dialog on a plain page': [
            `<main id="main-content"><p>A page.</p></main><dialog class="dk-dialog" open aria-label="Options">${panel}</dialog>`,
            1,
        ],
    } as const;
    for (const width of [320, 1280])
        for (const [name, [body, count]] of Object.entries(places)) {
            await writePage(page, { width, title: 'Play', body });
            const phone = name !== 'plain' && name !== 'dialog on a plain page';
            const scope = name.startsWith('dialog')
                ? page.locator('.dk-dialog .dk-panel')
                : page.locator('.dk-panel');
            await expect(scope, name).toHaveCount(count);
            for (const one of await scope.all())
                expect(
                    (await style(one, 'padding-left'))['padding-left'],
                    `${name} ${String(width)}`
                ).toBe(phone || width === 320 ? '16px' : '24px');
        }
});

test("pads the frame's bar, body, toast and dock by a phone's step on a 320px phone at twice the text size", async ({
    page,
    browserName,
}) => {
    await open(page, { width: 320, height: 900, toast: true });
    await doubled(page, browserName);
    for (const part of ['.dk-app-bar', '.dk-app-body', '.dk-app-toast', '.dk-app-dock']) {
        const sides = await style(page.locator(part), 'padding-left', 'padding-right');
        expect(sides, part).toEqual({ 'padding-left': '16px', 'padding-right': '16px' });
    }
});

test("pads the frame's sides by a phone's step at the default text size", async ({ page }) => {
    await open(page, { width: 390, toast: true });
    for (const part of ['.dk-app-bar', '.dk-app-body', '.dk-app-toast', '.dk-app-dock']) {
        const sides = await style(page.locator(part), 'padding-left', 'padding-right');
        expect(sides, part).toEqual({ 'padding-left': '16px', 'padding-right': '16px' });
    }
});

test("starts the skip link where the frame's words start, on a 320px phone at twice the text size", async ({
    page,
    browserName,
}) => {
    await writePage(page, {
        width: 320,
        height: 900,
        title: 'Round 3',
        body: `<a class="dk-skip" href="#main-content">Skip to content</a>${screen()}`,
    });
    await doubled(page, browserName);
    await page.locator('.dk-skip').focus();
    const skip = await box(page.locator('.dk-skip'));
    const words = await page
        .locator('.dk-app-body > p')
        .first()
        .evaluate((line) => {
            const range = document.createRange();
            range.selectNodeContents(line);
            return range.getBoundingClientRect().left;
        });
    expect(Math.round(skip.x)).toBe(Math.round(words));
});

test("keeps a panel in an app's frame to a phone's padding at twice the text size", async ({
    page,
    browserName,
}) => {
    await writePage(page, { width: 390, title: 'Play', body: panels(true) });
    await doubled(page, browserName);
    await expect(page.locator('.dk-panel')).toHaveCount(2);
    for (const panel of await page.locator('.dk-panel').all())
        expect((await style(panel, 'padding-left'))['padding-left']).toBe('16px');
});

test('keeps a pinned column and a code block apart from a raised panel on grounds of their own', async ({
    page,
}) => {
    await writePage(page, {
        width: 390,
        title: 'Play',
        body: '<main id="main-content"><div class="dk-panel dk-panel-raised"><div class="dk-table-scroll"><table class="dk-table dk-table-pinned"><tbody><tr><th scope="row">Ana</th><td>12</td></tr></tbody></table></div><pre class="dk-code"><code>npm run e2e</code></pre></div></main>',
    });
    const ground = async (selector: string) =>
        (await style(page.locator(selector), 'background-color'))['background-color'];
    expect(await ground('.dk-table-pinned th')).toBe('rgb(255, 255, 255)');
    expect(await ground('.dk-panel-raised .dk-code')).toBe('rgb(245, 245, 245)');
});

test('gives a piece the ground of the nearest container that holds it, however they nest', async ({
    page,
}) => {
    const pinned =
        '<div class="dk-table-scroll"><table class="dk-table dk-table-pinned"><tbody><tr><th scope="row">Ana</th><td>12</td></tr></tbody></table></div>';
    const code = '<pre class="dk-code"><code>npm run e2e</code></pre>';
    const tile =
        '<ul class="dk-rows dk-rows-tiles" role="list" aria-label="Games"><li><a class="dk-row" href="#flip"><span class="dk-row-text"><span class="dk-row-title">Flip 7</span></span></a></li></ul>';
    await writePage(page, {
        width: 390,
        title: 'Play',
        body:
            `<main id="main-content"><div class="dk-panel"><dialog class="dk-dialog" open aria-label="Options">${pinned}${code}${tile}</dialog></div>` +
            `<div class="dk-panel dk-panel-raised"><div class="dk-panel">${code}</div></div>` +
            `<section aria-label="Promo" style="--dk-bg: rgb(255, 250, 230); --dk-surface: rgb(250, 240, 210);">${pinned}${code}</section></main>`,
    });
    const ground = async (locator: Locator) =>
        (await style(locator, 'background-color'))['background-color'];
    // A dialog inside a panel gives its pinned cells its own raised ground, not the panel's.
    expect(await ground(page.locator('.dk-dialog .dk-table-pinned th'))).toBe(
        await colorOf(page, 'var(--dk-raised)')
    );
    // Its code block and its tile step to the card's, as in a dialog on the page, not the panel's.
    for (const piece of ['.dk-dialog .dk-code', '.dk-dialog .dk-row'])
        expect(await ground(page.locator(piece)), piece).toBe(
            await colorOf(page, 'var(--dk-surface)')
        );
    // A plain panel inside a raised one gives its code block the page's ground, a step off its own.
    expect(await ground(page.locator('.dk-panel-raised .dk-panel .dk-code'))).toBe(
        await colorOf(page, 'var(--dk-bg)')
    );
    // A palette a page sets on a container reaches the grounds its pieces take inside it.
    const promo = page.getByRole('region', { name: 'Promo' });
    expect(await ground(promo.locator('.dk-table-pinned th'))).toBe('rgb(255, 250, 230)');
    expect(await ground(promo.locator('.dk-code'))).toBe('rgb(250, 240, 210)');
});

test("draws a panel's title as a heading as it draws it as a paragraph, so either reads alike", async ({
    page,
}) => {
    const title = (tag: string, raised: string) =>
        `<div class="dk-panel${raised}"><${tag} class="dk-panel-title">Flip 7, round 4</${tag}><p>Ana is next to score.</p></div>`;
    for (const raised of ['', ' dk-panel-raised']) {
        await writePage(page, {
            width: 390,
            title: 'Play',
            body: `<main id="main-content"><h1>Play</h1>${title('p', raised)}${title('h2', raised)}</main>`,
        });
        const [asParagraph, asHeading] = await Promise.all(
            ['p', 'h2'].map((tag) =>
                style(
                    page.locator(`${tag}.dk-panel-title`),
                    'font-size',
                    'font-weight',
                    'line-height',
                    'margin-top',
                    'margin-bottom'
                )
            )
        );
        expect(asHeading, raised || 'plain').toEqual(asParagraph);
    }
});

/** A picture of an app's screen, a page that ends in a tab bar and a shown toast, as a page shows one. */
const PICTURE =
    `<div class="dk-picture" inert><div class="dk-app"><header class="dk-app-bar"><h1 class="dk-app-title">Round 3</h1></header>` +
    `<main class="dk-app-body" tabindex="0"><p>Ana leads.</p></main>` +
    `<div class="dk-app-toast"><div class="dk-toast" data-shown data-rows="3"><p class="dk-toast-message">Saved.</p></div></div></div>` +
    `<div class="dk-tabbar-page"><main><p>Games</p></main><nav class="dk-tabbar" aria-label="Sections"><ul><li><a href="#a">Play</a></li></ul></nav></div></div>`;

/** The same pictures with the class on each frame, the tab bar's page and a lone shown toast. */
const PICTURED_ITSELF =
    `<div class="dk-app dk-picture" inert><header class="dk-app-bar"><h1 class="dk-app-title">Round 3</h1></header>` +
    `<main class="dk-app-body" tabindex="0"><p>Ana leads.</p></main></div>` +
    `<div class="dk-tabbar-page dk-picture" inert><main><p>Games</p></main><nav class="dk-tabbar" aria-label="Sections"><ul><li><a href="#a">Play</a></li></ul></nav></div>` +
    `<div class="dk-toast dk-picture" inert data-shown data-rows="3"><p class="dk-toast-message">Saved.</p></div>`;

/** A dialog with an action, a field and a choice, each of which takes a phone's size in an app. */
const DIALOG =
    `<dialog class="dk-dialog" aria-labelledby="d-title"><h2 class="dk-dialog-title" id="d-title">Options</h2>` +
    `<div class="dk-field"><label class="dk-field-label" for="d-name">Name</label><input class="dk-input" id="d-name"></div>` +
    `<label class="dk-choice"><input type="checkbox"> Keep scores</label>` +
    `<div class="dk-dialog-actions"><button type="button" class="dk-button dk-button-accent">Save</button></div></dialog>`;

/** What the page draws that an app's frame of its own changes, read with the dialog open. */
const pageDrawn = async (page: Page, body: string) => {
    await writePage(page, { width: 1280, title: 'Pieces', body });
    await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
    return page.evaluate(() => {
        const read = (selector: string, ...names: string[]) => {
            const found = document.querySelector(selector);
            if (found === null) throw new Error(`no ${selector}`);
            const drawn = getComputedStyle(found);
            return names.map((name) => `${selector} ${name} ${drawn.getPropertyValue(name)}`);
        };
        return [
            ...read('.dk-strip', 'padding-left', 'padding-right'),
            ...read('body > main', 'padding-left', 'padding-right'),
            ...read('.dk-footer', 'padding-left', 'padding-bottom'),
            ...read('.dk-dialog', 'padding-left', 'padding-top'),
            ...read('.dk-dialog .dk-input', 'min-height'),
            ...read('.dk-dialog .dk-choice', 'min-height'),
            ...read('.dk-dialog-actions > .dk-button', 'min-height', 'flex-grow'),
            ...read('html', 'overscroll-behavior-y', 'scroll-padding-bottom'),
            ...read('body', 'padding-bottom'),
        ];
    });
};

/** A content page with a strip, a footer and a dialog, holding what `inside` adds to its content. */
const contentPage = (inside: string, after = '') =>
    `<div class="dk-strip"><nav class="dk-strip-links" aria-label="Portfolio"><a href="#home">Home</a></nav></div>` +
    `<main class="dk-page"><h1>Pieces</h1><p>Each piece in both themes.</p>${inside}</main>` +
    `<footer class="dk-footer"><p>A footer.</p></footer>${DIALOG}${after}`;

/** A toast shown on the page itself, as a content page's own. */
const LIVE_TOAST = `<div class="dk-toast" data-shown data-rows="3"><p class="dk-toast-message">Copied.</p></div>`;

test('draws a content page the same with a picture of an app and its toast as without one', async ({
    page,
}) => {
    const plain = await pageDrawn(page, contentPage(''));
    expect(await pageDrawn(page, contentPage(PICTURE))).toEqual(plain);
    expect(await pageDrawn(page, contentPage(PICTURED_ITSELF))).toEqual(plain);
    // A toast of the page's own keeps its room at the page's foot beside a picture, as without one.
    const toasted = await pageDrawn(page, contentPage('', LIVE_TOAST));
    expect(toasted).not.toEqual(plain);
    expect(await pageDrawn(page, contentPage(PICTURE, LIVE_TOAST))).toEqual(toasted);
    expect(await pageDrawn(page, contentPage(PICTURED_ITSELF, LIVE_TOAST))).toEqual(toasted);
    // A pictured toast sits in its place, as one in a frame does, rather than over the screen's foot.
    await pageDrawn(page, contentPage(PICTURED_ITSELF));
    await expect(page.locator('.dk-toast.dk-picture')).toHaveCSS('position', 'static');
    await pageDrawn(page, contentPage(PICTURE));
    await expect(page.locator('.dk-picture > .dk-app .dk-toast')).toHaveCSS('position', 'static');
});

test("draws a page with an app's frame of its own as an app's, a picture of another beside it or not", async ({
    page,
}) => {
    const own =
        `<div class="dk-app"><header class="dk-app-bar"><h1 class="dk-app-title">Play</h1></header>` +
        `<main class="dk-app-body" tabindex="0"><p>Pick a game.</p></main></div>`;
    const app = (inside: string) =>
        `<div class="dk-strip"><nav class="dk-strip-links" aria-label="Portfolio"><a href="#home">Home</a></nav></div>` +
        `${own}${inside}<footer class="dk-footer"><p>A footer.</p></footer>${DIALOG}`;
    const read = async (body: string) => {
        await writePage(page, { width: 1280, title: 'Play', body });
        await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
        return page.evaluate(() =>
            ['.dk-strip', '.dk-footer', '.dk-dialog'].map(
                (selector) =>
                    `${selector} ${getComputedStyle(document.querySelector(selector) ?? document.body).paddingLeft}`
            )
        );
    };
    const alone = await read(app(''));
    expect(await read(app(PICTURE))).toEqual(alone);
    expect(await read(app(PICTURED_ITSELF))).toEqual(alone);
    // The app's page draws apart from a content page, so the comparison above tests something.
    expect(alone).not.toEqual(await read(contentPage('')));
});

/** A picture of a frame with a bar, a body, a dock and a tab row, and of a page that ends in a tab bar. */
const PICTURED_SCREEN =
    `<div class="dk-picture" inert><div class="dk-app"><header class="dk-app-bar"><h1 class="dk-app-title">Round 3</h1></header>` +
    `<main class="dk-app-body" tabindex="0"><p>Ana leads.</p></main>` +
    `<section class="dk-app-dock" aria-label="Actions"><button type="button" class="dk-button dk-button-accent dk-button-tall">Save the round</button></section>` +
    `<nav class="dk-app-tabs dk-tabbar" aria-label="Sections"><ul><li><a href="#a" aria-current="page">Play</a></li><li><a href="#b">Games</a></li></ul></nav></div></div>` +
    `<div class="dk-tabbar-page dk-picture" inert><main><p>Games</p></main><nav class="dk-tabbar" aria-label="Places"><ul><li><a href="#a">Play</a></li></ul></nav></div>`;

test('gives a pictured frame drawn taller than what it holds the room in its body, its bars at its foot', async ({
    page,
}) => {
    await writePage(page, {
        width: 390,
        title: 'Pieces',
        css: '.dk-picture .dk-app { height: 40rem; }',
        body: contentPage(PICTURED_SCREEN),
    });
    const foot = await page.locator('.dk-picture .dk-app').evaluate((frame) => {
        const box = frame.getBoundingClientRect();
        const last = frame.lastElementChild?.getBoundingClientRect();
        if (!last) throw new Error('an empty frame');
        return box.bottom - parseFloat(getComputedStyle(frame).borderBottomWidth) - last.bottom;
    });
    expect(Math.abs(foot)).toBeLessThanOrEqual(1);
});

for (const [width, height] of [
    [390, 800],
    [1280, 500],
] as const)
    test(`draws a pictured frame and a pictured page that ends in a tab bar at what they hold, their bars in place and clear of no safe area, ${String(width)} by ${String(height)}`, async ({
        page,
    }) => {
        await writePage(page, {
            width,
            height,
            title: 'Pieces',
            css: `:root { --dk-safe-top: ${String(SAFE.top)}px; --dk-safe-right: ${String(SAFE.right)}px; --dk-safe-bottom: ${String(SAFE.bottom)}px; --dk-safe-left: ${String(SAFE.left)}px; }`,
            body: contentPage(PICTURED_SCREEN),
        });
        const drawn = await page.evaluate(() =>
            [...document.querySelectorAll('.dk-app, .dk-tabbar-page')].map((picture) => {
                const box = picture.getBoundingClientRect();
                // Each row it holds, the toast's place left out, which floats over the body.
                const held = [...picture.children]
                    .filter(
                        (child) =>
                            !child.matches('.dk-app-toast') &&
                            getComputedStyle(child).display !== 'none'
                    )
                    .reduce((sum, child) => sum + child.getBoundingClientRect().height, 0);
                const last = picture.lastElementChild;
                const bar = picture.querySelector(':scope > .dk-app-bar');
                // What a frame's body holds ends one padding above its foot, with no room left over
                // for lines a picture cannot scroll to. A tab bar's page spaces its own main.
                let bodyRoom = 0;
                if (picture.matches('.dk-app')) {
                    const body = picture.querySelector(':scope > .dk-app-body');
                    const words = body?.querySelector(
                        ':scope > :nth-last-child(1 of :not(.dk-visually-hidden, [hidden]))'
                    );
                    if (!body || !words) throw new Error('a pictured frame with no body to read');
                    bodyRoom =
                        body.getBoundingClientRect().bottom -
                        parseFloat(getComputedStyle(body).paddingBottom) -
                        words.getBoundingClientRect().bottom;
                }
                return {
                    kind: picture.className,
                    height: box.height,
                    held,
                    lastEnd: Math.round((last?.getBoundingClientRect().bottom ?? 0) - box.bottom),
                    lastPosition: last === null ? '' : getComputedStyle(last).position,
                    lastPad: last === null ? 0 : parseFloat(getComputedStyle(last).paddingBottom),
                    barPad: bar === null ? 0 : parseFloat(getComputedStyle(bar).paddingTop),
                    bodyRoom,
                };
            })
        );
        expect(drawn).toHaveLength(2);
        for (const picture of drawn) {
            const at = `${picture.kind}, ${String(width)} by ${String(height)}`;
            // As tall as what it holds, give or take its rows' gaps, and never the screen's height.
            expect(picture.height, at).toBeLessThan(height);
            expect(picture.height - picture.held, at).toBeGreaterThanOrEqual(-0.5);
            expect(picture.height - picture.held, at).toBeLessThan(32);
            // Its last row, the tab bar, ends at its foot, in its place rather than held to the
            // screen, with none of the room a phone keeps at its foot.
            expect(picture.lastEnd, at).toBe(0);
            expect(picture.lastPosition, at).toBe('static');
            expect(picture.lastPad, at).toBeLessThan(SAFE.bottom);
            expect(picture.barPad, at).toBeLessThan(SAFE.top);
            expect(Math.abs(picture.bodyRoom), at).toBeLessThanOrEqual(1);
        }
    });
