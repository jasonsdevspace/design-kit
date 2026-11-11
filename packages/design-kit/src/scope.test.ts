import { readdirSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/*
 * The kit loads beside a demo's own styles, so what it styles is held to what it means to. Every
 * rule sits in one of the kit's layers, so a page's own rule outside a layer wins over the kit's,
 * and a page that names its layers sets where the kit's go among them. Inside its layers, a sheet
 * styles the kit's own classes, and otherwise only inside one :where() followed at most by a focus
 * pseudo-class. The base alone may follow its :where() with a pseudo-element instead, since a
 * pseudo-element inside a :where() matches nothing, and a rule meant for every element has to reach
 * it too. The components may follow theirs with a number field's own spin buttons, the one part of
 * a browser's control a component has to take away and only a pseudo-element reaches. So only those
 * classes, the focus rules and those pseudo-elements carry any weight, and none of it counts
 * against a page's own rule outside a layer.
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

/**
 * Each rule's selector list, from a sheet with its comments, statements and at-rules left out, and
 * an animation's frames, whose from and to name points in time rather than anything on the page.
 */
const selectorsOf = (css: string): string[] =>
    [
        ...withoutComments(css)
            .replace(/@[\w-]+[^{};]*;/g, '')
            .replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '')
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
 * What a selector may be: the kit's own class alone, or one :where() around anything but a
 * pseudo-element, followed by at most a focus pseudo-class, so nothing outside it but the focus
 * adds weight. A sheet whose rules have to reach every part of a page, the base alone, may follow
 * the :where() with a pseudo-element instead. A quoted string is read as empty first, so a ::
 * inside one is text.
 */
/** The parts of a browser's own control a component may reach, a number field's spin buttons. */
const CONTROL_PARTS = ['::-webkit-inner-spin-button', '::-webkit-outer-spin-button'];

const scoped = (
    selector: string,
    {
        pseudo = false,
        parts = [],
    }: { readonly pseudo?: boolean; readonly parts?: readonly string[] } = {}
): boolean => {
    if (/^\.dk-[\w-]+$/.test(selector)) return true;
    if (!selector.startsWith(':where(')) return false;
    const end = closing(selector, ':where'.length);
    if (
        end < 0 ||
        selector
            .slice(0, end)
            .replace(/"[^"]*"|'[^']*'/g, "''")
            .includes('::')
    )
        return false;
    const focus = '(?::focus(?:-visible|-within)?)';
    const after = pseudo ? `(?:${focus}|::[\\w-]+(?:\\([^)]*\\))?)` : focus;
    const rest = selector.slice(end + 1);
    return parts.includes(rest) || new RegExp(`^${after}?$`).test(rest);
};

describe('what the sheets style', () => {
    it('finds the sheets', () => {
        expect(sheets).toEqual(
            expect.arrayContaining(['tokens.css', 'base.css', 'components.css'])
        );
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

    it("passes over an animation's frames, and reads the rules after them", () => {
        expect(
            selectorsOf(
                '@keyframes rise { from { opacity: 0; } to { opacity: 1; } } .dk-a { b: c; }'
            )
        ).toEqual(['.dk-a']);
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
                    .filter(
                        (selector) =>
                            !scoped(selector, {
                                pseudo: layerOf(name) === 'dk.base',
                                parts: layerOf(name) === 'dk.components' ? CONTROL_PARTS : [],
                            })
                    )
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
                ':where(a):hover',
            ].filter((selector) => scoped(selector))
        ).toEqual([
            '.dk-visually-hidden',
            ':where(a[href], [tabindex]:not([tabindex="-1"])):focus-visible',
            ':where(:root[data-theme="dark"])',
        ]);
    });

    it('refuses a pseudo-element inside a :where(), which would match nothing', () => {
        const candidates = [
            ':where(*, *::before)',
            ':where(*)::before',
            ':where(*)::backdrop',
            ':where(:root)::view-transition-group(*)',
            ':where(*)::before:hover',
        ];
        expect(candidates.filter((selector) => scoped(selector, { pseudo: true }))).toEqual([
            ':where(*)::before',
            ':where(*)::backdrop',
            ':where(:root)::view-transition-group(*)',
        ]);
        // A component styles no pseudo-element, so its arrows and marks are elements of their own,
        // but a number field's spin buttons, which only a pseudo-element reaches.
        expect(candidates.filter((selector) => scoped(selector))).toEqual([]);
        expect(
            [
                ':where(.dk-stepper-value)::-webkit-inner-spin-button',
                ':where(.dk-stepper-value)::-webkit-outer-spin-button',
                ':where(.dk-stepper-value)::before',
                ':where(.dk-stepper-value)::-webkit-inner-spin-button:hover',
            ].filter((selector) => scoped(selector, { parts: CONTROL_PARTS }))
        ).toEqual([
            ':where(.dk-stepper-value)::-webkit-inner-spin-button',
            ':where(.dk-stepper-value)::-webkit-outer-spin-button',
        ]);
        // A :: inside a quoted value is text, not a pseudo-element.
        expect(scoped(':where([data-sep="::"])')).toBe(true);
    });

    it('draws every rule past the page chrome in a :where(), so the sheet order decides', () => {
        // A resting look written as a bare class would outweigh every state written in :where()
        // after it, so pressed, invalid and off would never show, and a bare layout class would
        // outweigh the pieces set inside it. Only the page chrome, which has no state but focus,
        // styles a bare class of its own.
        const chrome = [
            '.dk-skip',
            '.dk-strip',
            '.dk-strip-links',
            '.dk-strip-tools',
            '.dk-strip-room',
            '.dk-footer',
            '.dk-footer-aside',
        ];
        const css = readFileSync(new URL('components.css', folder), 'utf8');
        expect(
            selectorsOf(css)
                .flatMap(split)
                .filter((selector) => selector.startsWith('.') && !chrome.includes(selector))
        ).toEqual([]);
    });

    it('declares custom properties only in the tokens', () => {
        const elsewhere = sheets
            .filter((name) => name !== 'tokens.css')
            .filter((name) => /--[\w-]+\s*:/.test(readFileSync(new URL(name, folder), 'utf8')));
        expect(elsewhere).toEqual([]);
    });
});
