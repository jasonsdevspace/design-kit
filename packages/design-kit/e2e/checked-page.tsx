import { type FormEvent, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { attachStepper } from '../src/controls.js';
import {
    Button,
    ChoiceField,
    InputField,
    StatusProvider,
    StepperField,
    useFormRefusal,
    useStatus,
} from '../src/react.js';

/*
 * The page checked.spec.tsx draws with React: a form whose required name the browser's constraints
 * check, with a set of choices, the failures drawn from the page's own state, keyed by each field's
 * id, with words of the page's own for an empty name, and a count of
 * the submits the page's handler took. A stepper for a bid, which speaks through the page's line,
 * is drawn with whatever error the page is handed for it, and the failures handed are kept, each
 * as its field's id and its words. The root's `data-bid` names how the bid is drawn: `required`,
 * `blank` for one drawn with no value, `error` for one the page draws an error of its own in,
 * `late` for one attached only once its button is pressed, and `summary` for a form whose refusal
 * moves focus to a summary. A button attaches the bid afresh, and one marked formnovalidate
 * submits unchecked.
 */

type Handed = { handed?: string[] };

const root = document.getElementById('root');
const drawn = root?.dataset['bid'] ?? '';

const Join = () => {
    const [errors, setErrors] = useState<Record<string, string>>(
        drawn.includes('error') ? { bid: 'Bids are closed.' } : {}
    );
    const [count, setCount] = useState(0);
    // The bid is attached afresh each time the round moves, and not at all before the first.
    const [round, setRound] = useState(drawn.includes('late') ? 0 : 1);
    const say = useStatus();
    const bid = useRef<HTMLDivElement>(null);
    const summary = useRef<HTMLParagraphElement>(null);
    useEffect(() => {
        const stepper = bid.current?.querySelector<HTMLElement>('.dk-stepper');
        return stepper && round > 0 ? attachStepper(stepper, { say }) : undefined;
    }, [say, round]);
    const [form] = useFormRefusal<HTMLFormElement>({
        ...(drawn.includes('summary') ? { summary: () => summary.current } : {}),
        errorWords: {
            valueMissing: (control) => (control.id === 'name' ? 'Enter your name.' : ''),
        },
        invalid: (failures) => {
            (window as Handed).handed = failures.map(({ field, words }) => `${field.id}: ${words}`);
            setErrors(Object.fromEntries(failures.map(({ field, words }) => [field.id, words])));
        },
    });
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrors({});
        setCount(count + 1);
    };
    return (
        <form ref={form} onSubmit={submit}>
            <p ref={summary} id="summary" tabIndex={-1}>
                There is a problem.
            </p>
            <InputField id="name" name="name" label="Name" required error={errors['name']} />
            <ChoiceField
                id="size"
                label="Size"
                name="size"
                choices={[
                    { value: 's', label: 'Small', required: true },
                    { value: 'l', label: 'Large' },
                ]}
                error={errors['size']}
            />
            <div ref={bid}>
                <StepperField
                    id="bid"
                    name="bid"
                    label="Bid"
                    min={0}
                    max={10}
                    defaultValue={drawn.includes('blank') ? undefined : 3}
                    required={drawn.includes('required')}
                    error={errors['bid']}
                />
            </div>
            <Button type="submit">Join</Button>
            <Button type="submit" formNoValidate>
                Save a draft
            </Button>
            <Button
                onClick={() => {
                    setRound(round + 1);
                }}
            >
                Attach the bid
            </Button>
            <p id="count">{count}</p>
        </form>
    );
};

if (root)
    createRoot(root).render(
        <StatusProvider>
            <Join />
        </StatusProvider>
    );
