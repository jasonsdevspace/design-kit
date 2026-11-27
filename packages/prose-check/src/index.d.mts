/** Whether a path names a Dockerfile, by its usual names. */
export declare const isDockerfile: (path: string) => boolean;
/** Whether the check reads a file, by its kind. */
export declare const isScanned: (path: string) => boolean;
/** The rules one piece of prose breaks, by name. */
export declare const problemsIn: (text: string, options: { issues: boolean }) => string[];
/**
 * Every problem in one file, or in text given a path that says what kind it is, such as
 * `body.md`, as `path:line  rule` with the line beneath.
 */
export declare const proseProblems: (path: string, source: string, label?: string) => string[];
/** Every problem in the repository at `root`, its skipped paths left out. */
export declare const repositoryProblems: (root: string) => string[];
/** The top of the git repository a folder sits in. */
export declare const repositoryRoot: (folder: string) => string;
/** The paths a repository's `proseCheck.skip` names. */
export declare const skippedIn: (root: string) => string[];
