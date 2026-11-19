import { useState } from 'react';
import { createRoot } from 'react-dom/client';

import { useArrivalFocus, useFocusAfterDraw } from '../src/react.js';

type Page = { focusTwice?: () => void };
const page = window as unknown as Page;

/*
 * The page focus.spec.tsx draws with React: players each removed by a button that goes with them,
 * focus going to the next player's button or the list's heading, a round whose heading takes
 * focus when the round changes, tabs whose views take focus on their heading as a press draws them,
 * one with a field that takes focus itself, and two requests made in one frame.
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

const root = document.getElementById('root');
if (root)
    createRoot(root).render(
        <main>
            <Players />
            <Round />
            <Tabs />
        </main>
    );
