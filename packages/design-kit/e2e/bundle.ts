import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * A page's script for the browser tests of the kit's React hooks, bundled with React itself, since
 * a hook needs React to run in the page. The entry is written in plain JavaScript with
 * createElement, and imports the hooks from the source by the path `HOOKS` names.
 */

/** The hooks' source, for an entry to import. */
export const HOOKS = fileURLToPath(new URL('../src/hooks.tsx', import.meta.url));

/** Bundles an entry's code, with React and the kit's source it imports, into one module. */
export const bundle = async (entryCode: string): Promise<string> => {
    const { build } = await import('vite');
    // In the repository's own cache, so the entry finds React where the repository installed it.
    const cache = fileURLToPath(new URL('../../../node_modules/.cache/', import.meta.url));
    mkdirSync(cache, { recursive: true });
    const folder = mkdtempSync(join(cache, 'design-kit-hooks-'));
    try {
        const entry = join(folder, 'entry.js');
        writeFileSync(entry, entryCode);
        const output = await build({
            configFile: false,
            logLevel: 'silent',
            define: { 'process.env.NODE_ENV': JSON.stringify('development') },
            build: {
                write: false,
                minify: false,
                lib: { entry, formats: ['es'], fileName: 'page' },
            },
        });
        return (Array.isArray(output) ? output : [output])
            .flatMap((result) => ('output' in result ? result.output : []))
            .map((file) => (file.type === 'chunk' ? file.code : ''))
            .join('\n');
    } finally {
        rmSync(folder, { recursive: true, force: true });
    }
};
