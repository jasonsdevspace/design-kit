import { useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
    Button,
    InputField,
    Progress,
    StatusProvider,
    useBusy,
    useFormRefusal,
    useProgress,
    useRoving,
} from '../src/react.js';

/*
 * The page hooks.spec.tsx draws with React, for the checks record 20 asks of each hook that
 * attaches to an element: a row of cells, a busy button, a progress bar and a form, each of which
 * the page can swap for another element, draw again with the same options, draw with an option
 * dropped, or take away.
 */

export type Controls = {
    swap: () => void;
    again: () => void;
    drop: () => void;
    leave: () => void;
    busy: (on: boolean) => void;
    move: (done: number) => void;
    clicks: number;
    draws: number;
    chosen?: string;
};
const page = window as unknown as Controls;
page.clicks = 0;
page.draws = 0;

const Pieces = ({ which, dropped }: { readonly which: string; readonly dropped: boolean }) => {
    page.draws += 1;
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(0);
    page.busy = setBusy;
    page.move = setDone;
    // Its options written inline on every draw, with the cell the stop is placed on read from a
    // value the page changes behind the row's back, so only options set again would move it.
    const row = useRoving<HTMLDivElement>(
        dropped
            ? {}
            : {
                  orientation: 'vertical',
                  current: () => document.getElementById(page.chosen ?? `${which}-one`),
              }
    );
    const save = useBusy<HTMLButtonElement>();
    const bar = useProgress(dropped ? {} : { done: 'Imported 40 products.' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [form] = useFormRefusal<HTMLFormElement>({
        errorWords: dropped ? undefined : { valueMissing: 'Enter a list name.' },
        invalid: (failures) => {
            setErrors(Object.fromEntries(failures.map(({ field, words }) => [field.id, words])));
        },
    });
    return (
        <>
            <div
                key={`row-${which}`}
                id={`row-${which}`}
                role="toolbar"
                aria-label="Cells"
                ref={row}
            >
                <button type="button" id={`${which}-one`}>
                    One
                </button>
                <button type="button" id={`${which}-two`}>
                    Two
                </button>
            </div>
            <Button
                key={`save-${which}`}
                id={`save-${which}`}
                ref={save}
                busy={busy}
                onClick={() => {
                    page.clicks += 1;
                }}
            >
                Save
            </Button>
            <Progress
                key={`bar-${which}`}
                ref={bar}
                id={`bar-${which}`}
                label="Importing products"
                value={done}
                max={40}
                words={`${String(done)} of 40`}
            />
            <form
                key={`form-${which}`}
                id={`form-${which}`}
                ref={form}
                onSubmit={(event) => event.preventDefault()}
            >
                <InputField
                    id={`name-${which}`}
                    label="List name"
                    required
                    error={errors[`name-${which}`]}
                />
                <button type="submit">Make the list</button>
            </form>
        </>
    );
};

const App = () => {
    const [which, setWhich] = useState('a');
    const [, setTick] = useState(0);
    const [dropped, setDropped] = useState(false);
    const [shown, setShown] = useState(true);
    page.swap = () => {
        setWhich('b');
    };
    page.again = () => {
        setTick((now) => now + 1);
    };
    page.drop = () => {
        setDropped(true);
    };
    page.leave = () => {
        setShown(false);
    };
    return (
        <StatusProvider>
            <main>
                <h1>Lists</h1>
                {shown ? <Pieces which={which} dropped={dropped} /> : null}
            </main>
        </StatusProvider>
    );
};

const root = document.getElementById('root');
if (root) createRoot(root).render(<App />);
