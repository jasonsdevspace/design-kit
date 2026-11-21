import { StrictMode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import type { Say } from '../src/controls.js';
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
 * The page strict.spec.tsx draws with React's development build under `StrictMode`, which attaches
 * each ref, takes it down and attaches it again as the page first draws, and runs each effect
 * twice: a part that speaks on its provider's line in its first effect, a row of cells, a busy
 * button, a progress bar and a form whose words the page hears through a `say` of its own, rows
 * that each ask for focus on the next as they are removed, a way to take the pieces away, a way to
 * call each piece's ref with null, two forms the form's ref moves between, and a way to draw the
 * provider afresh, a part that asks for focus on one field as it first draws and then on another,
 * and two forms on one ref.
 */

export type Strict = {
    moves: number;
    said: string[];
    busy: (on: boolean) => void;
    move: (done: number) => void;
    leave: () => void;
    nullRefs: () => void;
    moveForm: () => void;
    speak?: Say;
    remount: () => void;
    refuseNow: () => void;
    focusesOnA: number;
    dropFirstForm: () => void;
};
const page = window as unknown as Strict;
page.moves = 0;
page.focusesOnA = 0;
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
    page.speak = speak;
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
    const [form, refuse] = useFormRefusal<HTMLFormElement>({
        say,
        errorWords: { valueMissing: 'Enter a list name.' },
        invalid: (failures) => {
            setErrors(Object.fromEntries(failures.map(({ field, words }) => [field.id, words])));
        },
    });
    const heading = useArrivalFocus<HTMLHeadingElement>('pieces');
    // Draws an error and refuses, which the test does in the same task as taking the pieces away.
    page.refuseNow = () => {
        setErrors({ name: 'Enter a list name.' });
        refuse();
    };
    // Each ref called with null, as a helper written to merge refs before React 19 calls it.
    page.nullRefs = () => {
        for (const ref of [row, save, bar, form, heading]) ref(null);
    };
    return (
        <>
            <h2 id="pieces" ref={heading}>
                Pieces
            </h2>
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

// Two forms on the page for good, and the one refused through the hook chosen by the page, so the
// ref moves from one to the other with both still drawn.
const FormMover = () => {
    const [second, setSecond] = useState(false);
    page.moveForm = () => {
        setSecond(true);
    };
    const [form] = useFormRefusal<HTMLFormElement>({ say, invalid: () => undefined });
    return (
        <>
            {['one', 'two'].map((which) => (
                <form
                    key={which}
                    id={`move-${which}`}
                    ref={(which === 'two') === second ? form : undefined}
                    onSubmit={(event) => event.preventDefault()}
                >
                    <InputField id={`move-${which}-name`} label="Copy name" required />
                    <button type="submit">Copy the list</button>
                </form>
            ))}
        </>
    );
};

// A part of the asker that asks in its own layout effect, which runs before the asker's, so a
// request is asked before the asker is first mounted and again in React's second run.
const AskFirst = ({ onDraw }: { readonly onDraw: () => void }) => {
    useLayoutEffect(() => {
        onDraw();
    }, [onDraw]);
    return null;
};

// A part that asks for focus on its first field as it first draws, through a part of its own, and
// then on its second from an effect, so the requests React's second run in development makes and
// remakes each take the place of the one before, and only the last takes focus.
const AskTwice = () => {
    const focusNext = useFocusAfterDraw();
    const first = useCallback(() => {
        focusNext('ask-a');
    }, [focusNext]);
    const counted = useCallback((input: HTMLInputElement | null) => {
        input?.addEventListener('focus', () => {
            page.focusesOnA += 1;
        });
    }, []);
    useEffect(() => {
        focusNext('ask-b');
    }, [focusNext]);
    return (
        <>
            <AskFirst onDraw={first} />
            <input id="ask-a" ref={counted} aria-label="First" />
            <input id="ask-b" aria-label="Second" />
        </>
    );
};

// Two forms on one hook's ref, the first of which the page takes away.
const TwoForms = () => {
    const [both, setBoth] = useState(true);
    const [error, setError] = useState<string | undefined>(undefined);
    page.dropFirstForm = () => {
        setBoth(false);
    };
    const [form] = useFormRefusal<HTMLFormElement>({
        say,
        invalid: (failures) => {
            setError(failures[0]?.words);
        },
    });
    return (
        <>
            {both ? (
                <form id="pair-one" ref={form} onSubmit={(event) => event.preventDefault()}>
                    <InputField id="pair-one-name" label="First list" required />
                </form>
            ) : null}
            <form id="pair-two" ref={form} onSubmit={(event) => event.preventDefault()}>
                <InputField id="pair-two-name" label="Second list" required error={error} />
                <button type="submit">Make the second list</button>
            </form>
        </>
    );
};

const App = () => {
    const [shown, setShown] = useState(true);
    const [drawn, setDrawn] = useState(0);
    page.remount = () => {
        setDrawn((now) => now + 1);
    };
    page.leave = () => {
        setShown(false);
    };
    return (
        <StatusProvider key={drawn}>
            <main>
                <h1>Lists</h1>
                <Ready />
                {shown ? <Pieces /> : null}
                <Players />
                <FormMover />
                <AskTwice />
                <TwoForms />
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
