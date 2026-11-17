import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { js, KIT, ORIGIN, tabKey } from './page.js';

/*
 * A panel a button opens, attached by its button: the panel starting as the button says, the
 * button opening and closing it by pointer and by keyboard, the corner Close closing it with the
 * button marked collapsed and focus back on it, the set returned opening and closing it from the
 * page's code, the detach letting the button go, and a button attached twice returning the same.
 */

const CLOSE = `<div class="dk-close"><button type="button" class="dk-button dk-button-text dk-button-quiet"><span aria-hidden="true">×</span><span class="dk-visually-hidden">Close round tips</span></button></div>`;

const BODY = `<main class="dk-page" tabindex="-1"><h1>Round 3</h1>
<p><button type="button" class="dk-button" id="tips-button" aria-expanded="false" aria-controls="round-tips">Tips</button>
<button type="button" class="dk-button" id="rules-button" aria-expanded="true" aria-controls="rules">Rules</button>
<button type="button" class="dk-button" id="tips-again" aria-expanded="false" aria-controls="round-tips">More tips</button>
<button type="button" class="dk-button" id="notes-button" aria-expanded="true" aria-controls="notes">Notes</button></p>
<div class="dk-panel" id="round-tips" hidden><h2 class="dk-panel-title">Round tips</h2>${CLOSE}<p><a href="#deal" id="deal">How to deal</a></p></div>
<div class="dk-panel" id="rules"><h2 class="dk-panel-title">Rules</h2><p>The lowest score wins.</p></div>
<div class="dk-panel" id="notes" hidden><h2 class="dk-panel-title">Notes</h2><p>Deal from the left.</p></div>
<p><a href="#after" id="after-panels">After the panels</a> <button type="button" id="no-panel">Nothing</button></p>
</main>`;

const ATTACH = `import { attachPanel } from './controls.js';
// Counts the click listeners that come off the page, to see the panels' one go with the last button.
window.listenersOff = 0;
const removeListener = document.removeEventListener.bind(document);
document.removeEventListener = (...args) => {
    if (args[0] === 'click') window.listenersOff += 1;
    removeListener(...args);
};
const tips = attachPanel(document.querySelector('#tips-button'));
window.panels = [tips];
for (const id of ['#rules-button', '#tips-again', '#notes-button'])
    window.panels.push(attachPanel(document.querySelector(id)));
// A page's own handler that stops a click inside the panel, counted to show it ran.
window.stopped = 0;
const stop = (event) => {
    window.stopped += 1;
    event.stopPropagation();
};
document.querySelector('#round-tips').addEventListener('click', stop);
window.setTips = tips.set;
window.redrawPanel = () => {
    const panel = document.querySelector('#round-tips');
    const drawn = panel.cloneNode(true);
    drawn.addEventListener('click', stop);
    panel.replaceWith(drawn);
};
window.sameTips = attachPanel(document.querySelector('#tips-button')) === tips;
try {
    attachPanel(document.querySelector('#no-panel'));
} catch (error) {
    window.refused = error.message;
}
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

test('starts each panel as its button says, open or closed, whatever the markup says', async ({
    page,
}) => {
    await open(page);
    await expect(panel(page)).toBeHidden();
    await expect(page.locator('#rules')).toBeVisible();
    // The markup hides the notes, and their button says they are open.
    await expect(page.locator('#notes')).toBeVisible();
});

test('refuses a button that names no panel, saying what it needs', async ({ page }) => {
    await open(page);
    expect(await page.evaluate(() => (window as unknown as { refused?: string }).refused)).toBe(
        "a panel's button needs aria-controls"
    );
});

test('passes an accessibility audit with the panel open and closed', async ({ page }) => {
    await open(page);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await button(page).click();
    await expect(panel(page)).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
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
    // The Close is the next stop after the button that opened the panel and the three beside it.
    for (let stop = 0; stop < 4; stop += 1) await page.keyboard.press(tabKey(browserName));
    await expect(close(page)).toBeFocused();
    await page.keyboard.press('Space');
    await expect(panel(page)).toBeHidden();
    await expect(button(page)).toBeFocused();
    await expect(button(page)).toHaveAttribute('aria-expanded', 'false');
});

test("opens and closes the panel from the page's code, and returns the same for a button attached twice", async ({
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
    expect(await page.evaluate(() => (window as unknown as { stopped: number }).stopped)).toBe(1);
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

test("moves focus to the page's main content where nothing after the panel takes it", async ({
    page,
}) => {
    await open(page);
    await button(page).click();
    await page.evaluate(() => {
        for (const id of [
            '#tips-button',
            '#tips-again',
            '#rules',
            '#notes',
            '#after-panels',
            '#no-panel',
        ])
            document.querySelector(id)?.remove();
    });
    await page.locator('#deal').focus();
    await close(page).click();
    await expect(panel(page)).toBeHidden();
    await expect(page.locator('main')).toBeFocused();
});

test('leaves the panel alone when a Close in later content that reuses its id is pressed', async ({
    page,
}) => {
    await open(page);
    await button(page).click();
    await page.evaluate(() => {
        const copy = document.createElement('div');
        copy.id = 'round-tips';
        copy.innerHTML =
            '<div class="dk-close"><button type="button">Close the copy</button></div>';
        document.querySelector('main')?.append(copy);
    });
    await page.getByRole('button', { name: 'Close the copy' }).click();
    await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.dk-panel#round-tips')).toBeVisible();
});

test('lets a button go when detached, and takes the listener off once every button is let go', async ({
    page,
}) => {
    await open(page);
    await button(page).click();
    await page.evaluate(() => {
        const { panels } = window as unknown as { panels: { detach: () => void }[] };
        for (const control of panels) control.detach();
    });
    expect(
        await page.evaluate(() => (window as unknown as { listenersOff: number }).listenersOff)
    ).toBe(1);
    await close(page).click();
    await expect(panel(page)).toBeVisible();
    await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
    await page.locator('#rules-button').click();
    await expect(page.locator('#rules')).toBeVisible();
});
