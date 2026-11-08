/**
 * What a check writes to its run's page on GitHub, so a reviewer sees what it found without
 * opening the log: a table or a line, never the log itself, and nothing at all outside a run.
 *
 * Run as `node scripts/summary.mjs playwright <report.json> <title>` after a browser test run, or
 * `node scripts/summary.mjs package <workspace>` after packing. The Lighthouse audit calls
 * `lighthouseSummary` itself.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

import { isRunDirectly } from './repository.mjs';

/**
 * Appends to the run's summary, or does nothing outside a run, where there is none.
 *
 * @param {string} markdown
 * @param {Record<string, string | undefined>} [env]
 */
export const writeSummary = (markdown, env = process.env) => {
    const file = env['GITHUB_STEP_SUMMARY'];
    if (file) appendFileSync(file, markdown);
};

/**
 * A Markdown table, with a bar in a cell escaped so it stays in its cell.
 *
 * @param {readonly string[]} head
 * @param {readonly (readonly string[])[]} rows
 */
export const table = (head, rows) => {
    /** @param {readonly string[]} cells */
    const row = (cells) => `| ${cells.map((cell) => cell.replaceAll('|', '\\|')).join(' | ')} |\n`;
    return row(head) + row(head.map(() => '---')) + rows.map(row).join('');
};

/**
 * @typedef {{
 *     path: string,
 *     accessibility: number,
 *     performance: number,
 *     paint: number,
 *     shift: number,
 * }} LighthousePage
 * @typedef {{ performance: number, paint: number, shift: number }} LighthouseGates
 */

/**
 * Each page's scores against the gates, and which it missed.
 *
 * @param {readonly LighthousePage[]} pages
 * @param {LighthouseGates} gates
 */
export const lighthouseSummary = (pages, gates) => {
    const rows = pages.map((page) => {
        const missed = [
            ...(page.accessibility < 100 ? ['accessibility'] : []),
            ...(page.performance < gates.performance ? ['performance'] : []),
            ...(page.paint > gates.paint ? ['largest paint'] : []),
            ...(page.shift > gates.shift ? ['layout shift'] : []),
        ];
        return [
            page.path,
            String(page.accessibility),
            String(Math.round(page.performance * 100)),
            `${String(Math.round(page.paint))} ms`,
            page.shift.toFixed(3),
            missed.length === 0 ? 'Pass' : `Missed: ${missed.join(', ')}`,
        ];
    });
    return (
        '### Lighthouse\n\n' +
        `Each page on a first visit as a slow phone makes it, held to accessibility 100, ` +
        `performance ${String(Math.round(gates.performance * 100))} or more, a largest paint ` +
        `within ${String(gates.paint)} ms and a layout shift of ${String(gates.shift)} or less.\n\n` +
        table(
            ['Page', 'Accessibility', 'Performance', 'Largest paint', 'Layout shift', 'Result'],
            rows
        )
    );
};

/**
 * @typedef {{ status: string }} PlaywrightTest
 * @typedef {{ title: string, file: string, line: number, tests: PlaywrightTest[] }} PlaywrightSpec
 * @typedef {{ title: string, file: string, specs?: PlaywrightSpec[], suites?: PlaywrightSuite[] }} PlaywrightSuite
 * @typedef {{
 *     config?: { rootDir?: string },
 *     stats: { expected: number, unexpected: number, flaky: number, skipped: number },
 *     suites: PlaywrightSuite[],
 * }} PlaywrightReport
 */

/**
 * A browser test run's totals in a line, and when a test failed, each failing test by its file and
 * line, and where its report is kept.
 *
 * @param {PlaywrightReport} report
 * @param {{ title: string, runUrl: string, root?: string }} where `root` is the folder the
 *     report's files are named from, relative to the repository, so each line names a file a reader
 *     can open.
 */
export const playwrightSummary = (report, { title, runUrl, root = '' }) => {
    const { expected, unexpected, flaky, skipped } = report.stats;
    const totals = [
        `${String(expected)} passed`,
        ...(unexpected > 0 ? [`${String(unexpected)} failed`] : []),
        ...(flaky > 0 ? [`${String(flaky)} passed on a retry`] : []),
        ...(skipped > 0 ? [`${String(skipped)} skipped`] : []),
    ].join(', ');
    /** @type {string[]} */
    const failing = [];
    /**
     * @param {PlaywrightSuite} suite
     * @param {readonly string[]} groups
     */
    const walk = (suite, groups) => {
        for (const spec of suite.specs ?? []) {
            if (spec.tests.some((test) => test.status === 'unexpected')) {
                const name = [...groups, spec.title].join(' › ');
                failing.push(`- ${name} (\`${join(root, spec.file)}:${String(spec.line)}\`)`);
            }
        }
        for (const inner of suite.suites ?? []) walk(inner, [...groups, inner.title]);
    };
    // A file's own suite is named by the file, which each line already gives, so its title is
    // left out of the names.
    for (const suite of report.suites) walk(suite, []);
    const lines = [`### ${title}`, '', `${totals}.`];
    if (failing.length > 0) {
        lines.push(
            '',
            'Failed:',
            '',
            ...failing,
            '',
            `The report, with each failure's trace and screenshot, is in [the run’s artifacts](${runUrl}#artifacts).`
        );
    }
    return `${lines.join('\n')}\n`;
};

/** @param {number} bytes */
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

/**
 * @typedef {{ path: string, size: number, gzip: number }} PackedFile
 * @typedef {{ name: string, version: string, size: number, files: PackedFile[] }} Packed
 */

/**
 * The package as npm ships it: the files a page loads, raw and gzipped, and every file folded away
 * under them.
 *
 * @param {Packed} packed
 * @param {(path: string) => boolean} loads
 */
export const packageSummary = (packed, loads) => {
    /** @param {readonly PackedFile[]} files */
    const rows = (files) => files.map((file) => [file.path, kb(file.size), kb(file.gzip)]);
    return (
        '### Package size\n\n' +
        `\`${packed.name}@${packed.version}\`, ${kb(packed.size)} packed.\n\n` +
        'Its styles and scripts:\n\n' +
        table(['File', 'Raw', 'Gzipped'], rows(packed.files.filter((file) => loads(file.path)))) +
        '\n<details>\n<summary>Every file in the package</summary>\n\n' +
        table(['File', 'Raw', 'Gzipped'], rows(packed.files)) +
        '\n</details>\n'
    );
};

/**
 * A workspace packed as npm would pack it, each file measured raw and gzipped.
 *
 * @param {string} workspace
 * @returns {Packed}
 */
const packedOf = (workspace) => {
    /** @type {{ name: string, version: string, size: number, files: { path: string, size: number }[] }[]} */
    const [packed] = JSON.parse(
        execFileSync(
            'npm',
            ['pack', '--dry-run', '--json', '--ignore-scripts', '--workspace', workspace],
            {
                encoding: 'utf8',
            }
        )
    );
    if (!packed) throw new Error(`npm packed nothing for ${workspace}`);
    // The workspace's folder, found by its name among the folders under packages/.
    const where = readdirSync('packages')
        .map((folder) => join('packages', folder))
        .find((folder) => {
            try {
                /** @type {{ name?: unknown }} */
                const manifest = JSON.parse(readFileSync(join(folder, 'package.json'), 'utf8'));
                return manifest.name === workspace;
            } catch {
                return false;
            }
        });
    if (where === undefined) throw new Error(`no workspace under packages/ is named ${workspace}`);
    return {
        name: packed.name,
        version: packed.version,
        size: packed.size,
        files: packed.files.map(({ path, size }) => ({
            path,
            size,
            gzip: gzipSync(readFileSync(join(where, path))).length,
        })),
    };
};

if (isRunDirectly(import.meta.url)) {
    const [kind, first, second] = process.argv.slice(2);
    const runUrl = `${process.env['GITHUB_SERVER_URL'] ?? ''}/${process.env['GITHUB_REPOSITORY'] ?? ''}/actions/runs/${process.env['GITHUB_RUN_ID'] ?? ''}`;
    if (kind === 'playwright' && first && second) {
        /** @type {PlaywrightReport} */
        const report = JSON.parse(readFileSync(first, 'utf8'));
        const root = report.config?.rootDir ? relative(process.cwd(), report.config.rootDir) : '';
        writeSummary(playwrightSummary(report, { title: second, runUrl, root }));
    } else if (kind === 'package' && first) {
        writeSummary(
            packageSummary(
                packedOf(first),
                (path) => /\.(css|js|mjs)$/.test(path) && !/\.d\.ts$/.test(path)
            )
        );
    } else {
        console.error('Usage: summary.mjs playwright <report.json> <title> | package <workspace>');
        process.exitCode = 1;
    }
}
