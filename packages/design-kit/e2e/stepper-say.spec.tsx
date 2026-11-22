import { expect, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { StatusLine, StepperField } from '../src/react.js';
import { servePage, stillClock } from './page.js';

/*
 * A stepper speaking through a page's own `say`, as React's `useStatus` hands one, and a stepper
 * taken away and attached again from a page's own focusout handler, as a page that checks a field
 * as it is left and draws it again does, keeping its buttons once focus has settled.
 */

const BODY = renderToStaticMarkup(
    <main>
        <h1>Bid</h1>
        <StepperField id="bid" label="Bid" min={0} max={10} defaultValue={5} />
        <button type="button" id="after">
            After
        </button>
        <StatusLine className="screen-status" />
    </main>
);

const SCRIPT = `import { attachStatus, attachStepper } from './controls.js';
const stepper = document.querySelector('.dk-stepper');
const line = document.querySelector('.screen-status');
window.heard = [];
new MutationObserver(() => {
    if (line.textContent) window.heard.push(line.textContent);
}).observe(line, { childList: true, characterData: true, subtree: true });
const say = attachStatus(line);
attachStepper(stepper, { say });
window.attachStepper = attachStepper;
window.stepper = stepper;
window.line = line;
window.say = say;
window.redrawOnLeave = () => {
    stepper.addEventListener('focusout', () => {
        attachStepper(stepper)();
        attachStepper(stepper, { say });
    });
};
window.ready = true;`;

type Page = {
    heard: string[];
    redrawOnLeave: () => void;
    attachStepper: (stepper: Element, options?: object) => () => void;
    stepper: Element;
    line: Element;
    say: unknown;
};

/** Lets the timers a blur or a reset sets run, and a frame after them, on the still clock. */
const settle = (page: import('@playwright/test').Page) => page.clock.runFor(100);

/** The page with its stepper attached, on a clock that stands still. */
const open = async (page: import('@playwright/test').Page) => {
    await stillClock(page.clock);
    await servePage(page, { title: 'Bid', body: BODY, script: SCRIPT });
    await page.waitForFunction(() => 'ready' in window);
};

test("says a press through the page's own say, on the page's line and not the stepper's", async ({
    page,
}) => {
    await open(page);
    await page.getByRole('button', { name: /^Raise/ }).click();
    // Past the moment a line puts words in.
    await page.clock.runFor(300);
    expect(await page.evaluate(() => (window as unknown as Page).heard)).toEqual(['6']);
    await expect(page.locator('.dk-stepper-status')).toHaveText('');
});

test('keeps its buttons where a focusout handler takes it away and attaches it again', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        (window as unknown as Page).redrawOnLeave();
    });
    await page.getByRole('button', { name: /^Raise/ }).focus();
    await page.locator('#after').focus();
    await settle(page);
    await expect(page.getByRole('button', { name: /^Raise/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Lower/ })).toBeVisible();
});

test("takes its words back from a page's line it no longer speaks on", async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
        const shown = window as unknown as Page;
        shown.attachStepper(shown.stepper, { status: shown.line });
    });
    await page.getByRole('button', { name: /^Raise/ }).click();
    await page.clock.runFor(150);
    await expect(page.locator('.screen-status')).toHaveText('6');
    await page.evaluate(() => {
        const shown = window as unknown as Page;
        shown.attachStepper(shown.stepper, { say: shown.say });
    });
    await expect(page.locator('.screen-status')).toHaveText('');
});

test('keeps its buttons where it is attached again just after its form is reset', async ({
    page,
}) => {
    await stillClock(page.clock);
    await servePage(page, {
        title: 'Bid',
        body: `<main><h1>Bid</h1><form>${BODY}<button type="reset">Clear</button></form></main>`,
        script: SCRIPT,
    });
    await page.waitForFunction(() => 'ready' in window);
    await page.evaluate(() => {
        const shown = window as unknown as Page;
        shown.stepper.closest('form')?.reset();
        shown.attachStepper(shown.stepper)();
        shown.attachStepper(shown.stepper, { say: shown.say });
    });
    await settle(page);
    await expect(page.getByRole('button', { name: /^Raise/ })).toBeVisible();
});
