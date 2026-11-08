import { createHash } from 'node:crypto';

import type { Plugin } from 'vite';

import { themeScript } from './theme.js';

/**
 * The oldest browsers the kit draws in, as a build target for Vite's `build.target` or
 * `build.cssTarget`, which esbuild reads. The colors are written with `light-dark()`, which sets the
 * floor. A wider target rewrites each one into switches set once on the root, so any part of a page
 * set to the other scheme keeps the page's colors. A build that takes the floor from here moves with
 * the kit when it raises it. It is frozen, so no page changes it for another, and typed as the
 * array Vite's options take.
 */
export const browserFloor = Object.freeze([
    'chrome123',
    'edge123',
    'firefox120',
    'safari17.5',
]) as string[];

/** Where a page asks for the theme script, in its head. */
export const THEME_PLACEHOLDER = '<!-- theme-script -->';

/**
 * The script's hash as a Content Security Policy source, for a page whose policy allows inline
 * script only by its hash. It holds while nothing after this plugin rewrites the inline script,
 * as a minifier of a page's HTML would.
 */
export const themeScriptHash = `'sha256-${createHash('sha256').update(themeScript).digest('base64')}'`;

/**
 * Puts the theme script inline into every page where the page asks for it. A page that does not
 * ask fails the build, since without the script it would draw the system's theme rather than the
 * one the visitor saved, and so does a page that asks more than once.
 */
export const themeScriptPlugin = (): Plugin => ({
    name: 'design-kit-theme-script',
    transformIndexHtml: {
        order: 'pre',
        handler: (html) => {
            const asks = html.split(THEME_PLACEHOLDER).length - 1;
            if (asks === 0) {
                throw new Error(`a page has no place for the theme script: ${THEME_PLACEHOLDER}`);
            }
            if (asks > 1) {
                throw new Error(
                    `a page asks for the theme script more than once: ${THEME_PLACEHOLDER}`
                );
            }
            // A function, so nothing in the script reads as a replacement pattern.
            return html.replace(THEME_PLACEHOLDER, () => `<script>${themeScript}</script>`);
        },
    },
});
