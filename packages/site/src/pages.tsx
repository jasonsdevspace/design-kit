import { DemoFooter, PortfolioStrip, SkipLink } from '../../design-kit/src/react.js';

/** The kit's repository, which the strip and the footer link as the site's source. */
export const SOURCE = 'https://github.com/jasonsdevspace/design-kit';

/** How the kit works, the package's README on GitHub. */
const ABOUT = `${SOURCE}/tree/main/packages/design-kit#readme`;

/** The package on npm. */
const NPM = 'https://www.npmjs.com/package/@jasonsdevspace/design-kit';

/** The version of the kit a page is drawn from, and the commit it was built at. */
export interface Build {
    readonly version: string;
    readonly commit: string;
}

/**
 * The landing page: what the kit is, with the kit's own skip link, strip and footer around it,
 * and in the footer the version and commit the page was drawn from.
 */
export const Landing = ({ build }: { readonly build: Build }) => (
    <>
        <SkipLink />
        <PortfolioStrip about={ABOUT} source={SOURCE} />
        <main id="main-content" tabIndex={-1} className="site-main">
            <h1>The design kit</h1>
            <p className="site-lead">
                The tokens, theme script, page chrome, controls and explainer layout every demo on
                jasonsdevspace.com is drawn from, so the demos read as one body of work and a fix to
                a button is made once.
            </p>
            <p>
                It is <a href={NPM}>@jasonsdevspace/design-kit</a> on npm. Its styles load from a
                page&rsquo;s own origin and its components draw markup alone, so a page under{' '}
                <code>style-src &apos;self&apos;</code> draws it, as this one does.
            </p>
        </main>
        <DemoFooter name="The design kit" about={ABOUT} source={SOURCE}>
            This page is drawn from version {build.version}, built at commit{' '}
            <a href={`${SOURCE}/commit/${build.commit}`}>
                <code>{build.commit.slice(0, 7)}</code>
            </a>
            .
        </DemoFooter>
    </>
);
