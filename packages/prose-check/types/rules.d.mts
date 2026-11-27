/**
 * A Dockerfile by its usual names: `Dockerfile` alone, with a suffix as in
 * `Dockerfile.prod`, or as the extension in `api.Dockerfile`.
 *
 * @param {string} path
 */
export function isDockerfile(path: string): boolean;
/**
 * The problems in one piece of prose, by rule.
 *
 * @param {string} text
 * @param {{ issues: boolean }} options
 * @returns {string[]}
 */
export function problemsIn(text: string, { issues }: {
    issues: boolean;
}): string[];
/**
 * Whether the check reads a file, by its kind.
 *
 * @param {string} path
 */
export function isScanned(path: string): boolean;
/**
 * Every problem in one file, as `path:line  rule` with the line beneath. The path says what kind
 * of text it is, so a pull request's or an issue's body goes in as `body.md`, and a path of a kind
 * the check does not read finds nothing.
 *
 * @param {string} path the file's path, which says what kind of text it is
 * @param {string} source the file's text
 * @param {string} [label] the name each problem is reported under, the path unless given
 * @returns {string[]}
 */
export function proseProblems(path: string, source: string, label?: string): string[];
