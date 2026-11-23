import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { Button, InputField, StatusLine } from '../src/react.js';
import { bundle } from './bundle.js';
import { box, forceColors, servePage, stillClock, style } from './page.js';

/*
 * A busy button, as `Button` draws it with `busy` and `attachBusy` makes it work: marked off at
 * once, so a press by pointer, Enter, Space or a form's Enter does nothing however often it lands,
 * its off look held back for --dk-wait so a fast save shows and says nothing, the pointer's wait
 * shown at once, its words said once the wait outlasts the token, dropped where the work ends first
 * and said again for a busy that starts again, the look's wait kept under reduced motion and in
 * forced colors, and three dots past the wait that an off button lacks, its name and its box kept,
 * centered whatever the button's alignment, three at every text size, in the system's gray in
 * forced colors, never fainter than the pulse's floor and still under reduced motion. Through
 * React's `useBusy`, a double press saves once and a save that ends just after the wait says
 * nothing late.
 */

const BODY = renderToStaticMarkup(
    <main>
        <form id="rule">
            <InputField id="name" label="Rule name" />
            <Button id="save" type="submit" accent>
                Save rule
            </Button>
        </form>
        <Button id="off" accent off>
            Delete rule
        </Button>
        <StatusLine className="screen-status" />
    </main>
);

const SCRIPT = `import { attachBusy } from './controls.js';
const button = document.querySelector('#save');
const line = document.querySelector('.screen-status');
window.saves = 0;
window.heard = [];
new MutationObserver(() => {
    if (line.textContent) window.heard.push(line.textContent);
}).observe(line, { childList: true, characterData: true, subtree: true });
document.querySelector('#rule').addEventListener('submit', (event) => {
    event.preventDefault();
    window.saves += 1;
    button.setAttribute('data-busy', 'Saving the rule.');
});
window.done = () => button.removeAttribute('data-busy');
attachBusy(button, { status: line });
window.ready = true;`;

type Busy = { saves: number; heard: string[]; done: () => void };

const open = async (page: Page, wait = '400ms') => {
    await servePage(page, {
        title: 'Busy',
        body: BODY,
        script: SCRIPT,
        css: `:root { --dk-wait: ${wait}; }`,
    });
    await page.waitForFunction(() => 'ready' in window);
};

const save = (page: Page) => page.getByRole('button', { name: 'Save rule' });
const saves = (page: Page) => page.evaluate(() => (window as unknown as Busy).saves);
const heard = (page: Page) => page.evaluate(() => (window as unknown as Busy).heard);
const look = async (page: Page, name: string) => (await style(save(page), name))[name];

/** What a button draws after its words, where a busy one draws its dots. */
const dots = (page: Page, selector: string) =>
    page.locator(selector).evaluate((element) => {
        const drawn = getComputedStyle(element, '::after');
        return {
            content: drawn.content,
            visibility: drawn.visibility,
            image: drawn.backgroundImage,
            opacity: drawn.opacity,
            color: drawn.color,
        };
    });

/**
 * How far the middle of a button's dots sits from the middle of the button, and how many dots wide
 * their box is, the box's width over the width of one dot's tile.
 */
const placed = (page: Page, selector: string) =>
    page.locator(selector).evaluate((element) => {
        const frame = element.getBoundingClientRect();
        const drawn = getComputedStyle(element, '::after');
        const start =
            frame.left +
            Number.parseFloat(getComputedStyle(element).borderLeftWidth) +
            Number.parseFloat(drawn.left) +
            Number.parseFloat(drawn.marginLeft);
        const width = Number.parseFloat(drawn.width);
        const tile = Number.parseFloat(drawn.backgroundSize.split(' ')[0] ?? '');
        return { off: start + width / 2 - (frame.left + frame.width / 2), across: width / tile };
    });

/** Whether anything drawn on the button after its words is still moving. */
const moving = (page: Page) =>
    page.evaluate(() =>
        document
            .getAnimations()
            .some(
                (animation) =>
                    animation.playState === 'running' &&
                    (animation.effect as KeyframeEffect | null)?.pseudoElement === '::after'
            )
    );

test('marks a busy button off and ignores a press by pointer, Enter, Space or a form', async ({
    page,
}) => {
    await open(page);
    await save(page).click();
    await expect(save(page)).toHaveAttribute('aria-disabled', 'true');
    // Forced, since a pointer's tools take a button marked off as not there to press.
    await save(page).click({ force: true });
    await save(page).focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await page.locator('#name').press('Enter');
    expect(await saves(page)).toBe(1);
    expect(await look(page, 'cursor')).toBe('progress');
    // Done, the mark the attach set goes, and a press saves again.
    await page.evaluate(() => {
        (window as unknown as Busy).done();
    });
    await expect(save(page)).not.toHaveAttribute('aria-disabled');
    await save(page).click();
    expect(await saves(page)).toBe(2);
});

test('holds its look and says nothing for a fast save', async ({ page }) => {
    await stillClock(page.clock);
    await open(page, '10s');
    const before = await look(page, 'background-color');
    await save(page).click();
    expect(await look(page, 'background-color')).toBe(before);
    await page.evaluate(() => {
        (window as unknown as Busy).done();
    });
    // Past the wait, where a notice the save's end did not call off would be said.
    await page.clock.runFor(11_000);
    expect(await heard(page)).toEqual([]);
});

test('drops its words where the work ends after the wait but before they are said', async ({
    page,
}) => {
    await stillClock(page.clock);
    await open(page, '150ms');
    await page.evaluate(() => {
        document.querySelector<HTMLButtonElement>('#save')?.click();
        // Past the wait, inside the moment the line takes to put words in.
        window.setTimeout(() => {
            (window as unknown as Busy).done();
        }, 200);
    });
    await page.clock.runFor(500);
    expect(await heard(page)).toEqual([]);
});

for (const motion of ['no-preference', 'reduce'] as const) {
    test(`shows and says the wait once it outlasts the token, with motion ${motion}`, async ({
        page,
    }) => {
        await page.emulateMedia({ reducedMotion: motion });
        await open(page, '150ms');
        const before = await look(page, 'background-color');
        await save(page).click();
        await expect.poll(() => look(page, 'background-color')).not.toBe(before);
        await expect(page.locator('.screen-status')).toHaveText('Saving the rule.');
        expect(await heard(page)).toEqual(['Saving the rule.']);
    });
}

test('draws three dots past the wait, which an off button lacks, its name and box kept', async ({
    page,
}) => {
    await open(page, '150ms');
    await save(page).click();
    await expect.poll(async () => (await dots(page, '#save')).visibility).toBe('visible');
    const drawn = await dots(page, '#save');
    expect(drawn.content).toBe('""');
    expect(drawn.image).toContain('radial-gradient');
    expect((await dots(page, '#off')).content).toBe('none');
    expect(await moving(page)).toBe(true);
    await expect(save(page)).toHaveAccessibleName('Save rule');
    // The dots taken away, neither the busy button nor the off one beside it moves or resizes.
    const busy = page.locator('#save');
    const off = page.locator('#off');
    const boxes = [await box(busy, 'the busy button'), await box(off, 'the off button')];
    await page.addStyleTag({ content: '.dk-button::after { display: none; }' });
    expect([await box(busy, 'the busy button'), await box(off, 'the off button')]).toEqual(boxes);
});

test('centers its dots whatever the alignment, three across at every text size', async ({
    page,
}) => {
    await open(page, '0s');
    await page.evaluate(() => {
        const start = document.createElement('button');
        start.id = 'start';
        start.className = 'dk-button';
        start.style.cssText = 'justify-content: flex-start; width: 14rem';
        start.setAttribute('data-busy', '');
        start.setAttribute('aria-disabled', 'true');
        start.textContent = 'Save the list';
        document.querySelector('main')?.append(start);
        document.querySelector('#save')?.setAttribute('data-busy', '');
    });
    for (const size of ['100%', '125%', '150%']) {
        await page.evaluate((root) => {
            document.documentElement.style.fontSize = root;
        }, size);
        for (const selector of ['#save', '#start']) {
            const { off, across } = await placed(page, selector);
            expect(Math.abs(off), `${selector} at ${size}`).toBeLessThan(0.5);
            expect(across, `${selector} at ${size}`).toBeCloseTo(3, 5);
        }
    }
});

test('holds its dots out of sight for the wait', async ({ page }) => {
    await stillClock(page.clock);
    await open(page, '10s');
    await save(page).click();
    expect((await dots(page, '#save')).visibility).toBe('hidden');
});

test('pulses its dots no fainter than a floor that keeps them clear', async ({ page }) => {
    await open(page);
    const floor = await page.evaluate(() => {
        const find = (rules: CSSRuleList): string | null => {
            for (const rule of Array.from(rules)) {
                if (rule instanceof CSSKeyframesRule && rule.name === 'dk-busy') {
                    const frames = Array.from(rule.cssRules) as CSSKeyframeRule[];
                    return frames.map((frame) => frame.style.opacity).find(Boolean) ?? null;
                }
                if ('cssRules' in rule) {
                    const inner = find((rule as CSSGroupingRule).cssRules);
                    if (inner !== null) return inner;
                }
            }
            return null;
        };
        for (const sheet of Array.from(document.styleSheets)) {
            const found = find(sheet.cssRules);
            if (found !== null) return found;
        }
        return null;
    });
    expect(Number(floor)).toBeGreaterThanOrEqual(0.55);
});

test('draws its dots still under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '150ms');
    await save(page).click();
    await expect.poll(async () => (await dots(page, '#save')).visibility).toBe('visible');
    await expect.poll(() => moving(page)).toBe(false);
    const drawn = await dots(page, '#save');
    expect(drawn.image).toContain('radial-gradient');
    expect(drawn.opacity).toBe('1');
});

test("draws its dots in the system's gray in forced colors", async ({ page }) => {
    await forceColors(page);
    await open(page, '150ms');
    await save(page).click();
    await expect.poll(async () => (await dots(page, '#save')).visibility).toBe('visible');
    const gray = await page.evaluate(() => {
        const probe = document.createElement('span');
        probe.style.cssText = 'forced-color-adjust: none; color: GrayText';
        document.body.append(probe);
        return getComputedStyle(probe).color;
    });
    const drawn = await dots(page, '#save');
    expect(drawn.image).not.toBe('none');
    expect(drawn.image).toContain('radial-gradient');
    expect(drawn.color).toBe(gray);
});

test('says its words again for a busy that ends and starts again at once', async ({ page }) => {
    await open(page, '150ms');
    await save(page).click();
    await expect(page.locator('.screen-status')).toHaveText('Saving the rule.');
    await page.evaluate(() => {
        const button = document.querySelector('#save');
        button?.removeAttribute('data-busy');
        button?.setAttribute('data-busy', 'Saving again.');
    });
    await expect.poll(() => heard(page)).toEqual(['Saving the rule.', 'Saving again.']);
});

test('holds its look for the wait in forced colors too', async ({ page }) => {
    await forceColors(page);
    await open(page, '10s');
    const before = await look(page, 'color');
    await save(page).click();
    expect(await look(page, 'color')).toBe(before);
});

test.describe('in React', () => {
    let app = '';
    test.beforeAll(async () => {
        test.setTimeout(120_000);
        app = await bundle('busy-page.tsx');
    });

    test('saves once for a double press, and says it is saving only while it is', async ({
        page,
    }) => {
        await servePage(page, { title: 'Busy', body: '<div id="root"></div>', script: app });
        const button = page.getByRole('button', { name: 'Save the round' });
        await button.dblclick({ force: true });
        await expect(button).toHaveAttribute('data-busy', 'Saving the round.');
        await expect(page.locator('#root p[role="status"]')).toHaveText('Saving the round.');
        await expect(page.locator('#saves')).toHaveText('1');
        await expect(button).not.toHaveAttribute('data-busy');
    });

    test('says nothing late for a save that ends just after the wait', async ({ page }) => {
        await stillClock(page.clock);
        await servePage(page, { title: 'Busy', body: '<div id="root"></div>', script: app });
        const button = page.getByRole('button', { name: 'Save the scores' });
        await button.click();
        // To just past the save's end, where React draws the button again on a task of its own,
        // which WebKit runs only once real time passes, as it always does outside a test.
        await page.clock.runFor(460);
        await expect(button).not.toHaveAttribute('data-busy');
        // Past the moment the line would have put words in.
        await page.clock.runFor(340);
        expect(await page.evaluate(() => (window as unknown as { heard: string[] }).heard)).toEqual(
            []
        );
    });
});
