/**
 * The site's pages, each the HTML file Vite builds it from, relative to the site, the path a
 * visitor asks for under the base GitHub Pages serves the site from, the page's title, the name the
 * site's navigation gives it, and the description a search result shows for it. The build, the
 * browser tests and the Lighthouse audit all read this one list.
 */
export const BASE = '/design-kit/';

export const ROUTES = [
    {
        file: 'index.html',
        path: BASE,
        title: 'The design kit · Jason Poteet',
        nav: 'Home',
        description:
            'The tokens, theme script, page chrome, controls and explainer layout the demos on jasonsdevspace.com are built to share.',
    },
    {
        file: 'controls/index.html',
        path: `${BASE}controls/`,
        title: 'Controls · The design kit · Jason Poteet',
        nav: 'Controls',
        description:
            'Each state of the design kit’s buttons, fields and callouts, in both themes, with the attribute that draws it.',
    },
] as const;

export type Route = (typeof ROUTES)[number];
