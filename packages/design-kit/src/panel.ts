import { byIdOutward, drawnBefore, FOCUSABLE, isElement, isOff, rootOf } from './find.js';
import { handBack, holds, homeOf, mayHandBack } from './focus.js';
import { type AttachOptions, join, keep, type Kept, teardown } from './teardown.js';

/*
 * The panels a button opens and closes, with the buttons attached, the visitor's last place, and
 * the listeners on each document every panel in it shares, added with the first button attached in
 * it and taken off with the last. A panel's state is kept by the root that holds it, the document
 * or a shadow root, so a panel inside a widget's shadow root and one of the page that share an id
 * stay apart. No entry of the package names this module, so a page imports it only through
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
 * The root a node lives in, where a document with no window, as a template's copy has or a parsed
 * document is before the page takes it in, counts as the page's.
 */
const scopeOfNode = (node: Node): Scope => {
    const root = rootOf(node);
    return root.nodeType === 9 && !(root as Document).defaultView ? document : root;
};

/** The shadow root a node lives in where that root is closed, which the page cannot read into. */
const closedRootOf = (node: Node): ShadowRoot | null => {
    const root = rootOf(node);
    return root.nodeType === 11 && (root as ShadowRoot).mode === 'closed'
        ? (root as ShadowRoot)
        : null;
};

/** The root each attached button's panel was last found in, kept for a button that leaves it. */
const settled = new WeakMap<Element, Scope>();

/**
 * The root that holds the panel a button names: where its id is found from the button's own root
 * out through each host to the document, as a focus request finds an id, so a panel drawn beside
 * its button inside a shadow root is found there, and one of the page from a button inside a
 * widget. Where no element has the id yet, the button's own root, where a panel drawn later is
 * looked for. A button that has left the page keeps the root it was last read in, so its takedown
 * clears the state there, and where the root changes, as it does for a panel the page draws after
 * its button, the panel's state moves with it, so it is never kept in two roots.
 */
const scopeOf = (button: Element): Scope => {
    const held = settled.get(button);
    if (held && !button.isConnected) return held;
    const id = panelIdOf(button);
    const scope = scopeOfNode(byIdOutward(button, id) ?? button);
    if (held && held !== scope) {
        // Only what this button holds moves: the panel it opened, and the mark that the panel has
        // started where no other attached button still names it there, so a page's own panel
        // with the same id keeps its state as a widget draws its own.
        const opener = lastIn(held).get(id);
        if (opener === button) {
            if (!lastIn(scope).has(id)) lastIn(scope).set(id, opener);
            lastIn(held).delete(id);
        }
        const namedThere = [...openers.keys()].some(
            (other) => other !== button && panelIdOf(other) === id && settled.get(other) === held
        );
        if (!namedThere && startedIn(held).delete(id)) startedIn(scope).add(id);
    }
    settled.set(button, scope);
    return scope;
};

/**
 * The children of an element as the page draws them: what a slot is drawn with, flattened through
 * slots within it, its own children where nothing is assigned to it, and the children of an open
 * shadow root in place of its host's.
 */
const drawnChildrenOf = (element: Element): readonly Element[] => {
    if (element.localName === 'slot') {
        const assigned = (element as HTMLSlotElement).assignedElements({ flatten: true });
        return assigned.length > 0 ? assigned : [...element.children];
    }
    return [...(element.shadowRoot ?? element).children];
};

/**
 * Where an element is drawn: the element that holds it as the page draws it and its siblings there,
 * the slot it is assigned to, with a slot assigned on into another kept as itself, its parent, or
 * the host of the shadow root it sits at the top of, a closed one included, since the walk climbs
 * from the element itself.
 */
const drawnIn = (element: Element): readonly [Element, readonly Element[]] | undefined => {
    const slot = element.assignedSlot;
    if (slot) {
        const assigned = slot.assignedElements();
        return [slot, assigned.length > 0 ? assigned : [...slot.children]];
    }
    const parent = element.parentNode;
    if (parent?.nodeType === 11)
        return [(parent as ShadowRoot).host, [...(parent as ShadowRoot).children]];
    return element.parentElement
        ? [element.parentElement, drawnChildrenOf(element.parentElement)]
        : undefined;
};

/**
 * What Tab stops at: the controls a press focuses too, and frames, embedded content, image map
 * links, media with controls and editable regions. A scroll container some browsers stop at is left
 * out, since only its layout says whether it scrolls.
 */
const STOPS = `${FOCUSABLE}, iframe, embed, object, area[href], audio[controls], video[controls], [contenteditable]:not([contenteditable="false"])`;

/** Whether nothing inside an element is drawn for Tab to reach, read from its attributes alone. */
const passedOver = (element: Element): boolean =>
    element.hasAttribute('hidden') || element.hasAttribute('inert');

/**
 * Each stop Tab reaches after a panel, in the order the page draws it, given one at a time so the
 * walk ends at the first that takes focus: what follows the panel where it is drawn, then what
 * follows each element around it, out to the document, through a slot to what is slotted into it
 * and into a following widget's open shadow root. A custom element whose shadow root is closed is
 * given itself, which takes focus where its root delegates it. A stop with a tabindex above 0 is
 * one Tab reaches before the rest, so it is passed over.
 */
const followingOf = function* (panel: Element): Generator<Element> {
    const take = function* (element: Element): Generator<Element> {
        if (passedOver(element)) return;
        if (
            (element.matches(STOPS) && (element as HTMLElement).tabIndex === 0) ||
            (element.localName.includes('-') && !element.shadowRoot)
        )
            yield element;
        const children =
            element.localName === 'details' && !(element as HTMLDetailsElement).open
                ? [...element.children].filter((child) => child.localName === 'summary').slice(0, 1)
                : drawnChildrenOf(element);
        for (const child of children) yield* take(child);
    };
    for (let at: Element = panel; ;) {
        const drawn = drawnIn(at);
        if (!drawn) return;
        const [around, siblings] = drawn;
        const index = siblings.indexOf(at);
        // An element not found where it is drawn takes nothing there, so the walk never goes back.
        if (index >= 0) for (const sibling of siblings.slice(index + 1)) yield* take(sibling);
        at = around;
    }
};

/**
 * Every attached button not let go, with the document it was attached in, kept apart from the page
 * so one in a shadow root is found too, and so a document's listeners come off once no button
 * attached in it is held.
 */
const openers = new Map<HTMLButtonElement, Document>();

/** Every attached button that names the panel the root given holds, in the order they are drawn. */
const openersOf = (id: string, scope: Scope): HTMLButtonElement[] =>
    [...openers.keys()]
        .filter(
            (button) => button.isConnected && panelIdOf(button) === id && scopeOf(button) === scope
        )
        .sort((one, other) => (drawnBefore(one, other) ? -1 : 1));

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
 * each root as the buttons that opened them are.
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
 * panel the keyboard reaches by Tab, in the order the page draws it, through slots and open shadow
 * roots, past the host of a shadow root it sits in too, else the body of the app's frame or the
 * page's main content.
 */
const showPanel = (scope: Scope, id: string, open: boolean, by?: HTMLButtonElement): void => {
    const panel = scope.getElementById(id);
    const buttons = openersOf(id, scope);
    for (const button of buttons) button.setAttribute('aria-expanded', String(open));
    if (open && by) lastIn(scope).set(id, by);
    if (!open) lastIn(scope).delete(id);
    if (!panel) return;
    takeFocus(panel);
    // Inside a closed shadow root the page reads focus as the host, so the root's own reading
    // tells whether focus is in the panel.
    const inside = closedRootOf(panel)?.activeElement;
    const held = inside ? holds(panel, inside) : mayHandBack(panel, lastPath.includes(panel));
    panel.hidden = !open;
    if (open || !held) return;
    handBack(
        jumpFrom(panel),
        ...[by, ...buttons].filter((button) => !isOff(button)),
        // Looked for only once the place a link went to and every button has refused focus, since
        // it reads every element of the page that takes focus.
        () => followingOf(panel),
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
    const at = path.filter(isElement);
    // The innermost attached button the press is in, or a button inside the innermost Close, read
    // through a component's open shadow root, so a button of the component's own inside either
    // counts as it.
    const closeAt = at.findIndex((element) => element.classList.contains('dk-close'));
    const button = at.find(
        (element, index): element is HTMLButtonElement =>
            element.localName === 'button' &&
            (attachedPanels.has(element as HTMLButtonElement) || index < closeAt)
    );
    if (!button) return;
    if (attachedPanels.has(button) && (closeAt < 0 || at.indexOf(button) < closeAt)) {
        if (!isOff(button))
            showPanel(
                scopeOf(button),
                panelIdOf(button),
                button.getAttribute('aria-expanded') !== 'true',
                button
            );
        return;
    }
    const panel = at[closeAt]?.parentElement;
    const id = panel?.id;
    if (!panel || !id) return;
    const scope = scopeOfNode(panel);
    if (scope.getElementById(id) !== panel) return;
    // Read before the root's state, so state a button kept in another root has moved here.
    const named = openersOf(id, scope);
    const last = lastIn(scope);
    if (last.has(id) || named.length) showPanel(scope, id, false, last.get(id));
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
    // The buttons that name it are read first, so a panel's state its button kept in another root,
    // as one the page drew after its button, has moved here.
    if (place.id) openersOf(place.id, scope);
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
 * root closes nothing. A panel's button that is off does not close its own panel, and Escape goes
 * on to a panel around it.
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
            holdClosed(button, false);
        }
    return ![...openers.values()].includes(doc);
};

/**
 * The closed shadow root each attached button sits in, which hears the presses, the focus and the
 * Escape of the panels in it, since the page sees each of them there only as one on the host. Its
 * listeners are added with the first button attached in it and taken off with the last, as a
 * document's are. An open root is never listened on, since its events reach the document whole,
 * and a press heard twice would turn the panel back.
 */
const closedOpeners = new Map<HTMLButtonElement, ShadowRoot>();

/**
 * Holds the closed shadow root a button sits in as it is attached, listening there where no button
 * there had yet, or lets go of it as the button is, and of its listeners once no button there is
 * held.
 */
const holdClosed = (button: HTMLButtonElement, on: boolean): void => {
    const root = on ? closedRootOf(button) : closedOpeners.get(button);
    if (!root) return;
    closedOpeners.delete(button);
    const held = [...closedOpeners.values()].includes(root);
    if (on) closedOpeners.set(button, root);
    if (!held) listen(root, on);
};

/** Adds the listeners every panel in a document shares to it, or takes them off. */
const listen = (target: Scope, on: boolean): void => {
    const how = on ? 'addEventListener' : 'removeEventListener';
    target[how]('focusin', onPanelFocus, true);
    target[how]('click', onPanelPress, true);
    target[how]('pointerdown', onPanelDown, true);
    target[how]('keydown', onPanelKey as EventListener);
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
 * presses, the focus and the Escape of every panel in it, inside its open shadow roots too, and
 * come off once every button attached in it is taken down, and focus is read from the page down, so
 * focus inside the frame counts as in its panel. A button inside a closed shadow root is heard on
 * that root too, since the page sees a press, focus or a key there only as one on the host. A
 * panel's id must be the only one in its root. Attached again, a button returns what it returned
 * first.
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
        holdClosed(opener, false);
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
    holdClosed(opener, true);
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
