import { expect, type Page } from '@playwright/test';

/*
 * What a page has left running, counted the same way in Chromium, WebKit and Firefox, so a test
 * finds what an attach leaves behind once it is taken down: the listeners on elements, the
 * document, the window, signals and any other target, the ResizeObservers and MutationObservers
 * watching, and the timers and frames still to come. The counters wrap the page's own functions in
 * a script loaded before any of the page's, so every one the kit makes is seen.
 *
 * A listener is followed as the DOM keeps it: one added again with the same type, callback and
 * capture is ignored, signal and all, one given a signal already aborted is never added, and one
 * comes off as its signal aborts, as `removeEventListener` takes it off, or after it runs where it
 * was added `once`. What the wrappers cannot see is a handler set as a property, such as
 * `onclick`, which no piece of the kit sets, and anything added before the script runs, which is
 * nothing of the page's, only a few markers of Playwright's own, which every count leaves out by
 * their names. In Chromium, `expectEngineAgrees` holds the count to the engine's own.
 */

/** What the page has left running, as the counters see it. */
export type Counts = {
    readonly elementListeners: number;
    readonly documentListeners: number;
    readonly windowListeners: number;
    readonly signalListeners: number;
    readonly otherListeners: number;
    /**
     * Listeners whose callback is a bound function, as every one React adds is and none of the
     * kit's is, wherever they sit, so a page drawn by React can set them apart.
     */
    readonly reactListeners: number;
    readonly resizeObservers: number;
    readonly mutationObservers: number;
    readonly timers: number;
    readonly frames: number;
};

/*
 * The counters, as a script the page runs before its own. They live under `window.leaks`, which
 * the page itself never touches. A listener is kept by its target, then by its type and capture,
 * then by its callback, so the same listener added twice is found and ignored. Each one kept has a
 * token of its own, so a signal that aborts after the listener was taken off and added again with
 * another signal leaves the newer one counted. The page's own functions are kept aside before they
 * are wrapped, so what the counters add to follow a signal or a `once` is never counted.
 */
const SCRIPT = `(() => {
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
        if (slot.has(callback)) return add.call(this, type, callback, options);
        const token = {};
        const drop = () => {
            if (slot.get(callback) === token) slot.delete(callback);
        };
        // What follows a listener added once goes ahead of it, so it still runs where that
        // listener stops the event, as a dialog's teardown does with the close it causes.
        if (given.once)
            add.call(this, type, drop, {
                capture: captureOf(options),
                once: true,
                signal: given.signal,
            });
        add.call(this, type, callback, options);
        slot.set(callback, token);
        if (given.signal) add.call(given.signal, 'abort', drop, { once: true });
    };
    EventTarget.prototype.removeEventListener = function (type, callback, options) {
        remove.call(this, type, callback, options);
        kept.get(this)?.get(String(captureOf(options)) + ' ' + type)?.delete(callback);
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
    window.leaks = {
        counts: () => {
            const found = {
                elementListeners: 0,
                documentListeners: 0,
                windowListeners: 0,
                signalListeners: 0,
                otherListeners: 0,
                reactListeners: 0,
            };
            for (const [target, byKey] of kept)
                for (const byCallback of byKey.values())
                    for (const callback of byCallback.keys())
                        found[bound(callback) ? 'reactListeners' : kindOf(target)] += 1;
            return {
                ...found,
                resizeObservers: watching.ResizeObserver.size,
                mutationObservers: watching.MutationObserver.size,
                timers: timers.size,
                frames: frames.size,
            };
        },
        on: (targets) => {
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
 * Loads the counters into every page the test opens from now on. A stand-in clock is installed
 * first, so the counters wrap its timers and frames rather than the browser's.
 */
export const countLeaks = async (page: Page): Promise<void> => {
    await page.addInitScript(SCRIPT);
};

/** What the page has left running now. */
export const leaksOf = (page: Page): Promise<Counts> => page.evaluate('window.leaks.counts()');

/**
 * How many listeners sit on the targets an expression in the page gives, a list of them, as the
 * counters see them, bound callbacks among them.
 */
export const listenersOn = (page: Page, targets: string): Promise<number> =>
    page.evaluate(`window.leaks.on(${targets})`);

/** The window, the document and every element in it. */
const EVERYWHERE = '[window, document, ...document.querySelectorAll("*")]';

/**
 * In Chromium, finds the counters agree with the engine's own tools on every listener on the
 * window, the document and each element in it, so a listener a signal took off, or one the
 * counters could not see, would show as a difference. A handler set as a property is added to the
 * counters' side, read from the property itself, since the engine lists it too. What the counters
 * add to follow a listener added `once` is the engine's to see as well, so they agree once that
 * listener has run, as they do whenever nothing is waiting to be heard. Another engine has no such
 * tools, and the same counters run there unchecked.
 */
export const expectEngineAgrees = async (page: Page, browserName: string): Promise<void> => {
    if (browserName !== 'chromium') return;
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
