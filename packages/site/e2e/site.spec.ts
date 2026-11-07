import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { ROUTES } from '../src/routes.js';

/*
 * The built site as a visitor gets it, from the preview the Playwright config serves under the path
 * GitHub Pages gives it: every page with no audit findings in either theme on a phone and a wide
 * screen, no sideways scroll at any width or at twice the text size, no text cut off under the
 * wider spacing a reader may set, one main, one footer and one portfolio navigation outside the
 * inert copies, no id twice, and nothing the page's policy refuses, the theme script included.
 * Every page in the site's routes is checked, so a page added to them is held to all of it.
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

    test.describe(() => {
        // With no script, the theme script never sets a theme, and the page follows the system.
        test.use({ javaScriptEnabled: false });

        test(`${path} draws each copy in the other theme with no script too`, async ({ page }) => {
            for (const colorScheme of ['light', 'dark'] as const) {
                await page.emulateMedia({ colorScheme });
                await page.goto(path);
                await expect(page.locator('html')).not.toHaveAttribute('data-theme');
                const drawn = await page.evaluate(() => {
                    const ground = getComputedStyle(document.body).backgroundColor;
                    return [...document.querySelectorAll('.site-other')].every(
                        (copy) => getComputedStyle(copy).backgroundColor !== ground
                    );
                });
                expect(drawn, colorScheme).toBe(true);
            }
        });
    });

    test(`${path} draws each state with the attribute printed under it`, async ({ page }) => {
        await page.goto(path);
        const missing = await page.evaluate(() =>
            [...document.querySelectorAll('.site-state')].flatMap((state) => {
                const attribute = state.querySelector('.site-state-name code')?.textContent ?? '';
                const live = state.querySelector('.site-copy:not(.site-other)');
                return live?.querySelector(`[${attribute}]`) ? [] : [attribute];
            })
        );
        expect(missing).toEqual([]);
    });

    test(`${path} has one of each landmark and no id twice`, async ({ page }) => {
        await page.goto(path);
        // Playwright finds a role inside an inert copy, which the browser leaves out of what a
        // screen reader is given, so only the landmarks outside every copy are counted.
        const landmarks = (role: 'banner' | 'contentinfo' | 'main' | 'navigation', name?: string) =>
            page
                .getByRole(role, name === undefined ? {} : { name })
                .evaluateAll(
                    (all) => all.filter((each) => each.closest('[inert]') === null).length
                );
        expect(await landmarks('main')).toBe(1);
        expect(await landmarks('contentinfo')).toBe(1);
        expect(await landmarks('navigation', 'Portfolio')).toBe(1);
        expect(await landmarks('banner')).toBeLessThanOrEqual(1);
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

test.describe('the tokens page', () => {
    test('draws each swatch in the value printed beside it, in its column’s theme', async ({
        page,
    }) => {
        for (const colorScheme of ['light', 'dark'] as const) {
            await page.emulateMedia({ colorScheme });
            await page.goto('/design-kit/tokens/');
            const wrong = await page.evaluate(() => {
                const hex = (rgb: string) =>
                    `#${(rgb.match(/\d+/g) ?? [])
                        .slice(0, 3)
                        .map((channel) => Number(channel).toString(16).padStart(2, '0'))
                        .join('')}`;
                return [...document.querySelectorAll('.site-swatch')].flatMap((swatch) => {
                    const printed = swatch.nextElementSibling?.textContent ?? '';
                    const drawn = hex(getComputedStyle(swatch).backgroundColor);
                    return drawn === printed.toLowerCase() ? [] : [`${printed} drawn as ${drawn}`];
                });
            });
            expect(wrong, colorScheme).toEqual([]);
        }
    });

    test('lists every pairing at or above what it needs, the tightest first', async ({ page }) => {
        await page.goto('/design-kit/tokens/');
        const rows = await page
            .getByRole('table', { name: 'The contrast of every pairing, the tightest first' })
            .locator('tbody tr')
            .evaluateAll((trs) =>
                trs.map((tr) =>
                    [...tr.querySelectorAll('td.dk-table-number')].map((cell) =>
                        Number.parseFloat(cell.textContent)
                    )
                )
            );
        expect(rows.length).toBeGreaterThan(0);
        const margins = rows.map(([needs = 0, ...ratios]) => Math.min(...ratios) / needs);
        expect(margins.every((margin) => margin >= 1)).toBe(true);
        expect(margins).toEqual([...margins].sort((a, b) => a - b));
    });
});

test.describe('the page chrome page', () => {
    test("draws the kit's chrome live around the page, and each state only as a picture", async ({
        page,
    }) => {
        await page.goto('/design-kit/page-chrome/');
        // The page's own skip link, strip and footer are the live ones.
        await page.keyboard.press('Tab');
        await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
        await expect(page.locator('body > .dk-strip, body > .dk-footer')).toHaveCount(2);
        const copies = page.locator('.site-copy');
        expect(await copies.count()).toBeGreaterThan(0);
        expect(
            await copies.evaluateAll((all) =>
                all
                    .filter((copy) => !copy.hasAttribute('inert'))
                    .map((copy) => copy.textContent.slice(0, 60))
            )
        ).toEqual([]);
    });
});

test.describe('the controls page', () => {
    test('draws a live copy of every state', async ({ page }) => {
        await page.goto('/design-kit/controls/');
        const states = await page.locator('.site-state').count();
        expect(states).toBeGreaterThan(0);
        await expect(page.locator('.site-state > .site-copy:not([inert])')).toHaveCount(states);
    });
});

test.describe('the explainer pieces page', () => {
    test("draws each piece live, and the explainer's layout as a picture", async ({ page }) => {
        await page.goto('/design-kit/explainer-pieces/');
        const live = page.locator('.site-copy:not([inert])');
        await expect(live.locator('.dk-steps')).toHaveCount(1);
        await expect(live.locator('.dk-panel')).toHaveCount(1);
        await expect(
            live.getByRole('table', { name: 'Orders a second under each strategy' })
        ).toBeVisible();
        await expect(
            live.getByRole('region', { name: 'The statement that holds the stock' })
        ).toBeVisible();
        await expect(live.locator('.dk-explainer')).toHaveCount(0);
        await expect(page.locator('.site-copy[inert] .dk-explainer')).toHaveCount(2);
    });
});

test('every link within the site leads to one of its pages, and to an id on it', async ({
    page,
}) => {
    const broken: string[] = [];
    for (const path of PAGES) {
        await page.goto(path);
        const links = await page
            .locator('a[href]')
            .evaluateAll((all) =>
                all
                    .filter((link) => link.closest('[inert]') === null)
                    .map((link) => (link as HTMLAnchorElement).href)
            );
        const own = new URL(page.url()).origin;
        for (const href of new Set(links)) {
            const url = new URL(href);
            if (url.origin !== own) continue;
            if (!(PAGES as readonly string[]).includes(url.pathname)) {
                broken.push(`${path}: ${href}`);
                continue;
            }
            if (url.hash === '') continue;
            await page.goto(href);
            if ((await page.locator(url.hash).count()) !== 1) broken.push(`${path}: ${href}`);
            await page.goto(path);
        }
    }
    expect(broken).toEqual([]);
});

test.describe('the explainer', () => {
    test('marks itself the current page in the strip and the footer, and leads back to the site', async ({
        page,
    }) => {
        await page.goto('/design-kit/how-it-works/');
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(
            'How the design kit works'
        );
        for (const landmark of [
            page.getByRole('navigation', { name: 'Portfolio' }),
            page.getByRole('contentinfo'),
        ]) {
            await expect(landmark.getByRole('link', { name: 'How it works' })).toHaveAttribute(
                'aria-current',
                'page'
            );
        }
        await expect(page.getByRole('banner').getByRole('link')).toHaveAttribute(
            'href',
            '/design-kit/'
        );
        await expect(page.locator('main.dk-explainer > section > h2:not([id])')).toHaveCount(0);
    });

    test("is where every other page's strip and footer say how it works", async ({ page }) => {
        for (const path of PAGES.filter((each) => each !== '/design-kit/how-it-works/')) {
            await page.goto(path);
            // The page's own strip and footer, not a picture of them on the page chrome page.
            const links = page
                .locator('body > .dk-strip, body > .dk-footer')
                .getByRole('link', { name: 'How it works' });
            await expect(links, path).toHaveCount(2);
            for (const link of await links.all()) {
                await expect(link, path).toHaveAttribute('href', '/design-kit/how-it-works/');
            }
        }
    });
});
