import { readFileSync } from 'node:fs';

import { expect, type Page, test } from '@playwright/test';

/*
 * The tokens and the base as a browser draws them: the theme a page saved, or the system's when it
 * saved none, picks each color, and a demo's own rule wins over the kit's.
 */

const sheet = (name: string) => readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8');
const KIT = `${sheet('tokens.css')}\n${sheet('base.css')}`;

/**
 * A page with the theme given saved on its root, the markup given, and the kit loaded after the
 * demo's own rules, so a kit rule that won by weight would win here by order too.
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

test('rings a link the keyboard reaches in the accent, and not a section focused by script', async ({
    page,
}) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await open(
        page,
        'light',
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
    const accent = { style: 'solid', color: 'rgb(31, 79, 216)', width: '2px' };
    expect(await ring()).toEqual(accent);
    await page.locator('#next').focus();
    await expect(page.locator('#next')).toBeFocused();
    expect(await ring()).not.toEqual(accent);
});

test("lets a demo's own rule win over the kit's, however plain its selector", async ({ page }) => {
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
