import { expect, type Page, test } from '@playwright/test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Toast } from '../src/react.js';
import { frames, hearing, servePage, stillClock, tabKey } from './page.js';

/*
 * The controls inside an open shadow root, as a widget drawn into a host page draws them: a refused
 * form whose field's error is found and said there, focus moved by an id there, and progress named
 * by a label there, with elements of the host page sharing those ids never reached, a toast that
 * hands focus back to a control there that focus came into it from, a dialog and a panel that hand
 * focus back from a button inside a shadow tree within them, and a toast that takes focus off one
 * where nothing on its list takes it, holds past its wait while focus is on one, and keeps where
 * focus was before its first message as a second comes while focus is on one. A toast drawn inside
 * a shadow root takes focus off a button slotted into it from the light DOM, and a panel leaves an
 * Escape that clears a search field inside a shadow tree within it to that field and stays open, as
 * it does on an Escape in a component whose shadow tree shares its id and in one in it that marks
 * its host as an open combobox.
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
${hearing('.line', { root: 'root' })}attachForm(root.querySelector('form'), { status: line });
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

test("opens and closes a widget's own panel inside its shadow root, apart from the page's panel with its id", async ({
    page,
}) => {
    const close = (name: string) =>
        `<div class="dk-close"><button type="button" class="dk-button dk-button-text dk-button-quiet"><span aria-hidden="true">×</span><span class="dk-visually-hidden">Close ${name}</span></button></div>`;
    await servePage(page, {
        title: 'Shop',
        body: `<main><h1>Shop</h1>
<button type="button" class="dk-button" id="page-tips" aria-expanded="false" aria-controls="tips">Page tips</button>
<div class="dk-panel" id="tips" hidden><h2 class="dk-panel-title">The page's tips</h2>${close("the page's tips")}</div>
<div id="widget"></div></main>`,
        script: `import { attachPanel } from './controls.js';
const root = document.querySelector('#widget').attachShadow({ mode: 'open' });
root.innerHTML = \`<link rel="stylesheet" href="/kit.css">
<button type="button" class="dk-button" id="widget-tips" aria-expanded="false" aria-controls="tips">Widget tips</button>
<div class="dk-panel" id="tips" hidden><h2 class="dk-panel-title">The widget's tips</h2>${close("the widget's tips")}</div>\`;
attachPanel(document.querySelector('#page-tips'));
attachPanel(root.querySelector('#widget-tips'));
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    const widget = page.locator('#widget');
    const pagePanel = page.locator('main > #tips');
    await widget.getByRole('button', { name: 'Widget tips' }).click();
    await expect(widget.getByRole('heading', { name: "The widget's tips" })).toBeVisible();
    await expect(widget.getByRole('button', { name: 'Widget tips' })).toHaveAttribute(
        'aria-expanded',
        'true'
    );
    await expect(pagePanel).toBeHidden();
    await expect(page.locator('#page-tips')).toHaveAttribute('aria-expanded', 'false');
    await widget.getByRole('button', { name: "Close the widget's tips" }).click();
    await expect(widget.getByRole('heading', { name: "The widget's tips" })).toBeHidden();
    await expect(widget.getByRole('button', { name: 'Widget tips' })).toBeFocused();
    await expect(widget.getByRole('button', { name: 'Widget tips' })).toHaveAttribute(
        'aria-expanded',
        'false'
    );
    // Escape inside the widget's panel closes it alone and hands focus back to its button.
    await widget.getByRole('button', { name: 'Widget tips' }).click();
    await widget.getByRole('button', { name: "Close the widget's tips" }).focus();
    await page.keyboard.press('Escape');
    await expect(widget.getByRole('heading', { name: "The widget's tips" })).toBeHidden();
    await expect(widget.getByRole('button', { name: 'Widget tips' })).toBeFocused();
    // The page's own button opens the page's panel alone.
    await page.locator('#page-tips').click();
    await expect(pagePanel).toBeVisible();
    await expect(widget.getByRole('heading', { name: "The widget's tips" })).toBeHidden();
});

/** A page with a widget whose open shadow root holds a panel's button, drawn by the script given. */
const openWidget = async (page: Page, script: string, after = '') => {
    await servePage(page, {
        title: 'Shop',
        body: `<main><h1>Shop</h1><div id="widget"></div>${after}</main>`,
        script: `import { attachPanel } from './controls.js';
const root = document.querySelector('#widget').attachShadow({ mode: 'open' });
window.root = root;
window.attachPanel = attachPanel;
${script}
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
};

type Widget = {
    root: ShadowRoot;
    attachPanel: (button: HTMLButtonElement) => { detach: () => void };
};

test("hands focus on past a widget to the page's next control as its panel closes with its button off", async ({
    page,
}) => {
    await openWidget(
        page,
        `root.innerHTML = \`<link rel="stylesheet" href="/kit.css">
<button type="button" class="dk-button" id="opener" aria-expanded="false" aria-controls="tips">Tips</button>
<div class="dk-panel" id="tips" hidden><h2 class="dk-panel-title">Tips</h2><div class="dk-close"><button type="button" class="dk-button dk-button-text dk-button-quiet">Close the tips</button></div></div>\`;
attachPanel(root.querySelector('#opener'));`,
        '<button type="button" id="after">After the widget</button>'
    );
    const widget = page.locator('#widget');
    await widget.getByRole('button', { name: 'Tips' }).click();
    await expect(widget.getByRole('heading', { name: 'Tips' })).toBeVisible();
    await page.evaluate(() => {
        (window as unknown as Widget).root
            .querySelector('#opener')
            ?.setAttribute('aria-disabled', 'true');
    });
    await widget.getByRole('button', { name: 'Close the tips' }).click();
    await expect(widget.getByRole('heading', { name: 'Tips' })).toBeHidden();
    await expect(page.locator('#after')).toBeFocused();
});

test("hands focus to the app frame's body around a widget as its panel closes with nothing nearer, where the app is a component", async ({
    page,
}) => {
    // An app drawn by a component of its own, its frame inside the component's shadow root, and a
    // widget in the app's body with a panel in its own shadow root, and nothing after the panel.
    await servePage(page, {
        title: 'Shop',
        body: '<div id="shell"></div>',
        script: `import { attachPanel } from './controls.js';
const shell = document.querySelector('#shell').attachShadow({ mode: 'open' });
shell.innerHTML = '<link rel="stylesheet" href="/kit.css"><div class="dk-app"><main class="dk-app-body" id="app-body" tabindex="0"><div id="widget"></div></main></div>';
const root = shell.querySelector('#widget').attachShadow({ mode: 'open' });
root.innerHTML = \`<link rel="stylesheet" href="/kit.css">
<button type="button" class="dk-button" id="opener" aria-expanded="false" aria-controls="tips">Tips</button>
<div class="dk-panel" id="tips" hidden><h2 class="dk-panel-title">Tips</h2><div class="dk-close"><button type="button" class="dk-button dk-button-text dk-button-quiet">Close the tips</button></div></div>\`;
attachPanel(root.querySelector('#opener'));
window.root = root;
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    const widget = page.locator('#widget');
    await widget.getByRole('button', { name: 'Tips' }).click();
    await expect(widget.getByRole('heading', { name: 'Tips' })).toBeVisible();
    await page.evaluate(() => {
        (window as unknown as Widget).root
            .querySelector('#opener')
            ?.setAttribute('aria-disabled', 'true');
    });
    await widget.getByRole('button', { name: 'Close the tips' }).click();
    await expect(widget.getByRole('heading', { name: 'Tips' })).toBeHidden();
    await expect(page.locator('#app-body')).toBeFocused();
});

/** An app drawn by a component, with a widget in the app's body, drawn as the case gives. */
const openApp = async (page: Page, shell: string, light = '') => {
    await servePage(page, {
        title: 'Shop',
        body: `<div id="shell">${light}</div>`,
        script: `import { attachPanel } from './controls.js';
const shell = document.querySelector('#shell').attachShadow({ mode: 'open' });
shell.innerHTML = ${JSON.stringify(shell)};
const root = (shell.querySelector('#widget') ?? document.querySelector('#widget')).attachShadow({ mode: 'open' });
root.innerHTML = \`<link rel="stylesheet" href="/kit.css">\${window.own ?? ''}
<button type="button" class="dk-button" id="opener" aria-expanded="false" aria-controls="tips">Tips</button>
<div class="dk-panel" id="tips" hidden><h2 class="dk-panel-title">Tips</h2><div class="dk-close"><button type="button" class="dk-button dk-button-text dk-button-quiet">Close the tips</button></div></div>\`;
attachPanel(root.querySelector('#opener'));
window.root = root;
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
};

/** Opens the widget's panel, marks its button off and closes it by its Close, with nothing after it. */
const closeWithNothingNearer = async (page: Page) => {
    const widget = page.locator('#widget');
    await widget.getByRole('button', { name: 'Tips' }).click();
    await expect(widget.getByRole('heading', { name: 'Tips' })).toBeVisible();
    await page.evaluate(() => {
        (window as unknown as Widget).root
            .querySelector('#opener')
            ?.setAttribute('aria-disabled', 'true');
    });
    await widget.getByRole('button', { name: 'Close the tips' }).click();
    await expect(widget.getByRole('heading', { name: 'Tips' })).toBeHidden();
};

const APP =
    '<link rel="stylesheet" href="/kit.css"><div class="dk-app"><main class="dk-app-body" id="app-body" tabindex="0">';

test("hands focus to the app frame's body around a widget slotted into an app a component draws", async ({
    page,
}) => {
    await openApp(page, `${APP}<slot></slot></main></div>`, '<div id="widget"></div>');
    await closeWithNothingNearer(page);
    await expect(page.locator('#app-body')).toBeFocused();
});

test("passes over a widget's own main content that takes no focus to the app frame's body around it", async ({
    page,
}) => {
    await page.addInitScript(() => {
        (window as unknown as { own: string }).own = '<main id="own">The widget</main>';
    });
    await openApp(page, `${APP}<div id="widget"></div></main></div>`);
    await closeWithNothingNearer(page);
    await expect(page.locator('#app-body')).toBeFocused();
});

test("starts a widget's panel as a button drawn again says, once the one before it left the widget and was taken down", async ({
    page,
}) => {
    await openWidget(
        page,
        `root.innerHTML = \`<button type="button" id="first" aria-expanded="false" aria-controls="tips">Tips</button>
<div id="tips" hidden><a href="#deal">How to deal</a></div>\`;
window.first = attachPanel(root.querySelector('#first'));`
    );
    await page.evaluate(() => {
        const { root, attachPanel } = window as unknown as Widget;
        const first = root.querySelector<HTMLButtonElement>('#first');
        first?.remove();
        (window as unknown as { first: { detach: () => void } }).first.detach();
        const again = root.ownerDocument.createElement('button');
        Object.assign(again, { type: 'button', id: 'again', textContent: 'Tips' });
        again.setAttribute('aria-expanded', 'true');
        again.setAttribute('aria-controls', 'tips');
        root.prepend(again);
        attachPanel(again);
    });
    await expect(page.locator('#widget').getByRole('link', { name: 'How to deal' })).toBeVisible();
    await expect(page.locator('#widget').getByRole('button', { name: 'Tips' })).toHaveAttribute(
        'aria-expanded',
        'true'
    );
});

test("closes by Escape a page's panel opened from a widget's button before the page drew it", async ({
    page,
}) => {
    await openWidget(
        page,
        `root.innerHTML = '<button type="button" id="help-button" aria-expanded="true" aria-controls="help">Help</button>';
attachPanel(root.querySelector('#help-button'));
document.querySelector('main').insertAdjacentHTML('beforeend', '<div id="help"><a href="#start">Start here</a></div>');`
    );
    await page.getByRole('link', { name: 'Start here' }).focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('#help')).toBeHidden();
    await expect(page.locator('#widget').getByRole('button', { name: 'Help' })).toBeFocused();
});

test("leaves the page's open panel to its own button as a widget draws a panel with its id after attaching its button", async ({
    page,
}) => {
    await openWidget(
        page,
        `attachPanel(document.querySelector('#page-tips'));
document.querySelector('#page-tips').click();
root.innerHTML = '<button type="button" id="widget-tips" aria-expanded="false" aria-controls="tips">Widget tips</button>';
// The widget's button is attached before the widget draws its own panel, so it first finds the page's.
attachPanel(root.querySelector('#widget-tips'));
const panel = document.createElement('div');
panel.id = 'tips';
panel.hidden = true;
panel.textContent = "The widget's tips";
root.append(panel);`,
        '<button type="button" id="page-tips" aria-expanded="false" aria-controls="tips">Page tips</button><div id="tips" hidden><a href="#deal">How to deal</a></div>'
    );
    await expect(page.locator('main > #tips')).toBeVisible();
    await page.getByRole('link', { name: 'How to deal' }).focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('main > #tips')).toBeHidden();
    await expect(page.locator('#page-tips')).toBeFocused();
    await expect(page.locator('#page-tips')).toHaveAttribute('aria-expanded', 'false');
});

test("opens a widget's panel inside a closed shadow root by a press on its button, and closes it by Escape", async ({
    page,
}) => {
    await servePage(page, {
        title: 'Shop',
        body: '<main><h1>Shop</h1><div id="widget"></div></main>',
        script: `import { attachPanel } from './controls.js';
const root = document.querySelector('#widget').attachShadow({ mode: 'closed' });
root.innerHTML = \`<button type="button" id="opener" aria-expanded="false" aria-controls="tips">Tips</button>
<div id="tips" hidden><a href="#deal">How to deal</a></div>\`;
attachPanel(root.querySelector('#opener'));
window.opener = root.querySelector('#opener');
window.tips = root.querySelector('#tips');
window.link = root.querySelector('a');
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    type Closed = { opener: HTMLButtonElement; tips: HTMLElement; link: HTMLElement };
    const shown = () => page.evaluate(() => !(window as unknown as Closed).tips.hidden);
    // Pressed by pointer at the button's middle, since no locator reaches into a closed root.
    const box = await page.evaluate(() => {
        const { left, top, width, height } = (
            window as unknown as Closed
        ).opener.getBoundingClientRect();
        return { x: left + width / 2, y: top + height / 2 };
    });
    await page.mouse.click(box.x, box.y);
    await expect.poll(shown).toBe(true);
    expect(
        await page.evaluate(() =>
            (window as unknown as Closed).opener.getAttribute('aria-expanded')
        )
    ).toBe('true');
    await page.evaluate(() => {
        (window as unknown as Closed).link.focus();
    });
    await page.keyboard.press('Escape');
    await expect.poll(shown).toBe(false);
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

/** An open panel, with a component of the page's own whose open shadow root holds what is given. */
const openPanelBeside = async (page: Page, component: string, inside: string, host: string) => {
    await servePage(page, {
        title: 'Shop',
        body: `<main><h1>Shop</h1>
<button type="button" class="dk-button" id="opener" aria-expanded="false" aria-controls="share">Share</button>
<div class="dk-panel" id="share" hidden><h2 class="dk-panel-title">Share the list</h2>${inside}</div>
${host}</main>`,
        script: `import { attachPanel } from './controls.js';
customElements.define('kit-field', class extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' }).innerHTML = ${JSON.stringify(component)};
    }
});
attachPanel(document.querySelector('#opener'));
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    await page.locator('#opener').click();
    await expect(page.locator('main > #share')).toBeVisible();
};

test("leaves a panel open on Escape in a component whose shadow tree shares the panel's id", async ({
    page,
}) => {
    await openPanelBeside(
        page,
        '<div id="share"><input aria-label="Note"></div>',
        '<p>Send it to a friend.</p>',
        '<kit-field></kit-field>'
    );
    const note = page.locator('kit-field input');
    await note.focus();
    await page.keyboard.press('Escape');
    await frames(page);
    await expect(page.locator('main > #share')).toBeVisible();
    await expect(note).toBeFocused();
});

test('leaves a panel open on Escape in a component in it that marks its host as an open combobox', async ({
    page,
}) => {
    await openPanelBeside(
        page,
        '<input aria-label="Friend">',
        '<kit-field role="combobox" aria-expanded="true" aria-label="Friend"></kit-field>',
        ''
    );
    const friend = page.locator('kit-field input');
    await friend.focus();
    await page.keyboard.press('Escape');
    await frames(page);
    await expect(page.locator('main > #share')).toBeVisible();
    await expect(friend).toBeFocused();
});

/** A widget whose shadow root is closed, kept on the window for the test, as its own script holds it. */
const openClosed = async (page: Page, inner: string, script: string, body = '') => {
    await page.setViewportSize({ width: 300, height: 700 });
    await servePage(page, {
        title: 'Shop',
        body: `<main><h1 id="page-heading" tabindex="-1">Shop</h1>${body}<div id="widget"></div></main>`,
        script: `import { attachDialog, attachPanel, attachThemeSwitch, focusOnArrival, moveFocus } from './controls.js';
const root = document.querySelector('#widget').attachShadow({ mode: 'closed' });
root.innerHTML = ${JSON.stringify(`<link rel="stylesheet" href="/kit.css">${inner}`)};
window.closedRoot = root;
${script}
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
};

/** What has focus inside the closed root, by its id, or nothing. */
const closedActive = (page: Page) =>
    page.evaluate(
        () => (window as unknown as { closedRoot: ShadowRoot }).closedRoot.activeElement?.id ?? null
    );

/** Presses the element of the closed root with the id given, by pointer, at its middle. */
const pressClosed = async (page: Page, id: string) => {
    const { x, y } = await page.evaluate((given) => {
        const element = (window as unknown as { closedRoot: ShadowRoot }).closedRoot.getElementById(
            given
        ) as HTMLElement;
        const { left, top, width, height } = element.getBoundingClientRect();
        return { x: left + width / 2, y: top + height / 2 };
    }, id);
    await page.mouse.click(x, y);
};

test("lands a request a widget's own button in a closed shadow root asks with itself as where focus was", async ({
    page,
}) => {
    await openClosed(
        page,
        '<button type="button" id="ask">Ask</button><input id="field" aria-label="Field">',
        `const ask = root.getElementById('ask');
ask.addEventListener('click', () => moveFocus(root.getElementById('field'), { from: ask }));`
    );
    // Focused by the widget's own script first, as a keyboard would, so the press starts from it.
    await page.evaluate(() => {
        (window as unknown as { closedRoot: ShadowRoot }).closedRoot.getElementById('ask')?.focus();
    });
    await page.keyboard.press('Enter');
    await expect.poll(() => closedActive(page)).toBe('field');
});

test("focuses the page's heading before a widget's after it, where one press brings both views", async ({
    page,
}) => {
    await openClosed(
        page,
        '<h2 id="widget-heading" tabindex="-1">The widget</h2>',
        `document.querySelector('#bring').addEventListener('click', () => {
    // The widget's view is asked first, so only the order the page draws them puts the page's first.
    focusOnArrival(root.getElementById('widget-heading'), {});
    focusOnArrival(document.querySelector('#page-heading'), {});
});`,
        '<button type="button" id="bring">Bring both</button>'
    );
    await page.locator('#bring').click();
    await expect(page.locator('#page-heading')).toBeFocused();
});

test('opens a theme switch inside a closed shadow root by a press, with focus on the chosen choice', async ({
    page,
}) => {
    await openClosed(
        page,
        `<div class="dk-strip-tools"><div class="dk-theme-switch" hidden><span class="dk-theme-switch-name" id="theme-name">Theme</span>
<button type="button" class="dk-theme-switch-button" id="theme-button" aria-labelledby="theme-name theme-button" aria-expanded="false" aria-controls="theme-choices">System</button>
<div class="dk-theme-switch-choices" id="theme-choices" role="radiogroup" aria-labelledby="theme-name">${[
            'system',
            'light',
            'dark',
        ]
            .map(
                (value) =>
                    `<label class="dk-theme-switch-choice"><input type="radio" name="theme" value="${value}" id="${value}"><span>${value}</span></label>`
            )
            .join('')}</div></div></div>`,
        `attachThemeSwitch(root.querySelector('.dk-theme-switch'));`
    );
    await pressClosed(page, 'theme-button');
    await expect.poll(() => closedActive(page)).toBe('system');
    expect(
        await page.evaluate(() =>
            (window as unknown as { closedRoot: ShadowRoot }).closedRoot
                .getElementById('theme-button')
                ?.getAttribute('aria-expanded')
        )
    ).toBe('true');
});

const DIALOG = (actions: string) =>
    `<button type="button" id="opener">Edit</button><button type="button" id="row">The new row</button>
<dialog class="dk-dialog" id="edit" aria-labelledby="edit-title"><h2 class="dk-dialog-title" id="edit-title" tabindex="-1">Edit the round</h2>${actions}</dialog>`;

test("lands a request a dialog's own button in a closed shadow root asks with itself as where focus was, as it closes the dialog", async ({
    page,
}) => {
    await openClosed(
        page,
        DIALOG('<button type="button" id="save" autofocus>Save</button>'),
        `const dialog = root.getElementById('edit');
const ask = attachDialog(dialog);
root.getElementById('opener').addEventListener('click', ask);
const save = root.getElementById('save');
save.addEventListener('click', () => {
    moveFocus(root.getElementById('row'), { from: save });
    dialog.close();
});`
    );
    await page.evaluate(() => {
        (window as unknown as { closedRoot: ShadowRoot }).closedRoot
            .getElementById('opener')
            ?.focus();
    });
    await page.keyboard.press('Enter');
    await expect.poll(() => closedActive(page)).toBe('save');
    await page.keyboard.press('Enter');
    await expect.poll(() => closedActive(page)).toBe('row');
});

test('moves focus off the corner Close to the first field of a dialog in a closed shadow root as it opens', async ({
    page,
}) => {
    await openClosed(
        page,
        DIALOG(
            '<div class="dk-close"><button type="button" class="dk-button" id="close" autofocus>Close</button></div><input id="first" aria-label="First"><input id="second" aria-label="Second">'
        ),
        `const ask = attachDialog(root.getElementById('edit'));
root.getElementById('opener').addEventListener('click', ask);`
    );
    await page.evaluate(() => {
        (window as unknown as { closedRoot: ShadowRoot }).closedRoot
            .getElementById('opener')
            ?.focus();
    });
    await page.keyboard.press('Enter');
    await expect.poll(() => closedActive(page)).toBe('first');
});

test("lands a page's request after a panel in a closed shadow root hands focus back to its button", async ({
    page,
}) => {
    await openClosed(
        page,
        `<button type="button" class="dk-button" id="opener" aria-expanded="true" aria-controls="tips">Tips</button>
<div class="dk-panel" id="tips"><a href="#deal" id="deal">How to deal</a></div>`,
        `window.tips = attachPanel(root.getElementById('opener'));
document.querySelector('#ask').addEventListener('click', () => {
    moveFocus('page-heading');
    window.tips.set(false);
});`,
        '<button type="button" id="ask">Ask</button>'
    );
    await page.locator('#ask').click();
    await expect(page.locator('#page-heading')).toBeFocused();
});

test("focuses a title the page slots into a widget before the widget's own heading after it, where one press brings both", async ({
    page,
}) => {
    await servePage(page, {
        title: 'Shop',
        body: '<main><button type="button" id="bring">Bring both</button><div id="widget"><h2 id="title" tabindex="-1" slot="title">The title</h2></div></main>',
        script: `import { focusOnArrival } from './controls.js';
const root = document.querySelector('#widget').attachShadow({ mode: 'open' });
root.innerHTML = '<slot name="title"></slot><h3 id="section" tabindex="-1">A section</h3>';
document.querySelector('#bring').addEventListener('click', () => {
    focusOnArrival(root.getElementById('section'), {});
    focusOnArrival(document.querySelector('#title'), {});
});
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    await page.locator('#bring').click();
    await expect(page.locator('#title')).toBeFocused();
});

test('raises no error for a request whose where focus was sits in a fragment', async ({ page }) => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    await servePage(page, {
        title: 'Shop',
        body: '<main><h1 id="heading" tabindex="-1">Shop</h1></main>',
        script: `import { moveFocus } from './controls.js';
const kept = document.createDocumentFragment();
kept.append(document.createElement('button'));
moveFocus('heading', { from: kept.firstElementChild });
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    await expect(page.locator('#heading')).toBeFocused();
    expect(errors).toEqual([]);
});
