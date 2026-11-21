import { expect, type Page, test } from '@playwright/test';

import { bundle } from './bundle.js';
import { servePage } from './page.js';
import { type Strict } from './strict-page.js';

/*
 * The hooks under React's `StrictMode`, in its development build, which attaches each ref, runs its
 * cleanup and attaches it again as the page first draws, as record 20 asks: words a part says in its
 * first effect kept on the provider's line, one arrow key moving one cell, a busy notice, the end
 * of a progress and a refusal each said once, a row removed asking for focus on the next and
 * finding it there, and each piece taken down as it leaves, saying nothing late.
 */

let app = '';
test.beforeAll(async () => {
    test.setTimeout(120_000);
    app = await bundle('strict-page.tsx', { development: true });
});

const open = async (page: Page) => {
    await servePage(page, {
        title: 'Lists',
        body: '<div id="root"></div>',
        script: app,
        css: ':root { --dk-wait: 200ms; }',
    });
    await expect(page.locator('#row')).toBeVisible();
};

const said = (page: Page) => page.evaluate(() => (window as unknown as Strict).said);
const line = (page: Page) => page.locator('main').locator('..').locator('p[role="status"]');

test("keeps words said in a part's first effect on the provider's line through the second run", async ({
    page,
}) => {
    await open(page);
    await expect(line(page)).toHaveText('Lists ready.');
});

test('moves one cell for one arrow key, with one stop in the row', async ({ page }) => {
    await open(page);
    await expect(page.locator('#row [tabindex="0"]')).toHaveCount(1);
    await page.locator('#cell-one').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#cell-two')).toBeFocused();
    expect(await page.evaluate(() => (window as unknown as Strict).moves)).toBe(1);
});

test('says a busy notice, the end of a progress and a refusal once each', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
        (window as unknown as Strict).busy(true);
    });
    await expect.poll(() => said(page)).toContain('Saving the list.');
    await page.evaluate(() => {
        (window as unknown as Strict).busy(false);
        (window as unknown as Strict).move(40);
    });
    await expect.poll(() => said(page)).toContain('Imported 40 products.');
    await page.getByRole('button', { name: 'Make the list' }).click();
    await expect(page.locator('#name')).toBeFocused();
    await expect.poll(() => said(page)).toContain('List name: Error: Enter a list name.');
    // Long enough for a second attach's wait or timer to come due.
    await page.waitForTimeout(500);
    expect(await said(page)).toEqual([
        'Saving the list.',
        'Imported 40 products.',
        'List name: Error: Enter a list name.',
    ]);
});

test('moves focus to the next row as one removes itself', async ({ page }) => {
    await open(page);
    await page.locator('#remove-Ann').click();
    await expect(page.locator('#remove-Ann')).toHaveCount(0);
    await expect(page.locator('#remove-Ben')).toBeFocused();
});

test('takes each piece down as it leaves, saying nothing late', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await open(page);
    await page.evaluate(() => {
        (window as unknown as Strict).busy(true);
        (window as unknown as Strict).leave();
    });
    await expect(page.locator('#row')).toHaveCount(0);
    await page.waitForTimeout(500);
    expect(await said(page)).toEqual([]);
    // The provider's line stays, with the words said on it.
    await expect(line(page)).toHaveCount(1);
    expect(errors).toEqual([]);
});
