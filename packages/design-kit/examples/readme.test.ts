import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { EXAMPLES } from './examples.js';
import { markedIn, writtenReadme } from './readme.js';

const README = new URL('../README.md', import.meta.url);
const REFERENCE = new URL('../REFERENCE.md', import.meta.url);
const { version } = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
) as { version: string };

/** A heading's id as GitHub writes it: lower case, punctuation dropped, each space a hyphen. */
const slug = (heading: string) =>
    heading
        .trim()
        .toLowerCase()
        .replaceAll(/[^\p{L}\p{M}\p{N}\s_-]/gu, '')
        .replaceAll(/\s/g, '-');

describe('the reference', () => {
    it('writes each block of markup from its example, so `npm run examples` brings it up to date', async () => {
        const readme = readFileSync(REFERENCE, 'utf8');
        await expect(await writtenReadme(readme)).toMatchFileSnapshot(fileURLToPath(REFERENCE));
    });

    it('marks a block for every example, each once, so none is left out or skipped', () => {
        const readme = readFileSync(REFERENCE, 'utf8');
        const marked = markedIn(readme);
        expect([...new Set(marked)]).toEqual(marked);
        expect(new Set(marked)).toEqual(new Set(Object.keys(EXAMPLES)));
        // A marker with no block right after it would be passed over, so each has one.
        expect(marked).toHaveLength(readme.split('<!-- example: ').length - 1);
    });

    it('closes an empty block at its own fence, and keeps the words after it', async () => {
        const readme =
            '<!-- example: panel -->\n\n```html\n```\n\nWords after.\n\n```tsx\nx\n```\n';
        const written = await writtenReadme(readme);
        expect(written).toContain('<p class="dk-panel-title">');
        expect(written).toContain('\n```\n\nWords after.\n\n```tsx\nx\n```\n');
    });

    it('reads and keeps the line endings of a checkout that ends lines with a carriage return', async () => {
        const readme = '<!-- example: panel -->\r\n\r\n```html\r\n<p></p>\r\n```\r\n';
        const written = await writtenReadme(readme);
        expect(written).toContain('<p class="dk-panel-title">');
        expect(written.replaceAll('\r\n', '')).not.toContain('\n');
    });

    it('refuses a marker that names no example', async () => {
        await expect(
            writtenReadme('<!-- example: nothing -->\n\n```html\n<p></p>\n```')
        ).rejects.toThrow('nothing');
    });
});

describe('the package README', () => {
    const links = [
        ...readFileSync(README, 'utf8').matchAll(
            /github\.com\/jasonsdevspace\/design-kit\/blob\/([^/)]+)\/packages\/design-kit\/REFERENCE\.md(?:#([^)\s]*))?\)/g
        ),
    ];

    it('links the reference at the tag of its own version, so npm shows the one it installed', () => {
        expect(links.length).toBeGreaterThan(0);
        expect(new Set(links.map(([, ref]) => ref))).toEqual(new Set([`design-kit-v${version}`]));
    });

    it('links only headings the reference has', () => {
        const ids = [
            ...readFileSync(REFERENCE, 'utf8')
                .replaceAll(/^```[\s\S]*?^```/gm, '')
                .matchAll(/^#+ (.+)$/gm),
        ].map(([, title]) => slug(title ?? ''));
        const missing = links
            .map(([, , heading]) => heading)
            .filter((heading) => heading !== undefined && !ids.includes(heading));
        expect(missing).toEqual([]);
    });
});
