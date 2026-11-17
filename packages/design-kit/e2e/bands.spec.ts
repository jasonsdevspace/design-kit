import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { box, style, writePage } from './page.js';

/*
 * A landing page's bands and a group of sections: a band lining its content up with the column and
 * spacing it by the flow, its room above and below its own unless a page sets it, a grid in a band
 * spacing its items by its gap alone, a stack in a grid's cell spacing what it holds by the flow, a
 * group of sections side by side on a wide page and one to a row on a phone, each section with a
 * page section's heading and steps, the group a section's step from what comes before it, and no
 * audit findings.
 */

const BODY = `<main id="main-content">
<section class="dk-band" id="hero" aria-labelledby="title">
<div id="grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start">
<div class="dk-stack" id="stack"><p class="dk-eyebrow">For game night</p><h1 id="title">Game Table Tally</h1><p id="lead">Keep the score.</p><p><a href="#open">Open the app</a></p></div>
<div id="picture">A picture of the table.</div>
</div>
</section>
<section class="dk-band" id="games" aria-labelledby="games-title" style="padding-block: 2rem">
<p class="dk-eyebrow">Your table</p><h2 id="games-title">The games it scores</h2><p id="games-text">Three games, each by its own rules.</p>
</section>
<div class="dk-page" id="install">
<h1>Install the app</h1>
<p id="install-lead">Put it on your home screen.</p>
<div class="dk-sections" id="ways">
<section aria-labelledby="iphone"><h2 id="iphone">On an iPhone</h2><p id="iphone-text">Open it in Safari.</p></section>
<section aria-labelledby="android"><h2 id="android">On an Android phone</h2><p id="android-text">Open it in Chrome.</p></section>
</div>
<section aria-labelledby="offline"><h2 id="offline">With no connection</h2><p>It works with none.</p></section>
</div>
</main>`;

const open = (page: Page, width: number) => writePage(page, { width, title: 'Bands', body: BODY });

test("lines a band's content up with the column and spaces it by the flow", async ({ page }) => {
    await open(page, 1280);
    // The column is 72rem in the middle of 1280px, and content starts a step in from it.
    const sides = await style(page.locator('#games'), 'padding-left', 'padding-right');
    expect(sides).toEqual({ 'padding-left': '80px', 'padding-right': '80px' });
    expect((await style(page.locator('#hero'), 'padding-top'))['padding-top']).toBe('48px');
    // A page's own room above and below wins.
    expect((await style(page.locator('#games'), 'padding-top'))['padding-top']).toBe('32px');
    const eyebrow = await box(page.locator('#games .dk-eyebrow'));
    const heading = await box(page.locator('#games-title'));
    const text = await box(page.locator('#games-text'));
    expect(Math.round(heading.y - (eyebrow.y + eyebrow.height))).toBe(4);
    expect(Math.round(text.y - (heading.y + heading.height))).toBe(16);
});

test("spaces a grid's items in a band by its gap alone, and a stack's pieces by the flow", async ({
    page,
}) => {
    await open(page, 1280);
    const stack = await box(page.locator('#stack'));
    const picture = await box(page.locator('#picture'));
    expect(picture.y).toBe(stack.y);
    expect((await style(page.locator('#picture'), 'margin-top'))['margin-top']).toBe('0px');
    const title = await box(page.locator('#title'));
    const lead = await box(page.locator('#lead'));
    expect(Math.round(lead.y - (title.y + title.height))).toBe(8);
    expect((await style(page.locator('#stack > p:last-child'), 'margin-top'))['margin-top']).toBe(
        '16px'
    );
});

for (const [width, columns] of [
    [1280, 2],
    [390, 1],
] as const)
    test(`sets a group of sections ${String(columns)} to a row at ${String(width)} wide, each with a page section's heading and steps`, async ({
        page,
    }) => {
        await open(page, width);
        const iphone = await box(page.locator('#iphone'));
        const android = await box(page.locator('#android'));
        expect(iphone.y === android.y).toBe(columns === 2);
        for (const id of ['iphone', 'android']) {
            expect((await style(page.locator(`#${id}`), 'font-size'))['font-size']).toBe('20px');
            expect((await style(page.locator(`#${id}-text`), 'margin-top'))['margin-top'], id).toBe(
                '12px'
            );
        }
        // The group stands a section's step under the lead, as the section after it does.
        expect((await style(page.locator('#ways'), 'margin-top'))['margin-top']).toBe('48px');
    });

test('has no audit findings', async ({ page }) => {
    await open(page, 390);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map(({ id }) => id)).toEqual([]);
});
