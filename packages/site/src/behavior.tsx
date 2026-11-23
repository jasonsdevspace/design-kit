import * as kit from 'design-kit-release/react';
import type { ReactElement } from 'react';

/*
 * The behavior page's examples: what each draws, as a page writes it, and the React a page writes
 * for it. The site's script makes each work as a page's own script would, and shows under each what
 * it says on its status line. Nothing in them acts or speaks until a visitor presses or types.
 */

export interface Behavior {
    /** The example's name, its section's heading and the key its markup is found by. */
    readonly name: string;
    /**
     * Draws the example. `live` is set for the copy the page shows, where a button that does
     * nothing until the script attaches it waits hidden, and left unset for the markup shown under
     * it, which is what a page writes.
     */
    readonly draw: (live: boolean) => ReactElement;
    /** The React a page writes for it, a whole module a reader can copy. */
    readonly react: string;
}

/**
 * The entry a page imports the components and hooks from, as the React shown names it. It is
 * text the page shows, while the site itself reaches the kit only through its pinned alias.
 */
const REACT = ['@jasonsdevspace/design-kit', 'react'].join('/');

/** The status line each example speaks on, out of sight as the kit draws it. */
const Line = () => <kit.StatusLine className="screen-status" />;

/** The players the list of players starts with, each with an id of its own. */
export const PLAYERS = ['Ann', 'Ben', 'Cy', 'Dee'] as const;

/** The cards the grid holds, those that start chosen, and the one that is off. */
export const CARDS = [3, 4, 5, 6, 7, 8, 9, 10] as const;
const CHOSEN: ReadonlySet<number> = new Set([7, 9]);
const OFF = 10;

/** The product the part of the page that loads shows once it has loaded. */
export const PRODUCT = 'Trail shoes, size 9, $84.';

export const BEHAVIORS = [
    {
        name: 'A refused form',
        draw: () => (
            <>
                <form id="rule-form" className="dk-stack">
                    <kit.InputField id="rule-name" name="name" label="Rule name" required />
                    <kit.InputField
                        id="rule-email"
                        name="email"
                        type="email"
                        label="Email for alerts"
                        hint="Where the alert is sent"
                        required
                    />
                    <kit.Button type="submit" accent>
                        Save rule
                    </kit.Button>
                </form>
                <Line />
            </>
        ),
        react: `import { type FormEvent, useState } from 'react';

import {
    Button,
    InputField,
    StatusProvider,
    useFormRefusal,
    useStatus,
} from '${REACT}';

const Rule = () => {
    const say = useStatus();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [form] = useFormRefusal<HTMLFormElement>({
        invalid: (failures) => {
            setErrors(Object.fromEntries(failures.map(({ field, words }) => [field.id, words])));
        },
    });
    // Only a submit whose fields pass the browser's constraints reaches the page.
    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrors({});
        say('The rule was saved.');
    };
    return (
        <form ref={form} className="dk-stack" onSubmit={submit}>
            <InputField
                id="rule-name"
                name="name"
                label="Rule name"
                required
                error={errors['rule-name']}
            />
            <InputField
                id="rule-email"
                name="email"
                type="email"
                label="Email for alerts"
                hint="Where the alert is sent"
                required
                error={errors['rule-email']}
            />
            <Button type="submit" accent>
                Save rule
            </Button>
        </form>
    );
};

export const RuleScreen = () => (
    <StatusProvider>
        <Rule />
    </StatusProvider>
);
`,
    },
    {
        name: 'A busy button',
        draw: (live) => (
            <>
                <p>
                    <kit.Button accent id="save-round" hidden={live}>
                        Save the round
                    </kit.Button>
                </p>
                <Line />
            </>
        ),
        react: `import { useState } from 'react';

import { Button, StatusProvider, useBusy, useStatus } from '${REACT}';

/** The save, which takes as long as it takes. */
const saveRound = () => new Promise((done) => setTimeout(done, 3000));

const SaveRound = () => {
    const say = useStatus();
    const busy = useBusy<HTMLButtonElement>();
    const [saving, setSaving] = useState(false);
    const save = () => {
        setSaving(true);
        void saveRound().then(() => {
            setSaving(false);
            say('The round was saved.');
        });
    };
    return (
        <Button ref={busy} accent busy={saving ? 'Saving the round.' : false} onClick={save}>
            Save the round
        </Button>
    );
};

export const RoundScreen = () => (
    <StatusProvider>
        <SaveRound />
    </StatusProvider>
);
`,
    },
    {
        name: 'Arrow keys through a grid',
        draw: () => (
            <>
                <div
                    className="dk-button-grid site-hand"
                    role="group"
                    aria-label="Cards in hand"
                    id="hand"
                >
                    {CARDS.map((card) => (
                        <kit.Button key={card} pressed={CHOSEN.has(card)} off={card === OFF}>
                            {String(card)}
                        </kit.Button>
                    ))}
                </div>
                <Line />
            </>
        ),
        react: `import { useState } from 'react';

import { Button, StatusProvider, useRoving, useStatus } from '${REACT}';

const CARDS = [3, 4, 5, 6, 7, 8, 9, 10];

/** How many cards are chosen, in words. */
const chosenWords = (count: number) =>
    count === 1 ? '1 card chosen.' : \`\${String(count)} cards chosen.\`;

const Hand = () => {
    const say = useStatus();
    const grid = useRoving<HTMLDivElement>();
    const [chosen, setChosen] = useState<readonly number[]>([7, 9]);
    const flip = (card: number) => {
        const next = chosen.includes(card)
            ? chosen.filter((each) => each !== card)
            : [...chosen, card];
        setChosen(next);
        // The count changes with each press, so it waits for the presses to stop.
        say(chosenWords(next.length), { settle: 700 });
    };
    return (
        <div ref={grid} className="dk-button-grid site-hand" role="group" aria-label="Cards in hand">
            {CARDS.map((card) => (
                <Button
                    key={card}
                    pressed={chosen.includes(card)}
                    off={card === 10}
                    onClick={() => {
                        flip(card);
                    }}
                >
                    {String(card)}
                </Button>
            ))}
        </div>
    );
};

export const HandScreen = () => (
    <StatusProvider>
        <Hand />
    </StatusProvider>
);
`,
    },
    {
        name: 'Focus moved after a change',
        draw: (live) => (
            <>
                <div className="dk-stack dk-stack-heading">
                    <h3 id="players-heading" tabIndex={-1}>
                        Players
                    </h3>
                    <ul className="dk-rows" role="list" id="players">
                        {PLAYERS.map((player) => (
                            <li key={player}>
                                <div className="dk-row">
                                    <span className="dk-row-text">
                                        <span className="dk-row-title">{player}</span>
                                    </span>
                                    <button
                                        type="button"
                                        className="dk-button dk-button-text"
                                        id={`remove-${player.toLowerCase()}`}
                                        hidden={live}
                                    >
                                        Remove
                                        <span className="dk-visually-hidden"> {player}</span>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <Line />
            </>
        ),
        react: `import { useState } from 'react';

import {
    StatusProvider,
    useFocusAfterDraw,
    useStatus,
} from '${REACT}';

const Players = () => {
    const say = useStatus();
    const focusNext = useFocusAfterDraw();
    const [players, setPlayers] = useState(['Ann', 'Ben', 'Cy', 'Dee']);
    const remove = (index: number) => {
        const next = players[index + 1] ?? players[index - 1];
        setPlayers(players.filter((_, at) => at !== index));
        // The button that had focus goes with its row, so focus goes to the next row's button, or
        // the list's heading once no row is left.
        focusNext(next === undefined ? 'players-heading' : \`remove-\${next.toLowerCase()}\`, {
            fallbacks: ['players-heading'],
        });
        say(\`\${players[index] ?? ''} was removed.\`);
    };
    return (
        <div className="dk-stack dk-stack-heading">
            <h3 id="players-heading" tabIndex={-1}>
                Players
            </h3>
            <ul className="dk-rows" role="list">
                {players.map((player, index) => (
                    <li key={player}>
                        <div className="dk-row">
                            <span className="dk-row-text">
                                <span className="dk-row-title">{player}</span>
                            </span>
                            <button
                                type="button"
                                className="dk-button dk-button-text"
                                id={\`remove-\${player.toLowerCase()}\`}
                                onClick={() => {
                                    remove(index);
                                }}
                            >
                                Remove
                                <span className="dk-visually-hidden"> {player}</span>
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export const PlayersScreen = () => (
    <StatusProvider>
        <Players />
    </StatusProvider>
);
`,
    },
    {
        name: 'A part of the page that loads, and a failure',
        draw: (live) => (
            <>
                <article className="dk-stack dk-stack-heading" aria-labelledby="product-heading">
                    <h3 id="product-heading" tabIndex={-1}>
                        Product
                    </h3>
                    <kit.Callout tone="danger" live="alert" id="product-failure" />
                    <div id="product">
                        <p>{PRODUCT}</p>
                    </div>
                    <div className="dk-actions">
                        <kit.Button id="product-load" hidden={live}>
                            Load again
                        </kit.Button>
                        {live ? (
                            <kit.Button id="product-fail" hidden>
                                Show the failure
                            </kit.Button>
                        ) : null}
                    </div>
                </article>
                <Line />
            </>
        ),
        react: `import { useRef, useState } from 'react';

import {
    Button,
    Callout,
    StatusProvider,
    useFocusAfterDraw,
    useStatus,
} from '${REACT}';

/**
 * How long a failure waits after the callout empties, so a failure that comes back at once is
 * still a change a screen reader hears.
 */
const SETTLE = 100;

type Loading = 'loading' | 'failed' | 'loaded';

const Product = ({ load }: { readonly load: () => Promise<string> }) => {
    const say = useStatus();
    const focusNext = useFocusAfterDraw();
    const [state, setState] = useState<Loading>('loaded');
    const [product, setProduct] = useState('Trail shoes, size 9, $84.');
    const loading = useRef(false);
    const start = () => {
        loading.current = true;
        setState('loading');
        // Said once the wait outlasts --dk-wait, 400ms, and dropped where the load ends first.
        say(() => (loading.current ? 'Loading the product.' : null), { settle: 400 });
        load().then(
            (loaded) => {
                loading.current = false;
                setProduct(loaded);
                setState('loaded');
                say('Product loaded.');
            },
            () => {
                loading.current = false;
                window.setTimeout(() => {
                    setState('failed');
                }, SETTLE);
            }
        );
    };
    const tryAgain = () => {
        start();
        // Try again goes with the failure, so focus goes to what is loading again.
        focusNext('product-heading');
    };
    const failed = state === 'failed';
    return (
        <article className="dk-stack dk-stack-heading" aria-labelledby="product-heading">
            <h3 id="product-heading" tabIndex={-1}>
                Product
            </h3>
            <Callout
                tone="danger"
                live="alert"
                title={failed ? 'The product could not be loaded' : undefined}
                headingLevel={4}
                actions={failed ? <Button onClick={tryAgain}>Try again</Button> : undefined}
            >
                {failed ? <p>Check your connection.</p> : null}
            </Callout>
            <div aria-busy={state === 'loading'}>
                {state === 'loading' ? <p className="dk-loading">Loading the product.</p> : null}
                {state === 'loaded' ? <p>{product}</p> : null}
            </div>
            <div className="dk-actions">
                <Button onClick={start}>Load again</Button>
            </div>
        </article>
    );
};

export const ProductScreen = ({ load }: { readonly load: () => Promise<string> }) => (
    <StatusProvider>
        <Product load={load} />
    </StatusProvider>
);
`,
    },
] as const satisfies readonly Behavior[];

/** The key a behavior's markup is found by, apart from every state's. */
export const behaviorKey = (behavior: Behavior) => `Behavior / ${behavior.name}`;
