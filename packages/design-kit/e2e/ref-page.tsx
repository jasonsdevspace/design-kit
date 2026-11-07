import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Button } from '../src/react.js';

/*
 * A page that opens a panel from the kit's button and, when the panel closes, moves focus back to
 * that button through its ref. The button is drawn again as the panel opens and closes, so the ref
 * has to hold the button across each drawing. Bundled by ref.spec.ts, which writes it into the
 * browser.
 */
const Page = () => {
    const opener = useRef<HTMLButtonElement>(null);
    const [open, setOpen] = useState(false);
    return (
        <main>
            <Button
                ref={opener}
                aria-expanded={open}
                aria-controls="tour"
                onClick={() => {
                    setOpen(!open);
                }}
            >
                Tour
            </Button>
            <section id="tour" aria-label="Tour" hidden={!open}>
                <Button
                    onClick={() => {
                        setOpen(false);
                        opener.current?.focus();
                    }}
                >
                    Close
                </Button>
            </section>
        </main>
    );
};

const root = document.getElementById('root');
if (root) createRoot(root).render(<Page />);
