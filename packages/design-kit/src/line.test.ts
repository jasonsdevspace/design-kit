import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SAID_FOR, say } from './line.js';

/*
 * The status line's speech in plain Node, on a stand-in clock: a line is only an element whose
 * text is set, so any object with a text stands in. The browser tests hold what a visitor hears.
 */

describe('a status line', () => {
    const reported: unknown[] = [];

    beforeEach(() => {
        reported.length = 0;
        vi.useFakeTimers();
        // The line sets its timers on the window, which Node keeps on the global object.
        vi.stubGlobal('window', globalThis);
        vi.stubGlobal('reportError', (error: unknown) => reported.push(error));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it("says a later polite message after a page's function throws, and reports the error", () => {
        const line = { textContent: '' } as HTMLElement;
        const failure = new Error('words that throw');
        // Firm words given as a function, as a stepper says its value with a page's words.
        say(line, () => {
            throw failure;
        });
        vi.advanceTimersByTime(100);
        expect(reported).toEqual([failure]);
        expect(line.textContent).toBe('');
        // Polite words wait for firm words the line is saying, so a line still claimed by the
        // words that threw would hold these for good.
        say(line, 'Saved', false, true);
        vi.advanceTimersByTime(100);
        expect(line.textContent).toBe('Saved');
        vi.advanceTimersByTime(SAID_FOR);
        expect(line.textContent).toBe('');
    });

    it('says the polite words that waited behind words that throw', () => {
        const line = { textContent: '' } as HTMLElement;
        const failure = new Error('words that throw');
        say(line, () => {
            throw failure;
        });
        // Said a task later, so they wait for the firm words rather than give way to them.
        vi.advanceTimersByTime(1);
        say(line, 'Saved', false, true);
        vi.advanceTimersByTime(99);
        expect(reported).toEqual([failure]);
        vi.advanceTimersByTime(100);
        expect(line.textContent).toBe('Saved');
    });
});
