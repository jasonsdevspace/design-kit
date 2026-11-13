/**
 * The records under `docs/benchmarks` of what the package weighs and how the site's pages score,
 * each a Markdown page beside the raw results as JSON, as ShelfLens keeps its own.
 *
 *   npm run bench:package
 *
 * runs this file, which packs the package and records it.
 *
 *   npm run bench:pages
 *
 * runs the site's Lighthouse audit, which records the pages through `pagesRecord` once every page
 * passes.
 *
 * Every record says when it ran, at which commit, on which machine and on which Node, so a figure
 * in it can be traced to the run that measured it. It refuses to record from a working tree with
 * changes outside the records, since the commit it names would not be the code it measured.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { cpus, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { functionsOf, piecesOf } from './parts.mjs';
import { isRunDirectly } from './repository.mjs';
import { fileRows, filesOf, isModule, isSheet, kb, packedOf, table } from './summary.mjs';

/**
 * What the record says of the sheets once they are measured without their comments, for a record
 * taken since, and nothing for one taken before.
 *
 * @param {readonly import('./summary.mjs').PackedFile[]} files
 */
const sheetsNote = (files) =>
    files.some((file) => file.stripped !== undefined)
        ? ", and each sheet is also shown gzipped without its comments and blank lines, which is most of what a page's minifier takes out, and which the sheets' budget holds for the three together"
        : '';

/**
 * The sheets as a table: each path, raw, gzipped, and gzipped without its comments and blank lines,
 * which the sheets' budget holds for the three together. A record taken before the sheets were
 * measured that way has no such column.
 *
 * @param {readonly import('./summary.mjs').PackedFile[]} sheets
 */
const sheetTable = (sheets) => {
    const measured = sheets.some((sheet) => sheet.stripped !== undefined);
    return table(
        ['File', 'Raw', 'Gzipped', ...(measured ? ['Without comments'] : [])],
        sheets.map((sheet) => [
            sheet.path,
            kb(sheet.size),
            kb(sheet.gzip),
            ...(measured ? [sheet.stripped === undefined ? '' : kb(sheet.stripped)] : []),
        ])
    );
};

/** @typedef {{ date: string, commit: string, machine: string, node: string }} Recorded */
/** @typedef {import('./summary.mjs').Packed} Packed */
/**
 * What the package record before this one measured, for a record to say what changed since.
 *
 * @typedef {{ date: string, commit: string, version: string, size: number, sheets: number }} PackageSince
 */
/**
 * What the pages record before this one measured, for a record to say what changed since.
 *
 * @typedef {{ date: string, commit: string, kit: string, bytes: number }} PagesSince
 */
/**
 * The package with what each part of it costs, for a record taken since the parts were measured.
 *
 * @typedef {Packed & { since?: PackageSince, pieces?: { piece: string, rules: number, gzip: number }[], functions?: { name: string, alone: number, added: number }[] }} Measured
 */
/**
 * A page of the site as the audit measured it on a first visit, its scores out of a hundred.
 *
 * @typedef {{ path: string, accessibility: number, performance: number, paint: number, shift: number, bytes: number, requests: number }} Page
 */
/**
 * What measured the pages: the Lighthouse and the Chrome, and the version of the kit the site drew
 * from, since the site draws the kit as npm publishes it at the version it pins.
 *
 * @typedef {{ lighthouse: string, chrome: string, kit: string }} Tools
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
 * Stops a recording run whose working tree has changes outside the records, since the commit the
 * record would name is not the code it measured. Commit the change, then record.
 */
export const requireCommitted = () => {
    const changed = execFileSync('git', ['status', '--porcelain', '--', '.', ':!docs/benchmarks'], {
        encoding: 'utf8',
    }).trim();
    if (changed !== '') {
        throw new Error(
            `Commit these before recording, so the record names the code it measured:\n${changed}`
        );
    }
};

/**
 * When and where this run is: the local date, the commit, the processor and its cores, and the
 * Node.
 *
 * @returns {Recorded}
 */
export const recorded = () => {
    const processors = cpus();
    return {
        date: new Date().toLocaleDateString('en-CA'),
        commit: commit(),
        machine: `${processors[0]?.model ?? 'unknown'}, ${String(processors.length)} cores`,
        node: process.version,
    };
};

/**
 * The table at the top of every record that says when and where it ran.
 *
 * @param {Recorded} at
 */
export const recordedTable = ({ date, commit: at, machine, node }) =>
    table(['Recorded', 'Commit', 'Machine', 'Node'], [[date, `\`${at}\``, machine, node]]);

/** The sheets a page loads together without their comments, the figure the sheets' budget holds. */
const sheetsOf = (/** @type {Packed} */ packed) =>
    packed.files.reduce((sum, file) => sum + (file.stripped ?? 0), 0);

/**
 * What changed since the package record before this one, for a record that knows it.
 *
 * @param {Measured} packed
 */
const packageSince = ({ since, ...packed }) =>
    since
        ? ` Since the record of \`${since.version}\` on ${since.date} at \`${since.commit}\`, it packs ${kb(packed.size)} where it packed ${kb(since.size)}, and the sheets a page loads come to ${kb(sheetsOf(packed))} without their comments where they came to ${kb(since.sheets)}.`
        : '';

/**
 * The package record kept under `docs/benchmarks`, as what changed is measured from, or nothing
 * where there is none.
 *
 * @returns {PackageSince | undefined}
 */
export const packageBefore = () => {
    try {
        /** @type {Packed & { recorded: Recorded }} */
        const before = JSON.parse(readFileSync(new URL('package-size.json', BENCHMARKS), 'utf8'));
        return {
            date: before.recorded.date,
            commit: before.recorded.commit,
            version: before.version,
            size: before.size,
            sheets: sheetsOf(before),
        };
    } catch {
        return undefined;
    }
};

/**
 * The pages record kept under `docs/benchmarks`, as what changed is measured from, or nothing where
 * there is none.
 *
 * @returns {PagesSince | undefined}
 */
export const pagesBefore = () => {
    try {
        /** @type {{ recorded: Recorded, tools: Tools, pages: Page[] }} */
        const before = JSON.parse(readFileSync(new URL('site-pages.json', BENCHMARKS), 'utf8'));
        return {
            date: before.recorded.date,
            commit: before.recorded.commit,
            kit: before.tools.kit,
            bytes: before.pages.reduce((sum, page) => sum + page.bytes, 0),
        };
    } catch {
        return undefined;
    }
};

/** A count of bytes, for a part too small to read in kilobytes. */
const bytes = (/** @type {number} */ count) => `${String(count)} B`;

/**
 * What each part of the package costs a page, for a record taken since the parts were measured,
 * and nothing for one taken before: each piece of the sheets, then each function of the controls,
 * the costliest named first.
 *
 * @param {Measured} packed
 */
const partsOf = (packed) => {
    const { pieces, functions } = packed;
    if (!pieces || !functions) return '';
    const named = (/** @type {readonly string[]} */ names) =>
        `${names.slice(0, -1).join(', ')} and ${names.at(-1) ?? ''}`;
    return `
What each piece costs the three sheets, as what they save sent together without their comments and gzipped once its rules are taken out, the costliest first. A rule belongs to the piece it draws. The costs add up to less than the whole, since a piece that repeats another saves little once taken out. The costliest are ${named(pieces.slice(0, 3).map(({ piece }) => piece))}.

${table(
    ['Piece', 'Rules', 'Costs'],
    pieces.map(({ piece, rules, gzip }) => [piece, String(rules), bytes(gzip)])
)}
What each function of the controls costs a page, as its bundler takes them without comments and gzipped: alone, on a page that imports only that one, and added, to a page that imports every other. The costliest added are ${named(functions.slice(0, 2).map(({ name }) => `\`${name}\``))}.

${table(
    ['Function', 'Alone', 'Added'],
    functions.map(({ name, alone, added }) => [`\`${name}\``, bytes(alone), bytes(added)])
)}`;
};

/**
 * The package as npm ships it, as a record: the tarball, then the sheets a page loads, then the
 * modules a page's build imports, each raw and gzipped, then every other file it carries.
 *
 * @param {Measured} packed
 * @param {Recorded} at
 */
export const packageRecord = (packed, at) => {
    const files = (/** @type {(path: string) => boolean} */ keep) =>
        table(['File', 'Raw', 'Gzipped'], fileRows(packed.files.filter((file) => keep(file.path))));
    const markdown = `# Package size

Run \`npm run bench:package\` to reproduce it. The raw results are in [package-size.json](package-size.json).

What a demo installs when it adds the kit, measured from the tarball \`npm pack\` makes, which is what npm publishes. Each file is shown as it sits in the package and gzipped, as a server would send it. A page loads the sheets it imports${sheetsNote(packed.files)}. Of the modules, the plugin in \`vite.js\` runs only in a build, the theme script from \`theme.js\` goes inline in the page's head, \`react.js\` reaches a visitor only on a page that renders React in the browser, and \`controls.js\` reaches one on a page that attaches a control.

${recordedTable(at)}
\`${packed.name}@${packed.version}\`, ${kb(packed.size)} packed.${packageSince(packed)}

The sheets a page loads:

${sheetTable(packed.files.filter((file) => isSheet(file.path)))}
The modules a page's build imports:

${files(isModule)}
Every other file the package carries, which a page never loads:

${files((path) => !isSheet(path) && !isModule(path))}${partsOf(packed)}`;
    return { markdown, json: `${JSON.stringify({ recorded: at, ...packed }, null, 4)}\n` };
};

/**
 * The site's pages as a record: each page's Lighthouse scores, largest paint, layout shift and what
 * it downloads, on a first visit as Lighthouse makes one, with the Lighthouse and Chrome that
 * measured it, since either changes the figures.
 *
 * @param {readonly Page[]} pages
 * @param {Recorded} at
 * @param {Tools} tools
 * @param {PagesSince} [since] the record before, for what changed since it
 */
export const pagesRecord = (pages, at, tools, since) => {
    const bytes = pages.reduce((sum, page) => sum + page.bytes, 0);
    const changed = since
        ? ` Since the record on ${since.date} at \`${since.commit}\`, drawn from version ${since.kit}, the pages download ${kb(bytes)} together where they downloaded ${kb(since.bytes)}.`
        : '';
    const markdown = `# Site pages

Run \`npm run bench:pages\` to reproduce it. It runs the audit \`npm run lighthouse\` runs, and writes the record only when every page passes. The raw results are in [site-pages.json](site-pages.json).

Each page of jasonsdevspace.com/design-kit/, built and served locally, on a first visit as Lighthouse makes one: a phone on a slow network, its processor slowed, with nothing cached. CI holds every page to accessibility of a hundred, performance of at least ninety, a largest paint within 2,500 ms and layout shift within 0.1. Where a page misses a performance gate on its first trace, it is measured twice more and judged on the middle of the three. The local server gzips each file, as GitHub Pages does, so what a page downloads is close to what a visitor's browser receives.

${recordedTable(at)}
Measured with Lighthouse ${tools.lighthouse} in Chrome ${tools.chrome}, the site drawing from version ${tools.kit} of the kit.${changed}

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
        String(page.performance),
        `${String(Math.round(page.paint))} ms`,
        page.shift.toFixed(3),
        kb(page.bytes),
        String(page.requests),
    ])
)}`;
    return {
        markdown,
        json: `${JSON.stringify({ recorded: at, tools, pages, ...(since ? { since } : {}) }, null, 4)}\n`,
    };
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
    requireCommitted();
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
        const packed = packedOf(join(into, tarball));
        // The package's files laid out as a page installs them, so its parts are measured from
        // what npm ships.
        const unpacked = join(into, 'package');
        for (const { path, bytes: content } of filesOf(readFileSync(join(into, tarball)))) {
            mkdirSync(dirname(join(unpacked, path)), { recursive: true });
            writeFileSync(join(unpacked, path), content);
        }
        const dist = join(unpacked, 'dist');
        const sheets = ['tokens.css', 'base.css', 'components.css'].map((name) =>
            readFileSync(join(dist, name), 'utf8')
        );
        /** @type {Record<string, unknown>} */
        const controls = await import(pathToFileURL(join(dist, 'controls.js')).href);
        const parts = {
            pieces: piecesOf(sheets),
            functions: await functionsOf(dist, Object.keys(controls).sort()),
        };
        const since = packageBefore();
        writeRecord(
            'package-size',
            packageRecord({ ...packed, ...parts, ...(since ? { since } : {}) }, recorded())
        );
    } finally {
        rmSync(into, { recursive: true, force: true });
    }
}
