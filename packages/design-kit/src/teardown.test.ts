import { describe, expect, it } from 'vitest';

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

    it("leaves the page's signal once it has run, so a later abort finds nothing of it", () => {
        const page = new AbortController();
        const down = teardown(page.signal);
        if (!down) throw new Error('expected a teardown');
        let ran = 0;
        down.add(() => (ran += 1));
        down.stop();
        page.abort();
        expect(ran).toBe(1);
    });
});
