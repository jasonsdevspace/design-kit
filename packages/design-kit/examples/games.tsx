import { useId, useState } from 'react';

import { Button, InputField, useFocusAfterDraw, useStatus } from '../src/react.js';

const GAMES = ['Flip 7', 'Skyjo', 'Wizard'] as const;

/** The games whose names hold the search, matched whatever the case. */
const matching = (search: string) =>
    GAMES.filter((game) => game.toLowerCase().includes(search.trim().toLowerCase()));

/** What the status line says once a visitor stops typing. */
const counted = (found: number) =>
    found === 0
        ? 'No games match the search.'
        : `${String(found)} ${found === 1 ? 'game matches' : 'games match'}.`;

/**
 * Saved games narrowed by a search, under a `StatusProvider`. A search that matches nothing puts the
 * empty state in the list's place, with a way to clear the search.
 */
export const Games = () => {
    const [search, setSearch] = useState('');
    const field = useId();
    const say = useStatus();
    const focusNext = useFocusAfterDraw();
    const shown = matching(search);
    const clear = () => {
        setSearch('');
        say(counted(GAMES.length));
        // The empty state and its button go, so focus goes back to the search.
        focusNext(field);
    };
    return (
        <section className="dk-stack dk-stack-heading" aria-labelledby={`${field}-heading`}>
            <h2 id={`${field}-heading`}>Saved games</h2>
            <InputField
                id={field}
                label="Search the games"
                type="search"
                value={search}
                onChange={(event) => {
                    setSearch(event.target.value);
                    say(counted(matching(event.target.value).length), { settle: 700 });
                }}
            />
            {shown.length > 0 ? (
                <ul className="dk-rows" role="list">
                    {shown.map((game) => (
                        <li key={game}>
                            <a className="dk-row" href={`#${game.toLowerCase().replace(' ', '-')}`}>
                                <span className="dk-row-text">
                                    <span className="dk-row-title">{game}</span>
                                </span>
                                <span className="dk-row-sign" aria-hidden="true">
                                    ›
                                </span>
                            </a>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="dk-empty">
                    <p>No games match the search.</p>
                    <Button onClick={clear}>Clear the search</Button>
                </div>
            )}
        </section>
    );
};
