import * as kit from 'design-kit-release/react';
import { type ComponentProps, Fragment, type ReactElement, type ReactNode } from 'react';

import { type Group, HELD } from '../../design-kit/examples/held.js';
import { declaredIn } from '../../design-kit/examples/palette.js';
import { APP, CHROME, EXPLAINER } from '../../design-kit/examples/pieces.js';
import { type Control, CONTROLS, type State } from '../../design-kit/examples/states.js';
import { HowItWorks } from './explainer.js';
import { FAINT, TILES } from './mark.js';
import { ABOUT, BASE, NPM, type Route, ROUTES, SOURCE } from './routes.js';
import { Colors, Contrast, Scale, Spaces } from './tokens.js';

const { DemoFooter, PortfolioStrip, SkipLink, Toast } = kit;

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
 * The site's header under the strip: its mark and name, leading to the landing page, and its own
 * pages as the kit's link pills, the current one marked as the page, all in the site's navigation
 * so nothing in it sits outside a landmark. It is the page's banner, as the explainer's header is,
 * so a screen reader that moves to the banner finds the way around the site on every page. The mark
 * is the site's icon, its tiles drawn in the text on the accent and in the page's own theme, in the
 * site's own markup, so the policy that refuses outside styles holds. It is hidden from a screen
 * reader, which hears the name.
 */
const SiteNav = ({ current }: { readonly current: Route['file'] }) => (
    <header>
        <nav className="site-header" aria-label="Design kit">
            <a className="site-brand" href={BASE}>
                <span className="site-mark" aria-hidden="true">
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
            className={sections === undefined ? 'site-main' : 'site-main site-main-listed'}
        >
            {title === undefined ? null : <h1>{title}</h1>}
            {lead === undefined ? null : <p className="site-lead">{lead}</p>}
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
 * A small drawing of what each page shows, for its card on the landing page, drawn by the site's
 * own styles from the kit's tokens. The card's name and description say it in words, so a screen
 * reader passes the drawing by.
 */
const PREVIEWS: Readonly<
    Record<Exclude<Route['file'], 'index.html' | 'how-it-works/index.html'>, ReactNode>
> = {
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
            <span className="site-preview-button site-preview-button-accent">Save rule</span>
            <span className="site-preview-button">Filters</span>
        </>
    ),
    'app-pieces/index.html': (
        <span className="site-preview-phone">
            <span className="site-preview-strip" />
            <span className="site-preview-dock" />
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
 * Whether a page has a card on the landing page: every page in the site's menu but the landing
 * page itself, each of which has a drawing in PREVIEWS, which the type holds.
 */
const isCarded = (route: Route): route is Extract<Route, { file: keyof typeof PREVIEWS }> =>
    route.nav !== null && route.path !== BASE;

/** A small mark for each thing the kit is built to, drawn in the accent beside its heading. */
const RuleMark = ({ d }: { readonly d: string }) => (
    <svg className="site-rule-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d={d} />
    </svg>
);

/** The controls page, which the landing page leads to first. */
const CONTROLS_PAGE = ROUTES.find(({ file }) => file === 'controls/index.html')?.path ?? BASE;

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
 * card for each page, and what it is built to.
 */
export const Landing = ({ build }: { readonly build: Build }) => (
    <Page build={build} current="index.html">
        <div className="site-hero">
            <div className="site-hero-text">
                <p className="site-eyebrow">
                    <a href={`${NPM}/v/${build.version}`}>Version {build.version} on npm</a>
                </p>
                <h1>One set of colors, type and controls for the demos</h1>
                <p className="site-lead">
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
                <div className="site-hero-panels" inert>
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
            <p>Each page shows every piece in the light and dark themes.</p>
            <ul className="site-pages" role="list">
                {ROUTES.filter(isCarded).map((route) => (
                    <li key={route.file}>
                        <span className="site-page-preview" aria-hidden="true">
                            {PREVIEWS[route.file]}
                        </span>
                        <a href={route.path}>{route.nav}</a>
                        <p>{route.card}</p>
                    </li>
                ))}
            </ul>
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

/**
 * One state of a control, in one card: its name as a heading and the code that draws it at
 * the top, then its copies, and its code at the foot. The state is drawn live in the visitor's
 * theme and again in the other theme beside it. The other copy is inert, so the keyboard and a
 * screen reader pass over it, and its ids are its own, so the page never holds one twice. The live
 * copy is a group named by the state's name alone, so a screen reader moving from control to
 * control hears which state it is in. A pictured state's copy in the visitor's theme is inert too,
 * and both its copies are labeled as pictures. Each copy is labeled by its theme's name: the live
 * one marked Live, the other a preview, which the site's script explains when it is tapped, and a
 * picture a picture. The code is closed until a reader opens it: its markup, and the React a page
 * writes for it where a component draws it, which the site's script shows as tabs.
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

/**
 * The toast's own section, written by hand rather than from the states, under one name for its
 * heading, its id, its tests and its place in the list of sections. The toast draws nothing until
 * it is shown, so a preview of it would be an empty box, and a page holds one, so it is shown once,
 * live, by a button the site's script attaches.
 */
const TOAST = 'Toast';

const APP_PIECES = ROUTES.find(({ file }) => file === 'app-pieces/index.html')?.path ?? BASE;

/** Each state of the buttons, fields, steppers, callouts and dialogs, and the toast. */
export const Controls = ({ build }: { readonly build: Build }) => (
    <Page
        build={build}
        current="controls/index.html"
        title="Controls"
        lead={
            <>
                The design kit&rsquo;s buttons, fields, steppers, callouts and dialogs, in each
                state they can be in, and its toast.
            </>
        }
        intro={
            <p>
                Each state is shown twice: live in your theme, marked Live, and as a preview in the
                other. Under each name is the code behind it. To see the other theme live, choose
                Light or Dark next to Theme, at the top of the page.
            </p>
        }
        sections={listed([...CONTROLS.map(({ name }) => name), TOAST])}
    >
        <Shown controls={CONTROLS} build={build} />
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
                The frame, tab bar, grids of buttons, rows and pinned table a phone app is drawn
                from.
            </>
        }
        intro={
            <p>
                Each piece is shown twice: live in your theme, marked Live, and as a preview in the
                other. Under each name is the code behind it. To see the other theme live, choose
                Light or Dark next to Theme, at the top of the page. The frame and the tab bar are
                pictures in both themes, since a live copy would give this page a second main
                heading and a second set of places to go.
            </p>
        }
        sections={listed(APP.map(({ name }) => name))}
    >
        <Shown controls={APP} build={build} />
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
                this page two portfolio menus. To try the real ones in the other theme, choose Light
                or Dark next to Theme, at the top of the page.
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

/** The color roles in both themes, the contrast of every pairing, the scale, and the theme. */
export const Tokens = ({ build }: { readonly build: Build }) => {
    const declared = declaredIn(build.tokens);
    return (
        <Page
            build={build}
            current="tokens/index.html"
            title="Tokens and theme"
            lead={
                <>
                    Tokens are the named colors and sizes everything in the design kit is drawn
                    from. This page shows each color in both themes, the contrast of each pairing it
                    is meant for, every size, and how a page picks its theme.
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
                    its root, both themes at once.
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
                    focus ring and shadows are in px, since they should stay the same size. So is
                    the pill radius, set far larger than any tab or tag is tall, so their ends are
                    always fully round. Each step of the spacing scale is drawn to size.
                </p>
                <Spaces declared={declared} />
                <Scale declared={declared} />
                <Tests group="Scale" commit={build.commit} />
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

/** What each page draws, by the HTML file it is built from. */
export const PAGES: Readonly<Record<Route['file'], (build: Build) => ReactElement>> = {
    'index.html': (build) => <Landing build={build} />,
    'tokens/index.html': (build) => <Tokens build={build} />,
    'controls/index.html': (build) => <Controls build={build} />,
    'app-pieces/index.html': (build) => <App build={build} />,
    'page-chrome/index.html': (build) => <Chrome build={build} />,
    'explainer-pieces/index.html': (build) => <Pieces build={build} />,
    'how-it-works/index.html': (build) => <Explainer build={build} />,
};
