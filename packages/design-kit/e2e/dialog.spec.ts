import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page, test } from '@playwright/test';

import { box, js, KIT, ORIGIN, style } from './page.js';
import { textSize } from './text-size.js';

/*
 * A dialog as a page attaches it, in Chromium and in WebKit: opened over a scrim in the kit's scrim
 * color on the raised ground, named by its heading, focus moved in on open and back to what opened
 * it on close however it closes, closed by Escape and by a tap on the scrim but not by a drag out
 * of it, kept open on both when asked to stay, the page behind it still, the sheet at the bottom
 * edge clear of the home indicator and scrolling inside itself, rising into place unless less
 * motion is asked for, and no audit findings in either theme.
 */

const OPTIONS = Array.from(
    { length: 30 },
    (_, index) => `<p>Option ${String(index + 1)} for the round.</p>`
).join('');

const BODY = `<main><h1>Round 3</h1>
<p><button type="button" class="dk-button" id="end">End the game</button>
<button type="button" class="dk-button" id="options">Round options</button>
<button type="button" class="dk-button" id="must">Choose a dealer</button></p>
<div id="toolbar"><button type="button" class="dk-button" id="held"><span>Delegated</span></button></div>
<p><button type="button" class="dk-button" id="gone">Opens and goes</button>
<button type="button" class="dk-button" id="fallback">Where focus lands</button></p>
${'<p>The page behind the dialog.</p>'.repeat(40)}</main>
<dialog class="dk-dialog" id="end-game" aria-labelledby="end-game-title" aria-describedby="end-game-text">
<h2 class="dk-dialog-title" id="end-game-title">End the game now?</h2>
<p id="end-game-text">The scores so far are kept in the history.</p>
<form method="dialog" class="dk-dialog-actions">
<button type="submit" class="dk-button" value="keep">Keep playing</button>
<button type="submit" class="dk-button dk-button-accent" value="end">End the game</button>
</form></dialog>
<dialog class="dk-dialog dk-dialog-sheet" id="round-options" aria-labelledby="round-options-title">
<h2 class="dk-dialog-title" id="round-options-title" tabindex="-1" autofocus>Round options</h2>${OPTIONS}
<form method="dialog" class="dk-dialog-actions"><button type="submit" class="dk-button">Done</button></form>
</dialog>
<dialog class="dk-dialog" id="dealer" aria-labelledby="dealer-title">
<h2 class="dk-dialog-title" id="dealer-title">Who deals first?</h2>
<form method="dialog" class="dk-dialog-actions"><button type="submit" class="dk-button" value="ana">Ana</button></form>
</dialog>`;

const ATTACH = `import { attachDialog } from './controls.js';
const wire = (button, dialog, options) => {
    const open = attachDialog(document.querySelector(dialog), options);
    document.querySelector(button).addEventListener('click', open);
};
wire('#end', '#end-game');
wire('#options', '#round-options');
wire('#must', '#dealer', { stay: true });
// Attached again with other options, which the same function then follows.
window.kit = { attachDialog };
// A listener on a part of the page that holds the button, as a page that delegates its clicks has.
const end = attachDialog(document.querySelector('#end-game'));
document.querySelector('#toolbar').addEventListener('click', end);
// An opener taken from the page before the dialog closes, with a place for focus to go instead.
const goes = attachDialog(document.querySelector('#round-options'), {
    returnTo: () => document.querySelector('#fallback'),
});
document.querySelector('#gone').addEventListener('click', (event) => {
    goes(event);
    event.currentTarget.remove();
});
// React hands over an event of its own, with the button as its current target.
window.openFromReact = () => {
    const button = document.querySelector('#options');
    end({ target: button.firstChild ?? button, currentTarget: button });
};
window.ready = true;`;

const open = async (
    page: Page,
    {
        width = 390,
        height = 700,
        theme = 'light',
        css = '',
    }: {
        readonly width?: number;
        readonly height?: number;
        readonly theme?: 'light' | 'dark';
        readonly css?: string;
    } = {}
): Promise<void> => {
    const files: Readonly<Record<string, readonly [string, string]>> = {
        '/kit.css': [`${KIT}${css}`, 'text/css'],
        '/controls.js': [js('controls.ts'), 'text/javascript'],
        '/theme.js': [js('theme.ts'), 'text/javascript'],
        '/page.js': [ATTACH, 'text/javascript'],
    };
    await page.route(`${ORIGIN}/**`, (route) => {
        const path = new URL(route.request().url()).pathname;
        const [body, contentType] = files[path] ?? [
            `<!doctype html><html lang="en" data-theme="${theme}"><head><title>Round 3</title>` +
                `<link rel="stylesheet" href="/kit.css"></head><body>${BODY}` +
                '<script type="module" src="/page.js"></script></body></html>',
            'text/html',
        ];
        return route.fulfill({ body, contentType });
    });
    await page.setViewportSize({ width, height });
    await page.goto(`${ORIGIN}/`);
    await page.waitForFunction(() => 'ready' in window);
};

const endGame = (page: Page): Locator => page.getByRole('dialog', { name: 'End the game now?' });
const sheet = (page: Page): Locator => page.getByRole('dialog', { name: 'Round options' });

/** Waits for a dialog's entrance to end, so it is measured where it comes to rest. */
const settle = (dialog: Locator): Promise<unknown> =>
    dialog.evaluate((element) =>
        Promise.all(element.getAnimations().map((animation) => animation.finished))
    );

/** A color as the page resolves it, from an element asked to take it. */
const resolved = (page: Page, color: string): Promise<string> =>
    page.evaluate((value) => {
        const probe = document.createElement('span');
        probe.style.backgroundColor = value;
        document.body.append(probe);
        const read = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return read;
    }, color);

test('opens over the scrim on the raised ground, named by its heading, with focus inside', async ({
    page,
}) => {
    for (const theme of ['light', 'dark'] as const) {
        await open(page, { theme });
        await page.locator('#end').click();
        await expect(endGame(page)).toBeVisible();
        const scrim = await endGame(page).evaluate(
            (dialog) => getComputedStyle(dialog, '::backdrop').backgroundColor
        );
        expect(scrim, theme).toBe(await resolved(page, 'var(--dk-scrim)'));
        expect((await style(endGame(page), 'background-color'))['background-color'], theme).toBe(
            await resolved(page, 'var(--dk-raised)')
        );
        expect((await style(endGame(page), 'box-shadow'))['box-shadow'], theme).not.toBe('none');
        // Focus is inside, on the answer that keeps things as they are.
        await expect(page.getByRole('button', { name: 'Keep playing' })).toBeFocused();
    }
});

test('returns focus to what opened it, however it closes', async ({ page }) => {
    await open(page);
    const opener = page.locator('#end');
    // By an answer.
    await opener.click();
    await page.getByRole('button', { name: 'Keep playing' }).click();
    await expect(endGame(page)).toBeHidden();
    await expect(opener).toBeFocused();
    expect(await page.locator('#end-game').evaluate((d: HTMLDialogElement) => d.returnValue)).toBe(
        'keep'
    );
    // By Escape.
    await opener.click();
    await page.keyboard.press('Escape');
    await expect(endGame(page)).toBeHidden();
    await expect(opener).toBeFocused();
    // By a tap on the scrim.
    await opener.click();
    await page.mouse.click(5, 5);
    await expect(endGame(page)).toBeHidden();
    await expect(opener).toBeFocused();
});

test('stays open on a tap inside it and on a drag that ends outside it', async ({ page }) => {
    await open(page);
    await page.locator('#end').click();
    const drawn = await box(endGame(page), 'the dialog');
    await page.mouse.click(drawn.x + 8, drawn.y + 8);
    await expect(endGame(page)).toBeVisible();
    await page.mouse.move(drawn.x + 8, drawn.y + 8);
    await page.mouse.down();
    await page.mouse.move(2, 2);
    await page.mouse.up();
    await expect(endGame(page)).toBeVisible();
});

test('stays open on Escape pressed twice and on the scrim when it asks to stay', async ({
    page,
}) => {
    await open(page);
    await page.locator('#must').click();
    const dealer = page.getByRole('dialog', { name: 'Who deals first?' });
    await expect(dealer).toBeVisible();
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(dealer).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(dealer).toBeVisible();
    await page.getByRole('button', { name: 'Ana' }).click();
    await expect(dealer).toBeHidden();
});

test('says what an answer leads to before the answers', async ({ page }) => {
    await open(page);
    await page.locator('#end').click();
    await expect(endGame(page)).toHaveAccessibleDescription(
        'The scores so far are kept in the history.'
    );
});

test('finds the button a press landed on from a listener on the page or an event from React', async ({
    page,
}) => {
    await open(page);
    // A press inside a button, handled by a listener on what holds it.
    await page.locator('#held span').click();
    await expect(endGame(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#held')).toBeFocused();
    // An event handed over from React, whose current target is the button.
    await page.evaluate(() => {
        (window as unknown as { openFromReact: () => void }).openFromReact();
    });
    await expect(endGame(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#options')).toBeFocused();
});

test('sends focus where it is told when what opened the dialog has gone', async ({ page }) => {
    await open(page);
    await page.locator('#gone').click();
    await expect(sheet(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#fallback')).toBeFocused();
});

test('sends focus where it is told when the dialog opens with nothing focused', async ({
    page,
}) => {
    await open(page);
    // A dialog a page opens by itself, from a timer or a route, with no control holding focus.
    await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
        const kit = (
            window as unknown as {
                kit: {
                    attachDialog: (
                        d: Element | null,
                        o: { returnTo: () => HTMLElement | null }
                    ) => () => void;
                };
            }
        ).kit;
        kit.attachDialog(document.querySelector('#round-options'), {
            returnTo: () => document.querySelector('#fallback'),
        })();
    });
    await expect(sheet(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#fallback')).toBeFocused();
});

test("sends focus where it is told when the event that opened it names the page's body", async ({
    page,
}) => {
    await open(page);
    // A key heard on the page's body, with nothing focused, opens the dialog.
    await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
        const kit = (
            window as unknown as {
                kit: {
                    attachDialog: (
                        d: Element | null,
                        o: { returnTo: () => HTMLElement | null }
                    ) => (from: { target: EventTarget; currentTarget: EventTarget }) => void;
                };
            }
        ).kit;
        kit.attachDialog(document.querySelector('#round-options'), {
            returnTo: () => document.querySelector('#fallback'),
        })({ target: document.body, currentTarget: document.body });
    });
    await expect(sheet(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#fallback')).toBeFocused();
});

test('takes the options it is attached with again, and keeps them when attached again with none', async ({
    page,
}) => {
    await open(page);
    const attachAgain = (options?: { stay: boolean }) =>
        page.evaluate((given) => {
            const kit = (
                window as unknown as {
                    kit: { attachDialog: (d: Element | null, o?: { stay: boolean }) => unknown };
                }
            ).kit;
            kit.attachDialog(document.querySelector('#end-game'), given ?? undefined);
        }, options ?? null);
    // Options given replace the last, so a dialog attached again to stay stays.
    await attachAgain({ stay: true });
    // Attached again with none, from another part of the page, it still stays.
    await attachAgain();
    await page.locator('#end').click();
    await page.keyboard.press('Escape');
    await expect(endGame(page)).toBeVisible();
    await page.getByRole('button', { name: 'Keep playing' }).click();
    await expect(endGame(page)).toBeHidden();
    // Attached again not to stay, Escape closes it.
    await attachAgain({ stay: false });
    await page.locator('#end').click();
    await page.keyboard.press('Escape');
    await expect(endGame(page)).toBeHidden();
    // Options given replace the last whole, so options that leave out stay, an empty set
    // among them, do not stay.
    for (const given of [{}, { returnTo: true }]) {
        await attachAgain({ stay: true });
        await page.evaluate((options) => {
            const kit = (
                window as unknown as {
                    kit: {
                        attachDialog: (
                            d: Element | null,
                            o?: { returnTo?: () => HTMLElement | null }
                        ) => unknown;
                    };
                }
            ).kit;
            kit.attachDialog(
                document.querySelector('#end-game'),
                'returnTo' in options ? { returnTo: () => document.querySelector('main') } : {}
            );
        }, given);
        await page.locator('#end').click();
        await page.keyboard.press('Escape');
        await expect(endGame(page), JSON.stringify(given)).toBeHidden();
    }
});

test('opens a long sheet at its top, with focus on its title', async ({ page }) => {
    await open(page);
    await page.locator('#options').click();
    await settle(sheet(page));
    await expect(page.locator('#round-options-title')).toBeFocused();
    expect(await sheet(page).evaluate((element) => element.scrollTop)).toBe(0);
});

test('keeps the page behind it still while it is open', async ({ page }) => {
    await open(page);
    await page.locator('#end').click();
    expect((await style(page.locator('html'), 'overflow-y'))['overflow-y']).toBe('hidden');
    await page.keyboard.press('Escape');
    expect((await style(page.locator('html'), 'overflow-y'))['overflow-y']).not.toBe('hidden');
});

test('draws the sheet at the bottom edge, clear of the home indicator, scrolling inside itself', async ({
    page,
}) => {
    await open(page, { css: ':root { --dk-safe-bottom: 34px; }' });
    await page.locator('#options').click();
    await settle(sheet(page));
    const drawn = await box(sheet(page), 'the sheet');
    expect(drawn.y + drawn.height).toBeCloseTo(700, 0);
    expect(drawn.width).toBe(390);
    expect(
        parseFloat((await style(sheet(page), 'padding-bottom'))['padding-bottom'] ?? '')
    ).toBeGreaterThanOrEqual(34);
    expect(
        await sheet(page).evaluate((element) => element.scrollHeight > element.clientHeight)
    ).toBe(true);
    // Its last answer is reached by scrolling inside it, and lands above the home indicator.
    await sheet(page).evaluate((element) => {
        element.scrollTop = element.scrollHeight;
    });
    const done = await box(page.getByRole('button', { name: 'Done' }), 'the last answer');
    expect(done.y + done.height).toBeLessThanOrEqual(700 - 34);
});

test('rises the sheet into place, and opens it in place for less motion', async ({ page }) => {
    await open(page);
    await page.locator('#options').click();
    const travel = await sheet(page).evaluate((element) =>
        element.getAnimations().map((animation) => animation.effect?.getComputedTiming().duration)
    );
    expect(travel).toEqual([250]);
    await page.keyboard.press('Escape');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#options').click();
    const still = await sheet(page).evaluate((element) =>
        element.getAnimations().map((animation) => animation.effect?.getComputedTiming().duration)
    );
    expect(Number(still[0] ?? 0)).toBeLessThan(1);
});

for (const theme of ['light', 'dark'] as const) {
    test(`has no audit findings in the ${theme} theme, open`, async ({ page }) => {
        await open(page, { theme });
        await page.locator('#end').click();
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        await page.keyboard.press('Escape');
        await page.locator('#options').click();
        await settle(sheet(page));
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    });
}

test('pads a dialog and a sheet by the smaller space on a phone, the sheet still clear of the home indicator', async ({
    page,
}) => {
    for (const [width, room, app] of [
        [390, 16, false],
        [1280, 24, false],
        // On a page that holds an app, at the phone's padding at every width.
        [1280, 16, true],
    ] as const) {
        await open(page, { width, css: ':root { --dk-safe-bottom: 34px; }' });
        if (app)
            await page.evaluate(() => {
                const frame = document.createElement('div');
                frame.className = 'dk-app';
                document.body.prepend(frame);
            });
        for (const [opener, opened] of [
            ['#end', page.locator('#end-game')],
            ['#options', sheet(page)],
        ] as const) {
            await page.locator(opener).click();
            await settle(opened);
            const padded = await style(opened, 'padding-top', 'padding-left', 'padding-bottom');
            expect(padded['padding-top'], `${String(width)}, app: ${String(app)}, ${opener}`).toBe(
                `${String(room)}px`
            );
            expect(padded['padding-left'], `${String(width)}, ${opener}`).toBe(`${String(room)}px`);
            expect(padded['padding-bottom'], `${String(width)}, ${opener}`).toBe(
                `${String(opener === '#options' ? room + 34 : room)}px`
            );
            await page.keyboard.press('Escape');
            await expect(opened).not.toBeVisible();
        }
    }
});

test('draws a solid edge round an open dialog in forced colors, where its shadow is gone', async ({
    browser,
    browserName,
}) => {
    test.skip(browserName === 'webkit', 'WebKit has no forced colors to draw');
    const context = await browser.newContext({ forcedColors: 'active' });
    try {
        const page = await context.newPage();
        await open(page);
        await page.locator('#end').click();
        await expect(endGame(page)).toBeVisible();
        const edge = await endGame(page).evaluate((element) => {
            const style = getComputedStyle(element);
            return [style.borderTopStyle, style.borderTopWidth];
        });
        expect(edge).toEqual(['solid', '1px']);
    } finally {
        await context.close();
    }
});

test('stacks its actions inside it on a 320px phone at twice the text size', async ({ page }) => {
    await open(page, { width: 320 });
    await textSize(page, 2);
    await page.locator('#end').click();
    const drawn = await box(endGame(page), 'the dialog');
    for (const name of ['Keep playing', 'End the game']) {
        const action = await box(endGame(page).getByRole('button', { name }), name);
        expect(action.x, name).toBeGreaterThanOrEqual(drawn.x - 0.5);
        expect(action.x + action.width, name).toBeLessThanOrEqual(drawn.x + drawn.width + 0.5);
    }
    // Stacked, one under the other.
    const keep = await box(endGame(page).getByRole('button', { name: 'Keep playing' }), 'keep');
    const end = await box(endGame(page).getByRole('button', { name: 'End the game' }), 'end');
    expect(end.y).toBeGreaterThanOrEqual(keep.y + keep.height);
});
