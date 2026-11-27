/**
 * The prose check: `proseProblems` for one piece of text, and `repositoryProblems` for every file
 * of a repository, which the `check-prose` command runs.
 */
export { repositoryProblems, repositoryRoot, skippedIn } from './repository.mjs';
export { isDockerfile, isScanned, problemsIn, proseProblems } from './rules.mjs';
