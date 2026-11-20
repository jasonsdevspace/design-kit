import { useEffect, useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

import { useArrivalFocus, useFocusAfterDraw, useRoving } from '../src/react.js';

type Page = { focusTwice?: () => void; showLate?: () => void; drawAgain?: () => void };
const page = window as unknown as Page;

/*
 * The page focus.spec.tsx draws with React: players each removed by a button that goes with them,
 * focus going to the next player's button or the list's heading, a round whose heading takes
 * focus when the round changes, tabs whose views take focus on their heading as a press draws them,
 * one with a field that takes focus itself, two requests made in one frame, a row of tabs moved
 * along by the arrow keys or chosen by a press, whose views each take focus on arrival, a view
 * first drawn late beside a field, one gone in the frame it arrived in, a view drawn again many
 * times before any press, and a view and a section of it brought by one press.
 */

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

const Round = () => {
    const [round, setRound] = useState(1);
    const heading = useArrivalFocus<HTMLHeadingElement>(round);
    return (
        <section>
            <h2 id="round" ref={heading}>
                Round {round}
            </h2>
            <button id="next" type="button" onClick={() => setRound(round + 1)}>
                Next round
            </button>
        </section>
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

const root = document.getElementById('root');
if (root)
    createRoot(root).render(
        <main>
            <Players />
            <Round />
            <Tabs />
            <Modes />
            <Late />
            <Brief />
            <Again />
            <Start />
        </main>
    );
