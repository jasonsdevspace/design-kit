# 28. A read-only value of words is a textarea the kit sizes to its value

**Status:** accepted in 0.9.4

## Context

A read-only field was an `<input readonly>`, which draws one line and cannot wrap. At 320 wide with
twice the text size and the wider text spacing WCAG 1.4.12 names, "Round 3 of 10" ran past its
field in a content page and was cut off, with nothing to say more followed, by an amount that
depended on the typeface. A read-only value is there to be read, and a visitor cannot scroll it into
view as they can a field they type in. A read-only select drew its chosen option's words in the
same input, so a long option was cut off the same way.

`readOnly` on a field means two things in the kit. A value fixed for the page, such as a saved
round, is read only for good. A field held for a moment while it saves is read only until the save
ends, and the reference has it so because `aria-disabled` does not stop typing. A fix for the first
must leave the second where it stands, its height and its place in the page unchanged as it turns.

## Options

- **A. A piece of its own, `ValueField`, a read-only textarea with `dk-value`, one row, which the
  kit sizes to its value.** A textarea wraps, and `field-sizing: content` makes it as tall as its
  words. Its block padding centers one line in a field's height, the target's on a phone and in an
  app's frame, so a value of one line stands level with a read-only field beside it. A read-only
  `SelectField` draws its words in the same element. Nothing a page draws already changes, and the
  class names the piece rather than a state.
- **B. The read-only input kept, with the reference saying what a page writes for a long value.**
  Rejected, since the kit's own example was cut off at that size, and a piece that needs the page to
  know which of its values may run long does not work without the page's care.
- **C. A selector keyed on `[readonly]` that sizes every read-only textarea to its value.**
  Rejected, since a note held read only while it saves is a textarea with `readonly` too. A note of
  three rows holding a line of words dropped from 90 to 36 pixels tall as it turned, and back as the
  save ended, so everything under it moved twice.
- **D. A selector keyed on `[rows='1']`.** Rejected, since `rows` already says how tall a textarea
  is, and a page that writes a one-row note to grow by its own script would find the kit sizing it
  too.

## Decision

Option A. A value of words a visitor reads but cannot change is a `ValueField`, or the textarea it
draws, `<textarea class="dk-textarea dk-value" rows="1" readonly>`, in a field. It is read only for
the page, with no `readOnly` to turn off. A read-only `InputField` stays for a short figure and for
a field held read only for a moment, and a read-only `TextareaField` keeps its rows. The value's
padding sits outside `@supports`, so a browser without `field-sizing` draws it one field tall from
its one row, and the rule that sizes it and takes away the resize handle sits inside. A value in a
`dk-field-action` row takes the room the button leaves, as an input does, so a read-only select
with an action keeps its row.

## Consequences

- The sheets grow by about a hundred bytes, which left less room under their budget than one more
  piece of the usual size, so record 13's rule set it again, as its table gives.
- Firefox before 152 and Safari before 26.2 cannot size a field to its content. There a value is
  one field tall, and a long one scrolls inside it and can be dragged taller by the browser's
  handle. The accessibility notes say so.
- A read-only select draws a textarea in place of an input, so Enter in it does not submit its form
  as Enter in a field of one line does, and a page's own rule for its `dk-input` does not reach it.
  The change file says so under Upgrading.
- A screen reader may call a value a text area or a field of many lines, where it calls a read-only
  input a text field. Its label, its place in the tab order, its words that can be copied and its
  role of a text box are as before.
- A value stands at a field's height beside a read-only field and a read-only stepper, as
  [record 26](0026-a-stepper-is-as-tall-as-a-field-wherever-it-stands.md) has a stepper stand
  beside a field, from the same `--dk-field-height` and `--dk-target`.

## How it is tested

The paths are in `packages/design-kit`. `e2e/readonly.spec.tsx` runs in Chromium, WebKit and
Firefox, each of which sizes the value by `field-sizing` in the versions the tests use.

1. A note of three rows keeps its height as it turns read only.
2. A short value and a read-only field side by side stand at one height, with the value's first
   line within a pixel of the middle of the field's, at 1280 and 390 wide and in an app's frame, at
   the usual text size and at twice it under wider spacing.
3. A long value, and a read-only select whose chosen option's words are long, grow to show whole at
   320 wide with twice the text size and wider spacing, taller than a field, with the select's
   hidden field still sending its value.
4. With `field-sizing: fixed` written outside the kit's layers, as a browser without it draws, a
   value is as tall as a read-only field.

The same spec fills a value's field, keeps a button's place beside a read-only select and under it
on a narrow screen as beside a read-only input, and draws the read-only look, its error edge and
its forced colors on a value and on a field alike. `e2e/stepper.spec.tsx` lines a read-only
stepper's figures up with a read-only field's words and a value's.
