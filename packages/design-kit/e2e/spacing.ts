import type { Locator, Page } from '@playwright/test';

/*
 * The wider text spacing WCAG asks a page to survive, as a visitor's own style sheet sets it, and
 * the measure of what it cuts off, shared by every spec that spaces the kit's pieces out.
 */

/** The spacing, as a visitor's own style sheet sets it. */
export const SPACED =
    '* { line-height: 1.5 !important; letter-spacing: 0.12em !important;' +
    ' word-spacing: 0.16em !important } p { margin-bottom: 2em !important }';

/**
 * The elements given that cut their own content off, by width or by height, each by its class,
 * else its id, else its tag, so a failure names what was cut.
 */
export const cutOff = (page: Page, selector: string): Promise<string[]> =>
    page.evaluate(
        (wanted) =>
            [...document.querySelectorAll<HTMLElement>(wanted)]
                .filter(
                    (element) =>
                        element.scrollWidth > element.clientWidth + 1 ||
                        element.scrollHeight > element.clientHeight + 1
                )
                .map((element) => element.className || element.id || element.localName),
        selector
    );

/**
 * The fields of one line given that are drawn shorter than their line needs, each by its id: the
 * line's height with the field's own padding and edges. A field of one line reports no more to
 * scroll than it shows however short it is drawn, so its height is held to its line instead. The
 * line's height is read in pixels, as the wider spacing sets it.
 */
export const tooShort = (page: Page, selector: string): Promise<string[]> =>
    page.evaluate((wanted) => {
        const fields = [...document.querySelectorAll<HTMLElement>(wanted)];
        if (fields.length === 0) throw new Error(`expected a field to measure, by ${wanted}`);
        return fields
            .filter((field) => {
                const style = getComputedStyle(field);
                const [line = NaN, ...around] = [
                    style.lineHeight,
                    style.paddingTop,
                    style.paddingBottom,
                    style.borderTopWidth,
                    style.borderBottomWidth,
                ].map(Number.parseFloat);
                if (Number.isNaN(line)) throw new Error("expected a line's height in pixels");
                const needs = around.reduce((sum, length) => sum + length, line);
                return field.getBoundingClientRect().height < needs - 0.5;
            })
            .map(({ id }) => id);
    }, selector);

/** The words in the elements given that the browser breaks across two lines, each a cut word. */
export const brokenWords = (page: Page, selector: string): Promise<string[]> =>
    page.evaluate((wanted) => {
        const broken: string[] = [];
        for (const element of document.querySelectorAll(wanted)) {
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
            for (let node = walker.nextNode(); node; node = walker.nextNode()) {
                const text = node.textContent ?? '';
                for (const word of text.matchAll(/\S+/g)) {
                    const range = document.createRange();
                    range.setStart(node, word.index);
                    range.setEnd(node, word.index + word[0].length);
                    const lines = new Set(
                        [...range.getClientRects()].map(({ top }) => Math.round(top))
                    );
                    if (lines.size > 1) broken.push(word[0]);
                }
            }
        }
        return broken;
    }, selector);

/**
 * The tops of the lines of text the element the locator finds draws, each once, top first, read
 * from where the browser breaks its text, so a test counts lines rather than guessing them from a
 * height. Each line is told by its text alone, so a box inside it with padding of its own adds no
 * line.
 */
export const lineTops = (locator: Locator): Promise<number[]> =>
    locator.evaluate((element) => {
        const tops = new Set<number>();
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            range.selectNodeContents(node);
            for (const { top, height } of range.getClientRects())
                if (height > 0) tops.add(Math.round(top));
        }
        return [...tops].sort((first, second) => first - second);
    });

/**
 * The room left between the last drawn child of the element the locator finds and its padding edge
 * at its foot, which is none where what it holds ends at its padding. The child's own margin counts
 * as room rather than being taken off, since the kit sets a last child's margin to nothing, so a
 * margin left under it shows. The one the kit keeps there on purpose, for a toast floating over an
 * app's body, is room a test names.
 */
export const footRoom = (locator: Locator): Promise<number> =>
    locator.evaluate((container) => {
        const last = container.querySelector(
            ':scope > :nth-last-child(1 of :not(.dk-visually-hidden, [hidden]))'
        );
        if (!last) throw new Error('expected a drawn child to measure the foot from');
        const style = getComputedStyle(container);
        return (
            container.getBoundingClientRect().bottom -
            Number.parseFloat(style.borderBottomWidth) -
            Number.parseFloat(style.paddingBottom) -
            last.getBoundingClientRect().bottom
        );
    });
