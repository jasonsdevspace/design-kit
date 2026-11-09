import { readFileSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { SOURCE } from '../examples/examples.js';
import { Button, DemoFooter, PortfolioStrip, SkipLink } from '../src/react.js';

/*
 * The page chrome as a browser lays it out, from the markup the components draw and the kit's own
 * sheets: the strip one row over its rule on a wide screen and rows of links on a phone, whatever
 * font the machine running the test has, the demo's switches beside the links or below them, the
 * room of switches on their way holding the strip at the height they give it, the room and the
 * switches at the width a demo names on a wide screen, keeping to the strip's right edge and
 * wrapping alike before and after they come, and the row's width on a phone, the skip link out of
 * sight until the keyboard reaches it and then at the column's inset, one inside a positioned box
 * down the page out of sight and out of the way of a click until it takes focus and then at the top
 * of its box, the footer's rule the width of the page with its text in the column, the link to the
 * current page on an explainer drawn apart from the others by its weight in each theme and in
 * forced colors with the strip laid out as on the demo, and no audit findings in either theme, the
 * room and the explainer's chrome included. The same markup is drawn again from an origin of its
 * own under `style-src 'self'`, where any inline style would be refused.
 */

const sheet = (name: string) => readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8');
const KIT = ['tokens.css', 'base.css', 'components.css'].map(sheet).join('\n');

/**
 * The demo's switches as a demo draws them, plain buttons or the kit's own, which stand as tall as
 * the room the strip keeps for them while they are on their way, or none yet.
 */
type Tools = 'none' | 'plain' | 'kit' | 'waiting';

const SWITCHES: Readonly<Record<Tools, ReactNode>> = {
    none: null,
    waiting: null,
    plain: (
        <>
            <button type="button">Shopping as a guest</button>
            <button type="button">Tour</button>
        </>
    ),
    kit: (
        <>
            <Button>Shopping as a guest</Button>
            <Button pressed={false}>Tour</Button>
        </>
    ),
};

/** Where the chrome sits: on a demo, or on its explainer, where it marks the explainer's link. */
type Where = 'demo' | 'about';

/**
 * The chrome around a main column, as a demo or its explainer draws it, with the demo's switches if
 * asked, or the room for them while they are on their way.
 */
const chrome = (tools: Tools, where: Where = 'demo', aside = false) => {
    const about = where === 'about' ? './' : './about/';
    const current = where === 'about' ? { current: 'about' as const } : {};
    return renderToStaticMarkup(
        <>
            <SkipLink />
            <PortfolioStrip
                about={about}
                source={SOURCE}
                tools={SWITCHES[tools]}
                toolsWaiting={tools === 'waiting'}
                {...current}
            />
            <main id="main-content" tabIndex={-1}>
                <h1>Example</h1>
                <p>A demo.</p>
            </main>
            <DemoFooter
                name="Example"
                about={about}
                source={SOURCE}
                aside={aside && 'Version 1.0.0, built at commit abc1234.'}
                {...current}
            />
        </>
    );
};

/** A demo page with the chrome, at the width given, in the theme given. */
const open = async (
    page: Page,
    {
        width,
        theme = 'light',
        tools = 'none',
        where = 'demo',
        css = '',
        aside = false,
    }: {
        width: number;
        theme?: 'light' | 'dark';
        tools?: Tools;
        where?: Where;
        css?: string;
        aside?: boolean;
    }
) => {
    await page.setViewportSize({ width, height: 800 });
    await page.setContent(
        `<!doctype html><html lang="en" data-theme="${theme}"><head><title>Example</title>` +
            `<style>${KIT}${css}</style></head><body>${chrome(tools, where, aside)}</body></html>`
    );
};

const box = async (locator: Locator, what: string) => {
    const drawn = await locator.boundingBox();
    if (!drawn) throw new Error(`expected ${what} to be drawn`);
    return drawn;
};

/** Where the strip's links sit, and how tall the strip is, as the screen draws it. */
const stripLayout = async (page: Page) => {
    const strip = page.locator('.dk-strip');
    const links = await Promise.all(
        (await page.getByRole('navigation', { name: 'Portfolio' }).getByRole('link').all()).map(
            (link, i) => box(link, `link ${String(i + 1)}`)
        )
    );
    const drawnStrip = await box(strip, 'the strip');
    const top = drawnStrip.y;
    const first = links[0];
    if (!first) throw new Error('expected the strip to have links');
    return {
        height: Math.round(drawnStrip.height),
        inset: Math.round(first.x),
        starts: links.map((link) => Math.round(link.x)),
        tops: links.map((link) => Math.round(link.y - top)),
        // Between links on one row, so a link that wrapped is told by its top, not its gap.
        gaps: links.slice(1).flatMap((link, i) => {
            const before = links[i];
            if (before?.y !== link.y) return [];
            return [Math.round(link.x - (before.x + before.width))];
        }),
    };
};

test('draws the strip on a wide screen in one row over its rule, its links in the column', async ({
    page,
}) => {
    // The explainer's link to the current page is drawn heavier, and the strip holds its row.
    for (const where of ['demo', 'about'] as const) {
        await open(page, { width: 1280, where });
        // The column is 72rem wide and centered, and the links start at its inset.
        expect(await stripLayout(page)).toMatchObject({
            height: 41,
            inset: (1280 - 1152) / 2 + 16,
            tops: [0, 0, 0],
            gaps: [24, 24],
        });
    }
});

test('draws the strip on a phone in rows of links 16px apart', async ({ page }) => {
    // Where the links wrap depends on the font, so what is held is what any font gives: links on
    // one row 16px apart, each row a link's height below the last, and a link that wraps starting
    // at the row's inset.
    for (const width of [412, 360]) {
        for (const where of ['demo', 'about'] as const) {
            await open(page, { width, where });
            const { inset, starts, tops, gaps } = await stripLayout(page);
            expect(inset).toBe(16);
            expect(gaps.every((gap) => gap === 16)).toBe(true);
            expect(tops.every((top) => top % 40 === 0)).toBe(true);
            tops.forEach((top, i) => {
                if (i > 0 && top !== tops[i - 1]) expect(starts[i]).toBe(inset);
            });
        }
    }
});

test("puts the demo's switches beside the links on a wide screen and below them on a phone", async ({
    page,
}) => {
    await open(page, { width: 1280, tools: 'plain' });
    const tools = page.getByRole('region', { name: 'Demo' });
    const links = page.getByRole('navigation', { name: 'Portfolio' });
    const [wideTools, wideLinks] = [
        await box(tools, 'the switches'),
        await box(links, 'the links'),
    ];
    expect(Math.round(wideTools.y)).toBe(Math.round(wideLinks.y));
    expect(wideTools.x).toBeGreaterThan(wideLinks.x + wideLinks.width);
    expect(await stripLayout(page)).toMatchObject({ height: 41 });

    // Wide enough for the links and the switches on one row, under the phone breakpoint, so only
    // the phone layout puts the switches on a row of their own.
    await open(page, { width: 760, tools: 'plain' });
    const [phoneTools, phoneLinks] = [
        await box(tools, 'the switches'),
        await box(links, 'the links'),
    ];
    expect(phoneTools.y).toBeGreaterThanOrEqual(phoneLinks.y + phoneLinks.height);
    expect(Math.round(phoneTools.x)).toBe(16);
});

test('keeps the room of switches on their way, so nothing below the strip moves when they come', async ({
    page,
}) => {
    for (const width of [1280, 760, 412, 360]) {
        await open(page, { width, tools: 'waiting' });
        const waiting = await box(page.locator('.dk-strip'), 'the waiting strip');
        const main = await box(page.locator('main'), 'the content');
        // The room is no landmark and says nothing, so a screen reader finds the links alone.
        await expect(page.getByRole('region')).toHaveCount(0);
        await expect(page.locator('.dk-strip')).toHaveText(
            'Jason PoteetHow it worksSource on GitHub'
        );
        await open(page, { width, tools: 'kit' });
        const arrived = await box(page.locator('.dk-strip'), 'the strip with its switches');
        expect(Math.round(waiting.height), `the strip at ${String(width)}px`).toBe(
            Math.round(arrived.height)
        );
        expect(Math.round((await box(page.locator('main'), 'the content')).y)).toBe(
            Math.round(main.y)
        );
    }
});

test("holds the switches' room and the switches to the width a demo names, on a wide screen", async ({
    page,
}) => {
    const css = ':root { --dk-strip-tools: 20em; }';
    for (const tools of ['waiting', 'kit'] as const) {
        await open(page, { width: 1280, tools, css });
        const section = page.locator('.dk-strip-tools');
        const em = await section.evaluate((element) =>
            parseFloat(getComputedStyle(element).fontSize)
        );
        expect(Math.round((await box(section, `the ${tools} section`)).width)).toBe(
            Math.round(20 * em)
        );
    }
    // On a phone the switches take a row of their own, the width a demo names left aside.
    await open(page, { width: 360, tools: 'kit', css });
    const row = await box(page.locator('.dk-strip-tools'), 'the switches on a phone');
    expect(Math.round(row.width)).toBe(360 - 32);
    // A demo that names no width keeps the section as wide as its switches and the gaps between.
    await open(page, { width: 1280, tools: 'kit' });
    const fit = await page.locator('.dk-strip-tools').evaluate((element) => {
        const gap = parseFloat(getComputedStyle(element).columnGap);
        const children = [...element.children].map((child) => child.getBoundingClientRect().width);
        const content =
            children.reduce((sum, width) => sum + width, 0) + gap * (children.length - 1);
        return Math.round(element.getBoundingClientRect().width - content);
    });
    expect(fit).toBe(0);
});

test('wraps a strip too narrow for its links and named switches the same before and after', async ({
    page,
}) => {
    // Just over the phone's breakpoint, a named width too wide to sit beside the links.
    const css = ':root { --dk-strip-tools: 28em; }';
    const at = async (tools: 'waiting' | 'kit') => {
        await open(page, { width: 790, tools, css });
        const strip = await box(page.locator('.dk-strip'), `the ${tools} strip`);
        const section = await box(page.locator('.dk-strip-tools'), `the ${tools} section`);
        return { height: Math.round(strip.height), right: Math.round(section.x + section.width) };
    };
    const waiting = await at('waiting');
    const arrived = await at('kit');
    // It does wrap, onto a second row below the links' 2.5rem row.
    expect(waiting.height).toBeGreaterThan(40);
    expect(arrived.height).toBe(waiting.height);
    // Wrapped onto a row of its own, the section keeps to the strip's right edge, at the inset.
    expect(waiting.right).toBe(790 - (await stripLayout(page)).inset);
    expect(arrived.right).toBe(waiting.right);
});

test('keeps the skip link out of sight until the keyboard reaches it, and lands on the content', async ({
    page,
}) => {
    await open(page, { width: 1280 });
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).not.toBeInViewport();
    // Waiting over the strip, it takes no click meant for the strip's first link.
    const first = await box(
        page
            .getByRole('navigation', { name: 'Portfolio' })
            .getByRole('link', { name: 'Jason Poteet', exact: true }),
        "the strip's first link"
    );
    const under = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.textContent, {
        x: first.x + 4,
        y: first.y + first.height / 2,
    });
    expect(under).toBe('Jason Poteet');
    await page.keyboard.press('Tab');
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    // At the column's inset, where the strip's links start, rather than at the edge of the page.
    expect(Math.round((await box(skip, 'the skip link')).x)).toBe((await stripLayout(page)).inset);
    await skip.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
});

test('keeps a skip link inside a positioned box out of sight and out of the way of a click', async ({
    page,
}) => {
    // A bar above a positioned box of the page's own, far enough down that a link waiting 10rem
    // above its place would sit over the bar, with a skip link at the box's top, as a demo puts one
    // at the top of a column of filters.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setContent(
        `<!doctype html><html lang="en" data-theme="light"><head><title>Example</title>` +
            `<style>${KIT}</style></head><body>` +
            '<header><button type="button" class="bar">Search</button></header>' +
            '<main><div class="column">' +
            renderToStaticMarkup(<SkipLink target="results">Skip to results</SkipLink>) +
            '<p>Filters</p></div><div id="results" tabindex="-1">Results</div></main>' +
            '</body></html>'
    );
    await page.addStyleTag({
        content:
            'body { margin: 0 } .bar { display: block; width: 100%; height: 200px } ' +
            '.column { position: relative; padding-top: 64px }',
    });
    const skip = page.getByRole('link', { name: 'Skip to results' });
    const where = await box(skip, 'the skip link');
    const column = await box(page.locator('.column'), 'the column');
    // Out of sight: the pixels where it sits are the same as with no skip link at all.
    const waiting = await page.screenshot({ clip: where });
    await page.addStyleTag({ content: '.hide-skip .dk-skip { visibility: hidden }' });
    await page.evaluate(() => document.body.classList.add('hide-skip'));
    expect(waiting.equals(await page.screenshot({ clip: where }))).toBe(true);
    await page.evaluate(() => document.body.classList.remove('hide-skip'));
    // Out of the way: nothing at the link's own place is the link, and a click on the bar where a
    // link waiting 10rem above its place would sit reaches the bar.
    const hit = await page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.closest('.dk-skip') !== null,
        { x: where.x + where.width / 2, y: where.y + where.height / 2 }
    );
    expect(hit).toBe(false);
    const bar = page.getByRole('button', { name: 'Search' });
    await bar.click({
        position: { x: Math.round(where.x) + 8, y: Math.round(column.y) - 160 + 8 },
    });
    await page.keyboard.press('Tab');
    await expect(skip).toBeFocused();
    const shown = await box(skip, 'the focused skip link');
    // In sight once focused, at the top of its box, inset as it is at the top of a page.
    expect(waiting.equals(await page.screenshot({ clip: shown }))).toBe(false);
    expect(Math.round(shown.y - column.y)).toBe(16);
    await skip.press('Enter');
    await expect(page.locator('#results')).toBeFocused();
});

test("runs the footer's rule the width of the page, with its text in the column", async ({
    page,
}) => {
    await open(page, { width: 1280 });
    const footer = await box(page.locator('.dk-footer'), 'the footer');
    expect(Math.round(footer.width)).toBe(1280);
    const text = await box(page.locator('.dk-footer p'), "the footer's text");
    expect(Math.round(text.x)).toBe((1280 - 1152) / 2 + 16);
    // Its sentence holds to the measure, as the page's prose does, however wide the column.
    expect(text.width).toBeLessThanOrEqual(34 * 16);
});

test("puts a demo's own line beside the footer's text on a wide screen and under it on a phone", async ({
    page,
}) => {
    await open(page, { width: 1280, aside: true });
    let sentence = await box(page.locator('.dk-footer p').first(), "the footer's text");
    let aside = await box(page.locator('.dk-footer-aside'), "the demo's line");
    // Beside it, ending at the column's right edge, and on the text's first line.
    expect(aside.x).toBeGreaterThan(sentence.x + sentence.width);
    expect(Math.round(aside.x + aside.width)).toBe(1280 - (1280 - 1152) / 2 - 16);
    expect(Math.abs(aside.y - sentence.y)).toBeLessThan(4);

    await open(page, { width: 375, aside: true });
    sentence = await box(page.locator('.dk-footer p').first(), "the footer's text");
    aside = await box(page.locator('.dk-footer-aside'), "the demo's line");
    // Under it, at the same inset.
    expect(aside.y).toBeGreaterThanOrEqual(sentence.y + sentence.height);
    expect(Math.round(aside.x)).toBe(Math.round(sentence.x));

    // Between a phone and a screen with room for both, it wraps under the text, at its inset.
    await open(page, { width: 800, aside: true });
    sentence = await box(page.locator('.dk-footer p').first(), "the footer's text");
    aside = await box(page.locator('.dk-footer-aside'), "the demo's line");
    expect(aside.y).toBeGreaterThanOrEqual(sentence.y + sentence.height);
    expect(Math.round(aside.x)).toBe(Math.round(sentence.x));
});

test("wraps a long unbroken name in the footer's text and its own line on a phone", async ({
    page,
}) => {
    const hash = 'a'.repeat(40);
    await page.setViewportSize({ width: 320, height: 800 });
    await page.setContent(
        `<!doctype html><html lang="en" data-theme="light"><head><title>Example</title>` +
            `<style>${KIT}</style></head><body><main><h1>Example</h1></main>` +
            renderToStaticMarkup(
                <DemoFooter
                    name="Example"
                    about="./about/"
                    source={SOURCE}
                    aside={`Built at ${hash}.`}
                >
                    Built at {hash}.
                </DemoFooter>
            ) +
            `</body></html>`
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
});

test("stacks anything else a page writes after the footer's text under it, as before", async ({
    page,
}) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.setContent(
        `<!doctype html><html lang="en" data-theme="light"><head><title>Example</title>` +
            `<style>${KIT}</style></head><body><footer class="dk-footer">` +
            `<p>Example is a portfolio project.</p><p>A note of its own.</p></footer></body></html>`
    );
    const [first, second] = await Promise.all([
        box(page.locator('.dk-footer p').first(), 'the sentence'),
        box(page.locator('.dk-footer p').nth(1), 'the note'),
    ]);
    expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
    expect(Math.round(second.x)).toBe(Math.round(first.x));
});

test('prints the light values in the dark theme, since paper is light', async ({ page }) => {
    const text = () => page.evaluate(() => getComputedStyle(document.body).color);
    await open(page, { width: 1280, theme: 'light' });
    const light = await text();
    await open(page, { width: 1280, theme: 'dark' });
    expect(await text()).not.toBe(light);
    await page.emulateMedia({ media: 'print' });
    expect(await text()).toBe(light);
    await page.emulateMedia({ media: 'screen' });
});

/** What sets a link apart from the text and links around it, as the screen draws it. */
const linkLook = (link: Locator) =>
    link.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
            weight: style.fontWeight,
            underline: style.textDecorationLine.includes('underline'),
            color: style.color,
        };
    });

/** A weight token as the page resolves it, and the page's text color. */
const pageLook = (page: Page) =>
    page.evaluate(() => {
        const root = getComputedStyle(document.documentElement);
        return {
            strong: root.getPropertyValue('--dk-weight-strong').trim(),
            normal: root.getPropertyValue('--dk-weight-normal').trim(),
            text: getComputedStyle(document.body).color,
        };
    });

test('draws the link to the current page apart from the others in the strip and the footer', async ({
    page,
}) => {
    for (const theme of ['light', 'dark'] as const) {
        for (const forcedColors of ['none', 'active'] as const) {
            await page.emulateMedia({ forcedColors });
            await open(page, { width: 1280, theme, where: 'about' });
            for (const [where, name] of [
                ['navigation', 'Portfolio'],
                ['contentinfo', undefined],
            ] as const) {
                const area = page.getByRole(where, name === undefined ? {} : { name });
                const current = area.getByRole('link', { name: 'How it works' });
                await expect(current).toHaveAttribute('aria-current', 'page');
                const other = area.getByRole('link', { name: /^source/i });
                const marked = await linkLook(current);
                const plain = await linkLook(other);
                const { strong, normal, text } = await pageLook(page);
                const at = `${where} in the ${theme} theme, forced colors ${forcedColors}`;
                // Apart by its weight, which forced colors keep, and still underlined as a link is.
                expect(marked, at).toMatchObject({ weight: strong, underline: true });
                expect(plain, at).toMatchObject({ weight: normal, underline: true });
                if (forcedColors === 'none') {
                    // In the page's text, against the muted text of the links beside it.
                    expect(marked.color, at).toBe(text);
                    expect(plain.color, at).not.toBe(text);
                } else {
                    // Forced colors draw every link in one color, so the weight alone tells it.
                    expect(marked.color, at).toBe(plain.color);
                }
            }
        }
    }
});

for (const theme of ['light', 'dark'] as const) {
    test(`has no audit findings in the ${theme} theme, on a wide screen and a phone`, async ({
        page,
    }) => {
        for (const width of [1280, 360]) {
            // The explainer's chrome differs only in its marked link, so it is audited once a width.
            for (const [tools, where] of [
                ['plain', 'demo'],
                ['waiting', 'demo'],
                ['plain', 'about'],
            ] as const) {
                await open(page, { width, theme, tools, where });
                const results = await new AxeBuilder({ page }).analyze();
                expect(results.violations.map((violation) => violation.id)).toEqual([]);
            }
        }
    });
}

test("draws the chrome under a policy that allows styles only from the page's own origin", async ({
    browser,
}) => {
    // Served from an origin of its own with the policy as a header, and the kit's sheets as a file
    // of that origin, as a demo serves them, so any inline style the chrome drew would be refused.
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const markup = chrome('plain');
    await context.route('https://kit.test/**', (route) => {
        const css = route.request().url().endsWith('/kit.css');
        return route.fulfill({
            contentType: css ? 'text/css' : 'text/html',
            headers: { 'Content-Security-Policy': "default-src 'self'; style-src 'self'" },
            body: css
                ? KIT
                : '<!doctype html><html lang="en"><head><title>Example</title>' +
                  `<link rel="stylesheet" href="/kit.css"></head><body>${markup}</body></html>`,
        });
    });
    const page = await context.newPage();
    const refused: string[] = [];
    page.on('console', (message) => {
        if (/Content Security Policy/i.test(message.text())) refused.push(message.text());
    });
    await page.goto('https://kit.test/');
    expect(await stripLayout(page)).toMatchObject({ height: 41, tops: [0, 0, 0], gaps: [24, 24] });
    expect(refused).toEqual([]);
    await context.close();
});
