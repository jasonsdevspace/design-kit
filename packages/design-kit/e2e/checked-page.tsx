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
 * as its field's id and its words, both lists of them. The root's `data-bid` names how the bid is
 * drawn: `required`, `blank` for one drawn with no value, `summary` for a form whose refusal moves
 * focus to a summary, which lists every failure with the words its field shows, `reset` for a
 * form with a reset button, `below` for a Save button below the bid, `clears` for a page that
 * clears its errors on a reset, `high` for a bid drawn at 99, past its range, and `taken` for a bid
 * drawn with an error of the page's own.
 */

type Handed = { handed?: string[]; shown?: string[] };

const root = document.getElementById('root');
const drawn = root?.dataset['bid'] ?? '';

const Join = () => {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [listed, setListed] = useState<readonly { key: string; href: string; words: string }[]>(
        []
    );
    const [count, setCount] = useState(0);
    const say = useStatus();
    const bid = useRef<HTMLDivElement>(null);
    const summary = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const stepper = bid.current?.querySelector<HTMLElement>('.dk-stepper');
        return stepper ? attachStepper(stepper, { say }) : undefined;
    }, [say]);
    const [form] = useFormRefusal<HTMLFormElement>({
        ...(drawn.includes('summary') ? { summary: () => summary.current } : {}),
        errorWords: {
            valueMissing: (control) => (control.id === 'name' ? 'Enter your name.' : ''),
        },
        invalid: (failures, shown) => {
            (window as Handed).handed = failures.map(({ field, words }) => `${field.id}: ${words}`);
            (window as Handed).shown = shown.map(({ field, words }) => `${field.id}: ${words}`);
            setErrors(Object.fromEntries(failures.map(({ field, words }) => [field.id, words])));
            if (drawn.includes('summary'))
                setListed(
                    shown.map(({ field, control, words }) => ({
                        key: field.id,
                        href: `#${control.id || field.id}`,
                        words,
                    }))
                );
        },
    });
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrors({});
        setListed([]);
        setCount(count + 1);
    };
    return (
        <form
            ref={form}
            onSubmit={submit}
            onReset={
                drawn.includes('clears')
                    ? () => {
                          setErrors({});
                          setListed([]);
                      }
                    : undefined
            }
        >
            <div ref={summary} id="summary" tabIndex={-1}>
                <p>There is a problem.</p>
                <ul>
                    {listed.map(({ key, href, words }) => (
                        <li key={key}>
                            <a href={href}>{words}</a>
                        </li>
                    ))}
                </ul>
            </div>
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
            {/* Above the bid, so an error drawn as focus leaves the bid never moves the button. */}
            <Button type="submit">Join</Button>
            <div ref={bid}>
                <StepperField
                    id="bid"
                    name="bid"
                    label="Bid"
                    min={0}
                    max={10}
                    defaultValue={
                        drawn.includes('blank') ? undefined : drawn.includes('high') ? 99 : 3
                    }
                    required={drawn.includes('required')}
                    error={
                        errors['bid'] ??
                        (drawn.includes('taken') ? 'That bid is taken.' : undefined)
                    }
                />
            </div>
            {drawn.includes('below') ? <Button type="submit">Save</Button> : null}
            {drawn.includes('reset') ? <Button type="reset">Clear</Button> : null}
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
