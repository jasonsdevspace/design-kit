import { type FormEvent, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Button, InputField, StatusProvider, useFormRefusal } from '../src/react.js';

/*
 * The page form.spec.tsx draws with React: a form that refuses an empty name, drawing its error and
 * then refusing through the screen's status line.
 */

const AddPlayer = () => {
    const [error, setError] = useState('');
    const [form, refuse] = useFormRefusal<HTMLFormElement>({
        invalid: (failures) => {
            setError(failures[0]?.words ?? '');
        },
    });
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const name = new FormData(event.currentTarget).get('name');
        if (typeof name === 'string' && name.trim() !== '') return;
        setError('Enter a name.');
        refuse();
    };
    return (
        <form ref={form} onSubmit={submit} noValidate>
            <InputField id="name" name="name" label="Name" error={error} />
            <Button type="submit">Add</Button>
        </form>
    );
};

const root = document.getElementById('root');
if (root)
    createRoot(root).render(
        <StatusProvider>
            <AddPlayer />
        </StatusProvider>
    );
