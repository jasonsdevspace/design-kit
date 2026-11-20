import { type FormEvent, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Button, InputField, StatusProvider, useFormRefusal } from '../src/react.js';

/*
 * The page checked.spec.tsx draws with React: a form whose required name the browser's constraints
 * check, the failures drawn from the page's own state with words of the page's own, and a count of
 * the submits the page's handler took.
 */

const Join = () => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [count, setCount] = useState(0);
    const [form] = useFormRefusal<HTMLFormElement>({
        errorWords: { valueMissing: 'Enter your name.' },
        invalid: (failures) => {
            setErrors(
                Object.fromEntries(failures.map(({ control, words }) => [control.id, words]))
            );
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
