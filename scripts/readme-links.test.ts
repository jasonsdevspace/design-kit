import { readFileSync, statSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/*
 * The package README, which npm shows as the package's page, links the reference and the
 * accessibility notes at the tag of the release it ships with, so a reader on npm reads the
 * reference that version was written to. A release that moves the version moves every one of those
 * links with it. The release's pull request is the commit the tag names, so each file a link names
 * is held to be there, and a file moved since the last release fails before the tag rather than
 * after it.
 */

const readme = readFileSync(new URL('../packages/design-kit/README.md', import.meta.url), 'utf8');
const { version } = JSON.parse(
    readFileSync(new URL('../packages/design-kit/package.json', import.meta.url), 'utf8')
) as { version: string };

describe('the package README', () => {
    it("links every tagged page at the tag of the package's own version", () => {
        const tags = [...readme.matchAll(/\/blob\/design-kit-v([^/]+)\//g)].map(([, tag]) => tag);
        expect(tags.length).toBeGreaterThan(0);
        expect(tags.filter((tag) => tag !== version)).toEqual([]);
    });

    it('names a file the repository holds in every link pinned to a tag', () => {
        const paths = [...readme.matchAll(/\/blob\/design-kit-v[^/]+\/([^)#\s]+)/g)].map(
            ([, path = '']) => path
        );
        expect(paths.length).toBeGreaterThan(0);
        expect(
            paths.filter(
                (path) =>
                    statSync(new URL(`../${path}`, import.meta.url), { throwIfNoEntry: false }) ===
                    undefined
            )
        ).toEqual([]);
    });
});
