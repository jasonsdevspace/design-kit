# 15. A toast's attach function returns what shows a message

**Status:** accepted, amended in 0.8.0 for the status line's attach, `attachStatus`, in 0.8.4 for
the panel's, `attachPanel`, in 0.8.5 for the tabindex on a toast's buttons, in 0.9.0 for words that
settle and polite words, in 0.9.2 for a line let go of as `StatusProvider` unmounts, in 0.9.3 for a
`signal` on `attachStatus` and `attachToast`, by record 23 in 0.9.3, under which the line and the
toast are taken down once every signal that holds them has aborted, and by record 27 in 0.9.4, for
the mark a shown toast writes on the body of an app's frame

## Context

An app that saves without asking has to say that it saved and offer a way back, so the kit gained a
toast: a short message over the page with one action, such as Undo. Unlike the theme switch and the
copy button, a toast is not a control a page shows once and leaves in place. A page shows a message
in it each time something happens, and the toast draws nothing between messages. Record 13 has
every attach function show its control and return a function that takes it away again, which does
not fit a piece that is shown only by a message.

A message also has to be heard. A live region added to the page at the moment it speaks may go
unheard, the same words said twice may be heard once, and a visitor who cannot see the toast has
to learn that it holds a way back.

## Options

**A. An attach function that returns what takes the toast away, as record 13 has it, and a second
export that shows a message.** Rejected, since a page would hold two functions for one toast, and
the one it calls on every message would have to be told which toast to show it in.

**B. A function that builds the toast, its region and its buttons, for each message.** Rejected,
since it is markup made by script, which record 13 turned down, and a region built at the moment it
speaks is the one a screen reader may miss.

**C. An attach function that returns what shows a message.** `attachToast` finds the toast's parts
by their classes and returns a function that takes a message and one action or none, and returns
what dismisses that message.

## Decision

Option C. `Toast` draws a place for the message and a status line, both empty, and the action's
button and a close button, hidden. Showing a message sets their text and adds no element. The status
line is out of sight and on the page from the start, says the message with the action's name, as in
"Round 3 saved. Undo is available.", and keeps it until the toast leaves, as the one copy a screen
reader reads, since the words drawn are hidden from it. It is emptied a moment before each message,
so the same words shown twice are heard twice.

A shown toast carries `data-shown`, and `data-rows`, the rows it was measured at, from one to five,
which the sheet keeps room for on a page with no frame. In an app's frame the attach also writes
that count on the frame's body, as `data-toast-rows`, empty for a toast it could not measure, while
the toast floats over the body, and the sheet keeps the body's room by it, as record 27 has it. The
mark is not written while the toast takes its row above the dock, and it comes off as the toast
leaves.

A toast with an action stays until its close button, its action, Escape with focus in it or the next
message dismisses it, since a timer would take the way back from anyone slower than it. One with no
action also leaves after five seconds, a wait held while the pointer is over it or focus is in it.
Focus in a toast that leaves goes back to where it was the last time a message arrived while focus
was outside the toast. It goes back only where it is in the toast, or where the page has taken the
toast away with focus in it so that focus has fallen to the body or to nothing, the rule record 23
gives the toast, the dialog and the panels alike, while focus a visitor has put anywhere else
stays. A toast taken from the page forgets it had focus once the visitor moves focus outside it or
presses while it is off the page, so it never hands focus back over the visitor's own move. What
dismisses a message never dismisses a later one.

The toast's listeners are on its own elements, so a toast taken from the page takes them with it. A
page that takes a toast away while the page stays gives `attachToast` a `signal`, as record 22 has
every attach take, and it is taken down once every signal holding it has aborted, as record 23 has
it. That dismisses the message as its Close does, so focus in the toast, which would drop to the
page's body as its buttons hide, goes back where a dismiss sends it, and the mark on a frame's body
comes off with the message. It takes off the toast's listeners, its observer, its listener on the
window's size and its timer, takes away a tabindex the attach added that the page has not changed
since and lets its line go, and the function the attach returned, and what that returned, do nothing
after. Its behavior ships in the controls module beside the switch's and the copy button's, rather
than in a module of its own, as its rules ship in the components sheet, and the module's budget rose
from 3 KB to 5 KB for it.

## The status line

`attachStatus` returns what says a message on a page's own status line, for a screen that says a
change without moving focus, rather than what takes the line away, for the toast's reason, and
keeps record 13's rule for being called again: a line attached again returns the function it
returned first. Its messages leave after two seconds, where the toast keeps its own until the toast
leaves and a stepper keeps its value on its own line until the next, so each keeps a line of its
own, and a stepper speaking on a page's line leaves it as any message there does. The kit's own
pieces, the copy button, the stepper, the form, a busy button and progress, speak on a page's line
without attaching it, so none of them holds it.

A message is said at once, or once it settles where it asks to wait for its words to stop
changing, and words said in the meantime take its place. A message said politely, as progress and a
busy button's notice are, gives way to firm words said in the same moment or still settling, so a
page's own result said with it is heard in its place, and waits for firm words being said, so it
is said once they leave, however many follow. A polite message given as a function waits for any
words there, and is read as it is put in, so it says nothing once it is no longer true.

A line is let go of as its attach is taken down, a microtask after every `signal` that holds it has
aborted unless it is attached again by then, and as `StatusProvider` unmounts. Letting it go clears
its timers, those that end the moment words were said in among them, drops its words and empties
it, so no piece says anything on it until it is attached again, and a piece's own timers, such as a
busy button's wait, come due saying nothing. A line let go of while still attached, as a toast's
own line is when the toast is taken down, and attached afresh takes its old attach down, so the old
attach's signal holds nothing of it. The function an attach returned says nothing once that attach
is taken down, as record 22 has calls after teardown do, while a piece given the line itself speaks
on its next attach. `StatusProvider` hands its parts a function of its own that calls the line's
current attach, so they keep speaking across React's second run in development, as record 20 has
it.

## Consequences

- A page attaches a toast once and calls what it returns for every message, in React from an effect,
  as it attaches any control.
- Record 13 holds for the switch, the copy button and the stepper. The toast's attach function
  returns something other than what takes it away, and the dialog's does the same for the same
  reason: it returns what opens it, since a page calls that each time and the dialog's listeners
  are on its own element. Each is taken down by its `signal`, as record 22 has every attach.
- A page that shows a message with no action over one with an action takes that way back away, so
  a page shows one after another only once the first is done with.
- A page on which every visitor loads the controls loads the toast's behavior too.
- `attachStatus` is exported for a page's own status line, the line the copy button and the stepper
  speak on without attaching it, with the rules in the section above.
- A panel a button opens is attached by its button, and `attachPanel` returns both what opens or
  closes it and what lets the button go, since a page calls the first from its own code and a
  button can leave the page while its panel stays. It hears its buttons and Closes through one
  listener on the document, early in the press, rather than on the elements themselves, since a
  panel or its Close drawn again would lose a listener of its own and a page's handler that stops
  the press would keep a Close from closing it. The listener comes off once every button is let
  go.
- A toast's Close and its action take `tabindex="0"` where the page set none, so Safari, which
  focuses a pressed button only where it has a tabindex, leaves focus in the toast on a press or a
  tap and focus goes back as it leaves, as record 19 has the kit do for a panel's buttons.

## How it is tested

The paths are in `packages/design-kit`, and that of the budget in the repository's `scripts`.

- `src/controls.test.ts` imports the module in plain Node and finds no export but its functions,
  and `scripts/controls.test.ts` holds what a page's bundler sends of it to its budget.
- `e2e/toast.spec.tsx` serves the toast's markup and the module from an origin of its own, in
  Chromium, WebKit and Firefox, and finds a message drawn and said with its action's name without
  focus moving and with no element added, the same words said again, a toast with an action staying
  and one without leaving on a stand-in clock, that wait held while hovered or focused, focus
  returned where it was, each dismiss kept to its own message, its place above an app's dock and at
  the foot of a page, and no audit findings in either theme.
- `e2e/attach.spec.tsx` serves a screen's own status line and finds each message said on it with no
  element added, the same words said twice reaching it twice, and the line empty once a message has
  been held its time.
- `e2e/status.spec.tsx` and `e2e/shared-line.spec.tsx` say words on a line at once, once they
  settle and politely, and share one line between a busy button, a stepper and progress with
  nothing a visitor must hear lost.
- `src/controls.test.ts` also finds a line let go of and attached afresh take its old attach down,
  leaving nothing on that attach's signal, and a toast missing a part refused whatever its signal.
- `e2e/teardown.spec.tsx`, in Chromium, WebKit and Firefox, attaches a status line and a toast with
  a signal already aborted and finds nothing said or shown, aborts a signal and finds the line
  emptied and silent for the page's function, a stepper and progress, a line those spoke on first
  let go of by the page's signal, a toast taken down with focus on its Close sending focus back
  where it came from and a later message unshown, the tabindex it added taken away and one the page
  set since kept, and a line and a toast kept speaking and showing while a later signal holds them
  and silent once that one aborts. It finds the window's size listened to once for two messages
  shown, and `e2e/leaks.spec.tsx` finds the timers, observers and listeners a line and a toast set
  going all gone after an abort.
