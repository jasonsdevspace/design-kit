import { expect, type Locator, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { StepperField } from '../src/react.js';
import { box, pixels, press, ringByKeyboard, servePage, style, tabKey } from './page.js';

/*
 * A stepper taken down, by its signal or its detach, while one of its buttons holds focus: focus
 * handed to a read-only value or to the stepper itself, never to the body or an editable value,
 * and kept there, the box left as the markup drew it, a box that refuses focus sending focus to
 * the main content, and a page that moves focus or attaches the stepper again in the same task
 * keeping what it asked for.
 */

const TAKEN = renderToStaticMarkup(
    <main>
        <h1>Round 3</h1>
        <button type="button" id="next" className="dk-button">
            Next round
        </button>
        <StepperField id="kept" label="Kept" min={0} max={10} defaultValue={5} />
        <StepperField
            id="players"
            label="Players"
            mark="required"
            required
            min={0}
            max={10}
            defaultValue={5}
        />
        <StepperField id="shut" label="Shut" min={0} max={10} defaultValue={5} disabled />
    </main>
);

// Each stepper attached with a signal of its own, kept with its detach by the value's id.
const ATTACH_HELD = `import { attachStepper, moveFocus } from './controls.js';
window.kit = { attachStepper, moveFocus };
window.held = {};
window.hold = (stepper) => {
    const controller = new AbortController();
    const detach = attachStepper(stepper, { signal: controller.signal });
    window.held[stepper.querySelector('input').id] = { controller, detach };
};
for (const stepper of document.querySelectorAll('.dk-stepper')) window.hold(stepper);
window.ready = true;`;

type Held = {
    kit: {
        attachStepper: typeof import('../src/controls.js').attachStepper;
        moveFocus: typeof import('../src/controls.js').moveFocus;
    };
    held: Record<string, { controller: AbortController; detach: () => void }>;
    hold: (stepper: HTMLElement) => void;
};

/** Where focus is, read in the task the takedown lands in. */
type Landed = { body: boolean; editable: boolean };

/**
 * Takes a stepper down by its signal or its detach and waits the microtask its takedown waits for,
 * then reads where focus is before anything else can move it.
 */
const takeDown = (page: Page, id: string, way: 'signal' | 'detach'): Promise<Landed> =>
    page.evaluate(
        async ([given, by]) => {
            const { held } = window as unknown as Held;
            const control = held[given];
            if (!control) throw new Error(`expected a stepper for ${given}`);
            if (by === 'signal') control.controller.abort();
            else control.detach();
            await Promise.resolve();
            const active = document.activeElement;
            return {
                body: !active || active === document.body,
                editable:
                    active instanceof HTMLInputElement && !active.readOnly && !active.disabled,
            };
        },
        [id, way] as const
    );

/** Attaches a stepper again with a signal of its own, a microtask after anything before it. */
const attachAgain = (page: Page, id: string): Promise<void> =>
    page.evaluate(async (given) => {
        await Promise.resolve();
        const stepper = document.querySelector<HTMLElement>(`.dk-stepper:has(#${given})`);
        if (!stepper) throw new Error(`expected a stepper for ${given}`);
        (window as unknown as Held).hold(stepper);
    }, id);

/** The steppers taken down, and where focus goes from a focused button as each is. */
const TAKEN_DOWN = [
    { kind: 'a read-only', id: 'kept', label: 'Kept', readOnly: true },
    { kind: 'an editable', id: 'players', label: 'Players', readOnly: false },
    { kind: 'a disabled', id: 'shut', label: 'Shut', readOnly: false },
] as const;

/** The page of steppers each attached with a signal. */
const openTaken = async (page: Page): Promise<void> => {
    await page.setViewportSize({ width: 390, height: 700 });
    await servePage(page, { title: 'Round 3', body: TAKEN, script: ATTACH_HELD });
    await page.waitForFunction(() => 'ready' in window);
};

/** A stepper's buttons, by its label. */
const buttonsOf = (page: Page, label: string): { lower: Locator; raise: Locator } => ({
    lower: page.getByRole('button', { name: `Lower ${label}` }),
    raise: page.getByRole('button', { name: `Raise ${label}` }),
});

/**
 * The page of steppers each attached with a signal, with the given one's Raise focused by the
 * keyboard, and its field turned read only after where asked, as the button keeps focus then.
 */
const focusRaise = async (
    page: Page,
    browserName: string,
    { label, id, readOnly }: (typeof TAKEN_DOWN)[number],
    { open = true }: { open?: boolean } = {}
): Promise<{ lower: Locator; raise: Locator }> => {
    if (open) await openTaken(page);
    const buttons = buttonsOf(page, label);
    await ringByKeyboard(buttons.raise, browserName);
    if (readOnly) {
        await page.locator(`#${id}`).evaluate((input: HTMLInputElement) => {
            input.readOnly = true;
        });
        await expect(buttons.raise).toHaveAttribute('aria-disabled', 'true');
        await expect(buttons.raise).toBeFocused();
    }
    return buttons;
};

/** The box of a stepper, by its value's id. */
const boxOf = (page: Page, id: string): Locator => page.locator(`.dk-stepper:has(#${id})`);

/** Every attribute of the element, by name. */
const attributesOf = (locator: Locator): Promise<Record<string, string>> =>
    locator.evaluate((element) =>
        Object.fromEntries(
            element.getAttributeNames().map((name) => [name, element.getAttribute(name) ?? ''])
        )
    );

/** Finds the ring drawn on the element. */
const expectRing = async (locator: Locator): Promise<void> => {
    const ring = await style(locator, 'outline-style', 'outline-width');
    expect(ring['outline-style'], 'the ring').not.toBe('none');
    expect(pixels(ring['outline-width']), 'the ring').toBeGreaterThan(0);
};

test.describe('taken down with a button focused', () => {
    for (const way of ['signal', 'detach'] as const) {
        for (const stepper of TAKEN_DOWN) {
            test(`hands focus from ${stepper.kind} stepper's button to ${stepper.readOnly ? 'its value' : 'the group'}, by its ${way}`, async ({
                page,
                browserName,
            }) => {
                const buttons = await focusRaise(page, browserName, stepper);
                const landed = await takeDown(page, stepper.id, way);
                expect(landed.body, 'focus on the body').toBe(false);
                // An editable value would open a phone's keyboard.
                expect(landed.editable, 'focus on an editable value').toBe(false);
                const place = stepper.readOnly
                    ? page.locator(`#${stepper.id}`)
                    : page.getByRole('group', { name: stepper.label, exact: true });
                await expect(place).toBeFocused();
                await expect(buttons.lower).toBeHidden();
                await expect(buttons.raise).toBeHidden();
                await expectRing(place);
                // The required mark is hidden from a screen reader, in the group's name too.
                if (!stepper.readOnly) await expect(place).toHaveAccessibleName(stepper.label);
            });
        }
    }

    test('keeps the box as the markup drew it, but for a tabindex it gives once and keeps', async ({
        page,
        browserName,
    }) => {
        await openTaken(page);
        const group = boxOf(page, 'players');
        const drawn = await attributesOf(group);
        const steps: [string, () => Promise<unknown>][] = [
            [
                'a takedown with a button focused',
                () =>
                    focusRaise(page, browserName, TAKEN_DOWN[1], { open: false }).then(() =>
                        takeDown(page, 'players', 'signal')
                    ),
            ],
            [
                // Focus moved on first, as a visitor moves on before the page draws it again.
                'an attach a microtask later, with focus moved on',
                async () => {
                    await page.locator('#next').focus();
                    await attachAgain(page, 'players');
                },
            ],
            [
                'a button focused',
                () => ringByKeyboard(buttonsOf(page, 'Players').raise, browserName),
            ],
            ['a takedown again', () => takeDown(page, 'players', 'detach')],
            [
                'an abort and an attach in one task',
                async () => {
                    await attachAgain(page, 'players');
                    await page.evaluate(async () => {
                        const { held, hold } = window as unknown as Held;
                        const stepper = document.querySelector<HTMLElement>(
                            '.dk-stepper:has(#players)'
                        );
                        if (!stepper) throw new Error('expected the stepper for players');
                        held['players']?.controller.abort();
                        hold(stepper);
                        await Promise.resolve();
                    });
                },
            ],
        ];
        for (const [step, run] of steps) {
            await run();
            expect(await attributesOf(group), step).toEqual({ ...drawn, tabindex: '-1' });
        }
    });

    test('never takes away an attribute the page gave the box', async ({ page, browserName }) => {
        await focusRaise(page, browserName, TAKEN_DOWN[1]);
        await takeDown(page, 'players', 'signal');
        const group = boxOf(page, 'players');
        await group.evaluate((stepper: HTMLElement) => {
            stepper.setAttribute('aria-label', 'Players at the table');
            stepper.tabIndex = 0;
        });
        await page.locator('#next').focus();
        await attachAgain(page, 'players');
        await ringByKeyboard(buttonsOf(page, 'Players').raise, browserName);
        await takeDown(page, 'players', 'signal');
        await expect(group).toHaveAttribute('aria-label', 'Players at the table');
        await expect(group).toHaveAttribute('tabindex', '0');
        await expect(group).toBeFocused();
    });

    test('gives older markup with no role or tabindex a tabindex, and keeps a tabindex of 0', async ({
        page,
        browserName,
    }) => {
        for (const tabindex of [null, '0']) {
            await openTaken(page);
            const group = boxOf(page, 'players');
            await group.evaluate((stepper: HTMLElement, given) => {
                stepper.removeAttribute('role');
                stepper.removeAttribute('aria-labelledby');
                if (given) stepper.setAttribute('tabindex', given);
            }, tabindex);
            await focusRaise(page, browserName, TAKEN_DOWN[1], { open: false });
            await takeDown(page, 'players', 'signal');
            await expect(group, String(tabindex)).toBeFocused();
            await expect(group, String(tabindex)).toHaveAttribute('tabindex', tabindex ?? '-1');
        }
    });

    test('leaves a box that refuses focus as drawn, and sends focus to the main content', async ({
        page,
        browserName,
    }) => {
        await focusRaise(page, browserName, TAKEN_DOWN[1]);
        const group = boxOf(page, 'players');
        const drawn = await attributesOf(group);
        await page.evaluate(async () => {
            const { held } = window as unknown as Held;
            // The main content takes focus, as a page that moves focus there does.
            document.querySelector('main')?.setAttribute('tabindex', '-1');
            const stepper = document.querySelector<HTMLElement>('.dk-stepper:has(#players)');
            if (stepper) stepper.inert = true;
            held['players']?.controller.abort();
            await Promise.resolve();
        });
        expect(await attributesOf(group)).toEqual({ ...drawn, inert: '' });
        await expect(page.locator('main')).toBeFocused();
    });

    test('leaves focus where a page listener moves it as the value is tried', async ({
        page,
        browserName,
    }) => {
        await focusRaise(page, browserName, TAKEN_DOWN[0]);
        await page.evaluate(async () => {
            const { held } = window as unknown as Held;
            document
                .querySelector('#kept')
                ?.addEventListener(
                    'focus',
                    () => document.querySelector<HTMLElement>('#next')?.focus(),
                    { once: true }
                );
            held['kept']?.controller.abort();
            await Promise.resolve();
        });
        await expect(page.locator('#next')).toBeFocused();
        await expect(boxOf(page, 'kept')).not.toHaveAttribute('tabindex');
    });

    test("keeps the group's name as a script changes the value while it has focus", async ({
        page,
        browserName,
    }) => {
        await focusRaise(page, browserName, TAKEN_DOWN[1]);
        await takeDown(page, 'players', 'signal');
        await page.locator('#players').evaluate((input: HTMLInputElement) => {
            input.value = '7';
        });
        const group = page.getByRole('group', { name: 'Players', exact: true });
        await expect(group).toBeFocused();
        await expect(group).toHaveAccessibleName('Players');
    });

    test('leaves a stepper attached again out of the tab order, with no ring for a pointer', async ({
        page,
        browserName,
    }) => {
        await focusRaise(page, browserName, TAKEN_DOWN[1]);
        await takeDown(page, 'players', 'signal');
        await attachAgain(page, 'players');
        const players = buttonsOf(page, 'Players');
        await expect(players.lower).toBeVisible();
        // Tab from the control before the stepper reaches its Lower, not the box.
        await page.getByRole('button', { name: 'Raise Kept' }).focus();
        await page.keyboard.press(tabKey(browserName));
        await expect(players.lower).toBeFocused();
        // A click in the gap between Lower and the value, inside the box and outside its parts,
        // focuses the box, with no ring.
        const lowerBox = await box(players.lower);
        const valueBox = await box(page.locator('#players'));
        await page.mouse.click(
            (lowerBox.x + lowerBox.width + valueBox.x) / 2,
            lowerBox.y + lowerBox.height / 2
        );
        const group = boxOf(page, 'players');
        await expect(group).toBeFocused();
        expect((await style(group, 'outline-style'))['outline-style']).toBe('none');
    });

    test('keeps the buttons of a stepper a page attaches afresh as focus comes to it', async ({
        page,
        browserName,
    }) => {
        await focusRaise(page, browserName, TAKEN_DOWN[1]);
        await page.evaluate(async () => {
            const { kit, held } = window as unknown as Held;
            const stepper = document.querySelector<HTMLElement>('.dk-stepper:has(#players)');
            if (!stepper) throw new Error('expected the stepper for players');
            // A page that attaches a stepper as focus comes into it.
            stepper.addEventListener('focusin', () => kit.attachStepper(stepper), { once: true });
            held['players']?.controller.abort();
            await Promise.resolve();
        });
        const { lower: lowerPlayers, raise: raisePlayers } = buttonsOf(page, 'Players');
        await expect(boxOf(page, 'players')).toBeFocused();
        await expect(raisePlayers).toBeVisible();
        await expect(lowerPlayers).toBeVisible();
        await press(raisePlayers, browserName);
        await expect(page.locator('#players')).toHaveValue('6');
    });

    test('keeps focus on the button where the page attaches it again in the task its signal aborts', async ({
        page,
        browserName,
    }) => {
        const { raise: raisePlayers } = await focusRaise(page, browserName, TAKEN_DOWN[1]);
        await page.evaluate(async () => {
            const { held, hold } = window as unknown as Held;
            const stepper = document.querySelector<HTMLElement>('.dk-stepper:has(#players)');
            if (!stepper) throw new Error('expected the stepper for players');
            held['players']?.controller.abort();
            hold(stepper);
            await Promise.resolve();
        });
        await expect(raisePlayers).toBeFocused();
        await expect(raisePlayers).toBeVisible();
    });

    test('leaves focus where the page moves it in the task its signal aborts', async ({
        page,
        browserName,
    }) => {
        await focusRaise(page, browserName, TAKEN_DOWN[1]);
        await page.evaluate(async () => {
            const { held } = window as unknown as Held;
            held['players']?.controller.abort();
            document.querySelector<HTMLElement>('#next')?.focus();
            await Promise.resolve();
        });
        await expect(page.locator('#next')).toBeFocused();
    });

    test('lands a focus request asked in the task its signal aborts', async ({
        page,
        browserName,
    }) => {
        await focusRaise(page, browserName, TAKEN_DOWN[1]);
        await page.evaluate(() => {
            const { kit, held } = window as unknown as Held;
            held['players']?.controller.abort();
            kit.moveFocus('next');
        });
        await expect(page.locator('#next')).toBeFocused();
    });
});

/**
 * The steppers drawn inside a frame of the page's own origin, each attached from the page with a
 * signal of its own, as `ATTACH_HELD` attaches the page's.
 */
const ATTACH_IN_FRAME = `import { attachStepper } from './controls.js';
const frame = document.querySelector('iframe');
if (frame.contentDocument?.title !== 'Round 3')
    await new Promise((loaded) => frame.addEventListener('load', loaded, { once: true }));
const inner = frame.contentDocument;
inner.body.innerHTML = ${JSON.stringify(TAKEN)};
window.held = {};
for (const stepper of inner.querySelectorAll('.dk-stepper')) {
    const controller = new AbortController();
    const detach = attachStepper(stepper, { signal: controller.signal });
    window.held[stepper.querySelector('input').id] = { controller, detach };
}
window.ready = true;`;

test.describe('inside a frame, attached from the page', () => {
    for (const stepper of TAKEN_DOWN)
        test(`keeps focus on ${stepper.kind} stepper's button${stepper.readOnly ? ' as its value turns read only,' : ''} and hands it to ${stepper.readOnly ? 'its value' : 'the group'} as it is taken down`, async ({
            page,
        }) => {
            await page.setViewportSize({ width: 390, height: 700 });
            await servePage(page, {
                title: 'Round 3',
                body: '<main><iframe title="Round 3" srcdoc="<!doctype html><title>Round 3</title>" style="width: 100%; height: 600px"></iframe></main>',
                script: ATTACH_IN_FRAME,
            });
            await page.waitForFunction(() => 'ready' in window);
            const inner = page.frameLocator('iframe');
            const raise = inner.getByRole('button', { name: `Raise ${stepper.label}` });
            await raise.focus();
            if (stepper.readOnly) {
                await inner.locator(`#${stepper.id}`).evaluate((input: HTMLInputElement) => {
                    input.readOnly = true;
                });
                await expect(raise).toHaveAttribute('aria-disabled', 'true');
                await expect(raise).toBeVisible();
                await expect(raise).toBeFocused();
            }
            await page.evaluate(async (id) => {
                (window as unknown as Held).held[id]?.controller.abort();
                await Promise.resolve();
            }, stepper.id);
            const place = stepper.readOnly
                ? inner.locator(`#${stepper.id}`)
                : inner.getByRole('group', { name: stepper.label, exact: true });
            await expect(place).toBeFocused();
            await expect(raise).toBeHidden();
            await expect(page.locator('iframe')).toBeFocused();
        });
});
