# 20. The kit's React hooks wrap its attach functions

**Status:** accepted

## Context

The kit's controls ship as markup from a component and a function a page attaches to it, as record
13 has it, and `./react` draws markup alone, with no effects and nothing from `./controls`, as
record 5 has it. A React page that wants a control's behavior attaches it in an effect of its own.
The next release adds behavior every app has written by hand: moving focus after a change, saying
words on the status line, moving among a grid's cells with the arrow keys, refusing a form, a busy
button and progress. Game Table Tally and ShelfLens each wrapped the status line in a hook and each
moved focus after a draw in an effect, and no two of those wrappers did it the same way. Six pieces
would add a hook, so how a hook is built has to be settled before the first one is, or each will
settle it differently.

## Options

**A. Leave pages to attach in an effect.** The kit ships the attach functions alone, and a React
page writes the effect, keeps the handle and detaches on unmount. Rejected, since that is what both
apps did, and each did it differently, which is the drift the kit exists to remove.

**B. Behavior written in `./react`, with state of its own.** A hook or a component that holds the
behavior itself, in React's terms. Rejected, since the behavior would then be written twice, once
for React and once in `./controls` for a page without it, and `./react` has no budget, so whatever
moved there would grow out of sight of the controls budget record 13 holds.

**C. A hook for each attach, holding nothing but the attach's handle.** Each hook attaches its
function on mount, detaches on unmount and returns what the attach returns, such as `say` or
`refuse`. The behavior stays in `./controls`, once, inside its budget.

## Decision

Option C. A hook is named for its attach, `useStatus` for `attachStatus` and `useRoving` for
`attachRoving`, and lives in `./react` beside the markup. It attaches in an effect to the element a
ref it returns or takes points at, keeps the handle the attach returns in a ref for the life of the
component, and detaches when the component unmounts or the element changes. The function it
returns stays the same across renders, so a page can list it in an effect's dependencies without
running that effect again. Options that change between renders reach the attach by calling it
again, which record 13 already makes safe: an attach called again on the same element returns what
it returned the first time and takes the new options in place of the last. A hook keeps no state of
its own beyond the handle, so what a page sees is what the attach does, and a page without React
gets the same behavior from the same function.

`./react` imports `./controls` for the hooks alone. The markup components stay free of effects, so
each still renders on a server and draws the same markup a page writes by hand. Where a piece needs
one line for a whole page, as the status line does, a provider draws it and its hook finds it
through context, and the provider holds the attach's handle as a hook does.

## Consequences

- Behavior has one home, `./controls`, and one budget, and a hook adds a few lines of wiring to
  `./react` rather than a second copy of the behavior.
- Record 5 is amended: `./react` draws markup and, through its hooks, attaches the controls, while
  its components still carry no stylesheet and set no style.
- Record 13 is amended: a React page calls a hook rather than attaching in an effect of its own,
  and the attach functions are the contract both kinds of page share.
- Record 14 is unchanged in what it gives the page. A hook moves focus or speaks, and the state a
  page owns, such as the chosen tab, stays the page's, passed to the hook as an option and read back
  through a callback.
- Game Table Tally and ShelfLens delete their own wrappers when they pin the version that carries
  the hooks.

## How it is tested

The paths are in `packages/design-kit`.

- Each hook's tests in `src/react.test.tsx` mount it, check the attach ran on the element, change
  its options and check the attach took them without a second listener, and unmount it and check
  the attach was taken away.
- `src/react.test.tsx` renders the markup components with `renderToStaticMarkup`, which fails if one
  reaches for an effect or the browser.
- The controls budget test in `scripts/controls.test.ts` measures every function a page can import,
  so the behavior the hooks wrap is weighed where it lives.
