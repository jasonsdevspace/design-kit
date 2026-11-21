import { getEventListeners } from 'node:events';

import { describe, expect, it, vi } from 'vitest';

import { join, keep, type Kept, teardown } from './teardown.js';

/*
 * The teardown every attach keeps record 22's contract through, in plain Node, which has the
 * `AbortController` it rests on. The browser tests hold each attach that uses it to the contract.
 */

describe('a teardown', () => {
    it('gives a teardown already stopped for a signal already aborted, whose add runs at once', () => {
        const down = teardown(AbortSignal.abort());
        expect(down.signal.aborted).toBe(true);
        let ran = 0;
        down.add(() => (ran += 1));
        expect(ran).toBe(1);
        down.stop();
        expect(ran).toBe(1);
    });

    it('runs what it keeps once, in the order kept, and aborts its own signal', () => {
        const down = teardown();
        const ran: string[] = [];
        down.add(() => ran.push('observer'));
        down.add(() => ran.push('timer'));
        let heard = 0;
        down.signal.addEventListener('abort', () => (heard += 1));
        down.stop();
        down.stop();
        expect(ran).toEqual(['observer', 'timer']);
        expect(heard).toBe(1);
        expect(down.signal.aborted).toBe(true);
    });

    it("runs a microtask after the page's signal aborts, and not again on the detach", async () => {
        const page = new AbortController();
        const down = teardown(page.signal);
        let ran = 0;
        down.add(() => (ran += 1));
        page.abort();
        expect(ran).toBe(0);
        expect(down.signal.aborted).toBe(false);
        await Promise.resolve();
        expect(ran).toBe(1);
        down.stop();
        expect(ran).toBe(1);
        expect(down.signal.aborted).toBe(true);
    });

    it("takes its listener off the page's signal once it has run", async () => {
        const page = new AbortController();
        const down = teardown(page.signal);
        expect(getEventListeners(page.signal, 'abort')).toHaveLength(1);
        down.stop();
        expect(getEventListeners(page.signal, 'abort')).toHaveLength(0);
        let ran = 0;
        down.add(() => (ran += 1));
        page.abort();
        await Promise.resolve();
        expect(ran).toBe(1);
        // A signal that aborts lets go of the listener as it runs.
        const other = new AbortController();
        teardown(other.signal);
        other.abort();
        expect(getEventListeners(other.signal, 'abort')).toHaveLength(0);
    });

    it('runs every undo where one throws, and reports the error', () => {
        const reported: unknown[] = [];
        vi.stubGlobal('reportError', (error: unknown) => reported.push(error));
        try {
            const down = teardown();
            const failure = new Error('an undo that throws');
            let ran = false;
            down.add(() => {
                throw failure;
            });
            down.add(() => (ran = true));
            down.stop();
            expect(ran).toBe(true);
            expect(reported).toEqual([failure]);
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('runs an undo kept after the teardown at once', () => {
        const down = teardown();
        down.stop();
        let ran = 0;
        down.add(() => (ran += 1));
        expect(ran).toBe(1);
        down.stop();
        expect(ran).toBe(1);
    });
});

describe('a teardown with several holders', () => {
    it('keeps the control for a signal held before the microtask after the abort', async () => {
        const first = new AbortController();
        const later = new AbortController();
        const down = teardown(first.signal);
        let ran = 0;
        down.add(() => (ran += 1));
        first.abort();
        down.hold(later.signal);
        await Promise.resolve();
        expect(ran).toBe(0);
        expect(down.signal.aborted).toBe(false);
        later.abort();
        expect(ran).toBe(0);
        await Promise.resolve();
        expect(ran).toBe(1);
    });

    it('takes the control down only once every signal holding it has aborted', async () => {
        const first = new AbortController();
        const later = new AbortController();
        const down = teardown(first.signal);
        let ran = 0;
        down.add(() => (ran += 1));
        down.hold(later.signal);
        first.abort();
        await Promise.resolve();
        expect(ran).toBe(0);
        later.abort();
        await Promise.resolve();
        expect(ran).toBe(1);
    });

    it('is held by a call without a signal only where nothing else holds it', async () => {
        // Held where nothing has held it yet, so the control stays until its detach.
        const kept = teardown();
        let keptRan = 0;
        kept.add(() => (keptRan += 1));
        kept.hold(undefined);
        await Promise.resolve();
        expect(keptRan).toBe(0);
        kept.stop();
        expect(keptRan).toBe(1);
        // Joined without holding where a signal holds, so that signal still takes it down.
        const page = new AbortController();
        const joined = teardown(page.signal);
        let joinedRan = 0;
        joined.add(() => (joinedRan += 1));
        joined.hold(undefined);
        page.abort();
        await Promise.resolve();
        expect(joinedRan).toBe(1);
    });

    it("joins a call without a signal in the abort's task as the page's own hold", async () => {
        const gone = new AbortController();
        const registry = new WeakMap<object, Kept<() => void>>();
        const element = {};
        const down = teardown(gone.signal);
        let ran = 0;
        down.add(() => (ran += 1));
        const handle = keep(registry, element, down, down.stop);
        gone.abort();
        // As any attach in the task, it joins and keeps the state, and holds for the page's life.
        expect(join(registry, element)).toBe(handle);
        await Promise.resolve();
        expect(ran).toBe(0);
        expect(registry.get(element)?.handle).toBe(handle);
        down.stop();
        expect(ran).toBe(1);
    });

    it('keeps a control a new signal joined for a call without a signal in the same task', async () => {
        const gone = new AbortController();
        const later = new AbortController();
        const down = teardown(gone.signal);
        let ran = 0;
        down.add(() => (ran += 1));
        gone.abort();
        // As an inline ref's new signal, then a call without a signal, in one task.
        down.hold(later.signal);
        down.hold(undefined);
        expect(ran).toBe(0);
        await Promise.resolve();
        expect(ran).toBe(0);
        later.abort();
        await Promise.resolve();
        expect(ran).toBe(1);
    });

    it('applies a call from the holder whose options apply, though it is not the newest', () => {
        type Options = { readonly name: string };
        const older = new AbortController();
        const bare = new AbortController();
        const down = teardown<Options>(older.signal, { name: 'first' });
        const applied: string[] = [];
        down.set = (options) => applied.push(options.name);
        // A newer holder that gives no options, as a hook of another kind through a merged ref.
        down.hold(bare.signal);
        // The older holder changes its options, as a hook does when one of its props changes.
        down.hold(older.signal, { name: 'second' });
        expect(applied).toEqual(['second']);
    });

    it("keeps a page's own options given without a signal as a hook sharing the element goes", async () => {
        type Options = { readonly name: string };
        const down = teardown<Options>(undefined, { name: 'page' });
        const applied: string[] = [];
        down.set = (options) => applied.push(options.name);
        const hook = new AbortController();
        down.hold(hook.signal, { name: 'hook' });
        // The page's own update, with no signal, applies and stays the page's.
        down.hold(undefined, { name: 'page again' });
        expect(applied).toEqual(['hook', 'page again']);
        hook.abort();
        await Promise.resolve();
        expect(applied).toEqual(['hook', 'page again']);
    });

    it('takes options that give only a signal for no options', () => {
        type Options = { readonly name?: string; readonly signal?: AbortSignal };
        const registry = new WeakMap<object, Kept<() => void, Options>>();
        const element = {};
        const down = teardown<Options>(undefined, { name: 'first' });
        const applied: (string | undefined)[] = [];
        down.set = (options) => applied.push(options.name);
        keep(registry, element, down, down.stop);
        join(registry, element, { signal: new AbortController().signal });
        expect(applied).toEqual([]);
    });

    it('takes options for given only where a key other than signal has a value', () => {
        type Options = {
            readonly name?: string | null | undefined;
            readonly signal?: AbortSignal | undefined;
        };
        const registry = new WeakMap<object, Kept<() => void, Options>>();
        const element = {};
        const down = teardown<Options>(undefined, { name: 'first' });
        const applied: Options[] = [];
        down.set = (options) => applied.push(options);
        keep(registry, element, down, down.stop);
        // An empty object and keys left undefined, as a page spreading its own optional props
        // passes, give nothing, so the options given first stay.
        join(registry, element, {});
        join(registry, element, { name: undefined });
        join(registry, element, { name: undefined, signal: undefined });
        expect(applied).toEqual([]);
        // Null is a value, so it is given.
        join(registry, element, { name: null });
        expect(applied).toEqual([{ name: null }]);
    });

    it('gives an attach made from inside a takedown a control of its own', () => {
        const registry = new WeakMap<object, Kept<() => void>>();
        const element = {};
        const down = teardown();
        let during: (() => void) | undefined;
        let fresh: (() => void) | undefined;
        // As a dialog's close handler, run by its takedown, attaches it again.
        down.add(() => {
            during = join(registry, element);
            const again = teardown();
            fresh = keep(registry, element, again, again.stop);
        });
        keep(registry, element, down, down.stop);
        down.stop();
        expect(during).toBeUndefined();
        expect(registry.get(element)?.handle).toBe(fresh);
    });

    it('keeps the options of a newer holder joined in the task its predecessor let go in', async () => {
        type Options = { readonly name: string };
        const older = new AbortController();
        const down = teardown<Options>(older.signal, { name: 'older' });
        const applied: string[] = [];
        down.set = (options) => applied.push(options.name);
        let newer = new AbortController();
        down.hold(newer.signal, { name: 'newer' });
        // A ref made afresh: the newer hook lets go and holds again with its own options.
        for (let render = 0; render < 3; render += 1) {
            const next = new AbortController();
            newer.abort();
            down.hold(next.signal, { name: 'newer' });
            newer = next;
            await Promise.resolve();
        }
        expect(applied).toEqual(['newer', 'newer', 'newer', 'newer']);
    });

    it('takes the control down at once on the detach, and leaves no listener on any signal', () => {
        const first = new AbortController();
        const later = new AbortController();
        const down = teardown(first.signal);
        let ran = 0;
        down.add(() => (ran += 1));
        down.hold(later.signal);
        expect(getEventListeners(first.signal, 'abort')).toHaveLength(1);
        expect(getEventListeners(later.signal, 'abort')).toHaveLength(1);
        down.stop();
        expect(ran).toBe(1);
        expect(getEventListeners(first.signal, 'abort')).toHaveLength(0);
        expect(getEventListeners(later.signal, 'abort')).toHaveLength(0);
    });

    it('keeps the listeners on its signals from growing as holders come and go', () => {
        const down = teardown();
        const own = getEventListeners(down.signal, 'abort').length;
        let held = new AbortController();
        down.hold(held.signal);
        for (let round = 0; round < 20; round += 1) {
            const next = new AbortController();
            held.abort();
            down.hold(next.signal);
            // Held twice by the same signal, as a hook that attaches again with its own does.
            down.hold(next.signal);
            expect(getEventListeners(held.signal, 'abort')).toHaveLength(0);
            expect(getEventListeners(next.signal, 'abort')).toHaveLength(1);
            held = next;
        }
        expect(getEventListeners(down.signal, 'abort')).toHaveLength(own);
        down.stop();
        expect(getEventListeners(held.signal, 'abort')).toHaveLength(0);
    });

    it("runs on its newest holder's options as holders join and let go", async () => {
        type Options = { readonly name: string };
        const oldest = new AbortController();
        const middle = new AbortController();
        const newest = new AbortController();
        const down = teardown<Options>(oldest.signal, { name: 'oldest' });
        const applied: string[] = [];
        down.set = (options) => applied.push(options.name);
        down.hold(middle.signal, { name: 'middle' });
        down.hold(newest.signal, { name: 'newest' });
        expect(applied).toEqual(['middle', 'newest']);
        // A call from an older holder is kept for it and not applied.
        down.hold(oldest.signal, { name: 'oldest again' });
        expect(applied).toEqual(['middle', 'newest']);
        // The newest letting go hands the control to the one before it, with its options.
        newest.abort();
        await Promise.resolve();
        expect(applied).toEqual(['middle', 'newest', 'middle']);
        // A call without a signal replaces the newest holder's options.
        down.hold(undefined, { name: 'unsigned' });
        expect(applied).toEqual(['middle', 'newest', 'middle', 'unsigned']);
        middle.abort();
        await Promise.resolve();
        expect(applied).toEqual(['middle', 'newest', 'middle', 'unsigned', 'oldest again']);
        // A holder that gave no options keeps what is current, and its leaving changes nothing.
        const bare = new AbortController();
        down.hold(bare.signal);
        bare.abort();
        await Promise.resolve();
        expect(applied).toHaveLength(5);
    });

    it('hands the options to the newest holder left that gave any as the one applied lets go', async () => {
        type Options = { readonly name: string };
        const oldest = new AbortController();
        const middle = new AbortController();
        const bare = new AbortController();
        const down = teardown<Options>(oldest.signal, { name: 'oldest' });
        const applied: string[] = [];
        down.set = (options) => applied.push(options.name);
        down.hold(middle.signal, { name: 'middle' });
        down.hold(bare.signal);
        // The middle holder's options apply, though it is not the newest, and go as it lets go.
        middle.abort();
        await Promise.resolve();
        expect(applied).toEqual(['middle', 'oldest']);
        // A call without a signal speaks for the newest holder, so its options leave with it.
        down.hold(undefined, { name: 'unsigned' });
        expect(applied).toEqual(['middle', 'oldest', 'unsigned']);
        bare.abort();
        await Promise.resolve();
        expect(applied).toEqual(['middle', 'oldest', 'unsigned', 'oldest']);
    });

    it('keeps a control by its element until it is taken down, and joins a later call to it', async () => {
        const registry = new WeakMap<object, Kept<() => void>>();
        const element = {};
        const first = new AbortController();
        expect(join(registry, element, { signal: first.signal })).toBeUndefined();
        const down = teardown(first.signal);
        const handle = keep(registry, element, down, down.stop);
        const later = new AbortController();
        first.abort();
        expect(join(registry, element, { signal: later.signal })).toBe(handle);
        await Promise.resolve();
        expect(registry.get(element)?.handle).toBe(handle);
        later.abort();
        await Promise.resolve();
        expect(registry.has(element)).toBe(false);
    });

    it("keeps an older holder's options through a later call from it that gives none", async () => {
        type Options = { readonly name: string };
        const older = new AbortController();
        const newer = new AbortController();
        const down = teardown<Options>(older.signal, { name: 'older' });
        const applied: string[] = [];
        down.set = (options) => applied.push(options.name);
        down.hold(newer.signal, { name: 'newer' });
        // The older holder calls again with only its signal, which gives no options.
        down.hold(older.signal);
        newer.abort();
        await Promise.resolve();
        expect(applied).toEqual(['newer', 'older']);
    });

    it('applies no options after the detach for a holder that let go just before it', async () => {
        type Options = { readonly name: string };
        const older = new AbortController();
        const newer = new AbortController();
        const down = teardown<Options>(older.signal, { name: 'older' });
        const applied: string[] = [];
        down.set = (options) => applied.push(options.name);
        down.hold(newer.signal, { name: 'newer' });
        newer.abort();
        down.stop();
        await Promise.resolve();
        expect(applied).toEqual(['newer']);
    });

    it('goes back to no options once the only holder that gave any lets go', async () => {
        type Options = { readonly name?: string };
        // The page holds the control without a signal and without options, and a hook joins.
        const down = teardown<Options>();
        const applied: Options[] = [];
        down.set = (options) => applied.push(options);
        const hook = new AbortController();
        down.hold(hook.signal, { name: 'hook' });
        hook.abort();
        await Promise.resolve();
        expect(applied).toEqual([{ name: 'hook' }, {}]);
    });

    it("takes a first attach's options that give only a signal for none", async () => {
        type Options = { readonly signal?: AbortSignal; readonly stay?: boolean };
        const first = new AbortController();
        const stayer = new AbortController();
        const down = teardown<Options>(first.signal, { signal: first.signal });
        const applied: Options[] = [];
        down.set = (options) => applied.push(options);
        down.hold(stayer.signal, { signal: stayer.signal, stay: true });
        stayer.abort();
        await Promise.resolve();
        expect(applied).toEqual([{ signal: stayer.signal, stay: true }, {}]);
    });
});
