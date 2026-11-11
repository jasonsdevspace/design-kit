import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

/*
 * The controls as a page's bundler takes them: a module that runs nothing when it is imported, so
 * it loads in Node and in a page that never attaches a control, and small enough to send to every
 * visitor of a page with a switch.
 */

/*
 * Raised from 3 KB for the toast, whose behavior ships in this module beside the rest rather than
 * in one of its own, as its rules ship in the components sheet, as record 15 has it.
 */
const BUDGET = 5 * 1024;

describe('the controls', () => {
    it('load in plain Node without reaching for the browser', async () => {
        const controls = await import('./controls.js');
        expect(Object.keys(controls).sort()).toEqual([
            'attachCopyButton',
            'attachDialog',
            'attachStepper',
            'attachThemeSwitch',
            'attachToast',
            'chooseTheme',
        ]);
    });

    it(`stay within ${String(BUDGET / 1024)} KB gzipped with the theme module they import, without their comments as a bundler sends them`, () => {
        const built = ['./controls.ts', './theme.ts']
            .map(
                (file) =>
                    ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
                        compilerOptions: {
                            target: ts.ScriptTarget.ES2023,
                            module: ts.ModuleKind.ESNext,
                            removeComments: true,
                        },
                    }).outputText
            )
            .join('\n');
        expect(gzipSync(built).length).toBeLessThanOrEqual(BUDGET);
    });
});
