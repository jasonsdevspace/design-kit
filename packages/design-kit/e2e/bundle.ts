import { fileURLToPath } from 'node:url';

import { build } from 'vite';

/*
 * A page drawn by React in a browser, from an entry in this folder such as ref-page.tsx, bundled
 * with React into one module, since only a browser attaches a ref, moves focus or runs a hook's
 * effect. Building React into a page takes a while on a slow runner, so a spec builds it once, in
 * a beforeAll on its own clock.
 */

/**
 * An entry in this folder and React as one module, for a page written into the browser. React's
 * development build is taken where `development` is given, since only it runs a ref and an effect
 * a second time under `StrictMode`, as a page sees while it is being written.
 */
export const bundle = async (
    entry: string,
    { development = false }: { readonly development?: boolean } = {}
): Promise<string> => {
    const output = await build({
        configFile: false,
        logLevel: 'silent',
        define: {
            'process.env.NODE_ENV': JSON.stringify(development ? 'development' : 'production'),
        },
        build: {
            write: false,
            lib: {
                entry: fileURLToPath(new URL(entry, import.meta.url)),
                formats: ['es'],
                fileName: 'page',
            },
        },
    });
    const chunks = (Array.isArray(output) ? output : [output])
        .flatMap((result) => ('output' in result ? result.output : []))
        .filter((file) => file.type === 'chunk');
    const [only] = chunks;
    if (chunks.length !== 1 || !only) throw new Error('the page should build into one script');
    return only.code;
};
