import type { ReactElement } from 'react';

import type * as React from '../src/react.js';

/*
 * Each state of each control, named, with the attribute that draws it, for a page that shows them
 * one by one. The components are passed in rather than imported, so the site draws them from the
 * version of the kit it pins while the kit's own tests draw them from the sources, and this module
 * imports nothing from the kit but its types.
 */

/** The components a state is drawn with. */
export type Kit = Pick<typeof React, 'Button' | 'Callout' | 'InputField' | 'SelectField'>;

/** One state: what it is called, the attribute or class that draws it, and how it is drawn. */
export interface State {
    readonly name: string;
    readonly attribute: string;
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
}

export const CONTROLS: readonly Control[] = [
    {
        name: 'Buttons',
        states: [
            {
                name: 'An action',
                attribute: 'class="dk-button"',
                draw: ({ Button }) => <Button>Filters</Button>,
            },
            {
                name: 'The one action a view leads with',
                attribute: 'class="dk-button dk-button-accent"',
                draw: ({ Button }) => <Button accent>Save rule</Button>,
            },
            {
                name: 'A toggle that is on',
                attribute: 'aria-pressed="true"',
                draw: ({ Button }) => <Button pressed>Members only</Button>,
            },
            {
                name: 'A toggle that is off',
                attribute: 'aria-pressed="false"',
                draw: ({ Button }) => <Button pressed={false}>Members only</Button>,
            },
            {
                name: 'A button whose panel is open',
                attribute: 'aria-expanded="true"',
                draw: ({ Button }) => <Button aria-expanded>Filters</Button>,
            },
            {
                name: 'A button that is off',
                attribute: 'aria-disabled="true"',
                draw: ({ Button }) => <Button off>Previous</Button>,
            },
        ],
    },
    {
        name: 'Fields',
        states: [
            {
                name: 'A field with a hint',
                attribute: 'aria-describedby',
                draw: ({ InputField }, id) => (
                    <InputField id={id('email')} label="Email" hint="Where the receipt goes" />
                ),
            },
            {
                name: 'A field with an error',
                attribute: 'aria-invalid="true"',
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
                name: 'A field that is off',
                attribute: 'disabled',
                draw: ({ InputField }, id) => (
                    <InputField id={id('store')} label="Store" disabled defaultValue="Closed" />
                ),
            },
            {
                name: 'A select',
                attribute: 'class="dk-select"',
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
        states: [
            {
                name: 'News',
                attribute: 'class="dk-callout"',
                draw: ({ Callout }) => (
                    <Callout title="The catalog was updated">
                        <p>New products are in the results.</p>
                    </Callout>
                ),
            },
            {
                name: 'Something that went right',
                attribute: 'class="dk-callout dk-callout-success"',
                draw: ({ Callout }) => (
                    <Callout tone="success" title="The rule was saved">
                        <p>It applies to the next search.</p>
                    </Callout>
                ),
            },
            {
                name: 'Something that went wrong',
                attribute: 'class="dk-callout dk-callout-danger"',
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
