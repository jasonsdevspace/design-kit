import { describe, expect, it, vi } from 'vitest';

import { teardown } from './teardown.js';

/*
 * The teardown every attach keeps record 22's contract through, in plain Node, which has the
 * `AbortController` it rests on. The browser tests hold each attach that uses it to the contract.
 */

describe('a teardown', () => {
    it('reports a signal already aborted, so the attach attaches nothing', () => {
        expect(teardown(AbortSignal.abort())).toBeNull();
    });

    it('runs what it keeps once, in the order kept, and aborts its own signal', () => {
        const down = teardown();
        if (!down) throw new Error('expected a teardown');
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

    it("runs when the page's signal aborts, and not again on the detach", () => {
        const page = new AbortController();
        const down = teardown(page.signal);
        if (!down) throw new Error('expected a teardown');
        let ran = 0;
        down.add(() => (ran += 1));
        page.abort();
        down.stop();
        expect(ran).toBe(1);
        expect(down.signal.aborted).toBe(true);
    });

    it("takes its listener off the page's signal once it has run", () => {
        const page = new AbortController();
        // The listener the teardown adds, and whether its own signal has taken it off again.
        let added: AbortSignal | undefined;
        const add = page.signal.addEventListener.bind(page.signal);
        vi.spyOn(page.signal, 'addEventListener').mockImplementation((type, listener, options) => {
            if (type === 'abort' && typeof options === 'object') added = options.signal;
            add(type, listener, options);
        });
        const down = teardown(page.signal);
        if (!down) throw new Error('expected a teardown');
        expect(added?.aborted).toBe(false);
        down.stop();
        // A listener added with a signal comes off as that signal aborts, as the DOM has it.
        expect(added?.aborted).toBe(true);
        let ran = 0;
        down.add(() => (ran += 1));
        page.abort();
        expect(ran).toBe(1);
    });

    it('runs every undo where one throws, and reports the error', () => {
        const reported: unknown[] = [];
        vi.stubGlobal('reportError', (error: unknown) => reported.push(error));
        try {
            const down = teardown();
            if (!down) throw new Error('expected a teardown');
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
        if (!down) throw new Error('expected a teardown');
        down.stop();
        let ran = 0;
        down.add(() => (ran += 1));
        expect(ran).toBe(1);
        down.stop();
        expect(ran).toBe(1);
    });
});
