// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { kitDifferences } from './check-site-kit.mjs';

const made: string[] = [];

/** A folder holding the files given, as a kit's `dist` would. */
const dist = (files: Record<string, string>): string => {
    const root = mkdtempSync(join(tmpdir(), 'site-kit-'));
    made.push(root);
    for (const [file, text] of Object.entries(files)) {
        mkdirSync(join(root, file, '..'), { recursive: true });
        writeFileSync(join(root, file), text);
    }
    return root;
};

afterEach(() => {
    for (const root of made.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('the check that the site resolves this commit kit', () => {
    it('passes where the site resolves the kit just built', () => {
        const files = { 'components.css': '.dk-app {}', 'react/index.js': 'export {};' };
        expect(kitDifferences(dist(files), dist(files))).toEqual([]);
    });

    it('names each file the site resolves otherwise, or not at all', () => {
        const built = dist({
            'components.css': '.dk-app { gap: 1rem; }',
            'tokens.css': ':root {}',
        });
        const pinned = dist({ 'components.css': '.dk-app {}' });
        expect(kitDifferences(built, pinned)).toEqual([
            "components.css differs from this commit's kit",
            'tokens.css is missing from the kit the site resolves',
        ]);
    });
});
