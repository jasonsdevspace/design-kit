import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { ChoiceField, InputField, StatusLine } from '../src/react.js';
import { bundle } from './bundle.js';
import { servePage } from './page.js';

/*
 * A refused submit by `attachForm` and React's `useFormRefusal`: focus on the first field in error,
 * a radio set's checked radio, or a summary the page names, and one message on the status line, how
 * many fields need attention where focus moved, or the error's own words where the field already
 * had focus, with a second refusal heard again.
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
window.heard = [];
new MutationObserver(() => {
    if (line.textContent) window.heard.push(line.textContent);
}).observe(line, { childList: true, characterData: true, subtree: true });
window.markWrong = (id, words) => {
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
window.refuse = () => {
    attachForm(form, {
        status: line,
        summary: () => (window.summarised ? document.querySelector('#summary') : null),
    })();
};
window.ready = true;`;

type Form = {
    heard: string[];
    markWrong: (id: string, words: string) => void;
    refuse: () => void;
    summarised: boolean;
};

const open = async (page: Page) => {
    await servePage(page, { title: 'Form', body: FORM, script: SCRIPT });
    await page.waitForFunction(() => 'ready' in window);
};

const refuse = (page: Page, wrong: readonly (readonly [string, string])[]) =>
    page.evaluate((marks) => {
        const form = window as unknown as Form;
        for (const [id, words] of marks) form.markWrong(id, words);
        form.refuse();
    }, wrong);

test('focuses the first field in error and says how many need attention', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'Save rule' }).focus();
    await refuse(page, [
        ['name', 'Give the rule a name.'],
        ['match', 'Choose how rules match.'],
    ]);
    await expect(page.locator('#name')).toBeFocused();
    await expect(page.locator('.screen-status')).toHaveText('2 fields need attention.');
});

test("says the error's own words where the field already had focus, and again on a second refusal", async ({
    page,
}) => {
    await open(page);
    await page.locator('#name').focus();
    await refuse(page, [['name', 'Give the rule a name.']]);
    await expect(page.locator('.screen-status')).toHaveText('Error: Give the rule a name.');
    await refuse(page, []);
    await expect
        .poll(() => page.evaluate(() => (window as unknown as Form).heard))
        .toEqual(['Error: Give the rule a name.', 'Error: Give the rule a name.']);
    await expect(page.locator('#name')).toBeFocused();
});

test('says the error and how many more need attention where the field already had focus', async ({
    page,
}) => {
    await open(page);
    await page.locator('#name').focus();
    await refuse(page, [
        ['name', 'Give the rule a name.'],
        ['match', 'Choose how rules match.'],
    ]);
    await expect(page.locator('.screen-status')).toHaveText(
        'Error: Give the rule a name. 2 fields need attention.'
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
    await expect(page.locator('.screen-status')).toHaveText('2 fields need attention.');
});

test('leaves focus where it is when nothing is wrong', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'Save rule' }).focus();
    await refuse(page, []);
    await page.waitForTimeout(100);
    await expect(page.getByRole('button', { name: 'Save rule' })).toBeFocused();
    await expect(page.locator('.screen-status')).toHaveText('');
});

test("focuses a radio set's checked radio, and a summary the page names", async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'Save rule' }).focus();
    await refuse(page, [['match', 'Choose how rules match.']]);
    await expect(page.getByRole('radio', { name: 'Any' })).toBeFocused();
    await expect(page.locator('.screen-status')).toHaveText('1 field needs attention.');
    await page.getByRole('button', { name: 'Save rule' }).focus();
    await page.evaluate(() => {
        const summary = document.querySelector<HTMLElement>('#summary');
        if (summary) summary.hidden = false;
        (window as unknown as Form).summarised = true;
    });
    await refuse(page, []);
    await expect(page.locator('#summary')).toBeFocused();
    // Moving focus reads the summary, so the line says nothing over it, and refused again from
    // the summary, the line says the summary's words, since focus that stays reads nothing.
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => (window as unknown as Form).heard)).toEqual([
        '1 field needs attention.',
    ]);
    await refuse(page, []);
    await expect(page.locator('.screen-status')).toHaveText('Two fields need attention.');
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
        await expect(page.locator('#root p[role="status"]')).toHaveText('1 field needs attention.');
    });
});
