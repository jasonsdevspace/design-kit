# Changelog

What changed in each version of `@jasonsdevspace/design-kit`, newest first. The kit follows semantic
versioning. Until 1.0.0, a minor version can rename a token or change what the theme script reads,
and a patch changes neither. A change to the theme script changes `themeScriptHash`, so a page reads
the hash from the installed package rather than keeping a copy. An entry that asks something of a
page opens with **Upgrading.** Each version from `0.1.0-next.1` on has a release on GitHub with its
entry as the notes.

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
