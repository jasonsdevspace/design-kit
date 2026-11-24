import { expect, type Page, test } from '@playwright/test';

import { hear } from './page.js';

/*
 * The recorder the specs share to hear a status line: each write the line takes kept, and a line
 * put in the page already holding words heard as it arrives, alone or inside what holds it.
 */

const heard = (page: Page): Promise<string[]> =>
    page.evaluate(() => (window as unknown as { heard: string[] }).heard);

test('hears a line put in the page already holding words, alone or inside what holds it', async ({
    page,
}) => {
    await page.setContent('<!doctype html><html lang="en"><title>Line</title><main></main></html>');
    await page.evaluate(hear, { line: '.line' });
    await page.evaluate(() => {
        const main = document.querySelector('main');
        main?.insertAdjacentHTML('beforeend', '<p class="line" role="status">Saved.</p>');
        main?.insertAdjacentHTML(
            'beforeend',
            '<div><p class="line" role="status">Round 3 saved.</p></div>'
        );
    });
    await expect.poll(() => heard(page)).toEqual(['Saved.', 'Round 3 saved.']);
});

test('keeps each write, the same words again too, and an empty line only where asked', async ({
    page,
}) => {
    await page.setContent(
        '<!doctype html><html lang="en"><title>Line</title><p class="line" role="status"></p></html>'
    );
    await page.evaluate(hear, { line: '.line' });
    await page.evaluate(hear, { line: '.line', into: 'all', empties: true });
    for (const words of ['Saved.', '', 'Saved.'])
        await page.evaluate((said) => {
            const line = document.querySelector('.line');
            if (line) line.textContent = said;
        }, words);
    await expect.poll(() => heard(page)).toEqual(['Saved.', 'Saved.']);
    expect(await page.evaluate(() => (window as unknown as { all: string[] }).all)).toEqual([
        'Saved.',
        '',
        'Saved.',
    ]);
});
