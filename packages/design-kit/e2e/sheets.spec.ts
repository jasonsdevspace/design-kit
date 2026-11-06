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

for (const [theme, accent] of [
    ['light', 'rgb(31, 79, 216)'],
    ['dark', 'rgb(143, 176, 255)'],
] as const) {
    test(`rings a link in the ${theme} accent, and no section focused by script`, async ({
        page,
    }) => {
        await open(
            page,
            theme,
            '<a href="#next">Next</a><section id="next" tabindex="-1">Next</section>'
        );
        await page.keyboard.press('Tab');
        const ring = () =>
            page.evaluate(() => {
                const style = getComputedStyle(document.activeElement ?? document.body);
                return {
                    style: style.outlineStyle,
                    color: style.outlineColor,
                    width: style.outlineWidth,
                };
            });
        expect(await ring()).toEqual({ style: 'solid', color: accent, width: '2px' });
        // Moved there from the keyboard, as a skip link moves it, so the browser would show focus.
        await page.keyboard.press('Enter');
        await expect(page.locator('#next')).toBeFocused();
        expect((await ring()).style).toBe('none');
    });
}

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
    // The hazard the README warns of: a layer is placed where its name first appears, so the
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
