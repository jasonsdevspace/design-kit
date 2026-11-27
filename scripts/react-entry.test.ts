import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/*
 * What a page's bundler sends for a few names of the React entry, built from the package as npm
 * ships it, so the bundler reads the manifest's `sideEffects` as it does in a page's install. A
 * page that keeps a status line and nothing else sends none of the toast, the stepper, the table,
 * the form or the group of cells, since each is a module a bundler can leave out when no name of
 * it is imported.
 */

const FOLDER = fileURLToPath(new URL('../packages/design-kit/', import.meta.url));

/** The attach functions of the pieces a page that names none of them never runs. */
const PIECES = ['attachToast', 'attachStepper', 'attachTable', 'attachForm', 'attachRoving'];

/** The package laid out as npm ships it: its manifest and the compiled `dist`. */
let packaged = '';

beforeAll(() => {
    packaged = mkdtempSync(join(tmpdir(), 'design-kit-react-'));
    mkdirSync(join(packaged, 'dist'));
    copyFileSync(join(FOLDER, 'package.json'), join(packaged, 'package.json'));
    execFileSync(
        process.execPath,
        [
            fileURLToPath(new URL('../node_modules/typescript/bin/tsc', import.meta.url)),
            '-p',
            join(FOLDER, 'tsconfig.build.json'),
            '--outDir',
            join(packaged, 'dist'),
            '--declaration',
            'false',
        ],
        { stdio: 'pipe' }
    );
}, 120_000);

afterAll(() => {
    rmSync(packaged, { recursive: true, force: true });
});

/**
 * The code a bundler puts in a page's first chunk, the one every visit loads, for a page that
 * imports the names given from the React entry and loads the controls named in `later` from a
 * module of its own by `import()`, as an app loads its screens.
 */
const sentFor = async (
    names: readonly string[],
    later: readonly string[] = []
): Promise<string> => {
    const { build } = await import('vite');
    const entries = mkdtempSync(join(tmpdir(), 'design-kit-react-page-'));
    try {
        const entry = join(entries, 'entry.js');
        const dist = (file: string) => JSON.stringify(join(packaged, 'dist', file));
        writeFileSync(
            entry,
            `export { ${names.join(', ')} } from ${dist('react.js')};\n` +
                (later.length > 0 ? "export const screen = () => import('./screen.js');\n" : '')
        );
        if (later.length > 0)
            writeFileSync(
                join(entries, 'screen.js'),
                `export { ${later.join(', ')} } from ${dist('controls.js')};\n`
            );
        const output = await build({
            configFile: false,
            logLevel: 'silent',
            build: {
                write: false,
                minify: false,
                lib: { entry, formats: ['es'], fileName: 'page' },
                rolldownOptions: { external: [/^react(\/|$)/, /^react-dom(\/|$)/] },
            },
        });
        return (Array.isArray(output) ? output : [output])
            .flatMap((result) => ('output' in result ? result.output : []))
            .map((file) => (file.type === 'chunk' && file.isEntry ? file.code : ''))
            .join('\n');
    } finally {
        rmSync(entries, { recursive: true, force: true });
    }
};

/**
 * The modules of the package each page of a site sends, where the pages are built together and
 * each imports the names given from the React entry, as a site with a page that keeps only a status
 * line beside screens that refuse a form and draw a stepper builds them. A module two pages share
 * goes into a chunk both load, so a module that holds more than one page needs is sent whole.
 */
const modulesPerPage = async (pages: readonly (readonly string[])[]): Promise<string[][]> => {
    const { build } = await import('vite');
    const entries = mkdtempSync(join(tmpdir(), 'design-kit-react-site-'));
    try {
        const entry: Record<string, string> = {};
        pages.forEach((names, at) => {
            const page = join(entries, `page${String(at)}.js`);
            writeFileSync(
                page,
                `export { ${names.join(', ')} } from ${JSON.stringify(join(packaged, 'dist', 'react.js'))};\n`
            );
            entry[`page${String(at)}`] = page;
        });
        const output = await build({
            configFile: false,
            logLevel: 'silent',
            build: {
                write: false,
                minify: false,
                lib: { entry, formats: ['es'] },
                rolldownOptions: { external: [/^react(\/|$)/, /^react-dom(\/|$)/] },
            },
        });
        const chunks = (Array.isArray(output) ? output : [output])
            .flatMap((result) => ('output' in result ? result.output : []))
            .filter((file) => file.type === 'chunk');
        const byFile = new Map(chunks.map((chunk) => [chunk.fileName, chunk]));
        return pages.map((_, at) => {
            const first = chunks.find(
                (chunk) => chunk.isEntry && chunk.name === `page${String(at)}`
            );
            if (!first) throw new Error(`expected a chunk for page ${String(at)}`);
            const reached = new Set([first]);
            for (const chunk of reached)
                for (const name of chunk.imports) {
                    const imported = byFile.get(name);
                    if (imported) reached.add(imported);
                }
            return [
                ...new Set(
                    [...reached]
                        .flatMap((chunk) => chunk.moduleIds)
                        .filter((id) => id.includes(`${packaged}/dist/`))
                        .map((id) => id.slice(id.lastIndexOf('/') + 1))
                ),
            ].sort();
        });
    } finally {
        rmSync(entries, { recursive: true, force: true });
    }
};

describe('the React entry, bundled for a page', () => {
    it("keeps the other pieces off a status line's page built beside screens that use them", async () => {
        const [status, screens] = await modulesPerPage([
            ['StatusProvider', 'useStatus'],
            ['StatusProvider', 'useStatus', 'useFormRefusal', 'useRoving', 'StepperField', 'Toast'],
        ]);
        expect(screens).toEqual(expect.arrayContaining(['form.js', 'roving.js']));
        expect(
            (status ?? []).filter((module) =>
                ['form.js', 'roving.js', 'stepper.js', 'toast.js', 'table.js'].includes(module)
            )
        ).toEqual([]);
    }, 120_000);

    it('sends a page that keeps only a status line none of the other pieces', async () => {
        const sent = await sentFor(['StatusProvider', 'useStatus']);
        expect(sent).toContain('attachStatus');
        expect(PIECES.filter((piece) => sent.includes(piece))).toEqual([]);
    }, 120_000);

    it('keeps the toast and the stepper out of the first chunk of a page that loads them later', async () => {
        const sent = await sentFor(
            ['StatusProvider', 'useStatus'],
            ['attachToast', 'attachStepper']
        );
        expect(sent).toContain('attachStatus');
        expect(PIECES.filter((piece) => sent.includes(piece))).toEqual([]);
    }, 120_000);

    it('sends a page that keeps a busy button none of the other pieces', async () => {
        const sent = await sentFor(['Button', 'useBusy']);
        expect(sent).toContain('attachBusy');
        expect(PIECES.filter((piece) => sent.includes(piece))).toEqual([]);
    }, 120_000);
});
