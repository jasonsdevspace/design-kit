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
    window.addEventListener('storage', (event) => {
        if (event.key === null || event.key === THEME_KEY) catchUp();
    });
    window.addEventListener('pageshow', (event) => {
        if (!event.persisted) return;
        if (heldHere) draw(current());
        else catchUp();
    });
    const system = scheme();
    if (typeof system?.addEventListener === 'function') {
        system.addEventListener('change', () => {
            draw(current());
        });
    }
};

const attached = new WeakMap<HTMLElement, () => void>();

/**
 * Makes a theme switch work: checks the choice the page shows, shows the switch, and saves and draws
 * a choice when a visitor makes one. Attaching one switch twice, as React does in development,
 * attaches it once.
 */
export const attachThemeSwitch = (group: HTMLElement): (() => void) => {
    const already = attached.get(group);
    if (already) return already;
    const radios = [...group.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
    const show = () => {
        const choice = current();
        for (const radio of radios) radio.checked = radio.value === choice;
    };
    const onChange = (event: Event) => {
        const { value } = event.target as HTMLInputElement;
        if (isChoice(value)) chooseTheme(value);
    };
    for (const radio of radios) radio.addEventListener('change', onChange);
    switches.add(show);
    listen();
    show();
    group.hidden = false;
    const detach = () => {
        for (const radio of radios) radio.removeEventListener('change', onChange);
        switches.delete(show);
        attached.delete(group);
    };
    attached.set(group, detach);
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
const howToCopy = () =>
    window.matchMedia('(any-hover: hover)').matches
        ? 'Selected. Press Control and C, or Command and C on a Mac, to copy.'
        : "Selected. Copy it with your device's copy command.";

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
    const already = attached.get(button);
    if (already) return already;
    const words = [...button.querySelectorAll<HTMLElement>('.dk-copy-words > *')];
    let timer = 0;
    const showWord = (index: number) => {
        words.forEach((word, at) => {
            if (at === index) word.removeAttribute('aria-hidden');
            else word.setAttribute('aria-hidden', 'true');
        });
    };
    const onClick = () => {
        const pressed = source();
        void copied(pressed.textContent).then((done) => {
            // A source changed while the clipboard answered is not selected, and the button is left
            // as the change left it.
            if (source() !== pressed) {
                if (done) say(status, 'Copied.');
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
        button.removeEventListener('click', onClick);
        window.clearTimeout(timer);
        attached.delete(button);
    };
    attached.set(button, detach);
    return detach;
};
