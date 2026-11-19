import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { fieldMarks } from '../examples/examples.js';
import { ChoiceField, InputField, SelectField, StepperField, TextareaField } from '../src/react.js';
import { forceColors, sideways, style, writePage } from './page.js';
import { cutOff, SPACED } from './spacing.js';
import { textSize } from './text-size.js';

/*
 * A field marked required or optional in words in its label: a required field's name without the
 * words, which its aria-required says, an optional field's name with them, the field, select,
 * textarea, stepper and radio set marked required, a set of checkboxes saying it in its legend, the
 * mark in the muted text at the normal weight, shown in forced colors, no audit findings in either
 * theme, and whole at 320px with twice the text size and under wider text spacing.
 */

const BODY = `<main><h1>Rule</h1><form>${renderToStaticMarkup(
    <>
        {fieldMarks}
        <SelectField id="sort" label="Sort by" mark="required">
            <option>Newest</option>
        </SelectField>
        <TextareaField id="why" label="Why" mark="optional" />
        <SelectField id="price" label="Price" aria-required>
            <option>Any</option>
        </SelectField>
        <InputField id="nota" label="Nota" mark="optional" markWords="(opcional)" />
        <StepperField id="seats" label="Seats" min={2} max={8} defaultValue={4} mark="required" />
        <ChoiceField
            id="match"
            label="Match"
            name="match"
            mark="required"
            choices={[
                { value: 'all', label: 'All' },
                { value: 'any', label: 'Any' },
            ]}
        />
        <ChoiceField
            id="tags"
            label="Tags"
            name="tags"
            type="checkbox"
            mark="required"
            choices={[{ value: 'new', label: 'New' }]}
        />
    </>
)}</form></main>`;

const draw = (page: Page, theme: 'light' | 'dark' = 'light', css = '') =>
    writePage(page, { title: 'Marks', body: BODY, theme, css });

test('names a required field without its words, which its aria-required says, and an optional one with them', async ({
    page,
}) => {
    await draw(page);
    const name = page.getByRole('textbox', { name: 'Rule name', exact: true });
    await expect(name).toHaveAttribute('aria-required', 'true');
    await expect(page.getByRole('textbox', { name: 'Note (optional)', exact: true })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Sort by', exact: true })).toHaveAttribute(
        'aria-required',
        'true'
    );
    await expect(page.getByRole('spinbutton', { name: 'Seats', exact: true })).toHaveAttribute(
        'aria-required',
        'true'
    );
    // A set of choices keeps its words in its name, since not every screen reader says a group is
    // required, and a set of radios is marked required too, which a set of checkboxes cannot be.
    await expect(
        page.getByRole('radiogroup', { name: 'Match (required)', exact: true })
    ).toHaveAttribute('aria-required', 'true');
    const tags = page.getByRole('group', { name: 'Tags (required)', exact: true });
    await expect(tags).toBeVisible();
    await expect(tags).not.toHaveAttribute('aria-required');
    // A page's own aria-required on a field with no mark is kept, and a page's own words are used.
    await expect(page.getByRole('combobox', { name: 'Price', exact: true })).toHaveAttribute(
        'aria-required',
        'true'
    );
    await expect(page.getByRole('textbox', { name: 'Nota (opcional)', exact: true })).toBeVisible();
    await expect(
        page.getByRole('textbox', { name: 'Why (optional)', exact: true })
    ).not.toHaveAttribute('aria-required');
    await expect(page.getByRole('textbox', { name: 'Why (optional)', exact: true })).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
    test(`draws the mark muted at the normal weight, with no audit findings, in the ${theme} theme`, async ({
        page,
    }) => {
        await draw(page, theme);
        const mark = page.locator('label[for="rule-name"] .dk-field-mark');
        const label = page.locator('label[for="rule-name"]');
        const drawn = await style(mark, 'color', 'font-weight');
        expect(drawn['color']).not.toBe((await style(label, 'color'))['color']);
        expect(Number(drawn['font-weight'])).toBeLessThan(
            Number((await style(label, 'font-weight'))['font-weight'])
        );
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations.map(({ id }) => id)).toEqual([]);
    });
}

test('shows the mark in forced colors, and keeps it whole at 320px with twice the text size and under wider spacing', async ({
    page,
}) => {
    await forceColors(page);
    await draw(page);
    const mark = page.locator('.dk-field-mark').first();
    const ground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect((await style(mark, 'color'))['color']).not.toBe(ground);
    await forceColors(page, false);
    await draw(page, 'light', SPACED);
    expect(await cutOff(page, '.dk-field-label')).toEqual([]);
    await textSize(page, 2);
    await writePage(page, { title: 'Marks', body: BODY, width: 320, height: 640 });
    expect(await sideways(page)).toBe(0);
    expect(await cutOff(page, '.dk-field-label')).toEqual([]);
});
