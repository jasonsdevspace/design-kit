# Accessibility

The design kit and its site at [jasonsdevspace.com/design-kit](https://jasonsdevspace.com/design-kit/)
are built to meet the Web Content Accessibility Guidelines, WCAG 2.2, at level AA, in the light
theme and the dark one alike, and are tested to that level. EN 301 549, the European standard the
European Accessibility Act relies on for services such as e-commerce, holds web content to the WCAG
success criteria in its clause 9: V4.1.1, published in September 2026, to WCAG 2.2, and V3.2.1, the
version cited in the EU's Official Journal when this was written, to WCAG 2.1. A page built with the
kit answers for its own conformance. This statement was last checked on November 16, 2026, against
the kit on its main branch.

## How it is checked

Each of these runs in CI on every pull request, and a finding fails the pull request.

- **Automated audits.** axe audits every page of the site in both themes, on a phone and a wide
  screen. In the kit's browser tests it audits the page chrome, every state of the controls, an
  explainer page and a site's header in both themes on a phone and a wide screen, and a list of
  tiles on grounds a page sets, a raised panel, a quiet Close and an icon in both themes.
- **Contrast.** Every pairing of colors the kit is meant for is measured in both themes: text at 4.5
  to 1 against every ground it sits on, and the edge of a control at 3 to 1. The focus ring is drawn
  in the accent, so it meets the ratio a link does. A control keeps it whatever its tabindex, a
  native one or an element with a tabindex and a widget role such as tab, option, menu item, grid
  cell, row, slider or text box, so a tab the arrow keys move focus to is ringed as a link is. A
  field for a date or a time draws it whenever it holds focus, since Safari hands focus to a part
  inside the field and never counts the field itself as focused by the keyboard, so there a press
  draws it too, as it does on any field a visitor types in. A tile's title and detail are measured
  at 4.5 to 1 and its sign at 3 to 1, as drawn, on the grounds a page sets, on the kit's own surface
  and on the grounds a tile steps to in a panel, and its ring, drawn outside it, at 3 to 1 on what
  the list sits on.
- **Links.** A link in running text keeps its underline, in a color that shows, in every place it
  sits from the strip to the footer, a dialog, a table and a toast among them, in both themes and in
  forced colors, since the accent stands too close to the text to mark a link by color alone. In the
  footer a link takes the footer's muted color, so there the underline is the only cue. A piece that
  is a link, such as a button, a pill, a tab, a row, a tab bar's link or a site's brand, draws none.
- **Targets.** The kit's buttons and fields are 36 pixels tall on a wide screen, and 44 on a phone
  and at every width in an app, and tab bar links 56, as are an app's buttons, grid cells, rows and
  steppers where a page asks for the tall size. A stepper's buttons are 44 wide whether it stands 36
  tall or 44, and 56 wide where it is tall. A quiet Close is as wide as it is tall, 36 pixels on a
  wide screen and 44 on a phone, and a site header's brand and each of its pages are 44 tall at
  every width.
- **Reflow and spacing.** No page of the site scrolls sideways at 320, 390, 768 or 1280 pixels wide,
  at the browser's text size or at twice it, and no text is cut off under the wider spacing WCAG
  asks a page to allow. The kit's site header, a content page and its lead, rows with a picture and
  tiles in columns scroll nothing sideways and cut nothing off at 320 pixels wide, at twice the text
  size and under that spacing. A field with a button scrolls nothing sideways at 320, 390 or 1280
  pixels wide at either text size, its button moving under the control where both do not fit.
- **A phone's edges.** On a page that reaches under a phone's notch and rounded corners, the strip
  and an app's bar start what they hold below what the phone keeps at its top, the strip, the
  footer, an explainer and its header and a site's header keep their content clear of what it keeps
  at its sides, and the footer, a tab bar and an app's dock end above what it keeps at its foot. A
  page's own full-width band does the same at its sides when it pads them by `--dk-band-left` and
  `--dk-band-right`.
- **Forced colors.** A pressed or unavailable button, an invalid field, the edge of a callout, a
  panel, a tile or a focused skip link, the chrome's and a site header's link to the current page, a
  tab row's rule, a quiet Close's ring and the site's chosen theme and tab keep what sets them apart
  when the system draws its own colors. A chosen thing stands on the system's selection, a toggle
  that is on, a button whose panel is open, a pressed cell in a grid of buttons, the theme switch's
  chosen word, the current pill, the chosen tab and the current place in a tab bar alike, and a test
  reads from the drawn pixels that its words show over the backplate a browser paints behind them.
  An icon takes the system's text or link color, and a raised panel and a tile cast no shadow.
- **Lighthouse.** Every page of the site scores a hundred for accessibility.

## Checked by hand

The tests here run no screen reader, real phone or Windows contrast theme, so these were checked by
hand on November 16, 2026, on the system and browser versions current that day, and each worked.

- **Screen readers.** The toast, the copy button, the stepper, the status line, the dialog and the
  sheet, the tabs, the field with a button and the tiles were walked with NVDA 2026.3 in Firefox and
  in Chrome on Windows, VoiceOver on macOS, on an iPhone 18 Pro and on a 14-inch iPad Pro, and
  TalkBack on a Pixel 10. The status line spoke the same words twice when they were put in twice, in
  NVDA and in VoiceOver on iOS.
- **Phones.** On the iPhone and the Pixel, each held on its side, a page kept clear of the notch,
  the on-screen keyboard left a field with a button and a sheet usable, and at twice the text size
  nothing was cut off.
- **A Windows contrast theme.** A tile's edge, a quiet Close's focus ring and a tab row's rule each
  showed.

## Where it works

The colors are written with `light-dark()`, which sets the floor: Chrome and Edge 123, Firefox 120
and Safari 17.5. A page built with Vite keeps each color as written when it takes its build target
from the kit's `browserFloor()`, and its Lightning CSS targets from `lightningcssFloor()` where that
is its CSS transformer, as the package README shows.

## Known limitations

- In Firefox 120, which lacks `:has()`, a label that holds a checkbox or a radio shows no pointer,
  though the box or the dot does. In a choice field there, a choice the keyboard lands on lights no
  word, so the ring on the control is the one cue, and a disabled choice keeps its word in the text
  color, with only the control drawn off.
- In Firefox 120, the room a page that ends in a tab bar keeps for it, the room a page keeps for a
  toast shown over it, and the room a table's frame keeps for its pinned column all rest on
  `:has()`, so there the keyboard can bring a control to rest under the bar, the toast or the pinned
  column, and a toast with an action covers the page's last line until it is dismissed. In an app's
  frame there, the body keeps its room for a toast floating over its foot, by the mark the toast's
  attach function writes on the frame, a picture of a frame aside. A toast that would take its row
  above the dock, where the body is too short for it, still floats there with no room kept, so it
  covers the body's last lines until it is dismissed, and the frame keeps clear of the tab bar,
  which has a row of its own. A dialog written before an app's frame, rather than inside or after
  it, is drawn there at a content page's sizes on a wide screen unless it carries `dk-dialog-app`.
  The page behind an open dialog still scrolls there too.
- In Firefox 120, which lacks `:has()`, a list of tiles draws its tiles touching, with no gap, and
  in one column where a page asks for columns, a row with a picture sets the picture in the column
  its words would take, and a footer at the page's end pads its foot by its own step alone rather
  than past what a phone keeps there.
- In Chromium, which draws a picker's icon at the end of a dated field and cuts the field's words
  short at it, a 320 pixel screen at twice the text size leaves a dated field less room than its
  words take. A date as typed fits there in the system typeface, and the empty date pattern, a
  month, a week and a date with a time do not, so a chosen month shows with its year cut short. A
  dated field in a panel on that screen cuts a typed date short as well, and a wider typeface cuts
  more. The words and the icon are the browser's own parts, drawn at the text size the visitor set,
  and no padding the field could give up makes room for a month or a date with a time, so the field
  stays padded as every other field is. A page that must show a whole month on that screen asks for
  it with a select or a text field.
- A read-only text field is one line, which cannot wrap, so at 320 pixels wide with twice the text
  size and the wider spacing even a short phrase can run past its edge and be cut off, by an amount
  that depends on the typeface. A value of words is a `ValueField`, a read-only textarea the kit
  sizes to its value, so it wraps and shows whole. A screen reader may call it a text area or a
  field of many lines where it calls a read-only text field a text field.
- In Firefox before 152 and Safari before 26.2, which cannot size a field to its content, a
  `ValueField` and a read-only select are one field tall, and a long value scrolls inside it, and
  on a desktop browser it can be dragged taller by its handle.
- In Firefox 120, which lacks `:has()`, a callout written before the first field with no form runs
  the column's width.
- In Firefox 120, which lacks `:has()`, a stepper's field with its label above, in a page's own row,
  can still get narrower than its stepper. In a `dk-fields` row there, a stepper wider than the
  row's 10rem runs past its field on a screen 368 pixels wide and up, up to 7 pixels into the gap
  until 381 for a stepper of three figures or a tall one of two, and up to 25 pixels until 417 for a
  tall one of three, over the field beside it until 385, unless the page sets `--dk-fields-least` as
  the reference says, 10.5rem, 12rem or 13.25rem.
- On a page that scrolls whole and is 18rem wide or more, the room kept for a tab bar holds a label
  on two lines. A label that wraps further can leave what the keyboard reaches partly under the bar.
  CSS cannot read its height, so the reference asks for short labels. An app's frame keeps clear of
  its tab bar at any size, since the bar has a row of its own.
- The room kept for a toast is measured as it shows and while it stays, up to five rows, so a toast
  whose message runs past five rows can leave what the keyboard reaches partly under it. The
  reference asks for a short sentence.
- F8 moves focus from anywhere on the page to a shown toast's action and back, but the kit tells a
  visitor of the key only through the action's `aria-keyshortcuts`, which NVDA and JAWS in Chromium
  and Firefox are documented to announce once focus is on the action. Nothing elsewhere on the page
  says the key exists, and a sighted keyboard or magnifier user gets no hint of it from the kit, so
  a page that wants the key known says so itself.
- A focus request that a widget in a closed shadow root asks with its own control as `from` is
  dropped while focus is still on that control, since focus there reads as the widget's host, so
  focus stays where it was and a screen reader user hears nothing of the move. Views one press
  brings, one inside a shadow root and one outside it, take focus in an order each engine chooses,
  so the first in the page may not be the one focused. The reference says how a widget in a closed
  root asks.
- A dialog the page opens inside a frame of its own origin makes only that frame inert, so Tab past
  its last control and a screen reader's reading keys reach the page around it. A page that needs
  the whole view held opens the dialog on the page.
- A press on the page stays standing as focus enters a frame inside a closed shadow root from a
  heard frame, or a frame the page is writing with `open()`, so a view that arrives then can take
  focus from a field the visitor moved to inside that frame. A press inside a frame of another
  origin, or inside a frame in a closed shadow root, brings no focus to the view it opens, so the
  visitor stays where they were. The reference's Focus on arrival gives the frames the kit hears and
  those it cannot.
- Safari keeps no scroll position by what is on screen, so in an app's frame on a screen too short
  for it, a phone on its side at a large text size, showing or hiding a toast moves the dock by the
  toast's height there.
- Without script, Chromium and Safari leave a link or a button in a table's frame where it is when
  the keyboard reaches it partly in view. The frame's room at its end brings in one with no more
  than a target's width showing, and `attachTable` brings in the rest.
- Safari focuses a pressed button only where it has a tabindex, so the kit gives an attached
  panel's button and its corner Close `tabindex="0"` where the page set none, and the panel
  `tabindex="-1"`, so a press anywhere in it leaves focus in it. In Safari's default settings those
  buttons are then stops for Tab where the page's other buttons are not, as with the libraries that
  give their buttons a tabindex. TalkBack and VoiceOver on iOS are walked on a device before a
  release that changes a panel, since a panel that takes focus may be read as one stop.
- Chrome 123 to 133 lets a page refuse a dialog's close only once, so a dialog attached to stay
  closes on a second Escape or Back there. Chrome 134 and later keep it open by its `closedby`
  attribute.
- The browser tests run in Chromium, and the specs listed in
  [`packages/design-kit/e2e/engines.ts`](packages/design-kit/e2e/engines.ts) run in WebKit and the
  current Firefox as well, and the file gives the reason each runs there. What Firefox 120 lacks at
  the floor is known from its documented support rather than from a test here.
- No test runs a screen reader. What one would announce is checked through the names, roles and
  states the browser gives it, and a status line through the words put in it, the same words said
  twice put in twice. The screen readers themselves were walked by hand, as [Checked by
  hand](#checked-by-hand) records.
- The criteria a tool cannot judge, such as whether a heading describes its section or a link's
  words say where it leads, are held by no test here.
- A page that sets its own palette answers for the contrast of its own pairings.

## Reporting a barrier

If something in the kit or its site is hard or impossible to use, open an issue with the
[bug template](https://github.com/jasonsdevspace/design-kit/issues/new?template=3-bug.md). Say what
you were trying to do, on which page or with which component, and the browser and any assistive
technology you use. The acceptance criteria and the size are for whoever fixes it, and can be left
empty. It is handled as a bug. A barrier that is also a security issue goes to the
[security policy](SECURITY.md) instead.
