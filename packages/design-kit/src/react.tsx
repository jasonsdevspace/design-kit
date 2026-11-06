import type { ReactNode } from 'react';

/*
 * The page chrome a demo draws around its page: a skip link, a strip above the page that says
 * whose demo it is, and a footer below it. Each component draws the markup components.css styles
 * and nothing else, with no stylesheet of its own and no style attribute, so a page without React
 * writes the same markup by hand, and a page whose policy allows styles only from its own origin
 * draws it.
 */

/** Whether a slot holds something to draw: a demo's `cond && <X />` leaves false or null. */
const drawn = (node: ReactNode): boolean => node !== undefined && node !== null && node !== false;

/** Where the portfolio is, and the section of it that lists the work. */
export const PORTFOLIO_URL = 'https://jasonsdevspace.com/';
export const PORTFOLIO_WORK_URL = 'https://jasonsdevspace.com/#work';
/** Where the rest of the work is. */
export const GITHUB_PROFILE_URL = 'https://github.com/jasonsdevspace';

/**
 * The first stop for the keyboard, out of sight until it takes focus, and then at the column's
 * inset. Following it moves focus past the strip to the element whose id it names, the page's main
 * content, which has a tabindex of -1 so it can take focus.
 */
export const SkipLink = ({
    target = 'main-content',
    children = 'Skip to content',
}: {
    /** The id of the element the link leads to. */
    readonly target?: string;
    readonly children?: ReactNode;
}) => (
    <a className="dk-skip" href={`#${target}`}>
        {children}
    </a>
);

/**
 * Whose demo this is, above the page, with three links together on the left. It is a navigation
 * landmark in a plain div rather than a header, so the demo's own header stays the page's one
 * banner. A demo with switches of its own puts them beside the links, in a landmark of their own
 * named for them.
 */
export const PortfolioStrip = ({
    about,
    source,
    current,
    tools,
    toolsLabel = 'Demo',
}: {
    /** The demo's explainer, relative to the page or absolute. */
    readonly about: string;
    /** The demo's repository. */
    readonly source: string;
    /** The link that is the page the strip sits on, marked as the current page. */
    readonly current?: 'about';
    /** The demo's own switches, drawn beside the links. */
    readonly tools?: ReactNode;
    /** The name a screen reader gives the switches' landmark. */
    readonly toolsLabel?: string;
}) => (
    <div className="dk-strip">
        <nav className="dk-strip-links" aria-label="Portfolio">
            <a href={PORTFOLIO_WORK_URL}>A demo by Jason Poteet</a>
            <a href={about} aria-current={current === 'about' ? 'page' : undefined}>
                How it works
            </a>
            <a href={source}>Source on GitHub</a>
        </nav>
        {!drawn(tools) ? null : (
            <section className="dk-strip-tools" aria-label={toolsLabel}>
                {tools}
            </section>
        )}
    </div>
);

/**
 * The exit after a long scroll: whose project this is, how it works, where the source and the rest
 * of the work are, and the license, with anything the demo adds of its own after them.
 */
export const DemoFooter = ({
    name,
    about,
    source,
    license = `${source.replace(/\/+$/, '')}/blob/main/LICENSE`,
    licenseName = 'MIT license',
    children,
}: {
    /** The demo's name, as the footer's sentence opens with it. */
    readonly name: string;
    /** The demo's explainer, relative to the page or absolute. */
    readonly about: string;
    /** The demo's repository. */
    readonly source: string;
    /** The demo's license, the LICENSE file on the repository's main branch unless given. */
    readonly license?: string;
    /** What the license is called, as the footer's sentence names it. */
    readonly licenseName?: string;
    /** What the demo adds after the license, as sentences of its own. */
    readonly children?: ReactNode;
}) => (
    <footer className="dk-footer">
        <p>
            {name} is a portfolio project by <a href={PORTFOLIO_URL}>Jason Poteet</a>.{' '}
            <a href={about}>How it works</a>, in plain words. The <a href={source}>source</a> and{' '}
            <a href={GITHUB_PROFILE_URL}>more work</a> are on GitHub, under the{' '}
            <a href={license}>{licenseName}</a>.{drawn(children) ? <> {children}</> : null}
        </p>
    </footer>
);
