import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { Progress, StatusLine, StepperField, Toast } from '../src/react.js';
import { countLeaks, leaksOf, listenersOn } from './leaks.js';
import { servePage, stillClock } from './page.js';

/*
 * The teardown contract of record 22 on the status line and the toast: a signal already aborted
 * does nothing and what the attach returns says or shows nothing, aborting lets the line go so no
 * piece speaks on it until it is attached again, a toast taken down leaves focus where it is and a
 * later message unshown, the first attach owns the piece so a later call's signal is not heard, and
 * a line a stepper or progress spoke on first is still the page's to take down. Timers, observers
 * and listeners are counted in every engine on a stand-in clock, through the counters in leaks.ts.
 */

// The toast's buttons are written without a tabindex, as a page's own markup may be, so the
// tabindex the attach adds can be seen to come off with it.
const BODY =
    renderToStaticMarkup(
        <main>
            <button type="button" id="save">
                Save
            </button>
            <StepperField id="batch" label="Batch" min={0} max={10} defaultValue={4} />
            <Progress id="import" label="Importing products" value={0} max={40} words="0 of 40" />
            <StatusLine className="screen-status" />
        </main>
    ) + renderToStaticMarkup(<Toast />).replaceAll(' tabindex="0"', '');

const SCRIPT = `import { attachProgress, attachStatus, attachStepper, attachToast } from './controls.js';
const line = document.querySelector('.screen-status');
const toast = document.querySelector('.dk-toast');
const bar = document.querySelector('#import');
window.kit = {
    status: (signal) => attachStatus(line, signal ? { signal } : undefined),
    toast: (signal) => attachToast(toast, signal ? { signal } : undefined),
    stepper: () => attachStepper(document.querySelector('#batch').closest('.dk-stepper'), { status: line }),
    progress: () => attachProgress(bar, { status: line, done: 'Imported.' }),
    end: () => {
        bar.value = 40;
    },
    again: () => {
        bar.value = 0;
    },
};
window.ready = true;`;

/** The timers set and not yet run or cleared, and the observers watching. */
type Running = { readonly timers: number; readonly observers: number };

/** How many listeners the counters see on the targets in the list an expression in the page gives. */
type Count = (targets: string) => Promise<number>;

/** The page with its controls loaded and nothing attached yet, and how to count its listeners. */
const opened = async (page: Page): Promise<Count> => {
    await stillClock(page.clock);
    await countLeaks(page, { clock: true });
    await servePage(page, { title: 'Teardown', body: BODY, script: SCRIPT });
    await page.waitForFunction(() => 'ready' in window);
    return (targets) => listenersOn(page, targets);
};

const running = async (page: Page): Promise<Running> => {
    const { timers, resizeObservers, mutationObservers } = await leaksOf(page);
    return { timers, observers: resizeObservers + mutationObservers };
};

/** The toast and every element in it. */
const PARTS = `[...document.querySelectorAll('.dk-toast, .dk-toast *')]`;

const line = (page: Page) => page.locator('.screen-status');
const toastLine = (page: Page) => page.locator('.dk-toast-status');

test('says nothing on a line given a signal already aborted', async ({ page }) => {
    await opened(page);
    const before = await running(page);
    await page.evaluate(`(() => {
        const aborted = AbortSignal.abort();
        kit.status(aborted)('Saved.');
        window.first = kit.status();
        window.repeated = kit.status(aborted);
        window.repeated('Not said.');
    })()`);
    expect(await page.evaluate('window.repeated === window.first')).toBe(false);
    await page.clock.runFor(300);
    await expect(line(page)).toHaveText('');
    expect(await running(page)).toEqual(before);
    // Nothing was kept for the aborted attach, so the line attached without a signal speaks.
    await page.evaluate(`window.first('Saved.')`);
    await page.clock.runFor(300);
    await expect(line(page)).toHaveText('Saved.');
});

test('lets a line go when its signal aborts, so no piece speaks on it until attached again', async ({
    page,
}) => {
    await opened(page);
    await page.evaluate(`(() => {
        kit.stepper();
        kit.progress();
    })()`);
    // Counted with the stepper and progress attached, whose own observers stay.
    const before = await running(page);
    await page.evaluate(`(() => {
        window.controller = new AbortController();
        window.say = kit.status(controller.signal);
        say('Saved.');
        say('3 still to enter.', { settle: 700 });
    })()`);
    await page.clock.runFor(300);
    await expect(line(page)).toHaveText('Saved.');
    await page.evaluate('controller.abort()');
    await expect(line(page)).toHaveText('');
    // The settling words and the timer that would empty the line are cleared with it.
    expect(await running(page)).toEqual(before);
    await page.evaluate(`(() => {
        say('Not said.');
        kit.end();
    })()`);
    await page.getByRole('button', { name: /^Raise/ }).click();
    await page.clock.runFor(1000);
    await expect(line(page)).toHaveText('');
    // Attached again, the line speaks, though what the old attach returned stays silent.
    await page.evaluate(`(() => {
        window.again = kit.status();
        say('Still not said.');
    })()`);
    await page.clock.runFor(300);
    await expect(line(page)).toHaveText('');
    await page.evaluate(`again('Saved again.')`);
    await page.clock.runFor(300);
    await expect(line(page)).toHaveText('Saved again.');
    // A piece given the line itself, rather than the old function, speaks on it again.
    await page.clock.runFor(2500);
    // Apart, so progress sees its run start again before it ends.
    await page.evaluate('kit.again()');
    await page.evaluate('kit.end()');
    await page.clock.runFor(300);
    await expect(line(page)).toHaveText('Imported.');
});

test('lets a line go that a stepper and progress spoke on before the page attached it', async ({
    page,
}) => {
    await opened(page);
    await page.evaluate(`(() => {
        kit.stepper();
        kit.progress();
        kit.end();
    })()`);
    await page.getByRole('button', { name: /^Raise/ }).click();
    await page.clock.runFor(3100);
    await page.evaluate(`(() => {
        window.controller = new AbortController();
        kit.status(controller.signal)('Saved.');
    })()`);
    await page.clock.runFor(300);
    await expect(line(page)).toHaveText('Saved.');
    await page.evaluate(`(() => {
        controller.abort();
        kit.again();
    })()`);
    await expect(line(page)).toHaveText('');
    // The line is the page's, so its abort lets it go, and neither piece speaks on it after.
    await page.evaluate('kit.end()');
    await page.getByRole('button', { name: /^Raise/ }).click();
    await page.clock.runFor(1000);
    await expect(line(page)).toHaveText('');
});

test("hears only the first attach's signal while a line stays attached", async ({ page }) => {
    await opened(page);
    await page.evaluate(`(() => {
        window.first = new AbortController();
        window.later = new AbortController();
        window.say = kit.status(first.signal);
        window.same = say === kit.status(later.signal);
        later.abort();
        say('Saved.');
    })()`);
    expect(await page.evaluate('window.same')).toBe(true);
    await page.clock.runFor(300);
    await expect(line(page)).toHaveText('Saved.');
    await page.evaluate('first.abort()');
    await expect(line(page)).toHaveText('');
});

test('shows nothing in a toast given a signal already aborted', async ({ page }) => {
    const count = await opened(page);
    const parts = await count(PARTS);
    const before = await running(page);
    await page.evaluate(`(() => {
        const dismiss = kit.toast(AbortSignal.abort())('Round 3 saved.');
        dismiss();
    })()`);
    await page.clock.runFor(300);
    await expect(page.locator('.dk-toast')).not.toHaveAttribute('data-shown');
    await expect(toastLine(page)).toHaveText('');
    await expect(page.locator('.dk-toast-close')).not.toHaveAttribute('tabindex');
    expect(await running(page)).toEqual(before);
    expect(await count(PARTS)).toBe(parts);
    // Nothing was kept, so attaching without a signal shows a message.
    await page.evaluate(`kit.toast()('Round 3 saved.')`);
    await expect(page.locator('.dk-toast')).toHaveAttribute('data-shown', '');
});

test('takes a toast down when its signal aborts, sending focus back as a dismiss does', async ({
    page,
}) => {
    const count = await opened(page);
    const parts = await count(PARTS);
    const onWindow = await count('[window]');
    const before = await running(page);
    await page.locator('#save').focus();
    await page.evaluate(`(() => {
        window.controller = new AbortController();
        window.show = kit.toast(controller.signal);
        show('Round 2 saved.');
        window.dismiss = show('Round 3 saved.');
    })()`);
    await page.clock.runFor(300);
    await expect(toastLine(page)).toHaveText('Round 3 saved.');
    // Shown twice, the toast listens to the window's size once.
    expect(await count('[window]')).toBe(onWindow + 1);
    expect((await running(page)).observers).toBe(before.observers + 1);
    await page.locator('.dk-toast-close').focus();
    // A tabindex the page sets after the attach is the page's, and stays.
    await page.evaluate(`(() => {
        document.querySelector('.dk-toast-action').tabIndex = -1;
        controller.abort();
    })()`);
    await expect(page.locator('.dk-toast')).not.toHaveAttribute('data-shown');
    await expect(toastLine(page)).toHaveText('');
    await expect(page.locator('.dk-toast-close')).not.toHaveAttribute('tabindex');
    await expect(page.locator('.dk-toast-action')).toHaveAttribute('tabindex', '-1');
    // Focus that was on its Close, which the teardown hides, goes back to Save, as a dismiss sends
    // it, rather than dropping to the page's body.
    await expect(page.locator('#save')).toBeFocused();
    expect(await running(page)).toEqual(before);
    expect(await count(PARTS)).toBe(parts);
    expect(await count('[window]')).toBe(onWindow);
    // What the attach returned, and what that returned, do nothing after.
    await page.evaluate(`(() => {
        window.dismiss();
        show('Round 4 saved.');
    })()`);
    await page.clock.runFor(300);
    await expect(page.locator('.dk-toast')).not.toHaveAttribute('data-shown');
    await expect(toastLine(page)).toHaveText('');
    expect(await running(page)).toEqual(before);
    // Attached again, the toast speaks on its own line once more.
    await page.evaluate(`kit.toast()('Round 4 saved.')`);
    await page.clock.runFor(300);
    await expect(toastLine(page)).toHaveText('Round 4 saved.');
});

test("hears only the first attach's signal while a toast stays attached", async ({ page }) => {
    await opened(page);
    await page.evaluate(`(() => {
        window.first = new AbortController();
        window.later = new AbortController();
        window.show = kit.toast(first.signal);
        window.same = show === kit.toast(later.signal);
        later.abort();
        show('Round 3 saved.');
    })()`);
    expect(await page.evaluate('window.same')).toBe(true);
    await expect(page.locator('.dk-toast')).toHaveAttribute('data-shown', '');
    await page.evaluate('first.abort()');
    await expect(page.locator('.dk-toast')).not.toHaveAttribute('data-shown');
});
