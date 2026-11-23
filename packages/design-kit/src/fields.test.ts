import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { withoutComments } from '../examples/palette.js';

/*
 * A row of fields sizes each field by a length, never by its content, as record 25 has it. A rule
 * for what a row of fields holds may set only how a field flexes, never from a basis its content
 * sets, and never reaches inside a field, since a rule on a field's own parts would be content
 * reaching a width again, which the rules of a field, a stepper and a choice field already own.
 */

/** Each rule in a sheet whose selector names what a row of fields holds, with its declarations. */
const rowRulesOf = (css: string): { selector: string; declarations: string[] }[] =>
    [...withoutComments(css).matchAll(/([^{};]+)\{([^{}]*)\}/g)]
        .map(([, selector = '', body = '']) => ({
            selector: selector.replace(/\s+/g, ' ').trim(),
            declarations: body
                .split(';')
                .map((declaration) => declaration.replace(/\s+/g, ' ').trim())
                .filter(Boolean),
        }))
        .filter(({ selector }) => /\.dk-fields\s*>/.test(selector));

/** A selector list with every parenthesized part taken out, so only its own combinators are left. */
const flattened = (selector: string): string => {
    let text = selector.replace(/^:where\(([\s\S]*)\)$/, '$1');
    for (let before = ''; before !== text;) {
        before = text;
        text = text.replace(/\([^()]*\)/g, '');
    }
    return text;
};

/** What is wrong with a rule for what a row of fields holds, or nothing. */
const faultsOf = (rule: { selector: string; declarations: string[] }): string[] => {
    const faults: string[] = [];
    for (const declaration of rule.declarations) {
        const [name = '', value = ''] = declaration.split(/:(.*)/s).map((part) => part.trim());
        if (!['flex', 'flex-basis', 'flex-grow', 'flex-shrink'].includes(name))
            faults.push(`sets ${name}, not how a field flexes`);
        const basis =
            name === 'flex-basis' ? value : name === 'flex' ? (value.split(/\s+/)[2] ?? value) : '';
        if (/^(auto|content|none)$/.test(basis) || (name === 'flex' && /^(auto|none)$/.test(value)))
            faults.push(`takes its basis from its content, by ${declaration}`);
    }
    for (const part of flattened(rule.selector).split(',')) {
        const after = part.split(/\.dk-fields\s*>/)[1];
        if (after !== undefined && /[\s>+~]/.test(after.trim()))
            faults.push(`reaches inside a field, by ${part.trim()}`);
    }
    return faults;
};

const SHEET = readFileSync(new URL('./components.css', import.meta.url), 'utf8');

describe('a row of fields', () => {
    it('sizes each field by a length, never by its content, and never reaches inside one', () => {
        const rules = rowRulesOf(SHEET);
        // The row's rules are there to read, so the check cannot pass on a sheet with none.
        expect(rules.length).toBeGreaterThan(0);
        expect(
            rules.flatMap((rule) => faultsOf(rule).map((fault) => `${rule.selector} ${fault}`))
        ).toEqual([]);
    });

    it('finds a basis from content, a declaration of another kind and a rule inside a field', () => {
        const css = `
            :where(.dk-fields > .dk-field:has(> .dk-stepper)) { flex: 0 1 auto; }
            :where(.dk-fields > .dk-field) { flex-basis: content; }
            :where(.dk-fields > .dk-field > :not(.dk-stepper)) { contain: inline-size; }
            :where(.dk-fields > .dk-field .dk-stepper) { flex: 1; }
        `;
        expect(rowRulesOf(css).map((rule) => faultsOf(rule).length)).toEqual([1, 1, 2, 1]);
    });

    it('passes a basis of a length and a basis of the whole line', () => {
        const css = `
            :where(.dk-fields > .dk-field) { flex: 1 1 var(--dk-fields-least, 10rem); }
            :where(.dk-fields > :is(.dk-stepper-inline, .dk-choice-field)) { flex-basis: 100%; }
        `;
        expect(rowRulesOf(css).flatMap(faultsOf)).toEqual([]);
    });
});
