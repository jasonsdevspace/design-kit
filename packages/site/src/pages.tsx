import { DemoFooter, PortfolioStrip, SkipLink } from 'design-kit-release/react';
import type { ReactElement } from 'react';

import type { Route } from './routes.js';

/** The kit's repository, which the strip and the footer link as the site's source. */
export const SOURCE = 'https://github.com/jasonsdevspace/design-kit';

/** How the kit works, the package's README at the tag of the version a page uses. */
const aboutOf = (build: Build) =>
    `${SOURCE}/tree/design-kit-v${build.version}/packages/design-kit#readme`;

/** The package on npm. */
const NPM = 'https://www.npmjs.com/package/@jasonsdevspace/design-kit';

/** The version of the kit the site pins, and the commit the site was built at. */
export interface Build {
    readonly version: string;
    readonly commit: string;
}

/**
 * The landing page: what the kit is, with the kit's own skip link, strip and footer around it,
 * and in the footer the version of the kit it is drawn from and the commit it was built at.
 */
export const Landing = ({ build }: { readonly build: Build }) => (
    <>
        <SkipLink />
        <PortfolioStrip about={aboutOf(build)} source={SOURCE} />
        <main id="main-content" tabIndex={-1} className="site-main">
            <h1>The design kit</h1>
            <p className="site-lead">
                The tokens, theme script, page chrome, controls and explainer layout the demos on
                jasonsdevspace.com are built to share, so they read as one body of work and a fix to
                a button is made once.
            </p>
            <p>
                It is <a href={NPM}>@jasonsdevspace/design-kit</a> on npm. Its styles load from a
                page&rsquo;s own origin and its components draw markup alone, so a page under{' '}
                <code>style-src &apos;self&apos;</code> draws it, as this one does.
            </p>
        </main>
        <DemoFooter name="The design kit" about={aboutOf(build)} source={SOURCE}>
            This page uses version {build.version} of the kit, as published on npm, and was built at
            commit{' '}
            <a href={`${SOURCE}/commit/${build.commit}`}>
                <code>{build.commit.slice(0, 7)}</code>
            </a>
            .
        </DemoFooter>
    </>
);

/** What each page draws, by the HTML file it is built from. */
export const PAGES: Readonly<Record<Route['file'], (build: Build) => ReactElement>> = {
    'index.html': (build) => <Landing build={build} />,
};
