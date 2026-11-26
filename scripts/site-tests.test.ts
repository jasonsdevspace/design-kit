// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { runsSiteTests } from './site-tests.mjs';

/*
 * The Chromium shards run the site's tests against the release the site pins only where a change
 * could alter what they find: on a push, which main and a release's tag are, and on a pull request
 * that touches the site, whose package pins the release, or the lockfile, which resolves it. A
 * pull request whose changed files cannot be read runs them, so a failure to read never hides one.
 */
describe('the site tests against the pinned release', () => {
    it('run on a push, a release and a call from one, whatever changed', () => {
        for (const event of ['push', 'workflow_call', 'workflow_dispatch'])
            expect(runsSiteTests(event, ['packages/design-kit/src/toast.ts'])).toBe(true);
    });

    it('run on a pull request that touches the site or the lockfile', () => {
        expect(runsSiteTests('pull_request', ['packages/site/src/pages/index.tsx'])).toBe(true);
        expect(runsSiteTests('pull_request', ['packages/site/package.json'])).toBe(true);
        expect(runsSiteTests('pull_request', ['package-lock.json'])).toBe(true);
        expect(
            runsSiteTests('pull_request', ['packages/design-kit/src/toast.ts', 'package-lock.json'])
        ).toBe(true);
    });

    it('stay off on a pull request that touches neither', () => {
        expect(
            runsSiteTests('pull_request', [
                'packages/design-kit/src/toast.ts',
                'packages/design-kit/e2e/toast.spec.tsx',
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
