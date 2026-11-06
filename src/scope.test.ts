import { readdirSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/*
 * The kit loads beside a demo's own styles, so what it styles is held to what it means to. A sheet
 * styles the root, the kit's own classes, and in base.css the few elements every page shares, and
 * those only inside :where(), so a demo's own rule always wins over the kit's.
 */

const folder = new URL('./', import.meta.url);
const sheets = readdirSync(folder).filter((name) => name.endsWith('.css'));

/** Each rule's selector list, from a sheet with its comments and at-rule headers left out. */
const selectorsOf = (css: string): string[] =>
    [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{/g)]
        .map(([, selector = '']) => selector.trim())
        .filter((selector) => !selector.startsWith('@'));

/** What a selector may be: the root, the kit's own class, or a :where() around anything. */
const scoped = (selector: string) =>
    /^:root(?:\[data-theme='(?:light|dark)'\])?$/.test(selector) ||
    /^\.dk-[\w-]+/.test(selector) ||
    /^:where\(.*\)(?::[\w-]+(?:\(.*\))?)*$/.test(selector);

describe('what the sheets style', () => {
    it('finds the sheets', () => {
        expect(sheets).toEqual(expect.arrayContaining(['tokens.css', 'base.css']));
    });

    for (const name of sheets) {
        it(`styles in ${name} only the root, its own classes and what it wraps in :where()`, () => {
            const css = readFileSync(new URL(name, folder), 'utf8');
            const loose = selectorsOf(css)
                .flatMap((list) => list.split(/,(?![^(]*\))/).map((part) => part.trim()))
                .filter((selector) => !scoped(selector));
            expect(loose).toEqual([]);
        });
    }

    it('declares custom properties only in the tokens', () => {
        const elsewhere = sheets
            .filter((name) => name !== 'tokens.css')
            .filter((name) => /--[\w-]+\s*:/.test(readFileSync(new URL(name, folder), 'utf8')));
        expect(elsewhere).toEqual([]);
    });
});
