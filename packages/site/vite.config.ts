import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import kit from 'design-kit-release/package.json' with { type: 'json' };
import * as components from 'design-kit-release/react';
import { browserFloor, themeScriptPlugin } from 'design-kit-release/vite';
import { renderToStaticMarkup } from 'react-dom/server';
import { defineConfig, type Plugin } from 'vite';

import { laidOut } from '../design-kit/examples/format.js';
import { colorOf, declaredIn } from '../design-kit/examples/palette.js';
import { CHROME, EXPLAINER } from '../design-kit/examples/pieces.js';
import { CONTROLS } from '../design-kit/examples/states.js';
import { type Build, codeKey, PAGES } from './src/pages.js';
import { policyFor, SITE_ORIGIN } from './src/policy.js';
import { BASE, ROUTES } from './src/routes.js';

const SITE = fileURLToPath(new URL('.', import.meta.url));

/** Where a page asks for its body, title, description and icons, and its policy's element. */
const PAGE = '<!-- page -->';
const TITLE = '<!-- title -->';
const DESCRIPTION = '<!-- description -->';
const ICONS = '<!-- icons -->';
const THEME_COLORS = '<!-- theme-colors -->';

/**
 * The browser's bar in the page's own ground for each scheme, from the tokens the site pins rather
 * than a copy of their values, which would go stale when the pin moves. They come before the theme
 * script, since it reads them as it runs and points both at the theme it draws.
 *
 * @param tokens the pinned version's tokens sheet
 */
const themeColorMetas = (tokens: string) => {
    const declared = declaredIn(tokens);
    return (['light', 'dark'] as const)
        .map(
            (theme) =>
                `<meta name="theme-color" media="(prefers-color-scheme: ${theme})" content="${colorOf(declared, 'bg', theme)}" />`
        )
        .join('\n        ');
};

/**
 * The kit's icon, the same on every page: a 32px `.ico` for a browser that takes no SVG icon, the
 * SVG, which follows the system's scheme, and a full square a phone rounds for its home screen.
 * Each path is the site's own, which Vite gives the site's base.
 */
const ICON_LINKS = [
    '<link rel="icon" href="/favicon.ico" sizes="32x32" />',
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml" />',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
].join('\n        ');
const POLICY_META = /<meta http-equiv="Content-Security-Policy" content="<!-- policy -->" \/>/;

/**
 * Each state's markup as the site draws it, by the pinned version's components where one draws it,
 * laid out as the repository lays out HTML: each element on a line of its own where its control is
 * laid out, and otherwise broken only where a space already is. Two states with one key would show
 * one state's markup under the other, so the build refuses them, and one that cannot be laid out
 * fails the build by name.
 */
const markupOf = async (): Promise<Build['markup']> => {
    const entries = await Promise.all(
        [...CONTROLS, ...CHROME, ...EXPLAINER].flatMap((control) =>
            control.states.map(async (state) => {
                const key = codeKey(control, state);
                try {
                    const markup = renderToStaticMarkup(state.draw(components, (name) => name));
                    return [key, await laidOut(markup, control.laidOut === true)] as const;
                } catch (error) {
                    throw new Error(`the markup of ${key} could not be laid out`, { cause: error });
                }
            })
        )
    );
    const keys = entries.map(([key]) => key);
    const twice = keys.find((key, index) => keys.indexOf(key) !== index);
    if (twice !== undefined) throw new Error(`two states are both ${twice}`);
    return Object.fromEntries(entries);
};

/**
 * The version of the kit the site installed from npm, its tokens sheet, the commit the site is
 * built at, and each state's markup, read once, when the first page is built.
 */
let built: Promise<Build> | undefined;
const build = (): Promise<Build> =>
    (built ??= markupOf().then((markup) => ({
        markup,
        version: kit.version,
        tokens: readFileSync(
            createRequire(import.meta.url).resolve('design-kit-release/tokens.css'),
            'utf8'
        ),
        commit:
            process.env['GITHUB_SHA'] ??
            execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    })));

/**
 * The policy every page carries, for the origin the site is served from. The tests and the audit
 * serve the build from a local origin, and name it in SITE_ORIGIN, so the policy they load is the
 * one the site ships with only the origin changed.
 */
const originOf = (value: string) => {
    if (URL.canParse(value) && new URL(value).origin === value) return value;
    throw new Error(`SITE_ORIGIN must be an origin alone, such as ${SITE_ORIGIN}: ${value}`);
};
const POLICY = policyFor(originOf(process.env['SITE_ORIGIN'] ?? SITE_ORIGIN));

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
 * writes its title, its description and its policy, as the page is built. The pages carry no
 * script of React's, so what a visitor gets is the markup and the kit's sheets. The dev server's
 * own script and styles are not the site's, so a page it serves carries no policy, and the preview
 * the tests open serves the build.
 */
const pagesPlugin = (): Plugin => ({
    name: 'design-kit-site-pages',
    transformIndexHtml: {
        order: 'pre',
        handler: async (html, context) => {
            const file = relative(SITE, context.filename).split('\\').join('/');
            const route = ROUTES.find((each) => each.file === file);
            if (route === undefined || !isPage(file)) {
                throw new Error(`the site has no page drawn from ${file}`);
            }
            if (
                ![PAGE, TITLE, DESCRIPTION, ICONS, THEME_COLORS].every((place) =>
                    html.includes(place)
                ) ||
                !POLICY_META.test(html)
            ) {
                throw new Error(`${file} needs a place for each part of its page`);
            }
            const built = await build();
            const body = renderToStaticMarkup(PAGES[file](built));
            const policy =
                context.server === undefined
                    ? `<meta http-equiv="Content-Security-Policy" content="${POLICY}" />`
                    : '';
            return html
                .replace(POLICY_META, () => policy)
                .replace(TITLE, () => escaped(route.title))
                .replace(DESCRIPTION, () => escaped(route.description))
                .replace(ICONS, () => ICON_LINKS)
                .replace(THEME_COLORS, () => themeColorMetas(built.tokens))
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
        // The kit's browser floor, as the pinned version gives it, for the script and the sheets
        // alike, so each light-dark() is kept as written, as record 0011 and the kit's README say.
        // It moves when the pin does.
        target: browserFloor(),
        rollupOptions: {
            input: Object.fromEntries(
                ROUTES.map(({ file }) => [file, fileURLToPath(new URL(file, import.meta.url))])
            ),
        },
    },
});
