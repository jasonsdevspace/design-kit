import { useRef } from 'react';
import { createRoot } from 'react-dom/client';

import { Button } from '../src/react.js';

/*
 * A page that moves focus to the kit's button through its ref, as a page does when a panel closes
 * and focus goes back to the button that opened it. Bundled and served by ref.spec.ts.
 */
const Page = () => {
    const opener = useRef<HTMLButtonElement>(null);
    return (
        <main>
            <Button ref={opener} aria-expanded={false}>
                Tour
            </Button>
            <Button onClick={() => opener.current?.focus()}>Close</Button>
        </main>
    );
};

const root = document.getElementById('root');
if (root) createRoot(root).render(<Page />);
