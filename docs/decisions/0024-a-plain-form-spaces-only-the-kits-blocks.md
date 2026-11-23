# 24. A plain form spaces only the kit's blocks

**Status:** accepted in 0.9.4, amending record 16 so that a page's own markup in a form with no
class attribute is never restyled by the kit

## Context

A form with no class attribute stood a field `--dk-space-4` below a field before it, and nothing
else. The README's own checkout is such a form, and its buttons and its callout sat flush under the
select above them. The fix had to give room to what follows a field without reaching the markup a
page writes around the kit's pieces in the same form: a bare label and its control, a hidden input,
a closed dialog, a list of suggestions, a row the page lays out itself, a heading or a paragraph.
Record 16 holds that a page changes how a piece draws only through what the kit names, and the
reverse holds too: the kit draws only its own pieces, so a page's markup keeps the place the browser
and the page give it.

## Options

**A. Space every part after the first, and guess from tag names what to pass over.** One rule stands
each child a step below the one before it, skipping what draws nothing and what shares a line, from
lists such as `[hidden]`, `[type='hidden']`, `script`, `template`, `button`, `input` and `label`.
Rejected. Each list is open-ended, and each round of review found markup it missed: a hidden input
between two controls on one line, a closed dialog or a datalist first, a `<br>` between a bare label
and its control, and a page's own row with no class. Every miss gave the page's markup a band it
never asked for, and every fix grew the selector.

**B. Lay a plain form out as a flex column with a gap.** Rejected. A column restacks bare markup,
putting a label, its control and their button on lines of their own, and a gap opens around parts
that draw nothing. It also overrides the display of a form a page lays out as a row without a class.

**C. Space only the kit's own blocks, and only after another of them.** A field, a row of actions, a
callout with words and a fieldset stand `--dk-space-4` below the one of those before them, with
anything else between them passed over. Nothing else in the form is given room or has its margins
taken.

## Decision

Option C. The rule reads `form:not([class])`, then a block that is not hidden and not an empty
callout, then any later block, by the general sibling combinator, so a hidden input or a script
between two fields leaves them a step apart. It sits before the callout's rules, so an empty
callout's own margin still wins by order and it takes no room. A form's buttons go in a
`dk-actions`, a lone submit too, and the README's checkout and the reference write them so. A form
with a class attribute lays out its own parts, as before.

## Consequences

- What a page writes in a plain form outside the kit's blocks draws as it would in a form with a
  class, so a bare label and control, a page's own row, a heading and a paragraph keep the browser's
  margins and the page's layout.
- A lone button written right after a field stays flush under it unless it sits in a `dk-actions`.
  The reference says so, and a page that writes the button bare sees the gap missing at once.
- A page that lays out a classless form itself, holding a row of actions, a callout or a fieldset
  after a field, now finds room above them, so it gives the form a class. The changelog says so
  under Upgrading.
- A new block the kit adds that should stand apart in a plain form joins both lists in the rule.

## How it is tested

The paths are in `packages/design-kit`.

- `e2e/flow.spec.ts` stands a field, a field, a row of actions, a fieldset and a callout each a step
  below the one before. It draws markup holding every case option A missed, two bare buttons, a
  label, a break and an input, a hidden input between two controls on one line, a closed dialog
  first, a datalist, a page's own flex row, a heading, a paragraph and a lone button after one
  field, in a plain form and in a form with a class, and finds every part at the same place with the
  same margins in both. It finds no step before a first field after a hidden input, a script, a
  template, a dialog, a datalist and parts out of sight, and two fields with a hidden input between
  them a step apart.
- `e2e/controls.spec.tsx` stands the README's checkout row a step below its select and a filled
  callout a step below the row, and finds an empty or hidden callout adding no room.
- `e2e/checked.spec.tsx` finds the error a refusal adds to bare markup at its own margins, with no
  step from the form.
