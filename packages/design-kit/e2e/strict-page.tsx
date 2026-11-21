import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import type { Say } from '../src/controls.js';
import {
    Button,
    InputField,
    Progress,
    StatusProvider,
    useBusy,
    useFocusAfterDraw,
    useFormRefusal,
    useProgress,
    useRoving,
    useStatus,
} from '../src/react.js';

/*
 * The page strict.spec.tsx draws with React's development build under `StrictMode`, which attaches
 * each ref, takes it down and attaches it again as the page first draws, and runs each effect
 * twice: a part that speaks on its provider's line in its first effect, a row of cells, a busy
 * button, a progress bar and a form whose words the page hears through a `say` of its own, rows
 * that each ask for focus on the next as they are removed, and a way to take the pieces away.
 */

export type Strict = {
    moves: number;
    said: string[];
    busy: (on: boolean) => void;
    move: (done: number) => void;
    leave: () => void;
};
const page = window as unknown as Strict;
page.moves = 0;
page.said = [];

/** Notes each message as it is said, a notice given as a function read as it is said. */
const say: Say = (message) => {
    const words = typeof message === 'function' ? message() : message;
    if (words) page.said.push(words);
};

// Says its words once, as a page guards an announcement against the effect running again, so only
// a line that keeps them through the second run is heard saying them.
const Ready = () => {
    const speak = useStatus();
    const said = useRef(false);
    useEffect(() => {
        if (said.current) return;
        said.current = true;
        speak('Lists ready.');
    }, [speak]);
    return null;
};

const Pieces = () => {
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    page.busy = setBusy;
    page.move = setDone;
    const row = useRoving<HTMLDivElement>({
        onMove: () => {
            page.moves += 1;
        },
    });
    const save = useBusy<HTMLButtonElement>({ say });
    const bar = useProgress({ say, done: 'Imported 40 products.' });
    const [form] = useFormRefusal<HTMLFormElement>({
        say,
        errorWords: { valueMissing: 'Enter a list name.' },
        invalid: (failures) => {
            setErrors(Object.fromEntries(failures.map(({ field, words }) => [field.id, words])));
        },
    });
    return (
        <>
            <div id="row" role="toolbar" aria-label="Cells" ref={row}>
                <button type="button" id="cell-one">
                    One
                </button>
                <button type="button" id="cell-two">
                    Two
                </button>
                <button type="button" id="cell-three">
                    Three
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
                <InputField id="name" label="List name" required error={errors.name} />
                <button type="submit">Make the list</button>
            </form>
        </>
    );
};

// A row that asks for focus on the next one as its own press removes it.
const Row = ({
    name,
    next,
    onRemove,
}: {
    readonly name: string;
    readonly next: string | undefined;
    readonly onRemove: (name: string) => void;
}) => {
    const focusNext = useFocusAfterDraw();
    return (
        <button
            id={`remove-${name}`}
            type="button"
            onClick={() => {
                onRemove(name);
                focusNext(next ? `remove-${next}` : null, { fallbacks: ['players'] });
            }}
        >
            Remove {name}
        </button>
    );
};

const Players = () => {
    const [players, setPlayers] = useState(['Ann', 'Ben', 'Cy']);
    return (
        <section>
            <h2 id="players" tabIndex={-1}>
                Players
            </h2>
            {players.map((name, at) => (
                <Row
                    key={name}
                    name={name}
                    next={players[at + 1] ?? players[at - 1]}
                    onRemove={(gone) => {
                        setPlayers((now) => now.filter((one) => one !== gone));
                    }}
                />
            ))}
        </section>
    );
};

const App = () => {
    const [shown, setShown] = useState(true);
    page.leave = () => {
        setShown(false);
    };
    return (
        <StatusProvider>
            <main>
                <h1>Lists</h1>
                <Ready />
                {shown ? <Pieces /> : null}
                <Players />
            </main>
        </StatusProvider>
    );
};

const root = document.getElementById('root');
if (root)
    createRoot(root).render(
        <StrictMode>
            <App />
        </StrictMode>
    );
