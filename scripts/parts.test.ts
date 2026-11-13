import { describe, expect, it } from 'vitest';

import { pieceOf, piecesOf, rulesOf } from './parts.mjs';

/*
 * The measure of what each part of the package costs: a rule counted to the piece it draws, the
 * rules found inside the layers and media queries that hold them, and a piece costed by what the
 * sheets save without it.
 */

describe('the parts of the package', () => {
    it('counts a rule to the piece it draws, outside what it leaves out or looks for', () => {
        expect(pieceOf(':where(.dk-button-grid > .dk-button[aria-pressed="true"])')).toBe(
            'button grid'
        );
        expect(pieceOf(':where(:root:has(.dk-app, .dk-tabbar-page) .dk-dialog)')).toBe('dialog');
        expect(
            pieceOf(':where(.dk-dialog > :not(.dk-visually-hidden, [hidden]) ~ .dk-button)')
        ).toBe('dialog');
        expect(pieceOf(':where(.dk-row-title), :where(.dk-table)')).toBe('rows');
        expect(pieceOf(':where(.dk-input:focus-visible)')).toBe('field');
        expect(pieceOf(':where(a)')).toBe("the page's own elements");
        expect(pieceOf('@keyframes dk-toast-rise')).toBe('animations');
    });

    it('finds each rule inside the layers and media queries that hold it', () => {
        const css =
            '@layer dk.components { :where(.dk-a) { color: red; } @media (width <= 48rem) { :where(.dk-b) { color: blue; } } @keyframes dk-x { from { opacity: 0; } } }';
        expect(rulesOf(css).map(({ selector }) => selector)).toEqual([
            ':where(.dk-a)',
            ':where(.dk-b)',
            '@keyframes dk-x',
        ]);
    });

    it('costs each piece by what the sheets save without it, the costliest first', () => {
        const long = Array.from({ length: 40 }, (_, at) => `--x${String(at)}: ${String(at)}px;`);
        const pieces = piecesOf([
            `@layer dk.components { :where(.dk-toast) { ${long.join(' ')} } :where(.dk-panel) { color: red; } }`,
        ]);
        expect(pieces.map(({ piece }) => piece)).toEqual(['toast', 'panel']);
        expect(pieces[0]?.rules).toBe(1);
        expect(pieces[0]?.gzip).toBeGreaterThan(pieces[1]?.gzip ?? 0);
    });
});
