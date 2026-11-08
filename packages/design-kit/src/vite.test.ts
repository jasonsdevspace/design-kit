import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import type { IndexHtmlTransformHook } from 'vite';
import { describe, expect, it } from 'vitest';

import { themeScript } from './theme.js';
import { browserFloor, THEME_PLACEHOLDER, themeScriptHash, themeScriptPlugin } from './vite.js';

/** The plugin's page transform, called as Vite calls it. */
const transform = (html: string): string => {
    const hook = themeScriptPlugin().transformIndexHtml;
    const handler = (
        typeof hook === 'object' && 'handler' in hook ? hook.handler : hook
    ) as IndexHtmlTransformHook;
    return handler.call({} as never, html, { path: '/', filename: 'index.html' }) as string;
};

const PAGE = `<!doctype html><html><head>${THEME_PLACEHOLDER}</head><body></body></html>`;

describe('the theme script plugin', () => {
    it('puts the script inline where the page says', () => {
        const page = transform(PAGE);
        expect(page).toContain(`<head><script>${themeScript}</script></head>`);
        expect(page).not.toContain(THEME_PLACEHOLDER);
    });

    it('refuses a page with no place for the script, rather than leave it to flash', () => {
        expect(() => transform('<!doctype html><html><head></head></html>')).toThrow(
            THEME_PLACEHOLDER
        );
    });

    it('refuses a page that asks for the script more than once', () => {
        expect(() => transform(PAGE.replace('</head>', `${THEME_PLACEHOLDER}</head>`))).toThrow(
            'more than once'
        );
    });

    it("gives the hash a page's policy names the script by", () => {
        const page = transform(PAGE);
        // The plugin writes the element itself, so its text is what sits between the tags it wrote.
        const inline = page.slice(
            page.indexOf('<script>') + '<script>'.length,
            page.indexOf('</script>')
        );
        const hash = `'sha256-${createHash('sha256').update(inline).digest('base64')}'`;
        expect(themeScriptHash).toBe(hash);
    });
});

describe('the browser floor', () => {
    /** The floor as the README states it, each browser by the name and version it gives. */
    const stated = () => {
        const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
        const sentence = /sets the floor: (.+?)\.(?:\s|$)/s
            .exec(readme)?.[1]
            ?.replaceAll(/\s+/g, ' ');
        if (sentence === undefined) throw new Error('the README states no browser floor');
        const versions = (name: string) => {
            const found = new RegExp(`${name}(?: and Edge)? (\\d+(?:\\.\\d+)?)`).exec(sentence);
            if (!found?.[1]) throw new Error(`the README's floor names no version of ${name}`);
            return found[1];
        };
        const chrome = versions('Chrome');
        return [
            `chrome${chrome}`,
            `edge${chrome}`,
            `firefox${versions('Firefox')}`,
            `safari${versions('Safari')}`,
        ];
    };

    it('is the floor the README states, as a build target Vite and esbuild read', () => {
        expect(browserFloor).toEqual(stated());
    });

    it('cannot be changed by a page that takes it', () => {
        expect(Array.isArray(browserFloor)).toBe(true);
        expect(Object.isFrozen(browserFloor)).toBe(true);
    });
});
