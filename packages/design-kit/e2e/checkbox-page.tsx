import { type FormEvent, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { CheckboxField, StatusProvider, useFormRefusal } from '../src/react.js';

/*
 * The page checkbox.spec.tsx draws with React: a form of two settings in a section of their own,
 * each a checkbox field, the second required, whose failures the page draws from its own state,
 * keyed by each field's id, and hands to the window as each field's id and its words, and a
 * read-only setting whose ref the page holds, whose element it hands to the window by its tag.
 */

type Handed = Window & { handed?: readonly string[]; submits?: number; held?: string | undefined };

const Rules = () => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const shown = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        (window as Handed).held = shown.current?.localName;
    }, []);
    const [form] = useFormRefusal<HTMLFormElement>({
        invalid: (failures) => {
            (window as Handed).handed = failures.map(({ field, words }) => `${field.id}: ${words}`);
            setErrors(Object.fromEntries(failures.map(({ field, words }) => [field.id, words])));
        },
    });
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrors({});
        (window as Handed).submits = ((window as Handed).submits ?? 0) + 1;
    };
    return (
        <form ref={form} onSubmit={submit}>
            <fieldset>
                <legend>House rules</legend>
                <CheckboxField
                    id="double"
                    name="double"
                    label="Score the last round double"
                    hint="Every bid in round 10 counts twice"
                    defaultChecked
                />
                <CheckboxField
                    id="agree"
                    name="agree"
                    label="I agree to the house rules"
                    required
                    mark="required"
                    error={errors['agree']}
                />
                <CheckboxField
                    ref={shown}
                    id="host"
                    name="host"
                    label="Only the host keeps score"
                    readOnly
                    defaultChecked
                    title="Set by the host"
                />
            </fieldset>
            <button type="submit">Start</button>
        </form>
    );
};

createRoot(document.querySelector('#app') as HTMLElement).render(
    <StatusProvider>
        <Rules />
    </StatusProvider>
);
Object.assign(window, { ready: true });
