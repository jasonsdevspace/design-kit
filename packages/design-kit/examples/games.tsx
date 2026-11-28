import { useId, useState } from 'react';

import { Button, InputField, useFocusAfterDraw, useStatus } from '../src/react.js';

const GAMES = ['Flip 7', 'Skyjo', 'Wizard'] as const;

/** The games whose names hold the search, matched whatever the case. */
const matching = (search: string) =>
    GAMES.filter((game) => game.toLowerCase().includes(search.trim().toLowerCase()));

/** What the empty state and the status line say when the search matches nothing. */
const noMatch = (search: string) => `No games match “${search.trim()}”.`;

/** How long the search's words wait, in milliseconds, for a visitor to stop typing. */
export const SEARCH_SETTLE = 700;

/** What the status line says once a visitor stops typing. */
const counted = (search: string) => {
    const found = matching(search).length;
    if (found === 0) return noMatch(search);
    return `${String(found)} ${found === 1 ? 'game matches' : 'games match'}.`;
};

/**
 * Saved games narrowed by a search, under a `StatusProvider`. A search that matches nothing puts
 * the empty state in the list's place, with a way to clear the search.
 */
export const Games = () => {
    const [search, setSearch] = useState('');
    const field = useId();
    const say = useStatus();
    const focusNext = useFocusAfterDraw();
    const shown = matching(search);
    const clear = () => {
        setSearch('');
        say(`Search cleared, ${String(GAMES.length)} games.`);
        // The empty state and the button pressed go, so focus goes back to the search.
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
                    say(counted(event.target.value), { settle: SEARCH_SETTLE });
                }}
            />
            {shown.length > 0 ? (
                <ul className="dk-rows" role="list">
                    {shown.map((game) => (
                        <li key={game}>
                            <a
                                className="dk-row"
                                href={`/games/${game.toLowerCase().replaceAll(/\s+/g, '-')}/`}
                            >
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
                    <p>{noMatch(search)}</p>
                    <Button onClick={clear}>Clear the search</Button>
                </div>
            )}
        </section>
    );
};
