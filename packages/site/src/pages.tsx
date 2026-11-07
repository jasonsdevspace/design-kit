import * as kit from 'design-kit-release/react';
import type { ReactElement, ReactNode } from 'react';

import { declaredIn } from '../../design-kit/examples/palette.js';
import { CHROME, EXPLAINER } from '../../design-kit/examples/pieces.js';
import { type Control, CONTROLS, type State } from '../../design-kit/examples/states.js';
import { type Route, ROUTES } from './routes.js';
import { Colors, Contrast, Scale } from './tokens.js';

const { DemoFooter, PortfolioStrip, SkipLink } = kit;

/** The kit's repository, which the strip and the footer link as the site's source. */
export const SOURCE = 'https://github.com/jasonsdevspace/design-kit';

/** How the kit works, the package's README at the tag of the version a page uses. */
const aboutOf = (build: Build) =>
    `${SOURCE}/tree/design-kit-v${build.version}/packages/design-kit#readme`;

/** The package on npm. */
const NPM = 'https://www.npmjs.com/package/@jasonsdevspace/design-kit';

/**
 * The version of the kit the site pins, its tokens sheet as the package ships it, and the commit
 * the site was built at.
 */
export interface Build {
    readonly version: string;
    readonly tokens: string;
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
 * its own, so the page never holds one twice. A pictured state's copy in the visitor's theme is
 * inert too, and labeled as the other is. Under both, the state's name and the attribute that
 * draws it.
 */
const StateShown = ({ state, pictured }: { readonly state: State; readonly pictured: boolean }) => (
    <li className="site-state">
        {pictured ? (
            <div className="site-copy" inert>
                <p className="site-copy-label">Your theme</p>
                {state.draw(kit, (name) => `${name}-yours`)}
            </div>
        ) : (
            <div className="site-copy">{state.draw(kit, (name) => name)}</div>
        )}
        <div className="site-copy site-other" inert>
            <p className="site-copy-label">The other theme</p>
            {state.draw(kit, (name) => `${name}-other`)}
        </div>
        <p className="site-state-name">
            {state.name}, drawn by <code>{state.attribute}</code>
        </p>
    </li>
);

/**
 * Each control under its own heading, with each of its states, side by side, or one above the other
 * at the column's full width where the states are `wide`.
 */
const Shown = ({
    controls,
    wide = false,
}: {
    readonly controls: readonly Control[];
    readonly wide?: boolean;
}) =>
    controls.map((control) => (
        <section key={control.name}>
            <h2 id={control.name.toLowerCase().replaceAll(' ', '-')}>{control.name}</h2>
            <ul className={wide ? 'site-states site-states-wide' : 'site-states'} role="list">
                {control.states.map((state) => (
                    <StateShown
                        key={state.name}
                        state={state}
                        pictured={control.pictured ?? false}
                    />
                ))}
            </ul>
        </section>
    ));

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
        <Shown controls={CONTROLS} />
    </Page>
);

/** The skip link, and each state of the strip and the footer, as pictures. */
export const Chrome = ({ build }: { readonly build: Build }) => (
    <Page build={build} current="page-chrome/index.html">
        <h1>Page chrome</h1>
        <p className="site-lead">
            The skip link, strip and footer every demo draws around its page, so a visitor finds the
            same way in, the same links and the same way out on each one. The ones around this page
            are the kit&rsquo;s own, drawn live by its components.
        </p>
        <p>
            Below, each state of the strip and the footer is drawn again in your theme and in the
            other, as pictures the keyboard and a screen reader pass over. A second live strip would
            give this page a second portfolio navigation, and a screen reader lists each one.
        </p>
        <section>
            <h2 id="skip-link">Skip link</h2>
            <p>
                The skip link is the first thing the keyboard reaches, out of sight until then.
                Press Tab at the top of this page to see it. Following it moves focus past the strip
                to the page&rsquo;s main content.
            </p>
        </section>
        <Shown controls={CHROME} wide />
    </Page>
);

/** An explainer's layout as a picture, and each piece it holds, live. */
export const Pieces = ({ build }: { readonly build: Build }) => (
    <Page build={build} current="explainer-pieces/index.html">
        <h1>Explainer pieces</h1>
        <p className="site-lead">
            The pieces of the page that says how a demo works, the one each strip&rsquo;s &ldquo;How
            it works&rdquo; link leads to. A page writes them by hand, since none has logic for a
            component to hide, and the kit&rsquo;s sheet draws them.
        </p>
        <p>
            Each piece is live in your theme, with a copy in the other theme beside it. The
            page&rsquo;s own layout is drawn as a picture in both, since it holds a heading of the
            first level, and this page has its own.
        </p>
        <Shown controls={EXPLAINER} />
    </Page>
);

/** The color roles in both themes, the contrast of every pairing, the scale, and the theme. */
export const Tokens = ({ build }: { readonly build: Build }) => {
    const declared = declaredIn(build.tokens);
    return (
        <Page build={build} current="tokens/index.html">
            <h1>Tokens and theme</h1>
            <p className="site-lead">
                The kit&rsquo;s tokens are the named colors and sizes every demo is drawn from. Each
                is a custom property under the <code>--dk-</code> prefix, so a page that loads the
                kit beside its own styles keeps its own names. A demo with its own palette sets the
                color roles again on its root, both themes at once.
            </p>
            <section>
                <h2 id="color">Color</h2>
                <p>
                    Each role holds its light and its dark value in one <code>light-dark()</code>,
                    which picks by the color scheme of the element it is drawn on, so each swatch
                    below is drawn in its column&rsquo;s theme, whatever theme the page is in.
                </p>
                <Colors declared={declared} />
            </section>
            <section>
                <h2 id="contrast">Contrast</h2>
                <p>
                    Contrast is how far apart two colors are in brightness, written as a ratio. Text
                    passes 4.5 to 1 on every ground it is meant for, and the edge of a control 3 to
                    1, in both themes, as WCAG asks. These are measured from the tokens of the
                    version this page uses, rounded down, and the kit&rsquo;s own test holds each
                    one before a version is released. The table puts first the pairing with the
                    least to spare over what it needs.
                </p>
                <Contrast declared={declared} />
            </section>
            <section>
                <h2 id="scale">Scale</h2>
                <p>
                    Sizes that should grow with a reader&rsquo;s own text size are in rem, code set
                    in running text is in em, and a border, the focus ring and a shadow are in px,
                    since they must not grow with the text.
                </p>
                <Scale declared={declared} />
            </section>
            <section>
                <h2 id="theme">The theme a visitor saved</h2>
                <p>
                    The kit&rsquo;s theme script runs inline in a page&rsquo;s head, before anything
                    is drawn, so a page never flashes the other theme. It sets{' '}
                    <code>data-theme</code> on the root to the theme the visitor saved on the
                    portfolio, under the key <code>theme</code>, or to the system&rsquo;s when
                    nothing usable is saved. It follows the system as it changes while nothing is
                    saved, and hears a choice saved in another tab. Every demo served from
                    jasonsdevspace.com reads the same saved theme, and this page does too.
                </p>
            </section>
        </Page>
    );
};

/** What each page draws, by the HTML file it is built from. */
export const PAGES: Readonly<Record<Route['file'], (build: Build) => ReactElement>> = {
    'index.html': (build) => <Landing build={build} />,
    'tokens/index.html': (build) => <Tokens build={build} />,
    'controls/index.html': (build) => <Controls build={build} />,
    'page-chrome/index.html': (build) => <Chrome build={build} />,
    'explainer-pieces/index.html': (build) => <Pieces build={build} />,
};
