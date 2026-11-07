import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderToStaticMarkup } from 'react-dom/server';
import { defineConfig, type Plugin } from 'vite';

import { themeScriptPlugin } from '../design-kit/src/vite.js';
import { type Build, PAGES } from './src/pages.js';
import { POLICY } from './src/policy.js';
import { BASE, ROUTES } from './src/routes.js';

const SITE = fileURLToPath(new URL('.', import.meta.url));

/** Where a page asks for its body, and the element that carries its policy. */
const PAGE = '<!-- page -->';
const POLICY_META = /<meta http-equiv="Content-Security-Policy" content="<!-- policy -->" \/>/;

/** The version the kit's manifest names, and the commit the site is built at, read once. */
const BUILD: Build = {
    version: (
        JSON.parse(
            readFileSync(new URL('../design-kit/package.json', import.meta.url), 'utf8')
        ) as { version: string }
    ).version,
    commit:
        process.env['GITHUB_SHA'] ??
        execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
};

const isPage = (file: string): file is keyof typeof PAGES => Object.hasOwn(PAGES, file);

/**
 * Draws each page's body with React's static render, by the HTML file it is built from, and
 * writes its policy, as the page is built. The pages carry no script of React's, so what a visitor
 * gets is the markup and the kit's sheets. The dev server's own script and styles are not the
 * site's, so a page it serves carries no policy, and the preview the tests open serves the build.
 */
const pagesPlugin = (): Plugin => ({
    name: 'design-kit-site-pages',
    transformIndexHtml: {
        order: 'pre',
        handler: (html, context) => {
            const file = relative(SITE, context.filename).split('\\').join('/');
            if (!isPage(file)) throw new Error(`the site has no page drawn from ${file}`);
            if (!html.includes(PAGE) || !POLICY_META.test(html)) {
                throw new Error(`${file} needs a place for its body and its policy`);
            }
            const body = renderToStaticMarkup(PAGES[file](BUILD));
            const policy =
                context.server === undefined
                    ? `<meta http-equiv="Content-Security-Policy" content="${POLICY}" />`
                    : '';
            return html.replace(POLICY_META, () => policy).replace(PAGE, () => body);
        },
    },
});

/**
 * The site, served under the path GitHub Pages gives the repository on the portfolio's domain,
 * here and in the preview the tests and the audits run against, so every link is the one a visitor
 * follows. Each page in the routes is an entry of the build.
 */
export default defineConfig({
    base: BASE,
    plugins: [pagesPlugin(), themeScriptPlugin()],
    build: {
        emptyOutDir: true,
        rollupOptions: {
            input: Object.fromEntries(
                ROUTES.map(({ file }) => [file, fileURLToPath(new URL(file, import.meta.url))])
            ),
        },
    },
});
