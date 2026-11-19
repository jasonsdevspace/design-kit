import { useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Button, StatusProvider, useBusy } from '../src/react.js';

/*
 * The page busy.spec.tsx draws with React: a save that takes a second, its button busy while it
 * runs, and a count of the saves made.
 */

const Round = () => {
    const [saving, setSaving] = useState(false);
    const [saves, setSaves] = useState(0);
    const busy = useBusy<HTMLButtonElement>();
    const save = () => {
        setSaving(true);
        setSaves((count) => count + 1);
        window.setTimeout(() => {
            setSaving(false);
        }, 1000);
    };
    return (
        <main>
            <Button ref={busy} busy={saving ? 'Saving the round.' : false} onClick={save}>
                Save the round
            </Button>
            <p id="saves">{saves}</p>
        </main>
    );
};

const root = document.getElementById('root');
if (root)
    createRoot(root).render(
        <StatusProvider>
            <Round />
        </StatusProvider>
    );
