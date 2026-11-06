# 6. A control's state is an attribute, and its rules weigh nothing

**Status:** accepted

## Context

The kit adds buttons, text fields and selects to the page chrome. A button can be a toggle that is
on or off, the button of a panel that is open, or off for a while, such as Previous on the first
page of results. A field can hold an error. Each state needs a look, and a screen reader has to hear
the same state the eye sees. The kit's sheets allow a selector to be a bare class of the kit's or
one `:where()` followed at most by a focus pseudo-class, as record 2 sets out, so any state written
as an attribute selector sits in `:where()` and weighs nothing. A button that is off for a while has
to stay where the keyboard can reach it, so a visitor can find out why it is off.

## Options

**A. A class for each state.** `.dk-button-pressed`, `.dk-button-off` and `.dk-field-invalid`, each
a bare class the scope rule allows. Rejected, since the class and the attribute a screen reader
reads are then two things a page has to keep in step. A page that sets `aria-pressed` and forgets
the class draws one state and announces another, and nothing fails.

**B. The native and ARIA attributes, with `disabled` for off.** The sheet draws `aria-pressed`,
`aria-expanded`, `aria-invalid` and `disabled`. Rejected for the off state, since a disabled button
leaves the tab order, and one that has focus when it is disabled drops it, so the keyboard loses its
place and never reaches the button to learn why it is off.

**C. The native and ARIA attributes, with `aria-disabled` for off, and every rule in `:where()`.**
The sheet draws `aria-pressed="true"`, `aria-expanded="true"`, `aria-invalid="true"` and
`aria-disabled="true"`, with `disabled` drawn the same as `aria-disabled`. The resting look of each
piece sits in one `:where()` too, so no rule for a button, a field or a callout carries any weight.

## Decision

Option C. `Button` writes `aria-pressed` when `pressed` is given, `false` included, so a toggle is
announced as a toggle in both states, and writes nothing when it is undefined, so the button is an
action. `off` writes `aria-disabled="true"`, never `disabled`, and puts a click handler that calls
`preventDefault()` and nothing else in place of the page's, which also stops a form's submit.
`InputField` and `SelectField` write `aria-invalid="true"` only while an error is drawn. The accent
is a class, `dk-button-accent`, since it is a kind of button rather than a state.

The resting look sits in `:where()` because a bare `.dk-button` would weigh a class, and outweigh
every state written in `:where()` after it, so pressed and off would never show. With every rule at
no weight, a state wins by its order in the sheet: at rest, pointed at, the accent, pressed, invalid
and off, last of all, so off wins over the accent and over pressed.

## Consequences

- `aria-disabled` does nothing by itself. The component stops the press, but a page that writes the
  markup by hand has to make its own click handler check `aria-disabled`, and a page that forgets
  has a button that looks off and still acts.
- `Button` takes no `disabled` prop, so a React page that wants a button out of the tab order writes
  the `<button>` itself. The sheet draws `disabled`, and a button in a disabled fieldset, the same
  as off.
- A new state goes into the sheet at its place in the order, since the order is all that decides
  which state wins.
- A page's own rule outside a layer wins over every state as well as the resting look, so a page
  that sets a button's ground with a plain `.dk-button` rule sets it for pressed and off too, and
  writes its own rule for each state it wants to keep.
- Only the page chrome, which has no state but focus, styles a bare class of the kit's. A new piece
  with states writes its resting look in `:where()` too, or the scope test fails.

## How it is tested

The paths are in `packages/design-kit`.

- `src/react.test.tsx` holds `Button` to `type="button"` unless a page gives another,
  `dk-button-accent` with a page's class after it, `aria-pressed` as `true`, as `false` and absent,
  `aria-disabled="true"` and no `disabled` when off, and an off press that calls `preventDefault()`
  and not the page's `onClick`. It holds a field to `aria-invalid` only with an error, and the types
  to refusing `style`, and `accent` with `pressed`.
- `e2e/controls.spec.tsx` draws every state with the kit's sheets in Chromium. The keyboard reaches
  an off button and skips a disabled one, the two are drawn alike, and the off button's words are in
  the muted text, which they would not be if the resting look outweighed the state. A button in a
  disabled fieldset is drawn as off. A pointer turns a button's edge to the accent, underlines the
  accent button's words and leaves an off button as it is. A pressed toggle has an inset edge on the
  highlight and an unpressed one none, an invalid control's edge is in the danger color, and in
  forced colors pressed differs from unpressed and off matches disabled.
- `src/scope.test.ts` holds every selector in `components.css` to a kit class alone or one
  `:where()` followed at most by a focus pseudo-class, and allows a bare class only for the page
  chrome, so every rule for a button, a field or a callout sits in `:where()`.
- `smoke/types.ts` fails to compile `accent` with `pressed` against the packed package, as Node and
  as a bundler resolve it.
