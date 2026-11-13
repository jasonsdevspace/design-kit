# Changelog

What changed in each version of `@jasonsdevspace/design-kit`, newest first. The kit follows semantic
versioning. Until 1.0.0, a minor version can rename a token or change what the theme script reads,
and a patch changes neither. A change to the theme script changes `themeScriptHash`, so a page reads
the hash from the installed package rather than keeping a copy. An entry that asks something of a
page opens with **Upgrading.** Each version from `0.1.0-next.1` on has a release on GitHub with its
entry as the notes.

## 0.6.0

Every piece the kit review found is fixed or finished as a drop-in, so a page places the kit's
pieces and writes no CSS of its own to make them align, fit or work, at every width and text size
and with a screen reader. The theme script is unchanged, so `themeScriptHash` is the same. The
controls' budget is set from a size audit at 6.25 KB, measured as a bundler sends every function,
with the theme script held to 1 KB of its own, and the sheets' stays at 9 KB.

- **Upgrading.** A page can no longer show a kit piece it marks `hidden` through CSS of its own,
  since one rule now hides it with `!important`, so a page that drew a hidden kit piece takes the
  attribute away instead. A shown toast is drawn from its `data-shown` attribute, and the
  `dk-toast-shown` class is still set beside it, so markup that marks a toast shown by the class
  alone sets the attribute instead. A picked cell in a button grid is filled in the text color
  rather than the accent. Every button, field, select and choice in an app's frame, a page that
  ends in a tab bar and a toast is the target tall at every width, not only at 48rem or less, and
  the theme switch, pills, tabs and a dialog on such a page with them.
- **Tokens.** `--dk-indicator-width` is the line under a chosen tab and over a tab bar's current
  place, `--dk-dialog-width` the widest a dialog grows, `--dk-button-grid-least` the least width of
  a grid's cell, and `--dk-flow-step` the step between pieces in what holds a column of them, set
  on the pieces an explainer, a panel, an app's body and a dialog hold.
- **Sheets.** `.dk-actions` lays out a row of buttons, `.dk-field-action` a field's control with a
  button beside it, and `.dk-code-head` a code block's title with its copy button. A container's
  step between pieces sits near the end of the components sheet, so no piece's own margin cancels
  it, and an app's body, a dialog, a panel and a plain form now space what they hold. An app's
  frame keeps the body a few lines tall and lets the page scroll whole where the rows around it
  come to more than the screen, a toast floats over the body's foot and never moves the dock, and
  the room it keeps follows the toast's own height. A stepper's value shows every figure under the
  wider spacing a reader may set and the stepper fits a phone at twice the text size, level with
  its buttons and with a field beside it. A pinned column scrolls with its table under 17.5rem wide,
  and takes a dialog's ground inside one. A table's frame keeps a target's room at its end, so a
  link the keyboard reaches is brought into view. A row's words, the theme switch's name and an
  eyebrow over its heading sit on the column, a dialog pads as a panel does on a phone and its
  stacked actions fill their row, and the toast's close button is muted until pointed at. The tab
  bar's current place stands on the highlight in forced colors, the explainer's link back is the
  target tall, and a tap on a button acts at once.
- **Controls.** `attachTable` brings what the keyboard reaches in a table's frame fully into view,
  clear of a pinned column. Every attach function attaches an element once, options given again
  replace the last and none leaves them, and a part a control cannot work without throws an error
  that names it, as decision record 13 sets out, so a dialog attached to stay keeps staying and a
  copy button attached again copies from its new source. Focus goes back where a page says after
  a dialog and a toast, `chooseTheme` keeps a choice true with no switch on the page, the theme
  switch stays open through a swipe, a stepper keeps its own error through a React page's
  re-render, and a toast is measured as it shows and while it stays.
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
