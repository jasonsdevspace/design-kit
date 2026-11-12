import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { CopyButton, CopyStatus, ThemeSwitch } from '../src/react.js';
import { THEME_KEY, themeScript } from '../src/theme.js';
import { themeScriptHash } from '../src/vite.js';
import { js, KIT, ORIGIN, themeOf } from './page.js';

/*
 * The theme switch and the copy button as a page attaches them, served from an origin of its own
 * under a policy that allows scripts only from that origin or by the theme script's hash and styles
 * only from that origin: hidden with no script, showing the saved choice once attached, saving and
 * drawing a new one, following another tab, holding a choice the browser will not save through a
 * Back, attaching once however often it is asked, the switch read by its name and its note, the
 * collapsed switch in a strip on a screen narrower than 20rem opening its choices under one button
 * and closing them again, and copying, from a pointer or the keyboard, or selecting where the
 * clipboard is refused, with the button and the status line saying which and focus held on the
 * button.
 */

const POLICY = `default-src 'self'; script-src 'self' ${themeScriptHash}; style-src 'self'`;

const MARKUP = renderToStaticMarkup(
    <main>
        <h1>Controls</h1>
        <ThemeSwitch />
        <div className="dk-strip">
            <section id="holder" className="dk-strip-tools">
                <ThemeSwitch />
            </section>
        </div>
        <pre id="code">npm install @jasonsdevspace/design-kit</pre>
        <CopyButton name="install command" />
        <CopyStatus />
    </main>
);

const ATTACH = `import { attachCopyButton, attachThemeSwitch, chooseTheme } from './controls.js';
const group = document.querySelector('.dk-theme-switch');
attachThemeSwitch(group);
window.detachFirst = attachThemeSwitch(group);
window.attachFirst = () => attachThemeSwitch(group);
window.kit = { attachCopyButton, attachThemeSwitch, chooseTheme };
window.detachHeld = attachThemeSwitch(document.querySelector('#holder'));
window.detachCopy = attachCopyButton(document.querySelector('.dk-copy'), {
    source: () => document.querySelector('#code'),
    status: document.querySelector('[role="status"]'),
});`;

/**
 * A page whose script attaches no switch as it loads, only offers the kit, so a choice it makes
 * with chooseTheme is made with nothing of the switch's listening yet.
 */
const BARE = `import { attachThemeSwitch, chooseTheme } from './controls.js';
window.kit = { attachThemeSwitch, chooseTheme };
window.attachFirst = () => attachThemeSwitch(document.querySelector('.dk-theme-switch'));`;

const page = (attach: boolean) =>
    `<!doctype html><html lang="en"><head><title>Controls</title>` +
    `<script>${themeScript}</script><link rel="stylesheet" href="/kit.css"></head><body>${MARKUP}` +
    (attach ? '<script type="module" src="/page.js"></script>' : '') +
    `</body></html>`;

const FILES: Readonly<Record<string, readonly [string, string]>> = {
    '/kit.css': [KIT, 'text/css'],
    '/controls.js': [js('controls.ts'), 'text/javascript'],
    '/theme.js': [js('theme.ts'), 'text/javascript'],
    '/page.js': [ATTACH, 'text/javascript'],
};

/** A tab on the test origin, every file served from memory under the policy. */
const tab = async (context: BrowserContext, attach = true, script = ATTACH): Promise<Page> => {
    await context.route(`${ORIGIN}/**`, (route) => {
        const path = new URL(route.request().url()).pathname;
        const [body, contentType] =
            path === '/page.js'
                ? [script, 'text/javascript']
                : (FILES[path] ?? [page(attach), 'text/html']);
        return route.fulfill({ body, contentType, headers: { 'content-security-policy': POLICY } });
    });
    const opened = await context.newPage();
    await opened.goto(`${ORIGIN}/`);
    return opened;
};

/** The first switch on the page, the one attached directly. */
const first = (opened: Page) => opened.getByRole('radiogroup', { name: 'Theme' }).first();

/** The switch inside the holder, attached through the element that holds it. */
const held = (opened: Page) => opened.locator('#holder').getByRole('radiogroup', { name: 'Theme' });

test('keeps both controls hidden where no script attaches them', async ({ browser }) => {
    const context = await browser.newContext();
    const opened = await tab(context, false);
    await expect(first(opened)).toBeHidden();
    await expect(held(opened)).toBeHidden();
    await expect(opened.locator('.dk-copy')).toBeHidden();
    // With scripts on and the switch not attached, the line for a visitor without script stays
    // out of sight, since the browser keeps a noscript element's words as text where it runs script.
    await expect(opened.locator('.dk-theme-switch-noscript')).toHaveCount(0);
    await context.close();
});

test('says what sits where the switch would be, only to a visitor without script', async ({
    browser,
}) => {
    // The line is found by its class, since the text engine passes a noscript element by.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const opened = await tab(context);
    const lines = opened.locator('.dk-theme-switch-noscript');
    await expect(lines).toHaveCount(2);
    await expect(lines.first()).toBeVisible();
    await expect(lines.first()).toHaveText('With scripts on, a Theme switch sits here.');
    await expect(first(opened)).toBeHidden();
    await context.close();
    // With script on, the browser keeps the words as text inside the noscript element, so no page
    // that runs script draws them, attached or not.
    const scripted = await browser.newContext();
    const attached = await tab(scripted);
    await expect(first(attached)).toBeVisible();
    await expect(attached.locator('.dk-theme-switch-noscript')).toHaveCount(0);
    expect(
        await attached.locator('noscript').evaluateAll((all) => all.map((e) => e.childElementCount))
    ).toEqual([0, 0]);
    await scripted.close();
});

test('shows the saved choice, then saves and draws a new one, with nothing the policy refuses', async ({
    browser,
}) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    await context.addInitScript((key) => {
        localStorage.setItem(key, 'dark');
    }, THEME_KEY);
    const refused: string[] = [];
    context.on('console', (message) => {
        if (/Content Security Policy/i.test(message.text())) refused.push(message.text());
    });
    const opened = await tab(context);
    await expect(first(opened).getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(await themeOf(opened)).toBe('dark');
    await first(opened).getByRole('radio', { name: 'Light' }).check();
    expect(await themeOf(opened)).toBe('light');
    expect(await opened.evaluate((key) => localStorage.getItem(key), THEME_KEY)).toBe('light');
    expect(refused).toEqual([]);
    await context.close();
});

test('saves once a choice made on a switch attached twice', async ({ browser }) => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
        const set = localStorage.setItem.bind(localStorage);
        Storage.prototype.setItem = (key: string, value: string) => {
            (window as unknown as { saves: number }).saves =
                ((window as unknown as { saves?: number }).saves ?? 0) + 1;
            set(key, value);
        };
    });
    const opened = await tab(context);
    await first(opened).getByRole('radio', { name: 'Dark' }).check();
    expect(await opened.evaluate(() => (window as unknown as { saves: number }).saves)).toBe(1);
    await context.close();
});

test('follows a choice saved in another tab', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    const opened = await tab(context);
    const other = await context.newPage();
    await other.goto(`${ORIGIN}/`);
    await other.evaluate((key) => {
        localStorage.setItem(key, 'dark');
    }, THEME_KEY);
    await expect(first(opened).getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(await themeOf(opened)).toBe('dark');
    await context.close();
});

test('holds a choice the browser will not save, through a page restored by Back', async ({
    browser,
}) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    await context.addInitScript(() => {
        Storage.prototype.setItem = () => {
            throw new Error('refused');
        };
        Storage.prototype.getItem = () => {
            throw new Error('refused');
        };
    });
    const opened = await tab(context);
    await first(opened).getByRole('radio', { name: 'Dark' }).check();
    expect(await themeOf(opened)).toBe('dark');
    // The theme script draws the system's light from storage it cannot read, then the switch's
    // choice is drawn again after it.
    await opened.evaluate(() => {
        window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    });
    expect(await themeOf(opened)).toBe('dark');
    await expect(first(opened).getByRole('radio', { name: 'Dark' })).toBeChecked();
    await context.close();
});

test('shows one choice on every switch, one attached through the element that holds it', async ({
    browser,
}) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    const opened = await tab(context);
    await expect(held(opened)).toBeVisible();
    await first(opened).getByRole('radio', { name: 'Dark' }).check();
    await expect(held(opened).getByRole('radio', { name: 'Dark' })).toBeChecked();
    await held(opened).getByRole('radio', { name: 'Light' }).check();
    await expect(first(opened).getByRole('radio', { name: 'Light' })).toBeChecked();
    expect(await themeOf(opened)).toBe('light');
    await context.close();
});

test('hides a switch again once it is taken away', async ({ browser }) => {
    const context = await browser.newContext();
    const opened = await tab(context);
    await expect(held(opened)).toBeVisible();
    await opened.evaluate(() => {
        (window as unknown as { detachHeld: () => void }).detachHeld();
    });
    await expect(held(opened)).toBeHidden();
    await context.close();
});

test('shows the choice saved meanwhile on a switch attached again after every switch was taken away', async ({
    browser,
}) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    const opened = await tab(context);
    await first(opened).getByRole('radio', { name: 'Light' }).check();
    await opened.evaluate(() => {
        (window as unknown as { detachHeld: () => void }).detachHeld();
        (window as unknown as { detachFirst: () => void }).detachFirst();
    });
    const other = await context.newPage();
    await other.goto(`${ORIGIN}/`);
    await other.evaluate((key) => {
        localStorage.setItem(key, 'dark');
    }, THEME_KEY);
    await expect.poll(() => themeOf(opened)).toBe('dark');
    await opened.evaluate(() => {
        (window as unknown as { attachFirst: () => void }).attachFirst();
    });
    await expect(first(opened).getByRole('radio', { name: 'Dark' })).toBeChecked();
    await context.close();
});

test('draws a choice the page holds on a switch attached again after every switch was taken away', async ({
    browser,
}) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    await context.addInitScript(() => {
        Storage.prototype.setItem = () => {
            throw new Error('refused');
        };
        Storage.prototype.getItem = () => {
            throw new Error('refused');
        };
    });
    const opened = await tab(context);
    await first(opened).getByRole('radio', { name: 'Dark' }).check();
    await opened.evaluate(() => {
        (window as unknown as { detachHeld: () => void }).detachHeld();
        (window as unknown as { detachFirst: () => void }).detachFirst();
        // The theme script draws the system's light from storage it cannot read, and the choice
        // the page holds is drawn again after it, with no switch on the page.
        window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    });
    expect(await themeOf(opened)).toBe('dark');
    await opened.evaluate(() => {
        (window as unknown as { attachFirst: () => void }).attachFirst();
    });
    await expect(first(opened).getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(await themeOf(opened)).toBe('dark');
    await context.close();
});

test('attaches one element as a copy button though it was attached as a switch first', async ({
    browser,
}) => {
    const context = await browser.newContext();
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: ORIGIN });
    const opened = await tab(context);
    await opened.evaluate(() => {
        const kit = (
            window as unknown as {
                kit: {
                    attachThemeSwitch: (element: HTMLElement) => () => void;
                    attachCopyButton: (
                        element: HTMLElement,
                        options: { source: () => HTMLElement; status: HTMLElement }
                    ) => () => void;
                };
            }
        ).kit;
        const fresh = document.createElement('button');
        fresh.className = 'dk-button dk-copy';
        fresh.id = 'fresh';
        fresh.innerHTML =
            '<span class="dk-copy-words"><span>Copy</span><span aria-hidden="true">Copied</span><span aria-hidden="true">Selected</span></span>';
        document.querySelector('main')?.append(fresh);
        // Attached as a switch first, which a button with no choices is refused as, so nothing
        // of the switch's holds the element when it is attached as a copy button.
        try {
            kit.attachThemeSwitch(fresh);
        } catch {
            // Refused, as a switch needs its choices.
        }
        kit.attachCopyButton(fresh, {
            source: () => document.querySelector<HTMLElement>('#code') ?? document.body,
            status: document.querySelector<HTMLElement>('[role="status"]') ?? document.body,
        });
    });
    await opened.locator('#fresh').click();
    await expect(opened.locator('#fresh')).toHaveAccessibleName('Copied');
    await context.close();
});

test('copies from the new source when the button is attached again with one', async ({
    browser,
}) => {
    const context = await browser.newContext();
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: ORIGIN });
    const opened = await tab(context);
    await opened.evaluate(() => {
        const kit = (
            window as unknown as {
                kit: {
                    attachCopyButton: (
                        element: HTMLElement | null,
                        options: { source: () => HTMLElement; status: HTMLElement }
                    ) => () => void;
                };
            }
        ).kit;
        const other = document.createElement('pre');
        other.id = 'other';
        other.textContent = 'npm run verify';
        document.querySelector('main')?.append(other);
        // A page that draws the button again with a new source attaches it again with it.
        kit.attachCopyButton(document.querySelector<HTMLElement>('.dk-copy'), {
            source: () => other,
            status: document.querySelector<HTMLElement>('[role="status"]') ?? document.body,
        });
    });
    await opened.locator('.dk-copy').click();
    await expect(opened.locator('.dk-copy')).toHaveAccessibleName('Copied install command');
    expect(await opened.evaluate(() => navigator.clipboard.readText())).toBe('npm run verify');
    await context.close();
});

test('puts a copy button back to Copy, hidden, when it is taken away mid-message', async ({
    browser,
}) => {
    const context = await browser.newContext();
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: ORIGIN });
    const opened = await tab(context);
    const button = opened.locator('.dk-copy');
    await button.click();
    await expect(button).toHaveAccessibleName('Copied install command');
    await opened.evaluate(() => {
        (window as unknown as { detachCopy: () => void }).detachCopy();
    });
    await expect(button).toBeHidden();
    expect(
        await button.evaluate((element) => element.textContent.replace(/\s+/g, ' ').trim())
    ).toContain('Copy');
    expect(
        await button.locator('.dk-copy-words > span').first().getAttribute('aria-hidden')
    ).toBeNull();
    await context.close();
});

test('copies the source on a click or on Enter, says Copied on the button and the status line, then Copy again', async ({
    browser,
}) => {
    const context = await browser.newContext();
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: ORIGIN });
    const opened = await tab(context);
    const button = opened.locator('.dk-copy');
    await expect(button).toHaveAccessibleName('Copy install command');
    await button.click();
    await expect(button).toHaveAccessibleName('Copied install command');
    await expect(opened.getByRole('status')).toHaveText('Copied.');
    expect(await opened.evaluate(() => navigator.clipboard.readText())).toBe(
        'npm install @jasonsdevspace/design-kit'
    );
    await expect(button).toHaveAccessibleName('Copy install command', { timeout: 4000 });
    // From the keyboard too, which reaches the button as a button and so the same press.
    await button.focus();
    await opened.keyboard.press('Enter');
    await expect(button).toHaveAccessibleName('Copied install command');
    await expect(opened.getByRole('status')).toHaveText('Copied.');
    await context.close();
});

test('reads the switch by its name, and describes it by its note', async ({ browser }) => {
    const context = await browser.newContext();
    const opened = await tab(context);
    // Found by its role alone, so the name is what is held, not what found it.
    const group = opened.getByRole('radiogroup').first();
    await expect(group).toHaveAccessibleName('Theme');
    await expect(group).toHaveAccessibleDescription(
        'Your choice is saved for every page of this site.'
    );
    await context.close();
});

/** The switch in the strip's section, collapsed to one button on a screen narrower than 20rem. */
const collapsed = async (context: BrowserContext) => {
    const opened = await tab(context);
    await opened.setViewportSize({ width: 300, height: 600 });
    const strip = opened.locator('#holder');
    return {
        opened,
        button: strip.getByRole('button'),
        radio: (name: string) => strip.getByRole('radio', { name }),
    };
};

test('keeps the choices open, with focus on them, when a press on a choice is dragged off and lifted outside', async ({
    browser,
}) => {
    const context = await browser.newContext();
    const { opened, button, radio } = await collapsed(context);
    await button.click();
    await expect(radio('System')).toBeFocused();
    const from = await opened
        .locator('#holder .dk-theme-switch-choice', { hasText: 'Light' })
        .boundingBox();
    if (!from) throw new Error('no choice');
    await opened.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await opened.mouse.down();
    await opened.mouse.move(4, 500, { steps: 4 });
    await opened.mouse.up();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(opened.locator('#holder input[type="radio"]:focus')).toHaveCount(1);
    await context.close();
});

test('collapses the switch in a strip on a screen narrower than 20rem to one button naming the choice shown', async ({
    browser,
}) => {
    const context = await browser.newContext();
    await context.addInitScript((key) => {
        localStorage.setItem(key, 'dark');
    }, THEME_KEY);
    const { opened, button, radio } = await collapsed(context);
    await expect(button).toHaveAccessibleName('Theme Dark');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(radio('Dark')).toBeHidden();
    // The switch outside the strip keeps its row, and the button names the choice as it moves.
    await first(opened).getByRole('radio', { name: 'Light' }).check();
    await expect(button).toHaveAccessibleName('Theme Light');
    // At 20rem the strip's switch is the row of choices again, with no button.
    await opened.setViewportSize({ width: 320, height: 600 });
    await expect(button).toBeHidden();
    await expect(radio('Light')).toBeChecked();
    await expect(radio('Light')).toBeVisible();
    await context.close();
});

test('keeps the choices open through a swipe beside them, so a touch can scroll to them, and closes on a tap there', async ({
    browser,
}) => {
    const context = await browser.newContext({ hasTouch: true });
    const { opened, button } = await collapsed(context);
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    /** A touch beside the list, as a browser reports it: lifted for a tap, canceled for a swipe. */
    const touch = (end: 'pointerup' | 'pointercancel') =>
        opened.evaluate((type) => {
            const beside = document.querySelector('main > h1') ?? document.body;
            const init = { bubbles: true, pointerType: 'touch', isPrimary: true, pointerId: 7 };
            beside.dispatchEvent(new PointerEvent('pointerdown', init));
            beside.dispatchEvent(new PointerEvent(type, init));
        }, end);
    // A swipe the browser takes for a scroll ends canceled, never lifted, and leaves them open.
    await touch('pointercancel');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await touch('pointerup');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await context.close();
});

test('opens the choices under the button, one to a row at the target, and closes on a pick by pointer with focus on the button', async ({
    browser,
}) => {
    const context = await browser.newContext();
    const { opened, button, radio } = await collapsed(context);
    const below = await opened
        .locator('main')
        .evaluate((main) => main.getBoundingClientRect().bottom);
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(radio('System')).toBeFocused();
    const boxes = await Promise.all(
        ['System', 'Light', 'Dark'].map(async (name) => {
            const box = await opened
                .locator('#holder .dk-theme-switch-choice', { hasText: name })
                .boundingBox();
            return {
                height: Math.round(box?.height ?? 0),
                width: Math.round(box?.width ?? 0),
                top: box?.y ?? 0,
            };
        })
    );
    for (const box of boxes) expect(box.height).toBeGreaterThanOrEqual(44);
    expect(new Set(boxes.map((box) => box.width)).size).toBe(1);
    const tops = boxes.map((box) => box.top);
    expect(tops).toEqual([...tops].sort((a, b) => a - b));
    // Over the page, so nothing below the strip moved.
    expect(
        await opened.locator('main').evaluate((main) => main.getBoundingClientRect().bottom)
    ).toBe(below);
    await radio('Dark').click();
    await expect(opened.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(button).toHaveAccessibleName('Theme Dark');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
    await expect(radio('Dark')).toBeHidden();
    await context.close();
});

test('moves the choice with the arrow keys without closing, and closes on Escape or a press outside', async ({
    browser,
}) => {
    const context = await browser.newContext();
    const { opened, button, radio } = await collapsed(context);
    await button.click();
    await opened.keyboard.press('ArrowDown');
    await expect(radio('Light')).toBeChecked();
    await expect(opened.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(radio('Light')).toBeFocused();
    await opened.keyboard.press('Escape');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await opened.locator('h1').click();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    // Focus left the switch with the press, and is not pulled back to the button.
    await expect(button).not.toBeFocused();
    // Taken away, the switch closes what it had open and hides.
    await button.click();
    await opened.evaluate(() => {
        (window as unknown as { detachHeld: () => void }).detachHeld();
    });
    await expect(opened.locator('#holder .dk-theme-switch')).toBeHidden();
    // Found by its class, since a hidden button has no role to find it by.
    await expect(opened.locator('#holder .dk-theme-switch-button')).toHaveAttribute(
        'aria-expanded',
        'false'
    );
    await context.close();
});

test('closes the choices where they are when focus leaves the switch, and keeps them when it lands on the button', async ({
    browser,
}) => {
    const context = await browser.newContext();
    const { opened, button, radio } = await collapsed(context);
    await button.click();
    await expect(radio('System')).toBeFocused();
    // Back to the button, which is the switch's own, so nothing closes.
    await opened.keyboard.press('Shift+Tab');
    await expect(button).toBeFocused();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await opened.keyboard.press('Tab');
    await expect(radio('System')).toBeFocused();
    // Out of the switch, and the choices close without pulling focus back.
    await opened.keyboard.press('Tab');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).not.toBeFocused();
    await expect(radio('System')).toBeHidden();
    await context.close();
});

test('moves no focus on a press on the button or a choice, so the choices stay until the click', async ({
    browser,
}) => {
    // A browser that gives a pressed button no focus blurs the open choices as the press begins,
    // which would close them for the click to open again, so the press moves no focus at all.
    const context = await browser.newContext();
    const { opened, button, radio } = await collapsed(context);
    await button.click();
    await expect(radio('System')).toBeFocused();
    const at = async (name: string) => {
        const box = await (name === 'button' ? button : radio(name)).boundingBox();
        if (!box) throw new Error(`${name} is not drawn`);
        return [box.x + box.width / 2, box.y + box.height / 2] as const;
    };
    await opened.mouse.move(...(await at('button')));
    await opened.mouse.down();
    await expect(radio('System')).toBeFocused();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await opened.mouse.up();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
    await button.click();
    await opened.mouse.move(...(await at('Dark')));
    await opened.mouse.down();
    await expect(radio('System')).toBeFocused();
    await opened.mouse.up();
    await expect(opened.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
    // A press with another button ends in no click, and leaves nothing that holds a later Tab.
    await button.click();
    await opened.mouse.move(...(await at('Light')));
    await opened.mouse.down({ button: 'right' });
    await opened.mouse.up({ button: 'right' });
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await opened.keyboard.press('Tab');
    await opened.keyboard.press('Tab');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await context.close();
});

test("keeps the choices open on a press on the list's own padding, and closes them on one on the name", async ({
    browser,
}) => {
    const context = await browser.newContext();
    const { opened, button, radio } = await collapsed(context);
    await button.click();
    const list = opened.locator('#holder .dk-theme-switch-choices');
    const box = await list.boundingBox();
    if (!box) throw new Error('the choices are not drawn');
    // The list's padding below its last choice, clear of the rounded corners.
    await opened.mouse.click(box.x + box.width / 2, box.y + box.height - 3);
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    // Focus stays on the chosen radio, so Escape and Tab still reach the choices.
    await expect(radio('System')).toBeFocused();
    await opened.keyboard.press('Escape');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();
    await button.click();
    await opened.locator('#holder .dk-theme-switch-name').click();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).not.toBeFocused();
    await context.close();
});

test('selects the source where the clipboard is refused, says how to copy it, and keeps focus on the button pressed by Space', async ({
    browser,
}) => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: () => Promise.reject(new Error('refused')) },
        });
    });
    const opened = await tab(context);
    const button = opened.locator('.dk-copy');
    await button.focus();
    await opened.keyboard.press('Space');
    await expect(button).toHaveAccessibleName('Selected install command');
    await expect(opened.getByRole('status')).toContainText('Selected.');
    expect(await opened.evaluate(() => window.getSelection()?.toString())).toBe(
        'npm install @jasonsdevspace/design-kit'
    );
    // Selecting the source moves focus nowhere, so the keys the status line names still reach the
    // page, and a screen reader stays where the visitor was.
    await expect(button).toBeFocused();
    await context.close();
});

/** Calls chooseTheme as a page's own menu does, with whatever plain JavaScript passes. */
const choose = (opened: Page, choice: string) =>
    opened.evaluate((value) => {
        (window as unknown as { kit: { chooseTheme: (choice: string) => void } }).kit.chooseTheme(
            value
        );
    }, choice);

test('follows a choice another tab saves after a choice made with no switch, on a switch attached later', async ({
    browser,
}) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    const opened = await tab(context, true, BARE);
    await choose(opened, 'dark');
    expect(await themeOf(opened)).toBe('dark');
    const other = await context.newPage();
    await other.goto(`${ORIGIN}/`);
    await other.evaluate((key) => {
        localStorage.setItem(key, 'light');
    }, THEME_KEY);
    await expect.poll(() => themeOf(opened)).toBe('light');
    await opened.evaluate(() => {
        (window as unknown as { attachFirst: () => void }).attachFirst();
    });
    await expect(first(opened).getByRole('radio', { name: 'Light' })).toBeChecked();
    expect(await themeOf(opened)).toBe('light');
    await context.close();
});

test('ignores a theme that is no choice, as plain JavaScript can pass', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    const opened = await tab(context);
    await choose(opened, 'dark');
    await choose(opened, 'blue');
    expect(await themeOf(opened)).toBe('dark');
    expect(await opened.evaluate((key) => localStorage.getItem(key), THEME_KEY)).toBe('dark');
    await context.close();
});

test('leaves a theme switch with no choices hidden and unattached, to be attached once they are drawn', async ({
    browser,
}) => {
    const context = await browser.newContext();
    const opened = await tab(context);
    expect(
        await opened.evaluate(() => {
            const empty = document.createElement('div');
            empty.className = 'dk-theme-switch';
            empty.hidden = true;
            document.querySelector('main')?.append(empty);
            (
                window as unknown as { kit: { attachThemeSwitch: (element: HTMLElement) => void } }
            ).kit.attachThemeSwitch(empty);
            return empty.hidden;
        })
    ).toBe(true);
    await context.close();
});

test('keeps a choice the browser will not save drawn over one another tab saves', async ({
    browser,
}) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    const opened = await tab(context, true, BARE);
    // Storage that reads but will not take this page's choice, as a full quota does, while the
    // other tab's saves still go through.
    await opened.evaluate(() => {
        Object.defineProperty(localStorage, 'setItem', {
            value: () => {
                throw new Error('full');
            },
        });
    });
    await choose(opened, 'dark');
    const other = await context.newPage();
    await other.goto(`${ORIGIN}/`);
    await other.evaluate((key) => {
        localStorage.setItem(key, 'light');
    }, THEME_KEY);
    // Once this page has heard the other tab's save, and the theme script has drawn it, the
    // choice held here is drawn again over it.
    await expect
        .poll(() => opened.evaluate((key) => localStorage.getItem(key), THEME_KEY))
        .toBe('light');
    await opened.evaluate(() => new Promise((done) => setTimeout(done, 50)));
    expect(await themeOf(opened)).toBe('dark');
    await context.close();
});
