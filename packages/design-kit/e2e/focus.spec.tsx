import { expect, test } from '@playwright/test';

import { bundle } from './bundle.js';
import { servePage } from './page.js';

/*
 * Focus moved once a change is drawn, by `moveFocus` and through React's `useFocusAfterDraw` and
 * `useArrivalFocus`: an id drawn after the request found, a target gone, hidden, inert or off
 * passed over for its fallbacks, focus a visitor moved since the request left where it is, a
 * control asked for twice focused twice, a request called off, and a view's heading focused when
 * its key changes but never as the page first draws.
 */

const BODY =
    '<main><button id="pressed">Save</button><button id="other">Other</button>' +
    '<div id="later"></div><button id="hidden" hidden>Hidden</button>' +
    '<div inert><button id="inert">Inert</button></div><button id="off" disabled>Off</button>' +
    '<h2 id="heading" tabindex="-1">Round 2</h2></main>';

const SCRIPT = `import { moveFocus } from './controls.js';
window.moveFocus = moveFocus;
window.ready = true;`;

type Mover = {
    moveFocus: (
        target: string | Element | null,
        options?: { fallbacks?: readonly (string | Element | null)[] }
    ) => () => void;
};

const open = async (page: import('@playwright/test').Page) => {
    await servePage(page, { title: 'Focus', body: BODY, script: SCRIPT });
    await page.waitForFunction(() => 'ready' in window);
    await page.locator('#pressed').focus();
};

test('focuses a control drawn after the request, by its id, once the change is drawn', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        (window as unknown as Mover).moveFocus('added');
        const added = document.createElement('button');
        added.id = 'added';
        added.textContent = 'Added';
        document.querySelector('#later')?.append(added);
    });
    await expect(page.locator('#added')).toBeFocused();
});

test('passes over a target that is gone, hidden, inert or off for the first fallback that takes focus', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        (window as unknown as Mover).moveFocus('gone', {
            fallbacks: ['hidden', 'inert', 'off', 'heading'],
        });
    });
    await expect(page.locator('#heading')).toBeFocused();
    // A target taken away before the frame, as a removed control is, falls back too.
    await page.locator('#pressed').focus();
    await page.evaluate(() => {
        const other = document.querySelector('#other');
        (window as unknown as Mover).moveFocus(other, { fallbacks: ['pressed'] });
        other?.remove();
    });
    await expect(page.locator('#pressed')).toBeFocused();
});

test('leaves focus a visitor moved since the request, and calls a request off', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        (window as unknown as Mover).moveFocus('heading');
        document.querySelector<HTMLElement>('#other')?.focus();
    });
    await page.waitForTimeout(100);
    await expect(page.locator('#other')).toBeFocused();
    await page.evaluate(() => {
        const cancel = (window as unknown as Mover).moveFocus('heading');
        cancel();
    });
    await page.waitForTimeout(100);
    await expect(page.locator('#other')).toBeFocused();
    // Focus that fell to the page's body is free, as a removed control leaves it.
    await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
        (window as unknown as Mover).moveFocus('heading');
    });
    await expect(page.locator('#heading')).toBeFocused();
});

test('focuses a control asked for twice, each time', async ({ page }) => {
    await open(page);
    for (const _ of [1, 2]) {
        await page.locator('#pressed').focus();
        await page.evaluate(() => {
            (window as unknown as Mover).moveFocus('other');
        });
        await expect(page.locator('#other')).toBeFocused();
    }
});

test('passes over a control marked off, and falls to the main content with no fallback left', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        document.querySelector('#other')?.setAttribute('aria-disabled', 'true');
        document.querySelector('main')?.setAttribute('tabindex', '-1');
        (window as unknown as Mover).moveFocus('other', { fallbacks: ['gone'] });
    });
    await expect(page.locator('main')).toBeFocused();
});

test.describe('in React', () => {
    let app = '';
    test.beforeAll(async () => {
        test.setTimeout(120_000);
        app = await bundle('focus-page.tsx');
    });

    test('moves focus to the next control as one removes itself, and to a heading once none is left', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await page.locator('#remove-Ann').click();
        await expect(page.locator('#remove-Ben')).toBeFocused();
        await page.locator('#remove-Ben').click();
        await expect(page.locator('#players')).toBeFocused();
    });

    test("focuses a view's heading when its key changes, but never as the page first draws", async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await expect(page.locator('#round')).toHaveAttribute('tabindex', '-1');
        await page.waitForTimeout(100);
        await expect(page.locator('#round')).not.toBeFocused();
        await page.locator('#next').click();
        await expect(page.locator('#round')).toHaveText('Round 2');
        await expect(page.locator('#round')).toBeFocused();
    });

    test('focuses the last of two requests made in one frame', async ({ page }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await page.locator('#remove-Ann').focus();
        await page.evaluate(() => {
            (window as unknown as { focusTwice: () => void }).focusTwice();
        });
        await expect(page.locator('#next')).toBeFocused();
    });

    test("focuses a view's heading as a press draws it, but not over a field the view focuses itself", async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await page.locator('#show-scores').click();
        await expect(page.locator('#scores')).toBeFocused();
        await page.locator('#show-search').click();
        await page.waitForTimeout(100);
        await expect(page.locator('#query')).toBeFocused();
    });

    test('keeps focus on each tab as the arrow keys move along a row whose views take focus on arrival', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        // A press that brings no view of its own first, so one is the visitor's last press.
        await page.locator('#show-brief').click();
        await page.locator('#mode-number').focus();
        await page.keyboard.press('ArrowRight');
        await expect(page.locator('#view-cards')).toBeVisible();
        await page.waitForTimeout(100);
        await expect(page.locator('#mode-cards')).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await expect(page.locator('#view-number')).toBeVisible();
        await page.waitForTimeout(100);
        await expect(page.locator('#mode-number')).toBeFocused();
    });

    test('keeps focus on a tab chosen by a press or by Enter', async ({ page }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await page.locator('#mode-cards').click();
        await expect(page.locator('#view-cards')).toBeVisible();
        await page.waitForTimeout(100);
        await expect(page.locator('#mode-cards')).toBeFocused();
        await page.locator('#mode-number').focus();
        await page.keyboard.press('Enter');
        await expect(page.locator('#view-number')).toBeVisible();
        await page.waitForTimeout(100);
        await expect(page.locator('#mode-number')).toBeFocused();
    });

    test('leaves focus where Tab put it for a view first drawn after the visitor only tabbed', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await page.keyboard.press('Tab');
        await expect(page.locator('#remove-Ann')).toBeFocused();
        await page.evaluate(() => {
            (window as unknown as { showLate: () => void }).showLate();
        });
        await expect(page.locator('#late')).toBeVisible();
        await page.waitForTimeout(100);
        await expect(page.locator('#remove-Ann')).toBeFocused();
    });

    test('leaves focus in a field typed in after a press for a view drawn late', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await page.locator('#show-brief').click();
        await page.locator('#late-query').click();
        await page.keyboard.type('Sky');
        await page.evaluate(() => {
            (window as unknown as { showLate: () => void }).showLate();
        });
        await expect(page.locator('#late')).toBeVisible();
        await page.waitForTimeout(100);
        await expect(page.locator('#late-query')).toBeFocused();
    });

    test('leaves focus for a view first drawn after a press on a control that is off', async ({
        page,
    }) => {
        await page.clock.install();
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        // Forced, since an off control waits for nothing to turn it on.
        await page.locator('#off').click({ force: true });
        await page.evaluate(() => {
            (window as unknown as { showLate: () => void }).showLate();
        });
        await expect(page.locator('#late')).toBeVisible();
        await page.clock.runFor(100);
        await expect(page.locator('#off')).toBeFocused();
    });

    test('leaves focus for a view a press brought only after the press had long passed', async ({
        page,
    }) => {
        await page.clock.install();
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        // The view this press brings leaves at once, so the press is handed back and waits.
        await page.locator('#show-brief').click();
        await page.clock.runFor(6000);
        await page.evaluate(() => {
            (window as unknown as { showLate: () => void }).showLate();
        });
        await expect(page.locator('#late')).toBeVisible();
        await page.clock.runFor(100);
        await expect(page.locator('#show-brief')).toBeFocused();
    });

    test("focuses a view's own heading as its key changes over a section first drawn for the same press, and spends the press", async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await page.locator('#next').click();
        await expect(page.locator('#round')).toHaveText('Round 2');
        await expect(page.locator('#round')).toBeFocused();
        await page.evaluate(() => {
            (window as unknown as { showLate: () => void }).showLate();
        });
        await expect(page.locator('#late')).toBeVisible();
        await page.waitForTimeout(100);
        await expect(page.locator('#round')).toBeFocused();
    });

    test("focuses a view's heading when a script's click changes its key", async ({ page }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await page.locator('#next').focus();
        await page.evaluate(() => {
            document.querySelector<HTMLButtonElement>('#next')?.click();
        });
        await expect(page.locator('#round')).toHaveText('Round 2');
        await expect(page.locator('#round')).toBeFocused();
    });

    test('moves nothing for a view gone in the frame it arrived in', async ({ page }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await page.locator('#show-brief').click();
        await page.waitForTimeout(100);
        await expect(page.locator('#brief')).toHaveCount(0);
        await expect(page.locator('#show-brief')).toBeFocused();
    });

    test("focuses a view's own heading over a section of it brought by the same press", async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await page.locator('#start').click();
        await expect(page.locator('#game')).toBeFocused();
    });

    test('adds no listener however often a view is drawn before any press', async ({
        page,
        browserName,
    }) => {
        test.skip(
            browserName !== 'chromium',
            "Listeners are counted through Chromium's own tools."
        );
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        const session = await page.context().newCDPSession(page);
        const counted = async () => {
            const { result } = await session.send('Runtime.evaluate', { expression: 'document' });
            const { listeners } = await session.send('DOMDebugger.getEventListeners', {
                objectId: result.objectId ?? '',
            });
            return listeners.length;
        };
        const before = await counted();
        await page.evaluate(() => {
            (window as unknown as { drawAgain: () => void }).drawAgain();
        });
        await expect(page.locator('#again')).toHaveAttribute('data-count', '20');
        expect(await counted()).toBe(before);
    });
});
