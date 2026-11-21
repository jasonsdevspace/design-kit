import {
    Activity,
    startTransition,
    Suspense,
    use,
    useCallback,
    useEffect,
    useLayoutEffect,
    useState,
} from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

import { useArrivalFocus, useFocusAfterDraw, useRoving } from '../src/react.js';

type Page = {
    focusTwice?: () => void;
    showLate?: () => void;
    drawAgain?: () => void;
    answerLeave?: () => void;
    dropOwner?: () => void;
    hideOwner?: () => void;
};
const page = window as unknown as Page;

/*
 * The page focus.spec.tsx draws with React: players each removed by a button that goes with them,
 * focus going to the next player's button or the list's heading, a round whose heading takes
 * focus when the round changes, tabs whose views take focus on their heading as a press draws them,
 * one with a field that takes focus itself, two requests made in one frame, a row of tabs moved
 * along by the arrow keys or chosen by a press, whose views each take focus on arrival, a view
 * first drawn late beside a field, one gone in the frame it arrived in, a view drawn again many
 * times before any press, a view and a section of it brought by one press, a save answered
 * after an await that turns on the control it asks focus for, the same with the control in a
 * sibling and with the save pressed inside a shadow root, a panel that asks for focus on its
 * opener once it is gone, rows that each ask for focus on the next as their own press removes
 * them, a screen that asks for focus late, once it is gone and the visitor is on the next, a view
 * that asks for focus on its first field from that field's ref as a press draws it, and requests
 * asked in a transition held back by a part that never loads, whose owner an urgent update then
 * unmounts or an `Activity` hides.
 */

/** A save's answer, in a task of its own as a store's is, so React draws what it sets later. */
const answered = () =>
    new Promise((resolve) => {
        setTimeout(resolve);
    });

const Players = () => {
    const [players, setPlayers] = useState(['Ann', 'Ben']);
    const focusNext = useFocusAfterDraw();
    page.focusTwice = () => {
        focusNext('players');
        focusNext('next');
    };
    return (
        <section>
            <h2 id="players" tabIndex={-1}>
                Players
            </h2>
            {players.map((name, at) => (
                <button
                    key={name}
                    id={`remove-${name}`}
                    type="button"
                    onClick={() => {
                        const next = players[at + 1] ?? players[at - 1];
                        setPlayers(players.filter((one) => one !== name));
                        focusNext(next ? `remove-${next}` : null, { fallbacks: ['players'] });
                    }}
                >
                    Remove {name}
                </button>
            ))}
        </section>
    );
};

// A section of the round, drawn afresh for each, which asks to take focus as it arrives too.
const RoundScores = () => {
    const heading = useArrivalFocus<HTMLHeadingElement>('round-scores');
    return (
        <h3 id="round-scores" ref={heading}>
            Scores this round
        </h3>
    );
};

const Round = () => {
    const [round, setRound] = useState(1);
    const heading = useArrivalFocus<HTMLHeadingElement>(round);
    return (
        <section>
            <h2 id="round" ref={heading}>
                Round {round}
            </h2>
            <RoundScores key={round} />
            <button id="next" type="button" onClick={() => setRound(round + 1)}>
                Next round
            </button>
        </section>
    );
};

// A round's button that takes focus as its key changes, as a scores screen's "Change round" does.
const Change = () => {
    const [round, setRound] = useState(1);
    const button = useArrivalFocus<HTMLButtonElement>(round);
    return (
        <section>
            <button id="change" type="button" ref={button} onClick={() => setRound(round + 1)}>
                Change round {round}
            </button>
            <button id="after-change" type="button">
                After
            </button>
            <button id="bump" type="button" onClick={() => setRound(round + 1)}>
                Next round
            </button>
        </section>
    );
};

// A title written as a link with no address, which cannot take focus until the ref gives it a way.
const LinkTitle = () => {
    const title = useArrivalFocus<HTMLAnchorElement>('link-title');
    return (
        <a id="link-title" ref={title}>
            Round notes
        </a>
    );
};

const Scores = () => {
    const heading = useArrivalFocus<HTMLHeadingElement>('scores');
    return (
        <h2 id="scores" ref={heading}>
            Scores
        </h2>
    );
};

const Search = () => {
    const heading = useArrivalFocus<HTMLHeadingElement>('search');
    return (
        <section>
            <h2 id="search" ref={heading}>
                Search
            </h2>
            <input id="query" aria-label="Search" autoFocus />
        </section>
    );
};

const Tabs = () => {
    const [view, setView] = useState('none');
    return (
        <section>
            <button id="show-scores" type="button" onClick={() => setView('scores')}>
                Scores
            </button>
            <button id="show-search" type="button" onClick={() => setView('search')}>
                Search
            </button>
            {view === 'scores' ? <Scores /> : null}
            {view === 'search' ? <Search /> : null}
        </section>
    );
};

const Mode = ({ name }: { readonly name: string }) => {
    const heading = useArrivalFocus<HTMLHeadingElement>(name);
    return (
        <h2 id={`view-${name}`} ref={heading}>
            {name}
        </h2>
    );
};

const MODES = ['number', 'cards'];

const Modes = () => {
    const [mode, setMode] = useState('number');
    const row = useRoving<HTMLDivElement>({
        onMove: (cell) => {
            setMode(cell.id.replace('mode-', ''));
        },
    });
    return (
        <section>
            <div className="dk-tabs" role="tablist" aria-label="Enter" ref={row}>
                {MODES.map((one) => (
                    <button
                        key={one}
                        id={`mode-${one}`}
                        type="button"
                        role="tab"
                        className="dk-tab"
                        aria-selected={mode === one}
                        onClick={() => {
                            setMode(one);
                        }}
                    >
                        {one}
                    </button>
                ))}
            </div>
            <Mode key={mode} name={mode} />
        </section>
    );
};

const LateView = () => {
    const heading = useArrivalFocus<HTMLHeadingElement>('late');
    return (
        <h2 id="late" ref={heading}>
            Late
        </h2>
    );
};

const Late = () => {
    const [shown, setShown] = useState(false);
    useEffect(() => {
        page.showLate = () => {
            setShown(true);
        };
    }, []);
    return (
        <section>
            <input id="late-query" aria-label="Find a game" />
            <button id="off" type="button" aria-disabled="true">
                Deal
            </button>
            {shown ? <LateView /> : null}
        </section>
    );
};

const Part = () => {
    const heading = useArrivalFocus<HTMLHeadingElement>('part');
    return (
        <h3 id="part" ref={heading}>
            Scores so far
        </h3>
    );
};

// A view and a section of it, each taking focus on arrival, brought by one press.
const Game = () => {
    const heading = useArrivalFocus<HTMLHeadingElement>('game');
    return (
        <section>
            <h2 id="game" ref={heading}>
                Game
            </h2>
            <Part />
        </section>
    );
};

const Start = () => {
    const [started, setStarted] = useState(false);
    return (
        <section>
            <button id="start" type="button" onClick={() => setStarted(true)}>
                Start
            </button>
            {started ? <Game /> : null}
        </section>
    );
};

const BriefView = () => {
    const heading = useArrivalFocus<HTMLHeadingElement>('brief');
    return (
        <h2 id="brief" ref={heading}>
            Brief
        </h2>
    );
};

// A view that leaves in the frame it arrived in, as one a layout effect sends away from does.
const Brief = () => {
    const [shown, setShown] = useState(false);
    useLayoutEffect(() => {
        if (shown) setShown(false);
    }, [shown]);
    return (
        <section>
            <button id="show-brief" type="button" onClick={() => setShown(true)}>
                Brief
            </button>
            {shown ? <BriefView /> : null}
        </section>
    );
};

const Again = () => {
    const [count, setCount] = useState(0);
    const heading = useArrivalFocus<HTMLHeadingElement>('again');
    page.drawAgain = () => {
        for (let draw = 0; draw < 20; draw += 1)
            flushSync(() => {
                setCount((now) => now + 1);
            });
    };
    return (
        <h2 id="again" ref={heading} data-count={count}>
            Again
        </h2>
    );
};

// A save answered after an await, whose answer turns on the control focus goes to next.
const Saving = () => {
    const [saved, setSaved] = useState(false);
    const focusNext = useFocusAfterDraw();
    const save = async () => {
        await answered();
        setSaved(true);
        focusNext('saved-next');
    };
    return (
        <section>
            <button
                id="save"
                type="button"
                onClick={() => {
                    void save();
                }}
            >
                Save
            </button>
            <button id="saved-next" type="button" aria-disabled={saved ? undefined : 'true'}>
                Next
            </button>
        </section>
    );
};

// The control a save turns on drawn by a sibling, so only the sibling draws the save's change.
let turnOnSibling: (() => void) | null = null;

const SiblingNext = () => {
    const [on, setOn] = useState(false);
    useEffect(() => {
        turnOnSibling = () => {
            setOn(true);
        };
        return () => {
            turnOnSibling = null;
        };
    }, []);
    return (
        <button id="sibling-next" type="button" aria-disabled={on ? undefined : 'true'}>
            Next in the sibling
        </button>
    );
};

const SiblingSave = () => {
    const focusNext = useFocusAfterDraw();
    const save = async () => {
        await answered();
        turnOnSibling?.();
        focusNext('sibling-next');
    };
    return (
        <button
            id="sibling-save"
            type="button"
            onClick={() => {
                void save();
            }}
        >
            Save for the sibling
        </button>
    );
};

// A save pressed inside a shadow root, as a widget's own button is, whose answer turns on a control
// of the page around it.
const ShadowSave = () => {
    const [saved, setSaved] = useState(false);
    const focusNext = useFocusAfterDraw();
    const host = useCallback(
        (element: HTMLDivElement | null) => {
            if (!element || element.shadowRoot) return;
            const button = document.createElement('button');
            button.type = 'button';
            button.id = 'shadow-save';
            button.textContent = 'Save in the widget';
            button.addEventListener('click', () => {
                void (async () => {
                    await answered();
                    setSaved(true);
                    focusNext(() => document.getElementById('shadow-next'));
                })();
            });
            element.attachShadow({ mode: 'open' }).append(button);
        },
        [focusNext]
    );
    return (
        <section>
            <div ref={host} />
            <button id="shadow-next" type="button" aria-disabled={saved ? undefined : 'true'}>
                Next after the widget
            </button>
        </section>
    );
};

// A panel closed by its own press, which asks for focus on its opener after an await, once it is
// gone.
const Panel = ({ onClose }: { readonly onClose: () => void }) => {
    const focusBack = useFocusAfterDraw();
    const close = async () => {
        onClose();
        await answered();
        focusBack(() => document.getElementById('panel-open'));
    };
    return (
        <button
            id="panel-close"
            type="button"
            onClick={() => {
                void close();
            }}
        >
            Close the panel
        </button>
    );
};

const Panels = () => {
    const [open, setOpen] = useState(true);
    return (
        <section>
            <button id="panel-open" type="button" onClick={() => setOpen(true)}>
                Open the panel
            </button>
            {open ? <Panel onClose={() => setOpen(false)} /> : null}
        </section>
    );
};

// A row of its own, which asks for focus on the next as its press removes it, so it asks in the
// moment it unmounts.
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
            id={`row-${name}`}
            type="button"
            onClick={() => {
                onRemove(name);
                focusNext(next ? `row-${next}` : null, { fallbacks: ['rows'] });
            }}
        >
            Remove row {name}
        </button>
    );
};

const Rows = () => {
    const [rows, setRows] = useState(['Ann', 'Ben', 'Cy']);
    return (
        <section>
            <h2 id="rows" tabIndex={-1}>
                Rows
            </h2>
            {rows.map((name, at) => (
                <Row
                    key={name}
                    name={name}
                    next={rows[at + 1] ?? rows[at - 1]}
                    onRemove={(gone) => {
                        setRows((now) => now.filter((one) => one !== gone));
                    }}
                />
            ))}
        </section>
    );
};

// A screen whose press takes it away and asks for focus on its opener only once the test answers,
// after the visitor has moved on to the field the next screen draws.
const Leaving = ({ onClose }: { readonly onClose: () => void }) => {
    const focusBack = useFocusAfterDraw();
    const close = async () => {
        onClose();
        await new Promise<void>((resolve) => {
            page.answerLeave = resolve;
        });
        focusBack('leave-open');
    };
    return (
        <button
            id="leave-close"
            type="button"
            onClick={() => {
                void close();
            }}
        >
            Close and go on
        </button>
    );
};

const Leave = () => {
    const [open, setOpen] = useState(true);
    return (
        <section>
            <button id="leave-open" type="button" onClick={() => setOpen(true)}>
                Open the screen
            </button>
            {open ? (
                <Leaving onClose={() => setOpen(false)} />
            ) : (
                <input id="next-screen" aria-label="Next screen's field" />
            )}
        </section>
    );
};

// A view a press draws, which asks for focus on its first field from the field's own ref, in the
// commit that first draws it.
const FirstField = () => {
    const focusNext = useFocusAfterDraw();
    const field = useCallback(
        (input: HTMLInputElement | null) => {
            if (input) focusNext(input);
        },
        [focusNext]
    );
    return <input id="first-field" ref={field} aria-label="Name" />;
};

const Opener = () => {
    const [open, setOpen] = useState(false);
    return (
        <section>
            <button id="open-view" type="button" onClick={() => setOpen(true)}>
                Open the view
            </button>
            {open ? <FirstField /> : null}
        </section>
    );
};

// A load that never ends, so a transition that waits on it never commits.
const never = new Promise<never>(() => undefined);
const Never = () => use(never);

// A part whose press asks for focus inside a transition that a part never loading holds back.
const Owner = ({ id, onWait }: { readonly id: string; readonly onWait: () => void }) => {
    const focusNext = useFocusAfterDraw();
    return (
        <button
            id={id}
            type="button"
            onClick={() => {
                startTransition(() => {
                    onWait();
                    focusNext('owner-target');
                });
            }}
        >
            Ask in a transition
        </button>
    );
};

const Owners = () => {
    const [waiting, setWaiting] = useState(false);
    const [owned, setOwned] = useState(true);
    const [shown, setShown] = useState(true);
    page.dropOwner = () => {
        setOwned(false);
    };
    page.hideOwner = () => {
        setShown(false);
    };
    const wait = () => {
        setWaiting(true);
    };
    return (
        <section>
            <button id="owner-target" type="button">
                Target of the transition
            </button>
            <Suspense fallback={<p>Loading</p>}>{waiting ? <Never /> : null}</Suspense>
            {owned ? <Owner id="owner-ask" onWait={wait} /> : null}
            <Activity mode={shown ? 'visible' : 'hidden'}>
                <section id="hidden-owner">
                    <Owner id="hidden-ask" onWait={wait} />
                </section>
            </Activity>
        </section>
    );
};

const root = document.getElementById('root');
if (root)
    createRoot(root).render(
        <main>
            <Players />
            <Round />
            <Change />
            <LinkTitle />
            <Tabs />
            <Modes />
            <Late />
            <Brief />
            <Again />
            <Start />
            <Saving />
            <section>
                <SiblingSave />
                <SiblingNext />
            </section>
            <ShadowSave />
            <Panels />
            <Rows />
            <Leave />
            <Opener />
            <Owners />
        </main>
    );
