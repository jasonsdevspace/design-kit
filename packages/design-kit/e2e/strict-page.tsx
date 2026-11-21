import {
    StrictMode,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
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
 * two forms and two rows of cells on one ref, either of which the page takes away, and a form that
 * refuses as it first draws, a form behind a ref made afresh on every render, a form and a row of
 * cells behind arrows that return the hook's cleanup, drawn again by the page, two forms on one ref
 * whose newer the page takes away as it refuses, a form and a row of cells that move from one
 * hook's ref to another's, and a busy button another hook joins through a ref that merges both.
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
    dropForm: (which: 'one' | 'two') => void;
    dropRow: (which: 'one' | 'two') => void;
    turnRows: () => void;
    showFirstRefusal: () => void;
    churns: number;
    redraw: () => void;
    dropAndRefuse: () => void;
    handOff: () => void;
    joinBusy: (on: boolean) => void;
    join: () => void;
};
const page = window as unknown as Strict;
page.moves = 0;
page.focusesOnA = 0;
page.churns = 0;
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
    // Each ref called with null, as a helper written to merge refs before React 19 calls it, dropping
    // the cleanup.
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

// Two forms on one hook's ref, either of which the page takes away.
const TwoForms = () => {
    const [gone, setGone] = useState<'none' | 'one' | 'two'>('none');
    const [errors, setErrors] = useState<Record<string, string>>({});
    page.dropForm = (which) => {
        setGone(which);
    };
    const [form] = useFormRefusal<HTMLFormElement>({
        say,
        invalid: (failures) => {
            setErrors(Object.fromEntries(failures.map(({ field, words }) => [field.id, words])));
        },
    });
    return (
        <>
            {['one', 'two']
                .filter((which) => which !== gone)
                .map((which) => (
                    <form
                        key={which}
                        id={`pair-${which}`}
                        ref={form}
                        onSubmit={(event) => event.preventDefault()}
                    >
                        <InputField
                            id={`pair-${which}-name`}
                            label={`List ${which}`}
                            required
                            error={errors[`pair-${which}-name`]}
                        />
                        <button type="submit">Make list {which}</button>
                    </form>
                ))}
        </>
    );
};

// Two rows of cells on one hook's ref, laid out as rows until the page turns them, either of which
// the page takes away.
const TwoRows = () => {
    const [gone, setGone] = useState<'none' | 'one' | 'two'>('none');
    const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
    page.dropRow = (which) => {
        setGone(which);
    };
    page.turnRows = () => {
        setOrientation('vertical');
    };
    const row = useRoving<HTMLDivElement>({ orientation });
    return (
        <>
            {['one', 'two']
                .filter((which) => which !== gone)
                .map((which) => (
                    <div
                        key={which}
                        id={`rows-${which}`}
                        role="toolbar"
                        aria-label={which}
                        ref={row}
                    >
                        <button type="button" id={`rows-${which}-a`}>
                            A
                        </button>
                        <button type="button" id={`rows-${which}-b`}>
                            B
                        </button>
                    </div>
                ))}
        </>
    );
};

// A form with an error drawn from the start, which refuses once as it first draws.
const FirstRefusal = () => {
    const [form, refuse] = useFormRefusal<HTMLFormElement>({ say, invalid: () => undefined });
    const asked = useRef(false);
    useEffect(() => {
        if (asked.current) return;
        asked.current = true;
        refuse();
    }, [refuse]);
    return (
        <form id="first-refusal" ref={form} onSubmit={(event) => event.preventDefault()}>
            <InputField id="first-refusal-name" label="Board name" error="Enter a board name." />
        </form>
    );
};

// A form behind a ref made afresh on every render, as a helper that merges refs makes one, which
// React calls with null and then with the form again each time the page draws.
const ChurnForm = () => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [form] = useFormRefusal<HTMLFormElement>({
        say,
        invalid: (failures) => {
            setErrors(Object.fromEntries(failures.map(({ field, words }) => [field.id, words])));
        },
    });
    page.churns += 1;
    // Draws again in the commit that draws the errors, before the refusal's frame, as a page that
    // measures its errors does, so the refusal must outlast a draw that calls the ref again.
    const [, again] = useState(0);
    useLayoutEffect(() => {
        if (Object.keys(errors).length > 0) again((now) => now + 1);
    }, [errors]);
    return (
        <form
            id="churn"
            ref={(element) => {
                form(element);
            }}
            onSubmit={(event) => event.preventDefault()}
        >
            <InputField id="churn-name" label="Deck name" required error={errors['churn-name']} />
            <button type="submit">Make the deck</button>
        </form>
    );
};

// A form and a row of cells behind arrows that return what the hook's ref returns, so each render
// makes a new ref that hands React the hook's cleanup, which React calls before the new ref.
const Returned = () => {
    const [drawn, setDrawn] = useState(0);
    const [errors, setErrors] = useState<Record<string, string>>({});
    page.redraw = () => {
        setDrawn((now) => now + 1);
    };
    const row = useRoving<HTMLDivElement>();
    const [form] = useFormRefusal<HTMLFormElement>({
        say,
        invalid: (failures) => {
            setErrors(Object.fromEntries(failures.map(({ field, words }) => [field.id, words])));
        },
    });
    return (
        <>
            <div
                id="returned-row"
                role="toolbar"
                aria-label="Returned"
                data-drawn={drawn}
                ref={(element) => row(element)}
            >
                <button type="button" id="returned-a">
                    A
                </button>
                <button type="button" id="returned-b">
                    B
                </button>
            </div>
            <form
                id="returned"
                ref={(element) => form(element)}
                onSubmit={(event) => event.preventDefault()}
            >
                <InputField
                    id="returned-name"
                    label="Table name"
                    required
                    error={errors['returned-name']}
                />
                <button type="submit">Make the table</button>
            </form>
        </>
    );
};

// Two forms on one ref, the first with an error drawn, and a way to take the second away and refuse
// in one press, so the refusal goes through the form left.
const DropAndRefuse = () => {
    const [second, setSecond] = useState(true);
    const [form, refuse] = useFormRefusal<HTMLFormElement>({ say, invalid: () => undefined });
    page.dropAndRefuse = () => {
        setSecond(false);
        refuse();
    };
    return (
        <>
            <form id="kept" ref={form} onSubmit={(event) => event.preventDefault()}>
                <InputField id="kept-name" label="Kept name" error="Enter a kept name." />
            </form>
            {second ? (
                <form id="dropped" ref={form} onSubmit={(event) => event.preventDefault()}>
                    <InputField id="dropped-name" label="Dropped name" />
                </form>
            ) : null}
        </>
    );
};

// A form and a row of cells that stay on the page while the page moves each from one hook's ref to
// another's, as a form that edits or adds by one flag.
const HandOff = () => {
    const [editing, setEditing] = useState(false);
    page.handOff = () => {
        setEditing(true);
    };
    const words =
        (who: string): Say =>
        (message) => {
            const said = typeof message === 'function' ? message() : message;
            if (said) page.said.push(`${who} ${said}`);
        };
    const [adding] = useFormRefusal<HTMLFormElement>({
        say: words('Adding:'),
        invalid: () => undefined,
    });
    const [edit] = useFormRefusal<HTMLFormElement>({
        say: words('Editing:'),
        invalid: () => undefined,
    });
    const addRow = useRoving<HTMLDivElement>();
    const editRow = useRoving<HTMLDivElement>();
    return (
        <>
            <div
                id="handed-row"
                role="toolbar"
                aria-label="Handed"
                ref={editing ? editRow : addRow}
            >
                <button type="button" id="handed-a">
                    A
                </button>
                <button type="button" id="handed-b">
                    B
                </button>
            </div>
            <form
                id="handed"
                ref={editing ? edit : adding}
                onSubmit={(event) => event.preventDefault()}
            >
                <InputField id="handed-name" label="Player name" required />
                <button type="submit">Save the player</button>
            </form>
        </>
    );
};

/** One ref that calls each ref given and returns what takes down every one, as a page's helper. */
const merged =
    <Element,>(...refs: readonly ((element: Element | null) => (() => void) | void)[]) =>
    (element: Element | null) => {
        const cleanups = refs.map((ref) => ref(element));
        return () => {
            for (const cleanup of cleanups) cleanup?.();
        };
    };

// A busy button written by hand, so the busy attach sets its mark, whose page joins a heading's
// focus to it later, through a ref that merges both and calls the new hook's ref first, so the busy
// attach must come through the render untouched.
const Joined = () => {
    const [busy, setBusy] = useState(false);
    const [joined, setJoined] = useState(false);
    page.joinBusy = setBusy;
    page.join = () => {
        setJoined(true);
    };
    const save = useBusy<HTMLButtonElement>({ say });
    const arrival = useArrivalFocus<HTMLButtonElement>('joined');
    const ref = useMemo(
        () => (joined ? merged(arrival, save) : merged(save)),
        [joined, arrival, save]
    );
    return (
        <button
            type="button"
            id="joined"
            className="dk-button"
            ref={ref}
            data-busy={busy ? 'Saving the deck.' : undefined}
        >
            Save the deck
        </button>
    );
};

const FirstRefusals = () => {
    const [shown, setShown] = useState(false);
    page.showFirstRefusal = () => {
        setShown(true);
    };
    return shown ? <FirstRefusal /> : null;
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
                <TwoRows />
                <FirstRefusals />
                <ChurnForm />
                <Returned />
                <DropAndRefuse />
                <HandOff />
                <Joined />
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
