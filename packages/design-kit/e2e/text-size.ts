import { expect, type Page, test } from '@playwright/test';

/**
 * The visitor's own text size, as the browser's setting sets it, which every rem is drawn from, a
 * media query's included, where a size set on the root reaches no media query. The session stays
 * open for the page's life, since closing it undoes the setting, and the size is read back, so a
 * setting the browser drops fails the test rather than leaving it at one size. Only Chromium takes
 * the setting from a test, so in another engine the usual size is left as it is, and a test that
 * asks for another is skipped, which a test that checks the usual size first avoids by asking for
 * the other only in Chromium.
 */
export const textSize = async (page: Page, scale: number): Promise<void> => {
    if (page.context().browser()?.browserType().name() !== 'chromium') {
        // The usual size is what another engine draws already.
        if (scale === 1) return;
        test.skip(true, 'the text size is set through Chromium');
    }
    const session = await page.context().newCDPSession(page);
    await session.send('Page.setFontSizes', {
        fontSizes: { standard: Math.round(16 * scale), fixed: Math.round(13 * scale) },
    });
    const size = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
    expect(size, 'the text size the browser draws').toBe(`${String(Math.round(16 * scale))}px`);
};

/**
 * The visitor's text size doubled, once the page is drawn. Chromium takes the browser's own
 * setting, which every rem is drawn from, a media query's included. Another engine takes a root
 * size, which no media query reads, so a test of what a media query does at twice the text size
 * asks for the setting and runs in Chromium alone, and the rest run in every engine. Writing the
 * page replaces the root size, so the page must be drawn first, and the size is read back.
 */
export const doubled = async (
    page: Page,
    browserName: string,
    { setting = false }: { readonly setting?: boolean } = {}
): Promise<void> => {
    const drawn = await page.evaluate(() => document.body.childElementCount > 0);
    expect(drawn, 'the page is drawn before its text is doubled').toBe(true);
    if (browserName === 'chromium') {
        await textSize(page, 2);
        return;
    }
    test.skip(setting, 'only the browser setting reaches a media query, set through Chromium');
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    const size = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
    expect(size, 'the text size the page draws').toBe('32px');
};
