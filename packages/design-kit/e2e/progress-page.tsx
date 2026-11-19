import { useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Importing } from '../examples/importing.js';
import { StatusProvider } from '../src/react.js';

/*
 * The page progress.spec.tsx draws with React: the reference's import under a status line, moved on
 * by the page, with every set of words the line says kept.
 */

type Page = { heard: string[]; setDone?: (done: number) => void };
const page = window as unknown as Page;
page.heard = [];

const Screen = () => {
    const [done, setDone] = useState(0);
    page.setDone = setDone;
    return (
        <StatusProvider>
            <main>
                <h1>Import</h1>
                <Importing done={done} total={40} />
            </main>
        </StatusProvider>
    );
};

const root = document.getElementById('root');
if (root) createRoot(root).render(<Screen />);

new MutationObserver(() => {
    const words = document.querySelector('p[role="status"]')?.textContent ?? '';
    if (words !== '' && words !== page.heard.at(-1)) page.heard.push(words);
}).observe(document.body, { childList: true, characterData: true, subtree: true });
