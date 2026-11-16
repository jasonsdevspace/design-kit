import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/*
 * `tokens.resolver.json` holds the tokens in the Design Tokens Community Group's format, 2025.10,
 * for a tool that reads that format rather than CSS. Its base set holds every token the two
 * themes share, and its theme modifier holds each `light-dark()` split into a light and a dark
 * context. Each token is drawn back as the CSS it stands for and held to what `tokens.css`
 * declares on the root, so a value changed in one file and not the other fails.
 */

const sheet = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const resolver = JSON.parse(
    readFileSync(new URL('./tokens.resolver.json', import.meta.url), 'utf8')
) as Resolver;

/**
 * The root's tokens the format cannot hold, each with its reason: a length in `em`, which the
 * format's dimension does not allow, a keyword, or a value the browser works out as it draws, from
 * the visitor's text size, the page's width or what a phone keeps at its edges.
 */
const CSS_ONLY: Readonly<Record<string, string>> = {
    'text-code': 'a length in em',
    'tracking-caps': 'a length in em',
    'strip-tools': 'the keyword auto',
    'space-4-held': 'a min() of a rem and a px length, by the text size',
    'space-5-held': 'a min() of a rem and a px length, by the text size',
    'field-inline-held': 'a min() of a rem and a px length, by the text size',
    'safe-top': 'what the phone keeps, by env()',
    'safe-right': 'what the phone keeps, by env()',
    'safe-bottom': 'what the phone keeps, by env()',
    'safe-left': 'what the phone keeps, by env()',
    'column-inset': "a max() with a percentage of the page's width",
    'band-left': 'a calc() of the safe area and the inset',
    'band-right': 'a calc() of the safe area and the inset',
    ground: 'the ground of what holds a piece, which each container sets again',
    'ground-step': 'the ground a piece steps to, which each container sets again',
    'card-inset': 'a step that narrows on a phone and in an app, by a media query and a container',
};

interface Dimension {
    readonly value: number;
    readonly unit: string;
}
interface Color {
    readonly colorSpace: string;
    readonly components: readonly number[];
    readonly alpha?: number;
    readonly hex: string;
}
interface Shadow {
    readonly color: Color;
    readonly offsetX: Dimension;
    readonly offsetY: Dimension;
    readonly blur: Dimension;
    readonly spread: Dimension;
}
interface Token {
    readonly $type: string;
    readonly $value: unknown;
}
type Tokens = Readonly<Record<string, Token>>;
type Source = Readonly<{ dk: Tokens }>;
interface Resolver {
    readonly version: string;
    readonly sets: Readonly<Record<string, { readonly sources: readonly Source[] }>>;
    readonly modifiers: Readonly<
        Record<
            string,
            {
                readonly contexts: Readonly<Record<string, readonly Source[]>>;
                readonly default: string;
            }
        >
    >;
    readonly resolutionOrder: readonly { readonly $ref: string }[];
}

/** What `tokens.css` declares on the root, by each token's name without the prefix. */
const declaredOnRoot = (): ReadonlyMap<string, string> => {
    const plain = sheet.replace(/\/\*[\s\S]*?\*\//g, '');
    const root = plain.indexOf(':where(:root) {');
    if (root < 0) throw new Error('tokens.css declares no :where(:root) block');
    const open = plain.indexOf('{', root);
    let depth = 0;
    let end = open;
    for (; end < plain.length; end++) {
        if (plain[end] === '{') depth++;
        if (plain[end] === '}' && --depth === 0) break;
    }
    return new Map(
        [...plain.slice(open + 1, end).matchAll(/--dk-([\w-]+)\s*:\s*([^;]+);/g)].map(
            ([, name = '', value = '']) => [name, value.replace(/\s+/g, ' ').trim()]
        )
    );
};

const length = ({ value, unit }: Dimension): string =>
    value === 0 ? '0' : `${String(value)}${unit}`;

/** A color as the sheet writes it: its hex, or `rgb()` with its alpha where it has one. */
const colorCss = (color: Color): string => {
    const bytes = color.components.map((part) => Math.round(part * 255));
    const hex = `#${bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
    // The hex a tool may fall back on names the same color as the components.
    expect(color.hex, color.hex).toBe(hex);
    expect(color.colorSpace).toBe('srgb');
    return color.alpha === undefined ? hex : `rgb(${bytes.join(' ')} / ${String(color.alpha)})`;
};

/** A token with one value as the sheet writes it. */
const css = ({ $type, $value }: Token): string => {
    switch ($type) {
        case 'dimension':
        case 'duration':
            return length($value as Dimension);
        case 'number':
        case 'fontWeight':
            return String($value);
        case 'fontFamily':
            return ($value as string[])
                .map((family) => (family.includes(' ') ? `'${family}'` : family))
                .join(', ');
        default:
            throw new Error(`no CSS for a ${$type} with one value`);
    }
};

/** A shadow's lengths, which both themes share, and its color in one theme. */
const shadow = (token: Token) => {
    expect(token.$type).toBe('shadow');
    const { color, offsetX, offsetY, blur, spread } = token.$value as Shadow;
    expect(spread.value).toBe(0);
    return { lengths: [offsetX, offsetY, blur].map(length).join(' '), color: colorCss(color) };
};

/** A token whose light and dark values differ, as the sheet writes it in one `light-dark()`. */
const themedCss = (light: Token, dark: Token): string => {
    if (light.$type === 'color' && dark.$type === 'color')
        return `light-dark(${colorCss(light.$value as Color)}, ${colorCss(dark.$value as Color)})`;
    const [lit, dim] = [shadow(light), shadow(dark)];
    expect(dim.lengths).toBe(lit.lengths);
    return `${lit.lengths} light-dark(${lit.color}, ${dim.color})`;
};

const theme = resolver.modifiers['theme'];

/** The tokens of a set or a context, read inside a test so a resolver of another shape fails it. */
const only = (sources: readonly Source[] | undefined): Tokens => {
    expect(sources).toHaveLength(1);
    return sources?.[0]?.dk ?? {};
};
const base = () => only(resolver.sets['base']?.sources);
const light = () => only(theme?.contexts['light']);
const dark = () => only(theme?.contexts['dark']);

describe('the tokens in the design tokens format', () => {
    it('is a resolver of the 2025.10 format, its base set first and the theme over it', () => {
        expect(resolver.version).toBe('2025.10');
        expect(resolver.resolutionOrder).toEqual([
            { $ref: '#/sets/base' },
            { $ref: '#/modifiers/theme' },
        ]);
        expect(Object.keys(resolver.modifiers)).toEqual(['theme']);
        expect(Object.keys(theme?.contexts ?? {})).toEqual(['light', 'dark']);
        expect(theme?.default).toBe('light');
    });

    it('names the same tokens in the light and the dark context, and none in the base set too', () => {
        expect(Object.keys(dark())).toEqual(Object.keys(light()));
        expect(Object.keys(light()).filter((name) => name in base())).toEqual([]);
    });

    it('holds every token the root declares, or names why the format cannot', () => {
        const declared = declaredOnRoot();
        const held = [...Object.keys(base()), ...Object.keys(light())];
        expect(
            [...declared.keys()].filter((name) => !held.includes(name) && !(name in CSS_ONLY))
        ).toEqual([]);
        expect(held.filter((name) => !declared.has(name))).toEqual([]);
        // A token the format can hold is held, rather than left in the list of those it cannot.
        expect(Object.keys(CSS_ONLY).filter((name) => held.includes(name))).toEqual([]);
        expect(Object.keys(CSS_ONLY).filter((name) => !declared.has(name))).toEqual([]);
    });

    it('draws each token as the value tokens.css declares for it', () => {
        const declared = declaredOnRoot();
        const darkTokens = dark();
        for (const [name, token] of Object.entries(base()))
            expect(css(token), name).toBe(declared.get(name));
        for (const [name, token] of Object.entries(light()))
            expect(themedCss(token, darkTokens[name] as Token), name).toBe(declared.get(name));
    });
});
