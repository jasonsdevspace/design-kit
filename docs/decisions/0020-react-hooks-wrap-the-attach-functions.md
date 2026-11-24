# 20. The kit's React hooks wrap its attach functions

**Status:** accepted, amended in 0.9.0 for hooks over a function that acts once and one that acts on
a view's arrival, in 0.9.1 for the hooks whose request reads what the page draws, in 0.9.3 for refs
that return their cleanup and the focus requests around an unmount, by record 23 in 0.9.3, under
which the hooks take their part down at once and the kit keeps the control, and in 0.9.4 for a form
React still draws, which refuses only through `useFormRefusal`

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

A focus request still waiting for its render when its component unmounts was weighed apart, since
the request must land where the unmount comes in the same change and may be stale where it does not.

**D. A mark cleared by a task, so only a request asked in the task that unmounts its component is
made.** Rejected, since React 19 schedules its render from a microtask that then posts its own task,
after the one the asker posted, so the mark is always cleared first, and a row removed after an
await, from a timer or in a transition had its request called off.

**E. Reading the lanes React renders in, so a request is made only where the commit that unmounts
its component holds the update that asked.** Rejected, since React's lanes are private and change
between releases.

**F. A provider that owns every request and makes it once the page's change is drawn.** Rejected,
since every page that moves focus through the hook would have to draw it, a new requirement on every
page.

## Decision

Option C. A hook is named for its attach, `useStatus` for `attachStatus` and `useRoving` for
`attachRoving`, or for the part a page calls where the attach does more, `useFormRefusal` for
`attachForm`, and lives in `hooks.tsx`, which `./react` exports beside the markup. Each hook follows
the same rules.

- **It attaches through a callback ref it returns,** so a page puts the ref on the element and the
  hook sees each element as it arrives. The ref makes an `AbortController` as each element arrives,
  hands its attach the signal, as record 22 has every attach take, and returns the cleanup that
  aborts it, which React 19 calls as the element leaves in place of calling the ref with null. The
  hook keeps each element it holds with its controller, so one ref on several elements keeps those
  left working as one goes, and each form refuses a failed submit through itself. A ref object
  would not do, since setting its `current` starts no render and no effect, so a swapped element
  would never be attached.
- **It takes its part down at once when its element leaves or the component unmounts.** The
  cleanup aborts the element's signal and drops the element from the hook's own map in one call,
  and a ref called with null, as a helper that merges refs and drops the cleanup calls it, does so
  for every element the hook holds, since it does not say which left. The kit keeps the control a
  microtask after the last signal holding it aborts, as record 23 has it, so a ref made afresh on
  every render, an element passed from one hook's ref to another's in one commit and React's second
  run in development keep the control and its state, and two hooks on one element each hold it. The
  abort takes down an attach that returns what says or refuses as it takes down one that returns
  its detach, so no hook needs a release of its own.
- **It passes its options to the attach again only when one of them has changed,** compared one by
  one, with the element's own signal, so where two hooks share an element each one's options apply
  to its own hold, and reads a function among them through a ref, so a page that writes its options
  inline on every render does not set them again. Setting them again can reset what a control is
  showing, as a copy button's word goes back to Copy.
- **It passes every option each time, each at its default when the page leaves it out,** so a page
  that drops an option clears it, rather than leaving it as an attach called with none would.
- **What it returns stays the same across renders,** so a page can list it in an effect's
  dependencies without running that effect again.
- **It keeps no state of its own beyond the attach's handle and each element's controller,** so what
  a page sees is what the attach does, and a page without React gets the same behavior from the same
  function. The hooks whose request reads what the page draws are the exception below, since when
  React draws is a React concern a page without React does not have.

Where a function acts once rather than attaching to an element, as `moveFocus` does, its hook
returns the function, the same across renders, and keeps only what calls off a request not yet done,
so a component that unmounts leaves nothing behind. A request whose landing reads what the page
draws, as `useFocusAfterDraw` and the refusal `useFormRefusal` returns do, is held until the hook's
own component next commits. React draws state set after an await in a task of its own, which a frame
can come before, so a request made at once found the control not yet drawn or still off, or no field
in error. The hook keeps the request owed and a count it raises as it is asked, which renders its
component in the same batch as the page's change, and a layout effect makes the request as that
render commits, so it lands in the frame that paints the change, whichever component drew it. That
holds for a change set in the same tick as the request, in the same lane and the same React root, so
a change made in a transition is asked for inside the same `startTransition`, and one drawn in
another root is not waited for. Where focus was is read as the request is asked, followed into a
shadow root by `activeOf` from `./controls`, so a visitor who moves focus before the commit is not
pulled back. Each request takes the place of one not yet landed, and what it returns calls off that
request alone. A request asked as the component first draws, from a ref on its own markup or a
child's layout effect, waits for the component's render as any other does. A request still waiting
when its component unmounts, or when an `Activity` hides it, never gets its render, so it is made
then, with where focus was read as it was asked. React tells a hook nothing of which update
unmounted it, so the hook does not try to tell, and `moveFocus` keeps a visitor's place, landing
only where focus is still where it was, has fallen to the page's body or is where the kit has handed
it back since, as record 23 has it. A request in a transition an urgent update overtook therefore
lands before the transition draws, and goes to its fallbacks where the transition draws its target.
Nothing at unmount calls a focus request off, only what it returned or a newer request, so the hook
hands a request no signal of the component's, which that unmount would abort, and a request made in
React's second run in development stays the one a newer request takes the place of. A refusal still
waiting as its form's component unmounts is called off a microtask later, since its form leaves too,
unless React's second run in development has brought the component back. A request asked once the
cleanup has run waits a frame. Where the component's effects have come back by then, as an
`Activity` shown again or React's second run in development brings them, it waits for the
component's render as any request does. Otherwise it has no render to wait for and is made late, as
it was made before the hook waited, but takes focus only from the page's body, whatever `from` it
was given, since where focus stands then is not where the change began, and only where its target is
in sight, so a panel that closes itself and asks after an await still moves focus back to its
opener, a visitor already on the next screen is left there, and a request whose target an `Activity`
hides with the component is held until the component shows. What the hook returns is still the
function's, with `from` read as it is asked, and it is called in a handler or in an effect with
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
hook finds it through context. `StatusProvider` attaches its line through a ref as the line lands,
before the effects of the parts under it run, with the signal its ref makes, as every hook's ref
does, and keeps no controller of its own. Words said before the line is in the page are held, the
last firm and the last polite, and said once it is. The provider waits a microtask only to call off
the moments it set to say held words, where no line is drawn by then. The function `useStatus` hands
out is the provider's own, the same across renders, which says through whichever attach holds the
line, so it keeps speaking after React's second run in development and says nothing once the
provider has gone. `useFormRefusal`, `useBusy` and `useProgress` speak through the page's own `say`
where it gives one, else through the provider's, whichever the latest render gave, kept current in a
layout effect since a form's refusal is made in one.

A form React still draws refuses only through `useFormRefusal`, never through `attachForm` drawing
errors of its own, so each node and attribute of a field has one owner. React draws a field's error,
its id and the control's `aria-describedby` and `aria-invalid` from the field's props, and writes
them again whenever those props change. Where the kit wrote its words into an error React drew,
React's next render could throw a `NotFoundError` on the children the kit had replaced. Where the
kit drew an error of its own and the page then set one, React mounted a second error under the same
id, with the hint between the two, and wrote the control's marks back from its props, so the kit's
error stayed on the screen but went unheard. The markup cannot say whether a renderer will draw a
field again, since the same `InputField` rendered to static HTML and attached from plain script, as
the kit's site draws its refused form, is markup nothing draws again, and there the kit draws its
errors as it does in a page written by hand. So the choice is made where the form is attached.
`useFormRefusal` requires `invalid` and hands the failures to the page, and `attachForm` without it
draws them itself. An attached stepper's failing error is the kit's in a React form too, for every
failure it holds, so the page is handed nothing to draw on it, as record 21 has it. A mark on every
React field that turned the kit's drawing off was weighed and rejected, since it turned it off for
static output too, which left the site's form with no errors and focus on its button. So was an
observer that put the kit's error back after each React render while a refusal stood, since it could
not put back a hint React inserts without moving React's nodes, and following React as it cleared
its error would leave a value the browser still refuses with no error shown.

`hooks.tsx` imports `./controls`, and `react.tsx` imports no effect from React, so the markup
components still render on a server and draw the same markup a page writes by hand.

## Consequences

- Behavior has one home, `./controls`, and one budget, and a hook adds a few lines of wiring rather
  than a second copy of the behavior. Each new attach function adds to the controls budget, which
  the piece that adds it raises by record 13's rule where it must.
- Record 5 is amended: `./react` exports hooks that attach some of the controls, while its markup
  components still carry no stylesheet, set no style and run no effect.
- Record 13 is amended: a React page draws the status line with `StatusProvider`, which `useStatus`
  finds, attaches a form, a busy button, progress and a group of cells and moves focus through a kit
  hook, and the other controls in an effect of its own, and the attach functions are the contract
  both kinds of page share.
- Record 14 is amended: a hook may run a piece's keys or move its focus, while the state a page
  owns, such as the chosen tab, stays the page's, passed to the hook as an option and read back
  through a callback.
- Game Table Tally and ShelfLens delete their own wrappers when they pin the version that carries
  the hooks.
- A React page that attaches a form it still draws with `attachForm` in an effect moves to
  `useFormRefusal` and draws each error from its own state. Game Table Tally refuses that way
  already. The kit's site keeps `attachForm`, since its form is the React components rendered to
  static HTML and attached from plain script, markup nothing draws again.

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
  there.
- `e2e/focus.spec.tsx` runs in Chromium, WebKit and Firefox. It finds focus on the next row as a row
  asking for it is removed at once, after an await, from a timer and in a transition. It finds a
  request whose transition an urgent update overtook landing where focus fell with its component,
  leaving a field the visitor moved to, and going to its fallback where the transition draws the
  target. It finds a request whose component an `Activity` hides landing, in the same press and in a
  later task, and leaving focus the visitor moved before the hide, and a request whose target an
  `Activity` hides with its component held until it shows. It finds a request made in one commit
  landing where the next commit takes its component away, and a field a view asks for from its own
  ref as a press first draws it focused. It finds a request asked after an await by a component that
  has since unmounted moving focus, and one that comes once the visitor is on the next screen
  leaving focus there, whether or not it names that field as where focus was.
- `e2e/strict.spec.tsx` draws the hooks under `StrictMode` in React's development build, which runs
  each ref's cleanup and the ref again as the page first draws, and finds words said in a part's
  first effect kept on the provider's line, the provider's function speaking after that run and a
  new provider's after it is drawn afresh while the old one stays silent, one arrow key moving one
  cell, a busy notice, the end of a progress and a refusal each said once, nothing said once the
  pieces leave, and a ref called with null taking each piece down. It finds a form given back, its
  check and listeners gone, as the ref moves to another form, only the second of two requests a part
  makes as it first draws taking focus, a refusal still waiting as its form leaves saying nothing
  and moving nothing, and a refusal asked as its form first draws landing. With one ref on two forms
  or two rows of cells, it finds the one left still refusing or taking new options whichever is
  taken away, and a failed submit refused through the form submitted. It finds a form behind a ref
  made afresh on every render keeping its check, its errors and its refusal through a failed submit.
  It finds a form, a row of cells and a busy button mid-wait behind arrows that return the hook's
  cleanup keeping their check, their observer and their wait as the page draws again, a busy wait
  and a row of cells kept where another hook joins them through a merged ref, a form and a row of
  cells passed from one hook's ref to another's kept under that hook's options, and either of two
  hooks on one form dropped leaving the other's check and refusal.
- `e2e/form.spec.tsx` draws a field's error again with new words, an address among them, while a
  refusal through `useFormRefusal` stands, in Chromium, WebKit and Firefox, and finds no exception,
  one error with the field's id, shown, described and marked, focus on the field and the refusal
  said once on the screen's status line. `packages/site/e2e/site.spec.ts` refuses the site's form,
  drawn by the React components to static HTML and attached from plain script, and finds both
  fields marked invalid, focus on its first field and that field's name said on the status line.
- `scripts/controls.test.ts` measures every function a page can import from `./controls`, so the
  behavior the hooks wrap is weighed where it lives.
