# 19. A closing panel hands focus to its button only where the visitor's place was in it

**Status:** accepted, amended in 0.9.0 for `moveFocus`, which falls back by the same walk, in 0.9.3
for a button let go while its panel is open, and by record 23 in 0.9.3, under which the toast and a
dialog taken down by its signal hand focus back by this rule, in 0.9.4 for a search of the page made
only once every button refuses focus, by record 29 in 0.9.4, under which F8 moves focus to a shown
toast's action and back, and in 0.9.4 for a dialog, a panel, a stepper, a form and a group of cells
the page attaches inside a frame, a focus request asked with focus inside one, the presses and keys
inside one that a focus request hears, a press cleared as focus enters a frame nothing can hear, and
an id a focus request looks for in each root outward from where focus was, and in 0.9.5 for the
presses and keys inside a closed shadow root the kit has read focus in, heard on the root with the
control pressed, so a view a press there draws for the first time reads where focus was through that
control, and for a submit inside an open shadow root, heard on the root once focus has entered it,
as the kit loads where focus already sits in it, on the page or in a frame of its own origin, once
a key or a click has passed through it, or once the kit reads focus through a node in it, an open
root inside a closed one the kit hears among them, since a submit never leaves the root its form is
in

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

A page can attach its dialog, a panel's button, a stepper, a form or a group of cells to an element
inside a frame of its own origin that it drives. Before 0.9.4, each read focus from the page's
document, where focus anywhere in the frame reads as the frame, and the panels listened for presses,
focus and Escape on the page's document, which never hears the frame's. So a dialog in the frame
handed focus back to the frame rather than the control in it that opened it, or to nothing, a
panel's button in the frame did nothing, a stepper hid the button that had focus as its value turned
read only and handed nothing back as it was taken down, and a group of cells found none of the
frame's cells, so it gave the group no stop and its arrows moved nothing. A focus request compared
focus as the page sees it, so a visitor's move between two controls of a frame read as no move and
the request took focus from them. The form and the group also told the frame's controls by the
page's own classes, which a frame's are not, so a form in the frame let a submit through with
nothing checked. The listeners that note a visitor's presses for a focus request sat on the page's
document alone, so a key inside a frame left a press on the page standing for a view to take focus
from where the visitor went on, and a press inside a frame never counted, so the view it brought
took no focus. A focus request looked its id up only in the root where focus was, so a widget's
button in a shadow root that asked for a heading in the page's markup found nothing and focus fell
to the page's main content, and a request asked with focus in a frame inside a shadow root looked
only in that root.

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

Pieces inside a frame of the page's own origin, and the presses a focus request hears there, were
weighed apart.

**D. The page's listeners follow focus into the frame.** Rejected for the panels, as record 29
rejects it for the toast, since the page would add listeners to every frame focus enters, and still
read focus as the frame. Turned down alone for the listeners that note presses, for another reason:
a frame that loads another page while focus stays in it, as a form sent inside it does, is entered
by no move of focus, and a page script's click in a frame focus never entered moves none either, so
each would go unheard. Adopted for them on top of the walk of the window tree and the read after a
frame's page goes, below, since it reaches the frames those miss, a frame inside an open shadow root
and a frame whose page is still loading as focus enters it.

**E. Each piece reads focus in the document it sits in.** Rejected once built. A frame's own record
of focus reads as nothing once a visitor moves on to the page, so a page's close of a dialog or a
panel in the frame took that for focus fallen to nowhere and pulled focus back into the frame,
against this record's rule that focus a visitor put elsewhere stays, and a dialog in the frame
opened from a button of the page's judged its hand back in the frame and passed that button over.
Guarding each case would compute the next option backward.

**F. The public `activeOf` reads from the page down, and every read uses it.** Rejected once built.
Focus followed into frames is right for a piece that keeps a place to hand back to, but a focus
request's `from` came from it too, so a request asked with focus in a frame looked its id up in the
frame, and values stored through the deep reader were compared through a view that took any blank
body for nothing in the asker's document, so a request dropped where a frame left the page and a
walk ended where focus fell to the page's body. A public function that reads deep could not be taken
back once a release shipped it.

**G. Focus is kept as it is and compared and judged through one view.** One private reader follows
focus from the page's document into each shadow root that holds it and into each frame of the page's
own origin that has it, an object showing a document among them, to the control focused inside or to
the frame's body where nothing is, and a frame of another origin reads as the frame. A frame's
record is read only while focus is in the frame, so a control it last focused is never taken for
focus. What the kit stores, the focus it notes it handed back, what had focus as a dialog opened and
where focus was as a request was asked, is that element as it is, except that a blank body is kept
as `seen` reads it for the piece's own document. Every comparison reads both sides through `seen`,
for one document, and nowhere means `seen` reads null for the asker's: a piece asks for its own
document and a focus request for the document where focus was as it was asked. Through `seen`, a
body no one can type in is nothing in that document, an element of the document or of one around it
is itself, and an element of any other frame, one the document holds or one beside it, reads as the
frame that holds it at the document's level, so focus a visitor put in another frame's blank space,
or on the page around a frame, stays theirs. An editor's body, editable or in design mode, counts as
focus wherever it is. The walk that hands focus back counts focus fallen to any blank body as no
move of the page's. `activeOf` stays as 0.9.3 had it, followed into shadow roots only, and stays
public for a page that passes `from` itself, while no part of the kit calls it. A request finds its
id and the home it falls back to from the page's view of where focus was, the frame where focus was
in one. The id is looked for in the root that view sits in, then in each root around it out through
the hosts to the page's document, in one walk from the one read of focus, so a widget's own id wins
over the same id on the page and a widget's button that asks for a heading in the page's markup
finds it. A frame inside a shadow root starts the walk in that root, and focus inside a closed
shadow root reads as its host, so with no `from` the walk starts in the root the host sits in and
finds no id inside the closed root. Focus inside a frame of the page's origin held by one of another
origin is read through the frames the page reaches by their windows, and an element there is seen at
the page's level as the frame of another origin that holds it, which the reader keeps by its window
as it goes through, so one inside a closed shadow root is found too. The inner frame that has focus
is the one whose document says so, which none does while the browser's window has no focus, so focus
there reads as the frame of another origin until it has. Reading the last focused element of each
inner frame instead was turned down, since it would take a control the visitor left for focus. A
piece that holds an element inside a closed root reads focus inside that root through it, so a
request given such an element as `from`, a stepper, a form's refusal, a panel, a theme switch and
the hooks there compare focus where it is rather than at the host, and views brought by one press
are ordered as the page draws them, through shadow roots. The kit also hears the presses and keys
inside each closed root it has read focus in, by listeners on the root itself, since the kit's
listeners on the page's document hear only the host, and a press keeps the control it was made on,
so a view a press there draws for the first time reads where focus was through that control as it
renders, before anything in the view can take focus. Following every read made with no node into the
roots the kit has heard was turned down, since what a read sees would then hang on which piece read
first. Patching `attachShadow` was turned down, since it misses a root attached before the kit
loads, and so was an entry a page calls to hear a root, since a piece is a drop-in a page calls
nothing more to use. Reading again as the heading attaches was turned down, since it takes a field
the view focuses above its heading for the visitor's place. Looking in the page's document first was
turned down, since it let the page's id win over the widget's own. The cost is that a widget's id
missing from its own root as the request lands, one the widget has not drawn yet, finds an element
of the page that shares it, where the request fell back before. A late request from
`useFocusAfterDraw` looks an id up by the same walk, from where focus was as it was asked. The walk
ends at the root that is no shadow root, told by its node type, since a document's named elements
answer for `'host' in` it, so a page with a form named host held the walk forever.

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

For pieces inside a frame, option G. The dialog finds its opener, an element or an event of the
frame's or the page's, from the deep reader, and hands focus back to an opener in the frame or on
the page alike. What had focus as it opened is kept as the deep reader gives it, a blank body of the
dialog's document or one around it counting as nothing and one of another frame as that frame, and
focus that reads the same through `seen` as the dialog closes counts as the browser's handback: the
engines measured differ there, Chromium leaving focus on the frame's body, WebKit on the closed
dialog's control and Firefox on the page's opener, and none puts it on the frame's earlier control.
A dialog in a frame makes only that frame inert, so a page that needs the whole view held opens the
dialog on the page. A panel's button keeps the document it was attached in, the page's where that
document has no window, as a template's copy has before the page takes it in, the listeners every
panel shares are added to each document that holds an attached button and taken off with the last
button in it or once that document has lost its window, and on a closed shadow root that holds an
attached button, since the page sees a press, focus or a key there only as one on the host, and the
panel's id, its buttons, the button that opened it and whether it has started are kept for each root
that holds a panel, a document or a shadow root, found from the button's own root out through each
host as the button is attached and kept from then on, so no read moves state between roots, and a
panel of the page and one of a frame or of a widget's shadow root that share an id stay apart. A
screen reader follows `aria-controls` only within one root, so a button that names a panel in
another root is heard with its expanded state alone. The stepper and a group of cells read focus
through `seen` for the document they sit in, the page's where it has no window, so a stepper keeps a
button with focus shown as its value turns read only and hands focus to its value or itself in the
frame as it is taken down, and a group hands focus on where focus fell to the frame's body. The
form, the group and a table's frame tell a control by its name and an element by its node type
rather than by the page's classes. Each stays in the document it was attached in, so a page that
moves one into another takes it down and attaches it again.

A focus request reads focus once, as it is asked, and keeps two views of that one read: the element
as the deep reader gives it, or the one a page passes as `from`, as the dialog and the toast keep a
place, and the page's view of it through `seen`, the frame where that element sits in one. It
compares the element in the document it sits in while that document is still the one its frame
shows, so a move between two controls of a frame counts as the visitor's and the request drops.
Where the frame has left the page or loaded another page since, it compares the page's view in the
page's document, as 0.9.3 compared every request. The window is asked for its document, since
Firefox still gives the window of a document its frame has left. One rule stands around that view: a
body no one can type in that `seen` reads as itself, which is only one of a document around the
request's, the page's around the frame, counts as free for the request, as the page's own body
always has, since Chromium drops focus to the page's body from a frame the page hides while a
request asked inside it waits. The pieces keep that body as elsewhere, so a visitor's click on the
page around a frame still stays theirs as a piece in the frame closes. The React hooks take where
focus was from the request's module as they ask, so they read no focus of their own.

The listeners the controls' shared module adds as it loads, which note a visitor's presses for a
focus request, sit on the page's document and on the document of each frame of the page's own origin
it reaches, beside a listener for each frame's load on each of those documents, and on the window of
each, one for its blur and, on a frame's, one for its page going. The module finds frames by one
walk of `window.frames` from a window down, which reaches an `object` and a `frame` as an iframe,
Firefox's `object` among them, and a frame of the page's origin held inside one of another origin,
whose window the walk passes through without reading. It walks the page's tree as it loads and a
frame's at that frame's load, a frame of another origin's included, so a frame a page script clicks
in before focus enters it, focus already in a frame as the module loads and a frame written with
`open()`, `write()` and `close()` are heard, the last from the load its `close()` gives. It walks
the whole tree again at once whenever a heard window loses focus while the page keeps it, as focus
moves into a frame, out of one or between two, by a click or a key, which comes ahead of the click
that moved it in every engine measured, so a frame added later or one whose page is still loading is
heard before that click. That holds too for a frame of the page's origin inside one of another
origin whose own load is still to come, and the press made there stands, since the read on the same
blur, below, goes through the frame of another origin to the inner frame that has focus, which it
hears with each frame around it, rather than ending at the outer frame and clearing the press as
focus in a frame nothing can hear. A frame inside an open shadow root is not in `window.frames`, and
its load goes no further than that root, so on the same blur focus is read through the one reader in
a microtask, or a task later where the microtask finds the body of the window that lost focus, as
Firefox gives it during the blur by the order of the HTML standard's focus update steps, and the
frame the read ends in is heard with each frame around it. A heard frame's window is read once more,
a task after its `pagehide`, which found the next document in every engine measured, before its
load, and that document is heard then, since no event hands the page a frame's next document. A read
that still finds the old document leaves the next page to its load, as every frame was heard before,
a frame taken from the page is passed over, a page brought back from the back and forward cache
shows the document it had, heard already, and each read is made in a try. Focus is read only as it
enters a frame and where a frame's next page shows no document, through the one reader, which sits
in the shared module beside the presses so the module that hears them reads focus without the rest
of the focus module, and the focus module gives it again. The listeners are the module's one set,
the same functions on each document and window, which the DOM keeps once however often one is
reached, rather than a set of documents already heard, since `open()` takes every listener off a
document that stays the same object, which such a set would never hear again. They go with a
document its frame leaves or replaces, tell an event by its type and its target by its node type,
and pass over a keydown with no key, as autofill sends. Neither the dialog nor the panels read them.
Listeners for inputs on a frame's window, which outlives the first blank page a frame shows, were
tried for a frame's page before its load and are not used, since they reach only a frame the module
found while it was blank, and only its first page, while the walk on blur and the read after
`pagehide` reach a frame found later, each next page and a frame inside an open shadow root. The
module hears every such frame rather than a frame a piece is attached or a request is asked in,
which would miss the first press there, and a separate entry a page calls to hear frames was turned
down for the same reason.

A press is meant to stand only while the page can hear what follows it. Where a heard window loses
focus while the page keeps it, and the read ends on a frame that shows no document, one of another
origin or one sandboxed without `allow-same-origin`, the standing press is cleared as the read ends
there, as a key that moves focus clears it, counted as an input so a focus request called off cannot
hand it back. Where the read ends on an element of that window that is no body, as the host of a
closed shadow root is, it is cleared a task later, and only if the page still has focus then, since
a browser may still say the page has focus during the blur as the visitor switches to another app or
a sheet for a payment, a passkey or a file opens over the page, and nothing inside such a frame is
heard in the meantime. It is never cleared on the body of the window that lost focus, which Firefox
reads during the blur, or as focus leaves the browser window. Where the read had to wait a task to
find a frame inside an open shadow root, a click in it may have come first unheard, so the press is
cleared as that frame is heard, but only where no input has been heard since the blur, so a press in
a frame heard before, made with no pause between down and up as a tap in Firefox on Android or a
screen reader's default action makes it, stands. A heard frame whose next page is of another origin
clears it too where focus reads as that frame, as a card form sent to a bank's check does. Clearing
on every entry into a frame was turned down, since a page script focusing a frame of the page's own
origin would clear it too. A mousedown on the scrollbar of a frame of another origin leaves focus on
the page in Chromium and WebKit, measured with a scrollbar drawn beside the content and held by a
test, so a press stands through a scroll there as through a scroll on the page. Firefox draws its
scrollbars over the content in a run with no screen, where a press at a frame's edge lands in the
frame, focuses it and clears the press, so whether a scrollbar Firefox draws beside the content
takes focus was not probed, and no test holds it.

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

Nearly every gap left in the frames a focus request hears fails safe, losing a press rather than
leaving one standing. Two do not:

- A frame in a closed shadow root entered from a heard frame, or entered from the page where a frame
  of the page's origin holds that closed root, leaves the press standing. The read ends on a host
  that is not in the window that lost focus, and nothing tells a closed host from an element the
  page moved focus to, so no guess is made.
- A frame rewritten with `open()` leaves the press standing while it is being written. Its document
  lost its listeners and is heard again from the load its `close()` gives.

What no fix reaches, each failing safe:

- A panel the page draws after attaching its button, in a root other than the one the button's panel
  was found in as it was attached, or the button's own where none was, is never found. Finding it
  would move the panel's state between roots inside a read, with every caller bound to read in
  order. A page attaches the button once its panel is drawn.

- A press inside a frame in a closed shadow root never counts. Nothing reaches its document, it is
  not in `window.frames`, and its load stays inside the root. Entering it from the page only clears
  the press. The only spec work near it, whatwg/dom#1287, would report a root being attached, not
  open it.
- A press inside a closed shadow root the kit has not read focus in reaches the page as a press on
  its host, which is no control, so the view it brings takes no focus. In a widget whose first node
  the kit reads through is in the view a press brings, that is the first press.
- A form a script submits inside an open shadow root that focus has not entered since the kit
  loaded, that no key or click has passed through and that holds no node the kit reads focus
  through never counts, since nothing tells the page the root is there before the submit, and a
  submit stays inside the root. So does a form inside an open root within a closed root the kit has
  not read focus in, whose inputs the page sees only as made on the closed root's host.
- A toast on the page that had focus inside a closed shadow root hands it back to the host, which
  takes none, so it goes on to the main content.
- In Firefox alone, a page script that moves focus to an element of the page just after focus enters
  a frame clears the press, since the read a task later ends on that element, which cannot be told
  from a closed shadow root's host.
- Nothing inside a frame of another origin is heard, as the HTML standard intends, and no proposal
  stands against it. A frame sandboxed without `allow-same-origin` counts as one. Entering it clears
  the press, so a press inside it never brings focus, and a `moveFocus` the page makes from it can
  still take focus from a field the visitor moved to inside it.
- A frame of the page's origin held inside a frame of another origin is heard as the controls load,
  at the outer frame's load and whenever a heard window loses focus while the page keeps it. One the
  outer frame adds after its load stays unheard until then, so a move into it from the frame of
  another origin around it or beside it goes unheard. The press was cleared as focus entered that
  frame.
- A page script's `click()` in a frame's page before its load, where focus never entered the frame
  and the frame's page before it was never heard, as in a frame the page adds after the controls
  load.
- A frame's next page where the read a task after `pagehide` still finds the old page, which probes
  never saw, and the next page of the page's origin after a page of another origin, as on the return
  from a bank's check, since no listener sits on a window of another origin. Each is heard from its
  load.
- A mousedown on the scrollbar of a frame that shows no document, where the scrollbar is drawn over
  the content, as Firefox draws it in a run with no screen, lands in the frame and focuses it, which
  clears the press, since a scroll there cannot be told from a click.
- A page script, or the frame itself, focusing a frame that shows no document clears the press.
- A screen reader's virtual cursor moving anywhere, on the page or in a frame, fires nothing, so a
  press stands while the visitor reads on, as on the page.
- Focus leaving the browser window cannot be shown in a run with no screen, so it rests on the
  standard.

## How it is tested

The path is in `packages/design-kit`.

- `e2e/focus-grid.spec.tsx`, in Chromium, WebKit and Firefox, runs each place focus can be against
  each piece that reads it, with each square's answer, the places a page cannot draw in, and each
  square that fails with the wrong answer its cause gives.
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
  handed to the button as the panel closes. It finds a close walks the page for what follows the
  panel where every button is off, stopping at the first stop that takes focus, and not where the
  button takes focus, and finds a key that is not Escape having its path read no more often with
  panels attached than with none.
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
- For focus a visitor put in another frame, `e2e/focus.spec.tsx` finds a focus request leaving an
  editor's body in a frame, editable or in design mode, and `e2e/dialog.spec.ts` finds a dialog of
  the page handing focus back to that editor, a dialog in a frame leaving focus on the page's body
  where a visitor clicked, a dialog of the page taken down with focus on a control in a frame it
  holds handing focus to its opener, and a dialog in a frame inside a frame handing focus to its
  button. `e2e/panel.spec.ts` finds a panel of the page leaving focus in a frame whose blank space a
  visitor clicked, handing focus to its button from a control in a frame it holds, and a panel in a
  frame inside a frame handing focus to its button.
- `e2e/shadow.spec.ts`, in Chromium, WebKit and Firefox, opens a widget's own panel beside its
  button inside an open shadow root and closes it by its corner Close and by Escape with focus back
  on its button, the page's panel with the same id untouched, hands focus on past the widget to the
  page's next control where its button is off, and starts a panel open as a button drawn again says
  once the one before it left the widget, and the focus grid opens and closes by Escape a panel
  inside a closed shadow root. It submits a form inside an open shadow root by Enter in its field,
  by Enter or Space once focus is on its submit button, by a pointer on that button, by a script
  after a click in the root, by a script after focus entered an open root inside a closed one, by
  its own field once a code is filled in with no key or click, by a script where its field had focus
  before the kit loaded, on the page and in a frame, and by a script beside a heading the kit reads
  focus through, and finds the view the submit draws for the first time taking focus each time. A
  form a script submits in a root focus never entered brings its view with no focus, and the next
  submit after a click there brings focus. It also brings a view by a press inside a closed shadow
  root and finds its `useArrivalFocus` heading taking focus as the view first draws, focus left
  where the visitor moved first, a field the view focuses above or below its heading keeping focus,
  no focus taken once a Tab or a click on nothing follows the press, and, in a widget the kit was
  never handed a node of, no focus for the first press and focus from the next.
- `e2e/seen.spec.ts`, in Chromium, WebKit and Firefox, reads `seen` as a pure function over a page
  with a frame, a frame inside it, a frame beside it and a frame taken from the page, for an asker
  in each, and finds a kept place reading the same as the element, and the walk going on past a
  place in a frame whose own listener drops focus to the page's body. `e2e/focus.spec.tsx` finds a
  request asked with focus in a frame finding its id on the page and landing after the frame leaves
  the page, `e2e/toast.spec.tsx` a request landing as a toast hands focus back to a frame whose
  control has gone, and `e2e/dialog.spec.ts` a dialog of the page handing focus back to its opener
  in a frame where focus is handed to that frame with nothing in it. `scripts/controls.test.ts`
  finds that outside the focus module only the dialog, the toast and a focus request call the deep
  reader or the place it gives by name, beside the focus module and the shared one it sits in, so
  every other module reaches the deep read only through `seen`, as `seenNow`, `isFocused` and
  `mayHandBack` give it.
- For a stepper, a form, a group of cells and a focus request inside a frame,
  `e2e/stepper-takedown.spec.tsx`, in Chromium, WebKit and Firefox, finds a stepper's focused button
  kept shown as its value turns read only and focus handed to its value or its box in the frame as
  it is taken down. `e2e/form.spec.tsx`, in the three engines, finds a refused submit in the frame
  moving focus to the field in error, the kit's error drawn in the frame and describing the field,
  and the page's status line saying the refusal. `e2e/roving.spec.tsx`, in Chromium and WebKit,
  finds a grid in the frame taking its one stop and moving by its arrows, and focus handed on to the
  next cell where the one with focus is taken out, in a frame whose body can be typed in too.
  `e2e/table.spec.ts`, in the three engines, finds a link in a table inside the frame brought out
  from under its pinned column as the keyboard reaches it.
- `e2e/focus.spec.tsx`, in the three engines, finds a heading on the page that a widget's button in
  an open shadow root asks for by id taking focus as its view arrives, a widget's own id found in
  its shadow root before the same id on the page, a button in a nested shadow root finding the id in
  the root around it before the page's and an id only the page holds on the page, a request from a
  closed shadow root read as its host finding the page's element of an id the closed root shares and
  none of the closed root's own, a request asked with focus in a frame inside a shadow root finding
  its id on the page, a late request from `useFocusAfterDraw` by a component in a shadow root since
  gone finding an id only the page holds, and a page holding a form or a frame named host finding
  its id past one it lacks, with no hang and no page error. The open, the nested, the frame and the
  late request failed before the walk reached them, the own id and the nested failed against a walk
  that looks in the page's document first, and the named host held the page or threw.
  `scripts/controls.test.ts` finds no module of the controls asking `'host' in` a root.
- `e2e/focus.spec.tsx`, in the three engines, finds a request asked from one control of a frame
  leaving focus on another of that frame that the visitor moved to, asked through `moveFocus`,
  through `useFocusAfterDraw` and as a view's arrival through `useArrivalFocus`, a request given a
  control in a frame as `from` finding its id on the page, a request asked from inside a frame that
  loads another page before the request lands still landing, and a request asked from inside a
  frame the page hides landing where Chromium drops focus to the page's body.
- `e2e/focus.spec.tsx`, in the three engines, finds focus left in a frame where the visitor tabbed,
  or clicked a field and typed, after a press on the page that brought a view, and a view's heading
  taking focus as it arrives for a press inside a frame, a frame that loaded another page, a frame
  the page added inside a frame, a frame of the page whose page is still loading, a frame the page
  wrote with `open()` and an object showing a page of the page's origin, served by a server of the
  test's own, since Firefox loads an object's page past a test's routes. It finds a keydown with no
  key, sent on the page and in a frame, throwing nothing and counting for no input, and the frame's
  document heard once however often its frame is reached, with nothing more added to the page's.
- `e2e/focus.spec.tsx`, in the three engines, finds focus left in a field of a frame inside an open
  shadow root that the visitor clicked and typed in after a press on the page, and never taken from
  that field where it was pressed with no pause between down and up, so the read in a microtask is
  what hears it in Chromium and WebKit, and in Firefox the read a task later, which clears the
  press. It finds a view's heading taking focus for a press on a button in such a frame first
  entered by that press, with the read put between down and up, and for a press with no pause in
  such a frame heard before, after a click on the page, which the read a task later leaves standing.
  The stand-in clock moves timers and leaves microtasks alone, which is what puts the read between
  down and up. It finds focus left in a frame inside a closed shadow root and in a frame of another
  origin the visitor clicked into after a press on the page, and in a frame whose form went on to a
  page of another origin with focus inside, and a view's heading taking focus for a press in a frame
  the page added after its load whose page is still loading, in a frame of the page's origin inside
  one of another origin whose own load is still to come, in a frame's next page before its load,
  with focus in the frame so no blur hears it, and in an object that loaded before the controls,
  clicked by the page's script. Each failed without these listeners or against a break of the part
  that holds it. It finds no page error as a frame is taken from the page while its next page is
  read, as a frame goes on to another origin, or as the page is left and gone back to. No engine
  puts the page in the back and forward cache under the test runner, where `pageshow` never reads
  `persisted`, so a page brought back from it rests on the standard.
- `e2e/frame-scrollbar.spec.ts`, in Chromium and WebKit, finds a press on the page standing through
  a mousedown on the scrollbar of a frame of another origin, with Playwright's flag that hides
  Chromium's scrollbars left off, and the frame unfocused. It does not run in Firefox, which draws
  no scrollbar beside the content in a run with no screen.
- `src/words.test.ts` finds a field's language read past a shadow root of a frame's, which the
  page's own class does not name, a document whose named properties hold a host taken for no shadow
  root, and a frame with no language of its own read in the page's.
- `scripts/controls.test.ts` finds the shallow reader, `activeOf`, called by no module but the one
  that defines it.
- `scripts/controls.test.ts` holds the controls to their budget.
- `e2e/focus.spec.tsx` moves focus to a target, an id or a fallback once a change is drawn, by the
  walk a closing panel hands focus back by.
