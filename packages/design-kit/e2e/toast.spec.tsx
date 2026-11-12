import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { Toast } from '../src/react.js';
import { box, colorOf, contrast, js, KIT, ORIGIN, sideways, style, tabKey } from './page.js';
import { textSize } from './text-size.js';

/*
 * A toast as a page attaches it, in Chromium and in WebKit: a message drawn and heard without
 * focus moving and with no element added, its action and its close button reached by the keyboard
 * and dismissing it, a toast with an action staying and one without leaving after its time, that
 * wait held while it is hovered or focused, on a stand-in clock, a second message replacing the
 * first and the same words heard again, focus returned to where it was, a long message wrapping
 * with its action in reach, its place above an app's dock or at the foot of a page, nothing drawn
 * before a message, and no audit findings in either theme.
 */

const TOAST = renderToStaticMarkup(<Toast />);

const LINES = Array.from(
    { length: 30 },
    (_, index) => `<p>Round ${String(index + 1)} of the game so far.</p>`
).join('');

const PAGE = `<main><h1>Scores</h1><button type="button" class="dk-button" id="save">Save</button>
${LINES}<p id="last">The last line.</p></main>${TOAST}`;

const FRAME = `<div class="dk-app">
<header class="dk-app-bar"><h1 class="dk-app-title">Round 3</h1></header>
<main class="dk-app-body" tabindex="0">${LINES}<p id="last">The last line.</p></main>
<div class="dk-app-toast">${TOAST}</div>
<section class="dk-app-dock" aria-label="Actions"><button type="button" class="dk-button dk-button-accent dk-button-tall" id="save">Save the round</button></section>
</div>`;

// A screen as full as an app's gets: a long title, a dock of two and a tab bar, so at twice
// the text size the body is at its least and a row for the toast would push the dock down.
const FULL = FRAME.replace('Round 3</h1>', 'Round 3 of the game at the cabin</h1>').replace(
    '</section>',
    '<button type="button" class="dk-button dk-button-tall">Skip a player</button></section>' +
        '<nav class="dk-app-tabs dk-tabbar" aria-label="Sections"><ul>' +
        '<li><a href="#play" aria-current="page">Play</a></li><li><a href="#games">Games</a></li>' +
        '</ul></nav>'
);

const ATTACH = `import { attachToast } from './controls.js';
const kit = (window.kit = { done: [], last: undefined });
kit.show = attachToast(document.querySelector('.dk-toast'));
kit.again = attachToast(document.querySelector('.dk-toast'));
document.querySelector('#save').addEventListener('click', () => {
    kit.last = kit.show('Round 3 saved.', { label: 'Undo', onAction: () => kit.done.push('Undo') });
});`;

/** The page given, on the test origin, attached unless asked not to be, at the size given. */
const open = async (
    page: Page,
    {
        body = PAGE,
        width = 390,
        height = 700,
        theme = 'light',
        css = '',
        attach = true,
        clock = false,
    }: {
        readonly body?: string;
        readonly width?: number;
        readonly height?: number;
        readonly theme?: 'light' | 'dark';
        readonly css?: string;
        readonly attach?: boolean;
        readonly clock?: boolean;
    } = {}
): Promise<void> => {
    const files: Readonly<Record<string, readonly [string, string]>> = {
        '/kit.css': [`${KIT}${css}`, 'text/css'],
        '/controls.js': [js('controls.ts'), 'text/javascript'],
        '/theme.js': [js('theme.ts'), 'text/javascript'],
        '/page.js': [ATTACH, 'text/javascript'],
    };
    await page.route(`${ORIGIN}/**`, (route) => {
        const path = new URL(route.request().url()).pathname;
        const [served, contentType] = files[path] ?? [
            `<!doctype html><html lang="en" data-theme="${theme}"><head><title>Scores</title>` +
                `<link rel="stylesheet" href="/kit.css"></head><body>${body}` +
                (attach ? '<script type="module" src="/page.js"></script>' : '') +
                '</body></html>',
            'text/html',
        ];
        return route.fulfill({ body: served, contentType });
    });
    if (clock) await page.clock.install();
    await page.setViewportSize({ width, height });
    await page.goto(`${ORIGIN}/`);
    if (attach) await page.waitForFunction(() => 'kit' in window);
};

/** Shows a message from the page's script, with an action of the words given or none. */
const show = (page: Page, words: string, action?: string): Promise<void> =>
    page.evaluate(
        ([message, label]) => {
            const kit = (window as unknown as { kit: Kit }).kit;
            kit.last = kit.show(
                message,
                label === undefined
                    ? undefined
                    : {
                          label,
                          onAction: () => {
                              kit.done.push(label);
                          },
                      }
            );
        },
        [words, action] as const
    );

interface Kit {
    done: string[];
    last: (() => void) | undefined;
    show: (message: string, action?: { label: string; onAction: () => void }) => () => void;
    again: Kit['show'];
}

const toast = (page: Page): Locator => page.locator('.dk-toast');

/** Waits for the toast's entrance to end, so it is measured, and audited, where it comes to rest. */
const settle = (page: Page): Promise<unknown> =>
    toast(page).evaluate((element) =>
        Promise.all(element.getAnimations().map((animation) => animation.finished))
    );
const message = (page: Page): Locator => page.locator('.dk-toast-message');
const said = (page: Page): Locator => page.getByRole('status');
const undo = (page: Page): Locator => page.getByRole('button', { name: 'Undo' });
const dismiss = (page: Page): Locator => page.getByRole('button', { name: 'Dismiss' });

/** How many elements the page holds. */
const elements = (page: Page): Promise<number> =>
    page.evaluate(() => document.getElementsByTagName('*').length);

/** Where a drawn element ends, down the page. */
const bottom = (drawn: { y: number; height: number }): number => drawn.y + drawn.height;

test('draws nothing before a message, with or without script', async ({ page }) => {
    for (const attach of [false, true]) {
        await open(page, { attach });
        expect((await toast(page).boundingBox())?.height ?? 0, `attached: ${String(attach)}`).toBe(
            0
        );
        await expect(undo(page)).toBeHidden();
        await expect(dismiss(page)).toBeHidden();
    }
});

test('draws a message and says it politely, without moving focus or adding an element', async ({
    page,
}) => {
    await open(page);
    await page.locator('#save').focus();
    const before = await elements(page);
    // The status line is in the page from the start, and says the message with its action.
    await expect(said(page)).toHaveCount(1);
    await expect(said(page)).toHaveText('');
    await page.keyboard.press('Enter');
    await expect(message(page)).toHaveText('Round 3 saved.');
    await expect(said(page)).toHaveText('Round 3 saved. Undo is available.');
    await expect(toast(page)).toBeVisible();
    await expect(page.locator('#save')).toBeFocused();
    expect(await elements(page)).toBe(before);
    await expect(undo(page)).toBeVisible();
    await expect(dismiss(page)).toBeVisible();
});

test('reaches the action by the keyboard, and choosing it runs it and dismisses the toast', async ({
    page,
    browserName,
}) => {
    await open(page);
    await page.locator('#save').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press(tabKey(browserName));
    await expect(undo(page)).toBeFocused();
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => (window as unknown as { kit: Kit }).kit.done)).toEqual([
        'Undo',
    ]);
    await expect(message(page)).toHaveText('');
    await expect(undo(page)).toBeHidden();
    // Focus was in the toast as it left, so it goes back to where it was.
    await expect(page.locator('#save')).toBeFocused();
});

test('dismisses by its named close button, and by Escape, with focus back where it was', async ({
    page,
    browserName,
}) => {
    await open(page);
    await page.locator('#save').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press(tabKey(browserName));
    await page.keyboard.press(tabKey(browserName));
    await expect(dismiss(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(toast(page)).not.toHaveClass(/dk-toast-shown/);
    await expect(page.locator('#save')).toBeFocused();

    await page.keyboard.press('Enter');
    await page.keyboard.press(tabKey(browserName));
    await page.keyboard.press('Escape');
    await expect(message(page)).toHaveText('');
    await expect(page.locator('#save')).toBeFocused();
    expect(await page.evaluate(() => (window as unknown as { kit: Kit }).kit.done)).toEqual([]);
});

test('keeps a toast with an action until dismissed, and lets one without leave after its time', async ({
    page,
}) => {
    await open(page, { clock: true });
    await show(page, 'Round 3 saved.', 'Undo');
    await page.clock.runFor(60_000);
    await expect(message(page)).toHaveText('Round 3 saved.');

    await show(page, 'Players saved.');
    await page.clock.runFor(4_900);
    await expect(message(page)).toHaveText('Players saved.');
    await page.clock.runFor(200);
    await expect(message(page)).toHaveText('');
    await expect(dismiss(page)).toBeHidden();
});

test('holds the wait while the toast is hovered or has focus, and starts it again after', async ({
    page,
}) => {
    await open(page, { clock: true });
    await show(page, 'Players saved.');
    await toast(page).hover();
    await page.clock.runFor(20_000);
    await expect(message(page)).toHaveText('Players saved.');
    await page.mouse.move(0, 0);
    await page.clock.runFor(5_100);
    await expect(message(page)).toHaveText('');

    await show(page, 'Players saved.');
    await dismiss(page).focus();
    await page.clock.runFor(20_000);
    await expect(message(page)).toHaveText('Players saved.');
    await page.locator('#save').focus();
    await page.clock.runFor(5_100);
    await expect(message(page)).toHaveText('');
});

test('replaces one message with the next, and says the same words again', async ({ page }) => {
    await open(page, { clock: true });
    await page.evaluate(() => {
        const heard: string[] = [];
        (window as unknown as { heard: string[] }).heard = heard;
        const line = document.querySelector('[role="status"]');
        if (!line) return;
        new MutationObserver(() => {
            if (line.textContent) heard.push(line.textContent);
        }).observe(line, { childList: true, characterData: true, subtree: true });
    });
    for (const [words, action] of [
        ['Round 3 saved.', 'Undo'],
        ['Round 4 saved.', 'Undo'],
        ['Round 4 saved.', 'Undo'],
        ['Players saved.', undefined],
    ] as const) {
        await show(page, words, action);
        await expect(message(page)).toHaveText(words);
        await page.clock.runFor(200);
    }
    expect(await page.evaluate(() => (window as unknown as { heard: string[] }).heard)).toEqual([
        'Round 3 saved. Undo is available.',
        'Round 4 saved. Undo is available.',
        'Round 4 saved. Undo is available.',
        'Players saved.',
    ]);
});

test('dismisses only its own message, by what showing it returned', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
        const kit = (window as unknown as { kit: Kit }).kit;
        // A message replaced, and a message dismissed before the next, each leave the next alone.
        const replaced = kit.again('Round 5 saved.');
        kit.show('Round 6 saved.');
        replaced();
        const gone = kit.show('Round 7 saved.');
        gone();
        kit.show('Round 8 saved.');
        gone();
    });
    await expect(message(page)).toHaveText('Round 8 saved.');
});

test('holds a toast that appears under a pointer resting where the last one was', async ({
    page,
}) => {
    await open(page, { clock: true });
    await show(page, 'Round 3 saved.', 'Undo');
    await undo(page).hover();
    await page.evaluate(() => {
        const kit = (window as unknown as { kit: Kit }).kit;
        document.querySelector<HTMLButtonElement>('.dk-toast-action')?.click();
        kit.show('Round 3 restored.');
    });
    await page.clock.runFor(20_000);
    await expect(message(page)).toHaveText('Round 3 restored.');
});

test('rises into place each time it is shown', async ({ page }) => {
    await open(page);
    for (const words of ['Round 3 saved.', 'Round 4 saved.']) {
        await show(page, words, 'Undo');
        expect(
            await toast(page).evaluate((element) =>
                element
                    .getAnimations()
                    .map((animation) => (animation as CSSAnimation).animationName)
            )
        ).toEqual(['dk-toast-rise']);
        await page.locator('.dk-toast-close').click();
    }
});

test('moves focus off an action the next message does not have', async ({ page, browserName }) => {
    await open(page);
    await page.locator('#save').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press(tabKey(browserName));
    await expect(undo(page)).toBeFocused();
    await show(page, 'Players saved.');
    await expect(undo(page)).toBeHidden();
    await expect(dismiss(page)).toBeFocused();
});

test('wraps a message of three lines inside the toast, with its action still in reach', async ({
    page,
}) => {
    await open(page, { width: 320 });
    await show(
        page,
        'Round 3 saved. Ana leads with 142, Ben is at 128, and the game ends at 200 points, so two more rounds may settle it.',
        'Undo'
    );
    await settle(page);
    const card = await box(toast(page), 'the toast');
    const words = await box(message(page), 'the message');
    expect(words.height).toBeGreaterThan(60);
    expect(bottom(words)).toBeLessThanOrEqual(bottom(card));
    for (const button of [undo(page), dismiss(page)]) {
        const drawn = await box(button, 'a button');
        expect(drawn.x).toBeGreaterThanOrEqual(card.x);
        expect(drawn.x + drawn.width).toBeLessThanOrEqual(card.x + card.width);
        expect(bottom(drawn)).toBeLessThanOrEqual(bottom(card));
        expect(drawn.height).toBeGreaterThanOrEqual(24);
    }
    expect(await sideways(page)).toBe(0);
});

test("sits in an app's frame above the dock, its action one step back from the dock's button", async ({
    page,
    browserName,
}) => {
    await open(page, { body: FRAME });
    await show(page, 'Round 3 saved.', 'Undo');
    await settle(page);
    await page.locator('.dk-app-body').evaluate((element) => {
        element.scrollTop = element.scrollHeight;
    });
    const card = await box(toast(page), 'the toast');
    expect(bottom(card)).toBeLessThanOrEqual(
        (await box(page.locator('.dk-app-dock'), 'the dock')).y
    );
    expect(bottom(await box(page.locator('#last'), 'the last line'))).toBeLessThanOrEqual(card.y);
    // A keyboard on the dock's button reaches the toast's action, and its way back, one step back.
    await page.locator('#save').focus();
    await page.keyboard.press(`Shift+${tabKey(browserName)}`);
    await expect(dismiss(page)).toBeFocused();
    await page.keyboard.press(`Shift+${tabKey(browserName)}`);
    await expect(undo(page)).toBeFocused();
});

test("never moves the frame's dock under the thumb as it shows and leaves, at the usual and at twice the text size", async ({
    page,
    browserName,
}) => {
    for (const scale of browserName === 'chromium' ? [1, 2] : [1]) {
        // At twice the text size the body cannot hold the toast, which takes its row above the dock,
        // and the page scrolls by as much as the dock would have moved.
        await open(page, { body: FULL, height: 844 });
        if (scale === 2) await textSize(page, 2);
        const save = page.locator('#save');
        const before = await box(save, "the dock's button");
        await show(page, 'Round 3 saved.', 'Undo');
        await settle(page);
        expect(await box(save, "the dock's button"), `at ${String(scale)}x, shown`).toEqual(before);
        await dismiss(page).click();
        expect(await box(save, "the dock's button"), `at ${String(scale)}x, gone`).toEqual(before);
    }
});

test("keeps what the keyboard reaches in the frame's body clear of the toast and the bar where the body is near its least height", async ({
    page,
    browserName,
}) => {
    // A phone on its side at the usual text size, and one upright at twice it, where the body is
    // near its least height.
    for (const [width, height, scale] of browserName === 'chromium'
        ? ([
              [844, 400, 1],
              [390, 844, 2],
          ] as const)
        : ([[844, 400, 1]] as const)) {
        await open(page, { body: FULL, width, height });
        if (scale === 2) await textSize(page, 2);
        await page.locator('.dk-app-body').evaluate((element) => {
            const line = document.createElement('p');
            const link = document.createElement('a');
            link.href = '#mid';
            link.id = 'mid';
            link.textContent = 'A round in the middle';
            line.append(link);
            element.children[Math.floor(element.children.length / 2)]?.after(line);
        });
        await show(page, 'Round 3 saved.', 'Undo');
        await settle(page);
        const where = `${String(width)} by ${String(height)} at ${String(scale)}x`;
        await page.locator('#mid').focus();
        const link = await box(page.locator('#mid'), 'the link');
        const body = await box(page.locator('.dk-app-body'), 'the body');
        const card = await box(toast(page), 'the toast');
        expect(link.y, where).toBeGreaterThanOrEqual(body.y - 1);
        expect(bottom(link), where).toBeLessThanOrEqual(Math.min(bottom(body), card.y) + 1);
    }
});

test("keeps the frame's dock in place on a phone on its side at a large text size, where the page scrolls whole", async ({
    page,
    browserName,
}) => {
    test.skip(
        browserName !== 'chromium',
        'the text size is set through Chromium, and Safari keeps no scroll position this way'
    );
    await open(page, { body: FRAME, width: 844, height: 390 });
    await textSize(page, 1.5);
    // Scrolled to the end, with the dock's button in view, where a thumb has just pressed it.
    await page.evaluate(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
    });
    const before = await page
        .locator('#save')
        .evaluate((element) => element.getBoundingClientRect().top);
    await show(page, 'Round 3 saved.', 'Undo');
    await settle(page);
    expect(
        await page.locator('#save').evaluate((element) => element.getBoundingClientRect().top)
    ).toBeCloseTo(before, 0);
    await dismiss(page).click();
    expect(
        await page.locator('#save').evaluate((element) => element.getBoundingClientRect().top)
    ).toBeCloseTo(before, 0);
});

test("stops what the keyboard reaches in the frame's body short of a toast floating over it", async ({
    page,
    browserName,
}) => {
    for (const scale of browserName === 'chromium' ? [1, 2] : [1]) {
        await open(page, { body: FULL, height: 844 });
        if (scale === 2) await textSize(page, 2);
        await page.locator('.dk-app-body').evaluate((element) => {
            // A paragraph with a link in it, as a body holds.
            const line = document.createElement('p');
            const link = document.createElement('a');
            link.href = '#end';
            link.id = 'end';
            link.textContent = 'The end of the round';
            line.append(link);
            // In the middle of the body, out of sight below its fold, as most of what it holds is.
            element.children[Math.floor(element.children.length / 2)]?.after(line);
        });
        await show(page, 'Round 3 saved.', 'Undo');
        await settle(page);
        // The body scrolled so the link sits at its foot, under the toast, then reached by the
        // keyboard from the body itself, as a visitor tabbing on through the screen reaches it.
        await page.locator('.dk-app-body').evaluate((element) => {
            const link = element.querySelector('#end');
            if (!link) return;
            element.scrollTop +=
                link.getBoundingClientRect().bottom - element.getBoundingClientRect().bottom;
            element.focus({ preventScroll: true });
        });
        await page.keyboard.press(tabKey(browserName));
        await expect(page.locator('#end')).toBeFocused();
        const card = await box(toast(page), 'the toast');
        expect(
            bottom(await box(page.locator('#end'), 'the link')),
            `at ${String(scale)}x`
        ).toBeLessThanOrEqual(card.y);
    }
});

test("sends focus to the frame's body when its action is chosen and nothing had focus before", async ({
    page,
}) => {
    await open(page, { body: FRAME });
    // Shown as the page loads, with nothing holding focus, then reached by the keyboard.
    await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
    });
    await show(page, 'Round 3 saved.', 'Undo');
    await settle(page);
    await undo(page).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.dk-app-body')).toBeFocused();
});

test("sends focus to the frame's body, not to an earlier message's control, when the latest arrived with nothing focused", async ({
    page,
}) => {
    await open(page, { body: FRAME });
    await page.locator('#save').focus();
    await show(page, 'Round 3 saved.', 'Undo');
    await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
    });
    await show(page, 'Round 4 saved.', 'Undo');
    await settle(page);
    await undo(page).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.dk-app-body')).toBeFocused();
});

test("sends focus to the frame's body where what it would go back to no longer takes focus", async ({
    page,
}) => {
    await open(page, { body: FRAME });
    await page.locator('#save').focus();
    await show(page, 'Round 3 saved.', 'Undo');
    await settle(page);
    await undo(page).focus();
    // The action hides what focus came from rather than taking it from the page.
    await page.locator('#save').evaluate((element) => {
        (element as HTMLElement).hidden = true;
    });
    await page.keyboard.press('Enter');
    await expect(page.locator('.dk-app-body')).toBeFocused();
});

test("sends focus to the page's main content when its action is chosen and nothing had focus before", async ({
    page,
}) => {
    await open(page, { body: PAGE.replace('<main>', '<main tabindex="-1">') });
    await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
    });
    await show(page, 'Round 3 saved.', 'Undo');
    await settle(page);
    await undo(page).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
});

test('leaves the page where it is when what has focus is not under the toast or is taller than the room above it', async ({
    page,
}) => {
    await open(page, { body: PAGE.replace('<main>', '<main tabindex="-1">') });
    // The page's main content holds focus, as a click on its text gives it, scrolled part way.
    await page.locator('main').evaluate((element) => {
        window.scrollTo(0, 120);
        (element as HTMLElement).focus({ preventScroll: true });
    });
    await show(page, 'Round 3 saved.', 'Undo');
    await settle(page);
    expect(await page.evaluate(() => window.scrollY)).toBe(120);
});

test('keeps what had focus in view, clear of the toast, as it shows on a page', async ({
    page,
}) => {
    await open(page, {
        body: PAGE.replace(
            '<p id="last">',
            '<p><a href="#more" id="foot">More rounds</a></p><p id="last">'
        ),
    });
    // The link at the foot of the screen, where the toast is about to come, holding focus.
    await page.locator('#foot').evaluate((element) => {
        window.scrollBy(0, element.getBoundingClientRect().bottom - window.innerHeight);
        element.focus({ preventScroll: true });
    });
    await show(page, 'Round 3 saved.', 'Undo');
    await settle(page);
    expect(bottom(await box(page.locator('#foot'), 'the link'))).toBeLessThanOrEqual(
        (await box(toast(page), 'the toast')).y + 1
    );
});

test('puts its buttons together on a row under its message on a phone at a large text size', async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    for (const [width, scale] of [
        [390, 1.5],
        [390, 2],
        [320, 2],
    ] as const) {
        await open(page, { width });
        await textSize(page, scale);
        await show(page, 'Round 3 saved.', 'Undo');
        await settle(page);
        const where = `${String(width)}px at ${String(scale)}x`;
        const message = await box(toast(page).locator('.dk-toast-message'), 'the message');
        const action = await box(undo(page), 'the action');
        const close = await box(dismiss(page), 'the close button');
        // Under the message, the action before the close button on one row at its end, or where
        // a face too wide leaves no room for both, each at the end of a row of its own.
        expect(action.y, where).toBeGreaterThanOrEqual(message.y + message.height - 1);
        const card = await box(toast(page), 'the toast');
        const end = card.x + card.width;
        expect(end - (close.x + close.width), where).toBeLessThan(16);
        if (Math.abs(close.y - action.y) <= 1) {
            expect(close.x, where).toBeGreaterThan(action.x + action.width - 1);
        } else {
            expect(close.y, where).toBeGreaterThan(action.y);
            expect(end - (action.x + action.width), where).toBeLessThan(16);
        }
    }
});

test('sits at the foot of a page clear of the home indicator, in the app column', async ({
    page,
}) => {
    await open(page, { css: ':root { --dk-safe-bottom: 34px; }' });
    await show(page, 'Round 3 saved.', 'Undo');
    await settle(page);
    const card = await box(toast(page), 'the toast');
    expect(bottom(card)).toBe(700 - 34 - 16);
    expect(card.x).toBe(16);
    expect(card.width).toBe(390 - 32);

    // A phone on its side, clear of the notch at either side.
    await open(page, {
        width: 844,
        height: 390,
        css: ':root { --dk-safe-left: 47px; --dk-safe-right: 47px; }',
    });
    await show(page, 'Round 3 saved.', 'Undo');
    await settle(page);
    const side = await box(toast(page), 'the toast');
    expect(side.x).toBeGreaterThanOrEqual(47 + 16);
    expect(side.x + side.width).toBeLessThanOrEqual(844 - 47 - 16);

    await open(page, { width: 1280, height: 700 });
    await show(page, 'Round 3 saved.', 'Undo');
    await settle(page);
    const wide = await box(toast(page), 'the toast');
    expect(wide.width).toBe(448 - 32);
    expect(wide.x).toBe((1280 - wide.width) / 2);
});

for (const width of [390, 320]) {
    test(`keeps what the keyboard reaches, and the end of the page, clear of the toast on a page ${String(width)}px wide`, async ({
        page,
        browserName,
    }) => {
        await open(page, {
            width,
            body: PAGE.replace(
                '<p id="last">',
                '<p><a href="#earlier" id="above">Earlier rounds</a></p>' +
                    '<p><a href="#more" id="foot">More rounds</a></p><p id="last">'
            ),
        });
        await show(page, 'Round 3 saved.', 'Undo');
        await settle(page);
        const card = await box(toast(page), 'the toast');
        // The link scrolled to the foot of the screen, under the toast, then reached by the keyboard.
        await page.locator('#foot').evaluate((element) => {
            window.scrollBy(0, element.getBoundingClientRect().bottom - window.innerHeight);
        });
        expect(bottom(await box(page.locator('#foot'), 'the link'))).toBeGreaterThan(card.y);
        await page.locator('#above').evaluate((element) => {
            element.focus({ preventScroll: true });
        });
        await page.keyboard.press(tabKey(browserName));
        await expect(page.locator('#foot')).toBeFocused();
        expect(bottom(await box(page.locator('#foot'), 'the link'))).toBeLessThanOrEqual(card.y);
        await page.evaluate(() => {
            window.scrollTo(0, document.documentElement.scrollHeight);
        });
        expect(bottom(await box(page.locator('#last'), 'the last line'))).toBeLessThanOrEqual(
            card.y
        );
    });
}

test('keeps room on a page for a toast whose buttons wrap under its message at twice the text size', async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    // The message of one word fits one line in any face, and the page's own rule puts the buttons
    // under it, as a longer message does on a phone, so the toast is the two rows the room is for.
    await open(page, { width: 390, css: '.dk-toast-message { flex-basis: 100%; }' });
    await textSize(page, 2);
    await show(page, 'Saved.', 'Undo');
    await settle(page);
    const card = await box(toast(page), 'the toast');
    const action = await box(page.getByRole('button', { name: 'Undo' }), 'the action');
    // The buttons sit under the message, so the toast is two rows tall.
    const message = await box(toast(page).locator('.dk-toast-message'), 'the message');
    expect(action.y).toBeGreaterThanOrEqual(message.y + message.height - 1);
    const kept = await page.evaluate(() =>
        parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom)
    );
    expect(kept).toBeGreaterThanOrEqual(
        (await page.evaluate(() => window.innerHeight)) - card.y - 1
    );
});

test('keeps room on a page for a toast of as many rows as it takes, measured as it shows', async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    await open(page, { width: 390 });
    await textSize(page, 2);
    // A message that wraps, in any face, over its buttons.
    await show(page, 'Round 3 is saved for every player at the table tonight.', 'Undo');
    await settle(page);
    const card = await box(toast(page), 'the toast');
    const rows = Number(await toast(page).getAttribute('data-rows'));
    expect(rows).toBeGreaterThanOrEqual(3);
    const covered = (await page.evaluate(() => window.innerHeight)) - card.y - 1;
    const kept = await page.evaluate(() =>
        parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom)
    );
    expect(kept).toBeGreaterThanOrEqual(covered);
    // The page's end scrolls clear of it too.
    await page.evaluate(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
    });
    expect(bottom(await box(page.locator('#last'), 'the last line'))).toBeLessThanOrEqual(
        (await box(toast(page), 'the toast')).y + 1
    );
    await dismiss(page).click();
    await expect(toast(page)).not.toHaveAttribute('data-rows');
});

test('measures its room again when the text size changes while it is shown', async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    await open(page, { width: 390 });
    await show(page, 'Round 3 is saved for every player at the table tonight.', 'Undo');
    await settle(page);
    const before = Number(await toast(page).getAttribute('data-rows'));
    await textSize(page, 2);
    await expect
        .poll(async () => Number(await toast(page).getAttribute('data-rows')))
        .toBeGreaterThan(before);
});

for (const theme of ['light', 'dark'] as const) {
    test(`has no audit findings in the ${theme} theme, shown and not`, async ({ page }) => {
        await open(page, { theme });
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        await show(page, 'Round 3 saved.', 'Undo');
        await settle(page);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });
}

test('draws its close button quiet in the muted color, and in the text color under a pointer', async ({
    page,
}) => {
    for (const theme of ['light', 'dark'] as const) {
        await open(page, { theme });
        await page.locator('#save').click();
        await expect(dismiss(page)).toBeVisible();
        const read = async () => (await style(dismiss(page), 'color'))['color'] ?? '';
        const ground = (await style(toast(page), 'background-color'))['background-color'] ?? '';
        const text = (await style(page.locator('body'), 'color'))['color'];
        const muted = await colorOf(page, 'var(--dk-muted)');
        const quiet = await read();
        expect(quiet, theme).toBe(muted);
        expect(contrast(quiet, ground), theme).toBeGreaterThanOrEqual(4.5);
        await dismiss(page).hover();
        await expect.poll(read, { message: theme }).toBe(text);
        expect(contrast(await read(), ground), theme).toBeGreaterThanOrEqual(4.5);
    }
});

test('returns the one function it showed with when attached again', async ({ page }) => {
    await open(page);
    expect(
        await page.evaluate(() => {
            const kit = (window as unknown as { kit: { show: unknown; again: unknown } }).kit;
            return kit.show === kit.again;
        })
    ).toBe(true);
});

test('draws a solid edge round a shown toast in forced colors, where its shadow is gone', async ({
    browser,
    browserName,
}) => {
    test.skip(browserName === 'webkit', 'WebKit has no forced colors to draw');
    const context = await browser.newContext({ forcedColors: 'active' });
    try {
        const page = await context.newPage();
        await open(page);
        await page.locator('#save').click();
        await expect(toast(page)).toBeVisible();
        const edge = await toast(page).evaluate((element) => {
            const style = getComputedStyle(element);
            return [style.borderTopStyle, style.borderTopWidth];
        });
        expect(edge).toEqual(['solid', '1px']);
    } finally {
        await context.close();
    }
});

test('prints no toast, shown or not', async ({ page }) => {
    await open(page);
    await page.locator('#save').click();
    await expect(toast(page)).toBeVisible();
    await page.emulateMedia({ media: 'print' });
    await expect(toast(page)).toBeHidden();
});

test('keeps its buttons inside it on a 320px phone at twice the text size', async ({ page }) => {
    await open(page, { width: 320 });
    await textSize(page, 2);
    await page.locator('#save').click();
    const card = await box(toast(page), 'the toast');
    for (const button of [undo(page), dismiss(page)]) {
        const drawn = await box(button, 'a button');
        expect(drawn.x).toBeGreaterThanOrEqual(card.x - 0.5);
        expect(drawn.x + drawn.width).toBeLessThanOrEqual(card.x + card.width + 0.5);
        expect(drawn.y + drawn.height).toBeLessThanOrEqual(card.y + card.height + 0.5);
    }
    expect(await sideways(page)).toBe(0);
});
