# 26. A stepper is as tall as a field wherever it stands

**Status:** accepted in 0.9.4

## Context

Every button and field in the kit takes its height from one switch. Each is `--dk-field-height`
tall, 36 pixels, and a rule after it makes it `--dk-target` tall, 44 pixels, at 48rem wide or less,
in an app's frame, on a page that ends in a tab bar and in a dialog on either. A stepper stood
outside the switch. Its buttons and its value each set the target as their least height, after the
switch in the sheet, so a stepper was 44 pixels tall at every width.

On a phone and in an app that was level with everything beside it. On a page wider than 48rem it was
not. A `dk-fields` row lines its fields up along their foot, which record 25 settles, so at 1280
wide a stepper's label stood 8 pixels above the label of the text field beside it. A read-only
stepper shown alone took a field's height, so a stepper turned read only on such a page changed
height as well as losing its buttons, and an inline one kept the target by a rule of its own.

## Research

- **A pointer's target is measured both ways.** WCAG 2.2's success criterion 2.5.8, at level AA,
  asks for a target of at least 24 by 24 CSS pixels, and its understanding document measures it as a
  square of that size that fits inside the target, so a target wide enough and too short does not
  meet it by its size.
- **The larger target is the further level.** Success criterion 2.5.5, at level AAA, asks for 44 by
  44 CSS pixels. The kit holds its controls to it at 48rem wide or less and in an app, and to a
  field's 36 pixels on a wider page, which the accessibility notes say. The switch reads the
  page's width and not the pointer, so a wide screen pressed by a finger gets the field's height.

## Options

**A. Leave a stepper the target tall everywhere.** Rejected. The larger target on a wide page is
what a page asks for with a tall stepper. Without that, a stepper was the one control on the page 8
pixels taller than the rest, and every row that held one stood its labels out of line.

**B. The row lines its fields up by their labels.** The row would align its fields along their top,
or reach each field's control to set it level. Rejected. Lined up along their top, the labels stand
level and the controls do not, a stepper's foot 8 pixels under the field's beside it, and a label
that wraps moves its control down again, which the foot was chosen to prevent. Reaching a field's
parts from the row is what record 25 forbids, and it would mend the row only, leaving a stepper
taller than a button beside it everywhere else.

**C. The stepper sets a height of its own for a wide page.** A media query and the list of an app, a
tab bar page and their dialogs written again for the stepper. Rejected, as a second copy of the
switch that would have to follow the first every time it changes.

**D. The buttons as wide as they are tall.** On a wide page a button would be a square of the
field's height, 36 pixels, as a quiet Close is. Rejected. The stepper would change width at 48rem,
and a press would lose 8 pixels of width for nothing gained in the row.

**E. The stepper sets no height, so its parts take the switch.** A stepper's button is a button and
its value is a field. With the stepper's own least heights taken away, each takes the height the
switch gives every button and field.

## Decision

Option E. A stepper's buttons and its value set no height. On a page wider than 48rem, in a panel
and in a dialog there too, they are `--dk-field-height` tall, and at 48rem wide or less, in an app's
frame, on a page that ends in a tab bar and in a dialog on either, `--dk-target` tall, by the rules
every button and field take their height from. A tall stepper sets the larger target for its
buttons and its value, as before, at every width.

The buttons keep the target's width at both heights, 44 by 36 pixels on a wide page. The width does
not follow the height, for three reasons. The press area stays as generous as the height allows,
well over the 24 pixels criterion 2.5.8 asks each way. The stepper does not change width as a
window crosses 48rem. And a button 44 pixels wide stands nearer the width of the value between
them, 51 pixels for two figures, than a square of 36 would.

A stepper's button keeps no padding. A button's padding above and below its words keeps room for a
busy button's dots and for words that wrap, and a stepper's button is never busy and holds one
figure. With the padding, the figure's line stood the button 2 pixels over a field's height.

## Consequences

- On a page wider than 48rem outside an app's frame, a stepper is 8 pixels shorter than it was, and
  what follows it moves up by as much. The changelog says so under Upgrading. Nothing gives a
  stepper the target's 44 pixels there. A page that wants more asks for a tall stepper, 56 pixels
  with its value at the heading size.
- In a `dk-fields` row a stepper's label and its control stand level with those of the fields beside
  it at every width. A tall stepper stands its label above theirs, 20 pixels on a wide page and 12
  on a phone, as it did before, which is the page's choice.
- A read-only stepper is as tall as one that can be changed, on a wide page too, so turning a
  stepper read only changes its row and never its height. An inline stepper needs no rule of its own
  for its height.
- A stepper's value stands at a field's height only as a field, so markup written by hand keeps
  `dk-input` on the value, as the reference's markup does.
- A change to the switch, such as a new place that counts as an app, reaches the stepper with no
  rule of its own.

## How it is tested

The paths are in `packages/design-kit`.

- `e2e/stepper-height.spec.tsx`, in Chromium, WebKit and Firefox, draws a stepper beside a text
  field in a `dk-fields` row at 1280 wide and finds the stepper, its value and its buttons at the
  field's 36 pixels, the buttons 44 wide, and the two labels and controls level, on a page, in a
  panel and in a dialog. It finds them 44 pixels tall and level at 390 and at 768 wide, in an app's
  frame, on a page that ends in a tab bar and in a dialog on either at 1280. It finds a tall stepper
  56 pixels both ways at 390 and 1280, and an inline stepper, a read-only inline one and a read-only
  one at the height a field has at each width. Beside a select and beside a field with an action it
  finds the stepper as tall as the control at 1280 and 390, and level with it wherever the action's
  button has not moved under its control.
- `e2e/stepper.spec.tsx` finds a button the target wide, at the field's height at 1280 and the
  target's at 390, and a tall one at the larger target at both, a read-only value as tall as a
  read-only field on a page and in an app, and a value beside a button that keeps focus as tall as
  one that can be changed.

## Sources

- W3C, [Understanding Success Criterion 2.5.8: Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html),
  read 2026-11-23.
- W3C, [Understanding Success Criterion 2.5.5: Target Size (Enhanced)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html),
  read 2026-11-23.
