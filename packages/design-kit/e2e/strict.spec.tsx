import { expect, type Page, test } from '@playwright/test';

import { bundle } from './bundle.js';
import { listenersOn, openCounted } from './leaks.js';
import { frames, servePage, stillClock } from './page.js';
import { type Strict } from './strict-page.js';

/*
 * The hooks under React's `StrictMode`, in its development build, which attaches each ref, runs its
 * cleanup and attaches it again as the page first draws, as record 20 asks: words a part says in
 * its first effect kept on the provider's line, its function speaking after that run and a new
 * provider's after it is drawn afresh while the old one stays silent, one arrow key moving one
 * cell, a busy notice, the end of a progress and a refusal each said once, a row removed asking for
 * focus on the next and finding it there, each piece taken down as it leaves, saying nothing late,
 * a ref called with null taking each piece down, a form given back, its check and listeners gone,
 * as the ref moves on, a part's two requests as it first draws leaving only the second to take
 * focus, a refusal still waiting as its form leaves saying nothing and moving nothing, a refusal
 * asked as its form first draws landing, with one ref on two forms or two rows of cells, the one
 * left still refusing or taking new options whichever is taken away, a failed submit refused
 * through the form submitted, a form behind a ref made afresh on every render keeping its refusal,
 * a form, a row of cells and a busy button mid-wait behind arrows that return the hook's cleanup
 * keeping their errors, their observer and their wait as the page draws again, a busy wait and a
 * row of cells kept where another hook joins them through a merged ref, a form and a row of cells
 * kept as each moves to another hook's ref and taking that hook's options, and either of two hooks
 * on one form dropped leaving the other's check and refusal.
 */

let app = '';
test.beforeAll(async () => {
    test.setTimeout(120_000);
    app = await bundle('strict-page.tsx', { development: true });
});

const open = async (page: Page, wait = '200ms') => {
    await servePage(page, {
        title: 'Lists',
        body: '<div id="root"></div>',
        script: app,
        css: `:root { --dk-wait: ${wait}; }`,
    });
    await expect(page.locator('#row')).toBeVisible();
};

/**
 * The page on a clock that stands still, stepped past the frame the requests made as it first draws
 * land in, so a later step brings only what the test set going.
 */
const openStill = async (page: Page, wait?: string) => {
    await stillClock(page.clock);
    await open(page, wait);
    await page.clock.runFor(100);
};

const said = (page: Page) => page.evaluate(() => (window as unknown as Strict).said);
const line = (page: Page) => page.locator('main').locator('..').locator('p[role="status"]');

test("keeps words said in a part's first effect on the provider's line through the second run", async ({
    page,
}) => {
    await open(page);
    await expect(line(page)).toHaveText('Lists ready.');
});

test("speaks through the provider's function after the second run, and after the provider is drawn afresh", async ({
    page,
}) => {
    await openStill(page);
    await page.clock.runFor(100);
    await expect(line(page)).toHaveText('Lists ready.');
    await page.evaluate(() => {
        (window as unknown as Strict).speak?.('Saved.');
    });
    await page.clock.runFor(150);
    await expect(line(page)).toHaveText('Saved.');
    // The function the first provider handed out, kept past the provider drawn afresh.
    await page.evaluate(() => {
        const page = window as unknown as Strict & { old?: Strict['speak'] };
        page.old = page.speak;
        page.remount();
    });
    await expect
        .poll(() =>
            page.evaluate(() => {
                const page = window as unknown as Strict & { old?: Strict['speak'] };
                return page.speak !== page.old;
            })
        )
        .toBe(true);
    await page.clock.runFor(150);
    await expect(line(page)).toHaveText('Lists ready.');
    await page.evaluate(() => {
        (window as unknown as Strict & { old?: Strict['speak'] }).old?.('Said too late.');
    });
    // Past the moment the line puts words in, and short of the time they stay.
    await page.clock.runFor(300);
    await expect(line(page)).toHaveText('Lists ready.');
    await page.evaluate(() => {
        (window as unknown as Strict).speak?.('Saved again.');
    });
    await page.clock.runFor(150);
    await expect(line(page)).toHaveText('Saved again.');
});

test('moves one cell for one arrow key, with one stop in the row', async ({ page }) => {
    await open(page);
    await expect(page.locator('#row [tabindex="0"]')).toHaveCount(1);
    await page.locator('#cell-one').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#cell-two')).toBeFocused();
    expect(await page.evaluate(() => (window as unknown as Strict).moves)).toBe(1);
});

test('says a busy notice, the end of a progress and a refusal once each', async ({ page }) => {
    await openStill(page);
    await page.evaluate(() => {
        (window as unknown as Strict).busy(true);
    });
    // React draws the mark in a task of its own, and the wait starts from it.
    await expect(page.locator('#save')).toHaveAttribute('data-busy', 'Saving the list.');
    // Past the button's wait of 200ms.
    await page.clock.runFor(300);
    expect(await said(page)).toEqual(['Saving the list.']);
    await page.evaluate(() => {
        (window as unknown as Strict).busy(false);
        (window as unknown as Strict).move(40);
    });
    await expect.poll(() => said(page)).toContain('Imported 40 products.');
    await page.getByRole('button', { name: 'Make the list' }).click();
    // The refusal moves focus and speaks a frame later.
    await page.clock.runFor(100);
    await expect(page.locator('#name')).toBeFocused();
    // Long enough for a second attach's wait or timer to come due.
    await page.clock.runFor(500);
    expect(await said(page)).toEqual([
        'Saving the list.',
        'Imported 40 products.',
        'List name: Error: Enter a list name.',
    ]);
});

test('moves focus to the next row as one removes itself', async ({ page }) => {
    await open(page);
    await page.locator('#remove-Ann').click();
    await expect(page.locator('#remove-Ann')).toHaveCount(0);
    await expect(page.locator('#remove-Ben')).toBeFocused();
});

test('takes each piece down as it leaves, saying nothing late', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    // A wait long enough for the button to be drawn busy and taken away before its notice is due.
    await openStill(page, '1s');
    await page.evaluate(() => {
        (window as unknown as Strict).busy(true);
    });
    await expect(page.locator('#save')).toHaveAttribute('data-busy', 'Saving the list.');
    await page.evaluate(() => {
        (window as unknown as Strict).leave();
    });
    await expect(page.locator('#row')).toHaveCount(0);
    // Past the button's wait of a second.
    await page.clock.runFor(1500);
    expect(await said(page)).toEqual([]);
    // The provider's line stays, with the words said on it.
    await expect(line(page)).toHaveCount(1);
    expect(errors).toEqual([]);
});

test('takes each piece down for a ref called with null by a helper that drops the cleanup', async ({
    page,
}) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await openStill(page);
    await expect(page.locator('#cell-one')).toHaveAttribute('tabindex', '0');
    await page.evaluate(() => {
        (window as unknown as Strict).nullRefs();
    });
    // The row's stop is given back, and the busy button says nothing once its wait is past.
    await expect(page.locator('#row [tabindex]')).toHaveCount(0);
    await page.evaluate(() => {
        (window as unknown as Strict).busy(true);
    });
    await expect(page.locator('#save')).toHaveAttribute('data-busy', 'Saving the list.');
    // Past the button's wait of 200ms.
    await page.clock.runFor(500);
    expect(await said(page)).toEqual([]);
    expect(errors).toEqual([]);
});

test("gives a form back as the hook's ref moves to another", async ({ page }) => {
    await openCounted(page, {
        clock: false,
        ready: false,
        title: 'Lists',
        body: '<div id="root"></div>',
        script: app,
        css: ':root { --dk-wait: 200ms; }',
    });
    await expect(page.locator('#row')).toBeVisible();
    const state = (id: string) =>
        page.locator(id).evaluate((form) => ({
            noValidate: (form as HTMLFormElement).noValidate,
            marked: form.querySelectorAll('[aria-invalid]').length,
        }));
    // The listeners on a form and its fields, where the form's check puts them. React keeps one of
    // its own on each field, so the form not yet attached gives the count a form given back
    // returns to.
    const listeners = (id: string) =>
        listenersOn(page, `[...document.querySelectorAll('${id}, ${id} *')]`);
    expect(await state('#move-one')).toEqual({ noValidate: true, marked: 1 });
    expect(await state('#move-two')).toEqual({ noValidate: false, marked: 0 });
    const attached = await listeners('#move-one');
    const bare = await listeners('#move-two');
    expect(attached).toBeGreaterThan(bare);
    await page.evaluate(() => {
        (window as unknown as Strict).moveForm();
    });
    await expect.poll(() => state('#move-two')).toEqual({ noValidate: true, marked: 1 });
    expect(await state('#move-one')).toEqual({ noValidate: false, marked: 0 });
    expect(await listeners('#move-one')).toBe(bare);
    expect(await listeners('#move-two')).toBe(attached);
});

test('focuses only the second of two requests a part makes as it first draws', async ({ page }) => {
    await open(page);
    await expect(page.locator('#ask-b')).toBeFocused();
    await frames(page);
    await expect(page.locator('#ask-b')).toBeFocused();
    expect(await page.evaluate(() => (window as unknown as Strict).focusesOnA)).toBe(0);
});

test('says nothing and moves nothing for a refusal still waiting as its form leaves', async ({
    page,
}) => {
    await openStill(page);
    await page.locator('#cell-one').focus();
    await page.evaluate(() => {
        (window as unknown as Strict).refuseNow();
        (window as unknown as Strict).leave();
    });
    await expect(page.locator('#form')).toHaveCount(0);
    // Past the refusal's frame.
    await page.clock.runFor(300);
    expect(await said(page)).toEqual([]);
    expect(await page.evaluate(() => document.activeElement?.id ?? '')).toBe('');
});

for (const which of ['one', 'two'] as const) {
    const other = which === 'one' ? 'two' : 'one';
    test(`still refuses through the other form when form ${which} of two on a ref is taken away`, async ({
        page,
    }) => {
        await open(page);
        await page.evaluate((gone) => {
            (window as unknown as Strict).dropForm(gone);
        }, which);
        await expect(page.locator(`#pair-${which}`)).toHaveCount(0);
        await page.getByRole('button', { name: `Make list ${other}` }).click();
        await expect(page.locator(`#pair-${other}-name`)).toBeFocused();
        await expect.poll(() => said(page)).toContain(`List ${other}: Error: Enter a value.`);
    });

    test(`gives new options to the other row when row ${which} of two on a ref is taken away`, async ({
        page,
    }) => {
        await open(page);
        await page.evaluate((gone) => {
            (window as unknown as Strict).dropRow(gone);
        }, which);
        await expect(page.locator(`#rows-${which}`)).toHaveCount(0);
        await page.evaluate(() => {
            (window as unknown as Strict).turnRows();
        });
        // The new options come with React's draw, in a task of its own, so the key is pressed until
        // they have.
        await expect
            .poll(async () => {
                await page.locator(`#rows-${other}-a`).focus();
                await page.keyboard.press('ArrowDown');
                return page.evaluate(() => document.activeElement?.id);
            })
            .toBe(`rows-${other}-b`);
    });
}

test('refuses a failed submit through the form submitted, of two on one ref', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: 'Make list one' }).click();
    await expect(page.locator('#pair-one-name')).toBeFocused();
    await expect.poll(() => said(page)).toContain('List one: Error: Enter a value.');
    expect(await said(page)).not.toContain('List two: Error: Enter a value.');
});

test('keeps a form behind a ref made afresh on every render attached through a failed submit', async ({
    page,
}) => {
    await openStill(page);
    const churns = await page.evaluate(() => (window as unknown as Strict).churns);
    await page.getByRole('button', { name: 'Make the deck' }).click();
    // The refusal moves focus and speaks a frame later.
    await page.clock.runFor(100);
    await expect(page.locator('#churn-name')).toBeFocused();
    expect(await said(page)).toContain('Deck name: Error: Enter a value.');
    // The page drew again for its errors, and the form kept its check through it.
    expect(await page.evaluate(() => (window as unknown as Strict).churns)).toBeGreaterThan(churns);
    await expect(page.locator('#churn-name-error')).toHaveText('Error: Enter a value.');
    expect(
        await page.locator('#churn').evaluate((form) => (form as HTMLFormElement).noValidate)
    ).toBe(true);
    // Long enough for a second refusal's frame to come.
    await page.clock.runFor(300);
    expect((await said(page)).filter((words) => words.startsWith('Deck name'))).toHaveLength(1);
});

/**
 * Counts each time an element is observed for its size, as a group's attach does, and each time a
 * form's check sets or gives back its noValidate, by the element's id.
 */
const counting = (page: Page) =>
    page.addInitScript(() => {
        const counted = window as unknown as {
            observed: Record<string, number>;
            checks: Record<string, number>;
        };
        counted.observed = {};
        counted.checks = {};
        const Made = window.ResizeObserver;
        window.ResizeObserver = class extends Made {
            override observe(target: Element, options?: ResizeObserverOptions) {
                counted.observed[target.id] = (counted.observed[target.id] ?? 0) + 1;
                super.observe(target, options);
            }
        };
        const own = Object.getOwnPropertyDescriptor(HTMLFormElement.prototype, 'noValidate');
        Object.defineProperty(HTMLFormElement.prototype, 'noValidate', {
            ...own,
            set(this: HTMLFormElement, value: boolean) {
                counted.checks[this.id] = (counted.checks[this.id] ?? 0) + 1;
                own?.set?.call(this, value);
            },
        });
    });

/** What the counters have seen so far. */
const counts = (page: Page) =>
    page.evaluate(() => {
        const { observed, checks } = window as unknown as {
            observed: Record<string, number>;
            checks: Record<string, number>;
        };
        return { observed: { ...observed }, checks: { ...checks } };
    });

/** Counts each change to a button's busy mark from here on, which an attach made afresh makes. */
const watchMarks = (page: Page, id: string) =>
    page.evaluate((watched) => {
        const counted = window as unknown as { marks: number };
        counted.marks = 0;
        const button = document.getElementById(watched);
        if (button)
            new MutationObserver((records) => {
                counted.marks += records.length;
            }).observe(button, { attributeFilter: ['aria-disabled'] });
    }, id);

const marks = (page: Page) => page.evaluate(() => (window as unknown as { marks: number }).marks);

/** Presses the arrow key from a group's first cell, and finds focus on its second. */
const expectArrows = async (page: Page, group: string) => {
    await expect(page.locator(`#${group}-row [tabindex="0"]`)).toHaveCount(1);
    await page.locator(`#${group}-a`).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator(`#${group}-b`)).toBeFocused();
};

const noValidate = (page: Page, id: string) =>
    page.locator(id).evaluate((form) => (form as HTMLFormElement).noValidate);

test("keeps a form, a row and a busy wait behind arrows that return the hook's cleanup as the page draws again", async ({
    page,
}) => {
    await counting(page);
    await open(page, '1s');
    await page.getByRole('button', { name: 'Make the table' }).click();
    await expect(page.locator('#returned-name')).toBeFocused();
    await expect(page.locator('#returned-name')).toHaveAttribute('aria-invalid', 'true');
    // The clock stands still from here, so the busy wait is timed by hand and each frame is run.
    await stillClock(page.clock);
    await page.evaluate(() => {
        (window as unknown as Strict).busyAfresh(true);
    });
    await expect(page.locator('#returned-save')).toHaveAttribute('aria-disabled', 'true');
    await page.clock.runFor(100);
    const made = await counts(page);
    expect(made.observed['returned-row']).toBeGreaterThan(0);
    await watchMarks(page, 'returned-save');
    for (let draw = 0; draw < 3; draw += 1)
        await page.evaluate(() => {
            (window as unknown as Strict).redraw();
        });
    await expect(page.locator('#returned-row')).toHaveAttribute('data-drawn', '3');
    await page.clock.runFor(100);
    // The form keeps its errors and its check, set up once, and the row its one observer.
    await expect(page.locator('#returned-name-error')).toHaveText('Error: Enter a value.');
    await expect(page.locator('#returned-name')).toHaveAttribute('aria-invalid', 'true');
    expect(await noValidate(page, '#returned')).toBe(true);
    expect(await counts(page)).toEqual(made);
    await expectArrows(page, 'returned');
    // The busy wait kept its mark and says its words once as it outlasts --dk-wait.
    await page.clock.runFor(2000);
    expect(await said(page)).toContain('Saving the table.');
    expect(await marks(page)).toBe(0);
    await expect(page.locator('#returned-save')).toHaveAttribute('aria-disabled', 'true');
    const heard = await said(page);
    expect(heard.filter((words) => words === 'Saving the table.')).toHaveLength(1);
    expect(heard.filter((words) => words.startsWith('Table name'))).toHaveLength(1);
});

test('keeps a busy wait as another hook joins its button through a merged ref', async ({
    page,
}) => {
    await openStill(page, '1s');
    await page.evaluate(() => {
        (window as unknown as Strict).joinBusy(true);
    });
    await expect(page.locator('#joined')).toHaveAttribute('aria-disabled', 'true');
    await watchMarks(page, 'joined');
    await page.evaluate(() => {
        (window as unknown as Strict).join();
    });
    await page.clock.runFor(2000);
    expect(await said(page)).toContain('Saving the deck.');
    expect(await marks(page)).toBe(0);
    await expect(page.locator('#joined')).toHaveAttribute('aria-disabled', 'true');
    expect((await said(page)).filter((words) => words === 'Saving the deck.')).toHaveLength(1);
});

test('observes a row two hooks share through a merged ref once, as the page draws again', async ({
    page,
}) => {
    await counting(page);
    await open(page);
    await frames(page);
    const made = await counts(page);
    expect(made.observed['shared-row']).toBeGreaterThan(0);
    await page.evaluate(() => {
        (window as unknown as Strict).join();
    });
    await expect(page.locator('#shared-row')).toHaveAttribute('data-joined', 'true');
    await frames(page);
    expect((await counts(page)).observed['shared-row']).toBe(made.observed['shared-row']);
    await expectArrows(page, 'shared');
});

test("keeps a form and a row as each moves from one hook's ref to another's, under the new hook's options", async ({
    page,
}) => {
    await counting(page);
    await open(page);
    await page.getByRole('button', { name: 'Save the player' }).click();
    await expect(page.locator('#handed-name')).toHaveAttribute('aria-invalid', 'true');
    await expect.poll(() => said(page)).toContain('Adding: Player name: Error: Enter a value.');
    await frames(page);
    const made = await counts(page);
    await page.evaluate(() => {
        (window as unknown as Strict).handOff();
    });
    await expect(page.locator('#handed-row')).toHaveAttribute('data-editing', 'true');
    await frames(page);
    // The form keeps its errors and the check it set up once, and the row its observer.
    await expect(page.locator('#handed-name')).toHaveAttribute('aria-invalid', 'true');
    expect(await noValidate(page, '#handed')).toBe(true);
    expect(await counts(page)).toEqual(made);
    // A failed submit goes through the hook the form moved to, and an arrow key through the row's.
    await page.getByRole('button', { name: 'Save the player' }).click();
    await expect.poll(() => said(page)).toContain('Editing: Player name: Error: Enter a value.');
    expect(await page.evaluate(() => (window as unknown as Strict).invalids)).toEqual([
        'adding',
        'editing',
    ]);
    await expectArrows(page, 'handed');
    expect(await page.evaluate(() => (window as unknown as Strict).rovedBy)).toEqual(['editing']);
});

for (const dropped of ['newer', 'older'] as const) {
    const kept = dropped === 'newer' ? 'older' : 'newer';
    const Kept = kept === 'older' ? 'Older' : 'Newer';
    test(`keeps the check and refuses through the ${kept} of two hooks on one form as the ${dropped} is dropped`, async ({
        page,
    }) => {
        await counting(page);
        await open(page);
        // Both hooks hold the form, and it runs on the newer one's options.
        await page.getByRole('button', { name: 'Save the club' }).click();
        await expect(page.locator('#shared-name')).toHaveAttribute('aria-invalid', 'true');
        await expect.poll(() => said(page)).toContain('Newer: Club name: Error: Enter a value.');
        await frames(page);
        const made = await counts(page);
        await page.evaluate((which) => {
            (window as unknown as Strict).dropHook(which);
        }, dropped);
        await expect(page.locator('#shared')).toHaveAttribute('data-dropped', dropped);
        await frames(page);
        expect(await noValidate(page, '#shared')).toBe(true);
        expect(await counts(page)).toEqual(made);
        await page.getByRole('button', { name: 'Save the club' }).click();
        await expect.poll(() => said(page)).toContain(`${Kept}: Club name: Error: Enter a value.`);
        expect(await page.evaluate(() => (window as unknown as Strict).invalids)).toEqual([
            'newer',
            kept,
        ]);
    });
}

test('keeps refusing through a form whose old cleanup is called after a new attach of it', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        (window as unknown as Strict).staleCleanup();
    });
    await page.getByRole('button', { name: 'Make the list' }).click();
    await expect(page.locator('#name')).toBeFocused();
    await expect.poll(() => said(page)).toContain('List name: Error: Enter a list name.');
});

test('lands a refusal asked as its form first draws', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
        (window as unknown as Strict).showFirstRefusal();
    });
    await expect(page.locator('#first-refusal-name')).toBeFocused();
    await expect.poll(() => said(page)).toContain('Board name: Error: Enter a board name.');
});
