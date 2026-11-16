import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { colorOf, forceColors, ringByKeyboard, tabKey, writePage } from './page.js';
import { textSize } from './text-size.js';

/*
 * A quiet Close in the top corner of a dialog and of a panel, in a dk-close after the title: the
 * title wraps beside it rather than run under it, the Close is the target and its ring stays inside
 * what holds it, the keyboard meets the title's question first and the Close after, and a dialog's
 * Close closes it with no script.
 */

const CLOSE = `<button type="submit" class="dk-button dk-button-text dk-button-quiet" value="close"><span aria-hidden="true">×</span><span class="dk-visually-hidden">Close</span></button>`;

const BODY = `<main class="dk-page"><h1>Round 3</h1>
<div class="dk-panel" id="tips"><h2 class="dk-panel-title">Round tips for a table that has never played before</h2><div class="dk-close"><button type="button" class="dk-button dk-button-text dk-button-quiet"><span aria-hidden="true">×</span><span class="dk-visually-hidden">Close round tips</span></button></div><p>Ana deals first, and the cards go round to the left.</p></div>
</main>
<dialog class="dk-dialog" id="end-game" aria-labelledby="end-game-title">
<h2 class="dk-dialog-title" id="end-game-title">End the game now, with two rounds still to play?</h2>
<form class="dk-close" method="dialog">${CLOSE}</form>
<p>The scores so far are kept in the history.</p>
<form method="dialog" class="dk-dialog-actions">
<button type="submit" class="dk-button" value="keep" autofocus>Keep playing</button>
<button type="submit" class="dk-button dk-button-accent" value="end">End the game</button>
</form></dialog>`;

/** Opens the dialog as a modal, as the kit's attach function does. */
const openDialog = (page: Page) =>
    page.locator('#end-game').evaluate((dialog: HTMLDialogElement) => dialog.showModal());

/** Where the title, the Close and what holds them sit, and how many lines the title takes. */
const corner = (page: Page, holder: string) =>
    page.locator(holder).evaluate((element) => {
        const title = element.querySelector(':scope > :has(+ .dk-close)');
        const close = element.querySelector(':scope > .dk-close button');
        if (!title || !close) throw new Error('no title or no Close');
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        const inner = {
            top: box.top + parseFloat(style.borderTopWidth),
            right: box.right - parseFloat(style.borderRightWidth),
            left: box.left + parseFloat(style.borderLeftWidth),
        };
        const words = title.getBoundingClientRect();
        const button = close.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(title);
        const lines = new Set([...range.getClientRects()].map(({ top }) => Math.round(top))).size;
        return {
            inner,
            paddingRight: parseFloat(style.paddingRight),
            title: { top: words.top, right: words.right, bottom: words.bottom },
            close: {
                top: button.top,
                right: button.right,
                left: button.left,
                width: button.width,
                height: button.height,
            },
            lines,
        };
    });

for (const [width, scale] of [
    [320, 1],
    [320, 2],
    [1280, 1],
    [1280, 2],
] as const)
    test(`sets a quiet Close in the top corner of a dialog and a panel, at the target and clear of the title, ${String(width)} wide at ${String(scale)} times the text`, async ({
        page,
        browserName,
    }) => {
        test.skip(
            browserName !== 'chromium' && scale !== 1,
            'the text size is set through Chromium'
        );
        if (scale !== 1) await textSize(page, scale);
        await writePage(page, { width, title: 'Round 3', body: BODY });
        await openDialog(page);
        const least = width <= 768 || scale > 1 ? 44 : 24;
        for (const holder of ['#end-game', '#tips']) {
            const at = `${holder}, ${String(width)} at ${String(scale)}`;
            const drawn = await corner(page, holder);
            // The Close is the target, at the end of the first row, and the title stops short of it.
            expect(drawn.close.width, at).toBeGreaterThanOrEqual(least);
            expect(drawn.close.height, at).toBeGreaterThanOrEqual(least);
            expect(drawn.close.left, at).toBeGreaterThanOrEqual(drawn.title.right - 0.5);
            expect(drawn.close.top, at).toBeLessThan(drawn.title.bottom);
            expect(drawn.inner.right - drawn.close.right, at).toBeLessThanOrEqual(
                drawn.paddingRight + 0.5
            );
            // The long title wraps beside the Close on a phone rather than run under it.
            if (width === 320) expect(drawn.lines, at).toBeGreaterThan(1);
        }
        // The Close and its ring stay inside the dialog, which clips what it scrolls.
        const close = page.locator('#end-game .dk-close button');
        await ringByKeyboard(close, browserName);
        const ring = await close.evaluate((button) => {
            const style = getComputedStyle(button);
            const reach = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
            const box = button.getBoundingClientRect();
            const dialog = button.closest('dialog')?.getBoundingClientRect();
            if (!dialog) throw new Error('no dialog');
            return {
                top: box.top - reach - dialog.top,
                right: dialog.right - (box.right + reach),
            };
        });
        expect(ring.top, String(width)).toBeGreaterThanOrEqual(0);
        expect(ring.right, String(width)).toBeGreaterThanOrEqual(0);
    });

test("opens a dialog on its first answer, meets the Close after the title's question, and closes by it with no script", async ({
    page,
    browserName,
}) => {
    await writePage(page, { width: 390, title: 'Round 3', body: BODY });
    await openDialog(page);
    const dialog = page.getByRole('dialog', { name: /End the game now/ });
    await expect(dialog.getByRole('button', { name: 'Keep playing' })).toBeFocused();
    await page.keyboard.press(`Shift+${tabKey(browserName)}`);
    await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
    expect(
        await page
            .locator('#end-game')
            .evaluate((element: HTMLDialogElement) => element.returnValue)
    ).toBe('close');
});

test("names a panel's Close for what it closes, and draws a closed dialog with a Close not at all", async ({
    page,
}) => {
    await writePage(page, { width: 390, title: 'Round 3', body: BODY });
    await expect(page.getByRole('button', { name: 'Close round tips' })).toBeVisible();
    await expect(page.locator('#end-game')).toBeHidden();
});

test('keeps the Close drawn in forced colors, its × in the text and its ring on focus', async ({
    page,
    browserName,
}) => {
    await forceColors(page);
    await writePage(page, { width: 390, title: 'Round 3', body: BODY });
    await openDialog(page);
    const close = page.locator('#end-game .dk-close button');
    await ringByKeyboard(close, browserName);
    const drawn = await close.evaluate((button) => ({
        mark: getComputedStyle(button.querySelector('[aria-hidden="true"]') ?? button).color,
        ring: getComputedStyle(button).outlineStyle,
    }));
    expect(drawn.ring).not.toBe('none');
    expect([await colorOf(page, 'ButtonText'), await colorOf(page, 'LinkText')]).toContain(
        drawn.mark
    );
});

for (const theme of ['light', 'dark'] as const)
    test(`has no audit findings with a Close in the corner, in the ${theme} theme`, async ({
        page,
    }) => {
        await writePage(page, { width: 390, theme, title: 'Round 3', body: BODY });
        expect((await new AxeBuilder({ page }).analyze()).violations.map(({ id }) => id)).toEqual(
            []
        );
        await openDialog(page);
        expect(
            (await new AxeBuilder({ page }).include('dialog').analyze()).violations.map(
                ({ id }) => id
            )
        ).toEqual([]);
    });
