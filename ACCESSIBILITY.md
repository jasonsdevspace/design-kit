# Accessibility

The design kit and its site at [jasonsdevspace.com/design-kit](https://jasonsdevspace.com/design-kit/)
are built to meet the Web Content Accessibility Guidelines, WCAG 2.2, at level AA, in the light
theme and the dark one alike. That is the level EN 301 549 V4.1.1 asks of web content, and the
European Accessibility Act asks it of e-commerce through that standard. This statement was last
reviewed on November 16, 2026, against the pieces in the next release.

## How it is checked

Each of these runs in CI on every pull request, and a finding fails the pull request.

- **Automated audits.** axe audits the page chrome, every state of the controls, an explainer page,
  a site's header, a raised panel and a list of tiles on grounds a page sets in the kit's browser
  tests, and every page of the site, each in both themes, on a phone and a wide screen.
- **Contrast.** Every pairing of colors the kit is meant for is measured in both themes: text at 4.5
  to 1 against every ground it sits on, and the edge of a control at 3 to 1. The focus ring is drawn
  in the accent, so it meets the ratio a link does. A control keeps it whatever its tabindex, a
  native one or an element with a tabindex and a widget role such as tab, option, menu item, grid
  cell, row, slider or text box, so a tab the arrow keys move focus to is ringed as a link is. A
  tile's title, detail, sign and ring are measured as drawn on the grounds a page sets, on the kit's
  own surface and on the grounds a tile steps to in a panel.
- **Links.** A link in running text keeps its underline wherever it sits, in a color that shows, in
  both themes and in forced colors, since the accent stands too close to the text to mark a link by
  color alone. In the footer a link takes the footer's muted color, so there the underline is the
  only cue. A piece that is a link, such as a button, a pill, a tab or a row, marks itself by its
  edge, its sign or its place in a row of links instead.
- **Targets.** The kit's buttons and fields are 36 pixels tall on a wide screen, and 44 on a phone
  and at every width in an app, and tab bar links 56, as are an app's buttons, grid cells, rows and
  steppers where a page asks for the tall size. A quiet Close is as wide as it is tall, and a site
  header's brand and each of its pages are the target tall.
- **Reflow and spacing.** No page of the site scrolls sideways at 320, 390, 768 or 1280 pixels wide,
  at the browser's text size or at twice it, and no text is cut off under the wider spacing WCAG
  asks a page to allow. The kit's site header, content page, rows with a picture and tiles in
  columns are held to the same at 320 pixels wide.
- **A phone's edges.** On a page that reaches under a phone's notch and rounded corners, the strip,
  the footer, each band and an app's bars keep their content clear of what the phone keeps at its
  sides, its top and its foot.
- **Forced colors.** A pressed or unavailable button, an invalid field, the edge of a callout, a
  panel, a tile or a focused skip link, the chrome's and a site header's link to the current page, a
  tab row's rule, a quiet Close's ring and the site's chosen theme and tab keep what sets them apart
  when the system draws its own colors. Every chosen thing, a toggle that is on, a button whose
  panel is open, the theme switch's chosen word, the current pill, the chosen tab and the current
  place in a tab bar, draws its words in the selection's colors, which a test reads from the drawn
  pixels, since a browser paints a backplate behind words that could hide them. An icon takes the
  system's text or link color.
- **Lighthouse.** Every page of the site scores a hundred for accessibility.

## Where it works

The colors are written with `light-dark()`, which sets the floor: Chrome and Edge 123, Firefox 120
and Safari 17.5. A page built with Vite keeps each color as written when it takes its build target
from the kit's `browserFloor()`, and its Lightning CSS targets from `lightningcssFloor()` where that
is its CSS transformer, as the package README shows.

## Known limitations

- In Firefox 120, which lacks `:has()`, an empty live callout draws its ground and keeps its place
  in the flow until it is filled, so a grid opens its gap around it, and a label that holds a
  checkbox or a radio shows no pointer, though the box or the dot does. In a choice field there, a
  choice the keyboard lands on lights no word, so the ring on the control is the one cue, and a
  disabled choice keeps its word in the text color, with only the control drawn off.
- In Firefox 120, the room a page that ends in a tab bar keeps for it, the room a page keeps for a
  toast shown over it, and the room a table's frame keeps for its pinned column all rest on
  `:has()`, so there the keyboard can bring a control to rest under the bar, the toast or the pinned
  column, and a toast with an action covers the page's last line until it is dismissed. In an app's
  frame there, the body does not pad for a toast floating over its foot, so the toast covers the
  body's last line until it is dismissed, and the frame keeps clear of the tab bar, which has a row
  of its own.
  The page behind an open dialog still scrolls there too.
- On a page that scrolls whole and is 18rem wide or more, the room kept for a tab bar holds a label
  on two lines. A label that wraps further can leave what the keyboard reaches partly under the bar.
  CSS cannot read its height, so the reference asks for short labels. An app's frame keeps clear of
  its tab bar at any size, since the bar has a row of its own.
- The room kept for a toast is measured as it shows and while it stays, up to five rows, so a toast
  whose message runs past five rows can leave what the keyboard reaches partly under it. The
  reference asks for a short sentence.
- Safari keeps no scroll position by what is on screen, so in an app's frame on a screen too short
  for it, a phone on its side at a large text size, showing or hiding a toast moves the dock by the
  toast's height there.
- Without script, Chromium and Safari leave a link or a button in a table's frame where it is when
  the keyboard reaches it partly in view. The frame's room at its end brings in one with no more
  than a target's width showing, and `attachTable` brings in the rest.
- Chrome 123 to 133 lets a page refuse a dialog's close only once, so a dialog attached to stay
  closes on a second Escape or Back there. Chrome 134 and later keep it open by its `closedby`
  attribute.
- The browser tests run in Chromium, the app's frame, tab bar, toast, dialog, stepper, a table's
  frame and an icon in WebKit as well, and the stepper, the controls, the pieces, a table's frame
  and an icon in the current Firefox. What Firefox 120 lacks at the floor is known from its
  documented support rather than from a test here.
- No test runs a screen reader. What one would announce is checked through the names, roles and
  states the browser gives it.
- The criteria a tool cannot judge, such as whether a heading describes its section or a link's
  words say where it leads, are held by no test here.
- A page that sets its own palette answers for the contrast of its own pairings.

## Reporting a barrier

If something in the kit or its site is hard or impossible to use, open an issue with the
[bug template](https://github.com/jasonsdevspace/design-kit/issues/new?template=3-bug.md). Say what
you were trying to do, on which page or with which component, and the browser and any assistive
technology you use. The acceptance criteria and the size are for whoever fixes it, and can be left
empty. It is handled as a bug. A barrier that is also a security issue goes to the
[security policy](SECURITY.md) instead.
