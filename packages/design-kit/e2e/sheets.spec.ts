import { readFileSync } from 'node:fs';

import { expect, type Page, test } from '@playwright/test';

/*
 * The tokens and the base as a browser draws them: the theme a page saved, or the system's when it
 * saved none, picks the page's background and text, a demo's own palette and rules win over the
 * kit's wherever its sheets load, the order of a page's own layers places the kit's, and the focus
 * ring lands where it should in both themes.
 */

const sheet = (name: string) => readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8');
const KIT = `${sheet('tokens.css')}\n${sheet('base.css')}`;

/**
 * A page with the theme given saved on its root, the markup given, and the demo's own rules loaded
 * before the kit unless they say after. Before is the harder case for the demo outside a layer,
 * where a tie of weight would go to whichever sheet comes later.
 */
const open = async (
    page: Page,
    saved: 'light' | 'dark' | null,
    body = '',
    own: string | { readonly css: string; readonly loads: 'before' | 'after' } = ''
) => {
    const { css, loads } = typeof own === 'string' ? { css: own, loads: 'before' } : own;
    const theme = saved ? ` data-theme="${saved}"` : '';
    const styles = loads === 'before' ? `${css}${KIT}` : `${KIT}${css}`;
    await page.setContent(
        `<!doctype html><html lang="en"${theme}><head><style>${styles}</style></head>` +
            `<body>${body}</body></html>`
    );
};

const drawn = (page: Page) =>
    page.evaluate(() => {
        const style = getComputedStyle(document.body);
        return { background: style.backgroundColor, color: style.color };
    });

const LIGHT = { background: 'rgb(255, 255, 255)', color: 'rgb(26, 26, 26)' };
const DARK = { background: 'rgb(18, 18, 18)', color: 'rgb(240, 240, 240)' };

for (const system of ['light', 'dark'] as const) {
    test(`follows a system set to ${system} when the page saved no theme`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: system });
        await open(page, null);
        expect(await drawn(page)).toEqual(system === 'light' ? LIGHT : DARK);
    });

    test(`draws the saved theme whatever the system, here ${system}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: system });
        await open(page, 'dark');
        expect(await drawn(page)).toEqual(DARK);
        await open(page, 'light');
        expect(await drawn(page)).toEqual(LIGHT);
    });
}

/**
 * The outline on whatever has focus, and whether the browser would show focus on it, so a missing
 * ring is told apart from focus the browser does not show.
 */
const ring = (page: Page) =>
    page.evaluate(() => {
        const element = document.activeElement ?? document.body;
        const style = getComputedStyle(element);
        return {
            style: style.outlineStyle,
            color: style.outlineColor,
            width: style.outlineWidth,
            visible: element.matches(':focus-visible'),
        };
    });

for (const [theme, accent] of [
    ['light', 'rgb(31, 79, 216)'],
    ['dark', 'rgb(143, 176, 255)'],
] as const) {
    test(`rings a link in the ${theme} accent, and no section a skip link moves focus to`, async ({
        page,
    }) => {
        await open(
            page,
            theme,
            '<a href="#next">Next</a><section id="next" tabindex="-1">Next</section>'
        );
        await page.keyboard.press('Tab');
        expect(await ring(page)).toEqual({
            style: 'solid',
            color: accent,
            width: '2px',
            visible: true,
        });
        // Moved there from the keyboard, as a skip link moves it, so the browser would show focus.
        await page.keyboard.press('Enter');
        await expect(page.locator('#next')).toBeFocused();
        expect(await ring(page)).toMatchObject({ style: 'none', visible: true });
    });
}

test('keeps the ring on a control a roving widget gives a tabindex of -1', async ({ page }) => {
    await open(
        page,
        'light',
        '<div role="tablist"><button role="tab" tabindex="0" aria-selected="true">Markup</button>' +
            '<button role="tab" tabindex="-1">React</button></div>' +
            '<div role="tablist"><div role="tab" tabindex="0" aria-selected="true">One</div>' +
            '<div role="tab" tabindex="-1">Two</div></div>' +
            '<section id="next" tabindex="-1">Next</section>'
    );
    // The page's own script moves focus to the next tab on the right arrow, as a tab strip does.
    await page.evaluate(() => {
        for (const list of document.querySelectorAll('[role="tablist"]')) {
            list.addEventListener('keydown', (event) => {
                if ((event as KeyboardEvent).key !== 'ArrowRight') return;
                const tabs = [...list.querySelectorAll<HTMLElement>('[role="tab"]')];
                const at = tabs.indexOf(document.activeElement as HTMLElement);
                tabs[(at + 1) % tabs.length]?.focus();
            });
        }
    });
    const ringed = { style: 'solid', color: 'rgb(31, 79, 216)', width: '2px', visible: true };
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'React' })).toBeFocused();
    expect(await ring(page), 'a button tab').toEqual(ringed);
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Two' })).toBeFocused();
    expect(await ring(page), 'a div tab').toEqual(ringed);
    // A section with no widget role, moved to the same way, still draws none, though the browser
    // would show focus on it.
    await page.evaluate(() => document.getElementById('next')?.focus());
    await expect(page.locator('#next')).toBeFocused();
    expect(await ring(page), 'a section').toMatchObject({ style: 'none', visible: true });
});

test("takes a demo's own palette whichever sheet loads first", async ({ page }) => {
    await open(
        page,
        'light',
        '<a href="#">Link</a>',
        ':root { --dk-accent: light-dark(#2f5bd3, #7b9cff) }'
    );
    const link = await page.evaluate(
        () => getComputedStyle(document.querySelector('a') ?? document.body).color
    );
    expect(link).toBe('rgb(47, 91, 211)');
});

test("lets a demo's rule on an element win over the kit's, however plain its selector", async ({
    page,
}) => {
    await open(
        page,
        'light',
        '<h2>Title</h2>',
        'body { background: rgb(1, 2, 3) } h2 { font-weight: 800 }'
    );
    expect((await drawn(page)).background).toBe('rgb(1, 2, 3)');
    const weight = await page.evaluate(
        () => getComputedStyle(document.querySelector('h2') ?? document.body).fontWeight
    );
    expect(weight).toBe('800');
});

test('hides a visually hidden label from the eye and keeps it for a screen reader', async ({
    page,
}) => {
    await open(page, 'light', '<button><span class="dk-visually-hidden">Close</span>×</button>');
    await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();
    const box = await page.locator('.dk-visually-hidden').boundingBox();
    expect(box).toMatchObject({ width: 1, height: 1 });
});

const PAGE_LAYER = '@layer page { body { background: rgb(1, 2, 3) } }';

test("lets a page's own layer win when the kit's sheets load first", async ({ page }) => {
    await open(page, 'light', '', { css: PAGE_LAYER, loads: 'after' });
    expect((await drawn(page)).background).toBe('rgb(1, 2, 3)');
});

test('lets a page whose layers load first put its own over the kit by naming dk first', async ({
    page,
}) => {
    await open(page, 'light', '', `@layer dk, page; ${PAGE_LAYER}`);
    expect((await drawn(page)).background).toBe('rgb(1, 2, 3)');
});

test('lets a page whose layers load first put the kit over its own by naming dk last', async ({
    page,
}) => {
    await open(page, 'light', '', `@layer page, dk; ${PAGE_LAYER}`);
    expect((await drawn(page)).background).toBe('rgb(255, 255, 255)');
});

test('puts the kit over a page whose layers load first without naming dk', async ({ page }) => {
    // The hazard the reference warns of: a layer is placed where its name first appears, so the
    // kit's layers land after the page's, and a page meaning its own to win names dk first.
    await open(page, 'light', '', PAGE_LAYER);
    expect((await drawn(page)).background).toBe('rgb(255, 255, 255)');
});

test("lets a page's own rule outside a layer win, however little it weighs", async ({ page }) => {
    for (const loads of ['before', 'after'] as const) {
        await open(page, 'light', '', { css: ':where(body) { background: rgb(1, 2, 3) }', loads });
        expect((await drawn(page)).background).toBe('rgb(1, 2, 3)');
    }
});

for (const theme of ['light', 'dark'] as const) {
    test(`restyles only the container a page sets the tokens on, in the ${theme} theme`, async ({
        page,
    }) => {
        await open(
            page,
            theme,
            '<a id="outside" href="#">Out</a>' +
                '<div class="other"><a id="inside" href="#">In</a></div>',
            '.other { --dk-accent: light-dark(rgb(0, 100, 0), rgb(0, 200, 0)) }'
        );
        const colors = await page.evaluate(() =>
            ['outside', 'inside'].map(
                (id) => getComputedStyle(document.getElementById(id) ?? document.body).color
            )
        );
        expect(colors).toEqual([
            theme === 'light' ? 'rgb(31, 79, 216)' : 'rgb(143, 176, 255)',
            theme === 'light' ? 'rgb(0, 100, 0)' : 'rgb(0, 200, 0)',
        ]);
    });
}

for (const [where, own] of [
    ['outside a layer', '.fade { transition: opacity 2s 1s !important }'],
    [
        'in a layer after the kit',
        '@layer dk, page; @layer page { .fade { transition: opacity 2s 1s !important } }',
    ],
] as const) {
    test(`cuts a page's important transition ${where} for a visitor who wants less motion`, async ({
        page,
    }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await open(page, 'light', '<p class="fade">Fades</p>', own);
        const timing = await page.evaluate(() => {
            const style = getComputedStyle(document.querySelector('.fade') ?? document.body);
            return { duration: style.transitionDuration, delay: style.transitionDelay };
        });
        expect(timing).toEqual({ duration: '1e-05s', delay: '0s' });
    });
}

test("gives a page's ::before and ::after the border box, as every element has", async ({
    page,
}) => {
    await open(
        page,
        'light',
        '<p class="mark">Text</p>',
        '.mark::before, .mark::after { content: "a"; display: inline-block; width: 4rem; padding: 1rem }'
    );
    const sizing = await page.evaluate(() =>
        ['::before', '::after'].map(
            (pseudo) =>
                getComputedStyle(document.querySelector('.mark') ?? document.body, pseudo).boxSizing
        )
    );
    expect(sizing).toEqual(['border-box', 'border-box']);
});

/** A page's motion on each pseudo-element it is likely to animate, written as `own` gives it. */
const PSEUDO_MOTION = (important: string) =>
    `.mark::before, .mark::after, dialog::backdrop { content: "a";` +
    ` transition: opacity 2s 1s${important}; animation: spin 3s infinite${important} }` +
    ' @keyframes spin { to { rotate: 1turn } }';

for (const [where, own] of [
    ['a plain rule', PSEUDO_MOTION('')],
    ['an important rule outside a layer', PSEUDO_MOTION(' !important')],
    [
        'an important rule in a layer after the kit',
        `@layer dk, page; @layer page { ${PSEUDO_MOTION(' !important')} }`,
    ],
] as const) {
    test(`cuts motion on ::before, ::after and ::backdrop from ${where}, for less motion`, async ({
        page,
    }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await open(page, 'light', '<p class="mark">Text</p><dialog>Open</dialog>', own);
        const timing = await page.evaluate(() => {
            document.querySelector('dialog')?.showModal();
            return [
                ['.mark', '::before'],
                ['.mark', '::after'],
                ['dialog', '::backdrop'],
            ].map(([element = '', pseudo]) => {
                const style = getComputedStyle(
                    document.querySelector(element) ?? document.body,
                    pseudo
                );
                return [
                    style.transitionDuration,
                    style.transitionDelay,
                    style.animationIterationCount,
                ];
            });
        });
        expect(timing).toEqual([
            ['1e-05s', '0s', '1'],
            ['1e-05s', '0s', '1'],
            ['1e-05s', '0s', '1'],
        ]);
    });
}

test("cuts a page's view transition short for a visitor who wants less motion", async ({
    page,
}) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(
        page,
        'light',
        '<p>Text</p>',
        '::view-transition-group(root) { animation-duration: 2s }'
    );
    const duration = await page.evaluate(async () => {
        const transition = document.startViewTransition(() => undefined);
        await transition.ready;
        const read = getComputedStyle(
            document.documentElement,
            '::view-transition-group(root)'
        ).animationDuration;
        await transition.finished;
        return read;
    });
    expect(duration).toBe('1e-05s');
});

test('shows a pointer on what takes a click, and the arrow on a choice that is unavailable', async ({
    page,
}) => {
    await open(
        page,
        'light',
        '<details><summary>More</summary><p>Text</p></details>' +
            '<label id="radio"><input type="radio" name="t"> Light</label>' +
            '<label id="box"><input type="checkbox"> Members</label>' +
            '<label id="off"><input type="checkbox" disabled> Closed</label>' +
            '<label id="text" for="name">Name</label><input id="name">'
    );
    const cursor = (selector: string) =>
        page.locator(selector).evaluate((element) => getComputedStyle(element).cursor);
    expect(await cursor('summary')).toBe('pointer');
    expect(await cursor('#radio')).toBe('pointer');
    expect(await cursor('#box')).toBe('pointer');
    expect(await cursor('#off')).toBe('default');
    // A label for a text field only moves focus to it, so it keeps the browser's own cursor.
    expect(await cursor('#text')).not.toBe('pointer');
});
