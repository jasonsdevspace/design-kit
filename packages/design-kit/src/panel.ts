import { FOCUSABLE, isOff } from './find.js';
import { handBack, homeOf, mayHandBack } from './focus.js';
import { type AttachOptions, join, keep, type Kept, teardown } from './teardown.js';

/*
 * The panels a button opens and closes, with the buttons attached, the visitor's last place, and
 * the listeners on the document every panel shares, added with the first button attached and taken
 * off with the last. No entry of the package exports this module, so a page never reaches it.
 */

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
        .sort((one, other) =>
            one.compareDocumentPosition(other) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1
        );

/**
 * Where the visitor's place last was, the path of the last focus that moved or of their last
 * press, from what it reached up, so a panel it was in still counts after the page draws away or
 * turns off the button pressed. A press by a page's script is not the visitor's and is not kept.
 * It is kept once the last button is let go, since a page that draws its only button again lets
 * the old one go before the new one is attached, and the place in the panel has to outlive that.
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
    const buttons = openersOf(id);
    for (const button of buttons) button.setAttribute('aria-expanded', String(open));
    if (open && by) lastOpener.set(id, by);
    if (!open) lastOpener.delete(id);
    if (!panel) return;
    takeFocus(panel);
    const held = mayHandBack(panel, lastPath.includes(panel));
    panel.hidden = !open;
    if (open || !held) return;
    handBack(
        jumpFrom(panel),
        ...[by, ...buttons].filter((button) => !isOff(button)),
        // Looked for only once the place a link went to and every button has refused focus, since
        // it reads every element of the page that takes focus.
        () =>
            [...document.querySelectorAll<HTMLElement | SVGElement>(FOCUSABLE)].filter(
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
    // Safari ends composing with an Escape whose keydown carries the key code 229 instead.
    const composing = event.isComposing || event.keyCode === 229;
    if (event.key !== 'Escape' || event.defaultPrevented || composing) return;
    // The elements from the one the key was pressed in, inside a page's own component where the
    // component's shadow root is open, though the event's target names only the component's host.
    // Read only for an Escape, so every other key the page hears costs nothing here.
    const path = event.composedPath().filter((node) => node instanceof Element);
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
 * nothing, though a button with no aria-controls throws under it as under any other. A button taken
 * down is marked collapsed. A button taken from the page without being taken down stays held, and
 * keeps the document's listeners, until it is. An open panel stays the kit's while an attached
 * button names it, so once the button that opened it is taken down, Escape and its Close both still
 * close it, and focus goes back to the first attached button that names it. A button attached to it
 * while it is open takes it where no attached button names it. Once none does, neither closes it,
 * and the page holds it as it is.
 */
export const attachPanel = (opener: HTMLButtonElement, options?: AttachOptions): PanelControl => {
    const idle: PanelControl = { set: () => undefined, detach: () => undefined };
    // A button already attached is handed back as it is, before its panel's name is read, so one
    // that has since lost its aria-controls still returns its control. A signal already aborted
    // does nothing to it.
    const already = join(attachedPanels, opener, options, idle);
    if (already) return already;
    // Checked before the signal, so a button that names no panel throws at its first attach
    // whatever the signal.
    if (!panelIdOf(opener)) throw new Error("a panel's button needs aria-controls");
    if (options?.signal?.aborted) return idle;
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
