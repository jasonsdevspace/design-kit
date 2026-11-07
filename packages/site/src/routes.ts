/**
 * The site's pages, each the HTML file Vite builds it from, relative to the site, and the path a
 * visitor asks for under the base GitHub Pages serves the site from. The build, the browser tests
 * and the Lighthouse audit all read this one list.
 */
export const BASE = '/design-kit/';

export const ROUTES = [{ file: 'index.html', path: BASE }] as const;

export type Route = (typeof ROUTES)[number];
