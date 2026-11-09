import { THEME_KEY, THEMES } from 'design-kit-release/theme';

/*
 * The site's own script, which the kit does not ship: the theme switch in the strip, a copy button
 * beside each block of code, and the live copies of the states a reader can change. The theme
 * script the kit puts inline has already drawn the theme before this runs, so the switch shows the
 * choice, and saves and draws a new one. It saves under the portfolio's key and with the
 * portfolio's values, so a choice made here holds on every page of jasonsdevspace.com, and the
 * other way around.
 */

/** The portfolio's choices, System and the kit's two themes, and the word each is shown by. */
const CHOICES = ['system', ...THEMES] as const;
const WORDS: Readonly<Record<Choice, string>> = { system: 'System', light: 'Light', dark: 'Dark' };

type Choice = (typeof CHOICES)[number];

const isChoice = (value: string | null): value is Choice =>
    CHOICES.some((choice) => choice === value);

/**
 * The system's scheme, read as light where the browser cannot report it, as the theme script
 * does.
 */
const media = (() => {
    try {
        return window.matchMedia('(prefers-color-scheme: dark)');
    } catch {
        return null;
    }
})();

const systemIsDark = () => {
    try {
        return Boolean(media?.matches);
    } catch {
        return false;
    }
};

/** The system's theme, light where the browser cannot say. */
const systemTheme = () => (systemIsDark() ? 'dark' : 'light');

/** The choice saved, or null where the browser refuses the page its storage. */
const savedChoice = (): Choice | null => {
    try {
        const value = localStorage.getItem(THEME_KEY);
        return isChoice(value) ? value : 'system';
    } catch {
        return null;
    }
};

/**
 * The choice this page shows. Where the browser refuses to save it, it is held here alone, so it
 * still holds on this page until the page is left, and what storage holds is not read over it.
 */
let chosen: Choice = savedChoice() ?? 'system';
let heldHere = false;
/** Shows the chosen theme on the strip's switch, once the switch is built. */
let showChosen: () => void = () => undefined;

/** Draws a choice on the page, the system's theme for System. */
const draw = (choice: Choice) => {
    const theme = choice === 'system' ? systemTheme() : choice;
    document.documentElement.setAttribute('data-theme', theme);
};

/** Saves a choice where the browser allows it, and draws it on this page either way. */
const choose = (choice: Choice) => {
    chosen = choice;
    try {
        localStorage.setItem(THEME_KEY, choice);
        heldHere = false;
    } catch {
        // Held in `chosen` instead, for as long as the page is open.
        heldHere = true;
    }
    showChosen();
    draw(choice);
};

/**
 * The switch: a name and three radios in a radio group, built with the DOM, so the page's policy
 * needs no inline script or style. The group is named Theme and described by a note that says where
 * the choice is kept, so a screen reader hears both as it reaches the radios.
 */
const themeSwitch = () => {
    const name = document.createElement('span');
    name.id = 'site-theme-name';
    name.className = 'site-theme-name';
    name.textContent = 'Theme';
    const radios = CHOICES.map((choice) => {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'site-theme';
        radio.value = choice;
        radio.checked = choice === chosen;
        radio.addEventListener('change', () => {
            choose(choice);
        });
        const word = document.createElement('span');
        word.textContent = WORDS[choice];
        label.append(radio, word);
        return { label, radio };
    });
    const note = document.createElement('span');
    note.id = 'site-theme-note';
    note.className = 'dk-visually-hidden';
    note.textContent =
        'Your choice is saved for every page on jasonsdevspace.com, the portfolio included.';
    const group = document.createElement('div');
    group.className = 'site-theme';
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-labelledby', name.id);
    group.setAttribute('aria-describedby', note.id);
    group.append(name, ...radios.map(({ label }) => label), note);
    const show = () => {
        for (const { radio } of radios) radio.checked = radio.value === chosen;
    };
    return { group, show };
};

/**
 * Puts the switch in the room the page's own strip kept for it, not in a picture of a strip, and
 * names the strip's section Settings, so it becomes the landmark the kit makes of switches that
 * have come and the switch sits inside a landmark. It is not named Theme, as the group is, so a
 * screen reader never hears the name twice.
 */
const room = document.querySelector('body > .dk-strip .dk-strip-room');
const section = room?.parentElement;
if (room && section) {
    const { group, show } = themeSwitch();
    showChosen = show;
    room.replaceWith(group);
    section.setAttribute('aria-label', 'Settings');

    /** Shows and draws what is saved, when this page may not have heard it saved. */
    const catchUp = () => {
        const saved = savedChoice();
        if (saved === null || heldHere) return;
        chosen = saved;
        show();
        draw(saved);
    };

    // A choice saved in another tab, which the theme script has drawn too.
    window.addEventListener('storage', (event) => {
        if (event.key === null || event.key === THEME_KEY) catchUp();
    });
    // A page brought back from the browser's back and forward cache heard nothing while it was
    // away. The theme script has drawn from storage again, so where the browser refuses storage
    // the choice held here is drawn again after it.
    window.addEventListener('pageshow', (event) => {
        if (!event.persisted) return;
        if (heldHere) draw(chosen);
        else catchUp();
    });
    // When the system's theme changes the theme script draws again from storage, and where the
    // browser refuses storage it draws the system's over a choice it cannot know of, so the choice
    // is drawn again after it.
    if (typeof media?.addEventListener === 'function') {
        media.addEventListener('change', () => {
            draw(chosen);
        });
    }
}

/*
 * One copy button for each state's code, beside the title of its block, or beside the tabs where
 * the state has Markup and React. It copies the block its tab shows. Where the browser will not
 * let the page write to the clipboard, the button selects the block's text instead, so a reader
 * copies it with their own keys or their device's copy command. One status line, out of sight,
 * tells a screen reader which happened, and the button says it for a moment too.
 */
/** How long a button says what it did before it says Copy again, in milliseconds. */
const SAID_FOR = 2000;

/** Selects all of a block's text, for a reader to copy with their own keys. */
const select = (block: HTMLElement) => {
    const range = document.createRange();
    range.selectNodeContents(block);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
};

/** Writes text to the clipboard, or says it could not, where the browser refuses or has none. */
const copied = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
};

/** Each state's code on the page, and the landing page's install command, its blocks one panel each. */
const codes = document.querySelectorAll<HTMLElement>('.site-code, .site-install');

/**
 * The status line, in the main content from the start on a page with code, since a screen reader
 * may not hear a line added at the moment it speaks. It is emptied before each message and when
 * the message has been shown, on one timer, so a second copy is heard too and one message never
 * empties the next.
 */
const status = codes.length === 0 ? undefined : document.createElement('p');
if (status) {
    status.className = 'dk-visually-hidden';
    status.setAttribute('role', 'status');
    (document.querySelector('main') ?? document.body).append(status);
}
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

/**
 * How to copy what is selected: in the keys of a keyboard where any pointer can hover, as a mouse or
 * a trackpad, which a keyboard usually comes with, and otherwise in words for a touch screen.
 */
const howToCopy = () =>
    !window.matchMedia('(any-hover: hover)').matches
        ? "Selected. Copy it with your device's copy command."
        : 'Selected. Press Control and C, or Command and C on a Mac, to copy.';

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

/** The copy button for a state's code, copying whichever block `shown` gives when pressed. */
const copyButton = (shown: () => Block) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dk-button site-copy-button';
    const word = document.createElement('span');
    word.textContent = 'Copy';
    const what = document.createElement('span');
    what.className = 'dk-visually-hidden';
    button.append(word, what);
    let timer = 0;
    /** Names the button for the block it copies now, and has it say Copy again. */
    const rename = () => {
        what.textContent = ` ${shown().title}`;
        window.clearTimeout(timer);
        word.textContent = 'Copy';
    };
    button.addEventListener('click', () => {
        const pressed = shown();
        const { block } = pressed;
        void copied(block.textContent).then((done) => {
            // A tab changed while the clipboard answered has renamed the button for its own
            // block, so the button is left as it is, and a block no longer shown is not selected.
            if (shown() !== pressed) {
                if (done) say('Copied.');
                return;
            }
            if (!done) select(block);
            word.textContent = done ? 'Copied' : 'Selected';
            say(done ? 'Copied.' : howToCopy());
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                word.textContent = 'Copy';
            }, SAID_FOR);
        });
    });
    rename();
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
    if (!first) continue;
    let shown = first;
    const { button, rename } = copyButton(() => shown);
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
    /** The theme the page is drawn in, as the script set it or as the system's where it set none. */
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
            choose(theme);
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
