import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { InputField, StatusLine, StepperField } from '../src/react.js';
import { bundle } from './bundle.js';
import { servePage, stillClock } from './page.js';
import { doubled } from './text-size.js';

/*
 * A form whose fields the browser's constraints check, refused by the kit rather than the browser:
 * a submit with an empty required field and a malformed address stopped before the page's handler,
 * each failing field's error drawn in the field, focus on the first and the count said, the page's
 * handler run once every field passes, a button marked formnovalidate submitting unchecked, the
 * words each failure takes from the field, the page's map or the kit, errors taken away once their
 * fields pass, fields not in error marked so before any submit, the error added to bare markup
 * left at its own margins, an address in an error broken only after its "@", and the same through
 * React, where the page draws the failures from its own state and the refusal follows.
 */

const BODY = renderToStaticMarkup(
    <main>
        <h1>Join</h1>
        <form id="join">
            <InputField id="name" name="name" label="Name" required />
            <InputField id="email" name="email" label="Email" type="email" required />
            <InputField id="age" name="age" label="Age" type="number" min={18} />
            <InputField id="site" name="site" label="Website" type="url" />
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
    await page.getByLabel('Website').fill('example.com');
    await join(page).click();
    await expect(page.getByLabel('Name')).toBeFocused();
    await expect(page.getByLabel('Name')).toHaveAttribute('aria-invalid', 'true');
    await expect(errorOf(page, 'name')).toHaveText('Error: Enter a value.');
    await expect(errorOf(page, 'email')).toHaveText(
        'Error: Enter an email address like name@example.com here.'
    );
    await expect(page.getByLabel('Email')).toHaveAccessibleDescription(
        /Enter an email address like name@example.com here/
    );
    await expect(errorOf(page, 'site')).toHaveText(
        'Error: Enter the full web address, with https:// at the start.'
    );
    await expect(page.getByLabel('Website')).toHaveAccessibleDescription(
        'Error: Enter the full web address, with https:// at the start.'
    );
    await expect
        .poll(() => heard(page))
        .toEqual(['Name: Error: Enter a value. 3 fields need attention.']);
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

/** A page of the page's own markup, with the form attached as it is drawn. */
const openWith = async (page: Page, form: string, attach = 'form', css = '') => {
    await servePage(page, {
        title: 'Join',
        css,
        body: `<main><h1>Join</h1>${form}<p class="dk-visually-hidden screen-status" role="status"></p></main>`,
        script: `import { attachForm } from './controls.js';
const line = document.querySelector('.screen-status');
window.heard = [];
window.submits = 0;
new MutationObserver(() => {
    if (line.textContent) window.heard.push(line.textContent);
}).observe(line, { childList: true, characterData: true, subtree: true });
document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    window.submits += 1;
});
attachForm(document.querySelector(${JSON.stringify(attach)}), { status: line });
window.attachForm = attachForm;
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
};

const send = (page: Page) => page.getByRole('button', { name: 'Send' }).click();

test("draws a field's error after its hint, and describes it after the hint", async ({ page }) => {
    await openWith(
        page,
        `<form><div class="dk-field"><label class="dk-field-label" for="code">Code</label>
<p class="dk-field-hint" id="code-hint">Six letters.</p>
<input class="dk-input" id="code" required aria-describedby="code-hint"></div>
<button type="submit">Send</button></form>`
    );
    await send(page);
    await expect(page.locator('#code-error')).toHaveText('Error: Enter a value.');
    expect(
        await page.evaluate(() => {
            const hint = document.querySelector('#code-hint');
            const error = document.querySelector('#code-error');
            return hint && error
                ? hint.compareDocumentPosition(error) & Node.DOCUMENT_POSITION_FOLLOWING
                : 0;
        })
    ).toBeTruthy();
    await expect(page.locator('#code')).toHaveAttribute('aria-describedby', 'code-hint code-error');
});

test('names a field no one can reach, and leaves focus where it is', async ({ page }) => {
    await openWith(
        page,
        `<form><details><summary>More</summary><label for="phone">Phone</label><input id="phone" required></details>
<button type="submit">Send</button></form>`
    );
    // By Enter, since a press of the pointer leaves a button without focus in Safari.
    await page.getByRole('button', { name: 'Send' }).focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => heard(page)).toEqual(['Phone: Error: Enter a value.']);
    await expect(page.getByRole('button', { name: 'Send' })).toBeFocused();
});

test('lets a field marked off pass, since no one could put it right', async ({ page }) => {
    await openWith(
        page,
        `<form><fieldset aria-disabled="true"><legend>Size</legend>
<label><input type="radio" name="size" value="s" required> Small</label>
<label><input type="radio" name="size" value="l"> Large</label></fieldset>
<button type="submit">Send</button></form>`
    );
    await send(page);
    await expect.poll(() => submits(page)).toBe(1);
});

test('counts a group of radios with no set around it once, and a box alone in a section as its own field', async ({
    page,
}) => {
    await openWith(
        page,
        `<form><fieldset><legend>Your details</legend>
<label for="who">Name</label><input id="who" value="Ana">
<label><input type="checkbox" id="agree" name="agree" required> I agree</label></fieldset>
<p>Size</p>
<label><input type="radio" id="size-s" name="size" value="s" required> Small</label>
<label><input type="radio" id="size-l" name="size" value="l"> Large</label>
<button type="submit">Send</button></form>`
    );
    await send(page);
    await expect(page.locator('#agree')).toBeFocused();
    await expect(page.locator('#agree-error')).toHaveText('Error: Check the box to go on.');
    // Before its label, never inside it, where it would join the box's name.
    expect(
        await page.locator('#agree-error').evaluate((error) => error.closest('label'))
    ).toBeNull();
    await expect(page.locator('#agree')).toHaveAccessibleName('I agree');
    await expect(page.locator('.dk-field-error')).toHaveCount(2);
    await expect
        .poll(() => heard(page))
        .toEqual(['I agree: Error: Check the box to go on. 2 fields need attention.']);
});

test("gives an error the page drew for a field the kit's words, and puts the page's back once it passes", async ({
    page,
}) => {
    await openWith(
        page,
        `<form><label for="nick">Name</label>
<p class="dk-field-error" id="nick-error"><span class="dk-visually-hidden">Error: </span>That name is taken.</p>
<input id="nick" required aria-invalid="true" aria-describedby="nick-error">
<label for="mail">Email</label><input id="mail" required>
<button type="submit">Send</button></form>`
    );
    await send(page);
    await expect(page.locator('.dk-field-error')).toHaveCount(2);
    await expect(page.locator('#nick-error')).toHaveText('Error: Enter a value.');
    await page.locator('#nick').fill('Ana');
    await send(page);
    await expect(page.locator('#nick-error')).toHaveText('Error: That name is taken.');
    await expect(page.locator('#nick')).toHaveAttribute('aria-invalid', 'true');
});

/** The lines an error is drawn on, read from where each character falls, its hidden words left out. */
const linesOf = (page: Page, selector: string) =>
    page.locator(selector).evaluate((error) => {
        const rows: { top: number; text: string }[] = [];
        const walker = document.createTreeWalker(error, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (node.parentElement?.closest('.dk-visually-hidden')) continue;
            const text = node.textContent ?? '';
            for (let at = 0; at < text.length; at += 1) {
                const range = document.createRange();
                range.setStart(node, at);
                range.setEnd(node, at + 1);
                const rect =
                    [...range.getClientRects()].find((one) => one.width > 0) ??
                    range.getBoundingClientRect();
                const top = Math.round(rect.top);
                let row = rows.find((one) => Math.abs(one.top - top) < 4);
                if (!row) {
                    row = { top, text: '' };
                    rows.push(row);
                }
                row.text += text.charAt(at);
            }
        }
        return rows.sort((one, other) => one.top - other.top).map((row) => row.text.trim());
    });

/** The breaks inside an address that do not fall right after its "@", and lines led by a stop. */
const badBreaks = (lines: readonly string[], address: string) => {
    const whole = lines.join('\n');
    const start = whole.replaceAll('\n', '').indexOf(address);
    if (start < 0) return [`no "${address}" in "${lines.join(' / ')}"`];
    const wrong: string[] = [];
    let seen = 0;
    lines.slice(0, -1).forEach((line) => {
        seen += line.length;
        const inside = seen > start && seen < start + address.length;
        if (inside && !line.endsWith('@')) wrong.push(`breaks after "${line}"`);
    });
    for (const line of lines) if (/^[.,;:!?]/.test(line)) wrong.push(`starts "${line}"`);
    return wrong;
};

/** A page's own row, which leaves a field beside its button too narrow for an address. */
const ROW = '.row { display: flex; align-items: end; gap: var(--dk-space-2); }';

const EMAIL_FIELD = `<form><div class="row"><div class="dk-field"><label class="dk-field-label" for="mail">Email</label>
<p class="dk-field-hint" id="mail-hint">Where the receipt goes</p>
<input class="dk-input" id="mail" type="email" required aria-describedby="mail-hint"></div>
<button class="dk-button" type="submit">Send</button></div></form>`;

test('breaks a long address in its error only after the "@", at 320 wide and twice the text size', async ({
    page,
    browserName,
}) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await openWith(page, EMAIL_FIELD, 'form', ROW);
    await doubled(page, browserName);
    await page.locator('#mail').fill('abc');
    await send(page);
    const error = page.locator('#mail-error');
    await expect(error).toBeVisible();
    const lines = await linesOf(page, '#mail-error');
    expect(badBreaks(lines, 'name@example.com'), lines.join(' / ')).toEqual([]);
    // The row leaves the address too long for a line, so it breaks, and at the "@".
    expect(
        lines.some((line) => line.endsWith('@')),
        lines.join(' / ')
    ).toBe(true);
    // The words read and described whole, the address in one piece.
    await expect(error).toHaveText('Error: Enter an email address like name@example.com here.');
    await expect(page.locator('#mail')).toHaveAccessibleDescription(
        'Where the receipt goes Error: Enter an email address like name@example.com here.'
    );
    await expect
        .poll(async () => (await heard(page)).join(' '))
        .toContain('Email: Error: Enter an email address like name@example.com here.');
});

test('breaks a long address in the error React draws only after the "@", at 320 and twice the text', async ({
    page,
    browserName,
}) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await servePage(page, {
        title: 'Join',
        css: ROW,
        body: `<main><h1>Join</h1><form><div class="row">${renderToStaticMarkup(
            <InputField
                id="mail"
                label="Email"
                hint="Where the receipt goes"
                error="Enter an email address like name@example.com here."
                type="email"
            />
        )}<button class="dk-button" type="submit">Send</button></div></form></main>`,
    });
    await doubled(page, browserName);
    await expect(page.locator('#mail-error')).toHaveText(
        'Error: Enter an email address like name@example.com here.'
    );
    await expect(page.locator('#mail')).toHaveAccessibleDescription(
        'Where the receipt goes Error: Enter an email address like name@example.com here.'
    );
    const lines = await linesOf(page, '#mail-error');
    expect(badBreaks(lines, 'name@example.com'), lines.join(' / ')).toEqual([]);
    // The row leaves the address too long for a line, so it breaks, and at the "@".
    expect(
        lines.some((line) => line.endsWith('@')),
        lines.join(' / ')
    ).toBe(true);
});

test('gives fields with no id errors of their own', async ({ page }) => {
    await openWith(
        page,
        `<form><label>Name <input required></label><label>Town <input required></label>
<button type="submit">Send</button></form>`
    );
    await send(page);
    const ids = await page
        .locator('.dk-field-error')
        .evaluateAll((errors) => errors.map((error) => error.id));
    expect(new Set(ids).size).toBe(2);
    await expect(page.getByLabel('Town')).toHaveAccessibleDescription('Error: Enter a value.');
});

test("takes words written on a set's fieldset, and a field's own for its pattern", async ({
    page,
}) => {
    await openWith(
        page,
        `<form><fieldset id="size" data-error-value-missing="Choose a size."><legend>Size</legend>
<label><input type="radio" name="size" value="s" required> Small</label>
<label><input type="radio" name="size" value="l"> Large</label></fieldset>
<label for="post">Postcode</label><input id="post" pattern="[A-Z]{2}" value="1" data-error-pattern-mismatch="Enter two capital letters.">
<button type="submit">Send</button></form>`
    );
    await send(page);
    await expect(page.locator('#size-error')).toHaveText('Error: Choose a size.');
    await expect(page.locator('#size')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('input[name="size"]').first()).not.toHaveAttribute(
        'aria-invalid',
        'true'
    );
    await expect(page.locator('#post-error')).toHaveText('Error: Enter two capital letters.');
});

test('checks the whole form where only a part of it is attached, a field tied to it from outside among them', async ({
    page,
}) => {
    await openWith(
        page,
        `<form id="join"><fieldset id="part"><legend>Part</legend><label for="a">A</label><input id="a" value="x" required></fieldset>
<label for="b">B</label><input id="b" required>
<button type="submit">Send</button></form>
<label for="c">C</label><input id="c" form="join" required>`,
        '#part'
    );
    await send(page);
    await expect(page.locator('#b-error')).toBeVisible();
    await expect(page.locator('#c-error')).toBeVisible();
    expect(await submits(page)).toBe(0);
});

test("takes the kit's errors away as the form is reset", async ({ page }) => {
    await openWith(
        page,
        `<form><label for="n">Name</label><input id="n" required>
<button type="submit">Send</button><button type="reset">Clear</button></form>`
    );
    await send(page);
    await expect(page.locator('#n-error')).toBeVisible();
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.locator('#n-error')).toHaveCount(0);
    await expect(page.locator('#n')).toHaveAttribute('aria-invalid', 'false');
});

test('leaves the error it adds to bare markup at its own margins, with no step from the form', async ({
    page,
}) => {
    await openWith(
        page,
        `<form style="display: flow-root"><label for="n">Name</label><input id="n" required><button type="submit">Send</button></form>`
    );
    await send(page);
    await expect(page.locator('#n-error')).toBeVisible();
    const placed = await page.evaluate(() => {
        const of = (selector: string) => {
            const found = document.querySelector(selector);
            if (!found) throw new Error(`expected ${selector} on the page`);
            return found;
        };
        const error = getComputedStyle(of('#n-error'));
        const input = of('#n').getBoundingClientRect();
        const button = of('button').getBoundingClientRect();
        return {
            // A paragraph's own margin is its text's size, which is all the browser gives it.
            ownMargin: [error.marginTop, error.marginBottom].every(
                (margin) => Math.abs(parseFloat(margin) - parseFloat(error.fontSize)) < 0.1
            ),
            controlMargin: getComputedStyle(of('#n')).marginTop,
            oneLine: input.top < button.bottom && button.top < input.bottom,
        };
    });
    expect(placed).toEqual({ ownMargin: true, controlMargin: '0px', oneLine: true });
});

test("leaves a stepper's own range error as the one error for a value past its limits", async ({
    page,
}) => {
    await servePage(page, {
        title: 'Bid',
        body: renderToStaticMarkup(
            <main>
                <h1>Bid</h1>
                <form>
                    <StepperField id="bid" label="Bid" min={0} max={10} defaultValue={5} />
                    <button type="submit">Send</button>
                </form>
                <StatusLine className="screen-status" />
            </main>
        ),
        script: `import { attachForm, attachStepper } from './controls.js';
attachStepper(document.querySelector('.dk-stepper'));
attachForm(document.querySelector('form'), { status: document.querySelector('.screen-status') });
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    const bid = page.getByRole('spinbutton', { name: 'Bid' });
    await bid.fill('15');
    await bid.blur();
    await send(page);
    await expect(page.locator('.dk-field-error:visible')).toHaveCount(1);
    await expect(bid).toHaveAttribute('aria-invalid', 'true');
    // Put right, the stepper takes its own mark away, and the kit leaves it so.
    await bid.fill('7');
    await bid.blur();
    await send(page);
    await expect(bid).not.toHaveAttribute('aria-invalid', 'true');
});

test("counts a page's own set of boxes of different names once", async ({ page }) => {
    await openWith(
        page,
        `<form><fieldset id="topics"><legend>Topics</legend>
<label><input type="checkbox" name="topics-news" required> News</label>
<label><input type="checkbox" name="topics-offers" required> Offers</label></fieldset>
<button type="submit">Send</button></form>`
    );
    await send(page);
    await expect(page.locator('.dk-field-error')).toHaveCount(1);
    await expect(page.locator('#topics-error')).toBeVisible();
});

test('clears the errors it drew on a formnovalidate submit, and keeps them through a reset called off', async ({
    page,
}) => {
    await stillClock(page.clock);
    await openWith(
        page,
        `<form><label for="n">Name</label><input id="n" required>
<button type="submit">Send</button><button type="submit" formnovalidate>Save a draft</button>
<button type="reset">Clear</button></form>`
    );
    await page.locator('form').evaluate((form) => {
        form.addEventListener('reset', (event) => {
            if (form.dataset['keep'] === 'yes') event.preventDefault();
        });
    });
    await send(page);
    await expect(page.locator('#n-error')).toBeVisible();
    await page.locator('form').evaluate((form) => {
        (form as HTMLFormElement).dataset['keep'] = 'yes';
    });
    await page.getByRole('button', { name: 'Clear' }).click();
    // Past the task a reset waits before it takes the errors away.
    await page.clock.runFor(100);
    await expect(page.locator('#n-error')).toBeVisible();
    await page.getByRole('button', { name: 'Save a draft' }).click();
    await expect(page.locator('#n-error')).toHaveCount(0);
});

test("lets the form's own attach take over the check from a part attached first", async ({
    page,
}) => {
    await openWith(
        page,
        `<form id="join"><fieldset id="part"><legend>Part</legend><label for="a">A</label><input id="a" required></fieldset>
<button type="submit">Send</button></form>`,
        '#part'
    );
    await page.evaluate(() => {
        const { attachForm } = window as unknown as {
            attachForm: (form: Element, options: object) => unknown;
        };
        attachForm(document.querySelector('#join') as Element, {
            status: document.querySelector('.screen-status'),
            errorWords: { valueMissing: 'Fill in A.' },
        });
    });
    await send(page);
    await expect(page.locator('#a-error')).toHaveText('Error: Fill in A.');
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
        await expect(page.locator('#size-error')).toHaveText(/Choose an option/);
        await expect(page.locator('#count')).toHaveText('0');
    });
});
