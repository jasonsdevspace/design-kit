# 10. The markup each piece draws lives in one module of examples

**Status:** accepted

## Context

The package README shows the markup a page writes for each piece, and the browser tests draw that
markup to hold what the sheets do to it. Written once for each, the same button or table is kept in
step by hand in two places, and the README, which is the package's page on npm, is the one nothing
checks. Its blocks are also what a page without React copies, so a block that drifts from what the
components draw is a page that looks almost right.

## Options

**A. Each surface writes its own.** The README by hand and the tests in strings or JSX of their
own. Rejected, since nothing holds the README to the components, and every change to a piece is
made twice.

**B. The README is the source.** A script reads each block and the tests draw what it holds.
Rejected, since a block of HTML cannot use the components, so it would hold the README to itself
rather than to what a page with React draws, and the tests would have to read their markup out of
the README.

**C. A documentation framework, such as Storybook or a docs site generator, holds the examples.**
Rejected, since each brings a runtime and inline styles of its own, so the examples could not be
drawn under `style-src 'self'` as a demo draws them, and the README would still be written by hand.

**D. One module of examples.** Each piece is a React element in `packages/design-kit/examples`,
drawn by its component where the block shows all of what the component draws, and written as a
page without React writes it otherwise. The README prints each as HTML, the browser tests import
them, and the package ships none of it.

## Decision

Option D. `examples/examples.tsx` holds an element for each piece's block the README prints, under
the name its marker gives it, and the states of every control the browser tests draw. Each of those
blocks follows a comment that names its example, and `npm run examples` writes the block as React
draws the example, laid out by Prettier. An example listed as free of spaces that are read, such as
the buttons, puts each child of an element too long for one line on a line of its own, as a page
written by hand does, and keeps a space that ends or starts an element's text, such as the one after
the hidden "Error: ". Every other example, such as the footer's sentence of links, breaks a line
only where a space already is, so one added later is laid out tightly rather than wrongly. The setup
block for the theme script is no piece's markup, and is written by hand.

`examples/states.tsx` holds each state of each control the site shows one by one, named, with the
attribute that draws it. It takes the components it draws with rather than importing them, and
imports nothing of the kit's but its types, so the site draws the states from the version of the
kit it pins and the kit's own tests draw them from the sources. `examples/pieces.tsx` holds the
states of the page chrome and of an explainer's pieces the same way. The chrome's states are marked
as pictures, which the site draws inert in both themes, since a live strip would give a page a
second portfolio navigation. The README's blocks for the steps, the panel, the table and the code
block are drawn from it, so the README and the site show one markup.

`examples/palette.ts` holds the color roles, each pairing the palette is meant for at its ratio,
and the measure of contrast, read from a tokens sheet it is given. The kit's test measures the
sources with it, and the site measures and shows the version it pins.

## Consequences

- A change to a piece's markup is made once, and `npm run examples` carries it to the README. Until
  it is run, the unit tests fail.
- The README's blocks show React's order of attributes, and a line for each child where an element
  is too long for one, since that is the markup a page with React gets, laid out as the repository
  lays out HTML.
- A block that shows only part of what a component draws, such as the strip's section while its
  switches are on their way, is written by hand in the module, so `src/react.test.tsx` rather than
  the README's test holds it to the component.
- A test that needs more than a block shows, such as a table wide enough to scroll, keeps that piece
  of its own beside the examples it imports.
- The site measures the sheet of the version it pins with the workspace's pairings, and shows the
  roles that sheet declares, so a role added to the kit before a release is left off the site, with
  any pairing that names it, until a version with it is released and the pin moves.
- The states the site shows are a list of their own in `examples/states.tsx`, beside the states the
  browser tests draw from `controlStates`, since the site draws them from the version it pins. A
  state added to the kit is added to both, and nothing fails when only one has it.
- The examples are not in the package's `files`, so a page that installs the kit gets none of them.

## How it is tested

The paths are in `packages/design-kit`.

- `examples/readme.test.ts` writes the README's blocks from the examples and fails when the README
  differs, finds a marker for every example, none twice and each with a block after it, closes an
  empty block at its own fence, keeps the line endings of a checkout that ends lines with a carriage
  return, and refuses a marker that names no example.
- `examples/states.test.tsx` draws each state of the controls, the chrome and an explainer's pieces
  from the sources and finds the attribute printed under it, whole, finds each copy's ids its own,
  and finds `states.tsx` and `pieces.tsx` importing nothing of the kit but its types.
- `e2e/controls.spec.tsx` draws the examples' states of every control, `e2e/explainer.spec.tsx`
  draws their steps, and `e2e/chrome.spec.tsx` names the repository they name.
- `src/tokens.test.ts` measures every pairing in `examples/palette.ts` from the sources, in both
  themes.
- The oldest Node job in CI installs the packed package, where `smoke/consumer.mjs` finds no file
  under `examples` in it.
