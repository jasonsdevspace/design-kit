import { useState } from 'react';
import { createRoot } from 'react-dom/client';

import { useArrivalFocus, useFocusAfterDraw } from '../src/react.js';

/*
 * The page focus.spec.tsx draws with React: players each removed by a button that goes with them,
 * focus going to the next player's button or the list's heading, and a round whose heading takes
 * focus when the round changes.
 */

const Players = () => {
    const [players, setPlayers] = useState(['Ann', 'Ben']);
    const focusNext = useFocusAfterDraw();
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

const root = document.getElementById('root');
if (root)
    createRoot(root).render(
        <main>
            <Players />
            <Round />
        </main>
    );
