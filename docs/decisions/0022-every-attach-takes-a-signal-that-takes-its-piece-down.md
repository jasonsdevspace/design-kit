# 22. Every attach takes a signal that takes its piece down

**Status:** accepted

## Context

The kit's attach functions take a piece down in different ways or not at all. Most return a detach,
the status line's returns what says a message and is let go only by `StatusProvider`, the toast's
returns what shows a message and has no way to be let go, and the form's returns what refuses it and
keeps its listeners for good. An audit found pieces that keep running after a page takes them away:
a toast's resize listener and observer, a theme switch's document listener, a form's reset timer, a
focus request made after its component has gone, and a panel whose opener is detached while it is
open, which Escape and its Close then close by different rules. Each attach that does return a
detach keeps its own flag against a second call, its own list of what to take off and its own check
that a late answer finds it still attached, so no two do it the same way. A rule for taking a piece
down has to be written once, before each piece is moved onto it, or each will settle it
differently.

## Research

- **The DOM takes a signal.** Section 3.3 of the DOM standard asks an API whose operations can be
  aborted to take an `AbortSignal` through a `signal` member, to act at once on one already aborted,
  and to treat an abort as its own cancel, and asks an API that returns no promise to follow these
  as far as it can. `addEventListener` does: a listener given a signal already aborted is not added,
  and an abort takes it off as `removeEventListener` would. A listener added again with the same
  type, callback and capture is ignored, its signal with it, so the first add owns the listener.
- **React 19 hands a ref its cleanup.** A ref callback may return a cleanup, which React calls when
  the element leaves, in place of calling the ref again with null, which React plans to deprecate. A
  hook can make an `AbortController` in its ref and return what aborts it, so the attach's signal is
  the one teardown path a React page and a page without React share.
- **Libraries keep teardown complete, safe to repeat and quiet afterward.** Floating UI's
  `autoUpdate` returns one cleanup that stops every listener and observer it started. Tippy's
  `destroy` returns at once on an instance already destroyed, and its `show` does nothing on one,
  each with a warning in its development build only. focus-trap's `deactivate` returns at once on a
  trap not active, and `activate` on one already active. Headless UI keeps each component's
  listeners, frames, timers and microtasks in one collection and disposes of them together.
- **`Symbol.dispose` is not in a stable Safari.** MDN's compatibility data has it in Chrome 125 and
  Firefox 141, and in Safari 27.3, which was in beta on 2026-11-20, with 27.2 the current release.
  The kit's floor is Safari 17.5.

## Options

**A. A release function exported for each piece,** as `releaseStatus` was, written for the status
line and kept inside the kit before 0.9.2 shipped. Rejected, since a page would hold a second
function for each piece and have to know which one each needs, and a React hook would need another
path again.

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
- **A signal already aborted does nothing.** The piece is left as the markup drew it, hidden where
  it starts hidden, with no listener, observer, timer or frame of the kit's, and nothing kept for
  it, so a later attach starts afresh. A piece already attached is left as it is, and the new
  options are not taken. What the attach returns does nothing.
- **Aborting is the same as detach.** Everything the attach set up comes off: its listeners,
  observers, timers and frames, a listener on the document it added, and what it drew or showed, as
  its detach would. An attach that returns what acts rather than a detach is taken down by its
  signal alone. The module's own listeners are the exception, as record 13 accepts the one that
  notes the visitor's last press: the theme's listeners on the window, added once by the first
  switch or `chooseTheme`, stay for the page's life, so `chooseTheme` follows a choice made in
  another tab on a page with no switch.
- **Detach is complete and safe to call twice.** The teardown runs once, whichever comes first,
  the abort or the detach, and a detach called again, even after the same element was attached
  anew, leaves that newer attach alone. An undo that throws is reported and the rest still run.
- **Calls after teardown do nothing, silently.** What an attach returned, such as a status line's
  `say` or a toast's show, does nothing once its piece is taken down, as do a timer or an answer
  that comes late, such as the clipboard's. Nothing throws and nothing warns.
- **The first attach owns the piece's lifetime.** Attaching a piece again before it is taken down
  is the call record 13 describes: it returns the first attach's handle, takes any new options, and
  leaves its own signal unheard. It works as `addEventListener` does with a listener added twice,
  which keeps the first and ignores the second, signal and all. So one part of a page cannot take
  down a piece another part attached, and the piece is attached again only once its first attach
  is taken down.
- **A focus request still lands when its component unmounts in the moment it asks,** so a row that
  asks for focus on the next one as it is deleted moves focus there, as record 20 already has a
  request made after unmount.
- **`Symbol.dispose` waits for a stable Safari** and for the kit's floor to reach it, and then
  only on the attaches that return a detach.
- **Return shapes stay as they are,** so the signal is added beside what each attach takes now and
  every page keeps working as it is, which makes the contract a patch release, 0.9.3.

One internal helper keeps the contract, `teardown` in `src/teardown.ts`, which no entry exports.
Given the page's signal, it gives null where that signal is already aborted, so the attach returns
at once, and otherwise a signal of its own that every listener of the attach takes, `add` for what a
signal cannot take off, as an observer's disconnect, a timer's clear or a frame's cancel, and
`stop`, which the attach returns as its detach. `stop` aborts its own signal and runs what `add`
kept, once, and the page's signal calls it on abort. An undo given to `add` after the teardown has
run runs at once. Work an attach sets after it is set up follows one of two rules: it lives in a
variable an undo kept at setup clears, or its callback reads the attach's signal and does nothing
once it is aborted. Anything that waits longer than one task, a timer or a frame, is cleared rather
than left to check. The listener on the page's signal comes off with the teardown, so a signal a
page keeps for longer holds nothing of a piece already taken down. Until then the page's signal
keeps the piece alive, so a page hands over a signal that lives no longer than the piece. In 0.9.3
the theme switch, the copy button, the status line, the toast, the form and the panels keep the
contract through it.

## Consequences

- A page takes down any piece the same way, whatever its attach returns, and a page that attaches
  many pieces for one screen aborts one controller as the screen goes.
- The flags, lists and checks each attach kept for its own teardown give way to the helper. With the
  theme switch and the copy button moved onto it, the controls weigh 17,532 bytes against 17,331
  before, 201 more, which left less room than a function of the usual size, so record 13's rule set
  their budget at 17.75 KB. The rule sets it again if a function outgrows it.
- An attach is held to the contract by browser tests as it moves onto the helper.

## How it is tested

The paths are in `packages/design-kit`.

- `src/teardown.test.ts` finds the helper gives null for a signal already aborted, runs what it
  keeps once and in order whether the page aborts or the attach detaches first, runs every undo
  where one throws and reports the error, runs one kept after the teardown at once, and takes its
  listener off the page's signal once it has run.
- `e2e/teardown.spec.tsx` attaches the theme switch and the copy button with a signal already
  aborted and finds them hidden and attached afresh by a later call, a copy button attached again
  with an aborted signal keeping its first source, an abort hiding both and putting the copy
  button's word back to Copy, a press answered after the abort silent and a theme chosen after it
  unseen by the switch, an old detach called twice and its signal aborted leaving a newer attach
  working, and a later attach's signal unheard while the first attach's takes the piece down. It
  runs in Chromium, WebKit and Firefox. In Chromium alone it counts, through Chromium's own tools,
  the listeners on the switch's and the button's own elements, finding none added for an aborted
  signal and every one off after an abort, and the document's, finding the switch's listener there
  off after an abort with its choices open.
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
