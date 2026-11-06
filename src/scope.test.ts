import { readdirSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/*
 * The kit loads beside a demo's own styles, so what it styles is held to what it means to. A sheet
 * styles the kit's own classes, and otherwise only inside one :where(), the root and the elements
 * every page shares among them, so a demo's rule on one of those elements wins over the kit's.
 */

const folder = new URL('./', import.meta.url);
const sheets = readdirSync(folder).filter((name) => name.endsWith('.css'));

/** Each rule's selector list, from a sheet with its comments and at-rule headers left out. */
const selectorsOf = (css: string): string[] =>
    [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g)]
        .map(([, selector = '']) => selector.replace(/\s+/g, ' ').trim())
        .filter((selector) => !selector.startsWith('@'));

/** A selector list's selectors, split at the commas outside any parentheses. */
const split = (list: string): string[] => {
    const parts = [''];
    let depth = 0;
    for (const character of list) {
        if (character === '(') depth += 1;
        if (character === ')') depth -= 1;
        if (character === ',' && depth === 0) parts.push('');
        else parts[parts.length - 1] += character;
    }
    return parts.map((part) => part.trim());
};

/** Where the parenthesis opened at the index given closes, or -1 when it never does. */
const closing = (text: string, open: number): number => {
    let depth = 0;
    for (let at = open; at < text.length; at += 1) {
        if (text[at] === '(') depth += 1;
        if (text[at] === ')') depth -= 1;
        if (depth === 0) return at;
    }
    return -1;
};

/**
 * What a selector may be: the kit's own class alone, or one :where() around anything, followed by
 * nothing but plain pseudo-classes, so nothing outside it adds weight.
 */
const scoped = (selector: string): boolean => {
    if (/^\.dk-[\w-]+$/.test(selector)) return true;
    if (!selector.startsWith(':where(')) return false;
    const end = closing(selector, ':where'.length);
    return end > 0 && /^(?::[\w-]+)*$/.test(selector.slice(end + 1));
};

describe('what the sheets style', () => {
    it('finds the sheets', () => {
        expect(sheets).toEqual(expect.arrayContaining(['tokens.css', 'base.css']));
    });

    for (const name of sheets) {
        it(`styles in ${name} only its own classes and what it wraps in :where()`, () => {
            const css = readFileSync(new URL(name, folder), 'utf8');
            expect(
                selectorsOf(css)
                    .flatMap(split)
                    .filter((selector) => !scoped(selector))
            ).toEqual([]);
        });
    }

    it('tells a selector that adds weight from one that does not', () => {
        expect(
            [
                '.dk-visually-hidden',
                ':where(a[href], [tabindex]:not([tabindex="-1"])):focus-visible',
                ':where(:root[data-theme="dark"])',
                '.dk-card p',
                ':root',
                'body',
                ':where(a) h1:where(b)',
                ':where(a',
            ].filter(scoped)
        ).toEqual([
            '.dk-visually-hidden',
            ':where(a[href], [tabindex]:not([tabindex="-1"])):focus-visible',
            ':where(:root[data-theme="dark"])',
        ]);
    });

    it('declares custom properties only in the tokens', () => {
        const elsewhere = sheets
            .filter((name) => name !== 'tokens.css')
            .filter((name) => /--[\w-]+\s*:/.test(readFileSync(new URL(name, folder), 'utf8')));
        expect(elsewhere).toEqual([]);
    });
});
