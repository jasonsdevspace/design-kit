import { expect, type Page, test } from '@playwright/test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Toast } from '../src/react.js';
import { frames, servePage, stillClock, tabKey } from './page.js';

/*
 * The controls inside an open shadow root, as a widget drawn into a host page draws them: a refused
 * form whose field's error is found and said there, focus moved by an id there, and progress named
 * by a label there, with elements of the host page sharing those ids never reached, a toast that
 * hands focus back to a control there that focus came into it from, a dialog and a panel that hand
 * focus back from a button inside a shadow tree within them, and a toast that takes focus off one
 * where nothing on its list takes it, holds past its wait while focus is on one, and keeps where
 * focus was before its first message as a second comes while focus is on one. A toast drawn inside
 * a shadow root takes focus off a button slotted into it from the light DOM, and a panel leaves an
 * Escape that clears a search field inside a shadow tree within it to that field and stays open.
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

/** A custom element whose open shadow root holds a button, as a page's own button component. */
const SHADOW_BUTTON = `customElements.define('kit-button', class extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = '<button type="button"><slot></slot></button>';
    }
});`;

test('hands focus back from a dialog taken down with focus on a button inside a shadow tree in it', async ({
    page,
    browserName,
}) => {
    await servePage(page, {
        title: 'Shop',
        body: `<main><h1>Shop</h1><button type="button" id="opener">Share the list</button></main>
<dialog class="dk-dialog" aria-labelledby="share-title"><h2 id="share-title">Share the list</h2>
<input aria-label="Email" autofocus><kit-button>Send</kit-button></dialog>`,
        script: `import { attachDialog } from './controls.js';
${SHADOW_BUTTON}
const down = new AbortController();
const open = attachDialog(document.querySelector('dialog'), { signal: down.signal });
const opener = document.querySelector('#opener');
// A press that gives the button no focus, as Safari's does, so the browser's own close hands focus
// nowhere and focus goes back to the opener only as the kit hands it.
opener.addEventListener('mousedown', (event) => event.preventDefault());
opener.addEventListener('click', (event) => open(event));
window.takeDown = () => down.abort();
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    await page.locator('#opener').click();
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeFocused();
    await page.keyboard.press(tabKey(browserName));
    await expect(page.locator('kit-button button')).toBeFocused();
    await page.evaluate(() => {
        (window as unknown as { takeDown: () => void }).takeDown();
    });
    await expect(page.locator('#opener')).toBeFocused();
});

test('hands focus back from a panel closed by Escape with focus on a button inside a shadow tree in it', async ({
    page,
    browserName,
}) => {
    await servePage(page, {
        title: 'Shop',
        body: `<main><h1>Shop</h1>
<button type="button" class="dk-button" id="opener" aria-expanded="false" aria-controls="share">Share</button>
<div class="dk-panel" id="share" hidden><h2 class="dk-panel-title">Share the list</h2>
<kit-button>Send</kit-button></div></main>`,
        script: `import { attachPanel } from './controls.js';
${SHADOW_BUTTON}
attachPanel(document.querySelector('#opener'));
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    await page.locator('#opener').click();
    await expect(page.locator('#share')).toBeVisible();
    await page.keyboard.press(tabKey(browserName));
    await expect(page.locator('kit-button button')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#share')).toBeHidden();
    await expect(page.locator('#opener')).toBeFocused();
});

/** Shows a message on the toast a page has attached, with no action. */
const showToast = (page: Page, words: string) =>
    page.evaluate((said) => {
        (window as unknown as { show: (words: string) => void }).show(said);
    }, words);

/**
 * Notes where focus is as the next key is handled, followed into shadow roots, since an engine
 * moves focus off a hidden button on its own only some frames later, if at all.
 */
const noteFocusOnKey = (page: Page) =>
    page.evaluate(() => {
        const seen = window as unknown as { left?: string | undefined };
        window.addEventListener(
            'keydown',
            () => {
                let active = document.activeElement;
                while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
                seen.left = active?.localName;
            },
            { once: true }
        );
    });

const focusOnKey = (page: Page) =>
    page.evaluate(() => (window as unknown as { left?: string }).left);

/**
 * A toast whose buttons hold a page's own button component, which the page hides with the toast,
 * on a still clock, and a main that takes no focus.
 */
const openShadowToast = async (page: Page) => {
    await stillClock(page.clock);
    await servePage(page, {
        title: 'Shop',
        css: '.dk-toast:not([data-shown]) kit-button { display: none; }',
        body: `<main><h1>Shop</h1><button type="button" id="save">Save</button></main>${renderToStaticMarkup(
            createElement(Toast)
        )}`,
        script: `import { attachToast } from './controls.js';
${SHADOW_BUTTON}
document
    .querySelector('.dk-toast-buttons')
    .append(Object.assign(document.createElement('kit-button'), { textContent: 'Share' }));
window.show = attachToast(document.querySelector('.dk-toast'));
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
};

test('takes focus out of a toast dismissed from a button inside a shadow tree in it where nothing on its list takes focus', async ({
    page,
}) => {
    await openShadowToast(page);
    await page.locator('#save').focus();
    await showToast(page, 'Your list is saved.');
    await page.evaluate(() => document.querySelector('#save')?.remove());
    const share = page.locator('kit-button button');
    await share.focus();
    await expect(share).toBeFocused();
    await noteFocusOnKey(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('.dk-toast-message')).toHaveText('');
    expect(await focusOnKey(page)).toBe('body');
    await expect(page.locator('body')).toBeFocused();
});

test('holds a toast with no action past its wait while focus is on a button inside a shadow tree in it', async ({
    page,
}) => {
    await openShadowToast(page);
    await showToast(page, 'Your list is saved.');
    // From the toast's own Close, so focus leaves a control of the toast's for the one inside it.
    await page.locator('.dk-toast-close').focus();
    const share = page.locator('kit-button button');
    await share.focus();
    await expect(share).toBeFocused();
    await page.clock.runFor(6000);
    await expect(page.locator('.dk-toast')).toHaveAttribute('data-shown', '');
    await expect(page.locator('.dk-toast-message')).toHaveText('Your list is saved.');
});

test('hands focus back to where it was before the first message where a second comes while focus is on a button inside a shadow tree in the toast', async ({
    page,
}) => {
    await openShadowToast(page);
    await page.locator('#save').focus();
    await showToast(page, 'Your list is saved.');
    // Focus comes into the toast from nowhere, so it goes back to where it was as a message came.
    await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
    });
    const share = page.locator('kit-button button');
    await share.focus();
    await expect(share).toBeFocused();
    await showToast(page, 'Your list is shared.');
    await page.keyboard.press('Escape');
    await expect(page.locator('.dk-toast-message')).toHaveText('');
    await expect(page.locator('#save')).toBeFocused();
});

test('takes focus out of a toast inside a shadow root dismissed from a button slotted into it from the light DOM', async ({
    page,
}) => {
    // The widget draws the toast in its shadow root and the page slots its own button into the
    // toast's buttons, and the widget has nothing else that takes focus.
    await stillClock(page.clock);
    await servePage(page, {
        title: 'Shop',
        body: '<main><h1>Shop</h1><div id="widget"><button type="button" slot="more">Share</button></div></main>',
        script: `import { attachToast } from './controls.js';
const root = document.querySelector('#widget').attachShadow({ mode: 'open' });
root.innerHTML = ${JSON.stringify(renderToStaticMarkup(createElement(Toast)))};
root.querySelector('.dk-toast-buttons')
    .append(Object.assign(document.createElement('slot'), { name: 'more' }));
window.show = attachToast(root.querySelector('.dk-toast'));
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    await showToast(page, 'Your list is saved.');
    const share = page.getByRole('button', { name: 'Share' });
    await share.focus();
    await expect(share).toBeFocused();
    await noteFocusOnKey(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('#widget .dk-toast-message')).toHaveText('');
    expect(await focusOnKey(page)).toBe('body');
    await expect(page.locator('body')).toBeFocused();
});

test('leaves a panel open on Escape that clears a search field inside a shadow tree in it', async ({
    page,
    browserName,
}) => {
    await servePage(page, {
        title: 'Shop',
        body: `<main><h1>Shop</h1>
<button type="button" class="dk-button" id="opener" aria-expanded="false" aria-controls="find">Find</button>
<div class="dk-panel" id="find" hidden><h2 class="dk-panel-title">Find a list</h2>
<kit-search></kit-search></div></main>`,
        script: `import { attachPanel } from './controls.js';
customElements.define('kit-search', class extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = '<input type="search" aria-label="Search">';
    }
});
attachPanel(document.querySelector('#opener'));
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    await page.locator('#opener').click();
    const search = page.locator('kit-search input');
    await search.fill('weekly');
    await page.keyboard.press('Escape');
    // The WebKit the tests run in leaves a search field's words on Escape, as the field's own way.
    if (browserName !== 'webkit') await expect(search).toHaveValue('');
    await frames(page);
    await expect(page.locator('#find')).toBeVisible();
    await expect(search).toBeFocused();
});
