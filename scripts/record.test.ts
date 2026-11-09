import { existsSync, readFileSync } from 'node:fs';

import { format } from 'prettier';
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
        // The local date the run was made, not the date in UTC.
        expect(now.date).toBe(new Date().toLocaleDateString('en-CA'));
        expect(now.commit).toMatch(/^[0-9a-f]{7,}$|^unknown$/);
        expect(now.machine).toMatch(/, \d+ cores$/);
        expect(now.node).toBe(process.version);
        expect(recordedTable(RECORDED)).toContain(
            '| 2026-11-09 | `abc1234` | Apple M2 Max, 12 cores | v24.22.2 |'
        );
    });

    it('records the sheets a page loads, then the modules a build imports, then the rest', () => {
        const { markdown, json } = packageRecord(
            {
                name: '@jasonsdevspace/design-kit',
                version: '0.1.0-next.6',
                size: 40960,
                files: [
                    { path: 'CHANGELOG.md', size: 9000, gzip: 3000 },
                    { path: 'dist/react.js', size: 10240, gzip: 3072 },
                    { path: 'dist/tokens.css', size: 6144, gzip: 2048 },
                    { path: 'dist/vite.js', size: 3072, gzip: 1024 },
                ],
            },
            RECORDED
        );
        expect(markdown).toContain('npm run bench:package');
        expect(markdown).toContain('[package-size.json](package-size.json)');
        expect(markdown).toContain('`@jasonsdevspace/design-kit@0.1.0-next.6`');
        expect(markdown).toContain('40.0 KB');
        expect(markdown).toContain('| dist/tokens.css | 6.0 KB | 2.0 KB |');
        const at = (text: string) => markdown.indexOf(text);
        expect(at('The sheets a page loads')).toBeLessThan(at('dist/tokens.css'));
        expect(at('dist/tokens.css')).toBeLessThan(at('The modules a page'));
        expect(at('The modules a page')).toBeLessThan(at('dist/vite.js'));
        expect(at('dist/vite.js')).toBeLessThan(at('Every other file'));
        expect(at('Every other file')).toBeLessThan(at('CHANGELOG.md'));
        // Each table ends before the sentence after it, as Markdown needs.
        expect(markdown).not.toMatch(/\|\n[A-Z]/);
        expect(JSON.parse(json)).toMatchObject({ recorded: RECORDED, size: 40960 });
    });

    it("records each page's scores, paint, shift and downloads, reproduced by the audit", () => {
        const { markdown, json } = pagesRecord(
            [
                {
                    path: '/design-kit/',
                    accessibility: 100,
                    performance: 99,
                    paint: 912.4,
                    shift: 0.0012,
                    bytes: 81920,
                    requests: 7,
                },
            ],
            RECORDED,
            { lighthouse: '13.5.0', chrome: '141', kit: '0.1.0' }
        );
        expect(markdown).toContain('npm run bench:pages');
        expect(markdown).toContain('npm run lighthouse');
        expect(markdown).toContain('[site-pages.json](site-pages.json)');
        expect(markdown).toContain('| /design-kit/ | 100 | 99 | 912 ms | 0.001 | 80.0 KB | 7 |');
        expect(markdown).toContain('only when every page passes');
        expect(markdown).toContain(
            'Measured with Lighthouse 13.5.0 in Chrome 141, the site drawing from version 0.1.0 of the kit.'
        );
        expect(JSON.parse(json)).toMatchObject({
            recorded: RECORDED,
            tools: { lighthouse: '13.5.0', chrome: '141', kit: '0.1.0' },
            pages: [{ path: '/design-kit/', performance: 99 }],
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

    it('keeps each page exactly as its raw results make it, so neither is edited alone', async () => {
        const read = (name: string) => readFileSync(at(`docs/benchmarks/${name}`), 'utf8');
        const made = async (markdown: string) =>
            format(markdown, { parser: 'markdown', filepath: 'record.md' });
        const packed = JSON.parse(read('package-size.json')) as Parameters<
            typeof packageRecord
        >[0] & {
            recorded: Parameters<typeof packageRecord>[1];
        };
        const { recorded: packedAt, ...packageOnly } = packed;
        expect(await made(packageRecord(packageOnly, packedAt).markdown)).toBe(
            await made(read('package-size.md'))
        );
        const pages = JSON.parse(read('site-pages.json')) as {
            recorded: Parameters<typeof pagesRecord>[1];
            tools: Parameters<typeof pagesRecord>[2];
            pages: Parameters<typeof pagesRecord>[0];
        };
        expect(await made(pagesRecord(pages.pages, pages.recorded, pages.tools).markdown)).toBe(
            await made(read('site-pages.md'))
        );
    });

    it('states the packed size the package record holds, so the README cannot keep an old one', () => {
        const { size } = JSON.parse(
            readFileSync(at('docs/benchmarks/package-size.json'), 'utf8')
        ) as { size: number };
        const stated = /(\d+) KB packed/.exec(readFileSync(at('README.md'), 'utf8'))?.[1];
        expect(stated).toBe(String(Math.round(size / 1024)));
    });

    it('links each record from the README', () => {
        const readme = readFileSync(at('README.md'), 'utf8');
        expect(readme).toContain('(docs/benchmarks/package-size.md)');
        expect(readme).toContain('(docs/benchmarks/site-pages.md)');
    });
});
