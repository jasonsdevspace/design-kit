import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { copyButton, themeSwitch } from '../examples/examples.js';
import { countLeaks, listenersOn } from './leaks.js';
import { servePage } from './page.js';

/*
 * The teardown contract of record 22 on the theme switch and the copy button: a signal already
 * aborted does nothing, aborting takes away everything the attach set up, as its detach does, a
 * detach called twice, or after the abort, leaves a newer attach alone, each signal that attached
 * the piece holds it until it aborts, as record 23 has it, and nothing the piece did before its
 * teardown acts after it. The behavior runs in Chromium, WebKit and Firefox, and so do the counts
 * of listeners, through the counters in leaks.ts.
 */

const BODY = renderToStaticMarkup(
    <main>
        {themeSwitch}
        <pre id="code">npm install @jasonsdevspace/design-kit</pre>
        <pre id="other">npm run verify</pre>
        {copyButton}
    </main>
);

/*
 * The clipboard is the page's own, so a press copies at once, or waits for the test's `release`
 * while `hold` is set, as a clipboard slow to answer would, and what it was given is kept.
 */
const SCRIPT = `import { attachCopyButton, attachThemeSwitch, chooseTheme } from './controls.js';
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
const group = document.querySelector('.dk-theme-switch');
const button = document.querySelector('.dk-copy');
const status = document.querySelector('[role="status"]');
window.kit = {
    switchWith: (signal) => attachThemeSwitch(group, signal ? { signal } : undefined),
    copyWith: (signal, from = '#code') => {
        const copying = { source: () => document.querySelector(from), status };
        return attachCopyButton(button, signal ? { ...copying, signal } : copying);
    },
    chooseTheme,
};
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

/** The switch's and the copy button's own elements. */
const PARTS = `[...document.querySelectorAll('.dk-theme-switch, .dk-theme-switch *, .dk-copy')]`;

/** Which of the copy button's words shows: 0 for Copy, 1 for Copied, 2 for Selected. */
const wordOf = (page: Page): Promise<number> =>
    page
        .locator('.dk-copy')
        .evaluate((button) =>
            [...button.querySelectorAll('.dk-copy-words > *')].findIndex(
                (word) => !word.hasAttribute('aria-hidden')
            )
        );

test('attaches nothing when given a signal already aborted', async ({ page }) => {
    const count = await opened(page);
    const before = await count(PARTS);
    await page.evaluate(`(() => {
        const aborted = AbortSignal.abort();
        window.detachSwitch = kit.switchWith(aborted);
        window.detachCopy = kit.copyWith(aborted);
    })()`);
    await expect(page.locator('.dk-theme-switch')).toBeHidden();
    await expect(page.locator('.dk-copy')).toBeHidden();
    expect(await count(PARTS)).toBe(before);
    // What either returns does nothing, so calling it is harmless.
    await page.evaluate(`(() => {
        window.detachSwitch();
        window.detachCopy();
    })()`);
    // Nothing was kept for either, so attaching without a signal attaches each afresh.
    await page.evaluate(`(() => {
        kit.switchWith();
        kit.copyWith();
    })()`);
    await expect(page.locator('.dk-theme-switch')).toBeVisible();
    await expect(page.locator('.dk-copy')).toBeVisible();
});

test('takes nothing from a repeat attach given a signal already aborted', async ({ page }) => {
    await opened(page);
    await page.evaluate(`(() => {
        window.first = kit.copyWith();
        window.repeated = kit.copyWith(AbortSignal.abort(), '#other');
    })()`);
    expect(await page.evaluate('window.repeated === window.first')).toBe(false);
    // The source the repeat named is not taken, so the button still copies the first one's.
    await page.locator('.dk-copy').click();
    await expect
        .poll(() => page.evaluate('window.written'))
        .toEqual(['npm install @jasonsdevspace/design-kit']);
});

test('takes everything down when the signal aborts, as the detach does', async ({ page }) => {
    const count = await opened(page);
    const before = await count(PARTS);
    await page.evaluate(`(() => {
        window.controller = new AbortController();
        kit.switchWith(controller.signal);
        kit.copyWith(controller.signal);
    })()`);
    await expect(page.locator('.dk-theme-switch')).toBeVisible();
    expect(await count(PARTS)).toBeGreaterThan(before);
    await page.locator('.dk-copy').click();
    await expect.poll(() => wordOf(page)).toBe(1);
    await page.evaluate('controller.abort()');
    await expect(page.locator('.dk-theme-switch')).toBeHidden();
    await expect(page.locator('.dk-copy')).toBeHidden();
    // The word shown goes back to Copy with its timer, and every listener on their own elements
    // comes off.
    expect(await wordOf(page)).toBe(0);
    expect(await count(PARTS)).toBe(before);
});

test("takes the document's listener off a switch taken down with its choices open", async ({
    page,
}) => {
    const count = await opened(page);
    const before = await count('[document]');
    await page.evaluate(`(() => {
        window.controller = new AbortController();
        kit.switchWith(controller.signal);
        document.querySelector('.dk-theme-switch-button').click();
    })()`);
    await expect(page.locator('.dk-theme-switch-button')).toHaveAttribute('aria-expanded', 'true');
    expect(await count('[document]')).toBe(before + 1);
    // The page marks the choices closed itself before the abort, which a teardown that closed them
    // by reading the button would take for nothing to close.
    await page.evaluate(`(() => {
        document.querySelector('.dk-theme-switch-button').setAttribute('aria-expanded', 'false');
        controller.abort();
    })()`);
    await expect(page.locator('.dk-theme-switch')).toBeHidden();
    expect(await count('[document]')).toBe(before);
});

/*
 * Each way the switch's choices close, given as script that closes them once they are open: the
 * button pressed again, Escape, a choice picked by a pointer, focus leaving the switch and a tap
 * outside it. Events are sent by script, since the button shows only in a narrow demo strip.
 */
const CLOSINGS = {
    'the button': `group.querySelector('.dk-theme-switch-button').click()`,
    Escape: `group.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`,
    'a pick': `(() => {
        const choice = group.querySelector('.dk-theme-switch-choice');
        choice.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        choice.click();
    })()`,
    'focus leaving': `group.dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body })
    )`,
    'a tap outside': `document.body.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))`,
};

test("takes the document's listener off however the switch's choices close", async ({ page }) => {
    const count = await opened(page);
    const before = await count('[document]');
    await page.evaluate(`(() => {
        window.group = document.querySelector('.dk-theme-switch');
        kit.switchWith(new AbortController().signal);
    })()`);
    const button = page.locator('.dk-theme-switch-button');
    for (const [way, closing] of Object.entries(CLOSINGS)) {
        await page.evaluate(`group.querySelector('.dk-theme-switch-button').click()`);
        await expect(button).toHaveAttribute('aria-expanded', 'true');
        expect(await count('[document]'), way).toBe(before + 1);
        await page.evaluate(closing);
        await expect(button, way).toHaveAttribute('aria-expanded', 'false');
        expect(await count('[document]'), way).toBe(before);
    }
});

test('does nothing after its teardown, from a press in flight or a choice made elsewhere', async ({
    page,
}) => {
    await opened(page);
    await page.evaluate(`(() => {
        window.controller = new AbortController();
        kit.switchWith(controller.signal);
        kit.copyWith(controller.signal);
        window.hold = true;
    })()`);
    const radios = page.locator('.dk-theme-switch input[type="radio"]');
    const checked = await radios.evaluateAll((all) =>
        all.map((radio) => (radio as HTMLInputElement).checked)
    );
    await page.locator('.dk-copy').click();
    // The clipboard answers in the abort's task, and the choice comes once the takedown has
    // landed, a microtask after the abort, as record 23 has it.
    await page.evaluate(`(() => {
        controller.abort();
        window.release();
    })()`);
    await page.evaluate(`kit.chooseTheme('dark')`);
    // Past the moment the status line says a message, where a press heard after the teardown would
    // show Copied and say it.
    await page.evaluate(() => new Promise((done) => setTimeout(done, 300)));
    expect(await wordOf(page)).toBe(0);
    await expect(page.locator('[role="status"]')).toHaveText('');
    // The switch taken down no longer follows the choice.
    expect(
        await radios.evaluateAll((all) => all.map((radio) => (radio as HTMLInputElement).checked))
    ).toEqual(checked);
});

test('leaves a newer attach alone when the old detach runs twice and its signal aborts', async ({
    page,
}) => {
    const count = await opened(page);
    await page.evaluate(`(() => {
        window.controller = new AbortController();
        const oldSwitch = kit.switchWith(controller.signal);
        const oldCopy = kit.copyWith(controller.signal);
        oldSwitch();
        oldCopy();
        kit.switchWith();
        kit.copyWith();
        oldSwitch();
        oldCopy();
        controller.abort();
    })()`);
    await expect(page.locator('.dk-theme-switch')).toBeVisible();
    await expect(page.locator('.dk-copy')).toBeVisible();
    const onButton = await count(`[document.querySelector('.dk-copy')]`);
    expect(onButton).toBe(1);
    await page.locator('.dk-copy').click();
    await expect.poll(() => wordOf(page)).toBe(1);
});

test('keeps the piece attached until every signal holding it has aborted', async ({ page }) => {
    await opened(page);
    await page.evaluate(`(() => {
        window.first = new AbortController();
        window.later = new AbortController();
        window.same = [
            kit.switchWith(first.signal) === kit.switchWith(later.signal),
            kit.copyWith(first.signal) === kit.copyWith(later.signal),
        ];
        first.abort();
    })()`);
    expect(await page.evaluate('window.same')).toEqual([true, true]);
    await expect(page.locator('.dk-theme-switch')).toBeVisible();
    await expect(page.locator('.dk-copy')).toBeVisible();
    await page.evaluate('later.abort()');
    await expect(page.locator('.dk-theme-switch')).toBeHidden();
    await expect(page.locator('.dk-copy')).toBeHidden();
});
