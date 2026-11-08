import * as kit from 'design-kit-release/react';
import { type ComponentProps, Fragment, type ReactElement, type ReactNode } from 'react';

import { type Group, HELD } from '../../design-kit/examples/held.js';
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
 * A control's name as a group the tests are listed for, or a build that fails, rather than a page
 * that lists none.
 */
const groupOf = (name: string): Group => {
    if (!Object.hasOwn(HELD, name)) throw new Error(`no tests are listed for ${name}`);
    return name as Group;
};

/**
 * A closed panel that lists the kit's tests for a group, by the names the runner reports, under
 * the file each is in. Each file links to its source at the commit the page was built at. A screen
 * reader hears the group's name with the summary, as with a state's code.
 */
const Tests = ({ group, commit }: { readonly group: Group; readonly commit: string }) => (
    <details className="site-held">
        <summary>
            <span aria-hidden="true">What the tests check</span>
            <span className="dk-visually-hidden">{`What the tests check, ${group}`}</span>
        </summary>
        <p>
            These are the kit&rsquo;s own tests for this part, named exactly as the test runner
            prints them. They are the tests in the repository when this page was built, which can be
            newer than the published version drawn above. Each file name opens that file as it was
            then.
        </p>
        {HELD[group].map(({ file, titles }) => (
            <Fragment key={file}>
                <p className="site-held-file">
                    {file.startsWith('e2e/') ? 'In a browser' : 'Without a browser'}, from{' '}
                    <a href={`${SOURCE}/blob/${commit}/packages/design-kit/${file}`}>
                        <code>{file}</code>
                    </a>
                </p>
                <ul className="site-held-tests">
                    {titles.map((title) => (
                        <li key={title}>{title}</li>
                    ))}
                </ul>
            </Fragment>
        ))}
    </details>
);

/**
 * The kit's footer, and after it the version of the kit the page is drawn from and the commit it
 * was built at.
 */
const SiteFooter = ({
    build,
    current,
}: {
    readonly build: Build;
    readonly current?: ComponentProps<typeof DemoFooter>['current'];
}) => (
    <DemoFooter name="The design kit" about={ABOUT} source={SOURCE} current={current}>
        This page uses version {build.version} of the kit, as published on npm, and was built at
        commit{' '}
        <a href={`${SOURCE}/commit/${build.commit}`}>
            <code>{build.commit.slice(0, 7)}</code>
        </a>
        .
    </DemoFooter>
);

/**
 * The site's header under the strip: its mark and name, leading to the landing page, and its own
 * pages as tabs, the current one marked as the page, all in the site's navigation so nothing in it
 * sits outside a landmark. The mark is the site's own markup, so the policy that refuses outside
 * styles holds, and is hidden from a screen reader, which hears the name.
 */
const SiteNav = ({ current }: { readonly current: Route['file'] }) => (
    <nav className="site-header" aria-label="Design kit">
        <a className="site-brand" href={BASE}>
            <span className="site-mark" aria-hidden="true">
                dk
            </span>
            The design kit
        </a>
        <ul className="site-tabs" role="list">
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
            One shared set of colors, type, buttons, fields and page layouts, made for the demos on
            jasonsdevspace.com, so they can read as one body of work and a fix to a button is made
            once. ShelfLens is built on it.
        </p>
        <p>
            It is published on npm as <a href={NPM}>@jasonsdevspace/design-kit</a>. Its styles are
            plain files and its components add no inline styles, so it works on a page whose
            security policy refuses any style the site did not serve itself, as this one does. Its
            theme script runs inline, so a page that limits scripts allows it by the hash the kit
            gives.
        </p>
        <p>
            <a href={ABOUT}>How the design kit works</a> explains it in plain words. The other pages
            in the site&rsquo;s menu show each piece in both themes.
        </p>
    </Page>
);

/**
 * The theme a copy is drawn in, by name: the page's own, or the other. Both words are in the page,
 * and the page's theme decides which one shows, the theme the script set or the system's where no
 * script ran, as it decides each copy's colors.
 */
const ThemeName = ({ of }: { readonly of: 'page' | 'other' }) => (
    <>
        <span className={`site-${of}-light`}>Light</span>
        <span className={`site-${of}-dark`}>Dark</span>
    </>
);

/**
 * One state of a control, drawn live in the visitor's theme and again in the other theme beside it.
 * The other copy is inert, so the keyboard and a screen reader pass over it, and its ids are its
 * own, so the page never holds one twice. The live copy is a group named by the state's name alone,
 * so a screen reader moving from control to control hears which state it is in. A pictured state's
 * copy in the visitor's theme is inert too, and both its copies are labeled as pictures. Each copy
 * is labeled by its theme's name: the live one marked Live, the other a preview, which the site's
 * script explains when it is tapped, and a picture a picture. Under both, the state's name and the
 * attribute that draws it, and then its code, closed until a reader opens it: its markup, and the
 * React a page writes for it where a component draws it.
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
    <li className={pictured ? 'site-state site-state-pictured' : 'site-state'}>
        {pictured ? (
            <div className="site-copy" inert>
                <p className="site-copy-label">
                    <ThemeName of="page" />, a picture
                </p>
                {state.draw(kit, (name) => `${name}-yours`)}
            </div>
        ) : (
            <div className="site-copy" role="group" aria-labelledby={`${id}-name`}>
                <p className="site-copy-label" aria-hidden="true">
                    <ThemeName of="page" /> <span className="site-live">Live</span>
                </p>
                {state.draw(kit, (name) => name)}
            </div>
        )}
        <div className="site-copy site-other" inert>
            <p className="site-copy-label">
                <ThemeName of="other" />
                {pictured ? ', a picture' : ', preview only'}
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
 * above the other at the column's full width where `wide` is set, and then the tests that hold it.
 */
const Shown = ({
    controls,
    build: { markup, commit },
    wide = false,
}: {
    readonly controls: readonly Control[];
    readonly build: Build;
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
            <Tests group={groupOf(control.name)} commit={commit} />
        </section>
    ));

/** Each state of the buttons, fields and callouts. */
export const Controls = ({ build }: { readonly build: Build }) => (
    <Page build={build} current="controls/index.html">
        <h1>Controls</h1>
        <p className="site-lead">
            Each state of the kit&rsquo;s buttons, fields and callouts is drawn twice: live in your
            theme, marked Live, and as a preview in the other theme. To try the other theme, choose
            it under Theme in the strip. Under each state is the attribute that draws it. A toggle,
            an open panel, a control that is unavailable and a field with an error each come from
            the attribute a screen reader already reads, never from a class of the kit&rsquo;s. So
            what you see and what a screen reader says come from one place. A kind of control, such
            as the one action a view leads with or a callout&rsquo;s tone, comes from a class
            instead.
        </p>
        <Shown controls={CONTROLS} build={build} />
    </Page>
);

/** The skip link, and each state of the strip and the footer, as pictures. */
export const Chrome = ({ build }: { readonly build: Build }) => (
    <Page build={build} current="page-chrome/index.html">
        <h1>Page chrome</h1>
        <p className="site-lead">
            Page chrome is what a demo draws around its content: the skip link, the strip across the
            top that says whose demo it is, and the footer. With it a visitor finds the same links
            in the same places on each demo built with the kit. The chrome around this page is the
            kit&rsquo;s own, drawn by its components as a demo draws it.
        </p>
        <p>
            Under Strip and Footer, each state is drawn again in your theme and in the other, as
            pictures the keyboard and a screen reader pass over. A second live strip would give this
            page a second portfolio menu, and a screen reader would list both.
        </p>
        <section>
            <h2 id="skip-link">Skip link</h2>
            <p>
                The skip link is the first thing the keyboard reaches, out of sight until then. Load
                this page and press Tab to see it. Following it moves focus past the strip and the
                site&rsquo;s own links to the page&rsquo;s main content.
            </p>
            <Tests group="Skip link" commit={build.commit} />
        </section>
        <Shown controls={CHROME} build={build} wide />
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
            Steps, panels, tables and code blocks are each drawn twice: live in your theme, marked
            Live, and as a preview in the other theme, with the attribute that draws them under
            both. To try the other theme, choose it under Theme in the strip. The explainer&rsquo;s
            layout is drawn as a picture in both themes, since it opens with the page&rsquo;s main
            heading and this page already has one.
        </p>
        <Shown controls={EXPLAINER} build={build} />
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
                    Each role holds its light and its dark value in one <code>light-dark()</code>.
                    It picks a value by the color scheme of the element it is drawn on. So each
                    swatch in the table is drawn in its column&rsquo;s theme, whatever theme the
                    page is in.
                </p>
                <Colors declared={declared} />
                <Tests group="Color" commit={build.commit} />
            </section>
            <section>
                <h2 id="contrast">Contrast</h2>
                <p>
                    Contrast is how far apart two colors are in brightness, written as a ratio. Text
                    passes 4.5 to 1 on every ground it is meant for, and the edge of a control 3 to
                    1, in both themes, as the web&rsquo;s accessibility guidelines, WCAG, ask. These
                    are measured from the tokens of the version this page uses, rounded down, and
                    the kit&rsquo;s own test holds each one before a version is released. The table
                    lists first the pairings with the least to spare.
                </p>
                <Contrast declared={declared} />
                <Tests group="Contrast" commit={build.commit} />
            </section>
            <section>
                <h2 id="scale">Scale</h2>
                <p>
                    Sizes that should grow with a reader&rsquo;s own text size are in rem, code set
                    in running text is in em, and a border, the focus ring and a shadow are in px,
                    since they must not grow with the text.
                </p>
                <Scale declared={declared} />
                <Tests group="Scale" commit={build.commit} />
            </section>
            <section>
                <h2 id="theme">How the theme is chosen</h2>
                <p>
                    The kit&rsquo;s theme script runs inline in a page&rsquo;s head, before anything
                    is drawn, so a page never flashes the other theme. It sets{' '}
                    <code>data-theme</code> on the root to the theme the visitor saved under the key{' '}
                    <code>theme</code>. When nothing usable is saved, as when System is chosen, it
                    follows the system&rsquo;s theme as it changes. A choice made in another tab
                    reaches this one too. Every demo served from jasonsdevspace.com reads the same
                    saved theme, and this page does too. With scripts on, the switch at the top of
                    each page of this site saves your choice under that key, in the same words the
                    portfolio&rsquo;s switch uses, so a choice made on either holds on both.
                </p>
                <Tests group="How the theme is chosen" commit={build.commit} />
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
