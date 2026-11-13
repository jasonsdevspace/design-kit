import { expect, type Locator, type Page, test } from '@playwright/test';

import { box, js, KIT, ORIGIN, tabKey } from './page.js';

/*
 * What the keyboard reaches in a table's frame, in Chromium and in WebKit: a link cut by the
 * frame's end edge, or hidden under a pinned column wider than the room the frame keeps for it,
 * brought fully into view once the table is attached, in a table that reads right to left too, a
 * link cut by no more than a target's width brought into view by the frame's own room without any
 * script, and the frame attached once and let go again.
 */

/** Each frame attached through itself and again through its table, which attaches it once. */
const ATTACH = `import { attachTable } from './controls.js';
const frame = document.querySelector('.dk-table-scroll');
attachTable(frame);
window.detach = attachTable(frame.querySelector('table'));
window.attachTable = attachTable;
window.ready = true;`;

const ROUNDS = 12;

/** A row of rounds, each a link that edits it, kept on one line, after the player's name. */
const table = (
    player: string,
    wide: boolean
): string => `<p class="dk-table-title" id="scores">Scores</p>
<div class="dk-table-scroll" role="region" aria-labelledby="scores" tabindex="0">
<table class="dk-table dk-table-pinned" aria-labelledby="scores">
<thead><tr><th scope="col">Player</th>${Array.from(
    { length: ROUNDS },
    (_, round) => `<th scope="col">Round ${String(round + 1)}</th>`
).join('')}</tr></thead>
<tbody><tr><th scope="row">${player}</th>${Array.from(
    { length: ROUNDS },
    (_, round) =>
        `<td><a href="#r${String(round)}" id="r${String(round)}">Edit&nbsp;round&nbsp;${String(round + 1)}${wide && round === 4 ? '&nbsp;and&nbsp;every&nbsp;score&nbsp;each&nbsp;player&nbsp;made&nbsp;in&nbsp;it' : ''}</a></td>`
).join('')}</tr></tbody></table></div>`;

const open = async (
    page: Page,
    {
        attach = true,
        dir = 'ltr',
        player = 'Ana',
        wide = false,
        css = '',
        theme = 'light',
    }: {
        readonly attach?: boolean;
        readonly dir?: 'ltr' | 'rtl';
        readonly player?: string;
        readonly wide?: boolean;
        readonly css?: string;
        readonly theme?: 'light' | 'dark';
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
            `<!doctype html><html lang="en" dir="${dir}" data-theme="${theme}"><head>` +
                `<title>Scores</title><link rel="stylesheet" href="/kit.css"></head><body>` +
                `<main><h1>Scores</h1>${table(player, wide)}</main>` +
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
    // Up to a target's width showing, the frame's own room brings it in, and past that the script.
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
    test.skip(
        browserName !== 'chromium',
        'Safari brings in a link with this little showing on its own'
    );
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

/** Whether the link's first words show: the point just inside its start is the link's own. */
const startShows = (page: Page, round: number): Promise<boolean> =>
    link(page, round).evaluate((reached) => {
        const drawn = reached.getBoundingClientRect();
        const rtl = getComputedStyle(reached).direction === 'rtl';
        const x = rtl ? drawn.right - 2 : drawn.left + 2;
        return document.elementFromPoint(x, drawn.top + drawn.height / 2)?.closest('a') === reached;
    });

test('shows the first words of a link wider than the room, either way a table reads', async ({
    page,
    browserName,
}) => {
    for (const dir of ['ltr', 'rtl'] as const) {
        await open(page, { dir, wide: true });
        await cut(page, 4, 8, 'end');
        await link(page, 3).focus();
        await page.keyboard.press(tabKey(browserName));
        await expect(link(page, 4)).toBeFocused();
        const { from, to } = await room(page);
        expect((await box(link(page, 4), 'the link')).width, dir).toBeGreaterThan(to - from);
        expect(await startShows(page, 4), dir).toBe(true);
    }
});

test('leaves a link a pointer presses to the browser, and the press lands', async ({ page }) => {
    await open(page);
    await cut(page, 4, 8, 'end');
    const drawn = await box(link(page, 4), 'the link');
    await page.mouse.click(drawn.x + 4, drawn.y + drawn.height / 2);
    await expect(page).toHaveURL(/#r4$/);
});

test('refuses an element that is in no frame, rather than attach nothing', async ({ page }) => {
    await open(page);
    const refused = await page.evaluate(() => {
        try {
            (window as unknown as { attachTable: (element: Element) => void }).attachTable(
                document.querySelector('h1') ?? document.body
            );
            return '';
        } catch (error) {
            return String(error);
        }
    });
    expect(refused).toContain('a table needs its frame');
});

test('moves the frame once a step, where the browser would leave it, under a narrow pinned column', async ({
    page,
    browserName,
}) => {
    // A short name leaves the pinned column narrower than the room the frame keeps for it.
    await open(page);
    await cut(page, 5, 12, 'start');
    await link(page, 6).focus();
    // Where the frame stands once focus has landed and the table has had its say, and then once
    // the browser has drawn it.
    await page.evaluate(() => {
        const scroller = document.querySelector('.dk-table-scroll');
        const steps: number[] = [];
        (window as unknown as { steps: number[] }).steps = steps;
        window.addEventListener('focusin', () => {
            steps.push(scroller?.scrollLeft ?? 0);
            requestAnimationFrame(() =>
                requestAnimationFrame(() => steps.push(scroller?.scrollLeft ?? 0))
            );
        });
    });
    await page.keyboard.press(`Shift+${tabKey(browserName)}`);
    await expect(link(page, 5)).toBeFocused();
    await expect
        .poll(() => page.evaluate(() => (window as unknown as { steps: number[] }).steps.length))
        .toBe(2);
    const [landed, drawn] = await page.evaluate(
        () => (window as unknown as { steps: number[] }).steps
    );
    // Chromium scrolls before focus lands, so only a second move after it counts.
    expect(drawn).toBe(landed);
    expect(await whole(page, 5)).toBe(true);
});

/** The pinned column scrolling with the rest, so the start's shade is in sight. */
const UNPINNED = '.dk-table-pinned :is(th, td):first-child { position: static; }';

/**
 * How far the frame's color strays from its ground at one edge, 2px in from the side given, in
 * the padding above the first row's text, read from what the browser drew.
 */
const shadeAt = async (page: Page, side: 'left' | 'right'): Promise<number> => {
    const drawn = await box(frame(page), 'the frame');
    const row = await box(page.locator('tbody tr').first(), 'the first row');
    const x = side === 'left' ? drawn.x + 2 : drawn.x + drawn.width - 3;
    const shot = await page.screenshot({ clip: { x, y: row.y + 2, width: 1, height: 1 } });
    const [ground, at] = await page.evaluate(async (png) => {
        const image = new Image();
        image.src = `data:image/png;base64,${png}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const drawing = canvas.getContext('2d');
        drawing?.drawImage(image, 0, 0);
        const pixel = [...(drawing?.getImageData(0, 0, 1, 1).data ?? [])].slice(0, 3);
        const probe = document.createElement('span');
        probe.style.color = 'var(--dk-bg)';
        document.body.append(probe);
        const bg = (getComputedStyle(probe).color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
        probe.remove();
        return [bg, pixel];
    }, shot.toString('base64'));
    return Math.max(...at.map((value, index) => Math.abs(value - (ground[index] ?? 0))));
};

const scrollTo = (page: Page, where: 'start' | 'middle' | 'end'): Promise<void> =>
    frame(page).evaluate((element, to) => {
        const room = element.scrollWidth - element.clientWidth;
        const along = to === 'start' ? 0 : to === 'end' ? room : room / 2;
        element.scrollLeft = getComputedStyle(element).direction === 'rtl' ? -along : along;
    }, where);

test('shades the edges a frame scrolls toward, and neither end once it is in view', async ({
    page,
}) => {
    for (const theme of ['light', 'dark'] as const) {
        await open(page, { css: UNPINNED, theme });
        expect(await shadeAt(page, 'left'), `${theme} at the start`).toBeLessThan(4);
        expect(await shadeAt(page, 'right'), `${theme} at the start`).toBeGreaterThan(12);
        await scrollTo(page, 'middle');
        expect(await shadeAt(page, 'left'), `${theme} in the middle`).toBeGreaterThan(12);
        expect(await shadeAt(page, 'right'), `${theme} in the middle`).toBeGreaterThan(12);
        await scrollTo(page, 'end');
        expect(await shadeAt(page, 'left'), `${theme} at the end`).toBeGreaterThan(12);
        expect(await shadeAt(page, 'right'), `${theme} at the end`).toBeLessThan(4);
    }
});

test('shades no edge of a frame whose table fits, one that reads right to left, or any in forced colors', async ({
    page,
}) => {
    await open(page, {
        css: `${UNPINNED} .dk-table :is(th, td):nth-child(n + 3) { display: none; }`,
    });
    expect(await shadeAt(page, 'left')).toBeLessThan(4);
    expect(await shadeAt(page, 'right')).toBeLessThan(4);
    await open(page, { css: UNPINNED, dir: 'rtl' });
    await scrollTo(page, 'middle');
    expect(await shadeAt(page, 'left'), 'right to left').toBeLessThan(4);
    expect(await shadeAt(page, 'right'), 'right to left').toBeLessThan(4);
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page, { css: UNPINNED });
    await scrollTo(page, 'middle');
    const left = await shadeAt(page, 'left');
    const right = await shadeAt(page, 'right');
    expect(Math.abs(left - right)).toBeLessThan(4);
    expect(await frame(page).evaluate((element) => getComputedStyle(element).backgroundImage)).toBe(
        'none'
    );
});
