# 21. A refused form checks the browser's constraints itself

**Status:** accepted

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

The research was done on 2026-11-19, from the standards, accessibility practice and the design
systems below.

- **The bubble is not relied on for errors.** GOV.UK's validation pattern says to turn HTML5
  validation off with `novalidate`, since the bubble's look, placement and words cannot be made
  consistent. WCAG 2.2's Understanding text for 3.3.1, updated 2026-11-02, says native validation
  shows only the first error, in generic words, and that an author must consider whether it is
  accessibility supported. Its sufficient techniques are all errors the author draws. Adrian
  Roselli's tests, updated to May 2026, found fields said to be invalid on focus, patterns never
  explained and a bubble that does not grow with zoom.
- **No platform fix is near.** The WHATWG issue asking for an event that fires only on a check a
  visitor started (whatwg/html#9878, opened 2023-10-24) still awaits implementer interest. The CSS
  Working Group discussed styling validation messages (#7172) on 2025-07-10 with no resolution and
  handed the question to Open UI.
- **The constraints stay the source of truth.** Cloud Four's progressively enhanced validation
  (2023) and Wes Goulet's HTMHell article (2025-12-28) keep the native attributes, add
  `novalidate` from script and draw errors from the Constraint Validation API. Chrome's guidance on
  accessible errors notes the browser sets no `aria-invalid`, and that Firefox and Safari read an
  empty required field as invalid on load unless it is marked `aria-invalid="false"`.
- **The design systems split three ways.** GOV.UK Frontend and Primer's Rails forms drop native
  validation and check on the server. React Aria, whose `native` mode is its default, and Radix
  Form keep native validation as the truth, hide the bubble by canceling the `invalid` event, and
  map each `ValidityState` key to words an author can replace. Conform keeps the browser's check
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
draw errors and move focus during it. A form the browser refuses never reaches the page's submit
handler either, so a page could not add an error the constraints cannot express to the same
refusal.

**D. Set `noValidate` from script and check the constraints in the kit on submit.** The same
outcome as C, with the order of B, as Conform has it.

## Decision

Option D. The browser's constraints decide what is valid, and the kit draws the errors.

- **`noValidate` is set from script** on the form attached, or the form around an attached part of
  one, so a page without script keeps the browser's check, and the server stays the final word.
- **The kit checks on submit, before the page's handler,** in a capture listener on the form. It
  reads each field's `validity`, counts a set once, and where any field fails it stops the submit
  and its propagation, draws each error, and refuses. Where every field passes, the page's handler
  runs as ever, for checks the constraints cannot express, and refuses itself. A submitter marked
  `formnovalidate` is not checked, as the browser would not check it.
- **Each failure takes words that say what to do,** in the manner of GOV.UK's errors, chosen in a
  fixed order where several apply: bad input, missing, wrong type, pattern, length, range, step,
  then the page's own from `setCustomValidity`. A field's own words for a failure come first, as
  `data-error-value-missing`, then a map the page gives the form as `errorWords`, then the kit's.
  The browser's own words are never used, since they follow its language rather than the page's.
  A pattern cannot be put in words from the pattern, so the reference asks a field with one to
  give its own.
- **In plain markup the kit draws the error** as its field draws one, above the control or under a
  set's legend, starting with a word a screen reader reads, tied to the control and marking it
  invalid, and takes it away once the field passes on a later submit. **In React the failures go
  to `invalid`,** since the markup belongs to the page's state, and the hook refuses after the
  render that draws them.
- **Fields not in error are marked `aria-invalid="false"`** as the form is attached, so an empty
  required field is not read as invalid before anything is submitted. `required` stays, since the
  kit's check reads it and it tells a screen reader a field is required where a form marks its
  optional fields.
- **Errors appear only on a submit,** never as a field is left or typed in, since GOV.UK and the
  kit's own guidance check on submit, and the kit styles errors by `aria-invalid` rather than by
  `:user-invalid`.

## Consequences

- A form works as the reference writes it: its constraints are kept without any code of the
  page's, and its errors match the kit's in look, place, words and language.
- The controls carry the words and the check, and record 13 raises their budget by its rule.
- `attachForm` keeps one listener on its form, which leaves with the form, where it kept none.
- A page that fills a field from script gets no length check on it, since the browser counts
  length only after a visitor's edit, so its own handler checks that.
- A page that already handles the browser's check itself sees no bubble now, and its own handler
  runs only once the constraints pass.

## How it is tested

The paths are in `packages/design-kit`.

- `e2e/checked.spec.tsx` refuses a form with an empty required field and a malformed address
  before the page's handler, draws each error and says the count, takes errors away once their
  fields pass and lets the page handle a submit that passes, submits unchecked from a button
  marked `formnovalidate`, takes each failure's words from the field, the page's map and the kit
  in turn, marks fields not in error before any submit, and in React hands the failures to the
  page, which draws them, and refuses once they are drawn. It runs in Chromium, WebKit and Firefox.
- `e2e/form.spec.tsx` refuses a form the page wrote without `noValidate`, and passes over controls
  marked off.
- `smoke/types.ts` types the failures, the words and the options, and refuses a failure misnamed.

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
- Wes Goulet, [HTMHell advent calendar, day 28](https://htmhell.dev/adventcalendar/2025/28/),
  2025-12-28.
- Chrome for Developers, [accessible error announcement](https://developer.chrome.com/docs/modern-web-guidance/guides/accessibility/accessible-error-announcement),
  read 2026-11-19.
- WHATWG, [HTML constraint validation](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constraint-validation)
  and [issue 9878](https://github.com/whatwg/html/issues/9878).
- CSS Working Group, [minutes of 2025-07-10 on #7172](https://lists.w3.org/Archives/Public/public-css-archive/2025Jul/0291.html).
- React Aria, [forms](https://react-aria.adobe.com/forms), and
  [useFormValidation](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/form/useFormValidation.ts),
  release of October 2026.
- Radix, [Form](https://www.radix-ui.com/primitives/docs/components/form), 0.3.0.
- Conform, [getFormProps](https://github.com/edmundhung/conform/blob/main/docs/api/react/getFormProps.md),
  1.21.3.
- Primer, [forms pattern](https://primer.style/product/ui-patterns/forms/), read 2026-11-19.
