import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { Button, StatusLine } from '../src/react.js';
import { bundle } from './bundle.js';
import { forceColors, servePage, style } from './page.js';

/*
 * A busy button, as `Button` draws it with `busy` and `attachBusy` makes it work: off at once, so
 * a press does nothing however often it lands, its off look held back for --dk-wait so a fast save
 * shows and says nothing, the pointer's wait shown at once, its words said once the wait outlasts
 * the token and dropped where it ends first, the look's wait kept under reduced motion and in
 * forced colors, and through React's `useBusy`, a double press saving once.
 */

const BODY = renderToStaticMarkup(
    <main>
        <Button id="save" accent>
            Save rule
        </Button>
        <StatusLine className="screen-status" />
    </main>
);

const SCRIPT = `import { attachBusy } from './controls.js';
const button = document.querySelector('#save');
const line = document.querySelector('.screen-status');
window.saves = 0;
window.heard = [];
new MutationObserver(() => {
    if (line.textContent) window.heard.push(line.textContent);
}).observe(line, { childList: true, characterData: true, subtree: true });
button.addEventListener('click', () => {
    window.saves += 1;
    button.setAttribute('aria-disabled', 'true');
    button.setAttribute('data-busy', 'Saving the rule.');
});
window.done = () => {
    button.removeAttribute('aria-disabled');
    button.removeAttribute('data-busy');
};
attachBusy(button, { status: line });
window.ready = true;`;

type Busy = { saves: number; heard: string[]; done: () => void };

const open = async (page: Page, wait = '400ms') => {
    await servePage(page, {
        title: 'Busy',
        body: BODY,
        script: SCRIPT,
        css: `:root { --dk-wait: ${wait}; }`,
    });
    await page.waitForFunction(() => 'ready' in window);
};

const look = async (page: Page) =>
    (await style(page.locator('#save'), 'background-color'))['background-color'];

test('ignores a press while busy, and shows the wait to the pointer at once', async ({ page }) => {
    await open(page);
    const save = page.getByRole('button', { name: 'Save rule' });
    await save.click();
    // Forced, since a pointer's tools take a button marked off as not there to press.
    await save.click({ force: true });
    await save.dispatchEvent('click');
    expect(await page.evaluate(() => (window as unknown as Busy).saves)).toBe(1);
    expect((await style(save, 'cursor'))['cursor']).toBe('progress');
});

test('holds its look and says nothing for a fast save', async ({ page }) => {
    await open(page, '10s');
    const before = await look(page);
    await page.getByRole('button', { name: 'Save rule' }).click();
    expect(await look(page)).toBe(before);
    await page.evaluate(() => {
        (window as unknown as Busy).done();
    });
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => (window as unknown as Busy).heard)).toEqual([]);
});

for (const motion of ['no-preference', 'reduce'] as const) {
    test(`shows and says the wait once it outlasts the token, with motion ${motion}`, async ({
        page,
    }) => {
        await page.emulateMedia({ reducedMotion: motion });
        await open(page, '150ms');
        const before = await look(page);
        await page.getByRole('button', { name: 'Save rule' }).click();
        await expect.poll(() => look(page)).not.toBe(before);
        await expect(page.locator('.screen-status')).toHaveText('Saving the rule.');
        expect(await page.evaluate(() => (window as unknown as Busy).heard)).toEqual([
            'Saving the rule.',
        ]);
    });
}

test('holds its look for the wait in forced colors too', async ({ page }) => {
    await forceColors(page);
    await open(page, '10s');
    const before = await look(page);
    await page.getByRole('button', { name: 'Save rule' }).click();
    expect(await look(page)).toBe(before);
});

test.describe('in React', () => {
    let app = '';
    test.beforeAll(async () => {
        test.setTimeout(120_000);
        app = await bundle('busy-page.tsx');
    });

    test('saves once for a double press, and says it is saving only while it is', async ({
        page,
    }) => {
        await servePage(page, { title: 'Busy', body: '<div id="root"></div>', script: app });
        const save = page.getByRole('button', { name: 'Save the round' });
        await save.dblclick({ force: true });
        await expect(save).toHaveAttribute('data-busy', 'Saving the round.');
        await expect(page.locator('#root p[role="status"]')).toHaveText('Saving the round.');
        await expect(page.locator('#saves')).toHaveText('1');
        await expect(save).not.toHaveAttribute('data-busy');
    });
});
