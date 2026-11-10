import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';
import { build } from 'vite';

/*
 * The kit's button, fields and choices with a ref, drawn by React in a browser, since only a
 * browser attaches a ref and moves focus. The page is bundled from ref-page.tsx with React in it,
 * and written into the browser with the bundle as its one script.
 */

const ENTRY = fileURLToPath(new URL('ref-page.tsx', import.meta.url));

/** The page and React as one module, since the page is written into a blank document. */
const bundle = async (): Promise<string> => {
    const output = await build({
        configFile: false,
        logLevel: 'silent',
        define: { 'process.env.NODE_ENV': JSON.stringify('production') },
        build: { write: false, lib: { entry: ENTRY, formats: ['es'], fileName: 'ref-page' } },
    });
    const chunks = (Array.isArray(output) ? output : [output])
        .flatMap((result) => ('output' in result ? result.output : []))
        .filter((file) => file.type === 'chunk');
    const [only] = chunks;
    if (chunks.length !== 1 || !only) throw new Error('the page should build into one script');
    return only.code;
};

let script = '';

// Building React into the page takes a while on a slow runner, so it is done once, on its own clock.
test.beforeAll(async () => {
    test.setTimeout(120_000);
    script = await bundle();
});

test('moves focus back to the button a ref holds when its panel closes', async ({ page }) => {
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({ content: script, type: 'module' });
    const opener = page.getByRole('button', { name: 'Tour' });
    await expect(opener).toHaveClass('dk-button');
    await opener.click();
    await expect(opener).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('button', { name: 'Close' })).toBeHidden();
    await expect(opener).toHaveAttribute('aria-expanded', 'false');
    await expect(opener).toBeFocused();
});

test("moves focus to the control each field's ref holds", async ({ page }) => {
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({ content: script, type: 'module' });
    await page.getByRole('button', { name: 'Send' }).click();
    await page.getByRole('button', { name: 'Go to the name' }).click();
    const name = page.getByLabel('Name');
    await expect(name).toHaveClass('dk-input');
    await expect(name).toBeFocused();
    await page.getByRole('button', { name: 'Go to the size' }).click();
    const size = page.getByLabel('Size');
    await expect(size).toHaveClass('dk-select');
    await expect(size).toBeFocused();
    // A choice's ref holds its control, inside the set the error marks invalid.
    await page.getByRole('button', { name: 'Go to the color' }).click();
    await expect(page.getByRole('radiogroup', { name: 'Color' })).toHaveAttribute(
        'aria-invalid',
        'true'
    );
    await expect(page.getByRole('radio', { name: 'Red' })).toBeFocused();
});
