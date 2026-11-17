import { expect, type Page, test } from '@playwright/test';

import { js, KIT, ORIGIN, tabKey } from './page.js';

/*
 * A panel a button opens, attached by its button: the panel starting as the button says, the
 * button opening and closing it by pointer and by keyboard, the corner Close closing it with the
 * button marked collapsed and focus back on it, the function returned opening and closing it from
 * the page's code, and a button attached twice returning the same function.
 */

const CLOSE = `<div class="dk-close"><button type="button" class="dk-button dk-button-text dk-button-quiet"><span aria-hidden="true">×</span><span class="dk-visually-hidden">Close round tips</span></button></div>`;

const BODY = `<main class="dk-page"><h1>Round 3</h1>
<p><button type="button" class="dk-button" id="tips-button" aria-expanded="false" aria-controls="round-tips">Tips</button>
<button type="button" class="dk-button" id="rules-button" aria-expanded="true" aria-controls="rules">Rules</button>
<button type="button" class="dk-button" id="tips-again" aria-expanded="false" aria-controls="round-tips">More tips</button></p>
<div class="dk-panel" id="round-tips" hidden><h2 class="dk-panel-title">Round tips</h2>${CLOSE}<p><a href="#deal" id="deal">How to deal</a></p></div>
<div class="dk-panel" id="rules"><h2 class="dk-panel-title">Rules</h2><p>The lowest score wins.</p></div>
<p><a href="#after">After the panels</a></p>
</main>`;

const ATTACH = `import { attachPanel } from './controls.js';
const tips = attachPanel(document.querySelector('#tips-button'));
attachPanel(document.querySelector('#rules-button'));
attachPanel(document.querySelector('#tips-again'));
// A page's own handler that stops a click inside the panel.
document.querySelector('#round-tips').addEventListener('click', (event) => event.stopPropagation());
window.setTips = tips;
window.redrawPanel = () => {
    const panel = document.querySelector('#round-tips');
    panel.replaceWith(panel.cloneNode(true));
};
window.sameTips = attachPanel(document.querySelector('#tips-button')) === tips;
window.ready = true;`;

const open = async (page: Page): Promise<void> => {
    const files: Readonly<Record<string, readonly [string, string]>> = {
        '/kit.css': [KIT, 'text/css'],
        '/controls.js': [js('controls.ts'), 'text/javascript'],
        '/theme.js': [js('theme.ts'), 'text/javascript'],
        '/page.js': [ATTACH, 'text/javascript'],
    };
    await page.route(`${ORIGIN}/**`, (route) => {
        const path = new URL(route.request().url()).pathname;
        const [body, contentType] = files[path] ?? [
            '<!doctype html><html lang="en"><head><title>Round 3</title>' +
                `<link rel="stylesheet" href="/kit.css"></head><body>${BODY}` +
                '<script type="module" src="/page.js"></script></body></html>',
            'text/html',
        ];
        return route.fulfill({ body, contentType });
    });
    await page.setViewportSize({ width: 390, height: 700 });
    await page.goto(`${ORIGIN}/`);
    await page.waitForFunction(() => 'ready' in window);
};

const button = (page: Page) => page.locator('#tips-button');
const panel = (page: Page) => page.locator('#round-tips');
const close = (page: Page) => page.getByRole('button', { name: 'Close round tips' });

test('starts each panel as its button says, open or closed', async ({ page }) => {
    await open(page);
    await expect(panel(page)).toBeHidden();
    await expect(page.locator('#rules')).toBeVisible();
});

test('opens and closes the panel by its button, and closes it by its Close, by pointer', async ({
    page,
}) => {
    await open(page);
    await button(page).click();
    await expect(panel(page)).toBeVisible();
    await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
    await close(page).click();
    await expect(panel(page)).toBeHidden();
    await expect(button(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(button(page)).toBeFocused();
    await button(page).click();
    await button(page).click();
    await expect(panel(page)).toBeHidden();
});

test('closes the panel by its Close by keyboard, with focus back on its button', async ({
    page,
    browserName,
}) => {
    await open(page);
    await button(page).focus();
    await page.keyboard.press('Enter');
    await expect(panel(page)).toBeVisible();
    // The Close is the next stop after the button that opened the panel and the two beside it.
    for (let stop = 0; stop < 3; stop += 1) await page.keyboard.press(tabKey(browserName));
    await expect(close(page)).toBeFocused();
    await page.keyboard.press('Space');
    await expect(panel(page)).toBeHidden();
    await expect(button(page)).toBeFocused();
    await expect(button(page)).toHaveAttribute('aria-expanded', 'false');
});

test("opens and closes the panel from the page's code, and returns one function for a button attached twice", async ({
    page,
}) => {
    await open(page);
    expect(await page.evaluate(() => (window as unknown as { sameTips: boolean }).sameTips)).toBe(
        true
    );
    await page.evaluate(() => {
        (window as unknown as { setTips: (open: boolean) => void }).setTips(true);
    });
    await expect(panel(page)).toBeVisible();
    await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
    await button(page).click();
    await expect(panel(page)).toBeHidden();
});

test('keeps every button that names the panel in step, and hands focus back to the one that opened it', async ({
    page,
}) => {
    await open(page);
    await page.locator('#tips-again').click();
    await expect(panel(page)).toBeVisible();
    await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#tips-again')).toHaveAttribute('aria-expanded', 'true');
    await close(page).click();
    await expect(page.locator('#tips-again')).toBeFocused();
    await expect(button(page)).toHaveAttribute('aria-expanded', 'false');
});

test("closes a panel drawn again by its Close, past a page's handler that stops the press", async ({
    page,
}) => {
    await open(page);
    await button(page).click();
    await page.evaluate(() => {
        (window as unknown as { redrawPanel: () => void }).redrawPanel();
    });
    await close(page).click();
    await expect(panel(page)).toBeHidden();
    await expect(button(page)).toBeFocused();
});

test("moves focus out of the panel when the page's code closes it with focus inside", async ({
    page,
}) => {
    await open(page);
    await button(page).click();
    await page.locator('#deal').focus();
    await page.evaluate(() => {
        (window as unknown as { setTips: (open: boolean) => void }).setTips(false);
    });
    await expect(panel(page)).toBeHidden();
    await expect(button(page)).toBeFocused();
});

test('moves focus to what follows the panel where no button that names it is left', async ({
    page,
}) => {
    await open(page);
    await button(page).click();
    await page.evaluate(() => {
        for (const id of ['#tips-button', '#tips-again']) document.querySelector(id)?.remove();
    });
    await close(page).click();
    await expect(panel(page)).toBeHidden();
    await expect(page.getByRole('link', { name: 'After the panels' })).toBeFocused();
});
