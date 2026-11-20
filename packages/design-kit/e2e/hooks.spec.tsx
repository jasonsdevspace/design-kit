import { expect, type Page, test } from '@playwright/test';

import { bundle } from './bundle.js';
import { type Controls } from './hooks-page.js';
import { servePage, stillClock } from './page.js';

/*
 * What record 20 asks of each hook that attaches to an element, through a row of cells, a busy
 * button, a progress bar and a form drawn with React: each element swapped for another is attached
 * in its place, a draw with the same options sets nothing again, an option dropped is cleared, and
 * the hooks taken away leave nothing that throws.
 */

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
const busy = (page: Page, on: boolean) =>
    page.evaluate((now) => {
        (window as unknown as Controls).busy(now);
    }, on);
const move = (page: Page, done: number) =>
    page.evaluate((to) => {
        (window as unknown as Controls).move(to);
    }, done);

const line = (page: Page) => page.locator('main').locator('..').locator('p[role="status"]');

test('attaches each swapped element in place of the one before', async ({ page }) => {
    await open(page);
    await run(page, 'swap');
    await expect(page.locator('#row-b')).toBeVisible();
    // The row's stop is placed on the new row, and its arrows move along it.
    await expect(page.locator('#b-one')).toHaveAttribute('tabindex', '0');
    await expect(page.locator('#b-two')).toHaveAttribute('tabindex', '-1');
    // The new bar says its end, first, while the line is free.
    await move(page, 40);
    await expect(line(page)).toHaveText('Imported 40 products.');
    // The new form checks itself, with the page's words.
    expect(
        await page.locator('#form-b').evaluate((form) => (form as HTMLFormElement).noValidate)
    ).toBe(true);
    await page.getByRole('button', { name: 'Make the list' }).click();
    await expect(page.locator('#name-b-error')).toHaveText('Error: Enter a list name.');
    // The new button ignores a press while it is busy.
    await busy(page, true);
    await expect(page.locator('#save-b')).toHaveAttribute('aria-disabled', 'true');
    await page.locator('#save-b').click({ force: true });
    expect(await page.evaluate(() => (window as unknown as Controls).clicks)).toBe(0);
});

test('sets nothing again for a draw with the same options', async ({ page }) => {
    await open(page);
    await expect(page.locator('#a-one')).toHaveAttribute('tabindex', '0');
    // The cell the row's options name changes without telling the row, so only options set again
    // would place the stop on it.
    await page.evaluate(() => {
        (window as unknown as Controls).chosen = 'a-two';
    });
    const draws = await page.evaluate(() => (window as unknown as Controls).draws);
    await run(page, 'again');
    await expect
        .poll(() => page.evaluate(() => (window as unknown as Controls).draws))
        .toBeGreaterThan(draws);
    await expect(page.locator('#a-one')).toHaveAttribute('tabindex', '0');
    await expect(page.locator('#a-two')).toHaveAttribute('tabindex', '-1');
});

test('clears an option dropped', async ({ page }) => {
    await open(page);
    // Laid out as a column, a row's right arrow moves nowhere.
    await page.locator('#a-one').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#a-one')).toBeFocused();
    await run(page, 'drop');
    // The page's draw comes in a task of React's own, after the call returns.
    await expect
        .poll(() => page.evaluate(() => (window as unknown as Controls).dropped))
        .toBe(true);
    await page.locator('#a-one').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#a-two')).toBeFocused();
    // The bar's done words dropped give way to its own.
    await move(page, 40);
    await expect(line(page)).toHaveText('Importing products, 40 of 40.');
    // The form's words dropped give way to the kit's.
    await page.getByRole('button', { name: 'Make the list' }).click();
    await expect(page.locator('#name-a-error')).toHaveText('Error: Enter a value.');
});

test('lets each element go once the hooks are taken away, saying nothing late', async ({
    page,
}) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await stillClock(page.clock);
    await open(page);
    // A busy notice waits a moment before it is said, and the button is taken away before then.
    await busy(page, true);
    await page.clock.runFor(100);
    await run(page, 'leave');
    await expect(page.locator('#row-a')).toHaveCount(0);
    await page.clock.runFor(3000);
    await expect(line(page)).toHaveText('');
    await page.keyboard.press('Tab');
    expect(errors).toEqual([]);
});
