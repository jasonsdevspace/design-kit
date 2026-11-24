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
import { hearing } from './page.js';

/*
 * Every piece record 22's teardown contract holds, in one page that teardown.spec.tsx and
 * leaks.spec.tsx both open: the markup, and a table naming each piece with how it is attached with
 * a signal, what a visitor or the page does with it, and what is called once it is taken down. A
 * piece added here is held by both specs. Each piece that speaks speaks on the screen's line,
 * attached with the same signal, as a page takes a screen down with one controller. The status line
 * itself is a line of its own, so a test of the status line is not passed by another piece holding
 * the screen's line.
 */

const CLOSE = `<div class="dk-close"><button type="button" class="dk-button dk-button-text dk-button-quiet"><span aria-hidden="true">×</span><span class="dk-visually-hidden">Close round tips</span></button></div>`;

/*
 * The toast's buttons are written without a tabindex, as a page's own markup may be, so the
 * tabindex its attach adds shows it attached and can be seen to come off with it. A second panel
 * button and a second panel let a test hand a panel on or keep one apart.
 */
export const BODY = `${renderToStaticMarkup(
    <main>
        {themeSwitch}
        <pre id="code">npm install @jasonsdevspace/design-kit</pre>
        <pre id="other">npm run verify</pre>
        {copyButton}
        <button id="start" type="button">
            Start
        </button>
        <button id="target" type="button">
            Target
        </button>
        <form id="join">
            <div id="part">
                <InputField id="name" name="name" label="Name" required />
            </div>
            <InputField id="email" name="email" label="Email" type="email" required />
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
        <StatusLine className="piece-status" />
    </main>
)}
<p><button type="button" id="tips-button" aria-expanded="false" aria-controls="round-tips">Tips</button>
<button type="button" id="tips-again" aria-expanded="false" aria-controls="round-tips">More tips</button>
<button type="button" id="rules-button" aria-expanded="false" aria-controls="rules">Rules</button></p>
<div class="dk-panel" id="round-tips" hidden><h2 class="dk-panel-title">Round tips</h2>${CLOSE}<p><a href="#deal" id="deal">How to deal</a></p></div>
<div class="dk-panel" id="rules" hidden><p>The lowest score wins.</p></div>
${renderToStaticMarkup(<Toast />).replaceAll(' tabindex="0"', '')}`;

/*
 * The page's script, with what a spec adds run after the table. The controls are on the window as
 * `kit`, the screen's line as `line`, and every message the line puts in is kept in `heard`. The
 * clipboard is the page's own and answers at once, or waits for `release` while `hold` is set, and
 * what it was given is kept in `written`. Each piece in the table has `attach`, `use` and `after`,
 * `detach` where what the attach returns takes it down, and `shows` where the page draws a mark of
 * it attached. The theme's own listeners, which stay for the page's life, are set before anything
 * is counted.
 */
export const script = (more = ''): string => `import * as kit from './controls.js';
window.kit = kit;
const $ = (selector) => document.querySelector(selector);
window.$ = $;
let answer = () => undefined;
window.hold = false;
window.written = [];
Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
        writeText: (text) =>
            new Promise((done) => {
                window.written.push(text);
                if (window.hold) answer = done;
                else done();
            }),
    },
});
window.release = () => answer();
const line = $('.screen-status');
window.line = line;
${hearing('.screen-status')}const screen = (signal) => kit.attachStatus(line, { signal });
const group = $('.dk-theme-switch');
const form = $('#join');
const steps = $('.dk-stepper');
const grid = $('.dk-button-grid');
const cell = $('.dk-button-grid button');
const busy = $('#busy');
const bar = $('#import');
const key = (target, name) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
const detach = (handle) => handle();
window.pieces = {
    'the theme switch': {
        attach: (signal) => kit.attachThemeSwitch(group, { signal }),
        // Its choices opened, which listens to the document, and one picked.
        use: () => {
            group.querySelector('.dk-theme-switch-button').click();
            group.querySelectorAll('input[type="radio"]')[2].click();
        },
        after: () => {
            kit.chooseTheme('light');
            group.querySelector('.dk-theme-switch-button').click();
        },
        detach,
        shows: () => !group.hidden,
    },
    'the copy button': {
        attach: (signal) => {
            screen(signal);
            return kit.attachCopyButton($('.dk-copy'), {
                source: () => $('#code'),
                status: line,
                signal,
            });
        },
        use: () => $('.dk-copy').click(),
        after: () => {
            $('.dk-copy').click();
        },
        detach,
        shows: () => !$('.dk-copy').hidden,
    },
    // A line of its own, which no other piece speaks on, so only its own holders keep it.
    'the status line': {
        attach: (signal) => kit.attachStatus($('.piece-status'), { signal }),
        use: (say) => {
            say('Saved.');
            say('3 still to enter.', { settle: 700 });
        },
        after: (say) => say('Not said.'),
    },
    'the toast': {
        attach: (signal) => kit.attachToast($('.dk-toast'), { signal }),
        use: (show) => {
            show('Round 2 saved.');
            window.dismiss = show('Round 3 saved.');
        },
        after: (show) => {
            window.dismiss?.();
            show('Round 4 saved.');
        },
        shows: () => $('.dk-toast-close').hasAttribute('tabindex'),
    },
    'the form': {
        attach: (signal) => {
            screen(signal);
            return kit.attachForm(form, { status: line, signal });
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
        shows: () => form.noValidate,
    },
    'a panel': {
        attach: (signal) => kit.attachPanel($('#tips-button'), { signal }),
        use: () => $('#tips-button').click(),
        after: (control) => {
            control.set(true);
            $('#tips-button').click();
        },
        detach: (control) => control.detach(),
    },
    'the stepper': {
        attach: (signal) => kit.attachStepper(steps, { signal }),
        // A press, a value out of range, a reset and focus leaving, each of which waits, and a
        // button focused last, so the takedown hands focus back from it.
        use: () => {
            steps.querySelector('.dk-stepper-up').click();
            const input = steps.querySelector('input');
            input.value = '99';
            input.dispatchEvent(new Event('change', { bubbles: true }));
            $('#counts').reset();
            steps.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
            steps.querySelector('.dk-stepper-up').focus();
        },
        // A reset and then a press, so a stepper still attached would leave the value raised.
        after: () => {
            $('#counts').reset();
            steps.querySelector('.dk-stepper-up').click();
        },
        detach,
        shows: () => !steps.querySelector('.dk-stepper-up').hidden,
    },
    "a table's frame": {
        attach: (signal) => kit.attachTable($('.dk-table-scroll'), { signal }),
        use: () => $('.dk-table-scroll').focus(),
        after: () => {
            $('#start').focus();
            $('.dk-table-scroll').focus();
        },
        detach,
    },
    'a group the arrow keys move through': {
        attach: (signal) => kit.attachRoving(grid, { signal }),
        use: () => {
            cell.focus();
            key(cell, 'ArrowRight');
        },
        after: () => {
            key(cell, 'ArrowRight');
        },
        detach,
        // The markup gives the cells no tabindex, so any is the attach's.
        shows: () =>
            grid.getAttribute('role') === 'toolbar' && grid.querySelector('[tabindex]') !== null,
    },
    'a busy button': {
        attach: (signal) => {
            screen(signal);
            return kit.attachBusy(busy, { status: line, signal });
        },
        // Busy, so its wait for the words begins.
        use: () => {
            busy.removeAttribute('data-busy');
            busy.setAttribute('data-busy', 'Saving the rule.');
        },
        after: () => {
            busy.removeAttribute('data-busy');
            busy.setAttribute('data-busy', 'Saving the rule.');
        },
        detach,
    },
    progress: {
        attach: (signal) => {
            screen(signal);
            return kit.attachProgress(bar, { status: line, done: 'Imported.', signal });
        },
        // A step crossed, which is said, from wherever the last use left the bar.
        use: () => {
            bar.value = bar.value >= 20 ? 10 : 30;
        },
        after: () => {
            bar.value = bar.max;
        },
        detach,
    },
    'the dialog': {
        attach: (signal) => kit.attachDialog($('#end-game'), { signal, stay: true }),
        use: (open) => open($('#finish')),
        after: (open) => open($('#finish')),
    },
    'a focus request': {
        attach: (signal) => {
            $('#start').focus();
            return kit.moveFocus('target', { signal });
        },
        use: () => undefined,
        after: (cancel) => cancel(),
    },
    // Asked as a view that changed on a press asks, so it waits for its frame whatever the last
    // input was.
    'a view taking focus as it arrives': {
        attach: (signal) => {
            $('#start').focus();
            return kit.focusOnArrival('target', { signal, changed: true });
        },
        use: () => undefined,
        after: (cancel) => cancel(),
    },
};
const once = new AbortController();
kit.attachThemeSwitch(group, { signal: once.signal });
once.abort();
${more}
window.ready = true;`;

/** Every piece in the table, by its name there. */
export const PIECES = [
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
    'a view taking focus as it arrives',
] as const;

/**
 * The pieces an attach keeps by their element, which a later attach joins and a signal holds, every
 * piece but a focus request and a view's request as it arrives, each made afresh by each call.
 */
export const KEPT = PIECES.filter(
    (name) => name !== 'a focus request' && name !== 'a view taking focus as it arrives'
);

/** A piece in the table, as the page holds it. */
export type Piece = {
    readonly attach: (signal?: AbortSignal) => unknown;
    readonly use: (handle: unknown) => void;
    readonly after: (handle: unknown) => void;
    readonly detach?: (handle: unknown) => void;
    readonly shows?: () => boolean;
};
