import { createRef, type Ref } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
    Button,
    Callout,
    DemoFooter,
    GITHUB_PROFILE_URL,
    InputField,
    PORTFOLIO_URL,
    PORTFOLIO_WORK_URL,
    PortfolioStrip,
    SelectField,
    SkipLink,
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

    it('says whose demo this is, how it works and where the source is, in that order', () => {
        expect(strip()).toBe(
            '<div class="dk-strip"><nav class="dk-strip-links" aria-label="Portfolio">' +
                `<a href="${PORTFOLIO_WORK_URL}">A demo by Jason Poteet</a>` +
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

    it("holds the demo's own switches in a landmark of their own, only when there are some", () => {
        expect(strip()).not.toContain('dk-strip-tools');
        expect(strip({ tools: <button type="button">Tour</button> })).toContain(
            '<section class="dk-strip-tools" aria-label="Demo"><button type="button">Tour</button></section>'
        );
        expect(strip({ tools: <span />, toolsLabel: 'Store' })).toContain('aria-label="Store"');
        // As a demo writes `hasTour && <Tour />`, which leaves false or null when there is none.
        for (const nothing of [null, false])
            expect(strip({ tools: nothing })).not.toContain('dk-strip-tools');
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
            strip({ toolsWaiting: true, tools: <button type="button">Tour</button> })
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
            `Example is a portfolio project by <a href="${PORTFOLIO_URL}">Jason Poteet</a>.`
        );
        expect(footer).toBe(
            '<footer class="dk-footer"><p>' +
                `Example is a portfolio project by <a href="${PORTFOLIO_URL}">Jason Poteet</a>. ` +
                '<a href="./about/">How it works</a>, in plain words. ' +
                `The <a href="${SOURCE}">source</a> and ` +
                `<a href="${GITHUB_PROFILE_URL}">more work</a> are on GitHub, under the ` +
                `<a href="${SOURCE}/blob/main/LICENSE">MIT license</a>.</p></footer>`
        );
        const hrefs = [...footer.matchAll(/href="([^"]+)"/g)].map(([, href]) => href);
        expect(hrefs).toEqual([
            PORTFOLIO_URL,
            './about/',
            SOURCE,
            GITHUB_PROFILE_URL,
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
    });
});

describe('a field', () => {
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
        for (const tone of ['info', 'success', 'danger'] as const) {
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
