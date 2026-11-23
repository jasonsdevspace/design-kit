import { expect, type Locator, type Page, test } from '@playwright/test';

import { colorOf, lengthOf, style, tabKey, writePage } from './page.js';

/*
 * A field for a date or a time, which each engine draws from parts of its own: the kit's focus ring
 * drawn on each kind as the keyboard reaches it and as a pointer presses it, the one ring a text
 * field draws, in Chromium, WebKit and Firefox. Safari moves focus to a part inside the field and
 * never counts the field itself as focused by the keyboard, so there the ring rests on the field
 * holding focus at all.
 */

/** The kinds of dated field. An engine that draws none of its own for one draws a text field. */
const KINDS = ['date', 'time', 'datetime-local', 'month', 'week'] as const;

/** A text field over a dated field of the kind given, in a plain form on a content page. */
const draw = (page: Page, kind: string) =>
    writePage(page, {
        title: 'Booking',
        body:
            '<main class="dk-page"><h1>Booking</h1><form>' +
            '<div class="dk-field"><label class="dk-field-label" for="name">Name</label>' +
            '<input class="dk-input" id="name" /></div>' +
            '<div class="dk-field"><label class="dk-field-label" for="dated">When</label>' +
            `<input class="dk-input" id="dated" type="${kind}" /></div>` +
            '</form></main>',
    });

/** The outline a control is drawn with. */
const ringOf = (control: Locator) =>
    style(control, 'outline-style', 'outline-width', 'outline-color', 'outline-offset');

for (const kind of KINDS) {
    test(`draws the kit's ring once on a ${kind} field the keyboard reaches`, async ({
        page,
        browserName,
    }) => {
        await draw(page, kind);
        const name = page.locator('#name');
        const dated = page.locator('#dated');
        await name.focus();
        const text = await ringOf(name);
        await page.keyboard.press(tabKey(browserName));
        await expect(dated).toBeFocused();
        const ring = await ringOf(dated);
        // The kit's ring, in the focus color at the ring's width, as the text field above drew it.
        expect(ring['outline-style']).toBe('solid');
        expect(ring['outline-width']).toBe(
            `${String(await lengthOf(page, 'var(--dk-ring-width)'))}px`
        );
        expect(ring['outline-color']).toBe(
            await colorOf(page, 'var(--dk-focus, var(--dk-accent))')
        );
        expect(ring).toEqual(text);
        // The outline is the only ring, with no shadow of the engine's or the kit's beside it.
        expect(await style(dated, 'box-shadow')).toEqual(await style(name, 'box-shadow'));
    });

    test(`draws on a ${kind} field a pointer presses what a text field pressed draws`, async ({
        page,
    }) => {
        await draw(page, kind);
        const name = page.locator('#name');
        const dated = page.locator('#dated');
        await name.click();
        const text = await ringOf(name);
        // Pressed at its start, clear of the icon that opens a picker over the page.
        await dated.click({ position: { x: 16, y: 16 } });
        await expect(dated).toBeFocused();
        expect(await ringOf(dated)).toEqual(text);
    });
}
