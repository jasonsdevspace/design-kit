import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
    colorOf,
    contrast,
    declaredIn,
    luminance,
    pagePropertiesIn,
    PAIRS,
    ROLES,
    THEMES,
    withoutComments,
} from '../examples/palette.js';

/*
 * The tokens as a page reads them, from the sheet itself. Every color role holds its light and its
 * dark value in one `light-dark()`, so each pairing the palette is meant for is measured in both
 * themes, at the ratio WCAG asks of it. The roles, the pairings and the measure are in
 * `examples/palette.ts`, which the site uses too, on the tokens sheet of the version it pins.
 */

const sheet = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
const declared = declaredIn(sheet);

/** A sheet read flat, with no space just inside a bracket, so how it is wrapped does not count. */
const flatten = (css: string): string =>
    css.replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')');

/** The selectors in the `:where()` list of the rule whose declarations start with the one given. */
const holdersOf = (css: string, declaration: string): string[] => {
    const flat = flatten(css);
    const end = flat.indexOf(`) { ${declaration}`);
    if (end < 0) throw new Error(`expected a rule that starts with ${declaration}`);
    const start = flat.lastIndexOf(':where(', end);
    return flat
        .slice(start + ':where('.length, end)
        .split(',')
        .map((selector) => selector.trim());
};

describe('the tokens', () => {
    it("names every custom property with the kit prefix, a token's or the kit's own", () => {
        const names = [...withoutComments(sheet).matchAll(/(--[\w-]+)\s*:/g)].map(
            ([, name = '']) => name
        );
        expect(names.filter((name) => !/^--_?dk-/.test(name))).toEqual([]);
    });

    it("reads the tokens without the kit's own working properties, which the sheet also declares", () => {
        expect(withoutComments(sheet)).toMatch(/--_dk-[\w-]+\s*:/);
        expect([...declared.keys()].filter((name) => name.startsWith('--_'))).toEqual([]);
    });

    it('reads a token from the root before any piece, and leaves out what a page sets and the kit works out', () => {
        const read = declaredIn(`
            :where(:root) { --dk-a: 1px; --dk-b: 2px; }
            @media (width <= 1px) { :where(:root) { --dk-a: 9px; } }
            :where(.p) { --dk-b: 5px; --dk-c: 3px; --_dk-w: 1; --dk-set: 4px; }
            :where(.q) { --dk-c: 6px; --dk-c: 3px; }
            :where(.r) { width: var(--dk-set, 1px); height: var(--_dk-w); }
        `);
        expect([...read]).toEqual([
            ['--dk-a', '1px'],
            ['--dk-b', '2px'],
            ['--dk-c', '3px or 6px'],
        ]);
    });

    it('reads the tokens of the three sheets without a property a page sets', () => {
        const all = ['tokens.css', 'base.css', 'components.css']
            .map((name) => readFileSync(new URL(`./${name}`, import.meta.url), 'utf8'))
            .join('\n');
        const page = pagePropertiesIn(all);
        expect(page.has('--dk-button-grid-least')).toBe(true);
        expect([...declaredIn(all).keys()].filter((name) => page.has(name))).toEqual([]);
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
            'app-body',
            ...['pinned', 'raised', 'bar', 'toast', 'skip'].map((layer) => `stack-${layer}`),
            'shadow-raised',
            'shadow-resting',
            'scrim',
            'duration-short',
            'duration-medium',
            ...['top', 'right', 'bottom', 'left'].map((edge) => `safe-${edge}`),
            'font-sans',
            'font-mono',
        ];
        expect(scale.filter((name) => !declared.has(`--dk-${name}`))).toEqual([]);
    });

    it("reads each safe area from the browser's own inset, and is zero where it reports none and in a picture", () => {
        // The root reads the browser's inset, and a picture of a screen, which touches no edge of
        // the visitor's, sets each to none.
        const flat = flatten(sheet);
        for (const edge of ['top', 'right', 'bottom', 'left']) {
            expect(flat, edge).toContain(`--dk-safe-${edge}: env(safe-area-inset-${edge}, 0px);`);
            expect(flat, edge).toMatch(
                new RegExp(`:where\\(\\.dk-picture\\) \\{[^}]*--dk-safe-${edge}: 0px;`)
            );
        }
    });

    it("holds where a full-width band's content starts on each side, past the phone's side, written once", () => {
        const flat = flatten(sheet);
        expect(flat).toContain('--dk-column-inset: max(0px, (100% - var(--dk-column)) / 2);');
        expect(flat).toContain('--dk-app-inset: max(0px, (100vw - var(--dk-app-column)) / 2);');
        for (const side of ['left', 'right'])
            expect(flat, side).toContain(
                `--dk-band-${side}: calc(max(var(--dk-safe-${side}), var(--dk-column-inset)) + var(--dk-space-4));`
            );
        // On a page with an app's column, what sits outside it starts where the column's content
        // does, and the column clears the phone's sides itself, so a band inside it starts a step
        // in by the app frame's own sides.
        for (const side of ['left', 'right']) {
            expect(flat, side).toContain(
                `--dk-band-${side}: calc(max(var(--dk-safe-${side}), var(--dk-app-inset)) + var(--dk-app-side));`
            );
            expect(flat, side).toContain(
                `--dk-band-${side}: calc(var(--dk-column-inset) + var(--dk-app-side));`
            );
        }
        // Both sides are set in the one rule, which may name more holders than these.
        expect(
            holdersOf(
                sheet,
                '--dk-band-left: calc(var(--dk-column-inset) + var(--dk-app-side)); --dk-band-right: calc(var(--dk-column-inset) + var(--dk-app-side));'
            )
        ).toEqual(expect.arrayContaining(['.dk-app', '.dk-tabbar-page > :not(.dk-skip)']));
        // The sheets read the band insets, and none works the column's inset out again.
        const components = readFileSync(new URL('./components.css', import.meta.url), 'utf8');
        expect(components).not.toMatch(/100% - var\(--dk-column\)/);
        expect(components).not.toMatch(/- var\(--dk-app-column\)/);
        expect(flat.match(/- var\(--dk-app-column\)/g)).toHaveLength(1);
        expect(components).toMatch(/\.dk-skip \{[^}]*\bleft: var\(--dk-band-left\);/);
        // Every piece that runs the width of the page starts its content at the band insets.
        expect(
            holdersOf(
                components,
                'padding-right: var(--dk-band-right); padding-left: var(--dk-band-left);'
            )
        ).toEqual(
            expect.arrayContaining([
                '.dk-strip',
                '.dk-footer',
                '.dk-explainer-header',
                '.dk-explainer',
                '.dk-site-header',
                '.dk-page',
                '.dk-band',
            ])
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

    it.each(['--dk-shadow-raised', '--dk-shadow-resting'])(
        'casts %s deeper on a dark page, where a soft one shows little',
        (name) => {
            const shadow = declared.get(name) ?? '';
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
        }
    );

    it('lifts the raised ground above the surface in the dark theme, and no lower than the page in the light one', () => {
        // In the dark theme the step is what tells a card from the page, since its shadow shows
        // little, and in the light one the shadow does, so raised only has to sit no lower than
        // the page.
        const lit = (role: string, theme: (typeof THEMES)[number]) =>
            luminance(colorOf(declared, role, theme));
        expect(lit('raised', 'dark')).toBeGreaterThan(lit('surface', 'dark'));
        expect(lit('raised', 'light')).toBeGreaterThanOrEqual(lit('bg', 'light'));
    });

    it("keeps a busy button's dots at 3:1 on every ground at the faintest of their pulse", () => {
        const components = readFileSync(new URL('./components.css', import.meta.url), 'utf8');
        const floor = Number(
            /@keyframes dk-busy\s*\{\s*to\s*\{\s*opacity:\s*([\d.]+)/.exec(components)?.[1]
        );
        expect(floor).toBeGreaterThan(0);
        // The dots in the text color at that opacity, laid over each ground they can sit on.
        const over = (front: string, back: string) =>
            `#${[1, 3, 5]
                .map((at) => {
                    const channel = (hex: string) => Number.parseInt(hex.slice(at, at + 2), 16);
                    const mixed = channel(front) * floor + channel(back) * (1 - floor);
                    return Math.round(mixed).toString(16).padStart(2, '0');
                })
                .join('')}`;
        const short = THEMES.flatMap((theme) =>
            ['bg', 'surface', 'raised'].flatMap((ground) => {
                const back = colorOf(declared, ground, theme);
                const measured = contrast(over(colorOf(declared, 'fg', theme), back), back);
                return measured < 3 ? [`${theme} ${ground}: ${measured.toFixed(2)}`] : [];
            })
        );
        expect(short).toEqual([]);
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
