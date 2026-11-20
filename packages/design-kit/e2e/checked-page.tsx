import { type FormEvent, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Button, ChoiceField, InputField, StatusProvider, useFormRefusal } from '../src/react.js';

/*
 * The page checked.spec.tsx draws with React: a form whose required name the browser's constraints
 * check, with a set of choices, the failures drawn from the page's own state, keyed by each field's
 * id, with words of the page's own for an empty name, and a count of
 * the submits the page's handler took.
 */

const Join = () => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [count, setCount] = useState(0);
    const [form] = useFormRefusal<HTMLFormElement>({
        errorWords: {
            valueMissing: (control) => (control.id === 'name' ? 'Enter your name.' : ''),
        },
        invalid: (failures) => {
            setErrors(Object.fromEntries(failures.map(({ field, words }) => [field.id, words])));
        },
    });
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrors({});
        setCount(count + 1);
    };
    return (
        <form ref={form} onSubmit={submit}>
            <InputField id="name" name="name" label="Name" required error={errors['name']} />
            <ChoiceField
                id="size"
                label="Size"
                name="size"
                choices={[
                    { value: 's', label: 'Small', required: true },
                    { value: 'l', label: 'Large' },
                ]}
                error={errors['size']}
            />
            <Button type="submit">Join</Button>
            <p id="count">{count}</p>
        </form>
    );
};

const root = document.getElementById('root');
if (root)
    createRoot(root).render(
        <StatusProvider>
            <Join />
        </StatusProvider>
    );
