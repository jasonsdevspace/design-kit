import { readFileSync } from 'node:fs';

import { expect, type Page, test } from '@playwright/test';

/*
 * The tokens and the base as a browser draws them: the theme a page saved, or the system's when it
 * saved none, picks the page's background and text, a demo's own palette and its rule on an
 * element win over the kit's, and the focus ring lands where it should in both themes.
 */

const sheet = (name: string) => readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8');
const KIT = `${sheet('tokens.css')}\n${sheet('base.css')}`;

/**
 * A page with the theme given saved on its root, the markup given, and the kit loaded after the
 * demo's own rules, so a tie goes to the kit and a demo's rule can only win by weight.
 */
const open = async (page: Page, saved: 'light' | 'dark' | null, body = '', own = '') => {
    const theme = saved ? ` data-theme="${saved}"` : '';
    await page.setContent(
        `<!doctype html><html lang="en"${theme}><head><style>${own}${KIT}</style></head>` +
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

for (const [order, winner] of [
    ['dk, page', 'rgb(1, 2, 3)'],
    ['page, dk', 'rgb(255, 255, 255)'],
] as const) {
    test(`lets a page with layers of its own set where the kit's go, here ${order}`, async ({
        page,
    }) => {
        await open(
            page,
            'light',
            '',
            `@layer ${order}; @layer page { body { background: rgb(1, 2, 3) } }`
        );
        expect((await drawn(page)).background).toBe(winner);
    });
}

test("lets a page's own rule outside a layer win, however little it weighs", async ({ page }) => {
    await open(page, 'light', '', ':where(body) { background: rgb(1, 2, 3) }');
    expect((await drawn(page)).background).toBe('rgb(1, 2, 3)');
});

for (const theme of ['light', 'dark'] as const) {
    test(`restyles only the container a page sets the tokens on, in the ${theme} theme`, async ({
        page,
    }) => {
        await open(
            page,
            theme,
            '<a id="outside" href="#">Out</a><div class="other"><a id="inside" href="#">In</a></div>',
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

test("cuts a page's own transition for a visitor who asks for less motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, 'light', '<p class="fade">Fades</p>', '.fade { transition: opacity 2s 1s }');
    const timing = await page.evaluate(() => {
        const style = getComputedStyle(document.querySelector('.fade') ?? document.body);
        return { duration: style.transitionDuration, delay: style.transitionDelay };
    });
    expect(timing).toEqual({ duration: '1e-05s', delay: '0s' });
});
