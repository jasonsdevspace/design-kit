# Accessibility

The design kit and its site at [jasonsdevspace.com/design-kit](https://jasonsdevspace.com/design-kit/)
are built to meet the Web Content Accessibility Guidelines, WCAG 2.2, at level AA, in the light
theme and the dark one alike.

## How it is checked

Each of these runs in CI on every pull request, and a finding fails the pull request.

- **Automated audits.** axe audits the page chrome, every state of the controls and an explainer
  page in the kit's browser tests, and every page of the site, each in both themes, on a phone and
  a wide screen.
- **Contrast.** Every pairing of colors the kit is meant for is measured in both themes: text at 4.5
  to 1 against every ground it sits on, and the edge of a control at 3 to 1. The focus ring is drawn
  in the accent, so it meets the ratio a link does. A control keeps it whatever its tabindex, a
  native one or an element with a tabindex and a widget role such as tab, option, menu item, grid
  cell, row, slider or text box, so a tab the arrow keys move focus to is ringed as a link is.
- **Targets.** The kit's buttons and fields are 36 pixels tall on a wide screen and 44 on a phone,
  and tab bar links 56, as are an app's buttons, grid cells, rows and steppers where a page asks for
  the tall size.
- **Reflow and spacing.** No page of the site scrolls sideways at 320, 390, 768 or 1280 pixels wide,
  at the browser's text size or at twice it, and no text is cut off under the wider spacing WCAG asks
  a page to allow.
- **Forced colors.** A pressed or unavailable button, an invalid field, the edge of a callout, a
  panel or a focused skip link, the chrome's link to the current page, and the site's chosen theme
  and tab keep what sets them apart when the system draws its own colors.
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
  column, and a toast with an action covers the page's last line until it is dismissed. An app drawn
  in the kit's frame keeps clear of the bar and the toast there, since they have rows of their own.
  The page behind an open dialog still scrolls there too.
- The room a page that ends in a tab bar keeps for it holds a label on two lines, and the room a
  page keeps for a toast holds two lines, so a label or a message that wraps further at a large
  text size can bring what the keyboard reaches to rest partly under the bar or the toast. CSS
  cannot read their height, so the reference asks for short labels and messages, and an app drawn
  in the kit's frame keeps clear of both at any size, since they have rows of their own.
- Chrome 123 to 133 lets a page refuse a dialog's close only once, so a dialog attached to stay
  closes on a second Escape or Back there. Chrome 134 and later keep it open by its `closedby`
  attribute.
- The browser tests run in Chromium, and the app's frame, tab bar, toast and dialog in WebKit as
  well, so what Firefox lacks at the floor is known from its documented support rather than from
  a test here.
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
