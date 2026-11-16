import { expect, type Page, test } from '@playwright/test';

import { style, writePage } from './page.js';

/*
 * A link in running text is told from the words around it by its underline, since the accent
 * stands too close to the text to mark it by color alone. The base keeps the browser's underline on
 * a plain link, in a paragraph, a list, a callout, a panel and a dialog, in both themes and in
 * forced colors, while each piece that is a link, a button, a pill, a tab and a row, takes it off in
 * its own class.
 */

const RUNNING = `<p>Read <a href="#rules">the rules</a> first.</p>`;

const BODY =
    `<main><h1>Links</h1>` +
    `<section aria-label="Paragraph" data-in="a paragraph">${RUNNING}</section>` +
    `<ul data-in="a list item"><li>Ask <a href="#help">for help</a> when stuck.</li></ul>` +
    `<div class="dk-callout" role="note" data-in="a callout"><div class="dk-callout-body">${RUNNING}</div></div>` +
    `<section class="dk-panel" aria-label="Panel" data-in="a panel">${RUNNING}</section>` +
    `<div data-piece="a button"><a class="dk-button" href="#start">Start</a></div>` +
    `<nav aria-label="Site"><ul class="dk-pills" role="list" data-piece="a pill"><li><a class="dk-pill" href="#home" aria-current="page">Home</a></li><li><a class="dk-pill" href="#about">About</a></li></ul></nav>` +
    `<nav aria-label="Categories"><ul class="dk-tabs" role="list" data-piece="a tab"><li><a class="dk-tab" href="#all" aria-current="page">All</a></li><li><a class="dk-tab" href="#books">Books</a></li></ul></nav>` +
    `<ul class="dk-rows" role="list" aria-label="Games" data-piece="a row"><li><a class="dk-row" href="#flip"><span class="dk-row-text"><span class="dk-row-title">Flip 7</span></span><span class="dk-row-sign" aria-hidden="true">›</span></a></li></ul>` +
    `</main>` +
    `<dialog class="dk-dialog" aria-labelledby="options-title" data-in="a dialog's body"><h2 class="dk-dialog-title" id="options-title">Options</h2>${RUNNING}</dialog>`;

/** Draws the page in a theme with the dialog open and nothing under the pointer. */
const open = async (page: Page, theme: 'light' | 'dark') => {
    await writePage(page, { theme, title: 'Links', body: BODY });
    await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
    await page.mouse.move(0, 0);
};

/** Each link and the place it sits, as the page names it, with its line at rest. */
const lines = async (page: Page, kind: 'in' | 'piece') => {
    const found: Record<string, string> = {};
    for (const holder of await page.locator(`[data-${kind}]`).all()) {
        const place = (await holder.getAttribute(`data-${kind}`)) ?? '';
        for (const link of await holder.locator('a').all())
            found[`${place}, ${(await link.textContent()) ?? ''}`] = (
                await style(link, 'text-decoration-line')
            )['text-decoration-line'] as string;
    }
    return found;
};

for (const theme of ['light', 'dark'] as const)
    test(`underlines a link in running text at rest, and no piece that is a link, in the ${theme} theme`, async ({
        page,
    }) => {
        await open(page, theme);
        const running = await lines(page, 'in');
        expect(Object.keys(running)).toHaveLength(5);
        for (const [where, line] of Object.entries(running)) expect(line, where).toBe('underline');
        const pieces = await lines(page, 'piece');
        expect(Object.keys(pieces)).toHaveLength(6);
        for (const [what, line] of Object.entries(pieces)) expect(line, what).toBe('none');
    });

test('underlines a link in running text in forced colors, in a callout, a panel and a dialog', async ({
    browser,
}) => {
    const context = await browser.newContext({ forcedColors: 'active' });
    const page = await context.newPage();
    await open(page, 'light');
    expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
    for (const [where, line] of Object.entries(await lines(page, 'in')))
        expect(line, where).toBe('underline');
    await context.close();
});
