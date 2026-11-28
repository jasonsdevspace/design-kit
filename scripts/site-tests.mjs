/**
 * Whether the Chromium shards run the site's tests against the release the site pins.
 *
 * Those tests open the site as it deploys: the pinned release's sheets and controls, with the
 * markup the site draws from the kit's own examples and React source in this repository. So they
 * can find something new only where a change touches what the site reads: the site itself, the
 * kit's source and examples it draws from, the test helper its specs share, the lockfile that
 * resolves the release, the settings its build and its code samples read, and the files that set
 * how the tests run, the workflow's own steps among them. They run on every push, which
 * main and a release's tag are, and on a pull request that touches any of those. A pull request
 * that touches none of them, such as one changing only the kit's own specs, its docs or the
 * workflows, skips them here, and the site's tests over the commit's kit still run in a job of
 * their own. A pull request whose changed files cannot be read runs them.
 *
 * Run in CI as `node scripts/site-tests.mjs "$EVENT"` after a checkout two commits deep, where a
 * pull request's head is the merge into its base and its first parent the base. It prints `run` or
 * `skip`.
 */
import { execFileSync } from 'node:child_process';

import { isRunDirectly } from './repository.mjs';

/**
 * Whether a run of the event given, with the files given changed, runs the site's tests against
 * the pinned release. The files are null where they could not be read.
 *
 * @param {string} event
 * @param {readonly string[] | null} changed
 * @returns {boolean}
 */
export const runsSiteTests = (event, changed) =>
    event !== 'pull_request' ||
    changed === null ||
    changed.length === 0 ||
    changed.some(isSiteInput);

/**
 * What the site's tests against the pinned release read, as paths from the repository's root: a
 * folder ends in a slash, a file is named whole. scripts/site-tests.test.ts walks the site's
 * imports and holds every file outside the site they reach to this list.
 */
export const SITE_INPUTS = [
    'packages/site/',
    'packages/design-kit/src/',
    'packages/design-kit/examples/',
    'packages/design-kit/e2e/hear.ts',
    'scripts/summary.mjs',
    'scripts/record.mjs',
    'scripts/parts.mjs',
    'scripts/repository.mjs',
    'scripts/site-tests.mjs',
    'package-lock.json',
    'package.json',
    '.nvmrc',
    'tsconfig.json',
    'playwright.config.ts',
    '.github/workflows/ci.yml',
];

/**
 * Whether a changed file is one the site's tests against the pinned release read.
 *
 * @param {string} file
 * @returns {boolean}
 */
export const isSiteInput = (file) =>
    SITE_INPUTS.some((input) => (input.endsWith('/') ? file.startsWith(input) : file === input));

/**
 * The files a pull request's merge changes against its base, in the folder given, or null where
 * git cannot say. A file moved is listed under both its paths, so one moved out of the site still
 * counts as the site's.
 *
 * @param {string} [cwd]
 * @returns {string[] | null}
 */
export const changedFiles = (cwd) => {
    try {
        return execFileSync('git', ['diff', '--name-only', '--no-renames', 'HEAD^1', 'HEAD'], {
            encoding: 'utf8',
            ...(cwd === undefined ? {} : { cwd }),
        })
            .split('\n')
            .filter(Boolean);
    } catch {
        return null;
    }
};

if (isRunDirectly(import.meta.url)) {
    const event = process.argv[2] ?? '';
    console.log(
        runsSiteTests(event, event === 'pull_request' ? changedFiles() : []) ? 'run' : 'skip'
    );
}
