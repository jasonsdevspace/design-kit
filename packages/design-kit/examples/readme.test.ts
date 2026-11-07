import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { EXAMPLES } from './examples.js';
import { markedIn, writtenReadme } from './readme.js';

const README = new URL('../README.md', import.meta.url);

describe('the README', () => {
    it('writes each block of markup from its example, so `npm run examples` brings it up to date', async () => {
        const readme = readFileSync(README, 'utf8');
        await expect(await writtenReadme(readme)).toMatchFileSnapshot(README.pathname);
    });

    it('marks a block for every example, each once, so none is left out or skipped', () => {
        const readme = readFileSync(README, 'utf8');
        const marked = markedIn(readme);
        expect([...new Set(marked)]).toEqual(marked);
        expect(new Set(marked)).toEqual(new Set(Object.keys(EXAMPLES)));
        // A marker with no block right after it would be passed over, so each has one.
        expect(marked).toHaveLength(readme.split('<!-- example: ').length - 1);
    });

    it('refuses a marker that names no example', async () => {
        await expect(
            writtenReadme('<!-- example: nothing -->\n\n```html\n<p></p>\n```')
        ).rejects.toThrow('nothing');
    });
});
