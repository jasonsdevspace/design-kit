import { readFileSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

import { StepperField } from '../src/react.js';
import { box, KIT, sideways, style } from './page.js';

/*
 * A stepper as a page attaches it: its buttons hidden with no script and named for what they do and
 * to which field once attached, each press stepping the value and firing the events a typed value
 * fires, the buttons off at the limits with focus kept on them, a typed value outside the limits
 * reported as a field's error once changed and cleared once right, the value in figures of one
 * width so the field keeps its width, the label beside it on one line at a phone's narrowest
 * width, the larger target when asked, the keyboard, and no audit findings in either theme.
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
    </main>
);

const ATTACH = `import { attachStepper } from './controls.js';
window.heard = [];
for (const stepper of document.querySelectorAll('.dk-stepper')) attachStepper(stepper);
document.addEventListener('input', (event) => window.heard.push('input ' + event.target.value));
document.addEventListener('change', (event) => window.heard.push('change ' + event.target.value));
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
    // The field says its value and its limits itself.
    await expect(bid(page)).toHaveAttribute('min', '0');
    await expect(bid(page)).toHaveAttribute('max', '10');
});

test('steps the value by the step, firing the events a typed value fires, and stops at the limits with focus kept', async ({
    page,
}) => {
    await open(page);
    await raise(page).click();
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
    for (let press = 0; press < 9; press += 1) await lower(page).click();
    await expect(bid(page)).toHaveValue('0');
    await expect(lower(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(lower(page)).toBeFocused();
    const players = page.getByRole('button', { name: 'Lower the number of players' });
    await expect(players).toHaveAttribute('aria-disabled', 'true');
});

test('reports a typed value outside the limits as a field reports an error, and clears it once right', async ({
    page,
}) => {
    await open(page);
    await bid(page).fill('14');
    await bid(page).press('Tab');
    const error = page.locator('#bid-range');
    await expect(error).toBeVisible();
    await expect(error).toHaveText('Error: Enter a whole number from 0 to 10.');
    await expect(bid(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(bid(page)).toHaveAccessibleDescription(
        'Error: Enter a whole number from 0 to 10.'
    );
    // The error sits above the field, as every field's does.
    expect((await box(error, 'the error')).y).toBeLessThan((await box(bid(page), 'the value')).y);
    await bid(page).fill('6');
    await expect(error).toBeHidden();
    await expect(bid(page)).not.toHaveAttribute('aria-invalid');
    await expect(bid(page)).not.toHaveAttribute('aria-describedby');
    // A hint the page gave stays in the description through an error and after it.
    const players = page.getByRole('spinbutton', { name: 'Players' });
    await players.fill('1');
    await players.press('Tab');
    await expect(players).toHaveAttribute('aria-describedby', 'players-hint players-range');
    await players.fill('3');
    await expect(players).toHaveAttribute('aria-describedby', 'players-hint');
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
}) => {
    await open(page);
    await page.keyboard.press('Tab');
    await expect(lower(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(bid(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(raise(page)).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
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
