import { readFileSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import ts from 'typescript';

import { box, KIT, style } from './page.js';

/*
 * A dialog as a page attaches it, in Chromium and in WebKit: opened over a scrim in the kit's scrim
 * color on the raised ground, named by its heading, focus moved in on open and back to what opened
 * it on close however it closes, closed by Escape and by a tap on the scrim but not by a drag out
 * of it, kept open on both when asked to stay, the page behind it still, the sheet at the bottom
 * edge clear of the home indicator and scrolling inside itself, rising into place unless less
 * motion is asked for, and no audit findings in either theme.
 */

const ORIGIN = 'https://kit.test';

const js = (file: string) =>
    ts.transpileModule(readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
    }).outputText;

const OPTIONS = Array.from(
    { length: 30 },
    (_, index) => `<p>Option ${String(index + 1)} for the round.</p>`
).join('');

const BODY = `<main><h1>Round 3</h1>
<p><button type="button" class="dk-button" id="end">End the game</button>
<button type="button" class="dk-button" id="options">Round options</button>
<button type="button" class="dk-button" id="must">Choose a dealer</button></p>
${'<p>The page behind the dialog.</p>'.repeat(40)}</main>
<dialog class="dk-dialog" id="end-game" aria-labelledby="end-game-title">
<h2 class="dk-dialog-title" id="end-game-title">End the game now?</h2>
<p>The scores so far are kept in the history.</p>
<form method="dialog" class="dk-dialog-actions">
<button type="submit" class="dk-button" value="keep">Keep playing</button>
<button type="submit" class="dk-button dk-button-accent" value="end">End the game</button>
</form></dialog>
<dialog class="dk-dialog dk-dialog-sheet" id="round-options" aria-labelledby="round-options-title">
<h2 class="dk-dialog-title" id="round-options-title">Round options</h2>${OPTIONS}
<form method="dialog" class="dk-dialog-actions"><button type="submit" class="dk-button">Done</button></form>
</dialog>
<dialog class="dk-dialog" id="dealer" aria-labelledby="dealer-title">
<h2 class="dk-dialog-title" id="dealer-title">Who deals first?</h2>
<form method="dialog" class="dk-dialog-actions"><button type="submit" class="dk-button" value="ana">Ana</button></form>
</dialog>`;

const ATTACH = `import { attachDialog } from './controls.js';
const wire = (button, dialog, options) => {
    const open = attachDialog(document.querySelector(dialog), options);
    document.querySelector(button).addEventListener('click', open);
};
wire('#end', '#end-game');
wire('#options', '#round-options');
wire('#must', '#dealer', { stay: true });
window.ready = true;`;

const open = async (
    page: Page,
    {
        width = 390,
        height = 700,
        theme = 'light',
        css = '',
    }: {
        readonly width?: number;
        readonly height?: number;
        readonly theme?: 'light' | 'dark';
        readonly css?: string;
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
        const [body, contentType] = files[path] ?? [
            `<!doctype html><html lang="en" data-theme="${theme}"><head><title>Round 3</title>` +
                `<link rel="stylesheet" href="/kit.css"></head><body>${BODY}` +
                '<script type="module" src="/page.js"></script></body></html>',
            'text/html',
        ];
        return route.fulfill({ body, contentType });
    });
    await page.setViewportSize({ width, height });
    await page.goto(`${ORIGIN}/`);
    await page.waitForFunction(() => 'ready' in window);
};

const endGame = (page: Page): Locator => page.getByRole('dialog', { name: 'End the game now?' });
const sheet = (page: Page): Locator => page.getByRole('dialog', { name: 'Round options' });

/** Waits for a dialog's entrance to end, so it is measured where it comes to rest. */
const settle = (dialog: Locator): Promise<unknown> =>
    dialog.evaluate((element) =>
        Promise.all(element.getAnimations().map((animation) => animation.finished))
    );

/** A color as the page resolves it, from an element asked to take it. */
const resolved = (page: Page, color: string): Promise<string> =>
    page.evaluate((value) => {
        const probe = document.createElement('span');
        probe.style.backgroundColor = value;
        document.body.append(probe);
        const read = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return read;
    }, color);

test('opens over the scrim on the raised ground, named by its heading, with focus inside', async ({
    page,
}) => {
    for (const theme of ['light', 'dark'] as const) {
        await open(page, { theme });
        await page.locator('#end').click();
        await expect(endGame(page)).toBeVisible();
        const scrim = await endGame(page).evaluate(
            (dialog) => getComputedStyle(dialog, '::backdrop').backgroundColor
        );
        expect(scrim, theme).toBe(await resolved(page, 'var(--dk-scrim)'));
        expect((await style(endGame(page), 'background-color'))['background-color'], theme).toBe(
            await resolved(page, 'var(--dk-raised)')
        );
        expect((await style(endGame(page), 'box-shadow'))['box-shadow'], theme).not.toBe('none');
        // Focus is inside, on the answer that keeps things as they are.
        await expect(page.getByRole('button', { name: 'Keep playing' })).toBeFocused();
    }
});

test('returns focus to what opened it, however it closes', async ({ page }) => {
    await open(page);
    const opener = page.locator('#end');
    // By an answer.
    await opener.click();
    await page.getByRole('button', { name: 'Keep playing' }).click();
    await expect(endGame(page)).toBeHidden();
    await expect(opener).toBeFocused();
    expect(await page.locator('#end-game').evaluate((d: HTMLDialogElement) => d.returnValue)).toBe(
        'keep'
    );
    // By Escape.
    await opener.click();
    await page.keyboard.press('Escape');
    await expect(endGame(page)).toBeHidden();
    await expect(opener).toBeFocused();
    // By a tap on the scrim.
    await opener.click();
    await page.mouse.click(5, 5);
    await expect(endGame(page)).toBeHidden();
    await expect(opener).toBeFocused();
});

test('stays open on a tap inside it and on a drag that ends outside it', async ({ page }) => {
    await open(page);
    await page.locator('#end').click();
    const drawn = await box(endGame(page), 'the dialog');
    await page.mouse.click(drawn.x + 8, drawn.y + 8);
    await expect(endGame(page)).toBeVisible();
    await page.mouse.move(drawn.x + 8, drawn.y + 8);
    await page.mouse.down();
    await page.mouse.move(2, 2);
    await page.mouse.up();
    await expect(endGame(page)).toBeVisible();
});

test('stays open on Escape and on the scrim when it asks to stay', async ({ page }) => {
    await open(page);
    await page.locator('#must').click();
    const dealer = page.getByRole('dialog', { name: 'Who deals first?' });
    await expect(dealer).toBeVisible();
    await page.keyboard.press('Escape');
    await page.mouse.click(5, 5);
    await expect(dealer).toBeVisible();
    await page.getByRole('button', { name: 'Ana' }).click();
    await expect(dealer).toBeHidden();
});

test('keeps the page behind it still while it is open', async ({ page }) => {
    await open(page);
    await page.locator('#end').click();
    expect((await style(page.locator('html'), 'overflow-y'))['overflow-y']).toBe('hidden');
    await page.keyboard.press('Escape');
    expect((await style(page.locator('html'), 'overflow-y'))['overflow-y']).not.toBe('hidden');
});

test('draws the sheet at the bottom edge, clear of the home indicator, scrolling inside itself', async ({
    page,
}) => {
    await open(page, { css: ':root { --dk-safe-bottom: 34px; }' });
    await page.locator('#options').click();
    await settle(sheet(page));
    const drawn = await box(sheet(page), 'the sheet');
    expect(drawn.y + drawn.height).toBeCloseTo(700, 0);
    expect(drawn.width).toBe(390);
    expect(
        parseFloat((await style(sheet(page), 'padding-bottom'))['padding-bottom'] ?? '')
    ).toBeGreaterThanOrEqual(34);
    expect(
        await sheet(page).evaluate((element) => element.scrollHeight > element.clientHeight)
    ).toBe(true);
    // Its last answer is reached by scrolling inside it, and lands above the home indicator.
    await sheet(page).evaluate((element) => {
        element.scrollTop = element.scrollHeight;
    });
    const done = await box(page.getByRole('button', { name: 'Done' }), 'the last answer');
    expect(done.y + done.height).toBeLessThanOrEqual(700 - 34);
});

test('rises the sheet into place, and opens it in place for less motion', async ({ page }) => {
    await open(page);
    await page.locator('#options').click();
    const travel = await sheet(page).evaluate((element) =>
        element.getAnimations().map((animation) => animation.effect?.getComputedTiming().duration)
    );
    expect(travel).toEqual([250]);
    await page.keyboard.press('Escape');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#options').click();
    const still = await sheet(page).evaluate((element) =>
        element.getAnimations().map((animation) => animation.effect?.getComputedTiming().duration)
    );
    expect(Number(still[0] ?? 0)).toBeLessThan(1);
});

for (const theme of ['light', 'dark'] as const) {
    test(`has no audit findings in the ${theme} theme, open`, async ({ page }) => {
        await open(page, { theme });
        await page.locator('#end').click();
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        await page.keyboard.press('Escape');
        await page.locator('#options').click();
        await settle(sheet(page));
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });
}
