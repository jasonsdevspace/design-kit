import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { buttonGrid, dialog, pinnedTable, progress, stepper } from '../examples/examples.js';
import { InputField, StatusLine, Toast } from '../src/react.js';
import { countLeaks, listenersOn } from './leaks.js';
import { servePage, stillClock } from './page.js';

/*
 * The teardown contract of record 22 on the stepper, a table's frame, a group the arrow keys move
 * through, a busy button, progress, the dialog and a focus request: a signal already aborted
 * attaches nothing, aborting takes away what the attach set up a microtask later, as its detach
 * does at once, each signal that attached the piece holds it until it aborts, an abort and an
 * attach in one task keep the piece and what it was doing while one a microtask later starts
 * afresh, an old signal leaves a newer attach alone, and nothing the piece set going acts after its
 * teardown. The behavior runs in Chromium, WebKit and Firefox, and so do the counts of listeners,
 * through the counters in leaks.ts.
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
        <form id="join">
            <InputField id="name" name="name" label="Name" required />
            <button type="submit">Join</button>
        </form>
        <StatusLine className="screen-status" />
        <Toast />
    </main>
);

const SCRIPT = `import {
    attachBusy,
    attachDialog,
    attachForm,
    attachProgress,
    attachRoving,
    attachStatus,
    attachStepper,
    attachTable,
    attachToast,
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
    toast: (signal) => attachToast(document.querySelector('.dk-toast'), withSignal(signal)),
    form: (signal) =>
        attachForm(document.querySelector('#join'), withSignal(signal, { status: line })),
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
    // Polled, since the dialog closed by its teardown hears its close event a task later, through a
    // listener that comes off as it does.
    await expect.poll(() => count(PARTS)).toBe(before);
});

test('does nothing after its teardown', async ({ page }) => {
    await opened(page);
    await page.evaluate(`(() => {
        window.controller = new AbortController();
        window.returned = all(controller.signal);
        window.show = kit.dialog(controller.signal);
        controller.abort();
    })()`);
    // Calls after the teardown, which lands a microtask after the abort: detach again, show, a busy
    // mark, a step of progress, a press.
    await page.evaluate(`(() => {
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

test('keeps each piece attached until every signal holding it has aborted', async ({ page }) => {
    await opened(page);
    const same = await page.evaluate(`(() => {
        window.first = new AbortController();
        window.later = new AbortController();
        const one = all(first.signal);
        const two = all(later.signal);
        first.abort();
        return Object.keys(one).filter((name) => one[name] !== two[name]);
    })()`);
    expect(same).toEqual([]);
    expect(await attached(page)).toEqual(ALL);
    await page.evaluate('later.abort()');
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

test('keeps a dialog open with its opener when it is aborted and attached again in one task', async ({
    page,
}) => {
    await opened(page);
    await page.evaluate(`(() => {
        const controller = new AbortController();
        kit.dialog(controller.signal)(document.querySelector('#finish'));
        controller.abort();
        window.later = new AbortController();
        kit.dialog(later.signal);
    })()`);
    await page.evaluate('frames()');
    await expect(page.locator('#end-game')).toHaveAttribute('open');
    await page.evaluate(`document.querySelector('#end-game').close()`);
    await expect(page.locator('#finish')).toBeFocused();
});

test('leaves a dialog attached again as the last is taken down open to its own closings', async ({
    page,
}) => {
    await opened(page);
    // The close the teardown makes arrives once the new attach listens, which would send focus to
    // its returnTo if it took that closing for its own. The new attach comes a microtask after the
    // abort, once the takedown has landed, since one in the same task would keep the dialog.
    await page.evaluate(`(async () => {
        const controller = new AbortController();
        kit.dialog(controller.signal)(document.querySelector('#finish'));
        controller.abort();
        await Promise.resolve();
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

test('keeps every piece aborted and attached again in one task, with its handle', async ({
    page,
}) => {
    await opened(page);
    const changed = await page.evaluate(`(() => {
        const first = new AbortController();
        const one = { ...all(first.signal), toast: kit.toast(first.signal), form: kit.form(first.signal) };
        first.abort();
        window.later = new AbortController();
        const two = { ...all(later.signal), toast: kit.toast(later.signal), form: kit.form(later.signal) };
        return Object.keys(one).filter((name) => one[name] !== two[name]);
    })()`);
    expect(changed).toEqual([]);
    expect(await attached(page)).toEqual(ALL);
    // The later signal holds each piece now, and takes it down.
    await page.evaluate('later.abort()');
    expect(await attached(page)).toEqual(NONE);
});

test('keeps what each piece was doing through an abort and an attach in one task', async ({
    page,
}) => {
    // Counts each observer made for the group and each time the form's check sets its noValidate.
    await page.addInitScript(() => {
        const counted = window as unknown as { observers: number; checks: number };
        counted.observers = 0;
        counted.checks = 0;
        const Made = window.ResizeObserver;
        window.ResizeObserver = class extends Made {
            override observe(target: Element, options?: ResizeObserverOptions) {
                if (target.classList.contains('dk-button-grid')) counted.observers += 1;
                super.observe(target, options);
            }
        };
        const own = Object.getOwnPropertyDescriptor(HTMLFormElement.prototype, 'noValidate');
        Object.defineProperty(HTMLFormElement.prototype, 'noValidate', {
            ...own,
            set(this: HTMLFormElement, value: boolean) {
                if (this.id === 'join') counted.checks += 1;
                own?.set?.call(this, value);
            },
        });
    });
    await stillClock(page.clock);
    await opened(page);
    await page.evaluate(`(() => {
        window.first = new AbortController();
        kit.busy(first.signal);
        kit.roving(first.signal);
        kit.dialog(first.signal)(document.querySelector('#finish'));
        kit.toast(first.signal)('Round 2 saved.');
        kit.form(first.signal);
        document.querySelector('#join').requestSubmit();
        document.querySelector('#busy').setAttribute('data-busy', 'Saving the rule.');
    })()`);
    await expect(page.locator('#busy')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('#name')).toHaveAttribute('aria-invalid', 'true');
    const before = await page.evaluate(`({ observers, checks })`);
    await page.evaluate(`(() => {
        window.marks = 0;
        new MutationObserver((records) => {
            marks += records.length;
        }).observe(document.querySelector('#busy'), { attributeFilter: ['aria-disabled'] });
        first.abort();
        window.later = new AbortController();
        kit.busy(later.signal);
        kit.roving(later.signal);
        kit.dialog(later.signal);
        kit.toast(later.signal);
        kit.form(later.signal);
    })()`);
    // The dialog and the toast stay open, the group was not observed again, and the form kept its
    // errors and its check.
    await expect(page.locator('#end-game')).toHaveAttribute('open');
    await expect(page.locator('.dk-toast')).toHaveAttribute('data-shown');
    await expect(page.locator('#name')).toHaveAttribute('aria-invalid', 'true');
    expect(await page.evaluate(`({ observers, checks })`)).toEqual(before);
    // The busy wait kept its mark and says its words once.
    await page.clock.runFor(5000);
    expect(await page.evaluate('marks')).toBe(0);
    await expect(page.locator('#busy')).toHaveAttribute('aria-disabled', 'true');
    expect(
        await page.evaluate('window.heard.filter((words) => words === "Saving the rule.")')
    ).toEqual(['Saving the rule.']);
    // The dialog hands focus back to the opener it was opened from.
    await page.evaluate(`document.querySelector('#end-game').close()`);
    await expect(page.locator('#finish')).toBeFocused();
});

test('starts each piece afresh where it is attached a microtask after the abort', async ({
    page,
}) => {
    await opened(page);
    const same = await page.evaluate(`(async () => {
        const first = new AbortController();
        const one = all(first.signal);
        kit.dialog(first.signal)(document.querySelector('#finish'));
        document.querySelector('#busy').setAttribute('data-busy', '');
        // The busy mark goes on as the button's observer hears data-busy.
        await null;
        window.marks = 0;
        new MutationObserver((records) => {
            marks += records.length;
        }).observe(document.querySelector('#busy'), { attributeFilter: ['aria-disabled'] });
        first.abort();
        await Promise.resolve();
        window.dialogOpen = document.querySelector('#end-game').open;
        const two = all(new AbortController().signal);
        return Object.keys(one).filter((name) => one[name] === two[name]);
    })()`);
    expect(same).toEqual([]);
    expect(await attached(page)).toEqual(ALL);
    // The busy mark came off with the takedown and went back with the new attach, and the dialog
    // was closed.
    expect(await page.evaluate('marks')).toBe(2);
    await expect(page.locator('#busy')).toHaveAttribute('aria-disabled', 'true');
    expect(await page.evaluate('dialogOpen')).toBe(false);
});

test('hands focus back from a toast taken down and then removed from the page in one task', async ({
    page,
}) => {
    await opened(page);
    await page.evaluate(`(() => {
        window.controller = new AbortController();
        document.querySelector('#start').focus();
        kit.toast(controller.signal)('Round 2 saved.');
    })()`);
    await page.locator('.dk-toast-close').focus();
    await page.evaluate(`(() => {
        controller.abort();
        document.querySelector('.dk-toast').remove();
    })()`);
    await expect(page.locator('#start')).toBeFocused();
});

test('counts its steps again only where a join gives another count', async ({ page }) => {
    await stillClock(page.clock);
    await opened(page);
    await page.evaluate(`(() => {
        window.controller = new AbortController();
        kit.progress(controller.signal);
    })()`);
    // A step crossed, and the bar joined in the same task with the same count written out, as a
    // hook's ref made afresh gives it, before the bar's observer hears the step.
    await page.evaluate(`(() => {
        document.querySelector('progress').value = 25;
        kit.progress(controller.signal, { steps: 4 });
    })()`);
    await page.clock.runFor(1000);
    expect(await page.evaluate('window.heard')).toHaveLength(1);
});

test('keeps a toast shown while focus leaves it and comes back in one task', async ({ page }) => {
    await stillClock(page.clock);
    await opened(page);
    await page.evaluate(`kit.toast()('Round 2 saved.')`);
    await page.locator('.dk-toast-close').focus();
    await page.evaluate(`(() => {
        document.querySelector('#start').focus();
        document.querySelector('.dk-toast-close').focus();
    })()`);
    await page.clock.runFor(10_000);
    await expect(page.locator('.dk-toast')).toHaveAttribute('data-shown');
});

test("starts a toast's wait again once it is moved in the page with focus in it", async ({
    page,
    browserName,
}) => {
    // Only Chromium fires focusout as an element with focus in it leaves the page.
    test.skip(browserName !== 'chromium', 'WebKit and Firefox fire no focusout as the toast moves');
    await stillClock(page.clock);
    await opened(page);
    await page.evaluate(`kit.toast()('Round 2 saved.')`);
    await page.locator('.dk-toast-close').focus();
    // Taken out in one task and put back in a later one, as a page that draws it elsewhere does.
    await page.evaluate(`(() => {
        window.toast = document.querySelector('.dk-toast');
        window.home = toast.parentElement;
        toast.remove();
    })()`);
    await page.evaluate('home.append(toast)');
    await page.clock.runFor(10_000);
    await expect(page.locator('.dk-toast')).not.toHaveAttribute('data-shown');
});

test('leaves focus on a control outside a toast that is removed and taken down as focus moves there', async ({
    page,
}) => {
    await opened(page);
    await page.evaluate(`(() => {
        window.controller = new AbortController();
        document.querySelector('#start').focus();
        kit.toast(controller.signal)('Round 2 saved.');
    })()`);
    await page.locator('.dk-toast-close').focus();
    // As a press on a control outside the toast whose handler takes the toast away.
    await page.evaluate(`(() => {
        document.querySelector('#target').focus();
        document.querySelector('.dk-toast').remove();
        controller.abort();
    })()`);
    await page.evaluate('frames()');
    await expect(page.locator('#target')).toBeFocused();
});

test('starts a piece afresh where it is attached without a signal in the task its holder let go', async ({
    page,
}) => {
    await opened(page);
    const same = await page.evaluate(`(() => {
        const first = new AbortController();
        const one = all(first.signal);
        kit.dialog(first.signal)(document.querySelector('#finish'));
        first.abort();
        // The page now holds each piece for its life, with nothing of the holder's carried over.
        const two = all();
        window.dialogOpen = document.querySelector('#end-game').open;
        return Object.keys(one).filter((name) => one[name] === two[name]);
    })()`);
    expect(same).toEqual([]);
    expect(await page.evaluate('dialogOpen')).toBe(false);
    expect(await attached(page)).toEqual(ALL);
});
