import {
    attachBusy,
    attachCopyButton,
    attachDialog,
    attachForm,
    attachPanel,
    attachRoving,
    attachStatus,
    attachStepper,
    attachThemeSwitch,
    attachToast,
    chooseTheme,
    moveFocus,
} from 'design-kit-release/controls';

/*
 * The site's own script, which puts the kit's theme switch in the strip and a copy button beside
 * each block of code, attaches the kit's steppers, dialogs, panels, toast and arrow keys where a
 * page shows them, makes the behavior page's examples work, and adds what the kit does not ship:
 * tabs drawn where a state's code has two blocks, the live copies of the states a reader can
 * change, and the note a tap on a preview brings, said on the kit's status line. The theme script
 * the kit puts inline has already drawn the theme before this runs, so the switch shows the choice,
 * and saves and draws a new one. It saves under the portfolio's key and with the portfolio's
 * values, so a choice made here holds on every page of jasonsdevspace.com, and the other way
 * around.
 */

/**
 * Puts the kit's switch, from the template the page draws it in, in the room the page's own strip
 * kept for it, not in a picture of a strip, and names the strip's section Settings, so it becomes
 * the landmark the kit makes of switches that have come and the switch sits inside a landmark. It
 * is not named Theme, as the group is, so a screen reader never hears the name twice.
 */
const template = document.querySelector<HTMLTemplateElement>('template#site-theme-switch');
const room = document.querySelector('body > .dk-strip .dk-strip-room');
const section = room?.parentElement;
const themeSwitch = template?.content.querySelector<HTMLElement>('.dk-theme-switch');
if (template && room && section && themeSwitch) {
    const group = document.importNode(themeSwitch, true);
    room.replaceWith(group);
    section.setAttribute('aria-label', 'Settings');
    template.remove();
    attachThemeSwitch(group);
}

/*
 * One copy button for each state's code, beside the title of its block, or beside the tabs where
 * the state has Markup and React, copied from the kit's `CopyButton` in a template the page draws,
 * since with no script there is nothing to copy with. The kit's function copies the block its tab
 * shows, or selects it where the browser will not let the page write to the clipboard, and says
 * which on one status line out of sight, and the button says it for a moment too.
 */

/** Each state's code on the page, and the landing page's install command, its blocks one panel each. */
const codes = document.querySelectorAll<HTMLElement>('.site-code, .site-install');

/** The kit's copy button and status line, as the page draws them in a template. */
const copyParts = document.querySelector<HTMLTemplateElement>('template#site-copy')?.content;
const buttonToCopy = copyParts?.querySelector<HTMLButtonElement>('.dk-copy');
const statusToCopy = copyParts?.querySelector<HTMLElement>('[role="status"]');

/**
 * The status line, the kit's `CopyStatus`, in the main content from the start on a page with code,
 * since a screen reader may not hear a line added at the moment it speaks.
 */
const status =
    codes.length === 0 || !statusToCopy ? undefined : document.importNode(statusToCopy, true);
if (status) (document.querySelector('main') ?? document.body).append(status);

/**
 * Says what the preview note says on the status line, through the kit's own function for it, the
 * line the copy buttons speak on too, so the two take turns by the kit's rules and neither empties
 * the other's words early.
 */
const say = status ? attachStatus(status) : () => undefined;

/** A block of code in a state's panel: its head, its word, its whole title and the block. */
interface Block {
    readonly panel: HTMLElement;
    readonly head: HTMLElement;
    readonly word: string;
    readonly title: string;
    readonly block: HTMLElement;
}

/** The blocks of one state's code, in the order the page wrote them. */
const blocksOf = (code: HTMLElement): Block[] =>
    [...code.querySelectorAll<HTMLElement>(':scope > .site-code-panel')].flatMap((panel) => {
        const head = panel.querySelector<HTMLElement>('.dk-code-head');
        const title = panel.querySelector('.site-code-name');
        const block = panel.querySelector<HTMLElement>('pre.dk-code');
        if (!head || !title || !block) return [];
        const word = panel.querySelector('.dk-code-title')?.textContent ?? '';
        return [{ panel, head, word, title: title.textContent, block }];
    });

/**
 * The copy button for a state's code, a copy of the kit's, attached to copy whichever block `shown`
 * gives when pressed.
 */
const copyButton = (made: HTMLButtonElement, shown: () => Block, line: HTMLElement) => {
    const button = document.importNode(made, true);
    const what = button.querySelector(':scope > .dk-visually-hidden');
    const copy = button.querySelector('.dk-copy-words > :first-child');
    const attach = () => attachCopyButton(button, { source: () => shown().block, status: line });
    let detach = attach();
    /**
     * Names the button for the block it copies now. One still saying Copied or Selected of the
     * block before is attached again, which has it say Copy, so it never says either of a block it
     * has not copied. A copy the clipboard has yet to answer is left to say on the status line what
     * happened.
     */
    const rename = () => {
        if (what) what.textContent = ` ${shown().title}`;
        if (copy?.hasAttribute('aria-hidden')) {
            detach();
            detach = attach();
        }
    };
    rename();
    return { button, rename };
};

/**
 * Makes a state's blocks tabs, as the tabs pattern has them: one tab in the tab order, the arrow
 * keys moving the choice and the focus around the row, Home and End to its ends, and a tab chosen
 * as it is focused, by the kit's arrow keys. The tabs are named for the state, as the summary is,
 * and each block's own head is hidden, since its tab names it. With no script the blocks stay one
 * above the other.
 */
const tabsFor = (code: HTMLElement, blocks: readonly Block[], showing: (block: Block) => void) => {
    const list = document.createElement('div');
    list.className = 'dk-tabs';
    list.setAttribute('role', 'tablist');
    list.setAttribute(
        'aria-label',
        code.querySelector('summary .dk-visually-hidden')?.textContent ?? 'The code'
    );
    const tabs = blocks.map((block) => {
        const id = block.block.getAttribute('aria-labelledby') ?? '';
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'dk-tab';
        tab.id = `${id}-tab`;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-controls', `${id}-panel`);
        tab.textContent = block.word;
        block.panel.id = `${id}-panel`;
        block.panel.setAttribute('role', 'tabpanel');
        block.panel.setAttribute('aria-labelledby', tab.id);
        block.head.hidden = true;
        return tab;
    });
    let chosen = 0;
    const show = (index: number) => {
        chosen = index;
        blocks.forEach((block, at) => {
            const picked = at === index;
            tabs[at]?.setAttribute('aria-selected', String(picked));
            block.panel.hidden = !picked;
            if (picked) showing(block);
        });
    };
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            show(index);
        });
    });
    list.append(...tabs);
    show(0);
    // The arrow keys are the kit's, attached once the row is on the page, where its stop is placed.
    const keys = () =>
        attachRoving(list, {
            current: () => tabs[chosen] ?? null,
            onMove: (tab) => {
                const index = tabs.indexOf(tab as HTMLButtonElement);
                if (index >= 0) show(index);
            },
        });
    return { list, keys };
};

for (const code of codes) {
    const blocks = blocksOf(code);
    const [first] = blocks;
    if (!first || !status || !buttonToCopy) continue;
    let shown = first;
    const { button, rename } = copyButton(buttonToCopy, () => shown, status);
    if (blocks.length === 1) {
        first.head.append(button);
        continue;
    }
    const bar = document.createElement('div');
    bar.className = 'site-code-bar';
    const { list, keys } = tabsFor(code, blocks, (block) => {
        shown = block;
        rename();
    });
    bar.append(list, button);
    code.querySelector(':scope > summary')?.after(bar);
    // The code sits in a details shut until a reader opens it, where no tab can take the stop yet,
    // so the keys are attached as it first opens, or at once where it is open already.
    if (!(code instanceof HTMLDetailsElement) || code.open) keys();
    else {
        // Only once it is open, since an open and a shut in one task fire one toggle, shut.
        const opened = () => {
            if (!code.open) return;
            code.removeEventListener('toggle', opened);
            keys();
        };
        code.addEventListener('toggle', opened);
    }
}

/*
 * The states of the switch and the copy button. The live copy of each is attached as a page
 * attaches it, so the switch on the page shows the page's choice and saves a new one, and the copy
 * button copies the block beside it. The copy in the other theme is inert, so it is not attached,
 * and since the kit keeps a switch hidden until a script attaches it, the picture is shown by hand
 * with its own theme chosen, so it never shows a choice its colors are not in.
 */
for (const group of document.querySelectorAll<HTMLElement>(
    'main .site-copy:not([inert]) .dk-theme-switch'
)) {
    attachThemeSwitch(group);
}
const pictured = document.querySelectorAll<HTMLElement>('main .site-copy[inert] .dk-theme-switch');
/**
 * Shows each pictured switch with its copy's theme chosen, again on every change of the page's
 * theme, so a picture never shows a choice its colors are not in.
 */
const pictureSwitches = () => {
    const shown = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    for (const group of pictured) {
        group.hidden = false;
        // Only the copy in the other theme is pictured, since the live copy is attached.
        const choice = shown === 'dark' ? 'light' : 'dark';
        const radio = group.querySelector<HTMLInputElement>(`input[value="${choice}"]`);
        if (radio) radio.checked = true;
    }
};
if (pictured.length > 0) {
    pictureSwitches();
    new MutationObserver(pictureSwitches).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
    });
}
for (const button of document.querySelectorAll<HTMLButtonElement>('main .site-copy .dk-copy')) {
    const block = button.parentElement?.querySelector<HTMLElement>('pre.dk-code');
    if (button.closest('[inert]') || !block || !status) {
        button.hidden = false;
        continue;
    }
    attachCopyButton(button, { source: () => block, status });
}

/*
 * The live copies of the toggles, each of which flips what it says it is, so what it says stays
 * true after it is pressed. The previews in the other theme stay as they are drawn.
 */
for (const toggle of document.querySelectorAll<HTMLButtonElement>(
    'main .site-copy:not([inert]) button[aria-pressed]'
)) {
    toggle.addEventListener('click', () => {
        if (toggle.getAttribute('aria-disabled') === 'true') return;
        toggle.setAttribute('aria-pressed', String(toggle.getAttribute('aria-pressed') !== 'true'));
    });
}

// Each panel a live button opens is the kit's to open and close, its corner Close among them. A
// theme switch's button is the kit's switch to open, and a button naming no panel is passed over,
// since attachPanel refuses it and would stop the rest of this script.
for (const opener of document.querySelectorAll<HTMLButtonElement>(
    'main .site-copy:not([inert]) button[aria-expanded][aria-controls]:not(.dk-theme-switch-button)'
)) {
    if (opener.getAttribute('aria-controls')?.trim()) attachPanel(opener);
}

/*
 * Every stepper, the previews among them, since the kit hides a stepper's buttons until it is
 * attached and a preview without them would be a bare number field. The kit shows the error of a
 * stepper given a number past its limit as it attaches it, with nothing said, describes the field
 * by it and marks it invalid, so the live copy and its previews show the state they name, and it
 * takes the error away once the number is right.
 */
for (const stepper of document.querySelectorAll<HTMLElement>('main .site-copy .dk-stepper')) {
    attachStepper(stepper);
}

/*
 * The live copy of each dialog, and the pieces together's, opened by the button that names it,
 * which focus returns to when it closes. The previews draw the dialog in place, and are never
 * attached.
 */
for (const dialog of document.querySelectorAll<HTMLDialogElement>(
    'main .site-copy:not([inert]) .dk-dialog, main .site-together .dk-dialog'
)) {
    const open = attachDialog(dialog);
    const opener = document.querySelector<HTMLButtonElement>(
        `main button[aria-controls="${CSS.escape(dialog.id)}"]`
    );
    if (!opener) continue;
    opener.addEventListener('click', open);
    // An opener that waits hidden until its dialog works is shown now that it does.
    opener.hidden = false;
}

/*
 * The toast's section: a button that shows a toast with Undo, and Undo shows one with no action,
 * so the one toast shows both kinds, the one that waits and the one that leaves on its own.
 */
const toast = document.querySelector<HTMLElement>('main .site-toast .dk-toast');
const toastShow = document.querySelector<HTMLButtonElement>('main .site-toast-show');
if (toast && toastShow) {
    const show = attachToast(toast);
    toastShow.hidden = false;
    toastShow.addEventListener('click', () => {
        show('Round 3 saved.', {
            label: 'Undo',
            onAction: () => show('Round 3 is back as it was.'),
        });
    });
}

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

/*
 * A preview does nothing when it is tapped, since it is inert, so the tap is answered: a note under
 * the state's two copies says the copy is only a preview, points to the one marked Live and offers
 * to switch to the other theme, and the status line says the same to a screen reader, naming the
 * live copy by its theme, since the Live mark is hidden from it. The keyboard never reaches a
 * preview, so the note is never needed there, and it adds nothing to the keyboard's path until a
 * tap brings it. It closes on Escape, on a tap anywhere else, and whenever the page's theme
 * changes, by its button, the strip's switch, the system or another tab, so it never names a theme
 * the preview is not in. A picture is a picture in either theme, so a tap on one is left alone.
 */
const previews = [
    ...document.querySelectorAll<HTMLElement>(
        'main .site-state:not(.site-state-pictured) .site-other'
    ),
];
if (previews.length > 0) {
    /** The system's theme, light where the browser cannot say, as the theme script reads it. */
    const systemTheme = () => {
        try {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } catch {
            return 'light';
        }
    };
    /** The theme the page is drawn in, as a script set it or as the system's where none set it. */
    const pageTheme = () => document.documentElement.getAttribute('data-theme') ?? systemTheme();
    let note: HTMLElement | undefined;
    /** The live copy beside the open note's preview, where focus goes when the note takes it away. */
    let live: HTMLElement | undefined;
    const closeNote = () => {
        const hadFocus = note?.contains(document.activeElement) ?? false;
        note?.remove();
        note = undefined;
        if (hadFocus && live) {
            live.tabIndex = -1;
            live.focus();
        }
    };
    const noteFor = (preview: HTMLElement) => {
        closeNote();
        live =
            preview.parentElement?.querySelector<HTMLElement>(':scope > .site-copy:not([inert])') ??
            undefined;
        const shown = pageTheme();
        const theme = shown === 'dark' ? 'light' : 'dark';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'dk-button dk-button-text';
        button.textContent = `switch to ${theme}`;
        button.addEventListener('click', () => {
            chooseTheme(theme);
            say(`The theme is ${theme} now.`);
        });
        const only = `This is only a preview of the ${theme} theme.`;
        note = document.createElement('p');
        note.className = 'site-preview-note';
        note.append(`${only} Try the one marked Live, or `, button, '.');
        preview.after(note);
        say(`${only} Try the ${shown} one.`);
    };
    // Any change to the page's theme closes the note, whatever made it.
    new MutationObserver(closeNote).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
    });
    /** The preview whose box a pointer is in, on the preview or on an element that holds it. */
    const previewAt = (event: MouseEvent) => {
        const target = event.target;
        if (!(target instanceof Node)) return undefined;
        return previews.find((preview) => {
            if (!(preview.contains(target) || target.contains(preview))) return false;
            const box = preview.getBoundingClientRect();
            return (
                event.clientX >= box.left &&
                event.clientX <= box.right &&
                event.clientY >= box.top &&
                event.clientY <= box.bottom
            );
        });
    };
    // A tap on an inert copy is given to an element that holds it, the root in some browsers, so a
    // tap is on a preview when it starts and ends inside the preview's box. A drag that only ends
    // there is not a tap on it.
    let pressed: HTMLElement | undefined;
    document.addEventListener('pointerdown', (event) => {
        pressed = previewAt(event);
    });
    document.addEventListener('click', (event) => {
        if (event.target instanceof Node && note?.contains(event.target)) return;
        const tapped = previewAt(event);
        if (tapped && tapped === pressed) noteFor(tapped);
        else closeNote();
        pressed = undefined;
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && note && !event.defaultPrevented) closeNote();
    });
}
