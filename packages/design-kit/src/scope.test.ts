import { readdirSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { PAGE_PROPERTIES, withoutComments } from '../examples/palette.js';

/*
 * The kit loads beside a demo's own styles, so what it styles is held to what it means to. Every
 * rule sits in one of the kit's layers, so a page's own rule outside a layer wins over the kit's,
 * and a page that names its layers sets where the kit's go among them. Inside its layers, a sheet
 * styles the kit's own classes, and otherwise only inside one :where() followed at most by a focus
 * pseudo-class. The base alone may follow its :where() with a pseudo-element instead, since a
 * pseudo-element inside a :where() matches nothing, and a rule meant for every element has to reach
 * it too. The components may follow theirs with a number field's own spin buttons or a dialog's
 * backdrop, the parts of a browser's own element a component has to draw or take away and only a
 * pseudo-element reaches. So only those classes, the focus rules and those pseudo-elements carry
 * any weight, and none of it counts against a page's own rule outside a layer.
 */

/** The kit's layers, in the order the tokens declare them. Each sheet fills the one it names. */
const LAYERS = ['dk.tokens', 'dk.base', 'dk.components'];
const layerOf = (sheet: string) => `dk.${sheet.replace(/\.css$/, '')}`;
const ORDER = `@layer ${LAYERS.join(', ')};`;

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
 * The parts of a browser's own element a component may reach, a number field's spin buttons and a
 * dialog's backdrop.
 */
const CONTROL_PARTS = ['::-webkit-inner-spin-button', '::-webkit-outer-spin-button', '::backdrop'];

/**
 * What a selector may be: the kit's own class alone, or one :where() around anything but a
 * pseudo-element, followed by at most a focus pseudo-class, so nothing outside it but the focus
 * adds weight. A sheet whose rules have to reach every part of a page, the base alone, may follow
 * the :where() with a pseudo-element instead, and the components with one of the parts given, a
 * number field's spin buttons or a dialog's backdrop. A quoted string is read as empty first, so
 * a :: inside one is text.
 */

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
        // but a number field's spin buttons and a dialog's backdrop, which only a pseudo-element
        // reaches.
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

    it('lists every property a page may set in the reference, with its default and its duty', () => {
        // A property the sheets read with a fallback is one a page sets, so the table names each,
        // but for the grounds the kit's containers set, which a piece falls back from where none
        // holds it.
        const containers = new Set(['--dk-ground', '--dk-ground-step']);
        const fallbacks = new Map<string, string[]>();
        for (const name of sheets) {
            const css = withoutComments(readFileSync(new URL(name, folder), 'utf8'));
            for (const [, property = '', fallback = ''] of css.matchAll(
                /var\(\s*(--dk-[\w-]+)\s*,\s*([^)]*)\)/g
            )) {
                if (containers.has(property)) continue;
                fallbacks.set(property, [...(fallbacks.get(property) ?? []), fallback.trim()]);
            }
        }
        const reference = readFileSync(new URL('../REFERENCE.md', folder), 'utf8');
        const start = reference.indexOf('### Properties a page sets');
        const end = reference.indexOf('\n#', start + 1);
        const table = reference.slice(start, end === -1 ? undefined : end);
        const rows = new Map(
            [...table.matchAll(/^\| `(--dk-[\w-]+)` *\| *([^|]*?) *\| *([^|]*?) *\|$/gm)].map(
                ([, name = '', fallback = '', duty = '']) => [name, { fallback, duty }]
            )
        );
        expect(start).toBeGreaterThan(-1);
        expect([...fallbacks.keys()].filter((name) => !rows.has(name)).sort()).toEqual([]);
        expect([...rows.keys()].filter((name) => !fallbacks.has(name)).sort()).toEqual([]);
        // The kit's one list of them, which the tokens read from the sheet leave out, is the table.
        expect([...rows.keys()].sort()).toEqual([...PAGE_PROPERTIES].sort());
        for (const [name, row] of rows) {
            expect(row.fallback, name).not.toBe('');
            expect(row.duty, name).not.toBe('');
            // A default the table writes as a number is the fallback the sheets read.
            const number = /^\d[\w.]*/.exec(row.fallback)?.[0];
            if (number) expect(fallbacks.get(name), name).toContain(number);
        }
    });

    /** Every sheet without its comments, its runs of space as one, read once for the tests below. */
    const flat = sheets
        .map((name) => withoutComments(readFileSync(new URL(name, folder), 'utf8')))
        .join('\n')
        .replace(/\s+/g, ' ')
        .replace(/ ?, ?/g, ', ')
        .replace(/\( /g, '(')
        .replace(/ \)/g, ')');

    it("names the app's places in one form wherever a piece keeps a phone's size there", () => {
        // The base list, and the pieces that keep a phone's size there too.
        const places =
            '.dk-app, .dk-tabbar-page, :root:has(:is(.dk-app, .dk-tabbar-page):not(.dk-picture, .dk-picture *)) .dk-dialog';
        const added = new Set(['.dk-toast']);
        // Every list a piece names the places in, however many of them it kept, leaving out the
        // frames a page's own place is told by inside its :has().
        const lists = [...flat.matchAll(/(?<!has\():is\(((?:[^()]|\((?:[^()]|\([^()]*\))*\))*)\)/g)]
            .map(([, list = '']) => list.trim())
            .filter((list) => list.includes('.dk-tabbar-page'));
        expect(lists.length).toBeGreaterThan(0);
        const astray = lists.filter((list) => {
            if (!list.startsWith(places)) return true;
            const rest = list.slice(places.length);
            if (rest === '') return false;
            return (
                !rest.startsWith(',') ||
                !rest
                    .slice(1)
                    .split(',')
                    .every((piece) => added.has(piece.trim()))
            );
        });
        expect(astray).toEqual([]);
    });

    it("leaves a picture out wherever the sheets draw a page as an app's", () => {
        // Each condition on the root, and each the toast's room sets aside, read whole.
        const conditions = [...flat.matchAll(/:root:has\(|:not\(:has\(/g)].map(({ index }) => {
            const open = flat.indexOf('(', flat.indexOf('has(', index));
            let depth = 0;
            let end = open;
            for (; end < flat.length; end++) {
                if (flat[end] === '(') depth++;
                if (flat[end] === ')' && --depth === 0) break;
            }
            return flat.slice(open + 1, end);
        });
        const app = conditions.filter((held) =>
            /\.dk-app\b(?!-)|\.dk-tabbar-page|\.dk-toast\[data-shown/.test(held)
        );
        expect(app.length).toBeGreaterThan(0);
        // One compound each, so a list of frames can't leave one of them out of the exclusion.
        const topLevelComma = (held: string) => {
            let depth = 0;
            for (const sign of held) {
                if (sign === '(') depth++;
                if (sign === ')') depth--;
                if (sign === ',' && depth === 0) return true;
            }
            return false;
        };
        expect(app.filter(topLevelComma)).toEqual([]);
        expect(app.filter((held) => !held.endsWith(':not(.dk-picture, .dk-picture *)'))).toEqual(
            []
        );
    });

    it('reads each formula copied to change in step from its token', () => {
        // Each formula the tokens hold, in either order, left nowhere else in the sheets.
        const held = [
            ['var(--dk-space-4)', '16px'],
            ['var(--dk-space-5)', '24px'],
            ['var(--dk-field-inline)', '12px'],
        ];
        const copies = held.flatMap(([token = '', cap = '']) => {
            const written = [`min(${token}, ${cap})`, `min(${cap}, ${token})`]
                .map((formula) => flat.split(formula).length - 1)
                .reduce((sum, times) => sum + times, 0);
            // The token is the one place each formula is written.
            return written === 1 ? [] : [`min(${token}, ${cap}), written ${String(written)} times`];
        });
        expect(copies).toEqual([]);
    });

    it('asks a page for no style attribute, which the strict policy the kit draws under refuses', () => {
        const reference = readFileSync(new URL('../REFERENCE.md', folder), 'utf8');
        const readme = readFileSync(new URL('../README.md', folder), 'utf8');
        for (const [name, text] of Object.entries({ reference, readme })) {
            // Advice to write one, in the prose or in the markup a page copies.
            expect(
                text.match(/\bin\s+(?:its|the|a)\s+style\s+attribute\b|<[a-z][^>]*\sstyle="/gi),
                name
            ).toBeNull();
        }
    });

    it("names a property declared for a piece as the reference names it, or as the kit's own", () => {
        // The root rule holds the tokens. A rule for a piece declares a property the reference
        // names, a token it sets again or one a page sets, or a working value of the kit's own,
        // whose name starts with --_dk- so a page and the tokens page can tell it from a token.
        const tokens = withoutComments(readFileSync(new URL('tokens.css', folder), 'utf8'));
        const reference = readFileSync(new URL('../REFERENCE.md', folder), 'utf8');
        /** The names a part of the reference gives in code, from its heading to the end given. */
        const namedIn = (from: string, to: string): string[] => {
            const start = reference.indexOf(from);
            expect(start, from).toBeGreaterThan(-1);
            const part = reference.slice(start, reference.indexOf(to, start + from.length));
            return [...part.matchAll(/`(--dk-[\w-]+)`/g)].map(([, name = '']) => name);
        };
        // The reference's table of every token and its table of properties a page sets.
        const named = new Set([
            ...namedIn('<summary>Every token', '</details>'),
            ...namedIn('### Properties a page sets', '\n#'),
        ]);
        const unnamed = [...tokens.matchAll(/([^{};]*)\{([^{}]*)\}/g)]
            .filter(([, selector = '']) => !/^:where\(\s*:root\s*\)$/.test(selector.trim()))
            .flatMap(([, , body = '']) => [...body.matchAll(/(--[\w-]+)\s*:/g)])
            .map(([, name = '']) => name)
            .filter((name) => !name.startsWith('--_dk-') && !named.has(name));
        expect([...new Set(unnamed)]).toEqual([]);
        expect(reference.match(/--_dk-[\w-]+/g) ?? []).toEqual([]);
    });

    it('declares custom properties only in the tokens', () => {
        const elsewhere = sheets
            .filter((name) => name !== 'tokens.css')
            .filter((name) => /--[\w-]+\s*:/.test(readFileSync(new URL(name, folder), 'utf8')));
        expect(elsewhere).toEqual([]);
    });
});
