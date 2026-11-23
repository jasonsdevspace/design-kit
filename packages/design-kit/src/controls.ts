import {
    claimLine,
    hush,
    lineOf,
    releaseLine,
    SAID_FOR,
    say,
    sayOn,
    speakOn,
    type Spoken,
    unsay,
} from './line.js';
import { join, keep, type Kept, teardown } from './teardown.js';
import { THEME_CHOICES, THEME_KEY, type ThemeChoice } from './theme.js';

/*
 * What the kit's theme switch, copy button, stepper, toast, dialog, panel, table and status line
 * do, with moving focus after a change and on a view's arrival, the arrow keys in a group of cells,
 * a form's check and refusal, a busy button and progress, for a page to attach to the markup the
 * components draw or a page writes by hand. Each attach function finds its control's parts by their
 * classes, and `attachPanel` its panel by the id its button names. The switch, the copy button and
 * the stepper show their control, which the markup keeps hidden so a visitor without script meets
 * no control that does nothing, and return a function that takes it down again, as the table's, the
 * group's, the busy button's and progress's do. `attachToast` returns instead the function that
 * shows a message in it, `attachDialog` the function that opens it, `attachPanel` the functions
 * that open or close its panel and take its button down, `attachStatus` the function that says a
 * message, `attachForm` the function that refuses its form, and `moveFocus` and `focusOnArrival`
 * what call their request off. Nothing runs when the module is imported but listeners on the
 * document for keys, clicks and submits, in a page, which note whether the visitor's last input was
 * a press for `focusOnArrival`, and nothing here sets a style, so a page's policy can refuse every
 * style it did not serve.
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
 * Whether a node is the place or inside it, through the shadow trees it holds and the slots a node
 * is drawn in, so a control slotted into a piece drawn inside a shadow root counts as in it.
 */
const holds = (place: Element, node: Node | null): boolean => {
    let inside = node;
    while (inside && inside !== place)
        inside =
            (inside as Partial<Element>).assignedSlot ??
            inside.parentNode ??
            (inside as Partial<ShadowRoot>).host ??
            null;
    return !!inside;
};

/**
 * Focuses the first of the elements given that takes focus, an HTML control or an SVG one such as a
 * link in an inline chart, so focus never falls to nowhere while a place for it is named. One gone
 * from the page is skipped, and one that is hidden, inert or disabled is passed over as the browser
 * refuses it focus. A control marked off is left out only where a caller checks for it, as a panel
 * does for its buttons and a focus request for its target, so the toast and the dialog hand focus
 * to one. Focus that moves onto a place or inside it, in a shadow tree it holds or on a control
 * slotted into it too, as a host that delegates focus or a widget that forwards it, counts as
 * taken, as does a place that has focus already, while a place that refuses focus is passed over
 * though focus is inside it. Where a page's own listener moves focus elsewhere as one is tried, the
 * walk stops and that focus stays.
 */
const focusFirst = (...places: readonly (Element | null | undefined)[]): boolean => {
    for (const place of places) {
        if (
            !(place instanceof HTMLElement || place instanceof SVGElement) ||
            !place.isConnected ||
            place === document.body
        )
            continue;
        const before = focusedNow();
        place.focus({ preventScroll: place.matches('.dk-app-body') });
        const now = focusedNow();
        if (holds(place, now) && (now !== before || place === before)) return true;
        if (now && now !== before) return false;
    }
    return false;
};

/**
 * Whether a piece closing or leaving may hand focus back: where focus is in it, inside a shadow
 * tree within it or on a control slotted into it too, or where focus is on the body or nowhere and
 * the piece had focus as it left, so focus a visitor or the page has put anywhere else stays. The
 * toast, the dialog and the panels hand focus back by this one rule. The stepper does not use it,
 * and hands focus back only where focus is on one of the buttons it hides.
 */
const mayHandBack = (piece: Element, had: boolean): boolean => {
    const active = focusedNow();
    return active ? holds(piece, active) : had;
};

/** The element the kit last handed focus back to as a piece closed or left, and when. */
let handedTo: Element | null = null;
let handedAt = 0;

/**
 * For each attached dialog, what had focus as it opened, which the browser hands focus back to as
 * the dialog closes, ahead of the close event. Kept until the dialog's close is handled or it is
 * taken down, until a request lands while focus is there, or until a request finds the dialog gone
 * from the page.
 */
const restoring = new Map<HTMLDialogElement, Element>();

/**
 * Hands focus back to the first of the places given that takes it, as `focusFirst` does, and keeps
 * the place it focused, so a request asked before it finds that focus free and not the visitor's.
 * A walk that focuses nothing keeps nothing, so focus a page moved during it stays the page's.
 * Returns whether it focused a place.
 */
const handBack = (...places: readonly (Element | null | undefined)[]): boolean => {
    if (!focusFirst(...places)) return false;
    handedTo = activeOf();
    handedAt = performance.now();
    return true;
};

/** Where focus is asked to go: an element, an element's id, one found as focus moves, or nothing. */
export type FocusTarget = Element | string | (() => Element | null) | null | undefined;

/** Where focus goes when nothing nearer takes it, the app frame's body or the main content. */
const homeOf = (element: Element): Element | null =>
    element.closest('.dk-app')?.querySelector('.dk-app-body') ??
    rootOf(element).querySelector('main') ??
    document.querySelector('main');

/**
 * How focus is moved after a change, and the signal that calls the request off. A request asked as
 * its component unmounts is meant to land, as record 20 has it, so it is given no signal that the
 * same unmount aborts.
 */
export type MoveFocusOptions = AttachOptions & {
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
const byId = (near: Node | null | undefined, id: string): Element | null =>
    rootOf(near).getElementById(id);

/**
 * What has focus, followed into each shadow root that holds it, as a request reads where focus was
 * when it was asked for.
 */
export const activeOf = (): Element | null => {
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

/**
 * Focuses a request's target or a fallback, where focus is still where it was, or where the kit has
 * handed it back since the request was asked, and the request is fresh.
 */
const land = (
    target: FocusTarget,
    fallbacks: readonly FocusTarget[] | undefined,
    from: Element | null,
    asked: number
) => {
    if (performance.now() - asked > STALE) return;
    const now = focusedNow();
    // A dialog taken from the page with no takedown hands nothing back, so its place goes.
    for (const [dialog] of restoring) if (!dialog.isConnected) restoring.delete(dialog);
    // Focus on what had it as a dialog opened is free while that dialog is closed and its close
    // not yet handled, since the browser put it there as the dialog closed. A request that lands
    // takes that place from the dialog, so its close event leaves focus where the request put it.
    const restored = [...restoring].filter(([dialog, to]) => to === now && !dialog.open);
    if (now && now !== from && (now !== handedTo || handedAt < asked) && !restored[0]) return;
    const place = placeOf(target, from);
    if (
        focusFirst(
            place,
            ...(fallbacks ?? []).map((fallback) => placeOf(fallback, from)),
            homeOf(place ?? from ?? document.body)
        )
    )
        for (const [dialog] of restored) restoring.delete(dialog);
};

/**
 * Moves focus to a control once a change is drawn, such as the field a refusal points at or the
 * next player's entry, and returns what calls it off before it lands, as its `signal` does a
 * microtask after it aborts, which is still before the frame the request waits for. It waits for
 * the next frame, so a page that draws the control in answer to the same press or key has drawn it,
 * and finds an id then. A change React draws later, in a transition or behind a suspense, asks from
 * an effect once it is drawn. Where the target is gone from the page, hidden, inert, disabled or
 * off, focus goes to the first fallback that takes it, and then to the app frame's body or the
 * page's main content, by the walk a closing panel hands focus back by, so it does not fall to the
 * page. Focus a visitor has moved since the request is left where they put it: focus is free only
 * while it is where it was when asked, on the page's body, or where the kit has handed it back
 * since, as a toast, a dialog or a panel does as it closes and a stepper as it is taken down, or on
 * what the browser hands it to as a dialog closes, until the dialog's close is handled. A request
 * still waiting a second later, as in a tab out of sight, is dropped, so focus does not jump when
 * the visitor comes back.
 * Each request is new, so a control asked for twice is focused twice.
 */
export const moveFocus = (target: FocusTarget, options: MoveFocusOptions = {}): (() => void) => {
    // Aborting calls off a request that has not landed, as the function it returns does, and one
    // already landed is left where it put focus. A signal already aborted asks for nothing.
    if (options.signal?.aborted) return () => undefined;
    const down = teardown(options.signal);
    const from = options.from === undefined ? activeOf() : options.from;
    const asked = performance.now();
    const frame = window.requestAnimationFrame(() => {
        // Stopped as it lands, so a signal the page keeps for longer holds nothing of the request.
        down.stop();
        land(target, options.fallbacks, from, asked);
    });
    down.add(() => {
        window.cancelAnimationFrame(frame);
    });
    return down.stop;
};

/** A button or a link by its role, which Enter presses, and Space too but for a link. */
const ROLE_ACTIVATOR = '[role="button"], [role="link"], [role="menuitem"]';
/** What a press is made on: a button or a link, native or by its role. */
const ACTIVATOR = [
    'button',
    'a[*|href]',
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
const attachedSwitches = new WeakMap<HTMLElement, Kept<() => void>>();
/**
 * How a page takes a piece down with an `AbortSignal`, as records 22 and 23 have it. Each signal an
 * attach of the element is given holds the piece, and once every one of them has aborted, the piece
 * is taken down a microtask later, as its detach takes it down at once. An attach of the same
 * element before then keeps the piece as it was, so a page that aborts and attaches again in one
 * task, as a ref made afresh on every render does, keeps it, and one that attaches after a
 * microtask starts afresh. Attached again, a piece returns what its attach returned first and runs
 * on the options of its newest holder. A signal already aborted does nothing.
 */
export type AttachOptions = { readonly signal?: AbortSignal | undefined };
/** What a copy button reads, which attaching it again replaces, and the signal that holds it. */
export type CopyOptions = AttachOptions & {
    readonly source: () => HTMLElement;
    readonly status: HTMLElement;
};
const attachedButtons = new WeakMap<HTMLElement, Kept<() => void, CopyOptions>>();

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
        const held = holds(group, activeOf());
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

/**
 * The function each attached line says by, kept so attaching it again returns the same one, and
 * what takes that attach down.
 */
const attachedLines = new WeakMap<HTMLElement, Kept<Say>>();

/**
 * Returns the function that says a message on a status line, which a page draws out of sight and
 * puts on the page from the start, so a screen reader hears each message without focus moving. A
 * message is put in a moment after the line is emptied, so the same words said twice are heard
 * twice, and leaves after a while, so reading by line finds no old words. A message is said at once
 * unless it asks to settle, when it waits that long for its words to stop changing, and words said
 * again in the meantime take its place. Firm words said on the line drop words still settling, and
 * polite words give way to firm words said with them or still settling, and wait for firm words
 * being said, so the last words said are the ones heard. A screen keeps a line of its own for this,
 * as a toast and a stepper keep theirs. It speaks through the same function as the copy button and
 * the stepper, so a line handed to a copy button too keeps one timer, and a later message replaces
 * an earlier one. Attached again, a line returns the function it returned first, its `signal` one
 * more holder, unless the line was let go of, when it returns one afresh and the old attach is
 * taken down at once. Taken down by its `signal`, as `StatusProvider` takes its line down when it
 * unmounts, it lets the line go, so no piece says anything on it until it is attached again. The
 * function an attach returned says nothing once that attach is taken down, while a piece given the
 * line itself speaks on its next attach. A signal already aborted returns a function that says
 * nothing.
 */
export const attachStatus = (line: HTMLElement, options?: AttachOptions): Say => {
    // A signal already aborted does nothing, even to a line already attached.
    if (options?.signal?.aborted) return () => undefined;
    // A line let go of while still attached, as a toast's own line is when the toast is taken down,
    // is attached afresh, and its old attach taken down first, which drops it from the map, so the
    // old attach's signal holds nothing of it and the join below finds none.
    if (lineOf(line).released) attachedLines.get(line)?.down.stop();
    const already = join(attachedLines, line, options);
    if (already) return already;
    const down = teardown(options?.signal);
    claimLine(line);
    const speak: Say = (message, given) => {
        if (!down.signal.aborted) sayOn(line, message, given);
    };
    down.add(() => {
        releaseLine(line);
    });
    return keep(attachedLines, line, down, speak);
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
 * last source back to Copy where the new source gives another element, and returns what it
 * returned the first time. Its `signal` takes it down as the function it returns does. A signal
 * already aborted does nothing, so a button not yet attached stays hidden and one already attached
 * stays as it is.
 */
export const attachCopyButton = (button: HTMLButtonElement, options: CopyOptions): (() => void) => {
    // A signal already aborted does nothing, so even new options for a button already attached are
    // not taken.
    if (options.signal?.aborted) return () => undefined;
    const already = join(attachedButtons, button, options);
    if (already) return already;
    const down = teardown(options.signal, options);
    let { source, status } = options;
    const words = [...button.querySelectorAll<HTMLElement>('.dk-copy-words > *')];
    let timer = 0;
    // The element the word shown was copied from, while one is shown.
    let copiedFrom: HTMLElement | null = null;
    const showWord = (index: number) => {
        words.forEach((word, at) => {
            if (at === index) word.removeAttribute('aria-hidden');
            else word.setAttribute('aria-hidden', 'true');
        });
    };
    const onClick = () => {
        const pressed = source();
        void copied(pressed.textContent).then((done) => {
            if (down.signal.aborted) return;
            // A source changed while the clipboard answered is not selected, and the button is left
            // as the change left it, but the status line still says what happened.
            if (source() !== pressed) {
                say(status, done ? 'Copied.' : 'Not copied. Press Copy again.');
                return;
            }
            if (!done) select(pressed);
            copiedFrom = pressed;
            showWord(done ? 1 : 2);
            say(status, done ? 'Copied.' : howToCopy());
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                copiedFrom = null;
                showWord(0);
            }, SAID_FOR);
        });
    };
    // A word shown for the element a press copied is put back to Copy where the new source gives
    // another, so it never claims that one copied, and kept where it gives the same. The source is
    // read only while a word is shown, and one that throws, as one reading a ref not yet drawn
    // does, counts as another.
    // A call that gives no source or status line, as the defaults a holder that gave none goes back
    // to, keeps the ones the button has, since a copy button has neither of its own.
    const set = (next: CopyOptions) => {
        ({ source = source, status = status } = next);
        if (!copiedFrom) return;
        try {
            if (source() === copiedFrom) return;
        } catch {
            // Taken as another element.
        }
        copiedFrom = null;
        window.clearTimeout(timer);
        showWord(0);
    };
    button.addEventListener('click', onClick, { signal: down.signal });
    button.hidden = false;
    down.add(() => {
        window.clearTimeout(timer);
        showWord(0);
        button.hidden = true;
    });
    down.set = set;
    return keep(attachedButtons, button, down, down.stop);
};

/** How long a toast with no action stays while nothing holds it, in milliseconds. */
const TOAST_FOR = 5000;

/** What a toast offers beside its message: the action's words, and what choosing it does. */
export type ToastAction = { readonly label: string; readonly onAction: () => void };

/** Shows a message in a toast, with one action or none, and returns what dismisses that message. */
export type ShowToast = (message: string, action?: ToastAction) => () => void;

const attachedToasts = new WeakMap<HTMLElement, Kept<ShowToast>>();

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
 * Scrolls the control that had focus as a message came, where a shown toast covers it, clear of the
 * toast by the scroll padding the sheet keeps under it. The toast is measured where it comes to
 * rest, without the rise it starts its entrance on, read from its computed translate and taken as
 * none where that is not in pixels. Where focus was in a frame of the page's own origin, it
 * measures the control read inside the frame, placed past the frame's border and padding, scaled
 * across and down as the frame is drawn, and cut to what the frame shows inside its scrollbars, so
 * a control the frame has scrolled out of sight counts as covered nowhere. A frame rotated or
 * skewed is measured by its bounding box. That control's own scroll into view moves the frame's
 * document and the page. One the toast leaves alone, beside it or above it, or one taller than the
 * room above the toast, such as the body of the app's frame, stays where it is.
 */
const clearOf = (element: HTMLElement, active: Element, inner: Element | null | undefined) => {
    const control = inner ?? active;
    const card = element.getBoundingClientRect();
    const rise = Number(
        /^\S+ (-?[\d.]+)px/.exec(String(getComputedStyle(element).translate))?.[1] ?? 0
    );
    let { top, right, bottom, left, height } = control.getBoundingClientRect();
    if (inner) {
        const frame = active as HTMLElement;
        const place = frame.getBoundingClientRect();
        const edges = getComputedStyle(frame);
        const across = place.width / frame.offsetWidth;
        const down = place.height / frame.offsetHeight;
        const x = place.left + (frame.clientLeft + parseFloat(edges.paddingLeft)) * across;
        const y = place.top + (frame.clientTop + parseFloat(edges.paddingTop)) * down;
        const view = inner.ownerDocument.scrollingElement ?? inner.ownerDocument.documentElement;
        [top, right, bottom, left, height] = [
            y + Math.max(top, 0) * down,
            x + Math.min(right, view.clientWidth) * across,
            y + Math.min(bottom, view.clientHeight) * down,
            x + Math.max(left, 0) * across,
            height * down,
        ];
    }
    if (
        bottom > Math.max(top, card.top - rise) &&
        top < card.bottom - rise &&
        right > Math.max(left, card.left) &&
        left < card.right &&
        height < card.top - rise
    )
        control.scrollIntoView({ block: 'nearest' });
};

/**
 * Makes a toast work, and returns the function that shows a message in it. The message is drawn in
 * the toast and said on its status line, which is on the page from the start, so a screen reader
 * hears it without focus moving, with the action's name when it has one, so a visitor who cannot
 * see it learns there is a way back. The line keeps it until the toast leaves, and is what a screen
 * reader reads in the toast, since the words drawn are hidden from it. The same words shown twice
 * are heard twice. A shown toast is marked by its data-shown attribute, which a page that draws it
 * again, as React does with its class, leaves alone. The dk-toast-shown class is set beside it for
 * a page that reads it, though such a redraw takes the class away while the toast stays shown. As a
 * message shows, the control that has focus is scrolled clear of the toast where the toast,
 * measured where it comes to rest, would cover it across as well as down. With focus inside a frame
 * of the page's own origin, that is the control that has focus there, read as the message comes and
 * measured where the frame places it, past the frame's border and padding, scaled across and down
 * as the frame is drawn and cut to what the frame shows inside its scrollbars, so a tall frame does
 * not hide it. A frame of another origin, or one where only its body has focus, is measured whole.
 *
 * A toast leaves when its close button, its action or Escape with focus in it dismisses it, or the
 * next message replaces it. One with an action stays until then, since a timer would take the
 * action away from anyone slower than it. One with no action also leaves after five seconds, a wait
 * held while the pointer is over it or focus is in it. When a toast leaves with focus in it, focus
 * goes to the first of these that takes it: the control focus last came into the toast from, then
 * the control outside the toast that had focus as the latest message came, then the body of the
 * app's frame, or on a page with no frame its main content. The first is passed over where focus
 * last came into the toast from nowhere. Focus goes back only where it is in the toast, inside a
 * shadow tree within it or on a control slotted into it too, or where the page has taken the toast
 * away with focus in it so that focus has fallen to the body or to nothing, while focus a visitor
 * has put anywhere else stays. Its Close and its action take a tabindex of 0 where the page set
 * none, so Safari, which focuses a pressed button only where it has one, leaves focus in the toast
 * on a press or a tap and focus can go back as it leaves. Attaching a toast again returns the same
 * function, its message still shown. Taken down by its `signal`, it dismisses its message as its
 * Close does, takes off its listeners, its observer, its listener on the window's size and its
 * timer, takes away the tabindex it added and lets its line go, and the function it returned, and
 * what that returned, do nothing after. A signal already aborted returns a function that shows
 * nothing.
 *
 * Focus leaves the toast where nothing on the list takes it, so it falls to the page's body rather
 * than staying on the toast's hidden button. The toast takes off its shown state before it hands
 * focus back, so the room the sheet keeps under a shown toast does not scroll the control focus
 * goes to. Where a page's own listener moves focus elsewhere as the toast hands it back, the toast
 * goes no further down the list and that focus stays. A page sees focus inside a frame only as the
 * frame, and focus that comes into the toast from inside a frame as coming from nowhere. Where its
 * handback focuses a frame of the page's own origin, it goes on to the control that had focus there
 * as the latest message came, read as the message came, and stays on the frame where that control
 * is gone, marked off, on a page the frame has since replaced, and on a frame of another origin. A
 * frame inside that frame is not followed, so focus goes back to the inner frame itself. Firefox
 * does not focus a frame of another origin while a key is being pressed, so a dismiss by keyboard
 * there goes on down the list.
 */
export const attachToast = (element: HTMLElement, options?: AttachOptions): ShowToast => {
    const part = <T extends HTMLElement>(name: string) => {
        const found = element.querySelector<T>(`.dk-toast-${name}`);
        if (!found) throw new Error(`a toast needs its ${name}`);
        return found;
    };
    const message = part('message');
    const status = part('status');
    const actionButton = part<HTMLButtonElement>('action');
    const close = part<HTMLButtonElement>('close');
    // Checked after the parts, so markup missing one throws whatever the signal. A signal already
    // aborted does nothing, even to a toast already attached.
    if (options?.signal?.aborted) return () => () => undefined;
    const already = join(attachedToasts, element, options);
    if (already) return already;
    const down = teardown(options?.signal);
    const { signal } = down;
    // Safari focuses a pressed button only where it has a tabindex, so a press of either button
    // leaves focus in the toast and it goes back as the toast hides. A page's own is kept.
    const given = [actionButton, close].filter((button) => !button.hasAttribute('tabindex'));
    for (const button of given) button.tabIndex = 0;
    // The toast's own line, let go of as an earlier attach was taken down, speaks for this one.
    claimLine(status);
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
    // Whether focus was in the toast as it was taken from the page, read for the handback alone.
    let leftWith = false;
    let onAction: (() => void) | undefined;
    // The control focus came into the toast from, where focus was as the latest message came, and
    // the element that last lost focus, read inside open shadow roots, which an event's related
    // target names only by its host.
    let cameFrom: Element | undefined;
    let arrivedAt: Element | undefined;
    let lost: Element | undefined;
    // The control that had focus inside a frame of the page's own origin as the latest message
    // came, read then, inside an open shadow root too, since the page sees focus inside a frame
    // only as the frame and the frame's document drops its focus to its body once focus leaves.
    let inFrame: Element | null | undefined;
    const insideOf = (frame: Element | null) => {
        const inner = (frame as HTMLIFrameElement | null)?.contentDocument;
        let held = inner?.activeElement;
        while (held?.shadowRoot?.activeElement) held = held.shadowRoot.activeElement;
        return held === inner?.body ? undefined : held;
    };
    const wait = () => {
        window.clearTimeout(timer);
        if (shown && !onAction && !hovered && !focused) {
            timer = window.setTimeout(dismiss, TOAST_FOR);
        }
    };
    const dismiss = () => {
        window.clearTimeout(timer);
        // Focus goes back by the rule every piece hands it back by, the toast having had it as it
        // left where focus was in it as it was taken from the page.
        const hadFocus = mayHandBack(element, !element.isConnected && (focused || leftWith));
        shown = 0;
        focused = false;
        leftWith = false;
        onAction = undefined;
        // Focus that was in the toast goes back to the control it came in from, then to where it
        // was as the message came, on to the control inside it where that is a frame of the page's
        // own origin, then to the body of the app's frame or the page's main content. The shown
        // state comes off first, so the room the sheet keeps under a shown toast is gone and the
        // control focus goes to is not scrolled clear of a toast that is leaving. The buttons stay
        // drawn until after, so no engine moves focus off a hidden button ahead of the handback,
        // and where nothing takes focus, it leaves the toast for the page's body rather than
        // staying on a hidden button, as WebKit and Firefox would leave it.
        element.classList.remove('dk-toast-shown');
        delete element.dataset['shown'];
        delete element.dataset['rows'];
        delete element.dataset['row'];
        if (hadFocus) {
            const handed = handBack(cameFrom, arrivedAt, homeOf(element));
            const now = activeOf();
            if (handed && now === arrivedAt && inFrame && !isOff(inFrame))
                (inFrame as HTMLElement).focus();
            else if (holds(element, now)) (now as HTMLElement).blur();
        }
        inFrame = undefined;
        message.textContent = '';
        actionButton.textContent = '';
        actionButton.hidden = true;
        close.hidden = true;
        watch.disconnect();
        window.removeEventListener('resize', remeasure);
        hush(status);
    };
    const show: ShowToast = (words, action) => {
        if (signal.aborted) return () => undefined;
        const active = focusedNow();
        if (!holds(element, active)) {
            arrivedAt = active ?? undefined;
            inFrame = insideOf(active);
        }
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
        // Added once however many messages are shown, as the DOM ignores the same listener again.
        window.addEventListener('resize', remeasure, { signal });
        // Only where focus was outside the toast as the message came, since focus in it needs no
        // room.
        if (arrivedAt === active) clearOf(element, arrivedAt, inFrame);
        wait();
        return () => {
            if (shown === id) dismiss();
        };
    };
    actionButton.addEventListener(
        'click',
        () => {
            const chosen = onAction;
            dismiss();
            chosen?.();
        },
        { signal }
    );
    close.addEventListener(
        'click',
        () => {
            dismiss();
        },
        { signal }
    );
    element.addEventListener(
        'keydown',
        (event) => {
            if (event.key === 'Escape' && shown) dismiss();
        },
        { signal }
    );
    // A pointer that rests where a toast was keeps holding the next one, until it moves away.
    element.addEventListener(
        'pointerenter',
        () => {
            hovered = true;
            wait();
        },
        { signal }
    );
    element.addEventListener(
        'pointerleave',
        () => {
            hovered = false;
            wait();
        },
        { signal }
    );
    element.addEventListener(
        'focusin',
        ({ relatedTarget }) => {
            // Each entry from outside names the control focus came in from, and one from nowhere
            // names none, so focus then goes back to where it was as the message came. The element
            // that last lost focus stands in only where the related target holds it, through the
            // shadow trees and slots `holds` climbs, since a page that stops a focusout leaves an
            // older one there.
            if (!holds(element, relatedTarget as Node | null)) {
                cameFrom = relatedTarget
                    ? ((holds(relatedTarget as Element, lost ?? null)
                          ? lost
                          : relatedTarget) as Element)
                    : undefined;
            }
            focused = true;
            wait();
        },
        { signal }
    );
    element.addEventListener(
        'focusout',
        () => {
            // Read a microtask later, where focus has settled, so focus that leaves and comes back
            // in one task stays in. Chromium fires focusout as a toast with focus in it is taken
            // from the page, and WebKit and Firefox fire none, so focus that left with the toast
            // is kept apart for the handback.
            queueMicrotask(() => {
                if (!element.isConnected) leftWith ||= focused;
                focused = element.isConnected && holds(element, activeOf());
                wait();
            });
        },
        { signal }
    );
    // Focus a visitor moves outside the toast, or a press while it is off the page, is theirs, so a
    // toast held off the page forgets it had focus and hands nothing back over their move.
    const forget = ({ type, target }: Event) => {
        if (type === 'focusin' ? !holds(element, target as Node) : !element.isConnected)
            focused = leftWith = false;
    };
    for (const type of ['focusin', 'pointerdown'])
        document.addEventListener(type, forget, { capture: true, signal });
    document.addEventListener(
        'focusout',
        (event) => {
            lost = event.composedPath()[0] as Element;
        },
        { capture: true, signal }
    );
    // Run once as the signal aborts, since a toast returns what shows a message and no detach.
    down.add(() => {
        dismiss();
        releaseLine(status);
        // A tabindex the page has set since is the page's.
        for (const button of given)
            if (button.getAttribute('tabindex') === '0') button.removeAttribute('tabindex');
    });
    return keep(attachedToasts, element, down, show);
};

/** How a stepper is attached, and the signal that holds it. */
export type StepperOptions = AttachOptions & {
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

const attachedSteppers = new WeakMap<HTMLElement, Kept<() => void, StepperOptions>>();

/**
 * Hands focus to a stepper as its takedown hides the button that had it, giving a stepper with no
 * tabindex one of -1 that stays. Where the stepper refuses focus, the tabindex it was given goes at
 * once, and where focus is still on the button, focus goes on to the app frame's body or the page's
 * main content.
 */
const handToStepper = (stepper: HTMLElement, from: Element) => {
    const given = !stepper.hasAttribute('tabindex');
    if (given) stepper.tabIndex = -1;
    if (handBack(stepper)) return;
    if (given) stepper.removeAttribute('tabindex');
    if (activeOf() === from) handBack(homeOf(stepper));
};

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
 * script meets the number field alone, and steps the value by the field's step when one is pressed.
 * A press that changes the value fires the input and change events a typed value fires, and says
 * the new value on the stepper's status line, since focus stays on the button. A button that would
 * pass the field's least or greatest value is marked off, aria-disabled so focus stays on it, as
 * both are on a field that is disabled or read only, and a press of an off button does nothing.
 * Each is read again as a press lands, so a value a script or a form's reset set is followed. A
 * typed value outside the limits or between steps, or none at all, shows the stepper's own error
 * once the value is changed and says it on the status line, while a refusal the page sets of its
 * own is left to the page. A value drawn outside the limits or between steps shows the error as the
 * stepper is attached or a form's reset brings the value back, with nothing said, unless the field
 * is disabled or read only or the page shows an error of its own. The error is cleared as soon as
 * the value is right again. Only the error's own id and the invalid state it set are added and
 * taken away, so a hint or an error the page draws keeps its place, and a shown error is put back
 * whenever a page that draws the field again, as React does, rewrites its description or its
 * invalid mark. The field is described by its range in words, after the page's own description, and
 * while the error is shown by the error alone, which names the range itself. A press that lands on
 * a limit says so with the value, and a page's words, given as an option, are said after it in the
 * same message, on the page's status line when one is given. Taken down while one of its buttons
 * has focus, it hands focus to its value where the value is read only and enabled, and otherwise,
 * or where the value refuses focus, to the stepper itself, since an editable value would open a
 * phone's keyboard. The stepper, which the markup draws as a group named by its field's label, then
 * holds focus and draws the focus ring where the browser shows focus. A stepper with no tabindex is
 * given one of -1 then, which stays. Where the stepper refuses focus too, focus goes on to the app
 * frame's body or the page's main content. Focus the page has moved elsewhere stays. It takes the
 * stepper's field or the stepper, attaches each stepper once whichever it is given, runs on the
 * options of its newest holder, and returns what takes it down again.
 */
export const attachStepper = (element: HTMLElement, options?: StepperOptions): (() => void) => {
    const field = element.closest<HTMLElement>('.dk-field') ?? element;
    const stepper = element.matches('.dk-stepper')
        ? element
        : (field.querySelector<HTMLElement>('.dk-stepper') ?? element);
    // A signal already aborted does nothing, so even new options for a stepper already attached are
    // not taken.
    if (options?.signal?.aborted) return () => undefined;
    const already = join(attachedSteppers, stepper, options);
    if (already) return already;
    let chosen: StepperOptions = options ?? {};
    const parts = stepperParts(field);
    // A read-only stepper is drawn with no buttons, so there is nothing for a press to change.
    if (!parts) return () => undefined;
    const torn = teardown(options?.signal, options);
    const { signal } = torn;
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
    // Read as the teardown runs too, once its signal is aborted, so the buttons and the words go.
    const attached = () => !signal.aborted;
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
            button.hidden = attached() && fixed ? activeOf() !== button : !attached();
    };
    let setInvalid = false;
    /**
     * Puts the range in words in the field's description, after the page's own, or the error in its
     * place while the error shows, whoever showed it. Each is written only when it changes, so the
     * watch below, woken by this writing, finds nothing left to write and stops.
     */
    const describe = () => {
        if (limits) {
            const words = attached() ? rangeWords(least(), greatest()) : '';
            if (limits.textContent !== words) limits.textContent = words;
        }
        const before = input.getAttribute('aria-describedby') ?? '';
        const after = describedBy(before, range, limits, range !== null && !range.hidden);
        if (after === before) return;
        if (after) input.setAttribute('aria-describedby', after);
        else input.removeAttribute('aria-describedby');
    };
    /** Whether the page shows an error of its own in the field, which the stepper's never hides. */
    const pageError = () =>
        [...field.querySelectorAll<HTMLElement>('.dk-field-error')].some(
            (error) => error !== range && !error.hidden
        );
    const report = (wrong: boolean) => {
        if (range) range.hidden = !wrong;
        describe();
        if (!range) return;
        if (wrong && input.getAttribute('aria-invalid') !== 'true') {
            input.setAttribute('aria-invalid', 'true');
            setInvalid = true;
        } else if (!wrong && setInvalid && !pageError()) {
            input.removeAttribute('aria-invalid');
            setInvalid = false;
        }
    };
    /**
     * Whether the value is one the stepper's error names: outside the limits, between steps, or
     * none at all. A page's own refusal, set with `setCustomValidity`, is the page's to show.
     */
    const outOfRange = () => {
        const { rangeUnderflow, rangeOverflow, stepMismatch } = input.validity;
        return rangeUnderflow || rangeOverflow || stepMismatch;
    };
    const wrong = () => input.value === '' || outOfRange();
    /**
     * Whether a value the page drew, as the stepper is attached or a form's reset brings it back,
     * shows the error at once, with nothing said. A blank field is left unflagged until it is
     * changed, so a form that starts empty shows no error as it loads, a field no one can change
     * is never marked wrong, and an error the page shows of its own keeps the field to itself.
     */
    const drawnWrong = () => !locked() && input.value !== '' && outOfRange() && !pageError();
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
            pressed !== presses || !attached()
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
            tell(() => (attached() ? words : null));
        }
    };
    // Once the reset is done, and never once the stepper is let go, since the teardown clears it,
    // as with focus leaving it.
    let resetting = 0;
    const onReset = () => {
        window.clearTimeout(resetting);
        resetting = window.setTimeout(() => {
            quiet();
            mark();
            report(drawnWrong());
        });
    };
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
    // Marked once focus has settled, and never once the stepper is let go, since the teardown
    // clears it, so a stepper taken away and attached again from a page's own focusout handler
    // keeps its buttons.
    let settling = 0;
    stepper.addEventListener(
        'focusout',
        () => {
            window.clearTimeout(settling);
            settling = window.setTimeout(mark);
        },
        { signal }
    );
    mark();
    // A value drawn past the limits, or between steps, shows its error at once, so a page that
    // draws that state needs no code of its own.
    if (drawnWrong()) report(true);
    else describe();
    torn.add(() => {
        kept.disconnect();
        window.clearTimeout(settling);
        window.clearTimeout(resetting);
        quiet();
        report(false);
        // A button with focus is about to hide, so focus goes first to a read-only value, which
        // opens no keyboard, or else to the stepper, which the markup draws as a group named by the
        // field's label. A stepper with no tabindex is given -1, so a script can focus it while the
        // tab order passes it by, and keeps it, since taking it away again would need a listener
        // that outlives the takedown. A stepper that refuses focus has that tabindex taken away at
        // once, and focus goes on to the app frame's body or the page's main content, as it does
        // from the toast, the dialog and the panels. Focus the page moves elsewhere as the value or
        // the stepper is tried stays.
        const at = activeOf();
        if (at === down || at === up) {
            if (!handBack(input.readOnly && !input.disabled ? input : null) && activeOf() === at) {
                handToStepper(stepper, at);
            }
        }
        // Left as they are where a page attached the stepper afresh as focus came to it.
        if (attachedSteppers.get(stepper)?.down === torn) {
            down.hidden = true;
            up.hidden = true;
        }
    });
    torn.set = (next) => {
        // A page that takes the stepper's words to its own line leaves none on the stepper's,
        // and words left on a line the page no longer gives are taken back from it.
        if ((next.status || next.say) && status) hush(status);
        if (saidOn && saidOn !== next.status) unsay(saidOn, lastSaid);
        chosen = next;
    };
    return keep(attachedSteppers, stepper, torn, torn.stop);
};

/**
 * What a page hands the function that opens a dialog, to say where focus goes back to: the element
 * itself, or the event, a page's own or React's, whose press opened it.
 */
export type DialogOpener =
    Element | { readonly target: EventTarget | null; readonly currentTarget?: EventTarget | null };

/** Opens a dialog as a modal, over the page, remembering where focus goes back to on close. */
export type OpenDialog = (from?: DialogOpener) => void;

/** How a dialog is attached, and the signal that holds it. */
export type DialogOptions = AttachOptions & {
    /**
     * Stays open on Escape, a phone's Back and a tap on the scrim, for a dialog that must be
     * answered.
     */
    readonly stay?: boolean | undefined;
    /**
     * Where focus goes when nothing had focus as the dialog opened or what opened it no longer
     * takes focus. It may give any HTML or SVG element that takes focus, an SVG link among them.
     */
    readonly returnTo?: (() => Element | null) | undefined;
};

const attachedDialogs = new WeakMap<HTMLDialogElement, Kept<OpenDialog, DialogOptions>>();

/**
 * What a press can land on that takes focus, so a press inside a button finds the button, with
 * `*|href` matching an SVG link's `xlink:href` too.
 */
const FOCUSABLE = 'a[*|href], button, input, select, textarea, summary, [tabindex]';

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
 * since a browser that gives a pressed button no focus leaves nothing else, or else what had focus.
 * Where nothing had focus, or that no longer takes focus, focus goes where `returnTo` says. A
 * `moveFocus` request asked in the task that closes it, takes it away or takes it down lands in
 * place of the opener, since a request takes focus the kit, or the browser as the dialog closes,
 * hands back after it was asked as free. Focus the page moves elsewhere in that task stays, while
 * focus it puts back on what had focus as the dialog opened counts as the browser's handback. One
 * asked in an earlier task lands only where its frame comes after the close, so a page that awaits
 * before closing asks again just before it closes.
 *
 * A dialog that must be answered is attached to stay, and then stays open on Escape, a phone's Back
 * and the scrim, by the closedby attribute where the browser reads it, since one that limits how
 * often a page may refuse a close does not hold a refusal past the first. Attaching it again with
 * options replaces them, by the rule for whose options apply in the reference's Taking a control
 * down, attaching it again with none, or with no key but `signal` given a value, as `{}` or
 * `{ stay: undefined }`, leaves them as they were, and either returns the same function, an open
 * dialog staying open. Its listeners are on the dialog, so a dialog taken from the page takes them
 * with it. Taken down by its `signal`, an open dialog closes, focus goes back to what opened it
 * where focus is in the dialog, inside a shadow tree within it too, has fallen to the body or is
 * still where the browser handed it as the dialog closed, its listeners and the closedby its `stay`
 * set come off, and the function that opens it does nothing.
 */
export const attachDialog = (dialog: HTMLDialogElement, options?: DialogOptions): OpenDialog => {
    // A signal already aborted does nothing, so even new options for a dialog already attached are
    // not taken.
    if (options?.signal?.aborted) return () => undefined;
    const already = join(attachedDialogs, dialog, options);
    if (already) return already;
    const down = teardown(options?.signal, options);
    const { signal } = down;
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
    dialog.addEventListener(
        'pointerdown',
        (event) => {
            startedOutside = outside(event);
        },
        { signal }
    );
    dialog.addEventListener(
        'click',
        (event) => {
            if (settings.stay !== true && startedOutside && outside(event)) dialog.close();
            startedOutside = false;
        },
        { signal }
    );
    dialog.addEventListener(
        'cancel',
        (event) => {
            if (settings.stay === true) event.preventDefault();
        },
        { signal }
    );
    // Whether focus is the kit's to hand back, read the same way by the close event and the
    // takedown: still on what the browser handed it to as the dialog closed, or by the rule every
    // piece hands it back by. Focus a request or the page has put anywhere else stays.
    const handsBack = () => restoring.get(dialog) === focusedNow() || mayHandBack(dialog, true);
    const onClose = (back: boolean) => {
        // The browser fires close a moment after the dialog closes, so one that arrives once the
        // dialog is open again belongs to an earlier closing and leaves this opening's opener be.
        if (dialog.open) return;
        // What the browser handed focus to as the dialog closed comes last, so where the opener
        // has gone and nothing else takes focus, that place counts as handed back, and a request
        // asked in the task that closed the dialog still lands.
        if (back) handBack(opener, settings.returnTo?.(), restoring.get(dialog));
        opener = null;
        restoring.delete(dialog);
    };
    dialog.addEventListener('close', () => onClose(handsBack()), { signal });
    const open: OpenDialog = (from) => {
        if (dialog.open || signal.aborted) return;
        opener = openerOf(from);
        // Where nothing had focus, the browser hands it nowhere as the dialog closes.
        const before = focusedNow();
        if (before) restoring.set(dialog, before);
        else restoring.delete(dialog);
        dialog.showModal();
        // A Close in the corner never takes focus as the dialog opens, which it would where nothing
        // in the dialog asks for focus, as when React's autoFocus writes no attribute.
        const close = dialog.querySelector(':scope > .dk-close');
        if (close && holds(close, activeOf())) moveOffClose(dialog, close);
    };
    // A dialog let go while open closes, so the page behind is no longer inert, and focus goes back
    // at once, open or closed in the same task, since the close event that would hand it back comes
    // after its listener is off. It goes back by the same rule as that event, read before the close
    // moves it, so focus the page set in the abort's task stays. That event is stopped where it
    // lands, so an attach made since never takes it for a closing of its own and sends focus to its
    // returnTo.
    down.add(() => {
        if (dialog.open || opener) {
            const back = handsBack();
            dialog.addEventListener('close', (event) => event.stopImmediatePropagation(), {
                once: true,
            });
            dialog.close();
            onClose(back);
        }
        restoring.delete(dialog);
        if (settings.stay) dialog.removeAttribute('closedby');
    });
    down.set = set;
    return keep(attachedDialogs, dialog, down, open);
};

/** Opens or closes a panel attached by its button, from the page's own code. */
export type SetPanel = (open: boolean) => void;

/**
 * What attaching a panel's button returns: `set`, which opens or closes the panel from the page's
 * own code, and `detach`, which takes the button down.
 */
export type PanelControl = { readonly set: SetPanel; readonly detach: () => void };

const attachedPanels = new WeakMap<HTMLButtonElement, Kept<PanelControl>>();

/** The id of the panel a button names, the first where its aria-controls names several. */
const panelIdOf = (button: Element): string =>
    (button.getAttribute('aria-controls') ?? '').trim().split(/\s+/)[0] ?? '';

/**
 * Every attached button not let go, kept apart from the page so one in a shadow root is found too,
 * and so the panels' listeners come off once it is empty.
 */
const openers = new Set<HTMLButtonElement>();

/** Every attached button in the page that names the panel, in the page's order. */
const openersOf = (id: string): HTMLButtonElement[] =>
    [...openers]
        .filter((button) => button.isConnected && panelIdOf(button) === id)
        // 2 marks the other button as coming before this one.
        .sort((one, other) => (one.compareDocumentPosition(other) & 2 ? 1 : -1));

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
 * An SVG link, told apart by its name rather than by its class, which jsdom, where many pages run
 * their unit tests, does not have.
 */
type SVGLink = SVGElement & { readonly href: SVGAnimatedString };

/**
 * The place on this page outside the panel that a link in it sends the visitor to, where that link
 * was their last press, since following it moved the keyboard's start there. It is given a
 * tabindex of -1 where it takes no focus, so focus can follow.
 */
const jumpFrom = (panel: HTMLElement): HTMLElement | SVGElement | null => {
    const pressed = lastWasPress
        ? lastPath.find(
              (node): node is HTMLAnchorElement | SVGLink =>
                  (node instanceof HTMLAnchorElement ||
                      (node instanceof SVGElement && node.localName === 'a')) &&
                  panel.contains(node) &&
                  // An SVG link's target is an object, so the attribute is read for both kinds of
                  // link.
                  !node.getAttribute('target') &&
                  !node.hasAttribute('download')
          )
        : undefined;
    // An SVG link's address is read through an HTML link, which resolves it as the browser does.
    const link =
        pressed instanceof SVGElement
            ? Object.assign(document.createElement('a'), { href: pressed.href.baseVal })
            : pressed;
    let id = link?.hash.slice(1) ?? '';
    try {
        id = decodeURIComponent(id);
    } catch {
        // A fragment that is not encoded as a whole is looked for as written.
    }
    const jump: HTMLElement | SVGElement | null =
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
 * As the panel closes, focus goes to its button where focus is in the panel, inside a shadow tree
 * within it too, or where nothing has focus and the visitor's last place, the path of the last
 * focus that moved or of their last press, was in it, and stays anywhere else. Where it goes back
 * and that last press was a link in the panel to a place on this page outside it, it goes there
 * instead. Otherwise it goes to the button given, the one pressed or the one that opened the panel,
 * else the first attached button that names it and takes focus, else the first thing after the
 * panel the keyboard reaches by Tab, else the body of the app's frame or the page's main content.
 */
const showPanel = (id: string, open: boolean, by?: HTMLButtonElement): void => {
    const panel = document.getElementById(id);
    const openers = openersOf(id);
    for (const button of openers) button.setAttribute('aria-expanded', String(open));
    if (open && by) lastOpener.set(id, by);
    if (!open) lastOpener.delete(id);
    if (!panel) return;
    takeFocus(panel);
    const held = mayHandBack(panel, lastPath.includes(panel));
    panel.hidden = !open;
    if (open || !held) return;
    handBack(
        jumpFrom(panel),
        ...[by, ...openers].filter((button) => !isOff(button)),
        ...[...document.querySelectorAll<HTMLElement | SVGElement>(FOCUSABLE)].filter(
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

/** An open dialog or an open popover, which takes its own Escape. */
const isOpenOver = (place: Element): boolean =>
    (place instanceof HTMLDialogElement && place.open) ||
    (place.hasAttribute('popover') && place.matches(':popover-open'));

/**
 * Escape closes the innermost open panel that holds focus, or whose button has it, and marks the
 * press handled, so a dialog around the panel stays open. It leaves alone an Escape the page has
 * already handled, one that ends typing in a script such as Japanese, which Safari marks by the key
 * code 229, one in an open dialog or an open popover inside the panel, and one on a search with
 * words in it or on a combobox or a button whose list or menu is open, where Escape means something
 * of its own. Those checks read where the key was pressed, inside a page's own component where the
 * component's shadow root is open, and the component's host among them. An element inside a
 * component's shadow tree that shares a panel's id closes nothing. A panel's button that is off
 * does not close its own panel, and Escape goes on to a panel around it.
 */
const onPanelKey = (event: KeyboardEvent): void => {
    const target = event.target;
    // The elements from the one the key was pressed in, inside a page's own component where the
    // component's shadow root is open, though the event's target names only the component's host.
    const path = event.composedPath().filter((node) => node instanceof Element);
    // Safari ends composing with an Escape whose keydown carries the key code 229 instead.
    const composing = event.isComposing || event.keyCode === 229;
    if (event.key !== 'Escape' || event.defaultPrevented || composing) return;
    // A field, a combobox or a menu button keeps its Escape, from the element the key was pressed
    // in out to that host, so a component that marks its host as a combobox keeps it too.
    if (!(target instanceof Element) || path.slice(0, path.indexOf(target) + 1).some(ownsEscape))
        return;
    const own = target instanceof HTMLButtonElement && attachedPanels.has(target);
    for (const place of path) {
        // An open dialog or popover inside the panel takes its own Escape.
        if (isOpenOver(place)) return;
        // A panel's button that is off does nothing for its own panel, by Escape as by a press, and
        // Escape goes on to a panel around it.
        const id = place === target && own ? (isOff(target) ? '' : panelIdOf(place)) : place.id;
        // Only the document holds a panel, as showPanel finds it by id there, so an element of a
        // component's shadow tree that shares a panel's id closes nothing.
        if (!lastOpener.has(id) || place.getRootNode() !== document) continue;
        event.preventDefault();
        showPanel(id, false, lastOpener.get(id));
        return;
    }
};

/**
 * Makes a button open and close the panel it names in aria-controls, and the panel's corner Close
 * close it, and returns `set`, which opens or closes it from the page's own code, and `detach`,
 * which takes the button down, after which neither does anything. The panel starts as the first
 * button's aria-expanded says, and a button attached later follows the panel as it is. The markup
 * writes hidden on a panel that starts closed, so it never shows before the script runs. A press of
 * the button turns it the other way, unless the button is off, and every attached button that names
 * the panel follows. However the panel closes, by its button, its Close, Escape or `set`, focus
 * goes to the button that opened it where focus is in the panel, inside a shadow tree within it
 * too, or where nothing has focus and the visitor's last place was in it, as record 19 has it. The
 * panel is found at each press, so one drawn again keeps working, and a button drawn again works
 * once it is attached. Listeners on the document hear the presses, the focus and the Escape of
 * every panel, and come off once every button is taken down. A panel's id must be the only one on
 * the page. Attached again, a button returns what it returned first.
 *
 * Its `signal` takes the button down as `detach` does, and a signal already aborted attaches
 * nothing. A button taken down is marked collapsed. A button taken from the page without being
 * taken down stays held, and keeps the document's listeners, until it is. An open panel stays the
 * kit's while an attached button names it, so once the button that opened it is taken down, Escape
 * and its Close both still close it, and focus goes back to the first attached button that names
 * it. A button attached to it while it is open takes it where no attached button names it. Once
 * none does, neither closes it, and the page holds it as it is.
 */
export const attachPanel = (opener: HTMLButtonElement, options?: AttachOptions): PanelControl => {
    const idle: PanelControl = { set: () => undefined, detach: () => undefined };
    // A signal already aborted does nothing, even to a button already attached.
    if (options?.signal?.aborted) return idle;
    const already = join(attachedPanels, opener, options);
    if (already) return already;
    if (!panelIdOf(opener)) throw new Error("a panel's button needs aria-controls");
    const down = teardown(options?.signal);
    const control: PanelControl = {
        set: (open) => {
            const id = panelIdOf(opener);
            if (!down.signal.aborted) showPanel(id, open, lastOpener.get(id) ?? opener);
        },
        detach: down.stop,
    };
    down.add(() => {
        openers.delete(opener);
        // A button let go no longer follows its panel, so it says it opens nothing rather than a
        // state it no longer keeps.
        opener.setAttribute('aria-expanded', 'false');
        // A panel this button opened passes to the first attached button that names it, so Escape
        // and its Close, which close a panel only while it has one, close it alike.
        for (const [id, button] of lastOpener) {
            if (button !== opener) continue;
            const next = openersOf(id)[0];
            if (next) lastOpener.set(id, next);
            else lastOpener.delete(id);
        }
        if (openers.size) return;
        document.removeEventListener('focusin', onPanelFocus, true);
        document.removeEventListener('click', onPanelPress, true);
        document.removeEventListener('pointerdown', onPanelDown, true);
        document.removeEventListener('keydown', onPanelKey);
        // An open panel stays started, so its button drawn again finds it open rather than
        // starting it as the new markup says.
        for (const id of startedPanels)
            if (document.getElementById(id)?.hidden !== false) startedPanels.delete(id);
    });
    keep(attachedPanels, opener, down, control);
    if (!openers.size) {
        document.addEventListener('focusin', onPanelFocus, true);
        document.addEventListener('click', onPanelPress, true);
        document.addEventListener('pointerdown', onPanelDown, true);
        document.addEventListener('keydown', onPanelKey);
    }
    openers.add(opener);
    // Safari focuses a pressed button only where it has a tabindex, so the kit gives one where the
    // page set none, and keeps any the page set, such as a toolbar's that moves among its buttons.
    if (!opener.hasAttribute('tabindex')) opener.tabIndex = 0;
    // The first button for a panel starts it as its markup says, and a later one, a button drawn
    // again among them, only marks itself as the panel is, so it neither moves the panel nor
    // takes the place of the button that opened it.
    const id = panelIdOf(opener);
    const panel = document.getElementById(id);
    if (startedPanels.has(id) && panel) {
        opener.setAttribute('aria-expanded', String(!panel.hidden));
        // An open panel no attached button named is the kit's again, so Escape closes it as its
        // Close does.
        if (!panel.hidden && !lastOpener.has(id)) lastOpener.set(id, opener);
    } else control.set(opener.getAttribute('aria-expanded') === 'true');
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

const attachedTables = new WeakMap<HTMLElement, Kept<() => void>>();

/**
 * Brings what the keyboard reaches in a table's frame fully into view, clear of a pinned column,
 * since Chromium leaves a link or a button that is partly in view where it is, cut by the frame's
 * edge or under the pinned column, and Safari does once more than a target's width of it shows. The
 * pinned cell in the same row, or the frame's scroll padding where that is wider, marks where the
 * room starts, at the side the frame reads from, and the scroll padding at its end where it ends.
 * Wider than the room, its start meets the room's, so its first words show. Only focus the keyboard
 * brings is followed, so a press of a pointer never moves what it pressed. It takes the frame or
 * anything in it, attaches each frame once, and returns what takes it down again, as its `signal`
 * does.
 */
export const attachTable = (element: HTMLElement, options?: AttachOptions): (() => void) => {
    const frame = element.closest<HTMLElement>('.dk-table-scroll');
    if (!frame) throw new Error('a table needs its frame');
    if (options?.signal?.aborted) return () => undefined;
    const already = join(attachedTables, frame, options);
    if (already) return already;
    const down = teardown(options?.signal);
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
    frame.addEventListener('focusin', onFocusIn, { signal: down.signal });
    return keep(attachedTables, frame, down, down.stop);
};

/** How a form is attached, for the step after a submit it refuses, and the signal that holds it. */
export type FormOptions = AttachOptions & {
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

/** A format in the page's language, or the browser's where the page's lang is no language tag. */
const formatIn = (options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => {
    try {
        return new Intl.DateTimeFormat(document.documentElement.lang || undefined, options);
    } catch {
        return new Intl.DateTimeFormat(undefined, options);
    }
};

/**
 * A dated field's limit as a visitor reads it, in the page's language, or the browser's where the
 * page names none it knows: "November 2026" for a month, "the week of November 23, 2026" from an
 * ISO week's Monday. Read as wall time, never through UTC, since the value has no zone.
 */
const whenWords = (type: string, limit: string): string => {
    const time = type === 'time';
    const week = type === 'week';
    // A time read as one on a day of its own, so every type's parts fall in the same places.
    const parts = (time ? `0-1-1T${limit}` : limit).split(/\D+/).map(Number);
    const [year = 0, month = 1, day = 1, hour = 0, minute = 0, second = 0] = parts;
    const options: Intl.DateTimeFormatOptions = {
        ...(!time && { year: 'numeric', month: 'long' }),
        ...(!time && type !== 'month' && { day: 'numeric' }),
        ...(parts.length > 3 && { hour: 'numeric', minute: '2-digit' }),
        ...(parts.length > 5 && { second: '2-digit' }),
    };
    // A week's Monday, counted from that of the week holding January 4, which is the ISO week 1.
    const when = week
        ? new Date(year, 0, 4 - ((new Date(year, 0, 4).getDay() + 6) % 7) + 7 * (month - 1))
        : new Date(year, month - 1, day, hour, minute, second);
    return `${week ? 'the week of ' : ''}${formatIn(options).format(when)}`;
};

/**
 * Words for a value past a field's least or most, which for a dated field name the kind of value
 * and keep the limit off the closing period, so the period never stands alone on a line.
 */
const limitWords = (control: Checked, name: 'min' | 'max'): string => {
    const limit = limitOf(control, name);
    const least = name === 'min';
    if (control.type !== 'time' && !DATED.has(control.type))
        return `Enter ${limit} or ${least ? 'more' : 'less'}.`;
    const kind = control.type === 'datetime-local' ? 'date and time' : control.type;
    return `Enter ${whenWords(control.type, limit)} or ${least ? 'a later' : 'an earlier'} ${kind}.`;
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
        if (control.type === 'email') return 'Enter an email address like name@example.com here.';
        return control.type === 'url'
            ? 'Enter the full web address, with https:// at the start.'
            : formatWords(control);
    },
    patternMismatch: formatWords,
    tooShort: (control) => `Enter at least ${limitOf(control, 'minlength')} characters.`,
    tooLong: (control) => `Enter ${limitOf(control, 'maxlength')} characters or fewer.`,
    rangeUnderflow: (control) => limitWords(control, 'min'),
    rangeOverflow: (control) => limitWords(control, 'max'),
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

/**
 * Error words with a break allowed after each "@", so an address too long for its line breaks
 * there, rather than at whichever letter or stop the line runs out on.
 */
const breakable = (words: string): (string | HTMLElement)[] =>
    words
        .split('@')
        .flatMap((part, at) => (at === 0 ? [part] : ['@', document.createElement('wbr'), part]));

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
        .find(
            (part): part is HTMLElement =>
                part instanceof HTMLElement && part.matches('.dk-stepper-range') && !part.hidden
        );
    if (range) return { error: range, takeAway: () => undefined };
    const page = field.id ? byId(field, `${field.id}-error`) : null;
    if (page instanceof HTMLElement && page.matches('.dk-field-error')) {
        const kept = [...page.childNodes];
        const hidden = page.hidden;
        page.replaceChildren(errorStart(), ...breakable(words));
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
    made.append(errorStart(), ...breakable(words));
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
 * returns what calls the refusal off before it lands. `from` is where focus was when the refusal
 * was asked for, for one made later than that, as `moveFocus` takes it.
 */
export type Refuse = (options?: Pick<MoveFocusOptions, 'from'>) => () => void;

const attachedForms = new WeakMap<HTMLElement, Kept<Refuse, FormOptions>>();

/** What checks a form, and clears what its check drew, from an attach in it. */
type Checker = {
    readonly check: (event: SubmitEvent, whole: HTMLFormElement) => void;
    readonly clear: () => boolean;
    readonly cleared: () => void;
};

/** A form the kit checks, with the attaches in it and the marks they set on fields not in error. */
type CheckedForm = {
    readonly checkers: Checker[];
    readonly marks: Element[];
    readonly stop: () => void;
};

/** The forms the kit checks, each once however many of its parts are attached. */
const checkedForms = new WeakMap<HTMLFormElement, CheckedForm>();

/** Takes off the marks set on fields not in error, where they still say so. */
const unmark = (marks: readonly Element[]) => {
    for (const one of marks)
        if (one.getAttribute('aria-invalid') === 'false') one.removeAttribute('aria-invalid');
};

/**
 * Sets up the kit's check of a form, once for every attach in it. The browser's constraints are
 * checked across the whole form as it is submitted, before the page's own handler in the bubble
 * phase, which runs only where every field passes, so it can still check what they cannot express.
 * The form's own attach checks it where there is one, else the first part's, so the form's own goes
 * first and each part's after it. A reset a page calls off leaves the errors, since the values that
 * failed stay. One that goes through takes away the errors the kit drew, and where there were any
 * says so, since they go out of a screen reader's hearing and focus stays on the button. A reset
 * with none the kit drew, as after a save, says nothing, and errors a page drew are the page's to
 * clear. The last attach in the form taken down takes the check away, with a reset's timer still
 * due, and gives the form back its own noValidate, so the browser checks it again.
 */
const checkForm = (own: HTMLFormElement): CheckedForm => {
    const down = teardown();
    const { signal } = down;
    const was = own.noValidate;
    const timers = new Set<number>();
    const checked: CheckedForm = { checkers: [], marks: [], stop: down.stop };
    down.add(() => {
        for (const timer of timers) window.clearTimeout(timer);
        own.noValidate = was;
        unmark(checked.marks);
        checkedForms.delete(own);
    });
    own.addEventListener(
        'submit',
        (event) => {
            // The first attach checks the form, and the errors any other drew no longer stand.
            const [first, ...rest] = checked.checkers;
            for (const other of rest) other.clear();
            first?.check(event, own);
        },
        { capture: true, signal }
    );
    own.addEventListener(
        'reset',
        (event) => {
            const timer = window.setTimeout(() => {
                timers.delete(timer);
                if (event.defaultPrevented) return;
                // Every attach's errors go, and the first attach says so where there were any.
                if (checked.checkers.map((one) => one.clear()).includes(true))
                    checked.checkers[0]?.cleared();
            });
            timers.add(timer);
        },
        { signal }
    );
    checkedForms.set(own, checked);
    return checked;
};

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
        .filter(
            (part): part is HTMLElement =>
                part instanceof HTMLElement && !part.hidden && wanted(part)
        )
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
 * What a refusal says. Where focus moves to a summary, which reads its own words, it says nothing,
 * and where the summary already had focus, its words. Where it moves to a field or is already on
 * one, it says the field's name and error, with the count where more are wrong, whatever the field
 * reads itself, since VoiceOver on iOS reads a field's error only as a hint, after a pause or not
 * at all, and focus moved by script may not land. A screen reader that reads the error as focus
 * lands hears it twice, which slows a visitor less than an error never heard.
 */
const refusalWords = (
    to: {
        readonly summary: Element | null;
        readonly wrong: Element | null;
    },
    focused: boolean,
    count: number
): string => {
    if (to.summary) return focused ? to.summary.textContent.trim() : '';
    if (!to.wrong || count === 0) return '';
    return unreachedWords(to.wrong, errorWords(to.wrong), count);
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
 * Joins an attach to the kit's check of its form, and returns what takes it out again, the form's
 * check and the marks with the last attach in it.
 */
const joinForm = (form: HTMLElement, checker: Checker): (() => void) => {
    // The browser's own check would stop a submit before the page's handler runs, showing its own
    // bubble, which fades, in place of the kit's errors, so the form takes noValidate from script
    // and the kit checks the same constraints on submit. A page without script keeps the browser's
    // check.
    const own = form instanceof HTMLFormElement ? form : form.closest('form');
    const checked = own ? (checkedForms.get(own) ?? checkForm(own)) : null;
    if (own) own.noValidate = true;
    // A field not in error says so, so a browser does not read an empty required field as invalid
    // before anything is submitted. The marks are the form's where there is one, since every
    // attach in it reads them.
    const marks = checked?.marks ?? [];
    for (const control of (own ?? form).querySelectorAll('input, select, textarea, fieldset'))
        if (!control.hasAttribute('aria-invalid')) {
            control.setAttribute('aria-invalid', 'false');
            marks.push(control);
        }
    if (own === form) checked?.checkers.unshift(checker);
    else checked?.checkers.push(checker);
    return () => {
        if (!checked) {
            unmark(marks);
            return;
        }
        checked.checkers.splice(checked.checkers.indexOf(checker), 1);
        if (checked.checkers.length === 0) checked.stop();
    };
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
 * or its first control that can, and says one message on the status line: nothing where focus moves
 * to a summary, whose words it reads, its words where the summary already had focus, and where it
 * moves to a field or is already on one, that field's name and error, with how many fields need
 * attention where more are wrong, since VoiceOver on iOS reads a field's error only as a hint and
 * focus moved by script may not land. A set counts once however many of its choices are marked. The
 * field's error stays not live. A second refusal calls off one not yet landed, and each refusal
 * returns what calls it off. A reset that goes through takes away the errors the kit drew and,
 * where there were any, says the form is cleared. Attached again, a form returns what it returned
 * first and runs on the options of its newest holder, its errors and its check kept.
 *
 * Taken down by its `signal`, it takes its listeners off, calls off a refusal and a reset's
 * timer still due, and takes away the errors it drew, so nothing is said after, and what it
 * returned does nothing. The form's check and its noValidate go with the last attach in the form.
 * A signal already aborted leaves the form as the markup drew it.
 */
export const attachForm = (form: HTMLElement, options?: FormOptions): Refuse => {
    // A signal already aborted does nothing, so even new options for a form already attached are
    // not taken.
    if (options?.signal?.aborted) return () => () => undefined;
    const already = join(attachedForms, form, options);
    if (already) return already;
    const down = teardown(options?.signal, options);
    let chosen: FormOptions = options ?? {};
    let pending: (() => void) | null = null;
    // The failures of the last submit the kit refused, said where a page that draws its own errors
    // marks none, so the refusal is still heard.
    let failed: readonly FieldFailure[] = [];
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
    const refuseIn = (within: HTMLElement, summed: boolean, from?: Element | null) => {
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
            const wrong = fields.find((one) => focusIn(one) === field) ?? null;
            speak(refusalWords({ summary, wrong }, focused, fields.length));
        });
        const moving = moveFocus(() => target, { from });
        pending = () => {
            window.cancelAnimationFrame(frame);
            moving();
        };
        return pending;
    };
    // A refusal asked for after the teardown does nothing.
    const refuse: Refuse = (asked) =>
        down.signal.aborted ? () => undefined : refuseIn(form, true, asked?.from);
    // A button marked formnovalidate submits unchecked, as with the browser's own check, and clears
    // what the kit drew, which no longer stands.
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
    // Takes away the errors the kit drew, and says whether there were any. A refusal still due is
    // called off with them, since it would say errors no longer shown in place of what follows.
    const clear = () => {
        pending?.();
        const had = drawn.size > 0;
        for (const field of [...drawn.keys()]) undraw(field);
        return had;
    };
    down.add(clear);
    down.add(joinForm(form, { check, clear, cleared: () => speak('Form cleared.') }));
    down.set = (next) => {
        chosen = next;
    };
    return keep(attachedForms, form, down, refuse);
};

/** How a group's cells are laid out, which sets the arrow keys that move among them. */
export type RovingOrientation = 'grid' | 'horizontal' | 'vertical';

/** How a group of cells is attached, and the signal that holds it. */
export type RovingOptions = AttachOptions & {
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

const attachedGroups = new WeakMap<HTMLElement, Kept<() => void, RovingOptions>>();

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
 * moves focus among its cells with the arrow keys, Home and End, and returns what takes it down. A
 * grid moves up and down to the nearest cell in the row above or below as the cells are drawn, so
 * it holds at any count of columns, and left and right follow the page's reading direction. A row
 * of tabs ignores up and down and wraps from one end to the other. An arrow held with Alt, Control
 * or Command is left to the browser. The stop is the cell the page names as current, else a
 * tablist's chosen tab, else the one focus last reached, else the first, and a cell that is
 * disabled, inert or out of sight is never the stop. The stop is placed as the group is attached,
 * as its cells change and as its size does, so a group attached while drawn at no size, in a closed
 * details, under hidden or display none, or in a dialog not yet open, has its stop once it shows. A
 * group under inert, or hidden in a way that keeps its size, is placed again only as its cells
 * change. A cell marked off keeps its place, as it does in the tab order, and is never handed to
 * `onMove`. The kit moves focus and the page chooses: a page that chooses a tab as focus reaches it
 * does so in `onMove`. A grid of buttons with the group's role, or none, takes the toolbar's, so a
 * screen reader says the arrows move within it. Where the cell that had focus is taken out, focus
 * goes to the next cell still there, or the one before. Taken down, by what it returns or by its
 * `signal`, each cell takes back its own tabindex and the grid its own role. Attached again, a
 * group returns what it returned first and runs on the options of its newest holder, its observers
 * kept.
 */
export const attachRoving = (group: HTMLElement, options?: RovingOptions): (() => void) => {
    // A signal already aborted does nothing, so even new options for a group already attached are
    // not taken.
    if (options?.signal?.aborted) return () => undefined;
    const already = join(attachedGroups, group, options);
    if (already) return already;
    const down = teardown(options?.signal, options);
    const { signal } = down;
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
    // Run as the group's cells change and as its size does: a cell that went out, or out of sight,
    // hands its place to the next cell still there, and focus with it where it fell from that cell,
    // and the stop is placed again.
    const settle = () => {
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
    };
    const kept = new MutationObserver(settle);
    kept.observe(group, {
        childList: true,
        subtree: true,
        attributeFilter: ['aria-selected', 'hidden', 'disabled', 'inert', 'class', 'style'],
    });
    // A group attached out of sight in a way that draws it at no size, in a closed details, under
    // hidden or display none, or in a dialog not yet open, has no cell in sight to take the stop,
    // and what shows it changes something outside the group, which the observer above does not
    // hear. Such a group is drawn at its own size once it shows, so watching its size places the
    // stop as it comes into sight. The watch also hears a cell a media query or a page's rule hides
    // as it resizes the group. It runs on each change of the group's size, such as each frame a
    // window is dragged or a font that loads, and each run checks whether each of the group's cells
    // is in sight, on a layout the observer runs after, and writes a tabindex only where one
    // changes. A group made inert, or hidden in a way that keeps its size, is not heard. Listening
    // for a details' toggle would miss a panel or a dialog. Giving the named or first cell the stop
    // while none is in sight cannot tell a cell hidden with its group from one hidden on its own,
    // which would keep the stop out of sight once the group shows.
    const drawn = new ResizeObserver(settle);
    drawn.observe(group);
    group.addEventListener('keydown', onKey, { signal });
    group.addEventListener('focusin', onReach, { signal });
    group.addEventListener('focusout', onLeave, { signal });
    // Safari leaves a tapped button without focus, so a press places the stop too.
    group.addEventListener('click', onReach, { signal });
    const ownRole = group.getAttribute('role');
    const toolbar = group.matches('.dk-button-grid') && (ownRole === null || ownRole === 'group');
    if (toolbar) group.setAttribute('role', 'toolbar');
    place();
    down.add(() => {
        kept.disconnect();
        drawn.disconnect();
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
    });
    down.set = (next) => {
        chosen = next;
        place();
    };
    return keep(attachedGroups, group, down, down.stop);
};

/**
 * How a busy button is attached, for the words it says once a wait is long enough to notice, and
 * the signal that holds it.
 */
export type BusyOptions = AttachOptions & {
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

const attachedBusy = new WeakMap<HTMLElement, Kept<() => void, BusyOptions>>();

/**
 * Makes a busy button work, one marked `data-busy` while what its press started runs, and returns
 * what takes it down. While it is busy the attach marks it `aria-disabled` too, where the page has
 * not, and takes away only the mark it set when the work is done. A press of a busy button, by a
 * pointer or by Enter or Space, is stopped before the button's own handlers and React's `onClick`
 * hear it, so a submit button submits nothing, though a capture listener further up still hears it.
 * Once the button has been busy for the wait the sheet holds its look back by, --dk-wait, its words
 * are said once on the status line, the `data-busy` value, or "Saving." where it is empty, so a
 * fast save says nothing. Words not yet on the line when the work is done are dropped, so a result
 * a toast says is never followed by a late "Saving.", and a button made busy again before the last
 * wait ended starts a wait of its own. Attached again, a button returns what it returned first and
 * runs on the options of its newest holder, a wait under way kept. Taken down, by what it returns
 * or by its `signal`, it takes away the mark it set and says nothing still waiting.
 */
export const attachBusy = (button: HTMLElement, options?: BusyOptions): (() => void) => {
    // A signal already aborted does nothing, so even new options for a button already attached are
    // not taken.
    if (options?.signal?.aborted) return () => undefined;
    const already = join(attachedBusy, button, options);
    if (already) return already;
    const down = teardown(options?.signal, options);
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
    button.addEventListener('click', stop, { capture: true, signal: down.signal });
    if (busy()) start();
    // Ending clears the wait's timer and counts a run, so words already handed to the line find
    // their run over and are left unsaid.
    down.add(() => {
        kept.disconnect();
        end();
    });
    down.set = (next) => {
        chosen = next;
    };
    return keep(attachedBusy, button, down, down.stop);
};

/**
 * How progress is said, for the steps it is said at, where, and what is said at the end, and the
 * signal that holds it.
 */
export type ProgressOptions = AttachOptions & {
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

/** How many steps a bar is said at, so steps given again as the same count compare equal. */
const countOf = ({ steps }: ProgressOptions) => Math.max(1, Math.floor(steps ?? 4));

/** The least time between two steps said, in milliseconds, so one is heard before the next. */
const STEP_GAP = 3000;

const attachedProgress = new WeakMap<HTMLProgressElement, Kept<() => void, ProgressOptions>>();

/** An element's name as a screen reader reads it: its label, the words it names, or its own. */
const nameOf = (element: HTMLProgressElement) =>
    [
        element.labels[0]?.textContent.trim() ?? '',
        namedText(element, 'aria-labelledby'),
        (element.getAttribute('aria-label') ?? '').trim(),
    ].find((name) => name !== '') ?? '';

/**
 * Says how far a `progress` element has come on the status line given, at the steps the page sets,
 * each quarter until it sets others, and once at the end, and returns what takes it down. What is
 * said is the bar's name and the words that describe it, such as "Importing products, 12 of 40.",
 * read as the step is crossed, or how far it has come in hundredths where it has no words. Each is
 * said at once, with no wait for the amount to stop changing, since a steady import never stops, at
 * least three seconds after the last step so one is heard before the next, while the end never
 * waits. Every word it says is polite, so it gives way to a result said with it and waits for firm
 * words being said, and a page's own result or failure is never put out by it. The end, or the
 * `done` words in its place, is said once, until the amount goes back for another run. The amount a
 * bar first shows, as it is attached or once it is known, is not said, though an amount that
 * becomes known at the end, after the bar is attached, is, and a bar with no amount says nothing.
 * Attached again, a bar returns what it returned first and runs on the options of its newest
 * holder, counting its steps again only where they change. Taken down, by what it returns or by its
 * `signal`, it says nothing more on its status line, and a step still waiting there is left
 * unsaid.
 */
export const attachProgress = (
    progress: HTMLProgressElement,
    options?: ProgressOptions
): (() => void) => {
    // A signal already aborted does nothing, so even new options for a bar already attached are not
    // taken.
    if (options?.signal?.aborted) return () => undefined;
    const already = join(attachedProgress, progress, options);
    if (already) return already;
    const down = teardown(options?.signal, options);
    let chosen: ProgressOptions = options ?? {};
    const known = () => progress.hasAttribute('value');
    const stepOf = () => {
        const steps = countOf(chosen);
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
    let last = '';
    const speak = (message: string) => {
        last = message;
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
    down.add(() => {
        kept.disconnect();
        // The last step said is taken off the bar's line, or out of its wait there, so a step
        // still to be heard is never said once the bar is let go. A page's own `say` keeps what
        // it was handed.
        if (!chosen.say && chosen.status) unsay(chosen.status, last);
    });
    down.set = (next) => {
        const moved = countOf(next) !== countOf(chosen);
        chosen = next;
        // Counted again in new steps, so the next step is one of them. The same steps leave the
        // count alone, so a step whose record is still to come is still heard.
        if (moved && known()) reached = stepOf();
    };
    return keep(attachedProgress, progress, down, down.stop);
};
