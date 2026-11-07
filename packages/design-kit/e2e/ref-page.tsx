import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Button, InputField, SelectField } from '../src/react.js';

/*
 * A page that opens a panel from the kit's button and, when the panel closes, moves focus back to
 * that button through its ref. The button is drawn again as the panel opens and closes, so the ref
 * has to hold the button across each drawing. Below it, a form whose summary of what is wrong
 * moves focus to each field through its ref. Bundled by ref.spec.ts, which writes it into the
 * browser.
 */
const Page = () => {
    const opener = useRef<HTMLButtonElement>(null);
    const name = useRef<HTMLInputElement>(null);
    const size = useRef<HTMLSelectElement>(null);
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
            <form aria-label="Order">
                <ul aria-label="What is wrong">
                    <li>
                        <Button onClick={() => name.current?.focus()}>Go to the name</Button>
                    </li>
                    <li>
                        <Button onClick={() => size.current?.focus()}>Go to the size</Button>
                    </li>
                </ul>
                <InputField ref={name} label="Name" error="Enter a name" />
                <SelectField ref={size} label="Size" error="Choose a size">
                    <option value="">Choose</option>
                    <option value="s">Small</option>
                </SelectField>
            </form>
        </main>
    );
};

const root = document.getElementById('root');
if (root) createRoot(root).render(<Page />);
