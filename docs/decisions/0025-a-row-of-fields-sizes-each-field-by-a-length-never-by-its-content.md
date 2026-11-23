# 25. A row of fields sizes each field by a length, never by its content

**Status:** accepted in 0.9.4

## Context

A page that set fields side by side, such as a stepper's field beside a player's name, wrote a flex
row of its own, and a row that could not wrap squeezed the text field at a large text size until its
label broke inside a word. The kit added `dk-fields`, a row that wraps, and first sized a stepper's
field from its stepper, with `flex: 0 1 auto`, while each text field started from 7rem. That
content-sized field had four faults, each found by review and each patched in turn:

- A long label or a range error shown widened the stepper's field, and pushed the text field beside
  it onto the next line, so a rule had to contain the field's words.
- Without `:has()`, as in Firefox 120, the stepper's field took a text field's basis, and its raise
  button ran past the field into the one beside it, so a fallback had to give every field in the row
  a least width from its parts.
- That fallback reached into a field's own parts, which the rules of a field, a stepper and a choice
  field already own, and each round of review found one more case it changed, a legend that shrank
  to nothing and an inline stepper that could no longer narrow its buttons among them.
- An inline stepper and a set of choices needed rules of their own to keep their layout in a row
  their content sized.

Each patch was right where it landed, and each added a rule that had to be measured in three
engines, with and without `:has()`, against every kind of field.

## Research

- **Fields share a line only when they form one answer.** Baymard finds multicolumn forms misread
  and fields skipped, and allows two or three inputs on one line where they form one entity, a date,
  a name or a city, state and ZIP code, with the rest of the form in one column. Nielsen Norman
  Group gives city, state and ZIP code as the fields that may share a row, and asks for fields about
  as wide as the answer expected.
- **Systems size a field by a length set for it.** GOV.UK's date input sets its day and month at a
  width of two characters and its year at four, and its text input offers fixed widths for an answer
  of known length and fluid widths as a share of the column. Carbon's forms pattern allows two or
  three inputs on one line where they belong together, and sizes fields by the expected length of
  the answer on its grid.

## Options

**A. The patched flex row.** A stepper's field takes its stepper's width, its words contained, with
a fallback for browsers without `:has()` and exceptions for an inline stepper and choices. Rejected,
for the faults above: the rules reached a field's parts, and each fix needed the next.

**B. A grid of equal tracks.** Each field takes a track of `repeat(auto-fit, minmax(7rem, 1fr))`.
Rejected, since a track sets its own least width rather than the field's. At 320 wide two tracks of
7rem ran a stepper 19 pixels past its track, and a track of 10rem, which cannot narrow, ran past the
row at 320 wide and twice the text size.

**C. A container query.** The row stacks its fields below a width it queries. Rejected, since a
container query cannot read a custom property for its threshold, so a page could not move it as
`--dk-stepper-digits` makes a stepper wider.

**D. Fixed widths.** Each field takes a width of its own, as GOV.UK's fixed inputs do. Rejected for
the row, since fields of fixed widths leave its end ragged, where the fields around the row end at
the measure.

**E. No row.** The reference keeps the recipe a page copies. Rejected, since every page would copy
it, and each copy would size a stepper's field by its content and meet the faults above on its own.

**F. Every field starts from one length and shares the rest.** Each field in the row takes
`flex: 1 1 var(--dk-fields-least, 10rem)`, and nothing in a field sets its width.

## Decision

Option F. The row wraps, with a gap of `--dk-space-4` both ways and its fields lined up along their
foot. A row written straight in what holds a column of pieces, a panel, a dialog or a stack among
them, stands its lines that column's step apart, `--dk-flow-step`, so a wrapped field sits as far
below as a field under another there too. Every field starts from `--dk-fields-least`, 10rem until a
page sets it, a stepper's width rounded up, so a field in the row is never narrower than a stepper
of two figures needs and nothing rests on `:has()`. An inline stepper and a choice field take a line
of their own by a basis of the whole line. The row holds to `--dk-field-measure` as a field does,
and a field in it narrows by the same property, so width by the expected answer, a ZIP code's for
one, needs no new property. A rule for what the row holds sets only how a field flexes, from a
length, and never reaches a field's own parts.

## Consequences

- Two fields share a line where the row is at least 21rem wide, two lengths and the gap, which in a
  page's column is a screen from 368 pixels, and a narrower row or a larger text size stacks them. A
  page that wants them side by side on a screen 360 pixels wide sets `--dk-fields-least` to 9.75rem,
  still as wide as a stepper of two figures.
- A stepper's field shares the line equally with a text field, wider than its stepper, rather than
  taking only its stepper's width and leaving the rest to the text field.
- A row of choices takes a line of its own, as a column of them does, rather than sharing one.
- A stepper of more figures, by `--dk-stepper-digits`, asks a page to set `--dk-fields-least` wider,
  10.5rem for three. Left at 10rem, a stepper of three figures keeps its field as wide as itself, so
  the pair stacks on a screen up to 374 pixels wide and stands at unequal widths up to 381. Without
  `:has()` it runs up to 7 pixels past its field into the gap on a screen 368 to 381 pixels wide,
  which the accessibility notes say.
- A tall stepper, 191 pixels wide with its buttons at the larger target, asks for 12rem, and a tall
  one of three figures, 209 pixels wide, for 13.25rem, which hold each at its full size. Left at
  10rem, a tall stepper keeps its field as wide as its least, its buttons narrowed toward the target
  but never under it, from a screen 375 pixels wide for two figures and 392 for three. Without
  `:has()` a tall stepper of two figures runs up to 7 pixels past its field into the gap on a screen
  368 to 381 pixels wide, and one of three up to 25 pixels on a screen 368 to 417 pixels wide, over
  the field beside it up to 385, which the accessibility notes say.
- A field's own rules, a stepper's least width and a long word breaking inside a field's column
  among them, hold in the row as they do outside it.

## How it is tested

The paths are in `packages/design-kit`.

- `e2e/fields.spec.tsx`, in Chromium, WebKit and Firefox, finds a stepper's field and a text field
  at equal widths a step apart with their controls level at 390 and 1280 wide, and each on its own
  line at 320 wide and at twice the text size, every label on one line, every part inside its field
  and no sideways scroll. It finds a stepper no wider than 10rem at either size, the same boxes
  drawn with the sheet's `:has()` rules taken out, neither field moved by a range error or a long
  label, a long address breaking inside its field, an inline stepper and choices each on a line of
  their own, two text fields sharing a line only where twice the length and the gap fit, three at
  1280, both controls level beside a hint, and a row in a plain form a step from the fields around
  it, ending at their edge, with a field in it narrowed by `--dk-field-measure`. It finds a tall
  stepper at 12rem, a tall one of three figures at 13.25rem and one of three at 10.5rem each inside
  its field with its buttons at full size, beside a text field where the row is wide enough, with
  and without `:has()`. In a row left at 10rem it finds a tall stepper of two figures and of three
  inside its field at 375, 392 and 1280 wide, its buttons the target wide or more and as tall as the
  same stepper's drawn alone. With the `:has()` rules taken out it measures how far each wider
  stepper runs past its field at 368, 381, 385 and 417 wide, holds it to the figures the
  accessibility notes give, and finds none a pixel past each end they give, at 382 and 418. Under
  wider text spacing it finds the row's labels, values and fields whole at 320 and 390 wide.
- `src/fields.test.ts` searches the sheets for every place a row of fields is named, in a selector,
  a list, a nested rule or an at-rule, and holds the rules found to a list written in the test, each
  whole: the row's own rule, its lines' step in a column, the two rules for what it holds directly,
  the measure and a plain form's step. A rule that names the row and is not on the list fails, with
  a message that sends its author here first, as does a listed rule that changes. The two rules for
  what the row holds directly are held to how a field flexes, from a basis that is a length.

## Sources

- Baymard Institute, [Form Field Usability: Avoid Extensive Multicolumn Layouts](https://baymard.com/research-articles/avoid-multi-column-forms),
  read 2026-11-23.
- Nielsen Norman Group, [Website Forms Usability: Top 10 Recommendations](https://www.nngroup.com/articles/web-form-design/),
  read 2026-11-23.
- GOV.UK Design System, [date input](https://design-system.service.gov.uk/components/date-input/)
  and [text input](https://design-system.service.gov.uk/components/text-input/), read 2026-11-23.
- Carbon Design System, [forms pattern](https://www.carbondesignsystem.com/building-blocks/core/patterns/forms),
  read 2026-11-23.
