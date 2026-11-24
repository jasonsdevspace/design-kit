import { readFileSync } from 'node:fs';

import { type BrowserContext, type Clock, expect, type Locator, type Page } from '@playwright/test';
import ts from 'typescript';

import { contrast as ratio } from '../examples/palette.js';

/*
 * What every spec that draws the kit in a browser needs: the sheets as the source has them, a page
 * written into the browser with them, and the reads of what the browser drew. One copy, so a width
 * or a theme added here reaches every spec.
 */

/** The origin the specs that load a module serve their page from, so it has storage of its own. */
export const ORIGIN = 'https://kit.test';

/** Where a still clock starts, a fixed moment, so every run reads the same time. */
const CLOCK_START = Date.UTC(2026, 0, 1);

/**
 * Where a still clock stops, a day after it starts. The clock runs from the moment it is put on
 * and can only be stopped at a time it has not yet passed, so the stop lies further ahead than any
 * test runs, and however slow a runner is between the two calls the stop is still to come.
 */
export const CLOCK_STOP = CLOCK_START + 24 * 60 * 60 * 1000;

/**
 * Puts a stand-in clock on a page or a context and stops it, so time moves only by the test's own
 * steps. An installed clock left running keeps pace with real time between steps as well, and on a
 * slow runner that real time can fire a timer before the step that expects it to be still waiting.
 * It is called before the page it holds loads, or followed by a reload, since the stop a day ahead
 * fires at once every timer a page already running has set to come due within that day. A page
 * loaded after it takes the stopped time and fires nothing.
 */
export const stillClock = async (clock: Pick<Clock, 'install' | 'pauseAt'>): Promise<void> => {
    await clock.install({ time: CLOCK_START });
    await clock.pauseAt(CLOCK_STOP);
};

/**
 * Waits the frames given, in the page, as `frames` runs it and as a page's own script does where
 * it waits for frames itself, so both wait the same way.
 */
export const framesIn = (count: number): Promise<void> =>
    new Promise<void>((done) => {
        const next = (left: number) => {
            if (left <= 0) done();
            else
                requestAnimationFrame(() => {
                    next(left - 1);
                });
        };
        next(count);
    });

/**
 * Waits two frames, or the frames given, so a request's own frame has come and gone, and a draw
 * the page asked for and the microtasks after it are done. A page on a still clock steps its
 * frames by the clock instead.
 */
export const frames = (page: Page, count = 2): Promise<void> => page.evaluate(framesIn, count);

/** A module of the kit's, as a browser loads it, built from the source with its imports kept. */
export const js = (file: string): string =>
    ts.transpileModule(readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'), {
        compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
    }).outputText;

/** A sheet of the kit's, as the source has it. */
export const sheet = (name: string): string =>
    readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8');

/** The kit's sheets, in the order a page loads them. */
export const KIT = ['tokens.css', 'base.css', 'components.css'].map(sheet).join('\n');

/**
 * A page written into the browser at the width and height given, in the theme given, with the
 * kit's sheets and any rules of the page's own after them, and the title and body given.
 */
export const writePage = async (
    page: Page,
    {
        width = 1280,
        height = 900,
        theme = 'light',
        title,
        body,
        css = '',
    }: {
        readonly width?: number;
        readonly height?: number;
        readonly theme?: 'light' | 'dark';
        readonly title: string;
        readonly body: string;
        readonly css?: string;
    }
): Promise<void> => {
    await page.setViewportSize({ width, height });
    await page.setContent(
        `<!doctype html><html lang="en" data-theme="${theme}"><head><title>${title}</title>` +
            `<style>${KIT}${css}</style></head><body>${body}</body></html>`
    );
};

/**
 * A page that loads the kit's controls, served on the test origin from memory, so a module script
 * runs and the page has storage of its own: the kit's sheets and any rules of the page's own after
 * them, the controls as a module, and the page's own script, if it has one, after the body. Given a
 * page, it goes to it, so the viewport and any stand-in clock are set first. Given a browser
 * context, it serves every tab the context opens, each going to the origin itself.
 */
export const servePage = async (
    target: Page | BrowserContext,
    {
        title,
        body,
        script,
        head = '',
        css = '',
        theme,
        dir,
        headers,
    }: {
        readonly title: string;
        readonly body: string;
        readonly script?: string | undefined;
        readonly head?: string;
        readonly css?: string;
        readonly theme?: 'light' | 'dark';
        readonly dir?: 'ltr' | 'rtl';
        readonly headers?: Readonly<Record<string, string>>;
    }
): Promise<void> => {
    const files: Readonly<Record<string, readonly [string, string]>> = {
        '/kit.css': [`${KIT}${css}`, 'text/css'],
        '/controls.js': [js('controls.ts'), 'text/javascript'],
        // The controls import the theme's names from it.
        '/theme.js': [js('theme.ts'), 'text/javascript'],
        // The controls keep each status line's state and speech in it.
        '/line.js': [js('line.ts'), 'text/javascript'],
        // The controls take each attach down through it.
        '/teardown.js': [js('teardown.ts'), 'text/javascript'],
        // The controls and their words find a piece's parts through it.
        '/find.js': [js('find.ts'), 'text/javascript'],
        // The controls take the kit's words for a failure from it.
        '/words.js': [js('words.ts'), 'text/javascript'],
        ...(script === undefined ? {} : { '/page.js': [script, 'text/javascript'] as const }),
    };
    const html =
        `<!doctype html><html lang="en"${dir ? ` dir="${dir}"` : ''}` +
        `${theme ? ` data-theme="${theme}"` : ''}><head><title>${title}</title>${head}` +
        `<link rel="stylesheet" href="/kit.css"></head><body>${body}` +
        (script === undefined ? '' : '<script type="module" src="/page.js"></script>') +
        '</body></html>';
    await target.route(`${ORIGIN}/**`, (route) => {
        const path = new URL(route.request().url()).pathname;
        const [served, contentType] = files[path] ?? [html, 'text/html'];
        return route.fulfill({ body: served, contentType, ...(headers ? { headers } : {}) });
    });
    if ('goto' in target) await target.goto(`${ORIGIN}/`);
};

/** The computed values of the properties named, on the element the locator finds. */
export const style = (locator: Locator, ...names: string[]): Promise<Record<string, string>> =>
    locator.evaluate(
        (element, wanted) =>
            Object.fromEntries(
                wanted.map((name) => [name, getComputedStyle(element).getPropertyValue(name)])
            ),
        names
    );

/** Where the element the locator finds is drawn, or a failure that names it. */
export const box = async (
    locator: Locator,
    what = 'the element'
): Promise<{ x: number; y: number; width: number; height: number }> => {
    const drawn = await locator.boundingBox();
    if (!drawn) throw new Error(`expected ${what} to be drawn`);
    return drawn;
};

/**
 * How tall the element the locator finds is drawn, to the pixel, or nothing where it is not
 * drawn.
 */
export const height = async (locator: Locator): Promise<number> =>
    Math.round((await locator.boundingBox())?.height ?? 0);

/** How far the page itself scrolls sideways, which is nothing when it reflows. */
export const sideways = (page: Page): Promise<number> =>
    page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );

/**
 * What a phone held on its side keeps at each edge, in pixels, and the rule that sets them as the
 * safe area tokens, one copy for every spec that draws a piece clear of them.
 */
export const SIDES = { left: 47, right: 47, bottom: 21 } as const;
export const SIDES_CSS = `:root { --dk-safe-left: ${String(SIDES.left)}px; --dk-safe-right: ${String(SIDES.right)}px; --dk-safe-bottom: ${String(SIDES.bottom)}px; }`;

/** The theme set on the root, or null where none is. */
export const themeOf = (page: Page): Promise<string | null> =>
    page.evaluate(() => document.documentElement.getAttribute('data-theme'));

/** The Tab key, which Safari on a Mac keeps for fields unless Option is held. */
export const tabKey = (browserName: string): string =>
    browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';

/** The red, green, blue and alpha of a color the browser resolved to rgb or to srgb. */
export const channels = (color: string): readonly [number, number, number, number] => {
    const [red = 0, green = 0, blue = 0, alpha = 1] = (
        color.match(/-?[\d.]+(?:e-?\d+)?/g) ?? []
    ).map(Number);
    if (color.startsWith('rgb')) return [red, green, blue, alpha];
    if (color.startsWith('color(srgb ')) return [red * 255, green * 255, blue * 255, alpha];
    throw new Error(`expected a color in rgb or srgb, got ${color}`);
};

/**
 * The contrast between a color the browser resolved and the ground it sits on, by the measure the
 * tokens use. A translucent color is weighed over its ground, since what shows is the two mixed, so
 * a color drawn at a tenth of its strength measures as faint as it looks. The ground must be
 * opaque, as `groundOf` gives it, since a translucent ground is only known over what shows through.
 */
export const contrast = (first: string, second: string): number => {
    const top = channels(first);
    const ground = channels(second);
    if (ground[3] < 1)
        throw new Error(`expected an opaque ground, got ${second}: measure it with groundOf`);
    const hex = (color: readonly number[]) =>
        `#${color
            .slice(0, 3)
            .map((part) => Math.round(part).toString(16).padStart(2, '0'))
            .join('')}`;
    const mixed = top
        .slice(0, 3)
        .map((part, at) => part * top[3] + (ground[at] ?? 0) * (1 - top[3]));
    return ratio(hex(mixed), hex(ground));
};

/**
 * The ground the element the locator finds is drawn on: the backgrounds of it and of what holds it,
 * laid one over another from the root's up, so a translucent one is weighed over what shows
 * through it, or a failure where nothing under it is opaque.
 */
export const groundOf = async (locator: Locator): Promise<string> => {
    const layers = await locator.evaluate((element) => {
        const found: string[] = [];
        for (let at: Element | null = element; at; at = at.parentElement)
            found.push(getComputedStyle(at).backgroundColor);
        return found.reverse();
    });
    const from = layers.findLastIndex((layer) => channels(layer)[3] === 1);
    if (from < 0)
        throw new Error(`expected an opaque ground under the element, got ${layers.join(', ')}`);
    let ground = channels(layers[from] ?? '').slice(0, 3);
    for (const layer of layers.slice(from + 1)) {
        const [red, green, blue, alpha] = channels(layer);
        ground = [red, green, blue].map(
            (part, at) => part * alpha + (ground[at] ?? 0) * (1 - alpha)
        );
    }
    return `rgb(${ground.map((part) => String(Math.round(part))).join(', ')})`;
};

/** A color as the page resolves it, a system color or a token, from an element asked to take it. */
export const colorOf = (page: Page, name: string): Promise<string> =>
    page.evaluate((color) => {
        const probe = document.createElement('span');
        probe.style.color = color;
        document.body.append(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        return resolved;
    }, name);

/** A shadow as the page resolves it, a token's included, from an element asked to cast it. */
export const shadowOf = (page: Page, value: string): Promise<string> =>
    page.evaluate((shadow) => {
        const probe = document.createElement('span');
        probe.style.boxShadow = shadow;
        document.body.append(probe);
        const resolved = getComputedStyle(probe).boxShadow;
        probe.remove();
        return resolved;
    }, value);

/**
 * A length as the page resolves it, a token's or a sum of them, in pixels, from an element asked to
 * stand that far in, so a test compares with what a token draws rather than a figure copied from
 * it. A token the page does not declare fails rather than resolving to nothing.
 */
export const lengthOf = (page: Page, value: string): Promise<number> =>
    page.evaluate((length) => {
        const root = getComputedStyle(document.documentElement);
        for (const [, name = ''] of length.matchAll(/var\((--[\w-]+)/g)) {
            const raw = root.getPropertyValue(name).trim();
            if (!raw) throw new Error(`expected ${name} declared on the root`);
            // A color or a keyword would come back as no length at all, so it is refused.
            if (!raw.includes('var(') && !CSS.supports('width', raw))
                throw new Error(`expected ${name} to be a length, got ${raw}`);
        }
        const probe = document.createElement('div');
        probe.style.marginLeft = length;
        if (!probe.style.marginLeft) throw new Error(`expected a length, got ${length}`);
        document.body.append(probe);
        const resolved = Number.parseFloat(getComputedStyle(probe).marginLeft);
        probe.remove();
        return resolved;
    }, value);

/**
 * Turns forced colors on for the page, or off again, and fails where the page does not then match
 * them, so a test of forced colors never passes on a page drawn in the author's colors.
 */
export const forceColors = async (page: Page, active = true): Promise<void> => {
    await page.emulateMedia({ forcedColors: active ? 'active' : 'none' });
    expect(
        await page.evaluate(() => matchMedia('(forced-colors: active)').matches),
        'whether the page draws in forced colors'
    ).toBe(active);
};

/**
 * Brings focus to the element as the keyboard does, by leaving it backward and coming back, so the
 * browser draws the ring it keeps for keyboard focus, which focus from a script may not show.
 */
export const ringByKeyboard = async (locator: Locator, browserName: string): Promise<void> => {
    const keys = locator.page().keyboard;
    await locator.focus();
    await keys.press(`Shift+${tabKey(browserName)}`);
    await keys.press(tabKey(browserName));
    await expect(locator).toBeFocused();
};

/**
 * A length the browser reports, in pixels, for a check within a twentieth of a pixel, since Firefox
 * rounds a computed length to a sixty-fourth of a pixel where the others keep the figure written.
 */
export const pixels = (length: string | undefined): number => Number.parseFloat(length ?? '');

/**
 * How much of the width an element's words take is covered by the longest unbroken run of pixels
 * in a color other than the element's own fill, the color most of the element is drawn in, read
 * from screenshots through a canvas. Words drawn on the fill break every row into short strokes,
 * and a backplate a browser paints behind them runs the whole width, a check on what shows where a
 * computed style cannot tell. The box holds the words alone, not an icon beside them, and inside the
 * element.
 */
export const backplateUnderWords = async (locator: Locator): Promise<number> => {
    const page = locator.page();
    await locator.scrollIntoViewIfNeeded();
    const whole = (await locator.screenshot()).toString('base64');
    const words = await locator.evaluate((element) => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const rects: DOMRect[] = [];
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (!node.textContent?.trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(node);
            rects.push(range.getBoundingClientRect());
        }
        // Within the element's own box, which a line of words can run past on some fonts.
        const own = element.getBoundingClientRect();
        const left = Math.max(own.left, Math.min(...rects.map((rect) => rect.left)));
        const top = Math.max(own.top, Math.min(...rects.map((rect) => rect.top)));
        const right = Math.min(own.right, Math.max(...rects.map((rect) => rect.right)));
        const bottom = Math.min(own.bottom, Math.max(...rects.map((rect) => rect.bottom)));
        return { x: left, y: top, width: right - left, height: bottom - top };
    });
    const under = (await page.screenshot({ clip: words })).toString('base64');
    return page.evaluate(
        async ([shotOfWhole = '', shotUnder = '']) => {
            const read = async (data: string) => {
                const image = new Image();
                image.src = `data:image/png;base64,${data}`;
                await image.decode();
                const canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                const context = canvas.getContext('2d');
                context?.drawImage(image, 0, 0);
                const drawn = context?.getImageData(0, 0, image.width, image.height).data;
                return {
                    width: image.width,
                    pixels: drawn ? [...new Uint32Array(drawn.buffer)] : [],
                };
            };
            const counts = new Map<number, number>();
            for (const pixel of (await read(shotOfWhole)).pixels)
                counts.set(pixel, (counts.get(pixel) ?? 0) + 1);
            const fill = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
            // A shade off the fill still counts as it, since two screenshots can differ by one.
            const channels = (pixel: number) => [
                pixel & 255,
                (pixel >> 8) & 255,
                (pixel >> 16) & 255,
            ];
            const filled = channels(fill ?? 0);
            const near = (pixel: number) =>
                channels(pixel).reduce(
                    (sum, value, at) => sum + Math.abs(value - (filled[at] ?? 0)),
                    0
                ) < 24;
            const { width, pixels } = await read(shotUnder);
            let longest = 0;
            for (let row = 0; row * width < pixels.length; row += 1) {
                let run = 0;
                for (let column = 0; column < width; column += 1) {
                    run = near(pixels[row * width + column] ?? 0) ? 0 : run + 1;
                    longest = Math.max(longest, run);
                }
            }
            return longest / width;
        },
        [whole, under] as const
    );
};

/**
 * Waits for what the element given plays as it arrives to end, such as a toast's rise or a sheet's,
 * so it is measured where it comes to rest. It waits on the element's own animations alone, so one
 * elsewhere on the page that never ends, such as a table's scroll shade, does not hold it up.
 */
export const settle = (locator: Locator): Promise<unknown> =>
    locator.evaluate((element) =>
        Promise.all(element.getAnimations().map((animation) => animation.finished))
    );
