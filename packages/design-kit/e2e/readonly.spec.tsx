import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { readOnlyFields } from '../examples/examples.js';
import { InputField, SelectField, TextareaField, ValueField } from '../src/react.js';
import { forceColors, sideways, style, writePage } from './page.js';
import { cutOff, SPACED, tooShort } from './spacing.js';
import { doubled } from './text-size.js';

/*
 * Read-only fields, as the reference draws them, beside a field that can be changed and one that is
 * disabled: the read-only edge kept in width but drawn clear on a clear ground with the text in the
 * page's color, the edge in the ground's color in forced colors, a read-only select drawn as a value
 * with its option's words and sending its value, and a read-only stepper with no buttons, with no
 * audit findings in either theme. A value of words stands at a field's height with its first line
 * level with a read-only field's words, fills its field, grows to show a long value whole at 320px
 * with twice the text size and under wider text spacing, and is one field tall where a browser
 * cannot size it. A note that turns read only while it saves keeps its height. The dealer's value
 * is longer than its field at that size in any machine's typeface, so the growth is held wherever
 * the test runs.
 */

const BODY = `<main class="dk-page"><h1>Round</h1><form id="form">${renderToStaticMarkup(
    <>
        {readOnlyFields}
        <ValueField
            id="dealer"
            label="Dealer"
            defaultValue="Round 3 of 10, Ann deals and Ben keeps the score"
        />
        <InputField id="note" label="Note" defaultValue="Ann deals" />
        <InputField id="gone" label="Seat" defaultValue="4" disabled />
    </>
)}</form></main>`;

/** The fields drawn in the body, so a test that counts them finds every one. */
const FIELDS = 7;

/**
 * Each field's control: a text field, a value of words, a read-only select's value, or a stepper's
 * value.
 */
const CONTROLS = '.dk-field :is(.dk-input, .dk-textarea, .dk-stepper-value)';

/**
 * The controls drawn out of their field, and a read-only value or a stepper's value that cuts off
 * what it holds, by width or by height, each by its id. A value that can be changed is the page's,
 * and one longer than its field scrolls inside it as a visitor types, so its width is not held
 * here, but a read-only value is there to be read and has nothing to scroll it into view.
 */
const cutControls = (page: Page): Promise<string[]> =>
    page.locator(CONTROLS).evaluateAll((controls) =>
        controls
            .filter((control) => {
                const box = control.getBoundingClientRect();
                const field = control.closest('.dk-field')?.getBoundingClientRect();
                return (
                    !field ||
                    (control.matches('.dk-stepper-value, [readonly]') &&
                        (control.scrollWidth > control.clientWidth + 1 ||
                            control.scrollHeight > control.clientHeight + 1)) ||
                    box.left < field.left - 0.5 ||
                    box.right > field.right + 0.5
                );
            })
            .map(({ id }) => id)
    );

const draw = (page: Page, theme: 'light' | 'dark' = 'light', css = '') =>
    writePage(page, { title: 'Read only', body: BODY, theme, css });

/** The body drawn at 320px, its text doubled and spaced out, each read back. */
const drawLarge = async (page: Page, browserName: string) => {
    await writePage(page, { title: 'Read only', body: BODY, width: 320, height: 640, css: SPACED });
    await doubled(page, browserName);
    const drawn = await style(page.locator('#round'), 'font-size', 'letter-spacing');
    expect(drawn['font-size']).toBe('32px');
    expect(Number.parseFloat(drawn['letter-spacing'] ?? '')).toBeCloseTo(0.12 * 32, 1);
    expect(await page.evaluate(() => window.innerWidth)).toBe(320);
};

const look = (page: Page, id: string) =>
    style(
        page.locator(`#${id}`),
        'border-top-color',
        'border-top-width',
        'background-color',
        'color'
    );

const height = async (locator: Locator): Promise<number> =>
    locator.evaluate((element) => element.getBoundingClientRect().height);

/** The read-only value of words and the read-only field of a figure the reference draws. */
const READ = ['round', 'score'] as const;

for (const theme of ['light', 'dark'] as const) {
    test(`draws a read-only field as a value, apart from one that can change or is off, in the ${theme} theme`, async ({
        page,
    }) => {
        await draw(page, theme);
        const open = await look(page, 'note');
        const off = await look(page, 'gone');
        for (const id of READ) {
            const read = await look(page, id);
            expect.soft(read['border-top-color'], id).toBe('rgba(0, 0, 0, 0)');
            expect.soft(read['background-color'], id).toBe('rgba(0, 0, 0, 0)');
            // The edge keeps its width, so the field lines up with the ones beside it.
            expect.soft(read['border-top-width'], id).toBe(open['border-top-width']);
            // In the page's own text color, as a field that can change is, and not the muted color
            // of one that is off.
            expect.soft(read['color'], id).toBe(open['color']);
            expect.soft(read['color'], id).not.toBe(off['color']);
        }
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations.map(({ id }) => id)).toEqual([]);
    });
}

test('keeps the error edge on a read-only field with an error, and draws a disabled one disabled', async ({
    page,
}) => {
    await draw(page);
    for (const id of READ) {
        const control = page.locator(`#${id}`);
        await control.evaluate((element) => {
            element.setAttribute('aria-invalid', 'true');
        });
        expect.soft((await look(page, id))['border-top-color'], id).not.toBe('rgba(0, 0, 0, 0)');
        await control.evaluate((element: HTMLInputElement | HTMLTextAreaElement) => {
            element.removeAttribute('aria-invalid');
            element.disabled = true;
        });
        expect.soft((await look(page, id))['color'], id).toBe((await look(page, 'gone'))['color']);
    }
});

test('draws a read-only edge in the ground color in forced colors', async ({ page }) => {
    await forceColors(page);
    await draw(page);
    const ground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    for (const id of READ) expect.soft((await look(page, id))['border-top-color'], id).toBe(ground);
});

test("draws a read-only select as a value with its option's words, and sends its value", async ({
    page,
}) => {
    await draw(page);
    const game = page.getByRole('textbox', { name: 'Game' });
    await expect(game).toHaveValue('Wizard, the card game of tricks and bids');
    await expect(game).toHaveAttribute('readonly', '');
    await expect(game).toHaveClass('dk-textarea dk-value');
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

test('keeps a note its height as it turns read only while it saves', async ({ page }) => {
    await writePage(page, {
        title: 'Read only',
        body: `<main class="dk-page"><form>${renderToStaticMarkup(
            <TextareaField id="saving" label="Note" rows={3} defaultValue="Bring the cards" />
        )}</form></main>`,
    });
    const note = page.locator('#saving');
    const before = await height(note);
    await note.evaluate((element: HTMLTextAreaElement) => {
        element.readOnly = true;
    });
    expect(await height(note)).toBeCloseTo(before, 0);
});

/** Where a value of words and a read-only field stand side by side, and how they are drawn. */
const SIDE_BY_SIDE = renderToStaticMarkup(
    <div className="dk-fields">
        <ValueField id="side-value" label="Round" defaultValue="Round 3" />
        <InputField id="side-field" label="Score" defaultValue="42" readOnly />
    </div>
);

/** Where a control's first line sits and how tall it is, from its own top. */
const lineOf = (locator: Locator) =>
    locator.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const drawn = getComputedStyle(element);
        return {
            height: box.height,
            // The first line's middle below the control's top, from the edge, the padding and half
            // a line, each control from its own top, so a row that wraps the two still compares
            // them.
            line:
                Number.parseFloat(drawn.borderTopWidth) +
                Number.parseFloat(drawn.paddingTop) +
                Number.parseFloat(drawn.lineHeight) / 2,
            // An input centers its one line in its height.
            middle: box.height / 2,
        };
    });

/** The places a value and a field are compared, each at the usual and twice the text size. */
const PLACES = [
    { width: 1280, app: false, large: false },
    { width: 390, app: false, large: false },
    // In an app's frame a field stands at the target's height on a wide screen too.
    { width: 1280, app: true, large: false },
].flatMap((place) => [place, { ...place, large: true }]);

test("stands a value of words at a read-only field's height, its first line level with the field's words", async ({
    page,
    browserName,
}) => {
    for (const { width, app, large } of PLACES) {
        const at = `${String(width)}${app ? ' in an app' : ''}${large ? ', twice the size' : ''}`;
        await writePage(page, {
            title: 'Read only',
            width,
            css: large ? SPACED : '',
            body: app
                ? `<div class="dk-app"><main class="dk-app-body">${SIDE_BY_SIDE}</main></div>`
                : `<main class="dk-page">${SIDE_BY_SIDE}</main>`,
        });
        if (large) await doubled(page, browserName);
        const value = await lineOf(page.locator('#side-value'));
        const field = await lineOf(page.locator('#side-field'));
        expect.soft(value.height, at).toBeCloseTo(field.height, 0);
        expect.soft(Math.abs(value.line - field.middle), at).toBeLessThanOrEqual(1);
    }
});

test('grows a long value to show it whole at 320px with twice the text size and wider spacing', async ({
    page,
    browserName,
}) => {
    await drawLarge(page, browserName);
    // Every field's label and control is there to measure, so nothing passes by matching nothing.
    await expect(page.locator('.dk-field')).toHaveCount(FIELDS);
    await expect(page.locator('.dk-field-label')).toHaveCount(FIELDS);
    await expect(page.locator(CONTROLS)).toHaveCount(FIELDS);
    expect(await cutOff(page, '.dk-field-label')).toEqual([]);
    expect(await cutControls(page)).toEqual([]);
    // Each control as tall as its line, which the wider spacing makes taller.
    expect(await tooShort(page, CONTROLS)).toEqual([]);
    expect(await sideways(page)).toBe(0);
    // Taller than a field, so it grew to its lines rather than scrolling in one.
    expect(await height(page.locator('#dealer'))).toBeGreaterThan(
        (await height(page.locator('#score'))) * 1.5
    );
});

test('shows a long option of a read-only select whole at that size, and still sends its value', async ({
    page,
    browserName,
}) => {
    await drawLarge(page, browserName);
    expect(await cutControls(page)).not.toContain('game');
    expect(await height(page.locator('#game'))).toBeGreaterThan(
        (await height(page.locator('#score'))) * 1.5
    );
    const sent = await page.evaluate(() =>
        new FormData(document.querySelector('form') ?? undefined).get('game')
    );
    expect(sent).toBe('wizard');
});

test('draws a value one field tall where the browser cannot size it to its words', async ({
    page,
}) => {
    // Outside the kit's layers, so it wins as a browser without the property draws.
    await draw(page, 'light', '.dk-value { field-sizing: fixed; }');
    expect(await style(page.locator('#round'), 'field-sizing')).toEqual({
        'field-sizing': 'fixed',
    });
    expect(await height(page.locator('#round'))).toBeCloseTo(
        await height(page.locator('#score')),
        0
    );
});

/** A read-only select and a read-only field, each with a button beside it. */
const WITH_ACTION = renderToStaticMarkup(
    <>
        <SelectField
            id="act-value"
            name="act"
            label="Game"
            defaultValue="wizard"
            readOnly
            action={
                <button type="button" className="dk-button">
                    Change
                </button>
            }
        >
            <option value="wizard">Wizard</option>
        </SelectField>
        <InputField
            id="act-field"
            label="Score"
            defaultValue="42"
            readOnly
            action={
                <button type="button" className="dk-button">
                    Change
                </button>
            }
        />
    </>
);

test('fills its field with a value, and leaves a button its place beside or under it', async ({
    page,
    browserName,
}) => {
    await draw(page);
    const [round, field] = await page
        .locator('#round')
        .evaluate((value) =>
            [value, value.closest('.dk-field')].map(
                (element) => element?.getBoundingClientRect().width ?? 0
            )
        );
    expect(round).toBeCloseTo(field ?? 0, 0);
    for (const large of [false, true]) {
        const at = large ? '320 at twice the text size' : '1280';
        await writePage(page, {
            title: 'Read only',
            width: large ? 320 : 1280,
            body: `<main class="dk-page"><form>${WITH_ACTION}</form></main>`,
        });
        if (large) await doubled(page, browserName);
        const rows = await page.locator('.dk-field-action').evaluateAll((actions) =>
            actions.map((action) => {
                const [control, button] = [...action.children].map((child) =>
                    child.getBoundingClientRect()
                );
                return {
                    width: Math.round(control?.width ?? 0),
                    under: (button?.top ?? 0) >= (control?.bottom ?? 0),
                };
            })
        );
        expect(rows, at).toHaveLength(2);
        expect.soft(rows[0], at).toEqual(rows[1]);
        expect.soft(rows[0]?.under, at).toBe(large);
    }
});
