# 4. One theme contract with the portfolio, set before the first paint

**Status:** accepted

## Context

The portfolio saves a visitor's theme in `localStorage` under the key `theme`, as `light`, `dark`
or `system`, and sets it on its root as `data-theme` before its first paint. A demo served under
jasonsdevspace.com should draw the same theme, and draw it from the first frame rather than
flashing the system's and then switching. ShelfLens and inventory-reservations each carry a copy
of the script that does this, `apps/storefront/theme.js` and `demo/theme.js`, the same line for
line.

## Options

**A. A copy in each demo.** As the demos have it. Rejected, since the key, the values and the
script are one contract written out in every repository, and a change to any of them has to be
made in each.

**B. CSS alone.** The sheets follow the system's scheme through `color-scheme` and no script runs.
Rejected, since a stylesheet cannot read storage, so the theme a visitor chose on the portfolio
would never reach a demo.

**C. One contract in the kit.** `THEME_KEY` and `THEMES` name the key and the themes, `themeScript`
is the script, and a Vite plugin puts it inline where a page asks for it, with its hash exported
for a Content Security Policy.

## Decision

Option C. The script runs inline in the head, before the body is parsed. It sets `data-theme` to
the theme saved, or to the system's when nothing usable is saved, and sets it again when the
system's changes or the portfolio saves or clears a choice in another tab. A page built with Vite
asks for it with `<!-- theme-script -->`, and a page built otherwise writes `themeScript` into its
head itself.

## Consequences

- Storage belongs to an origin, so the contract holds only on the portfolio's own. A demo served
  from anywhere else, a dev server on localhost included, finds nothing saved and follows the
  system.
- `system` and any value but the two themes read as nothing saved, so the page follows the system.
- Where the browser refuses the page its storage, the script follows the system, as the
  portfolio's own script does.
- `themeScriptHash` holds only while nothing rewrites the script after the plugin, as a minifier of
  a page's HTML would, and it changes whenever the script does, so a policy reads it from the
  installed package.
- The build fails on a page with no placeholder, which would otherwise draw the system's theme
  rather than the visitor's, and on a page with two.

## How it is tested

The paths are in `packages/design-kit`.

- `src/theme.test.ts` holds the key and the themes to the portfolio's, finds the script reading
  that key and those values, finds a rule in the tokens for each theme, and compiles the script and
  finds nothing in it that would end its element.
- `src/vite.test.ts` finds the script inline where the page asks for it, the build refused for a
  page with no placeholder and for one with two, and the hash matching the script as the plugin
  writes it.
- `e2e/theme.spec.ts` serves the page from an origin of its own in Chromium and finds the saved
  theme drawn whatever the system, the system followed when nothing, `system` or an unknown value
  is saved and when storage is refused, the theme set before the body is parsed, the system
  followed as it changes, and a choice saved or cleared in another tab taken up.
