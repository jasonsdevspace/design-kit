import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';

import { SHEET_ORDER, withoutComments } from './summary.mjs';

/*
 * The kit's three sheets without their comments and blank lines, gzipped at the default level:
 * small enough to send to every visitor of every demo, held to a budget beside the controls', so
 * the components sheet cannot grow unseen as pieces are added. A page's minifier sends somewhat
 * less than this, as record 13 measures, so the budget errs on the side of the larger figure. The
 * package record measures each sheet the same way, through the same function, so the figure it
 * shows is the one held here.
 */

/*
 * Set by the rule of the size audit of record 13: what the three sheets weigh sent together, with
 * room for one more piece of the usual size, the median a piece costs, rounded up to the next
 * quarter of a kilobyte. Set so in 0.6.0, again in 0.7.0 once the toast's group of buttons and the
 * table's shade left too little room for another piece, again in 0.8.0, whose planned pieces took
 * the sheets past 9.25 KB, again in 0.8.2, whose corner Close took them past 10.25 KB, and again in
 * 0.8.6, whose grid of buttons dropping to a count that divides its cells took them past 10.75 KB,
 * again for 0.9.0, measured with a prototype of the pieces planned for it, as 0.8.0's were, and
 * again once those pieces landed heavier than the prototype and left too little room for another,
 * again in 0.9.4, once a busy button's dots took them past 12.25 KB, again in the same release,
 * once a field held to the measure left too little room for another, and once more in it, once the
 * root's room written in em left too little room, and again in it, once a read-only value of words
 * sized to its value left too little room. The app's pieces stay in the components sheet, so a page
 * loads one sheet whatever it draws.
 */
const BUDGET = 13.25 * 1024;

describe('the sheets', () => {
    it(`stay within ${String(BUDGET / 1024)} KB gzipped together, without their comments and blank lines`, () => {
        const sent = SHEET_ORDER.map((name) =>
            withoutComments(
                readFileSync(new URL(`../packages/design-kit/src/${name}`, import.meta.url), 'utf8')
            )
        ).join('\n');
        expect(gzipSync(sent).length).toBeLessThanOrEqual(BUDGET);
    });
});
