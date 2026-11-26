import { useRef } from 'react';
import { createRoot } from 'react-dom/client';

import { useFocusAfterDraw } from '../src/react.js';

/*
 * The page shadow.spec.ts draws for the React hooks inside a closed shadow root: a component that
 * asks for focus on its target and moves focus to its second button before the request lands, as
 * a visitor who moves on would, from the source rather than the package.
 */

const Ask = () => {
    const target = useRef<HTMLButtonElement>(null);
    const second = useRef<HTMLButtonElement>(null);
    const focusAfterDraw = useFocusAfterDraw();
    return (
        <>
            <button
                type="button"
                id="ask"
                onClick={() => {
                    if (target.current) focusAfterDraw(target.current);
                    second.current?.focus();
                }}
            >
                Ask
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

const root = (document.querySelector('#widget') as HTMLElement).attachShadow({ mode: 'closed' });
const holder = document.createElement('div');
root.append(holder);
createRoot(holder).render(<Ask />);
Object.assign(window, { closedRoot: root, ready: true });
