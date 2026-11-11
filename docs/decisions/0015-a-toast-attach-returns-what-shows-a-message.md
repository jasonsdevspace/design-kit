# 15. A toast's attach function returns what shows a message

**Status:** accepted

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
and there is nothing for a page to take away. Its behavior ships in the controls module beside the
switch's and the copy button's, rather than in a module of its own, as its rules ship in the
components sheet, and the module's budget rose from 3 KB to 5 KB for it.

## Consequences

- A page attaches a toast once and calls what it returns for every message, in React from an effect,
  as it attaches any control.
- Record 13 holds for the switch and the copy button. The toast is the one control whose attach
  function returns something other than what takes it away.
- A page that shows a message with no action over one with an action takes that way back away, so
  a page shows one after another only once the first is done with.
- A page on which every visitor loads the controls loads the toast's behavior too.

## How it is tested

The paths are in `packages/design-kit`.

- `src/controls.test.ts` imports the module in plain Node, finds no export but its functions, and
  holds it with the theme module, without comments, to its budget.
- `e2e/toast.spec.tsx` serves the toast's markup and the module from an origin of its own, in
  Chromium and in WebKit, and finds a message drawn and said with its action's name without focus
  moving and with no element added, the same words said again, a toast with an action staying and
  one without leaving on a stand-in clock, that wait held while hovered or focused, focus returned
  where it was, each dismiss kept to its own message, its place above an app's dock and at the foot
  of a page, and no audit findings in either theme.
