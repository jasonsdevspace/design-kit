import { createHash } from 'node:crypto';

import type { IndexHtmlTransformHook } from 'vite';
import { describe, expect, it } from 'vitest';

import { themeScript } from './theme.js';
import { THEME_PLACEHOLDER, themeScriptHash, themeScriptPlugin } from './vite.js';

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
    it('puts the script inline where the page says, before the first paint', () => {
        const page = transform(PAGE);
        expect(page).toContain(`<head><script>${themeScript}</script></head>`);
        expect(page).not.toContain(THEME_PLACEHOLDER);
    });

    it('refuses a page with no place for the script, rather than leave it to flash', () => {
        expect(() => transform('<!doctype html><html><head></head></html>')).toThrow(
            THEME_PLACEHOLDER
        );
    });

    it("gives the hash a page's policy names the script by", () => {
        const page = transform(PAGE);
        const inline = /<script>([\s\S]*?)<\/script>/.exec(page)?.[1] ?? '';
        const hash = `'sha256-${createHash('sha256').update(inline).digest('base64')}'`;
        expect(themeScriptHash).toBe(hash);
    });
});
