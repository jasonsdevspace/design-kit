import { readFileSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

import { Toast } from '../src/react.js';
import { box, KIT, sideways } from './page.js';

/*
 * A toast as a page attaches it, in Chromium and in WebKit: a message drawn and heard without
 * focus moving and with no element added, its action and its close button reached by the keyboard
 * and dismissing it, a toast with an action staying and one without leaving after its time, that
 * wait held while it is hovered or focused, on a stand-in clock, a second message replacing the
 * first and the same words heard again, focus returned to where it was, a long message wrapping
 * with its action in reach, its place above an app's dock or at the foot of a page, nothing drawn
 * before a message, and no audit findings in either theme.
 */

const ORIGIN = 'https://kit.test';

const js = (file: string) =>
    ts.transpileModule(readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
    }).outputText;

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
const message = (page: Page): Locator => page.getByRole('status');
const undo = (page: Page): Locator => page.getByRole('button', { name: 'Undo' });
const dismiss = (page: Page): Locator => page.getByRole('button', { name: 'Dismiss' });

/** How many elements the page holds. */
const elements = (page: Page): Promise<number> =>
    page.evaluate(() => document.getElementsByTagName('*').length);

/** Where a drawn element ends, down the page. */
const bottom = (drawn: { y: number; height: number }): number => drawn.y + drawn.height;

/** The Tab key, which Safari on a Mac keeps for fields unless Option is held. */
const tabKey = (browserName: string): string =>
    browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';

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
    // The region is in the page from the start, polite, and the message is its text.
    await expect(message(page)).toHaveCount(1);
    await expect(message(page)).toHaveText('');
    await page.keyboard.press('Enter');
    await expect(message(page)).toHaveText('Round 3 saved.');
    await expect(toast(page)).toBeVisible();
    await expect(page.locator('#save')).toBeFocused();
    expect(await elements(page)).toBe(before);
    // The action and the close button are named, and outside what the region says.
    await expect(undo(page)).toBeVisible();
    await expect(dismiss(page)).toBeVisible();
    await expect(message(page)).not.toContainText('Undo');
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
        const said: string[] = [];
        (window as unknown as { said: string[] }).said = said;
        const region = document.querySelector('[role="status"]');
        if (!region) return;
        new MutationObserver(() => {
            said.push(region.textContent);
        }).observe(region, { childList: true, characterData: true, subtree: true });
    });
    await show(page, 'Round 3 saved.', 'Undo');
    await show(page, 'Round 4 saved.', 'Undo');
    await expect(message(page)).toHaveText('Round 4 saved.');
    await show(page, 'Round 4 saved.', 'Undo');
    await page.clock.runFor(200);
    await expect(message(page)).toHaveText('Round 4 saved.');
    expect(await page.evaluate(() => (window as unknown as { said: string[] }).said)).toEqual([
        'Round 3 saved.',
        'Round 4 saved.',
        '',
        'Round 4 saved.',
    ]);
    // What dismisses a message replaced by another does nothing, and the page's own attach
    // function, called twice, shows in the one toast.
    await page.evaluate(() => {
        const kit = (window as unknown as { kit: Kit }).kit;
        const first = kit.again('Round 5 saved.');
        kit.show('Round 6 saved.');
        first();
    });
    await expect(message(page)).toHaveText('Round 6 saved.');
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

test("sits in an app's frame above the dock, clear of the body's last line", async ({ page }) => {
    await open(page, { body: FRAME });
    await show(page, 'Round 3 saved.', 'Undo');
    await page.locator('.dk-app-body').evaluate((element) => {
        element.scrollTop = element.scrollHeight;
    });
    const card = await box(toast(page), 'the toast');
    expect(bottom(card)).toBeLessThanOrEqual(
        (await box(page.locator('.dk-app-dock'), 'the dock')).y
    );
    expect(bottom(await box(page.locator('#last'), 'the last line'))).toBeLessThanOrEqual(card.y);
});

test('sits at the foot of a page clear of the home indicator, in the app column', async ({
    page,
}) => {
    await open(page, { css: ':root { --dk-safe-bottom: 34px; }' });
    await show(page, 'Round 3 saved.', 'Undo');
    const card = await box(toast(page), 'the toast');
    expect(bottom(card)).toBe(700 - 34 - 16);
    expect(card.x).toBe(16);
    expect(card.width).toBe(390 - 32);

    await open(page, { width: 1280, height: 700 });
    await show(page, 'Round 3 saved.', 'Undo');
    const wide = await box(toast(page), 'the toast');
    expect(wide.width).toBe(448 - 32);
    expect(wide.x).toBe((1280 - wide.width) / 2);
});

for (const theme of ['light', 'dark'] as const) {
    test(`has no audit findings in the ${theme} theme, shown and not`, async ({ page }) => {
        await open(page, { theme });
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        await show(page, 'Round 3 saved.', 'Undo');
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });
}
