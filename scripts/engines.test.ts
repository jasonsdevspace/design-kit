// @vitest-environment node
import { readdirSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { type Engine, FIREFOX, WEBKIT } from '../packages/design-kit/e2e/engines.js';

/*
 * The config runs each spec an engine list names in that engine, by a pattern built from the names,
 * and a pattern matches nothing for a name typed wrong, so a spec would drop out of WebKit or
 * Firefox with no error. Every name is held to a spec in the kit's e2e folder here instead.
 */

/** The specs in the kit's e2e folder, by name. */
const SPECS = readdirSync(new URL('../packages/design-kit/e2e/', import.meta.url)).flatMap(
    (file) => /^(.+)\.spec\.tsx?$/.exec(file)?.slice(1, 2) ?? []
);

/** The names an engine list gives that no spec in the folder has. */
const missing = (engine: Engine, specs: readonly string[]): string[] =>
    Object.keys(engine).filter((name) => !specs.includes(name));

describe('the engine lists', () => {
    for (const [name, engine] of Object.entries({ WebKit: WEBKIT, Firefox: FIREFOX })) {
        it(`name only specs that exist, for ${name}`, () => {
            expect(missing(engine, SPECS)).toEqual([]);
        });

        it(`give a reason for each spec, for ${name}`, () => {
            expect(Object.entries(engine).filter(([, reason]) => !reason.trim())).toEqual([]);
        });
    }

    it('find a name typed wrong', () => {
        expect(missing({ leaks: 'Counted.', leak: 'Counted.' }, SPECS)).toEqual(['leak']);
    });
});
