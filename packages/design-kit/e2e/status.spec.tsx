import { expect, test } from '@playwright/test';

import { bundle, HOOKS } from './bundle.js';
import { servePage } from './page.js';

/*
 * A status line said on at once or once its words stop changing, by `attachStatus` and through
 * React's `StatusProvider` and `useStatus`: words said at once, words that settle said once only
 * when they stop changing, waiting words dropped by any message said meanwhile, the same words
 * twice heard twice, words said before the provider's line is attached held and said, the function
 * the same across renders, and a provider inside another taking the calls under it.
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

const APP = `import { createElement as h, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StatusProvider, useStatus } from ${JSON.stringify(HOOKS)};

window.functions = new Set();
// Says its words in its own first effect, before the provider's line is attached.
const Early = () => {
    const say = useStatus();
    useEffect(() => {
        say('Loaded.');
    }, [say]);
    return null;
};
const Counter = () => {
    const say = useStatus();
    window.functions.add(say);
    const [count, setCount] = useState(0);
    return h('button', {
        id: 'press',
        onClick: () => {
            setCount(count + 1);
            say(String(count + 1) + ' pressed.', { settle: 200 });
        },
    }, 'Press');
};
const Inner = () => {
    const say = useStatus();
    return h('button', { id: 'inner', onClick: () => say('Inside.') }, 'Inside');
};
const App = () =>
    h(StatusProvider, null,
        h(Early),
        h(Counter),
        h('div', { id: 'dialog' }, h(StatusProvider, null, h(Inner))));
createRoot(document.getElementById('root')).render(h(App));
window.ready = true;`;

let app = '';
test.beforeAll(async () => {
    app = await bundle(APP);
});

test('says through a provider: words said before its line is attached, settled words, and the same function each render', async ({
    page,
}) => {
    await servePage(page, { title: 'Status', body: '<div id="root"></div>', script: app });
    const outer = page.locator('#root > p[role="status"]');
    await expect(outer).toHaveText('Loaded.');
    for (let press = 0; press < 3; press += 1) await page.locator('#press').click();
    await expect(outer).toHaveText('3 pressed.');
    expect(
        await page.evaluate(() => (window as unknown as { functions: Set<unknown> }).functions.size)
    ).toBe(1);
});

test('takes the calls under a provider inside another on its own line', async ({ page }) => {
    await servePage(page, { title: 'Status', body: '<div id="root"></div>', script: app });
    await page.locator('#inner').click();
    await expect(page.locator('#dialog > p[role="status"]')).toHaveText('Inside.');
    await expect(page.locator('#root > p[role="status"]')).not.toHaveText('Inside.');
});
