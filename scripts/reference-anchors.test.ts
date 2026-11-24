// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { repositoryFiles } from './repository.mjs';

/*
 * The reference is linked by heading from the READMEs, the records, the change files, the site and
 * the code's comments, and links its own headings from inside. A heading renamed or moved under
 * another name leaves those links landing at the top of the page with nothing to say so, so every
 * link into the reference is read here and held to a heading it has. Its contents list is held to
 * its headings the same way, so a heading added, renamed or moved is listed where it stands.
 */

const PATH = 'packages/design-kit/REFERENCE.md';

/** Every file git holds or would add that can link the reference, with its text. */
const files = repositoryFiles(import.meta.url, (path) =>
    /\.(?:md|[cm]?[jt]sx?|json|ya?ml|html)$/.test(path)
);
const reference = files.get(PATH) ?? '';

/** A heading's id as GitHub writes it: lower case, punctuation dropped, each space a hyphen. */
const slug = (heading: string): string =>
    heading
        .trim()
        .toLowerCase()
        .replaceAll(/[^\p{L}\p{M}\p{N}\s_-]/gu, '')
        .replaceAll(/\s/g, '-');

/** A heading of the reference: its level, its words and the id a link reaches it by. */
interface Heading {
    readonly level: number;
    readonly title: string;
    readonly id: string;
}

/** The headings of a page outside its code blocks, a repeated id numbered as GitHub numbers it. */
const headingsOf = (markdown: string): Heading[] => {
    const seen = new Map<string, number>();
    return [...markdown.replaceAll(/^```[\s\S]*?^```/gm, '').matchAll(/^(#+) (.+)$/gm)].map(
        ([, hashes = '', title = '']) => {
            const id = slug(title);
            const count = seen.get(id) ?? 0;
            seen.set(id, count + 1);
            return { level: hashes.length, title, id: count === 0 ? id : `${id}-${String(count)}` };
        }
    );
};

/** Every link into the reference: a heading named after its file, or after `#` inside it. */
const linksIn = (all: ReadonlyMap<string, string>): string[] =>
    [...all].flatMap(([path, text]) => [
        ...[...text.matchAll(/REFERENCE\.md#([^\s)>"'`\]]+)/g)].map(
            ([, id = '']) => `${path} ${id}`
        ),
        ...(path === PATH
            ? [...text.replaceAll(/^```[\s\S]*?^```/gm, '').matchAll(/\]\(#([^)\s]+)\)/g)].map(
                  ([, id = '']) => `${path} ${id}`
              )
            : []),
    ]);

/** The links whose heading the reference does not have, each as its file and the id it asks for. */
const unresolved = (all: ReadonlyMap<string, string>): string[] => {
    const ids = new Set(headingsOf(all.get(PATH) ?? '').map(({ id }) => id));
    return linksIn(all).filter((link) => !ids.has(link.slice(link.indexOf(' ') + 1)));
};

describe('the links into the reference', () => {
    it('find the reference and links into it from outside and from within', () => {
        expect(reference).not.toBe('');
        const links = linksIn(files);
        expect(links.some((link) => !link.startsWith(`${PATH} `))).toBe(true);
        expect(links.some((link) => link.startsWith(`${PATH} `))).toBe(true);
    });

    it('each land on a heading the reference has', () => {
        expect(unresolved(files)).toEqual([]);
    });

    it('name a link to a heading the reference lacks, from another file or from within', () => {
        const page = '# Reference\n\n## Fields\n\nAs [fields](#fields) and [steps](#steps) say.\n';
        // The file's name stands apart from its ids, so this test's own text links nothing.
        const file = 'REFERENCE.md';
        const readme = `See [fields](${file}#fields) and [the form](${file}#a-form).`;
        expect(
            unresolved(
                new Map([
                    [PATH, page],
                    ['README.md', readme],
                ])
            )
        ).toEqual([`${PATH} steps`, 'README.md a-form']);
    });

    it('number a repeated heading as GitHub does, and read no heading inside a code block', () => {
        const page = '## Rows\n\n```md\n## Inside\n```\n\n### Rows\n\n## A `dk-row`, at last\n';
        expect(headingsOf(page).map(({ id }) => id)).toEqual([
            'rows',
            'rows-1',
            'a-dk-row-at-last',
        ]);
    });
});

describe("the reference's contents", () => {
    /** The contents list, from the line after its heading to the next heading. */
    const listed = (markdown: string): string[] => {
        const start = markdown.indexOf('\n## Contents\n');
        const end = markdown.indexOf('\n#', start + 1);
        return start === -1 ? [] : (markdown.slice(start, end).match(/^ *- .+$/gm) ?? []);
    };

    /** The list a page's headings make, each heading below the contents indented under its own. */
    const wanted = (markdown: string): string[] =>
        headingsOf(markdown)
            .filter(({ level, title }) => level > 1 && title !== 'Contents')
            .map(({ level, title, id }) => `${'    '.repeat(level - 2)}- [${title}](#${id})`);

    it('lists every heading under its own, in the order the page has them', () => {
        expect(listed(reference).length).toBeGreaterThan(0);
        expect(listed(reference)).toEqual(wanted(reference));
    });
});
