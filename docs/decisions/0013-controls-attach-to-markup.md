# 13. The kit's controls ship their behavior as a module a page attaches to their markup

**Status:** accepted

## Context

Until now the kit ran one script in a visitor's browser, the theme script, and its components drew
markup alone, as record 5 has them. The theme switch and the copy buttons lived in the site's own
script, as record 12 has it, and the portfolio drew a theme toggle and a copy button of its own in
React, so the same contract, the theme saved under the portfolio's key, was kept in three places
with nothing holding them together. Both sites, and any demo, need the same two controls. The site
renders statically with no React in the browser, as record 11 has it, while the portfolio hydrates,
and both pages run under a policy that allows no inline style and scripts only from their own
origin or by the theme script's hash.

## Options

**A. A React component with its own state, and a script for pages without React.** Rejected, since
it is two copies of the behavior, each tried by one of the two sites, which is the drift this record
removes.

**B. A script that builds each control with the DOM, as the site's does.** Rejected, since there is
no markup to print in the reference or to draw on the server, and a React page would have to give
it an element React never touches.

**C. Markup from a component, and a function a page attaches to it.** The components draw markup
alone, as every component does, and a new entry, `@jasonsdevspace/design-kit/controls`, exports a
function for each control that finds its parts by their classes and makes it work.

## Decision

Option C. `ThemeSwitch`, `CopyButton` and `CopyStatus` draw the markup, and `attachThemeSwitch` and
`attachCopyButton` make it work, each returning a function that takes it away again, and
`chooseTheme` saves and draws a choice from anywhere on the page. The markup is hidden until it is
attached, so a visitor without script meets no control that does nothing. Nothing runs when the
module is imported, since the package's `sideEffects` lets a bundler drop a module whose only work
is done on import, and nothing reaches for the browser until a control is attached, so it loads in
Node. The functions set no style. The choices a switch saves, `system` and the two themes, are
`THEME_CHOICES` in `./theme`, beside the key the theme script reads, and the theme script itself
does not change, so its hash holds.

## Consequences

- The kit runs a second script in the browser, on a page that attaches a control, and its weight is
  held to a budget.
- What a page shows of the theme is kept in the module, once for the page, so every switch on it,
  and a page's own call to `chooseTheme`, show one choice. A choice the browser will not save is
  held there until the page is left, and drawn again after the theme script draws from storage on a
  change of the system's scheme or a page restored by Back.
- A page attaches a control after it is in the page, in an effect in React, which the markup's
  hidden state makes safe to do late.
- The site and the portfolio take the controls from the kit once a version carries them, and their
  own copies go.

## How it is tested

The paths are in `packages/design-kit`.

- `src/controls.test.ts` imports the module in plain Node, finds only the three functions, and holds
  it with the theme module it imports, without their comments as a bundler sends them, to 3 KB
  gzipped.
- `e2e/attach.spec.tsx` serves the components' markup and the module from an origin of its own under
  a policy that allows scripts only from it or by the theme script's hash and styles only from it.
  It finds both controls hidden with no script, the saved choice shown once attached, a new one
  saved and drawn with nothing refused, a switch attached again saving once, a switch attached
  through the element that holds it, one choice shown on every switch, a switch hidden again once
  taken away, the choice saved meanwhile or held by the page shown and drawn on a switch attached
  after every switch was taken away, one element attached as a switch and then as a copy button, a
  choice from another tab followed, a choice the browser will not save held through a page restored
  by Back, and a copy saying Copied on the button and the status line, or Selected with the text
  selected where the clipboard is refused, and a copy button put back to Copy when it is taken away.
- `e2e/pieces.spec.ts` holds how the switch, the pill and the copy button's words are drawn.
