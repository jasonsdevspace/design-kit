import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { packageRecord, pagesRecord, recorded, recordedTable } from './record.mjs';

/*
 * The records of what the package weighs and how the site's pages score: each says when, at which
 * commit, on which machine and Node it ran, beside the raw results, and the README links each.
 */

const RECORDED = {
    date: '2026-11-09',
    commit: 'abc1234',
    machine: 'Apple M2 Max, 12 cores',
    node: 'v24.22.2',
};

describe('a record', () => {
    it('names when and where it ran', () => {
        const now = recorded();
        expect(now.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(now.commit).toMatch(/^[0-9a-f]{7,}$|^unknown$/);
        expect(now.machine).toMatch(/, \d+ cores$/);
        expect(now.node).toBe(process.version);
        expect(recordedTable(RECORDED)).toContain(
            '| 2026-11-09 | `abc1234` | Apple M2 Max, 12 cores | v24.22.2 |'
        );
    });

    it('records the package file by file, raw and gzipped, the files a page loads first', () => {
        const { markdown, json } = packageRecord(
            {
                name: '@jasonsdevspace/design-kit',
                version: '0.1.0-next.6',
                size: 40960,
                files: [
                    { path: 'CHANGELOG.md', size: 9000, gzip: 3000 },
                    { path: 'dist/tokens.css', size: 6144, gzip: 2048 },
                    { path: 'dist/react.js', size: 10240, gzip: 3072 },
                ],
            },
            RECORDED
        );
        expect(markdown).toContain('npm run bench:package');
        expect(markdown).toContain('[package-size.json](package-size.json)');
        expect(markdown).toContain('`@jasonsdevspace/design-kit@0.1.0-next.6`');
        expect(markdown).toContain('40.0 KB');
        expect(markdown).toContain('| dist/tokens.css | 6.0 KB | 2.0 KB |');
        expect(markdown.indexOf('dist/react.js')).toBeLessThan(markdown.indexOf('CHANGELOG.md'));
        expect(JSON.parse(json)).toMatchObject({ recorded: RECORDED, size: 40960 });
    });

    it("records each page's scores, paint, shift and downloads, reproduced by the audit", () => {
        const { markdown, json } = pagesRecord(
            [
                {
                    path: '/design-kit/',
                    accessibility: 100,
                    performance: 0.99,
                    paint: 912.4,
                    shift: 0.0012,
                    bytes: 81920,
                    requests: 7,
                },
            ],
            RECORDED
        );
        expect(markdown).toContain('npm run bench:pages');
        expect(markdown).toContain('npm run lighthouse');
        expect(markdown).toContain('[site-pages.json](site-pages.json)');
        expect(markdown).toContain('| /design-kit/ | 100 | 99 | 912 ms | 0.001 | 80.0 KB | 7 |');
        expect(JSON.parse(json)).toMatchObject({
            recorded: RECORDED,
            pages: [{ path: '/design-kit/' }],
        });
    });
});

describe('the records in the repository', () => {
    const at = (path: string) => new URL(`../${path}`, import.meta.url);

    it.each(['package-size', 'site-pages'])(
        'keeps %s beside its raw results, recorded and dated',
        (name) => {
            expect(existsSync(at(`docs/benchmarks/${name}.json`))).toBe(true);
            const markdown = readFileSync(at(`docs/benchmarks/${name}.md`), 'utf8');
            expect(markdown).toContain(`(${name}.json)`);
            const raw = JSON.parse(readFileSync(at(`docs/benchmarks/${name}.json`), 'utf8')) as {
                recorded: Record<string, string>;
            };
            expect(Object.keys(raw.recorded).sort()).toEqual(['commit', 'date', 'machine', 'node']);
            expect(markdown).toContain(`\`${raw.recorded['commit'] ?? ''}\``);
        }
    );

    it('links each record from the README', () => {
        const readme = readFileSync(at('README.md'), 'utf8');
        expect(readme).toContain('(docs/benchmarks/package-size.md)');
        expect(readme).toContain('(docs/benchmarks/site-pages.md)');
    });
});
