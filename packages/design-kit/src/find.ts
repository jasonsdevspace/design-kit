/*
 * How the controls find a piece's parts: the root a node lives in, the element an id names there,
 * the ids an attribute names and the field a control stands for, shared by the controls and the
 * kit's words for a failure. No entry of the package exports this module, so a page never reaches
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
