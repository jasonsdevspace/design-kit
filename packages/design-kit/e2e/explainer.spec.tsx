import { readFileSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { SOURCE, steps } from '../examples/examples.js';
import { Callout, DemoFooter, PortfolioStrip, SkipLink } from '../src/react.js';
import { SPACED } from './spacing.js';

/*
 * An explainer page as a demo writes it by hand, with the kit's sheets: the link to how it works
 * marked as the current page in the strip and the footer, its column lined up with the strip, its
 * prose held to the measure, its sections in one rhythm, and a table and a code block that scroll
 * inside themselves, each a named region the keyboard reaches, so the page itself never scrolls
 * sideways, at any width or text size. A section is not a landmark, and the steps stay a list.
 */

const sheet = (name: string) => readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8');
const KIT = ['tokens.css', 'base.css', 'components.css'].map(sheet).join('\n');

const PITCH =
    'Example takes an order for a product and holds the stock for it until the order is paid for, ' +
    'so two shoppers never buy the last one, and a reader can watch each step happen in the demo.';

const TABLE =
    '<p class="dk-table-title" id="bench-title">Orders a second under each strategy</p>' +
    '<div class="dk-table-scroll" role="region" aria-labelledby="bench-title" tabindex="0">' +
    '<table class="dk-table" aria-labelledby="bench-title"><thead><tr>' +
    '<th scope="col">Scenario</th><th scope="col" class="dk-table-number">Orders a second</th>' +
    '<th scope="col" class="dk-table-number">Slowest 1%, ms</th>' +
    '<th scope="col" class="dk-table-number">Retries</th>' +
    '<th scope="col" class="dk-table-number">Oversold</th>' +
    '<th scope="col" class="dk-table-number">Waiting</th></tr></thead><tbody>' +
    '<tr><th scope="row">Hot product, row lock</th><td class="dk-table-number">700</td>' +
    '<td class="dk-table-number">48.5</td><td class="dk-table-number">0</td>' +
    '<td class="dk-table-number">0</td><td class="dk-table-number">1,204</td></tr>' +
    '<tr><th scope="row">Hot product, <code>FOR_UPDATE_SKIP_LOCKED</code></th>' +
    '<td class="dk-table-number">2,310</td><td class="dk-table-number">12.1</td>' +
    '<td class="dk-table-number">31</td><td class="dk-table-number">0</td>' +
    '<td class="dk-table-number">0</td></tr></tbody></table></div>';

const code = (id: string, title: string) =>
    `<p class="dk-code-title" id="${id}">${title}</p>` +
    `<pre class="dk-code" role="region" aria-labelledby="${id}" tabindex="0" translate="no"><code>` +
    'UPDATE stock SET held = held + 1 WHERE product_id = $1 AND held &lt; on_hand RETURNING held, on_hand, product_id;' +
    '\n  -- one line long enough that a phone has to scroll to read it to the end' +
    '</code></pre>';

const EXPLAINER =
    '<header class="dk-explainer-header"><a href="../">Example</a></header>' +
    '<main id="main-content" tabindex="-1" class="dk-explainer">' +
    '<h1>How Example works</h1>' +
    `<p class="dk-explainer-lead">${PITCH}</p>` +
    '<p><a class="dk-button dk-button-accent" href="../">Open the demo</a></p>' +
    '<section>' +
    '<p class="dk-explainer-number" aria-hidden="true">01</p>' +
    '<h2 id="order">What happens when an order comes in</h2>' +
    `<p>${PITCH} <a href="#numbers">See the numbers</a>.</p>` +
    renderToStaticMarkup(steps) +
    '<h3>What usually goes wrong</h3>' +
    `<p>${PITCH} The package <code>@jasonsdevspace/design-kit-with-a-very-long-name</code> is one.</p>` +
    code('lock-title', 'The statement that holds the stock') +
    `<p>${PITCH}</p>` +
    '<pre class="dk-code" id="untitled"><code>SELECT 1;</code></pre>' +
    '</section>' +
    '<section>' +
    '<p class="dk-explainer-number" aria-hidden="true">02</p>' +
    '<h2 id="numbers">The numbers</h2>' +
    `<p>${PITCH}</p>` +
    TABLE +
    '<div class="dk-panel"><p class="dk-panel-title">How the numbers were taken</p>' +
    `<p>${PITCH}</p>${code('panel-title', 'Run it yourself')}</div>` +
    renderToStaticMarkup(
        <Callout title="A note">
            <p>{PITCH}</p>
        </Callout>
    ).replace(
        '</div></div>',
        `${code('callout-title', 'The same statement, in a callout')}</div></div>`
    ) +
    '</section>' +
    '</main>';

const PAGE = renderToStaticMarkup(
    <>
        <SkipLink />
        <PortfolioStrip about="./" source={SOURCE} current="about" />
    </>
).concat(
    EXPLAINER,
    renderToStaticMarkup(<DemoFooter name="Example" about="./" source={SOURCE} current="about" />)
);

const open = async (
    page: Page,
    {
        width = 1280,
        theme = 'light',
        text = 1,
        extra = '',
    }: { width?: number; theme?: 'light' | 'dark'; text?: number; extra?: string } = {}
) => {
    await page.setViewportSize({ width, height: 900 });
    // The visitor's own text size, as the browser's setting sets it, which every rem is drawn from.
    const session = await page.context().newCDPSession(page);
    await session.send('Page.setFontSizes', {
        fontSizes: { standard: Math.round(16 * text), fixed: Math.round(13 * text) },
    });
    await session.detach();
    await page.setContent(
        `<!doctype html><html lang="en" data-theme="${theme}"><head><title>How Example works</title>` +
            `<style>${KIT}${extra}</style></head><body>${PAGE}</body></html>`
    );
};

const box = async (locator: Locator) => {
    const drawn = await locator.boundingBox();
    if (!drawn) throw new Error('expected the element to be drawn');
    return drawn;
};

const style = (locator: Locator, ...names: string[]) =>
    locator.evaluate(
        (element, wanted) =>
            Object.fromEntries(
                wanted.map((name) => [name, getComputedStyle(element).getPropertyValue(name)])
            ),
        names
    );

/** How far the page itself scrolls sideways, which is nothing when it reflows. */
const sideways = (page: Page) =>
    page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );

test('marks the link to how it works as the current page in the strip and the footer alike', async ({
    page,
}) => {
    await open(page);
    for (const where of ['navigation', 'contentinfo'] as const) {
        const link = page.getByRole(where).getByRole('link', { name: 'How it works' });
        await expect(link).toHaveAttribute('aria-current', 'page');
    }
});

test('lines the explainer up with the strip, and holds its prose to the measure', async ({
    page,
}) => {
    for (const [width, inset] of [
        [1280, (1280 - 1152) / 2 + 16],
        [320, 16],
    ] as const) {
        await open(page, { width });
        const heading = await box(page.getByRole('heading', { level: 1 }));
        const link = await box(
            page
                .getByRole('navigation', { name: 'Portfolio' })
                .getByRole('link', { name: 'Jason Poteet', exact: true })
        );
        expect(Math.round(heading.x)).toBe(inset);
        expect(Math.round(link.x)).toBe(inset);
        const lead = await box(page.locator('.dk-explainer-lead'));
        expect(Math.round(lead.width)).toBe(Math.min(544, width - 32));
    }
});

test('keeps a line of prose to eighty characters or fewer on a wide screen', async ({ page }) => {
    await open(page);
    // The longest line a paragraph breaks into, read from where the browser breaks it, in the
    // lead and in the body's text.
    const longest = (locator: Locator) =>
        locator.evaluate((lead) => {
            const text = lead.firstChild;
            if (!text?.textContent) return 0;
            const range = document.createRange();
            const lines = new Map<number, number>();
            for (let at = 0; at < text.textContent.length; at += 1) {
                range.setStart(text, at);
                range.setEnd(text, at + 1);
                const top = Math.round(range.getBoundingClientRect().top);
                lines.set(top, (lines.get(top) ?? 0) + 1);
            }
            return Math.max(...lines.values());
        });
    for (const paragraph of [
        page.locator('.dk-explainer-lead'),
        page.locator('.dk-explainer > section > p:not(.dk-explainer-number)').first(),
    ]) {
        const characters = await longest(paragraph);
        expect(characters).toBeGreaterThan(40);
        expect(characters).toBeLessThanOrEqual(80);
    }
});

test('sets a frame a short step under its title, a table and a code block alike', async ({
    page,
}) => {
    await open(page);
    for (const [title, frame] of [
        ['.dk-table-title', '.dk-table-scroll'],
        ['.dk-code-title', '.dk-code'],
        ['.dk-panel .dk-code-title', '.dk-panel .dk-code'],
    ] as const) {
        const above = await box(page.locator(title).first());
        const below = await box(page.locator(frame).first());
        expect(Math.round(below.y - (above.y + above.height)), frame).toBe(8);
    }
    // A block with no title is spaced from the text above it as any part of a section is.
    const untitled = await box(page.locator('#untitled'));
    const before = await box(page.locator('#untitled').locator('xpath=preceding-sibling::p[1]'));
    expect(Math.round(untitled.y - (before.y + before.height))).toBe(16);
});

test('sets a title a short step over its frame on any page, not only an explainer', async ({
    page,
}) => {
    await page.setContent(
        `<!doctype html><html lang="en"><head><title>Demo</title><style>${KIT}</style></head>` +
            `<body><main>${TABLE}${code('demo-title', 'The snippet')}</main></body></html>`
    );
    for (const [title, frame] of [
        ['.dk-table-title', '.dk-table-scroll'],
        ['.dk-code-title', '.dk-code'],
    ] as const) {
        const above = await box(page.locator(title));
        const below = await box(page.locator(frame));
        expect(Math.round(below.y - (above.y + above.height)), frame).toBe(8);
    }
});

test('keeps code in a table cell whole, so the frame scrolls rather than the code breaking', async ({
    page,
}) => {
    await open(page, { width: 320 });
    const inCell = page
        .getByRole('rowheader', { name: 'Hot product, FOR_UPDATE_SKIP_LOCKED' })
        .locator('code');
    // One box on one line, rather than the name broken into pieces.
    expect(await inCell.evaluate((element) => element.getClientRects().length)).toBe(1);
    // A name with hyphens, wider than the frame, stays whole too, rather than breaking after one.
    const hyphened = await inCell.evaluate((element) => {
        element.textContent = '--dk-a-token-with-a-name-longer-than-its-cell';
        const frame = element.closest('.dk-table-scroll');
        return {
            lines: element.getClientRects().length,
            wider: element.getBoundingClientRect().width > (frame?.clientWidth ?? 0),
        };
    });
    expect(hyphened).toEqual({ lines: 1, wider: true });
});

test('opens each section with its rule, its number, its heading and then its text', async ({
    page,
}) => {
    await open(page);
    const section = page.locator('.dk-explainer > section').first();
    expect(await style(section, 'border-top-style', 'padding-top', 'margin-top')).toEqual({
        'border-top-style': 'solid',
        'padding-top': '32px',
        'margin-top': '32px',
    });
    const number = await box(section.locator('.dk-explainer-number'));
    const heading = await box(section.getByRole('heading', { level: 2 }));
    expect(Math.round(heading.y - (number.y + number.height))).toBe(4);
    expect((await style(section.locator('.dk-explainer-number'), 'color')).color).toBe(
        'rgb(92, 92, 92)'
    );
});

test('never scrolls the page sideways, at any width or text size, but the frames scroll', async ({
    page,
}) => {
    for (const width of [320, 390, 768, 1280]) {
        for (const text of [1, 2]) {
            await open(page, { width, text });
            expect(await sideways(page), `${String(width)}px at ${String(text)}x`).toBe(0);
        }
    }
    await open(page, { width: 320 });
    // What scrolls is the table and each code block, inside a panel and a callout included.
    const scrolling = await page.evaluate(() =>
        [...document.querySelectorAll('*')]
            .filter((element) => element.scrollWidth > element.clientWidth + 1)
            .filter((element) => getComputedStyle(element).overflowX === 'auto')
            .map((element) => element.getAttribute('aria-labelledby'))
    );
    expect(scrolling.sort((a, b) => String(a).localeCompare(String(b)))).toEqual([
        'bench-title',
        'callout-title',
        'lock-title',
        'panel-title',
    ]);
});

test('clips no text when a visitor spaces it out further', async ({ page }) => {
    await open(page, { width: 320, extra: SPACED });
    const clipped = await page.evaluate(() =>
        [...document.querySelectorAll('main *')]
            .filter((element) => /hidden|clip/.test(getComputedStyle(element).overflowY))
            .filter((element) => element.scrollHeight > element.clientHeight + 1)
            .map((element) => element.className)
    );
    expect(clipped).toEqual([]);
    expect(await sideways(page)).toBe(0);
});

test('names each frame by its title, and lets the keyboard reach and scroll it', async ({
    page,
}) => {
    await open(page, { width: 320 });
    const table = page.getByRole('region', { name: 'Orders a second under each strategy' });
    await expect(
        page.getByRole('table', { name: 'Orders a second under each strategy' })
    ).toBeVisible();
    await expect(
        page.getByRole('region', { name: 'The statement that holds the stock' })
    ).toBeVisible();
    // A pointer pressed in the frame draws no ring, since the browser would show no focus there.
    await table.click();
    expect((await style(table, 'outline-style'))['outline-style']).toBe('none');
    await page.getByRole('link', { name: 'See the numbers' }).focus();
    await page.keyboard.press('Tab');
    await expect(
        page.getByRole('region', { name: 'The statement that holds the stock' })
    ).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(table).toBeFocused();
    expect(await style(table, 'outline-style', 'outline-width')).toEqual({
        'outline-style': 'solid',
        'outline-width': '2px',
    });
    const before = await table.evaluate((frame) => frame.scrollLeft);
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => table.evaluate((frame) => frame.scrollLeft)).toBeGreaterThan(before);
});

test('reads a table by its column and row headers, with its figures set to the right', async ({
    page,
}) => {
    await open(page);
    await expect(page.getByRole('columnheader')).toHaveCount(6);
    await expect(page.getByRole('rowheader', { name: 'Hot product, row lock' })).toBeVisible();
    const figure = page.getByRole('cell', { name: '2,310' });
    expect((await style(figure, 'text-align'))['text-align']).toBe('end');
    expect(
        (await style(page.getByRole('columnheader', { name: 'Retries' }), 'text-align'))[
            'text-align'
        ]
    ).toBe('end');
    expect(
        (await style(page.getByRole('columnheader', { name: 'Scenario' }), 'text-align'))[
            'text-align'
        ]
    ).toBe('start');
});

test('keeps code as it is written, its lines whole, and breaks inline code where it must', async ({
    page,
}) => {
    await open(page, { width: 320 });
    const block = page.getByRole('region', { name: 'The statement that holds the stock' });
    expect((await style(block, 'white-space'))['white-space']).toBe('pre');
    await expect(block).toHaveAttribute('translate', 'no');
    // Inline code in prose follows the size of the text around it, a step smaller.
    const inline = page.locator('.dk-explainer > section p code').first();
    expect((await style(inline, 'font-size'))['font-size']).toBe('14.4px');
    expect((await style(inline, 'overflow-wrap'))['overflow-wrap']).toBe('anywhere');
    // Inside a block it takes the block's size, not a step smaller again.
    expect((await style(block.locator('code'), 'font-size'))['font-size']).toBe('14.4px');
});

test('lands the skip link on the content, and an in-page link on its section', async ({ page }) => {
    // Room below the last section, so a jump to it is not cut short by the end of the page.
    await open(page, { extra: '.dk-explainer { padding-block-end: 200vh }' });
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Open the demo' })).toBeFocused();
    await page.getByRole('link', { name: 'See the numbers' }).press('Enter');
    // The jump leaves the section's rule and number in sight above its heading, close to the top.
    const section = page.locator('.dk-explainer > section').nth(1);
    const rule = await box(section);
    expect(rule.y).toBeGreaterThanOrEqual(0);
    expect(rule.y).toBeLessThan(24);
    const number = await box(section.locator('.dk-explainer-number'));
    expect(number.y).toBeGreaterThan(rule.y);
    await page.keyboard.press('Tab');
    await expect(
        page.getByRole('region', { name: 'Orders a second under each strategy' })
    ).toBeFocused();
});

test('makes a landmark of no section, and of each frame, and keeps the steps a list', async ({
    page,
}) => {
    await open(page);
    await expect(page.getByRole('region')).toHaveCount(4);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('banner')).toHaveCount(1);
    const steps = page.locator('.dk-steps');
    await expect(steps).toHaveAttribute('role', 'list');
    await expect(steps.getByRole('listitem')).toHaveCount(2);
    // The arrow between steps is read by no one, and drawn in the muted text.
    const arrow = page.locator('.dk-steps-arrow');
    await expect(arrow).toHaveAttribute('aria-hidden', 'true');
    expect((await style(arrow, 'color')).color).toBe('rgb(92, 92, 92)');
});

test('sets a panel on the card ground, with an edge that stays in forced colors', async ({
    browser,
}) => {
    for (const forcedColors of ['none', 'active'] as const) {
        const context = await browser.newContext({ forcedColors });
        const page = await context.newPage();
        await open(page);
        const panel = page.locator('.dk-panel');
        const drawn = await style(
            panel,
            'border-top-style',
            'border-top-color',
            'background-color'
        );
        expect(drawn['border-top-style']).toBe('solid');
        expect(drawn['border-top-color']).not.toBe('rgba(0, 0, 0, 0)');
        if (forcedColors === 'none') expect(drawn['background-color']).toBe('rgb(245, 245, 245)');
        // A code block in a panel sits on the page's own ground, so it reads as inside it.
        if (forcedColors === 'none') {
            expect(
                (await style(panel.locator('.dk-code'), 'background-color'))['background-color']
            ).toBe('rgb(255, 255, 255)');
        }
        await context.close();
    }
});

for (const theme of ['light', 'dark'] as const) {
    test(`has no audit findings in the ${theme} theme, wide and on a phone`, async ({ page }) => {
        for (const width of [1280, 320]) {
            await open(page, { width, theme });
            const results = await new AxeBuilder({ page }).analyze();
            expect(results.violations.map((violation) => violation.id)).toEqual([]);
        }
    });
}
