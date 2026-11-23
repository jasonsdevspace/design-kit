import { type Clock, expect, test } from '@playwright/test';

import { stillClock } from './page.js';

/*
 * The still clock the browser tests share, held on a runner slow between its two calls: seconds
 * that pass between putting the clock on and stopping it leave it stopped rather than failing the
 * test before its first step.
 */

/** How long a slow runner is taken to be between the clock's install and its stop. */
const SLOW = 3000;

test('stands the clock still where seconds pass between putting it on and stopping it', async ({
    page,
}) => {
    const slow: Pick<Clock, 'install' | 'pauseAt'> = {
        install: async (options) => {
            await page.clock.install(options);
            await new Promise((done) => setTimeout(done, SLOW));
        },
        pauseAt: (time) => page.clock.pauseAt(time),
    };
    await stillClock(slow);
    const before = await page.evaluate(() => Date.now());
    await new Promise((done) => setTimeout(done, 200));
    expect(await page.evaluate(() => Date.now())).toBe(before);
});
