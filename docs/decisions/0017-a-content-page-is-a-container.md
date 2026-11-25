# 17. A content page is a container of its own

**Status:** accepted, amended in 0.8.4 for a landing page in bands, a stack in a grid's cell and a
group of sections, and in 0.9.4 for a field, a row of fields and a callout beside them, held to the
measure as the prose beside them is

## Context

A plain content page, such as a landing page or an about page, holds a title, a lead, an action and
sections of prose, tables and grids. The kit spaced the pieces in an explainer, a panel, an app's
body and a dialog, but a page that was none of these had no container, and the kit resets the body
alone. Each page that wanted its blocks and sections spaced reset the browser's margins and spaced
its sections by hand, and none held its lead to the same measure. The kit needed a way for such a
page to space and hold its content with kit classes alone.

A landing page that runs in bands the width of the screen, each on a ground of its own, could not
use `dk-page`, which pads the page as one column, so each band reset the browser's margins and
spaced its content by hand, as content pages had before this record.

A field in a page, a band or a stack ran the whole width of what held it while the prose beside it
held to the measure, so on a laptop a field for a short name stretched across a wide column, far
longer than anything typed in it, and a form's callout ran past the fields under it.

## Options

**A. A reset of every block's margins in the base sheet.** Rejected, since it reaches every page
that loads the base, the ones with layouts of their own among them, and takes away the browser's
spacing where a page relied on it, a change no page asked for. A reset also spaces nothing, so each
page would still set its steps.

**B. The explainer, used for a content page too.** Rejected, since the explainer is a page about a
demo: it holds every part to the measure and opens each section on a rule and a number. A content
page sets a table or a grid of tiles at the column's width and has no numbered sections, so it would
override most of what the explainer draws.

**C. A container of its own, `dk-page`, on the page's main content.** It spaces what it holds by the
same flow the explainer uses, and draws nothing else.

A landing page in bands, and the fields a page holds, were weighed apart.

**D. A content page per band.** Rejected, since a content page sets `--dk-space-6` above its first
child for the header's rule, which a band under another band does not have, and a hero's grid would
need its own rules to undo the page's.

**E. Three containers that share the flow: `dk-band`, `dk-stack` and `dk-sections`.** A band starts
its content at the band insets and spaces it by the flow, with `--dk-band-room` above and below it,
`--dk-space-7` until a page sets it, so a page changes it through a property, as record 16 has it. A
stack is the flow with no room of its own, for a column of pieces in a grid's cell. A group sets
sections side by side, each with a page section's heading and steps.

**F. A width the kit gives a field of its own.** Rejected, since a field the kit held to a length of
its own would line up with nothing around it.

**G. The measure, as the prose takes it.** A field, a row of fields and a callout beside them end
where the prose beside them ends.

## Decision

Option C. `dk-page` spaces its children by `--dk-flow-step`, with the lead `--dk-space-2` under its
title, and its sections by `--dk-space-7`, with `--dk-space-6` above its first child, as an
explainer has, so its title clears the header's rule, sets its `h1` at the display size and a
section's `h2` at the title size, starts its text at the strip's inset by the band insets, and holds
its prose to the measure, and its fields as below, while a table or a grid of tiles keeps the
column's width. The spacing is set between its children, never on their own margins, so a reader's
own sheet that adds room under a paragraph adds the room it asks for and breaks nothing. Nothing it
sets reorders what it holds, so focus and reading follow the markup. `dk-lead` is the explainer's
lead under a name of its own, held to the measure wherever it sits.

For a landing page in bands, option E. A band's own prose, a stack's and a section's are held to the
measure as a content page's are. A group, or a section in a band, right under the heading that names
it stands the flow's step below it, while a content page's sections keep their room under its
headings, as before. The cost is that every container joins the same lists in the sheet, the flow's,
the measure's and those a row and a switch use to reach past the column by their ring, so a new
container is added to each, and those lists are written with `:is()` where that keeps them shorter.

For fields, option G. A field anywhere in a page, a band or a stack, a form's included, and a row of
fields take `--dk-field-measure` as their widest, `--dk-measure` until a page sets it, and so does a
callout in a form there, or one written before or after a field or a row of fields in what holds
them, so a page's fields and their callouts keep one right edge with its prose, in a form or not. A
callout with no field beside it runs the column. A page narrows a field with a shorter length, for a
short answer such as a ZIP code, or widens it with `none`, on the field, its form or what holds it,
and a row of the page's own that sets fields side by side sets `none` on the row. A field in a
dialog or a popover keeps the width the dialog or popover gives it, since what holds it there sizes
it.

## Consequences

- A content page needs no rule of its own to space its content, and a page with its own layout is
  left as it was, since nothing reaches it without the class.
- A content page lines its text up with the strip and the footer, and keeps clear of a phone's
  sides, with no padding of its own.
- A callout written before the first field, with no form, is told by a `:has()`, so in a browser
  without it, Firefox 120 at the floor, it runs the column while the fields after it hold to the
  measure.
- The explainer and the content page share the flow's rules, so a change to the flow's step changes
  both, which is what a reader moving between them expects.

## How it is tested

The paths are in `packages/design-kit`.

- `e2e/layouts.spec.ts` draws a content page and holds the step between its blocks, the larger step
  between its sections with no rule over them, `--dk-space-6` above its first child, its text at the
  strip's inset, prose and the lead at the measure beside a table at the column's width, its `h1` at
  the display size, a section's `h2` at the title size and its lead at the lead size, and its
  keyboard order at a phone's width and a wide one. At 320 wide, with twice the text size and the
  wider text spacing WCAG allows together, nothing is cut off or scrolls sideways.
- `e2e/bands.spec.ts` holds the bands, the stack, the group, the measure, the reach, the held sides
  on an app's page and a phone at twice the text size.
- `e2e/stack.spec.ts` finds a field in a wide stack, a page and a band at 1280 no wider than the
  measure, a form's and one with a button beside its control too, a callout in the form ending where
  its fields end, a callout after the form, with no field beside it, at the column's width, a field
  a page widens at the stack's width, and a field in a kit dialog, a native dialog and a popover a
  page widens at their width. It finds a callout before the first field of a stack, one between two
  fields and one after a row of fields ending at their right edge, and one with no field beside it
  running the column.
