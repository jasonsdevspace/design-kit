import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

/*
 * The site's icon is drawn in the kit's accent and the text on it, so a pin that moves either
 * moves the icon too, or this fails. The `.ico` and the home screen icon are drawn from the SVG by
 * hand, so they are drawn again when it changes.
 */

const tokens = readFileSync(
    createRequire(import.meta.url).resolve('design-kit-release/tokens.css'),
    'utf8'
);
const icon = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8');

/** A token's light and dark values, from its `light-dark()` in the pinned sheet. */
const pair = (token: string) => {
    const [, light, dark] =
        new RegExp(`${token}:\\s*light-dark\\((#[0-9a-f]+),\\s*(#[0-9a-f]+)\\)`, 'i').exec(
            tokens
        ) ?? [];
    return [light, dark];
};

/** A class's fill in the icon, outside the dark scheme's rule and inside it. */
const fills = (name: string) => {
    const dark = icon.slice(icon.indexOf('@media (prefers-color-scheme: dark)'));
    const fill = (text: string) =>
        new RegExp(`\\.${name}\\s*\\{\\s*fill:\\s*(#[0-9a-f]+)`, 'i').exec(text)?.[1];
    return [fill(icon), fill(dark)];
};

describe("the site's icon", () => {
    it("draws its ground in the pinned kit's accent, in each theme", () => {
        expect(pair('--dk-accent')).toEqual(fills('ground'));
    });

    it('draws its tiles in the text on the accent, in each theme', () => {
        expect(pair('--dk-on-accent')).toEqual(fills('tile'));
    });
});
