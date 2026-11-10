import type { ReactElement } from 'react';

import type * as React from '../src/react.js';

/*
 * Each state of each control, named, with the attribute that draws it, for a page that shows them
 * one by one. The components are passed in rather than imported, so the site draws them from the
 * version of the kit it pins while the kit's own tests draw them from the sources, and this module
 * imports nothing from the kit but its types.
 */

type Components = Pick<
    typeof React,
    | 'Button'
    | 'Callout'
    | 'ChoiceField'
    | 'CopyButton'
    | 'DemoFooter'
    | 'InputField'
    | 'PortfolioStrip'
    | 'SelectField'
    | 'TextareaField'
    | 'ThemeSwitch'
>;

/**
 * A function that takes `Props`, checked both ways, so one that takes narrower props fits too. A
 * method's parameters are checked that way where a function type's are not, which is the point.
 */
type Bivariant<Props, Result> = { method(props: Props): Result }['method'];

/**
 * The components a state is drawn with, typed by the props the sources take. The version of the
 * kit the site pins may trail the sources by a release, so one whose props are narrower, from
 * before a prop took a new value or its optional props took undefined, fits too, since either
 * direction of the parameter check will do. A state that passes what the pinned version cannot
 * draw is caught by the site's test that each state draws its attribute, not by the types.
 */
export type Kit = {
    readonly [Name in keyof Components]: Bivariant<
        Parameters<Components[Name]>[0],
        ReturnType<Components[Name]>
    >;
};

/**
 * One state: what it is called, the attribute that draws it, a class among them, and how it is
 * drawn.
 */
export interface State {
    readonly name: string;
    readonly attribute: string;
    /** The React a page writes for the state, where a component draws it. */
    readonly react?: string;
    /**
     * Draws the state. `id` turns a name into an id of this copy's own, so a page that draws a
     * state twice, once in each theme, never holds one id twice.
     */
    readonly draw: (kit: Kit, id: (name: string) => string) => ReactElement;
}

/** A control and its states, in the order a page shows them. */
export interface Control {
    readonly name: string;
    readonly states: readonly State[];
    /**
     * Each state is a picture in both themes, which the keyboard and a screen reader pass over,
     * since a live copy would give the page a second of something it holds once, such as the
     * strip's navigation or an h1.
     */
    readonly pictured?: true;
    /**
     * Its states' markup has no words beside a tag where a space would be read, so its layout may
     * put each element on a line of its own, as a page written by hand does. Without it, markup
     * breaks a line only where a space already is, so a state added later is laid out tightly
     * rather than wrongly, as the reference's blocks are.
     */
    readonly laidOut?: true;
}

export const CONTROLS: readonly Control[] = [
    {
        name: 'Buttons',
        laidOut: true,
        states: [
            {
                name: 'An action',
                attribute: 'class="dk-button"',
                react: `<Button>Filters</Button>`,
                draw: ({ Button }) => <Button>Filters</Button>,
            },
            {
                name: 'The one action a view leads with',
                attribute: 'class="dk-button dk-button-accent"',
                react: `<Button accent>Save rule</Button>`,
                draw: ({ Button }) => <Button accent>Save rule</Button>,
            },
            {
                name: 'A toggle, starting on',
                attribute: 'aria-pressed="true"',
                react: `<Button pressed>Members only</Button>`,
                draw: ({ Button }) => <Button pressed>Members only</Button>,
            },
            {
                name: 'A toggle, starting off',
                attribute: 'aria-pressed="false"',
                react: `<Button pressed={false}>Members only</Button>`,
                draw: ({ Button }) => <Button pressed={false}>Members only</Button>,
            },
            {
                name: 'A button whose panel starts open',
                attribute: 'aria-expanded="true"',
                react: `<>
    <Button aria-expanded aria-controls="filters-panel">
        Filters
    </Button>
    <div id="filters-panel" className="dk-panel">
        <p>Brand, size and color.</p>
    </div>
</>`,
                draw: ({ Button }, id) => (
                    <>
                        <Button aria-expanded aria-controls={id('filters-panel')}>
                            Filters
                        </Button>
                        <div id={id('filters-panel')} className="dk-panel">
                            <p>Brand, size and color.</p>
                        </div>
                    </>
                ),
            },
            {
                name: 'A button that is unavailable',
                attribute: 'aria-disabled="true"',
                react: `<>
    <Button off aria-describedby="previous-why">
        Previous
    </Button>
    <p id="previous-why" className="dk-field-hint">
        This is the first page.
    </p>
</>`,
                draw: ({ Button }, id) => (
                    <>
                        <Button off aria-describedby={id('previous-why')}>
                            Previous
                        </Button>
                        <p id={id('previous-why')} className="dk-field-hint">
                            This is the first page.
                        </p>
                    </>
                ),
            },
            {
                name: 'A larger target, for the one thing a page asks first',
                attribute: 'class="dk-button dk-button-large"',
                react: `<Button large>Try it with your own products</Button>`,
                draw: ({ Button }) => <Button large>Try it with your own products</Button>,
            },
            {
                name: 'A button drawn as a link, beside a block',
                attribute: 'class="dk-button dk-button-text"',
                react: `<Button text>Show the markup</Button>`,
                draw: ({ Button }) => <Button text>Show the markup</Button>,
            },
        ],
    },
    {
        name: 'Fields',
        laidOut: true,
        states: [
            {
                name: 'A field with a hint',
                attribute: 'class="dk-field-hint"',
                react: `<InputField id="email" label="Email" hint="Where the receipt goes" />`,
                draw: ({ InputField }, id) => (
                    <InputField id={id('email')} label="Email" hint="Where the receipt goes" />
                ),
            },
            {
                name: 'A field with an error',
                attribute: 'aria-invalid="true"',
                react: `<InputField
    id="email-wrong"
    label="Email"
    hint="Where the receipt goes"
    error="Enter an email address"
/>`,
                draw: ({ InputField }, id) => (
                    <InputField
                        id={id('email-wrong')}
                        label="Email"
                        hint="Where the receipt goes"
                        error="Enter an email address"
                    />
                ),
            },
            {
                name: 'A field that is unavailable',
                attribute: 'disabled',
                react: `<InputField
    id="store"
    label="Store"
    hint="Orders open again at nine tomorrow."
    disabled
    defaultValue="Closed"
/>`,
                draw: ({ InputField }, id) => (
                    <InputField
                        id={id('store')}
                        label="Store"
                        hint="Orders open again at nine tomorrow."
                        disabled
                        defaultValue="Closed"
                    />
                ),
            },
            {
                name: 'A drop-down waiting for a choice',
                attribute: 'class="dk-select"',
                react: `<SelectField id="sort" label="Sort by">
    <option value="">Choose an order</option>
    <option value="price">Price</option>
</SelectField>`,
                draw: ({ SelectField }, id) => (
                    <SelectField id={id('sort')} label="Sort by">
                        <option value="">Choose an order</option>
                        <option value="price">Price</option>
                    </SelectField>
                ),
            },
            {
                name: 'A note that grows with its text',
                attribute: 'class="dk-textarea"',
                react: `<TextareaField id="note" label="Note" hint="Shown to the picker" />`,
                draw: ({ TextareaField }, id) => (
                    <TextareaField id={id('note')} label="Note" hint="Shown to the picker" />
                ),
            },
            {
                name: 'One choice among a few',
                attribute: 'role="radiogroup"',
                react: `<ChoiceField
    id="rule"
    name="rule"
    label="What the rule does"
    hint="A rule applies to every search"
    choices={[
        { value: 'pin', label: 'Pin', hint: 'to the top of the results' },
        { value: 'hide', label: 'Hide', defaultChecked: true },
    ]}
/>`,
                draw: ({ ChoiceField }, id) => (
                    <ChoiceField
                        id={id('rule')}
                        name={id('rule')}
                        label="What the rule does"
                        hint="A rule applies to every search"
                        choices={[
                            { value: 'pin', label: 'Pin', hint: 'to the top of the results' },
                            { value: 'hide', label: 'Hide', defaultChecked: true },
                        ]}
                    />
                ),
            },
            {
                name: 'A set of choices with an error',
                attribute: 'class="dk-field dk-choice-field"',
                react: `<ChoiceField
    id="when"
    name="when"
    label="When"
    error="Choose when the rule runs"
    choices={[
        { value: 'always', label: 'Always' },
        { value: 'sale', label: 'During a sale' },
    ]}
/>`,
                draw: ({ ChoiceField }, id) => (
                    <ChoiceField
                        id={id('when')}
                        name={id('when')}
                        label="When"
                        error="Choose when the rule runs"
                        choices={[
                            { value: 'always', label: 'Always' },
                            { value: 'sale', label: 'During a sale' },
                        ]}
                    />
                ),
            },
            {
                name: 'Any number of choices, in a row',
                attribute: 'class="dk-choices dk-choices-row"',
                react: `<ChoiceField
    id="facets"
    name="facets"
    type="checkbox"
    label="Show"
    row
    choices={[
        { value: 'brand', label: 'Brand', defaultChecked: true },
        { value: 'price', label: 'Price' },
        { value: 'color', label: 'Color' },
    ]}
/>`,
                draw: ({ ChoiceField }, id) => (
                    <ChoiceField
                        id={id('facets')}
                        name={id('facets')}
                        type="checkbox"
                        label="Show"
                        row
                        choices={[
                            { value: 'brand', label: 'Brand', defaultChecked: true },
                            { value: 'price', label: 'Price' },
                            { value: 'color', label: 'Color' },
                        ]}
                    />
                ),
            },
        ],
    },
    {
        name: 'Callouts',
        laidOut: true,
        states: [
            {
                name: 'Something to know',
                attribute: 'class="dk-callout"',
                react: `<Callout title="The catalog was updated">
    <p>New products are in the results.</p>
</Callout>`,
                draw: ({ Callout }) => (
                    <Callout title="The catalog was updated">
                        <p>New products are in the results.</p>
                    </Callout>
                ),
            },
            {
                name: 'Something that went right',
                attribute: 'class="dk-callout dk-callout-success"',
                react: `<Callout tone="success" title="The rule was saved">
    <p>It applies to the next search.</p>
</Callout>`,
                draw: ({ Callout }) => (
                    <Callout tone="success" title="The rule was saved">
                        <p>It applies to the next search.</p>
                    </Callout>
                ),
            },
            {
                name: 'Something that went wrong',
                attribute: 'class="dk-callout dk-callout-danger"',
                react: `<Callout
    tone="danger"
    title="The products could not be loaded"
    actions={<Button>Try again</Button>}
>
    <p>Check the file, then load it again.</p>
</Callout>`,
                draw: ({ Button, Callout }) => (
                    <Callout
                        tone="danger"
                        title="The products could not be loaded"
                        actions={<Button>Try again</Button>}
                    >
                        <p>Check the file, then load it again.</p>
                    </Callout>
                ),
            },
            {
                name: 'Something that could go wrong',
                attribute: 'class="dk-callout dk-callout-warning"',
                react: `<Callout tone="warning" title="Three products are running low">
    <p>Each has fewer than five left.</p>
</Callout>`,
                draw: ({ Callout }) => (
                    <Callout tone="warning" title="Three products are running low">
                        <p>Each has fewer than five left.</p>
                    </Callout>
                ),
            },
        ],
    },
    {
        name: 'Theme switch',
        laidOut: true,
        states: [
            {
                name: 'The choice of theme, saved for every page',
                attribute: 'class="dk-theme-switch"',
                react: `<ThemeSwitch
    id="theme"
    name="theme"
    note="Your choice is saved for every page on jasonsdevspace.com."
/>`,
                draw: ({ ThemeSwitch }, id) => (
                    <ThemeSwitch
                        id={id('theme')}
                        name={id('theme')}
                        note="Your choice is saved for every page on jasonsdevspace.com."
                    />
                ),
            },
        ],
    },
    {
        name: 'Copy button',
        laidOut: true,
        states: [
            {
                name: 'A button that copies a block',
                attribute: 'class="dk-button dk-copy"',
                react: `<>
    <pre
        className="dk-code"
        id="install"
        role="region"
        aria-label="The install command"
        tabIndex={0}
    >
        <code>npm install @jasonsdevspace/design-kit</code>
    </pre>
    <CopyButton name="install command" />
</>`,
                draw: ({ CopyButton }, id) => (
                    <>
                        <pre
                            className="dk-code"
                            id={id('install')}
                            role="region"
                            aria-label="The install command"
                            tabIndex={0}
                        >
                            <code>npm install @jasonsdevspace/design-kit</code>
                        </pre>
                        <CopyButton name="install command" />
                    </>
                ),
            },
        ],
    },
    {
        name: 'Pills',
        laidOut: true,
        states: [
            {
                name: 'Pills that only name something',
                attribute: 'class="dk-pill"',
                react: `<ul className="dk-pills" role="list">
    <li className="dk-pill">TypeScript</li>
    <li className="dk-pill">React</li>
</ul>`,
                draw: () => (
                    <ul className="dk-pills" role="list">
                        <li className="dk-pill">TypeScript</li>
                        <li className="dk-pill">React</li>
                    </ul>
                ),
            },
            {
                name: 'Links among pages, one the current page',
                attribute: 'aria-current="page"',
                react: `<nav aria-label="Pages" id="pages">
    <ul className="dk-pills" role="list">
        <li>
            <a className="dk-pill" href="#pages" aria-current="page">
                Home
            </a>
        </li>
        <li>
            <a className="dk-pill" href="#pages">
                Tokens
            </a>
        </li>
    </ul>
</nav>`,
                draw: (_kit, id) => (
                    <nav aria-label="Pages" id={id('pages')}>
                        <ul className="dk-pills" role="list">
                            <li>
                                <a className="dk-pill" href="#pages" aria-current="page">
                                    Home
                                </a>
                            </li>
                            <li>
                                <a className="dk-pill" href="#pages">
                                    Tokens
                                </a>
                            </li>
                        </ul>
                    </nav>
                ),
            },
        ],
    },
    {
        name: 'Tabs',
        laidOut: true,
        states: [
            {
                name: 'Links in a row, the current page underlined',
                attribute: 'class="dk-tab"',
                react: `<nav aria-label="Categories" id="categories">
    <ul className="dk-tabs" role="list">
        <li>
            <a className="dk-tab" href="#categories" aria-current="page">
                All
            </a>
        </li>
        <li>
            <a className="dk-tab" href="#categories">
                Books
            </a>
        </li>
    </ul>
</nav>`,
                draw: (_kit, id) => (
                    <nav aria-label="Categories" id={id('categories')}>
                        <ul className="dk-tabs" role="list">
                            <li>
                                <a className="dk-tab" href="#categories" aria-current="page">
                                    All
                                </a>
                            </li>
                            <li>
                                <a className="dk-tab" href="#categories">
                                    Books
                                </a>
                            </li>
                        </ul>
                    </nav>
                ),
            },
            {
                name: 'Toggles in a row, one on',
                attribute: 'aria-pressed="true"',
                react: `<div className="dk-tabs">
    <button type="button" className="dk-tab" aria-pressed="true">
        Open
    </button>
    <button type="button" className="dk-tab" aria-pressed="false">
        Closed
    </button>
</div>`,
                draw: () => (
                    <div className="dk-tabs">
                        <button type="button" className="dk-tab" aria-pressed="true">
                            Open
                        </button>
                        <button type="button" className="dk-tab" aria-pressed="false">
                            Closed
                        </button>
                    </div>
                ),
            },
        ],
    },
    {
        name: 'Eyebrows',
        laidOut: true,
        states: [
            {
                name: 'A caps label over a heading',
                attribute: 'class="dk-eyebrow"',
                react: `<>
    <p className="dk-eyebrow">Signed in as a guest</p>
    <h4>Your basket</h4>
</>`,
                draw: () => (
                    <>
                        <p className="dk-eyebrow">Signed in as a guest</p>
                        <h4>Your basket</h4>
                    </>
                ),
            },
        ],
    },
];
