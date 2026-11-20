# 15. A toast's attach function returns what shows a message

**Status:** accepted, amended in 0.8.0 to export the status line's attach function, `attachStatus`,
which returns what says a message, in 0.8.4 for the panel's, `attachPanel`, which returns what opens
or closes it and what lets its button go, and in 0.9.0 for words that settle and polite words, which
give way to firm words said in the same moment or still settling and wait for firm words being said,
and in 0.9.2 for a line let go of as `StatusProvider` unmounts, so nothing more is said on it by any
piece until it is attached again, and in 0.9.3 by record 22, under which `attachStatus` and
`attachToast` take a signal that lets their line or their toast go, as `StatusProvider` lets its line
go, and what they returned does nothing once it has, while what each returns stays as it is

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

A toast with an action stays until its close button, its action, Escape with focus in it or the
next message dismisses it, since a timer would take the way back from anyone slower than it. One
with no action also leaves after five seconds, a wait held while the pointer is over it or focus is
in it. Focus in a toast that leaves goes back to where it was the last time a message arrived while
focus was outside the toast. What dismisses a message never dismisses a later one.

The toast's listeners are on its own elements, so a toast taken from the page takes them with it,
and there was nothing for a page to take away. Its resize listener and its observer outlive it,
though, so since 0.9.3 it takes the signal every attach takes, as record 22 has it, and a page aborts
that rather than calling a function the attach returns. Its behavior ships in the controls module beside the
switch's and the copy button's, rather than in a module of its own, as its rules ship in the
components sheet, and the module's budget rose from 3 KB to 5 KB for it.

## Consequences

- A page attaches a toast once and calls what it returns for every message, in React from an effect,
  as it attaches any control.
- Record 13 holds for the switch, the copy button and the stepper. The toast's attach function
  returns something other than what takes it away, and the dialog's does the same for the same
  reason: it returns what opens it, since a page calls that each time and the dialog's listeners
  are on its own element.
- A page that shows a message with no action over one with an action takes that way back away, so
  a page shows one after another only once the first is done with.
- A page on which every visitor loads the controls loads the toast's behavior too.
- The function the copy button and the stepper speak through is exported as `attachStatus`, which
  returns what says a message on a page's own status line, for a screen that says a change without
  moving focus. Its messages leave after two seconds, where the toast keeps its own until the toast
  leaves and a stepper keeps its value on its own line until the next, so each keeps a line of its
  own, and a stepper speaking on a page's line leaves it as any message there does. A message said
  politely, as progress and a busy button's notice are, gives way to firm words said in the same
  moment or still settling, so a page's own result said with it is heard in its place, and waits
  for firm words being said, so it is said once they leave, however many follow. A polite message
  given as a function waits for any words there, and is read as it is put in, so it says nothing
  once it is no longer true.
  The function returns what says a message rather than what takes the line away, since a line holds
  nothing to take away, and keeps record 13's rule for being called again: a line attached again
  returns the function it returned first.
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
  Chromium and in WebKit, and finds a message drawn and said with its action's name without focus
  moving and with no element added, the same words said again, a toast with an action staying and
  one without leaving on a stand-in clock, that wait held while hovered or focused, focus returned
  where it was, each dismiss kept to its own message, its place above an app's dock and at the foot
  of a page, and no audit findings in either theme.
- `e2e/attach.spec.tsx` serves a screen's own status line and finds each message said on it with no
  element added, the same words said twice reaching it twice, and the line empty once a message has
  been held its time.
- `e2e/status.spec.tsx` and `e2e/shared-line.spec.tsx` say words on a line at once, once they
  settle and politely, and share one line between a busy button, a stepper and progress with
  nothing a visitor must hear lost.
