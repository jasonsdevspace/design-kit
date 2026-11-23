import { expect, type Page, test } from '@playwright/test';
import type { CSSProperties, ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ChoiceField, InputField, StepperField } from '../src/react.js';
import { frames, KIT, servePage, sideways } from './page.js';
import { doubled } from './text-size.js';

/*
 * A row of fields set side by side, as a page writes it with no rules of its own, where every field
 * starts from one length and shares the rest: a stepper's field beside a text field at equal widths
 * a step apart with their controls level at 390 and 1280 wide, and each on its own line a step
 * apart at 320 and at twice the text size, every label on one line, every part inside its field
 * and the page never pushed sideways, a stepper never wider than the length a field starts from,
 * the same boxes drawn without :has(), a range error or a long label moving neither field, a long
 * address breaking inside its field, an inline stepper and choices each on a line of their own,
 * two text fields sharing a line only where twice the length and the gap fit, three at 1280, a hint
 * leaving the controls level, and a row in a plain form a step from the fields around it, ending
 * where they end, with a field in it narrowed by --dk-field-measure, and a wrapped row's lines as far
 * apart as the fields around it, in a panel, a dialog, a stack and a plain form alike.
 */

/** Attaches each stepper, which shows its buttons. */
const ATTACH = `import { attachStepper } from './controls.js';
for (const stepper of document.querySelectorAll('.dk-stepper')) attachStepper(stepper);
window.ready = true;`;

/** A page with the body given in its content column, at the width given, its steppers attached. */
const open = async (page: Page, width: number, body: string): Promise<void> => {
    await page.setViewportSize({ width, height: 900 });
    await servePage(page, {
        title: 'Round 3',
        body: `<main class="dk-page"><h1>Round 3</h1>${body}</main>`,
        script: ATTACH,
    });
    await page.waitForFunction(() => 'ready' in window);
};

/** The fields given in a row of fields. */
const row = (fields: ReactElement): string =>
    renderToStaticMarkup(<div className="dk-fields">{fields}</div>);

/** A stepper's field and a text field in a row, as Game Table Tally sets a bid beside a name. */
const bid = (label = 'Bid', past = false): string =>
    row(
        <>
            <StepperField id="bid" label={label} min={0} max={10} defaultValue={past ? 12 : 3} />
            <InputField id="player" label="Player" />
        </>
    );

/** Where each field in the first row is drawn, and how its label and its control sit in it. */
const placed = (page: Page) =>
    page
        .locator('.dk-fields')
        .first()
        .evaluate((fields) =>
            [...fields.querySelectorAll<HTMLElement>(':scope > .dk-field')].map((field) => {
                const box = field.getBoundingClientRect();
                const label = field.querySelector('.dk-field-label');
                const control = field.querySelector(':scope > :is(.dk-input, .dk-stepper)');
                if (!label || !control) throw new Error('expected a label and a control');
                const range = document.createRange();
                range.selectNodeContents(label);
                const lines = new Set(
                    [...range.getClientRects()].map((line) => Math.round(line.top))
                );
                const within = (part: Element) => {
                    const drawn = part.getBoundingClientRect();
                    return drawn.left >= box.left - 0.5 && drawn.right <= box.right + 0.5;
                };
                return {
                    left: box.left,
                    right: box.right,
                    width: box.width,
                    top: box.top,
                    bottom: box.bottom,
                    lines: lines.size,
                    inside: [
                        control,
                        ...control.querySelectorAll('.dk-button, .dk-input'),
                        ...field.querySelectorAll(':scope > :is(p, label):not([hidden])'),
                    ].every(within),
                    foot: control.getBoundingClientRect().bottom,
                };
            })
        );

/** The two fields the first row holds, or a failure. */
const pairOf = async (page: Page) => {
    const [first, second] = await placed(page);
    if (!first || !second) throw new Error('expected two fields');
    return [first, second] as const;
};

for (const [width, scale, beside] of [
    [390, 1, true],
    [1280, 1, true],
    [320, 1, false],
    [320, 2, false],
    [390, 2, false],
] as const) {
    test(`sets a stepper's field and a text field ${beside ? 'side by side at equal widths' : 'each on its own line'} at ${String(width)} wide and ${String(scale)}x the text size`, async ({
        page,
        browserName,
    }) => {
        await open(page, width, bid());
        if (scale === 2) await doubled(page, browserName);
        const [stepper, text] = await pairOf(page);
        const step = 16 * scale;
        if (beside) {
            expect(Math.abs(text.width - stepper.width)).toBeLessThan(0.5);
            expect(text.left - stepper.right).toBeCloseTo(step, 0);
            expect(Math.abs(text.foot - stepper.foot)).toBeLessThan(0.5);
        } else {
            expect(text.top - stepper.bottom).toBeCloseTo(step, 0);
            expect(Math.abs(text.left - stepper.left)).toBeLessThan(0.5);
        }
        for (const [name, field] of Object.entries({ stepper, text })) {
            expect(field.lines, `${name}'s label on one line`).toBe(1);
            expect(field.inside, `${name}'s parts inside its field`).toBe(true);
        }
        expect(await sideways(page)).toBe(0);
    });
}

for (const scale of [1, 2]) {
    test(`draws a stepper no wider than the length a field in the row starts from, at ${String(scale)}x the text size`, async ({
        page,
        browserName,
    }) => {
        // A flex row of the page's own, which leaves the stepper's field its own width.
        await open(
            page,
            1280,
            `<div style="display: flex">${renderToStaticMarkup(
                <StepperField id="bid" label="Bid" min={0} max={10} defaultValue={3} />
            )}</div>`
        );
        if (scale === 2) await doubled(page, browserName);
        const width = await page
            .locator('.dk-field')
            .evaluate((field) => field.getBoundingClientRect().width);
        expect(width).toBeLessThanOrEqual(10 * 16 * scale);
    });
}

/** Every box in the first row, rounded to a tenth of a pixel. */
const boxes = (page: Page) =>
    page
        .locator('.dk-fields')
        .first()
        .evaluate((fields) =>
            [fields, ...fields.querySelectorAll('*')].map((part) => {
                const drawn = part.getBoundingClientRect();
                return [drawn.left, drawn.top, drawn.width, drawn.height].map(
                    (length) => Math.round(length * 10) / 10
                );
            })
        );

/**
 * The kit's sheets as a browser without :has() reads them, a selector naming it left unknown,
 * which drops a rule it is in outside a forgiving list.
 */
const withoutHas = async (page: Page): Promise<void> => {
    await page.evaluate(
        async ([kit, unknown]) => {
            const link = document.querySelector('link[href="/kit.css"]');
            if (!link) throw new Error('expected the kit sheet linked as /kit.css');
            const served = await (await fetch('/kit.css')).text();
            if (!served.startsWith(kit))
                throw new Error('expected the served sheet to open with the kit');
            const swapped = document.createElement('style');
            swapped.textContent = unknown + served.slice(kit.length);
            link.replaceWith(swapped);
        },
        [KIT, KIT.replaceAll(':has(', ':-dk-unknown(')] as const
    );
    await frames(page);
};

for (const width of [320, 390]) {
    test(`draws the same boxes without :has() at ${String(width)} wide`, async ({ page }) => {
        await open(page, width, bid());
        const drawn = await boxes(page);
        await withoutHas(page);
        expect(await boxes(page)).toEqual(drawn);
    });
}

/*
 * A stepper wider than the length a field starts from, a tall one or one of three figures, in a
 * row that sets --dk-fields-least as the reference says, at the narrowest width that sets the pair
 * side by side and at 1280.
 */
for (const [what, tall, digits, least, buttons, width] of [
    ['a tall stepper', true, 2, '12rem', 3.5, 440],
    ['a tall stepper of three figures', true, 3, '13.25rem', 3.5, 480],
    ['a stepper of three figures', false, 3, '10.5rem', 2.75, 390],
] as const) {
    for (const has of [true, false]) {
        for (const at of [width, 1280]) {
            test(`keeps ${what} whole beside a text field in a row asking ${least} a field, at ${String(at)} wide${has ? '' : ' without :has()'}`, async ({
                page,
            }) => {
                await open(
                    page,
                    at,
                    renderToStaticMarkup(
                        <div
                            className="dk-fields"
                            style={
                                {
                                    '--dk-fields-least': least,
                                    '--dk-stepper-digits': String(digits),
                                } as CSSProperties
                            }
                        >
                            <StepperField
                                id="score"
                                label="Score"
                                min={0}
                                max={digits === 3 ? 200 : 20}
                                defaultValue={digits === 3 ? 120 : 12}
                                tall={tall}
                            />
                            <InputField id="player" label="Player" />
                        </div>
                    )
                );
                if (!has) await withoutHas(page);
                const [stepper, text] = await pairOf(page);
                expect(stepper.inside, "the stepper's parts inside its field").toBe(true);
                expect(text.left - stepper.right).toBeCloseTo(16, 0);
                expect(Math.abs(text.foot - stepper.foot)).toBeLessThan(0.5);
                const widths = await page
                    .locator('.dk-stepper > .dk-button')
                    .evaluateAll((all) =>
                        all.map((button) => button.getBoundingClientRect().width)
                    );
                expect(widths).toHaveLength(2);
                // Each button at its full target, not narrowed to fit.
                for (const button of widths)
                    expect(button).toBeGreaterThanOrEqual(buttons * 16 - 0.5);
                expect(await sideways(page)).toBe(0);
            });
        }
    }
}

for (const [what, label, past] of [
    ['its range error shown', 'Bid', true],
    ['a long label', 'Points scored this round', false],
] as const) {
    test(`moves neither field for a stepper with ${what}`, async ({ page }) => {
        await open(page, 390, bid());
        const [stepper, text] = await pairOf(page);
        await open(page, 390, bid(label, past));
        if (past) await expect(page.locator('.dk-stepper-range')).toBeVisible();
        const [stepperNow, textNow] = await pairOf(page);
        for (const [before, now] of [
            [stepper, stepperNow],
            [text, textNow],
        ] as const) {
            expect(now.left).toBeCloseTo(before.left, 1);
            expect(now.width).toBeCloseTo(before.width, 1);
        }
        expect(stepperNow.inside, "the stepper's parts inside its field").toBe(true);
        expect(Math.abs(textNow.foot - stepperNow.foot)).toBeLessThan(0.5);
    });
}

const ADDRESS = 'No account uses bartholomew.featherstonehaugh.smythe@example.com';

for (const [beside, first] of [
    ['a text field', <InputField key="name" id="name" label="Name" />],
    [
        'a stepper',
        <StepperField key="bid" id="bid" label="Bid" min={0} max={10} defaultValue={3} />,
    ],
] as const) {
    test(`breaks a long address in a text field's error inside the field beside ${beside} at 320 wide and twice the text size`, async ({
        page,
        browserName,
    }) => {
        await open(
            page,
            320,
            row(
                <>
                    {first}
                    <InputField id="email" label="Email" error={ADDRESS} />
                </>
            )
        );
        await doubled(page, browserName);
        const [, email] = await pairOf(page);
        expect(email.inside, 'the error inside its field').toBe(true);
        expect(await sideways(page)).toBe(0);
    });
}

test('gives an inline stepper, a column of choices and a row of choices a line each', async ({
    page,
}) => {
    const choices = [
        { value: 'hearts', label: 'Hearts' },
        { value: 'spades', label: 'Spades' },
    ];
    await open(
        page,
        390,
        row(
            <>
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
                <ChoiceField id="trump" name="trump" label="Trump" choices={choices} />
                <InputField id="lead" label="Lead" />
                <ChoiceField id="suit" name="suit" label="Suit" choices={choices} row />
                <InputField id="note" label="Note" />
            </>
        )
    );
    const drawn = await page.locator('.dk-fields').evaluate((fields) => {
        const of = (part: Element) => {
            const box = part.getBoundingClientRect();
            return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
        };
        return { row: of(fields), parts: [...fields.children].map(of) };
    });
    const [inline, dealer, column, lead, across, note] = drawn.parts;
    if (!inline || !dealer || !column || !lead || !across || !note)
        throw new Error('expected six fields');
    for (const [whole, next] of [
        [inline, dealer],
        [column, lead],
        [across, note],
    ] as const) {
        expect(whole.left).toBeCloseTo(drawn.row.left, 0);
        expect(whole.right).toBeCloseTo(drawn.row.right, 0);
        expect(next.top - whole.bottom).toBeCloseTo(16, 0);
    }
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
    ['21rem', undefined, true],
    ['20.5rem', undefined, false],
    ['13rem', '6rem', true],
    ['12.5rem', '6rem', false],
] as const) {
    test(`sets two text fields ${beside ? 'side by side' : 'each on its own line'} in a row ${width} wide${least ? ` asking ${least} a field` : ''}`, async ({
        page,
    }) => {
        await open(page, 390, pair(width, least));
        const [first, last] = await pairOf(page);
        if (beside) {
            expect(last.left - first.right).toBeCloseTo(16, 0);
            expect(Math.abs(last.top - first.top)).toBeLessThan(0.5);
        } else {
            expect(last.top - first.bottom).toBeCloseTo(16, 0);
        }
    });
}

test('sets three text fields side by side at 1280 wide', async ({ page }) => {
    await open(
        page,
        1280,
        row(
            <>
                <InputField id="city" label="City" />
                <InputField id="region" label="Region" />
                <InputField id="country" label="Country" />
            </>
        )
    );
    const fields = await placed(page);
    expect(fields).toHaveLength(3);
    expect(new Set(fields.map((field) => Math.round(field.top))).size).toBe(1);
    expect(new Set(fields.map((field) => Math.round(field.width))).size).toBe(1);
});

test("keeps both controls' feet level where one field shows a hint", async ({ page }) => {
    await open(
        page,
        390,
        row(
            <>
                <InputField id="first" label="First" hint="As printed on the card" />
                <InputField id="last" label="Last" />
            </>
        )
    );
    const [first, last] = await pairOf(page);
    expect(last.left).toBeGreaterThan(first.right);
    expect(Math.abs(last.foot - first.foot)).toBeLessThan(0.5);
});

test('stands a row in a plain form a step from the fields around it, ending where they end', async ({
    page,
}) => {
    await open(
        page,
        1280,
        renderToStaticMarkup(
            <form>
                <InputField id="street" label="Street" />
                <div className="dk-fields">
                    <InputField id="city" label="City" />
                    <InputField id="region" label="Region" />
                    <InputField id="zip" label="ZIP code" />
                </div>
                <InputField id="note" label="Note" />
            </form>
        )
    );
    // A page narrows one field by the property the kit names for it, on the field itself.
    await page
        .locator('.dk-field:has(#zip)')
        .evaluate((field: HTMLElement) => field.style.setProperty('--dk-field-measure', '6rem'));
    const measured = await page.locator('form').evaluate((form) => {
        const [above, fields, below] = [...form.children].map((part) =>
            part.getBoundingClientRect()
        );
        if (!above || !fields || !below) throw new Error('expected three parts');
        return {
            over: fields.top - above.bottom,
            under: below.top - fields.bottom,
            fieldsEnd: fields.right,
            fieldsWidth: fields.width,
            aboveEnd: above.right,
            column: form.getBoundingClientRect().width,
            widths: [...form.querySelectorAll('.dk-fields > .dk-field')].map(
                (field) => field.getBoundingClientRect().width
            ),
        };
    });
    expect(measured.over).toBeCloseTo(16, 0);
    expect(measured.under).toBeCloseTo(16, 0);
    // The row ends where the field above it ends, at the measure, short of the column.
    expect(measured.fieldsEnd).toBeCloseTo(measured.aboveEnd, 0);
    expect(measured.aboveEnd).toBeLessThan(measured.column - 100);
    // The ZIP code's field at its own measure, the others sharing the rest of the line.
    const [city = 0, region = 0, zip = 0] = measured.widths;
    expect(zip).toBeCloseTo(96, 0);
    expect(city).toBeCloseTo(region, 0);
    expect(city + region + zip + 2 * 16).toBeCloseTo(measured.fieldsWidth, 0);
});

/** A field, a row of two fields and a field, which a narrow column wraps into four lines. */
const COLUMN = renderToStaticMarkup(
    <>
        <InputField id="street" label="Street" />
        <div className="dk-fields">
            <InputField id="city" label="City" />
            <InputField id="region" label="Region" />
        </div>
        <InputField id="note" label="Note" />
    </>
);

for (const [where, before, after, step] of [
    ['a page', '', '', 16],
    ['a panel', '<div class="dk-panel">', '</div>', 12],
    ['a dialog', '<dialog class="dk-dialog" open>', '</dialog>', 12],
    ['a stack', '<div class="dk-stack">', '</div>', 16],
    ['a stack in a panel', '<div class="dk-panel"><div class="dk-stack">', '</div></div>', 12],
    ["a pair's stack", '<div class="dk-stack dk-stack-pair">', '</div>', 8],
    ['a plain form', '<form>', '</form>', 16],
    ['a plain form in a panel', '<div class="dk-panel"><form>', '</form></div>', 16],
] as const) {
    test(`stands a wrapped row's lines as far apart as the fields around it in ${where}`, async ({
        page,
    }) => {
        await open(page, 320, `${before}${COLUMN}${after}`);
        const fields = await page.locator('.dk-field').evaluateAll((all) =>
            all.map((field) => {
                const drawn = field.getBoundingClientRect();
                return { left: drawn.left, top: drawn.top, bottom: drawn.bottom };
            })
        );
        expect(fields).toHaveLength(4);
        // Every field on a line of its own, so the row has wrapped.
        expect(new Set(fields.map((field) => Math.round(field.left))).size).toBe(1);
        const steps = fields
            .slice(1)
            .map((field, index) => Math.round(field.top - (fields[index]?.bottom ?? 0)));
        expect(steps).toEqual([step, step, step]);
    });
}
