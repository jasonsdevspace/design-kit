// @vitest-environment node
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

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

/** npm's subcommands that install, or that run packages' install scripts, in every spelling. */
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
    'sit',
    'install-test',
    'install-ci-test',
    'clean-install-test',
    'rebuild',
    'rb',
    'update',
    'up',
    'upgrade',
    'udpate',
    'dedupe',
    'ddp',
    'link',
    'ln',
]);

/** npm's other subcommands, so a word that is neither is read as a flag's value, not a command. */
const OTHERS = new Set(
    (
        'run run-script rum urn exec x pack view info show v version test tst t publish stage ' +
        'query ls list la ll audit config c pkg init create innit prune uninstall remove rm r un ' +
        'unlink start stop restart cache doctor explain why fund outdated owner search token ' +
        'whoami help bin root prefix sbom diff completion edit explore find-dupes get set hook ' +
        'login logout adduser org team access deprecate dist-tag ping profile repo docs home bugs ' +
        'shrinkwrap star stars unstar unpublish'
    ).split(' ')
);

/** An npm or npx command: which it is, its subcommand, the flags before and the words after it. */
interface NpmCommand {
    readonly npx: boolean;
    readonly command: string;
    readonly flags: readonly string[];
    readonly args: readonly string[];
    readonly line: string;
    /** The folder the step runs in, where it names one. */
    readonly dir: string | undefined;
}

/**
 * Whether a command's flags, before and after its subcommand, leave install scripts off, the last
 * that names them deciding, as npm reads them.
 */
const skipsScripts = ({ flags, args }: NpmCommand) => {
    const words = [...flags, ...args];
    let off = false;
    words.forEach((word, index) => {
        if (word === '--ignore-scripts') off = words[index + 1] !== 'false';
        else if (word === '--ignore-scripts=true') off = true;
        else if (word === '--ignore-scripts=false' || word === '--no-ignore-scripts') off = false;
    });
    return off;
};

/**
 * What a step runs: its `run:` value, a block's lines under it, a folded block joined into one, and
 * nothing of the step's other keys, so a step's name is not read as a command.
 */
const runOf = (step: string): string => {
    const found = /^( *)(?:- )?run: *(.*)$/m.exec(step);
    if (!found) return '';
    const [line = '', indent = '', value = ''] = found;
    if (!/^[|>][-+]?\d*\s*$/.test(value)) return value;
    const block: string[] = [];
    for (const next of step.slice(step.indexOf(line) + line.length + 1).split('\n')) {
        if (next.trim() === '') block.push('');
        else if ((/^ */.exec(next)?.[0].length ?? 0) > indent.length) block.push(next);
        else break;
    }
    return value.startsWith('>') ? block.join(' ') : block.join('\n');
};

/** The folder a step names to run in, if it names one. */
const dirOf = (step: string) => /^ *working-directory: *(.+?) *$/m.exec(step)?.[1];

/**
 * Each npm or npx command in what a step runs, wherever it sits: after a keyword, an assignment or
 * another command, inside parentheses or a substitution, with continued lines joined, a quoted word
 * read as the word, and quoted words that hold a space left out, since they are a message that
 * names a command rather than one. A word that is no npm command is read as a flag's value, so the
 * subcommand is the first word npm knows.
 */
const commandsIn = (run: string, dir?: string): NpmCommand[] =>
    run
        .replace(/\\\n\s*/g, ' ')
        .replace(/\\["']/g, '')
        .replace(/"([^"\s]*)"|'([^'\s]*)'/g, '$1$2')
        .replace(/"[^"\n]*"|'[^'\n]*'/g, '""')
        .split(/\n|&&|\|\||;|\||&|\$\(|`|\(|\)/)
        .flatMap((part): NpmCommand[] => {
            const words = part.trim().split(/\s+/).filter(Boolean);
            const at = words.findIndex((word) => word === 'npm' || word === 'npx');
            if (at < 0) return [];
            const npx = words[at] === 'npx';
            const rest = words.slice(at + 1);
            const line = part.trim();
            if (npx) return [{ npx, command: '', flags: [], args: rest, line, dir }];
            let index = 0;
            while (
                index < rest.length &&
                !INSTALLS.has(rest[index] ?? '') &&
                !OTHERS.has(rest[index] ?? '')
            ) {
                index += 1;
            }
            return [
                {
                    npx,
                    command: rest[index] ?? '',
                    flags: rest.slice(0, index),
                    args: rest.slice(index + 1),
                    line,
                    dir,
                },
            ];
        });

/** What a command fetches and runs from npm: a package by its name, or the tool a package provides. */
interface Fetched {
    readonly kind: 'bin' | 'package';
    readonly name: string;
}

/**
 * What npx or `npm exec` runs, from the words after it: the package `--package` names, or else the
 * tool. npx's own options come before the tool, and what follows the tool is the tool's own.
 */
const npxTarget = (words: readonly string[]): Fetched => {
    let at = 0;
    while (at < words.length && (words[at] ?? '').startsWith('-')) {
        at += words[at] === '--package' || words[at] === '-p' ? 2 : 1;
    }
    const options = words.slice(0, at);
    const named = options.findIndex((word) => word === '--package' || word === '-p');
    const pkg =
        options.find((word) => word.startsWith('--package='))?.slice('--package='.length) ??
        (named >= 0 ? options[named + 1] : undefined);
    if (pkg !== undefined) return { kind: 'package', name: pkg.replace(/(?<=.)@.*$/, '') };
    return { kind: 'bin', name: words[at] ?? '' };
};

/**
 * The package a command would fetch and run, if it runs one: what npx or `npm exec` runs, or the
 * initializer `npm init` or `npm create` names. Nothing for a command that runs nothing from npm.
 */
const fetchedBy = ({ npx, command, args }: NpmCommand): Fetched | undefined => {
    const words = args.filter((word) => word !== '--');
    if (npx || command === 'exec' || command === 'x') return npxTarget(words);
    if (!['init', 'create', 'innit'].includes(command)) return undefined;
    const name = words.find((word) => !word.startsWith('-'));
    return name === undefined ? undefined : { kind: 'package', name: `create-${name}` };
};

/** A lockfile's entries, by their path under node_modules, each as unknown until looked at. */
const entriesOf = (lockfile: unknown): [string, unknown][] => {
    const listed =
        typeof lockfile === 'object' && lockfile !== null && 'packages' in lockfile
            ? lockfile.packages
            : undefined;
    if (typeof listed !== 'object' || listed === null) return [];
    return Object.keys(listed).map((key): [string, unknown] => [key, Reflect.get(listed, key)]);
};

/** The commands an entry puts on the path: its own name for a single bin, or each it names. */
const binsOf = (name: string, entry: unknown): string[] => {
    const bin: unknown =
        typeof entry === 'object' && entry !== null && 'bin' in entry ? entry.bin : undefined;
    if (typeof bin === 'string') return [name.split('/').pop() ?? name];
    return typeof bin === 'object' && bin !== null ? Object.keys(bin) : [];
};

/** The packages the lockfile installs at the top of node_modules, and the commands they put on the path. */
const lockfileTools = (lockfile: unknown) => {
    const packages = new Set<string>();
    const bins = new Set<string>();
    for (const [path, entry] of entriesOf(lockfile)) {
        if (path.lastIndexOf('node_modules/') !== 0) continue;
        const name = path.slice('node_modules/'.length);
        packages.add(name);
        for (const bin of binsOf(name, entry)) bins.add(bin);
    }
    return { packages, bins };
};

/** The lockfile at the root, which says what npm installs and what tools npx finds. */
const LOCKFILE: unknown = JSON.parse(
    readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8')
);

describe('the workflows', () => {
    const steps = [...workflows.values()].flatMap(stepsOf);
    /** Every npm and npx command the workflows' steps run. */
    const npmCommands = steps.flatMap(({ text }) => commandsIn(runOf(text), dirOf(text)));

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

    it('install dependencies without running their install scripts', () => {
        const installs = npmCommands.filter(({ command }) => INSTALLS.has(command));
        expect(installs.length).toBeGreaterThan(0);
        expect(
            installs.filter((command) => !skipsScripts(command)).map(({ line }) => line)
        ).toEqual([]);
    });

    it('run with npx only the tools the lockfile installs, in the repository, so nothing is fetched with its scripts', () => {
        const { packages, bins } = lockfileTools(LOCKFILE);
        const fetched = npmCommands
            .filter((command) => {
                const wanted = fetchedBy(command);
                if (wanted === undefined) return false;
                // Outside the repository npx finds none of its tools, and fetches what it runs.
                if (
                    command.dir !== undefined &&
                    (/\$\{\{/.test(command.dir) || command.dir.startsWith('/'))
                )
                    return true;
                return wanted.kind === 'bin' ? !bins.has(wanted.name) : !packages.has(wanted.name);
            })
            .map(({ line }) => line);
        expect(fetched).toEqual([]);
    });

    it('read an install however it is written, and the flags the last of which decides', () => {
        const read = (step: string) =>
            commandsIn(runOf(step))
                .filter(({ command }) => INSTALLS.has(command))
                .map(skipsScripts);
        expect(read('- run: npm --prefix a ci')).toEqual([false]);
        expect(read('- run: npm --loglevel warn ci --ignore-scripts')).toEqual([true]);
        expect(read('- run: if [ -n "$X" ]; then npm clean-install; fi')).toEqual([false]);
        expect(read('- run: FOO=1 npm ic --ignore-scripts')).toEqual([true]);
        expect(read('- run: |\n      npm ci \\\n          --ignore-scripts')).toEqual([true]);
        expect(read('- run: >\n      npm ci\n      --ignore-scripts')).toEqual([true]);
        expect(read('- run: npm ci --ignore-scripts false')).toEqual([false]);
        expect(read('- run: npm ci --ignore-scripts=true')).toEqual([true]);
        expect(read('- run: npm --ignore-scripts ci')).toEqual([true]);
        expect(read('- run: npm ci --ignore-scripts --no-ignore-scripts')).toEqual([false]);
        expect(read('- run: npm ci "--ignore-scripts"')).toEqual([true]);
        expect(read('- run: (cd site && npm ci)')).toEqual([false]);
        expect(read('- run: npm ci --ignore-scripts & npm install')).toEqual([true, false]);
        expect(read('- run: npm rebuild')).toEqual([false]);
        expect(read("- run: echo it\\'s done; npm ci; echo 'ok'")).toEqual([false]);
        // Words in a message, or in a step's name, that name a command are not a command.
        expect(read('- run: echo "install it with `npm install x`"')).toEqual([]);
        expect(read('- name: Install with npm ci\n  run: echo done')).toEqual([]);
        // npx and npm exec run what the lockfile installed, or name what they fetch.
        expect(commandsIn('npx --package=evil playwright install').map(fetchedBy)).toEqual([
            { kind: 'package', name: 'evil' },
        ]);
        expect(commandsIn('npx tsc -p scripts').map(fetchedBy)).toEqual([
            { kind: 'bin', name: 'tsc' },
        ]);
        expect(commandsIn('npx -p evil@1 tool').map(fetchedBy)).toEqual([
            { kind: 'package', name: 'evil' },
        ]);
        expect(commandsIn('npm create vite').map(fetchedBy)).toEqual([
            { kind: 'package', name: 'create-vite' },
        ]);
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
        // token and naming the npm environment could publish to npm as the release does. The
        // workflow's own permissions would give it to every job, as write-all would give it to a
        // job.
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

    // Ubuntu, but for CI's jobs that draw in WebKit and Firefox, on a Mac, where neither needs
    // system packages.
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
                            path === '.github/workflows/ci.yml' &&
                            (id === 'webkit' || id === 'firefox')
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

    // A Mac draws slower than Ubuntu, so the engines that run on one take more shards than Chromium
    // to end well inside a job's time limit. Each job reads how many from the strategy's total, for
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
