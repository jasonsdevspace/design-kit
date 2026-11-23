import { readdirSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { CONTAINER_GROUNDS, withoutComments } from '../examples/palette.js';

/*
 * The kit loads beside a demo's own styles, so what it styles is held to what it means to. Every
 * rule sits in one of the kit's layers, so a page's own rule outside a layer wins over the kit's,
 * and a page that names its layers sets where the kit's go among them. Inside its layers, a sheet
 * styles the kit's own classes, and otherwise only inside one :where() followed at most by a focus
 * pseudo-class. The base alone may follow its :where() with a pseudo-element instead, since a
 * pseudo-element inside a :where() matches nothing, and a rule meant for every element has to reach
 * it too. The components may follow theirs with a number field's own spin buttons, a dialog's
 * backdrop or a progress bar's track and fill, the parts of a browser's own element a component has
 * to draw or take away and only a pseudo-element reaches, and a busy button may follow its own with
 * ::after, where it draws the dots that show it at work. That mark holds no words and is placed
 * absolutely, which the tests below hold it to. So only those classes, the focus rules and those
 * pseudo-elements carry any weight, and none of it counts against a page's own rule outside a
 * layer.
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
 * The parts of a browser's own element a component may reach, a number field's spin buttons, a
 * dialog's backdrop and a progress bar's track and fill.
 */
const CONTROL_PARTS = [
    '::-webkit-inner-spin-button',
    '::-webkit-outer-spin-button',
    '::backdrop',
    '::-webkit-progress-bar',
    '::-webkit-progress-value',
    '::-moz-progress-bar',
];

/**
 * The pseudo-elements a component draws a mark of its state in, each with the one selector it is
 * drawn on, a busy button's dots of work alone.
 */
const DRAWN = [":where(.dk-button[data-busy]:is(:disabled, [aria-disabled='true']))::after"];

/** The rule for forced colors, the one place a drawn mark may set its colors alone. */
const FORCED = '@media (forced-colors: active)';

/**
 * Each rule in a sheet, with its selector list, its declarations and the at-rules it sits inside,
 * outermost first. A quoted string is read as empty, so `content: ''` reads as written.
 */
const rulesOf = (css: string) => {
    const found: { selector: string; body: string; within: string[] }[] = [];
    const open: string[] = [];
    let text = '';
    for (const character of withoutComments(css).replace(/"[^"]*"|'[^']*'/g, "''")) {
        if (character === '{') {
            open.push((text.split(';').pop() ?? '').replace(/\s+/g, ' ').trim());
            text = '';
        } else if (character === '}') {
            const head = open.pop() ?? '';
            const within = open.filter((at) => at.startsWith('@'));
            if (!head.startsWith('@') && !within.some((at) => at.startsWith('@keyframes')))
                found.push({ selector: head, body: text, within });
            text = '';
        } else text += character;
    }
    return found;
};

/** The properties a rule's declarations set, in order. */
const propertiesOf = (body: string): string[] =>
    body
        .split(';')
        .map((declaration) => declaration.split(':')[0]?.trim() ?? '')
        .filter(Boolean);

/**
 * What a selector may be: the kit's own class alone, or one :where() around anything but a
 * pseudo-element, followed by at most a focus pseudo-class, so nothing outside it but the focus
 * adds weight. A sheet whose rules have to reach every part of a page, the base alone, may follow
 * the :where() with a pseudo-element instead, and the components with one of the parts given, a
 * number field's spin buttons, a dialog's backdrop or a progress bar's track and fill. A quoted
 * string is read as empty first, so a :: inside one is text.
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
                            }) && !(layerOf(name) === 'dk.components' && DRAWN.includes(selector))
                    )
            ).toEqual([]);
        });
    }

    it('draws each mark it names in DRAWN, and nothing else there', () => {
        const rules = rulesOf(readFileSync(new URL('components.css', folder), 'utf8'));
        // The rules read a quoted string as empty, so the name is read the same way.
        const on = (drawn: string) =>
            rules.filter(({ selector }) =>
                split(selector).includes(drawn.replace(/"[^"]*"|'[^']*'/g, "''"))
            );
        expect(DRAWN.filter((drawn) => on(drawn).length === 0)).toEqual([]);
        for (const drawn of DRAWN) {
            for (const { body, within } of on(drawn)) {
                if (within.includes(FORCED)) {
                    // In forced colors the mark only keeps its colors, as the system's, and its wait.
                    expect(propertiesOf(body).sort()).toEqual([
                        'animation',
                        'color',
                        'forced-color-adjust',
                    ]);
                } else {
                    // A mark holds no words, so no name changes, and takes no place in the row.
                    const flat = body.replace(/\s+/g, ' ');
                    expect(flat).toContain("content: ''");
                    expect(flat).toContain('position: absolute');
                }
            }
        }
    });

    it('reads a rule inside forced colors apart from the same rule outside it', () => {
        expect(
            rulesOf(
                `.dk-a { content: ''; } ${FORCED} { .dk-a { color: GrayText; } } ` +
                    '@keyframes b { to { opacity: 0; } }'
            )
        ).toEqual([
            { selector: '.dk-a', body: " content: ''; ", within: [] },
            { selector: '.dk-a', body: ' color: GrayText; ', within: [FORCED] },
        ]);
    });

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
        // but a number field's spin buttons, a dialog's backdrop and a progress bar's track and
        // fill, which only a pseudo-element reaches, and a busy button's ::after, named in DRAWN.
        expect(candidates.filter((selector) => scoped(selector))).toEqual([]);
        expect(
            [
                ':where(.dk-stepper-value)::-webkit-inner-spin-button',
                ':where(.dk-stepper-value)::-webkit-outer-spin-button',
                ':where(.dk-stepper-value)::before',
                ':where(.dk-stepper-value)::-webkit-inner-spin-button:hover',
                ':where(.dk-progress)::-webkit-progress-bar',
                ':where(.dk-progress)::-webkit-progress-value',
                ':where(.dk-progress)::-moz-progress-bar',
                ':where(.dk-progress)::-webkit-progress-inner-element',
                ':where(.dk-progress)::-moz-range-track',
            ].filter((selector) => scoped(selector, { parts: CONTROL_PARTS }))
        ).toEqual([
            ':where(.dk-stepper-value)::-webkit-inner-spin-button',
            ':where(.dk-stepper-value)::-webkit-outer-spin-button',
            ':where(.dk-progress)::-webkit-progress-bar',
            ':where(.dk-progress)::-webkit-progress-value',
            ':where(.dk-progress)::-moz-progress-bar',
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
        const fallbacks = new Map<string, string[]>();
        for (const name of sheets) {
            const css = withoutComments(readFileSync(new URL(name, folder), 'utf8'));
            for (const [, property = '', fallback = ''] of css.matchAll(
                /var\(\s*(--dk-[\w-]+)\s*,\s*([^)]*)\)/g
            )) {
                if (CONTAINER_GROUNDS.has(property)) continue;
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
        // A live frame or page that ends in a tab bar, and a dialog beside one, as a sibling before
        // or after it, which no rule asks the root for.
        const live = ':is(.dk-app, .dk-tabbar-page):not(.dk-picture, .dk-picture *)';
        const beside = `${live} ~ .dk-dialog, .dk-dialog:has(~ ${live})`;
        // The base list, and the same with a picture of a frame left out, which the dialog's
        // actions are told by.
        const forms = [`.dk-app, .dk-tabbar-page, ${beside}`, `${live}, ${beside}`];
        // The pieces that keep a phone's size there too.
        const added = new Set(['.dk-toast']);
        // Every list a piece names the places in, however many of them it kept, read whole, so the
        // frames named inside one are not read as a list of their own.
        const lists: string[] = [];
        for (let at = flat.indexOf(':is('); at >= 0;) {
            const end = closing(flat, at + ':is'.length);
            const list = flat.slice(at + ':is('.length, end);
            const named = list.includes('.dk-tabbar-page');
            if (named) lists.push(list);
            at = flat.indexOf(':is(', named ? end : at + 1);
        }
        expect(lists.length).toBeGreaterThan(0);
        const astray = lists.filter((list) => {
            // The frames a rule on the root or the body is told by, and those a page's foot is.
            if (list === '.dk-app, .dk-tabbar-page') return false;
            const form = forms.find((held) => list.startsWith(held));
            if (form === undefined) return true;
            const rest = list.slice(form.length);
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
        // Each form is written somewhere, so a list that drifts from both fails above.
        expect(forms.filter((form) => !lists.some((list) => list.startsWith(form)))).toEqual([]);
    });

    /**
     * Each selector that writes a `:has()` on an element that holds the page, the root, the body,
     * an app's frame or a page that ends in a tab bar, where that element is not what the rule
     * draws. Chromium restyles everything inside such an element for every element or word the
     * page adds, as record 27 sets out. A picture of a frame, which is inert and holds a few
     * elements, may be told by what it holds.
     */
    const hasOnHolder = (css: string): string[] => {
        /** A selector's compounds, split at the combinators outside any parentheses. */
        const compoundsOf = (selector: string): string[] => {
            const parts = [''];
            let depth = 0;
            for (const sign of selector) {
                if (sign === '(') depth += 1;
                if (sign === ')') depth -= 1;
                if (depth === 0 && ' >+~'.includes(sign)) parts.push('');
                else parts[parts.length - 1] += sign;
            }
            return parts.filter(Boolean);
        };
        /** A compound's `:is()` and `:where()` lists, and the compound with them and what a `:has()` or `:not()` holds taken out. */
        const opened = (compound: string): { own: string; lists: string[]; names: string } => {
            const lists: string[] = [];
            let own = '';
            let names = '';
            for (let at = 0; at < compound.length;) {
                const group = /^:(is|where|has|not)\(/.exec(compound.slice(at));
                if (!group) {
                    own += compound[at];
                    names += compound[at];
                    at += 1;
                    continue;
                }
                const open = at + group[0].length - 1;
                const end = closing(compound, open);
                const held = compound.slice(open + 1, end);
                if (group[1] === 'is' || group[1] === 'where') {
                    lists.push(held);
                    names += ` ${held} `;
                } else {
                    own += `:${group[1] ?? ''}()`;
                    // A :not() that holds a :has() writes one on the compound as well.
                    if (group[1] === 'not' && held.includes(':has(')) own += ':has()';
                }
                at = end + 1;
            }
            return { own, lists, names };
        };
        const HOLDER =
            /(?:^|[\s,(])(?::root|html|body)(?![\w-])|\.dk-app(?![\w-])|\.dk-tabbar-page(?![\w-])/;
        const PICTURED = ':is(.dk-picture, .dk-picture *)';
        const astray = (selector: string, drawn: boolean): boolean => {
            const compounds = compoundsOf(selector);
            return compounds.some((compound, at) => {
                const subject = drawn && at === compounds.length - 1;
                const { own, lists, names } = opened(compound);
                if (
                    !subject &&
                    own.includes(':has()') &&
                    HOLDER.test(names) &&
                    !compound.includes(PICTURED)
                )
                    return true;
                return lists.some((list) => split(list).some((member) => astray(member, subject)));
            });
        };
        return rulesOf(css)
            .flatMap(({ selector }) => split(selector))
            .filter((selector) => astray(selector, true));
    };

    it('tells a :has() on an element that holds the page from one on the element a rule draws', () => {
        expect(
            hasOnHolder(`
                :where(:root:has(.a)) { color: red; }
                :where(:root:has(.a) > body) { color: red; }
                :where(body:has(.a):not(:has(.dk-app))) { color: red; }
                :where(body:not(:has(.a)) .b) { color: red; }
                :where(.dk-app:has(.a) > .dk-app-body) { color: red; }
                :where(.dk-app > .dk-app-toast:has(> .a)) { color: red; }
                :where(.dk-app-body:has(.a) > .b) { color: red; }
                :where(:is(.dk-app, :root:has(.a) .dk-dialog) .b) { color: red; }
                :where(:is(.dk-app, .dk-tabbar-page):has(.a) .b) { color: red; }
                :where(:is(.c, .dk-tabbar-page:has(.a))) { color: red; }
                :where(.dk-app:is(.dk-picture, .dk-picture *):has(.a) > .b) { color: red; }
                :where(.dk-dialog:has(~ .dk-app) .b, .dk-tabbar-page:has(.a) .b) { color: red; }
            `)
        ).toEqual([
            ':where(:root:has(.a) > body)',
            ':where(body:not(:has(.a)) .b)',
            ':where(.dk-app:has(.a) > .dk-app-body)',
            ':where(:is(.dk-app, :root:has(.a) .dk-dialog) .b)',
            ':where(:is(.dk-app, .dk-tabbar-page):has(.a) .b)',
            ':where(.dk-dialog:has(~ .dk-app) .b, .dk-tabbar-page:has(.a) .b)',
        ]);
    });

    it('writes a :has() on the root, the body, a frame or a page that ends in a tab bar only where the rule draws that element', () => {
        const astray = sheets.flatMap((name) =>
            hasOnHolder(readFileSync(new URL(name, folder), 'utf8')).map(
                (selector) => `${name}: ${selector}`
            )
        );
        expect(astray).toEqual([]);
    });

    it("leaves a picture out wherever the sheets draw a page as an app's", () => {
        // Each condition on the root or the body, and each the toast's room sets aside, read whole.
        const conditions = [...flat.matchAll(/:root:has\(|(?<![\w-])body:has\(|:not\(:has\(/g)].map(
            ({ index }) => {
                const open = flat.indexOf('(', flat.indexOf('has(', index));
                let depth = 0;
                let end = open;
                for (; end < flat.length; end++) {
                    if (flat[end] === '(') depth++;
                    if (flat[end] === ')' && --depth === 0) break;
                }
                return flat.slice(open + 1, end);
            }
        );
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

    /**
     * The compound a selector styles, the last one, past every combinator outside parentheses and
     * square brackets, so a `~=` inside an attribute selector is not read as a combinator.
     */
    const subjectOf = (selector: string): string => {
        let depth = 0;
        let start = 0;
        [...selector].forEach((sign, at) => {
            if (sign === '(' || sign === '[') depth += 1;
            if (sign === ')' || sign === ']') depth -= 1;
            if (depth === 0 && ' >+~'.includes(sign)) start = at + 1;
        });
        return selector.slice(start);
    };

    /**
     * A rule's selectors with the `:where()` each is wrapped in taken off, and what follows the
     * `:where()` kept on each, a pseudo-element or a combinator and more, since that decides what
     * the selector draws.
     */
    const membersOf = (selector: string): string[] =>
        split(selector).flatMap((member) => {
            if (!member.startsWith(':where(')) return [member];
            const end = closing(member, ':where'.length);
            const tail = member.slice(end + 1);
            return split(member.slice(':where('.length, end)).map((inner) => inner + tail);
        });

    /**
     * Whether a selector draws the root itself: its subject is the root, by either name, and not a
     * pseudo-element of it, which is a box of its own.
     */
    const isRoot = (member: string): boolean => {
        const subject = subjectOf(member);
        return /^(?::root|html)\b/.test(subject) && !subject.includes('::');
    };

    /** Each declaration of a rule, as its name and its value. */
    const declarationsOf = (body: string): [string, string][] =>
        body
            .split(';')
            .map((declaration): [string, string] => {
                const colon = declaration.indexOf(':');
                return [
                    declaration.slice(0, colon).trim(),
                    declaration
                        .slice(colon + 1)
                        .replace(/\s+/g, ' ')
                        .trim(),
                ];
            })
            .filter(([name]) => name !== '');

    /** Each declaration of a rule's own, a custom property's left out. */
    const ownOf = (body: string): [string, string][] =>
        declarationsOf(body).filter(([name]) => !name.startsWith('--'));

    /**
     * Each custom property a rule with the root among its subjects declares, in the sheets given,
     * with every value it is given, since the root reads a property whichever sheet sets it there.
     */
    const declaredOnRoot = (css: readonly string[]): Map<string, string[]> => {
        const found = new Map<string, string[]>();
        for (const { selector, body } of css.flatMap(rulesOf)) {
            if (!membersOf(selector).some(isRoot)) continue;
            for (const [name, value] of declarationsOf(body))
                if (name.startsWith('--')) found.set(name, [...(found.get(name) ?? []), value]);
        }
        return found;
    };

    const texts = sheets.map((name) => readFileSync(new URL(name, folder), 'utf8'));
    const rootTokens = declaredOnRoot(texts);

    /** Whether a value holds a length in rem, itself or through a property the root declares. */
    const inRem = (
        value: string,
        declared: ReadonlyMap<string, string[]>,
        seen: readonly string[] = []
    ): boolean =>
        /\d\s*rem\b/.test(value) ||
        [...value.matchAll(/var\(\s*(--[\w-]+)/g)].some(
            ([, name = '']) =>
                !seen.includes(name) &&
                (declared.get(name) ?? []).some((held) => inRem(held, declared, [...seen, name]))
        );

    /** The properties a value reads with no fallback that no rule on the root declares. */
    const unknownIn = (value: string, declared: ReadonlyMap<string, string[]>): string[] =>
        [...value.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)]
            .map(([, name = '']) => name)
            .filter((name) => !declared.has(name));

    /**
     * Each declaration on the root itself that reads a rem, in the sheet text given, or reads a
     * property no rule on the root declares and gives no fallback, whose unit nothing here can
     * tell.
     */
    const remOnRoot = (
        css: string,
        declared: ReadonlyMap<string, string[]> = rootTokens
    ): string[] =>
        rulesOf(css)
            .filter(({ selector }) => membersOf(selector).some(isRoot))
            .flatMap(({ selector, body }) =>
                ownOf(body).flatMap(([name, value]) => [
                    ...(inRem(value, declared) ? [`${selector} sets ${name} in rem`] : []),
                    ...unknownIn(value, declared).map(
                        (read) =>
                            `${selector} sets ${name} from ${read}, which no root rule declares`
                    ),
                ])
            );

    /**
     * Each rule that reads one of the root's twins in em anywhere but in a property of the root's
     * own: in a rule that draws another element, where an em is that element's text size, or in a
     * custom property, which hands the em on to whatever reads it.
     */
    const twinsAstray = (css: string): string[] =>
        rulesOf(css).flatMap(({ selector, body }) =>
            declarationsOf(body)
                .filter(([, value]) => value.includes('--_dk-root-'))
                .filter(([name]) => name.startsWith('--') || !membersOf(selector).every(isRoot))
                .map(([name]) => `${selector} reads a twin in ${name}`)
        );

    it('tells a rule on the root that reads a rem from one that reads an em or sits elsewhere', () => {
        expect(rootTokens.get('--dk-target')).toEqual(['2.75rem']);
        expect(
            remOnRoot(`
                :where(:root:has(.a)) { scroll-padding-bottom: calc(2 * var(--dk-target) + 1px); }
                :where(.b, html) { padding: 1rem; --dk-own: 2rem; }
                :where(:root:has(.c)) { scroll-padding-bottom: var(--_dk-root-target); }
                :where(:root:has(.d) > body) { padding-bottom: var(--dk-target); }
                :where(.e :root) { margin: 0 1em; }
            `)
        ).toEqual([
            ':where(:root:has(.a)) sets scroll-padding-bottom in rem',
            ':where(.b, html) sets padding in rem',
        ]);
    });

    it('reads what follows a :where() as part of its selector, so a pseudo-element or a child of the root is not the root', () => {
        expect(membersOf(':where(:root, .a)::view-transition-new(*)')).toEqual([
            ':root::view-transition-new(*)',
            '.a::view-transition-new(*)',
        ]);
        expect(
            remOnRoot(`
                :where(:root)::view-transition-new(*) { margin: 1rem; }
                :where(:root:has(.x)) > body { padding-bottom: var(--dk-target); }
                :where(html)::before { height: 2rem; }
                :where(:root:has(.y)) { scroll-padding-top: 1rem; }
            `)
        ).toEqual([':where(:root:has(.y)) sets scroll-padding-top in rem']);
    });

    it('reads a combinator sign inside an attribute selector as part of the attribute', () => {
        expect(subjectOf(":root[class~='a b']")).toBe(":root[class~='a b']");
        expect(subjectOf('.a > html[data-x~=y]:has(.b ~ .c)')).toBe('html[data-x~=y]:has(.b ~ .c)');
        expect(
            remOnRoot(':where(:root[data-theme~=dark]) { scroll-padding-bottom: 1rem; }')
        ).toEqual([':where(:root[data-theme~=dark]) sets scroll-padding-bottom in rem']);
    });

    it('follows a property to its rem whichever sheet declares it on the root, and fails one it cannot find', () => {
        const declared = declaredOnRoot([
            ':where(:root) { --dk-a: 1rem; --dk-c: 2em; }',
            ':where(.p) { --dk-piece: 1rem; }',
            '@media (width <= 1px) { :where(html:has(.late)) { --dk-b: calc(2 * var(--dk-a)); } }',
        ]);
        expect([...declared.keys()]).toEqual(['--dk-a', '--dk-c', '--dk-b']);
        expect(
            remOnRoot(
                `
                :where(:root) { scroll-padding-top: var(--dk-b); }
                :where(:root) { scroll-padding-bottom: var(--dk-c); }
                :where(:root) { scroll-padding-left: var(--dk-piece); }
                :where(:root) { scroll-padding-right: var(--dk-page, 1em); }
                :where(:root) { scroll-margin-top: var(--dk-page, 1rem); }
            `,
                declared
            )
        ).toEqual([
            ':where(:root) sets scroll-padding-top in rem',
            ':where(:root) sets scroll-padding-left from --dk-piece, which no root rule declares',
            ':where(:root) sets scroll-margin-top in rem',
        ]);
        // A property a later sheet declares on the root is followed in the kit's own sheets too.
        expect(rootTokens.size).toBeGreaterThanOrEqual(
            declaredOnRoot([readFileSync(new URL('tokens.css', folder), 'utf8')]).size
        );
    });

    it("tells a twin read by the root's own property from one read elsewhere or handed on", () => {
        expect(
            twinsAstray(`
                :where(:root) { --_dk-root-target: 2.75em; }
                :where(:root:has(.a)) { scroll-padding-bottom: var(--_dk-root-target); }
                :where(html) { scroll-padding-top: calc(2 * var(--_dk-root-space-1)); }
                :where(.b) { padding: var(--_dk-root-target); }
                :where(:root, .c) { margin: var(--_dk-root-target); }
                :where(:root)::before { height: var(--_dk-root-target); }
                :where(:root:has(.d)) > body { padding: var(--_dk-root-target); }
                :where(:root) { --dk-room: calc(2 * var(--_dk-root-target)); }
                :where(.e) { --_dk-own: var(--_dk-root-space-4); }
            `)
        ).toEqual([
            ':where(.b) reads a twin in padding',
            ':where(:root, .c) reads a twin in margin',
            ':where(:root)::before reads a twin in height',
            ':where(:root:has(.d)) > body reads a twin in padding',
            ':where(:root) reads a twin in --dk-room',
            ':where(.e) reads a twin in --_dk-own',
        ]);
    });

    it("reads no rem in a property of the root's own, which Safari draws from 16px at any root size", () => {
        const astray = sheets.flatMap((name, at) =>
            remOnRoot(texts[at] ?? '').map((found) => `${name}: ${found}`)
        );
        expect(astray).toEqual([]);
    });

    it("gives each of the root's twins in em the number its token holds in rem", () => {
        const twins = [...rootTokens].filter(([name]) => name.startsWith('--_dk-root-'));
        expect(twins.length).toBeGreaterThan(0);
        const astray = twins.filter(([name, values]) => {
            const token = rootTokens.get(name.replace('--_dk-root-', '--dk-')) ?? [];
            return (
                token.length !== 1 ||
                values.length !== 1 ||
                !/^[\d.]+rem$/.test(token[0] ?? '') ||
                values[0] !== (token[0] ?? '').replace(/rem$/, 'em')
            );
        });
        expect(astray).toEqual([]);
        // A twin is read by a property of the root's own alone, since an em elsewhere is that
        // element's text size.
        expect(
            sheets.flatMap((name, at) =>
                twinsAstray(texts[at] ?? '').map((found) => `${name}: ${found}`)
            )
        ).toEqual([]);
    });

    it('declares custom properties only in the tokens', () => {
        const elsewhere = sheets
            .filter((name) => name !== 'tokens.css')
            .filter((name) => /--[\w-]+\s*:/.test(readFileSync(new URL(name, folder), 'utf8')));
        expect(elsewhere).toEqual([]);
    });
});
