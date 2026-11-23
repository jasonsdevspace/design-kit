/**
 * The bytes of script and of sheets a page of the site may download, gzipped as GitHub Pages sends
 * them, which the audit holds every page to over the files the build wrote.
 *
 * Each budget is the larger of two measures, the site built over the kit it pins and over the kit
 * on main, which the next pin brings, with a twentieth more for headroom, rounded up to a quarter
 * of a kilobyte. A page past its budget either gives the bytes back or raises the budget by the
 * same rule, in the pull request that adds them, so growth is always a choice someone made.
 *
 * A page's script is the file its HTML loads and each one it preloads, which is all it runs before
 * it answers. The theme script is inline in the page and is the kit's to budget, so it is not
 * counted here.
 */

/** What a page may download of each kind, in bytes. */
export interface Budget {
    readonly script: number;
    readonly style: number;
}

const KB = 1024;

/** The script every page loads but the behavior page, which loads its own examples' code too. */
export const SCRIPT_BUDGET = 15.5 * KB;

/** The behavior page's script: every page's, and the code of the examples it alone shows. */
export const BEHAVIOR_SCRIPT_BUDGET = 17 * KB;

/** The kit's sheets and the site's own, which every page loads as one file. */
export const STYLE_BUDGET = 14 * KB;

/** The own palette page's sheets: every page's, and the sheet that sets its palette and column. */
export const OWN_PALETTE_STYLE_BUDGET = 14.25 * KB;

/** The pages whose budgets are their own, by the HTML file each is built from. */
const OWN: Readonly<Record<string, Partial<Budget>>> = {
    'behavior/index.html': { script: BEHAVIOR_SCRIPT_BUDGET },
    'own-palette/index.html': { style: OWN_PALETTE_STYLE_BUDGET },
};

/** The budget of the page built from an HTML file of the routes. */
export const budgetOf = (file: string): Budget => ({
    script: SCRIPT_BUDGET,
    style: STYLE_BUDGET,
    ...OWN[file],
});

/** The files a built page downloads at once, each named from the build's assets folder down. */
export interface Downloads {
    readonly scripts: readonly string[];
    readonly styles: readonly string[];
}

/**
 * The scripts and the sheets a built page's HTML names: each script it loads or preloads, and each
 * sheet it links. Every one is served under the site's base, so its path is read from the assets
 * folder down. A file from anywhere else is one the audit cannot measure, so it is refused by name
 * rather than left out of the sum.
 */
export const downloadsOf = (html: string): Downloads => {
    const named = (pattern: RegExp) => [
        ...new Set(
            [...html.matchAll(pattern)].map((match) => {
                const address = match[1] ?? '';
                const at = address.indexOf('assets/');
                if (at === -1) throw new Error(`${address} is not among the built assets`);
                return address.slice(at);
            })
        ),
    ];
    return {
        scripts: named(/<(?:script\b[^>]*\ssrc|link rel="modulepreload"[^>]*\shref)="([^"]+)"/g),
        styles: named(/<link rel="stylesheet"[^>]*\shref="([^"]+)"/g),
    };
};

/** A size in kilobytes, to a hundredth, which tells a budget from a size just past it. */
const kb = (bytes: number) => `${(bytes / KB).toFixed(2)} KB`;

/**
 * What a page's bytes miss of its budget, each in a few words, or nothing when both fit. A kind
 * with no bytes at all is a miss too, since every page loads a script and a sheet, and a page the
 * reader found none on would otherwise pass unmeasured.
 */
export const pastBudget = (sizes: Budget, budget: Budget): readonly string[] =>
    (
        [
            ['script', sizes.script, budget.script],
            ['sheets', sizes.style, budget.style],
        ] as const
    ).flatMap(([kind, size, most]) => {
        if (size === 0) return [`no ${kind} found to measure`];
        return size > most ? [`${kind} ${kb(size)} past ${kb(most)}`] : [];
    });
