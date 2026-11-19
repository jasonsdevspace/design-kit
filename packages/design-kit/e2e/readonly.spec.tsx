import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { readOnlyFields } from '../examples/examples.js';
import { InputField } from '../src/react.js';
import { forceColors, sideways, style, writePage } from './page.js';
import { cutOff, SPACED } from './spacing.js';
import { textSize } from './text-size.js';

/*
 * Read-only fields, as the reference draws them, beside a field that can be changed and one that is
 * disabled: the read-only edge kept in width but drawn clear on a clear ground with the text in the
 * page's color, the edge in the ground's color in forced colors, a read-only select drawn as a field
 * with its option's words and sending its value, a read-only stepper with no buttons, no audit
 * findings in either theme, and every field whole at 320px with twice the text size and under wider
 * text spacing.
 */

const BODY = `<main><h1>Round</h1><form id="form">${renderToStaticMarkup(
    <>
        {readOnlyFields}
        <InputField id="note" label="Note" defaultValue="Ann deals" />
        <InputField id="gone" label="Seat" defaultValue="4" disabled />
    </>
)}</form></main>`;

const draw = (page: Page, theme: 'light' | 'dark' = 'light', css = '') =>
    writePage(page, { title: 'Read only', body: BODY, theme, css });

const look = (page: Page, id: string) =>
    style(
        page.locator(`#${id}`),
        'border-top-color',
        'border-top-width',
        'background-color',
        'color'
    );

for (const theme of ['light', 'dark'] as const) {
    test(`draws a read-only field as a value, apart from one that can change or is off, in the ${theme} theme`, async ({
        page,
    }) => {
        await draw(page, theme);
        const read = await look(page, 'round');
        const open = await look(page, 'note');
        const off = await look(page, 'gone');
        expect(read['border-top-color']).toBe('rgba(0, 0, 0, 0)');
        expect(read['background-color']).toBe('rgba(0, 0, 0, 0)');
        // The edge keeps its width, so the field lines up with the ones beside it.
        expect(read['border-top-width']).toBe(open['border-top-width']);
        // In the page's own text color, as a field that can change is, and not the muted color of
        // one that is off.
        expect(read['color']).toBe(open['color']);
        expect(read['color']).not.toBe(off['color']);
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations.map(({ id }) => id)).toEqual([]);
    });
}

test('keeps the error edge on a read-only field with an error, and draws a disabled one disabled', async ({
    page,
}) => {
    await draw(page);
    await page.locator('#round').evaluate((input) => {
        input.setAttribute('aria-invalid', 'true');
    });
    expect((await look(page, 'round'))['border-top-color']).not.toBe('rgba(0, 0, 0, 0)');
    await page.locator('#round').evaluate((input: HTMLInputElement) => {
        input.removeAttribute('aria-invalid');
        input.disabled = true;
    });
    expect((await look(page, 'round'))['color']).toBe((await look(page, 'gone'))['color']);
});

test('draws a read-only edge in the ground color in forced colors', async ({ page }) => {
    await forceColors(page);
    await draw(page);
    const read = await look(page, 'round');
    const ground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(read['border-top-color']).toBe(ground);
});

test("draws a read-only select as a field with its option's words, and sends its value", async ({
    page,
}) => {
    await draw(page);
    const game = page.getByRole('textbox', { name: 'Game' });
    await expect(game).toHaveValue('Wizard');
    await expect(game).toHaveAttribute('readonly', '');
    await expect(page.getByRole('combobox', { name: 'Game' })).toHaveCount(0);
    const sent = await page.evaluate(() =>
        new FormData(document.querySelector('form') ?? undefined).get('game')
    );
    expect(sent).toBe('wizard');
});

test('draws a read-only stepper with its value alone, which a keyboard still reaches', async ({
    page,
}) => {
    await draw(page);
    // Drawn hidden, as every stepper's buttons are until attached, and a read-only one keeps them so.
    await expect(page.locator('.dk-stepper button:visible')).toHaveCount(0);
    const cards = page.getByRole('spinbutton', { name: 'Cards each' });
    await expect(cards).toHaveAttribute('readonly', '');
    await cards.focus();
    await expect(cards).toBeFocused();
});

test('keeps every field whole at 320px with twice the text size and under wider spacing', async ({
    page,
}) => {
    await draw(page, 'light', SPACED);
    expect(await cutOff(page, '.dk-field-label')).toEqual([]);
    await textSize(page, 2);
    await writePage(page, { title: 'Read only', body: BODY, width: 320, height: 640 });
    expect(await sideways(page)).toBe(0);
});
