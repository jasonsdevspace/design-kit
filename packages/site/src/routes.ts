/**
 * The site's pages, each the HTML file Vite builds it from, relative to the site, the path a
 * visitor asks for under the base GitHub Pages serves the site from, the page's title, the name the
 * site's navigation gives it, or none for the explainer, which the strip and the footer lead to as
 * a demo's do, and the description a search result shows for it. The build, the browser tests and
 * the Lighthouse audit all read this one list.
 */
export const BASE = '/design-kit/';

/** The explainer, which the strip and the footer on every page lead to as a demo's do. */
export const ABOUT = `${BASE}how-it-works/`;

/** The kit's repository, which the strip and the footer link as the site's source. */
export const SOURCE = 'https://github.com/jasonsdevspace/design-kit';

/** The package on npm. */
export const NPM = 'https://www.npmjs.com/package/@jasonsdevspace/design-kit';

export const ROUTES = [
    {
        file: 'index.html',
        path: BASE,
        title: 'The design kit · Jason Poteet',
        nav: 'Home',
        description:
            'A shared set of colors, type, buttons, fields and page layouts made for the demos on jasonsdevspace.com, shown in both themes.',
    },
    {
        file: 'tokens/index.html',
        path: `${BASE}tokens/`,
        title: 'Tokens and theme · The design kit · Jason Poteet',
        nav: 'Tokens and theme',
        description:
            'The design kit’s color roles in both themes, the contrast of every pairing they are meant for, its scale, and how the theme is chosen.',
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
            'The skip link, strip and footer a demo draws around its page from the design kit, with each state of the strip and the footer in both themes and the attribute that draws it.',
    },
    {
        file: 'explainer-pieces/index.html',
        path: `${BASE}explainer-pieces/`,
        title: 'Explainer pieces · The design kit · Jason Poteet',
        nav: 'Explainer pieces',
        description:
            'The layout, steps, panels, tables and code blocks of the page that says how a demo works, in both themes.',
    },
    {
        file: 'how-it-works/index.html',
        path: ABOUT,
        title: 'How the design kit works · Jason Poteet',
        nav: null,
        description:
            'What happens as a page that uses the design kit loads, the mistakes shared styles often make and how the kit avoids each, and what it is built with.',
    },
] as const;

export type Route = (typeof ROUTES)[number];
