import { readFileSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

import { StepperField } from '../src/react.js';
import { box, KIT, sideways, style } from './page.js';
import { cutOff, SPACED } from './spacing.js';
import { textSize } from './text-size.js';

/*
 * A stepper as a page attaches it: its buttons hidden with no script and named for what they do and
 * to which field once attached, each press stepping the value once however often the stepper was
 * attached, firing the events a typed value fires and saying the value on its status line, the
 * buttons off at the limits with focus kept and on a locked field, a value a form's reset sets
 * followed, a typed value outside the limits or none reported as a field's error once changed and
 * said, and cleared once right while a page's own error keeps its place, a phone's keyboard with a
 * minus only where it is needed, the value in figures of one width so the field keeps its width,
 * every figure shown under the wider spacing a reader may set, the label beside it on one line at a
 * phone's narrowest width, a stepper that fits a phone at twice the text size, the larger target
 * when asked, the keyboard, and no audit findings in either theme.
 */

const ORIGIN = 'https://kit.test';

const js = (file: string) =>
    ts.transpileModule(readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
    }).outputText;

const FIELDS = renderToStaticMarkup(
    <main>
        <h1>Round 3</h1>
        <StepperField id="bid" label="Ana's bid" min={0} max={10} defaultValue={9} inline />
        <StepperField
            id="players"
            label="Players"
            hint="From two to eight"
            subject="the number of players"
            min={2}
            max={8}
            defaultValue={2}
            tall
        />
        <form id="scores">
            <StepperField id="score" label="Score" min={-9} max={12} defaultValue={11} />
            <button type="reset">Reset</button>
        </form>
        <StepperField id="locked" label="Locked" min={0} max={10} defaultValue={5} disabled />
    </main>
);

const ATTACH = `import { attachStepper } from './controls.js';
window.heard = [];
// Each stepper attached through its field and again through itself, which attaches it once.
for (const stepper of document.querySelectorAll('.dk-stepper')) {
    attachStepper(stepper.closest('.dk-field'));
    attachStepper(stepper);
}
document.addEventListener('input', (event) => window.heard.push('input ' + event.target.value));
document.addEventListener('change', (event) => window.heard.push('change ' + event.target.value));
// What takes a stepper away, which attaching it again returns.
window.detach = (id) => attachStepper(document.querySelector('#' + id).closest('.dk-stepper'))();
window.ready = true;`;

const open = async (
    page: Page,
    {
        width = 390,
        theme = 'light',
        attach = true,
    }: {
        readonly width?: number;
        readonly theme?: 'light' | 'dark';
        readonly attach?: boolean;
    } = {}
): Promise<void> => {
    const files: Readonly<Record<string, readonly [string, string]>> = {
        '/kit.css': [KIT, 'text/css'],
        '/controls.js': [js('controls.ts'), 'text/javascript'],
        '/theme.js': [js('theme.ts'), 'text/javascript'],
        '/page.js': [ATTACH, 'text/javascript'],
    };
    await page.route(`${ORIGIN}/**`, (route) => {
        const path = new URL(route.request().url()).pathname;
        const [body, contentType] = files[path] ?? [
            `<!doctype html><html lang="en" data-theme="${theme}"><head><title>Round 3</title>` +
                `<link rel="stylesheet" href="/kit.css"></head><body>${FIELDS}` +
                (attach ? '<script type="module" src="/page.js"></script>' : '') +
                '</body></html>',
            'text/html',
        ];
        return route.fulfill({ body, contentType });
    });
    await page.setViewportSize({ width, height: 700 });
    await page.goto(`${ORIGIN}/`);
    if (attach) await page.waitForFunction(() => 'ready' in window);
};

const bid = (page: Page): Locator => page.getByRole('spinbutton', { name: "Ana's bid" });
const lower = (page: Page): Locator => page.getByRole('button', { name: "Lower Ana's bid" });
const raise = (page: Page): Locator => page.getByRole('button', { name: "Raise Ana's bid" });

/**
 * Presses a button as a visitor does: by pointer, or in WebKit, where Safari gives a pressed button
 * no focus, by Enter on it, so a test of where focus stays tests the stepper and not the browser.
 */
const press = async (button: Locator, browserName: string): Promise<void> => {
    if (browserName === 'webkit') {
        await button.focus();
        await button.press('Enter');
    } else {
        await button.click();
    }
};

/** Safari on a Mac keeps the plain Tab key for fields, and reaches a button with Option held. */
const tabKey = (browserName: string): string =>
    browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
const line = (page: Page, id: string): Locator =>
    page.locator(`.dk-field:has(#${id}) .dk-stepper-status`);
const heard = (page: Page): Promise<string[]> =>
    page.evaluate(() => (window as unknown as { heard: string[] }).heard);

test('shows the buttons only once attached, each named for what it does and to which field', async ({
    page,
}) => {
    await open(page, { attach: false });
    await expect(bid(page)).toBeVisible();
    await expect(page.locator('.dk-stepper-down').first()).toBeHidden();
    await open(page);
    await expect(lower(page)).toBeVisible();
    await expect(raise(page)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Raise the number of players' })).toBeVisible();
});

test('steps once a press, firing the events a typed value fires, and stops at the limits with focus kept', async ({
    page,
    browserName,
}) => {
    await open(page);
    await press(raise(page), browserName);
    await expect(bid(page)).toHaveValue('10');
    expect(await heard(page)).toEqual(['input 10', 'change 10']);
    // At the greatest value the raise button is off, keeps focus, and a press does nothing.
    await expect(raise(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(raise(page)).toBeFocused();
    // Pressed again from the keyboard, since a pointer's tools take an off button as not there.
    await page.keyboard.press('Enter');
    await expect(bid(page)).toHaveValue('10');
    expect(await heard(page)).toHaveLength(2);
    await expect(lower(page)).not.toHaveAttribute('aria-disabled');
    // At the least value it is the lower button that is off.
    await open(page);
    for (let step = 0; step < 9; step += 1) await press(lower(page), browserName);
    await expect(bid(page)).toHaveValue('0');
    await expect(lower(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(lower(page)).toBeFocused();
    const players = page.getByRole('button', { name: 'Lower the number of players' });
    await expect(players).toHaveAttribute('aria-disabled', 'true');
});

test('says the value a press sets on its status line, since focus stays on the button', async ({
    page,
    browserName,
}) => {
    await open(page);
    await expect(line(page, 'bid')).toHaveText('');
    await press(lower(page), browserName);
    await expect(line(page, 'bid')).toHaveText('8');
    await expect(lower(page)).toBeFocused();
});

test('leaves a disabled field as it is, with both buttons off', async ({ page }) => {
    await open(page);
    const up = page.getByRole('button', { name: 'Raise Locked' });
    await expect(up).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('button', { name: 'Lower Locked' })).toHaveAttribute(
        'aria-disabled',
        'true'
    );
    await up.dispatchEvent('click');
    await expect(page.getByRole('spinbutton', { name: 'Locked' })).toHaveValue('5');
});

test('follows a value a form reset sets, and fires nothing for a press that changes nothing', async ({
    page,
}) => {
    await open(page);
    const score = page.getByRole('spinbutton', { name: 'Score' });
    const up = page.getByRole('button', { name: 'Raise Score' });
    await up.click();
    await expect(score).toHaveValue('12');
    await expect(up).toHaveAttribute('aria-disabled', 'true');
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(score).toHaveValue('11');
    await expect(up).not.toHaveAttribute('aria-disabled');
    // A value a script set past the limit is read again as the press lands, so nothing moves.
    await score.evaluate((input: HTMLInputElement) => {
        input.value = '12';
    });
    const before = (await heard(page)).length;
    await up.dispatchEvent('click');
    await expect(score).toHaveValue('12');
    expect(await heard(page)).toHaveLength(before);
});

test('reports a typed value outside the limits, or none, as a field reports an error, says it, and clears it once right', async ({
    page,
}) => {
    await open(page);
    await bid(page).fill('14');
    await bid(page).press('Tab');
    const error = page.locator('#bid-range');
    const said = 'Error: Enter a number from 0 to 10.';
    await expect(error).toBeVisible();
    await expect(error).toHaveText(said);
    await expect(bid(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(bid(page)).toHaveAccessibleDescription(said);
    // Focus has moved on, so the status line says the error too.
    await expect(line(page, 'bid')).toHaveText(said);
    // The error sits above the field, as every field's does.
    expect((await box(error, 'the error')).y).toBeLessThan((await box(bid(page), 'the value')).y);
    await bid(page).fill('6');
    await expect(error).toBeHidden();
    await expect(bid(page)).not.toHaveAttribute('aria-invalid');
    await expect(bid(page)).not.toHaveAttribute('aria-describedby');
    // An emptied field is told the same.
    await bid(page).fill('');
    await bid(page).press('Tab');
    await expect(error).toBeVisible();
});

test("keeps a page's own hint and error in place through its own error", async ({ page }) => {
    await open(page);
    const players = page.getByRole('spinbutton', { name: 'Players' });
    await players.fill('1');
    await players.press('Tab');
    await expect(players).toHaveAttribute('aria-describedby', 'players-hint players-range');
    await players.fill('3');
    await expect(players).toHaveAttribute('aria-describedby', 'players-hint');
    // An error the page draws after attaching keeps its place and its invalid state.
    await page.evaluate(() => {
        const input = document.querySelector('#players');
        const error = document.createElement('p');
        error.className = 'dk-field-error';
        error.id = 'players-error';
        error.textContent = 'Ana is already playing.';
        input?.closest('.dk-field')?.insertBefore(error, input.closest('.dk-stepper'));
        input?.setAttribute('aria-describedby', 'players-hint players-error');
        input?.setAttribute('aria-invalid', 'true');
    });
    await players.fill('9');
    await players.press('Tab');
    await expect(players).toHaveAttribute(
        'aria-describedby',
        'players-hint players-error players-range'
    );
    await players.fill('4');
    await expect(players).toHaveAttribute('aria-describedby', 'players-hint players-error');
    await expect(players).toHaveAttribute('aria-invalid', 'true');
});

test('asks a phone for a keyboard with a minus only where the least value is below nothing', async ({
    page,
}) => {
    await open(page);
    await expect(bid(page)).toHaveAttribute('inputmode', 'numeric');
    await expect(page.getByRole('spinbutton', { name: 'Score' })).not.toHaveAttribute('inputmode');
});

test('keeps its width as the value changes, with figures of one width', async ({ page }) => {
    await open(page);
    expect(await style(bid(page), 'font-variant-numeric', 'text-align')).toEqual({
        'font-variant-numeric': 'tabular-nums',
        'text-align': 'center',
    });
    const nine = await box(page.locator('.dk-stepper').first(), 'the stepper');
    await raise(page).click();
    const ten = await box(page.locator('.dk-stepper').first(), 'the stepper');
    expect(ten.width).toBe(nine.width);
    // Two figures fit inside the value without being cut.
    expect(await bid(page).evaluate((input) => input.scrollWidth - input.clientWidth)).toBe(0);
});

test("sits on one line with its label beside it at a phone's narrowest width", async ({ page }) => {
    await open(page, { width: 320 });
    const label = await box(page.getByText("Ana's bid", { exact: true }), 'the label');
    const middle = (drawn: { y: number; height: number }) => drawn.y + drawn.height / 2;
    for (const part of [lower(page), bid(page), raise(page)]) {
        const drawn = await box(part, 'a part');
        expect(Math.abs(middle(drawn) - middle(label))).toBeLessThanOrEqual(2);
        expect(drawn.x).toBeGreaterThan(label.x);
    }
    expect(await sideways(page)).toBe(0);
});

test('shows every figure of its value under the wider spacing a reader may set', async ({
    page,
}) => {
    await open(page);
    await page.addStyleTag({ content: `${SPACED} #players { --dk-stepper-digits: 3 }` });
    await bid(page).fill('10');
    await page.locator('#players').fill('100');
    await page.locator('#score').fill('-9');
    expect(await cutOff(page, '.dk-stepper-value')).toEqual([]);
});

test('fits a phone at twice the text size, its buttons and its value whole', async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    for (const width of [320, 390]) {
        await open(page, { width });
        await textSize(page, 2);
        expect(await sideways(page), String(width)).toBe(0);
        expect(await cutOff(page, '.dk-stepper-value'), String(width)).toEqual([]);
        for (const stepper of await page.locator('.dk-stepper').all()) {
            const field = await box(stepper.locator('xpath=..'), 'the field');
            const last = await box(stepper.locator('.dk-stepper-up'), 'the raise button');
            expect(last.x + last.width, String(width)).toBeLessThanOrEqual(
                field.x + field.width + 1
            );
            const tall = (await stepper.getAttribute('class'))?.includes('dk-stepper-tall');
            for (const button of await stepper.locator('.dk-button').all()) {
                const pressed = await box(button, 'a button');
                expect(pressed.width, String(width)).toBeGreaterThanOrEqual(44);
                // The target and the larger target, in rems, at twice the text size.
                expect(pressed.height, String(width)).toBeGreaterThanOrEqual(
                    (tall ? 3.5 : 2.75) * 32 - 1
                );
            }
        }
    }
});

test("narrows its buttons to fit a narrow place, never under the usual text size's target", async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    await open(page, { width: 390 });
    await textSize(page, 2);
    /*
     * A copy of the tall stepper and of the inline one, each in an app's dock and in a column of
     * its own, the first narrower than the buttons' full targets and the second narrower than the
     * buttons can go.
     */
    const measured = await page.evaluate(() =>
        [320, 240].flatMap((room) =>
            ['players', 'bid'].map((id) => {
                const dock = document.createElement('div');
                dock.className = 'dk-app-dock';
                const column = document.createElement('div');
                column.style.width = `${String(room)}px`;
                column.append(dock);
                const field = document.querySelector(`.dk-field:has(#${id})`);
                const copy = field?.cloneNode(true);
                if (!(copy instanceof HTMLElement)) throw new Error(`no field for ${id}`);
                dock.append(copy);
                document.body.append(column);
                const up = copy.querySelector('.dk-stepper-up')?.getBoundingClientRect();
                const inside = dock.getBoundingClientRect();
                const widths = [...copy.querySelectorAll('.dk-stepper > .dk-button')].map(
                    (button) => button.getBoundingClientRect().width
                );
                column.remove();
                return {
                    room,
                    id,
                    fits: (up?.right ?? Infinity) <= inside.right + 1,
                    widths,
                };
            })
        )
    );
    for (const { room, id, fits, widths } of measured) {
        const where = `${id} in ${String(room)}px`;
        for (const width of widths) {
            expect(width, where).toBeGreaterThanOrEqual(44 - 0.5);
            expect(width, where).toBeLessThan(3.5 * 32);
        }
        if (room === 320) expect(fits, where).toBe(true);
    }
    // In the narrower room the tall stepper's buttons rest at the floor rather than under it.
    const floor = measured.find(({ room, id }) => room === 240 && id === 'players');
    for (const width of floor?.widths ?? []) expect(width).toBeLessThanOrEqual(44 + 0.5);
});

test('fits a dialog and a sheet on a phone 320px wide at twice the text size', async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    await open(page, { width: 320 });
    await textSize(page, 2);
    for (const form of ['dk-dialog', 'dk-dialog dk-dialog-sheet']) {
        for (const id of ['players', 'bid']) {
            const measured = await page.evaluate(
                ([kind, field]) => {
                    const dialog = document.createElement('dialog');
                    dialog.className = kind;
                    const copy = document
                        .querySelector(`.dk-field:has(#${field})`)
                        ?.cloneNode(true);
                    if (!(copy instanceof HTMLElement)) throw new Error(`no field for ${field}`);
                    dialog.append(copy);
                    document.body.append(dialog);
                    dialog.showModal();
                    const up = copy.querySelector('.dk-stepper-up')?.getBoundingClientRect();
                    const value = copy.querySelector<HTMLInputElement>('.dk-stepper-value');
                    // The dialog's content edge, inside its padding, which a stepper must not cross.
                    const edge =
                        dialog.getBoundingClientRect().right -
                        parseFloat(getComputedStyle(dialog).paddingRight) -
                        parseFloat(getComputedStyle(dialog).borderRightWidth);
                    const result = {
                        fits: (up?.right ?? Infinity) <= edge + 0.5,
                        sideways: dialog.scrollWidth - dialog.clientWidth,
                        clipped: value ? value.scrollWidth > value.clientWidth : true,
                    };
                    dialog.close();
                    dialog.remove();
                    return result;
                },
                [form, id] as const
            );
            expect(measured, `${id} in ${form}`).toEqual({
                fits: true,
                sideways: 0,
                clipped: false,
            });
        }
    }
});

test('empties its status line once the value is typed over, and once it is taken away', async ({
    page,
}) => {
    await open(page);
    await raise(page).click();
    await expect(line(page, 'bid')).not.toHaveText('');
    // Typed over, the value a press said is no longer the value, so the line says nothing.
    await bid(page).fill('4');
    await expect(line(page, 'bid')).toHaveText('');
    await raise(page).click();
    await expect(line(page, 'bid')).toHaveText('5');
    await page.evaluate(() => {
        (window as unknown as { detach: (id: string) => void }).detach('bid');
    });
    await expect(line(page, 'bid')).toHaveText('');
});

test('empties its status line when its form is reset', async ({ page }) => {
    await open(page);
    const score = page.getByRole('spinbutton', { name: 'Score' });
    await page.getByRole('button', { name: 'Lower Score' }).click();
    await expect(line(page, 'score')).toHaveText('10');
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(score).toHaveValue('11');
    await expect(line(page, 'score')).toHaveText('');
});

test('stands its value level with its buttons, tall or not, and takes a tap at once', async ({
    page,
}) => {
    await open(page);
    for (const field of ['bid', 'players']) {
        const stepper = page.locator(`.dk-field:has(#${field}) .dk-stepper`);
        const value = await box(stepper.locator('.dk-stepper-value'), 'the value');
        const button = await box(stepper.locator('.dk-stepper-up'), 'a button');
        expect(value.height, field).toBeCloseTo(button.height, 0);
        expect(
            (await style(stepper.locator('.dk-stepper-up'), 'touch-action'))['touch-action'],
            field
        ).toBe('manipulation');
    }
});

test('draws its buttons at the target, and at the larger target when tall', async ({ page }) => {
    await open(page, { width: 1280 });
    for (const [name, least] of [
        ["Raise Ana's bid", 44],
        ['Raise the number of players', 56],
    ] as const) {
        const drawn = await box(page.getByRole('button', { name }), name);
        expect(drawn.width, name).toBeGreaterThanOrEqual(least);
        expect(drawn.height, name).toBeGreaterThanOrEqual(least);
    }
});

test('takes the keyboard through lower, the value and raise, pressing by Space and Enter', async ({
    page,
    browserName,
}) => {
    await open(page);
    await page.keyboard.press(tabKey(browserName));
    await expect(lower(page)).toBeFocused();
    await page.keyboard.press(tabKey(browserName));
    await expect(bid(page)).toBeFocused();
    await page.keyboard.press(tabKey(browserName));
    await expect(raise(page)).toBeFocused();
    await page.keyboard.press(`Shift+${tabKey(browserName)}`);
    await page.keyboard.press(`Shift+${tabKey(browserName)}`);
    await page.keyboard.press('Space');
    await expect(bid(page)).toHaveValue('8');
    await page.keyboard.press('Enter');
    await expect(bid(page)).toHaveValue('7');
});

for (const theme of ['light', 'dark'] as const) {
    test(`has no audit findings in the ${theme} theme`, async ({ page }) => {
        await open(page, { theme });
        await raise(page).click();
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });
}
