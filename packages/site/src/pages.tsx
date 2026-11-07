import * as kit from 'design-kit-release/react';
import type { ReactElement, ReactNode } from 'react';

import { CONTROLS, type State } from '../../design-kit/examples/states.js';
import { type Route, ROUTES } from './routes.js';

const { DemoFooter, PortfolioStrip, SkipLink } = kit;

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

/** The site's own pages, each marked as the current page where it is the one shown. */
const SiteNav = ({ current }: { readonly current: Route['file'] }) => (
    <nav className="site-nav" aria-label="Design kit">
        <ul role="list">
            {ROUTES.map((route) => (
                <li key={route.file}>
                    <a href={route.path} aria-current={route.file === current ? 'page' : undefined}>
                        {route.nav}
                    </a>
                </li>
            ))}
        </ul>
    </nav>
);

/**
 * A page of the site: the kit's own skip link, strip and footer around the site's navigation and
 * the page's content, and in the footer the version of the kit it is drawn from and the commit it
 * was built at.
 */
const Page = ({
    build,
    current,
    children,
}: {
    readonly build: Build;
    readonly current: Route['file'];
    readonly children: ReactNode;
}) => (
    <>
        <SkipLink />
        <PortfolioStrip about={aboutOf(build)} source={SOURCE} />
        <SiteNav current={current} />
        <main id="main-content" tabIndex={-1} className="site-main">
            {children}
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

/** The landing page: what the kit is. */
export const Landing = ({ build }: { readonly build: Build }) => (
    <Page build={build} current="index.html">
        <h1>The design kit</h1>
        <p className="site-lead">
            The tokens, theme script, page chrome, controls and explainer layout the demos on
            jasonsdevspace.com are built to share, so they read as one body of work and a fix to a
            button is made once.
        </p>
        <p>
            It is <a href={NPM}>@jasonsdevspace/design-kit</a> on npm. Its styles load from a
            page&rsquo;s own origin and its components draw markup alone, so a page under{' '}
            <code>style-src &apos;self&apos;</code> draws it, as this one does.
        </p>
    </Page>
);

/**
 * One state of a control, drawn live in the visitor's theme and again in the other theme beside
 * it. The other copy is inert, so the keyboard and a screen reader pass over it, and its ids are
 * its own, so the page never holds one twice. Under both, the state's name and the attribute that
 * draws it.
 */
const StateShown = ({ state }: { readonly state: State }) => (
    <li className="site-state">
        <div className="site-copy">{state.draw(kit, (name) => name)}</div>
        <div className="site-copy site-other" inert>
            <p className="site-copy-label">The other theme</p>
            {state.draw(kit, (name) => `${name}-other`)}
        </div>
        <p className="site-state-name">
            {state.name}, drawn by <code>{state.attribute}</code>
        </p>
    </li>
);

/** Each state of the buttons, fields and callouts. */
export const Controls = ({ build }: { readonly build: Build }) => (
    <Page build={build} current="controls/index.html">
        <h1>Controls</h1>
        <p className="site-lead">
            Each state of the kit&rsquo;s buttons, fields and callouts, live in your theme, with a
            copy in the other theme beside it and the attribute that draws it below. A toggle, an
            open panel, a control that is unavailable and a field with an error are each drawn from
            the attribute a screen reader already reads, never a class of the kit&rsquo;s, so what
            you see and what a screen reader says come from one place. A kind of control, such as
            the one action a view leads with or a callout&rsquo;s tone, is a class.
        </p>
        {CONTROLS.map((control) => (
            <section key={control.name}>
                <h2 id={control.name.toLowerCase()}>{control.name}</h2>
                <ul className="site-states" role="list">
                    {control.states.map((state) => (
                        <StateShown key={state.name} state={state} />
                    ))}
                </ul>
            </section>
        ))}
    </Page>
);

/** What each page draws, by the HTML file it is built from. */
export const PAGES: Readonly<Record<Route['file'], (build: Build) => ReactElement>> = {
    'index.html': (build) => <Landing build={build} />,
    'controls/index.html': (build) => <Controls build={build} />,
};
