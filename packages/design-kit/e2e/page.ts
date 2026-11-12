import { readFileSync } from 'node:fs';

import type { Locator, Page } from '@playwright/test';

/*
 * What every spec that draws the kit in a browser needs: the sheets as the source has them, a page
 * written into the browser with them, and the reads of what the browser drew. One copy, so a width
 * or a theme added here reaches every spec.
 */

/** A sheet of the kit's, as the source has it. */
export const sheet = (name: string): string =>
    readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8');

/** The kit's sheets, in the order a page loads them. */
export const KIT = ['tokens.css', 'base.css', 'components.css'].map(sheet).join('\n');

/**
 * A page written into the browser at the width and height given, in the theme given, with the
 * kit's sheets and any rules of the page's own after them, and the title and body given.
 */
export const writePage = async (
    page: Page,
    {
        width = 1280,
        height = 900,
        theme = 'light',
        title,
        body,
        css = '',
    }: {
        readonly width?: number;
        readonly height?: number;
        readonly theme?: 'light' | 'dark';
        readonly title: string;
        readonly body: string;
        readonly css?: string;
    }
): Promise<void> => {
    await page.setViewportSize({ width, height });
    await page.setContent(
        `<!doctype html><html lang="en" data-theme="${theme}"><head><title>${title}</title>` +
            `<style>${KIT}${css}</style></head><body>${body}</body></html>`
    );
};

/** The computed values of the properties named, on the element the locator finds. */
export const style = (locator: Locator, ...names: string[]): Promise<Record<string, string>> =>
    locator.evaluate(
        (element, wanted) =>
            Object.fromEntries(
                wanted.map((name) => [name, getComputedStyle(element).getPropertyValue(name)])
            ),
        names
    );

/** Where the element the locator finds is drawn, or a failure that names it. */
export const box = async (
    locator: Locator,
    what = 'the element'
): Promise<{ x: number; y: number; width: number; height: number }> => {
    const drawn = await locator.boundingBox();
    if (!drawn) throw new Error(`expected ${what} to be drawn`);
    return drawn;
};

/**
 * How tall the element the locator finds is drawn, to the pixel, or nothing where it is not
 * drawn.
 */
export const height = async (locator: Locator): Promise<number> =>
    Math.round((await locator.boundingBox())?.height ?? 0);

/** How far the page itself scrolls sideways, which is nothing when it reflows. */
export const sideways = (page: Page): Promise<number> =>
    page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );

/** The theme set on the root, or null where none is. */
export const themeOf = (page: Page): Promise<string | null> =>
    page.evaluate(() => document.documentElement.getAttribute('data-theme'));

/** The Tab key, which Safari on a Mac keeps for fields unless Option is held. */
export const tabKey = (browserName: string): string =>
    browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
