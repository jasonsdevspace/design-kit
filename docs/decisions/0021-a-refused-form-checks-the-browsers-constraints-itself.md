# 21. A refused form checks the browser's constraints itself

**Status:** accepted, amended in 0.9.1 for what a refusal and a reset say, in 0.9.3 for record 22's
teardown, which gives a form back its own `noValidate` once the last attach in it is taken down, and
in 0.9.4 for a stepper's own error, for one owner of a stepper's error, and for a stepper's letters
shown as focus leaves it and its words naming its field

## Context

`attachForm`, and `useFormRefusal` in React, refuse a submit: once a page has drawn its errors,
focus moves to a summary or the first field in error and one message is said on the status line.
The kit checked nothing itself, and the reference told a page to keep `required` for the browser's
own check. On a form without `noValidate` that check stops a submit with an empty required field
before the page's handler runs, so the kit never refused it, and the visitor got the browser's
bubble, with no error drawn, nothing marked invalid and nothing said. The kit's own tests passed
only because their forms carried `noValidate`, which the reference never named.

Turning the browser's check off fixes that, but it turns off every native constraint, a type's, a
pattern's and a range's as well as a required field's. A page that relied on them would then let
data the constraints refuse through with no message at all. So the question is where a form's
constraints are checked, and who draws the errors.

## Research

- **The bubble is not relied on for errors.** GOV.UK's validation pattern says to turn HTML5
  validation off with `novalidate`, since the bubble's look, placement and words cannot be made
  consistent. WCAG 2.2's Understanding text for 3.3.1, updated 2026-11-02, says native validation
  shows only the first error, in generic words, and that an author must consider whether it is
  accessibility supported. Its sufficient techniques are all errors the author draws. Adrian
  Roselli's tests, updated to May 2026, found fields said to be invalid on focus, patterns never
  explained and a bubble that does not grow with zoom.
- **No platform fix is near.** The WHATWG issue asking for an event that fires only when the
  browser reports a failure, apart from a quiet `checkValidity()` (whatwg/html#9878, opened
  2023-10-24), still awaits implementer interest. The CSS
  Working Group discussed styling validation messages (#7172) on 2025-07-10 with no resolution and
  handed the question to Open UI.
- **The constraints stay the source of truth.** Cloud Four's progressively enhanced validation
  (2023) and Wes Goulet's HTMHell article (2025-12-28) keep the native attributes, add
  `novalidate` from script and draw errors from the Constraint Validation API. Chrome's guidance on
  accessible errors notes the browser sets no `aria-invalid`, and that Firefox and Safari read an
  empty required field as invalid on load unless it is marked `aria-invalid="false"`.
- **The design systems split three ways.** GOV.UK Frontend and Primer's Rails forms drop native
  validation and check on the server. React Aria Components, whose `native` mode is its default, and
  Radix Form keep native validation as the truth, hide the bubble by canceling the `invalid` event,
  and map each `ValidityState` key to words an author can replace. Conform keeps the browser's check
  until its script loads, then sets `noValidate` and checks the same rules itself. Carbon, Fluent
  and Polaris only draw errors an app hands them.

## Options

**A. Leave the browser's check on.** Rejected. It stops the submit before the page's handler and
the kit, sets no `aria-invalid`, shows one error at a time in the browser's language rather than
the page's, and cannot be styled to match the kit's errors.

**B. Turn the check off and have each page check the constraints.** Rejected. Every page would
write the same loop over `validity` and its own words for each failure, and a page that left one
out would let data through with no message, which breaks the rule that a kit piece works as the
reference writes it.

**C. Keep the browser's check, cancel each `invalid` event and draw the kit's errors.** Rejected,
though React Aria and Radix work this way. The `invalid` event also fires when a page calls
`checkValidity()` for a quiet check of its own, and nothing tells the two apart, so the kit would
draw errors and move focus during it.

**D. Set `noValidate` from script and check the constraints in the kit on submit.** The kit's
errors as in C, decided in a submit listener of the kit's own rather than from the `invalid` event,
so a page's quiet `checkValidity()` draws nothing, as Conform does.

## Decision

Option D. The browser's constraints decide what is valid, and the kit draws the errors.

- **`noValidate` is set from script** on the form attached, or the form around an attached part of
  one, so a page without script keeps the browser's check, and the server stays the final word.
  The form keeps it while any attach in it is attached, and gets back its own, with the marks of
  fields not in error taken off, once the last is taken down, so a form the kit no longer checks
  is checked by the browser again.
- **The kit checks the whole form on submit, before the page's handler in the bubble phase,** in a
  capture listener on the form, one however many of its parts are attached, which takes the options
  of the form's own attach where there is one. It reads the `validity` of each of the form's fields,
  those tied to it from outside by `form` among them, counts a set once, a group of radios with no
  set around it as well, passes over a field marked off, which no one could put right, and where any
  field fails it stops the submit and its propagation, draws each error, and refuses. Where every
  field passes, the page's handler runs as ever, for checks the constraints cannot express, and
  refuses itself. A submitter marked `formnovalidate` is not checked, as the browser would not check
  it, and the errors the kit drew go.
- **Each failure takes words that say what to do,** in the manner of GOV.UK's errors, chosen in a
  fixed order where several apply: bad input, missing, wrong type, pattern, length, range, step,
  then the page's own from `setCustomValidity`. A field's own words for a failure come first, as
  `data-error-value-missing`, or its set's, then a map the page gives the form as `errorWords`,
  then the kit's.
  The browser's own words are never used, since they follow its language rather than the page's.
  A pattern cannot be put in words from the pattern, so the reference asks a field with one to
  give its own.
- **In plain markup the kit draws the error** as its field draws one: after the hint, above the
  control or under a set's legend, starting with a word a screen reader reads, described after the
  hint, and marked as the kit's set of choices marks one, a set of radios on its fieldset and a set
  of checkboxes on each box. An error the page already drew for the field takes the kit's words. A
  stepper is wrong where its field's `validity` says so, a blank only where the field is required.
  An attached stepper owns everything about its own error, for every failure it holds, a blank in a
  field that is required, letters, a value past the range and one off its step, at a change, as
  focus leaves it, at a submit and at a reset. Letters typed into a blank field leave its value
  blank and fire no `change`, so the stepper shows their error as focus leaves the field, while a
  blank that focus only passes through stays quiet. The words a stepper says of its own error as
  focus leaves it start with the field's name, as a refusal's do, since focus has moved on by then.
  A field's name, for the stepper and for a refusal, leaves out what its label or legend hides from
  a screen reader, such as a required mark. A press of the stepper's own button straight after
  letters is left to the press, read by the button being active as focus leaves the value, since
  Safari gives a pressed button no focus, so an error drawn above the field never moves the button
  from under the pointer. Reading where focus went was turned down, since Tab from the value lands
  on the stepper's own button, and letters left that way would go unreported. Letters in a field
  that is disabled or read only, or that shows an error of the page's, show no error, and focus that
  stays on the value, as a switch of window leaves it, reports nothing. A press on a control
  anywhere outside the stepper, as a Save button below it, one tied to the form from outside it, or
  a button beside a stepper in no form, holds back the error of a change or of letters until the
  press ends, read by the pressed element being active in the document, which every engine marks
  before the value's change and blur, for a mouse and for touch, since the error drawn above would
  move the control from under the pointer and its click, and the submit it makes, would be lost. The
  stepper checks again on a short timer until nothing outside it is active, so its click and a
  refusal it brings have run by then, and a refusal that settled the stepper meanwhile leaves
  nothing more for it to draw or say. A release the form would not hear, as one dragged off the
  form, still ends the wait, and so does a press that turns into a drag, by a dragstart listener on
  the document held only for the wait, since Firefox leaves a dragged link active after the drop. No
  timeout ends the wait sooner, so a visitor who lets go slowly keeps the click, as WCAG 2.5.2 asks.
  A listener on the form for the click or the release was turned down, since a press dragged off and
  let go outside the form reaches no listener there. The stepper's submit listener on the document
  was turned down below because it heard every submit and kept a removed stepper alive, while the
  query of what is active is no listener and hears nothing, and the dragstart listener is taken away
  as the wait ends and with the stepper. Reading where focus went was turned down too, since Safari
  gives a pressed button no focus. The form never draws on an attached stepper and never marks it.
  At a submit the form tells each stepper that fails to show its error, and then refuses, so the
  stepper's error is the one error, in plain markup and in React, and its failure is left out of the
  failures `invalid` is handed first. React owns the page's error nodes, as record 20 has it, so the
  stepper's failure stays away from the page entirely. A stepper in which the page shows an error of
  its own leaves that failure to the form, as any field's, so the page is handed it and its words
  are never shown beside the stepper's. A stepper whose error clears puts its mark back to
  `aria-invalid="false"` where the kit checks its form, read as the error clears, as the form marks
  every field not in error, and takes it away elsewhere. Taken down once its field has left the
  page, it has every checked form the field stood in let go of it and takes its mark away, whoever
  set it, so a stepper drawn again and again in one form, as one keyed by a round, leaves none of
  its fields held. A field still in the page keeps its mark until its form is let go, as every field
  does, so a stepper taken down and attached again, as a page's effect that runs again does, keeps
  its mark, and one taken down before its form loses it with the form. Letting go of the field at
  every takedown was turned down, since a stepper attached again would lose its mark while the form
  still checks every other field, and letting go of the field without taking its mark away left a
  stepper taken down before its form with its mark once both are down. A second list,
  `invalid(failures, shown)`, holds every failure in the form's order with the words its field
  shows, the form's words for a failure in the first list and the stepper's own error's words for
  one left out of it, so a summary built from it lists the stepper. Handing the stepper's failure in
  the first list with a mark that it is drawn already was turned down, since every page that draws
  all its failures would have to filter them. As the form refuses, it has each stepper that fails
  take its own waiting words back, so the refusal is the one message. Other ways were turned down. A
  form that kept its verdict for its steppers to read made two owners of one error. So did a form
  that owned the error after a submit, which the stepper took away on a change through an undo it
  was handed: in React the page owns its error nodes, which an undo of the kit's cannot take away,
  and `aria-invalid` would have two writers. Writing the form's words into the stepper's range error
  was turned down too, since React owns that element's children, and record 20's `NotFoundError`
  follows a write into them. A submit listener of the stepper's on the document heard every submit,
  so it took back words no refusal would say, and it kept a removed stepper alive. The kit puts back
  what it changed once the field passes on a later checked submit, or the form is reset, and only
  what still holds the kit's change. **In React the failures go to `invalid`,** which the hook asks
  for, since the markup belongs to the page's state, and the hook refuses after the render that
  draws them.
- **A refusal says the field it leaves focus on,** its name and its error, with how many fields need
  attention where more are wrong, nothing where focus moves to an error summary, which reads its own
  words, and the first field's name and error where focus was already on the summary, which a screen
  reader does not read again, or the summary's text, its spaces collapsed, where no field is marked,
  as for an error the page draws only in the summary. Reading the summary's own words where a field
  is marked was turned down, since its markup is the page's and each shape of it, nested lists,
  hidden items and text outside a list, needed a rule of its own. Moving focus off the summary and
  back was turned down too, since VoiceOver on iOS does not reliably follow focus moved by script. A
  device check with VoiceOver on an iPhone heard no error where the kit left it to the field's
  description, which iOS reads only as a hint, and focus moved by script may not land.
- **A field in error that cannot take focus is named,** as one out of sight or marked off, so the
  refusal says which field it is and what is wrong with it.
- **A reset after a refusal says so,** as "Form cleared.", where the form has refused since its last
  reset or passing submit, whoever drew the errors, the kit, a stepper or the page, and the page has
  not called the reset off. A reset with no refusal standing says nothing, a stepper's error shown
  as focus left it among them. Counting the fields marked invalid as the reset fired and once it was
  done was turned down: a page's reset listener that ran first, or a capture listener on the
  document, took the marks away before the count, and a field that gained a mark as another lost one
  kept the count level. Once the kit's errors are gone, the form has each attached stepper settle on
  its reset value, so an error of the kit's never holds back the stepper's own. A stepper settles in
  its own reset timer, and again from the form's reset timer once the kit's errors are gone. A reset
  that takes no error away says nothing.
- **Fields not in error are marked `aria-invalid="false"`** as the form is attached, so an empty
  required field is not read as invalid before anything is submitted. Only the fields drawn by then
  are marked, and in React a field whose error clears loses its mark. `required` stays, since the
  kit's check reads it and it tells a screen reader a field is required where a form marks its
  optional fields.
- **Errors appear only on a submit,** never as a field is left or typed in, since GOV.UK and the
  kit's own guidance check on submit, and the kit styles errors by `aria-invalid` rather than by
  `:user-invalid`.

## Consequences

- A form works as the reference writes it: its constraints are kept without any code of the
  page's, and its errors match the kit's in look, place, words and language.
- The controls carry the words and the check, and record 13 raises their budget by its rule.
- A stepper's failure whose own error shows is not in the first list `invalid` is handed, so that
  list can be empty on a refused submit, and a page reads the refusal for whether the form passed. A
  summary built from it would leave the stepper out, with nothing said for it, so a page builds one
  from the second list.
- A page's words for each failure, `errorWords` and `data-error-*`, do not reach an attached stepper
  with a range error, since the stepper's error is the one shown for every failure it holds.
  `rangeError` on `StepperField`, or the range error's own words in the markup, is the way in.
- An error the kit drew on a stepper for a page's own refusal, set with `setCustomValidity`, stays
  beside a range error typed after it until the next submit, which takes it away.
- A stepper that fails a page's own refusal, set with `setCustomValidity`, and its range at once
  shows its range error alone, and the page's words show at the next submit once the value is in
  range, since one error shows at a time and a value the field cannot hold comes first.
- `attachForm` keeps a submit and a reset listener on its form, one of each however many of its
  parts are attached, which leave with the form, where it kept none.
- A screen reader that reads a field's error as focus lands on it hears the error twice, which slows
  a visitor less than an error never heard.
- A page that fills a field from script gets no length check on it, since the browser counts
  length only after a visitor's edit, so its own handler checks that.
- A page that already handles the browser's check itself sees no bubble now, and its own handler
  runs only once the constraints pass.
- A check of the page's own, such as two fields that must match, is drawn only once the constraints
  pass, so a visitor can meet its error on a second submit, unless the page sets it with
  `setCustomValidity` as the field changes.
- Attaching a part of a form checks the whole of it, since the browser's check is off for the whole
  of it.

## How it is tested

The paths are in `packages/design-kit`.

- `e2e/checked.spec.tsx` refuses a form with an empty required field and a malformed address before
  the page's handler, draws each error and says the first field's name and error with the count,
  takes errors away once their fields pass and lets the page handle a submit that passes, submits
  unchecked from a button marked `formnovalidate`, takes each failure's words from the field, its
  set, the page's map and the kit in turn, a pattern's among them, draws an error after its hint,
  names a field no one can reach, lets a field marked off pass, counts a group of radios with no set
  once and a box alone in a section as its own field, gives the page's own error the kit's words and
  puts it back, gives fields with no id errors of their own, checks the whole form where a part is
  attached and a field tied to it from outside, takes errors away on a reset, leaves a stepper's
  range error as the one error, drawn, described and said once for a value typed past its range and
  submitted by Enter or a press on the button, in plain markup and in React, refuses on the one
  press of a Save button below a stepper typed past its range, pressed and let go by a pointer, and
  on one tap of it in Chromium and WebKit, and on one press of a Save button outside the form tied
  to it, keeps the click of a button below that submits nothing and of one beside a stepper in no
  form, shows the error once a press on a link below turns into a drag, takes away an error put
  right before a press on Save and saves, in plain markup and in React, shows a stepper's error for
  letters left by Tab and says it once after the field's name, names a field without the mark its
  label hides, shows one error and says one message where the form is submitted right after the
  letters, by Enter or a press on the button, in plain markup and in React, saves a stepper left
  blank that is not required, gives a required one drawn blank and never touched its own error, past
  the page's words, with the page handed nothing for it, shows one error once a value past its range
  is typed after that, marks the stepper `aria-invalid="false"` as its error clears by a value put
  right or a reset in a checked form, and with no mark outside one, says "Form cleared." once on a
  reset that takes a stepper's error away, in plain markup and in React, nothing on a reset with
  none showing, keeps a stepper's error through a reset the page calls off, takes away an error the
  kit drew on a stepper once its own error shows, says "Form cleared." for a field tied to the form
  from outside, for one the page marked invalid, for a page whose own reset listener clears its
  errors first, for a page that clears its errors with a stepper drawn past its range, and for a
  refusal only a stepper made and put right since, says nothing on a reset after a stepper showed
  its error as focus left it with no submit, or after a submit that passed, leaves a required
  stepper's failure to the form where the page shows an error of its own, shows a stepper's range
  error on a reset that brings back a value past its range over the kit's error, and takes away the
  mark a stepper put back once its form's attach is taken down, and the mark of a stepper taken down
  before its form once both are down, holds none of the fields of a stepper drawn again and again in
  one form once each has left the page, keeps the mark of a stepper taken down and attached again on
  the same value, lets go of a stepper the form marked itself and of one moved between two checked
  forms once it leaves the page, leaves the mark a later check of its form set on a stepper that
  outlived the first, shows a stepper's range error alone where it fails the page's own refusal too
  and the page's words once it is in range, leaves a stepper's own words said where no refusal
  follows, marks fields not in error before any submit, and in React hands the failures, a set's
  among them, to the page, which draws them, and refuses once they are drawn. It hands every failure
  with the words its field shows as a second list, a stepper's own error's words among them, in
  plain markup and in React, where a summary built from it lists the stepper with its own words and
  takes focus, and has the first field's name and error said once it already has focus. It runs in
  Chromium, WebKit and Firefox.
- `e2e/stepper.spec.tsx` leaves letters typed into a blank stepper by Tab and finds its error drawn,
  the field marked invalid and the error said once, passes a blank required field by Tab and finds
  nothing, takes a press on its own button straight after letters with no error drawn in between,
  finds no error for letters as focus stays, as the field turns read only or beside the page's own
  error, leaves a hidden required mark out of the name it says, and finds the field's name before
  the error on the status line as focus leaves a value past the range, while a press says the value
  alone. It runs in Chromium, WebKit and Firefox.
- `e2e/form.spec.tsx` refuses a form the page wrote without `noValidate`, passes over controls
  marked off and a summary hidden by an ancestor or a style, made inert or not focusable, says a
  focused summary's line where no field is marked, names a set none of whose controls can take
  focus, says the name and error of a field focus moves to or was already on, a set's where its
  choice does not read the error, and a field's name with the count where it is marked in error with
  none drawn, and says nothing after a reset with no refusal standing and "Form cleared." after one
  that follows a refusal, the page's own among them.
- `e2e/teardown.spec.tsx` takes a form's check down by its signal with a refusal and a reset still
  due and finds nothing said after, its errors, marks and `noValidate` as the markup drew them, and
  the check kept until the last attach in the form is taken down. It finds nothing drawn through
  what a form or a part of one given a signal already aborted returns.
- `smoke/types.ts` types the failures, the words and the options, and refuses a failure misnamed.
- `scripts/controls.test.ts` holds the controls to the budget record 13 sets.

## Sources

- GOV.UK Design System, [validation pattern](https://design-system.service.gov.uk/patterns/validation/)
  and [error summary](https://design-system.service.gov.uk/components/error-summary/), read
  2026-11-19.
- W3C, [Understanding WCAG 2.2: Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification),
  updated 2026-11-02.
- Adrian Roselli, [Avoid Default Field Validation](https://adrianroselli.com/2019/02/avoid-default-field-validation.html),
  2019, updated May 2026.
- Cloud Four, [Progressively Enhanced Form Validation, part 2](https://cloudfour.com/thinks/progressively-enhanced-form-validation-part-2-layering-in-javascript/)
  and [part 4](https://cloudfour.com/thinks/progressively-enhanced-form-validation-part-4-custom-validation-messages/), 2023.
- Wes Goulet, [HTML Input Validation is (maybe) Good](https://htmhell.dev/adventcalendar/2025/28/),
  2025-12-28.
- Chrome for Developers, [accessible error announcement](https://developer.chrome.com/docs/modern-web-guidance/guides/accessibility/accessible-error-announcement),
  read 2026-11-19.
- WHATWG, [HTML constraint validation](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constraint-validation)
  and [issue 9878](https://github.com/whatwg/html/issues/9878), read 2026-11-19.
- CSS Working Group, [minutes of 2025-07-10 on #7172](https://lists.w3.org/Archives/Public/public-css-archive/2025Jul/0291.html).
- React Aria, [forms](https://react-aria.adobe.com/forms), and
  [useFormValidation](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/form/useFormValidation.ts),
  React Aria Components 1.22.0, read 2026-11-19.
- Radix, [Form](https://www.radix-ui.com/primitives/docs/components/form), 0.3.0.
- Conform, [getFormProps](https://github.com/edmundhung/conform/blob/main/docs/api/react/getFormProps.md),
  1.21.3.
- Primer, [forms pattern](https://primer.style/product/ui-patterns/forms/), read 2026-11-19.
