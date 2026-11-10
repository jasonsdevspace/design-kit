import { expect, type Page } from '@playwright/test';

/**
 * The visitor's own text size, as the browser's setting sets it, which every rem is drawn from, a
 * media query's included, where a size set on the root reaches no media query. The session stays
 * open for the page's life, since closing it undoes the setting, and the size is read back, so a
 * setting the browser drops fails the test rather than leaving it at one size.
 */
export const textSize = async (page: Page, scale: number): Promise<void> => {
    const session = await page.context().newCDPSession(page);
    await session.send('Page.setFontSizes', {
        fontSizes: { standard: Math.round(16 * scale), fixed: Math.round(13 * scale) },
    });
    const size = await page.evaluate(() => getComputedStyle(document.documentElement).fontSize);
    expect(size, 'the text size the browser draws').toBe(`${String(Math.round(16 * scale))}px`);
};
