import { THEME_CHOICES, THEME_KEY, type ThemeChoice } from './theme.js';

/*
 * What the kit's theme switch and copy button do, for a page to attach to the markup the
 * components draw or a page writes by hand. Each attach function finds its control's parts by their
 * classes, shows the control, which the markup keeps hidden so a visitor without script meets no
 * control that does nothing, and returns a function that takes it away again. Nothing runs when the
 * module is imported, and nothing here sets a style, so a page's policy can refuse every style it
 * did not serve.
 */

const isChoice = (value: string | null): value is ThemeChoice =>
    THEME_CHOICES.some((choice) => choice === value);

/** The system's scheme, read once a switch is attached, as light where the browser cannot say. */
let media: MediaQueryList | null | undefined;
const scheme = () => {
    if (media === undefined) {
        try {
            media = window.matchMedia('(prefers-color-scheme: dark)');
        } catch {
            media = null;
        }
    }
    return media;
};

const systemTheme = () => {
    try {
        return scheme()?.matches === true ? 'dark' : 'light';
    } catch {
        return 'light';
    }
};

/** The choice saved, `system` for nothing or an unknown value, or null where storage is refused. */
const savedChoice = (): ThemeChoice | null => {
    try {
        const value = localStorage.getItem(THEME_KEY);
        return isChoice(value) ? value : 'system';
    } catch {
        return null;
    }
};

/**
 * The choice this page shows. Where the browser refuses to save it, it is held here alone, so it
 * holds on this page until the page is left, and storage is not read over it.
 */
let chosen: ThemeChoice | undefined;
let heldHere = false;
const current = (): ThemeChoice => (chosen ??= savedChoice() ?? 'system');

/** Every switch attached on the page, each shown again when the choice changes. */
const switches = new Set<() => void>();
const showAll = () => {
    for (const show of switches) show();
};

/** Draws a choice on the page, the system's theme for System. */
const draw = (choice: ThemeChoice) => {
    document.documentElement.setAttribute(
        'data-theme',
        choice === 'system' ? systemTheme() : choice
    );
};

/** Saves a choice where the browser allows it, shows it on every switch, and draws it. */
export const chooseTheme = (choice: ThemeChoice): void => {
    chosen = choice;
    try {
        localStorage.setItem(THEME_KEY, choice);
        heldHere = false;
    } catch {
        heldHere = true;
    }
    showAll();
    draw(choice);
};

/** Shows and draws what is saved, when the page may not have heard it saved. */
const catchUp = () => {
    const saved = savedChoice();
    if (saved === null || heldHere) return;
    chosen = saved;
    showAll();
    draw(saved);
};

/**
 * The page's own listeners, set once for every switch: a choice saved in another tab, a page the
 * browser brings back from its back and forward cache, where the theme script has drawn from
 * storage again so a choice held here is drawn after it, and a change of the system's scheme, after
 * which a choice held here is drawn again over the system's.
 */
let listening = false;
const listen = () => {
    if (listening) return;
    listening = true;
    // Once every switch is taken away, the theme script alone draws the theme, and the choice is
    // read again from storage when a switch next comes, unless the page holds one of its own.
    const forget = () => {
        if (!heldHere) chosen = undefined;
    };
    window.addEventListener('storage', (event) => {
        if (event.key !== null && event.key !== THEME_KEY) return;
        if (switches.size > 0) catchUp();
        else forget();
    });
    window.addEventListener('pageshow', (event) => {
        if (!event.persisted) return;
        if (switches.size === 0) forget();
        else if (heldHere) draw(current());
        else catchUp();
    });
    const system = scheme();
    if (typeof system?.addEventListener === 'function') {
        system.addEventListener('change', () => {
            if (switches.size > 0) draw(current());
        });
    }
};

/**
 * Each control attached, by its element, one map for each kind so neither answers for the
 * other.
 */
const attachedSwitches = new WeakMap<HTMLElement, () => void>();
const attachedButtons = new WeakMap<HTMLElement, () => void>();

/**
 * Makes a theme switch work: checks the choice the page shows, shows the switch, and saves and
 * draws a choice when a visitor makes one. It takes the switch, or an element that holds it.
 * Attaching one switch again before it is taken away attaches it once, and taking it away hides
 * it again.
 *
 * Where the sheet collapses the switch to its name and one button, in a demo's strip on a screen
 * narrower than 20rem, the button names the choice shown and opens the choices under itself, with
 * focus on the chosen one so the arrow keys move the choice without closing them. They close, with
 * focus back on the button, when a choice is picked by a pointer or on Escape, and close where they
 * are when focus leaves the switch, as it does on a press anywhere else. The button is wired on
 * every switch, since the sheet alone decides where it shows.
 */
export const attachThemeSwitch = (element: HTMLElement): (() => void) => {
    const group = element.matches('.dk-theme-switch')
        ? element
        : (element.querySelector<HTMLElement>('.dk-theme-switch') ?? element);
    const already = attachedSwitches.get(group);
    if (already) return already;
    const radios = [...group.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
    const button = group.querySelector<HTMLButtonElement>('.dk-theme-switch-button');
    const choices = group.querySelector<HTMLElement>('.dk-theme-switch-choices');
    const show = () => {
        const choice = current();
        for (const radio of radios) radio.checked = radio.value === choice;
        // The button says the chosen word as the switch writes it, so a switch worded by hand is
        // named in its own words.
        const word = radios.find((radio) => radio.checked)?.nextElementSibling?.textContent;
        if (button && word) button.textContent = word;
    };
    const onChange = (event: Event) => {
        const { value } = event.target as HTMLInputElement;
        if (isChoice(value)) chooseTheme(value);
    };
    const isOpen = () => button?.getAttribute('aria-expanded') === 'true';
    /*
     * A press on the button or on the choices moves no focus, since its default is canceled as it
     * begins, so a browser that gives a pressed button no focus blurs nothing and a press on the
     * list's own padding leaves focus on the chosen radio, and the click that follows still runs.
     * So focus leaving the switch is the one path that closes the choices where they are, with a
     * press anywhere else, which the page is listened to for only while they are open. A press
     * that started on a choice picks by pointer, and a key pressed after it leaves no such press
     * set, so a later pick by key is a pick by key.
     */
    let pointed = false;
    const onPointerDown = (event: Event) => {
        const target = event.target as Node;
        pointed = choices?.contains(target) ?? false;
        if (pointed || (button?.contains(target) ?? false)) event.preventDefault();
        else close(false);
    };
    const onDocumentPointerDown = (event: Event) => {
        if (!group.contains(event.target as Node)) close(false);
    };
    const open = () => {
        button?.setAttribute('aria-expanded', 'true');
        document.addEventListener('pointerdown', onDocumentPointerDown);
        (radios.find((radio) => radio.checked) ?? radios[0])?.focus();
    };
    const close = (back: boolean) => {
        if (!isOpen()) return;
        button?.setAttribute('aria-expanded', 'false');
        document.removeEventListener('pointerdown', onDocumentPointerDown);
        pointed = false;
        if (back) button?.focus();
    };
    const onButtonClick = () => {
        if (isOpen()) close(true);
        else open();
    };
    const onChoicesClick = (event: Event) => {
        // A click on the list's own padding picks nothing, so it leaves the choices open.
        const picked = (event.target as Element).closest('.dk-theme-switch-choice') !== null;
        if (pointed && picked) close(true);
        pointed = false;
    };
    const onKeyDown = (event: KeyboardEvent) => {
        pointed = false;
        if (event.key !== 'Escape' || !isOpen()) return;
        event.preventDefault();
        close(true);
    };
    const onFocusOut = (event: FocusEvent) => {
        if (!group.contains(event.relatedTarget as Node | null)) close(false);
    };
    for (const radio of radios) radio.addEventListener('change', onChange);
    button?.addEventListener('click', onButtonClick);
    choices?.addEventListener('click', onChoicesClick);
    group.addEventListener('pointerdown', onPointerDown);
    group.addEventListener('keydown', onKeyDown);
    group.addEventListener('focusout', onFocusOut);
    switches.add(show);
    listen();
    show();
    // Drawn as the switch shows it, so the two agree when a choice was held while no switch was.
    draw(current());
    group.hidden = false;
    const detach = () => {
        for (const radio of radios) radio.removeEventListener('change', onChange);
        button?.removeEventListener('click', onButtonClick);
        choices?.removeEventListener('click', onChoicesClick);
        group.removeEventListener('pointerdown', onPointerDown);
        group.removeEventListener('keydown', onKeyDown);
        group.removeEventListener('focusout', onFocusOut);
        // Closing takes the page's listener away with it.
        close(false);
        switches.delete(show);
        group.hidden = true;
        attachedSwitches.delete(group);
    };
    attachedSwitches.set(group, detach);
    return detach;
};

/** How long a copy button says what it did before it says Copy again, in milliseconds. */
const SAID_FOR = 2000;

/** Each status line's timer, so one message never empties the next and a second is heard too. */
const statusTimers = new WeakMap<HTMLElement, number>();
const say = (status: HTMLElement, message: string) => {
    window.clearTimeout(statusTimers.get(status));
    status.textContent = '';
    statusTimers.set(
        status,
        window.setTimeout(() => {
            status.textContent = message;
            statusTimers.set(
                status,
                window.setTimeout(() => {
                    status.textContent = '';
                }, SAID_FOR)
            );
        }, 100)
    );
};

/** Selects all of an element's text, for a visitor to copy with their own keys. */
const select = (element: HTMLElement) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
};

/** How to copy what is selected, in a keyboard's keys where a pointer can hover, else in words. */
const howToCopy = () => {
    try {
        if (window.matchMedia('(any-hover: hover)').matches) {
            return 'Selected. Press Control and C, or Command and C on a Mac, to copy.';
        }
    } catch {
        return "Selected. Copy it with your keys or your device's copy command.";
    }
    return "Selected. Copy it with your device's copy command.";
};

const copied = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
};

/**
 * Makes a copy button work: copies the text of the element `source` gives when it is pressed, or
 * selects it where the browser refuses the clipboard, shows Copied or Selected for a moment, and
 * says which on the page's status line. `source` is read at each press, so a button beside tabs
 * copies the block its tab shows.
 */
export const attachCopyButton = (
    button: HTMLButtonElement,
    { source, status }: { readonly source: () => HTMLElement; readonly status: HTMLElement }
): (() => void) => {
    const already = attachedButtons.get(button);
    if (already) return already;
    const words = [...button.querySelectorAll<HTMLElement>('.dk-copy-words > *')];
    let timer = 0;
    let live = true;
    const showWord = (index: number) => {
        words.forEach((word, at) => {
            if (at === index) word.removeAttribute('aria-hidden');
            else word.setAttribute('aria-hidden', 'true');
        });
    };
    const onClick = () => {
        const pressed = source();
        void copied(pressed.textContent).then((done) => {
            if (!live) return;
            // A source changed while the clipboard answered is not selected, and the button is left
            // as the change left it, but the status line still says what happened.
            if (source() !== pressed) {
                say(status, done ? 'Copied.' : 'Not copied. Press Copy again.');
                return;
            }
            if (!done) select(pressed);
            showWord(done ? 1 : 2);
            say(status, done ? 'Copied.' : howToCopy());
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                showWord(0);
            }, SAID_FOR);
        });
    };
    button.addEventListener('click', onClick);
    button.hidden = false;
    const detach = () => {
        live = false;
        button.removeEventListener('click', onClick);
        window.clearTimeout(timer);
        showWord(0);
        button.hidden = true;
        attachedButtons.delete(button);
    };
    attachedButtons.set(button, detach);
    return detach;
};
