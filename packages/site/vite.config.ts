import { execFileSync } from 'node:child_process';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import kit from 'design-kit-release/package.json' with { type: 'json' };
import { themeScriptPlugin } from 'design-kit-release/vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { defineConfig, type Plugin } from 'vite';

import { type Build, PAGES } from './src/pages.js';
import { POLICY } from './src/policy.js';
import { BASE, ROUTES } from './src/routes.js';

const SITE = fileURLToPath(new URL('.', import.meta.url));

/** Where a page asks for its body, its title and its description, and the element for its policy. */
const PAGE = '<!-- page -->';
const TITLE = '<!-- title -->';
const DESCRIPTION = '<!-- description -->';
const POLICY_META = /<meta http-equiv="Content-Security-Policy" content="<!-- policy -->" \/>/;

/** The version of the kit the site installed from npm, and the commit it is built at, read once. */
const BUILD: Build = {
    version: kit.version,
    commit:
        process.env['GITHUB_SHA'] ??
        execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
};

const isPage = (file: string): file is keyof typeof PAGES => Object.hasOwn(PAGES, file);

/** Text set into a page's head, with what HTML reads as markup written as character references. */
const escaped = (text: string) =>
    text
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');

/**
 * Draws each page's body with React's static render, by the HTML file it is built from, and
 * writes its title, its description and its policy, as the page is built. The pages carry no script of React's, so what a visitor
 * gets is the markup and the kit's sheets. The dev server's own script and styles are not the
 * site's, so a page it serves carries no policy, and the preview the tests open serves the build.
 */
const pagesPlugin = (): Plugin => ({
    name: 'design-kit-site-pages',
    transformIndexHtml: {
        order: 'pre',
        handler: (html, context) => {
            const file = relative(SITE, context.filename).split('\\').join('/');
            const route = ROUTES.find((each) => each.file === file);
            if (route === undefined || !isPage(file)) {
                throw new Error(`the site has no page drawn from ${file}`);
            }
            if (
                ![PAGE, TITLE, DESCRIPTION].every((place) => html.includes(place)) ||
                !POLICY_META.test(html)
            ) {
                throw new Error(`${file} needs a place for each part of its page`);
            }
            const body = renderToStaticMarkup(PAGES[file](BUILD));
            const policy =
                context.server === undefined
                    ? `<meta http-equiv="Content-Security-Policy" content="${POLICY}" />`
                    : '';
            return html
                .replace(POLICY_META, () => policy)
                .replace(TITLE, () => escaped(route.title))
                .replace(DESCRIPTION, () => escaped(route.description))
                .replace(PAGE, () => body);
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
        // The kit's own browser floor, as record 3 sets it, so the minifier leaves each light-dark()
        // as it is, resolved by the scheme of the element that uses it. A wider target rewrites it
        // into variables that resolve where the tokens are set, on the root, so a copy in the other
        // scheme would keep the page's colors.
        cssTarget: ['chrome123', 'edge123', 'firefox120', 'safari17.5'],
        rollupOptions: {
            input: Object.fromEntries(
                ROUTES.map(({ file }) => [file, fileURLToPath(new URL(file, import.meta.url))])
            ),
        },
    },
});
