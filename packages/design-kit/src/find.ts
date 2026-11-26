/*
 * How the controls find a piece's parts: the root a node lives in, the element an id names there
 * or in a root around it, the ids an attribute names and the field a control stands for, whether a
 * control is off or takes focus, and the words that name a field, shared by the parts of the
 * controls and the kit's words for a failure. No entry of the package exports this module, so a
 * page never reaches it.
 */

/**
 * The root a node lives in: a shadow root where it sits in one, else the document it sits in, the
 * page's or a frame's, or the document itself where a document is given, told apart by node type
 * and host without the page's own `ShadowRoot`, which a frame's is not. A document is never asked
 * whether it has a host, since an element named `host` on it answers for it.
 */
export const rootOf = (node: Node | null | undefined): Document | ShadowRoot => {
    const root = node?.getRootNode();
    return root?.nodeType === 9 || (root?.nodeType === 11 && !!(root as Partial<ShadowRoot>).host)
        ? (root as Document | ShadowRoot)
        : (node?.ownerDocument ?? document);
};

/**
 * The element an id names in the root a node lives in, so a piece inside a shadow root finds its
 * own parts and never an element of the page around it that shares the id.
 */
export const byId = (near: Node | null | undefined, id: string): Element | null =>
    rootOf(near).getElementById(id);

/**
 * The element an id names in the root a node lives in, else in each root around it, out through
 * the hosts to the document the node sits in, so a focus request asked from a widget's shadow root
 * finds the widget's own element first and one of the page around it after. The walk ends at the
 * root that is no shadow root, told by its node type, since an element named `host` on a document
 * would answer for it.
 */
export const byIdOutward = (near: Node | null | undefined, id: string): Element | null => {
    for (let root = rootOf(near); ; root = rootOf((root as ShadowRoot).host)) {
        const found = root.getElementById(id);
        if (found || root.nodeType !== 11) return found;
    }
};

export const CHOICE = 'input[type="checkbox"], input[type="radio"]';

/** The ids an element's attribute names, in order. */
export const idsOf = (element: Element, attribute: string): string[] =>
    (element.getAttribute(attribute) ?? '').split(/\s+/).filter(Boolean);

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
export const fieldOf = (marked: Element): Element => {
    if (!marked.matches(CHOICE)) return marked;
    const set = marked.closest('fieldset');
    return set && holdsOneSet(set) ? set : marked;
};

/**
 * Whether a node or an event's target is an element, of the page's own window or of a frame's,
 * which an element of a frame the page drives is, so a check by the page's own `Element` would
 * refuse it.
 */
export const isElement = (node: unknown): node is Element =>
    (node as Partial<Node> | null | undefined)?.nodeType === 1;

/** Whether a node is an HTML element, of the page's own window or of a frame's, as `isElement`. */
export const isHtml = (node: unknown): node is HTMLElement =>
    isElement(node) && node.namespaceURI === 'http://www.w3.org/1999/xhtml';

/** Whether a node is a control a form checks, an input, a select or a text area, of any window. */
export const isChecked = (
    node: unknown
): node is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
    isHtml(node) && ['input', 'select', 'textarea'].includes(node.localName);

/** Whether a control is marked off, kept in the tab order to say why rather than to act. */
export const isOff = (control: Element | undefined): boolean =>
    control?.getAttribute('aria-disabled') === 'true';

/** Whether a control can take focus: enabled, not inert, and in sight. */
export const takesFocus = (control: Element): control is HTMLElement =>
    isHtml(control) &&
    !control.matches(':disabled') &&
    !control.closest('[inert]') &&
    control.checkVisibility();

/**
 * The words of the shown elements an element's attribute names by id, in order, as a screen reader
 * reads them, such as its description, or only those of the parts a check keeps.
 */
export const namedText = (
    element: Element,
    attribute: string,
    wanted: (part: HTMLElement) => boolean = () => true
): string =>
    idsOf(element, attribute)
        .map((id) => byId(element, id))
        .filter((part): part is HTMLElement => isHtml(part) && !part.hidden && wanted(part))
        .map((part) => part.textContent.trim())
        .join(' ');

/** An element's words without those it hides from a screen reader, such as a required mark. */
const shownText = (element: Element | null | undefined): string | undefined => {
    if (!element) return undefined;
    const copy = element.cloneNode(true) as Element;
    for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) hidden.remove();
    return copy.textContent;
};

/**
 * A field's name, from its set's legend or its control's label, to say before an error, without
 * the words the legend or label hides from a screen reader.
 */
export const fieldName = (field: Element): string => {
    const named =
        shownText(field.querySelector(':scope > legend')) ??
        (isChecked(field) ? shownText(field.labels?.[0]) : null) ??
        field.getAttribute('aria-label') ??
        '';
    return named.replace(/\s+/g, ' ').trim();
};

/**
 * What a press can land on that takes focus, so a press inside a button finds the button, with
 * `*|href` matching an SVG link's `xlink:href` too.
 */
export const FOCUSABLE = 'a[*|href], button, input, select, textarea, summary, [tabindex]';

/**
 * Where a node is drawn: the slot it is assigned to, its parent, the host of the shadow root it sits
 * at the top of, a closed one included, or for a document's root element the frame that shows it,
 * where the page can reach that frame.
 */
const drawnParent = (node: Node): Node | null => {
    const slot = (node as Partial<Element>).assignedSlot;
    if (slot) return slot;
    const parent = node.parentNode;
    if (parent?.nodeType === 11) return (parent as Partial<ShadowRoot>).host ?? null;
    if (parent?.nodeType === 9) return (parent as Document).defaultView?.frameElement ?? null;
    return parent;
};

/** The node and each node it is drawn in, out to the page, the page's first. */
const drawnPath = (node: Node): Node[] => {
    const path: Node[] = [];
    for (let at: Node | null = node; at; at = drawnParent(at)) path.unshift(at);
    return path;
};

/**
 * Whether one node comes before another as the page draws them, through slots, shadow roots and
 * frames of the page's origin, compared where the two are first drawn apart: a node before what is
 * drawn inside it, what a shadow root holds before a host's children no slot draws, and otherwise
 * by their order in the tree they share, since the browser orders nodes of different trees as it
 * chooses.
 */
export const drawnBefore = (one: Node, other: Node): boolean => {
    const mine = drawnPath(one);
    const theirs = drawnPath(other);
    if (mine[0] !== theirs[0]) return false;
    let at = 0;
    while (at < mine.length && at < theirs.length && mine[at] === theirs[at]) at += 1;
    const a = mine[at];
    const b = theirs[at];
    if (!a) return b !== undefined;
    if (!b) return false;
    const inA = a.getRootNode();
    const inB = b.getRootNode();
    if (inA !== inB) return (inA as Partial<ShadowRoot>).host === mine[at - 1];
    return !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
};
