# 9. An explainer's sections are never landmarks

**Status:** accepted

## Context

An explainer is a few sections, each under an h2 whose id other pages link to. A reader with a
screen reader moves through a long page by its headings first, and uses its landmarks to reach the
main content or leave it. A `<section>` with a name, from `aria-labelledby` or `aria-label`,
becomes a region landmark, and one without a name is no landmark at all. The page already has the
strip's navigation, the header, the main content, the footer, and a region for each frame that
scrolls, as record 8 sets out.

## Options

**A. Named sections.** Each `<section>` takes `aria-labelledby` pointing at its h2, so it is a
region landmark named as its heading is. Rejected, since every section then appears twice, once
among the headings and once among the landmarks, and with the frames beside them the landmarks
grow long enough that the main content and the footer are harder to find in them.

**B. Plain sections.** Each `<section>` has no name and is no landmark, and a reader moves between
sections by their h2.

## Decision

Option B. A section holds its number, hidden from a screen reader since its heading says what it
is, then an h2 with an id, then its text, with an h3 for each part of it. An in-page link goes to
the h2's id, and the heading takes no tabindex, since a jump to a fragment moves where the keyboard
goes next. The h2 has a scroll margin of the number's line and a step more, so a jump leaves the
number and the section's rule in sight above it. The back link to the demo sits in a header before
`main`, so the skip link passes it and reading starts at the h1. The page has no table of contents,
since an explainer is short enough to move through by its headings.

## Consequences

- The h2 ids are a contract other pages link to, so a heading that is reworded keeps its id.
- A reader who moves by landmarks alone finds no stop at a section, and moves by headings to reach
  one.
- A section's number is for the eye alone, so it never says anything its heading does not.
- The kit draws no table of contents, so an explainer that needs one writes its own.

## How it is tested

The paths are in `packages/design-kit`.

- `e2e/explainer.spec.tsx` finds the page's only regions are its frames, with one main and one
  banner, and no section among them. It follows the skip link to the main content and finds the
  next tab stop is the page's one action, not the back link. It follows an in-page link to the
  second section and finds the section's number still on screen, and the next tab stop the table's
  frame inside that section. It holds each section to a solid rule with 2rem of space above and
  below it, and its heading to 0.25rem under its number.
