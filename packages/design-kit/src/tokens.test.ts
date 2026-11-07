import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
    colorOf as colorIn,
    contrast,
    declaredIn,
    PAIRS,
    ROLES,
    type Theme,
    THEMES,
} from '../examples/palette.js';

/*
 * The tokens as a page reads them, from the sheet itself. Every color role holds its light and its
 * dark value in one `light-dark()`, so each pairing the palette is meant for is measured in both
 * themes, at the ratio WCAG asks of it. The roles, the pairings and the measure are in
 * `examples/palette.ts`, which the site reads too, from the version it pins.
 */

const sheet = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const declared = declaredIn(sheet);
const colorOf = (role: string, theme: Theme) => colorIn(declared, role, theme);

describe('the tokens', () => {
    it('names every custom property with the kit prefix', () => {
        expect([...declared.keys()].filter((name) => !name.startsWith('--dk-'))).toEqual([]);
    });

    it('declares every color role with a light and a dark value', () => {
        for (const [role] of ROLES) {
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
