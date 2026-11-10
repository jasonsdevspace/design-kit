import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Button, ChoiceField, InputField, SelectField } from '../src/react.js';

/*
 * A page that opens a panel from the kit's button and, when the panel closes, moves focus back to
 * that button through its ref. The button is drawn again as the panel opens and closes, so the ref
 * has to hold the button across each drawing. Below it, a form that, once sent, draws each field
 * again with its error and a summary of what is wrong, which moves focus to each field through its
 * ref, a choice field's first control among them. Bundled by ref.spec.ts, which writes it into the
 * browser.
 */
const Page = () => {
    const opener = useRef<HTMLButtonElement>(null);
    const name = useRef<HTMLInputElement>(null);
    const size = useRef<HTMLSelectElement>(null);
    const color = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(false);
    const [sent, setSent] = useState(false);
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
                {sent ? (
                    <ul aria-label="What is wrong">
                        <li>
                            <Button onClick={() => name.current?.focus()}>Go to the name</Button>
                        </li>
                        <li>
                            <Button onClick={() => size.current?.focus()}>Go to the size</Button>
                        </li>
                        <li>
                            <Button onClick={() => color.current?.focus()}>Go to the color</Button>
                        </li>
                    </ul>
                ) : null}
                <InputField ref={name} label="Name" error={sent && 'Enter a name'} />
                <SelectField ref={size} label="Size" error={sent && 'Choose a size'}>
                    <option value="">Choose</option>
                    <option value="s">Small</option>
                </SelectField>
                <ChoiceField
                    label="Color"
                    name="color"
                    error={sent && 'Choose a color'}
                    choices={[
                        { value: 'red', label: 'Red', ref: color },
                        { value: 'blue', label: 'Blue' },
                    ]}
                />
                <Button
                    onClick={() => {
                        setSent(true);
                    }}
                >
                    Send
                </Button>
            </form>
        </main>
    );
};

const root = document.getElementById('root');
if (root) createRoot(root).render(<Page />);
