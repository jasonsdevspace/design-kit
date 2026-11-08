import * as kit from 'design-kit-release/react';
import type { ReactElement, ReactNode } from 'react';

import { declaredIn } from '../../design-kit/examples/palette.js';
import { CHROME, EXPLAINER } from '../../design-kit/examples/pieces.js';
import { type Control, CONTROLS, type State } from '../../design-kit/examples/states.js';
import { HowItWorks } from './explainer.js';
import { ABOUT, BASE, NPM, type Route, ROUTES, SOURCE } from './routes.js';
import { Colors, Contrast, Scale } from './tokens.js';

const { DemoFooter, PortfolioStrip, SkipLink } = kit;

/**
 * The version of the kit the site pins, its tokens sheet as the package ships it, and the commit
 * the site was built at.
 */
export interface Build {
    readonly version: string;
    readonly tokens: string;
    readonly commit: string;
    /** Each state's markup as the site draws it, laid out, by `codeKey`. */
    readonly markup: Readonly<Record<string, string>>;
}

/** The key a state's markup is found by: its control's name and its own. */
export const codeKey = (control: Control, state: State) => `${control.name} / ${state.name}`;

/** A state's markup, or a build that fails, rather than a page that shows an empty block. */
const markupFor = (markup: Build['markup'], control: Control, state: State) => {
    const found = markup[codeKey(control, state)];
    if (found === undefined)
        throw new Error(`no markup was laid out for ${codeKey(control, state)}`);
    return found;
};

/** A name as an id, its words joined by hyphens. */
const idOf = (name: string) =>
    name
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

/**
 * A block of code, titled, as the kit draws one: a frame that scrolls inside itself, named by its
 * title. A screen reader is given the title written whole with the state it is the code of, rather
 * than the short title beside a hidden rest, which a browser reads with a space before the comma.
 * The site's script puts a copy button beside the title.
 */
const CodeBlock = ({
    id,
    title,
    of,
    code,
}: {
    readonly id: string;
    readonly title: string;
    readonly of: string;
    readonly code: string;
}) => (
    <>
        <div className="site-code-head">
            <p className="dk-code-title" aria-hidden="true">
                {title}
            </p>
            <span className="dk-visually-hidden site-code-name" id={id}>
                {`${title}, ${of}`}
            </span>
        </div>
        <pre className="dk-code" role="region" aria-labelledby={id} tabIndex={0} translate="no">
            <code>{code}</code>
        </pre>
    </>
);

/**
 * The kit's footer, and after it the version of the kit the page is drawn from and the commit it
 * was built at.
 */
const SiteFooter = ({ build, current }: { readonly build: Build; readonly current?: 'about' }) => (
    <DemoFooter
        name="The design kit"
        about={ABOUT}
        source={SOURCE}
        {...(current === undefined ? {} : { current })}
    >
        This page uses version {build.version} of the kit, as published on npm, and was built at
        commit{' '}
        <a href={`${SOURCE}/commit/${build.commit}`}>
            <code>{build.commit.slice(0, 7)}</code>
        </a>
        .
    </DemoFooter>
);

/** The site's own pages, each marked as the current page where it is the one shown. */
const SiteNav = ({ current }: { readonly current: Route['file'] }) => (
    <nav className="site-nav" aria-label="Design kit">
        <ul role="list">
            {ROUTES.filter((route) => route.nav !== null).map((route) => (
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
        <PortfolioStrip about={ABOUT} source={SOURCE} toolsWaiting />
        <SiteNav current={current} />
        <main id="main-content" tabIndex={-1} className="site-main">
            {children}
        </main>
        <SiteFooter build={build} />
    </>
);

/**
 * The explainer, in the kit's own layout as a demo's explainer is: the strip and the footer mark it
 * as the current page, and a header leads back to the site, outside the main content so the skip
 * link passes it.
 */
const Explainer = ({ build }: { readonly build: Build }) => (
    <>
        <SkipLink />
        <PortfolioStrip about={ABOUT} source={SOURCE} current="about" toolsWaiting />
        <header className="dk-explainer-header">
            <a href={BASE}>The design kit</a>
        </header>
        <main id="main-content" tabIndex={-1} className="dk-explainer">
            <HowItWorks commit={build.commit} />
        </main>
        <SiteFooter build={build} current="about" />
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
 * One state of a control, drawn live in the visitor's theme and again in the other theme beside it.
 * The other copy is inert, so the keyboard and a screen reader pass over it, and its ids are its
 * own, so the page never holds one twice. The live copy is a group named by the state's name alone, so a screen
 * reader moving from control to control hears which state it is in. A pictured state's copy in the
 * visitor's theme is inert too, and both its copies are labeled as pictures. Under both, the
 * state's name and the attribute that draws it, and then its code, closed until a reader opens it:
 * its markup, and the React a page writes for it where a component draws it.
 */
const StateShown = ({
    state,
    pictured,
    markup,
    id,
    laidOut,
}: {
    readonly state: State;
    readonly pictured: boolean;
    readonly markup: string;
    readonly id: string;
    readonly laidOut: boolean;
}) => (
    <li className="site-state">
        {pictured ? (
            <div className="site-copy" inert>
                <p className="site-copy-label">A picture, in your theme</p>
                {state.draw(kit, (name) => `${name}-yours`)}
            </div>
        ) : (
            <div className="site-copy" role="group" aria-labelledby={`${id}-name`}>
                <p className="site-copy-label" aria-hidden="true">
                    Your theme
                </p>
                {state.draw(kit, (name) => name)}
            </div>
        )}
        <div className="site-copy site-other" inert>
            <p className="site-copy-label">
                {pictured ? 'A picture, in the other theme' : 'The other theme'}
            </p>
            {state.draw(kit, (name) => `${name}-other`)}
        </div>
        <p className="site-state-name">
            <span id={`${id}-name`}>{state.name}</span>, drawn by <code>{state.attribute}</code>
        </p>
        <details className="site-code" data-layout={laidOut ? 'laid-out' : 'as-written'}>
            <summary>
                <span aria-hidden="true">The code</span>
                <span className="dk-visually-hidden">{`The code, ${state.name}`}</span>
            </summary>
            <CodeBlock id={`${id}-markup`} title="Markup" of={state.name} code={markup} />
            {state.react === undefined ? null : (
                <CodeBlock id={`${id}-react`} title="React" of={state.name} code={state.react} />
            )}
        </details>
    </li>
);

/**
 * Each control under its own heading, with each of its states, its two copies side by side, or one
 * above the other at the column's full width where `wide` is set.
 */
const Shown = ({
    controls,
    markup,
    wide = false,
}: {
    readonly controls: readonly Control[];
    readonly markup: Build['markup'];
    readonly wide?: boolean;
}) =>
    controls.map((control) => (
        <section key={control.name}>
            <h2 id={idOf(control.name)}>{control.name}</h2>
            <ul className={wide ? 'site-states site-states-wide' : 'site-states'} role="list">
                {control.states.map((state) => (
                    <StateShown
                        key={state.name}
                        state={state}
                        pictured={control.pictured ?? false}
                        markup={markupFor(markup, control, state)}
                        id={`${idOf(control.name)}-${idOf(state.name)}`}
                        laidOut={control.laidOut ?? false}
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
        <Shown controls={CONTROLS} markup={build.markup} />
    </Page>
);

/** The skip link, and each state of the strip and the footer, as pictures. */
export const Chrome = ({ build }: { readonly build: Build }) => (
    <Page build={build} current="page-chrome/index.html">
        <h1>Page chrome</h1>
        <p className="site-lead">
            The skip link, the strip above the page that says whose demo it is, and the footer below
            it, which a demo draws around its page so a visitor finds the same links in the same
            places on each one. The ones around this page are the kit&rsquo;s own, drawn by its
            components as a demo draws them.
        </p>
        <p>
            Below, each state of the strip and the footer is drawn again in your theme and in the
            other, as pictures the keyboard and a screen reader pass over. A second live strip would
            give this page a second portfolio navigation, and a screen reader lists each one.
        </p>
        <section>
            <h2 id="skip-link">Skip link</h2>
            <p>
                The skip link is the first thing the keyboard reaches, out of sight until then. Load
                this page and press Tab to see it. Following it moves focus past the strip and the
                site&rsquo;s own links to the page&rsquo;s main content.
            </p>
        </section>
        <Shown controls={CHROME} markup={build.markup} wide />
    </Page>
);

/** An explainer's layout as a picture, and each piece it holds, live. */
export const Pieces = ({ build }: { readonly build: Build }) => (
    <Page build={build} current="explainer-pieces/index.html">
        <h1>Explainer pieces</h1>
        <p className="site-lead">
            The pieces of the page that says how a demo works, the one the strip&rsquo;s &ldquo;How
            it works&rdquo; link leads to. A demo writes them by hand in HTML, since none of them
            does anything a component would have to handle, and the kit&rsquo;s stylesheet styles
            them.
        </p>
        <p>
            Steps, panels, tables and code blocks are each live in your theme, with a copy in the
            other theme beside it and the attribute that draws it below. The explainer&rsquo;s
            layout is drawn as a picture in both themes, since it opens with the page&rsquo;s main
            heading and this page already has one.
        </p>
        <Shown controls={EXPLAINER} markup={build.markup} />
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
                    <code>data-theme</code> on the root to the theme the visitor saved under the key{' '}
                    <code>theme</code>, or, when nothing usable is saved, as when System is chosen,
                    to the system&rsquo;s, following it as it changes. It hears a choice saved in
                    another tab. Every demo served from jasonsdevspace.com reads the same saved
                    theme, and this page does too. With scripts on, the switch at the top of each
                    page of this site saves a choice under that key with the portfolio&rsquo;s
                    values, as the portfolio&rsquo;s switch does.
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
    'how-it-works/index.html': (build) => <Explainer build={build} />,
};
