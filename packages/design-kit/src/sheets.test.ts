import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';

import { withoutComments } from '../../../scripts/summary.mjs';

/*
 * The three sheets as a page's minifier sends them, without their comments: small enough to send
 * to every visitor of every demo, held to a budget as the controls are, so the components sheet
 * cannot grow unseen as pieces are added. The package record shows the same figure for each sheet,
 * measured the same way.
 */

const BUDGET = 6 * 1024;
const SHEETS = ['tokens.css', 'base.css', 'components.css'];

describe('the sheets', () => {
    it(`stay within ${String(BUDGET / 1024)} KB gzipped together, without their comments as a minifier sends them`, () => {
        const sent = SHEETS.map((name) =>
            withoutComments(readFileSync(new URL(`./${name}`, import.meta.url), 'utf8'))
        ).join('\n');
        expect(gzipSync(sent).length).toBeLessThanOrEqual(BUDGET);
    });
});
