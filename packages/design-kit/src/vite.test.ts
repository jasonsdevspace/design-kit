import { createHash } from 'node:crypto';
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { build, type IndexHtmlTransformHook } from 'vite';
import { describe, expect, it } from 'vitest';

import { themeScript } from './theme.js';
import {
    browserFloor,
    lightningcssFloor,
    THEME_PLACEHOLDER,
    themeScriptHash,
    themeScriptPlugin,
} from './vite.js';

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
    /**
     * The floor a README states, each browser by its name in lower case and its version, read from
     * the sentence that sets it. A name with no version of its own takes the next one, as in
     * "Chrome and Edge 123".
     */
    const stated = (readme: URL) => {
        const text = readFileSync(readme, 'utf8');
        const sentence = /sets the floor: (.+?)\.(?:\s|$)/s
            .exec(text)?.[1]
            ?.replaceAll(/\s+/g, ' ');
        if (sentence === undefined) throw new Error(`${readme.pathname} states no browser floor`);
        const floor: string[] = [];
        let waiting: string[] = [];
        for (const [, name = '', version] of sentence.matchAll(
            /([A-Z][a-z]+)(?: (\d+(?:\.\d+)?))?/g
        )) {
            waiting.push(name.toLowerCase());
            if (version === undefined) continue;
            floor.push(...waiting.map((each) => `${each}${version}`));
            waiting = [];
        }
        if (waiting.length > 0) throw new Error(`no version for ${waiting.join(', ')}`);
        return floor;
    };

    const README = new URL('../README.md', import.meta.url);
    const ROOT_README = new URL('../../../README.md', import.meta.url);
    const ACCESSIBILITY = new URL('../../../ACCESSIBILITY.md', import.meta.url);

    it("is the floor the package's README, the repository's README and the accessibility statement state", () => {
        expect(browserFloor()).toEqual(stated(README));
        expect(browserFloor()).toEqual(stated(ROOT_README));
        expect(browserFloor()).toEqual(stated(ACCESSIBILITY));
    });

    it('reads a version for each browser the sentence names, and every browser it names', () => {
        const at = new URL(`file://${tmpdir()}/floor-readme.md`);
        writeFileSync(
            at,
            'This sets the floor: Chrome 123, Edge 124, Firefox 120, Safari 17.5 and Opera 109. More.'
        );
        expect(stated(at)).toEqual([
            'chrome123',
            'edge124',
            'firefox120',
            'safari17.5',
            'opera109',
        ]);
    });

    it('gives each page an array of its own, which a page may change without changing another', () => {
        const mine = browserFloor();
        mine.push('es2022');
        expect(browserFloor()).not.toContain('es2022');
    });

    it('gives the same floor in the form Lightning CSS reads, a version packed in each number', () => {
        const packed = (version: string) => {
            const [major = 0, minor = 0] = version.split('.').map(Number);
            return (major << 16) | (minor << 8);
        };
        const expected = Object.fromEntries(
            browserFloor().map((target) => {
                const [, name = '', version = ''] = /^([a-z]+)(.+)$/.exec(target) ?? [];
                return [name, packed(version)];
            })
        );
        expect(lightningcssFloor()).toEqual(expected);
    });

    /** A page's sheet as Vite builds it, with the floor taken from the kit as the README shows. */
    const built = async (transformer: 'postcss' | 'lightningcss') => {
        const root = mkdtempSync(join(tmpdir(), 'floor-'));
        writeFileSync(join(root, 'index.html'), '<link rel="stylesheet" href="./page.css">');
        writeFileSync(join(root, 'page.css'), ':root { --ground: light-dark(#ffffff, #121212); }');
        await build({
            root,
            logLevel: 'silent',
            configFile: false,
            css:
                transformer === 'lightningcss'
                    ? { transformer, lightningcss: { targets: lightningcssFloor() } }
                    : { transformer },
            build: { target: browserFloor(), outDir: 'dist' },
        });
        const assets = join(root, 'dist', 'assets');
        const sheet = readdirSync(assets).find((file) => file.endsWith('.css')) ?? '';
        return readFileSync(join(assets, sheet), 'utf8');
    };

    it.each(['postcss', 'lightningcss'] as const)(
        'keeps each light-dark() as written in a build with the %s transformer',
        async (transformer) => {
            expect(await built(transformer)).toContain('light-dark(#fff,#121212)');
        },
        30_000
    );
});
