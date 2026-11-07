import { readFileSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { Button, DemoFooter, PortfolioStrip, SkipLink } from '../src/react.js';

/*
 * The page chrome as a browser lays it out, from the markup the components draw and the kit's own
 * sheets: the strip one row over its rule on a wide screen and rows of links on a phone, whatever
 * font the machine running the test has, the demo's switches beside the links or below them, the
 * room of switches on their way holding the strip at the height they give it, the skip link out of
 * sight until the keyboard reaches it and then at the column's inset, the footer's rule the width
 * of the page with its text in the column, and no audit findings in either theme. The same markup is drawn again from an origin of its own under `style-src 'self'`, where
 * any inline style would be refused.
 */

const sheet = (name: string) => readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8');
const KIT = ['tokens.css', 'base.css', 'components.css'].map(sheet).join('\n');
const SOURCE = 'https://github.com/jasonsdevspace/example';

/** The demo's switches as a demo draws them: the kit's own buttons, or plain ones. */
const SWITCHES = {
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

/**
 * The chrome around a main column, as a demo draws it, with the demo's switches if asked, or the
 * room for them while they are on their way.
 */
const chrome = (tools: boolean | 'kit' | 'waiting') =>
    renderToStaticMarkup(
        <>
            <SkipLink />
            <PortfolioStrip
                about="./about/"
                source={SOURCE}
                tools={tools === true ? SWITCHES.plain : tools === 'kit' && SWITCHES.kit}
                toolsWaiting={tools === 'waiting'}
            />
            <main id="main-content" tabIndex={-1}>
                <h1>Example</h1>
                <p>A demo.</p>
            </main>
            <DemoFooter name="Example" about="./about/" source={SOURCE} />
        </>
    );

/** A demo page with the chrome, at the width given, in the theme given. */
const open = async (
    page: Page,
    {
        width,
        theme = 'light',
        tools = false,
    }: { width: number; theme?: 'light' | 'dark'; tools?: boolean | 'kit' | 'waiting' }
) => {
    await page.setViewportSize({ width, height: 800 });
    await page.setContent(
        `<!doctype html><html lang="en" data-theme="${theme}"><head><title>Example</title>` +
            `<style>${KIT}</style></head><body>${chrome(tools)}</body></html>`
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
    await open(page, { width: 1280 });
    // The column is 72rem wide and centered, and the links start at its inset.
    expect(await stripLayout(page)).toMatchObject({
        height: 41,
        inset: (1280 - 1152) / 2 + 16,
        tops: [0, 0, 0],
        gaps: [24, 24],
    });
});

test('draws the strip on a phone in rows of links 16px apart', async ({ page }) => {
    // Where the links wrap depends on the font, so what is held is what any font gives: links on
    // one row 16px apart, each row a link's height below the last, and a link that wraps starting
    // at the row's inset.
    for (const width of [412, 360]) {
        await open(page, { width });
        const { inset, starts, tops, gaps } = await stripLayout(page);
        expect(inset).toBe(16);
        expect(gaps.every((gap) => gap === 16)).toBe(true);
        expect(tops.every((top) => top % 40 === 0)).toBe(true);
        tops.forEach((top, i) => {
            if (i > 0 && top !== tops[i - 1]) expect(starts[i]).toBe(inset);
        });
    }
});

test("puts the demo's switches beside the links on a wide screen and below them on a phone", async ({
    page,
}) => {
    await open(page, { width: 1280, tools: true });
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
    await open(page, { width: 760, tools: true });
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
            'A demo by Jason PoteetHow it worksSource on GitHub'
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

test('keeps the skip link out of sight until the keyboard reaches it, and lands on the content', async ({
    page,
}) => {
    await open(page, { width: 1280 });
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).not.toBeInViewport();
    await page.keyboard.press('Tab');
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    // At the column's inset, where the strip's links start, rather than at the edge of the page.
    expect(Math.round((await box(skip, 'the skip link')).x)).toBe((await stripLayout(page)).inset);
    await skip.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
});

test("runs the footer's rule the width of the page, with its text in the column", async ({
    page,
}) => {
    await open(page, { width: 1280 });
    const footer = await box(page.locator('.dk-footer'), 'the footer');
    expect(Math.round(footer.width)).toBe(1280);
    const text = await box(page.locator('.dk-footer p'), "the footer's text");
    expect(Math.round(text.x)).toBe((1280 - 1152) / 2 + 16);
});

for (const theme of ['light', 'dark'] as const) {
    test(`has no audit findings in the ${theme} theme, on a wide screen and a phone`, async ({
        page,
    }) => {
        for (const width of [1280, 360]) {
            await open(page, { width, theme, tools: true });
            const results = await new AxeBuilder({ page }).analyze();
            expect(results.violations.map((violation) => violation.id)).toEqual([]);
        }
    });
}

test("draws the chrome under a policy that allows styles only from the page's own origin", async ({
    browser,
}) => {
    // Served from an origin of its own with the policy as a header, and the kit's sheets as a file
    // of that origin, as a demo serves them, so any inline style the chrome drew would be refused.
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const markup = chrome(true);
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
