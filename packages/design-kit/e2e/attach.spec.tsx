import { readFileSync } from 'node:fs';

import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

import { CopyButton, CopyStatus, ThemeSwitch } from '../src/react.js';
import { THEME_KEY, themeScript } from '../src/theme.js';
import { themeScriptHash } from '../src/vite.js';

/*
 * The theme switch and the copy button as a page attaches them, served from an origin of its own
 * under a policy that allows scripts only from that origin or by the theme script's hash and styles
 * only from that origin: hidden with no script, showing the saved choice once attached, saving and
 * drawing a new one, following another tab, holding a choice the browser will not save through a
 * Back, attaching once however often it is asked, the switch read by its name and its note, and
 * copying, from a pointer or the keyboard, or selecting where the clipboard is refused, with the
 * button and the status line saying which and focus held on the button.
 */

const ORIGIN = 'https://kit.test';
const POLICY = `default-src 'self'; script-src 'self' ${themeScriptHash}; style-src 'self'`;

const js = (file: string) =>
    ts.transpileModule(readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
    }).outputText;
const sheet = (name: string) => readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8');

const MARKUP = renderToStaticMarkup(
    <main>
        <h1>Controls</h1>
        <ThemeSwitch />
        <div id="holder">
            <ThemeSwitch />
        </div>
        <pre id="code">npm install @jasonsdevspace/design-kit</pre>
        <CopyButton name="install command" />
        <CopyStatus />
    </main>
);

const ATTACH = `import { attachCopyButton, attachThemeSwitch } from './controls.js';
const group = document.querySelector('.dk-theme-switch');
attachThemeSwitch(group);
window.detachFirst = attachThemeSwitch(group);
window.attachFirst = () => attachThemeSwitch(group);
window.kit = { attachCopyButton, attachThemeSwitch };
window.detachHeld = attachThemeSwitch(document.querySelector('#holder'));
window.detachCopy = attachCopyButton(document.querySelector('.dk-copy'), {
    source: () => document.querySelector('#code'),
    status: document.querySelector('[role="status"]'),
});`;

const page = (attach: boolean) =>
    `<!doctype html><html lang="en"><head><title>Controls</title>` +
    `<script>${themeScript}</script><link rel="stylesheet" href="/kit.css"></head><body>${MARKUP}` +
    (attach ? '<script type="module" src="/page.js"></script>' : '') +
    `</body></html>`;

const FILES: Readonly<Record<string, readonly [string, string]>> = {
    '/kit.css': [['tokens.css', 'base.css', 'components.css'].map(sheet).join('\n'), 'text/css'],
    '/controls.js': [js('controls.ts'), 'text/javascript'],
    '/theme.js': [js('theme.ts'), 'text/javascript'],
    '/page.js': [ATTACH, 'text/javascript'],
};

/** A tab on the test origin, every file served from memory under the policy. */
const tab = async (context: BrowserContext, attach = true): Promise<Page> => {
    await context.route(`${ORIGIN}/**`, (route) => {
        const path = new URL(route.request().url()).pathname;
        const [body, contentType] = FILES[path] ?? [page(attach), 'text/html'];
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

const themeOf = (opened: Page) =>
    opened.evaluate(() => document.documentElement.getAttribute('data-theme'));

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
        // The theme script draws the system's light from storage it cannot read.
        window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    });
    expect(await themeOf(opened)).toBe('light');
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
        kit.attachThemeSwitch(fresh);
        kit.attachCopyButton(fresh, {
            source: () => document.querySelector<HTMLElement>('#code') ?? document.body,
            status: document.querySelector<HTMLElement>('[role="status"]') ?? document.body,
        });
    });
    await opened.locator('#fresh').click();
    await expect(opened.locator('#fresh')).toHaveAccessibleName('Copied');
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

test('copies the source, says Copied on the button and the status line, then Copy again', async ({
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
    await context.close();
});

test('reads the switch by its name, and describes it by its note', async ({ browser }) => {
    const context = await browser.newContext();
    const opened = await tab(context);
    const group = first(opened);
    await expect(group).toHaveAccessibleName('Theme');
    await expect(group).toHaveAccessibleDescription(
        'Your choice is saved for every page of this site.'
    );
    await context.close();
});

test('copies on Enter and on Space, and keeps focus on the button where the clipboard is refused', async ({
    browser,
}) => {
    const context = await browser.newContext();
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: ORIGIN });
    const opened = await tab(context);
    const button = opened.locator('.dk-copy');
    await button.focus();
    await opened.keyboard.press('Enter');
    await expect(button).toHaveAccessibleName('Copied install command');
    await expect(opened.getByRole('status')).toHaveText('Copied.');
    expect(await opened.evaluate(() => navigator.clipboard.readText())).toBe(
        'npm install @jasonsdevspace/design-kit'
    );
    await context.close();
    const refused = await browser.newContext();
    await refused.addInitScript(() => {
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: () => Promise.reject(new Error('refused')) },
        });
    });
    const other = await tab(refused);
    const copy = other.locator('.dk-copy');
    await copy.focus();
    await other.keyboard.press('Space');
    await expect(copy).toHaveAccessibleName('Selected install command');
    await expect(other.getByRole('status')).toContainText('Selected.');
    expect(await other.evaluate(() => window.getSelection()?.toString())).toBe(
        'npm install @jasonsdevspace/design-kit'
    );
    // Selecting the source moves focus nowhere, so the keys the status line names still reach the
    // page, and a screen reader stays where the visitor was.
    await expect(copy).toBeFocused();
    await refused.close();
});

test('selects the source where the clipboard is refused, and says how to copy it', async ({
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
    await button.click();
    await expect(button).toHaveAccessibleName('Selected install command');
    await expect(opened.getByRole('status')).toContainText('Selected.');
    expect(await opened.evaluate(() => window.getSelection()?.toString())).toBe(
        'npm install @jasonsdevspace/design-kit'
    );
    await context.close();
});
