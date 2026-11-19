import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Button, Callout, useFocusAfterDraw } from '../src/react.js';

/*
 * The page try-again.spec.tsx draws with React: the reference's products, whose load the test
 * ends, failing or not, through the page, with every message the alert is given kept, once for
 * each time it is filled from empty.
 */

type Load = { readonly resolve: () => void; readonly reject: () => void };
type Page = { loads: number; pending?: Load; heard: string[] };
const page = window as unknown as Page;
page.loads = 0;
page.heard = [];

const load = () =>
    new Promise<void>((resolve, reject) => {
        page.loads += 1;
        page.pending = { resolve, reject };
    });

const Products = () => {
    const [failed, setFailed] = useState(false);
    const focusNext = useFocusAfterDraw();
    // The first load, whose failure is said where it is and moves no focus.
    useEffect(() => {
        load().catch(() => {
            setFailed(true);
        });
    }, []);
    const tryAgain = () => {
        setFailed(false);
        focusNext('products');
        load().catch(() => {
            setFailed(true);
            focusNext('products-failed');
        });
    };
    return (
        <section aria-labelledby="products">
            <h2 id="products" tabIndex={-1}>
                Products
            </h2>
            <Callout
                id="products-failed"
                tabIndex={-1}
                tone="danger"
                live="alert"
                title={failed ? 'The products could not be loaded' : undefined}
                actions={failed ? <Button onClick={tryAgain}>Try again</Button> : undefined}
            >
                {failed ? <p>Check your connection.</p> : null}
            </Callout>
        </section>
    );
};

const root = document.getElementById('root');
if (root) createRoot(root).render(<Products />);

let last = '';
new MutationObserver(() => {
    const words = document.querySelector('[role="alert"]')?.textContent ?? '';
    if (words !== '' && last === '') page.heard.push(words);
    last = words;
}).observe(document.body, { childList: true, characterData: true, subtree: true });
