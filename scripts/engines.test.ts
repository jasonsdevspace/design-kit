// @vitest-environment node
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { matchesGlob } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import {
    type Engine,
    FIREFOX,
    reasonOf,
    specsOf,
    WEBKIT,
} from '../packages/design-kit/e2e/engines.js';

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
            expect(Object.entries(engine).filter(([, run]) => !reasonOf(run).trim())).toEqual([]);
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

/** A test as Playwright lists it: its spec's name and its title after its describes. */
type Listed = { readonly spec: string; readonly title: string };

/** Playwright's JSON list, as far as this reads it. */
type Suite = {
    readonly title: string;
    readonly file?: string;
    readonly specs?: readonly {
        readonly title: string;
        readonly file: string;
        readonly tests: readonly { readonly projectName: string }[];
    }[];
    readonly suites?: readonly Suite[];
};

describe('the tests an engine list names', () => {
    /**
     * Every test of the kit's specs each project runs, read from Playwright's own list, so the names
     * the engine lists give are held to the tests as the config filters them.
     */
    const listed = new Map<string, Listed[]>();
    beforeAll(() => {
        // Playwright's own script, run by this Node, so no shell is needed on any system, and what
        // it said is shown where the listing fails, as it does on a spec that cannot load.
        const cli = createRequire(import.meta.url).resolve('@playwright/test/cli');
        let output: string;
        try {
            output = execFileSync(process.execPath, [cli, 'test', '--list', '--reporter=json'], {
                cwd: new URL('..', import.meta.url),
                encoding: 'utf8',
                maxBuffer: 64 * 1024 * 1024,
                stdio: ['ignore', 'pipe', 'pipe'],
            });
        } catch (error) {
            const { stderr, stdout } = error as { stderr?: string; stdout?: string };
            throw new Error(
                `Playwright could not list the tests:\n${stderr ?? ''}${stdout ?? ''}`,
                {
                    cause: error,
                }
            );
        }
        const report = JSON.parse(output) as { readonly suites: readonly Suite[] };
        const walk = (suite: Suite, path: readonly string[]) => {
            for (const spec of suite.specs ?? []) {
                const name = /design-kit[\\/]e2e[\\/]([^\\/]+)\.spec\.tsx?$/.exec(spec.file)?.[1];
                if (name === undefined) continue;
                for (const { projectName } of spec.tests) {
                    const tests = listed.get(projectName) ?? [];
                    tests.push({ spec: name, title: [...path, spec.title].join(' › ') });
                    listed.set(projectName, tests);
                }
            }
            // A file's own suite adds nothing to a title, and each describe in it adds its own.
            for (const inner of suite.suites ?? []) walk(inner, [...path, inner.title]);
        };
        for (const file of report.suites) walk(file, []);
    }, 120_000);

    /** The tests of a spec, by their titles, as Chromium runs every one. */
    const titlesOf = (spec: string): string[] =>
        (listed.get('chromium') ?? [])
            .filter((test) => test.spec === spec)
            .map(({ title }) => title);

    for (const [name, engine, project] of [
        ['WebKit', WEBKIT, 'webkit'],
        ['Firefox', FIREFOX, 'firefox'],
    ] as const) {
        it(`are each a test of the spec they are named under, for ${name}`, () => {
            const unknown = Object.entries(engine).flatMap(([spec, run]) => {
                if (typeof run === 'string') return [];
                const titles = new Set(titlesOf(spec));
                return ('tests' in run ? [...run.tests, ...run.except] : run.except)
                    .filter((title) => !titles.has(title))
                    .map((title) => `${spec} › ${title}`);
            });
            expect(unknown).toEqual([]);
        });

        it(`sort every test of a spec run in part into those it runs or those it leaves out, once, for ${name}`, () => {
            const unsorted = Object.entries(engine).flatMap(([spec, run]) => {
                if (typeof run === 'string' || !('tests' in run)) return [];
                const sorted = [...run.tests, ...run.except];
                return [
                    ...titlesOf(spec).filter((title) => !sorted.includes(title)),
                    ...sorted.filter((title, index) => sorted.indexOf(title) !== index),
                ].map((title) => `${spec} › ${title}`);
            });
            expect(unsorted).toEqual([]);
        });

        it(`leave each spec they name some test to run, for ${name}`, () => {
            const empty = Object.entries(engine)
                .filter(([spec, run]) =>
                    typeof run === 'string'
                        ? false
                        : 'tests' in run
                          ? run.tests.length === 0
                          : titlesOf(spec).every((title) => run.except.includes(title))
                )
                .map(([spec]) => spec);
            expect(empty).toEqual([]);
        });

        it(`are the tests the engine runs, no more and no fewer, for ${name}`, () => {
            const expected = Object.entries(engine)
                .flatMap(([spec, run]) => {
                    const titles = titlesOf(spec);
                    if (typeof run === 'string') return titles.map((title) => `${spec} › ${title}`);
                    if ('tests' in run) return run.tests.map((title) => `${spec} › ${title}`);
                    return titles
                        .filter((title) => !run.except.includes(title))
                        .map((title) => `${spec} › ${title}`);
                })
                .sort();
            const ran = (listed.get(project) ?? [])
                .map(({ spec, title }) => `${spec} › ${title}`)
                .sort();
            expect(ran).toEqual(expected);
        });
    }
});
