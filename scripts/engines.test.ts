// @vitest-environment node
import { readdirSync } from 'node:fs';
import { matchesGlob } from 'node:path';

import { describe, expect, it } from 'vitest';

import { type Engine, FIREFOX, specsOf, WEBKIT } from '../packages/design-kit/e2e/engines.js';

/*
 * The config runs each spec an engine list names in that engine, by the patterns specsOf builds
 * from the names, and a pattern that matches nothing, from a name typed wrong or a brace of one
 * name, would drop a spec out of WebKit or Firefox with no error. The patterns are matched here as
 * Playwright matches a test file, with `**` put before each, and the files they match are held to
 * the names the list gives.
 */

/** Every file in the kit's e2e folder, as an absolute path under a root made up for the match. */
const FILES = readdirSync(new URL('../packages/design-kit/e2e/', import.meta.url)).map(
    (file) => `/repository/packages/design-kit/e2e/${file}`
);

/** The specs the patterns given match among the files, by name. */
const matched = (patterns: readonly string[]): string[] =>
    FILES.filter((file) => patterns.some((pattern) => matchesGlob(file, `**/${pattern}`)))
        .map((file) => /([^/]+)\.spec\.tsx?$/.exec(file)?.[1] ?? file)
        .sort();

/** The names an engine list gives, in the order `matched` gives them. */
const named = (engine: Engine): string[] => Object.keys(engine).sort();

describe('the engine lists', () => {
    for (const [name, engine] of Object.entries({ WebKit: WEBKIT, Firefox: FIREFOX })) {
        it(`run exactly the specs they name, for ${name}`, () => {
            expect(matched(specsOf(engine))).toEqual(named(engine));
        });

        it(`give a reason for each spec, for ${name}`, () => {
            expect(Object.entries(engine).filter(([, reason]) => !reason.trim())).toEqual([]);
        });
    }

    it('find a name typed wrong', () => {
        const engine = { leaks: 'Counted.', leak: 'Counted.' };
        expect(matched(specsOf(engine))).not.toEqual(named(engine));
    });

    it('find a brace of one name, which matches nothing', () => {
        expect(matched(['*/e2e/{form}.spec.{ts,tsx}'])).toEqual([]);
        expect(matched(specsOf({ form: 'Refused.' }))).toEqual(['form']);
    });
});
