import { createRoot } from 'react-dom/client';

import { Products } from '../examples/products.js';

/*
 * The page try-again.spec.tsx draws with React: the reference's products, whose every load the
 * test ends, failing or not, through the page, with each change of the alert's words kept with the
 * time it came.
 */

type Load = { readonly resolve: () => void; readonly reject: () => void };
type Page = { loads: number; pending?: Load; said: { words: string; at: number }[] };
const page = window as unknown as Page;
page.loads = 0;
page.said = [];

const load = () =>
    new Promise<void>((resolve, reject) => {
        page.loads += 1;
        page.pending = { resolve, reject };
    });

const root = document.getElementById('root');
if (root)
    createRoot(root).render(
        <Products load={load}>
            <ul id="list">
                <li>Tea</li>
            </ul>
        </Products>
    );

new MutationObserver(() => {
    const words = document.querySelector('[role="alert"]')?.textContent ?? '';
    if (words !== (page.said.at(-1)?.words ?? '')) page.said.push({ words, at: performance.now() });
}).observe(document.body, { childList: true, characterData: true, subtree: true });
