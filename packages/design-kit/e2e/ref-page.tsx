import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
    attachCopyButton,
    attachStepper,
    attachThemeSwitch,
    attachToast,
    type ShowToast,
} from '../src/controls.js';
import {
    Button,
    ChoiceField,
    CopyButton,
    CopyStatus,
    InputField,
    SelectField,
    StepperField,
    TextareaField,
    ThemeSwitch,
    Toast,
} from '../src/react.js';

/*
 * A page that opens a panel from the kit's button and, when the panel closes, moves focus back to
 * that button through its ref. The button is drawn again as the panel opens and closes, so the ref
 * has to hold the button across each drawing. Below it, a form that, once sent, draws each field
 * again with its error and a summary of what is wrong, which moves focus to each field through its
 * ref, a choice field's first control among them, and an off button whose handler would send the
 * form. Above the form, a theme switch, a copy button and its status line attached through the
 * refs they hand out, with no wrapper to find them by. Below the form, a stepper whose own error
 * the page's error comes and goes beside, and a toast whose class the page changes while it is
 * shown, each drawn again by React after it is attached. Bundled by ref.spec.ts, which writes it
 * into the browser.
 */
const Page = () => {
    const opener = useRef<HTMLButtonElement>(null);
    const name = useRef<HTMLInputElement>(null);
    const size = useRef<HTMLSelectElement>(null);
    const color = useRef<HTMLInputElement>(null);
    const note = useRef<HTMLTextAreaElement>(null);
    const group = useRef<HTMLDivElement>(null);
    const copy = useRef<HTMLButtonElement>(null);
    const status = useRef<HTMLParagraphElement>(null);
    const [open, setOpen] = useState(false);
    useEffect(() => (group.current ? attachThemeSwitch(group.current) : undefined), []);
    useEffect(() => {
        const button = copy.current;
        const line = status.current;
        const source = document.getElementById('code');
        return button && line && source
            ? attachCopyButton(button, { source: () => source, status: line })
            : undefined;
    }, []);
    const [sent, setSent] = useState(false);
    const bid = useRef<HTMLInputElement>(null);
    const toast = useRef<HTMLDivElement>(null);
    const show = useRef<ShowToast>(undefined);
    const [taken, setTaken] = useState(false);
    const [loud, setLoud] = useState(false);
    useEffect(() => (bid.current ? attachStepper(bid.current) : undefined), []);
    useEffect(() => {
        if (toast.current) show.current = attachToast(toast.current);
    }, []);
    return (
        <main>
            <ThemeSwitch ref={group} className="page-switch" />
            <pre id="code">npm install @jasonsdevspace/design-kit</pre>
            <CopyButton ref={copy} name="install command" className="page-copy" />
            <CopyStatus ref={status} className="page-status" />
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
                        <li>
                            <Button onClick={() => note.current?.focus()}>Go to the note</Button>
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
                <TextareaField ref={note} label="Note" error={sent && 'Write a note'} />
                <Button
                    onClick={() => {
                        setSent(true);
                    }}
                >
                    Send
                </Button>
                <Button
                    off
                    onClick={() => {
                        setSent(true);
                    }}
                >
                    Post later
                </Button>
            </form>
            <StepperField
                ref={bid}
                id="bid"
                label="Ana's bid"
                min={0}
                max={10}
                defaultValue={5}
                error={taken && 'Ben has bid that already'}
            />
            <Button
                onClick={() => {
                    setTaken(!taken);
                }}
            >
                Check the bid
            </Button>
            <Toast ref={toast} className={loud ? 'page-toast page-toast-loud' : 'page-toast'} />
            <Button
                onClick={() => {
                    show.current?.('Round saved.');
                }}
            >
                Save the round
            </Button>
            <Button
                onClick={() => {
                    setLoud(!loud);
                }}
            >
                Restyle the toast
            </Button>
        </main>
    );
};

const root = document.getElementById('root');
if (root) createRoot(root).render(<Page />);
