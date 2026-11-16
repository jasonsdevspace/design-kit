import type { Page } from '@playwright/test';

/*
 * The wider text spacing WCAG asks a page to survive, as a visitor's own style sheet sets it, and
 * the measure of what it cuts off, shared by every spec that spaces the kit's pieces out.
 */

/** The spacing, as a visitor's own style sheet sets it. */
export const SPACED =
    '* { line-height: 1.5 !important; letter-spacing: 0.12em !important;' +
    ' word-spacing: 0.16em !important } p { margin-bottom: 2em !important }';

/** The classes of the elements given that cut their own content off, by width or by height. */
export const cutOff = (page: Page, selector: string): Promise<string[]> =>
    page.evaluate(
        (wanted) =>
            [...document.querySelectorAll<HTMLElement>(wanted)]
                .filter(
                    (element) =>
                        element.scrollWidth > element.clientWidth + 1 ||
                        element.scrollHeight > element.clientHeight + 1
                )
                .map((element) => element.className),
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
