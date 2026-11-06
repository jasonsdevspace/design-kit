import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

import { describe, expect, it } from 'vitest';

import { THEME_KEY, THEMES, themeScript } from './theme.js';

/*
 * The contract between the portfolio and every demo: the storage key the portfolio saves a
 * visitor's theme under, and the two themes it saves there, which the script sets on the root as
 * data-theme, where the tokens read it. How the script behaves in a browser, the portfolio's
 * `system` included, is held by the package's e2e/theme.spec.ts.
 */
describe('the theme contract', () => {
    it('is the key the portfolio saves under and the two themes it saves', () => {
        expect(THEME_KEY).toBe('theme');
        expect(THEMES).toEqual(['light', 'dark']);
    });

    it('is the key and the values the script reads', () => {
        expect(themeScript).toContain(`localStorage.getItem(${JSON.stringify(THEME_KEY)})`);
        for (const theme of THEMES) expect(themeScript).toContain(JSON.stringify(theme));
    });

    it('sets a value the tokens have a rule for', () => {
        const tokens = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');
        for (const theme of THEMES) {
            expect(tokens).toContain(`:where(:root[data-theme='${theme}'])`);
        }
    });

    it('is a script a page can put inline, with nothing that would end its element', () => {
        expect(themeScript).not.toMatch(/<\/script/i);
        // Compiled, not run, so a syntax error fails here rather than in a visitor's browser.
        expect(() => new Script(themeScript)).not.toThrow();
    });
});
