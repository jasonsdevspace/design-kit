import { useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Button, StatusProvider, useBusy } from '../src/react.js';

/*
 * The page busy.spec.tsx draws with React: a save that takes a second, its button busy while it
 * runs, with a count of the saves made, and a save that ends just after the wait, past --dk-wait
 * but before its words could be put on the line, with every set of words the line says kept.
 */

const SaveButton = ({ label, words, takes }: { label: string; words: string; takes: number }) => {
    const [saving, setSaving] = useState(false);
    const [saves, setSaves] = useState(0);
    const busy = useBusy<HTMLButtonElement>();
    return (
        <>
            <Button
                ref={busy}
                busy={saving ? words : false}
                onClick={() => {
                    setSaving(true);
                    setSaves((count) => count + 1);
                    window.setTimeout(() => {
                        setSaving(false);
                    }, takes);
                }}
            >
                {label}
            </Button>
            {takes > 500 ? <p id="saves">{saves}</p> : null}
        </>
    );
};

const root = document.getElementById('root');
if (root)
    createRoot(root).render(
        <StatusProvider>
            <main>
                <SaveButton label="Save the round" words="Saving the round." takes={1000} />
                <SaveButton label="Save the scores" words="Saving the scores." takes={450} />
            </main>
        </StatusProvider>
    );
const page = window as unknown as { heard: string[] };
page.heard = [];
new MutationObserver(() => {
    const line = document.querySelector('#root > p[role="status"]');
    const words = line?.textContent ?? '';
    if (words !== '' && words !== page.heard.at(-1)) page.heard.push(words);
}).observe(document.body, { childList: true, characterData: true, subtree: true });
