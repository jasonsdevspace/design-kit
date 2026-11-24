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

/** Every file git holds or would add that can link the reference, the sheets too, with its text. */
const files = repositoryFiles(import.meta.url, (path) =>
    /\.(?:md|[cm]?[jt]sx?|json|ya?ml|html|css)$/.test(path)
);
const reference = files.get(PATH) ?? '';
const { version } = JSON.parse(files.get('packages/design-kit/package.json') ?? '{}') as {
    version: string;
};

/** A page with its code blocks taken out, so a heading or a link shown as code is not read. */
const withoutCode = (markdown: string): string => markdown.replaceAll(/^```[\s\S]*?^```/gm, '');

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
    return [...withoutCode(markdown).matchAll(/^(#+) (.+)$/gm)].map(
        ([, hashes = '', title = '']) => {
            const id = slug(title);
            const count = seen.get(id) ?? 0;
            seen.set(id, count + 1);
            return { level: hashes.length, title, id: count === 0 ? id : `${id}-${String(count)}` };
        }
    );
};

/**
 * Every link into the reference, each as its file and the id it asks for: a heading named after the
 * file's name, or inside the reference after `#` in a link, an `href` or a link's definition. An id
 * ends at its last letter, figure or hyphen, so the stop after a link in a sentence is not read as
 * part of it. A link pinned to a release of the kit other than the package's own version is passed
 * over, since that release's reference is the one it reaches. It is checked once the pin moves to
 * the version, as a release moves every pin in the package README.
 */
const linksIn = (all: ReadonlyMap<string, string>, current: string): string[] =>
    [...all].flatMap(([path, text]) => [
        ...[...text.matchAll(/([^\s(<"'`]*)REFERENCE\.md#([\w-]+)/g)]
            .filter(([, address = '']) => {
                const release = /\/blob\/design-kit-v([^/]+)\//.exec(address)?.[1];
                return release === undefined || release === current;
            })
            .map(([, , id = '']) => `${path} ${id}`),
        ...(path === PATH
            ? [
                  ...withoutCode(text).matchAll(
                      /\]\(#([^)\s]+)\)|href="#([^"]+)"|^\[[^\]]+\]:\s*<?#([^\s>]+)/gm
                  ),
              ].map(([, link, href, definition]) => `${path} ${link ?? href ?? definition ?? ''}`)
            : []),
    ]);

/** The links whose heading the reference does not have, each as its file and the id it asks for. */
const unresolved = (all: ReadonlyMap<string, string>, current = version): string[] => {
    const ids = new Set(headingsOf(all.get(PATH) ?? '').map(({ id }) => id));
    return linksIn(all, current).filter((link) => !ids.has(link.slice(link.indexOf(' ') + 1)));
};

describe('the links into the reference', () => {
    it('find the reference and links into it from outside and from within', () => {
        expect(reference).not.toBe('');
        const links = linksIn(files, version);
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

    it('read a link in a sheet, and end an id before the stop after it', () => {
        const page =
            '## Rows\n\nAs [rows](#rows), [panels](#panels). and <a href="#tiles">tiles</a>.\n\n[x]: #dk-x\n';
        const file = 'REFERENCE.md';
        const sheet = `/* Rows, as ${file}#rows. says, and panels, as ${file}#panels, says. */`;
        expect(
            unresolved(
                new Map([
                    [PATH, page],
                    ['packages/design-kit/src/rows.css', sheet],
                ])
            )
        ).toEqual([
            `${PATH} panels`,
            `${PATH} tiles`,
            `${PATH} dk-x`,
            'packages/design-kit/src/rows.css panels',
        ]);
    });

    it("check a link pinned to the package's own release, and pass over one pinned to another", () => {
        const page = '## Rows\n';
        const blob = 'https://github.com/jasonsdevspace/design-kit/blob';
        const file = 'packages/design-kit/REFERENCE.md';
        const readme = `[a](${blob}/design-kit-v1.0.0/${file}#gone) [b](${blob}/design-kit-v0.9.0/${file}#old) [c](${blob}/main/${file}#lost)`;
        expect(
            unresolved(
                new Map([
                    [PATH, page],
                    ['README.md', readme],
                ]),
                '1.0.0'
            )
        ).toEqual(['README.md gone', 'README.md lost']);
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
        return start === -1
            ? []
            : (markdown.slice(start, end === -1 ? undefined : end).match(/^ *- .+$/gm) ?? []);
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
