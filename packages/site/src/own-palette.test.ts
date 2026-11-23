import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

import { colorOf, contrast, declaredIn, PAIRS, THEMES } from '../../design-kit/examples/palette.js';

/*
 * The own palette page answers for its own contrast, as any page with a palette of its own does, so
 * every pairing the kit is meant for is measured in its palette, over the version the site pins.
 */

const released = (name: string) =>
    readFileSync(createRequire(import.meta.url).resolve(`design-kit-release/${name}`), 'utf8');
const sheets = ['tokens.css', 'base.css', 'components.css'].map(released).join('\n');
const own = declaredIn(readFileSync(new URL('own-palette.css', import.meta.url), 'utf8'));
const declared = new Map([...declaredIn(sheets), ...own]);

describe("the own palette page's palette", () => {
    it('sets its own accent, highlight and focus ring, each in both themes', () => {
        for (const role of ['accent', 'on-accent', 'highlight', 'focus']) {
            expect(own.get(`--dk-${role}`), role).toMatch(/^light-dark\(/);
        }
    });

    it('keeps every pairing the kit is meant for at the ratio it needs, in both themes', () => {
        const short = PAIRS.flatMap(([front, back, needs]) =>
            THEMES.filter(
                (theme) =>
                    contrast(colorOf(declared, front, theme), colorOf(declared, back, theme)) <
                    needs
            ).map((theme) => `${front} on ${back} in ${theme}`)
        );
        expect(short).toEqual([]);
    });
});
