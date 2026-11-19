import { createRoot } from 'react-dom/client';

import { Games } from '../examples/games.js';
import { StatusProvider } from '../src/react.js';

/*
 * The page empty.spec.tsx draws with React: the reference's saved games under a status line, with
 * every set of words the line says kept.
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

const page = window as unknown as { heard: string[] };
page.heard = [];
new MutationObserver(() => {
    const words = document.querySelector('p[role="status"]')?.textContent ?? '';
    if (words !== '' && words !== page.heard.at(-1)) page.heard.push(words);
}).observe(document.body, { childList: true, characterData: true, subtree: true });
