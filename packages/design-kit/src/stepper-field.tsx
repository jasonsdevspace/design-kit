import { type ComponentPropsWithRef, type ReactNode } from 'react';

import { Field, type FieldParts, useControl } from './fields.js';
import { spaced } from './react-parts.js';

/** What a stepper adds to a field's props. */
type StepperOwn = {
    /** The least value. */
    readonly min: number;
    /** The greatest value. */
    readonly max: number;
    /** What a press adds or takes away, 1 unless given. */
    readonly step?: number | undefined;
    /**
     * What a value the field refuses, outside the limits, none or between steps, is told, shown
     * once the value is changed.
     */
    readonly rangeError?: ReactNode;
    /** Buttons and value at the larger target, for a count pressed at arm's length. */
    readonly tall?: boolean | undefined;
    /** The label to the left of the stepper, on one line with it. */
    readonly inline?: boolean | undefined;
};

/**
 * What names the buttons, read after Lower and Raise. A label in plain words names them unless a
 * subject is given, and a label that is more than words needs a subject, so no two steppers'
 * buttons are named alike.
 */
type StepperSubject =
    | {
          readonly label: string;
          /** The words after Lower and Raise in the buttons' names, such as "Ana's bid". */
          readonly subject?: string | undefined;
      }
    | { readonly label: ReactNode; readonly subject: string };

export type StepperFieldProps = Omit<FieldParts, 'label'> &
    StepperSubject &
    StepperOwn &
    Omit<
        ComponentPropsWithRef<'input'>,
        'style' | 'id' | 'aria-invalid' | 'children' | 'type' | 'min' | 'max' | 'step'
    >;

/**
 * A stepper for a small whole number: a number field with a button either side, in the kit's field
 * with its label, hint and error, the input taking every other prop given, its `ref` among them.
 * The buttons are hidden until `attachStepper` from `@jasonsdevspace/design-kit/controls` shows
 * them, so without script the field is a number field alone. Each button is named for what it does
 * and to which field, a status line out of sight says the value a press sets, and the error for a
 * value the field refuses waits, hidden, for the attach function to show it. A field whose least
 * value is below nothing asks a phone for its full keyboard, since the numeric one has no minus.
 * The box around the value and the buttons is a group named by the label, which holds focus as the
 * attach function hands it there.
 */
export const StepperField = (props: StepperFieldProps) => {
    const { min, max, step = 1, subject, rangeError, tall, inline, ...forField } = props;
    const { native, field } = useControl(forField);
    const { className, ...rest } = native;
    const named = subject ?? (typeof props.label === 'string' ? props.label : '');
    return (
        <Field
            parts={props}
            field={field}
            className={inline === true ? 'dk-stepper-inline' : undefined}
        >
            <p className="dk-field-error dk-stepper-range" id={`${field.id}-range`} hidden>
                <span className="dk-visually-hidden">Error: </span>
                {rangeError ??
                    (step === 1
                        ? `Enter a whole number from ${String(min)} to ${String(max)}.`
                        : `Enter a number from ${String(min)} to ${String(max)} in steps of ${String(step)}.`)}
            </p>
            {/*
             * A group named by the label, so a stepper taken down with a button focused can hold
             * focus with a name. It takes no tabindex here, which the attach gives it only then.
             */}
            <div
                className={spaced('dk-stepper', tall === true && 'dk-stepper-tall')}
                role="group"
                aria-labelledby={`${field.id}-label`}
            >
                <button
                    type="button"
                    className="dk-button dk-stepper-down"
                    aria-controls={field.id}
                    hidden
                >
                    <span aria-hidden="true">−</span>
                    <span className="dk-visually-hidden">Lower {named}</span>
                </button>
                <input
                    className={spaced('dk-input', 'dk-stepper-value', className)}
                    type="number"
                    inputMode={min < 0 ? undefined : 'numeric'}
                    min={min}
                    max={max}
                    step={step}
                    {...rest}
                    {...field.wired}
                />
                <button
                    type="button"
                    className="dk-button dk-stepper-up"
                    aria-controls={field.id}
                    hidden
                >
                    <span aria-hidden="true">+</span>
                    <span className="dk-visually-hidden">Raise {named}</span>
                </button>
                {/* Its range in words, which the attach writes and adds to the field's description. */}
                <span className="dk-visually-hidden dk-stepper-limits" id={`${field.id}-limits`} />
                <span className="dk-visually-hidden dk-stepper-status" role="status" />
            </div>
        </Field>
    );
};
