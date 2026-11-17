/**
 * Holds the site's tests over this commit's kit to that kit, not to the release the site pins.
 *
 * CI packs the kit and installs it under the site's alias before running the site's tests again.
 * Where the kit's version is not the one the site pins, as on a release's pull request, npm can
 * keep the pinned release in the site's own `node_modules`, and the site would then be tested over
 * a release it already pins. This compares the `dist` the site resolves under its alias with the
 * `dist` the packed tarball holds, both ways, and fails naming each file that differs, that only
 * one of them holds, or a side that holds nothing.
 *
 * Run as `node scripts/check-site-kit.mjs <tarball>` after the install, from any folder.
 */
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isRunDirectly } from './repository.mjs';
import { filesOf } from './summary.mjs';

/** The repository's root, found from this script rather than from where it is run. */
const ROOT = fileURLToPath(new URL('../', import.meta.url));

/**
 * Every file under a folder, as paths relative to it with forward slashes, or none where the
 * folder is not there.
 *
 * @param {string} root
 * @returns {Map<string, Buffer>}
 */
const filesUnder = (root) =>
    new Map(
        existsSync(root)
            ? readdirSync(root, { recursive: true, withFileTypes: true })
                  .filter((entry) => entry.isFile())
                  .map((entry) => {
                      const file = join(entry.parentPath, entry.name);
                      return [relative(root, file).split('\\').join('/'), readFileSync(file)];
                  })
            : []
    );

/**
 * The files under `dist/` in a packed tarball, keyed by their path inside `dist`. The tarball's
 * paths are read inside the package, as `filesOf` gives them.
 *
 * @param {Buffer} tarball
 * @returns {Map<string, Buffer>}
 */
export const packedDist = (tarball) =>
    new Map(
        filesOf(tarball)
            .filter(({ path }) => path.startsWith('dist/'))
            .map(({ path, bytes }) => [path.slice('dist/'.length), bytes])
    );

/**
 * How the kit the site resolves differs from the kit just packed, each said as a sentence, or
 * none where they hold the same files with the same bytes.
 *
 * @param {Map<string, Buffer>} packed
 * @param {Map<string, Buffer>} resolved
 * @returns {string[]}
 */
export const kitDifferences = (packed, resolved) => {
    if (packed.size === 0) return ["this commit's packed kit holds no dist"];
    if (resolved.size === 0) return ['the kit the site resolves holds no dist'];
    const files = [...new Set([...packed.keys(), ...resolved.keys()])].sort();
    return files.flatMap((file) => {
        const ours = packed.get(file);
        const theirs = resolved.get(file);
        if (!theirs) return [`${file} is missing from the kit the site resolves`];
        if (!ours) return [`${file} is in the kit the site resolves and not in this commit's kit`];
        return ours.equals(theirs) ? [] : [`${file} differs from this commit's kit`];
    });
};

/**
 * Where the site resolves its alias from, and how that kit differs from the tarball given.
 *
 * @param {string} given the repository's root
 * @param {Buffer} tarball the kit as packed
 * @returns {{ from: string, differences: string[] }}
 */
export const siteKitProblems = (given, tarball) => {
    // The root as the file system names it, so a path found through a link reads from it.
    const root = realpathSync(given);
    let manifest;
    try {
        manifest = realpathSync(
            createRequire(join(root, 'packages/site/package.json')).resolve(
                'design-kit-release/package.json'
            )
        );
    } catch {
        return { from: '', differences: ['the site resolves no kit under its alias'] };
    }
    const from = relative(root, dirname(manifest)).split('\\').join('/');
    return {
        from,
        differences: kitDifferences(
            packedDist(tarball),
            filesUnder(join(dirname(manifest), 'dist'))
        ),
    };
};

if (isRunDirectly(import.meta.url)) {
    const [path] = process.argv.slice(2);
    if (!path || !existsSync(path)) {
        console.error('Pass the packed kit: node scripts/check-site-kit.mjs <tarball>');
        process.exitCode = 1;
    } else {
        const { from, differences } = siteKitProblems(ROOT, readFileSync(path));
        if (differences.length > 0) {
            console.error(
                `The site does not resolve this commit's kit${from ? `, from ${from}` : ''}:`
            );
            for (const difference of differences) console.error(`- ${difference}`);
            process.exitCode = 1;
        } else {
            console.log(`The site resolves this commit's kit, from ${from}.`);
        }
    }
}
