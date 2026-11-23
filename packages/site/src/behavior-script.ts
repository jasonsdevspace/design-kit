import { attachRoving, attachStatus } from 'design-kit-release/controls';

import { attachBusy, attachForm, moveFocus } from './behavior-controls.js';

/*
 * The behavior page's examples, each attached as a page attaches it and speaking on a status line
 * of its own. The line is out of sight, so the words it says are shown under the example too, and
 * stay there once the line empties. Nothing is made busy, loaded or said until a visitor presses
 * or types.
 */

/** The status line of the example an element is in. */
const lineOf = (element: Element) =>
    element.closest('.site-behavior')?.querySelector<HTMLElement>('.screen-status') ?? null;

for (const line of document.querySelectorAll<HTMLElement>('main .site-behavior .screen-status')) {
    const shown = line.closest('.site-behavior')?.querySelector('.site-said-words');
    if (!shown) continue;
    new MutationObserver(() => {
        const words = line.textContent.trim();
        if (words !== '') shown.textContent = `“${words}”`;
    }).observe(line, { childList: true, characterData: true, subtree: true });
}

/**
 * The refused form, attached as it is drawn, its Save rule shown once it is: the kit checks it on
 * a submit and refuses it where a field fails, and a submit that passes reaches the page, which
 * saves and says so.
 */
const ruleForm = document.querySelector<HTMLFormElement>('main #rule-form');
const ruleSave = document.querySelector<HTMLButtonElement>('main #rule-save');
const ruleLine = ruleForm && lineOf(ruleForm);
if (ruleForm && ruleSave && ruleLine) {
    const sayRule = attachStatus(ruleLine);
    attachForm(ruleForm, { status: ruleLine });
    // Shown and on only once the kit checks the form, since a hidden submit is still the one Enter
    // in a field presses, and the browser would send the form to the address bar.
    ruleSave.disabled = false;
    ruleSave.hidden = false;
    ruleForm.addEventListener('submit', (event) => {
        event.preventDefault();
        sayRule('The rule was saved.');
    });
}

/** How long the busy button's save takes, long enough to hear its words. */
const SAVE_MS = 3000;

/**
 * The busy button, busy for the length of a save once pressed. The kit stops a second press, draws
 * it off once the wait has passed and says its words, and the page says the result.
 */
const saveRound = document.querySelector<HTMLButtonElement>('main #save-round');
const roundLine = saveRound && lineOf(saveRound);
if (saveRound && roundLine) {
    const sayRound = attachStatus(roundLine);
    attachBusy(saveRound, { status: roundLine });
    saveRound.hidden = false;
    saveRound.addEventListener('click', () => {
        saveRound.setAttribute('data-busy', 'Saving the round.');
        window.setTimeout(() => {
            saveRound.removeAttribute('data-busy');
            sayRound('The round was saved.');
        }, SAVE_MS);
    });
}

/**
 * The grid of cards, one stop for the Tab key with the arrow keys among its cards. Each card flips
 * what it says it is, but the one marked off, and the count chosen waits for the presses to stop.
 */
const hand = document.querySelector<HTMLElement>('main #hand');
const handLine = hand && lineOf(hand);
if (hand && handLine) {
    const sayHand = attachStatus(handLine);
    // Shown first, so the arrow keys place their stop on a grid in sight.
    hand.hidden = false;
    attachRoving(hand);
    const cards = [...hand.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')];
    for (const card of cards) {
        card.addEventListener('click', () => {
            if (card.getAttribute('aria-disabled') === 'true') return;
            card.setAttribute('aria-pressed', String(card.getAttribute('aria-pressed') !== 'true'));
            const count = cards.filter(
                (each) => each.getAttribute('aria-pressed') === 'true'
            ).length;
            sayHand(count === 1 ? '1 card chosen.' : `${String(count)} cards chosen.`, {
                settle: 700,
            });
        });
    }
}

/**
 * The list of players. A press of Remove takes its row away, and with it the button that had
 * focus, so focus moves to the next row's Remove, the one before, or the list's heading. A list
 * with no rows is not drawn, and a line under the heading says so in its place. Put the players
 * back draws them all again.
 */
const players = document.querySelector<HTMLElement>('main #players');
const playersBack = document.querySelector<HTMLButtonElement>('main #players-back');
const playersNone = document.querySelector<HTMLElement>('main #players-none');
const playersLine = players && lineOf(players);
if (players && playersBack && playersNone && playersLine) {
    const sayPlayers = attachStatus(playersLine);
    const rows = [...players.children];
    const removeOf = (row: Element | undefined) =>
        row?.querySelector<HTMLButtonElement>('button') ?? null;
    for (const row of rows) {
        const remove = removeOf(row);
        if (!remove) continue;
        const name = row.querySelector('.dk-row-title')?.textContent ?? '';
        remove.hidden = false;
        remove.addEventListener('click', () => {
            const left = [...players.children];
            const at = left.indexOf(row);
            const next = removeOf(left[at + 1] ?? left[at - 1]);
            row.remove();
            players.hidden = players.children.length === 0;
            playersNone.hidden = !players.hidden;
            moveFocus(next ?? 'players-heading', { fallbacks: ['players-heading'] });
            sayPlayers(`${name} was removed.`);
        });
    }
    playersBack.hidden = false;
    playersBack.addEventListener('click', () => {
        players.replaceChildren(...rows);
        players.hidden = false;
        playersNone.hidden = true;
        sayPlayers('The players are back.');
    });
}

/** How long the product takes to load, long enough to see its loading line. */
const LOAD_MS = 2000;

/**
 * The part of the page that loads. A load marks it busy and puts its loading line in, and says
 * the line's words once the wait outlasts --dk-wait, unless the load ends first. A load that ends
 * draws the product, takes the mark away and says so. One that fails puts the failure in the
 * alert, which reads it, and Try again loads once more, with focus on the product's heading.
 */
const product = document.querySelector<HTMLElement>('main #product');
const productLoad = document.querySelector<HTMLButtonElement>('main #product-load');
const productFail = document.querySelector<HTMLButtonElement>('main #product-fail');
const failure = document.querySelector<HTMLElement>('main #product-failure');
const failureBody = failure?.querySelector('.dk-callout-body');
const failureWords = document.querySelector<HTMLTemplateElement>('main #product-failure-words')
    ?.content.firstElementChild;
const productLine = product && lineOf(product);
if (
    product &&
    productLoad &&
    productFail &&
    failure &&
    failureBody &&
    failureWords &&
    productLine
) {
    const sayProduct = attachStatus(productLine);
    const loaded = [...product.childNodes];
    const loadingLine = document.createElement('p');
    loadingLine.className = 'dk-loading';
    loadingLine.textContent = 'Loading the product.';
    // Each load counts, so a load overtaken by another draws and says nothing.
    let loads = 0;
    let loading = false;
    const empty = () => {
        failureBody.replaceChildren();
        failure.querySelector(':scope > .dk-callout-actions')?.remove();
        failure.setAttribute('data-empty', '');
    };
    const load = (fails: boolean) => {
        loads += 1;
        const mine = loads;
        empty();
        loading = true;
        product.setAttribute('aria-busy', 'true');
        product.replaceChildren(loadingLine);
        sayProduct(() => (loading && mine === loads ? 'Loading the product.' : null), {
            settle: 400,
        });
        window.setTimeout(() => {
            if (mine !== loads) return;
            loading = false;
            if (fails) {
                product.replaceChildren();
                product.removeAttribute('aria-busy');
                fail();
                return;
            }
            product.replaceChildren(...loaded);
            product.removeAttribute('aria-busy');
            sayProduct('Product loaded.');
        }, LOAD_MS);
    };
    const fail = () => {
        const words = document.importNode(failureWords, true);
        const actions = words.querySelector(':scope > .dk-callout-actions');
        failureBody.replaceChildren(...(words.querySelector('.dk-callout-body')?.childNodes ?? []));
        if (actions) {
            actions.querySelector('button')?.addEventListener('click', () => {
                load(false);
                // Try again goes with the failure, so focus goes to what is loading again.
                moveFocus('product-heading');
            });
            failure.append(actions);
        }
        failure.removeAttribute('data-empty');
    };
    productLoad.hidden = false;
    productFail.hidden = false;
    productLoad.addEventListener('click', () => {
        load(false);
    });
    productFail.addEventListener('click', () => {
        load(true);
    });
}
