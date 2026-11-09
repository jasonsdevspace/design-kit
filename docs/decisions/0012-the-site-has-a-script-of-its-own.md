# 12. The site has a script of its own, from its own path, beside the kit's theme script

**Status:** accepted, amended by record 13, from which the switch and the copy buttons now come

## Context

When this was decided, the only script the kit ran in a visitor's browser was the theme script,
which reads the theme a visitor saved and draws it before the first paint, and its components drew
markup alone. Choosing a theme was left to the page, as the portfolio does with a switch of its own.
The site is a page a visitor may reach directly, with no way back to the portfolio's switch but
leaving, so it needs a switch of its own that saves under the portfolio's key with the portfolio's
values, `system`, `light` and `dark`, and so holds on every page of jasonsdevspace.com. Record 11
keeps React's script out of the browser, and the policy allows no inline script but the theme
script, named by its hash.

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
pages, which the policy allows from the folder the build writes it to and nowhere else. It needs no
inline script or style.

## Decision

Option D. Every page's strip keeps the room for switches on their way, with `toolsWaiting`, and the
script puts the switch in it. Since record 13 the switch is the kit's: each page draws the kit's
`ThemeSwitch` in a template, which no browser draws and no screen reader reads, and the script puts
a copy of it in the room and attaches it with the kit's `attachThemeSwitch`. It is three native
radios, System, Light and Dark, in a radio group named Theme by a visible name and described by a
note that the choice is saved for every page on jasonsdevspace.com, so a screen reader hears both as
the keyboard reaches the radios. The strip's section is named Settings, so it becomes the landmark
the kit makes of switches that have come and every part of the page sits in a landmark, and not
Theme, so a screen reader moving by landmarks and then to the radios never hears one name twice.
With no script the page holds the room alone, in a section with no name and so no landmark, and no
switch that does nothing. The kit's function shows the saved choice, saves a new one under the
portfolio's key, and draws it at once, since the theme script hears only a choice saved in another
tab. It moves to a choice another tab saves, and catches up with one saved while the page sat in the
browser's back and forward cache. When the system's theme changes it draws the choice again after
the theme script draws, so a browser that refuses the page its storage still draws a choice until
the page is left, where the theme script, which cannot know of it, draws the system's. A choice the
browser refused to save is not read over by what storage holds.

The same script puts a copy button beside the title of each block of code, or beside the tabs where
a state has Markup and React, in the markup the kit's `CopyButton` draws, and attaches it with the
kit's `attachCopyButton`, which copies the block the shown tab holds. It writes the block's text to
the clipboard, and where the browser refuses or has no clipboard it selects the text instead, so a
reader copies it with their own keys, or with the device's copy command on a touch screen. One
status line out of sight, in the page from load on a page with code, tells a screen reader which
happened, emptied first so a second copy is heard too, and the button says Copied or Selected for a
moment. With no script, the code still opens and its text can be selected by hand.

It also makes the live copies of the states a reader can change behave as they say. A toggle flips
`aria-pressed` when pressed, and a button that names a panel with `aria-controls` opens and closes
it, so what a control says it is stays true after a reader changes it. With no script, the copies
stay as they are drawn, as each state's name says they start.

And it answers a tap on a preview, the copy of a state in the theme the page is not in. A preview is
inert, so a tap on it does nothing and a reader would be left to guess why. The script puts a note
under the state's two copies that says the copy is only a preview, points to the one marked Live,
and offers to switch to the other theme. Its button chooses that theme with the kit's `chooseTheme`,
as the strip's switch does, so it is saved the same way and the switch shows it. The status line
says the same to a screen reader, naming the live copy by its theme, since the Live mark is hidden
from it. The keyboard never reaches a preview, so the note adds nothing to its path until a tap
brings it. It closes on Escape, on a tap elsewhere and whenever the theme changes, however it
changed, and a drag that only ends on a preview is no tap on it. A browser gives a tap on an inert
copy to an element that holds it, the page's root in Chromium, so the script tells a tap on a
preview by where it starts and ends. Each copy's label names its theme with no script at all, since
the page's theme picks the label as it picks the colors.

The policy allows scripts from the site's assets folder at the origin GitHub Pages serves it from,
`https://jasonsdevspace.com/design-kit/assets/`, beside the theme script's hash. A policy can name a
path only with its origin, so the build writes it for that origin unless `SITE_ORIGIN` names
another, which the browser tests and the Lighthouse audit set to the local preview they open.

## Consequences

- The origin is jasonsdevspace.com, which the portfolio, every demo and any other repository the
  account serves from GitHub Pages share. Allowing the whole origin, `'self'`, would let a script
  file of theirs run on the site if markup put it there. Naming the site's own folder allows only
  the files the site's build writes. The policy cannot stop a page on the same origin from opening
  the site in a frame or a window and reaching into it, which a browser allows any page of one
  origin whatever the other's policy, and such a page shares the site's storage anyway. A
  compromised build of the portfolio or a demo is as bad as one of the site.
- The deployed policy is written for one origin. Serving the build from any other, such as a preview
  opened without `SITE_ORIGIN`, refuses the site's script, and the page draws as it does when its
  own script fails to load. The build refuses a `SITE_ORIGIN` that is not an origin alone.
- A page whose own script fails to load or run still draws the theme the visitor saved, or the
  system's, from the theme script, and shows the empty room the strip keeps rather than a switch
  that does nothing. With scripts off, the page draws the system's theme, as before.
- The room holds the switch's height, and the site sets the kit's `--dk-strip-tools` to the switch's
  width, 21em in the strip's own text size, wide enough for its words in any font. On a wide screen
  the kit holds the room and the section the switch fills to that width, so a strip too narrow for
  the links and the switch wraps before it comes as it does after, and nothing below the strip moves
  when it comes.
- The kit's switch saves the portfolio's values, System and the kit's two themes, so `system` is
  saved as the portfolio saves it, and the theme script reads it as nothing saved.
- The switch and the copy buttons are the kit's since record 13, which the site bundles into its own
  script from the version it pins, so they reach the site a release after they change in the kit.
  The code's tabs, the live copies and the preview note stay the site's own.

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
  the site's navigation below the strip in the same place with the script and without it, and the
  switch's words within the width the room kept, from a small phone to a laptop and at twice the
  text size.
- `e2e/site.spec.ts` also finds a block copied to the clipboard with the status saying so, and
  saying so again for a second block. Where the browser refuses to write to the clipboard, or has
  none, it finds the block's text selected, with the status saying how to copy it. It finds no copy
  button with no script.
- `e2e/site.spec.ts` also finds a live toggle flipped by a click and by Space, and the panel a live
  button names closed and opened again with it. It finds the status line in the page before
  anything is copied, only on a page with code, and the words for copying what was selected given
  for a touch screen on a phone.
- `e2e/site.spec.ts` also finds each copy labeled by its theme, the live one marked Live, in both
  themes, the previews and pictures framed by a dashed edge, light on the left on a wide screen and
  the live copy first on a phone. It finds a tap on a preview answered by the note and the status
  line, the note closed by Escape, by a tap elsewhere and by the strip's switch, its button
  switching the theme and the strip's switch with it and leaving focus on the live copy, a drag
  that ends on a preview taken for no tap, and nothing added to the keyboard's path until a tap
  brings the note.
- `bench/lighthouse.ts` holds every page, with the switch in its strip, to its layout shift gate.
