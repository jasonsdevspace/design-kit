import { themeScriptHash } from 'design-kit-release/vite';
import { describe, expect, it } from 'vitest';

import { policyFor, SITE_ORIGIN } from './policy.js';

/*
 * The policy each page carries, as the deployed site gets it. Scripts are the theme script, by its
 * hash, and the files the build writes under the site's own path, never the whole origin, which the
 * portfolio and every demo share.
 */

const directive = (policy: string, name: string) =>
    policy
        .split('; ')
        .find((each) => each.startsWith(`${name} `))
        ?.split(' ')
        .slice(1);

describe("the site's policy", () => {
    it('is written for the origin GitHub Pages serves the site from', () => {
        expect(SITE_ORIGIN).toBe('https://jasonsdevspace.com');
    });

    it("runs the theme script by its hash, and only the files under the site's own path, never the whole origin", () => {
        expect(directive(policyFor(SITE_ORIGIN), 'script-src')).toEqual([
            'https://jasonsdevspace.com/design-kit/assets/',
            themeScriptHash,
        ]);
    });

    it('takes styles and images only from the origin, and nothing else by default', () => {
        const policy = policyFor(SITE_ORIGIN);
        expect(directive(policy, 'default-src')).toEqual(["'none'"]);
        expect(directive(policy, 'style-src')).toEqual(["'self'"]);
        expect(directive(policy, 'img-src')).toEqual(["'self'"]);
    });
});
