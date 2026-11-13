import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';

import * as controls from '../packages/design-kit/src/controls.js';
import { themeScript } from '../packages/design-kit/src/theme.js';
import { sentOf } from './parts.mjs';

/*
 * The controls as a page's bundler sends them: every function, without comments and gzipped, small
 * enough to send to every visitor of a page that attaches one. The package record measures each
 * function through the same function, as a bundler sends it from the packed package.
 * The theme script the theme module exports goes inline in a page's head and is dropped from the
 * controls by a bundler, so it is held to a budget of its own.
 */

/*
 * Set in 0.6.0 from the size audit of record 13: what a page's bundler sends for every function,
 * with room for one more of the usual size, the median a function adds, rounded up to the next
 * quarter of a kilobyte.
 */
const BUDGET = 6.25 * 1024;

/* The theme script with room to grow, since a page sends it whole on every visit. */
const SCRIPT_BUDGET = 1024;

describe('the controls', () => {
    it(`stay within ${String(BUDGET / 1024)} KB gzipped as a bundler sends every function, without comments`, async () => {
        const sent = await sentOf(
            fileURLToPath(new URL('../packages/design-kit/src/controls.ts', import.meta.url)),
            Object.keys(controls)
        );
        expect(sent).toBeLessThanOrEqual(BUDGET);
    }, 60_000);

    it(`keep the theme script a page puts inline within ${String(SCRIPT_BUDGET / 1024)} KB gzipped`, () => {
        expect(gzipSync(themeScript).length).toBeLessThanOrEqual(SCRIPT_BUDGET);
    });
});
