import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { CopyButton, ThemeSwitch } from '../src/react.js';
import { KIT, style } from './page.js';

/*
 * The components on paper, where the browser drops backgrounds: a callout and a
 * code block keep an edge in the line color, a code block and a scrolling table show whole rather
 * than cut at the frame, and what does nothing on paper, the theme switch, the copy button, the
 * skip link and a strip's switches, does not print.
 */

const LONG = 'const answer = '.repeat(20);

const PAGE = `<!doctype html><html lang="en" data-theme="light"><head><title>Print</title>
<style>${KIT} main { width: 320px; }</style></head><body>
<a class="dk-skip" href="#main-content">Skip to content</a>
<main id="main-content" tabindex="-1">
<div class="dk-callout"><div class="dk-callout-body">Saved.</div></div>
<pre class="dk-code"><code>${LONG}</code></pre>
<ol class="dk-steps"><li>The first step</li></ol>
<div class="dk-table-scroll"><table class="dk-table"><tbody><tr><td><code>${'--dk-'.repeat(40)}</code></td><td class="dk-table-number">1234567890</td></tr></tbody></table></div>
<div class="dk-strip"><section class="dk-strip-tools" aria-label="Settings"><button type="button" class="dk-button">Members</button></section></div>
${renderToStaticMarkup(
    <>
        <ThemeSwitch id="theme" />
        <CopyButton name="install command" />
    </>
).replaceAll(' hidden=""', '')}
</main></body></html>`;

/** The line color as the page resolves it, from an element asked to take it. */
const lineColor = (page: Page) =>
    page.evaluate(() => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--dk-line)';
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
    });

test('prints edges on a callout and a code block, in the line color', async ({ page }) => {
    await page.setContent(PAGE);
    await page.emulateMedia({ media: 'print' });
    const line = await lineColor(page);
    for (const selector of ['.dk-callout', '.dk-code']) {
        expect(
            await style(page.locator(selector).first(), 'border-top-style', 'border-top-color'),
            selector
        ).toEqual({ 'border-top-style': 'solid', 'border-top-color': line });
    }
});

test('prints a code block and a scrolling table whole, rather than cut at the frame', async ({
    page,
}) => {
    await page.setContent(PAGE);
    // On screen each scrolls inside its frame.
    for (const selector of ['.dk-code', '.dk-table-scroll']) {
        expect(await style(page.locator(selector).first(), 'overflow-x'), selector).toEqual({
            'overflow-x': 'auto',
        });
    }
    await page.emulateMedia({ media: 'print' });
    for (const selector of ['.dk-code', '.dk-table-scroll']) {
        expect(await style(page.locator(selector).first(), 'overflow-x'), selector).toEqual({
            'overflow-x': 'visible',
        });
    }
    expect(await style(page.locator('.dk-code').first(), 'white-space')).toEqual({
        'white-space': 'pre-wrap',
    });
    // Wrapped, neither the code nor the table is wider than its column.
    for (const selector of ['.dk-code', '.dk-table-scroll']) {
        const box = await page.locator(selector).evaluate((element) => ({
            scroll: element.scrollWidth,
            client: element.clientWidth,
        }));
        expect(box.scroll, selector).toBeLessThanOrEqual(box.client);
    }
});

test('prints none of the controls that do nothing on paper', async ({ page }) => {
    await page.setContent(PAGE);
    await page.emulateMedia({ media: 'print' });
    for (const selector of ['.dk-theme-switch', '.dk-copy', '.dk-skip', '.dk-strip-tools']) {
        expect(await style(page.locator(selector).first(), 'display'), selector).toEqual({
            display: 'none',
        });
    }
});
