import { useState } from 'react';
import { createRoot } from 'react-dom/client';

import { useRoving } from '../src/react.js';

/*
 * The page roving.spec.tsx draws with React: a row of tabs that chooses as focus moves, with its
 * options written inline on every render.
 */

const MODES = ['number', 'cards'] as const;

const Modes = () => {
    const [mode, setMode] = useState<(typeof MODES)[number]>('cards');
    const row = useRoving<HTMLDivElement>({
        onMove: (cell) => {
            const chosen = MODES.find((one) => cell.id === `mode-${one}`);
            if (chosen) setMode(chosen);
        },
    });
    return (
        <section>
            <div id="modes" className="dk-tabs" role="tablist" aria-label="Enter" ref={row}>
                {MODES.map((one) => (
                    <button
                        key={one}
                        id={`mode-${one}`}
                        type="button"
                        role="tab"
                        className="dk-tab"
                        aria-selected={mode === one}
                        aria-controls="panel"
                    >
                        {one}
                    </button>
                ))}
            </div>
            <p id="panel" role="tabpanel">
                {mode}
            </p>
        </section>
    );
};

const root = document.getElementById('root');
if (root) createRoot(root).render(<Modes />);
