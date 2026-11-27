import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/*
 * What a page's bundler sends from the React entry, built from the package as npm ships it, so the
 * bundler reads the manifest's `sideEffects` as it does in a page's install. A page sends only the
 * hooks and the markup it names and the pieces they attach, alone and as one page of a site whose
 * other pages use the rest, since each hook, or the few of one kind, and each component, or the few
 * that share their parts, is a module a bundler leaves out of a chunk a page does not load.
 */

const FOLDER = fileURLToPath(new URL('../packages/design-kit/', import.meta.url));

/** The attach functions of the pieces a page leaves out, each found in the code it is sent. */
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
 * line beside screens that refuse a form and draw a stepper builds them. A module both pages import
 * goes into a chunk both load, with every part of it the site uses.
 */
const modulesPerPage = async (
    pages: readonly (readonly string[])[]
): Promise<{ modules: string[]; code: string }[]> => {
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
            return {
                modules: [
                    ...new Set(
                        [...reached]
                            .flatMap((chunk) => chunk.moduleIds)
                            .filter((id) => id.includes(`${packaged}/dist/`))
                            .map((id) => id.slice(id.lastIndexOf('/') + 1))
                    ),
                ].sort(),
                code: [...reached].map((chunk) => chunk.code).join('\n'),
            };
        });
    } finally {
        rmSync(entries, { recursive: true, force: true });
    }
};

describe('the React entry, bundled for a page', () => {
    it("keeps the other pieces off a status line's page built beside screens that use them", async () => {
        const [status, screens] = await modulesPerPage([
            ['StatusProvider', 'useStatus', 'SkipLink', 'ThemeSwitch'],
            [
                'StatusProvider',
                'useStatus',
                'useFormRefusal',
                'useRoving',
                'StepperField',
                'Toast',
                'CheckboxField',
            ],
        ]);
        expect(screens?.modules).toEqual(expect.arrayContaining(['form.js', 'roving.js']));
        expect(screens?.code).toContain('dk-stepper');
        expect(screens?.code).toContain('onWords');
        expect(
            (status?.modules ?? []).filter((module) =>
                ['form.js', 'roving.js', 'stepper.js', 'toast.js', 'table.js'].includes(module)
            )
        ).toEqual([]);
        // Nor the markup of the pieces it draws none of: a stepper's, a toast's, a checkbox field's,
        // told by the words it draws its state in, and a plain field's, told by the textarea's class.
        expect(
            ['dk-stepper', 'dk-toast', 'onWords', 'dk-textarea'].filter((name) =>
                status?.code.includes(name)
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
