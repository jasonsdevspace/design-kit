import { createRef, type Ref } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
    Button,
    Callout,
    ChoiceField,
    CopyButton,
    CopyStatus,
    DemoFooter,
    GITHUB_PROFILE_URL,
    InputField,
    PORTFOLIO_URL,
    PortfolioStrip,
    SelectField,
    SkipLink,
    TextareaField,
    ThemeSwitch,
} from './react.js';

/*
 * The markup each component draws, which is the contract a page without React writes by hand and
 * components.css styles. Rendered to a string, with no browser, which is enough to hold the
 * elements, their classes, the landmarks, the links and the attributes that carry a control's
 * state. How a browser lays them out is held by e2e/chrome.spec.tsx and e2e/controls.spec.tsx.
 */

const SOURCE = 'https://github.com/jasonsdevspace/example';

describe('the skip link', () => {
    it('leads to the main content by default, and to the target given', () => {
        expect(renderToStaticMarkup(<SkipLink />)).toBe(
            '<a class="dk-skip" href="#main-content">Skip to content</a>'
        );
        expect(renderToStaticMarkup(<SkipLink target="results">Skip to results</SkipLink>)).toBe(
            '<a class="dk-skip" href="#results">Skip to results</a>'
        );
    });
});

describe('the strip', () => {
    const strip = (props: Partial<Parameters<typeof PortfolioStrip>[0]> = {}) =>
        renderToStaticMarkup(<PortfolioStrip about="./about/" source={SOURCE} {...props} />);

    it("links the author's portfolio by name, how it works and where the source is, in that order", () => {
        expect(strip()).toBe(
            '<div class="dk-strip"><nav class="dk-strip-links" aria-label="Portfolio">' +
                `<a href="${PORTFOLIO_URL}">Jason Poteet</a>` +
                '<a href="./about/">How it works</a>' +
                `<a href="${SOURCE}">Source on GitHub</a>` +
                '</nav></div>'
        );
    });

    it('marks the explainer as the current page when the strip sits on it', () => {
        expect(strip({ current: 'about' })).toContain(
            '<a href="./about/" aria-current="page">How it works</a>'
        );
    });

    it("holds the demo's own switches in a landmark named by the demo, only when there are some", () => {
        expect(strip()).not.toContain('dk-strip-tools');
        expect(strip({ tools: <button type="button">Tour</button>, toolsLabel: 'Tour' })).toContain(
            '<section class="dk-strip-tools" aria-label="Tour"><button type="button">Tour</button></section>'
        );
        expect(strip({ tools: <span />, toolsLabel: 'Store' })).toContain('aria-label="Store"');
        // As a demo writes `hasTour && <Tour />`, which leaves false or null when there is none.
        for (const nothing of [null, false])
            expect(strip({ tools: nothing, toolsLabel: 'Tour' })).not.toContain('dk-strip-tools');
        // @ts-expect-error Switches need the name their landmark is read by.
        const unnamed = <PortfolioStrip about="./about/" source={SOURCE} tools={<span />} />;
        expect(renderToStaticMarkup(unnamed)).toBeTruthy();
    });

    it('keeps the room of switches on their way, with no landmark and no text until they come', () => {
        expect(strip({ toolsWaiting: true })).toContain(
            '</nav><section class="dk-strip-tools"><span class="dk-strip-room"></span></section></div>'
        );
        // Unnamed, the section is no landmark until the switches come and it takes its name.
        expect(strip({ toolsWaiting: true })).not.toContain('aria-label="Demo"');
        expect(strip({ toolsWaiting: false })).not.toContain('dk-strip-tools');
        // The switches that arrive take the room's place.
        expect(
            strip({
                toolsWaiting: true,
                tools: <button type="button">Tour</button>,
                toolsLabel: 'Tour',
            })
        ).not.toContain('dk-strip-room');
    });
});

describe('the footer', () => {
    it('marks the explainer as the current page when the footer sits on it, as the strip does', () => {
        expect(
            renderToStaticMarkup(
                <DemoFooter name="Example" about="./" source={SOURCE} current="about" />
            )
        ).toContain('<a href="./" aria-current="page">How it works</a>');
        expect(
            renderToStaticMarkup(<DemoFooter name="Example" about="./" source={SOURCE} />)
        ).not.toContain('aria-current');
    });

    it('names the project and its author, and links the explainer, the source, the work and the license', () => {
        const footer = renderToStaticMarkup(
            <DemoFooter name="Example" about="./about/" source={SOURCE} />
        );
        expect(footer.startsWith('<footer class="dk-footer"><p>')).toBe(true);
        expect(footer).toContain(
            `Example is a portfolio project by <a href="${PORTFOLIO_URL}">Jason Poteet</a>,`
        );
        expect(footer).toBe(
            '<footer class="dk-footer"><p>' +
                `Example is a portfolio project by <a href="${PORTFOLIO_URL}">Jason Poteet</a>, ` +
                `who has <a href="${GITHUB_PROFILE_URL}">more work</a> on GitHub. ` +
                '<a href="./about/">How it works</a> is explained in plain words. ' +
                `The <a href="${SOURCE}">source</a> is on GitHub under the ` +
                `<a href="${SOURCE}/blob/main/LICENSE">MIT license</a>.</p></footer>`
        );
        const hrefs = [...footer.matchAll(/href="([^"]+)"/g)].map(([, href]) => href);
        expect(hrefs).toEqual([
            PORTFOLIO_URL,
            GITHUB_PROFILE_URL,
            './about/',
            SOURCE,
            `${SOURCE}/blob/main/LICENSE`,
        ]);
    });

    it('names the license a demo gives, and builds the default link without a doubled slash', () => {
        const footer = renderToStaticMarkup(
            <DemoFooter
                name="Example"
                about="./about/"
                source={`${SOURCE}/`}
                licenseName="Apache License 2.0"
            />
        );
        expect(footer).toContain(
            `<a href="${SOURCE}/blob/main/LICENSE">Apache License 2.0</a>.</p>`
        );
    });

    it('ends with what a demo adds of its own, and with nothing when it adds nothing', () => {
        for (const nothing of [null, false]) {
            expect(
                renderToStaticMarkup(
                    <DemoFooter name="Example" about="./about/" source={SOURCE}>
                        {nothing}
                    </DemoFooter>
                )
            ).toMatch(/MIT license<\/a>\.<\/p><\/footer>$/);
        }
        const footer = renderToStaticMarkup(
            <DemoFooter name="Example" about="./about/" source={SOURCE}>
                You can also <a href="./try/">search your own products</a> with it.
            </DemoFooter>
        );
        expect(footer).toMatch(
            /MIT license<\/a>\. You can also <a href="\.\/try\/">search your own products<\/a> with it\.<\/p><\/footer>$/
        );
    });

    it("draws a demo's own line after the footer's text, and nothing for an aside that holds nothing", () => {
        const footer = renderToStaticMarkup(
            <DemoFooter name="Example" about="./about/" source={SOURCE} aside="Built at abc1234.">
                More.
            </DemoFooter>
        );
        expect(footer).toMatch(
            /MIT license<\/a>\. More\.<\/p><p class="dk-footer-aside">Built at abc1234\.<\/p><\/footer>$/
        );
        for (const nothing of [undefined, null, false, '']) {
            expect(
                renderToStaticMarkup(
                    <DemoFooter name="Example" about="./about/" source={SOURCE} aside={nothing} />
                )
            ).toBe(
                renderToStaticMarkup(<DemoFooter name="Example" about="./about/" source={SOURCE} />)
            );
        }
    });
});

describe('the chrome', () => {
    it('opens no link in a new tab', () => {
        const chrome = renderToStaticMarkup(
            <>
                <SkipLink />
                <PortfolioStrip
                    about="./about/"
                    source={SOURCE}
                    tools={<button type="button">Tour</button>}
                    toolsLabel="Tour"
                />
                <DemoFooter name="Example" about="./about/" source={SOURCE} />
            </>
        );
        expect(chrome).not.toContain('target=');
    });
});

describe('the button', () => {
    it('is a plain button unless a page says otherwise, never a form submit by default', () => {
        expect(renderToStaticMarkup(<Button>Filters</Button>)).toBe(
            '<button type="button" class="dk-button">Filters</button>'
        );
        expect(renderToStaticMarkup(<Button type="submit">Save</Button>)).toContain(
            'type="submit"'
        );
    });

    it('marks the one action a view leads with by a class, and keeps a page class after it', () => {
        expect(
            renderToStaticMarkup(
                <Button accent className="wide">
                    Save rule
                </Button>
            )
        ).toBe('<button type="button" class="dk-button dk-button-accent wide">Save rule</button>');
    });

    it('draws a large button and a text button by a class each', () => {
        expect(renderToStaticMarkup(<Button large>Try it</Button>)).toBe(
            '<button type="button" class="dk-button dk-button-large">Try it</button>'
        );
        expect(renderToStaticMarkup(<Button text>Show the markup</Button>)).toBe(
            '<button type="button" class="dk-button dk-button-text">Show the markup</button>'
        );
        expect(
            renderToStaticMarkup(
                <Button large accent className="wide">
                    Open
                </Button>
            )
        ).toContain('class="dk-button dk-button-accent dk-button-large wide"');
        for (const nothing of [false, undefined] as const) {
            expect(
                renderToStaticMarkup(
                    <Button large={nothing} text={nothing}>
                        Go
                    </Button>
                )
            ).toBe(renderToStaticMarkup(<Button>Go</Button>));
        }
    });

    it('says a toggle is a toggle whether it is pressed or not, and leaves an action alone', () => {
        expect(renderToStaticMarkup(<Button pressed>Member</Button>)).toContain(
            'aria-pressed="true"'
        );
        expect(renderToStaticMarkup(<Button pressed={false}>Member</Button>)).toContain(
            'aria-pressed="false"'
        );
        expect(renderToStaticMarkup(<Button>Member</Button>)).not.toContain('aria-pressed');
    });

    it('stays in the tab order when off, rather than dropping focus as disabled does', () => {
        const off = renderToStaticMarkup(<Button off>Previous</Button>);
        expect(off).toBe(
            '<button type="button" class="dk-button" aria-disabled="true">Previous</button>'
        );
        expect(renderToStaticMarkup(<Button off={false}>Previous</Button>)).not.toContain(
            'aria-disabled'
        );
    });

    it("calls nothing when pressed while off, and stops a form's submit", () => {
        const calls: string[] = [];
        const press = (off: boolean) => {
            const drawn = Button({ off, onClick: () => calls.push('pressed'), children: 'Go' });
            const props = drawn.props as {
                onClick?: (event: { preventDefault: () => void }) => void;
            };
            props.onClick?.({ preventDefault: () => calls.push('prevented') });
        };
        press(true);
        expect(calls).toEqual(['prevented']);
        press(false);
        expect(calls).toEqual(['prevented', 'pressed']);
    });

    it('hands a ref to the button it draws, for a page that moves focus to it', () => {
        const ref = createRef<HTMLButtonElement>();
        const button = Button({ ref, children: 'Tour' });
        expect(button.type).toBe('button');
        expect((button.props as { ref?: unknown }).ref).toBe(ref);
        // A page that hands on a ref it may not have been given, as a wrapper does, compiles too.
        const Opener = ({ ref: handed }: { readonly ref?: Ref<HTMLButtonElement> | undefined }) => (
            <Button ref={handed}>Tour</Button>
        );
        expect(renderToStaticMarkup(<Opener />)).toContain('>Tour</button>');
    });

    it('takes neither a style nor accent and pressed together', () => {
        // @ts-expect-error The kit draws markup alone, so a page styles a button by its classes.
        expect(renderToStaticMarkup(<Button style={{ color: 'red' }}>Go</Button>)).toBeTruthy();
        // @ts-expect-error The one action a view leads with is not a switch.
        const both = <Button accent pressed children="Go" />;
        expect(renderToStaticMarkup(both)).toBeTruthy();
        // @ts-expect-error The one action a view leads with is not drawn as a link.
        const linked = <Button accent text children="Go" />;
        expect(renderToStaticMarkup(linked)).toBeTruthy();
        // @ts-expect-error A text button is not a toggle.
        const toggled = <Button text pressed children="Go" />;
        expect(renderToStaticMarkup(toggled)).toBeTruthy();
        // @ts-expect-error A text button is not large.
        const grown = <Button text large children="Go" />;
        expect(renderToStaticMarkup(grown)).toBeTruthy();
    });
});

describe('a field', () => {
    it('takes a ref typed as the control it draws, and refuses one of another element', () => {
        // Only a browser attaches a ref, so ref.spec.ts finds focus on the control through it.
        const name = createRef<HTMLInputElement>();
        const size = createRef<HTMLSelectElement>();
        expect(renderToStaticMarkup(<InputField id="name" label="Name" ref={name} />)).toContain(
            '<input class="dk-input" id="name"/>'
        );
        const select = (
            <SelectField id="size" label="Size" ref={size}>
                <option>Small</option>
            </SelectField>
        );
        expect(renderToStaticMarkup(select)).toContain('<select class="dk-select" id="size">');
        // @ts-expect-error An input field's ref is the input drawn, not the select of another.
        expect(renderToStaticMarkup(<InputField label="Name" ref={size} />)).toBeTruthy();
        // @ts-expect-error A select field's ref is the select drawn, not the input of another.
        expect(renderToStaticMarkup(<SelectField label="Size" ref={name} />)).toBeTruthy();
        // A page that hands on a ref it may not have been given, as a wrapper does, compiles too.
        const NameField = ({ ref }: { readonly ref?: Ref<HTMLInputElement> | undefined }) => (
            <InputField label="Name" ref={ref} />
        );
        expect(renderToStaticMarkup(<NameField />)).toContain('<input class="dk-input"');
    });

    it('ties a label to the control, and draws nothing it was not given', () => {
        expect(renderToStaticMarkup(<InputField id="email" label="Email" />)).toBe(
            '<div class="dk-field"><label class="dk-field-label" for="email">Email</label>' +
                '<input class="dk-input" id="email"/></div>'
        );
    });

    it('describes the control by its hint, then its error, and marks it invalid only with one', () => {
        const hinted = renderToStaticMarkup(
            <InputField id="email" label="Email" hint="Where the receipt goes" />
        );
        expect(hinted).toBe(
            '<div class="dk-field"><label class="dk-field-label" for="email">Email</label>' +
                '<p class="dk-field-hint" id="email-hint">Where the receipt goes</p>' +
                '<input class="dk-input" id="email" aria-describedby="email-hint"/></div>'
        );
        const wrong = renderToStaticMarkup(
            <InputField
                id="email"
                label="Email"
                hint="Where the receipt goes"
                error="Enter an email"
            />
        );
        expect(wrong).toBe(
            '<div class="dk-field"><label class="dk-field-label" for="email">Email</label>' +
                '<p class="dk-field-hint" id="email-hint">Where the receipt goes</p>' +
                '<p class="dk-field-error" id="email-error">' +
                '<span class="dk-visually-hidden">Error: </span>Enter an email</p>' +
                '<input class="dk-input" id="email" aria-describedby="email-hint email-error"' +
                ' aria-invalid="true"/></div>'
        );
    });

    it("keeps a page's own description after the field's, and draws an empty slot as none", () => {
        for (const nothing of [null, false, '']) {
            const drawn = renderToStaticMarkup(
                <InputField
                    id="email"
                    label="Email"
                    hint={nothing}
                    error={nothing}
                    aria-describedby="moved"
                />
            );
            expect(drawn).toContain('aria-describedby="moved"');
            expect(drawn).not.toContain('aria-invalid');
            expect(drawn).not.toContain('dk-field-hint');
        }
        expect(
            renderToStaticMarkup(
                <InputField
                    id="email"
                    label="Email"
                    error="Enter an email"
                    aria-describedby="moved"
                />
            )
        ).toContain('aria-describedby="email-error moved"');
    });

    it('announces nothing itself, since the page says when an error appears', () => {
        const wrong = renderToStaticMarkup(
            <InputField id="e" label="Email" error="Enter an email" />
        );
        expect(wrong).not.toMatch(/role=|aria-live/);
    });

    it('gives each field on a page an id of its own when the page gives none', () => {
        const page = renderToStaticMarkup(
            <>
                <InputField label="First" hint="One" />
                <InputField label="Second" hint="Two" />
            </>
        );
        const ids = [...page.matchAll(/<input class="dk-input" id="([^"]+)"/g)].map(([, id]) => id);
        expect(ids).toHaveLength(2);
        expect(new Set(ids).size).toBe(2);
        for (const id of ids) {
            expect(page).toContain(`for="${String(id)}"`);
            expect(page).toContain(`aria-describedby="${String(id)}-hint"`);
        }
    });

    it('makes an id of its own when the page gives an empty one', () => {
        const drawn = renderToStaticMarkup(
            <InputField id="" label="Email" hint="For the receipt" />
        );
        expect(drawn).not.toMatch(/id=""|for=""|"-hint"/);
    });

    it("passes the control's own attributes through", () => {
        expect(
            renderToStaticMarkup(<InputField id="q" label="Search" type="search" required />)
        ).toContain('<input class="dk-input" type="search" required="" id="q"/>');
    });

    it('draws a textarea with its text as a value, wired the same way', () => {
        expect(
            renderToStaticMarkup(
                <TextareaField
                    id="note"
                    label="Note"
                    hint="Shown to the picker"
                    error="Write a note"
                    defaultValue="On its way"
                    rows={3}
                />
            )
        ).toBe(
            '<div class="dk-field"><label class="dk-field-label" for="note">Note</label>' +
                '<p class="dk-field-hint" id="note-hint">Shown to the picker</p>' +
                '<p class="dk-field-error" id="note-error">' +
                '<span class="dk-visually-hidden">Error: </span>Write a note</p>' +
                '<textarea class="dk-textarea" rows="3" id="note"' +
                ' aria-describedby="note-hint note-error" aria-invalid="true">On its way</textarea></div>'
        );
        const note = createRef<HTMLTextAreaElement>();
        expect(renderToStaticMarkup(<TextareaField id="n" label="Note" ref={note} />)).toContain(
            '<textarea class="dk-textarea" rows="3" id="n"></textarea>'
        );
        const wrong = createRef<HTMLInputElement>();
        // @ts-expect-error A textarea field's ref is the textarea drawn, not the input of another.
        expect(renderToStaticMarkup(<TextareaField label="Note" ref={wrong} />)).toBeTruthy();
    });

    it('draws a native select with its options, wired the same way', () => {
        expect(
            renderToStaticMarkup(
                <SelectField id="sort" label="Sort by" error="Pick one">
                    <option value="">Choose an order</option>
                    <option value="price">Price</option>
                </SelectField>
            )
        ).toBe(
            '<div class="dk-field"><label class="dk-field-label" for="sort">Sort by</label>' +
                '<p class="dk-field-error" id="sort-error">' +
                '<span class="dk-visually-hidden">Error: </span>Pick one</p>' +
                '<select class="dk-select" id="sort" aria-describedby="sort-error"' +
                ' aria-invalid="true"><option value="">Choose an order</option>' +
                '<option value="price">Price</option></select></div>'
        );
    });
});

describe('a choice field', () => {
    const CHOICES = [
        { value: 'pin', label: 'Pin' },
        { value: 'hide', label: 'Hide' },
    ] as const;
    const rule = (props: Partial<Parameters<typeof ChoiceField>[0]> = {}) =>
        renderToStaticMarkup(
            <ChoiceField id="rule" name="rule" label="Rule" choices={CHOICES} {...props} />
        );

    it('draws a fieldset with its label as the legend, and a label of a radio and its word for each choice', () => {
        expect(rule()).toBe(
            '<fieldset class="dk-field dk-choice-field" id="rule" role="radiogroup">' +
                '<legend class="dk-field-label">Rule</legend><div class="dk-choices">' +
                '<label class="dk-choice"><input type="radio" name="rule" value="pin"/><span>Pin</span></label>' +
                '<label class="dk-choice"><input type="radio" name="rule" value="hide"/><span>Hide</span></label>' +
                '</div></fieldset>'
        );
    });

    it('describes the set by its hint, then its error, and marks a radio group invalid only with one', () => {
        expect(rule({ hint: 'Applies to every search' })).toContain(
            '<fieldset class="dk-field dk-choice-field" id="rule" role="radiogroup" aria-describedby="rule-hint">' +
                '<legend class="dk-field-label">Rule</legend>' +
                '<p class="dk-field-hint" id="rule-hint">Applies to every search</p>'
        );
        const wrong = rule({ hint: 'Applies to every search', error: 'Choose one' });
        expect(wrong).toContain(
            'role="radiogroup" aria-describedby="rule-hint rule-error" aria-invalid="true">'
        );
        expect(wrong).toContain(
            '<p class="dk-field-error" id="rule-error">' +
                '<span class="dk-visually-hidden">Error: </span>Choose one</p>'
        );
        expect(wrong).toContain('<input type="radio" name="rule" value="pin"/>');
        expect(wrong).toContain('<input type="radio" name="rule" value="hide"/>');
        expect(rule()).not.toContain('aria-invalid');
        expect(rule({ error: 'Choose one', 'aria-describedby': 'moved' })).toContain(
            'aria-describedby="rule-error moved"'
        );
    });

    it('draws checkboxes in a row where the field asks, with a gloss after a word, each marked by an error', () => {
        const boxes = rule({
            type: 'checkbox',
            row: true,
            choices: [{ value: 'brand', label: 'Brand', hint: 'the maker', defaultChecked: true }],
        });
        expect(boxes).toContain('<fieldset class="dk-field dk-choice-field" id="rule">');
        expect(boxes).toContain(
            '<div class="dk-choices dk-choices-row"><label class="dk-choice">' +
                '<input type="checkbox" name="rule" checked="" value="brand"/>' +
                '<span>Brand<span class="dk-choice-hint"> the maker</span></span></label></div>'
        );
        const wrong = rule({ type: 'checkbox', error: 'Choose one', choices: CHOICES });
        expect(wrong).not.toContain('role=');
        expect(wrong).toContain('id="rule" aria-describedby="rule-error">');
        expect(wrong).toContain(
            '<input type="checkbox" aria-invalid="true" name="rule" value="pin"/>'
        );
        expect(wrong).toContain(
            '<input type="checkbox" aria-invalid="true" name="rule" value="hide"/>'
        );
    });

    it("passes a choice's own props to its control, and the fieldset's to the fieldset, refs included", () => {
        // Only a browser attaches a ref, so ref.spec.ts finds the fieldset and a control through them.
        const control = createRef<HTMLInputElement>();
        const set = createRef<HTMLFieldSetElement>();
        const drawn = renderToStaticMarkup(
            <ChoiceField
                ref={set}
                label="Rule"
                name="rule"
                className="wide"
                choices={[{ value: 'pin', label: 'Pin', ref: control, disabled: true }]}
            />
        );
        expect(drawn).toContain('<fieldset class="dk-field dk-choice-field wide" id="');
        expect(drawn).toContain('<input type="radio" disabled="" name="rule" value="pin"/>');
        // @ts-expect-error A choice field's ref is the fieldset drawn, not a control.
        expect(rule({ ref: control })).toBeTruthy();
    });

    it('takes neither a style nor a value for aria-invalid of its own', () => {
        // @ts-expect-error The kit draws markup alone, so a page styles a field by its classes.
        expect(rule({ style: { color: 'red' } })).toBeTruthy();
        // @ts-expect-error The set is marked invalid by the error alone.
        expect(rule({ 'aria-invalid': true })).toBeTruthy();
    });
});

describe('a callout', () => {
    it('draws the info tone by default, with no role, so nothing reads it out of turn', () => {
        expect(renderToStaticMarkup(<Callout>Your edited rules are in effect.</Callout>)).toBe(
            '<div class="dk-callout"><div class="dk-callout-body">Your edited rules are in effect.' +
                '</div></div>'
        );
    });

    it('says its tone in words a screen reader reads, as well as in color', () => {
        expect(renderToStaticMarkup(<Callout tone="success">Saved.</Callout>)).toBe(
            '<div class="dk-callout dk-callout-success"><div class="dk-callout-body">' +
                '<span class="dk-visually-hidden">Success: </span>Saved.</div></div>'
        );
        expect(renderToStaticMarkup(<Callout tone="danger">Not loaded.</Callout>)).toContain(
            '<span class="dk-visually-hidden">Error: </span>Not loaded.'
        );
        expect(renderToStaticMarkup(<Callout tone="warning">Two left.</Callout>)).toBe(
            '<div class="dk-callout dk-callout-warning"><div class="dk-callout-body">' +
                '<span class="dk-visually-hidden">Warning: </span>Two left.</div></div>'
        );
        expect(
            renderToStaticMarkup(
                <Callout tone="danger" prefix="Warning: ">
                    This removes every product.
                </Callout>
            )
        ).toContain('<span class="dk-visually-hidden">Warning: </span>This removes');
        expect(
            renderToStaticMarkup(
                <Callout tone="danger" prefix="">
                    Not loaded.
                </Callout>
            )
        ).not.toContain('dk-visually-hidden');
    });

    it('takes a role only when the page asks for one, whatever its tone', () => {
        for (const tone of ['info', 'success', 'warning', 'danger'] as const) {
            expect(renderToStaticMarkup(<Callout tone={tone}>Text</Callout>)).not.toMatch(
                /role=|aria-live/
            );
            for (const live of ['status', 'alert'] as const) {
                expect(
                    renderToStaticMarkup(
                        <Callout tone={tone} live={live}>
                            Text
                        </Callout>
                    )
                ).toContain(`<div class="dk-callout-body" role="${live}">`);
            }
        }
    });

    it('draws a live message empty, so the page can fill it once it is on the page', () => {
        for (const nothing of [null, false, undefined]) {
            expect(renderToStaticMarkup(<Callout live="status">{nothing}</Callout>)).toBe(
                '<div class="dk-callout"><div class="dk-callout-body" role="status"></div></div>'
            );
        }
        expect(renderToStaticMarkup(<Callout tone="danger" live="alert" />)).toBe(
            '<div class="dk-callout dk-callout-danger">' +
                '<div class="dk-callout-body" role="alert"></div></div>'
        );
    });

    it('puts its title before the message, as a heading at the level the page gives', () => {
        expect(
            renderToStaticMarkup(
                <Callout tone="danger" title="The products could not be loaded">
                    Check the file.
                </Callout>
            )
        ).toBe(
            '<div class="dk-callout dk-callout-danger"><div class="dk-callout-body">' +
                '<p class="dk-callout-title">' +
                '<span class="dk-visually-hidden">Error: </span>The products could not be loaded' +
                '</p>Check the file.</div></div>'
        );
        expect(
            renderToStaticMarkup(
                <Callout title="Store closed" headingLevel={2}>
                    Back soon.
                </Callout>
            )
        ).toContain('<h2 class="dk-callout-title">Store closed</h2>');
        // A page in plain JavaScript can pass a level the types refuse, and gets a paragraph.
        const level = 1 as unknown as 2;
        expect(
            renderToStaticMarkup(
                <Callout title="Store closed" headingLevel={level}>
                    Back soon.
                </Callout>
            )
        ).toContain('<p class="dk-callout-title">Store closed</p>');
    });

    it('reads its title and its tone word with a live message, since both are in it', () => {
        expect(
            renderToStaticMarkup(
                <Callout tone="danger" live="alert" title="Not loaded">
                    Check the file.
                </Callout>
            )
        ).toBe(
            '<div class="dk-callout dk-callout-danger"><div class="dk-callout-body" role="alert">' +
                '<p class="dk-callout-title"><span class="dk-visually-hidden">Error: </span>' +
                'Not loaded</p>Check the file.</div></div>'
        );
    });

    it('keeps its actions outside the message, so a live message reads only its words', () => {
        expect(
            renderToStaticMarkup(
                <Callout tone="danger" live="alert" actions={<Button>Try again</Button>}>
                    Not loaded.
                </Callout>
            )
        ).toBe(
            '<div class="dk-callout dk-callout-danger"><div class="dk-callout-body" role="alert">' +
                '<span class="dk-visually-hidden">Error: </span>Not loaded.</div>' +
                '<div class="dk-callout-actions">' +
                '<button type="button" class="dk-button">Try again</button></div></div>'
        );
    });
});

describe('the switch, the copy button and the status line', () => {
    it("take a ref and a class of the page after the kit's, with nothing in the markup moved", () => {
        const group = createRef<HTMLDivElement>();
        const drawn = renderToStaticMarkup(<ThemeSwitch id="theme" ref={group} className="site" />);
        expect(drawn).toContain(
            '<div class="dk-theme-switch site" role="radiogroup" aria-labelledby="theme-name"' +
                ' aria-describedby="theme-note" hidden="">'
        );
        expect(renderToStaticMarkup(<ThemeSwitch id="theme" />)).toContain(
            '<div class="dk-theme-switch" role="radiogroup"'
        );
        const button = createRef<HTMLButtonElement>();
        expect(
            renderToStaticMarkup(<CopyButton name="email address" ref={button} className="wide" />)
        ).toContain('<button type="button" class="dk-button dk-copy wide" hidden="">');
        const line = createRef<HTMLParagraphElement>();
        expect(renderToStaticMarkup(<CopyStatus ref={line} className="site" />)).toBe(
            '<p class="dk-visually-hidden site" role="status"></p>'
        );
        expect(renderToStaticMarkup(<CopyStatus />)).toBe(
            '<p class="dk-visually-hidden" role="status"></p>'
        );
    });

    it('draws a line after the switch for a visitor without script, worded by the page or turned off', () => {
        expect(renderToStaticMarkup(<ThemeSwitch id="theme" />)).toMatch(
            /<\/div><noscript><p class="dk-theme-switch-noscript">With scripts on, a Theme switch sits here\.<\/p><\/noscript>$/
        );
        expect(
            renderToStaticMarkup(
                <ThemeSwitch id="theme" noscript="Turn scripts on for a theme switch." />
            )
        ).toContain('<p class="dk-theme-switch-noscript">Turn scripts on for a theme switch.</p>');
        for (const nothing of [false, null, '']) {
            expect(
                renderToStaticMarkup(<ThemeSwitch id="theme" noscript={nothing} />)
            ).not.toContain('noscript');
        }
    });
});

describe('a page that hands on what it may not have been given', () => {
    /** A value a wrapper passes on as it got it, which may be undefined. */
    const maybe = <T,>(value?: T): T | undefined => value;

    it('compiles, and draws each component as if the prop were left out', () => {
        expect(renderToStaticMarkup(<SkipLink target={maybe<string>()} />)).toBe(
            renderToStaticMarkup(<SkipLink />)
        );
        expect(
            renderToStaticMarkup(
                <PortfolioStrip
                    about="./about/"
                    source={SOURCE}
                    current={maybe<'about'>()}
                    toolsWaiting={maybe<boolean>()}
                />
            )
        ).toBe(renderToStaticMarkup(<PortfolioStrip about="./about/" source={SOURCE} />));
        expect(
            renderToStaticMarkup(
                <DemoFooter
                    name="Example"
                    about="./about/"
                    source={SOURCE}
                    current={maybe<'about'>()}
                    license={maybe<string>()}
                    licenseName={maybe<string>()}
                />
            )
        ).toBe(
            renderToStaticMarkup(<DemoFooter name="Example" about="./about/" source={SOURCE} />)
        );
        expect(
            renderToStaticMarkup(
                <Button off={maybe<boolean>()} pressed={maybe<boolean>()}>
                    Filters
                </Button>
            )
        ).toBe(renderToStaticMarkup(<Button>Filters</Button>));
        expect(renderToStaticMarkup(<Button accent={maybe<true>()}>Filters</Button>)).toBe(
            renderToStaticMarkup(<Button>Filters</Button>)
        );
        expect(renderToStaticMarkup(<InputField id={maybe<string>()} label="Name" />)).toBe(
            renderToStaticMarkup(<InputField label="Name" />)
        );
        expect(
            renderToStaticMarkup(
                <Callout
                    tone={maybe<'danger'>()}
                    headingLevel={maybe<2>()}
                    live={maybe<'status'>()}
                    prefix={maybe<string>()}
                    title="Saved"
                />
            )
        ).toBe(renderToStaticMarkup(<Callout title="Saved" />));
    });
});

describe('the callout, beside the other controls', () => {
    it('takes an id and a class of the page, after its own, as a button and a field do', () => {
        expect(
            renderToStaticMarkup(
                <Callout id="problems" className="summary" tone="danger" title="Two problems" />
            )
        ).toMatch(/^<div id="problems" class="dk-callout dk-callout-danger summary">/);
    });

    it('hands a ref to the callout it draws, for a page that moves focus to it', () => {
        const ref = createRef<HTMLDivElement>();
        const callout = Callout({ ref, title: 'Two problems' });
        expect((callout.props as { ref?: unknown }).ref).toBe(ref);
        // A page that hands on a ref it may not have been given, as a wrapper does, compiles too.
        const Summary = ({ ref: handed }: { readonly ref?: Ref<HTMLDivElement> | undefined }) => (
            <Callout ref={handed} title="Two problems" />
        );
        expect(renderToStaticMarkup(<Summary />)).toContain('dk-callout');
    });

    it('takes no props of its own that would break it, and drops a role or style plain JavaScript passes', () => {
        // @ts-expect-error A callout draws its own children, so it takes no inner HTML.
        expect(Callout({ dangerouslySetInnerHTML: { __html: 'x' } })).toBeTruthy();
        const loose = {
            role: 'alert',
            style: { color: 'red' },
            dangerouslySetInnerHTML: { __html: 'x' },
            'aria-live': 'polite',
        } as unknown as object;
        expect(renderToStaticMarkup(<Callout {...loose} title="Saved" />)).toBe(
            renderToStaticMarkup(<Callout title="Saved" />)
        );
    });

    it('draws news for a tone plain JavaScript can pass that the kit has no rule for', () => {
        const tone = 'sepia' as unknown as 'info';
        expect(renderToStaticMarkup(<Callout tone={tone} title="Saved" />)).toBe(
            renderToStaticMarkup(<Callout title="Saved" />)
        );
    });

    it('draws a paragraph for a heading level plain JavaScript can pass that names no heading', () => {
        const level = 'constructor' as unknown as 2;
        expect(renderToStaticMarkup(<Callout headingLevel={level} title="Saved" />)).toContain(
            '<p class="dk-callout-title">'
        );
    });
});

describe('an empty slot', () => {
    it('is nothing when it holds only a list or a fragment of nothing', () => {
        const none = false as boolean;
        expect(
            renderToStaticMarkup(
                <PortfolioStrip
                    about="./about/"
                    source={SOURCE}
                    tools={<>{none && 'Tour'}</>}
                    toolsLabel="Tour"
                />
            )
        ).toBe(renderToStaticMarkup(<PortfolioStrip about="./about/" source={SOURCE} />));
        expect(
            renderToStaticMarkup(
                <DemoFooter name="Example" about="./about/" source={SOURCE}>
                    {none && 'One.'}
                    {none && 'Two.'}
                </DemoFooter>
            )
        ).toBe(
            renderToStaticMarkup(<DemoFooter name="Example" about="./about/" source={SOURCE} />)
        );
        expect(renderToStaticMarkup(<Callout title={[none && 'Saved']} />)).toBe(
            renderToStaticMarkup(<Callout />)
        );
    });

    it('is nothing in the strip and the footer, as it is in a field and a callout', () => {
        expect(
            renderToStaticMarkup(
                <PortfolioStrip about="./about/" source={SOURCE} tools="" toolsLabel="Tour" />
            )
        ).toBe(renderToStaticMarkup(<PortfolioStrip about="./about/" source={SOURCE} />));
        expect(
            renderToStaticMarkup(
                <DemoFooter name="Example" about="./about/" source={SOURCE}>
                    {''}
                </DemoFooter>
            )
        ).toBe(
            renderToStaticMarkup(<DemoFooter name="Example" about="./about/" source={SOURCE} />)
        );
    });
});
