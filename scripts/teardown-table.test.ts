// @vitest-environment node
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { PIECES, script } from '../packages/design-kit/e2e/teardown-pieces.js';
import * as controls from '../packages/design-kit/src/controls.js';
import * as react from '../packages/design-kit/src/react.js';

/*
 * Record 22's promise is held by a table and a page written by hand: teardown-pieces.tsx names
 * each piece with how it is attached, which teardown.spec.tsx and leaks.spec.tsx both run, and
 * leaks-page.tsx draws a part that uses every hook. An attach or a hook added to the package and
 * left out of them would be held by no test and fail none, so the package's own exports are read
 * here and each is found called where the specs look.
 */

/** A source with its comments taken out, so a name in a comment is not taken for a call. */
const withoutComments = (source: string): string =>
    source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** The table in the page's script, from its opening to the brace that closes it. */
const tableOf = (source: string): string => {
    const from = source.indexOf('window.pieces = {');
    const to = source.indexOf('\n};', from);
    if (from < 0 || to < 0) throw new Error('expected the table of pieces in the script');
    return withoutComments(source.slice(from, to));
};

/** The names given that the table never calls on the kit. */
const notInTable = (names: readonly string[], table: string): string[] =>
    names.filter((name) => !new RegExp(`\\bkit\\.${name}\\(`).test(table));

/** The names of the pieces the table holds, in its order. */
const namedIn = (table: string): string[] =>
    [...table.matchAll(/^ {4}(?:'([^']+)'|"([^"]+)"|(\w+)): \{$/gm)].map(
        ([, single, double, bare]) => single ?? double ?? bare ?? ''
    );

/** The hooks given that a page never calls, with a type given to one or not. */
const notCalled = (names: readonly string[], page: string): string[] =>
    names.filter((name) => !new RegExp(`\\b${name}(?:<[^()]*>)?\\(`).test(withoutComments(page)));

/** What the controls export that record 22 holds: every attach, and the focus request. */
const ATTACHES = Object.keys(controls).filter(
    (name) => /^attach[A-Z]/.test(name) || name === 'moveFocus'
);

/** Every hook the React entry exports. */
const HOOKS = Object.keys(react).filter((name) => /^use[A-Z]/.test(name));

const TABLE = tableOf(script());
const LEAKS_PAGE = readFileSync(
    new URL('../packages/design-kit/e2e/leaks-page.tsx', import.meta.url),
    'utf8'
);

describe('the teardown table', () => {
    it('attaches every attach the controls export, and makes a focus request', () => {
        // The exports are there to read, so the check cannot pass on a package with none.
        expect(ATTACHES).toContain('attachStepper');
        expect(ATTACHES).toContain('moveFocus');
        expect(notInTable(ATTACHES, TABLE)).toEqual([]);
    });

    it('names each of its pieces in the list the specs run', () => {
        expect(namedIn(TABLE)).toEqual([...PIECES]);
    });

    it('finds an attach the table leaves out, or names only in a comment', () => {
        const table = tableOf(`window.pieces = {
    'the stepper': {
        // Not kit.attachTable(frame), which a comment names.
        attach: (signal) => kit.attachStepper(steps, { signal }),
    },
};
kit.attachDialog(dialog);`);
        expect(notInTable(['attachStepper', 'attachTable', 'attachDialog'], table)).toEqual([
            'attachTable',
            'attachDialog',
        ]);
        expect(namedIn(table)).toEqual(['the stepper']);
    });
});

describe('the leaks page', () => {
    it('uses every hook the React entry exports', () => {
        expect(HOOKS).toContain('useStatus');
        expect(notCalled(HOOKS, LEAKS_PAGE)).toEqual([]);
    });

    it('finds a hook the page only imports, or leaves out', () => {
        const page = `import { useBusy, useRoving, useStatus } from '../src/react.js';
// useStatus() is called in a comment alone.
const row = useRoving<HTMLDivElement>();
const save = useBusy();`;
        expect(notCalled(['useBusy', 'useRoving', 'useStatus', 'useProgress'], page)).toEqual([
            'useStatus',
            'useProgress',
        ]);
    });
});
