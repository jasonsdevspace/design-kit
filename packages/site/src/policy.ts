import { themeScriptHash } from 'design-kit-release/vite';

import { BASE } from './routes.js';

/** The origin GitHub Pages serves the site from, which the portfolio and every demo share. */
export const SITE_ORIGIN = 'https://jasonsdevspace.com';

/**
 * The site's Content Security Policy for the origin it is served from, written into each page,
 * since GitHub Pages sends no header of its own. Styles come only from the origin, as the kit
 * promises a demo they can. Scripts are the theme script, inline in the head and named by its hash,
 * and the files the build writes under the site's own path, never the whole origin, so a script
 * file of the portfolio's or a demo's cannot run here. Any other inline script, style attribute or
 * injected sheet is refused. A build the tests or the audit serve locally is written for that
 * origin instead.
 */
export const policyFor = (origin: string) =>
    [
        "default-src 'none'",
        `script-src ${origin}${BASE}assets/ ${themeScriptHash}`,
        "style-src 'self'",
        "img-src 'self'",
        "base-uri 'none'",
        "form-action 'none'",
    ].join('; ');
