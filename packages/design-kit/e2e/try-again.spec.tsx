import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { Button, Callout } from '../src/react.js';
import { bundle } from './bundle.js';
import { forceColors, servePage, sideways, tabKey, writePage } from './page.js';
import { cutOff, SPACED } from './spacing.js';
import { textSize } from './text-size.js';

/*
 * A failure with Try again, as the reference builds it from a live callout and its actions, with the
 * reference's own component: mounted empty and out of sight beside the loading line, filled at the
 * first failure with no focus moved, the alert holding the failure and never the button's words,
 * emptied as Try again loads again with focus on the part's heading and the loading line back, the
 * same failure read a second time with focus left on the heading, a failure that comes back at once
 * put in a moment after the empty, the list drawn and the callout marked empty when the load works,
 * and the filled failure whole on a 320px phone at twice the text size and under wider spacing, with
 * no audit findings in either theme or in forced colors.
 */

type Said = { words: string; at: number };
type Loads = { loads: number; pending?: { resolve: () => void; reject: () => void }; said: Said[] };

let app = '';

test.beforeAll(async () => {
    test.setTimeout(120_000);
    app = await bundle('try-again-page.tsx');
});

const open = async (page: Page) => {
    await servePage(page, { title: 'Products', body: '<main id="root"></main>', script: app });
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
    await expect.poll(() => loads(page)).toBe(1);
};

const loads = (page: Page) => page.evaluate(() => (window as unknown as Loads).loads);
const said = (page: Page) => page.evaluate(() => (window as unknown as Loads).said);
/** The failures the alert was filled with, each once for each time it was filled from empty. */
const heard = async (page: Page) =>
    (await said(page)).map(({ words }) => words).filter((words) => words !== '');
const end = (page: Page, works: boolean) =>
    page.evaluate((ok) => {
        const { pending } = window as unknown as Loads;
        if (ok) pending?.resolve();
        else pending?.reject();
    }, works);
/** What has focus once two frames have passed, so a request to move it has landed. */
const focused = (page: Page) =>
    page.evaluate(
        () =>
            new Promise<string>((resolve) => {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        resolve(document.activeElement?.localName ?? '');
                    });
                });
            })
    );
const tryAgain = (page: Page) => page.getByRole('button', { name: 'Try again' });

const FAILURE = 'Error: The products could not be loadedCheck your connection.';

test('mounts the callout empty and out of sight beside the loading line', async ({ page }) => {
    await open(page);
    const callout = page.locator('.dk-callout');
    await expect(callout).toHaveAttribute('data-empty', '');
    await expect(page.getByRole('alert')).toHaveText('');
    expect((await callout.boundingBox())?.height ?? 0).toBeLessThanOrEqual(1);
    await expect(page.locator('[aria-busy="true"] > .dk-loading')).toHaveCount(1);
});

test('fills the callout at the first failure and moves no focus', async ({ page }) => {
    await open(page);
    await end(page, false);
    await expect(page.locator('.dk-callout')).not.toHaveAttribute('data-empty');
    await expect.poll(() => heard(page)).toEqual([FAILURE]);
    expect(await focused(page)).toBe('body');
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
});

test('reads the failure and never the button in the alert', async ({ page }) => {
    await open(page);
    await end(page, false);
    const alert = page.getByRole('alert');
    await expect(alert).toHaveText(FAILURE);
    await expect(alert.getByRole('button')).toHaveCount(0);
    await expect(alert).not.toContainText('Try again');
    await expect(
        page.locator('.dk-callout').getByRole('button', { name: 'Try again' })
    ).toBeVisible();
});

test('reads the same failure twice with focus left on what is loading again', async ({
    page,
    browserName,
}) => {
    await open(page);
    await end(page, false);
    await tryAgain(page).press('Enter');
    await expect.poll(() => loads(page)).toBe(2);
    await expect(page.getByRole('alert')).toHaveText('');
    await expect(page.locator('[aria-busy="true"] > .dk-loading')).toHaveCount(1);
    expect(await focused(page)).toBe('h2');
    await end(page, false);
    await expect.poll(() => heard(page)).toEqual([FAILURE, FAILURE]);
    expect(await focused(page)).toBe('h2');
    // The next Tab from the heading reaches Try again.
    await page.keyboard.press(tabKey(browserName));
    await expect(tryAgain(page)).toBeFocused();
});

test('puts a failure that comes back at once in a moment after the callout empties', async ({
    page,
}) => {
    await open(page);
    await end(page, false);
    await expect(tryAgain(page)).toBeVisible();
    await page.evaluate(() => {
        document.querySelector<HTMLButtonElement>('.dk-callout-actions button')?.click();
        (window as unknown as Loads).pending?.reject();
    });
    await expect.poll(() => heard(page)).toEqual([FAILURE, FAILURE]);
    const changes = await said(page);
    const emptied = changes.findLast(({ words }) => words === '');
    const filled = changes.at(-1);
    expect(emptied).toBeDefined();
    expect((filled?.at ?? 0) - (emptied?.at ?? 0)).toBeGreaterThanOrEqual(90);
});

test('draws the list and marks the callout empty again when Try again works', async ({ page }) => {
    await open(page);
    await end(page, false);
    await tryAgain(page).click();
    await expect(page.locator('#list')).toHaveCount(0);
    await end(page, true);
    await expect(page.locator('#list')).toBeVisible();
    await expect(page.locator('.dk-callout')).toHaveAttribute('data-empty', '');
    await expect(page.getByRole('alert')).toHaveText('');
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
    expect(await focused(page)).toBe('h2');
    expect(await heard(page)).toEqual([FAILURE]);
});

/** The failure as it is once filled, drawn in plain markup for its look. */
const FILLED = renderToStaticMarkup(
    <main>
        <h1>Shop</h1>
        <h2 id="products">Products</h2>
        <Callout
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
