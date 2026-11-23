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
 * `blank` for one drawn with no value, or both.
 */

type Handed = { handed?: string[] };

const root = document.getElementById('root');
const drawn = root?.dataset['bid'] ?? '';

const Join = () => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [count, setCount] = useState(0);
    const say = useStatus();
    const bid = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const stepper = bid.current?.querySelector<HTMLElement>('.dk-stepper');
        return stepper ? attachStepper(stepper, { say }) : undefined;
    }, [say]);
    const [form] = useFormRefusal<HTMLFormElement>({
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
