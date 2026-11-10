import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';
import { build } from 'vite';

/*
 * The kit's button, fields, choices, switch and copy button with a ref, drawn by React in a browser,
 * since only a browser attaches a ref, moves focus, attaches a control or presses a key. The page
 * is bundled from ref-page.tsx with React in it, and written into the browser with the bundle as
 * its one script.
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

test('attaches the switch and the copy button through the refs they hand out', async ({ page }) => {
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({ content: script, type: 'module' });
    // Each is hidden until attached, so being visible shows the ref held the element drawn.
    const group = page.getByRole('radiogroup', { name: 'Theme' });
    await expect(group).toBeVisible();
    await expect(group).toHaveClass('dk-theme-switch page-switch');
    const copy = page.getByRole('button', { name: 'Copy install command' });
    await expect(copy).toBeVisible();
    await expect(copy).toHaveClass('dk-button dk-copy page-copy');
    await expect(page.getByRole('status')).toHaveClass('dk-visually-hidden page-status');
});

test('swallows Enter, Space and a click on an off button alike, and keeps focus on it', async ({
    page,
}) => {
    await page.setContent('<div id="root"></div>');
    await page.addScriptTag({ content: script, type: 'module' });
    const later = page.getByRole('button', { name: 'Send later' });
    await expect(later).toHaveAttribute('aria-disabled', 'true');
    await later.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await later.click();
    // The handler would mark every field, so no error shows while it never runs.
    await expect(page.getByText('Enter a name')).toHaveCount(0);
    await expect(later).toBeFocused();
    // The page's own Send still runs its handler, so the off button alone is swallowing.
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(page.getByText('Enter a name')).toBeVisible();
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
    await page.getByRole('button', { name: 'Go to the note' }).click();
    const note = page.getByLabel('Note');
    await expect(note).toHaveClass('dk-textarea');
    await expect(note).toBeFocused();
});
