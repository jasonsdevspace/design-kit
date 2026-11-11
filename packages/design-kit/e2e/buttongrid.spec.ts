import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';

import { box, sideways, style, writePage } from './page.js';

/*
 * A grid of buttons as a browser draws it: the columns asked for where they fit and fewer where a
 * cell would be under the target, every cell at the target both ways or the larger one in a tall
 * grid, a group named for what it holds with each toggle saying whether it is on and each plain key
 * named for what it enters, a toggle that is on told apart by how light it is and its weight, in
 * forced colors too, a cell that is off dashed, unpressable and at full contrast, the button's
 * shadow and press read by each cell, the keyboard reaching and pressing each one, and no audit
 * findings in either theme.
 */

const CARDS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

/** A page with a hand of toggles, one on and one off, and a pad of plain keys. */
const body = (columns: number, tall = false): string => `<main><h1>Round 3</h1>
<div class="dk-button-grid${tall ? ' dk-button-grid-tall' : ''}" role="group" aria-label="Cards in hand" style="--dk-button-grid-columns: ${String(columns)}">
${CARDS.map(
    (card) =>
        `<button type="button" class="dk-button" aria-pressed="${card === '7' ? 'true' : 'false'}"${card === '12' ? ' disabled' : ''}>${card}</button>`
).join('')}
</div>
<div class="dk-button-grid dk-button-grid-tall" role="group" aria-label="Score">
<button type="button" class="dk-button">1</button><button type="button" class="dk-button">2</button>
<button type="button" class="dk-button"><span aria-hidden="true">⌫</span><span class="dk-visually-hidden">Delete</span></button>
</div></main>`;

const open = async (
    page: Page,
    {
        width = 390,
        columns = 6,
        tall = false,
        theme = 'light',
        css = '',
    }: {
        readonly width?: number;
        readonly columns?: number;
        readonly tall?: boolean;
        readonly theme?: 'light' | 'dark';
        readonly css?: string;
    } = {}
): Promise<void> => {
    await writePage(page, { width, theme, css, title: 'Round 3', body: body(columns, tall) });
};

const hand = (page: Page): Locator => page.getByRole('group', { name: 'Cards in hand' });
const card = (page: Page, name: string): Locator =>
    hand(page).getByRole('button', { name, exact: true });

/** How many columns a grid draws, from where its first row's cells start. */
const columnsOf = async (grid: Locator): Promise<number> => {
    const starts = await grid
        .getByRole('button')
        .evaluateAll((cells) => cells.map((cell) => Math.round(cell.getBoundingClientRect().y)));
    return starts.filter((y) => y === starts[0]).length;
};

/** The contrast between two colors the browser resolved to rgb. */
const contrast = (first: string, second: string): number => {
    const luminance = (color: string) => {
        const [r = 0, g = 0, b = 0] = (color.match(/[\d.]+/g) ?? []).map(Number).map((part) => {
            const channel = part / 255;
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
    return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
};

test('draws the columns asked for where they fit, and fewer where a cell would be under the target', async ({
    page,
}) => {
    await open(page, { width: 1280 });
    expect(await columnsOf(hand(page))).toBe(6);
    for (const [tall, least] of [
        [false, 44],
        [true, 56],
    ] as const) {
        // Inside the gutter an app's frame pads its body by, as a phone's screen draws it.
        await open(page, { width: 320, tall, css: 'main { padding-inline: var(--dk-space-4); }' });
        const columns = await columnsOf(hand(page));
        expect(columns, `tall: ${String(tall)}`).toBeLessThanOrEqual(5);
        expect(columns, `tall: ${String(tall)}`).toBeGreaterThan(1);
        for (const cell of await hand(page).getByRole('button').all()) {
            const drawn = await box(cell, 'a cell');
            expect(drawn.width, `tall: ${String(tall)}`).toBeGreaterThanOrEqual(least);
            expect(drawn.height, `tall: ${String(tall)}`).toBeGreaterThanOrEqual(least);
        }
        expect(await sideways(page)).toBe(0);
    }
    // Three columns unless the page asks for more.
    await writePage(page, {
        width: 1280,
        title: 'Keys',
        body:
            '<div class="dk-button-grid" role="group" aria-label="Keys">' +
            '<button type="button" class="dk-button">1</button>'.repeat(6) +
            '</div>',
    });
    expect(await columnsOf(page.getByRole('group', { name: 'Keys' }))).toBe(3);
});

test('names the group, says whether each toggle is on, and names each plain key for what it enters', async ({
    page,
}) => {
    await open(page);
    await expect(hand(page)).toBeVisible();
    await expect(hand(page).getByRole('button', { pressed: true })).toHaveText('7');
    await expect(hand(page).getByRole('button', { pressed: false })).toHaveCount(CARDS.length - 1);
    const keys = page.getByRole('group', { name: 'Score' }).getByRole('button');
    for (const key of await keys.all()) {
        await expect(key).not.toHaveAttribute('aria-pressed');
    }
    await expect(keys.nth(2)).toHaveAccessibleName('Delete');
});

test('tells a toggle that is on by how light it is and its weight, in forced colors too', async ({
    page,
    browser,
}) => {
    for (const theme of ['light', 'dark'] as const) {
        await open(page, { theme });
        const read = ['background-color', 'font-weight'];
        const on = await style(card(page, '7'), ...read);
        const off = await style(card(page, '8'), ...read);
        const ground = (await style(page.locator('body'), 'background-color'))['background-color'];
        // The page's ground shows through a cell that is not on.
        expect(off['background-color']).toBe('rgba(0, 0, 0, 0)');
        expect(contrast(on['background-color'] ?? '', ground ?? ''), theme).toBeGreaterThanOrEqual(
            3
        );
        expect(Number(on['font-weight']), theme).toBeGreaterThan(Number(off['font-weight']));
    }
    const context = await browser.newContext({ forcedColors: 'active' });
    try {
        const forced = await context.newPage();
        await open(forced);
        const on = await style(card(forced, '7'), 'background-color');
        const off = await style(card(forced, '8'), 'background-color');
        expect(on['background-color']).not.toBe(off['background-color']);
    } finally {
        await context.close();
    }
});

test('draws a cell that is off with a dashed edge, at full contrast, and lets nothing press it', async ({
    page,
}) => {
    for (const theme of ['light', 'dark'] as const) {
        await open(page, { theme });
        const cell = card(page, '12');
        await expect(cell).toBeDisabled();
        const drawn = await style(cell, 'border-top-style', 'color');
        const ground = (await style(page.locator('body'), 'background-color'))['background-color'];
        expect(drawn['border-top-style'], theme).toBe('dashed');
        expect((await style(card(page, '8'), 'border-top-style'))['border-top-style'], theme).toBe(
            'solid'
        );
        expect(contrast(drawn['color'] ?? '', ground ?? ''), theme).toBeGreaterThanOrEqual(4.5);
    }
    // One marked aria-disabled, as the kit's component marks it, is drawn alike.
    await page.evaluate(() => {
        const cell = document.querySelector<HTMLButtonElement>('[aria-pressed]');
        cell?.setAttribute('aria-disabled', 'true');
    });
    expect((await style(card(page, '0'), 'border-top-style'))['border-top-style']).toBe('dashed');
});

test("reads the button's shadow and press, and draws neither without them", async ({ page }) => {
    await open(page);
    const plain = await style(card(page, '8'), 'box-shadow', 'translate');
    expect(plain).toEqual({ 'box-shadow': 'none', translate: 'none' });

    await open(page, {
        css: ':root { --dk-button-shadow: 0 2px 0 rgb(0 0 0); --dk-button-press: 0 2px; }',
    });
    const resting = await style(card(page, '8'), 'box-shadow', 'translate');
    expect(resting['box-shadow']).toContain('0px 2px 0px');
    expect(resting.translate).toBe('none');
    // A toggle that is on rests where a held one lands.
    expect((await style(card(page, '7'), 'translate')).translate).toBe('0px 2px');
    // Held down, a cell moves by the press.
    const before = await box(card(page, '8'), 'the cell');
    await card(page, '8').hover();
    await page.mouse.down();
    expect((await box(card(page, '8'), 'the cell')).y).toBe(before.y + 2);
    await page.mouse.up();
});

test('reaches each cell by Tab, past one that is off, and presses it by Space and by Enter', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        for (const cell of document.querySelectorAll<HTMLButtonElement>('[aria-pressed]')) {
            cell.addEventListener('click', () => {
                cell.setAttribute(
                    'aria-pressed',
                    String(cell.getAttribute('aria-pressed') !== 'true')
                );
            });
        }
    });
    const reached: string[] = [];
    for (let stop = 0; stop < CARDS.length; stop += 1) {
        await page.keyboard.press('Tab');
        reached.push(await page.evaluate(() => document.activeElement?.textContent ?? ''));
    }
    expect(reached).toEqual([...CARDS.slice(0, -1), '1']);

    await card(page, '8').focus();
    await page.keyboard.press('Space');
    await expect(card(page, '8')).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Enter');
    await expect(card(page, '8')).toHaveAttribute('aria-pressed', 'false');
});

for (const theme of ['light', 'dark'] as const) {
    test(`has no audit findings in the ${theme} theme`, async ({ page }) => {
        await open(page, { theme });
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });
}
