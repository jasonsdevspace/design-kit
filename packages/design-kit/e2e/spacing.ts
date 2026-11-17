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
