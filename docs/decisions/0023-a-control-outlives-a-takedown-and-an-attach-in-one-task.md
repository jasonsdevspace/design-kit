# 23. A control outlives a takedown and an attach in one task

**Status:** accepted, amending record 22's rules that a later attach starts afresh and that the
first attach owns a piece, record 13's rule for an attach called again, record 15's line let go by
the signal its first attach took, and record 20's hooks, which now take their part down at once
rather than a microtask after a null call

## Context

Record 22 has every attach take a signal and the React hooks hand each one the signal of a
controller their ref makes, aborted by the cleanup the ref returns. React calls a ref's cleanup and
then the new ref whenever the ref itself changes, so a page that writes `ref={(el) => form(el)}`, or
a helper that merges refs and passes the cleanup on, makes a new ref on every render, and every
render took the control down and attached it afresh. A form's check was set up again on a parent's
render, a group the arrow keys move through made a new observer each time, and a busy button drawn
again faster than its wait never said it was busy. The same happens where an element passes from one
hook's ref to another's in one commit, and where React's second run in development calls each ref
twice, which `StatusProvider` worked around by keeping its line's controller for a microtask.
0.9.2's hooks attached in refs too, and there a ref made afresh attached a busy button, a group and
a bar afresh on every render, while its form hook never took its form down.

## Options

**A. Defer the takedown in the hooks.** Each hook's cleanup waits a microtask before it aborts, and
an element the ref is called with again by then stays as it was. Rejected. The hook keeps a second
record of who owns each element beside the kit's own, and the two disagree wherever two hooks reach
one element. Each review of it turned up another such case: an element passed in one commit from
one hook's ref to another of the same kind, which the waiting takedown then took from the new hook,
a refusal sent through a form already let go of, and a hook of another kind joining an element
through a merged ref, which handed the busy button's waiting takedown to a heading's hook. Each fix
added a rule for which hook a waiting takedown belongs to, and none made the case impossible.

**B. Leave it to pages, and document that a hook's ref must stay the same across renders.**
Rejected. An arrow written inline is the ordinary way to pass a ref, and a merged ref is the only
way to give one element two hooks, so the limit would catch most pages that use the hooks.

**C. Let the controls keep their holders.** Every call that attaches an element holds its control
by the signal it gives. The control is taken down a microtask after the last holder lets go, and an
attach of the same element before then joins it. The kit already keeps who owns each element, one
map for each kind of control, so the rule lives there once, for React pages and pages without React
alike.

## Decision

Option C.

- **Each signal holds the control.** An attach given a signal adds it as a holder, and a call given
  one already held adds no second holder, as `addEventListener` ignores a listener added twice. A
  call without a signal holds the control until its detach only where nothing else holds it, and
  elsewhere joins without holding, its options going to the newest holder.
- **The last holder letting go takes the control down a microtask later.** An attach of the same
  element before then cancels the takedown and keeps the control's state, a busy wait, a form's
  check and the errors it drew, a group's observers, an open dialog, a shown toast and a status
  line's words among them. React runs a ref's cleanup and the next ref in one commit, with no
  microtask between them, so a ref made afresh, React's second run and an element passed between
  two hooks' refs all keep the control. A page without React that aborts and attaches again in one
  task keeps it too, and one that attaches after a microtask starts afresh.
- **The detach takes the control down at once, whoever holds it.** It is still the one function
  every call returns, so a page that means to start afresh within the task calls it.
- **A later attach returns what the first returned,** as record 13 has it.
- **A control runs on its newest holder's options.** A new holder's options apply at once. A call
  from the newest holder, or one without a signal, replaces them, and a call from an older holder is
  kept for when that holder is the newest again. When the newest lets go, the one before it takes
  over with the options its last call gave.
- **Until the takedown lands, the control is whole.** Its listeners still hear the page, and what
  its attach returned still acts, so record 22's calls after teardown do nothing from the moment
  the takedown lands. A focus request's takedown waits the same microtask, which changes nothing
  for it, since its frame cannot come first.
- **The hooks take their part down at once.** A ref's cleanup aborts its element's signal and drops
  the element from the hook's own map in the same call, and a ref called with null does so for
  every element it holds. `StatusProvider` keeps no controller of its own, and waits a microtask
  only to call off the words it held before its line was drawn.

`teardown` in `src/teardown.ts` keeps the holders, with `hold` beside `add` and `stop`, and two
functions beside it, `join` and `keep`, find a control by its element in its kind's map and keep it
there until it is taken down, so no attach keeps its own registry rule. A holder's listener on its
signal is added once and taken off as it fires or as the control is taken down, rather than given
the control's own signal, which would leave an entry on the control's signal for every signal it has
ever held.

## Consequences

- A ref written inline, a merged ref and React's second run keep a control as a ref kept the same
  across renders does, and two hooks on one element each hold it, so dropping one leaves the other
  working on its own options.
- A call in the same task as an abort reaches a piece still whole: a panel's `set` still opens or
  closes it and a dialog's opener still opens it, until the takedown lands.
- A page can no longer start a piece afresh by aborting and attaching it in one task. It calls the
  detach, or attaches after a microtask.
- A takedown that hands focus back runs after React has taken the element away, so the toast reads
  whether focus was in it from the focus it has heard, not from where focus is. Chromium fires
  focusout on a toast taken from the page with focus in it while WebKit and Firefox fire none, so
  the toast takes focus to have left only where it is still in the page a microtask after it hears
  focusout.
- A copy button joined with a source that gives the same element keeps the word it shows, and
  progress counts its steps again only where they change, since a join that sets the same options
  would otherwise undo them.
- The controls weigh 18,317 bytes, against 18,117 before, within the 18.5 KB record 13's rule set.
- Records 13, 15, 20 and 22 say what this record changes, and the reference's section on taking a
  control down says when a takedown lands.

## How it is tested

The paths are in `packages/design-kit`.

- `src/teardown.test.ts` finds an abort of the only holder runs nothing until a microtask has
  passed, a signal held before then keeps everything, a call without a signal holding only where
  nothing else does, `stop` running at once whoever holds and leaving no listener on any holder's
  signal, the listeners on a signal not growing as holders come and go, and the options of the
  newest holder applied as holders join and let go.
- `e2e/signal.spec.tsx` aborts and attaches every piece again in one task and finds each kept, with
  its handle, a busy wait, an open dialog, a shown toast, a group's observers and a form's errors
  and check, and aborts, waits a microtask and attaches and finds each attached afresh. It finds a
  toast with focus in it taken down and then removed from the page handing focus back.
- `e2e/strict.spec.tsx` draws a form, a group and a busy button mid-wait behind refs made afresh on
  every render and finds the form's check set up once and its errors kept, the group observed once
  with one stop, and the busy button's wait kept and its words said once. It finds a busy wait kept
  where a heading's hook joins it through a merged ref, a group two hooks share through a merged ref
  observed once, a form passed from one hook's ref to another's in one commit keeping its errors and
  refusing through the hook it went to, and either of two form hooks on one form dropped leaving the
  other's check and refusal.
- `e2e/leaks.spec.tsx` joins each piece again and again with a new signal and finds nothing growing
  as it is joined and nothing left once it is taken down, listeners on signals included.
- `scripts/controls.test.ts` holds the controls, the helper with them, to the budget record 13 sets.
