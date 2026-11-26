import { byIdOutward, FOCUSABLE, isElement, isOff, rootOf } from './find.js';
import { handBack, homeOf, mayHandBack } from './focus.js';
import { type AttachOptions, join, keep, type Kept, teardown } from './teardown.js';

/*
 * The panels a button opens and closes, with the buttons attached, the visitor's last place, and
 * the listeners on each document every panel in it shares, added with the first button attached in
 * it and taken off with the last. A panel's state is kept by the root that holds it, the document or
 * a shadow root, so a panel inside a widget's shadow root and one of the page that share an id stay
 * apart. No entry of the package names this module, so a page imports it only through
 * `./controls`.
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

/** The root that holds a panel: a document, the page's or a frame's, or a shadow root. */
type Scope = Document | ShadowRoot;

/**
 * The root a node lives in, where one with no window, as a template's copy or a parsed document is
 * before the page puts it in, counts as the page's, which takes it in.
 */
const scopeOfNode = (node: Node): Scope => {
    const root = rootOf(node);
    return root.nodeType === 9 && !(root as Document).defaultView ? document : root;
};

/**
 * The root that holds the panel a button names: where its id is found from the button's own root
 * out through each host to the document, as a focus request finds an id, so a panel drawn beside its
 * button inside a shadow root is found there, and one of the page from a button inside a widget.
 * Where no element has the id yet, the button's own root, where a panel drawn later is looked for.
 */
const scopeOf = (button: Element): Scope =>
    scopeOfNode(byIdOutward(button, panelIdOf(button)) ?? button);

/**
 * Every attached button not let go, with the document it was attached in, kept apart from the page
 * so one in a shadow root is found too, and so a document's listeners come off once no button
 * attached in it is held.
 */
const openers = new Map<HTMLButtonElement, Document>();

/** Every attached button that names the panel the root given holds, in the document's order. */
const openersOf = (id: string, scope: Scope): HTMLButtonElement[] =>
    [...openers.keys()]
        .filter(
            (button) => button.isConnected && panelIdOf(button) === id && scopeOf(button) === scope
        )
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

/** What a root holds of the panels' state, made as it is first asked for. */
const heldIn = <T>(map: WeakMap<Scope, T>, scope: Scope, made: () => T): T => {
    let held = map.get(scope);
    if (!held) map.set(scope, (held = made()));
    return held;
};

/**
 * The button that opened each panel that is open, let go as the panel closes, kept for each root,
 * so a panel of the page and one of a frame or of a shadow root that share an id stay apart.
 */
const lastOpeners = new WeakMap<Scope, Map<string, HTMLButtonElement>>();
const lastIn = (scope: Scope) =>
    heldIn(lastOpeners, scope, () => new Map<string, HTMLButtonElement>());

/**
 * The panels a button has started, so a button attached later follows the panel as it is, kept for
 * each document as the buttons that opened them are.
 */
const startedPanels = new WeakMap<Scope, Set<string>>();
const startedIn = (scope: Scope) => heldIn(startedPanels, scope, () => new Set<string>());

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
    const doc = panel.ownerDocument;
    const pressed = lastWasPress
        ? lastPath.find(
              (node): node is HTMLAnchorElement | SVGLink =>
                  isElement(node) &&
                  node.localName === 'a' &&
                  panel.contains(node) &&
                  // An SVG link's target is an object, so the attribute is read for both kinds of
                  // link.
                  !node.getAttribute('target') &&
                  !node.hasAttribute('download')
          )
        : undefined;
    // An SVG link's address is an object, read through an HTML link, which resolves it as the
    // browser does.
    const link =
        typeof pressed?.href === 'object'
            ? Object.assign(doc.createElement('a'), { href: pressed.href.baseVal })
            : (pressed as HTMLAnchorElement | undefined);
    let id = link?.hash.slice(1) ?? '';
    try {
        id = decodeURIComponent(id);
    } catch {
        // A fragment that is not encoded as a whole is looked for as written.
    }
    const { location } = doc;
    const jump: HTMLElement | SVGElement | null =
        link?.origin === location.origin &&
        link.pathname === location.pathname &&
        link.search === location.search
            ? doc.getElementById(id)
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
const showPanel = (scope: Scope, id: string, open: boolean, by?: HTMLButtonElement): void => {
    const panel = scope.getElementById(id);
    const buttons = openersOf(id, scope);
    for (const button of buttons) button.setAttribute('aria-expanded', String(open));
    if (open && by) lastIn(scope).set(id, by);
    if (!open) lastIn(scope).delete(id);
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
            [...scope.querySelectorAll<HTMLElement | SVGElement>(FOCUSABLE)].filter(
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
 * handler that stops a click inside the panel does not keep its Close from closing it. The button
 * pressed is read from the press's path, inside a shadow root where the root is open, though the
 * event's target names only its host. A Close closes a panel an attached button opened or names,
 * and only the panel its id finds in its own root, so content that reuses the id after it cannot
 * close or mark the real one.
 */
const onPanelPress = (event: Event): void => {
    const path = event.composedPath();
    if (event.isTrusted) {
        lastPath = path;
        lastWasPress = true;
    }
    const button = path.find(
        (node): node is HTMLButtonElement => isElement(node) && node.localName === 'button'
    );
    if (!button) return;
    if (attachedPanels.has(button)) {
        if (!isOff(button))
            showPanel(
                scopeOf(button),
                panelIdOf(button),
                button.getAttribute('aria-expanded') !== 'true',
                button
            );
        return;
    }
    const panel = button.closest('.dk-close')?.parentElement;
    const id = panel?.id;
    if (!panel || !id) return;
    const scope = scopeOfNode(panel);
    if (scope.getElementById(id) !== panel) return;
    const last = lastIn(scope);
    if (last.has(id) || openersOf(id, scope).length) showPanel(scope, id, false, last.get(id));
};

/** Where focus moves, kept always, so an older place never outlives what followed it. */
const onPanelFocus = (event: Event): void => {
    lastPath = event.composedPath();
    lastWasPress = false;
};

/**
 * As a press begins, each open panel it lands in takes focus, a panel drawn again among them, one
 * inside an open shadow root too.
 */
const onPanelDown = (event: Event): void => {
    for (const place of event.composedPath())
        if (isElement(place) && place.id && lastIn(scopeOfNode(place)).has(place.id))
            takeFocus(place as HTMLElement);
};

/** A field where Escape means something of its own: a search with words, or a list that opens. */
const ownsEscape = (target: Element): boolean =>
    (target.matches('input[type="search"]') && (target as HTMLInputElement).value !== '') ||
    target.matches(
        '[aria-expanded="true"]:is([role="combobox"], [aria-haspopup]:not([aria-haspopup="false"]))'
    );

/** An open dialog or an open popover, which takes its own Escape. */
const isOpenOver = (place: Element): boolean =>
    place.matches('dialog[open]') ||
    (place.hasAttribute('popover') && place.matches(':popover-open'));

/**
 * The open panel an element on an Escape's path stands for, by its root and id: the panel itself,
 * or the panel an attached button names where the key was pressed on that button. A panel is the
 * element its id finds in its own root, so an element of another root that shares a panel's id
 * stands for none, and a panel's button that is off stands for none, so Escape goes on to a panel
 * around it.
 */
const openPanelAt = (
    place: Element,
    pressed: boolean
): { readonly scope: Scope; readonly id: string } | null => {
    if (pressed && attachedPanels.has(place as HTMLButtonElement)) {
        const scope = scopeOf(place);
        const id = isOff(place) ? '' : panelIdOf(place);
        return lastIn(scope).has(id) ? { scope, id } : null;
    }
    const scope = scopeOfNode(place);
    return lastIn(scope).has(place.id) && scope.getElementById(place.id) === place
        ? { scope, id: place.id }
        : null;
};

/**
 * Escape closes the innermost open panel that holds focus, or whose button has it, and marks the
 * press handled, so a dialog around the panel stays open. It leaves alone an Escape the page has
 * already handled, one that ends typing in a script such as Japanese, which Safari marks by the key
 * code 229, one in an open dialog or an open popover inside the panel, and one on a search with
 * words in it or on a combobox or a button whose list or menu is open, where Escape means something
 * of its own. Those checks read where the key was pressed, inside a page's own component where the
 * component's shadow root is open, and the component's host among them. A panel and its button
 * inside an open shadow root are read there too, and an element that shares a panel's id in another
 * root closes nothing. A panel's button that is off does not close its own panel, and Escape goes on
 * to a panel around it.
 */
const onPanelKey = (event: KeyboardEvent): void => {
    const target = event.target;
    // Safari ends composing with an Escape whose keydown carries the key code 229 instead.
    const composing = event.isComposing || event.keyCode === 229;
    if (event.key !== 'Escape' || event.defaultPrevented || composing) return;
    // The elements from the one the key was pressed in, inside a page's own component where the
    // component's shadow root is open, though the event's target names only the component's host.
    // Read only for an Escape, so every other key the page hears costs nothing here.
    const path = event.composedPath().filter(isElement);
    // A field, a combobox or a menu button keeps its Escape, from the element the key was pressed
    // in out to that host, so a component that marks its host as a combobox keeps it too.
    if (!isElement(target) || path.slice(0, path.indexOf(target) + 1).some(ownsEscape)) return;
    // The element the key was pressed on, inside an open shadow root too.
    const pressed = path[0];
    for (const place of path) {
        // An open dialog or popover inside the panel takes its own Escape.
        if (isOpenOver(place)) return;
        const open = openPanelAt(place, place === pressed);
        if (!open) continue;
        event.preventDefault();
        showPanel(open.scope, open.id, false, lastIn(open.scope).get(open.id));
        return;
    }
};

/**
 * Lets go of every button whose document has lost its window, as a frame's that loaded another page
 * or left the page, taking that document's listeners off once none of its buttons is held, and says
 * whether the document given holds no button any more. Run as a button is attached or let go, so a
 * frame gone without a takedown keeps nothing alive for long.
 */
const letGo = (doc: Document): boolean => {
    for (const [button, held] of openers)
        if (!held.defaultView) {
            openers.delete(button);
            if (![...openers.values()].includes(held)) listen(held, false);
        }
    return ![...openers.values()].includes(doc);
};

/** Adds the listeners every panel in a document shares to it, or takes them off. */
const listen = (doc: Document, on: boolean): void => {
    const how = on ? 'addEventListener' : 'removeEventListener';
    doc[how]('focusin', onPanelFocus, true);
    doc[how]('click', onPanelPress, true);
    doc[how]('pointerdown', onPanelDown, true);
    doc[how]('keydown', onPanelKey as EventListener);
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
 * panel is found at each press by its id, from the button's own root out through each host to the
 * document, so one drawn again keeps working and one beside its button inside an open shadow root
 * opens there, and a button drawn again works once it is attached. Listeners on the document the
 * button sits in as it is attached, a frame's where the page attaches it inside one, hear the
 * presses, the focus and the Escape of every panel in it, inside its open shadow roots too, and come
 * off once every button attached in it is taken down, and focus is read from the page down, so
 * focus inside the frame counts as in its panel. A panel's id must be the only one in its root.
 * Attached again, a button returns what it returned first.
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
    // The document the button sits in as it is attached, a frame's where the page attaches it
    // inside one, which holds its panel and hears its presses, focus and keys. One with no window,
    // as a template's copy or a parsed document is before the page puts it in, counts as the
    // page's, which takes the button in.
    const doc = opener.ownerDocument.defaultView ? opener.ownerDocument : document;
    const control: PanelControl = {
        set: (open) => {
            const id = panelIdOf(opener);
            const scope = scopeOf(opener);
            if (!down.signal.aborted) showPanel(scope, id, open, lastIn(scope).get(id) ?? opener);
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
        const scope = scopeOf(opener);
        const last = lastIn(scope);
        for (const [id, button] of last) {
            if (button !== opener) continue;
            const next = openersOf(id, scope)[0];
            if (next) last.set(id, next);
            else last.delete(id);
        }
        if (!letGo(doc)) return;
        listen(doc, false);
        // An open panel stays started, so its button drawn again finds it open rather than
        // starting it as the new markup says.
        const started = startedIn(scope);
        for (const id of started)
            if (scope.getElementById(id)?.hidden !== false) started.delete(id);
    });
    keep(attachedPanels, opener, down, control);
    if (letGo(doc)) listen(doc, true);
    openers.set(opener, doc);
    // Safari focuses a pressed button only where it has a tabindex, so the kit gives one where the
    // page set none, and keeps any the page set, such as a toolbar's that moves among its buttons.
    if (!opener.hasAttribute('tabindex')) opener.tabIndex = 0;
    // The first button for a panel starts it as its markup says, and a later one, a button drawn
    // again among them, only marks itself as the panel is, so it neither moves the panel nor
    // takes the place of the button that opened it.
    const id = panelIdOf(opener);
    const scope = scopeOf(opener);
    const panel = scope.getElementById(id);
    const started = startedIn(scope);
    const last = lastIn(scope);
    if (started.has(id) && panel) {
        opener.setAttribute('aria-expanded', String(!panel.hidden));
        // An open panel no attached button named is the kit's again, so Escape closes it as its
        // Close does.
        if (!panel.hidden && !last.has(id)) last.set(id, opener);
    } else control.set(opener.getAttribute('aria-expanded') === 'true');
    started.add(id);
    return control;
};
