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

/** Each rule in a sheet that names a row of fields, with its declarations. */
const rulesNamingTheRow = (css: string): Rule[] =>
    [...withoutComments(css).matchAll(/([^{};]+)\{([^{}]*)\}/g)]
        .map(([, selector = '', body = '']) => ({
            selector: selector.replace(/\s+/g, ' ').trim(),
            declarations: body
                .split(';')
                .map((declaration) => declaration.replace(/\s+/g, ' ').trim())
                .filter(Boolean),
        }))
        .filter(({ selector }) => /\.dk-fields(?![\w-])/.test(selector));

/** The text from the start given to the end of the selector it sits in, at its own depth. */
const toItsEnd = (text: string): string => {
    let depth = 0;
    for (let at = 0; at < text.length; at += 1) {
        const character = text[at];
        if (character === '(') depth += 1;
        if (character === ')') {
            if (depth === 0) return text.slice(0, at);
            depth -= 1;
        }
        if (character === ',' && depth === 0) return text.slice(0, at);
    }
    return text;
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

/** Each place a selector names the row with something after it, as what follows it to its end. */
const afterTheRow = (selector: string): string[] =>
    [...selector.matchAll(/\.dk-fields(?![\w-])/g)]
        .map((match) => toItsEnd(selector.slice(match.index + '.dk-fields'.length)))
        .filter((after) => after.trim() !== '');

/** A flex shorthand's values, split on the spaces outside a function's parentheses. */
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

/** What is wrong with where a rule reaches, for each place it names the row with more after it. */
const reachOf = (afters: readonly string[]): string[] =>
    afters.flatMap((after) => {
        const child = /^\s*>\s*(.*)$/s.exec(after)?.[1];
        return child === undefined || /[\s>+~]/.test(flattened(child).trim())
            ? [`reaches past what the row holds, by .dk-fields${after}`]
            : [];
    });

/** What is wrong with a declaration in a rule for what the row holds, or nothing. */
const declarationFaultsOf = (declaration: string): string[] => {
    const [name = '', value = ''] = declaration.split(/:(.*)/s).map((part) => part.trim());
    if (!['flex', 'flex-basis', 'flex-grow', 'flex-shrink'].includes(name))
        return [`sets ${name}, not how a field flexes`];
    const basis =
        name === 'flex-basis'
            ? value
            : name === 'flex'
              ? /^(none|auto|initial)$/.test(value)
                  ? 'auto'
                  : valuesOf(value).find((part) => !/^[\d.]+$/.test(part))
              : undefined;
    return basis !== undefined && FROM_CONTENT.test(basis)
        ? [`takes its basis from its content, by ${declaration}`]
        : [];
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
            `)
        ).toEqual([]);
    });
});
