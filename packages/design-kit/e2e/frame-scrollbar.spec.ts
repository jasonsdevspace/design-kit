import { expect, test } from '@playwright/test';

import { servePage, stillClock } from './page.js';

/*
 * A press on the page stands through a mousedown on the scrollbar of a frame of another origin, in
 * Chromium and WebKit, where the scrollbar takes no focus and the page keeps it, as a scroll on
 * the page leaves a press standing. Chromium draws scrollbars in a test only once Playwright's
 * flag that hides them is left off, so this spec leaves it off for every test in it, and the
 * frame's page draws a scrollbar beside its content, which WebKit draws only so. Firefox draws its
 * scrollbars over the content in a run with no screen, where a press at the frame's edge lands in
 * the frame, so the spec does not run there.
 */

test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

/** A page of another origin that scrolls, with a scrollbar drawn beside its content. */
const FAR =
    '<!doctype html><title>Terms</title><style>body { margin: 0; overflow-y: scroll; }' +
    '::-webkit-scrollbar { width: 16px; background: #ccc; }' +
    '::-webkit-scrollbar-thumb { background: #666; }</style>' +
    '<div style="height: 3000px">Terms</div>';

test("leaves a press on the page standing through a mousedown on a frame's scrollbar, as the view it brought arrives", async ({
    page,
}) => {
    await stillClock(page.clock);
    await page.route('https://other.test/**', (route) =>
        route.fulfill({ contentType: 'text/html', body: FAR })
    );
    await servePage(page, {
        title: 'Focus',
        body:
            '<button type="button" id="bring">Bring the scores</button>' +
            '<h2 id="scores" tabindex="-1" hidden>Scores</h2>' +
            '<iframe title="Terms" src="https://other.test/" style="width: 300px; height: 200px; border: 0"></iframe>',
        script: `import { focusOnArrival } from './controls.js';
document.querySelector('#bring').addEventListener('click', () => {
    setTimeout(() => {
        document.querySelector('#scores').hidden = false;
        focusOnArrival('scores');
    }, 1000);
});
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    await expect(page.frameLocator('iframe').locator('div')).toBeAttached();
    await page.locator('#bring').focus();
    await page.keyboard.press('Enter');
    const frame = await page.locator('iframe').boundingBox();
    if (!frame) throw new Error('expected the frame to be drawn');
    // On the track below the thumb, which scrolls the frame by a page.
    await page.mouse.move(frame.x + frame.width - 8, frame.y + frame.height - 30);
    await page.mouse.down();
    await page.mouse.up();
    await expect(page.locator('iframe')).not.toBeFocused();
    await page.clock.runFor(1100);
    await expect(page.locator('#scores')).toBeVisible();
    await page.clock.runFor(100);
    await expect(page.locator('#scores')).toBeFocused();
});
