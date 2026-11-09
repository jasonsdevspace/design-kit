# Accessibility

The design kit and its site at jasonsdevspace.com/design-kit/ are built to the Web Content
Accessibility Guidelines, WCAG 2.2, at level AA, in the light theme and the dark one alike.

## How it is checked

Each of these runs in CI on every pull request, and a change that fails one is not merged.

- **Automated audits.** axe audits the page chrome, the controls and the explainer's pieces in the
  kit's browser tests, and every page of the site in both themes, on a phone and a wide screen.
- **Contrast.** Every pairing of colors the kit is meant for is measured in both themes: text at 4.5
  to 1 against every ground it sits on, and the edge of a control at 3 to 1.
- **Targets.** Everything that takes a click is at least 24 pixels on a wide screen and 44 on a
  phone.
- **Reflow and spacing.** No page of the site scrolls sideways at any width down to 320 pixels or at
  twice the text size, and no text is cut off under the wider spacing a reader may set.
- **Forced colors.** A pressed, open, unavailable or invalid control, and the link to the current
  page, keep what sets them apart when the system draws its own colors.
- **Lighthouse.** Every page of the site scores a hundred for accessibility.

Not every criterion can be checked by a tool. Those are reviewed by hand when a change touches them.

## Where it works

The colors are written with `light-dark()`, which sets the floor: Chrome and Edge 123, Firefox 120
and Safari 17.5. A build that takes the floor from the kit's `browserFloor()` keeps each color as
written. The browser tests run in Chromium.

## What it does not yet do

- In Firefox 120, which lacks `:has()`, an empty live callout draws its ground until it is filled,
  and a label that holds a checkbox or a radio shows no pointer, though the box or the dot does.
- The browser tests run only in Chromium, so the other browsers at the floor are held to it by what
  they document rather than by a test here.

## Reporting a barrier

If something in the kit or its site is hard or impossible to use, open an issue with the bug
template. Say what you were trying to do, on which page or with which component, and the browser and
any assistive technology you use. It is labeled as an accessibility issue and handled as a bug. A
barrier that is also a security issue goes to the [security policy](SECURITY.md) instead.
