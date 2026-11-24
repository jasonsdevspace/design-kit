import { expect, type Page, test } from '@playwright/test';

import { settle, writePage } from './page.js';

/*
 * The step between pieces placed one after another in each container the kit draws, as the
 * reference writes them: one step of the kit's scale, with no piece's own margin canceling it and
 * no browser margin left over, in the explainer, a panel, an app's body, a dialog and a plain form,
 * and a page's own markup in a plain form left where a form with a class leaves it.
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
    // A sheet rises as it opens, and WebKit reads each piece where it stands at the moment it is
    // asked, so pieces read during the rise are read at different heights and their gaps shrink.
    await settle(page.locator('dialog'));
    expect(await gaps(page, 'dialog')).toEqual([
        ...each(['p', 'dk-field', 'dk-button-grid'], 12),
        'dk-dialog-actions 24',
    ]);
});

test("stands each of the kit's blocks one step after the one before it in a plain form", async ({
    page,
}) => {
    await writePage(page, {
        title: 'Flow',
        body: `<form id="form">${FIELD('a')}${FIELD('b')}<div class="dk-actions"><button class="dk-button">Back</button><button class="dk-button">Next</button></div><fieldset class="dk-field dk-choice-field"><legend class="dk-field-label">Show</legend></fieldset>${CALLOUT}</form>`,
    });
    expect(await gaps(page, '#form')).toEqual(
        each(['dk-field', 'dk-actions', 'dk-field dk-choice-field', 'dk-callout'], 16)
    );
});

test("stands a block a step below a page's own markup between two blocks, the margins collapsing", async ({
    page,
}) => {
    await writePage(page, {
        title: 'Flow',
        body: `<form id="form">${FIELD('a')}<h2>More</h2>${FIELD('b')}</form>`,
    });
    const own = await page
        .locator('#form h2')
        .evaluate((heading) => Math.round(parseFloat(getComputedStyle(heading).marginBottom)));
    // The heading keeps its own margins, and the field under it the larger of its step and them.
    expect(own).toBeGreaterThan(16);
    expect(await gaps(page, '#form')).toEqual([`h2 ${String(own)}`, `dk-field ${String(own)}`]);
});

test("keeps a dialog's further step above its actions in a plain form inside it", async ({
    page,
}) => {
    await writePage(page, {
        title: 'Flow',
        width: 390,
        body: `<dialog class="dk-dialog"><h2 class="dk-dialog-title">Options</h2><form id="form" method="dialog">${FIELD('a')}${FIELD('b')}<div class="dk-actions dk-dialog-actions"><button class="dk-button">Done</button></div></form></dialog>`,
    });
    await page.locator('dialog').evaluate((dialog) => {
        (dialog as HTMLDialogElement).showModal();
    });
    expect(await gaps(page, 'dialog')).toEqual(['form 12']);
    expect(await gaps(page, '#form')).toEqual(['dk-field 16', 'dk-actions dk-dialog-actions 24']);
});

/** Where each of a form's parts sits below the form's top, and the margins it is drawn with. */
const placesIn = (page: Page, form: string) =>
    page.locator(form).evaluate((holder) =>
        [...holder.children].map((part) => {
            const style = getComputedStyle(part);
            // A part that draws no box has no place to compare, only its margins.
            const top =
                part.getClientRects().length === 0
                    ? 'none'
                    : String(
                          Math.round(
                              part.getBoundingClientRect().top - holder.getBoundingClientRect().top
                          )
                      );
            return `${part.tagName.toLowerCase()} ${top} ${style.marginTop} ${style.marginBottom}`;
        })
    );

test("draws a page's own markup in a plain form as in a form with a class", async ({ page }) => {
    const parts =
        '<dialog><p>Later.</p></dialog><button>Back</button><button>Next</button>' +
        '<label for="w">Words</label><br><input id="w">' +
        '<label for="c">Code</label><input type="hidden" name="t"><input id="c">' +
        '<datalist id="d"><option value="Ana"></option></datalist>' +
        '<div style="display: flex"><input aria-label="Search"><button>Go</button></div>' +
        `<h2>More</h2><p>Before.</p>${FIELD('f')}<fieldset><legend>Ship</legend></fieldset>` +
        '<button class="dk-button">Send</button>';
    await writePage(page, {
        title: 'Flow',
        body: `<form id="plain" style="display: flow-root">${parts}</form><form class="own" id="classed" style="display: flow-root">${parts.replaceAll('id="', 'id="o-').replaceAll('for="', 'for="o-')}</form>`,
    });
    expect(await placesIn(page, '#plain')).toEqual(await placesIn(page, '#classed'));
});

test("adds no step for a hidden input or a piece out of sight before a plain form's first part", async ({
    page,
}) => {
    await writePage(page, {
        title: 'Flow',
        body: `<form id="form" style="display: flow-root"><input type="hidden" name="t"><script type="application/json">{}</script><template><p>Later.</p></template><dialog><p>Later.</p></dialog><datalist id="d"><option value="Ana"></option></datalist><p hidden>Saved.</p><h2 class="dk-visually-hidden">Join</h2>${FIELD('a')}</form>
<form id="status" style="display: flow-root"><div class="dk-callout dk-visually-hidden"><p class="dk-callout-body" role="status">Saved.</p></div>${FIELD('s')}</form>
<form id="empty" style="display: flow-root"><div class="dk-callout" data-empty><div class="dk-callout-body" role="status"></div></div>${FIELD('e')}</form>
<form id="pair">${FIELD('b')}<input type="hidden" name="u">${FIELD('c')}</form>`,
    });
    // Each form holds its own margins, so a step on the field would show rather than collapse.
    const under = (form: string) =>
        page.locator(form).evaluate((holder) => {
            const field = holder.querySelector('.dk-field');
            return {
                margin: field ? getComputedStyle(field).marginTop : '',
                top: Math.round(
                    (field?.getBoundingClientRect().top ?? 0) - holder.getBoundingClientRect().top
                ),
            };
        });
    // Before the field, parts that draw nothing, a visually hidden status callout, and an empty
    // callout marked so.
    for (const form of ['#form', '#status', '#empty'])
        expect.soft(await under(form), form).toEqual({ margin: '0px', top: 0 });
    // Two fields with a hidden input between them still stand one step apart.
    const apart = await page.locator('#pair').evaluate((form) => {
        const [first, second] = [...form.querySelectorAll('.dk-field')].map((field) =>
            field.getBoundingClientRect()
        );
        return Math.round((second?.top ?? 0) - (first?.bottom ?? 0));
    });
    expect(apart).toBe(16);
});

test("counts an empty callout not marked data-empty as a block before a plain form's first part", async ({
    page,
}) => {
    await writePage(page, {
        title: 'Flow',
        body: `<form id="unmarked" style="display: flow-root"><div class="dk-callout"><div class="dk-callout-body" role="status"></div></div>${FIELD('m')}</form>`,
    });
    // The form holds its own margins, so the field's step shows rather than collapses.
    const under = await page.locator('#unmarked').evaluate((holder) => {
        const field = holder.querySelector('.dk-field');
        return {
            margin: field ? getComputedStyle(field).marginTop : '',
            top: Math.round(
                (field?.getBoundingClientRect().top ?? 0) - holder.getBoundingClientRect().top
            ),
        };
    });
    // The callout is out of sight but counts as a block, as the reference says, since telling it
    // apart would take a :has() on it from the block after it, which restyles every later block
    // for a change inside any one of them.
    expect(under).toEqual({ margin: '16px', top: 16 });
});

test('adds nothing to fields in a form that lays them out itself, in a grid or side by side', async ({
    page,
}) => {
    await writePage(page, {
        title: 'Flow',
        css: '.own { display: grid; gap: 12px } .pair { display: flex; gap: 12px; align-items: end }',
        body: `<form class="own" id="own">${FIELD('a')}${FIELD('b')}</form><form><div class="pair" id="pair">${FIELD('c')}${FIELD('d')}</div></form>`,
    });
    expect(await gaps(page, '#own')).toEqual(['dk-field 12']);
    const tops = await page
        .locator('#pair > .dk-field')
        .evaluateAll((fields) =>
            fields.map((field) => Math.round(field.getBoundingClientRect().top))
        );
    expect(new Set(tops).size).toBe(1);
});

test("adds no step for a piece out of sight before an app body's or a dialog's first one", async ({
    page,
}) => {
    await writePage(page, {
        title: 'Flow',
        width: 390,
        body: `<div class="dk-app"><main class="dk-app-body"><h2 class="dk-visually-hidden">Round 3</h2>${CALLOUT}</main></div>
<dialog class="dk-dialog"><p hidden>Saved.</p><h2 class="dk-dialog-title">Options</h2><p class="dk-table-title" id="t">Scores</p><div class="dk-table-scroll" role="region" aria-labelledby="t" tabindex="0"><table class="dk-table"><tr><td>1</td></tr></table></div></dialog>`,
    });
    const under = await page.locator('.dk-app-body').evaluate((element) => {
        const first = element.querySelector('.dk-callout')?.getBoundingClientRect().top ?? 0;
        return Math.round(first - element.getBoundingClientRect().top);
    });
    expect(under).toBe(16);
    await page.locator('dialog').evaluate((dialog) => {
        (dialog as HTMLDialogElement).showModal();
    });
    // The title first, at the dialog's padding, and a table its short step under its own title.
    expect((await gaps(page, 'dialog')).slice(1)).toEqual([
        'dk-table-title 12',
        'dk-table-scroll 8',
    ]);
    const atPadding = await page.locator('dialog').evaluate((dialog) => {
        const title = dialog.querySelector('.dk-dialog-title')?.getBoundingClientRect().top ?? 0;
        const style = getComputedStyle(dialog);
        return Math.round(
            title -
                dialog.getBoundingClientRect().top -
                parseFloat(style.borderTopWidth) -
                parseFloat(style.paddingTop)
        );
    });
    expect(atPadding).toBe(0);
});
