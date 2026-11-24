# 29. F8 moves focus to a shown toast's action and back

**Status:** accepted in 0.9.4

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
  F6, so a page that takes it takes the visitor's way out of the page.
- **F8 has no default on a page in any engine.** In the dev tools it pauses or resumes a script,
  in Chromium's Sources panel and in Firefox's debugger, which hear it only while the dev tools have
  focus or a script is paused, so a page's keydown and the tools do not meet. On a Mac keyboard the
  top row sends media keys unless Fn is held or the system is set to send function keys, so there it
  is Fn and F8.
- **A screen reader's browse mode may never send the key.** A browse mode, as NVDA's is, keeps
  most keys for itself, so whether a visitor hears a hint and can press F8 to use it waits on a walk
  with NVDA and VoiceOver.

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
on. F8 held with Shift, Control, Alt or Meta, or held down so that it repeats, does nothing, nor does
one a page has handled already, one with no toast shown or with a toast that has no action, or one
where the toast refuses focus, as it does under a modal dialog. The kit prevents the key's default
only where focus moved.

The toast listens for the key on the document only while a message with an action is shown. Its
listener is added as such a message shows, taken off as the toast hides or a message with no action
replaces it, and tied to the toast's signal, so a toast taken down leaves nothing listening. Record
21 turned down a listener on the document for a form, since it heard every press and kept a removed
piece alive. The module's own listener, which it adds as it loads and which hears every keydown in
the capture phase, was weighed and turned down, since it would need a list of shown toasts the
module holds, and it would hear the key ahead of a page that handles F8 itself. The toast's own
listener is the smaller of the two, hears keys only while there is an action to reach, comes after a
page's handlers in the bubble phase, and keeps nothing once the toast hides.

The action carries `aria-keyshortcuts="F8"` while it is shown, which a screen reader may read with
its name, and loses it as the toast hides or a message with no action comes. The reference names the
key. A spoken hint naming the key on the status line waits for a walk with NVDA and VoiceOver, since
a screen reader's browse mode may never send the keydown that would tell the kit a keyboard is in
use.

## Consequences

- A page needs nothing to give F8 to its toast, Game Table Tally's Undo among them.
- A page whose own F8 does something handles it first and prevents its default, and the toast
  leaves that press alone.
- Focus inside a frame sends its keys to the frame's document, so F8 there reaches no toast on the
  page around it.
- With more than one toast on a page, against the reference's one toast to a page, the first
  attached with an action shown takes the key.

## How it is tested

The paths are in `packages/design-kit`.

- `e2e/toast.spec.tsx`, in Chromium, WebKit and Firefox, on a page of many controls before the
  toast, finds focus kept where it was as a message shows, F8 moving it to the action, and Enter
  running the action and Escape dismissing the toast, each with focus back on the control F8 was
  pressed on. It finds F8 in the toast, on the action and on its Close, sending focus back with the
  toast still shown, and F8 with no toast, with no action, with each modifier, as a repeat and after
  a dismiss moving nothing and keeping its default. It finds `aria-keyshortcuts` on the action while
  it is shown and gone after.
- `e2e/leaks.spec.tsx`, in the same engines, counts a listener on the document only while a message
  with an action is shown, one however many such messages come, and none once a message with no
  action replaces it or the toast is dismissed. Its table, shared with `e2e/teardown.spec.tsx`, uses
  the toast with an action, so its takedown is found to take the listener off.
- `scripts/controls.test.ts` holds the controls to their budget.

## Sources

- Radix Primitives, [Toast](https://www.radix-ui.com/primitives/docs/components/toast), read
  2026-11-24.
- W3C, [ARIA Authoring Practices: Alert Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alert/),
  read 2026-11-24.
- Chrome for Developers, [Keyboard shortcuts](https://developer.chrome.com/docs/devtools/shortcuts),
  read 2026-11-24.
- Firefox Source Docs, [Keyboard
  shortcuts](https://firefox-source-docs.mozilla.org/devtools-user/keyboard_shortcuts/index.html),
  read 2026-11-24.
