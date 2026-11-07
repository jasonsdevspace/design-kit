import { readdirSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import site from '../package.json' with { type: 'json' };
import { ROUTES } from './routes.js';

/*
 * The site draws the kit a demo installs, the version npm publishes and the site pins exactly, as
 * ShelfLens pins it, so what a visitor sees is what a demo gets and the site's tests hold what
 * ships. Nothing in the site reaches the kit by any other name or path: not the package's own
 * name, which npm links to the workspace beside it, and not the workspace's files.
 */

const SITE = new URL('../', import.meta.url);
const ROOT = new URL('../../../', import.meta.url);

/** Every file the site is built, tested or audited from, leaving out what is built or installed. */
const sources = [
    ...ROUTES.map(({ file }) => file),
    'vite.config.ts',
    ...['src', 'e2e', 'bench'].flatMap((folder) =>
        readdirSync(new URL(folder, SITE), { recursive: true })
            .map(String)
            .map((file) => `${folder}/${file}`)
    ),
].filter((file) => /\.(tsx?|css|html)$/.test(file) && !file.endsWith('published.test.ts'));

/**
 * The kit by its own name, or a path into the workspace's copy of it, past the states the examples
 * hold, which import nothing of the kit's but its types and take the components they draw.
 */
const OTHER_WAY =
    /@jasonsdevspace\/design-kit\/|\.\.\/design-kit(?!\/examples\/(states|palette)\.js')(?=['"/])|design-kit\/(src|dist)\//;

describe('the site', () => {
    it('pins the published kit to one exact version', () => {
        expect(site.dependencies['design-kit-release']).toMatch(
            /^npm:@jasonsdevspace\/design-kit@\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/
        );
    });

    it('installs that version from npm, not the workspace', () => {
        const lock = JSON.parse(readFileSync(new URL('package-lock.json', ROOT), 'utf8')) as {
            packages: Record<string, { resolved?: string; version?: string }>;
        };
        const installed = lock.packages['node_modules/design-kit-release'];
        const pinned = site.dependencies['design-kit-release'].split('@').pop();
        expect(installed?.version).toBe(pinned);
        expect(installed?.resolved).toBe(
            `https://registry.npmjs.org/@jasonsdevspace/design-kit/-/design-kit-${String(pinned)}.tgz`
        );
    });

    it('reaches the kit only through the pinned alias', () => {
        expect(sources).toContain('src/pages.tsx');
        const reaching = sources.filter((file) =>
            OTHER_WAY.test(readFileSync(new URL(file, SITE), 'utf8'))
        );
        expect(reaching).toEqual([]);
    });
});
