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
 * matching each change to the line's selector, so a line drawn later, as React draws one, is heard
 * from its first words, and one put in already holding words is heard as it arrives. It runs in the browser,
 * by `page.evaluate` or `addInitScript`, or written into a page's own script by `hearing`.
 */
export const hear = ({ line, into = 'heard', empties = false, root = document }: Hearing): void => {
    const heard: string[] = [];
    Object.assign(window, { [into]: heard });
    /** The line a change lands in, by the selector. */
    const landedIn = (target: Node): Element | null | undefined =>
        (target instanceof Element ? target : target.parentElement)?.closest(line);
    /** The lines a node put in the page is or holds. */
    const linesIn = (node: Node): Element[] =>
        node instanceof Element
            ? [...(node.matches(line) ? [node] : []), ...node.querySelectorAll(line)]
            : [];
    new MutationObserver((records) => {
        const changed = new Set<Element>();
        // A line put in already holding words, alone or inside what holds it, says them as it
        // arrives. One put in empty has said nothing.
        const arrived = new Set<Element>();
        for (const { target, addedNodes } of records) {
            const found = landedIn(target);
            if (found) changed.add(found);
            for (const added of [...addedNodes].flatMap(linesIn)) arrived.add(added);
        }
        for (const found of new Set([...changed, ...arrived])) {
            const words = found.textContent;
            if (words !== '' || (empties && changed.has(found))) heard.push(words);
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
