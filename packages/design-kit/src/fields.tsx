import {
    Children,
    type ComponentPropsWithRef,
    Fragment,
    isValidElement,
    type ReactElement,
    type ReactNode,
    useId,
} from 'react';

import { ChoiceLabel, filled, spaced } from './react-parts.js';

/*
 * The fields and their shared parts: the label, the hint, the error and the action beside a
 * control, and the input, select, textarea, value and choice fields drawn from them. The checkbox
 * field and the stepper draw their fields from these parts, so a page that draws either sends this
 * module too.
 */

/** What a field draws around its control. */
export type FieldParts = {
    /**
     * The label, which names the control and focuses it when pressed, or names a set as its
     * legend.
     */
    readonly label: ReactNode;
    /** What helps a visitor fill the field, read as its description. */
    readonly hint?: ReactNode;
    /** What is wrong with the value, drawn only when given, which marks the control invalid. */
    readonly error?: ReactNode;
    /** The control's id, made with useId unless a page gives one, as it does for a link to it. */
    readonly id?: string | undefined;
    /**
     * Marks the field required or optional in words in its label, apart from the native `required`,
     * which a page keeps since the kit's check on submit reads it and it tells a screen reader a
     * field is required where a form marks its optional fields, while the kit's form refusal turns
     * the browser's own check off. Required is said by the control's `aria-required`, so its words
     * are hidden from a screen reader, which would say it twice, and optional is said in the
     * label's name.
     */
    readonly mark?: 'required' | 'optional' | undefined;
    /** The mark's words in place of the kit's, "(required)" or "(optional)", as in another language. */
    readonly markWords?: string | undefined;
};

/**
 * A label's words, and its mark where it has one, in the muted text at the normal weight, so it
 * does not compete with the label. The space sits outside the mark, so the name reads as words. A
 * required mark is hidden from a screen reader where the control says it is required.
 */
export const Labeled = ({
    parts,
    said = true,
}: {
    readonly parts: FieldParts;
    readonly said?: boolean;
}) => (
    <>
        {parts.label}
        {parts.mark === undefined ? null : (
            <>
                {' '}
                <span
                    className="dk-field-mark"
                    aria-hidden={parts.mark === 'required' && said ? true : undefined}
                >
                    {parts.markWords ?? `(${parts.mark})`}
                </span>
            </>
        )}
    </>
);

/**
 * The attributes that tie a control to its label, hint and error. Only what is drawn is listed,
 * the hint before the error as they are read, then any description the page gives of its own.
 */
const useField = (
    { id, hint, error, mark }: FieldParts,
    own: string | undefined
): {
    readonly id: string;
    readonly hint: boolean;
    readonly error: boolean;
    readonly wired: {
        readonly id: string;
        readonly 'aria-describedby': string | undefined;
        readonly 'aria-invalid': true | undefined;
        readonly 'aria-required'?: true;
    };
} => {
    const made = useId();
    // An empty id would tie nothing, so it is made as one left out is.
    const control = id === undefined || id === '' ? made : id;
    const hinted = filled(hint);
    const wrong = filled(error);
    const describedBy = spaced(hinted && `${control}-hint`, wrong && `${control}-error`, own);
    return {
        id: control,
        hint: hinted,
        error: wrong,
        wired: {
            id: control,
            'aria-describedby': describedBy === '' ? undefined : describedBy,
            'aria-invalid': wrong ? true : undefined,
            // Only where marked, so an aria-required the page gives a field of its own is kept.
            ...(mark === 'required' ? { 'aria-required': true as const } : {}),
        },
    };
};

/**
 * An error given as words, with a break allowed after each "@", as the controls draw their own, so
 * an address too long for its line breaks there, rather than at whichever letter or stop the line
 * runs out on. An error given as markup is the page's own and is left as it is.
 */
const breakable = (error: ReactNode): ReactNode =>
    typeof error === 'string'
        ? error.split('@').map((part, at) =>
              at === 0 ? (
                  part
              ) : (
                  <Fragment key={at}>
                      @<wbr />
                      {part}
                  </Fragment>
              )
          )
        : error;

/**
 * A field's hint and error, each drawn only when it holds something. The error sits above the
 * control, so a phone's keyboard never covers it, and starts with a word a screen reader reads, so
 * the error is told from the hint by more than its color. It is not live, since a form that fails
 * in several fields at once would speak over itself, so the page says when an error appears.
 */
const FieldText = ({
    parts,
    field,
}: {
    readonly parts: FieldParts;
    readonly field: ReturnType<typeof useField>;
}) => (
    <>
        <FieldHint parts={parts} field={field} />
        <FieldError parts={parts} field={field} />
    </>
);

/** A field's hint, drawn only when it holds something. */
export const FieldHint = ({
    parts,
    field,
}: {
    readonly parts: FieldParts;
    readonly field: ReturnType<typeof useField>;
}) =>
    field.hint ? (
        <p className="dk-field-hint" id={`${field.id}-hint`}>
            {parts.hint}
        </p>
    ) : null;

/** A field's error, drawn only when it holds something. */
export const FieldError = ({
    parts,
    field,
}: {
    readonly parts: FieldParts;
    readonly field: ReturnType<typeof useField>;
}) =>
    field.error ? (
        <p className="dk-field-error" id={`${field.id}-error`}>
            <span className="dk-visually-hidden">Error: </span>
            {breakable(parts.error)}
        </p>
    ) : null;

/**
 * A control on its own, or with what a field draws beside it, such as the button that runs a
 * search, in a row of their own that the sheets lay out. The action comes after the control, in
 * the tab order as on the screen, and is named by its own words, not the field's label.
 */
const WithAction = ({
    action,
    children,
}: {
    readonly action: ReactNode;
    readonly children: ReactNode;
}) =>
    filled(action) ? (
        <div className="dk-field-action">
            {children}
            {action}
        </div>
    ) : (
        children
    );

/** A field's label, hint and error around its control. */
export const Field = ({
    parts,
    field,
    className,
    children,
}: {
    readonly parts: FieldParts;
    readonly field: ReturnType<typeof useField>;
    readonly className?: string | undefined;
    readonly children: ReactNode;
}) => (
    <div className={spaced('dk-field', className)}>
        <label className="dk-field-label" htmlFor={field.id} id={`${field.id}-label`}>
            <Labeled parts={parts} />
        </label>
        <FieldText parts={parts} field={field} />
        {children}
    </div>
);

/**
 * What a field hands its control: every prop but the field's own parts, with the page's own
 * description taken out for the wiring, and the wiring itself.
 */
export const useControl = <
    P extends FieldParts & { readonly 'aria-describedby'?: string | undefined },
>(
    props: P
) => {
    const {
        label: _label,
        hint: _hint,
        error: _error,
        id: _id,
        mark: _mark,
        markWords: _words,
        ...rest
    } = props;
    const { 'aria-describedby': own, ...native } = rest;
    return { native, field: useField(props, own) };
};

/** What a field may draw beside its control. */
type FieldAction = {
    /**
     * What sits beside the control, such as a button, drawn after it in the field's row and moved
     * under it where the row has no room for both.
     */
    readonly action?: ReactNode;
};

export type InputFieldProps = FieldParts &
    FieldAction &
    Omit<ComponentPropsWithRef<'input'>, 'style' | 'id' | 'aria-invalid' | 'children'>;

/**
 * A text input with its label, hint and error, the input taking every other prop given, its `ref`
 * among them, which holds the input drawn for a page that moves focus to it.
 */
export const InputField = (props: InputFieldProps) => {
    const { native, field } = useControl(props);
    const { className, action, ...rest } = native;
    return (
        <Field parts={props} field={field}>
            <WithAction action={action}>
                <input className={spaced('dk-input', className)} {...rest} {...field.wired} />
            </WithAction>
        </Field>
    );
};

export type SelectFieldProps = FieldParts &
    FieldAction &
    Omit<ComponentPropsWithRef<'select'>, 'style' | 'id' | 'aria-invalid'> & {
        /**
         * Read only, a value to read but not change: drawn as `ValueField` draws a value, with the
         * chosen option's words, and sent by a hidden field, since a select has no read-only state.
         * With no select drawn, its `disabled`, `form`, `title` and `autoFocus` go to the value, and
         * its other props and its `ref` are left unused. Enter in it does not submit the form. It
         * is read only for the page, rather than for a moment, since turning it on or off draws a
         * new control in place of the last.
         */
        readonly readOnly?: boolean | undefined;
    };

/** The options a select holds, inside groups and fragments as well as at its top. */
const optionsIn = (
    children: ReactNode
): ReactElement<{ value?: unknown; children?: ReactNode }>[] =>
    Children.toArray(children).flatMap((child) => {
        if (!isValidElement<{ value?: unknown; children?: ReactNode }>(child)) return [];
        if (child.type === 'option') return [child];
        return child.type === 'optgroup' || child.type === Fragment
            ? optionsIn(child.props.children)
            : [];
    });

/** The text a node draws, for an option's words. */
const textOf = (node: ReactNode): string =>
    Children.toArray(node)
        .map((part) =>
            typeof part === 'string' || typeof part === 'number'
                ? String(part)
                : isValidElement<{ children?: ReactNode }>(part)
                  ? textOf(part.props.children)
                  : ''
        )
        .join('');

/**
 * The words and the values of the options a select has chosen, every one a multiple select has, or
 * its first where none is.
 */
const chosenOf = (
    children: ReactNode,
    value: unknown
): { readonly words: string; readonly values: readonly string[] } => {
    const options = optionsIn(children);
    const valueOf = (option: (typeof options)[number]) => {
        const own = option.props.value;
        return typeof own === 'string' || typeof own === 'number'
            ? String(own)
            : textOf(option.props.children);
    };
    const wanted = (Array.isArray(value) ? value : [value])
        .filter((one) => typeof one === 'string' || typeof one === 'number')
        .map(String);
    const picked = options.filter((option) => wanted.includes(valueOf(option)));
    const chosen = picked.length > 0 ? picked : options.slice(0, 1);
    return {
        words: chosen.map((option) => textOf(option.props.children)).join(', '),
        values: chosen.map(valueOf),
    };
};

/**
 * A native select with its label, hint and error, its children the options, and the select taking
 * every other prop given, its `ref` among them, which holds the select drawn for a page that moves
 * focus to it.
 */
export const SelectField = (props: SelectFieldProps) => {
    const { native, field } = useControl(props);
    const { className, children, action, readOnly, name, value, defaultValue, ...rest } = native;
    if (readOnly === true) {
        // A select has no read-only state, so its chosen option's words are drawn as a value, which
        // wraps where they are long, and a hidden field carries each value, so the form still sends
        // them, or none where disabled.
        const chosen = chosenOf(children, value ?? defaultValue);
        const { disabled, form, title, autoFocus } = rest;
        return (
            <Field parts={props} field={field}>
                <WithAction action={action}>
                    <textarea
                        className={spaced('dk-textarea dk-value', className)}
                        rows={1}
                        readOnly
                        value={chosen.words}
                        disabled={disabled}
                        form={form}
                        title={title}
                        autoFocus={autoFocus}
                        {...field.wired}
                    />
                </WithAction>
                {name === undefined
                    ? null
                    : chosen.values.map((one) => (
                          <input
                              key={one}
                              type="hidden"
                              name={name}
                              value={one}
                              disabled={disabled}
                              form={form}
                          />
                      ))}
            </Field>
        );
    }
    return (
        <Field parts={props} field={field}>
            <WithAction action={action}>
                <select
                    className={spaced('dk-select', className)}
                    name={name}
                    value={value}
                    defaultValue={defaultValue}
                    {...rest}
                    {...field.wired}
                >
                    {children}
                </select>
            </WithAction>
        </Field>
    );
};

export type TextareaFieldProps = FieldParts &
    Omit<ComponentPropsWithRef<'textarea'>, 'style' | 'id' | 'aria-invalid' | 'children'>;

/**
 * A textarea with its label, hint and error, three rows tall unless given its rows, the textarea
 * taking every other prop given, its `ref` among them, which holds the textarea drawn for a page
 * that moves focus to it. Its text is `defaultValue` or `value`, never children, as React has it.
 */
export const TextareaField = (props: TextareaFieldProps) => {
    const { native, field } = useControl(props);
    const { className, rows = 3, ...rest } = native;
    return (
        <Field parts={props} field={field}>
            <textarea
                className={spaced('dk-textarea', className)}
                rows={rows}
                {...rest}
                {...field.wired}
            />
        </Field>
    );
};

export type ValueFieldProps = FieldParts &
    FieldAction &
    Omit<
        ComponentPropsWithRef<'textarea'>,
        'style' | 'id' | 'aria-invalid' | 'children' | 'rows' | 'cols' | 'readOnly'
    >;

/**
 * A value of words a visitor reads but cannot change, with its label, hint and error: a read-only
 * textarea the kit sizes to its value, so words that run past its width wrap and show whole, where
 * a read-only input of one line cuts them off. It is read only for the page, and Enter in it does
 * not submit the form. Where a browser cannot size it, it is one field tall and a long value
 * scrolls inside it. The textarea takes every other prop given, its `ref` among them, which holds the
 * textarea drawn for a page that moves focus to it, and its text is `defaultValue` or `value`.
 */
export const ValueField = (props: ValueFieldProps) => {
    const { native, field } = useControl(props);
    const { className, action, ...rest } = native;
    return (
        <Field parts={props} field={field}>
            <WithAction action={action}>
                <textarea
                    className={spaced('dk-textarea dk-value', className)}
                    {...rest}
                    rows={1}
                    readOnly
                    {...field.wired}
                />
            </WithAction>
        </Field>
    );
};

/** A choice in a choice field, beside its control's own props, such as `checked` or `disabled`. */
export type Choice = Omit<
    ComponentPropsWithRef<'input'>,
    'style' | 'type' | 'name' | 'aria-invalid' | 'className' | 'children' | 'value' | 'key'
> & {
    /** What the control submits, and what tells the choices apart. */
    readonly value: string;
    /** The word beside the control, which names it. */
    readonly label: ReactNode;
    /** A gloss after the word, in the muted text, read as part of the choice's name. */
    readonly hint?: ReactNode;
};

export type ChoiceFieldProps = FieldParts &
    Omit<
        ComponentPropsWithRef<'fieldset'>,
        'style' | 'id' | 'role' | 'aria-invalid' | 'children'
    > & {
        /** The controls' name, shared by every choice in the set. */
        readonly name: string;
        /** Radios, where one choice is on, or checkboxes, where any number are. */
        readonly type?: 'radio' | 'checkbox' | undefined;
        readonly choices: readonly Choice[];
        /** The choices in a row that wraps, rather than one under the other. */
        readonly row?: boolean | undefined;
    };

/**
 * A set of radios or checkboxes with its label, hint and error: a fieldset whose legend is the
 * label, described by the hint and the error as a control is. A set of radios is a radio group,
 * which is marked invalid as a whole while an error is drawn, since the keyboard enters it at the
 * chosen radio, wherever that is. Checkboxes are each a stop of their own, so each is marked.
 * Every control of the set is described by the error too, after any description of its own, since
 * a screen reader that lands on a control may read nothing of its group. The fieldset takes every
 * other prop given, its `ref` among them, and no role, since the set's role follows its type.
 */
export const ChoiceField = (props: ChoiceFieldProps) => {
    const { native, field } = useControl(props);
    const { name, type = 'radio', choices, row = false, className, ...rest } = native;
    const errorId = field.error ? `${field.id}-error` : undefined;
    return (
        <fieldset
            {...rest}
            className={spaced('dk-field', 'dk-choice-field', className)}
            id={field.id}
            role={type === 'radio' ? 'radiogroup' : undefined}
            aria-describedby={field.wired['aria-describedby']}
            aria-invalid={type === 'radio' && field.error ? true : undefined}
            // A radio group is marked required too, which a set of checkboxes cannot be, and only
            // where marked, so the page's own is kept. Not every screen reader says a group is
            // required, so the legend keeps its words in the name for both.
            {...(type === 'radio' && props.mark === 'required'
                ? { 'aria-required': true as const }
                : {})}
        >
            <legend className="dk-field-label">
                <Labeled parts={props} said={false} />
            </legend>
            <FieldText parts={props} field={field} />
            <div className={spaced('dk-choices', row && 'dk-choices-row')}>
                {choices.map(
                    ({ value, label: word, hint: gloss, 'aria-describedby': own, ...input }) => (
                        <ChoiceLabel
                            key={value}
                            className="dk-choice"
                            word={word}
                            gloss={gloss}
                            type={type}
                            name={name}
                            value={value}
                            aria-invalid={type === 'checkbox' && field.error ? true : undefined}
                            aria-describedby={spaced(errorId, own) || undefined}
                            {...input}
                        />
                    )
                )}
            </div>
        </fieldset>
    );
};
