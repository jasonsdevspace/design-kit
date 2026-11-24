import { expect, type Page, test } from '@playwright/test';

import { bundle } from './bundle.js';
import { countLeaks, type Counts, expectEngineAgrees, leaksOf, openCounted } from './leaks.js';
import { type Leaks } from './leaks-page.js';
import { servePage, stillClock } from './page.js';
import { BODY, DRAW_FRAME, KEPT, type Piece, PIECES, script } from './teardown-pieces.js';

/*
 * Record 22's promise that a piece taken down leaves nothing running, held for every attach and
 * `moveFocus` by counting what the page has running, through the counters in leaks.ts, in
 * Chromium, WebKit and Firefox: each piece in the table teardown-pieces.tsx shares with
 * teardown.spec.tsx, used and taken down, brings every count back to where it started, joined twice
 * grows none, and one given a signal already aborted, used and called after, starts
 * nothing. This spec makes every count of what a piece leaves running after an attach, and the
 * teardown spec counts only what this one does not.
 * The theme's listeners on the window stay for the page's life, as the record has it, so the table
 * attaches a switch and takes it down once before every count starts. The clock is a stand-in that
 * moves only by the test's steps, so a timer still to come at the abort is one the abort has to
 * clear.
 */

/*
 * What the leak tests call on a piece: attached and used with a fresh controller, aborted, joined
 * by an abort and a fresh attach in one task, as a ref made afresh does, and called after, its
 * detach first where what the attach returned is one.
 */
const LEAKS = `window.handles = {};
window.controllers = {};
window.attach = (name) => {
    const controller = new AbortController();
    window.controllers[name] = controller;
    window.handles[name] = pieces[name].attach(controller.signal);
    pieces[name].use(window.handles[name]);
};
window.abort = (name) => controllers[name].abort();
window.join = (name) => {
    const old = controllers[name];
    window.controllers[name] = new AbortController();
    old.abort();
    window.handles[name] = pieces[name].attach(controllers[name].signal);
};
window.after = (name) => {
    pieces[name].detach?.(handles[name]);
    pieces[name].after(handles[name]);
};`;

/**
 * How many times each piece is attached and taken down in a row: the first proves the teardown,
 * and the second proves an attach made again starts all the first did and is taken down in turn,
 * on the element already taken down for a piece and on elements drawn afresh for the hooks. A
 * round after those repeats what the second proves.
 */
const ROUNDS = 2;

/** The rounds, said as a test's name says them. */
const OVER = 'twice over';

/** The page with its controls loaded, the counters in it and its clock still. */
const opened = (page: Page): Promise<void> =>
    openCounted(page, { clock: true, title: 'Leaks', body: BODY, script: script(LEAKS) });

/** Calls one of the leak functions on the piece named, in a task of its own. */
const call = (page: Page, what: 'attach' | 'abort' | 'join' | 'after', name: string) =>
    page.evaluate(
        ([fn, piece]) => {
            const run = (window as unknown as Record<string, (name: string) => void>)[fn];
            if (!run) throw new Error(`the page has no ${fn}`);
            run(piece);
        },
        [what, name] as const
    );

/**
 * What a count shows of what is attached, every count but the timers and frames, which come and go
 * as a piece waits, so every round of attaching makes the same.
 */
const attachedIn = (counts: Counts): Counts => ({ ...counts, timers: 0, frames: 0 });

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
        read = leaksOf,
    }: { readonly what: string; readonly read?: (page: Page) => Promise<Counts> }
) => {
    await expect.poll(() => read(page), { message: what, timeout: 2000 }).toEqual(before);
    await expectEngineAgrees(page);
};

for (const name of PIECES) {
    test(`leaves nothing running once ${name} is taken down, ${OVER}`, async ({ page }) => {
        await opened(page);
        const before = await leaksOf(page);
        await expectEngineAgrees(page);
        let first: Counts | undefined;
        for (let round = 1; round <= ROUNDS; round += 1) {
            const what = `${name}, round ${String(round)}`;
            await call(page, 'attach', name);
            // Something is running once it is attached and used, so the count that comes back is
            // one the teardown brought back, and each later round attaches all the first did, so
            // an attach again that started less, beside a line attached with it, fails here.
            const attached = await leaksOf(page);
            expect(attached, what).not.toEqual(before);
            first ??= attachedIn(attached);
            expect(attachedIn(attached), what).toEqual(first);
            await expectEngineAgrees(page);
            // Far enough for its words to be put on the line and its frames to come, and short of
            // the timers that end them.
            await page.clock.runFor(150);
            await call(page, 'abort', name);
            await expectBack(page, before, { what });
            // Calls after the teardown start nothing, and nothing comes due later.
            await call(page, 'after', name);
            await page.clock.runFor(10_000);
            await expectBack(page, before, { what: `${what}, after its teardown` });
        }
    });
}

test('adds no listener to the document as a stepper is attached', async ({ page }) => {
    await opened(page);
    const before = await leaksOf(page);
    await call(page, 'attach', 'the stepper');
    const attached = await leaksOf(page);
    expect(attached).not.toEqual(before);
    expect(attached.documentListeners).toBe(before.documentListeners);
});

test('listens to the document for F8 only while a toast with an action is shown', async ({
    page,
}) => {
    await opened(page);
    await page.evaluate(`window.show = kit.attachToast($('.dk-toast'))`);
    const attached = await leaksOf(page);
    const listening = () => leaksOf(page).then((counts) => counts.documentListeners);
    await page.evaluate(`window.dismiss = show('Round 2 saved.')`);
    expect(await listening()).toBe(attached.documentListeners);
    await page.evaluate(`show('Round 3 saved.', { label: 'Undo', onAction: () => undefined })`);
    expect(await listening()).toBe(attached.documentListeners + 1);
    // Another message with an action adds no second listener, and one without takes it off.
    await page.evaluate(`show('Round 4 saved.', { label: 'Undo', onAction: () => undefined })`);
    expect(await listening()).toBe(attached.documentListeners + 1);
    await page.evaluate(`show('Round 5 saved.')`);
    expect(await listening()).toBe(attached.documentListeners);
    // Dismissed by its close button, the toast hears F8 no more.
    await page.evaluate(`show('Round 6 saved.', { label: 'Undo', onAction: () => undefined })`);
    await page.locator('.dk-toast-close').click();
    expect(await listening()).toBe(attached.documentListeners);
    await expectEngineAgrees(page);
});

test('leaves nothing in the page or its frame once a toast the page attached in the frame is taken down', async ({
    page,
}) => {
    await opened(page);
    await page.evaluate(DRAW_FRAME);
    const inFrame = (): Promise<Counts> => page.evaluate('frame.contentWindow.leaks.counts()');
    const before = await leaksOf(page);
    const frameBefore = await inFrame();
    await page.evaluate(`(() => {
        window.framed = new AbortController();
        window.showIn = kit.attachToast(frameToast, { signal: framed.signal });
        showIn('Round 2 saved.');
    })()`);
    // The toast listens in the frame's document and adds nothing to the page's, and a message with
    // an action adds the frame's listener for F8.
    const attached = await inFrame();
    expect(attached.documentListeners).toBeGreaterThan(frameBefore.documentListeners);
    await page.evaluate(`showIn('Round 3 saved.', { label: 'Undo', onAction: () => undefined })`);
    await page.clock.runFor(150);
    expect((await inFrame()).documentListeners).toBe(attached.documentListeners + 1);
    // It listens to the frame's window for its size, and to nothing more of the page's.
    expect(attached.windowListeners).toBe(frameBefore.windowListeners + 1);
    expect((await leaksOf(page)).documentListeners).toBe(before.documentListeners);
    expect((await leaksOf(page)).windowListeners).toBe(before.windowListeners);
    await page.evaluate('framed.abort()');
    await expectBack(page, frameBefore, { what: 'the frame', read: inFrame });
    await expectBack(page, before, { what: 'the page' });
    await page.clock.runFor(10_000);
    await expectBack(page, frameBefore, { what: 'the frame, later', read: inFrame });
    await expectBack(page, before, { what: 'the page, later' });
});

for (const name of KEPT) {
    test(`keeps ${name} joined ${OVER} without growing, and leaves nothing once taken down`, async ({
        page,
    }) => {
        await opened(page);
        const before = await leaksOf(page);
        await call(page, 'attach', name);
        await page.clock.runFor(150);
        const held = await leaksOf(page);
        expect(held, `${name}, attached`).not.toEqual(before);
        for (let round = 1; round <= ROUNDS; round += 1) {
            const what = `${name}, joined ${String(round)} times`;
            await call(page, 'join', name);
            expect(await leaksOf(page), what).toEqual(held);
            await expectEngineAgrees(page);
        }
        await call(page, 'abort', name);
        await expectBack(page, before, { what: `${name}, taken down after its joins` });
        await page.clock.runFor(10_000);
        await expectBack(page, before, { what: `${name}, later` });
    });
}

test('starts nothing for any piece given a signal already aborted, used and called after', async ({
    page,
}) => {
    await opened(page);
    const before = await leaksOf(page);
    await page.evaluate((names) => {
        const { pieces } = window as unknown as { pieces: Record<string, Piece> };
        const aborted = AbortSignal.abort();
        for (const name of names) {
            const piece = pieces[name];
            if (!piece) throw new Error(`no piece named ${name}`);
            const handle = piece.attach(aborted);
            piece.use(handle);
            piece.detach?.(handle);
            piece.after(handle);
        }
    }, PIECES);
    expect(await leaksOf(page)).toEqual(before);
    await page.clock.runFor(10_000);
    await expectBack(page, before, {
        what: 'every piece given a signal already aborted',
    });
});

test('counts a listener added once as the engine does, whether it runs or is taken off first', async ({
    page,
}) => {
    await opened(page);
    const before = await leaksOf(page);
    // Taken off before it runs, added again, and then run by a press that one before it stops.
    await page.evaluate(() => {
        const button = document.querySelector('#start');
        if (!button) throw new Error('no button');
        const listener = () => undefined;
        button.addEventListener('click', listener, { once: true });
        button.removeEventListener('click', listener);
        button.addEventListener('click', listener, { once: true });
    });
    expect((await leaksOf(page)).elementListeners).toBe(before.elementListeners + 1);
    await expectEngineAgrees(page);
    await page.evaluate(() => {
        const button = document.querySelector('#start');
        if (!button) throw new Error('no button');
        const stop = (event: Event) => {
            event.stopImmediatePropagation();
        };
        button.addEventListener('click', stop, { once: true });
        button.dispatchEvent(new Event('click'));
        (button as HTMLButtonElement).click();
    });
    await expectBack(page, before, { what: 'a listener added once' });
});

test('counts a bound listener on the window with the window, and one on an element apart', async ({
    page,
}) => {
    await opened(page);
    const before = await leaksOf(page);
    await page.evaluate(() => {
        const listener = () => undefined;
        window.addEventListener('resize', listener.bind(null));
        document.querySelector('#start')?.addEventListener('click', listener.bind(null));
    });
    expect(await leaksOf(page)).toEqual({
        ...before,
        windowListeners: before.windowListeners + 1,
        boundElementListeners: before.boundElementListeners + 1,
    });
    await expectEngineAgrees(page);
});

test('refuses to count where the stand-in clock is missing or came after the counters', async ({
    page,
    browserName,
}) => {
    await countLeaks(page, { clock: true });
    await servePage(page, { title: 'Leaks', body: BODY, script: script(LEAKS) });
    await expect(leaksOf(page)).rejects.toThrow('expected a stand-in clock installed before');
    await stillClock(page.clock);
    await page.reload();
    // Chromium runs a clock installed later after the counters, which then find their timers
    // replaced. WebKit and Firefox run it ahead of every other script, so the counters wrap it.
    if (browserName === 'chromium') {
        await expect(leaksOf(page)).rejects.toThrow('the timers were replaced after the counters');
        return;
    }
    await page.evaluate(() => {
        window.setTimeout(() => undefined, 1000);
    });
    expect((await leaksOf(page)).timers).toBe(1);
    await page.clock.runFor(1000);
    expect((await leaksOf(page)).timers).toBe(0);
});

test.describe('the hooks', () => {
    /*
     * React keeps a listener of its own on each field it draws, which it never takes off, so one
     * stays on a field after the field is taken away. Those are set apart, as the listeners on
     * elements with a bound callback, and every other count, bound listeners on the window, the
     * document and signals among them, is held to where it started once React's root is in the
     * page with nothing of the kit's drawn.
     */
    const withoutReact = async (page: Page): Promise<Counts> => ({
        ...(await leaksOf(page)),
        boundElementListeners: 0,
    });

    const apps = { production: '', strict: '' };
    test.beforeAll(async () => {
        test.setTimeout(120_000);
        apps.production = await bundle('leaks-page.tsx');
        apps.strict = await bundle('leaks-page.tsx', { development: true });
    });

    for (const mode of ['production', 'strict'] as const) {
        test(`leave nothing running once a page that uses each is taken away, ${mode === 'strict' ? 'under StrictMode' : 'in production'}, ${OVER}`, async ({
            page,
        }) => {
            await openCounted(page, {
                clock: true,
                ready: false,
                title: 'Lists',
                body: '<div id="root"></div>',
                script: apps[mode],
                head: mode === 'strict' ? '<script>window.strict = true</script>' : '',
            });
            await expect(page.locator('h1')).toHaveText('Lists');
            const before = await withoutReact(page);
            await expectEngineAgrees(page);
            let first: Counts | undefined;
            for (let round = 1; round <= ROUNDS; round += 1) {
                const what = `the hooks, round ${String(round)}`;
                await page.evaluate(() => {
                    (window as unknown as Leaks).show();
                });
                await page.evaluate(() => {
                    (window as unknown as Leaks).use();
                });
                // Something is running, and as much as in the first round, so a hook that attached
                // less to the elements drawn afresh fails here.
                const attached = await withoutReact(page);
                expect(attached, what).not.toEqual(before);
                first ??= attachedIn(attached);
                expect(attachedIn(attached), what).toEqual(first);
                await expectEngineAgrees(page);
                await page.clock.runFor(150);
                await page.evaluate(() => {
                    (window as unknown as Leaks).leave();
                });
                await expectBack(page, before, { what, read: withoutReact });
                await page.clock.runFor(10_000);
                await expectBack(page, before, {
                    what: `${what}, later`,
                    read: withoutReact,
                });
            }
        });
    }
});
