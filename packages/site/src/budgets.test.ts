import { describe, expect, it } from 'vitest';

import {
    BEHAVIOR_SCRIPT_BUDGET,
    budgetOf,
    downloadsOf,
    OWN_PALETTE_STYLE_BUDGET,
    pastBudget,
    SCRIPT_BUDGET,
    STYLE_BUDGET,
    weighed,
} from './budgets.js';
import { BASE, ROUTES } from './routes.js';

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
        expect(downloadsOf(HEAD, BASE)).toEqual({
            scripts: ['assets/behavior/index.html-abc.js', 'assets/script-def.js'],
            styles: ['assets/script-ghi.css', 'assets/index-jkl.css'],
        });
    });

    it('count a file named twice once', () => {
        const twice = '<link rel="modulepreload" href="/design-kit/assets/script-def.js">';
        expect(downloadsOf(HEAD + twice, BASE).scripts).toHaveLength(2);
    });

    it('are found whatever the order of a tag’s attributes and however each is quoted', () => {
        const head = `
            <script src='/design-kit/assets/one.js' type="module"></script>
            <link href="/design-kit/assets/two.js" crossorigin rel="modulepreload">
            <LINK href=/design-kit/assets/three.css rel=stylesheet>
            <link crossorigin href='/design-kit/assets/four.css' rel='stylesheet'>`;
        expect(downloadsOf(head, BASE)).toEqual({
            scripts: ['assets/one.js', 'assets/two.js'],
            styles: ['assets/three.css', 'assets/four.css'],
        });
    });

    it('refuse a script or a sheet from outside the build by name', () => {
        for (const [tag, address] of [
            ['<script type="module" src="/elsewhere/script.js"></script>', '/elsewhere/script.js'],
            ['<link rel="stylesheet" href="/kit.css">', '/kit.css'],
            // Another folder and another origin, each with an assets folder of its own.
            [
                '<script type="module" src="/shelflens/assets/app.js"></script>',
                '/shelflens/assets/app.js',
            ],
            [
                '<link rel="stylesheet" href="https://example.com/design-kit/assets/kit.css">',
                'https://example.com/design-kit/assets/kit.css',
            ],
        ] as const) {
            expect(() => downloadsOf(tag, BASE), address).toThrow(
                `${address} is not among the built assets`
            );
        }
    });

    it('refuse a page that names a built script or sheet it does not count', () => {
        const imported = '<link rel="preload" as="script" href="/design-kit/assets/late.js">';
        expect(() => downloadsOf(HEAD + imported, BASE)).toThrow(
            '/design-kit/assets/late.js is named in the page and not counted'
        );
        const sheet = '<style>@import "/design-kit/assets/more.css";</style>';
        expect(() => downloadsOf(HEAD + sheet, BASE)).toThrow(
            '/design-kit/assets/more.css is named in the page and not counted'
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
        // A size that rounds to its budget is said in the bytes it is over.
        expect(pastBudget({ script: 2049, style: 4096 }, budget)).toEqual([
            'script 1 byte past 2.00 KB',
        ]);
        expect(pastBudget({ script: 2048, style: 4101 }, budget)).toEqual([
            'sheets 5 bytes past 4.00 KB',
        ]);
        expect(pastBudget({ script: 3072, style: 5120 }, budget)).toEqual([
            'script 3.00 KB past 2.00 KB',
            'sheets 5.00 KB past 4.00 KB',
        ]);
    });

    it('takes a page whose downloads cannot be read for a miss that says why, not an error', () => {
        const budget = { script: 2048, style: 4096 };
        expect(
            weighed(() => {
                throw new Error('/kit.css is not among the built assets');
            }, budget)
        ).toEqual({ missed: ['downloads not measured, /kit.css is not among the built assets'] });
        const sizes = { script: 3072, style: 4096 };
        expect(weighed(() => sizes, budget)).toEqual({
            sizes,
            missed: ['script 3.00 KB past 2.00 KB'],
        });
    });

    it('fails a page with no script or no sheet found, which would otherwise pass unmeasured', () => {
        expect(pastBudget({ script: 0, style: 0 }, { script: 2048, style: 4096 })).toEqual([
            'no script found to measure',
            'no sheets found to measure',
        ]);
    });
});
