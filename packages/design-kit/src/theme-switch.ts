import { docOf, holds, seenNow } from './focus.js';
import { type AttachOptions, join, keep, type Kept, teardown } from './teardown.js';
import { THEME_CHOICES, THEME_KEY, type ThemeChoice } from './theme.js';

/*
 * The theme switch and `chooseTheme`, with the choice the page shows, held once for every switch on
 * it, and the page's own listeners for a choice saved in another tab, a page brought back from the
 * cache and a change of the system's scheme, added as the first switch is attached or a choice is
 * made. No entry of the package names this module, so a page imports it only through `./controls`.
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
 * Each control attached, by its element, one map for each kind so none answers for another.
 */
const attachedSwitches = new WeakMap<HTMLElement, Kept<() => void>>();

/**
 * Makes a theme switch work: checks the choice the page shows, shows the switch, and saves and
 * draws a choice when a visitor makes one. It takes the switch, or an element that holds it.
 * Attaching one switch again before it is taken down attaches it once, and taking it down, by the
 * function it returns or by its `signal`, hides it again. A signal already aborted does nothing,
 * so a switch not yet attached stays hidden and one already attached stays as it is.
 *
 * Where the sheet collapses the switch to its name and one button, in a demo's strip on a screen
 * narrower than 20rem, the button names the choice shown and opens the choices under itself, with
 * focus on the chosen one so the arrow keys move the choice without closing them. They close, with
 * focus back on the button, when a choice is picked by a pointer or on Escape, and close where they
 * are when focus leaves the switch or on a tap anywhere else, though not on a swipe, so a touch can
 * scroll to choices below the screen's edge. The button is wired on every switch, since the sheet
 * alone decides where it shows. A switch with no choices yet is left hidden and unattached.
 */
export const attachThemeSwitch = (element: HTMLElement, options?: AttachOptions): (() => void) => {
    const group = element.matches('.dk-theme-switch')
        ? element
        : (element.querySelector<HTMLElement>('.dk-theme-switch') ?? element);
    // A signal already aborted does nothing, even to a switch already attached.
    if (options?.signal?.aborted) return () => undefined;
    const already = join(attachedSwitches, group, options);
    if (already) return already;
    const radios = [...group.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
    // A switch with no choices yet is left hidden and unattached, so a page that attaches it before
    // its choices are drawn shows no empty control and can attach it again once they are.
    if (radios.length === 0) return () => undefined;
    const down = teardown(options?.signal);
    const { signal } = down;
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
        const held = holds(group, seenNow(docOf(group)));
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
        // The signal takes it off with the switch, even where the button no longer reads as open,
        // which close would take for nothing to close.
        document.addEventListener('pointerup', onDocumentLift, { capture: true, signal });
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
    down.add(() => {
        // Closing marks the button closed. The signal has already taken the document's
        // listener off.
        close(false);
        switches.delete(show);
        group.hidden = true;
    });
    return keep(attachedSwitches, group, down, down.stop);
};
