import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import {
    buttonGrid,
    copyButton,
    dialog,
    pinnedTable,
    progress,
    stepper,
    themeSwitch,
} from '../examples/examples.js';
import { InputField, StatusLine, Toast } from '../src/react.js';
import { bundle } from './bundle.js';
import { countLeaks, type Counts, expectEngineAgrees, leaksOf } from './leaks.js';
import { type Leaks } from './leaks-page.js';
import { servePage, stillClock } from './page.js';

/*
 * Record 22's promise that a piece taken down leaves nothing running, held for every attach by
 * counting what the page has running, through the counters in leaks.ts, in Chromium, WebKit and
 * Firefox: each attach, used and taken down, brings every count back to where it started, seven
 * in a row grow none, and one given a signal already aborted, used and called after, starts
 * nothing. Each piece that speaks speaks on the screen's line, attached with the same signal, as a
 * page takes a screen down with one controller, so the line's own timers go with it. The theme's
 * listeners on the window stay for the page's life, as the record has it, so a switch is attached
 * and taken down once before every count starts. The clock is a stand-in that moves only by the
 * test's steps, so a timer still to come at the abort is one the abort has to clear.
 */

const CLOSE = `<div class="dk-close"><button type="button" class="dk-button dk-button-text dk-button-quiet"><span aria-hidden="true">×</span><span class="dk-visually-hidden">Close round tips</span></button></div>`;

const BODY = `${renderToStaticMarkup(
    <main>
        {themeSwitch}
        <pre id="code">npm install @jasonsdevspace/design-kit</pre>
        {copyButton}
        <button id="start" type="button">
            Start
        </button>
        <button id="target" type="button">
            Target
        </button>
        <form id="join">
            <InputField id="name" name="name" label="Name" required />
            <button type="submit">Join</button>
        </form>
        <form id="counts">{stepper}</form>
        {pinnedTable}
        {buttonGrid}
        <button id="busy" className="dk-button" type="button">
            Save
        </button>
        {progress}
        {dialog}
        <StatusLine className="screen-status" />
    </main>
)}
<p><button type="button" id="tips-button" aria-expanded="false" aria-controls="round-tips">Tips</button></p>
<div class="dk-panel" id="round-tips" hidden><h2 class="dk-panel-title">Round tips</h2>${CLOSE}<p>Ana deals first.</p></div>
${renderToStaticMarkup(<Toast />)}`;

/*
 * Each piece by name: how it is attached with a signal, what a visitor or the page does with it,
 * and what is called once it is taken down, each given what the attach returned. The clipboard is
 * the page's own and answers at once.
 */
const SCRIPT = `import {
    attachBusy,
    attachCopyButton,
    attachDialog,
    attachForm,
    attachPanel,
    attachProgress,
    attachRoving,
    attachStatus,
    attachStepper,
    attachTable,
    attachThemeSwitch,
    attachToast,
    chooseTheme,
    moveFocus,
} from './controls.js';
Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: () => Promise.resolve() },
});
const $ = (selector) => document.querySelector(selector);
const line = $('.screen-status');
const screen = (signal) => attachStatus(line, { signal });
const group = $('.dk-theme-switch');
const form = $('#join');
const steps = $('.dk-stepper');
const cell = $('.dk-button-grid button');
const busy = $('#busy');
const bar = $('#import');
const key = (target, name) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
window.pieces = {
    'the theme switch': {
        attach: (signal) => attachThemeSwitch(group, { signal }),
        // Its choices opened, which listens to the document, and one picked.
        use: () => {
            group.querySelector('.dk-theme-switch-button').click();
            group.querySelectorAll('input[type="radio"]')[2].click();
        },
        after: (detach) => {
            detach();
            chooseTheme('light');
            group.querySelector('.dk-theme-switch-button').click();
        },
    },
    'the copy button': {
        attach: (signal) => {
            screen(signal);
            return attachCopyButton($('.dk-copy'), { source: () => $('#code'), status: line, signal });
        },
        use: () => $('.dk-copy').click(),
        after: (detach) => {
            detach();
            $('.dk-copy').click();
        },
    },
    'the status line': {
        attach: (signal) => screen(signal),
        use: (say) => {
            say('Saved.');
            say('3 still to enter.', { settle: 700 });
        },
        after: (say) => say('Not said.'),
    },
    'the toast': {
        attach: (signal) => attachToast($('.dk-toast'), { signal }),
        use: (show) => {
            show('Round 2 saved.');
            window.dismiss = show('Round 3 saved.');
        },
        after: (show) => {
            window.dismiss();
            show('Round 4 saved.');
        },
    },
    'the form': {
        attach: (signal) => {
            screen(signal);
            return attachForm(form, { status: line, signal });
        },
        // A submit refused, which waits a frame to move focus, and a reset, which waits a task.
        use: () => {
            form.requestSubmit();
            form.reset();
        },
        after: (refuse) => {
            refuse();
            form.reset();
        },
    },
    'a panel': {
        attach: (signal) => attachPanel($('#tips-button'), { signal }),
        use: () => $('#tips-button').click(),
        after: (control) => {
            control.set(true);
            control.detach();
            $('#tips-button').click();
        },
    },
    'the stepper': {
        attach: (signal) => attachStepper(steps, { signal }),
        // A press, a value out of range, a reset and focus leaving, each of which waits.
        use: () => {
            steps.querySelector('.dk-stepper-up').click();
            const input = steps.querySelector('input');
            input.value = '99';
            input.dispatchEvent(new Event('change', { bubbles: true }));
            $('#counts').reset();
            steps.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
        },
        after: (detach) => {
            detach();
            steps.querySelector('.dk-stepper-up').click();
            $('#counts').reset();
        },
    },
    "a table's frame": {
        attach: (signal) => attachTable($('.dk-table-scroll'), { signal }),
        use: () => $('.dk-table-scroll').focus(),
        after: (detach) => {
            detach();
            $('#start').focus();
            $('.dk-table-scroll').focus();
        },
    },
    'a group the arrow keys move through': {
        attach: (signal) => attachRoving($('.dk-button-grid'), { signal }),
        use: () => {
            cell.focus();
            key(cell, 'ArrowRight');
        },
        after: (detach) => {
            detach();
            key(cell, 'ArrowRight');
        },
    },
    'a busy button': {
        attach: (signal) => {
            screen(signal);
            return attachBusy(busy, { status: line, signal });
        },
        // Busy, so its wait for the words begins.
        use: () => {
            busy.removeAttribute('data-busy');
            busy.setAttribute('data-busy', 'Saving the rule.');
        },
        after: (detach) => {
            detach();
            busy.removeAttribute('data-busy');
            busy.setAttribute('data-busy', 'Saving the rule.');
        },
    },
    progress: {
        attach: (signal) => {
            screen(signal);
            return attachProgress(bar, { status: line, done: 'Imported.', signal });
        },
        // A step crossed, which is said, from wherever the last use left the bar.
        use: () => {
            bar.value = bar.value >= 20 ? 10 : 30;
        },
        after: (detach) => {
            detach();
            bar.value = bar.max;
        },
    },
    'the dialog': {
        attach: (signal) => attachDialog($('#end-game'), { signal, stay: true }),
        use: (open) => open($('#finish')),
        after: (open) => open($('#finish')),
    },
    'a focus request': {
        attach: (signal) => {
            $('#start').focus();
            return moveFocus('target', { signal });
        },
        use: () => undefined,
        after: (cancel) => cancel(),
    },
};
window.handles = {};
window.controllers = {};
window.attach = (name) => {
    const controller = new AbortController();
    window.controllers[name] = controller;
    window.handles[name] = pieces[name].attach(controller.signal);
    pieces[name].use(window.handles[name]);
};
window.abort = (name) => controllers[name].abort();
window.after = (name) => pieces[name].after(handles[name]);
// The theme's own listeners, which stay for the page's life, set before anything is counted.
const once = new AbortController();
attachThemeSwitch(group, { signal: once.signal });
once.abort();
window.ready = true;`;

const PIECES = [
    'the theme switch',
    'the copy button',
    'the status line',
    'the toast',
    'the form',
    'a panel',
    'the stepper',
    "a table's frame",
    'a group the arrow keys move through',
    'a busy button',
    'progress',
    'the dialog',
    'a focus request',
] as const;

/** How many times each piece is attached and taken down in a row. */
const ROUNDS = 7;

/** The page with its controls loaded, the counters in it and its clock still. */
const opened = async (page: Page): Promise<void> => {
    await stillClock(page.clock);
    await countLeaks(page);
    await servePage(page, { title: 'Leaks', body: BODY, script: SCRIPT });
    await page.waitForFunction(() => 'ready' in window);
};

/**
 * Finds the page back where it started. Polled, since a dialog closed by its teardown hears its
 * close event a task later, through a listener that comes off as it does, and the clock stands
 * still, so no timer or frame of the kit's can come due while it waits.
 */
const expectBack = async (
    page: Page,
    before: Counts,
    {
        what,
        browserName,
        read = leaksOf,
    }: {
        readonly what: string;
        readonly browserName: string;
        readonly read?: (page: Page) => Promise<Counts>;
    }
) => {
    await expect.poll(() => read(page), { message: what, timeout: 2000 }).toEqual(before);
    await expectEngineAgrees(page, browserName);
};

for (const name of PIECES) {
    test(`leaves nothing running once ${name} is taken down, seven times over`, async ({
        page,
        browserName,
    }) => {
        await opened(page);
        const before = await leaksOf(page);
        await expectEngineAgrees(page, browserName);
        for (let round = 1; round <= ROUNDS; round += 1) {
            const what = `${name}, round ${String(round)}`;
            await page.evaluate((piece) => {
                (window as unknown as { attach: (name: string) => void }).attach(piece);
            }, name);
            // Something is running once it is attached and used, so the count that comes back is
            // one the teardown brought back.
            if (round === 1) {
                expect(await leaksOf(page), what).not.toEqual(before);
                await expectEngineAgrees(page, browserName);
            }
            // Far enough for its words to be put on the line and its frames to come, and short of
            // the timers that end them.
            await page.clock.runFor(150);
            await page.evaluate((piece) => {
                (window as unknown as { abort: (name: string) => void }).abort(piece);
            }, name);
            await expectBack(page, before, { what, browserName });
            // Calls after the teardown start nothing, and nothing comes due later.
            await page.evaluate((piece) => {
                (window as unknown as { after: (name: string) => void }).after(piece);
            }, name);
            await page.clock.runFor(10_000);
            await expectBack(page, before, { what: `${what}, after its teardown`, browserName });
        }
    });
}

test('starts nothing for any piece given a signal already aborted, used and called after', async ({
    page,
    browserName,
}) => {
    await opened(page);
    const before = await leaksOf(page);
    await page.evaluate((names) => {
        const kit = window as unknown as {
            pieces: Record<
                string,
                {
                    attach: (signal: AbortSignal) => unknown;
                    use: (handle: unknown) => void;
                    after: (handle: unknown) => void;
                }
            >;
        };
        const aborted = AbortSignal.abort();
        for (const name of names) {
            const piece = kit.pieces[name];
            if (!piece) throw new Error(`no piece named ${name}`);
            const handle = piece.attach(aborted);
            piece.use(handle);
            piece.after(handle);
        }
    }, PIECES);
    expect(await leaksOf(page)).toEqual(before);
    await page.clock.runFor(10_000);
    await expectBack(page, before, {
        what: 'every piece given a signal already aborted',
        browserName,
    });
});

test.describe('the hooks', () => {
    /*
     * React keeps a listener of its own on each field it draws, which it never takes off, so one
     * stays on a field after the field is taken away. Those are set apart, as listeners with a
     * bound callback, and every other count is held to where it started once React's root is in
     * the page with nothing of the kit's drawn.
     */
    const withoutReact = async (page: Page): Promise<Counts> => ({
        ...(await leaksOf(page)),
        reactListeners: 0,
    });

    const apps = { production: '', strict: '' };
    test.beforeAll(async () => {
        test.setTimeout(120_000);
        apps.production = await bundle('leaks-page.tsx');
        apps.strict = await bundle('leaks-page.tsx', { development: true });
    });

    for (const mode of ['production', 'strict'] as const) {
        test(`leave nothing running once a page that uses each is taken away, ${mode === 'strict' ? 'under StrictMode' : 'in production'}, seven times over`, async ({
            page,
            browserName,
        }) => {
            await stillClock(page.clock);
            await countLeaks(page);
            await servePage(page, {
                title: 'Lists',
                body: '<div id="root"></div>',
                script: apps[mode],
                head: mode === 'strict' ? '<script>window.strict = true</script>' : '',
            });
            await expect(page.locator('h1')).toHaveText('Lists');
            const before = await withoutReact(page);
            await expectEngineAgrees(page, browserName);
            for (let round = 1; round <= ROUNDS; round += 1) {
                const what = `the hooks, round ${String(round)}`;
                await page.evaluate(() => {
                    (window as unknown as Leaks).show();
                });
                await page.evaluate(() => {
                    (window as unknown as Leaks).use();
                });
                if (round === 1) {
                    expect(await withoutReact(page), what).not.toEqual(before);
                    await expectEngineAgrees(page, browserName);
                }
                await page.clock.runFor(150);
                await page.evaluate(() => {
                    (window as unknown as Leaks).leave();
                });
                await expectBack(page, before, { what, browserName, read: withoutReact });
                await page.clock.runFor(10_000);
                await expectBack(page, before, {
                    what: `${what}, later`,
                    browserName,
                    read: withoutReact,
                });
            }
        });
    }
});
