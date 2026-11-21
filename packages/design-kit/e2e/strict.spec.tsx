import { expect, type Page, test } from '@playwright/test';

import { bundle } from './bundle.js';
import { servePage } from './page.js';
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
 * through the form submitted, and a form behind a ref made afresh on every render keeping its
 * refusal.
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
    await open(page);
    await expect(line(page)).toHaveText('Lists ready.');
    await page.evaluate(() => {
        (window as unknown as Strict).speak?.('Saved.');
    });
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
    await expect(line(page)).toHaveText('Lists ready.');
    await page.evaluate(() => {
        (window as unknown as Strict & { old?: Strict['speak'] }).old?.('Said too late.');
    });
    await page.waitForTimeout(300);
    await expect(line(page)).toHaveText('Lists ready.');
    await page.evaluate(() => {
        (window as unknown as Strict).speak?.('Saved again.');
    });
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
    await open(page);
    await page.evaluate(() => {
        (window as unknown as Strict).busy(true);
    });
    await expect.poll(() => said(page)).toContain('Saving the list.');
    await page.evaluate(() => {
        (window as unknown as Strict).busy(false);
        (window as unknown as Strict).move(40);
    });
    await expect.poll(() => said(page)).toContain('Imported 40 products.');
    await page.getByRole('button', { name: 'Make the list' }).click();
    await expect(page.locator('#name')).toBeFocused();
    await expect.poll(() => said(page)).toContain('List name: Error: Enter a list name.');
    // Long enough for a second attach's wait or timer to come due.
    await page.waitForTimeout(500);
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
    await open(page, '1s');
    await page.evaluate(() => {
        (window as unknown as Strict).busy(true);
    });
    await expect(page.locator('#save')).toHaveAttribute('data-busy', 'Saving the list.');
    await page.evaluate(() => {
        (window as unknown as Strict).leave();
    });
    await expect(page.locator('#row')).toHaveCount(0);
    await page.waitForTimeout(1500);
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
    await open(page);
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
    await page.waitForTimeout(500);
    expect(await said(page)).toEqual([]);
    expect(errors).toEqual([]);
});

test("gives a form back as the hook's ref moves to another", async ({ page, browserName }) => {
    await open(page);
    const state = (id: string) =>
        page.locator(id).evaluate((form) => ({
            noValidate: (form as HTMLFormElement).noValidate,
            marked: form.querySelectorAll('[aria-invalid]').length,
        }));
    // The listeners on a form and its fields, where the form's check puts them, counted through
    // Chromium's own tools. React keeps one of its own on each field, so the form not yet attached
    // gives the count a form given back returns to.
    const listeners = async (id: string): Promise<number | null> => {
        if (browserName !== 'chromium') return null;
        const session = await page.context().newCDPSession(page);
        const targets = `[...document.querySelectorAll('${id}, ${id} *')]`;
        const found = Number(await page.evaluate(`${targets}.length`));
        let total = 0;
        for (let at = 0; at < found; at += 1) {
            const { result } = await session.send('Runtime.evaluate', {
                expression: `${targets}[${String(at)}]`,
            });
            const { listeners: on } = await session.send('DOMDebugger.getEventListeners', {
                objectId: result.objectId ?? '',
            });
            total += on.length;
        }
        return total;
    };
    expect(await state('#move-one')).toEqual({ noValidate: true, marked: 1 });
    expect(await state('#move-two')).toEqual({ noValidate: false, marked: 0 });
    const attached = await listeners('#move-one');
    const bare = await listeners('#move-two');
    if (attached !== null && bare !== null) expect(attached).toBeGreaterThan(bare);
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
    await page.waitForTimeout(100);
    await expect(page.locator('#ask-b')).toBeFocused();
    expect(await page.evaluate(() => (window as unknown as Strict).focusesOnA)).toBe(0);
});

test('says nothing and moves nothing for a refusal still waiting as its form leaves', async ({
    page,
}) => {
    await open(page);
    await page.locator('#cell-one').focus();
    await page.evaluate(() => {
        (window as unknown as Strict).refuseNow();
        (window as unknown as Strict).leave();
    });
    await expect(page.locator('#form')).toHaveCount(0);
    await page.waitForTimeout(300);
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
    await open(page);
    const churns = await page.evaluate(() => (window as unknown as Strict).churns);
    await page.getByRole('button', { name: 'Make the deck' }).click();
    await expect(page.locator('#churn-name')).toBeFocused();
    await expect.poll(() => said(page)).toContain('Deck name: Error: Enter a value.');
    // The page drew again for its errors, and the form kept its check through it.
    expect(await page.evaluate(() => (window as unknown as Strict).churns)).toBeGreaterThan(churns);
    await expect(page.locator('#churn-name-error')).toHaveText('Error: Enter a value.');
    expect(
        await page.locator('#churn').evaluate((form) => (form as HTMLFormElement).noValidate)
    ).toBe(true);
    await page.waitForTimeout(300);
    expect((await said(page)).filter((words) => words.startsWith('Deck name'))).toHaveLength(1);
});

test('lands a refusal asked as its form first draws', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
        (window as unknown as Strict).showFirstRefusal();
    });
    await expect(page.locator('#first-refusal-name')).toBeFocused();
    await expect.poll(() => said(page)).toContain('Board name: Error: Enter a board name.');
});
