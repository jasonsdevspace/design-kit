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
 * quarter of a kilobyte. Set again by the same rule for 0.8.4, with attachPanel and its fixes in
 * place, for 0.9.0 once a stepper's range in words, its limits said and a page's own words and line
 * took them past 7.5 KB, and again once moving focus after a change and among a group's cells took
 * them past 8.75 KB, and again once refusing a form and a busy button took them past 11 KB, again
 * once saying progress at its steps took them past 12 KB, again once checking a form against the
 * browser's constraints took them past 12.75 KB, and again once telling a press that brings a view
 * from a key that moves took them past 15.5 KB, and again once a stepper's own say and the controls
 * finding their parts inside a shadow root left too little room for another, and again for 0.9.3
 * once the teardown helper of record 22 left too little room for another, and again once the status
 * line, the toast, the form, the panels and the remaining attaches moved onto it, and again once
 * record 23's holders left too little room for another, again once its one rule for handing focus
 * back did, again once a handback that takes an SVG element did, again once focus falling to the
 * body and followed into a frame did, again once a control kept clear inside a frame did, and again
 * for 0.9.4 once a dated field's limit in words left too little room for another.
 */
const BUDGET = 20.5 * 1024;

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
