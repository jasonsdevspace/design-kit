import { readFileSync } from 'node:fs';

import { expect, type Locator, type Page, test } from '@playwright/test';
import ts from 'typescript';

import { box, KIT, tabKey } from './page.js';

/*
 * What the keyboard reaches in a table's frame, in Chromium and in WebKit: a link cut by the
 * frame's end edge, or hidden under a pinned column wider than the room the frame keeps for it,
 * brought fully into view once the table is attached, in a table that reads right to left too, a
 * link cut by no more than a target's width brought into view by the frame's own room without any
 * script, and the frame attached once and let go again.
 */

const ORIGIN = 'https://kit.test';

const js = (file: string) =>
    ts.transpileModule(readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
    }).outputText;

/** Each frame attached through itself and again through its table, which attaches it once. */
const ATTACH = `import { attachTable } from './controls.js';
const frame = document.querySelector('.dk-table-scroll');
attachTable(frame);
window.detach = attachTable(frame.querySelector('table'));
window.ready = true;`;

const ROUNDS = 12;

/** A row of rounds, each a link that edits it, kept on one line, after the player's name. */
const table = (player: string): string => `<p class="dk-table-title" id="scores">Scores</p>
<div class="dk-table-scroll" role="region" aria-labelledby="scores" tabindex="0">
<table class="dk-table dk-table-pinned" aria-labelledby="scores">
<thead><tr><th scope="col">Player</th>${Array.from(
    { length: ROUNDS },
    (_, round) => `<th scope="col">Round ${String(round + 1)}</th>`
).join('')}</tr></thead>
<tbody><tr><th scope="row">${player}</th>${Array.from(
    { length: ROUNDS },
    (_, round) =>
        `<td><a href="#r${String(round)}" id="r${String(round)}">Edit&nbsp;round&nbsp;${String(round + 1)}</a></td>`
).join('')}</tr></tbody></table></div>`;

const open = async (
    page: Page,
    {
        attach = true,
        dir = 'ltr',
        player = 'Ana',
        css = '',
    }: {
        readonly attach?: boolean;
        readonly dir?: 'ltr' | 'rtl';
        readonly player?: string;
        readonly css?: string;
    } = {}
): Promise<void> => {
    const files: Readonly<Record<string, readonly [string, string]>> = {
        '/kit.css': [`${KIT}${css}`, 'text/css'],
        '/controls.js': [js('controls.ts'), 'text/javascript'],
        '/theme.js': [js('theme.ts'), 'text/javascript'],
        '/page.js': [ATTACH, 'text/javascript'],
    };
    await page.route(`${ORIGIN}/**`, (route) => {
        const path = new URL(route.request().url()).pathname;
        const [served, contentType] = files[path] ?? [
            `<!doctype html><html lang="en" dir="${dir}" data-theme="light"><head>` +
                `<title>Scores</title><link rel="stylesheet" href="/kit.css"></head><body>` +
                `<main><h1>Scores</h1>${table(player)}</main>` +
                (attach ? '<script type="module" src="/page.js"></script>' : '') +
                '</body></html>',
            'text/html',
        ];
        return route.fulfill({ body: served, contentType });
    });
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto(`${ORIGIN}/`);
    if (attach) await page.waitForFunction(() => 'ready' in window);
};

const frame = (page: Page): Locator => page.getByRole('region', { name: 'Scores' });
const link = (page: Page, round: number): Locator => page.locator(`#r${String(round)}`);

/** Where the frame's room runs, clear of the pinned column, across the page. */
const room = async (page: Page): Promise<{ from: number; to: number }> => {
    const drawn = await box(frame(page), 'the frame');
    const pinned = await box(page.getByRole('rowheader'), 'the pinned cell');
    const width = await frame(page).evaluate((element) => element.clientWidth);
    return pinned.x > drawn.x + width / 2
        ? { from: drawn.x, to: pinned.x }
        : { from: pinned.x + pinned.width, to: drawn.x + width };
};

/** Scrolls the frame so the link shows only so much of itself, past the room's end or start. */
const cut = (page: Page, round: number, shown: number, at: 'end' | 'start'): Promise<void> =>
    page.evaluate(
        ([id, showing, side]) => {
            const scroller = document.querySelector<HTMLElement>('.dk-table-scroll');
            const pinned = document.querySelector('tbody th');
            const reached = document.getElementById(id);
            if (!scroller || !pinned || !reached) return;
            const drawn = reached.getBoundingClientRect();
            const rtl = getComputedStyle(scroller).direction === 'rtl';
            const end = rtl
                ? scroller.getBoundingClientRect().left
                : scroller.getBoundingClientRect().left + scroller.clientWidth;
            const start = rtl
                ? pinned.getBoundingClientRect().left
                : pinned.getBoundingClientRect().right;
            const by =
                side === 'end'
                    ? rtl
                        ? drawn.right - (end + Number(showing))
                        : drawn.left - (end - Number(showing))
                    : rtl
                      ? drawn.left - (start - Number(showing))
                      : drawn.right - (start + Number(showing));
            scroller.scrollLeft += by;
        },
        [`r${String(round)}`, String(shown), at] as const
    );

/** Whether the link stands whole in the frame's room, clear of the pinned column. */
const whole = async (page: Page, round: number): Promise<boolean> => {
    const { from, to } = await room(page);
    const drawn = await box(link(page, round), 'the link');
    return drawn.x >= from - 0.5 && drawn.x + drawn.width <= to + 0.5;
};

test('brings a link the frame cuts off fully into view when the keyboard reaches it', async ({
    page,
    browserName,
}) => {
    await open(page);
    // Wider than a target, so past a target's width showing, only the script brings it in.
    for (const shown of [4, 8, 24, 60]) {
        await cut(page, 4, shown, 'end');
        expect(await whole(page, 4), `${String(shown)}px showing, before`).toBe(false);
        await link(page, 3).focus();
        await page.keyboard.press(tabKey(browserName));
        await expect(link(page, 4)).toBeFocused();
        expect(await whole(page, 4), `${String(shown)}px showing`).toBe(true);
    }
});

test('brings a link out from under a pinned column wider than the room kept for it', async ({
    page,
    browserName,
}) => {
    // A name that makes the column wider than the room the frame keeps for it.
    await open(page, {
        player: 'Annabelle-Ruth',
        css: '.dk-table-scroll { --dk-table-pinned-size: 3rem; }',
    });
    for (const shown of [4, 12, 60]) {
        await cut(page, 5, shown, 'start');
        expect(await whole(page, 5), `${String(shown)}px showing, before`).toBe(false);
        await link(page, 6).focus();
        await page.keyboard.press(`Shift+${tabKey(browserName)}`);
        await expect(link(page, 5)).toBeFocused();
        expect(await whole(page, 5), `${String(shown)}px showing`).toBe(true);
    }
});

test('brings a link into view the same way in a table that reads right to left', async ({
    page,
    browserName,
}) => {
    await open(page, { dir: 'rtl' });
    await cut(page, 4, 60, 'end');
    expect(await whole(page, 4)).toBe(false);
    await link(page, 3).focus();
    await page.keyboard.press(tabKey(browserName));
    await expect(link(page, 4)).toBeFocused();
    expect(await whole(page, 4)).toBe(true);
});

test('brings a link cut by no more than a target into view without script', async ({
    page,
    browserName,
}) => {
    await open(page, { attach: false });
    await cut(page, 4, 8, 'end');
    await link(page, 3).focus();
    await page.keyboard.press(tabKey(browserName));
    await expect(link(page, 4)).toBeFocused();
    expect(await whole(page, 4)).toBe(true);
});

test('lets the frame go, leaving a link under the pinned column to the browser', async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'only Chromium leaves a link partly in view');
    await open(page, {
        player: 'Annabelle-Ruth',
        css: '.dk-table-scroll { --dk-table-pinned-size: 3rem; }',
    });
    await page.evaluate(() => {
        (window as unknown as { detach: () => void }).detach();
    });
    await cut(page, 5, 12, 'start');
    await link(page, 6).focus();
    await page.keyboard.press('Shift+Tab');
    await expect(link(page, 5)).toBeFocused();
    expect(await whole(page, 5)).toBe(false);
});
