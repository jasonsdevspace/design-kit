/*
 * How the controls put back what they marked on a page's element: an attribute as it was, a field's
 * description with a stepper's parts in their place, and the marks a form set on fields not in
 * error. No entry of the package exports this module, so a page never reaches it.
 */

/** An element's attribute put back as it was, or taken away where it had none. */
export const restore = (element: Element, name: string, value: string | null) => {
    if (value === null) element.removeAttribute(name);
    else element.setAttribute(name, value);
};

/**
 * A field's description with a stepper's own parts in their place: the error while it shows, which
 * names the range itself, or else the range in words when there are some, after the page's own.
 */
export const describedBy = (
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

/** Takes off the marks set on fields not in error, where they still say so. */
export const unmark = (marks: Iterable<Element>) => {
    for (const one of marks)
        if (one.getAttribute('aria-invalid') === 'false') one.removeAttribute('aria-invalid');
};
