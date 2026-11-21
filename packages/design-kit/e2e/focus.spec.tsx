import { expect, test } from '@playwright/test';

import { bundle } from './bundle.js';
import { servePage, stillClock, tabKey } from './page.js';

/*
 * Focus moved once a change is drawn, by `moveFocus` and through React's `useFocusAfterDraw` and
 * `useArrivalFocus`, in Chromium, WebKit and Firefox: an id drawn after the request found, a target
 * gone, hidden, inert or off passed over for its fallbacks, focus a visitor moved since the request
 * left where it is, a control asked for twice focused twice, a request called off, and a view's
 * heading focused when its key changes but never as the page first draws. A request still waiting
 * as its component unmounts lands, from a row removed at once, after an await, from a timer or in a
 * transition, from a transition an urgent update overtook, on its fallback where the transition
 * draws its target, and from a component an `Activity` hides, unless the visitor moved focus first.
 * One made in a commit before its component goes lands, one asked from a ref as its component first
 * draws lands, one whose target an `Activity` hides with its component is held until it shows, one
 * asked after an await by a component that has gone lands, and one asked once the visitor is on the
 * next screen leaves focus there, whatever place it names.
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

/** Waits two frames, so a request's own frame has come and gone. */
const frames = (page: import('@playwright/test').Page) =>
    page.evaluate(async () => {
        for (let frame = 0; frame < 2; frame += 1)
            await new Promise((resolve) => requestAnimationFrame(resolve));
    });

/**
 * Presses a button by Enter with focus on it, since Safari leaves focus off a button a pointer
 * presses.
 */
const press = async (page: import('@playwright/test').Page, selector: string) => {
    await page.locator(selector).focus();
    await page.keyboard.press('Enter');
};

/** Calls one of the page's functions, in a task of its own. */
const run = (page: import('@playwright/test').Page, name: string) =>
    page.evaluate((call) => {
        (window as unknown as Record<string, () => void>)[call]?.();
    }, name);

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

    test('leaves a button given the ref in the Tab order, and focuses it as its key changes', async ({
        page,
        browserName,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await expect(page.locator('#change')).not.toHaveAttribute('tabindex', /.*/);
        // The key changes from another button, so focus can only reach this one by the hook.
        await press(page, '#bump');
        await expect(page.locator('#change')).toHaveText('Change round 2');
        await expect(page.locator('#change')).toBeFocused();
        await page.keyboard.press(tabKey(browserName));
        await expect(page.locator('#after-change')).toBeFocused();
        await page.keyboard.press(`Shift+${tabKey(browserName)}`);
        await expect(page.locator('#change')).toBeFocused(); // A link with no address takes focus no other way, so it is given a tabindex as a heading is.
        await expect(page.locator('#link-title')).toHaveAttribute('tabindex', '-1');
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

    test('focuses a control a save turns on after an await, though the frame comes before the render', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        // A frame due at once, as one late under load is, comes before React draws what the save
        // set, which it draws in a task of its own.
        await page.evaluate(() => {
            window.requestAnimationFrame = (callback) => {
                queueMicrotask(() => {
                    callback(performance.now());
                });
                return 0;
            };
        });
        await page.locator('#save').click();
        await expect(page.locator('#saved-next')).toBeFocused();
    });

    test('focuses a control a sibling draws, turned on after an await, though the frame comes before the render', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        // A frame due at once comes before React draws the sibling the save turned the control
        // on in.
        await page.evaluate(() => {
            window.requestAnimationFrame = (callback) => {
                queueMicrotask(() => {
                    callback(performance.now());
                });
                return 0;
            };
        });
        await page.locator('#sibling-save').click();
        await expect(page.locator('#sibling-next')).toBeFocused();
    });

    test('focuses a control a save pressed inside a shadow root turns on after an await', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await page.locator('#shadow-save').focus();
        await page.keyboard.press('Enter');
        await expect(page.locator('#shadow-next')).toBeFocused();
    });

    test('moves focus asked for after an await by a component that has since unmounted', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await press(page, '#panel-close');
        await expect(page.locator('#panel-close')).toHaveCount(0);
        await expect(page.locator('#panel-open')).toBeFocused();
    });

    test('moves focus to the next row as the row asking for it is removed', async ({ page }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await press(page, '#row-Ann');
        await expect(page.locator('#row-Ann')).toHaveCount(0);
        await expect(page.locator('#row-Ben')).toBeFocused();
        await press(page, '#row-Cy');
        await expect(page.locator('#row-Ben')).toBeFocused();
    });

    for (const how of ['await', 'timer', 'transition'] as const)
        test(`moves focus to the next row as the row removed by ${how} asks for it`, async ({
            page,
        }) => {
            await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
            await press(page, `#row-${how}-Ann`);
            await expect(page.locator(`#row-${how}-Ann`)).toHaveCount(0);
            await expect(page.locator(`#row-${how}-Ben`)).toBeFocused();
        });

    test('leaves focus on the next screen where a request comes after its component unmounted', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await press(page, '#leave-close');
        await page.locator('#next-screen').focus();
        await page.evaluate(() => {
            (window as unknown as { answerLeave: () => void }).answerLeave();
        });
        await frames(page);
        await expect(page.locator('#next-screen')).toBeFocused();
    });

    test('leaves focus on the next screen for a late request that names that field as where focus was', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await press(page, '#named-leave-close');
        await page.locator('#named-next-screen').focus();
        await page.evaluate(() => {
            (window as unknown as { answerNamed: () => void }).answerNamed();
        });
        await frames(page);
        await expect(page.locator('#named-next-screen')).toBeFocused();
    });

    test('focuses a field a view asks for from its own ref as a press first draws it', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await press(page, '#open-view');
        await expect(page.locator('#first-field')).toBeFocused();
    });

    test('lands a request whose transition an urgent update overtook, where focus fell with its component', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await press(page, '#owner-ask');
        // Later, in a task of its own, while the transition still waits.
        await run(page, 'dropOwner');
        await expect(page.locator('#owner-ask')).toHaveCount(0);
        await expect(page.locator('#owner-target')).toBeFocused();
    });

    test('leaves a field the visitor moved to for a request whose transition was overtaken', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await press(page, '#owner-ask');
        await page.locator('#owner-field').focus();
        await run(page, 'dropOwner');
        await expect(page.locator('#owner-ask')).toHaveCount(0);
        await frames(page);
        await expect(page.locator('#owner-field')).toBeFocused();
    });

    test('lands an overtaken request before its transition draws the target, on its fallback', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await press(page, '#drawn-ask');
        await run(page, 'dropOwner');
        await expect(page.locator('#drawn-ask')).toHaveCount(0);
        await expect(page.locator('#owner-fallback')).toBeFocused();
    });

    test('lands a request whose component an Activity hides in the same press', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await press(page, '#hide-ask');
        await expect(page.locator('#hide-ask')).toBeHidden();
        await expect(page.locator('#owner-target')).toBeFocused();
    });

    test('lands a waiting request whose component an Activity hides later, unless focus moved', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await press(page, '#hidden-ask');
        await run(page, 'hideOwner');
        await expect(page.locator('#hidden-ask')).toBeHidden();
        await expect(page.locator('#owner-target')).toBeFocused();
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await press(page, '#hidden-ask');
        await page.locator('#owner-field').focus();
        await run(page, 'hideOwner');
        await expect(page.locator('#hidden-ask')).toBeHidden();
        await frames(page);
        await expect(page.locator('#owner-field')).toBeFocused();
    });

    test('holds a request whose target an Activity hides with its component, and lands it once shown', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await run(page, 'hideOwner');
        await expect(page.locator('#hidden-ask')).toBeHidden();
        await run(page, 'askHidden');
        await page.waitForTimeout(100);
        await frames(page);
        expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
        await run(page, 'showOwner');
        await expect(page.locator('#hidden-ask')).toBeVisible();
        await expect(page.locator('#hidden-target')).toBeFocused();
    });

    test('lands a request made in one commit whose component the next commit takes away', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await press(page, '#brisk-ask');
        await expect(page.locator('#brisk-ask')).toHaveCount(0);
        await expect(page.locator('#brisk-target')).toBeFocused();
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
        browserName,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await page.keyboard.press(tabKey(browserName));
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
        await stillClock(page.clock);
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await press(page, '#off');
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
        await stillClock(page.clock);
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        // The view this press brings leaves at once, so the press is handed back and waits.
        await press(page, '#show-brief');
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
        await press(page, '#show-brief');
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
