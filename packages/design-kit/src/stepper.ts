import { fieldName, isOff } from './find.js';
import { handBack, homeOf, isFocused } from './focus.js';
import { hush, say, type Spoken, unsay } from './line.js';
import { describedBy, restore, unmark } from './marks.js';
import { checkedForms, formSteppers } from './state.js';
import type { Say } from './status.js';
import { type AttachOptions, join, keep, type Kept, teardown } from './teardown.js';

/*
 * The stepper, which steps a number field by its buttons, says each press, and owns its error at a
 * change, a submit and a reset, settling as its form refuses it or is reset through the state the
 * form shares. No entry of the package names this module, so a page imports it only through
 * `./controls`.
 */

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
    if (isFocused(from)) handBack(homeOf(stepper));
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
 * typed value the browser's constraints refuse, outside the limits, between steps, no number, or
 * none at all in a field that is required, shows the stepper's own error once the value is changed,
 * or as focus leaves letters typed into a blank field, which fire no change, and says it on the
 * status line after the field's name, as a refused form names a field, while a blank in a field
 * that is not required passes and a refusal the page sets of its own is left to the page. An error
 * that would be drawn while a press on a control anywhere outside the stepper is down, as on a Save
 * button below it, waits until the press ends or turns into a drag, so the control is never moved
 * from under the pointer and its click lands. A form that refuses a stepper has it take back words
 * not yet said, so the refusal is the one message, and show its own error for whichever of those
 * failures it holds, a blank or letters as well as a value past the range, since the stepper owns
 * its error at a submit and a reset as at a change and the form never draws on it. A value drawn
 * outside the limits or between steps shows the error as the stepper is attached or a form's reset
 * brings the value back, with nothing said, unless the field is disabled or read only or the page
 * shows an error of its own. The error is cleared as soon as the value is right again, and a reset
 * that goes through settles it on its reset value once its form's errors are gone. A stepper in
 * which the page shows an error of its own leaves its failure to the form. Only the error's own id
 * and the invalid state it set are added and taken away, the state put back to "false" in a form
 * the kit checks, as the form marks every field not in error, and taken away with the stepper once
 * the field has left the page, as its form lets go of the field then, while a field still in the
 * page keeps it until its form is let go. A hint or an error the page draws keeps its place, and a
 * shown error is put back whenever a page that draws the field again, as React does, rewrites its
 * description or its invalid mark. The field is described by its range in words, after the page's
 * own description, and while the error is shown by the error alone, which names the range itself. A
 * press that lands on a limit says so with the value, and a page's words, given as an option, are
 * said after it in the same message, on the page's status line when one is given. Taken down while
 * one of its buttons has focus, it hands focus to its value where the value is read only and
 * enabled, and otherwise, or where the value refuses focus, to the stepper itself, since an
 * editable value would open a phone's keyboard. The stepper, which the markup draws as a group
 * named by its field's label, then holds focus and draws the focus ring where the browser shows
 * focus. A stepper with no tabindex is given one of -1 then, which stays. Where the stepper refuses
 * focus too, focus goes on to the app frame's body or the page's main content. Focus the page has
 * moved elsewhere stays. It takes the stepper's field or the stepper, attaches each stepper once
 * whichever it is given, runs on the options of its newest holder, and returns what takes it down
 * again.
 */
export const attachStepper = (element: HTMLElement, options?: StepperOptions): (() => void) => {
    const field = element.closest<HTMLElement>('.dk-field') ?? element;
    const stepper = element.matches('.dk-stepper')
        ? element
        : (field.querySelector<HTMLElement>('.dk-stepper') ?? element);
    const idle = () => undefined;
    // A stepper already attached is handed back as it is, before its parts are looked for, so one
    // whose markup has since lost a part still returns its detach. A signal already aborted does
    // nothing to it, so even new options are not taken.
    const already = join(attachedSteppers, stepper, options, idle);
    if (already) return already;
    // Read before the signal, so markup missing a part throws at its first attach whatever the
    // signal.
    const parts = stepperParts(field);
    if (options?.signal?.aborted) return idle;
    let chosen: StepperOptions = options ?? {};
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
        // focus stays, marked off, until focus leaves it, so focus is never dropped. Only an
        // attached stepper gets here, since its listeners, its watch and its place in the form come
        // off as it is taken down, which hides the buttons itself.
        const fixed = input.readOnly && !input.disabled;
        for (const button of [down, up]) button.hidden = fixed && !isFocused(button);
    };
    let setInvalid = false;
    // Every form the value has stood in, so a teardown that finds it gone from the page has each
    // form's check let go of it and takes its mark away, whoever set it.
    const homes = new Set(input.form ? [input.form] : []);
    /**
     * Puts the range in words in the field's description, after the page's own, or the error in its
     * place while the error shows. Each is written only when it changes, so the watch below, woken
     * by this writing, finds nothing left to write and stops.
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
        if (input.form) homes.add(input.form);
        if (range) range.hidden = !wrong;
        describe();
        if (!range) return;
        if (wrong && input.getAttribute('aria-invalid') !== 'true') {
            input.setAttribute('aria-invalid', 'true');
            setInvalid = true;
        } else if (!wrong && setInvalid && !pageError()) {
            // Put back as the form marks every field not in error, read as the error clears, and
            // taken away where no checked form holds the stepper.
            const checked = input.form ? checkedForms.get(input.form) : undefined;
            restore(input, 'aria-invalid', checked ? 'false' : null);
            checked?.marks.add(input);
            setInvalid = false;
        }
    };
    /** Whether the value is outside the limits or between steps. */
    const outOfRange = () => {
        const { rangeUnderflow, rangeOverflow, stepMismatch } = input.validity;
        return rangeUnderflow || rangeOverflow || stepMismatch;
    };
    /**
     * Whether the value is one the stepper's error names, which is where the browser's constraints
     * say so, as record 21 has it, so the error and the form's refusal agree: outside the limits,
     * between steps, no number, as letters typed, or none at all in a field that is required. A
     * blank in a field that is not required passes, and a page's own refusal, set with
     * `setCustomValidity`, is the page's to show.
     */
    const wrong = () => input.validity.badInput || input.validity.valueMissing || outOfRange();
    /**
     * Whether a value the page drew, as the stepper is attached or a form's reset brings it back,
     * shows the error at once, with nothing said. A blank field, which is never out of range, is
     * left unflagged as it is drawn, required or not, so a form that starts empty shows no error as
     * it loads, a field no one can change is never marked wrong, and an error the page shows of its
     * own keeps the field to itself.
     */
    const drawnWrong = () => !locked() && outOfRange() && !pageError();
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
    /**
     * Settles the stepper as its form refuses it or is reset: its waiting words go, and its error
     * shows for what fails, or on a reset for a value drawn wrong, unless the page shows an error
     * of its own in the field, which is the page's to show.
     */
    const settle = (reset: boolean) => {
        quiet();
        mark();
        report(reset ? drawnWrong() : wrong() && !pageError());
    };
    formSteppers.set(input, settle);
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
    /**
     * Whether a press on anything outside the stepper is down, read by the pressed element, the last
     * of those the browser marks active, as the tests show every engine marks it before the value's
     * change and blur, for a mouse and for touch in emulation. An error drawn above a control below
     * would move the control from under the pointer, and the click would be lost. It is read on the
     * whole document, since a button tied to the form from outside it, or one beside a stepper in no
     * form, is moved as well.
     */
    const pressedOutside = () => {
        const at = [...input.ownerDocument.querySelectorAll(':active')].at(-1);
        return at !== undefined && !field.contains(at);
    };
    // The wait for such a press to end, and what ends it, never left once the stepper is let go,
    // since the teardown ends it.
    let holding = 0;
    let unhold: (() => void) | null = null;
    /**
     * Waits for a press outside the stepper to end, checking again on a short timer, since a
     * release the form never hears, as one dragged off the page, ends it too, or for the press to
     * turn into a drag, since Firefox leaves a dragged link active after the drop.
     */
    const hold = (then: (dragged: boolean) => void) => {
        if (!unhold) {
            const page = input.ownerDocument;
            const onDrag = () => {
                then(true);
            };
            page.addEventListener('dragstart', onDrag, { once: true, signal });
            unhold = () => {
                window.clearTimeout(holding);
                page.removeEventListener('dragstart', onDrag);
                unhold = null;
            };
        }
        holding = window.setTimeout(() => {
            then(false);
        }, 50);
    };
    const onChange = () => {
        // Read as the change fires, so a refusal that quiets the stepper before the error is drawn
        // leaves its words unsaid, as its own words are the one message.
        const pressed = presses;
        unhold?.();
        const draw = (dragged = false) => {
            // Held until the press ends, so its click, and a submit it makes, land first.
            if (!dragged && pressedOutside()) {
                hold(draw);
                return;
            }
            unhold?.();
            // A refusal or a reset that settled the stepper meanwhile drew what it fails.
            if (pressed !== presses) return;
            const bad = wrong();
            report(bad);
            if (bad && range) {
                // Named first, as a refused form names a field, since focus has already moved on.
                const name = fieldName(input);
                const error = range.textContent.trim();
                const words = name === '' ? error : `${name}: ${error}`;
                // Left unsaid once the stepper is quieted, even through a page's `say`, which
                // keeps nothing to take words back from.
                tell(() => (pressed === presses && attached() ? words : null));
            }
        };
        draw();
    };
    // Once the reset is done, and never once the stepper is let go, since the teardown clears it,
    // as with focus leaving it.
    let resetting = 0;
    const onReset = (event: Event) => {
        window.clearTimeout(resetting);
        resetting = window.setTimeout(() => {
            // A reset the page calls off leaves the value, so its error stays, as the form's do.
            if (event.defaultPrevented) return;
            settle(true);
        });
    };
    down.addEventListener('click', press(false), { signal });
    up.addEventListener('click', press(true), { signal });
    input.addEventListener('input', onInput, { signal });
    input.addEventListener('change', onChange, { signal });
    // Letters typed into a blank value leave it blank, so no change fires as focus leaves, and the
    // letters are reported then. A blank that focus only passes through stays quiet, as does a
    // field no one can change or one showing the page's own error. A press inside the field, read
    // by its active button whether or not the button takes focus, as Safari's does not, is left to
    // the press, since an error drawn above would move the button from under the pointer. Tab to
    // the stepper's own button still reports, since no press follows it. Focus that stays on the
    // value, as a switch of window leaves it, reports nothing. The page's document tells that
    // switch, since it has focus wherever focus is in its frames, where a frame's own would lose it
    // as the visitor moves on to the page, which would read as a switch.
    input.addEventListener(
        'blur',
        () => {
            if (
                range?.hidden &&
                input.validity.badInput &&
                !locked() &&
                !pageError() &&
                !field.querySelector(':active') &&
                !isFocused(input) &&
                document.hasFocus()
            )
                onChange();
        },
        { signal }
    );
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
        attributeFilter: [
            'aria-describedby',
            'aria-invalid',
            'min',
            'max',
            'step',
            'required',
            'readonly',
            'disabled',
        ],
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
        unhold?.();
        quiet();
        if (formSteppers.get(input) === settle) formSteppers.delete(input);
        report(false);
        // A value still in the page keeps its mark until its form is let go, as every field does,
        // and one that has left it is let go of at once, since its form may outlive it.
        if (!input.isConnected)
            for (const home of homes)
                if (checkedForms.get(home)?.marks.delete(input)) unmark([input]);
        // A button with focus is about to hide, so focus goes first to a read-only value, which
        // opens no keyboard, or else to the stepper, which the markup draws as a group named by the
        // field's label. A stepper with no tabindex is given -1, so a script can focus it while the
        // tab order passes it by, and keeps it, since taking it away again would need a listener
        // that outlives the takedown. A stepper that refuses focus has that tabindex taken away at
        // once, and focus goes on to the app frame's body or the page's main content, as it does
        // from the toast, the dialog and the panels. Focus the page moves elsewhere as the value or
        // the stepper is tried stays.
        const at = [down, up].find(isFocused);
        if (at) {
            if (!handBack(input.readOnly && !input.disabled ? input : null) && isFocused(at)) {
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
