import { readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { bundledOf, chunksOf, packagedOf } from './parts.mjs';

/*
 * The controls in parts a site's bundler can split, as record 13 has them: a site that loads one
 * piece's code on one page sends it to that page alone, while every page shares one copy of the
 * kit's state. Each check reads the package laid out as npm ships it, so a bundler reads the
 * manifest's `sideEffects` as it does in a page's install.
 */

/** The modules the parts share, which import nothing but each other. */
const SHARED = [
    'find.js',
    'focus.js',
    'line.js',
    'marks.js',
    'request.js',
    'state.js',
    'teardown.js',
    'theme.js',
    'words.js',
];

/** The modules that are not internal: the entry that gathers the parts, and the build's plugin. */
const OUTSIDE = ['controls.js', 'vite.js'];

/**
 * A page of a site: the names it imports, the module only it reaches, and a function only that
 * module holds, so its code is looked for too.
 */
type Page = { readonly names: readonly string[]; readonly own: string; readonly held: string };

/** Pages built together that must share none of each other's code. */
const APART: readonly { readonly page: Page; readonly beside: Page }[] = [
    {
        page: { names: ['attachForm'], own: 'dist/form.js', held: 'refusalWords' },
        beside: { names: ['attachTable'], own: 'dist/table.js', held: 'pinnedBeside' },
    },
    {
        page: { names: ['attachBusy'], own: 'dist/busy.js', held: 'waitOf' },
        beside: { names: ['attachToast'], own: 'dist/toast.js', held: 'measureToast' },
    },
    {
        page: { names: ['moveFocus'], own: 'dist/request.js', held: 'askedNow' },
        beside: { names: ['attachDialog'], own: 'dist/dialog.js', held: 'moveOffClose' },
    },
];

/** The modules each module of a folder imports, by the import and export lines of its code. */
const importsIn = (folder: string): Map<string, string[]> =>
    new Map(
        readdirSync(folder)
            .filter((file) => file.endsWith('.js'))
            .map((file) => [
                file,
                [
                    ...readFileSync(join(folder, file), 'utf8').matchAll(
                        /^(?:import|export)\b[^;]*?['"]\.\/([\w-]+\.js)['"]/gms
                    ),
                ].map(([, imported]) => imported ?? ''),
            ])
    );

/** A cycle among the imports given, as the modules it passes through, or nothing. */
const cycleIn = (imports: ReadonlyMap<string, readonly string[]>): string[] | null => {
    const done = new Set<string>();
    const walk = (file: string, path: readonly string[]): string[] | null => {
        if (path.includes(file)) return [...path.slice(path.indexOf(file)), file];
        if (done.has(file)) return null;
        for (const next of imports.get(file) ?? []) {
            const found = walk(next, [...path, file]);
            if (found) return found;
        }
        done.add(file);
        return null;
    };
    for (const file of imports.keys()) {
        const found = walk(file, []);
        if (found) return found;
    }
    return null;
};

describe('the controls in parts', () => {
    let packaged = '';
    beforeAll(async () => {
        packaged = await packagedOf(
            fileURLToPath(new URL('../packages/design-kit', import.meta.url))
        );
    });
    afterAll(() => {
        rmSync(packaged, { recursive: true, force: true });
    });

    it.each(APART)(
        'send $page.names to its page alone, beside a page that imports $beside.names',
        async ({ page, beside }) => {
            const sent = await chunksOf(join(packaged, 'dist', 'controls.js'), [
                page.names,
                beside.names,
            ]);
            for (const [at, [one, other]] of (
                [
                    [page, beside],
                    [beside, page],
                ] as const
            ).entries()) {
                expect(sent[at]?.modules).toContain(one.own);
                expect(sent[at]?.modules).not.toContain(other.own);
                expect(sent[at]?.code).toContain(one.held);
                expect(sent[at]?.code).not.toContain(other.held);
            }
        },
        60_000
    );

    it('keep the shared state and its listeners on a bare import', async () => {
        const [bare] = await chunksOf(join(packaged, 'dist', 'controls.js'), [[]]);
        expect(bare?.modules).toContain('dist/state.js');
        expect(bare?.code).toContain('visibilitychange');
    }, 60_000);

    it('send nothing for any other internal module imported bare', async () => {
        const internal = readdirSync(join(packaged, 'dist')).filter(
            (file) => file.endsWith('.js') && !OUTSIDE.includes(file) && file !== 'state.js'
        );
        // The parts are there to read, and the state sends its listeners, so the check cannot
        // pass on a package without the parts or with a measure that finds nothing anywhere.
        expect(internal).toContain('form.js');
        expect(await bundledOf(join(packaged, 'dist', 'state.js'), [])).toContain(
            'visibilitychange'
        );
        for (const file of internal)
            expect(
                (await bundledOf(join(packaged, 'dist', file), [])).replace(
                    /^"use strict";\s*/,
                    ''
                ),
                file
            ).toBe('');
    }, 120_000);

    it('import in one direction, from the parts to the modules they share, with no cycle', () => {
        const imports = importsIn(join(packaged, 'dist'));
        expect(cycleIn(imports)).toBeNull();
        const parts = [...imports.keys()].filter(
            (file) => !SHARED.includes(file) && !OUTSIDE.includes(file)
        );
        expect(parts).toContain('form.js');
        for (const file of [...parts, ...SHARED])
            expect(
                (imports.get(file) ?? []).filter((imported) => !SHARED.includes(imported)),
                file
            ).toEqual([]);
        // The entry gathers every part and the state.
        expect(imports.get('controls.js')).toEqual(expect.arrayContaining([...parts, 'state.js']));
    });

    it('find a cycle and the modules it passes through', () => {
        expect(
            cycleIn(
                new Map([
                    ['a.js', ['b.js']],
                    ['b.js', ['c.js']],
                    ['c.js', ['a.js']],
                ])
            )
        ).toEqual(['a.js', 'b.js', 'c.js', 'a.js']);
        expect(cycleIn(new Map([['a.js', ['b.js']]]))).toBeNull();
    });
});
