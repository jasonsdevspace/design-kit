import type { ReactElement } from 'react';

import * as kit from '../src/react.js';
import {
    Button,
    Callout,
    ChoiceField,
    CopyButton,
    CopyStatus,
    DemoFooter,
    InputField,
    PortfolioStrip,
    Progress,
    SelectField,
    SkipLink,
    StatusLine,
    StepperField,
    TextareaField,
    ThemeSwitch,
    Toast,
} from '../src/react.js';
import * as pieces from './pieces.js';

export { SOURCE } from './pieces.js';

/*
 * The markup each piece of the kit draws, in one place, so the reference prints what the components
 * draw and the browser tests import it rather than keep copies. A piece is drawn by its component
 * where the block shows all of what the component draws, and written as a page without React
 * writes it otherwise. An explainer's steps, panel, table and code block come from `pieces.tsx`,
 * which the site draws them from too. The reference prints each example in EXAMPLES as HTML, and a
 * test fails when one of its blocks no longer matches. The reference prints none of the states of
 * each control, which the browser tests draw from `controlStates` and the site from `states.tsx`.
 * The package ships none of this.
 */

/** The skip link, and the main content it leads to. */
export const skipLink: ReactElement = (
    <>
        <SkipLink />
        <main id="main-content" tabIndex={-1}>
            ...
        </main>
    </>
);

/** The strip, with a demo's switch in its section after the links. */
export const strip: ReactElement = (
    <PortfolioStrip
        about="./about/"
        source={pieces.SOURCE}
        tools={<Button>Tour</Button>}
        toolsLabel="Tour"
    />
);

/** The strip's section while the demo's switches are on their way, holding only their room. */
export const stripWaiting: ReactElement = (
    <section className="dk-strip-tools">
        <span className="dk-strip-room"></span>
    </section>
);

/** The footer. */
export const footer: ReactElement = (
    <DemoFooter
        name="Example"
        about="./about/"
        source={pieces.SOURCE}
        aside="Built at commit abc1234."
    />
);

/** A site's header: its brand with its mark and name, and its pages as pills in a nav named Site. */
export const siteHeader: ReactElement = (
    <header className="dk-site-header">
        <a className="dk-site-brand" href="/">
            <svg className="dk-site-mark" aria-hidden="true" focusable="false" viewBox="0 0 32 32">
                <rect width="32" height="32" rx="8" fill="currentColor" />
            </svg>
            Scorekeeper
        </a>
        <nav aria-label="Site">
            <ul className="dk-pills" role="list">
                <li>
                    <a className="dk-pill" href="/" aria-current="page">
                        Home
                    </a>
                </li>
                <li>
                    <a className="dk-pill" href="/about/">
                        About
                    </a>
                </li>
                <li>
                    <a className="dk-pill" href="/app/">
                        Open the app
                    </a>
                </li>
            </ul>
        </nav>
    </header>
);

/** A save that is running, its button busy and saying so in its own words. */
export const busyButton: ReactElement = (
    <Button accent busy="Saving the rule.">
        Save rule
    </Button>
);

/**
 * An action, the one action a view leads with, a large button, a tall one, a text button, a toggle
 * that is on, and a button that is off, in a row of actions, with the text after it that says why
 * the last is off.
 */
export const buttons: ReactElement = (
    <>
        <div className="dk-actions">
            <Button>Filters</Button>
            <Button accent>Save rule</Button>
            <Button large>Try it with your own products</Button>
            <Button large tall accent>
                Save the round
            </Button>
            <Button text>Show the markup</Button>
            <Button text quiet />
            <Button pressed>Members only</Button>
            <Button off aria-describedby="previous-why">
                Previous
            </Button>
        </div>
        <p id="previous-why" className="dk-field-hint">
            This is the first page.
        </p>
    </>
);

/** A field whose control has a button beside it, a search and the button that runs it. */
export const fieldAction: ReactElement = (
    <form className="dk-field" role="search">
        <label className="dk-field-label" htmlFor="search">
            Search the products
        </label>
        <div className="dk-field-action">
            <input className="dk-input" type="search" id="search" name="q" />
            <Button type="submit">Search</Button>
        </div>
    </form>
);

/** A form where one field is required and one optional, each marked in words in its label. */
export const fieldMarks: ReactElement = (
    <>
        <InputField id="rule-name" label="Rule name" mark="required" required />
        <InputField id="rule-note" label="Note" mark="optional" />
    </>
);

/** Values a visitor reads but cannot change: a text field, a select and a stepper, read only. */
export const readOnlyFields: ReactElement = (
    <>
        <InputField id="round" label="Round" defaultValue="Round 3 of 10" readOnly />
        <SelectField id="game" name="game" label="Game" defaultValue="wizard" readOnly>
            <option value="flip-7">Flip 7</option>
            <option value="wizard">Wizard</option>
        </SelectField>
        <StepperField id="cards" label="Cards each" min={1} max={10} defaultValue={3} readOnly />
    </>
);

/** A text field with a hint and an error, a select with neither, and a textarea with a hint. */
export const fields: ReactElement = (
    <>
        <InputField
            id="email"
            type="email"
            label="Email"
            hint="Where the receipt goes"
            error="Enter an email address"
        />
        <SelectField id="sort" label="Sort by">
            <option value="">Choose an order</option>
            <option value="price">Price</option>
        </SelectField>
        <TextareaField id="note" label="Note" hint="Shown to the picker" />
    </>
);

/** A set of radios with a hint, a gloss on one choice and an error, and a row of checkboxes. */
export const choiceField: ReactElement = (
    <>
        <ChoiceField
            id="rule"
            name="rule"
            label="What the rule does"
            hint="A rule applies to every search"
            error="Choose what the rule does"
            choices={[
                { value: 'pin', label: 'Pin', hint: 'to the top of the results' },
                { value: 'hide', label: 'Hide' },
            ]}
        />
        <ChoiceField
            id="facets"
            name="facets"
            type="checkbox"
            label="Show"
            row
            choices={[
                { value: 'brand', label: 'Brand', defaultChecked: true },
                { value: 'price', label: 'Price' },
            ]}
        />
    </>
);

/** A callout for something that went wrong, with a title and an action. */
export const callout: ReactElement = (
    <Callout
        tone="danger"
        title="The products could not be loaded"
        actions={<Button>Try again</Button>}
    >
        <p>Check the file, then load it again.</p>
    </Callout>
);

/** A failure's callout as the page mounts it: live, read at once, and empty until the failure comes. */
export const tryAgain: ReactElement = <Callout tone="danger" live="alert" />;

/** Every state of each control, and a button and a field inside each callout tone. */
export const controlStates: ReactElement = (
    <>
        <div>
            <Button>Filters</Button>
            <Button accent>Save rule</Button>
            <Button pressed>Member</Button>
            <Button pressed={false}>Guest</Button>
            <Button off>Previous</Button>
            <button type="button" className="dk-button" disabled>
                Next
            </button>
            <Button>I</Button>
            <Button accent aria-expanded>
                Menu
            </Button>
            <Button pressed off>
                Locked on
            </Button>
            <Button pressed={false} off>
                Locked off
            </Button>
            <Button large>Try it</Button>
            <Button large accent>
                Open the demo
            </Button>
            <Button tall>Start the round</Button>
            <Button large tall accent>
                Save the round
            </Button>
            <Button text>Show the markup</Button>
            <Button text off>
                No markup
            </Button>
            <Button text aria-expanded>
                Hide the markup
            </Button>
        </div>
        <fieldset disabled>
            <legend>Closed</legend>
            <Button>Join</Button>
        </fieldset>
        <form>
            <InputField id="words" label="Search words" hint="Separate alternatives with commas" />
            <InputField
                id="state-email"
                label="Email"
                hint="Where the receipt goes"
                error="Enter an email address, like name@example.com"
            />
            <InputField id="off" label="Store" disabled defaultValue="Closed" />
            <SelectField id="state-sort" label="Sort by">
                <option value="">Choose an order</option>
                <option value="price">Price</option>
            </SelectField>
            <SelectField id="brand" label="Brand" error="Pick a brand">
                <option value="">Choose a brand</option>
            </SelectField>
            <SelectField id="tags" label="Tags" multiple>
                <option value="new">New</option>
                <option value="sale">Sale</option>
            </SelectField>
            <ChoiceField
                id="state-rule"
                name="state-rule"
                label="What the rule does"
                hint="A rule applies to every search"
                choices={[
                    { value: 'pin', label: 'Pin', hint: 'to the top of the results' },
                    { value: 'hide', label: 'Hide', defaultChecked: true },
                    { value: 'boost', label: 'Boost', disabled: true },
                ]}
            />
            <ChoiceField
                id="state-when"
                name="state-when"
                label="When"
                error="Choose when the rule runs"
                choices={[
                    { value: 'always', label: 'Always' },
                    { value: 'sale', label: 'During a sale' },
                ]}
            />
            <ChoiceField
                id="state-facets"
                name="state-facets"
                type="checkbox"
                label="Show"
                row
                choices={[
                    { value: 'brand', label: 'Brand', defaultChecked: true },
                    { value: 'price', label: 'Price' },
                    { value: 'color', label: 'Color' },
                ]}
            />
            <TextareaField id="note" label="Note" hint="Shown to the picker" />
            <TextareaField id="message" label="Message" error="Write a message" />
            <TextareaField id="closed-note" label="Closed note" disabled defaultValue="Closed" />
        </form>
        {(['info', 'success', 'warning', 'danger'] as const).map((tone) => (
            <Callout
                key={tone}
                tone={tone}
                title={`The ${tone} tone`}
                actions={<Button>Try again</Button>}
            >
                <p>
                    A message with <a href="#more">a link</a> in it.
                </p>
                <InputField id={`in-${tone}`} label={`Name in ${tone}`} hint="A hint" />
            </Callout>
        ))}
    </>
);

/** A content page: its title, its lead, its one action and its sections. */
export const contentPage: ReactElement = (
    <main id="main-content" tabIndex={-1} className="dk-page">
        <h1>Scorekeeper</h1>
        <p className="dk-lead">
            Keep score for any card game on one phone passed around the table.
        </p>
        <p>
            <a className="dk-button dk-button-accent" href="/app/">
                Start a game
            </a>
        </p>
        <section>
            <h2 id="how">How it works</h2>
            <p>...</p>
            <ul>
                <li>...</li>
            </ul>
        </section>
        <section>
            <h2 id="games">The games it knows</h2>
            ...
        </section>
    </main>
);

/**
 * A landing page in bands: a hero with its words in a stack beside its picture, and a band with a
 * group of sections.
 */
export const bands: ReactElement = (
    <main id="main-content" tabIndex={-1}>
        <section className="dk-band" aria-labelledby="title">
            <div className="dk-band-hero">
                <div className="dk-stack">
                    <p className="dk-eyebrow">For game night</p>
                    <h1 id="title">Scorekeeper</h1>
                    <p className="dk-lead">Keep score for any card game on one phone.</p>
                </div>
                <img src="table.jpg" width="880" height="1008" alt="" />
            </div>
        </section>
        <section className="dk-band" aria-labelledby="install">
            <h2 id="install">Install it</h2>
            <div className="dk-sections">
                <section aria-labelledby="iphone">
                    <h3 id="iphone">On an iPhone</h3>
                    <p>...</p>
                </section>
                <section aria-labelledby="android">
                    <h3 id="android">On an Android phone</h3>
                    <p>...</p>
                </section>
            </div>
        </section>
    </main>
);

/**
 * A label a pair's step over its value, and a round's heading a heading's step over the list of
 * scores it heads, the list drawn as a stack with its role kept.
 */
export const stacks: ReactElement = (
    <>
        <div className="dk-stack dk-stack-pair">
            <p>Next to play</p>
            <p>Ann</p>
        </div>
        <div className="dk-stack dk-stack-heading">
            <h2>Round 3</h2>
            <ul className="dk-stack" role="list">
                <li>Ann, 42 points</li>
                <li>Ben, 37 points</li>
            </ul>
        </div>
    </>
);

/**
 * A player's score: their name and the round in a split row, the score as a large numeral with its
 * unit out of sight, and a note under it.
 */
export const splitRow: ReactElement = (
    <div className="dk-stack dk-stack-pair">
        <div className="dk-split">
            <h2>Ana</h2>
            <p className="dk-note">Round 4 of 10</p>
        </div>
        <p className="dk-numeral">
            212<span className="dk-visually-hidden"> points</span>
        </p>
        <p className="dk-note">The first to 300 points wins.</p>
    </div>
);

/** An explainer page, with the parts a demo fills in left as an ellipsis. */
export const explainerPage: ReactElement = (
    <>
        <a className="dk-skip" href="#main-content">
            Skip to content
        </a>
        <div className="dk-strip">
            <nav className="dk-strip-links" aria-label="Portfolio">
                ...{' '}
                <a href="./" aria-current="page">
                    How it works
                </a>{' '}
                ...
            </nav>
        </div>
        <header className="dk-explainer-header">
            <a href="../">Example</a>
        </header>
        <main id="main-content" tabIndex={-1} className="dk-explainer">
            <h1>How Example works</h1>
            <p className="dk-explainer-lead">What the demo does, in a sentence or two.</p>
            <p>
                <a className="dk-button dk-button-accent" href="../">
                    Open the demo
                </a>
            </p>
            <section>
                <p className="dk-explainer-number" aria-hidden="true">
                    01
                </p>
                <h2 id="order">What happens when an order comes in</h2>
                <p>...</p>
                <h3>What usually goes wrong</h3>
                <p>...</p>
            </section>
        </main>
        <footer className="dk-footer">
            <p>
                ...{' '}
                <a href="./" aria-current="page">
                    How it works
                </a>{' '}
                is explained in plain words. ...
            </p>
        </footer>
    </>
);

/** The steps of a flow, each a title and a note, with an arrow from the step before. */
export const steps: ReactElement = pieces.steps.draw(kit, pieces.asWritten);

/** A panel set apart from the prose, with its title. */
export const panel: ReactElement = pieces.panel.draw(kit, pieces.asWritten);

/** A raised panel in an app's body: the one thing to pick up again, above the rest. */
export const panelRaised: ReactElement = pieces.panelRaised.draw(kit, pieces.asWritten);

/** A table of figures, titled, in a frame that scrolls inside itself. */
export const table: ReactElement = pieces.table.draw(kit, pieces.asWritten);

/** A table of scores that keeps each player's name in view while the rounds scroll sideways. */
export const pinnedTable: ReactElement = (
    <>
        <p className="dk-table-title" id="scores-title">
            Scores by round
        </p>
        <div className="dk-table-scroll" role="region" aria-labelledby="scores-title" tabIndex={0}>
            <table className="dk-table dk-table-pinned" aria-labelledby="scores-title">
                <thead>
                    <tr>
                        <th scope="col">Player</th>
                        <th scope="col" className="dk-table-number">
                            Round 1
                        </th>
                        <th scope="col" className="dk-table-number">
                            Round 2
                        </th>
                        <th scope="col" className="dk-table-number">
                            ...
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th scope="row">Ana</th>
                        <td className="dk-table-number">24</td>
                        <td className="dk-table-number">31</td>
                        <td className="dk-table-number">...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </>
);

/** A block of code, titled, that keeps its lines and scrolls inside itself. */
export const code: ReactElement = pieces.code.draw(kit, pieces.asWritten);

/** Pills: chips that name something, and a row of links among pages, the current one marked. */
export const pills: ReactElement = (
    <>
        <ul className="dk-pills" role="list">
            <li className="dk-pill">TypeScript</li>
            <li className="dk-pill">React</li>
        </ul>
        <nav aria-label="Pages">
            <ul className="dk-pills" role="list">
                <li>
                    <a className="dk-pill" href="./" aria-current="page">
                        Home
                    </a>
                </li>
                <li>
                    <a className="dk-pill" href="./tokens/">
                        Tokens
                    </a>
                </li>
            </ul>
        </nav>
    </>
);

/**
 * Tabs: a row the page owns the roles and keys of, a row of links among pages, and a row of
 * toggles, the chosen one of each drawn alike.
 */
export const tabs: ReactElement = (
    <>
        <div className="dk-tabs" role="tablist" aria-label="Code">
            <button
                type="button"
                className="dk-tab"
                role="tab"
                id="markup-tab"
                aria-selected="true"
                aria-controls="markup"
            >
                Markup
            </button>
            <button
                type="button"
                className="dk-tab"
                role="tab"
                id="react-tab"
                aria-selected="false"
                aria-controls="react"
                tabIndex={-1}
            >
                React
            </button>
        </div>
        <div id="markup" role="tabpanel" aria-labelledby="markup-tab">
            …
        </div>
        <div id="react" role="tabpanel" aria-labelledby="react-tab" hidden>
            …
        </div>
        <nav aria-label="Categories">
            <ul className="dk-tabs" role="list">
                <li>
                    <a className="dk-tab" href="./" aria-current="page">
                        All
                    </a>
                </li>
                <li>
                    <a className="dk-tab" href="./books/">
                        Books
                    </a>
                </li>
            </ul>
        </nav>
        <div className="dk-tabs">
            <button type="button" className="dk-tab" aria-pressed="true">
                Open
            </button>
            <button type="button" className="dk-tab" aria-pressed="false">
                Go
            </button>
        </div>
    </>
);

/** A button with an icon beside its words, and a toggle whose only face is a filled icon. */
export const icon: ReactElement = (
    <div className="dk-actions">
        <button type="button" className="dk-button">
            <svg className="dk-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
            </svg>
            Add a player
        </button>
        <button type="button" className="dk-button dk-button-icon" aria-pressed="false">
            <svg className="dk-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                <path
                    fill="currentColor"
                    d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"
                />
            </svg>
            <span className="dk-visually-hidden">Favorite game</span>
        </button>
    </div>
);

/** An eyebrow over a heading. */
export const eyebrow: ReactElement = (
    <>
        <p className="dk-eyebrow">Signed in as a guest</p>
        <h2>Your basket</h2>
    </>
);

/** A screen in an app's frame, with the parts a screen fills in left as an ellipsis. */
export const appFrame: ReactElement = (
    <div className="dk-app">
        <header className="dk-app-bar">
            <h1 className="dk-app-title">Round 3</h1>
            <button type="button" className="dk-button dk-button-text">
                Scores
            </button>
        </header>
        <main id="main-content" tabIndex={0} className="dk-app-body">
            ...
        </main>
        <div className="dk-app-toast">
            <Toast />
        </div>
        <section className="dk-app-dock" aria-label="Actions">
            <button type="button" className="dk-button dk-button-accent dk-button-tall">
                Save the round
            </button>
        </section>
        <nav className="dk-app-tabs dk-tabbar" aria-label="Sections">
            ...
        </nav>
    </div>
);

/** A dock with a compact action beside its main one, on one row. */
export const dockInline: ReactElement = (
    <section className="dk-app-dock" aria-label="Actions">
        <div className="dk-app-dock-inline">
            <Button tall>Scores</Button>
            <Button accent tall>
                Save the round
            </Button>
        </div>
    </section>
);

/** A tab bar of three places, the first the one the visitor is in. */
export const tabBar: ReactElement = (
    <nav className="dk-tabbar" aria-label="Sections">
        <ul>
            <li>
                <a href="/" aria-current="page">
                    <svg
                        className="dk-icon"
                        aria-hidden="true"
                        focusable="false"
                        viewBox="0 0 24 24"
                    >
                        ...
                    </svg>
                    Play
                </a>
            </li>
            <li>
                <a href="/history/">
                    <svg
                        className="dk-icon"
                        aria-hidden="true"
                        focusable="false"
                        viewBox="0 0 24 24"
                    >
                        ...
                    </svg>
                    History
                </a>
            </li>
            <li>
                <a href="/players/">
                    <svg
                        className="dk-icon"
                        aria-hidden="true"
                        focusable="false"
                        viewBox="0 0 24 24"
                    >
                        ...
                    </svg>
                    Players
                </a>
            </li>
        </ul>
    </nav>
);

/** A stepper for the number of players, its label beside it, before a page attaches it. */
export const stepper: ReactElement = (
    <StepperField
        id="players"
        label="Players"
        subject="the number of players"
        min={2}
        max={8}
        defaultValue={4}
        inline
        tall
    />
);

/** A toast, as the component draws it before a page attaches it. */
export const toast: ReactElement = <Toast />;

/**
 * A dialog that asks a question over the page, its answers in a form that closes it, and a sheet
 * of a round's options from the bottom of a phone.
 */
export const dialog: ReactElement = (
    <>
        <button type="button" className="dk-button" id="finish">
            Finish the game
        </button>
        <dialog
            className="dk-dialog"
            id="end-game"
            aria-labelledby="end-game-title"
            aria-describedby="end-game-text"
        >
            <h2 className="dk-dialog-title" id="end-game-title">
                End the game now?
            </h2>
            <p id="end-game-text">The scores so far are kept in the history.</p>
            <form method="dialog" className="dk-dialog-actions">
                <button type="submit" className="dk-button" value="keep">
                    Keep playing
                </button>
                <button type="submit" className="dk-button dk-button-accent" value="end">
                    End the game
                </button>
            </form>
        </dialog>
        <dialog
            className="dk-dialog dk-dialog-sheet"
            id="round-options"
            aria-labelledby="round-options-title"
        >
            <h2 className="dk-dialog-title" id="round-options-title" tabIndex={-1} autoFocus>
                Round options
            </h2>
            <SelectField id="dealt" label="Cards dealt">
                <option value="10">Ten each</option>
                <option value="7">Seven each</option>
            </SelectField>
            <form method="dialog" className="dk-dialog-actions">
                <button type="submit" className="dk-button dk-button-accent">
                    Done
                </button>
            </form>
        </dialog>
    </>
);

/**
 * A dialog and a panel with a quiet Close in the top corner: the dialog's first answer takes focus
 * as it opens, and its Close closes it with no script, and the panel's Close names what it closes.
 */
export const cornerClose: ReactElement = (
    <>
        <dialog
            className="dk-dialog"
            id="leave-game"
            aria-labelledby="leave-game-title"
            aria-describedby="leave-game-text"
        >
            <h2 className="dk-dialog-title" id="leave-game-title">
                Leave the game for now?
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
            <p id="leave-game-text">The scores are kept, and the game waits where you left it.</p>
            <form method="dialog" className="dk-dialog-actions">
                <button type="submit" className="dk-button" value="stay" autoFocus>
                    Keep playing
                </button>
                <button type="submit" className="dk-button dk-button-accent" value="leave">
                    Leave the game
                </button>
            </form>
        </dialog>
        <div className="dk-panel" id="round-tips">
            <h3 className="dk-panel-title">Round tips</h3>
            <div className="dk-close">
                <button type="button" className="dk-button dk-button-text dk-button-quiet">
                    <span aria-hidden="true">×</span>
                    <span className="dk-visually-hidden">Close round tips</span>
                </button>
            </div>
            <p>Ana deals first, and the cards go round to the left.</p>
        </div>
    </>
);

/** A grid of toggles for the cards in a hand, one of them off, and a pad of plain keys. */
export const buttonGrid: ReactElement = (
    <>
        <div className="dk-button-grid" role="group" aria-label="Cards in hand">
            <Button pressed>7</Button>
            <Button pressed={false}>8</Button>
            <Button pressed>9</Button>
            <Button pressed={false} off>
                10
            </Button>
        </div>
        <div className="dk-button-grid dk-button-grid-tall" role="group" aria-label="Score">
            <Button>1</Button>
            <Button>2</Button>
            <Button>
                <span aria-hidden="true">⌫</span>
                <span className="dk-visually-hidden">Delete</span>
            </Button>
        </div>
    </>
);

/**
 * A list of games played, each row a link named by its words, title first, and a list of players,
 * each row with a button of its own at its end.
 */
export const rows: ReactElement = (
    <>
        <ul className="dk-rows" role="list">
            <li>
                <a className="dk-row" href="/games/12/">
                    <span className="dk-row-text">
                        <span className="dk-row-title">Flip 7</span>
                        <span className="dk-visually-hidden">, </span>
                        <span className="dk-row-detail">Four players, won by Ana</span>
                    </span>
                    <span className="dk-visually-hidden">, </span>
                    <span className="dk-row-figure">
                        212<span className="dk-visually-hidden"> points</span>
                    </span>
                    <span className="dk-row-sign" aria-hidden="true">
                        ›
                    </span>
                </a>
            </li>
            <li>...</li>
        </ul>
        <ul className="dk-rows" role="list">
            <li>
                <div className="dk-row">
                    <span className="dk-row-text">
                        <span className="dk-row-title">Ana</span>
                        <span className="dk-row-detail">Played 12 games</span>
                    </span>
                    <Button text>
                        Remove<span className="dk-visually-hidden"> Ana</span>
                    </Button>
                </div>
            </li>
            <li>...</li>
        </ul>
    </>
);

/** An empty list of players, saying what is missing, with the first step. */
export const empty: ReactElement = (
    <div className="dk-empty">
        <p>No players yet.</p>
        <Button>Add a player</Button>
    </div>
);

/** A list of tiles, each link on a ground its page sets. */
export const rowTiles: ReactElement = (
    <ul className="dk-rows dk-rows-tiles" role="list">
        <li>
            <a className="dk-row game-flip-7" href="/new/?game=flip-7">
                <span className="dk-row-text">
                    <span className="dk-row-title">Flip 7</span>
                    <span className="dk-visually-hidden">, </span>
                    <span className="dk-row-detail">3 or more players</span>
                </span>
                <span className="dk-row-sign" aria-hidden="true">
                    ›
                </span>
            </a>
        </li>
        <li>...</li>
    </ul>
);

/** A list of seats, each row with a group of buttons at its end, the first seat's Up off. */
export const rowActions: ReactElement = (
    <ul className="dk-rows" role="list">
        <li>
            <div className="dk-row">
                <span className="dk-row-text">
                    <span className="dk-row-title">Ana</span>
                    <span className="dk-visually-hidden">, </span>
                    <span className="dk-row-detail">Seat 1</span>
                </span>
                <span className="dk-row-actions">
                    <button type="button" className="dk-button dk-button-icon" aria-disabled="true">
                        <svg
                            className="dk-icon"
                            aria-hidden="true"
                            focusable="false"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 19V5M6 11l6-6 6 6" />
                        </svg>
                        <span className="dk-visually-hidden">Move Ana up</span>
                    </button>
                    <button type="button" className="dk-button dk-button-icon">
                        <svg
                            className="dk-icon"
                            aria-hidden="true"
                            focusable="false"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 5v14M6 13l6 6 6-6" />
                        </svg>
                        <span className="dk-visually-hidden">Move Ana down</span>
                    </button>
                    <button type="button" className="dk-button dk-button-icon">
                        <svg
                            className="dk-icon"
                            aria-hidden="true"
                            focusable="false"
                            viewBox="0 0 24 24"
                        >
                            <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                        <span className="dk-visually-hidden">Remove Ana</span>
                    </button>
                </span>
            </div>
        </li>
        <li>...</li>
    </ul>
);

/** A list of players, each row a link with the player's picture at its start. */
export const rowPicture: ReactElement = (
    <ul className="dk-rows" role="list">
        <li>
            <a className="dk-row" href="/players/ana/">
                <img className="dk-row-picture" src="/players/ana.jpg" alt="" loading="lazy" />
                <span className="dk-row-text">
                    <span className="dk-row-title">Ana</span>
                    <span className="dk-visually-hidden">, </span>
                    <span className="dk-row-detail">Played 12 games</span>
                </span>
                <span className="dk-row-sign" aria-hidden="true">
                    ›
                </span>
            </a>
        </li>
        <li>...</li>
    </ul>
);

/** A list of tiles in columns, each a page with a picture of it across its top. */
export const tileColumns: ReactElement = (
    <ul className="dk-rows dk-rows-tiles dk-rows-columns" role="list">
        <li>
            <a className="dk-row" href="/design-kit/buttons/">
                <img
                    className="dk-row-picture"
                    src="/previews/buttons.png"
                    alt=""
                    width="480"
                    height="270"
                    loading="lazy"
                />
                <span className="dk-row-text">
                    <span className="dk-row-title">Buttons</span>
                    <span className="dk-visually-hidden">, </span>
                    <span className="dk-row-detail">Every kind and state</span>
                </span>
                <span className="dk-row-sign" aria-hidden="true">
                    ›
                </span>
            </a>
        </li>
        <li>...</li>
    </ul>
);

/** The theme switch, as the component draws it before a page attaches it. */
export const themeSwitch: ReactElement = <ThemeSwitch id="theme" />;

/** A code block's head, its title with a copy button at its end, before the button is attached. */
export const codeHead: ReactElement = (
    <>
        <div className="dk-code-head">
            <p className="dk-code-title" id="install-title">
                Install the kit
            </p>
            <CopyButton name="install command" />
        </div>
        <pre
            className="dk-code"
            role="region"
            aria-labelledby="install-title"
            tabIndex={0}
            translate="no"
        >
            <code>npm install @jasonsdevspace/design-kit</code>
        </pre>
    </>
);

/** A screen's own status line, out of sight, on the page from the start. */
export const statusLine: ReactElement = <StatusLine className="screen-status" />;

/** A part of the page waiting for its content, with the line that shows once the wait is long. */
export const loading: ReactElement = (
    <article aria-labelledby="product" aria-busy="true">
        <h2 id="product">Product</h2>
        <p className="dk-loading">Loading the product.</p>
    </article>
);

/** An import working through a file, its label, its bar and the words that say how far it has come. */
export const progress: ReactElement = (
    <Progress id="import" label="Importing products" value={12} max={40} words="12 of 40" />
);

/** A copy button and the page's status line, before a page attaches the button. */
export const copyButton: ReactElement = (
    <>
        <CopyButton name="install command" />
        <CopyStatus />
    </>
);

/** Every example by the name the reference's markers give it. */
export const EXAMPLES = {
    skipLink,
    strip,
    stripWaiting,
    footer,
    siteHeader,
    buttons,
    busyButton,
    fields,
    fieldMarks,
    readOnlyFields,
    fieldAction,
    choiceField,
    callout,
    tryAgain,
    pills,
    tabs,
    eyebrow,
    themeSwitch,
    copyButton,
    statusLine,
    loading,
    progress,
    codeHead,
    contentPage,
    bands,
    stacks,
    splitRow,
    explainerPage,
    steps,
    panel,
    panelRaised,
    table,
    pinnedTable,
    code,
    appFrame,
    dockInline,
    tabBar,
    stepper,
    toast,
    buttonGrid,
    icon,
    rows,
    empty,
    rowActions,
    rowPicture,
    rowTiles,
    tileColumns,
    dialog,
    cornerClose,
} as const satisfies Readonly<Record<string, ReactElement>>;

export type ExampleName = keyof typeof EXAMPLES;
