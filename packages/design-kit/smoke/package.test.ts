import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import pkg from '../package.json' with { type: 'json' };
import * as react from '../src/react.js';
import * as theme from '../src/theme.js';
import * as vite from '../src/vite.js';
import { SHEETS, VALUE_EXPORTS } from './exports.mjs';
import { floorOf } from './floor.mjs';

/**
 * The newest edition of the language each Node release runs in full, so the package is compiled
 * against nothing its lowest supported Node lacks. A floor missing from this table fails until its
 * row is added from node.green.
 */
const EDITION_BY_MAJOR: Readonly<Record<number, number>> = { 20: 2023, 22: 2024, 24: 2025 };

/** The target and the language libraries the package's build compiles against, as TypeScript reads its config. */
const compiledAgainst = (): string[] => {
    const path = fileURLToPath(new URL('../tsconfig.build.json', import.meta.url));
    const parsed = ts.getParsedCommandLineOfConfigFile(
        path,
        {},
        {
            ...ts.sys,
            onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
                throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
            },
        }
    );
    if (!parsed || parsed.errors.length > 0) throw new Error('the build config could not be read');
    const target = ts.ScriptTarget[parsed.options.target ?? ts.ScriptTarget.ESNext];
    // A library such as DOM has no edition, so only the language's own are held to the floor.
    const libraries = (parsed.options.lib ?? []).filter((name) => /^lib\.es/i.test(name));
    return [target, ...libraries];
};

describe('the published package', () => {
    it('lists every value each module exports in the smoke test', () => {
        expect(Object.keys(react).sort()).toEqual(
            [...VALUE_EXPORTS['@jasonsdevspace/design-kit/react']].sort()
        );
        expect(Object.keys(theme).sort()).toEqual(
            [...VALUE_EXPORTS['@jasonsdevspace/design-kit/theme']].sort()
        );
        expect(Object.keys(vite).sort()).toEqual(
            [...VALUE_EXPORTS['@jasonsdevspace/design-kit/vite']].sort()
        );
    });

    it('exports what the smoke test loads, and its own manifest, and nothing else', () => {
        const named = [...Object.keys(VALUE_EXPORTS), ...SHEETS].map((name) =>
            name.replace('@jasonsdevspace/design-kit', '.')
        );
        expect(Object.keys(pkg.exports).sort()).toEqual([...named, './package.json'].sort());
    });

    it('names the lowest Node a range admits, down to the patch', () => {
        expect(floorOf('>=24')).toBe('24.0.0');
        expect(floorOf('>=22.12')).toBe('22.12.0');
        expect(floorOf('>= 22.12.1')).toBe('22.12.1');
        expect(floorOf('^24')).toBeUndefined();
        expect(floorOf('>=24 <25')).toBeUndefined();
    });

    it('compiles against no newer a language than its lowest supported Node runs', () => {
        const lowest = floorOf(pkg.engines.node);
        expect(lowest, `${pkg.engines.node} names no lowest Node to install`).toBeDefined();
        const floor = Number(lowest?.split('.')[0]);
        const edition = EDITION_BY_MAJOR[floor];
        expect(edition, `add Node ${String(floor)} to the table`).toBeDefined();
        for (const name of compiledAgainst()) {
            const year = Number(/es(\d{4})/i.exec(name)?.[1] ?? Number.POSITIVE_INFINITY);
            expect(year, name).toBeLessThanOrEqual(edition ?? 0);
        }
    });

    it('packs its build, its README and its license, and no changelog', () => {
        // The changelog is a page on GitHub, which the README links, and each release carries its
        // entry as its notes, so a page that installs the package never reads it.
        const listed = execFileSync('npm', ['pack', '--dry-run', '--json'], {
            cwd: fileURLToPath(new URL('..', import.meta.url)),
            encoding: 'utf8',
        });
        const [packed] = JSON.parse(listed) as readonly { files: readonly { path: string }[] }[];
        const paths = (packed?.files ?? []).map(({ path }) => path);
        expect(paths).toContain('README.md');
        expect(paths).toContain('LICENSE');
        expect(paths).toContain('package.json');
        expect(
            paths.filter(
                (path) =>
                    !path.startsWith('dist/') &&
                    !['README.md', 'LICENSE', 'package.json'].includes(path)
            )
        ).toEqual([]);
    });

    it('has a changelog entry for the version it declares', () => {
        const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
        expect(changelog.split('\n')).toContain(`## ${pkg.version}`);
    });
});
