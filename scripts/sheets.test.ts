import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';

import { withoutComments } from './summary.mjs';

/*
 * The kit's three sheets as a page's minifier sends them, without their comments and blank lines:
 * small enough to send to every visitor of every demo, held to a budget as the controls are in the
 * package's own tests, so the components sheet cannot grow unseen as pieces are added. The package
 * record measures each sheet the same way, through the same function, so the figure it shows is
 * the one held here.
 */

/*
 * Set in 0.6.0 from the size audit of record 13: what the three sheets weigh sent together, with
 * room for one more piece of the usual size, the median a piece costs, rounded up to the next
 * quarter of a kilobyte. The app's pieces stay in the components sheet, so a page loads one sheet
 * whatever it draws.
 */
const BUDGET = 9 * 1024;
const SHEETS = ['tokens.css', 'base.css', 'components.css'];

describe('the sheets', () => {
    it(`stay within ${String(BUDGET / 1024)} KB gzipped together, without their comments and blank lines`, () => {
        const sent = SHEETS.map((name) =>
            withoutComments(
                readFileSync(new URL(`../packages/design-kit/src/${name}`, import.meta.url), 'utf8')
            )
        ).join('\n');
        expect(gzipSync(sent).length).toBeLessThanOrEqual(BUDGET);
    });
});
