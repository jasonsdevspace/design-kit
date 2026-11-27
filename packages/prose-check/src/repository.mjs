/**
 * Every problem in a repository's files: the ones git tracks and the new ones it would add,
 * leaving out what the repository ignores and the paths its own configuration skips.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { isScanned, proseProblems } from './rules.mjs';

/**
 * The top of the git repository a folder sits in.
 *
 * @param {string} folder
 * @returns {string}
 */
export const repositoryRoot = (folder) => {
    try {
        return execFileSync('git', ['rev-parse', '--show-toplevel'], {
            cwd: folder,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        }).trim();
    } catch {
        throw new Error(`${folder} is not inside a git repository`);
    }
};

/**
 * A skipped path as a path from the top, with no leading `./` or `/` and no trailing slash, so a
 * folder is the same written either way.
 *
 * @param {string} path
 */
const normalized = (path) => path.replace(/^(\.\/|\/)+/, '').replace(/\/+$/, '');

/**
 * The paths a repository's own configuration skips, from `proseCheck.skip` in its root
 * package.json, each a file or a folder by its path from the top. A repository with no
 * package.json at its root, or none that names any, skips nothing.
 *
 * @param {string} root
 * @returns {string[]}
 */
export const skippedIn = (root) => {
    const file = join(root, 'package.json');
    if (!existsSync(file)) return [];
    /** @type {unknown} */
    let manifest;
    try {
        manifest = JSON.parse(readFileSync(file, 'utf8'));
    } catch {
        throw new Error('package.json at the repository root is not valid JSON');
    }
    const config =
        typeof manifest === 'object' && manifest !== null && 'proseCheck' in manifest
            ? manifest.proseCheck
            : undefined;
    if (config === undefined) return [];
    if (typeof config !== 'object' || config === null || Array.isArray(config))
        throw new Error('proseCheck in package.json is an object such as { "skip": ["vendor/"] }');
    const skip = 'skip' in config ? config.skip : [];
    if (!Array.isArray(skip) || !skip.every((path) => typeof path === 'string' && path !== ''))
        throw new Error('proseCheck.skip in package.json is a list of paths');
    return skip.map(normalized);
};

/**
 * Whether a path is a skipped file or inside a skipped folder.
 *
 * @param {string} path
 * @param {string} skipped
 */
const skips = (path, skipped) => path === skipped || path.startsWith(`${skipped}/`);

/**
 * Every problem in the repository at `root`, as `path:line  rule` with the line beneath. A skipped
 * path that matches no file is refused, so a skip list never outlives what it was written for.
 *
 * @param {string} root
 * @returns {string[]}
 */
export const repositoryProblems = (root) => {
    const skip = skippedIn(root);
    const listed = [
        ...new Set(
            execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
                cwd: root,
                encoding: 'utf8',
                maxBuffer: 64 * 1024 * 1024,
            }).split('\0')
        ),
    ].filter(
        (path) => path !== '' && statSync(join(root, path), { throwIfNoEntry: false })?.isFile()
    );
    const unmatched = skip.filter((skipped) => !listed.some((path) => skips(path, skipped)));
    if (unmatched.length > 0)
        throw new Error(
            `proseCheck.skip names ${unmatched.map((path) => `"${path}"`).join(', ')}, which matches no file`
        );
    return listed
        .filter((path) => isScanned(path) && !skip.some((skipped) => skips(path, skipped)))
        .flatMap((path) => proseProblems(path, readFileSync(join(root, path), 'utf8')));
};
