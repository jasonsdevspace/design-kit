/*
 * The recorder of what a status line says, which the page helpers hand every spec of the kit's and
 * the site's spec takes from here, since it reads the page alone and imports nothing of the kit.
 */

/** What `hear` keeps, and from where. */
export type Hearing = {
    /** The selector of the status line whose words are kept, or of every such line. */
    readonly line: string;
    /** The name on the window the words are kept under, `heard` where none is given. */
    readonly into?: string;
    /** Whether the line emptied is kept as well, for a test of the emptying itself. */
    readonly empties?: boolean;
    /** The document or the shadow root the line is in, the document where none is given. */
    readonly root?: Node;
};

/**
 * Keeps every set of words put in a status line from here on, in order, as an array on the window
 * under the name given. Each write the line takes is kept, so the same words said again are kept
 * again, and the line emptied is kept only where asked. It watches the root rather than the line,
 * so a line drawn later, as React draws one, is heard from its first words. It runs in the browser,
 * by `page.evaluate` or `addInitScript`, or written into a page's own script by `hearing`.
 */
export const hear = ({ line, into = 'heard', empties = false, root = document }: Hearing): void => {
    const heard: string[] = [];
    Object.assign(window, { [into]: heard });
    new MutationObserver((records) => {
        const lines = new Set<Element>();
        for (const { target } of records) {
            const found = (target instanceof Element ? target : target.parentElement)?.closest(
                line
            );
            if (found) lines.add(found);
        }
        for (const found of lines) {
            const words = found.textContent;
            if (empties || words !== '') heard.push(words);
        }
    }).observe(root, { childList: true, characterData: true, subtree: true });
};

/**
 * `hear` as a statement of a page's own script, for a script written as a string or bundled, so the
 * page hears its line from before its first words. The root is an expression in that script, such
 * as the name of a shadow root it holds.
 */
export const hearing = (
    line: string,
    { into = 'heard', empties = false, root = 'document' } = {}
): string =>
    `(${hear.toString()})({ line: ${JSON.stringify(line)}, into: ${JSON.stringify(into)}, ` +
    `empties: ${String(empties)}, root: ${root} });\n`;
