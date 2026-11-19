import { expect, type Page, test } from '@playwright/test';

import { bundle } from './bundle.js';
import { servePage } from './page.js';

/*
 * A group of cells moved among by the arrow keys with one stop for the Tab key, by `attachRoving`
 * and React's `useRoving`: a grid of buttons, with the toolbar's role, moved up and down to the
 * nearest cell as drawn and left and right in reading order, a right to left page's arrows turned
 * round, Home and End, an arrow held with a modifier left to the browser, a row of tabs with its
 * stop on the chosen tab and up and down ignored, the page choosing as focus moves, a cell marked
 * off reached, a cell taken out with focus handing it to the cell in its place, and the group let
 * go.
 */

const GRID =
    '<div class="dk-button-grid" id="grid" style="display:grid;grid-template-columns:repeat(3,4rem)">' +
    [1, 2, 3, 4, 5, 6, 7]
        .map((n) => `<button type="button" id="n${String(n)}">${String(n)}</button>`)
        .join('') +
    '</div>';

const TABS =
    '<div class="dk-tabs" role="tablist" aria-label="Enter" id="tabs">' +
    '<button type="button" class="dk-tab" role="tab" id="t1" aria-selected="false">Number</button>' +
    '<button type="button" class="dk-tab" role="tab" id="t2" aria-selected="true">Cards</button>' +
    '<button type="button" class="dk-tab" role="tab" id="t3" aria-selected="false" aria-disabled="true">Sum</button>' +
    '</div>';

const SCRIPT = `import { attachRoving } from './controls.js';
window.detachGrid = attachRoving(document.querySelector('#grid'));
window.moved = [];
attachRoving(document.querySelector('#tabs'), {
    onMove: (cell) => {
        window.moved.push(cell.id);
        // The page chooses as focus reaches a tab.
        for (const tab of document.querySelectorAll('#tabs [role="tab"]'))
            tab.setAttribute('aria-selected', String(tab === cell));
    },
});
window.ready = true;`;

const open = async (page: Page, dir: 'ltr' | 'rtl' = 'ltr') => {
    await servePage(page, {
        title: 'Roving',
        body: `<main>${GRID}${TABS}</main>`,
        script: SCRIPT,
        dir,
    });
    await page.waitForFunction(() => 'ready' in window);
};

const stops = (page: Page, group: string) => page.locator(`#${group} > [tabindex="0"]`);

test('gives a grid of buttons one stop and the toolbar role, and moves by the arrows as drawn', async ({
    page,
}) => {
    await open(page);
    await expect(page.locator('#grid')).toHaveAttribute('role', 'toolbar');
    await expect(stops(page, 'grid')).toHaveCount(1);
    await expect(stops(page, 'grid')).toHaveId('n1');
    await page.locator('#n1').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#n2')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#n5')).toBeFocused();
    // Down from the middle of the second row reaches the one cell of the last row, the nearest.
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#n7')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(page.locator('#n1')).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.locator('#n7')).toBeFocused();
    await expect(stops(page, 'grid')).toHaveId('n7');
    // Held with a modifier, an arrow is the browser's, left to it and not moved by. A key event is
    // sent rather than pressed, since a browser acts on its own shortcut and can leave the page.
    const kept = await page.locator('#n7').evaluate((cell) => {
        const event = new KeyboardEvent('keydown', {
            key: 'ArrowLeft',
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
        });
        return cell.dispatchEvent(event);
    });
    expect(kept).toBe(true);
    await expect(page.locator('#n7')).toBeFocused();
});

test('turns left and right round on a page read from right to left', async ({ page }) => {
    await open(page, 'rtl');
    await page.locator('#n1').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#n2')).toBeFocused();
});

test("puts a row of tabs' stop on the chosen tab, ignores up and down, and lets the page choose", async ({
    page,
}) => {
    await open(page);
    await expect(stops(page, 'tabs')).toHaveId('t2');
    await page.locator('#t2').focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#t2')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#t1')).toBeFocused();
    await expect(page.locator('#t1')).toHaveAttribute('aria-selected', 'true');
    await expect(stops(page, 'tabs')).toHaveId('t1');
    // A tab marked off keeps its place and is reached.
    await page.keyboard.press('End');
    await expect(page.locator('#t3')).toBeFocused();
    expect(await page.evaluate(() => (window as unknown as { moved: string[] }).moved)).toEqual([
        't1',
        't3',
    ]);
});

test('hands focus to the cell in the place of one taken out, and lets the group go', async ({
    page,
}) => {
    await open(page);
    await page.locator('#n3').focus();
    await page.evaluate(() => document.querySelector('#n3')?.remove());
    await expect(page.locator('#n4')).toBeFocused();
    await expect(stops(page, 'grid')).toHaveId('n4');
    await page.evaluate(() => {
        (window as unknown as { detachGrid: () => void }).detachGrid();
    });
    await expect(page.locator('#grid')).not.toHaveAttribute('role');
    await expect(page.locator('#grid > [tabindex]')).toHaveCount(0);
});

test.describe('in React', () => {
    let app = '';
    test.beforeAll(async () => {
        test.setTimeout(120_000);
        app = await bundle('roving-page.tsx');
    });

    test('keeps one stop on the chosen tab through the renders a choice brings', async ({
        page,
    }) => {
        await servePage(page, { title: 'Roving', body: '<div id="root"></div>', script: app });
        await expect(page.locator('#modes > [tabindex="0"]')).toHaveId('mode-cards');
        await page.locator('#mode-cards').focus();
        await page.keyboard.press('ArrowLeft');
        await expect(page.locator('#mode-number')).toBeFocused();
        await expect(page.locator('#mode-number')).toHaveAttribute('aria-selected', 'true');
        await expect(page.locator('#modes > [tabindex="0"]')).toHaveCount(1);
        await expect(page.locator('#modes > [tabindex="0"]')).toHaveId('mode-number');
        await expect(page.locator('#panel')).toHaveText('number');
    });
});
