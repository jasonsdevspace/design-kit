import { attachCopyButton, attachThemeSwitch, chooseTheme } from 'design-kit-release/controls';

/*
 * The site's own script, which attaches the kit's controls and adds what the kit does not ship: the
 * theme switch in the strip, a copy button beside each block of code with tabs where a state has
 * two, and the live copies of the states a reader can change. The theme script the kit puts inline
 * has already drawn the theme before this runs, so the switch shows the choice, and saves and draws
 * a new one. It saves under the portfolio's key and with the portfolio's values, so a choice made
 * here holds on every page of jasonsdevspace.com, and the other way around.
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
 * the state has Markup and React, built here in the kit's markup, since with no script there is
 * nothing to copy with. The kit's function copies the block its tab shows, or selects it where the
 * browser will not let the page write to the clipboard, and says which on one status line out of
 * sight, and the button says it for a moment too.
 */

/** Each state's code on the page, and the landing page's install command, its blocks one panel each. */
const codes = document.querySelectorAll<HTMLElement>('.site-code, .site-install');

/**
 * The status line, in the main content from the start on a page with code, since a screen reader
 * may not hear a line added at the moment it speaks, drawn as the kit's `CopyStatus` draws it.
 */
const status = codes.length === 0 ? undefined : document.createElement('p');
if (status) {
    status.className = 'dk-visually-hidden';
    status.setAttribute('role', 'status');
    (document.querySelector('main') ?? document.body).append(status);
}

/** How long the status line holds what the preview note says, in milliseconds, as the kit's does. */
const SAID_FOR = 2000;

/**
 * Says what the preview note says on the status line. It is emptied before each message and when
 * the message has been shown, on one timer, so a second message is heard too and one message never
 * empties the next.
 */
let statusTimer = 0;
const say = (message: string) => {
    if (!status) return;
    window.clearTimeout(statusTimer);
    status.textContent = '';
    statusTimer = window.setTimeout(() => {
        status.textContent = message;
        statusTimer = window.setTimeout(() => {
            status.textContent = '';
        }, SAID_FOR);
    }, 100);
};

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
        const head = panel.querySelector<HTMLElement>('.site-code-head');
        const title = panel.querySelector('.site-code-name');
        const block = panel.querySelector<HTMLElement>('pre.dk-code');
        if (!head || !title || !block) return [];
        const word = panel.querySelector('.dk-code-title')?.textContent ?? '';
        return [{ panel, head, word, title: title.textContent, block }];
    });

/** A span of the copy button's markup, hidden from its name where it is a word not shown. */
const span = (text: string, hidden = false) => {
    const made = document.createElement('span');
    made.textContent = text;
    if (hidden) made.setAttribute('aria-hidden', 'true');
    return made;
};

/**
 * The copy button for a state's code, in the markup the kit's `CopyButton` draws, attached to copy
 * whichever block `shown` gives when pressed.
 */
const copyButton = (shown: () => Block, line: HTMLElement) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dk-button dk-copy';
    button.hidden = true;
    const words = document.createElement('span');
    words.className = 'dk-copy-words';
    const copy = span('Copy');
    words.append(copy, span('Copied', true), span('Selected', true));
    const what = span('');
    what.className = 'dk-visually-hidden';
    button.append(words, what);
    /**
     * Names the button for the block it copies now, and has it say Copy again, so it never says
     * Copied of a block it has not copied.
     */
    const rename = () => {
        what.textContent = ` ${shown().title}`;
        for (const word of words.children) {
            if (word === copy) word.removeAttribute('aria-hidden');
            else word.setAttribute('aria-hidden', 'true');
        }
    };
    rename();
    attachCopyButton(button, { source: () => shown().block, status: line });
    return { button, rename };
};

/**
 * Makes a state's blocks tabs, as the tabs pattern has them: one tab in the tab order, the arrow
 * keys moving the choice and the focus around the row, Home and End to its ends, and a tab chosen
 * as it is focused. The tabs are named for the state, as the summary is, and each block's own head
 * is hidden, since its tab names it. With no script the blocks stay one above the other.
 */
const tabsFor = (code: HTMLElement, blocks: readonly Block[], showing: (block: Block) => void) => {
    const list = document.createElement('div');
    list.setAttribute('role', 'tablist');
    list.setAttribute(
        'aria-label',
        code.querySelector('summary .dk-visually-hidden')?.textContent ?? 'The code'
    );
    const tabs = blocks.map((block) => {
        const id = block.block.getAttribute('aria-labelledby') ?? '';
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'site-code-tab';
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
    const show = (index: number, focus: boolean) => {
        blocks.forEach((block, at) => {
            const chosen = at === index;
            const tab = tabs[at];
            if (!tab) return;
            tab.setAttribute('aria-selected', String(chosen));
            tab.tabIndex = chosen ? 0 : -1;
            block.panel.hidden = !chosen;
            if (chosen) {
                showing(block);
                if (focus) tab.focus();
            }
        });
    };
    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            show(index, false);
        });
    });
    list.addEventListener('keydown', (event) => {
        // A key held with a modifier is the browser's or the system's, such as Back.
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        const at = tabs.findIndex((tab) => tab === document.activeElement);
        if (at < 0) return;
        const last = tabs.length - 1;
        const moves: Partial<Record<string, number>> = {
            ArrowRight: at === last ? 0 : at + 1,
            ArrowLeft: at === 0 ? last : at - 1,
            Home: 0,
            End: last,
        };
        const to = moves[event.key];
        if (to === undefined) return;
        event.preventDefault();
        show(to, true);
    });
    list.append(...tabs);
    show(0, false);
    return list;
};

for (const code of codes) {
    const blocks = blocksOf(code);
    const [first] = blocks;
    if (!first || !status) continue;
    let shown = first;
    const { button, rename } = copyButton(() => shown, status);
    if (blocks.length === 1) {
        first.head.append(button);
        continue;
    }
    const bar = document.createElement('div');
    bar.className = 'site-code-bar';
    bar.append(
        tabsFor(code, blocks, (block) => {
            shown = block;
            rename();
        }),
        button
    );
    code.querySelector(':scope > summary')?.after(bar);
}

/*
 * The live copies of the states a reader can change. A toggle flips what it says it is, and a
 * button that names a panel opens and closes it, so what a control says it is stays true after it
 * is pressed. The previews in the other theme stay as they are drawn.
 */
for (const toggle of document.querySelectorAll<HTMLButtonElement>(
    'main .site-copy:not([inert]) button[aria-pressed]'
)) {
    toggle.addEventListener('click', () => {
        if (toggle.getAttribute('aria-disabled') === 'true') return;
        toggle.setAttribute('aria-pressed', String(toggle.getAttribute('aria-pressed') !== 'true'));
    });
}

for (const opener of document.querySelectorAll<HTMLButtonElement>(
    'main .site-copy:not([inert]) button[aria-expanded][aria-controls]'
)) {
    const panel = document.getElementById(opener.getAttribute('aria-controls') ?? '');
    if (!panel) continue;
    // The panel starts as the button says it is, open or closed.
    panel.hidden = opener.getAttribute('aria-expanded') !== 'true';
    opener.addEventListener('click', () => {
        const open = opener.getAttribute('aria-expanded') !== 'true';
        opener.setAttribute('aria-expanded', String(open));
        panel.hidden = !open;
    });
}

/*
 * A preview does nothing when it is tapped, since it is inert, so the tap is answered: a note under
 * the state's two copies says the copy is only a preview, points to the one marked Live and offers
 * to switch to the other theme, and the status line says the same to a screen reader, naming the
 * live copy by its theme, since the Live mark is hidden from it. The keyboard never reaches a preview, so the
 * note is never needed there, and it adds nothing to the keyboard's path until a tap brings it. It
 * closes on Escape, on a tap anywhere else, and whenever the page's theme changes, by its button,
 * the strip's switch, the system or another tab, so it never names a theme the preview is not in.
 * A picture is a picture in either theme, so a tap on one is left alone.
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
        button.className = 'site-preview-switch';
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
