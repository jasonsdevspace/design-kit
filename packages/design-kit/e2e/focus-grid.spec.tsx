import { expect, type Locator, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { InputField, StepperField, Toast } from '../src/react.js';
import { bundle } from './bundle.js';
import { frames, ORIGIN, servePage, tabKey } from './page.js';

/*
 * Every place focus can be, against every piece that reads it. Each row is a place, built by
 * grid-page.tsx: the page, a frame of the page's origin, a frame of another origin, an open and a
 * closed shadow root, a frame inside an open shadow root, an open shadow root inside a frame, a
 * frame of the page's origin inside one of another origin, a frame whose next page has not
 * arrived, and a frame that has loaded its next page. Each column is a piece or a focus request.
 * One that remembers where focus was, as a dialog and a toast do, is drawn on the page, and one
 * that reads focus inside itself, as a stepper or a grid of cells does, is drawn in the place. A
 * column puts focus on a control in the place, the place's frame goes on to its next page where
 * it has one, and the piece acts. Each square states where focus should end, or what the piece
 * should do, a square that cannot be drawn says why, and a square that fails gives the wrong
 * answer its cause predicts.
 */

/**
 * A place focus can be: the name grid-page.tsx builds it by, the words a test reads, and the path
 * focus in it is read by, through the frames and shadow hosts that hold it.
 */
const ROWS = [
    ['page', 'on the page', ''],
    ['frame', "in a frame of the page's origin", 'f/'],
    ['other', 'in a frame of another origin', 'x/'],
    ['open', 'in an open shadow root', 'host/'],
    ['closed', 'in a closed shadow root', 'host/'],
    ['frame in shadow', 'in a frame inside an open shadow root', 'host/fs/'],
    ['shadow in frame', 'in an open shadow root inside a frame', 'sf/host/'],
    ['ours in other', "in a frame of the page's origin inside one of another origin", 'xo/xi/'],
    ['loading', 'in a frame whose next page has not arrived', 'fl/'],
    ['arrived', 'in a frame that has loaded its next page', 'fa/'],
] as const;

type Row = (typeof ROWS)[number][0];

const TOAST = renderToStaticMarkup(<Toast />);

const BODY =
    '<main tabindex="-1" data-name="main"><h1>Focus</h1><button type="button" id="go" data-name="go">Go</button>' +
    '<h2 id="view" tabindex="-1" data-name="view">The view</h2>' +
    '<div id="place"></div><p class="line" role="status"></p></main>' +
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

const ROUNDS = 8;

/**
 * A table whose pinned column is wider than the room its frame keeps for it, so a link the frame
 * cuts under the column is one the browser counts as in view, and its rounds 5 and 6 are links
 * named first and second.
 */
const TABLE = `<style>.dk-table-scroll { --dk-table-pinned-size: 3rem; }</style>
<div style="inline-size: 280px"><p class="dk-table-title" id="scores">Scores</p>
<div class="dk-table-scroll" role="region" aria-labelledby="scores" tabindex="0">
<table class="dk-table dk-table-pinned" aria-labelledby="scores">
<thead><tr><th scope="col">Player</th>${Array.from(
    { length: ROUNDS },
    (_, round) => `<th scope="col">Round ${String(round + 1)}</th>`
).join('')}</tr></thead>
<tbody><tr><th scope="row">Annabelle-Ruth</th>${Array.from({ length: ROUNDS }, (_, round) => {
    const name = ({ 4: 'first', 5: 'second' } as Readonly<Record<number, string>>)[round];
    return `<td><a href="#r${String(round)}"${name ? ` data-name="${name}"` : ''}>Edit&nbsp;round&nbsp;${String(round + 1)}</a></td>`;
}).join('')}</tr></tbody></table></div></div>`;

const THEME = `<div class="dk-strip-tools"><div class="dk-theme-switch" hidden><span class="dk-theme-switch-name" id="theme-name">Theme</span>
<button type="button" class="dk-theme-switch-button" id="theme-button" aria-labelledby="theme-name theme-button" aria-expanded="false" aria-controls="theme-choices">System</button>
<div class="dk-theme-switch-choices" id="theme-choices" role="radiogroup" aria-labelledby="theme-name">${[
    'system',
    'light',
    'dark',
]
    .map(
        (value) =>
            `<label class="dk-theme-switch-choice"><input type="radio" name="theme" value="${value}"><span>${value}</span></label>`
    )
    .join('')}</div></div></div>`;

/** The pages of another origin a place holds, and a frame of the page's origin inside one. */
const OTHER: Readonly<Record<string, string>> = {
    '/x': '<!doctype html><title>X</title><button type="button" data-name="c">Here</button><input data-name="typed" aria-label="Typed">',
    '/holder':
        '<!doctype html><title>Holder</title><iframe name="xi" title="xi" src="https://kit.test/inner"></iframe>',
};
const INNER =
    '<!doctype html><html lang="en"><title>Inner</title><link rel="stylesheet" href="/kit.css"><body></body></html>';
const NEXT = '<!doctype html><html lang="en"><title>Next</title><p>The next page.</p></html>';

let script = '';
test.beforeAll(async () => {
    test.setTimeout(120_000);
    script = await bundle('grid-page.tsx');
});

/** Calls a method of the page module's grid, which must have it. */
const call = (page: Page, method: string, argument?: string): Promise<unknown> =>
    page.evaluate(
        async ([name, given]) => {
            const grid = (window as unknown as { grid: Record<string, unknown> }).grid;
            const found = grid[name];
            if (typeof found !== 'function') throw new Error(`the grid has no ${name}`);
            return await (found as (value?: string) => unknown)(given);
        },
        [method, argument] as const
    );

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
    await page.route(`${ORIGIN}/next`, (route) =>
        route.fulfill({ body: NEXT, contentType: 'text/html' })
    );
    // The page a frame goes on to that never arrives, so the frame is still loading as it acts.
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
        case 'arrived':
            return page.frameLocator('iframe[name="fa"]').locator(named);
    }
};

/** Where focus is in one document, as a path, or the frame of another origin it is inside. */
const walk = (): { readonly path: readonly string[]; readonly into?: string } => {
    let closed: WeakMap<Element, ShadowRoot> | undefined;
    try {
        closed = (top as unknown as { closedRoots?: WeakMap<Element, ShadowRoot> }).closedRoots;
    } catch {
        closed = undefined;
    }
    const path: string[] = [];
    let at: Element | null = document.activeElement;
    for (;;) {
        if (!at) return { path: [...path, 'nothing'] };
        const named = at as HTMLElement;
        const name = named.dataset.name ?? (named.id || named.tagName.toLowerCase());
        if (at.tagName === 'IFRAME') {
            const frame = at as HTMLIFrameElement;
            const doc = frame.contentDocument;
            if (!doc) return { path, into: frame.name };
            path.push(frame.name);
            const inner = doc.activeElement;
            if (!inner || inner === doc.body) return { path };
            at = inner;
            continue;
        }
        const root = at.shadowRoot ?? closed?.get(at);
        if (root?.activeElement) {
            path.push(name);
            at = root.activeElement;
            continue;
        }
        return { path: [...path, name] };
    }
};

/**
 * Where focus is, as the path of frames and shadow hosts that hold it and the element's data-name or
 * id, such as `f/c`, followed into a frame of another origin by its own document. A frame focused
 * with nothing in it reads as the frame's path, and the page's body as `body`.
 */
const where = async (page: Page): Promise<string> => {
    let frame = page.mainFrame();
    const path: string[] = [];
    for (;;) {
        const found = await frame.evaluate(walk);
        if (found.into === undefined) {
            // A frame of another origin with nothing focused in it reads as the frame.
            if (path.length > 0 && found.path.join('/') === 'body') return path.join('/');
            return [...path, ...found.path].join('/');
        }
        const into = found.into;
        path.push(...found.path, into);
        const child = frame.childFrames().find((each) => each.name() === into);
        if (!child) return path.join('/');
        frame = child;
    }
};

/** What a column works with: the page, its row, the engine and the path names take in the place. */
type Square = {
    readonly page: Page;
    readonly row: Row;
    readonly browserName: string;
    /** A name in the place, with the path focus there is read by. */
    readonly at: (name: string) => string;
};

/** Focuses the element named in the place and finds focus there. */
const focusOn = async ({ page, row, at }: Square, name: string): Promise<void> => {
    const found = located(page, row, name);
    if (found) await found.focus();
    else
        await page.evaluate((given) => {
            (window as unknown as { grid: { named: (n: string) => HTMLElement } }).grid
                .named(given)
                .focus();
        }, name);
    await expect.poll(() => where(page), `focus on ${name}`).toBe(at(name));
};

/** Presses the element named in the place by pointer. */
const clickOn = async ({ page, row }: Square, name: string): Promise<void> => {
    const found = located(page, row, name);
    if (found) {
        await found.click();
        return;
    }
    const { x, y } = (await call(page, 'point', name)) as { x: number; y: number };
    await page.mouse.click(x, y);
};

/** Waits until the element named is drawn in the place. */
const drawn = (page: Page, name: string): Promise<unknown> =>
    page.waitForFunction(
        (given) => (window as unknown as { grid: { has: (n: string) => boolean } }).grid.has(given),
        name
    );

type Key =
    | 'dialog'
    | 'panel'
    | 'toast'
    | 'readOnly'
    | 'takeDown'
    | 'form'
    | 'cells'
    | 'table'
    | 'theme'
    | 'moveFocus'
    | 'arrival'
    | 'press'
    | 'focusAfterDraw'
    | 'arrivalHook'
    | 'refusalHook'
    | 'rovingHook';

/** What reads focus, how a square runs it, and what it should give. */
type Column = {
    readonly name: string;
    /** The column's short name, as a square's answer or failure is listed by. */
    readonly key: Key;
    /** Drawn in the place, so a place the page cannot draw in cannot hold it. */
    readonly inPlace: boolean;
    /** Draws the piece and puts focus where the square starts, before the frame goes on. */
    readonly start: (square: Square) => Promise<void>;
    /** What the piece or the visitor does once the frame has gone on. */
    readonly act: (square: Square) => Promise<void>;
    /** What the square gives once the piece has acted, where focus is unless given. */
    readonly read?: (square: Square) => Promise<string>;
    readonly expected: (square: Square) => string;
};

/** The pages whose panel its button never opened. */
const neverOpened = new WeakSet<Page>();

const COLUMNS: readonly Column[] = [
    {
        name: "a dialog hands focus back to the control it was opened from, not the browser's",
        key: 'dialog',
        inPlace: false,
        start: async (square) => {
            await focusOn(square, 'c');
            // Opened from the field while focus is on the button, so only the kit hands it back.
            await call(square.page, 'ask');
            await expect(square.page.locator('#ask')).toBeVisible();
        },
        act: async ({ page }) => {
            await page.keyboard.press('Escape');
            await expect(page.locator('#ask')).toBeHidden();
        },
        expected: ({ at }) => at('typed'),
    },
    {
        name: 'a panel hands focus back to its button',
        key: 'panel',
        inPlace: true,
        start: async (square) => {
            await call(square.page, 'panel', PANEL);
            await clickOn(square, 'opener');
            // A press opens the panel in its own task, so it is given a moment before it is read.
            const opened = await square.page
                .waitForFunction(
                    () => (window as unknown as { grid: { opened: () => boolean } }).grid.opened(),
                    undefined,
                    { timeout: 2000 }
                )
                .then(
                    () => true,
                    () => false
                );
            if (opened) await focusOn(square, 'link');
            else neverOpened.add(square.page);
        },
        act: async ({ page }) => {
            await page.keyboard.press('Escape');
        },
        // A panel its button never opened says so, since focus is still on the button.
        read: async ({ page }) => (neverOpened.has(page) ? 'never opened' : where(page)),
        expected: ({ at }) => at('opener'),
    },
    {
        name: 'a toast hands focus back',
        key: 'toast',
        inPlace: false,
        start: async (square) => {
            const { page } = square;
            await focusOn(square, 'c');
            await call(page, 'show');
            await expect(page.locator('.dk-toast-message')).toHaveText('Round 3 saved.');
            await page.locator('.dk-toast-action').focus();
            await expect(page.locator('.dk-toast-action')).toBeFocused();
        },
        act: async ({ page }) => {
            await page.keyboard.press('Enter');
            await expect(page.locator('.dk-toast-message')).toHaveText('');
        },
        expected: ({ at }) => at('c'),
    },
    {
        name: 'a stepper going read only keeps focus on its button, marked off, and hides the other',
        key: 'readOnly',
        inPlace: true,
        start: async (square) => {
            await call(square.page, 'stepper', STEPPER);
            await focusOn(square, 'up');
        },
        act: async ({ page }) => {
            await call(page, 'readOnly');
        },
        read: async ({ page }) => `${await where(page)}, ${String(await call(page, 'marks'))}`,
        expected: ({ at }) => `${at('up')}, marked, down hidden`,
    },
    {
        name: 'a stepper being taken down hands focus to its box',
        key: 'takeDown',
        inPlace: true,
        start: async (square) => {
            await call(square.page, 'stepper', STEPPER);
            await focusOn(square, 'up');
        },
        act: async ({ page }) => {
            await call(page, 'takeDown');
        },
        expected: ({ at }) => at('box'),
    },
    {
        name: "a form's refusal focuses the field in error",
        key: 'form',
        inPlace: true,
        start: async (square) => {
            await call(square.page, 'form', FORM);
            await focusOn(square, 'save');
        },
        act: async ({ page }) => {
            await page.keyboard.press('Enter');
        },
        expected: ({ at }) => at('field'),
    },
    {
        name: 'a grid of cells moves focus by an arrow',
        key: 'cells',
        inPlace: true,
        start: async (square) => {
            await call(square.page, 'cells', CELLS);
            await focusOn(square, 'one');
        },
        act: async ({ page }) => {
            await page.keyboard.press('ArrowRight');
        },
        expected: ({ at }) => at('two'),
    },
    {
        name: 'a table brings a link the keyboard reaches out from under its pinned column',
        key: 'table',
        inPlace: true,
        start: async (square) => {
            await call(square.page, 'table', TABLE);
            await call(square.page, 'cut', 'first');
            await focusOn(square, 'second');
        },
        act: async ({ page, browserName }) => {
            await page.keyboard.press(`Shift+${tabKey(browserName)}`);
        },
        read: async ({ page }) =>
            `${await where(page)}, ${String(await call(page, 'whole', 'first'))}`,
        expected: ({ at }) => `${at('first')}, whole`,
    },
    {
        name: "a theme switch's choices hand focus back to its button on Escape",
        key: 'theme',
        inPlace: true,
        start: async (square) => {
            // The switch shows its button, which opens its choices, in a strip under 20rem wide.
            await square.page.setViewportSize({ width: 300, height: 700 });
            await call(square.page, 'theme', THEME);
            // Opened by a key, since a press's lift inside a closed shadow root reaches the page as
            // one on its host, which closes the choices again in Safari as often as not.
            await focusOn(square, 'switch');
            await square.page.keyboard.press('Enter');
            // The choices open with focus on the chosen one, and the visitor moves to the next.
            await expect.poll(() => where(square.page)).toBe(square.at('system'));
            await focusOn(square, 'light');
        },
        act: async ({ page }) => {
            await page.keyboard.press('Escape');
        },
        expected: ({ at }) => at('switch'),
    },
    {
        name: 'moveFocus lands on a heading of the page',
        key: 'moveFocus',
        inPlace: false,
        start: async (square) => {
            await focusOn(square, 'c');
        },
        act: async ({ page }) => {
            await call(page, 'moveFocus');
        },
        expected: () => 'view',
    },
    {
        name: "focusOnArrival focuses the view's heading after a press",
        key: 'arrival',
        inPlace: false,
        start: async (square) => {
            await clickOn(square, 'c');
        },
        act: async ({ page }) => {
            await call(page, 'arrive');
        },
        expected: () => 'view',
    },
    {
        name: 'a press the visitor moves on from leaves focus in the field they went to',
        key: 'press',
        inPlace: false,
        start: async (square) => {
            await square.page.locator('#go').click();
            await clickOn(square, 'typed');
            await expect.poll(() => where(square.page)).toBe(square.at('typed'));
        },
        act: async ({ page }) => {
            await call(page, 'arrive');
        },
        expected: ({ at }) => at('typed'),
    },
    {
        name: 'useFocusAfterDraw lands on the control it asks for',
        key: 'focusAfterDraw',
        inPlace: true,
        start: async (square) => {
            await call(square.page, 'hooks');
            await drawn(square.page, 'ask');
            await focusOn(square, 'ask');
        },
        act: async ({ page }) => {
            await page.keyboard.press('Enter');
        },
        expected: ({ at }) => at('target'),
    },
    {
        name: "useArrivalFocus focuses the view's heading after a press",
        key: 'arrivalHook',
        inPlace: true,
        start: async (square) => {
            await call(square.page, 'round');
            await drawn(square.page, 'next');
        },
        act: async (square) => {
            await clickOn(square, 'next');
        },
        expected: ({ at }) => at('heading'),
    },
    {
        name: 'useFormRefusal focuses the field in error',
        key: 'refusalHook',
        inPlace: true,
        start: async (square) => {
            await call(square.page, 'seat');
            await drawn(square.page, 'save');
            await focusOn(square, 'save');
        },
        act: async ({ page }) => {
            await page.keyboard.press('Enter');
        },
        expected: ({ at }) => at('field'),
    },
    {
        name: 'useRoving moves focus by an arrow',
        key: 'rovingHook',
        inPlace: true,
        start: async (square) => {
            await call(square.page, 'roving');
            await drawn(square.page, 'one');
            await focusOn(square, 'one');
        },
        act: async ({ page }) => {
            await page.keyboard.press('ArrowRight');
        },
        expected: ({ at }) => at('two'),
    },
];

type Engine = 'chromium' | 'firefox' | 'webkit';

/** Something said of a square in every engine, or in the engines named. */
type ByEngine = string | Readonly<Partial<Record<Engine, string>>>;

const inEngine = (said: ByEngine | undefined, engine: string): string | undefined =>
    typeof said === 'string' ? said : said?.[engine as Engine];

/** Something said of squares apart from their column, by row and then by column. */
type Squares<Said> = Readonly<Partial<Record<Row, Readonly<Partial<Record<Key, Said>>>>>>;

/**
 * Squares whose right answer differs from their column's. A frame of another origin is as near as
 * the page can hand focus back to inside one, and Firefox will not focus one from a key, so a toast
 * dismissed by Enter goes on to the main content. A press inside a frame of another origin is never
 * heard, so the view takes no focus for it, and focus stays where the press left it. A frame that
 * has loaded its next page is as near as the page can hand focus back to once the control is gone.
 */
const ANSWERS: Squares<ByEngine> = {
    other: {
        dialog: 'x',
        toast: { chromium: 'x', webkit: 'x', firefox: 'main' },
        arrival: { chromium: 'x/c', firefox: 'x/c', webkit: 'x' },
    },
    arrived: { toast: 'fa', press: 'fa' },
};

/** Why a piece cannot be drawn in a place, for a column drawn in it. */
const UNDRAWN: Readonly<Partial<Record<Row, string>>> = {
    other: 'The page cannot draw a piece inside a frame of another origin.',
    arrived: 'A piece drawn in a frame goes with the page the frame leaves.',
};

/** Record 19's limit: focus inside a closed shadow root reads as its host to the page. */
const CLOSED_HOST =
    'Focus inside a closed shadow root reads as its host, which takes no focus, so a toast on the page has nothing there to hand focus back to.';

/** The same limit, for a press. */
const CLOSED_PRESS =
    'A press inside a closed shadow root reaches the page as a press on its host, which is no control.';

/** A piece drawn inside a closed shadow root reads focus there as the root's host. */
const CLOSED_OWN = "A piece inside a closed shadow root reads focus there as the root's host.";

/** Focus read from the page down stops at a frame of another origin. */
const THROUGH_OTHER =
    "Focus in a frame of the page's origin inside one of another origin is read from the page down, which stops at the frame of another origin.";

/** A dialog whose opener's page has gone hands focus to the body. */
const DIALOG_GONE =
    "A dialog whose opener went with the page a frame left hands focus to the page's body, not to the frame.";

/** A square that fails: the wrong answer its cause gives, and the cause. */
type Failing = { readonly gives: ByEngine; readonly because: string };

/**
 * Squares that fail, each with the wrong answer its cause gives and the cause, a limit record 19
 * names or a read that stops short of where focus is. A square that gives another answer fails the
 * run, the right one included, so the list is always the grid's state.
 */
const FAILING: Squares<Failing> = {
    closed: {
        panel: { gives: 'main', because: CLOSED_OWN },
        toast: { gives: 'main', because: CLOSED_HOST },
        readOnly: { gives: 'body, marked, down hidden', because: CLOSED_OWN },
        takeDown: { gives: 'body', because: CLOSED_OWN },
        form: { gives: 'main', because: CLOSED_OWN },
        arrival: {
            gives: { chromium: 'host/c', firefox: 'host/c', webkit: 'main' },
            because: CLOSED_PRESS,
        },
        focusAfterDraw: { gives: 'main', because: CLOSED_OWN },
        arrivalHook: { gives: { chromium: 'main', firefox: 'main' }, because: CLOSED_OWN },
        refusalHook: { gives: 'main', because: CLOSED_OWN },
    },
    'ours in other': {
        panel: { gives: 'xo/xi', because: THROUGH_OTHER },
        toast: { gives: { chromium: 'xo', webkit: 'xo', firefox: 'main' }, because: THROUGH_OTHER },
        readOnly: { gives: 'xo/xi, marked, down hidden', because: THROUGH_OTHER },
        takeDown: { gives: 'xo/xi', because: THROUGH_OTHER },
    },
    arrived: { dialog: { gives: 'body', because: DIALOG_GONE } },
};

for (const [row, words, path] of ROWS) {
    test.describe(`with focus ${words}`, () => {
        for (const column of COLUMNS) {
            test(column.name, async ({ page, browserName }) => {
                test.skip(column.inPlace && UNDRAWN[row] !== undefined, UNDRAWN[row]);
                const square: Square = { page, row, browserName, at: (name) => `${path}${name}` };
                const failing = FAILING[row]?.[column.key];
                const gives = inEngine(failing?.gives, browserName);
                if (failing && gives !== undefined)
                    test.info().annotations.push({ type: 'fails', description: failing.because });
                await open(page, row);
                await column.start(square);
                await call(page, 'leave');
                await column.act(square);
                await frames(page, 3);
                const read = column.read ? await column.read(square) : await where(page);
                expect(read).toBe(
                    gives ??
                        inEngine(ANSWERS[row]?.[column.key], browserName) ??
                        column.expected(square)
                );
            });
        }
    });
}
