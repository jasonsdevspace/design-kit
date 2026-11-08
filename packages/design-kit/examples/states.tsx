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
    'Button' | 'Callout' | 'DemoFooter' | 'InputField' | 'PortfolioStrip' | 'SelectField'
>;

/** Props as a state passes them, with no optional prop set to undefined. */
type Given<Props> = { [Name in keyof Props]: Exclude<Props[Name], undefined> };

/**
 * The components a state is drawn with, typed by the props the states pass. The sources take
 * those, and so does the version of the kit the site pins, even one from before its optional props
 * took undefined, so the site can draw the states from it.
 */
export type Kit = {
    readonly [Name in keyof Components]: (
        props: Given<Parameters<Components[Name]>[0]>
    ) => ReturnType<Components[Name]>;
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
     * rather than wrongly, as the README's blocks are.
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
                react: `<Button off>Previous</Button>`,
                draw: ({ Button }) => <Button off>Previous</Button>,
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
                react: `<InputField id="store" label="Store" disabled defaultValue="Closed" />`,
                draw: ({ InputField }, id) => (
                    <InputField id={id('store')} label="Store" disabled defaultValue="Closed" />
                ),
            },
            {
                name: 'A select waiting for a choice',
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
        ],
    },
    {
        name: 'Callouts',
        laidOut: true,
        states: [
            {
                name: 'News',
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
        ],
    },
];
