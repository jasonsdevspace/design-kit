import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { Toast } from '../src/react.js';
import {
    box,
    colorOf,
    contrast,
    forceColors,
    frames,
    servePage,
    settle,
    sideways,
    stillClock,
    style,
    tabKey,
} from './page.js';
import { textSize } from './text-size.js';

/*
 * A toast as a page attaches it, in Chromium, WebKit and Firefox: a message drawn and heard without
 * focus moving and with no element added, its action and its close button reached by the keyboard
 * and dismissing it, a toast with an action staying and one without leaving after its time, that
 * wait held while it is hovered or focused, on a stand-in clock, a second message replacing the
 * first and the same words heard again, focus returned to where it was, to a link inside an inline
 * svg, focus left on the page's body where nothing else takes it, left where a page's listener
 * moves it as it leaves the toast, with the walk stopping there and a focus request asked before it
 * leaving it be, a host that delegates focus taken as handed back, the scroll left where it was as
 * focus goes back to a control in view, focus sent on to the control inside a frame of the page's
 * own origin that had focus as the message came and left on the frame where that control is marked
 * off, gone or on a page since loaded, left in the frame where a page's listener moves it there in
 * Firefox, and to a frame of another origin by pointer or past it by a key in Firefox, a long
 * message wrapping with its action in reach and its buttons wrapped inside it on a 320px phone at
 * twice the text size, its message as far from either edge there, its buttons kept together in
 * their group, or as they were without it, its place above an app's dock or at the foot of a page,
 * nothing drawn before a message or printed, the same function returned when attached again, a
 * solid edge in forced colors outside WebKit, which draws none, and no audit findings in either
 * theme.
 */

const TOAST = renderToStaticMarkup(<Toast />);

const LINES = Array.from(
    { length: 30 },
    (_, index) => `<p>Round ${String(index + 1)} of the game so far.</p>`
).join('');

const PAGE = `<main><h1>Scores</h1><button type="button" class="dk-button" id="save">Save</button>
${LINES}<p id="last">The last line.</p></main>${TOAST}`;

const FRAME = `<div class="dk-app">
<header class="dk-app-bar"><h1 class="dk-app-title">Round 3</h1></header>
<main class="dk-app-body" tabindex="0">${LINES}<p id="last">The last line.</p></main>
<div class="dk-app-toast">${TOAST}</div>
<section class="dk-app-dock" aria-label="Actions"><button type="button" class="dk-button dk-button-accent dk-button-tall" id="save">Save the round</button></section>
</div>`;

// A screen as full as an app's gets: a long title, a dock of two and a tab bar, so at twice
// the text size the body is at its least and a row for the toast would push the dock down.
const FULL = FRAME.replace('Round 3</h1>', 'Round 3 of the game at the cabin</h1>').replace(
    '</section>',
    '<button type="button" class="dk-button dk-button-tall">Skip a player</button></section>' +
        '<nav class="dk-app-tabs dk-tabbar" aria-label="Sections"><ul>' +
        '<li><a href="#play" aria-current="page">Play</a></li><li><a href="#games">Games</a></li>' +
        '</ul></nav>'
);

const ATTACH = `import { attachToast } from './controls.js';
const kit = (window.kit = { done: [], last: undefined });
kit.show = attachToast(document.querySelector('.dk-toast'));
kit.again = attachToast(document.querySelector('.dk-toast'));
document.querySelector('#save').addEventListener('click', () => {
    kit.last = kit.show('Round 3 saved.', { label: 'Undo', onAction: () => kit.done.push('Undo') });
});`;

/** The page given, on the test origin, attached unless asked not to be, at the size given. */
const open = async (
    page: Page,
    {
        body = PAGE,
        width = 390,
        height = 700,
        theme = 'light',
        css = '',
        attach = true,
        clock = false,
    }: {
        readonly body?: string;
        readonly width?: number;
        readonly height?: number;
        readonly theme?: 'light' | 'dark';
        readonly css?: string;
        readonly attach?: boolean;
        readonly clock?: boolean;
    } = {}
): Promise<void> => {
    if (clock) await stillClock(page.clock);
    await page.setViewportSize({ width, height });
    await servePage(page, {
        title: 'Scores',
        body,
        script: attach ? ATTACH : undefined,
        theme,
        css,
    });
    if (attach) await page.waitForFunction(() => 'kit' in window);
};

/** Shows a message from the page's script, with an action of the words given or none. */
const show = (page: Page, words: string, action?: string): Promise<void> =>
    page.evaluate(
        ([message, label]) => {
            const kit = (window as unknown as { kit: Kit }).kit;
            kit.last = kit.show(
                message,
                label === undefined
                    ? undefined
                    : {
                          label,
                          onAction: () => {
                              kit.done.push(label);
                          },
                      }
            );
        },
        [words, action] as const
    );

interface Kit {
    done: string[];
    last: (() => void) | undefined;
    show: (message: string, action?: { label: string; onAction: () => void }) => () => void;
    again: Kit['show'];
}

const toast = (page: Page): Locator => page.locator('.dk-toast');

/** Waits for the toast's entrance to end, so it is measured, and audited, where it comes to rest. */
const settled = (page: Page): Promise<unknown> => settle(toast(page));
const message = (page: Page): Locator => page.locator('.dk-toast-message');
const said = (page: Page): Locator => page.getByRole('status');
const undo = (page: Page): Locator => page.getByRole('button', { name: 'Undo' });
const closeButton = (page: Page): Locator => page.getByRole('button', { name: 'Close' });

/** How many elements the page holds. */
const elements = (page: Page): Promise<number> =>
    page.evaluate(() => document.getElementsByTagName('*').length);

/** Where a drawn element ends, down the page. */
const bottom = (drawn: { y: number; height: number }): number => drawn.y + drawn.height;

test('draws nothing before a message, with or without script', async ({ page }) => {
    for (const attach of [false, true]) {
        await open(page, { attach });
        expect((await toast(page).boundingBox())?.height ?? 0, `attached: ${String(attach)}`).toBe(
            0
        );
        await expect(undo(page)).toBeHidden();
        await expect(closeButton(page)).toBeHidden();
    }
});

test('draws a message and says it politely, without moving focus or adding an element', async ({
    page,
}) => {
    await open(page);
    await page.locator('#save').focus();
    const before = await elements(page);
    // The status line is in the page from the start, and says the message with its action.
    await expect(said(page)).toHaveCount(1);
    await expect(said(page)).toHaveText('');
    await page.keyboard.press('Enter');
    await expect(message(page)).toHaveText('Round 3 saved.');
    await expect(said(page)).toHaveText('Round 3 saved. Undo is available.');
    await expect(toast(page)).toBeVisible();
    await expect(page.locator('#save')).toBeFocused();
    expect(await elements(page)).toBe(before);
    await expect(undo(page)).toBeVisible();
    await expect(closeButton(page)).toBeVisible();
});

test('reaches the action by the keyboard, and choosing it runs it and dismisses the toast', async ({
    page,
    browserName,
}) => {
    await open(page);
    await page.locator('#save').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press(tabKey(browserName));
    await expect(undo(page)).toBeFocused();
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => (window as unknown as { kit: Kit }).kit.done)).toEqual([
        'Undo',
    ]);
    await expect(message(page)).toHaveText('');
    await expect(undo(page)).toBeHidden();
    // Focus was in the toast as it left, so it goes back to where it was.
    await expect(page.locator('#save')).toBeFocused();
});

test('dismisses by its named close button, and by Escape, with focus back where it was', async ({
    page,
    browserName,
}) => {
    await open(page);
    await page.locator('#save').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press(tabKey(browserName));
    await page.keyboard.press(tabKey(browserName));
    await expect(closeButton(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(toast(page)).not.toHaveClass(/dk-toast-shown/);
    await expect(page.locator('#save')).toBeFocused();

    await page.keyboard.press('Enter');
    await page.keyboard.press(tabKey(browserName));
    await page.keyboard.press('Escape');
    await expect(message(page)).toHaveText('');
    await expect(page.locator('#save')).toBeFocused();
    expect(await page.evaluate(() => (window as unknown as { kit: Kit }).kit.done)).toEqual([]);
});

test('hands focus back where it was when its close button is pressed by pointer, Safari included', async ({
    page,
}) => {
    await open(page);
    await page.locator('#save').focus();
    await page.keyboard.press('Enter');
    // A pointer's press, which Safari focuses only on a button with a tabindex of its own.
    await closeButton(page).click();
    await expect(toast(page)).not.toHaveClass(/dk-toast-shown/);
    await expect(page.locator('#save')).toBeFocused();
});

test('hands focus back where it was when its action is pressed by pointer, Safari included', async ({
    page,
}) => {
    await open(page);
    await page.locator('#save').focus();
    await show(page, 'Round 3 saved.', 'Undo');
    await undo(page).click();
    await expect(message(page)).toHaveText('');
    await expect(page.locator('#save')).toBeFocused();
});

/** The page with a second control after Save, which the keyboard passes on its way to the toast. */
const TWO = PAGE.replace(
    '</button>',
    '</button><button type="button" class="dk-button" id="share">Share</button>'
);

test('hands focus back to the control the visitor came into the toast from, not where it was as the message came', async ({
    page,
    browserName,
}) => {
    const tab = tabKey(browserName);
    await open(page, { body: TWO });
    await page.locator('#save').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press(tab);
    await expect(page.locator('#share')).toBeFocused();
    await page.keyboard.press(tab);
    await expect(undo(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(message(page)).toHaveText('');
    await expect(page.locator('#share')).toBeFocused();

    // The same where Escape dismisses it from its close button.
    await page.keyboard.press(`Shift+${tab}`);
    await expect(page.locator('#save')).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press(tab);
    await page.keyboard.press(tab);
    await page.keyboard.press(tab);
    await expect(closeButton(page)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(message(page)).toHaveText('');
    await expect(page.locator('#share')).toBeFocused();
});

// A chart drawn as an inline svg, whose link is an SVG element rather than an HTML one.
const CHART = PAGE.replace(
    '</button>',
    '</button><svg width="160" height="40"><a href="#last" id="chart">' +
        '<text x="0" y="24">Round 3 chart</text></a></svg>'
);

test('hands focus back to a link inside an inline svg that focus came into the toast from', async ({
    page,
    browserName,
}) => {
    const tab = tabKey(browserName);
    await open(page, { body: CHART });
    await page.locator('#save').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press(tab);
    await expect(page.locator('#chart')).toBeFocused();
    await page.keyboard.press(tab);
    await page.keyboard.press(tab);
    await expect(closeButton(page)).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(message(page)).toHaveText('');
    await expect(page.locator('#chart')).toBeFocused();
});

test('hands focus back to a link inside an inline svg that had focus as the message came', async ({
    page,
}) => {
    await open(page, { body: CHART });
    await page.locator('#chart').focus();
    await show(page, 'Round 3 saved.', 'Undo');
    // Focus falls to nothing, then comes into the toast with no control it came from.
    await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
    });
    await closeButton(page).focus();
    await page.keyboard.press('Escape');
    await expect(message(page)).toHaveText('');
    await expect(page.locator('#chart')).toBeFocused();
});

test('hands focus back where it was as the message came where the control focus came in from no longer takes it', async ({
    page,
    browserName,
}) => {
    const tab = tabKey(browserName);
    await open(page, { body: TWO });
    await page.locator('#save').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press(tab);
    await page.keyboard.press(tab);
    await expect(undo(page)).toBeFocused();
    await page.locator('#share').evaluate((element) => {
        (element as HTMLButtonElement).disabled = true;
    });
    await page.keyboard.press('Enter');
    await expect(message(page)).toHaveText('');
    await expect(page.locator('#save')).toBeFocused();
});

test('hands focus back to the control focus came into the toast from where the page stops its focusout', async ({
    page,
    browserName,
}) => {
    const tab = tabKey(browserName);
    await open(page, { body: TWO });
    await page.locator('#save').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press(tab);
    await expect(page.locator('#share')).toBeFocused();
    // The page stops Share's focusout before it reaches the document, so the control that last
    // lost focus there is still Save.
    await page.evaluate(() => {
        window.addEventListener(
            'focusout',
            (event) => {
                if ((event.target as Element).id === 'share') event.stopPropagation();
            },
            true
        );
    });
    await page.keyboard.press(tab);
    await expect(undo(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(message(page)).toHaveText('');
    await expect(page.locator('#share')).toBeFocused();
});

test('hands focus back where it was as the message came where focus last came into the toast from nowhere', async ({
    page,
    browserName,
}) => {
    const tab = tabKey(browserName);
    await open(page, { body: TWO });
    await page.locator('#save').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press(tab);
    await page.keyboard.press(tab);
    await expect(undo(page)).toBeFocused();
    // Focus leaves the toast for nothing, then comes back in with no control it came from, so the
    // control it came in from the first time no longer counts.
    await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
    });
    await undo(page).focus();
    await page.keyboard.press('Enter');
    await expect(message(page)).toHaveText('');
    await expect(page.locator('#save')).toBeFocused();
});

test('hands focus back where it was as the message came where focus came into the toast from nowhere', async ({
    page,
}) => {
    await open(page, { body: TWO });
    await page.locator('#save').focus();
    await show(page, 'Round 3 saved.', 'Undo');
    // Focus falls to nothing, then comes into the toast with no control it came from.
    await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
    });
    await undo(page).focus();
    await page.keyboard.press('Enter');
    await expect(message(page)).toHaveText('');
    await expect(page.locator('#save')).toBeFocused();
});

test("lets focus fall to the page's body where nothing it would hand focus to takes it", async ({
    page,
    browserName,
}) => {
    // The page's main content takes no focus, and the page is drawn with no app frame.
    await open(page);
    await page.locator('#save').focus();
    await show(page, 'Round 3 saved.', 'Undo');
    await page.keyboard.press(tabKey(browserName));
    await expect(undo(page)).toBeFocused();
    // Where focus is as the press is handled, since WebKit and Firefox move focus off a hidden
    // button on their own only some frames later.
    await page.evaluate(() => {
        document.querySelector('#save')?.remove();
        const seen = window as unknown as { pressed?: boolean };
        window.addEventListener(
            'click',
            () => {
                seen.pressed = document.activeElement === document.body;
            },
            { once: true }
        );
    });
    await page.keyboard.press('Enter');
    await expect(message(page)).toHaveText('');
    expect(await page.evaluate(() => (window as unknown as { pressed?: boolean }).pressed)).toBe(
        true
    );
    await expect(page.locator('body')).toBeFocused();
});

/** A field after the toast, so the keyboard meets no field on its way in. */
const NOTED = `${TWO}<input id="note" aria-label="Note">`;

/** Has the page move focus to its field as focus next leaves the toast's action. */
const noteOnLeaving = (page: Page): Promise<void> =>
    page.evaluate(() => {
        document.querySelector('.dk-toast-action')?.addEventListener(
            'focusout',
            () => {
                document.querySelector<HTMLElement>('#note')?.focus();
            },
            { once: true }
        );
    });

for (const [where, body] of [
    ['where nothing later on the list takes focus', NOTED],
    ["where the page's main content takes focus", NOTED.replace('<main>', '<main tabindex="-1">')],
] as const)
    test(`leaves focus where a page's listener moves it as focus leaves the toast's button, ${where}`, async ({
        page,
        browserName,
    }) => {
        const tab = tabKey(browserName);
        await open(page, { body });
        await page.locator('#save').focus();
        await page.keyboard.press('Enter');
        await page.keyboard.press(tab);
        await page.keyboard.press(tab);
        await expect(undo(page)).toBeFocused();
        // The toast tries Share, which focus came in from, and the page moves focus to its field
        // as focus leaves the action. The walk stops there, since focus went somewhere other than
        // the place tried, so neither Save nor the main content takes it from the field.
        await noteOnLeaving(page);
        await page.keyboard.press('Enter');
        await expect(message(page)).toHaveText('');
        await expect(page.locator('#note')).toBeFocused();
    });

test("keeps a focus request asked before the dismiss off the field a page's listener focused", async ({
    page,
    browserName,
}) => {
    const tab = tabKey(browserName);
    await open(page, { body: NOTED });
    await page.locator('#save').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press(tab);
    await page.keyboard.press(tab);
    await expect(undo(page)).toBeFocused();
    await noteOnLeaving(page);
    // A request for Share asked, then the toast dismissed, in one task, so the request lands in
    // the next frame, after the page has moved focus to its field during the handback.
    await page.evaluate(async () => {
        // The page's own copy of the controls, which shares the kit's record of its handbacks.
        const controls = '/controls.js';
        const { moveFocus } = (await import(controls)) as {
            moveFocus: (target: string) => () => void;
        };
        moveFocus('share');
        document.querySelector<HTMLElement>('.dk-toast-action')?.click();
    });
    await frames(page, 3);
    await expect(message(page)).toHaveText('');
    await expect(page.locator('#note')).toBeFocused();
});

test('counts focus a host hands to its shadow tree as handed back, so a focus request asked before still lands', async ({
    page,
    browserName,
}) => {
    await open(page, {
        body: NOTED.replace('Share</button>', 'Share</button><dk-picker id="picker"></dk-picker>'),
    });
    // A custom element that hands its focus to the button in its shadow tree.
    await page.evaluate(() => {
        customElements.define(
            'dk-picker',
            class extends HTMLElement {
                constructor() {
                    super();
                    this.attachShadow({ mode: 'open', delegatesFocus: true }).innerHTML =
                        '<button type="button">Pick</button>';
                }
            }
        );
    });
    await page.locator('#picker').focus();
    await show(page, 'Round 3 saved.', 'Undo');
    // The page stops the picker's focusout before it reaches the document, so the control focus
    // came into the toast from is the host, which hands focus on to its button.
    await page.evaluate(() => {
        window.addEventListener(
            'focusout',
            (event) => {
                if ((event.target as Element).id === 'picker') event.stopPropagation();
            },
            true
        );
    });
    await page.keyboard.press(tabKey(browserName));
    await expect(undo(page)).toBeFocused();
    // A request for the field asked, then the toast dismissed, in one task. The handback to the
    // host counts, so the request asked before it is free to land.
    await page.evaluate(async () => {
        const controls = '/controls.js';
        const { moveFocus } = (await import(controls)) as {
            moveFocus: (target: string) => () => void;
        };
        moveFocus('note');
        document.querySelector<HTMLElement>('.dk-toast-action')?.click();
    });
    await frames(page, 3);
    await expect(message(page)).toHaveText('');
    await expect(page.locator('#note')).toBeFocused();
});

for (const [where, body, scroller] of [
    [
        'on a page',
        PAGE.replace(
            '<p id="last">',
            '<button type="button" class="dk-button" id="b">B</button><p id="last">'
        ),
        'html',
    ],
    [
        "in an app's frame",
        FRAME.replace(
            '<p id="last">',
            '<button type="button" class="dk-button" id="b">B</button><p id="last">'
        ),
        '.dk-app-body',
    ],
] as const)
    test(`leaves the scroll where it is as focus goes back to a control in view, ${where}`, async ({
        page,
        browserName,
    }) => {
        await open(page, { body });
        const b = page.locator('#b');
        await b.focus();
        await show(page, 'Round 3 saved.', 'Undo');
        await settled(page);
        // The page scrolled back so B is in view near the foot of the screen, where the room the
        // sheet keeps under a shown toast would take it.
        await page.evaluate((selector) => {
            const target = document.querySelector('#b')!.getBoundingClientRect();
            const box = document.querySelector(selector)!;
            const bottom =
                selector === 'html' ? window.innerHeight : box.getBoundingClientRect().bottom;
            const by = target.bottom - bottom + 8;
            if (selector === 'html') window.scrollBy(0, by);
            else box.scrollTop += by;
        }, scroller);
        const at = (): Promise<number> =>
            page.evaluate(
                (selector) =>
                    selector === 'html'
                        ? window.scrollY
                        : document.querySelector(selector)!.scrollTop,
                scroller
            );
        await page.keyboard.press(tabKey(browserName));
        await expect(undo(page)).toBeFocused();
        const before = await at();
        await page.keyboard.press('Enter');
        await expect(message(page)).toHaveText('');
        await expect(b).toBeFocused();
        expect(Math.abs((await at()) - before)).toBeLessThanOrEqual(1);
    });

/** The page with a frame after Save holding buttons, from the page's origin or the one given. */
const framed = (
    source = 'srcdoc="<button type=button id=inner>Inside</button>' +
        '<button type=button id=next>Next</button>"'
): string => PAGE.replace('</button>', `</button><iframe title="Notes" ${source}></iframe>`);

/** Opens the framed page with focus on the frame's first button, a message shown, and Undo. */
const intoToastFromFrame = async (page: Page): Promise<Locator> => {
    await open(page, { body: framed() });
    const inner = page.frameLocator('iframe').locator('#inner');
    await inner.focus();
    await show(page, 'Round 3 saved.', 'Undo');
    await undo(page).focus();
    return inner;
};

/** Dismisses by Enter and finds focus on the frame, not on its first button, with no error. */
const dismissToFrame = async (page: Page, inner: Locator, errors: Error[]): Promise<void> => {
    await page.keyboard.press('Enter');
    await expect(message(page)).toHaveText('');
    await expect(page.locator('iframe')).toBeFocused();
    await expect(inner).not.toBeFocused();
    expect(errors).toEqual([]);
};

/** The errors a page throws from here on. */
const errorsOf = (page: Page): Error[] => {
    const errors: Error[] = [];
    page.on('pageerror', (error) => errors.push(error));
    return errors;
};

test("hands focus back to the control inside a frame of the page's own origin that had it as the message came", async ({
    page,
    browserName,
}) => {
    await open(page, { body: framed() });
    const inner = page.frameLocator('iframe').locator('#inner');
    await inner.focus();
    await show(page, 'Round 3 saved.', 'Undo');
    // The visitor moves on to the frame's next button after the message came, then into the
    // toast. Focus that comes in from inside a frame counts as coming from nowhere, so it goes
    // back by the page's rule for that, to where it was as the message came.
    await page.keyboard.press(tabKey(browserName));
    await page.keyboard.press(tabKey(browserName));
    await expect(undo(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(message(page)).toHaveText('');
    await expect(page.locator('iframe')).toBeFocused();
    await expect(inner).toBeFocused();
});

test("leaves focus where a page's listener moves it into the frame focus came back to", async ({
    page,
    browserName,
}) => {
    // Chromium and WebKit finish the focus call that fired the listener over a move into a frame,
    // so only Firefox leaves focus where the listener put it.
    test.skip(browserName !== 'firefox', 'Firefox alone keeps a move into a frame from a focusout');
    await open(page, { body: framed() });
    const inner = page.frameLocator('iframe').locator('#inner');
    await inner.focus();
    await show(page, 'Round 3 saved.', 'Undo');
    // Focus comes into the toast from Save, and the page moves it to the frame's next button as
    // it leaves the action, while the toast tries Save.
    await page.locator('#save').focus();
    await undo(page).focus();
    await page.evaluate(() => {
        document.querySelector('.dk-toast-action')?.addEventListener(
            'focusout',
            () => {
                document
                    .querySelector('iframe')
                    ?.contentDocument?.querySelector<HTMLElement>('#next')
                    ?.focus();
            },
            { once: true }
        );
    });
    await page.keyboard.press('Enter');
    await expect(message(page)).toHaveText('');
    await expect(page.locator('iframe')).toBeFocused();
    await expect(page.frameLocator('iframe').locator('#next')).toBeFocused();
});

test('hands focus back to the control inside a frame after a click on its empty space', async ({
    page,
}) => {
    await open(page, { body: framed() });
    const inner = page.frameLocator('iframe').locator('#inner');
    await inner.focus();
    await show(page, 'Round 3 saved.', 'Undo');
    // A click on the frame's empty space, then on the toast's action.
    const frame = await box(page.locator('iframe'));
    await page.mouse.click(frame.x + frame.width - 10, frame.y + frame.height - 10);
    await undo(page).click();
    await expect(message(page)).toHaveText('');
    await expect(page.locator('iframe')).toBeFocused();
    await expect(inner).toBeFocused();
});

test('leaves focus on a frame whose control is marked off as it dismisses', async ({ page }) => {
    const errors = errorsOf(page);
    const inner = await intoToastFromFrame(page);
    await inner.evaluate((button) => button.setAttribute('aria-disabled', 'true'));
    await dismissToFrame(page, inner, errors);
});

test('leaves focus on a frame whose control is gone as it dismisses', async ({ page }) => {
    const errors = errorsOf(page);
    const inner = await intoToastFromFrame(page);
    await inner.evaluate((button) => button.remove());
    await dismissToFrame(page, page.frameLocator('iframe').locator('#next'), errors);
});

test('leaves focus on a frame that has loaded its page again as it dismisses', async ({ page }) => {
    const errors = errorsOf(page);
    const inner = await intoToastFromFrame(page);
    // The frame loads a page of its own again while focus is in the toast, with a button of the
    // same id, which is not the control that had focus.
    await page.locator('iframe').evaluate((frame) => {
        (frame as HTMLIFrameElement).srcdoc = '<button type=button id=inner>Inside</button>';
    });
    await expect(page.frameLocator('iframe').locator('#next')).toHaveCount(0);
    await dismissToFrame(page, inner, errors);
});

test('hands focus back to a frame of another origin, as near as the page can reach', async ({
    page,
    browserName,
}) => {
    await page.route('https://other.test/**', (route) =>
        route.fulfill({
            body: '<button type="button" id="far">Far</button>',
            contentType: 'text/html',
        })
    );
    await open(page, { body: framed('src="https://other.test/"') });
    await page.frameLocator('iframe').locator('#far').focus();
    await show(page, 'Round 3 saved.', 'Undo');
    await page.keyboard.press(tabKey(browserName));
    await expect(undo(page)).toBeFocused();
    // Pressed by pointer, since Firefox leaves a frame of another origin unfocused where a focus
    // call asks for it while a key is being pressed.
    await undo(page).click();
    await expect(message(page)).toHaveText('');
    await expect(page.locator('iframe')).toBeFocused();
});

test('sends focus on to the main content where Firefox will not focus a frame of another origin from a key', async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'firefox', 'Firefox alone refuses the frame while a key is pressed');
    await page.route('https://other.test/**', (route) =>
        route.fulfill({
            body: '<button type="button" id="far">Far</button>',
            contentType: 'text/html',
        })
    );
    await open(page, {
        body: framed('src="https://other.test/"').replace('<main>', '<main tabindex="-1">'),
    });
    await page.frameLocator('iframe').locator('#far').focus();
    await show(page, 'Round 3 saved.', 'Undo');
    await page.keyboard.press(tabKey(browserName));
    await expect(undo(page)).toBeFocused();
    // Firefox does not focus a frame of another origin while a key is being pressed, so a dismiss
    // by Enter goes on down the list to the main content, where a keyboard user lands.
    await page.keyboard.press('Enter');
    await expect(message(page)).toHaveText('');
    await expect(page.locator('main')).toBeFocused();
    await expect(toast(page).locator(':focus')).toHaveCount(0);
});

test("gives a hand-written toast's buttons a tabindex, and keeps one the page set", async ({
    page,
}) => {
    // Markup a page writes by hand, one button with no tabindex and one with the page's own.
    const written = PAGE.replace(' tabindex="0"', '').replace(' tabindex="0"', ' tabindex="-1"');
    expect(written).not.toBe(PAGE);
    await open(page, { body: written });
    await expect(page.locator('.dk-toast-action')).toHaveAttribute('tabindex', '0');
    await expect(page.locator('.dk-toast-close')).toHaveAttribute('tabindex', '-1');
});

test.describe('on a touch screen', () => {
    test.use({ hasTouch: true });

    test('hands focus back where it was when its close button is tapped', async ({
        page,
        browserName,
    }) => {
        test.skip(browserName !== 'webkit', "a tap is tested where Safari's way is, in WebKit");
        await open(page);
        await page.locator('#save').focus();
        await page.keyboard.press('Enter');
        await closeButton(page).tap();
        await expect(toast(page)).not.toHaveClass(/dk-toast-shown/);
        await expect(page.locator('#save')).toBeFocused();
    });
});

test('draws its buttons with a tabindex of their own, so Safari focuses them on a press', async ({
    page,
}) => {
    await open(page);
    // Both are hidden until a message shows, so they are found by their classes.
    await expect(page.locator('.dk-toast-close')).toHaveAttribute('tabindex', '0');
    await expect(page.locator('.dk-toast-action')).toHaveAttribute('tabindex', '0');
});

test('keeps a toast with an action until dismissed, and lets one without leave after its time', async ({
    page,
}) => {
    await open(page, { clock: true });
    await show(page, 'Round 3 saved.', 'Undo');
    await page.clock.runFor(60_000);
    await expect(message(page)).toHaveText('Round 3 saved.');

    await show(page, 'Players saved.');
    await page.clock.runFor(4_900);
    await expect(message(page)).toHaveText('Players saved.');
    await page.clock.runFor(200);
    await expect(message(page)).toHaveText('');
    await expect(closeButton(page)).toBeHidden();
});

test('holds the wait while the toast is hovered or has focus, and starts it again after', async ({
    page,
}) => {
    await open(page, { clock: true });
    await show(page, 'Players saved.');
    await toast(page).hover();
    await page.clock.runFor(20_000);
    await expect(message(page)).toHaveText('Players saved.');
    await page.mouse.move(0, 0);
    await page.clock.runFor(5_100);
    await expect(message(page)).toHaveText('');

    await show(page, 'Players saved.');
    await closeButton(page).focus();
    await page.clock.runFor(20_000);
    await expect(message(page)).toHaveText('Players saved.');
    await page.locator('#save').focus();
    await page.clock.runFor(5_100);
    await expect(message(page)).toHaveText('');
});

test('replaces one message with the next, and says the same words again', async ({ page }) => {
    await open(page, { clock: true });
    await page.evaluate(() => {
        const heard: string[] = [];
        (window as unknown as { heard: string[] }).heard = heard;
        const line = document.querySelector('[role="status"]');
        if (!line) return;
        new MutationObserver(() => {
            if (line.textContent) heard.push(line.textContent);
        }).observe(line, { childList: true, characterData: true, subtree: true });
    });
    for (const [words, action] of [
        ['Round 3 saved.', 'Undo'],
        ['Round 4 saved.', 'Undo'],
        ['Round 4 saved.', 'Undo'],
        ['Players saved.', undefined],
    ] as const) {
        await show(page, words, action);
        await expect(message(page)).toHaveText(words);
        await page.clock.runFor(200);
    }
    expect(await page.evaluate(() => (window as unknown as { heard: string[] }).heard)).toEqual([
        'Round 3 saved. Undo is available.',
        'Round 4 saved. Undo is available.',
        'Round 4 saved. Undo is available.',
        'Players saved.',
    ]);
});

test('dismisses only its own message, by what showing it returned', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
        const kit = (window as unknown as { kit: Kit }).kit;
        // A message replaced, and a message dismissed before the next, each leave the next alone.
        const replaced = kit.again('Round 5 saved.');
        kit.show('Round 6 saved.');
        replaced();
        const gone = kit.show('Round 7 saved.');
        gone();
        kit.show('Round 8 saved.');
        gone();
    });
    await expect(message(page)).toHaveText('Round 8 saved.');
});

test('holds a toast that appears under a pointer resting where the last one was', async ({
    page,
}) => {
    await open(page, { clock: true });
    await show(page, 'Round 3 saved.', 'Undo');
    await undo(page).hover();
    await page.evaluate(() => {
        const kit = (window as unknown as { kit: Kit }).kit;
        document.querySelector<HTMLButtonElement>('.dk-toast-action')?.click();
        kit.show('Round 3 restored.');
    });
    await page.clock.runFor(20_000);
    await expect(message(page)).toHaveText('Round 3 restored.');
});

test('rises into place each time it is shown', async ({ page }) => {
    await open(page);
    for (const [words, action] of [
        ['Round 3 saved.', 'Undo'],
        ['Round 4 saved.', 'Undo'],
        ['Players saved.', undefined],
    ] as const) {
        // Shown and read in one task, with the entrance held at its start, since a slow run reading
        // it later can find it already over. The show waits two frames, so the toast is drawn
        // hidden between messages and the sheet starts its entrance again, as a page's would.
        const entrance = await page.evaluate(
            async ([message, label]) => {
                for (const frame of [1, 2])
                    await new Promise((done) => requestAnimationFrame(() => done(frame)));
                const kit = (window as unknown as { kit: Kit }).kit;
                kit.last = kit.show(
                    message,
                    label === undefined ? undefined : { label, onAction: () => undefined }
                );
                const element = document.querySelector('.dk-toast') as HTMLElement;
                const animations = element
                    .getAnimations()
                    .filter((animation) => animation instanceof CSSAnimation);
                for (const animation of animations) {
                    animation.pause();
                    animation.currentTime = 0;
                }
                const { opacity, translate } = getComputedStyle(element);
                for (const animation of animations) animation.finish();
                const rest = getComputedStyle(element);
                const step = document.body.appendChild(document.createElement('div'));
                step.style.width = 'var(--dk-space-2)';
                const space = getComputedStyle(step).width;
                step.remove();
                return {
                    names: animations.map((animation) => animation.animationName),
                    from: { opacity, translate },
                    to: { opacity: rest.opacity, translate: rest.translate },
                    step: `0px ${space}`,
                };
            },
            [words, action] as const
        );
        expect(entrance).toEqual({
            names: ['dk-toast-rise'],
            from: { opacity: '0', translate: entrance.step },
            to: { opacity: '1', translate: 'none' },
            step: expect.stringMatching(/^0px [1-9]/),
        });
        await closeButton(page).click();
        await expect(toast(page)).not.toHaveAttribute('data-shown');
    }
});

test('moves focus off an action the next message does not have', async ({ page, browserName }) => {
    await open(page);
    await page.locator('#save').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press(tabKey(browserName));
    await expect(undo(page)).toBeFocused();
    await show(page, 'Players saved.');
    await expect(undo(page)).toBeHidden();
    await expect(closeButton(page)).toBeFocused();
});

test('wraps a message of three lines inside the toast, with its action still in reach', async ({
    page,
}) => {
    await open(page, { width: 320 });
    await show(
        page,
        'Round 3 saved. Ana leads with 142, Ben is at 128, and the game ends at 200 points, so two more rounds may settle it.',
        'Undo'
    );
    await settled(page);
    const card = await box(toast(page), 'the toast');
    const words = await box(message(page), 'the message');
    expect(words.height).toBeGreaterThan(60);
    expect(bottom(words)).toBeLessThanOrEqual(bottom(card));
    for (const button of [undo(page), closeButton(page)]) {
        const drawn = await box(button, 'a button');
        expect(drawn.x).toBeGreaterThanOrEqual(card.x);
        expect(drawn.x + drawn.width).toBeLessThanOrEqual(card.x + card.width);
        expect(bottom(drawn)).toBeLessThanOrEqual(bottom(card));
        expect(drawn.height).toBeGreaterThanOrEqual(24);
    }
    expect(await sideways(page)).toBe(0);
});

test("sits in an app's frame above the dock, its action one step back from the dock's button", async ({
    page,
    browserName,
}) => {
    await open(page, { body: FRAME });
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    await page.locator('.dk-app-body').evaluate((element) => {
        element.scrollTop = element.scrollHeight;
    });
    const card = await box(toast(page), 'the toast');
    expect(bottom(card)).toBeLessThanOrEqual(
        (await box(page.locator('.dk-app-dock'), 'the dock')).y
    );
    expect(bottom(await box(page.locator('#last'), 'the last line'))).toBeLessThanOrEqual(card.y);
    // A keyboard on the dock's button reaches the toast's action, and its way back, one step back.
    await page.locator('#save').focus();
    await page.keyboard.press(`Shift+${tabKey(browserName)}`);
    await expect(closeButton(page)).toBeFocused();
    await page.keyboard.press(`Shift+${tabKey(browserName)}`);
    await expect(undo(page)).toBeFocused();
});

test("never moves the frame's dock under the thumb as it shows and leaves, at the usual and at twice the text size", async ({
    page,
    browserName,
}) => {
    for (const scale of browserName === 'chromium' ? [1, 2] : [1]) {
        // At twice the text size the body cannot hold the toast, which takes its row above the dock,
        // and the page scrolls by as much as the dock would have moved.
        await open(page, { body: FULL, height: 844 });
        if (scale === 2) await textSize(page, 2);
        const save = page.locator('#save');
        const before = await box(save, "the dock's button");
        await show(page, 'Round 3 saved.', 'Undo');
        await settled(page);
        expect(await box(save, "the dock's button"), `at ${String(scale)}x, shown`).toEqual(before);
        await closeButton(page).click();
        expect(await box(save, "the dock's button"), `at ${String(scale)}x, gone`).toEqual(before);
    }
});

test("keeps what the keyboard reaches in the frame's body clear of the toast and the bar where the body is near its least height", async ({
    page,
    browserName,
}) => {
    // A phone on its side at the usual text size, and one upright at twice it, where the body is
    // near its least height.
    for (const [width, height, scale] of browserName === 'chromium'
        ? ([
              [844, 400, 1],
              [390, 844, 2],
          ] as const)
        : ([[844, 400, 1]] as const)) {
        await open(page, { body: FULL, width, height });
        if (scale === 2) await textSize(page, 2);
        await page.locator('.dk-app-body').evaluate((element) => {
            const line = document.createElement('p');
            const link = document.createElement('a');
            link.href = '#mid';
            link.id = 'mid';
            link.textContent = 'A round in the middle';
            line.append(link);
            element.children[Math.floor(element.children.length / 2)]?.after(line);
        });
        await show(page, 'Round 3 saved.', 'Undo');
        await settled(page);
        const where = `${String(width)} by ${String(height)} at ${String(scale)}x`;
        await page.locator('#mid').focus();
        const link = await box(page.locator('#mid'), 'the link');
        const body = await box(page.locator('.dk-app-body'), 'the body');
        const card = await box(toast(page), 'the toast');
        expect(link.y, where).toBeGreaterThanOrEqual(body.y - 1);
        expect(bottom(link), where).toBeLessThanOrEqual(Math.min(bottom(body), card.y) + 1);
    }
});

test("keeps the frame's dock in place on a phone on its side at a large text size, where the page scrolls whole", async ({
    page,
    browserName,
}) => {
    test.skip(
        browserName !== 'chromium',
        'the text size is set through Chromium, and Safari keeps no scroll position this way'
    );
    await open(page, { body: FRAME, width: 844, height: 390 });
    await textSize(page, 1.5);
    // Scrolled to the end, with the dock's button in view, where a thumb has just pressed it.
    await page.evaluate(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
    });
    const before = await page
        .locator('#save')
        .evaluate((element) => element.getBoundingClientRect().top);
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    expect(
        await page.locator('#save').evaluate((element) => element.getBoundingClientRect().top)
    ).toBeCloseTo(before, 0);
    await closeButton(page).click();
    expect(
        await page.locator('#save').evaluate((element) => element.getBoundingClientRect().top)
    ).toBeCloseTo(before, 0);
});

test("stops what the keyboard reaches in the frame's body short of a toast floating over it", async ({
    page,
    browserName,
}) => {
    for (const scale of browserName === 'chromium' ? [1, 2] : [1]) {
        await open(page, { body: FULL, height: 844 });
        if (scale === 2) await textSize(page, 2);
        await page.locator('.dk-app-body').evaluate((element) => {
            // A paragraph with a link in it, as a body holds.
            const line = document.createElement('p');
            const link = document.createElement('a');
            link.href = '#end';
            link.id = 'end';
            link.textContent = 'The end of the round';
            line.append(link);
            // In the middle of the body, out of sight below its fold, as most of what it holds is.
            element.children[Math.floor(element.children.length / 2)]?.after(line);
        });
        await show(page, 'Round 3 saved.', 'Undo');
        await settled(page);
        // The body scrolled so the link sits at its foot, under the toast, then reached by the
        // keyboard from the body itself, as a visitor tabbing on through the screen reaches it.
        await page.locator('.dk-app-body').evaluate((element) => {
            const link = element.querySelector('#end');
            if (!link) return;
            element.scrollTop +=
                link.getBoundingClientRect().bottom - element.getBoundingClientRect().bottom;
            element.focus({ preventScroll: true });
        });
        await page.keyboard.press(tabKey(browserName));
        await expect(page.locator('#end')).toBeFocused();
        const card = await box(toast(page), 'the toast');
        expect(
            bottom(await box(page.locator('#end'), 'the link')),
            `at ${String(scale)}x`
        ).toBeLessThanOrEqual(card.y);
    }
});

test("sends focus to the frame's body when its action is chosen and nothing had focus before", async ({
    page,
}) => {
    await open(page, { body: FRAME });
    // Shown as the page loads, with nothing holding focus, then reached by the keyboard.
    await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
    });
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    await undo(page).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.dk-app-body')).toBeFocused();
});

test("sends focus to the frame's body, not to an earlier message's control, when the latest arrived with nothing focused", async ({
    page,
}) => {
    await open(page, { body: FRAME });
    await page.locator('#save').focus();
    await show(page, 'Round 3 saved.', 'Undo');
    await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
    });
    await show(page, 'Round 4 saved.', 'Undo');
    await settled(page);
    await undo(page).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.dk-app-body')).toBeFocused();
});

test("sends focus to the frame's body where what it would go back to no longer takes focus", async ({
    page,
}) => {
    await open(page, { body: FRAME });
    await page.locator('#save').focus();
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    await undo(page).focus();
    // The action hides what focus came from rather than taking it from the page.
    await page.locator('#save').evaluate((element) => {
        (element as HTMLElement).hidden = true;
    });
    await page.keyboard.press('Enter');
    await expect(page.locator('.dk-app-body')).toBeFocused();
});

test("sends focus to the page's main content when its action is chosen and nothing had focus before", async ({
    page,
}) => {
    await open(page, { body: PAGE.replace('<main>', '<main tabindex="-1">') });
    await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
    });
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    await undo(page).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
});

test('leaves the page where it is when what has focus is not under the toast or is taller than the room above it', async ({
    page,
}) => {
    await open(page, { body: PAGE.replace('<main>', '<main tabindex="-1">') });
    // The page's main content holds focus, as a click on its text gives it, scrolled part way.
    await page.locator('main').evaluate((element) => {
        window.scrollTo(0, 120);
        (element as HTMLElement).focus({ preventScroll: true });
    });
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    expect(await page.evaluate(() => window.scrollY)).toBe(120);
});

test('keeps what had focus in view, clear of the toast, as it shows on a page', async ({
    page,
}) => {
    await open(page, {
        body: PAGE.replace(
            '<p id="last">',
            '<p><a href="#more" id="foot">More rounds</a></p><p id="last">'
        ),
    });
    // The link at the foot of the screen, where the toast is about to come, holding focus.
    await page.locator('#foot').evaluate((element) => {
        window.scrollBy(0, element.getBoundingClientRect().bottom - window.innerHeight);
        element.focus({ preventScroll: true });
    });
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    expect(bottom(await box(page.locator('#foot'), 'the link'))).toBeLessThanOrEqual(
        (await box(toast(page), 'the toast')).y + 1
    );
});

test('puts its buttons together on a row under its message on a phone at a large text size', async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    for (const [width, scale] of [
        [390, 1.5],
        [390, 2],
        [320, 2],
    ] as const) {
        await open(page, { width });
        await textSize(page, scale);
        await show(page, 'Round 3 saved.', 'Undo');
        await settled(page);
        const where = `${String(width)}px at ${String(scale)}x`;
        const message = await box(toast(page).locator('.dk-toast-message'), 'the message');
        const action = await box(undo(page), 'the action');
        const close = await box(closeButton(page), 'the close button');
        // Under the message, the action before the close button on one row at its end, or where
        // a face too wide leaves no room for both, each at the end of a row of its own.
        expect(action.y, where).toBeGreaterThanOrEqual(message.y + message.height - 1);
        const card = await box(toast(page), 'the toast');
        const end = card.x + card.width;
        expect(end - (close.x + close.width), where).toBeLessThan(16);
        if (Math.abs(close.y - action.y) <= 1) {
            expect(close.x, where).toBeGreaterThan(action.x + action.width - 1);
        } else {
            expect(close.y, where).toBeGreaterThan(action.y);
            expect(end - (action.x + action.width), where).toBeLessThan(16);
        }
    }
});

/** Checks that the action and the close button share the row under the message, at the end. */
const together = async (page: Page, action: string, what: string): Promise<void> => {
    const words = await box(message(page), 'the message');
    const doing = await box(page.getByRole('button', { name: action }), 'the action');
    const close = await box(closeButton(page), 'the close button');
    const card = await box(toast(page), 'the toast');
    expect(doing.y, what).toBeGreaterThanOrEqual(words.y + words.height - 1);
    expect(Math.abs(close.y - doing.y), what).toBeLessThanOrEqual(1);
    expect(close.x, what).toBeGreaterThan(doing.x + doing.width - 1);
    expect(card.x + card.width - (close.x + close.width), what).toBeLessThan(16);
};

test('keeps its buttons together at its end wherever they wrap under its message', async ({
    page,
}) => {
    for (const { what, width, body, css, action } of [
        {
            what: 'a long action on a 390px phone',
            width: 390,
            body: PAGE,
            css: '',
            action: 'Put the round back',
        },
        {
            what: 'a long action on a 320px phone',
            width: 320,
            body: PAGE,
            css: '',
            action: 'Put the round back',
        },
        {
            what: "an app's frame narrower than the screen",
            width: 1280,
            body: FRAME,
            css: '.dk-app { inline-size: 290px; }',
            action: 'Undo',
        },
    ]) {
        await open(page, { width, body, css });
        await show(page, 'Round 3 saved.', action);
        await settled(page);
        await together(page, action, what);
        // The message on its row of its own stands as far from the toast's end as from its start.
        const card = await box(toast(page), 'the toast');
        const words = await box(message(page), 'the message');
        const start = words.x - card.x;
        expect(
            Math.abs(card.x + card.width - (words.x + words.width) - start),
            what
        ).toBeLessThanOrEqual(1);
    }
});

test('keeps its message and buttons on one row where they fit, and again after a message that did not', async ({
    page,
}) => {
    for (const width of [390, 320]) {
        await open(page, { width });
        await show(page, 'Round 3 saved.', 'Put the round back');
        await settled(page);
        await together(page, 'Put the round back', String(width));
        await show(page, 'Round 3 saved.', 'Undo');
        await settled(page);
        const words = await box(message(page), 'the message');
        for (const button of [undo(page), closeButton(page)]) {
            const drawn = await box(button, 'a button');
            expect(drawn.y, String(width)).toBeLessThan(words.y + words.height / 2);
        }
    }
});

test("keeps a toast with no action on one row in an app's frame narrower than the screen", async ({
    page,
}) => {
    await open(page, { width: 1280, body: FRAME, css: '.dk-app { inline-size: 290px; }' });
    await show(page, 'Round 3 saved.');
    await settled(page);
    await expect(toast(page)).toHaveAttribute('data-rows', '1');
});

/** How far the room for the message's words stands from the toast's start and from its end. */
const room = async (page: Page): Promise<[number, number]> => {
    const card = await box(toast(page), 'the toast');
    const drawn = await box(message(page), 'the message');
    const [left, right] = await message(page).evaluate((words) => {
        const { paddingLeft, paddingRight } = getComputedStyle(words);
        return [parseFloat(paddingLeft), parseFloat(paddingRight)];
    });
    return [drawn.x + left - card.x, card.x + card.width - (drawn.x + drawn.width - right)];
};

test('stands its message as far from either edge on a 320px phone at twice the text size', async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    await open(page, { width: 320 });
    await textSize(page, 2);
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    const [start, end] = await room(page);
    expect(Math.abs(end - start)).toBeLessThanOrEqual(1);
});

test('keeps the layout it had for a toast written without its group of buttons', async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    const flat = TOAST.replace('<div class="dk-toast-buttons">', '').replace(
        /<\/div><\/div>$/,
        '</div>'
    );
    expect(flat).not.toContain('dk-toast-buttons');
    await open(page, { width: 320, body: PAGE.replace(TOAST, flat) });
    await textSize(page, 2);
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    // Under the message, the action before the close button on one row at its end, or where a face
    // too wide leaves no room for both, each at the end of a row of its own, as before the group.
    const words = await box(message(page), 'the message');
    const action = await box(undo(page), 'the action');
    const close = await box(closeButton(page), 'the close button');
    const card = await box(toast(page), 'the toast');
    const end = card.x + card.width;
    expect(action.y).toBeGreaterThanOrEqual(words.y + words.height - 1);
    expect(end - (close.x + close.width)).toBeLessThan(16);
    if (Math.abs(close.y - action.y) <= 1)
        expect(close.x).toBeGreaterThan(action.x + action.width - 1);
    else expect(end - (action.x + action.width)).toBeLessThan(16);
    // Its message, on a row of its own, pads its end as its start, as it did.
    const [start, finish] = await room(page);
    expect(Math.abs(finish - start)).toBeLessThanOrEqual(1);
});

test('sits at the foot of a page clear of the home indicator, in the app column', async ({
    page,
}) => {
    await open(page, { css: ':root { --dk-safe-bottom: 34px; }' });
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    const card = await box(toast(page), 'the toast');
    expect(bottom(card)).toBe(700 - 34 - 16);
    expect(card.x).toBe(16);
    expect(card.width).toBe(390 - 32);

    // A phone on its side, clear of the notch at either side.
    await open(page, {
        width: 844,
        height: 390,
        css: ':root { --dk-safe-left: 47px; --dk-safe-right: 47px; }',
    });
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    const side = await box(toast(page), 'the toast');
    expect(side.x).toBeGreaterThanOrEqual(47 + 16);
    expect(side.x + side.width).toBeLessThanOrEqual(844 - 47 - 16);

    await open(page, { width: 1280, height: 700 });
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    const wide = await box(toast(page), 'the toast');
    expect(wide.width).toBe(448 - 32);
    expect(wide.x).toBe((1280 - wide.width) / 2);
});

for (const width of [390, 320]) {
    test(`keeps what the keyboard reaches, and the end of the page, clear of the toast on a page ${String(width)}px wide`, async ({
        page,
        browserName,
    }) => {
        await open(page, {
            width,
            body: PAGE.replace(
                '<p id="last">',
                '<p><a href="#earlier" id="above">Earlier rounds</a></p>' +
                    '<p><a href="#more" id="foot">More rounds</a></p><p id="last">'
            ),
        });
        await show(page, 'Round 3 saved.', 'Undo');
        await settled(page);
        const card = await box(toast(page), 'the toast');
        // The link scrolled to the foot of the screen, under the toast, then reached by the keyboard.
        await page.locator('#foot').evaluate((element) => {
            window.scrollBy(0, element.getBoundingClientRect().bottom - window.innerHeight);
        });
        expect(bottom(await box(page.locator('#foot'), 'the link'))).toBeGreaterThan(card.y);
        await page.locator('#above').evaluate((element) => {
            element.focus({ preventScroll: true });
        });
        await page.keyboard.press(tabKey(browserName));
        await expect(page.locator('#foot')).toBeFocused();
        expect(bottom(await box(page.locator('#foot'), 'the link'))).toBeLessThanOrEqual(card.y);
        await page.evaluate(() => {
            window.scrollTo(0, document.documentElement.scrollHeight);
        });
        expect(bottom(await box(page.locator('#last'), 'the last line'))).toBeLessThanOrEqual(
            card.y
        );
    });
}

test('keeps room on a page for a toast whose buttons wrap under its message at twice the text size', async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    // The message of one word fits one line in any face, and the page's own rule puts the buttons
    // under it, as a longer message does on a phone, so the toast is the two rows the room is for.
    await open(page, { width: 390, css: '.dk-toast-message { flex-basis: 100%; }' });
    await textSize(page, 2);
    await show(page, 'Saved.', 'Undo');
    await settled(page);
    const card = await box(toast(page), 'the toast');
    const action = await box(page.getByRole('button', { name: 'Undo' }), 'the action');
    // The buttons sit under the message, so the toast is two rows tall.
    const message = await box(toast(page).locator('.dk-toast-message'), 'the message');
    expect(action.y).toBeGreaterThanOrEqual(message.y + message.height - 1);
    const kept = await page.evaluate(() =>
        parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom)
    );
    expect(kept).toBeGreaterThanOrEqual(
        (await page.evaluate(() => window.innerHeight)) - card.y - 1
    );
});

test('keeps room on a page for a toast of as many rows as it takes, measured as it shows', async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    await open(page, { width: 390 });
    await textSize(page, 2);
    // A message that wraps, in any face, over its buttons.
    await show(page, 'Round 3 is saved for every player at the table tonight.', 'Undo');
    await settled(page);
    const card = await box(toast(page), 'the toast');
    const rows = Number(await toast(page).getAttribute('data-rows'));
    expect(rows).toBeGreaterThanOrEqual(3);
    const covered = (await page.evaluate(() => window.innerHeight)) - card.y - 1;
    const kept = await page.evaluate(() =>
        parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom)
    );
    expect(kept).toBeGreaterThanOrEqual(covered);
    // The page's end scrolls clear of it too.
    await page.evaluate(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
    });
    expect(bottom(await box(page.locator('#last'), 'the last line'))).toBeLessThanOrEqual(
        (await box(toast(page), 'the toast')).y + 1
    );
    await closeButton(page).click();
    await expect(toast(page)).not.toHaveAttribute('data-rows');
});

test('measures its room again when the text size changes while it is shown', async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    await open(page, { width: 390 });
    await show(page, 'Round 3 is saved for every player at the table tonight.', 'Undo');
    await settled(page);
    const before = Number(await toast(page).getAttribute('data-rows'));
    await textSize(page, 2);
    await expect
        .poll(async () => Number(await toast(page).getAttribute('data-rows')))
        .toBeGreaterThan(before);
});

for (const theme of ['light', 'dark'] as const) {
    test(`has no audit findings in the ${theme} theme, shown and not`, async ({ page }) => {
        await open(page, { theme });
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        await show(page, 'Round 3 saved.', 'Undo');
        await settled(page);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });
}

test('draws its close button quiet in the muted color, and in the text color under a pointer', async ({
    page,
}) => {
    for (const theme of ['light', 'dark'] as const) {
        await open(page, { theme });
        await page.locator('#save').click();
        await expect(closeButton(page)).toBeVisible();
        const read = async () => (await style(closeButton(page), 'color'))['color'] ?? '';
        const ground = (await style(toast(page), 'background-color'))['background-color'] ?? '';
        const text = (await style(page.locator('body'), 'color'))['color'];
        const muted = await colorOf(page, 'var(--dk-muted)');
        const quiet = await read();
        expect(quiet, theme).toBe(muted);
        expect(contrast(quiet, ground), theme).toBeGreaterThanOrEqual(4.5);
        await closeButton(page).hover();
        await expect.poll(read, { message: theme }).toBe(text);
        expect(contrast(await read(), ground), theme).toBeGreaterThanOrEqual(4.5);
    }
});

test('returns the one function it showed with when attached again', async ({ page }) => {
    await open(page);
    expect(
        await page.evaluate(() => {
            const kit = (window as unknown as { kit: { show: unknown; again: unknown } }).kit;
            return kit.show === kit.again;
        })
    ).toBe(true);
});

test('draws a solid edge round a shown toast in forced colors, where its shadow is gone', async ({
    page,
    browserName,
}) => {
    test.skip(browserName === 'webkit', 'WebKit has no forced colors to draw');
    await forceColors(page);
    await open(page);
    await page.locator('#save').click();
    await expect(toast(page)).toBeVisible();
    const edge = await toast(page).evaluate((element) => {
        const style = getComputedStyle(element);
        return [style.borderTopStyle, style.borderTopWidth];
    });
    expect(edge).toEqual(['solid', '1px']);
});

test('prints no toast, shown or not', async ({ page }) => {
    await open(page);
    const printed = async () => {
        await page.emulateMedia({ media: 'print' });
        const display = await toast(page).evaluate((element) => getComputedStyle(element).display);
        await page.emulateMedia({ media: 'screen' });
        return display;
    };
    expect(await printed(), 'not shown').toBe('none');
    await page.locator('#save').click();
    await expect(toast(page)).toBeVisible();
    expect(await printed(), 'shown').toBe('none');
});

test('wraps its buttons under its message and keeps them inside it on a 320px phone at twice the text size', async ({
    page,
}) => {
    await open(page, { width: 320 });
    await textSize(page, 2);
    await page.locator('#save').click();
    const card = await box(toast(page), 'the toast');
    // Its buttons wrap onto a row of their own under the message, starting below its middle.
    const words = await box(message(page), 'the message');
    for (const button of [undo(page), closeButton(page)])
        expect((await box(button, 'a button')).y).toBeGreaterThan(words.y + words.height / 2);
    for (const button of [undo(page), closeButton(page)]) {
        const drawn = await box(button, 'a button');
        expect(drawn.x).toBeGreaterThanOrEqual(card.x - 0.5);
        expect(drawn.x + drawn.width).toBeLessThanOrEqual(card.x + card.width + 0.5);
        expect(drawn.y + drawn.height).toBeLessThanOrEqual(card.y + card.height + 0.5);
    }
    expect(await sideways(page)).toBe(0);
});
