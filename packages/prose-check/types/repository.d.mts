/**
 * The top of the git repository a folder sits in.
 *
 * @param {string} folder
 * @returns {string}
 */
export function repositoryRoot(folder: string): string;
/**
 * The paths a repository's own configuration skips, from `proseCheck.skip` in its root
 * package.json, each a file or a folder by its path from the top. A repository with no
 * package.json at its root, or none that names any, skips nothing.
 *
 * @param {string} root
 * @returns {string[]}
 */
export function skippedIn(root: string): string[];
/**
 * Every problem in the repository at `root`, as `path:line  rule` with the line beneath. A skipped
 * path that matches no file is refused, so a skip list never outlives what it was written for.
 *
 * @param {string} root
 * @returns {string[]}
 */
export function repositoryProblems(root: string): string[];
