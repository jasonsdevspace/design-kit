import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
    DemoFooter,
    GITHUB_PROFILE_URL,
    PORTFOLIO_URL,
    PORTFOLIO_WORK_URL,
    PortfolioStrip,
    SkipLink,
} from './react.js';

/*
 * The markup each piece of page chrome draws, which is the contract a page without React writes by
 * hand and components.css styles. Rendered to a string, with no browser, which is enough to hold
 * the elements, their classes, the landmarks and the links. How a browser lays them out is held by
 * e2e/chrome.spec.tsx.
 */

const SOURCE = 'https://github.com/jasonsdevspace/example';

describe('the skip link', () => {
    it('leads to the main content by default, and to the target given', () => {
        expect(renderToStaticMarkup(<SkipLink />)).toBe(
            '<a class="dk-skip" href="#main-content">Skip to content</a>'
        );
        expect(renderToStaticMarkup(<SkipLink target="results">Skip to results</SkipLink>)).toBe(
            '<a class="dk-skip" href="#results">Skip to results</a>'
        );
    });
});

describe('the strip', () => {
    const strip = (props: Partial<Parameters<typeof PortfolioStrip>[0]> = {}) =>
        renderToStaticMarkup(<PortfolioStrip about="./about/" source={SOURCE} {...props} />);

    it('says whose demo this is, how it works and where the source is, in that order', () => {
        expect(strip()).toBe(
            '<div class="dk-strip"><nav class="dk-strip-links" aria-label="Portfolio">' +
                `<a href="${PORTFOLIO_WORK_URL}">A demo by Jason Poteet</a>` +
                '<a href="./about/">How it works</a>' +
                `<a href="${SOURCE}">Source on GitHub</a>` +
                '</nav></div>'
        );
    });

    it('marks the explainer as the current page when the strip sits on it', () => {
        expect(strip({ current: 'about' })).toContain(
            '<a href="./about/" aria-current="page">How it works</a>'
        );
    });

    it('holds the demo own switches in a landmark of their own, only when there are some', () => {
        expect(strip()).not.toContain('dk-strip-tools');
        expect(strip({ tools: <button type="button">Tour</button> })).toContain(
            '<section class="dk-strip-tools" aria-label="Demo"><button type="button">Tour</button></section>'
        );
        expect(strip({ tools: <span />, toolsLabel: 'Store' })).toContain('aria-label="Store"');
    });

    it('opens no link in a new tab', () => {
        expect(strip()).not.toContain('target=');
    });
});

describe('the footer', () => {
    it('names the project and its author, and links the explainer, the source, the work and the license', () => {
        const footer = renderToStaticMarkup(
            <DemoFooter name="Example" about="./about/" source={SOURCE} />
        );
        expect(footer.startsWith('<footer class="dk-footer"><p>')).toBe(true);
        expect(footer).toContain(
            `Example is a portfolio project by <a href="${PORTFOLIO_URL}">Jason Poteet</a>.`
        );
        const hrefs = [...footer.matchAll(/href="([^"]+)"/g)].map(([, href]) => href);
        expect(hrefs).toEqual([
            PORTFOLIO_URL,
            './about/',
            SOURCE,
            GITHUB_PROFILE_URL,
            `${SOURCE}/blob/main/LICENSE`,
        ]);
    });

    it('ends with what a demo adds of its own', () => {
        const footer = renderToStaticMarkup(
            <DemoFooter name="Example" about="./about/" source={SOURCE}>
                You can also <a href="./try/">search your own products</a> with it.
            </DemoFooter>
        );
        expect(footer).toMatch(
            /MIT license<\/a>\. You can also <a href="\.\/try\/">search your own products<\/a> with it\.<\/p><\/footer>$/
        );
    });
});
