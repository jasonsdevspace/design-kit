// @vitest-environment node
import { execFileSync } from 'node:child_process';
import {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readdirSync,
    readFileSync,
    rmSync,
    statSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { changedFiles, isSiteInput, runsSiteTests } from './site-tests.mjs';

/*
 * The Chromium shards run the site's tests against the release the site pins only where a change
 * could alter what they find: on a push, which main and a release's tag are, and on a pull request
 * that touches what the site reads. A pull request whose changed files cannot be read runs them,
 * so a failure to read never hides one. What the site reads is held to its imports, walked here.
 */
describe('the site tests against the pinned release', () => {
    it('run on a push, a release and a call from one, whatever changed', () => {
        for (const event of ['push', 'workflow_call', 'workflow_dispatch'])
            expect(runsSiteTests(event, ['packages/design-kit/e2e/toast.spec.tsx'])).toBe(true);
    });

    it('run on a pull request that touches what the site reads', () => {
        for (const file of [
            'packages/site/src/pages.tsx',
            'packages/site/package.json',
            'packages/design-kit/src/toast.ts',
            'packages/design-kit/examples/pieces.tsx',
            'packages/design-kit/e2e/hear.ts',
            'package-lock.json',
            'package.json',
            '.nvmrc',
            'tsconfig.json',
            'playwright.config.ts',
            '.github/workflows/ci.yml',
        ])
            expect(
                runsSiteTests('pull_request', ['packages/design-kit/e2e/toast.spec.tsx', file]),
                file
            ).toBe(true);
    });

    it('stay off on a pull request that touches nothing the site reads', () => {
        expect(
            runsSiteTests('pull_request', [
                'packages/design-kit/e2e/toast.spec.tsx',
                'packages/design-kit/e2e/engines.ts',
                'packages/design-kit/REFERENCE.md',
                'docs/decisions/0019-a-closing-panel-hands-focus-back-only-where-the-visitors-place-was-in-it.md',
                '.github/workflows/message.yml',
                'packages/sites/notes.md',
                'docs/package-lock.json',
            ])
        ).toBe(false);
    });

    it('read a file moved out of the site under both its paths, so the move runs them', () => {
        const repo = mkdtempSync(join(tmpdir(), 'site-tests-'));
        try {
            const git = (...args: string[]) =>
                execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
                    cwd: repo,
                    stdio: 'ignore',
                });
            git('init', '-q');
            mkdirSync(join(repo, 'packages/site/src'), { recursive: true });
            writeFileSync(join(repo, 'packages/site/src/a.ts'), 'export const a = 1;\n'.repeat(20));
            git('add', '.');
            git('commit', '-q', '-m', 'one');
            mkdirSync(join(repo, 'docs'));
            git('mv', 'packages/site/src/a.ts', 'docs/a.ts');
            git('commit', '-q', '-m', 'two');
            const changed = changedFiles(repo);
            expect(changed?.sort()).toEqual(['docs/a.ts', 'packages/site/src/a.ts']);
            expect(runsSiteTests('pull_request', changed)).toBe(true);
        } finally {
            rmSync(repo, { recursive: true, force: true });
        }
    });

    it('run on a pull request whose changed files could not be read', () => {
        expect(runsSiteTests('pull_request', null)).toBe(true);
        expect(runsSiteTests('pull_request', [])).toBe(true);
    });
});

/** The repository's root, from which the inputs are named. */
const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** The relative paths a module names: what it imports, and what it reads by a URL from itself. */
const namedIn = (text: string): string[] =>
    [
        ...text.matchAll(/(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g),
        ...text.matchAll(/new URL\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*,\s*import\.meta\.url/g),
    ].map(([, path = '']) => path);

/** The file a relative path names from a module, as a source file where it names its built one. */
const resolved = (from: string, path: string): string | undefined => {
    const target = join(dirname(from), path);
    const candidates = [
        target,
        target.replace(/\.js$/, '.ts'),
        target.replace(/\.js$/, '.tsx'),
        `${target}.ts`,
        join(target, 'index.ts'),
    ];
    return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
};

/** Every source file under a folder, its dependencies and its build left out. */
const sourcesIn = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name);
        if (entry.isDirectory())
            return ['node_modules', 'dist', 'test-results'].includes(entry.name)
                ? []
                : sourcesIn(path);
        return /\.(?:ts|tsx|mjs|js)$/.test(entry.name) ? [path] : [];
    });

/**
 * Every file outside the site that the site's sources reach, by what each names in turn, and each
 * relative path it could not follow, which a new kind of import would be.
 */
/** A path from the repository's root, written with forward slashes on any system. */
const fromRoot = (file: string): string => relative(ROOT, file).split(sep).join('/');

/**
 * The modules a module names that the walk follows, and each relative path in it the walk could not
 * follow. A path ending in a slash names a folder, such as the build's output, not a module.
 */
const followed = (file: string): { targets: string[]; unresolved: string[] } => {
    const targets: string[] = [];
    const unresolved: string[] = [];
    for (const path of namedIn(readFileSync(file, 'utf8'))) {
        if (path.endsWith('/')) continue;
        const target = resolved(file, path);
        if (target === undefined) unresolved.push(`${fromRoot(file)} names ${path}`);
        else targets.push(target);
    }
    return { targets, unresolved };
};

const reachedOutsideSite = (): { outside: string[]; unresolved: string[] } => {
    const site = join(ROOT, 'packages/site');
    const seen = new Set<string>();
    const outside = new Set<string>();
    const unresolved = new Set<string>();
    const queue = sourcesIn(site);
    while (queue.length > 0) {
        const file = queue.pop() as string;
        if (seen.has(file) || !/\.(?:ts|tsx|mjs|js)$/.test(file)) continue;
        seen.add(file);
        const { targets, unresolved: missed } = followed(file);
        for (const path of missed) unresolved.add(path);
        for (const target of targets) {
            if (!target.startsWith(site + sep)) outside.add(fromRoot(target));
            queue.push(target);
        }
    }
    return { outside: [...outside].sort(), unresolved: [...unresolved].sort() };
};

describe('what the site reads', () => {
    it('reaches files outside the site', () => {
        expect(reachedOutsideSite().outside).toContain('packages/design-kit/src/react.tsx');
    });

    it('is named in full among the inputs the decision counts', () => {
        expect(reachedOutsideSite().outside.filter((file) => !isSiteInput(file))).toEqual([]);
    });

    it('is followed through every relative path it names', () => {
        expect(reachedOutsideSite().unresolved).toEqual([]);
    });
});
