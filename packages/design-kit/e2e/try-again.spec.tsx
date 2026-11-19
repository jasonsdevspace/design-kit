import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { Button, Callout } from '../src/react.js';
import { bundle } from './bundle.js';
import { forceColors, servePage, sideways, writePage } from './page.js';
import { cutOff, SPACED } from './spacing.js';
import { textSize } from './text-size.js';

/*
 * A failure with Try again, as the reference builds it from a live callout and its actions: mounted
 * empty and out of sight, filled at the first failure with no focus moved, the alert holding the
 * failure and never the button's words, emptied as Try again loads again with focus on what was
 * retried, the same failure read a second time with focus back on the callout, emptied and marked
 * again when the load works, and the filled failure whole on a 320px phone at twice the text size
 * and under wider spacing, with no audit findings in either theme or in forced colors.
 */

type Loads = {
    loads: number;
    pending?: { resolve: () => void; reject: () => void };
    heard: string[];
};

let app = '';

test.beforeAll(async () => {
    test.setTimeout(120_000);
    app = await bundle('try-again-page.tsx');
});

const open = async (page: Page) => {
    await servePage(page, { title: 'Products', body: '<main id="root"></main>', script: app });
    await expect(page.locator('#products')).toBeVisible();
    await expect.poll(() => loads(page)).toBe(1);
};

const loads = (page: Page) => page.evaluate(() => (window as unknown as Loads).loads);
const heard = (page: Page) => page.evaluate(() => (window as unknown as Loads).heard);
const end = (page: Page, works: boolean) =>
    page.evaluate((ok) => {
        const { pending } = window as unknown as Loads;
        if (ok) pending?.resolve();
        else pending?.reject();
    }, works);
const focused = (page: Page) => page.evaluate(() => document.activeElement?.id ?? '');

const FAILURE = 'Error: The products could not be loadedCheck your connection.';

test('mounts the callout empty and out of sight, and fills it with no focus moved', async ({
    page,
}) => {
    await open(page);
    const callout = page.locator('#products-failed');
    await expect(callout).toHaveAttribute('data-empty', '');
    await expect(page.getByRole('alert')).toHaveText('');
    expect((await callout.boundingBox())?.height ?? 0).toBeLessThanOrEqual(1);
    await end(page, false);
    await expect(callout).not.toHaveAttribute('data-empty');
    expect(await heard(page)).toEqual([FAILURE]);
    expect(await focused(page)).toBe('');
});

test('reads the failure and never the button in the alert', async ({ page }) => {
    await open(page);
    await end(page, false);
    const alert = page.getByRole('alert');
    await expect(alert).toHaveText(FAILURE);
    await expect(alert.getByRole('button')).toHaveCount(0);
    await expect(alert).not.toContainText('Try again');
    await expect(
        page.locator('#products-failed').getByRole('button', { name: 'Try again' })
    ).toBeVisible();
});

test('reads the same failure twice and moves focus to what was retried, then to the callout', async ({
    page,
}) => {
    await open(page);
    await end(page, false);
    await page.getByRole('button', { name: 'Try again' }).press('Enter');
    await expect.poll(() => loads(page)).toBe(2);
    await expect(page.getByRole('alert')).toHaveText('');
    await expect.poll(() => focused(page)).toBe('products');
    await end(page, false);
    await expect.poll(() => focused(page)).toBe('products-failed');
    expect(await heard(page)).toEqual([FAILURE, FAILURE]);
});

test('empties and marks the callout again when Try again works', async ({ page }) => {
    await open(page);
    await end(page, false);
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect.poll(() => focused(page)).toBe('products');
    await end(page, true);
    await page.waitForTimeout(100);
    await expect(page.locator('#products-failed')).toHaveAttribute('data-empty', '');
    await expect(page.getByRole('alert')).toHaveText('');
    expect(await focused(page)).toBe('products');
    expect(await heard(page)).toEqual([FAILURE]);
});

/** The failure as it is once filled, drawn in plain markup for its look. */
const FILLED = renderToStaticMarkup(
    <main>
        <h1>Shop</h1>
        <h2 id="products">Products</h2>
        <Callout
            id="products-failed"
            tabIndex={-1}
            tone="danger"
            live="alert"
            title="The products could not be loaded"
            actions={<Button>Try again</Button>}
        >
            <p>Check your connection.</p>
        </Callout>
    </main>
);

const PARTS = '.dk-callout, .dk-callout-body, .dk-callout-title, .dk-callout-actions, .dk-button';

test('stays whole on a 320px phone at twice the text size', async ({ page }) => {
    await writePage(page, { title: 'Products', body: FILLED, width: 320, height: 640 });
    await textSize(page, 2);
    expect(await sideways(page)).toBe(0);
    expect(await cutOff(page, PARTS)).toEqual([]);
});

test('stays whole under wider text spacing', async ({ page }) => {
    await writePage(page, {
        title: 'Products',
        body: FILLED,
        width: 320,
        height: 640,
        css: SPACED,
    });
    expect(await sideways(page)).toBe(0);
    expect(await cutOff(page, PARTS)).toEqual([]);
});

for (const colors of ['light', 'dark', 'forced'] as const) {
    test(`has no audit findings in ${colors === 'forced' ? 'forced colors' : `the ${colors} theme`}`, async ({
        page,
    }) => {
        if (colors === 'forced') await forceColors(page);
        await writePage(page, {
            title: 'Products',
            body: FILLED,
            theme: colors === 'dark' ? 'dark' : 'light',
        });
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations.map(({ id }) => id)).toEqual([]);
    });
}
