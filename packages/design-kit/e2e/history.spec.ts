import { type Browser, expect, type Page, test } from '@playwright/test';

import { servePage } from './page.js';

/*
 * The browser a worker's tests share offers no words one test sent to another. Firefox keeps the
 * words sent from a text field in the browser's profile, which every context shares, and opens a
 * list of them under the field as words they start with are typed there again. A press made as the
 * list opens never reaches the page, so a test that filled a name a test before it sent and then
 * pressed the button below found the button never pressed.
 */

/** How long the browser is given to find the words it keeps and list them, in real time. */
const LISTED = 500;

/** A name field and the button that sends it, on a page that handles the send itself. */
const openForm = (page: Page) =>
    servePage(page, {
        title: 'Name',
        body:
            '<form><label for="name">Name</label><input id="name" name="name">' +
            '<button type="submit">Send</button></form>',
        script: `document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
});`,
    });

/**
 * What the name field holds where one context of the browser sent "Ana" from it, and the next
 * typed "An" and pressed the keys that choose the first words the browser lists.
 */
const offered = async (browser: Browser): Promise<string> => {
    const before = await browser.newContext();
    const after = await browser.newContext();
    try {
        const sent = await before.newPage();
        await openForm(sent);
        await sent.getByLabel('Name').fill('Ana');
        await sent.getByRole('button', { name: 'Send' }).click();
        await before.close();
        const page = await after.newPage();
        await openForm(page);
        const name = page.getByLabel('Name');
        await name.pressSequentially('An');
        // The list is the browser's own, which the page cannot see, so its search is waited for in
        // real time, a wait the browser that keeps its history shows to be long enough.
        await page.waitForTimeout(LISTED);
        await name.press('ArrowDown');
        await name.press('Enter');
        return await name.inputValue();
    } finally {
        await before.close();
        await after.close();
    }
};

test('offers a field none of the words a test before sent from it', async ({
    browser,
    browserName,
    playwright,
}) => {
    test.skip(browserName !== 'firefox', 'Firefox form history');
    // The same steps in a Firefox that keeps its form history choose the words it lists, so a list
    // too slow to open fails here rather than passing below.
    const keeping = await playwright.firefox.launch({
        firefoxUserPrefs: { 'browser.formfill.enable': true },
    });
    try {
        expect(await offered(keeping), 'the field in a Firefox that keeps its history').toBe('Ana');
    } finally {
        await keeping.close();
    }
    expect(await offered(browser)).toBe('An');
});
