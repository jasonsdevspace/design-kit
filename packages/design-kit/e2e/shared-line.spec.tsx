import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { Button, Progress, StatusLine, StepperField } from '../src/react.js';
import { hearing, servePage, stillClock } from './page.js';

/*
 * One status line shared by the pieces that speak on it, a busy button, a stepper and progress, as a
 * screen hands them its own: the end of a progress said though a busy button's words are on the
 * line, the end waiting for a stepper's words and said once they leave or the field is typed in, a
 * busy notice waiting out a failure on the line and dropped where the work ended while it waited,
 * and polite words giving way to firm words still settling, whatever left the line meanwhile.
 */

const BODY = renderToStaticMarkup(
    <main>
        <h1>Import</h1>
        <Button id="start">Import products</Button>
        <StepperField id="batch" label="Batch" min={0} max={10} defaultValue={4} />
        <Progress id="import" label="Importing products" value={0} max={40} words="0 of 40" />
        <StatusLine className="screen-status" />
    </main>
);

const SCRIPT = `import { attachBusy, attachProgress, attachStatus, attachStepper } from './controls.js';
const line = document.querySelector('.screen-status');
const bar = document.querySelector('#import');
const button = document.querySelector('#start');
${hearing('.screen-status')}window.move = (done) => {
    bar.value = done;
    document.querySelector('#import-words').textContent = done + ' of 40';
};
window.busy = (on) => (on ? button.setAttribute('data-busy', 'Importing the file.') : button.removeAttribute('data-busy'));
window.say = attachStatus(line);
attachBusy(button, { status: line });
attachStepper(document.querySelector('#batch').closest('.dk-stepper'), { status: line });
attachProgress(bar, { status: line, done: 'Imported 40 products.' });
window.ready = true;`;

type Shared = {
    heard: string[];
    move: (done: number) => void;
    busy: (on: boolean) => void;
    say: (words: string | (() => string | null), options?: object) => void;
};

const open = async (page: Page) => {
    await stillClock(page.clock);
    await servePage(page, {
        title: 'Import',
        body: BODY,
        script: SCRIPT,
        css: ':root { --dk-wait: 400ms; }',
    });
    await page.waitForFunction(() => 'ready' in window);
    await page.clock.runFor(3100);
};

const heard = (page: Page) => page.evaluate(() => (window as unknown as Shared).heard);

test("says the end of a progress though a busy button's words are on the line", async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        (window as unknown as Shared).busy(true);
    });
    // The busy words are said once the wait has passed, and the run ends while they are on the line.
    await page.clock.runFor(600);
    await page.evaluate(() => {
        const shared = window as unknown as Shared;
        shared.move(40);
        shared.busy(false);
    });
    await page.clock.runFor(3100);
    expect(await heard(page)).toEqual(['Importing the file.', 'Imported 40 products.']);
});

test("says the end of a progress once a stepper's words on the same line leave", async ({
    page,
}) => {
    await open(page);
    await page.getByRole('button', { name: /^Raise/ }).click();
    await page.clock.runFor(1000);
    await page.evaluate(() => {
        (window as unknown as Shared).move(40);
    });
    await page.clock.runFor(3100);
    expect((await heard(page)).at(-1)).toBe('Imported 40 products.');
    expect(await heard(page)).toHaveLength(2);
});

test('leaves firm words still settling in place of polite words said after them', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        const shared = window as unknown as Shared;
        shared.say('3 still to enter.', { settle: 700 });
        shared.say('Importing products, 10 of 40.', { settle: 100, polite: true });
    });
    await page.clock.runFor(1000);
    expect(await heard(page)).toEqual(['3 still to enter.']);
});

test('says the end of a progress at once where the field is typed in after a press', async ({
    page,
}) => {
    await open(page);
    await page.getByRole('button', { name: /^Raise/ }).click();
    await page.clock.runFor(500);
    await page.getByRole('spinbutton').fill('7');
    await page.evaluate(() => {
        (window as unknown as Shared).move(40);
    });
    await page.clock.runFor(300);
    expect((await heard(page)).at(-1)).toBe('Imported 40 products.');
});

test('says a busy notice once a failure on the line leaves, where the work goes on', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        const shared = window as unknown as Shared;
        shared.say("Couldn't import. Try again.");
        shared.busy(true);
    });
    await page.clock.runFor(1000);
    expect(await heard(page)).toEqual(["Couldn't import. Try again."]);
    await page.clock.runFor(2000);
    expect(await heard(page)).toEqual(["Couldn't import. Try again.", 'Importing the file.']);
});

test('drops a busy notice waiting behind the end of a progress once the work is done', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        (window as unknown as Shared).busy(true);
    });
    await page.clock.runFor(300);
    await page.evaluate(() => {
        (window as unknown as Shared).move(40);
    });
    await page.clock.runFor(200);
    await page.evaluate(() => {
        (window as unknown as Shared).busy(false);
    });
    await page.clock.runFor(3100);
    expect(await heard(page)).toEqual(['Imported 40 products.']);
});

test('keeps firm words settling over polite words said once earlier words leave', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        (window as unknown as Shared).say('Importing products, 10 of 40.', { polite: true });
    });
    await page.clock.runFor(500);
    await page.evaluate(() => {
        (window as unknown as Shared).say('3 still to enter.', { settle: 2500 });
    });
    // The polite words leave a little after two seconds, while the firm words still settle.
    await page.clock.runFor(1800);
    await page.evaluate(() => {
        (window as unknown as Shared).say('Importing products, 20 of 40.', { polite: true });
    });
    await page.clock.runFor(1500);
    expect(await heard(page)).toEqual(['Importing products, 10 of 40.', '3 still to enter.']);
});

test('keeps firm words settling over polite words where a notice before them came to nothing', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        const shared = window as unknown as Shared;
        shared.say(() => null, { polite: true });
        shared.say('3 still to enter.', { settle: 700 });
    });
    await page.clock.runFor(300);
    await page.evaluate(() => {
        (window as unknown as Shared).say('Importing products, 10 of 40.', { polite: true });
    });
    await page.clock.runFor(1000);
    expect(await heard(page)).toEqual(['3 still to enter.']);
});

test('says the end of a progress waiting behind a stepper press once a second press leaves', async ({
    page,
}) => {
    await open(page);
    const raise = page.getByRole('button', { name: /^Raise/ });
    await raise.click();
    await page.clock.runFor(500);
    await page.evaluate(() => {
        (window as unknown as Shared).move(40);
    });
    await page.clock.runFor(500);
    await raise.click();
    await page.clock.runFor(3100);
    expect((await heard(page)).at(-1)).toBe('Imported 40 products.');
});

test('keeps the end of a progress waiting through firm words said again', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
        (window as unknown as Shared).say('Copied.');
    });
    await page.clock.runFor(500);
    await page.evaluate(() => {
        (window as unknown as Shared).move(40);
    });
    await page.clock.runFor(500);
    await page.evaluate(() => {
        (window as unknown as Shared).say('Copied again.');
    });
    await page.clock.runFor(3100);
    expect(await heard(page)).toEqual(['Copied.', 'Copied again.', 'Imported 40 products.']);
});

test('keeps the end of a progress said while a press is still being put in, and says it after', async ({
    page,
}) => {
    await open(page);
    await page.getByRole('button', { name: /^Raise/ }).click();
    await page.clock.runFor(50);
    await page.evaluate(() => {
        (window as unknown as Shared).move(40);
    });
    await page.clock.runFor(3100);
    expect(await heard(page)).toHaveLength(2);
    expect((await heard(page)).at(-1)).toBe('Imported 40 products.');
});

test('says a busy notice a progress step took the place of once the step leaves', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        (window as unknown as Shared).busy(true);
    });
    // The notice is asked for once the wait has passed, and a step comes before it is put in.
    await page.clock.runFor(450);
    await page.evaluate(() => {
        (window as unknown as Shared).move(10);
    });
    await page.clock.runFor(3100);
    expect(await heard(page)).toEqual(['Importing products, 10 of 40.', 'Importing the file.']);
});

test('says the end of a progress and a busy notice both waiting, the end first', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        (window as unknown as Shared).move(10);
    });
    await page.clock.runFor(300);
    await page.evaluate(() => {
        (window as unknown as Shared).busy(true);
    });
    // The notice waits behind the step, the end takes the step's place, and a press comes before
    // the end is put in.
    await page.clock.runFor(500);
    await page.evaluate(() => {
        (window as unknown as Shared).move(40);
    });
    await page.clock.runFor(50);
    await page.getByRole('button', { name: /^Raise/ }).click();
    await page.clock.runFor(6000);
    const said = await heard(page);
    expect(said).toContain('Imported 40 products.');
    expect(said.at(-1)).toBe('Importing the file.');
});

test('keeps the end of a progress waiting when a busy notice comes to wait too', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        (window as unknown as Shared).say('Copied.');
    });
    await page.clock.runFor(300);
    await page.evaluate(() => {
        const shared = window as unknown as Shared;
        shared.move(40);
        shared.busy(true);
    });
    await page.clock.runFor(1000);
    await page.evaluate(() => {
        (window as unknown as Shared).busy(false);
    });
    await page.clock.runFor(3100);
    expect(await heard(page)).toEqual(['Copied.', 'Imported 40 products.']);
});

test("leaves the end of a progress unsaid where the page's result follows it in the same moment", async ({
    page,
}) => {
    await open(page);
    // The bar's change is heard in a microtask, so the result is said in the same task after it.
    await page.evaluate(async () => {
        const shared = window as unknown as Shared;
        shared.move(40);
        await Promise.resolve();
        shared.say('Imported 40 products, 2 skipped.');
    });
    await page.clock.runFor(3100);
    expect(await heard(page)).toEqual(['Imported 40 products, 2 skipped.']);
});

test('says nothing for a busy notice still waiting from a run that ended', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
        const shared = window as unknown as Shared;
        shared.say("Couldn't import. Try again.");
        shared.busy(true);
    });
    await page.clock.runFor(600);
    // The run ends and a fast one starts and ends again before the failure leaves.
    await page.evaluate(() => {
        const shared = window as unknown as Shared;
        shared.busy(false);
        shared.busy(true);
    });
    await page.clock.runFor(200);
    await page.evaluate(() => {
        (window as unknown as Shared).busy(false);
    });
    await page.clock.runFor(3100);
    expect(await heard(page)).toEqual(["Couldn't import. Try again."]);
});

test("frees the line of a stepper's range error once its field is typed in", async ({ page }) => {
    await open(page);
    const field = page.getByRole('spinbutton');
    await field.fill('12');
    await field.blur();
    await page.clock.runFor(300);
    await field.fill('6');
    await page.evaluate(() => {
        (window as unknown as Shared).move(40);
    });
    await page.clock.runFor(300);
    expect((await heard(page)).at(-1)).toBe('Imported 40 products.');
});

test('says the end of a progress after a press whose words were taken off in the moment they were said', async ({
    page,
}) => {
    await open(page);
    await page.evaluate(() => {
        // A press, then the field typed in within the same task, which takes its words off.
        [...document.querySelectorAll('button')]
            .find((button) => button.textContent.startsWith('Raise'))
            ?.click();
        const field = document.querySelector<HTMLInputElement>('#batch');
        if (field) {
            field.value = '7';
            field.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
    await page.clock.runFor(500);
    await page.evaluate(() => {
        (window as unknown as Shared).move(40);
    });
    await page.clock.runFor(300);
    expect((await heard(page)).at(-1)).toBe('Imported 40 products.');
});
