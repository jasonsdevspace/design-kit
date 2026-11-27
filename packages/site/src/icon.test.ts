import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

import { FAINT, GROUND_RADIUS, TILES } from './mark.js';

/*
 * The site's icon is drawn in the kit's accent and the text on it, so a pin that moves either
 * moves the icon too, or this fails, and the header's mark is the same drawing. The `.ico` and the
 * home screen icon are drawn from the SVG, and a browser test holds their colors to it. The
 * repository's README shows the mark by the viewer's GitHub theme, which an SVG's own rule for the
 * scheme cannot follow, so it has a file for each theme, held here to the same drawing and colors.
 */

const tokens = readFileSync(
    createRequire(import.meta.url).resolve('design-kit-release/tokens.css'),
    'utf8'
);
const icon = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8');
const css = readFileSync(new URL('site.css', import.meta.url), 'utf8');
/** The README's mark for a theme, by the file's name. */
const mark = (theme: string) =>
    readFileSync(new URL(`../../../.github/readme/mark-${theme}.svg`, import.meta.url), 'utf8');

/** A color written in hex, in lower case and with six digits, so one color is written one way. */
const hex = (color: string | undefined) => {
    const digits = color?.toLowerCase().replace(/^#/, '') ?? '';
    return `#${digits.length === 3 ? [...digits].map((digit) => digit + digit).join('') : digits}`;
};

/** A token's light and dark values, from its `light-dark()` in the pinned sheet. */
const pair = (token: string) => {
    const found = new RegExp(
        `${token}:\\s*light-dark\\((#[0-9a-f]+),\\s*(#[0-9a-f]+)\\)`,
        'i'
    ).exec(tokens);
    expect(found, `${token} as two hex colors in light-dark()`).not.toBeNull();
    return [hex(found?.[1]), hex(found?.[2])];
};

/** A class's fill in an SVG's style. */
const fill = (text: string, name: string) =>
    hex(new RegExp(`\\.${name}\\s*\\{\\s*fill:\\s*(#[0-9a-f]+)`, 'i').exec(text)?.[1]);

/** A class's fill in the icon, outside the dark scheme's rule and inside it. */
const fills = (name: string) => {
    const at = icon.search(/@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)/);
    expect(at, "the icon's rule for the dark scheme").toBeGreaterThan(-1);
    return [fill(icon.slice(0, at), name), fill(icon.slice(at), name)];
};

/** An element's attributes, as numbers where they are. */
const attributes = (text: string) =>
    Object.fromEntries(
        [...text.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name = '', value = '']) => [
            name,
            Number.isNaN(Number(value)) ? value : Number(value),
        ])
    );

/** The tiles of an SVG of the mark, each as its shape and attributes. */
const tilesOf = (text: string) =>
    [...text.matchAll(/<(rect|circle) class="tile"([^>]*)\/>/g)].map(([, shape, rest = '']) => ({
        shape,
        ...attributes(rest),
    }));

/** The ground of an SVG of the mark, as its attributes. */
const groundOf = (text: string) =>
    attributes(/<rect class="ground"([^>]*)\/>/.exec(text)?.[1] ?? '');

/** The tiles as `mark.ts` gives them, written as the SVG writes them. */
const drawn = TILES.map((tile) =>
    tile.shape === 'circle'
        ? { shape: 'circle', cx: tile.x, cy: tile.y, r: tile.radius }
        : {
              shape: 'rect',
              x: tile.x,
              y: tile.y,
              width: tile.size,
              height: tile.size,
              rx: tile.radius,
              ...(tile.faint ? { 'fill-opacity': FAINT } : {}),
          }
);

describe("the site's icon", () => {
    it("draws its ground in the pinned kit's accent, in each theme", () => {
        expect(fills('ground')).toEqual(pair('--dk-accent'));
    });

    it('draws its tiles in the text on the accent, in each theme', () => {
        expect(fills('tile')).toEqual(pair('--dk-on-accent'));
    });

    it("is the drawing the header's mark is made from, its corners as round", () => {
        expect(tilesOf(icon)).toEqual(drawn);
        expect(groundOf(icon)).toMatchObject({ width: 32, height: 32, rx: GROUND_RADIUS });
        expect(css).toMatch(
            new RegExp(
                `\\.site-mark \\{[^}]*border-radius: ${String((GROUND_RADIUS / 32) * 100)}%;`
            )
        );
    });

    it.each([
        ['light', 0],
        ['dark', 1],
    ])("gives the README the same drawing in mark-%s.svg, in that theme's colors", (theme, at) => {
        const drawing = mark(theme);
        expect(tilesOf(drawing)).toEqual(drawn);
        expect(groundOf(drawing)).toMatchObject({ width: 32, height: 32, rx: GROUND_RADIUS });
        expect(drawing).not.toMatch(/prefers-color-scheme/);
        expect([fill(drawing, 'ground'), fill(drawing, 'tile')]).toEqual([
            pair('--dk-accent')[at],
            pair('--dk-on-accent')[at],
        ]);
    });
});
