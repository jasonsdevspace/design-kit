import { useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Importing } from '../examples/importing.js';
import { StatusProvider } from '../src/react.js';

/*
 * The page progress.spec.tsx draws with React: the reference's import under a status line, moved on
 * by the page. The spec hears the line through `hearing`.
 */

type Page = { setDone?: (done: number) => void };
const page = window as unknown as Page;

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
