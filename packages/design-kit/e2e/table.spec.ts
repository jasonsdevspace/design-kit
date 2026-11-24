import { expect, type Frame, type Locator, type Page, test } from '@playwright/test';

import { box, forceColors, servePage, tabKey } from './page.js';

/*
 * What the keyboard reaches in a table's frame, in Chromium and in WebKit: a link cut by the
 * frame's end edge, or hidden under a pinned column wider than the room the frame keeps for it,
 * brought fully into view once the table is attached, in a table that reads right to left too, a
 * link cut by no more than a target's width brought into view by the frame's own room without any
 * script, the frame attached once and let go again, and a table in a frame of the page's own origin
 * the page attaches.
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
    await page.setViewportSize({ width: 320, height: 700 });
    await servePage(page, {
        title: 'Scores',
        body: `<main><h1>Scores</h1>${table(player, wide)}</main>`,
        script: attach ? ATTACH : undefined,
        theme,
        dir,
        css,
    });
    if (attach) await page.waitForFunction(() => 'ready' in window);
};

/** The page, or a frame of its own origin a table is drawn in. */
type Scope = Page | Frame;

const frame = (page: Scope): Locator => page.getByRole('region', { name: 'Scores' });
const link = (page: Scope, round: number): Locator => page.locator(`#r${String(round)}`);

/** Where the frame's room runs, clear of the pinned column, across the page. */
const room = async (page: Scope): Promise<{ from: number; to: number }> => {
    const drawn = await box(frame(page), 'the frame');
    const pinned = await box(page.getByRole('rowheader'), 'the pinned cell');
    const width = await frame(page).evaluate((element) => element.clientWidth);
    return pinned.x > drawn.x + width / 2
        ? { from: drawn.x, to: pinned.x }
        : { from: pinned.x + pinned.width, to: drawn.x + width };
};

/** Scrolls the frame so the link shows only so much of itself, past the room's end or start. */
const cut = (page: Scope, round: number, shown: number, at: 'end' | 'start'): Promise<void> =>
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
const whole = async (page: Scope, round: number): Promise<boolean> => {
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

test('brings a link out from under a pinned column in a table inside a frame the page attached', async ({
    page,
    browserName,
}) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await servePage(page, {
        title: 'Scores',
        body: '<main><h1>Scores</h1><iframe title="Scores" srcdoc="<!doctype html><title>Frame</title>" style="display: block; width: 100%; height: 400px; border: 0"></iframe></main>',
        script: `import { attachTable } from './controls.js';
const holder = document.querySelector('iframe');
if (holder.contentDocument?.title !== 'Frame')
    await new Promise((loaded) => holder.addEventListener('load', loaded, { once: true }));
const inner = holder.contentDocument;
inner.documentElement.lang = 'en';
inner.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="/kit.css">');
await new Promise((loaded) => inner.querySelector('link').addEventListener('load', loaded, { once: true }));
inner.body.innerHTML = ${JSON.stringify(
            table('Annabelle-Ruth', false)
        )} + '<style>.dk-table-scroll { --dk-table-pinned-size: 3rem; }</style>';
attachTable(inner.querySelector('.dk-table-scroll'));
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    const holder = await page.locator('iframe').elementHandle();
    const scope = await holder.contentFrame();
    if (!scope) throw new Error('expected the frame');
    for (const shown of [4, 12, 60]) {
        await cut(scope, 5, shown, 'start');
        expect(await whole(scope, 5), `${String(shown)}px showing, before`).toBe(false);
        await link(scope, 6).focus();
        await page.keyboard.press(`Shift+${tabKey(browserName)}`);
        await expect(link(scope, 5)).toBeFocused();
        expect(await whole(scope, 5), `${String(shown)}px showing`).toBe(true);
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
 * How far the frame's color at one edge, 2px in from the side given, strays from its color at its
 * middle on the same line, in the padding above the first row's text, where only the ground behind
 * the cells shows, read from what the browser drew.
 */
const shadeAt = async (page: Page, side: 'left' | 'right'): Promise<number> => {
    const drawn = await box(frame(page), 'the frame');
    const row = await box(page.locator('tbody tr').first(), 'the first row');
    const shot = await page.screenshot({
        clip: { x: drawn.x, y: row.y + 2, width: drawn.width, height: 1 },
    });
    const [edge, middle] = await page.evaluate(
        async ([png, left]) => {
            const image = new Image();
            image.src = `data:image/png;base64,${png}`;
            await image.decode();
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = 1;
            const drawing = canvas.getContext('2d');
            drawing?.drawImage(image, 0, 0);
            const at = (x: number) =>
                [...(drawing?.getImageData(x, 0, 1, 1).data ?? [])].slice(0, 3);
            return [at(left ? 2 : image.width - 3), at(Math.round(image.width / 2))];
        },
        [shot.toString('base64'), side === 'left'] as const
    );
    return Math.max(...edge.map((value, index) => Math.abs(value - (middle[index] ?? 0))));
};

const scrollTo = (page: Page, where: 'start' | 'middle' | 'end'): Promise<void> =>
    frame(page).evaluate((element, to) => {
        const room = element.scrollWidth - element.clientWidth;
        const along = to === 'start' ? 0 : to === 'end' ? room : room / 2;
        element.scrollLeft = getComputedStyle(element).direction === 'rtl' ? -along : along;
    }, where);

/** Whether the browser ties an animation to a scroll, and so draws the shade at all. */
const drawsShade = (page: Page): Promise<boolean> =>
    page.evaluate(() => CSS.supports('animation-timeline: scroll()'));

/** A shade that is there, or none at all where the browser cannot draw one. */
const SHADED = 12;
const NONE = 4;

type Shade = 'shaded' | 'none';

/** What an edge shows: a shade, none, or something between, with the figure read. */
const shadeOf = (value: number): string => {
    if (value > SHADED) return 'shaded';
    return value < NONE ? 'none' : `faint, ${String(value)}`;
};

/**
 * Waits until the frame's start edge and end edge, either way it reads, show what is wanted, and
 * fails where they never do. An animation tied to a scroll can take its new place a frame or more
 * after the scroll, in Firefox above all, so the edges are read again until they reach it.
 */
const expectShades = async (
    page: Page,
    want: { readonly start?: Shade; readonly end?: Shade },
    what = 'the edges',
    dir: 'ltr' | 'rtl' = 'ltr'
): Promise<void> => {
    const [start, end] =
        dir === 'ltr' ? (['left', 'right'] as const) : (['right', 'left'] as const);
    // Two frames first, so an edge the scroll has yet to reach is not read as already at rest, which
    // would let a wanted none pass on the edge as it was before.
    await page.evaluate(
        () =>
            new Promise((done) => {
                requestAnimationFrame(() => requestAnimationFrame(done));
            })
    );
    await expect
        .poll(
            async () => ({
                ...(want.start && { start: shadeOf(await shadeAt(page, start)) }),
                ...(want.end && { end: shadeOf(await shadeAt(page, end)) }),
            }),
            { message: what }
        )
        .toEqual(want);
};

test('shades the edges a frame scrolls toward, and neither end once it is in view', async ({
    page,
}) => {
    for (const theme of ['light', 'dark'] as const) {
        for (const dir of ['ltr', 'rtl'] as const) {
            await open(page, { css: UNPINNED, theme, dir });
            // Where the browser cannot tie an animation to a scroll, no edge is shaded at all.
            const more: Shade = (await drawsShade(page)) ? 'shaded' : 'none';
            const where = `${theme} ${dir}`;
            await expectShades(page, { start: 'none', end: more }, `${where} at the start`, dir);
            await scrollTo(page, 'middle');
            await expectShades(page, { start: more, end: more }, `${where} in the middle`, dir);
            await scrollTo(page, 'end');
            await expectShades(page, { start: more, end: 'none' }, `${where} at the end`, dir);
        }
    }
});

test("hides the start's shade under a pinned column, and shades the end beside it", async ({
    page,
}) => {
    await open(page);
    test.skip(!(await drawsShade(page)), 'the browser draws no shade');
    await scrollTo(page, 'middle');
    await expectShades(page, { start: 'none', end: 'shaded' });
});

test("shades a frame on a ground of its own with no band of the page's ground", async ({
    page,
}) => {
    // The pinned cells take the ground the page sets for them, and the shade needs none.
    await open(page, {
        css: `${UNPINNED} main { --dk-table-ground: var(--dk-highlight); background: var(--dk-highlight); }`,
    });
    test.skip(!(await drawsShade(page)), 'the browser draws no shade');
    await expectShades(page, { start: 'none', end: 'shaded' }, 'at the start');
    await scrollTo(page, 'end');
    await expectShades(page, { end: 'none' }, 'at the end');
});

test('shades the frame for a visitor who asks for less motion too', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, { css: UNPINNED });
    test.skip(!(await drawsShade(page)), 'the browser draws no shade');
    await scrollTo(page, 'middle');
    await expectShades(page, { start: 'shaded', end: 'shaded' });
});

test('shades no edge of a frame whose table fits, nor any in forced colors', async ({ page }) => {
    await open(page, {
        css: `${UNPINNED} .dk-table :is(th, td):nth-child(n + 3) { display: none; }`,
    });
    await expectShades(page, { start: 'none', end: 'none' }, 'a table that fits');
    await forceColors(page);
    await open(page, { css: UNPINNED });
    for (const where of ['start', 'middle'] as const) {
        await scrollTo(page, where);
        await expectShades(
            page,
            { start: 'none', end: 'none' },
            `in forced colors at the ${where}`
        );
    }
});
