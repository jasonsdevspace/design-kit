import { expect, type Locator, type Page, test } from '@playwright/test';

import { colorOf, lengthOf, sideways, style, tabKey, writePage } from './page.js';
import { doubled } from './text-size.js';

/*
 * A field for a date or a time, which each engine draws from parts of its own: the kit's focus ring
 * drawn on each kind as the keyboard reaches it and as a pointer presses it, the one ring a text
 * field draws, in Chromium, WebKit and Firefox. Safari moves focus to a part inside the field and
 * never counts the field itself as focused by the keyboard, so there the ring rests on the field
 * holding focus at all. On a phone at twice the text size, where Chromium draws a picker's icon at
 * the field's end, a date's, a month's and a week's words stand clear of it, and at the usual size
 * every kind is padded as a text field is.
 */

/** The kinds of dated field. An engine that draws none of its own for one draws a text field. */
const KINDS = ['date', 'time', 'datetime-local', 'month', 'week'] as const;

/** A text field over a dated field of the kind given, in a plain form on a content page. */
const draw = (page: Page, kind: string, width = 1280) =>
    writePage(page, {
        title: 'Booking',
        width,
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

/** What the browser's own protocol tells of an element, the parts a browser draws inside it too. */
type Part = {
    readonly nodeId: number;
    readonly attributes?: readonly string[];
    readonly children?: readonly Part[];
    readonly shadowRoots?: readonly Part[];
};

/**
 * Where Chromium draws a dated field's words and its picker's icon, read through the browser's own
 * protocol, since both are parts inside the field that no script on the page reaches.
 */
const wordsAndIcon = async (page: Page) => {
    const session = await page.context().newCDPSession(page);
    const { root } = (await session.send('DOM.getDocument', { depth: -1, pierce: true })) as {
        root: Part;
    };
    const found = new Map<string, number>();
    const walk = (part: Part) => {
        const names = part.attributes ?? [];
        const at = names.indexOf('pseudo');
        if (at >= 0 && at % 2 === 0) found.set(names[at + 1] ?? '', part.nodeId);
        for (const inside of [...(part.children ?? []), ...(part.shadowRoots ?? [])]) walk(inside);
    };
    walk(root);
    const edges = async (name: string) => {
        const nodeId = found.get(name);
        if (nodeId === undefined) throw new Error(`expected the field to draw ${name}`);
        const { model } = await session.send('DOM.getBoxModel', { nodeId });
        const across = model.border.filter((_, index) => index % 2 === 0);
        return { left: Math.min(...across), right: Math.max(...across) };
    };
    return {
        words: await edges('-webkit-datetime-edit-fields-wrapper'),
        icon: await edges('-webkit-calendar-picker-indicator'),
    };
};

for (const kind of ['date', 'month', 'week']) {
    test(`keeps a ${kind} field's words clear of its icon at 320 wide and twice the text size`, async ({
        page,
        browserName,
    }) => {
        await draw(page, kind, 320);
        // Only Chromium draws the icon inside the field, and only its setting reaches a media query.
        await doubled(page, browserName, { setting: true });
        const { words, icon } = await wordsAndIcon(page);
        expect(words.right).toBeLessThanOrEqual(icon.left);
        expect(words.right - words.left).toBeGreaterThan(100);
        expect(await sideways(page)).toBe(0);
    });
}

for (const kind of KINDS) {
    for (const width of [320, 1280]) {
        test(`pads a ${kind} field as a text field at the usual text size, ${String(width)} wide`, async ({
            page,
        }) => {
            await draw(page, kind, width);
            const sides = ['padding-left', 'padding-right'];
            expect(await style(page.locator('#dated'), ...sides)).toEqual(
                await style(page.locator('#name'), ...sides)
            );
        });
    }
}
