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
  in the accent, so it meets the ratio a link does, and a control keeps it whatever its tabindex, so
  a tab the arrow keys move focus to is ringed as a link is.
- **Targets.** The kit's buttons and fields are 36 pixels tall on a wide screen and 44 on a phone.
  On the site, the page tabs, the theme switch, the list of a page's sections and the controls of
  each code panel are at least 24 pixels tall on a wide screen and 44 on a phone.
- **Reflow and spacing.** No page of the site scrolls sideways at 320, 390, 768 or 1280 pixels wide,
  at the browser's text size or at twice it, and no text is cut off under the wider spacing WCAG asks
  a page to allow.
- **Forced colors.** A pressed or unavailable button, an invalid field, the edge of a callout or a
  panel, the chrome's link to the current page, and the site's chosen theme and tab keep what sets
  them apart when the system draws its own colors.
- **Lighthouse.** Every page of the site scores a hundred for accessibility.

## Where it works

The colors are written with `light-dark()`, which sets the floor: Chrome and Edge 123, Firefox 120
and Safari 17.5. A page built with Vite keeps each color as written when it takes its build target
from the kit's `browserFloor()`, and its Lightning CSS targets from `lightningcssFloor()` where that
is its CSS transformer, as the package README shows.

## Known limitations

- In Firefox 120, which lacks `:has()`, an empty live callout draws its ground until it is filled,
  and a label that holds a checkbox or a radio shows no pointer, though the box or the dot does.
- The browser tests run only in Chromium, so the other browsers at the floor are held to it by what
  they document rather than by a test here.
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
