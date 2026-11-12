import { expect, type Page, test } from '@playwright/test';

import { writePage } from './page.js';

/*
 * The step between pieces placed one after another in each container the kit draws, as the
 * reference writes them: one step of the kit's scale, with no piece's own margin canceling it and
 * no browser margin left over, in the explainer, a panel, an app's body, a dialog and a plain form.
 */

const CALLOUT =
    '<div class="dk-callout" role="note"><p class="dk-callout-title">Saved</p><p>The round is kept.</p></div>';
const PILLS =
    '<ul class="dk-pills" role="list"><li class="dk-pill">TypeScript</li><li class="dk-pill">React</li></ul>';
const TABS =
    '<ul class="dk-tabs" role="list"><li><a class="dk-tab" href="#a" aria-current="page">All</a></li><li><a class="dk-tab" href="#b">Books</a></li></ul>';
const EYEBROW = '<p class="dk-eyebrow">Signed in as a guest</p>';
const ROWS =
    '<ul class="dk-rows" role="list"><li><a class="dk-row" href="#r"><span class="dk-row-text"><span class="dk-row-title">Ana</span></span></a></li></ul>';
const FIELD = (id: string) =>
    `<div class="dk-field"><label class="dk-field-label" for="${id}">Name</label><input class="dk-input" id="${id}"></div>`;
const GRID =
    '<div class="dk-button-grid" role="group" aria-label="Keys"><button type="button" class="dk-button">1</button><button type="button" class="dk-button">2</button></div>';

/** The gap between each piece and the one before it, among the children of what is given. */
const gaps = (page: Page, holder: string) =>
    page.locator(holder).evaluate((element) =>
        [...element.children].slice(1).map((child) => {
            const before = child.previousElementSibling?.getBoundingClientRect();
            const top = child.getBoundingClientRect().top;
            return `${child.className || child.tagName.toLowerCase()} ${String(
                Math.round(top - (before?.bottom ?? top))
            )}`;
        })
    );

const each = (pieces: readonly string[], step: number) =>
    pieces.map((piece) => `${piece} ${String(step)}`);

test('stands each piece one step after the one before it in an explainer and a panel', async ({
    page,
}) => {
    await writePage(page, {
        title: 'Flow',
        body: `<main class="dk-explainer"><section><h2>Pieces</h2><p>Before.</p>${CALLOUT}${PILLS}${TABS}${EYEBROW}${ROWS}<p>After.</p></section>
<div class="dk-panel" id="panel"><p class="dk-panel-title">Players</p>${ROWS}${PILLS}<p>After.</p></div></main>`,
    });
    const section = await gaps(page, '.dk-explainer > section');
    // From the paragraph after the heading on, every piece one step down.
    expect(section.slice(1)).toEqual(
        each(['dk-callout', 'dk-pills', 'dk-tabs', 'dk-eyebrow', 'dk-rows', 'p'], 16)
    );
    expect(await gaps(page, '#panel')).toEqual(each(['dk-rows', 'dk-pills', 'p'], 12));
});

test("stands each piece one step after the one before it in an app's body", async ({ page }) => {
    await writePage(page, {
        title: 'Flow',
        width: 390,
        body: `<div class="dk-app"><main class="dk-app-body">${GRID}${FIELD('n')}${CALLOUT}${ROWS}<p>After.</p></main></div>`,
    });
    expect(await gaps(page, '.dk-app-body')).toEqual(
        each(['dk-field', 'dk-callout', 'dk-rows', 'p'], 16)
    );
    // The first piece starts one step under the bar's edge, as the sides do.
    const top = await page.locator('.dk-app-body').evaluate((element) => {
        const first = element.firstElementChild?.getBoundingClientRect().top ?? 0;
        return Math.round(first - element.getBoundingClientRect().top);
    });
    expect(top).toBe(16);
});

test('stands each piece one step after the one before it in a dialog, and its actions further', async ({
    page,
}) => {
    await writePage(page, {
        title: 'Flow',
        width: 390,
        body: `<dialog class="dk-dialog dk-dialog-sheet"><h2 class="dk-dialog-title">Round options</h2><p>For this round.</p>${FIELD('d')}${GRID}<form class="dk-dialog-actions" method="dialog"><button class="dk-button">Done</button></form></dialog>`,
    });
    await page.locator('dialog').evaluate((dialog) => {
        (dialog as HTMLDialogElement).showModal();
    });
    expect(await gaps(page, 'dialog')).toEqual([
        ...each(['p', 'dk-field', 'dk-button-grid'], 12),
        'dk-dialog-actions 24',
    ]);
});

test('stands each field one step after the one before it in a plain form', async ({ page }) => {
    await writePage(page, {
        title: 'Flow',
        body: `<form id="form">${FIELD('a')}${FIELD('b')}<fieldset class="dk-field dk-choice-field"><legend class="dk-field-label">Show</legend></fieldset></form>`,
    });
    expect(await gaps(page, '#form')).toEqual(each(['dk-field', 'dk-field dk-choice-field'], 16));
});
