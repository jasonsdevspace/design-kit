import { createRoot } from 'react-dom/client';

import { Games } from '../examples/games.js';
import { StatusProvider } from '../src/react.js';

/*
 * The page empty.spec.tsx draws with React: the reference's saved games under a status line, which
 * the spec hears through `hearing`.
 */

const root = document.getElementById('root');
if (root)
    createRoot(root).render(
        <StatusProvider>
            <main className="dk-page">
                <h1>Games</h1>
                <Games />
            </main>
        </StatusProvider>
    );
