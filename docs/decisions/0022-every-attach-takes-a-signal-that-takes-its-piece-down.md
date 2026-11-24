# 22. Every attach takes a signal that takes its piece down

**Status:** accepted, amended by record 23 in 0.9.3, under which every signal that attaches an
element holds its control, taken down a microtask after the last of them aborts unless the element
is attached again by then, and the control runs on its newest holder's options, by record 27 in
0.9.4, for the mark a toast's takedown takes off its app's frame, in 0.9.4 for markup missing a
part, which throws at the first attach even under a signal already aborted, and in 0.9.4 for
`focusOnArrival`, which reads the signal its options name

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
  and to treat an abort as its own cancel, which record 23 qualifies by a microtask for a control's
  takedown, and asks an API that returns no promise to follow these as far as it can.
  `addEventListener` does: a listener given a signal already aborted is not added, and an abort
  takes it off as `removeEventListener` would. A listener added again with the same type, callback
  and capture is ignored, its signal with it, so the first add owns the listener.
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
  it, so a later attach finds nothing of it. A piece already attached is left as it is, and the new
  options are not taken. What the attach returns does nothing. A missing part is told at the first
  attach, before the signal is read: an attach that finds no control attached to its element looks
  for the parts record 13 has it throw for, a toast's, a stepper's value and buttons, a panel
  button's `aria-controls` and a table's frame, before it reads its signal, so a page learns of
  markup missing one where it first attached, whatever the signal. A control already attached is
  handed back as it is, though its markup has since lost a part, so a page that attaches again from
  a ref or an effect does not throw as it draws, and under a signal already aborted it is left alone
  as ever. A table's control is kept by its frame, so an element since taken out of its frame has no
  control to hand back and is refused.
- **Aborting is the same as detach,** once no other signal holds the piece, as record 23 has it, and
  a microtask later. Everything the attach set up comes off: its listeners, observers, timers and
  frames, a listener on the document it added, and what it drew or showed, as its detach would, a
  mark it wrote on another element among them, as a toast's `data-toast-rows` on its frame is, which
  record 27 has it write. An attach that returns what acts rather than a detach is taken down by its
  signal alone. The module's own listeners are the exception, as record 13 accepts the one that
  notes the visitor's last press: the theme's listeners on the window, added once by the first
  switch or `chooseTheme`, stay for the page's life, so `chooseTheme` follows a choice made in
  another tab on a page with no switch.
- **Detach is complete and safe to call twice.** The teardown runs once, whichever comes first, the
  takedown the last holder's abort brings or the detach, which takes the piece down at once whoever
  holds it, and a detach called again, even after the same element was attached anew, leaves that
  newer attach alone. An undo that throws is reported and the rest still run.
- **Calls after teardown do nothing, silently.** What an attach returned, such as a status line's
  `say` or a toast's show, does nothing once its piece is taken down, as do a timer or an answer
  that comes late, such as the clipboard's. Nothing throws and nothing warns.
- **A later attach joins the piece.** Attaching a piece again before it is taken down is the call
  record 13 describes, and returns the first attach's handle. Record 23 sets which signals hold the
  piece and whose options it runs on.
- **A focus request still lands when its component unmounts before the request is drawn,** so a
  row that asks for focus on the next one as it is deleted moves focus there, as record 20 already
  has a request made after unmount.
- **`Symbol.dispose` waits for a stable Safari** and for the kit's floor to reach it, and then
  only on the attaches that return a detach.
- **Return shapes stay as they are,** so the signal is added beside what each attach takes now and
  every page keeps working as it is, which makes the contract a patch release, 0.9.3.

One internal helper keeps the contract, `teardown` in `src/teardown.ts`, which no entry exports.
Given the page's signal, it gives a signal of its own that every listener of the attach takes, `add`
for what a signal cannot take off, as an observer's disconnect, a timer's clear or a frame's cancel,
and `stop`, which the attach returns as its detach. Where the page's signal is already aborted, it
gives a teardown already stopped, whose `add` runs each undo at once, so it never gives null. That
is no guard, since what an attach registers after its undos would outlive them, so each attach
checks for a signal already aborted before it sets anything up. `stop` aborts its own signal and
runs what `add` kept, once, at once when the attach's detach calls it, and since record 23 a
microtask after every signal holding the piece has aborted, unless the element is attached again by
then. An undo given to `add` after the teardown has run runs at once. Work an attach sets after it
is set up follows one of two rules: it lives in a variable an undo kept at setup clears, or its
callback reads the attach's signal and does nothing once it is aborted. Anything that waits longer
than one task, a timer or a frame, is cleared rather than left to check. The listener on the page's
signal comes off with the teardown, so a signal a page keeps for longer holds nothing of a piece
already taken down. Until then the page's signal keeps the piece alive, so a page hands over a
signal that lives no longer than the piece. In 0.9.3 the theme switch, the copy button, the status
line, the toast, the form, the panels, the stepper, a table's frame, a group the arrow keys move
through, a busy button, progress, the dialog and `moveFocus` keep the contract through it, and since
0.9.4 `focusOnArrival` does, whose options had named a signal it did not read.

## Consequences

- A page takes down any piece the same way, whatever its attach returns, and a page that attaches
  many pieces for one screen aborts one controller as the screen goes.
- The flags, lists and checks each attach kept for its own teardown give way to the helper. The
  helper added 201 bytes with the theme switch and the copy button on it, and moving every other
  attach onto it took the controls past their budget. Record 13's rule set the budget again at each
  step of 0.9.3, to 20 KB with record 23's holders, its one rule for handing focus back, a handback
  that takes SVG elements, focus falling to the body and followed into a frame, and a toast that
  keeps the control inside a frame of the page's own origin clear of itself, as record 13's table
  gives.
- Every attach and `moveFocus` is held to the contract by browser tests in Chromium, WebKit and
  Firefox.

## How it is tested

The paths are in `packages/design-kit`.

- `src/teardown.test.ts` finds the helper given a signal already aborted is already stopped and runs
  what it is given at once, runs what it keeps once and in order whether the page aborts or the
  attach detaches first, runs every undo where one throws and reports the error, runs one kept after
  the teardown at once, and takes its listener off the page's signal once it has run.
- `src/controls.test.ts` calls every attach that throws for a missing part with markup missing it
  and a signal already aborted, and finds each throw. It reads the module's code for every error
  thrown, of any kind, and finds each among those cases, so an attach that gains a throw gains a
  case that holds it to the same order. `src/teardown.test.ts` finds a join under a signal already
  aborted given what the attach names and holding nothing.
- `e2e/teardown.spec.tsx` holds to the contract every piece in the table `e2e/teardown-pieces.tsx`
  names but a focus request, which no later attach joins, in Chromium, WebKit and Firefox: a signal
  already aborted attaching nothing and keeping nothing, an abort taking the piece down a microtask
  later, each signal that attached it holding it until it aborts, and, where the attach returns a
  detach, the detach taking it down at once and an old detach called twice and its signal aborted
  leaving a newer attach working. Each is read from the handle a later attach returns and, where the
  page draws one, from its mark of the piece attached. Each piece used and taken down with a wait or
  a timer still due says and shows nothing for what is called on it after. Each piece's own cases
  follow in a block of its own, among them a copy button attached again with an aborted signal
  keeping its first source, its word put back to Copy as it is taken down, a press answered after
  the abort silent where one answered while it stays attached is heard, a theme chosen after the
  abort unseen by the switch, the switch's listener on the document off after an abort with its
  choices open, a busy wait, a progress step and a stepper's error said by none once taken down
  where a step and an error left attached are heard, and a focus request called off by an abort and
  holding nothing on the page's signal once it lands, as a view asking for focus as it arrives is,
  which under a signal already aborted moves nothing and leaves its press for another view. A
  stepper, a panel's button and a toast that lose a part while attached are handed back by a repeat
  attach, are not handed to a signal already aborted, and are refused by name once taken down and
  attached afresh, with any signal.
- `e2e/leaks.spec.tsx` holds every attach and `moveFocus` to leaving nothing running, in the three
  engines, on a stand-in clock that moves only by the test's steps. A script loaded before the
  page's own, `e2e/leaks.ts`, counts the listeners on elements, the document, the window and
  signals, the ResizeObservers and MutationObservers watching, and the timers and frames still to
  come, and in Chromium finds its count of the listeners on the window, the document and its
  elements equal to the engine's own. With the theme's window listeners set first, as the exception
  above allows, each piece in the same table is attached, used, taken down and called after twice
  in a row, the second round attaching all the first did, every count back where it started each
  time and nothing coming due later, and each piece given a signal already aborted, used and called
  after starts nothing. A page drawn by React that uses every hook is drawn, used and taken away
  twice, in production and under `StrictMode`, the second drawing attaching all the first did, with
  every count back where it was once React's root was in the page, but for React's own listeners on
  elements, such as the one it keeps on each field it drew. The leak spec makes every count of what
  a piece leaves running after an attach, and the teardown spec reads the listeners and the toast's
  observer it counts from the same script.
- `scripts/controls.test.ts` holds the controls, the helper with them, to the budget record 13 sets.

## Sources

- WHATWG, DOM Standard, [add an event listener](https://dom.spec.whatwg.org/#add-an-event-listener)
  and [using AbortController and AbortSignal objects in
  APIs](https://dom.spec.whatwg.org/#abortcontroller-api-integration), read 2026-11-20.
- MDN, [`addEventListener`'s
  `signal`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#signal),
  read 2026-11-20.
- React, [cleanup functions for
  refs](https://react.dev/blog/2024/12/05/react-19#cleanup-functions-for-refs), React 19,
  2024-12-05.
- Floating UI, [autoUpdate](https://floating-ui.com/docs/autoUpdate), read 2026-11-20.
- Tippy.js, [methods](https://atomiks.github.io/tippyjs/v6/methods/) and
  [createTippy](https://github.com/atomiks/tippyjs/blob/master/src/createTippy.ts), version 6, read
  2026-11-20.
- focus-trap, [README](https://github.com/focus-trap/focus-trap) and
  [index.js](https://github.com/focus-trap/focus-trap/blob/master/index.js), read 2026-11-20.
- Headless UI,
  [disposables](https://github.com/tailwindlabs/headlessui/blob/main/packages/%40headlessui-react/src/utils/disposables.ts),
  read 2026-11-20.
- MDN,
  [`Symbol.dispose`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/dispose)
  and its [compatibility
  data](https://github.com/mdn/browser-compat-data/blob/main/javascript/builtins/Symbol.json), read
  2026-11-20.
