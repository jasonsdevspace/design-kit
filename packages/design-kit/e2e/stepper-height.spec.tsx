import { expect, type Page, test } from '@playwright/test';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { InputField, SelectField, StepperField } from '../src/react.js';
import { servePage } from './page.js';

/*
 * How tall a stepper stands, by the switch every control takes its height from: the field's height
 * on a page wider than 48rem outside an app's frame, so in a row of fields its label and its
 * control stand level with the text field's beside it, in a panel and in a dialog there too, and
 * the target on a phone, in an app's frame, on a page that ends in a tab bar and in a dialog on
 * either. Its buttons keep the target's width at both heights. A tall stepper is the larger target
 * everywhere, an inline stepper follows the same switch, and a read-only value stands as tall as
 * an editable one.
 */

/** Attaches each stepper, which shows its buttons. */
const ATTACH = `import { attachStepper } from './controls.js';
for (const stepper of document.querySelectorAll('.dk-stepper')) attachStepper(stepper);
for (const dialog of document.querySelectorAll('dialog')) dialog.showModal();
window.ready = true;`;

/** A stepper's field beside a text field in a row of fields. */
const ROW = (
    <div className="dk-fields">
        <StepperField id="bid" label="Bid" min={0} max={10} defaultValue={3} />
        <InputField id="player" label="Player" />
    </div>
);

/** The body given on a page at the width given, its steppers attached and its dialogs open. */
const open = async (page: Page, width: number, body: ReactElement): Promise<void> => {
    await page.setViewportSize({ width, height: 900 });
    await servePage(page, {
        title: 'Round 3',
        body: renderToStaticMarkup(body),
        script: ATTACH,
    });
    await page.waitForFunction(() => 'ready' in window);
};

/** A content page holding what is given. */
const onPage = (held: ReactElement): ReactElement => (
    <main className="dk-page">
        <h1>Round 3</h1>
        {held}
    </main>
);

/** An app's frame holding what is given. */
const inApp = (held: ReactElement): ReactElement => (
    <div className="dk-app">
        <header className="dk-app-bar">
            <h1 className="dk-app-title">Round 3</h1>
        </header>
        <main className="dk-app-body">{held}</main>
    </div>
);

/** A page that ends in a tab bar holding what is given. */
const onTabs = (held: ReactElement): ReactElement => (
    <div className="dk-tabbar-page">
        <main>
            <h1>Round 3</h1>
            {held}
        </main>
        <nav className="dk-tabbar" aria-label="Sections">
            <ul>
                <li>
                    <a href="#" aria-current="page">
                        Round
                    </a>
                </li>
            </ul>
        </nav>
    </div>
);

/** An open dialog holding what is given. */
const dialog = (held: ReactElement): ReactElement => (
    <dialog className="dk-dialog" aria-labelledby="bids">
        <h2 id="bids">Bids</h2>
        {held}
    </dialog>
);

/**
 * How the stepper named and the field named are drawn: where each label starts, where each control
 * starts and ends, and each of the stepper's buttons and its value.
 */
const drawn = (page: Page, stepperId = 'bid', fieldId = 'player') =>
    page.evaluate(
        ([stepper, field]) => {
            const value = document.querySelector(`#${stepper}`);
            const group = value?.closest('.dk-stepper');
            const text = document.querySelector(`#${field}`);
            if (!value || !group || !text) throw new Error('expected a stepper and a field');
            const label = (control: Element) =>
                control
                    .closest('.dk-field')
                    ?.querySelector('.dk-field-label')
                    ?.getBoundingClientRect().top ?? NaN;
            const [groupBox, valueBox, textBox] = [group, value, text].map((part) =>
                part.getBoundingClientRect()
            );
            if (!groupBox || !valueBox || !textBox) throw new Error('expected three boxes');
            return {
                labels: [label(value), label(text)],
                tops: [groupBox.top, textBox.top],
                feet: [groupBox.bottom, textBox.bottom],
                stepper: groupBox.height,
                value: valueBox.height,
                field: textBox.height,
                buttons: [...group.querySelectorAll('.dk-button:not([hidden])')].map((button) => {
                    const box = button.getBoundingClientRect();
                    return { width: box.width, height: box.height };
                }),
            };
        },
        [stepperId, fieldId] as const
    );

/** Finds a stepper and its parts the height given, its buttons the target wide. */
const stands = (
    found: Awaited<ReturnType<typeof drawn>>,
    height: number,
    where: string,
    { buttons = 2, wide = 44 }: { readonly buttons?: number; readonly wide?: number } = {}
): void => {
    expect.soft(found.stepper, `${where}, the stepper`).toBeCloseTo(height, 0);
    expect.soft(found.value, `${where}, the value`).toBeCloseTo(height, 0);
    expect(found.buttons, `${where}, the buttons shown`).toHaveLength(buttons);
    for (const button of found.buttons) {
        expect.soft(button.height, `${where}, a button's height`).toBeCloseTo(height, 0);
        expect.soft(button.width, `${where}, a button's width`).toBeCloseTo(wide, 0);
    }
};

/** Finds the stepper's label and control level with the field's beside it. */
const level = (found: Awaited<ReturnType<typeof drawn>>, where: string): void => {
    const [stepperLabel, fieldLabel] = found.labels;
    const [stepperTop, fieldTop] = found.tops;
    const [stepperFoot, fieldFoot] = found.feet;
    expect.soft(stepperLabel, `${where}, the labels`).toBeCloseTo(fieldLabel ?? NaN, 0);
    expect.soft(stepperTop, `${where}, the controls' tops`).toBeCloseTo(fieldTop ?? NaN, 0);
    expect.soft(stepperFoot, `${where}, the controls' feet`).toBeCloseTo(fieldFoot ?? NaN, 0);
};

test("draws a stepper the field's height beside a text field on a wide page, their labels and controls level", async ({
    page,
}) => {
    await open(page, 1280, onPage(ROW));
    const found = await drawn(page);
    expect(found.field).toBeCloseTo(36, 0);
    stands(found, 36, 'a page at 1280');
    level(found, 'a page at 1280');
});

for (const [where, width, body] of [
    ['a phone', 390, onPage(ROW)],
    ['48rem', 768, onPage(ROW)],
    ["an app's frame at 1280", 1280, inApp(ROW)],
    ['a page that ends in a tab bar at 1280', 1280, onTabs(ROW)],
    ['a dialog over an app at 1280', 1280, inApp(dialog(ROW))],
    ['a dialog over a page that ends in a tab bar at 1280', 1280, onTabs(dialog(ROW))],
] as const) {
    test(`draws a stepper the target tall and level with a text field on ${where}`, async ({
        page,
    }) => {
        await open(page, width, body);
        const found = await drawn(page);
        expect(found.field).toBeCloseTo(44, 0);
        stands(found, 44, where);
        level(found, where);
    });
}

for (const [where, body] of [
    ['a dialog', onPage(dialog(ROW))],
    ['a panel', onPage(<section className="dk-panel">{ROW}</section>)],
] as const) {
    test(`draws a stepper the field's height in ${where} on a wide page`, async ({ page }) => {
        await open(page, 1280, body);
        const found = await drawn(page);
        expect(found.field).toBeCloseTo(36, 0);
        stands(found, 36, where);
        level(found, where);
    });
}

test('keeps a tall stepper at the larger target at every width, its buttons as wide', async ({
    page,
}) => {
    for (const width of [390, 1280]) {
        await open(
            page,
            width,
            onPage(
                <>
                    <StepperField id="bid" label="Bid" min={0} max={10} defaultValue={3} tall />
                    <InputField id="player" label="Player" />
                </>
            )
        );
        stands(await drawn(page), 56, `a tall stepper at ${String(width)}`, { wide: 56 });
    }
});

test("draws an inline stepper and a read-only value by the field's switch too", async ({
    page,
}) => {
    for (const [width, height] of [
        [1280, 36],
        [390, 44],
    ] as const) {
        const at = String(width);
        await open(
            page,
            width,
            onPage(
                <>
                    <InputField id="player" label="Player" />
                    <StepperField id="bid" label="Bid" min={0} max={10} defaultValue={3} inline />
                    <StepperField
                        id="tricks"
                        label="Tricks"
                        min={0}
                        max={10}
                        defaultValue={3}
                        readOnly
                        inline
                    />
                    <StepperField
                        id="cards"
                        label="Cards each"
                        min={1}
                        max={10}
                        defaultValue={3}
                        readOnly
                    />
                </>
            )
        );
        stands(await drawn(page), height, `an inline stepper at ${at}`);
        stands(await drawn(page, 'tricks'), height, `a read-only inline stepper at ${at}`, {
            buttons: 0,
        });
        stands(await drawn(page, 'cards'), height, `a read-only stepper at ${at}`, { buttons: 0 });
    }
});

for (const [name, neighbor] of [
    [
        'a select',
        <SelectField id="player" label="Player">
            <option>Ana</option>
            <option>Ben</option>
        </SelectField>,
    ],
    [
        'a field with an action',
        <InputField
            id="player"
            label="Player"
            action={
                <button type="button" className="dk-button">
                    Add
                </button>
            }
        />,
    ],
] as const) {
    test(`stands a stepper as tall as ${name} beside it in a row, on a wide page and on a phone`, async ({
        page,
    }) => {
        for (const [width, height] of [
            [1280, 36],
            [390, 44],
        ] as const) {
            const at = `${name} at ${String(width)}`;
            await open(
                page,
                width,
                onPage(
                    <div className="dk-fields">
                        <StepperField id="bid" label="Bid" min={0} max={10} defaultValue={3} />
                        {neighbor}
                    </div>
                )
            );
            const found = await drawn(page);
            expect.soft(found.field, at).toBeCloseTo(height, 0);
            stands(found, height, at);
            // On a phone an action's button moves under its control, so that field stands taller
            // and the row, lined up along its foot, sets its label lower. The heights still match.
            if (width === 1280 || name === 'a select') level(found, at);
        }
    });
}
