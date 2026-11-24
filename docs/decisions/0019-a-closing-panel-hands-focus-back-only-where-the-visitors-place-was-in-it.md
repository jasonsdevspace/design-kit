# 19. A closing panel hands focus to its button only where the visitor's place was in it

**Status:** accepted, amended in 0.9.0 for `moveFocus`, which falls back by the same walk, in 0.9.3
for a button let go while its panel is open, and by record 23 in 0.9.3, under which the toast and a
dialog taken down by its signal hand focus back by this rule, in 0.9.4 for a search of the page made
only once every button refuses focus, by record 29 in 0.9.4, under which F8 moves focus to a shown
toast's action and back, and in 0.9.4 for a dialog and a panel the page attaches inside a frame

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

Option C. When a panel closes, however it closes, the kit hands focus to its button where focus is
in the panel, or where focus is on the body or nowhere and the visitor's last place was in the
panel, and leaves focus anywhere else where it is. The visitor's last place is the path, from what
it reached up, of the last focus that moved, by the visitor or by a page's code, or of the visitor's
last press. A path rather than an element, so a Done the page draws away or turns off while it waits
still counts as the panel's. A press by a page's script is not the visitor's and is not kept. The
button focus goes to is the one pressed or the one that opened the panel, else the first attached
button that names it and takes focus, else the first thing after the panel the keyboard reaches by
Tab, else the app frame's body or the page's main content. Where focus goes back and the visitor's
last press was a link in the panel to a place on the same page outside it, one that opens no new tab
and downloads nothing, focus goes to that place instead, since following the link moved the
keyboard's starting point there. The toast and a dialog taken down by its signal hand focus back by
the same rule, focus in the piece, or on the body or nowhere where the piece had it as it left,
which the kit states once, as record 23 has it. F8 pressed in a shown toast sends focus back by the
toast's walk with the toast still shown, as record 29 has it.

`moveFocus`, which moves focus once a change is drawn, falls back by the same walk: where its target
is gone, hidden, inert, disabled or off, focus goes to the first of its fallbacks that takes it and
then to the app frame's body or the page's main content, so a panel and a page fall back alike and
focus never falls to the page. Focus the kit has handed back since a request was asked counts as
free for it, so a request asked as a panel, a toast or a dialog closes still lands, as record 23
has it.

The kit writes `tabindex="0"` on an attached button as it is attached, `tabindex="0"` on a panel's
corner Close and `tabindex="-1"` on the panel as the panel opens or closes and as a press in it
begins, and `tabindex="-1"` on the place a link sends focus to, each where it has none of its own.
It never changes a tabindex a page set, so a toolbar that moves its own tabindex among its buttons
keeps it. Escape with focus in a panel or on its button closes the innermost such panel and marks
the press handled, so a dialog around the panel stays open. It leaves alone an Escape the page has
already handled, one that ends typing in a script such as Japanese, one on a panel's button that is
off, one in a dialog or a popover inside the panel, and one on a search with words in it or on a
combobox or a button whose list or menu is open, where Escape means something of its own.

A panel stays the kit's while an attached button names it. Once the button that opened it is let
go while it is open, by its `detach` or its signal, as record 22 has it, Escape and its Close both
still close it, focus goes back to the first attached button that names it, as above, and the
button let go takes `aria-expanded="false"`, since it no longer follows the panel. A button
attached for it while it is open takes it where no attached button named it, so a button drawn
again keeps it. Once none names it, neither closes it, and the page holds it as it is. Before
0.9.3, the Close closed such a panel while Escape did not, since Escape followed the button that
opened it and the Close any button that named it. The one rule follows the buttons, chosen over
closing the panel as its button is let go, which would move focus and change the page in the
moment a page takes a button away or draws it again.

An option on `set` to hand focus back stays turned down, since every page would have to ask for
it and the drop-in rule has the kit do it.

## Consequences

- A press on a panel's text puts focus on the panel in every engine, with no ring, since the base
  sheet draws none on an element with a tabindex of -1.
- In Safari's default settings the attached buttons and Closes are stops for Tab where the page's
  other buttons are not, as with the libraries that give their buttons a tabindex.
- A panel the page draws again while it is open takes its tabindexes as a press in it begins, before
  Safari decides where the press puts focus.
- Focus handed back scrolls the button into view, where React Aria, Radix, Ariakit and Headless
  UI's popover restore focus without scrolling, since a panel sits in the page's flow and its
  button may be off screen.
- The fallback after the buttons passes over anything with a tabindex of -1, so an open panel
  after the one closing does not take focus in its place. It is the one step that reads every
  element of the page that takes focus, so it is looked for only once the place a link went to and
  every button has refused focus, inside the same walk, and a close whose button takes focus
  searches nothing.
- TalkBack and VoiceOver on iOS are walked on a device before a release that changes this, since a
  focusable panel may be read as one stop, which no browser test shows.

## Amendment for 0.9.4: a dialog and a panel inside a frame

A page can attach its dialog or a panel's button to an element inside a frame of its own origin that
it drives. Both read focus from the page's document, where focus anywhere in the frame reads as the
frame, and the panels listened for presses, focus and Escape on the page's document, which never
hears the frame's. So a dialog in the frame handed focus back to the frame rather than the control
in it that opened it, or to nothing, and a panel's button in the frame did nothing.

**A. The page's listeners follow focus into the frame.** Rejected for the panels as for the toast,
since the page would add listeners to every frame focus enters, and still read focus as the frame.

**B. Each piece reads focus in the document it sits in.** Rejected once built. A frame's own record
of focus reads as nothing once a visitor moves on to the page, so a page's close of a dialog or a
panel in the frame took that for focus fallen to nowhere and pulled focus back into the frame,
against the rule above that focus a visitor put elsewhere stays, and a dialog in the frame opened
from a button of the page's judged its hand back in the frame and passed that button over. Guarding
each case would compute the next option backward.

**C. Focus is read from the page down.** What has focus is followed from the page's document into
each shadow root that holds it and into each frame of the page's own origin that has it, to the
control focused inside or to the frame's body where nothing is, and a frame of another origin reads
as the frame. A frame's record is read only while focus is in the frame, so a control it last
focused is never taken for focus. Focus inside a frame counts as inside a piece that holds the
frame, and a body no one can type in counts as nothing only in the document of the piece asking, the
page's for a focus request asked with nothing, while one in any other document reads as its frame,
as the page read a frame before, so focus a visitor put in another frame's blank space stays theirs.
An editor's body, editable or in design mode, counts as focus wherever it is. Every piece, the
stepper and a focus request read this one view, and the focus the kit notes it handed back is the
control in the frame.

Option C. The dialog finds its opener, an element or an event of the frame's or the page's, from
this view, and hands focus back to an opener in the frame or on the page alike. What had focus as it
opened is kept from the same view, a blank body counting as nothing, and focus on it as the dialog
closes counts as the browser's handback: the engines measured differ there, Chromium leaving focus
on the frame's body, WebKit on the closed dialog's control and Firefox on the page's opener, and
none puts it on the frame's earlier control. A dialog in a frame makes only that frame inert, so a
page that needs the whole view held opens the dialog on the page. A panel's button keeps the
document it was attached in, the listeners every panel shares are added to each document that holds
an attached button and taken off with the last button in it or once that document has lost its
window, and the panel's id, its buttons, the button that opened it and whether it has started are
kept for each document, so a panel of the page and one of a frame that share an id stay apart. Each
stays in the document it was attached in, so a page that moves one into another takes it down and
attaches it again. The listeners the controls' shared module adds as it loads, which note a
visitor's presses for a focus request, stay on the page's document, and neither the dialog nor the
panels read them.

## How it is tested

The path is in `packages/design-kit`.

- `e2e/panel.spec.ts`, in Chromium, WebKit and Firefox, holds each case of the rule: the Close by
  key and pointer, a Done of the page's own that closes at once, waits, turns itself off or is drawn
  away, a link or a router that moves focus before or after the close, a link to a place outside the
  panel, focus the keyboard took out of the panel, a press in one panel that closes another, an
  outer and an inner panel closed by one press, Escape in a panel, on its button, in a field, after
  the page's own handler and in a dialog, the tabindexes the kit writes and those a page set, and,
  in WebKit, the Close tapped on a touch screen and a press on a button of the page's own outside
  any panel leaving it unfocused, so the tests above test Safari's way. Firefox sends Shift and Tab
  from a panel a press focused to the page's body, so in the case where the visitor goes back into
  the panel after a press outside, the test focuses the link itself there, and still finds focus
  handed to the button as the panel closes. It counts the searches of the whole page a close makes,
  none where the button takes focus and one where every button is off, and finds a key that is not
  Escape having its path read no more often with panels attached than with none.
- `e2e/teardown.spec.tsx`, in Chromium, WebKit and Firefox, closes a panel by Escape and by its
  Close alike once the button that opened it is let go, with focus on the first attached button and
  the button let go marked collapsed, by Escape once its button is drawn again, the only one among
  them too, hands it to a button in a shadow root, and closes it by neither once no attached button
  names it.
- For a dialog and a panel the page attaches inside a frame of its own origin, `e2e/dialog.spec.ts`
  finds focus handed back to the button in the frame that opened the dialog, pressed, by Enter or by
  Space, as an answer, Escape or the Close in its corner closes it, to a button the page made and
  moved into the frame too, and to the page's own button that opened it, handed the event, the
  button or nothing, and focus left on the page where a visitor moved it as the page closes the
  dialog. `e2e/panel.spec.ts` finds focus handed back to the button in the frame as the Close,
  Escape, a key on the button or the page's code closes the panel, to a button the page made and
  moved into the frame too, the panel in the frame and the page's panel of the same id kept apart,
  and focus sent to the place a link in the panel jumps to in a frame with an address of its own.
  `e2e/teardown.spec.tsx` finds focus left on the page where a visitor moved it as the page closes
  or takes down a dialog or a panel in the frame, a takedown handing focus back to the dialog's
  opener in the frame, and the listeners coming off the frame's document, and `e2e/leaks.spec.tsx`
  finds both listening in the frame and adding nothing to the page's document or window, the page
  and the frame back where they started, and the panels' listeners off a frame that left the page
  with no takedown.
- For focus a visitor put in another frame, `e2e/focus.spec.ts` finds a focus request leaving an
  editor's body in a frame, editable or in design mode, and `e2e/dialog.spec.ts` finds a dialog of
  the page handing focus back to that editor, a dialog in a frame leaving focus on the page's body
  where a visitor clicked, a dialog of the page taken down with focus on a control in a frame it
  holds handing focus to its opener, and a dialog in a frame inside a frame handing focus to its
  button. `e2e/panel.spec.ts` finds a panel of the page leaving focus in a frame whose blank space a
  visitor clicked, handing focus to its button from a control in a frame it holds, and a panel in a
  frame inside a frame handing focus to its button.
- `scripts/controls.test.ts` holds the controls to their budget.
- `e2e/focus.spec.tsx` moves focus to a target, an id or a fallback once a change is drawn, by the
  walk a closing panel hands focus back by.
