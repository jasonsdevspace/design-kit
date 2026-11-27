import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { CheckboxField } from '../src/react.js';
import { bundle } from './bundle.js';
import { box, forceColors, hearing, servePage, sideways, style } from './page.js';
import { cutOff, SPACED } from './spacing.js';
import { doubled } from './text-size.js';

/*
 * A checkbox field, one setting with no group around it: the box named by its label alone and
 * described by its hint, then its error, with no group in the tree, a refused submit that draws
 * the error above the box and moves focus to it, in a form a page writes by hand and in one React
 * draws, a label that is a target the field's height on a wide screen and a thumb's on a phone, a
 * hint that starts under the words and does not toggle the box, a dashed line around an invalid box
 * and the system's color for one that is off in forced colors, no audit failure in any state, and
 * a long label that wraps at 320 wide and twice the text size without pushing the page sideways.
 */

/** A setting with a hint, a consent box, one that is off and one read only, as a page draws them. */
const FIELDS = renderToStaticMarkup(
    <>
        <CheckboxField
            id="double"
            name="double"
            label="Score the last round double"
            hint="Every bid in round 10 counts twice"
        />
        <CheckboxField
            id="agree"
            name="agree"
            label="I agree to the house rules"
            required
            mark="required"
        />
        <CheckboxField
            id="skip"
            name="skip"
            label="Let a player skip a round"
            hint="Only the host can change this"
            disabled
        />
        <CheckboxField id="seen" name="seen" label="Show the scores" readOnly defaultChecked />
    </>
);

/** The fields in a form the kit refuses, with a status line it speaks on. */
const open = async (page: Page, width = 1280) => {
    await page.setViewportSize({ width, height: 900 });
    await servePage(page, {
        title: 'House rules',
        body: `<main class="dk-page"><h1>House rules</h1><form>${FIELDS}<button type="submit" class="dk-button">Start</button></form>
<p class="dk-visually-hidden screen-status" role="status"></p></main>`,
        script: `import { attachForm } from './controls.js';
${hearing('.screen-status')}window.submits = 0;
document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    window.submits += 1;
});
attachForm(document.querySelector('form'), { status: document.querySelector('.screen-status') });
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
};

const heard = (page: Page) => page.evaluate(() => (window as unknown as { heard: string[] }).heard);

test('names the box by its label alone, describes it by its hint, and draws no group', async ({
    page,
}) => {
    await open(page);
    const double = page.getByRole('checkbox', { name: 'Score the last round double', exact: true });
    await expect(double).toHaveAccessibleName('Score the last round double');
    await expect(double).toHaveAccessibleDescription('Every bid in round 10 counts twice');
    await expect(page.locator('#double').locator('xpath=../..')).toMatchAriaSnapshot(`
        - checkbox "Score the last round double"
        - paragraph: Every bid in round 10 counts twice
    `);
    await expect(page.getByRole('group')).toHaveCount(0);
    await expect(
        page.getByRole('checkbox', { name: 'I agree to the house rules' })
    ).toHaveAttribute('aria-required', 'true');
});

test('refuses a consent box left unchecked above the box alone, and takes the error away once it is checked', async ({
    page,
}) => {
    await open(page);
    await page.getByRole('button', { name: 'Start' }).click();
    const agree = page.locator('#agree');
    await expect(agree).toBeFocused();
    await expect(page.locator('#agree-error')).toHaveText('Error: Check the box to go on.');
    await expect(agree).toHaveAttribute('aria-invalid', 'true');
    await expect(agree).toHaveAccessibleDescription('Error: Check the box to go on.');
    await expect(page.locator('.dk-field-error')).toHaveCount(1);
    // Above the box, before its label and never inside it, where it would join the box's name.
    expect(
        await page.locator('#agree-error').evaluate((error) => ({
            before: error.nextElementSibling?.matches('label.dk-choice') ?? false,
            inside: error.closest('label') !== null,
        }))
    ).toEqual({ before: true, inside: false });
    await expect
        .poll(() => heard(page))
        .toEqual(['I agree to the house rules: Error: Check the box to go on.']);
    await agree.check();
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.locator('.dk-field-error')).toHaveCount(0);
    await expect(agree).not.toHaveAttribute('aria-invalid', 'true');
    await expect
        .poll(() => page.evaluate(() => (window as unknown as { submits: number }).submits))
        .toBe(1);
});

test('refuses a consent box in a form React draws, handing the box itself and drawing the error the page gives', async ({
    page,
}) => {
    await servePage(page, {
        title: 'House rules',
        body: '<main class="dk-page"><h1>House rules</h1><div id="app"></div></main>',
        script: await bundle('checkbox-page.tsx'),
    });
    await page.waitForFunction(() => 'ready' in window);
    await page.getByRole('button', { name: 'Start' }).click();
    await expect
        .poll(() => page.evaluate(() => (window as unknown as { handed?: string[] }).handed))
        .toEqual(['agree: Check the box to go on.']);
    const agree = page.locator('#agree');
    await expect(agree).toBeFocused();
    await expect(page.locator('#agree-error')).toHaveText('Error: Check the box to go on.');
    await expect(agree).toHaveAttribute('aria-describedby', 'agree-error');
    await expect(page.locator('#double')).not.toHaveAttribute('aria-invalid', 'true');
    // A read-only field's ref holds the value it draws, which takes the page's other props too.
    expect(await page.evaluate(() => (window as unknown as { held?: string }).held)).toBe(
        'textarea'
    );
    await expect(page.getByRole('textbox', { name: 'Only the host keeps score' })).toHaveAttribute(
        'title',
        'Set by the host'
    );
});

test('makes the label a target the field is tall on a wide screen and a thumb is on a phone, hugging its words', async ({
    page,
}) => {
    for (const [width, least] of [
        [1280, 36],
        [390, 44],
    ] as const) {
        await open(page, width);
        const label = page.locator('label[for="double"]');
        const drawn = await box(label);
        expect(drawn.height, `${String(width)} wide`).toBeGreaterThanOrEqual(least);
        if (width === 390) expect(drawn.width).toBeGreaterThanOrEqual(least);
        const field = await box(page.locator('#double').locator('xpath=../..'));
        expect(drawn.width, `${String(width)} wide`).toBeLessThan(field.width);
    }
});

test('starts the hint under the words, and toggles the box by its words and never by its hint', async ({
    page,
}) => {
    await open(page);
    const words = await box(page.locator('label[for="double"] > span'));
    const hint = page.locator('#double-hint');
    const hinted = await box(hint);
    const padding = Number.parseFloat((await style(hint, 'padding-left'))['padding-left'] ?? '0');
    expect(Math.abs(hinted.x + padding - words.x)).toBeLessThanOrEqual(1);
    const double = page.locator('#double');
    await hint.click();
    await expect(double).not.toBeChecked();
    await page.getByText('Score the last round double').click();
    await expect(double).toBeChecked();
});

test('draws an invalid box with a dashed line and one that is off in the system color for it, in forced colors', async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'Only Chromium emulates forced colors.');
    await open(page);
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(page.locator('#agree')).toBeFocused();
    await page.locator('#double').focus();
    await forceColors(page);
    expect(await style(page.locator('#agree'), 'outline-style')).toEqual({
        'outline-style': 'dashed',
    });
    const off = await page.evaluate(() => {
        const probe = document.createElement('span');
        probe.style.color = 'GrayText';
        document.body.append(probe);
        const gray = getComputedStyle(probe).color;
        probe.remove();
        const label = document.querySelector('label[for="skip"]');
        return { gray, label: label ? getComputedStyle(label).color : '' };
    });
    expect(off.label).toBe(off.gray);
});

test('passes the audit unchecked, checked, refused, off and read only, in both themes', async ({
    page,
}) => {
    for (const theme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme: theme });
        await open(page);
        expect((await new AxeBuilder({ page }).analyze()).violations, theme).toEqual([]);
        await page.locator('#double').check();
        await page.getByRole('button', { name: 'Start' }).click();
        await expect(page.locator('#agree-error')).toBeVisible();
        expect((await new AxeBuilder({ page }).analyze()).violations, theme).toEqual([]);
    }
});

test('draws a read-only field as its state in words, sent as the box would be', async ({
    page,
}) => {
    await open(page);
    await expect(page.getByRole('checkbox', { name: 'Show the scores' })).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'Show the scores' })).toHaveValue('On');
    await expect(page.locator('input[type="hidden"][name="seen"]')).toHaveValue('on');
});

test('wraps a long label at 320 wide and twice the text size, under the wider text spacing, with nothing pushed sideways or cut off', async ({
    page,
    browserName,
}) => {
    await open(page, 320);
    await doubled(page, browserName);
    await page.addStyleTag({ content: SPACED });
    expect(await sideways(page)).toBe(0);
    // The parts that carry words, since a box's label reaches past its field by its highlight's
    // padding on purpose, as a choice in a set does.
    expect(
        await cutOff(page, '.dk-choice, .dk-choice > span, .dk-field-hint, .dk-field-label')
    ).toEqual([]);
    const words = await box(page.locator('label[for="double"] > span'));
    expect(words.height).toBeGreaterThan((await box(page.locator('#double'))).height * 2);
});
