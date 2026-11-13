import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { HELD } from '../../design-kit/examples/held.js';
import { colorOf, declaredIn } from '../../design-kit/examples/palette.js';
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
 * The site's own status line, which its script puts last in the main content, apart from the status
 * lines a stepper or a toast keeps for itself.
 */
const STATUS = 'main > [role="status"]';

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
        expect(await landmarks('banner')).toBe(1);
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
        await expect(
            page.locator('body > .dk-strip').getByRole('radio', { name: 'System' })
        ).toBeChecked();
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
            'One set of colors, type and controls for the demos'
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

    test('gives the install command for the version it draws, with a copy button after it', async ({
        page,
        context,
    }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.goto(BASE);
        const version = await page.locator('.site-eyebrow a').evaluate((link) => {
            const text = link.textContent;
            return {
                text,
                href: link.getAttribute('href') ?? '',
                shown: link instanceof HTMLElement ? link.innerText : '',
            };
        });
        const pinned = /Version (\S+) on npm/.exec(version.text)?.[1] ?? '';
        expect(pinned).toMatch(/^\d+\.\d+\.\d+/);
        // The version reads as npm writes it, and its link opens that version.
        expect(version.shown).toContain(pinned);
        expect(version.href).toMatch(new RegExp(`/v/${pinned.replaceAll('.', '\\.')}$`));
        const command = `npm install @jasonsdevspace/design-kit@${pinned}`;
        const block = page.getByRole('region', { name: 'The install command' });
        await expect(block).toHaveText(command);
        // The keyboard reaches the command and then the button that copies it, as they are drawn.
        await block.focus();
        await page.keyboard.press('Tab');
        await expect(page.getByRole('button', { name: 'Copy The install command' })).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.locator(STATUS)).toHaveText('Copied.');
        expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(command);
    });

    test('selects the install command where the browser has no clipboard', async ({ page }) => {
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'clipboard', { value: undefined });
        });
        await page.goto(BASE);
        await page.getByRole('button', { name: 'Copy The install command' }).click();
        expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
            await page.getByRole('region', { name: 'The install command' }).textContent()
        );
    });

    test("draws the kit's controls in the light and dark themes, beside the heading", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto(BASE);
        const demo = page.getByRole('figure', { name: /in the light and dark themes/ });
        await expect(demo).toBeVisible();
        // It says it is a picture, and where the controls can be tried.
        await expect(demo.locator('figcaption')).toBeVisible();
        await expect(demo.getByRole('link', { name: 'Controls' })).toHaveAttribute(
            'href',
            `${BASE}controls/`
        );
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

    test("shows the controls' buttons inside a phone's first screen, the field left out", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(BASE);
        const bottom = await page
            .locator('.site-hero-panel')
            .first()
            .locator('.site-hero-buttons')
            .evaluate((buttons) => buttons.getBoundingClientRect().bottom);
        expect(bottom).toBeLessThan(844);
        await expect(page.locator('.site-hero-field').first()).toBeHidden();
        // Wider than a phone there is room for the field.
        await page.setViewportSize({ width: 820, height: 1180 });
        await expect(page.locator('.site-hero-field').first()).toBeVisible();
    });

    test('gives each page a card with a preview and a short line rather than its search description', async ({
        page,
    }) => {
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
            await expect(card).not.toContainText(description);
            await expect(card.locator('.site-page-preview')).toHaveAttribute('aria-hidden', 'true');
            await expect(card.locator('.site-page-preview')).toBeVisible();
        }
    });

    test("puts the build line in the footer's own line, beside the footer's text and under it on a phone", async ({
        page,
    }) => {
        for (const [width, beside] of [
            [1280, true],
            [390, false],
        ] as const) {
            await page.setViewportSize({ width, height: 900 });
            await page.goto('/design-kit/');
            const text = page.locator('body > .dk-footer > p').first();
            const line = page.locator('body > .dk-footer > .dk-footer-aside');
            await expect(line).toContainText('This site uses version');
            await expect(line.getByRole('link')).toHaveAttribute('href', /\/commit\/[0-9a-f]{7,}$/);
            const [drawn, own] = await Promise.all([text.boundingBox(), line.boundingBox()]);
            if (!drawn || !own) throw new Error('expected the footer to be drawn');
            if (beside) {
                expect(own.x).toBeGreaterThan(drawn.x + drawn.width);
                expect(Math.abs(own.y - drawn.y)).toBeLessThan(4);
            } else {
                expect(own.y).toBeGreaterThanOrEqual(drawn.y + drawn.height);
                expect(Math.round(own.x)).toBe(Math.round(drawn.x));
            }
        }
    });

    test('says what the kit is built for', async ({ page }) => {
        await page.goto(BASE);
        const section = page.locator('main > section', {
            has: page.getByRole('heading', {
                level: 2,
                name: 'Built for strict security, contrast and screen readers',
            }),
        });
        await expect(section.getByRole('heading', { level: 3 })).toHaveText([
            'Works under a strict security policy',
            'Readable in both themes',
            'What you see matches what a screen reader says',
        ]);
    });
});

test.describe('the words each page opens with', () => {
    /** The pages that list their sections and open the same way: every page with a landing card. */
    const CARDED = ROUTES.filter(({ nav, path }) => nav !== null && path !== BASE);
    const OPENED = CARDED.map(({ path }) => path);
    /** The one way every page says how to see the other theme. */
    const SWITCH = 'choose Light or Dark next to Theme, at the top of the page';

    test('opens each page with what it holds in one or two sentences, and no reasons', async ({
        page,
    }) => {
        for (const path of OPENED) {
            await page.goto(path);
            const lead = (await page.locator('body > main > .site-lead').textContent()) ?? '';
            const sentences = lead.split(/(?<=[.?!])\s+/).filter((each) => each.trim() !== '');
            expect(sentences.length, path).toBeLessThanOrEqual(2);
            expect(lead, path).not.toMatch(/screen reader|\battributes?\b|\bclass(es)?\b/i);
        }
    });

    test('says how to see the other theme one way, after the lead, on each page that needs it', async ({
        page,
    }) => {
        // Every page but the tokens page, whose colors show both themes whatever the page's theme.
        for (const path of OPENED.filter((each) => each !== '/design-kit/tokens/')) {
            await page.goto(path);
            const opening = await page
                .locator('main > p:not(.site-lead)')
                .evaluateAll((paragraphs) =>
                    paragraphs
                        .filter((paragraph) => paragraph.nextElementSibling?.matches('nav, p'))
                        .map((paragraph) => paragraph.textContent)
                        .join(' ')
                );
            expect(opening, path).toContain(SWITCH);
        }
    });

    test('names the code under a card and the controls button the same way everywhere', async ({
        page,
    }) => {
        for (const path of PAGES) {
            await page.goto(path);
            const text = (await page.locator('body > main').textContent()) ?? '';
            expect(text, path).not.toMatch(
                /under Theme in the strip|attribute that draws|See the controls/
            );
        }
        await page.goto(ABOUT);
        await expect(page.getByRole('link', { name: 'See every control' })).toHaveAttribute(
            'href',
            `${BASE}controls/`
        );
    });

    test('gives each landing card a short line of its own, and keeps each search description whole', async ({
        page,
    }) => {
        await page.goto(BASE);
        const lines = await page.locator('.site-pages > li > p').allTextContents();
        expect(lines).toEqual(CARDED.map((route) => ('card' in route ? route.card : '')));
        for (const [index, { description, path }] of CARDED.entries()) {
            const line = lines[index] ?? '';
            expect(line, path).not.toBe('');
            expect(line.length, path).toBeLessThan(description.length / 2);
        }
        for (const { description, path } of CARDED) {
            await page.goto(path);
            await expect(page.locator('meta[name="description"]'), path).toHaveAttribute(
                'content',
                description
            );
        }
    });

    test('claims no page shows a piece live where it shows a picture', async ({ page }) => {
        await page.goto(BASE);
        expect((await page.locator('main').textContent()) ?? '').not.toContain('shown live');
    });
});

test.describe('the built sheet', () => {
    test('keeps each light-dark() as written, so a copy in the other scheme draws its own colors', async ({
        page,
    }) => {
        await page.goto(BASE);
        // Read from outside the page, whose policy lets it fetch nothing.
        const href = await page.locator('link[rel="stylesheet"]').first().getAttribute('href');
        const sheet = await (await page.request.get(new URL(href ?? '', page.url()).href)).text();
        expect(sheet).toContain('light-dark(');
        expect(sheet).not.toContain('--lightningcss-light');
    });
});

test.describe('the tokens page', () => {
    test('draws each color role as a card, its light and dark swatches in the values it prints', async ({
        page,
    }) => {
        for (const colorScheme of ['light', 'dark'] as const) {
            await page.emulateMedia({ colorScheme });
            await page.goto('/design-kit/tokens/');
            const cards = await page.locator('.site-roles > li').evaluateAll((all) => {
                const hex = (rgb: string) =>
                    `#${(rgb.match(/\d+/g) ?? [])
                        .slice(0, 3)
                        .map((channel) => Number(channel).toString(16).padStart(2, '0'))
                        .join('')}`;
                return all.map((card) => {
                    const name = card.querySelector('code')?.textContent ?? '';
                    const drawn = ['light', 'dark'].map((theme) => {
                        const swatch = card.querySelector(`.site-swatch.site-${theme}`);
                        return swatch ? hex(getComputedStyle(swatch).backgroundColor) : 'none';
                    });
                    const printed = ['light', 'dark'].map(
                        (theme) =>
                            card
                                .querySelector(`.site-role-${theme} code`)
                                ?.textContent.toLowerCase() ?? 'none'
                    );
                    // The light swatch is on the left and the dark on the right.
                    const [left = 0, right = 0] = ['light', 'dark'].map(
                        (theme) =>
                            card
                                .querySelector(`.site-swatch.site-${theme}`)
                                ?.getBoundingClientRect().left ?? 0
                    );
                    return { name, drawn, printed, ordered: left < right };
                });
            });
            expect(cards.length, colorScheme).toBeGreaterThan(10);
            expect(
                cards.filter(
                    ({ drawn, printed, ordered }) =>
                        !ordered || drawn[0] !== printed[0] || drawn[1] !== printed[1]
                ),
                colorScheme
            ).toEqual([]);
            expect(cards.every(({ name }) => name.startsWith('--dk-'))).toBe(true);
        }
    });

    test('names each hex value by its theme, the dark value always under the dark swatch', async ({
        page,
    }) => {
        for (const [width, scale] of [
            [1280, 1],
            [390, 2],
        ] as const) {
            await page.setViewportSize({ width, height: 900 });
            await textSize(page, scale);
            await page.goto('/design-kit/tokens/');
            const wrong = await page.locator('.site-roles > li').evaluateAll((cards) =>
                cards.flatMap((card) => {
                    const name = card.querySelector('code')?.textContent ?? '';
                    const label = (theme: string) => {
                        const value = card.querySelector<HTMLElement>(`.site-role-${theme}`);
                        const swatch = card.querySelector(`.site-swatch.site-${theme}`);
                        if (!value || !swatch) return 'missing';
                        const box = value.getBoundingClientRect();
                        const under = swatch.getBoundingClientRect();
                        // Named by a word that is drawn, not one only a screen reader hears.
                        const word = value.querySelector('.site-role-theme');
                        const named =
                            word?.textContent.trim() === (theme === 'light' ? 'Light' : 'Dark') &&
                            word.getBoundingClientRect().width > 1;
                        const placed = box.left >= under.left - 1 && box.right <= under.right + 1;
                        if (named && placed) return '';
                        return `${theme}${named ? '' : ' unnamed'}${placed ? '' : ' misplaced'}`;
                    };
                    const found = ['light', 'dark'].map(label).filter(Boolean);
                    return found.length === 0 ? [] : [`${name}: ${found.join(', ')}`];
                })
            );
            expect(wrong, `${String(width)} at ${String(scale)}`).toEqual([]);
        }
    });

    test('draws a bar beside each figure, to scale, with a mark at what the pairing needs', async ({
        page,
    }) => {
        await page.goto('/design-kit/tokens/');
        const rows = await page
            .getByRole('table', { name: 'The contrast of every pairing, the tightest first' })
            .locator('tbody tr')
            .evaluateAll((trs) =>
                trs.map((tr) => {
                    const [needsCell, ...figures] = [...tr.querySelectorAll('td.dk-table-number')];
                    const needs = Number.parseFloat(needsCell?.textContent ?? '');
                    return figures.map((cell) => {
                        const ratio = Number.parseFloat(cell.textContent);
                        const bar = cell.querySelector('svg.site-bar');
                        const fill = Number(
                            bar?.querySelector('.site-bar-fill')?.getAttribute('width')
                        );
                        const mark = Number(
                            bar?.querySelector('.site-bar-needs')?.getAttribute('x1')
                        );
                        return {
                            hidden: bar?.getAttribute('aria-hidden') === 'true',
                            fill: Math.abs(fill - (ratio / 21) * 100) < 0.5,
                            mark: Math.abs(mark - (needs / 21) * 100) < 0.5,
                        };
                    });
                })
            );
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.flat().filter(({ hidden, fill, mark }) => !hidden || !fill || !mark)).toEqual(
            []
        );
        expect(rows.every((figures) => figures.length === 2)).toBe(true);
    });

    test('draws the track and the mark where the need falls clearly against the page', async ({
        page,
    }) => {
        for (const colorScheme of ['light', 'dark'] as const) {
            await page.emulateMedia({ colorScheme });
            await page.goto('/design-kit/tokens/');
            const drawn = await page
                .locator('svg.site-bar')
                .first()
                .evaluate((bar) => {
                    const mark = bar.querySelector('.site-bar-needs');
                    const track = bar.querySelector('.site-bar-track');
                    const fill = bar.querySelector('.site-bar-fill');
                    if (!mark || !track || !fill) return null;
                    const markBox = mark.getBoundingClientRect();
                    const fillBox = fill.getBoundingClientRect();
                    const edge = getComputedStyle(track);
                    return {
                        // The mark runs past the fill above and below, so it shows on the page.
                        reaches:
                            markBox.top < fillBox.top - 1 && markBox.bottom > fillBox.bottom + 1,
                        wide: Number.parseFloat(getComputedStyle(mark).strokeWidth) >= 2,
                        edged:
                            edge.stroke !== 'none' &&
                            Number.parseFloat(edge.strokeWidth) >= 1 &&
                            edge.vectorEffect === 'non-scaling-stroke',
                    };
                });
            expect(drawn, colorScheme).toEqual({ reaches: true, wide: true, edged: true });
        }
    });

    test('draws each step of the spacing scale to size beside its name and value', async ({
        page,
    }) => {
        await page.goto('/design-kit/tokens/');
        const steps = await page.locator('.site-spaces > li').evaluateAll((all) =>
            all.map((step) => {
                const name = step.querySelector('code')?.textContent ?? '';
                const value = step.querySelector('.site-space-value')?.textContent ?? '';
                const drawn = step.querySelector('.site-space-drawn')?.getBoundingClientRect();
                const probe = document.createElement('div');
                probe.style.width = `var(${name})`;
                document.body.append(probe);
                const wanted = probe.getBoundingClientRect().width;
                probe.remove();
                return {
                    name,
                    value,
                    sized:
                        drawn !== undefined && wanted > 0 && Math.abs(drawn.width - wanted) < 0.5,
                };
            })
        );
        // Every step the pinned sheet declares, in order from the first, which the sheet is asked
        // for by probing each name until one draws nothing.
        const declared = await page.evaluate(() => {
            const names: string[] = [];
            // An inline block, so a name the sheet does not declare leaves it no width at all.
            const probe = document.createElement('span');
            probe.style.display = 'inline-block';
            document.body.append(probe);
            for (let step = 1; step < 100; step += 1) {
                probe.style.width = `var(--dk-space-${String(step)})`;
                if (probe.getBoundingClientRect().width === 0) break;
                names.push(`--dk-space-${String(step)}`);
            }
            probe.remove();
            return names;
        });
        expect(declared.length).toBeGreaterThanOrEqual(6);
        expect(steps.map(({ name }) => name)).toEqual(declared);
        expect(steps.filter(({ sized, value }) => !sized || !/rem$/.test(value))).toEqual([]);
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
                // Only what the browser lays out, since the room carries a line for a visitor without
                // script that a browser with script keeps out of the flow.
                const children = [...section.children]
                    .filter((child) => child.getClientRects().length > 0)
                    .map((child) => child.getBoundingClientRect().width);
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

test.describe('the controls page, with the pieces the script attaches', () => {
    test('shows a toast with Undo, which shows one with no action in its place', async ({
        page,
    }) => {
        await page.goto('/design-kit/controls/');
        const toast = page.locator('.site-toast .dk-toast');
        await expect(toast).not.toHaveAttribute('data-shown');
        await page.getByRole('button', { name: 'Save round 3' }).click();
        await expect(toast).toHaveAttribute('data-shown');
        await expect(toast.locator('.dk-toast-message')).toHaveText('Round 3 saved.');
        await toast.getByRole('button', { name: 'Undo' }).click();
        await expect(toast.locator('.dk-toast-message')).toHaveText('Round 3 is back as it was.');
        await expect(toast.getByRole('button', { name: 'Undo' })).toBeHidden();
        await expect(toast.getByRole('button', { name: 'Dismiss' })).toBeVisible();
    });

    test('opens each live dialog from its button, and returns focus to it once closed', async ({
        page,
    }) => {
        await page.goto('/design-kit/controls/');
        const live = page.locator('.site-copy:not([inert])');
        const ask = live.getByRole('button', { name: 'End the game' });
        await ask.click();
        const question = live.getByRole('dialog', { name: 'End the game now?' });
        await expect(question).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(question).toBeHidden();
        await expect(ask).toBeFocused();
        const options = live.getByRole('button', { name: 'Round options' });
        await options.click();
        await expect(live.getByRole('heading', { name: 'Round options' })).toBeFocused();
        await live.getByRole('button', { name: 'Done' }).click();
        await expect(options).toBeFocused();
    });

    test("shows every stepper's buttons, and the error in both copies past its limit", async ({
        page,
    }) => {
        await page.goto('/design-kit/controls/');
        const steppers = page.locator('.site-copy .dk-stepper');
        expect(await steppers.count()).toBeGreaterThan(0);
        for (const stepper of await steppers.all()) {
            await expect(stepper.locator('.dk-stepper-up')).toBeVisible();
        }
        const past = page
            .locator('.site-state')
            .filter({ hasText: 'A stepper given a number past its limit' });
        await expect(past.locator('.site-other .dk-stepper-range')).toBeVisible();
        // The live copy shows its error and is described by it, with nothing said as the page
        // loads, and the error goes once the number is right.
        const live = past.locator('.site-copy:not([inert])');
        await expect(live.locator('.dk-stepper-range')).toBeVisible();
        await expect(
            live.getByRole('spinbutton', { name: 'Tricks taken' })
        ).toHaveAccessibleDescription(/Enter a number from 0 to 10/);
        await expect(live.locator('.dk-stepper-status')).toHaveText('');
        await live.locator('.dk-stepper-down').click();
        await expect(live.locator('.dk-stepper-range')).toBeHidden();
    });

    test('draws no app frame and no page that ends in a tab bar', async ({ page }) => {
        await page.goto('/design-kit/controls/');
        await expect(page.locator('.dk-app, .dk-tabbar-page')).toHaveCount(0);
    });
});

test.describe('the app pieces page', () => {
    test('draws the frame and the tab bar as pictures, and the grids, rows and table live', async ({
        page,
    }) => {
        await page.goto('/design-kit/app-pieces/');
        const live = page.locator('.site-copy:not([inert])');
        await expect(live.locator('.dk-app, .dk-tabbar')).toHaveCount(0);
        await expect(page.locator('.site-copy[inert] .dk-app')).toHaveCount(4);
        await expect(live.getByRole('group', { name: 'Cards in hand' })).toBeVisible();
        await expect(live.locator('.dk-rows')).toHaveCount(4);
        await expect(live.getByRole('table', { name: 'Scores by round' })).toBeVisible();
        // A toast is shown only in a picture of a screen, so no live one waits on the page.
        await expect(page.locator('.dk-toast:not([inert] *)')).toHaveCount(0);
    });

    test("draws each screen as a phone's height in a box of its own, its bars inside it", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 320, height: 640 });
        await page.goto('/design-kit/app-pieces/');
        for (const screen of await page.locator('.site-copy > .dk-app').all()) {
            const box = await screen.boundingBox();
            expect(box?.height ?? 0).toBeGreaterThanOrEqual(30 * 16);
            await expect(screen).toHaveCSS('overflow', 'clip');
        }
        for (const bar of await page.locator('.site-copy .dk-tabbar-page > .dk-tabbar').all()) {
            await expect(bar).toHaveCSS('position', 'static');
        }
        // The page keeps none of the room the kit keeps for a bar that sticks to the screen.
        await expect(page.locator('html')).toHaveCSS('scroll-padding-bottom', '0px');
    });

    test('flips a toggle in the grid, and leaves a plain key with no state', async ({ page }) => {
        await page.goto('/design-kit/app-pieces/');
        const live = page.locator('.site-copy:not([inert])');
        const card = live.getByRole('group', { name: 'Cards in hand' }).getByRole('button', {
            name: '8',
        });
        await expect(card).toHaveAttribute('aria-pressed', 'false');
        await card.click();
        await expect(card).toHaveAttribute('aria-pressed', 'true');
        await expect(
            live.getByRole('group', { name: 'Score' }).locator('[aria-pressed]')
        ).toHaveCount(0);
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

test("gives every page the kit's icon, for a tab, a phone's home screen and a browser that takes no SVG icon", async ({
    page,
}) => {
    const served = new Map<string, { type: string; body: Buffer }>();
    for (const path of PAGES) {
        await page.goto(path);
        const icons = await page
            .locator('head link[rel~="icon"], head link[rel="apple-touch-icon"]')
            .evaluateAll((links) =>
                links.map(
                    (link) => [link.getAttribute('rel'), (link as HTMLLinkElement).href] as const
                )
            );
        expect(
            icons.map(([rel, href]) => `${rel ?? ''} ${new URL(href).pathname}`),
            path
        ).toEqual([
            'icon /design-kit/favicon.ico',
            'icon /design-kit/favicon.svg',
            'apple-touch-icon /design-kit/apple-touch-icon.png',
        ]);
        for (const [, href] of icons) {
            if (served.has(href)) continue;
            const response = await page.request.get(href);
            expect(response.status(), href).toBe(200);
            served.set(href, {
                type: (response.headers()['content-type'] ?? '').split(';')[0] ?? '',
                body: await response.body(),
            });
        }
    }
    const file = (name: string) => {
        const found = [...served].find(([href]) => new URL(href).pathname.endsWith(name));
        expect(found, name).toBeDefined();
        return found?.[1] ?? { type: '', body: Buffer.alloc(0) };
    };
    // The `.ico` holds one image of the size its link claims, its width and height a byte each.
    const ico = file('/favicon.ico');
    expect(ico.type).toBe('image/x-icon');
    expect([ico.body.readUInt16LE(4), ico.body[6], ico.body[7]]).toEqual([1, 32, 32]);
    const svg = file('/favicon.svg');
    expect(svg.type).toBe('image/svg+xml');
    expect(svg.body.toString('utf8')).toMatch(/^<svg [^>]*viewBox="0 0 32 32"/);
    // A PNG gives its width and height first, after its signature and the header's length and name.
    const touch = file('/apple-touch-icon.png');
    expect(touch.type).toBe('image/png');
    expect([touch.body.readUInt32BE(16), touch.body.readUInt32BE(20)]).toEqual([180, 180]);
    // Both are drawn from the SVG in its light colors, so each one's ground, above the tiles, is
    // the SVG's light accent. The `.ico`'s image is a PNG, at the offset its entry gives.
    const accent = /\.ground\s*\{\s*fill:\s*#([0-9a-f]{6})/i.exec(svg.body.toString('utf8'))?.[1];
    expect(accent, "the SVG's light accent").toBeDefined();
    const ground = (png: Buffer, size: number) =>
        page.evaluate(
            async ({ data, x, y }) => {
                const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
                const image = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
                const canvas = new OffscreenCanvas(image.width, image.height);
                const context = canvas.getContext('2d');
                context?.drawImage(image, 0, 0);
                return [...(context?.getImageData(x, y, 1, 1).data.slice(0, 3) ?? [])];
            },
            { data: png.toString('base64'), x: size / 2, y: Math.round(size / 16) }
        );
    const rgb = Buffer.from(accent ?? '', 'hex');
    const offset = ico.body.readUInt32LE(18);
    for (const [name, pixel] of [
        [
            'favicon.ico',
            await ground(ico.body.subarray(offset, offset + ico.body.readUInt32LE(14)), 32),
        ],
        ['apple-touch-icon.png', await ground(touch.body, 180)],
    ] as const) {
        expect(
            pixel.every((value, at) => Math.abs(value - (rgb[at] ?? -9)) <= 2),
            `${name} drawn in ${String(pixel)}, not the accent #${accent ?? ''}`
        ).toBe(true);
    }
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

    test("opens each page with the site's icon and the name, linked to the landing page", async ({
        page,
    }) => {
        for (const { path } of MENU) {
            await page.goto(path);
            const brand = page.getByRole('link', { name: 'The design kit', exact: true });
            await expect(brand, path).toHaveAttribute('href', BASE);
            await expect(brand.locator('.site-mark'), path).toHaveAttribute('aria-hidden', 'true');
            await expect(brand.locator('.site-mark'), path).toBeVisible();
            // The mark is the site's icon, drawn rather than written, so the name is all it reads.
            await expect(brand.locator('.site-mark svg'), path).toBeVisible();
            await expect(brand.locator('.site-mark'), path).toHaveText('');
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

    test("shows every page tab on a phone without scrolling, each a thumb's size", async ({
        page,
    }) => {
        for (const width of [320, 390]) {
            await page.setViewportSize({ width, height: 800 });
            for (const path of ['/design-kit/', '/design-kit/explainer-pieces/']) {
                await page.goto(path);
                const row = await page.locator('.site-header .dk-pills').evaluate((list) => {
                    const links = [...list.querySelectorAll('a')].map((link) =>
                        link.getBoundingClientRect()
                    );
                    return {
                        outside: links.filter((box) => box.left < 0 || box.right > innerWidth)
                            .length,
                        short: links.filter((box) => box.height < 44).length,
                        scrolls: list.scrollWidth > list.clientWidth + 1,
                    };
                });
                const at = `${path} at ${String(width)}`;
                expect(row, at).toEqual({ outside: 0, short: 0, scrolls: false });
                expect(await sideways(page), at).toBe(0);
            }
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

    test("leaves room at the pills' sides for the kit's focus ring, and clips none of it", async ({
        page,
    }) => {
        await page.goto('/design-kit/controls/');
        const room = await page.locator('.site-header .dk-pills').evaluate((list) => {
            const style = getComputedStyle(list);
            const root = getComputedStyle(document.documentElement);
            // The kit sets its ring in pixels, the line and the gap outside the box it rings.
            const ring =
                parseFloat(root.getPropertyValue('--dk-ring-width')) +
                parseFloat(root.getPropertyValue('--dk-ring-offset'));
            // The row keeps the ring's room at its sides, and above and below the ring reaches
            // into the header's own space, which nothing between the row and the page clips.
            const sides = [style.paddingLeft, style.paddingRight]
                .map(parseFloat)
                .every((padding) => padding >= ring - 0.5);
            const clipped = [];
            for (let at: Element | null = list; at && at !== document.body; at = at.parentElement) {
                const { overflowX, overflowY } = getComputedStyle(at);
                if (overflowX !== 'visible' || overflowY !== 'visible') clipped.push(at.className);
            }
            return { sides, clipped };
        });
        expect(room).toEqual({ sides: true, clipped: [] });
    });

    test('shows the chosen theme, the current page and the chosen tab in forced colors', async ({
        page,
    }) => {
        await page.goto('/design-kit/controls/');
        // A browser reports the author's colors to a script even while it forces its own, so the
        // test reads the rules the sheet keeps for forced colors, which set the system's own.
        // The kit's rules sit in its layers, so the rules are read at any depth.
        const forced = await page.evaluate(() => {
            const inside = (rules: CSSRuleList): CSSRule[] =>
                [...rules].flatMap((rule) =>
                    rule instanceof CSSGroupingRule ? [rule, ...inside(rule.cssRules)] : [rule]
                );
            return [...document.styleSheets]
                .flatMap((sheet) => inside(sheet.cssRules))
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
                .join(',');
        });
        expect(forced).toContain('.dk-theme-switch-choice > input:checked + span');
        expect(forced).toContain('a.dk-pill[aria-current]');
        expect(forced).toContain('.dk-tab[aria-selected="true"]');
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
});

/** The page's ground in each theme, from the tokens of the version the site pins. */
const GROUNDS = (() => {
    const declared = declaredIn(
        readFileSync(
            createRequire(import.meta.url).resolve('design-kit-release/tokens.css'),
            'utf8'
        )
    );
    return { light: colorOf(declared, 'bg', 'light'), dark: colorOf(declared, 'bg', 'dark') };
})();

test.describe("the browser's bar", () => {
    test("names the page's ground for each scheme from the tokens, before the script, which points both at the theme drawn", async ({
        page,
    }) => {
        for (const path of PAGES) {
            await page.addInitScript(() => {
                localStorage.setItem('theme', 'dark');
            });
            await page.goto(path);
            const metas = page.locator('meta[name="theme-color"][media]');
            await expect(metas, path).toHaveCount(2);
            // Written before the script, one for each scheme, from the pinned tokens' ground.
            const written = await page.evaluate(() =>
                [
                    ...document.querySelectorAll<HTMLMetaElement>(
                        'meta[name="theme-color"][media]'
                    ),
                ].map((meta) => [meta.media, meta.content] as const)
            );
            expect(written.map(([media]) => media)).toEqual([
                '(prefers-color-scheme: light)',
                '(prefers-color-scheme: dark)',
            ]);
            expect(
                await page.evaluate(() => {
                    const meta = document.querySelector('meta[name="theme-color"][media]');
                    // The theme script, inline, which the site's module script is not.
                    const script = document.querySelector('head script:not([src])');
                    return meta && script
                        ? Boolean(
                              meta.compareDocumentPosition(script) &
                              Node.DOCUMENT_POSITION_FOLLOWING
                          )
                        : false;
                }),
                path
            ).toBe(true);
            // The theme script points both at the drawn theme's ground, dark here.
            expect(
                written.map(([, content]) => content),
                path
            ).toEqual([GROUNDS.dark, GROUNDS.dark]);
        }
    });
});

test.describe('the theme switch', () => {
    /** The strip's section for the page's own switch. */
    const strip = (page: Page) => page.locator('body > .dk-strip .dk-strip-tools');

    /** The radio for each choice, in the strip's section named for the switch. */
    const choice = (page: Page, name: 'System' | 'Light' | 'Dark') =>
        strip(page).getByRole('radiogroup', { name: 'Theme' }).getByRole('radio', { name });

    /** What the page saved under the portfolio's key. */
    const saved = (page: Page) => page.evaluate(() => localStorage.getItem('theme'));

    test("draws the switch live, showing the page's choice and taking a new one, and its other copy as a picture of that theme", async ({
        page,
    }) => {
        await page.goto('/design-kit/controls/');
        const state = page.locator('.site-state', {
            hasText: 'The choice of theme, saved for every page',
        });
        const live = state
            .locator('.site-copy:not([inert])')
            .getByRole('radiogroup', { name: 'Theme' });
        await expect(live).toBeVisible();
        await expect(live.getByRole('radio', { name: 'System' })).toBeChecked();
        await live.getByRole('radio', { name: 'Dark' }).check();
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
        await expect(choice(page, 'Dark')).toBeChecked();
        expect(await saved(page)).toBe('dark');
        // The other theme's copy shows that theme chosen, as a picture, and takes no press.
        const other = state.locator('.site-other .dk-theme-switch');
        await expect(other).toBeVisible();
        expect(
            await other.evaluate(
                (group) => group.querySelector<HTMLInputElement>('input[value="light"]')?.checked
            )
        ).toBe(true);
    });

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

    /**
     * The switch as it has come, fitting the width its section keeps for it in this font on either
     * side, since the section sets what it holds against its end: on a screen narrower than 20rem
     * its name and one button naming the choice, and the row of choices everywhere else.
     */
    const switchCame = async (page: Page, width: number, scale: number) => {
        if (width / (16 * scale) < 20) {
            await expect(strip(page).getByRole('button', { name: 'Theme System' })).toBeVisible();
            await expect(choice(page, 'System')).toBeHidden();
        } else {
            await expect(choice(page, 'System')).toBeVisible();
        }
        const spills = await page
            .locator('body > .dk-strip .dk-strip-tools')
            .evaluate((section) => {
                const outer = section.getBoundingClientRect();
                const group = section.querySelector('.dk-theme-switch');
                if (!group) return true;
                // The switch keeps the focus ring's room at its sides, reaching that far past the
                // section, so what fits is the switch inside that room.
                const box = group.getBoundingClientRect();
                const { paddingLeft, paddingRight } = getComputedStyle(group);
                const left = box.left + parseFloat(paddingLeft);
                const right = box.right - parseFloat(paddingRight);
                return left < outer.left - 1 || right > outer.right + 1;
            });
        expect(spills, `${String(width)} at text ${String(scale)}`).toBe(false);
    };

    test('moves nothing below the strip as it comes, at any width or text size', async ({
        browser,
    }) => {
        // Before the switch comes, the page has run the theme script but not the site's own, which
        // is what puts the switch in the room, so the room stands as the page serves it.
        const moved: string[] = [];
        for (const came of [false, true]) {
            const context = await browser.newContext();
            if (!came) await context.route('**/assets/script-*.js', (route) => route.abort());
            const page = await context.newPage();
            for (const width of [320, 390, 768, 769, 820, 1280]) {
                for (const scale of [1, 2]) {
                    await page.setViewportSize({ width, height: 900 });
                    await textSize(page, scale);
                    await page.goto('/design-kit/');
                    if (came) await switchCame(page, width, scale);
                    else
                        await expect(page.locator('body > .dk-strip .dk-strip-room')).toHaveCount(
                            1
                        );
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
            '/design-kit/app-pieces/',
            '/design-kit/page-chrome/',
            '/design-kit/explainer-pieces/',
        ]) {
            await page.goto(path);
            const differ = await page.evaluate(() => {
                /** The elements a browser lays out as blocks, at whose edges a space draws nothing. */
                const BLOCKS = new Set(['DIV', 'P', 'FOOTER', 'NAV', 'SECTION', 'UL', 'OL', 'LI']);
                /**
                 * Markup as the parser reads it. Where its control is laid out, every space beside a
                 * tag is dropped, which that layout adds, as the reference's blocks are laid out.
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
                /**
                 * The steppers of a copy as the markup draws them, before the site's script
                 * attached them.
                 */
                const steppersAsWritten = (copy: HTMLElement) => {
                    // A stepper's button at a limit, which the script marks off as it attaches the
                    // stepper, is read as the markup draws it.
                    for (const off of copy.querySelectorAll('.dk-stepper > [aria-disabled]'))
                        off.removeAttribute('aria-disabled');
                    // A stepper's error, which the script shows on the live copy past its limit,
                    // describes the field and marks it invalid only once shown, so the field is
                    // read as the markup draws it.
                    for (const value of copy.querySelectorAll('.dk-stepper-value')) {
                        const range = value
                            .closest('.dk-field')
                            ?.querySelector('.dk-stepper-range');
                        const all = (value.getAttribute('aria-describedby') ?? '').split(/\s+/);
                        if (range && all.includes(range.id)) value.removeAttribute('aria-invalid');
                        const ids = all.filter((id) => id !== '' && id !== range?.id);
                        if (ids.length > 0) value.setAttribute('aria-describedby', ids.join(' '));
                        else value.removeAttribute('aria-describedby');
                    }
                };
                return [...document.querySelectorAll('.site-state')].flatMap((state) => {
                    // The live copy, or for a picture the copy in the visitor's theme, without its
                    // label, and with the ids the code names. A control the site's script attaches,
                    // the switch, the copy button and a stepper, is shown, so the hidden the code
                    // prints is read as shown too, and the choice the script checks is a property
                    // the markup never carries.
                    const copy = state.querySelector('.site-copy')?.cloneNode(true);
                    const code = state.querySelector<HTMLElement>('.site-code');
                    const shown = code
                        ?.querySelector('pre.dk-code')
                        ?.textContent.replaceAll(' hidden=""', '');
                    if (!(copy instanceof HTMLElement) || !code || shown === undefined) return [];
                    copy.querySelector('.site-copy-label')?.remove();
                    for (const hidden of copy.querySelectorAll('[hidden]'))
                        hidden.removeAttribute('hidden');
                    steppersAsWritten(copy);
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
        await expect(page.locator(STATUS)).toHaveText('Copied.');
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
        await expect(page.locator(STATUS)).toHaveText('Copied.');
        // Emptied first, so a screen reader hears the same words again.
        const heard = page.evaluate(
            () =>
                new Promise<string[]>((resolve) => {
                    const status = document.querySelector('main > [role="status"]');
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
        await expect(page.locator(STATUS)).toHaveText(
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
            await expect(page.locator('.site-code .dk-copy')).toHaveCount(0);
            // The copy button a state shows stays hidden, as the kit draws it until it is attached.
            await expect(page.locator('.site-copy .dk-copy')).toHaveCount(2);
            await expect(page.locator('.site-copy .dk-copy').first()).toBeHidden();
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
    test("copies the block beside a copy button's state, and shows its other copy as a picture", async ({
        page,
        context,
    }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.goto('/design-kit/controls/');
        const state = page.locator('.site-state', { hasText: 'A button that copies a block' });
        const button = state.locator('.site-copy:not([inert]) .dk-copy');
        await expect(button).toHaveAccessibleName('Copy install command');
        await button.click();
        await expect(button).toHaveAccessibleName('Copied install command');
        expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
            'npm install @jasonsdevspace/design-kit'
        );
        await expect(state.locator('.site-other .dk-copy')).toBeVisible();
    });

    /** The pages that draw states, each in its own card. */
    const STATED = [
        '/design-kit/controls/',
        '/design-kit/app-pieces/',
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
        await expect(card.locator('.dk-copy')).toHaveCount(1);
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
        // The tab the arrow moved focus to keeps the ring, though its tabindex is -1.
        await expect(react).toHaveCSS('outline-style', 'solid');
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
        await expect(page.locator(STATUS)).toHaveText('Copied.');
        // Read at once, before the button would say Copy again on its own: the words its name is
        // made of, the one shown and the name of what it copies.
        expect(
            await page
                .locator('.dk-copy')
                .first()
                .evaluate((button) =>
                    [...button.querySelectorAll('span:not([aria-hidden]):not(:has(span))')]
                        .map((part) => part.textContent)
                        .join('')
                )
        ).toBe('Copy React, An action');
    });

    test('has the button say Copy of the block a tab shows, after it copied the one before', async ({
        page,
        context,
    }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.goto('/design-kit/controls/');
        await page.locator('summary', { hasText: 'The code, An action' }).click();
        const button = page.locator('.dk-copy').first();
        /** The button's name, read at once: the word shown and the name of what it copies. */
        const name = () =>
            button.evaluate((copy) =>
                [...copy.querySelectorAll('span:not([aria-hidden]):not(:has(span))')]
                    .map((part) => part.textContent)
                    .join('')
            );
        await page.getByRole('button', { name: 'Copy Markup, An action' }).click();
        await expect(page.locator(STATUS)).toHaveText('Copied.');
        expect(await name()).toBe('Copied Markup, An action');
        await page.getByRole('tab', { name: 'React' }).first().click();
        expect(await name()).toBe('Copy React, An action');
        // Attached again, it still copies the block its tab shows.
        await button.click();
        expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
            await page.getByRole('region', { name: 'React, An action' }).textContent()
        );
    });

    test('gives a state with markup alone its block and copy button, with no tabs', async ({
        page,
    }) => {
        await page.goto('/design-kit/explainer-pieces/');
        const card = page.locator('.site-state').first();
        await card.locator('summary').click();
        await expect(card.getByRole('tablist')).toHaveCount(0);
        await expect(card.locator('pre.dk-code')).toBeVisible();
        await expect(card.locator('.dk-copy')).toHaveCount(1);
    });

    /** The pages that list their sections, the tokens page among them. */
    const LISTED = ['/design-kit/tokens/', ...STATED];

    test('lists the sections of each page inside its content, beside it wide and under its opening narrow', async ({
        page,
    }) => {
        for (const path of LISTED) {
            for (const width of [1280, 820, 390]) {
                await page.setViewportSize({ width, height: 900 });
                await page.goto(path);
                const at = `${path} at ${String(width)}`;
                const list = page
                    .getByRole('main')
                    .getByRole('navigation', { name: 'On this page' });
                await expect(list, at).toBeVisible();
                // A thumb's size on a phone, and the strip's row on a wide screen.
                const short = await list
                    .getByRole('link')
                    .evaluateAll(
                        (links, least) =>
                            links.filter((link) => link.getBoundingClientRect().height < least)
                                .length,
                        width <= 768 ? 44 : 24
                    );
                expect(short, at).toBe(0);
                // The whole opening comes before the list, and the sections after it.
                expect(await list.evaluate((nav) => nav.nextElementSibling?.tagName), at).toBe(
                    'SECTION'
                );
                const targets = await list
                    .getByRole('link')
                    .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
                const sections = await page
                    .locator('main > section > h2')
                    .evaluateAll((headings) => headings.map((heading) => `#${heading.id}`));
                expect(targets, at).toEqual(sections);
                const [nav, heading, lead] = await Promise.all(
                    [
                        list,
                        page.locator('body > main > h1'),
                        page.locator('body > main > .site-lead'),
                    ].map((each) => each.boundingBox())
                );
                if (!nav || !heading || !lead) throw new Error(`${at}: no list, heading or lead`);
                if (width >= 1024) {
                    // Beside the content, at its side.
                    expect(nav.x + nav.width, at).toBeLessThanOrEqual(heading.x);
                } else {
                    // Under the opening, before the first section.
                    expect(nav.y, at).toBeGreaterThanOrEqual(lead.y + lead.height);
                }
            }
        }
        for (const path of [BASE, ABOUT]) {
            await page.goto(path);
            await expect(page.getByRole('navigation', { name: 'On this page' }), path).toHaveCount(
                0
            );
        }
    });

    test('leads from the tokens list to the ids the explainer links to', async ({ page }) => {
        await page.goto('/design-kit/tokens/');
        const targets = await page
            .getByRole('navigation', { name: 'On this page' })
            .getByRole('link')
            .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
        expect(targets).toEqual(['#color', '#contrast', '#scale', '#theme']);
    });

    test('makes the section list the next stop after the skip link', async ({ page }) => {
        for (const path of LISTED) {
            await page.goto(path);
            await page.keyboard.press('Tab');
            await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
            await page.keyboard.press('Enter');
            await page.keyboard.press('Tab');
            const focused = await page.evaluate(
                () => document.activeElement?.closest('nav')?.getAttribute('aria-labelledby') ?? ''
            );
            expect(focused, path).toBe('site-toc-name');
        }
    });

    test('starts the content column at the same place on every page with a list', async ({
        page,
    }) => {
        for (const width of [1280, 1024, 820, 390]) {
            await page.setViewportSize({ width, height: 900 });
            const starts: number[] = [];
            const gaps: number[] = [];
            for (const path of LISTED) {
                await page.goto(path);
                const [heading, lead] = await Promise.all(
                    [
                        page.locator('body > main > h1'),
                        page.locator('body > main > .site-lead'),
                    ].map((each) => each.boundingBox())
                );
                starts.push(Math.round(heading?.x ?? -1));
                gaps.push(Math.round((lead?.y ?? 0) - (heading?.y ?? 0) - (heading?.height ?? 0)));
            }
            expect(new Set(starts).size, String(width)).toBe(1);
            expect(new Set(gaps).size, String(width)).toBe(1);
            expect(gaps[0], String(width)).toBeLessThan(64);
        }
    });

    test('spaces each opening the same on a wide screen as on a narrow one', async ({ page }) => {
        for (const path of LISTED) {
            const spaced: number[] = [];
            for (const width of [1280, 820]) {
                await page.setViewportSize({ width, height: 900 });
                await page.goto(path);
                spaced.push(
                    await page.evaluate(() => {
                        const heading = document
                            .querySelector('body > main > h1')
                            ?.getBoundingClientRect();
                        const lead = document
                            .querySelector('main > .site-lead')
                            ?.getBoundingClientRect();
                        return Math.round((lead?.top ?? 0) - (heading?.bottom ?? 0));
                    })
                );
            }
            expect(spaced[0], path).toBe(spaced[1]);
        }
    });

    test('keeps the side list inside the content however short the window', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 300 });
        for (const path of LISTED) {
            await page.goto(path);
            await page.evaluate(() => {
                window.scrollTo(0, document.documentElement.scrollHeight);
            });
            const [last, main] = await page.evaluate(() => [
                Math.round(
                    document.querySelector('.site-toc li:last-child')?.getBoundingClientRect()
                        .bottom ?? Infinity
                ),
                Math.round(document.querySelector('main')?.getBoundingClientRect().bottom ?? 0),
            ]);
            expect(last, path).toBeLessThanOrEqual(main);
        }
    });

    test("lines the list's text up with the column edge, and sets each tests panel by its section", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.goto('/design-kit/controls/');
        const [label, brand] = await Promise.all(
            [page.locator('.site-toc-name'), page.locator('.site-brand')].map((each) =>
                each.evaluate((element) => {
                    const range = document.createRange();
                    range.selectNodeContents(element);
                    return Math.round(range.getBoundingClientRect().left);
                })
            )
        );
        expect(label).toBe(brand);
        const gaps = await page.locator('main > section > .site-held').evaluateAll((panels) =>
            panels.flatMap((panel) => {
                const before = panel.previousElementSibling?.getBoundingClientRect();
                const next = panel.parentElement?.nextElementSibling
                    ?.querySelector('h2')
                    ?.getBoundingClientRect();
                const box = panel.getBoundingClientRect();
                if (!before || !next) return [];
                return [{ above: box.top - before.bottom, below: next.top - box.bottom }];
            })
        );
        expect(gaps.length).toBeGreaterThan(0);
        expect(gaps.filter(({ above, below }) => above >= below)).toEqual([]);
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
        await expect(page.locator(STATUS)).toHaveText(
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
        await expect(
            page.locator('body > .dk-strip').getByRole('radio', { name: 'Dark' })
        ).toBeChecked();
        await expect(note).toHaveCount(0);
        await expect(page.locator(STATUS)).toHaveText('The theme is dark now.');
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
        /**
         * What the keyboard reaches in the main content outside the live copies and the toast's
         * own section.
         */
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
                            element.closest('.site-copy') === null &&
                            element.closest('.site-toast') === null
                    )
                    .map(
                        (element) =>
                            ['dk-copy', 'dk-tab', 'dk-button-text', 'dk-code'].find((name) =>
                                element.classList.contains(name)
                            ) ?? element.tagName.toLowerCase()
                    )
            );
        const before = await reached();
        // Only the code's disclosures, tabs, frames and copy buttons, and the tests' links.
        expect(
            before.filter(
                (name) => !['summary', 'dk-tab', 'dk-code', 'dk-copy', 'a'].includes(name)
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
        expect(after.filter((name) => name === 'dk-button-text')).toHaveLength(1);
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
                        '.site-code > summary, .site-code [role="tab"], .dk-theme-switch label, .site-header a'
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
        const radios = await page.locator('.dk-theme-switch input').evaluateAll((all) =>
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
            .locator('.dk-copy')
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
        await expect(page.locator(STATUS)).toHaveCount(1);
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
            await expect(page.locator(STATUS)).toHaveText(
                "Selected. Copy it with your device's copy command."
            );
        } finally {
            await context.close();
        }
    });
});

test.describe(() => {
    test.use({ javaScriptEnabled: false });

    test("keeps the room's line for a visitor without script inside the strip, on a phone with larger text", async ({
        page,
    }) => {
        // The line comes with the release the strip's room draws it from, so over the pinned
        // release there may be none, and the page is held to no sideways scroll either way.
        await page.setViewportSize({ width: 320, height: 900 });
        await textSize(page, 2);
        await page.goto('/design-kit/');
        const line = page.locator('body > .dk-strip .dk-strip-noscript');
        if ((await line.count()) > 0) {
            await expect(line).toBeVisible();
            const fit = await line.evaluate((element) => {
                const section = element.closest('.dk-strip-tools')?.getBoundingClientRect();
                const own = element.getBoundingClientRect();
                return {
                    inside:
                        section !== undefined &&
                        own.bottom <= section.bottom + 0.5 &&
                        own.right <= section.right + 0.5,
                    cut: element.scrollWidth > element.clientWidth + 1,
                };
            });
            expect(fit).toEqual({ inside: true, cut: false });
        }
        expect(await sideways(page)).toBe(0);
    });

    test('says the switch needs scripts, where scripts are off', async ({ page }) => {
        await page.goto('/design-kit/tokens/');
        await expect(page.locator('#theme').locator('..')).toContainText('With scripts on');
    });
});
