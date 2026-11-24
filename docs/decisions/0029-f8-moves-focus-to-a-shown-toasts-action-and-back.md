# 29. F8 moves focus to a shown toast's action and back

**Status:** accepted in 0.9.4, amended in the same release for a toast the page attaches inside a
frame of its own origin, which hears F8 in the frame's document and reads focus from the page down

## Context

A toast's action, such as Undo, comes after everything in `main` in the Tab order, so a keyboard
user who wants it Tabs through the whole page to reach it. A toast with an action stays until it is
dismissed, as the reference has it, so no time runs out and nothing fails WCAG 2.2 AA, but the route
is long, and longest on the pages that most need a way back, a screen of many controls where one
press removed something.

The ARIA Authoring Practices ask that an alert not affect keyboard focus, and the toast says its
message on a status line for that reason. In Game Table Tally a visitor removes a seat with Enter on
its Remove, the toast offers Undo, and a second Enter on the next seat's Remove would undo the first
removal if the message had taken focus. So the way to the action has to be one the visitor asks
for.

## Research

- **Radix's toast takes F8.** Its viewport's hotkey, F8 by default, focuses the toasts, and its
  label reads "Notifications (F8)". Radix leaves the key's discoverability to the page.
- **F6 is the browser's own.** Chromium and Firefox move between the address bar and the page by
  F6, so a page that takes it takes the visitor's way out of the page. React Aria reaches toast
  regions by F6 among its landmarks, which a kit with no landmark manager cannot do without taking
  the browser's F6.
- **F8 has no default on a page in any engine.** In the dev tools it pauses or resumes a script,
  in Chromium's Sources panel and in Firefox's debugger, which hear it only while the dev tools have
  focus or a script is paused, so a page's keydown and the tools do not meet. On a keyboard whose
  top row sends media or action keys, a Mac's and many laptops' among them, it is Fn and F8, and on
  a Chromebook Search and the top-row key in its place. Without F8 the action is still last in the
  Tab order and stays until dismissed.
- **A screen reader's browse mode keeps its own keys.** A screen reader's browse mode keeps the
  letter and arrow keys it reads with, so the page cannot tell from keydowns that a keyboard is in
  use. NVDA and JAWS pass an unbound F8 to the page, which a walk confirms.

## Options

**A. Focus on the action as a message shows.** Rejected. It breaks the alert's rule, and a visitor
pressing Enter down a list of Removes would undo what they meant to keep removed.

**B. The toast placed next in the Tab order, after the control that raised the message.** Rejected,
since the kit cannot know which control raised a message, and that control is often gone a moment
later, as a removed seat's Remove is.

**C. F6, as the browser's key between panes.** Rejected, since the browser has it, and a page that
takes it strands a keyboard user in the page.

**D. F8, with no modifier and not held, while a toast with an action is shown.** The key Radix
takes for the same purpose, with no default on a page.

## Decision

Option D. F8 pressed anywhere on the page while a toast with an action is shown moves focus to the
action, and pressed with focus in the toast sends focus back where it came from, by the walk a
dismiss hands it back by, with the toast still shown. From the action, Enter and Space choose it and
Escape dismisses the toast, and focus goes back by record 19's rule, to the control F8 was pressed
on. Where nothing on that walk takes focus, F8 in the toast leaves focus where it is. F8 held with
Shift, Control, Alt or Meta, held down so that it repeats, or pressed to convert text in an input
method does nothing, nor does one a page has handled already, one with no toast shown or with a
toast that has no action, or one where the toast refuses focus, as it does under a modal dialog.
With focus in another toast, that toast hears the key and sends focus back. The kit prevents the
key's default only where focus moved.

The toast listens for the key on the document only while a message with an action is shown. Its
listener is added as such a message shows, taken off as the toast hides or a message with no action
replaces it, and tied to the toast's signal, so a toast taken down leaves nothing listening. Record
21 turned down a listener on the document for a form, since it heard every press and kept a removed
piece alive. The module's own listener, which it adds as it loads and which hears every keydown in
the capture phase, was weighed and turned down, since it would need a list of shown toasts the
module holds, and it would hear the key ahead of every page handler. The toast's own listener is
the smaller of the two, hears keys only while there is an action to reach, comes after a page's
handlers on the elements below the document, and keeps nothing once the toast hides.

The action carries `aria-keyshortcuts="F8"` while it is shown, which NVDA and JAWS in Chromium and
Firefox are documented to expose with its name, heard once focus is on the action, so it tells the
way back and not the way there. A sighted keyboard or magnifier user gets no hint from the kit. The
action loses the attribute as the toast hides or a message with no action comes. The reference
names the key. A spoken hint on the status line would reach pointer and touch users too, so it
waits for that walk.

## Consequences

- A page needs nothing to give F8 to its toast, Game Table Tally's Undo among them.
- A page's own F8 handler on an element below the document runs first and wins where it prevents
  the default, while one on the window, or on the document added after the toast showed, runs
  after the kit and checks `defaultPrevented`.
- Focus inside a frame sends its keys to the frame's document, so F8 there reaches no toast on the
  page around it.
- With more than one toast on a page, against the reference's one toast to a page, the toast
  whose message with an action came first since it last had none takes the key from the page, and
  the toast that holds focus sends it back.

## Amendment for 0.9.4: a toast inside a frame

A page can attach its toast to an element inside a frame of its own origin that it drives. The toast
read focus from the page's document and listened for F8 there, where focus anywhere in the frame
reads as the frame and the frame's keys never arrive. So F8 pressed in the frame reached nothing,
and a dismiss handed focus back to the frame rather than to the control in it.

**A. The page's listener follows focus into the frame.** Rejected, since the page would add a
listener to every frame focus enters, and still read focus as the frame.

**B. The toast reads focus in, and listens on, the document it sits in.** Its F8 listener and the
listeners that follow focus are added to the element's own document, and it passes that document to
the focus helpers it calls. Rejected once record 19's amendment for 0.9.4 measured the same reader
on the dialog and the panels: a frame's own record of focus reads as nothing once a visitor moves on
to the page, so a piece in the frame took focus a visitor put on the page for focus fallen to
nowhere, and the page's own controls could not be judged from inside the frame.

**C. The toast reads focus as every piece reads it.** It listens for F8 on the element's own
document and to that document's window for its size, and scrolls that window as it takes its row
above the dock, while focus is kept and compared through the one view record 19's amendment for
0.9.4 sets out: kept as the deep reader gives it, and compared and judged through `seen` for the
toast's own document, so a blank body of that document is nothing, one of another frame reads as
that frame, and focus a visitor put in a frame's blank space or an editor's body is where the toast
goes back to.

Option C. As a message comes, the toast keeps the control that has focus, inside a frame and a frame
within it too, and the frames around it out to its own document, the innermost first, read then
since a frame that loads its page again leaves the control's old document with no window to find
them by. Its walk goes to that control, passed over inside a frame where it is marked off, then to
each of those frames, so focus stays on the frame where the control is gone, marked off or on a page
the frame has replaced, and a frame of another origin, which shows nothing inside, is handed focus
itself. It keeps clear only a control in its own document or in a frame inside it, measured out
through each frame, since one on the page or in another frame is in a view the toast is not drawn
in. The focus the kit notes it handed back is the control in the frame, so a focus request in the
page compares the same view. A toast stays in the document it was attached in, so a page that moves
it into another takes it down and attaches it again. The listeners the controls' shared module adds
as it loads, which note a visitor's presses for a focus request, sit on the page's document and on
that of each frame of the page's own origin, as record 19 has it, so a press in the frame counts for
a focus request as one on the page does, and the toast reads none of them.

## How it is tested

The paths are in `packages/design-kit`.

- `e2e/toast.spec.tsx`, in Chromium, WebKit and Firefox, on a page of many controls before the
  toast, finds focus kept where it was as a message shows, F8 moving it to the action, and Enter
  running the action and Escape dismissing the toast, each with focus back on the control F8 was
  pressed on. It finds F8 in the toast, on the action and on its Close, sending focus back with the
  toast still shown, and F8 with no toast, with no action, with each modifier, as a repeat and after
  a dismiss moving nothing and keeping its default, as does an F8 that converts text in an input
  method. F8 in the toast goes on down the walk where the control focus came from is gone, to the
  main content, stays where nothing takes focus, follows a frame of the page's own origin on to its
  control as a dismiss does, and with two toasts shown is heard by the one that holds focus. It
  finds `aria-keyshortcuts` on the action while it is shown and gone after.
- `e2e/leaks.spec.tsx`, in the same engines, counts a listener on the document only while a message
  with an action is shown, one however many such messages come, and none once a message with no
  action replaces it or the toast is dismissed. Its table, shared with `e2e/teardown.spec.tsx`, uses
  the toast with an action, so its takedown is found to take the listener off.
- For a toast the page attaches inside a frame of its own origin, `e2e/toast.spec.tsx` finds F8 in
  the frame reaching the action and sending focus back to the control in the frame, and Escape
  handing focus back there, to a button the page made and moved into the frame too.
  `e2e/teardown.spec.tsx` finds the takedown taking the frame's listener for F8 off and focus back
  in the frame, and `e2e/leaks.spec.tsx` finds the toast listening to the frame's document and
  window and to nothing more of the page's, and the page and the frame back where they started.
- For a toast on the page, `e2e/toast.spec.tsx` finds focus handed back to the control inside a
  frame of the page's own origin and inside a frame within that frame, and to the frame itself where
  that control is gone, marked off or on a page the frame has since replaced, by the frames the
  toast read as the message came. For a toast the page attaches inside a frame, it finds focus left
  on the page where a visitor moved it as the page dismisses the message.
- `e2e/toast.spec.tsx` also finds a toast inside a frame leaving the page where it is as it shows
  with focus on a control of the page, and sending focus to the main content of the shadow root it
  sits in inside a frame where nothing nearer takes it.
- `scripts/controls.test.ts` holds the controls to their budget.

## Sources

- React Aria, [Toast](https://react-aria.adobe.com/Toast), read 2026-11-24.
- Radix Primitives, [Toast](https://www.radix-ui.com/primitives/docs/components/toast), read
  2026-11-24.
- W3C, [ARIA Authoring Practices: Alert Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/),
  read 2026-11-24.
- Chrome for Developers, [Keyboard shortcuts](https://developer.chrome.com/docs/devtools/shortcuts),
  read 2026-11-24.
- Firefox Source Docs, [Keyboard
  shortcuts](https://firefox-source-docs.mozilla.org/devtools-user/keyboard_shortcuts/index.html),
  read 2026-11-24.
