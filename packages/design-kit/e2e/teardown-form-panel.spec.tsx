import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { InputField, StatusLine } from '../src/react.js';
import { countLeaks, leaksOf, listenersOn } from './leaks.js';
import { servePage, stillClock } from './page.js';

/*
 * The teardown contract of record 22 on a form's check and a panel's button: a signal already
 * aborted attaches nothing, and aborting takes away what the attach set up, its listeners, its
 * timers and frames, and the errors and marks it drew, with nothing said after. A form's check
 * stays while any attach in the form does, and an open panel stays the kit's while an attached
 * button names it, so Escape and its Close close it alike once the button that opened it is let go.
 * The behavior runs in Chromium, WebKit and Firefox, and so do the counts of listeners, timers and
 * frames, through the counters in leaks.ts.
 */

const CLOSE = `<div class="dk-close"><button type="button" class="dk-button dk-button-text dk-button-quiet"><span aria-hidden="true">×</span><span class="dk-visually-hidden">Close round tips</span></button></div>`;

const BODY = `${renderToStaticMarkup(
    <main>
        <form id="join">
            <div id="part">
                <InputField id="name" name="name" label="Name" required />
            </div>
            <InputField id="email" name="email" label="Email" type="email" required />
            <button type="submit">Join</button>
        </form>
        <StatusLine className="screen-status" />
    </main>
)}
<p><button type="button" id="tips-button" aria-expanded="false" aria-controls="round-tips">Tips</button>
<button type="button" id="tips-again" aria-expanded="false" aria-controls="round-tips">More tips</button>
<button type="button" id="rules-button" aria-expanded="false" aria-controls="rules">Rules</button></p>
<div class="dk-panel" id="round-tips" hidden><h2 class="dk-panel-title">Round tips</h2>${CLOSE}<p><a href="#deal" id="deal">How to deal</a></p></div>
<div class="dk-panel" id="rules" hidden><p>The lowest score wins.</p></div>`;

/* Every message the status line puts in is kept in `heard`. */
const SCRIPT = `import { attachForm, attachPanel } from './controls.js';
const form = document.querySelector('#join');
const line = document.querySelector('.screen-status');
window.heard = [];
new MutationObserver(() => {
    if (line.textContent) window.heard.push(line.textContent);
}).observe(line, { childList: true, characterData: true, subtree: true });
window.kit = {
    form: (signal, where = '#join') =>
        attachForm(document.querySelector(where), signal ? { status: line, signal } : { status: line }),
    panel: (selector, signal) =>
        attachPanel(document.querySelector(selector), signal ? { signal } : undefined),
};
window.attachShadowButton = () =>
    attachPanel(document.querySelector('#host').shadowRoot.querySelector('button'));
window.ready = true;`;

/** How many listeners the counters see on the targets in the list an expression in the page gives. */
type Count = (targets: string) => Promise<number>;

/** The page with its controls loaded and nothing attached yet, and how to count its listeners. */
const opened = async (page: Page): Promise<Count> => {
    await countLeaks(page);
    await servePage(page, { title: 'Teardown', body: BODY, script: SCRIPT });
    await page.waitForFunction(() => 'ready' in window);
    return (targets) => listenersOn(page, targets);
};

/** The form, its fields and the document, where the form's check puts its listeners. */
const FORM = `[document, ...document.querySelectorAll('#join, #join *')]`;

/** The panels' buttons and the document, where every panel's listeners sit. */
const PANELS = `[document, ...document.querySelectorAll('button[aria-controls]')]`;

/** What the form shows of the kit: its noValidate, its marks and the errors drawn in it. */
const formState = (page: Page) =>
    page.locator('#join').evaluate((form) => ({
        noValidate: (form as HTMLFormElement).noValidate,
        marked: form.querySelectorAll('[aria-invalid]').length,
        errors: form.querySelectorAll('.dk-field-error').length,
    }));

/** The timers and frames the page has set and not yet run or cleared. */
const live = async (page: Page) => {
    const { timers, frames } = await leaksOf(page);
    return timers + frames;
};
const heard = (page: Page) => page.evaluate('window.heard');

test.describe('a form', () => {
    test('takes its check down when its signal aborts, with a refusal and a reset still due', async ({
        page,
    }) => {
        await stillClock(page.clock);
        const count = await opened(page);
        const listeners = await count(FORM);
        const timers = await live(page);
        const markup = await formState(page);
        // A submit the kit refuses waits a frame to move focus and say so, and a reset waits a task
        // to take the errors away and say the form is cleared, and the abort comes before either.
        await page.evaluate(`(() => {
            window.controller = new AbortController();
            window.refuse = kit.form(controller.signal);
            document.querySelector('#join').requestSubmit();
            document.querySelector('#join').reset();
        })()`);
        expect(await live(page)).toBeGreaterThan(timers);
        expect(await count(FORM)).toBeGreaterThan(listeners);
        expect((await formState(page)).errors).toBeGreaterThan(0);
        await page.evaluate('controller.abort()');
        expect(await live(page)).toBe(timers);
        expect(await count(FORM)).toBe(listeners);
        expect(await formState(page)).toEqual(markup);
        // A refusal asked for after the teardown does nothing, and nothing is said, not even that
        // the form is cleared.
        await page.evaluate('window.refuse()');
        expect(await live(page)).toBe(timers);
        await page.clock.runFor(3000);
        expect(await heard(page)).toEqual([]);
        await expect(page.getByLabel('Name')).not.toBeFocused();
    });

    test('attaches nothing when given a signal already aborted', async ({ page }) => {
        const count = await opened(page);
        const listeners = await count(FORM);
        const markup = await formState(page);
        await page.evaluate(`(() => {
            const aborted = AbortSignal.abort();
            kit.form(aborted)();
            kit.form(aborted, '#part');
        })()`);
        expect(await count(FORM)).toBe(listeners);
        expect(await formState(page)).toEqual(markup);
        // Nothing was kept, so attaching without a signal attaches the form afresh.
        await page.evaluate('kit.form()');
        await page.getByRole('button', { name: 'Join' }).click();
        await expect(page.getByLabel('Name')).toBeFocused();
        await expect(page.locator('#name-error')).toHaveText('Error: Enter a value.');
    });

    test('keeps checking the form until the last attach in it is taken down', async ({ page }) => {
        const count = await opened(page);
        const listeners = await count(FORM);
        const markup = await formState(page);
        await page.evaluate(`(() => {
            window.whole = new AbortController();
            window.part = new AbortController();
            kit.form(part.signal, '#part');
            kit.form(whole.signal);
            whole.abort();
        })()`);
        // The part's attach checks the form once the form's own is taken down.
        await page.getByRole('button', { name: 'Join' }).click();
        await expect(page.getByLabel('Name')).toBeFocused();
        await expect(page.locator('#name-error')).toHaveText('Error: Enter a value.');
        await page.evaluate('part.abort()');
        expect(await count(FORM)).toBe(listeners);
        expect(await formState(page)).toEqual(markup);
    });

    test("clears the errors a part's attach drew once the form's own attach checks it", async ({
        page,
    }) => {
        // A still clock holds the second refusal's frame until after the reset, as a busy page
        // can, so a refusal still due at the reset is seen to be called off.
        await stillClock(page.clock);
        await opened(page);
        await page.evaluate(`kit.form(undefined, '#part')`);
        await page.getByRole('button', { name: 'Join' }).click();
        await page.clock.runFor(500);
        await expect(page.locator('#name-error')).toHaveText('Error: Enter a value.');
        // The form's own attach checks it from now on, and a submit draws each error once.
        await page.evaluate('kit.form()');
        await page.getByRole('button', { name: 'Join' }).click();
        await expect(page.locator('.dk-field-error')).toHaveCount(2);
        // A reset takes away every error, the part's among them, calls off the refusal still due
        // and says the form is cleared.
        await page.evaluate(`document.querySelector('#join').reset()`);
        await page.clock.runFor(3000);
        await expect(page.locator('.dk-field-error')).toHaveCount(0);
        expect(await heard(page)).toEqual([
            'Name: Error: Enter a value. 2 fields need attention.',
            'Form cleared.',
        ]);
    });
});

test.describe('a panel', () => {
    test("lets its button go when its signal aborts, and the document's listeners with the last", async ({
        page,
    }) => {
        const count = await opened(page);
        const listeners = await count(PANELS);
        await page.evaluate(`(() => {
            window.controller = new AbortController();
            window.tips = kit.panel('#tips-button', controller.signal);
            kit.panel('#rules-button', controller.signal);
        })()`);
        expect(await count(PANELS)).toBeGreaterThan(listeners);
        await page.locator('#tips-button').click();
        await expect(page.locator('#round-tips')).toBeVisible();
        await page.evaluate('controller.abort()');
        expect(await count(PANELS)).toBe(listeners);
        // Called once the takedown has landed, a microtask after the abort, as record 23 has it.
        await page.evaluate('tips.set(false)');
        // What the attach returned does nothing after the teardown, and a press is the page's.
        await expect(page.locator('#round-tips')).toBeVisible();
        await page.locator('#rules-button').click();
        await expect(page.locator('#rules')).toBeHidden();
    });

    test('attaches nothing when given a signal already aborted', async ({ page }) => {
        const count = await opened(page);
        const listeners = await count(PANELS);
        await page.evaluate(`(() => {
            const aborted = AbortSignal.abort();
            const control = kit.panel('#tips-button', aborted);
            control.set(true);
            control.detach();
        })()`);
        expect(await count(PANELS)).toBe(listeners);
        await expect(page.locator('#round-tips')).toBeHidden();
        await expect(page.locator('#tips-button')).not.toHaveAttribute('tabindex');
        // Nothing was kept, so attaching without a signal attaches the button afresh.
        await page.evaluate(`kit.panel('#tips-button')`);
        await page.locator('#tips-button').click();
        await expect(page.locator('#round-tips')).toBeVisible();
    });

    for (const way of ['Escape', 'its Close'] as const) {
        test(`closes by ${way} once the button that opened it is let go, focus going to the next`, async ({
            page,
        }) => {
            await opened(page);
            await page.evaluate(`(() => {
                window.controller = new AbortController();
                kit.panel('#tips-button', controller.signal);
                kit.panel('#tips-again');
            })()`);
            await page.locator('#tips-button').click();
            await expect(page.locator('#round-tips')).toBeVisible();
            await page.evaluate('controller.abort()');
            // The button let go says it opens nothing, since it no longer follows the panel.
            await expect(page.locator('#tips-button')).toHaveAttribute('aria-expanded', 'false');
            await page.locator('#round-tips h2').click();
            if (way === 'Escape') await page.keyboard.press('Escape');
            else await page.getByRole('button', { name: 'Close round tips' }).click();
            await expect(page.locator('#round-tips')).toBeHidden();
            await expect(page.locator('#tips-again')).toHaveAttribute('aria-expanded', 'false');
            await expect(page.locator('#tips-again')).toBeFocused();
        });
    }

    test('closes by Escape when its button is drawn again while it is open', async ({ page }) => {
        await opened(page);
        await page.evaluate(`(() => {
            window.first = kit.panel('#tips-button');
            kit.panel('#rules-button');
        })()`);
        await page.locator('#tips-button').click();
        await page.evaluate(`(() => {
            first.detach();
            const old = document.querySelector('#tips-button');
            old.replaceWith(old.cloneNode(true));
            kit.panel('#tips-button');
        })()`);
        await expect(page.locator('#tips-button')).toHaveAttribute('aria-expanded', 'true');
        await page.locator('#round-tips h2').click();
        await page.keyboard.press('Escape');
        await expect(page.locator('#round-tips')).toBeHidden();
        await expect(page.locator('#tips-button')).toBeFocused();
    });

    test('keeps its panel open and closes it by Escape when its one button is drawn again', async ({
        page,
    }) => {
        await opened(page);
        await page.evaluate(`window.first = kit.panel('#tips-button')`);
        await page.locator('#tips-button').click();
        // The old button's teardown takes the panels' listeners off with it, as the last let go,
        // and the one drawn in its place says it starts closed, as a remount in React draws it.
        await page.evaluate(`(() => {
            first.detach();
            const old = document.querySelector('#tips-button');
            const drawn = old.cloneNode(true);
            drawn.setAttribute('aria-expanded', 'false');
            old.replaceWith(drawn);
            kit.panel('#tips-button');
        })()`);
        await expect(page.locator('#round-tips')).toBeVisible();
        await expect(page.locator('#tips-button')).toHaveAttribute('aria-expanded', 'true');
        await page.locator('#round-tips h2').click();
        await page.keyboard.press('Escape');
        await expect(page.locator('#round-tips')).toBeHidden();
        await expect(page.locator('#tips-button')).toBeFocused();
    });

    test('hands its panel to an attached button in a shadow root', async ({ page }) => {
        await opened(page);
        await page.evaluate(`(() => {
            const host = document.createElement('div');
            host.id = 'host';
            document.querySelector('#rules').before(host);
            host.attachShadow({ mode: 'open' }).innerHTML =
                '<button type="button" aria-expanded="false" aria-controls="round-tips">Shadow tips</button>';
            window.controller = new AbortController();
            kit.panel('#tips-button', controller.signal);
            attachShadowButton();
        })()`);
        await page.locator('#tips-button').click();
        await page.evaluate('controller.abort()');
        await page.locator('#round-tips h2').click();
        await page.keyboard.press('Escape');
        await expect(page.locator('#round-tips')).toBeHidden();
        await expect(page.getByRole('button', { name: 'Shadow tips' })).toBeFocused();
    });

    test('closes by neither once no attached button names it', async ({ page }) => {
        await opened(page);
        await page.evaluate(`(() => {
            window.controller = new AbortController();
            kit.panel('#tips-button', controller.signal);
            kit.panel('#rules-button');
        })()`);
        await page.locator('#tips-button').click();
        await page.evaluate('controller.abort()');
        await page.locator('#round-tips h2').click();
        await page.keyboard.press('Escape');
        await expect(page.locator('#round-tips')).toBeVisible();
        await page.getByRole('button', { name: 'Close round tips' }).click();
        await expect(page.locator('#round-tips')).toBeVisible();
    });
});
