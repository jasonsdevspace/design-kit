import type { Say, SayOptions } from './controls.js';

/*
 * The status line's state and its speech: what each line the kit speaks on is saying and waiting to
 * say, and the code that says, holds and hushes words on it, for `attachStatus` and every piece
 * that speaks on a line. The package's exports name only the controls, the hooks and the rest, so a
 * page never reaches this module.
 */

/**
 * How long words stay on a status line, and a copy button shows what it did before it shows Copy
 * again, in milliseconds.
 */
export const SAID_FOR = 2000;

/** A message a status line says: words, or a function that gives them as they are put in. */
export type Spoken = Parameters<Say>[0];

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
const lines = new WeakMap<HTMLElement, Line>();
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

/** Empties a status line, and drops what it was about to say, waiting words among them. */
export const hush = (status: HTMLElement) => {
    const line = lineOf(status);
    window.clearTimeout(line.timer);
    window.clearTimeout(line.settle);
    Object.assign(line, {
        current: null,
        firmNow: false,
        settling: false,
        words: null,
        notice: null,
    });
    status.textContent = '';
};

/** Keeps polite words to say once the line is free, words and a notice each in a place apart. */
const hold = (line: Line, message: Spoken) => {
    if (typeof message === 'string') line.words = message;
    else line.notice = message;
};

/**
 * Whether polite words go now. They give way to firm words said in the same moment or still
 * settling, so a result said with them is heard in their place. They wait for firm words the line
 * is saying, and polite words given as a function, read as they are put in, such as a busy
 * button's notice, wait for any words, so they never put out the end of a progress and say nothing
 * once no longer true. Words that wait take the place of words of their kind waiting before them.
 */
const admit = (line: Line, message: Spoken): boolean => {
    if (line.settling || line.firmNow) return false;
    const { current } = line;
    if (current && (!current.polite || typeof message === 'function')) {
        hold(line, message);
        return false;
    }
    return true;
};

/**
 * Ends what a line is saying, and says what waits for it once nothing settles: the polite words
 * first, and the notice once those have left too.
 */
const leave = (status: HTMLElement) => {
    const line = lineOf(status);
    line.current = null;
    status.textContent = '';
    if (line.settling) return;
    const next = line.words ?? line.notice;
    if (next === line.words) line.words = null;
    else line.notice = null;
    if (!next) return;
    say(status, next, false, true);
    // Said earlier and only held, so not taken for words said in this moment.
    const said = lineOf(status).current;
    if (said?.message === next) said.now = false;
};

/**
 * Says a message on a status line. A message given as a function is read as it is put in, after the
 * moment's wait, so words a page draws from its own state follow the change that prompted them, and
 * one that gives nothing by then is not said. Polite words go, wait or give way as `admit` has it.
 * Firm words drop words still settling, and words that go take the place of the one the line is
 * saying. Polite words not yet put in that firm words take the place of wait for those to leave,
 * unless both were said in the same moment, and a notice waits whatever takes its place. Firm words
 * leave polite words waiting as they are, and polite words that go take the place of the polite
 * words waiting.
 */
export const say = (status: HTMLElement, message: Spoken, keep = false, polite = false) => {
    const line = lineOf(status);
    // A line let go of says nothing and sets no timer, until it is attached again.
    if (line.released) return;
    if (polite && !admit(line, message)) return;
    if (polite) line.words = null;
    const before = line.current;
    if (
        before?.polite &&
        !before.put &&
        (typeof before.message === 'function' || (!polite && !before.now))
    )
        hold(line, before.message);
    window.clearTimeout(line.timer);
    window.clearTimeout(line.settle);
    line.settling = false;
    status.textContent = '';
    const current = { message, polite, put: false, now: true };
    line.current = current;
    if (!polite) {
        line.firmNow = true;
        line.firms += 1;
    }
    const firms = line.firms;
    // The moment ends with the task, whether the words are still on the line or have left it.
    const moment = window.setTimeout(() => {
        line.moments.delete(moment);
        current.now = false;
        if (!polite && line.firms === firms) line.firmNow = false;
    });
    line.moments.add(moment);
    line.timer = window.setTimeout(() => {
        const words = typeof message === 'string' ? message : message();
        // A message that is no longer wanted by the time it would be said is left unsaid.
        if (words === null) {
            leave(status);
            return;
        }
        status.textContent = words;
        current.put = true;
        if (keep) return;
        line.timer = window.setTimeout(() => {
            leave(status);
        }, SAID_FOR);
    }, 100);
};

/**
 * Takes a piece's own message off a page's line before it would leave, freeing it for the next, or
 * out of the wait polite words keep there.
 */
export const unsay = (status: HTMLElement, message: Spoken | null) => {
    const line = lineOf(status);
    if (line.words === message) line.words = null;
    if (message === null || line.current?.message !== message) return;
    window.clearTimeout(line.timer);
    leave(status);
};

/**
 * Says a message on a status line, at once or once its words stop changing, without attaching the
 * line. The kit's own pieces speak through it, so none holds a page's line, and a line a page
 * attaches with a signal is taken down once that signal, and every other that holds it, aborts.
 */
export const sayOn = (
    line: HTMLElement,
    message: Spoken,
    { settle = 0, polite = false }: SayOptions = {}
) => {
    if (settle <= 0) {
        say(line, message, false, polite);
        return;
    }
    const state = lineOf(line);
    if (state.released) return;
    if (polite && !admit(state, message)) {
        // Polite words settling before these are dropped, so the last said is the one heard.
        if (!state.settling) window.clearTimeout(state.settle);
        return;
    }
    // Waits on a timer of its own, so words already said are still put in and leave as ever, and
    // any message said in the meantime drops these.
    window.clearTimeout(state.settle);
    state.settling = !polite;
    state.settle = window.setTimeout(() => {
        state.settling = false;
        say(line, message, false, polite);
    }, settle);
};

/** Where a piece's words are said: the page's own function, or a status line the page names. */
type SpeaksOn = {
    readonly say?: Say | undefined;
    readonly status?: HTMLElement | null | undefined;
};

/**
 * Says a piece's words through the page's function where it gives one, else on its line, which a
 * line let go of keeps silent until the page attaches it again.
 */
export const speakOn = (chosen: SpeaksOn, message: Spoken, options?: SayOptions) => {
    if (chosen.say) chosen.say(message, options);
    else if (chosen.status) sayOn(chosen.status, message, options);
};

/** Takes a status line back for an attach, so words are said on it again once it was let go. */
export const claimLine = (line: HTMLElement): void => {
    lineOf(line).released = false;
};

/**
 * Lets a status line go, as an abort of the `signal` `attachStatus` took does, `StatusProvider`'s
 * as it unmounts among them, and as a toast's teardown does for its own line: the line is hushed,
 * the timers that end its moments are cleared too, and nothing more is said on it, by the function
 * `attachStatus` returned or by any piece given it, such as a busy button, a copy button or a form,
 * until the page attaches it again with `attachStatus`. A piece's own timers, such as a busy
 * button's wait, are the piece's, and come due saying nothing. A line nothing has spoken on is left
 * as it is.
 */
export const releaseLine = (line: HTMLElement): void => {
    const state = lines.get(line);
    if (!state) return;
    hush(line);
    for (const moment of state.moments) window.clearTimeout(moment);
    state.moments.clear();
    state.released = true;
};
