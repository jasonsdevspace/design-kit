import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { EXAMPLES } from './examples.js';
import { markedIn, writtenReadme } from './readme.js';

const README = new URL('../README.md', import.meta.url);

describe('the README', () => {
    it('writes each block of markup from its example, so `npm run examples` brings it up to date', async () => {
        const readme = readFileSync(README, 'utf8');
        await expect(await writtenReadme(readme)).toMatchFileSnapshot(fileURLToPath(README));
    });

    it('marks a block for every example, each once, so none is left out or skipped', () => {
        const readme = readFileSync(README, 'utf8');
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
