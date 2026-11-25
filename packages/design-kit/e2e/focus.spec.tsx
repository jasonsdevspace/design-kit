import { once } from 'node:events';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

import { expect, type Page, test } from '@playwright/test';

import { bundle } from './bundle.js';
import { leaksOf, listenersOn, openCounted } from './leaks.js';
import { box, frames, ORIGIN, servePage, stillClock, tabKey } from './page.js';

/*
 * Focus moved once a change is drawn, by `moveFocus` and through React's `useFocusAfterDraw` and
 * `useArrivalFocus`, in Chromium, WebKit and Firefox: an id drawn after the request found, a target
 * gone, hidden, inert or off passed over for its fallbacks, focus a visitor moved since the request
 * left where it is, a control asked for twice focused twice, a request called off, one a long task
 * holds past a second on a page in sight landed, one whose frame comes more than ten seconds late
 * dropped, one asked while the page was out of sight, or before it went, dropped, a view that joins
 * views asked before the page went out of sight landed, and a view's heading focused when its key
 * changes but never as the page first draws. A press inside a frame of the page's own origin, one
 * added inside a frame, loaded again, still loading, added after the page's load, in its next page
 * before that page's load or written by the page among them, or inside an object, brings focus to
 * the view it opens, a key inside one leaves no press of the page's standing, focus entering a
 * frame inside a shadow root, a frame of another origin or a frame that went on to one leaves no
 * press of the page's standing either, with no page error, a press in a frame inside a shadow root
 * counts whether focus is read before its click or after a click it already heard, a keydown with
 * no key counts for nothing, a frame's document is heard once, and an id asked for from a widget's
 * shadow root, or from a frame inside one, is found in that root first and then in each root around
 * it out to the page, an id asked from a closed root is looked for from its host, and a page with
 * an element named host neither holds the walk nor throws. A request still waiting as its component
 * unmounts lands, from a row removed at once, after an await, from a timer or in a transition, from
 * a transition an urgent update overtook, on its fallback where the transition draws its target,
 * and from a component an `Activity` hides, unless the visitor moved focus first. One made in a
 * commit before its component goes lands, one asked from a ref as its component first draws lands,
 * one whose target an `Activity` hides with its component is held until it shows, one asked after
 * an await by a component that has gone lands, one asked late by a component in a shadow root since
 * gone finds an id only the page holds, and one asked once the visitor is on the next screen leaves
 * focus there, whatever place it names.
 *
 * A browser run headless cannot be sent out of sight, nor made to order its frames and its
 * visibility events as a real one does in each engine, so the tests that need the page out of sight
 * set what `document.hidden` and `document.visibilityState` read and send the event themselves, and
 * take the stand-ins away again.
 */

const BODY =
    '<main><button id="pressed">Save</button><button id="other">Other</button>' +
    '<div id="later"></div><button id="hidden" hidden>Hidden</button>' +
    '<div inert><button id="inert">Inert</button></div><button id="off" disabled>Off</button>' +
    '<h2 id="heading" tabindex="-1">Round 2</h2></main>';

const SCRIPT = `import { focusOnArrival, moveFocus } from './controls.js';
window.moveFocus = moveFocus;
window.focusOnArrival = focusOnArrival;
window.outOfSight = (hidden, told) => {
    Object.defineProperty(document, 'hidden', { value: hidden, configurable: true });
    const state = hidden ? 'hidden' : 'visible';
    Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
    if (told) document.dispatchEvent(new Event('visibilitychange'));
};
window.inSight = () => {
    delete document.hidden;
    delete document.visibilityState;
};
window.ready = true;`;

type Mover = {
    moveFocus: (
        target: string | Element | null,
        options?: { fallbacks?: readonly (string | Element | null)[]; from?: Element | null }
    ) => () => void;
    focusOnArrival: (heading: string, options?: { changed?: boolean }) => () => void;
    /** Sets what the page reads of its being in sight, and sends the event where `told`. */
    outOfSight: (hidden: boolean, told: boolean) => void;
    /** Takes away what `outOfSight` set, so the page reads its own state again. */
    inSight: () => void;
};

/**
 * Waits for what a late move of focus would take to land, before a check that focus stayed: React's
 * draw, a transition's among them, the frame `useFocusAfterDraw` waits for once its component has
 * gone and the frame of the `moveFocus` it calls, with frames to spare, all on the page's frames
 * rather than a fixed time.
 */
const settled = (page: Page) => frames(page, 6);

/**
 * Presses a button by Enter with focus on it, since Safari leaves focus off a button a pointer
 * presses.
 */
const press = async (page: Page, selector: string) => {
    await page.locator(selector).focus();
    await page.keyboard.press('Enter');
};

/** Calls one of the page's functions, in a task of its own. */
const run = (page: Page, name: string) =>
    page.evaluate((call) => {
        (window as unknown as Record<string, () => void>)[call]?.();
    }, name);

const open = async (page: Page) => {
    await servePage(page, { title: 'Focus', body: BODY, script: SCRIPT });
    await page.waitForFunction(() => 'ready' in window);
    await page.locator('#pressed').focus();
};

test('goes on to a fallback where the target holds focus already but refuses it', async ({
    page,
}) => {
    await open(page);
    // A section with no tabindex, which takes no focus, holding the button that has it.
    await page.evaluate(() => {
        document.body.insertAdjacentHTML(
            'beforeend',
            '<section id="results"><button type="button" id="inside">Inside</button></section>' +
                '<h2 id="found" tabindex="-1">Results</h2>'
        );
        document.querySelector<HTMLElement>('#inside')?.focus();
        (window as unknown as Mover).moveFocus('results', { fallbacks: ['found'] });
    });
    await expect(page.locator('#found')).toBeFocused();
});

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

test('lands a request whose frame a long task holds past a second, with the page in sight', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        (window as unknown as Mover).moveFocus('heading');
        // A render that holds the page longer than a second, as on a slow phone or a busy runner.
        const until = performance.now() + 1200;
        while (performance.now() < until);
    });
    await expect(page.locator('#heading')).toBeFocused();
});

test('drops a request whose frame comes more than ten seconds late, with the page in sight', async ({
    page,
}) => {
    await stillClock(page.clock);
    await open(page);
    await page.evaluate(() => {
        (window as unknown as Mover).moveFocus('heading');
    });
    // The frame runs only once the clock has jumped, as a frame held back with no event would.
    await page.clock.fastForward(10_500);
    await page.clock.runFor(100);
    await expect(page.locator('#pressed')).toBeFocused();
});

test('drops a request whose page went out of sight and came back before its frame', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        const mover = window as unknown as Mover;
        mover.moveFocus('heading');
        mover.outOfSight(true, true);
        mover.outOfSight(false, true);
        mover.inSight();
    });
    await settled(page);
    await expect(page.locator('#pressed')).toBeFocused();
});

test('drops a request whose page went out of sight before its frame, told of no return', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        const mover = window as unknown as Mover;
        mover.moveFocus('heading');
        mover.outOfSight(true, true);
        // Back in sight with no event yet, as where the waiting frame runs before the page is told.
        mover.inSight();
    });
    await settled(page);
    await expect(page.locator('#pressed')).toBeFocused();
});

test('drops a request whose frame runs while the page is out of sight', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
        const mover = window as unknown as Mover;
        mover.moveFocus('heading');
        mover.outOfSight(true, false);
    });
    await settled(page);
    await page.evaluate(() => {
        (window as unknown as Mover).inSight();
    });
    await expect(page.locator('#pressed')).toBeFocused();
});

test('drops a request asked while the page is out of sight, though its frame comes first', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        const mover = window as unknown as Mover;
        mover.outOfSight(true, false);
        mover.moveFocus('heading');
        // Back in sight with no event yet, as where a frame runs before the page is told.
        mover.inSight();
    });
    await settled(page);
    await expect(page.locator('#pressed')).toBeFocused();
});

test('lands a view that joins views asked before the page went out of sight and came back', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        const mover = window as unknown as Mover;
        mover.focusOnArrival('other', { changed: true });
        mover.outOfSight(true, true);
        mover.outOfSight(false, true);
        mover.inSight();
        mover.focusOnArrival('heading', { changed: true });
    });
    await expect(page.locator('#heading')).toBeFocused();
});

test('leaves focus a visitor moved since the request, and calls a request off', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        (window as unknown as Mover).moveFocus('heading');
        document.querySelector<HTMLElement>('#other')?.focus();
    });
    await settled(page);
    await expect(page.locator('#other')).toBeFocused();
    await page.evaluate(() => {
        const cancel = (window as unknown as Mover).moveFocus('heading');
        cancel();
    });
    await settled(page);
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
        await settled(page);
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

    test("focuses a view's heading when a press inside a shadow root changes its key", async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await press(page, '#shadow-bump');
        await expect(page.locator('#shadow-round')).toHaveText('Widget round 2');
        await expect(page.locator('#shadow-round')).toBeFocused();
    });

    test('moves focus asked for late, by an id inside a shadow root, by a component since gone', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await press(page, '#shadow-panel-close');
        await expect(page.locator('#shadow-panel-close')).toHaveCount(0);
        await page.evaluate(() => {
            (window as unknown as { answerShadow: () => void }).answerShadow();
        });
        await expect(page.locator('#shadow-panel-open')).toBeFocused();
    });

    test('moves focus asked for late, by an id only the page holds, by a component in a shadow root since gone', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await press(page, '#shadow-done');
        await expect(page.locator('#shadow-done')).toHaveCount(0);
        await page.evaluate(() => {
            (window as unknown as { answerShadowDone: () => void }).answerShadowDone();
        });
        await expect(page.locator('#shadow-results')).toBeFocused();
    });

    test('moves focus asked for after an await by a component that has since unmounted', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await press(page, '#panel-close');
        await expect(page.locator('#panel-close')).toHaveCount(0);
        await expect(page.locator('#panel-open')).toBeFocused();
    });

    test('moves focus asked for after an await by a component since gone to a link inside an inline svg', async ({
        page,
    }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await press(page, '#chart-close');
        await expect(page.locator('#chart-close')).toHaveCount(0);
        await expect(page.locator('#chart-open')).toBeFocused();
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
        await settled(page);
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
        await settled(page);
        await expect(page.locator('#mode-cards')).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await expect(page.locator('#view-number')).toBeVisible();
        await settled(page);
        await expect(page.locator('#mode-number')).toBeFocused();
    });

    test('keeps focus on a tab chosen by a press or by Enter', async ({ page }) => {
        await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
        await page.locator('#mode-cards').click();
        await expect(page.locator('#view-cards')).toBeVisible();
        await settled(page);
        await expect(page.locator('#mode-cards')).toBeFocused();
        await page.locator('#mode-number').focus();
        await page.keyboard.press('Enter');
        await expect(page.locator('#view-number')).toBeVisible();
        await settled(page);
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
        await settled(page);
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
        await settled(page);
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
        await settled(page);
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
        await settled(page);
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

    for (const asking of ['a request after the draw', "a view's arrival"] as const)
        test(`leaves focus where a visitor moved it between two controls of a frame, after ${asking} asked from the first`, async ({
            page,
        }) => {
            await stillClock(page.clock);
            await servePage(page, { title: 'Focus', body: '<div id="root"></div>', script: app });
            const inner = page.frameLocator('iframe[title="Moves"]');
            await expect(inner.locator('#frame-b')).toBeAttached();
            await inner.locator('#frame-a').focus();
            await page.evaluate((how) => {
                const asks = window as unknown as {
                    askFromFrame: () => void;
                    nextFrameRound: () => void;
                };
                if (how === 'a request after the draw') asks.askFromFrame();
                else asks.nextFrameRound();
            }, asking);
            // The render and its effects run on React's own scheduler, which the still clock
            // leaves alone, while the frame the request waits for is held.
            await expect(page.locator('#frame-round')).toHaveText(
                asking === "a view's arrival" ? 'Frame round 2' : 'Frame round 1'
            );
            await page.evaluate(() => new Promise((done) => queueMicrotask(() => done(null))));
            await inner.locator('#frame-b').focus();
            await page.clock.runFor(100);
            await expect(page.locator('#frame-target')).not.toBeFocused();
            await expect(page.locator('#frame-round')).not.toBeFocused();
            await expect(inner.locator('#frame-b')).toBeFocused();
        });

    test('adds no listener however often a view is drawn before any press', async ({ page }) => {
        await openCounted(page, {
            clock: false,
            ready: false,
            title: 'Focus',
            body: '<div id="root"></div>',
            script: app,
        });
        await expect(page.locator('#again')).toHaveAttribute('data-count', '0');
        const everywhere = '[window, document, ...document.querySelectorAll("*")]';
        const before = await listenersOn(page, everywhere);
        await page.evaluate(() => {
            (window as unknown as { drawAgain: () => void }).drawAgain();
        });
        await expect(page.locator('#again')).toHaveAttribute('data-count', '20');
        expect(await listenersOn(page, everywhere)).toBe(before);
    });
});

for (const editor of ['an editable body', 'a body in design mode'] as const) {
    test(`leaves focus a visitor put in a frame's editor with ${editor}, as a request lands`, async ({
        page,
    }) => {
        await servePage(page, {
            title: 'Focus',
            body:
                '<button type="button" id="start">Start</button><button type="button" id="target">Target</button>' +
                '<iframe title="Notes" srcdoc="<p>Ana dealt.</p>"></iframe>',
            script: `import { moveFocus } from './controls.js';
window.moveFocus = moveFocus;
const frame = document.querySelector('iframe');
if (frame.contentDocument?.readyState !== 'complete' || !frame.contentDocument.querySelector('p'))
    await new Promise((loaded) => frame.addEventListener('load', loaded, { once: true }));
if (${String(editor === 'a body in design mode')}) frame.contentDocument.designMode = 'on';
else frame.contentDocument.body.contentEditable = 'true';
window.ready = true;`,
        });
        await page.waitForFunction(() => 'ready' in window);
        await page.locator('#start').focus();
        // The visitor goes on to type in the frame's editor, and a request asked with focus where it
        // was before lands after.
        await page.frameLocator('iframe').locator('body').click();
        await page.evaluate(() => {
            (window as unknown as Mover).moveFocus('target', {
                from: document.querySelector('#start'),
            });
        });
        await settled(page);
        await expect(page.locator('#target')).not.toBeFocused();
        await expect(page.locator('iframe')).toBeFocused();
        await expect(page.frameLocator('iframe').locator('body')).toBeFocused();
    });
}

/** A page with a target of its own and a frame whose control has focus, with an id the page shares. */
const openWithFrame = async (page: Page) => {
    await servePage(page, {
        title: 'Focus',
        body:
            '<p id="save-error" tabindex="-1">The round was not saved.</p>' +
            '<button type="button" id="target">Target</button>' +
            '<iframe title="Notes" srcdoc="<button type=button id=inner>Inside</button><button type=button id=other>Other</button><p id=save-error tabindex=-1>The frame' +
            "'" +
            's own.</p>"></iframe>',
        script: `import { moveFocus } from './controls.js';
window.moveFocus = moveFocus;
const frame = document.querySelector('iframe');
if (frame.contentDocument?.readyState !== 'complete' || !frame.contentDocument.querySelector('#inner'))
    await new Promise((loaded) => frame.addEventListener('load', loaded, { once: true }));
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    await page.frameLocator('iframe').locator('#inner').focus();
};

test("finds a request's id on the page, where focus was on a control in a frame as it was asked", async ({
    page,
}) => {
    await openWithFrame(page);
    await page.evaluate(() => {
        (window as unknown as Mover).moveFocus('save-error');
    });
    await expect(page.locator('#save-error')).toBeFocused();
});

test('lands a request asked from inside a frame that leaves the page before the request lands', async ({
    page,
}) => {
    await openWithFrame(page);
    await page.evaluate(() => {
        (window as unknown as Mover).moveFocus('target');
        document.querySelector('iframe')?.remove();
    });
    await expect(page.locator('#target')).toBeFocused();
});

test('leaves focus where a visitor moved it between two controls of a frame, as a request asked from the first lands', async ({
    page,
}) => {
    await openWithFrame(page);
    await page.evaluate(() => {
        (window as unknown as Mover).moveFocus('target');
        document
            .querySelector('iframe')
            ?.contentDocument?.querySelector<HTMLElement>('#other')
            ?.focus();
    });
    await settled(page);
    await expect(page.locator('#target')).not.toBeFocused();
    await expect(page.frameLocator('iframe').locator('#other')).toBeFocused();
});

test("finds a request's id on the page where it is given a control in a frame as where focus was", async ({
    page,
}) => {
    await openWithFrame(page);
    await page.evaluate(() => {
        const inner = document.querySelector('iframe')?.contentDocument?.querySelector('#inner');
        (window as unknown as Mover).moveFocus('save-error', { from: inner ?? null });
    });
    await expect(page.locator('#save-error')).toBeFocused();
    await expect(page.frameLocator('iframe').locator('#save-error')).not.toBeFocused();
});

test('lands a request asked from inside a frame that loads another page before the request lands', async ({
    page,
}) => {
    // The frame the request waits for is held until the frame has loaded its new page.
    await stillClock(page.clock);
    await openWithFrame(page);
    await page.evaluate(async () => {
        const frame = document.querySelector('iframe');
        if (!frame) return;
        (window as unknown as Mover).moveFocus('target');
        const loaded = new Promise((done) => {
            frame.addEventListener('load', done, { once: true });
        });
        frame.srcdoc = '<p>The frame loaded again.</p>';
        await loaded;
    });
    await page.clock.runFor(100);
    await expect(page.locator('#target')).toBeFocused();
});

test('lands a request asked from inside a frame the page hides before the request lands', async ({
    page,
}) => {
    await openWithFrame(page);
    await page.evaluate(() => {
        (window as unknown as Mover).moveFocus('target');
        const frame = document.querySelector('iframe');
        if (frame) frame.hidden = true;
    });
    await expect(page.locator('#target')).toBeFocused();
});

/**
 * A page with headings of its own and widgets that draw their buttons in shadow roots, as Lit,
 * Shoelace and Material Web do: one in an open root with a heading that shares an id with the
 * page's and a widget nested in it, one in a closed root with a heading of its own and one that
 * shares an id with the page's, and a frame in an open root. Each button in an open root asks for
 * focus by id as its view arrives.
 */
const openWithWidgets = async (page: Page) => {
    await servePage(page, {
        title: 'Focus',
        body:
            '<main><h2 id="scores" tabindex="-1">Scores</h2><h2 id="round" tabindex="-1">Round</h2>' +
            '<div id="widget"></div><div id="shut"></div><div id="framed"></div></main>',
        script: `import { focusOnArrival, moveFocus } from './controls.js';
window.moveFocus = moveFocus;
const asks = (root) => {
    for (const button of root.querySelectorAll('[data-asks]'))
        button.addEventListener('click', () => focusOnArrival(button.dataset.asks));
};
const widget = document.querySelector('#widget').attachShadow({ mode: 'open' });
widget.innerHTML =
    '<button type="button" id="bring" data-asks="scores">Bring the scores</button>' +
    '<button type="button" id="bring-round" data-asks="round">Bring the round</button>' +
    '<h3 id="round" tabindex="-1">Widget round</h3><span id="nested"></span>';
asks(widget);
const nested = widget.querySelector('#nested').attachShadow({ mode: 'open' });
nested.innerHTML =
    '<button type="button" id="deep-round" data-asks="round">Bring the round from deep</button>' +
    '<button type="button" id="deep-scores" data-asks="scores">Bring the scores from deep</button>';
asks(nested);
const shut = document.querySelector('#shut').attachShadow({ mode: 'closed' });
shut.innerHTML =
    '<button type="button" id="shut-bring">Bring</button><h3 id="shut-own" tabindex="-1">Own</h3>' +
    '<h3 id="scores" tabindex="-1">Widget scores</h3>';
window.shut = shut;
const frame = document.createElement('iframe');
frame.title = 'Notes';
frame.srcdoc = '<button type=button id=inner>Inside</button>';
const loaded = new Promise((done) => frame.addEventListener('load', done, { once: true }));
document.querySelector('#framed').attachShadow({ mode: 'open' }).append(frame);
await loaded;
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
};

test("focuses a heading on the page that a widget's button in an open shadow root asks for by id", async ({
    page,
}) => {
    await openWithWidgets(page);
    await press(page, '#bring');
    await expect(page.locator('#scores')).toBeFocused();
});

test("finds a widget's own id in its shadow root before the same id on the page", async ({
    page,
}) => {
    await openWithWidgets(page);
    await press(page, '#bring-round');
    await expect(page.locator('#widget #round')).toBeFocused();
    await expect(page.locator('main > #round')).not.toBeFocused();
});

test('finds an id in the nearest root outward from a nested shadow root, then on the page', async ({
    page,
}) => {
    await openWithWidgets(page);
    // The widget around the nested one holds a heading of the id the page shares, and is nearer.
    await press(page, '#deep-round');
    await expect(page.locator('#widget #round')).toBeFocused();
    await press(page, '#deep-scores');
    await expect(page.locator('#scores')).toBeFocused();
});

test("finds an id on the page from a closed shadow root, read as its host, and never one of the root's", async ({
    page,
}) => {
    await openWithWidgets(page);
    const ask = (id: string) =>
        page.evaluate((asked) => {
            const { shut } = window as unknown as { shut: ShadowRoot };
            shut.querySelector<HTMLElement>('#shut-bring')?.focus();
            (window as unknown as Mover).moveFocus(asked);
        }, id);
    const focused = () =>
        page.evaluate(() => {
            const { shut } = window as unknown as { shut: ShadowRoot };
            return (shut.activeElement ?? document.activeElement)?.id;
        });
    // Focus inside a closed root reads as its host, so the walk starts in the root the host is in.
    await ask('shut-own');
    await settled(page);
    expect(await focused()).toBe('shut-bring');
    // The closed root holds a heading of the id the page's has, and the page's takes focus.
    await ask('scores');
    await expect(page.locator('main > #scores')).toBeFocused();
    expect(
        await page.evaluate(() => (window as unknown as { shut: ShadowRoot }).shut.activeElement)
    ).toBeNull();
});

for (const named of ['<form name="host"></form>', '<iframe name="host" title="Notes"></iframe>'])
    test(`finds an id on a page holding ${named}, past an id it lacks, with no page error`, async ({
        page,
    }) => {
        // A walk that never ends holds the page, so the test fails at its own time rather than hang.
        test.setTimeout(15_000);
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await servePage(page, {
            title: 'Focus',
            body: `<main><button type="button" id="start">Start</button>${named}<h2 id="scores" tabindex="-1">Scores</h2></main>`,
            script: `import { moveFocus } from './controls.js';
window.moveFocus = moveFocus;
window.ready = true;`,
        });
        await page.waitForFunction(() => 'ready' in window);
        await page.locator('#start').focus();
        // A document gives its named elements as properties, so one named host answers for a host.
        await page.evaluate(() => {
            (window as unknown as Mover).moveFocus('missing');
        });
        await settled(page);
        await page.evaluate(() => {
            (window as unknown as Mover).moveFocus('scores');
        });
        await expect(page.locator('#scores')).toBeFocused({ timeout: 3000 });
        expect(errors).toEqual([]);
    });

test("finds a request's id on the page, where focus was in a frame inside a shadow root", async ({
    page,
}) => {
    await openWithWidgets(page);
    await page.frameLocator('#framed iframe').locator('#inner').focus();
    await page.evaluate(() => {
        (window as unknown as Mover).moveFocus('scores');
    });
    await expect(page.locator('#scores')).toBeFocused();
});

/**
 * A page with a view it brings a second after a press, and a frame of its own origin with two
 * controls, the first of which brings the view too.
 */
const openWithArrival = async (page: Page) => {
    await stillClock(page.clock);
    await servePage(page, {
        title: 'Focus',
        body:
            '<button type="button" id="bring">Bring the scores</button>' +
            '<button type="button" id="bring-only">Bring the scores here</button>' +
            '<h2 id="scores" tabindex="-1" hidden>Scores</h2>' +
            '<iframe title="Notes" srcdoc="<button type=button id=first>First</button><button type=button id=second>Second</button><input id=note aria-label=Note>"></iframe>',
        script: `import { focusOnArrival } from './controls.js';
const frame = document.querySelector('iframe');
if (frame.contentDocument?.readyState !== 'complete' || !frame.contentDocument.querySelector('#second'))
    await new Promise((loaded) => frame.addEventListener('load', loaded, { once: true }));
const inner = frame.contentDocument;
const bring = () => {
    setTimeout(() => {
        document.querySelector('#scores').hidden = false;
        focusOnArrival('scores');
    }, 1000);
};
// The page's button brings the view and takes the visitor into the frame, as a page that opens its
// notes beside the scores does.
document.querySelector('#bring').addEventListener('click', () => {
    inner.querySelector('#first').focus();
    bring();
});
inner.querySelector('#first').addEventListener('click', bring);
document.querySelector('#bring-only').addEventListener('click', bring);
window.bring = bring;
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
};

test('leaves focus in a frame where the visitor tabbed after a press on the page, as the view it brought arrives', async ({
    page,
    browserName,
}) => {
    await openWithArrival(page);
    await press(page, '#bring');
    const inner = page.frameLocator('iframe');
    await expect(inner.locator('#first')).toBeFocused();
    await page.keyboard.press(tabKey(browserName));
    await expect(inner.locator('#second')).toBeFocused();
    await page.clock.runFor(1100);
    await expect(page.locator('#scores')).toBeVisible();
    await page.clock.runFor(100);
    await expect(page.locator('#scores')).not.toBeFocused();
    await expect(inner.locator('#second')).toBeFocused();
});

test("focuses a view's heading as it arrives, brought by a press on a control inside a frame", async ({
    page,
}) => {
    await openWithArrival(page);
    const inner = page.frameLocator('iframe');
    await inner.locator('#first').focus();
    await page.keyboard.press('Enter');
    await page.clock.runFor(1100);
    await expect(page.locator('#scores')).toBeVisible();
    await page.clock.runFor(100);
    await expect(page.locator('#scores')).toBeFocused();
});

for (const where of ['a frame that loaded another page', 'a frame the page added inside a frame'])
    test(`focuses a view's heading as it arrives, brought by a press inside ${where}`, async ({
        page,
    }) => {
        await openWithArrival(page);
        await page.evaluate(async (nested) => {
            const frame = document.querySelector('iframe');
            const holder = nested ? frame?.contentDocument?.createElement('iframe') : frame;
            if (!frame || !holder) return;
            const loaded = new Promise((done) => {
                holder.addEventListener('load', done, { once: true });
            });
            holder.srcdoc = '<button type="button" id="later">Later</button>';
            if (nested) frame.contentDocument?.body.append(holder);
            await loaded;
            holder.contentDocument
                ?.querySelector('#later')
                ?.addEventListener('click', (window as unknown as { bring: () => void }).bring);
        }, where === 'a frame the page added inside a frame');
        const inner =
            where === 'a frame that loaded another page'
                ? page.frameLocator('iframe')
                : page.frameLocator('iframe').frameLocator('iframe');
        await inner.locator('#later').focus();
        await page.keyboard.press('Enter');
        await page.clock.runFor(1100);
        await expect(page.locator('#scores')).toBeVisible();
        await page.clock.runFor(100);
        await expect(page.locator('#scores')).toBeFocused();
    });

test("hears a frame's document once, however often the frame is reached", async ({ page }) => {
    await openCounted(page, {
        clock: false,
        title: 'Focus',
        body: '<iframe title="Notes" srcdoc="<button type=button>Inside</button>"></iframe>',
        script: `import './controls.js';
const frame = document.querySelector('iframe');
if (frame.contentDocument?.readyState !== 'complete' || !frame.contentDocument.querySelector('button'))
    await new Promise((loaded) => frame.addEventListener('load', loaded, { once: true }));
window.frame = frame;
window.ready = true;`,
    });
    const inFrame = (): Promise<number> =>
        page.evaluate('frame.contentWindow.leaks.counts().documentListeners');
    const page0 = await leaksOf(page);
    const heard = await inFrame();
    expect(heard).toBeGreaterThan(0);
    await page.evaluate(() => {
        const frame = document.querySelector('iframe');
        for (let time = 0; time < 3; time += 1) frame?.dispatchEvent(new Event('load'));
    });
    expect(await inFrame()).toBe(heard);
    expect((await leaksOf(page)).documentListeners).toBe(page0.documentListeners);
});

test('leaves focus in a field of a frame the visitor clicked and typed in after a press on the page, as the view it brought arrives', async ({
    page,
}) => {
    await openWithArrival(page);
    await page.locator('#bring-only').click();
    const inner = page.frameLocator('iframe');
    await inner.locator('#note').click();
    await page.keyboard.type('A');
    await page.clock.runFor(1100);
    await expect(page.locator('#scores')).toBeVisible();
    await page.clock.runFor(100);
    await expect(page.locator('#scores')).not.toBeFocused();
    await expect(inner.locator('#note')).toBeFocused();
});

test('takes a keydown with no key, as autofill sends, for no input and throws nothing', async ({
    page,
}) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await openWithArrival(page);
    await page.locator('#bring-only').click();
    await page.evaluate(() => {
        const inner = document.querySelector('iframe')?.contentDocument;
        for (const target of [document.body, inner?.querySelector('#note')])
            target?.dispatchEvent(new Event('keydown', { bubbles: true }));
    });
    await page.clock.runFor(1100);
    await expect(page.locator('#scores')).toBeVisible();
    await page.clock.runFor(100);
    await expect(page.locator('#scores')).toBeFocused();
    expect(errors).toEqual([]);
});

/** The page a frame shows, with a control and a picture the server holds back. */
const NOTES = '<!doctype html><title>Notes</title><button type="button" id="later">Later</button>';

for (const how of ['a frame of the page still loading', 'a frame the page writes'] as const)
    test(`focuses a view's heading as it arrives, brought by a press inside ${how}`, async ({
        page,
    }) => {
        await stillClock(page.clock);
        const slow = how === 'a frame of the page still loading';
        const shown = slow ? '<iframe title="Notes" src="/notes.html"></iframe>' : '';
        // The frame's page and its picture are the page's routes, which come before the context's.
        await page.route('**/held.png', () => undefined);
        await page.route('**/notes.html', (route) =>
            route.fulfill({
                contentType: 'text/html',
                body: slow ? `${NOTES}<img src="/held.png" alt="">` : NOTES,
            })
        );
        await servePage(page.context(), {
            title: 'Focus',
            body: `<h2 id="scores" tabindex="-1" hidden>Scores</h2>${shown}`,
            script: `import { focusOnArrival } from './controls.js';
window.bring = () => {
    setTimeout(() => {
        document.querySelector('#scores').hidden = false;
        focusOnArrival('scores');
    }, 1000);
};
if (${String(!slow)}) {
    const frame = document.createElement('iframe');
    frame.title = 'Notes';
    document.body.append(frame);
    const inner = frame.contentDocument;
    inner.open();
    inner.write(${JSON.stringify(NOTES)});
    inner.close();
}
window.ready = true;`,
        });
        // The picture never comes, so a frame showing it is still loading as the visitor presses.
        await page.goto(`${ORIGIN}/`, { waitUntil: 'commit' });
        await page.waitForFunction(() => 'ready' in window);
        await expect
            .poll(() =>
                page.evaluate(() =>
                    Boolean(
                        document.querySelector('iframe')?.contentDocument?.querySelector('#later')
                    )
                )
            )
            .toBe(true);
        const loading = await page.evaluate(() => {
            const inner = document.querySelector('iframe')?.contentDocument;
            const later = inner?.querySelector<HTMLElement>('#later');
            later?.addEventListener('click', (window as unknown as { bring: () => void }).bring);
            later?.focus();
            return inner?.readyState !== 'complete';
        });
        expect(loading).toBe(slow);
        await page.keyboard.press('Enter');
        await page.clock.runFor(1100);
        await expect(page.locator('#scores')).toBeVisible();
        await page.clock.runFor(100);
        await expect(page.locator('#scores')).toBeFocused();
    });

for (const how of [
    'pressed by pointer',
    'clicked by the page, loaded before the controls',
] as const)
    test(`focuses a view's heading as it arrives, brought by a press inside an object showing a page of the page's origin, ${how}`, async ({
        page,
    }) => {
        const early = how !== 'pressed by pointer';
        // Firefox loads an object's page past a test's routes, so a server of the test's own serves
        // it, at the origin the page is served from.
        const server = createServer((_, response) => {
            response.setHeader('content-type', 'text/html');
            response.end(NOTES);
        });
        server.listen(0, '127.0.0.1');
        await once(server, 'listening');
        const { port } = server.address() as AddressInfo;
        try {
            await stillClock(page.clock);
            const origin = `http://127.0.0.1:${String(port)}`;
            // The page's route, which comes before the context's, sends the object's page to the
            // server.
            await page.route('**/notes.html', (route) => route.continue());
            // Loaded before the controls, the object is found only by the walk as they load, and a
            // click the page's script makes in it moves no focus, so nothing else finds it.
            await servePage(page.context(), {
                origin,
                title: 'Focus',
                body:
                    '<h2 id="scores" tabindex="-1" hidden>Scores</h2>' +
                    '<object data="/notes.html" type="text/html" title="Notes"></object>',
                script: `const shown = document.querySelector('object');
if (${String(early)} && !shown.contentDocument?.querySelector('#later'))
    await new Promise((loaded) => shown.addEventListener('load', loaded, { once: true }));
const { focusOnArrival } = await import('./controls.js');
window.bring = () => {
    setTimeout(() => {
        document.querySelector('#scores').hidden = false;
        focusOnArrival('scores');
    }, 1000);
};
window.ready = true;`,
            });
            await page.goto(`${origin}/`);
            await page.waitForFunction(() => 'ready' in window);
            await expect
                .poll(() =>
                    page.evaluate(() =>
                        Boolean(
                            document
                                .querySelector<HTMLObjectElement>('object')
                                ?.contentDocument?.querySelector('#later')
                        )
                    )
                )
                .toBe(true);
            // Playwright lists no frame for an object in Firefox, so a press by pointer is made
            // where the button is drawn.
            const at = await page.evaluate((scripted) => {
                const shown = document.querySelector<HTMLObjectElement>('object');
                const later = shown?.contentDocument?.querySelector<HTMLElement>('#later');
                later?.addEventListener('click', () => {
                    (window as unknown as { bring: () => void }).bring();
                });
                if (scripted) later?.click();
                const outer = shown?.getBoundingClientRect();
                const inner = later?.getBoundingClientRect();
                return outer && inner
                    ? {
                          x: outer.x + inner.x + inner.width / 2,
                          y: outer.y + inner.y + inner.height / 2,
                      }
                    : null;
            }, early);
            if (!at) throw new Error("expected the object's button to be drawn");
            if (!early) await page.mouse.click(at.x, at.y);
            await page.clock.runFor(1100);
            await expect(page.locator('#scores')).toBeVisible();
            await page.clock.runFor(100);
            await expect(page.locator('#scores')).toBeFocused();
        } finally {
            server.close();
        }
    });

/**
 * A frame's page with a field, a control that brings the view and a picture the server holds back,
 * so the page is still loading as the visitor presses in it.
 */
const HELD =
    '<!doctype html><title>Notes</title><input id="note" aria-label="Note">' +
    '<button type="button" id="later">Later</button><img src="/held.png" alt="">' +
    "<script>document.querySelector('#later').addEventListener('click', () => top.bring());</script>";

/** A frame's page with a form that brings the view as it is sent to a page of another origin. */
const SENDS =
    '<!doctype html><title>Card</title><form action="https://other.test/check">' +
    '<input id="card" aria-label="Card"><button id="send">Send</button></form>' +
    "<script>document.querySelector('form').addEventListener('submit', () => top.bring());</script>";

/** A page of another origin with a field, as a payment field or a bank's check is. */
const FAR = '<!doctype html><title>Check</title><input id="code" aria-label="Code">';

/**
 * A page with a button that brings a view a second after its press, the frames given, the pages
 * they show served by the page's routes, and a host with an open shadow root holding a frame with a
 * field and a button that brings the view, as a widget drawn in a shadow root holds a frame, and
 * one with a closed root holding another, which the page keeps a hold of for the test to reach. The
 * view names its heading by the element, since an id is looked for where focus was, which in that
 * frame is the shadow root. The page's own load waits on a picture that never comes, so the test
 * goes to the page without waiting for it.
 */
const openWithFrames = async (page: Page, frames = '') => {
    await stillClock(page.clock);
    await page.route('**/held.png', () => undefined);
    await page.route('**/notes.html', (route) =>
        route.fulfill({ contentType: 'text/html', body: HELD })
    );
    await page.route('**/card.html', (route) =>
        route.fulfill({ contentType: 'text/html', body: SENDS })
    );
    await page.route('https://other.test/**', (route) =>
        route.fulfill({ contentType: 'text/html', body: FAR })
    );
    await servePage(page.context(), {
        title: 'Focus',
        body:
            '<button type="button" id="bring">Bring the scores</button>' +
            '<h2 id="scores" tabindex="-1" hidden>Scores</h2><div id="host"></div>' +
            '<div id="shut"></div>' +
            frames,
        script: `import { focusOnArrival } from './controls.js';
window.bring = () => {
    setTimeout(() => {
        document.querySelector('#scores').hidden = false;
        focusOnArrival(document.querySelector('#scores'));
    }, 1000);
};
document.querySelector('#bring').addEventListener('click', window.bring);
const shadowed = document.createElement('iframe');
shadowed.title = 'Widget';
shadowed.srcdoc = '<input id=widget aria-label=Widget><button type=button id=go>Go</button>';
const closed = document.createElement('iframe');
closed.title = 'Closed';
closed.srcdoc = '<input id=shut aria-label=Shut>';
const loaded = Promise.all(
    [shadowed, closed].map((frame) => new Promise((done) => frame.addEventListener('load', done, { once: true })))
);
document.querySelector('#host').attachShadow({ mode: 'open' }).append(shadowed);
document.querySelector('#shut').attachShadow({ mode: 'closed' }).append(closed);
window.shut = closed;
await loaded;
shadowed.contentDocument.querySelector('#go').addEventListener('click', window.bring);
window.ready = true;`,
    });
    await page.goto(`${ORIGIN}/`, { waitUntil: 'commit' });
    await page.waitForFunction(() => 'ready' in window);
};

/** Lets the view arrive a second after the press that brought it, and its request land. */
const arrive = async (page: Page) => {
    await page.clock.runFor(1100);
    await expect(page.locator('#scores')).toBeVisible();
    await page.clock.runFor(100);
};

/** The page's errors, gathered from now on. */
const errorsOf = (page: Page): string[] => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    return errors;
};

test('leaves focus in a field of a frame inside a shadow root the visitor clicked and typed in after a press on the page, as the view arrives', async ({
    page,
}) => {
    await openWithFrames(page);
    await press(page, '#bring');
    const widget = page.frameLocator('#host iframe').locator('#widget');
    await widget.click();
    await page.keyboard.type('A');
    await arrive(page);
    await expect(page.locator('#scores')).not.toBeFocused();
    await expect(widget).toBeFocused();
});

test('never takes focus from a field of a frame inside a shadow root pressed with no pause after a press on the page', async ({
    page,
}) => {
    await openWithFrames(page);
    await press(page, '#bring');
    const widget = page.frameLocator('#host iframe').locator('#widget');
    const { x, y, width, height } = await box(widget, 'the field in the frame');
    await page.mouse.move(x + width / 2, y + height / 2);
    // Down and up with nothing between, so the click comes as soon after focus enters as it can.
    await page.mouse.down();
    await page.mouse.up();
    await expect(widget).toBeFocused();
    await arrive(page);
    await expect(page.locator('#scores')).not.toBeFocused();
    await expect(widget).toBeFocused();
});

test("focuses a view's heading for a press in a frame inside a shadow root first entered by that press, read between down and up", async ({
    page,
}) => {
    await openWithFrames(page);
    const go = page.frameLocator('#host iframe').locator('#go');
    const { x, y, width, height } = await box(go, 'the button in the frame');
    await page.mouse.move(x + width / 2, y + height / 2);
    await page.mouse.down();
    // The clock moves timers alone, so a read put off a task comes here, before the click.
    await page.clock.runFor(1);
    await page.mouse.up();
    await arrive(page);
    await expect(page.locator('#scores')).toBeFocused();
});

test("focuses a view's heading for a press with no pause in a frame inside a shadow root heard before, after a click on the page", async ({
    page,
}) => {
    await openWithFrames(page);
    const frame = page.frameLocator('#host iframe');
    await frame.locator('#widget').click();
    await page.clock.runFor(10);
    // Back on the page, as a visitor who clicked the page between two visits to the frame.
    await page.mouse.click(1000, 600);
    await page.clock.runFor(10);
    await expect(frame.locator('#widget')).not.toBeFocused();
    const { x, y, width, height } = await box(frame.locator('#go'), 'the button in the frame');
    await page.mouse.move(x + width / 2, y + height / 2);
    await page.mouse.down();
    await page.mouse.up();
    await arrive(page);
    await expect(page.locator('#scores')).toBeFocused();
});

test('leaves focus in a field of a frame inside a closed shadow root the visitor clicked into after a press on the page, as the view arrives', async ({
    page,
}) => {
    await openWithFrames(page);
    await press(page, '#bring');
    // Playwright reaches no frame inside a closed root, so the press is made where the field is.
    const at = await page.evaluate(() => {
        const frame = (window as unknown as { shut: HTMLIFrameElement }).shut;
        const outer = frame.getBoundingClientRect();
        const inner = frame.contentDocument?.querySelector('#shut')?.getBoundingClientRect();
        return inner
            ? { x: outer.x + inner.x + inner.width / 2, y: outer.y + inner.y + inner.height / 2 }
            : null;
    });
    if (!at) throw new Error('expected the field in the closed root to be drawn');
    await page.mouse.click(at.x, at.y);
    const inClosed = () =>
        page.evaluate(() => {
            const frame = (window as unknown as { shut: HTMLIFrameElement }).shut;
            return (
                frame.contentDocument?.activeElement?.id === 'shut' &&
                frame.contentDocument.hasFocus()
            );
        });
    expect(await inClosed()).toBe(true);
    await arrive(page);
    await expect(page.locator('#scores')).not.toBeFocused();
    expect(await inClosed()).toBe(true);
});

test("focuses a view's heading as it arrives, brought by a press in a frame the page added after its load, whose page is still loading", async ({
    page,
}) => {
    await openWithFrames(page);
    await page.evaluate(() => {
        const frame = document.createElement('iframe');
        frame.title = 'Notes';
        frame.src = '/notes.html';
        document.body.append(frame);
    });
    const later = page.frameLocator('iframe[title="Notes"]').locator('#later');
    await expect(later).toBeAttached();
    expect(
        await page.evaluate(
            () =>
                document.querySelector<HTMLIFrameElement>('iframe[title="Notes"]')?.contentDocument
                    ?.readyState
        )
    ).not.toBe('complete');
    await later.click();
    await arrive(page);
    await expect(page.locator('#scores')).toBeFocused();
});

test("focuses a view's heading as it arrives, brought by a press in a frame's next page before its load, with focus in the frame", async ({
    page,
}) => {
    await openWithFrames(page, '<iframe title="Card" src="/card.html"></iframe>');
    const frame = page.frameLocator('iframe[title="Card"]');
    await expect(frame.locator('#card')).toBeAttached();
    // Focus stays in the frame as it goes on, so no move of focus brings the next page to the page.
    await frame.locator('#card').focus();
    await page.evaluate(() => {
        const frame = document.querySelector<HTMLIFrameElement>('iframe[title="Card"]');
        if (frame?.contentWindow) frame.contentWindow.location.href = '/notes.html';
    });
    const later = frame.locator('#later');
    await expect(later).toBeAttached();
    // The frame's next page is read a task after it goes, and the visitor presses a moment later.
    await page.clock.runFor(10);
    expect(
        await page.evaluate(() => {
            const frame = document.querySelector<HTMLIFrameElement>('iframe[title="Card"]');
            return {
                focused: document.activeElement === frame,
                loading: frame?.contentDocument?.readyState !== 'complete',
            };
        })
    ).toEqual({ focused: true, loading: true });
    await later.click();
    await arrive(page);
    await expect(page.locator('#scores')).toBeFocused();
});

test('leaves focus in a frame of another origin the visitor clicked into after a press on the page, as the view arrives', async ({
    page,
}) => {
    await openWithFrames(page, '<iframe title="Pay" src="https://other.test/pay"></iframe>');
    const code = page.frameLocator('iframe[title="Pay"]').locator('#code');
    await expect(code).toBeAttached();
    await press(page, '#bring');
    await code.click();
    await arrive(page);
    await expect(page.locator('#scores')).not.toBeFocused();
    await expect(code).toBeFocused();
});

test('leaves focus in a frame whose form went on to a page of another origin with focus inside, as the view the submit brought arrives', async ({
    page,
}) => {
    const errors = errorsOf(page);
    await openWithFrames(page, '<iframe title="Card" src="/card.html"></iframe>');
    const frame = page.frameLocator('iframe[title="Card"]');
    await frame.locator('#card').click();
    await page.keyboard.type('4');
    await frame.locator('#send').click();
    const code = frame.locator('#code');
    await expect(code).toBeAttached();
    // The frame's next page is read a task after it goes.
    await page.clock.runFor(10);
    await code.click();
    await arrive(page);
    await expect(page.locator('#scores')).not.toBeFocused();
    await expect(code).toBeFocused();
    expect(errors).toEqual([]);
});

test('raises no error for a frame taken from the page while its next page is read', async ({
    page,
}) => {
    const errors = errorsOf(page);
    await openWithFrames(page, '<iframe title="Card" src="/card.html"></iframe>');
    await expect(page.frameLocator('iframe[title="Card"]').locator('#card')).toBeAttached();
    await page.evaluate(() => {
        const frame = document.querySelector<HTMLIFrameElement>('iframe[title="Card"]');
        if (frame?.contentWindow) frame.contentWindow.location.href = '/notes.html';
    });
    await expect(page.frameLocator('iframe[title="Card"]').locator('#later')).toBeAttached();
    await page.evaluate(() => document.querySelector('iframe[title="Card"]')?.remove());
    await page.clock.runFor(100);
    expect(errors).toEqual([]);
});

test('raises no error as the page is left and gone back to', async ({ page }) => {
    const errors = errorsOf(page);
    await openWithFrames(page, '<iframe title="Card" src="/card.html"></iframe>');
    await expect(page.frameLocator('iframe[title="Card"]').locator('#card')).toBeAttached();
    await page.goto(`${ORIGIN}/away`, { waitUntil: 'commit' });
    await page.goBack({ waitUntil: 'commit' });
    await page.waitForFunction(() => 'ready' in window);
    await page.clock.runFor(100);
    expect(errors).toEqual([]);
});
