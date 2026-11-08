# Changelog

The kit follows semantic versioning from its first release. Until 1.0.0, a minor version may rename
a token or change what the theme script reads, and a patch changes neither. A change to the theme
script changes `themeScriptHash`, so a page reads the hash from the installed package rather than
keeping a copy. Each version from `0.1.0-next.1` on is staged on npm from a tag by the release
workflow, with provenance, goes live when it is promoted, and has a release on GitHub with the
entry below as its notes.

## 0.1.0-next.5

The strip's first link is the author's name and leads to the portfolio, and a demo can name its
switches' width so the strip never moves when they arrive.

- **Page chrome.** The strip's first link reads "Jason Poteet" and leads to the portfolio's home
  page, `PORTFOLIO_URL`, where it read "More work by Jason Poteet" and led to the portfolio's list
  of work. It matches the footer's own "Jason Poteet", which leads to the same place, and no longer
  shares "more work" with the footer's link to the GitHub profile. A page that writes the strip by
  hand changes the link's words and where it leads itself. `PORTFOLIO_WORK_URL` is still exported,
  for a page that links to the list of work.
- **Page chrome.** A new token, `--dk-strip-tools`, `auto` unless a demo names one, holds the width
  of a demo's switches in the strip, in the strip's own text size. A demo whose switches arrive
  after the page sets it on its root, at least as wide as they are, and on a wide screen the room
  the strip keeps for them and the switches that fill it take that width, so a strip too narrow for
  the links and the switches wraps before they come as it does after. On a phone the switches keep
  a row of their own at its full width.
- **Page chrome.** On a wide screen the switches keep to the strip's right edge, on the links' row
  or on one of their own where they wrap below it, and where they wrap within their section, its
  last row sits at the right too.

## 0.1.0-next.4

The strip's first link says whose work it leads to, and the footer's sentence holds to the measure.
Every optional prop takes `undefined`, the callout takes the props of a `<div>` and is padded as
steps and code blocks are, and every empty slot is read alike. The sheets show a pointer on what
takes a click, mark an invalid field in forced colors and keep a token's name whole in a table.

- **Page chrome.** The strip's first link reads "More work by Jason Poteet", where it read "A demo
  by Jason Poteet", which fits a demo and the kit's own site alike and says where the link goes. A
  page that writes the strip by hand changes the link's words itself. The footer's sentence holds
  to the measure, while its rule still runs the page's width.
- **Types.** Every optional prop of every component takes `undefined`, as if it were left out, so a
  wrapper that passes on a prop it may not have been given compiles under
  `exactOptionalPropertyTypes`. Only the types widen, so nothing that compiled before breaks.
- **Callouts.** `Callout` takes the props of a `<div>` but `style`, `role`, the `title` attribute,
  inner HTML and the live attributes, among them an `id`, a page's class after the kit's, and a
  `ref` that holds the callout drawn, so a page can link to an error summary, focus it after a form
  fails, or lay it out. Its props are exported as `CalloutProps`. Its message takes its role from
  `live` alone. A tone or a heading level the types refuse, as plain JavaScript can pass, draws news
  and a paragraph. A callout is padded 0.75rem by 1rem, from 0.5rem by 0.75rem, as steps and code
  blocks are.
- **Empty slots.** Every slot a component leaves out when it is empty reads an empty string, or a
  list or a fragment that holds only false, null or empty strings, as nothing. The strip's switches
  and the footer's additions now read an empty string so too. A field's hint and error and a
  callout's title, message and actions now read such a list or fragment as nothing, where before
  they drew an empty paragraph, which a hint or an error also listed in `aria-describedby`.
- **Pointers.** `base.css` shows a pointer on a disclosure's summary and on a checkbox or a radio
  with the label that holds it, and the arrow on one that is unavailable. The label's pointer reads
  `:has()`, so in Firefox 120 only the box or the dot shows it.
- **Fields.** In forced colors, where an invalid control's red edge is gone, it gains a dashed line
  around its edge in the system's text color, `CanvasText`, which moves nothing as the error comes
  and goes. With focus, the ring takes its place.
- **Tables.** Code in a table cell within its frame stays on one line, so a token's name never
  breaks after `--dk-`, and a long expression scrolls the frame as a wide table does.
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
`components.css` and drawn by the components in `./react`, with the state of each control carried
by a native or ARIA attribute. The explainer page, with its steps, panels, tables and code blocks,
is styled too, as markup a page writes by hand.

- **React.** `./react` is new, and takes React `^19.3.0` as an optional peer, which a page that
  writes the markup itself never needs.
- **Page chrome.** `SkipLink`, `PortfolioStrip` and `DemoFooter` draw the skip link, the strip
  above the page that says whose demo it is, and the footer below it, and `PORTFOLIO_URL`,
  `PORTFOLIO_WORK_URL` and `GITHUB_PROFILE_URL` are the links they share. The components draw
  markup alone, so a page loads `components.css` itself.
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
  steps one after another. `./react` draws none of it.
- **Panels, tables and code.** `.dk-panel` sets a part of a page apart on the card ground, with no
  tone and no role. A table in `.dk-table-scroll` and a block of `.dk-code` scroll inside
  themselves, each a region named by the title above it that the keyboard reaches at every width,
  so the page never scrolls sideways.
- **Code in running text.** `base.css` sets `code` at `--dk-text-code`, a step under the text
  around it, and breaks a long name where it must. In a block it takes the block's size.
- **Base.** The border box now reaches a page's `::before` and `::after`, which it missed before,
  since a pseudo-element listed inside a `:where()` matches nothing. The cut to motion reaches
  those too, and a dialog's `::backdrop` and each part of a view transition. A `::before` or
  `::after` that sets a width or height beside padding or a border now draws that size including
  them, so one sized for the content box draws smaller.
- **Weight.** Every rule for these pieces, the resting look and the explainer's layout included,
  sits in one `:where()`, so a state wins over the resting look by its order in the sheet, and a
  page's own rule outside a layer wins over both.
- **Tokens.** `--dk-measure` changes from 42rem to 34rem, for every page that reads it. At 42rem a
  line of body text ran past 80 characters, the most WCAG 1.4.8 suggests, and at 34rem the browser
  tests hold a line of the lead and of body text to 80 or fewer. `--dk-text-code` is new, at 0.9em,
  so code sizes to the text around it. The dark value of `--dk-control` is `#7d7d7d`, from
  `#7a7a7a`. A button or field inside an info callout drew its edge at 2.99 to 1 on the highlight in
  the dark theme, under the 3 to 1 a control's edge needs. The accent on the success and danger
  grounds, and a control's edge on the highlight and on each callout's ground, are now measured as
  well.

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
- **Layers.** Every rule sits in the kit's cascade layers, `dk.tokens` and `dk.base`, declared with
  `dk.components` after them, so a page's own rule outside a layer wins over the kit's.
- **The theme script.** `THEME_KEY`, `THEMES` and `themeScript`, which sets the theme the portfolio
  saved before a page paints, or the system's, and follows a change made in another tab.
- **The Vite plugin.** `themeScriptPlugin` writes the script where a page holds
  `<!-- theme-script -->` and fails the build of a page without it or with two, and
  `themeScriptHash` names the script for a Content Security Policy.
- **Node.** The theme module and the plugin load on Node 22.12 or later, the lowest Node the
  package is tested on and the lowest Vite 8 runs on on Node 22.
