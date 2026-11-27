import { type ComponentPropsWithRef } from 'react';

import { Field, FieldError, FieldHint, type FieldParts, Labeled, useControl } from './fields.js';
import { spaced } from './react-parts.js';

/*
 * The checkbox field, one setting on or off with its label and hint and no group around it, drawn
 * from the fields' parts, apart from the other fields so a page that draws none sends none of it.
 */

/** The words a read-only checkbox field draws for each state. */
type CheckboxWords = {
    /** The words a read-only field shows while it is checked, "On" unless given. */
    readonly onWords?: string | undefined;
    /** The words a read-only field shows while it is not checked, "Off" unless given. */
    readonly offWords?: string | undefined;
};

/** A checkbox field a visitor can change: the box takes every prop of an input but its type. */
type CheckboxBox = Omit<
    ComponentPropsWithRef<'input'>,
    'style' | 'type' | 'id' | 'aria-invalid' | 'children' | 'readOnly'
> & {
    /** Draws the box's state in words, as a value a visitor reads but cannot change. */
    readonly readOnly?: false | undefined;
};

/**
 * A read-only checkbox field: the value it draws takes a textarea's props, its `ref` among them,
 * and the box's own `name`, `value`, `checked` and `defaultChecked` go to the hidden field it sends.
 * It is never refused, so it takes no `required`.
 */
type CheckboxValue = Omit<
    ComponentPropsWithRef<'textarea'>,
    | 'style'
    | 'id'
    | 'aria-invalid'
    | 'children'
    | 'readOnly'
    | 'rows'
    | 'cols'
    | 'value'
    | 'defaultValue'
    | 'required'
    | 'name'
> & {
    readonly readOnly: true;
    /** The name of the hidden field that carries the box's value while it is checked. */
    readonly name?: string | undefined;
    /** What the hidden field sends while the box is checked, "on" unless given, as a box sends. */
    readonly value?: string | undefined;
    readonly checked?: boolean | undefined;
    readonly defaultChecked?: boolean | undefined;
};

export type CheckboxFieldProps = FieldParts & CheckboxWords & (CheckboxBox | CheckboxValue);

/**
 * One setting a visitor turns on or off, a lone checkbox with its label and hint and no group
 * around it: the label wraps the box and names it, so the box and its words are one target, and
 * the hint and the error describe the box, so a screen reader reads both on it. The error sits
 * above the box and the hint under its words. The box takes every other prop given, its `ref`
 * among them, which holds the box drawn for a page that moves focus to it. A checkbox has no
 * read-only state, so a read-only field draws its state in words, "On" or "Off" unless given
 * others, as a value a visitor reads, whose textarea takes the page's other props and its `ref`,
 * and a hidden field carries the box's value while it is checked, so the form sends what the box
 * would. A read-only field is never refused, and says nothing of being required. A required box is
 * for a visitor's consent, since a setting has a default rather than a choice the visitor must
 * make.
 */
/** Leaves the keys given out of each member of a union, so the union stays one to narrow. */
type Without<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export const CheckboxField = (props: CheckboxFieldProps) => {
    const { native, field } = useControl(props);
    const given = native as Without<
        CheckboxWords & (CheckboxBox | CheckboxValue),
        'aria-describedby'
    >;
    const onWords = given.onWords ?? 'On';
    const offWords = given.offWords ?? 'Off';
    if (given.readOnly === true) {
        const {
            readOnly: _readOnly,
            onWords: _on,
            offWords: _off,
            name,
            value = 'on',
            checked,
            defaultChecked,
            className,
            ...shared
        } = given;
        const on = checked ?? defaultChecked ?? false;
        // A value no one can change is never refused, so it says nothing of being required.
        const { 'aria-required': _required, ...wired } = field.wired;
        return (
            <Field parts={props} field={field}>
                <textarea
                    {...shared}
                    className={spaced('dk-textarea dk-value', className)}
                    rows={1}
                    readOnly
                    value={on ? onWords : offWords}
                    {...wired}
                />
                {name === undefined || !on ? null : (
                    <input
                        type="hidden"
                        name={name}
                        value={value}
                        disabled={shared.disabled}
                        form={shared.form}
                    />
                )}
            </Field>
        );
    }
    const { readOnly: _readOnly, onWords: _on, offWords: _off, ...box } = given;
    return (
        <div className="dk-field">
            <FieldError parts={props} field={field} />
            <label className="dk-choice" htmlFor={field.id} id={`${field.id}-label`}>
                <input {...box} type="checkbox" {...field.wired} />
                <span>
                    <Labeled parts={props} />
                </span>
            </label>
            <FieldHint parts={props} field={field} />
        </div>
    );
};
