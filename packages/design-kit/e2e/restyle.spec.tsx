import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { Toast } from '../src/react.js';
import { servePage } from './page.js';

/*
 * What a change to a page costs the browser in style, in Chromium, which answers a `:has()` written
 * on an element other than the one its rule draws by restyling everything inside that element,
 * whatever changed and wherever. A rule that reads the page's state from the root, the body or an
 * app's frame and draws something inside it would so restyle the whole page on every element or
 * word added. The elements each recalculation restyled are read from the browser's own trace, so
 * the bound is a count, which a slow runner does not move, rather than a time. Showing a toast is
 * held apart: its attach function writes marks and reads styles in turn, and each read after a
 * write that reaches the whole page restyles it again.
 */

const TOAST = renderToStaticMarkup(<Toast />);

const many = (count: number, draw: (index: number) => string): string =>
    Array.from({ length: count }, (_, index) => draw(index)).join('');

/** A form of fields, a status line and a long run of sections, a few thousand elements in all. */
const CONTENT =
    `<p class="dk-status" role="status" id="line"></p><form>` +
    many(
        150,
        (index) =>
            `<div class="dk-field"><label class="dk-field-label" for="f${String(index)}">Field</label>` +
            `<input class="dk-input" id="f${String(index)}"></div>`
    ) +
    `<div class="dk-actions"><button type="button" class="dk-button" id="save">Save</button></div></form>` +
    many(
        600,
        (index) =>
            `<section class="dk-stack"><p id="p${String(index)}">A line <a href="#x">and a link</a></p></section>`
    );

const DIALOG =
    `<dialog class="dk-dialog" aria-labelledby="d-title"><h2 class="dk-dialog-title" id="d-title">Options</h2>` +
    `<div class="dk-field"><label class="dk-field-label" for="d-name">Name</label><input class="dk-input" id="d-name"></div>` +
    `<div class="dk-dialog-actions"><button type="button" class="dk-button">Save</button></div></dialog>`;

/** Each kind of page the sheets tell apart, holding a toast and a dialog as a page of that kind does. */
const PAGES: Readonly<Record<string, string>> = {
    'a content page': `<main class="dk-page">${CONTENT}</main>${TOAST}${DIALOG}`,
    "an app's frame":
        `<div class="dk-app"><header class="dk-app-bar"><h1 class="dk-app-title">Round 3</h1></header>` +
        `<main class="dk-app-body" tabindex="0">${CONTENT}</main><div class="dk-app-toast">${TOAST}</div>` +
        `<section class="dk-app-dock" aria-label="Actions"><button type="button" class="dk-button">Next</button></section></div>${DIALOG}`,
    'a page that ends in a tab bar':
        `<div class="dk-tabbar-page"><main>${CONTENT}</main><nav class="dk-tabbar" aria-label="Places"><ul>` +
        `<li><a href="#play" aria-current="page">Play</a></li></ul></nav></div>${TOAST}${DIALOG}`,
};

const ATTACH = `import { attachToast } from './controls.js';
window.kit = { show: attachToast(document.querySelector('.dk-toast')) };`;

/** The elements each style recalculation restyled while the step ran, from the browser's trace. */
const restyled = async (page: Page, step: () => Promise<unknown>): Promise<number[]> => {
    const browser = page.context().browser();
    if (!browser) throw new Error('the page has no browser');
    await browser.startTracing(page, { categories: ['devtools.timeline'] });
    await step();
    const trace = JSON.parse((await browser.stopTracing()).toString()) as {
        traceEvents: { name: string; args?: { elementCount?: number } }[];
    };
    return trace.traceEvents.flatMap(({ name, args }) =>
        (name === 'UpdateLayoutTree' || name === 'Recalculate style') &&
        typeof args?.elementCount === 'number'
            ? [args.elementCount]
            : []
    );
};

/** The most one recalculation restyled, or none where the step asked for no recalculation. */
const most = (counts: readonly number[]): number => Math.max(0, ...counts);

/** What a page does all day, each read back so the browser restyles before the step ends. */
const CHANGES: Readonly<Record<string, () => void>> = {
    'an element added': () => {
        const section = document.querySelector('#p7')?.parentElement;
        const added = document.createElement('p');
        added.textContent = 'Added.';
        section?.append(added);
        void getComputedStyle(added).color;
    },
    'words said on a status line': () => {
        const line = document.querySelector('#line');
        if (line) line.textContent = 'Saved.';
        void getComputedStyle(line ?? document.body).color;
    },
    'a field marked in error': () => {
        const field = document.querySelector('#f3');
        field?.setAttribute('aria-invalid', 'true');
        void getComputedStyle(field ?? document.body).color;
    },
};

/**
 * The page drawn with its toast attached, and how many elements a recalculation of the whole page
 * restyles, as a change of the root's text size restyles it, which sets the scale for the bounds.
 */
const drawn = async (page: Page, body: string): Promise<number> => {
    await page.setViewportSize({ width: 390, height: 800 });
    await servePage(page, { title: 'Scores', body, script: ATTACH });
    await page.waitForFunction(() => 'kit' in window);
    const whole = most(
        await restyled(page, () =>
            page.evaluate(() => {
                document.documentElement.style.fontSize = '17px';
                void getComputedStyle(document.body).color;
            })
        )
    );
    expect(whole, 'the page is a few thousand elements').toBeGreaterThan(2000);
    return whole;
};

/** Shows a message in the page's toast, and waits two frames for its measuring to end. */
const showToast = (page: Page): Promise<void> =>
    page.evaluate(
        () =>
            new Promise<void>((done) => {
                (window as unknown as { kit: { show: (words: string) => unknown } }).kit.show(
                    'Round 3 saved.'
                );
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        done();
                    });
                });
            })
    );

for (const [kind, body] of Object.entries(PAGES)) {
    test(`restyles what a change touches, not the page, on ${kind}`, async ({ page }) => {
        const whole = await drawn(page, body);
        // No more than a twentieth of the page, a bound a rule that restyles it whole exceeds by far.
        for (const [name, change] of Object.entries(CHANGES)) {
            const counts = await restyled(page, () => page.evaluate(change));
            expect(most(counts), name).toBeLessThanOrEqual(whole / 20);
        }
        // With a toast shown, a change still restyles what it touches.
        await showToast(page);
        const after = await restyled(page, () =>
            page.evaluate(CHANGES['an element added'] ?? (() => undefined))
        );
        expect(most(after), 'an element added while a toast is shown').toBeLessThanOrEqual(
            whole / 20
        );
    });

    test(`restyles the whole page no more than once as a toast shows, on ${kind}`, async ({
        page,
    }) => {
        const whole = await drawn(page, body);
        // However often the toast's measuring reads a style after it writes a mark.
        const shown = await restyled(page, () => showToast(page));
        expect(
            shown.filter((count) => count > whole / 2).length,
            `recalculations of the whole page, of ${String(whole)} elements, among ${shown.join(', ')}`
        ).toBeLessThanOrEqual(1);
    });
}
