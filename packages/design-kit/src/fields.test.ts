import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { withoutComments } from '../examples/palette.js';

/*
 * A row of fields sizes each field by a length, never by its content, as record 25 has it. A rule
 * that names the row with anything after it may only be a rule for what the row holds directly,
 * and may set only how a field flexes, never from a basis its content sets. It never reaches
 * inside a field, since a rule on a field's own parts would be content reaching a width again,
 * which the rules of a field, a stepper and a choice field already own. A rule that names the row
 * as what it styles, as the measure and a plain form's spacing do, is the row's own.
 */

type Rule = { readonly selector: string; readonly declarations: readonly string[] };

/** Where the block that opens at the place given closes, or the text's end where it never does. */
const closeOf = (css: string, open: number): number => {
    let depth = 0;
    for (let at = open; at < css.length; at += 1) {
        if (css[at] === '{') depth += 1;
        if (css[at] === '}') {
            depth -= 1;
            if (depth === 0) return at;
        }
    }
    return css.length;
};

/**
 * A nested rule's selector as it reads with its parent's written out: each `&` as the parent in an
 * `:is()`, and a selector with none as what the parent holds, as the browser reads it.
 */
const nestedIn = (parent: string | null, selector: string): string => {
    if (parent === null) return selector;
    const within = `:is(${parent})`;
    return selector.includes('&') ? selector.replaceAll('&', within) : `${within} ${selector}`;
};

/**
 * Every rule in a sheet with its declarations, a rule nested in another read with its parent's
 * selector written out, and a block of an at-rule, such as a layer or a media query, read as the
 * rule around it, so a rule for the row cannot hide inside another.
 */
const rulesIn = (css: string, parent: string | null = null): Rule[] => {
    const rules: Rule[] = [];
    const declarations: string[] = [];
    let from = 0;
    for (let at = 0; at < css.length; at += 1) {
        const character = css[at];
        if (character === ';') {
            declarations.push(css.slice(from, at));
            from = at + 1;
        }
        if (character !== '{') continue;
        const prelude = css.slice(from, at).replace(/\s+/g, ' ').trim();
        const close = closeOf(css, at);
        const selector = prelude.startsWith('@') ? parent : nestedIn(parent, prelude);
        rules.push(...rulesIn(css.slice(at + 1, close), selector));
        at = close;
        from = close + 1;
    }
    declarations.push(css.slice(from));
    const own = declarations.map((one) => one.replace(/\s+/g, ' ').trim()).filter(Boolean);
    return parent !== null && own.length > 0
        ? [{ selector: parent, declarations: own }, ...rules]
        : rules;
};

/** Each rule in a sheet that names a row of fields, with its declarations. */
const rulesNamingTheRow = (css: string): Rule[] =>
    rulesIn(withoutComments(css)).filter(({ selector }) => /\.dk-fields(?![\w-])/.test(selector));

/** The name of the function each parenthesis open at the place given belongs to, outermost first. */
const aroundIt = (selector: string, place: number): string[] => {
    const around: string[] = [];
    for (let at = 0; at < place; at += 1) {
        if (selector[at] === '(')
            around.push(/:?([\w-]*)$/.exec(selector.slice(0, at))?.[1]?.toLowerCase() ?? '');
        if (selector[at] === ')') around.pop();
    }
    return around;
};

/** How far a text runs before one of the characters given, outside any parentheses of its own. */
const endAt = (text: string, stops: string): number => {
    let depth = 0;
    for (let at = 0; at < text.length; at += 1) {
        const character = text[at] ?? '';
        if (depth === 0 && stops.includes(character)) return at;
        if (character === '(') depth += 1;
        if (character === ')') depth -= 1;
    }
    return text.length;
};

/**
 * What follows the row from the place given, to the end of the selector it is part of. A list the
 * row is named in, as `:is()`, `:where()` and `:has()` hold one, ends at its own parenthesis and
 * the selector goes on after it, so the row in `:is(.dk-fields) .dk-stepper` is followed by the
 * stepper, and the list's other choices are no part of it. A `:not()` ends it, since what follows
 * names what is not a row.
 */
const toItsEnd = (selector: string, place: number): string => {
    let after = '';
    let rest = selector.slice(place);
    for (const list of [...aroundIt(selector, place).reverse(), null]) {
        const choice = endAt(rest, ',)');
        after += rest.slice(0, choice);
        if (list === null || list === 'not') break;
        rest = rest.slice(choice + endAt(rest.slice(choice), ')') + 1);
    }
    return after;
};

/** A selector with every parenthesized part taken out, so only its own combinators remain. */
const flattened = (selector: string): string => {
    let text = selector;
    for (let before = ''; before !== text;) {
        before = text;
        text = text.replace(/\([^()]*\)/g, '');
    }
    return text;
};

/**
 * Each place a selector names the row and goes on into it, as what follows the row to its end.
 * What follows with no combinator, or with a sibling's first, styles the row itself or what stands
 * beside it, as a plain form's spacing does, and is not a rule for what the row holds.
 */
const afterTheRow = (selector: string): string[] =>
    [...selector.matchAll(/\.dk-fields(?![\w-])/g)]
        .map((match) => toItsEnd(selector, match.index + '.dk-fields'.length))
        .filter((after) => /^[^\s>+~]*(?:\s*>|\s+[^\s>+~])/.test(flattened(after)));

/** A value's parts, split on the spaces outside a function's parentheses. */
const valuesOf = (value: string): string[] => {
    const values: string[] = [];
    let depth = 0;
    let current = '';
    for (const character of value) {
        if (character === '(') depth += 1;
        if (character === ')') depth -= 1;
        if (character === ' ' && depth === 0) {
            if (current) values.push(current);
            current = '';
        } else current += character;
    }
    if (current) values.push(current);
    return values;
};

/** A basis a field's content sets, by its keyword or by a function of one. */
const FROM_CONTENT = /^(auto|content|max-content|min-content|fit-content|initial)$|^fit-content\(/;

/**
 * Whether a part of a value is a basis a field's content sets: a keyword for one in any case, or a
 * `var()` that falls back to one, or that has no fallback, since a property left unset then makes
 * the declaration invalid and the basis the initial one, `auto`.
 */
const fromContent = (part: string): boolean => {
    const written = part.trim().toLowerCase();
    if (FROM_CONTENT.test(written)) return true;
    const inside = /^var\((.*)\)$/s.exec(written)?.[1];
    if (inside === undefined) return false;
    const comma = inside.indexOf(',');
    return comma < 0 || valuesOf(inside.slice(comma + 1).trim()).some(fromContent);
};

/** What is wrong with where a rule reaches, for each place it names the row with more after it. */
const reachOf = (afters: readonly string[]): string[] =>
    afters.flatMap((after) => {
        const child = /^[^\s>+~]*\s*>\s*(.*)$/s.exec(flattened(after))?.[1];
        return child === undefined || /[\s>+~]/.test(child.trim())
            ? [`reaches past what the row holds, by .dk-fields${after}`]
            : [];
    });

/** What is wrong with a declaration in a rule for what the row holds, or nothing. */
const declarationFaultsOf = (declaration: string): string[] => {
    const [property = '', written = ''] = declaration.split(/:(.*)/s).map((part) => part.trim());
    const name = property.toLowerCase();
    if (!['flex', 'flex-basis', 'flex-grow', 'flex-shrink'].includes(name))
        return [`sets ${name}, not how a field flexes`];
    // What `!important` adds changes whose rule wins, never what the basis is.
    const value = written.replace(/\s*!\s*important$/i, '');
    const fromItsContent =
        name === 'flex-basis'
            ? fromContent(value)
            : name === 'flex' &&
              (/^(none|auto|initial)$/i.test(value) || valuesOf(value).some(fromContent));
    return fromItsContent ? [`takes its basis from its content, by ${declaration}`] : [];
};

/** What is wrong with a rule that names the row with something after it, or nothing. */
const faultsOf = (rule: Rule): string[] => {
    const afters = afterTheRow(rule.selector);
    // A rule that names the row only as what it styles is the row's own.
    if (afters.length === 0) return [];
    return [...reachOf(afters), ...rule.declarations.flatMap(declarationFaultsOf)];
};

/** Every fault the rules of a sheet that name the row hold, each with its selector. */
const faultsIn = (css: string): string[] =>
    rulesNamingTheRow(css).flatMap((rule) =>
        faultsOf(rule).map((fault) => `${rule.selector} ${fault}`)
    );

const SHEET = readFileSync(new URL('./components.css', import.meta.url), 'utf8');

describe('a row of fields', () => {
    it('sizes each field by a length, never by its content, and never reaches inside one', () => {
        // The row's rules are there to read, so the check cannot pass on a sheet with none.
        expect(
            rulesNamingTheRow(SHEET).filter((rule) => afterTheRow(rule.selector).length)
        ).not.toEqual([]);
        expect(faultsIn(SHEET)).toEqual([]);
    });

    it('finds a basis its content sets, in the shorthand at any place and in flex-basis', () => {
        for (const declaration of [
            'flex: 0 1 auto',
            'flex: 0 auto',
            'flex: max-content 1',
            'flex: none',
            'flex: auto',
            'flex: initial',
            'flex-basis: content',
            'flex-basis: max-content',
            'flex-basis: min-content',
            'flex-basis: fit-content',
            'flex-basis: initial',
            // In capitals, with `!important`, and as what a `var()` falls back to or to nothing.
            'flex: 1 1 AUTO',
            'FLEX-BASIS: Max-Content',
            'flex-basis: auto !important',
            'flex: 0 1 auto !important',
            'flex: 1 1 var(--dk-fields-least, auto)',
            'flex: 1 1 var(--dk-fields-least, var(--dk-other, auto))',
            'flex-basis: var(--dk-fields-least, fit-content(10rem))',
            'flex-basis: var(--dk-fields-least)',
            'flex: 1 1 var(--dk-fields-least)',
            // Where a `var()` stands before it in the shorthand.
            'flex: var(--dk-grow, 1) 1 auto',
        ])
            expect(
                faultsIn(`:where(.dk-fields > .dk-field) { ${declaration}; }`),
                declaration
            ).toHaveLength(1);
    });

    it('finds a rule past what the row holds, or setting more than how a field flexes', () => {
        expect(faultsIn(':where(.dk-fields .dk-stepper) { min-width: 0; }')).toHaveLength(2);
        expect(
            faultsIn(':where(.dk-fields:not(.x) > .dk-field > .dk-input) { width: 1px; }')
        ).toHaveLength(2);
        expect(
            faultsIn(':where(.dk-fields > .dk-field > :not(.dk-stepper)) { contain: inline-size; }')
        ).toHaveLength(2);
        expect(faultsIn(':where(.dk-fields > .dk-field .dk-stepper) { flex: 1; }')).toHaveLength(1);
    });

    it('finds a rule past what the row holds where the row is named in a list', () => {
        expect(faultsIn(':where(:is(.dk-fields) .dk-stepper) { min-width: 0; }')).toHaveLength(2);
        expect(
            faultsIn(':where(:is(.dk-fields, .dk-x) > .dk-field > .dk-input) { width: 1px; }')
        ).toHaveLength(2);
        expect(
            faultsIn(':where(:is(.dk-x, .dk-fields > .dk-field) > .dk-input) { width: 1px; }')
        ).toHaveLength(2);
        expect(
            faultsIn(':where(.dk-page:has(.dk-fields) .dk-input) { min-width: 0; }')
        ).toHaveLength(2);
        expect(
            faultsIn(':where(.dk-page :where(:is(.dk-fields)) > .dk-field) { flex: none; }')
        ).toHaveLength(1);
    });

    it('finds a rule nested in the row, with its parent written out, in an at-rule too', () => {
        expect(
            faultsIn(':where(.dk-fields) { display: flex; & > .dk-field { flex: none; } }')
        ).toEqual([
            ':is(:where(.dk-fields)) > .dk-field takes its basis from its content, by flex: none',
        ]);
        expect(
            faultsIn(':where(.dk-fields) { gap: 1rem; .dk-stepper { min-width: 0 } }')
        ).toHaveLength(2);
        expect(
            faultsIn(
                '@layer dk.components { :where(.dk-fields > .dk-field) { @media (width < 24rem) { flex: 0 auto } } }'
            )
        ).toHaveLength(1);
        // The last declaration of a block, with no semicolon after it, is read as the others are.
        expect(
            faultsIn(':where(.dk-fields > .dk-field) { flex-grow: 1; flex-basis: auto }')
        ).toEqual([
            ':where(.dk-fields > .dk-field) takes its basis from its content, by flex-basis: auto',
        ]);
    });

    it("passes the row's own rules, a basis of a length or of the whole line, and the row named as what a rule styles", () => {
        expect(
            faultsIn(`
                :where(.dk-fields) { display: flex; gap: 1rem; }
                :where(.dk-fields > .dk-field) { flex: 1 1 var(--dk-fields-least, 10rem); }
                :where(.dk-fields > :is(.dk-stepper-inline, .dk-choice-field)) { flex-basis: 100%; }
                :where(:is(.dk-page, .dk-band) :is(.dk-field, .dk-fields, form .dk-callout):not(dialog *)) {
                    max-width: 34rem;
                }
                :where(form:not([class]) > :is(.dk-field, .dk-fields):not([hidden]) ~ :is(.dk-field, .dk-fields)) {
                    margin-block-start: 1rem;
                }
                :where(.dk-fields) { & > .dk-field { flex: 1 1 var(--dk-fields-least, 10rem); } }
                :where(.dk-fields > .dk-field) { flex: 1 1 10REM !important; }
                :where(.dk-fields > .dk-field) { flex: var(--dk-grow, 1) 1 var(--dk-fields-least, var(--dk-other, 10rem)); }
                :where(.dk-page :not(.dk-fields) > .dk-field) { flex: none; }
            `)
        ).toEqual([]);
    });
});
