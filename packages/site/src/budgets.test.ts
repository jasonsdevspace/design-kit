import { describe, expect, it } from 'vitest';

import {
    BEHAVIOR_SCRIPT_BUDGET,
    budgetOf,
    downloadsOf,
    OWN_PALETTE_STYLE_BUDGET,
    pastBudget,
    SCRIPT_BUDGET,
    STYLE_BUDGET,
} from './budgets.js';
import { ROUTES } from './routes.js';

/*
 * The byte budgets the audit holds each page to: which files of a built page are counted, which
 * budget each page has, and what a page past one is told.
 */

/** A built page's head, as Vite writes it for a page with a script of its own. */
const HEAD = `
    <script>document.documentElement.dataset.theme = 'dark';</script>
    <script type="module" crossorigin src="/design-kit/assets/behavior/index.html-abc.js"></script>
    <link rel="modulepreload" crossorigin href="/design-kit/assets/script-def.js">
    <link rel="stylesheet" crossorigin href="/design-kit/assets/script-ghi.css">
    <link rel="stylesheet" crossorigin href="/design-kit/assets/index-jkl.css">
    <link rel="icon" href="/design-kit/favicon.svg" type="image/svg+xml" />`;

describe("a page's downloads", () => {
    it('are the scripts it loads or preloads and the sheets it links, from the assets folder down', () => {
        expect(downloadsOf(HEAD)).toEqual({
            scripts: ['assets/behavior/index.html-abc.js', 'assets/script-def.js'],
            styles: ['assets/script-ghi.css', 'assets/index-jkl.css'],
        });
    });

    it('count a file named twice once', () => {
        const twice = '<link rel="modulepreload" href="/design-kit/assets/script-def.js">';
        expect(downloadsOf(HEAD + twice).scripts).toHaveLength(2);
    });

    it('refuse a script or a sheet from outside the build by name', () => {
        expect(() =>
            downloadsOf('<script type="module" src="/elsewhere/script.js"></script>')
        ).toThrow('/elsewhere/script.js is not among the built assets');
        expect(() => downloadsOf('<link rel="stylesheet" href="/kit.css">')).toThrow(
            '/kit.css is not among the built assets'
        );
    });
});

describe("a page's budget", () => {
    it("is every page's, but for the script of the behavior page and the sheets of the own palette page", () => {
        for (const { file } of ROUTES) {
            expect(budgetOf(file), file).toEqual({
                script: file === 'behavior/index.html' ? BEHAVIOR_SCRIPT_BUDGET : SCRIPT_BUDGET,
                style: file === 'own-palette/index.html' ? OWN_PALETTE_STYLE_BUDGET : STYLE_BUDGET,
            });
        }
        expect(BEHAVIOR_SCRIPT_BUDGET).toBeGreaterThan(SCRIPT_BUDGET);
        expect(OWN_PALETTE_STYLE_BUDGET).toBeGreaterThan(STYLE_BUDGET);
    });

    it('passes a page at it, and names each kind past it with both sizes', () => {
        const budget = { script: 2048, style: 4096 };
        expect(pastBudget(budget, budget)).toEqual([]);
        expect(pastBudget({ script: 2049, style: 4096 }, budget)).toEqual([
            'script 2.00 KB past 2.00 KB',
        ]);
        expect(pastBudget({ script: 3072, style: 5120 }, budget)).toEqual([
            'script 3.00 KB past 2.00 KB',
            'sheets 5.00 KB past 4.00 KB',
        ]);
    });

    it('fails a page with no script or no sheet found, which would otherwise pass unmeasured', () => {
        expect(pastBudget({ script: 0, style: 0 }, { script: 2048, style: 4096 })).toEqual([
            'no script found to measure',
            'no sheets found to measure',
        ]);
    });
});
