import { expect, type Page, test } from '@playwright/test';
import type { CSSProperties } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ChoiceField, InputField, StepperField } from '../src/react.js';
import { servePage, sideways } from './page.js';
import { doubled } from './text-size.js';

/*
 * A row of fields set side by side, as a page writes it with no rules of its own: a stepper's
 * field beside a text field side by side at a phone's width and the usual text size, their
 * controls lined up beside a label on two lines as well, and each on its own line a step apart at
 * twice the text size, every label on one line, every control inside its field and the page never
 * pushed sideways, two text fields side by side only where twice the least width a field asks for
 * fits, which a page sets by --dk-fields-least, and a row in a plain form standing a step from the
 * fields around it, its own fields holding no measure.
 */

/** Attaches each stepper, which shows its buttons. */
const ATTACH = `import { attachStepper } from './controls.js';
for (const stepper of document.querySelectorAll('.dk-stepper')) attachStepper(stepper);
window.ready = true;`;

/** A page with the body given in its content column, at the width given, its steppers attached. */
const open = async (page: Page, width: number, body: string): Promise<void> => {
    await page.setViewportSize({ width, height: 700 });
    await servePage(page, {
        title: 'Round 3',
        body: `<main class="dk-page"><h1>Round 3</h1>${body}</main>`,
        script: ATTACH,
    });
    await page.waitForFunction(() => 'ready' in window);
};

/** A stepper's field and a text field in a row, as Game Table Tally sets a bid beside a name. */
const BID = renderToStaticMarkup(
    <div className="dk-fields">
        <StepperField id="bid" label="Bid" min={0} max={10} defaultValue={3} />
        <InputField id="player" label="Player" />
    </div>
);

/** Where each field in the first row is drawn, and how its label and its control sit in it. */
const placed = (page: Page) =>
    page.locator('.dk-fields').evaluate((row) =>
        [...row.querySelectorAll<HTMLElement>(':scope > .dk-field')].map((field) => {
            const box = field.getBoundingClientRect();
            const label = field.querySelector('.dk-field-label');
            const control = field.querySelector(':scope > :is(.dk-input, .dk-stepper)');
            if (!label || !control) throw new Error('expected a label and a control');
            const range = document.createRange();
            range.selectNodeContents(label);
            const lines = new Set([...range.getClientRects()].map((line) => Math.round(line.top)));
            const within = (part: Element) => {
                const drawn = part.getBoundingClientRect();
                return drawn.left >= box.left - 0.5 && drawn.right <= box.right + 0.5;
            };
            return {
                left: box.left,
                right: box.right,
                top: box.top,
                bottom: box.bottom,
                lines: lines.size,
                inside: [control, ...control.querySelectorAll('.dk-button, .dk-input')].every(
                    within
                ),
                controlTop: control.getBoundingClientRect().top,
                controlBottom: control.getBoundingClientRect().bottom,
            };
        })
    );

for (const width of [320, 390]) {
    for (const scale of [1, 2]) {
        test(`sets a stepper's field beside a text field at ${String(width)} wide and ${String(scale)}x the text size, ${scale === 1 ? 'side by side' : 'each on its own line'}`, async ({
            page,
            browserName,
        }) => {
            await open(page, width, BID);
            if (scale === 2) await doubled(page, browserName);
            const [stepper, text] = await placed(page);
            if (!stepper || !text) throw new Error('expected two fields');
            const step = 16 * scale;
            if (scale === 1) {
                // Side by side, a step apart, their controls lined up along their foot.
                expect(text.left - stepper.right).toBeCloseTo(step, 0);
                expect(Math.abs(text.controlBottom - stepper.controlBottom)).toBeLessThan(0.5);
            } else {
                // Each on its own line, the text field a step under the stepper's.
                expect(text.top - stepper.bottom).toBeCloseTo(step, 0);
                expect(Math.abs(text.left - stepper.left)).toBeLessThan(0.5);
            }
            for (const [name, field] of Object.entries({ stepper, text })) {
                expect(field.lines, `${name}'s label on one line`).toBe(1);
                expect(field.inside, `${name}'s control inside its field`).toBe(true);
            }
            expect(await sideways(page)).toBe(0);
        });
    }
}

test("lines a stepper's control up with a text field's whose label takes two lines", async ({
    page,
}) => {
    await open(
        page,
        390,
        renderToStaticMarkup(
            <div className="dk-fields">
                <StepperField id="bid" label="Bid" min={0} max={10} defaultValue={3} />
                <InputField id="player" label="The player who deals this round" />
            </div>
        )
    );
    const [stepper, text] = await placed(page);
    if (!stepper || !text) throw new Error('expected two fields');
    expect(text.lines, 'the long label wraps').toBe(2);
    expect(text.left).toBeGreaterThan(stepper.right);
    expect(Math.abs(text.controlTop - stepper.controlTop)).toBeLessThan(0.5);
    expect(Math.abs(text.controlBottom - stepper.controlBottom)).toBeLessThan(0.5);
});

/** Two text fields in a row inside a box of the width given, and the least width set, if any. */
const pair = (width: string, least?: string): string =>
    `<div style="width: ${width}">${renderToStaticMarkup(
        <div
            className="dk-fields"
            style={least ? ({ '--dk-fields-least': least } as CSSProperties) : undefined}
        >
            <InputField id="first" label="First" />
            <InputField id="last" label="Last" />
        </div>
    )}</div>`;

for (const [width, least, beside] of [
    ['15rem', undefined, true],
    ['14.5rem', undefined, false],
    ['20rem', '10rem', false],
    ['14.5rem', '6rem', true],
] as const) {
    test(`sets two text fields ${beside ? 'side by side' : 'each on its own line'} in a row ${width} wide${least ? ` asking ${least} a field` : ''}`, async ({
        page,
    }) => {
        await open(page, 390, pair(width, least));
        const [first, last] = await placed(page);
        if (!first || !last) throw new Error('expected two fields');
        if (beside) {
            expect(last.left - first.right).toBeCloseTo(16, 0);
            expect(Math.abs(last.top - first.top)).toBeLessThan(0.5);
        } else {
            expect(last.top - first.bottom).toBeCloseTo(16, 0);
        }
    });
}

test('stands a row a step from the fields around it in a plain form, its fields holding no measure', async ({
    page,
}) => {
    await open(
        page,
        1280,
        renderToStaticMarkup(
            <form>
                <InputField id="table" label="Table name" />
                <div className="dk-fields">
                    <StepperField id="seats" label="Seats" min={2} max={8} defaultValue={4} />
                    <InputField id="host" label="Host" />
                </div>
                <InputField id="note" label="Note" />
            </form>
        )
    );
    const measured = await page.locator('form').evaluate((form) => {
        const [above, row, below] = [...form.children].map((part) => part.getBoundingClientRect());
        if (!above || !row || !below) throw new Error('expected three parts');
        return {
            over: row.top - above.bottom,
            under: below.top - row.bottom,
            rowEnd: row.right,
            fieldEnd: above.right,
            column: form.getBoundingClientRect().width,
            measures: [...form.querySelectorAll('.dk-fields > .dk-field')].map(
                (field) => getComputedStyle(field).maxWidth
            ),
        };
    });
    expect(measured.over).toBeCloseTo(16, 0);
    expect(measured.under).toBeCloseTo(16, 0);
    expect(measured.measures).toEqual(['none', 'none']);
    // The row ends where the field above it ends, at the measure, short of the column.
    expect(measured.rowEnd).toBeCloseTo(measured.fieldEnd, 0);
    expect(measured.fieldEnd).toBeLessThan(measured.column - 100);
});

/** A stepper's field with the label given, past its limit or not, beside a text field. */
const wide = (label: string, past: boolean): string =>
    renderToStaticMarkup(
        <div className="dk-fields">
            <StepperField id="bid" label={label} min={0} max={10} defaultValue={past ? 12 : 3} />
            <InputField id="player" label="Player" />
        </div>
    );

for (const width of [320, 390]) {
    for (const [what, label, past] of [
        ['its range error shown', 'Bid', true],
        ['a long label', 'Points scored this round', false],
    ] as const) {
        test(`keeps a stepper's field at its stepper's width with ${what}, at ${String(width)} wide`, async ({
            page,
        }) => {
            await open(page, width, wide(label, past));
            if (past) await expect(page.locator('.dk-stepper-range')).toBeVisible();
            const [stepper, text] = await placed(page);
            if (!stepper || !text) throw new Error('expected two fields');
            const kept = await page
                .locator('.dk-fields > .dk-field')
                .first()
                .evaluate((field) => {
                    const box = field.getBoundingClientRect();
                    const parts = [...field.querySelectorAll(':scope > :not([hidden])')].filter(
                        (part) => part.getBoundingClientRect().width > 0
                    );
                    return {
                        field: box.width,
                        // What the stepper draws, from its first button's start to its last one's end.
                        stepper:
                            (field.querySelector('.dk-stepper-up')?.getBoundingClientRect().right ??
                                0) -
                            (field.querySelector('.dk-stepper-down')?.getBoundingClientRect()
                                .left ?? 0),
                        past: parts.filter((part) => {
                            const drawn = part.getBoundingClientRect();
                            return drawn.left < box.left - 0.5 || drawn.right > box.right + 0.5;
                        }).length,
                    };
                });
            // The field as wide as its stepper, its words wrapping inside it.
            expect(kept.field).toBeCloseTo(kept.stepper, 0);
            expect(kept.past, 'parts past the field').toBe(0);
            // The text field stays beside it, the controls level.
            expect(text.left - stepper.right).toBeCloseTo(16, 0);
            expect(Math.abs(text.controlBottom - stepper.controlBottom)).toBeLessThan(0.5);
            expect(await sideways(page)).toBe(0);
        });
    }
}

test('gives an inline stepper and a column of choices a line each in the row', async ({ page }) => {
    await open(
        page,
        390,
        renderToStaticMarkup(
            <div className="dk-fields">
                <StepperField
                    id="tricks"
                    label="Tricks"
                    hint="Up to ten"
                    min={0}
                    max={10}
                    defaultValue={2}
                    inline
                />
                <InputField id="dealer" label="Dealer" />
                <ChoiceField
                    id="trump"
                    name="trump"
                    label="Trump"
                    choices={[
                        { value: 'hearts', label: 'Hearts' },
                        { value: 'spades', label: 'Spades' },
                    ]}
                />
            </div>
        )
    );
    const drawn = await page.locator('.dk-fields').evaluate((row) => {
        const of = (part: Element | null | undefined) => {
            const box = part?.getBoundingClientRect();
            if (!box) throw new Error('expected the part drawn');
            return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
        };
        const [inline, dealer, trump] = [...row.children];
        return {
            row: of(row),
            inline: of(inline),
            label: of(inline?.querySelector('.dk-field-label')),
            stepper: of(inline?.querySelector('.dk-stepper')),
            dealer: of(dealer),
            trump: of(trump),
        };
    });
    // The inline stepper runs the row, its label at the start and its stepper at the end.
    expect(drawn.inline.left).toBeCloseTo(drawn.row.left, 0);
    expect(drawn.inline.right).toBeCloseTo(drawn.row.right, 0);
    expect(drawn.label.left).toBeCloseTo(drawn.row.left, 0);
    expect(drawn.stepper.right).toBeCloseTo(drawn.row.right, 0);
    // The next field a step under it, and the choices on a line of their own under that.
    expect(drawn.dealer.top - drawn.inline.bottom).toBeCloseTo(16, 0);
    expect(drawn.trump.left).toBeCloseTo(drawn.row.left, 0);
    expect(drawn.trump.right).toBeCloseTo(drawn.row.right, 0);
    expect(drawn.trump.top).toBeGreaterThan(drawn.dealer.bottom);
});
