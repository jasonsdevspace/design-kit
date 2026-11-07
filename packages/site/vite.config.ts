import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { defineConfig, type Plugin } from 'vite';

import { themeScriptPlugin } from '../design-kit/src/vite.js';
import { type Build, Landing } from './src/pages.js';
import { POLICY } from './src/policy.js';

/** Where a page asks for its body, and for its policy. */
const PAGE = '<!-- page -->';
const POLICY_PLACE = '<!-- policy -->';

/** The kit's version as its manifest names it, and the commit the site is built at. */
const build = (): Build => ({
    version: (
        JSON.parse(
            readFileSync(new URL('../design-kit/package.json', import.meta.url), 'utf8')
        ) as { version: string }
    ).version,
    commit:
        process.env['GITHUB_SHA'] ??
        execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
});

/**
 * Draws each page's body with React's static render, and writes its policy, as the page is built.
 * The pages carry no script of React's, so what a visitor gets is the markup and the kit's sheets.
 */
const pagesPlugin = (): Plugin => ({
    name: 'design-kit-site-pages',
    transformIndexHtml: {
        order: 'pre',
        handler: (html) => {
            if (!html.includes(PAGE) || !html.includes(POLICY_PLACE)) {
                throw new Error(`a page needs a place for its body and its policy`);
            }
            const body = renderToStaticMarkup(createElement(Landing, { build: build() }));
            return html.replace(POLICY_PLACE, () => POLICY).replace(PAGE, () => body);
        },
    },
});

/**
 * The site, served under the path GitHub Pages gives the repository on the portfolio's domain,
 * here and in the preview the tests and the audits run against, so every link is the one a visitor
 * follows.
 */
export default defineConfig({
    base: '/design-kit/',
    plugins: [pagesPlugin(), themeScriptPlugin()],
    build: { emptyOutDir: true },
});
