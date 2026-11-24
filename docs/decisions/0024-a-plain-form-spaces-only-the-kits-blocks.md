# 24. A plain form spaces only the kit's blocks

**Status:** accepted in 0.9.4, amending record 16 so that in a form with no class attribute the kit
spaces only its own blocks, and a page's own markup there keeps the place the browser and the page
give it, amended in the same release to count a row of fields, record 25's `dk-fields`, among
those blocks, and amended again in it, by record 27's rule, to count an empty callout written
without its mark as a block

## Context

A form with no class attribute stood a field `--dk-space-4` below a field before it, and nothing
else. The README's own checkout is such a form, and its buttons sat flush under the select above
them, and its callout, once it had words, flush under the buttons. The fix had to give room to what
follows a field without reaching the markup a page writes around the kit's pieces in the same form:
a bare label and its control, a hidden input, a closed dialog, a list of suggestions, a row the page
lays out itself, a heading or a paragraph. Record 16 holds that a page changes how a piece draws
only through what the kit names, and the reverse holds too: the kit draws only its own pieces, so a
page's markup keeps the place the browser and the page give it.

## Options

**A. Space every part after the first, and guess from tag names what to pass over.** One rule stands
each child a step below the one before it, skipping what draws nothing and what shares a line, from
lists such as `[hidden]`, `[type='hidden']`, `script`, `template`, `button`, `input` and `label`.
Rejected. Each list is open-ended, and markup a page writes falls outside it: a hidden input between
two controls on one line, a closed dialog or a datalist first, a `<br>` between a bare label and its
control, and a page's own row with no class. Each case left out gives the page's markup a band it
never asked for, and each case added grows the selector. It takes every part's own margins too, as
the flow does in a panel, which takes a page's heading and paragraph off the browser's margins.

**B. Lay a plain form out as a flex column with a gap.** Rejected. A column restacks bare markup,
putting a label, its control and their button on lines of their own. Margins in a flex column no
longer collapse, so a page's heading and paragraph take the gap on top of their own margins, and a
page that sets only `display: flex` on a classless form to make a row finds it turned to a column.

**C. Space only the kit's own blocks, and only after another of them.** A field, a row of fields, a
row of actions and a callout that is not empty each stand `--dk-space-4` below what sits above them,
once another of those has come before them, so a hidden input or a script between two of them leaves
them a step apart. Nothing else in the form is given room.

## Decision

Option C. The rule reads a child of `form:not([class])` that is a block, a field, a row of fields, a
row of actions or a callout, not marked `hidden` or `data-empty` and not visually hidden, then any
later block by the general sibling combinator. A field nested in a page's own `div` is not a child
of the form, so it is not spaced. An empty callout written without its mark counts as a block.
Telling it apart took a `:has()` on the callout before the block the rule spaces, which Chromium
answers by restyling every block after that callout for a change inside any one of them, 337
elements for a stepper's button shown in a form of 150 fields. Without it, the same change restyles
the field it is in. The rule sits before the callout's rules, so an empty callout's own margin
still wins by order and it takes no room. A form's buttons go in a `dk-actions`, a lone submit too,
and the README's checkout and the reference write them so. A form with a class attribute lays out
its own parts, as before.

## Consequences

- What a page writes in a plain form outside the kit's blocks draws as it would in a form with a
  class, so a bare label and control, a page's own row, a heading and a paragraph keep the browser's
  margins and the page's layout.
- A lone button written right after a field stays flush under it unless it sits in a `dk-actions`.
  The reference and the README's checkout write the row, and a page that writes the button bare sees
  the gap missing at once.
- A page's own markup between two of the kit's blocks keeps its place, and the block after it stands
  a step below it, the step collapsing with that markup's own margin.
- A page that lays out a classless form itself, holding a row of actions or a callout after a field,
  now finds room above them, so it gives the form a class. The changelog says so under Upgrading.
- A bare fieldset is a page's own markup and is not spaced. The kit's set of choices is a `dk-field`
  and is.
- A new block the kit adds that should stand apart in a plain form joins both lists in the rule.
- An empty callout a page writes without `data-empty` first in a plain form puts a step above the
  field after it, and the reference says a page marks it, as `Callout` does. One between two blocks
  changes nothing, since the block after it stands a step below the block before it either way.

## How it is tested

The paths are in `packages/design-kit`.

- `e2e/flow.spec.ts` stands a field, a field, a row of actions, a set of choices and a callout each
  a step below the one before, and a field a step below a heading between two fields, the step
  collapsing with the heading's margin. It draws markup holding every case option A missed, two bare
  buttons, a label, a break and an input, a hidden input between two controls on one line, a closed
  dialog first, a datalist, a page's own flex row, a heading, a paragraph, a bare fieldset and a
  lone button after one field, in a plain form and in a form with a class, and finds every part at
  the same place with the same margins in both. It finds no step before a first field after a hidden
  input, a script, a template, a dialog, a datalist, parts out of sight, a visually hidden status
  callout or an empty callout marked `data-empty`, a field a step below an empty callout written
  without its mark, and two fields with a hidden input between them a step apart. A plain form
  inside a dialog keeps the dialog's further step above its actions.
- `e2e/restyle.spec.tsx`, in Chromium, shows a stepper's button in a plain form of a few hundred
  elements and finds no more than a tenth of the form restyled.
- `e2e/controls.spec.tsx` stands the README's checkout row a step below its select and a filled
  callout a step below the row, and finds an empty or hidden callout adding no room.
- `e2e/checked.spec.tsx` finds the error a refusal adds to bare markup at its own margins, with no
  step from the form.
- `e2e/fields.spec.tsx` stands a row of fields in a plain form a step below the field above it and
  a step above the field below it.
