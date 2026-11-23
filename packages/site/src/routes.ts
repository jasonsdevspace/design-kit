/**
 * The site's pages, each the HTML file Vite builds it from, relative to the site, the path a
 * visitor asks for under the base GitHub Pages serves the site from, the page's title, the name the
 * site's navigation gives it, or none for a page the navigation leaves out, such as the landing
 * page, which the brand leads to, the explainer, which the strip and the footer lead to as a demo's
 * do, and the behavior and own palette pages, which the pages beside them lead to, the short line its card on the landing page gives it, for a page that has one, and the
 * description a search result shows for it. The build, the browser tests and the Lighthouse audit
 * all read this one list.
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
        nav: null,
        description:
            'The design kit: one set of colors, type, buttons, fields and page layouts for the demos on jasonsdevspace.com, shown in the light and dark themes.',
    },
    {
        file: 'tokens/index.html',
        path: `${BASE}tokens/`,
        title: 'Tokens and theme · The design kit · Jason Poteet',
        nav: 'Tokens',
        card: 'Colors, contrast, type, sizes, waits and the theme.',
        description:
            'The design kit’s color roles in both themes, the contrast of every pairing they are meant for, its type drawn at each size, its radius, motion, waits and sizes, and how the theme is chosen.',
    },
    {
        file: 'controls/index.html',
        path: `${BASE}controls/`,
        title: 'Controls · The design kit · Jason Poteet',
        nav: 'Controls',
        card: 'Buttons, fields, waits, progress and dialogs in every state.',
        description:
            'Each state of the design kit’s buttons, busy buttons, marked and read-only fields, steppers, callouts with Try again, loading lines, progress and dialogs in both themes, with the code behind it, and its toast.',
    },
    {
        file: 'app-pieces/index.html',
        path: `${BASE}app-pieces/`,
        title: 'App pieces · The design kit · Jason Poteet',
        nav: 'App pieces',
        card: 'The frame, dock, tab bar, grids, rows and empty lists of an app.',
        description:
            'The frame, dock with a compact action, tab bar, button grids, rows, empty lists, tiles and pinned table the design kit gives a phone app, in both themes, with the code behind each.',
    },
    {
        file: 'layouts/index.html',
        path: `${BASE}layouts/`,
        title: 'Layouts · The design kit · Jason Poteet',
        nav: 'Layouts',
        card: 'Content pages, bands, a hero, stacks and split rows.',
        description:
            'The content page, bands with a hero, groups of sections, stacks, split rows, notes and numerals the design kit lays a page out with, in both themes, with the code behind each.',
    },
    {
        file: 'page-chrome/index.html',
        path: `${BASE}page-chrome/`,
        title: 'Page chrome · The design kit · Jason Poteet',
        nav: 'Chrome',
        card: 'The skip link, top strip and footer around each demo.',
        description:
            'The skip link, strip and footer a demo draws around its page from the design kit, with each state of the strip and the footer in both themes and the code behind it.',
    },
    {
        file: 'explainer-pieces/index.html',
        path: `${BASE}explainer-pieces/`,
        title: 'Explainer pieces · The design kit · Jason Poteet',
        nav: 'Explainer',
        card: 'The layout and pieces of the page that explains a demo.',
        description:
            'The layout, steps, panels, tables and code blocks the design kit gives the page that explains each demo, in both themes.',
    },
    {
        file: 'together/index.html',
        path: `${BASE}together/`,
        title: 'The pieces together · The design kit · Jason Poteet',
        nav: null,
        description:
            'The design kit’s tabs, raised panel, tiles, icons and dialog stacked as an app’s home page stacks them, each set apart from what it sits on, in both themes.',
    },
    {
        file: 'behavior/index.html',
        path: `${BASE}behavior/`,
        title: 'Behavior · The design kit · Jason Poteet',
        nav: null,
        description:
            'The design kit’s refused form, busy button, arrow keys through a grid, focus moved after a change and a part of the page that loads, each working, with what it says on its status line and the code behind it.',
    },
    {
        file: 'own-palette/index.html',
        path: `${BASE}own-palette/`,
        title: 'A page’s own palette · The design kit · Jason Poteet',
        nav: null,
        description:
            'A page drawn by the design kit in its own colors and its own column, its rules in a layer after the kit’s, with the contrast of each pairing in its palette and the properties a page sets.',
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
