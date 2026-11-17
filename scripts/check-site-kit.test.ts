// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { kitDifferences, siteKitProblems } from './check-site-kit.mjs';

const made: string[] = [];

const temporary = (): string => {
    const dir = mkdtempSync(join(tmpdir(), 'site-kit-'));
    made.push(dir);
    return dir;
};

/** Writes each file given under a folder. */
const write = (root: string, files: Record<string, string>): void => {
    for (const [file, text] of Object.entries(files)) {
        mkdirSync(join(root, file, '..'), { recursive: true });
        writeFileSync(join(root, file), text);
    }
};

/** A kit packed as npm packs it, holding the `dist` files given. */
const packed = (dist: Record<string, string>): Buffer => {
    const dir = temporary();
    write(join(dir, 'package'), {
        'package.json': '{"name":"@o/kit","version":"1.0.0"}',
        ...Object.fromEntries(Object.entries(dist).map(([file, text]) => [`dist/${file}`, text])),
    });
    execFileSync('tar', ['-czf', join(dir, 'kit.tgz'), '-C', dir, 'package']);
    return readFileSync(join(dir, 'kit.tgz'));
};

const bytes = (files: Record<string, string>): Map<string, Buffer> =>
    new Map(Object.entries(files).map(([file, text]) => [file, Buffer.from(text)]));

afterEach(() => {
    for (const root of made.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("the check that the site resolves this commit's kit", () => {
    it('passes where both hold the same files with the same bytes', () => {
        const files = { 'components.css': '.dk-app {}', 'react/index.js': 'export {};' };
        expect(kitDifferences(bytes(files), bytes(files))).toEqual([]);
    });

    it('names a file that differs, one only this commit holds and one only the site holds', () => {
        expect(
            kitDifferences(
                bytes({ 'components.css': '.dk-app { gap: 1rem; }', 'tokens.css': ':root {}' }),
                bytes({ 'components.css': '.dk-app {}', 'controls.js': 'export {};' })
            )
        ).toEqual([
            "components.css differs from this commit's kit",
            "controls.js is in the kit the site resolves and not in this commit's kit",
            'tokens.css is missing from the kit the site resolves',
        ]);
    });

    it('fails where either side holds nothing', () => {
        expect(kitDifferences(new Map(), bytes({ 'a.css': '' }))).toEqual([
            "this commit's packed kit holds no dist",
        ]);
        expect(kitDifferences(bytes({ 'a.css': '' }), new Map())).toEqual([
            'the kit the site resolves holds no dist',
        ]);
    });

    it("reads the copy the site resolves, the site's own before the root's", () => {
        const kit = { 'components.css': '.dk-app { gap: 1rem; }' };
        /** A repository with this commit's kit at the root, and the pinned one in the site's. */
        const repository = (pinnedInSite: boolean): string => {
            const root = temporary();
            write(root, {
                'packages/site/package.json': '{"name":"site"}',
                'node_modules/design-kit-release/package.json': '{"name":"kit","version":"2.0.0"}',
                'node_modules/design-kit-release/dist/components.css': kit['components.css'],
                ...(pinnedInSite
                    ? {
                          'packages/site/node_modules/design-kit-release/package.json':
                              '{"name":"kit","version":"1.0.0"}',
                          'packages/site/node_modules/design-kit-release/dist/components.css':
                              '.dk-app {}',
                      }
                    : {}),
            });
            return root;
        };
        expect(siteKitProblems(repository(false), packed(kit))).toEqual({
            from: 'node_modules/design-kit-release',
            differences: [],
        });
        // The pinned release left in the site's own folder is what the site resolves, and fails.
        expect(siteKitProblems(repository(true), packed(kit))).toEqual({
            from: 'packages/site/node_modules/design-kit-release',
            differences: ["components.css differs from this commit's kit"],
        });
    });

    it('fails where the site resolves no kit at all', () => {
        const root = temporary();
        write(root, { 'packages/site/package.json': '{"name":"site"}' });
        expect(siteKitProblems(root, packed({ 'a.css': '' })).differences).toEqual([
            'the site resolves no kit under its alias',
        ]);
    });
});
