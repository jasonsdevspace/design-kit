import { THEME_CHOICES, THEME_KEY, type ThemeChoice } from './theme.js';

/*
 * What the kit's theme switch, copy button, stepper, toast and dialog do, for a page to attach to
 * the markup the components draw or a page writes by hand. Each attach function finds its control's
 * parts by their classes. The switch, the copy button and the stepper show their control, which the
 * markup keeps hidden so a visitor without script meets no control that does nothing, and return a
 * function that takes it away again. `attachToast` returns instead the function that shows a
 * message in it, and `attachDialog` the function that opens it. Nothing runs when the module is
 * imported, and nothing here sets a style, so a page's policy can refuse every style it did not
 * serve.
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

/**
 * Each status line's timer, so one message never empties the next and a second is heard too. A
 * message is put in a moment after the line is emptied, so the same words twice are heard twice,
 * and leaves after a while unless it is kept, as a toast keeps its own until the toast leaves.
 */
const statusTimers = new WeakMap<HTMLElement, number>();
const say = (status: HTMLElement, message: string, keep = false) => {
    window.clearTimeout(statusTimers.get(status));
    status.textContent = '';
    statusTimers.set(
        status,
        window.setTimeout(() => {
            status.textContent = message;
            if (keep) return;
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

/** How long a toast with no action stays while nothing holds it, in milliseconds. */
const TOAST_FOR = 5000;

/** What a toast offers beside its message: the action's words, and what choosing it does. */
export type ToastAction = { readonly label: string; readonly onAction: () => void };

/** Shows a message in a toast, with one action or none, and returns what dismisses that message. */
export type ShowToast = (message: string, action?: ToastAction) => () => void;

const attachedToasts = new WeakMap<HTMLElement, ShowToast>();

/**
 * Makes a toast work, and returns the function that shows a message in it. The message is drawn in
 * the toast and said on its status line, which is on the page from the start, so a screen reader
 * hears it without focus moving, with the action's name when it has one, so a visitor who cannot
 * see it learns there is a way back. The line keeps it until the toast leaves, and is what a screen
 * reader reads in the toast, since the words drawn are hidden from it. The same words shown twice
 * are heard twice.
 *
 * A toast leaves when its close button, its action or Escape with focus in it dismisses it, or the
 * next message replaces it. One with an action stays until then, since a timer would take the
 * action away from anyone slower than it. One with no action also leaves after five seconds, a wait
 * held while the pointer is over it or focus is in it. When a toast leaves with focus in it, focus
 * goes back to where it was the last time a message arrived while focus was outside the toast.
 * Attaching a toast again returns the same function. Its listeners are on the toast's own
 * elements, so a toast taken from the page takes them with it.
 */
export const attachToast = (element: HTMLElement): ShowToast => {
    const already = attachedToasts.get(element);
    if (already) return already;
    const part = <T extends HTMLElement>(name: string) => {
        const found = element.querySelector<T>(`.dk-toast-${name}`);
        if (!found) throw new Error(`a toast needs its ${name}`);
        return found;
    };
    const message = part('message');
    const status = part('status');
    const actionButton = part<HTMLButtonElement>('action');
    const close = part<HTMLButtonElement>('close');
    let timer = 0;
    // Each message's number, which only grows, so what dismisses one never dismisses a later one.
    let count = 0;
    let shown = 0;
    let hovered = false;
    let focused = false;
    let onAction: (() => void) | undefined;
    let returnTo: HTMLElement | undefined;
    const wait = () => {
        window.clearTimeout(timer);
        if (shown && !onAction && !hovered && !focused) {
            timer = window.setTimeout(dismiss, TOAST_FOR);
        }
    };
    const dismiss = () => {
        window.clearTimeout(timer);
        const hadFocus = element.contains(document.activeElement);
        shown = 0;
        focused = false;
        onAction = undefined;
        message.textContent = '';
        actionButton.textContent = '';
        actionButton.hidden = true;
        close.hidden = true;
        element.classList.remove('dk-toast-shown');
        window.clearTimeout(statusTimers.get(status));
        status.textContent = '';
        if (hadFocus && returnTo?.isConnected) returnTo.focus();
    };
    const show: ShowToast = (words, action) => {
        const active = document.activeElement;
        if (active instanceof HTMLElement && !element.contains(active)) returnTo = active;
        const id = (shown = count += 1);
        message.textContent = words;
        say(status, action ? `${words} ${action.label} is available.` : words, true);
        // Focus on an action that this message does not have moves to the close button.
        if (!action && document.activeElement === actionButton) close.focus();
        onAction = action?.onAction;
        actionButton.textContent = action?.label ?? '';
        actionButton.hidden = !action;
        close.hidden = false;
        element.classList.add('dk-toast-shown');
        wait();
        return () => {
            if (shown === id) dismiss();
        };
    };
    actionButton.addEventListener('click', () => {
        const chosen = onAction;
        dismiss();
        chosen?.();
    });
    close.addEventListener('click', dismiss);
    element.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && shown) dismiss();
    });
    // A pointer that rests where a toast was keeps holding the next one, until it moves away.
    element.addEventListener('pointerenter', () => {
        hovered = true;
        wait();
    });
    element.addEventListener('pointerleave', () => {
        hovered = false;
        wait();
    });
    element.addEventListener('focusin', () => {
        focused = true;
        wait();
    });
    element.addEventListener('focusout', (event) => {
        focused = event.relatedTarget instanceof Node && element.contains(event.relatedTarget);
        wait();
    });
    attachedToasts.set(element, show);
    return show;
};

const attachedSteppers = new WeakMap<HTMLElement, () => void>();

/**
 * Makes a stepper work: shows its two buttons, which the markup keeps hidden so a visitor without
 * script meets the number field alone, and steps the value by the field's step when one is
 * pressed. A press that changes the value fires the input and change events a typed value fires,
 * and says the new value on the stepper's status line, since focus stays on the button. A button
 * that would pass the field's least or greatest value is marked off, aria-disabled so focus stays
 * on it, as both are on a field that is disabled or read only, and a press of an off button does
 * nothing. Each is read again as a press lands, so a value a script or a form's reset set is
 * followed. A typed value the field refuses, or none at all, shows the stepper's own error once the
 * value is changed and says it on the status line, and the error is cleared as soon as the value is
 * right again. Only the error's own id and the invalid state it set are added and taken away, so a
 * hint or an error the page draws keeps its place. It takes the stepper's field or the stepper,
 * attaches each stepper once whichever it is given, and returns what takes it away again.
 */
export const attachStepper = (element: HTMLElement): (() => void) => {
    const field = element.closest<HTMLElement>('.dk-field') ?? element;
    const stepper = element.matches('.dk-stepper')
        ? element
        : (field.querySelector<HTMLElement>('.dk-stepper') ?? element);
    const already = attachedSteppers.get(stepper);
    if (already) return already;
    const input = field.querySelector<HTMLInputElement>('.dk-stepper-value');
    const down = field.querySelector<HTMLButtonElement>('.dk-stepper-down');
    const up = field.querySelector<HTMLButtonElement>('.dk-stepper-up');
    if (!input || !down || !up) throw new Error('a stepper needs its value and its two buttons');
    const range = field.querySelector<HTMLElement>('.dk-stepper-range');
    const status = field.querySelector<HTMLElement>('.dk-stepper-status');
    const limit = (value: string, fallback: number) => (value === '' ? fallback : Number(value));
    const locked = () => input.disabled || input.readOnly;
    const off = (button: HTMLButtonElement, stop: boolean) => {
        if (stop) button.setAttribute('aria-disabled', 'true');
        else button.removeAttribute('aria-disabled');
    };
    const mark = () => {
        const value = input.valueAsNumber;
        const known = !Number.isNaN(value);
        off(down, locked() || (known && value <= limit(input.min, -Infinity)));
        off(up, locked() || (known && value >= limit(input.max, Infinity)));
    };
    let setInvalid = false;
    const report = (wrong: boolean) => {
        if (!range) return;
        range.hidden = !wrong;
        const ids = (input.getAttribute('aria-describedby') ?? '')
            .split(/\s+/)
            .filter((id) => id !== '' && id !== range.id);
        if (wrong) ids.push(range.id);
        if (ids.length > 0) input.setAttribute('aria-describedby', ids.join(' '));
        else input.removeAttribute('aria-describedby');
        const pageError = [...field.querySelectorAll<HTMLElement>('.dk-field-error')].some(
            (error) => error !== range && !error.hidden
        );
        if (wrong && input.getAttribute('aria-invalid') !== 'true') {
            input.setAttribute('aria-invalid', 'true');
            setInvalid = true;
        } else if (!wrong && setInvalid && !pageError) {
            input.removeAttribute('aria-invalid');
            setInvalid = false;
        }
    };
    const wrong = () => input.value === '' || !input.validity.valid;
    const press = (raise: boolean) => () => {
        mark();
        const button = raise ? up : down;
        if (button.getAttribute('aria-disabled') === 'true') return;
        const before = input.value;
        try {
            if (raise) input.stepUp();
            else input.stepDown();
        } catch {
            // A field whose step is any has nothing to step by.
            return;
        }
        if (input.value === before) return;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        if (status) say(status, input.value, true);
    };
    const lower = press(false);
    const raise = press(true);
    const onInput = () => {
        mark();
        if (!wrong()) report(false);
    };
    const onChange = () => {
        const bad = wrong();
        report(bad);
        if (bad && status && range) say(status, range.textContent, true);
    };
    const onReset = () => {
        window.setTimeout(() => {
            mark();
            report(false);
        });
    };
    down.addEventListener('click', lower);
    up.addEventListener('click', raise);
    input.addEventListener('input', onInput);
    input.addEventListener('change', onChange);
    stepper.addEventListener('focusin', mark);
    input.form?.addEventListener('reset', onReset);
    mark();
    down.hidden = false;
    up.hidden = false;
    const detach = () => {
        down.removeEventListener('click', lower);
        up.removeEventListener('click', raise);
        input.removeEventListener('input', onInput);
        input.removeEventListener('change', onChange);
        stepper.removeEventListener('focusin', mark);
        input.form?.removeEventListener('reset', onReset);
        report(false);
        down.hidden = true;
        up.hidden = true;
        attachedSteppers.delete(stepper);
    };
    attachedSteppers.set(stepper, detach);
    return detach;
};

/**
 * What a page hands the function that opens a dialog, to say where focus goes back to: the element
 * itself, or the event, a page's own or React's, whose press opened it.
 */
export type DialogOpener =
    Element | { readonly target: EventTarget | null; readonly currentTarget?: EventTarget | null };

/** Opens a dialog as a modal, over the page, remembering where focus goes back to on close. */
export type OpenDialog = (from?: DialogOpener) => void;

/** How a dialog is attached. */
export type DialogOptions = {
    /**
     * Stays open on Escape, a phone's Back and a tap on the scrim, for a dialog that must be
     * answered.
     */
    readonly stay?: boolean | undefined;
    /** Where focus goes when what opened the dialog is no longer on the page. */
    readonly returnTo?: (() => HTMLElement | null) | undefined;
};

const attachedDialogs = new WeakMap<
    HTMLDialogElement,
    { readonly open: OpenDialog; readonly set: (options: DialogOptions) => void }
>();

/** What a press can land on that takes focus, so a press inside a button finds the button. */
const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex]';

/** The element focus goes back to, from what the page handed over, else what had focus. */
const openerOf = (from: DialogOpener | undefined): Element | null => {
    if (from instanceof Element) return from;
    if (from) {
        const target = from.target instanceof Element ? from.target.closest(FOCUSABLE) : null;
        if (target) return target;
        if (from.currentTarget instanceof Element) return from.currentTarget;
    }
    return document.activeElement;
};

/**
 * Makes a dialog do what the native element does not do alone, and returns the function that opens
 * it. The element holds focus inside, closes on Escape and makes the page behind it inert. This
 * closes it on a tap on the scrim around it, one that starts and ends there so a drag out of the
 * dialog closes nothing, and on close returns focus to what opened it. That is the element the
 * press that opened it landed on, found from the event a page's listener or React's hands over,
 * since a browser that gives a pressed button no focus leaves nothing else, or else what had
 * focus. Where that is gone from the page, focus goes where `returnTo` says.
 *
 * A dialog that must be answered is attached to stay, and then stays open on Escape, a phone's Back
 * and the scrim, by the closedby attribute where the browser reads it, since one that limits how
 * often a page may refuse a close does not hold a refusal past the first. Attaching it again sets
 * the options given and returns the same function. Its listeners are on the dialog, so a dialog
 * taken from the page takes them with it.
 */
export const attachDialog = (
    dialog: HTMLDialogElement,
    options: DialogOptions = {}
): OpenDialog => {
    const already = attachedDialogs.get(dialog);
    if (already) {
        already.set(options);
        return already.open;
    }
    let settings = options;
    const set = (next: DialogOptions) => {
        settings = next;
        if (settings.stay === true) dialog.setAttribute('closedby', 'none');
        else dialog.removeAttribute('closedby');
    };
    set(options);
    let opener: Element | null = null;
    let startedOutside = false;
    const outside = (event: MouseEvent) => {
        if (event.target !== dialog) return false;
        const box = dialog.getBoundingClientRect();
        return (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
        );
    };
    dialog.addEventListener('pointerdown', (event) => {
        startedOutside = outside(event);
    });
    dialog.addEventListener('click', (event) => {
        if (settings.stay !== true && startedOutside && outside(event)) dialog.close();
        startedOutside = false;
    });
    dialog.addEventListener('cancel', (event) => {
        if (settings.stay === true) event.preventDefault();
    });
    dialog.addEventListener('close', () => {
        // The browser fires close a moment after the dialog closes, so one that arrives once the
        // dialog is open again belongs to an earlier closing and leaves this opening's opener be.
        if (dialog.open) return;
        const back =
            opener instanceof HTMLElement && opener.isConnected ? opener : settings.returnTo?.();
        back?.focus();
        opener = null;
    });
    const open: OpenDialog = (from) => {
        if (dialog.open) return;
        opener = openerOf(from);
        dialog.showModal();
    };
    attachedDialogs.set(dialog, { open, set });
    return open;
};
