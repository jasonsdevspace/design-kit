import { readFileSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { controlStates } from '../examples/examples.js';
import { Callout } from '../src/react.js';

/*
 * The buttons, fields and callouts as a browser draws them, from the markup the components draw
 * and the kit's own sheets: each state told apart by more than its color, forced colors included,
 * a field and a button level at the target size on a phone and at the field's height on a wide
 * screen, an off button the keyboard still reaches, the field's label, hint and error read as its
 * name and description, an empty live callout waiting a pixel out of the flow until it is filled,
 * and no audit
 * findings for any state in either theme.
 */

const sheet = (name: string) => readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8');
const KIT = ['tokens.css', 'base.css', 'components.css'].map(sheet).join('\n');

/** Every state of each control, on a page of its own. */
const STATES = renderToStaticMarkup(
    <main>
        <h1>Controls</h1>
        {controlStates}
    </main>
);

const open = async (
    page: Page,
    { width = 1280, theme = 'light' }: { width?: number; theme?: 'light' | 'dark' } = {}
) => {
    await page.setViewportSize({ width, height: 900 });
    await page.setContent(
        `<!doctype html><html lang="en" data-theme="${theme}"><head><title>Controls</title>` +
            `<style>${KIT}</style></head><body>${STATES}</body></html>`
    );
};

const style = (locator: Locator, ...names: string[]) =>
    locator.evaluate(
        (element, wanted) =>
            Object.fromEntries(
                wanted.map((name) => [name, getComputedStyle(element).getPropertyValue(name)])
            ),
        names
    );

const height = async (locator: Locator) => Math.round((await locator.boundingBox())?.height ?? 0);

test('sets a button and a field level, at the field height wide and the target on a phone', async ({
    page,
}) => {
    for (const [width, tall] of [
        [1280, 36],
        [360, 44],
    ] as const) {
        await open(page, { width });
        expect(await height(page.getByRole('button', { name: 'Filters' }))).toBe(tall);
        expect(await height(page.getByLabel('Search words'))).toBe(tall);
        expect(await height(page.getByLabel('Sort by'))).toBe(tall);
        // A label of one character never makes a button narrower than it is tall.
        const one = await page.getByRole('button', { name: 'I', exact: true }).boundingBox();
        expect(Math.round(one?.width ?? 0)).toBeGreaterThanOrEqual(tall);
    }
});

test('draws text in a field at 16px or more on a phone, so tapping it does not zoom', async ({
    page,
}) => {
    await open(page, { width: 360 });
    for (const name of ['Search words', 'Sort by']) {
        const size = (await style(page.getByLabel(name), 'font-size'))['font-size'] ?? '';
        expect(parseFloat(size)).toBeGreaterThanOrEqual(16);
    }
});

test('fits a phone 320px wide without scrolling the page sideways', async ({ page }) => {
    await open(page, { width: 320 });
    const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBe(0);
});

test('keeps an off button in the tab order, and skips a disabled one, drawn alike', async ({
    page,
}) => {
    await open(page);
    const off = page.getByRole('button', { name: 'Previous' });
    const disabled = page.getByRole('button', { name: 'Next' });
    await page.getByRole('button', { name: 'Guest' }).focus();
    await page.keyboard.press('Tab');
    await expect(off).toBeFocused();
    await expect(off).toBeDisabled();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'I', exact: true })).toBeFocused();
    const look = ['color', 'background-color', 'border-top-color', 'cursor'];
    expect(await style(off, ...look)).toEqual(await style(disabled, ...look));
    // Both would match the disabled button if the resting look won, so the words are held to the
    // muted text.
    expect((await style(off, 'color')).color).toBe('rgb(92, 92, 92)');
});

test('draws a button in a disabled fieldset as off, and keeps the keyboard off it', async ({
    page,
}) => {
    await open(page);
    const look = ['color', 'background-color', 'border-top-color', 'cursor'];
    const inside = page.getByRole('button', { name: 'Join' });
    expect(await style(inside, ...look)).toEqual(
        await style(page.getByRole('button', { name: 'Next' }), ...look)
    );
    expect((await style(inside, 'color')).color).toBe('rgb(92, 92, 92)');
    await expect(inside).toBeDisabled();
});

test('turns the edge to the focus color under a pointer, and underlines the accent instead', async ({
    page,
}) => {
    await open(page);
    // The edge's color eases in over the short duration, so it is read once it has settled.
    const edge = (name: string) => async () =>
        (await style(page.getByRole('button', { name }), 'border-top-color'))['border-top-color'];
    await page.getByRole('button', { name: 'Filters' }).hover();
    await expect.poll(edge('Filters')).toBe('rgb(31, 79, 216)');
    const accent = page.getByRole('button', { name: 'Save rule' });
    await accent.hover();
    expect((await style(accent, 'text-decoration-line'))['text-decoration-line']).toBe('underline');
    // Off takes no hover, so it never looks as though a press would do something.
    await page.getByRole('button', { name: 'Previous' }).hover();
    await page.waitForTimeout(300);
    expect(await edge('Previous')()).toBe('rgb(217, 217, 217)');
});

test("tells a pressed toggle by its edge as well as its color, and keeps the toggle's name", async ({
    page,
}) => {
    await open(page);
    const pressed = page.getByRole('button', { name: 'Member', pressed: true });
    const unpressed = page.getByRole('button', { name: 'Guest', pressed: false });
    await expect(pressed).toBeVisible();
    await expect(unpressed).toBeVisible();
    expect((await style(pressed, 'box-shadow'))['box-shadow']).toMatch(/inset/);
    expect((await style(pressed, 'background-color'))['background-color']).toBe(
        'rgb(227, 234, 251)'
    );
    expect((await style(unpressed, 'box-shadow'))['box-shadow']).toBe('none');
});

test('draws an open accent button in the page text on the highlight, so its words stay read', async ({
    page,
}) => {
    await open(page);
    const menu = page.getByRole('button', { name: 'Menu' });
    expect(await style(menu, 'color', 'background-color')).toEqual({
        color: 'rgb(26, 26, 26)',
        'background-color': 'rgb(227, 234, 251)',
    });
});

test('keeps a pressed toggle that is off told apart from one that is not pressed', async ({
    page,
}) => {
    await open(page);
    const on = await style(page.getByRole('button', { name: 'Locked on' }), 'box-shadow');
    const off = await style(page.getByRole('button', { name: 'Locked off' }), 'box-shadow');
    expect(on['box-shadow']).toMatch(/inset/);
    expect(off['box-shadow']).toBe('none');
});

test('draws a list that shows its options as the browser does, with no caret', async ({ page }) => {
    await open(page);
    const tags = await style(page.getByLabel('Tags'), 'appearance', 'background-image');
    expect(tags).toEqual({ appearance: 'auto', 'background-image': 'none' });
});

test('draws the focus ring after the keyboard, on the accent and in every callout', async ({
    page,
}) => {
    await open(page);
    const ring = (locator: Locator) => style(locator, 'outline-style', 'outline-width');
    const accent = page.getByRole('button', { name: 'Save rule' });
    await accent.click();
    expect((await ring(accent))['outline-style']).toBe('none');
    await page.getByRole('button', { name: 'Filters' }).focus();
    await page.keyboard.press('Tab');
    await expect(accent).toBeFocused();
    expect(await ring(accent)).toEqual({ 'outline-style': 'solid', 'outline-width': '2px' });
    for (const tone of ['info', 'success', 'warning', 'danger']) {
        await page.getByLabel(`Name in ${tone}`).focus();
        await page.keyboard.press('Tab');
        const again = page
            .locator('.dk-callout-actions button')
            .nth(['info', 'success', 'warning', 'danger'].indexOf(tone));
        await expect(again).toBeFocused();
        expect(await ring(again)).toEqual({ 'outline-style': 'solid', 'outline-width': '2px' });
    }
});

test('reads a field by its label, and describes it by its hint and then its error', async ({
    page,
}) => {
    await open(page);
    await page.getByText('Search words').click();
    await expect(page.getByLabel('Search words')).toBeFocused();
    await expect(page.getByLabel('Search words')).toHaveAccessibleDescription(
        'Separate alternatives with commas'
    );
    await expect(page.getByLabel('Search words')).not.toHaveAttribute('aria-invalid');
    const email = page.getByRole('textbox', { name: 'Email' });
    await expect(email).toHaveAccessibleDescription(
        'Where the receipt goes Error: Enter an email address, like name@example.com'
    );
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('combobox', { name: 'Sort by' })).toHaveValue('');
    await expect(page.getByRole('combobox', { name: 'Brand' })).toHaveAccessibleDescription(
        'Error: Pick a brand'
    );
});

test('draws an invalid control in the danger color, and the error beside the hint', async ({
    page,
}) => {
    await open(page);
    const edge = async (name: string) =>
        (await style(page.getByLabel(name), 'border-top-color'))['border-top-color'];
    expect(await edge('Email')).toBe('rgb(179, 38, 30)');
    expect(await edge('Search words')).not.toBe(await edge('Email'));
    // The hidden word is read, and drawn at one pixel.
    const word = page.locator('.dk-field-error .dk-visually-hidden').first();
    expect(await word.boundingBox()).toMatchObject({ width: 1, height: 1 });
});

/** The label around a choice's control. */
const choiceOf = (page: Page, control: Locator) => page.locator('.dk-choice', { has: control });

test('draws a choice at the field height wide and the target on a phone, lit under a pointer', async ({
    page,
}) => {
    for (const [width, tall] of [
        [1280, 36],
        [360, 44],
    ] as const) {
        await open(page, { width });
        const choice = choiceOf(page, page.getByRole('radio', { name: 'Hide' }));
        expect(await height(choice)).toBe(tall);
        const ground = async () => (await style(choice, 'background-color'))['background-color'];
        expect(await ground()).toBe('rgba(0, 0, 0, 0)');
        await choice.hover();
        await expect.poll(ground).toBe('rgb(227, 234, 251)');
    }
    // A row of checkboxes shares one line where it fits.
    await open(page);
    const tops = await Promise.all(
        ['Brand', 'Price', 'Color'].map(
            async (name) =>
                (await choiceOf(page, page.getByRole('checkbox', { name })).boundingBox())?.y
        )
    );
    expect(new Set(tops).size).toBe(1);
});

test('moves and checks among radios with the arrow keys, ringing the control and lighting its word', async ({
    page,
}) => {
    await open(page);
    const hide = page.getByRole('radio', { name: 'Hide' });
    const pin = page.getByRole('radio', { name: /^Pin/ });
    await hide.focus();
    await expect(hide).toBeChecked();
    await page.keyboard.press('ArrowUp');
    await expect(pin).toBeFocused();
    await expect(pin).toBeChecked();
    await expect(hide).not.toBeChecked();
    expect(await style(pin, 'outline-style', 'outline-width')).toEqual({
        'outline-style': 'solid',
        'outline-width': '2px',
    });
    // The highlight eases in over the short duration, so it is read once it has settled.
    await expect
        .poll(
            async () => (await style(choiceOf(page, pin), 'background-color'))['background-color']
        )
        .toBe('rgb(227, 234, 251)');
    // A disabled choice is passed over, in the muted text with no highlight.
    const boost = page.getByRole('radio', { name: 'Boost' });
    await expect(boost).toBeDisabled();
    expect((await style(choiceOf(page, boost), 'color')).color).toBe('rgb(92, 92, 92)');
});

test('reads a set by its legend, describes it by its hint or error, and marks its first control', async ({
    page,
}) => {
    await open(page);
    const rule = page.getByRole('group', { name: 'What the rule does' });
    await expect(rule).toHaveAccessibleDescription('A rule applies to every search');
    await expect(rule.getByRole('radio', { name: /^Pin/ })).toHaveAccessibleName(
        'Pin to the top of the results'
    );
    const when = page.getByRole('group', { name: 'When' });
    await expect(when).toHaveAccessibleDescription('Error: Choose when the rule runs');
    const always = when.getByRole('radio', { name: 'Always' });
    await expect(always).toHaveAttribute('aria-invalid', 'true');
    await expect(when.getByRole('radio', { name: 'During a sale' })).not.toHaveAttribute(
        'aria-invalid'
    );
    // The invalid control's line in the danger color, which gives way to the ring.
    expect(await style(always, 'outline-style', 'outline-color')).toEqual({
        'outline-style': 'solid',
        'outline-color': 'rgb(179, 38, 30)',
    });
    await always.focus();
    expect((await style(always, 'outline-color'))['outline-color']).toBe('rgb(31, 79, 216)');
});

test('opens no gap around an empty live callout in a grid, and keeps it for a screen reader', async ({
    page,
}) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.setContent(
        `<!doctype html><html lang="en" data-theme="light"><head><title>Callouts</title>` +
            `<style>${KIT} .grid { display: grid; gap: 16px; }</style>` +
            `</head><body><main class="grid">` +
            '<div id="before">Before</div>' +
            renderToStaticMarkup(<Callout tone="danger" live="alert" />) +
            '<div id="after">After</div>' +
            '</main></body></html>'
    );
    const apart = async () => {
        const before = await page.locator('#before').boundingBox();
        const after = await page.locator('#after').boundingBox();
        return Math.round((after?.y ?? 0) - ((before?.y ?? 0) + (before?.height ?? 0)));
    };
    // One gap, as if the callout were not there, while it waits for its words.
    expect(await apart()).toBe(16);
    await expect(page.getByRole('alert')).toBeAttached();
    // Filled, it takes its cell and its look.
    await page.evaluate(() => {
        const body = document.querySelector('.dk-callout-body');
        if (body) body.innerHTML = '<span class="dk-visually-hidden">Error: </span>Saved.';
    });
    expect(await apart()).toBeGreaterThan(32);
    await expect(page.getByRole('alert')).toBeVisible();
});

test("draws nothing for an empty live callout, and the callout's look once it is filled", async ({
    page,
}) => {
    const tones = ['info', 'success', 'warning', 'danger'] as const;
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.setContent(
        `<!doctype html><html lang="en" data-theme="light"><head><title>Callouts</title>` +
            `<style>${KIT}</style></head><body><main>` +
            renderToStaticMarkup(
                <>
                    {tones.map((tone) => (
                        <Callout key={tone} tone={tone} live="status" />
                    ))}
                </>
            ) +
            '</main></body></html>'
    );
    const callouts = page.locator('.dk-callout');
    await expect(callouts).toHaveCount(tones.length);
    // In forced colors too, where a callout's edge would otherwise show.
    for (const forcedColors of ['none', 'active'] as const) {
        await page.emulateMedia({ forcedColors });
        for (const callout of await callouts.all()) {
            // Drawn as visually hidden text is, a pixel out of the flow, rather than hidden, so it
            // has a box and stays in the tree a screen reader reads, which a role query leaves out
            // for an element that is hidden.
            expect(await callout.boundingBox()).not.toBeNull();
            expect(await height(callout)).toBeLessThanOrEqual(1);
            const drawn = await style(callout, 'background-color', 'border-top-width');
            // No ground, whatever color forced colors give the transparent one.
            expect(drawn['background-color']).toMatch(/^rgba\(\d+, \d+, \d+, 0\)$/);
            expect(drawn['border-top-width']).toBe('0px');
            await expect(callout.getByRole('status')).toBeAttached();
        }
    }
    await page.emulateMedia({ forcedColors: 'none' });
    // Filled as the reference says a page fills one, with the tone's word for success, warning and
    // danger, each takes the callout's look again.
    await page.evaluate(() => {
        for (const body of document.querySelectorAll('.dk-callout-body')) {
            const callout = body.parentElement;
            const word = callout?.classList.contains('dk-callout-success')
                ? 'Success: '
                : callout?.classList.contains('dk-callout-warning')
                  ? 'Warning: '
                  : callout?.classList.contains('dk-callout-danger')
                    ? 'Error: '
                    : '';
            body.innerHTML = word
                ? `<span class="dk-visually-hidden">${word}</span>Saved.`
                : 'Saved.';
        }
    });
    for (const callout of await callouts.all()) {
        expect(await height(callout)).toBeGreaterThan(0);
        const drawn = await style(callout, 'background-color', 'padding-top');
        expect(drawn['background-color']).not.toBe('rgba(0, 0, 0, 0)');
        expect(drawn['padding-top']).not.toBe('0px');
    }
});

test.describe('in forced colors', () => {
    test.use({ forcedColors: 'active' });

    test('keeps every state in sight where the page loses its own colors', async ({ page }) => {
        await open(page);
        const pressed = await style(
            page.getByRole('button', { name: 'Member' }),
            'background-color'
        );
        const unpressed = await style(
            page.getByRole('button', { name: 'Guest' }),
            'background-color'
        );
        expect(pressed).not.toEqual(unpressed);
        // An off button is drawn in GrayText, as the browser draws a disabled one by itself.
        const look = ['color', 'border-top-color'];
        expect(await style(page.getByRole('button', { name: 'Previous' }), ...look)).toEqual(
            await style(page.getByRole('button', { name: 'Next' }), ...look)
        );
        // An off toggle that is pressed keeps its gray words off the system's highlight, and is
        // told from one that is not by its edge.
        const locked = page.getByRole('button', { name: 'Locked on' });
        const loose = page.getByRole('button', { name: 'Locked off' });
        expect(await style(locked, 'background-color')).toEqual(
            await style(loose, 'background-color')
        );
        expect(await style(locked, 'border-top-color')).not.toEqual(
            await style(loose, 'border-top-color')
        );
        // The select's own arrow comes back, since the drawn one is a background.
        expect((await style(page.getByLabel('Sort by'), 'appearance')).appearance).toBe('auto');
        // Each callout's ground is gone, so its edge marks where it starts and ends.
        for (const callout of await page.locator('.dk-callout').all()) {
            const { 'border-top-style': line, 'border-top-color': color } = await style(
                callout,
                'border-top-style',
                'border-top-color'
            );
            expect(line).toBe('solid');
            expect(color).not.toBe('rgba(0, 0, 0, 0)');
        }
    });
});

for (const theme of ['light', 'dark'] as const) {
    test(`has no audit findings for any state in the ${theme} theme, wide and on a phone`, async ({
        page,
    }) => {
        for (const width of [1280, 360]) {
            await open(page, { width, theme });
            const results = await new AxeBuilder({ page }).analyze();
            expect(results.violations.map((violation) => violation.id)).toEqual([]);
        }
    });
}

test('marks an invalid field with a dashed line in forced colors, where its red is gone', async ({
    browser,
}) => {
    const context = await browser.newContext({ forcedColors: 'active' });
    try {
        const page = await context.newPage();
        await open(page);
        const edge = (locator: Locator) =>
            style(locator, 'border-top-width', 'outline-style', 'outline-color');
        const text = await page.evaluate(() => getComputedStyle(document.body).color);
        const invalid = await edge(page.locator('.dk-input[aria-invalid="true"]').first());
        const valid = await edge(page.locator('.dk-input:not([aria-invalid])').first());
        // A dashed line in the text color around the invalid field, and the edge's width
        // unchanged, so nothing in it moves as the error comes and goes.
        expect(invalid).toEqual({
            'border-top-width': valid['border-top-width'],
            'outline-style': 'dashed',
            'outline-color': text,
        });
        expect(valid['outline-style']).toBe('none');
        // With focus, the ring takes the dashed line's place, as on any control.
        const field = page.locator('.dk-input[aria-invalid="true"]').first();
        await field.focus();
        expect(await style(field, 'outline-style')).toEqual({ 'outline-style': 'solid' });
        // The first control of a set with an error is marked the same way.
        const choice = page.locator('.dk-choice > input[aria-invalid="true"]').first();
        expect(await style(choice, 'outline-style', 'outline-color')).toEqual({
            'outline-style': 'dashed',
            'outline-color': text,
        });
        await choice.focus();
        expect(await style(choice, 'outline-style')).toEqual({ 'outline-style': 'solid' });
    } finally {
        await context.close();
    }
});

test('pads a callout as the other boxed text at its size is padded', async ({ page }) => {
    await open(page);
    expect(await style(page.locator('.dk-callout').first(), 'padding-top', 'padding-left')).toEqual(
        { 'padding-top': '12px', 'padding-left': '16px' }
    );
});
