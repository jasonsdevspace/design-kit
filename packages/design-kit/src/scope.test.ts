import { readdirSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/*
 * The kit loads beside a demo's own styles, so what it styles is held to what it means to. Every
 * rule sits in one of the kit's layers, so a page's own rule outside a layer wins over the kit's,
 * and a page that names its layers sets where the kit's go among them. Inside its layers, a sheet
 * styles the kit's own classes, and otherwise only inside one :where() followed at most by a plain
 * pseudo-class, so only those classes and pseudo-classes carry any weight.
 */

/** The kit's layers, in the order the tokens declare them. Each sheet fills the one it names. */
const LAYERS = ['dk.tokens', 'dk.base', 'dk.components'];
const layerOf = (sheet: string) => `dk.${sheet.replace(/\.css$/, '')}`;
const ORDER = `@layer ${LAYERS.join(', ')};`;

const withoutComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * What a sheet holds at its top level: each statement, and each block's header. A quoted string is
 * read as empty first, so a brace or a semicolon inside one is text, not structure.
 */
const topLevel = (css: string): string[] => {
    const found: string[] = [];
    let depth = 0;
    let text = '';
    for (const character of withoutComments(css).replace(/"[^"]*"|'[^']*'/g, "''")) {
        if (depth === 0 && (character === '{' || character === ';')) {
            found.push(`${text.replace(/\s+/g, ' ').trim()}${character === ';' ? ';' : ''}`);
            text = '';
        } else if (depth === 0) text += character;
        if (character === '{') depth += 1;
        if (character === '}') depth -= 1;
    }
    return found;
};

const folder = new URL('./', import.meta.url);
const sheets = readdirSync(folder).filter((name) => name.endsWith('.css'));

/** Each rule's selector list, from a sheet with its comments, statements and at-rules left out. */
const selectorsOf = (css: string): string[] =>
    [
        ...withoutComments(css)
            .replace(/@[\w-]+[^{};]*;/g, '')
            .matchAll(/([^{}]+)\{/g),
    ]
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

    it("declares the order of the kit's layers before any rule, in the tokens alone", () => {
        const tokens = readFileSync(new URL('tokens.css', folder), 'utf8');
        expect(topLevel(tokens)[0]).toBe(ORDER);
        // Any other statement at a sheet's top level, a layer order or an import, would bring in
        // rules or an order the kit does not mean.
        const statements = sheets.flatMap((name) =>
            topLevel(readFileSync(new URL(name, folder), 'utf8'))
                .filter((part) => part.endsWith(';'))
                .map((part) => `${name}: ${part}`)
        );
        expect(statements).toEqual([`tokens.css: ${ORDER}`]);
    });

    it('reads a brace or a semicolon inside a quoted string as text', () => {
        expect(
            topLevel('@layer dk.base { a::after { content: \'}\' } } b { content: ";" }')
        ).toEqual(['@layer dk.base', 'b']);
    });

    for (const name of sheets) {
        it(`puts every rule in ${name} in its own layer of the kit's`, () => {
            expect(LAYERS).toContain(layerOf(name));
            const css = readFileSync(new URL(name, folder), 'utf8');
            const blocks = topLevel(css).filter((part) => !part.endsWith(';'));
            expect(blocks.length).toBeGreaterThan(0);
            expect(blocks.filter((header) => header !== `@layer ${layerOf(name)}`)).toEqual([]);
        });

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
