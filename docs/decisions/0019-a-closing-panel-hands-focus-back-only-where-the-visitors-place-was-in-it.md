# 19. A closing panel hands focus to its button only where the visitor's place was in it

**Status:** accepted

## Context

`attachPanel` hides a panel on a press of its button or its corner Close, and when a page calls
`set(false)`. Focus on something in a panel that hides is lost, and the keyboard and a screen
reader start again from the top of the page. A panel is a disclosure, not a dialog: it takes no
focus as it opens and holds none while open, so focus may be anywhere when it closes, the body
among them while a visitor reads. A close can come from the Close, from a Done of the page's own
that waits on a save or draws itself away, from a link whose router moves focus, from another
panel or from a timer, and the kit cannot tell from the call whether a visitor meant it.

Safari does not focus a button a pointer presses unless it has a tabindex of its own. It focuses
the nearest ancestor that takes focus, such as a main or an app frame's body with a tabindex of
-1, else nothing. Chromium, and Firefox since its version 88, focus the pressed button. Four rules
tried for 0.8.5 each failed a case. Moving focus only where it was in the panel left Safari's
press of the Close on the body. Handing it back for the Close alone left a Done of the page's own
on the body. Taking any focus on the body as lost pulled a visitor back to the button when a page
closed the panel on a timer. Counting focus on what holds the panel as the panel's, after a click
in it, pulled focus back from a main a router had focused, and from where the keyboard had gone
since.

React Aria, Radix and Ariakit decide from where focus is, and whether the visitor pressed or
focused something outside, as the close happens, and Headless UI's `close` hands focus to the
button every time. None of them treats a close from code or a late one differently. React Aria's
`FocusScope` restores focus only where it is inside the scope, or on the body after being in it.
Radix's and Ariakit's popovers hand it back unless the visitor interacted outside, and Ariakit's
also unless focus is on something outside other than the body. For Safari, React Aria's
`useFocusable` and Ariakit's `Focusable` give the buttons they draw an explicit tabindex, since
WebKit, from Safari 17, lets a pressed form control take focus once its tabindex is set
(`HTMLFormControlElement::isMouseFocusable`). React Aria stopped focusing on pointerdown, since it
broke drag and drop, `:active` in Firefox and `:focus-visible` on a click.

## Options

**A. The path of the last click, with focus on what holds the panel counted as the panel's.**
What the earlier 0.8.5 changes built. Rejected, since a router's focus on a main that holds the
panel, after a click in it, read as focus lost and was pulled back, and so was focus the keyboard
took out of the panel and lost, because a path kept from clicks alone does not see focus move.

**B. A flag set by a press or focus outside the panel, handing focus back on the body unless it
is set.** What Radix's and Ariakit's popovers do. Rejected for a panel, since a popover takes
focus as it opens and a panel does not: a visitor reading the page by a screen reader's swipe or
browse cursor fires no press and no focus, so a page's close on a timer would pull them back to
the button.

**C. A panel that takes focus, and one rule decided by focus as the panel closes.** The kit gives
the panel a tabindex of -1, so a press in it leaves focus in it in every engine, and keeps the
path of the last focus or press as evidence that the visitor's place was in the panel.

## Decision

Option C. When a panel closes, however it closes, the kit hands focus to its button where focus
is in the panel, or where nothing has focus and the visitor's last place was in the panel, and
leaves focus anywhere else where it is. The visitor's last place is the path, from what it reached
up, of the last focus that moved, by the visitor or by a page's code, or of the visitor's last
press. A path rather than an element, so a Done the page draws away or turns off while it waits
still counts as the panel's. A press by a page's script is not the visitor's and is not kept. The
button focus goes to is the one pressed or the one that opened the panel, else the first attached
button that names it and takes focus, else the first thing after the panel the keyboard reaches
by Tab, else the app frame's body or the page's main content. Where focus goes back and the
visitor's last press was a link in the panel to a place on the same page outside it, focus goes
to that place instead, since following the link moved the keyboard's starting point there.

The kit writes `tabindex="0"` on an attached button as it is attached, `tabindex="0"` on a
panel's corner Close and `tabindex="-1"` on the panel as the panel opens or closes, and
`tabindex="-1"` on the place a link sends focus to, each where it has none of its own. It never
changes a tabindex a page set, so a toolbar that moves its own tabindex among its buttons keeps
it. Escape with focus in a panel or on its button closes the innermost such panel and marks the
press handled, so a dialog around the panel stays open. It leaves alone an Escape the page has
already handled, and one on a search with words in it or on anything else marked expanded, such
as a combobox with its list open, where Escape means something of its own.

An option on `set` to hand focus back stays turned down, since every page would have to ask for
it and the drop-in rule has the kit do it.

## Consequences

- A press on a panel's text puts focus on the panel in every engine, with no ring, since the base
  sheet draws none on an element with a tabindex of -1.
- In Safari's default settings the attached buttons and Closes are stops for Tab where the page's
  other buttons are not, as with the libraries that give their buttons a tabindex.
- A panel the page draws again while it is open keeps no tabindex, nor does its Close, until its
  next opening or closing, so until then a Safari press on its Close or on a button in it leaves
  focus on what holds the panel rather than handing it to the button.
- Focus handed back scrolls the button into view, where React Aria, Radix, Ariakit and Headless
  UI's popover restore focus without scrolling, since a panel sits in the page's flow and its
  button may be off screen.
- The fallback after the buttons passes over anything with a tabindex of -1, so an open panel
  after the one closing does not take focus in its place.
- TalkBack and VoiceOver on iOS are walked on a device before a release that changes this, since a
  focusable panel may be read as one stop, which no browser test shows.

## How it is tested

The path is in `packages/design-kit`.

- `e2e/panel.spec.ts`, in Chromium and WebKit, holds each case of the rule: the Close by key,
  pointer and touch, a Done of the page's own that closes at once, waits, turns itself off or is
  drawn away, a link or a router that moves focus before or after the close, a link to a place
  outside the panel, focus the keyboard took out of the panel, a press in one panel that closes
  another, an outer and an inner panel closed by one press, Escape in a panel, on its button, in a
  field, after the page's own handler and in a dialog, the tabindexes the kit writes and those a
  page set, and, in WebKit, a press on a button of the page's own outside any panel leaving it
  unfocused, so the tests above test Safari's way.
- `scripts/controls.test.ts` holds the controls to their budget.
