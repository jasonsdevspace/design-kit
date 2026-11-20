import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { InputField, StatusLine } from '../src/react.js';
import { bundle } from './bundle.js';
import { servePage } from './page.js';

/*
 * A form whose fields the browser's constraints check, refused by the kit rather than the browser:
 * a submit with an empty required field and a malformed address stopped before the page's handler,
 * each failing field's error drawn in the field, focus on the first and the count said, the page's
 * handler run once every field passes, a button marked formnovalidate submitting unchecked, the
 * words each failure takes from the field, the page's map or the kit, errors taken away once their
 * fields pass, fields not in error marked so before any submit, and the same through React, where
 * the page draws the failures from its own state and the refusal follows.
 */

const BODY = renderToStaticMarkup(
    <main>
        <h1>Join</h1>
        <form id="join">
            <InputField id="name" name="name" label="Name" required />
            <InputField id="email" name="email" label="Email" type="email" required />
            <InputField id="age" name="age" label="Age" type="number" min={18} />
            <button type="submit">Join</button>
            <button type="submit" formNoValidate>
                Save a draft
            </button>
        </form>
        <StatusLine className="screen-status" />
    </main>
);

const SCRIPT = `import { attachForm } from './controls.js';
const form = document.querySelector('#join');
const line = document.querySelector('.screen-status');
window.heard = [];
window.submits = 0;
new MutationObserver(() => {
    if (line.textContent) window.heard.push(line.textContent);
}).observe(line, { childList: true, characterData: true, subtree: true });
form.addEventListener('submit', (event) => {
    event.preventDefault();
    window.submits += 1;
});
window.attach = (errorWords) => attachForm(form, { status: line, errorWords });
window.ready = true;`;

type Checked = { heard: string[]; submits: number; attach: (words?: object) => void };

const open = async (page: Page, words?: object) => {
    await servePage(page, { title: 'Join', body: BODY, script: SCRIPT });
    await page.waitForFunction(() => 'ready' in window);
    await page.evaluate((given) => {
        (window as unknown as Checked).attach(given);
    }, words);
};

const join = (page: Page) => page.getByRole('button', { name: 'Join' });
const submits = (page: Page) => page.evaluate(() => (window as unknown as Checked).submits);
const heard = (page: Page) => page.evaluate(() => (window as unknown as Checked).heard);
const errorOf = (page: Page, id: string) => page.locator(`#${id}-error`);

test('marks every field not in error so before anything is submitted', async ({ page }) => {
    await open(page);
    for (const id of ['name', 'email', 'age'])
        await expect(page.locator(`#${id}`)).toHaveAttribute('aria-invalid', 'false');
    expect(
        await page.locator('#join').evaluate((form) => (form as HTMLFormElement).noValidate)
    ).toBe(true);
});

test("refuses a submit that fails the browser's constraints, before the page's handler", async ({
    page,
}) => {
    await open(page);
    await page.getByLabel('Email').fill('abc');
    await join(page).click();
    await expect(page.getByLabel('Name')).toBeFocused();
    await expect(page.getByLabel('Name')).toHaveAttribute('aria-invalid', 'true');
    await expect(errorOf(page, 'name')).toHaveText('Error: Enter a value.');
    await expect(errorOf(page, 'email')).toHaveText(
        'Error: Enter an email address, like name@example.com.'
    );
    await expect(page.getByLabel('Email')).toHaveAccessibleDescription(
        /Enter an email address, like name@example.com/
    );
    await expect.poll(() => heard(page)).toEqual(['2 fields need attention.']);
    expect(await submits(page)).toBe(0);
});

test('takes away an error once its field passes, and lets the page handle a submit that passes', async ({
    page,
}) => {
    await open(page);
    await join(page).click();
    await expect(errorOf(page, 'name')).toBeVisible();
    await page.getByLabel('Name').fill('Ana');
    await page.getByLabel('Email').fill('ana@example.com');
    await join(page).click();
    await expect(errorOf(page, 'name')).toHaveCount(0);
    await expect(errorOf(page, 'email')).toHaveCount(0);
    await expect(page.getByLabel('Name')).toHaveAttribute('aria-invalid', 'false');
    await expect.poll(() => submits(page)).toBe(1);
});

test('submits unchecked from a button marked formnovalidate', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'Save a draft' }).click();
    await expect.poll(() => submits(page)).toBe(1);
    await expect(errorOf(page, 'name')).toHaveCount(0);
});

test("takes each failure's words from the field, else the page's map, else the kit's", async ({
    page,
}) => {
    await open(page, { valueMissing: 'Fill this in.' });
    await page.locator('#email').evaluate((field) => {
        field.setAttribute('data-error-value-missing', 'Enter your email address.');
    });
    await page.getByLabel('Age').fill('12');
    await join(page).click();
    await expect(errorOf(page, 'email')).toHaveText('Error: Enter your email address.');
    await expect(errorOf(page, 'name')).toHaveText('Error: Fill this in.');
    await expect(errorOf(page, 'age')).toHaveText('Error: Enter 18 or more.');
});

test.describe('in React', () => {
    let app = '';
    test.beforeAll(async () => {
        test.setTimeout(120_000);
        app = await bundle('checked-page.tsx');
    });

    test('hands the failures to the page, which draws them, and refuses once they are drawn', async ({
        page,
    }) => {
        await servePage(page, { title: 'Join', body: '<div id="root"></div>', script: app });
        await page.getByRole('button', { name: 'Join' }).click();
        await expect(page.getByLabel('Name')).toBeFocused();
        await expect(page.locator('#name-error')).toHaveText('Error: Enter your name.');
        await expect(page.locator('#count')).toHaveText('0');
    });
});
