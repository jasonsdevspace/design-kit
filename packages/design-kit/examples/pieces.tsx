import type { Control, State } from './states.js';

/*
 * The page chrome and an explainer's pieces, named, with the attribute that draws each, for a page
 * that shows them one by one, as `states.tsx` holds the controls. The chrome is drawn by the
 * components passed in, and the explainer's pieces, which no component draws, are written as a
 * page writes them by hand. The README's blocks for the steps, the panel, the table and the code
 * block are drawn from here too, so the two never differ.
 */

/** A demo's repository and its explainer, as the examples name them. */
const SOURCE = 'https://github.com/jasonsdevspace/example';
const ABOUT = './about/';

export const CHROME: readonly Control[] = [
    {
        name: 'Strip',
        laidOut: true,
        pictured: true,
        states: [
            {
                name: "The strip on a demo's page",
                attribute: 'class="dk-strip"',
                react: `<PortfolioStrip about="./about/" source="https://github.com/jasonsdevspace/example" />`,
                draw: ({ PortfolioStrip }) => <PortfolioStrip about={ABOUT} source={SOURCE} />,
            },
            {
                name: "The strip with a demo's switches",
                attribute: 'aria-label="Demo"',
                react: `<PortfolioStrip
    about="./about/"
    source="https://github.com/jasonsdevspace/example"
    tools={<Button>Tour</Button>}
/>`,
                draw: ({ Button, PortfolioStrip }) => (
                    <PortfolioStrip about={ABOUT} source={SOURCE} tools={<Button>Tour</Button>} />
                ),
            },
            {
                name: 'The strip keeping room for switches that load later',
                attribute: 'class="dk-strip-room"',
                react: `<PortfolioStrip about="./about/" source="https://github.com/jasonsdevspace/example" toolsWaiting />`,
                draw: ({ PortfolioStrip }) => (
                    <PortfolioStrip about={ABOUT} source={SOURCE} toolsWaiting />
                ),
            },
            {
                name: "The strip on a demo's explainer",
                attribute: 'aria-current="page"',
                react: `<PortfolioStrip
    about="./about/"
    source="https://github.com/jasonsdevspace/example"
    current="about"
/>`,
                draw: ({ PortfolioStrip }) => (
                    <PortfolioStrip about={ABOUT} source={SOURCE} current="about" />
                ),
            },
        ],
    },
    {
        name: 'Footer',
        pictured: true,
        states: [
            {
                name: "The footer on a demo's page",
                attribute: 'class="dk-footer"',
                react: `<DemoFooter name="Example" about="./about/" source="https://github.com/jasonsdevspace/example" />`,
                draw: ({ DemoFooter }) => (
                    <DemoFooter name="Example" about={ABOUT} source={SOURCE} />
                ),
            },
            {
                name: "The footer on a demo's explainer",
                attribute: 'aria-current="page"',
                react: `<DemoFooter
    name="Example"
    about="./about/"
    source="https://github.com/jasonsdevspace/example"
    current="about"
/>`,
                draw: ({ DemoFooter }) => (
                    <DemoFooter name="Example" about={ABOUT} source={SOURCE} current="about" />
                ),
            },
        ],
    },
];

/** The steps of a flow, each a title and a note, with an arrow from the step before. */
export const steps: State = {
    name: 'The steps of a flow',
    attribute: 'class="dk-steps"',
    draw: () => (
        <ol className="dk-steps" role="list">
            <li>
                <strong className="dk-steps-title">The order names a product.</strong>
                <span className="dk-steps-note">It says how many it wants.</span>
            </li>
            <li>
                <span className="dk-steps-arrow" aria-hidden="true">
                    ↓
                </span>
                <strong className="dk-steps-title">It waits its turn.</strong>
                <span className="dk-steps-note">Behind any order for the same product.</span>
            </li>
        </ol>
    ),
};

/** A panel set apart from the prose, with its title. */
export const panel: State = {
    name: 'A panel',
    attribute: 'class="dk-panel"',
    draw: () => (
        <div className="dk-panel">
            <p className="dk-panel-title">How the numbers were taken</p>
            <p>
                Each strategy ran three times on the same laptop with the same orders, and the table
                shows the middle run.
            </p>
        </div>
    ),
};

/** A table of figures, titled, in a frame that scrolls inside itself. */
export const table: State = {
    name: 'A table of figures',
    attribute: 'class="dk-table"',
    draw: (_kit, id) => (
        <>
            <p className="dk-table-title" id={id('bench-title')}>
                Orders a second under each strategy
            </p>
            <div
                className="dk-table-scroll"
                role="region"
                aria-labelledby={id('bench-title')}
                tabIndex={0}
            >
                <table className="dk-table" aria-labelledby={id('bench-title')}>
                    <thead>
                        <tr>
                            <th scope="col">Scenario</th>
                            <th scope="col" className="dk-table-number">
                                Orders a second
                            </th>
                            <th scope="col" className="dk-table-number">
                                Slowest 1%, ms
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th scope="row">Hot product, row lock</th>
                            <td className="dk-table-number">700</td>
                            <td className="dk-table-number">48.5</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    ),
};

/** A block of code, titled, that keeps its lines and scrolls inside itself. */
export const code: State = {
    name: 'A block of code',
    attribute: 'class="dk-code"',
    draw: (_kit, id) => (
        <>
            <p className="dk-code-title" id={id('lock-title')}>
                The statement that holds the stock
            </p>
            <pre
                className="dk-code"
                role="region"
                aria-labelledby={id('lock-title')}
                tabIndex={0}
                translate="no"
            >
                <code>
                    {'UPDATE stock SET held = held + 1\nWHERE product_id = $1 AND held < on_hand;'}
                </code>
            </pre>
        </>
    ),
};

export const EXPLAINER: readonly Control[] = [
    {
        name: 'The page',
        pictured: true,
        states: [
            {
                name: "An explainer's opening and its first section",
                attribute: 'class="dk-explainer"',
                // A div rather than main, and a picture, since the page it is shown on has its own
                // main content and its own h1.
                draw: () => (
                    <>
                        <div className="dk-explainer-header">
                            <a href="../">Example</a>
                        </div>
                        <div className="dk-explainer">
                            <h1>How Example works</h1>
                            <p className="dk-explainer-lead">
                                Example holds stock for each order, so two customers never buy the
                                same last unit.
                            </p>
                            <p>
                                <a className="dk-button dk-button-accent" href="../">
                                    Open the demo
                                </a>
                            </p>
                            <section>
                                <p className="dk-explainer-number" aria-hidden="true">
                                    01
                                </p>
                                <h2>What happens when an order comes in</h2>
                                <p>
                                    An order names a product and how many it wants, then waits its
                                    turn behind any other order for the same product.
                                </p>
                            </section>
                        </div>
                    </>
                ),
            },
        ],
    },
    { name: 'Steps', laidOut: true, states: [steps] },
    { name: 'Panels', laidOut: true, states: [panel] },
    { name: 'Tables', laidOut: true, states: [table] },
    { name: 'Code blocks', laidOut: true, states: [code] },
];
