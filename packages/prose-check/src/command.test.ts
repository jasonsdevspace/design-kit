// @vitest-environment node
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/** The command, as a repository that installs the package runs it. */
const COMMAND = fileURLToPath(new URL('../bin/check-prose.mjs', import.meta.url));

/**
 * The environment with every `GIT_` variable dropped and git's global and system config shut off,
 * so a throwaway repository is not pointed at a real one by a hook's variables.
 */
const isolated = (): NodeJS.ProcessEnv => ({
    ...Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_'))),
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_NOSYSTEM: '1',
});

/**
 * Runs the command from a folder inside a throwaway repository holding the files given, with the
 * tracked ones added to git's index and the untracked ones left for git to find.
 */
const runIn = (
    tracked: Record<string, string | null>,
    untracked: Record<string, string> = {},
    { from = '.', args = [], git = true }: { from?: string; args?: string[]; git?: boolean } = {}
) => {
    const root = mkdtempSync(join(tmpdir(), 'prose-check-'));
    const options = { cwd: root, env: isolated(), timeout: 10_000 };
    const write = (files: Record<string, string | null>): void => {
        for (const [path, text] of Object.entries(files)) {
            if (text === null) continue;
            mkdirSync(dirname(join(root, path)), { recursive: true });
            writeFileSync(join(root, path), text);
        }
    };
    try {
        if (git) execFileSync('git', ['init', '--quiet'], options);
        write({ 'package.json': '{}\n', ...tracked });
        if (git) execFileSync('git', ['add', '--all'], options);
        write(untracked);
        mkdirSync(join(root, from), { recursive: true });
        const { status, stdout, stderr } = spawnSync(process.execPath, [COMMAND, ...args], {
            ...options,
            cwd: join(root, from),
            encoding: 'utf8',
        });
        return { status, stdout, stderr };
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
};

/** A package.json holding the prose check's configuration given. */
const configured = (proseCheck: unknown) => JSON.stringify({ proseCheck });

describe('the check-prose command', () => {
    it('exits 0 on plain prose', () => {
        const result = runIn({ 'README.md': 'One sentence. Then another.\n' });
        expect(result.status).toBe(0);
        expect(result.stderr).toBe('');
    });

    it('exits 1 and names the line on a semicolon joining clauses', () => {
        const result = runIn({ 'README.md': 'One clause; then another.\n' });
        expect(result.stderr).toContain('README.md:1  semicolon in prose');
        expect(result.status).toBe(1);
    });

    it('reads a new file git has not been told of, and leaves what it ignores alone', () => {
        const result = runIn(
            { '.gitignore': 'built/\n' },
            { 'notes.md': 'One clause; then another.\n', 'built/a.md': 'Also; here.\n' }
        );
        expect(result.stderr).toContain('notes.md:1  semicolon in prose');
        expect(result.stderr).not.toContain('built/a.md');
    });

    it('reads the whole repository when run from a folder inside it', () => {
        const result = runIn(
            { 'README.md': 'One clause; then another.\n' },
            {},
            { from: 'packages/a' }
        );
        expect(result.stderr).toContain('README.md:1  semicolon in prose');
    });

    it('skips the paths and folders the repository names in proseCheck.skip, however written', () => {
        const result = runIn({
            'package.json': configured({ skip: ['./vendor/', '/docs', 'old.md'] }),
            'vendor/a.md': 'One clause; then another.\n',
            'docs/b.md': 'One clause; then another.\n',
            'docsite/c.md': 'One clause; then another.\n',
            'old.md': 'One clause; then another.\n',
            'older.md': 'One clause; then another.\n',
        });
        expect(result.stderr).not.toContain('vendor/a.md');
        expect(result.stderr).not.toContain('docs/b.md');
        expect(result.stderr).not.toContain('old.md:');
        expect(result.stderr).toContain('docsite/c.md:1  semicolon in prose');
        expect(result.stderr).toContain('older.md:1  semicolon in prose');
        expect(result.status).toBe(1);
    });

    it.each([
        [{ skip: 'vendor/' }, 'check-prose: proseCheck.skip in package.json is a list of paths'],
        [{ skip: [''] }, 'check-prose: proseCheck.skip in package.json is a list of paths'],
        [['vendor/'], 'check-prose: proseCheck in package.json is an object'],
        ['vendor/', 'check-prose: proseCheck in package.json is an object'],
    ])('refuses the configuration %j with one line', (proseCheck, message) => {
        const result = runIn({ 'package.json': configured(proseCheck) });
        expect(result.stderr.trim().split('\n')).toHaveLength(1);
        expect(result.stderr).toContain(message);
        expect(result.status).toBe(1);
    });

    it('refuses a skipped path that matches no file, naming it', () => {
        const result = runIn({
            'package.json': configured({ skip: ['vendor/', 'gone.md'] }),
            'vendor/a.md': 'Plain.\n',
        });
        expect(result.stderr.trim()).toBe(
            'check-prose: proseCheck.skip names "gone.md", which matches no file'
        );
        expect(result.status).toBe(1);
    });

    it('reads a repository with no package.json at its root, skipping nothing', () => {
        const result = runIn({ 'package.json': null, 'README.md': 'One clause; then another.\n' });
        expect(result.stderr).toContain('README.md:1  semicolon in prose');
        expect(result.stderr).not.toContain('ENOENT');
        expect(result.status).toBe(1);
    });

    it('refuses a package.json that is not JSON with one line', () => {
        const result = runIn({ 'package.json': '{ not json' });
        expect(result.stderr.trim()).toBe(
            'check-prose: package.json at the repository root is not valid JSON'
        );
        expect(result.status).toBe(1);
    });

    it('fails with one line outside a git repository', () => {
        const result = runIn({ 'README.md': 'Plain.\n' }, {}, { git: false });
        expect(result.stderr.trim()).toMatch(/^check-prose: .* is not inside a git repository$/);
        expect(result.status).toBe(1);
    });

    it('refuses a file named on the command line rather than passing it unread', () => {
        const result = runIn({ 'README.md': 'Plain.\n' }, {}, { args: ['README.md'] });
        expect(result.stdout).not.toContain('Prose check passed');
        expect(result.stderr).toContain('check-prose takes no arguments');
        expect(result.stderr).toContain('proseProblems(path, text)');
        expect(result.status).toBe(1);
    });
});
