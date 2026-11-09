/*
 * The palette as a page reads it, from the tokens sheet itself, and each pairing it is meant for,
 * at the ratio WCAG asks of it. The sheet is passed in rather than read here, so the kit's tests
 * measure the sources and the site measures the sheet of the version it pins, and this module
 * imports nothing.
 */

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

/** Every custom property a sheet declares, by name, with its value as written. */
export const declaredIn = (sheet: string): ReadonlyMap<string, string> =>
    new Map(
        [...sheet.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(
            ([, name = '', value = '']) => [name, value.trim()]
        )
    );

/** The roles the sheets read with a fallback, unset unless a page sets them, and that fallback. */
const FALLBACKS: Readonly<Record<string, string>> = { focus: 'accent' };

/** A color role's value in the theme given, from its `light-dark()`, or its fallback's. */
export const colorOf = (
    declared: ReadonlyMap<string, string>,
    role: string,
    theme: Theme
): string => {
    // A role a page sets only where it differs, as the focus color, takes its fallback's colors.
    const fallback = FALLBACKS[role];
    const written = declared.get(`--dk-${role}`);
    if (written === undefined && fallback !== undefined) return colorOf(declared, fallback, theme);
    const pair = /^light-dark\(\s*(#[\da-f]{6})\s*,\s*(#[\da-f]{6})\s*\)$/i.exec(written ?? '');
    if (!pair?.[1] || !pair[2]) throw new Error(`--dk-${role} is not a light-dark() of two colors`);
    return theme === 'light' ? pair[1] : pair[2];
};

const luminance = (hex: string) => {
    const [r = 0, g = 0, b = 0] = [1, 3, 5].map((at) => {
        const channel = parseInt(hex.slice(at, at + 2), 16) / 255;
        return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** The contrast WCAG defines between two colors. */
export const contrast = (a: string, b: string): number => {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return ((high ?? 0) + 0.05) / ((low ?? 0) + 0.05);
};

/**
 * Each color role a pairing is measured from, and what a page draws with it. The scrim is left out,
 * since it is a translucent black rather than a color a pairing is measured against.
 */
export const ROLES: readonly (readonly [string, string])[] = [
    ['bg', 'The page itself'],
    ['surface', 'A card on the page'],
    ['raised', 'What floats over the page and its cards, such as a menu'],
    ['fg', 'Text'],
    ['muted', 'Text that steps back'],
    ['line', 'The lines between things'],
    ['control', 'The edge of a field or button'],
    ['accent', 'Links and the one action a page leads with'],
    ['focus', 'The focus ring, and the edge a pointer brings to a button'],
    ['on-accent', 'Text on the accent'],
    ['highlight', 'What is chosen or pointed at'],
    ['success', 'What went right'],
    ['success-bg', 'The background of a callout for what went right'],
    ['danger', 'What went wrong'],
    ['danger-bg', 'The background of a callout for what went wrong'],
];

/** What a page is drawn on: the page itself, a card on it, and what floats over both. */
const GROUNDS = ['bg', 'surface', 'raised'];

/**
 * Each pairing the palette is meant for, at its ratio: text at 4.5 to 1, and at 3 to 1 the edge a
 * visitor has to see to use a control and the focus ring, which is in a role of its own so a page
 * can ring in another color than its accent.
 */
export const PAIRS: readonly (readonly [string, string, number])[] = [
    ...GROUNDS.flatMap((ground) => [
        ['fg', ground, 4.5] as const,
        ['muted', ground, 4.5] as const,
        ['accent', ground, 4.5] as const,
        ['success', ground, 4.5] as const,
        ['danger', ground, 4.5] as const,
        ['control', ground, 3] as const,
        ['focus', ground, 3] as const,
    ]),
    ['on-accent', 'accent', 4.5],
    // A callout's own ground, and what is chosen, carry text, its quieter line, a link and the
    // edge of a button or field drawn inside the callout.
    ...['highlight', 'success-bg', 'danger-bg'].flatMap((ground) => [
        ['fg', ground, 4.5] as const,
        ['muted', ground, 4.5] as const,
        ['accent', ground, 4.5] as const,
        ['control', ground, 3] as const,
    ]),
    ['success', 'success-bg', 4.5],
    ['danger', 'danger-bg', 4.5],
];
