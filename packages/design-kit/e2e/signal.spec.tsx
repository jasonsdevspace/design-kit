import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { buttonGrid, dialog, pinnedTable, progress, stepper } from '../examples/examples.js';
import { StatusLine } from '../src/react.js';
import { countLeaks, listenersOn } from './leaks.js';
import { servePage, stillClock } from './page.js';

/*
 * The teardown contract of record 22 on the stepper, a table's frame, a group the arrow keys move
 * through, a busy button, progress, the dialog and a focus request: a signal already aborted
 * attaches nothing, aborting takes away what the attach set up, as its detach does, a later call's
 * signal goes unheard while the first attach owns the piece, an old signal leaves a newer attach
 * alone, and nothing the piece set going acts after its teardown. The behavior runs in Chromium,
 * WebKit and Firefox, and so do the counts of listeners, through the counters in leaks.ts.
 */

const BODY = renderToStaticMarkup(
    <main>
        <button id="start" type="button">
            Start
        </button>
        <button id="target" type="button">
            Target
        </button>
        {stepper}
        {pinnedTable}
        {buttonGrid}
        <button id="busy" className="dk-button" type="button">
            Save
        </button>
        {progress}
        {dialog}
        <StatusLine className="screen-status" />
    </main>
);

const SCRIPT = `import {
    attachBusy,
    attachDialog,
    attachProgress,
    attachRoving,
    attachStatus,
    attachStepper,
    attachTable,
    moveFocus,
} from './controls.js';
const line = document.querySelector('.screen-status');
window.heard = [];
new MutationObserver(() => {
    if (line.textContent) window.heard.push(line.textContent);
}).observe(line, { childList: true, characterData: true, subtree: true });
const withSignal = (signal, options = {}) => (signal ? { ...options, signal } : options);
window.kit = {
    stepper: (signal, options) =>
        attachStepper(document.querySelector('.dk-stepper'), withSignal(signal, options)),
    table: (signal) =>
        attachTable(document.querySelector('.dk-table-scroll'), withSignal(signal)),
    roving: (signal) =>
        attachRoving(document.querySelector('.dk-button-grid'), withSignal(signal)),
    busy: (signal) =>
        attachBusy(document.querySelector('#busy'), withSignal(signal, { status: line })),
    progress: (signal, options) =>
        attachProgress(
            document.querySelector('progress'),
            withSignal(signal, { status: line, ...options })
        ),
    dialog: (signal, options) =>
        attachDialog(document.querySelector('#end-game'), withSignal(signal, options)),
    focus: (signal) => moveFocus('target', withSignal(signal)),
    line: () => attachStatus(line),
};
/** Every piece attached with the signal given, by name, and what each returned. */
window.all = (signal) => Object.fromEntries(
    ['stepper', 'table', 'roving', 'busy', 'progress', 'dialog'].map((name) => [
        name,
        kit[name](signal),
    ])
);
window.frames = () =>
    new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
window.ready = true;`;

/** How many listeners the counters see on the targets in the list an expression in the page gives. */
type Count = (targets: string) => Promise<number>;

/** The page with its controls loaded and nothing attached yet, and how to count its listeners. */
const opened = async (page: Page): Promise<Count> => {
    await countLeaks(page);
    await servePage(page, { title: 'Signal', body: BODY, script: SCRIPT });
    await page.waitForFunction(() => 'ready' in window);
    return (targets) => listenersOn(page, targets);
};

/** The pieces' own elements. */
const PARTS =
    "[...document.querySelectorAll('.dk-stepper, .dk-stepper *, " +
    ".dk-table-scroll, .dk-button-grid, #busy, progress, #end-game')]";

/** What each piece shows of being attached. */
const attached = (page: Page) =>
    page.evaluate(() => {
        const grid = document.querySelector('.dk-button-grid');
        return {
            stepper: !document.querySelector<HTMLElement>('.dk-stepper-up')?.hidden,
            roving: grid?.querySelectorAll('[tabindex]').length !== 0,
            toolbar: grid?.getAttribute('role') === 'toolbar',
        };
    });

const NONE = { stepper: false, roving: false, toolbar: false };
const ALL = { stepper: true, roving: true, toolbar: true };

test('attaches nothing when given a signal already aborted', async ({ page }) => {
    const count = await opened(page);
    const before = await count(PARTS);
    await page.evaluate(`(() => {
        const aborted = AbortSignal.abort();
        window.returned = all(aborted);
        window.openAborted = kit.dialog(aborted, { stay: true });
        document.querySelector('#start').focus();
        kit.focus(aborted);
    })()`);
    await page.evaluate('frames()');
    expect(await attached(page)).toEqual(NONE);
    expect(await count(PARTS)).toBe(before);
    // No focus request was made, and the dialog's function opens nothing and set no closedby.
    await expect(page.locator('#start')).toBeFocused();
    await page.evaluate('openAborted()');
    await expect(page.locator('#end-game')).not.toHaveAttribute('open');
    await expect(page.locator('#end-game')).not.toHaveAttribute('closedby');
    // A busy button marked busy is not marked off by an attach that did not happen.
    await page.evaluate(`document.querySelector('#busy').setAttribute('data-busy', '')`);
    await expect(page.locator('#busy')).not.toHaveAttribute('aria-disabled');
    // What each returned does nothing, and nothing was kept, so each attaches afresh after it.
    const fresh = await page.evaluate(`(() => {
        for (const detach of Object.values(returned)) detach();
        const again = all();
        return Object.keys(again).filter((name) => again[name] === returned[name]);
    })()`);
    expect(fresh).toEqual([]);
    expect(await attached(page)).toEqual(ALL);
    await expect(page.locator('#busy')).toHaveAttribute('aria-disabled', 'true');
});

test('takes nothing from a repeat attach given a signal already aborted', async ({ page }) => {
    await opened(page);
    const same = await page.evaluate(`(() => {
        const first = all();
        const repeated = all(AbortSignal.abort());
        kit.dialog(AbortSignal.abort(), { stay: true });
        return Object.keys(first).filter((name) => first[name] === repeated[name]);
    })()`);
    expect(same).toEqual([]);
    // The dialog's stay was not taken, and every piece is still the first attach's.
    await expect(page.locator('#end-game')).not.toHaveAttribute('closedby');
    expect(await attached(page)).toEqual(ALL);
});

test('takes each piece down when the signal aborts, as its detach does', async ({ page }) => {
    const count = await opened(page);
    const before = await count(PARTS);
    const ownRole = await page.locator('.dk-button-grid').first().getAttribute('role');
    await page.evaluate(`(() => {
        window.controller = new AbortController();
        all(controller.signal);
        window.show = kit.dialog(controller.signal, { stay: true });
        document.querySelector('#busy').setAttribute('data-busy', '');
        show(document.querySelector('#finish'));
    })()`);
    expect(await attached(page)).toEqual(ALL);
    await expect(page.locator('#busy')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('#end-game')).toHaveAttribute('closedby', 'none');
    await expect(page.locator('#end-game')).toHaveAttribute('open');
    expect(await count(PARTS)).toBeGreaterThan(before);
    await page.evaluate('controller.abort()');
    expect(await attached(page)).toEqual(NONE);
    await expect(page.locator('.dk-button-grid').first()).toHaveAttribute('role', ownRole ?? '');
    // The busy mark it set comes off, the open dialog closes with focus back on its opener and the
    // closedby it set gone, and every listener on the pieces' own elements comes off.
    await expect(page.locator('#busy')).not.toHaveAttribute('aria-disabled');
    await expect(page.locator('#end-game')).not.toHaveAttribute('open');
    await expect(page.locator('#end-game')).not.toHaveAttribute('closedby');
    await expect(page.locator('#finish')).toBeFocused();
    expect(await count(PARTS)).toBe(before);
});

test('does nothing after its teardown', async ({ page }) => {
    await opened(page);
    await page.evaluate(`(() => {
        window.controller = new AbortController();
        window.returned = all(controller.signal);
        window.show = kit.dialog(controller.signal);
        controller.abort();
        // Calls after the teardown: detach again, show, a busy mark, a step of progress, a press.
        for (const detach of Object.values(returned)) detach();
        show();
        document.querySelector('#busy').setAttribute('data-busy', '');
        const bar = document.querySelector('progress');
        bar.value = bar.max;
        document.querySelector('.dk-stepper-up').click();
    })()`);
    await expect(page.locator('#end-game')).not.toHaveAttribute('open');
    await expect(page.locator('#busy')).not.toHaveAttribute('aria-disabled');
    // The arrow keys no longer move focus in the group.
    const cell = page.locator('.dk-button-grid').first().locator('button').first();
    await cell.focus();
    await page.keyboard.press('ArrowRight');
    await expect(cell).toBeFocused();
    // Past the moment the status line says a message, where a piece still listening would speak.
    await page.evaluate(() => new Promise((done) => setTimeout(done, 300)));
    expect(await page.evaluate('window.heard')).toEqual([]);
    expect(await page.evaluate(`document.querySelector('.dk-stepper-value').value`)).toBe('4');
});

test("says nothing of a busy wait that outlasts the button's teardown", async ({ page }) => {
    await stillClock(page.clock);
    await opened(page);
    await page.evaluate(`(() => {
        window.controller = new AbortController();
        kit.busy(controller.signal);
        document.querySelector('#busy').setAttribute('data-busy', 'Saving the rule.');
    })()`);
    await expect(page.locator('#busy')).toHaveAttribute('aria-disabled', 'true');
    await page.evaluate('controller.abort()');
    await page.clock.runFor(5000);
    expect(await page.evaluate('window.heard')).toEqual([]);
    await expect(page.locator('#busy')).not.toHaveAttribute('aria-disabled');
});

test('calls off a focus request on abort, and lets go of the signal once one lands', async ({
    page,
}) => {
    const count = await opened(page);
    await page.evaluate(`(() => {
        document.querySelector('#start').focus();
        const controller = new AbortController();
        kit.focus(controller.signal);
        controller.abort();
    })()`);
    await page.evaluate('frames()');
    await expect(page.locator('#start')).toBeFocused();
    // A request left to land moves focus, and then holds nothing on a signal the page keeps.
    await page.evaluate(`(() => {
        window.kept = new AbortController();
        kit.focus(kept.signal);
    })()`);
    await page.evaluate('frames()');
    await expect(page.locator('#target')).toBeFocused();
    const onSignal = await count('[kept.signal]');
    expect(onSignal).toBe(0);
    await page.evaluate('kept.abort()');
    await expect(page.locator('#target')).toBeFocused();
});

test('leaves a newer attach alone when the old detach runs twice and its signal aborts', async ({
    page,
}) => {
    await opened(page);
    // The dialog returns what opens it rather than a detach, so only its signal takes it down.
    await page.evaluate(`(() => {
        window.controller = new AbortController();
        const old = all(controller.signal);
        delete old.dialog;
        for (const detach of Object.values(old)) detach();
        all();
        for (const detach of Object.values(old)) detach();
        controller.abort();
        document.querySelector('#busy').setAttribute('data-busy', '');
    })()`);
    expect(await attached(page)).toEqual(ALL);
    await expect(page.locator('#busy')).toHaveAttribute('aria-disabled', 'true');
});

test("hears only the first attach's signal while the piece stays attached", async ({ page }) => {
    await opened(page);
    const same = await page.evaluate(`(() => {
        window.first = new AbortController();
        window.later = new AbortController();
        const one = all(first.signal);
        const two = all(later.signal);
        later.abort();
        return Object.keys(one).filter((name) => one[name] !== two[name]);
    })()`);
    expect(same).toEqual([]);
    expect(await attached(page)).toEqual(ALL);
    await page.evaluate('first.abort()');
    expect(await attached(page)).toEqual(NONE);
});

test('hands focus back from a dialog closed and taken down in one task', async ({ page }) => {
    await opened(page);
    await page.evaluate(`(() => {
        const controller = new AbortController();
        kit.dialog(controller.signal, {
            returnTo: () => document.querySelector('#start'),
        })(document.querySelector('#finish'));
        document.querySelector('#end-game').close();
        controller.abort();
    })()`);
    await page.evaluate('frames()');
    await expect(page.locator('#end-game')).not.toHaveAttribute('open');
    await expect(page.locator('#finish')).toBeFocused();
});

test('leaves a dialog attached again as the last is taken down open to its own closings', async ({
    page,
}) => {
    await opened(page);
    // The close the teardown makes arrives once the new attach listens, which would send focus to
    // its returnTo if it took that closing for its own.
    await page.evaluate(`(() => {
        const controller = new AbortController();
        kit.dialog(controller.signal)(document.querySelector('#finish'));
        controller.abort();
        window.show = kit.dialog(undefined, { returnTo: () => document.querySelector('#start') });
    })()`);
    await page.evaluate('frames()');
    await expect(page.locator('#finish')).toBeFocused();
    // The new attach still hands focus back for an opening of its own.
    await page.evaluate(`(() => {
        show(document.querySelector('#target'));
        document.querySelector('#end-game').close();
    })()`);
    await expect(page.locator('#target')).toBeFocused();
});

test('leaves a closedby the dialog was not attached to stay with', async ({ page }) => {
    await opened(page);
    await page.evaluate(`(() => {
        const controller = new AbortController();
        kit.dialog(controller.signal);
        document.querySelector('#end-game').setAttribute('closedby', 'closerequest');
        controller.abort();
    })()`);
    await expect(page.locator('#end-game')).toHaveAttribute('closedby', 'closerequest');
});

test('still refuses a table with no frame when given a signal already aborted', async ({
    page,
}) => {
    await opened(page);
    const thrown = await page.evaluate(`(async () => {
        const { attachTable } = await import('./controls.js');
        try {
            attachTable(document.querySelector('#start'), { signal: AbortSignal.abort() });
            return null;
        } catch (error) {
            return error.message;
        }
    })()`);
    expect(thrown).toBe('a table needs its frame');
});

test('says nothing of a stepper error or a progress step taken down before it is heard', async ({
    page,
}) => {
    await opened(page);
    // The bar's observer hears the step in a microtask, so the step is said before the abort.
    await page.evaluate(`(async () => {
        const controller = new AbortController();
        kit.stepper(controller.signal, { say: kit.line() });
        kit.progress(controller.signal);
        const input = document.querySelector('.dk-stepper-value');
        input.value = '99';
        input.dispatchEvent(new Event('change', { bubbles: true }));
        document.querySelector('progress').value = 25;
        await null;
        controller.abort();
    })()`);
    // Past the moment the status line says a message.
    await page.evaluate(() => new Promise((done) => setTimeout(done, 300)));
    expect(await page.evaluate('window.heard')).toEqual([]);
});

test('drops a progress step waiting behind firm words once the bar is taken down', async ({
    page,
}) => {
    await stillClock(page.clock);
    await opened(page);
    await page.evaluate(`(() => {
        window.controller = new AbortController();
        kit.progress(controller.signal);
        kit.line()('Saved.');
    })()`);
    await page.clock.runFor(200);
    await page.evaluate(`(async () => {
        document.querySelector('progress').value = 25;
        await null;
        controller.abort();
    })()`);
    await page.clock.runFor(5000);
    expect(await page.evaluate('window.heard')).toEqual(['Saved.']);
});
