import { expect, type Locator, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { InputField, StepperField, Toast } from '../src/react.js';
import { bundle } from './bundle.js';
import { frames, ORIGIN, servePage, tabKey } from './page.js';

/*
 * Every place focus can be, against every piece that reads it. Each row is a place, built by
 * grid-page.tsx: the page, a frame of the page's origin, a frame of another origin, an open and a
 * closed shadow root, a frame inside a shadow root, a shadow root inside a frame, a frame of the
 * page's origin inside one of another origin, and a frame loading its next page. Focus starts on a
 * button in the place. Each column is a piece: one that remembers where focus was, as a dialog and
 * a toast do, is drawn on the page, and one that reads focus inside itself, as a stepper or a grid
 * of cells does, is drawn in the place. Each square states where focus should end, or what the
 * piece should do, and a square the page cannot reach says why.
 */

/** A place focus can be, by the name grid-page.tsx builds it by and the words a test reads. */
const ROWS = [
    ['page', 'on the page'],
    ['frame', "in a frame of the page's origin"],
    ['other', 'in a frame of another origin'],
    ['open', 'in an open shadow root'],
    ['closed', 'in a closed shadow root'],
    ['frame in shadow', 'in a frame inside a shadow root'],
    ['shadow in frame', 'in a shadow root inside a frame'],
    ['ours in other', "in a frame of the page's origin inside one of another origin"],
    ['loading', 'in a frame loading its next page'],
] as const;

type Row = (typeof ROWS)[number][0];

/** The page module's grid, as the spec calls it. */
type Grid = Record<string, (argument?: string) => unknown>;

const TOAST = renderToStaticMarkup(<Toast />);

const BODY =
    '<main tabindex="-1" data-name="main"><h1>Focus</h1><button type="button" id="go" data-name="go">Go</button>' +
    '<h2 id="view" tabindex="-1" data-name="view">The view</h2>' +
    '<div id="place"></div><div id="beside"></div><p class="line" role="status"></p></main>' +
    TOAST +
    '<dialog class="dk-dialog" id="ask" aria-labelledby="ask-title"><h2 class="dk-dialog-title" id="ask-title">Save the notes?</h2>' +
    '<form method="dialog" class="dk-dialog-actions"><button type="submit" class="dk-button">Keep editing</button></form></dialog>';

const PANEL =
    '<button type="button" class="dk-button" data-name="opener" aria-expanded="false" aria-controls="tips">Tips</button>' +
    '<div class="dk-panel" id="tips" hidden><p class="dk-panel-title">Tips</p><p><a href="#deal" data-name="link">How to deal</a></p></div>';

const STEPPER = renderToStaticMarkup(
    <StepperField id="seats" label="Seats" min={0} max={10} defaultValue={5} />
);

const FORM = renderToStaticMarkup(
    <form noValidate>
        <InputField id="seat" label="Seat" required />
        <button type="submit" data-name="save">
            Save
        </button>
    </form>
);

const CELLS =
    '<div data-name="cells" role="group" aria-label="Cells">' +
    '<button type="button" data-name="one">1</button><button type="button" data-name="two">2</button>' +
    '<button type="button" data-name="three">3</button></div>';

const ROUNDS = 6;

/** A narrow table with a pinned column, whose first two rounds are links named first and second. */
const TABLE = `<div style="inline-size: 240px"><p class="dk-table-title" id="scores">Scores</p>
<div class="dk-table-scroll" role="region" aria-labelledby="scores" tabindex="0">
<table class="dk-table dk-table-pinned" aria-labelledby="scores">
<thead><tr><th scope="col">Player</th>${Array.from(
    { length: ROUNDS },
    (_, round) => `<th scope="col">Round ${String(round + 1)}</th>`
).join('')}</tr></thead>
<tbody><tr><th scope="row">Annabelle</th>${Array.from(
    { length: ROUNDS },
    (_, round) =>
        `<td><a href="#r${String(round)}"${round < 2 ? ` data-name="${round === 0 ? 'first' : 'second'}"` : ''}>Edit&nbsp;round&nbsp;${String(round + 1)}</a></td>`
).join('')}</tr></tbody></table></div></div>`;

/** The pages of another origin a place holds, and a frame of the page's origin inside one. */
const OTHER: Readonly<Record<string, string>> = {
    '/x': '<!doctype html><title>X</title><button type="button" data-name="c">Here</button><input data-name="typed" aria-label="Typed">',
    '/holder':
        '<!doctype html><title>Holder</title><iframe name="xi" title="xi" src="https://kit.test/inner"></iframe>',
};
const INNER =
    '<!doctype html><html lang="en"><title>Inner</title><link rel="stylesheet" href="/kit.css"><body></body></html>';

let script = '';
test.beforeAll(async () => {
    test.setTimeout(120_000);
    script = await bundle('grid-page.tsx');
});

const call = (page: Page, method: string, argument?: string): Promise<unknown> =>
    page.evaluate(([name, given]) => (window as unknown as { grid: Grid }).grid[name]?.(given), [
        method,
        argument,
    ] as const);

/** Opens the page and builds the place the row names. */
const open = async (page: Page, row: Row): Promise<void> => {
    await servePage(page, { title: 'Focus', body: BODY, script });
    await page.route('https://other.test/**', (route) =>
        route.fulfill({
            body: OTHER[new URL(route.request().url()).pathname] ?? '',
            contentType: 'text/html',
        })
    );
    await page.route(`${ORIGIN}/inner`, (route) =>
        route.fulfill({ body: INNER, contentType: 'text/html' })
    );
    // The page a loading frame goes on to, held so the frame is still loading as the square runs.
    await page.route(`${ORIGIN}/held`, () => undefined);
    await page.waitForFunction(() => 'grid' in window);
    await call(page, 'build', row);
};

/** The element named in the place, where Playwright can find it, and null in a closed root. */
const located = (page: Page, row: Row, name: string): Locator | null => {
    const named = `[data-name="${name}"]`;
    switch (row) {
        case 'page':
            return page.locator(`#place ${named}`);
        case 'frame':
            return page.frameLocator('iframe[name="f"]').locator(named);
        case 'other':
            return page.frameLocator('iframe[name="x"]').locator(named);
        case 'open':
            return page.locator('#host').locator(named);
        case 'closed':
            return null;
        case 'frame in shadow':
            return page.frameLocator('iframe[name="fs"]').locator(named);
        case 'shadow in frame':
            return page.frameLocator('iframe[name="sf"]').locator(named);
        case 'ours in other':
            return page
                .frameLocator('iframe[name="xo"]')
                .frameLocator('iframe[name="xi"]')
                .locator(named);
        case 'loading':
            return page.frameLocator('iframe[name="fl"]').locator(named);
    }
};

const focusOn = async (page: Page, row: Row, name: string): Promise<void> => {
    const found = located(page, row, name);
    if (found) await found.focus();
    else
        await page.evaluate((given) => {
            (window as unknown as { grid: { named: (n: string) => HTMLElement } }).grid
                .named(given)
                .focus();
        }, name);
};

const clickOn = async (page: Page, row: Row, name: string): Promise<void> => {
    const found = located(page, row, name);
    if (found) {
        await found.click();
        return;
    }
    const { x, y } = await page.evaluate((given) => {
        const element = (
            window as unknown as { grid: { named: (n: string) => HTMLElement } }
        ).grid.named(given);
        const { left, top, width, height } = element.getBoundingClientRect();
        return { x: left + width / 2, y: top + height / 2 };
    }, name);
    await page.mouse.click(x, y);
};

/** Where focus is in one document, or the name of the frame of another origin it is inside. */
const walk = (): { readonly name?: string; readonly into?: string } => {
    let closed: WeakMap<Element, ShadowRoot> | undefined;
    try {
        closed = (top as unknown as { closedRoots?: WeakMap<Element, ShadowRoot> }).closedRoots;
    } catch {
        closed = undefined;
    }
    let at: Element | null = document.activeElement;
    for (;;) {
        if (!at) return { name: 'nothing' };
        if (at.tagName === 'IFRAME') {
            const frame = at as HTMLIFrameElement;
            const doc = frame.contentDocument;
            if (!doc) return { into: frame.name };
            const inner = doc.activeElement;
            if (!inner || inner === doc.body) return { name: frame.name };
            at = inner;
            continue;
        }
        const root = at.shadowRoot ?? closed?.get(at);
        if (root?.activeElement) {
            at = root.activeElement;
            continue;
        }
        const named = at as HTMLElement;
        return { name: named.dataset.name ?? (named.id || named.tagName.toLowerCase()) };
    }
};

/**
 * Where focus is, named by the element's data-name or id, followed into every frame and shadow root,
 * a frame of another origin by its own document, and a frame focused with nothing in it by its name.
 */
const where = async (page: Page): Promise<string> => {
    // Two frames first, so focus a piece hands back in a frame after its close has landed.
    await frames(page);
    let frame = page.mainFrame();
    let into: string | undefined;
    for (;;) {
        const found = await frame.evaluate(walk);
        if (found.into === undefined)
            return into !== undefined && found.name === 'body' ? into : (found.name ?? 'nothing');
        const child = frame.childFrames().find((each) => each.name() === found.into);
        if (!child) return found.into;
        into = found.into;
        frame = child;
    }
};

/** Sends a loading place's frame on to its next page, and does nothing in any other place. */
const leave = (page: Page): Promise<unknown> => call(page, 'leave');

/** What reads focus, what it should end on, and how a square runs it. */
type Column = {
    readonly name: string;
    /** The column's short name, as a square's answer or failure is listed by. */
    readonly key: Key;
    /** Drawn in the place, so a place the page cannot reach cannot hold it. */
    readonly inPlace: boolean;
    readonly expected: string;
    readonly run: (page: Page, row: Row, browserName: string) => Promise<string>;
};

const COLUMNS: readonly Column[] = [
    {
        name: "a dialog's opening and closing hands focus back",
        key: 'dialog',
        inPlace: false,
        expected: 'c',
        run: async (page, row) => {
            await focusOn(page, row, 'c');
            await leave(page);
            await call(page, 'ask');
            await expect(page.locator('#ask')).toBeVisible();
            await page.keyboard.press('Escape');
            await expect(page.locator('#ask')).toBeHidden();
            return where(page);
        },
    },
    {
        name: 'a panel hands focus back to its button',
        key: 'panel',
        inPlace: true,
        expected: 'opener',
        run: async (page, row) => {
            await call(page, 'panel', PANEL);
            await clickOn(page, row, 'opener');
            await focusOn(page, row, 'link');
            await leave(page);
            await page.keyboard.press('Escape');
            await frames(page);
            return where(page);
        },
    },
    {
        name: 'a toast hands focus back',
        key: 'toast',
        inPlace: false,
        expected: 'c',
        run: async (page, row) => {
            await focusOn(page, row, 'c');
            await leave(page);
            await call(page, 'show');
            await page.locator('.dk-toast-action').focus();
            await page.keyboard.press('Enter');
            await expect(page.locator('.dk-toast-message')).toHaveText('');
            return where(page);
        },
    },
    {
        name: 'a stepper going read only keeps focus on its button',
        key: 'readOnly',
        inPlace: true,
        expected: 'up',
        run: async (page, row) => {
            await call(page, 'stepper', STEPPER);
            await focusOn(page, row, 'up');
            await leave(page);
            await call(page, 'readOnly');
            await frames(page);
            return where(page);
        },
    },
    {
        name: 'a stepper being taken down hands focus to its box',
        key: 'takeDown',
        inPlace: true,
        expected: 'box',
        run: async (page, row) => {
            await call(page, 'stepper', STEPPER);
            await focusOn(page, row, 'up');
            await leave(page);
            await call(page, 'takeDown');
            await frames(page);
            return where(page);
        },
    },
    {
        name: "a form's refusal focuses the field in error",
        key: 'form',
        inPlace: true,
        expected: 'field',
        run: async (page, row) => {
            await call(page, 'form', FORM);
            await focusOn(page, row, 'save');
            await leave(page);
            await page.keyboard.press('Enter');
            await frames(page, 3);
            return where(page);
        },
    },
    {
        name: 'a grid of cells moves focus by an arrow',
        key: 'cells',
        inPlace: true,
        expected: 'two',
        run: async (page, row) => {
            await call(page, 'cells', CELLS);
            await focusOn(page, row, 'one');
            await leave(page);
            await page.keyboard.press('ArrowRight');
            return where(page);
        },
    },
    {
        name: 'a table brings a link out from under its pinned column',
        key: 'table',
        inPlace: true,
        expected: 'whole',
        run: async (page, row, browserName) => {
            await call(page, 'table', TABLE);
            await focusOn(page, row, 'second');
            await leave(page);
            await page.keyboard.press(`Shift+${tabKey(browserName)}`);
            await frames(page, 3);
            return String(await call(page, 'whole'));
        },
    },
    {
        name: 'moveFocus lands on a heading of the page',
        key: 'moveFocus',
        inPlace: false,
        expected: 'view',
        run: async (page, row) => {
            await focusOn(page, row, 'c');
            await leave(page);
            await call(page, 'moveFocus');
            await frames(page, 3);
            return where(page);
        },
    },
    {
        name: "focusOnArrival focuses the view's heading after a press",
        key: 'arrival',
        inPlace: false,
        expected: 'view',
        run: async (page, row) => {
            await clickOn(page, row, 'c');
            // Where the press left focus, which Safari leaves off a button it presses.
            const pressed = await where(page);
            await leave(page);
            await call(page, 'arrive');
            await frames(page, 3);
            const now = await where(page);
            return now === pressed ? 'kept' : now;
        },
    },
    {
        name: 'useFocusAfterDraw lands on the control it asks for',
        key: 'hooks',
        inPlace: true,
        expected: 'target',
        run: async (page, row) => {
            await call(page, 'hooks');
            await frames(page);
            await leave(page);
            await clickOn(page, row, 'ask');
            await frames(page, 3);
            return where(page);
        },
    },
    {
        name: 'a press the visitor moves on from leaves focus in the field they went to',
        key: 'press',
        inPlace: false,
        expected: 'typed',
        run: async (page, row) => {
            await page.locator('#go').click();
            await clickOn(page, row, 'typed');
            await leave(page);
            await call(page, 'arrive');
            await frames(page, 3);
            return where(page);
        },
    },
];

/** A piece drawn inside a closed shadow root reads focus there as the root's host. */
const CLOSED_OWN = "A piece inside a closed shadow root reads focus there as the root's host.";

/** Record 19's limit: focus inside a closed shadow root reads as its host to the page. */
const CLOSED_HOST =
    'Focus inside a closed shadow root reads as its host, which takes no focus, so a toast on the page has nothing there to hand focus back to.';

/** Record 19's limit, for a press. */
const CLOSED_PRESS =
    'A press inside a closed shadow root reaches the page as a press on its host, which is no control.';

/** Focus read from the page down stops at a frame of another origin. */
const THROUGH_OTHER =
    "Focus in a frame of the page's origin inside one of another origin is read from the page down, which stops at the frame of another origin.";

type Key =
    | 'dialog'
    | 'panel'
    | 'toast'
    | 'readOnly'
    | 'takeDown'
    | 'form'
    | 'cells'
    | 'table'
    | 'moveFocus'
    | 'arrival'
    | 'hooks'
    | 'press';

type Engine = 'chromium' | 'firefox' | 'webkit';

/** Something said of a square in every engine, or in the engines named. */
type ByEngine = string | Readonly<Partial<Record<Engine, string>>>;

/** What is said of a square apart from its column, by row and then by column. */
type Squares = Readonly<Partial<Record<Row, Readonly<Partial<Record<Key, ByEngine>>>>>>;

const inEngine = (said: ByEngine | undefined, engine: string): string | undefined =>
    typeof said === 'string' ? said : said?.[engine as Engine];

/**
 * Squares whose right answer differs from their column's. A frame of another origin is as near as
 * the page can hand focus back to inside one, and Firefox will not focus one from a key, so a toast
 * dismissed by Enter goes on to the main content. A press inside a frame of another origin is never
 * heard, so the view takes no focus for it.
 */
const ANSWERS: Squares = {
    other: { dialog: 'x', toast: { chromium: 'x', webkit: 'x', firefox: 'main' }, arrival: 'kept' },
};

/** Why a piece drawn in the place cannot be drawn, for a place the page cannot reach. */
const UNREACHABLE: Readonly<Partial<Record<Row, string>>> = {
    other: 'The page cannot draw a piece inside a frame of another origin.',
};

/**
 * Squares that fail today, with why: a limit no page can get past, as record 19 names, or the cause
 * a fix in this batch takes on. A square fixed is no longer listed, and one listed that passes fails
 * the run, so the list is always the grid's state.
 */
const FAILING: Squares = {
    closed: {
        toast: CLOSED_HOST,
        readOnly: CLOSED_OWN,
        takeDown: CLOSED_OWN,
        form: CLOSED_OWN,
        arrival: CLOSED_PRESS,
        hooks: { chromium: CLOSED_OWN, firefox: CLOSED_OWN },
    },
    'ours in other': {
        dialog: { chromium: THROUGH_OTHER, webkit: THROUGH_OTHER },
        panel: THROUGH_OTHER,
        toast: THROUGH_OTHER,
        readOnly: THROUGH_OTHER,
        takeDown: THROUGH_OTHER,
    },
};

for (const [row, words] of ROWS) {
    test.describe(`with focus ${words}`, () => {
        for (const column of COLUMNS) {
            test(column.name, async ({ page, browserName }) => {
                test.skip(column.inPlace && UNREACHABLE[row] !== undefined, UNREACHABLE[row]);
                const failing = inEngine(FAILING[row]?.[column.key], browserName);
                test.fail(failing !== undefined, failing);
                await open(page, row);
                expect(await column.run(page, row, browserName)).toBe(
                    inEngine(ANSWERS[row]?.[column.key], browserName) ?? column.expected
                );
            });
        }
    });
}
