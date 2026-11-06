# 3. Each color holds both themes in one light-dark()

**Status:** accepted

## Context

Every color role has a value for the light theme and one for the dark. Which one a page draws is
the system's choice, or the theme the portfolio saved, which the theme script sets on the root as
`data-theme`. A demo with its own palette has to be able to set a role for both themes, on the root
or on one container, without the kit's sheets having to load in any particular place.

## Options

**A. A dark block per theme, as ShelfLens writes it.** Each role is named twice, such as
`--light-accent` and `--dark-accent`, the root points the role at the light one, and a
`:root[data-theme='dark']` block points it at the dark one. Rejected, since a page that sets its
own palette has to set it in each block, a container needs a dark block of its own to restyle only
what is inside it, and the system's theme reaches the page only once a script has set the attribute.

**B. One `light-dark()` per role.** Each role holds both values, and `color-scheme` on the root,
`light dark` by default and one of the two when `data-theme` names it, picks between them where the
color is drawn.

## Decision

Option B. Every color role in the tokens is a `light-dark()` of its light and its dark value, and
the tokens set `color-scheme` on the root from `data-theme`, or leave both open for the system to
choose.

## Consequences

- `light-dark()` sets the browser floor: Chrome and Edge 123, Firefox 120 and Safari 17.5. The
  browser tests run in Chromium alone.
- The contrast test reads each role it lists as a `light-dark()` of two six-digit hex colors. A
  listed role written any other way, as `rgb()` or a short hex, fails the test, so a new way of
  writing a color is a change to the test as well. The scrim, written in `rgb()`, is not among the
  roles it lists, so it is not measured.
- `light-dark()` takes colors, so in a value that is more than a color, such as a shadow, only the
  color inside it can vary by theme. The kit's shadow does not, and is the same in both.
- A role a page sets to one color, rather than to a `light-dark()`, draws that color in both
  themes.
- A page sets its own palette once, with both values. Set on the root, it wins over the kit's
  whichever sheet loads first, as long as the rule sits outside a layer or in one after the kit's.
  Set on a container, it always wins, since the kit sets the roles on the root alone.

## How it is tested

The paths are in `packages/design-kit`.

- `src/tokens.test.ts` reads every color role from the sheet as its light and its dark value, and
  holds each pairing the palette is meant for to its WCAG ratio in both themes.
- `e2e/sheets.spec.ts` draws the page in Chromium and finds the light or the dark background and
  text from the system when nothing is saved and from `data-theme` whatever the system, a page's
  own palette winning even when it loads before the kit's sheets, and a palette set on a container
  restyling only what is inside it, in both themes.
