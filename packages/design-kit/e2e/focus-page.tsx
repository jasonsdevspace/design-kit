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
import { createPortal, flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

import { useArrivalFocus, useFocusAfterDraw, useRoving } from '../src/react.js';

type Page = {
    focusTwice?: () => void;
    showLate?: () => void;
    drawAgain?: () => void;
    answerLeave?: () => void;
    answerNamed?: () => void;
    answerShadow?: () => void;
    dropOwner?: () => void;
    hideOwner?: () => void;
    showOwner?: () => void;
    askHidden?: () => void;
};
const page = window as unknown as Page;

/*
 * The page focus.spec.tsx draws with React: players each removed by a button that goes with them,
 * focus going to the next player's button or the list's heading, a round whose heading takes focus
 * when the round changes, tabs whose views take focus on their heading as a press draws them, one
 * with a field that takes focus itself, two requests made in one frame, a row of tabs moved along
 * by the arrow keys or chosen by a press, whose views each take focus on arrival, a view first
 * drawn late beside a field, one gone in the frame it arrived in, a view drawn again many times
 * before any press, a view and a section of it brought by one press, a save answered after an await
 * that turns on the control it asks focus for, the same with the control in a sibling and with the
 * save pressed inside a shadow root, a view whose key a press inside a shadow root changes, a panel
 * inside a shadow root that asks late for focus on its opener by its id, a panel that asks for
 * focus on its opener once it is gone, rows that each ask for focus on the next as their own press
 * removes them, a screen that asks for focus late, once it is gone and the visitor is on the next,
 * the same naming that field as where focus was, a view that asks for focus on its first field from
 * that field's ref as a press draws it, rows removed after an await, from a timer and in a
 * transition, requests asked in a transition held back by a part that never loads, whose owner an
 * urgent update then unmounts or an `Activity` hides, a request asked as an `Activity` hides its
 * owner in the same press, one asked while it hides it, and one made in a commit whose owner the
 * next commit takes away.
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

// A view whose key changes on a press of a button inside a shadow root, as a widget's own button
// is, where the document names only the widget's host as what has focus.
const ShadowRound = () => {
    const [round, setRound] = useState(1);
    const heading = useArrivalFocus<HTMLHeadingElement>(round);
    const host = useCallback((element: HTMLDivElement | null) => {
        if (!element || element.shadowRoot) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.id = 'shadow-bump';
        button.textContent = 'Next round in the widget';
        button.addEventListener('click', () => {
            setRound((now) => now + 1);
        });
        element.attachShadow({ mode: 'open' }).append(button);
    }, []);
    return (
        <section>
            <div ref={host} />
            <h2 id="shadow-round" ref={heading}>
                Widget round {round}
            </h2>
        </section>
    );
};

// A panel drawn inside a shadow root, closed by its own press, which asks for focus on its opener
// by the opener's id once the test answers, after it is gone, naming a place in the same root as
// where focus was, since focus fell to the page's body as the panel went.
const ShadowPanel = ({ onClose }: { readonly onClose: () => void }) => {
    const focusBack = useFocusAfterDraw();
    const close = async (near: Element | null) => {
        onClose();
        await new Promise<void>((resolve) => {
            page.answerShadow = resolve;
        });
        focusBack('shadow-panel-open', { from: near });
    };
    return (
        <button
            id="shadow-panel-close"
            type="button"
            onClick={(event) => {
                void close(event.currentTarget.parentElement);
            }}
        >
            Close the panel in the widget
        </button>
    );
};

const ShadowPanels = () => {
    const [root, setRoot] = useState<ShadowRoot | null>(null);
    const [open, setOpen] = useState(true);
    const host = useCallback((element: HTMLDivElement | null) => {
        if (element) setRoot(element.shadowRoot ?? element.attachShadow({ mode: 'open' }));
    }, []);
    return (
        <section>
            <div ref={host} />
            {root
                ? createPortal(
                      <div>
                          <button
                              id="shadow-panel-open"
                              type="button"
                              onClick={() => setOpen(true)}
                          >
                              Open the panel in the widget
                          </button>
                          {open ? <ShadowPanel onClose={() => setOpen(false)} /> : null}
                      </div>,
                      root
                  )
                : null}
        </section>
    );
};

// A panel closed by its own press, which asks for focus on its opener after an await, once it is
// gone.
const Panel = ({
    onClose,
    id = 'panel-close',
    to = 'panel-open',
}: {
    readonly onClose: () => void;
    readonly id?: string;
    readonly to?: string;
}) => {
    const focusBack = useFocusAfterDraw();
    const close = async () => {
        onClose();
        await answered();
        focusBack(() => document.getElementById(to));
    };
    return (
        <button
            id={id}
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

// The same, asking for focus on a link inside an inline svg, an SVG element and not an HTML
// one.
const ChartPanels = () => {
    const [open, setOpen] = useState(true);
    return (
        <section>
            <svg width="160" height="40">
                <a href="#chart-panel" id="chart-open">
                    <text x="0" y="24">
                        Round 3 chart
                    </text>
                </a>
            </svg>
            {open ? (
                <Panel onClose={() => setOpen(false)} id="chart-close" to="chart-open" />
            ) : null}
        </section>
    );
};

/**
 * How a row's press removes it and asks for the next: at once, after an await, from a timer or in a
 * transition.
 */
type Removal = 'click' | 'await' | 'timer' | 'transition';

/** Runs a row's removal and its request the way the list says. */
const removing = (how: Removal, change: () => void) => {
    if (how === 'click') change();
    else if (how === 'await')
        void (async () => {
            await answered();
            change();
        })();
    else if (how === 'timer') setTimeout(change);
    else startTransition(change);
};

// A row of its own, which asks for focus on the next as its press removes it, so it asks before
// the render that unmounts it is drawn.
const Row = ({
    id,
    next,
    how,
    onRemove,
}: {
    readonly id: string;
    readonly next: string | undefined;
    readonly how: Removal;
    readonly onRemove: () => void;
}) => {
    const focusNext = useFocusAfterDraw();
    return (
        <button
            id={id}
            type="button"
            onClick={() => {
                removing(how, () => {
                    onRemove();
                    focusNext(next ?? null, { fallbacks: [`rows-${how}`] });
                });
            }}
        >
            Remove {id}
        </button>
    );
};

const Rows = ({ how }: { readonly how: Removal }) => {
    const [rows, setRows] = useState(['Ann', 'Ben', 'Cy']);
    const idOf = (name: string) => (how === 'click' ? `row-${name}` : `row-${how}-${name}`);
    return (
        <section>
            <h2 id={`rows-${how}`} tabIndex={-1}>
                Rows removed by {how}
            </h2>
            {rows.map((name, at) => {
                const next = rows[at + 1] ?? rows[at - 1];
                return (
                    <Row
                        key={name}
                        id={idOf(name)}
                        next={next ? idOf(next) : undefined}
                        how={how}
                        onRemove={() => {
                            setRows((now) => now.filter((one) => one !== name));
                        }}
                    />
                );
            })}
        </section>
    );
};

// A screen whose press takes it away and asks for focus on its opener only once the test answers,
// after the visitor has moved on to the field the next screen draws, naming that field as where
// focus was where `named` is given.
const Leaving = ({ named, onClose }: { readonly named: boolean; readonly onClose: () => void }) => {
    const focusBack = useFocusAfterDraw();
    const prefix = named ? 'named-' : '';
    const close = async () => {
        onClose();
        await new Promise<void>((resolve) => {
            if (named) page.answerNamed = resolve;
            else page.answerLeave = resolve;
        });
        focusBack(`${prefix}leave-open`, {
            from: named ? document.getElementById(`${prefix}next-screen`) : undefined,
        });
    };
    return (
        <button
            id={`${prefix}leave-close`}
            type="button"
            onClick={() => {
                void close();
            }}
        >
            Close and go on
        </button>
    );
};

const Leave = ({ named }: { readonly named: boolean }) => {
    const [open, setOpen] = useState(true);
    const prefix = named ? 'named-' : '';
    return (
        <section>
            <button id={`${prefix}leave-open`} type="button" onClick={() => setOpen(true)}>
                Open the screen
            </button>
            {open ? (
                <Leaving named={named} onClose={() => setOpen(false)} />
            ) : (
                <input id={`${prefix}next-screen`} aria-label="Next screen's field" />
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

// A part whose press asks for focus, inside a transition that a part never loading holds back
// where `held` is given, or at once and then hidden in the same press by `onPress`.
const Owner = ({
    id,
    target,
    held,
    onWait,
    onPress,
}: {
    readonly id: string;
    readonly target: string;
    readonly held: boolean;
    readonly onWait: () => void;
    readonly onPress?: () => void;
}) => {
    const focusNext = useFocusAfterDraw();
    // The hidden owner's request, which the test asks while the Activity hides it.
    if (id === 'hidden-ask')
        page.askHidden = () => {
            focusNext('hidden-target');
        };
    return (
        <button
            id={id}
            type="button"
            onClick={() => {
                if (held)
                    startTransition(() => {
                        onWait();
                        focusNext(target, { fallbacks: ['owner-fallback'] });
                    });
                else {
                    focusNext(target, { fallbacks: ['owner-fallback'] });
                    onPress?.();
                }
            }}
        >
            Ask from {id}
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
    page.showOwner = () => {
        setShown(true);
    };
    const wait = () => {
        setWaiting(true);
    };
    return (
        <section>
            <button id="owner-target" type="button">
                Target of the request
            </button>
            <button id="owner-fallback" type="button">
                Fallback of the request
            </button>
            <input id="owner-field" aria-label="Where the visitor went" />
            <Suspense fallback={<p>Loading</p>}>
                {waiting ? (
                    <>
                        <Never />
                        <button id="drawn-target" type="button">
                            Drawn by the transition
                        </button>
                    </>
                ) : null}
            </Suspense>
            {owned ? (
                <>
                    <Owner id="owner-ask" target="owner-target" held onWait={wait} />
                    <Owner id="drawn-ask" target="drawn-target" held onWait={wait} />
                </>
            ) : null}
            <Activity mode={shown ? 'visible' : 'hidden'}>
                <section id="hidden-owner">
                    <button id="hidden-target" type="button">
                        Target inside the hidden part
                    </button>
                    <Owner id="hidden-ask" target="owner-target" held onWait={wait} />
                    <Owner
                        id="hide-ask"
                        target="owner-target"
                        held={false}
                        onWait={wait}
                        onPress={() => {
                            setShown(false);
                        }}
                    />
                </section>
            </Activity>
        </section>
    );
};

// A part whose request is made in the commit its press brings, and which a layout effect of the
// part above takes away in the next commit, before the request's frame.
const Brisk = ({ onAsked }: { readonly onAsked: () => void }) => {
    const focusNext = useFocusAfterDraw();
    return (
        <button
            id="brisk-ask"
            type="button"
            onClick={() => {
                focusNext('brisk-target');
                onAsked();
            }}
        >
            Ask and go
        </button>
    );
};

const Brisks = () => {
    const [asked, setAsked] = useState(false);
    const [shown, setShown] = useState(true);
    useLayoutEffect(() => {
        if (asked) setShown(false);
    }, [asked]);
    return (
        <section>
            <button id="brisk-target" type="button">
                Target of the brisk request
            </button>
            {shown ? <Brisk onAsked={() => setAsked(true)} /> : null}
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
            <ShadowRound />
            <ShadowPanels />
            <Panels />
            <ChartPanels />
            <Rows how="click" />
            <Rows how="await" />
            <Rows how="timer" />
            <Rows how="transition" />
            <Leave named={false} />
            <Leave named />
            <Opener />
            <Owners />
            <Brisks />
        </main>
    );
