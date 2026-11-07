# 10. The markup each piece draws lives in one module of examples

**Status:** accepted

## Context

The package README shows the markup a page writes for each piece, the browser tests draw that
markup to hold what the sheets do to it, and the showcase site is to draw it live beside its code.
Written once for each, the same button or table is kept in step by hand in three places, and the
README, which is the package's page on npm, is the one nothing checks. Its blocks are also what a
page without React copies, so a block that drifts from what the components draw is a page that
looks almost right.

## Options

**A. Each surface writes its own.** The README by hand, the tests in strings or JSX of their own,
and the site again. Rejected, since nothing holds the README to the components, and every change
to a piece is made three times.

**B. The README is the source.** A script reads each block and the tests and the site draw what it
holds. Rejected, since a block of HTML cannot use the components, so it would hold the README to
itself rather than to what a page with React draws, and a test would have to parse prose.

**C. A documentation framework, such as Storybook or a docs site generator, holds the examples.**
Rejected, since each brings a runtime and inline styles of its own that break the kit's promise to
draw under `style-src 'self'`, and the README would still be written by hand.

**D. One module of examples.** Each piece is a React element in `packages/design-kit/examples`,
drawn by its component where it has one and written as a page without React writes it where it has
none. The README prints each as HTML, the tests and the site import them, and the package ships
none of it.

## Decision

Option D. `examples/examples.tsx` holds an element for each block the README prints, under the name
its marker gives it, and the states of every control the browser tests draw. Each block in the
README follows a comment that names its example, and `npm run examples` writes the block as React
draws the example, laid out by Prettier. Outside a sentence each element starts a line of its own,
as a page written by hand starts it. In a sentence, such as the footer's, every space is kept where
it is, and the space that ends the hidden word before an error is kept everywhere. The setup block
for the theme script is no piece's markup, and is written by hand.

## Consequences

- A change to a piece's markup is made once, and `npm run examples` carries it to the README, which
  the unit tests fail until it is run.
- The README's blocks show React's order of attributes, since that is the markup a page with React
  gets.
- A test that needs more than a block shows, such as a table wide enough to scroll, keeps that piece
  of its own beside the examples it imports.
- The examples are not in the package's `files`, so a page that installs the kit gets none of them.

## How it is tested

The paths are in `packages/design-kit`.

- `examples/readme.test.ts` writes the README's blocks from the examples and fails when the README
  differs, finds a marker for every example the README prints, and refuses a marker that names no
  example.
- `e2e/controls.spec.tsx` draws the examples' states of every control, and
  `e2e/explainer.spec.tsx` draws the examples' steps.
- `smoke/consumer.mjs` installs the packed package and finds no file of the examples in it.
