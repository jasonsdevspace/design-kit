import { expect, type Page, test } from '@playwright/test';
import { renderToStaticMarkup } from 'react-dom/server';

import { Button, Progress, StatusLine, StepperField } from '../src/react.js';
import { servePage } from './page.js';

/*
 * One status line shared by the pieces that speak on it, a busy button, a stepper and progress, as a
 * screen hands them its own: the end of a progress said though a busy button's words are on the
 * line, the end said after a stepper press on that line, and polite words giving way to firm words
 * still settling.
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
window.heard = [];
new MutationObserver(() => {
    if (line.textContent && line.textContent !== window.heard.at(-1)) window.heard.push(line.textContent);
}).observe(line, { childList: true, characterData: true, subtree: true });
window.move = (done) => {
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
    say: (words: string, options?: object) => void;
};

const open = async (page: Page) => {
    await page.clock.install();
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

test('says the end of a progress after a stepper press on the same line', async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: /^Raise/ }).click();
    await page.clock.runFor(3100);
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
