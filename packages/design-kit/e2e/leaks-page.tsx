import { StrictMode, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

import {
    Button,
    InputField,
    Progress,
    StatusProvider,
    useArrivalFocus,
    useBusy,
    useFocusAfterDraw,
    useFormRefusal,
    useProgress,
    useRoving,
    useStatus,
} from '../src/react.js';

/*
 * The page leaks.spec.tsx draws with React, which starts with nothing of the kit's drawn, so the
 * counts are taken once React's root is in the page. `show` draws a status provider and a part
 * that uses every hook, `use` does what a visitor and the page do with each, and `leave` takes it
 * all away. Each change is drawn at once, so a count taken after it finds it drawn. A page that
 * sets `strict` before this script runs draws under `StrictMode`, which React's development build
 * runs each ref and effect twice for.
 */

export type Leaks = {
    show: () => void;
    use: () => void;
    leave: () => void;
    strict?: boolean;
};
const page = window as unknown as Leaks;

const Pieces = () => {
    const speak = useStatus();
    const focusNext = useFocusAfterDraw();
    const [round, setRound] = useState(0);
    const heading = useArrivalFocus<HTMLHeadingElement>(round);
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const row = useRoving<HTMLDivElement>();
    const save = useBusy<HTMLButtonElement>();
    const bar = useProgress({ done: 'Imported 40 products.' });
    const [form] = useFormRefusal<HTMLFormElement>({
        invalid: (failures) => {
            setErrors(Object.fromEntries(failures.map(({ field, words }) => [field.id, words])));
        },
    });
    page.use = () => {
        speak('Saved.');
        speak('3 still to enter.', { settle: 700 });
        flushSync(() => {
            setBusy(true);
            setDone(30);
        });
        // A press that brings the next round, whose heading takes focus a frame later.
        document.getElementById('next')?.click();
        document.getElementById('make')?.click();
        const cell = document.getElementById('cell-one');
        cell?.focus();
        cell?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        focusNext('cell-one');
    };
    return (
        <>
            <h2 ref={heading}>Round {round}</h2>
            <button
                type="button"
                id="next"
                onClick={() => {
                    setRound((now) => now + 1);
                }}
            >
                Next round
            </button>
            <div id="row" role="toolbar" aria-label="Cells" ref={row}>
                <button type="button" id="cell-one">
                    One
                </button>
                <button type="button" id="cell-two">
                    Two
                </button>
            </div>
            <Button id="save" ref={save} busy={busy ? 'Saving the list.' : false}>
                Save
            </Button>
            <Progress
                ref={bar}
                id="bar"
                label="Importing products"
                value={done}
                max={40}
                words={`${String(done)} of 40`}
            />
            <form id="form" ref={form} onSubmit={(event) => event.preventDefault()}>
                <InputField id="name" label="List name" required error={errors['name']} />
                <button type="submit" id="make">
                    Make the list
                </button>
            </form>
        </>
    );
};

const App = () => {
    const [shown, setShown] = useState(false);
    page.show = () => {
        flushSync(() => {
            setShown(true);
        });
    };
    page.leave = () => {
        flushSync(() => {
            setShown(false);
        });
    };
    return (
        <main>
            <h1>Lists</h1>
            {shown ? (
                <StatusProvider>
                    <Pieces />
                </StatusProvider>
            ) : null}
        </main>
    );
};

const root = document.getElementById('root');
if (root)
    createRoot(root).render(
        page.strict ? (
            <StrictMode>
                <App />
            </StrictMode>
        ) : (
            <App />
        )
    );
