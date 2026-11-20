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
 * function that says a message. Nothing runs when the module is imported but one listener on the
 * document, in a page, which notes whether the visitor's last input was a press for
 * `focusOnArrival`, and nothing here sets a style, so a page's policy can refuse every style it did
 * not serve.
 */

const isChoice = (value: string | null): value is ThemeChoice =>
    THEME_CHOICES.some((choice) => choice === value);

/** What has focus, or null where nothing does and the page's body stands in for it. */
const focusedNow = (): Element | null => {
    const active = activeOf();
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
        if (activeOf() === place) return true;
    }
    return false;
};

/** Where focus is asked to go: an element, an element's id, one found as focus moves, or nothing. */
export type FocusTarget = Element | string | (() => Element | null) | null | undefined;

/** Where focus goes when nothing nearer takes it, the app frame's body or the main content. */
const homeOf = (element: Element): Element | null =>
    element.closest('.dk-app')?.querySelector('.dk-app-body') ??
    rootOf(element).querySelector('main') ??
    document.querySelector('main');

/** How focus is moved after a change. */
export type MoveFocusOptions = {
    /** Where focus goes, in order, when the target is gone, hidden, inert, disabled or off. */
    readonly fallbacks?: readonly FocusTarget[] | undefined;
    /**
     * Where focus was when the change was asked for, for a request made after the change began,
     * such as from an effect, so focus a view placed as it drew is not taken for the visitor's.
     */
    readonly from?: Element | null | undefined;
};

/** The root a node lives in: a shadow root where it sits in one, else the document. */
const rootOf = (node: Node | null | undefined): Document | ShadowRoot => {
    const root = node?.getRootNode();
    return root instanceof ShadowRoot ? root : document;
};

/**
 * The element an id names in the root a node lives in, so a piece inside a shadow root finds its
 * own parts and never an element of the page around it that shares the id.
 */
const byId = (near: Node | null | undefined, id: string): HTMLElement | null =>
    rootOf(near).getElementById(id);

/** What has focus, followed into each shadow root that holds it. */
const activeOf = (): Element | null => {
    let active = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return active;
};

/**
 * A place to focus, or nothing where it is an id with no element yet or a control marked off. An id
 * is looked for in the root of the element given, as where focus was when it was asked for.
 */
const placeOf = (target: FocusTarget, near?: Node | null): Element | null => {
    const place =
        typeof target === 'string'
            ? byId(near, target)
            : typeof target === 'function'
              ? target()
              : (target ?? null);
    return place && !isOff(place) ? place : null;
};

/** How long a request may wait before it is dropped, as in a tab out of sight, in milliseconds. */
const STALE = 1000;

/** Focuses a request's target or a fallback, where focus is still where it was and it is fresh. */
const land = (
    target: FocusTarget,
    fallbacks: readonly FocusTarget[] | undefined,
    from: Element | null,
    asked: number
) => {
    if (performance.now() - asked > STALE) return;
    const now = activeOf();
    if (now !== from && now !== null && now !== document.body) return;
    const place = placeOf(target, from);
    focusFirst(
        place,
        ...(fallbacks ?? []).map((fallback) => placeOf(fallback, from)),
        homeOf(place ?? from ?? document.body)
    );
};

/**
 * Moves focus to a control once a change is drawn, such as the field a refusal points at or the
 * next player's entry, and returns what calls it off before it lands. It waits for the next frame,
 * so a page that draws the control in answer to the same press or key has drawn it, and finds an
 * id then. A change React draws later, in a transition or behind a suspense, asks from an effect
 * once it is drawn. Where the target is gone from the page, hidden, inert, disabled or off, focus
 * goes to the first fallback that takes it, and then to the app frame's body or the page's main
 * content, by the walk a closing panel hands focus back by, so it does not fall to the page. Focus
 * a visitor has moved since the request is left where they put it: focus is free only while it is
 * where it was when asked, or on the page's body. A request still waiting a second later, as in a
 * tab out of sight, is dropped, so focus does not jump when the visitor comes back. Each request is
 * new, so a control asked for twice is focused twice.
 */
export const moveFocus = (target: FocusTarget, options: MoveFocusOptions = {}): (() => void) => {
    const from = options.from === undefined ? activeOf() : options.from;
    const asked = performance.now();
    const frame = window.requestAnimationFrame(() => {
        land(target, options.fallbacks, from, asked);
    });
    return () => {
        window.cancelAnimationFrame(frame);
    };
};

/** A button or a link by its role, which Enter presses, and Space too but for a link. */
const ROLE_ACTIVATOR = '[role="button"], [role="link"], [role="menuitem"]';
/** What a press is made on: a button or a link, native or by its role. */
const ACTIVATOR = [
    'button',
    'a[href]',
    'input[type="button"]',
    'input[type="submit"]',
    'input[type="reset"]',
    'input[type="image"]',
    'summary',
    ROLE_ACTIVATOR,
].join(', ');
/** Keys that move rather than press. */
const MOVES = [
    'Tab',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
    'PageUp',
    'PageDown',
];
/** How long a press may wait for the view it brings, in milliseconds, as one a slow load brings. */
const PRESS_LIVES = 5000;

/** Whether an event presses a button or a link that is not off and is not in a row of tabs. */
const presses = (event: Event): boolean => {
    if (event.type === 'submit') return true;
    // The control itself, inside a shadow root too, where the document hears its host instead.
    const [target] = event.composedPath();
    if (!(target instanceof Element) || target.closest('[role="tablist"]')) return false;
    if (event instanceof KeyboardEvent) {
        const own = target.closest(ROLE_ACTIVATOR);
        return (
            own === target &&
            !isOff(own) &&
            (event.key === 'Enter' || (event.key === ' ' && own.getAttribute('role') !== 'link'))
        );
    }
    const control = target.closest(ACTIVATOR);
    return control !== null && !isOff(control);
};

/**
 * When the visitor's last input was a press on a button or a link, or a submit, that no view has
 * taken focus for, and how many inputs they have made, so a press handed back is not handed back
 * over a later one. A press is any click or submit, a script's among them, so a page's own
 * `click()` and a test's count. A key that moves or types clears it, so a Tab, an arrow along a
 * row of tabs or typing in a field leaves none, as a click on nothing does, while a pointer going
 * down to scroll leaves it. A press on a control that is off or in a row of tabs counts for
 * nothing, since an off control only says why it is off and a tab keeps focus as its panel
 * changes, and Enter or Space on a control of the page's own that is a button or a link by its
 * role counts, since no click follows them.
 */
let pressedAt: number | null = null;
let inputs = 0;
const heard = (event: Event) => {
    if (event instanceof KeyboardEvent) {
        if (presses(event)) pressedAt = performance.now();
        else if (event.key.length === 1 || MOVES.includes(event.key)) pressedAt = null;
        else return;
    } else pressedAt = presses(event) ? performance.now() : null;
    inputs += 1;
};
// The one thing the module does as it loads, in a page, so the press that brings a page's first
// view is heard. It notes inputs and nothing else.
if (typeof document !== 'undefined')
    for (const type of ['keydown', 'click', 'submit']) document.addEventListener(type, heard, true);

/** How a view asks to take focus as it arrives. */
export type ArrivalOptions = MoveFocusOptions & {
    /**
     * Whether the view was drawn before and changed on a press of the page's, as a round that moves
     * on, so it takes focus whatever the visitor's last input was, and spends the press.
     */
    readonly changed?: boolean | undefined;
};

/** A view asking to take focus for a press. */
type Arrival = {
    readonly heading: FocusTarget;
    readonly from: Element | null;
    readonly fallbacks: readonly FocusTarget[] | undefined;
};
/** The views asking for the press now being answered, landed together in one frame. */
let arriving: {
    readonly views: Set<Arrival>;
    readonly frame: number;
    readonly at: number;
    readonly press: number | null;
} | null = null;

/**
 * Moves focus to a view's heading as it is first drawn, as `moveFocus` does, where the visitor's
 * last input was a press on a button or a link, or a submit, in the last five seconds that no view
 * has taken focus for, and returns what calls it off. A view drawn as the page first draws takes
 * nothing, nor one drawn after a key that moves or types, such as Tab or an arrow along a row of
 * tabs, after a press on nothing, on a control that is off or in a row of tabs, or long after the
 * press, as one a poll brings. Views first drawn for the same press land together in one frame, and
 * the one first in the page takes focus, so a view's title is heard before a section of it. A
 * request called off before it lands hands its press back where no input has come since, so a view
 * asked for again, as React asks again in development, takes focus. A view already drawn that
 * changed on a press asks with `changed`, so it takes focus whatever the last input was, lands
 * with the views first drawn for the same press, and spends the press.
 */
export const focusOnArrival = (
    heading: FocusTarget,
    options: ArrivalOptions = {}
): (() => void) => {
    if (!arriving) {
        const fresh = pressedAt !== null && performance.now() - pressedAt <= PRESS_LIVES;
        if (!fresh && !options.changed) return () => undefined;
        const press = pressedAt;
        pressedAt = null;
        const views = new Set<Arrival>();
        const asked = performance.now();
        const frame = window.requestAnimationFrame(() => {
            arriving = null;
            const places = [...views].flatMap((view) => {
                const place = placeOf(view.heading, view.from);
                return place?.isConnected ? [{ view, place }] : [];
            });
            places.sort((one, other) =>
                one.place.compareDocumentPosition(other.place) & Node.DOCUMENT_POSITION_PRECEDING
                    ? 1
                    : -1
            );
            const [first] = places;
            if (first) land(first.place, first.view.fallbacks, first.view.from, asked);
            else {
                // No heading is there to take focus, so the first view asked goes by its fallbacks.
                const [view] = views;
                if (view) land(view.heading, view.fallbacks, view.from, asked);
            }
        });
        arriving = { views, frame, at: inputs, press };
    }
    const batch = arriving;
    const view: Arrival = {
        heading,
        from: options.from === undefined ? activeOf() : options.from,
        fallbacks: options.fallbacks,
    };
    batch.views.add(view);
    return () => {
        batch.views.delete(view);
        if (batch.views.size > 0 || arriving !== batch) return;
        window.cancelAnimationFrame(batch.frame);
        arriving = null;
        if (inputs === batch.at) pressedAt = batch.press;
    };
};

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
        const held = group.contains(activeOf());
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

/** A message a status line says: words, or a function that gives them as they are put in. */
type Spoken = Parameters<Say>[0];

/**
 * What a status line is saying. A message is put in a moment after the line is emptied, so the
 * same words twice are heard twice, and leaves after a while unless it is kept, as a toast keeps
 * its own until the toast leaves. Words waiting to settle keep a timer of their own, so words
 * already said still leave as ever. The line knows the message it is saying and whether it was said
 * in this moment, whether firm words were said in this moment or still settle, and the polite words
 * and the polite notice, given as a function, waiting for it to be free.
 */
type Line = {
    timer: number;
    settle: number;
    current: {
        readonly message: Spoken;
        readonly polite: boolean;
        put: boolean;
        now: boolean;
    } | null;
    firmNow: boolean;
    /** How many firm messages the line has been given, so only the last clears the moment's mark. */
    firms: number;
    settling: boolean;
    words: string | null;
    notice: (() => string | null) | null;
};
const lines = new WeakMap<HTMLElement, Line>();
const lineOf = (status: HTMLElement): Line => {
    let line = lines.get(status);
    if (!line) {
        line = {
            timer: 0,
            settle: 0,
            current: null,
            firmNow: false,
            firms: 0,
            settling: false,
            words: null,
            notice: null,
        };
        lines.set(status, line);
    }
    return line;
};

/** Empties a status line, and drops what it was about to say, waiting words among them. */
const hush = (status: HTMLElement) => {
    const line = lineOf(status);
    window.clearTimeout(line.timer);
    window.clearTimeout(line.settle);
    Object.assign(line, {
        current: null,
        firmNow: false,
        settling: false,
        words: null,
        notice: null,
    });
    status.textContent = '';
};

/** Keeps polite words to say once the line is free, words and a notice each in a place apart. */
const hold = (line: Line, message: Spoken) => {
    if (typeof message === 'string') line.words = message;
    else line.notice = message;
};

/**
 * Whether polite words go now. They give way to firm words said in the same moment or still
 * settling, so a result said with them is heard in their place. They wait for firm words the line
 * is saying, and polite words given as a function, read as they are put in, such as a busy
 * button's notice, wait for any words, so they never put out the end of a progress and say nothing
 * once no longer true. Words that wait take the place of words of their kind waiting before them.
 */
const admit = (line: Line, message: Spoken): boolean => {
    if (line.settling || line.firmNow) return false;
    const { current } = line;
    if (current && (!current.polite || typeof message === 'function')) {
        hold(line, message);
        return false;
    }
    return true;
};

/**
 * Ends what a line is saying, and says what waits for it once nothing settles: the polite words
 * first, and the notice once those have left too.
 */
const leave = (status: HTMLElement) => {
    const line = lineOf(status);
    line.current = null;
    status.textContent = '';
    if (line.settling) return;
    const next = line.words ?? line.notice;
    if (next === line.words) line.words = null;
    else line.notice = null;
    if (!next) return;
    say(status, next, false, true);
    // Said earlier and only held, so not taken for words said in this moment.
    const said = lineOf(status).current;
    if (said?.message === next) said.now = false;
};

/**
 * Says a message on a status line. A message given as a function is read as it is put in, after the
 * moment's wait, so words a page draws from its own state follow the change that prompted them, and
 * one that gives nothing by then is not said. Polite words go, wait or give way as `admit` has it.
 * Any message drops words still settling and takes the place of the one the line is saying. Polite
 * words not yet put in that firm words take the place of wait for those to leave, unless both were
 * said in the same moment, and a notice waits whatever takes its place. Firm words leave polite
 * words waiting as they are, and polite words that go take the place of the polite words waiting.
 */
const say = (status: HTMLElement, message: Spoken, keep = false, polite = false) => {
    const line = lineOf(status);
    if (polite && !admit(line, message)) return;
    if (polite) line.words = null;
    const before = line.current;
    if (
        before?.polite &&
        !before.put &&
        (typeof before.message === 'function' || (!polite && !before.now))
    )
        hold(line, before.message);
    window.clearTimeout(line.timer);
    window.clearTimeout(line.settle);
    line.settling = false;
    status.textContent = '';
    const current = { message, polite, put: false, now: true };
    line.current = current;
    if (!polite) {
        line.firmNow = true;
        line.firms += 1;
    }
    const firms = line.firms;
    // The moment ends with the task, whether the words are still on the line or have left it.
    window.setTimeout(() => {
        current.now = false;
        if (!polite && line.firms === firms) line.firmNow = false;
    });
    line.timer = window.setTimeout(() => {
        const words = typeof message === 'string' ? message : message();
        // A message that is no longer wanted by the time it would be said is left unsaid.
        if (words === null) {
            leave(status);
            return;
        }
        status.textContent = words;
        current.put = true;
        if (keep) return;
        line.timer = window.setTimeout(() => {
            leave(status);
        }, SAID_FOR);
    }, 100);
};

/** Takes a piece's own message off a page's line before it would leave, freeing it for the next. */
const unsay = (status: HTMLElement, message: Spoken | null) => {
    const line = lineOf(status);
    if (message === null || line.current?.message !== message) return;
    window.clearTimeout(line.timer);
    leave(status);
};

/** How a message is said on a status line. */
export type SayOptions = {
    /**
     * How long, in milliseconds, the words wait to stop changing before they are said, for words
     * that change with each press, such as a count still to enter. Words said again within it take
     * the place of those not yet said, and only the last is said.
     */
    readonly settle?: number | undefined;
    /**
     * For words that should give way to a result, such as progress or a busy button's notice:
     * left unsaid where firm words are said in the same moment or still settle, and said once the
     * line is free where firm words are on it. Given as a function, they wait for any words.
     */
    readonly polite?: boolean | undefined;
};

/**
 * Says a message on a status line, at once or once its words stop changing. A message given as a
 * function is read as it is put on the line, and one that gives nothing by then is not said, for
 * words that may no longer be true, such as a busy button's once its work is done.
 */
export type Say = (message: string | (() => string | null), options?: SayOptions) => void;

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
    const speak: Say = (message, { settle = 0, polite = false } = {}) => {
        if (settle <= 0) {
            say(line, message, false, polite);
            return;
        }
        const state = lineOf(line);
        if (polite && !admit(state, message)) {
            // Polite words settling before these are dropped, so the last said is the one heard.
            if (!state.settling) window.clearTimeout(state.settle);
            return;
        }
        // Waits on a timer of its own, so words already said are still put in and leave as ever,
        // and any message said in the meantime drops these.
        window.clearTimeout(state.settle);
        state.settling = !polite;
        state.settle = window.setTimeout(() => {
            state.settling = false;
            say(line, message, false, polite);
        }, settle);
    };
    attachedLines.set(line, speak);
    return speak;
};

/** Where a piece's words are said: the page's own function, or a status line the page names. */
type SpeaksOn = {
    readonly say?: Say | undefined;
    readonly status?: HTMLElement | null | undefined;
};

/** Says a piece's words through the page's function where it gives one, else on its line. */
const speakOn = (chosen: SpeaksOn, message: Spoken, options?: SayOptions) => {
    if (chosen.say) chosen.say(message, options);
    else if (chosen.status) attachStatus(chosen.status)(message, options);
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
        const hadFocus = element.contains(activeOf());
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
        if (!action && activeOf() === actionButton) close.focus();
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
    readonly status?: HTMLElement | null | undefined;
    /**
     * What says each press in place of the stepper's line, for a page that has one already, such
     * as React's `useStatus`, as the form, the busy button and progress take it. Given with a
     * `status` line, it is the one used.
     */
    readonly say?: Say | undefined;
    /**
     * Words to say after the value, read as the message is put on the line, a moment after the
     * press, so a page's own state has caught up with it.
     */
    readonly words?: ((value: string) => string) | null | undefined;
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
 * A stepper's value and its two buttons, or nothing for a read-only stepper drawn with no buttons.
 * A part a working stepper cannot do without is an error that names it.
 */
const stepperParts = (
    field: HTMLElement
): { input: HTMLInputElement; down: HTMLButtonElement; up: HTMLButtonElement } | null => {
    const input = field.querySelector<HTMLInputElement>('.dk-stepper-value');
    const down = field.querySelector<HTMLButtonElement>('.dk-stepper-down');
    const up = field.querySelector<HTMLButtonElement>('.dk-stepper-up');
    if (!input) throw new Error('a stepper needs its value');
    if (down && up) return { input, down, up };
    if (input.readOnly) return null;
    throw new Error('a stepper needs its two buttons, or a read-only value');
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
    const parts = stepperParts(field);
    // A read-only stepper is drawn with no buttons, so there is nothing for a press to change.
    if (!parts) return () => undefined;
    const { input, down, up } = parts;
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
    /**
     * Says a press's words through the page's `say` where it gave one, else on the page's line or
     * the stepper's own, kept there alone, since focus stays on the button.
     */
    const tell = (message: Spoken) => {
        lastSaid = message;
        if (chosen.say) {
            // Said through the page's own function, which keeps no record to take it back from,
            // so it leaves when the line's time for it is up.
            saidOn = null;
            chosen.say(message);
            return;
        }
        const to = line();
        saidOn = to === status ? null : to;
        if (to) say(to, message, to === status);
    };
    const locked = () => input.disabled || input.readOnly;
    let attached = true;
    const off = (button: HTMLButtonElement, stop: boolean) => {
        if (stop) button.setAttribute('aria-disabled', 'true');
        else button.removeAttribute('aria-disabled');
    };
    const mark = () => {
        const value = input.valueAsNumber;
        const known = !Number.isNaN(value);
        off(down, locked() || (known && value <= least()));
        off(up, locked() || (known && value >= most()));
        // A read-only value is shown alone, with no buttons to change it, but a button that has
        // focus stays, marked off, until focus leaves it, so focus is never dropped.
        const fixed = input.readOnly && !input.disabled;
        for (const button of [down, up])
            button.hidden = attached && fixed ? activeOf() !== button : !attached;
    };
    let setInvalid = false;
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
    // or the stepper is taken away is left unsaid, and the message a press last gave a page's line
    // is known, so only that is cleared there and the page's own words are left alone.
    let presses = 0;
    let lastSaid: Spoken | null = null;
    // The page's line the stepper last said something on, so only what it said there is cleared.
    let saidOn: HTMLElement | null = null;
    const quiet = () => {
        presses += 1;
        if (status) hush(status);
        if (saidOn) unsay(saidOn, lastSaid);
    };
    /** What a press says: the value, that it is a limit where it is one, and the page's words. */
    const spoken = (pressed: number) => {
        return () =>
            pressed !== presses || !attached
                ? null
                : pressWords(input, least(), most(), chosen.words);
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
        // Kept on the stepper's own line, since focus stays on the button, and on a page's line
        // left to leave as every message there does, so the line is free for the words after it.
        tell(spoken(presses));
    };
    const onInput = () => {
        quiet();
        mark();
        if (!wrong()) report(false);
    };
    const onChange = () => {
        const bad = wrong();
        report(bad);
        if (bad && range) {
            const words = range.textContent;
            tell(() => words);
        }
    };
    // Once the reset is done, and never once the stepper is let go, as with focus leaving it.
    let resetting = 0;
    const onReset = () => {
        window.clearTimeout(resetting);
        resetting = window.setTimeout(() => {
            if (!attached) return;
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
        // New limits, or a field that turns read only or disabled, are followed in the buttons.
        if (records.some(({ attributeName }) => attributeName !== 'aria-describedby')) mark();
        if (range && !range.hidden) report(wrong());
        else describe();
    });
    kept.observe(input, {
        attributeFilter: ['aria-describedby', 'aria-invalid', 'min', 'max', 'readonly', 'disabled'],
    });
    // Marked once focus has settled, and never once the stepper is let go, so a stepper taken
    // away and attached again from a page's own focusout handler keeps its buttons.
    let settling = 0;
    stepper.addEventListener(
        'focusout',
        () => {
            window.clearTimeout(settling);
            settling = window.setTimeout(() => {
                if (attached) mark();
            });
        },
        { signal }
    );
    mark();
    describe();
    const detach = () => {
        listening.abort();
        kept.disconnect();
        window.clearTimeout(settling);
        window.clearTimeout(resetting);
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
            // A page that takes the stepper's words to its own line leaves none on the stepper's,
            // and words left on a line the page no longer gives are taken back from it.
            if ((next.status || next.say) && status) hush(status);
            if (saidOn && saidOn !== next.status) unsay(saidOn, lastSaid);
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
        if (activeOf() === next) return;
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
        if (close?.contains(activeOf())) moveOffClose(dialog, close);
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

/** How a form is attached, for the step after a submit it refuses. */
export type FormOptions = {
    /** The status line the refusal is said on, such as the screen's own. */
    readonly status?: HTMLElement | null | undefined;
    /** What says the refusal, for a page that has one already, such as React's `useStatus`. */
    readonly say?: Say | undefined;
    /** An error summary the page draws over the form, focused in place of the first field. */
    readonly summary?: (() => Element | null) | undefined;
    /**
     * The words for each way a field can fail the browser's constraints, in place of the kit's,
     * as a page in another language gives them, each words or a function of the field.
     */
    readonly errorWords?: FailureWords | undefined;
    /**
     * Called with the fields that fail the browser's constraints on a submit, for a page that draws
     * its errors itself, as React does from its state, and refuses once they are drawn. Without
     * it, the kit draws each error in the field and refuses.
     */
    readonly invalid?: ((failures: readonly FieldFailure[]) => void) | undefined;
};

/** The ways a field fails the browser's constraints, in the order their words are chosen. */
const FAILURES = [
    'badInput',
    'valueMissing',
    'typeMismatch',
    'patternMismatch',
    'tooShort',
    'tooLong',
    'rangeUnderflow',
    'rangeOverflow',
    'stepMismatch',
    'customError',
] as const;

/** A way a field fails the browser's constraints, named as its `validity` names it. */
export type Failure = (typeof FAILURES)[number];

/** Words for each way a field fails, each words or a function of the field. */
export type FailureWords = Partial<Record<Failure, string | ((control: HTMLElement) => string)>>;

/** A field that fails the browser's constraints, with the way it fails and the words for it. */
export type FieldFailure = {
    /** The field, a set's fieldset where the control is one of a set's choices. */
    readonly field: Element;
    /** The control that fails. */
    readonly control: HTMLElement;
    readonly failure: Failure;
    readonly words: string;
};

type Checked = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const DATED = new Set(['date', 'datetime-local', 'month', 'week']);
const CHOICE = 'input[type="checkbox"], input[type="radio"]';

const limitOf = (control: Checked, name: string) => control.getAttribute(name) ?? '';

/** The ids an element's attribute names, in order. */
const idsOf = (element: Element, attribute: string): string[] =>
    (element.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean);

/** Whether a control is described by a hint, which then shows the format it takes. */
const hinted = (control: Element): boolean =>
    idsOf(control, 'aria-describedby').some((id) => byId(control, id)?.matches('.dk-field-hint'));

/** Words for a value that does not match the format a field takes. */
const formatWords = (control: Checked) =>
    hinted(control) ? 'Enter it in the format the hint shows.' : 'Enter it in the right format.';

/** Words for a value off a field's steps, counted from its least where it has one. */
const stepWords = (control: Checked): string => {
    if (control.type === 'time') return 'Enter a time on one of the steps allowed.';
    if (control.type === 'datetime-local')
        return 'Enter a date and time on one of the steps allowed.';
    if (DATED.has(control.type)) return 'Enter a date on one of the steps allowed.';
    const least = limitOf(control, 'min');
    const step = limitOf(control, 'step') || '1';
    if (step === '1' && (least === '' || Number.isInteger(Number(least))))
        return 'Enter a whole number.';
    return least !== '' && Number(least) !== 0
        ? `Enter ${least}, or ${least} plus a multiple of ${step}.`
        : `Enter a multiple of ${step}.`;
};

/**
 * Whether a fieldset holds one set of choices, as the kit's set of choices draws it or a page
 * writes one, rather than a section of a form with a choice standing alone in it.
 */
const holdsOneSet = (fieldset: Element): boolean => {
    if (fieldset.matches('.dk-choice-field')) return true;
    const controls = [...fieldset.querySelectorAll('input, select, textarea')];
    const choices = controls.filter((control) => control.matches(CHOICE));
    // Choices alone, whatever their names, or a group of one name with a field beside it, as an
    // Other box, while a section of fields with a box alone among them is no set.
    return (
        choices.length === controls.length ||
        (choices.length > 1 && new Set(choices.map((one) => one.getAttribute('name'))).size === 1)
    );
};

/**
 * The field a control stands for: a set's fieldset where the control is one of its choices, so a
 * set counts once, else the control itself, a box that stands alone in a section among them.
 */
const fieldOf = (marked: Element): Element => {
    if (!marked.matches(CHOICE)) return marked;
    const set = marked.closest('fieldset');
    return set && holdsOneSet(set) ? set : marked;
};

/**
 * The kit's words for a failure, which say what to do, in the manner of GOV.UK's error messages.
 * A pattern cannot be put in words from the pattern, so a field with one gives words of its own.
 */
const KIT_WORDS: Record<Failure, (control: Checked) => string> = {
    badInput: (control) =>
        control.type === 'time'
            ? 'Enter a real time.'
            : DATED.has(control.type)
              ? 'Enter a real date.'
              : 'Enter a number.',
    valueMissing: (control) => {
        if (control.type === 'checkbox' && fieldOf(control) === control)
            return 'Check the box to go on.';
        return control instanceof HTMLSelectElement || control.matches(CHOICE)
            ? 'Choose an option.'
            : 'Enter a value.';
    },
    typeMismatch: (control) => {
        if (control.type === 'email') return 'Enter an email address, like name@example.com.';
        return control.type === 'url'
            ? 'Enter a full web address, starting with https://.'
            : formatWords(control);
    },
    patternMismatch: formatWords,
    tooShort: (control) => `Enter at least ${limitOf(control, 'minlength')} characters.`,
    tooLong: (control) => `Enter ${limitOf(control, 'maxlength')} characters or fewer.`,
    rangeUnderflow: (control) => {
        const least = limitOf(control, 'min');
        if (control.type === 'time') return `Enter a time at or after ${least}.`;
        return DATED.has(control.type)
            ? `Enter a date on or after ${least}.`
            : `Enter ${least} or more.`;
    },
    rangeOverflow: (control) => {
        const most = limitOf(control, 'max');
        if (control.type === 'time') return `Enter a time at or before ${most}.`;
        return DATED.has(control.type)
            ? `Enter a date on or before ${most}.`
            : `Enter ${most} or less.`;
    },
    stepMismatch: stepWords,
    customError: (control) => control.validationMessage,
};

/**
 * The words for a field's failure: the control's own for it, as `data-error-value-missing`, else
 * its set's, else the page's for the form, else the kit's, and never the browser's, which follow
 * its language rather than the page's.
 */
const failureWords = (
    control: Checked,
    field: Element,
    failure: Failure,
    given: FailureWords | undefined
): string => {
    const name = `data-error-${failure.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
    const own = control.getAttribute(name) ?? field.getAttribute(name);
    if (own) return own;
    const page = given?.[failure];
    const words = typeof page === 'function' ? page(control) : page;
    // Words that come to nothing give way to the kit's, so a field never shows an empty error.
    return words === undefined || words === '' ? KIT_WORDS[failure](control) : words;
};

/**
 * The fields of a form that fail the browser's constraints, each set once, a group of radios with
 * no set around it among them, and none marked off, which a visitor could not put right.
 */
const failuresOf = (form: HTMLFormElement, given: FailureWords | undefined): FieldFailure[] => {
    const seen = new Set<Element | string>();
    return [...form.elements].flatMap((control) => {
        if (
            !(
                control instanceof HTMLInputElement ||
                control instanceof HTMLSelectElement ||
                control instanceof HTMLTextAreaElement
            ) ||
            !control.willValidate ||
            control.validity.valid ||
            control.closest('[aria-disabled="true"]')
        )
            return [];
        const field = fieldOf(control);
        const key = field === control && control.type === 'radio' ? `radio ${control.name}` : field;
        if (seen.has(key)) return [];
        seen.add(key);
        const failure = FAILURES.find((one) => control.validity[one]) ?? 'customError';
        return [{ field, control, failure, words: failureWords(control, field, failure, given) }];
    });
};

/**
 * What a field's error marks invalid and what it describes, as the kit's field marks them: a set of
 * radios on its fieldset, a set of checkboxes on each box, each choice described by the error, and
 * a field on its own control.
 */
const marksOf = (field: Element, control: Element) => {
    if (field === control) return { marked: [control], described: [control] };
    const choices = [...field.querySelectorAll(CHOICE)];
    return {
        marked: control.matches('input[type="radio"]') ? [field] : choices,
        described: [field, ...choices],
    };
};

/** An element's attribute put back as it was, or taken away where it had none. */
const restore = (element: Element, name: string, value: string | null) => {
    if (value === null) element.removeAttribute(name);
    else element.setAttribute(name, value);
};

/** An id no element of a root holds yet, from the one a field's error would take. */
const freeId = (base: string, near: Node): string => {
    let id = base;
    for (let more = 2; byId(near, id); more += 1) id = `${base}-${String(more)}`;
    return id;
};

/** The words a screen reader starts an error with, so it is told from the hint by more than color. */
const errorStart = () => {
    const said = document.createElement('span');
    said.className = 'dk-visually-hidden';
    said.textContent = 'Error: ';
    return said;
};

/**
 * The error a failure is shown in, and what takes it away: a stepper's range error, which says what
 * is wrong already, left as it is, an error the page already drew for the field given the kit's
 * words, else one the kit draws after the field's hint, above the control or under a set's legend.
 */
const errorFor = (
    field: Element,
    control: Element,
    words: string
): { readonly error: HTMLElement; readonly takeAway: () => void } => {
    const range = idsOf(control, 'aria-describedby')
        .map((id) => byId(control, id))
        .find((part) => part?.matches('.dk-stepper-range') && !part.hidden);
    if (range) return { error: range, takeAway: () => undefined };
    const page = field.id ? byId(field, `${field.id}-error`) : null;
    if (page?.matches('.dk-field-error')) {
        const kept = [...page.childNodes];
        const hidden = page.hidden;
        page.replaceChildren(errorStart(), words);
        page.hidden = false;
        return {
            error: page,
            takeAway: () => {
                page.replaceChildren(...kept);
                page.hidden = hidden;
            },
        };
    }
    const made = document.createElement('p');
    made.className = 'dk-field-error';
    made.id = freeId(`${field.id || control.id || 'dk-field'}-error`, field);
    made.append(errorStart(), words);
    const set = field.matches('fieldset');
    const after = set
        ? ([...field.querySelectorAll(':scope > .dk-field-hint')].at(-1) ??
          field.querySelector(':scope > legend'))
        : null;
    const holder = field.closest('.dk-field');
    // Never inside a label that holds the control, where it would join the control's name.
    const ahead =
        holder && holder !== field
            ? ([...holder.children].find((child) => child.contains(control)) ?? control)
            : (control.closest('label') ?? control);
    if (after) after.after(made);
    else if (set) field.prepend(made);
    else ahead.before(made);
    return {
        error: made,
        takeAway: () => {
            made.remove();
        },
    };
};

/**
 * Refuses a submit, once the page has drawn its errors: focus moves and the refusal is said. It
 * returns what calls the refusal off before it lands.
 */
export type Refuse = () => () => void;

const attachedForms = new WeakMap<
    HTMLElement,
    { readonly refuse: Refuse; readonly set: (next: FormOptions) => void }
>();

/** The forms the kit checks, each once however many of its parts are attached. */
const checkedForms = new WeakSet<HTMLFormElement>();

/** What checks each form, and clears what its check drew, from the attach that checks it. */
const checkers = new WeakMap<
    HTMLFormElement,
    {
        readonly check: (event: SubmitEvent, whole: HTMLFormElement) => void;
        readonly clear: () => void;
    }
>();

/** Whether a control can take focus: enabled, not inert, and in sight. */
const takesFocus = (control: Element): control is HTMLElement =>
    control instanceof HTMLElement &&
    !control.matches(':disabled') &&
    !control.closest('[inert]') &&
    control.checkVisibility();

/**
 * Whether a refusal can hand a field focus: it is not marked off, itself or by a set around it,
 * and it takes focus. The mark is read first, since it costs no layout.
 */
const reachable = (control: Element): control is HTMLElement =>
    !control.closest('[aria-disabled="true"]') && takesFocus(control);

/** The fields of a refused form in error, each once, in order. */
const wrongFields = (form: HTMLElement): Element[] => [
    ...new Set([...form.querySelectorAll('[aria-invalid="true"]')].map(fieldOf)),
];

/**
 * Where focus goes in a field in error: the field itself, or in a set, its checked radio, else the
 * first of its controls that can take focus. Nothing where none can.
 */
const focusIn = (field: Element): HTMLElement | null => {
    if (!field.matches('fieldset')) return reachable(field) ? field : null;
    const checked = field.querySelector('input[type="radio"]:checked');
    if (checked && reachable(checked)) return checked;
    return [...field.querySelectorAll('input, select, textarea, button')].find(reachable) ?? null;
};

/**
 * The words of the shown elements an element's attribute names by id, in order, as a screen reader
 * reads them, such as its description, or only those of the parts a check keeps.
 */
const namedText = (
    element: Element,
    attribute: string,
    wanted: (part: HTMLElement) => boolean = () => true
): string =>
    idsOf(element, attribute)
        .map((id) => byId(element, id))
        .filter((part): part is HTMLElement => part !== null && !part.hidden && wanted(part))
        .map((part) => part.textContent.trim())
        .join(' ');

/** The words of the errors a field is described by, as a screen reader reads them. */
const errorWords = (field: Element): string =>
    namedText(field, 'aria-describedby', (part) => part.matches('.dk-field-error'));

/** A field's name, from its set's legend or its control's label, to say before an error. */
const fieldName = (field: Element): string => {
    const named =
        field.querySelector(':scope > legend')?.textContent ??
        (field instanceof HTMLInputElement ||
        field instanceof HTMLSelectElement ||
        field instanceof HTMLTextAreaElement
            ? field.labels?.[0]?.textContent
            : null) ??
        field.getAttribute('aria-label') ??
        '';
    return named.replace(/\s+/g, ' ').trim();
};

/** How many fields a refused form has in error. */
const countWords = (count: number): string =>
    count === 1 ? '1 field needs attention.' : `${String(count)} fields need attention.`;

/**
 * What a refusal says, chosen so nothing is said twice. Where focus moves to a summary, which reads
 * its own words, it says nothing, and where the summary already had focus, its words. Where focus
 * moves to a field, which reads the field and its error, it says the count. Where the field already
 * had focus, which then reads nothing, it says the error, with the count where more are wrong.
 */
const refusalWords = (
    to: { readonly summary: Element | null; readonly field: Element | null },
    focused: boolean,
    count: number
): string => {
    if (to.summary) return focused ? to.summary.textContent.trim() : '';
    if (!to.field || count === 0) return '';
    if (!focused) return countWords(count);
    const words = errorWords(to.field);
    return count > 1 || words === '' ? `${words} ${countWords(count)}`.trim() : words;
};

/**
 * What a refusal says where no field in error can take focus, as one out of sight or marked off:
 * the first field's name and error, since nothing else tells the visitor which it is, with the
 * count where more are wrong.
 */
const unreachedWords = (field: Element, words: string, count: number): string => {
    const name = fieldName(field);
    // A field with no words of error shown is named with the count, which says it needs attention.
    const said = words === '' ? countWords(count) : words;
    const named = name === '' ? said : `${name}: ${said}`;
    return count > 1 && words !== '' ? `${named} ${countWords(count)}` : named;
};

/**
 * Makes a form refuse a submit, and returns what refuses it. The form takes `noValidate` from
 * script, or the form around an attached part of one, and the kit checks the browser's constraints
 * on submit, before the page's own handler, which runs only where every field passes, so a page
 * without script keeps the browser's check, as record 21 has it. Where a field fails, the submit
 * is stopped, and the kit draws each error as its field draws one and refuses, or hands the
 * failures to `invalid` for a page that draws them itself and refuses. Each failure's words are the
 * field's own, else the page's `errorWords`, else the kit's. A button marked formnovalidate
 * submits unchecked, and errors the kit drew go once their fields pass or the form is reset.
 *
 * A refusal waits a frame, so the errors are drawn, then moves focus to an error summary where the
 * page names one, else the first field in error that can take focus, or in a set its checked radio
 * or its first control that can, and says one message on the status line, chosen so nothing is said
 * twice: nothing where focus moves to a summary, whose words it reads, how many fields need
 * attention where focus moves to a field, since moving focus reads the field and its error, or the
 * error's own words, with the count where more are wrong, where the field already had focus, since
 * focus that does not move reads nothing. A set counts once however many of its choices are marked.
 * The field's error stays not live. A second refusal calls off one not yet landed, and each refusal
 * returns what calls it off. Attached again, a form returns what it returned first and takes
 * options given in place of the last.
 */
export const attachForm = (form: HTMLElement, options?: FormOptions): Refuse => {
    const already = attachedForms.get(form);
    if (already) {
        if (options) already.set(options);
        return already.refuse;
    }
    let chosen: FormOptions = options ?? {};
    let pending: (() => void) | null = null;
    // The failures of the last submit the kit refused, said where a page that draws its own errors
    // marks none, so the refusal is still heard.
    let failed: readonly FieldFailure[] = [];
    // The browser's own check would stop a submit before the page's handler runs, showing its own
    // bubble, which fades, in place of the kit's errors, so the form takes noValidate from script
    // and the kit checks the same constraints on submit. A page without script keeps the browser's
    // check.
    const own = form instanceof HTMLFormElement ? form : form.closest('form');
    if (own) own.noValidate = true;
    const scope = own ?? form;
    // A field not in error says so, so a browser does not read an empty required field as invalid
    // before anything is submitted.
    for (const control of scope.querySelectorAll('input, select, textarea, fieldset'))
        if (!control.hasAttribute('aria-invalid')) control.setAttribute('aria-invalid', 'false');
    /** What puts back each field the kit drew an error in, as it was before. */
    const drawn = new Map<Element, () => void>();
    const undraw = (field: Element) => {
        drawn.get(field)?.();
        drawn.delete(field);
    };
    /**
     * Draws a failure's error in its field as the kit's field draws one: after its hint, above the
     * control or under a set's legend, starting with a word a screen reader reads, and described
     * after the hint. An error the page already drew for the field takes the kit's words, and a
     * stepper's range error, which says what is wrong already, is left as it is and only marked.
     */
    const draw = ({ field, control, words }: FieldFailure) => {
        undraw(field);
        const { marked, described } = marksOf(field, control);
        const before = [...new Set([...marked, ...described])].map(
            (one) =>
                [
                    one,
                    one.getAttribute('aria-invalid'),
                    one.getAttribute('aria-describedby'),
                ] as const
        );
        const { error, takeAway } = errorFor(field, control, words);
        for (const one of marked) one.setAttribute('aria-invalid', 'true');
        for (const one of described) {
            const ids = idsOf(one, 'aria-describedby').filter((id) => id !== error.id);
            const hintsEnd =
                ids.findLastIndex((id) => byId(one, id)?.matches('.dk-field-hint')) + 1;
            ids.splice(hintsEnd, 0, error.id);
            one.setAttribute('aria-describedby', ids.join(' '));
        }
        drawn.set(field, () => {
            takeAway();
            // Only what the kit changed is put back, and only where it still holds the kit's
            // change, so a mark a stepper or the page has since taken away or set stays theirs.
            for (const [one, invalid, describedBy] of before) {
                if (marked.includes(one) && one.getAttribute('aria-invalid') === 'true')
                    restore(one, 'aria-invalid', invalid);
                const had = (describedBy ?? '').split(/\s+/).includes(error.id);
                const rest = idsOf(one, 'aria-describedby').filter((id) => id !== error.id);
                if (!had) restore(one, 'aria-describedby', rest.length > 0 ? rest.join(' ') : null);
            }
        });
    };
    const speak = (words: string) => {
        if (words !== '') speakOn(chosen, words);
    };
    /**
     * Refuses in a part of the page: the part attached where the page refuses, with its summary,
     * and the whole form where the kit refuses its own failures, which the page's summary does not
     * hold.
     */
    const refuseIn = (within: HTMLElement, summed: boolean) => {
        pending?.();
        const failures = failed;
        failed = [];
        // Read in the same frame as focus moves, before it moves, so what a refusal says follows
        // where focus was.
        let target: HTMLElement | null = null;
        const frame = window.requestAnimationFrame(() => {
            const summary = summed ? (chosen.summary?.() ?? null) : null;
            const fields = wrongFields(within);
            const field = fields.map(focusIn).find((one) => one !== null) ?? null;
            target = summary instanceof HTMLElement ? summary : field;
            // Nothing in error and no summary leaves focus where it is. So do fields in error that
            // none can take focus in, whose first is named and its error said, and failures a page
            // that draws its own errors marked none of, whose first is said the same way.
            if (!target) {
                moving();
                const [first] = fields;
                const [unmarked] = failures;
                if (first) speak(unreachedWords(first, errorWords(first), fields.length));
                else if (unmarked)
                    speak(unreachedWords(unmarked.field, unmarked.words, failures.length));
                return;
            }
            const focused = activeOf() === target;
            speak(refusalWords({ summary, field }, focused, fields.length));
        });
        const moving = moveFocus(() => target);
        pending = () => {
            window.cancelAnimationFrame(frame);
            moving();
        };
        return pending;
    };
    const refuse: Refuse = () => refuseIn(form, true);
    // The browser's constraints, checked across the whole form as it is submitted, before the
    // page's own handler in the bubble phase, which runs only where every field passes, so it can
    // still check what they cannot express. A form is checked once however many of its parts are
    // attached, by the form's own attach where there is one, else the first part's. A button marked
    // formnovalidate submits unchecked, as with the browser's own check, and clears what the kit
    // drew, which no longer stands.
    const check = (event: SubmitEvent, whole: HTMLFormElement) => {
        const { submitter } = event;
        const failures =
            (submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement) &&
            submitter.formNoValidate
                ? []
                : failuresOf(whole, chosen.errorWords);
        const failing = new Set(failures.map(({ field }) => field));
        for (const field of [...drawn.keys()]) if (!failing.has(field)) undraw(field);
        if (failures.length === 0) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        failed = failures;
        if (chosen.invalid) {
            chosen.invalid(failures);
            return;
        }
        for (const failure of failures) draw(failure);
        refuseIn(whole, false);
    };
    const clear = () => {
        for (const field of [...drawn.keys()]) undraw(field);
    };
    if (own && (own === form || !checkers.has(own))) checkers.set(own, { check, clear });
    if (own && !checkedForms.has(own)) {
        checkedForms.add(own);
        own.addEventListener(
            'submit',
            (event) => {
                checkers.get(own)?.check(event, own);
            },
            { capture: true }
        );
        // A reset a page calls off leaves the errors, since the values that failed stay.
        own.addEventListener('reset', (event) => {
            window.setTimeout(() => {
                if (!event.defaultPrevented) checkers.get(own)?.clear();
            });
        });
    }
    attachedForms.set(form, {
        refuse,
        set: (next) => {
            chosen = next;
        },
    });
    return refuse;
};

/** How a group's cells are laid out, which sets the arrow keys that move among them. */
export type RovingOrientation = 'grid' | 'horizontal' | 'vertical';

/** How a group of cells is attached. */
export type RovingOptions = {
    /**
     * Grid moves by the arrows each way as the cells are drawn, horizontal by left and right alone,
     * vertical by up and down alone. A tablist takes its aria-orientation, else horizontal, and any
     * other group a grid.
     */
    readonly orientation?: RovingOrientation | undefined;
    /** The cell the Tab key lands on, such as the chosen tab, read as the stop is placed. */
    readonly current?: (() => Element | null) | undefined;
    /**
     * Called with the cell the arrows, Home or End moved focus to, for a page that chooses on it,
     * and never for a cell marked off, which is reached to hear why but never chosen.
     */
    readonly onMove?: ((cell: HTMLElement) => void) | undefined;
};

/** Where a cell is drawn. */
type Cell = {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
};

const ROVING_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];

/** The cell nearest across in the row above or below one, by where the cells are drawn. */
const acrossFrom = (at: number, boxes: readonly Cell[], down: boolean): number => {
    const here = boxes[at];
    if (!here) return at;
    const rows = boxes
        .map((box, index) => ({ box, index }))
        .filter(({ box }) =>
            down ? box.top >= here.top + here.height / 2 : box.top + box.height / 2 <= here.top
        );
    const first = rows.reduce<Cell | null>(
        (near, { box }) => (!near || (down ? box.top < near.top : box.top > near.top) ? box : near),
        null
    );
    if (!first) return at;
    // A cell is in that row when its middle falls within the row's height, so a cell drawn a
    // fraction of a pixel lower is not left out of it.
    const middle = here.left + here.width / 2;
    const row = rows.filter(({ box }) => {
        const center = box.top + box.height / 2;
        return center >= first.top && center <= first.top + first.height;
    });
    const distance = (box: Cell) => Math.abs(box.left + box.width / 2 - middle);
    return row.reduce((best, one) => (distance(one.box) < distance(best.box) ? one : best)).index;
};

/**
 * The cell a key moves to from a cell, or the cell itself where the key does not move this way. A
 * row or a column wraps from one end to the other, as the tabs pattern has it, and a grid stops at
 * its ends. The cells' boxes and the reading direction are read only for the keys that need them.
 */
const rovedTo = (
    key: string,
    at: number,
    cells: readonly HTMLElement[],
    group: { readonly orientation: RovingOrientation; readonly element: HTMLElement }
): number => {
    const last = cells.length - 1;
    if (key === 'Home') return 0;
    if (key === 'End') return last;
    const vertical = key === 'ArrowUp' || key === 'ArrowDown';
    const { orientation } = group;
    if (vertical ? orientation === 'horizontal' : orientation === 'vertical') return at;
    if (vertical && orientation === 'grid')
        return acrossFrom(
            at,
            cells.map((cell) => cell.getBoundingClientRect()),
            key === 'ArrowDown'
        );
    const rightToLeft = !vertical && getComputedStyle(group.element).direction === 'rtl';
    const back = vertical ? 'ArrowUp' : rightToLeft ? 'ArrowRight' : 'ArrowLeft';
    const step = key === back ? -1 : 1;
    if (orientation === 'grid') return Math.min(last, Math.max(0, at + step));
    return (at + step + cells.length) % cells.length;
};

const attachedGroups = new WeakMap<
    HTMLElement,
    { readonly detach: () => void; readonly set: (next: RovingOptions) => void }
>();

const CELLS = ':scope > :is(button, a[href], [role="tab"])';

/**
 * The cells of a group: its buttons, links and tabs, in order, leaving out one that is disabled,
 * inert or out of sight, which could take no focus and so could not be the group's stop.
 */
const cellsIn = (group: HTMLElement): HTMLElement[] =>
    [...group.querySelectorAll<HTMLElement>(CELLS)].filter(takesFocus);

/** Each cell's own tabindex before a group was attached, put back as the group is let go. */
const ownTabIndex = new WeakMap<HTMLElement, string | null>();

/** The cell to hand focus to where one was taken out: the next still there, else the one before. */
const inPlaceOf = (
    gone: HTMLElement,
    before: readonly HTMLElement[],
    now: readonly HTMLElement[]
): HTMLElement | undefined => {
    const at = before.indexOf(gone);
    const after = before.slice(at + 1).find((cell) => now.includes(cell));
    return (
        after ??
        before
            .slice(0, Math.max(at, 0))
            .reverse()
            .find((cell) => now.includes(cell)) ??
        now[0]
    );
};

/**
 * Gives a group of cells, such as a grid of buttons or a row of tabs, one stop for the Tab key and
 * moves focus among its cells with the arrow keys, Home and End, and returns what takes it away. A
 * grid moves up and down to the nearest cell in the row above or below as the cells are drawn, so
 * it holds at any count of columns, and left and right follow the page's reading direction. A row
 * of tabs ignores up and down and wraps from one end to the other. An arrow held with Alt, Control
 * or Command is left to the browser. The stop is the cell the page names as current, else a
 * tablist's chosen tab, else the one focus last reached, else the first, and a cell that is
 * disabled, inert or out of sight is never the stop. A cell marked off keeps its place, as it does
 * in the tab order, and is never handed to `onMove`. The kit moves focus and the page chooses: a
 * page that chooses a tab as focus reaches it does so in `onMove`. A grid of buttons with the
 * group's role, or none, takes the toolbar's, so a screen reader says the arrows move within it.
 * Where the cell that had focus is taken out, focus goes to the next cell still there, or the one
 * before. Let go, each cell takes back its own tabindex and the grid its own role. Attached again,
 * a group returns what it returned first and takes options given in place of the last.
 */
export const attachRoving = (group: HTMLElement, options?: RovingOptions): (() => void) => {
    const already = attachedGroups.get(group);
    if (already) {
        if (options) already.set(options);
        return already.detach;
    }
    let chosen: RovingOptions = options ?? {};
    let last: HTMLElement | null = null;
    // The cell holding focus, so one taken out hands focus on only where it held it.
    let holding: HTMLElement | null = null;
    const tablist = group.getAttribute('role') === 'tablist';
    const orientation = (): RovingOrientation =>
        chosen.orientation ??
        (tablist
            ? group.getAttribute('aria-orientation') === 'vertical'
                ? 'vertical'
                : 'horizontal'
            : 'grid');
    const stopOf = (cells: readonly HTMLElement[]): HTMLElement | undefined => {
        const named =
            chosen.current?.() ?? (tablist ? group.querySelector('[aria-selected="true"]') : null);
        return (
            cells.find((cell) => cell === named) ?? cells.find((cell) => cell === last) ?? cells[0]
        );
    };
    const place = () => {
        const cells = cellsIn(group);
        const stop = stopOf(cells);
        for (const cell of group.querySelectorAll<HTMLElement>(CELLS)) {
            if (!ownTabIndex.has(cell)) ownTabIndex.set(cell, cell.getAttribute('tabindex'));
            const wanted = cell === stop ? '0' : '-1';
            if (cell.getAttribute('tabindex') !== wanted) cell.setAttribute('tabindex', wanted);
        }
    };
    const onKey = (event: KeyboardEvent) => {
        if (event.altKey || event.ctrlKey || event.metaKey || !ROVING_KEYS.includes(event.key))
            return;
        const cells = cellsIn(group);
        const from = cells.findIndex((cell) => cell === event.target);
        if (from < 0) return;
        const to = rovedTo(event.key, from, cells, { orientation: orientation(), element: group });
        const cell = cells[to];
        if (to === from || !cell) return;
        event.preventDefault();
        // Focus reaching the cell places the stop, through the group's focus listener.
        cell.focus();
        if (!isOff(cell)) chosen.onMove?.(cell);
    };
    const cellOf = (target: EventTarget | null) =>
        cellsIn(group).find((one) => target instanceof Node && one.contains(target));
    const onReach = (event: Event) => {
        const cell = cellOf(event.target);
        if (!cell) return;
        last = cell;
        if (event.type === 'focusin') holding = cell;
        place();
    };
    // Focus that went somewhere outside lets the group go, and so does focus that went to nothing
    // from a cell still on the page, as a press on the page's background sends it. Focus that went
    // to nothing as the cell holding it was taken out is still held here, so it is handed on.
    const onLeave = (event: FocusEvent) => {
        const to = event.relatedTarget;
        if (to instanceof Node) {
            if (!group.contains(to)) holding = null;
            return;
        }
        const from = event.target;
        queueMicrotask(() => {
            if (from instanceof Element && from.isConnected) holding = null;
        });
    };
    let before = cellsIn(group);
    const kept = new MutationObserver(() => {
        const cells = cellsIn(group);
        const gone = last && !cells.includes(last) ? last : null;
        if (gone) {
            const next = inPlaceOf(gone, before, cells) ?? null;
            last = next;
            const fell = activeOf() === document.body || activeOf() === null;
            if (holding === gone && fell && next) next.focus();
        }
        before = cells;
        place();
    });
    kept.observe(group, {
        childList: true,
        subtree: true,
        attributeFilter: ['aria-selected', 'hidden', 'disabled', 'inert', 'class', 'style'],
    });
    const listening = new AbortController();
    const { signal } = listening;
    group.addEventListener('keydown', onKey, { signal });
    group.addEventListener('focusin', onReach, { signal });
    group.addEventListener('focusout', onLeave, { signal });
    // Safari leaves a tapped button without focus, so a press places the stop too.
    group.addEventListener('click', onReach, { signal });
    const ownRole = group.getAttribute('role');
    const toolbar = group.matches('.dk-button-grid') && (ownRole === null || ownRole === 'group');
    if (toolbar) group.setAttribute('role', 'toolbar');
    place();
    const detach = () => {
        listening.abort();
        kept.disconnect();
        for (const cell of group.querySelectorAll<HTMLElement>(CELLS)) {
            if (!ownTabIndex.has(cell)) continue;
            const own = ownTabIndex.get(cell) ?? null;
            if (own === null) cell.removeAttribute('tabindex');
            else cell.setAttribute('tabindex', own);
            ownTabIndex.delete(cell);
        }
        if (toolbar) {
            if (ownRole === null) group.removeAttribute('role');
            else group.setAttribute('role', ownRole);
        }
        attachedGroups.delete(group);
    };
    attachedGroups.set(group, {
        detach,
        set: (next) => {
            chosen = next;
            place();
        },
    });
    return detach;
};

/** How a busy button is attached, for the words it says once a wait is long enough to notice. */
export type BusyOptions = {
    /** The status line the busy words are said on, such as the screen's own. */
    readonly status?: HTMLElement | null | undefined;
    /** What says the busy words, for a page that has one already, such as React's `useStatus`. */
    readonly say?: Say | undefined;
};

/**
 * The wait before a busy button says it is busy, the delay the sheet holds its look back by, read
 * as the button is drawn busy, so the words and the look keep one clock whatever --dk-wait is set
 * to, and a page that takes the delay away has the words said at once with the look.
 */
const waitOf = (button: Element): number => {
    const first = getComputedStyle(button).transitionDelay.split(',')[0]?.trim() ?? '';
    const amount = Number.parseFloat(first);
    if (Number.isNaN(amount)) return 0;
    return first.endsWith('ms') ? amount : amount * 1000;
};

const attachedBusy = new WeakMap<
    HTMLElement,
    { readonly detach: () => void; readonly set: (next: BusyOptions) => void }
>();

/**
 * Makes a busy button work, one marked `data-busy` while what its press started runs, and returns
 * what takes it away. While it is busy the attach marks it `aria-disabled` too, where the page has
 * not, and takes away only the mark it set when the work is done. A press of a busy button, by a
 * pointer or by Enter or Space, is stopped before the button's own handlers and React's `onClick`
 * hear it, so a submit button submits nothing, though a capture listener further up still hears
 * it. Once the button has been busy for the wait the sheet holds its look back by, --dk-wait, its
 * words are said once on the status line, the `data-busy` value, or "Saving." where it is empty,
 * so a fast save says nothing. Words not yet on the line when the work is done are dropped, so a
 * result a toast says is never followed by a late "Saving.", and a button made busy again before
 * the last wait ended starts a wait of its own. Attached again, a button returns what it returned
 * first and takes options given in place of the last.
 */
export const attachBusy = (button: HTMLElement, options?: BusyOptions): (() => void) => {
    const already = attachedBusy.get(button);
    if (already) {
        if (options) already.set(options);
        return already.detach;
    }
    let chosen: BusyOptions = options ?? {};
    let timer = 0;
    let marked = false;
    // Each busy run counts, so a notice waiting from a run that ended says nothing in another.
    let runs = 0;
    const busy = () => button.hasAttribute('data-busy');
    const speak = () => {
        if (!busy()) return;
        const given = button.getAttribute('data-busy') ?? '';
        const words = given === '' ? 'Saving.' : given;
        const run = runs;
        const still = () => (busy() && run === runs ? words : null);
        // Polite, as a notice that work goes on, so it gives way to a result, and the end of a
        // progress said beside it, which is polite too, takes its place rather than being dropped.
        speakOn(chosen, still, { polite: true });
    };
    const start = () => {
        runs += 1;
        window.clearTimeout(timer);
        if (button.getAttribute('aria-disabled') !== 'true') {
            button.setAttribute('aria-disabled', 'true');
            marked = true;
        }
        timer = window.setTimeout(speak, waitOf(button));
    };
    const end = () => {
        runs += 1;
        window.clearTimeout(timer);
        if (marked) button.removeAttribute('aria-disabled');
        marked = false;
    };
    // A record whose old value is null is the mark arriving, so a busy that ends and starts again
    // within one task still starts a wait of its own.
    const kept = new MutationObserver((records) => {
        if (!busy()) end();
        else if (records.some(({ oldValue }) => oldValue === null)) start();
    });
    kept.observe(button, { attributeFilter: ['data-busy'], attributeOldValue: true });
    const stop = (event: Event) => {
        if (!busy()) return;
        event.preventDefault();
        event.stopImmediatePropagation();
    };
    const listening = new AbortController();
    button.addEventListener('click', stop, { capture: true, signal: listening.signal });
    if (busy()) start();
    const detach = () => {
        listening.abort();
        kept.disconnect();
        end();
        attachedBusy.delete(button);
    };
    attachedBusy.set(button, {
        detach,
        set: (next) => {
            chosen = next;
        },
    });
    return detach;
};

/** How progress is said, for the steps it is said at, where, and what is said at the end. */
export type ProgressOptions = {
    /**
     * How many equal steps the amount is said at, 4 for each quarter until a page sets it. The end
     * is said once whatever the steps.
     */
    readonly steps?: number | undefined;
    /** What is said at the end in place of the label and the words, such as "Imported 40 products." */
    readonly done?: string | undefined;
    /** The status line progress is said on, such as the screen's own. */
    readonly status?: HTMLElement | null | undefined;
    /** What says progress, for a page that has one already, such as React's `useStatus`. */
    readonly say?: Say | undefined;
};

/** The least time between two steps said, in milliseconds, so one is heard before the next. */
const STEP_GAP = 3000;

const attachedProgress = new WeakMap<
    HTMLProgressElement,
    { readonly detach: () => void; readonly set: (next: ProgressOptions) => void }
>();

/** An element's name as a screen reader reads it: its label, the words it names, or its own. */
const nameOf = (element: HTMLProgressElement) =>
    [
        element.labels[0]?.textContent.trim() ?? '',
        namedText(element, 'aria-labelledby'),
        (element.getAttribute('aria-label') ?? '').trim(),
    ].find((name) => name !== '') ?? '';

/**
 * Says how far a `progress` element has come on the status line given, at the steps the page sets,
 * each quarter until it sets others, and once at the end, and returns what takes it away. What is
 * said is the bar's name and the words that describe it, such as "Importing products, 12 of 40.",
 * read as the step is crossed, or how far it has come in hundredths where it has no words. Each is
 * said at once, with no wait for the amount to stop changing, since a steady import never stops, at
 * least three seconds after the last step so one is heard before the next, while the end never
 * waits. Every word it says gives way to any other on the line, so a page's own result or failure
 * is never put out by it. The end, or the `done` words in its place, is said once, until the amount
 * goes back for another run. The amount a bar first shows, as it is attached or once it is known,
 * is not said unless it is the end, and a bar with no amount says nothing. Attached again, a bar returns what it
 * returned first and takes options given in place of the last.
 */
export const attachProgress = (
    progress: HTMLProgressElement,
    options?: ProgressOptions
): (() => void) => {
    const already = attachedProgress.get(progress);
    if (already) {
        if (options) already.set(options);
        return already.detach;
    }
    let chosen: ProgressOptions = options ?? {};
    const known = () => progress.hasAttribute('value');
    const stepOf = () => {
        const steps = Math.max(1, Math.floor(chosen.steps ?? 4));
        // A hair over, so a boundary a fraction lands just under, as 57 hundredths does, counts.
        return Math.floor(Math.min(1, progress.position) * steps + 1e-9);
    };
    let reached = known() ? stepOf() : -1;
    let ended = known() && progress.position >= 1;
    let lastSaid = -Infinity;
    const words = () => {
        const name = nameOf(progress);
        const amount =
            namedText(progress, 'aria-describedby') ||
            `${String(Math.round(progress.position * 100))}%`;
        const said = name ? `${name}, ${amount}` : amount;
        return /[.!?]$/.test(said) ? said : `${said}.`;
    };
    const speak = (message: string) => {
        speakOn(chosen, message, { polite: true });
    };
    const check = () => {
        if (!known()) {
            reached = -1;
            ended = false;
            return;
        }
        const now = stepOf();
        const first = reached < 0;
        if (progress.position >= 1) {
            if (!ended) speak(chosen.done ?? words());
            ended = true;
            reached = now;
            return;
        }
        if (first || now < reached || ended) {
            // The amount first known, or gone back for a new run, is where saying starts from.
            ended = false;
            reached = now;
            return;
        }
        if (now > reached) {
            reached = now;
            const at = performance.now();
            if (at - lastSaid < STEP_GAP) return;
            lastSaid = at;
            speak(words());
        }
    };
    const kept = new MutationObserver(check);
    kept.observe(progress, { attributeFilter: ['value', 'max'] });
    const detach = () => {
        kept.disconnect();
        attachedProgress.delete(progress);
    };
    attachedProgress.set(progress, {
        detach,
        set: (next) => {
            chosen = next;
            // Counted again in the new steps, so the next step is one of them.
            if (known()) reached = stepOf();
        },
    });
    return detach;
};
