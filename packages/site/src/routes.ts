/**
 * The site's pages, each the HTML file Vite builds it from, relative to the site, the path a
 * visitor asks for under the base GitHub Pages serves the site from, and the name the page's title
 * and the site's navigation give it. The build, the browser tests and the Lighthouse audit all
 * read this one list.
 */
export const BASE = '/design-kit/';

export const ROUTES = [
    {
        file: 'index.html',
        path: BASE,
        name: 'The design kit',
        description:
            'The tokens, theme script, page chrome, controls and explainer layout the demos on jasonsdevspace.com are built to share.',
    },
    {
        file: 'controls/index.html',
        path: `${BASE}controls/`,
        name: 'Controls',
        description:
            'Each state of the design kit’s buttons, fields and callouts, in both themes, with the attribute that draws it.',
    },
] as const;

export type Route = (typeof ROUTES)[number];
