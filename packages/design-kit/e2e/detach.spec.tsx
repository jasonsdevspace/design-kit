import { expect, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import {
    buttonGrid,
    copyButton,
    pinnedTable,
    progress,
    stepper,
    themeSwitch,
} from '../examples/examples.js';
import { servePage } from './page.js';

/*
 * A detach called again, after a newer attach of the same element, does nothing: for the theme
 * switch, the copy button, the stepper, the table, a group the arrow keys move through, a busy
 * button and progress, a page that attaches a piece, detaches it, attaches it again and then calls
 * the first detach again finds the newer attach still in place and still working, with nothing
 * hidden that it showed and nothing built twice.
 */

const BODY = renderToStaticMarkup(
    <main>
        {themeSwitch}
        {copyButton}
        {stepper}
        {pinnedTable}
        {buttonGrid}
        <button id="busy" className="dk-button" type="button">
            Save
        </button>
        {progress}
    </main>
);

const SCRIPT = `import {
    attachBusy,
    attachCopyButton,
    attachProgress,
    attachRoving,
    attachStepper,
    attachTable,
    attachThemeSwitch,
} from './controls.js';
const status = document.querySelector('[role="status"]');
const pieces = {
    switch: [document.querySelector('.dk-theme-switch'), (el) => attachThemeSwitch(el)],
    copy: [
        document.querySelector('.dk-copy'),
        (el) => attachCopyButton(el, { source: () => document.body, status }),
    ],
    stepper: [document.querySelector('.dk-stepper'), (el) => attachStepper(el)],
    table: [document.querySelector('.dk-table-scroll'), (el) => attachTable(el)],
    roving: [document.querySelector('.dk-button-grid'), (el) => attachRoving(el)],
    busy: [document.querySelector('#busy'), (el) => attachBusy(el)],
    progress: [document.querySelector('progress'), (el) => attachProgress(el)],
};
window.kept = {};
window.shown = {};
for (const [name, [element, attach]] of Object.entries(pieces)) {
    try {
        const first = attach(element);
        first();
        const second = attach(element);
        // The first detach, called late, as a page's own cleanup might run after the next attach.
        first();
        // What the newer attach set up, read before anything attaches again.
        window.shown[name] = {
            hidden: element.hidden,
            role: element.getAttribute('role'),
            stops: element.querySelectorAll('[tabindex="0"]').length,
        };
        // Attaching again returns the newer attach's detach where that attach is still in place.
        window.kept[name] = attach(element) === second;
    } catch (error) {
        window.kept[name] = String(error);
    }
}
window.ready = true;`;

test('leaves a newer attach in place when the detach of an older one is called again', async ({
    page,
}) => {
    await servePage(page, { title: 'Detach', body: BODY, script: SCRIPT });
    await page.waitForFunction(() => 'ready' in window);
    expect(await page.evaluate(() => (window as unknown as { kept: object }).kept)).toEqual({
        switch: true,
        copy: true,
        stepper: true,
        table: true,
        roving: true,
        busy: true,
        progress: true,
    });
    // What the newer attach showed stays shown, read before anything attached again.
    const shown = await page.evaluate(
        () =>
            (
                window as unknown as {
                    shown: Record<string, { hidden: boolean; role: string | null; stops: number }>;
                }
            ).shown
    );
    expect(shown.switch?.hidden).toBe(false);
    expect(shown.copy?.hidden).toBe(false);
    // The group keeps the toolbar role and one stop for the Tab key.
    expect(shown.roving?.role).toBe('toolbar');
    expect(shown.roving?.stops).toBe(1);
    // Its controls still work, each once.
    const value = page.locator('.dk-stepper input');
    await expect(value).toHaveValue('4');
    await page.locator('.dk-stepper button').last().click();
    await expect(value).toHaveValue('5');
    await page.locator('#busy').evaluate((button) => button.setAttribute('data-busy', ''));
    await expect(page.locator('#busy')).toHaveAttribute('aria-disabled', 'true');
});
