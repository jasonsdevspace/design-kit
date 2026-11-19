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
