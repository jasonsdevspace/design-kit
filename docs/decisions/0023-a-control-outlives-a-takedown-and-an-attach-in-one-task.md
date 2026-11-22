# 23. A control outlives a takedown and an attach in one task

**Status:** accepted, amending record 22's rules that a later attach starts afresh and that the
first attach owns a piece, record 13's rule for an attach called again, record 15's line let go by
the signal its first attach took, record 19's rule for handing focus back, which the toast and a
dialog taken down now share, and record 20's hooks, which now take their part down at once rather
than a microtask after a null call

## Context

Record 22 has every attach take a signal and the React hooks hand each one the signal of a
controller their ref makes, aborted by the cleanup the ref returns. React calls a ref's cleanup and
then the new ref whenever the ref itself changes, so a page that writes `ref={(el) => form(el)}`, or
a helper that merges refs and passes the cleanup on, makes a new ref on every render, and every
render took the control down and attached it afresh. A form's check was set up again on a parent's
render, a group the arrow keys move through made a new observer each time, and a busy button drawn
again faster than its wait never said it was busy. The same happens where an element passes from one
hook's ref to another's in one commit, and where React's second run in development calls each ref
twice, which `StatusProvider` worked around by keeping its line's controller for a microtask.
0.9.2's hooks attached in refs too, and there a ref made afresh attached a busy button, a group and
a bar afresh on every render.

## Research

- **React calls the old ref's cleanup and then the new ref.** Where a different ref callback is
  passed, React calls the cleanup the previous one returned, or calls it with null where it returned
  none, and then calls the next one with the element. In development, `StrictMode` runs one extra
  setup and cleanup cycle for every ref callback.
- **The DOM treats an abort as a cancel.** Section 3.3 of the DOM standard, which record 22 follows,
  asks an API to treat an abort as its own cancel. This record has a control's takedown land a
  microtask after the abort, so it qualifies that.
- **Libraries restore focus by where focus is.** React Aria's `FocusScope` restores focus as a scope
  unmounts only where focus is in the scope, or on the body while the scope was the active one, and
  does so in the next frame. Radix's `FocusScope` puts off moving focus back as it unmounts with a
  timer of no delay.

## Options

**A. Defer the takedown in the hooks.** Each hook's cleanup waits a microtask before it aborts, and
an element the ref is called with again by then stays as it was. Rejected. Two hooks can reach one
element, through a merged ref or as the element passes from one hook's ref to another's in one
commit, and then neither hook's record knows which of them a waiting takedown belongs to. A takedown
one hook deferred can take the element from the other, or send a refusal through a form the hook has
let go of. Each such case needs a rule of its own in the hooks, and a page without React still loses
its control between an abort and an attach.

**B. Leave it to pages, and document that a hook's ref must stay the same across renders.**
Rejected. An arrow written inline is the ordinary way to pass a ref, and a merged ref is the only
way to give one element two hooks, so the limit would catch most pages that use the hooks.

**C. Let the controls keep their holders.** Every call that attaches an element holds its control by
the signal it gives. The control is taken down a microtask after the last holder lets go, and an
attach of the same element before then joins it. The kit already keeps who owns each element, one
map for each kind of control, so the rule lives there once, for React pages and pages without React
alike.

**D. Keep the browser's restore as a handback by the events around a dialog's close.** The dialog
would record what focus went to as it left the closed dialog, as the kit records its own handbacks.
Rejected. No event marks the restore in every engine: focus already on the body inside the dialog,
as where a pressed Save is taken away, leaves the dialog with no focusout as it closes, and in
Firefox a dialog its form closes lets focus fall to the body before the browser moves it on, so
focus read as it leaves is the body. Each order needed a rule of its own, so the kit reads instead
where focus is against what had focus as the dialog opened.

## Decision

Option C.

- **Each signal holds the control.** An attach given a signal adds it as a holder, and a call given
  one already held adds no second holder, as `addEventListener` ignores a listener added twice. A
  call without a signal holds the control for the page's life where nothing else holds it, is filed
  under that hold where the page already holds the control without a signal, and elsewhere joins
  without holding, speaking for the newest holder.
- **The last holder letting go takes the control down a microtask later.** An attach of the same
  element before then, with a signal or without one, cancels the takedown and keeps the control's
  state, a busy wait, a form's check and the errors it drew, a group's observers, an open dialog, a
  shown toast and a status line's words among them. React runs a ref's cleanup and the next ref in
  one commit, with no microtask between them, so a ref made afresh, React's second run and an
  element passed between two hooks' refs all keep the control. A page without React that aborts and
  attaches again in one task keeps it too, and one that attaches after a microtask starts afresh. A
  call without a signal in the abort's task joins as the page's own hold, which holds the control
  for the page's life, as any other attach in that task joins. An attach made from inside a
  control's own takedown, as a dialog's close handler that attaches it again, gets a control of its
  own, since the one it would join is already being taken down.
- **The detach takes the control down at once, whoever holds it.** It is still the one function
  every call returns, so a page that means to start afresh within the task calls it.
- **A later attach returns what the first returned,** as record 13 has it.
- **A control runs on its newest holder's options.** A new holder's options apply at once. A call
  from the newest holder, or from the holder whose options apply, as an older hook makes when one of
  its own options changes, replaces them. A call from another older holder is kept, and applies once
  every newer holder that gave options has let go. When the holder whose options apply lets go, the
  newest one left that gave options takes over with them in the microtask a takedown would wait for,
  unless a newer holder has given its own by then, so a ref made afresh on a hook that shares an
  element does not hand the control to the older hook's options and back on every render. A call
  without a signal applies its options at once, and files them under the newest holder, so they
  leave with it, or under the page's own hold where the page holds the control without a signal, so
  they stay with the page as hooks come and go. Options count as given only where a key other than
  `signal` has a value, `null` and `false` among values, so an empty object, a signal alone and keys
  left undefined, which a page spreading its own optional props passes, count as none, and a call
  with none keeps the options its holder gave before, as record 13 has a call with none leave them
  as they were. Where no holder left gave options, the control goes back to its defaults, as a first
  attach that gave none has them, though a copy button keeps the source and status line it has.
- **Until the takedown lands, the control is whole.** Its listeners still hear the page, and what
  its attach returned still acts, so record 22's calls after teardown do nothing from the moment the
  takedown lands. A focus request's takedown waits the same microtask, which changes nothing for it,
  since its frame cannot come first.
- **A takedown hands focus back by one rule.** The toast, the dialog and the panels hand focus back
  only where focus is in the piece, or where it is on the body or nowhere and the piece had it as it
  left, which is record 19's rule for a panel and record 15's for a toast. A toast hands focus to
  the first of these that takes it: the control focus last came into it from, as React Aria's toast
  region does for the control focus came from, then where focus was as its latest message came, then
  the body of the app's frame or the page's main content. It reads the control focus came from as
  that control loses focus, inside an open shadow root too, where the event's related target names
  only the host, and takes the related target itself where the page stopped that focusout before it
  reached the document. An entry from nowhere names none. A page sees focus inside a frame only as
  the frame, and focus that comes into the toast from inside a frame as coming from nowhere. Where
  its handback focuses a frame of the page's own origin, the toast goes on to the control that had
  focus there as the latest message came, read as it came, since a frame's document drops its focus
  to its body once focus leaves. Focus stays on the frame where that control is gone, marked off, on
  a page the frame has since replaced, and on a frame of another origin. Following the latest
  control inside the frame instead was rejected, since it bets on the order each engine fires focus
  events in, costs about 96 more bytes, and no consumer draws a frame. Firefox does not focus a
  frame of another origin while a key is being pressed, so a dismiss by keyboard there goes on down
  the list. A frame inside that frame is not followed, so focus goes back to the inner frame itself.
  The toast takes off its shown state before it hands focus back, so the room the sheet keeps under
  a shown toast does not scroll the control focus goes to, and hides its buttons after, and where
  nothing takes focus, it blurs what still has focus in it, so focus falls to the page's body in
  every engine, where WebKit and Firefox would leave it on the toast's hidden button until a later
  rendering update. Each piece tries its places in turn and counts a place as taken where focus
  moves onto it or inside it, its shadow tree included, or where it has focus already, passing over
  one that refuses focus though focus is inside it, and where a page's own listener moves focus
  elsewhere as one is tried, it goes no further and that focus stays. A takedown lands after the
  abort's task, so focus the page set in that task, by its own call or by a field the new content
  focuses as it draws, stays. The kit keeps where it last handed focus back, and `moveFocus` treats
  focus there as free where the handback came after the request was asked, so a request asked in the
  abort's task still lands. It keeps a handback only where the walk focused a place, so a request
  asked before a walk that focused nothing leaves what the page focused alone. The browser hands
  focus back to what had focus before a dialog opened as the dialog closes, ahead of the close
  event. So a request treats focus there as free while the dialog is closed and its close not yet
  handled, and a request that lands while focus is there takes that place from the dialog. The
  dialog's close event and its takedown hand focus back where focus is still there, or by the rule
  every piece hands it back by, so a request that landed first or focus the page moved elsewhere in
  that task stays. The dialog lists what the browser handed focus to last, so where the opener has
  gone and nothing else takes focus, that place counts as handed back, and a request asked in the
  task that closed the dialog still lands. A request asked from inside an open dialog lands where
  the task it is asked in closes the dialog, takes it away or takes it down, so a page can send
  focus somewhere more useful than the opener as the dialog closes, as the dialog pattern of the
  ARIA Authoring Practices allows. One asked in an earlier task lands only where its frame comes
  after the dialog closes, and otherwise finds the page behind inert, so a page that awaits before
  closing asks again just before it closes. Each place a piece hands focus back to can be any HTML
  or SVG element that takes focus, such as a link in an inline chart, and one that is hidden, inert
  or disabled is passed over for the next.
- **The hooks take their part down at once.** A ref's cleanup aborts its element's signal and drops
  the element from the hook's own map in the same call, and a ref called with null does so for every
  element it holds. `StatusProvider` keeps no controller of its own, and waits a microtask only to
  call off the words it held before its line was drawn.

`teardown` in `src/teardown.ts` keeps the holders, with `hold` beside `add` and `stop`, and two
functions beside it, `join` and `keep`, find a control by its element in its kind's map and keep it
there until it is taken down, so no attach keeps its own registry rule. `attachStatus` joins through
`join` too, and first takes down the attach of a line let go of while still attached, as a toast's
own line is when the toast is taken down, so a later attach of that line starts afresh. A holder's
listener on its signal is added once and taken off as it fires or as the control is taken down,
rather than given the control's own signal, which would leave an entry on the control's signal for
every signal it has ever held.

## Consequences

- A ref written inline, a merged ref and React's second run keep a control as a ref kept the same
  across renders does, and two hooks on one element each hold it, so dropping one leaves the other
  working on its own options.
- A call in the same task as an abort reaches a piece still whole: a panel's `set` still opens or
  closes it and a dialog's opener still opens it, until the takedown lands.
- A page can no longer start a piece afresh by aborting and attaching it in one task. It calls the
  detach, or attaches after a microtask.
- A takedown lands a microtask after the abort, a break from record 22's reading of section 3.3 of
  the DOM standard, under which it lands with the abort. Until it lands, a dialog left open on the
  page keeps the page behind it inert, so a page that moves focus in the abort's task focuses with
  `moveFocus` or calls the detach.
- A toast's takedown can run after React has taken the toast away, so it cannot tell from where
  focus is alone whether it had focus. Chromium fires focusout on a toast taken from the page with
  focus in it while WebKit and Firefox fire none, so the toast reads where focus is a microtask
  after it hears focusout, and keeps whether focus left the page with it apart. It forgets that once
  the visitor moves focus outside it, or presses while it is off the page, so it hands focus back by
  record 15's rule and never over the visitor's own move.
- A join that repeats a holder's options calls its attach's `set` again, so each `set` leaves the
  control as it was where nothing changed. A copy button given a source that gives the element its
  last press copied keeps the word it shows, reading the source only while a word is shown, and
  progress counts its steps again only where their count changes.
- A page that itself focuses what had focus as a dialog opened, in the task that closes the dialog,
  is read as the browser's restore, so the dialog's close event still hands focus to its opener
  where that is another element.
- Each attached dialog keeps what had focus as it opened until its close is handled or it is taken
  down, or a request lands with focus there, so a dialog taken from the page with no takedown lets
  go of that element at the next request.
- The controls weigh 18,553 bytes with the holders, against 18,117 before, which leaves less room
  under 18.5 KB than a function of the usual size, so record 13's rule sets them at 18.75 KB. One
  rule for handing focus back and a toast that forgets focus a visitor moved take them to 18,638
  bytes, with less room under 18.75 KB than a function of the usual size, so the rule sets them at
  19 KB. A toast that sends focus back to the control focus came into it from takes them to 18,757,
  and the status line joining through `join`, with options read by their values rather than their
  key names, brings them to 18,751. A dialog whose close leaves focus free for a focus request asked
  in the task that closes it brings them to 18,907, and a handback that takes an SVG element as well
  as an HTML one, with a panel that follows an SVG link to a place on the page, brings them to
  18,975, with less room under 19 KB than a function of the usual size, so the rule sets them at
  19.25 KB. A toast that lets focus fall to the page's body where nothing takes it, and sends it on
  to the control inside a frame of the page's own origin, with a handback that stops where the page
  moves focus during it, brings them to 19,222, with less room under 19.25 KB than a function of the
  usual size, so the rule sets them at 19.5 KB.
- Records 13, 15, 19, 20 and 22 say what this record changes, and the reference's section on taking
  a control down says when a takedown lands and when the kit hands focus back.

## How it is tested

The paths are in `packages/design-kit`.

- `src/teardown.test.ts` finds an abort of the only holder runs nothing until a microtask has
  passed, a signal held before then keeps everything, a call without a signal holding only where
  nothing else does and joining as the page's own hold in the abort's task, `stop` running at once
  whoever holds and leaving no listener on any holder's signal, the listeners on a signal not
  growing as holders come and go, the options of the newest holder that gave any applied as holders
  join and let go, a newer holder joined in the same task keeping its own, an older holder's options
  kept through a call from it that gives none, no options applied after the detach, an attach made
  from inside a takedown getting a control of its own, a page's own options given without a signal
  applied at once and kept as a hook sharing the element goes, options that give only a signal taken
  for none, a first attach's among them, an empty object, keys left undefined and keys only
  inherited taken for none while `null` and `false` are given, and no options applied once the only
  holder that gave any lets go.
- `e2e/dialog.spec.ts` finds a dialog attached to stay still staying once attached again with `{}`,
  and no longer staying once attached again with `{ stay: false }` or with options that leave
  `stay` out.
- `e2e/teardown.spec.tsx` aborts and attaches every piece an attach keeps again in one task and
  finds each kept, with its handle, a busy wait, an open dialog, a shown toast, a group's observers
  and a form's errors and check, aborts and attaches without a signal in one task and finds each
  kept and a busy wait still marked, and aborts, waits a microtask and attaches and finds each
  attached afresh. For focus, it finds a toast with focus in it hand focus back where it is taken
  down and removed from the page in one task or removed first and taken down in a later task, focus
  left on a control outside a toast taken away as focus moves there and on the body where a visitor
  moved it after the toast left the page, a focus request asked as a dialog or a toast with focus in
  it is taken down landing, one asked from inside an open dialog opened from a focused opener
  landing too where the page closes the dialog or takes it from the page and takes it down in the
  same task, where it only closes it and the close event comes after the request's frame, where a
  press on an answer closes it, and where the opener is not what had focus as it opened, focus the
  page sets in the task that closes such a dialog staying, focus going to the opener from one closed
  and taken down in one task where something else had focus as it opened, a request asked from
  inside a dialog whose pressed control is taken away as it is pressed landing, with its close event
  coming in time or late, the later of two requests asked as a toast with focus in it is taken down
  landing where the first asks for the control focus goes back to, and focus the page sets as a
  dialog taken from the page is taken down staying. It also finds a toast kept shown while focus
  leaves it and comes back in one task, one moved in the page with focus in it starting its wait
  again in Chromium, a dialog kept staying where a later attach gives it only a signal, a progress
  step said once through a join that gives the same count, a form and a stepper back on their
  defaults once the only holder that gave options lets go, and a dialog's `stay` dropped with the
  holder that gave it, though the first attach gave a signal.
- `e2e/toast.spec.tsx` moves from a field to a second control and into a shown toast, dismisses it
  by its action and by Escape, and finds focus on the second control, there too where the page stops
  the second control's focusout, and finds focus sent back to where it was as the message came where
  that control is disabled before the dismiss, where focus last came into the toast from nowhere,
  and where it only ever came in from nowhere. It finds focus on the page's body as a press on its
  action is handled where nothing it would hand focus to takes it, and focus left where a page's
  listener on the action moves it as focus leaves the action, where nothing later on the list takes
  focus and where the main content takes it, since the walk stops there, with a focus request asked
  before the dismiss leaving that field alone. It finds a host that hands focus to its shadow tree
  taken as handed back, so a focus request asked before the dismiss lands, and the scroll left where
  it was as focus goes back to a control in view, on a page and in an app's frame. It finds focus
  sent back to the button inside a frame of the page's own origin that had focus as the message
  came, there too after a click on the frame's empty space, focus left on the frame where that
  control is marked off, gone, or on a page the frame has since loaded, focus on a frame of another
  origin where a press by pointer dismisses the toast, and, in Firefox, focus on the main content
  where a dismiss by Enter cannot focus that frame, and focus left on the frame's other button where
  a page's listener moves it there during the handback. `e2e/focus.spec.tsx` finds a request go on
  to its fallback where its target holds focus but refuses it, and `e2e/dialog.spec.ts` finds a
  request asked in the task that closes a dialog landing where its opener has gone and the browser
  handed focus elsewhere. It also finds focus sent back to a link inside an inline svg that focus
  came into the toast from, and to one that had focus as the message came where focus then came into
  the toast from nowhere. It runs in Firefox as well as Chromium and WebKit. `e2e/dialog.spec.ts`
  finds it sent back to one that opened the dialog, and `e2e/panel.spec.ts` finds focus sent to one
  that follows a panel whose buttons are gone, there too where the link's address is written with
  `xlink:href`, and to the place on the page that one pressed inside a panel goes to, and finds a
  panel closing without throwing in a window with no class for an SVG link, as jsdom has none.
  `e2e/focus.spec.tsx` finds a late request from a component since gone land on one. Each runs in
  Chromium, WebKit and Firefox. `e2e/shadow.spec.ts` finds focus sent back to a control inside an
  open shadow root that focus came into the toast from.
- `e2e/teardown.spec.tsx` also opens and closes a panel through `set` in the task its signal
  aborts and finds it closed, and finds a copy button's word kept for the block its last press
  copied and put back to Copy where a source that reads the page's state gives another block, or
  throws, and its source read on a join only while a word is shown.
- `e2e/strict.spec.tsx` draws a form, a group and a busy button mid-wait behind refs made afresh on
  every render and finds the form's check set up once and its errors kept, the group observed once
  with one stop, and the busy button's wait kept and its words said once, on a clock that stands
  still. It finds a busy wait kept where a heading's hook joins it through a merged ref, a group two
  hooks share through a merged ref observed once, a form passed from one hook's ref to another's in
  one commit keeping its errors and refusing through the hook it went to, and either of two form
  hooks on one form dropped leaving the other's check and refusal.
- `e2e/leaks.spec.tsx` joins every piece but a focus request twice with a new signal and finds
  nothing growing as it is joined and nothing left once it is taken down, listeners on signals
  included.
- `scripts/controls.test.ts` holds the controls, the helper with them, to the budget record 13 sets.

## Sources

- React Aria, [useToastRegion](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/toast/useToastRegion.ts),
  which keeps where focus came into the region from and sends it back there, read 2026-11-21.
- React, [ref callback](https://react.dev/reference/react-dom/components/common#ref-callback) and
  [fixing bugs found by re-running ref callbacks in
  development](https://react.dev/reference/react/StrictMode#fixing-bugs-found-by-re-running-ref-callbacks-in-development),
  read 2026-11-21.
- WHATWG, DOM Standard, [using AbortController and AbortSignal objects in
  APIs](https://dom.spec.whatwg.org/#abortcontroller-api-integration), read 2026-11-20.
- React Aria,
  [FocusScope.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/focus/FocusScope.tsx),
  read 2026-11-21.
- Radix Primitives,
  [focus-scope.tsx](https://github.com/radix-ui/primitives/blob/main/packages/react/focus-scope/src/focus-scope.tsx),
  read 2026-11-21.
