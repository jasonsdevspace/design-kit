import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

import { HELD } from './held.js';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));

/**
 * A runner, run from the repository's root as installed, and what it prints, read by `read`. Its
 * exit status alone fails nothing, since a test that fails still has its name reported, but a
 * report that cannot be read fails with what the runner said.
 */
const run = <T>(args: readonly string[], read: (stdout: string) => T): T => {
    const { stdout, stderr, status, error } = spawnSync('npx', ['--no-install', ...args], {
        cwd: ROOT,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (error !== undefined) throw error;
    try {
        return read(stdout);
    } catch (cause) {
        throw new Error(`${args.join(' ')} exited ${String(status)}:\n${stderr}`, { cause });
    }
};

/**
 * Vitest's report of the tests in a folder, which it writes to a file rather than printing. Vitest
 * runs them, since its list leaves a loop's values out of a name, writing `${theme}` as it is.
 */
const vitestReport = (folder: string) => {
    const dir = mkdtempSync(join(tmpdir(), 'held-'));
    try {
        const file = join(dir, 'report.json');
        return run(
            ['vitest', 'run', folder, '--reporter=json', `--outputFile=${file}`],
            () => JSON.parse(readFileSync(file, 'utf8')) as VitestReport
        );
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
};

interface VitestReport {
    readonly testResults: readonly {
        readonly name: string;
        readonly assertionResults: readonly {
            readonly fullName: string;
            readonly status: string;
        }[];
    }[];
}

interface PlaywrightSuite {
    readonly title: string;
    readonly file: string;
    readonly specs?: readonly {
        readonly title: string;
        readonly tests: readonly { readonly expectedStatus: string }[];
    }[];
    readonly suites?: readonly PlaywrightSuite[];
}

/**
 * The full name of each test of the kit's that runs, by its file from the package's folder, as its
 * runner reports it, its groups' titles before its own and joined by spaces, with every value a
 * template or a loop puts in it: the sources' tests as Vitest runs them, and the browser tests as
 * Playwright lists them, without starting a browser. A test skipped or left to do holds nothing.
 */
const testsByFile = (): Map<string, string[]> => {
    const tests = new Map<string, string[]>();
    const add = (file: string, name: string) => {
        tests.set(file, [...(tests.get(file) ?? []), name]);
    };
    const units = vitestReport('packages/design-kit/src');
    const kit = join(ROOT, 'packages/design-kit');
    for (const { name, assertionResults } of units.testResults) {
        const file = relative(kit, name);
        for (const { fullName, status } of assertionResults) {
            if (status === 'passed' || status === 'failed') add(file, fullName);
        }
    }
    const browser = run(
        ['playwright', 'test', '--list', '--reporter=json', 'packages/design-kit/e2e'],
        (stdout) => JSON.parse(stdout) as { readonly suites: readonly PlaywrightSuite[] }
    );
    const walk = (suite: PlaywrightSuite, groups: readonly string[]) => {
        const file = suite.file.replace(/^design-kit\//, '');
        for (const spec of suite.specs ?? []) {
            if (spec.tests.some(({ expectedStatus }) => expectedStatus !== 'skipped')) {
                add(file, [...groups, spec.title].join(' '));
            }
        }
        for (const inner of suite.suites ?? []) walk(inner, [...groups, inner.title]);
    };
    for (const suite of browser.suites) walk(suite, []);
    return tests;
};

let tests: Map<string, string[]>;
beforeAll(() => {
    tests = testsByFile();
}, 120_000);

describe('the tests each group lists', () => {
    it('reads each test as its runner reports it, with the values a loop puts in its name', () => {
        expect(tests.get('src/react.test.tsx')).toContain(
            'the button stays in the tab order when off, rather than dropping focus as disabled does'
        );
        expect(tests.get('src/tokens.test.ts')).toContain(
            'the tokens holds every pairing to its ratio in the dark theme'
        );
        expect(tests.get('e2e/controls.spec.tsx')).toContain(
            'in forced colors keeps every state in sight where the page loses its own colors'
        );
        expect(tests.get('e2e/theme.spec.ts')).toContain(
            'draws the saved theme whatever the system, here light'
        );
    });

    it('names each test as its runner reports it, so a renamed or removed test fails here', () => {
        for (const [group, held] of Object.entries(HELD)) {
            for (const { file, titles } of held) {
                const run = tests.get(file) ?? [];
                expect(run, `${group}: ${file} is not a file of the kit's tests`).not.toEqual([]);
                for (const title of titles) {
                    expect(run, `${group}: ${file} has no test named "${title}"`).toContain(title);
                }
            }
        }
    });

    it('lists each file once in a group, and each test once in a file', () => {
        for (const [group, held] of Object.entries(HELD)) {
            const files = held.map(({ file }) => file);
            expect(new Set(files).size, group).toBe(files.length);
            for (const { file, titles } of held) {
                expect(new Set(titles).size, `${group}: ${file}`).toBe(titles.length);
                expect(titles.length, `${group}: ${file}`).toBeGreaterThan(0);
            }
        }
    });
});
