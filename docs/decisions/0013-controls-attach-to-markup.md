# 13. The kit's controls ship their behavior as a module a page attaches to their markup

**Status:** accepted, amended by record 15, for the toast and the dialog, whose attach functions return what shows or opens them, and in 0.7.0 to set the sheets' budget at 9.25 KB by the same rule, once the toast's group of buttons and a table frame's shade took the sheets past 9 KB

## Context

Until now the kit ran one script in a visitor's browser, the theme script, and its components drew
markup alone, as record 5 has them. The theme switch and the copy buttons lived in the site's own
script, as record 12 has it, and the portfolio drew a theme toggle and a copy button of its own in
React, so the same contract, the theme saved under the portfolio's key, was kept in three places
with nothing holding them together. Both sites, and any demo, need the same two controls. The site
renders statically with no React in the browser, as record 11 has it, while the portfolio hydrates,
and both pages run under a policy that allows no inline style and scripts only from their own
origin or by the theme script's hash.

## Options

**A. A React component with its own state, and a script for pages without React.** Rejected, since
it is two copies of the behavior, each tried by one of the two sites, which is the drift this record
removes.

**B. A script that builds each control with the DOM, as the site's does.** Rejected, since there is
no markup to print in the reference or to draw on the server, and a React page would have to give
it an element React never touches.

**C. Markup from a component, and a function a page attaches to it.** The components draw markup
alone, as every component does, and a new entry, `@jasonsdevspace/design-kit/controls`, exports a
function for each control that finds its parts by their classes and makes it work.

## Decision

Option C. `ThemeSwitch`, `CopyButton` and `CopyStatus` draw the markup, and `attachThemeSwitch` and
`attachCopyButton` make it work, each returning a function that takes it away again, and
`chooseTheme` saves and draws a choice from anywhere on the page. The markup is hidden until it is
attached, so a visitor without script meets no control that does nothing. Nothing runs when the
module is imported, since the package's `sideEffects` lets a bundler drop a module whose only work
is done on import, and nothing reaches for the browser until a control is attached, so it loads in
Node. The functions set no style. The choices a switch saves, `system` and the two themes, are
`THEME_CHOICES` in `./theme`, beside the key the theme script reads, and the theme script itself
does not change, so its hash holds.

Since 0.4.0 the switch's markup is its name, a button for the collapsed form, and a div around the
radios that carries the group's role and is named and described by the name and the note, and the
note, and `attachThemeSwitch` wires the button it finds. In a demo's strip on a screen narrower than
20rem, a media query in rem that follows the browser's text size, the sheet shows the button, which
names the choice shown and opens the group under itself, over the page, with the choices one to a
row at a thumb's target. The group is not in the top layer, since the popover attribute that puts it
there is above Firefox 120, the kit's floor, so it is positioned under the button with a stacking
order of its own. Elsewhere the button stays hidden and the group is the row of choices.

Every attach function follows one rule for being called again: it attaches the element once and
returns what it returned the first time. Where it takes options, options given replace the last, so
a page that means to change them can, and a call with none leaves them as they were, so another part
of a page that attaches the same element does not undo what the first set. A dialog attached to stay
therefore still stays when attached again with no options, and a copy button attached again with a
new source copies from it. A part a control cannot work without, such as a stepper's buttons, a
toast's status line, its action and its close button, since any message may carry an action, or a
table's frame, throws an error that names it, so a page that left one out learns of it where it
attached. A part it can do without, such as a stepper's status line, is skipped. A theme switch with
no choices yet is the one exception: it is left hidden and returns a function that does nothing, so
a page that attaches it before its choices are drawn can attach it again once they are.

## Consequences

- The kit runs a second script in the browser, on a page that attaches a control, and its weight is
  held to a budget.
- What a page shows of the theme is kept in the module, once for the page, so every switch on it,
  and a page's own call to `chooseTheme`, show one choice. A choice the browser will not save is
  held there until the page is left, and drawn again after the theme script draws from storage on a
  change of the system's scheme or a page restored by Back.
- A page attaches a control after it is in the page, in an effect in React, which the markup's
  hidden state makes safe to do late.
- The site and the portfolio take the controls from the kit once a version carries them, and their
  own copies go.
- A page that writes the switch by hand writes the button and the div around the radios as the
  reference shows, since the attach function finds both by class, and a page that finds the group
  by its role finds the div. A page that stacks something over the strip at its own order can cover
  the open choices, which a top layer would have put above.
- A press on the button or on a choice cancels its default as it begins, so it moves no focus,
  since a browser that gives a pressed button no focus would blur the open choices first, and the
  choices close where they are only when focus leaves the switch or on a tap outside it. The page's
  lifted pointers are heard only while the choices are open, before any handler of the page's can
  stop them, so a swipe beside the choices, which the browser cancels as a scroll, leaves them open
  for a touch to scroll to. A switch with no choices yet is left hidden and unattached.

## The size audit of 0.6.0

For 0.6.0 the package was measured part by part, and the package record now shows the figures: each
piece by what the three sheets save without its rules, and each function by what it costs a page
alone and added to every other. The types and the README are measured apart from what reaches a
browser, in the record's last table.

What the audit found larger than it needed to be went: the plain height a browser without the
dynamic one read before each `dvh`, which no browser at the kit's floor needs, two blocks for one
short screen in the app's frame and two rules for one selector there, now one each, and the list of
listeners the theme switch and the stepper each took away one by one, now one signal each. What it
found and kept, with why:

- The room kept for a toast, written once for each count of rows, since a page's script sets no
  style the kit could read and gzip already sends the repeats for little.
- The theme switch's collapsed form, since a phone reaches it whenever its reader sets a large text
  size, not only on a screen under 320px.
- The strip's rules, whose likeness to others gzip already sends for nothing.
- The tokens no sheet reads, since the theme contract of record 4 promises them to a page.
- The `dk-toast-shown` class set beside `data-shown`, which the reference promises a page.

The app's pieces stay in the components sheet and the controls module. A sheet of their own would
spare a page with no app a little over 2 KB, sent once and then cached, and cost an app's page a
second sheet that holds back its first paint, and a module of their own would spare a page nothing,
since a bundler already sends only the functions a page imports.

The budgets are set from the audit: what the sheets, and the controls as a bundler sends every
function, weigh after it, with room for one more piece or function of the usual size, the median of
the costs the record tables, rounded up to the next quarter of a kilobyte. That keeps the sheets at
9 KB and sets the controls at 6.25 KB, from the 7 KB that counted the theme script, which a bundler
drops from the controls and a page puts inline in its head, and which is held to 1 KB of its own.

## How it is tested

The paths are in `packages/design-kit`, and those of the budgets in the repository's `scripts`.

- `src/controls.test.ts` imports the module in plain Node and finds no export but its functions.
- `scripts/controls.test.ts` holds what a page's bundler sends for every function, without comments,
  to the controls' budget, and the theme script to its own. `scripts/sheets.test.ts` holds the three
  sheets to theirs, and `scripts/parts.test.ts` the measure the record takes of each part.
- `e2e/attach.spec.tsx` serves the components' markup and the module from an origin of its own under
  a policy that allows scripts only from it or by the theme script's hash and styles only from it.
  It finds both controls hidden with no script, the switch's line for a visitor without script in
  the markup and none of it drawn with script on, the saved choice shown once attached, a new one
  saved and drawn with nothing refused, a switch attached again saving once, a switch attached
  through the element that holds it, one choice shown on every switch, a switch hidden again once
  taken away, the choice saved meanwhile or held by the page shown and drawn on a switch attached
  after every switch was taken away, one element attached as a switch and then as a copy button, a
  choice from another tab followed, a choice the browser will not save held through a page restored
  by Back, and a copy saying Copied on the button and the status line, or Selected with the text
  selected where the clipboard is refused, and a copy button put back to Copy when it is taken away.
  It finds the switch read by its name and described by its note, and a copy made on Enter as on a
  click, and on Space where the clipboard is refused, with focus held on the button so the keys the
  status line names still reach the page. In a strip on a screen narrower than 20rem it finds the
  switch collapsed to one button naming the choice shown, the choices opened under it one to a row
  at the target with nothing below the strip moved, a pick by pointer closing them with focus on
  the button, the arrow keys moving the choice without closing them, Escape and a tap outside
  closing them, a swipe beside them leaving them open, and the row of choices back at 20rem.
- `e2e/pieces.spec.ts` holds how the switch, the pill and the copy button's words are drawn, that
  none cuts a word off under the wider text spacing a visitor may set, on a phone, and that the
  switch collapses to its name and one button in a demo's strip on a screen narrower than 20rem
  and keeps its row everywhere else.
