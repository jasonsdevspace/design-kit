import { format, resolveConfig } from 'prettier';

/*
 * Markup laid out as the repository's formatter lays out HTML, for the reference's blocks and for
 * the site's. It imports nothing of the kit's, so the site lays out what the version it pins draws.
 */

/**
 * A space beside a tag, such as the one that ends the hidden "Error: ", held as a character the
 * formatter treats as a word while markup is laid out, so it is kept rather than trimmed.
 */
const KEPT = '';

/**
 * Markup laid out. Markup with no words beside a tag where a space would be read is `free`, so the
 * formatter starts each element on a line of its own, as a page written by hand starts it. Other
 * markup, such as a sentence of links, breaks a line only where a space already is.
 */
export const laidOut = async (markup: string, free: boolean): Promise<string> => {
    const config = (await resolveConfig(import.meta.filename)) ?? {};
    if (markup.includes(KEPT)) throw new Error('the markup holds the character kept spaces use');
    const formatted = await format(free ? markup.replaceAll(/ (?=<)|(?<=>) /g, KEPT) : markup, {
        ...config,
        parser: 'html',
        htmlWhitespaceSensitivity: free ? 'ignore' : 'css',
    });
    return formatted.replaceAll(KEPT, ' ').trimEnd();
};
