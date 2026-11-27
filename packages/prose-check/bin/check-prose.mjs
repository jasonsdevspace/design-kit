#!/usr/bin/env node
/**
 * Fails when the repository it is run in holds prose that should never reach a reader, naming
 * each line, and passes otherwise. Run from anywhere in the repository, as `npm run verify` does.
 * It takes no arguments, since it reads the whole repository, and anything it cannot set up, such
 * as a folder outside git or a skip list it cannot read, ends it with one line and a failure.
 */
import { repositoryProblems, repositoryRoot } from '../src/index.mjs';

if (process.argv.length > 2) {
    console.error(
        'check-prose takes no arguments and reads the whole repository. To check one piece of text, call proseProblems(path, text) from the package.'
    );
    process.exit(1);
}

/** @type {string[]} */
let failures;
try {
    failures = repositoryProblems(repositoryRoot(process.cwd()));
} catch (error) {
    console.error(`check-prose: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
}
if (failures.length > 0) {
    console.error(`Prose check failed with ${failures.length} problem(s):\n`);
    console.error(failures.join('\n'));
    process.exit(1);
}
console.log(
    'Prose check passed. No em dashes, prose semicolons, process artifacts, issue numbers or British spellings.'
);
