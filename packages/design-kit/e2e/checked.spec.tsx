import { expect, type Locator, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { InputField, StatusLine, StepperField } from '../src/react.js';
import { bundle } from './bundle.js';
import { hearing, servePage, stillClock } from './page.js';
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
${hearing('.screen-status')}window.submits = 0;
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
${hearing('.screen-status')}window.submits = 0;
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

test('names a field without the mark its label hides from a screen reader', async ({ page }) => {
    await openWith(
        page,
        `<form><label for="n">Name <span class="dk-field-mark" aria-hidden="true">(required)</span></label><input id="n" required>
<button type="submit">Send</button></form>`
    );
    await send(page);
    await expect.poll(() => heard(page)).toEqual(['Name: Error: Enter a value.']);
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

test("refuses each checkbox field in a page's own section as its own field, never the section", async ({
    page,
}) => {
    await openWith(
        page,
        `<form><fieldset><legend>House rules</legend>
<div class="dk-field"><label class="dk-choice" for="double"><input type="checkbox" id="double" name="double" required checked> <span>Score the last round double</span></label></div>
<div class="dk-field"><label class="dk-choice" for="skip"><input type="checkbox" id="skip" name="skip" required> <span>Let a player skip a round</span></label></div>
</fieldset>
<button type="submit">Send</button></form>`
    );
    await send(page);
    await expect(page.locator('#skip')).toBeFocused();
    await expect(page.locator('.dk-field-error')).toHaveCount(1);
    await expect(page.locator('#skip-error')).toHaveText('Error: Check the box to go on.');
    await expect(page.locator('#skip')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#double')).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('fieldset')).not.toHaveAttribute('aria-invalid', 'true');
    await expect
        .poll(() => heard(page))
        .toEqual(['Let a player skip a round: Error: Check the box to go on.']);
});

test("refuses a set a page writes with its choices' labels straight in its fieldset once, as a set", async ({
    page,
}) => {
    await openWith(
        page,
        `<form><fieldset class="dk-field dk-choice-field" id="sides"><legend class="dk-field-label">Sides</legend>
<label class="dk-choice"><input type="checkbox" id="fries" name="sides" value="fries" required> <span>Fries</span></label>
<label class="dk-choice"><input type="checkbox" id="salad" name="sides" value="salad" required> <span>Salad</span></label>
</fieldset>
<button type="submit">Send</button></form>`
    );
    await send(page);
    await expect(page.locator('.dk-field-error')).toHaveCount(1);
    await expect(page.locator('#sides-error')).toHaveText('Error: Choose an option.');
    await expect(page.locator('#fries-error')).toHaveCount(0);
    await expect(page.locator('#salad-error')).toHaveCount(0);
    await expect.poll(() => heard(page)).toEqual(['Sides: Error: Choose an option.']);
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

/** Dated fields with limits, each set below or above them, as a visitor enters a value. */
const DATED_FORM = `<form>
<label for="day">Day</label><input id="day" type="date" min="2026-11-22" max="2026-12-24">
<label for="when">When</label><input id="when" type="datetime-local" min="2026-11-22T09:00" max="2026-11-29T18:30">
<label for="at">At</label><input id="at" type="time" min="09:00" max="17:30">
<label for="in">Month</label><input id="in" type="month" min="2026-11" max="2027-02">
<label for="of">Week</label><input id="of" type="week" min="2026-W01" max="2026-W48">
<button type="submit">Send</button></form>`;

/** Sets each field's value as a visitor would, then submits. */
const sendDated = async (page: Page, values: Record<string, string>) => {
    await page.evaluate((given) => {
        for (const [id, value] of Object.entries(given)) {
            const field = document.getElementById(id) as HTMLInputElement;
            field.value = value;
            field.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }, values);
    await send(page);
};

/** The text of each dated field's error, keyed by the error's id. */
const datedErrors = (page: Page) =>
    page
        .locator('.dk-field-error')
        .evaluateAll((errors) =>
            Object.fromEntries(errors.map((one) => [one.id, one.textContent]))
        );

/**
 * The errors expected, a month's and a week's only where the engine takes those types, since WebKit
 * and Firefox draw them as text fields with no limits to fail.
 */
const takenBy = async (page: Page, errors: Record<string, string>) => {
    const types = await page.evaluate(() =>
        ['in', 'of'].map((id) => (document.getElementById(id) as HTMLInputElement).type)
    );
    return Object.fromEntries(
        Object.entries(errors).filter(
            ([id]) =>
                (id !== 'in-error' || types[0] === 'month') &&
                (id !== 'of-error' || types[1] === 'week')
        )
    );
};

/*
 * The plain space every engine's Intl puts before AM and PM in US English, written out on purpose:
 * ICU's newer data has a narrow no-break space there, which the engines put back to a plain one, so
 * an engine that takes the narrow one fails here and shows the change.
 */
const AM = ' AM';
const PM = ' PM';

test.describe("a dated field's limit", () => {
    // A zone with a spring-forward gap, and the browser's language pinned for the pages without one.
    test.use({ timezoneId: 'America/New_York', locale: 'en-US' });

    test('gives the limit in words a visitor reads, ending on later or earlier', async ({
        page,
    }) => {
        await openWith(page, DATED_FORM);
        await sendDated(page, {
            day: '2026-11-21',
            when: '2026-11-22T08:59',
            at: '08:30',
            in: '2026-10',
            of: '2025-W52',
        });
        expect(await datedErrors(page)).toEqual(
            await takenBy(page, {
                'day-error': 'Error: Enter November 22, 2026 or later.',
                'when-error': `Error: Enter November 22, 2026 at 9:00${AM} or later.`,
                'at-error': `Error: Enter 9:00${AM} or later.`,
                'in-error': 'Error: Enter November 2026 or later.',
                'of-error': 'Error: Enter the week of December 29, 2025 or later.',
            })
        );
        await sendDated(page, {
            day: '2026-12-25',
            when: '2026-11-29T18:31',
            at: '17:31',
            in: '2027-03',
            of: '2026-W49',
        });
        expect(await datedErrors(page)).toEqual(
            await takenBy(page, {
                'day-error': 'Error: Enter December 24, 2026 or earlier.',
                'when-error': `Error: Enter November 29, 2026 at 6:30${PM} or earlier.`,
                'at-error': `Error: Enter 5:30${PM} or earlier.`,
                'in-error': 'Error: Enter February 2027 or earlier.',
                'of-error': 'Error: Enter the week of November 23, 2026 or earlier.',
            })
        );
        // Words in the page's language, as a page in British English writes its dates.
        await page.evaluate(() => {
            document.documentElement.lang = 'en-GB';
        });
        await send(page);
        await expect(page.locator('#day-error')).toHaveText(
            'Error: Enter 24 December 2026 or earlier.'
        );
        await expect(page.locator('#at-error')).toHaveText('Error: Enter 17:30 or earlier.');
    });

    test('reads a limit in a spring-forward gap as the wall time written', async ({ page }) => {
        await openWith(
            page,
            `<form><label for="when">When</label><input id="when" type="datetime-local" min="2026-03-08T02:30">
<button type="submit">Send</button></form>`
        );
        await sendDated(page, { when: '2026-03-08T01:00' });
        await expect(page.locator('#when-error')).toHaveText(
            `Error: Enter March 8, 2026 at 2:30${AM} or later.`
        );
    });

    test('writes a year under 1000 in full, and shows a year past any date as written', async ({
        page,
    }) => {
        await openWith(
            page,
            `<form><label for="old">Old</label><input id="old" type="date" min="0050-01-01">
<label for="far">Far</label><input id="far" type="datetime-local" max="275760-09-13T12:00">
<button type="submit">Send</button></form>`
        );
        // No engine takes a limit past the last day a script can hold, so the field reports one
        // as an engine that did would.
        await page.locator('#far').evaluate((field) => {
            const over = { valid: false, rangeOverflow: true };
            Object.defineProperty(field, 'validity', { get: () => over });
        });
        await sendDated(page, { old: '0049-12-31' });
        expect(await datedErrors(page)).toEqual({
            'old-error': 'Error: Enter January 1, 0050 or later.',
            'far-error': 'Error: Enter 275760-09-13T12:00 or earlier.',
        });
    });

    test("gives a page in another language a date in US English, as the kit's words are", async ({
        page,
    }) => {
        await openWith(
            page,
            `<form><label for="day">Day</label><input id="day" type="date" min="2026-11-22">
<div lang="en-GB"><label for="near">Near</label><input id="near" type="date" min="2026-11-22"></div>
<button type="submit">Send</button></form>`
        );
        await page.evaluate(() => {
            document.documentElement.lang = 'fr';
        });
        await sendDated(page, { day: '2026-11-21', near: '2026-11-21' });
        await expect(page.locator('#day-error')).toHaveText(
            'Error: Enter November 22, 2026 or later.'
        );
        // The nearest language, an English part of the page, over the page's own.
        await expect(page.locator('#near-error')).toHaveText(
            'Error: Enter 22 November 2026 or later.'
        );
    });

    test('gives an overnight window for a time its limits wrap around', async ({ page }) => {
        await openWith(
            page,
            `<form><label for="shift">Shift</label><input id="shift" type="time" min="22:00" max="06:00">
<button type="submit">Send</button></form>`
        );
        await sendDated(page, { shift: '12:00' });
        await expect(page.locator('#shift-error')).toHaveText(
            `Error: Enter a time between 10:00${PM} and 6:00${AM} the next day.`
        );
    });

    test('keeps a window overnight to limits that parse with the most before the least', async ({
        page,
    }) => {
        await openWith(
            page,
            `<form><label for="same">Same</label><input id="same" type="time" min="22:00:00" max="22:00">
<label for="bad">Bad</label><input id="bad" type="time" min="late" max="06:00">
<button type="submit">Send</button></form>`
        );
        await sendDated(page, { same: '23:00', bad: '07:00' });
        expect(await datedErrors(page)).toEqual({
            'same-error': `Error: Enter 10:00${PM} or earlier.`,
            'bad-error': `Error: Enter 6:00${AM} or earlier.`,
        });
    });

    test('shows the fraction of a second a limit holds, so the limit shown is one the field takes', async ({
        page,
    }) => {
        await openWith(
            page,
            `<form><label for="lap">Lap</label><input id="lap" type="time" step="0.1" min="09:00:00.5">
<button type="submit">Send</button></form>`
        );
        await sendDated(page, { lap: '09:00:00.4' });
        await expect(page.locator('#lap-error')).toHaveText(
            `Error: Enter 9:00:00.5${AM} or later.`
        );
    });

    test("names a limit in the Gregorian calendar and Latin digits, whatever the language's tag picks", async ({
        page,
    }) => {
        await openWith(
            page,
            `<form><div lang="en-u-ca-buddhist"><label for="day">Day</label><input id="day" type="date" max="2026-11-22"></div>
<div lang="en-u-nu-arab"><label for="at">At</label><input id="at" type="time" max="17:30"></div>
<button type="submit">Send</button></form>`
        );
        await sendDated(page, { day: '2026-11-23', at: '18:00' });
        expect(await datedErrors(page)).toEqual({
            'day-error': 'Error: Enter November 22, 2026 or earlier.',
            'at-error': `Error: Enter 5:30${PM} or earlier.`,
        });
    });

    test("counts a number field's steps from its value attribute where it has no least, as the browser does", async ({
        page,
    }) => {
        await openWith(
            page,
            `<form><label for="count">Count</label><input id="count" type="number" step="5" value="2">
<button type="submit">Send</button></form>`
        );
        await sendDated(page, { count: '9' });
        await expect(page.locator('#count-error')).toHaveText(
            'Error: Enter 2, or 2 plus a multiple of 5.'
        );
        // The value the words point to is one the browser takes.
        await sendDated(page, { count: '7' });
        await expect(page.locator('#count-error')).toHaveCount(0);
        expect(await submits(page)).toBe(1);
    });

    test('takes the language of the page around a shadow root a field sits in', async ({
        page,
    }) => {
        await servePage(page, {
            title: 'Join',
            body: '<main><h1>Join</h1><div id="widget"></div><p class="screen-status" role="status"></p></main>',
            script: `import { attachForm } from './controls.js';
document.documentElement.lang = 'en-GB';
const root = document.querySelector('#widget').attachShadow({ mode: 'open' });
root.innerHTML = '<form><label for="day">Day</label><input id="day" type="date" min="2026-11-22" value="2026-11-21"><button type="submit">Send</button></form>';
attachForm(root.querySelector('form'), { status: document.querySelector('.screen-status') });
window.ready = true;`,
        });
        await page.waitForFunction(() => 'ready' in window);
        await page.getByRole('button', { name: 'Send' }).click();
        await expect(page.locator('#widget .dk-field-error')).toHaveText(
            'Error: Enter 22 November 2026 or later.'
        );
    });
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

/**
 * Keeps every write to a line a screen reader hears, the stepper's own, the page's or a second line
 * of the page's, as the page makes it, so a test reads which lines spoke and what each said.
 */
const listen = (page: Page) =>
    page.evaluate(() => {
        const said: string[] = [];
        (window as unknown as { said: string[] }).said = said;
        new MutationObserver((records) => {
            for (const { target } of records) {
                const line = (target instanceof Element ? target : target.parentElement)?.closest(
                    '[role="status"]'
                );
                const words = line?.textContent ?? '';
                if (!line || words === '') continue;
                const which = line.matches('.dk-stepper-status')
                    ? 'stepper'
                    : line.matches('.second-status')
                      ? 'second'
                      : 'page';
                said.push(`${which}: ${words}`);
            }
        }).observe(document.body, { childList: true, characterData: true, subtree: true });
    });

/** What the lines said so far, every write, a repeat among them. */
const saidSoFar = (page: Page) =>
    page.evaluate(() => (window as unknown as { said: string[] }).said);

/** Forgets what the lines said, so a later step's words are read alone. */
const forget = (page: Page) =>
    page.evaluate(() => {
        (window as unknown as { said: string[] }).said.length = 0;
    });

/**
 * What the lines said once a refusal has been said on the page's line: the page's clock, which
 * stands still, is stepped until the refusal is put in, then past the wait any other message would
 * be put in after, so a second write is caught.
 */
const saidOf = async (page: Page) => {
    await expect
        .poll(async () => {
            await page.clock.runFor(100);
            return (await saidSoFar(page)).some((one) => one.startsWith('page: '));
        })
        .toBe(true);
    await page.clock.runFor(500);
    return saidSoFar(page);
};

/** What the lines said with the clock stepped past the wait a message is put in after. */
const saidAfterWait = async (page: Page) => {
    await page.clock.runFor(500);
    return saidSoFar(page);
};

/** The errors shown in the bid's field, and the errors among what describes the bid. */
const bidErrors = (page: Page) =>
    page.locator('#bid').evaluate((bid) => ({
        drawn: [...(bid.closest('.dk-field')?.querySelectorAll('.dk-field-error') ?? [])]
            .filter((error) => error.checkVisibility())
            .map((error) => error.textContent.trim()),
        described: (bid.getAttribute('aria-describedby') ?? '')
            .split(/\s+/)
            .map((id) => document.getElementById(id))
            .filter((part) => part?.matches('.dk-field-error') && part.checkVisibility())
            .map((part) => part?.textContent.trim()),
    }));

/** The words the bid's range error shows, and the error as it reads with the word it starts with. */
const OWN = 'Enter a whole number from 0 to 10.';
const RANGE = `Error: ${OWN}`;

/**
 * How a test draws the bid: required or not, with a value or blank, speaking through a `say` on a
 * second line, in a form given words of the page's for a failure, in a form the kit does not check,
 * which the page marks `novalidate` and handles itself, and marked off by a set around it.
 */
type Bid = {
    readonly unchecked?: boolean;
    readonly off?: boolean;
    readonly required?: boolean;
    readonly blank?: boolean;
    readonly second?: boolean;
    /** Speaking on a second status line of the page's, given as its `status`. */
    readonly line?: boolean;
    readonly summary?: boolean;
    /** In the React form, with its set of sizes left unchosen. */
    readonly unchosen?: boolean;
    readonly errorWords?: Record<string, string>;
    /** Handed to a page that draws its own errors, which keeps both lists it is handed. */
    readonly own?: boolean;
    /** In a form with a reset button. */
    readonly reset?: boolean;
    /** Drawn at 99, past its range. */
    readonly high?: boolean;
    /** Drawn with an error of the page's own, "That bid is taken." */
    readonly taken?: boolean;
    /** In a form attached with a signal, aborted by `window.detachForm`. */
    readonly detachable?: boolean;
    /** In the React form, whose page clears its errors on a reset. */
    readonly clears?: boolean;
    /** With a Save button below the bid, which an error drawn above the button moves. */
    readonly below?: boolean;
    /** With a Save button after the form, tied to it by `form`, below the bid. */
    readonly outside?: boolean;
    /** With an Add button below the bid that submits nothing. */
    readonly plain?: boolean;
    /** With a link below the bid. */
    readonly link?: boolean;
};

/** The ways of drawing the bid that the React page reads from its root's `data-bid`. */
const DRAWN_AS = [
    'required',
    'blank',
    'summary',
    'reset',
    'high',
    'taken',
    'clears',
    'below',
    'outside',
    'plain',
    'link',
] as const;

/** What a test draws below the bid in the form: a Save button, an Add button or a link. */
const Below = ({ drawn }: { readonly drawn: Bid }) => (
    <>
        {drawn.below ? <button type="submit">Save</button> : null}
        {drawn.plain ? <button type="button">Add</button> : null}
        {drawn.link ? <a href="#more">More</a> : null}
    </>
);

/** The bid in a form attached with `attachForm`, on a clock that stands still. */
const openBid = async (page: Page, drawn: Bid = {}) => {
    const { required = false, blank = false, unchecked = false, off = false } = drawn;
    await stillClock(page.clock);
    await servePage(page, {
        title: 'Bid',
        body: renderToStaticMarkup(
            <main>
                <h1>Bid</h1>
                <form id="bid-form" noValidate={unchecked}>
                    <InputField id="name" name="name" label="Name" required />
                    {/* Above the bid, so an error drawn as focus leaves the bid never moves it. */}
                    <button type="submit">Send</button>
                    <div aria-disabled={off ? 'true' : undefined}>
                        <StepperField
                            id="bid"
                            name="bid"
                            label="Bid"
                            min={0}
                            max={10}
                            defaultValue={blank ? undefined : drawn.high ? 99 : 5}
                            required={required}
                            error={drawn.taken ? 'That bid is taken.' : undefined}
                        />
                    </div>
                    <Below drawn={drawn} />
                    {drawn.reset ? <button type="reset">Clear</button> : null}
                    <p id="count">0</p>
                </form>
                {drawn.outside ? (
                    <button type="submit" form="bid-form">
                        Save
                    </button>
                ) : null}
                <StatusLine className="screen-status" />
                <StatusLine className="second-status" />
            </main>
        ),
        script: `import { attachForm, attachStatus, attachStepper } from './controls.js';
const drawn = ${JSON.stringify(drawn)};
const form = document.querySelector('form');
window.attachStepper = attachStepper;
window.attachForm = attachForm;
window.detachStepper = attachStepper(
    document.querySelector('.dk-stepper'),
    drawn.second
        ? { say: attachStatus(document.querySelector('.second-status')) }
        : drawn.line
          ? { status: document.querySelector('.second-status') }
          : undefined
);
const controller = new AbortController();
window.detachForm = () => controller.abort();
if (!drawn.unchecked)
    attachForm(form, {
        signal: drawn.detachable ? controller.signal : undefined,
        status: document.querySelector('.screen-status'),
        errorWords: drawn.errorWords,
        invalid: drawn.own
            ? (failures, shown) => {
                  const named = (list) => list.map(({ field, control, words }) =>
                      field.id + ' ' + control.id + ': ' + words);
                  window.handed = named(failures);
                  window.shown = named(shown);
              }
            : undefined,
    });
form.addEventListener('submit', (event) => {
    event.preventDefault();
    const count = document.querySelector('#count');
    count.textContent = String(Number(count.textContent) + 1);
});
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    await listen(page);
};

/**
 * Chooses the React page's size by the keyboard. A pointer `check()` on the radio once found it
 * unchanged in Firefox on a runner. The likely cause is Firefox's list of words a form sent before,
 * which opens under the name just filled and swallows a press made as it opens, and which the
 * Firefox project turns off. A key pressed on the focused radio reaches the radio itself, whatever
 * lies over the point a click would land on.
 */
const chooseSmall = async (page: Page) => {
    const small = page.getByLabel('Small');
    await small.focus();
    await small.press('Space');
    await expect(small).toBeChecked();
};

test('leaves a stepper that speaks through a say of its own unsaid on a refused submit', async ({
    page,
}) => {
    await openBid(page, { second: true });
    await page.getByLabel('Name').fill('Ana');
    const bid = page.getByRole('spinbutton', { name: 'Bid' });
    await bid.fill('99');
    await bid.press('Enter');
    expect(await saidOf(page)).toEqual([`page: Bid: ${RANGE}`]);
});

test("takes a stepper's words back from a line of the page's it was given, on a refused submit", async ({
    page,
}) => {
    await openBid(page, { line: true });
    await page.getByLabel('Name').fill('Ana');
    const bid = page.getByRole('spinbutton', { name: 'Bid' });
    await bid.fill('99');
    await bid.press('Enter');
    expect(await saidOf(page)).toEqual([`page: Bid: ${RANGE}`]);
    await expect(page.locator('.second-status')).toHaveText('');
});

for (const [drawn, where] of [
    [{ unchecked: true }, 'a form the page handles itself, with no check of the kit'],
    [{ off: true }, 'a checked form that passes over it, marked off'],
] as const)
    test(`leaves a stepper's own error said once in ${where}`, async ({ page }) => {
        await openBid(page, drawn);
        await page.getByLabel('Name').fill('Ana');
        const bid = page.getByRole('spinbutton', { name: 'Bid' });
        // Forced, since a field under a set marked off is not one Playwright takes for enabled.
        await bid.fill('99', { force: true });
        await bid.focus();
        await page.keyboard.press('Enter');
        // No refusal follows to say it, so the stepper's own words are the ones heard.
        await expect(page.locator('#count')).toHaveText('1');
        expect(await saidAfterWait(page)).toEqual([`stepper: Bid: ${RANGE}`]);
        expect((await bidErrors(page)).drawn).toEqual([RANGE]);
    });

for (const nested of [false, true])
    test(`hands a page that draws its own errors every failure with the words its field shows, a stepper showing its own among them${nested ? ', its hidden start nested' : ''}`, async ({
        page,
    }) => {
        await openBid(page, { own: true });
        // The word a screen reader alone is given is left out wherever it sits in the error.
        if (nested)
            await page.locator('#bid-range').evaluate((range) => {
                const hidden = range.querySelector('.dk-visually-hidden');
                const holder = document.createElement('span');
                hidden?.replaceWith(holder);
                if (hidden) holder.append(hidden);
                // Its words wrapped over lines, as markup written by hand wraps them.
                const words = [...range.childNodes].find(
                    (node) => node.nodeType === Node.TEXT_NODE
                );
                if (words) words.textContent = '\n    Enter a whole number\n    from 0 to 10.\n';
            });
        const bid = page.getByRole('spinbutton', { name: 'Bid' });
        await bid.fill('99');
        await bid.press('Enter');
        const lists = await page.evaluate(() => {
            const { handed, shown } = window as unknown as { handed: string[]; shown: string[] };
            return { handed, shown };
        });
        expect(lists).toEqual({
            handed: ['name name: Enter a value.'],
            shown: ['name name: Enter a value.', `bid bid: ${OWN}`],
        });
        await expect(page.locator('#count')).toHaveText('0');
    });

test('hands a page that draws its own errors nothing for a required stepper submitted blank, and lists it with its own words', async ({
    page,
}) => {
    await openBid(page, { required: true, blank: true, own: true });
    await page.getByLabel('Name').fill('Ana');
    await page.getByRole('button', { name: 'Send' }).click();
    const lists = await page.evaluate(() => {
        const { handed, shown } = window as unknown as { handed: string[]; shown: string[] };
        return { handed, shown };
    });
    expect(lists).toEqual({ handed: [], shown: [`bid bid: ${OWN}`] });
    expect(await bidErrors(page)).toEqual({ drawn: [RANGE], described: [RANGE] });
});

test("takes away the kit's error a stepper refused by the page showed, once its own error shows", async ({
    page,
}) => {
    await openBid(page);
    await page.getByLabel('Name').fill('Ana');
    const bid = page.getByRole('spinbutton', { name: 'Bid' });
    await bid.evaluate((input) => {
        (input as HTMLInputElement).setCustomValidity('Pick another bid.');
    });
    await page.getByRole('button', { name: 'Send' }).click();
    expect((await bidErrors(page)).drawn).toEqual(['Error: Pick another bid.']);
    // The page's refusal stays as a value past the range is typed, so the stepper's own error shows.
    await bid.fill('99');
    await bid.press('Enter');
    await expect.poll(async () => (await bidErrors(page)).drawn).toEqual([RANGE]);
    expect((await bidErrors(page)).described).toEqual([RANGE]);
    await expect(bid).toHaveAttribute('aria-invalid', 'true');
});

test("shows a stepper's range error on a reset that brings back a value past its range, past the kit's error", async ({
    page,
}) => {
    await openBid(page, { high: true, reset: true });
    await page.getByLabel('Name').fill('Ana');
    const bid = page.getByRole('spinbutton', { name: 'Bid' });
    await expect(page.locator('#bid-range')).toBeVisible();
    await bid.fill('5');
    await bid.evaluate((input) => {
        (input as HTMLInputElement).setCustomValidity('Pick another bid.');
    });
    await page.getByRole('button', { name: 'Send' }).click();
    expect((await bidErrors(page)).drawn).toEqual(['Error: Pick another bid.']);
    await page.getByRole('button', { name: 'Clear' }).click();
    await page.clock.runFor(100);
    expect(await bidErrors(page)).toEqual({ drawn: [RANGE], described: [RANGE] });
    await expect(bid).toHaveAttribute('aria-invalid', 'true');
});

test("takes away the mark a stepper put back once its form's attach is taken down", async ({
    page,
}) => {
    await openBid(page, { high: true, detachable: true });
    const bid = page.getByRole('spinbutton', { name: 'Bid' });
    await expect(bid).toHaveAttribute('aria-invalid', 'true');
    await bid.fill('5');
    await expect(bid).toHaveAttribute('aria-invalid', 'false');
    await page.evaluate(() => {
        (window as unknown as { detachForm: () => void }).detachForm();
    });
    await page.clock.runFor(100);
    await expect(bid).not.toHaveAttribute('aria-invalid');
});

test('takes away the mark of a stepper taken down before its form, once both are down', async ({
    page,
}) => {
    await openBid(page, { high: true, detachable: true });
    const bid = page.getByRole('spinbutton', { name: 'Bid' });
    await bid.fill('5');
    await expect(bid).toHaveAttribute('aria-invalid', 'false');
    await page.evaluate(() => {
        const drawn = window as unknown as { detachStepper: () => void; detachForm: () => void };
        drawn.detachStepper();
        drawn.detachForm();
    });
    await page.clock.runFor(100);
    await expect(bid).not.toHaveAttribute('aria-invalid');
});

test('leaves the mark a later check of its form set on a stepper that outlived the first', async ({
    page,
}) => {
    await openBid(page, { high: true, detachable: true });
    const bid = page.getByRole('spinbutton', { name: 'Bid' });
    await bid.fill('5');
    await expect(bid).toHaveAttribute('aria-invalid', 'false');
    await page.evaluate(() => {
        (window as unknown as { detachForm: () => void }).detachForm();
    });
    await page.clock.runFor(100);
    await expect(bid).not.toHaveAttribute('aria-invalid');
    await page.evaluate(() => {
        const drawn = window as unknown as {
            attachForm: (form: Element | null) => void;
            detachStepper: () => void;
        };
        drawn.attachForm(document.querySelector('form'));
        drawn.detachStepper();
    });
    await page.clock.runFor(100);
    await expect(bid).toHaveAttribute('aria-invalid', 'false');
});

test('holds no input of a stepper drawn again and again in one form once each has left the page', async ({
    page,
}) => {
    await openBid(page, { detachable: true });
    type Rounds = {
        attachStepper: (stepper: Element, options: { signal: AbortSignal }) => void;
        detachForm: () => void;
        rounds: HTMLInputElement[];
    };
    await page.evaluate(() => {
        const drawn = window as unknown as Rounds;
        const field = document.querySelector('.dk-field:has(.dk-stepper)');
        if (!field) throw new Error('the page has no stepper');
        drawn.rounds = [];
        for (const round of [1, 2, 3, 4, 5]) {
            // Each round's stepper is drawn afresh, as a page keyed by the round draws it, and
            // leaves the page as its teardown is called, as React's does.
            const copy = field.cloneNode(true) as HTMLElement;
            for (const named of copy.querySelectorAll('[id]')) named.id += `-${String(round)}`;
            field.after(copy);
            const input = copy.querySelector('input');
            const stepper = copy.querySelector('.dk-stepper');
            if (!input || !stepper) throw new Error('the stepper has no value');
            const controller = new AbortController();
            drawn.attachStepper(stepper, { signal: controller.signal });
            input.value = '99';
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.value = '5';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            controller.abort();
            copy.remove();
            drawn.rounds.push(input);
        }
    });
    const unmarked = await page.evaluate(() => {
        const drawn = window as unknown as Rounds;
        const marks = drawn.rounds.map((input) => input.getAttribute('aria-invalid'));
        // A mark set on each by hand outlives the form's teardown only where its list let go of
        // the input, since the teardown takes away every mark the list holds.
        for (const input of drawn.rounds) input.setAttribute('aria-invalid', 'false');
        drawn.detachForm();
        return marks;
    });
    expect.soft(unmarked).toEqual([null, null, null, null, null]);
    await page.clock.runFor(100);
    expect(
        await page.evaluate(() =>
            (window as unknown as Rounds).rounds.map((input) => input.getAttribute('aria-invalid'))
        )
    ).toEqual(['false', 'false', 'false', 'false', 'false']);
});

test('keeps the mark of a stepper taken down and attached again on the same value', async ({
    page,
}) => {
    await openBid(page, { high: true });
    const bid = page.getByRole('spinbutton', { name: 'Bid' });
    await bid.fill('5');
    await expect(bid).toHaveAttribute('aria-invalid', 'false');
    // As a page's effect runs again with new options, the old attach's takedown landing after.
    await page.evaluate(() => {
        const drawn = window as unknown as {
            attachStepper: (stepper: Element | null) => void;
            detachStepper: () => void;
        };
        drawn.detachStepper();
        drawn.attachStepper(document.querySelector('.dk-stepper'));
    });
    await page.clock.runFor(100);
    await expect(bid).toHaveAttribute('aria-invalid', 'false');
});

/** The test page's hooks for attaching forms of its own, and the bid once it has left. */
type Forms = {
    attachForm: (form: Element | null, options: { signal: AbortSignal }) => void;
    detachStepper: () => void;
    forms: AbortController[];
    left: Element | null;
};

/**
 * Takes the bid off the page and its stepper down, then finds the mark gone and, with a mark set by
 * hand, every form's check taken down without reaching it, so no form's list held the bid.
 */
const releasedByEvery = async (page: Page) => {
    await page.evaluate(() => {
        const drawn = window as unknown as Forms;
        drawn.left = document.querySelector('#bid');
        drawn.left?.closest('.dk-field')?.remove();
        drawn.detachStepper();
    });
    const markOf = () =>
        page.evaluate(() => (window as unknown as Forms).left?.getAttribute('aria-invalid'));
    expect.soft(await markOf()).toBeNull();
    await page.evaluate(() => {
        const drawn = window as unknown as Forms;
        drawn.left?.setAttribute('aria-invalid', 'false');
        for (const form of drawn.forms) form.abort();
    });
    await page.clock.runFor(100);
    expect(await markOf()).toBe('false');
};

test('lets go of a stepper the form marked itself once it leaves the page', async ({ page }) => {
    // The form is checked only after the stepper's error has cleared, so the form marks it first.
    await openBid(page, { high: true, unchecked: true });
    const bid = page.getByRole('spinbutton', { name: 'Bid' });
    await bid.fill('5');
    await expect(bid).not.toHaveAttribute('aria-invalid');
    await page.evaluate(() => {
        const drawn = window as unknown as Forms;
        const controller = new AbortController();
        drawn.forms = [controller];
        drawn.attachForm(document.querySelector('form'), { signal: controller.signal });
    });
    await expect(bid).toHaveAttribute('aria-invalid', 'false');
    await releasedByEvery(page);
});

test('lets go of a stepper moved between two checked forms once it leaves the page', async ({
    page,
}) => {
    await openBid(page, { unchecked: true });
    await page.evaluate(() => {
        const drawn = window as unknown as Forms;
        const first = document.querySelector('form');
        const second = document.createElement('form');
        first?.after(second);
        drawn.forms = [new AbortController(), new AbortController()];
        for (const [at, form] of [first, second].entries()) {
            const controller = drawn.forms[at];
            if (controller) drawn.attachForm(form, { signal: controller.signal });
        }
        // Marked by the first form as it is checked, then moved to the second, where its error
        // shows and clears.
        const input = document.querySelector<HTMLInputElement>('#bid');
        const field = input?.closest('.dk-field');
        if (!input || !field) throw new Error('the page has no bid');
        second.append(field);
        input.value = '99';
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.value = '5';
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.getByRole('spinbutton', { name: 'Bid' })).toHaveAttribute(
        'aria-invalid',
        'false'
    );
    await releasedByEvery(page);
});

test('takes away the mark a stepper outside any attached form set as its error clears', async ({
    page,
}) => {
    await openBid(page, { unchecked: true });
    const bid = page.getByRole('spinbutton', { name: 'Bid' });
    await expect(bid).not.toHaveAttribute('aria-invalid');
    await bid.fill('99');
    await bid.press('Tab');
    await expect(bid).toHaveAttribute('aria-invalid', 'true');
    await bid.fill('5');
    await expect(bid).not.toHaveAttribute('aria-invalid');
});

/*
 * A stepper is wrong exactly where the browser's constraints say its field is, and where its own
 * error shows at a submit that error is the one error, said once by the refusal, in a form the kit
 * draws its errors in and in one React draws.
 */
test('keeps the click of a button below a stepper in no form typed past its range', async ({
    page,
}) => {
    await stillClock(page.clock);
    await servePage(page, {
        title: 'Bid',
        body: renderToStaticMarkup(
            <main>
                <h1>Bid</h1>
                <StepperField id="bid" name="bid" label="Bid" min={0} max={10} defaultValue={5} />
                <button type="button">Add</button>
            </main>
        ),
        script: `import { attachStepper } from './controls.js';
attachStepper(document.querySelector('.dk-stepper'));
const add = document.querySelector('main > button');
let clicks = 0;
add.addEventListener('click', () => {
    clicks += 1;
    add.dataset.clicks = String(clicks);
});
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    const bid = page.getByRole('spinbutton', { name: 'Bid' });
    await bid.fill('99');
    const add = page.getByRole('button', { name: 'Add' });
    const box = await add.boundingBox();
    if (!box) throw new Error('the page has no Add');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.up();
    await expect(add).toHaveAttribute('data-clicks', '1');
    await expect
        .poll(async () => {
            await page.clock.runFor(100);
            return (await bidErrors(page)).drawn;
        })
        .toEqual([RANGE]);
});

for (const way of ['attachForm', 'useFormRefusal'] as const) {
    test.describe(`a stepper in a form refused through ${way}`, () => {
        let app = '';
        test.beforeAll(async () => {
            if (way !== 'useFormRefusal') return;
            test.setTimeout(120_000);
            app = await bundle('checked-page.tsx');
        });

        /** Draws the form, with every field but the bid filled in unless the name is left blank. */
        const openWay = async (page: Page, drawn: Bid = {}, name = 'Ana') => {
            if (way === 'attachForm') await openBid(page, drawn);
            else {
                const how = DRAWN_AS.filter((as) => drawn[as]);
                await stillClock(page.clock);
                await servePage(page, {
                    title: 'Join',
                    body: `<div id="root" data-bid="${how.join(' ')}"></div>`,
                    script: app,
                });
                await listen(page);
                if (!drawn.unchosen) await chooseSmall(page);
            }
            if (name) await page.getByLabel('Name').fill(name);
        };

        const bidOf = (page: Page) => page.getByRole('spinbutton', { name: 'Bid' });
        const send = (page: Page) => page.getByRole('button', { name: /Send|Join/ });
        const handed = (page: Page) =>
            page.evaluate(() => (window as unknown as { handed: string[] }).handed);
        const shownOf = (page: Page) =>
            page.evaluate(() => (window as unknown as { shown: string[] }).shown);
        const clear = (page: Page) => page.getByRole('button', { name: 'Clear' });

        /** The bid refused with its own error alone, drawn, described and said once. */
        const refused = async (page: Page) => {
            expect(await saidOf(page)).toEqual([`page: Bid: ${RANGE}`]);
            expect(await bidErrors(page)).toEqual({ drawn: [RANGE], described: [RANGE] });
            await expect(bidOf(page)).toHaveAttribute('aria-invalid', 'true');
            await expect(bidOf(page)).toHaveAccessibleDescription(RANGE);
            await expect(bidOf(page)).toBeFocused();
            await expect(page.locator('#count')).toHaveText('0');
            // The stepper shows its own error, so the page is handed none to draw for it.
            if (way === 'useFormRefusal') expect(await handed(page)).toEqual([]);
        };

        test('shows one error for a stepper typed past its range and submitted by Enter, and says it once', async ({
            page,
        }) => {
            await openWay(page);
            await bidOf(page).fill('99');
            await bidOf(page).press('Enter');
            await refused(page);
        });

        /** The line a stepper's own words show on: its own, or the page's in React, through `say`. */
        const ownLine = way === 'attachForm' ? 'stepper' : 'page';

        /** Presses a control with the pointer, and lets go on it or dragged off the form. */
        const pressOn = async (page: Page, target: Locator, off = false) => {
            const box = await target.boundingBox();
            if (!box) throw new Error('the control is not drawn');
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.mouse.down();
            // Dragged off the form before it is let go, to the page's far corner, so no click
            // follows.
            if (off) {
                const size = page.viewportSize();
                if (!size) throw new Error('the page has no size');
                const [x, y] = [size.width - 1, size.height - 1];
                const outside = await page.evaluate(
                    ([atX, atY]) => !document.elementFromPoint(atX, atY)?.closest('form'),
                    [x, y] as const
                );
                expect(outside).toBe(true);
                await page.mouse.move(x, y, { steps: 4 });
            }
            await page.mouse.up();
        };

        const saveOf = (page: Page) => page.getByRole('button', { name: 'Save' });

        /** Presses Save, below the bid, with the pointer, and lets go on it or dragged off. */
        const pressSave = (page: Page, off = false) => pressOn(page, saveOf(page), off);

        /** The bid's error drawn once the clock has stepped past the press, and said once. */
        const shownAfter = async (page: Page) => {
            await expect
                .poll(async () => {
                    await page.clock.runFor(100);
                    return bidErrors(page);
                })
                .toEqual({ drawn: [RANGE], described: [RANGE] });
            expect(await saidAfterWait(page)).toEqual([`${ownLine}: Bid: ${RANGE}`]);
        };

        test('refuses on the one press of a button below a stepper typed past its range, pressed and let go by a pointer', async ({
            page,
        }) => {
            await openWay(page, { below: true });
            await bidOf(page).fill('99');
            await pressSave(page);
            await refused(page);
        });

        test('shows the error of a stepper typed past its range at once as Tab leaves it, above a button', async ({
            page,
        }) => {
            await openWay(page, { below: true });
            await bidOf(page).fill('99');
            await bidOf(page).press('Tab');
            expect(await bidErrors(page)).toEqual({ drawn: [RANGE], described: [RANGE] });
            expect(await saidAfterWait(page)).toEqual([`${ownLine}: Bid: ${RANGE}`]);
        });

        test('shows the error of a stepper typed past its range once a press below it is dragged off and let go', async ({
            page,
        }) => {
            await openWay(page, { below: true });
            await bidOf(page).fill('99');
            await pressSave(page, true);
            await shownAfter(page);
            await expect(page.locator('#count')).toHaveText('0');
        });

        test('refuses on the one press of a Save button outside the form, tied to it and below a stepper typed past its range', async ({
            page,
        }) => {
            await openWay(page, { outside: true });
            await bidOf(page).fill('99');
            await pressSave(page);
            await refused(page);
        });

        test('keeps the click of a button below a stepper typed past its range that submits nothing, and shows the error after it', async ({
            page,
        }) => {
            await openWay(page, { plain: true });
            const add = page.getByRole('button', { name: 'Add' });
            await add.evaluate((button) => {
                button.addEventListener('click', () => {
                    button.dataset['clicks'] = String(Number(button.dataset['clicks'] ?? 0) + 1);
                });
            });
            await bidOf(page).fill('99');
            await pressOn(page, add);
            await shownAfter(page);
            await expect(add).toHaveAttribute('data-clicks', '1');
        });

        test('shows the error of a stepper typed past its range once a press on a link below it turns into a drag', async ({
            page,
        }) => {
            await openWay(page, { link: true });
            await bidOf(page).fill('99');
            await pressOn(page, page.getByRole('link', { name: 'More' }), true);
            await shownAfter(page);
            await expect(page.locator('#count')).toHaveText('0');
        });

        test('takes away the error of a stepper put right before a press on Save below it, and saves on that press', async ({
            page,
        }) => {
            await openWay(page, { below: true });
            await bidOf(page).fill('99');
            await bidOf(page).press('Tab');
            expect((await bidErrors(page)).drawn).toEqual([RANGE]);
            await bidOf(page).fill('5');
            const box = await saveOf(page).boundingBox();
            if (!box) throw new Error('the page has no Save');
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.mouse.down();
            // Cleared as the value is typed right, before the press, so nothing waits for it.
            expect(await bidErrors(page)).toEqual({ drawn: [], described: [] });
            await page.mouse.up();
            await page.clock.runFor(500);
            await expect(page.locator('#count')).toHaveText('1');
            expect(await bidErrors(page)).toEqual({ drawn: [], described: [] });
            await expect(bidOf(page)).toHaveAttribute('aria-invalid', 'false');
        });

        test.describe('by touch', () => {
            test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });
            // Pinned in the engines of the phones the kit is walked on, Chrome's and Safari's.
            test.skip(({ browserName }) => browserName === 'firefox', 'touch is pinned elsewhere');

            test('refuses on the one tap of a button below a stepper typed past its range', async ({
                page,
            }) => {
                await openWay(page, { below: true });
                await bidOf(page).fill('99');
                await saveOf(page).tap();
                await refused(page);
            });
        });

        test('says one message for a stepper typed past its range and submitted by a press on the button', async ({
            page,
        }) => {
            await openWay(page);
            await bidOf(page).fill('99');
            await send(page).click();
            await refused(page);
        });

        test("says the refusal alone where a stepper's error shows and another field is named", async ({
            page,
        }) => {
            await openWay(page, {}, '');
            await bidOf(page).fill('99');
            await bidOf(page).press('Enter');
            const [name, count] =
                way === 'attachForm' ? ['Enter a value.', '2'] : ['Enter your name.', '2'];
            expect(await saidOf(page)).toEqual([
                `page: Name: Error: ${name} ${count} fields need attention.`,
            ]);
            expect(await bidErrors(page)).toEqual({ drawn: [RANGE], described: [RANGE] });
            if (way === 'useFormRefusal')
                expect(await handed(page)).toEqual(['name: Enter your name.']);
        });

        test('says the refusal after the error a stepper left by Tab said of its own', async ({
            page,
        }) => {
            await openWay(page);
            await bidOf(page).fill('99');
            await bidOf(page).press('Tab');
            // Focus has left the value, so the stepper says its error then, and it is heard.
            const own = way === 'attachForm' ? `stepper: Bid: ${RANGE}` : `page: Bid: ${RANGE}`;
            expect(await saidAfterWait(page)).toEqual([own]);
            await forget(page);
            await send(page).focus();
            await send(page).press('Enter');
            await refused(page);
        });

        test('saves a stepper left blank that is not required, with no error', async ({ page }) => {
            await openWay(page);
            await bidOf(page).fill('');
            await bidOf(page).press('Enter');
            await expect(page.locator('#count')).toHaveText('1');
            expect(await saidAfterWait(page)).toEqual([]);
            expect(await bidErrors(page)).toEqual({ drawn: [], described: [] });
            await expect(bidOf(page)).not.toHaveAttribute('aria-invalid', 'true');
            await expect(bidOf(page)).toHaveAccessibleDescription('From 0 to 10.');
        });

        test('shows no error on a stepper left blank that is not required as focus leaves it', async ({
            page,
        }) => {
            await openWay(page);
            await bidOf(page).fill('');
            await bidOf(page).blur();
            expect(await saidAfterWait(page)).toEqual([]);
            expect(await bidErrors(page)).toEqual({ drawn: [], described: [] });
            await expect(bidOf(page)).not.toHaveAttribute('aria-invalid', 'true');
        });

        test('refuses a required stepper filled then emptied, with its own error', async ({
            page,
        }) => {
            await openWay(page, { required: true });
            await bidOf(page).fill('');
            await bidOf(page).press('Enter');
            await refused(page);
        });

        test('refuses a stepper holding 2.5, with its own error', async ({ page }) => {
            await openWay(page);
            await bidOf(page).fill('2.5');
            await bidOf(page).press('Enter');
            await refused(page);
        });

        for (const by of ['Enter', 'a press on the button'] as const)
            test(`shows one error for a stepper holding a letter submitted by ${by} right after it is typed, and says it once`, async ({
                page,
            }) => {
                await openWay(page);
                await bidOf(page).fill('');
                await bidOf(page).blur();
                await bidOf(page).pressSequentially('e');
                // A press moves focus off the letters first, which shows the stepper's error, and
                // the refusal straight after takes back its words, so the refusal is said alone.
                if (by === 'Enter') await bidOf(page).press('Enter');
                else await send(page).click();
                await refused(page);
            });

        test('says the error for letters left by Tab, then the refusal alone', async ({ page }) => {
            await openWay(page);
            await bidOf(page).fill('');
            await bidOf(page).blur();
            await bidOf(page).pressSequentially('e');
            await bidOf(page).press('Tab');
            const own = way === 'attachForm' ? `stepper: Bid: ${RANGE}` : `page: Bid: ${RANGE}`;
            expect(await saidAfterWait(page)).toEqual([own]);
            expect(await bidErrors(page)).toEqual({ drawn: [RANGE], described: [RANGE] });
            await expect(bidOf(page)).toHaveAttribute('aria-invalid', 'true');
            await forget(page);
            await send(page).focus();
            await send(page).press('Enter');
            await refused(page);
        });

        test("refuses a required stepper drawn blank and never touched with its own error, past the page's words", async ({
            page,
        }) => {
            await openWay(page, {
                required: true,
                blank: true,
                errorWords: { valueMissing: 'Fill this in.' },
            });
            expect(await bidErrors(page)).toEqual({ drawn: [], described: [] });
            await expect(bidOf(page)).not.toHaveAttribute('aria-invalid', 'true');
            await send(page).click();
            // The stepper owns its error, so the form draws none and the page is handed none.
            await refused(page);
            await expect(page.locator('#bid-error')).toHaveCount(0);
            if (way === 'useFormRefusal') expect(await shownOf(page)).toEqual([`bid: ${OWN}`]);
        });

        test('shows one error on a required stepper submitted blank once a value past its range is typed', async ({
            page,
        }) => {
            await openWay(page, { required: true, blank: true });
            await send(page).click();
            await refused(page);
            await bidOf(page).fill('99');
            await bidOf(page).press('Tab');
            expect(await bidErrors(page)).toEqual({ drawn: [RANGE], described: [RANGE] });
            await expect(page.locator('#bid-error')).toHaveCount(0);
            await page.clock.runFor(500);
            await forget(page);
            await send(page).focus();
            await send(page).press('Enter');
            await refused(page);
        });

        test('marks a stepper submitted blank, then past its range, not invalid once put right', async ({
            page,
        }) => {
            await openWay(page, { required: true, blank: true });
            await send(page).click();
            await refused(page);
            await forget(page);
            await bidOf(page).fill('99');
            await bidOf(page).press('Enter');
            await refused(page);
            await bidOf(page).fill('5');
            await expect(page.locator('#bid-range')).toBeHidden();
            await expect(bidOf(page)).toHaveAttribute('aria-invalid', 'false');
        });

        test("puts back the form's mark as a stepper's error clears by a value put right", async ({
            page,
        }) => {
            await openWay(page);
            await expect(bidOf(page)).toHaveAttribute('aria-invalid', 'false');
            await bidOf(page).fill('99');
            await bidOf(page).press('Tab');
            await expect(bidOf(page)).toHaveAttribute('aria-invalid', 'true');
            await bidOf(page).fill('5');
            await expect(bidOf(page)).toHaveAttribute('aria-invalid', 'false');
        });

        test("puts back the form's mark as a stepper's error clears by a reset", async ({
            page,
        }) => {
            await openWay(page, { reset: true });
            await bidOf(page).fill('99');
            await bidOf(page).press('Tab');
            await expect(bidOf(page)).toHaveAttribute('aria-invalid', 'true');
            await clear(page).click();
            await page.clock.runFor(100);
            await expect(page.locator('#bid-range')).toBeHidden();
            await expect(bidOf(page)).toHaveAttribute('aria-invalid', 'false');
        });

        test("says the form is cleared once on a reset that takes a stepper's refused error away", async ({
            page,
        }) => {
            await openWay(page, { reset: true });
            await bidOf(page).fill('99');
            await bidOf(page).press('Enter');
            await refused(page);
            await forget(page);
            await clear(page).click();
            expect(await saidAfterWait(page)).toEqual(['page: Form cleared.']);
            expect(await bidErrors(page)).toEqual({ drawn: [], described: [] });
        });

        test('says nothing on a reset with no error showing', async ({ page }) => {
            await openWay(page, { reset: true });
            await clear(page).click();
            expect(await saidAfterWait(page)).toEqual([]);
        });

        test("leaves a required stepper's failure to the form where the page shows an error of its own", async ({
            page,
        }) => {
            await openWay(page, { required: true, taken: true });
            await bidOf(page).fill('');
            await send(page).click();
            await saidOf(page);
            const words = 'Error: Enter a value.';
            expect(await bidErrors(page)).toEqual({ drawn: [words], described: [words] });
            await expect(page.locator('#bid-range')).toBeHidden();
            if (way === 'useFormRefusal')
                expect(await handed(page)).toEqual(['bid: Enter a value.']);
        });

        test('says nothing on a reset after a stepper showed its error as focus left it, with no submit', async ({
            page,
        }) => {
            await openWay(page, { reset: true });
            await bidOf(page).fill('99');
            await bidOf(page).press('Tab');
            await page.clock.runFor(500);
            await forget(page);
            await clear(page).click();
            expect(await saidAfterWait(page)).toEqual([]);
        });

        test('says the form is cleared on a reset after a refusal only a stepper made, put right since', async ({
            page,
        }) => {
            await openWay(page, { reset: true });
            await bidOf(page).fill('99');
            await bidOf(page).press('Enter');
            await refused(page);
            await bidOf(page).fill('5');
            await forget(page);
            await clear(page).click();
            expect(await saidAfterWait(page)).toEqual(['page: Form cleared.']);
        });

        test('says nothing on a reset after a refusal and a submit that passed', async ({
            page,
        }) => {
            await openWay(page, { reset: true });
            await bidOf(page).fill('99');
            await bidOf(page).press('Enter');
            await refused(page);
            await bidOf(page).fill('5');
            await bidOf(page).press('Enter');
            await expect(page.locator('#count')).toHaveText('1');
            await page.clock.runFor(500);
            await forget(page);
            await clear(page).click();
            expect(await saidAfterWait(page)).toEqual([]);
        });

        if (way === 'useFormRefusal')
            test('says the form is cleared once on a reset of a page that clears its errors, with a stepper drawn past its range', async ({
                page,
            }) => {
                await openWay(page, { reset: true, high: true, clears: true }, '');
                await bidOf(page).fill('5');
                await send(page).click();
                await saidOf(page);
                await expect(page.locator('#name-error')).toBeVisible();
                await forget(page);
                await clear(page).click();
                expect(await saidAfterWait(page)).toEqual(['page: Form cleared.']);
                await expect(page.locator('#name-error')).toHaveCount(0);
            });

        test("shows a stepper's range error alone where it fails the page's own refusal too, and the page's words once in range", async ({
            page,
        }) => {
            await openWay(page);
            await bidOf(page).evaluate((input) => {
                (input as HTMLInputElement).setCustomValidity('Pick another bid.');
            });
            await bidOf(page).fill('99');
            await bidOf(page).press('Enter');
            await saidOf(page);
            expect(await bidErrors(page)).toEqual({ drawn: [RANGE], described: [RANGE] });
            await forget(page);
            await bidOf(page).fill('5');
            await bidOf(page).press('Enter');
            await saidOf(page);
            const words = 'Error: Pick another bid.';
            await expect
                .poll(async () => bidErrors(page))
                .toEqual({ drawn: [words], described: [words] });
            await expect(page.locator('#bid-range')).toBeHidden();
        });

        test("keeps a stepper's refused error through a reset the page calls off", async ({
            page,
        }) => {
            await openWay(page, { required: true, blank: true, reset: true });
            await send(page).click();
            await refused(page);
            await page.locator('form').evaluate((form) => {
                form.addEventListener('reset', (event) => {
                    event.preventDefault();
                });
            });
            await clear(page).click();
            await page.clock.runFor(100);
            expect(await bidErrors(page)).toEqual({ drawn: [RANGE], described: [RANGE] });
            await expect(bidOf(page)).toHaveAttribute('aria-invalid', 'true');
        });

        /*
         * A summary built from the failures with the words each field shows lists the stepper with
         * its own error's words, where the page is handed no failure to draw for it, and the
         * stepper says nothing over the summary the refusal moves focus to.
         */
        if (way === 'useFormRefusal')
            for (const [name, listed] of [
                ['Ana', [OWN]],
                ['', ['Enter your name.', OWN]],
            ] as const)
                test(`lists a stepper typed past its range with its own words in a summary${name ? '' : ' beside an empty field'}, and focus lands on it`, async ({
                    page,
                }) => {
                    await openWay(page, { summary: true }, name);
                    await bidOf(page).fill('99');
                    await bidOf(page).press('Enter');
                    await expect(async () => {
                        await page.clock.runFor(100);
                        await expect(page.locator('#summary')).toBeFocused({ timeout: 100 });
                    }).toPass();
                    await expect(page.locator('#summary li')).toHaveText(listed);
                    expect(await handed(page)).toEqual(name ? [] : ['name: Enter your name.']);
                    expect(await saidAfterWait(page)).toEqual([]);
                    expect(await bidErrors(page)).toEqual({ drawn: [RANGE], described: [RANGE] });
                    await expect(page.locator('#count')).toHaveText('0');
                });

        if (way === 'useFormRefusal')
            test("keys and links a set's failure in a summary by its field, beside other failures", async ({
                page,
            }) => {
                const warned: string[] = [];
                page.on('console', (message) => {
                    if (message.type() === 'error') warned.push(message.text());
                });
                await openWay(page, { summary: true, unchosen: true }, '');
                await bidOf(page).fill('99');
                await bidOf(page).press('Enter');
                await expect(async () => {
                    await page.clock.runFor(100);
                    await expect(page.locator('#summary')).toBeFocused({ timeout: 100 });
                }).toPass();
                await expect(page.locator('#summary li')).toHaveText([
                    'Enter your name.',
                    'Choose an option.',
                    OWN,
                ]);
                // Each link names an element on the page, a set's its fieldset, and no key repeats.
                const missing = await page
                    .locator('#summary a')
                    .evaluateAll((links) =>
                        links
                            .map((link) => link.getAttribute('href') ?? '')
                            .filter(
                                (href) => href.length < 2 || !document.getElementById(href.slice(1))
                            )
                    );
                expect(missing).toEqual([]);
                expect(warned.filter((one) => one.includes('key'))).toEqual([]);
            });

        if (way === 'useFormRefusal')
            test("says the first field's name and error when a summary already has focus", async ({
                page,
            }) => {
                await openWay(page, { summary: true }, '');
                await bidOf(page).fill('99');
                await bidOf(page).press('Enter');
                await expect(async () => {
                    await page.clock.runFor(100);
                    await expect(page.locator('#summary')).toBeFocused({ timeout: 100 });
                }).toPass();
                expect(await saidAfterWait(page)).toEqual([]);
                // Submitted again with focus kept on the summary, which reads nothing, so the first
                // field's name and error are said, as for a field that already has focus.
                await page.locator('form').evaluate((form) => {
                    (form as HTMLFormElement).requestSubmit();
                });
                expect(await saidOf(page)).toEqual([
                    'page: Name: Error: Enter your name. 2 fields need attention.',
                ]);
                await expect(page.locator('#summary')).toBeFocused();
            });
    });
}

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

/** Waits for a message on the status line, then past any second one, and counts it. */
const heardOnce = async (page: Page, words: string) => {
    await expect.poll(() => heard(page)).toContain(words);
    await page.waitForTimeout(300);
    expect((await heard(page)).filter((one) => one === words)).toHaveLength(1);
};

test('says the form is cleared on a reset that takes an error away from a field tied to it from outside', async ({
    page,
}) => {
    await openWith(
        page,
        `<form id="f"><button type="submit">Send</button><button type="reset">Clear</button></form>
<label for="o">Outside</label><input id="o" form="f" required>`
    );
    await send(page);
    await expect(page.locator('#o-error')).toBeVisible();
    await page.getByRole('button', { name: 'Clear' }).click();
    await heardOnce(page, 'Form cleared.');
    await expect(page.locator('#o-error')).toHaveCount(0);
});

test('says the form is cleared once on a reset that takes its error from a field the page marked invalid', async ({
    page,
}) => {
    await openWith(
        page,
        `<form><label for="n">Name</label><input id="n" required aria-invalid="true">
<button type="submit">Send</button><button type="reset">Clear</button></form>`
    );
    await send(page);
    await expect(page.locator('#n-error')).toBeVisible();
    await page.getByRole('button', { name: 'Clear' }).click();
    await heardOnce(page, 'Form cleared.');
    await expect(page.locator('#n-error')).toHaveCount(0);
});

test('says the form is cleared once on a reset after a refusal, where a page that draws its own errors clears them first', async ({
    page,
}) => {
    await servePage(page, {
        title: 'Join',
        body: `<main><h1>Join</h1><form><label for="n">Name</label>
<p class="dk-field-error" id="n-error" hidden>Error: Enter your name.</p>
<input id="n" required aria-describedby="n-error">
<button type="submit">Send</button><button type="reset">Clear</button></form>
<p class="dk-visually-hidden screen-status" role="status"></p></main>`,
        script: `import { attachForm } from './controls.js';
const form = document.querySelector('form');
const field = document.querySelector('#n');
const error = document.querySelector('#n-error');
const line = document.querySelector('.screen-status');
${hearing('.screen-status')}// The page's own reset listener, added first, takes its errors and marks away at once.
form.addEventListener('reset', () => {
    error.hidden = true;
    field.setAttribute('aria-invalid', 'false');
});
const refuse = attachForm(form, {
    status: line,
    invalid: (failures) => {
        for (const failure of failures) {
            error.hidden = false;
            failure.control.setAttribute('aria-invalid', 'true');
        }
        refuse();
    },
});
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    await send(page);
    await expect(page.locator('#n-error')).toBeVisible();
    await expect.poll(() => heard(page)).toHaveLength(1);
    await page.getByRole('button', { name: 'Clear' }).click();
    await heardOnce(page, 'Form cleared.');
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
