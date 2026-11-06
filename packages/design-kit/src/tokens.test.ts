import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/*
 * The tokens as a page reads them, from the sheet itself. Every color role holds its light and its
 * dark value in one `light-dark()`, so each pairing the palette is meant for is measured in both
 * themes, at the ratio WCAG asks of it.
 */

const sheet = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');

/** Every custom property the sheet declares, by name, with its value as written. */
const declared = new Map(
    [...sheet.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(
        ([, name = '', value = '']) => [name, value.trim()]
    )
);

const THEMES = ['light', 'dark'] as const;
type Theme = (typeof THEMES)[number];

/** A color role's value in the theme given, from its `light-dark()`. */
const colorOf = (role: string, theme: Theme): string => {
    const value = declared.get(`--dk-${role}`);
    const pair = /^light-dark\(\s*(#[\da-f]{6})\s*,\s*(#[\da-f]{6})\s*\)$/i.exec(value ?? '');
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
const contrast = (a: string, b: string) => {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return ((high ?? 0) + 0.05) / ((low ?? 0) + 0.05);
};

const ROLES = [
    'bg',
    'surface',
    'raised',
    'fg',
    'muted',
    'line',
    'control',
    'accent',
    'on-accent',
    'highlight',
    'success',
    'success-bg',
    'danger',
    'danger-bg',
];

/** What a page is drawn on: the page itself, a card on it, and what floats over both. */
const GROUNDS = ['bg', 'surface', 'raised'];

/**
 * Each pairing the palette is meant for, at its ratio: text at 4.5 to 1, and at 3 to 1 the edge a
 * visitor has to see to use a control. The focus ring is drawn in the accent, which already meets
 * 4.5 to 1 on each ground as the color of a link.
 */
const PAIRS: readonly (readonly [string, string, number])[] = [
    ...GROUNDS.flatMap((ground) => [
        ['fg', ground, 4.5] as const,
        ['muted', ground, 4.5] as const,
        ['accent', ground, 4.5] as const,
        ['success', ground, 4.5] as const,
        ['danger', ground, 4.5] as const,
        ['control', ground, 3] as const,
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

describe('the tokens', () => {
    it('names every custom property with the kit prefix', () => {
        expect([...declared.keys()].filter((name) => !name.startsWith('--dk-'))).toEqual([]);
    });

    it('declares every color role with a light and a dark value', () => {
        for (const role of ROLES) {
            for (const theme of THEMES) expect(colorOf(role, theme)).toMatch(/^#/);
        }
    });

    it('declares the scale a component is built from', () => {
        const scale = [
            ...[1, 2, 3, 4, 5, 6].map((step) => `space-${String(step)}`),
            ...['caption', 'small', 'body', 'lead', 'title', 'heading', 'display', 'code'].map(
                (step) => `text-${step}`
            ),
            'leading-tight',
            'leading-body',
            'weight-normal',
            'weight-medium',
            'weight-strong',
            'radius-small',
            'radius',
            'radius-large',
            'ring-width',
            'ring-offset',
            'field-height',
            'field-inline',
            'target',
            'strip',
            'measure',
            'column',
            'shadow-raised',
            'scrim',
            'duration-short',
            'font-sans',
            'font-mono',
        ];
        expect(scale.filter((name) => !declared.has(`--dk-${name}`))).toEqual([]);
    });

    for (const theme of THEMES) {
        it(`holds every pairing to its ratio in the ${theme} theme`, () => {
            const short = PAIRS.flatMap(([front, back, ratio]) => {
                const measured = contrast(colorOf(front, theme), colorOf(back, theme));
                return measured < ratio
                    ? [`${front} on ${back}: ${measured.toFixed(2)}, needs ${String(ratio)}`]
                    : [];
            });
            expect(short).toEqual([]);
        });
    }
});
