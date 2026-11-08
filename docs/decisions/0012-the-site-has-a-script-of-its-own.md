# 12. The site has a script of its own, from its own path, beside the kit's theme script

**Status:** accepted

## Context

The only script the kit runs in a visitor's browser is the theme script, which reads the theme a
visitor saved and draws it before the first paint, and its components draw markup alone. Choosing a
theme is left to the page, as the portfolio does with a switch of its own. The site is a page a
visitor may reach directly, with no way back to the portfolio's switch but leaving, so it needs a
switch of its own that saves under the portfolio's key with the portfolio's values, `system`,
`light` and `dark`, and so holds on every page of jasonsdevspace.com. Record 11 keeps React's script
out of the browser, and the policy allows no inline script but the theme script, named by its hash.

## Options

**A. React in the browser.** Hydrate the strip, or the whole page, and draw the switch as a
component. Rejected, since it brings back the runtime record 11 keeps out, for three radios.

**B. A second inline script, named by its hash.** The switch's script inline in each page, as the
theme script is. Rejected, since it would be sent again in every page rather than fetched once and
cached, and the site would have to hash it into each page's policy itself, where the theme script's
hash comes from the kit.

**C. No switch.** Leave the choice to the portfolio. Rejected, since a visitor who reaches the site
from a search or a link could follow the system's theme and nothing else.

**D. A script of the site's own, a file from its own path.** A small module, built by Vite like the
pages, which the policy allows from the folder the build writes it to and nowhere else. It builds
the switch with the DOM, so it needs no inline script or style.

## Decision

Option D. Every page's strip keeps the room for switches on their way, with `toolsWaiting`, and the
script puts the switch in it: three native radios, System, Light and Dark, in a radio group named
Theme by a visible name and described by a note that the choice is saved for every page on
jasonsdevspace.com, so a screen reader hears both as the keyboard reaches the radios. The strip's
section is named Settings, so it becomes the landmark the kit makes of switches that have come and
every part of the page sits in a landmark, and not Theme, so a screen reader moving by landmarks and
then to the radios never hears one name twice. The script shows the saved choice, saves a new one
under the portfolio's key, and draws it at once, since the theme script hears only a choice saved in
another tab. It moves to a choice another tab saves, and catches up with one saved while the page
sat in the browser's back and forward cache. When the system's theme changes it draws the choice
again after the theme script draws, so a browser that refuses the page its storage still draws a
choice until the page is left, where the theme script, which cannot know of it, draws the system's.
A choice the browser refused to save is not read over by what storage holds.

The policy allows scripts from the site's assets folder at the origin GitHub Pages serves it from,
`https://jasonsdevspace.com/design-kit/assets/`, beside the theme script's hash. A policy can name a
path only with its origin, so the build writes it for that origin unless `SITE_ORIGIN` names
another, which the browser tests and the Lighthouse audit set to the local preview they open.

## Consequences

- The origin is jasonsdevspace.com, which the portfolio, every demo and any other repository the
  account serves from GitHub Pages share. Allowing the whole origin, `'self'`, would let a script
  file of theirs run on the site if markup put it there. Naming the site's own folder allows only
  the files the site's build writes.
- The deployed policy is written for one origin. Serving the build from any other, such as a preview
  opened without `SITE_ORIGIN`, refuses the switch's script, and the page draws as it does when its
  own script fails to load. The build refuses a `SITE_ORIGIN` that is not an origin alone.
- A page whose own script fails to load or run still draws the theme the visitor saved, or the
  system's, from the theme script, and shows the empty room the strip keeps rather than a switch
  that does nothing. With scripts off, the page draws the system's theme, as before.
- The room holds the switch's height, and where the strip keeps its links and the switch on one row,
  the room and the switch are one width, wide enough for the switch's words in any font. A strip too
  narrow for both wraps before the switch comes as it does after, so nothing below the strip moves
  when it comes.
- The script's values are the portfolio's, System and the kit's two themes, so `system` is saved as
  the portfolio saves it, and the theme script reads it as nothing saved.
- The kit still runs no script of its own in a browser but the theme script. The switch is the
  site's, and a demo with a switch of its own writes it as the portfolio and the site do.

## How it is tested

The paths are in `packages/site`.

- `src/policy.test.ts` finds the policy for the deployed origin allowing scripts from the site's
  assets folder and the theme script's hash alone, never the whole origin, with styles and images
  from the origin and nothing else by default.
- `e2e/site.spec.ts` finds the switch in every page under its policy, with scripts allowed from the
  site's own path alone, nothing the policy refuses and no style attribute. It finds the choice the
  portfolio saved checked and drawn, the strip's room taken, the group named Theme and described as
  saved for jasonsdevspace.com, and a new choice drawn at once, saved with the portfolio's value,
  and kept after a reload. Under System it finds the page following the system's theme as it
  changes. It finds a choice saved in another tab checked and drawn, and one saved while the page
  was away checked and drawn when the page is shown again as if from the back and forward cache, and
  the arrow keys moving between the choices as radios do. Where the browser refuses storage it finds
  a choice drawn, and still drawn once every listener has heard the system's theme change. It finds
  the site's navigation below the strip in the same place with the script and without it, from a
  small phone to a laptop and at twice the text size.
- `bench/lighthouse.ts` holds every page, with the switch in its strip, to its layout shift gate.
