import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { progress } from '../examples/examples.js';
import { StatusLine } from '../src/react.js';
import { bundle } from './bundle.js';
import { colorOf, forceColors, lengthOf, servePage, sideways, style, writePage } from './page.js';
import { cutOff, SPACED } from './spacing.js';
import { doubled } from './text-size.js';

/*
 * Progress with a known amount, as the reference draws it: the native bar a short track in the line
 * color with its fill in the accent on pill corners, an empty track and no fill for a bar with no
 * value, the highlight in forced colors, its label, value and words read by a screen reader, said
 * by `attachProgress` at each quarter and once at the end, a jump said once, the end never said
 * again or replaced, a run that starts again said again, a bar with no amount saying nothing, the
 * same through React's `useProgress`, and the whole whole on a 320px phone at twice the text size
 * and under wider spacing with no audit findings in either theme or in forced colors.
 */

const EXAMPLE = renderToStaticMarkup(progress);

const BODY = renderToStaticMarkup(
    <main>
        <h1>Import</h1>
        {progress}
        <StatusLine className="screen-status" />
    </main>
);

const SCRIPT = `import { attachProgress } from './controls.js';
const bar = document.querySelector('#import');
const words = document.querySelector('#import-words');
const line = document.querySelector('.screen-status');
window.heard = [];
new MutationObserver(() => {
    if (line.textContent && line.textContent !== window.heard.at(-1)) window.heard.push(line.textContent);
}).observe(line, { childList: true, characterData: true, subtree: true });
window.move = (done) => {
    bar.value = done;
    words.textContent = done + ' of 40 products';
};
window.attachProgress = attachProgress;
window.detach = attachProgress(bar, { status: line });
window.ready = true;`;

type Moving = {
    heard: string[];
    move: (done: number) => void;
    detach: () => void;
    attachProgress: (bar: Element, options: object) => () => void;
};

const open = async (page: Page) => {
    await servePage(page, { title: 'Import', body: BODY, script: SCRIPT });
    await page.waitForFunction(() => 'ready' in window);
};

const heard = (page: Page) => page.evaluate(() => (window as unknown as Moving).heard);
const move = (page: Page, done: number) =>
    page.evaluate((to) => {
        (window as unknown as Moving).move(to);
    }, done);
const said = (done: number) => `Importing products, ${String(done)} of 40 products.`;

/**
 * The colors the bar is drawn in at the fractions of its width given, along its middle row, read
 * from a screenshot through a canvas, since no engine reports the style of its bar's own parts.
 */
const drawnAt = async (page: Page, ...at: number[]) => {
    const bar = page.locator('.dk-progress');
    const shot = (await bar.screenshot()).toString('base64');
    return page.evaluate(
        async ([data, fractions]) => {
            const image = new Image();
            image.src = `data:image/png;base64,${data}`;
            await image.decode();
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const context = canvas.getContext('2d');
            context?.drawImage(image, 0, 0);
            const row = Math.floor(image.height / 2);
            return fractions.map((fraction) => {
                const [r = 0, g = 0, b = 0] =
                    context?.getImageData(Math.floor(image.width * fraction), row, 1, 1).data ?? [];
                return `rgb(${String(r)}, ${String(g)}, ${String(b)})`;
            });
        },
        [shot, at] as const
    );
};

/** A token's color as the page draws it, with no alpha. */
const opaque = async (page: Page, value: string) => {
    const color = await colorOf(page, value);
    const [r = '0', g = '0', b = '0'] = color.match(/[\d.]+/g) ?? [];
    return `rgb(${r}, ${g}, ${b})`;
};

const draw = (
    page: Page,
    {
        body = EXAMPLE,
        theme = 'light',
        css = '',
        width = 1280,
    }: {
        readonly body?: string;
        readonly theme?: 'light' | 'dark';
        readonly css?: string;
        readonly width?: number;
    } = {}
) =>
    writePage(page, {
        title: 'Import',
        body: `<main><h1>Import</h1>${body}</main>`,
        theme,
        css,
        width,
    });

test('draws a short track in the line color on pill corners, filled in the accent', async ({
    page,
}) => {
    await draw(page);
    const bar = page.locator('.dk-progress');
    const look = await style(bar, 'height', 'border-top-left-radius');
    expect(look.height).toBe(`${String(await lengthOf(page, 'var(--dk-space-2)'))}px`);
    expect(Number.parseFloat(look['border-top-left-radius'] ?? '')).toBeGreaterThan(0);
    // Twelve of forty is three tenths, so a tenth in is filled and eight tenths in is the track.
    expect(await drawnAt(page, 0.1, 0.8)).toEqual([
        await opaque(page, 'var(--dk-accent)'),
        await opaque(page, 'var(--dk-line)'),
    ]);
});

test('draws an empty track with no fill for a bar with no value', async ({ page }) => {
    await draw(page, { body: EXAMPLE.replace(' value="12"', '') });
    const track = await opaque(page, 'var(--dk-line)');
    await page.waitForTimeout(300);
    expect(await drawnAt(page, 0.1, 0.5, 0.9)).toEqual([track, track, track]);
});

test('fills in the highlight on an edged canvas track in forced colors', async ({ page }) => {
    await forceColors(page);
    await draw(page);
    // The highlight is drawn over the canvas, so the fill is told apart from the track by it.
    const [fill, track] = await drawnAt(page, 0.1, 0.8);
    expect(track).toBe(await opaque(page, 'Canvas'));
    expect(fill).not.toBe(track);
    expect(
        (await style(page.locator('.dk-progress'), 'border-top-style'))['border-top-style']
    ).toBe('solid');
    await page.evaluate(() => {
        document.querySelector('.dk-progress')?.removeAttribute('value');
    });
    await page.waitForTimeout(300);
    expect(await drawnAt(page, 0.1, 0.8)).toEqual([track, track]);
});

test('reads the label, the amount and the words', async ({ page }) => {
    await draw(page);
    const bar = page.getByRole('progressbar', { name: 'Importing products' });
    await expect(bar).toHaveAttribute('value', '12');
    await expect(bar).toHaveAttribute('max', '40');
    await expect(bar).toHaveAccessibleDescription('12 of 40 products');
});

test('says each quarter once, and the end once', async ({ page }) => {
    await open(page);
    for (const done of [5, 10, 15, 20, 25, 30, 35, 40]) {
        await move(page, done);
        await page.waitForTimeout(150);
    }
    expect(await heard(page)).toEqual([said(10), said(20), said(30), said(40)]);
    await move(page, 40);
    await page.waitForTimeout(150);
    expect(await heard(page)).toEqual([said(10), said(20), said(30), said(40)]);
});

test('says the end of a run that never pauses, and nothing after it', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
        const { move: to } = window as unknown as Moving;
        for (let done = 1; done <= 40; done += 1) to(done);
    });
    await expect.poll(() => heard(page)).toEqual([said(40)]);
    await page.waitForTimeout(300);
    expect(await heard(page)).toEqual([said(40)]);
});

test('says a jump across several quarters once', async ({ page }) => {
    await open(page);
    await move(page, 35);
    await expect.poll(() => heard(page)).toEqual([said(35)]);
});

test('says a run that starts again, and nothing for a bar with no amount', async ({ page }) => {
    await open(page);
    await move(page, 40);
    await expect.poll(() => heard(page)).toEqual([said(40)]);
    await move(page, 0);
    await move(page, 10);
    await expect.poll(() => heard(page)).toEqual([said(40), said(10)]);
    await page.evaluate(() => {
        document.querySelector('#import')?.removeAttribute('value');
    });
    await page.waitForTimeout(300);
    expect(await heard(page)).toEqual([said(40), said(10)]);
});

test('says at the steps a page sets, and nothing once taken away', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
        const moving = window as unknown as Moving;
        moving.detach();
        moving.detach = moving.attachProgress(document.querySelector('#import') as Element, {
            status: document.querySelector('.screen-status'),
            steps: 2,
        });
    });
    for (const done of [10, 20, 30]) {
        await move(page, done);
        await page.waitForTimeout(150);
    }
    expect(await heard(page)).toEqual([said(20)]);
    await page.evaluate(() => {
        (window as unknown as Moving).detach();
    });
    await move(page, 40);
    await page.waitForTimeout(300);
    expect(await heard(page)).toEqual([said(20)]);
});

test.describe('in React', () => {
    let app = '';

    test.beforeAll(async () => {
        test.setTimeout(120_000);
        app = await bundle('progress-page.tsx');
    });

    test('says each quarter and the end through useProgress', async ({ page }) => {
        await servePage(page, { title: 'Import', body: '<div id="root"></div>', script: app });
        await expect(page.getByRole('progressbar', { name: 'Importing products' })).toBeVisible();
        for (const done of [10, 20, 30, 40]) {
            await page.evaluate((to) => {
                (window as unknown as { setDone: (done: number) => void }).setDone(to);
            }, done);
            await page.waitForTimeout(150);
        }
        expect(await page.evaluate(() => (window as unknown as Moving).heard)).toEqual([
            said(10),
            said(20),
            said(30),
            said(40),
        ]);
    });
});

test('stays whole on a 320px phone at twice the text size', async ({ page, browserName }) => {
    await draw(page, { width: 320 });
    await doubled(page, browserName);
    expect(await sideways(page)).toBe(0);
    expect(await cutOff(page, '.dk-field, .dk-field > :not(progress)')).toEqual([]);
});

test('stays whole under wider text spacing', async ({ page }) => {
    await draw(page, { css: SPACED, width: 320 });
    expect(await sideways(page)).toBe(0);
    expect(await cutOff(page, '.dk-field, .dk-field > :not(progress)')).toEqual([]);
});

for (const colors of ['light', 'dark', 'forced'] as const) {
    test(`has no audit findings in ${colors === 'forced' ? 'forced colors' : `the ${colors} theme`}`, async ({
        page,
    }) => {
        if (colors === 'forced') await forceColors(page);
        await draw(page, { theme: colors === 'dark' ? 'dark' : 'light' });
        const results = await new AxeBuilder({ page }).analyze();
        expect(results.violations.map(({ id }) => id)).toEqual([]);
    });
}
