import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { Button, InputField, StatusLine } from '../src/react.js';
import { bundle } from './bundle.js';
import { forceColors, servePage, stillClock, style } from './page.js';

/*
 * A busy button, as `Button` draws it with `busy` and `attachBusy` makes it work: marked off at
 * once, so a press by pointer, Enter, Space or a form's Enter does nothing however often it lands,
 * its off look held back for --dk-wait so a fast save shows and says nothing, the pointer's wait
 * shown at once, its words said once the wait outlasts the token, dropped where the work ends first
 * and said again for a busy that starts again, the look's wait kept under reduced motion and in
 * forced colors, and through React's `useBusy`, a double press saving once and a save that ends
 * just after the wait saying nothing late.
 */

const BODY = renderToStaticMarkup(
    <main>
        <form id="rule">
            <InputField id="name" label="Rule name" />
            <Button id="save" type="submit" accent>
                Save rule
            </Button>
        </form>
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
document.querySelector('#rule').addEventListener('submit', (event) => {
    event.preventDefault();
    window.saves += 1;
    button.setAttribute('data-busy', 'Saving the rule.');
});
window.done = () => button.removeAttribute('data-busy');
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

const save = (page: Page) => page.getByRole('button', { name: 'Save rule' });
const saves = (page: Page) => page.evaluate(() => (window as unknown as Busy).saves);
const heard = (page: Page) => page.evaluate(() => (window as unknown as Busy).heard);
const look = async (page: Page, name: string) => (await style(save(page), name))[name];

test('marks a busy button off and ignores a press by pointer, Enter, Space or a form', async ({
    page,
}) => {
    await open(page);
    await save(page).click();
    await expect(save(page)).toHaveAttribute('aria-disabled', 'true');
    // Forced, since a pointer's tools take a button marked off as not there to press.
    await save(page).click({ force: true });
    await save(page).focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await page.locator('#name').press('Enter');
    expect(await saves(page)).toBe(1);
    expect(await look(page, 'cursor')).toBe('progress');
    // Done, the mark the attach set goes, and a press saves again.
    await page.evaluate(() => {
        (window as unknown as Busy).done();
    });
    await expect(save(page)).not.toHaveAttribute('aria-disabled');
    await save(page).click();
    expect(await saves(page)).toBe(2);
});

test('holds its look and says nothing for a fast save', async ({ page }) => {
    await stillClock(page.clock);
    await open(page, '10s');
    const before = await look(page, 'background-color');
    await save(page).click();
    expect(await look(page, 'background-color')).toBe(before);
    await page.evaluate(() => {
        (window as unknown as Busy).done();
    });
    // Past the wait, where a notice the save's end did not call off would be said.
    await page.clock.runFor(11_000);
    expect(await heard(page)).toEqual([]);
});

test('drops its words where the work ends after the wait but before they are said', async ({
    page,
}) => {
    await stillClock(page.clock);
    await open(page, '150ms');
    await page.evaluate(() => {
        document.querySelector<HTMLButtonElement>('#save')?.click();
        // Past the wait, inside the moment the line takes to put words in.
        window.setTimeout(() => {
            (window as unknown as Busy).done();
        }, 200);
    });
    await page.clock.runFor(500);
    expect(await heard(page)).toEqual([]);
});

for (const motion of ['no-preference', 'reduce'] as const) {
    test(`shows and says the wait once it outlasts the token, with motion ${motion}`, async ({
        page,
    }) => {
        await page.emulateMedia({ reducedMotion: motion });
        await open(page, '150ms');
        const before = await look(page, 'background-color');
        await save(page).click();
        await expect.poll(() => look(page, 'background-color')).not.toBe(before);
        await expect(page.locator('.screen-status')).toHaveText('Saving the rule.');
        expect(await heard(page)).toEqual(['Saving the rule.']);
    });
}

test('says its words again for a busy that ends and starts again at once', async ({ page }) => {
    await open(page, '150ms');
    await save(page).click();
    await expect(page.locator('.screen-status')).toHaveText('Saving the rule.');
    await page.evaluate(() => {
        const button = document.querySelector('#save');
        button?.removeAttribute('data-busy');
        button?.setAttribute('data-busy', 'Saving again.');
    });
    await expect.poll(() => heard(page)).toEqual(['Saving the rule.', 'Saving again.']);
});

test('holds its look for the wait in forced colors too', async ({ page }) => {
    await forceColors(page);
    await open(page, '10s');
    const before = await look(page, 'color');
    await save(page).click();
    expect(await look(page, 'color')).toBe(before);
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
        const button = page.getByRole('button', { name: 'Save the round' });
        await button.dblclick({ force: true });
        await expect(button).toHaveAttribute('data-busy', 'Saving the round.');
        await expect(page.locator('#root p[role="status"]')).toHaveText('Saving the round.');
        await expect(page.locator('#saves')).toHaveText('1');
        await expect(button).not.toHaveAttribute('data-busy');
    });

    test('says nothing late for a save that ends just after the wait', async ({ page }) => {
        await stillClock(page.clock);
        await servePage(page, { title: 'Busy', body: '<div id="root"></div>', script: app });
        await page.getByRole('button', { name: 'Save the scores' }).click();
        // Past the save's end and the moment the line would have put words in.
        await page.clock.runFor(800);
        expect(await page.evaluate(() => (window as unknown as { heard: string[] }).heard)).toEqual(
            []
        );
    });
});
