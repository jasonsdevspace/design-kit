import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
    lighthouseSummary,
    packageSummary,
    playwrightSummary,
    table,
    writeSummary,
} from './summary.mjs';

/*
 * What each check writes to its run's page: a table or a line a reviewer reads at a glance, never
 * the log, and nothing at all outside a run.
 */

const made: string[] = [];
afterEach(() => {
    for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('a summary', () => {
    it('lays out a table, keeping a cell with a bar in it whole', () => {
        expect(table(['Page', 'Result'], [['/a|b/', 'Pass']])).toBe(
            '| Page | Result |\n| --- | --- |\n| /a\\|b/ | Pass |\n'
        );
    });

    it('appends to the run summary, and writes nothing outside a run', () => {
        const dir = mkdtempSync(join(tmpdir(), 'summary-'));
        made.push(dir);
        const file = join(dir, 'summary.md');
        writeSummary('one\n', { GITHUB_STEP_SUMMARY: file });
        writeSummary('two\n', { GITHUB_STEP_SUMMARY: file });
        expect(readFileSync(file, 'utf8')).toBe('one\ntwo\n');
        expect(() => {
            writeSummary('nowhere\n', {});
        }).not.toThrow();
    });
});

describe('the Lighthouse summary', () => {
    const gates = { performance: 0.9, paint: 2500, shift: 0.1 };

    it('gives a row for each page against the gates, and says which missed', () => {
        const text = lighthouseSummary(
            [
                { path: '/design-kit/', accessibility: 100, performance: 1, paint: 910, shift: 0 },
                {
                    path: '/design-kit/controls/',
                    accessibility: 96,
                    performance: 0.88,
                    paint: 2600,
                    shift: 0.12,
                },
            ],
            gates
        );
        expect(text).toContain('### Lighthouse');
        expect(text).toContain('| /design-kit/ | 100 | 100 | 910 ms | 0.000 | Pass |');
        expect(text).toContain(
            '| /design-kit/controls/ | 96 | 88 | 2600 ms | 0.120 | Missed: accessibility, performance, largest paint, layout shift |'
        );
        expect(text).toContain('accessibility 100, performance 90 or more');
    });
});

describe('the browser test summary', () => {
    const report = (failing: boolean) => ({
        stats: { expected: failing ? 3 : 4, unexpected: failing ? 1 : 0, flaky: 0, skipped: 1 },
        suites: [
            {
                title: 'site.spec.ts',
                file: 'packages/site/e2e/site.spec.ts',
                specs: [],
                suites: [
                    {
                        title: 'the theme switch',
                        file: 'packages/site/e2e/site.spec.ts',
                        specs: [
                            {
                                title: 'saves a choice',
                                file: 'packages/site/e2e/site.spec.ts',
                                line: 12,
                                tests: [{ status: failing ? 'unexpected' : 'expected' }],
                            },
                        ],
                    },
                ],
            },
        ],
    });

    it('gives the totals in a line when every test passed', () => {
        expect(playwrightSummary(report(false), { title: 'Browser tests', runUrl: 'u' })).toBe(
            '### Browser tests\n\n4 passed, 1 skipped.\n'
        );
    });

    it('names each failing test by its file and line, and links the report', () => {
        const text = playwrightSummary(
            { ...report(true), suites: report(true).suites.map((suite) => ({ ...suite })) },
            { title: 'Browser tests', runUrl: 'https://github.com/o/r/actions/runs/1' }
        );
        expect(text).toContain('3 passed, 1 failed, 1 skipped.');
        expect(text).toContain(
            '- the theme switch › saves a choice (`packages/site/e2e/site.spec.ts:12`)'
        );
        expect(text).toContain(
            '[the run’s artifacts](https://github.com/o/r/actions/runs/1#artifacts)'
        );
    });

    it('names each file from the repository, where the report names it from its test folder', () => {
        const failing = report(true);
        const moved = failing.suites.map((suite) => ({
            ...suite,
            suites: suite.suites.map((inner) => ({
                ...inner,
                specs: inner.specs.map((spec) => ({ ...spec, file: 'site/e2e/site.spec.ts' })),
            })),
        }));
        const text = playwrightSummary(
            { ...failing, suites: moved },
            { title: 'Browser tests', runUrl: 'u', root: 'packages' }
        );
        expect(text).toContain('(`packages/site/e2e/site.spec.ts:12`)');
    });
});

describe('the package summary', () => {
    it('gives what a page loads first, raw and gzipped, and every file folded away', () => {
        const text = packageSummary(
            {
                name: '@o/kit',
                version: '1.0.0',
                size: 20480,
                files: [
                    { path: 'dist/tokens.css', size: 4096, gzip: 1024 },
                    { path: 'dist/react.js', size: 8192, gzip: 2048 },
                    { path: 'dist/react.d.ts', size: 2048, gzip: 512 },
                    { path: 'README.md', size: 6144, gzip: 2560 },
                ],
            },
            (path) => /\.(css|js)$/.test(path)
        );
        expect(text).toContain('### Package size');
        expect(text).toContain('`@o/kit@1.0.0`, 20.0 KB packed.');
        expect(text).toContain('| dist/tokens.css | 4.0 KB | 1.0 KB |');
        expect(text).toContain('| dist/react.js | 8.0 KB | 2.0 KB |');
        expect(text).toMatch(/<details>\n<summary>Every file in the package<\/summary>/);
        expect(text.indexOf('README.md')).toBeGreaterThan(text.indexOf('<details>'));
    });
});
