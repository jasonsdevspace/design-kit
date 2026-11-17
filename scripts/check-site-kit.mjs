/**
 * Holds the site's tests over this commit's kit to that kit, not to the release the site pins.
 *
 * CI packs the kit and installs it under the site's alias before running the site's tests again.
 * Where the kit's version is not the one the site pins, as on a release's pull request, npm can
 * keep the pinned release in the site's own `node_modules`, and the site would then be tested over
 * a release it already pins. This compares what the site resolves under its alias with the kit
 * just built, file by file, and fails naming each file that differs.
 *
 * Run as `node scripts/check-site-kit.mjs` after the install, from the repository's root.
 */
import { readdirSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';

import { isRunDirectly } from './repository.mjs';

/**
 * Every file under a folder, as paths relative to it.
 *
 * @param {string} root
 * @returns {string[]}
 */
const filesUnder = (root) =>
    readdirSync(root, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => relative(root, join(entry.parentPath, entry.name)))
        .sort();

/**
 * The files of the kit just built that the copy the site resolves lacks or holds otherwise, each
 * said as a sentence, or none where the site resolves this kit.
 *
 * @param {string} built the kit's `dist`, as packing built it
 * @param {string} resolved the `dist` of the package the site resolves under its alias
 * @returns {string[]}
 */
export const kitDifferences = (built, resolved) => {
    const theirs = new Set(filesUnder(resolved));
    return filesUnder(built).flatMap((file) => {
        if (!theirs.has(file)) return [`${file} is missing from the kit the site resolves`];
        return readFileSync(join(built, file)).equals(readFileSync(join(resolved, file)))
            ? []
            : [`${file} differs from this commit's kit`];
    });
};

if (isRunDirectly(import.meta.url)) {
    const manifest = realpathSync(
        createRequire(join(process.cwd(), 'packages/site/package.json')).resolve(
            'design-kit-release/package.json'
        )
    );
    const resolved = join(dirname(manifest), 'dist');
    const differences = kitDifferences(join(process.cwd(), 'packages/design-kit/dist'), resolved);
    if (differences.length > 0) {
        console.error(
            `The site resolves its kit from ${relative(process.cwd(), dirname(manifest))}, which is not this commit's kit:`
        );
        for (const difference of differences) console.error(`- ${difference}`);
        process.exitCode = 1;
    } else {
        console.log(
            `The site resolves this commit's kit, from ${relative(process.cwd(), dirname(manifest))}.`
        );
    }
}
