import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';
import { build } from 'vite';

/*
 * The kit's button with a ref, drawn by React in a browser, since only a browser attaches a ref
 * and moves focus. The page is bundled from ref-page.tsx with React in it, and written into the
 * browser with the bundle as its one script.
 */

const ENTRY = fileURLToPath(new URL('ref-page.tsx', import.meta.url));

const bundle = async (): Promise<string> => {
    const output = await build({
        configFile: false,
        logLevel: 'silent',
        define: { 'process.env.NODE_ENV': JSON.stringify('production') },
        build: { write: false, lib: { entry: ENTRY, formats: ['es'], fileName: 'ref-page' } },
    });
    const results = Array.isArray(output) ? output : [output];
    for (const result of results) {
        if (!('output' in result)) continue;
        for (const chunk of result.output) if (chunk.type === 'chunk') return chunk.code;
    }
    throw new Error('the page built no script');
};

test('moves focus to the button a ref holds, the one the kit drew', async ({ page }) => {
    const script = await bundle();
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({ content: script, type: 'module' });
    const opener = page.getByRole('button', { name: 'Tour' });
    await expect(opener).toHaveClass('dk-button');
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(opener).toBeFocused();
});
