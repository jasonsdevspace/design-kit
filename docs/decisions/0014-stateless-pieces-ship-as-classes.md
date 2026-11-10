# 14. A piece with no state of its own ships as classes alone

**Status:** accepted

## Context

Three sites drew tabs by hand, for a category among categories, a block of markup beside its React
and a lane among lanes, and two drew rows of pills and small caps labels over headings. Each is a
look with no state the kit keeps: a tab's role and the keys that move among tabs belong to the page
that owns the panels, a pill names something or links somewhere, and an eyebrow is text. The kit
had to give the sites one look for each without taking over what the page already does.

## Options

**A. A component for each.** `Tabs`, `Pills` and `Eyebrow` in `./react`, drawing the markup and,
for tabs, running the keys. Rejected, since the keys and the chosen tab are the page's own state,
which a kit component would have to take in and hand back, and a page without React would still
write the markup by hand, as it does for every other piece.

**B. Classes alone.** `.dk-tabs` and `.dk-tab`, `.dk-pills` and `.dk-pill`, and `.dk-eyebrow`,
drawn by `components.css` from the markup the reference shows, with the page writing the roles,
the keys and the attribute that marks the chosen one.

## Decision

Option B. The sheet draws the row, and a piece's state is the attribute a screen reader already
reads for it, as record 6 has it for a control: `aria-selected="true"` on a tab, `aria-current` on
a link among pages, or `aria-pressed="true"` on a toggle, each drawn alike. A page that writes a
row with `role="tablist"` runs the tabs pattern's keys itself, as the site does. The reference
shows the markup for each, generated from the examples module as every other block is, so the
reference and the browser tests cannot drift from each other.

## Consequences

- A page owns its tabs' keys and the chosen tab, so a page's own state never has to pass through
  the kit, and a page without React writes the same markup as one with it.
- A new look with no state of its own joins the sheet the same way, as classes, with its block in
  the reference generated from an example, and a component only where the kit holds something a
  page would otherwise write twice.
- The site's own tabs, caps labels and preview switch move to the kit's classes when it pins the
  version that carries them.

## How it is tested

The paths are in `packages/design-kit`.

- `examples/readme.test.ts` holds the reference's blocks for tabs, pills and the eyebrow to the
  examples they are generated from.
- `e2e/pieces.spec.ts` draws those examples with the kit's sheets in Chromium and finds the chosen
  tab in the page's text over an accent line whether it is a tab, a link or a toggle, every tab in
  place as the choice moves, a chip that never reads as a control, the current pill marked by
  weight, the eyebrow in caps at the caption size in the muted text, and no word cut off under the
  wider text spacing a visitor may set.
