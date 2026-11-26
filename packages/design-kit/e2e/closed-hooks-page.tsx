import { useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { useArrivalFocus, useFocusAfterDraw } from '../src/react.js';

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

const root = (document.querySelector('#widget') as HTMLElement).attachShadow({ mode: 'closed' });
const holder = document.createElement('div');
root.append(holder);
createRoot(holder).render(
    <>
        <Ask />
        <Round />
    </>
);
Object.assign(window, { closedRoot: root, ready: true });
