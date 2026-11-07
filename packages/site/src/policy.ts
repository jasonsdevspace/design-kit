import { themeScriptHash } from '../../design-kit/src/vite.js';

/**
 * The site's Content Security Policy, written into each page, since GitHub Pages sends no header
 * of its own. Styles come only from the site's origin, as the kit promises a demo they can, and the
 * one script a page runs is the theme script, inline in its head and named by its hash, so any
 * other inline script, style attribute or injected sheet is refused.
 */
export const POLICY = [
    "default-src 'none'",
    `script-src ${themeScriptHash}`,
    "style-src 'self'",
    "img-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
].join('; ');
