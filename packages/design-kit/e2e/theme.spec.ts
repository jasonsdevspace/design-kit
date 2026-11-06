import { type BrowserContext, expect, type Page, test } from '@playwright/test';

import { THEME_KEY, themeScript } from '../src/theme.js';

/*
 * The theme script as a visitor's browser runs it: the theme the portfolio saved, or the system's
 * when nothing usable is saved, set on the root before anything paints, and again when the
 * system's changes or the portfolio saves a choice in another tab. The page is served from an
 * origin of its own, so the script has a real localStorage to read, shared by every tab.
 */

const ORIGIN = 'https://kit.test';
const PAGE = `<!doctype html><html lang="en"><head><script>${themeScript}</script></head><body></body></html>`;

/** A tab on the test origin, with the page given served from memory. */
const tab = async (context: BrowserContext, body = PAGE): Promise<Page> => {
    await context.route(`${ORIGIN}/**`, (route) =>
        route.fulfill({ body, contentType: 'text/html' })
    );
    const page = await context.newPage();
    await page.goto(`${ORIGIN}/`);
    return page;
};

const themeOf = (page: Page) =>
    page.evaluate(() => document.documentElement.getAttribute('data-theme'));

/** A page whose visitor saved the value given before it loaded, or saved nothing. */
const savedThen = async (context: BrowserContext, saved: string | null) => {
    await context.addInitScript(
        ([key, value]) => {
            if (value === null) localStorage.removeItem(key);
            else localStorage.setItem(key, value);
        },
        [THEME_KEY, saved] as const
    );
    return tab(context);
};

for (const system of ['light', 'dark'] as const) {
    test(`draws the saved theme whatever the system, here ${system}`, async ({ browser }) => {
        for (const saved of ['light', 'dark']) {
            const context = await browser.newContext({ colorScheme: system });
            expect(await themeOf(await savedThen(context, saved))).toBe(saved);
            await context.close();
        }
    });

    test(`follows a system set to ${system} when nothing usable is saved`, async ({ browser }) => {
        // The portfolio saves "system" for a visitor who chose to follow it.
        for (const saved of [null, 'system', 'sepia']) {
            const context = await browser.newContext({ colorScheme: system });
            expect(await themeOf(await savedThen(context, saved))).toBe(system);
            await context.close();
        }
    });
}

test('sets the theme before the body is parsed', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await tab(
        context,
        PAGE.replace(
            '<body></body>',
            '<body><script>window.seen = document.documentElement.dataset.theme</script></body>'
        )
    );
    expect(await page.evaluate(() => (window as { seen?: string }).seen)).toBe('dark');
    await context.close();
});

test('follows the system when it changes, while nothing is saved', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    const page = await savedThen(context, null);
    expect(await themeOf(page)).toBe('light');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(() => themeOf(page)).toBe('dark');
    await context.close();
});

test('takes a choice the portfolio saves in another tab', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    const demo = await tab(context);
    const portfolio = await context.newPage();
    await portfolio.goto(`${ORIGIN}/`);
    await portfolio.evaluate((key) => localStorage.setItem(key, 'dark'), THEME_KEY);
    await expect.poll(() => themeOf(demo)).toBe('dark');
    // As when the visitor goes back to following the system there.
    await portfolio.evaluate((key) => localStorage.setItem(key, 'system'), THEME_KEY);
    await expect.poll(() => themeOf(demo)).toBe('light');
    await portfolio.evaluate((key) => localStorage.setItem(key, 'dark'), THEME_KEY);
    await expect.poll(() => themeOf(demo)).toBe('dark');
    // Cleared there, which another tab hears as a storage event with no key.
    await portfolio.evaluate(() => localStorage.clear());
    await expect.poll(() => themeOf(demo)).toBe('light');
    await context.close();
});

test('follows the system where the browser refuses the page its storage', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    await context.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', {
            get: () => {
                throw new DOMException('refused', 'SecurityError');
            },
        });
    });
    expect(await themeOf(await tab(context))).toBe('dark');
    await context.close();
});

for (const [how, takeAway] of [
    ['has no matchMedia', 'missing'],
    ['throws from matchMedia', 'throwing'],
] as const) {
    test(`draws light, or the saved theme, where the browser ${how}`, async ({ browser }) => {
        for (const [saved, expected] of [
            [null, 'light'],
            ['dark', 'dark'],
        ] as const) {
            const context = await browser.newContext({ colorScheme: 'dark' });
            await context.addInitScript((kind) => {
                Object.defineProperty(window, 'matchMedia', {
                    value:
                        kind === 'missing'
                            ? undefined
                            : () => {
                                  throw new Error('no media queries');
                              },
                });
            }, takeAway);
            expect(await themeOf(await savedThen(context, saved))).toBe(expected);
            await context.close();
        }
    });
}

test('still takes a choice saved in another tab where the browser has no matchMedia', async ({
    browser,
}) => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
        Object.defineProperty(window, 'matchMedia', { value: undefined });
    });
    const demo = await tab(context);
    const portfolio = await context.newPage();
    await portfolio.goto(`${ORIGIN}/`);
    await portfolio.evaluate((key) => localStorage.setItem(key, 'dark'), THEME_KEY);
    await expect.poll(() => themeOf(demo)).toBe('dark');
    await context.close();
});
