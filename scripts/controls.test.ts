import { readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import * as controls from '../packages/design-kit/src/controls.js';
import * as theme from '../packages/design-kit/src/theme.js';
import { bundledOf, packagedOf, sentOf } from './parts.mjs';

/*
 * The controls as a page's bundler sends them: every function, without comments and gzipped, small
 * enough to send to every visitor of a page that attaches one. Every budget here but the theme
 * script's is measured from the package laid out as npm ships it, as the package record measures
 * each function, so a bundler reads the manifest's `sideEffects` as it does in a page's install.
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
 * for 0.9.4 once a dated field's limit in words left too little room for another, and again once a
 * toast marking its frame did, and again once a stepper quiet as its form refuses it did, and again
 * once a focus request dropped for a page out of sight rather than after a second did, and again
 * once a stepper's letters shown as focus leaves it and its words naming its field did, and again
 * once a stepper holding its error back while a press outside it is down did, and again once a
 * limit kept to the field's calendar and digits, a year written in full and steps counted from the
 * browser's step base did, and again once F8 reaching a toast's action did, and again once a dialog
 * and a panel reading focus through frames by one view did.
 */
const BUDGET = 23.5 * 1024;

/*
 * What a page that imports one function pays, beside the whole, on three sentinels: the module
 * imported bare, which sends the listeners it adds as it loads, and the smallest and the largest
 * attach, each alone. Each is set by the rule of record 13 for that entry: its size with room for
 * one more function of the usual size, the median of what each function adds to every other, from
 * the same layout, the upper of the middle two where the count is even, rounded up to the next
 * quarter of a kilobyte. Set so in 0.9.4, and for `attachForm` alone again once a limit kept to the
 * field's calendar and digits, a year written in full and steps counted from the browser's step base
 * left too little room for another, and again once one view of focus that a focus request compares
 * through did.
 */
const ENTRY_BUDGETS = [
    ['the module imported bare', [], 1.5 * 1024],
    ['attachTable alone', ['attachTable'], 2.75 * 1024],
    ['attachForm alone', ['attachForm'], 9.75 * 1024],
] as const;

/* The theme script with room to grow, since a page sends it whole on every visit. */
const SCRIPT_BUDGET = 1024;

/* The theme module's names, which the controls import, without the script that goes inline. */
const THEME_NAMES = Object.keys(theme).filter((name) => name !== 'themeScript');

describe('the controls', () => {
    let packaged = '';
    beforeAll(async () => {
        packaged = await packagedOf(
            fileURLToPath(new URL('../packages/design-kit', import.meta.url))
        );
    });
    afterAll(() => {
        rmSync(packaged, { recursive: true, force: true });
    });

    it(`stay within ${String(BUDGET / 1024)} KB gzipped as a bundler sends every function, without comments`, async () => {
        const sent = await sentOf(join(packaged, 'dist', 'controls.js'), Object.keys(controls));
        expect(sent).toBeLessThanOrEqual(BUDGET);
    }, 60_000);

    it.each(ENTRY_BUDGETS)(
        'send %s within its budget',
        async (_, names, budget) => {
            const sent = await sentOf(join(packaged, 'dist', 'controls.js'), names);
            expect(sent).toBeLessThanOrEqual(budget);
        },
        60_000
    );

    // The theme script is the theme module's one template, so a backtick left in a bundle of the
    // other names is the script's text, kept since a bundler could not prove it harmless.
    it('bundle the theme names the controls import with nothing of the theme script', async () => {
        const bundled = await bundledOf(join(packaged, 'dist', 'theme.js'), THEME_NAMES);
        expect(bundled).not.toContain('`');
    }, 60_000);

    it(`keep the theme script a page puts inline within ${String(SCRIPT_BUDGET / 1024)} KB gzipped`, () => {
        expect(gzipSync(theme.themeScript).length).toBeLessThanOrEqual(SCRIPT_BUDGET);
    });
});

/*
 * Focus is read from the page down in one place. Only the dialog and the toast, which keep a place
 * to hand focus back to, call the deep reader or the place it gives by name, and every other module
 * reaches the deep read only through the one view, as `seenNow` and `mayHandBack` give it. The
 * reader the controls had before it is gone.
 */
describe("the controls' reads of focus", () => {
    const sources = fileURLToPath(new URL('../packages/design-kit/src', import.meta.url));
    const files = readdirSync(sources).filter((name) => /^[^.]+\.tsx?$/.test(name));
    const textOf = (name: string) => readFileSync(join(sources, name), 'utf8');

    it('call the deep reader or the place it gives by name outside the focus module only in the dialog and the toast', () => {
        const callers = files.filter(
            (name) => name !== 'focus.ts' && /\b(?:deepActive|placeNow)\(/.test(textOf(name))
        );
        expect(callers.sort()).toEqual(['dialog.ts', 'toast.ts']);
    });

    it('have no reader of focus named focusedNow', () => {
        expect(files.filter((name) => textOf(name).includes('focusedNow'))).toEqual([]);
    });
});
