import { expect, type Page } from '@playwright/test';

import { servePage, stillClock } from './page.js';

/*
 * What a page has left running, counted the same way in Chromium, WebKit and Firefox, so a test
 * finds what an attach leaves behind once it is taken down: the listeners on elements, the
 * document, the window, signals and any other target, the ResizeObservers and MutationObservers
 * watching, and the timers and frames still to come. The counters wrap the page's own functions in
 * a script loaded before any of the page's, so every one the kit makes is seen.
 *
 * A listener is followed as the DOM keeps it: one added again with the same type, callback and
 * capture is ignored, signal and all, one given a signal already aborted is never added, and one
 * comes off as its signal aborts, as `removeEventListener` takes it off, or as it runs where it was
 * added `once`. What the wrappers cannot see is a handler set as a property, such as `onclick`,
 * which no piece of the kit sets and `listenersOn` reads from the property itself, and anything
 * added before the script runs, which is nothing of the page's, only a few markers of Playwright's
 * own, which every count leaves out by their names. In Chromium, `expectEngineAgrees` holds the
 * count of the listeners on the window, the document and its elements to the engine's own, and so
 * does every `listenersOn`.
 */

/** What the page has left running, as the counters see it. */
export type Counts = {
    readonly elementListeners: number;
    readonly documentListeners: number;
    readonly windowListeners: number;
    readonly signalListeners: number;
    readonly otherListeners: number;
    /**
     * Listeners on elements whose callback is a bound function, as every one React adds to the
     * elements it draws is and none of the kit's is, so a page drawn by React can set them apart.
     * A bound listener on the window, the document or a signal is counted with the rest there.
     */
    readonly boundElementListeners: number;
    readonly resizeObservers: number;
    readonly mutationObservers: number;
    readonly timers: number;
    readonly frames: number;
};

/*
 * The counters, as a script the page runs before its own. They live under `window.leaks`, which
 * the page itself never touches. A listener is kept by its target, then by its type and capture,
 * then by its callback, so the same listener added twice is found and ignored. Each one kept has an
 * entry of its own, so a signal that aborts after the listener was taken off and added again with
 * another signal leaves the newer one counted. The page's own functions are kept aside before they
 * are wrapped, so what the counters add to follow a signal is never counted. Whether the timers
 * wrapped are a stand-in clock's is noted, and a count fails where the page was meant to have one
 * and does not, or where something replaced the timers after the counters wrapped them, as a clock
 * installed after them does in Chromium.
 */
const script = (clock: boolean | undefined): string => `(() => {
    const wantsClock = ${JSON.stringify(clock ?? null)};
    // Playwright's stand-in clock keeps itself on the window as it is installed.
    const clocked = '__pwClock' in window;
    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    const kept = new Map();
    const captureOf = (options) =>
        typeof options === 'boolean' ? options : Boolean(options && options.capture);
    const slotOf = (target, type, options) => {
        let byKey = kept.get(target);
        if (!byKey) kept.set(target, (byKey = new Map()));
        const key = String(captureOf(options)) + ' ' + type;
        let byCallback = byKey.get(key);
        if (!byCallback) byKey.set(key, (byCallback = new Map()));
        return byCallback;
    };
    EventTarget.prototype.addEventListener = function (type, callback, options) {
        const given = typeof options === 'object' && options !== null ? options : {};
        // Playwright's own markers are left out, since it adds a few before the counters load.
        if (
            callback === null ||
            callback === undefined ||
            String(type).startsWith('__playwright') ||
            (given.signal && given.signal.aborted)
        )
            return add.call(this, type, callback, options);
        const slot = slotOf(this, String(type), options);
        // The DOM ignores it, and a listener kept as a stand-in for one added once is not the
        // callback, so the engine would add the callback beside it.
        if (slot.has(callback)) return;
        // A listener added once is added as a stand-in that takes itself off the count as it
        // runs, in its place, so it runs where the callback would and the engine holds one
        // listener, as it would for the callback.
        const entry = { native: callback };
        if (given.once)
            entry.native = function (event) {
                if (slot.get(callback) === entry) slot.delete(callback);
                return typeof callback === 'function'
                    ? callback.call(this, event)
                    : callback.handleEvent(event);
            };
        add.call(this, type, entry.native, options);
        slot.set(callback, entry);
        if (given.signal)
            add.call(
                given.signal,
                'abort',
                () => {
                    if (slot.get(callback) === entry) slot.delete(callback);
                },
                { once: true }
            );
    };
    EventTarget.prototype.removeEventListener = function (type, callback, options) {
        const slot = kept.get(this)?.get(String(captureOf(options)) + ' ' + type);
        const entry = slot?.get(callback);
        remove.call(this, type, entry ? entry.native : callback, options);
        slot?.delete(callback);
    };

    const watching = { ResizeObserver: new Set(), MutationObserver: new Set() };
    const counted = (name) => {
        const Real = window[name];
        if (typeof Real !== 'function') return;
        const live = watching[name];
        window[name] = class extends Real {
            targets = new Set();
            observe(target, ...rest) {
                super.observe(target, ...rest);
                this.targets.add(target);
                live.add(this);
            }
            unobserve(target) {
                super.unobserve(target);
                this.targets.delete(target);
                if (this.targets.size === 0) live.delete(this);
            }
            disconnect() {
                super.disconnect();
                this.targets.clear();
                live.delete(this);
            }
        };
    };
    counted('ResizeObserver');
    counted('MutationObserver');

    // Timeouts and intervals share their ids, and either clear takes either off.
    const timers = new Set();
    const setTimer = window.setTimeout;
    const setRepeat = window.setInterval;
    const clearTimer = window.clearTimeout;
    window.setTimeout = function (run, ...rest) {
        if (typeof run !== 'function') return setTimer(run, ...rest);
        const id = setTimer(function (...given) {
            timers.delete(id);
            return run.apply(this, given);
        }, ...rest);
        timers.add(id);
        return id;
    };
    window.setInterval = function (...given) {
        const id = setRepeat(...given);
        timers.add(id);
        return id;
    };
    window.clearTimeout = window.clearInterval = function (id) {
        timers.delete(id);
        clearTimer(id);
    };
    const frames = new Set();
    const askFrame = window.requestAnimationFrame;
    const cancelFrame = window.cancelAnimationFrame;
    window.requestAnimationFrame = function (run) {
        const id = askFrame(function (time) {
            frames.delete(id);
            return run(time);
        });
        frames.add(id);
        return id;
    };
    window.cancelAnimationFrame = function (id) {
        frames.delete(id);
        cancelFrame(id);
    };

    // A bound function has no prototype and a name that starts with its own word for it.
    const bound = (callback) =>
        typeof callback === 'function' &&
        !('prototype' in callback) &&
        callback.name.startsWith('bound ');
    const kindOf = (target) =>
        target === window
            ? 'windowListeners'
            : target instanceof Document
              ? 'documentListeners'
              : target instanceof Element
                ? 'elementListeners'
                : target instanceof AbortSignal
                  ? 'signalListeners'
                  : 'otherListeners';
    const ours = [
        window.setTimeout,
        window.clearTimeout,
        window.requestAnimationFrame,
        window.cancelAnimationFrame,
    ];
    const check = () => {
        const now = [
            window.setTimeout,
            window.clearTimeout,
            window.requestAnimationFrame,
            window.cancelAnimationFrame,
        ];
        if (now.some((run, at) => run !== ours[at]))
            throw new Error('the timers were replaced after the counters wrapped them');
        if (wantsClock === true && !clocked)
            throw new Error('expected a stand-in clock installed before the counters');
        if (wantsClock === false && clocked)
            throw new Error('expected the timers of the browser, not a stand-in clock');
    };
    window.leaks = {
        counts: () => {
            check();
            const found = {
                elementListeners: 0,
                documentListeners: 0,
                windowListeners: 0,
                signalListeners: 0,
                otherListeners: 0,
                boundElementListeners: 0,
            };
            for (const [target, byKey] of kept)
                for (const byCallback of byKey.values())
                    for (const callback of byCallback.keys())
                        found[
                            bound(callback) && target instanceof Element
                                ? 'boundElementListeners'
                                : kindOf(target)
                        ] += 1;
            return {
                ...found,
                resizeObservers: watching.ResizeObserver.size,
                mutationObservers: watching.MutationObserver.size,
                timers: timers.size,
                frames: frames.size,
            };
        },
        on: (targets) => {
            check();
            let total = 0;
            for (const target of targets)
                for (const byCallback of kept.get(target)?.values() ?? []) total += byCallback.size;
            return total;
        },
        // Handlers set as properties, which the engine's tools list beside the listeners, such
        // as the one React sets on its root so a tap there counts as a click in Safari.
        handlers: (targets) => {
            let total = 0;
            for (const target of targets)
                for (const name in target)
                    if (name.startsWith('on') && typeof target[name] === 'function') total += 1;
            return total;
        },
    };
})();`;

/**
 * Loads the counters into every page the test opens from now on. A test on a stand-in clock
 * installs the clock first, so the counters wrap its timers and frames rather than the browser's,
 * and says so with `clock`, so a count fails where the clock is missing. A clock installed after
 * the counters fails every count, whatever `clock` says.
 */
export const countLeaks = async (
    page: Page,
    { clock }: { readonly clock?: boolean } = {}
): Promise<void> => {
    await page.addInitScript(script(clock));
};

/**
 * Opens a page as `servePage` serves it with the counters in it, and waits for its script to set
 * `window.ready`, unless `ready` is false, as for a page React draws, which a test waits on by what
 * it draws. Given `clock`, the page is put on a still clock first, and either way the counters are
 * told, so a count fails on a page whose clock is not the one the test meant.
 */
export const openCounted = async (
    page: Page,
    {
        clock,
        ready = true,
        ...served
    }: { readonly clock: boolean; readonly ready?: boolean } & Parameters<typeof servePage>[1]
): Promise<void> => {
    if (clock) await stillClock(page.clock);
    await countLeaks(page, { clock });
    await servePage(page, served);
    if (ready) await page.waitForFunction(() => 'ready' in window);
};

/** What the page has left running now. */
export const leaksOf = (page: Page): Promise<Counts> => page.evaluate('window.leaks.counts()');

/** Whether the page runs in Chromium, whose own tools can count its listeners. */
const inChromium = (page: Page): boolean =>
    page.context().browser()?.browserType().name() === 'chromium';

/**
 * How many listeners the counters see on the targets in the list an expression in the page gives,
 * bound callbacks among them, and handlers set as properties, as the engine's tools count them. In
 * Chromium, every count also finds the counters agree with the engine's own.
 */
export const listenersOn = async (page: Page, targets: string): Promise<number> => {
    const seen = Number(
        await page.evaluate(`window.leaks.on(${targets}) + window.leaks.handlers(${targets})`)
    );
    await expectEngineAgrees(page);
    return seen;
};

/** The window, the document and every element in it. */
const EVERYWHERE = '[window, document, ...document.querySelectorAll("*")]';

/**
 * In Chromium, finds the counters agree with the engine's own tools on every listener on the
 * window, the document and each element in it, so a listener a signal took off, or one the
 * counters could not see, would show as a difference. A handler set as a property is added to the
 * counters' side, read from the property itself, since the engine lists it too. Another engine has
 * no such tools, and the same counters run there unchecked.
 */
export const expectEngineAgrees = async (page: Page): Promise<void> => {
    if (!inChromium(page)) return;
    const session = await page.context().newCDPSession(page);
    try {
        let engine = 0;
        for (const expression of ['window', 'document']) {
            const { result } = await session.send('Runtime.evaluate', { expression });
            const { listeners } = await session.send('DOMDebugger.getEventListeners', {
                objectId: result.objectId ?? '',
                // The document's descendants too, so each element is counted in one call.
                ...(expression === 'document' ? { depth: -1 } : {}),
            });
            engine += listeners.filter(({ type }) => !type.startsWith('__playwright')).length;
        }
        const seen = await page.evaluate(
            `window.leaks.on(${EVERYWHERE}) + window.leaks.handlers(${EVERYWHERE})`
        );
        expect(seen, "the engine's own count of listeners").toBe(engine);
    } finally {
        await session.detach();
    }
};
