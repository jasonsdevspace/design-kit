// @vitest-environment node
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
    chmodSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
    readdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

import { repositoryFiles } from './repository.mjs';

/*
 * What the workflows promise that only reading them can hold: a browser installed without the
 * system packages the runner already has, and within a time of its own, dependencies installed
 * without their install scripts, and the token that can publish or deploy held by the deploy job
 * alone in CI, and the required Browser tests kept as a gate that passes only where every browser
 * job it waits on passed.
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

/**
 * What keeps CI's Browser tests from standing for every browser job in Chromium: the gate missing,
 * renamed or skipped where a job it needs fails, a job that runs Chromium's or the site's tests
 * left out of its needs, or a step that does not hold every needed job's result to success.
 */
const gateProblems = (text: string): string[] => {
    const jobs = jobsOf(text);
    const gate = jobs.find(({ id }) => id === 'browser');
    if (!gate) return ['no browser job'];
    const problems: string[] = [];
    if (!/^ {8}name: Browser tests\s*$/m.test(gate.body)) problems.push('not named Browser tests');
    if (!/^ {8}if: always\(\)\s*$/m.test(gate.body))
        problems.push('not run whatever its needs did');
    const needs = /^ {8}needs: \[([^\]]*)\]/m
        .exec(gate.body)?.[1]
        ?.split(',')
        .map((id) => id.trim());
    for (const { id, body } of jobs)
        if (
            id !== 'browser' &&
            /--project chromium|playwright test packages\/site/.test(body) &&
            !needs?.includes(id)
        )
            problems.push(`does not need ${id}`);
    if (!/\$\{\{ join\(needs\.\*\.result, ' '\) \}\}/.test(gate.body))
        problems.push("does not read every needed job's result");
    if (!/\[ "\$result" = success \] \|\| exit 1/.test(gate.body))
        problems.push('does not hold each result to success');
    return problems;
};

/** The shell's own words and the commands a job holding a token may run. */
const ALLOWED = new Set([
    'git',
    'gh',
    'echo',
    'cp',
    'exit',
    '[',
    'test',
    'true',
    'if',
    'then',
    'else',
    'elif',
    'fi',
    'for',
    'do',
    'done',
]);

/** Words an allowed command may not be given, since with them it runs anything. */
const ESCAPES = /^(?:git\s+(?:-c\b|.*\balias\b)|gh\s+(?:extension|alias)\b)/;

/** The lines of a `run` key's block, which runs on while they sit deeper than the key or are blank. */
const blockOf = (lines: readonly string[], at: number, indent: number, value: string): string[] => {
    if (!/^[|>][-+0-9]*$/.test(value)) return [value];
    const block: string[] = [];
    for (const next of lines.slice(at + 1)) {
        if (next.trim() !== '' && next.length - next.trimStart().length <= indent) break;
        block.push(next);
    }
    return block;
};

/**
 * Each command a script runs, from its first word, those in a `$()`, a process substitution or
 * after a single `&` among them, with the assignments before a command left off.
 */
const commandsOf = (script: string): string[] =>
    script
        .replace(/\\\n\s*/g, ' ')
        .split(/&&|\|\||;|\||&|\$\(|[<>]\(|`|\n/)
        .map((command) =>
            command
                .trim()
                .replace(/^(?:(?:if|then|else|elif|do|!)\s+)+/, '')
                .replace(/^(?:[A-Za-z_]\w*=(?:"[^"]*"|'[^']*'|\S*)\s*)+/, '')
                .trim()
        )
        .filter((command) => command !== '' && !command.startsWith('#'));

/**
 * What a job runs beyond what `ALLOWED` names: the first word of each command in its `run` blocks
 * that is not allowed or is given a word that lets it run anything, each action of the
 * repository's own it uses, any shell it names, and any write to the environment or the path later
 * steps run with.
 */
const straysOf = (body: string, repository = 'jasonsdevspace/design-kit'): string[] => {
    const lines = body.split('\n');
    return lines.flatMap((line, at) => {
        const uses = /^\s*(?:-\s+)?uses:\s*['"]?([^'"\s]+)/.exec(line)?.[1];
        if (uses?.startsWith('.') || uses?.startsWith(`${repository}/`)) return [uses];
        const shell = /^\s*(?:-\s+)?shell:\s*(\S+)/.exec(line)?.[1];
        if (shell) return [`shell: ${shell}`];
        const run = /^(\s*)(?:-\s+)?run:\s*(.*)$/.exec(line);
        if (!run) return [];
        const script = blockOf(lines, at, (run[1] ?? '').length, run[2] ?? '').join('\n');
        const written = /\$\{?GITHUB_(?:ENV|PATH)\b/.test(script)
            ? ['GITHUB_ENV or GITHUB_PATH']
            : [];
        return [
            ...written,
            ...commandsOf(script).flatMap((command) => {
                const first = command.split(/\s+/)[0] ?? '';
                return !ALLOWED.has(first) || ESCAPES.test(command) ? [first] : [];
            }),
        ];
    });
};

/**
 * npm's subcommands that install, or that run packages' install scripts, in every spelling npm's
 * command definitions accept. `audit fix` is read as well, since it installs what it changes.
 */
const INSTALL_ALIASES = new Set([
    'install',
    'i',
    'in',
    'ins',
    'inst',
    'insta',
    'instal',
    'isnt',
    'isnta',
    'isntal',
    'isntall',
    'add',
    'ci',
    'clean-install',
    'ic',
    'install-clean',
    'isntall-clean',
    'cit',
    'install-ci-test',
    'it',
    'install-test',
    'sit',
    'clean-install-test',
    'update',
    'up',
    'upgrade',
    'udpate',
    'dedupe',
    'ddp',
    'rebuild',
    'rb',
    'link',
    'ln',
]);

/** npm's and npx's options that take a value, so the value is not read as a command or a tool. */
const VALUED = new Set([
    '--prefix',
    '--workspace',
    '-w',
    '-C',
    '--cache',
    '--loglevel',
    '--userconfig',
    '--registry',
    '--scope',
    '--package',
    '-p',
    '--call',
    '-c',
]);

/** A text's lines with each backslash continuation joined, as the shell reads a command. */
const joinedLines = (text: string): string[] =>
    text.replace(/[ \t]*\\\r?\n[ \t]*/g, ' ').split('\n');

/** A line split into the commands the shell runs one after another, and where a substitution starts. */
const shellCommandsOf = (line: string): string[] =>
    line
        .split(/&&|\|\||;|\||&|\$\(|`/)
        .map((command) => command.trim())
        .filter(Boolean);

/** A command's words, split at spaces, quotes and the shell's own grouping and redirection. */
const wordsOf = (command: string): string[] => command.split(/[\s"'()<>]+/).filter(Boolean);

/** Whether a word runs npm, or npx, by name or by a path that ends in it. */
const runs = (word: string, tool: 'npm' | 'npx') => word === tool || word.endsWith(`/${tool}`);

/** Whether the last flag in a command that names install scripts turns them off, as npm reads it. */
const scriptsOff = (words: readonly string[]): boolean => {
    let off = false;
    words.forEach((word, at) => {
        if (word === '--ignore-scripts')
            off = !['false', '0', 'null'].includes(words[at + 1] ?? '');
        else if (word.startsWith('--ignore-scripts=')) off = word === '--ignore-scripts=true';
        else if (word === '--no-ignore-scripts') off = false;
    });
    return off;
};

/** Where the first word from `from` that is not a flag sits, passing over a flag's value. */
const operandAt = (words: readonly string[], from: number): number => {
    for (let at = from; at < words.length; at += 1) {
        const word = words[at] ?? '';
        if (word === '--') return at + 1 < words.length ? at + 1 : -1;
        if (!word.startsWith('-')) return at;
        if (VALUED.has(word)) at += 1;
    }
    return -1;
};

/**
 * Whether npx or `npm exec`, by its own options before the tool, may fetch what it runs: the last of
 * `--no-install`, `--no`, `--yes` and `-y` deciding, and fetching when none is given.
 */
const mayFetch = (words: readonly string[], from: number): boolean => {
    let fetches = true;
    for (let at = from; at < words.length; at += 1) {
        const word = words[at] ?? '';
        if (word === '--' || !word.startsWith('-')) break;
        if (word === '--no-install' || word === '--no') fetches = false;
        else if (word === '--yes' || word === '-y') fetches = true;
        else if (VALUED.has(word)) at += 1;
    }
    return fetches;
};

/**
 * The lines that install with npm and leave install scripts on, wherever they run, each command on
 * a line judged by its own flags: the word npm followed in the same command by an install
 * subcommand, or by `audit fix`, without the last flag that names install scripts turning them off.
 * The repository's `.npmrc` turns install scripts off for every install inside it, so this is the
 * second guard, for the installs that run outside it. A line that only mentions an install, such as
 * a message, is refused too and reworded rather than passing unread.
 */
const installsWithScripts = (lines: readonly string[]): string[] =>
    lines
        .filter((line) =>
            shellCommandsOf(line).some((command) => {
                const words = wordsOf(command);
                const at = words.findIndex((word) => runs(word, 'npm'));
                if (at < 0) return false;
                const after = words.slice(at + 1);
                const installs = after.some(
                    (word, index) =>
                        INSTALL_ALIASES.has(word) ||
                        (word === 'audit' && after[index + 1] === 'fix')
                );
                return installs && !scriptsOff(words);
            })
        )
        .map((line) => line.trim());

/**
 * The lines that could fetch a package and run it: an npx, `npm exec` or `npm x` whose own options
 * leave it free to fetch, and any `npm init` given an initializer or `npm create`, which always
 * fetch one.
 */
const fetchesToRun = (lines: readonly string[]): string[] =>
    lines
        .filter((line) =>
            shellCommandsOf(line).some((command) => {
                const words = wordsOf(command);
                return words.some((word, at) => {
                    if (runs(word, 'npx')) return mayFetch(words, at + 1);
                    if (!runs(word, 'npm')) return false;
                    const sub = operandAt(words, at + 1);
                    const subcommand = sub < 0 ? '' : (words[sub] ?? '');
                    if (subcommand === 'exec' || subcommand === 'x')
                        return mayFetch(words, sub + 1);
                    if (subcommand === 'create') return true;
                    if (subcommand === 'init' || subcommand === 'innit')
                        return operandAt(words, sub + 1) >= 0;
                    return false;
                });
            })
        )
        .map((line) => line.trim());

/**
 * The lines a workflow runs, with comment lines left out, each folded `>` block joined into the one
 * line it runs as and each backslash continuation joined.
 */
const workflowLines = (text: string): string[] => {
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const read: string[] = [];
    for (let at = 0; at < lines.length; at += 1) {
        const line = lines[at] ?? '';
        const folded = /^(\s*)(- )?[\w-]+:\s*>[-+0-9]*\s*$/.exec(line);
        if (!folded) {
            read.push(line);
            continue;
        }
        const keyIndent = (folded[1] ?? '').length + (folded[2] ? 2 : 0);
        const block: string[] = [];
        while (at + 1 < lines.length) {
            const next = lines[at + 1] ?? '';
            if (next.trim() !== '' && next.length - next.trimStart().length <= keyIndent) break;
            if (next.trim() !== '') block.push(next.trim());
            at += 1;
        }
        read.push(`${line.replace(/>[-+0-9]*\s*$/, '')}${block.join(' ')}`);
    }
    return joinedLines(read.join('\n')).filter((line) => !/^\s*#/.test(line));
};

/** A Dockerfile's RUN lines, each continuation joined, with a heredoc's body read as its commands. */
const dockerRunLines = (text: string): string[] => {
    const lines = joinedLines(text.replace(/\r\n/g, '\n'));
    const read: string[] = [];
    for (let at = 0; at < lines.length; at += 1) {
        const line = lines[at] ?? '';
        if (!/^\s*(?:ONBUILD\s+)?RUN\b/i.test(line)) continue;
        read.push(line);
        const heredoc = /<<-?\s*["']?(\w+)["']?/.exec(line);
        if (!heredoc) continue;
        while (at + 1 < lines.length && (lines[at + 1] ?? '').trim() !== heredoc[1]) {
            read.push(lines[at + 1] ?? '');
            at += 1;
        }
        at += 1;
    }
    return read;
};

/** The repository's Dockerfiles, by the names Docker gives them. */
const dockerfiles = repositoryFiles(import.meta.url, (path) =>
    /(?:^|\/)Dockerfile(?:\.[^/]+)?$|\.Dockerfile$/.test(path)
);

/**
 * The first npm that reads both `allow-git` and `allow-remote`, which the repository's `.npmrc`
 * sets. It is held by a test of the npm that runs the checks, not by `engines.npm` in the root
 * manifest, since Dependabot's npm updater reads that field and may refuse to run on an older npm,
 * which would stop version and security updates.
 */
const NPM_FLOOR = [11, 14, 0] as const;

/** A version's numbers, with any prerelease or build suffix left off. */
const versionParts = (version: string): number[] =>
    version
        .trim()
        .replace(/[-+].*$/, '')
        .split('.')
        .map(Number);

/** Whether a version is at least the floor, number by number. */
const atLeast = (version: readonly number[], floor: readonly number[]): boolean => {
    const differs = floor.findIndex((part, index) => (version[index] ?? 0) !== part);
    return differs < 0 || (version[differs] ?? 0) > (floor[differs] ?? 0);
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

    // A workflow that can publish to npm, by the environment npm's trusted publisher is registered
    // against. Its publishing job holds the token trusted publishing issues, so what it installs is
    // what a release trusts most, and every such workflow is held to the same rules.
    const releases = [...workflows].filter(([, text]) =>
        /^\s+environment:\s*(?:npm|\n\s+name:\s*npm)\s*$/m.test(text)
    );
    const publishing = releases.flatMap(([, text]) => stepsOf(text));

    // The kit releases through the one workflow, from its own tag.
    const RELEASE = '.github/workflows/release.yml';
    const PACKAGES = ['design-kit'] as const;
    const releaseJob = (id: string) =>
        jobsOf(workflows.get(RELEASE) ?? '').find((job) => job.id === id)?.body ?? '';

    it("publish to npm from one workflow, from the kit's tag", () => {
        expect(releases.map(([path]) => path)).toEqual([RELEASE]);
        for (const name of PACKAGES)
            expect(workflows.get(RELEASE)).toMatch(new RegExp(`^\\s+- '${name}-v\\*'\\s*$`, 'm'));
    });

    it('use no cache in any workflow that publishes to npm', () => {
        expect(
            releases
                .filter(([, text]) => !/^cache-mode: none\s*$/m.test(text))
                .map(([path]) => path)
        ).toEqual([]);
    });

    it('publish the tarball CI packed, from its artifact and the checksum the oldest Node check reported', () => {
        const publish = releaseJob('publish');
        expect(publish).toMatch(/^\s+name: design-kit-package\s*$/m);
        expect(publish).toMatch(
            /^ {12}SHA256: \$\{\{ needs\.checks\.outputs\.package-sha256 \}\}$/m
        );
        const ci = workflows.get('.github/workflows/ci.yml') ?? '';
        expect(ci).toMatch(/^\s+name: design-kit-package\s*$/m);
        expect(ci).toMatch(/^ {16}value: \$\{\{ jobs\.floor\.outputs\.sha256 \}\}$/m);
    });

    it('record only a stable release, and open the records only once they are recorded', () => {
        expect(releaseJob('records')).toMatch(
            /^ {8}if: needs\.agree\.outputs\.prerelease != 'true'$/m
        );
        expect(releaseJob('records-pull-request')).toMatch(/^\s+needs: \[agree, records\]\s*$/m);
        expect(releaseJob('records-pull-request')).toMatch(
            /^\s+if: needs\.records\.result == 'success'\s*$/m
        );
    });

    it('stop a release while a change file is left beside its package', () => {
        for (const name of PACKAGES)
            expect(
                existsSync(new URL(`../packages/${name}/changes/README.md`, import.meta.url)),
                name
            ).toBe(true);
        expect(releaseJob('agree')).toMatch(/^\s+dir=packages\/design-kit\s*$/m);
        expect(releaseJob('agree')).toMatch(
            /left=\$\(find "\$dir\/changes" ! -type d ! -path "\$dir\/changes\/README\.md"\)\n\s+if \[ -n "\$left" \]; then\n(?:\s+echo[^\n]*\n)+\s+exit 1\n/
        );
    });

    it('install npm where a release publishes only from a tarball held to a pinned checksum', () => {
        for (const [path, text] of releases)
            expect(
                stepsOf(text).some(({ text: step }) => /\bnpm install -g\b/.test(step)),
                path
            ).toBe(true);
        const installs = publishing.filter(({ text }) => /\bnpm install -g\b/.test(text));
        expect(installs.length).toBeGreaterThan(0);
        for (const { text } of installs) {
            expect(text).toMatch(/NPM_INTEGRITY: sha512-[A-Za-z0-9+/]+=*\s*$/m);
            // The digest is compared with the pin, and a mismatch stops the step, before the
            // install.
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

    it('grant only read access to the repository by default, in every workflow', () => {
        expect(
            [...workflows]
                .filter(
                    ([, text]) => !/^permissions:\n {4}contents: read\n(?! {4}[\w-]+:)/m.test(text)
                )
                .map(([path]) => path)
        ).toEqual([]);
    });

    it('pin every action to a full commit, in every workflow', () => {
        const unpinned = [...workflows].flatMap(([path, text]) =>
            [...text.matchAll(/^\s+(?:- )?uses: (\S+)/gm)]
                .map((match) => match[1] ?? '')
                .filter((use) => !use.startsWith('./') && !/@[0-9a-f]{40}$/.test(use))
                .map((use) => `${path} ${use}`)
        );
        expect(unpinned).toEqual([]);
        for (const path of ['.github/workflows/message.yml', '.github/workflows/release.yml'])
            expect(workflows.get(path) ?? '', path).toMatch(/uses: \S+@[0-9a-f]{40}/);
    });

    it('check out without keeping the token in the repository, in every workflow', () => {
        const keeping = [...workflows].flatMap(([path, text]) =>
            stepsOf(text)
                .filter(({ text: step }) => /uses: actions\/checkout@/.test(step))
                .filter(({ text: step }) => !/^\s+persist-credentials: false$/m.test(step))
                .map(() => path)
        );
        expect(keeping).toEqual([]);
        expect(workflows.get('.github/workflows/message.yml') ?? '').toMatch(
            /uses: actions\/checkout@/
        );
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

    it('give the token that can publish or deploy to no job in CI, and to the deploy job alone where the site deploys', () => {
        // Called from a release, every job in CI runs as the release, so any of them holding the
        // token and naming the npm environment could publish to npm as the release does, and a
        // caller has to grant whatever a job in it asks for. The workflow's own permissions would
        // give it to every job, as write-all would give it to a job.
        const holdingIn = (path: string) => {
            const text = (workflows.get(path) ?? '')
                .replace(/\r\n/g, '\n')
                .replace(/^[ \t]*#.*\n/gm, '')
                .replace(/[ \t]+#[ \t].*$/gm, '');
            const grants = (part: string) =>
                /id-token:\s*write|pages:\s*write|write-all/.test(part);
            const start = text.search(/^jobs:/m);
            expect(start, path).toBeGreaterThan(-1);
            expect(grants(text.slice(0, start)), path).toBe(false);
            return text
                .slice(start)
                .split(/^ {4}(?=[a-z][\w-]*:\s*$)/m)
                .filter(grants)
                .map((job) => job.slice(0, job.indexOf(':')));
        };
        expect(holdingIn('.github/workflows/ci.yml')).toEqual([]);
        expect(holdingIn(DEPLOY)).toEqual(['deploy']);
    });

    it("run only git, gh and the shell's own words in a job that holds a token that can write", () => {
        // A token from an app can push and open pull requests, so the job that takes one runs no
        // command but those it needs, rather than none of a list of runners, so a script, a package
        // or an action of the repository's own, which a dependency's code or a change on a branch
        // could reach it through, fails here whatever runs it.
        const holding = [...workflows].flatMap(([path, text]) =>
            jobsOf(text)
                .filter(({ body }) => /actions\/create-github-app-token@/.test(body))
                .map(({ id, body }) => ({ job: `${path} ${id}`, strays: straysOf(body) }))
        );
        expect(holding.map(({ job }) => job)).toEqual(
            expect.arrayContaining([
                '.github/workflows/release.yml records-pull-request',
                '.github/workflows/site-pages.yml record-pull-request',
            ])
        );
        expect(holding.filter(({ strays }) => strays.length > 0)).toEqual([]);
        // An artifact the build job made lands apart from the checkout, so none of its files, such
        // as a git setting, reaches the folder git runs in but those the job copies in by name.
        const landing = [...workflows].flatMap(([path, text]) =>
            jobsOf(text)
                .filter(({ body }) => /actions\/create-github-app-token@/.test(body))
                .flatMap(({ id, body }) =>
                    body
                        .split(/\n(?=\s+- name:)/)
                        .filter((step) => /actions\/download-artifact@/.test(step))
                        .filter((step) => !/^\s+path:\s*\$\{\{\s*runner\.temp\s*\}\}\//m.test(step))
                        .map(() => `${path} ${id}`)
                )
        );
        expect(landing).toEqual([]);
        const steps = (line: string) => `\n        steps:\n            - ${line}\n`;
        const stray = (line: string) => straysOf(steps(line));
        expect(stray('run: npx something')).toEqual(['npx']);
        expect(stray('run: ./scripts/release.sh')).toEqual(['./scripts/release.sh']);
        expect(stray('run: .github/scripts/x.sh')).toEqual(['.github/scripts/x.sh']);
        expect(stray('run: source x.sh')).toEqual(['source']);
        expect(stray('run: . x.sh')).toEqual(['.']);
        expect(stray('run: NODE_OPTIONS=x npm ci')).toEqual(['npm']);
        expect(stray('run: git status & npm ci')).toEqual(['npm']);
        expect(stray('run: echo <(npm ci)')).toEqual(['npm']);
        expect(stray("run: git -c alias.x='!npm ci' x")).toEqual(['git']);
        expect(stray('run: gh extension install x')).toEqual(['gh']);
        expect(stray('run: echo "$PWD/scripts" >> "$GITHUB_PATH"')).toEqual([
            'GITHUB_ENV or GITHUB_PATH',
        ]);
        expect(stray('uses: ./.github/actions/x')).toEqual(['./.github/actions/x']);
        expect(stray("uses: './.github/actions/x'")).toEqual(['./.github/actions/x']);
        expect(stray('uses: jasonsdevspace/design-kit/.github/actions/x@main')).toEqual([
            'jasonsdevspace/design-kit/.github/actions/x@main',
        ]);
        expect(straysOf(`${steps('run: echo hi')}              shell: node {0}\n`)).toEqual([
            'shell: node',
        ]);
        expect(stray('run: |-\n                  gh pr list')).toEqual([]);
        expect(
            stray('run: |\n                  open="$(gh pr list)"\n                  git push')
        ).toEqual([]);
    });

    it('name no secret but in a job that holds the records token, and none for a whole workflow', () => {
        // A secret named in a job is sent to that job's runner, where any code the job runs can
        // read it, so only the jobs that run nothing but git and gh name one, and a secret named
        // before the jobs, which every job would take, is refused outright.
        const naming = [...workflows].flatMap(([path, text]) => {
            const jobs = jobsOf(text);
            expect(jobs.length, `${path} has jobs the test can read`).toBeGreaterThan(0);
            const before = text.slice(0, Math.max(0, text.search(/^jobs:/m)));
            return [
                ...(/\bsecrets\b/.test(before) ? [`${path} before its jobs`] : []),
                ...jobs
                    .filter(({ body }) => /\bsecrets\b(?!\.GITHUB_TOKEN\b)/.test(body))
                    .filter(
                        ({ body }) =>
                            !/actions\/create-github-app-token@/.test(body) ||
                            straysOf(body).length > 0
                    )
                    .map(({ id }) => `${path} ${id}`),
            ];
        });
        expect(naming).toEqual([]);
    });

    // Ubuntu, but for CI's jobs that draw in WebKit, on a Mac, where it needs no system packages,
    // and the job that keeps their installed dependencies. Firefox starts on what the Ubuntu image
    // has, which leaves the Mac runners an account may use at once to WebKit's shards.
    it('run every job on a named image, with a name and a time limit of its own', () => {
        const unready = [...workflows].flatMap(([path, text]) =>
            jobsOf(text)
                // A job that calls another workflow takes the image and the time limits of the
                // jobs in it.
                .filter(({ body }) => !/^ {8}uses:/m.test(body))
                .filter(
                    ({ id, body }) =>
                        !/^ {8}name: \S/m.test(body) ||
                        !/^ {8}timeout-minutes: \d+\s*$/m.test(body) ||
                        !(
                            (path === '.github/workflows/ci.yml' && id === 'webkit') ||
                            (path === '.github/workflows/dependencies.yml' &&
                                id === 'dependencies-mac')
                                ? /^ {8}runs-on: macos-26\s*$/m
                                : /^ {8}runs-on: ubuntu-26\.04\s*$/m
                        ).test(body)
                )
                .map(({ id }) => `${path} ${id}`)
        );
        expect([...workflows.keys()].length).toBeGreaterThan(0);
        expect(unready).toEqual([]);
    });

    it('keep the required Browser tests as a gate on every browser job in Chromium', () => {
        expect(gateProblems(workflows.get('.github/workflows/ci.yml') ?? '')).toEqual([]);
    });

    // WebKit and Firefox run the specs slower than Chromium, so each takes more shards to end well
    // inside a job's time limit. Each job reads how many from the strategy's total, for
    // its name as for what it runs, so the matrix's list is the one place the number is set.
    it('run WebKit and Firefox in more shards than Chromium, each counted from its matrix alone', () => {
        const jobs = jobsOf(workflows.get('.github/workflows/ci.yml') ?? '');
        const bodyOf = (engine: string) => jobs.find(({ id }) => id === engine)?.body ?? '';
        const shardsOf = (engine: string) =>
            /^ {16}shard: \[([^\]]*)\]\s*$/m
                .exec(bodyOf(engine))?.[1]
                ?.split(',')
                .map((shard) => Number(shard)) ?? [];
        const chromium = shardsOf('chromium');
        expect(chromium.length).toBeGreaterThan(0);
        for (const engine of ['chromium', 'webkit', 'firefox']) {
            const body = bodyOf(engine);
            const shards = shardsOf(engine);
            expect(shards, engine).toEqual(shards.map((_, index) => index + 1));
            if (engine !== 'chromium')
                expect(shards.length, engine).toBeGreaterThan(chromium.length);
            expect(body, engine).toMatch(
                /^ {8}name: .*shard \$\{\{ matrix\.shard \}\} of \$\{\{ strategy\.job-total \}\}\s*$/m
            );
            expect(body, engine).toContain('SHARDS: ${{ strategy.job-total }}');
            expect(body, engine).toContain(`--project ${engine} --shard "$SHARD/$SHARDS"`);
        }
    });

    // The dependencies workflow alone writes the cache of installed dependencies, on a push to main
    // alone, and its jobs run nothing but the install. Every CI job reads it and installs afresh on
    // a miss, the jobs that build what is published or deployed always install afresh, and a
    // release reads it only in the checks it calls, which ask for no more than that, so the run
    // starts.
    describe('the cache of installed dependencies', () => {
        const ci = workflows.get('.github/workflows/ci.yml') ?? '';
        const writer = workflows.get('.github/workflows/dependencies.yml') ?? '';
        const jobs = jobsOf(ci);
        const WRITERS = ['dependencies', 'dependencies-mac'];
        const FRESH = ['floor'];
        const KEY =
            /key: deps-\$\{\{ runner\.os \}\}-\$\{\{ runner\.arch \}\}-node-\$\{\{ steps\.node\.outputs\.node-version \}\}-\$\{\{ hashFiles\('package-lock\.json'\) \}\}\s*$/m;
        const PATHS = /path: \|\n\s+node_modules\n\s+packages\/\*\/node_modules\n/;
        const stepTexts = (body: string) => stepsOf(body).map(({ text }) => text);
        const at = (steps: readonly string[], pattern: RegExp) =>
            steps.findIndex((text) => pattern.test(text));
        const RESTORE = /uses: actions\/cache\/restore@[0-9a-f]{40}\b/;
        const SAVE = /uses: actions\/cache\/save@[0-9a-f]{40}\b/;
        const INSTALL = /\bnpm ci\b/;

        it('reads it in CI and on the site pages, and in a release only in the checks it calls', () => {
            expect(ci).toMatch(/^cache-mode: read\s*$/m);
            // A called workflow that asks for more than its caller allows never starts.
            expect(ci).not.toMatch(/cache-mode: (?:write|write-only)\b/);
            expect(workflows.get('.github/workflows/site-pages.yml') ?? '').toMatch(
                /^cache-mode: read\s*$/m
            );
            expect(workflows.get(DEPLOY) ?? '').toMatch(/^cache-mode: read\s*$/m);
            expect(releases.length).toBe(1);
            for (const [path, text] of releases) {
                expect(text, path).toMatch(/^cache-mode: none\s*$/m);
                const checks = jobsOf(text).find(({ body }) =>
                    /^ {8}uses: \.\/\.github\/workflows\/ci\.yml\s*$/m.test(body)
                );
                expect(checks?.body ?? '', path).toMatch(/^ {8}cache-mode: read\s*$/m);
            }
        });

        it('writes it from the dependencies workflow alone, on a push to main, straight after the install', () => {
            const writing = [...workflows].flatMap(([path, text]) =>
                /^cache-mode: (?:write|write-only)\b/m.test(text)
                    ? jobsOf(text).map(({ id }) => `${path} ${id}`)
                    : jobsOf(text)
                          .filter(
                              ({ body }) =>
                                  /^ {8}cache-mode: (?:write|write-only)\b/m.test(body) ||
                                  SAVE.test(body)
                          )
                          .map(({ id }) => `${path} ${id}`)
            );
            expect(writing.sort()).toEqual(
                WRITERS.map((id) => `.github/workflows/dependencies.yml ${id}`).sort()
            );
            expect(writer).toMatch(/^on:\n {4}push:\n {8}branches: \[main\]\n\n/m);
            for (const id of WRITERS) {
                const body = jobsOf(writer).find((job) => job.id === id)?.body ?? '';
                const steps = stepTexts(body);
                const install = at(steps, INSTALL);
                expect(install, id).toBeGreaterThan(at(steps, RESTORE));
                expect(at(steps, SAVE), id).toBe(install + 1);
                expect(steps[at(steps, SAVE)], id).toMatch(
                    /key: \$\{\{ steps\.deps\.outputs\.cache-primary-key \}\}/
                );
                expect(steps[at(steps, SAVE)], id).toMatch(PATHS);
                expect(steps[at(steps, RESTORE)], id).toMatch(KEY);
                // Nothing but the install runs in it.
                expect(
                    steps.filter((text) => /^\s*(?:- )?run:/m.test(text)),
                    id
                ).toHaveLength(1);
            }
        });

        it('restores it before each other install, keyed on the system, Node and the lockfile, and installs only on a miss', () => {
            const unready = jobs
                .filter(({ id, body }) => INSTALL.test(body) && !FRESH.includes(id))
                .flatMap(({ id, body }) => {
                    const steps = stepTexts(body);
                    const restore = at(steps, RESTORE);
                    const install = at(steps, INSTALL);
                    const problems: string[] = [];
                    if (
                        !/^\s+id: node\s*$/m.test(
                            steps[at(steps, /uses: actions\/setup-node@/)] ?? ''
                        )
                    )
                        problems.push('names no Node version for its key');
                    if (restore < 0 || restore > install)
                        problems.push('restores nothing before it installs');
                    else {
                        if (!/^\s+id: deps\s*$/m.test(steps[restore] ?? ''))
                            problems.push('reads no hit');
                        if (!KEY.test(steps[restore] ?? ''))
                            problems.push('keys its restore on something else');
                        if (!PATHS.test(steps[restore] ?? ''))
                            problems.push('restores other paths');
                    }
                    if (!/if: steps\.deps\.outputs\.cache-hit != 'true'/.test(steps[install] ?? ''))
                        problems.push('installs on a hit');
                    return problems.map((problem) => `${id} ${problem}`);
                });
            expect(jobs.filter(({ body }) => INSTALL.test(body)).length).toBeGreaterThan(
                FRESH.length
            );
            expect(unready).toEqual([]);
        });

        it('installs afresh where a job builds what is published or deployed', () => {
            const built = [
                ...FRESH.map((id) => jobs.find((job) => job.id === id)),
                jobsOf(workflows.get(DEPLOY) ?? '').find((job) => job.id === 'site'),
            ];
            for (const [index, job] of built.entries()) {
                const id = job?.id ?? String(index);
                const body = job?.body ?? '';
                expect(body, id).toMatch(INSTALL);
                expect(body, id).not.toMatch(RESTORE);
                expect(body, id).not.toMatch(/cache-hit/);
            }
        });
    });

    // The WebKit shards name their workers, and the job's comment says why.
    it('run the WebKit shards with two workers on their Mac runners', () => {
        const webkit =
            jobsOf(workflows.get('.github/workflows/ci.yml') ?? '').find(
                ({ id }) => id === 'webkit'
            )?.body ?? '';
        expect(webkit).toMatch(/npm run e2e -- --project webkit\b[^\n]*--workers 2\b/);
    });

    // The Chromium shards run the site's tests against its pinned release only where the site
    // tests script says, which needs the pull request's merge and its base, and the site's tests
    // over the commit's kit run on every change in a job of their own.
    it('run the site tests against the pinned release where the script says, and over the kit always', () => {
        const ci = workflows.get('.github/workflows/ci.yml') ?? '';
        const jobs = jobsOf(ci);
        const chromium = jobs.find(({ id }) => id === 'chromium')?.body ?? '';
        const steps = stepsOf(chromium).map(({ text }) => text);
        const checkout = steps.find((text) => /uses: actions\/checkout@/.test(text)) ?? '';
        expect(checkout).toMatch(/^\s+fetch-depth: 2\s*$/m);
        const decide = steps.findIndex((text) =>
            /node scripts\/site-tests\.mjs "\$EVENT"/.test(text)
        );
        const run = steps.findIndex((text) => /npm run e2e -- --project chromium\b/.test(text));
        expect(decide).toBeGreaterThan(-1);
        expect(steps[decide]).toMatch(/^\s+id: site\s*$/m);
        expect(steps[decide]).toMatch(/EVENT: \$\{\{ github\.event_name \}\}/);
        expect(run).toBeGreaterThan(decide);
        expect(steps[run]).toMatch(
            /SKIP_SITE: \$\{\{ steps\.site\.outputs\.tests == 'skip' && '1' \|\| '' \}\}/
        );
        const skipping = [...workflows].flatMap(([path, text]) =>
            jobsOf(text)
                .filter(({ body }) => /\bSKIP_SITE\b/.test(body))
                .map(({ id }) => `${path} ${id}`)
        );
        expect(skipping).toEqual(['.github/workflows/ci.yml chromium']);
        const siteKit = jobs.find(({ id }) => id === 'site-kit')?.body ?? '';
        expect(siteKit).toMatch(
            /npx --no-install playwright test packages\/site --project chromium/
        );
        expect(siteKit).not.toMatch(/^ {8}if:/m);
    });

    it('find a gate that stops checking a job it needs', () => {
        const ci = workflows.get('.github/workflows/ci.yml') ?? '';
        expect(
            gateProblems(ci.replace('needs: [chromium, site-kit]', 'needs: [chromium]'))
        ).toEqual(['does not need site-kit']);
        expect(
            gateProblems(ci.replace('join(needs.*.result', 'join(needs.chromium.result'))
        ).toEqual(["does not read every needed job's result"]);
        expect(gateProblems(ci.replace('        if: always()\n', ''))).toEqual([
            'not run whatever its needs did',
        ]);
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

const DEPLOY = '.github/workflows/deploy.yml';

describe('the deploy workflow', () => {
    const text = workflows.get(DEPLOY) ?? '';
    const job = (id: string) => jobsOf(text).find((found) => found.id === id)?.body ?? '';

    it('runs on a push to main alone, and CI runs only on pull requests and when called', () => {
        expect(text).toMatch(/^on:\n {4}push:\n {8}branches: \[main\]\n\n/m);
        const ci = workflows.get('.github/workflows/ci.yml') ?? '';
        const triggers = /^on:\n((?: {4}.*\n|[ \t]*\n)*)/m.exec(ci)?.[1] ?? '';
        expect(triggers.match(/^ {4}[a-z_]+(?=:)/gm)?.map((name) => name.trim())).toEqual([
            'pull_request',
            'workflow_call',
        ]);
    });

    it('builds the site only once every check in CI has passed, and deploys only what it built', () => {
        expect(job('checks')).toMatch(/^ {8}uses: \.\/\.github\/workflows\/ci\.yml\s*$/m);
        expect(job('checks')).toMatch(/^ {8}permissions:\n {12}contents: read\n(?! {12})/m);
        expect(job('site')).toMatch(/^ {8}needs: checks\s*$/m);
        expect(job('site')).toMatch(/uses: actions\/upload-pages-artifact@[0-9a-f]{40}\b/);
        expect(job('deploy')).toMatch(/^ {8}needs: site\s*$/m);
        expect(job('deploy')).toMatch(
            /^ {8}permissions:\n {12}pages: write\n {12}id-token: write\n {8}environment:\n {12}name: github-pages\n/m
        );
    });

    it('runs one deploy at a time, never canceling one under way', () => {
        expect(text).toMatch(/^concurrency:\n {4}group: deploy\n {4}cancel-in-progress: false\n/m);
    });
});

describe('the release workflow', () => {
    const text = workflows.get('.github/workflows/release.yml') ?? '';
    const jobs = jobsOf(text);
    const job = (id: string) => jobs.find((found) => found.id === id)?.body ?? '';

    it('runs one release at a time for a tag, never canceling one under way', () => {
        expect(text).toMatch(
            /^concurrency:\n {4}group: release-\$\{\{ github\.ref \}\}\n {4}cancel-in-progress: false\n/m
        );
    });

    it('releases only a commit on main', () => {
        expect(job('agree')).toMatch(
            /^ {18}if ! git merge-base --is-ancestor "\$GITHUB_SHA" origin\/main; then\n {22}echo "the tagged commit is not on main"\n {22}exit 1\n/m
        );
    });

    it('grants the checks it calls read access alone', () => {
        expect(job('checks')).toMatch(/^ {8}permissions:\n {12}contents: read\n(?! {12})/m);
    });

    it('holds the npm environment and its publishing token in the publish job alone', () => {
        expect(
            jobs.filter(({ body }) => /^ {8}environment: npm$/m.test(body)).map(({ id }) => id)
        ).toEqual(['publish']);
        expect(job('publish')).toMatch(
            /^ {8}permissions:\n {12}contents: read\n {12}id-token: write\n/m
        );
    });

    it('stages with provenance, under next for a version with a hyphen and latest otherwise', () => {
        const publish = job('publish');
        expect(publish).toMatch(
            /^ {18}tag=latest\n {18}\[ "\$PRERELEASE" = "true" \] && tag=next\n {18}npm stage publish "\$tarball" --provenance --access public --tag "\$tag"$/m
        );
        expect(job('agree')).toMatch(
            /^ {22}\*-\*\) echo "prerelease=true" >> "\$GITHUB_OUTPUT" ;;$/m
        );
    });

    it("leaves each kit release the repository's latest, as GitHub marks it", () => {
        expect(text).not.toMatch(/--latest/);
    });
});

/** How far a line is indented. */
const indentOf = (line: string): number => line.length - line.trimStart().length;

/** Where a step key sits: its indent, and two more past a dash that opens the step. */
const keyIndentOf = (line: string): number => indentOf(line) + (/^\s*- /.test(line) ? 2 : 0);

/** The lines after `start` that sit deeper than `base`, blank lines among them. */
const linesUnder = (lines: readonly string[], start: number, base: number): string[] => {
    const body: string[] = [];
    for (const line of lines.slice(start + 1)) {
        if (line.trim() !== '' && indentOf(line) <= base) break;
        body.push(line);
    }
    return body;
};

/** The `run:` block key above line `at`, in the same step, or -1 when that step has none. */
const runKeyAbove = (lines: readonly string[], at: number): number => {
    for (let start = at; start >= 0; start -= 1) {
        const line = lines[start] ?? '';
        if (/^\s*(?:- )?run: [|>][-+0-9]*\s*$/.test(line)) return start;
        if (start < at && /^\s*- /.test(line)) return -1;
    }
    return -1;
};

/**
 * The lines of the `run:` block in the step that holds `needle`, as the shell receives them, with
 * the block's own indent taken off, or nothing when no block in that step holds it.
 */
const runBlockWith = (text: string, needle: string): string => {
    const lines = text.split('\n');
    const start = runKeyAbove(
        lines,
        lines.findIndex((line) => line.includes(needle))
    );
    if (start < 0) return '';
    const block = linesUnder(lines, start, keyIndentOf(lines[start] ?? ''));
    const indent = Math.min(...block.filter((line) => line.trim() !== '').map(indentOf));
    return block.map((line) => line.slice(indent)).join('\n');
};

/**
 * Every `run:` value in a workflow, and every `script:` input, which an `actions/github-script`
 * step runs, so a test can read what reaches a shell or a script and nothing else. A block's lines,
 * and a plain or quoted value's continuation lines, sit deeper than its key, and the key of a
 * `- run:` step sits two places past the dash.
 */
const runsIn = (text: string): string[] => {
    const lines = text.split('\n');
    return lines.flatMap((line, at) => {
        const value = /^\s*(?:- )?(?:run|script):\s*(.*)$/.exec(line)?.[1];
        if (value === undefined) return [];
        const first = /^[|>][-+0-9]*\s*$/.test(value) ? '' : value;
        return [[first, ...linesUnder(lines, at, keyIndentOf(line))].join('\n').trim()];
    });
};

/** A workflow's text without its comment lines, so a word in a comment is not taken for a key. */
const uncommented = (text: string): string => text.replace(/^\s*#.*$/gm, '');

/** Each `npx`, `npm exec` or `npm x` on a line that could fetch a package rather than run one installed. */
const fetchingRuns = (line: string): string[] => [
    ...[...line.matchAll(/\bnpx\b(?! --no-install\b)/g)].map(() => line),
    ...[...line.matchAll(/\bnpm (?:exec|x)\b((?:\s+-\S+)*)/g)]
        .filter((match) => !/\s--no(?:-install)?\b/.test(match[1] ?? ''))
        .map(() => line),
];

describe("the message workflow's check", () => {
    const message = workflows.get('.github/workflows/message.yml') ?? '';
    const script = runBlockWith(message, 'check-commit-message.mjs');
    let work = '';
    let version = '';
    let tarball = '';
    let integrity = '';
    let registry = '';

    beforeAll(() => {
        work = mkdtempSync(join(tmpdir(), 'message-check-'));
        const removeWork = () => rmSync(work, { recursive: true, force: true });
        try {
            pack();
        } catch (error) {
            removeWork();
            throw error;
        }
        return removeWork;
    });

    /** Packs the installed prose check into the work folder and records what the lockfile would. */
    const pack = () => {
        const installed = fileURLToPath(
            new URL('../node_modules/@jasonsdevspace/prose-check', import.meta.url)
        );
        const manifest: unknown = JSON.parse(readFileSync(join(installed, 'package.json'), 'utf8'));
        version =
            typeof manifest === 'object' &&
            manifest !== null &&
            'version' in manifest &&
            typeof manifest.version === 'string'
                ? manifest.version
                : '';
        execFileSync('npm', ['pack', '--ignore-scripts', '--pack-destination', work, installed], {
            stdio: 'ignore',
        });
        tarball = join(work, readdirSync(work).find((name) => name.endsWith('.tgz')) ?? '');
        integrity = `sha512-${createHash('sha512').update(readFileSync(tarball)).digest('base64')}`;
        registry = `https://registry.npmjs.org/@jasonsdevspace/prose-check/-/prose-check-${version}.tgz`;
    };

    /** One case of the step: a lockfile entry's fields over the real ones, a title, a body and an author. */
    interface Case {
        readonly entry?: Readonly<Record<string, string>> | null;
        readonly title?: string;
        readonly body?: string;
        readonly author?: string;
    }

    /**
     * How the step ends for a lockfile entry, a title, a body and an author, run as GitHub runs a
     * step, with `curl` replaced by one that serves the packed prose check whatever address it is
     * given. An entry of `null` leaves the prose check out of the lockfile.
     */
    const ends = (given: Case = {}) => {
        const { entry, title, body, author } = {
            entry: {},
            title: 'Check each pull request title',
            body: 'A plain body.',
            author: 'someone',
            ...given,
        };
        const dir = mkdtempSync(join(work, 'case-'));
        const bin = join(dir, 'bin');
        const temp = join(dir, 'temp');
        mkdirSync(bin);
        mkdirSync(temp);
        const packages =
            entry === null
                ? {}
                : {
                      'node_modules/@jasonsdevspace/prose-check': {
                          version,
                          resolved: registry,
                          integrity,
                          ...entry,
                      },
                  };
        writeFileSync(join(dir, 'package-lock.json'), JSON.stringify({ packages }));
        writeFileSync(
            join(bin, 'curl'),
            `#!/bin/bash\nwhile [ $# -gt 1 ]; do [ "$1" = --output ] && out=$2; shift; done\ncp "${tarball}" "$out"\n`
        );
        chmodSync(join(bin, 'curl'), 0o755);
        const { status, stdout, stderr } = spawnSync(
            'bash',
            ['--noprofile', '--norc', '-eo', 'pipefail', '-c', script],
            {
                cwd: dir,
                encoding: 'utf8',
                env: {
                    PATH: `${bin}:${process.env['PATH'] ?? ''}`,
                    RUNNER_TEMP: temp,
                    TITLE: title,
                    BODY: body,
                    AUTHOR: author,
                },
            }
        );
        return { status, output: `${stdout}${stderr}` };
    };

    it('passes a plain title and body from the tarball the lockfile names, installing nothing', () => {
        expect(script).not.toBe('');
        expect(ends().status).toBe(0);
        expect(uncommented(message)).not.toMatch(/\bnpx\b|\bnpm (?:exec|x|ci|install|i|add)\b/);
    });

    it('refuses a title that breaks a prose rule, naming the rule', () => {
        const refused = ends({ title: `Check each title ${String.fromCodePoint(0x2014)} twice` });
        expect(refused.status).toBe(1);
        expect(refused.output).toContain('em dash');
    });

    it("holds only Dependabot's title to the rules, since its body quotes release notes", () => {
        expect(
            ends({
                author: 'dependabot[bot]',
                body: `Release notes ${String.fromCodePoint(0x2014)} written elsewhere.`,
            }).status
        ).toBe(0);
    });

    it('refuses a tarball whose hash is not the one the lockfile records', () => {
        const refused = ends({ entry: { integrity: `${integrity.slice(0, -6)}AAAAA=` } });
        expect(refused.status).toBe(1);
        expect(refused.output).toContain("does not match the lockfile's hash");
    });

    it('refuses an address that is not the registry address of the version the lockfile names', () => {
        for (const resolved of [
            'https://example.com/prose-check.tgz',
            `${registry.slice(0, -4)}/../../../../evil/-/evil-1.0.0.tgz`,
        ]) {
            const refused = ends({ entry: { resolved } });
            expect(refused.status, resolved).toBe(1);
            expect(refused.output, resolved).toContain('outside the npm registry');
        }
        const crafted = 'x/../../../evil/-/evil-1.0.0';
        expect(
            ends({
                entry: {
                    version: crafted,
                    resolved: `https://registry.npmjs.org/@jasonsdevspace/prose-check/-/prose-check-${crafted}.tgz`,
                },
            }).status
        ).toBe(1);
    });

    it('stops on a lockfile that names no version of the prose check, or leaves it out', () => {
        const unnamed = ends({ entry: { version: '' } });
        expect(unnamed.status).toBe(1);
        expect(unnamed.output).toContain('names no version of the prose check');
        expect(ends({ entry: null }).status).not.toBe(0);
    });
});

describe('what reaches a script', () => {
    /** message.yml's text. */
    const message = () => workflows.get('.github/workflows/message.yml') ?? '';

    it('passes no pull request or event text into a script, only through env', () => {
        const pasted = [...workflows].flatMap(([path, text]) =>
            runsIn(uncommented(text))
                .filter((run) =>
                    /\$\{\{(?:(?!\}\})[\s\S])*?\bgithub\.(?:event\b|head_ref)/.test(run)
                )
                .map(() => path)
        );
        expect(pasted).toEqual([]);
        expect(runsIn(message()).length).toBeGreaterThan(0);
    });

    it('runs on no trigger that hands a pull request a privileged token', () => {
        expect(
            [...workflows]
                .filter(([, text]) =>
                    /^on:.*\b(?:pull_request_target|workflow_run)\b|^\s+(?:- *)?(?:pull_request_target|workflow_run)\s*(?::|$)/m.test(
                        uncommented(text)
                    )
                )
                .map(([path]) => path)
        ).toEqual([]);
    });

    it('finds event text in a script however it is written, and a privileged trigger however it is named', () => {
        const pasted = (yaml: string) =>
            runsIn(yaml).some((run) =>
                /\$\{\{(?:(?!\}\})[\s\S])*?\bgithub\.(?:event\b|head_ref)/.test(run)
            );
        expect(pasted('      - run: echo "${{ github.event.pull_request.title }}"\n')).toBe(true);
        expect(pasted('      - run: |\n          printf %s "${{ toJSON(github.event) }}"\n')).toBe(
            true
        );
        expect(
            pasted('      - run: echo start &&\n          echo "${{ github.head_ref }}"\n')
        ).toBe(true);
        expect(
            pasted(
                "      - uses: actions/github-script@v8\n        with:\n          script: |\n            core.info('${{ format('{0}', github.event.issue.title) }}')\n"
            )
        ).toBe(true);
        expect(
            pasted(
                '      - run: echo "$TITLE"\n        env:\n          TITLE: ${{ github.event.pull_request.title }}\n'
            )
        ).toBe(false);
        for (const on of [
            'on: pull_request_target\n',
            'on: [push, workflow_run]\n',
            'on:\n    - pull_request_target\n',
            'on:\n    workflow_run:\n        workflows: [CI]\n',
        ])
            expect(
                /^on:.*\b(?:pull_request_target|workflow_run)\b|^\s+(?:- *)?(?:pull_request_target|workflow_run)\s*(?::|$)/m.test(
                    on
                ),
                on
            ).toBe(true);
    });
});

describe('the git hooks', () => {
    const hooks = repositoryFiles(import.meta.url, (path) => /^\.husky\/[^/_][^/]*$/.test(path));

    it('run npx, npm exec and npm x only on what is installed, so a hook in a checkout without dependencies fetches nothing', () => {
        expect(hooks.size).toBeGreaterThan(0);
        const fetching = [...hooks].flatMap(([path, text]) =>
            text.split('\n').flatMap((line) => fetchingRuns(line).map(() => `${path}: ${line}`))
        );
        expect(fetching).toEqual([]);
    });

    it('find every call that could fetch, however many share a line', () => {
        expect(fetchingRuns('npx --no-install lint-staged')).toEqual([]);
        expect(fetchingRuns('npx --no-install a && npx b')).toHaveLength(1);
        expect(fetchingRuns('npm exec foo')).toHaveLength(1);
        expect(fetchingRuns('npm x --no foo')).toEqual([]);
        expect(fetchingRuns('npm exec --no-install -- foo')).toEqual([]);
    });
});

/**
 * Where each of `patterns` first matches in `text`, in order, each search starting where the
 * one before ended, or the first pattern that does not match after the one before it.
 */
const inOrder = (text: string, patterns: readonly RegExp[]): string[] => {
    let from = 0;
    return patterns.flatMap((pattern) => {
        const match = new RegExp(pattern.source, pattern.flags.replace('g', '')).exec(
            text.slice(from)
        );
        if (!match) return [pattern.source];
        from += match.index + match[0].length;
        return [];
    });
};

describe('the oldest Node job', () => {
    const ci = workflows.get('.github/workflows/ci.yml') ?? '';
    const floor = /^ {4}floor:\n(?: {8}.*\n|[ \t]*\n)*/m.exec(ci)?.[0] ?? '';

    it('proves the tarball it reports a checksum for, on the oldest Node and the project Node, before uploading that same tarball', () => {
        expect(floor).not.toBe('');
        expect(
            inOrder(floor, [
                /id: pack\n[\s\S]*?sha256sum "\$\{tarballs\[0\]\}"[\s\S]*?echo "sha256=\$sum" >> "\$GITHUB_OUTPUT"/,
                /floorOf\(require\('\.\/packages\/design-kit\/package\.json'\)\.engines\.node\)[\s\S]*?> package-floor/,
                /uses: actions\/setup-node@[0-9a-f]{40}[^\n]*\n\s+with:\n\s+node-version-file: package-floor/,
                /npm install --engine-strict --ignore-scripts "\$RUNNER_TEMP"\/jasonsdevspace-design-kit-\*\.tgz/,
                /working-directory: \$\{\{ runner\.temp \}\}\/consumer/,
                /uses: actions\/setup-node@[0-9a-f]{40}[^\n]*\n\s+with:\n\s+node-version-file: \.nvmrc/,
                /working-directory: \$\{\{ runner\.temp \}\}\/consumer\n\s+run: [^\n]*node consumer\.mjs/,
                /uses: actions\/upload-artifact@[0-9a-f]{40}[\s\S]*?path: \$\{\{ runner\.temp \}\}\/jasonsdevspace-design-kit-\*\.tgz/,
            ])
        ).toEqual([]);
    });
});

describe('the installs and fetches', () => {
    const lines = [
        ...[...workflows.values()].flatMap(workflowLines),
        ...[...dockerfiles.values()].flatMap(dockerRunLines),
    ];

    it('turn install scripts off on every install, wherever it runs', () => {
        expect(installsWithScripts(lines)).toEqual([]);
    });

    it('find the installs the workflows run, so a reading that finds none fails', () => {
        expect(
            lines.filter((line) =>
                shellCommandsOf(line).some((command) => {
                    const words = wordsOf(command);
                    const at = words.findIndex((word) => runs(word, 'npm'));
                    return at >= 0 && words.slice(at + 1).some((word) => INSTALL_ALIASES.has(word));
                })
            ).length
        ).toBeGreaterThan(0);
    });

    it('fetch nothing to run: npx, npm exec and npm x only with --no-install, and no npm init or create', () => {
        expect(fetchesToRun(lines)).toEqual([]);
    });

    it('read each install by its own command, however it is written, the last flag deciding', () => {
        const read = (text: string) => installsWithScripts(workflowLines(text));
        expect(read('npm ci --ignore-scripts')).toEqual([]);
        expect(read('npm ci')).toHaveLength(1);
        expect(read('npm ci --ignore-scripts && npm install x')).toHaveLength(1);
        expect(read('npm ci --ignore-scripts; npm ci --ignore-scripts')).toEqual([]);
        expect(read('npm ci --ignore-scripts --no-ignore-scripts')).toHaveLength(1);
        expect(read('npm ci --ignore-scripts false')).toHaveLength(1);
        expect(read('npm ci --ignore-scripts=false')).toHaveLength(1);
        expect(read('npm --registry https://registry.example install -g x')).toHaveLength(1);
        expect(read('npm install --location=global x')).toHaveLength(1);
        expect(read('npm ci \\\n    --ignore-scripts')).toEqual([]);
        expect(read('npm ci \\\n    --no-ignore-scripts')).toHaveLength(1);
        expect(read('run: "npm ci"')).toHaveLength(1);
        expect(read(`sh -c 'npm install x'`)).toHaveLength(1);
        expect(read('echo $(npm ci)')).toHaveLength(1);
        expect(read('/usr/local/bin/npm ci')).toHaveLength(1);
        expect(read('npm audit fix')).toHaveLength(1);
        for (const alias of [
            'isntall',
            'inst',
            'sit',
            'clean-install-test',
            'rb',
            'udpate',
            'ddp',
            'ln',
        ])
            expect(read(`npm ${alias}`), alias).toHaveLength(1);
        expect(read('npm run build')).toEqual([]);
        expect(read('- run: >\n    npm ci\n    --ignore-scripts\n')).toEqual([]);
        expect(read('- run: >\n    npm ci\n    --omit=dev\n')).toHaveLength(1);
        // A message that names an install is refused too, and reworded, never passed unread.
        expect(read('echo "install it with npm ci"')).toHaveLength(1);
    });

    it('read a Dockerfile RUN, continued or from a heredoc', () => {
        expect(dockerRunLines('RUN npm ci \\\n    --omit=dev\nCOPY . .')).toEqual([
            'RUN npm ci --omit=dev',
        ]);
        expect(dockerRunLines('RUN <<EOF\nnpm ci\nEOF\nCOPY . .')).toEqual(['RUN <<EOF', 'npm ci']);
        expect(installsWithScripts(dockerRunLines('RUN <<EOF\nnpm ci\nEOF\n'))).toHaveLength(1);
    });

    it('read a fetch by its own options and its initializer', () => {
        expect(
            fetchesToRun([
                'npx --no-install tsc',
                'npx tsc',
                'npx foo --no-install',
                'npx --no-install -y tool',
                'npx -y --no-install tool',
                'npx --no tool',
                'npm exec --no-install tsc',
                'npm exec tsc',
                'npm x --no-install -- foo',
                'npm init vite',
                'npm init -y vite',
                'npm init --scope=@x foo',
                'npm init --scope @x foo',
                'npm create vite',
                'npm init -y',
                'RUN npx tsc',
                'npm ci --ignore-scripts && npx tsc',
                'npm ci --ignore-scripts',
            ])
        ).toEqual([
            'npx tsc',
            'npx foo --no-install',
            'npx --no-install -y tool',
            'npm exec tsc',
            'npm init vite',
            'npm init -y vite',
            'npm init --scope=@x foo',
            'npm init --scope @x foo',
            'npm create vite',
            'RUN npx tsc',
            'npm ci --ignore-scripts && npx tsc',
        ]);
    });

    it('run on an npm that reads allow-git and allow-remote', () => {
        const running = execFileSync('npm', ['--version'], { encoding: 'utf8' });
        expect(atLeast(versionParts(running), NPM_FLOOR), `npm ${running.trim()}`).toBe(true);
        expect(versionParts('11.19.1-pre.0+build.5')).toEqual([11, 19, 1]);
        expect(atLeast(versionParts('11.14.0'), NPM_FLOOR)).toBe(true);
        expect(atLeast(versionParts('11.13.9'), NPM_FLOOR)).toBe(false);
        expect(atLeast(versionParts('12.0.0'), NPM_FLOOR)).toBe(true);
    });
});
