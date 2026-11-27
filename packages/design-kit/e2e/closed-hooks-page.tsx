import { useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { useArrivalFocus, useFocusAfterDraw, useFormRefusal } from '../src/react.js';

/*
 * The page shadow.spec.ts draws for the React hooks inside a closed shadow root, from the source
 * rather than the package: a component that asks for focus on its target, by one button with
 * nothing more and by another that then moves focus to a second button before the request lands,
 * as a visitor who moves on would, and a round whose heading takes focus as its key changes, by
 * one button with nothing more and by another after which focus moves on once the round is drawn.
 */

const Ask = () => {
    const target = useRef<HTMLButtonElement>(null);
    const second = useRef<HTMLButtonElement>(null);
    const focusAfterDraw = useFocusAfterDraw();
    return (
        <>
            <button
                type="button"
                id="ask-only"
                onClick={() => {
                    if (target.current) focusAfterDraw(target.current);
                }}
            >
                Ask
            </button>
            <button
                type="button"
                id="ask"
                onClick={() => {
                    if (target.current) focusAfterDraw(target.current);
                    second.current?.focus();
                }}
            >
                Ask and move on
            </button>
            <button type="button" id="second" ref={second}>
                Second
            </button>
            <button type="button" id="target" ref={target}>
                Target
            </button>
        </>
    );
};

const Round = () => {
    const [round, setRound] = useState(1);
    const [moving, setMoving] = useState(false);
    const heading = useArrivalFocus<HTMLHeadingElement>(round);
    const other = useRef<HTMLButtonElement>(null);
    // The visitor moves on once the new round is drawn, after the hook read where focus was and
    // before its heading takes focus.
    useLayoutEffect(() => {
        if (moving) other.current?.focus();
    }, [moving, round]);
    return (
        <>
            <button
                type="button"
                id="next-only"
                onClick={() => {
                    setRound(round + 1);
                    setMoving(false);
                }}
            >
                Next round
            </button>
            <button
                type="button"
                id="next"
                onClick={() => {
                    setRound(round + 1);
                    setMoving(true);
                }}
            >
                Next round and move on
            </button>
            <button type="button" id="other" ref={other}>
                Other
            </button>
            <h2 id="heading" ref={heading}>
                Round {round}
            </h2>
        </>
    );
};

/**
 * A form whose fields' own failed submit focuses the first in error, and whose page refusal, asked
 * by a button that then moves focus to another field once the errors are drawn, leaves it there.
 */
const Seat = () => {
    const [error, setError] = useState(false);
    const [moving, setMoving] = useState(false);
    const other = useRef<HTMLInputElement>(null);
    const [form, refuse] = useFormRefusal<HTMLFormElement>({
        say: () => undefined,
        invalid: () => {
            setError(true);
        },
    });
    useLayoutEffect(() => {
        if (moving) other.current?.focus();
    }, [moving, error]);
    return (
        <form ref={form} noValidate>
            <input id="name" aria-label="Name" defaultValue="Ann" />
            <input id="seat" aria-label="Seat" required aria-invalid={error ? true : undefined} />
            <input id="other-field" aria-label="Other" ref={other} />
            <button type="submit">Save</button>
            <button
                type="button"
                id="refuse-move"
                onClick={() => {
                    setError(true);
                    refuse();
                    setMoving(true);
                }}
            >
                Refuse and move on
            </button>
        </form>
    );
};

/** Rows that each remove themselves and ask for focus on the next. */
const Rows = () => {
    const [rows, setRows] = useState(['one', 'two', 'three']);
    const buttons = useRef(new Map<string, HTMLButtonElement>());
    const focusAfterDraw = useFocusAfterDraw();
    return (
        <ul>
            {rows.map((row, index) => (
                <li key={row}>
                    <button
                        type="button"
                        id={`remove-${row}`}
                        ref={(button) => {
                            if (button) buttons.current.set(row, button);
                            else buttons.current.delete(row);
                        }}
                        onClick={() => {
                            const next = rows[index + 1];
                            if (next) focusAfterDraw(buttons.current.get(next) ?? null);
                            setRows(rows.filter((each) => each !== row));
                        }}
                    >
                        Remove {row}
                    </button>
                </li>
            ))}
        </ul>
    );
};

const root = (document.querySelector('#widget') as HTMLElement).attachShadow({ mode: 'closed' });
const holder = document.createElement('div');
root.append(holder);
createRoot(holder).render(
    <>
        <Ask />
        <Round />
        <Seat />
        <Rows />
    </>
);
Object.assign(window, { closedRoot: root, ready: true });
