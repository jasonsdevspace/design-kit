import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { withoutComments } from '../examples/palette.js';

/*
 * A row of fields sizes each field by a length, never by its content, as record 25 has it, and no
 * rule reaches inside a field from the row, since a rule on a field's own parts would be content
 * reaching a width again. A check that looked for the forms such a rule can take was walked around
 * three times, so the rules that name the row are listed here instead, each whole, and the sheets
 * must hold exactly those. A rule that names the row anywhere, in a selector, a list, a nested
 * rule or an at-rule, fails until it is added to the list on purpose, by someone who has read the
 * record. The rules for what the row holds directly are short enough to read, and are held to how
 * a field flexes from a length.
 */

/** The rules that name a row of fields, each as its selector and declarations on one line. */
const LISTED: readonly string[] = [
    // The measure, which the row holds to as a field does.
    ':where(:is(.dk-page, .dk-band, .dk-stack) :is(.dk-field, .dk-fields, form .dk-callout):not(.dk-dialog *, dialog *, [popover] *)) { max-width: var(--dk-field-measure, var(--dk-measure)) }',
    // The row itself.
    ':where(.dk-fields) { display: flex; flex-wrap: wrap; align-items: end; gap: var(--dk-space-4) }',
    // What the row holds directly: every field from one length, and a line each for two kinds.
    ':where(.dk-fields > .dk-field) { flex: 1 1 var(--dk-fields-least, 10rem) }',
    ':where(.dk-fields > :is(.dk-stepper-inline, .dk-choice-field)) { flex-basis: 100% }',
    // A plain form's step, which the row takes as one of the kit's blocks.
    ':where(form:not([class]) > :is(.dk-field, .dk-fields, .dk-actions, .dk-callout):not(:is([hidden], [data-empty], .dk-visually-hidden, .dk-callout:has(> .dk-callout-body:empty):not(:has(> .dk-callout-actions)))) ~ :is(.dk-field, .dk-fields, .dk-actions, .dk-callout):not([data-empty], .dk-visually-hidden)) { margin-block-start: var(--dk-space-4) }',
];

/** The listed rules for what the row holds directly, which alone set how a field is sized. */
const FOR_ITS_FIELDS = LISTED.filter((rule) => /\.dk-fields > /.test(rule));

const BEFORE_ADDING =
    'A rule that names a row of fields is not in the list in src/fields.test.ts, or a listed one ' +
    'changed. Read decision record 25 before adding one: the row sizes each field by a length ' +
    'and never reaches inside a field.';

const ROW = /\.dk-fields(?![\w-])/g;

/** How many times a text names the row. */
const names = (text: string): number => [...text.matchAll(ROW)].length;

/** A text on one line, with no space inside a parenthesis's ends. */
const onOneLine = (text: string): string =>
    text.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')').trim();

/** Where the block that opens at the place given closes, or the text's end where it never does. */
const closeOf = (css: string, open: number): number => {
    let depth = 0;
    for (let at = open; at < css.length; at += 1) {
        if (css[at] === '{') depth += 1;
        if (css[at] === '}') depth -= 1;
        if (css[at] === '}' && depth === 0) return at;
    }
    return css.length;
};

/** A block of a sheet: what stands before each brace around it, outermost first, and its own. */
type Block = { readonly around: readonly string[]; readonly declarations: readonly string[] };

/** Every block in a sheet, a nested one after the block it is in. */
const blocksIn = (css: string, around: readonly string[] = []): Block[] => {
    const blocks: Block[] = [];
    const declarations: string[] = [];
    let from = 0;
    for (let at = 0; at < css.length; at += 1) {
        if (css[at] === ';') {
            declarations.push(css.slice(from, at));
            from = at + 1;
        }
        if (css[at] !== '{') continue;
        const close = closeOf(css, at);
        blocks.push(
            ...blocksIn(css.slice(at + 1, close), [...around, onOneLine(css.slice(from, at))])
        );
        at = close;
        from = close + 1;
    }
    declarations.push(css.slice(from));
    return [{ around, declarations: declarations.map(onOneLine).filter(Boolean) }, ...blocks];
};

/**
 * Every rule in the sheets given that names the row, in what stands before its own brace or
 * before one around it, a layer's name left out. The sheet's text is searched for the row's name
 * first, and every place found must be one a rule here holds, so a name the reading missed, in a
 * value for one, fails instead of passing unread.
 */
const namingTheRow = (sheets: string): string[] => {
    const css = withoutComments(sheets);
    const blocks = blocksIn(css);
    // Each block is opened by the last of what stands around it, so each is counted once.
    const read = blocks.reduce((sum, { around }) => sum + names(around.at(-1) ?? ''), 0);
    if (read !== names(css))
        throw new Error('the sheets name a row of fields outside any rule this test reads');
    return blocks
        .filter(
            ({ around, declarations }) => declarations.length > 0 && names(around.join(' ')) > 0
        )
        .map(
            ({ around, declarations }) =>
                `${around.filter((one) => !one.startsWith('@layer')).join(' { ')} { ${declarations.join('; ')} }`
        );
};

/** The rules that name the row in the sheets given and are not in the list. */
const unlisted = (sheets: string): string[] =>
    namingTheRow(sheets).filter((rule) => !LISTED.includes(rule));

/** A basis a field's content sets, or a keyword that leaves the basis to one. */
const FROM_CONTENT =
    /(?:^|[\s(,])(?:auto|none|content|(?:-webkit-|-moz-)?(?:max|min|fit)-content|initial|unset|revert|revert-layer|inherit)(?![\w-])/i;

/** What is wrong with a listed rule for what the row holds directly, or nothing. */
const faultsOf = (rule: string): string[] =>
    (/\{ (.*) \}$/.exec(rule)?.[1] ?? '').split('; ').flatMap((declaration) => {
        const [name = '', value = ''] = declaration.split(/:(.*)/s).map((part) => part.trim());
        if (!['flex', 'flex-basis', 'flex-grow', 'flex-shrink'].includes(name))
            return [`sets ${name}, not how a field flexes`];
        return FROM_CONTENT.test(value) || /var\([^,)]*,?\s*\)/.test(value)
            ? [`takes its basis from its content, by ${declaration}`]
            : [];
    });

const SHEETS = ['tokens.css', 'base.css', 'components.css']
    .map((name) => readFileSync(new URL(`./${name}`, import.meta.url), 'utf8'))
    .join('\n');

/** A rule a sheet might gain, in each form a review found the earlier check to miss. */
const WAYS_AROUND = {
    'a descendant': ':where(.dk-fields .dk-stepper) { min-width: 0; }',
    'a list in :is()': ':where(:is(.dk-fields, .dk-x) > .dk-field > .dk-input) { width: 1px; }',
    'an ancestor in :has()': ':where(.dk-page:has(.dk-fields) .dk-input) { min-width: 0; }',
    'a nested rule': ':where(.dk-fields) { & > .dk-field { flex: none; } }',
    'a nested list': ':where(.dk-page) { .dk-x, .dk-fields .dk-input { width: 1px; } }',
    'a rule nested in a list': ':where(.dk-x, .dk-fields) { .dk-input { width: 1px; } }',
    'a scope': '@scope (.dk-fields) { .dk-input { width: 1px; } }',
    "a scope's limit": '@scope (.dk-page) to (.dk-fields > *) { .dk-field { flex: auto; } }',
    'a media query': '@media (width < 24rem) { :where(.dk-fields > .dk-field) { flex: 0 auto; } }',
    'a second rule for a field':
        ':where(.dk-fields > .dk-field) { flex-basis: calc(var(--dk-x)); }',
} as const;

describe('a row of fields', () => {
    it('is named only by the rules listed here', () => {
        expect(namingTheRow(SHEETS), BEFORE_ADDING).toEqual(LISTED);
    });

    it('sizes what it holds directly only by how a field flexes, from a length', () => {
        expect(FOR_ITS_FIELDS).toHaveLength(2);
        expect(FOR_ITS_FIELDS.flatMap(faultsOf)).toEqual([]);
    });

    for (const [way, rule] of Object.entries(WAYS_AROUND))
        it(`finds a rule that names the row by ${way}, since it is not on the list`, () => {
            expect(unlisted(`${SHEETS}\n${rule}`)).toHaveLength(1);
            expect(namingTheRow(`${SHEETS}\n${rule}`)).not.toEqual(LISTED);
        });

    it('finds a listed rule changed, and one taken away', () => {
        const changed = SHEETS.replace(
            'var(--dk-fields-least, 10rem)',
            'var(--dk-fields-least, auto)'
        );
        expect(changed).not.toBe(SHEETS);
        expect(unlisted(changed)).toHaveLength(1);
        const gone = SHEETS.replace(/:where\(\.dk-fields > \.dk-field\) \{[^}]*\}/, '');
        expect(namingTheRow(gone)).toHaveLength(LISTED.length - 1);
    });

    it('fails where the row is named outside any rule it reads', () => {
        expect(() => namingTheRow(':where(.dk-x) { content: ".dk-fields"; }')).toThrow(
            'outside any rule'
        );
    });

    it("finds a field's rule that sets more than how it flexes, or a basis its content sets", () => {
        for (const declaration of [
            'min-width: 0',
            'flex: 0 1 auto',
            'flex: none',
            'flex: 1 1 AUTO',
            'flex-basis: max-content',
            'flex-basis: -webkit-max-content',
            'flex-basis: fit-content(10rem)',
            'flex-basis: auto !important',
            'flex-basis: unset',
            'flex-basis: revert',
            'flex-basis: inherit',
            'flex: 1 1 var(--dk-fields-least, auto)',
            'flex: 1 1 var(--dk-fields-least)',
            'flex: 1 1 var(--dk-fields-least,)',
            'flex-basis: calc(var(--dk-fields-least))',
        ])
            expect(
                faultsOf(`:where(.dk-fields > .dk-field) { ${declaration} }`),
                declaration
            ).toHaveLength(1);
        expect(
            faultsOf(':where(.dk-fields > .dk-field) { flex: 1 1 10rem; flex-grow: 2 }')
        ).toEqual([]);
    });
});
