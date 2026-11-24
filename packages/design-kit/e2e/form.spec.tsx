import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { ChoiceField, InputField, StatusLine } from '../src/react.js';
import { bundle } from './bundle.js';
import { hear, hearing, servePage, stillClock } from './page.js';

/*
 * A refused submit by `attachForm` and React's `useFormRefusal`: focus on the first field in error,
 * a radio set's checked radio, or a summary the page names, and one message on the status line,
 * nothing where focus moves to a summary, and otherwise, the summary already focused among them,
 * the first field's name and error with how many need attention where more are wrong, with a
 * second refusal heard again, "Form cleared." where a reset follows a refusal, and a
 * field's error the page draws again with new words while a refusal through the hook stands.
 */

const FORM = renderToStaticMarkup(
    <main>
        <form id="rule" noValidate>
            <InputField id="name" label="Rule name" />
            <ChoiceField
                id="match"
                label="Match"
                name="match"
                choices={[
                    { value: 'all', label: 'All' },
                    { value: 'any', label: 'Any', defaultChecked: true },
                ]}
            />
            <ChoiceField
                id="tags"
                label="Tags"
                name="tags"
                type="checkbox"
                choices={[
                    { value: 'new', label: 'New' },
                    { value: 'sale', label: 'Sale' },
                ]}
            />
            <InputField id="code" label="Code" disabled />
            <button type="submit">Save rule</button>
        </form>
        <div id="summary" tabIndex={-1} hidden>
            Two fields need attention.
        </div>
        <StatusLine className="screen-status" />
    </main>
);

/** Marks a field or a set wrong as the kit's field draws it, and refuses through the attach. */
const SCRIPT = `import { attachForm } from './controls.js';
const form = document.querySelector('#rule');
const line = document.querySelector('.screen-status');
${hearing('.screen-status')}window.markWrong = (id, words) => {
    const holder = document.getElementById(id);
    const error = document.createElement('p');
    error.className = 'dk-field-error';
    error.id = id + '-error';
    error.innerHTML = '<span class="dk-visually-hidden">Error: </span>' + words;
    holder.before(error);
    holder.setAttribute('aria-describedby', error.id);
    holder.setAttribute('aria-invalid', 'true');
};
window.summarised = false;
window.attach = () =>
    attachForm(form, {
        status: line,
        summary: () => (window.summarised ? document.querySelector('#summary') : null),
    });
window.refuse = () => {
    window.attach()();
};
window.ready = true;`;

type Form = {
    heard: string[];
    markWrong: (id: string, words: string) => void;
    refuse: () => void;
    attach: () => void;
    summarised: boolean;
};

/** The page with its controls loaded, on a clock that stands still where `clock` is set. */
const open = async (page: Page, { clock = false }: { readonly clock?: boolean } = {}) => {
    if (clock) await stillClock(page.clock);
    await servePage(page, { title: 'Form', body: FORM, script: SCRIPT });
    await page.waitForFunction(() => 'ready' in window);
};

const refuse = (page: Page, wrong: readonly (readonly [string, string])[]) =>
    page.evaluate((marks) => {
        const form = window as unknown as Form;
        for (const [id, words] of marks) form.markWrong(id, words);
        form.refuse();
    }, wrong);

test('focuses the first field in error and says its name and error and how many need attention', async ({
    page,
}) => {
    await open(page);
    await page.getByRole('button', { name: 'Save rule' }).focus();
    await refuse(page, [
        ['name', 'Give the rule a name.'],
        ['match', 'Choose how rules match.'],
    ]);
    await expect(page.locator('#name')).toBeFocused();
    await expect(page.locator('.screen-status')).toHaveText(
        'Rule name: Error: Give the rule a name. 2 fields need attention.'
    );
});

test("says the field's name and error where the field already had focus, and again on a second refusal", async ({
    page,
}) => {
    await open(page);
    await page.locator('#name').focus();
    await refuse(page, [['name', 'Give the rule a name.']]);
    await expect(page.locator('.screen-status')).toHaveText(
        'Rule name: Error: Give the rule a name.'
    );
    await refuse(page, []);
    await expect
        .poll(() => page.evaluate(() => (window as unknown as Form).heard))
        .toEqual([
            'Rule name: Error: Give the rule a name.',
            'Rule name: Error: Give the rule a name.',
        ]);
    await expect(page.locator('#name')).toBeFocused();
});

test('says the field, its error and how many more need attention where the field already had focus', async ({
    page,
}) => {
    await open(page);
    await page.locator('#name').focus();
    await refuse(page, [
        ['name', 'Give the rule a name.'],
        ['match', 'Choose how rules match.'],
    ]);
    await expect(page.locator('.screen-status')).toHaveText(
        'Rule name: Error: Give the rule a name. 2 fields need attention.'
    );
});

test('passes over a field that cannot take focus, and counts a set of checkboxes once', async ({
    page,
}) => {
    await open(page);
    await page.getByRole('button', { name: 'Save rule' }).focus();
    await page.evaluate(() => {
        // The kit marks each checkbox of a set invalid, and a disabled field can be marked too.
        for (const box of document.querySelectorAll('#tags input'))
            box.setAttribute('aria-invalid', 'true');
    });
    await refuse(page, [['code', 'Enter the code.']]);
    await expect(page.getByRole('checkbox', { name: 'New' })).toBeFocused();
    // The box reads no error of its own, so the set is named with the count.
    await expect
        .poll(() => page.evaluate(() => (window as unknown as Form).heard))
        .toEqual(['Tags: 2 fields need attention.']);
});

test('passes over a control marked off at the head of a set in error', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'Save rule' }).focus();
    await page.evaluate(() => {
        const why = document.createElement('button');
        why.type = 'button';
        why.textContent = 'Why are tags off?';
        why.setAttribute('aria-disabled', 'true');
        document.querySelector('#tags')?.prepend(why);
        for (const box of document.querySelectorAll('#tags input'))
            box.setAttribute('aria-invalid', 'true');
    });
    await refuse(page, []);
    await expect(page.getByRole('checkbox', { name: 'New' })).toBeFocused();
});

test('keeps focus and says the error where no field in error can take focus', async ({ page }) => {
    await open(page, { clock: true });
    await page.getByRole('button', { name: 'Save rule' }).focus();
    await page.evaluate(() => {
        // The whole set is marked off on its fieldset, so none of its choices can take focus.
        document.querySelector('#tags')?.setAttribute('aria-disabled', 'true');
        for (const box of document.querySelectorAll('#tags input'))
            box.setAttribute('aria-invalid', 'true');
    });
    await refuse(page, []);
    // Past the refusal's frame and the moment the line puts words in.
    await page.clock.runFor(300);
    await expect(page.getByRole('button', { name: 'Save rule' })).toBeFocused();
    await expect
        .poll(() => page.evaluate(() => (window as unknown as Form).heard))
        .toEqual(['Tags: 1 field needs attention.']);
});

test("refuses a form the page wrote without noValidate, rather than leaving it to the browser's own check", async ({
    page,
}) => {
    // The page's own form, with a required field and no noValidate, which the kit refuses.
    const body = FORM.replace(/\snovalidate=""/i, '').replace('id="name"', 'id="name" required=""');
    expect(body).not.toMatch(/novalidate/i);
    await servePage(page, {
        title: 'Form',
        body,
        script: `${SCRIPT}
attachForm(form, { status: line });
form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (document.querySelector('#name').value === '') window.markWrong('name', 'Enter a rule name.');
    attachForm(form)();
});`,
    });
    await page.waitForFunction(() => 'ready' in window);
    await expect(page.locator('#name')).toHaveAttribute('required', '');
    expect(
        await page.locator('#rule').evaluate((form) => (form as HTMLFormElement).noValidate)
    ).toBe(true);
    await page.getByRole('button', { name: 'Save rule' }).click();
    await expect(page.getByLabel('Rule name')).toBeFocused();
    await expect(page.getByLabel('Rule name')).toHaveAttribute('aria-invalid', 'true');
    // The field's name and error are said, since VoiceOver on iOS reads the error only as a hint.
    await expect
        .poll(() => page.evaluate(() => (window as unknown as Form).heard))
        .toEqual(['Rule name: Error: Enter a value.']);
});

test("says the field's name and the count where the only field in error has no error drawn", async ({
    page,
}) => {
    await open(page);
    await page.getByRole('button', { name: 'Save rule' }).focus();
    await page.evaluate(() =>
        document.querySelector('#name')?.setAttribute('aria-invalid', 'true')
    );
    await refuse(page, []);
    await expect(page.getByLabel('Rule name')).toBeFocused();
    await expect
        .poll(() => page.evaluate(() => (window as unknown as Form).heard))
        .toEqual(['Rule name: 1 field needs attention.']);
});

test("says a set's name and error where focus moves to a choice its error does not describe", async ({
    page,
}) => {
    await open(page);
    await page.getByRole('button', { name: 'Save rule' }).focus();
    // Written by hand, the set is described on its fieldset alone, which a choice does not read.
    await page.evaluate(() => {
        for (const radio of document.querySelectorAll('#match input'))
            radio.removeAttribute('aria-describedby');
    });
    await refuse(page, [['match', 'Choose how rules match.']]);
    await expect(page.getByRole('radio', { name: 'Any' })).toBeFocused();
    await expect
        .poll(() => page.evaluate(() => (window as unknown as Form).heard))
        .toEqual(['Match: Error: Choose how rules match.']);
});

/** Puts a Start over button in the form, and attaches it with nothing wrong, which says nothing. */
const withReset = (page: Page) =>
    page.evaluate(() => {
        const form = document.querySelector('#rule');
        const reset = document.createElement('button');
        reset.type = 'reset';
        reset.textContent = 'Start over';
        form?.append(reset);
        (window as unknown as Form).attach();
    });

test("says the form is cleared where a reset takes away the kit's errors", async ({ page }) => {
    await open(page);
    await withReset(page);
    await page.locator('#name').evaluate((name) => name.setAttribute('required', ''));
    await page.getByRole('button', { name: 'Save rule' }).click();
    await expect(page.locator('#name')).toBeFocused();
    await expect
        .poll(() => page.evaluate(() => (window as unknown as Form).heard))
        .toEqual(['Rule name: Error: Enter a value.']);
    // By Enter, since Safari leaves a button a pointer presses without focus.
    await page.getByRole('button', { name: 'Start over' }).focus();
    await page.keyboard.press('Enter');
    await expect
        .poll(() => page.evaluate(() => (window as unknown as Form).heard))
        .toEqual(['Rule name: Error: Enter a value.', 'Form cleared.']);
    await expect(page.locator('#name')).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('button', { name: 'Start over' })).toBeFocused();
});

test('says nothing on a reset with no refusal standing, and the form is cleared on one after the page refused', async ({
    page,
}) => {
    await open(page, { clock: true });
    await withReset(page);
    // A reset with nothing wrong, as after a save, says nothing.
    await page.getByRole('button', { name: 'Start over' }).click();
    // Past the task the reset waits, which would call off a refusal asked before it comes.
    await page.clock.runFor(100);
    expect(await page.evaluate(() => (window as unknown as Form).heard)).toEqual([]);
    // A refusal stands whoever drew its errors, the page's own among them, so a reset after it says
    // the form is cleared.
    await refuse(page, [['name', 'Give the rule a name.']]);
    await page.clock.runFor(300);
    expect(await page.evaluate(() => (window as unknown as Form).heard)).toEqual([
        'Rule name: Error: Give the rule a name.',
    ]);
    await page.getByRole('button', { name: 'Start over' }).click();
    // Past the task a reset waits and the moment the line would put words in.
    await page.clock.runFor(500);
    expect(await page.evaluate(() => (window as unknown as Form).heard)).toEqual([
        'Rule name: Error: Give the rule a name.',
        'Form cleared.',
    ]);
});

test('leaves focus where it is when nothing is wrong', async ({ page }) => {
    await open(page, { clock: true });
    await page.getByRole('button', { name: 'Save rule' }).focus();
    await refuse(page, []);
    // Past the refusal's frame and the moment the line would put words in.
    await page.clock.runFor(300);
    await expect(page.getByRole('button', { name: 'Save rule' })).toBeFocused();
    await expect(page.locator('.screen-status')).toHaveText('');
});

test("focuses a radio set's checked radio, and a summary the page names", async ({ page }) => {
    await open(page, { clock: true });
    await page.getByRole('button', { name: 'Save rule' }).focus();
    // Marked as `ChoiceField` draws a set's error, on the fieldset and on each choice, and its
    // name and error are said all the same, since VoiceOver on iOS reads a description only as a
    // hint.
    await page.evaluate(() => {
        for (const radio of document.querySelectorAll('#match input'))
            radio.setAttribute('aria-describedby', 'match-error');
    });
    await refuse(page, [['match', 'Choose how rules match.']]);
    await page.clock.runFor(100);
    await expect(page.getByRole('radio', { name: 'Any' })).toBeFocused();
    // A second refusal calls off words not yet said, so the first is given time to speak.
    await page.clock.runFor(1000);
    await page.getByRole('button', { name: 'Save rule' }).focus();
    await page.evaluate(() => {
        const summary = document.querySelector<HTMLElement>('#summary');
        if (summary) summary.hidden = false;
        (window as unknown as Form).summarised = true;
    });
    await refuse(page, []);
    await page.clock.runFor(100);
    await expect(page.locator('#summary')).toBeFocused();
    // Moving focus reads the summary, so the line says nothing over it, and refused again from
    // the summary, the line says the first field's name and error, since focus that stays reads
    // nothing.
    await refuse(page, []);
    await page.clock.runFor(300);
    await expect
        .poll(() => page.evaluate(() => (window as unknown as Form).heard))
        .toEqual([
            'Match: Error: Choose how rules match.',
            'Match: Error: Choose how rules match.',
        ]);
});

test("says a summary's line where it already has focus and no field is marked", async ({
    page,
}) => {
    await open(page, { clock: true });
    await page.getByRole('button', { name: 'Save rule' }).focus();
    await page.evaluate(() => {
        const summary = document.querySelector<HTMLElement>('#summary');
        if (summary) summary.hidden = false;
        (window as unknown as Form).summarised = true;
    });
    await refuse(page, []);
    await page.clock.runFor(100);
    await expect(page.locator('#summary')).toBeFocused();
    // Refused again from the summary with no field marked, so its own line is what is said.
    await refuse(page, []);
    await page.clock.runFor(300);
    await expect
        .poll(() => page.evaluate(() => (window as unknown as Form).heard))
        .toEqual(['Two fields need attention.']);
});

/*
 * A summary that cannot take focus is passed over, as a field is: hidden itself, by an ancestor or
 * by a style, made inert, or with no tabindex and not focusable by nature.
 */
for (const how of ['hidden', 'ancestor', 'style', 'inert', 'not focusable'] as const)
    test(`passes over a summary that cannot take focus, ${how}, to the first field in error`, async ({
        page,
    }) => {
        await open(page);
        await page.getByRole('button', { name: 'Save rule' }).focus();
        await page.evaluate((way) => {
            const summary = document.querySelector<HTMLElement>('#summary');
            if (!summary) return;
            summary.hidden = way === 'hidden';
            if (way === 'ancestor') {
                const holder = document.createElement('div');
                holder.hidden = true;
                summary.replaceWith(holder);
                holder.append(summary);
            }
            if (way === 'style') summary.style.display = 'none';
            summary.inert = way === 'inert';
            if (way === 'not focusable') summary.removeAttribute('tabindex');
            (window as unknown as Form).summarised = true;
        }, how);
        await refuse(page, [['name', 'Give the rule a name.']]);
        await expect(page.locator('#name')).toBeFocused();
        await expect(page.locator('.screen-status')).toHaveText(
            'Rule name: Error: Give the rule a name.'
        );
    });

/** A form drawn inside a frame of the page's own origin and attached from the page. */
const IN_FRAME = renderToStaticMarkup(
    <form id="seats" noValidate>
        <InputField id="seat" label="Seat" required />
        <button type="submit">Save seats</button>
    </form>
);

test('focuses the field in error inside a frame, where the page attached the form', async ({
    page,
}) => {
    await servePage(page, {
        title: 'Form',
        body: `<main><iframe title="Seats" srcdoc="<!doctype html><title>Seats</title>"></iframe>${renderToStaticMarkup(
            <StatusLine className="screen-status" />
        )}</main>`,
        script: `import { attachForm } from './controls.js';
const frame = document.querySelector('iframe');
if (frame.contentDocument?.title !== 'Seats')
    await new Promise((loaded) => frame.addEventListener('load', loaded, { once: true }));
frame.contentDocument.body.innerHTML = ${JSON.stringify(IN_FRAME)};
attachForm(frame.contentDocument.querySelector('form'), {
    status: document.querySelector('.screen-status'),
});
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    const inner = page.frameLocator('iframe');
    await inner.getByRole('button', { name: 'Save seats' }).click();
    const seat = inner.locator('#seat');
    await expect(seat).toHaveAttribute('aria-invalid', 'true');
    await expect(seat).toBeFocused();
    await expect(page.locator('iframe')).toBeFocused();
    // The kit's error drawn in the frame, its words the kit's, and the field described by it.
    const error = inner.locator('.dk-field-error');
    await expect(error).toHaveText('Error: Enter a value.');
    const errorId = await error.getAttribute('id');
    expect(errorId).toBeTruthy();
    await expect(seat).toHaveAttribute(
        'aria-describedby',
        new RegExp(`(^| )${errorId ?? ''}( |$)`)
    );
    await expect(page.locator('.screen-status')).toHaveText('Seat: Error: Enter a value.');
});

test.describe('in React', () => {
    let app = '';
    test.beforeAll(async () => {
        test.setTimeout(120_000);
        app = await bundle('form-page.tsx');
    });

    test("refuses a submit through the screen's status line", async ({ page }) => {
        await servePage(page, { title: 'Form', body: '<div id="root"></div>', script: app });
        await page.getByRole('button', { name: 'Add' }).click();
        await expect(page.getByRole('textbox', { name: 'Name' })).toBeFocused();
        await expect(page.getByRole('textbox', { name: 'Name' })).toHaveAttribute(
            'aria-invalid',
            'true'
        );
        await expect(page.locator('#root p[role="status"]')).toHaveText(/^Name: Error: /);
    });

    test('refuses after an await, though the frame comes before the render that draws the error', async ({
        page,
    }) => {
        await servePage(page, { title: 'Form', body: '<div id="root"></div>', script: app });
        // A frame due at once, as one late under load is, comes before React draws the error the
        // page set, which it draws in a task of its own.
        await page.evaluate(() => {
            window.requestAnimationFrame = (callback) => {
                queueMicrotask(() => {
                    callback(performance.now());
                });
                return 0;
            };
        });
        await page.getByRole('button', { name: 'Save' }).click();
        await expect(page.getByRole('textbox', { name: 'Player' })).toBeFocused();
        await expect(page.locator('#root p[role="status"]')).toHaveText(/^Player: Error: /);
    });

    test('refuses the second of two refusals once the first is called off', async ({ page }) => {
        await servePage(page, { title: 'Form', body: '<div id="root"></div>', script: app });
        await page.evaluate(() => {
            (window as unknown as { refuseTwice: () => void }).refuseTwice();
        });
        await expect(page.getByRole('textbox', { name: 'Player' })).toBeFocused();
        await expect(page.locator('#root p[role="status"]')).toHaveText(/^Player: Error: /);
    });

    test("keeps a field's error working as the page draws it again while a refusal stands", async ({
        page,
    }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        // A still clock, run past the frame a refusal waits and the moment the line waits to put
        // its words in, so words on their way have landed before the line is read as silent.
        await stillClock(page.clock);
        await servePage(page, { title: 'Form', body: '<div id="root"></div>', script: app });
        // Every set of words the screen's status line is given, by a watch on the document matched
        // by the line's selector, so the same words said again are kept again.
        await expect(page.locator('#root p[role="status"]')).toHaveCount(1);
        await page.evaluate(hear, { line: '#root p[role="status"]' });
        const heard = () => page.evaluate(() => (window as unknown as { heard: string[] }).heard);
        const seat = page.getByRole('textbox', { name: 'Seat' });
        const error = page.locator('[id="seat-error"]');
        await page.getByRole('button', { name: 'Book' }).click();
        // The error is drawn as React commits, which is when the refusal asks for its frame, so
        // the clock runs only once that frame is there to run.
        await expect(error).toHaveText('Error: Enter a value.');
        await page.clock.runFor(300);
        await expect(seat).toBeFocused();
        expect(await heard()).toEqual(['Seat: Error: Enter a value.']);
        // New words from the page while the refusal stands, plain and then with an address React
        // draws in parts, so its children change as well as its text.
        for (const words of ['Pick a seat.', 'Pick a seat, or ask box@example.com.']) {
            await page.evaluate((next) => {
                (window as unknown as { seatError: (words: string) => void }).seatError(next);
            }, words);
            await expect(error).toHaveCount(1);
            await expect(error).toBeVisible();
            await expect(error).toHaveText(`Error: ${words}`);
            await expect(seat).toHaveAccessibleDescription(`Error: ${words}`);
            await expect(seat).toHaveAttribute('aria-invalid', 'true');
            // Nothing more is said for the error drawn again, the refusal's words among them.
            await page.clock.runFor(300);
            expect(await heard(), words).toEqual(['Seat: Error: Enter a value.']);
        }
        expect(errors).toEqual([]);
    });

    test('leaves focus where the visitor moved it before the error was drawn', async ({ page }) => {
        await stillClock(page.clock);
        await servePage(page, { title: 'Form', body: '<div id="root"></div>', script: app });
        await page.evaluate(() => {
            (window as unknown as { refuseAndMove: () => void }).refuseAndMove();
        });
        await expect(page.getByRole('textbox', { name: 'Player' })).toHaveAttribute(
            'aria-invalid',
            'true'
        );
        // Past the frame the refusal waits to move focus.
        await page.clock.runFor(100);
        await expect(page.locator('#elsewhere')).toBeFocused();
    });
});
