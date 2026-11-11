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
    SelectField,
    SkipLink,
    TextareaField,
    ThemeSwitch,
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

/**
 * An action, the one action a view leads with, a large button, a tall one, a text button, a toggle
 * that is on, and a button that is off, with the text beside it that says why.
 */
export const buttons: ReactElement = (
    <>
        <Button>Filters</Button>
        <Button accent>Save rule</Button>
        <Button large>Try it with your own products</Button>
        <Button large tall accent>
            Save the round
        </Button>
        <Button text>Show the markup</Button>
        <Button pressed>Members only</Button>
        <Button off aria-describedby="previous-why">
            Previous
        </Button>
        <p id="previous-why" className="dk-field-hint">
            This is the first page.
        </p>
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

/** A table of figures, titled, in a frame that scrolls inside itself. */
export const table: ReactElement = pieces.table.draw(kit, pieces.asWritten);

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
        <main id="main-content" tabIndex={-1} className="dk-app-body">
            ...
        </main>
        <div className="dk-app-toast">...</div>
        <div className="dk-app-dock">
            <button type="button" className="dk-button dk-button-accent dk-button-tall">
                Save the round
            </button>
        </div>
        <nav className="dk-app-tabs" aria-label="Sections">
            ...
        </nav>
    </div>
);

/** The theme switch, as the component draws it before a page attaches it. */
export const themeSwitch: ReactElement = <ThemeSwitch id="theme" />;

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
    buttons,
    fields,
    choiceField,
    callout,
    pills,
    tabs,
    eyebrow,
    themeSwitch,
    copyButton,
    explainerPage,
    steps,
    panel,
    table,
    code,
    appFrame,
} as const satisfies Readonly<Record<string, ReactElement>>;

export type ExampleName = keyof typeof EXAMPLES;
