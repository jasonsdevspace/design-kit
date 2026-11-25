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
export const SCRIPT_BUDGET = 13.5 * KB;

/**
 * The behavior page's script: every page's, the code of the examples it alone shows, and the kit's
 * form, busy button and focus requests, which only those examples use.
 */
export const BEHAVIOR_SCRIPT_BUDGET = 19.75 * KB;

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

/** A tag's attributes by name, in lower case, whichever way each value is quoted. */
const attributesOf = (tag: string): ReadonlyMap<string, string> =>
    new Map(
        [...tag.matchAll(/\s([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>]+)))?/g)].map(
            (match) => [(match[1] ?? '').toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '']
        )
    );

/**
 * The file a script or a link tag has the page download and which kind it counts as, or nothing
 * for a script with no address, which is inline, and a link to anything but a sheet or a module.
 */
const namedBy = (
    tag: string,
    isScript: boolean
): { address: string; kind: 'script' | 'style' } | undefined => {
    const attributes = attributesOf(tag);
    const address = attributes.get(isScript ? 'src' : 'href');
    if (address === undefined) return undefined;
    if (isScript) return { address, kind: 'script' };
    const rel = (attributes.get('rel') ?? '').toLowerCase().split(/\s+/);
    if (rel.includes('modulepreload')) return { address, kind: 'script' };
    return rel.includes('stylesheet') ? { address, kind: 'style' } : undefined;
};

/**
 * The scripts and the sheets a built page's HTML names: each script it loads or preloads, and each
 * sheet it links, whatever the order of a tag's attributes and however each is quoted. Every one
 * is served from the build's assets folder under the site's base, so its address must start there,
 * and its path is read from the assets folder down. A file from another folder or another origin
 * is one the audit cannot measure, so it is refused by name, not left out of the sum. So is a
 * page that names a built script or sheet in any other way, which would be downloaded and not
 * counted.
 *
 * @param html the built page
 * @param base the path the site is served under, such as `/design-kit/`
 */
export const downloadsOf = (html: string, base: string): Downloads => {
    const scripts = new Set<string>();
    const styles = new Set<string>();
    const built = `${base}assets/`;
    for (const [tag, name = ''] of html.matchAll(/<(script|link)\b[^>]*>/gi)) {
        const named = namedBy(tag, name.toLowerCase() === 'script');
        if (named === undefined) continue;
        const { address, kind } = named;
        if (!address.startsWith(built)) throw new Error(`${address} is not among the built assets`);
        (kind === 'script' ? scripts : styles).add(address.slice(base.length));
    }
    // Every built script and sheet the page names anywhere, each of which must have been counted.
    for (const [address] of html.matchAll(/[^\s"'<>=()]+\.(?:js|css)(?![\w.-])/g)) {
        const at = address.indexOf(built);
        const file = address.slice(at + base.length);
        if (at !== -1 && !scripts.has(file) && !styles.has(file)) {
            throw new Error(`${address.slice(at)} is named in the page and not counted`);
        }
    }
    return { scripts: [...scripts], styles: [...styles] };
};

/** A size in kilobytes, to a hundredth, as the gate's misses and the audit's log write it. */
export const kb = (bytes: number) => `${(bytes / KB).toFixed(2)} KB`;

/**
 * What a page's bytes miss of its budget, each in a few words, or nothing when both fit. A kind
 * with no bytes at all is a miss too, since every page loads a script and a sheet, and a page the
 * reader found none on would otherwise pass unmeasured. A size that rounds to its budget is said in
 * the bytes it is over, so a miss never reads as a size past itself.
 */
export const pastBudget = (sizes: Budget, budget: Budget): readonly string[] =>
    (
        [
            ['script', sizes.script, budget.script],
            ['sheets', sizes.style, budget.style],
        ] as const
    ).flatMap(([kind, size, most]) => {
        if (size === 0) return [`no ${kind} found to measure`];
        if (size <= most) return [];
        const over = Math.ceil(size - most);
        const by =
            kb(size) === kb(most) ? `${String(over)} ${over === 1 ? 'byte' : 'bytes'}` : kb(size);
        return [`${kind} ${by} past ${kb(most)}`];
    });

/** A page as the gate weighed it: its sizes, where they could be measured, and what it missed. */
export interface Weighed {
    readonly sizes?: Budget;
    readonly missed: readonly string[];
}

/**
 * A page weighed against its budget. A page whose downloads cannot be read is a miss that says
 * why, not an error, so the audit carries on to the other pages and its summary lists this one.
 *
 * @param measure reads the page's sizes, and throws where it cannot
 */
export const weighed = (measure: () => Budget, budget: Budget): Weighed => {
    try {
        const sizes = measure();
        return { sizes, missed: pastBudget(sizes, budget) };
    } catch (error) {
        const why = error instanceof Error ? error.message : String(error);
        return { missed: [`downloads not measured, ${why}`] };
    }
};
