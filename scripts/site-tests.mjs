/**
 * Whether the Chromium shards run the site's tests against the release the site pins.
 *
 * Those tests can find something new only where the site or the release it draws has moved: on a
 * push, which main and a release's tag are, and on a pull request that touches the site, whose
 * package pins the release, or the lockfile, which resolves it. A change to the kit alone is tested
 * on the site by the run over the commit's kit, in a job of its own on every change, so here it
 * skips them. A pull request whose changed files cannot be read runs them, so a failure to read
 * never hides one.
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
    changed.some((file) => file.startsWith('packages/site/') || file === 'package-lock.json');

/**
 * The files a pull request's merge changes against its base, or null where git cannot say.
 *
 * @returns {string[] | null}
 */
const changedFiles = () => {
    try {
        return execFileSync('git', ['diff', '--name-only', 'HEAD^1', 'HEAD'], { encoding: 'utf8' })
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
