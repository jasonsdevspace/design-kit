// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/** The package's folder. */
const PACKAGE = fileURLToPath(new URL('..', import.meta.url));

/** The TypeScript compiler the workspace installs. */
const TSC = fileURLToPath(new URL('../../../node_modules/typescript/bin/tsc', import.meta.url));

/*
 * The types the package publishes are written from its JSDoc by `npm run types`. Writing them
 * again into a folder of their own and comparing holds the published ones to the code, so a
 * function changed in the code and not in its types fails here.
 */
describe('the published types', () => {
    it('are the ones the JSDoc writes, file for file', () => {
        const out = mkdtempSync(join(tmpdir(), 'prose-check-types-'));
        try {
            execFileSync(
                process.execPath,
                [TSC, '-p', join(PACKAGE, 'tsconfig.types.json'), '--outDir', out],
                { encoding: 'utf8' }
            );
            const written = readdirSync(out).sort();
            expect(readdirSync(join(PACKAGE, 'types')).sort()).toEqual(written);
            for (const file of written)
                expect(readFileSync(join(PACKAGE, 'types', file), 'utf8'), file).toBe(
                    readFileSync(join(out, file), 'utf8')
                );
        } finally {
            rmSync(out, { recursive: true, force: true });
        }
    }, 60_000);
});
