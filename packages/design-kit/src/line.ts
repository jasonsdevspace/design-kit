import type { Say } from './controls.js';

/*
 * The state of each status line the kit speaks on, kept apart from the controls so the hooks can
 * let a line go without the controls publishing a second way to take a piece down. The package's
 * exports name only the controls, the hooks and the rest, so a page never reaches this module.
 */

type Spoken = Parameters<Say>[0];

/**
 * What a status line is saying. A message is put in a moment after the line is emptied, so the
 * same words twice are heard twice, and leaves after a while unless it is kept, as a toast keeps
 * its own until the toast leaves. Words waiting to settle keep a timer of their own, so words
 * already said still leave as ever. The line knows the message it is saying and whether it was said
 * in this moment, whether firm words were said in this moment or still settle, and the polite words
 * and the polite notice, given as a function, waiting for it to be free.
 */
export type Line = {
    timer: number;
    settle: number;
    current: {
        readonly message: Spoken;
        readonly polite: boolean;
        put: boolean;
        now: boolean;
    } | null;
    firmNow: boolean;
    /** How many firm messages the line has had, so only the last clears the moment's mark. */
    firms: number;
    settling: boolean;
    words: string | null;
    notice: (() => string | null) | null;
    /** Let go of by `releaseLine`, so nothing is said on it until it is attached again. */
    released: boolean;
    /** The timers that end the moments words were said in, each taken off as it comes. */
    moments: Set<number>;
};
export const lines = new WeakMap<HTMLElement, Line>();
export const lineOf = (status: HTMLElement): Line => {
    let line = lines.get(status);
    if (!line) {
        line = {
            timer: 0,
            settle: 0,
            current: null,
            firmNow: false,
            firms: 0,
            settling: false,
            words: null,
            notice: null,
            released: false,
            moments: new Set(),
        };
        lines.set(status, line);
    }
    return line;
};

/**
 * Lets a status line go, as `StatusProvider` does when it unmounts: the line's timers are cleared,
 * the words said or held for it are dropped and it is emptied. Nothing more is said on it, by the
 * function `attachStatus` returned or by any piece given it, such as a busy button, a copy button
 * or a form, until the page attaches it again with `attachStatus`. A piece's own timers, such as a
 * busy button's wait, are the piece's, and come due saying nothing. A line nothing has spoken on is
 * left as it is.
 */
export const releaseLine = (line: HTMLElement): void => {
    const state = lines.get(line);
    if (!state) return;
    window.clearTimeout(state.timer);
    window.clearTimeout(state.settle);
    for (const moment of state.moments) window.clearTimeout(moment);
    state.moments.clear();
    state.current = null;
    state.firmNow = false;
    state.words = null;
    state.notice = null;
    state.settling = false;
    state.released = true;
    line.textContent = '';
};
