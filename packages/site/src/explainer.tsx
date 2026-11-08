import type { ReactNode } from 'react';

import { BASE, NPM, SOURCE } from './routes.js';

/**
 * The repository at the commit the site was built at, which the footer names, so the docs a reader
 * follows describe the site they came from.
 */
const builtAt = (commit: string) => `${SOURCE}/tree/${commit}`;

/** A step of what happens as a page loads, with an arrow from the step before. */
const Step = ({
    first = false,
    title,
    children,
}: {
    readonly first?: boolean;
    readonly title: string;
    readonly children: ReactNode;
}) => (
    <li>
        {first ? null : (
            <span className="dk-steps-arrow" aria-hidden="true">
                ↓
            </span>
        )}
        <strong className="dk-steps-title">{title}</strong>
        <span className="dk-steps-note">{children}</span>
    </li>
);

/**
 * How the design kit works, for a reader who has a few minutes: what happens as a page loads, the
 * mistakes the kit is built to avoid, with a link where the site shows one, and the stack, in the
 * kit's own explainer layout. The README and the decision records it links are at the commit the
 * site was built at.
 */
export const HowItWorks = ({ commit }: { readonly commit: string }) => (
    <>
        <h1>How the design kit works</h1>
        <p className="dk-explainer-lead">
            The design kit is one package made for the demos on jasonsdevspace.com to share: their
            colors and type, the theme a visitor chose, the links around each page, the buttons,
            fields and messages, and the page that explains each demo. ShelfLens is built on it. A
            fix to a button is made once, and reaches every demo that installs the version with it.
        </p>
        <p>
            It is built for two people. The person building a demo wants it to look like the rest
            without copying files from the last one. The reviewer with two minutes wants to know
            whether the person who built it understands styles, accessibility and shipping a
            package.
        </p>
        <p>
            <a className="dk-button dk-button-accent" href={`${BASE}controls/`}>
                See the controls
            </a>
        </p>

        <section>
            <p className="dk-explainer-number" aria-hidden="true">
                01
            </p>
            <h2 id="loading">What happens as a page loads</h2>
            <ol className="dk-steps" role="list">
                <Step first title="The theme script runs first.">
                    Inline in the page&rsquo;s head, before anything is drawn, it reads the theme
                    you saved on the portfolio, or your system&rsquo;s, and marks the page with it.
                </Step>
                <Step title="Each color picks its theme.">
                    Every color holds a light value and a dark one, and the browser draws the one
                    for the theme the page is marked with.
                </Step>
                <Step title="The base styles set the page.">
                    Its type and colors, one focus ring for every link and control, and less motion
                    if you ask your system for it.
                </Step>
                <Step title="Each control is drawn from what it already says.">
                    A pressed button looks pressed because of the attribute a screen reader reads as
                    pressed, so what you see and what you hear come from one place.
                </Step>
                <Step title="The demo's own styles win.">
                    Every rule of the kit&rsquo;s sits in a cascade layer, which the browser ranks
                    below a demo&rsquo;s own styles outside a layer, so those win without having to
                    outweigh the kit&rsquo;s. The exception is less motion: when a visitor asks for
                    it, the kit&rsquo;s rule holds over a demo&rsquo;s ordinary styles.
                </Step>
            </ol>
        </section>

        <section>
            <p className="dk-explainer-number" aria-hidden="true">
                02
            </p>
            <h2 id="wrong">What usually goes wrong, and does not here</h2>
            <p>
                Each of these is a mistake shared styles often make. Each has a test that fails when
                the mistake comes back, and where this site shows one, a link opens it.
            </p>

            <h3>The flash of the wrong theme</h3>
            <p>
                A theme set by a script that runs after the page is drawn paints it light, then
                dark. Here the script runs inline before the first paint, and a page built with the
                kit&rsquo;s Vite plugin fails its build if it leaves the script out.{' '}
                <a href={`${BASE}tokens/#theme`}>How the theme is chosen</a>.
            </p>

            <h3>Shared styles that take over the page</h3>
            <p>
                A style library usually wins by the weight of its selectors, so a demo has to
                outweigh it to change anything. Here every value the kit names starts with{' '}
                <code>--dk-</code> and every class with <code>dk-</code>, so a demo keeps its own
                names. Every rule sits in a layer of the kit&rsquo;s, so a demo&rsquo;s own styles
                outside a layer win whatever their selectors, and a demo with layers of its own
                names where the kit&rsquo;s go. The one exception is the kit&rsquo;s rule for a
                visitor who asks for less motion, which holds over a demo&rsquo;s ordinary styles. A
                test fails if a rule slips out of its layer.
            </p>

            <h3>A state you can see but not hear</h3>
            <p>
                A class such as &ldquo;active&rdquo; can make a button look pressed while a screen
                reader hears an ordinary button. Here pressed, open, invalid and unavailable are
                each drawn from the attribute a screen reader reads. A button the kit marks
                unavailable can still be reached with the keyboard, so someone using one can land on
                it and read the words beside it that say why.{' '}
                <a href={`${BASE}controls/#buttons`}>Each state of the buttons</a>.
            </p>

            <h3>A security policy that refuses the styles</h3>
            <p>
                A page can tell the browser to load styles only from its own site, which stops an
                injected style from changing what it shows. Libraries that write their styles from a
                script while the page runs are refused under it, unless the page loosens the policy
                to let them in. The kit&rsquo;s styles load as files from the page&rsquo;s own site
                and its components write markup alone, with no style attribute, so every page of
                this site runs under that policy.
            </p>

            <h3>Colors that fail in the dark</h3>
            <p>
                A palette checked in the light theme alone can leave text too faint to read in the
                dark. Here each pairing the palette is meant for, text on every ground it sits on
                and the edge of every control, is measured in both themes. Every change and every
                release has to pass that test.{' '}
                <a href={`${BASE}tokens/#contrast`}>The contrast of every pairing</a>.
            </p>

            <h3>Docs that drift from the code</h3>
            <p>
                Examples written by hand stop matching the code a release or two later. Here each
                block of markup in the package README is written from the examples the browser tests
                draw, and a test fails when a block differs from what its example draws. This site
                draws the version on npm, so what you see is what a demo installs.
            </p>
        </section>

        <section>
            <p className="dk-explainer-number" aria-hidden="true">
                03
            </p>
            <h2 id="hood">Under the hood, briefly</h2>
            <p>The rest is for engineers.</p>
            <p>
                The kit is three sheets of plain CSS, built on custom properties, cascade layers and{' '}
                <code>light-dark()</code>, with React components that draw the same markup a page
                without React writes by hand, and a Vite plugin that puts the theme script inline.
                It is published on npm as{' '}
                <a href={NPM}>
                    <code>@jasonsdevspace/design-kit</code>
                </a>
                , and each version is staged from a tag and goes live when it is promoted. It needs
                Chrome or Edge 123, Firefox 120 or Safari 17.5, or later, the first versions that
                draw <code>light-dark()</code>. This site is built with Vite and React&rsquo;s
                static render, and its only scripts are the theme script and its own, for the theme
                switch and the copy buttons.
            </p>
            <p>
                The <a href={`${builtAt(commit)}#readme`}>README</a> is the case study, and the{' '}
                <a href={`${builtAt(commit)}/docs/decisions`}>decision records</a> are beside it,
                each with the options turned down and the test behind the choice.
            </p>
        </section>

        <section>
            <p className="dk-explainer-number" aria-hidden="true">
                04
            </p>
            <h2 id="who">Who made it</h2>
            <p>
                Jason Poteet, as a portfolio project. If this is the kind of work you are hiring
                for, <a href="https://jasonsdevspace.com/#contact">get in touch</a>.
            </p>
        </section>
    </>
);
