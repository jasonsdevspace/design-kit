# Changelog

What changed in each version of `@jasonsdevspace/design-kit`, newest first. The kit follows semantic
versioning. Until 1.0.0, a minor version can rename a token or change what the theme script reads,
and a patch changes neither. A change to the theme script changes `themeScriptHash`, so a page reads
the hash from the installed package rather than keeping a copy. An entry that asks something of a
page opens with **Upgrading.** Each version from `0.1.0-next.1` on has a release on GitHub with its
entry as the notes.

## 0.9.4

Fields line up and hold together. A read-only stepper lines up with the read-only fields beside it,
a stepper is as tall as the fields beside it on a wide page, a field holds to the measure in a page,
a band or a stack, a `dk-fields` row sets fields side by side where they fit and each on its own
line where they do not, a field keeps its control at its own height beside a taller one, a stepper's
field keeps its stepper inside it in a page's own row, and `ValueField` draws a read-only value of
words that wraps and shows whole. A plain form spaces a row of actions and a callout as it spaces
its fields, a field's long words break inside its column, and an address in an error breaks after
its "@". A busy button shows three dots once its wait has passed, not only that it is off. A stepper
is wrong exactly where the browser's constraints say its field is and is the one owner of its error,
so a refused form shows one error for it and says one message. It shows its error for letters as
focus leaves them, names its field first in what it says of its error, holds the error back while a
press below it is down so the click lands, and hands focus to its value or its group as it is taken
down with a button focused. A dated field's range error gives its limit in words a visitor reads,
and the words for a limit and a step name them as the field reads them. A page can build an error
summary that lists a stepper showing its own error, from a second list `invalid` is handed. F8
reaches a shown toast's action from anywhere on the page and sends focus back, as record 29 has it.
The dialog, the panels, the toast, the stepper, the form, a grid of cells, a table and the focus
requests work inside a frame of the page's own origin that the page drives, a press or a key inside
such a frame counts for a view's arrival, and a focus request asked by id from a widget's shadow
root finds an id in the page's own markup. `focusOnArrival` honors its signal, every attach tells of
a missing part at its first attach, a page's function that throws as the status line reads it leaves
the line free, and a dialog puts back a page's own `closedby` as it is let go. In Chrome a change to
a page restyles only what it touches, in Safari a page that sets its root font size keeps the room
under a toast and over a tab bar, and a date or time field draws the kit's focus ring. The controls
ship in parts a page's bundler can split, so a site sends each piece's code only to the pages that
use it, and a page that imports a function of the controls bundles nothing of the theme script.
Upgrading names what a page and its tests change. No token is added or renamed and the theme script
is unchanged, so `themeScriptHash` is the same. The budgets are set under record 13's rule and
measured from the package as npm ships it, with one median: the sheets within 13.25 KB, at 13,149
bytes with a median piece of 183, the controls within 24.25 KB as a bundler sends every function, at
24,008 bytes with a median function of 671, the module imported bare within 2.25 KB, at 1,433 bytes,
`attachTable` alone within 3.5 KB, at 2,699, `attachForm` alone within 10.5 KB, at 9,959, and the
theme script within 1 KB of its own, at 757.

- **Upgrading.** A test that reads the kit's default error words expects the words 0.9.4 writes:
  "Enter an email address like name@example.com here." and "Enter the full web address, with
  https:// at the start." where 0.9.3 put punctuation against the value, a dated limit in words a
  visitor reads, ending on "or later" or "or earlier", as "Enter November 22, 2026 at 9:00 AM or
  later." where it showed the raw value and "or more" or "or less", a year under a thousand written
  to four digits, as "Enter January 1, 0050 or later.", a limit in the Gregorian calendar and Latin
  digits under a language tag that picks another, and step words counted from the browser's step
  base, as "Enter 2, or 2 plus a multiple of 5.". A test that reads a stepper's words as focus
  leaves a wrong value finds the field's name first, as "Bid: Error: Enter a whole number from 0 to
  10.", where it found the error alone, and a page whose `rangeError` already names the field drops
  the name from it, since the status line says the name before it. Words for a press, the value
  alone, stay as they were. A field's name the kit reads, in a stepper's words and in a refusal,
  leaves out what its label or legend hides from a screen reader, so a test that heard "Bid
  (required): Error: …" hears "Bid: Error: …". A required stepper submitted blank, or holding
  letters, shows its own range error at a submit, where the form drew "Enter a value." or "Enter a
  number." above it. A test that finds a stepper's value by its label, as Playwright's `getByLabel`
  or Testing Library's `getByLabelText` do, finds the stepper's box as well, since the box is a
  group named by the same label, so it finds the value by its `spinbutton` role and its name, as
  `getByRole('spinbutton', { name: 'Players' })`. A page that writes a stepper by hand gives its
  label an id, such as `id="players-label"`, and its `dk-stepper` box `role="group"` with
  `aria-labelledby` naming that id, so the box focus goes to has a name. A box without the role
  still takes focus, with no name. A page whose own element has the id of a React field followed by
  `-label` renames it, since `Field`'s label takes that id. A page that relied on a blank stepper
  showing its error without `required` adds `required` to the stepper, as
  `<StepperField required />` or on the input. A stepper left blank that is not required shows no
  error and its form saves, and `mark="required"` only says so in the label. A page's `errorWords`
  and a field's `data-error-*` do not reach an attached stepper with a range error, so a page that
  gave words for a stepper's failure there gives them as `rangeError` on `StepperField`, or in the
  range error's markup, written as an instruction, since it is shown for a blank required field and
  for letters as well as a value past the limits or between steps. On a page wider than 48rem,
  outside an app's frame, a page that ends in a tab bar and their dialogs, a stepper is
  `--dk-field-height` tall, 36 pixels, where it was 44, so what follows it sits 8 pixels higher, and
  a page that wants more gives it `dk-stepper-tall`, `tall` in React, with `--dk-fields-least` at
  12rem in a `dk-fields` row. A page that sets fields side by side in a row of its own, a flex or
  grid row of `dk-field` elements, moves them into a `dk-fields` row, which wraps them onto lines of
  their own where they do not fit, stands their controls level, holds the row to the measure and
  spaces it in a plain form, and drops its own rules for the row, or sets `--dk-field-measure: none`
  on its own row. A field in a page, a band or a stack, in a form there too, and a callout in such a
  form, are no wider than `--dk-measure`, and a page that wants one to run its column's width sets
  `--dk-field-measure: none` on the field or on its form. A page that gives a field more height than
  its parts and wants the control to fill it sets `grid-template-rows` on the field with `1fr` for
  the control's row, as `auto 1fr` for a label and its control or `auto auto 1fr` with a hint. A
  form with no class attribute that a page lays out as a row, holding a row of actions or a callout
  after a field, has room above them, so give it a class. An empty callout written in a plain form
  without `data-empty` counts as one of the form's blocks, so first in the form it puts a step above
  the field after it, and a page marks it `data-empty`, as `Callout` does for a live callout with
  nothing to say yet. A read-only `InputField` is one line and cuts off words that run past its
  edge, so a page that shows a value of words read only draws it with `ValueField`, or writes
  `<textarea class="dk-textarea dk-value" rows="1" readonly>` in its field, and keeps a read-only
  `InputField` for a short figure or a field held read only for a moment while it saves. A read-only
  `SelectField` draws that textarea in place of an input, so Enter in it does not submit the form,
  and a page's own rule for its `dk-input` does not reach it. Every button keeps a band of 0.375rem
  above and below what it holds, so a button whose content is taller than one line of its words,
  words that wrap, an icon or a picture larger than the text or a page's own element inside it,
  stands up to 0.75rem taller than in 0.9.3, and a page that drew such a button at a height of its
  own checks it. A page that styles a kit button's own `::after` resets the properties a busy
  button's dots set there, and an element a page places absolutely inside a busy button sits against
  the button while it is busy. A React page that attaches `attachForm` to a form it still draws, as
  from an effect, moves to `useFormRefusal` and draws each error from its state, while a page that
  renders the React components to static HTML and attaches the form from plain script keeps
  `attachForm`. `invalid` is called with two arguments, `invalid(failures, shown)`, and can be
  handed an empty first list, where the only fields that fail are steppers showing their own error,
  with the refusal still following, so a page does not take an empty list for a pass nor read the
  first failure as present, and builds a summary from `shown`, which lists such a stepper with its
  error's words. A page that hands `invalid` a function with a second parameter of its own, such as
  a flag with a default, or that reads a rest parameter or `arguments.length`, gets the second list
  there, and wraps the function to take the first list alone. A second parameter typed as something
  else fails the type check. A dialog taken down puts back the `closedby` the page gave it before it
  was attached, so a page that counted on the takedown to leave none sets the attribute it wants
  after the takedown. A page that writes a shown toast into a live app's frame by hand, with
  `data-shown` and no `attachToast`, writes `data-toast-rows` on the frame too, with the value of
  the toast's `data-rows` or with no value for two rows. A dialog on a page with an app's frame, or
  one that ends in a tab bar, is written inside the frame, or before or after it as its sibling, and
  one a page writes apart from its frame, such as one it portals to the body beside a wrapper that
  holds the frame, takes the class `dk-dialog-app`. A page that sets `--dk-target`,
  `--dk-target-large`, `--dk-space-1`, `--dk-space-4` or `--dk-text-caption` on its root, and wants
  the room the root keeps under a toast or over a tab bar to follow, sets `scroll-padding-bottom` on
  its root in a rule of its own. A focus request from `moveFocus` or `focusOnArrival` that a long
  render holds past a second lands, so a page that relied on the drop to leave focus alone after a
  slow render calls the request off instead. - **Sheets.** A read-only `dk-stepper-value` shown
  alone starts its figures at a field's inline padding, where a read-only field's words start, and
  stands at a field's height at each width, unless the stepper is tall, where its figures start at
  the same place and it keeps the larger target. An inline stepper's read-only value keeps its
  centered figures at its row's end, as tall as one that can be changed. While a button keeps focus
  as the field turns read only, the value keeps the editable stepper's place and the hidden button
  keeps its room out of sight, so nothing moves under the focused button. Both rest on `:has()`, and
  without it a read-only value keeps its centered figures and every hidden piece stays hidden. An
  editable stepper is unchanged. In a form with no class attribute, a field, a row of actions or a
  callout that is not empty stands `--dk-space-4` below what sits above it, once another of those
  has come before it, wherever a hidden input or a script sits between them, where before only a
  field after a field stood apart and the README's buttons sat flush under the select above them.
  Only the kit's own blocks are spaced, so a page's own markup in a plain form draws as it would in
  a form with a class, and a block out of sight or an empty callout counts as none. `.dk-field`
  gives its one column no least width, so a word with no place to break, such as the email address
  in the kit's own error, breaks inside the field at 320 wide and twice the text size rather than
  hanging past its edge, in a narrow form and beside a button in a page's own row. A busy button
  marked off, once `--dk-wait` has passed, draws three dots centered at its foot as its `::after`, a
  gradient repeated across a box exactly three dots wide, so every engine draws three at every text
  size. They are in `--dk-fg` and pulse no fainter than 3:1 on the kit's grounds, stand still under
  reduced motion, and keep the system's gray in forced colors, where they stand still too. A busy
  button not yet marked off draws none, so no dots sit on the accent's fill. They are centered
  whatever the button's own alignment, take no place in the row and hold no words, so the button
  keeps its size and its name. Every button keeps a band of 0.375rem above and below its words,
  inside the height of a button of one line, so the dots never meet words that wrap or grow. A text
  button keeps only what the leading around it leaves short of that band, so a line of it in
  ordinary text keeps the button's height. A busy button is `position: relative`, which the dots are
  placed against. A field anywhere in a page, a band or a stack, and a callout in a form there, take
  `--dk-field-measure` as their widest, `--dk-measure` until a page sets it, so a field for a short
  name never runs the width of a wide panel and a form's callout ends where its fields end. A page
  narrows one with a shorter length, for a short answer such as a ZIP code, or widens one with
  `none`. A field in a dialog or a popover keeps the width the dialog or popover gives it, which a
  page may widen. A `dk-stepper` draws the focus ring where the browser shows focus on it. A
  `dk-field` holding a `dk-stepper`, not inline, is never narrower than the stepper with its buttons
  at their least width, wherever the page's row leaves its items their own least width, so in a
  page's own flex row beside a text field the stepper stays inside its field. The stepper alone sets
  that width, so a long word, a picture or words that never wrap in the label, hint or error leave
  the field as wide as its stepper. A stepper's button is the target wide at most, its edge
  included, in place of a width, so it asks for the target where there is room and for its least
  width where there is not, and a thicker edge a page gives it no longer widens it. The field's
  least width rests on `:has()`, and without it the field keeps none. `.dk-field` sets
  `align-content: start`, so a field stretched to a taller row, as beside a field whose label wraps,
  keeps its label, hint, error and control at their own heights and leaves the spare room below
  them. Two text fields in a `1fr 1fr` row at 390 wide keep their inputs at 44px where the shorter
  one grew to about 55px, and a stepper's field in an `auto` column at 320 wide and twice the text
  size keeps its buttons at the target. An inline stepper in a taller cell keeps its label and
  stepper at the top, its label level with the labels beside it, where it sat lower before. A field
  drawn alone is drawn as before. `dk-fields` is a row of fields that wraps. Every field in it
  starts from `--dk-fields-least`, 10rem until a page sets it, a stepper's width rounded up, and
  shares what is left, so no label, hint or error moves the field beside it. Two fields share a line
  where the row is at least 21rem wide, two lengths and the gap, which in a page's column is a
  screen from 368 pixels, and a narrower row or a larger text size stacks them, every label whole.
  The fields stand `--dk-space-4` apart both ways and line up along their foot, so their controls
  stand level where one label takes two lines or one field shows a hint or an error. An inline
  stepper and a choice field each take a line of their own. The row holds to `--dk-field-measure` as
  a field does, a field in it narrows by the same property, and in a form with no class attribute
  the row stands `--dk-space-4` from the fields around it. A `dk-fields` row written straight in a
  panel, a dialog, a stack or anything else that spaces what it holds by `--dk-flow-step` stands its
  lines that step apart, where it stood them `--dk-space-4` apart everywhere, wider than the step
  between the fields around it in a panel, a dialog or a stack inside one. A row in a plain form
  keeps the form's step. A text button's band is written from `--dk-leading-tight` rather than a
  length of its own, at the same size. No rule writes a `:has()` on the root, the body, an app's
  frame or a page that ends in a tab bar unless it draws that element, since Chromium restyles
  everything inside an element whose `:has()` draws something else. The body is the subject of its
  own rule for the padding under a page's toast, and a body that is itself the frame takes none. An
  app's frame keeps the room under its toast by `data-toast-rows` on the frame, and a pictured frame
  by the shown toast it holds. A dialog takes an app's sizes where it sits inside a frame or a page
  that ends in a tab bar, beside one, or carries `dk-dialog-app`. On a page of about 2,300 elements
  in Chromium 158, an element added restyles 10 elements in 0.14 ms where it restyled every one in
  12 ms, and words said on a status line take 0.06 ms where they took 6 ms. Showing a toast restyles
  the whole page once where it did twice. The room in a frame under a floating toast, and a dialog
  inside or after a frame, hold in a browser with no `:has()`, where a toast that takes its row
  above the dock still floats with no room kept. A picture of a frame with a shown toast inside a
  live frame leaves the live frame's body as it is. The root's `scroll-padding-bottom` under a shown
  toast on a page with no frame, and over a tab bar that ends a page, is written in em through
  working values in the tokens sheet that hold each token's number, where it was written in the
  tokens' rem. Safari draws a rem in a property of the root itself from 16px whatever size the page
  sets there, so with `html { font-size: 200% }` it kept 114px under a toast 186px tall and 73px
  over a bar 113px tall, and Tab set a link wholly under each. It keeps 226px and 146px, as Chromium
  and Firefox do. A page at the usual root size, and every other browser, draws as before. A
  `dk-stepper`'s buttons and its `dk-stepper-value` set no height of their own, so each takes the
  height every button and field takes: `--dk-field-height` above 48rem, and `--dk-target` at 48rem
  or less, in an app's frame, on a page that ends in a tab bar and in a dialog on either. In a
  `dk-fields` row a stepper's label and control stand level with those of the fields beside it at
  every width, where the label stood 8 pixels higher on a wide page. A read-only stepper and an
  inline one are as tall as any other, so a stepper turned read only keeps its height. A stepper's
  button keeps no padding, so its figure stands inside a field's height. `dk-stepper-tall` keeps the
  larger target at every width. An input for a date, a time, a date and time, a month or a week
  draws the focus ring whenever it holds focus. Safari hands focus to a part inside such a field and
  never counts the field itself as focused by the keyboard, so there only its own highlight on the
  part showed, by Tab, by a press and after a refusal. Chromium and Firefox already show focus on
  these fields however it came, as on any field a visitor types in, so they draw the same one ring
  as before. In a page, a band or a stack, a callout written before or after a field or a row of
  fields in what holds them holds to `--dk-field-measure` as they do, so a page that draws its
  fields with no form keeps one right edge, where only a callout inside a form did. A callout with
  no field beside it there runs the column as before. `dk-value` on a `dk-textarea` takes
  `field-sizing: content` with no resize handle where the browser has it, and takes the block
  padding that centers one line in a field's height, the target's on a phone and in an app's frame,
  so a value of one line stands as tall as a read-only field beside it with its words level. A value
  in a `dk-field-action` row keeps the room the button leaves, as an input does, and stands in the
  row's middle, so its line stays level with a button whose words take two lines. The plain form's
  spacing rule tells a block out of sight by `hidden`, `data-empty` and `dk-visually-hidden` alone,
  with no `:has()` on the callout before the block it spaces, which Chromium answered by restyling
  every later block for a change inside any one of them. - **Controls.** The kit's email and web
  address errors no longer put punctuation against the value they show, reading "Enter an email
  address like name@example.com here." and "Enter the full web address, with https:// at the
  start.", and an error the form draws allows a break after each "@", so a long address breaks there
  rather than at whichever letter or stop the line runs out on. Its words, its description and the
  status line read the address whole. `attachStepper`'s takedown, by its signal or its detach, hands
  focus from a focused button to the value where the value is read only and enabled, and otherwise,
  or where the value refuses focus, to the stepper's box, since an editable value would open a
  phone's keyboard and a disabled one refuses focus. A box focus goes to with no tabindex is given
  one of -1, which stays, and a page's own tabindex is kept. Where the box refuses focus too, the
  tabindex it was given goes again at once, and focus goes on to the app frame's body or the page's
  main content. Focus moves before the buttons hide and only where a button has focus, so focus the
  page moves in the abort's task stays and a `moveFocus` asked in that task still lands, and a page
  that attaches the stepper afresh as focus comes to it keeps its buttons. `attachForm`'s words for
  a date, a date and time, a time, a month or a week before its least or past its most give the
  limit as a visitor reads it and end on "or later" or "or earlier", as "Enter November 22, 2026 at
  9:00 AM or later.", "Enter November 2026 or later." and "Enter the week of November 23, 2026 or
  later.", counted from the week's Monday. No raw value such as "2026-11-22T09:00" or "2026-W48" is
  shown, and no period sits against the limit. The limit is in the nearest `lang` around the field,
  past any shadow root it sits in, where that language is English, and in US English otherwise,
  since the words around it are English. It is the wall time written, so a limit in a spring-forward
  gap keeps its hour, a year under 100 stays as written, and a limit past any date a script can hold
  is shown as written. A limit with a fraction of a second shows it to its own digits, so the limit
  shown is one the field takes. A date and its time are joined by "at" in every engine. A time whose
  limits both parse with its most before its least is a window overnight, and a time in its gap
  takes "Enter a time between 10:00 PM and 6:00 AM the next day." `attachForm` leaves a stepper
  whose own range error shows out of the failures it hands `invalid`, so a page refused through
  `useFormRefusal` shows and describes the stepper's error alone, where it drew the form's "Enter 10
  or less." above it and the refusal said both. The refusal still counts the stepper and names it.
  As it refuses, the form takes back a failing stepper's own words not yet said, on the stepper's
  own line, on a page's line and through a page's `say`, so a value typed past its range and
  submitted by Enter or a press on the button is said by the refusal alone, or not at all where
  focus moves to a summary, where the stepper's line and the page's line both changed in one moment.
  `attachStepper` reads the field's `validity` to decide whether its own error shows: a value
  outside the limits, between steps or that is no number, and none at all only in a field that is
  required, where a blank showed the error in any stepper while its form saved. An error that shows
  follows `required` and `step` as a script changes them, as it does its limits.
  `focusOnArrival(view, { signal })` asks for nothing under a signal already aborted, and leaves the
  press for another view, and an abort calls off a request not yet landed, as the function it
  returns does and as `moveFocus` has it. Before, the signal was taken and never read. A request
  that lands lets go of its signal. A panel that closes tries the place its last link went to and
  its buttons first, and looks through the page for what follows it only where each of those refuses
  focus, in the same walk, so a page's own listener that moves focus still ends it. Since 0.9.3
  every close that handed focus back queried every element of the page that takes focus first, which
  a page of many links paid for on each close. An element among the places focus is handed to is
  never called, though an object or an embed is a function to some browsers. A key that is not
  Escape reads nothing of where it was pressed. `attachStepper` and `attachPanel` throw for a
  missing part, a stepper's value or buttons and a panel button's `aria-controls`, under a signal
  already aborted too, as `attachToast` and `attachTable` do. Before, each returned a function that
  does nothing, so markup missing a part said nothing. A stepper, a panel's button or a toast
  already attached is handed back as it is by a repeat attach, though its markup has since lost a
  part, where a toast threw before. A message given as a function that throws as it is put on a
  status line, such as a stepper's `words`, is left unsaid, the line is freed for the polite words
  that wait for it, and the error is reported through `reportError`. Before, the line stayed claimed
  by words never written, and every later polite message waited until firm words replaced them. A
  dialog taken down puts back the page's own `closedby`, whether it was attached to stay or not,
  before it hands focus back, so a page that attaches it again as focus goes back keeps what that
  attach sets. A `closedby` the page set while it was attached without `stay` stays, while one that
  options given since took away gives way to the page's own. The teardown can hand an attach options
  with keys missing, and its type says so. The rest is tidied with no change in behavior: a dead arm
  of the stepper's marking, a comment from when there were two maps, `AttachOptions` declared once,
  a type parameter that hid the DOM's `Element`, one loop that follows focus into shadow roots, the
  document position named, ids read through one helper, a name that hid the panels' list of buttons,
  an unreachable guard in the status line and a record named as the records beside it are. The
  panels keep the visitor's last place once the last button is let go, since a page that draws its
  only button again lets the old one go before the new one is attached, and a comment says so.
  `attachToast` writes `data-toast-rows` on the app's frame its toast sits in while the toast floats
  over the frame's body, with the rows it measured or with an empty value for a toast it could not
  measure, and takes it off where the toast takes its row above the dock, as the toast is dismissed
  or taken down, and from a frame the toast has left. A dismiss also takes off a mark the page wrote
  on the frame for a toast it drew shown. The mark is on the frame, so it lasts through a body the
  page draws afresh. A toast in a frame whose body is not the frame's own child, inside a form for
  one, takes its row above the dock. It writes each attribute only where its value changes, so
  measuring a floating toast that has not changed writes nothing. The theme module writes its two
  themes as plain strings, so the theme script's text calls nothing as the module loads and a
  bundler drops it from a page that imports the controls or the theme's names alone. The theme
  script is unchanged, and so is its hash. The words for each failure, the dated limits among them,
  and the lookups they share with the controls move into two internal modules behind the controls
  entry, which no entry exports. No words change. Every function a page bundles comes to 93 bytes
  more and `attachForm` alone to 27 more, gzipped, since a bundler puts an imported module's code
  ahead of the controls, beyond gzip's window from the form code the words share text with. The
  module imported bare and `attachTable` alone are unchanged. `attachToast` moves focus to a shown
  action on F8 pressed with no modifier and not held, and on F8 pressed in the toast sends focus
  back where it came from by the walk a dismiss hands it back by, with the toast still shown. Enter,
  Space and Escape on the action do what they did, and focus goes back to the control F8 was pressed
  on. Focus still never moves as a message shows. The action carries `aria-keyshortcuts="F8"` while
  it is shown. The toast listens for the key on the document only while a message with an action is
  shown, takes the listener off as the toast hides, as a message with no action replaces it or as it
  is taken down, and keeps the key's default wherever it moves no focus, for an F8 that converts
  text in an input method too. With focus in one of two toasts, that toast hears the key. A page's
  own F8 handler on an element below the document runs first and wins where it prevents the default,
  while one on the window or the document may run after the toast's, so it checks
  `defaultPrevented`. A page needs nothing to get F8. Behind the same `./controls` entry, each
  piece's code is an internal module of its own, and the state two pieces share, the presses, the
  focus the kit hands back and the checked forms, sits in one module that adds the listeners as it
  loads, so every part on a page reads one copy. No export, type, option or behavior changes. The
  package names `dist/state.js` beside `dist/controls.js` in its `sideEffects`, so a bare import
  keeps the listeners. Record 13 gives the sizes before and after. `attachForm` calls `invalid` with
  a second list, `invalid(failures, shown)`, which holds every failure in the form's order, each
  with its field, its control and the words its field shows: the form's words for a failure in the
  first list, and a stepper's own range error's words for one left out of it. The first list stays
  as it was, so a page that draws every failure it is handed never draws a second error on a
  stepper, and a page that takes one argument is unchanged. A summary that already has focus as a
  form is refused has the first field's name and error said, with the count where more are wrong, as
  a field that already has focus does, where the summary's text was said run together, or its own
  text where no field is marked, and a summary that cannot take focus, hidden, inert, out of sight
  or not focusable, is passed over for the first field in error. An attached stepper holds back the
  error of a change, or of letters as focus leaves them, while a press on a control anywhere outside
  the stepper is down, as a Save button below it, one tied to the form from outside it or a button
  beside a stepper in no form, until the press ends, however long it is held, so the error drawn
  above never moves the control from under the pointer and the click and the submit it makes land. A
  submit the form refuses then shows the stepper's error and says one message, a press dragged off
  and let go without a click shows the error once it ends, a press that turns into a drag shows it
  as the drag starts, and focus leaving by the keyboard shows it at once. `attachForm` has each
  attached stepper that fails a submit show its own error, for a blank or letters as for a value
  past its range, and never draws an error on the stepper nor marks it, so a value typed past the
  range after a refused submit shows one error and one description, where it showed both, and an
  error the form drew on a stepper for a page's own refusal stays beside a range error typed after
  it until the next submit. A stepper in which the page shows an error of its own leaves its failure
  to the form, as any field's, and one that fails a page's `setCustomValidity` and its range at once
  shows its range error alone, with the page's words at the next submit once the value is in range.
  A stepper whose error clears sets `aria-invalid="false"` where the kit checks its form, as the
  form marks every field not in error, where it took the mark away and could leave a stepper the
  form had marked first at "true" with no error shown. A reset that goes through after a refusal
  says "Form cleared.", whoever drew the errors, so a form refused through `useFormRefusal` is
  heard, and a reset with no refusal standing says nothing. `attachStepper` shows its error, marks
  the field invalid and says the error once as focus leaves letters typed into a blank field, which
  leave the value blank and fire no `change`, where it showed nothing until a submit. A blank that
  focus only passes through stays quiet, as do letters in a field that is disabled or read only or
  shows an error of the page's, and focus that stays on the value as the window is switched. A press
  of the stepper's own button straight after the letters is left to the press, so no error is drawn
  above the field as the pointer goes down and the press lands. The words it says of its own error
  as focus leaves a wrong value start with the field's name, taken as a refused form takes it,
  without a mark the label hides, so a screen reader user whose focus has moved on hears which field
  the error is about. A refusal from `attachForm` names its field the same way, without what the
  label or legend hides from a screen reader, where it said a required mark as part of the name.
  `moveFocus` and `focusOnArrival` drop a request made while the page is out of sight, or before it
  goes, as a listener the module adds for the page going out of sight or coming back tells, and one
  whose frame comes more than ten seconds late, as a frame the browser holds back out of view can,
  rather than any request still waiting a second later. A view asked of `focusOnArrival` once the
  page is back in sight lands without the views asked before it went. An attached stepper taken down
  once its field has left the page has every form the kit checks that held the field let go of it,
  and takes its `aria-invalid="false"` away, whoever set it, so a stepper drawn again and again in
  one long-lived form, as one keyed by a round, leaves no field held. A field still in the page
  keeps its mark until its form is let go, so a stepper taken down and attached again keeps it, and
  one taken down before its form loses it with the form. A dated limit keeps the Gregorian calendar
  and Latin digits the field takes, while the language's own words and order still apply, so
  `lang="en-u-ca-buddhist"` gives "Enter November 22, 2026 or earlier." where it gave "Enter
  November 22, 2569 BE or earlier.", and `lang="en-u-nu-arab"` gives Latin digits for a date, a time
  and a week. A year is written to four digits, as the field writes it, so
  `<input type=month min=0001-01>` is told "Enter January 0001 or later." where it was told "Enter
  January 1 or later.", which read as a day of the month. A number field's step words count from the
  browser's step base, its `min` where that parses, else its `value` attribute where that parses,
  else 0, so `<input type=number step=5 value=2>` is told "Enter 2, or 2 plus a multiple of 5."
  where it was told "Enter a multiple of 5.". The step and its base are written as their attributes
  write them, as a range failure's words write its limit, so `min="1.50" step="0.25"` gives "Enter
  1.50, or 1.50 plus a multiple of 0.25." beside "Enter 1.50 or more.", and `step="05"` gives "Enter
  a multiple of 05.". A `min` that does not parse is left out of the words, a step equal to 1, such
  as `1.0` or `01`, reads "Enter a whole number." where the step base is a whole number, and a step
  that does not parse or is not above 0 is read as the default step of 1, as the browser reads it.
  `attachToast` on an element inside a frame of the page's own origin listens for F8 and follows
  focus in that frame's document, so F8 pressed in the frame reaches the action and a dismiss hands
  focus back to the control in the frame, where it reached nothing and handed focus back to the
  frame. It listens to the frame's window for its size and scrolls the frame's window, not the
  page's, as it takes its row above the dock. A toast stays in the document it was attached in, so a
  page that moves it into another takes it down and attaches it again. Only the toast changes, and a
  toast on the page works as it did. The dialog and the toast keep where focus was as one reader
  gives it, followed from the page into each frame of its own origin that has it, and the dialog,
  the panels and the toast compare and judge it through one view of the document the piece sits in,
  a focus request asking as the page. `activeOf()` reads as before, into shadow roots only, so a
  request asked with focus in a frame looks its id up on the page. A body no one can type in counts
  as nothing only in the asker's own document, as itself in a document around it and as its frame in
  any other, and an editor's body counts as focus, so focus a visitor put in a frame's blank space
  or editor stays theirs. `attachDialog` on a dialog inside such a frame hands focus back as it
  closes to the control in the frame that opened it, or to the page's own button that opened it,
  where it went to the frame or nowhere. `attachPanel` on a button inside such a frame listens in
  the frame's document, so the button opens and closes its panel and focus goes back to it, where a
  press there did nothing, and a panel in the frame and one of the page with the same id stay apart.
  A dialog or a panel the page closes in a frame while the visitor is on the page leaves focus where
  they put it. A button the page made and moved into the frame works alike. A toast hands focus back
  to the control inside a frame within a frame, where it went to the inner frame. Each stays in the
  document it was attached in, so a page that moves one into another takes it down and attaches it
  again. A dialog in a frame makes only that frame inert, so a page that needs the whole view held
  opens the dialog on the page. `attachForm` on a form inside such a frame checks and refuses it,
  where it let the submit through with nothing checked, and focus moves to the summary or the field
  in error in the frame. `attachStepper` there keeps a button that has focus shown as its value
  turns read only and hands focus to its value or its box in the frame as it is taken down, where
  the button hid and focus fell to the frame's body. `attachRoving` there gives the grid its one
  stop and moves by its arrows, where it found none of the frame's cells, and hands focus on to the
  next cell where the one with focus is taken out, on a page whose body a visitor can type in too.
  `attachTable` there brings a link out from under a pinned column as the keyboard reaches it. The
  form, the grid and the table tell the frame's controls by their names and node types rather than
  the page's classes. A focus request reads where focus was once, as it is asked, and compares where
  focus is as the frame's document sees it, so a visitor's move between two of its controls counts
  as a move, and a body no one can type in, the frame's or the page's around it, still counts as
  free. Its id and the home it falls back to are looked for on the page, whether or not the page
  passes `from`, and one asked from a frame that loads another page before it lands compares as the
  page sees it. A field's language is read past a shadow root inside a frame as it is past one on
  the page, and a frame with no language of its own reads in the page's. The controls hear keys,
  clicks and submits on the document of each frame of the page's own origin, at any depth through
  such frames, as well as on the page's, an object showing such a page and a frame the page writes
  among them. They hear the frames they find as they load, and a frame's page as it loads, so a
  frame added later and the next page of a frame that goes on are heard from their load. A press on
  a control inside such a frame brings focus to the heading of the view it opens through
  `focusOnArrival`, where it took none, and a key that moves or types inside one leaves no press
  made on the page standing, where a view that arrived after took focus from the frame's control the
  visitor had moved to. A frame of another origin, a frame of the page's origin inside one and a
  frame inside a shadow root stay unheard. A keydown with no key, as autofill sends, counts for no
  input. The controls find frames by a walk of the window tree, which reaches an object in every
  engine, a frame element and a frame of the page's origin held inside one of another origin. A
  frame is heard as focus enters it, before the click that focused it, a frame inside an open shadow
  root and one whose page is still loading among them, and a frame's next page of the page's origin
  is heard as it begins, before its load, so a press there brings focus to the view it opens where
  it brought none. Where focus enters a frame of another origin, a sandboxed one or one inside a
  closed shadow root from the page after a press there, or a heard frame goes on to a page of
  another origin with focus inside, the press is cleared, so a view that arrives leaves focus in the
  field the visitor moved to inside it, where it took focus from that field. A press in a frame
  inside a shadow root that was heard before stands, however quickly it follows focus in. Two gaps
  leave a press standing: a frame inside a closed shadow root entered from a heard frame, or from
  the page where a frame of the page's origin holds that root, and a frame being written with
  `open()`, which is heard only from its `close()`. In Firefox a page script that moves focus to the
  page just after focus enters a frame clears a press that should stand. `moveFocus` and
  `focusOnArrival` look an id up in the root where focus was, then in each root around it out
  through the hosts to the page, so a widget's button in a shadow root that asks for a heading in
  the page's markup focuses that heading, where focus fell to the page's main content, and a
  widget's own id still wins over the same id on the page. A request asked with focus in a frame
  inside a shadow root finds its id on the page too. - **React.** An error given to a field as words
  allows the same break after each "@". The doc comment on `Button`'s `busy` describes the dots.
  `Field`'s label, and so the label of every field the React components draw, has an id, the field's
  id followed by `-label`. `StepperField`'s box is a group named by it. `useArrivalFocus` reads
  where focus was through `activeOf()`, as `focusOnArrival` and `useFocusAfterDraw` do, so a view
  whose key changes on a press of a button inside a shadow root takes focus on its heading. Before,
  it read the root's host, and the request was dropped as though the visitor had moved. A request
  `useFocusAfterDraw` makes late, once its component has gone, finds an id, its target's or a
  fallback's, in the root where focus was when it was asked, as `moveFocus` does, so one inside a
  shadow root is found in sight and lands where the page passes `from` in that root or focus is
  still in it. `useFormRefusal` hands its `invalid` the same second list. `ValueField`, with
  `ValueFieldProps`, draws the textarea with its label, hint, error and action, one row and read
  only, its `ref` the textarea. A read-only `SelectField` draws the chosen option's words in it.
  `useFormRefusal` hands `invalid` nothing for a stepper showing its own error, a blank or letters
  among its failures, and says "Form cleared." on a reset after a refusal. `useFocusAfterDraw`,
  `useArrivalFocus` and `useFormRefusal` take where focus was as a request does, so a request or a
  refusal asked from inside a frame leaves a visitor's move in it alone. `useArrivalFocus` hears
  presses and keys inside such a frame as `focusOnArrival` does. `useArrivalFocus` follows the same
  frames as `focusOnArrival` does. A late request from `useFocusAfterDraw`, asked by a component in
  a shadow root once it has gone, finds an id only the page holds by the same walk, where it was
  held and never landed. `useArrivalFocus` finds an id as `focusOnArrival` does. - **Docs.** The
  README's list of what is in the kit names the layouts page for a content page, bands and a hero,
  which the page chrome page no longer holds. The README links the site's behavior page for the
  kit's waits, focus, arrow keys and refused form, each working, the site's own palette page for a
  page's palette, column, layers and the properties it sets, and the controls page for progress,
  beside the reference's sections on them. The reference's busy button says gray, as the rest of the
  kit spells it. The reference says a read-only stepper keeps the edge of a column of read-only
  values, that an inline one keeps its centered figures, that a stepper is read only for the page,
  and that nothing moves under a button holding focus. The README's checkout and the reference's
  hold their two buttons in a row of actions. The reference says which blocks a plain form spaces
  and that a field holds to its column, and record 24 gives the choice and the options turned down.
  "A busy button" in the reference describes the dots, the properties they set and the relative
  position, and no longer says there is no spinner. How a button is drawn names the band. Records 2,
  5 and 6 let a busy button follow its `:where()` with `::after`, under record 2's rule for a mark a
  component draws of its own state. The reference's fields say a field holds to the measure, how a
  page narrows or widens one and that a dialog or a popover sizes its own fields, its content page
  counts fields among what holds to the measure, and its table of properties a page sets lists
  `--dk-field-measure`. The reference's sections on taking a control down and on `moveFocus` list
  the stepper among the pieces that hand focus back, its section on the stepper says the box is a
  group named by the label, where focus goes and the tabindex the box is given, and the markup of
  every field `Field` draws shows its label's id. Record 23 says the same, why an editable value is
  skipped and what it costs. The reference says a stepper's field with its label above is never
  narrower than the stepper at its least width where the page's row allows it, that the stepper
  alone sets that width, that a row whose items have no least width can still squeeze it, that one
  with its label to the left keeps its least width too, and that in a row that cannot wrap the
  fields beside it take what is left. The accessibility notes add the stepper's field to what
  Firefox 120 draws without `:has()`. The reference's failure words give a date and time's range
  error, how each kind of dated limit reads and the words for an overnight window. The reference's
  section on a refused form says `attachForm` draws errors only in markup nothing will draw again, a
  page written by hand or the React components rendered to static HTML and attached from plain
  script, that a form React still draws refuses through `useFormRefusal`, and that `attachForm`
  drawing its own errors in a form React still draws is not supported. Record 20 and the decisions
  index say why each node and attribute of a field keeps one owner, and why a mark on every React
  field and an observer that repairs React's markup were turned down. The reference's field section
  says a field shorter than the tallest beside it keeps its control at its own height, with the
  spare room below it, that an inline stepper there keeps its label level with the labels beside it,
  and how a page makes a control fill a field it stretches. The reference documents the row and
  `--dk-fields-least`, with its markup and the React a page writes around the fields, lists the
  property among those a page sets, and names the row under `--dk-field-measure`. It gives the
  length that holds a wider stepper at its full size, 10.5rem for three figures, 12rem for a tall
  stepper and 13.25rem for a tall one of three, and asks a page that hides every field in a row to
  hide the row itself. The field and stepper sections point a page that sets fields side by side to
  the row, and keep a sentence for a page that writes its own. Record 25 gives why each field starts
  from a length rather than its content, with the options turned down, and record 24 counts the row
  among a plain form's spaced blocks. The accessibility notes say how far a stepper wider than 10rem
  runs past its field without `:has()` on a screen from 368 pixels, where a page leaves the length
  as it is. The reference's status line section says a field's error is not live and a refused form
  says one message, where it said a field's error is never said on the line. Its refused form and
  stepper sections, and records 20 and 21, say which error is drawn, whose words it takes and who
  says it. The reference's stepper section says when a stepper is wrong, that one whose blank has no
  meaning takes `required`, that a stepper that fails untouched shows its own error, and its lead
  stepper example is required. Record 21 says the stepper's own error follows the same constraints.
  The reference and record 25 say which step a wrapped row's lines stand apart. The comment at the
  head of `tokens.css` names every part of a browser's own element a component reaches, a progress
  bar's track and fill and the `::after` a busy button draws its dots in among them. The reference's
  sections on taking a control down and on a view's arrival, and record 22's list of what keeps its
  contract, name `focusOnArrival`. The reference's section on moving focus says a late request finds
  an id in the root where focus was as it was asked. Record 19 says the search for what follows the
  panel is made only once the buttons have refused focus. The reference's section on taking a
  control down, record 22 and record 13 say a missing part is told at the first attach, before the
  signal is read, and that an attached control is handed back as it is. The reference's section on
  the status line says what a function that throws leaves. The reference says a dialog taken down
  puts back the page's own `closedby`, and which `closedby` the page set while it was attached
  stays. The reference's sections on the app's frame, the toast and the dialog say what marks the
  frame, what a page that writes a shown toast by hand writes, with its markup, and where a dialog
  is written on an app's page and when it takes `dk-dialog-app`. Record 27 gives the measurements,
  the rule and the options turned down, and records 13, 15 and 22 name the mark. The reference says
  where a stepper is the field's height and where the target's, that its buttons are the target wide
  at both, and that a row of fields stands a stepper's label level with the labels beside it. Record
  26 gives why the stepper takes the height every control takes, with leaving it the target tall, a
  row that lines its fields up by their labels, a height of the stepper's own and buttons as wide as
  they are tall turned down. The accessibility notes give the buttons' width. Record 23 names the
  spec that holds a stepper's tests of a takedown with a button focused. Record 13 gives budgets for
  the controls imported bare, `attachTable` alone and `attachForm` alone, with their first figures,
  measures every budget of the controls from the package as npm ships it with one median, and lets a
  release that leaves more than two medians of room under a budget lower it by the same rule. Record
  13 gives the controls' size before and after the move, and record 21 names the unit tests. A
  contents list under the reference's introduction links every heading. Fields is broken at its
  topics, with a field's width, a field's height and a plain form each under a heading of its own,
  and a row of buttons, fields side by side and a live callout link the plain form. A stepper's
  width in a row is said once, under a stepper in a row, which fields side by side and how a stepper
  is drawn link. A refused form reads in this order: the browser's constraints, who draws the
  errors, the words, focus and speech, and then taking the form down. The properties a page sets
  list `--dk-field-measure` and `--dk-fields-least` together. The package README's install line
  saves one exact version, since a patch before 1.0.0 can still carry Upgrading notes.
  `attachForm`'s doc comment says it draws errors only in markup nothing draws again. Record 20
  names an attached stepper's observer as the one exception to one owner for each node and attribute
  of a field, and why it is safe. Record 21 says how a dated limit and a step are named, and records
  13, 15, 19, 20, 21, 22 and 23 name their 0.9.4 amendments. Record 23's rule for handing focus back
  names the toast, the dialog and the panels, and records 24 and 25 state the options weighed. The
  accessibility notes point to the list of specs that run in WebKit and Firefox. The accessibility
  notes say a dated field draws the ring whenever it holds focus, and why. The reference's field
  section says which callouts end where the fields end, and that a callout reads
  `--dk-field-measure` from what holds it. The accessibility notes say a callout before the first
  field runs the column without `:has()`. In Chromium, which draws a picker's icon at the end of a
  dated field, a 320 pixel screen at twice the text size leaves the field less room than its words
  take. The accessibility notes say which words fit there and which do not, why the field stays
  padded as every other field is, and what a page that must show a whole month on that screen asks
  for it with. Record 29 gives the key, the options turned down and the spoken hint that waits for a
  walk with NVDA and VoiceOver. The reference names the key, record 19 names the walk back, and
  record 13 gives the controls' size with the key. Record 13 gives the controls' module layout, its
  `sideEffects` and the controls' size before and after the move. The reference's refused form
  section builds its summary from the second list, and record 21 says why the second list was chosen
  over marking the stepper's failure as drawn. The reference gives `ValueField` a section of its
  own, with its markup and its props, and says a read-only `InputField` is for a short figure or a
  field held read only for a moment. Its example of read-only fields draws the round as a value, a
  score as a read-only field and a game whose chosen option's words are long. The accessibility
  notes say why a read-only text field can be cut off, what a screen reader may call a value, and
  how a browser that cannot size a field to its content draws one. Record 28 gives the reasons and
  the options turned down. The reference's stepper section and record 21 say when a stepper holds
  back its error for a press outside it, and why it reads the press from what is active rather than
  from a listener. The reference says a plain form counts an empty callout written without its mark
  as a block. Record 24 gives the reason and the cost it removes, and record 27 says its rule's last
  `:has()` of that shape is gone. The reference's stepper and refused form sections, and records 20
  and 21, say an attached stepper owns its error at a submit and a reset, how its mark clears, and
  when a reset says the form is cleared. The reference's stepper section says when letters show
  their error and what the stepper says then, and its refused form section and record 21 say a
  field's name leaves out a mark its label hides, and record 21 says the same of the stepper under
  its rule. The reference says which request is dropped, and record 13 names the listener. The
  reference's stepper section and record 21 say when a stepper taken down has its form let go of its
  field and take its mark away. The reference gives the step words and the calendar, digits and year
  a limit is named in, record 13 gives the controls' size with the words, and record 21 names what
  the unit tests find. The reference's toast section says a toast works inside a frame the page
  drives, and record 29 says how. The reference's sections on taking a control down and on moving
  focus after a change are broken at their topics, each under a heading in the contents list, their
  sentences moved, with a word changed only where a break left a sentence opening a section: a
  signal already aborted, the signals that hold a control, handing focus back, whose options apply
  and a page that draws its own screens, then when a request to move focus lands, an id inside a
  shadow root, moving focus in React, a request as its component unmounts and focus on arrival. The
  reference's dialog, panel, toast and focus sections say how each reads focus inside a frame the
  page drives, and records 19 and 29 say how. The reference's form, stepper, grid, table, theme
  switch and focus request sections say how each works inside a frame the page drives, and record
  19's decision covers the stepper, the form, the grid and a request asked from a frame. The
  reference and record 19 say which documents' presses and keys a focus request hears, what a page
  with a frame that is not heard does instead, and records 13 and 29 follow record 19. Record 19
  says which frames are heard, what clears a press, which gaps fail safe and which two do not, with
  the reference and records 13 and 29 following it, and the reference points a page whose views
  arrive while focus is in a frame to the status line. The reference's "An id inside a shadow root"
  and "Moving focus in React" and record 19 say where an id is looked for, from an open, a nested
  and a closed shadow root and from a frame inside one. Records 17, 19 and 29 are each written as
  one record, with record 17 amended for the fields and callouts held to the measure, and the
  reference and the accessibility notes name the known limits of a focus request from a closed
  shadow root, of views in different trees, of a dialog in a frame and of the presses in frames a
  view's arrival cannot hear. - **Tests.** The test that each state draws the attribute printed
  under it finds an attribute with no value only where an attribute's name stands in a tag, never in
  the text or inside another attribute's value, in the case HTML writes it or the one React writes.
  A state's picture takes its address from the page that draws it, so the code a reader copies names
  the file alone. A browser test draws a read-only stepper beside a read-only text field and finds
  their values starting at the same place and the two standing the same height, at a phone's width
  and a laptop's, in an app's frame, and on a phone at twice the text size, and an inline read-only
  value centered and as tall as an editable one. Others find a tall read-only stepper at the larger
  target with its figures at a field's padding, the value and a focused button where they stood as
  the field turns read only, and hidden pieces kept hidden with the sheets read as a browser without
  `:has()` reads them. Browser tests stand the README's checkout row and a filled callout
  `--dk-space-4` under what is above them, with an empty or hidden callout adding no room, stand
  each of the kit's blocks a step apart in a plain form and inside a dialog, draw a page's own
  markup in a plain form as in a form with a class, keep a field with the kit's email error inside a
  narrow form and beside a button in a page's own row at twice the text size, break the address in
  the kit's error and in React's only after its "@" there, and leave the error a refusal adds to
  bare markup at its own margins. Browser tests in Chromium, WebKit and Firefox find a busy button
  past the wait drawing the dots, which an off button beside it lacks, with its name kept and
  neither button's box changed by them, the dots centered on a button aligned to its start, three
  across at larger text sizes, clear of words that wrap, of a text button's underline and of an icon
  at larger text sizes, with every button of one line at its least height, text buttons in a lead
  and in loose leading among them, out of sight during the wait, no fainter than the pulse's floor,
  still under reduced motion, still and in the system's gray in forced colors, and absent from a
  busy button not yet marked off. A save that ends just after the wait lets real time pass for
  React's redraw, which WebKit needs. A unit test holds the dots at 3:1 on every ground at the
  faintest of the pulse, and the scope test allows the busy button's `::after` alone and holds it to
  a mark with no words that takes no place. A browser test finds a field in a wide stack, a page and
  a band at 1280 no wider than the measure, a form's and one with a button beside its control too, a
  callout in the form at the measure and ending where its fields end, a callout outside a form at
  the column's width, a field a page widens at the stack's width, and a field in a kit dialog, a
  native dialog and a popover a page widens at their width. A browser test focuses a button of a
  read-only, an editable and a disabled stepper by the keyboard, takes each down by its signal and
  by its detach, and finds focus on the read-only value or on the group named by the label, never on
  the body or an editable value, both buttons hidden and the ring drawn. Others find the box's
  attributes as drawn, but for the tabindex, through takedowns and attaches, a page's own attributes
  kept, older markup given a tabindex, a box that refuses focus left as drawn with focus sent on to
  the main content, the group's name kept as the value changes, a stepper attached again left out of
  the tab order, the buttons kept where the page attaches the stepper afresh as focus comes to it,
  and focus the page moves or asks for in the abort's task landing. The leak test takes the stepper
  down with a button focused. Browser tests draw a stepper field beside a text field in a page's own
  flex row at 320 wide, at the usual and twice the text size, and find the stepper and both its
  buttons inside the field, at least 44 wide and the target tall. Another gives the field a hint
  with words that never wrap and finds the field no wider than its stepper's least width, with the
  stepper and its buttons inside it. Browser tests in Chromium, WebKit and Firefox submit a date, a
  date and time, a time, a month and a week field below and above their limits and find each error
  ending on "or later" or "or earlier" with its limit in words and no period against it, a page in
  British English given its own order, a page in French given US English with an English part of it
  given its own, a field in a shadow root given the language of the page around it, a limit in a
  spring-forward gap in New York keeping its hour, a year under 100 kept, a limit past any date
  shown as written, a fraction of a second shown, and an overnight window for a time, never for
  limits that are equal or one that does not parse. WebKit and Firefox draw a month and a week as
  text fields with no limits. A browser test in Chromium, WebKit and Firefox refuses a field through
  `useFormRefusal`, draws its error again with new words, plain and with an address, while the
  refusal stands, and finds no exception, one error with the field's id, shown, described and
  marked, focus on the field and the refusal said once on the status line. The form tests run in
  Firefox as well. A browser test in Chromium, WebKit and Firefox draws two text fields in a page's
  own `1fr 1fr` row at 390 wide, one label wrapping, a text field with a wrapping label beside an
  inline stepper in the same row, and a stepper's field in an `auto` column at 320 wide and twice
  the text size, and finds each input and each stepper's buttons and value at the height of the same
  field drawn alone, and the inline stepper's label level with the text field's. A browser test in
  Chromium, WebKit and Firefox finds a stepper's field and a text field at equal widths a step apart
  with their controls level at 390 and 1280 wide, and each on its own line at 320 wide and at twice
  the text size, every label on one line, every part inside its field and no sideways scroll. It
  finds a stepper no wider than 10rem, the same boxes drawn without `:has()`, neither field moved by
  a range error or a long label, a long address breaking inside its field, an inline stepper and
  choices each on a line of their own, two text fields sharing a line only where twice the length
  and the gap fit, three at 1280, both controls level beside a hint, and a row in a plain form a
  step from the fields around it, ending at their edge, with a field in it narrowed by
  `--dk-field-measure`. It finds a tall stepper, a tall one of three figures and one of three, at
  the lengths the reference gives, inside their fields with their buttons at full size beside a text
  field, with and without `:has()`. A sheet test fails a rule that names the row with anything after
  it unless it only sets how a field the row holds flexes, from a basis no content sets. CI runs the
  browser tests in WebKit and Firefox in three shards each, where two came close to a job's time
  limit, and a unit test holds each to more shards than Chromium, counted from its matrix alone.
  Chromium keeps two. Firefox's shards run on Ubuntu, as Chromium's do, so WebKit's are the only
  jobs on a Mac and none waits for a runner another holds. Browser tests in Chromium, WebKit and
  Firefox type a value past a stepper's range and submit by Enter and by a press on the button, in a
  form attached with `attachForm` and one refused through `useFormRefusal`, and find one error
  drawn, one in the field's description and one message on one line, with the stepper named, with
  another field named, with a summary taking focus and with a stepper that speaks through a `say` of
  its own. They find the stepper's own words left said in a form the kit does not check and on a
  stepper the check passes over. Browser tests in Chromium, WebKit and Firefox, in a form attached
  with `attachForm` and one refused through `useFormRefusal`, save a blank stepper that is not
  required with no error, refuse a required one emptied and one holding 2.5 with the stepper's own
  error, refuse one holding a letter with one error, and give a required stepper drawn blank and
  never touched its own error. A stepper's own tests find a shown error gone as a script makes the
  field optional, and gone with its buttons marked again as a script changes the step. A browser
  test in Chromium, WebKit and Firefox wraps a row between two fields in a page, a panel, a dialog,
  a stack, a stack in a panel, a pair's stack, a plain form, a plain form in a panel and a stack
  nothing holds, and finds every step between the fields equal. Browser tests in Chromium, WebKit
  and Firefox find no focus moved and no press spent under a signal already aborted, a request
  called off by an abort with its press handed back, a landed request holding nothing on its signal,
  and the views left landing where one of several asking for the same press is aborted. Browser
  tests in Chromium, WebKit and Firefox press a button inside a shadow root that changes a view's
  key and find focus on the view's heading, and ask late, from a component since gone, for an id
  inside a shadow root and find focus there. Browser tests in Chromium, WebKit and Firefox find no
  search of the page as a panel's button takes focus and one where both buttons are off, and find a
  key that is not Escape reading its path no more often with panels attached than with none. A unit
  test calls every attach that throws for a missing part with markup missing it under a signal
  already aborted and finds each throw, and another finds every error the controls throw, of any
  kind, among those cases. Browser tests in Chromium, WebKit and Firefox take a part from an
  attached stepper, panel's button and toast, and find a repeat attach returning the control and a
  fresh attach refused by name. A unit test says firm words that throw, then polite words after them
  and behind them, and finds the polite words said and the error reported. Browser tests put back a
  page's own `closedby` as a dialog attached to stay, and one attached without it, is taken down,
  keep one the page set while the dialog was attached without `stay`, and leave a dialog attached
  again from its own takedown with the `closedby` that attach set. A browser bench in Chromium reads
  the elements each recalculation restyled from the browser's trace on a content page, a frame and a
  page that ends in a tab bar, and holds an element added, words on a status line and a field marked
  in error to a twentieth of what a change to the root's font size restyles, and showing a toast to
  no more than one restyle of the whole page. Browser tests in Chromium, WebKit and Firefox find the
  frame marked while a toast floats over its body and unmarked in its row above the dock, after each
  way of dismissing it, after a takedown and on a frame the toast has left, the room kept through a
  body replaced by a new element and inside a body that is itself the frame, a toast in its row
  where the body sits inside a form, and a dialog beside a wrapper that holds a frame at an app's
  sizes with `dk-dialog-app`. In Chromium and WebKit they find a dialog at an app's sizes after,
  before and inside a frame and at a content page's set apart from one, and in Chromium and Firefox
  the room in a frame kept with every selector that asks for a `:has()` taken out. A sheet test
  fails a `:has()` on an element that holds the page in a rule that draws something else, and holds
  every list of an app's places to one form. Browser tests in Chromium, WebKit and Firefox double
  the root size in the page's own sheet, Tab to a link under a shown toast and under a tab bar at
  390 and 320 wide, and find the link clear of each and the room kept no less than what covers it. A
  sheet test finds no rem, written or read through a token, in a property of the root's own, and
  each twin in em holding its token's number and read by the root alone. The tab bar's browser tests
  run in Firefox as well as Chromium and WebKit. A browser test in Chromium, WebKit and Firefox
  draws a stepper beside a text field in a `dk-fields` row at 1280 wide, on a page, in a panel and
  in a dialog, and finds their labels and controls level, the stepper's buttons and value at the
  field's height and the buttons the target wide. It finds the same pair level at the target's
  height on a phone, at 48rem, in an app's frame, on a page that ends in a tab bar and in a dialog
  on either, a tall stepper at the larger target at both widths, an inline stepper and a read-only
  one at the field's height at each, and a stepper as tall as a select and a field with an action
  beside it. The stepper's tests that nothing is said as it is attached past its limit, or as a
  form's reset brings such a value back, and the form's test that nothing more is said as a page
  draws a field's error again, stop the clock, keep every set of words the line is given by a watch
  on the line itself, the same words twice included, and run the clock past the moment a line waits
  before reading it as silent. The stepper's tests of its buttons at twice the text size name the
  steppers they measure and find both buttons of each. The read-only fields are drawn once at 320
  wide with twice the text size and wider text spacing together, and their labels, their controls
  and the page's sideways scroll are measured there, each control held to the height its line needs.
  The test that guards a row of fields searches the sheets for every place the row is named and
  holds the rules found to a list written in the test, so a rule that names the row in any form
  fails until it is added on purpose, and holds the rules for what the row holds directly to how a
  field flexes from a length. A test reads the controls' exports and finds every attach and
  `moveFocus` in the table the teardown and leak tests share, and every hook the React entry exports
  in the page the leak tests draw. Browser tests hold a tall stepper's buttons the target wide or
  more and inside its field in a row left at 10rem, hold how far a stepper runs past its field
  without `:has()` to what the accessibility notes say and find none a pixel past each end they
  give, and draw the row under wider text spacing at 320 and 390 wide. The tests of the step between
  pieces run in WebKit and Firefox, and those of the hero, the split row and the dock's pair of
  actions in Firefox. The page helpers hold the one recorder of every set of words a status line is
  given, each write kept so the same words said again are kept again and a line put in already
  holding words heard as it arrives, and the one swap of the kit's sheets for the same sheets as a
  browser without `:has()` reads them, which fails unless the kit's part of the sheet the page then
  reads keeps no rule naming `:has()`. Every spec and page that heard a line or swapped the sheets
  uses them, and a browser test of the recorder hears a line put in already holding words. A
  stepper's tests of a takedown with a button focused have a spec of their own, run in Chromium,
  WebKit and Firefox. The tests that lined a read-only stepper's figures up with a field's words
  measure where the words start from the boxes and the alignment rather than from the first dark
  pixel of each face, so a font a runner swaps in moves nothing, and a value drawn 2px off its place
  fails them. The budget tests measure the controls from the package laid out as npm ships it, hold
  the controls imported bare, `attachTable` alone and `attachForm` alone to budgets of their own,
  and find nothing of the theme script in a bundle of the theme names the controls import. A unit
  test finds each theme word written in quotes as JSON writes it. Unit tests give the kit's words
  for every failure and every dated limit the browser tests read, and an ISO week, a year under a
  hundred, a fraction of a second, an overnight window and a malformed language. A check finds every
  link into the reference, from the READMEs, the records, the change files, the site, the code's
  comments and the sheets, and from the reference itself, landing on a heading it has, and holds the
  contents list to the headings in their order. A browser test in Chromium, WebKit and Firefox Tabs
  to each kind of dated field and finds the outline a text field draws and no other ring, and
  presses each and finds what a pressed text field draws. A browser test in Chromium and WebKit
  finds a callout before the first field of a stack, one between two fields and one after a row of
  fields ending at their right edge, one after a field and a table ending at the measure as the
  prose there does, one with no field beside it running the column, one in a dialog as wide as the
  dialog's field, and every one but the callout before the first field held the same without
  `:has()`. Browser tests in Chromium, WebKit and Firefox, on a page of many controls, find F8
  moving focus to the action, Enter running it and Escape dismissing the toast with focus back where
  F8 was pressed, F8 in the toast sending focus back with the toast still shown, F8 with no toast,
  with no action, with a modifier, as a repeat or after a dismiss moving nothing and keeping its
  default, as does an F8 that converts text in an input method, F8 in the toast going on down the
  walk where its control is gone, following a frame of the page's own origin and heard by the toast
  that holds focus, and `aria-keyshortcuts` on the action while shown and not after. The leak tests
  count the document listener only while a message with an action is shown, and the teardown table's
  toast shows one, so its takedown is found to take the listener off. A unit test builds pages
  together and finds each page's chunks without another's piece: the form beside the table, the busy
  button beside the toast, and a focus request beside the dialog. Others find the shared state kept
  on a bare import, nothing sent for any other internal module imported bare, no part importing
  another and no cycle among the modules, every part that keeps a registry attached in the teardown
  table, and the React modules reaching the controls only through the entry. The browser tests serve
  every module of the controls. Browser tests in Chromium, WebKit and Firefox refuse a React form
  with an empty required field and a stepper typed past its range, build a summary from the second
  list, and find the stepper listed with its own words and focus on the summary, and say the first
  field's name and error with the count once the summary already has focus. They find a plain form
  attached with `invalid` handed both lists, with the stepper's words read past a hidden start
  nested in its error and its lines joined, and a summary hidden by an ancestor or a style, made
  inert or not focusable, passed over, and a focused summary's own line said where no field is
  marked. A set's failure in a summary is keyed and linked by its field. The package's type check
  types the second list, with a page that takes one argument still compiling. Browser tests in
  Chromium, WebKit and Firefox stand a value of one line at a read-only field's height with its
  first line level with the field's words at 1280 and 390 wide and in an app's frame, at the usual
  and twice the text size, grow a long value and a long option to show whole at 320 wide with twice
  the text size and wider spacing, draw a value one field tall where the browser cannot size it,
  fill a value's field and keep a button's place beside a read-only select as beside an input, keep
  the select's line level with a button whose words take two lines, submit nothing for Enter in a
  read-only select, keep a note's height as it turns read only, and draw the read-only look on a
  value and a field alike. Browser tests in Chromium, WebKit and Firefox, in a form attached with
  `attachForm` and one refused through `useFormRefusal`, type a value past the range above a Save
  button, press and let go of Save with the pointer, and find the form refused on that one click
  with one message, as for a Save button outside the form tied to it, and in Chromium and WebKit for
  one tap. They keep the click of a button that submits nothing below the stepper and of one beside
  a stepper in no form, show the error at once as Tab leaves the stepper, once a press on Save is
  dragged off and let go and once a press on a link turns into a drag, and save on a press after an
  error is put right. The restyle bench shows a stepper's button in a plain form and holds the
  elements restyled to a tenth of the form. Browser tests stand a field a step below an empty
  callout written without its mark and none below a marked one, in Chromium, WebKit and Firefox. The
  still clock the browser tests share starts at a fixed moment and stops a day after it, so a runner
  slow between the two calls never fails a test with "Cannot fast-forward to the past" before its
  first step. A test in Chromium, WebKit and Firefox waits seconds between the two calls and finds
  the clock stopped. The checked form's spec says why its React page's radio is chosen by the
  keyboard, with what is known of a click in Firefox that once left it unchanged. Browser tests in
  Chromium, WebKit and Firefox, in a form attached with `attachForm` and one refused through
  `useFormRefusal`, submit a required stepper blank and find its own error alone with the page
  handed nothing for it, then type a value past the range and find one error drawn and one
  described, find `aria-invalid="false"` once the error clears by a value put right, after a submit
  and by a reset, find no mark on a stepper outside any checked form, and hear "Form cleared." once
  on a reset that takes a stepper's error away and nothing on one with none showing. They keep a
  stepper's error through a reset the page calls off, take away the form's error on a stepper once
  its own shows, and hear "Form cleared." after a refusal for a field tied to the form from outside,
  for one the page marked invalid, for a page whose own reset listener clears its errors first, for
  a page that clears its errors with a stepper drawn past its range, and for a stepper put right
  since, and nothing after a stepper showed its error as focus left it with no submit or after a
  submit that passed. They leave a required stepper's failure to the form where the page shows an
  error of its own, show a stepper's range error on a reset that brings back a value past its range
  over the kit's error, take away the mark a stepper put back once its form's attach is taken down,
  and show a stepper's range error alone where it fails the page's own refusal too, with the page's
  words once it is in range. Browser tests in Chromium, WebKit and Firefox leave letters typed into
  a blank stepper by Tab and find its error drawn, the field marked invalid and the error said once,
  pass a blank required stepper by Tab and find nothing, press the stepper's own button straight
  after letters and find the press landed with no error drawn, find no error for letters as focus
  stays, as the field turns read only or beside the page's own error, leave a hidden required mark
  out of the name said by a stepper and by a refusal, and find the field's name before the error on
  the status line, with a press saying the value alone. In a form attached with `attachForm` and one
  refused through `useFormRefusal`, they hear the letters' error after the field's name as focus
  leaves, then the refusal alone, and submit right after the letters by Enter and by a press on the
  button and find one error and one message. The test that each piece of a dialog stands one step
  after the one before it waits for a sheet's rise to end before it measures, since WebKit reads
  each piece where it stands at the moment it is asked, and a measure taken during the rise read the
  gaps short. Browser tests in Chromium, WebKit and Firefox hold the thread past a second after a
  request on a page in sight and find it landed, find a request dropped where it was asked out of
  sight, where the page went out of sight before its frame, told of its return or not, where its
  frame runs out of sight and where its frame comes more than ten seconds late, and find a view
  landed that joins views asked before the page went out of sight and came back. Browser tests in
  Chromium, WebKit and Firefox take a stepper down and then its form and find no mark on it, keep
  the mark of a stepper taken down and attached again on the same field, draw a stepper again and
  again in one form, each leaving the page, and find the form's teardown reaches none of them, let
  go of a field the form marked itself and of one moved between two checked forms once it leaves the
  page, and leave the mark a later check of a form sets on a stepper that outlived the first.
  Firefox kept the words each test sent from a form for every later test in the same browser, and
  listed them under a field filled with the same words again. A press on the page made as the list
  opened never reached it, so a checked form's stepper test that filled a name and then pressed Send
  at times found the form never sent and waited for a refusal that never came. The Firefox project
  turns that list off, and a browser test finds a field offered none of the words a test before it
  sent. Unit tests find a date, a time and a week limit named in the Gregorian calendar and Latin
  digits under a calendar and a numbering extension, a month in year 1 written so it cannot be read
  as a day, and the step words for a base taken from the value attribute, for a `min` that does not
  parse, for a step of `1.0` and for a step and a base written as their attributes write them.
  Browser tests find the calendar and the digits kept, and the step words counted from the value
  attribute pointing to a value the browser takes. Browser tests attach a toast inside a frame from
  the page and find F8 reaching its action, a dismiss handing focus back to the control in the
  frame, one the page made and moved there among them, and the frame's listeners coming off at
  takedown. Browser tests attach a dialog, a panel and a toast inside a frame from the page and find
  focus handed back to the control in the frame or the page's own opener as each closes, focus left
  where a visitor moved it as the page closes one, panels of the same id kept apart, a toast's hand
  back into a frame within a frame, and the frame's listeners coming off at takedown and once the
  frame has left the page. Browser tests attach a form, a stepper, a grid and a table inside a frame
  from the page and find a refused submit moving focus to the field in error with the kit's error
  and the page's status line, a stepper's focused button kept as its value turns read only and focus
  handed to its value or its box as it is taken down, the grid's stop and arrows and focus handed on
  from a cell taken out, and a link brought clear of a pinned column. Browser tests find a request
  asked from one control of a frame, through `moveFocus` and through the React hooks, leaving focus
  on another the visitor moved to, a request given a control in a frame as `from` finding its id on
  the page, and a request landing after its frame loads another page or the page hides the frame.
  Unit tests read a field's language past a shadow root of a frame's, from the frame's own document
  and then the page's, and find no part of the kit but the focus module calling `activeOf`. Browser
  tests find focus left in a frame where the visitor tabbed, or clicked a field and typed, after a
  press on the page that brought a view, and a view's heading taking focus as it arrives for a press
  inside a frame, a frame that loaded another page, a frame added inside a frame, a frame still
  loading, a frame the page wrote and an object. They find a keydown with no key throwing nothing
  and counting for nothing, and a frame's document heard once however often it is reached. Browser
  tests find focus left in a frame inside an open or a closed shadow root, a frame of another origin
  and a frame whose form went on to another origin after a press on the page, and a view's heading
  taking focus for a press in a frame added after its load while its page loads, in a frame's next
  page before its load, in a frame inside a shadow root whether focus is read before its click or
  after it, and in an object, one loaded before the controls among them. A test in Chromium and
  WebKit finds a press standing through a mousedown on a frame's scrollbar. They find no page error
  as a frame is taken away while its next page is read, as a frame goes on to another origin, or as
  the page is left and gone back to. Browser tests find a heading on the page focused from a
  widget's button in an open shadow root and in a nested one, a widget's own id found before the
  page's, the page's element of an id a closed shadow root shares found from that root, an id on the
  page found with focus in a frame inside a shadow root and by a late request from a component in a
  shadow root since gone, and a page with a form or a frame named `host` finding its id with no page
  error. A check finds no module of the controls asking `'host' in` a root.

## 0.9.3

Every attach takes an `AbortSignal` as `signal`, and aborting it takes the piece down under the
teardown contract record 22 writes down, with a request to `moveFocus` called off the same way. A
control outlives an abort and an attach of its element in the same task, as record 23 has it, so a
hook's ref made afresh on every render, a ref that merges two hooks and an element passed from one
hook's ref to another's keep their control and its state. Options count as given only where a key
other than `signal` has a value, so an attach called again with `{}`, or with its other keys left
undefined, keeps the options it had. The React hooks take their controls down through ref cleanups,
and under `StrictMode` in development each control is kept with nothing doubled or dropped, and a
focus request asked as its component unmounts still lands. The toast, the dialog and the panels hand
focus back by one rule, so focus a page or a visitor moves elsewhere stays, during a handback too.
That handback can land on any HTML or SVG element that takes focus, such as a link in an inline
chart, and each piece counts focus inside a shadow tree within it, or on a control slotted into it,
as focus in it. A toast sends focus back to the control the visitor came into it from, on into a
frame of the page's own origin where focus was inside one, and to the page's body in every engine
where nothing else takes it. As a message shows, it now keeps the control that has focus inside a
frame of the page's own origin clear of itself, as it did a control on the page. A focus request
asked in the task that closes a dialog lands where the page asked rather than on the opener. A
stepper drawn past its limits shows its error at once, a group the arrow keys move through places
its Tab stop as it comes into sight from no size, and Escape closes an open panel once the button
that opened it is let go, while an Escape that clears a search field or closes a list inside a
page's own component in the panel is left to the component. Upgrading names the code a page can now
take away for the stepper and the group, and how a page now puts a piece's options back to their
defaults. Browser tests in Chromium, WebKit and Firefox count the listeners, observers, timers and
frames on a page and find every attach and hook leaves none of its own once it is taken down, and
the tests on a stand-in clock move time only by their own steps, so a slow runner no longer makes a
message leave early. Each teardown behavior is tested in one place, with no test that passes with
the code it guards taken out, and no kit spec waits on real time for what a still clock can step. No
token is added or renamed and the theme script is unchanged, so `themeScriptHash` is the same. The
sheets stay within their budget, and the controls' budget is set at 20 KB under record 13's rule.

- **Upgrading.** A page that draws a stepper's error itself when the stepper is attached with a
  value past its limits can take that code away, since the attach now shows it, and a refusal the
  page sets with `setCustomValidity` no longer shows the stepper's error once the value is changed.
  A page that waits for a closed `details`, a hidden panel or a dialog to show before it attaches a
  group the arrow keys move through can attach the group at once. A piece attached again with `{}`,
  or with every key but `signal` undefined, now keeps the options it had, where 0.9.2 put them back
  to their defaults. A page that did that to put them back gives one option the value it has by
  default instead, as `{ stay: false }` for a dialog attached to stay, and since the options it
  gives replace the last whole, every key it leaves out goes back to its default too.
- **Controls.** `attachThemeSwitch(element, { signal })` and
  `attachCopyButton(button, { source, status, signal })` take an `AbortSignal`, and aborting it
  takes the control down as the function they return does, a microtask later and once no other
  signal holds it, the switch's listener on the document taken off with it even where the page has
  marked its choices closed. A signal already aborted does nothing, so the control stays hidden, and
  a control already attached keeps the options it had. A press the clipboard answers after the
  teardown says nothing, and a control attached again returns what its first attach returned, the
  later call's signal holding it too. The theme's listeners on the window stay, so `chooseTheme`
  still follows another tab with no switch on the page. The type `AttachOptions` carries the option.
  Both take themselves down through one internal helper, which no entry exports. It runs every undo
  even where one throws, and reports the error. `attachStatus(line, { signal })` lets the line go
  when its signal takes it down, as `StatusProvider` does when it unmounts: its timers are cleared,
  its words dropped and it is emptied, no piece says anything on it until it is attached again, and
  the function the attach returned says nothing after. A line let go of and attached afresh takes
  its old attach down, so its signal holds nothing, while a piece given the line itself speaks on
  its next attach. `attachToast(element, { signal })`, taken down by its signal, dismisses its
  message as its Close does, focus in it going back where a dismiss sends it, takes off its
  listeners, its observer, its listener on the window's size and its timer, takes away a tabindex it
  added that the page has not changed since, and lets its line go, and the function it returned, and
  what that returned, do nothing after. A signal already aborted returns a function that says or
  shows nothing, though a toast missing a part is still refused, and a piece attached again returns
  its first attach's function, the later call's signal holding it too. The form, a busy button and
  progress now speak on a page's line without attaching it, as the stepper and the copy button
  already did, so none of them holds a line a page attaches with a signal. A toast listens to the
  window's size once however many messages it shows. `attachForm(form, { signal })`, taken down by
  its signal, takes its listeners off, calls off a refusal not yet landed and a reset's timer still
  waiting, and takes away the errors it drew, so nothing is said after, not even "Form cleared.",
  and a refusal asked for after does nothing. The form's check, its `noValidate` and its marks on
  fields not in error stay while any attach in the form is attached, and go with the last, so the
  browser checks the form again. `attachPanel(button, { signal })` lets the button go when its
  signal takes it down, as `detach` does. A signal already aborted attaches nothing to either. An
  open panel stays the kit's while an attached button names it, so once the button that opened it is
  let go, Escape closes it as its Close does, with focus going back to the first attached button in
  the page that names it, where before only the Close did, and the button let go takes
  `aria-expanded="false"`. A button drawn again while its panel is open, the only one among them
  too, keeps the panel open and closes it by Escape. A panel's buttons are kept apart from the page,
  so one in a shadow root takes the panel too. A reset, and a submit the form's own attach checks,
  take away errors a part's attach drew before it, and a reset calls off a refusal still due, which
  would otherwise say the errors it took away in place of "Form cleared." The theme switch's
  listener on the document comes off however its choices close. `attachStepper`, `attachTable`,
  `attachRoving`, `attachBusy`, `attachProgress` and `attachDialog` take an `AbortSignal` as
  `signal`, and aborting it takes the piece down as the function they return does, a microtask later
  and once no other signal holds it. `attachTable` takes its options as a new second argument, and
  still refuses an element outside a table's frame when its signal is already aborted. A signal
  already aborted attaches nothing and leaves a piece already attached with the options it had. The
  dialog, whose attach returns what opens it, is taken down by its signal alone: an open dialog
  closes, handing focus back to what opened it by the rule below, as does one closed in the same
  moment, a close still to come never reaches a later attach, its listeners come off with the
  `closedby` its `stay` set, and its open function does nothing. A busy wait still running is
  cleared, so its words are never said, a stepper's error not yet said through a page's `say` is
  left unsaid, and a progress step not yet heard on its status line is taken back, even one waiting
  behind firm words. `moveFocus` takes a `signal` that calls off a request not yet landed, as the
  function it returns does, and a request that lands lets go of the signal. A request asked as its
  component unmounts still lands when it is given no signal that unmount aborts. Each takes itself
  down through the internal helper in place of its own guard against a second detach.
  `attachStepper` shows the stepper's error as it attaches, and again when a form's reset brings the
  value back, when the value is outside the limits or between steps, describes the field by it and
  marks it invalid, and says nothing on the status line, so a page that draws that state, as the
  kit's site does, writes no code of its own for it. A field drawn blank, a field that is disabled
  or read only, and a field showing the page's own error show no error as the page loads, and the
  error is cleared as before once the value is right or the stepper is taken away. The error now
  names only a value outside the limits, between steps or missing, so a refusal a page sets with
  `setCustomValidity` no longer shows the stepper's error, as it attaches or once the value is
  changed. `attachRoving`, and `useRoving` in React, place the group's stop again as the group's
  size changes, so a group attached in a closed `details`, under `hidden` or `display: none`, or in
  a dialog not yet open has its stop once it shows. Such a row of tabs used to leave every cell at
  `tabindex="-1"` once it showed, so a keyboard user tabbed past it. A cell a media query or a
  page's rule hides as it resizes the group hands the stop on to the next cell, as a cell taken out
  does. A group under `inert`, or hidden in a way that keeps its size, is placed again only as its
  cells change or are reached. The group's detach stops watching its size. The internal module that
  keeps each status line's state now holds the code that says, holds and hushes words on it too, and
  letting a line go hushes it through that code. The internal teardown helper, given a signal
  already aborted, gives a teardown already stopped, whose undos run at once, in place of null, so
  each attach keeps one early check and the form's shared check uses the helper rather than building
  its own. Each signal an attach of an element is given holds its control, and the control is taken
  down a microtask after the last of them aborts, unless the element is attached again by then,
  which joins it and keeps its state and the parts it found first. Until then the control is whole,
  so a call in the abort's own task, such as a panel's `set` or a dialog's opener, still acts, and a
  page that means to start afresh within the task calls the function the attach returned, which
  takes the control down at once, or attaches after a microtask. A call with no signal holds the
  control for the page's life where nothing else holds it, an attach in the abort's own task among
  them, and an attach made from inside a control's own takedown gets a control of its own. A control
  attached again returns what its first attach returned and runs on the options of its newest
  holder, or of the holder whose options apply where that one gives new ones, and when the holder
  whose options apply lets go, the newest one left that gave options takes over with them a
  microtask later, unless a newer holder has given its own by then. Options count as given only
  where a key of their own other than `signal` has a value, `null` and `false` among values, so a
  dialog attached again with only its `signal`, as through a ref made afresh, or with props that
  leave `stay` undefined, keeps `stay`, a call that gives no options keeps its holder's last ones, a
  control whose holders left gave no options goes back to its defaults, a copy button keeping its
  source and status line, and a call with no signal is kept under the page's own hold where it has
  one, so a hook sharing the element takes nothing of the page's update with it as it goes. The
  toast, the dialog and the panels hand focus back by one rule, only where focus is in the piece, or
  where it is on the body or nowhere and the piece had it as it left, and a dialog also where focus
  is still on what the browser handed it to as it closed, so focus a page sets in the abort's own
  task stays, and `moveFocus` treats focus the kit handed back after a request was asked as free, so
  a request asked as a dialog or a toast with focus in it is taken down still lands. A toast taken
  from the page with focus in it hands focus back in every engine, though Chromium fires focusout as
  it goes and WebKit and Firefox fire none, and forgets it had focus once the visitor moves focus
  outside it or presses while it is off the page. A toast reads whether focus is in it a microtask
  after focus leaves, so focus that leaves and comes back in one task keeps it shown, and in
  Chromium one moved in the page with focus in it starts its wait again. A copy button joined with a
  source that gives the element its last press copied keeps the word it shows, reads the source only
  while a word is shown and takes one that throws for another element, and progress counts its steps
  again only where their count changes. `attachToast` hands focus to the first of these that takes
  it: the control focus last came into the toast from, then the control outside the toast that had
  focus as the latest message came, then the body of the app's frame or the page's main content. A
  keyboard user who moved on from where they were as the message came lands where they left off.
  Focus that last came into the toast from nowhere passes over the first, and focus goes back to a
  control inside an open shadow root rather than to its host. A dialog attached by `attachDialog`
  keeps what had focus as it opened, which the browser hands focus back to as the dialog closes. A
  `moveFocus` request treats focus there as free while the dialog is closed and its close not yet
  handled. A request that lands while focus is there takes that place from the dialog. The dialog's
  close event and its takedown hand focus back by one test, where focus is still on that element or
  by the rule every piece hands it back by. So a request asked in the task that closes the dialog,
  takes it from the page or takes it down lands on its target, whenever the close event comes. This
  holds when an answer's form closes the dialog, when the pressed control is taken away as it is
  pressed and when the opener is not what had focus. Focus the page moves elsewhere in that task
  stays. A dialog closed and taken down in one task hands focus to its opener as a plain close does.
  `attachStatus` joins a later attach the way every other attach does, and a status line behaves as
  it did. The handback the toast, the dialog and the panels share focuses an SVG element as it does
  an HTML one. Focus that came into a toast from a link inside an inline svg, or was on one as the
  message came, goes back there, a dialog opened from one returns focus to it, and a closing panel
  can hand focus to one that follows it, its address written with `href` or `xlink:href`, or to the
  place on the page that one pressed inside the panel goes to. The panel tells an SVG link by its
  name rather than its class, so a page's unit tests in jsdom, which has no class for an SVG link,
  close a panel without an error. A press on a link written with `xlink:href` counts as a press for
  `focusOnArrival`. A dialog's `returnTo` may give any HTML or SVG element that takes focus.
  `moveFocus` and `focusOnArrival` land through the same helper, so an SVG target or fallback takes
  focus too. `attachToast` takes off a message's shown state, then hands focus back, then hides its
  buttons, so the control focus goes to is not scrolled clear of a toast that is leaving, and where
  nothing it tries takes focus, it moves focus off the toast, so focus falls to the page's body in
  WebKit and Firefox as it does in Chromium, rather than staying on the toast's hidden button. Where
  a page's own listener moves focus elsewhere as the toast, a dialog or a panel hands it back, the
  handback goes no further down its list and that focus stays, and a `moveFocus` asked before a
  handback that focused nothing leaves the page's focus alone. Focus a place hands on to its shadow
  tree, as a host that delegates focus does, counts as handed back, while a place that refuses focus
  is passed over though focus is inside it, so a `moveFocus` whose target is a section with no
  tabindex goes on to its fallbacks. A dialog tries what the browser handed focus to as it closed
  after its opener and `returnTo`, so where its opener has gone, a `moveFocus` asked in the task
  that closed it still lands. Where the handback focuses a frame of the page's own origin that had
  focus as the latest message came, it goes on to the control inside that had focus there then, and
  stays on the frame where that control is gone, marked off, or on a page the frame has since
  replaced. A frame of another origin keeps focus itself, as near as a page can reach, though
  Firefox does not focus such a frame while a key is being pressed, so a dismiss by keyboard there
  goes on to the body of the app's frame or the main content. The rule the toast, the dialog and the
  panels share for handing focus back counts focus inside a shadow tree within a piece or on a
  control slotted into it as focus in it, by walking out through each slot a node is drawn in and
  each shadow root's host, so focus on a page's own button component in a dialog's form, a panel or
  among a toast's buttons is handed back as the piece closes or leaves. The toast reads focus there
  as focus in it too, so its wait holds while focus is there and a message shown then keeps where
  focus was before. A panel reads an Escape where the key was pressed, inside a page's own component
  where the component's shadow root is open, so an Escape that clears a search field or closes a
  list there, or on a component whose host is marked as an open combobox, is left to the component
  and the panel stays open. A closed root's nodes are not on the event's path, so there the panel
  still takes the Escape. An element inside a component's shadow tree that shares a panel's id
  closes nothing, and an open dialog or an open popover inside such a tree keeps its Escape from the
  panel, as one in the panel's own markup does. As a message shows with focus inside a frame of the
  page's own origin, the toast measures the control that has focus there, read as the message comes,
  where the frame places it on the page, past the frame's border and padding and scaled across and
  down as the frame is drawn, rather than the whole frame. Where the toast would cover that control,
  it scrolls the control into view through the frame and the page, by the room the sheet keeps under
  a shown toast, so a tall frame no longer hides it. A control there that the toast does not cover
  stays where it is, though the frame reaches under the toast, and so does one the frame has
  scrolled out of its own sight or behind its scrollbars, or one taller than the room above the
  toast. A frame of another origin is measured whole, as before. For a control on the page or in a
  frame, the toast is now measured where it comes to rest rather than where its entrance starts, so
  a control it covers by a few pixels is scrolled clear too, and a control counts as covered only
  where it meets the toast across as well as down, so one beside a narrow toast on a wide screen no
  longer scrolls.
- **React.** Each hook's ref makes an `AbortController` as its element arrives, hands its attach the
  `signal` and returns the cleanup that aborts it, which React 19 calls in place of calling the ref
  with null, so a row of cells, a busy button, progress, a form's check and a provider's line are
  each taken down by their attach's own teardown. A hook keeps every element its ref is on, so one
  ref on two forms, rows of cells or bars keeps the one left refusing or taking new options as the
  other goes, each form refuses a failed submit through itself, and a ref called with null by a
  helper that merges refs and drops the cleanup takes every element down, since it does not say
  which left, while an element it is called with again in the same task keeps its control. Under
  `StrictMode` in development, the second run keeps each control as it was, with nothing doubled or
  dropped, so words said on `StatusProvider`'s line in a first effect stay through that run, held
  words are said on whichever line is attached as they come, and the function `useStatus` returns
  keeps speaking, and says nothing once its provider has gone. `useFocusAfterDraw` waits for the
  render of a request asked as its component first draws, from a ref on its own markup too. A
  request still waiting when its component unmounts, or when an `Activity` hides it, is made then,
  with where focus was read as it was asked, so a row that asks for focus on the next one as its
  press removes it moves focus there, at once, after an await, from a timer or in a transition.
  Nothing at unmount calls a focus request off, and `moveFocus` lands it only where focus is still
  where it was or has fallen to the page's body, so a visitor who moved on keeps their place. A
  request in a transition an urgent update overtook lands before the transition draws, on its
  fallbacks where the transition draws its target. A request asked after the component has gone, as
  a panel that closes and then asks after an await, waits a frame and is made then, taking focus
  only from the page's body, whatever `from` it was given, and only where its target is in sight, so
  one whose target an `Activity` hides with the component is held until it shows. A refusal still
  waiting as its form's component unmounts is called off, a microtask later so a refusal asked as
  the form first draws lands through React's second run in development. `useFormRefusal`, `useBusy`
  and `useProgress` speak through one private helper that keeps the page's `say` or the provider's
  line current, so a busy button and progress now speak through the `say` of the render that changed
  them, as the form's refusal already did. `useRoving` and `useProgress` pass their new options with
  the element's own signal, so where two hooks share an element each one's options apply to its own
  hold. A request `useFocusAfterDraw` makes late, once its component has gone, lands on an SVG
  target in sight rather than waiting for it.
- **Docs.** Record 22 states the teardown contract, with the research and the options weighed, and
  record 13 is amended for it. The reference says how a control is taken down, with a screen's
  controller aborted before the next screen attaches, and gives the two attaches their `signal`.
  Record 15 is amended for the status line's and the toast's signal. The reference gives
  `attachStatus` and `attachToast` their `signal` and says how the signal alone takes each down. The
  reference gives `attachForm` and `attachPanel` their `signal` and the panel's rule, and its
  section on taking a control down names the form and the panels. Record 19 is amended for the
  panel's rule and record 21 for the form's `noValidate` given back. The reference names `signal` on
  the stepper, the table, the group, a busy button, progress, the dialog and `moveFocus`, and says
  how the dialog is taken down and how a focus request asked at unmount still lands. Record 22 names
  every attach and `moveFocus` among the pieces that keep its contract. Record 20 is amended for the
  hooks' ref cleanups and the focus requests around an unmount, and names the ways of telling a
  stale request apart that were rejected. Record 22 says a focus request lands when its component
  unmounts before the request is drawn. The reference says how a hook takes its control down and
  when a focus request asked around an unmount lands. Record 22 names the new tests and the
  counters, and records 15 and 22 say the teardown tests count listeners in each engine they run in.
  The reference and the attach function's comment say when a value drawn past the limits shows the
  error and when it does not. The reference's sections on tabs and on a grid of buttons, and
  `attachRoving`'s comment, say the stop is placed as the group comes into sight from no size.
  Record 22 says what the helper gives for a signal already aborted. Record 23 states the rule and
  why deferring the takedown in the hooks was turned down, and records 13, 15, 19, 20 and 22 say
  what it changes. Record 13 sets the controls' budget at 20 KB, from 17.25 KB. The helper with
  every attach moved onto it, record 23's holders, the one rule for handing focus back, a handback
  that takes SVG elements and a toast that hands focus to the page's body or into a frame, pieces
  that count focus inside a shadow tree within them, and a toast that keeps the control inside a
  frame clear of itself took the controls to 19,609 bytes, with a median function of 633 bytes, and
  record 23 gives the weight at each step. The reference's section on taking a control down names
  `moveFocus`, says when a takedown lands, how options follow the newest holder and when the kit
  hands focus back, and each attach's section links it. The doc comments on `./controls` and the
  hooks say what the code does now. A panel's button taken from the page without being taken down is
  said to stay held until it is. The reference, the toast's doc comment and record 23 give the order
  a toast hands focus back in. The reference's dialog, its section on taking a control down and
  record 23 say that a `moveFocus` request asked in the task that closes a dialog sends focus to its
  target rather than to the opener, whether that task closes the dialog, takes it from the page or
  takes it down. One asked in an earlier task lands only where its frame comes after the dialog
  closes, so a page that awaits before closing asks again just before it closes. The reference's
  section on taking a control down and its section on the dialog, the dialog's doc comment and
  record 23 say which options count as given. Records 15, 19, 21, 22 and 23 name the one teardown
  spec and say what each spec now counts, record 3 says the browser tests run in WebKit and Firefox
  too for the specs `e2e/engines.ts` names, and the README describes the browser jobs and where the
  engine lists live. The reference's sections on taking a control down, on moving focus after a
  change and on the toast, and record 23, say a handback can land on any HTML or SVG element that
  takes focus, such as a link in an inline chart. Record 19 says the panel spec runs in Firefox too,
  where the case that goes back into the panel after a press outside reaches the link by focusing
  it, since Firefox sends Shift and Tab from a panel a press focused to the page's body. The
  reference's toast section and its section on taking a control down say where focus goes where
  nothing takes it, where a page moves it during a handback and where it goes back to a frame, of
  the page's own origin or another. The reference says the main content takes focus by the
  `tabindex="-1"` the skip link's markup puts on it. The reference's sections on taking a control
  down, the toast, the dialog and the panel, and record 23, say focus inside a shadow tree within a
  piece counts as focus in it. The reference says a control slotted into a piece drawn inside a
  shadow root counts as in it, and its panel section says the panel reads an Escape where the key
  was pressed, inside a page's own component where the component's shadow root is open. The toast's
  doc comment, the reference's section on the toast and record 23 say how the toast keeps the
  control inside a frame of the page's own origin clear of itself, and that it measures the toast at
  rest and across as well as down.
- **Tests.** Browser tests in Chromium, WebKit and Firefox attach the theme switch and the copy
  button with a signal already aborted and find nothing attached and a repeat attach's new source
  not taken, abort a signal and find both hidden, find a late clipboard answer and a theme chosen
  after the teardown change nothing, find an old detach called twice and its signal aborted leave a
  newer attach alone, and find the piece kept until every signal holding it has aborted. Unit tests
  hold the helper to running once, whichever of the abort and the detach comes first, to running
  every undo where one throws, and to taking its listener off the page's signal. Browser tests in
  Chromium, WebKit and Firefox attach a status line and a toast with a signal already aborted and
  find nothing said or shown, abort a signal and find the line emptied and silent for the page's
  function, a stepper and progress, find a line those spoke on first let go of by the page's signal,
  find a piece given the line speak again once it is attached again, find a toast taken down with
  focus on its Close send focus back where it came from and a later message unshown, the tabindex it
  added taken away and one the page set since kept, and find a line and a toast kept until every
  signal holding them has aborted. They find the window's size listened to once for two messages
  shown. Unit tests find a line let go of and attached afresh take its old attach down, leaving
  nothing on that attach's signal, and a toast missing a part refused whatever its signal. Browser
  tests in Chromium, WebKit and Firefox take a form's check down with a refusal and a reset still
  due and find its timers and frames as before the attach, nothing said and the form as its markup
  drew it, find the check kept until the last attach in the form is taken down, and find a signal
  already aborted attaching nothing. Another finds a reset clears the errors a part's attach drew
  before the form's own attach came, and calls off a refusal still due, on a clock held still.
  Others let a panel's button go by its signal, close a panel by Escape and by its Close alike once
  its opener is let go, by Escape once its button is drawn again, the only one among them too, and
  hand a panel to a button in a shadow root. They count the listeners on the form, the panels'
  buttons and the document and find them as before after an abort, and the theme switch's listener
  on the document off after each way its choices close. Browser tests in Chromium, WebKit and
  Firefox attach each with a signal already aborted and find nothing attached and a repeat attach's
  options not taken, abort a signal and find each taken down and an open dialog closed with focus
  back on its opener, find a detach, an open, a press, a step of progress and the arrow keys doing
  nothing after the teardown, find a busy wait, a pending focus request, a stepper's error and a
  progress step called off by an abort, find focus back on the opener of a dialog closed and taken
  down in one task, and kept there when the dialog is attached again a microtask after its takedown,
  find a `closedby` the page set left alone and a table outside its frame still refused, find an old
  detach called twice and its signal aborted leave a newer attach alone, and find each piece kept
  until every signal holding it has aborted. They find a focus request that landed holds nothing on
  the page's signal. Browser tests in Chromium, WebKit and Firefox find focus on the next row as a
  row asking for it is removed at once, after an await, from a timer and in a transition, a request
  whose transition was overtaken landing where focus fell, leaving a field the visitor moved to and
  going to its fallback where the transition draws the target, a request whose component an
  `Activity` hides landing unless focus moved, a request made in one commit landing as the next
  takes its component away, a field a view asks for from its own ref focused, a request whose target
  an `Activity` hides with its component held until it shows, a request asked after an await by a
  panel that has gone moving focus to its opener, and focus left on the next screen for a late
  request whatever place it names. Browser tests draw the hooks under `StrictMode` in React's
  development build and find words said in a first effect kept on the provider's line, its function
  speaking after that run and a new provider's after it is drawn afresh while the old one stays
  silent, one arrow key moving one cell, a busy notice, the end of a progress and a refusal each
  said once, nothing said once the pieces leave, a ref called with null taking each piece down, a
  form given back, its `noValidate`, marks and listeners gone, as the ref moves to another form,
  only the second of two requests a part makes as it first draws taking focus, a refusal still
  waiting as its form leaves saying nothing, a refusal asked as its form first draws landing, and,
  with one ref on two forms or two rows of cells, the one left still refusing or taking new options
  whichever is taken away, a failed submit refused through the form submitted, and a form behind a
  ref made afresh on every render keeping its refusal through a failed submit. The focus tests run
  in WebKit and Firefox as well as Chromium. A script loaded before each test page counts the
  listeners on elements, the document, the window and signals, the ResizeObservers and
  MutationObservers watching, and the timers and frames still to come, in Chromium, WebKit and
  Firefox, and in Chromium finds its count of the listeners on the window, the document and its
  elements equal to the engine's own. Each attach and `moveFocus` is attached, used, taken down and
  called after, twice in a row, with every count back where it started each time, and each given a
  signal already aborted starts nothing. A page drawn by React that uses every hook is drawn, used
  and taken away twice, in production and under `StrictMode`, with every count but React's own
  listeners on elements back where it was before. The teardown spec counts only what the leak spec
  does not, through the same script in every engine, which in Chromium is still held to the engine's
  own count. Browser tests attach a stepper past its limit and find the error shown, the field
  described by it and marked invalid, and its status line empty, then find the error cleared by a
  right value, by taking the stepper away and by a form's reset, and find a field attached blank
  with no error. Others find the error back once a reset brings back a value drawn past the limit,
  none on a disabled or read-only field, none for a refusal the page sets, and the page's own error
  alone where it shows one. Browser tests attach a row of tabs in a closed `details`, open it and
  reach the chosen tab by Tab, attach a grid in a hidden panel whose first cell is hidden on its
  own, show the panel and reach the first cell in sight by Tab, and attach a row of tabs in a
  dialog, open it with `showModal()` and reach the chosen tab by Tab, each finding the stop placed
  before Tab is pressed. Another hides a cell that had focus by a class outside its group and finds
  the stop on the next cell, and a React test opens a details around a row given `useRoving` and
  reaches its chosen tab by Tab. Every kit browser test that steps a stand-in clock installs it
  stopped, through one helper, since a clock left running keeps pace with real time between steps as
  well. The helper's unit test finds a signal already aborted gives a teardown already stopped,
  whose `add` runs at once. The helper's unit tests find an abort's takedown waits a microtask, a
  signal held before then keeps the control, a call with no signal holding only where nothing else
  does and joining as the page's own hold in the abort's task, the detach taking it down at once
  with no listener left on any signal, the options of the newest holder that gave any applied as
  holders come and go, a newer holder joined in the same task keeping its own, an older holder's
  options kept through a call from it that gives none, no options applied after the detach, defaults
  applied once the only holder that gave options lets go, a first attach's options that give only a
  signal taken for none, and an attach from inside a takedown getting a control of its own. Browser
  tests in Chromium, WebKit and Firefox abort and attach every piece in one task and find each kept
  with its state, attach after a microtask and find each afresh, join a piece attached with no
  signal in its holder's task and keep its state, hand focus back from a toast taken from the page
  and taken down in that task or a later one, leave focus on a control outside the toast that focus
  moved to, and on the body where a visitor moved it after a toast left the page, land a focus
  request asked as a dialog or a toast with focus in it is taken down, leave focus a page sets as a
  dialog taken from the page is taken down, keep a dialog staying through an attach that gives only
  a signal, keep a toast shown while focus leaves and comes back in one task, open and close a panel
  through `set` in the task its signal aborts, go back to a form's and a stepper's defaults once the
  only holder that gave options lets go, and drop a dialog's `stay` with the holder that gave it,
  put a copy button's word back where a source reading the page's state gives another block or
  throws and read its source on a join only while a word is shown, keep a progress step heard
  through a join with the same count, and join each piece twice with nothing growing and nothing
  left once it is taken down. In Chromium a toast moved in the page with focus in it starts its wait
  again. Under `StrictMode`, a form, a row of cells and a busy button behind refs made afresh keep
  their check, their observer and their wait, a busy wait and a shared row keep through a merged
  ref, a form and a row passed between hooks take the new hook's options, and either of two form
  hooks dropped leaves the other's check and refusal. Browser tests move from a field to a second
  control and into a shown toast, dismiss it by its action and by Escape and find focus on the
  second control, there too where the page stops its focusout, and find focus sent back to where it
  was as the message came where that control is disabled first, where focus last came in from
  nowhere and where it only ever came in from nowhere. Another finds focus sent back to a control
  inside an open shadow root. The toast's own browser tests now run in Firefox as well as Chromium
  and WebKit. Browser tests open a dialog from an opener with focus on it and ask `moveFocus` from
  inside it. They close it and take it down, take it from the page and take it down, close it with
  its close event coming after the request's frame, press an answer whose form closes it, or take
  away the pressed control as it is pressed and close it, and find focus on the element asked for.
  Focus the page sets in the closing task stays. Others open the dialog from an opener that is not
  what had focus, and find a request for what had focus landing there through a late close event,
  and focus going to the opener from a dialog closed and taken down in one task. Another asks as a
  toast with focus in it is taken down for the control the toast hands focus back to and then for
  another place, and finds focus on the later one. These tests of a focus request all run in
  Chromium, WebKit and Firefox. A unit test finds an empty object, keys left undefined and keys only
  inherited taken for no options, and `null` and `false` taken for options given, and a browser test
  finds a dialog attached to stay still staying once attached again with `{}`, and no longer staying
  once attached again with `{ stay: false }` or with options that leave `stay` out. The teardown
  tests are one spec, `e2e/teardown.spec.tsx`, whose rules run over a table of pieces the leak spec
  opens too, with each piece's own cases in a block of its own. The second round of each leak loop
  holds what the attach sets running to the first round's, so a re-attach that attaches nothing
  fails. A progress step and a stepper error taken down before they are said each have a test of
  their own beside a twin left attached. The kit specs step a still clock or wait for frames where
  they waited a fixed time. The engine lists live in `e2e/engines.ts` with a reason beside each
  spec, and a unit test matches them through the pattern the config builds. The browser tests in
  Chromium, WebKit and Firefox run in two shards each, and a gate named Browser tests passes only
  where the Chromium shards and the site's tests over the commit's kit pass. Browser tests in
  Chromium, WebKit and Firefox find focus back on a link inside an inline svg that focus came into a
  toast from once Escape on its Close dismisses it, on one that had focus as the message came where
  focus then came into the toast from nowhere, and on one that opened a dialog once the dialog
  closes. They find focus sent to one that follows a panel whose buttons are gone, one written with
  `xlink:href` among them, and to the place on the page that one pressed inside a panel goes to, a
  panel closing without an error in a window with no class for an SVG link, and a late
  `useFocusAfterDraw` request landing on one. The dialog and panel specs run in Firefox too. Browser
  tests in Chromium, WebKit and Firefox find focus on the page's body as a press on a toast's action
  is handled where nothing it would hand focus to takes it, and focus left where a page's listener
  moves it as focus leaves the action, with the main content able to take focus or not, and a focus
  request asked before the dismiss leaving it there. They find a host that delegates focus taken as
  handed back, so a request asked before the dismiss lands, and the scroll left where it was as
  focus goes back to a control in view, on a page and in an app's frame. They find focus sent on to
  the button inside a frame of the page's own origin that had focus as the message came, there too
  after a click on the frame's empty space, focus left on the frame where that control is marked
  off, gone, or on a page the frame has since loaded, and focus on a frame of another origin after a
  press by pointer. In Firefox, tests find a dismiss by Enter sending focus to the main content
  where that frame cannot take it, and focus left on the frame's other button where a page's
  listener moves it there during the handback. In every engine, a focus request goes on to its
  fallback where its target holds focus but refuses it, and one asked in the task that closes a
  dialog lands where its opener has gone and the browser handed focus elsewhere. Browser tests in
  Chromium, WebKit and Firefox find focus back on the opener once a dialog is taken down and once a
  panel is closed by Escape with focus on a button inside a shadow tree within them, and focus taken
  out of a toast dismissed from one where nothing on its list takes focus. They find a toast with no
  action held past its wait while focus is on such a button, focus sent back to where it was before
  the first message where a second comes while focus is there, focus taken out of a toast drawn
  inside a shadow root dismissed from a button slotted into it from the light DOM, and a panel left
  open by an Escape that clears a search field inside a shadow tree within it, by one in a component
  whose shadow tree shares the panel's id, and by one in a component in the panel that marks its
  host as an open combobox. Browser tests in Chromium, WebKit and Firefox find a button near the
  foot of a tall frame of the page's own origin, with a border and padding, focused where the toast
  draws, ending clear of the toast once a message shows, on a page and in an app's frame. They find
  kept clear a button the frame's padding puts a few pixels under the toast's edge, in a frame drawn
  smaller too, one in a frame drawn wider than laid out, a link on the page the toast covers by less
  than the rise it enters on, and one in a frame scaled by `zoom` in Chromium and Firefox. They find
  the page and the frame left where they are where the button inside a frame is clear of the toast
  though the frame reaches under it, where a short frame above the toast has scrolled its button out
  of sight, where WebKit lays the button of a frame scaled by `zoom` past what the frame shows,
  where a control inside a frame is taller than the room above the toast, and in WebKit where the
  button sits behind the frame's scrollbar, and the page left where it is where a control on the
  page or inside a frame sits beside a toast narrower than the screen.

## 0.9.2

A screen's status line is let go of as `StatusProvider` unmounts, so nothing set for it keeps
running and no piece speaks on it until it is attached again, a detach called again no longer undoes
a newer attach of the same element, a button or a link given the arrival focus ref keeps its place
in the Tab order, and `CopyOptions` is exported. The package README, which npm shows, is a short
front door that sends deeper questions to the site and the reference, whose new "What the package
exports" section names everything each entry holds. No token is added or renamed and the theme
script is unchanged, so `themeScriptHash` is the same, and the sheets and the controls stay within
their budgets.

- **Controls.** A status line let go of, as `StatusProvider` does when it unmounts, has its timers
  cleared, the timers that end each moment words were said in among them, and the words said or held
  for it dropped, and is emptied. The function `attachStatus` returned, a busy button, a form's
  refusal, progress, a copy button and a toast given the line then say nothing there and set no
  timer until the line is attached again, and attaching it again gives a fresh function that takes
  polite words at once. A line attached before it is put on the page still speaks there, as before.
  The state of each status line and the release `StatusProvider` uses live in a module of the kit's
  own, which the package's exports do not name, so a page lets a line go only through
  `StatusProvider`. The detaches of the theme switch, the copy button, the stepper, the table, a
  group the arrow keys move through, a busy button and progress do their work once and nothing when
  called again. Called late, after the page attached the same element again, one of them used to
  take the newer attach's entry and, for the switch, the copy button and the stepper, hide the
  controls it had shown, so the next attach built a second instance with every listener twice. The
  panel's detach already kept to its own attach. `CopyOptions`, what `attachCopyButton` takes, is
  exported from `./controls`, so a TypeScript page can build a copy button's options apart from the
  call, as it can a stepper's or a form's.
- **React.** The ref `useArrivalFocus` returns gives `tabindex="-1"` only to an element that cannot
  take focus by itself, such as a heading or a link with no address, so a button, a link or a field
  given it, as a scores screen's "Change round" button is, stays in the order the Tab key moves in,
  where before it left it for as long as the view was drawn. `StatusProvider` lets its line go once
  its commit is done, unless the same line comes straight back, as React's second run in development
  brings it, which keeps its words, and it calls off the moments it set to say words held before its
  line landed if the line goes for good before they come. A screen taken away a moment after its
  parts spoke leaves no timer of the kit's running.
- **Docs.** The comment on `useArrivalFocus` says which elements take the tabindex. The reference's
  status line section says `StatusProvider` lets its line go as it unmounts and that a piece's own
  timers, such as a busy button's wait, come due saying nothing, and record 15 is amended for it.
  The reference's list of what `./controls` exports names `CopyOptions`. The package README opens
  with what the kit is, a line of contents and why to pick it, lists what is in it in a line for
  each group with the site page that shows it, and keeps the setup, one example, the foundations,
  the theme script's hash under a strict policy and the browser floor. "What it exports" is a table
  of a line for each entry, and the reference's new "What the package exports" section names every
  function, hook, component and type each entry holds. The paragraph on a release's changes, the
  other examples and the sections the reference holds word for word give way to links.
- **Tests.** A browser test gives the arrival focus ref to a button, finds it with no tabindex,
  focuses it as its key changes from another button, and tabs away from it and back, and finds a
  link with no address given the ref a tabindex as a heading is. Browser tests say words at once,
  words that settle and words after the line is let go of, and hear nothing with no timer left to
  run, let a line go while words are on it with polite words waiting and hear nothing more until it
  is attached again, and hear a line attached before it is on the page. Another lets a line go under
  a busy button, finds its wait saying nothing, then attaches the line again and hears the busy
  words. Another says words on a `StatusProvider`'s line and unmounts it before they are put in, and
  finds the line never given them. The browser tests' pages serve the kit's own status line module
  beside the controls. A browser test attaches the theme switch, the copy button, the stepper, the
  table, a group the arrow keys move through, a busy button and progress, detaches each, attaches it
  again and calls the first detach again, and finds the newer attach still in place, its switch and
  copy button shown, its stepper stepping and its busy button marked off as it goes busy. The type
  smoke test, compiled against the packed package, imports `CopyOptions` and types a copy button's
  options with it. A test points every link within the README at one of its own headings, so the
  contents line keeps up with them. The smoke test that every value a module exports is named reads
  it from the module's heading in the reference, the components' module among them, where it read
  the README's row and passed the components over.

## 0.9.1

Focus and a refusal a React page asks for after a save now wait for React to draw the save's change,
so they land on the control or the field rather than the main content, and `activeOf` is exported
and a refusal takes `{ from }` for a page that refuses later than it asked. A refused form says the
name and error of the field it focuses, which VoiceOver on iOS otherwise reads late or not at all,
and a reset that takes away the kit's errors says the form is cleared. A note is drawn at the normal
weight wherever it sits, beside a label's words or in a heading, and a hero, a group of sections and
a split row written on a band, a content page or a stack keep their own spacing. No token is added
or renamed and the theme script is unchanged, so `themeScriptHash` is the same, and the sheets and
the controls stay within their budgets. Upgrading names the one rule a page can now take away.

- **Upgrading.** A `dk-note` is drawn at the normal weight wherever it sits, so a note inside a
  heading, a strong title or a button no longer takes their weight, and a page that set a note
  inside a label back to the normal weight can take its own rule away.
- **Sheets.** `dk-note` shares the field's mark's rule for the muted text at the normal weight, so a
  note inside a field's label reads as a note rather than at the label's medium weight, with no page
  CSS. What a `dk-band-hero`, a `dk-sections` or a `dk-split` holds takes no step from the flow, by
  a rule after the flow's, since each spaces its pieces by its own gaps. A hero written on the same
  element as `dk-band` or `dk-page`, rather than inside one, no longer stands its picture the flow's
  step lower than its words, on a phone a step further from them and on a wider screen off center
  beside them. A group of sections written on a band no longer stands each section after the first a
  section's step lower, and a split row written on a stack keeps its ends on one line.
- **Controls.** `activeOf` is exported, which returns what has focus followed into each shadow root
  that holds it, and the function `attachForm` returns takes `{ from }`, where focus was when the
  refusal was asked for, as `moveFocus` does, for a page that refuses later than it asked. A refusal
  that moves focus to a field, or finds focus already on it, says the field's name and its error,
  such as "Player name: Error: Enter a value.", with how many fields need attention where more are
  wrong. VoiceOver on iOS reads a field's error only as a hint, after a pause, which other speech
  cuts off and which a visitor who turns hints off never hears, and focus moved by script may not
  land, so the error is always said. A screen reader that reads the error as focus lands hears it
  twice. A refusal that moves focus to a summary still says nothing over it. A reset that goes
  through and takes away errors the kit drew says "Form cleared.", since focus stays on the button
  and the errors go out of hearing, and a reset with none of the kit's errors to take away, as after
  a save, says nothing, since errors a page drew are its own to clear.
- **React.** The function `useFocusAfterDraw` returns, and the refusal `useFormRefusal` returns,
  each make their request once the render they were asked in commits, in a layout effect, so it
  lands in the frame that paints the change. A page that sets its state after an await, such as a
  save to the browser's storage, and then asks for focus or a refusal finds the control drawn and
  on, or the field in error, though React draws that state in a task of its own and a frame can come
  before it, and so does a page whose change another component draws. Where focus was is read as the
  request is asked, inside a shadow root too, so a visitor who moves focus before the change is
  drawn is not pulled back. What each request returns calls off that request alone, and the refusal
  a submit that fails the browser's constraints makes waits the same way, in place of a frame. A
  request asked for once the component has unmounted is made at once, as before. Each hook is called
  in a handler or in an effect with dependencies, never as the component renders nor in an effect
  that runs on every render, since asking renders the component again, inside the same
  `startTransition` as a transition's change, and a change drawn in another React root is not waited
  for.
- **Docs.** The comments of both hooks, the reference's "Moving focus after a change" and "A refused
  form", and record 20 say when a request is made, where to call the hooks from, and the transition
  and other-root limits. Record 20 is amended for the request a hook keeps owed until its commit,
  and the README's row for the controls names `activeOf`. "A refused form" also says what a refusal
  and a reset say and why, the comments of `attachForm` and `useFormRefusal` say what a refusal
  says, `attachForm`'s comment also says what a reset says, and record 21 is amended with the device
  check behind it. The reference's split row, note and numeral section says a note is any that is
  not a field's hint or error, such as a word beside a label's, and that it is at the normal weight.
  The reference's band section says a hero can sit on an element inside a band, or on the band or
  the content page itself, and the sheet's comments on the flow and the hero say the same.
- **Tests.** Browser tests run frames before React draws and find focus on a control a save turns on
  after an await, in the hook's component and in a sibling, and on a field whose error is set after
  an await, with the count said. They press a save inside a shadow root and find focus moved, ask
  from a component that has since unmounted and find focus moved, call off the first of two refusals
  and find the second lands, and move focus before the error is drawn and find it left there. The
  test that drops a hook's options waits for them to be passed on before it presses a key, since the
  page's draw comes after the call that drops them returns. Browser tests in a page without React,
  through `useFormRefusal` and inside a shadow root, hear the field's name and error, with the count
  where more are wrong, for a field focus moves to, one already focused, a set the kit draws, a set
  described on its fieldset alone, a field marked in error with no error drawn and a box alone in a
  section, and hear "Form cleared." after a reset that takes away the kit's errors and nothing after
  one with none to take away. Browser tests find a note inside a field's label at the normal weight
  and muted while the label keeps its medium weight, with no audit findings, in both themes. Browser
  tests draw the hero on a band and on a content page and find no step above its picture, the band's
  own padding kept, the picture `--dk-space-6` under the words on a phone and centered beside them
  at 1280px, and nothing pushed sideways or cut off at 320px and twice the text size with no audit
  findings. Others draw a group of sections on a band with its first row lined up, and a split row
  on a stack with no step above its end.

## 0.9.0

The controls take on work each app wrote for itself. The pieces of a screen share one status line
and take turns on it, so words a visitor must hear are not lost. A page can move focus to a control
once a change is drawn, and to a view's heading when a visitor's press brings it. A grid of buttons
and a row of tabs move by the arrow keys with one stop for the Tab key. A form checks the browser's
constraints itself and, where a field fails, refuses the submit, draws the kit's errors and moves
focus to the first. A button can be busy, progress is said at a pace a screen reader can follow, and
a stepper says its range and its limits. Every control here but the stepper has a React hook that
wraps its attach function. The stepper speaks on a React screen's status line through its `say`, and
`StatusProvider` draws that line. The sheets add a compact action beside the dock's main one, a
field's required or optional mark, read-only fields, a busy button's look, a loading line, a
progress bar, an empty state, a hero band, stack steps for a label over its value and a heading over
what it heads, a split row, a note and a large numeral. In every supported browser, an empty live
callout now takes no room. The controls also work inside a shadow root, though a panel and its
button are still found from the page's document. Importing `./controls` now notes keys, clicks and
submits on the document, so the package marks it as having side effects. `--dk-wait` is added and no
token is renamed, and the theme script is unchanged, so `themeScriptHash` is the same. A page that
states a stepper's range, puts `dk-stack` on a list or writes a live callout by hand has a change to
make, under Upgrading. The sheets' budget rises from 11.5 KB to 12.25 KB and the controls' from 7.5
KB to 17.25 KB, set again by record 13's rule.

- **Upgrading.** A page that states a stepper's range in its hint or a description of its own takes
  it out, since the attached stepper says its range in words and would have it read twice. A stepper
  written by hand gains the `dk-stepper-limits` span, out of sight and with an id, for the range
  words to go in, as the reference draws it, and `StepperField` draws it itself. A `ul` or an `ol`
  marked `dk-stack` loses its markers, its indent and the space above and below it, so a page that
  keeps them puts the stack around the list rather than on it, and one that leaves them off adds
  `role="list"`, since VoiceOver in Safari drops the list's role with its markers. A page that
  writes a live callout by hand marks it `data-empty` while it is empty and has no actions, and
  takes the mark away as its words or actions come, so it takes no space while empty. `Callout` does
  this itself.
- **Tokens.** `--dk-wait`, 400ms, in `tokens.css` and, as a duration, in `tokens.resolver.json`, is
  how long a wait goes unremarked before a loading line shows.
- **Sheets.** A `.dk-button[data-busy]` takes the look of an off button, one marked `aria-disabled`,
  only once the wait outlasts `--dk-wait`, by a transition delay that reduced motion and forced
  colors keep, and shows `cursor: progress` at once. `dk-progress` draws the native `progress`
  element as a short track in the line color, filled in the accent. The track's ends are rounded
  like a pill and the fill's leading edge is square in every engine, styled through each engine's
  own parts of the bar. A bar with no value draws as an empty track rather than the browser's
  looping motion. In forced colors the fill takes the highlight on an edged canvas track.
  `.dk-input[readonly]` and `.dk-textarea[readonly]` keep their edge's width, drawn clear on a clear
  ground with the text in the page's color. A read-only field with an error still shows the error's
  edge, and a disabled one is drawn disabled. The edge takes the ground's color in forced colors. A
  `.dk-loading` line inside a region marked `aria-busy="true"` stays out of sight until the wait
  outlasts `--dk-wait`, by a delay that stands under reduced motion and in forced colors, then shows
  in the muted text. `dk-app-dock-inline` lays out a compact action at its own width and the main
  action taking the rest of the row, never under the target or its own longest word, the two
  stretched to one height. Each button keeps the target as its least width with a step less side
  padding, a text button keeps its own look, a link drawn as a button centers its words, and two
  that cannot share a row take two rather than scroll the page sideways, with no page CSS. The tall
  button's comment names the row as the one place that brings its least width down. `.dk-field-mark`
  draws the mark in the muted text at the normal weight. Written beside `dk-stack`, `dk-stack-pair`
  spaces what the stack holds at `--dk-space-2`, for a label over its value or a header's lines, and
  `dk-stack-heading` at `--dk-space-3`, for a heading over what it heads, each by a rule in
  `tokens.css` that sets `--dk-flow-step` on what the stack holds. A named step holds between
  everything the stack holds, under a title and a page section's heading too, a stack inside one
  takes its step unless it names its own, and a hidden piece adds no step. A stack on a `ul` or an
  `ol` drops the markers, the indent and the space above and below the list, and a list nested in it
  keeps its own. `dk-split` sets a title at the start and a figure or a control at the end on one
  line, on their baseline, and the end under the start a small step apart where they do not fit,
  with no room of their own, each piece breaking a word too long for the line, and holds to the
  measure with the prose around it. `dk-note` is the muted text at the small size. `dk-numeral` is
  `--dk-text-numeral` in the mono face with tabular figures, at the strong weight on a line no
  taller than the figure, never broken, and no wider on a phone at a large text size than five
  figures fit. `--dk-sections-least` sets the least width of a section in `dk-sections`, 20rem until
  a page sets it. `dk-band-hero` holds the words' stack and then the picture, one over the other
  `--dk-space-6` apart on a phone, the picture no taller than `--dk-band-hero-picture`, and side by
  side, centered on each other, from 48rem, the picture that wide, 28rem until a page sets it, and
  never past 45% of the row, so the words keep room for a display heading. An `img`, a `video` or a
  `picture` in it fills its cell and keeps its proportions, cropped rather than stretched, and one
  in a `figure` keeps its own shape with its caption under it. `dk-empty` draws a message in the
  muted text at the body size and an action under it, `--dk-space-3` apart and with `--dk-space-3`
  above and below, with no ground and no edge, so it never reads as a callout. It takes a row's
  sides, so its words start where a row's title would, on the column's line in what pads its content
  and inside a bare edge. A callout marked `data-empty` is hidden as visually hidden text is, by a
  rule that needs no `:has()`, which Firefox 120 lacks. The flow's step, the short step under a
  heading and the room kept for a toast pass over it, so a list after one starts where it would with
  none.
- **Controls.** The `Say` function that `attachStatus` returns takes `{ settle }`, a wait in
  milliseconds for words to stop changing before they are said, and `{ polite }`, for words such as
  a progress's steps that must not cut off a page's own result. Words said without `polite` are
  firm, and firm words said on the line drop words still settling. Polite words said while firm
  words are being said wait for them to leave and are said then, the last of them alone, however
  many firm words follow, and polite words not yet on the line when firm words come wait for those
  in turn. Polite words are left unsaid only where firm words are said in the same moment or still
  settle, so a result said with them is heard in their place. Polite words given as a function,
  called a notice here, wait for any words on the line and are read as they are put on it. Waiting
  polite words and a waiting notice are held apart, so neither cuts off the other, and the words are
  said before the notice. A busy button's notice is said that way, so it waits out a failure still
  on the line, is dropped where the work ended or another run began while it waited, and never cuts
  off the end of a progress, which takes its place. A stepper's press words and its range error on a
  page's line leave after a while as any message there does, and typing in its field frees the line
  at once, clearing only the message the stepper gave it. Words still settling count as firm
  whatever leaves the line meanwhile, and the form, the busy button, progress and the stepper say
  their words through one path. `moveFocus(target, { fallbacks })` focuses an element or an id a
  frame after the request. Where the target is gone, hidden, inert, disabled or off, focus goes to
  the first fallback that takes it, then to the app frame's body or the page's main content, by the
  same walk a closing panel hands focus back by. It leaves focus a visitor has moved since the
  request, drops a request a second old, and returns what calls it off.
  `focusOnArrival(heading, { from })` moves focus to a view's heading as it is first drawn, as
  `moveFocus` does, only where the visitor's last input was a press on a button or a link, or a
  submit, in the last five seconds that no view has taken focus for. Nothing takes focus on a page's
  first draw, after a key that moves or types, such as Tab or an arrow along a row of tabs, or after
  a press on nothing, on a control that is off or in a row of tabs. Enter on a page's own control
  that is a button or a link by its role counts as a press, and so does Space, except on a link. A
  script's click counts as a press. A view already drawn that changed on a press asks with
  `changed`, so it takes focus whatever the last input was, lands with views first drawn for that
  press and spends the press. Views first drawn for one press land together and the first in the
  page takes focus, and where none has a heading to take it, the first goes by its fallbacks. As it
  loads in a page, the module notes keys, clicks and submits on the document, where it did nothing
  on import before, so the press that brings a page's first view is heard, and a request called off
  before it lands hands its press back. The package marks `./controls` as having side effects, so a
  bundler keeps a page's import of it for that listener alone.
  `attachRoving(group, { orientation, current, onMove })` gives a group of cells one Tab stop, the
  page's current cell, a tablist's chosen tab or the cell focus last reached, and moves focus by the
  arrows, Home and End: up and down to the nearest cell as drawn in a grid, left and right in
  reading order, a horizontal row ignoring up and down, and an arrow held with a modifier left to
  the browser. A cell marked off keeps its place, focus taken out with a cell goes to the cell in
  its place, a grid of buttons with no role or a `group` role takes the `toolbar` role, and the page
  chooses in `onMove`. `attachForm(form, { status, say, summary })` returns a function that refuses
  a submit once the page has drawn its errors. A frame later, focus moves to the summary, else to
  the first field in error that can take focus, or in a set to its checked radio or first control.
  One message is said: nothing where focus moves to the summary, how many fields need attention
  where focus moves to a field, and the error's own words, with the count where more are wrong,
  where the field already had focus. A set counts once, a refusal with nothing wrong leaves focus
  where it is, and each refusal returns what calls it off. A focus target can be a function, read as
  focus moves. `attachForm` sets `noValidate` on a form it attaches, or on the form around an
  attached part of one, so a page without script keeps the browser's check. On a submit it reads the
  `validity` of each of the form's fields, the whole form even where a part is attached and fields
  tied to it by `form` among them, passing over a field marked off, counting a set once and a group
  of radios with no set once too. Where any fails it stops the submit, draws each error as the kit's
  field draws one, after its hint and marked as its set of choices marks one, and refuses, or hands
  the failures to `invalid`. An error the page already drew for a field takes the kit's words until
  the field passes, and a stepper's range error is left as the one error. Errors the kit drew go
  once their fields pass on a later checked submit, or the form is reset, with what they changed put
  back. A button marked `formnovalidate` submits unchecked and clears the kit's errors, and a reset
  the page calls off keeps them. A form's own attach takes over the check from a part attached
  first. Each failure takes the field's own words, as `data-error-value-missing` on the control or
  its set, else the page's `errorWords`, else the kit's, which say what to do. Fields not in error
  are marked `aria-invalid="false"` as the form is attached. A refusal passes over a control marked
  off, itself or by its set, and where no field in error can take focus it leaves focus where it is
  and names the first field with its error. New types `Failure`, `FailureWords` and `FieldFailure`
  describe the failures. `attachBusy(button, { status, say })` marks a busy button `aria-disabled`
  where the page has not, stops a press by pointer, Enter, Space or a form's Enter before the
  button's own handlers, says the button's `data-busy` words, or "Saving.", once on the status line
  after `--dk-wait`, the wait the sheet holds its look back by, drops words not yet said when the
  work is done, and starts a wait of its own for a busy that starts again at once. A `Say` takes
  words as a function, read as they are put on the line, so words no longer true are not said.
  `attachProgress(bar, { status, say, steps, done })` says the bar's name and the words that
  describe it on a status line, read as each step is crossed, at the steps a page sets, each quarter
  until it sets others, at least three seconds apart, and once at the end, or the `done` words in
  its place, which never waits out the three seconds. The amount a bar first shows is not said, new
  steps are counted afresh, and the end is said once, until the amount goes back for another run.
  Progress is said politely, so a page's own result or failure is never cut off by it. Once
  attached, a stepper describes its field by its range in words, such as "From 0 to 10." or "Only
  3.", after the page's own description and from a `dk-stepper-limits` span it fills, and follows
  the limits as they change, with the error in their place while it shows, whoever showed it. A
  press that lands on a limit, or on the last value a step reaches short of the greatest, says so
  with the value, as "10, the most", and that button goes off. `attachStepper` takes `words`, a
  function of the value read as the message is put on the line, and `status`, a page's own line to
  say each press on in place of the stepper's. Typing over the value, resetting the form or taking
  the stepper away clears only what the stepper said on a status line and leaves a waiting message
  unsaid. `attachStepper` takes `say`, as the form, the busy button and progress do, so a React page
  puts a stepper's words on the screen's line through `useStatus`. `status` and `words` accept
  undefined, as every other attach's options do. A stepper detached and attached again from a page's
  own focusout handler keeps its buttons, since the timers its own focusout and a reset start are
  cleared as it is detached, and do nothing after that. A stepper moved from a page's line to `say`
  takes its words back from the line, and `say` is the one used where both are given. Words said
  through `say` leave in their time, since the stepper cannot take them back from a function, and a
  press's words not yet said are dropped once the value is typed over. `attachStepper` hides a
  stepper's buttons while its field is read only, keeping a focused button, marked off, until focus
  leaves it, follows a field that turns read only or disabled as it changes, and brings the buttons
  back when it can change again. A stepper drawn by hand with no buttons and a read-only value is
  left as it is. `moveFocus` and `focusOnArrival` given an id look for it in the root where focus
  was when they were asked, and fall back to the main content of that root before the page's. The
  form's refusal, its errors and hints, a stepper's range and progress's label look for the ids they
  read in their own element's root, so a widget never reaches an element of the page around it that
  shares an id. What has focus is followed into a shadow root that holds it wherever the controls
  read it, so a dialog, a toast, the theme switch and a group of rows inside one hand focus back and
  on as in a page, and a press inside a shadow root counts toward an arrival. A panel and its button
  are still found from the page's document, which the panel listens on.
- **React.** `StatusProvider` draws a screen's status line and attaches it, and `useStatus()`
  returns the function that says a message on it from any part under the provider, the same across
  renders, holding words said before the line is attached. A provider inside another takes the calls
  under it on a line of its own. `StatusProvider` holds the last firm and the last polite words said
  before its line is attached and says them in order once it is, each after the first in a moment of
  its own, as each was said apart, so polite words wait behind firm words rather than being left
  unsaid. `useFocusAfterDraw()` returns a function that moves focus as `moveFocus` does, the same
  across renders, the last request taking the place of one not yet landed and a request not yet
  landed called off when the component unmounts. `useArrivalFocus(key)` returns a ref for a view's
  heading, which takes focus as its key changes, whatever the visitor's last input was, and as the
  view is first drawn only where a recent press brought it, as `focusOnArrival` decides.
  `useArrivalFocus` decides a first draw through `focusOnArrival`, so it takes no focus after a
  press in a row of tabs, after the visitor only tabbed or typed, or long after a press, and adds no
  listener as it draws again. A key that changes still takes focus, through `changed`, so the view's
  own heading wins over a section first drawn for the same press. It calls its request off as its
  view leaves, and React's second run in development still counts as a first draw. `useRoving()`
  returns a ref that attaches a group, reading the page's `current` and `onMove` as the keys land.
  `useFormRefusal(options)` returns a ref for the form and what refuses it, speaking on the screen's
  `StatusProvider`, calling a refusal off on unmount, and throwing with no provider or `say`.
  `useFormRefusal` requires `invalid`, which sets the page's errors from the failures it is handed,
  while the page's own submit handler clears them. It also takes `errorWords`, read as each failure
  is put in words, and refuses after the render that draws the failures it handed the page. `Button`
  takes `busy`, true or the words to say, which writes `aria-disabled` and `data-busy` and runs no
  `onClick`, and `useBusy()` attaches a busy button, speaking on the screen's `StatusProvider`.
  `Progress` draws the label, the bar and the words under it from `label`, `value`, `max` and
  `words`, and asks for the words whenever it has a value, since the track is too faint to tell how
  much is left by color alone. `useProgress()` attaches the bar to the nearest `StatusProvider`'s
  line, passing new steps or `done` words only when they change. `StepperField` draws the
  `dk-stepper-limits` span. `SelectField` takes `readOnly`, drawing a read-only field with the
  chosen option's words, found inside groups too, and a hidden field for each value, passing its
  `disabled`, `form`, `title` and `autoFocus` on. The field, select, textarea, stepper and set of
  choices take `mark`, `'required'` or `'optional'`, apart from the native `required`, and
  `markWords` for a page's own words. A required field's mark is hidden from a screen reader and the
  control carries `aria-required`, an optional mark stays in the label's name, a set of choices
  keeps its words in its legend's name, and a set of radios carries `aria-required` as well. An
  `aria-required` the page gives a field with no mark is kept. `Callout` marks itself `data-empty`
  while it is live with no title, message or actions, unless the page marks it.
- **Docs.** The reference's Status line section states the policy every speaking piece follows and
  shows the provider and the hook, and record 15 notes the `settle` option. The status line's policy
  says when polite words are left unsaid, wait and go, the busy button and progress sections say the
  same, and record 15 is amended for polite words. The reference has a section on moving focus after
  a change, record 19 notes the walk the panels and `moveFocus` share, record 20 covers hooks over a
  function that acts once, and the README names the hooks. The reference says a first draw takes
  focus for a recent press, as a tab bar's view does, that a row of tabs' panels leave the hook out,
  and names `focusOnArrival` for a page without React. Record 20 says the hook keeps only its key
  and whether it was a first draw, and leaves the decision to `./controls`. The reference's Tabs and
  Button grid sections show the helper in place of leaving the keys to the page, and say how a page
  chooses as focus moves. Record 14 notes the keys the kit now runs. The reference's Fields section
  shows the refused form with the helper. Record 21 says why the kit checks the browser's
  constraints itself, with the research and the options weighed. The reference shows the check, the
  words and how a field, a set or a page replaces them, keys a React page's errors by each failure's
  field, and says a form is attached as it is drawn and why `required` stays. The reference's
  Buttons section shows the busy button, drawn from a new example, and says when a button is
  pressed, off or busy. The reference has a Progress section, drawn from a new example of an import,
  with a React part written from a file in the examples module. The section says how a run that
  fails partway is shown and said. The README names the new exports. Records 2, 5 and 6 are amended
  for a progress bar's track and fill. The reference's Stepper section describes the range words,
  the limit words and both options, and says a page no longer states the range in its hint. The
  reference names `say`, shows it from React, and says a stepper's words on a page's line leave as
  any message there does. The reference's Fields section shows read-only fields, drawn from a new
  example, and says when a field is read only, off, busy or disabled, in place of telling a field a
  visitor cannot change to be disabled. The reference says an id is looked for in the root where
  focus was, and that a panel is found from the document. The reference has a section on a part of
  the page that is loading, drawn from a new example: the page puts the line in with the mark, takes
  both away in one change, puts a danger callout in the line's place where the wait fails, and says
  the wait on the status line where it follows a visitor's own action. The section names
  `--dk-wait`. The reference's App frame section shows the dock row, drawn from a new example, says
  the main action goes last, nearest the thumb, and says how narrow the main action can be at twice
  the text size and when the pair takes two rows. The reference's Fields section shows a required
  and an optional field, drawn from a new example. The reference has a Stacks section, drawn from a
  new example of a label over its value and a round's heading over its scores. It says a stack on a
  list carries `role="list"`, since VoiceOver in Safari drops the role with the markers, an `ol`
  whose numbers matter puts them in its words, a group with a heading needs no named section, scores
  compared across rounds are a table, and the step between a page's sections stays the page's. The
  token table names the two steps. The reference has a section for the split row, the note and the
  numeral, drawn from a new example of a player's score. It says a numeral carries its unit for a
  screen reader, a numeral that changes is said on the status line rather than made live, and a
  number in a row stays a `dk-row-figure`. The properties table names `--dk-sections-least`, and the
  numeral token's comment names the class that sets its face. The reference's band example uses the
  hero in place of the grid it wrote by hand, with its mood picture sized and given an empty `alt`.
  Its band section says how the hero lays out, why the words come first, how a picture that informs
  keeps its subject in frame, that a picture with words in it is not cropped, and that a hero video
  can be stopped. The properties table names `--dk-band-hero-picture`. The reference's Rows section
  has an empty state, drawn from a new example of an empty list of players with a first step, and a
  React part of saved games, written from a file in the examples module, whose search that matches
  nothing draws the empty state and says so, naming the search, on the status line once the visitor
  stops typing, and sends focus back to the search when it is cleared. The action is a plain button,
  since the accent action is the dock's, and is left out where the screen's add control is already
  in view, and the empty state is not live. The reference's live callout steps mark the empty
  callout, take the mark away as words or actions come, and mark it again once emptied. The
  reference's Callouts section shows the danger callout a page mounts empty with `role="alert"`,
  drawn from a new example, and a React part that loads its products and fills the callout when the
  load fails. Try again sits in the actions, so the alert reads the failure and never the button.
  Pressing Try again empties the callout and puts the loading line back, outside the callout, while
  the load runs again, and `useFocusAfterDraw` sends focus to the part's heading. A failure is put
  in a moment after the callout empties, so one that comes back at once is still heard, and it moves
  no focus, since focus moved as an alert is read would cut it short or read it twice. A block of
  TSX in the reference can be written from a file in the examples module, marked by
  `<!-- source: name -->`, so the React part a page copies is the one the type check and the browser
  tests run. Record 20 says each hook attaches a function from `./controls` through a callback ref,
  keeps only its handle, sets its options again only when one changes and returns what the function
  returns, amending records 5, 13 and 14, and the reference's React section names the rule. Record
  13 gives the measures behind the new budget, 12 KB from a prototype of the pieces and then 12.25
  KB once they landed at 12,225 bytes with a median piece of 144 bytes, and the kit beside other
  systems, measured the comparison table's way. The README's tables name the pieces the release adds
  and the types `./react` exports, and the npm description says what the kit is and that it works by
  keyboard, screen reader and forced colors. The header comments of the controls and of `react.tsx`
  name the behaviors and `Progress`. The reference says a failed import's live callout reads the
  failure, so the status line says nothing of it, and shows a loading line's words said as a
  function once the wait has passed. Record 13 sets the controls' budget at 17.25 KB, from 7.5 KB at
  0.8.7, with the measure behind each raise.
- **Tests.** Browser tests find words that settle said once they stop changing, words still settling
  dropped by firm words said after them, the same words twice heard twice, words said before a
  provider's line is attached held and said, the hook's function the same across renders, and a
  nested provider's own line. Unit tests find the provider's line drawn as the status line's markup
  and a part with no provider refused. Browser tests share one line between a busy button, a stepper
  and progress, and hear the end of a run while the busy words are on the line, once a stepper's
  words leave and at once after the field is typed in, a busy notice once a failure leaves and none
  where the work ended while it waited, firm words still settling kept over polite words after
  earlier words leave or come to nothing, the end kept through a second press or firm words said
  again and when said as a press is put in, a busy notice said after a step took its place, the end
  and a notice both waiting, the end left unsaid where a result follows it in the same moment, no
  notice from a run that ended, and a range error cleared by typing. Browser tests find an id drawn
  after the request focused, a target gone, hidden, inert or off passed over for a fallback or the
  main content, focus a visitor moved left alone, a request called off, a control asked for twice
  focused twice, the last of two requests in one frame focused, a removed control's focus moved to
  the next or to a heading, and a heading focused when its key changes or a press draws its view,
  but not as the page first draws or over a field the view focuses. Browser tests arrow along a row
  of tabs after a press that brought no view, choose a tab by a press and by Enter, draw a view late
  after a Tab press, after typing in a field, after a press on an off control and long after a
  press, send a view away in its first frame, bring a view and a section of it with one press,
  change a key by a press that also draws a section of the view, change a key by a script's click,
  and count the document's listeners before and after many draws. Browser tests in Chromium and
  WebKit move about a grid as drawn and in a right to left page, keep a tab row's stop on the chosen
  tab and ignore up and down, let the page choose, reach a cell marked off, hand focus on from a
  cell taken out, let the group go, and keep one stop through the renders a choice brings in React.
  Browser tests refuse with focus elsewhere and hear the count, refuse with focus on the field and
  hear its error, with the count where more are wrong, pass over a disabled field, count a set of
  checkboxes once, leave focus where it is with nothing wrong, focus a radio set's checked radio and
  a named summary with nothing said over it, and refuse a React form through the screen's status
  line. Browser tests in Chromium, WebKit and Firefox refuse a form that fails its constraints
  before the page's handler, draw errors after their hints, name a field no one can reach, let a
  field marked off pass, count a group of radios with no set and a box alone in a section each as
  one field, give the page's own error the kit's words and put it back, give fields with no id
  errors of their own, check the whole form from an attached part, clear errors on a reset, leave a
  stepper's range error alone, take each failure's words in turn, and hand a React page the failures
  of a field and a set. Other browser tests refuse a form written without `noValidate` and sets
  marked off. Browser tests press a busy button again by pointer, Enter, Space and a form's Enter
  and find one save, find the attach's mark and the pointer's wait, the look held and nothing said
  for a fast save, words dropped for work done just after the wait, the look changed and the words
  said once after it with motion reduced or not, words said again for a busy that starts again, the
  look held in forced colors, and in React a double press saving once and a save done just after the
  wait saying nothing late. The scope test lets the components reach a progress bar's track and
  fill, and no other part. Browser tests in Chromium, WebKit and Firefox find the track, the fill
  and the empty track as drawn, the highlight in forced colors, the label, amount and words read,
  each quarter and the end said once, three seconds between steps and none before the end, the end
  of a run that never pauses said, a jump said once, a page's own words said just before kept over
  progress, the done words, a run that starts again said again, the first amount once known left
  unsaid, new steps counted afresh, a bar named by its own label with hundredths for words, one
  taken away saying nothing, the same through `useProgress`, the whole on a 320px phone at twice the
  text size and under wider spacing, and no audit findings in both themes and in forced colors.
  Browser tests find the range in the field's description after a hint and following a new range,
  the limit words on a press and at a step short of the greatest, an error the page shows kept, a
  page's words said after the value on the page's own line, and only the stepper's words cleared
  from it. The site's markup test reads the range words as the markup draws them. Browser tests in
  Chromium, WebKit and Firefox hear a press through a page's own `say`, keep a stepper's buttons
  after a focusout handler or a reset is followed by attaching it again, and take a stepper's words
  back from a line it no longer speaks on. The type smoke test passes a line and words that may be
  undefined. Browser tests find the read-only look against a field that can be changed and one that
  is disabled in both themes, the edge in forced colors, a read-only select's words and the value
  its form sends, a read-only stepper with no buttons, a stepper whose field turns read only keeping
  its focused button, no audit findings, and every field whole at 320px with twice the text size and
  under wider text spacing. Browser tests in Chromium, WebKit and Firefox refuse a form inside a
  shadow root and hear its field's error, move focus by an id there past a host element sharing it,
  name progress by a label there, focus a view's heading named by an id there on an arrival a press
  brought, and fall back to the widget's own main content. Browser tests find the line out of sight
  during the wait and shown after it, with motion reduced or not and in forced colors, in the muted
  text with no audit findings in both themes, and whole under wider text spacing and at 320px with
  twice the text size. Browser tests in Chromium and WebKit find Scores beside a main action on one
  row on a 320px phone, compact first, one height and at least the target, at twice the text size in
  Chromium too, two rows rather than a page scrolled sideways or a word cut for labels too long to
  share one, Scoreboard among them, every word whole under wider spacing, and no audit findings in
  both themes and in forced colors. Unit tests hold the marks' markup, and browser tests find a
  required field named without its words and marked required, an optional field named with them,
  every kind of field marked, sets of choices saying it in their legends with only radios marked, a
  page's own `aria-required` and words kept, the mark muted at the normal weight with no audit
  findings in both themes, drawn apart from the ground in forced colors, and whole at 320px with
  twice the text size and under wider text spacing. Browser tests in Chromium and WebKit find each
  step between the pieces, a plain stack at the step of what holds it, a named step kept under a
  title and a section heading, a step class alone doing nothing, no step for a hidden or visually
  hidden piece, a list with no marker, indent or room and a nested list keeping its markers, the
  example's role written, the example with a long name whole on a 320px phone at twice the text size
  with its wrapped pair at its step and under wider spacing, and no audit findings in both themes
  and in forced colors. Browser tests in Chromium and WebKit find the split row's ends on one line
  and one baseline, held to the measure on a wide page, the end a small step under a start too long
  to share it, a long word at either end broken with no page pushed sideways on a 320px phone at
  twice the text size, the note's color and size, the numeral's size, face, figures, weight, line
  and unit, a score of five figures on one line on a phone at twice the text size, the numeral
  running into nothing around it, both whole under wider spacing, more sections to a row at a
  smaller least width and one on a phone, and no audit findings in both themes and in forced colors.
  Browser tests in Chromium and WebKit find the words beside the picture from 48rem, centered and a
  step apart, the picture at 28rem, at the width a page names and held to 45% of the row, a display
  heading at 48rem broken between words only, the words over the picture on a phone with the picture
  in its own proportions and held to its named height on a wider one, the picture cropped to fill
  beside taller words, a picture in a `picture` or a `figure` fitting its cell, the reference's
  example laid out, nothing pushed sideways on a 320px phone at twice the text size or under wider
  spacing, and no audit findings in both themes and in forced colors. Browser tests in Chromium and
  WebKit find no ground or edge, the words at a row title's start in a page and at a bare edge, no
  live region, the words muted at the body size, a plain button a step under them, the empty state
  whole on a 320px phone at twice the text size and under wider spacing, the status line waiting for
  typing to stop and naming a search that matches nothing, a count for one that matches some, Clear
  by Enter and by a pointer and an emptied field each bringing the list back with focus on the
  search, and no audit findings in both themes, in forced colors and with the empty state drawn. A
  browser test, with every `:has()` rule taken out as a browser without it drops them, finds an
  empty live callout out of sight, a list after it in an app's body where it starts with none, and
  the room for a toast kept under the list. Browser tests in Chromium and WebKit mount the
  reference's own part and find the callout empty and out of sight, the first failure filled with no
  focus moved, no button words in the alert, the same failure heard twice with focus left on the
  heading and the next Tab on Try again, a failure that comes back at once put in after a pause, and
  the list drawn with the callout emptied when the load works. The filled failure stays whole on a
  320px phone at twice the text size in Chromium and under wider spacing, with no audit findings in
  both themes and in forced colors. The lint holds `react.tsx` to importing no effect from React, so
  the markup components stay free of effects and hooks go in their own module. The sheets are held
  to 12.25 KB gzipped together, set by record 13's rule. Browser tests swap each element a hook
  attaches to and find the new one attached, draw again with the same options and find nothing set
  again, drop an option and find it cleared, and take the hooks away with nothing left that throws,
  as record 20 promises. The type smoke test types every hook, `StatusProvider` and the types the
  release exports, and rejects `useFormRefusal` with no `invalid` and a group laid out on a
  diagonal. The controls are held to 17.25 KB. The panel tests' page logs each pointerdown,
  mousedown, pointerup, mouseup, click and focusin it hears, with the element each landed on, and
  any panel test that fails attaches that log, with where the tips' button sits, to its report.

## 0.8.7

The properties the kit works out for itself are named with `--_dk-`, so a page and the site's
tokens page can tell them from tokens, and the site's tokens page reads the tokens as the root sets
them, without the properties a page sets. No token is added or renamed and the theme script is
unchanged, so `themeScriptHash` is the same, and nothing asks anything of a page.

- **Sheets.** The widths a grid of buttons works its columns out with are renamed from
  `--dk-button-grid-*` to `--_dk-button-grid-*`. They came in 0.8.6 as the grid's own working
  values and were never in the reference, so a page has nothing to change, and the columns a grid
  draws are unchanged. `--dk-button-grid-columns` and `--dk-button-grid-least`, which a page sets,
  keep their names.
- **Docs.** The reference says a `--_dk-` property is the kit's own and never for a page, record 16
  names the convention, and record 2 and the package README give the prefix beside `--dk-`. The
  site, which the package does not ship, changed with this version and deploys from main whatever
  version it pins: its explainer gives the prefix too, and its tokens page reads the three sheets of
  the version it pins. That page shows each token's value from the root rule, where a piece's or a
  picture's value for it showed before, such as `0px` for the safe area, and a token only pieces
  set, such as a container's ground, with every value they give it. It leaves out the `--_dk-`
  properties and every property a page sets, such as `--dk-button-grid-least`, which it listed since
  0.6.0 because a tall grid of buttons sets its own default in the tokens sheet.
- **Tests.** A rule for a piece in the tokens sheet declares only a property the reference names or
  one whose name starts with `--_dk-`, and the reference names no `--_dk-` property. The reader of
  the tokens takes a token's value from the root before any piece's and leaves out the kit's
  working values and the properties a page sets, every name the sheets read with a fallback but the
  containers' grounds, on a sheet of the test's own and on the kit's three, and the scope test and
  the reader share the containers' grounds as one list.

## 0.8.6

A row can hold a group of buttons at its end, which moves under its text where the row has no room
for both, and a grid of buttons whose columns asked for do not fit draws the most that fit and
divide its cells evenly, so six cells asked for in six columns draw as two rows of three on a
phone, never five and one. No token is added or renamed and the theme script is unchanged, so
`themeScriptHash` is the same. The grid's rules take the sheets' budget from 10.75 KB to 11.5 KB,
set again by the size audit's rule.

- **Sheets.** `dk-row-actions` groups a row's buttons at its end, in order and a step apart. The
  text keeps room for about twelve characters of its own size beside the group, and where the row
  has less, the group moves under the text to the row's end, so a name reads across at twice the
  text size on a phone. A group wider than the row wraps inside itself, and a row with a picture
  keeps it beside the text. Where the columns a grid of buttons asks for do not fit, a grid of
  four, six, eight, nine, ten or twelve cells draws the most columns that fit and divide its cells,
  two where none larger does, and one where not even two do, and a grid of fewer cells than the
  columns asked for stays in one row wherever they all fit. The grid counts its cells again as a
  page adds or takes one away. A grid of any other count draws as many as fit, as before, and
  where the columns asked for fit, the grid draws them. These rules take the sheets past
  10.75 KB, so their budget rises to 11.5 KB.
- **Docs.** The reference shows a list of seats with icon buttons in a group, the first seat's Move
  up off, says when to use a group and how to name its buttons, and the README lists it. The
  reference also says which counts of cells a grid of buttons evens out and how.
- **Tests.** Browser tests in a padded page keep a row's title on one line with its group under it
  on a 320px and a 390px phone at twice the text size, the group beside twelve characters of text
  at the default size, every button inside the row with the wider text spacing on the narrowest
  phone, a picture beside its title with a group, and the buttons reached in order by name at both
  sizes, with the audit in both themes. Browser tests in Chromium, WebKit and Firefox check the
  columns a grid of buttons of each count draws from 120px to 640px against the rule, in a grid, a
  tall grid and at twice the text size, with each cell at its track's share and none wider than the
  grid, one column where one is asked for, the count taken again as a cell is taken away and added,
  six asked for in six drawn as three on a 320px phone and at twice the text size on a 390px phone,
  and four cells in one row.

## 0.8.5

A panel hands focus back to its button by one rule, decided by where focus is as it closes, in
Safari and on iOS as in Chromium and Firefox, Escape closes a panel, and a toast hands focus back
from a press of its buttons in Safari. No token is added or renamed and the theme script is
unchanged, so `themeScriptHash` is the same.

- **Upgrading.** The kit writes `tabindex="0"` on a panel's button, its corner Close and a toast's
  Close and action, and `tabindex="-1"` on an attached panel, each where the page set none, and on
  the place a link in a panel sends focus to where that place takes no focus of its own. It keeps a
  tabindex the page set. A press on a panel's text now puts focus on the panel, with no ring, so a
  page's own `[tabindex]`, `:focus` and `:focus-within` rules match these, and in Safari these
  buttons become stops for Tab. Escape in a panel or on its button now closes the panel and marks
  the press handled, so a dialog around it stays open on that press, and a piece of the page's own
  in a panel that takes Escape for itself calls `preventDefault` on the press. A panel the page
  closes from its code while nothing has focus, after the visitor's last focus or press was in it,
  now moves focus to its button and scrolls to it, as it did where focus was in the panel. A page
  closes a panel from a press's `click`, since a close from its `pointerdown` comes before the
  browser moves focus for the press.
- **Controls.** However a panel closes, by its button, its Close, Escape, a Done of the page's own
  or `set`, focus goes to its button where focus is in the panel, or where nothing has focus and the
  visitor's last place, the last focus that moved or their last press, was in it, and stays anywhere
  else, so a page that moves focus to what it shows as a panel closes keeps it there, before or
  after the close. A Done that waits on a save, or that the page turns off or draws away, still
  hands focus back. Where focus goes back and the visitor's last press was a link in the panel to a
  place on the same page outside it, one that opens no new tab and downloads nothing, focus goes to
  that place. Safari focuses a pressed button only where it has a tabindex, which is why the kit
  writes them, and a panel the page draws again while it is open takes them as a press in it begins.
  Escape with focus in a panel or on its button closes the innermost such panel and marks the press
  handled, so a dialog around it stays open, unless the page has handled it, it ends typing in a
  script such as Japanese, in Safari too, it is in a dialog or a popover inside the panel, or focus
  is on a search with words in it, on a combobox or a button whose list or menu is open, or on a
  panel's button that is off, where Escape goes on to a panel around the button. Where no button
  takes focus, the first thing after the panel that focus goes to is one the keyboard reaches by
  Tab, so another open panel does not take it. A dialog opened by a press inside an element with a
  tabindex of -1, a panel among them, no longer takes that element for what opened it, so focus goes
  back to the nearest control around the press or to the element whose listener heard it. A toast's
  Close and action carry a tabindex as a panel's do, so a press of either in Safari leaves focus in
  the toast and it goes back as the toast leaves.
- **React.** `Toast` draws its Close and its action with `tabIndex={0}`.
- **Docs.** Record 19 states the panel's rule, the research into React Aria, Radix, Headless UI,
  Ariakit and WebKit behind it, and the options turned down, and record 13 measures the controls
  with it in place, within the 7.5 KB they hold. Record 15 adds the toast's tabindex. The
  reference's corner Close and toast, and the accessibility statement, say what the kit writes and
  why.
- **Tests.** The panel's browser tests run each case of the rule in Chromium and WebKit with real
  presses, Escape as Safari ends typing and on a button that is off among them, and a WebKit test
  holds that a pressed button with no tabindex stays unfocused there, so the tests of Safari's way
  keep testing it. A toast's Close and action pressed by pointer, and its Close tapped in WebKit,
  find focus back where it was, and the tests hold that the kit writes the tabindexes on a panel's
  and a toast's buttons and keeps those a page set. The theme switch, the copy button and the pieces
  are tested in WebKit too, where the switch's choices open by pointer and close on a pick or a tap
  beside them, as in Chromium.

## 0.8.4

A landing page draws its bands, a column of pieces in a grid and a group of sections from the kit,
a panel a button opens is attached by its button so its corner Close needs no script of the page's
own, an icon-only button draws its icon large enough to read and a tab bar's icons are stroked no
heavier than their labels, an app's frame keeps its sides at no more than 16px at any text size,
and a row's detail wraps pretty. `--dk-app-side` and `--dk-icon-size` are added and no token is
renamed, and the theme script is unchanged, so `themeScriptHash` is the same. The controls' budget
rises from 6.25 KB to 7.5 KB, set again by the size audit's rule.

- **Upgrading.** A page that lines its own content up with an app frame's sides, or with a toast's
  words, by `--dk-space-4` moves to `--dk-app-side`, which matches them at any text size. A page
  that set `--dk-space-4` or its root font size above 16px finds a frame's sides, its dock's, a
  toast's and the band insets on an app's page held at 16px. A button whose face is an icon alone
  adds `dk-button-icon`, or takes `icon` on `Button`, to draw its icon at 1.25rem. Without it the
  icon stays at the button's text size, as before.
- **Tokens.** `--dk-app-side` is how far an app frame's words stand in from its sides, the held
  step, and on a page with an app's frame or a tab bar `--dk-band-left` and `--dk-band-right` step
  in by it, so the skip link and a demo's strip start where the frame's words do. `--dk-icon-size`
  is the size of an icon drawn larger than its text, set by the kit on those icons, 1.25rem in an
  icon-only button and 1.5rem in a tab bar.
- **Sheets.** `dk-band` lines a band the width of the screen up with the column, spaces it by the
  flow, with `--dk-band-room` above and below it, `--dk-space-7` until a page sets it, and holds its
  prose to the measure, and a row and a switch in a band reach past its column by their ring.
  `dk-stack` is the flow with no room of its own, for a column in a grid's cell, its prose held to
  the measure too. `dk-sections` sets sections side by side, each with a page section's heading and
  steps, a section's step from what comes before it, or the flow's step under the heading that
  names it. A content page's sections keep their room under its headings. An app's bar, body, toast
  place and dock pad their sides by `--dk-app-side`, 16px at the default text size as before, and a
  toast stands that far from a page's sides and pads its words by it. `dk-button-icon` draws its
  `dk-icon` at 1.25rem, and an icon-only button's icon and a tab bar's `dk-icon` are stroked by one
  rule, two in twenty four of `--dk-icon-size` and never under 1.5px, so a tab's, 3px before at the
  default text size, is now 2px, no heavier than its label. `dk-row-detail` sets
  `text-wrap-style: pretty`, the style alone, so a row a page keeps from wrapping stays on its line,
  and a browser that cannot wrap pretty drops the rule. The corner Close's rules check their
  container before they look ahead for the Close, so a page with a long list restyles in less time
  in Chromium.
- **Controls.** `attachPanel(button)` opens and closes the panel the button names in
  `aria-controls`, every attached button that names it following, closes it by its corner Close with
  focus back on the button that opened it, and returns a `PanelControl`, whose `set`, a `SetPanel`,
  opens or closes it from the page's own code and whose `detach` lets the button go. The first
  button attached for a panel starts it as its `aria-expanded` says, and a button attached for it
  later, one drawn again among them, marks itself as the panel is and leaves the panel alone. A
  press of a button that is off, with `aria-disabled="true"`, does nothing, as a stepper's off
  button does, and focus never goes back to one as the panel closes. Where no button takes focus, it
  goes to what follows the panel, else to the app frame's body or the page's main content. One
  listener on the page serves every panel and comes off once every button is let go. A button with
  no `aria-controls` is refused, and a Close in later content that reuses a panel's id leaves the
  panel alone.
- **React.** `Button` takes `icon`, which adds `dk-button-icon`, with an action or a toggle.
- **Docs.** The reference shows a landing page in bands drawn from its example, lists
  `--dk-band-room` among the properties a page sets and `--dk-app-side` and `--dk-icon-size` among
  the tokens, shows the star toggle with `dk-button-icon` and says when to add it, says the frame's
  sides are held, and draws its tab bar's icons with `dk-icon`, so they take the kit's stroke. Its
  corner Close attaches its panel with `attachPanel`, and says the page's script that hides a panel
  no button opens moves focus to what comes after it, or to the heading before it where nothing
  follows. The README lists the new pieces, `attachPanel`, `PanelControl` and `SetPanel`. Record 13
  sets the controls' budget and records the sheets' weight against the median piece, record 15 is
  amended for `attachPanel` and record 17 for the bands.
- **Tests.** Browser tests cover the bands, the stack and the group of sections on a wide page, a
  phone and a 320px phone at twice the text size, a row and a switch reaching past a band's column,
  the frame's held sides, an icon-only button's icon and its stroke at both text sizes, a row's
  pretty detail, and the panel by button, Close, keyboard and pointer, with focus, detach, a redrawn
  panel, a reused id, an off button and a button attached later, audited open and closed. The specs
  share their measures of a container's foot, the lines of text, a token's length and a page that
  loads the controls, compare with tokens where a relation is meant, double the text size only once
  the page is drawn, and keep one list of the package's exports, which the README is checked
  against. The token tests read their lists by what they hold rather than by order.

## 0.8.3

A picture of an app's frame ends its body at what it holds, and a panel and every tile hold their
inset on a phone at any text size. `--dk-app-body` is added and no token is renamed, and the theme
script is unchanged, so `themeScriptHash` is the same.

- **Upgrading.** A pictured frame that is as tall as what it holds, with a body that holds less than
  8rem, is drawn shorter, ending at its words, so a page that wants it as tall as before sets
  `--dk-app-body: 8rem` through a class of its own on the frame. A pictured frame the page gives a
  height of its own keeps it. On a phone a panel and a tile, in a panel or on the page, are padded
  no more than 16px at any text size, since the card's inset there is now the held step. A page that
  set `--dk-space-4` or its root font size above 16px, or that wants that inset to grow with the
  text as it did, sets `--dk-card-inset` in a query of its own.
- **Tokens.** `--dk-app-body` is the least height of an app's body, 8rem, a few lines it can scroll,
  and none on an element with `dk-picture` and inside it, since a picture cannot scroll.
  `--dk-card-inset` is `--dk-space-4-held` at 48rem wide or less, 1rem and no more than 16px at any
  text size, where it grew with the text, as a dialog's and an app column's insets already hold. On
  a page wider than 48rem it is `--dk-space-5` as before, and at the default text size nothing
  moves. A panel's corner Close, placed from the card's inset, keeps its ring inside the panel where
  the held inset leaves no room above it at a large text size, and sits a little below the title's
  first line.
- **Sheets.** A frame's body keeps `--dk-app-body`, so a pictured frame's body ends at what it
  holds, where it kept 8rem and left an empty band under a few words, and a pictured frame drawn
  taller than what it holds still gives the room to its body, its bars at its foot. The rule that
  held a tile's inset inside a panel on a phone is gone, since the card's inset now holds it for a
  panel and every tile alike.
- **Docs.** The reference's tokens name `--dk-app-body` and say the card inset is held on a phone,
  its app frame says the body keeps `--dk-app-body`, and its panels say a panel and its tiles hold
  their inset on a phone. Its corner Close says it sits a little below the title's first line where
  a held padding leaves no room above it, and now says, as 0.8.2 already does, that `attachDialog`
  moves focus to the first field or answer after it.
- **Tests.** Browser tests find a pictured frame's body ending one padding below its last child at
  390 and 1280 wide, and a pictured frame drawn taller than what it holds keeping its bars at its
  foot. A new test holds what the kit already drew, a dialog that ends in a list or a paragraph
  standing the same room at its foot as at its top, at 390 and 1280 wide. A browser test draws tiles
  in a plain and a raised panel and on the page at 320 wide and twice the text size, finds no word
  drawn across two lines or cut off, and holds a panel, the first tile in each panel and a tile on
  the page to 16px.

## 0.8.2

A tile in a panel keeps every word whole on a phone at twice the text size, a quiet Close has a
place in the top corner of a dialog and a panel, and a picture of a frame or of a page that ends in
a tab bar is as tall as what it holds. No token is renamed and the theme script is unchanged, so
`themeScriptHash` is the same. The sheets' budget rises from 10.25 KB to 10.75 KB, set again by the
size audit's rule.

- **Upgrading.** A frame or a page that ends in a tab bar pictured with `dk-picture` is drawn as
  tall as what it holds, where it was the screen's height, so a page that set only an edge or
  corners on one and wants it taller sets a least height of its own. A page's own rule for a
  picture's height or its tab bar's place still holds, and can go. A page's own rule that reads
  `--dk-safe-top`, `--dk-safe-right`, `--dk-safe-bottom` or `--dk-safe-left` inside a picture now
  reads zero there.
- **Tokens.** `--dk-safe-top`, `--dk-safe-right`, `--dk-safe-bottom` and `--dk-safe-left` are zero
  on an element with `dk-picture` and inside it, since a picture touches no edge of the visitor's
  screen. `--dk-dialog-inset` is new, how far a dialog's content stands in: `--dk-space-5-held`, and
  `--dk-space-4-held` at 48rem wide or less and in a dialog on a page with an app's frame or a tab
  bar's page. A dialog pads by it, as it did by those steps before, and its corner Close is placed
  from it.
- **Sheets.** A tile inside a panel on a screen 48rem wide or less stands its words in
  `--dk-space-4-held`, 1rem and no more than 16px at any text size, so the panel's padding and its
  own leave its words room on a phone at twice the text size, where they broke inside themselves. A
  panel and a tile on the page keep the card's inset, and at the default text size nothing moves.
  `dk-close` right after a dialog's or a panel's title places a quiet Close in the top corner
  without laying out what else the dialog or panel holds, so an eyebrow stays above the title and a
  button keeps its own width. Where the title comes first the Close is centered on its first line,
  wherever the padding leaves it room, and it never comes nearer the edge than its own ring. What
  comes before the Close keeps free the room it takes, so the title wraps beside it, and the title
  is never shorter than keeps the Close's ring clear of what follows. The Close is the target at
  every width and text size, and a dialog's `dk-close` is a `form method="dialog"`, so it closes the
  dialog with no script. A frame or a page that ends in a tab bar that carries `dk-picture` or sits
  inside an element with it is as tall as what it holds, where it was the screen's height, and its
  tab bar sits at its foot in its place rather than held to the visitor's screen or raised over the
  page, so a page draws a picture of a screen with no rule of its own for its size.
- **Controls.** Where a dialog would open with focus on its corner Close, as when React's
  `autoFocus` writes no attribute, `attachDialog` moves focus to the first field or answer after the
  Close that takes focus, a radio group's checked radio where it has one. It passes over one that
  cannot, such as a disabled answer, and a link or button among the dialog's words, so a long dialog
  opens at its top. Where nothing can, the title takes focus, and a title the page gave no place in
  the order gives back the one it borrows as focus leaves it.
- **Docs.** The reference's tokens name `--dk-dialog-inset`, and its panels say a tile in a panel
  holds its inset on a phone. Its dialog shows a Close in the corner of a dialog and a panel: it
  comes after the title, never takes focus as a dialog opens, one Close to a dialog and none in one
  that must be answered, and a panel's names what it closes. Its app frame and tab bar say a
  pictured frame or page is as tall as what it holds, its bar in its place, and the page draws its
  edge, corners and room. Decision record 13 records the sheets' new budget.
- **Tests.** A browser test draws tiles in a plain and a raised panel on a content page at 320 wide
  and twice the text size, finds no word drawn across two lines or cut off, and holds a lone panel
  and a tile on the page to the card's inset. Browser tests set a Close in the corner of a dialog
  and a panel at 320 and 1280 wide, in Chromium and WebKit and again at twice the text size in
  Chromium, and hold it to the target, clear of the title, which wraps, its ring inside the dialog
  and clear of what follows, an eyebrow above the title and a button at its own width, and at the
  default text size centered on the title's first line. They hold a hidden panel hidden, forced
  colors and the audit in both browsers. A dialog on a page with an app keeps a phone's padding at
  1280 wide. Dialogs open with focus on their first answer, a field before the answers, a group's
  checked radio, or the title where the answer is disabled or there is none, with no `autofocus`
  written, a borrowed place in the order given back, and a Close that closes with no script. A
  browser test draws a pictured frame with its dock and tab row and a pictured page that ends in a
  tab bar on a page with safe areas, on a phone and a wide screen, and holds each to what it holds,
  its tab bar to its foot in its place and none of the room a phone keeps at its edges. The specs
  wait for a piece's entrance through one helper they share, so the app frame's tests read a shown
  toast once it has risen into place and a browser's timing no longer fails them.

## 0.8.1

A page that pictures an app's screen with `dk-picture` no longer draws as an app's page, a tile in
columns keeps its title and picture level with a taller tile beside it, and every tab in a row
stands on a line when the row wraps, in forced colors and on paper too. The reference says how a
page fits more of its tiles in columns on one line, and the package README names what 0.8.0 ships
and the class for a picture. No token is renamed and the theme script is unchanged, so
`themeScriptHash` is the same.

- **Upgrading.** A page that shows a picture of an app's frame, of a page that ends in a tab bar or
  of a shown toast gives `dk-picture` to the picture's wrapper or to the piece itself and makes it
  `inert`, since without the class the page around it still draws as an app's. A row of tabs that
  draws its own rule is a pixel shorter for each line it takes, so a page that lines something up
  with its height checks it. A container that holds a row with `dk-tabs-on-rule` beside something
  that can wrap under it, such as a copy button on a phone, takes the class off the row, draws no
  rule of its own and gives the row the room the rest leaves, so the row's own rule runs under the
  tabs.
- **Tokens.** `--dk-band-left` and `--dk-band-right` on the page, and `--dk-card-inset` on a
  dialog, take an app's values only when the page's own frame or tab bar is live, so a page that
  holds only a picture of one keeps the column's bands and a page's card inset in its dialogs.
- **Sheets.** A frame, a page that ends in a tab bar or a shown toast that carries `dk-picture` or
  sits inside an element with the class, such as a picture of a screen on a content page, is not the
  page's own. The page around it keeps the column's bands for its strip, header, content and footer,
  a dialog keeps a page's card inset and targets, pull to refresh stays on, and the page keeps no
  room at its foot for the pictured toast, which sits in its place as a toast in a frame does. A
  page whose own frame is live draws as it did. A tile in columns starts what it holds at its top,
  where a row centers its lines in its height, so a tile stretched to a taller one on its line keeps
  its title and picture level with that one's and the room it gains falls under its text, with a
  picture or without. A resting tab draws the rule along its foot as an edge, as the chosen tab
  draws its accent line, and a row's tabs stand a pixel lower on the row's rule, so a row too wide
  for its place wraps onto more lines with every tab on a line. On one line a resting tab's edge and
  the row's rule are one, the chosen tab's line lies over the rule as it does on a container's rule,
  and a row that draws its own rule is a pixel shorter for each line it takes.
- **Docs.** The reference's app frame says `dk-picture` goes on a picture's wrapper or on the piece
  itself, made `inert` so the keyboard and a screen reader pass it by, and that a pictured toast
  sits in its place, and the toast and the dialog say a frame or a tab bar of the page's own. The
  reference's tiles in columns say where a short tile's title, picture and extra room go beside a
  tall one, that a lone last tile stays at the start of its line and in the list's order and why the
  kit does not stretch, center or move it, and how a page works out a `--dk-tile-least` for its
  count of tiles, the room to leave under it, and what a lower value asks of the tiles' names. The
  reference's tabs say a row that wraps keeps every tab on a line, and that `dk-tabs-on-rule` suits
  a container whose rule sits right under the row, so a bar where something can wrap under the row
  lets the row draw its own rule. The package README's opening and its exports, and the description
  in `package.json`, name the pieces 0.8.0 ships, and the README says which tokens a page sets on
  `:root`, that a strict `style-src` refuses a style attribute, and that a picture of a screen takes
  `dk-picture`.
- **Tests.** A browser test draws a content page plain and with pictures of a frame, a page that
  ends in a tab bar and a shown toast, the class on a wrapper and on each piece itself, and holds
  the strip, the content, the footer, the dialog and its controls, and the page's foot the same,
  with a live toast too, the pictured toast in its place, and a page with its own frame beside the
  pictures still drawn as an app's. A scope test holds every rule that draws a page as an app's to
  leaving out an element with `dk-picture` and one inside it, on every frame it names. A browser
  test draws a short tile beside a tall one, with pictures and without, and holds their titles and
  pictures level. A browser test wraps a row of tabs at twice the text size and finds a line at the
  foot of each tab on every line, against the page's ground, in both themes and forced colors, and
  the tabs' test holds a resting tab to the rule's line. A test holds every tagged link in the
  package README to the package's version.

## 0.8.0

The kit's chrome keeps clear of a phone's edges on a page that reaches under them, a panel gains a
raised form with a soft shadow for the one thing to pick up again above a list, a list of link rows
gains a tile form that can flow into columns, a row can hold a picture at its start, an icon takes
one class, a content page is spaced by one class, and a site draws its header with kit classes. A
tab row can sit on its container's rule, a text button gains a quiet form for a Close, which draws
the toast's close too, a React field can hold a button beside its control, and a page's own status
line can speak. A panel and a tile share one inset, the paddings that stop growing at a size read
one token each, and the tokens also ship in the Design Tokens Community Group's format, for a tool
that reads it. In forced colors what is chosen shows its words again. The reference's examples run
as written and ask a page for nothing a strict policy refuses. The theme script is unchanged, so
`themeScriptHash` is the same. The sheets' budget rises from 9.25 KB to 10.25 KB, set again by the
size audit's rule, and the controls' stays at 6.25 KB.

- **Upgrading.** The strip, the footer, an explainer and its header, and the skip link start their
  content at `--dk-band-left` and `--dk-band-right`, worked out on the root from `--dk-column` and
  `--dk-space-4`, and an app's frame and a page that ends in a tab bar pad their sides by
  `--dk-app-inset`, worked out there from `--dk-app-column`. A dialog's padding and its gap from the
  screen's edges read `--dk-space-4-held` and `--dk-space-5-held`, a stepper's inline padding reads
  `--dk-field-inline-held`, and a panel's padding reads `--dk-card-inset`, each worked out on the
  root too. So a page that sets `--dk-column`, `--dk-app-column`, `--dk-space-4`, `--dk-space-5` or
  `--dk-field-inline` anywhere but `:root` sets it there to keep its column and those paddings in
  step. A page that already uses a name the kit now declares, each listed under Tokens, for
  something of its own gets the kit's meaning for it. In an app's frame, on a page that ends in a
  tab bar and in a dialog on either, a panel keeps a phone's padding at every width and text size,
  where it padded wider above 48rem. The footer pads its foot past what a phone keeps there unless a
  tab bar in sight follows it, and a page's own rule for the footer's padding still wins. A toast's
  close says Close, where it said Dismiss, and is drawn by `dk-button-quiet` alone, so a toast
  written by hand changes the words out of sight in its close button and gives it that class beside
  `dk-toast-close`, as the reference's markup and the React `Toast` do. `dk-explainer-lead` is held
  to the measure wherever it sits, so a lead with it outside an explainer is no wider than
  `--dk-measure`.

- **Tokens.** `--dk-column-inset` is how far the column stands in from each side of a band the width
  of the page, and `--dk-band-left` and `--dk-band-right` are where a band's content starts: the
  column's inset or what a phone keeps at that side, where that is more, then `--dk-space-4`. A
  page's own full-width band pads its sides with them to line up with the strip. Inside an app's
  frame and a page that ends in a tab bar they leave out the phone's sides, which the column clears
  already, and `--dk-app-inset` is how far an app's column stands in from the screen's sides.
  `--dk-space-4-held` is a panel's padding in an app's frame, a dialog's on a phone and in an app,
  and a dialog's gap from the screen's edges, `--dk-space-4` stopping at 16px, `--dk-space-5-held`
  is a wide dialog's padding, `--dk-space-5` stopping at 24px, and `--dk-field-inline-held` is a
  stepper's inline padding held the same way, so each copy reads one value. `--dk-card-inset` is how
  far a panel's and a tile's words stand in. `--dk-ground` and `--dk-ground-step` carry the ground
  of what holds a piece and the ground a piece steps to on it, set by a dialog, a panel and a raised
  panel and worked out on each, so a piece takes the nearest container's however they nest, and a
  palette a page sets on a container reaches it. `--dk-shadow-resting` is the soft lift of a raised
  panel, deeper in the dark theme. `tokens.resolver.json`, exported beside the sheets, holds the
  tokens in the Design Tokens Community Group format's 2025.10 edition as one resolver document: a
  base set with every token the two themes share, and a theme modifier with each color and shadow in
  a light and a dark context, light by default. A length in `em`, a keyword and a value the browser
  works out as it draws, by `min()`, `max()`, `calc()` or `env()`, stay in `tokens.css` alone. A
  token renamed in the file is a breaking change, as a custom property renamed in the sheet is.

- **Sheets.** On a page that says `viewport-fit=cover`, the strip starts its links below what a
  phone held upright keeps at its top, and the strip, the footer, an explainer and its header start
  their content past what a phone on its side keeps at each side. On a page with an app's frame or a
  tab bar, the skip link starts where the app's column starts its content, past what a phone keeps
  at its side, as the strip's links there do. `dk-panel-raised` sets a panel on `--dk-raised`, with
  a pinned column and a code block inside it on grounds of their own, and casts the resting shadow
  where a page sets no shadow of its own by `--dk-panel-shadow`. `dk-rows-tiles` beside `dk-rows`
  draws each link row as a tile, an edge and large corners apart from the next by a gap, on the
  ground a page sets by `--dk-tile-ground` or, where it sets none, the ground its container steps
  to, `--dk-ground-step`: the page's in a plain panel and the card's in a raised panel or on the
  page. A tile casts no shadow unless a page sets one by `--dk-tile-shadow`, so the raised panel
  above a list stays the one thing lifted. A tile keeps the row's sign and its press, draws its
  focus ring outside it, and stops short of the edge by its ring when the keyboard brings it into
  view, so a tile's ground holds its words and sign alone. It is at least the larger target tall,
  sets its title at the lead size, or the body size in an explainer, starts its words on a raised
  panel's line at every width, and an empty list of tiles is not drawn. `dk-rows-columns` beside
  `dk-rows-tiles` flows the tiles into as many columns as fit, each at least `--dk-tile-least` wide,
  15rem unless the page sets it, falling to one column on a phone, the tiles on one line ending
  together, with each title at the body size and a picture across the tile's top. `dk-row-picture`
  as a row's first child sits at its start in a column of its own, `--dk-target` square or the size
  a page sets by `--dk-row-picture-size` up to a quarter of the screen's width, so every title in a
  list starts on one line. `dk-icon` draws an inline svg one em square, stroked in the text's color
  at `max(1.5px, 0.125em)` that does not scale with the drawing, with round caps and joins and no
  fill, a path drawn in fill with no outline, and a tab bar's icons at their own size with the
  stroke that size takes. `dk-page` on a content page's main content spaces what it holds by the
  flow and its sections `--dk-space-7` apart with no rule between them, leaves `--dk-space-6` above
  its title under the header's rule, as an explainer does, sets its `h1` at the display size and a
  section's `h2` at the title size, starts its text at the strip's inset by the band insets, and
  holds its prose to the measure. `dk-lead` is the lead under a name of its own, held to the
  measure, with `dk-explainer-lead` the same rule, and a content page's lead stands the short step
  under its title. `dk-button-quiet` beside `dk-button-text` draws a quiet button for a Close, muted
  with no underline and in the text color under a pointer and while held, as wide as a button is
  tall, open or off alike, and in `ButtonText` in forced colors, underlined under a pointer and
  while held. `dk-site-header` draws a site's header under the strip, at the strip's inset and over
  a rule, with a `dk-site-brand` link holding a `dk-site-mark` and the site's name and its pages as
  pills, the brand and each page the target tall and the pages wrapping under the brand on a phone.
  The brand underlines under a pointer and a press. `dk-tabs-on-rule` beside `dk-tabs` lays a tab
  row on the rule of the container at whose foot it sits, drawing no rule of its own and standing a
  pixel lower, so the chosen tab's line lies over the container's rule, and keeping to the foot of a
  bar that centers what it holds. A resting pill and tab take the text color under a press, and
  underline under a press and a pointer in forced colors. A link in the strip or the footer marked
  current by any value of `aria-current` but false or empty, such as `true` on a page beneath the
  one it names, stands in the text color at the heading's weight, as one marked `page` does, and an
  empty value marks nothing anywhere in the kit. In forced colors what is chosen keeps the
  selection's colors, drawn by one rule after every piece's own: a toggle that is on, a button whose
  panel is open, a pressed cell, the theme switch's chosen word, the current pill, the chosen tab
  and the current place in a tab bar, with an edge and a ring in system colors and no shadow, so a
  browser that paints a backplate behind their words no longer draws the words unseen.

- **Controls.** `attachStatus` makes a page's own status line speak, for a screen that says a change
  without moving focus, and returns the function that says a message on it, so the same words said
  twice are heard twice, and each message leaves two seconds later. It speaks through the same
  function as the copy button and the stepper, so a line handed to a copy button too keeps one timer
  and a later message replaces an earlier one. A line attached again returns the function it
  returned first, as decision 0013 has every attach function do.

- **React.** `InputField` and `SelectField` take an `action`, drawn after the control in a
  `dk-field-action` row, so a page draws a field with a button, such as a search and the button that
  runs it, with its label, hint and error wired as always. A field with no action draws as it did.
  `StatusLine` draws a status line out of sight, in the page from the start, and `CopyStatus` is the
  same component under its first name. `Button` takes `quiet` beside `text`, and with no children
  draws a × hidden from a screen reader beside Close out of sight. TypeScript refuses `quiet` with
  `off`, since a Close always closes.

- **Docs.** The reference lists every property a page sets in a table of its own, each with its
  default and, for a ground, the contrast what sits on it must hold, and `--dk-focus` moves there
  from the token table. It says a tile's ground holds the title and the muted detail at 4.5 to 1,
  and the muted sign at 3 to 1, in both themes, and sets a tile's ground by a class, never a style
  attribute, which a strict `style-src` refuses. Decision 0016 records why a page changes how a
  piece draws only through those properties. The reference shows a site's header and names its nav
  Site, a row with a picture and tiles in columns, an icon's markup, its attributes and its words,
  with a warning against an svg `title`, and a content page and its lead, and names a content page
  among what spaces by the flow. Decision 0017 says why a content page is a container of its own and
  that it leaves `--dk-space-6` above its title. The reference says a link in running text keeps the
  browser's underline, since the accent stands too close to the text to mark it by color alone and a
  footer's link takes the footer's muted color, that a text button puts it back, and that each other
  piece that is a link takes it off in its own class. The status line's example finds its line with
  `querySelector('.screen-status')`, as the other examples do, where the old line, TypeScript in a
  JavaScript example, found nothing and never spoke. Decision 0015 is amended for `attachStatus`.
  The reference says what the tokens file holds and which tokens it leaves to the sheet, the package
  README lists it with the other exports, and decision 0018 says the file is written by hand, held
  to the sheet by a test, and that renaming or dropping a token in it or moving it to a later
  edition is a breaking change.

- **Tests.** Browser tests hold each new piece and each change above as drawn, in both themes, in
  forced colors, on a phone where nothing hovers, at 320 wide, at twice the text size and under the
  wider text spacing, and in Firefox or WebKit too where that engine draws a piece its own way, an
  icon in both and the rows and tiles in WebKit. Each reads what it names as drawn, so it fails when
  that is gone, and CI fails a test that passes only on its retry. A test holds
  `tokens.resolver.json` to `tokens.css`, and the smoke test loads it from the packed package. Scope
  tests hold the table of properties a page sets to what the sheets read and fail when the reference
  or the README asks for a style attribute. The package record gzips the sheets together, in the
  order a page loads them, as the budget's test does, where it summed each sheet gzipped on its own
  and printed more than the budget measured.

## 0.7.0

A toast keeps its action and close button together, and a table's frame shows where it scrolls
further, on a phone above all, where a scroll bar is hidden. The theme script is unchanged, so
`themeScriptHash` is the same. The sheets' budget rises from 9 KB to 9.25 KB, set again by the size
audit's rule, and the controls' stays at 6.25 KB.

- **Upgrading.** A toast's action and close button sit in a `dk-toast-buttons` group, which the
  React `Toast` draws. A page that writes the toast's markup by hand wraps the two buttons, in
  place inside the toast, in a `div class="dk-toast-buttons"` to keep them together at the toast's
  end wherever they wrap. A toast without the group keeps the layout it had, which puts its buttons
  together on the row under the message only on a screen under 20rem wide. A table's frame now
  draws its shade as its background, so a page that sets `background` on `.dk-table-scroll` keeps
  its own and shows no shade, and one that sets an image there also sets `animation: none` on the
  frame, since the shade's animation sizes the frame's images.
- **Sheets.** `.dk-toast-buttons` keeps the action and the close button together, beside the
  message where both fit and on the row under it, at the toast's end, where they do not, whatever
  the toast's width or the action's length, until even the two do not fit beside each other and
  each takes the end of a row of its own. A toast with the group pads its end as its start. A
  table's frame, in an app or on any page, shows a shade at each edge it scrolls toward and none at
  an end in view, grown by an animation tied to the frame's own scroll, on any ground and either
  way a table reads. A browser that cannot tie an animation to a scroll, forced colors and paper
  show none.
- **React.** `Toast` draws its two buttons in the group.
- **Tests.** Browser tests hold a toast's buttons together in a narrow frame and with a long
  action, and read a table frame's shade at each edge as it scrolls. A table's frame is now tested
  in Firefox too.

## 0.6.0

Every piece the kit review found is fixed or finished as a drop-in, so a page places the kit's
pieces and writes no CSS of its own to make them align, fit or work, at every width and text size
and with a screen reader. The theme script is unchanged, so `themeScriptHash` is the same. The
controls' budget rises from 5 KB to 6.25 KB, set from a size audit and measured as a bundler sends
every function, with the theme script held to 1 KB of its own, and the sheets' stays at 9 KB.

- **Upgrading.** A page can no longer show a kit piece it marks `hidden`, or anything marked hidden
  inside one, through CSS of its own, since one rule now hides it with `!important`, so a page that
  drew a hidden kit piece takes the attribute away instead. A shown toast is drawn from its
  `data-shown` attribute, and the `dk-toast-shown` class is still set beside it, so markup that
  marks a toast shown by the class alone sets the attribute instead. A picked cell in a button grid
  is filled in the text color rather than the accent. In an app's frame, on a page that ends in a
  tab bar and in a dialog on either, buttons, fields, choices, the theme switch, pill links and tabs
  are the target tall at every width, not only at 48rem or less, and so are a toast's buttons. An
  explainer, an app's body, a panel and a dialog now set the step above each piece after the first,
  so a page that spaced them with a gap of its own drops it. A page that already used
  `--dk-flow-step`, `--dk-dialog-width`, `--dk-indicator-width`, `--dk-button-grid-least`,
  `.dk-actions`, `.dk-field-action` or `.dk-code-head` gets the kit's meaning for it.
- **Tokens.** `--dk-indicator-width` is the line under a chosen tab and over a tab bar's current
  place, `--dk-dialog-width` the widest a dialog grows, `--dk-button-grid-least` the least width of
  a grid's cell, and `--dk-flow-step` the step between pieces in what holds a column of them, set
  on the pieces an explainer, a panel, an app's body and a dialog hold.
- **Sheets.** `.dk-actions` lays out a row of buttons, `.dk-field-action` a field's control with a
  button beside it, and `.dk-code-head` a code block's title with its copy button. A container's
  step between pieces sits near the end of the components sheet, so no piece's own margin cancels
  it, and an app's body, a dialog and a panel now space what they hold, and a plain form spaces its
  fields. An app's frame keeps the body a few lines tall and lets the page scroll whole where the
  rows around it come to more than the screen, a toast floats over the body's foot and never moves
  the dock, and the room it keeps follows the toast's own height. A stepper's value shows every
  figure under the wider spacing a reader may set and the stepper fits a phone at twice the text
  size, level with its buttons and with a field beside it. A pinned column scrolls with its table
  under 17.5rem wide, and takes a dialog's ground inside one. A table's frame keeps a target's room
  at its end, so a link the keyboard reaches is brought into view. A row's words, the theme switch's
  name and an eyebrow over its heading sit on the column, a dialog pads as a panel does on a phone
  and its stacked actions fill their row, and the toast's close button is muted until pointed at.
  The tab bar's current place stands on the highlight in forced colors, the explainer's link back is
  the target tall, and a tap on a button acts at once.
- **Controls.** `attachTable` brings what the keyboard reaches in a table's frame fully into view,
  clear of a pinned column. Every attach function attaches an element once, options given again
  replace the last and none leaves them, and a part a control cannot work without throws an error
  that names it, as decision record 13 sets out, so a dialog attached to stay keeps staying and a
  copy button attached again copies from its new source. Focus goes back where a page says after
  a dialog and a toast, `chooseTheme` keeps a choice true with no switch on the page, the theme
  switch stays open through a swipe, a stepper keeps its own error through a React page's
  re-render, and a toast is measured as it shows and while it stays.
- **React.** `StepperField`'s own error asks for a whole number between its limits, or names its
  step where that is not 1, so a value between steps is told what is wrong with it.
- **Records, docs and tests.** The package record measures what each piece of the sheets and each
  function of the controls costs a page, and the stepper, controls and pieces specs run in Firefox
  as well. Decision record 13 records the size audit, and records 2, 5 and 6 the selector rule's
  pseudo-elements. The reference's dialog example gives the button its script opens the dialog
  from, and the reference and the 0.5.0 entry name `Button`'s `tall`.

## 0.5.0

The kit carries a phone app: a frame of a bar, a body that scrolls and a dock, clear of a phone's
safe areas, with a tab bar, a toast that can carry Undo, a grid of buttons, a list of ruled rows, a
table that pins its first column, a stepper for a small whole number, and a dialog with a sheet
form. It adds a larger target, a numeral size, a medium duration, the safe areas and the order
things stack in as tokens, a tall button, and a shadow and a press a page can give any button. No
token or class is renamed, and the theme script is unchanged, so `themeScriptHash` is the same. The
sheets' budget rises to 9 KB and the controls' to 5 KB, to hold the app's pieces beside the rest.

- **Upgrading.** Nothing is renamed and no token's value moves, so a page that draws only what 0.4.0
  drew changes nothing to take 0.5.0, but for these. The theme switch's open list now sits at
  `--dk-stack-raised`, which is 2, where it sat at 1, so a page that stacks something of its own
  beside it checks the order. The skip link's top and side now add `--dk-safe-top` and
  `--dk-safe-left`, which are nothing unless the viewport meta says `viewport-fit=cover`, and its
  stacking reads `--dk-stack-skip`, still 10. A button now reads `--dk-button-shadow` at rest and
  `--dk-button-press` while held, and a pressed toggle or a button whose panel is open rests at the
  press, so a page that gave buttons a shadow of its own in a layer below the kit's sets it through
  those two instead. A page that already used a name the kit now takes, a `.dk-app`, `.dk-toast` or
  `.dk-row` class or a `--dk-safe-`, `--dk-stack-` or `--dk-app-` property among them, gets the
  kit's meaning for it.
- **Tokens.** `--dk-target-large`, 3.5rem, is a target pressed at arm's length, and
  `--dk-text-numeral`, 3.5rem, a number read from across a table. `--dk-duration-medium`, 250ms, is
  a surface arriving. `--dk-safe-top`, `--dk-safe-right`, `--dk-safe-bottom` and `--dk-safe-left`
  are what a phone keeps at each edge, nothing unless the viewport meta says `viewport-fit=cover`.
  `--dk-stack-pinned`, `--dk-stack-raised`, `--dk-stack-bar`, `--dk-stack-toast` and
  `--dk-stack-skip` name the order things sit over one another, and `--dk-app-column` and
  `--dk-app-bar` the width of an app's frame and the height of its bar. A page sets
  `--dk-button-shadow` and `--dk-button-press` for a button with an edge under it, and
  `--dk-button-grid-columns`, `--dk-stepper-digits`, `--dk-table-ground` and
  `--dk-table-pinned-size` for the pieces below.
- **Sheets.** `.dk-button-tall` takes the larger target. `.dk-app` is a frame as tall as the screen
  with `.dk-app-bar`, its heading `.dk-app-title`, `.dk-app-body`, `.dk-app-toast`, `.dk-app-dock`
  and `.dk-app-tabs`, only the body scrolling and the page scrolling whole on a screen too short for
  both. `.dk-tabbar` is a phone's places as links at its bottom, and `.dk-tabbar-page` a page that
  ends in one. `.dk-toast` says what just happened over the page or above the frame's dock.
  `.dk-button-grid` lays out toggles or keys in the columns a page asks for and fewer where a cell
  would be under the target. `.dk-rows` is a list of ruled rows, each a link or holding a button.
  `.dk-table-pinned` keeps a table's first column in view as the rest scrolls. `.dk-stepper` is a
  number field between a lower and a raise button, and `.dk-stepper-inline` puts its label on its
  left. `.dk-dialog` and `.dk-dialog-sheet` style the native dialog, centered or at the bottom edge,
  with `.dk-dialog-title` and `.dk-dialog-actions` for its heading and its row of buttons.
  `.dk-button-grid-tall`, `.dk-rows-tall` and `.dk-stepper-tall` take the larger target. The
  reference gives each piece's parts, the toast's `.dk-toast-message`, `.dk-toast-status`,
  `.dk-toast-action` and `.dk-toast-close` and a row's `.dk-row-title`, `.dk-row-detail`,
  `.dk-row-figure` and `.dk-row-sign` among them. On paper a tab bar and a toast do not print, and
  an app's frame, or a page that ends in a tab bar, prints as long as what it holds.
- **Controls.** `attachToast` returns a `ShowToast`, which shows a message with one `ToastAction` or
  none, says it on the toast's status line with the action's name, and returns what dismisses that
  message. A toast with an action stays until it is dismissed or replaced, and one without leaves
  after five seconds unless it is pointed at or has focus. `attachDialog` takes `DialogOptions`,
  `stay` for a dialog that must be answered and `returnTo` for where focus goes once its opener is
  gone, and returns an `OpenDialog`, which takes a `DialogOpener` and opens the dialog as a modal,
  closing it on a tap on the scrim and returning focus to what opened it. `attachStepper` makes a
  stepper's buttons step the value, said on its status line, and shows its error for a value outside
  the limits. Decision record 15 says why the toast's and the dialog's functions return what shows
  or opens them rather than what takes them away. In Chrome before 134 a dialog attached to stay
  closes on a second Escape or Back, and in Firefox 120, without `:has()`, a page that scrolls whole
  keeps no room for a tab bar or a shown toast, as ACCESSIBILITY.md lists.
- **React.** `Button` takes `tall`, which adds `dk-button-tall`. `Toast` draws a toast's markup, and
  `StepperField` a stepper in the kit's field, with `tall`, `inline`, a `subject` that names its
  buttons and a `rangeError` among its props, and the types `ToastProps` and `StepperFieldProps`.

## 0.4.0

The kit adds tabs, a choice field, a textarea field, a large button and a text button, an eyebrow, a
warning tone and two spacing steps, draws selected text on the accent, collapses the theme switch to
one button in a demo's strip on a screen narrower than 20rem, and paints the browser's bar from the
theme script. No token is renamed, though `--dk-field-inline` and `--dk-shadow-raised` changed their
values. The theme script's text changed, so `themeScriptHash` changed too. This changelog no longer
ships in the package: it lives on GitHub, linked from the package README, and each release carries
its entry as the notes.

- **Upgrading.** A page that copies `themeScriptHash` into its policy rather than reading it from
  the package takes the new hash. A page that wants the browser's bar to follow the theme names two
  `theme-color` metas before the script, each with `content` and a `media` of exactly
  `(prefers-color-scheme: light)` or `(prefers-color-scheme: dark)`. `PortfolioStrip`'s types refuse
  `tools` without `toolsLabel`, and a page that passes them without a name draws their section
  unnamed and so no landmark, so such a page names them. A switch, and a strip waiting for its
  switches, now draw a line inside `noscript` unless a page empties `noscript` or `toolsNoscript`,
  so a test that counts their children allows for it. The theme switch's markup changed: the group's
  role, name and note moved from `.dk-theme-switch` onto a `.dk-theme-switch-choices` div around the
  radios, and a `.dk-theme-switch-button` sits between the name and the choices, so a page that
  writes the switch by hand adds both as the reference gives them, while a page that draws it with
  `ThemeSwitch` or finds the group by its role changes nothing, and the new `ref` holds the switch
  itself. In a demo's strip the kit no longer keeps the switch on one row by itself, so a page that
  set a scroll allowance on the strip's section for it can drop that rule. `--dk-field-inline` moved
  from 0.5rem to 0.75rem, the step a button is padded by, so a page that lined something up to a
  field's padding checks it. `--dk-shadow-raised` is deeper on a dark page, in one `light-dark()`,
  so a page that copied its value as one color writes the light value as a fallback and the pair
  where `light-dark()` is supported. Under reduced motion the kit keeps a page's delays and cuts
  only the motion, so a page that staggers entrances by delay zeroes its own delays under the same
  query if it wants them together. A holder a page added to hide a waiting live callout can go, and
  a page with a selection rule of its own can drop it.
- **Theme script.** Where the page names a `theme-color` meta for each scheme before the script, it
  points both at the ground of the theme it draws, on the first paint and on every change of the
  root's theme, so the browser's bar follows the theme too.
- **Controls.** `attachThemeSwitch` wires the switch's new button. In a demo's strip on a screen
  narrower than 20rem, a media query in rem that follows the browser's text size, the sheet shows
  the switch as its name and one button naming the choice, which opens the three radios under itself
  one to a row at a thumb's target, with focus on the chosen one so the arrow keys move the choice
  without closing them. A pick by pointer and Escape close them with focus back on the button, and a
  press elsewhere or focus leaving the switch closes them where they are. At 20rem and wider, and
  outside a strip, the switch is the row it was.
- **React.** `ChoiceField` draws radios or checkboxes in a fieldset with its legend, hint and error
  wired as the other fields are, each control described by the error while one shows, with the type
  `Choice` for each choice. `TextareaField` draws a textarea as tall as its rows, three unless
  given. `Callout` takes `tone="warning"`, read as "Warning: " before its message. `Button` takes
  `large` and `text`, and refuses `text` with `accent`, a toggle or `large`. `ThemeSwitch`,
  `CopyButton` and `CopyStatus` take `ref` and `className`. `ThemeSwitch` draws a line inside
  `noscript` after the switch, and `PortfolioStrip` one in the room `toolsWaiting` keeps, each for a
  visitor without script, worded by `noscript` and `toolsNoscript` or turned off, and a blank
  `toolsLabel` draws no landmark. Every component has a props type named after it, `SkipLinkProps`,
  `PortfolioStripProps`, `DemoFooterProps`, `ThemeSwitchProps`, `CopyButtonProps` and
  `CopyStatusProps` among them.
- **Tokens.** `--dk-warning` and `--dk-warning-bg` are new, for a callout about something that needs
  care. `--dk-space-7` and `--dk-space-8` are new, for the space between a page's own sections, and
  `--dk-tracking-caps` is the tracking of a label in caps. A test holds `--dk-raised`, which is
  unchanged, lighter than the surface in the dark theme and no darker than the page in the light
  one.
- **Sheets.** `.dk-tabs` and `.dk-tab` draw a row of muted words with the chosen one, marked by
  `aria-selected`, `aria-current` or `aria-pressed`, in the page's text over an accent line, the
  page owning the roles and keys. `.dk-choice-field`, `.dk-choices`, `.dk-choices-row`, `.dk-choice`
  and `.dk-choice-hint` draw the choice field, and the theme switch's choice is the same label under
  its own class, drawn as it was. `.dk-textarea` joins the field's rules and resizes in height
  alone. `.dk-button-large` draws a button at the target with wider padding and the body text, and
  `.dk-button-text` draws one as a link, which keeps its link look when its panel is open.
  `.dk-eyebrow` draws a caps label in the muted text at the caption size. `.dk-callout-warning`
  draws the warning tone. The base draws selected text on the accent in the text the accent carries,
  with the pair swapped on the accent button. The skip link takes an edge, so forced colors draw it.
  An empty live callout waits a pixel out of the flow. The focus ring stays on a control a roving
  widget gives a tabindex of -1. On paper a callout and a code block keep an edge, a code block and
  a scrolling table show whole, and the controls that do nothing there do not print. The reference's
  layers section shows what a page with a reset in a layer writes.
- **Package.** `CHANGELOG.md` is no longer in the package, and the record of the package's size that
  the release takes shows each sheet gzipped without its comments, with a test holding the three
  together to a budget.

## 0.3.1

Outside a demo's strip, the theme switch's choices wrap where its column is too narrow for one row,
rather than scroll out of sight. No token is renamed and the theme script is unchanged, so
`themeScriptHash` is the same.

- **Upgrading.** A theme switch outside a demo's strip can now take more than one row, so a page
  that holds it in a box of fixed height, or keeps one row of room for it, checks it at a large text
  size on a phone. A page that sets `flex-wrap` on such a switch itself, so every choice stays in
  sight, can drop that rule. In a demo's strip the kit still keeps the switch on one row, so a rule
  a page sets there still does what it did.
- **Sheets.** The switch keeps one row wherever it fits, and wraps its name and choices onto as many
  rows as they need where it does not, as at a large text size on a phone. Its rows are spaced as
  its choices are, where 0.3.0 set no gap between rows. Only a word wider than the column on its own
  still scrolls. In a demo's strip, which keeps one row of room for switches on their way, the
  switch keeps one row and scrolls as before, so nothing below the strip moves as it comes.

## 0.3.0

The kit ships a theme switch, a copy button, a pill and a focus color of its own, and the theme
script draws the saved theme on a page restored by Back. No token is renamed. The theme script's
text changed, so `themeScriptHash` changed too.

- **Upgrading.** A page that copies `themeScriptHash` into its policy rather than reading it from
  the package takes the new hash. A page that sets `color-scheme` outside a layer, on its root or
  its own elements, sets it back to `light` in print, as the kit now prints light, and a page that
  sets its own colors for each theme rather than in `light-dark()` sets the light ones for print
  too.
- **Theme script.** It sets the theme again when the browser restores a page from its back and
  forward cache, where a page hears no storage event, so a choice made on another page reaches a
  page reached by Back. `THEME_CHOICES` and the type `ThemeChoice` are new in `./theme`, the values
  a theme switch saves.
- **Controls.** `@jasonsdevspace/design-kit/controls` is new, with `attachThemeSwitch`,
  `attachCopyButton` and `chooseTheme`, which make the theme switch and the copy button work on the
  markup a page draws. Nothing runs when it is imported, and it sets no style, so a page's policy
  can refuse every style it did not serve.
- **React.** `ThemeSwitch` and `CopyButton` draw that markup, hidden until a page attaches it, and
  `CopyStatus` draws the status line a copy button speaks on.
- **Tokens.** `--dk-focus` is new and unset, so the focus ring and a button's hover edge stay in the
  accent until a page sets it, and are held to 3 to 1 against what they sit on. Print draws the
  light values whatever the theme, since paper is light and the browser drops backgrounds.
- **Sheets.** `.dk-pill` draws a chip, with a faint edge and no states, and `a.dk-pill` in a
  `.dk-pills` list draws a link among others, the one marked `aria-current` on the highlight at the
  heading's weight. The theme switch's chosen word draws as a pressed button does, on the highlight
  with an edge twice as thick in the accent, and a copy button's words share one cell so it keeps
  its width. A `.dk-theme-switch` or `.dk-copy` with `hidden` stays hidden until a page attaches it,
  so a page that writes either by hand writes it with `hidden`. The reference gives the markup and
  the classes of each.

## 0.2.1

The footer's text is now whole sentences, and names the license for the demo's source alone. No
token is renamed and the theme script is unchanged, so `themeScriptHash` is the same.

- **Upgrading.** A page that writes the footer by hand changes its words to "… is a portfolio
  project by Jason Poteet, who has more work on GitHub. How it works is explained in plain words.
  The source is on GitHub under the MIT license.", with the link to more work now second. A demo's
  own sentences now follow one about the source, so one that says "it" for the demo may need to name
  it.
- **Page chrome.** `DemoFooter` reads as whole sentences, where it read "How it works, in plain
  words." and "The source and more work are on GitHub, under the MIT license.", which put the
  author's other work under the demo's license. Every link keeps its words.

## 0.2.0

The footer takes a line of a demo's own beside its sentence, and the scale names a pill radius. No
token is renamed and the theme script is unchanged, so `themeScriptHash` is the same.

- **Upgrading.** The footer is now a row that wraps. A footer drawn by `DemoFooter`, or written by
  hand as its one sentence, draws as it did. Anything else a page writes after the sentence stacks
  under it with a small gap above, held to the measure. Check a footer written by hand with more
  than its sentence, or one the page styles itself, at a phone's width and a wide one.
- **Page chrome.** `DemoFooter` takes an `aside`, such as the version and commit a page was built
  from, drawn as a second paragraph, `.dk-footer-aside`, at the end of the sentence's row on a wide
  screen and under it on a phone or wherever the row has no room. A page without React writes
  `<p class="dk-footer-aside">` after the sentence's paragraph. A long unbroken name in either
  paragraph still wraps on a phone.
- **Tokens.** `--dk-radius-pill` is new, at 999px, and gives a tab or a tag round ends at any text
  size.

## 0.1.2

The README is cut to what someone on npm needs first, and the full reference moves to
`REFERENCE.md`. Nothing a page installs changed in its code or types, and the styles change in one
comment only.

- **Docs.** The README keeps setup, every export, short React examples, the theme and browser
  support, and links the site page and the section of `REFERENCE.md` behind each part. The reference
  holds the token table, each component's markup and props, and the theme contract in full. The
  README links it at this version's tag, so it matches what a page installs.

## 0.1.1

The README is reorganized for someone installing the package from npm. Nothing in the code, the
styles or the types changed.

- **Docs.** The README opens with a picture of the controls in both themes and a link to the live
  site. Setup shows the browser floor in a Vite config and points a page that uses Lightning CSS to
  the step it adds. The exports, tokens and props are tables, and the theme contract shows how a
  Content Security Policy names the script by `themeScriptHash`.

## 0.1.0

The kit's first stable version, with the code, styles and types of `0.1.0-next.6`, so a page on that
prerelease changes nothing.

- **Tokens.** The scale and the color roles, every name under the `--dk-` prefix, each color holding
  its light and its dark value in one `light-dark()`.
- **Sheets.** `tokens.css`, `base.css` and `components.css`, every rule in the kit's own cascade
  layers, so a page's own styles win over the kit's.
- **Theme script.** `@jasonsdevspace/design-kit/theme` gives the script that sets the theme a
  visitor saved before the page paints, the one every demo on jasonsdevspace.com shares.
- **React.** `@jasonsdevspace/design-kit/react` gives the page chrome, the skip link, the strip and
  the footer, and the buttons, fields and callouts, with React `^19.3.0` as an optional peer.
- **Explainer pages.** The layout, steps, panels, tables and code blocks of the page that says how a
  demo works, written as markup the sheets style.
- **Vite.** `@jasonsdevspace/design-kit/vite` gives `themeScriptPlugin()`, `themeScriptHash`,
  `browserFloor()` and `lightningcssFloor()`, with Vite 8 or later as an optional peer.

## 0.1.0-next.6

The kit's Vite entry hands its browser floor to a page's build.

- **Vite.** `@jasonsdevspace/design-kit/vite` exports `browserFloor()` for `build.target` and
  `lightningcssFloor()` for `css.lightningcss.targets`. Both give the kit's floor of Chrome and Edge
  123, Firefox 120 and Safari 17.5. A page that uses them keeps each `light-dark()` as written and
  follows the kit when it raises the floor, where a floor written out by hand goes stale without any
  error. Each call returns a new value, so a page can change its copy.

## 0.1.0-next.5

The strip's first link is the author's name and leads to the portfolio. A demo can name its
switches' width, so the strip wraps the same before they arrive as after, and on a wide screen the
switches keep to the strip's right edge.

- **Upgrading.** A page that writes the strip by hand changes its first link's words to "Jason
  Poteet" and its address to `PORTFOLIO_URL` itself.
- **Page chrome.** The strip's first link reads "Jason Poteet" and leads to the portfolio's home
  page, `PORTFOLIO_URL`, rather than "More work by Jason Poteet" and the list of work, so it matches
  the footer's "Jason Poteet" link. `PORTFOLIO_WORK_URL` is still exported. On a wide screen the
  switches keep to the strip's right edge, on the links' row or on a row of their own, and where
  they wrap within their section its last row sits at the right too. On a phone they still start at
  the left. A page that writes the strip by hand gets this from the sheet.
- **Tokens.** `--dk-strip-tools` is new and sets the width of a demo's switches in the strip, in the
  strip's text size, such as `:root { --dk-strip-tools: 20em; }`. It defaults to `auto`, so a demo
  that leaves it alone sees no change. A demo whose switches load after the page sets it at least as
  wide as they are, so the strip wraps the same before they arrive as after. On a phone the switches
  keep a full-width row of their own.

## 0.1.0-next.4

Every optional prop takes `undefined`, `Callout` takes a `<div>`'s props and a `ref`, and the
footer's sentence holds to the measure.

- **Upgrading.** A page that writes the strip by hand changes its first link's words to "More work
  by Jason Poteet" itself.
- **Page chrome.** The strip's first link reads "More work by Jason Poteet", where it read "A demo
  by Jason Poteet", which fits a demo and the kit's own site alike and says where the link goes. The
  footer's sentence holds to the measure, while its rule still runs the page's width.
- **Types.** Every optional prop of every component takes `undefined`, as if it were left out, so a
  wrapper that passes on a prop it may not have been given compiles under
  `exactOptionalPropertyTypes`. Only the types widen, so nothing that compiled before breaks.
- **Callouts.** `Callout` takes the props of a `<div>`, among them an `id`, a class after the kit's,
  and a `ref` to the callout drawn, so a page can link to an error summary, focus it after a form
  fails, or lay it out. It still refuses `style`, `role`, `title`, inner HTML and the live
  attributes, and takes its role from `live` alone. Its props are exported as `CalloutProps`. An
  unknown tone or heading level, which plain JavaScript can pass, falls back to the info tone and a
  paragraph. A callout is now padded 0.75rem by 1rem, from 0.5rem by 0.75rem, to match steps and
  code blocks.
- **React.** Every component treats an empty string, or a list or fragment holding only `false`,
  `null` or empty strings, as an empty slot. The strip's switches and the footer's additions now
  pass over an empty string too. A field's hint and error, and a callout's title, message and
  actions, used to draw an empty paragraph for such a list or fragment, and a hint or error was also
  listed in `aria-describedby`.
- **Base.** `base.css` shows a pointer on a disclosure's summary and on a checkbox or a radio with
  the label that holds it, and the arrow on one that is unavailable. The label's pointer reads
  `:has()`, so in Firefox 120 only the box or the dot shows it.
- **Fields.** In forced colors, where an invalid control's red edge is gone, it gains a dashed line
  around its edge in the system's text color, `CanvasText`, which moves nothing as the error comes
  and goes. With focus, the ring takes its place.
- **Explainer pages.** Code in a table cell within its frame stays on one line, so a token's name
  never breaks after `--dk-`, and a long expression scrolls the frame as a wide table does.
- **Docs.** The README shows the strip's switch as a kit button and an unavailable button with the
  text that says why, says why a field uses `disabled` where a button stays in the tab order, and
  says the strip's and the footer's link props take only URLs the demo's author writes.

## 0.1.0-next.3

The page chrome holds still and shows where a reader is, the controls a page moves focus to take a
`ref`, and an empty live callout draws nothing. The strip keeps room for a demo's switches before
they arrive, the footer marks the current page as the strip does, the link to the current page
stands out by more than its color, and the skip link stays hidden wherever it sits.

- **Page chrome.** `PortfolioStrip` takes `toolsWaiting`, which keeps room for one row of the kit's
  controls while a demo's switches are on their way, so nothing below the strip moves when they
  arrive. The section that holds the room is left unnamed, so it is no landmark until the switches
  fill it. A page without React writes `.dk-strip-room` in the unnamed section, and names the
  section when it fills it.
- **Page chrome.** `DemoFooter` takes `current`, as `PortfolioStrip` does, and set to `about` marks
  the link to how it works as the current page, for the footer on a demo's explainer. In the strip
  or the footer, the link marked as the current page stands in the page's text at the heading's
  weight, so a sighted reader sees that "How it works" leads where they already are. It keeps its
  underline, and the weight holds in forced colors, where the color does not.
- **Page chrome.** The skip link waits in its own place as the visually hidden class does, one pixel
  clipped to nothing, rather than 10rem above it, so one inside a positioned box lower on the page
  no longer shows over what is above the box or takes its clicks. It shows where it did when a
  keyboard focuses it.
- **Buttons.** `Button`'s props take a `ref`, which holds the `<button>` drawn, so a page that
  moves focus to a button, such as the one that opened a panel when the panel closes, uses the
  kit's component. React 19 already passed the ref through, and only the type refused it.
- **Fields.** `InputField` and `SelectField` take a `ref` in the same way, which holds the
  `<input>` or the `<select>` drawn, so a page that moves focus to a field, such as a form that
  fails, uses the kit's component rather than finding the control by its id.
- **Callouts.** A live callout whose message holds nothing at all, with no actions, draws nothing,
  no ground, padding or edge, and stays in the page so a screen reader reads what fills it. A page
  no longer needs a holder of its own to hide one it mounts before it has words. The rule uses
  `:has()`, which Firefox has from 121, so in Firefox 120 such a callout still draws its ground.

## 0.1.0-next.2

The page chrome every demo draws, and buttons, text fields, selects and callouts, styled by
`components.css` and drawn by the components in `./react`, with the state of each control carried by
a native or ARIA attribute. The explainer page, with its steps, panels, tables and code blocks, is
styled too, as markup a page writes by hand.

- **Upgrading.** `--dk-measure` changes from 42rem to 34rem, so a page that holds its text to it
  draws narrower lines. A `::before` or `::after` that sets a width or height beside padding or a
  border now draws that size including them, so one sized for the content box draws smaller.
- **React.** `./react` is new, and takes React `^19.3.0` as an optional peer, which a page that
  writes the markup itself never needs.
- **Page chrome.** `SkipLink`, `PortfolioStrip` and `DemoFooter` draw the skip link, the strip above
  the page that says whose demo it is, and the footer below it, and `PORTFOLIO_URL`,
  `PORTFOLIO_WORK_URL` and `GITHUB_PROFILE_URL` are the links they share. The components draw markup
  alone, so a page loads `components.css` itself.
- **Buttons.** `Button` draws `.dk-button`, a plain `type="button"` unless a page gives another
  type, with `.dk-button-accent` for the one action a view leads with. A toggle carries
  `aria-pressed`, and a button whose panel is open `aria-expanded`, drawn alike. `off` marks a
  button `aria-disabled` rather than `disabled`, so it keeps its place in the tab order, and a press
  of it runs no click handler of the page's and submits no form. A button and a field's control
  stand 2.25rem tall, and 2.75rem at 48rem wide or less.
- **Fields.** `InputField` and `SelectField` draw `.dk-field`, its label, a hint and an error when
  given, and the control, `.dk-input` or a native `.dk-select`. The error sits above the control,
  starts with a hidden "Error: " and marks the control `aria-invalid`. A control's text is never
  under 16px.
- **Callouts.** `Callout` draws `.dk-callout` in the info tone on the highlight, or
  `.dk-callout-success` or `.dk-callout-danger`, which start with a hidden word that says the tone.
  It takes a role only when the page passes `live`.
- **Explainer pages.** `.dk-explainer-header` and `.dk-explainer` lay out the page that says how a
  demo works, its text starting where the strip's links start and held to the measure, in plain
  sections that open on a rule, a number and a heading a jump leaves in sight. `.dk-steps` draws
  steps one after another, and `.dk-panel` sets a part of a page apart on the card ground, with no
  tone and no role. A table in `.dk-table-scroll` and a block of `.dk-code` scroll inside
  themselves, each a region named by the title above it that the keyboard reaches at every width, so
  the page never scrolls sideways. `./react` draws none of it.
- **Base.** `base.css` sets `code` at `--dk-text-code`, a step under the text around it, breaks a
  long name where it must, and gives a block's code the block's size. The border box now reaches a
  page's `::before` and `::after`, which it missed before. The cut to motion reaches those too, and
  a dialog's `::backdrop` and each part of a view transition.
- **Sheets.** Every rule for these pieces, the resting look and the explainer's layout included,
  sits in one `:where()`, so a state wins over the resting look by its order in the sheet, and a
  page's own rule outside a layer wins over both.
- **Tokens.** `--dk-measure` is 34rem so a line of body text stays at 80 characters or fewer, as
  WCAG 1.4.8 suggests. `--dk-text-code` is new, at 0.9em, so code sizes to the text around it. The
  dark value of `--dk-control` is `#7d7d7d`, from `#7a7a7a`, so a control's edge inside an info
  callout reaches 3 to 1 in the dark theme.

## 0.1.0-next.1

Nothing in the code, the styles or the types changed. This is the first version the release workflow
stages, through npm's trusted publishing with provenance. `0.1.0-next.0` was published by hand,
since npm adds a trusted publisher only to a package that already exists.

## 0.1.0-next.0

The kit's first prerelease: the tokens, the base and the theme script the demos on
jasonsdevspace.com share.

- **Tokens.** The scale and the color roles, every name under the `--dk-` prefix, each color holding
  its light and its dark value in one `light-dark()`. The default palette passes 4.5 to 1 for each
  text pairing it is measured on, in both themes, and 3 to 1 for a control's edge.
- **Base.** The page's type and colors, one focus ring in the accent for everything the keyboard
  reaches, `.dk-visually-hidden`, and less motion for a visitor who asks for it.
- **Sheets.** Every rule sits in the kit's cascade layers, `dk.tokens` and `dk.base`, declared with
  `dk.components` after them, so a page's own rule outside a layer wins over the kit's.
- **Theme script.** `THEME_KEY`, `THEMES` and `themeScript`, which sets the theme the portfolio
  saved before a page paints, or the system's, and follows a change made in another tab.
- **Vite.** `themeScriptPlugin` writes the script where a page holds `<!-- theme-script -->` and
  fails the build of a page without it or with two, and `themeScriptHash` names the script for a
  Content Security Policy.
- **Node.** The theme module and the plugin run on Node 22.12 or later, the lowest Node 22 release
  Vite 8 supports and the lowest the package is tested on.
