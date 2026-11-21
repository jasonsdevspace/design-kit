# 20. The kit's React hooks wrap its attach functions

**Status:** accepted, amended in 0.9.0 for hooks over a function that acts once, such as
`moveFocus`, which keep only what calls a request off, and one that acts on a view's arrival, which
keeps the key it last drew and whether that was its first draw, while whether a visitor's press
brought the view is decided by `focusOnArrival` in `./controls`, and amended in 0.9.1 for the
hooks whose request reads what the page draws, `useFocusAfterDraw` and the refusal `useFormRefusal`
returns, which keep a request owed until their own next commit and a count of requests that renders
them, so the request lands once the page's change is drawn. That holds for a change set in the same
tick as the request, in the same lane, in the same React root: a change made in a transition is
asked for inside the same `startTransition`, and one drawn in another root is not waited for.
Amended again for the hooks' refs, which return their cleanup as React 19 lets a ref callback do, in
place of being called with null, and do nothing when a helper that merges refs still calls them with
null. Each ref makes an `AbortController` as its element arrives and hands its attach the signal, as
record 22 has every attach take, and the cleanup aborts it, which takes the piece down, a form's
check included. `StatusProvider` still waits a microtask before its cleanup lets its line go, and
keeps the line's controller where the same line comes back, since React's second run in development
calls the cleanup and the ref again, and an abort at once would let the line go and empty it of the
words said in the first run. The function `useStatus` hands out is the provider's own, which says
through whichever attach holds the line, so it keeps speaking after that run and says nothing once
the provider has gone. A focus request asked in the task that unmounts its component still lands, so
the hook hands it no signal of the component's, which that unmount would abort, and calls it off
only by what `moveFocus` returns. One asked after the component has unmounted takes focus only from
the page's body.

## Context

The kit's controls ship as markup from a component and a function a page attaches to it, as record
13 has it. `./react` draws markup alone, as record 5 has it, and imports nothing from `./controls`,
so a React page that wants a control's behavior attaches it in an effect of its own. The next
release adds behavior every app has written by hand: moving focus after a change, saying words on
the status line, moving among a grid's cells with the arrow keys, refusing a form, a busy button and
progress. Game Table Tally and ShelfLens each wrapped the status line in a hook and each moved focus
after a draw in an effect, and no two of those wrappers did it the same way. Several pieces would
add a hook, so how a hook is built has to be settled before the first one is, or each will settle
it differently.

## Options

**A. Leave pages to attach in an effect.** The kit ships the attach functions alone, and a React
page writes the effect, keeps the handle and takes it away on unmount. Rejected, since that is what
both apps did, and each did it differently, which is the drift the kit exists to remove.

**B. Behavior written in `./react`, with state of its own.** A hook or a component that holds the
behavior itself, in React's terms. Rejected, since the behavior would then be written twice, once
for React and once in `./controls` for a page without it, and `./react` has no budget, so whatever
moved there would grow out of sight of the controls budget record 13 holds.

**C. A hook for an attach a React page needs, holding nothing but the attach's handle.** Each hook
attaches its function to its element, returns what the function returns, such as `say` or `refuse`,
and takes it away where the function returns what does so. The behavior stays in `./controls`, once,
inside its budget.

## Decision

Option C. A hook is named for its attach, `useStatus` for `attachStatus` and `useRoving` for
`attachRoving`, or for the part a page calls where the attach does more, `useFormRefusal` for
`attachForm`, and lives in `hooks.tsx`, which `./react`
exports beside the markup. Each hook follows the same rules.

- **It attaches through a callback ref it returns,** so a page puts the ref on the element and the
  hook sees each element as it arrives. The ref returns the cleanup that takes the piece down, so
  React's second run in development leaves nothing doubled or dropped. A ref object would not do,
  since setting its `current` starts no render and no effect, so a swapped element would never be
  attached.
- **It takes the attach away when its element leaves or the component unmounts, where the attach
  returns what does so.** An attach that returns what says or opens, as record 15 has it for the
  status line, the toast and the dialog, keeps its listeners on its own element, so they leave with
  it, and attaching the same element again after a remount returns the first handle, as record 13
  has it, so nothing is attached twice.
- **It passes its options to the attach again only when one of them has changed,** compared one by
  one, and reads a function among them through a ref, so a page that writes its options inline on
  every render does not set them again. Setting them again can reset what a control is showing, as
  a copy button's word goes back to Copy.
- **It passes every option each time, each at its default when the page leaves it out,** so a page
  that drops an option clears it, rather than leaving it as an attach called with none would.
- **What it returns stays the same across renders,** so a page can list it in an effect's
  dependencies without running that effect again.
- **It keeps no state of its own beyond the attach's handle,** so what a page sees is what the
  attach does, and a page without React gets the same behavior from the same function. The hooks
  whose request reads what the page draws are the exception below, since when React draws is a
  React concern a page without React does not have.

Where a function acts once rather than attaching to an element, as `moveFocus` does, its hook
returns the function, the same across renders, and keeps only what calls off a request not yet done,
so a component that unmounts leaves nothing behind. A request whose landing reads what the page
draws, as `useFocusAfterDraw` and the refusal `useFormRefusal` returns do, is held until the hook's
own component next commits. React draws state set after an await in a task of its own, which a frame
can come before, so a request made at once found the control not yet drawn or still off, or no field
in error. The hook keeps the request owed and a count it raises as it is asked, which renders its
component in the same batch as the page's change, and a layout effect makes the request as that
render commits, so it lands in the frame that paints the change, whichever component drew it. Where
focus was is read as the request is asked, followed into a shadow root by `activeOf` from
`./controls`, so a visitor who moves focus before the commit is not pulled back. Each request takes
the place of one not yet landed, and what it returns calls off that request alone. A request asked
as the component first draws, from a ref on its own markup or a child's layout effect, waits for the
component's render as any other does. One asked in the task that unmounts its component, as a row
asks for the next as its press removes it, never gets its render, so it is made as the component
unmounts. One asked earlier and still waiting, as in a transition an urgent update overtook, or
whose component an `Activity` hides rather than unmounts, is called off. A request asked for once
the component has unmounted has no render to wait for and is made at once, as it was before the hook
waited, but takes focus only from the page's body, since where focus stands then is not where the
change began, and a visitor already on the next screen is left there. What the hook returns is still
the function's, with `from` read as it is asked, and it is called in a handler or in an effect with
dependencies, never as the component renders nor in an effect that runs on every render, since
asking renders the component again. A hook that acts when a view arrives, as `useArrivalFocus` does,
keeps the key it last drew and whether that was its first draw, so it reads where focus was as each
arrival begins and asks once for each key, since its effect runs again only when the key changes. A
key that changes asks through `focusOnArrival` with `changed`, so it takes focus whatever the last
input was, lands with any view first drawn for the same press and spends the press. Whether a press
brought a view's first draw, rather than a key that moves or typing, is decided by `focusOnArrival`
in `./controls`, which notes on the document whether the visitor's last input was a recent press, so
a page without React gets the same arrival from the same function. A request the effect calls off as
it is cleaned up hands its press back, so React's second run in development asks again, as a first
draw still.

Where a piece needs one line for a whole page, as the status line does, a provider draws it and a
hook finds it through context. The line is attached as it lands, before the effects of the parts
under the provider run, and words said before it is in the page are held and said once it is.

`hooks.tsx` imports `./controls`, and `react.tsx` imports no effect from React, so the markup
components still render on a server and draw the same markup a page writes by hand.

## Consequences

- Behavior has one home, `./controls`, and one budget, and a hook adds a few lines of wiring rather
  than a second copy of the behavior. Each new attach function adds to the controls budget, which
  the piece that adds it raises by record 13's rule where it must.
- Record 5 is amended: `./react` exports hooks that attach some of the controls, while its markup
  components still carry no stylesheet, set no style and run no effect.
- Record 13 is amended: a React page draws the status line with `StatusProvider`, which
  `useStatus` finds, attaches a form, a busy button, progress and a group of cells and moves focus
  through a kit hook, and the other controls in an effect of its own, and the
  attach functions are the contract both kinds of page share.
- Record 14 is amended: a hook may run a piece's keys or move its focus, while the state a page
  owns, such as the chosen tab, stays the page's, passed to the hook as an option and read back
  through a callback.
- Game Table Tally and ShelfLens delete their own wrappers when they pin the version that carries
  the hooks.

## How it is tested

The paths are in `packages/design-kit`, and that of the budget in the repository's `scripts`.

- The lint holds `src/react.tsx` to importing no effect from React, so a markup component that
  reaches for one fails the checks.
- `src/react.test.tsx` renders the markup components with `renderToStaticMarkup` in plain Node,
  which fails if one reaches for the browser as it renders.
- Each hook adds browser tests in `e2e/`, since the unit tests run in Node with no document. They
  mount it, find the attach ran on its element, swap the element and find the new one attached,
  render again with the same options and find them not set again, drop an option and find it
  cleared, and unmount it.
- `e2e/focus.spec.tsx` and `e2e/form.spec.tsx` run frames before React draws and find focus on a
  control a save turns on after an await, in the hook's component and in a sibling, and on a field
  whose error is set after an await. They press a save inside a shadow root and find focus moved,
  ask from a component that has since unmounted and find focus moved, call off the first of two
  refusals and find the second lands, and move focus before the error is drawn and find it left
  there. `e2e/focus.spec.tsx` also removes a row that asks for focus on the next one as it goes and
  finds focus there, finds focus left on the next screen's field where a request comes after its
  component unmounted, finds focus on a field a view asks for from its own ref as a press first
  draws it, and finds a request asked in a transition called off when an urgent update unmounts its
  component or an `Activity` hides it first.
- `e2e/strict.spec.tsx` draws the hooks under `StrictMode` in React's development build, which
  runs each ref's cleanup and the ref again as the page first draws, and finds words said in a
  part's first effect kept on the provider's line, one arrow key moving one cell, a busy notice,
  the end of a progress and a refusal each said once, nothing said once the pieces leave, and a
  ref called with null doing nothing.
- `scripts/controls.test.ts` measures every function a page can import from `./controls`, so the
  behavior the hooks wrap is weighed where it lives.
