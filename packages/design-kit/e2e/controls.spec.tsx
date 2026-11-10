import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { controlStates } from '../examples/examples.js';
import { Callout } from '../src/react.js';
import { height, KIT, sideways, style, writePage } from './page.js';
import { cutOff, SPACED } from './spacing.js';

/*
 * The buttons, fields and callouts as a browser draws them, from the markup the components draw
 * and the kit's own sheets: each state told apart by more than its color, forced colors included,
 * a field and a button level at the target size on a phone and at the field's height on a wide
 * screen, a large button at the target at every width and a text button drawn as a link at the
 * button's height, an off button the keyboard still reaches, the field's label, hint and error
 * read as its name and description, an empty live callout waiting a pixel out of the flow until
 * it is filled, a tap on a touch screen leaving a toggle's edge as it was, no text cut off under
 * the wider spacing a visitor may set, and no audit findings for any state in either theme.
 */

/** Every state of each control, on a page of its own. */
const STATES = renderToStaticMarkup(
    <main>
        <h1>Controls</h1>
        {controlStates}
    </main>
);

const open = async (
    page: Page,
    {
        width = 1280,
        theme = 'light',
        css = '',
    }: { width?: number; theme?: 'light' | 'dark'; css?: string } = {}
) => {
    await writePage(page, { width, theme, css, title: 'Controls', body: STATES });
};

/** What a control's text starts past: its left padding and the edge outside it. */
const inset = (locator: Locator) => style(locator, 'padding-left', 'border-left-width');

test('sets a button and a field level and their text at one inset, at the field height wide and the target on a phone', async ({
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
        // A field's text starts where a button's label does, by the same padding inside the same edge.
        const button = await inset(page.getByRole('button', { name: 'Filters' }));
        expect(await inset(page.getByLabel('Search words')), `${String(width)}px`).toEqual(button);
        expect(await inset(page.getByLabel('Sort by')), `${String(width)}px`).toEqual(button);
    }
});

test('draws text in a field at 16px or more on a phone, so tapping it does not zoom', async ({
    page,
}) => {
    await open(page, { width: 360 });
    for (const name of ['Search words', 'Sort by', 'Note']) {
        const size =
            (await style(page.getByLabel(name, { exact: true }), 'font-size'))['font-size'] ?? '';
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

test("leaves a toggle's edge as it was after a tap on a touch screen, where no pointer rests", async ({
    browser,
}) => {
    const context = await browser.newContext({ hasTouch: true, isMobile: true });
    try {
        const page = await context.newPage();
        await open(page, { width: 360 });
        // A touch screen reports no pointer that can rest over a button, so the pointer rule is off.
        expect(await page.evaluate(() => matchMedia('(hover: hover)').matches)).toBe(false);
        const toggle = page.getByRole('button', { name: 'Guest', pressed: false });
        const resting = await style(toggle, 'border-top-color', 'box-shadow');
        await toggle.tap();
        await page.waitForTimeout(300);
        expect(await style(toggle, 'border-top-color', 'box-shadow')).toEqual(resting);
        expect(resting['border-top-color']).toBe('rgb(133, 133, 133)');
    } finally {
        await context.close();
    }
});

test('cuts no text off a callout or a field under the wider spacing a visitor may set', async ({
    page,
}) => {
    await open(page, { width: 320, css: SPACED });
    expect(
        await cutOff(page, '.dk-callout, .dk-field, .dk-input, .dk-select, .dk-textarea')
    ).toEqual([]);
    expect(await sideways(page)).toBe(0);
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

test('draws a large button at the target at every width, with wider inline padding and the body text', async ({
    page,
}) => {
    for (const width of [1280, 360]) {
        await open(page, { width });
        const large = page.getByRole('button', { name: 'Try it', exact: true });
        expect(await height(large), `${String(width)}px`).toBe(44);
        expect(await style(large, 'padding-left', 'font-size')).toEqual({
            'padding-left': '16px',
            'font-size': '16px',
        });
        // The accent button grows the same way, keeping its fill.
        const lead = page.getByRole('button', { name: 'Open the demo' });
        expect(await height(lead), `${String(width)}px`).toBe(44);
        expect((await style(lead, 'background-color'))['background-color']).toBe(
            'rgb(31, 79, 216)'
        );
    }
});

test("draws a text button as a link, at the button's height, with its states", async ({ page }) => {
    for (const [width, tall] of [
        [1280, 36],
        [360, 44],
    ] as const) {
        await open(page, { width });
        const text = page.getByRole('button', { name: 'Show the markup' });
        expect(await height(text), `${String(width)}px`).toBe(tall);
        expect(
            await style(
                text,
                'border-top-width',
                'padding-left',
                'min-width',
                'background-color',
                'color',
                'text-decoration-line'
            ),
            `${String(width)}px`
        ).toEqual({
            'border-top-width': '0px',
            'padding-left': '0px',
            'min-width': '0px',
            'background-color': 'rgba(0, 0, 0, 0)',
            color: 'rgb(31, 79, 216)',
            'text-decoration-line': 'underline',
        });
    }
    // Pointed at, the underline thickens, since there is no edge to color.
    const text = page.getByRole('button', { name: 'Show the markup' });
    await text.hover();
    await expect
        .poll(
            async () =>
                (await style(text, 'text-decoration-thickness'))['text-decoration-thickness']
        )
        .toBe('2px');
    // Open, it keeps its link look with the thicker underline, since the pressed look has no
    // padding to fit and the open panel is the sign.
    expect(
        await style(
            page.getByRole('button', { name: 'Hide the markup' }),
            'background-color',
            'box-shadow',
            'color',
            'text-decoration-thickness'
        )
    ).toEqual({
        'background-color': 'rgba(0, 0, 0, 0)',
        'box-shadow': 'none',
        color: 'rgb(31, 79, 216)',
        'text-decoration-thickness': '2px',
    });
    // Off, it keeps its underline in the muted text with no edge, and takes no hover.
    const none = page.getByRole('button', { name: 'No markup' });
    await expect(none).toBeDisabled();
    await none.hover();
    await page.waitForTimeout(300);
    expect(
        await style(
            none,
            'color',
            'text-decoration-line',
            'text-decoration-thickness',
            'border-top-width'
        )
    ).toEqual({
        color: 'rgb(92, 92, 92)',
        'text-decoration-line': 'underline',
        'text-decoration-thickness': 'auto',
        'border-top-width': '0px',
    });
});

test('draws a textarea as a field, three rows tall, that resizes in height alone', async ({
    page,
}) => {
    await open(page);
    const note = page.getByLabel('Note', { exact: true });
    const field = page.getByLabel('Search words');
    const look = ['border-top-color', 'background-color', 'color', 'padding-left', 'font-size'];
    expect(await style(note, ...look)).toEqual(await style(field, ...look));
    expect(await height(note)).toBeGreaterThan(await height(field));
    await expect(note).toHaveAttribute('rows', '3');
    // Whole lines, with the padding and the edge around them, so no line is cut at the foot.
    const lines = await note.evaluate((element) => {
        const style = getComputedStyle(element);
        const inside =
            element.clientHeight -
            Number.parseFloat(style.paddingTop) -
            Number.parseFloat(style.paddingBottom);
        return inside / Number.parseFloat(style.lineHeight);
    });
    expect(lines).toBe(3);
    expect(await style(note, 'resize')).toEqual({ resize: 'vertical' });
    // An error turns its edge, and disabled takes the surface, as an input's do.
    const message = page.getByLabel('Message');
    await expect(message).toHaveAccessibleDescription('Error: Write a message');
    expect(await style(message, 'border-top-color')).toEqual(
        await style(page.getByRole('textbox', { name: 'Email' }), 'border-top-color')
    );
    expect(await style(page.getByLabel('Closed note'), 'background-color')).toEqual(
        await style(page.getByLabel('Store'), 'background-color')
    );
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

test("draws a choice at the field height, a thumb's target on a phone, lit under a pointer, and a row on one line", async ({
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
    // A disabled choice is passed over by the keys, in the muted text with no highlight.
    const boost = page.getByRole('radio', { name: 'Boost' });
    await expect(boost).toBeDisabled();
    await hide.focus();
    await page.keyboard.press('ArrowDown');
    await expect(pin).toBeFocused();
    expect(await style(choiceOf(page, boost), 'color', 'background-color')).toEqual({
        color: 'rgb(92, 92, 92)',
        'background-color': 'rgba(0, 0, 0, 0)',
    });
});

test('reads a set by its legend, describes it by its hint or error, and marks an invalid set', async ({
    page,
}) => {
    await open(page);
    const rule = page.getByRole('radiogroup', { name: 'What the rule does' });
    await expect(rule).toHaveAccessibleDescription('A rule applies to every search');
    await expect(rule).not.toHaveAttribute('aria-invalid');
    await expect(rule.getByRole('radio', { name: /^Pin/ })).toHaveAccessibleName(
        'Pin to the top of the results'
    );
    // A radio group is marked as a whole, since the keyboard enters it at the chosen radio.
    const when = page.getByRole('radiogroup', { name: 'When' });
    await expect(when).toHaveAccessibleDescription('Error: Choose when the rule runs');
    await expect(when).toHaveAttribute('aria-invalid', 'true');
    const always = when.getByRole('radio', { name: 'Always' });
    await expect(always).not.toHaveAttribute('aria-invalid');
    // Checkboxes are each a stop, so each is marked, and a set with no error marks none.
    const show = page.getByRole('group', { name: 'Show' });
    await expect(show).not.toHaveAttribute('aria-invalid');
    await expect(show.getByRole('checkbox', { name: 'Brand' })).not.toHaveAttribute('aria-invalid');
    // Every control of the invalid set draws a line in the danger color, which gives way to the ring.
    expect(
        await style(when.getByRole('radio', { name: 'During a sale' }), 'outline-style')
    ).toEqual({ 'outline-style': 'solid' });
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
        // A text button keeps its underline, which is what tells it from the text around it, and
        // takes no edge, which the system would paint.
        expect(
            await style(
                page.getByRole('button', { name: 'Show the markup' }),
                'text-decoration-line',
                'border-top-width'
            )
        ).toEqual({ 'text-decoration-line': 'underline', 'border-top-width': '0px' });
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
        // A textarea with an error takes the same dashed line.
        expect(
            await style(page.locator('.dk-textarea[aria-invalid="true"]').first(), 'outline-style')
        ).toEqual({ 'outline-style': 'dashed' });
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
        // Every control of a set with an error is marked the same way.
        const choice = page
            .locator('.dk-choice-field[aria-invalid="true"] .dk-choice > input')
            .first();
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
