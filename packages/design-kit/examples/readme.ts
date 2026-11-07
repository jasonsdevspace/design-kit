import { format } from 'prettier';
import { renderToStaticMarkup } from 'react-dom/server';

import { type ExampleName, EXAMPLES } from './examples.js';

/**
 * The examples whose links sit in a sentence, where a space gained or lost between a link and the
 * words around it changes what is read, so the formatter keeps every space where it is.
 */
const SENTENCES: ReadonlySet<ExampleName> = new Set(['footer', 'explainerPage']);

/**
 * A space that ends an element's words, as the hidden "Error: " ends with one, written as a
 * character reference while the markup is formatted, so it is kept rather than trimmed.
 */
const KEPT = '&#32;';

/**
 * An example's markup as a page writes it, laid out as the repository's formatter lays out HTML.
 * React draws no space between tags, so outside a sentence each element is free to start a line of
 * its own, as a page written by hand starts it.
 */
export const htmlOf = async (name: ExampleName): Promise<string> => {
    const exact = SENTENCES.has(name);
    const markup = renderToStaticMarkup(EXAMPLES[name]);
    const formatted = await format(exact ? markup : markup.replaceAll(/ (?=<\/)/g, KEPT), {
        parser: 'html',
        printWidth: 100,
        tabWidth: 4,
        htmlWhitespaceSensitivity: exact ? 'css' : 'ignore',
    });
    return formatted.replaceAll(KEPT, ' ').trimEnd();
};

/**
 * A marker in the README, then the block of HTML it names, which is written from that example. The
 * formatter puts a blank line between the two.
 */
const BLOCK = /(<!-- example: (\w+) -->\n+```html\n)[\s\S]*?(\n```)/g;

/** The examples the README's blocks are marked with, in the order they appear. */
export const markedIn = (readme: string): string[] =>
    [...readme.matchAll(BLOCK)].map((match) => match[2] ?? '');

const isName = (name: string): name is ExampleName => Object.hasOwn(EXAMPLES, name);

/**
 * The README with each marked block written from its example. A marker that names no example is
 * an error, so a renamed example cannot leave a block behind.
 */
export const writtenReadme = async (readme: string): Promise<string> => {
    const names = markedIn(readme);
    const html = new Map<string, string>();
    for (const name of names) {
        if (!isName(name)) throw new Error(`the README marks an example there is none of: ${name}`);
        html.set(name, await htmlOf(name));
    }
    return readme.replace(
        BLOCK,
        (_block, open: string, name: string, close: string) =>
            `${open}${html.get(name) ?? ''}${close}`
    );
};
