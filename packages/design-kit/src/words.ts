import type { Failure } from './controls.js';
import { byId, CHOICE, fieldOf, idsOf, rootOf } from './find.js';

/*
 * The kit's words for a failure of the browser's constraints, the dated limits among them, for
 * `attachForm` to show where neither the field nor the page gives words of its own. No entry of
 * the package exports this module, so a page never reaches it.
 */

export type Checked = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const DATED = new Set(['date', 'datetime-local', 'month', 'week']);

const limitOf = (control: Checked, name: string) => control.getAttribute(name) ?? '';

/** Whether a control is described by a hint, which then shows the format it takes. */
const hinted = (control: Element): boolean =>
    idsOf(control, 'aria-describedby').some((id) => byId(control, id)?.matches('.dk-field-hint'));

/** Words for a value that does not match the format a field takes. */
const formatWords = (control: Checked) =>
    hinted(control) ? 'Enter it in the format the hint shows.' : 'Enter it in the right format.';

/** Words for a value off a field's steps, counted from its least where it has one. */
const stepWords = (control: Checked): string => {
    if (control.type === 'time') return 'Enter a time on one of the steps allowed.';
    if (control.type === 'datetime-local')
        return 'Enter a date and time on one of the steps allowed.';
    if (DATED.has(control.type)) return 'Enter a date on one of the steps allowed.';
    const least = limitOf(control, 'min');
    const step = limitOf(control, 'step') || '1';
    if (step === '1' && (least === '' || Number.isInteger(Number(least))))
        return 'Enter a whole number.';
    return least !== '' && Number(least) !== 0
        ? `Enter ${least}, or ${least} plus a multiple of ${step}.`
        : `Enter a multiple of ${step}.`;
};

/** The language nearest a field, past each shadow root it sits in, else the document's. */
const langOf = (control: Element): string => {
    for (let at: Element | null = control; at;) {
        const named = at.closest('[lang]');
        if (named) return named.getAttribute('lang') ?? '';
        const root = rootOf(at);
        at = root instanceof ShadowRoot ? root.host : null;
    }
    return document.documentElement.lang;
};

/**
 * A dated limit's part in the nearest English language around the field, else in US English, since
 * the kit's words are English, read in UTC on both sides so the wall time written is the one shown.
 */
const formatIn = (control: Checked, options: Intl.DateTimeFormatOptions, when: Date): string => {
    const lang = langOf(control);
    const zoned = { ...options, timeZone: 'UTC' };
    try {
        return new Intl.DateTimeFormat(/^en(-|$)/i.test(lang) ? lang : 'en-US', zoned).format(when);
    } catch {
        return new Intl.DateTimeFormat('en-US', zoned).format(when);
    }
};

/**
 * The wall time a dated value's parts write, held in UTC so no zone moves it, with a week at its
 * Monday, counted from that of the week holding January 4, which is the ISO week 1.
 */
export const wallOf = (parts: readonly number[], week: boolean, ms: number): Date => {
    const [year = 0, month = 1, day = 1, hour = 0, minute = 0, second = 0] = parts;
    const when = new Date(Date.UTC(2000, 0, 1, hour, minute, second, ms));
    // Set apart, so a year under 100 stays as written rather than taken for one in the 1900s.
    when.setUTCFullYear(year, week ? 0 : month - 1, week ? 4 : day);
    if (week) when.setUTCDate(4 - ((when.getUTCDay() + 6) % 7) + 7 * (month - 1));
    return when;
};

/**
 * A dated field's limit as a visitor reads it: "November 2026" for a month, "the week of November
 * 23, 2026" for a week, and a date and its time joined by "at" whatever the engine, or the limit as
 * written where it is past any date a script can hold.
 */
export const whenWords = (control: Checked, limit: string): string => {
    const type = control.type;
    const time = type === 'time';
    // A time read as one on a day of its own, so every type's parts fall in the same places.
    const parts = (time ? `2000-1-1T${limit}` : limit).split(/\D+/).map(Number);
    // A fraction of a second shown to its own digits, so the limit shown is one the field takes.
    const fraction = limit.split('.')[1] ?? '';
    const when = wallOf(parts, type === 'week', Math.round(Number(`0.${fraction}`) * 1000));
    if (Number.isNaN(when.getTime())) return limit;
    const day = type !== 'month' && { day: 'numeric' as const };
    const date = time ? '' : formatIn(control, { year: 'numeric', month: 'long', ...day }, when);
    const digits = Math.min(fraction.length, 3) as 0 | 1 | 2 | 3;
    const second = parts.length > 5 && {
        second: '2-digit' as const,
        ...(digits && { fractionalSecondDigits: digits }),
    };
    const clock =
        parts.length > 3
            ? formatIn(control, { hour: 'numeric', minute: '2-digit', ...second }, when)
            : '';
    return `${type === 'week' ? 'the week of ' : ''}${[date, clock].filter(Boolean).join(' at ')}`;
};

/** A time's seconds past midnight, or NaN for one that does not parse, which compares as neither. */
const secondsOf = (limit: string): number => {
    const parts = /^(\d\d):(\d\d)(?::(\d\d(?:\.\d+)?))?$/.exec(limit);
    return parts ? Number(parts[1]) * 3600 + Number(parts[2]) * 60 + Number(parts[3] ?? 0) : NaN;
};

/**
 * Words for a value past a field's least or most, which end on "later" or "earlier" so the closing
 * period never touches a value. A time whose limits both parse with its most before its least is
 * a window overnight, where a value in the gap fails both, and its words give the whole window.
 */
export const limitWords = (control: Checked, name: 'min' | 'max'): string => {
    const limit = limitOf(control, name);
    const least = name === 'min';
    if (control.type !== 'time' && !DATED.has(control.type))
        return `Enter ${limit} or ${least ? 'more' : 'less'}.`;
    const [from, to] = [limitOf(control, 'min'), limitOf(control, 'max')];
    if (control.type === 'time' && secondsOf(to) < secondsOf(from))
        return `Enter a time between ${whenWords(control, from)} and ${whenWords(control, to)} the next day.`;
    return `Enter ${whenWords(control, limit)} or ${least ? 'later' : 'earlier'}.`;
};

/**
 * The kit's words for a failure, which say what to do, in the manner of GOV.UK's error messages.
 * A pattern cannot be put in words from the pattern, so a field with one gives words of its own.
 */
export const KIT_WORDS: Record<Failure, (control: Checked) => string> = {
    badInput: (control) =>
        control.type === 'time'
            ? 'Enter a real time.'
            : DATED.has(control.type)
              ? 'Enter a real date.'
              : 'Enter a number.',
    valueMissing: (control) => {
        if (control.type === 'checkbox' && fieldOf(control) === control)
            return 'Check the box to go on.';
        return control instanceof HTMLSelectElement || control.matches(CHOICE)
            ? 'Choose an option.'
            : 'Enter a value.';
    },
    typeMismatch: (control) => {
        if (control.type === 'email') return 'Enter an email address like name@example.com here.';
        return control.type === 'url'
            ? 'Enter the full web address, with https:// at the start.'
            : formatWords(control);
    },
    patternMismatch: formatWords,
    tooShort: (control) => `Enter at least ${limitOf(control, 'minlength')} characters.`,
    tooLong: (control) => `Enter ${limitOf(control, 'maxlength')} characters or fewer.`,
    rangeUnderflow: (control) => limitWords(control, 'min'),
    rangeOverflow: (control) => limitWords(control, 'max'),
    stepMismatch: stepWords,
    customError: (control) => control.validationMessage,
};
