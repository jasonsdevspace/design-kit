import type { ReactElement } from 'react';

import * as kit from '../src/react.js';
import {
    Button,
    Callout,
    DemoFooter,
    InputField,
    PortfolioStrip,
    SelectField,
    SkipLink,
} from '../src/react.js';
import * as pieces from './pieces.js';

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

/** A demo's repository, as the examples name it. */
export const SOURCE = 'https://github.com/jasonsdevspace/example';

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
    <PortfolioStrip about="./about/" source={SOURCE} tools={<Button>Tour</Button>} />
);

/** The strip's section while the demo's switches are on their way, holding only their room. */
export const stripWaiting: ReactElement = (
    <section className="dk-strip-tools">
        <span className="dk-strip-room"></span>
    </section>
);

/** The footer. */
export const footer: ReactElement = (
    <DemoFooter name="Example" about="./about/" source={SOURCE} aside="Built at commit abc1234." />
);

/**
 * An action, the one action a view leads with, a toggle that is on, and a button that is off, with
 * the text beside it that says why.
 */
export const buttons: ReactElement = (
    <>
        <Button>Filters</Button>
        <Button accent>Save rule</Button>
        <Button pressed>Members only</Button>
        <Button off aria-describedby="previous-why">
            Previous
        </Button>
        <p id="previous-why" className="dk-field-hint">
            This is the first page.
        </p>
    </>
);

/** A text field with a hint and an error, and a select with neither. */
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
        </form>
        {(['info', 'success', 'danger'] as const).map((tone) => (
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

/** Each id a piece names, as written. */
const asWritten = (name: string) => name;

/** The steps of a flow, each a title and a note, with an arrow from the step before. */
export const steps: ReactElement = pieces.steps.draw(kit, asWritten);

/** A panel set apart from the prose, with its title. */
export const panel: ReactElement = pieces.panel.draw(kit, asWritten);

/** A table of figures, titled, in a frame that scrolls inside itself. */
export const table: ReactElement = pieces.table.draw(kit, asWritten);

/** A block of code, titled, that keeps its lines and scrolls inside itself. */
export const code: ReactElement = pieces.code.draw(kit, asWritten);

/** Every example by the name the reference's markers give it. */
export const EXAMPLES = {
    skipLink,
    strip,
    stripWaiting,
    footer,
    buttons,
    fields,
    callout,
    explainerPage,
    steps,
    panel,
    table,
    code,
} as const satisfies Readonly<Record<string, ReactElement>>;

export type ExampleName = keyof typeof EXAMPLES;
