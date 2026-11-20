import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { progress } from '../examples/examples.js';
import { StatusLine } from '../src/react.js';
import { bundle } from './bundle.js';
import {
    colorOf,
    forceColors,
    lengthOf,
    servePage,
    sideways,
    stillClock,
    style,
    writePage,
} from './page.js';
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

const SCRIPT = `import { attachProgress, attachStatus } from './controls.js';
const bar = document.querySelector('#import');
const words = document.querySelector('#import-words');
const line = document.querySelector('.screen-status');
window.heard = [];
new MutationObserver(() => {
    if (line.textContent && line.textContent !== window.heard.at(-1)) window.heard.push(line.textContent);
}).observe(line, { childList: true, characterData: true, subtree: true });
window.move = (done) => {
    bar.value = done;
    words.textContent = done + ' of 40';
};
window.say = attachStatus(line);
window.attachProgress = attachProgress;
window.detach = attachProgress(bar, { status: line });
window.ready = true;`;

type Moving = {
    heard: string[];
    say: (words: string) => void;
    move: (done: number) => void;
    detach: () => void;
    attachProgress: (bar: Element, options: object) => () => void;
};

const open = async (page: Page) => {
    await stillClock(page.clock);
    await servePage(page, { title: 'Import', body: BODY, script: SCRIPT });
    await page.waitForFunction(() => 'ready' in window);
    // The run starts from nothing done, which is not said.
    await move(page, 0);
    await page.clock.runFor(3100);
};

const heard = (page: Page) => page.evaluate(() => (window as unknown as Moving).heard);
const move = (page: Page, done: number) =>
    page.evaluate((to) => {
        (window as unknown as Moving).move(to);
    }, done);
const said = (done: number) => `Importing products, ${String(done)} of 40.`;

/** Moves the bar, then lets the time given pass, a step's gap and more by default. */
const step = async (page: Page, done: number, wait = 3100) => {
    await move(page, done);
    await page.clock.runFor(wait);
};

/** Takes the bar's attach away and attaches it again with the options given. */
const reattach = (page: Page, options: { steps?: number; done?: string }) =>
    page.evaluate((given) => {
        const moving = window as unknown as Moving;
        moving.detach();
        moving.detach = moving.attachProgress(document.querySelector('#import') as Element, {
            status: document.querySelector('.screen-status'),
            ...given,
        });
    }, options);

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
    await expect(bar).toHaveAccessibleDescription('12 of 40');
});

test('says each quarter once, and the end once', async ({ page }) => {
    await open(page);
    for (const done of [5, 10, 15, 20, 25, 30, 35, 40]) await step(page, done);
    expect(await heard(page)).toEqual([said(10), said(20), said(30), said(40)]);
    await step(page, 40);
    expect(await heard(page)).toEqual([said(10), said(20), said(30), said(40)]);
});

test('waits three seconds between steps, and never before the end', async ({ page }) => {
    await open(page);
    await step(page, 10, 500);
    await step(page, 20, 500);
    expect(await heard(page)).toEqual([said(10)]);
    await page.clock.runFor(3000);
    await step(page, 30, 200);
    await step(page, 40, 200);
    expect(await heard(page)).toEqual([said(10), said(30), said(40)]);
});

test('says the end of a run that never pauses, and nothing after it', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
        const { move: to } = window as unknown as Moving;
        for (let done = 1; done <= 40; done += 1) to(done);
    });
    await page.clock.runFor(3100);
    expect(await heard(page)).toEqual([said(40)]);
});

test('says a jump across several quarters once', async ({ page }) => {
    await open(page);
    await step(page, 35);
    expect(await heard(page)).toEqual([said(35)]);
});

test("gives way to a page's own words said just before it", async ({ page }) => {
    await open(page);
    for (const done of [10, 40]) {
        await page.evaluate((to) => {
            const moving = window as unknown as Moving;
            moving.say(`Import failed. ${String(to)} of 40 saved.`);
            moving.move(to);
        }, done);
        await page.clock.runFor(3100);
    }
    expect(await heard(page)).toEqual([
        'Import failed. 10 of 40 saved.',
        'Import failed. 40 of 40 saved.',
    ]);
});

test('says the done words in place of the end', async ({ page }) => {
    await open(page);
    await reattach(page, { done: 'Imported 40 products.' });
    await step(page, 40);
    expect(await heard(page)).toEqual(['Imported 40 products.']);
});

test('says a run that starts again, and not the amount a bar first shows once known', async ({
    page,
}) => {
    await open(page);
    await step(page, 40);
    await move(page, 0);
    await step(page, 10);
    expect(await heard(page)).toEqual([said(40), said(10)]);
    await page.evaluate(() => {
        document.querySelector('#import')?.removeAttribute('value');
    });
    await step(page, 0);
    expect(await heard(page)).toEqual([said(40), said(10)]);
    await step(page, 20);
    expect(await heard(page)).toEqual([said(40), said(10), said(20)]);
});

test('counts its steps again when the page sets new ones, and says nothing once taken away', async ({
    page,
}) => {
    await open(page);
    await reattach(page, { steps: 10 });
    await step(page, 20);
    expect(await heard(page)).toEqual([said(20)]);
    await reattach(page, { steps: 4 });
    await step(page, 25);
    expect(await heard(page)).toEqual([said(20)]);
    await step(page, 30);
    expect(await heard(page)).toEqual([said(20), said(30)]);
    await page.evaluate(() => {
        (window as unknown as Moving).detach();
    });
    await step(page, 40);
    expect(await heard(page)).toEqual([said(20), said(30)]);
});

test('names a bar by its own label, and says hundredths where it has no words', async ({
    page,
}) => {
    await stillClock(page.clock);
    await servePage(page, {
        title: 'Upload',
        body:
            '<main><h1>Upload</h1><progress class="dk-progress" aria-label="Uploading" max="40" value="0"></progress>' +
            '<p class="screen-status" role="status"></p></main>',
        script: `import { attachProgress } from './controls.js';
const line = document.querySelector('.screen-status');
window.heard = [];
new MutationObserver(() => {
    if (line.textContent) window.heard.push(line.textContent);
}).observe(line, { childList: true, characterData: true, subtree: true });
attachProgress(document.querySelector('progress'), { status: line });
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    await page.evaluate(() => {
        document.querySelector('progress')?.setAttribute('value', '10');
    });
    await page.clock.runFor(300);
    expect(await heard(page)).toEqual(['Uploading, 25%.']);
});

test.describe('in React', () => {
    let app = '';

    test.beforeAll(async () => {
        test.setTimeout(120_000);
        app = await bundle('progress-page.tsx');
    });

    test('says each quarter and the done words through useProgress', async ({ page }) => {
        await stillClock(page.clock);
        await servePage(page, { title: 'Import', body: '<div id="root"></div>', script: app });
        await expect(page.getByRole('progressbar', { name: 'Importing products' })).toBeVisible();
        for (const done of [10, 20, 30, 40]) {
            await page.evaluate((to) => {
                (window as unknown as { setDone: (done: number) => void }).setDone(to);
            }, done);
            await page.clock.runFor(3100);
        }
        expect(await page.evaluate(() => (window as unknown as Moving).heard)).toEqual([
            said(10),
            said(20),
            said(30),
            'Imported 40 products.',
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
