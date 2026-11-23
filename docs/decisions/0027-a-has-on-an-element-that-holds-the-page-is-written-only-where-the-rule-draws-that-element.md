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
it. Measured in Chromium 158 on an Apple M2 Max, on a page of about 2,300 elements, as the time the
browser spends recalculating style for one change, the median of five runs of twenty, and as the
elements one change restyles, read from the browser's trace:

| Change                      | Before  | Before at 4x slower | Elements restyled | After   | After at 4x slower | Elements restyled |
| --------------------------- | ------- | ------------------- | ----------------- | ------- | ------------------ | ----------------- |
| An element added            | 12.2 ms | 52.4 ms             | all of them       | 0.14 ms | 0.60 ms            | 10                |
| Words said on a status line | 6.1 ms  | 26.1 ms             | none counted      | 0.06 ms | 0.26 ms            | none              |

The figures are a content page's, and those of a frame and of a page that ends in a tab bar are
close to them. For words the trace counts no element on either side, so the time is the measure
there. The trace counts about 4,500 for the whole page, twice its elements. Each family cost a page
by itself:

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
  times, where the rule before this record did so only while a toast showed, and since it declares a
  property outside the tokens.
- **C. The padding goes on the root.** Rejected, since a body with `min-height: 100dvh` then scrolls
  where it did not.

**The frame's toast.**

- **A. The toast's attach function marks the frame with the rows it measured, and the sheet reads
  the mark**, as it reads `data-empty` on a live callout. A picture of a frame, which no script
  attaches, keeps a `:has()` on the pictured frame alone. The mark is on the frame rather than its
  body, since the frame is the toast's own ancestor: whatever replaces the frame replaces the toast
  with it, so the mark lasts as long as the toast does, where a mark on the body was lost as a page
  drew the body afresh. An observer that wrote the mark again would be a second thing to take down,
  would run on every change to the frame's children while a message shows, and would still miss a
  body it was not told to watch.
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
  the root. A dialog a page writes anywhere else, such as one it portals to the body beside a
  wrapper that holds the frame, says so with a class, `dk-dialog-app`, as `dk-dialog-sheet` names a
  dialog's form. The class alone, with the sibling forms dropped, was turned down, since a dialog
  after its frame in the same parent is the shape the reference draws, and every such page would
  have had to add the class in a patch release.
- **B. `attachDialog` marks the dialog.** Rejected, since a page may open a dialog itself, which
  record 13 allows, and a mark written at the attach goes stale where a frame arrives after it.
- **C. The root sets working values the pieces read.** Rejected, since each of the seven rules has a
  resting value of its own at its own place in the sheet's order, and pointing the tokens anew does
  not draw what the root's rule drew for a choice's and a theme switch's least width, a linked pill
  or a tab.
- **D. The rule stays, with a class as each subject.** Rejected, since Chromium would then restyle
  every button, field and choice on the page for each change.

## Decision

Option A for each. The rule that follows from them: a `:has()` on the root, the body, an app's frame
or a page that ends in a tab bar is written only where that element is the rule's subject. A rule
that has to draw something inside one of them reads a mark the kit's script writes, an attribute
that asks for no `:has()`, or is told by where the piece sits or by a class on it. A picture of a
frame is the one exception: it is inert, holds a few elements, and no script attaches it, so its
room is told by the shown toast it holds.

`attachToast` writes `data-toast-rows` on the frame its toast sits in while the toast floats over
the frame's body: the rows it measured the toast at, from one to five, or an empty value for a toast
it could not measure, which keeps the two rows a toast with no count does. It writes each attribute
only where the value changes, so measuring a floating toast that has not changed restyles nothing.
The mark comes off where the toast takes its row above the dock, as it is dismissed, before focus is
handed back, and from a frame the toast has left for another. It comes off the element that carries
it, which the attach keeps, rather than one found again. The sheet floats the toast and keeps the
room only for a body that is the frame's own child, so a frame whose body sits deeper, inside a form
for one, takes no mark and its toast takes its row above the dock.

The body's rule under a page's toast leaves out a body that is itself the frame, `<body
class="dk-app">`, as a page that holds a frame is left out, since the frame keeps the room inside
it. A body that ends in a tab bar keeps the padding, as it did before.

## Consequences

- A change to a page restyles what it touches. An element added restyles 10 to 12 elements where it
  restyled every one, on a content page, a content page with a dialog, a frame, a frame with an open
  dialog and a page that ends in a tab bar.
- Showing a toast restyles the whole page once where it did twice: the root's own rule on a content
  page, and the mark being written in a frame. Dismissing one restyles it once, as before.
- A shown toast written by hand in a live frame, with `data-shown` and no attach, keeps no room in
  the body until the page writes `data-toast-rows` on the frame too, with the toast's `data-rows` or
  empty. A toast shown by `attachToast` or the `Toast` a page attaches needs nothing.
- A dialog set apart from its frame, such as one a page portals to the body beside a wrapper that
  holds the frame, says so with `dk-dialog-app`. Without the class it draws at a content page's
  sizes above 48rem wide: controls at the field's height, the wider inset and its actions at its
  end. Written inside the frame, or before or after it as its sibling, it draws as before with no
  class. At 48rem wide or less nothing changes.
- A change inside an open dialog beside a frame restyles that dialog, 259 elements in a measured
  dialog of forty fields, since the dialog's own `:has()` reads its siblings.
- A picture of a frame with a shown toast, drawn inside a live frame, leaves the live frame's body
  as it is, where before it gave that body the room of a toast of its own.
- The room in a frame holds in a browser with no `:has()`, Firefox 120 among them, as does a dialog
  inside a frame or after one.
- The sheets came to 12,969 bytes and the controls to 21,073, as the budget tests measure them,
  which left less room under each budget than one more piece or function of the usual size, so
  record 13's rule set both again, as its tables give.
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
- `e2e/toast.spec.tsx`, in Chromium, WebKit and Firefox, finds the frame marked with the toast's
  rows while the toast floats, through a message that replaces another, and unmarked after each way
  of dismissing it, while the toast takes its row above the dock, and on a frame the toast has left,
  and marked with no count for a toast it cannot measure. It finds the room kept through a body
  replaced by a new element, a body that is itself the frame keeping the room inside it with no
  padding of its own, and a toast in a frame whose body sits inside a form in its row above the dock
  with the frame unmarked. `e2e/teardown.spec.tsx` finds the mark kept through an abort and an
  attach in one task and gone once the toast is taken down.
- `e2e/app.spec.ts`, in Chromium and WebKit, holds the room a frame keeps by a mark its fixtures
  write by hand, and finds a dialog at an app's sizes on a wide screen after, before and inside a
  frame and a page that ends in a tab bar, and at a content page's in a wrapper beside a frame,
  beside a wrapper that holds one and beside a picture of one, and at an app's again in a wrapper
  with `dk-dialog-app`. `e2e/dialog.spec.ts`, in Chromium, WebKit and Firefox, finds a dialog beside
  a wrapper that holds a frame at an app's sizes with the class and at a content page's without.
  `e2e/controls.spec.tsx`, in Chromium and Firefox, finds the room under a list kept by the mark
  with every selector that asks for a `:has()` taken out of its rule's list, as a browser without it
  drops it.
