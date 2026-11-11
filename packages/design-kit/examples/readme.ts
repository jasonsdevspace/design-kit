import { renderToStaticMarkup } from 'react-dom/server';

import { type ExampleName, EXAMPLES } from './examples.js';
import { laidOut } from './format.js';

/**
 * The examples with no words beside a tag where a space would be read, so the formatter is free to
 * start each element on a line of its own, as a page written by hand starts it. Every other example
 * breaks a line only where a space already is, as a sentence of links needs, so one added later is
 * laid out tightly rather than wrongly.
 */
const LAID_OUT: ReadonlySet<ExampleName> = new Set([
    'skipLink',
    'strip',
    'stripWaiting',
    'buttons',
    'fields',
    'choiceField',
    'callout',
    'pills',
    'tabs',
    'eyebrow',
    'themeSwitch',
    'copyButton',
    'steps',
    'panel',
    'table',
    'code',
    'appFrame',
    'tabBar',
    'toast',
    'buttonGrid',
]);

/** An example's markup as a page writes it, laid out as the repository's formatter lays out. */
export const htmlOf = async (name: ExampleName): Promise<string> => {
    try {
        return await laidOut(renderToStaticMarkup(EXAMPLES[name]), LAID_OUT.has(name));
    } catch (error) {
        throw new Error(`the ${name} example could not be laid out`, { cause: error });
    }
};

/**
 * A marker in the reference, then the block of HTML it names, up to the fence that closes it at the
 * start of a line, so an empty block closes where it should. The formatter puts a blank line
 * between the marker and the block.
 */
const BLOCK = /(<!-- example: (\w+) -->(?:\r?\n)+```html\r?\n)[\s\S]*?(^```)/gm;

/** The examples the reference's blocks are marked with, in the order they appear. */
export const markedIn = (readme: string): string[] =>
    [...readme.matchAll(BLOCK)].map((match) => match[2] ?? '');

const isName = (name: string): name is ExampleName => Object.hasOwn(EXAMPLES, name);

/**
 * The reference with each marked block written from its example. A marker that names no example is
 * an error, so a renamed example cannot leave a block behind.
 */
export const writtenReadme = async (readme: string): Promise<string> => {
    const names = markedIn(readme);
    const unknown = names.find((name) => !isName(name));
    if (unknown !== undefined) {
        throw new Error(`the reference marks an example there is none of: ${unknown}`);
    }
    const html = new Map(
        await Promise.all(
            names.filter(isName).map(async (name) => [name, await htmlOf(name)] as const)
        )
    );
    const newline = readme.includes('\r\n') ? '\r\n' : '\n';
    return readme.replace(BLOCK, (_block, open: string, name: string, close: string) => {
        const block = (html.get(name as ExampleName) ?? '').replaceAll('\n', newline);
        return `${open}${block}${newline}${close}`;
    });
};
