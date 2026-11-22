import { expect, type Page, test } from '@playwright/test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Toast } from '../src/react.js';
import { servePage, stillClock, tabKey } from './page.js';

/*
 * The controls inside an open shadow root, as a widget drawn into a host page draws them: a refused
 * form whose field's error is found and said there, focus moved by an id there, and progress named
 * by a label there, with elements of the host page sharing those ids never reached, and a toast
 * that hands focus back to a control there that focus came into it from.
 */

const BODY = `<main><h1>Shop</h1><h2 id="title" tabindex="-1">The host's own title</h2>
<p id="name-error">The host's own words.</p>
<button type="button" id="next">The host's own button</button>
<p id="bar-label">The host's own label.</p>
<div id="widget"></div></main>`;

const SCRIPT = `import { attachForm, attachProgress, focusOnArrival, moveFocus } from './controls.js';
const root = document.querySelector('#widget').attachShadow({ mode: 'open' });
root.innerHTML = \`<form><label for="name">Name</label><input id="name" required>
<button type="submit">Save</button>
<button type="button" id="first">First</button><button type="button" id="next">Next</button></form>
<p id="bar-label">Saving the list</p><progress id="bar" aria-labelledby="bar-label" max="40" value="0"></progress>
<p class="line" role="status"></p>
<main id="home" tabindex="-1"><h2 id="title" tabindex="-1">Your list</h2><button type="button" id="go">Go</button></main>\`;
const line = root.querySelector('.line');
window.heard = [];
new MutationObserver(() => {
    if (line.textContent) window.heard.push(line.textContent);
}).observe(line, { childList: true, characterData: true, subtree: true });
attachForm(root.querySelector('form'), { status: line });
attachProgress(root.querySelector('#bar'), { status: line });
window.root = root;
window.moveFocus = moveFocus;
window.focusOnArrival = focusOnArrival;
window.ready = true;`;

type Shadowed = {
    heard: string[];
    root: ShadowRoot;
    moveFocus: (target: string) => void;
    focusOnArrival: (heading: string, options: object) => void;
};

const open = async (page: Page) => {
    await stillClock(page.clock);
    await servePage(page, { title: 'Shop', body: BODY, script: SCRIPT });
    await page.waitForFunction(() => 'ready' in window);
};

const heard = (page: Page) => page.evaluate(() => (window as unknown as Shadowed).heard);

test("refuses a form inside a shadow root and says its field's own error there", async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        const { root } = window as unknown as Shadowed;
        const field = root.querySelector<HTMLInputElement>('#name');
        field?.focus();
        root.querySelector('form')?.requestSubmit();
    });
    await page.clock.runFor(300);
    expect(await heard(page)).toEqual(['Name: Error: Enter a value.']);
    expect(await page.evaluate(() => (window as unknown as Shadowed).root.activeElement?.id)).toBe(
        'name'
    );
    await expect(page.locator('main > #name-error')).toHaveText("The host's own words.");
});

test('moves focus by an id inside a shadow root, never to a host element sharing it', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        const shadowed = window as unknown as Shadowed;
        shadowed.root.querySelector<HTMLButtonElement>('#first')?.focus();
        shadowed.moveFocus('next');
    });
    await page.clock.runFor(100);
    expect(await page.evaluate(() => (window as unknown as Shadowed).root.activeElement?.id)).toBe(
        'next'
    );
    await expect(page.locator('main > #next')).not.toBeFocused();
});

test('names progress by a label inside a shadow root', async ({ page }) => {
    await open(page);
    await page.clock.runFor(3100);
    await page.evaluate(() => {
        const bar = (window as unknown as Shadowed).root.querySelector<HTMLProgressElement>('#bar');
        if (bar) bar.value = 40;
    });
    await page.clock.runFor(3100);
    expect(await heard(page)).toEqual(['Saving the list, 100%.']);
});

test("focuses a view's heading named by an id inside a shadow root on an arrival a press brought", async ({
    page,
}) => {
    await open(page);
    const go = page.locator('#widget').locator('#go');
    await go.click();
    await page.evaluate(() => {
        const shadowed = window as unknown as Shadowed;
        // From where focus is, which Safari leaves on the press's own ancestor rather than the button.
        shadowed.focusOnArrival('title', {});
    });
    await page.clock.runFor(100);
    expect(await page.evaluate(() => (window as unknown as Shadowed).root.activeElement?.id)).toBe(
        'title'
    );
});

test("falls back to the widget's own main content where a request's target is gone", async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        const shadowed = window as unknown as Shadowed;
        shadowed.root.querySelector<HTMLButtonElement>('#first')?.focus();
        shadowed.moveFocus('gone');
    });
    await page.clock.runFor(100);
    expect(await page.evaluate(() => (window as unknown as Shadowed).root.activeElement?.id)).toBe(
        'home'
    );
});

test('hands focus back from a toast to the control inside a shadow root that focus came in from', async ({
    page,
    browserName,
}) => {
    await servePage(page, {
        title: 'Shop',
        body: `<main><h1>Shop</h1><div id="widget"></div></main>${renderToStaticMarkup(createElement(Toast))}`,
        script: `import { attachToast } from './controls.js';
const root = document.querySelector('#widget').attachShadow({ mode: 'open' });
root.innerHTML = '<button type="button" id="first">First</button><button type="button" id="inner">Inner</button>';
window.show = attachToast(document.querySelector('.dk-toast'));
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    const inner = page.locator('#widget #inner');
    await inner.focus();
    await page.evaluate(() => {
        const { show } = window as unknown as {
            show: (words: string, action: { label: string; onAction: () => void }) => void;
        };
        show('Your list is saved.', { label: 'Undo', onAction: () => undefined });
    });
    await page.keyboard.press(tabKey(browserName));
    await expect(page.getByRole('button', { name: 'Undo' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(inner).toBeFocused();
});
