# 12. The site has a script of its own, a file from its origin, while the kit ships none

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
theme script is. Rejected, since it would be sent again with every page rather than cached once,
and every change to it would change its hash in the policy of every page, where a file changes only
its own name.

**C. No switch.** Leave the choice to the portfolio. Rejected, since a visitor who reaches the site
from a search or a link could follow the system's theme and nothing else.

**D. A script of the site's own, a file from its origin.** A small module, built by Vite like the
pages and loaded from the site's own origin, which the policy allows as `'self'`. It builds the
switch with the DOM, so it needs no inline script or style.

## Decision

Option D. Every page's strip keeps the room the kit keeps for switches on their way, with
`toolsWaiting`, and the script puts the switch in it: three native radios in a group named Theme,
System, Light and Dark, described by a note that the choice is saved for every page on
jasonsdevspace.com. It names the strip's section by the group's legend, so the section becomes the
landmark the kit makes of switches that have come. The script shows the saved choice, saves a new
one under the portfolio's key, and sets `data-theme` on the page at once, since the theme script
hears only a choice saved in another tab. It moves to a choice another tab saves, which the theme
script has already drawn, and leaves following the system's theme under System to the theme script.
A browser that refuses the page its storage still draws a choice until the page is left.

## Consequences

- The policy allows any script file from the site's origin, `'self'`, beside the theme script's
  hash. The origin is jasonsdevspace.com, which the portfolio and every demo share, so a script
  file of theirs would run on the site too if markup put it there. Nothing the site serves writes a
  script element from a visitor's input, and a policy can name a path only with the full origin,
  which the preview the tests open does not have.
- A page with no script, or one whose script fails, draws the theme the visitor saved, or the
  system's, as before, and shows the empty room the strip keeps rather than a switch that does
  nothing. Nothing below the strip moves when the switch comes.
- The script's values are the portfolio's rather than the kit's two themes, so `system` is saved
  as the portfolio saves it, and the theme script reads it as nothing saved.
- The kit still runs no script of its own in a browser but the theme script. The switch is the
  site's, and a demo with a switch of its own writes it as the portfolio and the site do.

## How it is tested

The paths are in `packages/site`.

- `e2e/site.spec.ts` finds the switch in every page under its policy, with nothing the policy
  refuses and no style attribute. It finds the choice the portfolio saved checked and drawn, the
  strip's room taken, the group described as saved for jasonsdevspace.com, and a new choice drawn at
  once, saved with the portfolio's value, and kept after a reload. Under System it finds the page
  following the system's theme as it changes. It finds a choice saved in another tab checked and
  drawn, the arrow keys moving between the choices as radios do, and a choice drawn when the browser
  refuses the page its storage.
- `bench/lighthouse.ts` finds no layout shift on any page as the switch comes.
