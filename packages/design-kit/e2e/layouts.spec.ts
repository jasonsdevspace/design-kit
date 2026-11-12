import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { buttons, codeHead, dialog, fieldAction, themeSwitch } from '../examples/examples.js';
import { box, sideways, writePage } from './page.js';
import { SPACED } from './spacing.js';
import { textSize } from './text-size.js';

/*
 * The layouts a page would otherwise write around the kit's pieces, as a browser draws them: a row
 * of buttons that wraps with the kit's step, a field's control and its button at one height, a
 * code block's head with its copy button on the title's line, a dialog's stacked actions filling
 * their row on a phone and in an app and wrapping their words, the theme switch's first word on the
 * column's line in what pads and inside a bare page, and an eyebrow the smallest step over its
 * heading.
 */

/** A control shown, as a page's script shows it once attached. */
const shown = (markup: string): string => markup.replaceAll(' hidden=""', '');

/** Where an element ends, down the page. */
const bottom = (drawn: { y: number; height: number }): number => drawn.y + drawn.height;

test('wraps a row of buttons onto rows a step apart, with a step between each', async ({
    page,
}) => {
    await writePage(page, {
        width: 320,
        title: 'Buttons',
        body: `<main>${renderToStaticMarkup(buttons)}</main>`,
    });
    const row = page.locator('.dk-actions > .dk-button');
    const drawn = await row.evaluateAll((all) =>
        all.map((one) => {
            const r = one.getBoundingClientRect();
            return { x: r.x, y: r.y, width: r.width, height: r.height };
        })
    );
    const [first, second] = drawn;
    expect(first && second && second.x - (first.x + first.width)).toBeCloseTo(8, 0);
    // The rows it wraps onto stand a step apart, where spaces between buttons left none.
    const tops = [...new Set(drawn.map((one) => Math.round(one.y)))];
    expect(tops.length).toBeGreaterThan(1);
    const above = drawn.filter((one) => Math.round(one.y) === tops[0]);
    const below = drawn.filter((one) => Math.round(one.y) === tops[1]);
    expect(Math.min(...below.map((one) => one.y)) - Math.max(...above.map(bottom))).toBeCloseTo(
        8,
        0
    );
    expect(await sideways(page)).toBe(0);
});

test("stands a field's control and its button at one height at every width and text size", async ({
    page,
    browserName,
}) => {
    for (const width of [320, 390, 1280])
        for (const size of browserName === 'chromium' ? [1, 2] : [1]) {
            await writePage(page, {
                width,
                title: 'Search',
                body: `<main>${renderToStaticMarkup(fieldAction)}</main>`,
            });
            // Set at every pass, since a size set once stays for the page's life.
            if (browserName === 'chromium') await textSize(page, size);
            const what = `${String(width)}px, text ${String(size)}`;
            const input = await box(page.getByRole('searchbox'), 'the control');
            const button = await box(page.getByRole('button', { name: 'Search' }), 'the button');
            if (Math.round(button.y) === Math.round(input.y)) {
                expect(button.height, what).toBeCloseTo(input.height, 0);
                expect(button.x, what).toBeGreaterThan(input.x + input.width);
            } else {
                // Moved under the control where the row has no room for both.
                expect(button.y, what).toBeGreaterThanOrEqual(bottom(input));
            }
            expect(input.width, what).toBeGreaterThanOrEqual(10 * 16 - 1);
            expect(await sideways(page), what).toBe(0);
        }
});

test("sets a code block's copy button on its title's line, and the block a short step under", async ({
    page,
}) => {
    await writePage(page, {
        width: 390,
        title: 'Install',
        body: `<main>${shown(renderToStaticMarkup(codeHead))}</main>`,
    });
    const title = await box(page.locator('.dk-code-title'), 'the title');
    const copy = await box(page.getByRole('button', { name: /^Copy/ }), 'the copy button');
    const head = await box(page.locator('.dk-code-head'), 'the head');
    const block = await box(page.locator('.dk-code'), 'the block');
    // The button at the head's end, on the title's line.
    expect(copy.x + copy.width).toBeCloseTo(head.x + head.width, 0);
    expect(copy.y + copy.height / 2).toBeCloseTo(title.y + title.height / 2, 0);
    expect(block.y - bottom(head)).toBeCloseTo(8, 0);
});

test("fills the row with each of a dialog's actions on a phone, and leaves them at the end on a wide screen", async ({
    page,
}) => {
    for (const [width, app, fills] of [
        [390, false, true],
        [1280, false, false],
        [1280, true, true],
    ] as const) {
        await writePage(page, {
            width,
            title: 'Round 3',
            body: `${app ? '<div class="dk-app"></div>' : ''}${renderToStaticMarkup(dialog)}`,
        });
        await page.locator('#end-game').evaluate((element) => {
            (element as HTMLDialogElement).showModal();
        });
        const actions = await box(page.locator('#end-game .dk-dialog-actions'), 'the actions');
        const keep = await box(page.getByRole('button', { name: 'Keep playing' }), 'an action');
        const end = await box(page.getByRole('button', { name: 'End the game' }), 'an action');
        const what = `${String(width)}px, app: ${String(app)}`;
        if (fills) {
            expect(keep.x, what).toBeCloseTo(actions.x, 0);
            expect(end.x + end.width, what).toBeCloseTo(actions.x + actions.width, 0);
        } else {
            expect(keep.x, what).toBeGreaterThan(actions.x + 8);
            expect(end.x + end.width, what).toBeCloseTo(actions.x + actions.width, 0);
        }
    }
});

test("stacks a dialog's actions at the dialog's width on a phone at twice the text size", async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    await writePage(page, {
        width: 320,
        title: 'Round 3',
        body: renderToStaticMarkup(dialog),
    });
    await textSize(page, 2);
    await page.locator('#end-game').evaluate((element) => {
        (element as HTMLDialogElement).showModal();
    });
    const actions = await box(page.locator('#end-game .dk-dialog-actions'), 'the actions');
    for (const name of ['Keep playing', 'End the game']) {
        const action = await box(page.getByRole('button', { name }), name);
        expect([Math.round(action.x), Math.round(action.width)], name).toEqual([
            Math.round(actions.x),
            Math.round(actions.width),
        ]);
    }
});

test("wraps a long label on a field's button and a dialog's action rather than run past the page", async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    const long = 'Search every product, category and brand';
    await writePage(page, {
        width: 320,
        title: 'Search',
        css: SPACED,
        body: `<main>${renderToStaticMarkup(fieldAction).replace('>Search<', `>${long}<`)}</main>`,
    });
    await textSize(page, 2);
    expect(await sideways(page), 'the field').toBe(0);
    await writePage(page, {
        width: 320,
        title: 'Round 3',
        css: SPACED,
        body: renderToStaticMarkup(dialog).replace(
            '>End the game<',
            '>End the game and clear every score<'
        ),
    });
    await textSize(page, 2);
    const opened = page.locator('#end-game');
    await opened.evaluate((element) => {
        (element as HTMLDialogElement).showModal();
    });
    // Nothing runs past the dialog's start, where it could not be scrolled to, or past its end.
    expect(await opened.evaluate((element) => element.scrollWidth - element.clientWidth)).toBe(0);
    const actions = await box(page.locator('#end-game .dk-dialog-actions'), 'the actions');
    for (const name of ['Keep playing', 'End the game and clear every score']) {
        const action = await box(page.getByRole('button', { name }), name);
        expect(action.x, name).toBeGreaterThanOrEqual(actions.x - 0.5);
        expect(action.x + action.width, name).toBeLessThanOrEqual(actions.x + actions.width + 0.5);
    }
});

test("keeps a text button among a dialog's actions at its link's width on a phone", async ({
    page,
}) => {
    await writePage(page, {
        width: 390,
        title: 'Round 3',
        body: renderToStaticMarkup(dialog).replace(
            'class="dk-button" value="keep"',
            'class="dk-button dk-button-text" value="keep"'
        ),
    });
    await page.locator('#end-game').evaluate((element) => {
        (element as HTMLDialogElement).showModal();
    });
    const keep = await box(page.getByRole('button', { name: 'Keep playing' }), 'the text button');
    const words = await page.getByRole('button', { name: 'Keep playing' }).evaluate((button) => {
        const range = document.createRange();
        range.selectNodeContents(button);
        return range.getBoundingClientRect().width;
    });
    expect(keep.width).toBeLessThan(words + 16);
});

/** Where the switch's first word, its name, starts, and the inner edge of what holds it. */
const switchStart = async (page: Page): Promise<{ word: number; edge: number }> => {
    const word = await box(page.locator('.dk-theme-switch-name'), "the switch's name");
    const edge = await page.locator('#holder').evaluate((holder) => {
        const drawn = holder.getBoundingClientRect();
        // Inside its edge and its padding, where its content starts.
        return drawn.x + holder.clientLeft + parseFloat(getComputedStyle(holder).paddingLeft);
    });
    return { word: word.x, edge };
};

test("starts the theme switch's first word on the column's line in what pads, and keeps it inside a bare page", async ({
    page,
}) => {
    const theSwitch = shown(renderToStaticMarkup(themeSwitch));
    for (const [name, body] of [
        ['a panel', `<main><div class="dk-panel" id="holder">${theSwitch}</div></main>`],
        ['a callout', `<main><div class="dk-callout" id="holder">${theSwitch}</div></main>`],
        [
            "an explainer's header",
            `<header class="dk-explainer-header" id="holder">${theSwitch}</header><main></main>`,
        ],
        [
            "an app's body",
            `<div class="dk-app"><main class="dk-app-body" id="holder">${theSwitch}</main></div>`,
        ],
    ] as const) {
        await writePage(page, { width: 390, title: 'Theme', body });
        const { word, edge } = await switchStart(page);
        expect(word, name).toBeCloseTo(edge, 0);
        expect(await sideways(page), name).toBe(0);
    }
    // At a page's bare edge the switch starts at the page's edge, its name past its ring's room.
    await writePage(page, { width: 320, title: 'Theme', body: `<main>${theSwitch}</main>` });
    expect(await sideways(page)).toBe(0);
    expect((await box(page.locator('.dk-theme-switch'), 'the switch')).x).toBeCloseTo(0, 0);
    expect(
        (await box(page.locator('.dk-theme-switch-name'), "the switch's name")).x
    ).toBeGreaterThan(0);
});

test('sets an eyebrow the smallest step over the heading after it, in every container', async ({
    page,
}) => {
    const block =
        '<p>Before.</p><p class="dk-eyebrow" id="eyebrow">Round 3</p><h2 id="heading">Scores</h2>';
    for (const [name, body] of [
        ['a page', `<main>${block}</main>`],
        ['an explainer', `<main class="dk-explainer">${block}</main>`],
        ["an app's body", `<div class="dk-app"><main class="dk-app-body">${block}</main></div>`],
        ['a panel', `<main><div class="dk-panel">${block}</div></main>`],
    ] as const) {
        await writePage(page, { width: 390, title: 'Scores', body });
        const eyebrow = await box(page.locator('#eyebrow'), 'the eyebrow');
        const heading = await box(page.locator('#heading'), 'the heading');
        expect(heading.y - bottom(eyebrow), name).toBeCloseTo(4, 0);
    }
});
