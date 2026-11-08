import { createHash } from 'node:crypto';

import type { Plugin } from 'vite';

import { themeScript } from './theme.js';

/**
 * The oldest browser of each engine the kit draws in, by name, major version and minor. The colors
 * are written with `light-dark()`, which sets the floor. A build aimed lower rewrites each one into
 * switches set once on the root, so any part of a page set to the other scheme keeps the page's
 * colors. A build that takes the floor from here moves with the kit when the kit raises it.
 */
const FLOOR = [
    ['chrome', 123, 0],
    ['edge', 123, 0],
    ['firefox', 120, 0],
    ['safari', 17, 5],
] as const;

/** A browser the floor names. */
type Engine = (typeof FLOOR)[number][0];

/**
 * The floor as a build target for Vite's `build.target`, which `build.cssTarget` follows unless a
 * page sets it, such as `['chrome123', 'safari17.5']`. Each call gives a new array, so a page may
 * change its own without changing another's.
 */
export const browserFloor = (): string[] =>
    FLOOR.map(
        ([name, major, minor]) => `${name}${String(major)}${minor === 0 ? '' : `.${String(minor)}`}`
    );

/**
 * The floor as targets for `css.lightningcss.targets`, each version packed into a number as
 * Lightning CSS reads it. A page whose `css.transformer` is `'lightningcss'` needs it as well as
 * the build target, since Vite gives that transformer targets of its own, lower than the floor,
 * and it rewrites each `light-dark()` before the build target applies.
 */
export const lightningcssFloor = (): Record<Engine, number> =>
    Object.fromEntries(
        FLOOR.map(([name, major, minor]) => [name, (major << 16) | (minor << 8)])
    ) as Record<Engine, number>;

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
