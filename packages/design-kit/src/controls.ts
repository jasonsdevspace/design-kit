import { THEME_CHOICES, THEME_KEY, type ThemeChoice } from './theme.js';

/*
 * What the kit's theme switch, copy button, stepper, toast, dialog, panel, table and status line
 * do, for a page to attach to the markup the components draw or a page writes by hand. Each attach
 * function finds its control's parts by their classes, and `attachPanel` its panel by the id its
 * button names. The switch, the copy button and the stepper show their control, which the markup
 * keeps hidden so a visitor without script meets no control that does nothing, and return a
 * function that takes it away again, as the table's does. `attachToast` returns instead the
 * function that shows a message in it, `attachDialog` the function that opens it, `attachPanel`
 * the functions that open or close its panel and let its button go, and `attachStatus` the
 * function that says a message. Nothing runs when the module is imported, and nothing here sets a
 * style, so a page's policy can refuse every style it did not serve.
 */

const isChoice = (value: string | null): value is ThemeChoice =>
    THEME_CHOICES.some((choice) => choice === value);

/** What has focus, or null where nothing does and the page's body stands in for it. */
const focusedNow = (): Element | null => {
    const active = document.activeElement;
    return active === document.body ? null : active;
};

/** Whether a control is marked off, kept in the tab order to say why rather than to act. */
const isOff = (control: Element | undefined): boolean =>
    control?.getAttribute('aria-disabled') === 'true';

/**
 * Focuses the first of the elements given that takes focus, one that is hidden, off or gone from
 * the page being passed over, so focus never falls to nowhere while a place for it is named.
 */
const focusFirst = (...places: readonly (Element | null | undefined)[]): boolean => {
    for (const place of places) {
        if (!(place instanceof HTMLElement) || !place.isConnected || place === document.body)
            continue;
        place.focus({ preventScroll: place.matches('.dk-app-body') });
        if (document.activeElement === place) return true;
    }
    return false;
};

/** Where focus goes when nothing nearer takes it, the app frame's body or the main content. */
const homeOf = (element: Element): Element | null =>
    element.closest('.dk-app')?.querySelector('.dk-app-body') ?? document.querySelector('main');

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

/**
 * Saves a choice where the browser allows it, shows it on every switch, and draws it. It listens as
 * a switch does, so on a page with no switch a choice saved in another tab is followed and one the
 * browser will not save is held. A value that is not a choice, as plain JavaScript can pass, is
 * ignored.
 */
export const chooseTheme = (choice: ThemeChoice): void => {
    if (!isChoice(choice)) return;
    listen();
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
        // The theme script draws what the other tab saved, so a choice held here is drawn again.
        if (heldHere) draw(current());
        else if (switches.size > 0) catchUp();
        else forget();
    });
    window.addEventListener('pageshow', (event) => {
        if (!event.persisted) return;
        if (heldHere) draw(current());
        else if (switches.size === 0) forget();
        else catchUp();
    });
    const system = scheme();
    if (typeof system?.addEventListener === 'function') {
        system.addEventListener('change', () => {
            if (switches.size > 0 || heldHere) draw(current());
        });
    }
};

/**
 * Each control attached, by its element, one map for each kind so neither answers for the
 * other.
 */
const attachedSwitches = new WeakMap<HTMLElement, () => void>();
/** What a copy button reads, which attaching it again replaces. */
type CopyOptions = { readonly source: () => HTMLElement; readonly status: HTMLElement };
const attachedButtons = new WeakMap<
    HTMLElement,
    { readonly detach: () => void; readonly set: (next: CopyOptions) => void }
>();

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
 * are when focus leaves the switch or on a tap anywhere else, though not on a swipe, so a touch can
 * scroll to choices below the screen's edge. The button is wired on every switch, since the sheet
 * alone decides where it shows. A switch with no choices yet is left hidden and unattached.
 */
export const attachThemeSwitch = (element: HTMLElement): (() => void) => {
    const group = element.matches('.dk-theme-switch')
        ? element
        : (element.querySelector<HTMLElement>('.dk-theme-switch') ?? element);
    const already = attachedSwitches.get(group);
    if (already) return already;
    const radios = [...group.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
    // A switch with no choices yet is left hidden and unattached, so a page that attaches it before
    // its choices are drawn shows no empty control and can attach it again once they are.
    if (radios.length === 0) return () => undefined;
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
     * So the choices close where they are only when focus leaves the switch or on a tap anywhere
     * else, which the page is listened to for only while they are open. A press that started on a
     * choice picks by pointer, and a key pressed after it leaves no such press set, so a later pick
     * by key is a pick by key.
     */
    let pointed = false;
    // A press that began on the switch, which a pointer lifted outside it does not close.
    let pressedHere = false;
    /** Closes the choices where they are, and keeps focus on the switch if it was in them. */
    const closeHere = () => {
        const held = group.contains(document.activeElement);
        close(false);
        if (held) button?.focus({ preventScroll: true });
    };
    const onPointerDown = (event: Event) => {
        const target = event.target as Node;
        pressedHere = true;
        pointed = choices?.contains(target) ?? false;
        if (pointed || (button?.contains(target) ?? false)) event.preventDefault();
        else closeHere();
    };
    // A tap outside closes the choices, heard as its pointer is lifted, before any of the page's
    // own handlers can stop it, and on a control that is off. A swipe, which the browser takes for
    // a scroll and cancels rather than lifts, leaves them open, so a touch can scroll down to
    // choices below the screen's edge.
    const onDocumentLift = (event: Event) => {
        const fromHere = pressedHere;
        pressedHere = false;
        if (!fromHere && !group.contains(event.target as Node)) closeHere();
    };
    const open = () => {
        button?.setAttribute('aria-expanded', 'true');
        // The press that opened them was lifted before the page was listened to.
        pressedHere = false;
        document.addEventListener('pointerup', onDocumentLift, true);
        (radios.find((radio) => radio.checked) ?? radios[0])?.focus();
    };
    const close = (back: boolean) => {
        if (!isOpen()) return;
        button?.setAttribute('aria-expanded', 'false');
        document.removeEventListener('pointerup', onDocumentLift, true);
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
    // One signal takes away together every listener the switch puts on its own elements.
    const listening = new AbortController();
    const { signal } = listening;
    for (const radio of radios) radio.addEventListener('change', onChange, { signal });
    button?.addEventListener('click', onButtonClick, { signal });
    choices?.addEventListener('click', onChoicesClick, { signal });
    group.addEventListener('pointerdown', onPointerDown, { signal });
    group.addEventListener('keydown', onKeyDown, { signal });
    group.addEventListener('focusout', onFocusOut, { signal });
    switches.add(show);
    listen();
    show();
    // Drawn as the switch shows it, so the two agree when a choice was held while no switch was.
    draw(current());
    group.hidden = false;
    const detach = () => {
        listening.abort();
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
/** Each status line's words waiting to settle, apart from the timer of words already said. */
const settleTimers = new WeakMap<HTMLElement, number>();
/** Empties a status line, and drops what it was about to say, words waiting to settle among them. */
const hush = (status: HTMLElement) => {
    window.clearTimeout(statusTimers.get(status));
    window.clearTimeout(settleTimers.get(status));
    status.textContent = '';
};

/**
 * Says a message on a status line. A message given as a function is read as it is put in, after the
 * moment's wait, so words a page draws from its own state follow the change that prompted them, and
 * one that gives nothing by then is not said.
 */
const say = (status: HTMLElement, message: string | (() => string | null), keep = false) => {
    hush(status);
    statusTimers.set(
        status,
        window.setTimeout(() => {
            const words = typeof message === 'string' ? message : message();
            // A message that is no longer wanted by the time it would be said is left unsaid.
            if (words === null) return;
            status.textContent = words;
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

/** How a message is said on a status line. */
export type SayOptions = {
    /**
     * How long, in milliseconds, the words wait to stop changing before they are said, for words
     * that change with each press, such as a count still to enter. Words said again within it take
     * the place of those not yet said, and only the last is said.
     */
    readonly settle?: number | undefined;
};

/** Says a message on a status line, at once or once its words stop changing. */
export type Say = (message: string, options?: SayOptions) => void;

const attachedLines = new WeakMap<HTMLElement, Say>();

/**
 * Returns the function that says a message on a status line, which a page draws out of sight and
 * puts on the page from the start, so a screen reader hears each message without focus moving. A
 * message is put in a moment after the line is emptied, so the same words said twice are heard
 * twice, and leaves after a while, so reading by line finds no old words. A message is said at once
 * unless it asks to settle, when it waits that long for its words to stop changing, and words said
 * again in the meantime take its place. Any message said on the line drops one still waiting, so
 * the last words said are the ones heard. A screen keeps a line of its own for this, as a toast and
 * a stepper keep theirs. It speaks through the same function as the copy button and the stepper, so
 * a line handed to a copy button too keeps one timer, and a later message replaces an earlier one.
 * Attached again, a line returns the function it returned first.
 */
export const attachStatus = (line: HTMLElement): Say => {
    const already = attachedLines.get(line);
    if (already) return already;
    const speak: Say = (message, { settle = 0 } = {}) => {
        if (settle <= 0) {
            say(line, message);
            return;
        }
        // Waits on a timer of its own, so words already said are still put in and leave as ever,
        // and any message said in the meantime drops these.
        window.clearTimeout(settleTimers.get(line));
        settleTimers.set(
            line,
            window.setTimeout(() => {
                say(line, message);
            }, settle)
        );
    };
    attachedLines.set(line, speak);
    return speak;
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
 * copies the block its tab shows. Attaching it again takes the new `source` and `status`, so a page
 * that draws the button again with a new source copies from that one, puts a word shown for the
 * last source back to Copy, and returns what it returned the first time.
 */
export const attachCopyButton = (button: HTMLButtonElement, options: CopyOptions): (() => void) => {
    const already = attachedButtons.get(button);
    if (already) {
        already.set(options);
        return already.detach;
    }
    let { source, status } = options;
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
    // A word shown for the last source is put back to Copy, so it never claims the new one copied.
    const set = (next: CopyOptions) => {
        ({ source, status } = next);
        window.clearTimeout(timer);
        showWord(0);
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
    attachedButtons.set(button, { detach, set });
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
 * Marks a shown toast with the rows it takes, its content's height over the target's length, which
 * the sheet's room counts by, from one to five, so the sheet keeps that much room for it. In an
 * app's frame whose body would keep less than a row and a half above that room, it also marks the
 * toast to take its row above the dock, and scrolls the page by as much as the dock moved, so the
 * dock stays under the thumb. Both are attributes rather than styles, so a page's policy may refuse
 * every style it did not serve. A toast in a container out of sight, which has no size, is left
 * unmarked until it is measured again.
 */
const measureToast = (element: HTMLElement, close: HTMLElement) => {
    const target = parseFloat(getComputedStyle(close).minWidth);
    const dock = element.closest('.dk-app')?.querySelector('.dk-app-dock');
    const before = dock?.getBoundingClientRect().top ?? 0;
    delete element.dataset['row'];
    if (!target || !element.clientHeight) {
        delete element.dataset['rows'];
        return;
    }
    const edges = getComputedStyle(element);
    const held =
        element.clientHeight - parseFloat(edges.paddingTop) - parseFloat(edges.paddingBottom);
    element.dataset['rows'] = String(Math.min(5, Math.max(1, Math.ceil(held / target - 0.02))));
    const body = element.closest('.dk-app')?.querySelector('.dk-app-body');
    if (!body) return;
    const room = body.clientHeight - parseFloat(getComputedStyle(body).scrollPaddingBottom);
    if (room >= 1.5 * target) return;
    element.dataset['row'] = '';
    window.scrollBy(0, (dock?.getBoundingClientRect().top ?? 0) - before);
};

/**
 * Makes a toast work, and returns the function that shows a message in it. The message is drawn in
 * the toast and said on its status line, which is on the page from the start, so a screen reader
 * hears it without focus moving, with the action's name when it has one, so a visitor who cannot
 * see it learns there is a way back. The line keeps it until the toast leaves, and is what a screen
 * reader reads in the toast, since the words drawn are hidden from it. The same words shown twice
 * are heard twice. A shown toast is marked by its data-shown attribute, which a page that draws it
 * again, as React does with its class, leaves alone. The dk-toast-shown class is set beside it for
 * a page that reads it, though such a redraw takes the class away while the toast stays shown.
 *
 * A toast leaves when its close button, its action or Escape with focus in it dismisses it, or the
 * next message replaces it. One with an action stays until then, since a timer would take the
 * action away from anyone slower than it. One with no action also leaves after five seconds, a wait
 * held while the pointer is over it or focus is in it. When a toast leaves with focus in it, focus
 * goes back to the last control outside the toast that had focus when a message arrived, and where
 * there was none, or it no longer takes focus, to the body of the app's frame, or on a page with no
 * frame to its main content. Its Close and its action take a tabindex of 0 where the page set none,
 * so Safari, which focuses a pressed button only where it has one, leaves focus in the toast on a
 * press or a tap and focus can go back as it leaves. Attaching a toast again returns the same
 * function. Its listeners are
 * on the toast's own elements, so a toast taken from the page takes them with it.
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
    // Safari focuses a pressed button only where it has a tabindex, so a press of either button
    // leaves focus in the toast and it goes back as the toast hides. A page's own is kept.
    for (const button of [actionButton, close])
        if (!button.hasAttribute('tabindex')) button.tabIndex = 0;
    // While a message is shown, the toast is measured again whenever its size or the screen's
    // changes, a turned phone or a new text size among them, so its room never goes stale.
    const remeasure = () => {
        measureToast(element, close);
    };
    const watch = new ResizeObserver(remeasure);
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
        delete element.dataset['shown'];
        watch.disconnect();
        window.removeEventListener('resize', remeasure);
        delete element.dataset['rows'];
        delete element.dataset['row'];
        hush(status);
        // Focus that was in the toast goes back where it came from, and where nothing had focus or
        // that no longer takes it, to the body of the app's frame or the page's main content rather
        // than to nowhere.
        if (hadFocus) focusFirst(returnTo, homeOf(element));
    };
    const show: ShowToast = (words, action) => {
        const active = focusedNow();
        if (!active || !element.contains(active))
            returnTo = active instanceof HTMLElement ? active : undefined;
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
        element.dataset['shown'] = '';
        measureToast(element, close);
        watch.observe(element);
        window.addEventListener('resize', remeasure);
        // A control that had focus and that the toast now covers is scrolled clear of it, by the
        // scroll padding the sheet keeps under a shown toast. One the toast leaves alone, or one
        // taller than the room above the toast, such as the frame's body, stays where it is.
        if (returnTo === active) {
            const control = returnTo.getBoundingClientRect();
            const card = element.getBoundingClientRect();
            if (control.bottom > card.top && control.top < card.bottom && control.height < card.top)
                returnTo.scrollIntoView({ block: 'nearest' });
        }
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

/** How a stepper is attached. */
export type StepperOptions = {
    /**
     * A status line to say each press on, such as the page's own, in place of the stepper's line,
     * so a page that says something after a press has one line and not two.
     */
    readonly status?: HTMLElement | null;
    /**
     * Words to say after the value, read as the message is put on the line, a moment after the
     * press, so a page's own state has caught up with it.
     */
    readonly words?: ((value: string) => string) | null;
};

const attachedSteppers = new WeakMap<
    HTMLElement,
    { readonly detach: () => void; readonly set: (next: StepperOptions) => void }
>();

/**
 * A field's description with a stepper's own parts in their place: the error while it shows, which
 * names the range itself, or else the range in words when there are some, after the page's own.
 */
const describedBy = (
    before: string,
    range: HTMLElement | null,
    limits: HTMLElement | null,
    shown: boolean
): string => {
    const ids = before
        .split(/\s+/)
        .filter((id) => id !== '' && id !== range?.id && id !== limits?.id);
    if (shown && range) ids.push(range.id);
    else if (limits?.id && limits.textContent !== '') ids.push(limits.id);
    return ids.join(' ');
};

/** What a press says: the value, that it is a limit where it is one, and a page's words after it. */
const pressWords = (
    input: HTMLInputElement,
    least: number,
    most: number,
    words: StepperOptions['words']
): string => {
    const { value } = input;
    const at = input.valueAsNumber;
    const low = at <= least;
    const high = at >= most;
    const said = low && !high ? `${value}, the least` : high && !low ? `${value}, the most` : value;
    const more = words?.(value) ?? '';
    return more === '' ? said : `${said}. ${more}`;
};

/**
 * The greatest value a press can reach: the greatest value itself, or the last step under it where
 * the step does not land on it, such as 9 from 1 by 2 under 10.
 */
const topOf = (least: number, most: number, step: string): number => {
    const by = step === '' ? 1 : Number(step);
    if (!Number.isFinite(most) || !(by > 0)) return most;
    const base = Number.isFinite(least) ? least : 0;
    return base + Math.floor((most - base) / by) * by;
};

/** The words a stepper's range is described by, or nothing when it has no limit. */
const rangeWords = (least: number, most: number): string => {
    const low = Number.isFinite(least);
    const high = Number.isFinite(most);
    if (low && high)
        return least === most
            ? `Only ${String(least)}.`
            : `From ${String(least)} to ${String(most)}.`;
    if (low) return `${String(least)} or more.`;
    if (high) return `Up to ${String(most)}.`;
    return '';
};

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
 * hint or an error the page draws keeps its place, and a shown error is put back whenever a page
 * that draws the field again, as React does, rewrites its description or its invalid mark. The
 * field is described by its range in words, after the page's own description, and while the error
 * is shown by the error alone, which names the range itself. A press that lands on a limit says so
 * with the value, and a page's words, given as an option, are said after it in the same message,
 * on the page's status line when one is given. It takes the stepper's field or the stepper,
 * attaches each stepper once whichever it is given, takes options given again in place of the
 * last, and returns what takes it away again.
 */
export const attachStepper = (element: HTMLElement, options?: StepperOptions): (() => void) => {
    const field = element.closest<HTMLElement>('.dk-field') ?? element;
    const stepper = element.matches('.dk-stepper')
        ? element
        : (field.querySelector<HTMLElement>('.dk-stepper') ?? element);
    const already = attachedSteppers.get(stepper);
    if (already) {
        if (options) already.set(options);
        return already.detach;
    }
    let chosen: StepperOptions = options ?? {};
    const input = field.querySelector<HTMLInputElement>('.dk-stepper-value');
    const down = field.querySelector<HTMLButtonElement>('.dk-stepper-down');
    const up = field.querySelector<HTMLButtonElement>('.dk-stepper-up');
    if (!input || !down || !up) throw new Error('a stepper needs its value and its two buttons');
    const range = field.querySelector<HTMLElement>('.dk-stepper-range');
    const status = field.querySelector<HTMLElement>('.dk-stepper-status');
    const limits = field.querySelector<HTMLElement>('.dk-stepper-limits');
    const limit = (value: string, fallback: number) => (value === '' ? fallback : Number(value));
    const least = () => limit(input.min, -Infinity);
    const greatest = () => limit(input.max, Infinity);
    /** The greatest value a press reaches, which a step that skips the greatest stops short of. */
    const most = () => topOf(least(), greatest(), input.step);
    /** Where a press is said: the page's line when it gave one, or the stepper's own. */
    const line = () => chosen.status ?? status;
    const locked = () => input.disabled || input.readOnly;
    const off = (button: HTMLButtonElement, stop: boolean) => {
        if (stop) button.setAttribute('aria-disabled', 'true');
        else button.removeAttribute('aria-disabled');
    };
    const mark = () => {
        const value = input.valueAsNumber;
        const known = !Number.isNaN(value);
        off(down, locked() || (known && value <= least()));
        off(up, locked() || (known && value >= most()));
    };
    let setInvalid = false;
    let attached = true;
    /**
     * Puts the range in words in the field's description, after the page's own, or the error in its
     * place while the error shows, whoever showed it. Each is written only when it changes, so the
     * watch below, woken by this writing, finds nothing left to write and stops.
     */
    const describe = () => {
        if (limits) {
            const words = attached ? rangeWords(least(), greatest()) : '';
            if (limits.textContent !== words) limits.textContent = words;
        }
        const before = input.getAttribute('aria-describedby') ?? '';
        const after = describedBy(before, range, limits, range !== null && !range.hidden);
        if (after === before) return;
        if (after) input.setAttribute('aria-describedby', after);
        else input.removeAttribute('aria-describedby');
    };
    const report = (wrong: boolean) => {
        if (range) range.hidden = !wrong;
        describe();
        if (!range) return;
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
    // Each press counts, so a message still waiting when the value is typed over, the form is reset
    // or the stepper is taken away is left unsaid, and what a press last said on a page's line is
    // known, so only that is cleared there and the page's own words are left alone.
    let presses = 0;
    let lastSaid = '';
    const quiet = () => {
        presses += 1;
        if (status) hush(status);
        const page = chosen.status;
        if (page && lastSaid !== '' && page.textContent === lastSaid) page.textContent = '';
    };
    /** What a press says: the value, that it is a limit where it is one, and the page's words. */
    const spoken = (pressed: number) => () => {
        if (pressed !== presses || !attached) return null;
        lastSaid = pressWords(input, least(), most(), chosen.words);
        return lastSaid;
    };
    const press = (raise: boolean) => () => {
        mark();
        const button = raise ? up : down;
        if (isOff(button)) return;
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
        const to = line();
        // Kept, on the stepper's line or the page's, since focus stays on the button.
        if (to) say(to, spoken(presses), true);
    };
    const onInput = () => {
        quiet();
        mark();
        if (!wrong()) report(false);
    };
    const onChange = () => {
        const bad = wrong();
        report(bad);
        const to = line();
        if (bad && to && range) say(to, range.textContent, true);
    };
    const onReset = () => {
        window.setTimeout(() => {
            quiet();
            mark();
            report(false);
        });
    };
    // One signal takes every listener away together when the stepper is.
    const listening = new AbortController();
    const { signal } = listening;
    down.addEventListener('click', press(false), { signal });
    up.addEventListener('click', press(true), { signal });
    input.addEventListener('input', onInput, { signal });
    input.addEventListener('change', onChange, { signal });
    stepper.addEventListener('focusin', mark, { signal });
    input.form?.addEventListener('reset', onReset, { signal });
    // A page that draws the field again, as React does, writes its description and its invalid
    // mark from what it last drew, so a shown error is put back each time they are rewritten, or
    // cleared where a script has since made the value right, and the range in words is put back
    // after the page's description. New limits are followed in the words and the buttons.
    const kept = new MutationObserver((records) => {
        if (records.some(({ attributeName }) => attributeName === 'min' || attributeName === 'max'))
            mark();
        if (range && !range.hidden) report(wrong());
        else describe();
    });
    if (range || limits)
        kept.observe(input, {
            attributeFilter: ['aria-describedby', 'aria-invalid', 'min', 'max'],
        });
    mark();
    describe();
    down.hidden = false;
    up.hidden = false;
    const detach = () => {
        listening.abort();
        kept.disconnect();
        quiet();
        attached = false;
        report(false);
        down.hidden = true;
        up.hidden = true;
        attachedSteppers.delete(stepper);
    };
    attachedSteppers.set(stepper, {
        detach,
        set: (next) => {
            // A page that takes the stepper's words to its own line leaves none on the stepper's.
            if (next.status && status) hush(status);
            chosen = next;
        },
    });
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

/**
 * Moves focus off a dialog's corner Close as it opens, to the first field or answer after it that
 * takes focus in the order, else to the title. A link or button among the dialog's words is passed
 * over, so a long dialog opens at its top rather than scrolled down to it.
 */
const moveOffClose = (dialog: HTMLDialogElement, close: Element): void => {
    for (const next of dialog.querySelectorAll<HTMLElement>(
        ':is(input, select, textarea):not([tabindex="-1"]), .dk-dialog-actions > *'
    )) {
        if (close.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_PRECEDING) continue;
        // A radio whose group has a checked one is not where the order goes.
        if (
            next instanceof HTMLInputElement &&
            next.type === 'radio' &&
            !next.checked &&
            next.name &&
            dialog.querySelector(`input[type="radio"][name="${CSS.escape(next.name)}"]:checked`)
        ) {
            continue;
        }
        next.focus();
        if (document.activeElement === next) return;
    }
    const title = dialog.querySelector<HTMLElement>('.dk-dialog-title');
    if (!title) return;
    // A title the page gave no place in the order borrows one, and gives it back as focus leaves.
    if (!title.hasAttribute('tabindex')) {
        title.tabIndex = -1;
        title.addEventListener(
            'blur',
            () => {
                if (title.getAttribute('tabindex') === '-1') title.removeAttribute('tabindex');
            },
            { once: true }
        );
    }
    title.focus();
};

/** The element focus goes back to, from what the page handed over, else what had focus. */
const openerOf = (from: DialogOpener | undefined): Element | null => {
    const found =
        from instanceof Element
            ? from
            : from
              ? ((from.target instanceof Element
                    ? from.target.closest(`:is(${FOCUSABLE}):not([tabindex="-1"])`)
                    : null) ?? (from.currentTarget instanceof Element ? from.currentTarget : null))
              : null;
    if (found && found !== document.body) return found;
    // The page's body, where nothing has focus, is no opener, so focus goes where returnTo says.
    return focusedNow();
};

/**
 * Makes a dialog do what the native element does not do alone, and returns the function that opens
 * it. The element holds focus inside, closes on Escape and makes the page behind it inert. This
 * closes it on a tap on the scrim around it, one that starts and ends there so a drag out of the
 * dialog closes nothing, and on close returns focus to what opened it. That is the element the
 * press that opened it landed on, found from the event a page's listener or React's hands over,
 * since a browser that gives a pressed button no focus leaves nothing else, or else what had
 * focus. Where nothing had focus, or that no longer takes focus, focus goes where `returnTo` says.
 *
 * A dialog that must be answered is attached to stay, and then stays open on Escape, a phone's Back
 * and the scrim, by the closedby attribute where the browser reads it, since one that limits how
 * often a page may refuse a close does not hold a refusal past the first. Attaching it again with
 * options replaces them, attaching it again with none leaves them as they were, and either returns
 * the same function. Its listeners are on the dialog, so a dialog taken from the page takes them
 * with it.
 */
export const attachDialog = (dialog: HTMLDialogElement, options?: DialogOptions): OpenDialog => {
    const already = attachedDialogs.get(dialog);
    if (already) {
        // Options given replace the last, and none leaves them as they were.
        if (options) already.set(options);
        return already.open;
    }
    let settings: DialogOptions = {};
    const set = (next: DialogOptions) => {
        settings = next;
        if (settings.stay === true) dialog.setAttribute('closedby', 'none');
        else dialog.removeAttribute('closedby');
    };
    set(options ?? {});
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
        focusFirst(opener, settings.returnTo?.());
        opener = null;
    });
    const open: OpenDialog = (from) => {
        if (dialog.open) return;
        opener = openerOf(from);
        dialog.showModal();
        // A Close in the corner never takes focus as the dialog opens, which it would where nothing
        // in the dialog asks for focus, as when React's autoFocus writes no attribute.
        const close = dialog.querySelector(':scope > .dk-close');
        if (close?.contains(document.activeElement)) moveOffClose(dialog, close);
    };
    attachedDialogs.set(dialog, { open, set });
    return open;
};

/** Opens or closes a panel attached by its button, from the page's own code. */
export type SetPanel = (open: boolean) => void;

/**
 * What attaching a panel's button returns: `set`, which opens or closes the panel from the page's
 * own code, and `detach`, which lets the button go.
 */
export type PanelControl = { readonly set: SetPanel; readonly detach: () => void };

const attachedPanels = new WeakMap<HTMLButtonElement, PanelControl>();

/** The id of the panel a button names, the first where its aria-controls names several. */
const panelIdOf = (button: Element): string =>
    (button.getAttribute('aria-controls') ?? '').trim().split(/\s+/)[0] ?? '';

/** Every attached button in the page that names the panel, in the page's order. */
const openersOf = (id: string): HTMLButtonElement[] =>
    [...document.querySelectorAll<HTMLButtonElement>('button[aria-controls]')].filter(
        (button) => attachedPanels.has(button) && panelIdOf(button) === id
    );

/**
 * Where the visitor's place last was, the path of the last focus that moved or of their last
 * press, from what it reached up, so a panel it was in still counts after the page draws away or
 * turns off the button pressed. A press by a page's script is not the visitor's and is not kept.
 */
let lastPath: readonly EventTarget[] = [];
/** Whether that last place was a press, as a link followed is, rather than focus that moved. */
let lastWasPress = false;

/** The button that opened each panel that is open, let go as the panel closes. */
const lastOpener = new Map<string, HTMLButtonElement>();

/** The panels a button has started, so a button attached later follows the panel as it is. */
const startedPanels = new Set<string>();

/** How many buttons are attached and not let go, so the one listener comes off with the last. */
let attachedCount = 0;

/**
 * Gives a panel a tabindex of -1 and its corner Close one of 0, where the page set none, so a press
 * in the panel leaves focus in it and Safari focuses a pressed Close. Done as the panel opens or
 * closes, and as a press in it begins, so a panel the page draws again gets them before Safari
 * decides where the press puts focus.
 */
const takeFocus = (panel: HTMLElement): void => {
    if (!panel.hasAttribute('tabindex')) panel.tabIndex = -1;
    const close = panel.querySelector<HTMLElement>(':scope > .dk-close button');
    if (close && !close.hasAttribute('tabindex')) close.tabIndex = 0;
};

/**
 * The place on this page outside the panel that a link in it sends the visitor to, where that link
 * was their last press, since following it moved the keyboard's start there. It is given a
 * tabindex of -1 where it takes no focus, so focus can follow.
 */
const jumpFrom = (panel: HTMLElement): HTMLElement | null => {
    const link = lastWasPress
        ? lastPath.find(
              (node): node is HTMLAnchorElement =>
                  node instanceof HTMLAnchorElement &&
                  panel.contains(node) &&
                  node.hash !== '' &&
                  !node.target &&
                  !node.hasAttribute('download')
          )
        : undefined;
    let id = link?.hash.slice(1) ?? '';
    try {
        id = decodeURIComponent(id);
    } catch {
        // A fragment that is not encoded as a whole is looked for as written.
    }
    const jump =
        link?.origin === location.origin &&
        link.pathname === location.pathname &&
        link.search === location.search
            ? document.getElementById(id)
            : null;
    if (!jump || panel.contains(jump)) return null;
    if (jump.tabIndex < 0 && !jump.hasAttribute('tabindex')) jump.tabIndex = -1;
    return jump;
};

/**
 * Shows or hides a panel and marks every attached button that names it to match, as record 19 has
 * it. The panel and its corner Close take a tabindex here where the page set none, as a button does
 * as it is attached, so a press in the panel leaves focus in it and Safari focuses a pressed Close.
 * As the panel closes, focus goes to its button where focus is in the panel, or where nothing has
 * focus and the visitor's last place, the path of the last focus that moved or of their last press,
 * was in it, and stays anywhere else. Where it goes back and that last press was a link in the
 * panel to a place on this page outside it, it goes there instead. Otherwise it goes to the button
 * given, the one pressed or the one that opened the panel, else the first attached button that
 * names it and takes focus, else the first thing after the panel the keyboard reaches by Tab, else
 * the body of the app's frame or the page's main content.
 */
const showPanel = (id: string, open: boolean, by?: HTMLButtonElement): void => {
    const panel = document.getElementById(id);
    const openers = openersOf(id);
    for (const button of openers) button.setAttribute('aria-expanded', String(open));
    if (open && by) lastOpener.set(id, by);
    if (!open) lastOpener.delete(id);
    if (!panel) return;
    takeFocus(panel);
    const active = focusedNow();
    const held = active ? panel.contains(active) : lastPath.includes(panel);
    panel.hidden = !open;
    if (open || !held) return;
    if (focusFirst(jumpFrom(panel), ...[by, ...openers].filter((button) => !isOff(button)))) return;
    focusFirst(
        ...[...document.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
            (next) =>
                next.tabIndex >= 0 &&
                panel.compareDocumentPosition(next) === Node.DOCUMENT_POSITION_FOLLOWING
        ),
        homeOf(panel)
    );
};

/**
 * One listener for every attached panel keeps the path of each focus that moves and each press the
 * visitor makes, passing over a press by a page's script. It hears a press early, so a page's own
 * handler that stops a click inside the panel does not keep its Close from closing it. A Close
 * closes a panel an attached button opened or names, and only the panel its id finds, so content
 * that reuses the id after it cannot close or mark the real one.
 */
const onPanelPress = (event: Event): void => {
    if (event.isTrusted) {
        lastPath = event.composedPath();
        lastWasPress = true;
    }
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('button');
    if (!button) return;
    if (attachedPanels.has(button)) {
        if (!isOff(button))
            showPanel(panelIdOf(button), button.getAttribute('aria-expanded') !== 'true', button);
        return;
    }
    const panel = button.closest('.dk-close')?.parentElement;
    const id = panel?.id;
    if (!id || document.getElementById(id) !== panel) return;
    if (lastOpener.has(id) || openersOf(id).length) showPanel(id, false, lastOpener.get(id));
};

/** Where focus moves, kept always, so an older place never outlives what followed it. */
const onPanelFocus = (event: Event): void => {
    lastPath = event.composedPath();
    lastWasPress = false;
};

/** As a press begins, each open panel it lands in takes focus, a panel drawn again among them. */
const onPanelDown = (event: Event): void => {
    for (let place = event.target as Element | null; place; place = place.parentElement)
        if (lastOpener.has(place.id) && place instanceof HTMLElement) takeFocus(place);
};

/** A field where Escape means something of its own: a search with words, or a list that opens. */
const ownsEscape = (target: Element): boolean =>
    (target instanceof HTMLInputElement && target.type === 'search' && target.value !== '') ||
    target.matches(
        '[aria-expanded="true"]:is([role="combobox"], [aria-haspopup]:not([aria-haspopup="false"]))'
    );

/**
 * Escape closes the innermost open panel that holds focus, or whose button has it, and marks the
 * press handled, so a dialog around the panel stays open. It leaves alone an Escape the page has
 * already handled, one that ends typing in a script such as Japanese, which Safari marks by the key
 * code 229, one in a dialog or a popover inside the panel, and one on a search with words in it or
 * on a combobox or a button whose list or menu is open, where Escape means something of its own. A
 * panel's button that is off does not close its own panel, and Escape goes on to a panel around it.
 */
const onPanelKey = (event: KeyboardEvent): void => {
    const target = event.target;
    // Safari ends composing with an Escape whose keydown carries the key code 229 instead.
    const composing = event.isComposing || event.keyCode === 229;
    if (event.key !== 'Escape' || event.defaultPrevented || composing) return;
    if (!(target instanceof Element) || ownsEscape(target)) return;
    const own = target instanceof HTMLButtonElement && attachedPanels.has(target);
    for (let place: Element | null = target; place; place = place.parentElement) {
        // A dialog or a popover inside the panel takes its own Escape.
        if (place instanceof HTMLDialogElement || place.hasAttribute('popover')) return;
        // A panel's button that is off does nothing for its own panel, by Escape as by a press, and
        // Escape goes on to a panel around it.
        const id = place === target && own ? (isOff(target) ? '' : panelIdOf(place)) : place.id;
        if (!lastOpener.has(id)) continue;
        event.preventDefault();
        showPanel(id, false, lastOpener.get(id));
        return;
    }
};

/**
 * Makes a button open and close the panel it names in aria-controls, and the panel's corner Close
 * close it, and returns `set`, which opens or closes it from the page's own code, and `detach`,
 * which lets the button go, after which neither does anything. The panel starts as the first
 * button's aria-expanded says, and a button attached later follows the panel as it is. The markup
 * writes hidden on a panel that starts closed, so it never shows before the script runs. A press of
 * the button turns it the other way, unless the button is off, and every attached button that names
 * the panel follows. However the panel closes, by its button, its Close, Escape or `set`, focus
 * goes to the button that opened it where focus is in the panel, or where nothing has focus and the
 * visitor's last place was in it, as record 19 has it. The panel is found at each press, so one
 * drawn again keeps working, and a button drawn again works once it is attached. Listeners on the
 * document hear the presses, the focus and the Escape of every panel, and come off once every
 * button is let go. A panel's id must be the only one on the page. Attached again, a button returns
 * what it returned first.
 */
export const attachPanel = (opener: HTMLButtonElement): PanelControl => {
    const already = attachedPanels.get(opener);
    if (already) return already;
    if (!panelIdOf(opener)) throw new Error("a panel's button needs aria-controls");
    const attached = () => attachedPanels.get(opener) === control;
    const control: PanelControl = {
        set: (open) => {
            const id = panelIdOf(opener);
            if (attached()) showPanel(id, open, lastOpener.get(id) ?? opener);
        },
        detach: () => {
            if (!attached()) return;
            attachedPanels.delete(opener);
            for (const [id, button] of lastOpener) if (button === opener) lastOpener.delete(id);
            if (--attachedCount) return;
            document.removeEventListener('focusin', onPanelFocus, true);
            document.removeEventListener('click', onPanelPress, true);
            document.removeEventListener('pointerdown', onPanelDown, true);
            document.removeEventListener('keydown', onPanelKey);
            startedPanels.clear();
        },
    };
    attachedPanels.set(opener, control);
    if (!attachedCount++) {
        document.addEventListener('focusin', onPanelFocus, true);
        document.addEventListener('click', onPanelPress, true);
        document.addEventListener('pointerdown', onPanelDown, true);
        document.addEventListener('keydown', onPanelKey);
    }
    // Safari focuses a pressed button only where it has a tabindex, so the kit gives one where the
    // page set none, and keeps any the page set, such as a toolbar's that moves among its buttons.
    if (!opener.hasAttribute('tabindex')) opener.tabIndex = 0;
    // The first button for a panel starts it as its markup says, and a later one, a button drawn
    // again among them, only marks itself as the panel is, so it neither moves the panel nor
    // takes the place of the button that opened it.
    const id = panelIdOf(opener);
    const panel = document.getElementById(id);
    if (startedPanels.has(id) && panel) opener.setAttribute('aria-expanded', String(!panel.hidden));
    else control.set(opener.getAttribute('aria-expanded') === 'true');
    startedPanels.add(id);
    return control;
};

/** The pinned cell in the row of what has focus, in this frame, unless focus is in it. */
const pinnedBeside = (frame: Element, reached: Element): Element | undefined => {
    const pinned = reached.closest('tr')?.firstElementChild;
    return pinned &&
        frame.contains(pinned) &&
        !pinned.contains(reached) &&
        getComputedStyle(pinned).position === 'sticky'
        ? pinned
        : undefined;
};

const attachedTables = new WeakMap<HTMLElement, () => void>();

/**
 * Brings what the keyboard reaches in a table's frame fully into view, clear of a pinned column,
 * since Chromium leaves a link or a button that is partly in view where it is, cut by the frame's
 * edge or under the pinned column, and Safari does once more than a target's width of it shows. The
 * pinned cell in the same row, or the frame's scroll padding where that is wider, marks where the
 * room starts, at the side the frame reads from, and the scroll padding at its end where it ends.
 * Wider than the room, its start meets the room's, so its first words show. Only focus the keyboard
 * brings is followed, so a press of a pointer never moves what it pressed. It takes the frame or
 * anything in it, attaches each frame once, and returns what takes it away again.
 */
export const attachTable = (element: HTMLElement): (() => void) => {
    const frame = element.closest<HTMLElement>('.dk-table-scroll');
    if (!frame) throw new Error('a table needs its frame');
    const already = attachedTables.get(frame);
    if (already) return already;
    const onFocusIn = ({ target }: FocusEvent) => {
        if (!(target instanceof Element) || !target.matches(':focus-visible')) return;
        // Measured along the way the frame reads, so a start is the smaller figure either way.
        const read = getComputedStyle(frame);
        const way = read.direction === 'rtl' ? -1 : 1;
        const along = ({ left, right }: { left: number; right: number }): [number, number] =>
            way > 0 ? [left, right] : [-right, -left];
        const left = frame.getBoundingClientRect().left + frame.clientLeft;
        const [inner, outer] = along({ left, right: left + frame.clientWidth });
        // The room the frame's scroll padding keeps, where the browser itself would bring it, so
        // the browser finds nothing more to do, or the pinned cell's inner edge where that is
        // further in.
        const pinned = pinnedBeside(frame, target);
        const from = Math.max(
            inner + Number.parseFloat(read.scrollPaddingInlineStart),
            pinned ? along(pinned.getBoundingClientRect())[1] : inner
        );
        const to = outer - Number.parseFloat(read.scrollPaddingInlineEnd);
        const [start, end] = along(target.getBoundingClientRect());
        if (start < from || end - start > to - from) frame.scrollLeft += (start - from) * way;
        else if (end > to) frame.scrollLeft += (end - to) * way;
    };
    frame.addEventListener('focusin', onFocusIn);
    const detach = () => {
        frame.removeEventListener('focusin', onFocusIn);
        attachedTables.delete(frame);
    };
    attachedTables.set(frame, detach);
    return detach;
};
