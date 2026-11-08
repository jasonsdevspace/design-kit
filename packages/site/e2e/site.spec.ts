import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { ABOUT, ROUTES } from '../src/routes.js';

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
        // The site's own script fills the strip with the switch only when the policy lets it load.
        await expect(page.getByRole('radio', { name: 'System' })).toBeChecked();
        const policy = await page
            .locator('meta[http-equiv="Content-Security-Policy"]')
            .getAttribute('content');
        expect(policy).toContain("style-src 'self'");
        // Scripts from the site's own path, never the whole origin the portfolio and demos share.
        expect(policy).toMatch(/script-src http:\/\/localhost:\d+\/design-kit\/assets\/ 'sha256-/);
        expect(policy).not.toMatch(/script-src[^;]*'self'/);
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
    // Every link outside the inert copies, gathered from every page first, so each page a link
    // leads to is loaded once.
    const targets = new Map<string, Set<string>>();
    const broken: string[] = [];
    for (const path of PAGES) {
        await page.goto(path);
        const own = new URL(page.url()).origin;
        const links = await page
            .locator('a[href]')
            .evaluateAll((all) =>
                all
                    .filter((link) => link.closest('[inert]') === null)
                    .map((link) => (link as HTMLAnchorElement).href)
            );
        for (const href of links) {
            const url = new URL(href);
            if (url.origin !== own) continue;
            if (!(PAGES as readonly string[]).includes(url.pathname)) {
                broken.push(`${path}: ${href}`);
                continue;
            }
            const ids = targets.get(url.pathname) ?? new Set<string>();
            if (url.hash !== '') ids.add(decodeURIComponent(url.hash.slice(1)));
            targets.set(url.pathname, ids);
        }
    }
    for (const [path, ids] of targets) {
        await page.goto(path);
        // An id inside an inert copy is no place a link can take a reader.
        const missing = await page.evaluate(
            (wanted) =>
                // Missing when no element has the id, which gives undefined, or one inside an
                // inert copy has it, which gives that copy. Only a target outside every copy gives
                // null.
                wanted.filter((id) => document.getElementById(id)?.closest('[inert]') !== null),
            [...ids]
        );
        broken.push(...missing.map((id) => `${path}#${id}`));
    }
    expect(broken).toEqual([]);
});

test.describe('the explainer', () => {
    test('marks itself the current page, and leads back to the site', async ({ page }) => {
        await page.goto(ABOUT);
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
        const headings = page.locator('main.dk-explainer > section > h2');
        expect(await headings.count()).toBeGreaterThan(0);
        await expect(headings.and(page.locator(':not([id])'))).toHaveCount(0);
    });

    test("is where every other page's strip and footer say how it works", async ({ page }) => {
        for (const path of PAGES.filter((each) => each !== ABOUT)) {
            await page.goto(path);
            // The page's own strip and footer, not a picture of them on the page chrome page.
            const links = page
                .locator('body > .dk-strip, body > .dk-footer')
                .getByRole('link', { name: 'How it works' });
            await expect(links, path).toHaveCount(2);
            for (const link of await links.all()) {
                await expect(link, path).toHaveAttribute('href', ABOUT);
            }
        }
    });
});

test.describe('the theme switch', () => {
    /** The radio for each choice, in the strip's section named for the switch. */
    const choice = (page: Page, name: 'System' | 'Light' | 'Dark') =>
        page.getByRole('radiogroup', { name: 'Theme' }).getByRole('radio', { name });

    /** What the page saved under the portfolio's key. */
    const saved = (page: Page) => page.evaluate(() => localStorage.getItem('theme'));

    test('shows the theme the portfolio saved, and takes the room the strip kept for it', async ({
        page,
    }) => {
        await page.addInitScript(() => {
            localStorage.setItem('theme', 'dark');
        });
        await page.goto('/design-kit/');
        await expect(choice(page, 'Dark')).toBeChecked();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        await expect(page.locator('body > .dk-strip .dk-strip-room')).toHaveCount(0);
        await expect(page.getByRole('region', { name: 'Settings' })).toContainText('Theme');
        await expect(page.getByRole('radiogroup', { name: 'Theme' })).toHaveAccessibleDescription(
            /jasonsdevspace\.com/
        );
    });

    test('saves a choice as the portfolio does, and draws it at once and after a reload', async ({
        page,
    }) => {
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.goto('/design-kit/tokens/');
        await choice(page, 'Light').check();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
        expect(await saved(page)).toBe('light');
        await page.reload();
        await expect(choice(page, 'Light')).toBeChecked();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    });

    test("follows the system's theme once System is chosen", async ({ page }) => {
        await page.addInitScript(() => {
            if (localStorage.getItem('theme') === null) localStorage.setItem('theme', 'light');
        });
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.goto('/design-kit/controls/');
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
        await choice(page, 'System').check();
        expect(await saved(page)).toBe('system');
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        await page.emulateMedia({ colorScheme: 'light' });
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    });

    test('moves to the choice another tab saves', async ({ page, context }) => {
        await page.goto('/design-kit/');
        const other = await context.newPage();
        await other.goto('/design-kit/how-it-works/');
        await choice(other, 'Dark').check();
        await expect(choice(page, 'Dark')).toBeChecked();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    });

    test('moves between its choices with the arrow keys, as radios do', async ({ page }) => {
        await page.goto('/design-kit/');
        await choice(page, 'System').focus();
        await page.keyboard.press('ArrowRight');
        await expect(choice(page, 'Light')).toBeFocused();
        await expect(choice(page, 'Light')).toBeChecked();
        expect(await saved(page)).toBe('light');
    });

    test('still draws the page when the browser refuses it storage', async ({ page }) => {
        await page.addInitScript(() => {
            Object.defineProperty(window, 'localStorage', {
                get: () => {
                    throw new Error('refused');
                },
            });
        });
        await page.emulateMedia({ colorScheme: 'light' });
        await page.goto('/design-kit/');
        await expect(choice(page, 'System')).toBeChecked();
        await choice(page, 'Dark').check();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        // The theme script cannot know the choice, and redraws the system's when it changes. A
        // listener added now hears the change after the page's own, so once it has heard it every
        // listener has run.
        await page.evaluate(() => {
            const media = matchMedia('(prefers-color-scheme: dark)');
            media.addEventListener('change', () => {
                document.body.dataset['heard'] = media.matches ? 'dark' : 'light';
            });
        });
        await page.emulateMedia({ colorScheme: 'dark' });
        await expect(page.locator('body')).toHaveAttribute('data-heard', 'dark');
        // Back to light, where the theme script draws light over the choice.
        await page.emulateMedia({ colorScheme: 'light' });
        await expect(page.locator('body')).toHaveAttribute('data-heard', 'light');
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        await expect(choice(page, 'Dark')).toBeChecked();
    });

    test('catches up with a choice saved while the page was in the back and forward cache', async ({
        page,
    }) => {
        await page.emulateMedia({ colorScheme: 'light' });
        await page.goto('/design-kit/');
        await expect(choice(page, 'System')).toBeChecked();
        // A choice saved elsewhere while this page was away, which it never heard, and its return.
        await page.evaluate(() => {
            localStorage.setItem('theme', 'dark');
            window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
        });
        await expect(choice(page, 'Dark')).toBeChecked();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    });

    test('moves nothing below the strip as it comes, at any width or text size', async ({
        browser,
    }) => {
        const moved: string[] = [];
        for (const javaScriptEnabled of [false, true]) {
            const context = await browser.newContext({ javaScriptEnabled });
            const page = await context.newPage();
            for (const width of [320, 390, 768, 769, 820, 1280]) {
                for (const scale of [1, 2]) {
                    await page.setViewportSize({ width, height: 900 });
                    await textSize(page, scale);
                    await page.goto('/design-kit/');
                    if (javaScriptEnabled) {
                        await expect(choice(page, 'System')).toBeVisible();
                        // The switch's words fit the width the room kept for it, in this font.
                        const spills = await page
                            .locator('.site-theme')
                            .evaluate((group) => group.scrollWidth > group.clientWidth);
                        expect(spills, `${String(width)} at text ${String(scale)}`).toBe(false);
                    }
                    const top = await page
                        .locator('.site-nav')
                        .evaluate((nav) => nav.getBoundingClientRect().top);
                    moved.push(`${String(width)} at text ${String(scale)}: ${String(top)}`);
                }
            }
            await context.close();
        }
        const half = moved.length / 2;
        expect(moved.slice(half)).toEqual(moved.slice(0, half));
    });
});
