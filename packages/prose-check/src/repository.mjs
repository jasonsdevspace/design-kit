/**
 * Every problem in a repository's files: the ones git tracks and the new ones it would add,
 * leaving out what the repository ignores and the paths its own configuration skips.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { isScanned, proseProblems } from './rules.mjs';

/**
 * The top of the git repository a folder sits in.
 *
 * @param {string} folder
 * @returns {string}
 */
export const repositoryRoot = (folder) =>
    execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: folder, encoding: 'utf8' }).trim();

/**
 * The paths a repository's own configuration skips, from `proseCheck.skip` in its root
 * package.json: each a path from the top, a folder ending in a slash skipping all it holds.
 *
 * @param {string} root
 * @returns {string[]}
 */
export const skippedIn = (root) => {
    /** @type {{ proseCheck?: { skip?: unknown } }} */
    const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const skip = manifest.proseCheck?.skip ?? [];
    if (!Array.isArray(skip) || !skip.every((path) => typeof path === 'string'))
        throw new Error('proseCheck.skip in package.json is a list of paths');
    return skip;
};

/**
 * Whether a path is one the configuration skips: the path itself, or inside a folder named with a
 * trailing slash.
 *
 * @param {string} path
 * @param {readonly string[]} skip
 */
const isSkipped = (path, skip) =>
    skip.some((skipped) => (skipped.endsWith('/') ? path.startsWith(skipped) : path === skipped));

/**
 * Every problem in the repository at `root`, as `path:line  rule` with the line beneath.
 *
 * @param {string} root
 * @returns {string[]}
 */
export const repositoryProblems = (root) => {
    const skip = skippedIn(root);
    const listed = execFileSync(
        'git',
        ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
        { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
    ).split('\0');
    return [...new Set(listed)]
        .filter(
            (path) =>
                path !== '' &&
                isScanned(path) &&
                !isSkipped(path, skip) &&
                statSync(join(root, path), { throwIfNoEntry: false })?.isFile() === true
        )
        .flatMap((path) => proseProblems(path, readFileSync(join(root, path), 'utf8')));
};
