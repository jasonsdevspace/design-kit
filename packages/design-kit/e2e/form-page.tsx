import { type FormEvent, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Button, InputField, StatusProvider, useFormRefusal } from '../src/react.js';

/*
 * The page form.spec.tsx draws with React: a form that refuses an empty name, drawing its error and
 * then refusing through the screen's status line, and one that refuses it after an await, as a
 * page that asks its store first does.
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

const SavePlayer = () => {
    const [error, setError] = useState('');
    const [form, refuse] = useFormRefusal<HTMLFormElement>({
        invalid: (failures) => {
            setError(failures[0]?.words ?? '');
        },
    });
    const save = async (name: FormDataEntryValue | null) => {
        // Answered in a task of its own, as a store's answer is, so React draws what it sets later.
        await new Promise((resolve) => {
            setTimeout(resolve);
        });
        if (typeof name === 'string' && name.trim() !== '') return;
        setError('Enter a name.');
        refuse();
    };
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void save(new FormData(event.currentTarget).get('name'));
    };
    return (
        <form ref={form} onSubmit={submit} noValidate>
            <InputField id="player" name="name" label="Player" error={error} />
            <Button type="submit">Save</Button>
        </form>
    );
};

const root = document.getElementById('root');
if (root)
    createRoot(root).render(
        <StatusProvider>
            <AddPlayer />
            <SavePlayer />
        </StatusProvider>
    );
