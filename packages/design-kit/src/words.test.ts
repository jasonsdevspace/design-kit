import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    type Checked,
    KIT_WORDS,
    limitWords as limitWordsOf,
    wallOf,
    whenWords as whenWordsOf,
} from './words.js';

/*
 * The kit's words for a failure in plain Node. A field is a stand-in that answers only what the
 * words ask of it: its type, its attributes, the language around it and what it matches. The
 * browser tests in e2e/checked.spec.tsx hold the same words as a visitor reads them, with Node's
 * Intl standing in for the browser's.
 */

/** A shadow root, which a field's language is read past to the element that holds it. */
class Shadow {
    constructor(readonly host: unknown) {}
}

/** A stand-in for a select, which the words tell from an input by its class. */
class Select {}

type Given = {
    readonly type?: string;
    readonly attributes?: Readonly<Record<string, string>>;
    /** The language of the nearest element that names one, or none where no element does. */
    readonly lang?: string | null;
    /** What the field matches, as the selectors the words ask about. */
    readonly matches?: readonly string[];
    /** The root the field lives in, the document where it is not given. */
    readonly root?: unknown;
    readonly validationMessage?: string;
    readonly fieldset?: unknown;
};

/** A field with only what the words read of it. */
const field = ({
    type = 'text',
    attributes = {},
    lang = 'en-US',
    matches = [],
    root = {},
    validationMessage = '',
    fieldset = null,
}: Given = {}): Checked =>
    ({
        type,
        validationMessage,
        getAttribute: (name: string) => attributes[name] ?? null,
        closest: (selector: string) => {
            if (selector === '[lang]') return lang === null ? null : { getAttribute: () => lang };
            return selector === 'fieldset' ? fieldset : null;
        },
        matches: (selector: string) => matches.includes(selector),
        getRootNode: () => root,
    }) as unknown as Checked;

const CHOICE = 'input[type="checkbox"], input[type="radio"]';

/**
 * Words with the narrow no-break space a newer ICU puts before AM and PM read as a plain space, so
 * the times compare the same whichever ICU the Node in use carries.
 */
const plain = (words: string) => words.replaceAll('\u202f', ' ');
const limitWords = (control: Checked, name: 'min' | 'max') => plain(limitWordsOf(control, name));
const whenWords = (control: Checked, limit: string) => plain(whenWordsOf(control, limit));

/** A field's words for a value below its least and above its most. */
const limits = (control: Checked) => [limitWords(control, 'min'), limitWords(control, 'max')];

beforeEach(() => {
    vi.stubGlobal('ShadowRoot', Shadow);
    vi.stubGlobal('HTMLSelectElement', Select);
    vi.stubGlobal('document', { documentElement: { lang: 'en-US' } });
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

describe("a dated field's limit", () => {
    it('gives the limit in words a visitor reads, ending on later or earlier', () => {
        const dated = (type: string, min: string, max: string) =>
            limits(field({ type, attributes: { min, max } }));
        expect(dated('date', '2026-11-22', '2026-12-24')).toEqual([
            'Enter November 22, 2026 or later.',
            'Enter December 24, 2026 or earlier.',
        ]);
        expect(dated('datetime-local', '2026-11-22T09:00', '2026-11-29T18:30')).toEqual([
            'Enter November 22, 2026 at 9:00 AM or later.',
            'Enter November 29, 2026 at 6:30 PM or earlier.',
        ]);
        expect(dated('time', '09:00', '17:30')).toEqual([
            'Enter 9:00 AM or later.',
            'Enter 5:30 PM or earlier.',
        ]);
        expect(dated('month', '2026-11', '2027-02')).toEqual([
            'Enter November 2026 or later.',
            'Enter February 2027 or earlier.',
        ]);
        expect(dated('week', '2026-W01', '2026-W48')).toEqual([
            'Enter the week of December 29, 2025 or later.',
            'Enter the week of November 23, 2026 or earlier.',
        ]);
    });

    it("writes a date and a time as the field's language does, where it is English", () => {
        const british = (type: string, max: string) =>
            limitWords(field({ type, attributes: { max }, lang: 'en-GB' }), 'max');
        expect(british('date', '2026-12-24')).toBe('Enter 24 December 2026 or earlier.');
        expect(british('time', '17:30')).toBe('Enter 17:30 or earlier.');
    });

    it("gives a page in another language a date in US English, as the kit's words are", () => {
        vi.stubGlobal('document', { documentElement: { lang: 'fr' } });
        const day = { type: 'date', attributes: { min: '2026-11-22' } };
        expect(limitWords(field({ ...day, lang: null }), 'min')).toBe(
            'Enter November 22, 2026 or later.'
        );
        expect(limitWords(field({ ...day, lang: 'fr' }), 'min')).toBe(
            'Enter November 22, 2026 or later.'
        );
        // The nearest language, an English part of the page, over the page's own.
        expect(limitWords(field({ ...day, lang: 'en-GB' }), 'min')).toBe(
            'Enter 22 November 2026 or later.'
        );
    });

    it('takes the language of the page around a shadow root a field sits in', () => {
        vi.stubGlobal('document', { documentElement: { lang: 'en-GB' } });
        const host = { closest: () => null, getRootNode: () => ({}) };
        const inside = field({
            type: 'date',
            attributes: { min: '2026-11-22' },
            lang: null,
            root: new Shadow(host),
        });
        expect(limitWords(inside, 'min')).toBe('Enter 22 November 2026 or later.');
    });

    it('reads a limit in a spring-forward gap as the wall time written', () => {
        vi.stubEnv('TZ', 'America/New_York');
        const when = field({ type: 'datetime-local', attributes: { min: '2026-03-08T02:30' } });
        expect(limitWords(when, 'min')).toBe('Enter March 8, 2026 at 2:30 AM or later.');
    });

    it('keeps a year under 100 as written, and shows a year past any date as written', () => {
        expect(limitWords(field({ type: 'date', attributes: { min: '0050-01-01' } }), 'min')).toBe(
            'Enter January 1, 50 or later.'
        );
        const far = field({ type: 'datetime-local', attributes: { max: '275760-09-13T12:00' } });
        expect(limitWords(far, 'max')).toBe('Enter 275760-09-13T12:00 or earlier.');
    });

    it('gives an overnight window for a time its limits wrap around, past either limit', () => {
        const shift = field({ type: 'time', attributes: { min: '22:00', max: '06:00' } });
        const window = 'Enter a time between 10:00 PM and 6:00 AM the next day.';
        expect(limits(shift)).toEqual([window, window]);
    });

    it('keeps a window overnight to limits that parse with the most before the least', () => {
        const same = field({ type: 'time', attributes: { min: '22:00:00', max: '22:00' } });
        expect(limitWords(same, 'max')).toBe('Enter 10:00 PM or earlier.');
        const bad = field({ type: 'time', attributes: { min: 'late', max: '06:00' } });
        expect(limitWords(bad, 'max')).toBe('Enter 6:00 AM or earlier.');
    });

    it('shows the fraction of a second a limit holds, so the limit shown is one the field takes', () => {
        const lap = field({ type: 'time', attributes: { min: '09:00:00.5', step: '0.1' } });
        expect(limitWords(lap, 'min')).toBe('Enter 9:00:00.5 AM or later.');
    });

    it('gives a number field its limit as written', () => {
        expect(limits(field({ type: 'number', attributes: { min: '18', max: '99' } }))).toEqual([
            'Enter 18 or more.',
            'Enter 99 or less.',
        ]);
    });
});

describe('a dated value as words', () => {
    it('puts an ISO week at its Monday, counted from the week that holds January 4', () => {
        const week = (limit: string) => whenWords(field({ type: 'week' }), limit);
        // 2026 opens on a Thursday, so its first week starts in the year before.
        expect(week('2026-W01')).toBe('the week of December 29, 2025');
        // 2021 opens on a Friday, so its first week starts after New Year's Day.
        expect(week('2021-W01')).toBe('the week of January 4, 2021');
        // A year of 53 weeks, whose last ends in the year after.
        expect(week('2020-W53')).toBe('the week of December 28, 2020');
        // A week past a year's last runs on into the next year, as written.
        expect(week('2021-W53')).toBe('the week of January 3, 2022');
        expect(wallOf([2026, 1], true, 0).toISOString()).toBe('2025-12-29T00:00:00.000Z');
    });

    it('keeps a year under a hundred as written, not one in the 1900s', () => {
        expect(whenWords(field({ type: 'date' }), '0099-12-31')).toBe('December 31, 99');
        expect(whenWords(field({ type: 'month' }), '0001-01')).toBe('January 1');
        expect(wallOf([50, 1, 1], false, 0).getUTCFullYear()).toBe(50);
        expect(wallOf([0, 1, 1], false, 0).getUTCFullYear()).toBe(0);
    });

    it('shows a fraction of a second to its own digits, up to three', () => {
        const time = (limit: string) => whenWords(field({ type: 'time' }), limit);
        expect(time('09:00:00.5')).toBe('9:00:00.5 AM');
        expect(time('09:00:00.25')).toBe('9:00:00.25 AM');
        expect(time('09:00:00.125')).toBe('9:00:00.125 AM');
        // Past three digits the fourth rounds into the third.
        expect(time('09:00:00.1255')).toBe('9:00:00.126 AM');
        expect(time('09:00:30')).toBe('9:00:30 AM');
        expect(wallOf([2000, 1, 1, 9, 0, 0], false, 500).getUTCMilliseconds()).toBe(500);
    });

    it('reads a malformed language as US English', () => {
        const time = (lang: string) => whenWords(field({ type: 'time', lang }), '17:30');
        // A tag Intl refuses, which starts as English would.
        expect(time('en-')).toBe('5:30 PM');
        expect(time('en-GB-x')).toBe('5:30 PM');
        // A tag that is not English at all, malformed or not.
        expect(time('xx_yy')).toBe('5:30 PM');
        expect(time('')).toBe('5:30 PM');
        // English in another case, which Intl takes.
        expect(time('EN-gb')).toBe('17:30');
    });

    it('gives the limit as written where it is past any date a script can hold', () => {
        expect(whenWords(field({ type: 'date' }), '275760-09-14')).toBe('275760-09-14');
        expect(whenWords(field({ type: 'date' }), '275760-09-13')).toBe('September 13, 275760');
    });
});

describe("the kit's words for each failure", () => {
    it('ask for a real time, date or number where the browser cannot read the value', () => {
        expect(KIT_WORDS.badInput(field({ type: 'time' }))).toBe('Enter a real time.');
        expect(KIT_WORDS.badInput(field({ type: 'week' }))).toBe('Enter a real date.');
        expect(KIT_WORDS.badInput(field({ type: 'number' }))).toBe('Enter a number.');
    });

    it('ask for a value, a choice or a box checked where one is missing', () => {
        expect(KIT_WORDS.valueMissing(field())).toBe('Enter a value.');
        expect(KIT_WORDS.valueMissing(Object.assign(new Select(), field()))).toBe(
            'Choose an option.'
        );
        // A box alone stands for itself, while a radio in a set stands for its fieldset.
        expect(KIT_WORDS.valueMissing(field({ type: 'checkbox', matches: [CHOICE] }))).toBe(
            'Check the box to go on.'
        );
        const set = { matches: (selector: string) => selector === '.dk-choice-field' };
        expect(
            KIT_WORDS.valueMissing(field({ type: 'radio', matches: [CHOICE], fieldset: set }))
        ).toBe('Choose an option.');
    });

    it('ask for an email address, a full web address or the format a field takes', () => {
        expect(KIT_WORDS.typeMismatch(field({ type: 'email' }))).toBe(
            'Enter an email address like name@example.com here.'
        );
        expect(KIT_WORDS.typeMismatch(field({ type: 'url' }))).toBe(
            'Enter the full web address, with https:// at the start.'
        );
        expect(KIT_WORDS.patternMismatch(field())).toBe('Enter it in the right format.');
    });

    it('point to the hint where a field is described by one', () => {
        const hint = { matches: (selector: string) => selector === '.dk-field-hint' };
        const root = { getElementById: (id: string) => (id === 'code-hint' ? hint : null) };
        vi.stubGlobal('document', { documentElement: { lang: 'en-US' }, ...root });
        const code = field({ attributes: { 'aria-describedby': 'other code-hint' } });
        expect(KIT_WORDS.patternMismatch(code)).toBe('Enter it in the format the hint shows.');
    });

    it('give the length a field takes', () => {
        const name = field({ attributes: { minlength: '2', maxlength: '40' } });
        expect(KIT_WORDS.tooShort(name)).toBe('Enter at least 2 characters.');
        expect(KIT_WORDS.tooLong(name)).toBe('Enter 40 characters or fewer.');
    });

    it("give a field's steps, counted from its least", () => {
        const step = (type: string, attributes: Record<string, string> = {}) =>
            KIT_WORDS.stepMismatch(field({ type, attributes }));
        expect(step('number')).toBe('Enter a whole number.');
        expect(step('number', { min: '3' })).toBe('Enter a whole number.');
        expect(step('number', { step: '5' })).toBe('Enter a multiple of 5.');
        expect(step('number', { min: '0', step: '0.5' })).toBe('Enter a multiple of 0.5.');
        expect(step('number', { min: '1', step: '5' })).toBe('Enter 1, or 1 plus a multiple of 5.');
        expect(step('number', { min: '0.5' })).toBe('Enter 0.5, or 0.5 plus a multiple of 1.');
        expect(step('time')).toBe('Enter a time on one of the steps allowed.');
        expect(step('datetime-local')).toBe('Enter a date and time on one of the steps allowed.');
        expect(step('month')).toBe('Enter a date on one of the steps allowed.');
    });

    it("give a custom error the field's own message", () => {
        expect(KIT_WORDS.customError(field({ validationMessage: 'Taken.' }))).toBe('Taken.');
    });

    it('give a limit in words through the same words as a range failure', () => {
        const day = field({ type: 'date', attributes: { min: '2026-11-22', max: '2026-12-24' } });
        expect(KIT_WORDS.rangeUnderflow(day)).toBe('Enter November 22, 2026 or later.');
        expect(KIT_WORDS.rangeOverflow(day)).toBe('Enter December 24, 2026 or earlier.');
    });
});
