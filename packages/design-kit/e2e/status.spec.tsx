import { expect, test } from '@playwright/test';

import { bundle } from './bundle.js';
import { servePage } from './page.js';

/*
 * A status line said on at once or once its words stop changing, by `attachStatus` and through
 * React's `StatusProvider` and `useStatus`: words said at once, words that settle said once only
 * when they stop changing, waiting words dropped by any message said meanwhile, the same words
 * twice heard twice, words said at once heard though words that settle follow straight after, a
 * part's first effect heard, the function the same across renders, a provider inside another taking
 * the calls under it, a call after the provider has gone saying nothing, and a line taken off the
 * page saying nothing more.
 */

const LINE = '<p id="line" class="dk-visually-hidden" role="status"></p>';

const VANILLA = `import { attachStatus } from './controls.js';
const say = attachStatus(document.querySelector('#line'));
window.heard = [];
new MutationObserver(() => {
    const text = document.querySelector('#line').textContent;
    if (text) window.heard.push(text);
}).observe(document.querySelector('#line'), { childList: true, characterData: true, subtree: true });
window.say = say;
window.ready = true;`;

type Heard = { heard: string[]; say: (words: string, options?: { settle?: number }) => void };

test('says words at once, and words that settle only once they stop changing', async ({ page }) => {
    await servePage(page, { title: 'Status', body: LINE, script: VANILLA });
    await page.waitForFunction(() => 'ready' in window);
    await page.evaluate(() => {
        const { say } = window as unknown as Heard;
        say('1 still to enter.', { settle: 300 });
        say('2 still to enter.', { settle: 300 });
        say('3 still to enter.', { settle: 300 });
    });
    await expect(page.locator('#line')).toHaveText('3 still to enter.');
    expect(await page.evaluate(() => (window as unknown as Heard).heard)).toEqual([
        '3 still to enter.',
    ]);
    // Said at once, and the same words twice heard twice.
    await page.evaluate(() => {
        const { say } = window as unknown as Heard;
        say('Saved.');
    });
    await expect(page.locator('#line')).toHaveText('Saved.');
    await page.evaluate(() => {
        const { say } = window as unknown as Heard;
        say('Saved.');
    });
    await expect
        .poll(() => page.evaluate(() => (window as unknown as Heard).heard.slice(-2)))
        .toEqual(['Saved.', 'Saved.']);
});

test('says nothing more on a line taken off the page, words waiting to settle among them', async ({
    page,
}) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await servePage(page, { title: 'Status', body: LINE, script: VANILLA });
    await page.waitForFunction(() => 'ready' in window);
    const line = await page.evaluate(() => {
        const { say } = window as unknown as Heard;
        say('Saved.');
        say('3 still to enter.', { settle: 50 });
        const removed = document.querySelector('#line');
        removed?.remove();
        (window as unknown as { removed: Element | null }).removed = removed;
        return removed !== null;
    });
    expect(line).toBe(true);
    await page.waitForTimeout(400);
    expect(
        await page.evaluate(
            () => (window as unknown as { removed: Element | null }).removed?.textContent
        )
    ).toBe('');
    expect(await page.evaluate(() => (window as unknown as Heard).heard)).toEqual([]);
    expect(errors).toEqual([]);
});

test('says words already said at once even when words that settle follow straight after', async ({
    page,
}) => {
    await servePage(page, { title: 'Status', body: LINE, script: VANILLA });
    await page.waitForFunction(() => 'ready' in window);
    await page.evaluate(() => {
        const { say } = window as unknown as Heard;
        say('Round saved.');
        say('4 still to enter.', { settle: 300 });
    });
    await expect(page.locator('#line')).toHaveText('4 still to enter.');
    expect(await page.evaluate(() => (window as unknown as Heard).heard)).toEqual([
        'Round saved.',
        '4 still to enter.',
    ]);
});

test('drops words still waiting to settle when another message is said', async ({ page }) => {
    await servePage(page, { title: 'Status', body: LINE, script: VANILLA });
    await page.waitForFunction(() => 'ready' in window);
    await page.evaluate(() => {
        const { say } = window as unknown as Heard;
        say('4 still to enter.', { settle: 300 });
        say('Round saved.');
    });
    await expect(page.locator('#line')).toHaveText('Round saved.');
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => (window as unknown as Heard).heard)).toEqual(['Round saved.']);
});

type Drawn = { functions: Set<unknown>; heard: string[]; late?: () => void };

let app = '';
test.beforeAll(async () => {
    test.setTimeout(120_000);
    app = await bundle('status-page.tsx');
});

const draw = async (page: import('@playwright/test').Page) => {
    await servePage(page, { title: 'Status', body: '<div id="root"></div>', script: app });
    await expect(page.locator('#outer > p[role="status"]')).toHaveText('Loaded.');
};

test("says through a provider, a part's first effect included, with the same function each render", async ({
    page,
}) => {
    await draw(page);
    for (let press = 0; press < 3; press += 1) await page.locator('#press').click();
    await expect(page.locator('#outer > p[role="status"]')).toHaveText('3 pressed.');
    // Settled, so the counts along the way were never said.
    expect(await page.evaluate(() => (window as unknown as Drawn).heard)).toEqual([
        'Loaded.',
        '3 pressed.',
    ]);
    expect(await page.evaluate(() => (window as unknown as Drawn).functions.size)).toBe(1);
});

test('takes the calls under a provider inside another on its own line', async ({ page }) => {
    await draw(page);
    await page.locator('#inner').click();
    await expect(page.locator('#dialog > p[role="status"]')).toHaveText('Inside.');
    await expect(page.locator('#outer > p[role="status"]')).not.toHaveText('Inside.');
});

test('says nothing and throws nothing for a call made after its provider has gone', async ({
    page,
}) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await draw(page);
    await page.locator('#leave').click();
    await expect(page.locator('#outer')).toHaveCount(0);
    await page.evaluate(() => {
        (window as unknown as Drawn).late?.();
    });
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
});
