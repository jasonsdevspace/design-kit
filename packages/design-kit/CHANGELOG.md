# Changelog

The kit follows semantic versioning from its first release. Until 1.0.0, a minor version may rename
a token or change what the theme script reads, and a patch changes neither. A change to the theme
script changes `themeScriptHash`, so a page reads the hash from the installed package rather than
keeping a copy. Each version from `0.1.0-next.1` on is staged on npm from a tag by the release
workflow, with provenance, goes live when it is promoted, and has a release on GitHub with the
entry below as its notes.

## Unreleased

The page chrome every demo draws, and buttons, text fields, selects and callouts, styled by
`components.css` and drawn by the components in `./react`, with the state of each control carried
by a native or ARIA attribute. The explainer page, with its steps, panels, tables and code blocks,
is styled too, as markup a page writes by hand.

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
  `.dk-callout-success` or `.dk-callout-danger`, with a hidden word that says the tone. It takes a
  role only when the page passes `live`.
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
- **Base.** The border box and the cut to motion now reach a page's `::before` and `::after`, which
  they missed before, since a pseudo-element listed inside a `:where()` matches nothing.
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
