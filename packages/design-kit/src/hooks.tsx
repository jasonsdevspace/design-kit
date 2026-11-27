'use client';

/*
 * The kit's React hooks, each a thin wrapper over a function from `./controls`, as record 20 has
 * it: one over an attach attaches through a ref and keeps only the attach's handle, one over a
 * function that acts once keeps only what calls it off, and each returns what the function returns,
 * the same across renders. `./react` exports them beside the markup, whose components run
 * no effect. Each ref makes an `AbortController` as its element arrives, hands its attach the
 * signal, as record 22 has every attach take, and returns the cleanup that aborts it, which React
 * 19 calls as the element leaves in place of calling the ref with null. The kit takes the control
 * down a microtask after the last signal holding it aborts, as record 23 has it, so a ref made
 * afresh on every render, a ref that merges two hooks and React's second run in development keep
 * it, and two hooks on one element each hold it.
 */

/*
 * Each hook, or the few of one kind, is a module of its own, which this one gathers, so a site's
 * bundler sends a page only the hooks it imports and the pieces they attach, even where another
 * page of the site imports the rest.
 */

export { useBusy } from './busy-hook.js';
export {
    type ArrivalKey,
    type FocusAfterDraw,
    useArrivalFocus,
    useFocusAfterDraw,
} from './focus-hooks.js';
export { useFormRefusal } from './form-hook.js';
export { useProgress } from './progress-hook.js';
export { useRoving } from './roving-hook.js';
export { StatusProvider, type StatusProviderProps, useStatus } from './status-hooks.js';
