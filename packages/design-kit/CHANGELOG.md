# Changelog

What changed in each version of `@jasonsdevspace/design-kit`, newest first. The kit follows semantic
versioning. Until 1.0.0, a minor version can rename a token or change what the theme script reads,
and a patch changes neither. A change to the theme script changes `themeScriptHash`, so a page reads
the hash from the installed package rather than keeping a copy. An entry that asks something of a
page opens with **Upgrading.** Each version from `0.1.0-next.1` on has a release on GitHub with its
entry as the notes.

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
