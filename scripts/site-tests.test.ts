// @vitest-environment node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { isSiteInput, runsSiteTests } from './site-tests.mjs';

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
            'playwright.config.ts',
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
                '.github/workflows/ci.yml',
                'packages/sites/notes.md',
                'docs/package-lock.json',
            ])
        ).toBe(false);
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
        target.replace(/\.mjs$/, '.mjs'),
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

/** Every file outside the site that the site's sources reach, by what each names in turn. */
const reachedOutsideSite = (): string[] => {
    const site = join(ROOT, 'packages/site');
    const seen = new Set<string>();
    const outside = new Set<string>();
    const queue = sourcesIn(site);
    while (queue.length > 0) {
        const file = queue.pop() as string;
        if (seen.has(file)) continue;
        seen.add(file);
        if (!/\.(?:ts|tsx|mjs|js)$/.test(file)) continue;
        for (const path of namedIn(readFileSync(file, 'utf8'))) {
            const target = resolved(file, path);
            if (target === undefined) continue;
            if (!target.startsWith(site + sep))
                outside.add(relative(ROOT, target).split(sep).join('/'));
            queue.push(target);
        }
    }
    return [...outside].sort();
};

describe('what the site reads', () => {
    it('reaches files outside the site', () => {
        expect(reachedOutsideSite()).toContain('packages/design-kit/src/react.tsx');
    });

    it('is named in full among the inputs the decision counts', () => {
        expect(reachedOutsideSite().filter((file) => !isSiteInput(file))).toEqual([]);
    });
});
