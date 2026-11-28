import { deepActive } from '../src/focus.js';

/*
 * The page focus.spec.tsx draws to read focus as the kit's own reader gives it, from the source
 * rather than the package, since no entry of the package names the reader: what has focus, by its
 * id or its name, and the host of the document it sits in.
 */

(window as unknown as { readFocus: () => string | null }).readFocus = () => {
    const at = deepActive();
    return at ? `${at.id || at.localName}@${at.ownerDocument.location.host}` : null;
};
(window as unknown as { ready: boolean }).ready = true;
