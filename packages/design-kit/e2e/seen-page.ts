import { focusFirst, isBlank, seen } from '../src/focus.js';

/*
 * The focus module's one view, put on the window for a spec to read as a pure function, from the
 * source rather than the package, so the package exports nothing more for it.
 */
Object.assign(window, { model: { focusFirst, isBlank, seen } });
