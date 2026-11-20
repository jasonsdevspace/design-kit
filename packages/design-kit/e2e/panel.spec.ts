import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

import { servePage, tabKey } from './page.js';

/*
 * A panel a button opens, attached by its button: the panel starting as the button says, the
 * button opening and closing it by pointer and by keyboard, the corner Close and Escape closing it,
 * the set returned opening and closing it from the page's code, the detach letting the button go,
 * and a button attached twice returning the same. However the panel closes, focus goes to its
 * button where focus is in the panel, or where nothing has focus and the visitor's last place, the
 * last focus that moved or their last press, was in it, and stays anywhere else, as record 19 has
 * it. Every press is a real one, since Safari's way of focusing what a pointer presses is what the
 * rule is built around, and WebKit, which the config runs this spec in, does it as Safari does.
 * Where focus is meant to stay, a test waits two frames first, so a late move of focus would show.
 */

const CLOSE = `<div class="dk-close"><button type="button" class="dk-button dk-button-text dk-button-quiet"><span aria-hidden="true">×</span><span class="dk-visually-hidden">Close round tips</span></button></div>`;

const TIPS = `<div class="dk-panel" id="round-tips" hidden><h2 class="dk-panel-title">Round tips</h2>${CLOSE}<p><a href="#deal" id="deal">How to deal</a></p></div>`;

// The main takes focus, as a skip link's target does, so a press on what takes none lands on it
// in Safari, and the footer after it is a place a press leaves focus on nothing.
const BODY = `<main class="dk-page" tabindex="-1"><h1>Round 3</h1>
<p><button type="button" class="dk-button" id="tips-button" aria-expanded="false" aria-controls="round-tips">Tips</button>
<button type="button" class="dk-button" id="rules-button" aria-expanded="true" aria-controls="rules">Rules</button>
<button type="button" class="dk-button" id="tips-again" aria-expanded="false" aria-controls="round-tips">More tips</button>
<button type="button" class="dk-button" id="notes-button" aria-expanded="true" aria-controls="notes">Notes</button></p>
${TIPS}
<div class="dk-panel" id="rules"><h2 class="dk-panel-title">Rules</h2><p>The lowest score wins.</p></div>
<div class="dk-panel" id="notes" hidden><h2 class="dk-panel-title">Notes</h2><p>Deal from the left.</p></div>
<p><a href="#after" id="after-panels">After the panels</a> <button type="button" id="no-panel">Nothing</button></p>
</main>
<footer><p id="outside">Scores stay on this device.</p></footer>`;

const ATTACH = `import { attachPanel } from './controls.js';
// Counts the click listeners that come off the page, to see the panels' go with the last button.
window.listenersOff = 0;
const removeListener = document.removeEventListener.bind(document);
document.removeEventListener = (...args) => {
    if (args[0] === 'click') window.listenersOff += 1;
    removeListener(...args);
};
// Counts focus on the tips' button, so focus handed to it and taken away again still shows.
window.openerFocus = 0;
document.querySelector('#tips-button').addEventListener('focus', () => {
    window.openerFocus += 1;
});
const tips = attachPanel(document.querySelector('#tips-button'));
window.panels = [tips];
for (const id of ['#rules-button', '#tips-again', '#notes-button'])
    window.panels.push(attachPanel(document.querySelector(id)));
// A page's own handler that stops a click inside the panel, counted to show it ran.
window.stopped = 0;
const stop = (event) => {
    window.stopped += 1;
    event.stopPropagation();
};
document.querySelector('#round-tips').addEventListener('click', stop);
window.setTips = tips.set;
window.redrawPanel = () => {
    const panel = document.querySelector('#round-tips');
    const drawn = panel.cloneNode(true);
    drawn.addEventListener('click', stop);
    panel.replaceWith(drawn);
};
window.sameTips = attachPanel(document.querySelector('#tips-button')) === tips;
// Every press and focus the page hears, first of all, with what it landed on and whether the
// panel was shown, so a test whose press misses says where it went. It reads no layout, since a
// layout forced in the middle of a press could settle the very race it is there to catch.
window.presses = [];
const nameOf = (node) => node.id || node.localName || node.nodeName;
for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click', 'focusin'])
    window.addEventListener(
        type,
        (event) => {
            const panel = document.querySelector('#round-tips');
            window.presses.push(
                type + ' on ' + nameOf(event.target) + (event.isTrusted ? '' : ' (script)') +
                    ('clientX' in event ? ' at ' + Math.round(event.clientX) + ',' + Math.round(event.clientY) : '') +
                    ', panel ' + (panel ? (panel.hidden ? 'hidden' : 'shown') : 'gone')
            );
        },
        true
    );
window.attach = (selector) => attachPanel(document.querySelector(selector));
// A button of the page's own, with no tabindex, as a page writes one.
window.addButton = (where, id, text) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = id;
    button.textContent = text;
    document.querySelector(where).append(button);
    return button;
};
try {
    attachPanel(document.querySelector('#no-panel'));
} catch (error) {
    window.refused = error.message;
}
window.ready = true;`;

/** What the page's script puts on the window for the tests to reach. */
type Kit = {
    setTips: (open: boolean) => void;
    panels: { set: (open: boolean) => void; detach: () => void }[];
    attach: (selector: string) => { set: (open: boolean) => void; detach: () => void };
    addButton: (where: string, id: string, text: string) => HTMLButtonElement;
    openerFocus: number;
    presses?: string[];
};

// The first press of the tips' button once missed in WebKit under the load of every test at once,
// so a test that fails keeps the presses its page heard, and where the button sits by then, in its
// report.
test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === testInfo.expectedStatus) return;
    const heard = await page
        .evaluate(() => {
            const presses = (window as unknown as Kit).presses ?? [];
            const box = document.querySelector('#tips-button')?.getBoundingClientRect();
            const where = box
                ? `the tips' button at ${Math.round(box.x)},${Math.round(box.y)}, ${Math.round(box.width)} by ${Math.round(box.height)}`
                : "no tips' button";
            return [...(presses.length > 0 ? presses : ['no presses heard']), where].join('\n');
        })
        .catch(() => 'the page was gone');
    await testInfo.attach('presses', { body: heard, contentType: 'text/plain' });
});

const open = async (page: Page): Promise<void> => {
    await page.setViewportSize({ width: 390, height: 700 });
    await servePage(page, { title: 'Round 3', body: BODY, script: ATTACH });
    await page.waitForFunction(() => 'ready' in window);
};

const button = (page: Page) => page.locator('#tips-button');
const panel = (page: Page) => page.locator('#round-tips');
const close = (page: Page) => page.getByRole('button', { name: 'Close round tips' });

/** Presses Tab, or Shift and Tab, the times given, with the key WebKit on a Mac needs for links. */
const tab = async (page: Page, browserName: string, times: number, back = false) => {
    const key = `${back ? 'Shift+' : ''}${tabKey(browserName)}`;
    for (let stop = 0; stop < times; stop += 1) await page.keyboard.press(key);
};

/** Closes the tips from the page's code, in a task of its own, as a timer or a save would. */
const closeTips = (page: Page) =>
    page.evaluate(() => {
        (window as unknown as Kit).setTips(false);
    });

/** Waits two frames, long enough for focus moved a frame after the close to show. */
const twoFrames = (page: Page) =>
    page.evaluate(
        () =>
            new Promise<void>((done) => {
                requestAnimationFrame(() => requestAnimationFrame(() => done()));
            })
    );

const focusOnNothing = (page: Page) =>
    page.evaluate(() => document.activeElement === document.body);

const focusInTips = (page: Page) =>
    page.evaluate(() => !!document.querySelector('#round-tips')?.contains(document.activeElement));

const openerFocus = (page: Page) => page.evaluate(() => (window as unknown as Kit).openerFocus);

/** Opens the tips by a press of their button and Tabs to the link in them. */
const tabIntoTips = async (page: Page, browserName: string) => {
    await button(page).click();
    // Past the three buttons beside it and the Close, the link is the fifth stop.
    await tab(page, browserName, 5);
    await expect(page.locator('#deal')).toBeFocused();
};

test('starts each panel as its button says, open or closed, whatever the markup says', async ({
    page,
}) => {
    await open(page);
    await expect(panel(page)).toBeHidden();
    await expect(page.locator('#rules')).toBeVisible();
    // The markup hides the notes, and their button says they are open.
    await expect(page.locator('#notes')).toBeVisible();
});

test('refuses a button that names no panel, saying what it needs', async ({ page }) => {
    await open(page);
    expect(await page.evaluate(() => (window as unknown as { refused?: string }).refused)).toBe(
        "a panel's button needs aria-controls"
    );
});

test('passes an accessibility audit with the panel open and closed', async ({ page }) => {
    await open(page);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await button(page).click();
    await expect(panel(page)).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test.describe('the Close', () => {
    test('opens and closes the panel by its button, and closes it by its Close, by pointer', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await expect(panel(page)).toBeVisible();
        await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
        await close(page).click();
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(button(page)).toBeFocused();
        await button(page).click();
        await button(page).click();
        await expect(panel(page)).toBeHidden();
    });

    test('closes the panel by its Close by keyboard, with focus back on its button', async ({
        page,
        browserName,
    }) => {
        await open(page);
        await button(page).click();
        await expect(panel(page)).toBeVisible();
        // The Close is the next stop after the button that opened the panel and the three after it.
        await tab(page, browserName, 4);
        await expect(close(page)).toBeFocused();
        await page.keyboard.press('Space');
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
        await expect(button(page)).toHaveAttribute('aria-expanded', 'false');
    });

    test('takes focus on the Close while a pointer holds it down, then hands it to the button', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        const where = await close(page).boundingBox();
        if (!where) throw new Error('the Close is drawn');
        await page.mouse.move(where.x + where.width / 2, where.y + where.height / 2);
        await page.mouse.down();
        await expect(close(page)).toBeFocused();
        await page.mouse.up();
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
    });

    test('keeps every button that names the panel in step, and hands focus back to the one that opened it', async ({
        page,
    }) => {
        await open(page);
        await page.locator('#tips-again').click();
        await expect(panel(page)).toBeVisible();
        await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
        await expect(page.locator('#tips-again')).toHaveAttribute('aria-expanded', 'true');
        await close(page).click();
        await expect(page.locator('#tips-again')).toBeFocused();
        await expect(button(page)).toHaveAttribute('aria-expanded', 'false');
    });

    test("closes a panel drawn again by its Close, past a page's handler that stops the press", async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            (window as unknown as { redrawPanel: () => void }).redrawPanel();
        });
        await close(page).click();
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
        expect(await page.evaluate(() => (window as unknown as { stopped: number }).stopped)).toBe(
            1
        );
    });

    test('hands focus back when the Close is pressed after a press outside the panel', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await page.locator('#outside').click();
        await close(page).click();
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
    });

    test("hands focus back when the page's script clicks the Close with focus in the panel", async ({
        page,
        browserName,
    }) => {
        await open(page);
        await tabIntoTips(page, browserName);
        await page.evaluate(() => {
            document.querySelector<HTMLButtonElement>('#round-tips .dk-close button')?.click();
        });
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
    });

    test("leaves focus where it is when the page's script clicks the Close", async ({
        page,
        browserName,
    }) => {
        await open(page);
        await button(page).click();
        await tab(page, browserName, 6);
        await expect(page.locator('#after-panels')).toBeFocused();
        await page.evaluate(() => {
            document.querySelector<HTMLButtonElement>('#round-tips .dk-close button')?.click();
        });
        await expect(panel(page)).toBeHidden();
        await twoFrames(page);
        await expect(page.locator('#after-panels')).toBeFocused();
    });

    test("leaves focus on nothing when the page's script clicks the Close after a press outside", async ({
        page,
        browserName,
    }) => {
        await open(page);
        await tabIntoTips(page, browserName);
        // A script's click is the page's, not the visitor's, so the press outside stays their last.
        await page.locator('#outside').click();
        await page.evaluate(() => {
            document.querySelector<HTMLButtonElement>('#round-tips .dk-close button')?.click();
        });
        await expect(panel(page)).toBeHidden();
        await twoFrames(page);
        expect(await focusOnNothing(page)).toBe(true);
    });

    test.describe('on a touch screen', () => {
        test.use({ hasTouch: true });

        test('hands focus back when the Close is tapped', async ({ page, browserName }) => {
            test.skip(browserName !== 'webkit', "a tap is tested where Safari's way is, in WebKit");
            await open(page);
            await button(page).tap();
            await expect(panel(page)).toBeVisible();
            await close(page).tap();
            await expect(panel(page)).toBeHidden();
            await expect(button(page)).toBeFocused();
        });
    });
});

test.describe("the page's code", () => {
    test("opens and closes the panel from the page's code, and returns the same for a button attached twice", async ({
        page,
    }) => {
        await open(page);
        expect(
            await page.evaluate(() => (window as unknown as { sameTips: boolean }).sameTips)
        ).toBe(true);
        await page.evaluate(() => {
            (window as unknown as Kit).setTips(true);
        });
        await expect(panel(page)).toBeVisible();
        await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
        await button(page).click();
        await expect(panel(page)).toBeHidden();
    });

    test('keeps focus on the button when its own press closes the panel', async ({ page }) => {
        await open(page);
        await button(page).click();
        await expect(panel(page)).toBeVisible();
        await button(page).click();
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
    });

    test('hands focus back when the page closes the panel with focus in it', async ({
        page,
        browserName,
    }) => {
        await open(page);
        await tabIntoTips(page, browserName);
        await closeTips(page);
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
    });

    test('leaves focus where the keyboard took it when the page closes the panel', async ({
        page,
        browserName,
    }) => {
        await open(page);
        await tabIntoTips(page, browserName);
        await tab(page, browserName, 1);
        await expect(page.locator('#after-panels')).toBeFocused();
        await closeTips(page);
        await expect(panel(page)).toBeHidden();
        await twoFrames(page);
        await expect(page.locator('#after-panels')).toBeFocused();
        expect(await openerFocus(page)).toBe(1);
    });

    test("hands focus back when the page's code drops focus from the panel and then closes it", async ({
        page,
        browserName,
    }) => {
        await open(page);
        await tabIntoTips(page, browserName);
        await page.evaluate(() => {
            (document.activeElement as HTMLElement | null)?.blur();
        });
        await closeTips(page);
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
    });

    test('leaves focus on nothing when the page closes a panel the visitor never went into', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        // Nothing has focus, as while a screen reader reads the panel by swipe, which moves none.
        await page.evaluate(() => {
            (document.activeElement as HTMLElement | null)?.blur();
        });
        await closeTips(page);
        await expect(panel(page)).toBeHidden();
        await twoFrames(page);
        expect(await focusOnNothing(page)).toBe(true);
    });

    test('leaves focus on nothing when the visitor pressed outside the panel before the page closes it', async ({
        page,
        browserName,
    }) => {
        await open(page);
        await tabIntoTips(page, browserName);
        await page.locator('#outside').click();
        expect(await focusOnNothing(page)).toBe(true);
        await closeTips(page);
        await expect(panel(page)).toBeHidden();
        await twoFrames(page);
        expect(await focusOnNothing(page)).toBe(true);
    });

    test('leaves focus on nothing when what the keyboard took it to outside the panel is drawn away', async ({
        page,
        browserName,
    }) => {
        await open(page);
        await tabIntoTips(page, browserName);
        await tab(page, browserName, 1);
        await expect(page.locator('#after-panels')).toBeFocused();
        await page.evaluate(() => document.querySelector('#after-panels')?.remove());
        await closeTips(page);
        await expect(panel(page)).toBeHidden();
        await twoFrames(page);
        expect(await focusOnNothing(page)).toBe(true);
    });

    test('hands focus back when the visitor pressed outside and then went back into the panel', async ({
        page,
        browserName,
    }) => {
        await open(page);
        await button(page).click();
        // A press on the rules' text puts focus on that panel, the one after the tips.
        await page.getByText('The lowest score wins.').click();
        await expect(page.locator('#rules')).toBeFocused();
        await tab(page, browserName, 1, true);
        await expect(page.locator('#deal')).toBeFocused();
        await closeTips(page);
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
    });

    test("hands focus back when the page closes the panel after a press on the panel's text", async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await panel(page).getByRole('heading', { name: 'Round tips' }).click();
        await closeTips(page);
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
    });

    test('leaves focus where the keyboard took it after a press in the panel, when the page closes it', async ({
        page,
        browserName,
    }) => {
        await open(page);
        await button(page).click();
        await panel(page).getByRole('heading', { name: 'Round tips' }).click();
        // From the panel, past the Close and the link.
        await tab(page, browserName, 3);
        await expect(page.locator('#after-panels')).toBeFocused();
        await closeTips(page);
        await expect(panel(page)).toBeHidden();
        await twoFrames(page);
        await expect(page.locator('#after-panels')).toBeFocused();
    });

    test("hands focus back to the button that opened the panel when another button's set closes it", async ({
        page,
        browserName,
    }) => {
        await open(page);
        await tabIntoTips(page, browserName);
        await page.evaluate(() => {
            (window as unknown as Kit).panels[2]?.set(false);
        });
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
    });

    test('hands focus back to the button whose set opened the panel', async ({ page }) => {
        await open(page);
        await page.evaluate(() => {
            (window as unknown as Kit).panels[2]?.set(true);
        });
        await expect(panel(page)).toBeVisible();
        await close(page).click();
        await expect(page.locator('#tips-again')).toBeFocused();
    });

    test('moves no focus when the page closes a panel already closed', async ({
        page,
        browserName,
    }) => {
        await open(page);
        await tab(page, browserName, 5);
        await expect(page.locator('#after-panels')).toBeFocused();
        // Tab passed the button once on its way.
        expect(await openerFocus(page)).toBe(1);
        await closeTips(page);
        await twoFrames(page);
        await expect(page.locator('#after-panels')).toBeFocused();
        expect(await openerFocus(page)).toBe(1);
    });
});

test.describe("a button of the page's own in the panel", () => {
    test('hands focus back when it closes the panel', async ({ page }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            const kit = window as unknown as Kit;
            kit.addButton('#round-tips', 'done', 'Done').addEventListener('click', () => {
                kit.setTips(false);
            });
        });
        await page.locator('#done').click();
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
    });

    test('hands focus back when the page closes the panel a while after it is pressed', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            (window as unknown as Kit).addButton('#round-tips', 'done', 'Done');
        });
        await page.locator('#done').click();
        expect(await focusInTips(page)).toBe(true);
        await closeTips(page);
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
    });

    test('hands focus back when it turns itself off and the page closes the panel later', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            const done = (window as unknown as Kit).addButton('#round-tips', 'done', 'Saving');
            done.addEventListener('click', () => {
                done.disabled = true;
            });
        });
        await page.locator('#done').click();
        await closeTips(page);
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
    });

    test('hands focus back when it draws itself away before closing the panel', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            const kit = window as unknown as Kit;
            const done = kit.addButton('#round-tips', 'done', 'Done');
            done.addEventListener('click', () => {
                done.remove();
                kit.setTips(false);
            });
        });
        await page.locator('#done').click();
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
    });

    test('hands focus back when it is pressed after a press outside, draws itself away and closes the panel', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            const kit = window as unknown as Kit;
            const done = kit.addButton('#round-tips', 'done', 'Done');
            done.addEventListener('click', () => {
                done.remove();
                kit.setTips(false);
            });
        });
        await page.locator('#outside').click();
        await page.locator('#done').click();
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
    });

    test('leaves focus where it moves it outside the panel before closing it', async ({ page }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            const kit = window as unknown as Kit;
            kit.addButton('#round-tips', 'done', 'Done').addEventListener('click', () => {
                document.querySelector<HTMLElement>('#after-panels')?.focus();
                kit.setTips(false);
            });
        });
        await page.locator('#done').click();
        await expect(panel(page)).toBeHidden();
        await twoFrames(page);
        await expect(page.locator('#after-panels')).toBeFocused();
    });

    test('leaves focus in its own panel when it closes another', async ({ page }) => {
        await open(page);
        await button(page).click();
        await expect(page.locator('#notes')).toBeVisible();
        await page.evaluate(() => {
            const kit = window as unknown as Kit;
            kit.addButton('#round-tips', 'done', 'Close the notes').addEventListener(
                'click',
                () => {
                    kit.panels[3]?.set(false);
                }
            );
        });
        await page.locator('#done').click();
        await expect(page.locator('#notes')).toBeHidden();
        await twoFrames(page);
        expect(await focusInTips(page)).toBe(true);
    });

    test('leaves focus on nothing when it draws itself away and closes another panel, by keyboard', async ({
        page,
        browserName,
    }) => {
        await open(page);
        await page.evaluate(() => {
            const kit = window as unknown as Kit;
            const done = kit.addButton('#round-tips', 'done', 'Close the notes');
            done.addEventListener('click', () => {
                done.remove();
                kit.panels[3]?.set(false);
            });
        });
        await tabIntoTips(page, browserName);
        await tab(page, browserName, 1);
        await expect(page.locator('#done')).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.locator('#notes')).toBeHidden();
        await twoFrames(page);
        await expect(page.locator('#notes-button')).not.toBeFocused();
        expect(await focusOnNothing(page)).toBe(true);
    });

    test('hands focus to the outer button when one press closes an outer panel and the inner one in it', async ({
        page,
    }) => {
        await open(page);
        await page.evaluate(() => {
            const outer = document.createElement('div');
            outer.id = 'outer';
            outer.className = 'dk-panel';
            outer.innerHTML =
                '<button type="button" id="inner-button" aria-expanded="true" aria-controls="inner">Inner</button>' +
                '<div id="inner" class="dk-panel"><button type="button" id="close-all">Close all</button></div>';
            const opener = document.createElement('button');
            opener.type = 'button';
            opener.id = 'outer-button';
            opener.textContent = 'Outer';
            opener.setAttribute('aria-controls', 'outer');
            opener.setAttribute('aria-expanded', 'true');
            document.querySelector('main')?.append(opener, outer);
            const { attach } = window as unknown as Kit;
            const outerPanel = attach('#outer-button');
            const innerPanel = attach('#inner-button');
            document.querySelector('#close-all')?.addEventListener('click', () => {
                outerPanel.set(false);
                innerPanel.set(false);
            });
        });
        await page.locator('#close-all').click();
        await expect(page.locator('#outer')).toBeHidden();
        await expect(page.locator('#inner')).toBeHidden();
        await expect(page.locator('#outer-button')).toBeFocused();
    });

    test('hands focus back from a panel drawn again from fresh markup once it has opened again', async ({
        page,
    }) => {
        await open(page);
        // The page draws the closed panel again from its markup, which writes no tabindex.
        await page.evaluate((markup) => {
            const drawn = document.createElement('template');
            drawn.innerHTML = markup;
            document.querySelector('#round-tips')?.replaceWith(drawn.content);
        }, TIPS);
        await button(page).click();
        await page.evaluate(() => {
            const kit = window as unknown as Kit;
            kit.addButton('#round-tips', 'done', 'Done').addEventListener('click', () => {
                kit.setTips(false);
            });
        });
        await page.locator('#done').click();
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
    });

    test('hands focus back from a panel drawn again from fresh markup while it is open', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        // The page draws the open panel again from its markup, which writes no tabindex.
        await page.evaluate((markup) => {
            const drawn = document.createElement('template');
            drawn.innerHTML = markup;
            drawn.content.firstElementChild?.removeAttribute('hidden');
            document.querySelector('#round-tips')?.replaceWith(drawn.content);
        }, TIPS);
        await close(page).click();
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
    });
});

test.describe('a link in the panel', () => {
    test('hands focus back when it closes the panel and moves no focus of its own', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        // A router's link that shows its page without moving focus, as many do.
        await page.evaluate(() => {
            document.querySelector('#deal')?.addEventListener('click', (event) => {
                event.preventDefault();
                (window as unknown as Kit).setTips(false);
            });
        });
        await page.locator('#deal').click();
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
    });

    test('leaves focus where it moves it as it closes the panel', async ({ page }) => {
        await open(page);
        await button(page).click();
        // A router's link that takes the page's own way and moves focus to what it shows.
        await page.evaluate(() => {
            const heading = document.createElement('h2');
            heading.id = 'dealing';
            heading.tabIndex = -1;
            heading.textContent = 'Dealing';
            document.querySelector('main')?.append(heading);
            document.querySelector('#deal')?.addEventListener('click', (event) => {
                event.preventDefault();
                heading.focus();
                (window as unknown as Kit).setTips(false);
            });
        });
        await page.locator('#deal').click();
        await expect(panel(page)).toBeHidden();
        await twoFrames(page);
        await expect(page.locator('#dealing')).toBeFocused();
    });

    test("leaves focus on the main content a router's link focuses before the page closes the panel", async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            document.querySelector('#deal')?.addEventListener('click', (event) => {
                event.preventDefault();
                document.querySelector<HTMLElement>('main')?.focus();
            });
        });
        await page.locator('#deal').click();
        await expect(page.locator('main')).toBeFocused();
        await closeTips(page);
        await expect(panel(page)).toBeHidden();
        await twoFrames(page);
        await expect(page.locator('main')).toBeFocused();
        expect(await openerFocus(page)).toBe(1);
    });

    test('sends focus to a place on the page outside the panel that it goes to as it closes it', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            const link = document.createElement('a');
            link.href = '#outside';
            link.id = 'to-outside';
            link.textContent = 'Where scores are kept';
            link.addEventListener('click', () => {
                (window as unknown as Kit).setTips(false);
            });
            document.querySelector('#round-tips')?.append(link);
        });
        await page.locator('#to-outside').click();
        await expect(panel(page)).toBeHidden();
        await twoFrames(page);
        await expect(page.locator('#outside')).toBeFocused();
        await expect(page.locator('#outside')).toHaveAttribute('tabindex', '-1');
    });

    test('sends focus to a place whose id is written encoded in the link', async ({ page }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            const place = document.createElement('p');
            place.id = 'scores kept';
            place.textContent = 'Scores are kept here.';
            document.querySelector('footer')?.append(place);
            const link = document.createElement('a');
            link.href = '#scores%20kept';
            link.id = 'to-kept';
            link.textContent = 'Where scores are kept';
            link.addEventListener('click', () => {
                (window as unknown as Kit).setTips(false);
            });
            document.querySelector('#round-tips')?.append(link);
        });
        await page.locator('#to-kept').click();
        await expect(panel(page)).toBeHidden();
        await expect(page.locator('[id="scores kept"]')).toBeFocused();
    });

    test('hands focus to the button where the link opens a new tab rather than moving this page', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            const link = document.createElement('a');
            link.href = '#outside';
            link.target = '_blank';
            link.id = 'to-tab';
            link.textContent = 'Where scores are kept, in a new tab';
            link.addEventListener('click', (event) => {
                event.preventDefault();
                (window as unknown as Kit).setTips(false);
            });
            document.querySelector('#round-tips')?.append(link);
        });
        await page.locator('#to-tab').click();
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
    });

    test('hands focus to the button, not where a link goes, when the link only had focus', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            const link = document.createElement('a');
            link.href = '#outside';
            link.id = 'to-outside';
            link.textContent = 'Where scores are kept';
            document.querySelector('#round-tips')?.append(link);
        });
        // Focus that reached the link, rather than a press that followed it, moves the page nowhere.
        await page.locator('#to-outside').focus();
        await page.evaluate(() => {
            (window as unknown as Kit).setTips(false);
        });
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
        await expect(page.locator('#outside')).not.toHaveAttribute('tabindex');
    });

    test('leaves a place a link goes to in the order for Tab where it takes focus already', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            const link = document.createElement('a');
            link.href = '#after-panels';
            link.id = 'to-after';
            link.textContent = 'After the panels';
            link.addEventListener('click', () => {
                (window as unknown as Kit).setTips(false);
            });
            document.querySelector('#round-tips')?.append(link);
        });
        await page.locator('#to-after').click();
        await expect(panel(page)).toBeHidden();
        await expect(page.locator('#after-panels')).toBeFocused();
        await expect(page.locator('#after-panels')).not.toHaveAttribute('tabindex');
    });
});

test.describe('Escape', () => {
    test('leaves the panel open on the Escape with which Safari ends typing in a script such as Japanese', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await page.locator('#deal').focus();
        // Safari gives that keydown the key code 229 rather than saying it is composing.
        await page.evaluate(() => {
            const press = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            Object.defineProperty(press, 'keyCode', { value: 229 });
            document.activeElement?.dispatchEvent(press);
        });
        await twoFrames(page);
        await expect(panel(page)).toBeVisible();
    });

    test('leaves the panel open on Escape at its button while the button is off', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            document.querySelector('#tips-button')?.setAttribute('aria-disabled', 'true');
        });
        await button(page).focus();
        await page.keyboard.press('Escape');
        await twoFrames(page);
        await expect(panel(page)).toBeVisible();
    });

    test('closes the panel from a disclosure inside it, which takes no Escape of its own', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            const kit = window as unknown as Kit;
            kit.addButton('#round-tips', 'section-head', 'Scoring').setAttribute(
                'aria-expanded',
                'true'
            );
        });
        await page.locator('#section-head').focus();
        await page.keyboard.press('Escape');
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
    });

    test('leaves the panel open when Escape closes a dialog inside it', async ({ page }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            const dialog = document.createElement('dialog');
            dialog.innerHTML = '<button type="button" id="in-dialog">Keep</button>';
            document.querySelector('#round-tips')?.append(dialog);
            dialog.showModal();
        });
        await expect(page.locator('#in-dialog')).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(page.locator('dialog')).not.toHaveAttribute('open');
        await expect(panel(page)).toBeVisible();
    });

    test('leaves the panel open on an Escape that ends typing in a script such as Japanese', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await page.locator('#deal').focus();
        await page.evaluate(() => {
            document.activeElement?.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'Escape', isComposing: true, bubbles: true })
            );
        });
        await twoFrames(page);
        await expect(panel(page)).toBeVisible();
    });

    test('closes the panel with focus in it and hands focus to its button', async ({
        page,
        browserName,
    }) => {
        await open(page);
        await tabIntoTips(page, browserName);
        await page.keyboard.press('Escape');
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(button(page)).toBeFocused();
    });

    test('closes the panel with focus on its button and keeps focus there', async ({ page }) => {
        await open(page);
        await button(page).click();
        await page.keyboard.press('Escape');
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toBeFocused();
    });

    test('leaves the panel open with focus outside it', async ({ page, browserName }) => {
        await open(page);
        await button(page).click();
        await tab(page, browserName, 6);
        await expect(page.locator('#after-panels')).toBeFocused();
        await page.keyboard.press('Escape');
        await twoFrames(page);
        await expect(panel(page)).toBeVisible();
        await expect(page.locator('#after-panels')).toBeFocused();
    });

    test('closes only the innermost panel that holds focus', async ({ page }) => {
        await open(page);
        await page.evaluate(() => {
            const outer = document.createElement('div');
            outer.id = 'outer';
            outer.className = 'dk-panel';
            outer.innerHTML =
                '<button type="button" id="inner-button" aria-expanded="true" aria-controls="inner">Inner</button>' +
                '<div id="inner" class="dk-panel"><button type="button" id="in-inner">Score</button></div>';
            const opener = document.createElement('button');
            opener.type = 'button';
            opener.id = 'outer-button';
            opener.textContent = 'Outer';
            opener.setAttribute('aria-controls', 'outer');
            opener.setAttribute('aria-expanded', 'false');
            document.querySelector('main')?.append(opener, outer);
            const { attach } = window as unknown as Kit;
            attach('#outer-button');
            attach('#inner-button');
        });
        await page.locator('#outer-button').click();
        await page.locator('#in-inner').click();
        await page.keyboard.press('Escape');
        await expect(page.locator('#inner')).toBeHidden();
        await expect(page.locator('#outer')).toBeVisible();
        await expect(page.locator('#inner-button')).toBeFocused();
    });

    test('leaves Escape to a search with words in it', async ({ page }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            const search = document.createElement('input');
            search.type = 'search';
            search.id = 'find';
            search.setAttribute('aria-label', 'Find a tip');
            document.querySelector('#round-tips')?.append(search);
        });
        await page.locator('#find').click();
        await page.keyboard.type('deal');
        await page.keyboard.press('Escape');
        await twoFrames(page);
        await expect(panel(page)).toBeVisible();
    });

    test('leaves Escape to a list that is open in the panel', async ({ page }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            const field = document.createElement('input');
            field.id = 'player';
            field.setAttribute('role', 'combobox');
            field.setAttribute('aria-label', 'Player');
            field.setAttribute('aria-expanded', 'true');
            document.querySelector('#round-tips')?.append(field);
        });
        await page.locator('#player').click();
        await page.keyboard.press('Escape');
        await twoFrames(page);
        await expect(panel(page)).toBeVisible();
    });

    test("leaves the panel open where the page's own handler takes the Escape", async ({
        page,
        browserName,
    }) => {
        await open(page);
        await page.evaluate(() => {
            document.querySelector('#round-tips')?.addEventListener('keydown', (event) => {
                if ((event as KeyboardEvent).key === 'Escape') event.preventDefault();
            });
        });
        await tabIntoTips(page, browserName);
        await page.keyboard.press('Escape');
        await twoFrames(page);
        await expect(panel(page)).toBeVisible();
    });

    test('closes a panel in a dialog and leaves the dialog open', async ({ page }) => {
        await open(page);
        await page.evaluate(() => {
            const dialog = document.createElement('dialog');
            dialog.className = 'dk-dialog';
            dialog.setAttribute('aria-label', 'Round options');
            dialog.innerHTML =
                '<button type="button" id="hints-button" aria-expanded="true" aria-controls="hints">Hints</button>' +
                '<div id="hints" class="dk-panel"><button type="button" id="hint">Show a hint</button></div>';
            document.body.append(dialog);
            (window as unknown as Kit).attach('#hints-button');
            dialog.showModal();
        });
        await page.locator('#hint').click();
        await page.keyboard.press('Escape');
        await expect(page.locator('#hints')).toBeHidden();
        await expect(page.locator('#hints-button')).toBeFocused();
        await twoFrames(page);
        expect(await page.evaluate(() => document.querySelector('dialog')?.open)).toBe(true);
    });
});

test.describe('where focus goes', () => {
    test('moves focus to what follows the panel where no button that names it is left', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            for (const id of ['#tips-button', '#tips-again']) document.querySelector(id)?.remove();
        });
        await close(page).click();
        await expect(panel(page)).toBeHidden();
        // Past the open rules panel, whose tabindex of -1 keeps it off the keyboard's way.
        await expect(page.getByRole('link', { name: 'After the panels' })).toBeFocused();
    });

    test("moves focus to the page's main content where nothing after the panel takes it", async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            for (const id of [
                '#tips-button',
                '#tips-again',
                '#rules',
                '#notes',
                '#after-panels',
                '#no-panel',
            ])
                document.querySelector(id)?.remove();
        });
        await close(page).click();
        await expect(panel(page)).toBeHidden();
        await expect(page.locator('main')).toBeFocused();
    });

    test('hands focus to a button that is not off when the panel closes', async ({ page }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            document.querySelector('#tips-button')?.setAttribute('aria-disabled', 'true');
        });
        await close(page).click();
        await expect(panel(page)).toBeHidden();
        await expect(page.locator('#tips-again')).toBeFocused();
    });

    test('marks a button attached later as the panel is, without taking the place of the one that opened it', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            const later = document.createElement('button');
            later.type = 'button';
            later.id = 'tips-later';
            later.textContent = 'Tips once more';
            later.setAttribute('aria-controls', 'round-tips');
            later.setAttribute('aria-expanded', 'false');
            document.querySelector('main')?.prepend(later);
            (window as unknown as Kit).attach('#tips-later');
        });
        await expect(page.locator('#tips-later')).toHaveAttribute('aria-expanded', 'true');
        await close(page).click();
        await expect(button(page)).toBeFocused();
    });
});

test.describe('tabindex', () => {
    test('gives the panel, its buttons and its Close a tabindex where the page set none', async ({
        page,
    }) => {
        await open(page);
        await expect(panel(page)).toHaveAttribute('tabindex', '-1');
        await expect(button(page)).toHaveAttribute('tabindex', '0');
        await expect(page.locator('#tips-again')).toHaveAttribute('tabindex', '0');
        // The panel starts closed, so its Close is found by where it is rather than by its name.
        await expect(page.locator('#round-tips .dk-close button')).toHaveAttribute('tabindex', '0');
    });

    test('keeps the tabindex a page set on the panel, its button and its Close', async ({
        page,
    }) => {
        await open(page);
        await page.evaluate(() => {
            const panel = document.createElement('div');
            panel.id = 'toolbar-panel';
            panel.className = 'dk-panel';
            panel.tabIndex = 0;
            panel.innerHTML =
                '<div class="dk-close"><button type="button" tabindex="-1">Close the tools</button></div>';
            const opener = document.createElement('button');
            opener.type = 'button';
            opener.id = 'toolbar-button';
            opener.tabIndex = -1;
            opener.textContent = 'Tools';
            opener.setAttribute('aria-controls', 'toolbar-panel');
            opener.setAttribute('aria-expanded', 'true');
            document.querySelector('main')?.append(opener, panel);
            (window as unknown as Kit).attach('#toolbar-button').set(false);
        });
        await expect(page.locator('#toolbar-panel')).toHaveAttribute('tabindex', '0');
        await expect(page.locator('#toolbar-button')).toHaveAttribute('tabindex', '-1');
        await expect(page.locator('#toolbar-panel .dk-close button')).toHaveAttribute(
            'tabindex',
            '-1'
        );
    });

    test('leaves a button a pointer presses unfocused in WebKit when it has no tabindex, as Safari does', async ({
        page,
        browserName,
    }) => {
        test.skip(browserName !== 'webkit', "Safari's way is tested in WebKit alone");
        await open(page);
        await page.locator('#no-panel').click();
        await expect(page.locator('#no-panel')).not.toBeFocused();
        // It lands on the main, the nearest that takes focus, as the tests above count on.
        await expect(page.locator('main')).toBeFocused();
    });
});

test.describe('attaching and letting go', () => {
    test('leaves the panel alone when a Close in later content that reuses its id is pressed', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            const copy = document.createElement('div');
            copy.id = 'round-tips';
            copy.innerHTML =
                '<div class="dk-close"><button type="button">Close the copy</button></div>';
            document.querySelector('main')?.append(copy);
        });
        await page.getByRole('button', { name: 'Close the copy' }).click();
        await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
        await expect(page.locator('.dk-panel#round-tips')).toBeVisible();
    });

    test('lets a button go when detached, and takes the listener off only once every button is let go', async ({
        page,
    }) => {
        await open(page);
        await button(page).click();
        const detach = (indexes: readonly number[]) =>
            page.evaluate((chosen) => {
                const { panels } = window as unknown as Kit;
                for (const index of chosen) panels[index]?.detach();
                return (window as unknown as { listenersOff: number }).listenersOff;
            }, indexes);
        // The tips' two buttons go, and the rules' button still works on the listener.
        expect(await detach([0, 2])).toBe(0);
        await close(page).click();
        await expect(panel(page)).toBeVisible();
        await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
        await page.locator('#rules-button').click();
        await expect(page.locator('#rules')).toBeHidden();
        expect(await detach([1, 3])).toBe(1);
        await page.locator('#rules-button').click();
        await expect(page.locator('#rules')).toBeHidden();
    });

    test('leaves the tabindex it gave a button in place when the button is let go', async ({
        page,
    }) => {
        await open(page);
        await page.evaluate(() => {
            (window as unknown as Kit).panels[0]?.detach();
        });
        await expect(button(page)).toHaveAttribute('tabindex', '0');
    });

    test('leaves a button attached again alone when what was returned before is detached', async ({
        page,
    }) => {
        await open(page);
        const same = await page.evaluate(() => {
            const { panels, attach } = window as unknown as Kit;
            const before = panels[0];
            before?.detach();
            const again = attach('#tips-button');
            before?.detach();
            return again !== before;
        });
        expect(same).toBe(true);
        await button(page).click();
        await expect(panel(page)).toBeVisible();
    });

    test('follows a button whose aria-controls the page changes to another panel', async ({
        page,
    }) => {
        await open(page);
        await page.evaluate(() => {
            document.querySelector('#notes-button')?.setAttribute('aria-controls', 'round-tips');
            (window as unknown as Kit).panels[3]?.set(true);
        });
        await expect(panel(page)).toBeVisible();
        await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
        await close(page).click();
        await expect(panel(page)).toBeHidden();
    });

    test('leaves the panel alone when an off button is pressed, open or closed, by key or pointer', async ({
        page,
        browserName,
    }) => {
        await open(page);
        await page.evaluate(() => {
            document.querySelector('#tips-button')?.setAttribute('aria-disabled', 'true');
        });
        // An off button stays in the tab order, so a keyboard still reaches and presses it.
        await tab(page, browserName, 1);
        await expect(button(page)).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(panel(page)).toBeHidden();
        await expect(button(page)).toHaveAttribute('aria-expanded', 'false');
        // Opened by the other button, the panel stays open when the off one is pressed.
        await page.locator('#tips-again').click();
        await expect(panel(page)).toBeVisible();
        await button(page).click({ force: true });
        await expect(panel(page)).toBeVisible();
        await expect(page.locator('#tips-again')).toHaveAttribute('aria-expanded', 'true');
        await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
    });

    test('keeps an open panel open when a second button is attached to it', async ({ page }) => {
        await open(page);
        await button(page).click();
        await expect(panel(page)).toBeVisible();
        await page.evaluate(() => {
            const later = document.createElement('button');
            later.type = 'button';
            later.id = 'tips-later';
            later.textContent = 'Tips again';
            later.setAttribute('aria-controls', 'round-tips');
            later.setAttribute('aria-expanded', 'false');
            document.querySelector('main')?.append(later);
            (window as unknown as Kit).attach('#tips-later');
        });
        await expect(panel(page)).toBeVisible();
        await expect(page.locator('#tips-later')).toHaveAttribute('aria-expanded', 'true');
        await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
    });

    test('keeps an open panel open when its button is drawn again', async ({ page }) => {
        await open(page);
        await button(page).click();
        await page.evaluate(() => {
            const { panels, attach } = window as unknown as Kit;
            panels[0]?.detach();
            panels[2]?.detach();
            const old = document.querySelector('#tips-button');
            const drawn = old?.cloneNode(true) as HTMLButtonElement;
            drawn.setAttribute('aria-expanded', 'false');
            old?.replaceWith(drawn);
            attach('#tips-button');
        });
        await expect(panel(page)).toBeVisible();
        await expect(button(page)).toHaveAttribute('aria-expanded', 'true');
    });

    test('moves no focus when it attaches a button whose markup starts its panel closed', async ({
        page,
        browserName,
    }) => {
        await open(page);
        await tab(page, browserName, 5);
        await expect(page.locator('#after-panels')).toBeFocused();
        await page.evaluate(() => {
            const panel = document.createElement('div');
            panel.id = 'quiet-panel';
            panel.className = 'dk-panel';
            panel.innerHTML = '<p>Shown until attached.</p>';
            const opener = document.createElement('button');
            opener.type = 'button';
            opener.id = 'quiet-button';
            opener.textContent = 'Quiet';
            opener.setAttribute('aria-controls', 'quiet-panel');
            opener.setAttribute('aria-expanded', 'false');
            document.querySelector('main')?.append(opener, panel);
            (window as unknown as Kit).attach('#quiet-button');
        });
        await expect(page.locator('#quiet-panel')).toBeHidden();
        await twoFrames(page);
        await expect(page.locator('#after-panels')).toBeFocused();
    });
});

test('decides a close from where focus last moved, not from a press before it', async ({
    page,
}) => {
    await open(page);
    // Every other panel closed, so this one is the only one open.
    await page.evaluate(() => {
        for (const other of [1, 3]) (window as unknown as Kit).panels[other]?.set(false);
    });
    await button(page).click();
    // A press in the panel, then a close from the page's code, which records no place of its own,
    // so the press is a place from before every panel closed.
    await page.locator('#round-tips p').first().click();
    await page.evaluate(() => {
        (window as unknown as Kit).setTips(false);
    });
    await expect(panel(page)).toBeHidden();
    await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
        (window as unknown as Kit).setTips(true);
    });
    await expect(panel(page)).toBeVisible();
    await page.evaluate(() => {
        (window as unknown as Kit).setTips(false);
    });
    await twoFrames(page);
    await expect(button(page)).not.toBeFocused();
});

test("closes the panel around an off button with Escape, where the button's own panel is closed", async ({
    page,
}) => {
    await open(page);
    // An off button for a closed panel, inside an open one.
    await page.evaluate(() => {
        const kit = window as unknown as Kit;
        const inner = kit.addButton('#round-tips', 'inner-button', 'More');
        inner.setAttribute('aria-controls', 'notes');
        kit.attach('#inner-button');
        kit.panels[3]?.set(false);
        inner.setAttribute('aria-disabled', 'true');
    });
    await button(page).click();
    await page.locator('#inner-button').focus();
    await page.keyboard.press('Escape');
    await expect(panel(page)).toBeHidden();
});
