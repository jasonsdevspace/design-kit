import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

import * as kit from 'design-kit-release/react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { elementOf } from '../../design-kit/examples/elements.js';
import { APP, CHROME, LAYOUTS } from '../../design-kit/examples/pieces.js';
import { CONTROLS } from '../../design-kit/examples/states.js';
import { BEHAVIORS, REACT } from './behavior.js';
import { OWN_PIECES } from './own-palette.js';

/*
 * The React the site shows beside each state, held to the version of the kit the site pins, since
 * the site shows it beside the markup that version draws. The kit's own test holds the same React
 * to its sources, so a change in the sources before a release fails one of the two.
 */

const shown = [...CONTROLS, ...APP, ...LAYOUTS, ...CHROME, OWN_PIECES]
    .flatMap((control) => control.states)
    .filter((state) => state.react !== undefined);

describe('the React each state shows', () => {
    it('draws what the pinned version draws for the state', () => {
        expect(shown.length).toBeGreaterThan(0);
        for (const state of shown) {
            expect(renderToStaticMarkup(elementOf(state.react ?? '', kit)), state.name).toBe(
                renderToStaticMarkup(state.draw(kit, (name) => name))
            );
        }
    });
});

/** Each behavior's React, as a module of its own beside this file, so it finds the site's React. */
const modules = new Map(
    BEHAVIORS.map((behavior, index) => [
        fileURLToPath(new URL(`behavior-${String(index)}.shown.tsx`, import.meta.url)),
        behavior,
    ])
);

describe('the React each behavior shows', () => {
    it('type-checks against the pinned version, its imports from the package included', () => {
        const options: ts.CompilerOptions = {
            strict: true,
            noEmit: true,
            noUncheckedIndexedAccess: true,
            skipLibCheck: true,
            jsx: ts.JsxEmit.ReactJSX,
            module: ts.ModuleKind.ESNext,
            moduleResolution: ts.ModuleResolutionKind.Bundler,
            target: ts.ScriptTarget.ES2022,
            lib: ['lib.es2023.d.ts', 'lib.dom.d.ts'],
            types: [],
            // The entry a page imports, as the React names it, is the version the site pins.
            paths: {
                [REACT]: [
                    fileURLToPath(
                        new URL(
                            'dist/react.d.ts',
                            pathToFileURL(
                                createRequire(import.meta.url).resolve(
                                    'design-kit-release/package.json'
                                )
                            )
                        )
                    ),
                ],
            },
        };
        const host = ts.createCompilerHost(options);
        const read = host.readFile.bind(host);
        const exists = host.fileExists.bind(host);
        const sourceOf = host.getSourceFile.bind(host);
        host.readFile = (file) => modules.get(file)?.react ?? read(file);
        host.fileExists = (file) => modules.has(file) || exists(file);
        host.getSourceFile = (file, language) => {
            const behavior = modules.get(file);
            return behavior === undefined
                ? sourceOf(file, language)
                : ts.createSourceFile(file, behavior.react, language, true, ts.ScriptKind.TSX);
        };
        const program = ts.createProgram([...modules.keys()], options, host);
        const errors = ts.getPreEmitDiagnostics(program).map((diagnostic) => {
            const behavior = diagnostic.file && modules.get(diagnostic.file.fileName);
            const words = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            return `${behavior?.name ?? diagnostic.file?.fileName ?? ''}: ${words}`;
        });
        expect(modules.size).toBeGreaterThan(0);
        expect(errors).toEqual([]);
    });
});
