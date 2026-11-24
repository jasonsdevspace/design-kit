import { expect, type Page, test } from '@playwright/test';

import { bundle } from './bundle.js';
import { servePage } from './page.js';

/*
 * The one view of focus every piece compares and judges through, `seen`, read as a pure function
 * over a page with a frame, a frame inside it, a frame beside it and a frame taken from the page:
 * what focus on each element reads as for a piece in each document, a blank body of the asker's own
 * document reading as nothing, an editor's body as itself, and an element of a frame the asker
 * neither is nor holds as that frame at the asker's level. What a piece keeps as a place reads the
 * same through it as the element itself. Then the walk that hands focus back going on past a place
 * in a frame whose own listener drops focus to the page's body.
 */

/** The model the page puts on the window. */
type Model = {
    seen: (element: Element | null, doc?: Document) => Element | null;
    isBlank: (element: Element) => boolean;
    focusFirst: (...places: (Element | null)[]) => boolean;
};

const BODY =
    '<button type="button" id="pc">Page</button>' +
    `<iframe id="F" title="F" srcdoc="<button type=button id=fc>F</button><iframe id=G title=G srcdoc='<button type=button id=gc>G</button>'></iframe>"></iframe>` +
    '<iframe id="S" title="S" srcdoc="<button type=button id=sc>S</button>"></iframe>' +
    '<iframe id="R" title="R" srcdoc="<button type=button id=rc>R</button>"></iframe>' +
    '<button type="button" id="next">Next</button>';

let model = '';
test.beforeAll(async () => {
    test.setTimeout(120_000);
    model = await bundle('seen-page.ts');
});

const open = async (page: Page): Promise<void> => {
    await servePage(page, { title: 'Seen', body: BODY, script: model });
    await page.waitForFunction(
        () =>
            'model' in window &&
            document
                .querySelector<HTMLIFrameElement>('#F')
                ?.contentDocument?.querySelector<HTMLIFrameElement>('#G')
                ?.contentDocument?.querySelector('#gc') !== null &&
            document
                .querySelector<HTMLIFrameElement>('#S')
                ?.contentDocument?.querySelector('#sc') !== null &&
            document
                .querySelector<HTMLIFrameElement>('#R')
                ?.contentDocument?.querySelector('#rc') !== null
    );
};

/** Each element's name, by row, and what it reads as for an asker in the page, F, G and S. */
const TABLE: readonly (readonly [string, readonly [string, string, string, string]])[] = [
    ['page control', ['pc', 'pc', 'pc', 'pc']],
    ['page blank body', ['null', 'page body', 'page body', 'page body']],
    ['page editor body', ['page body', 'page body', 'page body', 'page body']],
    ["F's control", ['F', 'fc', 'fc', 'F']],
    ["F's blank body", ['F', 'null', 'F body', 'F']],
    ["F's editor body", ['F', 'F body', 'F body', 'F']],
    ["G's control", ['F', 'G', 'gc', 'F']],
    ["G's blank body", ['F', 'G', 'null', 'F']],
    ["S's control", ['S', 'S', 'S', 'sc']],
    ["S's blank body", ['S', 'S', 'S', 'null']],
    ["a removed frame's control", ['rc', 'rc', 'rc', 'rc']],
];

test('reads focus on each element as a piece in each document sees it, and a kept place the same', async ({
    page,
}) => {
    await open(page);
    const read = await page.evaluate(() => {
        const { seen, isBlank } = (window as unknown as { model: Model }).model;
        const frame = (doc: Document, id: string) =>
            doc.querySelector<HTMLIFrameElement>(`#${id}`)?.contentDocument as Document;
        const F = frame(document, 'F');
        const G = frame(F, 'G');
        const S = frame(document, 'S');
        const removed = frame(document, 'R').querySelector('#rc') as Element;
        document.querySelector('#R')?.remove();
        const names = new Map<Element, string>([
            [document.body, 'page body'],
            [F.body, 'F body'],
            [G.body, 'G body'],
            [S.body, 'S body'],
        ]);
        const name = (element: Element | null) =>
            element === null ? 'null' : (names.get(element) ?? element.id);
        const editing = (body: HTMLElement, read: () => Element) => () => {
            body.contentEditable = 'true';
            return [read(), () => body.removeAttribute('contenteditable')] as const;
        };
        const still = (read: () => Element) => () => [read(), () => undefined] as const;
        const rows: [string, () => readonly [Element, () => void]][] = [
            ['page control', still(() => document.querySelector('#pc') as Element)],
            ['page blank body', still(() => document.body)],
            ['page editor body', editing(document.body, () => document.body)],
            ["F's control", still(() => F.querySelector('#fc') as Element)],
            ["F's blank body", still(() => F.body)],
            ["F's editor body", editing(F.body, () => F.body)],
            ["G's control", still(() => G.querySelector('#gc') as Element)],
            ["G's blank body", still(() => G.body)],
            ["S's control", still(() => S.querySelector('#sc') as Element)],
            ["S's blank body", still(() => S.body)],
            ["a removed frame's control", still(() => removed)],
        ];
        return rows.map(([row, take]) => {
            const [element, done] = take();
            const cells = [document, F, G, S].map((doc) => {
                const kept = isBlank(element) ? seen(element, doc) : element;
                return [name(seen(element, doc)), seen(kept, doc) === seen(element, doc)] as const;
            });
            done();
            return [row, cells.map(([cell]) => cell), cells.every(([, same]) => same)] as const;
        });
    });
    for (const [row, cells, same] of read) {
        const expected = TABLE.find(([name]) => name === row)?.[1];
        expect(cells, row).toEqual(expected);
        expect(same, `${row}, kept as a place`).toBe(true);
    }
    expect(read.map(([row]) => row)).toEqual(TABLE.map(([row]) => row));
});

test("goes on past a place in a frame whose own listener drops focus to the page's body", async ({
    page,
}) => {
    await open(page);
    await page.locator('#pc').focus();
    const took = await page.evaluate(() => {
        const S = document.querySelector<HTMLIFrameElement>('#S')?.contentDocument as Document;
        const inner = S.querySelector<HTMLElement>('#sc') as HTMLElement;
        // The frame's control takes focus and its own listener sends focus to the page's body.
        inner.addEventListener('focus', () => {
            inner.blur();
            (document.activeElement as HTMLElement | null)?.blur();
        });
        const { focusFirst } = (window as unknown as { model: Model }).model;
        return focusFirst(inner, document.querySelector('#next'));
    });
    expect(took).toBe(true);
    await expect(page.locator('#next')).toBeFocused();
});
