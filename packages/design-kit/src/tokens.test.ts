import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { colorOf, contrast, declaredIn, PAIRS, ROLES, THEMES } from '../examples/palette.js';

/*
 * The tokens as a page reads them, from the sheet itself. Every color role holds its light and its
 * dark value in one `light-dark()`, so each pairing the palette is meant for is measured in both
 * themes, at the ratio WCAG asks of it. The roles, the pairings and the measure are in
 * `examples/palette.ts`, which the site uses too, on the tokens sheet of the version it pins.
 */

const sheet = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const declared = declaredIn(sheet);

describe('the tokens', () => {
    it('names every custom property with the kit prefix', () => {
        expect([...declared.keys()].filter((name) => !name.startsWith('--dk-'))).toEqual([]);
    });

    it('declares every color role with a light and a dark value', () => {
        for (const [role] of ROLES) {
            for (const theme of THEMES) expect(colorOf(declared, role, theme)).toMatch(/^#/);
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
            'radius-pill',
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

    it('casts the raised shadow deeper on a dark page, where a soft one shows little', () => {
        const shadow = declared.get('--dk-shadow-raised') ?? '';
        // Each color's alpha, written as a number or a percent, in the order light then dark.
        const alphas = [...shadow.matchAll(/rgb\(0 0 0 \/ (\d+(?:\.\d+)?)(%?)\)/g)].map(
            ([, value = '0', percent]) => Number(value) / (percent ? 100 : 1)
        );
        const [light, dark] = alphas;
        if (light === undefined || dark === undefined) {
            throw new Error(`the shadow is not two rgb() blacks in light-dark(): ${shadow}`);
        }
        expect(shadow).toContain('light-dark(');
        expect(dark).toBeGreaterThan(light);
    });

    for (const theme of THEMES) {
        it(`holds every pairing to its ratio in the ${theme} theme`, () => {
            const short = PAIRS.flatMap(([front, back, ratio]) => {
                const measured = contrast(
                    colorOf(declared, front, theme),
                    colorOf(declared, back, theme)
                );
                return measured < ratio
                    ? [`${front} on ${back}: ${measured.toFixed(2)}, needs ${String(ratio)}`]
                    : [];
            });
            expect(short).toEqual([]);
        });
    }
});
