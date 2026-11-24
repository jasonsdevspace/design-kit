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
    hear,
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
 * focus goes back to a control in view, a control that has focus as a message shows kept clear of
 * the toast, inside a tall frame of the page's own origin too, past the frame's border and padding,
 * in a frame drawn smaller, wider or, outside WebKit, by zoom, and where the toast covers it by
 * less than the rise it enters on, and left where it is where the toast leaves it alone, where the
 * frame has scrolled it out of sight or behind its scrollbar, where WebKit lays a zoomed frame's
 * document out past what the frame shows, where it is taller than the room above the toast, or
 * where it sits beside a narrow toast, focus sent on to the control inside a frame of the page's
 * own origin that had focus as the message came and left on the frame where that control is marked
 * off, gone or on a page since loaded, left in the frame where a page's listener moves it there in
 * Firefox, and to a frame of another origin by pointer or past it by a key in Firefox, a long
 * message wrapping with its action in reach and its buttons wrapped inside it on a 320px phone at
 * twice the text size, its message as far from either edge there, its buttons kept together in
 * their group, or as they were without it, its place above an app's dock or at the foot of a page,
 * nothing drawn before a message or printed, the same function returned when attached again, a
 * solid edge in forced colors outside WebKit, which draws none, and no audit findings in either
 * theme. A toast the page attaches inside a frame of its own origin is reached by F8 pressed in the
 * frame and hands focus back to the control there.
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

/*
 * A page of many controls before the toast, so the action is far down the Tab order: links, a
 * field, a choice and buttons, with Save raising the message and Share standing for a control
 * deep in the page.
 */
const MANY = PAGE.replace(
    '<h1>Scores</h1>',
    '<h1>Scores</h1><nav><a href="#last">Rounds</a> <a href="#last">Players</a></nav>' +
        '<label>Name <input id="name"></label><label>Game <select id="game">' +
        '<option>Flip 7</option><option>Skyjo</option></select></label>'
).replace(
    '</button>',
    '</button><button type="button" class="dk-button" id="share">Share</button>' +
        '<button type="button" class="dk-button" id="print">Print</button>'
);

/** Notes, on the window after every listener of the kit's, whether each F8 had its default kept. */
const noteF8 = (page: Page): Promise<void> =>
    page.evaluate(() => {
        const notes: boolean[] = [];
        (window as unknown as { f8: boolean[] }).f8 = notes;
        window.addEventListener('keydown', (event) => {
            if (event.key === 'F8') notes.push(event.defaultPrevented);
        });
    });

/** Whether each F8 so far had its default prevented, in order. */
const f8Prevented = (page: Page): Promise<boolean[]> =>
    page.evaluate(() => (window as unknown as { f8: boolean[] }).f8);

test.describe('F8', () => {
    for (const key of ['Enter', 'Escape'] as const) {
        test(`moves focus to a shown action from anywhere on the page, and ${key} there sends it back`, async ({
            page,
        }) => {
            await open(page, { body: MANY });
            await noteF8(page);
            await page.locator('#save').focus();
            await page.keyboard.press('Enter');
            await expect(undo(page)).toBeVisible();
            // Focus never moves as a message shows.
            await expect(page.locator('#save')).toBeFocused();
            await page.locator('#share').focus();
            await page.keyboard.press('F8');
            await expect(undo(page)).toBeFocused();
            await page.keyboard.press(key);
            await expect(message(page)).toHaveText('');
            await expect(page.locator('#share')).toBeFocused();
            expect(await page.evaluate(() => (window as unknown as { kit: Kit }).kit.done)).toEqual(
                key === 'Enter' ? ['Undo'] : []
            );
            expect(await f8Prevented(page)).toEqual([true]);
        });
    }

    test('sends focus back where it came from when pressed in the toast, the toast still shown', async ({
        page,
    }) => {
        await open(page, { body: MANY });
        await noteF8(page);
        await page.locator('#save').focus();
        await page.keyboard.press('Enter');
        await page.locator('#name').focus();
        await page.keyboard.press('F8');
        await expect(undo(page)).toBeFocused();
        await page.keyboard.press('F8');
        await expect(page.locator('#name')).toBeFocused();
        await expect(toast(page)).toHaveAttribute('data-shown');
        await expect(undo(page)).toBeVisible();
        // From the close button too, and again to the action from where focus went back.
        await page.keyboard.press('F8');
        await expect(undo(page)).toBeFocused();
        await closeButton(page).focus();
        await page.keyboard.press('F8');
        await expect(page.locator('#name')).toBeFocused();
        await expect(toast(page)).toHaveAttribute('data-shown');
        expect(await f8Prevented(page)).toEqual([true, true, true, true]);
    });

    test('moves nothing and keeps the default with no toast, no action, a modifier or a repeat', async ({
        page,
    }) => {
        await open(page, { body: MANY });
        await noteF8(page);
        const share = page.locator('#share');
        await share.focus();
        // No toast shown.
        await page.keyboard.press('F8');
        await expect(share).toBeFocused();
        // A toast with no action.
        await show(page, 'Round 2 saved.');
        await page.keyboard.press('F8');
        await expect(share).toBeFocused();
        // A toast with an action, with each modifier held.
        await show(page, 'Round 3 saved.', 'Undo');
        for (const modifier of ['Shift', 'Control', 'Alt', 'Meta']) {
            await page.keyboard.press(`${modifier}+F8`);
            await expect(share, modifier).toBeFocused();
        }
        // Held, the first press moves focus and the repeats move nothing.
        await page.keyboard.down('F8');
        await expect(undo(page)).toBeFocused();
        await page.keyboard.down('F8');
        await page.keyboard.down('F8');
        await page.keyboard.up('F8');
        await expect(undo(page)).toBeFocused();
        // Dismissed, the toast hears F8 no more.
        await page.keyboard.press('Escape');
        await expect(share).toBeFocused();
        await page.keyboard.press('F8');
        await expect(share).toBeFocused();
        expect(await f8Prevented(page)).toEqual([
            false,
            false,
            false,
            false,
            false,
            false,
            true,
            false,
            false,
            false,
        ]);
    });

    test('moves nothing and keeps the default for an F8 that converts text in an input method', async ({
        page,
    }) => {
        await open(page, { body: MANY });
        await noteF8(page);
        await page.locator('#save').focus();
        await page.keyboard.press('Enter');
        const name = page.locator('#name');
        await name.focus();
        // A Japanese input method converts what is being typed on F8, and Safari sends key code 229
        // in place of the composing flag.
        for (const init of [{ isComposing: true }, { keyCode: 229 }]) {
            await name.evaluate((field, given) => {
                field.dispatchEvent(
                    new KeyboardEvent('keydown', {
                        key: 'F8',
                        bubbles: true,
                        cancelable: true,
                        ...given,
                    })
                );
            }, init);
            await expect(name, JSON.stringify(init)).toBeFocused();
        }
        expect(await f8Prevented(page)).toEqual([false, false]);
    });

    test('sends focus back on down the list where the control it came from is gone, and stays in the toast where nothing takes it', async ({
        page,
    }) => {
        await open(page, { body: MANY.replace('<main>', '<main tabindex="-1">') });
        await page.locator('#save').focus();
        await page.keyboard.press('Enter');
        await page.locator('#share').focus();
        await page.keyboard.press('F8');
        await expect(undo(page)).toBeFocused();
        // Share gone, focus goes back to Save, where it was as the message came.
        await page.locator('#share').evaluate((share) => share.remove());
        await page.keyboard.press('F8');
        await expect(page.locator('#save')).toBeFocused();
        await expect(toast(page)).toHaveAttribute('data-shown');
        // Save gone too, it goes to the main content.
        await page.keyboard.press('F8');
        await expect(undo(page)).toBeFocused();
        await page.locator('#save').evaluate((save) => save.remove());
        await page.keyboard.press('F8');
        await expect(page.locator('main')).toBeFocused();
        await expect(toast(page)).toHaveAttribute('data-shown');
    });

    test('leaves focus on the action where nothing on the list takes it', async ({ page }) => {
        await open(page, { body: MANY });
        await page.locator('#save').focus();
        await page.keyboard.press('Enter');
        await page.keyboard.press('F8');
        await expect(undo(page)).toBeFocused();
        // The main content takes no focus here, so with Save gone nothing on the list does.
        await page.locator('#save').evaluate((save) => save.remove());
        await page.keyboard.press('F8');
        await expect(undo(page)).toBeFocused();
        await expect(toast(page)).toHaveAttribute('data-shown');
    });

    test("sends focus back to the control inside a frame of the page's own origin that had it as the message came", async ({
        page,
        browserName,
    }) => {
        await open(page, { body: framed() });
        const inner = page.frameLocator('iframe').locator('#inner');
        await inner.focus();
        await show(page, 'Round 3 saved.', 'Undo');
        // Into the toast past the frame's next button, which counts as coming from nowhere.
        await page.keyboard.press(tabKey(browserName));
        await page.keyboard.press(tabKey(browserName));
        await expect(undo(page)).toBeFocused();
        await page.keyboard.press('F8');
        await expect(page.locator('iframe')).toBeFocused();
        await expect(inner).toBeFocused();
        await expect(toast(page)).toHaveAttribute('data-shown');
    });

    test("reaches the action and hands focus back inside a frame of the page's own origin that the page attaches a toast in", async ({
        page,
    }) => {
        await open(page, { body: TOAST_FRAMED, attach: false });
        await attachInFrame(page);
        const frame = page.frameLocator('iframe');
        const inner = frame.locator('#inner');
        await inner.focus();
        await page.evaluate(() => {
            (window as unknown as { show: Kit['show'] }).show('Round 3 saved.', {
                label: 'Undo',
                onAction: () => undefined,
            });
        });
        const action = frame.getByRole('button', { name: 'Undo' });
        await expect(action).toBeVisible();
        // F8 is pressed in the frame, so the toast hears it in the frame's document.
        await page.keyboard.press('F8');
        await expect(action).toBeFocused();
        // Pressed in the toast, it goes back to the control in the frame, the toast still shown.
        await page.keyboard.press('F8');
        await expect(inner).toBeFocused();
        await page.keyboard.press('F8');
        await expect(action).toBeFocused();
        // A dismiss hands focus back to the control in the frame, not to the frame's body.
        await page.keyboard.press('Escape');
        await expect(frame.locator('.dk-toast-message')).toHaveText('');
        await expect(inner).toBeFocused();
    });

    test('lets the toast that holds focus send it back where a second toast has an action shown', async ({
        page,
    }) => {
        await open(page, {
            // After the first, which the page's script attaches.
            body: `${MANY}${TOAST.replace('dk-toast"', 'dk-toast" id="second"')}`,
        });
        await page.locator('#save').focus();
        await page.keyboard.press('Enter');
        await page.evaluate(async () => {
            const kit = (await import(`${location.origin}/controls.js`)) as {
                attachToast: (element: HTMLElement) => Kit['show'];
            };
            const second = document.querySelector<HTMLElement>('#second');
            if (!second) throw new Error('no second toast');
            kit.attachToast(second)('Player 2 left.', { label: 'Undo', onAction: () => undefined });
        });
        await page.locator('#share').focus();
        await page.keyboard.press('F8');
        await expect(undo(page).first()).toBeFocused();
        await page.locator('#print').focus();
        await page.locator('#second .dk-toast-action').focus();
        await page.keyboard.press('F8');
        await expect(page.locator('#print')).toBeFocused();
        await expect(page.locator('#second')).toHaveAttribute('data-shown');
    });

    test('is named on the action while it is shown, and not after', async ({ page }) => {
        await open(page);
        await expect(page.locator('.dk-toast-action')).not.toHaveAttribute('aria-keyshortcuts');
        await show(page, 'Round 3 saved.', 'Undo');
        await expect(undo(page)).toHaveAttribute('aria-keyshortcuts', 'F8');
        // The next message, with no action, takes the key away with the action.
        await show(page, 'Round 4 saved.');
        await expect(page.locator('.dk-toast-action')).not.toHaveAttribute('aria-keyshortcuts');
        await show(page, 'Round 5 saved.', 'Undo');
        await expect(undo(page)).toHaveAttribute('aria-keyshortcuts', 'F8');
        await closeButton(page).click();
        await expect(page.locator('.dk-toast-action')).not.toHaveAttribute('aria-keyshortcuts');
    });
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

/**
 * The page with a frame of its own origin that holds two buttons and the toast, drawn with the
 * kit's sheet, for the page to attach.
 */
const TOAST_FRAMED = PAGE.replace(TOAST, '').replace(
    '</button>',
    '</button><iframe title="Notes" srcdoc="' +
        `<link rel=stylesheet href=/kit.css><button type=button id=inner>Inside</button>
<button type=button id=next>Next</button>${TOAST}`
            .replaceAll('&', '&amp;')
            .replaceAll('"', '&quot;') +
        '"></iframe>'
);

/** Attaches the toast in the page's frame from the page, once the frame has loaded. */
const attachInFrame = (page: Page): Promise<void> =>
    page.evaluate(async () => {
        const kit = (await import(`${location.origin}/controls.js`)) as {
            attachToast: (element: HTMLElement) => Kit['show'];
        };
        const frame = document.querySelector('iframe');
        const toastIn = () => frame?.contentDocument?.querySelector<HTMLElement>('.dk-toast');
        if (!toastIn() || frame?.contentDocument?.readyState !== 'complete')
            await new Promise((loaded) => frame?.addEventListener('load', loaded, { once: true }));
        const found = toastIn();
        if (!found) throw new Error('no toast in the frame');
        (window as unknown as { show: Kit['show'] }).show = kit.attachToast(found);
    });

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

test("hands focus back on a dismiss inside a frame of the page's own origin that the page attaches a toast in", async ({
    page,
}) => {
    await open(page, { body: TOAST_FRAMED, attach: false });
    await attachInFrame(page);
    const frame = page.frameLocator('iframe');
    const inner = frame.locator('#inner');
    await inner.focus();
    await page.evaluate(() => {
        (window as unknown as { show: Kit['show'] }).show('Round 3 saved.', {
            label: 'Undo',
            onAction: () => undefined,
        });
    });
    // Into the toast by a focus call, so the dismiss alone is tried.
    await frame.getByRole('button', { name: 'Undo' }).focus();
    await page.keyboard.press('Escape');
    await expect(frame.locator('.dk-toast-message')).toHaveText('');
    await expect(inner).toBeFocused();
});

test('leaves focus on the page where a visitor moved it, as the page dismisses a toast it attached inside a frame', async ({
    page,
}) => {
    await open(page, { body: TOAST_FRAMED, attach: false });
    await attachInFrame(page);
    const frame = page.frameLocator('iframe');
    await frame.locator('#inner').focus();
    await page.evaluate(() => {
        const kit = window as unknown as { show: Kit['show']; dismiss: () => void };
        kit.dismiss = kit.show('Round 3 saved.', { label: 'Undo', onAction: () => undefined });
    });
    await frame.getByRole('button', { name: 'Undo' }).focus();
    // The visitor moves on to the page, and the page dismisses the message.
    await page.locator('#save').focus();
    await page.evaluate(() => {
        (window as unknown as { dismiss: () => void }).dismiss();
    });
    await expect(frame.locator('.dk-toast-message')).toHaveText('');
    await expect(page.locator('#save')).toBeFocused();
});

test('hands focus back to the control inside a frame inside a frame that had it as the message came', async ({
    page,
}) => {
    await open(page, { body: framed() });
    // A frame drawn inside the page's frame, holding a button of its own.
    await page.evaluate(async () => {
        const outer = document.querySelector('iframe')?.contentDocument;
        if (!outer) throw new Error('no frame');
        const nested = outer.createElement('iframe');
        nested.title = 'Scores';
        nested.srcdoc = '<button type=button id=deep>Deep</button>';
        const loaded = new Promise((done) => nested.addEventListener('load', done, { once: true }));
        outer.body.append(nested);
        await loaded;
    });
    const deep = page.frameLocator('iframe').frameLocator('iframe').locator('#deep');
    await deep.focus();
    await show(page, 'Round 3 saved.', 'Undo');
    await undo(page).focus();
    await page.keyboard.press('Enter');
    await expect(message(page)).toHaveText('');
    await expect(page.locator('iframe')).toBeFocused();
    await expect(deep).toBeFocused();
});

test('hands focus back inside a frame to a button the page made and moved into the frame', async ({
    page,
}) => {
    await open(page, { body: TOAST_FRAMED, attach: false });
    await attachInFrame(page);
    const frame = page.frameLocator('iframe');
    // Made by the page's document and moved into the frame, so it keeps the page's prototype.
    await page.evaluate(() => {
        const moved = document.createElement('button');
        moved.type = 'button';
        moved.id = 'moved';
        moved.textContent = 'Moved';
        document.querySelector('iframe')?.contentDocument?.body.prepend(moved);
    });
    const moved = frame.locator('#moved');
    await moved.focus();
    await page.evaluate(() => {
        (window as unknown as { show: Kit['show'] }).show('Round 3 saved.', {
            label: 'Undo',
            onAction: () => undefined,
        });
    });
    await frame.getByRole('button', { name: 'Undo' }).focus();
    await page.keyboard.press('Escape');
    await expect(frame.locator('.dk-toast-message')).toHaveText('');
    await expect(moved).toBeFocused();
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
    await expect(page.getByRole('status')).toHaveCount(1);
    await page.evaluate(hear, { line: '[role="status"]' });
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

test('marks the frame with the rows it keeps room for while the toast floats over its body, and not after it leaves', async ({
    page,
}) => {
    const frame = page.locator('.dk-app');
    const frameBody = page.locator('.dk-app-body');
    await open(page, { body: FRAME });
    await expect(frame).not.toHaveAttribute('data-toast-rows');
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    // The frame carries the count the toast does, which the sheet keeps the room by, and the
    // body carries nothing.
    const rows = (await toast(page).getAttribute('data-rows')) ?? '';
    expect(Number(rows)).toBeGreaterThanOrEqual(1);
    await expect(frame).toHaveAttribute('data-toast-rows', rows);
    await expect(frameBody).not.toHaveAttribute('data-toast-rows');
    await expect(toast(page)).not.toHaveAttribute('data-row');
    expect(
        Number.parseFloat(
            (await style(frameBody, 'scroll-padding-bottom'))['scroll-padding-bottom'] ?? '0'
        )
    ).toBeGreaterThan(0);
    // A message that replaces the first keeps the mark, and a dismiss takes it off.
    await show(page, 'Round 4 saved.');
    await expect(frame).toHaveAttribute('data-toast-rows', /^[1-5]$/);
    await closeButton(page).click();
    await expect(frame).not.toHaveAttribute('data-toast-rows');
    expect((await style(frameBody, 'scroll-padding-bottom'))['scroll-padding-bottom']).toBe('auto');
    // Dismissed by what showing it returned, and by its action.
    await show(page, 'Round 5 saved.', 'Undo');
    await expect(frame).toHaveAttribute('data-toast-rows');
    await page.evaluate(() => {
        (window as unknown as { kit: Kit }).kit.last?.();
    });
    await expect(frame).not.toHaveAttribute('data-toast-rows');
    await show(page, 'Round 6 saved.', 'Undo');
    await expect(frame).toHaveAttribute('data-toast-rows');
    await undo(page).click();
    await expect(frame).not.toHaveAttribute('data-toast-rows');
});

test('leaves the frame unmarked while the toast takes its row above the dock', async ({ page }) => {
    const frame = page.locator('.dk-app');
    // A phone on its side, where the body is near its least height and cannot hold the toast.
    await open(page, { body: FULL, width: 844, height: 400 });
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    await expect(toast(page)).toHaveAttribute('data-row', '');
    await expect(frame).not.toHaveAttribute('data-toast-rows');
    // Measured again as the screen changes, it is left so.
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await expect(toast(page)).toHaveAttribute('data-row', '');
    await expect(frame).not.toHaveAttribute('data-toast-rows');
    // Upright again, the body holds the toast and the frame carries its rows.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(frame).toHaveAttribute('data-toast-rows', /^[1-5]$/);
    await expect(toast(page)).not.toHaveAttribute('data-row');
    await closeButton(page).click();
    await expect(frame).not.toHaveAttribute('data-toast-rows');
});

test('marks the frame with no count for a toast it cannot measure, and takes the mark off a frame the toast has left', async ({
    page,
}) => {
    // A toast's place out of sight has no size, so the frame keeps the two rows of a mark with no
    // count.
    await open(page, { body: FRAME, css: '.dk-app-toast[data-away] { display: none; }' });
    await page.locator('.dk-app-toast').evaluate((place) => {
        place.setAttribute('data-away', '');
    });
    await show(page, 'Round 3 saved.', 'Undo');
    const first = page.locator('.dk-app').first();
    await expect(first).toHaveAttribute('data-toast-rows', '');
    await expect(toast(page)).not.toHaveAttribute('data-rows');
    // In sight again, it is measured, and the frame carries its count.
    await page.locator('.dk-app-toast').evaluate((place) => {
        place.removeAttribute('data-away');
    });
    await expect(first).toHaveAttribute('data-toast-rows', /^[1-5]$/);
    // Moved with its place into another frame and measured again, it marks that frame and the one
    // it left keeps no room.
    await page.evaluate(() => {
        const frame = document.createElement('div');
        frame.className = 'dk-app';
        frame.id = 'second';
        const body = document.createElement('main');
        body.className = 'dk-app-body';
        body.innerHTML = '<p>Round 4 so far.</p>';
        const place = document.querySelector('.dk-app-toast');
        if (place) frame.append(body, place);
        document.body.append(frame);
        window.dispatchEvent(new Event('resize'));
    });
    await expect(first).not.toHaveAttribute('data-toast-rows');
    await expect(page.locator('#second')).toHaveAttribute('data-toast-rows', /^[1-5]$/);
    await closeButton(page).click();
    await expect(page.locator('#second')).not.toHaveAttribute('data-toast-rows');
    await expect(first).not.toHaveAttribute('data-toast-rows');
});

/** The room the frame keeps under a floating toast: the last line's margin and the body's scroll padding. */
const roomKept = (page: Page): Promise<[string, string]> =>
    page.evaluate(() => {
        const body = document.querySelector('.dk-app-body');
        const last = document.querySelector('#last');
        if (!body || !last) throw new Error('expected a body and its last line');
        return [getComputedStyle(last).marginBottom, getComputedStyle(body).scrollPaddingBottom];
    });

test("keeps the room for a floating toast through a frame's body the page draws afresh", async ({
    page,
}) => {
    await open(page, { body: FRAME });
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    const kept = await roomKept(page);
    expect(Number.parseFloat(kept[0])).toBeGreaterThan(0);
    expect(Number.parseFloat(kept[1])).toBeGreaterThan(0);
    // A new element in the body's place holding the same lines, as a page that draws a screen
    // afresh leaves it, with nothing of the old element's attributes.
    await page.evaluate(() => {
        const old = document.querySelector('.dk-app-body');
        const fresh = document.createElement('main');
        fresh.className = 'dk-app-body';
        fresh.tabIndex = 0;
        fresh.innerHTML = old?.innerHTML ?? '';
        old?.replaceWith(fresh);
    });
    expect(await roomKept(page)).toEqual(kept);
    await closeButton(page).click();
    expect(await roomKept(page)).toEqual(['0px', 'auto']);
});

test("keeps the room inside a body that is itself the frame, and pads that body for no page's toast", async ({
    page,
}) => {
    // The frame's parts written straight into the body, which carries the frame's class.
    const parts = FRAME.replace(/^<div class="dk-app">/, '').replace(/<\/div>$/, '');
    expect(parts).not.toBe(FRAME);
    await open(page, { body: parts });
    await page.evaluate(() => {
        document.body.classList.add('dk-app');
    });
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    await expect(page.locator('body')).toHaveCSS('padding-bottom', '0px');
    const [margin, padding] = await roomKept(page);
    expect(Number.parseFloat(margin)).toBeGreaterThan(0);
    expect(Number.parseFloat(padding)).toBeGreaterThan(0);
    await expect(page.locator('body')).toHaveAttribute('data-toast-rows', /^[1-5]$/);
});

test("gives a toast its row above the dock in a frame whose body is not the frame's own child", async ({
    page,
}) => {
    // The body inside a form, where the sheet neither floats the toast nor keeps room for it.
    const formed = FRAME.replace(
        '<main class="dk-app-body"',
        '<form><main class="dk-app-body"'
    ).replace('</main>', '</main></form>');
    expect(formed).toContain('</main></form>');
    await open(page, { body: formed });
    const dock = page.locator('.dk-app-dock');
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    await expect(toast(page)).toHaveAttribute('data-row', '');
    await expect(page.locator('.dk-app')).not.toHaveAttribute('data-toast-rows');
    // The toast sits in its row straight above the dock, and the dock at the screen's foot.
    const under = await box(dock, 'the dock');
    expect(bottom(under)).toBeLessThanOrEqual(await page.evaluate(() => window.innerHeight));
    expect(bottom(await box(toast(page), 'the toast'))).toBeLessThanOrEqual(under.y + 1);
    expect(under.y - bottom(await box(toast(page), 'the toast'))).toBeLessThan(under.height);
    await closeButton(page).click();
    await expect(toast(page)).not.toHaveAttribute('data-row');
    await expect(page.locator('.dk-app')).not.toHaveAttribute('data-toast-rows');
});

test("takes a page's own mark off the frame as a toast the page drew shown is closed", async ({
    page,
}) => {
    // The toast written shown in the markup, with the frame marked by the page, then attached.
    const drawn = FRAME.replace('<div class="dk-app">', '<div class="dk-app" data-toast-rows="2">')
        .replace('class="dk-toast"', 'class="dk-toast" data-shown="" data-rows="2"')
        .replace(/ hidden=""/g, '');
    expect(drawn).toContain('data-shown');
    expect(drawn).not.toContain('hidden=""');
    await open(page, { body: drawn });
    const frame = page.locator('.dk-app');
    await expect(frame).toHaveAttribute('data-toast-rows', '2');
    expect(Number.parseFloat((await roomKept(page))[0])).toBeGreaterThan(0);
    await closeButton(page).click();
    await expect(toast(page)).not.toHaveAttribute('data-shown');
    await expect(frame).not.toHaveAttribute('data-toast-rows');
    expect(await roomKept(page)).toEqual(['0px', 'auto']);
});

/** A picture of a frame with a body and a dock, as a screen that shows another screen holds one. */
const PICTURED_FRAME =
    '<div class="dk-picture" inert><div class="dk-app"><main class="dk-app-body"><p>A round.</p></main>' +
    '<section class="dk-app-dock" aria-label="Pictured actions"><button type="button" class="dk-button">Save</button></section></div></div>';

test('floats a toast in a frame with no body of its own, whatever a picture of a frame inside it holds', async ({
    page,
}) => {
    // The frame's lines in a plain element, with a picture of a frame among them.
    const bare = FRAME.replace(
        '<main class="dk-app-body" tabindex="0">',
        `<main tabindex="0">${PICTURED_FRAME}`
    );
    expect(bare).toContain(PICTURED_FRAME);
    await open(page, { body: bare });
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    await expect(toast(page)).not.toHaveAttribute('data-row');
});

test("keeps the frame's own dock in place where its body holds a picture of a frame with a dock", async ({
    page,
    browserName,
}) => {
    test.skip(browserName !== 'chromium', 'the text size is set through Chromium');
    // At twice the text size the body cannot hold the toast, which takes its row above the dock,
    // and the page scrolls by as much as the frame's own dock moved, not the pictured one.
    await open(page, {
        body: FULL.replace(
            '<main class="dk-app-body" tabindex="0">',
            `<main class="dk-app-body" tabindex="0">${PICTURED_FRAME}`
        ),
        height: 844,
    });
    await textSize(page, 2);
    const save = page.locator('#save');
    const before = await box(save, "the dock's button");
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    await expect(toast(page)).toHaveAttribute('data-row', '');
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    expect(await box(save, "the dock's button")).toEqual(before);
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

/**
 * A frame of the page's own origin, with a border and padding, the height given and set down by
 * its own height, holding the content given, with the style given added.
 */
const frameOf = (height: number, content: string, style = ''): string =>
    `<iframe title="Notes" style="display: block; height: ${String(height)}px; ` +
    `margin-top: ${String(height)}px; border: 5px solid; padding: 12px; ${style}" ` +
    `srcdoc="<body style='margin: 0'>${content}"></iframe>`;

/** A frame from `frameOf`, holding a button the depth given, with room under it. */
const padded = (height: number, depth: number, style = ''): string =>
    frameOf(
        height,
        `<div style='height: ${String(depth)}px'></div>` +
            "<button type=button id=low>Low</button><div style='height: 600px'></div>",
        style
    );

const low = (page: Page): Locator => page.frameLocator('iframe').locator('#low');

/** Where the foot of the screen is, or of the body of the page's app frame. */
const foot = (page: Page): Promise<number> =>
    page.evaluate(
        () =>
            document.querySelector('.dk-app-body')?.getBoundingClientRect().bottom ??
            window.innerHeight
    );

/** Scrolls the page, or the body of its app frame, so the element given ends where given. */
const scrollEnd = async (page: Page, locator: Locator, at: number): Promise<void> => {
    const by = bottom(await box(locator)) - at;
    await page.evaluate((y) => {
        (document.querySelector('.dk-app-body') ?? window).scrollBy(0, y);
    }, by);
};

/** Focuses the element given without scrolling. */
const focusStill = async (locator: Locator): Promise<void> => {
    await locator.evaluate((element) => {
        (element as HTMLElement).focus({ preventScroll: true });
    });
    await expect(locator).toBeFocused();
};

/** Where the toast rests once shown, found by showing a message and dismissing it. */
const resting = async (
    page: Page
): Promise<{ x: number; y: number; width: number; height: number }> => {
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    const drawn = await box(toast(page), 'the toast');
    await page.evaluate(() => (window as unknown as { kit: Kit }).kit.last?.());
    await expect(message(page)).toHaveText('');
    return drawn;
};

/** How far the page, or the body of its app frame, and the frame's own document are scrolled. */
const scrolls = (page: Page): Promise<readonly number[]> =>
    page.evaluate(() => [
        document.querySelector('.dk-app-body')?.scrollTop ?? window.scrollY,
        document.querySelector('iframe')?.contentWindow?.scrollY ?? 0,
    ]);

/** Shows a message, waits for the toast to rest and finds the button's end clear of it. */
const showClear = async (page: Page, control: Locator): Promise<void> => {
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    expect(bottom(await box(control, 'the control'))).toBeLessThanOrEqual(
        (await box(toast(page), 'the toast')).y + 1
    );
};

/** Shows a message, waits for the toast to rest and finds nothing scrolled. */
const showStill = async (page: Page): Promise<void> => {
    const before = await scrolls(page);
    await show(page, 'Round 3 saved.', 'Undo');
    await settled(page);
    expect(await scrolls(page)).toEqual(before);
};

for (const [where, body] of [
    ['on a page', PAGE.replace('</button>', `</button>${padded(1200, 1100)}`)],
    ["in an app's frame", FRAME.replace('<p id="last">', `${padded(1200, 1100)}<p id="last">`)],
] as const)
    test(`keeps the control inside a tall frame of the page's own origin clear of the toast as it shows, ${where}`, async ({
        page,
    }) => {
        await open(page, { body });
        await expect(low(page)).toBeAttached();
        // The frame's button at the foot of the screen or of the frame's body, where the toast
        // is about to come.
        await scrollEnd(page, low(page), (await foot(page)) - 4);
        await focusStill(low(page));
        await showClear(page, low(page));
    });

for (const [how, style] of [
    ['', ''],
    [', in a frame drawn smaller', 'transform: scale(0.6); transform-origin: 0 0'],
] as const)
    test(`keeps a control inside a frame clear of the toast where the frame's padding puts it under the toast's edge${how}`, async ({
        page,
    }) => {
        await open(page, {
            body: PAGE.replace('</button>', `</button>${padded(1200, 1100, style)}`),
        });
        await expect(low(page)).toBeAttached();
        const { y: top } = await resting(page);
        // The button reaches a few pixels under where the toast rests, less than the frame's
        // padding, so a measure that leaves the padding out finds it clear.
        await scrollEnd(page, low(page), top + 6);
        await focusStill(low(page));
        await showClear(page, low(page));
    });

test('keeps a control inside a frame drawn wider than laid out clear of the toast', async ({
    page,
}) => {
    // Drawn three times as wide as laid out and as tall, so the frame's padding puts its button
    // under the toast, where a scale taken from its height alone would put it beside the toast.
    await open(page, {
        body: PAGE.replace(
            '<p>Round 15 ',
            `${padded(100, 0, 'margin-top: 0; width: 300px; padding-left: 150px; transform: scale(3, 1); transform-origin: 0 0')}<p>Round 15 `
        ),
        width: 1280,
    });
    await expect(low(page)).toBeAttached();
    const card = await resting(page);
    await scrollEnd(page, low(page), card.y + 20);
    expect((await box(low(page), 'the button')).x).toBeGreaterThan(card.x);
    await focusStill(low(page));
    await showClear(page, low(page));
});

test('leaves the page and the frame where they are when the control inside a frame is taller than the room above the toast', async ({
    page,
}) => {
    await open(page, {
        body: PAGE.replace(
            '<p>Round 15 ',
            `${frameOf(80, "<div id=low tabindex=0 style='height: 1000px'></div><div style='height: 20px'></div>")}<p>Round 15 `
        ),
    });
    await expect(low(page)).toBeAttached();
    // The frame shows the control's last 30 pixels, at the foot of the screen, under the toast.
    await page.locator('iframe').evaluate((frame) => {
        (frame as HTMLIFrameElement).contentWindow!.scrollTo(0, 970);
    });
    await scrollEnd(page, page.locator('iframe'), (await foot(page)) - 4);
    await focusStill(low(page));
    await showStill(page);
});

test("leaves the page and the frame where they are when the control inside a frame sits behind the frame's scrollbar", async ({
    page,
    browserName,
}) => {
    test.skip(
        browserName !== 'webkit',
        "Chromium and Firefox draw a frame's scrollbars over its document here, taking no room"
    );
    await open(page, {
        body: PAGE.replace(
            '<p>Round 15 ',
            `${frameOf(
                200,
                '<style>::-webkit-scrollbar { width: 15px; height: 15px }</style>' +
                    "<div style='height: 154px'></div>" +
                    "<button type=button id=low style='display: block; height: 10px; padding: 0'></button>" +
                    "<div style='width: 900px; height: 600px'></div>"
            )}<p>Round 15 `
        ),
    });
    await expect(low(page)).toBeAttached();
    // The button lies in the strip the frame's lower scrollbar covers, at the foot of the screen.
    await scrollEnd(page, page.locator('iframe'), (await foot(page)) - 4);
    await focusStill(low(page));
    await showStill(page);
});

test('keeps a control inside a frame scaled by zoom clear of the toast, as each engine lays the frame out', async ({
    page,
    browserName,
}) => {
    await open(page, {
        body: PAGE.replace('</button>', `</button>${padded(1200, 1100, 'zoom: 0.6')}`),
    });
    await expect(low(page)).toBeAttached();
    const { y: top } = await resting(page);
    await scrollEnd(page, low(page), top + 6);
    await focusStill(low(page));
    if (browserName === 'webkit') {
        // WebKit 27.2 lays the document of a frame scaled by zoom out larger than it draws it, so
        // the button sits past what the frame shows, and the toast leaves the page and the frame
        // be.
        expect(
            await low(page).evaluate((element) => element.getBoundingClientRect().top)
        ).toBeGreaterThan(1100 / 0.6 - 2);
        await showStill(page);
    } else await showClear(page, low(page));
});

test('keeps a control on the page clear of the toast that covers it by less than the rise it enters on', async ({
    page,
}) => {
    await open(page, {
        body: PAGE.replace(
            '<p>Round 15 ',
            '<p><a href="#more" id="foot">More rounds</a></p><p>Round 15 '
        ),
    });
    const link = page.locator('#foot');
    const { y: top } = await resting(page);
    await scrollEnd(page, link, top + 4);
    await focusStill(link);
    await showClear(page, link);
});

test('leaves the page and the frame where they are when the control inside a frame is clear of the toast, though the frame is not', async ({
    page,
}) => {
    await open(page, { body: PAGE.replace('</button>', `</button>${padded(400, 0)}`) });
    // The frame ends at the foot of the screen, under the toast, with its button at its top.
    await scrollEnd(page, page.locator('iframe'), await foot(page));
    await focusStill(low(page));
    await showStill(page);
});

test('leaves the page and the frame where they are when the frame has scrolled its control out of sight above the toast', async ({
    page,
}) => {
    await open(page, { body: PAGE.replace('</button>', `</button>${padded(200, 600)}`) });
    const { y: top } = await resting(page);
    // The frame sits above the toast, and the button it holds, below what the frame shows, would
    // sit under the toast were the frame tall enough to show it.
    await scrollEnd(page, low(page), top + 40);
    expect(bottom(await box(page.locator('iframe')))).toBeLessThan(top);
    await focusStill(low(page));
    await showStill(page);
});

for (const [where, side] of [
    ['on the page', '<p><a href="#more" id="side">More rounds</a></p>'],
    ['inside a frame', padded(100, 0, 'width: 120px; margin-top: 0')],
] as const)
    test(`leaves the page where it is when a control ${where} sits beside a toast narrower than the screen`, async ({
        page,
    }) => {
        await open(page, {
            body: PAGE.replace('<p>Round 15 ', `${side}<p>Round 15 `),
            width: 1280,
        });
        const control = where === 'on the page' ? page.locator('#side') : low(page);
        await expect(control).toBeAttached();
        const card = await resting(page);
        // The control level with the toast, at its side.
        await scrollEnd(page, control, card.y + 34);
        const drawn = await box(control, 'the control');
        expect(drawn.x + drawn.width).toBeLessThan(card.x);
        await focusStill(control);
        await showStill(page);
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

// The root size a page doubles in its own sheet reaches every engine, where the browser's setting
// reaches Chromium alone, and it is where Safari draws a rem on the root itself from 16px.
for (const [size, css] of [
    ['', ''],
    [' that doubles its root size', 'html { font-size: 200%; }'],
] as const) {
    for (const width of [390, 320]) {
        test(`keeps what the keyboard reaches, and the end of the page, clear of the toast on a page ${String(width)}px wide${size}`, async ({
            page,
            browserName,
        }) => {
            await open(page, {
                width,
                css,
                body: PAGE.replace(
                    '<p id="last">',
                    '<p><a href="#earlier" id="above">Earlier rounds</a></p>' +
                        '<p><a href="#more" id="foot">More rounds</a></p><p id="last">'
                ),
            });
            await show(page, 'Round 3 saved.', 'Undo');
            await settled(page);
            const card = await box(toast(page), 'the toast');
            // The room the page keeps is the toast's own height and the step under it, or more.
            const kept = await page.evaluate(() =>
                parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom)
            );
            expect(kept).toBeGreaterThanOrEqual(
                (await page.evaluate(() => window.innerHeight)) - card.y - 1
            );
            // The link scrolled to the foot of the screen, under the toast, then reached by the
            // keyboard.
            await page.locator('#foot').evaluate((element) => {
                window.scrollBy(0, element.getBoundingClientRect().bottom - window.innerHeight);
            });
            expect(bottom(await box(page.locator('#foot'), 'the link'))).toBeGreaterThan(card.y);
            await page.locator('#above').evaluate((element) => {
                element.focus({ preventScroll: true });
            });
            await page.keyboard.press(tabKey(browserName));
            await expect(page.locator('#foot')).toBeFocused();
            expect(bottom(await box(page.locator('#foot'), 'the link'))).toBeLessThanOrEqual(
                card.y
            );
            await page.evaluate(() => {
                window.scrollTo(0, document.documentElement.scrollHeight);
            });
            expect(bottom(await box(page.locator('#last'), 'the last line'))).toBeLessThanOrEqual(
                card.y
            );
        });
    }
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

test('leaves the page where it is when a toast inside a frame shows with focus on a control of the page', async ({
    page,
}) => {
    // The frame stands to the right, as tall as the screen, so its toast rests at its foot, and the
    // page's control sits to the left at the screen's foot, partly out of sight, where it would meet
    // the toast were it measured in the frame's view.
    await open(page, {
        width: 800,
        height: 700,
        attach: false,
        body:
            '<button type="button" id="low" style="position: absolute; inset-block-start: 660px; inset-inline-start: 10px; block-size: 60px">Low</button>' +
            '<div style="block-size: 2000px"></div>' +
            '<iframe title="Notes" style="position: absolute; inset-block-start: 0; inset-inline-start: 400px; inline-size: 380px; block-size: 700px; border: 0" srcdoc="' +
            `<link rel=stylesheet href=/kit.css>${TOAST}`
                .replaceAll('&', '&amp;')
                .replaceAll('"', '&quot;') +
            '"></iframe>',
    });
    await attachInFrame(page);
    await page.evaluate(() => {
        document.querySelector<HTMLElement>('#low')?.focus({ preventScroll: true });
    });
    const before = await page.evaluate(() => scrollY);
    await page.evaluate(() => {
        (window as unknown as { show: Kit['show'] }).show('Round 3 saved.', {
            label: 'Undo',
            onAction: () => undefined,
        });
    });
    await expect(page.frameLocator('iframe').locator('.dk-toast-message')).toHaveText(
        'Round 3 saved.'
    );
    await frames(page, 3);
    expect(await page.evaluate(() => scrollY)).toBe(before);
});

test('sends focus to the main content in the shadow root a toast inside a frame sits in, where nothing nearer takes it', async ({
    page,
}) => {
    await open(page, {
        attach: false,
        body:
            '<main><h1>Scores</h1></main><iframe title="Notes" srcdoc="' +
            '<link rel=stylesheet href=/kit.css><div id=host></div>' +
            '"></iframe>',
    });
    await page.evaluate(async (markup) => {
        const kit = (await import(`${location.origin}/controls.js`)) as {
            attachToast: (element: HTMLElement) => Kit['show'];
        };
        const frame = document.querySelector('iframe');
        if (
            frame?.contentDocument?.readyState !== 'complete' ||
            !frame.contentDocument.querySelector('#host')
        )
            await new Promise((loaded) => frame?.addEventListener('load', loaded, { once: true }));
        const host = frame?.contentDocument?.querySelector('#host');
        if (!host) throw new Error('no host in the frame');
        const root = host.attachShadow({ mode: 'open' });
        root.innerHTML = `<main id="shadow-main" tabindex="-1"><p>Ana dealt.</p></main>${markup}`;
        const toastIn = root.querySelector<HTMLElement>('.dk-toast');
        if (!toastIn) throw new Error('no toast in the shadow root');
        (window as unknown as { show: Kit['show'] }).show = kit.attachToast(toastIn);
    }, TOAST);
    // Shown with nothing focused, so the toast hands focus to its home as it leaves.
    await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
        (window as unknown as { show: Kit['show'] }).show('Round 3 saved.', {
            label: 'Undo',
            onAction: () => undefined,
        });
    });
    const frame = page.frameLocator('iframe');
    await frame.getByRole('button', { name: 'Undo' }).focus();
    await page.keyboard.press('Escape');
    await expect(frame.locator('.dk-toast-message')).toHaveText('');
    await expect(frame.locator('#shadow-main')).toBeFocused();
});

test('lands a focus request asked as the toast hands focus back to a frame whose control has gone', async ({
    page,
}) => {
    await open(page, { body: framed() });
    const inner = page.frameLocator('iframe').locator('#inner');
    await inner.focus();
    await show(page, 'Round 3 saved.', 'Undo');
    await undo(page).focus();
    await inner.evaluate((button) => button.remove());
    // The page asks for Save and dismisses the message in one task, and the toast hands focus back
    // to the frame, whose control has gone, so the frame's body has focus there.
    await page.evaluate(async () => {
        const { moveFocus } = (await import(`${location.origin}/controls.js`)) as {
            moveFocus: (target: string) => () => void;
        };
        moveFocus('save');
        (window as unknown as { kit: Kit }).kit.last?.();
    });
    await expect(message(page)).toHaveText('');
    await expect(page.locator('#save')).toBeFocused();
});
