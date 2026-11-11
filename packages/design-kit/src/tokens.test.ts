import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
    colorOf,
    contrast,
    declaredIn,
    luminance,
    PAIRS,
    ROLES,
    THEMES,
} from '../examples/palette.js';

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
            ...[1, 2, 3, 4, 5, 6, 7, 8].map((step) => `space-${String(step)}`),
            ...[
                'caption',
                'small',
                'body',
                'lead',
                'title',
                'heading',
                'display',
                'numeral',
                'code',
            ].map((step) => `text-${step}`),
            'leading-tight',
            'leading-body',
            'weight-normal',
            'weight-medium',
            'weight-strong',
            'tracking-caps',
            'radius-small',
            'radius',
            'radius-large',
            'radius-pill',
            'ring-width',
            'ring-offset',
            'field-height',
            'field-inline',
            'target',
            'target-large',
            'strip',
            'measure',
            'column',
            'app-column',
            'app-bar',
            ...['pinned', 'raised', 'bar', 'toast', 'skip'].map((layer) => `stack-${layer}`),
            'shadow-raised',
            'scrim',
            'duration-short',
            'duration-medium',
            ...['top', 'right', 'bottom', 'left'].map((edge) => `safe-${edge}`),
            'font-sans',
            'font-mono',
        ];
        expect(scale.filter((name) => !declared.has(`--dk-${name}`))).toEqual([]);
    });

    it("reads each safe area from the browser's own inset, and is zero where it reports none", () => {
        for (const edge of ['top', 'right', 'bottom', 'left'])
            expect(declared.get(`--dk-safe-${edge}`), edge).toBe(
                `env(safe-area-inset-${edge}, 0px)`
            );
    });

    /** A token's value in rem, or NaN when it is written in another unit. */
    const rem = (name: string) => {
        const [, value] = /^(\d+(?:\.\d+)?)rem$/.exec(declared.get(name) ?? '') ?? [];
        return Number(value ?? Number.NaN);
    };

    it('sets the larger target above the target, in the same unit', () => {
        expect(rem('--dk-target-large')).toBeGreaterThan(rem('--dk-target'));
    });

    it('sets the numeral above every step of text', () => {
        const steps = [...declared.keys()].filter(
            (name) => name.startsWith('--dk-text-') && name !== '--dk-text-numeral'
        );
        // The step for code is in em, a share of the text around it, and is no size of its own.
        const sized = steps.filter((name) => !Number.isNaN(rem(name)));
        expect(sized.length).toBe(steps.length - 1);
        for (const name of sized) expect(rem('--dk-text-numeral'), name).toBeGreaterThan(rem(name));
    });

    it('stacks a pinned cell under a list, a list under a bar, a bar under a toast, and the skip link over all', () => {
        const order = ['pinned', 'raised', 'bar', 'toast', 'skip'].map((layer) =>
            Number(declared.get(`--dk-stack-${layer}`))
        );
        expect(order.every(Number.isInteger)).toBe(true);
        expect(order).toEqual([...order].sort((first, second) => first - second));
        expect(new Set(order).size).toBe(order.length);
    });

    it('takes longer over a surface that travels than over a small change of state', () => {
        /** A duration in milliseconds, whichever of the two units it is written in. */
        const ms = (name: string) => {
            const [, value, unit] = /^(\d+(?:\.\d+)?)(ms|s)$/.exec(declared.get(name) ?? '') ?? [];
            return Number(value ?? Number.NaN) * (unit === 's' ? 1000 : 1);
        };
        expect(ms('--dk-duration-medium')).toBeGreaterThan(ms('--dk-duration-short'));
    });

    it('pads a field inline by the step a button is padded by, so their text starts level', () => {
        expect(declared.get('--dk-field-inline')).toBe(declared.get('--dk-space-3'));
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

    it('lifts the raised ground above the surface in the dark theme, and no lower than the page in the light one', () => {
        // In the dark theme the step is what tells a card from the page, since its shadow shows
        // little, and in the light one the shadow does, so raised only has to sit no lower than
        // the page.
        const lit = (role: string, theme: (typeof THEMES)[number]) =>
            luminance(colorOf(declared, role, theme));
        expect(lit('raised', 'dark')).toBeGreaterThan(lit('surface', 'dark'));
        expect(lit('raised', 'light')).toBeGreaterThanOrEqual(lit('bg', 'light'));
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
