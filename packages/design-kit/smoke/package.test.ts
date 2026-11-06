import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import pkg from '../package.json' with { type: 'json' };
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

const root = new URL('../../../', import.meta.url);

describe('the published package', () => {
    it('lists every value each module exports in the smoke test', () => {
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
        const config = JSON.parse(readFileSync(new URL('tsconfig.json', root), 'utf8')) as {
            compilerOptions: { target: string; lib: string[] };
        };
        for (const name of [config.compilerOptions.target, ...config.compilerOptions.lib]) {
            const year = Number(/es(\d{4})/i.exec(name)?.[1] ?? Number.POSITIVE_INFINITY);
            expect(year, name).toBeLessThanOrEqual(edition ?? 0);
        }
    });

    it('has a changelog entry for the version it declares', () => {
        const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
        expect(changelog.split('\n')).toContain(`## ${pkg.version}`);
    });
});
