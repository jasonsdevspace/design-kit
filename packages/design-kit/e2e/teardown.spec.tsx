import { expect, type Page, test } from '@playwright/test';

import { leaksOf, listenersOn, openCounted } from './leaks.js';
import { framesIn } from './page.js';
import { BODY, DRAW_FRAME, KEPT, script } from './teardown-pieces.js';

/*
 * The teardown contract of records 22 and 23, in Chromium, WebKit and Firefox, over every piece in
 * the table teardown-pieces.tsx shares with leaks.spec.tsx: a signal already aborted attaches
 * nothing and keeps nothing, aborting takes the piece down a microtask later and its detach at once,
 * each signal that attached the piece holds it until it aborts, an old detach and an old signal
 * leave a newer attach alone, an abort and an attach in one task keep the piece and what it was
 * doing while one a microtask later starts afresh, and nothing the piece set going acts after its
 * teardown. Each piece's own cases follow in a block of its own. The leak spec makes every count of
 * what a piece leaves running after an attach, so this spec counts only what that one does not,
 * through the counters in leaks.ts. A test whose page waits on a timer runs on a clock that stands
 * still and steps it, and one whose page waits on frames waits for them on the browser's own clock.
 */

/*
 * What the tests here add to the page: options with a signal only where one is given, a panel's
 * button attached by its selector, and the shared wait for two frames, for a page on the browser's
 * own clock, which a page's own script calls where it waits for frames in the middle of a test.
 */
const MORE = `window.withSignal = (signal, options = {}) => (signal ? { ...options, signal } : options);
window.panel = (selector, signal) => kit.attachPanel($(selector), withSignal(signal));
window.frames = () => (${framesIn.toString()})(2);`;

/**
 * The page with its controls loaded, nothing of the table attached, and the counters in it, on a
 * clock that stands still unless `clock` is false.
 */
const opened = (page: Page, { clock = true }: { readonly clock?: boolean } = {}): Promise<void> =>
    openCounted(page, { clock, title: 'Teardown', body: BODY, script: script(MORE) });

/** How many listeners the counters see on the targets in the list an expression gives. */
const count = (page: Page, targets: string): Promise<number> => listenersOn(page, targets);

/**
 * What the lines given found wrong, run in the page over every piece an attach keeps, each as the
 * piece's name and what was wrong with it.
 */
const wrongIn = (page: Page, body: string): Promise<string[]> =>
    page.evaluate(`(async () => {
        const wrong = [];
        const names = ${JSON.stringify(KEPT)};
        const fault = (name, what) => wrong.push(name + ': ' + what);
        ${body}
        return wrong;
    })()`);

/** Every message the screen's status line has put in since the page opened. */
const heard = (page: Page): Promise<string[]> => page.evaluate('window.heard');

test.describe('every piece', () => {
    test('attaches nothing given a signal already aborted, and attaches afresh after', async ({
        page,
    }) => {
        await opened(page);
        const wrong = await wrongIn(
            page,
            `const aborted = AbortSignal.abort();
            const first = {};
            for (const name of names) {
                const piece = pieces[name];
                first[name] = piece.attach(aborted);
                piece.use(first[name]);
                piece.after(first[name]);
                if (piece.shows?.()) fault(name, 'shows itself attached');
            }
            await Promise.resolve();
            for (const name of names) {
                const piece = pieces[name];
                if (piece.attach() === first[name]) fault(name, 'kept the aborted attach');
                if (piece.shows && !piece.shows()) fault(name, 'shows nothing attached afresh');
            }`
        );
        expect(wrong).toEqual([]);
    });

    test('takes nothing from a repeat attach given a signal already aborted', async ({ page }) => {
        await opened(page);
        const wrong = await wrongIn(
            page,
            `for (const name of names) {
                const piece = pieces[name];
                const first = piece.attach();
                if (piece.attach(AbortSignal.abort()) === first)
                    fault(name, "gave the aborted repeat the first attach's handle");
                if (piece.attach() !== first) fault(name, 'let go of the first attach');
            }`
        );
        expect(wrong).toEqual([]);
    });

    test('takes each piece down a microtask after its signal aborts', async ({ page }) => {
        await opened(page);
        const wrong = await wrongIn(
            page,
            `const controller = new AbortController();
            const handles = {};
            for (const name of names) {
                const piece = pieces[name];
                handles[name] = piece.attach(controller.signal);
                if (piece.shows && !piece.shows()) fault(name, 'shows nothing attached');
            }
            controller.abort();
            for (const name of names)
                if (pieces[name].shows?.() === false) fault(name, "taken down in the abort's task");
            await Promise.resolve();
            for (const name of names) {
                const piece = pieces[name];
                if (piece.shows?.()) fault(name, 'shows itself attached after its teardown');
                if (piece.attach() === handles[name]) fault(name, 'kept after its teardown');
            }`
        );
        expect(wrong).toEqual([]);
    });

    test('takes each piece down at once by its detach', async ({ page }) => {
        await opened(page);
        const wrong = await wrongIn(
            page,
            `const controller = new AbortController();
            for (const name of names) {
                const piece = pieces[name];
                if (!piece.detach) continue;
                const handle = piece.attach(controller.signal);
                piece.detach(handle);
                if (piece.shows?.()) fault(name, 'shows itself attached after its detach');
                if (piece.attach() === handle) fault(name, 'kept after its detach');
            }`
        );
        expect(wrong).toEqual([]);
    });

    test('keeps each piece attached until every signal holding it has aborted', async ({
        page,
    }) => {
        await opened(page);
        const wrong = await wrongIn(
            page,
            `const first = new AbortController();
            const later = new AbortController();
            const handles = {};
            for (const name of names) {
                const piece = pieces[name];
                handles[name] = piece.attach(first.signal);
                if (piece.attach(later.signal) !== handles[name])
                    fault(name, 'gave a second holder another handle');
            }
            first.abort();
            await Promise.resolve();
            for (const name of names) {
                const piece = pieces[name];
                if (piece.shows && !piece.shows()) fault(name, 'taken down while held');
                if (piece.attach(later.signal) !== handles[name]) fault(name, 'let go while held');
            }
            later.abort();
            await Promise.resolve();
            for (const name of names) {
                const piece = pieces[name];
                if (piece.shows?.()) fault(name, 'shows itself attached once every holder let go');
                if (piece.attach() === handles[name]) fault(name, 'kept once every holder let go');
            }`
        );
        expect(wrong).toEqual([]);
    });

    test('leaves a newer attach alone when the old detach runs twice and its signal aborts', async ({
        page,
    }) => {
        await opened(page);
        const wrong = await wrongIn(
            page,
            `const controller = new AbortController();
            const newer = {};
            for (const name of names) {
                const piece = pieces[name];
                if (!piece.detach) continue;
                const old = piece.attach(controller.signal);
                piece.detach(old);
                newer[name] = piece.attach();
                piece.detach(old);
            }
            controller.abort();
            await Promise.resolve();
            for (const name of Object.keys(newer)) {
                const piece = pieces[name];
                if (piece.shows && !piece.shows()) fault(name, 'took the newer attach down');
                if (piece.attach() !== newer[name]) fault(name, 'let go of the newer attach');
            }`
        );
        expect(wrong).toEqual([]);
    });

    test('keeps each piece and its handle through an abort and an attach in one task', async ({
        page,
    }) => {
        await opened(page);
        const wrong = await wrongIn(
            page,
            `const first = new AbortController();
            const later = new AbortController();
            const handles = {};
            for (const name of names) handles[name] = pieces[name].attach(first.signal);
            first.abort();
            for (const name of names)
                if (pieces[name].attach(later.signal) !== handles[name])
                    fault(name, "made afresh by an attach in the abort's task");
            await Promise.resolve();
            for (const name of names) {
                const piece = pieces[name];
                if (piece.shows && !piece.shows()) fault(name, 'taken down though attached again');
            }
            later.abort();
            await Promise.resolve();
            for (const name of names)
                if (pieces[name].shows?.()) fault(name, 'kept once the later signal aborted');`
        );
        expect(wrong).toEqual([]);
    });

    test('joins a piece attached without a signal in the task its holder let go', async ({
        page,
    }) => {
        await opened(page);
        const wrong = await wrongIn(
            page,
            `const first = new AbortController();
            const handles = {};
            for (const name of names) handles[name] = pieces[name].attach(first.signal);
            first.abort();
            for (const name of names)
                if (pieces[name].attach() !== handles[name])
                    fault(name, "made afresh by the page's attach in the abort's task");
            await Promise.resolve();
            for (const name of names) {
                const piece = pieces[name];
                if (piece.shows && !piece.shows()) fault(name, 'taken down though the page holds it');
                if (piece.attach() !== handles[name]) fault(name, 'let go though the page holds it');
            }`
        );
        expect(wrong).toEqual([]);
    });

    test('starts each piece afresh where it is attached a microtask after the abort', async ({
        page,
    }) => {
        await opened(page);
        const wrong = await wrongIn(
            page,
            `const first = new AbortController();
            const handles = {};
            for (const name of names) handles[name] = pieces[name].attach(first.signal);
            first.abort();
            await Promise.resolve();
            for (const name of names) {
                const piece = pieces[name];
                if (piece.attach(new AbortController().signal) === handles[name])
                    fault(name, 'kept through a microtask after the abort');
                if (piece.shows && !piece.shows()) fault(name, 'shows nothing attached afresh');
            }`
        );
        expect(wrong).toEqual([]);
    });

    test('says nothing and shows nothing after its teardown, whatever is called on it', async ({
        page,
    }) => {
        await opened(page);
        // The line is the page's, attached without the signal, so only each piece's own teardown
        // keeps its words off it. The status line itself is left out, since the page holds it
        // here, and its own teardown is the status line's block's. Each piece is used before the
        // abort, so a wait or a timer of its own is due as the teardown lands.
        await page.evaluate(`(async () => {
            kit.attachStatus(line);
            const controller = new AbortController();
            const handles = {};
            for (const name of ${JSON.stringify(KEPT.filter((name) => name !== 'the status line'))}) {
                handles[name] = pieces[name].attach(controller.signal);
                pieces[name].use(handles[name]);
            }
            controller.abort();
            await Promise.resolve();
            for (const name of Object.keys(handles)) pieces[name].after(handles[name]);
        })()`);
        await page.clock.runFor(10_000);
        expect(await heard(page)).toEqual([]);
        await expect(page.locator('.dk-toast')).not.toHaveAttribute('data-shown');
        await expect(page.locator('#end-game')).not.toHaveAttribute('open');
        // The panel its button opened is the page's once the button is let go, and a press on the
        // button no longer closes it.
        await expect(page.locator('#round-tips')).toBeVisible();
        await expect(page.locator('#busy')).not.toHaveAttribute('aria-disabled');
        await expect(page.locator('.dk-theme-switch-button')).not.toHaveAttribute(
            'aria-expanded',
            'true'
        );
        // The reset puts back the markup's value, and the press after it raises nothing.
        await expect(page.locator('.dk-stepper-value')).toHaveValue('4');
    });

    test('keeps what each piece was doing through an abort and an attach in one task', async ({
        page,
    }) => {
        // Counts each observer made for the group and each time the form's check sets noValidate.
        await page.addInitScript(() => {
            const counted = window as unknown as { observers: number; checks: number };
            counted.observers = 0;
            counted.checks = 0;
            const Made = window.ResizeObserver;
            window.ResizeObserver = class extends Made {
                override observe(target: Element, options?: ResizeObserverOptions) {
                    if (target.classList.contains('dk-button-grid')) counted.observers += 1;
                    super.observe(target, options);
                }
            };
            const own = Object.getOwnPropertyDescriptor(HTMLFormElement.prototype, 'noValidate');
            Object.defineProperty(HTMLFormElement.prototype, 'noValidate', {
                ...own,
                set(this: HTMLFormElement, value: boolean) {
                    if (this.id === 'join') counted.checks += 1;
                    own?.set?.call(this, value);
                },
            });
        });
        await opened(page);
        await page.evaluate(`(() => {
            window.first = new AbortController();
            kit.attachBusy($('#busy'), withSignal(first.signal, { status: line }));
            kit.attachRoving($('.dk-button-grid'), withSignal(first.signal));
            kit.attachDialog($('#end-game'), withSignal(first.signal))($('#finish'));
            kit.attachToast($('.dk-toast'), withSignal(first.signal))('Round 2 saved.');
            kit.attachForm($('#join'), withSignal(first.signal, { status: line }));
            $('#join').requestSubmit();
            $('#busy').setAttribute('data-busy', 'Saving the rule.');
        })()`);
        await expect(page.locator('#busy')).toHaveAttribute('aria-disabled', 'true');
        await expect(page.locator('#name')).toHaveAttribute('aria-invalid', 'true');
        const before = await page.evaluate(`({ observers, checks })`);
        await page.evaluate(`(() => {
            window.marks = 0;
            new MutationObserver((records) => {
                marks += records.length;
            }).observe($('#busy'), { attributeFilter: ['aria-disabled'] });
            first.abort();
            const later = new AbortController();
            kit.attachBusy($('#busy'), withSignal(later.signal, { status: line }));
            kit.attachRoving($('.dk-button-grid'), withSignal(later.signal));
            kit.attachDialog($('#end-game'), withSignal(later.signal));
            kit.attachToast($('.dk-toast'), withSignal(later.signal));
            kit.attachForm($('#join'), withSignal(later.signal, { status: line }));
        })()`);
        // The dialog and the toast stay open, the group was not observed again, and the form kept
        // its errors and its check.
        await expect(page.locator('#end-game')).toHaveAttribute('open');
        await expect(page.locator('.dk-toast')).toHaveAttribute('data-shown');
        await expect(page.locator('#name')).toHaveAttribute('aria-invalid', 'true');
        expect(await page.evaluate(`({ observers, checks })`)).toEqual(before);
        // The busy wait kept its mark and says its words once.
        await page.clock.runFor(5000);
        expect(await page.evaluate('marks')).toBe(0);
        await expect(page.locator('#busy')).toHaveAttribute('aria-disabled', 'true');
        expect((await heard(page)).filter((words) => words === 'Saving the rule.')).toEqual([
            'Saving the rule.',
        ]);
    });
});

test.describe('the theme switch', () => {
    test("takes the document's listener off when taken down with its choices open", async ({
        page,
    }) => {
        await opened(page);
        const before = await count(page, '[document]');
        await page.evaluate(`(() => {
            window.controller = new AbortController();
            kit.attachThemeSwitch($('.dk-theme-switch'), withSignal(controller.signal));
            $('.dk-theme-switch-button').click();
        })()`);
        await expect(page.locator('.dk-theme-switch-button')).toHaveAttribute(
            'aria-expanded',
            'true'
        );
        expect(await count(page, '[document]')).toBe(before + 1);
        // The page marks the choices closed itself before the abort, which a teardown that closed
        // them by reading the button would take for nothing to close.
        await page.evaluate(`(() => {
            $('.dk-theme-switch-button').setAttribute('aria-expanded', 'false');
            controller.abort();
        })()`);
        await expect(page.locator('.dk-theme-switch')).toBeHidden();
        expect(await count(page, '[document]')).toBe(before);
    });

    /*
     * Each way the switch's choices close, given as script that closes them once they are open:
     * the button pressed again, Escape, a choice picked by a pointer, focus leaving the switch and
     * a tap outside it. Events are sent by script, since the button shows only in a narrow strip.
     */
    const CLOSINGS = {
        'the button': `$('.dk-theme-switch-button').click()`,
        Escape: `$('.dk-theme-switch').dispatchEvent(
            new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
        )`,
        'a pick': `(() => {
            const choice = $('.dk-theme-switch-choice');
            choice.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
            choice.click();
        })()`,
        'focus leaving': `$('.dk-theme-switch').dispatchEvent(
            new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body })
        )`,
        'a tap outside': `document.body.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))`,
    };

    test("takes the document's listener off however its choices close", async ({ page }) => {
        await opened(page);
        const before = await count(page, '[document]');
        await page.evaluate(`kit.attachThemeSwitch($('.dk-theme-switch'))`);
        const button = page.locator('.dk-theme-switch-button');
        for (const [way, closing] of Object.entries(CLOSINGS)) {
            await page.evaluate(`$('.dk-theme-switch-button').click()`);
            await expect(button).toHaveAttribute('aria-expanded', 'true');
            expect(await count(page, '[document]'), way).toBe(before + 1);
            await page.evaluate(closing);
            await expect(button, way).toHaveAttribute('aria-expanded', 'false');
            expect(await count(page, '[document]'), way).toBe(before);
        }
    });

    test('no longer follows a theme chosen after its teardown', async ({ page }) => {
        await opened(page);
        await page.evaluate(`(() => {
            window.controller = new AbortController();
            kit.attachThemeSwitch($('.dk-theme-switch'), withSignal(controller.signal));
        })()`);
        const radios = page.locator('.dk-theme-switch input[type="radio"]');
        const checked = () =>
            radios.evaluateAll((all) => all.map((radio) => (radio as HTMLInputElement).checked));
        const before = await checked();
        await page.evaluate('controller.abort()');
        // Chosen once the takedown has landed, a microtask after the abort, as record 23 has it.
        await page.evaluate(`kit.chooseTheme('dark')`);
        expect(await checked()).toEqual(before);
    });
});

test.describe('the copy button', () => {
    /** Which of the copy button's words shows: 0 for Copy, 1 for Copied, 2 for Selected. */
    const wordOf = (page: Page): Promise<number> =>
        page
            .locator('.dk-copy')
            .evaluate((button) =>
                [...button.querySelectorAll('.dk-copy-words > *')].findIndex(
                    (word) => !word.hasAttribute('aria-hidden')
                )
            );

    test('keeps its source where a repeat attach given a signal already aborted names another', async ({
        page,
    }) => {
        await opened(page);
        await page.evaluate(`(() => {
            kit.attachCopyButton($('.dk-copy'), { source: () => $('#code'), status: line });
            kit.attachCopyButton($('.dk-copy'), {
                source: () => $('#other'),
                status: line,
                signal: AbortSignal.abort(),
            });
        })()`);
        await page.locator('.dk-copy').click();
        await expect
            .poll(() => page.evaluate('window.written'))
            .toEqual(['npm install @jasonsdevspace/design-kit']);
    });

    test('puts its word back to Copy as it is taken down', async ({ page }) => {
        await opened(page);
        await page.evaluate(`(() => {
            window.controller = new AbortController();
            kit.attachCopyButton($('.dk-copy'), withSignal(controller.signal, {
                source: () => $('#code'),
                status: line,
            }));
        })()`);
        await page.locator('.dk-copy').click();
        await expect.poll(() => wordOf(page)).toBe(1);
        await page.evaluate('controller.abort()');
        await expect(page.locator('.dk-copy')).toBeHidden();
        expect(await wordOf(page)).toBe(0);
    });

    test('shows Copied and says so for a press the clipboard answers while it stays attached', async ({
        page,
    }) => {
        await opened(page);
        await page.evaluate(`(() => {
            kit.attachStatus(line);
            kit.attachCopyButton($('.dk-copy'), {
                source: () => $('#code'),
                status: line,
                signal: new AbortController().signal,
            });
            window.hold = true;
        })()`);
        await page.locator('.dk-copy').click();
        await page.evaluate('window.release()');
        await page.clock.runFor(300);
        expect(await wordOf(page)).toBe(1);
        expect(await heard(page)).toHaveLength(1);
    });

    test('says nothing of a press the clipboard answers after its teardown', async ({ page }) => {
        await opened(page);
        // The line is the page's, attached without the signal, so only the button's own teardown
        // can keep the press from being said.
        await page.evaluate(`(() => {
            window.controller = new AbortController();
            kit.attachStatus(line);
            kit.attachCopyButton($('.dk-copy'), withSignal(controller.signal, {
                source: () => $('#code'),
                status: line,
            }));
            window.hold = true;
        })()`);
        await page.locator('.dk-copy').click();
        // The clipboard answers in the abort's task.
        await page.evaluate(`(() => {
            controller.abort();
            window.release();
        })()`);
        // Past the moment the line says a message, where a press heard after the teardown would
        // show Copied and say it.
        await page.clock.runFor(300);
        expect(await wordOf(page)).toBe(0);
        expect(await heard(page)).toEqual([]);
    });

    test('still copies through a newer attach after the old detach runs twice and its signal aborts', async ({
        page,
    }) => {
        await opened(page);
        await page.evaluate(`(() => {
            const copying = { source: () => $('#code'), status: line };
            const controller = new AbortController();
            const old = kit.attachCopyButton($('.dk-copy'), withSignal(controller.signal, copying));
            old();
            kit.attachCopyButton($('.dk-copy'), copying);
            old();
            controller.abort();
        })()`);
        expect(await count(page, `[$('.dk-copy')]`)).toBe(1);
        await page.locator('.dk-copy').click();
        await expect.poll(() => wordOf(page)).toBe(1);
    });

    test("puts the word back to Copy where a source that reads the page's state gives another block", async ({
        page,
    }) => {
        await opened(page);
        await page.evaluate(`(() => {
            window.tab = '#code';
            window.copyLive = () =>
                kit.attachCopyButton($('.dk-copy'), { source: () => $(window.tab), status: line });
            copyLive();
        })()`);
        await page.locator('.dk-copy').click();
        await expect.poll(() => wordOf(page)).toBe(1);
        // Attached again on the same block, the word stays.
        await page.evaluate('copyLive()');
        expect(await wordOf(page)).toBe(1);
        // The page shows another block, and the source, read as it is, gives that one.
        await page.evaluate(`(() => {
            window.tab = '#other';
            copyLive();
        })()`);
        expect(await wordOf(page)).toBe(0);
    });

    test('reads a source only while a word is shown, and takes one that throws for another block', async ({
        page,
    }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await opened(page);
        // A source that throws while its block is not drawn, as one reading a ref does.
        await page.evaluate(`(() => {
            window.copyDrawn = () =>
                kit.attachCopyButton($('.dk-copy'), {
                    source: () => {
                        if (!window.drawn) throw new Error('the block is not drawn');
                        return $('#code');
                    },
                    status: line,
                });
            window.drawn = true;
            copyDrawn();
            window.drawn = false;
            copyDrawn();
            window.drawn = true;
        })()`);
        await page.locator('.dk-copy').click();
        await expect.poll(() => wordOf(page)).toBe(1);
        await page.evaluate(`(() => {
            window.drawn = false;
            copyDrawn();
        })()`);
        expect(await wordOf(page)).toBe(0);
        expect(errors).toEqual([]);
    });

    test('reads its source on a join only while a word is shown', async ({ page }) => {
        await opened(page);
        const reads = await page.evaluate(`(() => {
            let reads = 0;
            const copying = {
                source: () => {
                    reads += 1;
                    return $('#code');
                },
                status: line,
            };
            for (let call = 0; call < 3; call += 1) kit.attachCopyButton($('.dk-copy'), copying);
            return reads;
        })()`);
        expect(reads).toBe(0);
    });
});

test.describe('the status line', () => {
    const shown = (page: Page) => page.locator('.screen-status');

    test('says nothing through a line given a signal already aborted, nor a repeat given one', async ({
        page,
    }) => {
        await opened(page);
        await page.evaluate(`(() => {
            const aborted = AbortSignal.abort();
            kit.attachStatus(line, { signal: aborted })('Saved.');
            window.first = kit.attachStatus(line);
            kit.attachStatus(line, { signal: aborted })('Not said.');
        })()`);
        await page.clock.runFor(300);
        await expect(shown(page)).toHaveText('');
        // Nothing was kept for the aborted attach, so the line attached without a signal speaks.
        await page.evaluate(`window.first('Saved.')`);
        await page.clock.runFor(300);
        await expect(shown(page)).toHaveText('Saved.');
    });

    test('lets a line go when its signal aborts, so no piece speaks on it until attached again', async ({
        page,
    }) => {
        await opened(page);
        await page.evaluate(`(() => {
            kit.attachStepper($('.dk-stepper'), { status: line });
            kit.attachProgress($('#import'), { status: line, done: 'Imported.' });
            window.controller = new AbortController();
            window.say = kit.attachStatus(line, withSignal(controller.signal));
            say('Saved.');
            say('3 still to enter.', { settle: 700 });
        })()`);
        await page.clock.runFor(300);
        await expect(shown(page)).toHaveText('Saved.');
        await page.evaluate('controller.abort()');
        await expect(shown(page)).toHaveText('');
        await page.evaluate(`(() => {
            say('Not said.');
            $('#import').value = 40;
        })()`);
        await page.getByRole('button', { name: /^Raise/ }).click();
        await page.clock.runFor(1000);
        await expect(shown(page)).toHaveText('');
        // Attached again, the line speaks, though what the old attach returned stays silent.
        await page.evaluate(`(() => {
            window.again = kit.attachStatus(line);
            say('Still not said.');
        })()`);
        await page.clock.runFor(300);
        await expect(shown(page)).toHaveText('');
        await page.evaluate(`again('Saved again.')`);
        await page.clock.runFor(300);
        await expect(shown(page)).toHaveText('Saved again.');
        // A piece given the line itself, rather than the old function, speaks on it again, once
        // the words before have left. Apart, so progress sees its run start again before it ends.
        await page.clock.runFor(2500);
        await page.evaluate(`$('#import').value = 0`);
        await page.evaluate(`$('#import').value = 40`);
        await page.clock.runFor(300);
        await expect(shown(page)).toHaveText('Imported.');
    });

    test('lets a line go that a stepper and progress spoke on before the page attached it', async ({
        page,
    }) => {
        await opened(page);
        await page.evaluate(`(() => {
            kit.attachStepper($('.dk-stepper'), { status: line });
            kit.attachProgress($('#import'), { status: line, done: 'Imported.' });
            $('#import').value = 40;
        })()`);
        await page.getByRole('button', { name: /^Raise/ }).click();
        await page.clock.runFor(3100);
        await page.evaluate(`(() => {
            window.controller = new AbortController();
            kit.attachStatus(line, withSignal(controller.signal))('Saved.');
        })()`);
        await page.clock.runFor(300);
        await expect(shown(page)).toHaveText('Saved.');
        await page.evaluate(`(() => {
            controller.abort();
            $('#import').value = 0;
        })()`);
        await expect(shown(page)).toHaveText('');
        // The line is the page's, so its abort lets it go, and neither piece speaks on it after.
        await page.evaluate(`$('#import').value = 40`);
        await page.getByRole('button', { name: /^Raise/ }).click();
        await page.clock.runFor(1000);
        await expect(shown(page)).toHaveText('');
    });

    test('keeps speaking while a later signal holds it, and goes quiet once that one aborts', async ({
        page,
    }) => {
        await opened(page);
        await page.evaluate(`(() => {
            window.first = new AbortController();
            window.later = new AbortController();
            window.say = kit.attachStatus(line, { signal: first.signal });
            kit.attachStatus(line, { signal: later.signal });
            first.abort();
        })()`);
        await page.evaluate(`say('Saved.')`);
        await page.clock.runFor(300);
        await expect(shown(page)).toHaveText('Saved.');
        await page.evaluate('later.abort()');
        await expect(shown(page)).toHaveText('');
        await page.evaluate(`say('Not said.')`);
        await page.clock.runFor(300);
        await expect(shown(page)).toHaveText('');
    });
});

test.describe('the toast', () => {
    const toastLine = (page: Page) => page.locator('.dk-toast-status');

    test('shows nothing given a signal already aborted, and what it returns does nothing', async ({
        page,
    }) => {
        await opened(page);
        await page.evaluate(`(() => {
            const dismiss = kit.attachToast($('.dk-toast'), { signal: AbortSignal.abort() })(
                'Round 3 saved.'
            );
            dismiss();
        })()`);
        await page.clock.runFor(300);
        await expect(page.locator('.dk-toast')).not.toHaveAttribute('data-shown');
        await expect(toastLine(page)).toHaveText('');
    });

    test('takes a toast down when its signal aborts, sending focus back as a dismiss does', async ({
        page,
    }) => {
        await opened(page);
        const onWindow = await count(page, '[window]');
        const { resizeObservers } = await leaksOf(page);
        await page.locator('#start').focus();
        await page.evaluate(`(() => {
            window.controller = new AbortController();
            window.show = kit.attachToast($('.dk-toast'), withSignal(controller.signal));
            show('Round 2 saved.');
            window.dismiss = show('Round 3 saved.');
        })()`);
        await page.clock.runFor(300);
        await expect(toastLine(page)).toHaveText('Round 3 saved.');
        // Shown twice, the toast listens to the window's size once, and watches its own once.
        expect(await count(page, '[window]')).toBe(onWindow + 1);
        expect((await leaksOf(page)).resizeObservers).toBe(resizeObservers + 1);
        await page.locator('.dk-toast-close').focus();
        // A tabindex the page sets after the attach is the page's, and stays.
        await page.evaluate(`(() => {
            $('.dk-toast-action').tabIndex = -1;
            controller.abort();
        })()`);
        await expect(page.locator('.dk-toast')).not.toHaveAttribute('data-shown');
        await expect(toastLine(page)).toHaveText('');
        await expect(page.locator('.dk-toast-close')).not.toHaveAttribute('tabindex');
        await expect(page.locator('.dk-toast-action')).toHaveAttribute('tabindex', '-1');
        // Focus that was on its Close, which the teardown hides, goes back to Start, as a dismiss
        // sends it, rather than dropping to the page's body.
        await expect(page.locator('#start')).toBeFocused();
        // What the attach returned, and what that returned, do nothing after.
        await page.evaluate(`(() => {
            window.dismiss();
            show('Round 4 saved.');
        })()`);
        await page.clock.runFor(300);
        await expect(page.locator('.dk-toast')).not.toHaveAttribute('data-shown');
        await expect(toastLine(page)).toHaveText('');
        // Attached again, the toast speaks on its own line once more.
        await page.evaluate(`kit.attachToast($('.dk-toast'))('Round 4 saved.')`);
        await page.clock.runFor(300);
        await expect(toastLine(page)).toHaveText('Round 4 saved.');
    });

    test("takes a toast the page attached in a frame down, its listener for F8 off the frame's document and focus back in the frame", async ({
        page,
    }) => {
        await opened(page);
        await page.evaluate(DRAW_FRAME);
        const onFrame = () =>
            page.evaluate<number>('frame.contentWindow.leaks.on([frame.contentDocument])');
        const before = await onFrame();
        const inner = page.frameLocator('iframe').locator('#inner');
        await inner.focus();
        await page.evaluate(`(() => {
            window.framed = new AbortController();
            window.showIn = kit.attachToast(frameToast, { signal: framed.signal });
            showIn('Round 2 saved.');
        })()`);
        const attached = await onFrame();
        await page.evaluate(
            `showIn('Round 3 saved.', { label: 'Undo', onAction: () => undefined })`
        );
        expect(await onFrame()).toBe(attached + 1);
        await page.frameLocator('iframe').locator('.dk-toast-close').focus();
        await page.evaluate('framed.abort()');
        await expect(page.locator('iframe')).toBeFocused();
        await expect(inner).toBeFocused();
        // Every listener the toast added to the frame's document comes off, F8's among them.
        await expect.poll(onFrame).toBe(before);
    });

    test('takes the mark off its frame as its signal aborts, and keeps it through an abort and an attach in one task', async ({
        page,
    }) => {
        await opened(page);
        // The toast in an app's frame, which carries the rows the sheet keeps room for.
        await page.evaluate(`(() => {
            const frame = document.createElement('div');
            frame.className = 'dk-app';
            const body = document.createElement('div');
            body.className = 'dk-app-body';
            body.innerHTML = '<p>Round 3 so far.</p>';
            const place = document.createElement('div');
            place.className = 'dk-app-toast';
            place.append($('.dk-toast'));
            frame.append(body, place);
            document.body.append(frame);
            window.first = new AbortController();
            kit.attachToast($('.dk-toast'), withSignal(first.signal))('Round 3 saved.');
        })()`);
        const frame = page.locator('.dk-app');
        await expect(frame).toHaveAttribute('data-toast-rows');
        // Aborted and attached again in one task, the toast stays shown and the frame marked.
        await page.evaluate(`(() => {
            first.abort();
            window.later = new AbortController();
            kit.attachToast($('.dk-toast'), withSignal(later.signal));
        })()`);
        await page.clock.runFor(300);
        await expect(page.locator('.dk-toast')).toHaveAttribute('data-shown');
        await expect(frame).toHaveAttribute('data-toast-rows');
        // Taken down, the toast leaves and its mark with it.
        await page.evaluate('later.abort()');
        await expect(page.locator('.dk-toast')).not.toHaveAttribute('data-shown');
        await expect(frame).not.toHaveAttribute('data-toast-rows');
    });

    test('shows a message while a later signal holds it, and none once that one aborts', async ({
        page,
    }) => {
        await opened(page);
        await page.evaluate(`(() => {
            window.first = new AbortController();
            window.later = new AbortController();
            window.show = kit.attachToast($('.dk-toast'), { signal: first.signal });
            kit.attachToast($('.dk-toast'), { signal: later.signal });
            first.abort();
        })()`);
        await page.evaluate(`show('Round 3 saved.')`);
        await expect(page.locator('.dk-toast')).toHaveAttribute('data-shown', '');
        await page.evaluate('later.abort()');
        await expect(page.locator('.dk-toast')).not.toHaveAttribute('data-shown');
        await page.evaluate(`show('Round 4 saved.')`);
        await page.clock.runFor(300);
        await expect(page.locator('.dk-toast')).not.toHaveAttribute('data-shown');
    });

    test('keeps a toast shown while focus leaves it and comes back in one task', async ({
        page,
    }) => {
        await opened(page);
        await page.evaluate(`kit.attachToast($('.dk-toast'))('Round 2 saved.')`);
        await page.locator('.dk-toast-close').focus();
        await page.evaluate(`(() => {
            $('#start').focus();
            $('.dk-toast-close').focus();
        })()`);
        await page.clock.runFor(10_000);
        await expect(page.locator('.dk-toast')).toHaveAttribute('data-shown');
    });

    test("starts a toast's wait again once it is moved in the page with focus in it", async ({
        page,
        browserName,
    }) => {
        // Only Chromium fires focusout as an element with focus in it leaves the page.
        test.skip(browserName !== 'chromium', 'WebKit and Firefox fire no focusout as it moves');
        await opened(page);
        await page.evaluate(`kit.attachToast($('.dk-toast'))('Round 2 saved.')`);
        await page.locator('.dk-toast-close').focus();
        // Taken out in one task and put back in a later one, as a page that draws it elsewhere
        // does.
        await page.evaluate(`(() => {
            window.toast = $('.dk-toast');
            window.home = toast.parentElement;
            toast.remove();
        })()`);
        await page.evaluate('home.append(toast)');
        await page.clock.runFor(10_000);
        await expect(page.locator('.dk-toast')).not.toHaveAttribute('data-shown');
    });

    /** Shows a message in a toast attached with `controller`, with focus coming from `from`. */
    const shownFrom = async (page: Page, from: string) => {
        await page.evaluate(`(() => {
            window.controller = new AbortController();
            $('${from}').focus();
            kit.attachToast($('.dk-toast'), withSignal(controller.signal))('Round 2 saved.');
        })()`);
        await page.locator('.dk-toast-close').focus();
    };

    test('hands focus back from a toast taken down and then removed from the page in one task', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await shownFrom(page, '#start');
        await page.evaluate(`(() => {
            controller.abort();
            $('.dk-toast').remove();
        })()`);
        await expect(page.locator('#start')).toBeFocused();
    });

    test('leaves focus on a control outside a toast that is removed and taken down as focus moves there', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await shownFrom(page, '#start');
        // As a press on a control outside the toast whose handler takes the toast away.
        await page.evaluate(`(() => {
            $('#target').focus();
            $('.dk-toast').remove();
            controller.abort();
        })()`);
        await page.evaluate('frames()');
        await expect(page.locator('#target')).toBeFocused();
    });

    test('leaves focus a visitor moved after a toast with focus in it left the page', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await shownFrom(page, '#target');
        // Taken from the page while still attached, and focus put on a field afterward.
        await page.evaluate(`$('.dk-toast').remove()`);
        await page.locator('#start').focus();
        await page.evaluate('controller.abort()');
        await page.evaluate('frames()');
        await expect(page.locator('#start')).toBeFocused();
    });

    test('hands focus back from a toast taken from the page with focus in it and taken down in a later task', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await shownFrom(page, '#target');
        await page.evaluate(`$('.dk-toast').remove()`);
        await page.evaluate('controller.abort()');
        await page.evaluate('frames()');
        await expect(page.locator('#target')).toBeFocused();
    });

    test('leaves focus on the body where a visitor moved it after a toast left the page with focus in it', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await shownFrom(page, '#target');
        await page.evaluate(`$('.dk-toast').remove()`);
        // The visitor moves focus to a control the page then takes away, so focus falls to the
        // body.
        await page.locator('#start').focus();
        await page.evaluate(`$('#start').remove()`);
        await page.evaluate('controller.abort()');
        await page.evaluate('frames()');
        expect(await page.evaluate('document.activeElement === document.body')).toBe(true);
    });

    test('lands a focus request asked in the task a toast with focus in it is taken down', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await shownFrom(page, '#start');
        await page.evaluate(`(() => {
            controller.abort();
            kit.moveFocus('target');
        })()`);
        await page.evaluate('frames()');
        await expect(page.locator('#target')).toBeFocused();
    });

    test('lands a later focus request where an earlier one asks for where a toast taken down hands focus back', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await shownFrom(page, '#start');
        await page.evaluate(`(() => {
            kit.moveFocus('start');
            kit.moveFocus('target');
            controller.abort();
        })()`);
        await page.evaluate('frames()');
        await expect(page.locator('#target')).toBeFocused();
    });
});

test.describe('the form', () => {
    /** What the form shows of the kit: its noValidate, its marks and the errors drawn in it. */
    const formState = (page: Page) =>
        page.locator('#join').evaluate((form) => ({
            noValidate: (form as HTMLFormElement).noValidate,
            marked: form.querySelectorAll('[aria-invalid]').length,
            errors: form.querySelectorAll('.dk-field-error').length,
        }));

    /** The form, its fields and the document, where the form's check puts its listeners. */
    const FORM = `[document, ...document.querySelectorAll('#join, #join *')]`;

    test('takes its check down when its signal aborts, with a refusal and a reset still due', async ({
        page,
    }) => {
        await opened(page);
        const markup = await formState(page);
        // A submit the kit refuses waits a frame to move focus and say so, and a reset waits a
        // task to take the errors away and say the form is cleared, and the abort comes before
        // either. The line is the page's, so only the form's own teardown keeps them unsaid.
        await page.evaluate(`(() => {
            window.controller = new AbortController();
            kit.attachStatus(line);
            window.refuse = kit.attachForm($('#join'), withSignal(controller.signal, { status: line }));
            $('#join').requestSubmit();
            $('#join').reset();
        })()`);
        expect((await formState(page)).errors).toBeGreaterThan(0);
        await page.evaluate('controller.abort()');
        expect(await formState(page)).toEqual(markup);
        // A refusal asked for after the teardown does nothing, and nothing is said, not even that
        // the form is cleared.
        await page.evaluate('window.refuse()');
        await page.clock.runFor(3000);
        expect(await heard(page)).toEqual([]);
        await expect(page.getByLabel('Name')).not.toBeFocused();
    });

    test('draws nothing through what a form or a part given a signal already aborted returns', async ({
        page,
    }) => {
        await opened(page);
        const markup = await formState(page);
        await page.evaluate(`(() => {
            const aborted = AbortSignal.abort();
            kit.attachForm($('#join'), { status: line, signal: aborted })();
            kit.attachForm($('#part'), { status: line, signal: aborted })();
            $('#join').requestSubmit();
        })()`);
        await page.clock.runFor(1000);
        expect(await formState(page)).toEqual(markup);
        expect(await heard(page)).toEqual([]);
        // Nothing was kept, so attaching without a signal attaches the form afresh.
        await page.evaluate(`kit.attachForm($('#join'), { status: line })`);
        await page.getByRole('button', { name: 'Join' }).click();
        await page.clock.runFor(100);
        await expect(page.getByLabel('Name')).toBeFocused();
        await expect(page.locator('#name-error')).toHaveText('Error: Enter a value.');
    });

    test('keeps checking the form until the last attach in it is taken down', async ({ page }) => {
        await opened(page);
        const listeners = await count(page, FORM);
        const markup = await formState(page);
        await page.evaluate(`(() => {
            window.whole = new AbortController();
            window.part = new AbortController();
            kit.attachForm($('#part'), withSignal(part.signal, { status: line }));
            kit.attachForm($('#join'), withSignal(whole.signal, { status: line }));
            whole.abort();
        })()`);
        // The part's attach checks the form once the form's own is taken down.
        await page.getByRole('button', { name: 'Join' }).click();
        await page.clock.runFor(100);
        await expect(page.getByLabel('Name')).toBeFocused();
        await expect(page.locator('#name-error')).toHaveText('Error: Enter a value.');
        await page.evaluate('part.abort()');
        expect(await count(page, FORM)).toBe(listeners);
        expect(await formState(page)).toEqual(markup);
    });

    test("clears the errors a part's attach drew once the form's own attach checks it", async ({
        page,
    }) => {
        // The still clock holds the second refusal's frame until after the reset, as a busy page
        // can, so a refusal still due at the reset is seen to be called off.
        await opened(page);
        await page.evaluate(`kit.attachForm($('#part'), { status: line })`);
        await page.getByRole('button', { name: 'Join' }).click();
        await page.clock.runFor(500);
        await expect(page.locator('#name-error')).toHaveText('Error: Enter a value.');
        // The form's own attach checks it from now on, and a submit draws each error once.
        await page.evaluate(`kit.attachForm($('#join'), { status: line })`);
        await page.getByRole('button', { name: 'Join' }).click();
        await expect(page.locator('#join .dk-field-error')).toHaveCount(2);
        // A reset takes away every error, the part's among them, calls off the refusal still due
        // and says the form is cleared.
        await page.evaluate(`$('#join').reset()`);
        await page.clock.runFor(3000);
        await expect(page.locator('#join .dk-field-error')).toHaveCount(0);
        expect(await heard(page)).toEqual([
            'Name: Error: Enter a value. 2 fields need attention.',
            'Form cleared.',
        ]);
    });

    test('goes back to its defaults once the only holder that gave options lets go', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        // A page attaches the form with no options, and a hook joins with its own handler, then
        // goes.
        await page.evaluate(`(() => {
            window.dead = 0;
            kit.attachForm($('#join'));
            const hook = new AbortController();
            kit.attachForm($('#join'), withSignal(hook.signal, { invalid: () => (window.dead += 1) }));
            hook.abort();
        })()`);
        await page.evaluate('frames()');
        await page.getByRole('button', { name: 'Join' }).click();
        await expect(page.locator('#name')).toHaveAttribute('aria-invalid', 'true');
        expect(await page.evaluate('window.dead')).toBe(0);
    });
});

test.describe('a panel', () => {
    /** The panels' buttons and the document, where every panel's listeners sit. */
    const PANELS = `[document, ...document.querySelectorAll('button[aria-controls]')]`;

    test('opens nothing and marks nothing given a signal already aborted, and attaches afresh after', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            const control = panel('#tips-button', AbortSignal.abort());
            control.set(true);
            control.detach();
        })()`);
        await expect(page.locator('#round-tips')).toBeHidden();
        await expect(page.locator('#tips-button')).not.toHaveAttribute('tabindex');
        await page.evaluate(`panel('#tips-button')`);
        await page.locator('#tips-button').click();
        await expect(page.locator('#round-tips')).toBeVisible();
    });

    test('opens and closes through set in the task its signal aborts', async ({ page }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            const controller = new AbortController();
            const tips = panel('#tips-button', controller.signal);
            tips.set(true);
            controller.abort();
            tips.set(false);
        })()`);
        await expect(page.locator('#round-tips')).toBeHidden();
        await expect(page.locator('#tips-button')).toHaveAttribute('aria-expanded', 'false');
    });

    test("lets its button go when its signal aborts, and the document's listeners with the last", async ({
        page,
    }) => {
        await opened(page, { clock: false });
        const listeners = await count(page, PANELS);
        await page.evaluate(`(() => {
            window.controller = new AbortController();
            window.tips = panel('#tips-button', controller.signal);
            panel('#rules-button', controller.signal);
        })()`);
        expect(await count(page, PANELS)).toBeGreaterThan(listeners);
        await page.locator('#tips-button').click();
        await expect(page.locator('#round-tips')).toBeVisible();
        await page.evaluate('controller.abort()');
        expect(await count(page, PANELS)).toBe(listeners);
        // Called once the takedown has landed, a microtask after the abort, as record 23 has it.
        await page.evaluate('tips.set(false)');
        // What the attach returned does nothing after the teardown, and a press is the page's.
        await expect(page.locator('#round-tips')).toBeVisible();
        await page.locator('#rules-button').click();
        await expect(page.locator('#rules')).toBeHidden();
    });

    for (const way of ['Escape', 'its Close'] as const) {
        test(`closes by ${way} once the button that opened it is let go, focus going to the next`, async ({
            page,
        }) => {
            await opened(page, { clock: false });
            await page.evaluate(`(() => {
                window.controller = new AbortController();
                panel('#tips-button', controller.signal);
                panel('#tips-again');
            })()`);
            await page.locator('#tips-button').click();
            await expect(page.locator('#round-tips')).toBeVisible();
            await page.evaluate('controller.abort()');
            // The button let go says it opens nothing, since it no longer follows the panel.
            await expect(page.locator('#tips-button')).toHaveAttribute('aria-expanded', 'false');
            await page.locator('#round-tips h2').click();
            if (way === 'Escape') await page.keyboard.press('Escape');
            else await page.getByRole('button', { name: 'Close round tips' }).click();
            await expect(page.locator('#round-tips')).toBeHidden();
            await expect(page.locator('#tips-again')).toHaveAttribute('aria-expanded', 'false');
            await expect(page.locator('#tips-again')).toBeFocused();
        });
    }

    test('closes by Escape when its button is drawn again while it is open', async ({ page }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            window.first = panel('#tips-button');
            panel('#rules-button');
        })()`);
        await page.locator('#tips-button').click();
        await page.evaluate(`(() => {
            first.detach();
            const old = $('#tips-button');
            old.replaceWith(old.cloneNode(true));
            panel('#tips-button');
        })()`);
        await expect(page.locator('#tips-button')).toHaveAttribute('aria-expanded', 'true');
        await page.locator('#round-tips h2').click();
        await page.keyboard.press('Escape');
        await expect(page.locator('#round-tips')).toBeHidden();
        await expect(page.locator('#tips-button')).toBeFocused();
    });

    test('keeps its panel open and closes it by Escape when its one button is drawn again', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await page.evaluate(`window.first = panel('#tips-button')`);
        await page.locator('#tips-button').click();
        // The old button's teardown takes the panels' listeners off with it, as the last let go,
        // and the one drawn in its place says it starts closed, as a remount in React draws it.
        await page.evaluate(`(() => {
            first.detach();
            const old = $('#tips-button');
            const drawn = old.cloneNode(true);
            drawn.setAttribute('aria-expanded', 'false');
            old.replaceWith(drawn);
            panel('#tips-button');
        })()`);
        await expect(page.locator('#round-tips')).toBeVisible();
        await expect(page.locator('#tips-button')).toHaveAttribute('aria-expanded', 'true');
        await page.locator('#round-tips h2').click();
        await page.keyboard.press('Escape');
        await expect(page.locator('#round-tips')).toBeHidden();
        await expect(page.locator('#tips-button')).toBeFocused();
    });

    test('hands its panel to an attached button in a shadow root', async ({ page }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            const host = document.createElement('div');
            $('#rules').before(host);
            host.attachShadow({ mode: 'open' }).innerHTML =
                '<button type="button" aria-expanded="false" aria-controls="round-tips">Shadow tips</button>';
            window.controller = new AbortController();
            panel('#tips-button', controller.signal);
            kit.attachPanel(host.shadowRoot.querySelector('button'));
        })()`);
        await page.locator('#tips-button').click();
        await page.evaluate('controller.abort()');
        await page.locator('#round-tips h2').click();
        await page.keyboard.press('Escape');
        await expect(page.locator('#round-tips')).toBeHidden();
        await expect(page.getByRole('button', { name: 'Shadow tips' })).toBeFocused();
    });

    test('closes by neither once no attached button names it', async ({ page }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            window.controller = new AbortController();
            panel('#tips-button', controller.signal);
            panel('#rules-button');
        })()`);
        await page.locator('#tips-button').click();
        await page.evaluate('controller.abort()');
        await page.locator('#round-tips h2').click();
        await page.keyboard.press('Escape');
        await expect(page.locator('#round-tips')).toBeVisible();
        await page.getByRole('button', { name: 'Close round tips' }).click();
        await expect(page.locator('#round-tips')).toBeVisible();
    });

    test('leaves focus on the page where a visitor moved it, as the page closes a panel it attached in a frame', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await page.evaluate(DRAW_FRAME);
        await page.evaluate(`window.framedTips = kit.attachPanel(frameTips)`);
        const inFrame = page.frameLocator('iframe');
        await inFrame.locator('#tips-button').click();
        await inFrame.locator('#deal').focus();
        // The page has no panel of its own attached, so the visitor's last place stays in the frame.
        await page.locator('#start').focus();
        await page.evaluate('framedTips.set(false)');
        await expect(inFrame.locator('#round-tips')).toBeHidden();
        await expect(page.locator('#start')).toBeFocused();
    });

    test("takes a panel the page attached in a frame down, the panels' listeners off the frame's document", async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await page.evaluate(DRAW_FRAME);
        const onFrame = () =>
            page.evaluate<number>('frame.contentWindow.leaks.on([frame.contentDocument])');
        const before = await onFrame();
        const onPage = await count(page, PANELS);
        await page.evaluate(`(() => {
            window.framed = new AbortController();
            kit.attachPanel(frameTips, { signal: framed.signal });
        })()`);
        // The panels' listeners sit on the frame's document, and none on the page's.
        expect(await onFrame()).toBeGreaterThan(before);
        expect(await count(page, PANELS)).toBe(onPage);
        const inFrame = page.frameLocator('iframe');
        await inFrame.locator('#tips-button').click();
        await expect(inFrame.locator('#round-tips')).toBeVisible();
        await page.evaluate('framed.abort()');
        await expect(inFrame.locator('#tips-button')).toHaveAttribute('aria-expanded', 'false');
        await expect.poll(onFrame).toBe(before);
    });
});

test.describe('the stepper', () => {
    test('says nothing of an error taken down before it is heard', async ({ page }) => {
        await opened(page);
        await page.evaluate(`(() => {
            const controller = new AbortController();
            kit.attachStepper($('.dk-stepper'), withSignal(controller.signal, { say: kit.attachStatus(line) }));
            const input = $('.dk-stepper-value');
            input.value = '99';
            input.dispatchEvent(new Event('change', { bubbles: true }));
            controller.abort();
        })()`);
        // Past the moment the status line says a message.
        await page.clock.runFor(1000);
        expect(await heard(page)).toEqual([]);
    });

    test('says an error out of range while it stays attached', async ({ page }) => {
        await opened(page);
        await page.evaluate(`(() => {
            kit.attachStepper($('.dk-stepper'), {
                signal: new AbortController().signal,
                say: kit.attachStatus(line),
            });
            const input = $('.dk-stepper-value');
            input.value = '99';
            input.dispatchEvent(new Event('change', { bubbles: true }));
        })()`);
        await page.clock.runFor(1000);
        expect(await heard(page)).toHaveLength(1);
    });

    test('goes back to its own line once the only holder that gave options lets go', async ({
        page,
    }) => {
        await opened(page);
        await page.evaluate(`(() => {
            window.dead = 0;
            kit.attachStepper($('.dk-stepper'));
            const hook = new AbortController();
            kit.attachStepper($('.dk-stepper'), withSignal(hook.signal, { say: () => (window.dead += 1) }));
            hook.abort();
        })()`);
        await page.locator('.dk-stepper-up').click();
        // Past the moment the stepper says a press.
        await page.clock.runFor(300);
        expect(await page.evaluate('window.dead')).toBe(0);
    });
});

test.describe("a table's frame", () => {
    test('still refuses a table with no frame when given a signal already aborted', async ({
        page,
    }) => {
        await opened(page);
        const thrown = await page.evaluate(`(() => {
            try {
                kit.attachTable($('#start'), { signal: AbortSignal.abort() });
                return null;
            } catch (error) {
                return error.message;
            }
        })()`);
        expect(thrown).toBe('a table needs its frame');
    });
});

test.describe('a group the arrow keys move through', () => {
    test('gives the group its own role back, and the arrow keys stop moving, once taken down', async ({
        page,
    }) => {
        await opened(page);
        const grid = page.locator('.dk-button-grid').first();
        // The table marks the group attached by the tabindex its cells take, so the markup gives
        // them none.
        await expect(grid.locator('[tabindex]')).toHaveCount(0);
        const ownRole = await grid.getAttribute('role');
        await page.evaluate(`(() => {
            window.controller = new AbortController();
            kit.attachRoving($('.dk-button-grid'), withSignal(controller.signal));
        })()`);
        await expect(grid).toHaveAttribute('role', 'toolbar');
        await page.evaluate('controller.abort()');
        await expect(grid).toHaveAttribute('role', ownRole ?? '');
        const cell = grid.locator('button').first();
        await cell.focus();
        await page.keyboard.press('ArrowRight');
        await expect(cell).toBeFocused();
    });
});

test.describe('a busy button', () => {
    /** Counts each change to the button's busy mark from here on. */
    const watchMarks = (page: Page) =>
        page.evaluate(`(() => {
            window.marks = 0;
            new MutationObserver((records) => {
                marks += records.length;
            }).observe($('#busy'), { attributeFilter: ['aria-disabled'] });
        })()`);

    test('marks nothing busy given a signal already aborted', async ({ page }) => {
        await opened(page);
        await page.evaluate(`(() => {
            kit.attachBusy($('#busy'), { status: line, signal: AbortSignal.abort() });
            $('#busy').setAttribute('data-busy', '');
        })()`);
        await page.clock.runFor(5000);
        await expect(page.locator('#busy')).not.toHaveAttribute('aria-disabled');
        expect(await heard(page)).toEqual([]);
    });

    test('takes its busy mark off as it is taken down, and says nothing of the wait', async ({
        page,
    }) => {
        await opened(page);
        await page.evaluate(`(() => {
            window.controller = new AbortController();
            kit.attachStatus(line);
            kit.attachBusy($('#busy'), withSignal(controller.signal, { status: line }));
            $('#busy').setAttribute('data-busy', 'Saving the rule.');
        })()`);
        await expect(page.locator('#busy')).toHaveAttribute('aria-disabled', 'true');
        await page.evaluate('controller.abort()');
        await expect(page.locator('#busy')).not.toHaveAttribute('aria-disabled');
        await page.clock.runFor(5000);
        expect(await heard(page)).toEqual([]);
    });

    test('takes its mark off and puts it back where it is attached a microtask after the abort', async ({
        page,
    }) => {
        await opened(page);
        await page.evaluate(`(() => {
            window.first = new AbortController();
            kit.attachBusy($('#busy'), withSignal(first.signal, { status: line }));
            $('#busy').setAttribute('data-busy', '');
        })()`);
        await expect(page.locator('#busy')).toHaveAttribute('aria-disabled', 'true');
        await watchMarks(page);
        await page.evaluate(`(async () => {
            first.abort();
            await Promise.resolve();
            kit.attachBusy($('#busy'), withSignal(new AbortController().signal, { status: line }));
        })()`);
        expect(await page.evaluate('marks')).toBe(2);
        await expect(page.locator('#busy')).toHaveAttribute('aria-disabled', 'true');
    });

    test('keeps its wait for an attach without a signal in the task its holder let go', async ({
        page,
    }) => {
        await opened(page);
        await page.evaluate(`(() => {
            window.first = new AbortController();
            kit.attachBusy($('#busy'), withSignal(first.signal, { status: line }));
            $('#busy').setAttribute('data-busy', 'Saving the rule.');
        })()`);
        await expect(page.locator('#busy')).toHaveAttribute('aria-disabled', 'true');
        await watchMarks(page);
        await page.evaluate(`(() => {
            first.abort();
            kit.attachBusy($('#busy'), { status: line });
        })()`);
        await page.clock.runFor(5000);
        expect(await page.evaluate('marks')).toBe(0);
        await expect(page.locator('#busy')).toHaveAttribute('aria-disabled', 'true');
        expect(await heard(page)).toEqual(['Saving the rule.']);
    });
});

test.describe('progress', () => {
    /** What the bar says of a step, its words those the markup drew. */
    const STEP = 'Importing products, 12 of 40.';

    /*
     * A step from 12 of 40 to 25 crossed, with the bar speaking on the page's line, attached
     * without the bar's signal, so only the bar's own teardown takes back the step it put there.
     * The bar's observer hears the step in a microtask, so the step is on the line before the
     * abort, where `abort` is set.
     */
    const stepped = (abort: boolean) => `(async () => {
        const controller = new AbortController();
        kit.attachStatus(line);
        kit.attachProgress($('#import'), withSignal(controller.signal, { status: line }));
        $('#import').value = 25;
        await null;
        ${abort ? 'controller.abort();' : ''}
    })()`;

    test('says nothing of a step taken down before it is heard', async ({ page }) => {
        await opened(page);
        await page.evaluate(stepped(true));
        await page.clock.runFor(1000);
        expect(await heard(page)).toEqual([]);
    });

    test('says a step crossed while it stays attached', async ({ page }) => {
        await opened(page);
        await page.evaluate(stepped(false));
        await page.clock.runFor(1000);
        expect(await heard(page)).toEqual([STEP]);
    });

    test('drops a step waiting behind firm words once the bar is taken down', async ({ page }) => {
        await opened(page);
        await page.evaluate(`(() => {
            window.controller = new AbortController();
            kit.attachProgress($('#import'), withSignal(controller.signal, { status: line }));
            kit.attachStatus(line)('Saved.');
        })()`);
        await page.clock.runFor(200);
        await page.evaluate(`(async () => {
            $('#import').value = 25;
            await null;
            controller.abort();
        })()`);
        await page.clock.runFor(5000);
        expect(await heard(page)).toEqual(['Saved.']);
    });

    test('counts its steps again only where a join gives another count', async ({ page }) => {
        await opened(page);
        await page.evaluate(`(() => {
            window.controller = new AbortController();
            kit.attachProgress($('#import'), withSignal(controller.signal, { status: line }));
        })()`);
        // A step crossed, and the bar joined in the same task with the same count written out, as
        // a hook's ref made afresh gives it, before the bar's observer hears the step.
        await page.evaluate(`(() => {
            $('#import').value = 25;
            kit.attachProgress($('#import'), withSignal(controller.signal, { status: line, steps: 4 }));
        })()`);
        await page.clock.runFor(1000);
        expect(await heard(page)).toHaveLength(1);
    });
});

test.describe('the dialog', () => {
    /**
     * Holds the close event the browser sends as the dialog next closes and sends it again once a
     * request's frame has passed, as WebKit and Firefox may send it, and marks it once the dialog
     * has heard it, by `heardClose`, so a test waits for the kit's handback before it looks at
     * focus.
     */
    const LATE_CLOSE = `(() => {
        const dialog = $('#end-game');
        window.heardClose = false;
        addEventListener(
            'close',
            (event) => {
                event.stopImmediatePropagation();
                frames().then(() => {
                    dialog.dispatchEvent(new Event('close'));
                    window.heardClose = true;
                });
            },
            { capture: true, once: true }
        );
    })()`;

    /** Opens the dialog from its opener with focus on `from`, and waits for it to be open. */
    const openWithFocusOn = async (page: Page, from = '#finish') => {
        await page.evaluate(`(() => {
            window.controller = new AbortController();
            $('${from}').focus();
            kit.attachDialog($('#end-game'), withSignal(controller.signal))($('#finish'));
        })()`);
        await expect(page.locator('#end-game')).toHaveAttribute('open');
    };

    test('takes a dialog the page attached in a frame down, its listeners off and focus back on what opened it in the frame', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await page.evaluate(DRAW_FRAME);
        const onDialog = () => page.evaluate<number>('frame.contentWindow.leaks.on([frameDialog])');
        const before = await onDialog();
        const inFrame = page.frameLocator('iframe');
        const inner = inFrame.locator('#inner');
        // Opened by the page's script with nothing in the frame focused, naming its opener.
        await page.evaluate(`(() => {
            window.framed = new AbortController();
            const open = kit.attachDialog(frameDialog, { signal: framed.signal });
            open(frame.contentDocument.querySelector('#inner'));
        })()`);
        await expect(inFrame.locator('#end-game')).toHaveAttribute('open');
        expect(await onDialog()).toBeGreaterThan(before);
        await page.evaluate('framed.abort()');
        await expect(inFrame.locator('#end-game')).not.toHaveAttribute('open');
        await expect(page.locator('iframe')).toBeFocused();
        await expect(inner).toBeFocused();
        await expect.poll(onDialog).toBe(before);
    });

    test('leaves focus on the page where a visitor moved it, as a dialog the page attached in a frame is taken down', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await page.evaluate(DRAW_FRAME);
        const inFrame = page.frameLocator('iframe');
        await page.evaluate(`(() => {
            window.framed = new AbortController();
            const open = kit.attachDialog(frameDialog, { signal: framed.signal });
            open(frame.contentDocument.querySelector('#inner'));
        })()`);
        await expect(inFrame.locator('#end-game')).toHaveAttribute('open');
        // The frame's dialog makes only the frame inert, so the visitor reaches the page around it.
        await page.locator('#start').focus();
        await page.evaluate('framed.abort()');
        await expect(inFrame.locator('#end-game')).not.toHaveAttribute('open');
        await expect(page.locator('#start')).toBeFocused();
    });

    test('opens nothing and sets no closedby given a signal already aborted', async ({ page }) => {
        await opened(page, { clock: false });
        await page.evaluate(
            `kit.attachDialog($('#end-game'), { signal: AbortSignal.abort(), stay: true })($('#finish'))`
        );
        await expect(page.locator('#end-game')).not.toHaveAttribute('open');
        await expect(page.locator('#end-game')).not.toHaveAttribute('closedby');
    });

    test('takes no stay from a repeat attach given a signal already aborted', async ({ page }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            kit.attachDialog($('#end-game'));
            kit.attachDialog($('#end-game'), { signal: AbortSignal.abort(), stay: true });
        })()`);
        await expect(page.locator('#end-game')).not.toHaveAttribute('closedby');
    });

    test('closes as it is taken down, with focus back on its opener and its closedby gone', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            window.controller = new AbortController();
            kit.attachDialog($('#end-game'), withSignal(controller.signal, { stay: true }))($('#finish'));
        })()`);
        await expect(page.locator('#end-game')).toHaveAttribute('closedby', 'none');
        await expect(page.locator('#end-game')).toHaveAttribute('open');
        await page.evaluate('controller.abort()');
        await expect(page.locator('#end-game')).not.toHaveAttribute('open');
        await expect(page.locator('#end-game')).not.toHaveAttribute('closedby');
        await expect(page.locator('#finish')).toBeFocused();
    });

    test('closes where it is attached again a microtask after the abort', async ({ page }) => {
        await opened(page, { clock: false });
        const open = await page.evaluate(`(async () => {
            const first = new AbortController();
            kit.attachDialog($('#end-game'), withSignal(first.signal))($('#finish'));
            first.abort();
            await Promise.resolve();
            const open = $('#end-game').open;
            kit.attachDialog($('#end-game'), withSignal(new AbortController().signal));
            return open;
        })()`);
        expect(open).toBe(false);
    });

    test('stays open for an attach without a signal in the task its holder let go', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            const first = new AbortController();
            kit.attachDialog($('#end-game'), withSignal(first.signal))($('#finish'));
            first.abort();
            kit.attachDialog($('#end-game'));
        })()`);
        await page.evaluate('frames()');
        await expect(page.locator('#end-game')).toHaveAttribute('open');
    });

    test('hands focus back from a dialog closed and taken down in one task', async ({ page }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            const controller = new AbortController();
            kit.attachDialog($('#end-game'), withSignal(controller.signal, {
                returnTo: () => $('#start'),
            }))($('#finish'));
            $('#end-game').close();
            controller.abort();
        })()`);
        await page.evaluate('frames()');
        await expect(page.locator('#end-game')).not.toHaveAttribute('open');
        await expect(page.locator('#finish')).toBeFocused();
    });

    test('keeps a dialog open with its opener when it is aborted and attached again in one task', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            const controller = new AbortController();
            kit.attachDialog($('#end-game'), withSignal(controller.signal))($('#finish'));
            controller.abort();
            kit.attachDialog($('#end-game'), withSignal(new AbortController().signal));
        })()`);
        await page.evaluate('frames()');
        await expect(page.locator('#end-game')).toHaveAttribute('open');
        await page.evaluate(`$('#end-game').close()`);
        await expect(page.locator('#finish')).toBeFocused();
    });

    test('leaves a dialog attached again as the last is taken down open to its own closings', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        // The close the teardown makes arrives once the new attach listens, which would send focus
        // to its returnTo if it took that closing for its own. The new attach comes a microtask
        // after the abort, once the takedown has landed, since one in the same task would keep the
        // dialog.
        await page.evaluate(`(async () => {
            const controller = new AbortController();
            kit.attachDialog($('#end-game'), withSignal(controller.signal))($('#finish'));
            controller.abort();
            await Promise.resolve();
            window.show = kit.attachDialog($('#end-game'), { returnTo: () => $('#start') });
        })()`);
        await page.evaluate('frames()');
        await expect(page.locator('#finish')).toBeFocused();
        // The new attach still hands focus back for an opening of its own.
        await page.evaluate(`(() => {
            show($('#target'));
            $('#end-game').close();
        })()`);
        await expect(page.locator('#target')).toBeFocused();
    });

    test('leaves a closedby the dialog was not attached to stay with', async ({ page }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            const controller = new AbortController();
            kit.attachDialog($('#end-game'), withSignal(controller.signal));
            $('#end-game').setAttribute('closedby', 'closerequest');
            controller.abort();
        })()`);
        await expect(page.locator('#end-game')).toHaveAttribute('closedby', 'closerequest');
    });

    test("puts back the page's own closedby as a dialog attached to stay is taken down", async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            $('#end-game').setAttribute('closedby', 'closerequest');
            window.controller = new AbortController();
            kit.attachDialog($('#end-game'), withSignal(controller.signal, { stay: true }));
        })()`);
        await expect(page.locator('#end-game')).toHaveAttribute('closedby', 'none');
        await page.evaluate('controller.abort()');
        await expect(page.locator('#end-game')).toHaveAttribute('closedby', 'closerequest');
    });

    test("puts back the page's own closedby as a dialog attached without stay is taken down", async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            $('#end-game').setAttribute('closedby', 'any');
            window.controller = new AbortController();
            kit.attachDialog($('#end-game'), withSignal(controller.signal));
        })()`);
        await expect(page.locator('#end-game')).not.toHaveAttribute('closedby');
        await page.evaluate('controller.abort()');
        await expect(page.locator('#end-game')).toHaveAttribute('closedby', 'any');
    });

    test('keeps a closedby the page set while the dialog was attached without stay', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            $('#end-game').setAttribute('closedby', 'none');
            window.controller = new AbortController();
            kit.attachDialog($('#end-game'), withSignal(controller.signal));
            $('#end-game').setAttribute('closedby', 'any');
            controller.abort();
        })()`);
        await expect(page.locator('#end-game')).toHaveAttribute('closedby', 'any');
    });

    test('leaves the closedby of a dialog attached again from its own takedown to that attach', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        // Focus handed back to the opener as the first attach is taken down attaches the dialog
        // again, inside that takedown.
        await page.evaluate(`(() => {
            window.controller = new AbortController();
            window.second = new AbortController();
            $('#finish').addEventListener(
                'focusin',
                () => kit.attachDialog($('#end-game'), { signal: second.signal, stay: true }),
                { once: true }
            );
            kit.attachDialog($('#end-game'), withSignal(controller.signal, { stay: true }))(
                $('#finish')
            );
        })()`);
        await expect(page.locator('#end-game')).toHaveAttribute('open');
        await page.evaluate('controller.abort()');
        await expect(page.locator('#finish')).toBeFocused();
        await expect(page.locator('#end-game')).toHaveAttribute('closedby', 'none');
        await page.evaluate('second.abort()');
        await expect(page.locator('#end-game')).not.toHaveAttribute('closedby');
    });

    test('keeps a dialog staying where a later attach gives it only a signal', async ({ page }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            kit.attachDialog($('#end-game'), { signal: new AbortController().signal, stay: true });
            kit.attachDialog($('#end-game'), { signal: new AbortController().signal });
        })()`);
        await expect(page.locator('#end-game')).toHaveAttribute('closedby', 'none');
    });

    test("drops a dialog's stay once the only holder that gave it lets go, though the first attach gave a signal", async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            kit.attachDialog($('#end-game'), { signal: new AbortController().signal });
            window.stayer = new AbortController();
            kit.attachDialog($('#end-game'), { signal: stayer.signal, stay: true });
        })()`);
        await expect(page.locator('#end-game')).toHaveAttribute('closedby', 'none');
        await page.evaluate('stayer.abort()');
        await page.evaluate('frames()');
        await expect(page.locator('#end-game')).not.toHaveAttribute('closedby');
    });

    test('lands a focus request asked in the task a dialog with focus in it is taken down', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await openWithFocusOn(page);
        await page.evaluate(`(() => {
            controller.abort();
            kit.moveFocus('target');
        })()`);
        await page.evaluate('frames()');
        await expect(page.locator('#end-game')).not.toHaveAttribute('open');
        await expect(page.locator('#target')).toBeFocused();
    });

    test('lands a focus request asked from inside an open dialog before it is taken down', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await openWithFocusOn(page);
        // As a Save handler that asks for the next place, then closes the dialog and takes it
        // down. The browser hands focus to the opener as the dialog closes, before the takedown
        // lands.
        await page.evaluate(`(() => {
            kit.moveFocus('target');
            $('#end-game').close();
            controller.abort();
        })()`);
        await page.evaluate('frames()');
        await expect(page.locator('#end-game')).not.toHaveAttribute('open');
        await expect(page.locator('#target')).toBeFocused();
    });

    test('lands a focus request asked from inside an open dialog the page then closes', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await openWithFocusOn(page);
        // The browser hands the opener focus as the dialog closes, and the close event the kit
        // hands focus back from comes after the request's frame.
        await page.evaluate(LATE_CLOSE);
        await page.evaluate(`(() => {
            kit.moveFocus('target');
            $('#end-game').close();
        })()`);
        await page.waitForFunction('heardClose');
        await expect(page.locator('#end-game')).not.toHaveAttribute('open');
        await expect(page.locator('#target')).toBeFocused();
    });

    test('lands a focus request on what had focus as a dialog opened from another opener', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        // As Safari leaves a pressed button without focus, the opener is not what had focus.
        await openWithFocusOn(page, '#target');
        await page.evaluate(LATE_CLOSE);
        // The browser hands focus to the target as the dialog closes, the request lands there,
        // and the late close event leaves it rather than sending it to the opener.
        await page.evaluate(`(() => {
            kit.moveFocus('target');
            $('#end-game').close();
        })()`);
        await page.waitForFunction('heardClose');
        await expect(page.locator('#target')).toBeFocused();
    });

    test('hands focus to the opener from a dialog closed and taken down in one task, opened with focus elsewhere', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await openWithFocusOn(page, '#start');
        // As a plain close does, though the browser hands focus to what had it as the dialog
        // opened.
        await page.evaluate(`(() => {
            $('#end-game').close();
            controller.abort();
        })()`);
        await page.evaluate('frames()');
        await expect(page.locator('#finish')).toBeFocused();
    });

    test('lands a focus request asked as an answer in a dialog is pressed', async ({ page }) => {
        await opened(page, { clock: false });
        await page.evaluate(
            `$('#end-game [value="end"]').addEventListener('click', () => kit.moveFocus('target'))`
        );
        await openWithFocusOn(page);
        // The answer's form closes the dialog as the press lands, by the browser's own close.
        await page.locator('#end-game [value="end"]').click();
        await page.evaluate('frames()');
        await expect(page.locator('#end-game')).not.toHaveAttribute('open');
        await expect(page.locator('#target')).toBeFocused();
    });

    test('leaves focus the page sets in the task it closes a dialog a focus request was asked from', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await openWithFocusOn(page);
        // Marked once the dialog has heard its close event, after the kit's own listener.
        await page.evaluate(`(() => {
            window.heardClose = false;
            const dialog = $('#end-game');
            dialog.addEventListener('close', () => (window.heardClose = true), { once: true });
            kit.moveFocus('target');
            dialog.close();
            $('#start').focus();
        })()`);
        await page.waitForFunction('heardClose');
        await page.evaluate('frames()');
        await expect(page.locator('#start')).toBeFocused();
    });

    test('lands a focus request asked from inside an open dialog the page then takes away', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await openWithFocusOn(page);
        // As a view that asks for the next place and then draws the dialog away, which takes it
        // down.
        await page.evaluate(`(() => {
            window.gone = $('#end-game');
            kit.moveFocus('target');
            gone.remove();
            controller.abort();
        })()`);
        await page.evaluate('frames()');
        // The dialog is out of the page, so it is found by the reference kept to it.
        expect(await page.evaluate('gone.open')).toBe(false);
        await expect(page.locator('#target')).toBeFocused();
    });

    for (const late of [false, true]) {
        test(`lands a focus request asked from inside a dialog whose pressed control is taken away as it is pressed${late ? ', its close event coming late' : ''}`, async ({
            page,
        }) => {
            await opened(page, { clock: false });
            await openWithFocusOn(page);
            if (late) await page.evaluate(LATE_CLOSE);
            // As a Save that takes itself away as it is pressed, so focus falls to the body inside
            // the dialog before the request is asked and the dialog closes.
            await page.evaluate(`(() => {
                const save = $('#end-game [value="end"]');
                save.focus();
                save.remove();
                kit.moveFocus('target');
                $('#end-game').close();
            })()`);
            await page.evaluate('frames()');
            if (late) await page.waitForFunction('heardClose');
            await expect(page.locator('#target')).toBeFocused();
        });
    }

    test('leaves focus the page sets in the task a dialog taken from the page is taken down', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await openWithFocusOn(page);
        // As a view that draws new content in place of the dialog and focuses a control in it.
        await page.evaluate(`(() => {
            $('#end-game').remove();
            controller.abort();
            $('#target').focus();
        })()`);
        await page.evaluate('frames()');
        await expect(page.locator('#target')).toBeFocused();
    });
});

test.describe('a focus request', () => {
    test('moves nothing given a signal already aborted', async ({ page }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            $('#start').focus();
            kit.moveFocus('target', { signal: AbortSignal.abort() });
        })()`);
        await page.evaluate('frames()');
        await expect(page.locator('#start')).toBeFocused();
    });

    test('is called off by an abort, and lets go of the signal once it lands', async ({ page }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            $('#start').focus();
            const controller = new AbortController();
            kit.moveFocus('target', { signal: controller.signal });
            controller.abort();
        })()`);
        await page.evaluate('frames()');
        await expect(page.locator('#start')).toBeFocused();
        // A request left to land moves focus, and then holds nothing on a signal the page keeps.
        await page.evaluate(`(() => {
            window.kept = new AbortController();
            kit.moveFocus('target', { signal: kept.signal });
        })()`);
        await page.evaluate('frames()');
        await expect(page.locator('#target')).toBeFocused();
        expect(await count(page, '[kept.signal]')).toBe(0);
        await page.evaluate('kept.abort()');
        await expect(page.locator('#target')).toBeFocused();
    });
});

test.describe('a control whose markup has since lost a part', () => {
    test('is handed back as it is by a repeat attach, and refused once it is attached afresh', async ({
        page,
    }) => {
        await opened(page);
        const wrong = await page.evaluate(`(async () => {
            const wrong = [];
            const again = async (name, attach, lose, needs) => {
                const held = new AbortController();
                const first = attach(held.signal);
                lose();
                try {
                    if (attach(held.signal) !== first) wrong.push(name + ': a repeat attach gave another control');
                    if (attach() !== first) wrong.push(name + ': a repeat attach with no signal gave another control');
                    if (attach(AbortSignal.abort()) === first)
                        wrong.push(name + ': an aborted signal was given the control');
                } catch (error) {
                    wrong.push(name + ': a repeat attach threw, ' + error.message);
                }
                // Taken down, the control is gone, so the next attach is a first one and is told.
                held.abort();
                (typeof first === 'function' ? first : first.detach)();
                await Promise.resolve();
                for (const signal of [undefined, AbortSignal.abort()]) {
                    try {
                        attach(signal);
                        wrong.push(name + ': a first attach missing a part did not throw');
                    } catch (error) {
                        if (error.message !== needs) wrong.push(name + ': threw ' + error.message);
                    }
                }
            };
            await again(
                'the stepper',
                (signal) => kit.attachStepper($('.dk-stepper'), withSignal(signal)),
                () => $('.dk-stepper-up').remove(),
                'a stepper needs its two buttons, or a read-only value'
            );
            await again(
                'a panel',
                (signal) => panel('#tips-button', signal),
                () => $('#tips-button').removeAttribute('aria-controls'),
                "a panel's button needs aria-controls"
            );
            return wrong;
        })()`);
        expect(wrong).toEqual([]);
    });

    test('hands back a toast that has lost a part, and refuses it once it is attached afresh', async ({
        page,
    }) => {
        await opened(page);
        const wrong = await page.evaluate(`(async () => {
            const wrong = [];
            const toast = $('.dk-toast');
            const held = new AbortController();
            const show = kit.attachToast(toast, { signal: held.signal });
            $('.dk-toast-action').remove();
            try {
                if (kit.attachToast(toast, { signal: held.signal }) !== show) wrong.push('a repeat attach gave another control');
                if (kit.attachToast(toast, { signal: AbortSignal.abort() }) === show)
                    wrong.push('an aborted signal was given the control');
            } catch (error) {
                wrong.push('a repeat attach threw, ' + error.message);
            }
            // Only its signal takes a toast down, a microtask after it aborts.
            held.abort();
            await Promise.resolve();
            for (const signal of [undefined, AbortSignal.abort()]) {
                try {
                    kit.attachToast(toast, withSignal(signal));
                    wrong.push('a first attach missing a part did not throw');
                } catch (error) {
                    if (error.message !== 'a toast needs its action') wrong.push('threw ' + error.message);
                }
            }
            return wrong;
        })()`);
        expect(wrong).toEqual([]);
    });
});

test.describe('a view asking for focus as it arrives', () => {
    test('moves nothing given a signal already aborted, and leaves the press for another view', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            $('#start').focus();
            $('#start').click();
            kit.focusOnArrival('target', { signal: AbortSignal.abort() });
        })()`);
        await page.evaluate('frames()');
        await expect(page.locator('#start')).toBeFocused();
        // The press is not spent, so a view that asks for it after takes focus.
        await page.evaluate(`kit.focusOnArrival('target')`);
        await page.evaluate('frames()');
        await expect(page.locator('#target')).toBeFocused();
    });

    test('is called off by an abort, and lets go of the signal once it lands', async ({ page }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            $('#start').focus();
            $('#start').click();
            const controller = new AbortController();
            kit.focusOnArrival('target', { signal: controller.signal });
            controller.abort();
        })()`);
        await page.evaluate('frames()');
        await expect(page.locator('#start')).toBeFocused();
        // The press is handed back, so a view left to land takes focus for it, and then holds
        // nothing on a signal the page keeps.
        await page.evaluate(`(() => {
            window.kept = new AbortController();
            kit.focusOnArrival('target', { signal: kept.signal });
        })()`);
        await page.evaluate('frames()');
        await expect(page.locator('#target')).toBeFocused();
        expect(await count(page, '[kept.signal]')).toBe(0);
        await page.evaluate('kept.abort()');
        await expect(page.locator('#target')).toBeFocused();
    });

    test('lands the views left when one of several asking for the same press is aborted', async ({
        page,
    }) => {
        await opened(page, { clock: false });
        await page.evaluate(`(() => {
            $('#start').focus();
            $('#start').click();
            const controller = new AbortController();
            window.kept = new AbortController();
            // The view first in the page would take focus, and its abort leaves it to the other.
            kit.focusOnArrival('start', { signal: controller.signal, from: $('#start') });
            kit.focusOnArrival('target', { signal: kept.signal });
            controller.abort();
        })()`);
        await page.evaluate('frames()');
        await expect(page.locator('#target')).toBeFocused();
        expect(await count(page, '[kept.signal]')).toBe(0);
    });
});
