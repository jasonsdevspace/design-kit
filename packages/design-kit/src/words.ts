import { byId, CHOICE, fieldOf, idsOf, rootOf } from './find.js';

/*
 * The kit's words for a failure of the browser's constraints, the dated limits among them, for
 * `attachForm` to show where neither the field nor the page gives words of its own. No entry of
 * the package exports this module, so a page never reaches it.
 */

/** The ways a field fails the browser's constraints, in the order their words are chosen. */
export const FAILURES = [
    'badInput',
    'valueMissing',
    'typeMismatch',
    'patternMismatch',
    'tooShort',
    'tooLong',
    'rangeUnderflow',
    'rangeOverflow',
    'stepMismatch',
    'customError',
] as const;

/** A way a field fails the browser's constraints, named as its `validity` names it. */
export type Failure = (typeof FAILURES)[number];

export type Checked = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const DATED = new Set(['date', 'datetime-local', 'month', 'week']);

const limitOf = (control: Checked, name: string) => control.getAttribute(name) ?? '';

/** Whether a control is described by a hint, which then shows the format it takes. */
const hinted = (control: Element): boolean =>
    idsOf(control, 'aria-describedby').some((id) => byId(control, id)?.matches('.dk-field-hint'));

/** Words for a value that does not match the format a field takes. */
const formatWords = (control: Checked) =>
    hinted(control) ? 'Enter it in the format the hint shows.' : 'Enter it in the right format.';

/**
 * A number attribute as written, where the browser reads it as a valid floating-point number that
 * stays finite, as every engine does, else empty, so a space, a plus sign or hex digits Number
 * would take leave it out. The step words and the range words both write it, so they agree.
 */
const numberText = (control: Checked, name: string): string => {
    const text = limitOf(control, name);
    return /^-?(\d+(\.\d+)?|\.\d+)(e[+-]?\d+)?$/i.test(text) && Number.isFinite(Number(text))
        ? text
        : '';
};

/**
 * Words for a value off a field's steps, counted from the browser's step base: its least where it
 * parses, else its value attribute where that parses, else 0. A step that does not parse, or is not
 * above 0, is the default step of 1.
 */
const stepWords = (control: Checked): string => {
    if (control.type === 'time') return 'Enter a time on one of the steps allowed.';
    if (control.type === 'datetime-local')
        return 'Enter a date and time on one of the steps allowed.';
    if (DATED.has(control.type)) return 'Enter a date on one of the steps allowed.';
    const given = numberText(control, 'step');
    const step = Number(given) > 0 ? given : '1';
    // Empty where neither parses, which reads as a base of 0.
    const base = numberText(control, 'min') || numberText(control, 'value');
    if (Number(step) === 1 && Number.isInteger(Number(base))) return 'Enter a whole number.';
    return Number(base) === 0
        ? `Enter a multiple of ${step}.`
        : `Enter ${base}, or ${base} plus a multiple of ${step}.`;
};

/** The language nearest a field, past each shadow root it sits in, else the document's. */
const langOf = (control: Element): string => {
    for (let at: Element | null = control; at;) {
        const named = at.closest('[lang]');
        if (named) return named.getAttribute('lang') ?? '';
        const root = rootOf(at);
        at = 'host' in root ? root.host : null;
    }
    return control.ownerDocument.documentElement.lang;
};

/**
 * A dated limit's part in the nearest English language around the field, else in US English, since
 * the kit's words are English, read in UTC on both sides so the wall time written is the one shown.
 * It keeps the Gregorian calendar and Latin digits the field takes, whatever calendar or digits the
 * language tag picks, and writes a year to four digits as the field does, so a month in year 1
 * never reads as a day.
 */
const formatIn = (control: Checked, options: Intl.DateTimeFormatOptions, when: Date): string => {
    const lang = langOf(control);
    const zoned = { ...options, timeZone: 'UTC', calendar: 'gregory', numberingSystem: 'latn' };
    const year = String(when.getUTCFullYear()).padStart(4, '0');
    const format = (tag: string) =>
        new Intl.DateTimeFormat(tag, zoned)
            .formatToParts(when)
            .map((part) => (part.type === 'year' ? year : part.value))
            .join('');
    try {
        return format(/^en(-|$)/i.test(lang) ? lang : 'en-US');
    } catch {
        return format('en-US');
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
        return `Enter ${numberText(control, name)} or ${least ? 'more' : 'less'}.`;
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
        return control.localName === 'select' || control.matches(CHOICE)
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
