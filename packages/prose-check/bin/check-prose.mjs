#!/usr/bin/env node
/**
 * Fails when the repository it is run in holds prose that should never reach a reader, naming
 * each line, and passes otherwise. Run from anywhere in the repository, as `npm run verify` does.
 */
import { repositoryProblems, repositoryRoot } from '../src/index.mjs';

const failures = repositoryProblems(repositoryRoot(process.cwd()));
if (failures.length > 0) {
    console.error(`Prose check failed with ${failures.length} problem(s):\n`);
    console.error(failures.join('\n'));
    process.exit(1);
}
console.log(
    'Prose check passed. No em dashes, prose semicolons, process artifacts, issue numbers or British spellings.'
);
