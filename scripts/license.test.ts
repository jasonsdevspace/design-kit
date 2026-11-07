import { existsSync, readdirSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

/*
 * npm packs the license in a package's own folder, so each package that is published keeps a copy
 * of the repository's. This holds every copy to the one at the root, so a change there reaches
 * what ships. A private package, such as the site, is never packed, and needs none.
 */

const root = new URL('../', import.meta.url);
const license = readFileSync(new URL('LICENSE', root), 'utf8');
const packages = readdirSync(new URL('packages/', root)).filter(
    (name) =>
        existsSync(new URL(`packages/${name}/package.json`, root)) &&
        !(
            JSON.parse(readFileSync(new URL(`packages/${name}/package.json`, root), 'utf8')) as {
                private?: boolean;
            }
        ).private
);

describe('the license', () => {
    it('has a package to ship with', () => {
        expect(packages).toContain('design-kit');
    });

    for (const name of packages) {
        it(`ships with ${name} as the repository holds it`, () => {
            expect(readFileSync(new URL(`packages/${name}/LICENSE`, root), 'utf8')).toBe(license);
        });
    }
});
