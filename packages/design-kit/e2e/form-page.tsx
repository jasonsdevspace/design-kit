import { type FormEvent, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { attachForm } from '../src/controls.js';
import { Button, InputField, StatusProvider, useFormRefusal } from '../src/react.js';

/*
 * The page form.spec.tsx draws with React: a form that refuses an empty name, drawing its error and
 * then refusing through the screen's status line, and one that refuses it after an await, as a
 * page that asks its store first does, refused twice with the first called off, and refused as the
 * visitor moves focus before the error is drawn, and a field whose error the page draws while the
 * kit refuses the form, which the page then draws with new words.
 */

type Page = {
    refuseTwice?: () => void;
    refuseAndMove?: () => void;
    seatError?: (words: string) => void;
};
const page = window as unknown as Page;

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
    useEffect(() => {
        page.refuseTwice = () => {
            setError('Enter a name.');
            const first = refuse();
            refuse();
            first();
        };
        page.refuseAndMove = () => {
            setError('Enter a name.');
            refuse();
            document.getElementById('elsewhere')?.focus();
        };
    }, [refuse]);
    return (
        <>
            <form ref={form} onSubmit={submit} noValidate>
                <InputField id="player" name="name" label="Player" error={error} />
                <Button type="submit">Save</Button>
            </form>
            <button id="elsewhere" type="button">
                Elsewhere
            </button>
        </>
    );
};

// A form the kit refuses itself, whose field holds an error the page drew, and words the page can
// change at any time, as a page whose state changes before the visitor fixes the value does.
const BookSeat = () => {
    const [error, setError] = useState('Choose a seat.');
    const form = useRef<HTMLFormElement>(null);
    useEffect(() => {
        page.seatError = setError;
        const controller = new AbortController();
        if (form.current) attachForm(form.current, { signal: controller.signal });
        return () => {
            controller.abort();
        };
    }, []);
    return (
        <form id="book" ref={form} onSubmit={(event) => event.preventDefault()}>
            <InputField id="seat" name="seat" label="Seat" required error={error} />
            <Button type="submit">Book</Button>
        </form>
    );
};

const root = document.getElementById('root');
if (root)
    createRoot(root).render(
        <StatusProvider>
            <AddPlayer />
            <SavePlayer />
            <BookSeat />
        </StatusProvider>
    );
