import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { InputField, StepperField, ValueField } from '../src/react.js';
import {
    box,
    KIT,
    pixels,
    ringByKeyboard,
    servePage,
    sideways,
    stillClock,
    style,
    tabKey,
} from './page.js';
import { cutOff, SPACED } from './spacing.js';
import { doubled, textSize } from './text-size.js';

/*
 * A stepper as a page attaches it: its buttons hidden with no script and once taken away and named
 * for what they do and to which field once attached, each press stepping the value once however
 * often, and in whichever order, the stepper was attached, firing the events a typed value fires
 * and saying the value on its status line, the buttons off at the limits with focus kept and on a
 * disabled or read-only field, a value a form's reset sets followed, a typed value outside the
 * limits, or none where one is required, reported as a field's error once changed and said after
 * the field's name, a mark the label hides left out of that name, letters typed into a blank
 * stepper reported as focus leaves it, but not as focus stays, on a locked field or beside the
 * page's own error, nor before a press on its own button that then lands, a blank focus passes
 * through left quiet, and the error cleared once right while a page's own error keeps its place, a
 * value drawn past the limits shown as an error once attached or brought back by a reset with
 * nothing said, but not on a field no one can change, for a refusal the page sets or beside the
 * page's own error, a phone's keyboard with a minus only where it is needed, the value in figures
 * of one width so the field keeps its width, every figure shown under the wider spacing a reader
 * may set, the label beside it on one line at a phone's narrowest width, a stepper that fits a
 * phone at twice the text size, alone and inside its field in a page's own row, the larger target
 * when asked, a read-only value starting where a read-only field's words start and standing at the
 * field's height, or at the larger target when tall, centered at an inline stepper's row's end, and
 * kept in place with a button holding focus, hidden pieces kept hidden by sheets read without
 * :has(), an inline stepper's error above it and its hint below it, a field's control at its own
 * height beside a taller field in a page's own row, an inline stepper's label level with its
 * neighbor's there, focus handed to a read-only value or to the stepper itself and kept there as it
 * is taken down with a button focused, the keyboard, and no audit findings in either theme.
 */

const FIELDS = renderToStaticMarkup(
    <main>
        <h1>Round 3</h1>
        <StepperField id="bid" label="Ana's bid" min={0} max={10} defaultValue={9} inline />
        <StepperField
            id="players"
            label="Players"
            hint="From two to eight"
            subject="the number of players"
            min={2}
            max={8}
            defaultValue={2}
            tall
        />
        <form id="scores">
            <StepperField id="score" label="Score" min={-9} max={12} defaultValue={11} />
            <button type="reset">Reset</button>
        </form>
        <StepperField id="locked" label="Locked" min={0} max={10} defaultValue={5} disabled />
        <StepperField id="read" label="Rounds played" min={0} max={10} defaultValue={5} readOnly />
        <StepperField id="odd" label="Odd" min={1} max={10} step={2} defaultValue={7} />
        <StepperField id="one" label="Seats" min={3} max={3} defaultValue={3} />
        <StepperField
            id="hand"
            label="Cards in hand"
            hint="Up to ten"
            error="Play a card before you draw"
            min={0}
            max={10}
            defaultValue={3}
            inline
        />
    </main>
);

const ATTACH = `import { attachStepper } from './controls.js';
window.heard = [];
// Each stepper attached through its field and again through itself, which attaches it once.
for (const stepper of document.querySelectorAll('.dk-stepper')) {
    attachStepper(stepper.closest('.dk-field'));
    attachStepper(stepper);
}
document.addEventListener('input', (event) => window.heard.push('input ' + event.target.value));
document.addEventListener('change', (event) => window.heard.push('change ' + event.target.value));
// What takes a stepper away, which attaching it again returns.
window.detach = (id) => attachStepper(document.querySelector('#' + id).closest('.dk-stepper'))();
// Attaches a stepper again through its field and its stepper, in the order given.
window.attachAgain = (id, order) => {
    const stepper = document.querySelector('#' + id).closest('.dk-stepper');
    for (const through of order) attachStepper(through === 'field' ? stepper.closest('.dk-field') : stepper);
};
// The attach function itself, for a test that gives a stepper its options.
window.attachStepper = attachStepper;
window.ready = true;`;

const open = async (
    page: Page,
    {
        width = 390,
        theme = 'light',
        attach = true,
    }: {
        readonly width?: number;
        readonly theme?: 'light' | 'dark';
        readonly attach?: boolean;
    } = {}
): Promise<void> => {
    await page.setViewportSize({ width, height: 700 });
    await servePage(page, {
        title: 'Round 3',
        body: FIELDS,
        script: attach ? ATTACH : undefined,
        theme,
    });
    if (attach) await page.waitForFunction(() => 'ready' in window);
};

const bid = (page: Page): Locator => page.getByRole('spinbutton', { name: "Ana's bid" });
const lower = (page: Page): Locator => page.getByRole('button', { name: "Lower Ana's bid" });
const raise = (page: Page): Locator => page.getByRole('button', { name: "Raise Ana's bid" });

/**
 * Presses a button as a visitor does: by pointer, or in WebKit, where Safari gives a pressed button
 * no focus, by Enter on it, so a test of where focus stays tests the stepper and not the browser.
 */
const press = async (button: Locator, browserName: string): Promise<void> => {
    if (browserName === 'webkit') {
        await button.focus();
        await button.press('Enter');
    } else {
        await button.click();
    }
};

const line = (page: Page, id: string): Locator =>
    page.locator(`.dk-field:has(#${id}) .dk-stepper-status`);
const heard = (page: Page): Promise<string[]> =>
    page.evaluate(() => (window as unknown as { heard: string[] }).heard);

/**
 * Keeps every set of words a stepper's own line is given from here on, by a watch on the line
 * itself, so words said twice are kept twice. A test of silence stops the clock first and runs it
 * past the moment a line waits before its words are put in, since an empty line read any sooner is
 * empty whatever the stepper said.
 */
const record = (page: Page, id: string): Promise<void> =>
    line(page, id).evaluate((status) => {
        const said: string[] = [];
        (window as unknown as { said: string[] }).said = said;
        new MutationObserver(() => {
            if (status.textContent) said.push(status.textContent);
        }).observe(status, { childList: true, characterData: true, subtree: true });
    });
const said = (page: Page): Promise<string[]> =>
    page.evaluate(() => (window as unknown as { said: string[] }).said);
/** Longer than a line waits before its words are put in, so words on their way have landed. */
const PAST_THE_WAIT = 300;

test('shows the buttons only once attached, each named for what it does and to which field', async ({
    page,
}) => {
    await open(page, { attach: false });
    await expect(bid(page)).toBeVisible();
    await expect(page.locator('.dk-stepper-down').first()).toBeHidden();
    await open(page);
    await expect(lower(page)).toBeVisible();
    await expect(raise(page)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Raise the number of players' })).toBeVisible();
});

test('steps once a press, firing the events a typed value fires, and stops at the limits with focus kept', async ({
    page,
    browserName,
}) => {
    await open(page);
    await press(raise(page), browserName);
    await expect(bid(page)).toHaveValue('10');
    expect(await heard(page)).toEqual(['input 10', 'change 10']);
    // At the greatest value the raise button is off, keeps focus, and a press does nothing.
    await expect(raise(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(raise(page)).toBeFocused();
    // Pressed again from the keyboard, since a pointer's tools take an off button as not there.
    await page.keyboard.press('Enter');
    await expect(bid(page)).toHaveValue('10');
    expect(await heard(page)).toHaveLength(2);
    await expect(lower(page)).not.toHaveAttribute('aria-disabled');
    // At the least value it is the lower button that is off.
    await open(page);
    for (let step = 0; step < 9; step += 1) await press(lower(page), browserName);
    await expect(bid(page)).toHaveValue('0');
    await expect(lower(page)).toHaveAttribute('aria-disabled', 'true');
    await expect(lower(page)).toBeFocused();
    const players = page.getByRole('button', { name: 'Lower the number of players' });
    await expect(players).toHaveAttribute('aria-disabled', 'true');
});

test('says the value a press sets on its status line, since focus stays on the button', async ({
    page,
    browserName,
}) => {
    await open(page);
    await expect(line(page, 'bid')).toHaveText('');
    await press(lower(page), browserName);
    await expect(line(page, 'bid')).toHaveText('8');
    await expect(lower(page)).toBeFocused();
    // A pointer's press says its value too, in Safari's engine as well, where it gives no focus.
    await open(page);
    await lower(page).click();
    await expect(line(page, 'bid')).toHaveText('8');
    if (browserName === 'chromium') await expect(lower(page)).toBeFocused();
});

test('leaves a disabled field as it is, with both buttons off', async ({ page }) => {
    await open(page);
    const up = page.getByRole('button', { name: 'Raise Locked' });
    await expect(up).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('button', { name: 'Lower Locked' })).toHaveAttribute(
        'aria-disabled',
        'true'
    );
    await up.dispatchEvent('click');
    await expect(page.getByRole('spinbutton', { name: 'Locked' })).toHaveValue('5');
});

test('follows a value a form reset sets, and fires nothing for a press that changes nothing', async ({
    page,
}) => {
    await open(page);
    const score = page.getByRole('spinbutton', { name: 'Score' });
    const up = page.getByRole('button', { name: 'Raise Score' });
    await up.click();
    await expect(score).toHaveValue('12');
    await expect(up).toHaveAttribute('aria-disabled', 'true');
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(score).toHaveValue('11');
    await expect(up).not.toHaveAttribute('aria-disabled');
    // A value a script set past the limit is read again as the press lands, so nothing moves.
    await score.evaluate((input: HTMLInputElement) => {
        input.value = '12';
    });
    const before = (await heard(page)).length;
    await up.dispatchEvent('click');
    await expect(score).toHaveValue('12');
    expect(await heard(page)).toHaveLength(before);
});

test('reports a typed value outside the limits, or none where one is required, as a field reports an error, says it, and clears it once right', async ({
    page,
}) => {
    await open(page);
    await bid(page).fill('14');
    await bid(page).press('Tab');
    const error = page.locator('#bid-range');
    const said = 'Error: Enter a whole number from 0 to 10.';
    await expect(error).toBeVisible();
    await expect(error).toHaveText(said);
    await expect(bid(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(bid(page)).toHaveAccessibleDescription(said);
    // Focus has moved on, so the status line says the error too, after the field's name.
    await expect(line(page, 'bid')).toHaveText(`Ana's bid: ${said}`);
    // The error sits above the field, as every field's does.
    expect((await box(error, 'the error')).y).toBeLessThan((await box(bid(page), 'the value')).y);
    await bid(page).fill('6');
    await expect(error).toBeHidden();
    await expect(bid(page)).not.toHaveAttribute('aria-invalid');
    // The range in words describes it again once the error has gone.
    await expect(bid(page)).toHaveAttribute('aria-describedby', 'bid-limits');
    await expect(bid(page)).toHaveAccessibleDescription('From 0 to 10.');
    // An emptied field passes where it is not required, as the browser's constraints have it.
    await bid(page).fill('');
    await bid(page).press('Tab');
    await expect(error).toBeHidden();
    await expect(bid(page)).not.toHaveAttribute('aria-invalid');
    // A required one emptied is told the same as one outside the limits.
    await bid(page).evaluate((input: HTMLInputElement) => {
        input.required = true;
    });
    await bid(page).fill('6');
    await bid(page).press('Tab');
    await bid(page).fill('');
    await bid(page).press('Tab');
    await expect(error).toBeVisible();
    await expect(bid(page)).toHaveAttribute('aria-invalid', 'true');
    // Made optional by a script, with no input event, it passes and the error goes.
    await bid(page).evaluate((input: HTMLInputElement) => {
        input.required = false;
    });
    await expect(error).toBeHidden();
    await expect(bid(page)).not.toHaveAttribute('aria-invalid');
});

test('shows its error and says it once as focus leaves letters typed into a blank stepper', async ({
    page,
    browserName,
}) => {
    await stillClock(page.clock);
    await open(page);
    await record(page, 'bid');
    // Emptied and left, so the blank is the value the browser holds as settled.
    await bid(page).fill('');
    await bid(page).press('Tab');
    await page.clock.runFor(PAST_THE_WAIT);
    // Letters leave the value blank, so the browser fires no change as focus leaves. Firefox takes
    // any letters, where Chromium and Safari take only those a number may hold.
    await bid(page).focus();
    await bid(page).pressSequentially(browserName === 'firefox' ? 'abc' : 'e');
    await bid(page).press('Tab');
    await page.clock.runFor(PAST_THE_WAIT);
    const words = 'Error: Enter a whole number from 0 to 10.';
    await expect(page.locator('#bid-range')).toBeVisible();
    await expect(bid(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(bid(page)).toHaveAccessibleDescription(words);
    // Focus that comes back and leaves again with nothing changed says nothing more.
    await page.keyboard.press('Shift+Tab');
    await expect(bid(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await page.clock.runFor(PAST_THE_WAIT);
    expect(await said(page)).toEqual([`Ana's bid: ${words}`]);
    // A blank required field that focus only passes through stays quiet until it is changed.
    const players = page.getByRole('spinbutton', { name: 'Players' });
    await players.evaluate((input: HTMLInputElement) => {
        input.required = true;
        input.value = '';
    });
    await players.focus();
    await players.press('Tab');
    await page.clock.runFor(PAST_THE_WAIT);
    await expect(page.locator('#players-range')).toBeHidden();
    await expect(players).not.toHaveAttribute('aria-invalid');
});

test('names its field before the error it says as focus leaves a wrong value, and a press says the value alone', async ({
    page,
    browserName,
}) => {
    await open(page);
    const players = page.getByRole('spinbutton', { name: 'Players' });
    await players.fill('99');
    await players.press('Tab');
    const words = 'Error: Enter a whole number from 2 to 8.';
    // Named by its label, as a refused form names a field, and not by the subject its buttons use.
    await expect(line(page, 'players')).toHaveText(`Players: ${words}`);
    // The error drawn and the description keep the error alone, since the label names the field.
    await expect(page.locator('#players-range')).toHaveText(words);
    await expect(players).toHaveAccessibleDescription(`From two to eight ${words}`);
    // A press, with focus kept on its button, says the value alone.
    await players.fill('5');
    await press(page.getByRole('button', { name: 'Raise the number of players' }), browserName);
    await expect(line(page, 'players')).toHaveText('6');
});

test('takes a press on its own button straight after letters, with no error drawn in between', async ({
    page,
    browserName,
}) => {
    await open(page);
    await bid(page).fill('');
    await bid(page).press('Tab');
    await bid(page).focus();
    await bid(page).pressSequentially(browserName === 'firefox' ? 'abc' : 'e');
    // Every moment the error shows is kept, since an error drawn above the field as the press
    // starts moves the button out from under the pointer before it is released.
    await page.locator('#bid-range').evaluate((range: HTMLElement) => {
        const shown: boolean[] = [];
        (window as unknown as { shown: boolean[] }).shown = shown;
        new MutationObserver(() => {
            if (!range.hidden) shown.push(true);
        }).observe(range, { attributeFilter: ['hidden'] });
    });
    const at = await box(raise(page), 'the raise button');
    await page.mouse.move(at.x + at.width / 2, at.y + at.height / 2);
    await page.mouse.down();
    await page.mouse.up();
    await expect(bid(page)).toHaveValue(/^\d+$/);
    expect(await page.evaluate(() => (window as unknown as { shown: boolean[] }).shown)).toEqual(
        []
    );
});

test("leaves a mark the label hides out of the field's name it says", async ({ page }) => {
    await servePage(page, {
        title: 'Round 3',
        body: renderToStaticMarkup(
            <main>
                <h1>Round 3</h1>
                <StepperField id="bid" label="Bid" mark="required" min={0} max={10} />
            </main>
        ),
        script: ATTACH,
    });
    await page.waitForFunction(() => 'ready' in window);
    const marked = page.getByRole('spinbutton', { name: 'Bid' });
    await marked.fill('99');
    await marked.press('Tab');
    await expect(line(page, 'bid')).toHaveText('Bid: Error: Enter a whole number from 0 to 10.');
});

test('says nothing for letters as focus stays, or as the field is locked or shows an error of its own', async ({
    page,
    browserName,
}) => {
    await stillClock(page.clock);
    await open(page);
    await record(page, 'bid');
    await bid(page).fill('');
    await bid(page).press('Tab');
    await bid(page).focus();
    await bid(page).pressSequentially(browserName === 'firefox' ? 'abc' : 'e');
    // A blur with focus still on the value, as a switch of window gives, reports nothing.
    await bid(page).dispatchEvent('blur');
    await page.clock.runFor(PAST_THE_WAIT);
    await expect(page.locator('#bid-range')).toBeHidden();
    // Made read only while holding letters, the field shows no error as focus leaves it.
    await bid(page).evaluate((input: HTMLInputElement) => {
        input.readOnly = true;
    });
    await page.keyboard.press('Tab');
    await page.clock.runFor(PAST_THE_WAIT);
    await expect(page.locator('#bid-range')).toBeHidden();
    // A field that shows an error of the page's own is not given a second one.
    const hand = page.getByRole('spinbutton', { name: 'Cards in hand' });
    await hand.fill('');
    await hand.press('Tab');
    await hand.focus();
    await hand.pressSequentially(browserName === 'firefox' ? 'abc' : 'e');
    await hand.press('Tab');
    await page.clock.runFor(PAST_THE_WAIT);
    await expect(page.locator('#hand-range')).toBeHidden();
    expect(await said(page)).toEqual([]);
});

test('clears an error for a value between steps, and marks its buttons again, as a script changes the step', async ({
    page,
}) => {
    await open(page);
    const error = page.locator('#bid-range');
    const up = raise(page);
    await bid(page).evaluate((input: HTMLInputElement) => {
        input.step = '7';
    });
    await bid(page).fill('8');
    await bid(page).press('Tab');
    // Between steps of 7, and past 7, the last a press reaches under 10, so the button is off.
    await expect(error).toBeVisible();
    await expect(up).toHaveAttribute('aria-disabled', 'true');
    await bid(page).evaluate((input: HTMLInputElement) => {
        input.step = '2';
    });
    await expect(error).toBeHidden();
    await expect(bid(page)).not.toHaveAttribute('aria-invalid');
    await expect(up).not.toHaveAttribute('aria-disabled');
});

test("keeps a page's own hint and error in place through its own error", async ({ page }) => {
    await open(page);
    const players = page.getByRole('spinbutton', { name: 'Players' });
    await players.fill('1');
    await players.press('Tab');
    await expect(players).toHaveAttribute('aria-describedby', 'players-hint players-range');
    await players.fill('3');
    await expect(players).toHaveAttribute('aria-describedby', 'players-hint players-limits');
    // An error the page draws after attaching keeps its place and its invalid state.
    await page.evaluate(() => {
        const input = document.querySelector('#players');
        const error = document.createElement('p');
        error.className = 'dk-field-error';
        error.id = 'players-error';
        error.textContent = 'Ana is already playing.';
        input?.closest('.dk-field')?.insertBefore(error, input.closest('.dk-stepper'));
        input?.setAttribute('aria-describedby', 'players-hint players-error');
        input?.setAttribute('aria-invalid', 'true');
    });
    await players.fill('9');
    await players.press('Tab');
    await expect(players).toHaveAttribute(
        'aria-describedby',
        'players-hint players-error players-range'
    );
    await players.fill('4');
    await expect(players).toHaveAttribute(
        'aria-describedby',
        'players-hint players-error players-limits'
    );
    await expect(players).toHaveAttribute('aria-invalid', 'true');
});

test('asks a phone for a keyboard with a minus only where the least value is below nothing', async ({
    page,
}) => {
    await open(page);
    await expect(bid(page)).toHaveAttribute('inputmode', 'numeric');
    await expect(page.getByRole('spinbutton', { name: 'Score' })).not.toHaveAttribute('inputmode');
});

test('keeps its width as the value changes, with figures of one width', async ({ page }) => {
    await open(page);
    expect(await style(bid(page), 'font-variant-numeric', 'text-align')).toEqual({
        'font-variant-numeric': 'tabular-nums',
        'text-align': 'center',
    });
    const nine = await box(page.locator('.dk-stepper').first(), 'the stepper');
    await raise(page).click();
    const ten = await box(page.locator('.dk-stepper').first(), 'the stepper');
    expect(ten.width).toBe(nine.width);
    // Two figures fit inside the value without being cut.
    expect(await bid(page).evaluate((input) => input.scrollWidth - input.clientWidth)).toBe(0);
});

test("sits on one line with its label beside it at a phone's narrowest width", async ({ page }) => {
    await open(page, { width: 320 });
    const label = await box(page.getByText("Ana's bid", { exact: true }), 'the label');
    const middle = (drawn: { y: number; height: number }) => drawn.y + drawn.height / 2;
    for (const part of [lower(page), bid(page), raise(page)]) {
        const drawn = await box(part, 'a part');
        expect(Math.abs(middle(drawn) - middle(label))).toBeLessThanOrEqual(2);
        expect(drawn.x).toBeGreaterThan(label.x);
    }
    expect(await sideways(page)).toBe(0);
});

test('shows every figure of its value under the wider spacing a reader may set', async ({
    page,
}) => {
    await open(page);
    await page.addStyleTag({ content: `${SPACED} #players { --dk-stepper-digits: 3 }` });
    await bid(page).fill('10');
    await page.locator('#players').fill('100');
    await page.locator('#score').fill('-9');
    expect(await cutOff(page, '.dk-stepper-value')).toEqual([]);
});

test('fits a phone at twice the text size, its buttons and its value whole', async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    for (const width of [320, 390]) {
        await open(page, { width });
        await textSize(page, 2);
        expect(await sideways(page), String(width)).toBe(0);
        expect(await cutOff(page, '.dk-stepper-value'), String(width)).toEqual([]);
        // A read-only stepper shows no buttons to fit, and every other is measured, by name.
        const shown = page.locator('.dk-stepper:has(.dk-stepper-up:not([hidden]))');
        expect(
            await shown
                .locator('.dk-stepper-value')
                .evaluateAll((values) => values.map(({ id }) => id)),
            String(width)
        ).toEqual(['bid', 'players', 'score', 'locked', 'odd', 'one', 'hand']);
        for (const stepper of await shown.all()) {
            const field = await box(stepper.locator('xpath=..'), 'the field');
            const last = await box(stepper.locator('.dk-stepper-up'), 'the raise button');
            expect(last.x + last.width, String(width)).toBeLessThanOrEqual(
                field.x + field.width + 1
            );
            const id = await stepper.locator('.dk-stepper-value').getAttribute('id');
            const tall = (await stepper.getAttribute('class'))?.includes('dk-stepper-tall');
            // The one tall stepper is held to the larger target, and not to the usual one.
            expect(tall, id ?? '').toBe(id === 'players');
            const buttons = await stepper.locator('.dk-button').all();
            expect(buttons, id ?? '').toHaveLength(2);
            for (const button of buttons) {
                const pressed = await box(button, 'a button');
                expect(pressed.width, String(width)).toBeGreaterThanOrEqual(44);
                // The target and the larger target, in rems, at twice the text size.
                expect(pressed.height, String(width)).toBeGreaterThanOrEqual(
                    (tall ? 3.5 : 2.75) * 32 - 1
                );
            }
        }
    }
});

test("narrows its buttons to fit a narrow place, never under the usual text size's target", async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    await open(page, { width: 390 });
    await textSize(page, 2);
    /*
     * A copy of the tall stepper and of the inline one, each in an app's dock and in a column of
     * its own, the first narrower than the buttons' full targets and the second narrower than the
     * buttons can go.
     */
    const measured = await page.evaluate(() =>
        [320, 240].flatMap((room) =>
            ['players', 'bid'].map((id) => {
                const dock = document.createElement('div');
                dock.className = 'dk-app-dock';
                const column = document.createElement('div');
                column.style.width = `${String(room)}px`;
                column.append(dock);
                const field = document.querySelector(`.dk-field:has(#${id})`);
                const copy = field?.cloneNode(true);
                if (!(copy instanceof HTMLElement)) throw new Error(`no field for ${id}`);
                dock.append(copy);
                document.body.append(column);
                const up = copy.querySelector('.dk-stepper-up')?.getBoundingClientRect();
                const inside = dock.getBoundingClientRect();
                const widths = [...copy.querySelectorAll('.dk-stepper > .dk-button')].map(
                    (button) => button.getBoundingClientRect().width
                );
                column.remove();
                return {
                    room,
                    id,
                    fits: (up?.right ?? Infinity) <= inside.right + 1,
                    widths,
                };
            })
        )
    );
    for (const { room, id, fits, widths } of measured) {
        const where = `${id} in ${String(room)}px`;
        expect(widths, where).toHaveLength(2);
        for (const width of widths) {
            expect(width, where).toBeGreaterThanOrEqual(44 - 0.5);
            expect(width, where).toBeLessThan(3.5 * 32);
        }
        if (room === 320) expect(fits, where).toBe(true);
    }
    // In the narrower room the tall stepper's buttons rest at the floor rather than under it.
    const floor = measured.find(({ room, id }) => room === 240 && id === 'players');
    expect(floor?.widths, 'the tall stepper in 240px').toHaveLength(2);
    for (const width of floor?.widths ?? []) expect(width).toBeLessThanOrEqual(44 + 0.5);
});

test('fits a dialog and a sheet on a phone 320px wide at twice the text size', async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    await open(page, { width: 320 });
    await textSize(page, 2);
    for (const form of ['dk-dialog', 'dk-dialog dk-dialog-sheet']) {
        for (const id of ['players', 'bid']) {
            const measured = await page.evaluate(
                ([kind, field]) => {
                    const dialog = document.createElement('dialog');
                    dialog.className = kind;
                    const copy = document
                        .querySelector(`.dk-field:has(#${field})`)
                        ?.cloneNode(true);
                    if (!(copy instanceof HTMLElement)) throw new Error(`no field for ${field}`);
                    dialog.append(copy);
                    document.body.append(dialog);
                    dialog.showModal();
                    const up = copy.querySelector('.dk-stepper-up')?.getBoundingClientRect();
                    const value = copy.querySelector<HTMLInputElement>('.dk-stepper-value');
                    // The dialog's content edge, inside its padding, which a stepper must not cross.
                    const edge =
                        dialog.getBoundingClientRect().right -
                        parseFloat(getComputedStyle(dialog).paddingRight) -
                        parseFloat(getComputedStyle(dialog).borderRightWidth);
                    const result = {
                        fits: (up?.right ?? Infinity) <= edge + 0.5,
                        sideways: dialog.scrollWidth - dialog.clientWidth,
                        clipped: value ? value.scrollWidth > value.clientWidth : true,
                    };
                    dialog.close();
                    dialog.remove();
                    return result;
                },
                [form, id] as const
            );
            expect(measured, `${id} in ${form}`).toEqual({
                fits: true,
                sideways: 0,
                clipped: false,
            });
        }
    }
});

/** Two text fields in a page's own row, the first label long enough to wrap at a phone's width. */
const PAIR = renderToStaticMarkup(
    <div className="pair">
        <InputField id="first" label="First name, as it is printed on the card" />
        <InputField id="last" label="Last name" />
    </div>
);

/**
 * A text field beside a stepper's field in a column only as wide as it needs, the text field's
 * label wrapping in the room the stepper leaves at a phone's width and twice the text size.
 */
/**
 * A text field with a label long enough to wrap beside an inline stepper, whose label lines up
 * with the text field's at the top of the row.
 */
const INLINE = renderToStaticMarkup(
    <div className="pair">
        <InputField id="player" label="The player who deals this round" />
        <StepperField id="tricks" label="Tricks" min={0} max={10} defaultValue={2} inline />
    </div>
);

const BESIDE = renderToStaticMarkup(
    <div className="beside">
        <InputField id="table" label="Table name" />
        <StepperField id="seats" label="Seats" min={2} max={8} defaultValue={4} />
    </div>
);

test("keeps each field's control at its own height beside a taller field in a page's own row", async ({
    page,
    browserName,
}) => {
    /*
     * Each field's controls in the row, a stepper's buttons among them, and the same field's drawn
     * alone under the row at the same width, so a field stretched to its row's height shows as a
     * taller control than its own.
     */
    const measure = () =>
        page.evaluate(() =>
            [...document.querySelectorAll<HTMLElement>(':is(.pair, .beside) > .dk-field')].map(
                (field) => {
                    const heights = (of: HTMLElement) =>
                        [...of.querySelectorAll('.dk-input, .dk-stepper > .dk-button')].map(
                            (control) => Math.round(control.getBoundingClientRect().height)
                        );
                    const alone = field.cloneNode(true);
                    if (!(alone instanceof HTMLElement)) throw new Error('no copy');
                    alone.style.width = `${String(field.getBoundingClientRect().width)}px`;
                    field.closest('main')?.append(alone);
                    const result = {
                        field: field.querySelector('input')?.id,
                        heights: heights(field),
                        alone: heights(alone),
                    };
                    alone.remove();
                    return result;
                }
            )
        );
    const serve = async (width: number, body: string) => {
        await page.setViewportSize({ width, height: 700 });
        await servePage(page, {
            title: 'Round 3',
            css:
                '.pair, .beside { display: grid; gap: var(--dk-space-3); }' +
                ' .pair { grid-template-columns: 1fr 1fr; } .beside { grid-template-columns: 1fr auto; }',
            body: `<main><h1>Round 3</h1>${body}</main>`,
            script: `import { attachStepper } from './controls.js';
for (const stepper of document.querySelectorAll('.dk-stepper')) attachStepper(stepper);
window.ready = true;`,
        });
        await page.waitForFunction(() => 'ready' in window);
    };

    await serve(390, PAIR);
    const labels = await page
        .locator('.pair .dk-field-label')
        .evaluateAll((all) => all.map((label) => label.getBoundingClientRect().height));
    // The first label wraps, so the row is taller than the second field needs.
    expect(labels[0] ?? 0).toBeGreaterThan((labels[1] ?? 0) + 4);
    const same = async () => {
        for (const { field, heights, alone } of await measure()) {
            expect(heights.length, String(field)).toBeGreaterThan(0);
            expect(heights, String(field)).toEqual(alone);
        }
    };
    await same();

    await serve(390, INLINE);
    const tops = await page
        .locator('.pair .dk-field-label')
        .evaluateAll((all) => all.map((label) => label.getBoundingClientRect().top));
    // The inline stepper's label stands level with the text field's, at the top of the row.
    expect(Math.abs((tops[0] ?? 0) - (tops[1] ?? Infinity))).toBeLessThan(0.5);
    await same();

    await serve(320, BESIDE);
    await doubled(page, browserName);
    const beside = await page
        .locator('.beside .dk-field-label')
        .evaluateAll((all) => all.map((label) => label.getBoundingClientRect().height));
    // The text field's label wraps, so the row is taller than the stepper's field needs.
    expect(beside[0] ?? 0).toBeGreaterThan((beside[1] ?? 0) + 4);
    await same();
});

/** A row of the page's own, as a page lays out a stepper's field beside a text field. */
const ROW_CSS =
    '.row { display: flex; align-items: end; gap: var(--dk-space-2); padding-inline: var(--dk-space-4); }';

/** A stepper's field and a text field in a row of the page's own, attached, at 320 wide. */
const openRow = async (page: Page, stepper: string): Promise<void> => {
    await page.setViewportSize({ width: 320, height: 700 });
    await servePage(page, {
        title: 'Round 3',
        css: ROW_CSS,
        body: `<main><h1>Round 3</h1><div class="row">${stepper}${renderToStaticMarkup(
            <InputField label="Player" />
        )}</div></main>`,
        script: ATTACH,
    });
    await page.waitForFunction(() => 'ready' in window);
};

for (const scale of [1, 2]) {
    test(`keeps a stepper inside its field beside a text field in a page's own row at ${String(scale)}x the text size`, async ({
        page,
        browserName,
    }) => {
        await openRow(
            page,
            renderToStaticMarkup(
                <StepperField id="bid" label="Bid" min={0} max={10} defaultValue={3} />
            )
        );
        if (scale === 2) await doubled(page, browserName);
        const placed = await page.locator('.row').evaluate((row) => {
            const field = row.querySelector('.dk-field')?.getBoundingClientRect();
            const stepper = row.querySelector('.dk-stepper')?.getBoundingClientRect();
            const buttons = [...row.querySelectorAll('.dk-stepper > .dk-button')].map((button) =>
                button.getBoundingClientRect()
            );
            return {
                inside:
                    !!field &&
                    !!stepper &&
                    stepper.left >= field.left - 0.5 &&
                    stepper.right <= field.right + 0.5,
                past: buttons.filter(
                    (button) =>
                        !field || button.left < field.left - 0.5 || button.right > field.right + 0.5
                ).length,
                widths: buttons.map((button) => button.width),
                heights: buttons.map((button) => button.height),
            };
        });
        // The stepper and both its buttons within the field, at least 44 wide and the target tall.
        expect(placed.inside, 'the stepper inside its field').toBe(true);
        expect(placed.past, 'buttons past the field').toBe(0);
        expect(placed.widths).toHaveLength(2);
        for (const width of placed.widths) expect(width).toBeGreaterThanOrEqual(44 - 0.5);
        // The target, in rems, at the text size.
        for (const height of placed.heights) {
            expect(height).toBeGreaterThanOrEqual(2.75 * 16 * scale - 1);
        }
        expect(await sideways(page)).toBe(0);
    });
}

test("widens a stepper's field for its stepper alone, not for words in its hint that never wrap", async ({
    page,
    browserName,
}) => {
    await openRow(
        page,
        renderToStaticMarkup(
            <StepperField
                id="bid"
                label="Bid"
                hint={
                    <>
                        Saved as{' '}
                        <code style={{ whiteSpace: 'nowrap' }}>round-three-bid-of-ana</code>
                    </>
                }
                min={0}
                max={10}
                defaultValue={3}
            />
        )
    );
    await doubled(page, browserName);
    const measured = await page.locator('.row').evaluate((row) => {
        const field = row.querySelector('.dk-field');
        const value = row.querySelector('.dk-stepper-value');
        const stepper = row.querySelector('.dk-stepper');
        const other = row.querySelector('.dk-field:last-child');
        if (!field || !value || !stepper || !other) throw new Error('the row is not drawn');
        const gap = parseFloat(getComputedStyle(stepper).columnGap);
        const edge =
            row.getBoundingClientRect().right - parseFloat(getComputedStyle(row).paddingRight);
        const box = field.getBoundingClientRect();
        const within = (part: Element) => {
            const drawn = part.getBoundingClientRect();
            return drawn.left >= box.left - 0.5 && drawn.right <= box.right + 0.5;
        };
        return {
            field: box.width,
            inside: within(stepper),
            past: [...stepper.querySelectorAll(':scope > .dk-button')].filter(
                (button) => !within(button)
            ).length,
            // The stepper's least width: its buttons at 44 wide, its value and the space between.
            least: 2 * 44 + value.getBoundingClientRect().width + 2 * gap,
            otherInside: other.getBoundingClientRect().right <= edge + 0.5,
        };
    });
    // The squeezed row leaves the field its stepper's least width and the text field its room.
    expect(measured.inside, 'the stepper inside its field').toBe(true);
    expect(measured.past, 'buttons past the field').toBe(0);
    expect(measured.field).toBeLessThanOrEqual(measured.least + 1);
    expect(measured.otherInside, 'the text field inside the row').toBe(true);
});

test('empties its status line once the value is typed over, and once it is taken away', async ({
    page,
}) => {
    await open(page);
    await raise(page).click();
    await expect(line(page, 'bid')).not.toHaveText('');
    // Typed over, the value a press said is no longer the value, so the line says nothing.
    await bid(page).fill('4');
    await expect(line(page, 'bid')).toHaveText('');
    await raise(page).click();
    await expect(line(page, 'bid')).toHaveText('5');
    await page.evaluate(() => {
        (window as unknown as { detach: (id: string) => void }).detach('bid');
    });
    await expect(line(page, 'bid')).toHaveText('');
});

test('empties its status line when its form is reset', async ({ page }) => {
    await open(page);
    const score = page.getByRole('spinbutton', { name: 'Score' });
    await page.getByRole('button', { name: 'Lower Score' }).click();
    await expect(line(page, 'score')).toHaveText('10');
    await page.getByRole('button', { name: 'Reset' }).click();
    await expect(score).toHaveValue('11');
    await expect(line(page, 'score')).toHaveText('');
});

test('stands its value level with its buttons, tall or not, and takes a tap at once', async ({
    page,
}) => {
    await open(page);
    // The buttons stretch to the row, so each is held to the target as well as to the other.
    for (const [field, target] of [
        ['bid', 44],
        ['players', 56],
    ] as const) {
        const stepper = page.locator(`.dk-field:has(#${field}) .dk-stepper`);
        const value = await box(stepper.locator('.dk-stepper-value'), 'the value');
        const button = await box(stepper.locator('.dk-stepper-up'), 'a button');
        expect(value.height, field).toBeCloseTo(target, 0);
        expect(button.height, field).toBeCloseTo(target, 0);
        expect(
            (await style(stepper.locator('.dk-stepper-up'), 'touch-action'))['touch-action'],
            field
        ).toBe('manipulation');
    }
});

test("draws its buttons the target wide, at the field's height on a wide page and the target's on a phone, and at the larger target when tall", async ({
    page,
}) => {
    for (const [width, height] of [
        [1280, 36],
        [390, 44],
    ] as const) {
        await open(page, { width });
        for (const [name, wide, tall] of [
            ["Raise Ana's bid", 44, height],
            ['Raise the number of players', 56, 56],
        ] as const) {
            const drawn = await box(page.getByRole('button', { name }), name);
            expect(drawn.width, `${name} at ${String(width)}`).toBeCloseTo(wide, 0);
            expect(drawn.height, `${name} at ${String(width)}`).toBeCloseTo(tall, 0);
        }
    }
});

test('takes the keyboard through lower, the value and raise, pressing by Space and Enter', async ({
    page,
    browserName,
}) => {
    await open(page);
    await page.keyboard.press(tabKey(browserName));
    await expect(lower(page)).toBeFocused();
    await page.keyboard.press(tabKey(browserName));
    await expect(bid(page)).toBeFocused();
    await page.keyboard.press(tabKey(browserName));
    await expect(raise(page)).toBeFocused();
    await page.keyboard.press(`Shift+${tabKey(browserName)}`);
    await page.keyboard.press(`Shift+${tabKey(browserName)}`);
    await page.keyboard.press('Space');
    await expect(bid(page)).toHaveValue('8');
    await page.keyboard.press('Enter');
    await expect(bid(page)).toHaveValue('7');
});

for (const theme of ['light', 'dark'] as const) {
    test(`has no audit findings in the ${theme} theme`, async ({ page }) => {
        await open(page, { theme });
        await raise(page).click();
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });
}

test('hides its buttons when taken away, and steps once a press when attached again in either order', async ({
    page,
    browserName,
}) => {
    await open(page);
    await page.evaluate(() => {
        (window as unknown as { detach: (id: string) => void }).detach('bid');
    });
    await expect(lower(page)).toBeHidden();
    await expect(raise(page)).toBeHidden();
    // From a value clear of both limits, so a second step would show and not stop at one.
    for (const [order, button, value] of [
        [['field', 'stepper'], raise, '6'],
        [['stepper', 'field'], lower, '4'],
    ] as const) {
        await page.evaluate(
            ([given]) => {
                const kit = window as unknown as {
                    attachAgain: (id: string, order: readonly string[]) => void;
                    detach: (id: string) => void;
                    heard: string[];
                };
                kit.detach('bid');
                kit.attachAgain('bid', given);
                const field = document.querySelector<HTMLInputElement>('#bid');
                if (field) field.value = '5';
                kit.heard.length = 0;
            },
            [order] as const
        );
        await press(button(page), browserName);
        // One step, and one input and one change, where listeners left behind would step twice.
        await expect(bid(page), order.join(' then ')).toHaveValue(value);
        expect(await heard(page), order.join(' then ')).toEqual([
            `input ${value}`,
            `change ${value}`,
        ]);
    }
});

test('draws a read-only stepper with no buttons, its value read as a field drawn read only', async ({
    page,
}) => {
    await open(page);
    const read = page.getByRole('spinbutton', { name: 'Rounds played' });
    await expect(read).toHaveValue('5');
    await expect(read).toHaveAttribute('readonly', '');
    await expect(page.getByRole('button', { name: /Rounds played/ })).toHaveCount(0);
});

/**
 * How far into the element its words are drawn, in CSS pixels: the first column of its picture
 * holding a pixel as dark as text, so it measures what is drawn rather than the box's sums.
 */
const inkStart = async (page: Page, locator: Locator): Promise<number> => {
    await locator.scrollIntoViewIfNeeded();
    const drawn = await box(locator, 'the field');
    const picture = await page.screenshot({ clip: drawn, scale: 'css' });
    return page.evaluate(async (data) => {
        const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
        const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('expected a canvas to draw on');
        context.drawImage(bitmap, 0, 0);
        const {
            data: pixels,
            width,
            height,
        } = context.getImageData(0, 0, bitmap.width, bitmap.height);
        for (let x = 0; x < width; x += 1) {
            for (let y = 0; y < height; y += 1) {
                const at = (y * width + x) * 4;
                const light = (pixels[at] ?? 0) + (pixels[at + 1] ?? 0) + (pixels[at + 2] ?? 0);
                if (light < 3 * 128) return x;
            }
        }
        return -1;
    }, picture.toString('base64'));
};

const READ_ONLY = renderToStaticMarkup(
    <main>
        <h1>Round 3</h1>
        <InputField id="score" label="Score" defaultValue="42" readOnly />
        <ValueField id="dealer" label="Dealer" defaultValue="Ann deals" />
        <StepperField id="cards" label="Cards each" min={1} max={10} defaultValue={3} readOnly />
        <StepperField id="seats" label="Seats" min={2} max={8} defaultValue={4} readOnly tall />
        <StepperField id="deals" label="Deals" min={1} max={10} defaultValue={3} />
        <StepperField id="held" label="Held" min={1} max={10} defaultValue={3} />
        <StepperField
            id="tricks"
            label="Tricks"
            min={0}
            max={10}
            defaultValue={3}
            readOnly
            inline
        />
        <StepperField id="bids" label="Bids" min={0} max={10} defaultValue={3} inline />
    </main>
);

/** The read-only page, in an app's frame when asked, attached, at the width and text size given. */
const openReadOnly = async (
    page: Page,
    {
        width,
        scale = 1,
        app = false,
        script = ATTACH,
    }: { width: number; scale?: number; app?: boolean; script?: string }
): Promise<void> => {
    await page.setViewportSize({ width, height: 900 });
    await servePage(page, {
        title: 'Round 3',
        body: app
            ? `<div class="dk-app"><div class="dk-app-body">${READ_ONLY}</div></div>`
            : READ_ONLY,
        script,
    });
    await page.waitForFunction(() => 'ready' in window);
    await textSize(page, scale);
};

test("lines a read-only stepper's value up with a read-only field's, at a field's height", async ({
    page,
    browserName,
}) => {
    const sizes = [
        { width: 390, scale: 1, app: false },
        { width: 1280, scale: 1, app: false },
        // In an app's frame a field stands at the target's height on a wide screen too.
        { width: 1280, scale: 1, app: true },
        // Twice the text size, set through Chromium, where a field's inline padding passes the
        // held one that an editable value keeps.
        ...(browserName === 'chromium' ? [{ width: 390, scale: 2, app: false }] : []),
    ];
    for (const size of sizes) {
        const at = `${String(size.width)} at ${String(size.scale)}x${size.app ? ' in an app' : ''}`;
        await openReadOnly(page, size);
        const field = page.locator('#score');
        const value = page.locator('#cards');
        const [fieldBox, valueBox] = [await box(field), await box(value)];
        expect.soft(valueBox.x, at).toBeCloseTo(fieldBox.x, 0);
        const [fieldInk, valueInk] = [await inkStart(page, field), await inkStart(page, value)];
        expect(Math.min(fieldInk, valueInk), `${at}, both drawn`).toBeGreaterThan(0);
        // The mono face and the body face leave a pixel or so of different room before a first
        // figure.
        expect.soft(Math.abs(valueInk - fieldInk), at).toBeLessThanOrEqual(2);
        expect.soft(valueBox.height, at).toBeCloseTo(fieldBox.height, 0);
        // A value of words beside them starts its words where the field does, at its height. A
        // letter and a figure leave a pixel or so of different room before themselves, by face.
        const words = page.locator('#dealer');
        expect.soft((await box(words)).x, `${at}, words`).toBeCloseTo(fieldBox.x, 0);
        expect
            .soft(Math.abs((await inkStart(page, words)) - fieldInk), `${at}, words`)
            .toBeLessThanOrEqual(2);
        expect.soft((await box(words)).height, `${at}, words`).toBeCloseTo(fieldBox.height, 0);
        // An inline stepper's value sits at its row's end, after its label, with no column of
        // values to line up with, so a read-only one keeps an editable value's centered figures
        // and its height.
        const [inline, editable] = [page.locator('#tricks'), page.locator('#bids')];
        expect
            .soft((await box(inline)).width, `${at}, inline`)
            .toBeCloseTo((await box(editable)).width, 0);
        expect
            .soft((await box(inline)).height, `${at}, inline`)
            .toBeCloseTo((await box(editable)).height, 0);
        expect
            .soft(Math.abs((await inkStart(page, inline)) - (await inkStart(page, editable))), at)
            .toBeLessThanOrEqual(1);
    }
});

test("keeps a tall read-only stepper's larger target, its figures at a field's padding", async ({
    page,
}) => {
    for (const width of [390, 1280]) {
        await openReadOnly(page, { width });
        const field = page.locator('#score');
        const value = page.locator('#seats');
        expect.soft((await box(value)).height, String(width)).toBeCloseTo(56, 0);
        const [fieldInk, valueInk] = [await inkStart(page, field), await inkStart(page, value)];
        expect(Math.min(fieldInk, valueInk), `${String(width)}, both drawn`).toBeGreaterThan(0);
        // The larger figure leaves a little more room before itself than the field's words do.
        expect.soft(Math.abs(valueInk - fieldInk), String(width)).toBeLessThanOrEqual(3);
    }
});

test('keeps the value and a focused button where they stood as the field turns read only', async ({
    page,
    browserName,
}) => {
    const sizes = [
        // A laptop's width, in every engine, where a read-only value shown alone takes a field's
        // padding but one beside a button keeps an editable value's.
        { width: 1280, scale: 1 },
        // Twice the text size, set through Chromium, where a read-only value shown alone takes a
        // field's wider padding.
        ...(browserName === 'chromium' ? [{ width: 390, scale: 2 }] : []),
    ];
    for (const size of sizes) {
        const at = `${String(size.width)} at ${String(size.scale)}x`;
        await openReadOnly(page, size);
        const raiseHeld = page.getByRole('button', { name: 'Raise Held' });
        const held = page.locator('#held');
        await raiseHeld.focus();
        const [valueBefore, buttonBefore] = [await box(held), await box(raiseHeld)];
        await held.evaluate((input: HTMLInputElement) => {
            input.readOnly = true;
        });
        await expect(raiseHeld).toHaveAttribute('aria-disabled', 'true');
        await expect(raiseHeld).toBeFocused();
        await expect(page.getByRole('button', { name: 'Lower Held' })).toBeHidden();
        const [value, button] = [await box(held), await box(raiseHeld)];
        // Nothing moves under the focused button, and the value keeps an editable one's size.
        expect.soft(value.x, at).toBeCloseTo(valueBefore.x, 0);
        expect.soft(button.x, at).toBeCloseTo(buttonBefore.x, 0);
        const open = await box(page.locator('#deals'));
        expect.soft(value.width, at).toBeCloseTo(open.width, 0);
        expect.soft(value.height, at).toBeCloseTo(open.height, 0);
    }
});

test('keeps hidden pieces hidden and a value beside a focused button level with it, without :has()', async ({
    page,
}) => {
    await openReadOnly(page, { width: 1280 });
    // The kit's sheets as a browser without :has() reads them, a selector naming it left unknown,
    // which drops a rule it is in outside a forgiving list. Only the kit's part of the sheet served
    // is swapped, so the page's own rules after it stay, and a page that loads the kit some other
    // way fails here rather than testing nothing.
    await page.evaluate(
        async ([kit, withoutHas]) => {
            const link = document.querySelector('link[href="/kit.css"]');
            if (!link) throw new Error('expected the kit sheet linked as /kit.css');
            const served = await (await fetch('/kit.css')).text();
            if (!served.startsWith(kit))
                throw new Error('expected the served sheet to open with the kit');
            const swapped = document.createElement('style');
            swapped.textContent = withoutHas + served.slice(kit.length);
            link.replaceWith(swapped);
        },
        [KIT, KIT.replaceAll(':has(', ':-dk-unknown(')] as const
    );
    // A read-only stepper's buttons, hidden by the stepper, drawn by the button's own display rule
    // unless the kit's rule for hidden holds.
    expect
        .soft(
            (await style(page.locator('.dk-field:has(#cards) .dk-stepper-up'), 'display'))[
                'display'
            ]
        )
        .toBe('none');
    const raiseHeld = page.getByRole('button', { name: 'Raise Held' });
    await raiseHeld.focus();
    await page.locator('#held').evaluate((input: HTMLInputElement) => {
        input.readOnly = true;
    });
    await expect(raiseHeld).toHaveAttribute('aria-disabled', 'true');
    // Level with the focused button, as every value is where :has() cannot tell one shown alone.
    expect
        .soft((await box(page.locator('#held'))).height)
        .toBeCloseTo((await box(raiseHeld)).height, 0);
});

test('keeps a focused button, marked off, when its field turns read only, and brings both back after', async ({
    page,
    browserName,
}) => {
    await open(page);
    const lowerBid = lower(page);
    await lowerBid.focus();
    await bid(page).evaluate((input: HTMLInputElement) => {
        input.readOnly = true;
    });
    // Followed as the field changes, with no focus moving, and the focused button kept.
    await expect(lowerBid).toHaveAttribute('aria-disabled', 'true');
    await expect(lowerBid).toBeFocused();
    await expect(raise(page)).toBeHidden();
    if (browserName === 'webkit') await press(lowerBid, browserName);
    else await lowerBid.click({ force: true });
    await expect(bid(page)).toHaveValue('9');
    // Once focus leaves it, the button goes too, and both come back as the field can change again.
    await bid(page).focus();
    await expect(lowerBid).toBeHidden();
    await bid(page).evaluate((input: HTMLInputElement) => {
        input.readOnly = false;
    });
    await expect(lowerBid).toBeVisible();
    await expect(raise(page)).toBeVisible();
    await press(lowerBid, browserName);
    await expect(bid(page)).toHaveValue('8');
});

test("sets an inline stepper's error above it and its hint below it", async ({ page }) => {
    await open(page, { width: 390 });
    const field = page.locator('.dk-field:has(#hand)');
    const error = await box(field.locator('.dk-field-error:not(.dk-stepper-range)'), 'the error');
    const stepper = await box(field.locator('.dk-stepper'), 'the stepper');
    const hint = await box(field.locator('.dk-field-hint'), 'the hint');
    expect(error.y + error.height).toBeLessThanOrEqual(stepper.y);
    expect(hint.y).toBeGreaterThanOrEqual(stepper.y + stepper.height);
});

test("describes the field by its range after the page's own description, and follows a new range", async ({
    page,
}) => {
    await open(page);
    const players = page.getByRole('spinbutton', { name: 'Players' });
    await expect(players).toHaveAccessibleDescription('From two to eight From 2 to 8.');
    await expect(bid(page)).toHaveAccessibleDescription('From 0 to 10.');
    // A page that changes the limits, as a round with more cards does, is followed.
    await bid(page).evaluate((input: HTMLInputElement) => {
        input.max = '3';
    });
    await expect(bid(page)).toHaveAccessibleDescription('From 0 to 3.');
    // Taken away, the field keeps only what the page gave it.
    await page.evaluate(() => {
        (window as unknown as { detach: (id: string) => void }).detach('bid');
    });
    await expect(bid(page)).not.toHaveAttribute('aria-describedby');
});

test('says when a press lands on a limit, with the value', async ({ page, browserName }) => {
    await open(page);
    await press(raise(page), browserName);
    await expect(line(page, 'bid')).toHaveText('10, the most');
    await open(page);
    for (let step = 0; step < 9; step += 1) await press(lower(page), browserName);
    await expect(line(page, 'bid')).toHaveText('0, the least');
    await press(raise(page), browserName);
    await expect(line(page, 'bid')).toHaveText('1');
});

test("says a page's words after the value in one message, on the page's own line when given", async ({
    page,
    browserName,
}) => {
    await open(page);
    await page.evaluate(() => {
        const { attachStepper } = window as unknown as {
            attachStepper: typeof import('../src/controls.js').attachStepper;
        };
        const own = document.createElement('p');
        own.id = 'page-status';
        own.setAttribute('role', 'status');
        document.body.append(own);
        let count = 0;
        const stepper = document.querySelector('#bid')?.closest<HTMLElement>('.dk-stepper');
        if (!stepper) throw new Error('no stepper');
        // Words drawn from the page's state, which the press has changed by the time they are read.
        document.querySelector('#bid')?.addEventListener('input', () => {
            count += 1;
        });
        attachStepper(stepper, { words: () => `Changed ${String(count)} times.` });
        (window as unknown as { giveLine: () => void }).giveLine = () => {
            attachStepper(stepper, { status: own, words: () => `Changed ${String(count)} times.` });
        };
    });
    await press(lower(page), browserName);
    await expect(line(page, 'bid')).toHaveText('8. Changed 1 times.');
    // Given a line of its own, the page hears each press there, and the stepper's line is quiet.
    await page.evaluate(() => {
        (window as unknown as { giveLine: () => void }).giveLine();
    });
    await press(lower(page), browserName);
    await expect(page.locator('#page-status')).toHaveText('7. Changed 2 times.');
    await expect(line(page, 'bid')).toHaveText('');
});

test('says the most at the last value a step reaches short of the greatest, and marks it', async ({
    page,
    browserName,
}) => {
    await open(page);
    const odd = page.getByRole('spinbutton', { name: 'Odd' });
    const up = page.getByRole('button', { name: 'Raise Odd' });
    await press(up, browserName);
    await expect(odd).toHaveValue('9');
    await expect(line(page, 'odd')).toHaveText('9, the most');
    await expect(up).toHaveAttribute('aria-disabled', 'true');
    // One value alone is described as that value.
    await expect(page.getByRole('spinbutton', { name: 'Seats' })).toHaveAccessibleDescription(
        'Only 3.'
    );
});

test('keeps an error the page shows after attaching, and one shown before it', async ({ page }) => {
    await open(page);
    // Shown by the page after attaching, as the site's live copy does for a value past its limit.
    await page.evaluate(() => {
        const input = document.querySelector<HTMLInputElement>('#bid');
        const range = document.querySelector<HTMLElement>('#bid-range');
        if (!input || !range) throw new Error('no stepper');
        input.value = '14';
        range.hidden = false;
        input.setAttribute('aria-describedby', 'bid-range');
    });
    await expect(page.locator('#bid-range')).toBeVisible();
    await expect(bid(page)).toHaveAttribute('aria-describedby', 'bid-range');
    // Shown before attaching, as a server that refused the value draws it.
    await page.evaluate(() => {
        const { attachStepper } = window as unknown as {
            attachStepper: typeof import('../src/controls.js').attachStepper;
        };
        const input = document.querySelector<HTMLInputElement>('#players');
        const range = document.querySelector<HTMLElement>('#players-range');
        const stepper = input?.closest<HTMLElement>('.dk-stepper');
        if (!input || !range || !stepper) throw new Error('no stepper');
        attachStepper(stepper)();
        input.value = '1';
        range.hidden = false;
        input.setAttribute('aria-describedby', 'players-hint players-range');
        attachStepper(stepper);
    });
    await expect(page.locator('#players-range')).toBeVisible();
    await expect(page.getByRole('spinbutton', { name: 'Players' })).toHaveAttribute(
        'aria-describedby',
        'players-hint players-range'
    );
});

/**
 * Takes a stepper away, gives it a value, and attaches it again, as a page draws it: as its value
 * alone, as the value a form's reset brings back too, or with a refusal the page sets of its own.
 */
const drawAndAttach = (
    page: Page,
    id: string,
    value: string,
    {
        asDefault = false,
        refusal = '',
    }: { readonly asDefault?: boolean; readonly refusal?: string } = {}
): Promise<void> =>
    page.evaluate(
        ({ to, at, kept, refused }) => {
            const { attachStepper } = window as unknown as {
                attachStepper: typeof import('../src/controls.js').attachStepper;
            };
            const input = document.querySelector<HTMLInputElement>(`#${to}`);
            const stepper = input?.closest<HTMLElement>('.dk-stepper');
            if (!input || !stepper) throw new Error('no stepper');
            attachStepper(stepper)();
            if (kept) input.defaultValue = at;
            input.value = at;
            input.setCustomValidity(refused);
            attachStepper(stepper);
        },
        { to: id, at: value, kept: asDefault, refused: refusal }
    );

test('shows its error at once, with nothing said, when attached past its limit, and clears it after', async ({
    page,
}) => {
    await stillClock(page.clock);
    await open(page);
    const attachWith = (id: string, value: string) => drawAndAttach(page, id, value);
    const error = page.locator('#bid-range');
    await record(page, 'bid');
    await attachWith('bid', '14');
    await expect(error).toBeVisible();
    await expect(bid(page)).toHaveAccessibleDescription(
        'Error: Enter a whole number from 0 to 10.'
    );
    await expect(bid(page)).toHaveAttribute('aria-invalid', 'true');
    await page.clock.runFor(PAST_THE_WAIT);
    expect(await said(page)).toEqual([]);
    // A value made right clears it.
    await bid(page).fill('6');
    await expect(error).toBeHidden();
    await expect(bid(page)).not.toHaveAttribute('aria-invalid');
    await expect(bid(page)).toHaveAccessibleDescription('From 0 to 10.');
    // A press is heard by the same watch, so the silence above is the stepper's and not the watch's.
    await lower(page).click();
    await page.clock.runFor(PAST_THE_WAIT);
    expect(await said(page)).toEqual(['5']);
    // Taking the stepper away clears it.
    await attachWith('bid', '-1');
    await expect(error).toBeVisible();
    await page.evaluate(() =>
        (window as unknown as { detach: (id: string) => void }).detach('bid')
    );
    await expect(error).toBeHidden();
    await expect(bid(page)).not.toHaveAttribute('aria-invalid');
    // A form's reset clears it.
    const score = page.getByRole('spinbutton', { name: 'Score' });
    await attachWith('score', '15');
    await expect(page.locator('#score-range')).toBeVisible();
    await expect(score).toHaveAttribute('aria-invalid', 'true');
    await page.getByRole('button', { name: 'Reset' }).click();
    // The stepper follows a reset a task after it.
    await page.clock.runFor(PAST_THE_WAIT);
    await expect(score).toHaveValue('11');
    await expect(page.locator('#score-range')).toBeHidden();
    await expect(score).not.toHaveAttribute('aria-invalid');
    // A blank field is not an error as the page loads.
    const players = page.getByRole('spinbutton', { name: 'Players' });
    await attachWith('players', '');
    await expect(page.locator('#players-range')).toBeHidden();
    await expect(players).not.toHaveAttribute('aria-invalid');
});

test("shows its error again when a form's reset brings back a value drawn past the limit", async ({
    page,
}) => {
    await stillClock(page.clock);
    await open(page);
    const score = page.getByRole('spinbutton', { name: 'Score' });
    const error = page.locator('#score-range');
    await drawAndAttach(page, 'score', '15', { asDefault: true });
    await expect(error).toBeVisible();
    await score.fill('5');
    await expect(error).toBeHidden();
    await expect(score).not.toHaveAttribute('aria-invalid');
    // A press is heard by the watch, so the silence after the reset is the stepper's own.
    await record(page, 'score');
    await page.getByRole('button', { name: 'Raise Score' }).click();
    await page.clock.runFor(PAST_THE_WAIT);
    expect(await said(page)).toEqual(['6']);
    await page.getByRole('button', { name: 'Reset' }).click();
    // The stepper follows a reset a task after it, and words it said then would land after that.
    await page.clock.runFor(PAST_THE_WAIT);
    await expect(score).toHaveValue('15');
    await expect(error).toBeVisible();
    await expect(score).toHaveAttribute('aria-invalid', 'true');
    await expect(score).toHaveAccessibleDescription('Error: Enter a whole number from -9 to 12.');
    await page.clock.runFor(PAST_THE_WAIT);
    expect(await said(page)).toEqual(['6']);
});

test('shows no error at attach on a field no one can change', async ({ page }) => {
    await open(page);
    // Disabled and read only, a value past the limit is not marked wrong, since no one can fix it.
    for (const id of ['locked', 'read']) {
        await drawAndAttach(page, id, '14');
        await expect(page.locator(`#${id}-range`)).toBeHidden();
        await expect(page.locator(`#${id}`)).not.toHaveAttribute('aria-invalid');
    }
});

test('leaves a refusal the page sets to the page, at attach and once changed', async ({ page }) => {
    await open(page);
    // A refusal the page sets on a value inside the limits is the page's to show, at attach and
    // once the value is changed.
    await drawAndAttach(page, 'bid', '5', { refusal: 'That bid is taken' });
    const error = page.locator('#bid-range');
    await expect(error).toBeHidden();
    await expect(bid(page)).not.toHaveAttribute('aria-invalid');
    await bid(page).fill('6');
    await bid(page).press('Tab');
    await expect(error).toBeHidden();
    await expect(bid(page)).not.toHaveAttribute('aria-invalid');
});

test("leaves the page's own error as the one shown when attached past its limit", async ({
    page,
}) => {
    await open(page);
    await drawAndAttach(page, 'hand', '14');
    await expect(page.locator('#hand-error')).toBeVisible();
    await expect(page.locator('#hand-range')).toBeHidden();
});

test("clears only its own words from a page's line, and says nothing once typed over or taken away", async ({
    page,
    browserName,
}) => {
    await stillClock(page.clock);
    await open(page);
    await page.evaluate(() => {
        const { attachStepper } = window as unknown as {
            attachStepper: typeof import('../src/controls.js').attachStepper;
        };
        const own = document.createElement('p');
        own.id = 'page-status';
        own.setAttribute('role', 'status');
        document.body.append(own);
        const stepper = document.querySelector('#bid')?.closest<HTMLElement>('.dk-stepper');
        if (!stepper) throw new Error('no stepper');
        attachStepper(stepper, { status: own });
    });
    const own = page.locator('#page-status');
    await press(lower(page), browserName);
    await page.clock.runFor(150);
    await expect(own).toHaveText('8');
    // Typed over, the stepper's words go from the page's line.
    await bid(page).fill('5');
    await expect(own).toHaveText('');
    // The page's own words stay when the value is typed over.
    await own.evaluate((line) => {
        line.textContent = 'Ann leads.';
    });
    await bid(page).fill('6');
    await expect(own).toHaveText('Ann leads.');
    // A press taken away before its words are said leaves them unsaid.
    await page.evaluate(() => {
        document
            .querySelector<HTMLButtonElement>('#bid')
            ?.closest('.dk-stepper')
            ?.querySelector<HTMLButtonElement>('.dk-stepper-down')
            ?.click();
        (window as unknown as { detach: (id: string) => void }).detach('bid');
    });
    // The press empties the line at once, as every line is emptied before its next words, and the
    // words it would have said are never put in.
    await page.clock.runFor(300);
    await expect(own).toHaveText('');
});

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
