import { readdirSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import site from '../package.json' with { type: 'json' };

/*
 * The site draws the kit a demo installs, the version npm publishes and the site pins exactly, as
 * ShelfLens pins it, so what a visitor sees is what a demo gets and the site's tests hold what
 * ships. Nothing in the site reaches into the kit's sources beside it in the repository.
 */

const SITE = new URL('../', import.meta.url);

/** Every file the site is built from, past what is built, installed or tested. */
const sources = readdirSync(SITE, { recursive: true })
    .map(String)
    .filter((file) => /\.(tsx?|css|html)$/.test(file))
    .filter((file) => !/(^|\/)(node_modules|dist|e2e|bench)\//.test(file))
    .filter((file) => !file.endsWith('.test.ts'));

describe('the site', () => {
    it('pins the published kit to one exact version', () => {
        expect(site.dependencies['design-kit-release']).toMatch(
            /^npm:@jasonsdevspace\/design-kit@\d+\.\d+\.\d+(-[\w.]+)?$/
        );
    });

    it('reaches into none of the kit’s sources', () => {
        expect(sources.length).toBeGreaterThan(0);
        const reaching = sources.filter((file) =>
            /design-kit\/(src|package\.json)/.test(readFileSync(new URL(file, SITE), 'utf8'))
        );
        expect(reaching).toEqual([]);
    });
});
