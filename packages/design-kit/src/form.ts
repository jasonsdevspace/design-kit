import { byId, CHOICE, fieldName, fieldOf, idsOf, namedText, takesFocus } from './find.js';
import { activeOf, type MoveFocusOptions } from './focus.js';
import { speakOn } from './line.js';
import { restore, unmark } from './marks.js';
import { moveFocus } from './request.js';
import { type CheckedForm, checkedForms, type Checker, formSteppers } from './state.js';
import type { Say } from './status.js';
import { type AttachOptions, join, keep, type Kept, teardown } from './teardown.js';
import { type Checked, type Failure, FAILURES, KIT_WORDS } from './words.js';

/*
 * The form's check of the browser's constraints, its errors and its refusal, and the check each
 * form keeps once however many of its parts are attached, which the steppers in it read from the
 * shared state. No entry of the package names this module, so a page imports it only through
 * `./controls`.
 */

/** How a form is attached, for the step after a submit it refuses, and the signal that holds it. */
export type FormOptions = AttachOptions & {
    /** The status line the refusal is said on, such as the screen's own. */
    readonly status?: HTMLElement | null | undefined;
    /** What says the refusal, for a page that has one already, such as React's `useStatus`. */
    readonly say?: Say | undefined;
    /**
     * An error summary the page draws over the form, focused in place of the first field, and
     * passed over where it cannot take focus, as one hidden, inert, out of sight or not focusable.
     */
    readonly summary?: (() => Element | null) | undefined;
    /**
     * The words for each way a field can fail the browser's constraints, in place of the kit's,
     * as a page in another language gives them, each words or a function of the field.
     */
    readonly errorWords?: FailureWords | undefined;
    /**
     * Called with the fields that fail the browser's constraints on a submit, for a page that draws
     * its errors itself, as React does from its state, and refuses once they are drawn. An attached
     * stepper whose own error shows is left out, whatever its failure, a blank or letters among
     * them, since the stepper owns that error, so the list is empty where only such steppers fail.
     * Called second with every failure in the form's order and the words its field shows, such a
     * stepper's own error's words among them, for an error summary. Without it, the kit draws each
     * error in the field and refuses.
     */
    readonly invalid?:
        ((failures: readonly FieldFailure[], shown: readonly FieldFailure[]) => void) | undefined;
};

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

/** The stepper's range error a control is described by, while the stepper shows it. */
const shownRange = (control: Element): HTMLElement | undefined =>
    idsOf(control, 'aria-describedby')
        .map((id) => byId(control, id))
        .find(
            (part): part is HTMLElement =>
                part instanceof HTMLElement && part.matches('.dk-stepper-range') && !part.hidden
        );

/** An error's words, without the word a screen reader alone is given to start it. */
const ownWords = (error: Element): string => {
    const copy = error.cloneNode(true) as Element;
    for (const hidden of copy.querySelectorAll('.dk-visually-hidden')) hidden.remove();
    return copy.textContent.replace(/\s+/g, ' ').trim();
};

/**
 * The error a failure is shown in, and what takes it away: an error the page already drew for the
 * field given the kit's words, else one the kit draws after the field's hint, above the control or
 * under a set's legend.
 */
const errorFor = (
    field: Element,
    control: Element,
    words: string
): { readonly error: HTMLElement; readonly takeAway: () => void } => {
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

/**
 * Sets up the kit's check of a form, once for every attach in it. The browser's constraints are
 * checked across the whole form as it is submitted, before the page's own handler in the bubble
 * phase, which runs only where every field passes, so it can still check what they cannot express.
 * The form's own attach checks it where there is one, else the first part's, so the form's own goes
 * first and each part's after it. A reset a page calls off leaves the errors, since the values that
 * failed stay. One that goes through takes away the errors the kit drew, has each attached stepper
 * settle on its reset value, and where the form has refused since its last reset or passing submit,
 * whoever drew the errors, says so, since the errors go out of a screen reader's hearing and focus
 * stays on the button. A reset with no refusal standing, as after a save, says nothing. The last
 * attach in the form taken down takes the check away, with a reset's timer still due, and gives the
 * form back its own noValidate, so the browser checks it again.
 */
const checkForm = (own: HTMLFormElement): CheckedForm => {
    const down = teardown();
    const { signal } = down;
    const was = own.noValidate;
    const timers = new Set<number>();
    const checked: CheckedForm = { checkers: [], marks: new Set(), stop: down.stop };
    down.add(() => {
        for (const timer of timers) window.clearTimeout(timer);
        own.noValidate = was;
        unmark(checked.marks);
        // The marks are let go of, so a stepper that outlives this check leaves alone a mark a later
        // one sets.
        checked.marks.clear();
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
                // Every attach's errors go, and the first attach says so where any had a refusal
                // standing.
                const had = checked.checkers.map((one) => one.clear()).includes(true);
                // Each attached stepper settles on its reset value once the kit's errors are gone,
                // so an error of the kit's no longer holds back its own.
                for (const control of own.elements) formSteppers.get(control)?.(true);
                if (had) checked.checkers[0]?.cleared();
            });
            timers.add(timer);
        },
        { signal }
    );
    checkedForms.set(own, checked);
    return checked;
};

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

/** The words of the errors a field is described by, as a screen reader reads them. */
const errorWords = (field: Element): string =>
    namedText(field, 'aria-describedby', (part) => part.matches('.dk-field-error'));

/** How many fields a refused form has in error. */
const countWords = (count: number): string =>
    count === 1 ? '1 field needs attention.' : `${String(count)} fields need attention.`;

/**
 * What a refusal says. Where focus moves to a summary, which reads its own words, it says nothing.
 * Elsewhere, the summary already focused among them, since focus that stays reads nothing, it says
 * the first field's name and error, with the count where more are wrong, or the summary's own words
 * where it already has focus and no field is marked, whatever the field reads itself, since
 * VoiceOver on iOS reads a field's error only as a hint, after a pause or not at all, and focus
 * moved by script may not land. A screen reader that reads the error as focus lands hears it twice,
 * which slows a visitor less than an error never heard.
 */
const refusalWords = (
    to: {
        readonly summary: Element | null;
        readonly wrong: Element | null;
    },
    focused: boolean,
    count: number
): string => {
    if (to.summary && !focused) return '';
    if (to.summary && !to.wrong) return to.summary.textContent.replace(/\s+/g, ' ').trim();
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
    const marks = checked?.marks ?? new Set<Element>();
    for (const control of (own ?? form).querySelectorAll('input, select, textarea, fieldset'))
        if (!control.hasAttribute('aria-invalid')) {
            control.setAttribute('aria-invalid', 'false');
            marks.add(control);
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
 * without script keeps the browser's check, as record 21 has it. Where a field fails, the submit is
 * stopped, a stepper that fails takes back its own words not yet said and shows its own error, and
 * the kit draws each other error as its field draws one and refuses, or hands the other failures to
 * `invalid` for a page that draws them itself and refuses. It draws into the markup it finds, so it
 * draws errors only in markup nothing draws again, a page written by hand or the React components
 * rendered to static HTML and attached from plain script. A form React still draws refuses through
 * `useFormRefusal`, since React writes a field's error and marks again from its props, as record 20
 * has it. An attached stepper owns its error for every failure it holds, so the form never draws on
 * it nor marks it, and its error is the one error either way. `invalid` is handed every failure
 * with the words its field shows as a second list, for an error summary. Each failure's words are
 * the field's own, else the page's `errorWords`, else the kit's, and a stepper's own error takes
 * its `rangeError` alone. A button marked formnovalidate submits unchecked, and errors the kit drew
 * go once their fields pass or the form is reset.
 *
 * A refusal waits a frame, so the errors are drawn, then moves focus to an error summary where the
 * page names one that can take focus, else the first field in error that can take focus, or in a
 * set its checked radio or its first control that can, and says one message on the status line:
 * nothing where focus moves to a summary, whose words it reads, and where it moves to a field or is
 * already on one or on the summary, the first field's name and error, with how many fields need
 * attention where more are wrong, or on the summary with no field marked, the summary's own words,
 * since VoiceOver on iOS reads a field's error only as a hint and focus moved by script may not
 * land. A set counts once however many of its choices are marked. The field's error stays not live.
 * A second refusal calls off one not yet landed, and each refusal returns what calls it off. A
 * reset that goes through takes away the errors the kit drew and, where the form has refused since
 * its last reset or passing submit, whoever drew the errors, says the form is cleared. Attached
 * again, a form returns what it returned first and runs on the options of its newest holder, its
 * errors and its check kept.
 *
 * Taken down by its `signal`, it takes its listeners off, calls off a refusal and a reset's timer
 * still due, and takes away the errors it drew, so nothing is said after, and what it returned does
 * nothing. The form's check and its noValidate go with the last attach in the form. A signal
 * already aborted leaves the form as the markup drew it.
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
    // Whether the form has refused since its last reset or passing submit, whoever drew the
    // errors, so a reset that goes through says the form is cleared.
    let standing = false;
    /** What puts back each field the kit drew an error in, as it was before. */
    const drawn = new Map<Element, () => void>();
    const undraw = (field: Element) => {
        drawn.get(field)?.();
        drawn.delete(field);
    };
    /**
     * Draws a failure's error in its field as the kit's field draws one: after its hint, above the
     * control or under a set's legend, starting with a word a screen reader reads, and described
     * after the hint. An error the page already drew for the field takes the kit's words. An
     * attached stepper whose own error shows never reaches it, since the stepper owns that error.
     */
    const draw = ({ field, control, words }: FieldFailure) => {
        undraw(field);
        const { marked, described } = marksOf(field, control);
        const before = [...new Set([...marked, ...described])].map(
            (one) =>
                [one, one.getAttribute('aria-invalid'), idsOf(one, 'aria-describedby')] as const
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
            // change, so a mark the page has since taken away or set stays its own.
            for (const [one, invalid, describedBy] of before) {
                if (marked.includes(one) && one.getAttribute('aria-invalid') === 'true')
                    restore(one, 'aria-invalid', invalid);
                const had = describedBy.includes(error.id);
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
        standing = true;
        pending?.();
        const failures = failed;
        failed = [];
        // Read in the same frame as focus moves, before it moves, so what a refusal says follows
        // where focus was.
        let target: HTMLElement | null = null;
        const frame = window.requestAnimationFrame(() => {
            // A summary that cannot take focus, hidden, inert, out of sight or not focusable, is
            // passed over, as one the page does not name.
            const named = summed ? chosen.summary?.() : null;
            const summary =
                named &&
                takesFocus(named) &&
                (named.hasAttribute('tabindex') || named.tabIndex >= 0)
                    ? named
                    : null;
            const fields = wrongFields(within);
            const field = fields.map(focusIn).find((one) => one !== null) ?? null;
            target = summary ?? field;
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
        if (failures.length === 0) {
            standing = false;
            return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        failed = failures;
        // A stepper that fails settles first, with any error the kit drew on it taken away, so only
        // the page's own error holds its own back, and takes back its waiting words, so the refusal
        // is the one message.
        for (const { field, control } of failures) {
            const settle = formSteppers.get(control);
            if (settle) {
                undraw(field);
                settle(false);
            }
        }
        // A stepper whose own error shows owns it, so the form draws nothing there and hands the
        // page no failure to draw from, while the refusal still counts and names the field. The
        // second list, for a summary, holds every failure with the words its field shows.
        const own = failures.filter((failure) => !shownRange(failure.control));
        if (chosen.invalid) {
            const shown = failures.map((failure) => {
                const range = shownRange(failure.control);
                return range ? { ...failure, words: ownWords(range) } : failure;
            });
            chosen.invalid(own, shown);
            return;
        }
        for (const failure of own) draw(failure);
        refuseIn(whole, false);
    };
    // Takes away the errors the kit drew, and says whether a refusal stood. A refusal still due is
    // called off with them, since it would say errors no longer shown in place of what follows.
    const clear = () => {
        pending?.();
        const had = standing;
        standing = false;
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
