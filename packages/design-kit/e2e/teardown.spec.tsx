import { type CDPSession, expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { copyButton, themeSwitch } from '../examples/examples.js';
import { servePage } from './page.js';

/*
 * The teardown contract of record 22 on the theme switch and the copy button: a signal already
 * aborted attaches nothing, aborting takes away everything the attach set up, as its detach does,
 * a detach called twice, or after the abort, leaves a newer attach alone, the first attach owns the
 * piece so a later call's signal is not heard, and nothing the piece did before its teardown acts
 * after it. Listeners are counted through Chromium's own tools, so the specs run there.
 */

const BODY = renderToStaticMarkup(
    <main>
        {themeSwitch}
        <pre id="code">npm install @jasonsdevspace/design-kit</pre>
        {copyButton}
    </main>
);

/*
 * The clipboard is the page's own, so a press copies at once, or waits for the test's `release`
 * while `hold` is set, as a clipboard slow to answer would.
 */
const SCRIPT = `import { attachCopyButton, attachThemeSwitch, chooseTheme } from './controls.js';
let answer = () => undefined;
window.hold = false;
Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
        writeText: () =>
            new Promise((done) => {
                if (window.hold) answer = done;
                else done();
            }),
    },
});
window.release = () => answer();
const group = document.querySelector('.dk-theme-switch');
const button = document.querySelector('.dk-copy');
const copying = {
    source: () => document.querySelector('#code'),
    status: document.querySelector('[role="status"]'),
};
window.kit = {
    switchWith: (signal) => attachThemeSwitch(group, signal ? { signal } : undefined),
    copyWith: (signal) => attachCopyButton(button, signal ? { ...copying, signal } : copying),
    chooseTheme,
};
window.ready = true;`;

/** The page with its controls loaded and nothing attached yet. */
const opened = async (page: Page): Promise<CDPSession> => {
    await servePage(page, { title: 'Teardown', body: BODY, script: SCRIPT });
    await page.waitForFunction(() => 'ready' in window);
    return page.context().newCDPSession(page);
};

/** How many listeners sit on every element the selector finds, as Chromium's tools count them. */
const listenersOn = async (page: Page, session: CDPSession, selector: string): Promise<number> => {
    const found = await page.locator(selector).count();
    let total = 0;
    for (let at = 0; at < found; at += 1) {
        const { result } = await session.send('Runtime.evaluate', {
            expression: `document.querySelectorAll(${JSON.stringify(selector)})[${String(at)}]`,
        });
        const { listeners } = await session.send('DOMDebugger.getEventListeners', {
            objectId: result.objectId ?? '',
        });
        total += listeners.length;
    }
    return total;
};

/** Every listener the switch and the copy button put on their own elements. */
const PARTS = '.dk-theme-switch, .dk-theme-switch *, .dk-copy';

/** Which of the copy button's words shows: 0 for Copy, 1 for Copied, 2 for Selected. */
const wordOf = (page: Page): Promise<number> =>
    page
        .locator('.dk-copy')
        .evaluate((button) =>
            [...button.querySelectorAll('.dk-copy-words > *')].findIndex(
                (word) => !word.hasAttribute('aria-hidden')
            )
        );

test.beforeEach(({ browserName }) => {
    test.skip(browserName !== 'chromium', "Listeners are counted through Chromium's own tools.");
});

test('attaches nothing when given a signal already aborted', async ({ page }) => {
    const session = await opened(page);
    const before = await listenersOn(page, session, PARTS);
    await page.evaluate(`(() => {
        const aborted = AbortSignal.abort();
        window.detachSwitch = kit.switchWith(aborted);
        window.detachCopy = kit.copyWith(aborted);
    })()`);
    await expect(page.locator('.dk-theme-switch')).toBeHidden();
    await expect(page.locator('.dk-copy')).toBeHidden();
    expect(await listenersOn(page, session, PARTS)).toBe(before);
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

test('takes everything down when the signal aborts, as the detach does', async ({ page }) => {
    const session = await opened(page);
    const before = await listenersOn(page, session, PARTS);
    await page.evaluate(`(() => {
        window.controller = new AbortController();
        kit.switchWith(controller.signal);
        kit.copyWith(controller.signal);
    })()`);
    await expect(page.locator('.dk-theme-switch')).toBeVisible();
    expect(await listenersOn(page, session, PARTS)).toBeGreaterThan(before);
    await page.locator('.dk-copy').click();
    await expect.poll(() => wordOf(page)).toBe(1);
    await page.evaluate('controller.abort()');
    await expect(page.locator('.dk-theme-switch')).toBeHidden();
    await expect(page.locator('.dk-copy')).toBeHidden();
    // The word shown goes back to Copy with its timer, and every listener comes off.
    expect(await wordOf(page)).toBe(0);
    expect(await listenersOn(page, session, PARTS)).toBe(before);
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
    await page.evaluate(`(() => {
        controller.abort();
        window.release();
        kit.chooseTheme('dark');
    })()`);
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
    const session = await opened(page);
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
    expect(await listenersOn(page, session, '.dk-copy')).toBe(1);
    await page.locator('.dk-copy').click();
    await expect.poll(() => wordOf(page)).toBe(1);
});

test("hears only the first attach's signal while the piece stays attached", async ({ page }) => {
    await opened(page);
    await page.evaluate(`(() => {
        window.first = new AbortController();
        window.later = new AbortController();
        window.same = [
            kit.switchWith(first.signal) === kit.switchWith(later.signal),
            kit.copyWith(first.signal) === kit.copyWith(later.signal),
        ];
        later.abort();
    })()`);
    expect(await page.evaluate('window.same')).toEqual([true, true]);
    await expect(page.locator('.dk-theme-switch')).toBeVisible();
    await expect(page.locator('.dk-copy')).toBeVisible();
    await page.evaluate('first.abort()');
    await expect(page.locator('.dk-theme-switch')).toBeHidden();
    await expect(page.locator('.dk-copy')).toBeHidden();
});
