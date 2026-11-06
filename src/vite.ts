import { createHash } from 'node:crypto';

import type { Plugin } from 'vite';

import { themeScript } from './theme.js';

/** Where a page asks for the theme script, in its head. */
export const THEME_PLACEHOLDER = '<!-- theme-script -->';

/**
 * The script's hash as a Content Security Policy source, for a page whose policy allows inline
 * script only by its hash.
 */
export const themeScriptHash = `'sha256-${createHash('sha256').update(themeScript).digest('base64')}'`;

/**
 * Puts the theme script inline into every page where the page asks for it. A page that does not
 * ask fails the build, since without the script it would paint in the system's theme and then
 * switch.
 */
export const themeScriptPlugin = (): Plugin => ({
    name: 'design-kit-theme-script',
    transformIndexHtml: {
        order: 'pre',
        handler: (html) => {
            if (!html.includes(THEME_PLACEHOLDER)) {
                throw new Error(`a page has no place for the theme script: ${THEME_PLACEHOLDER}`);
            }
            // A function, so nothing in the script reads as a replacement pattern.
            return html.replace(THEME_PLACEHOLDER, () => `<script>${themeScript}</script>`);
        },
    },
});
