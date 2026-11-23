import * as kit from 'design-kit-release/react';
import { type ComponentProps, Fragment, type ReactElement, type ReactNode } from 'react';

import { type Group, HELD } from '../../design-kit/examples/held.js';
import { declaredIn, pagePropertiesIn } from '../../design-kit/examples/palette.js';
import { APP, CHROME, EXPLAINER, LAYOUTS } from '../../design-kit/examples/pieces.js';
import { type Control, CONTROLS, type State } from '../../design-kit/examples/states.js';
import { type Behavior, behaviorKey, BEHAVIORS } from './behavior.js';
import { HowItWorks } from './explainer.js';
import { FAINT, TILES } from './mark.js';
import { OWN_PIECES } from './own-palette.js';
import { ABOUT, BASE, NPM, type Route, ROUTES, SOURCE } from './routes.js';
import { Colors, Contrast, Scale, SCALE_GROUPS, Spaces, Table, TypeScale } from './tokens.js';

const { DemoFooter, PortfolioStrip, SkipLink, Toast } = kit;

/**
 * The version of the kit the site pins, its tokens sheet as the package ships it, its three sheets
 * together, and the commit the site was built at.
 */
export interface Build {
    readonly version: string;
    readonly tokens: string;
    /** The tokens, base and components sheets joined, which the tokens page reads its tokens from. */
    readonly sheets: string;
    /** The sheet the own palette page sets its palette and column in, as the page loads it. */
    readonly ownPalette: string;
    readonly commit: string;
    /** Each state's markup by `codeKey`, and each behavior's by `behaviorKey`, laid out. */
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
 * Each block is a panel of its own, which the site's script makes a tab's panel where a state has
 * two, and it puts the one copy button beside the title or the tabs.
 */
const CodeBlock = ({
    id,
    title,
    of,
    code,
}: {
    readonly id: string;
    readonly title: string;
    readonly of?: string;
    readonly code: string;
}) => (
    <div className="site-code-panel">
        <div className="dk-code-head">
            <p className="dk-code-title" aria-hidden="true">
                {title}
            </p>
            <span className="dk-visually-hidden site-code-name" id={id}>
                {of === undefined ? title : `${title}, ${of}`}
            </span>
        </div>
        <pre className="dk-code" role="region" aria-labelledby={id} tabIndex={0} translate="no">
            <code>{code}</code>
        </pre>
    </div>
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
            These are the design kit&rsquo;s own tests for this part, named as the test runner
            prints them. They come from the source on GitHub as it was when this page was built, so
            they can be newer than the version named in the footer. Each file name opens that file
            as it was then.
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
 * The kit's footer, with the version of the kit the page is drawn from and the commit it was built
 * at as its own line, beside the footer's text on a wide screen and under it on a phone.
 */
const SiteFooter = ({
    build,
    current,
}: {
    readonly build: Build;
    readonly current?: ComponentProps<typeof DemoFooter>['current'];
}) => (
    <DemoFooter
        name="The design kit"
        about={ABOUT}
        source={SOURCE}
        current={current}
        aside={
            <>
                This site uses version {build.version} of the design kit, from npm. Built at commit{' '}
                <a href={`${SOURCE}/commit/${build.commit}`}>
                    <code>{build.commit.slice(0, 7)}</code>
                </a>
                .
            </>
        }
    />
);

/**
 * The site's header under the strip, the kit's site header: its mark and name, leading to the
 * landing page, and its own pages as the kit's link pills in the site's navigation, the current one
 * marked as the page. It is the page's banner, as the explainer's header is, so a screen reader
 * that moves to the banner finds the way around the site on every page. The mark is the site's icon
 * in the kit's slot, its tiles drawn in the text on the accent and in the page's own theme, in the
 * site's own markup, so the policy that refuses outside styles holds. It is hidden from a screen
 * reader, which hears the name.
 */
const SiteNav = ({ current }: { readonly current: Route['file'] }) => (
    <header className="dk-site-header">
        <a
            className="dk-site-brand"
            href={BASE}
            aria-current={current === 'index.html' ? 'page' : undefined}
        >
            <span className="dk-site-mark site-mark" aria-hidden="true">
                <svg viewBox="0 0 32 32">
                    {TILES.map((tile) =>
                        tile.shape === 'circle' ? (
                            <circle
                                key={`${String(tile.x)} ${String(tile.y)}`}
                                cx={tile.x}
                                cy={tile.y}
                                r={tile.radius}
                            />
                        ) : (
                            <rect
                                key={`${String(tile.x)} ${String(tile.y)}`}
                                x={tile.x}
                                y={tile.y}
                                width={tile.size}
                                height={tile.size}
                                rx={tile.radius}
                                fillOpacity={tile.faint ? FAINT : undefined}
                            />
                        )
                    )}
                </svg>
            </span>
            The design kit
        </a>
        <nav aria-label="Site">
            <ul className="dk-pills" role="list">
                {ROUTES.filter((route) => route.nav !== null).map((route) => (
                    <li key={route.file}>
                        <a
                            className="dk-pill"
                            href={route.path}
                            aria-current={route.file === current ? 'page' : undefined}
                        >
                            {route.nav}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    </header>
);

/**
 * The kit's theme switch, in a template the site's script puts in the room the strip keeps for it.
 * A template is drawn by no browser and read by no screen reader, so with no script the page holds
 * only the room, in a section with no name and so no landmark. The note names jasonsdevspace.com,
 * since the choice is saved under the portfolio's key and holds on every page of it.
 */
const ThemeSwitchToCome = () => (
    <template id="site-theme-switch">
        <kit.ThemeSwitch
            id="site-theme"
            name="site-theme"
            note="Your choice is saved for every page on jasonsdevspace.com, the portfolio included."
        />
    </template>
);

/**
 * The kit's copy button and status line, in a template the site's script copies a button from for
 * each block of code, and the status line from on a page with code. With no script there is nothing
 * to copy with, and a template is drawn by no browser and read by no screen reader.
 */
const CopyToCome = () => (
    <template id="site-copy">
        <kit.CopyButton name="" />
        <kit.CopyStatus />
    </template>
);

/** A section a page lists, by its heading and the id its heading carries. */
interface Listed {
    readonly name: string;
    readonly id: string;
}

/** Sections whose ids come from their names, as the pages of states give them. */
const listed = (names: readonly string[]): readonly Listed[] =>
    names.map((name) => ({ name, id: idOf(name) }));

/**
 * The sections of a page as a plain list of links, inside the main content right after the page's
 * opening, so the skip link lands just before it and the keyboard reaches it next. A narrow screen
 * shows it there as a short list of contents, and a wide one beside the content, held in sight as
 * the page scrolls. It is shown at every width, since a phone's reader and one zoomed in, a screen
 * reader among them, need the overview of a long page most.
 */
const OnThisPage = ({ sections }: { readonly sections: readonly Listed[] }) => (
    <nav className="site-toc" aria-labelledby="site-toc-name">
        <div className="site-toc-words">
            <p className="dk-eyebrow site-toc-name" id="site-toc-name">
                On this page
            </p>
            <ul role="list">
                {sections.map(({ name, id }) => (
                    <li key={id}>
                        <a href={`#${id}`}>{name}</a>
                    </li>
                ))}
            </ul>
        </div>
    </nav>
);

/**
 * A page of the site: the kit's own skip link, strip and footer around the site's header and the
 * page's content, and in the footer's own line the version of the kit it is drawn from and the
 * commit it was built at. A page with a title opens with it, its lead and any paragraphs of
 * introduction after the lead, and a page with sections lists them after that whole opening, so
 * every such page opens the same way and its column starts in the same place.
 */
const Page = ({
    build,
    current,
    title,
    lead,
    intro,
    sections,
    children,
}: {
    readonly build: Build;
    readonly current: Route['file'];
    readonly title?: string;
    readonly lead?: ReactNode;
    readonly intro?: ReactNode;
    readonly sections?: readonly Listed[];
    readonly children: ReactNode;
}) => (
    <>
        <SkipLink />
        <PortfolioStrip about={ABOUT} source={SOURCE} toolsWaiting />
        <ThemeSwitchToCome />
        <CopyToCome />
        <SiteNav current={current} />
        <main
            id="main-content"
            tabIndex={-1}
            className={sections === undefined ? 'dk-page' : 'dk-page site-listed'}
        >
            {title === undefined ? null : <h1>{title}</h1>}
            {lead === undefined ? null : <p className="dk-lead">{lead}</p>}
            {intro}
            {sections === undefined ? null : <OnThisPage sections={sections} />}
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
        <ThemeSwitchToCome />
        <CopyToCome />
        <header className="dk-explainer-header">
            <a href={BASE}>The design kit</a>
        </header>
        <main id="main-content" tabIndex={-1} className="dk-explainer">
            <HowItWorks commit={build.commit} version={build.version} />
        </main>
        <SiteFooter build={build} current="about" />
    </>
);

/**
 * The kit's controls as the landing page shows them, in one theme: two buttons, a field and a
 * callout, drawn from the pinned version. Each panel's ids are its own, so the page never holds one
 * twice.
 */
const HeroPanel = ({ theme }: { readonly theme: 'light' | 'dark' }) => (
    <div className={`site-hero-panel site-${theme}`}>
        <p className="dk-eyebrow">{theme === 'light' ? 'Light' : 'Dark'}</p>
        <div className="site-hero-buttons">
            <kit.Button accent>Save rule</kit.Button>
            <kit.Button>Filters</kit.Button>
        </div>
        <div className="site-hero-field">
            <kit.InputField
                id={`hero-email-${theme}`}
                label="Email"
                hint="Where the receipt goes"
            />
        </div>
        <kit.Callout tone="success" title="The rule was saved" headingLevel={3}>
            It applies to the next search.
        </kit.Callout>
    </div>
);

/**
 * A small drawing of what each page shows, across the top of its tile on the landing page, drawn by
 * the site's own styles from the kit's tokens, with no words of its own, since the tile is one link
 * named by its page's name and short line. A screen reader passes the drawing by.
 */
const PREVIEWS: Readonly<Record<Extract<Route, { card: string }>['file'], ReactNode>> = {
    'tokens/index.html': (
        <>
            <span className="site-preview-swatch site-preview-accent" />
            <span className="site-preview-swatch site-preview-highlight" />
            <span className="site-preview-swatch site-preview-success" />
            <span className="site-preview-swatch site-preview-danger" />
            <span className="site-preview-swatch site-preview-fg" />
        </>
    ),
    'controls/index.html': (
        <>
            <span className="site-preview-button site-preview-button-accent">
                <span className="site-preview-words" />
            </span>
            <span className="site-preview-button">
                <span className="site-preview-words" />
            </span>
        </>
    ),
    'app-pieces/index.html': (
        <span className="site-preview-phone">
            <span className="site-preview-strip" />
            <span className="site-preview-dock" />
        </span>
    ),
    'layouts/index.html': (
        <span className="site-preview-layout">
            <span className="site-preview-hero">
                <span className="site-preview-hero-words" />
                <span className="site-preview-hero-picture" />
            </span>
            <span className="site-preview-sections">
                <span className="site-preview-line" />
                <span className="site-preview-line" />
            </span>
        </span>
    ),
    'page-chrome/index.html': (
        <span className="site-preview-page">
            <span className="site-preview-strip" />
            <span className="site-preview-foot" />
        </span>
    ),
    'explainer-pieces/index.html': (
        <span className="site-preview-steps">
            <span className="site-preview-step site-preview-step-done" />
            <span className="site-preview-step" />
        </span>
    ),
};

/**
 * Whether a page has a tile on the landing page: every page with a card's short line, each of
 * which has a drawing in PREVIEWS, which the type holds.
 */
const isCarded = (route: Route): route is Extract<Route, { card: string }> => 'card' in route;

/**
 * A tile for each page with a card, in columns, its drawing across the tile's top and the whole
 * tile its link, named by the page first. The landing page and the pieces together draw the same
 * list, so the two cannot drift apart.
 */
const PageTiles = () => (
    <ul className="dk-rows dk-rows-tiles dk-rows-columns site-pages" role="list">
        {ROUTES.filter(isCarded).map((route) => (
            <li key={route.file}>
                <a className="dk-row" href={route.path}>
                    <span className="dk-row-picture site-page-preview" aria-hidden="true">
                        {PREVIEWS[route.file]}
                    </span>
                    <span className="dk-row-text">
                        <span className="dk-row-title">{route.nav}</span>
                        <span className="dk-visually-hidden">, </span>
                        <span className="dk-row-detail">{route.card}</span>
                    </span>
                    <span className="dk-row-sign" aria-hidden="true">
                        ›
                    </span>
                </a>
            </li>
        ))}
    </ul>
);

/**
 * A small mark for each thing the kit is built to, drawn in the accent beside its heading, and in
 * the system's text color in forced colors.
 */
const RuleMark = ({ d }: { readonly d: string }) => (
    <svg className="site-rule-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d={d} />
    </svg>
);

/** The controls page, which the landing page leads to first. */
const CONTROLS_PAGE = ROUTES.find(({ file }) => file === 'controls/index.html')?.path ?? BASE;

/** The page that shows the kit's behavior working. */
const BEHAVIOR_PAGE = ROUTES.find(({ file }) => file === 'behavior/index.html')?.path ?? BASE;

/** The page drawn in a palette and a column of its own. */
const OWN_PALETTE = ROUTES.find(({ file }) => file === 'own-palette/index.html')?.path ?? BASE;

/** The page that stacks the newer pieces together. */
const TOGETHER = ROUTES.find(({ file }) => file === 'together/index.html')?.path ?? BASE;

/**
 * The install command, the block first and its copy button after it, as they are drawn, so the
 * keyboard and a screen reader meet them in that order. It names the version the page draws, so
 * what a reader installs is what they see.
 */
const Install = ({ version }: { readonly version: string }) => (
    <div className="site-install">
        <div className="site-code-panel">
            <pre
                className="dk-code"
                role="region"
                aria-labelledby="install"
                tabIndex={0}
                translate="no"
            >
                <code>{`npm install @jasonsdevspace/design-kit@${version}`}</code>
            </pre>
            <div className="dk-code-head">
                <span className="dk-visually-hidden site-code-name" id="install">
                    The install command
                </span>
            </div>
        </div>
    </div>
);

/**
 * The landing page: what the kit is, how to install it, its controls working in both themes, a
 * tile for each page, and what it is built to.
 */
export const Landing = ({ build }: { readonly build: Build }) => (
    <Page build={build} current="index.html">
        <div className="site-hero">
            <div className="site-hero-text">
                <p className="site-eyebrow">
                    <a href={`${NPM}/v/${build.version}`}>Version {build.version} on npm</a>
                </p>
                <h1>One set of colors, type and controls for the demos</h1>
                <p className="dk-lead">
                    The design kit is one package the demos on jasonsdevspace.com share, so they
                    read as one body of work and a fix to a button is made once. ShelfLens is built
                    on it.
                </p>
                <p className="dk-actions">
                    <a className="dk-button dk-button-accent" href={CONTROLS_PAGE}>
                        See every control
                    </a>
                    <a className="dk-button" href={ABOUT}>
                        How the design kit works
                    </a>
                </p>
            </div>
            <figure className="site-hero-demo">
                <div className="site-hero-panels dk-picture" inert>
                    <HeroPanel theme="light" />
                    <HeroPanel theme="dark" />
                </div>
                <figcaption>
                    A picture of the design kit&rsquo;s buttons, a field and a callout, in the light
                    and dark themes. Try them live under <a href={CONTROLS_PAGE}>Controls</a>.
                </figcaption>
            </figure>
            <Install version={build.version} />
        </div>
        <section>
            <h2 id="in-the-kit">What is in the design kit</h2>
            <p>
                Each page shows every piece in the light and dark themes.{' '}
                <a href={TOGETHER}>The pieces together</a> shows them stacked as an app&rsquo;s home
                page stacks them, <a href={BEHAVIOR_PAGE}>Behavior</a> shows what they do as you use
                them, and <a href={OWN_PALETTE}>A page&rsquo;s own palette</a> shows a page that
                brings its own colors.
            </p>
            <PageTiles />
        </section>
        <section>
            <h2 id="built-for">Built for strict security, contrast and screen readers</h2>
            <ul className="site-rules" role="list">
                <li>
                    <RuleMark d="M12 3 5 6v5c0 4.4 3 8.4 7 9.5 4-1.1 7-5.1 7-9.5V6l-7-3Zm-1.2 12.2-3-3 1.4-1.4 1.6 1.6 4-4 1.4 1.4-5.4 5.4Z" />
                    <h3>Works under a strict security policy</h3>
                    <p>
                        The kit&rsquo;s styles are plain files, and its components write no styles
                        into the page. So it works where a page refuses any style it did not serve
                        itself, as this site does. Its one inline script, the one that sets the
                        theme, comes with the fingerprint a strict page lists to allow it.
                    </p>
                </li>
                <li>
                    <RuleMark d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 2v14a7 7 0 0 1 0-14Z" />
                    <h3>Readable in both themes</h3>
                    <p>
                        Text stands out from its background by at least the 4.5 to 1 contrast the
                        web&rsquo;s accessibility guidelines ask for, and the edge of a control by 3
                        to 1, in the light and dark themes. The kit&rsquo;s own test checks each
                        pairing before a version is released.
                    </p>
                </li>
                <li>
                    <RuleMark d="M4 6h16v2H4V6Zm0 5h10v2H4v-2Zm0 5h7v2H4v-2Zm13-2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
                    <h3>What you see matches what a screen reader says</h3>
                    <p>
                        A toggle, an open panel, an unavailable control and a field with an error
                        each take their look from what a screen reader announces. So what you see
                        and what it says come from one place.
                    </p>
                </li>
            </ul>
        </section>
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

/** A file the site serves, such as a picture a state draws, by its address under the site's base. */
const served = (name: string) => `${BASE}${name}`;

/**
 * One state of a control, in one card: its name as a heading and the code that draws it at the top,
 * then its copies, and its code at the foot. The state is drawn live in the visitor's theme and
 * again in the other theme beside it. The other copy is inert, so the keyboard and a screen reader
 * pass over it, and its ids are its own, so the page never holds one twice. The live copy is a
 * group named by the state's name alone, so a screen reader moving from control to control hears
 * which state it is in. A pictured state's copy in the visitor's theme is inert too, and both its
 * copies are labeled as pictures. Each copy is labeled by its theme's name: the live one marked
 * Live, the other a preview, which the site's script explains when it is tapped, and a picture a
 * picture. Every inert copy is a dk-picture, so a frame, a page that ends in a tab bar or a toast
 * in one is not the page's own. The code is closed until a reader opens it: its markup, and the
 * React a page writes for it where a component draws it, which the site's script shows as tabs.
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
        <div className="site-state-head">
            <h3 className="site-state-name" id={`${id}-name`}>
                {state.name}
            </h3>
            <p className="site-state-attribute">
                <span className="dk-visually-hidden">The code behind it: </span>
                <code>{state.attribute}</code>
            </p>
        </div>
        <div className="site-state-copies">
            {pictured ? (
                <div className="site-copy dk-picture" inert>
                    <p className="site-copy-label">
                        <ThemeName of="page" />, a picture
                    </p>
                    {state.draw(kit, (name) => `${name}-yours`, served)}
                </div>
            ) : (
                <div className="site-copy" role="group" aria-labelledby={`${id}-name`}>
                    <p className="site-copy-label" aria-hidden="true">
                        <ThemeName of="page" /> <span className="site-live">Live</span>
                    </p>
                    {state.draw(kit, (name) => name, served)}
                </div>
            )}
            <div className="site-copy site-other dk-picture" inert>
                <p className="site-copy-label">
                    <ThemeName of="other" />
                    {pictured ? ', a picture' : ', preview only'}
                </p>
                {state.draw(kit, (name) => `${name}-other`, served)}
            </div>
        </div>
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
 * above the other at the column's full width where `wide` is set, and then the tests that check it.
 */
const Shown = ({
    controls,
    build: { markup, commit },
    wide = false,
    notes = {},
}: {
    readonly controls: readonly Control[];
    readonly build: Build;
    readonly wide?: boolean;
    readonly notes?: Readonly<Record<string, ReactNode>>;
}) =>
    controls.map((control) => (
        <section key={control.name}>
            <h2 id={idOf(control.name)}>{control.name}</h2>
            {notes[control.name]}
            <ul className={wide ? 'site-states site-states-wide' : 'site-states'} role="list">
                {control.states.map((state) => (
                    <StateShown
                        key={state.name}
                        state={state}
                        pictured={control.pictured ?? state.pictured ?? false}
                        markup={markupFor(markup, control, state)}
                        id={`${idOf(control.name)}-${idOf(state.name)}`}
                        laidOut={control.laidOut ?? false}
                    />
                ))}
            </ul>
            <Tests group={groupOf(control.name)} commit={commit} />
        </section>
    ));

/**
 * The toast's own section, written by hand rather than from the states, under one name for its
 * heading, its id, its tests and its place in the list of sections. The toast draws nothing until
 * it is shown, so a preview of it would be an empty box, and a page holds one, so it is shown once,
 * live, by a button the site's script attaches.
 */
const TOAST = 'Toast';

/**
 * A note under the heading of each control on the controls page with a state pictured because it
 * would act as the page loads, leading to where it is shown working.
 */
const PICTURED_NOTE_WORDS: Readonly<Record<string, ReactNode>> = {
    Buttons: (
        <p>
            The busy button is a picture here.{' '}
            <a href={`${BEHAVIOR_PAGE}#a-busy-button`}>Behavior</a> shows one working when you press
            it.
        </p>
    ),
    Callouts: (
        <p>
            The failure with Try again is a picture here.{' '}
            <a href={`${BEHAVIOR_PAGE}#loading-and-a-failure`}>Behavior</a> shows one working when
            you press it.
        </p>
    ),
    'Loading and progress': (
        <p>
            The part of the page that is loading is a picture here.{' '}
            <a href={`${BEHAVIOR_PAGE}#loading-and-a-failure`}>Behavior</a> shows one working when
            you press it.
        </p>
    ),
};

/**
 * The notes, or a build that fails where a control with a pictured state has none, or a note names
 * no such control, rather than a picture with no way to its working copy.
 */
const picturedNotes = () => {
    const pictured = CONTROLS.filter(
        (control) => control.pictured === true || control.states.some((state) => state.pictured)
    ).map(({ name }) => name);
    const missing = pictured.filter((name) => !Object.hasOwn(PICTURED_NOTE_WORDS, name));
    if (missing.length > 0) throw new Error(`no note leads from ${missing.join(', ')}`);
    const stray = Object.keys(PICTURED_NOTE_WORDS).filter((name) => !pictured.includes(name));
    if (stray.length > 0) throw new Error(`a note names no pictured control: ${stray.join(', ')}`);
    return PICTURED_NOTE_WORDS;
};

const APP_PIECES = ROUTES.find(({ file }) => file === 'app-pieces/index.html')?.path ?? BASE;

/**
 * Each state of the buttons, fields, steppers, callouts, waits, progress and dialogs, and the toast.
 */
export const Controls = ({ build }: { readonly build: Build }) => (
    <Page
        build={build}
        current="controls/index.html"
        title="Controls"
        lead={
            <>
                The design kit&rsquo;s buttons, busy buttons, marked and read-only fields, steppers,
                callouts with Try again and dialogs, in each state they can be in. Its loading line,
                progress and toast are here too.
            </>
        }
        intro={
            <p>
                Each state is shown twice: live in your theme, marked Live, and as a preview in the
                other. The busy button, the failure with Try again and the part of the page that is
                loading are pictures in both themes, since a live copy would act as the page loads.
                Under each name is the code behind it. To see the other theme live, choose Light or
                Dark next to Theme, at the top of the page.
            </p>
        }
        sections={listed([...CONTROLS.map(({ name }) => name), TOAST])}
    >
        <Shown controls={CONTROLS} build={build} notes={picturedNotes()} />
        <section className="site-toast">
            <h2 id={idOf(TOAST)}>{TOAST}</h2>
            <p>
                A toast says what just happened, at the foot of the screen, and can offer one
                action, such as Undo. The button here shows one. A toast with Undo stays until it is
                dismissed, and the one Undo shows leaves after five seconds. The toast in an
                app&rsquo;s frame is under <a href={`${APP_PIECES}#app-frame`}>App pieces</a>, in
                both themes.
            </p>
            <p>
                <button type="button" className="dk-button site-toast-show" hidden>
                    Save round 3
                </button>
            </p>
            <Toast />
            <Tests group={TOAST} commit={build.commit} />
        </section>
    </Page>
);

/** An app's frame and tab bar as pictures, and the pieces a screen holds, live. */
export const App = ({ build }: { readonly build: Build }) => (
    <Page
        build={build}
        current="app-pieces/index.html"
        title="App pieces"
        lead={
            <>
                The frame, dock, tab bar, grids of buttons, raised panel, rows, empty lists, tiles
                and pinned table a phone app is drawn from.
            </>
        }
        intro={
            <p>
                Each piece is shown twice: live in your theme, marked Live, and as a preview in the
                other. Under each name is the code behind it. To see the other theme live, choose
                Light or Dark next to Theme, at the top of the page. The frame, with its dock, and
                the tab bar are pictures in both themes, since a live copy would give this page a
                second main heading and a second set of places to go.
            </p>
        }
        sections={listed(APP.map(({ name }) => name))}
    >
        <Shown controls={APP} build={build} />
    </Page>
);

/** A tile in the raised panel: a piece of this page, leading to where it is shown alone. */
const ALONE = [
    {
        title: 'Raised panel',
        detail: 'The one thing to pick up again',
        href: `${APP_PIECES}#raised-panel`,
    },
    { title: 'Tiles', detail: 'Places to go, each on its own ground', href: `${APP_PIECES}#tiles` },
    { title: 'Tabs', detail: 'Pages or toggles in a row', href: `${CONTROLS_PAGE}#tabs` },
] as const;

/**
 * The newer pieces stacked as an app's home page stacks them, live, each leading to a page of the
 * site: a masthead with its row of tabs on its rule and a button that opens a dialog of the
 * grounds, a raised panel of tiles, and the site's pages as tiles in columns with their drawings.
 * The button waits hidden until the site's script attaches the dialog, so no control is dead
 * without it.
 */
export const Together = ({ build }: { readonly build: Build }) => (
    <Page
        build={build}
        current="together/index.html"
        title="The pieces together"
        lead={
            <>
                The design kit&rsquo;s pieces stacked as an app&rsquo;s home page stacks them, each
                set apart from the one it sits on by its ground or its edge.
            </>
        }
        intro={
            <p>
                Below, a masthead with a row of tabs sits over a raised panel of tiles, with more
                tiles in columns on the page under it. Every piece is live and leads to a page of
                this site. To see the other theme live, choose Light or Dark next to Theme, at the
                top of the page.
            </p>
        }
    >
        <section className="site-together">
            <div className="site-masthead">
                <div className="site-masthead-head">
                    <h2>Pieces</h2>
                    <button
                        type="button"
                        className="dk-button site-grounds-show"
                        aria-haspopup="dialog"
                        aria-controls="together-grounds"
                        hidden
                    >
                        <svg
                            className="dk-icon"
                            aria-hidden="true"
                            focusable="false"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 3 3 8l9 5 9-5-9-5Z" />
                            <path d="m3 13 9 5 9-5" />
                        </svg>
                        The grounds
                    </button>
                </div>
                <nav aria-label="Pieces">
                    <ul className="dk-tabs dk-tabs-on-rule" role="list">
                        <li>
                            <a className="dk-tab" href={TOGETHER} aria-current="page">
                                Together
                            </a>
                        </li>
                        <li>
                            <a className="dk-tab" href={CONTROLS_PAGE}>
                                Controls
                            </a>
                        </li>
                        <li>
                            <a className="dk-tab" href={APP_PIECES}>
                                App pieces
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
            <div className="dk-panel dk-panel-raised">
                <h3 className="dk-panel-title">Each piece here, shown alone</h3>
                <p>Each opens the piece on its own page, in every state and both themes.</p>
                <ul className="dk-rows dk-rows-tiles" role="list">
                    {ALONE.map(({ title, detail, href }) => (
                        <li key={href}>
                            <a className="dk-row" href={href}>
                                <span className="dk-row-text">
                                    <span className="dk-row-title">{title}</span>
                                    <span className="dk-visually-hidden">, </span>
                                    <span className="dk-row-detail">{detail}</span>
                                </span>
                                <span className="dk-row-sign" aria-hidden="true">
                                    ›
                                </span>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
            <PageTiles />
            <dialog
                className="dk-dialog"
                id="together-grounds"
                aria-labelledby="together-grounds-title"
            >
                <h2 className="dk-dialog-title" id="together-grounds-title" tabIndex={-1} autoFocus>
                    The grounds on this page
                </h2>
                <form className="dk-close" method="dialog">
                    <button
                        type="submit"
                        className="dk-button dk-button-text dk-button-quiet"
                        value="close"
                    >
                        <span aria-hidden="true">×</span>
                        <span className="dk-visually-hidden">Close</span>
                    </button>
                </form>
                <ul role="list">
                    <li>
                        The page, on <code>--dk-bg</code>.
                    </li>
                    <li>
                        The raised panel, on <code>--dk-raised</code>, drawn by its edge and shadow.
                    </li>
                    <li>
                        A tile on the raised panel, on <code>--dk-surface</code>.
                    </li>
                    <li>
                        A tile on the page, on <code>--dk-surface</code>, its drawing on{' '}
                        <code>--dk-bg</code>.
                    </li>
                    <li>
                        This dialog, on <code>--dk-raised</code> over the scrim.
                    </li>
                </ul>
            </dialog>
        </section>
    </Page>
);

/**
 * A content page, bands with a hero and a group of sections as pictures, each the column's full
 * width, as a band runs the width of the screen, and the stacks, split rows, notes and numerals
 * any of them holds, live, each in the order the layouts list them, as the list of sections is.
 */
export const Layouts = ({ build }: { readonly build: Build }) => (
    <Page
        build={build}
        current="layouts/index.html"
        title="Layouts"
        lead={
            <>
                The content page, bands with a hero, groups of sections, stacks, split rows, notes
                and numerals a page is laid out with.
            </>
        }
        intro={
            <p>
                The content page, the bands and the groups of sections are pictures in both themes,
                since a live copy would give this page a second main heading, and each is the width
                of its picture where a page would give it the width of the screen. The stacks, split
                rows, notes and numerals work inside any of them, and are shown twice: live in your
                theme, marked Live, and as a preview in the other. Under each name is the code
                behind it. To see the other theme live, choose Light or Dark next to Theme, at the
                top of the page.
            </p>
        }
        sections={listed(LAYOUTS.map(({ name }) => name))}
    >
        {LAYOUTS.map((control) => (
            <Shown
                key={control.name}
                controls={[control]}
                build={build}
                wide={control.pictured === true}
            />
        ))}
    </Page>
);

/**
 * The page chrome's own section, written by hand rather than from the states, under one name for
 * its heading, its id, its tests and its place in the list of sections.
 */
const SKIP_LINK = 'Skip link';

/** The skip link, and each state of the strip and the footer, as pictures. */
export const Chrome = ({ build }: { readonly build: Build }) => (
    <Page
        build={build}
        current="page-chrome/index.html"
        title="Page chrome"
        lead={
            <>
                Page chrome is the frame a demo draws around its content: the skip link, the strip
                across the top that says whose demo it is, and the footer. It puts the same links in
                the same places on every demo built with the design kit.
            </>
        }
        intro={
            <p>
                The frame around this page is the kit&rsquo;s own. Each state of the strip and the
                footer is shown as a picture in both themes, since a second working strip would give
                this page two portfolio menus. The bands a landing page runs in inside the frame are
                on the Layouts page. To try the real ones in the other theme, choose Light or Dark
                next to Theme, at the top of the page.
            </p>
        }
        sections={listed([SKIP_LINK, ...CHROME.map(({ name }) => name)])}
    >
        <section>
            <h2 id={idOf(SKIP_LINK)}>{SKIP_LINK}</h2>
            <p>
                The skip link is the first thing the keyboard reaches, out of sight until then.
                Reload this page and press Tab to see it. Pressing Enter on it takes you past the
                strip and the site&rsquo;s own links, straight to the page&rsquo;s main content.
            </p>
            <Tests group={SKIP_LINK} commit={build.commit} />
        </section>
        <Shown controls={CHROME} build={build} wide />
    </Page>
);

/** An explainer's layout as a picture, and each piece it holds, live. */
export const Pieces = ({ build }: { readonly build: Build }) => (
    <Page
        build={build}
        current="explainer-pieces/index.html"
        title="Explainer pieces"
        lead={
            <>
                An explainer is the page that says how a demo works, the one the strip&rsquo;s
                &ldquo;How it works&rdquo; link opens. These are its layout and its pieces: steps,
                panels, tables and code blocks.
            </>
        }
        intro={
            <p>
                Each piece is shown twice: live in your theme, marked Live, and as a preview in the
                other. Under each name is the code behind it. To see the other theme live, choose
                Light or Dark next to Theme, at the top of the page. The layout of a whole explainer
                is a picture in both themes, since a live copy would give this page a second main
                heading.
            </p>
        }
        sections={listed(EXPLAINER.map(({ name }) => name))}
    >
        <Shown controls={EXPLAINER} build={build} />
    </Page>
);

/**
 * The tokens page's sections, by the id each heading carries and its name, which the list of
 * sections and the headings both read, so the two cannot drift. The ids are the ones the explainer
 * links to.
 */
const TOKEN_SECTIONS = [
    { id: 'color', name: 'Color' },
    { id: 'contrast', name: 'Contrast' },
    { id: 'scale', name: 'Scale' },
    { id: 'theme', name: 'How the theme is chosen' },
] as const satisfies readonly Listed[];

/** A section heading on the tokens page, named as the list of sections names it. */
const TokenHeading = ({ id }: { readonly id: (typeof TOKEN_SECTIONS)[number]['id'] }) => (
    <h2 id={id}>{TOKEN_SECTIONS.find((section) => section.id === id)?.name}</h2>
);

/** A heading of a group of the scale, named as the group is. */
const ScaleHeading = ({ id }: { readonly id: (typeof SCALE_GROUPS)[number]['id'] }) => (
    <h3 id={id}>{SCALE_GROUPS.find((group) => group.id === id)?.name}</h3>
);

/** The color roles in both themes, the contrast of every pairing, the scale, and the theme. */
export const Tokens = ({ build }: { readonly build: Build }) => {
    const declared = declaredIn(build.sheets);
    return (
        <Page
            build={build}
            current="tokens/index.html"
            title="Tokens and theme"
            lead={
                <>
                    Tokens are the named colors and sizes everything in the design kit is drawn
                    from. This page shows each color in both themes, the contrast of each pairing it
                    is meant for, its type, sizes and waits, and how a page picks its theme.
                </>
            }
            intro={
                <p>
                    The colors and the contrast table show both themes whatever theme you are in.
                    Every name starts with <code>--dk-</code>, so the kit&rsquo;s names never clash
                    with a demo&rsquo;s own.
                </p>
            }
            sections={TOKEN_SECTIONS}
        >
            <section>
                <TokenHeading id="color" />
                <p>
                    Each color has a role, such as text or the page itself, and a light and a dark
                    value. Each card shows its light value on the left and its dark value on the
                    right, whatever theme the page is in. In CSS both values sit in one{' '}
                    <code>light-dark()</code>, and a demo with its own palette sets them again on
                    its root, both themes at once, as{' '}
                    <a href={OWN_PALETTE}>A page&rsquo;s own palette</a> does.
                </p>
                <Colors declared={declared} />
                <Tests group="Color" commit={build.commit} />
            </section>
            <section>
                <TokenHeading id="contrast" />
                <p>
                    Contrast is how far apart two colors are in brightness, written as a ratio. The
                    web&rsquo;s accessibility guidelines, WCAG, ask for 4.5 to 1 between text and
                    its background, and 3 to 1 for the edge of a control. Every pairing here meets
                    that in both themes. The figures are measured from the tokens of the version
                    this page uses and rounded down, and the kit&rsquo;s own test checks each one
                    before a version is released. The pairings with the least to spare come first.
                    Each bar runs to 21 to 1, the most two colors can have, with a mark at what the
                    pairing needs.
                </p>
                <Contrast declared={declared} />
                <Tests group="Contrast" commit={build.commit} />
            </section>
            <section>
                <TokenHeading id="scale" />
                <p>
                    Sizes that should grow when a reader makes their text bigger are in rem. Code
                    inside a sentence is in em, so it matches the words around it. Borders, the
                    focus ring and shadows are in px, since they should stay the same size.
                </p>
                <Tests group="Scale" commit={build.commit} />
                <h3 id="spacing">Spacing</h3>
                <p>Each step of the spacing scale is drawn to size.</p>
                <Spaces declared={declared} />
                <ScaleHeading id="type" />
                <p>
                    Each step of the type scale is drawn as words at its size. The numeral is for a
                    score read from across a table.
                </p>
                <TypeScale declared={declared} />
                <Scale declared={declared} group="type" />
                <ScaleHeading id="radius" />
                <p>
                    The pill radius is set far larger than any tab or tag is tall, so their ends are
                    always fully round.
                </p>
                <Scale declared={declared} group="radius" />
                <ScaleHeading id="motion" />
                <p>
                    The durations time the kit&rsquo;s motion, which reduced motion turns off.{' '}
                    <code>--dk-wait</code> is a delay rather than a motion: how long a wait goes
                    unremarked before a busy button is drawn off or a loading line shows. So reduced
                    motion keeps it, and so do forced colors.
                </p>
                <Scale declared={declared} group="motion" />
                <ScaleHeading id="sizes" />
                <p>
                    The heights of a field and a target, the widths of the column and the measure,
                    and the insets that keep a page clear of a phone&rsquo;s edges.
                </p>
                <Scale declared={declared} group="sizes" />
                <ScaleHeading id="layers" />
                <p>
                    The shadows that lift a piece, the layers that stack the bars, the toast and the
                    skip link, and the grounds a container sets for what it holds. The cascade
                    layers a page puts its own rules in, and the properties it sets, are on{' '}
                    <a href={OWN_PALETTE}>A page&rsquo;s own palette</a>.
                </p>
                <Scale declared={declared} group="layers" />
            </section>
            <section>
                <TokenHeading id="theme" />
                <p>
                    The kit&rsquo;s theme script runs before anything is drawn, so a page never
                    flashes the wrong theme. It uses the theme you saved, or follows your system
                    when you choose System or have saved nothing. A choice made in another tab
                    reaches this one too. Every demo on jasonsdevspace.com, this site included,
                    reads the same saved choice, so a theme picked here holds on the portfolio and
                    the other way around. With scripts on, the Theme switch at the top of the page
                    saves your choice.
                </p>
                <Tests group="How the theme is chosen" commit={build.commit} />
            </section>
        </Page>
    );
};

/** A behavior's markup, or a build that fails, rather than a page that shows an empty block. */
const behaviorMarkup = (markup: Build['markup'], behavior: Behavior) => {
    const found = markup[behaviorKey(behavior)];
    if (found === undefined) throw new Error(`no markup was laid out for ${behaviorKey(behavior)}`);
    return found;
};

type BehaviorName = (typeof BEHAVIORS)[number]['name'];

/**
 * What each behavior's section says before it, and what only the site adds beside it, the words
 * a failed load puts in its alert.
 */
const BEHAVIOR_WORDS: Readonly<
    Record<BehaviorName, { readonly about: ReactNode; readonly beside?: ReactNode }>
> = {
    'A refused form': {
        about: (
            <p>
                Press Save rule with the fields empty, or with an address that is not one. The kit
                stops the submit, draws what is wrong in each field and moves focus to the first
                field in error. It says that field&rsquo;s name and error on the status line, and
                how many fields need attention where more are wrong. With both fields right, the
                page saves and says so.
            </p>
        ),
    },
    'A busy button': {
        about: (
            <p>
                Press Save the round. The button is off at once, so a second press does nothing, and
                keeps its look for <code>--dk-wait</code>, 400 milliseconds, so a fast save never
                flashes it gray. Once that wait has passed it is drawn off and its words are said on
                the status line. The save here takes three seconds, then says it is done.
            </p>
        ),
    },
    'Arrow keys through a grid': {
        about: (
            <p>
                Tab to the cards, then move among them with the arrow keys, Home and End, since the
                grid is one stop for the Tab key. Press a card to choose it or put it back. The 10
                is off, so it keeps its place and a press does nothing. The count of cards chosen
                waits for the presses to stop before it is said, so a quick run of presses is heard
                once.
            </p>
        ),
    },
    'Focus moved after a change': {
        about: (
            <p>
                Press Remove beside a player. The row goes, and the button that had focus with it,
                so focus moves to the next player&rsquo;s Remove, or to the one before when the last
                row goes, and to the list&rsquo;s heading once no player is left. A press of Put the
                players back brings the list back as it was.
            </p>
        ),
    },
    'Loading, and a failure': {
        about: (
            <>
                <p>
                    Press Load again. The product is marked busy while it waits, so a screen reader
                    holds off reading it half drawn, and its loading line shows once the wait
                    outlasts <code>--dk-wait</code>. Then the product comes back and the status line
                    says so.
                </p>
                <p>
                    Press Show the failure, and the same load fails. The alert reads what happened,
                    and focus stays where it was. Try again goes with the failure, so focus moves to
                    the product&rsquo;s heading as it loads again.
                </p>
            </>
        ),
        beside: (
            <template id="product-failure-words">
                <kit.Callout tone="danger" actions={<kit.Button>Try again</kit.Button>}>
                    <p>
                        The product could not be loaded. Check your connection, then choose Try
                        again.
                    </p>
                </kit.Callout>
            </template>
        ),
    },
};

/**
 * One behavior under its own heading: what to try, the example working, what its status line said
 * last, out in the open, and its code, its markup and its React, closed until a reader opens it.
 */
const BehaviorShown = ({
    behavior,
    markup,
}: {
    readonly behavior: (typeof BEHAVIORS)[number];
    readonly markup: Build['markup'];
}) => {
    const id = idOf(behavior.name);
    const { about, beside } = BEHAVIOR_WORDS[behavior.name];
    return (
        <section>
            <h2 id={id}>{behavior.name}</h2>
            {about}
            <div className="site-behavior">
                <div className="site-behavior-live dk-stack">
                    {behavior.draw(true)}
                    {beside}
                </div>
                <p className="site-said">
                    <span className="site-said-name">The status line said</span>{' '}
                    <span className="site-said-words">nothing yet.</span>
                </p>
                <details className="site-code" data-layout="laid-out">
                    <summary>
                        <span aria-hidden="true">The code</span>
                        <span className="dk-visually-hidden">{`The code, ${behavior.name}`}</span>
                    </summary>
                    <CodeBlock
                        id={`${id}-markup`}
                        title="Markup"
                        of={behavior.name}
                        code={behaviorMarkup(markup, behavior)}
                    />
                    <CodeBlock
                        id={`${id}-react`}
                        title="React"
                        of={behavior.name}
                        code={behavior.react}
                    />
                </details>
            </div>
        </section>
    );
};

/** The kit's behavior, each example working, with what it says and the code behind it. */
export const BehaviorPage = ({ build }: { readonly build: Build }) => (
    <Page
        build={build}
        current="behavior/index.html"
        title="Behavior"
        lead={
            <>
                What the design kit does as a visitor uses a page: a refused form, a busy button,
                the arrow keys through a grid, focus moved after a change and a part of the page
                that loads, each working.
            </>
        }
        intro={
            <>
                <p>
                    Nothing here acts until you press or type. Each example speaks on a status line
                    of its own, the line out of sight that a screen reader reads without moving
                    focus, and what it said last is shown under it. Under that is its code. To see
                    the other theme live, choose Light or Dark next to Theme, at the top of the
                    page.
                </p>
                <noscript>
                    <p>With scripts on, each example here works as you press or type.</p>
                </noscript>
            </>
        }
        sections={listed(BEHAVIORS.map(({ name }) => name))}
    >
        {BEHAVIORS.map((behavior) => (
            <BehaviorShown key={behavior.name} behavior={behavior} markup={build.markup} />
        ))}
    </Page>
);

/**
 * What each property a page sets changes, by its name, or a build that fails for one the pinned
 * sheets add, rather than a row with nothing to say.
 */
const PROPERTY_WORDS: Readonly<Record<string, string>> = {
    '--dk-focus': 'The focus ring and a control’s edge under a pointer, the accent unless set',
    '--dk-button-shadow': 'A shadow under a button at rest, none unless set',
    '--dk-button-press':
        'How a held button moves, as a whole translate such as 0 2px, and where a toggle that is on or a button whose panel is open rests',
    '--dk-panel-shadow': 'The shadow under a raised panel, the resting shadow unless set',
    '--dk-tile-ground': 'The ground under a tile, the card’s on a page and the page’s in a panel',
    '--dk-tile-shadow': 'A shadow under a tile, none unless set',
    '--dk-tile-least': 'The least width of a tile in columns, 15rem unless set',
    '--dk-row-picture-size': 'The width and height of a picture at a row’s start',
    '--dk-button-grid-columns': 'The columns a grid of buttons asks for, 3 unless set',
    '--dk-button-grid-least': 'The least width of a cell in a grid of buttons',
    '--dk-table-ground': 'The ground under a table’s pinned column',
    '--dk-table-pinned-size': 'The width of a table’s pinned column, 8rem unless set',
    '--dk-stepper-digits': 'The figures a stepper’s field keeps room for, 2 unless set',
    '--dk-band-room': 'The room above and below a band, inside its ground',
    '--dk-sections-least': 'The least width of a section in a group of sections, 20rem unless set',
    '--dk-band-hero-picture': 'The width of a hero’s picture beside its words',
};

/** What a property a page sets changes, or a build that fails for one with no words. */
const propertyWords = (name: string) => {
    const words = PROPERTY_WORDS[name];
    if (words === undefined) throw new Error(`the own palette page says nothing of ${name}`);
    return words;
};

/** The own palette page's sections, by the id each heading carries and its name. */
const OWN_SECTIONS = [
    { id: 'what-this-page-sets', name: 'What this page sets' },
    { id: 'its-palette', name: 'Its palette' },
    { id: 'its-column', name: 'Its column' },
    { id: 'its-layers', name: 'Its layers' },
    { id: 'properties', name: 'The properties a page sets' },
] as const satisfies readonly Listed[];

/** A section heading on the own palette page, named as the list of sections names it. */
const OwnHeading = ({ id }: { readonly id: (typeof OWN_SECTIONS)[number]['id'] }) => (
    <h2 id={id}>{OWN_SECTIONS.find((section) => section.id === id)?.name}</h2>
);

/**
 * A page drawn in its own palette and column, with its rules in a layer after the kit's: the sheet
 * it sets them in, the kit's pieces in that palette with the contrast of each pairing in it, and
 * every property a page sets.
 */
export const OwnPalette = ({ build }: { readonly build: Build }) => {
    const own = declaredIn(build.ownPalette);
    const declared = new Map([...declaredIn(build.sheets), ...own]);
    return (
        <Page
            build={build}
            current="own-palette/index.html"
            title="A page’s own palette"
            lead={
                <>
                    This page brings its own colors and a narrower column, and puts its rules in a
                    layer after the design kit&rsquo;s, as a demo with a look of its own does.
                </>
            }
            intro={
                <p>
                    The sheet this page adds, shown below, writes no rule over a kit class.
                    Everything it changes, the strip and the footer too, it changes through the
                    properties the kit reads. The colors and the column of this site&rsquo;s other
                    pages are the kit&rsquo;s own. To see the other theme live, choose Light or Dark
                    next to Theme, at the top of the page.
                </p>
            }
            sections={OWN_SECTIONS}
        >
            <section>
                <OwnHeading id="what-this-page-sets" />
                <p>
                    This is all the page adds to the kit beside the site&rsquo;s own sheet, which
                    every page of this site loads, and it loads after both of them.
                </p>
                <div className="site-code site-sheet">
                    <CodeBlock id="own-palette-sheet" title="CSS" code={build.ownPalette.trim()} />
                </div>
            </section>
            <section>
                <OwnHeading id="its-palette" />
                <p>
                    The page sets the accent, the text on it, the highlight and the focus ring, each
                    as one <code>light-dark()</code> that holds both themes. Every piece reads its
                    colors from those roles, so the markup is the same as on any other page. Press
                    Tab to see the focus ring in the page&rsquo;s own color.
                </p>
                <ul className="site-states" role="list">
                    {OWN_PIECES.states.map((state) => (
                        <StateShown
                            key={state.name}
                            state={state}
                            pictured={false}
                            markup={markupFor(build.markup, OWN_PIECES, state)}
                            id={`own-${idOf(state.name)}`}
                            laidOut
                        />
                    ))}
                </ul>
                <p>
                    A page that sets its own palette answers for its own contrast. These are the
                    pairings the kit is meant for, measured in this page&rsquo;s palette.
                </p>
                <Contrast
                    declared={declared}
                    title="The contrast of every pairing in this page’s palette, the tightest first"
                />
            </section>
            <section>
                <OwnHeading id="its-column" />
                <p>
                    The kit lines the strip, the header, the page and the footer up on one column,{' '}
                    <code>--dk-column</code>, 72rem wide unless a page sets it. This page sets it to{' '}
                    {own.get('--dk-column')} on its root, where the kit reads it, so on a wide
                    screen everything here stands in further from the sides than on the other pages.
                    A phone is narrower than either column, so it shows no change.
                </p>
            </section>
            <section>
                <OwnHeading id="its-layers" />
                <p>
                    The kit&rsquo;s rules sit in a layer named <code>dk</code>. The page names its
                    own layer after it, with <code>@layer dk, page;</code> before any rule of its
                    own, so whatever it sets in <code>page</code> wins over the kit, however little
                    its selector weighs. A rule outside any layer wins over both, as the
                    site&rsquo;s own sheet does.
                </p>
            </section>
            <section>
                <OwnHeading id="properties" />
                <p>
                    Beyond the color roles, these are the properties the kit reads and leaves to a
                    page, each unset until a page sets it, on its root or on a piece by a class of
                    its own. This page sets <code>--dk-focus</code>, <code>--dk-button-shadow</code>{' '}
                    and <code>--dk-button-press</code>, so its buttons sit on a shadow and move as
                    they are pressed.
                </p>
                <Table
                    id="properties-title"
                    title="Every property a page sets"
                    columns={[{ name: 'Property' }, { name: 'What it sets' }]}
                >
                    {[...pagePropertiesIn(build.sheets)].map((name) => (
                        <tr key={name}>
                            <th scope="row">
                                <code>{name}</code>
                            </th>
                            <td>{propertyWords(name)}</td>
                        </tr>
                    ))}
                </Table>
            </section>
        </Page>
    );
};

/** What each page draws, by the HTML file it is built from. */
export const PAGES: Readonly<Record<Route['file'], (build: Build) => ReactElement>> = {
    'index.html': (build) => <Landing build={build} />,
    'tokens/index.html': (build) => <Tokens build={build} />,
    'controls/index.html': (build) => <Controls build={build} />,
    'app-pieces/index.html': (build) => <App build={build} />,
    'layouts/index.html': (build) => <Layouts build={build} />,
    'page-chrome/index.html': (build) => <Chrome build={build} />,
    'explainer-pieces/index.html': (build) => <Pieces build={build} />,
    'together/index.html': (build) => <Together build={build} />,
    'behavior/index.html': (build) => <BehaviorPage build={build} />,
    'own-palette/index.html': (build) => <OwnPalette build={build} />,
    'how-it-works/index.html': (build) => <Explainer build={build} />,
};
