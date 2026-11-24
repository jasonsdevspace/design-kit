import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { StatusProvider, useStatus } from '../src/react.js';

/*
 * The page status.spec.tsx draws with React: a part that speaks in its first effect, a counter whose
 * words settle, a provider inside another, as a dialog's would be, and a button that takes the
 * outer provider away, for a call made after it has gone. The spec hears the outer line through
 * `hearing`.
 */

type Page = {
    functions: Set<unknown>;
    late?: () => void;
};
const page = window as unknown as Page;
page.functions = new Set();

const Early = () => {
    const say = useStatus();
    useEffect(() => {
        say('Loaded.');
    }, [say]);
    return null;
};

const Counter = () => {
    const say = useStatus();
    page.functions.add(say);
    page.late = () => {
        say('After.');
    };
    const [count, setCount] = useState(0);
    return (
        <button
            id="press"
            type="button"
            onClick={() => {
                setCount(count + 1);
                say(`${String(count + 1)} pressed.`, { settle: 400 });
            }}
        >
            Press
        </button>
    );
};

const Inner = () => {
    const say = useStatus();
    return (
        <button id="inner" type="button" onClick={() => say('Inside.')}>
            Inside
        </button>
    );
};

const App = () => {
    const [shown, setShown] = useState(true);
    return (
        <main>
            {shown ? (
                <div id="outer">
                    <StatusProvider>
                        <Early />
                        <Counter />
                        <div id="dialog">
                            <StatusProvider>
                                <Inner />
                            </StatusProvider>
                        </div>
                    </StatusProvider>
                </div>
            ) : null}
            <button id="leave" type="button" onClick={() => setShown(false)}>
                Leave
            </button>
        </main>
    );
};

const root = document.getElementById('root');
if (root) createRoot(root).render(<App />);
