import { readFileSync } from 'node:fs';

import { expect, type Page, test } from '@playwright/test';

/*
 * The components on paper, where the browser drops backgrounds: a callout, a code block and a
 * step keep an edge in the line color, a code block and a scrolling table show whole rather than
 * cut at the frame, and the controls that do nothing on paper, the theme switch, the copy button
 * and the skip link, do not print.
 */

const sheet = (name: string) => readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8');
const KIT = ['tokens.css', 'base.css', 'components.css'].map(sheet).join('\n');

const LONG = 'const answer = '.repeat(20);

const PAGE = `<!doctype html><html lang="en" data-theme="light"><head><title>Print</title>
<style>${KIT} main { width: 320px; }</style></head><body>
<a class="dk-skip" href="#main-content">Skip to content</a>
<main id="main-content" tabindex="-1">
<div class="dk-callout"><div class="dk-callout-body">Saved.</div></div>
<pre class="dk-code"><code>${LONG}</code></pre>
<ol class="dk-steps"><li>The first step</li></ol>
<div class="dk-table-scroll"><table class="dk-table"><tbody><tr><td>${LONG}</td></tr></tbody></table></div>
<div class="dk-theme-switch" role="radiogroup" aria-label="Theme">
<label class="dk-theme-switch-choice"><input type="radio" name="theme" value="light" checked><span>Light</span></label>
</div>
<button type="button" class="dk-button dk-copy"><span class="dk-copy-words"><span>Copy</span></span></button>
</main></body></html>`;

/** The computed styles named, on the first element the selector finds. */
const style = (page: Page, selector: string, ...names: string[]) =>
    page
        .locator(selector)
        .first()
        .evaluate((element, names) => {
            const computed = getComputedStyle(element);
            return Object.fromEntries(names.map((name) => [name, computed.getPropertyValue(name)]));
        }, names);

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

test('prints edges on a callout, a code block and a step, in the line color', async ({ page }) => {
    await page.setContent(PAGE);
    await page.emulateMedia({ media: 'print' });
    const line = await lineColor(page);
    for (const selector of ['.dk-callout', '.dk-code', '.dk-steps > li']) {
        expect(
            await style(page, selector, 'border-top-style', 'border-top-color'),
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
        expect(await style(page, selector, 'overflow-x'), selector).toEqual({
            'overflow-x': 'auto',
        });
    }
    await page.emulateMedia({ media: 'print' });
    for (const selector of ['.dk-code', '.dk-table-scroll']) {
        expect(await style(page, selector, 'overflow-x'), selector).toEqual({
            'overflow-x': 'visible',
        });
    }
    expect(await style(page, '.dk-code', 'white-space')).toEqual({ 'white-space': 'pre-wrap' });
    // Wrapped, the code is no wider than its column.
    const code = await page.locator('.dk-code').evaluate((element) => ({
        scroll: element.scrollWidth,
        client: element.clientWidth,
    }));
    expect(code.scroll).toBeLessThanOrEqual(code.client);
});

test('prints none of the controls that do nothing on paper', async ({ page }) => {
    await page.setContent(PAGE);
    await page.emulateMedia({ media: 'print' });
    for (const selector of ['.dk-theme-switch', '.dk-copy', '.dk-skip']) {
        expect(await style(page, selector, 'display'), selector).toEqual({ display: 'none' });
    }
});
