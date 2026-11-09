/**
 * The records under `docs/benchmarks` of what the package weighs and how the site's pages score,
 * each a Markdown page beside the raw results as JSON, as ShelfLens keeps its own.
 *
 *   npm run bench:package
 *   npm run bench:pages
 *
 * Every record opens with when it ran, at which commit, on which machine and on which Node, so a
 * figure in it can be traced to the run that measured it.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { cpus, tmpdir } from 'node:os';
import { join } from 'node:path';

import { isRunDirectly } from './repository.mjs';
import { kb, packedOf, table } from './summary.mjs';

/** @typedef {{ date: string, commit: string, machine: string, node: string }} Recorded */
/** @typedef {import('./summary.mjs').Packed} Packed */
/**
 * A page of the site as the audit measured it on a first visit.
 *
 * @typedef {{ path: string, accessibility: number, performance: number, paint: number, shift: number, bytes: number, requests: number }} Page
 */

/** Where the records are kept, from the repository's root. */
export const BENCHMARKS = new URL('../docs/benchmarks/', import.meta.url);

/** The commit the working tree is at, short, or unknown outside a repository. */
const commit = () => {
    try {
        return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
    } catch {
        return 'unknown';
    }
};

/**
 * When and where this run is: today, the commit, the processor and its cores, and the Node.
 *
 * @returns {Recorded}
 */
export const recorded = () => ({
    date: new Date().toISOString().slice(0, 10),
    commit: commit(),
    machine: `${cpus()[0]?.model ?? 'unknown'}, ${String(cpus().length)} cores`,
    node: process.version,
});

/**
 * The table at the top of every record that says when and where it ran.
 *
 * @param {Recorded} at
 */
export const recordedTable = ({ date, commit: at, machine, node }) =>
    table(['Recorded', 'Commit', 'Machine', 'Node'], [[date, `\`${at}\``, machine, node]]);

/** Whether a page loads a file of the package: its sheets and its scripts. */
const loads = (/** @type {string} */ path) => /\.(css|js|mjs)$/.test(path);

/**
 * The package as npm ships it, as a record: the tarball, then the sheets and scripts a page loads,
 * raw and gzipped, then every other file it carries.
 *
 * @param {Packed} packed
 * @param {Recorded} at
 */
export const packageRecord = (packed, at) => {
    const rows = (/** @type {Packed['files']} */ files) =>
        files.map((file) => [file.path, kb(file.size), kb(file.gzip)]);
    const markdown = `# Package size

Run \`npm run bench:package\` to reproduce it. The raw results are in [package-size.json](package-size.json).

What a demo installs when it adds the kit, measured from the tarball \`npm pack\` makes, which is what npm publishes. Each file is shown as it sits in the package and gzipped, as a server would send it. A page loads only the sheets and scripts it imports, and a page that draws its markup by hand loads no script of the kit's at all.

${recordedTable(at)}
\`${packed.name}@${packed.version}\`, ${kb(packed.size)} packed.

The sheets and scripts a page may load:

${table(['File', 'Raw', 'Gzipped'], rows(packed.files.filter((file) => loads(file.path))))}
Every other file the package carries, which a page never loads:

${table(['File', 'Raw', 'Gzipped'], rows(packed.files.filter((file) => !loads(file.path))))}`;
    return { markdown, json: `${JSON.stringify({ recorded: at, ...packed }, null, 4)}\n` };
};

/**
 * The site's pages as a record: each page's Lighthouse scores, largest paint, layout shift and what
 * it downloads, on a first visit as Lighthouse makes one.
 *
 * @param {readonly Page[]} pages
 * @param {Recorded} at
 */
export const pagesRecord = (pages, at) => {
    const markdown = `# Site pages

Run \`npm run bench:pages\` to reproduce it, which runs the audit \`npm run lighthouse\` runs and records what it measured. The raw results are in [site-pages.json](site-pages.json).

Each page of jasonsdevspace.com/design-kit/, built and served locally, on a first visit as Lighthouse makes one: a phone on a slow network, its processor slowed, with nothing cached. CI holds every page to accessibility of a hundred, performance of at least ninety, a largest paint within 2,500 ms and layout shift within 0.1. Where a page misses on its first trace, it is measured twice more and judged on the middle. The local server gzips each file, as GitHub Pages does, so what a page downloads is close to what a visitor's browser receives.

${recordedTable(at)}
${table(
    [
        'Page',
        'Accessibility',
        'Performance',
        'Largest paint',
        'Layout shift',
        'Downloads',
        'Requests',
    ],
    pages.map((page) => [
        page.path,
        String(page.accessibility),
        String(Math.round(page.performance * 100)),
        `${String(Math.round(page.paint))} ms`,
        page.shift.toFixed(3),
        kb(page.bytes),
        String(page.requests),
    ])
)}`;
    return { markdown, json: `${JSON.stringify({ recorded: at, pages }, null, 4)}\n` };
};

/**
 * Writes a record's page and its raw results under `docs/benchmarks`.
 *
 * @param {string} name
 * @param {{ markdown: string, json: string }} record
 */
export const writeRecord = (name, { markdown, json }) => {
    writeFileSync(new URL(`${name}.md`, BENCHMARKS), markdown);
    writeFileSync(new URL(`${name}.json`, BENCHMARKS), json);
};

if (isRunDirectly(import.meta.url)) {
    // Packed as npm publishes it, which builds the package first, into a folder of its own.
    const into = mkdtempSync(join(tmpdir(), 'design-kit-pack-'));
    try {
        execFileSync(
            'npm',
            ['pack', '--workspace', '@jasonsdevspace/design-kit', '--pack-destination', into],
            { stdio: ['ignore', 'ignore', 'inherit'] }
        );
        const tarball = readdirSync(into).find((file) => file.endsWith('.tgz'));
        if (tarball === undefined) throw new Error('npm pack made no tarball');
        writeRecord('package-size', packageRecord(packedOf(join(into, tarball)), recorded()));
    } finally {
        rmSync(into, { recursive: true, force: true });
    }
}
