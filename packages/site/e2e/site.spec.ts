import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { HELD } from '../../design-kit/examples/held.js';
import { ABOUT, BASE, ROUTES, SOURCE } from '../src/routes.js';

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

/**
 * The visitor's own text size, as the browser's setting sets it, which every rem is drawn from.
 * The session stays open for the page's life, since closing it undoes the setting, and the size is
 * read back, so a setting the browser drops fails the test rather than leaving it at one size.
 */
const textSize = async (page: Page, scale: number) => {
    const session = await page.context().newCDPSession(page);
    await session.send('Page.setFontSizes', {
        fontSizes: { standard: Math.round(16 * scale), fixed: Math.round(13 * scale) },
    });
    const size = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
    expect(size, 'the text size the browser draws').toBe(`${String(Math.round(16 * scale))}px`);
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
                const attribute =
                    state.querySelector('.site-state-attribute code')?.textContent ?? '';
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

test.describe('the landing page', () => {
    test('opens with a heading, a lead, and links to the controls and to how the kit works', async ({
        page,
    }) => {
        await page.goto(BASE);
        const main = page.getByRole('main');
        await expect(main.getByRole('heading', { level: 1 })).toHaveText(
            'One set of colors, type and controls for every demo'
        );
        await expect(main.locator('.site-lead')).toBeVisible();
        await expect(main.getByRole('link', { name: 'See every control' })).toHaveAttribute(
            'href',
            `${BASE}controls/`
        );
        await expect(main.getByRole('link', { name: 'How the design kit works' })).toHaveAttribute(
            'href',
            ABOUT
        );
    });

    test('gives the install command with a copy button', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.goto(BASE);
        const block = page.getByRole('region', { name: 'the install command' });
        await expect(block).toHaveText('npm install @jasonsdevspace/design-kit');
        await page.getByRole('button', { name: 'Copy the install command' }).click();
        await expect(page.getByRole('status')).toHaveText('Copied.');
        expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
            'npm install @jasonsdevspace/design-kit'
        );
    });

    test('selects the install command where the browser has no clipboard', async ({ page }) => {
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'clipboard', { value: undefined });
        });
        await page.goto(BASE);
        await page.getByRole('button', { name: 'Copy the install command' }).click();
        expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
            'npm install @jasonsdevspace/design-kit'
        );
    });

    test("draws the kit's controls in light and in dark, beside the heading", async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto(BASE);
        const demo = page.getByRole('figure', { name: /in light and in dark/ });
        await expect(demo).toBeVisible();
        const panels = await demo.locator('.site-hero-panel').evaluateAll((all) =>
            all.map((panel) => ({
                scheme: getComputedStyle(panel).colorScheme,
                inert: panel.closest('[inert]') !== null,
                accent: panel.querySelector('button.dk-button-accent') !== null,
                callout: panel.querySelector('.dk-callout') !== null,
            }))
        );
        expect(panels).toEqual([
            { scheme: 'light', inert: true, accent: true, callout: true },
            { scheme: 'dark', inert: true, accent: true, callout: true },
        ]);
        const [heading, drawn] = await Promise.all(
            [page.getByRole('heading', { level: 1 }), demo].map((each) => each.boundingBox())
        );
        expect(heading && drawn && heading.x + heading.width <= drawn.x).toBe(true);
    });

    test('shows the controls above the fold on a phone', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(BASE);
        const top = await page
            .locator('.site-hero-demo')
            .evaluate((demo) => demo.getBoundingClientRect().top);
        expect(top).toBeLessThan(844);
    });

    test('gives each page a card with a preview and its description', async ({ page }) => {
        await page.goto(BASE);
        const cards = page.locator('.site-pages > li');
        const pages = ROUTES.filter(({ nav, path }) => nav !== null && path !== BASE);
        await expect(cards).toHaveCount(pages.length);
        for (const [index, { nav, path, description }] of pages.entries()) {
            const card = cards.nth(index);
            await expect(card.getByRole('link', { name: nav ?? '', exact: true })).toHaveAttribute(
                'href',
                path
            );
            await expect(card).toContainText(description);
            await expect(card.locator('.site-page-preview')).toHaveAttribute('aria-hidden', 'true');
            await expect(card.locator('.site-page-preview')).toBeVisible();
        }
    });

    test('says what the kit is built to', async ({ page }) => {
        await page.goto(BASE);
        const section = page.locator('main > section', {
            has: page.getByRole('heading', { level: 2, name: 'Built to the demos’ rules' }),
        });
        await expect(section.getByRole('heading', { level: 3 })).toHaveText([
            'Works under a strict policy',
            'Both themes, measured',
            'State from the attribute a screen reader reads',
        ]);
    });
});

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
    test("draws its strip pictures without the width the page's own switch takes", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto('/design-kit/page-chrome/');
        // Each pictured section as wide as what it holds, as a demo that names no width draws it.
        const fits = await page.locator('.site-copy .dk-strip-tools').evaluateAll((sections) =>
            sections.map((section) => {
                const gap = parseFloat(getComputedStyle(section).columnGap) || 0;
                const children = [...section.children].map(
                    (child) => child.getBoundingClientRect().width
                );
                const content =
                    children.reduce((sum, width) => sum + width, 0) +
                    gap * Math.max(0, children.length - 1);
                return Math.round(section.getBoundingClientRect().width - content);
            })
        );
        expect(fits.length).toBeGreaterThan(0);
        expect(fits.filter((extra) => extra !== 0)).toEqual([]);
    });

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
        await expect(page.locator('.site-state-copies > .site-copy:not([inert])')).toHaveCount(
            states
        );
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

test.describe('what the tests check', () => {
    /**
     * The pages that show the kit's pieces, each section of which lists the tests that hold it:
     * every page in the site's menu but the landing page.
     */
    const SHOWN = ROUTES.filter(({ nav, path }) => nav !== null && path !== BASE).map(
        ({ path }) => path
    );

    test('lists under each section the tests that hold it, and shows each group once', async ({
        page,
    }) => {
        const shown: string[] = [];
        for (const path of SHOWN) {
            await page.goto(path);
            const sections = page.locator('main > section:has(> h2)');
            expect(await sections.count(), path).toBeGreaterThan(0);
            for (const section of await sections.all()) {
                const group = (await section.locator('> h2').textContent()) ?? '';
                shown.push(group);
                const panel = section.locator('> details.site-held');
                await expect(panel, `${path} ${group}`).toHaveCount(1);
                const held = HELD[group as keyof typeof HELD];
                expect(held, `${path} ${group} is a group the tests are listed for`).toBeDefined();
                await expect(panel.locator('li')).toHaveText(held.flatMap(({ titles }) => titles));
            }
        }
        expect(shown.toSorted()).toEqual(Object.keys(HELD).toSorted());
    });

    test('names each file the tests are in, and links it at the commit the page was built at', async ({
        page,
    }) => {
        await page.goto('/design-kit/controls/');
        const commit = await page
            .getByRole('contentinfo')
            .getByRole('link', { name: /^[0-9a-f]{7}$/ })
            .getAttribute('href');
        const sha = commit?.split('/commit/')[1] ?? '';
        expect(sha).toMatch(/^[0-9a-f]{40}$/);
        const panel = page.locator('section:has(> h2#buttons) > details.site-held');
        await panel.locator('> summary').click();
        await expect(panel.getByRole('link')).toHaveText(HELD.Buttons.map(({ file }) => file));
        for (const [index, { file }] of HELD.Buttons.entries()) {
            await expect(panel.getByRole('link').nth(index)).toHaveAttribute(
                'href',
                `${SOURCE}/blob/${sha}/packages/design-kit/${file}`
            );
        }
    });

    test('names the panel by its group for a screen reader, and keeps it closed until opened', async ({
        page,
    }) => {
        await page.goto('/design-kit/controls/');
        const panel = page.locator('section:has(> h2#buttons) > details.site-held');
        await expect(panel.locator('> summary')).toHaveAccessibleName(
            'What the tests check, Buttons'
        );
        await expect(page.locator('details.site-held[open]')).toHaveCount(0);
        await expect(panel.locator('li').first()).toBeHidden();
        await panel.locator('> summary').click();
        await expect(panel.locator('li').first()).toBeVisible();
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

test.describe("the site's header", () => {
    /** The pages in the site's menu, which open with the header, rather than the explainer's. */
    const MENU = ROUTES.filter(({ nav }) => nav !== null);

    test('opens each page with the mark and the name, linked to the landing page', async ({
        page,
    }) => {
        for (const { path } of MENU) {
            await page.goto(path);
            const brand = page.getByRole('link', { name: 'The design kit', exact: true });
            await expect(brand, path).toHaveAttribute('href', BASE);
            await expect(brand.locator('.site-mark'), path).toHaveAttribute('aria-hidden', 'true');
            await expect(brand.locator('.site-mark'), path).toBeVisible();
        }
    });

    test('draws the pages as tabs, the current one filled and marked as the page', async ({
        page,
    }) => {
        for (const { path, nav } of MENU) {
            await page.goto(path);
            const tabs = page
                .getByRole('navigation', { name: 'Design kit' })
                .getByRole('list')
                .getByRole('link');
            const drawn = await tabs.evaluateAll((links) =>
                links.map((link) => ({
                    current: link.getAttribute('aria-current') === 'page',
                    filled: getComputedStyle(link).backgroundColor !== 'rgba(0, 0, 0, 0)',
                    round: parseFloat(getComputedStyle(link).borderTopLeftRadius) >= 12,
                    name: link.textContent.trim(),
                }))
            );
            expect(
                drawn.filter(({ current }) => current).map(({ name }) => name),
                path
            ).toEqual([nav]);
            expect(
                drawn.filter(({ current, filled }) => current !== filled),
                path
            ).toEqual([]);
            expect(
                drawn.filter(({ round }) => !round),
                path
            ).toEqual([]);
        }
    });

    test("keeps the tabs in one row on a phone, scrolling sideways to the current one, each a thumb's size", async ({
        page,
    }) => {
        for (const width of [320, 390]) {
            await page.setViewportSize({ width, height: 800 });
            await page.goto('/design-kit/explainer-pieces/');
            const row = await page.locator('.site-tabs').evaluate((list) => {
                const links = [...list.querySelectorAll('a')].map((link) =>
                    link.getBoundingClientRect()
                );
                return {
                    tops: [...new Set(links.map((box) => Math.round(box.top)))],
                    short: links.filter((box) => box.height < 44).length,
                    scrolls:
                        list.scrollWidth > list.clientWidth &&
                        getComputedStyle(list).overflowX === 'auto',
                    // The last tab, which a phone this narrow cannot fit, is scrolled into the row.
                    shown: (() => {
                        const row = list.getBoundingClientRect();
                        const current = list
                            .querySelector('[aria-current="page"]')
                            ?.getBoundingClientRect();
                        return (
                            current !== undefined &&
                            current.left >= row.left - 1 &&
                            current.right <= row.right + 1
                        );
                    })(),
                };
            });
            expect(row.tops, String(width)).toHaveLength(1);
            expect(row.short, String(width)).toBe(0);
            expect(row.scrolls, String(width)).toBe(true);
            expect(row.shown, String(width)).toBe(true);
            expect(await sideways(page), String(width)).toBe(0);
        }
    });

    test('draws the theme as one segmented control of three radios, the chosen one raised', async ({
        page,
    }) => {
        await page.goto('/design-kit/');
        const group = page.getByRole('radiogroup', { name: 'Theme' });
        await expect(group.getByRole('radio')).toHaveCount(3);
        const segments = await group.locator('label').evaluateAll((labels) =>
            labels.map((label) => {
                const radio = label.querySelector('input');
                const segment = label.querySelector('span');
                return {
                    checked: radio?.checked ?? false,
                    raised:
                        segment !== null &&
                        getComputedStyle(segment).backgroundColor !== 'rgba(0, 0, 0, 0)',
                    // The radio is kept for the keyboard and a screen reader, and drawn as its segment.
                    hidden: radio !== null && getComputedStyle(radio).opacity === '0',
                };
            })
        );
        expect(segments.filter(({ checked, raised }) => checked !== raised)).toEqual([]);
        expect(segments.filter(({ hidden }) => !hidden)).toEqual([]);
        // The keyboard moves between the choices as between radios, and the ring shows on the
        // segment it reaches.
        await group.getByRole('radio', { name: 'System' }).focus();
        await page.keyboard.press('ArrowRight');
        await expect(group.getByRole('radio', { name: 'Light' })).toBeChecked();
        const ring = await group
            .locator('label', { hasText: 'Light' })
            .locator('span')
            .evaluate((segment) => getComputedStyle(segment).outlineStyle);
        expect(ring).not.toBe('none');
    });
    test("leaves room in the tabs' row for the kit's focus ring", async ({ page }) => {
        await page.goto('/design-kit/controls/');
        const room = await page.locator('.site-tabs').evaluate((list) => {
            const style = getComputedStyle(list);
            const root = getComputedStyle(document.documentElement);
            // The kit sets its ring in pixels, the line and the gap outside the box it rings.
            const ring =
                parseFloat(root.getPropertyValue('--dk-ring-width')) +
                parseFloat(root.getPropertyValue('--dk-ring-offset'));
            return [style.paddingTop, style.paddingBottom, style.paddingLeft, style.paddingRight]
                .map(parseFloat)
                .every((padding) => padding >= ring - 0.5);
        });
        expect(room).toBe(true);
    });

    test('shows the chosen theme and the current tab in forced colors', async ({ page }) => {
        await page.goto('/design-kit/controls/');
        // A browser reports the author's colors to a script even while it forces its own, so the
        // test reads the rules the sheet keeps for forced colors, which set the system's own.
        const forced = await page.evaluate(() =>
            [...document.styleSheets]
                .flatMap((sheet) => [...sheet.cssRules])
                .filter(
                    (rule): rule is CSSMediaRule =>
                        rule instanceof CSSMediaRule && rule.conditionText.includes('forced-colors')
                )
                .flatMap((rule) => [...rule.cssRules])
                .filter(
                    (rule): rule is CSSStyleRule =>
                        rule instanceof CSSStyleRule &&
                        rule.style.backgroundColor.toLowerCase() === 'highlight'
                )
                .map((rule) => rule.selectorText)
                .join(',')
        );
        expect(forced).toContain('.site-theme input:checked + span');
        expect(forced).toContain('.site-tabs a[aria-current="page"]');
        expect(forced).toContain('.site-code-tab[aria-selected="true"]');
    });

    test('keeps each segment one width as the choice moves', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/design-kit/');
        const group = page.getByRole('radiogroup', { name: 'Theme' });
        const widths = () =>
            group
                .locator('label')
                .evaluateAll((labels) =>
                    labels.map((label) => label.getBoundingClientRect().width)
                );
        const before = await widths();
        await group.getByRole('radio', { name: 'Dark' }).check();
        expect(await widths()).toEqual(before);
    });

    test('scrolls to the current tab when a turn makes the row too narrow', async ({ page }) => {
        await page.setViewportSize({ width: 1024, height: 800 });
        await page.goto('/design-kit/explainer-pieces/');
        await page.setViewportSize({ width: 360, height: 800 });
        await expect
            .poll(() =>
                page.locator('.site-tabs').evaluate((list) => {
                    const row = list.getBoundingClientRect();
                    const box = list
                        .querySelector('[aria-current="page"]')
                        ?.getBoundingClientRect();
                    return (
                        box !== undefined && box.left >= row.left - 1 && box.right <= row.right + 1
                    );
                })
            )
            .toBe(true);
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
                        // The switch's words fit the width its section keeps for it, in this font,
                        // on either side, since the section sets what it holds against its end.
                        const spills = await page
                            .locator('body > .dk-strip .dk-strip-tools')
                            .evaluate((section) => {
                                const outer = section.getBoundingClientRect();
                                const group = section.querySelector('.site-theme');
                                const inner = group?.getBoundingClientRect();
                                return (
                                    !inner ||
                                    inner.left < outer.left - 1 ||
                                    inner.right > outer.right + 1
                                );
                            });
                        expect(spills, `${String(width)} at text ${String(scale)}`).toBe(false);
                    }
                    const top = await page
                        .locator('.site-header')
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

test.describe('the code of each state', () => {
    test("shows each state's markup as the copy beside it draws it", async ({ page }) => {
        for (const path of [
            '/design-kit/controls/',
            '/design-kit/page-chrome/',
            '/design-kit/explainer-pieces/',
        ]) {
            await page.goto(path);
            const differ = await page.evaluate(() => {
                /** The elements a browser lays out as blocks, at whose edges a space draws nothing. */
                const BLOCKS = new Set(['DIV', 'P', 'FOOTER', 'NAV', 'SECTION', 'UL', 'OL', 'LI']);
                /**
                 * Markup as the parser reads it. Where its control is laid out, every space beside a
                 * tag is dropped, which that layout adds, as the README's blocks are laid out.
                 * Markup as written keeps every space inside a sentence, and drops only those at the
                 * edges of a block, where the layout breaks a line and a browser draws nothing.
                 */
                const read = (html: string, laidOut: boolean) => {
                    const template = document.createElement('template');
                    template.innerHTML = html;
                    if (laidOut) {
                        return template.innerHTML
                            .replaceAll(/\s*(<[^>]+>)\s*/g, '$1')
                            .replaceAll(/\s+/g, ' ');
                    }
                    const walker = document.createTreeWalker(
                        template.content,
                        NodeFilter.SHOW_TEXT
                    );
                    const texts: Text[] = [];
                    while (walker.nextNode()) texts.push(walker.currentNode as Text);
                    /** Whether a node is a block, or a text's edge is a block's own edge. */
                    const block = (node: Node | null) =>
                        node instanceof Element && BLOCKS.has(node.tagName);
                    for (const text of texts) {
                        const value = text.data.replaceAll(/\s+/g, ' ');
                        const before = text.previousSibling ?? text.parentElement;
                        const after = text.nextSibling ?? text.parentElement;
                        const start = block(before) ? value.trimStart() : value;
                        text.data = block(after) ? start.trimEnd() : start;
                    }
                    return template.innerHTML;
                };
                return [...document.querySelectorAll('.site-state')].flatMap((state) => {
                    // The live copy, or for a picture the copy in the visitor's theme, without its
                    // label, and with the ids the code names.
                    const copy = state.querySelector('.site-copy')?.cloneNode(true);
                    const code = state.querySelector<HTMLElement>('.site-code');
                    const shown = code?.querySelector('pre.dk-code')?.textContent;
                    if (!(copy instanceof HTMLElement) || !code || shown === undefined) return [];
                    copy.querySelector('.site-copy-label')?.remove();
                    const drawn = copy.innerHTML.replaceAll('-yours"', '"');
                    const laidOut = code.dataset['layout'] === 'laid-out';
                    return read(shown, laidOut) === read(drawn, laidOut)
                        ? []
                        : [state.querySelector('.site-state-name')?.textContent ?? ''];
                });
            });
            expect(differ, path).toEqual([]);
        }
    });

    test('shows React for each state a component draws, and markup alone for the rest', async ({
        page,
    }) => {
        for (const path of ['/design-kit/controls/', '/design-kit/page-chrome/']) {
            await page.goto(path);
            const states = await page.locator('.site-state').count();
            await expect(
                page.locator('.site-code-name', { hasText: /^React, / }),
                path
            ).toHaveCount(states);
        }
        await page.goto('/design-kit/explainer-pieces/');
        await expect(page.locator('.site-code-name', { hasText: /^React, / })).toHaveCount(0);
    });

    test('never widens the page with every block open, at any width or text size', async ({
        page,
    }) => {
        for (const path of PAGES) {
            for (const width of WIDTHS) {
                for (const scale of [1, 2]) {
                    await page.setViewportSize({ width, height: 900 });
                    await textSize(page, scale);
                    await page.goto(path);
                    await page.evaluate(() => {
                        for (const code of document.querySelectorAll('details')) code.open = true;
                    });
                    expect(
                        await sideways(page),
                        `${path} ${String(width)} at ${String(scale)}`
                    ).toBe(0);
                }
            }
        }
    });

    test('copies a block to the clipboard, and says so', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.goto('/design-kit/controls/');
        await page.locator('summary', { hasText: 'The code, An action' }).click();
        const block = page.getByRole('region', { name: 'Markup, An action' });
        await page.getByRole('button', { name: 'Copy Markup, An action' }).click();
        await expect(page.getByRole('status')).toHaveText('Copied.');
        await expect(page.getByRole('button', { name: 'Copied Markup, An action' })).toBeVisible();
        expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
            await block.textContent()
        );
    });

    test('selects the block where the browser refuses to write to the clipboard', async ({
        page,
    }) => {
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: () => Promise.reject(new Error('refused')) },
            });
        });
        await page.goto('/design-kit/controls/');
        await page.locator('summary', { hasText: 'The code, An action' }).click();
        const block = page.getByRole('region', { name: 'Markup, An action' });
        await page.getByRole('button', { name: 'Copy Markup, An action' }).click();
        await expect(
            page.getByRole('button', { name: 'Selected Markup, An action' })
        ).toBeVisible();
        expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
            await block.textContent()
        );
    });

    test('says so again when a second block is copied', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.goto('/design-kit/controls/');
        await page.locator('summary', { hasText: 'The code, An action' }).click();
        await page.getByRole('button', { name: 'Copy Markup, An action' }).click();
        await expect(page.getByRole('status')).toHaveText('Copied.');
        // Emptied first, so a screen reader hears the same words again.
        const heard = page.evaluate(
            () =>
                new Promise<string[]>((resolve) => {
                    const status = document.querySelector('[role="status"]');
                    const seen: string[] = [];
                    if (!status) return resolve(seen);
                    new MutationObserver(() => {
                        seen.push(status.textContent);
                        if (status.textContent !== '') resolve(seen);
                    }).observe(status, { childList: true, characterData: true, subtree: true });
                })
        );
        await page.getByRole('tab', { name: 'React' }).first().click();
        await page.getByRole('button', { name: 'Copy React, An action' }).click();
        expect(await heard).toEqual(['', 'Copied.']);
    });

    test('selects the block where the browser has no clipboard, and says how to copy it', async ({
        page,
    }) => {
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'clipboard', { value: undefined });
        });
        await page.goto('/design-kit/controls/');
        await page.locator('summary', { hasText: 'The code, An action' }).click();
        const block = page.getByRole('region', { name: 'Markup, An action' });
        await page.getByRole('button', { name: 'Copy Markup, An action' }).click();
        await expect(page.getByRole('status')).toHaveText(
            'Selected. Press Control and C, or Command and C on a Mac, to copy.'
        );
        expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
            await block.textContent()
        );
    });

    test.describe(() => {
        test.use({ javaScriptEnabled: false });

        test('still opens and shows the code with no script, with no copy button', async ({
            page,
        }) => {
            await page.goto('/design-kit/controls/');
            await page.locator('summary', { hasText: 'The code, An action' }).click();
            await expect(page.getByRole('region', { name: 'Markup, An action' })).toBeVisible();
            await expect(page.locator('.site-copy-button')).toHaveCount(0);
        });

        test('shows Markup and React one above the other with no script, and no tabs', async ({
            page,
        }) => {
            await page.goto('/design-kit/controls/');
            await page.locator('summary', { hasText: 'The code, An action' }).click();
            await expect(page.getByRole('region', { name: 'Markup, An action' })).toBeVisible();
            await expect(page.getByRole('region', { name: 'React, An action' })).toBeVisible();
            await expect(page.getByRole('tablist')).toHaveCount(0);
        });
    });
});

test.describe('the state cards', () => {
    /** The pages that draw states, each in its own card. */
    const STATED = [
        '/design-kit/controls/',
        '/design-kit/page-chrome/',
        '/design-kit/explainer-pieces/',
    ];

    test('draws each state as one card: its name and attribute, its copies, then its code', async ({
        page,
    }) => {
        for (const path of STATED) {
            await page.goto(path);
            const wrong = await page.evaluate(() =>
                [...document.querySelectorAll<HTMLElement>('.site-state')].flatMap((card) => {
                    const name = card.querySelector('h3');
                    const attribute = card.querySelector('.site-state-attribute code');
                    const copies = card.querySelector('.site-copy');
                    const code = card.querySelector('details.site-code');
                    const style = getComputedStyle(card);
                    const before = (a: Element | null, b: Element | null) =>
                        a !== null &&
                        b !== null &&
                        (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
                    const good =
                        before(name, attribute) &&
                        before(attribute, copies) &&
                        before(copies, code) &&
                        parseFloat(style.borderTopWidth) > 0 &&
                        parseFloat(style.borderTopLeftRadius) > 0;
                    return good ? [] : [name?.textContent ?? 'a card with no name'];
                })
            );
            expect(wrong, path).toEqual([]);
        }
    });

    test('names each card by a heading under its section, which its live copy is named by', async ({
        page,
    }) => {
        await page.goto('/design-kit/controls/');
        const heading = page.getByRole('heading', { level: 3, name: 'An action', exact: true });
        await expect(heading).toBeVisible();
        await expect(page.getByRole('group', { name: 'An action', exact: true })).toHaveCount(1);
    });

    test('shows Markup and React as tabs, with one copy button for the tab shown', async ({
        page,
        context,
    }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.goto('/design-kit/controls/');
        await page.locator('summary', { hasText: 'The code, An action' }).click();
        const card = page.locator('.site-state', {
            has: page.getByRole('heading', { name: 'An action', exact: true }),
        });
        const tabs = card.getByRole('tablist', { name: 'The code, An action' });
        const markup = tabs.getByRole('tab', { name: 'Markup' });
        const react = tabs.getByRole('tab', { name: 'React' });
        await expect(markup).toHaveAttribute('aria-selected', 'true');
        await expect(react).toHaveAttribute('aria-selected', 'false');
        await expect(card.getByRole('region', { name: 'Markup, An action' })).toBeVisible();
        await expect(card.getByRole('region', { name: 'React, An action' })).toBeHidden();
        await expect(card.locator('.site-copy-button')).toHaveCount(1);
        // The tab names its block, so the block's own title is not drawn again under it.
        await expect(card.locator('.dk-code-title')).toHaveCount(2);
        expect(
            await card
                .locator('.dk-code-title')
                .evaluateAll((titles) =>
                    titles.filter((title) => title.getBoundingClientRect().height > 0)
                )
        ).toHaveLength(0);
        // The tabs pattern: one tab in the tab order, the arrows move the choice and the focus.
        expect(
            await tabs.getByRole('tab').evaluateAll((all) => all.map((tab) => tab.tabIndex))
        ).toEqual([0, -1]);
        await markup.focus();
        await page.keyboard.press('ArrowRight');
        await expect(react).toBeFocused();
        await expect(react).toHaveAttribute('aria-selected', 'true');
        await expect(card.getByRole('region', { name: 'React, An action' })).toBeVisible();
        await expect(card.getByRole('region', { name: 'Markup, An action' })).toBeHidden();
        await expect(card.getByRole('tabpanel')).toHaveAccessibleName('React');
        await page.keyboard.press('ArrowRight');
        await expect(markup).toBeFocused();
        await page.keyboard.press('End');
        await expect(react).toBeFocused();
        await page.keyboard.press('Home');
        await expect(markup).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await expect(react).toHaveAttribute('aria-selected', 'true');
        // The one button copies the block its tab shows.
        await card.getByRole('button', { name: 'Copy React, An action' }).click();
        expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
            await card.getByRole('region', { name: 'React, An action' }).textContent()
        );
    });

    test('leaves the browser its own shortcuts on a tab, such as going back', async ({ page }) => {
        await page.goto('/design-kit/controls/');
        await page.locator('summary', { hasText: 'The code, An action' }).click();
        const markup = page.getByRole('tab', { name: 'Markup' }).first();
        await markup.focus();
        const passed = await page.evaluate(() => {
            const tab = document.activeElement;
            if (!tab) return [];
            return (['altKey', 'ctrlKey', 'metaKey'] as const).map((modifier) => {
                const event = new KeyboardEvent('keydown', {
                    key: 'ArrowLeft',
                    bubbles: true,
                    cancelable: true,
                    [modifier]: true,
                });
                tab.dispatchEvent(event);
                return !event.defaultPrevented;
            });
        });
        expect(passed).toEqual([true, true, true]);
        await expect(markup).toHaveAttribute('aria-selected', 'true');
    });

    test('names the button for the block it copied, when the tab changes as it copies', async ({
        page,
    }) => {
        // The clipboard answers only when the test says, as it would behind a permission prompt.
        await page.addInitScript(() => {
            const held: { resolve?: () => void } = {};
            Object.defineProperty(window, 'answerClipboard', { value: () => held.resolve?.() });
            Object.defineProperty(navigator, 'clipboard', {
                value: {
                    writeText: () =>
                        new Promise<void>((resolve) => {
                            held.resolve = resolve;
                        }),
                },
            });
        });
        await page.goto('/design-kit/controls/');
        await page.locator('summary', { hasText: 'The code, An action' }).click();
        await page.getByRole('button', { name: 'Copy Markup, An action' }).click();
        await page.getByRole('tab', { name: 'React' }).first().click();
        await page.evaluate(() => {
            (window as unknown as { answerClipboard: () => void }).answerClipboard();
        });
        await expect(page.getByRole('status')).toHaveText('Copied.');
        // Read at once, before the button would say Copy again on its own.
        expect(
            await page
                .locator('.site-copy-button')
                .first()
                .evaluate((button) => button.textContent)
        ).toBe('Copy React, An action');
    });

    test('gives a state with markup alone its block and copy button, with no tabs', async ({
        page,
    }) => {
        await page.goto('/design-kit/explainer-pieces/');
        const card = page.locator('.site-state').first();
        await card.locator('summary').click();
        await expect(card.getByRole('tablist')).toHaveCount(0);
        await expect(card.locator('pre.dk-code')).toBeVisible();
        await expect(card.locator('.site-copy-button')).toHaveCount(1);
    });

    test('lists the sections of a page beside it on a wide screen, and leaves it out on a phone', async ({
        page,
    }) => {
        for (const path of STATED) {
            await page.setViewportSize({ width: 1280, height: 900 });
            await page.goto(path);
            const list = page.getByRole('navigation', { name: 'On this page' });
            await expect(list, path).toBeVisible();
            const targets = await list
                .getByRole('link')
                .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
            const sections = await page
                .locator('main > section > h2')
                .evaluateAll((headings) => headings.map((heading) => `#${heading.id}`));
            expect(targets, path).toEqual(sections);
            // Beside the content, not above it.
            const [nav, main] = await Promise.all(
                [list, page.locator('main > h1')].map((each) => each.boundingBox())
            );
            expect(nav && main && nav.x + nav.width <= main.x, path).toBe(true);
            const short = await list
                .getByRole('link')
                .evaluateAll(
                    (links) =>
                        links.filter((link) => link.getBoundingClientRect().height < 24).length
                );
            expect(short, path).toBe(0);
            for (const width of [390, 768]) {
                await page.setViewportSize({ width, height: 900 });
                await expect(list, `${path} at ${String(width)}`).toBeHidden();
            }
        }
        for (const path of [BASE, '/design-kit/tokens/']) {
            await page.goto(path);
            await expect(page.getByRole('navigation', { name: 'On this page' }), path).toHaveCount(
                0
            );
        }
    });
});

test.describe('how each state is shown', () => {
    test('fills the column with its two copies on a wide screen', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto('/design-kit/controls/');
        const gaps = await page.evaluate(() => {
            const main = document.querySelector('.site-main');
            if (!main) return [];
            const style = getComputedStyle(main);
            const right = main.getBoundingClientRect().right - parseFloat(style.paddingRight);
            // Each card runs to the column's edge, and its last copy to the card's padding.
            return [...document.querySelectorAll('.site-state')].flatMap((state) => {
                const room = state.querySelector('.site-state-copies');
                const last = [...state.querySelectorAll('.site-copy')].at(-1);
                if (!room || !last) return [Infinity];
                const inner =
                    room.getBoundingClientRect().right -
                    parseFloat(getComputedStyle(room).paddingRight);
                return [
                    Math.round(right - state.getBoundingClientRect().right),
                    Math.round(inner - last.getBoundingClientRect().right),
                ];
            });
        });
        expect(gaps.length).toBeGreaterThan(0);
        expect(gaps.filter((gap) => Math.abs(gap) > 1)).toEqual([]);
    });

    test('names each copy by its theme, marks the live one, and calls a picture a picture', async ({
        page,
    }) => {
        for (const [scheme, theme, other] of [
            ['light', 'Light', 'Dark'],
            ['dark', 'Dark', 'Light'],
        ] as const) {
            await page.emulateMedia({ colorScheme: scheme });
            for (const [path, live, preview] of [
                ['/design-kit/controls/', `${theme} Live`, `${other}, preview only`],
                ['/design-kit/page-chrome/', `${theme}, a picture`, `${other}, a picture`],
            ] as const) {
                await page.goto(path);
                // The words a reader sees, which the page's theme decides.
                const wrong = await page.evaluate(
                    (expected) =>
                        [...document.querySelectorAll('.site-state')]
                            .map((state) =>
                                [...state.querySelectorAll<HTMLElement>('.site-copy-label')]
                                    .map((label) => label.innerText.replaceAll(/\s+/g, ' ').trim())
                                    .join('|')
                            )
                            .filter((labels) => labels !== expected.join('|')),
                    [live, preview]
                );
                expect(wrong, `${path} in ${scheme}`).toEqual([]);
            }
        }
    });

    test('frames a copy that cannot be tried with a dashed edge, and a live one with a solid edge', async ({
        page,
    }) => {
        for (const path of ['/design-kit/controls/', '/design-kit/page-chrome/']) {
            await page.goto(path);
            const edges = await page.evaluate(() =>
                [...document.querySelectorAll('.site-copy')].map((copy) => ({
                    inert: copy.hasAttribute('inert'),
                    edge: getComputedStyle(copy).borderTopStyle,
                }))
            );
            expect(edges.length, path).toBeGreaterThan(0);
            expect(
                edges.filter(({ inert, edge }) => edge !== (inert ? 'dashed' : 'solid')),
                path
            ).toEqual([]);
        }
    });

    test('sets light on the left and dark on the right on a wide screen, and the live copy first on a phone', async ({
        page,
    }) => {
        for (const scheme of ['light', 'dark'] as const) {
            await page.emulateMedia({ colorScheme: scheme });
            for (const [width, phone] of [
                [1280, false],
                [390, true],
            ] as const) {
                await page.setViewportSize({ width, height: 900 });
                await page.goto('/design-kit/controls/');
                const out = await page.evaluate(
                    ({ scheme, phone }) =>
                        [...document.querySelectorAll('.site-state')].flatMap((state) => {
                            const live = state.querySelector('.site-copy:not(.site-other)');
                            const other = state.querySelector('.site-other');
                            if (!live || !other) return ['a state without both copies'];
                            const [a, b] = [live, other].map((copy) =>
                                copy.getBoundingClientRect()
                            );
                            if (!a || !b) return ['a state whose copies have no box'];
                            const right = phone
                                ? a.bottom <= b.top
                                : scheme === 'light'
                                  ? a.right <= b.left
                                  : b.right <= a.left;
                            return right
                                ? []
                                : [state.querySelector('.site-state-name')?.textContent ?? ''];
                        }),
                    { scheme, phone }
                );
                expect(out, `${String(width)} in ${scheme}`).toEqual([]);
            }
        }
    });

    test('answers a tap on a preview with a note, and its button switches the theme', async ({
        page,
    }) => {
        await page.emulateMedia({ colorScheme: 'light' });
        await page.goto('/design-kit/controls/');
        const state = page.locator('.site-state').filter({ hasText: 'A field with an error' });
        const preview = state.locator('.site-other');
        const note = page.locator('.site-preview-note');
        await expect(note).toHaveCount(0);
        // A preview is inert, so a tap on it reaches what is under it, as a reader's would.
        const box = await preview.boundingBox();
        if (!box) throw new Error('no preview');
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await expect(note).toHaveCount(1);
        await expect(note).toHaveText(
            'This is only a preview of the dark theme. Try the one marked Live, or switch to dark.'
        );
        await expect(page.getByRole('status')).toHaveText(
            'This is only a preview of the dark theme. Try the light one.'
        );
        // Escape closes it, and so does a tap anywhere else.
        await page.keyboard.press('Escape');
        await expect(note).toHaveCount(0);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await expect(note).toHaveCount(1);
        await page.getByRole('heading', { level: 1 }).click();
        await expect(note).toHaveCount(0);
        // Its button switches the page, as the strip's switch does.
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await note.getByRole('button', { name: 'switch to dark' }).click();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
        await expect(note).toHaveCount(0);
        await expect(page.getByRole('status')).toHaveText('The theme is dark now.');
        // Focus goes to the live copy beside it, rather than back to the start of the page.
        await expect(state.locator('.site-copy:not(.site-other)')).toBeFocused();
    });

    test('closes the note when the page changes theme some other way, so it never names the wrong one', async ({
        page,
    }) => {
        await page.emulateMedia({ colorScheme: 'light' });
        await page.goto('/design-kit/controls/');
        const preview = page
            .locator('.site-state')
            .filter({ hasText: 'A field with an error' })
            .locator('.site-other');
        const box = await preview.boundingBox();
        if (!box) throw new Error('no preview');
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await expect(page.locator('.site-preview-note')).toHaveCount(1);
        // With System chosen, the system turning dark changes the page with no click to close it.
        await page.emulateMedia({ colorScheme: 'dark' });
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        await expect(page.locator('.site-preview-note')).toHaveCount(0);
    });

    test('takes a drag that only ends on a preview for no tap on it', async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'light' });
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto('/design-kit/controls/');
        const state = page.locator('.site-state').filter({ hasText: 'A field with an error' });
        const [from, to] = await Promise.all([
            state.locator('.site-copy:not(.site-other)').boundingBox(),
            state.locator('.site-other').boundingBox(),
        ]);
        if (!from || !to) throw new Error('no copies');
        // From the gap between the two copies, which is the state's own, to the preview.
        await page.mouse.move((from.x + from.width + to.x) / 2, to.y + to.height / 2);
        await page.mouse.down();
        await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 4 });
        await page.mouse.up();
        await expect(page.locator('.site-preview-note')).toHaveCount(0);
        // And a tap that starts there too opens it, so the drag is what was refused.
        await page.mouse.click(to.x + to.width / 2, to.y + to.height / 2);
        await expect(page.locator('.site-preview-note')).toHaveCount(1);
    });

    test("adds nothing to the keyboard's path for the previews until a tap brings the note", async ({
        page,
    }) => {
        await page.emulateMedia({ colorScheme: 'light' });
        await page.goto('/design-kit/controls/');
        /** What the keyboard reaches in the main content outside the live copies. */
        const reached = () =>
            page.evaluate(() =>
                [
                    ...document.querySelectorAll<HTMLElement>(
                        'main :is(a[href], button, input, select, textarea, summary, [tabindex])'
                    ),
                ]
                    .filter(
                        (element) =>
                            element.tabIndex >= 0 &&
                            element.closest('[inert]') === null &&
                            element.closest('.site-copy') === null
                    )
                    .map(
                        (element) =>
                            [
                                'site-copy-button',
                                'site-code-tab',
                                'site-preview-switch',
                                'dk-code',
                            ].find((name) => element.classList.contains(name)) ??
                            element.tagName.toLowerCase()
                    )
            );
        const before = await reached();
        // Only the code's disclosures, tabs, frames and copy buttons, and the tests' links.
        expect(
            before.filter(
                (name) =>
                    !['summary', 'site-code-tab', 'dk-code', 'site-copy-button', 'a'].includes(name)
            )
        ).toEqual([]);
        const box = await page
            .locator('.site-state')
            .filter({ hasText: 'A field with an error' })
            .locator('.site-other')
            .boundingBox();
        if (!box) throw new Error('no preview');
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        const after = await reached();
        expect(after.filter((name) => name === 'site-preview-switch')).toHaveLength(1);
        expect(after).toHaveLength(before.length + 1);
    });

    test('names the live copy of each state by the state, for a screen reader moving by control', async ({
        page,
    }) => {
        await page.goto('/design-kit/controls/');
        await expect(
            page.getByRole('group', { name: 'An action', exact: true }).getByRole('button', {
                name: 'Filters',
            })
        ).toBeVisible();
    });

    test('flips a live toggle when it is pressed', async ({ page }) => {
        await page.goto('/design-kit/controls/');
        const toggle = page
            .getByRole('group', { name: /^A toggle, starting on/ })
            .getByRole('button', { name: 'Members only' });
        await expect(toggle).toHaveAttribute('aria-pressed', 'true');
        await toggle.click();
        await expect(toggle).toHaveAttribute('aria-pressed', 'false');
        await toggle.press('Space');
        await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    });

    test('opens and closes the panel a live button names', async ({ page }) => {
        await page.goto('/design-kit/controls/');
        const group = page.getByRole('group', {
            name: 'A button whose panel starts open',
            exact: true,
        });
        const button = group.getByRole('button', { name: 'Filters' });
        const panel = group.locator(`#${(await button.getAttribute('aria-controls')) ?? 'none'}`);
        await expect(panel).toBeVisible();
        await button.click();
        await expect(button).toHaveAttribute('aria-expanded', 'false');
        await expect(panel).toBeHidden();
        await button.click();
        await expect(button).toHaveAttribute('aria-expanded', 'true');
        await expect(panel).toBeVisible();
    });

    test('gives each thing that is clicked a pointer and a target the size the kit holds to', async ({
        page,
    }) => {
        for (const [width, least] of [
            [1280, 24],
            [390, 44],
        ] as const) {
            await page.setViewportSize({ width, height: 900 });
            await page.goto('/design-kit/controls/');
            const found = await page.evaluate(() =>
                [
                    ...document.querySelectorAll<HTMLElement>(
                        '.site-code > summary, .site-code [role="tab"], .site-theme label, .site-header a'
                    ),
                ].map((element) => ({
                    what: element.textContent.trim().slice(0, 30),
                    height: element.getBoundingClientRect().height,
                    cursor: getComputedStyle(element).cursor,
                }))
            );
            expect(found.length).toBeGreaterThan(0);
            expect(
                found.filter(({ height, cursor }) => height < least || cursor !== 'pointer'),
                String(width)
            ).toEqual([]);
        }
    });

    test("gives the theme's radios the kit's pointer and accent", async ({ page }) => {
        await page.goto('/design-kit/');
        const radios = await page.locator('.site-theme input').evaluateAll((all) =>
            all.map((radio) => {
                const style = getComputedStyle(radio);
                const accent = getComputedStyle(document.documentElement)
                    .getPropertyValue('--dk-accent')
                    .trim();
                return {
                    cursor: style.cursor,
                    accented: style.accentColor !== 'auto' && accent !== '',
                };
            })
        );
        expect(radios.length).toBeGreaterThan(0);
        expect(radios.filter(({ cursor, accented }) => cursor !== 'pointer' || !accented)).toEqual(
            []
        );
    });

    test('keeps a copy button the same width whatever it says', async ({ page }) => {
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'clipboard', { value: undefined });
        });
        await page.goto('/design-kit/controls/');
        await page.locator('summary', { hasText: 'The code, An action' }).click();
        // Found by its place rather than its name, which changes with its word.
        const button = page
            .locator('.site-state', {
                has: page.getByRole('heading', { name: 'An action', exact: true }),
            })
            .locator('.site-copy-button')
            .first();
        await expect(button).toHaveAccessibleName('Copy Markup, An action');
        const before = (await button.boundingBox())?.width;
        await button.click();
        await expect(button).toHaveAccessibleName('Selected Markup, An action');
        expect((await button.boundingBox())?.width).toBe(before);
    });

    test('has its status line in the page before anything is copied, and only where code is', async ({
        page,
    }) => {
        await page.goto('/design-kit/controls/');
        await expect(page.locator('main [role="status"]')).toHaveCount(1);
        await page.goto('/design-kit/tokens/');
        await expect(page.locator('[role="status"]')).toHaveCount(0);
    });

    test('tells a phone how to copy what it selected, in words a phone has', async ({
        browser,
    }) => {
        const context = await browser.newContext({ hasTouch: true, isMobile: true });
        try {
            const page = await context.newPage();
            await page.addInitScript(() => {
                Object.defineProperty(navigator, 'clipboard', { value: undefined });
            });
            await page.goto('/design-kit/controls/');
            await page.locator('summary', { hasText: 'The code, An action' }).click();
            await page.getByRole('button', { name: 'Copy Markup, An action' }).click();
            await expect(page.getByRole('status')).toHaveText(
                "Selected. Copy it with your device's copy command."
            );
        } finally {
            await context.close();
        }
    });
});

test.describe(() => {
    test.use({ javaScriptEnabled: false });

    test('says the switch needs scripts, where scripts are off', async ({ page }) => {
        await page.goto('/design-kit/tokens/');
        await expect(page.locator('#theme').locator('..')).toContainText('With scripts on');
    });
});
