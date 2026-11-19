# 20. The kit's React hooks wrap its attach functions

**Status:** accepted

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

**C. A hook for each attach, holding nothing but the attach's handle.** Each hook attaches its
function to its element, returns what the function returns, such as `say` or `refuse`, and takes it
away where the function returns what does so. The behavior stays in `./controls`, once, inside its
budget.

## Decision

Option C. A hook is named for its attach, as `useStatus` would be for `attachStatus`, and lives in
`hooks.tsx`, which `./react` exports beside the markup. Each hook follows the same rules.

- **It attaches through a callback ref it returns,** so a page puts the ref on the element and the
  hook sees each element as it arrives. A ref object would not do, since setting its `current`
  starts no render and no effect, so a swapped element would never be attached.
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
  attach does, and a page without React gets the same behavior from the same function.

Where a piece needs one line for a whole page, as the status line does, a provider draws it and a
hook finds it through context. A provider's effect runs after its children's, so words said before
the line is attached are held and said once it is.

`hooks.tsx` imports `./controls`, and `react.tsx` imports no effect from React, so the markup
components still render on a server and draw the same markup a page writes by hand.

## Consequences

- Behavior has one home, `./controls`, and one budget, and a hook adds a few lines of wiring rather
  than a second copy of the behavior. Each new attach function adds to the controls budget, which
  the piece that adds it raises by record 13's rule where it must.
- Record 5 is amended: `./react` exports hooks that attach the controls, while its markup
  components still carry no stylesheet, set no style and run no effect.
- Record 13 is amended: a React page attaches a control through a kit hook rather than an effect of
  its own, and the attach functions are the contract both kinds of page share.
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
- `scripts/controls.test.ts` measures every function a page can import from `./controls`, so the
  behavior the hooks wrap is weighed where it lives.
