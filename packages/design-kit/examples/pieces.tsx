import type { ReactElement } from 'react';

import type { Control, Kit, State } from './states.js';

/*
 * The page chrome and an explainer's pieces, named, with the attribute that draws each, for a page
 * that shows them one by one, as `states.tsx` holds the controls. The chrome is drawn by the
 * components passed in, and the explainer's pieces, which no component draws, are written as a
 * page writes them by hand. The reference's blocks for the steps, the panel, the table and the code
 * block are drawn from here too, so the two never differ.
 */

/** A demo's repository and its explainer, as the examples name them. */
export const SOURCE = 'https://github.com/jasonsdevspace/example';
const ABOUT = './about/';

/** Each id a piece names, as written, for a page that draws one copy of it. */
export const asWritten = (name: string): string => name;

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
                attribute: 'aria-label="Tour"',
                react: `<PortfolioStrip
    about="./about/"
    source="https://github.com/jasonsdevspace/example"
    tools={<Button>Tour</Button>}
    toolsLabel="Tour"
/>`,
                draw: ({ Button, PortfolioStrip }) => (
                    <PortfolioStrip
                        about={ABOUT}
                        source={SOURCE}
                        tools={<Button>Tour</Button>}
                        toolsLabel="Tour"
                    />
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
        name: 'The layout',
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

/** The places an app's tab bar leads to, each with its mark, the first the one the visitor is in. */
const PLACES = [
    { name: 'Play', mark: 'M8 5v14l11-7z' },
    { name: 'Games', mark: 'M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z' },
    { name: 'Stats', mark: 'M5 13h3v6H5zm5.5-6h3v12h-3zM16 4h3v15h-3z' },
] as const;

/** A tab bar of the app's places, as a page writes it by hand. */
const tabBar = (className: string) => (
    <nav className={className} aria-label="Sections">
        <ul>
            {PLACES.map(({ name, mark }, index) => (
                <li key={name}>
                    <a href="./" aria-current={index === 0 ? 'page' : undefined}>
                        <svg aria-hidden="true" viewBox="0 0 24 24">
                            <path d={mark} fill="currentColor" />
                        </svg>
                        {name}
                    </a>
                </li>
            ))}
        </ul>
    </nav>
);

/** A screen in an app's frame, its toast's place holding what `toast` draws there. */
const screen = (
    { Button }: Kit,
    id: (name: string) => string,
    body: string,
    toast: ReactElement
) => (
    <div className="dk-app">
        <header className="dk-app-bar">
            <h1 className="dk-app-title">Round 3</h1>
            <Button text>Scores</Button>
        </header>
        <main id={id(body)} tabIndex={0} className="dk-app-body">
            <p>Ana leads by twelve points, with two rounds to play.</p>
        </main>
        <div className="dk-app-toast">{toast}</div>
        <section className="dk-app-dock" aria-label="Actions">
            <Button accent tall>
                Save the round
            </Button>
        </section>
        {tabBar('dk-app-tabs dk-tabbar')}
    </div>
);

/** The site's own pages, which rows that each lead to a page lead to. */
const PAGES = [
    { title: 'Tokens and theme', detail: 'Colors, their contrast and sizes', href: '../tokens/' },
    { title: 'Controls', detail: 'Buttons, fields and dialogs', href: '../controls/' },
] as const;

/** The players a row with a button of its own names. */
const PLAYERS = [
    { name: 'Ana', detail: 'Played 12 games' },
    { name: 'Ben', detail: 'Played 9 games' },
] as const;

/** A list of players, each row with a button of its own at its end. */
const playerRows = (className: string, { Button }: Kit) => (
    <ul className={className} role="list">
        {PLAYERS.map(({ name, detail }) => (
            <li key={name}>
                <div className="dk-row">
                    <span className="dk-row-text">
                        <span className="dk-row-title">{name}</span>
                        <span className="dk-row-detail">{detail}</span>
                    </span>
                    <Button text>
                        Remove<span className="dk-visually-hidden"> {name}</span>
                    </Button>
                </div>
            </li>
        ))}
    </ul>
);

/** The rounds a table of scores holds, each player's score in each. */
const ROUNDS = [1, 2, 3, 4, 5, 6] as const;
const SCORES = [
    { player: 'Ana', scores: [24, 31, 18, 27, 22, 30] },
    { player: 'Ben', scores: [19, 26, 33, 21, 25, 17] },
] as const;

/**
 * An app's frame and tab bar, as pictures, since a live copy would give the page a second main
 * content, a second h1 and a navigation that says the visitor is somewhere they are not, and the
 * pieces an app's screen holds, live.
 */
export const APP: readonly Control[] = [
    {
        name: 'App frame',
        pictured: true,
        laidOut: true,
        states: [
            {
                name: 'A screen with a bar, a body and a dock',
                attribute: 'class="dk-app"',
                draw: (kit, id) => screen(kit, id, 'round-3', <kit.Toast />),
            },
            {
                name: 'A screen with a toast above its dock',
                attribute: 'data-shown',
                // Drawn as the toast's attach function leaves it once it shows a message, marked shown
                // by the attribute the kit draws a shown toast from.
                draw: (kit, id) =>
                    screen(
                        kit,
                        id,
                        'round-3-saved',
                        <div className="dk-toast" data-shown="">
                            <p className="dk-toast-message" aria-hidden="true">
                                Round 3 saved.
                            </p>
                            <p className="dk-visually-hidden dk-toast-status" role="status">
                                Round 3 saved. Undo is available.
                            </p>
                            <button
                                type="button"
                                className="dk-button dk-button-text dk-toast-action"
                            >
                                Undo
                            </button>
                            <button
                                type="button"
                                className="dk-button dk-button-text dk-toast-close"
                            >
                                <span aria-hidden="true">×</span>
                                <span className="dk-visually-hidden">Dismiss</span>
                            </button>
                        </div>
                    ),
            },
        ],
    },
    {
        name: 'Tab bar',
        pictured: true,
        laidOut: true,
        states: [
            {
                name: 'Places at the bottom of a screen, one the current place',
                attribute: 'class="dk-tabbar"',
                draw: () => tabBar('dk-tabbar'),
            },
            {
                name: 'A page that scrolls whole and ends in a tab bar',
                attribute: 'class="dk-tabbar-page"',
                draw: (_kit, id) => (
                    <div className="dk-tabbar-page">
                        <main id={id('games')}>
                            <h1>Games</h1>
                            <p>Every game played, the newest first.</p>
                        </main>
                        {tabBar('dk-tabbar')}
                    </div>
                ),
            },
        ],
    },
    {
        name: 'Button grid',
        laidOut: true,
        states: [
            {
                name: 'Cards in a hand, two picked',
                attribute: 'aria-pressed="true"',
                react: `<div className="dk-button-grid" role="group" aria-label="Cards in hand">
    <Button pressed>7</Button>
    <Button pressed={false}>8</Button>
    <Button pressed>9</Button>
    <Button pressed={false}>10</Button>
    <Button pressed={false}>11</Button>
    <Button pressed={false}>12</Button>
</div>`,
                draw: ({ Button }) => (
                    <div className="dk-button-grid" role="group" aria-label="Cards in hand">
                        <Button pressed>7</Button>
                        <Button pressed={false}>8</Button>
                        <Button pressed>9</Button>
                        <Button pressed={false}>10</Button>
                        <Button pressed={false}>11</Button>
                        <Button pressed={false}>12</Button>
                    </div>
                ),
            },
            {
                name: 'A pad of keys',
                attribute: 'class="dk-button-grid"',
                react: `<div className="dk-button-grid" role="group" aria-label="Score">
    <Button>1</Button>
    <Button>2</Button>
    <Button>3</Button>
    <Button>
        <span aria-hidden="true">⌫</span>
        <span className="dk-visually-hidden">Delete</span>
    </Button>
    <Button>0</Button>
    <Button accent>Add</Button>
</div>`,
                draw: ({ Button }) => (
                    <div className="dk-button-grid" role="group" aria-label="Score">
                        <Button>1</Button>
                        <Button>2</Button>
                        <Button>3</Button>
                        <Button>
                            <span aria-hidden="true">⌫</span>
                            <span className="dk-visually-hidden">Delete</span>
                        </Button>
                        <Button>0</Button>
                        <Button accent>Add</Button>
                    </div>
                ),
            },
            {
                name: "Tall keys, pressed at arm's length",
                attribute: 'class="dk-button-grid dk-button-grid-tall"',
                react: `<div className="dk-button-grid dk-button-grid-tall" role="group" aria-label="Points">
    <Button>+1</Button>
    <Button>+5</Button>
    <Button>+10</Button>
</div>`,
                draw: ({ Button }) => (
                    <div
                        className="dk-button-grid dk-button-grid-tall"
                        role="group"
                        aria-label="Points"
                    >
                        <Button>+1</Button>
                        <Button>+5</Button>
                        <Button>+10</Button>
                    </div>
                ),
            },
        ],
    },
    {
        name: 'Rows',
        laidOut: true,
        states: [
            {
                name: 'Rows that each lead to a page',
                attribute: 'class="dk-row-sign"',
                draw: () => (
                    <ul className="dk-rows" role="list">
                        {PAGES.map(({ title, detail, href }) => (
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
                ),
            },
            {
                name: 'Rows that each hold a button',
                attribute: 'class="dk-rows"',
                draw: (kit) => playerRows('dk-rows', kit),
            },
            {
                name: 'Rows ending in a figure',
                attribute: 'class="dk-row-figure"',
                draw: () => (
                    <ul className="dk-rows" role="list">
                        {SCORES.map(({ player, scores }) => (
                            <li key={player}>
                                <div className="dk-row">
                                    <span className="dk-row-text">
                                        <span className="dk-row-title">{player}</span>
                                    </span>
                                    <span className="dk-visually-hidden">, </span>
                                    <span className="dk-row-figure">
                                        {scores.reduce((sum, score) => sum + score, 0)}
                                        <span className="dk-visually-hidden"> points</span>
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ),
            },
            {
                name: "Tall rows, pressed at arm's length",
                attribute: 'class="dk-rows dk-rows-tall"',
                draw: (kit) => playerRows('dk-rows dk-rows-tall', kit),
            },
        ],
    },
    {
        name: 'Pinned table',
        laidOut: true,
        states: [
            {
                name: 'A table whose first column stays in view',
                attribute: 'class="dk-table dk-table-pinned"',
                draw: (_kit, id) => (
                    <>
                        <p className="dk-table-title" id={id('scores-title')}>
                            Scores by round
                        </p>
                        <div
                            className="dk-table-scroll"
                            role="region"
                            aria-labelledby={id('scores-title')}
                            tabIndex={0}
                        >
                            <table
                                className="dk-table dk-table-pinned"
                                aria-labelledby={id('scores-title')}
                            >
                                <thead>
                                    <tr>
                                        <th scope="col">Player</th>
                                        {ROUNDS.map((round) => (
                                            <th key={round} scope="col" className="dk-table-number">
                                                Round {round}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {SCORES.map(({ player, scores }) => (
                                        <tr key={player}>
                                            <th scope="row">{player}</th>
                                            {scores.map((score, index) => (
                                                <td key={ROUNDS[index]} className="dk-table-number">
                                                    {score}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ),
            },
        ],
    },
];
