// @vitest-environment node
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

describe('the workflows', () => {
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
        // Each command that installs from npm, in any of npm's spellings, where a command starts:
        // a line, a run, or after another command, rather than words in a message that name it.
        const command =
            /(?:^|run:|&&|\|\||;|\|)\s*npm\s+(?:ci|i|install|add|it|install-clean)\b[^\n&;|]*/gm;
        const installs = steps.flatMap(({ text }) => text.match(command) ?? []);
        expect(installs.length).toBeGreaterThan(0);
        expect(installs.filter((line) => !/--ignore-scripts(?!=)/.test(line))).toEqual([]);
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
