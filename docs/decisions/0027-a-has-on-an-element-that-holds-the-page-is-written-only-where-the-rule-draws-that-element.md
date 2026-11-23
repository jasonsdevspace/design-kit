# 27. A `:has()` on an element that holds the page is written only where the rule draws that element

**Status:** accepted in 0.9.4. It amends record 13, whose room under a toast in a frame is told by a
mark as an empty callout is, record 15, for what `attachToast` writes, and record 22, for what its
takedown takes away

## Context

Three families of rules told what a page holds by a `:has()` on an element that holds the page, and
drew something inside that element:

- The body's padding under a shown toast on a page with no frame,
  `:root:has(.dk-toast[data-shown])... > body`.
- The room an app's frame keeps in its body under a shown toast,
  `.dk-app:has(.dk-toast[data-shown])... > .dk-app-body` and the last element inside it.
- The phone's sizes a dialog takes on a page that holds a frame or ends in a tab bar,
  `:root:has(:is(.dk-app, .dk-tabbar-page)) .dk-dialog`, in the lists of an app's places, the rule
  for a dialog's actions and the tokens' rule for the insets.

Chromium answers a `:has()` whose rule draws anything but the element it is written on by
restyling everything inside that element, for every element or word added or taken away anywhere in
it. Measured in Chromium 158 on a page of about 2,300 elements, as the time the browser spends
recalculating style for one change, the median of five runs of twenty, and as the elements one
change restyles, read from the browser's trace:

| Change                      | Main    | Main at 4x slower | Elements restyled | With this record | At 4x slower | Elements restyled |
| --------------------------- | ------- | ----------------- | ----------------- | ---------------- | ------------ | ----------------- |
| An element added            | 12.2 ms | 52.4 ms           | all of them       | 0.14 ms          | 0.60 ms      | 10                |
| Words said on a status line | 6.1 ms  | 26.1 ms           | all of them       | 0.06 ms          | 0.26 ms      | none              |

The figures are a content page's, and those of a frame and of a page that ends in a tab bar are
close to them. Each family cost a page by itself:

- The page toast's rules cost every page, since every page has a body, whether or not it holds a
  toast.
- The frame's rules cost every change on every page with a frame, about 12 ms, whether or not a
  toast was ever shown.
- The dialog's rules cost a page that holds a `.dk-dialog`, open or closed, about 12.6 ms a change,
  and nothing on a page with none.

Showing a toast restyled the whole page twice, on a content page and in a frame alike, and
dismissing it once. WebKit and Firefox restyle only what a change touches under the same rules, so
Chromium alone was affected. Firefox 120, the floor, has no `:has()`, so there none of this room was
kept at all.

What Chromium punishes is the shape of the rule, not the `:has()`. The page toast's rule with a
class as its subject in place of `body` cost 0.12 ms, and the same rule ending `> body` cost 12 ms.

## Options

**The page toast.**

- **A. The body is the subject of its own `:has()`**, `body:has(.dk-toast[data-shown])...`, and the
  root keeps the rule that sets what scrolling stops short of, whose subject it already is.
- **B. The root sets a custom property the body reads.** Rejected, since `padding-bottom` read from
  a property on a plain `body` rule overrides a page's own body padding in an earlier layer at all
  times, where the rule on main does so only while a toast shows, and since it declares a property
  outside the tokens.
- **C. The padding goes on the root.** Rejected, since a body with `min-height: 100dvh` then scrolls
  where it did not.

**The frame's toast.**

- **A. The toast's attach function marks the frame's body with the rows it measured, and the sheet
  reads the mark**, as it reads `data-empty` on a live callout. A picture of a frame, which no
  script attaches, keeps a `:has()` on the pictured frame alone.
- **B. The body is the subject of a sibling `:has()`**,
  `.dk-app-body:has(~ .dk-app-toast > .dk-toast[data-shown])`, with the last element as before.
  Rejected, since it cost 11.9 ms a change: the body still holds what changed.
- **C. The body is the subject and its own padding is the room.** It restyles nothing whole and
  needs no script. Rejected, since the later rule for a frame with no dock sets the body's
  `padding-bottom` and would take the room away unless five more rules followed it, an unmeasured
  toast on a short screen can grow the body past its row, which is why the room is the last
  element's margin, and it rests on Firefox 120 and Safari 17.5 counting a scroll container's end
  padding as room to scroll, which was not measured. Either browser shown to do so would reopen it.
- **D. The mark alone, with no rule for a picture.** Rejected, since every picture of a frame with
  a toast would draw the toast over the body's last lines until its markup wrote the mark.

**The dialog.**

- **A. A dialog is on an app's page where it sits inside a frame, or a page that ends in a tab bar,
  or beside one as a sibling before or after it**, a picture of either aside, with no `:has()` on
  the root.
- **B. `attachDialog` marks the dialog.** Rejected, since a page may open a dialog itself, which
  record 13 allows, and a mark written at the attach goes stale where a frame arrives after it.
- **C. The root sets working values the pieces read.** Rejected, since each of the seven rules has a
  resting value of its own at its own place in the sheet's order, and pointing the tokens anew does
  not draw what main draws for a choice's and a theme switch's least width, a linked pill or a tab.
- **D. The rule stays, with a class as each subject.** Rejected, since Chromium would then restyle
  every button, field and choice on the page for each change.

## Decision

Option A for each. The rule that follows from them: a `:has()` on the root, the body, an app's
frame or a page that ends in a tab bar is written only where that element is the rule's subject. A
rule that has to draw something inside one of them reads a mark the kit's script writes on the
element it draws, or is told by where the piece sits. A picture of a frame is the one exception: it
is inert, holds a few elements, and no script attaches it, so its room is told by the shown toast it
holds.

`attachToast` writes `data-toast-rows` on the body of the frame its toast sits in while the toast
floats over that body: the rows it measured the toast at, from one to five, or nothing for a toast
it could not measure, which keeps the two rows a toast with no count does. It writes each attribute
only where the value changes, so measuring a toast that has not changed restyles nothing. The mark
comes off where the toast takes its row above the dock, as it is dismissed, before focus is handed
back, and from a body the toast has left for another frame. It comes off the element that carries
it, which the attach keeps, rather than one found again.

## Consequences

- A change to a page restyles what it touches. An element added restyles 10 to 12 elements where it
  restyled every one, on a content page, a content page with a dialog, a frame, a frame with an open
  dialog and a page that ends in a tab bar.
- Showing a toast restyles the whole page once where it did twice: the root's own rule on a content
  page, and the mark being written in a frame. Dismissing one restyles it once, as before.
- A shown toast written by hand in a live frame, with `data-shown` and no attach, keeps no room in
  the body until the page writes `data-toast-rows` on the frame's body too, with the toast's
  `data-rows` or empty. A toast shown by `attachToast` or the `Toast` a page attaches needs nothing.
- A dialog set apart from its frame, such as one inside a wrapper element that is not the frame's
  sibling, draws at a content page's sizes from 48rem wide: controls at the field's height, the
  wider inset and its actions at its end. Written inside the frame, or straight before or after it,
  it draws as before. At 48rem wide or less nothing changes.
- A change inside an open dialog beside a frame restyles that dialog, 259 elements in the bench's
  dialog of forty fields, since the dialog's own `:has()` reads its siblings.
- A picture of a frame with a shown toast, drawn inside a live frame, leaves the live frame's body
  as it is, where on main it gave that body the room of a toast of its own.
- The room in a frame holds in a browser with no `:has()`, Firefox 120 among them, as does a dialog
  inside a frame or after one.
- The sheets grew by 130 bytes and the controls by 169, as the budget tests measure them, which left
  less room under each budget than one more piece or function of the usual size, so record 13's rule
  set both again, as its tables give.
- A `hidden` attribute toggled on a stepper's button in a plain form still restyles a few hundred
  elements, about 1.2 ms, through record 24's rule that spaces a plain form's blocks, whose `:has()`
  is on a callout before the block it spaces. That rule is outside these three families, and this
  record leaves it as it is.

## How it is tested

The paths are in `packages/design-kit`.

- `e2e/restyle.spec.tsx`, in Chromium, draws a content page, a frame and a page that ends in a tab
  bar, each of a few thousand elements with a toast and a dialog, and reads the elements each
  recalculation restyled from the browser's trace, so the bound is a count that a slow runner does
  not move. An element added, words said on a status line and a field marked in error each restyle
  no more than a twentieth of what a change to the root's font size does, showing a toast restyles
  the whole page no more than once, and an element added while a toast is shown is held to the same
  bound.
- `src/scope.test.ts` fails a selector that writes a `:has()` on the root, the body, a frame or a
  page that ends in a tab bar where that element is not the rule's subject, a pictured frame aside,
  and holds every list of an app's places to one form.
- `e2e/toast.spec.tsx`, in Chromium, WebKit and Firefox, finds the frame's body marked with the
  toast's rows while the toast floats, through a message that replaces another, and unmarked after
  each way of dismissing it, while the toast takes its row above the dock, and on a body the toast
  has left, and marked with no count for a toast it cannot measure. `e2e/teardown.spec.tsx` finds
  the mark kept through an abort and an attach in one task and gone once the toast is taken down.
- `e2e/app.spec.ts` and `e2e/dialog.spec.ts` hold the room and the dialog's sizes on an app's
  page, and `e2e/controls.spec.tsx` the room under a list by the mark a page writes by hand.
