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
        file: 'tokens/index.html',
        path: `${BASE}tokens/`,
        title: 'Tokens and theme · The design kit · Jason Poteet',
        nav: 'Tokens and theme',
        description:
            'The design kit’s color roles in both themes, the contrast of every pairing they are meant for, its scale, and how a page takes the theme a visitor saved.',
    },
    {
        file: 'controls/index.html',
        path: `${BASE}controls/`,
        title: 'Controls · The design kit · Jason Poteet',
        nav: 'Controls',
        description:
            'Each state of the design kit’s buttons, fields and callouts, in both themes, with the attribute that draws it.',
    },
    {
        file: 'page-chrome/index.html',
        path: `${BASE}page-chrome/`,
        title: 'Page chrome · The design kit · Jason Poteet',
        nav: 'Page chrome',
        description:
            'The skip link, strip and footer the design kit draws around every demo, in both themes, with the attribute that draws each state.',
    },
    {
        file: 'explainer-pieces/index.html',
        path: `${BASE}explainer-pieces/`,
        title: 'Explainer pieces · The design kit · Jason Poteet',
        nav: 'Explainer pieces',
        description:
            'The layout, steps, panels, tables and code blocks of the page that says how a demo works, in both themes.',
    },
] as const;

export type Route = (typeof ROUTES)[number];
