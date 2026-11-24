/*
 * How the controls find a piece's parts: the root a node lives in, the element an id names there,
 * the ids an attribute names and the field a control stands for, whether a control is off or takes
 * focus, and the words that name a field, shared by the parts of the controls and the kit's words
 * for a failure. No entry of the package exports this module, so a page never reaches
 * it.
 */

/** The root a node lives in: a shadow root where it sits in one, else the document. */
export const rootOf = (node: Node | null | undefined): Document | ShadowRoot => {
    const root = node?.getRootNode();
    return root instanceof ShadowRoot ? root : document;
};

/**
 * The element an id names in the root a node lives in, so a piece inside a shadow root finds its
 * own parts and never an element of the page around it that shares the id.
 */
export const byId = (near: Node | null | undefined, id: string): Element | null =>
    rootOf(near).getElementById(id);

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

/** Whether a control is marked off, kept in the tab order to say why rather than to act. */
export const isOff = (control: Element | undefined): boolean =>
    control?.getAttribute('aria-disabled') === 'true';

/** Whether a control can take focus: enabled, not inert, and in sight. */
export const takesFocus = (control: Element): control is HTMLElement =>
    control instanceof HTMLElement &&
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
        .filter(
            (part): part is HTMLElement =>
                part instanceof HTMLElement && !part.hidden && wanted(part)
        )
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
        (field instanceof HTMLInputElement ||
        field instanceof HTMLSelectElement ||
        field instanceof HTMLTextAreaElement
            ? shownText(field.labels?.[0])
            : null) ??
        field.getAttribute('aria-label') ??
        '';
    return named.replace(/\s+/g, ' ').trim();
};

/**
 * What a press can land on that takes focus, so a press inside a button finds the button, with
 * `*|href` matching an SVG link's `xlink:href` too.
 */
export const FOCUSABLE = 'a[*|href], button, input, select, textarea, summary, [tabindex]';
