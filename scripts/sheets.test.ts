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
 * Raised from 6 KB for the pieces an app is made of, which ship in the components sheet beside the
 * rest rather than in a sheet of their own, so a page loads one sheet whatever it draws. The figure
 * holds every piece the release that adds them plans, with room for the dialog, which is the
 * largest of them.
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
