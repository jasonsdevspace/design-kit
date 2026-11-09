import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/*
 * The contributing guide and the accessibility statement say only what the repository does: every
 * command the guide names is one it runs, and every file either links is there.
 */

const at = (path: string) => new URL(`../${path}`, import.meta.url);
const read = (path: string) => readFileSync(at(path), 'utf8');

describe('the community files', () => {
    it.each(['CONTRIBUTING.md', 'ACCESSIBILITY.md'])('keeps %s', (file) => {
        expect(existsSync(at(file))).toBe(true);
    });

    it('names only commands the repository has', () => {
        const scripts = Object.keys(
            (JSON.parse(read('package.json')) as { scripts: Record<string, string> }).scripts
        );
        const named = [...read('CONTRIBUTING.md').matchAll(/npm run ([\w:-]+)/g)].map(
            ([, script]) => script
        );
        expect(named.length).toBeGreaterThan(0);
        expect(named.filter((script) => !scripts.includes(script ?? ''))).toEqual([]);
    });

    it.each(['CONTRIBUTING.md', 'ACCESSIBILITY.md'])(
        'links only files that are there, from %s',
        (file) => {
            const links = [...read(file).matchAll(/\]\((?!https?:|#)([^)#]+)(?:#[^)]*)?\)/g)].map(
                ([, path]) => path ?? ''
            );
            expect(links.filter((path) => !existsSync(at(path)))).toEqual([]);
        }
    );
});
