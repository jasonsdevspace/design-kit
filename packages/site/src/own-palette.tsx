import type { Control } from '../../design-kit/examples/states.js';

/*
 * The pieces the own palette page draws in its palette, with the markup and React each takes,
 * which are the same as on any other page, since a page's palette changes its sheet and never its
 * markup.
 */
export const OWN_PIECES = {
    name: 'In this palette',
    laidOut: true,
    states: [
        {
            name: 'The one action, a toggle that is on and an action',
            attribute: 'class="dk-button dk-button-accent"',
            react: `<div className="dk-actions">
    <Button accent>Save rule</Button>
    <Button pressed>Members only</Button>
    <Button>Filters</Button>
</div>`,
            draw: ({ Button }) => (
                <div className="dk-actions">
                    <Button accent>Save rule</Button>
                    <Button pressed>Members only</Button>
                    <Button>Filters</Button>
                </div>
            ),
        },
        {
            name: 'A field with an error, and something that went right',
            attribute: 'aria-invalid="true"',
            react: `<>
    <InputField
        id="alert-email"
        label="Email for alerts"
        hint="Where the alert is sent"
        error="Enter an email address."
    />
    <Callout tone="success" title="The rule was saved">
        <p>It applies to the next search.</p>
    </Callout>
</>`,
            draw: ({ Callout, InputField }, id) => (
                <>
                    <InputField
                        id={id('alert-email')}
                        label="Email for alerts"
                        hint="Where the alert is sent"
                        error="Enter an email address."
                    />
                    <Callout tone="success" title="The rule was saved">
                        <p>It applies to the next search.</p>
                    </Callout>
                </>
            ),
        },
    ],
} as const satisfies Control;
