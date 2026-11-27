import { existsSync, readdirSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/*
 * npm shows a package's description on its page and in search, and cuts it at 255 characters, so a
 * longer one ends mid-word. This holds each published package's description under that cut. A
 * private package, such as the site, is never published, and has no page.
 */

const NPM_CUT = 255;

const root = new URL('../', import.meta.url);
const manifests = readdirSync(new URL('packages/', root))
    .filter((name) => existsSync(new URL(`packages/${name}/package.json`, root)))
    .map((name) => ({
        name,
        manifest: JSON.parse(
            readFileSync(new URL(`packages/${name}/package.json`, root), 'utf8')
        ) as { private?: boolean; description?: string },
    }))
    .filter(({ manifest }) => manifest.private !== true);

describe("each published package's description", () => {
    it('has a package to read', () => {
        expect(manifests.map(({ name }) => name)).toContain('design-kit');
    });

    for (const { name, manifest } of manifests) {
        it(`fits npm's page for ${name}`, () => {
            expect(manifest.description?.length ?? 0).toBeGreaterThan(0);
            expect(manifest.description?.length ?? 0).toBeLessThanOrEqual(NPM_CUT);
        });
    }
});
