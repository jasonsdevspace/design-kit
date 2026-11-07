import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { ROUTES } from '../src/routes.js';

/*
 * The built site as a visitor gets it, from the preview the Playwright config serves under the
 * path GitHub Pages gives it: every page with no audit findings in either theme on a phone and a
 * wide screen, no sideways scroll at any width or at twice the text size, no text cut off under the
 * wider spacing a reader may set, one of each landmark and no id twice, and nothing the page's
 * policy refuses, the theme script included. Every page in the site's routes is checked, so a page
 * added to them is held to all of it.
 */

/** Each page, as the path a visitor asks for. */
const PAGES = ROUTES.map(({ path }) => path);

/** The widths of a small phone, a phone, a tablet and a laptop. */
const WIDTHS = [320, 390, 768, 1280] as const;

/** The visitor's own text size, as the browser's setting sets it, which every rem is drawn from. */
const textSize = async (page: Page, scale: number) => {
    const session = await page.context().newCDPSession(page);
    await session.send('Page.setFontSizes', {
        fontSizes: { standard: Math.round(16 * scale), fixed: Math.round(13 * scale) },
    });
    await session.detach();
};

/** How far the page itself scrolls sideways, which is nothing when it reflows. */
const sideways = (page: Page) =>
    page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );

/**
 * The elements whose text runs past a box that hides what overflows, skipping a frame that scrolls
 * on purpose, which the keyboard reaches, and anything clipped to nothing until it takes focus.
 */
const clipped = (page: Page) =>
    page.evaluate(() =>
        [...document.body.querySelectorAll<HTMLElement>('*')]
            .filter((element) => {
                const style = getComputedStyle(element);
                const hides = [style.overflowX, style.overflowY].some(
                    (value) => value === 'hidden' || value === 'clip'
                );
                const frame = element.matches('[role="region"][tabindex="0"]');
                const hiddenOnPurpose = element.offsetWidth <= 1 || element.offsetHeight <= 1;
                return (
                    hides &&
                    !frame &&
                    !hiddenOnPurpose &&
                    (element.scrollWidth > element.clientWidth + 1 ||
                        element.scrollHeight > element.clientHeight + 1)
                );
            })
            .map((element) => element.outerHTML.slice(0, 80))
    );

for (const path of PAGES) {
    test(`${path} has no audit findings in either theme, on a phone and a wide screen`, async ({
        page,
    }) => {
        for (const colorScheme of ['light', 'dark'] as const) {
            await page.emulateMedia({ colorScheme });
            for (const width of [390, 1280]) {
                await page.setViewportSize({ width, height: 900 });
                await page.goto(path);
                await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
                const results = await new AxeBuilder({ page }).analyze();
                expect(
                    results.violations.map((violation) => violation.id),
                    `${colorScheme} at ${String(width)}`
                ).toEqual([]);
            }
        }
    });

    test(`${path} never scrolls sideways, at any width or at twice the text size`, async ({
        page,
    }) => {
        for (const scale of [1, 2]) {
            await textSize(page, scale);
            for (const width of WIDTHS) {
                await page.setViewportSize({ width, height: 900 });
                await page.goto(path);
                expect(await sideways(page), `${String(width)} at text ${String(scale)}`).toBe(0);
            }
        }
    });

    test.describe(() => {
        // The spacing a reader may set is a sheet of their own, which the page's policy would
        // refuse, so the policy is set aside for this test alone, as a reader's extension is.
        test.use({ bypassCSP: true });

        test(`${path} cuts no text off under the wider spacing a reader may set`, async ({
            page,
        }) => {
            for (const width of WIDTHS) {
                await page.setViewportSize({ width, height: 900 });
                await page.goto(path);
                await page.addStyleTag({
                    content:
                        '* { line-height: 1.5 !important; letter-spacing: 0.12em !important;' +
                        ' word-spacing: 0.16em !important; }' +
                        ' p { margin-bottom: 2em !important; }',
                });
                expect(await clipped(page), String(width)).toEqual([]);
                expect(await sideways(page), String(width)).toBe(0);
            }
        });
    });

    test(`${path} keeps the keyboard out of every copy in the other theme`, async ({ page }) => {
        await page.goto(path);
        const stops = await page.locator('a, button, input, select, textarea, [tabindex]').count();
        for (let stop = 0; stop <= stops; stop += 1) {
            await page.keyboard.press('Tab');
            const inside = await page.evaluate(
                () => document.activeElement?.closest('[inert]') !== null
            );
            expect(inside, `tab stop ${String(stop + 1)}`).toBe(false);
        }
    });

    test(`${path} draws each copy in the other theme in the scheme the page is not in`, async ({
        page,
    }) => {
        for (const colorScheme of ['light', 'dark'] as const) {
            await page.emulateMedia({ colorScheme });
            await page.goto(path);
            // What is drawn, not only the scheme asked for: each copy's ground and text are the
            // other theme's, which differ from the page's own.
            const drawn = await page.evaluate(() => {
                const ground = getComputedStyle(document.body);
                return [...document.querySelectorAll('.site-other')].map((copy) => {
                    const style = getComputedStyle(copy);
                    return (
                        style.backgroundColor !== ground.backgroundColor &&
                        style.color !== ground.color
                    );
                });
            });
            expect(drawn.every(Boolean), colorScheme).toBe(true);
            const inert = await page
                .locator('.site-other')
                .evaluateAll((copies) => copies.every((copy) => copy.hasAttribute('inert')));
            expect(inert).toBe(true);
        }
    });

    test(`${path} has one of each landmark and no id twice`, async ({ page }) => {
        await page.goto(path);
        await expect(page.getByRole('main')).toHaveCount(1);
        await expect(page.getByRole('contentinfo')).toHaveCount(1);
        await expect(page.getByRole('navigation', { name: 'Portfolio' })).toHaveCount(1);
        expect(await page.getByRole('banner').count()).toBeLessThanOrEqual(1);
        const ids = await page.evaluate(() =>
            [...document.querySelectorAll('[id]')].map((element) => element.id)
        );
        expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
    });

    test(`${path} loads with nothing its policy refuses, and the theme script runs`, async ({
        page,
    }) => {
        const refused: string[] = [];
        page.on('console', (message) => {
            if (/Content Security Policy/i.test(message.text())) refused.push(message.text());
        });
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.goto(path);
        // The script sets the theme only when the policy lets it run, so the theme proves its hash.
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        const policy = await page
            .locator('meta[http-equiv="Content-Security-Policy"]')
            .getAttribute('content');
        expect(policy).toContain("style-src 'self'");
        expect(await page.locator('[style]').count()).toBe(0);
        expect(refused).toEqual([]);
    });
}
