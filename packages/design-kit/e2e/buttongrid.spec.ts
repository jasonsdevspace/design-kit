import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';

import { box, colorOf, contrast, sideways, style, writePage } from './page.js';

/*
 * A grid of buttons as a browser draws it: the columns asked for where they fit and fewer where a
 * cell would be under the target, every cell at the target both ways or the larger one in a tall
 * grid, a group named for what it holds with each toggle saying whether it is on and each plain key
 * named for what it enters, a toggle that is on filled in the text color and told apart by how
 * light it is and its weight, in forced colors too, its edge turning to the accent under a pointer
 * and text selected on it in sight, a cell that is off dashed, unpressable and at full contrast,
 * one that is off and on keeping an edge that is seen, a tall button tall in any grid, the button's
 * shadow and press read by each cell, the keyboard reaching and pressing each one, and no audit
 * findings in either theme.
 */

const CARDS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

/** A page with a hand of toggles, one on, one off and one both, and a pad of plain keys. */
const body = (columns: number, tall = false): string => `<main><h1>Round 3</h1>
<div class="dk-button-grid${tall ? ' dk-button-grid-tall' : ''}" role="group" aria-label="Cards in hand" style="--dk-button-grid-columns: ${String(columns)}">
${CARDS.map(
    (card) =>
        `<button type="button" class="dk-button" aria-pressed="${card === '7' || card === '11' ? 'true' : 'false'}"${card === '11' || card === '12' ? ' disabled' : ''}>${card}</button>`
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

test('draws the columns asked for where they fit, and fewer where a cell would be under the target', async ({
    page,
}) => {
    // Every width a share might round up at draws all six.
    for (let width = 600; width <= 1280; width += 7) {
        await open(page, { width });
        expect(await columnsOf(hand(page)), `${String(width)}px`).toBe(6);
    }
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
    await expect(hand(page).getByRole('button', { pressed: true })).toHaveText(['7', '11']);
    await expect(hand(page).getByRole('button', { pressed: false })).toHaveCount(CARDS.length - 2);
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
        // The highlight resolved as a ground, set on an element of the page's own.
        const highlight = await forced.evaluate(() => {
            const probe = document.createElement('span');
            probe.style.backgroundColor = 'Highlight';
            document.body.append(probe);
            const resolved = getComputedStyle(probe).backgroundColor;
            probe.remove();
            return resolved;
        });
        expect(await style(card(forced, '7'), 'background-color', 'border-top-color')).toEqual({
            'background-color': highlight,
            'border-top-color': highlight,
        });
        expect((await style(card(forced, '8'), 'background-color'))['background-color']).not.toBe(
            highlight
        );
        // A cell that is off takes the system's gray, and one that is off and on an edge in the
        // highlight.
        const gray = await colorOf(forced, 'GrayText');
        expect(
            await style(card(forced, '12'), 'color', 'border-top-color', 'border-top-style')
        ).toEqual({
            color: gray,
            'border-top-color': gray,
            'border-top-style': 'dashed',
        });
        expect((await style(card(forced, '11'), 'border-top-color'))['border-top-color']).toBe(
            await colorOf(forced, 'Highlight')
        );
    } finally {
        await context.close();
    }
});

test('fills a toggle that is on with the text color, apart from the accent, in both themes', async ({
    page,
}) => {
    for (const theme of ['light', 'dark'] as const) {
        await open(page, { theme });
        const ground = await style(page.locator('body'), 'color', 'background-color');
        const on = await style(card(page, '7'), 'background-color', 'color', 'border-top-color');
        expect(on['background-color'], theme).toBe(ground['color']);
        expect(on['border-top-color'], theme).toBe(ground['color']);
        expect(on['color'], theme).toBe(ground['background-color']);
        // None of the accent edge a pressed button draws inside its own.
        expect((await style(card(page, '7'), 'box-shadow'))['box-shadow'], theme).toBe('none');
        expect(contrast(on['color'] ?? '', on['background-color'] ?? ''), theme).toBeGreaterThan(7);
        expect(on['background-color'], theme).not.toBe(await colorOf(page, 'var(--dk-accent)'));
    }
});

test("turns a toggle that is on to the accent's edge under a pointer", async ({ page }) => {
    for (const theme of ['light', 'dark'] as const) {
        await open(page, { theme });
        const accent = await colorOf(page, 'var(--dk-accent)');
        await card(page, '7').hover();
        // The edge eases to its new color, so it is read once it has arrived.
        await expect
            .poll(
                async () => (await style(card(page, '7'), 'border-top-color'))['border-top-color'],
                { message: theme }
            )
            .toBe(accent);
        await page.mouse.move(0, 0);
    }
});

test('keeps text selected on a toggle that is on in sight', async ({ page }) => {
    for (const theme of ['light', 'dark'] as const) {
        await open(page, { theme });
        const fill = (await style(card(page, '7'), 'background-color'))['background-color'] ?? '';
        // On the cell's own words, and on words in an element inside it, as a label in a span.
        // The span renames the cell, so it is read after the fill.
        const read = await card(page, '7').evaluate((cell) => {
            const inner = document.createElement('span');
            inner.textContent = 'inside';
            cell.append(inner);
            return [cell, inner].map((element) => {
                const picked = getComputedStyle(element, '::selection');
                return { ground: picked.backgroundColor, words: picked.color };
            });
        });
        for (const { ground, words } of read) {
            expect(contrast(ground, fill), theme).toBeGreaterThanOrEqual(3);
            expect(contrast(words, ground), theme).toBeGreaterThanOrEqual(4.5);
        }
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
    // One that is off and on keeps the strong weight, told from one only off by more than its edge.
    expect(Number((await style(card(page, '11'), 'font-weight'))['font-weight'])).toBeGreaterThan(
        Number((await style(card(page, '12'), 'font-weight'))['font-weight'])
    );
    // One that is off and on keeps a thicker edge, seen against the page.
    const both = await style(card(page, '11'), 'box-shadow', 'background-color');
    expect(both['background-color']).toBe('rgba(0, 0, 0, 0)');
    const edge = /rgb\([^)]*\)/.exec(both['box-shadow'] ?? '')?.[0] ?? '';
    expect(both['box-shadow']).toContain('inset');
    expect(
        contrast(
            edge,
            (await style(page.locator('body'), 'background-color'))['background-color'] ?? ''
        )
    ).toBeGreaterThanOrEqual(3);

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
    for (let stop = 0; stop < CARDS.length - 1; stop += 1) {
        await page.keyboard.press('Tab');
        reached.push(await page.evaluate(() => document.activeElement?.textContent ?? ''));
    }
    expect(reached).toEqual([...CARDS.slice(0, -2), '1']);

    await card(page, '8').focus();
    await page.keyboard.press('Space');
    await expect(card(page, '8')).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Enter');
    await expect(card(page, '8')).toHaveAttribute('aria-pressed', 'false');
});

test('draws a tall button at the larger target in a grid that is not tall', async ({ page }) => {
    await writePage(page, {
        width: 1280,
        title: 'Keys',
        body:
            '<div class="dk-button-grid" role="group" aria-label="Keys">' +
            '<button type="button" class="dk-button">1</button>' +
            '<button type="button" class="dk-button dk-button-tall">Enter</button></div>',
    });
    const keys = page.getByRole('group', { name: 'Keys' }).getByRole('button');
    expect((await box(keys.nth(0), 'a key')).height).toBeGreaterThanOrEqual(44);
    expect((await box(keys.nth(1), 'a key')).height).toBeGreaterThanOrEqual(56);
});

for (const theme of ['light', 'dark'] as const) {
    test(`has no audit findings in the ${theme} theme`, async ({ page }) => {
        await open(page, { theme });
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });
}

test('draws a cell marked off by aria-disabled in the system gray in forced colors', async ({
    browser,
    browserName,
}) => {
    test.skip(browserName === 'webkit', 'WebKit has no forced colors to draw');
    const context = await browser.newContext({ forcedColors: 'active' });
    try {
        const page = await context.newPage();
        await open(page);
        await card(page, '9').evaluate((cell) => {
            cell.setAttribute('aria-disabled', 'true');
        });
        const gray = await colorOf(page, 'GrayText');
        // The edge eases to its new color, so it is read once it has arrived.
        await expect
            .poll(() => style(card(page, '9'), 'color', 'border-top-color'))
            .toEqual({ color: gray, 'border-top-color': gray });
    } finally {
        await context.close();
    }
});
