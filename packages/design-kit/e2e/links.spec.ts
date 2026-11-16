import { expect, type Page, test } from '@playwright/test';

import { contrast, forceColors, groundOf, style, writePage } from './page.js';

/*
 * A link in running text is told from the words around it by its underline, since the accent
 * stands too close to the text to mark it by color alone, and in the footer a link takes the
 * footer's own muted color, so the underline is all that marks it. The kit leaves the browser's
 * underline on a plain link wherever one sits in running text, drawn at 3 to 1 against the ground
 * it sits on, in both themes and in forced colors, and a text button puts it back. A piece that is a link, such as a
 * button, a pill, a tab, a row, a tab bar's link or the site's brand, takes it off in its own class.
 */

const RUNNING = `<p>Read <a href="#rules">the rules</a> first.</p>`;

/** Every place a link sits in running text, each named by the place a failure reports. */
const PLACES =
    `<div class="dk-strip" data-in="the strip"><nav class="dk-strip-links" aria-label="Portfolio"><a href="#home">Jason Poteet</a><a href="#about">How it works</a></nav></div>` +
    `<header class="dk-explainer-header" data-in="the explainer's header"><a href="#demo">Example</a></header>` +
    `<main><h1>Links</h1>` +
    `<section aria-label="Paragraph" data-in="a paragraph">${RUNNING}</section>` +
    `<ul data-in="a list item"><li>Ask <a href="#help">for help</a> when stuck.</li></ul>` +
    `<div class="dk-callout" role="note" data-in="a callout"><div class="dk-callout-body">${RUNNING}</div></div>` +
    `<section class="dk-panel" aria-label="Panel" data-in="a panel">${RUNNING}</section>` +
    `<div class="dk-explainer" data-in="an explainer">${RUNNING}</div>` +
    `<div class="dk-page" data-in="a content page"><section>${RUNNING}</section></div>` +
    `<p class="dk-lead" data-in="a lead">Keep score with <a href="#how">no sign-up</a>.</p>` +
    `<div class="dk-table-scroll" role="region" aria-label="Games" tabindex="0" data-in="a table cell"><table class="dk-table"><thead><tr><th scope="col">Game</th></tr></thead><tbody><tr><td><a href="#flip">Flip 7</a></td></tr></tbody></table></div>` +
    `<div class="dk-toast" data-shown data-in="a toast's message"><p class="dk-toast-message">Round saved. <a href="#round">See it</a>.</p></div>` +
    `<p data-in="a text button"><a class="dk-button dk-button-text" href="#more">More options</a></p>`;

/** Every piece that is a link, each of which marks itself by more than an underline. */
const PIECES =
    `<header class="dk-site-header" data-piece="the site's brand"><a class="dk-site-brand" href="#home"><svg class="dk-site-mark" aria-hidden="true" focusable="false" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="currentColor"></rect></svg>Scorekeeper</a></header>` +
    `<div data-piece="a button"><a class="dk-button" href="#start">Start</a></div>` +
    `<nav aria-label="Site"><ul class="dk-pills" role="list" data-piece="a pill"><li><a class="dk-pill" href="#home" aria-current="page">Home</a></li><li><a class="dk-pill" href="#about">About</a></li></ul></nav>` +
    `<nav aria-label="Categories"><ul class="dk-tabs" role="list" data-piece="a tab"><li><a class="dk-tab" href="#all" aria-current="page">All</a></li><li><a class="dk-tab" href="#books">Books</a></li></ul></nav>` +
    `<ul class="dk-rows" role="list" aria-label="Played" data-piece="a row"><li><a class="dk-row" href="#flip"><span class="dk-row-text"><span class="dk-row-title">Flip 7</span></span><span class="dk-row-sign" aria-hidden="true">›</span></a></li></ul>` +
    `<nav class="dk-tabbar" aria-label="Sections" data-piece="a tab bar"><ul><li><a href="#play" aria-current="page">Play</a></li><li><a href="#history">History</a></li></ul></nav>`;

const BODY =
    `${PIECES}${PLACES}</main>` +
    `<footer class="dk-footer" data-in="the footer"><p>A project by <a href="#me">Jason Poteet</a>, with <a href="#source">its source</a> on GitHub.</p></footer>` +
    `<dialog class="dk-dialog" aria-labelledby="options-title" data-in="a dialog's body"><h2 class="dk-dialog-title" id="options-title">Options</h2>${RUNNING}</dialog>`;

/** How many links each kind of holder above holds, so a test that finds none fails. */
const COUNT = { in: 16, piece: 9 } as const;

/** Draws the page in a theme with the dialog open and nothing under the pointer. */
const open = async (page: Page, theme: 'light' | 'dark') => {
    await writePage(page, { theme, title: 'Links', body: BODY });
    await page.locator('dialog').evaluate((dialog: HTMLDialogElement) => dialog.showModal());
    await page.mouse.move(0, 0);
};

/**
 * Each link, named by its place and its words, with its line, that line's color at rest and the
 * ground it is drawn on.
 */
const lines = async (page: Page, kind: 'in' | 'piece') => {
    const found = new Map<string, { line: string; color: string; ground: string }>();
    for (const holder of await page.locator(`[data-${kind}]`).all()) {
        const place = (await holder.getAttribute(`data-${kind}`)) ?? '';
        for (const link of await holder.locator('a').all()) {
            const drawn = await style(link, 'text-decoration-line', 'text-decoration-color');
            found.set(`${place}, ${(await link.innerText()).trim()}`, {
                line: drawn['text-decoration-line'] ?? '',
                color: drawn['text-decoration-color'] ?? '',
                ground: await groundOf(link),
            });
        }
    }
    expect(found.size, kind).toBe(COUNT[kind]);
    return found;
};

/**
 * Each link in running text underlined, the line at 3 to 1 against its ground, the ratio a mark
 * that is not text takes, and no piece that is a link.
 */
const holdsEach = async (page: Page) => {
    for (const [where, { line, color, ground }] of await lines(page, 'in')) {
        expect(line, where).toBe('underline');
        expect(contrast(color, ground), `${where}, ${color} on ${ground}`).toBeGreaterThanOrEqual(
            3
        );
    }
    for (const [what, { line }] of await lines(page, 'piece')) expect(line, what).toBe('none');
};

for (const theme of ['light', 'dark'] as const)
    test(`underlines a link in running text at rest, and no piece that is a link, in the ${theme} theme`, async ({
        page,
    }) => {
        await open(page, theme);
        await holdsEach(page);
    });

test('underlines a link in running text in forced colors, and no piece that is a link', async ({
    page,
}) => {
    await forceColors(page);
    await open(page, 'light');
    await holdsEach(page);
});
