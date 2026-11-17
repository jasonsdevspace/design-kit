import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { box, sideways, style, writePage } from './page.js';
import { brokenWords, cutOff } from './spacing.js';
import { textSize } from './text-size.js';

/*
 * A landing page's bands and a group of sections: a band lining its content up with the column and
 * spacing it by the flow, its room above and below its own unless a page sets --dk-band-room, its
 * prose at the measure, a row and a switch in it reaching past its column by their ring, its sides
 * held on an app's page, nothing cut off on a narrow phone at twice the text size, a grid in a band
 * spacing its items by its gap alone, a stack in a grid's cell spacing what it holds by the flow, a
 * group of sections side by side on a wide page and one to a row on a phone, each section with a
 * page section's heading and steps, the group a section's step from what comes before it, and no
 * audit findings.
 */

const BODY = `<main id="main-content">
<section class="dk-band" id="hero" aria-labelledby="title">
<div id="grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr)); gap: 2rem; align-items: start">
<div class="dk-stack" id="stack"><p class="dk-eyebrow">For game night</p><h1 id="title">Game Table Tally</h1><p id="lead">Keep the score.</p><p id="stack-text">One phone passed around the table.</p><p><a href="#open">Open the app</a></p></div>
<div id="picture">A picture of the table.</div>
</div>
</section>
<section class="dk-band" id="games" aria-labelledby="games-title" style="--dk-band-room: 2rem">
<p class="dk-eyebrow">Your table</p><h2 id="games-title">The games it scores</h2><p id="games-text">Three games, each by its own rules.</p>
<section aria-labelledby="more"><h2 id="more">More to come</h2><p id="more-text">Each game by its own rules.</p></section>
</section>
<section class="dk-band" id="kinds-band" aria-labelledby="kinds-title"><h2 id="kinds-title">The kinds of game</h2>
<div class="dk-sections" id="kinds"><section aria-labelledby="cards"><h3 id="cards">Card games</h3><p id="cards-text">Flip 7 and Skyjo.</p></section></div>
</section>
<div class="dk-page" id="install">
<h1>Install the app</h1>
<p id="install-lead">Put it on your home screen.</p>
<div class="dk-sections" id="ways">
<section aria-labelledby="iphone"><h2 id="iphone">On an iPhone</h2><p id="iphone-text">Open it in Safari.</p></section>
<section aria-labelledby="android"><h2 id="android">On an Android phone</h2><p id="android-text">Open it in Chrome.</p></section>
</div>
<section aria-labelledby="offline"><h2 id="offline">With no connection</h2><p>It works with none.</p></section>
<h2 id="updates">Updates</h2>
<section id="updates-section" aria-labelledby="updates"><p>It updates itself.</p></section>
</div>
<section class="dk-band" id="reach" aria-labelledby="reach-title"><h2 id="reach-title">Recent games</h2>
<ul class="dk-rows" role="list" aria-label="Games"><li><a class="dk-row" id="band-row" href="#game">Flip 7</a></li></ul>
<div class="dk-theme-switch" id="band-switch" role="radiogroup" aria-label="Theme"><label class="dk-theme-switch-choice"><input type="radio" name="theme" checked><span>System</span></label><label class="dk-theme-switch-choice"><input type="radio" name="theme"><span>Light</span></label></div>
</section>
<div class="dk-page" id="reach-page"><h1>Menu</h1>
<ul class="dk-rows" role="list" aria-label="Places"><li><a class="dk-row" id="page-row" href="#home">Home</a></li></ul>
<div class="dk-theme-switch" id="page-switch" role="radiogroup" aria-label="Page theme"><label class="dk-theme-switch-choice"><input type="radio" name="page-theme" checked><span>System</span></label><label class="dk-theme-switch-choice"><input type="radio" name="page-theme"><span>Dark</span></label></div>
</div>
</main>`;

const open = (page: Page, width: number) => writePage(page, { width, title: 'Bands', body: BODY });

test("sizes a band's title, its heading and its sections, and keeps a group under the heading that names it", async ({
    page,
}) => {
    await open(page, 1280);
    expect((await style(page.locator('#title'), 'font-size'))['font-size']).toBe('28px');
    expect((await style(page.locator('#games-title'), 'font-size'))['font-size']).toBe('24px');
    expect((await style(page.locator('#cards'), 'font-size'))['font-size']).toBe('20px');
    expect((await style(page.locator('#cards-text'), 'margin-top'))['margin-top']).toBe('12px');
    // A group under the heading that names it stands the flow's step, and a section after text a
    // section's.
    expect((await style(page.locator('#kinds'), 'margin-top'))['margin-top']).toBe('16px');
    expect((await style(page.locator('section:has(> #more)'), 'margin-top'))['margin-top']).toBe(
        '48px'
    );
    expect((await style(page.locator('#more'), 'font-size'))['font-size']).toBe('20px');
    expect((await style(page.locator('#more-text'), 'margin-top'))['margin-top']).toBe('12px');
    expect((await style(page.locator('#more-text'), 'margin-bottom'))['margin-bottom']).toBe('0px');
});

test("lines a band's content up with the column and spaces it by the flow", async ({ page }) => {
    await open(page, 1280);
    // The column is 72rem in the middle of 1280px, and content starts a step in from it.
    const sides = await style(page.locator('#games'), 'padding-left', 'padding-right');
    expect(sides).toEqual({ 'padding-left': '80px', 'padding-right': '80px' });
    expect((await style(page.locator('#hero'), 'padding-top'))['padding-top']).toBe('48px');
    // A page's own room above and below, set by its property, wins.
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

test("holds a band's and a stack's own prose to the measure, as a content page's", async ({
    page,
}) => {
    await open(page, 1280);
    const measure = (await style(page.locator('#install-lead'), 'max-width'))['max-width'];
    expect(measure).not.toBe('none');
    for (const id of ['#games-text', '#more-text', '#cards-text', '#stack-text'])
        expect((await style(page.locator(id), 'max-width'))['max-width'], id).toBe(measure);
});

test("keeps a content page's section a section's step under the page's own heading", async ({
    page,
}) => {
    await open(page, 1280);
    expect((await style(page.locator('#updates-section'), 'margin-top'))['margin-top']).toBe(
        '48px'
    );
});

test("reaches a row and a switch past a band's column by their ring, as on a content page", async ({
    page,
}) => {
    await open(page, 1280);
    for (const [band, content] of [
        ['#band-row', '#page-row'],
        ['#band-switch', '#page-switch'],
    ] as const) {
        const margin = (await style(page.locator(content), 'margin-left'))['margin-left'];
        expect(margin).not.toBe('0px');
        expect((await style(page.locator(band), 'margin-left'))['margin-left'], band).toBe(margin);
    }
});

test('keeps every word whole and nothing sideways on a 320px phone at twice the text size', async ({
    page,
}) => {
    await open(page, 320);
    await textSize(page, 2);
    // A row reaches past its list by its ring, which shows rather than cuts, so the words are measured.
    expect(
        await cutOff(page, 'main :is(h1, h2, h3, p, .dk-row, .dk-theme-switch, section)')
    ).toEqual([]);
    expect(await brokenWords(page, 'main :is(h1, h2, h3, p)')).toEqual([]);
    expect(await sideways(page)).toBe(0);
});

test("holds a band's sides at a phone's step on an app's page at twice the text size", async ({
    page,
}) => {
    await writePage(page, {
        width: 320,
        title: 'Bands in an app',
        body: '<div class="dk-app"><section class="dk-band" id="app-band"><h2>Players</h2></section></div>',
    });
    await textSize(page, 2);
    const sides = await style(page.locator('#app-band'), 'padding-left', 'padding-right');
    expect(sides).toEqual({ 'padding-left': '16px', 'padding-right': '16px' });
});
