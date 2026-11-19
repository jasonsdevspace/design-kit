import { type ReactNode, useEffect, useId, useState } from 'react';

import { Button, Callout, useFocusAfterDraw } from '../src/react.js';

/**
 * How long a failure waits after the callout empties, so a failure that comes back at once is
 * still a change a screen reader hears.
 */
const SETTLE = 100;

type Loading = 'loading' | 'failed' | 'loaded';

/**
 * A part of the page that loads its products, says so when the load fails and offers Try again.
 * `load` is the same across renders, as a module's own function is, since the first load runs
 * again when it changes.
 */
export const Products = ({
    load,
    children,
}: {
    readonly load: () => Promise<void>;
    readonly children: ReactNode;
}) => {
    const [state, setState] = useState<Loading>('loading');
    const heading = useId();
    const focusNext = useFocusAfterDraw();
    const start = () => {
        setState('loading');
        load().then(
            () => {
                setState('loaded');
            },
            () => {
                window.setTimeout(() => {
                    setState('failed');
                }, SETTLE);
            }
        );
    };
    // The first load, whose failure is read where it is and moves no focus.
    useEffect(start, [load]);
    const tryAgain = () => {
        start();
        // Try again goes with the failure, so focus goes to what is loading again.
        focusNext(heading);
    };
    const failed = state === 'failed';
    return (
        <section aria-labelledby={heading}>
            <h2 id={heading} tabIndex={-1}>
                Products
            </h2>
            <Callout
                tone="danger"
                live="alert"
                title={failed ? 'The products could not be loaded' : undefined}
                actions={failed ? <Button onClick={tryAgain}>Try again</Button> : undefined}
            >
                {failed ? <p>Check your connection.</p> : null}
            </Callout>
            <div aria-busy={state === 'loading'}>
                {state === 'loading' ? <p className="dk-loading">Loading the products.</p> : null}
                {state === 'loaded' ? children : null}
            </div>
        </section>
    );
};
