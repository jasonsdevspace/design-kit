// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { repositoryFiles } from './repository.mjs';

/*
 * What the workflows promise that only reading them can hold: a browser installed without the
 * system packages the runner already has, and within a time of its own, dependencies installed
 * without their install scripts, and the token that can publish or deploy held by the deploy job
 * alone in CI.
 */

const workflows = repositoryFiles(import.meta.url, (path) =>
    /^\.github\/workflows\/[^/]+\.ya?ml$/.test(path)
);

/** One step of a workflow: how far its dash is indented, and its lines. */
interface Step {
    readonly indent: string;
    readonly text: string;
}

/**
 * A workflow's steps, each with its lines, read without comments or Windows line ends. A comment
 * after a value is dropped as well as a line of one, so a step that mentions a flag in a comment
 * is not taken for using it.
 */
const stepsOf = (text: string): Step[] =>
    [
        ...`${text}\n`
            .replace(/\r\n/g, '\n')
            .replace(/^[ \t]*#.*\n/gm, '')
            .replace(/[ \t]+#[ \t].*$/gm, '')
            .matchAll(/^( *)- .*\n(?:\1 {2}.*\n|[ \t]*\n)*/gm),
    ].map(([step = '', indent = '']) => ({ indent, text: step }));

/** Whether a step installs a browser, by the Playwright package or command it runs. */
const installsBrowser = ({ text }: Step) =>
    /(?:@playwright\/test|playwright(?:-core)?)(?:@\S+)?\s+install\b/.test(text);

/** Whether the step has a time limit of its own, as a key of the step and not of an input. */
const hasOwnTimeLimit = ({ indent, text }: Step) =>
    new RegExp(`^${indent} {2}timeout-minutes: ['"]?[1-5]['"]?\\s*$`, 'm').test(text);

/** A workflow's jobs, each by its id with the lines under it, read without comments. */
const jobsOf = (text: string) => {
    const lines = `${text}\n`
        .replace(/\r\n/g, '\n')
        .replace(/^[ \t]*#.*\n/gm, '')
        .replace(/[ \t]+#[ \t].*$/gm, '');
    const start = lines.search(/^jobs:/m);
    if (start < 0) return [];
    return lines
        .slice(start)
        .split(/^ {4}(?=[A-Za-z_][\w-]*:\s*$)/m)
        .slice(1)
        .map((block) => ({
            id: block.slice(0, block.indexOf(':')),
            body: `\n${block.slice(block.indexOf('\n') + 1)}`,
        }));
};

/** npm's subcommands that install, in every spelling npm takes for them. */
const INSTALLS = new Set([
    'ci',
    'clean-install',
    'ic',
    'install-clean',
    'isntall-clean',
    'i',
    'in',
    'ins',
    'inst',
    'insta',
    'instal',
    'install',
    'isnt',
    'isnta',
    'isntal',
    'isntall',
    'add',
    'it',
    'cit',
    'install-test',
    'install-ci-test',
]);

/** npm's flags that take their value as the next word, so it is not read as the subcommand. */
const VALUED = new Set([
    '--prefix',
    '-C',
    '--workspace',
    '-w',
    '--cache',
    '--registry',
    '--userconfig',
]);

/** Whether an install's arguments skip install scripts, a value of false refused. */
const skipsScripts = (args: readonly string[]) =>
    args.some(
        (arg, index) =>
            arg === '--ignore-scripts=true' ||
            (arg === '--ignore-scripts' && args[index + 1] !== 'false')
    );

/** An npm or npx command: which it is, its subcommand, the words after that, and its line. */
interface NpmCommand {
    readonly npx: boolean;
    readonly command: string;
    readonly args: readonly string[];
    readonly line: string;
}

/**
 * Each npm or npx command in a step's text: its subcommand and the words after it, wherever it
 * sits, after a keyword, an assignment or another command, with continued lines joined and what is
 * quoted left out, so a message that names a command is not taken for one.
 */
const commandsIn = (text: string): NpmCommand[] =>
    text
        .replace(/\\\n\s*/g, ' ')
        .replace(/"[^"\n]*"|'[^'\n]*'/g, '""')
        .split(/\n|&&|\|\||;|\||\$\(|`/)
        .flatMap((part): NpmCommand[] => {
            const words = part.trim().split(/\s+/);
            const at = words.findIndex((word) => word === 'npm' || word === 'npx');
            if (at < 0) return [];
            const npx = words[at] === 'npx';
            const rest = words.slice(at + 1);
            if (npx) return [{ npx, command: '', args: rest, line: part.trim() }];
            let index = 0;
            while (index < rest.length && (rest[index] ?? '').startsWith('-')) {
                index += VALUED.has(rest[index] ?? '') ? 2 : 1;
            }
            return [
                {
                    npx,
                    command: rest[index] ?? '',
                    args: rest.slice(index + 1),
                    line: part.trim(),
                },
            ];
        });

describe('the workflows', () => {
    /** Every npm and npx command in the workflows' steps. */
    const npmCommands = () =>
        [...workflows.values()].flatMap(stepsOf).flatMap(({ text }) => commandsIn(text));
    const steps = [...workflows.values()].flatMap(stepsOf);

    it('install a browser without the system packages the runner already has', () => {
        // The packages come from Ubuntu's mirror, which has been slow enough to run a job out
        // of time before its tests began.
        expect(steps.filter(({ text }) => /--with-deps|\binstall-deps\b/.test(text))).toEqual([]);
    });

    it('give each browser install a time limit of its own', () => {
        const installs = steps.filter(installsBrowser);
        expect(installs.length).toBeGreaterThan(0);
        expect(installs.filter((step) => !hasOwnTimeLimit(step))).toEqual([]);
    });

    // The publishing job holds the token trusted publishing issues, so what it installs is what
    // a release trusts most.
    const publishing = stepsOf(workflows.get('.github/workflows/release.yml') ?? '');

    it('install npm where a release publishes only from a tarball held to a pinned checksum', () => {
        const installs = publishing.filter(({ text }) => /\bnpm install -g\b/.test(text));
        expect(installs.length).toBeGreaterThan(0);
        for (const { text } of installs) {
            expect(text).toMatch(/NPM_INTEGRITY: sha512-[A-Za-z0-9+/]+=*\s*$/m);
            // The digest is compared with the pin, and a mismatch stops the step, before the install.
            const compared = text.search(
                /if \[ "\$got" != "\$NPM_INTEGRITY" \]; then\n\s+echo[^\n]*\n\s+exit 1\n/
            );
            expect(text.indexOf('openssl dgst -sha512')).toBeGreaterThan(-1);
            expect(compared).toBeGreaterThan(text.indexOf('openssl dgst -sha512'));
            expect(compared).toBeLessThan(text.indexOf('npm install -g'));
            expect(text).toMatch(/npm install -g --offline --ignore-scripts "\$tarball"/);
            expect(text).not.toMatch(/npm install -g[^\n]*\bnpm@/);
        }
    });

    it('install dependencies without running their install scripts', () => {
        const installs = npmCommands().filter(({ command }) => INSTALLS.has(command));
        expect(installs.length).toBeGreaterThan(0);
        expect(installs.filter(({ args }) => !skipsScripts(args)).map(({ line }) => line)).toEqual(
            []
        );
    });

    it('run with npx only the tools the lockfile installed, so nothing is fetched with its scripts', () => {
        const bin = fileURLToPath(new URL('../node_modules/.bin/', import.meta.url));
        const fetched = npmCommands()
            .filter(({ npx, command }) => npx || command === 'exec' || command === 'x')
            .filter(({ args }) => {
                const tool = args.find((arg) => !arg.startsWith('-'));
                return tool === undefined || !existsSync(join(bin, tool));
            })
            .map(({ line }) => line);
        expect(fetched).toEqual([]);
    });

    it('read an install in any of its spellings, with its flags, wherever it sits in a step', () => {
        const read = (text: string) =>
            commandsIn(text)
                .filter(({ command }) => INSTALLS.has(command))
                .map(({ args }) => skipsScripts(args));
        expect(read('run: npm --prefix a ci')).toEqual([false]);
        expect(read('run: if [ -n "$X" ]; then npm clean-install; fi')).toEqual([false]);
        expect(read('run: FOO=1 npm ic --ignore-scripts')).toEqual([true]);
        expect(read('run: |\n    npm ci \\\n        --ignore-scripts')).toEqual([true]);
        expect(read('run: npm ci --ignore-scripts false')).toEqual([false]);
        expect(read('run: npm ci --ignore-scripts=true')).toEqual([true]);
        expect(read('run: npm ci --ignore-scripts=false')).toEqual([false]);
        // Words in a message that name a command are not a command.
        expect(read('run: echo "install it with `npm install x`"')).toEqual([]);
    });

    it('publish a kit that runs no script of its own when it is installed', () => {
        const manifest: unknown = JSON.parse(
            readFileSync(new URL('../packages/design-kit/package.json', import.meta.url), 'utf8')
        );
        const scripts =
            typeof manifest === 'object' && manifest !== null && 'scripts' in manifest
                ? Object.keys(manifest.scripts ?? {})
                : [];
        expect(scripts.filter((name) => /^(?:pre|post)?install$/.test(name))).toEqual([]);
    });

    it('give the token that can publish or deploy to the deploy job alone in CI', () => {
        // Called from a release, every job in CI runs as the release, so any of them holding the
        // token and naming the npm environment could publish to npm as the release does. The workflow's own permissions would
        // give it to every job, as write-all would give it to a job.
        const ci = (workflows.get('.github/workflows/ci.yml') ?? '')
            .replace(/\r\n/g, '\n')
            .replace(/^[ \t]*#.*\n/gm, '')
            .replace(/[ \t]+#[ \t].*$/gm, '');
        const grants = (text: string) => /id-token:\s*write|write-all/.test(text);
        const start = ci.search(/^jobs:/m);
        expect(start).toBeGreaterThan(-1);
        expect(grants(ci.slice(0, start))).toBe(false);
        const holding = ci
            .slice(start)
            .split(/^ {4}(?=[a-z][\w-]*:\s*$)/m)
            .filter(grants)
            .map((job) => job.slice(0, job.indexOf(':')));
        expect(holding).toEqual(['deploy']);
    });

    it('run every job on a named image, with a name and a time limit of its own', () => {
        const unready = [...workflows].flatMap(([path, text]) =>
            jobsOf(text)
                // A job that calls another workflow takes the image and the time limits of the
                // jobs in it.
                .filter(({ body }) => !/^ {8}uses:/m.test(body))
                .filter(
                    ({ body }) =>
                        !/^ {8}name: \S/m.test(body) ||
                        !/^ {8}timeout-minutes: \d+\s*$/m.test(body) ||
                        !/^ {8}runs-on: ubuntu-26\.04\s*$/m.test(body)
                )
                .map(({ id }) => `${path} ${id}`)
        );
        expect([...workflows.keys()].length).toBeGreaterThan(0);
        expect(unready).toEqual([]);
    });

    it("read a workflow's jobs by their ids, each with its own lines", () => {
        const jobs = jobsOf(
            [
                'on: push',
                'jobs:',
                '    build:',
                '        name: Build',
                '        runs-on: ubuntu-26.04',
                '        timeout-minutes: 5',
                '    checks:',
                '        uses: ./.github/workflows/ci.yml',
                '    Lint_All:',
                '        runs-on: ubuntu-26.04 # a comment after the value',
            ].join('\n')
        );
        expect(jobs.map(({ id }) => id)).toEqual(['build', 'checks', 'Lint_All']);
        expect(jobs[2]?.body).toMatch(/^ {8}runs-on: ubuntu-26\.04\s*$/m);
        expect(jobs[0]?.body).toContain('timeout-minutes: 5');
        expect(jobs[1]?.body).not.toContain('runs-on');
    });

    it('read a step the way GitHub does, whatever the step looks like', () => {
        const [step] = stepsOf(
            [
                '            - run: npx @playwright/test install chromium # not --with-deps',
                '              with:',
                '                  timeout-minutes: 3',
            ].join('\n')
        );
        if (!step) throw new Error('expected a step');
        expect(installsBrowser(step)).toBe(true);
        expect(step.text).not.toMatch(/--with-deps/);
        // A time limit given to an action's input is not the step's own.
        expect(hasOwnTimeLimit(step)).toBe(false);
        const [quoted] = stepsOf("    - run: npx playwright install\n      timeout-minutes: '3'");
        if (!quoted) throw new Error('expected a step');
        expect(hasOwnTimeLimit(quoted)).toBe(true);
    });
});
