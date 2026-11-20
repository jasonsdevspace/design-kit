# 22. Every attach takes a signal that takes its piece down

**Status:** accepted, in 0.9.3

## Context

The kit's attach functions take a piece down in different ways or not at all. Most return a detach,
the status line's returns what says a message and is let go only by `StatusProvider`, the toast's
returns what shows a message and has no way to be let go, and the form's returns what refuses it and
keeps its listeners for good. An audit found pieces that keep running after a page takes them away:
a toast's resize listener and observer, a theme switch's document listener, a form's reset timer, a
focus request made after its component has gone, and panels that follow two rules once an opener
leaves. Each attach that does return a detach keeps its own flag against a second call, its own
list of what to take off and its own check that a late answer finds it still attached, so no two do
it the same way. A rule for taking a piece down has to be written once, before each piece is moved
onto it, or each will settle it differently.

## Research

- **The DOM takes a signal.** `addEventListener` takes an `AbortSignal` as `signal`, and its
  algorithm returns at once when that signal is already aborted, so a listener given one adds
  nothing. Aborting the signal takes the listener off, as `removeEventListener` would. The DOM
  standard asks an API that takes a signal to react to an abort as its own cancel, and lets one that
  returns no promise leave the abort's reason unsaid.
- **React 19 hands a ref its cleanup.** A ref callback may return a cleanup, which React calls when
  the element leaves, in place of calling the ref again with null, which React plans to deprecate. A
  hook can make an `AbortController` in its ref and return what aborts it, so the attach's signal is
  the one teardown path a React page and a page without React share.
- **Libraries keep teardown complete, safe to repeat and quiet afterward.** Floating UI's
  `autoUpdate` returns one cleanup that stops every listener and observer it started. Tippy's
  `destroy` returns at once on an instance already destroyed, and its `show` does nothing on one,
  with a warning only in its development build. focus-trap's `deactivate` returns at once on a trap
  not active, and `activate` on one already active. Headless UI keeps each component's listeners,
  frames, timers and microtasks in one collection and disposes of them together.
- **`Symbol.dispose` is not in a stable Safari.** MDN's compatibility data has it in Chrome 125 and
  Firefox 141, and in Safari 27.3, which was in beta on 2026-11-20, with 27.2 the current release.
  The kit's floor is Safari 17.5.

## Options

**A. A release function exported for each piece,** as `releaseStatus` was. Rejected, since a page
would hold a second function for each piece and have to know which one each needs, and a React hook
would need another path again.

**B. `Symbol.dispose` on what an attach returns.** Rejected for now. It has no stable Safari, and it
fits only the attaches that return a detach, while the status line, the toast, the dialog and the
form return what acts.

**C. One handle with a `detach` from every attach.** Rejected, since every page that calls an attach
would change, which is a breaking release, and the kit stays on 0.9.x.

**D. A signal, and calls after teardown that throw or warn.** Rejected. The DOM and the libraries
above do nothing on a call after teardown, and the kit has no development build to warn in, so a
warning would reach every visitor's console.

**E. A `signal` option on every attach, with calls after teardown doing nothing.** Each attach takes
`{ signal }` beside what it takes now, as `addEventListener` does, and keeps the rules below.

## Decision

Option E.

- **Every attach takes `{ signal }`,** an `AbortSignal` in its options, or in an options argument
  added after the element where it takes none. What it returns is unchanged.
- **A signal already aborted attaches nothing.** The piece is left as the markup drew it, hidden
  where it starts hidden, with no listener, observer, timer or frame of the kit's, and nothing kept
  for it, so a later attach starts afresh. What the attach returns does nothing.
- **Aborting is the same as detach.** Everything the attach set up comes off: its listeners,
  observers, timers and frames, a listener on the document it added, and what it drew or showed,
  as its detach would. An attach that returns what acts rather than a detach is taken down by its
  signal alone.
- **Detach is complete and safe to call twice.** The teardown runs once, whichever comes first,
  the abort or the detach, and a detach called again, even after the same element was attached
  anew, leaves that newer attach alone.
- **Calls after teardown do nothing, silently.** What an attach returned, such as a status line's
  `say` or a toast's show, does nothing once its piece is taken down, as do a timer or an answer
  that comes late, such as the clipboard's. Nothing throws and nothing warns.
- **The first attach owns the piece's lifetime.** Attaching a piece again before it is taken down
  is the call record 13 describes: it returns the first attach's handle, takes any new options, and
  leaves its own signal unheard, aborted or not. So one part of a page cannot take down a piece
  another part attached, and the piece is attached again only once its first attach is taken down.
- **A focus request still lands when its component unmounts in the moment it asks,** so a row that
  asks for focus on the next one as it is deleted moves focus there, as record 20 already has a
  request made after unmount.
- **`Symbol.dispose` waits for a stable Safari** and for the kit's floor to reach it, and then
  only on the attaches that return a detach.
- **Return shapes stay as they are,** so the signal is added beside what each attach takes now, and
  the contract ships as a patch, in 0.9.3.

One internal helper keeps the contract, `teardown` in `src/teardown.ts`, which no entry exports.
Given the page's signal, it gives null where that signal is already aborted, so the attach returns
at once, and otherwise a signal of its own that every listener of the attach takes, `add` for what a
signal cannot take off, as an observer's disconnect, a timer's clear or a frame's cancel, and `stop`,
which the attach returns as its detach. `stop` aborts its own signal and runs what `add` kept, once,
and the page's signal calls it on abort. The listener on the page's signal comes off with the
teardown, so a signal a page keeps for longer holds nothing of a piece already taken down. A late
answer reads the attach's own signal and does nothing once it is aborted. The attach keeps its own
map of attached elements, as record 13 has it, and looks there before it makes a teardown, so a call
that returns the first handle makes none.

## Consequences

- A page takes down any piece the same way, whatever its attach returns, and a page that attaches
  many pieces for one screen aborts one controller as the screen goes.
- The flags, lists and checks each attach kept for its own teardown give way to the helper, which
  costs the controls a few bytes once and saves a few in each attach that moves onto it. Record 13's
  budget holds it.
- The status line and the toast gain a way to be let go, which record 15 is amended for, and the
  hooks attach with a signal from a ref callback that returns its cleanup, which record 20 is
  amended for.
- An attach is held to the contract by browser tests as it moves onto the helper, the theme switch
  and the copy button first.

## How it is tested

The paths are in `packages/design-kit`.

- `src/teardown.test.ts` finds the helper gives null for a signal already aborted, runs what it
  keeps once and in order whether the page aborts or the attach detaches first, aborts its own
  signal, and leaves the page's signal once it has run.
- `e2e/teardown.spec.tsx` attaches the theme switch and the copy button with a signal already
  aborted and finds them hidden with no listener added and attached afresh by a later call, aborts a
  signal and finds them hidden, the copy button's word back to Copy and every listener off, finds a
  press answered after the abort silent and a theme chosen after it unseen by the switch, calls an
  old detach twice and aborts its signal and finds a newer attach still working, and finds a later
  attach's signal unheard while the first attach's takes the piece down. Listeners are counted
  through Chromium's own tools.
- `scripts/controls.test.ts` holds the controls, the helper with them, to the budget record 13 sets.

## Sources

- WHATWG, DOM Standard, [add an event listener](https://dom.spec.whatwg.org/#add-an-event-listener)
  and [using AbortController and AbortSignal objects in APIs](https://dom.spec.whatwg.org/#abortcontroller-api-integration),
  read 2026-11-20.
- MDN, [`addEventListener`'s `signal`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#signal),
  read 2026-11-20.
- React, [cleanup functions for refs](https://react.dev/blog/2024/12/05/react-19#cleanup-functions-for-refs),
  React 19, 2024-12-05.
- Floating UI, [autoUpdate](https://floating-ui.com/docs/autoUpdate), read 2026-11-20.
- Tippy.js, [methods](https://atomiks.github.io/tippyjs/v6/methods/) and
  [createTippy](https://github.com/atomiks/tippyjs/blob/master/src/createTippy.ts), version 6, read
  2026-11-20.
- focus-trap, [README](https://github.com/focus-trap/focus-trap) and
  [index.js](https://github.com/focus-trap/focus-trap/blob/master/index.js), read 2026-11-20.
- Headless UI, [disposables](https://github.com/tailwindlabs/headlessui/blob/main/packages/%40headlessui-react/src/utils/disposables.ts),
  read 2026-11-20.
- MDN, [`Symbol.dispose`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/dispose)
  and its [compatibility data](https://github.com/mdn/browser-compat-data/blob/main/javascript/builtins/Symbol.json),
  read 2026-11-20.
