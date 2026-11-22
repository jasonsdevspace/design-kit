import { expect, test } from '@playwright/test';

import { bundle } from './bundle.js';
import { servePage, stillClock } from './page.js';

/*
 * A status line said on at once or once its words stop changing, by `attachStatus` and through
 * React's `StatusProvider` and `useStatus`: words said at once, words that settle said once only
 * when they stop changing, waiting words dropped by any message said meanwhile, the same words
 * twice heard twice, words said at once heard though words that settle follow straight after, a
 * part's first effect heard, the function the same across renders, a provider inside another taking
 * the calls under it, a call after the provider has gone saying nothing, a line let go of saying
 * nothing more and keeping no timer, for every piece given it until the page attaches it again, a
 * provider letting its line go as it unmounts, and a line built before it is on the page speaking.
 */

const LINE = '<p id="line" class="dk-visually-hidden" role="status"></p>';

const VANILLA = `import { attachStatus } from './controls.js';
const say = attachStatus(document.querySelector('#line'));
window.heard = [];
new MutationObserver(() => {
    const text = document.querySelector('#line').textContent;
    if (text) window.heard.push(text);
}).observe(document.querySelector('#line'), { childList: true, characterData: true, subtree: true });
window.say = say;
window.ready = true;`;

type Heard = { heard: string[]; say: (words: string, options?: { settle?: number }) => void };

test('says words at once, and words that settle only once they stop changing', async ({ page }) => {
    await servePage(page, { title: 'Status', body: LINE, script: VANILLA });
    await page.waitForFunction(() => 'ready' in window);
    await page.evaluate(() => {
        const { say } = window as unknown as Heard;
        say('1 still to enter.', { settle: 300 });
        say('2 still to enter.', { settle: 300 });
        say('3 still to enter.', { settle: 300 });
    });
    await expect(page.locator('#line')).toHaveText('3 still to enter.');
    expect(await page.evaluate(() => (window as unknown as Heard).heard)).toEqual([
        '3 still to enter.',
    ]);
    // Said at once, and the same words twice heard twice.
    await page.evaluate(() => {
        const { say } = window as unknown as Heard;
        say('Saved.');
    });
    await expect(page.locator('#line')).toHaveText('Saved.');
    await page.evaluate(() => {
        const { say } = window as unknown as Heard;
        say('Saved.');
    });
    await expect
        .poll(() => page.evaluate(() => (window as unknown as Heard).heard.slice(-2)))
        .toEqual(['Saved.', 'Saved.']);
});

/** A page that attaches its line, records what is put in it however the line is placed, and lets go. */
const RELEASING = `import { attachStatus } from './controls.js';
import { releaseLine } from './line.js';
const line = document.querySelector('#line');
window.heard = [];
new MutationObserver(() => {
    if (line.textContent) window.heard.push(line.textContent);
}).observe(line, { childList: true, characterData: true, subtree: true });
window.say = attachStatus(line);
window.letGo = () => releaseLine(line);
window.attachAgain = () => attachStatus(line);
window.ready = true;`;

type Releasing = {
    heard: string[];
    say: (words: string, options?: { settle?: number; polite?: boolean }) => void;
    letGo: () => void;
    attachAgain: () => (words: string) => void;
};

test('says nothing more on a line let go of, and leaves no timer of its own running', async ({
    page,
}) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await stillClock(page.clock);
    await servePage(page, { title: 'Status', body: LINE, script: RELEASING });
    await page.waitForFunction(() => 'ready' in window);
    await page.evaluate(() => {
        const { say, letGo } = window as unknown as Releasing;
        say('Saved.');
        say('3 still to enter.', { settle: 50 });
        letGo();
        // Said after the line is let go of, as a late answer to a press might be.
        say('Copied.');
    });
    await page.clock.runFor(5000);
    expect(await page.evaluate(() => (window as unknown as Heard).heard)).toEqual([]);
    await expect(page.locator('#line')).toHaveText('');
    expect(errors).toEqual([]);
});

test('drops what waits on a line let go of while words are on it, and speaks once attached again', async ({
    page,
}) => {
    await stillClock(page.clock);
    await servePage(page, { title: 'Status', body: LINE, script: RELEASING });
    await page.waitForFunction(() => 'ready' in window);
    await page.evaluate(() => {
        const { say } = window as unknown as Releasing;
        say('Saving the round.');
        // Polite words wait for the firm words on the line to leave.
        say('Ann is next.', { polite: true });
    });
    await page.clock.runFor(200);
    await expect(page.locator('#line')).toHaveText('Saving the round.');
    await page.evaluate(() => {
        (window as unknown as Releasing).letGo();
    });
    await page.clock.runFor(5000);
    expect(await page.evaluate(() => (window as unknown as Heard).heard)).toEqual([
        'Saving the round.',
    ]);
    await expect(page.locator('#line')).toHaveText('');
    // Attached again, the line speaks.
    await page.evaluate(() => {
        (window as unknown as Releasing).attachAgain()('Saved.');
    });
    await page.clock.runFor(200);
    await expect(page.locator('#line')).toHaveText('Saved.');
});

test('keeps a line let go of silent for a piece given it, until the page attaches it again', async ({
    page,
}) => {
    await stillClock(page.clock);
    await servePage(page, {
        title: 'Status',
        body: `<main><button id="save" class="dk-button" type="button">Save</button>${LINE}</main>`,
        script: `import { attachBusy, attachStatus } from './controls.js';
import { releaseLine } from './line.js';
const line = document.querySelector('#line');
const button = document.querySelector('#save');
window.heard = [];
new MutationObserver(() => {
    if (line.textContent) window.heard.push(line.textContent);
}).observe(line, { childList: true, characterData: true, subtree: true });
attachStatus(line);
attachBusy(button, { status: line });
window.busy = () => button.setAttribute('data-busy', 'Saving the round.');
window.done = () => button.removeAttribute('data-busy');
window.letGo = () => releaseLine(line);
window.attachAgain = () => attachStatus(line);
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    type Piece = { heard: string[]; busy: () => void; done: () => void; letGo: () => void };
    await page.evaluate(() => {
        const piece = window as unknown as Piece;
        piece.letGo();
        piece.busy();
    });
    // The busy button's wait comes due, and says nothing on the line let go of.
    await page.clock.runFor(5000);
    expect(await page.evaluate(() => (window as unknown as Piece).heard)).toEqual([]);
    await page.evaluate(() => {
        const piece = window as unknown as Piece & { attachAgain: () => unknown };
        piece.done();
        piece.attachAgain();
        piece.busy();
    });
    await page.clock.runFor(5000);
    expect(await page.evaluate(() => (window as unknown as Piece).heard)).toEqual([
        'Saving the round.',
    ]);
});

test('speaks on a line built before it is put on the page', async ({ page }) => {
    await stillClock(page.clock);
    await servePage(page, {
        title: 'Status',
        body: '<main id="screen"></main>',
        script: `import { attachStatus } from './controls.js';
const line = document.createElement('p');
line.id = 'line';
line.setAttribute('role', 'status');
attachStatus(line)('Saved.');
document.querySelector('#screen').append(line);
window.ready = true;`,
    });
    await page.waitForFunction(() => 'ready' in window);
    await page.clock.runFor(200);
    await expect(page.locator('#line')).toHaveText('Saved.');
});

test('says words already said at once even when words that settle follow straight after', async ({
    page,
}) => {
    await servePage(page, { title: 'Status', body: LINE, script: VANILLA });
    await page.waitForFunction(() => 'ready' in window);
    await page.evaluate(() => {
        const { say } = window as unknown as Heard;
        say('Round saved.');
        say('4 still to enter.', { settle: 300 });
    });
    await expect(page.locator('#line')).toHaveText('4 still to enter.');
    expect(await page.evaluate(() => (window as unknown as Heard).heard)).toEqual([
        'Round saved.',
        '4 still to enter.',
    ]);
});

test('drops words still waiting to settle when another message is said', async ({ page }) => {
    await stillClock(page.clock);
    await servePage(page, { title: 'Status', body: LINE, script: VANILLA });
    await page.waitForFunction(() => 'ready' in window);
    await page.evaluate(() => {
        const { say } = window as unknown as Heard;
        say('4 still to enter.', { settle: 300 });
        say('Round saved.');
    });
    await page.clock.runFor(150);
    await expect(page.locator('#line')).toHaveText('Round saved.');
    // Past the settle the dropped words waited for.
    await page.clock.runFor(500);
    expect(await page.evaluate(() => (window as unknown as Heard).heard)).toEqual(['Round saved.']);
});

type Drawn = { functions: Set<unknown>; heard: string[]; late?: () => void };

let app = '';
test.beforeAll(async () => {
    test.setTimeout(120_000);
    app = await bundle('status-page.tsx');
});

const draw = async (page: import('@playwright/test').Page) => {
    await servePage(page, { title: 'Status', body: '<div id="root"></div>', script: app });
    await expect(page.locator('#outer > p[role="status"]')).toHaveText('Loaded.');
};

/** The page drawn on a clock that stands still, stepped until its first words are put in. */
const drawStill = async (page: import('@playwright/test').Page) => {
    await stillClock(page.clock);
    await servePage(page, { title: 'Status', body: '<div id="root"></div>', script: app });
    await page.clock.runFor(150);
    await expect(page.locator('#outer > p[role="status"]')).toHaveText('Loaded.');
};

test("says through a provider, a part's first effect included, with the same function each render", async ({
    page,
}) => {
    await draw(page);
    for (let press = 0; press < 3; press += 1) await page.locator('#press').click();
    await expect(page.locator('#outer > p[role="status"]')).toHaveText('3 pressed.');
    // Settled, so the counts along the way were never said.
    expect(await page.evaluate(() => (window as unknown as Drawn).heard)).toEqual([
        'Loaded.',
        '3 pressed.',
    ]);
    expect(await page.evaluate(() => (window as unknown as Drawn).functions.size)).toBe(1);
});

test('takes the calls under a provider inside another on its own line', async ({ page }) => {
    await draw(page);
    await page.locator('#inner').click();
    await expect(page.locator('#dialog > p[role="status"]')).toHaveText('Inside.');
    await expect(page.locator('#outer > p[role="status"]')).not.toHaveText('Inside.');
});

test('lets its line go as the provider unmounts, so words said just before are never put in', async ({
    page,
}) => {
    await drawStill(page);
    await page.evaluate(() => {
        const line = document.querySelector('#dialog [role="status"]');
        (window as unknown as { kept: Element | null }).kept = line;
        // Words said, then the provider taken away before they are put in.
        document.querySelector<HTMLButtonElement>('#inner')?.click();
        document.querySelector<HTMLButtonElement>('#leave')?.click();
    });
    await expect(page.locator('#outer')).toHaveCount(0);
    // Past the moment the words would have been put in.
    await page.clock.runFor(500);
    expect(
        await page.evaluate(() => (window as unknown as { kept: Element | null }).kept?.textContent)
    ).toBe('');
});

test('says nothing and throws nothing for a call made after its provider has gone', async ({
    page,
}) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await drawStill(page);
    await page.locator('#leave').click();
    await expect(page.locator('#outer')).toHaveCount(0);
    await page.evaluate(() => {
        (window as unknown as Drawn).late?.();
    });
    await page.clock.runFor(300);
    expect(errors).toEqual([]);
});
