import { expect, type Page, test } from '@playwright/test';

import { bundle } from './bundle.js';
import { servePage } from './page.js';

/*
 * What record 20 asks of each hook that attaches to an element, through a row of cells, a busy
 * button, a progress bar and a form drawn with React: each element swapped for another is attached
 * in its place, a draw with the same options sets nothing again, an option dropped is cleared, and
 * the hooks taken away leave nothing that throws.
 */

type Controls = {
    swap: () => void;
    again: () => void;
    drop: () => void;
    leave: () => void;
    busy: (on: boolean) => void;
    move: (done: number) => void;
    clicks: number;
    draws: number;
};

let app = '';
test.beforeAll(async () => {
    test.setTimeout(120_000);
    app = await bundle('hooks-page.tsx');
});

const open = async (page: Page) => {
    await servePage(page, { title: 'Lists', body: '<div id="root"></div>', script: app });
    await expect(page.locator('#row-a')).toBeVisible();
};

const run = (page: Page, name: 'swap' | 'again' | 'drop' | 'leave') =>
    page.evaluate((call) => {
        (window as unknown as Controls)[call]();
    }, name);

const line = (page: Page) => page.locator('main').locator('..').locator('p[role="status"]');

test('attaches each swapped element in place of the one before', async ({ page }) => {
    await open(page);
    await run(page, 'swap');
    await expect(page.locator('#row-b')).toBeVisible();
    // The row's stop is placed on the new row, and its arrows move along it.
    await expect(page.locator('#b-one')).toHaveAttribute('tabindex', '0');
    await expect(page.locator('#b-two')).toHaveAttribute('tabindex', '-1');
    // The new form checks itself, with the page's words.
    expect(
        await page.locator('#form-b').evaluate((form) => (form as HTMLFormElement).noValidate)
    ).toBe(true);
    await page.getByRole('button', { name: 'Make the list' }).click();
    await expect(page.locator('#name-b-error')).toHaveText('Error: Enter a list name.');
    // The new button ignores a press while it is busy.
    await page.evaluate(() => {
        (window as unknown as Controls).busy(true);
    });
    await expect(page.locator('#save-b')).toHaveAttribute('aria-disabled', 'true');
    await page.locator('#save-b').click({ force: true });
    expect(await page.evaluate(() => (window as unknown as Controls).clicks)).toBe(0);
    // The new bar says its end.
    await page.evaluate(() => {
        (window as unknown as Controls).move(40);
    });
    await expect(line(page)).toHaveText('Imported 40 products.');
});

test('sets nothing again for a draw with the same options', async ({ page }) => {
    await open(page);
    await page.locator('#a-one').focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#a-two')).toBeFocused();
    const draws = await page.evaluate(() => (window as unknown as Controls).draws);
    await run(page, 'again');
    await expect
        .poll(() => page.evaluate(() => (window as unknown as Controls).draws))
        .toBeGreaterThan(draws);
    // The stop stays where the arrows put it, so nothing placed it again.
    await expect(page.locator('#a-two')).toHaveAttribute('tabindex', '0');
    await expect(page.locator('#a-two')).toBeFocused();
});

test('clears an option dropped', async ({ page }) => {
    await open(page);
    // Laid out as a column, a row's right arrow moves nowhere.
    await page.locator('#a-one').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#a-one')).toBeFocused();
    await run(page, 'drop');
    await page.locator('#a-one').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#a-two')).toBeFocused();
    // The bar's done words dropped give way to its own.
    await page.evaluate(() => {
        (window as unknown as Controls).move(40);
    });
    await expect(line(page)).toHaveText('Importing products, 40 of 40.');
    // The form's words dropped give way to the kit's.
    await page.getByRole('button', { name: 'Make the list' }).click();
    await expect(page.locator('#name-a-error')).toHaveText('Error: Enter a value.');
});

test('leaves nothing that throws once the hooks are taken away', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await open(page);
    await run(page, 'leave');
    await expect(page.locator('#row-a')).toHaveCount(0);
    await page.keyboard.press('Tab');
    await page.mouse.click(5, 5);
    await page.waitForTimeout(200);
    expect(errors).toEqual([]);
});
