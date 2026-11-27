import { type ReactNode } from 'react';

import { filled } from './react-parts.js';

/*
 * The page chrome a demo draws around its page: the skip link, the strip above the page that says
 * whose demo it is, and the footer below it, with the addresses they link to.
 */

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
export type SkipLinkProps = {
    /** The id of the element the link leads to. */
    readonly target?: string | undefined;
    readonly children?: ReactNode;
};

export const SkipLink = ({
    target = 'main-content',
    children = 'Skip to content',
}: SkipLinkProps) => (
    <a className="dk-skip" href={`#${target}`}>
        {children}
    </a>
);

/** A page of the demo's that the chrome links to, and can mark as the one it sits on. */
type ChromePage = 'about';

/** The mark a link to `page` takes when it is the page the chrome sits on, and none otherwise. */
const currentAs = (current: ChromePage | undefined, page: ChromePage) =>
    current === page ? 'page' : undefined;

/**
 * Whose demo this is, above the page, with three links together on the left: the author's name,
 * which leads to the portfolio as the footer's does, how it works and the source. It is a
 * navigation landmark in a plain div rather than a header, so the demo's own header stays the
 * page's one banner. A demo with switches of its own puts them beside the links, in a landmark of
 * their own named for them, since a name a screen reader hears has to say what the section holds,
 * and while
 * they are on their way the strip keeps their room in that section, unnamed and so no landmark,
 * with a line in it that only a visitor without script sees, since for them the switches never
 * come. A switch drawn into a template and copied out by a page's script leaves its own such line
 * behind, which is why the room carries one.
 */
export type PortfolioStripProps = {
    /** The demo's explainer, relative to the page or absolute, written by the demo's author. */
    readonly about: string;
    /** The demo's repository, written by the demo's author. */
    readonly source: string;
    /** The link that is the page the strip sits on, marked as the current page. */
    readonly current?: ChromePage | undefined;
    /**
     * The switches are on their way, so the strip keeps the room of one row of the kit's controls
     * in their section, empty and unnamed, so no landmark, until `tools` holds them and the section
     * takes its name.
     */
    readonly toolsWaiting?: boolean | undefined;
    /**
     * What a visitor without script reads in the room, since the switches never come for them.
     * Empty draws no line.
     */
    readonly toolsNoscript?: ReactNode;
} & (
    | {
          /** The demo's own switches, drawn beside the links. */
          readonly tools: ReactNode;
          /** The name a screen reader hears for the switches' landmark, such as Settings. */
          readonly toolsLabel: string;
      }
    | { readonly tools?: undefined; readonly toolsLabel?: undefined }
);

export const PortfolioStrip = ({
    about,
    source,
    current,
    tools,
    toolsLabel,
    toolsWaiting = false,
    toolsNoscript = "With scripts on, the demo's switches sit here.",
}: PortfolioStripProps) => (
    <div className="dk-strip">
        <nav className="dk-strip-links" aria-label="Portfolio">
            <a href={PORTFOLIO_URL}>Jason Poteet</a>
            <a href={about} aria-current={currentAs(current, 'about')}>
                How it works
            </a>
            <a href={source}>Source on GitHub</a>
        </nav>
        {filled(tools) ? (
            // A blank name would be an attribute that names nothing, so the section goes unnamed,
            // and is no landmark, as the room is.
            <section
                className="dk-strip-tools"
                aria-label={toolsLabel === '' ? undefined : toolsLabel}
            >
                {tools}
            </section>
        ) : toolsWaiting ? (
            <section className="dk-strip-tools">
                <span className="dk-strip-room" />
                {filled(toolsNoscript) ? (
                    <noscript>
                        <p className="dk-strip-noscript">{toolsNoscript}</p>
                    </noscript>
                ) : null}
            </section>
        ) : null}
    </div>
);

/**
 * The exit after a long scroll: whose project this is, how it works, where the source and the rest
 * of the work are, and the license, with anything the demo adds of its own after them.
 */
export type DemoFooterProps = {
    /** The demo's name, as the footer's text opens with it. */
    readonly name: string;
    /** The demo's explainer, relative to the page or absolute, written by the demo's author. */
    readonly about: string;
    /** The demo's repository, written by the demo's author. */
    readonly source: string;
    /** The link that is the page the footer sits on, marked as the current page. */
    readonly current?: ChromePage | undefined;
    /**
     * The demo's license, written by the demo's author, or `LICENSE` on the main branch of `source`
     * unless given.
     */
    readonly license?: string | undefined;
    /** What the license is called, as the footer's text names it. */
    readonly licenseName?: string | undefined;
    /** What the demo adds at the end, as sentences of its own. */
    readonly children?: ReactNode;
    /**
     * A line of the demo's own beside the footer's text on a wide screen and under it on a phone,
     * such as the version and commit the page was built from. It is drawn in a paragraph, so it
     * holds text, links and code, never a block.
     */
    readonly aside?: ReactNode;
};

export const DemoFooter = ({
    name,
    about,
    source,
    current,
    license = `${source.endsWith('/') ? source.slice(0, -1) : source}/blob/main/LICENSE`,
    licenseName = 'MIT license',
    children,
    aside,
}: DemoFooterProps) => (
    <footer className="dk-footer">
        <p>
            {name} is a portfolio project by <a href={PORTFOLIO_URL}>Jason Poteet</a>, who has{' '}
            <a href={GITHUB_PROFILE_URL}>more work</a> on GitHub.{' '}
            <a href={about} aria-current={currentAs(current, 'about')}>
                How it works
            </a>{' '}
            is explained in plain words. The <a href={source}>source</a> is on GitHub under the{' '}
            <a href={license}>{licenseName}</a>.{filled(children) ? <> {children}</> : null}
        </p>
        {filled(aside) ? <p className="dk-footer-aside">{aside}</p> : null}
    </footer>
);
