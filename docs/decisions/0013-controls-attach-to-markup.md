# 13. The kit's controls ship their behavior as a module a page attaches to their markup

**Status:** accepted, amended by record 15 in 0.5.0, for the toast and the dialog, whose attach
functions return what shows or opens them, by record 20 in 0.9.0, for React pages, which attach some
controls through a kit hook, in 0.9.0 for the listener the module adds to the document as it loads,
by record 22 in 0.9.3, under which every attach takes a signal that takes its piece down, by record
23 in 0.9.3, under which each signal that attaches an element holds its control, by record 27 in
0.9.4, under which the room an app's frame keeps under a toast is told by a mark the toast's attach
function writes on the frame, and in 0.9.4 for the listener the module adds for the page going out
of sight or coming back. Its budgets were set again in 0.7.0, 0.8.0, 0.8.2, 0.8.4, 0.8.6, 0.9.0,
0.9.3 and 0.9.4, as its tables give, and in 0.9.4 for the budgets of three entries of the controls
and a rule that lowers a budget

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
module is imported but listeners on the document for keys, clicks and submits, in a page, which note
whether the visitor's last input was a press for `focusOnArrival`, so the press that brings a page's
first view is heard, and since 0.9.4 one for the page going out of sight or coming back, which drops
a focus request made while the page is out of sight or before it goes. The package marks
`dist/controls.js`, the file `./controls` resolves to, as having side effects in its `sideEffects`,
so a bundler keeps the module and its listeners wherever a page imports it, even bare, and the
listeners wait for a document, so the module loads in Node. The functions set no style. The choices
a switch saves, `system` and the two themes, are `THEME_CHOICES` in `./theme`, beside the key the
theme script reads, and the theme script itself does not change, so its hash holds.

Since 0.4.0 the switch's markup is its name, a button for the collapsed form, and a div around the
radios that carries the group's role and is named and described by the name and the note, and the
note, and `attachThemeSwitch` wires the button it finds. In a demo's strip on a screen narrower than
20rem, a media query in rem that follows the browser's text size, the sheet shows the button, which
names the choice shown and opens the group under itself, over the page, with the choices one to a
row at a thumb's target. The group is not in the top layer, since the popover attribute that puts it
there is above Firefox 120, the kit's floor, so it is positioned under the button with a stacking
order of its own. Elsewhere the button stays hidden and the group is the row of choices.

Every attach function follows one rule for being called again: it attaches the element once and
returns what it returned the first time. Where it takes options, options given replace the last,
under record 23's rule for which holder's options apply, so a page that means to change them can,
and a call with none leaves them as they were, so another part of a page that attaches the same
element does not undo what the first set. Each call's `signal` holds the piece, which is taken down
a microtask after every signal holding it has aborted, and the piece runs on the options of its
newest holder, as record 23 has it, and a call given a signal already aborted takes nothing and
returns a function that does nothing, as record 22 has it. A dialog attached to stay therefore
still stays when attached again with no options, and a copy button attached again with a new source
copies from it. A part a control cannot work without, such as a stepper's buttons, a toast's status
line, its action and its close button, since any message may carry an action, or a table's frame,
throws an error that names it, so a page that left one out learns of it where it first attached,
under a signal already aborted too, while a control already attached is handed back as it is, as
record 22 has it. A part it can do without, such as a stepper's status line, is skipped. A theme
switch with no choices yet is the one exception: it is left hidden and returns a function that does
nothing, so a page that attaches it before its choices are drawn can attach it again once they are.

What an attach returns is what a page calls next. The switch, the copy button, the stepper, a
table's frame, a group the arrow keys move through, a busy button and progress return their detach.
The toast, the dialog and the status line return what shows, opens or says, as record 15 has it, a
form what refuses it, and a panel's button both what opens or closes the panel and its detach. Each
is also taken down by its `signal`, which record 22 has every attach take, so a page takes down any
piece the same way whatever its attach returns.

## Consequences

- The kit runs a second script in the browser, on a page that attaches a control, and its weight is
  held to a budget.
- What a page shows of the theme is kept in the module, once for the page, so every switch on it,
  and a page's own call to `chooseTheme`, show one choice. A choice the browser will not save is
  held there until the page is left, and drawn again after the theme script draws from storage on a
  change of the system's scheme or a page restored by Back.
- A page attaches a control after it is in the page, which the markup's hidden state makes safe to
  do late. A React page attaches a form, a busy button, progress and a group of cells, draws the
  status line with `StatusProvider`, which `useStatus` finds, and moves focus through a kit hook, as
  record 20 has it, and attaches the other controls in an effect of its own.
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
  style the kit could read and gzip already sends the repeats for little. Since record 27 the room
  in an app's frame is told by `data-toast-rows` on the frame, a mark `attachToast` writes there as
  a page's markup writes `data-empty` on a live callout, in place of a `:has()` on the frame, and
  each count of rows is still a rule of its own.
- The theme switch's collapsed form, since a phone reaches it whenever its reader sets a large text
  size, not only on a screen under 320px.
- The strip's rules, whose likeness to others gzip already sends for nothing.
- The tokens no sheet reads, since the theme contract of record 4 promises them to a page.
- The `dk-toast-shown` class set beside `data-shown`, which the reference promises a page.

The app's pieces stay in the components sheet and the controls module. A sheet of their own would
spare a page with no app a little over 2 KB, sent once and then cached, and cost an app's page a
second sheet that holds back its first paint, and a module of their own would spare a page nothing,
since a bundler already sends only the functions a page imports.

## The budgets

The budgets are set from the audit by one rule: what the sheets, and the controls as a bundler sends
every function, weigh, with room for one more piece or function of the usual size, the median of
the costs the package record tables, rounded up to the next quarter of a kilobyte. The audit kept
the sheets at 9 KB and set the controls at 6.25 KB, from the 7 KB that counted the theme script,
which a bundler drops from the controls and a page puts inline in its head, and which is held to
1 KB of its own.

A budget is set again by the same rule once something takes the sheets or the controls past it, and
since 0.9.0 also once a release measured whole, as the audit was, or a change within one leaves less
room under it than a piece or function of the usual size, so the next one of the usual size fits.
Before then a budget stayed until something outgrew it, so the sheets at 0.8.4, 10,916 bytes with a
median piece of 165, and the controls at 0.8.5, 7,661 bytes with a median function of 657, each left
less room than that and kept their budgets of 10.75 KB and 7.5 KB. For 0.8.0 and 0.9.0 the sheets
were measured with a prototype of every piece planned for the release, its rules formatted as the
sheets are, so the budget was raised once for pieces that land one at a time, and a piece that lands
heavier than its prototype and outgrows that says so with its figures.

Each row below sets a budget, the audit's first and each raise after it. It names what took the
budget past it, or left less room under it than one more of the usual size where it says too little
room was left, and gives what the whole weighed then, gzipped as the budget's test measures it, the
median piece or function, and the budget set. The figures of 0.6.0 and 0.7.0, which the record did
not give when those budgets were set, are measured from those releases' commits by the budget tests'
own functions, with the medians the package record gave at each.

| Release | What set it                                                                     | Sheets together | Median piece | Budget set |
| ------- | ------------------------------------------------------------------------------- | --------------- | ------------ | ---------- |
| 0.6.0   | The size audit                                                                  | 8,947 bytes     | 186 bytes    | 9 KB       |
| 0.7.0   | A toast's group of buttons and a table frame's shade                            | 9,235 bytes     | 210 bytes    | 9.25 KB    |
| 0.8.0   | A prototype of the release's planned pieces, from 9,432 bytes                   | 10,220 bytes    | 177 bytes    | 10.25 KB   |
| 0.8.2   | A tile's inset in a panel, a corner Close and a picture at its content's height | 10,695 bytes    | 193 bytes    | 10.75 KB   |
| 0.8.6   | A grid of buttons dropping to a column count that divides its cells             | 11,394 bytes    | 169 bytes    | 11.5 KB    |
| 0.9.0   | A prototype of the release's planned pieces, from 11,398 bytes                  | 12,112 bytes    | 169 bytes    | 12 KB      |
| 0.9.0   | Those pieces landed, 113 bytes over the prototype, with too little room left    | 12,225 bytes    | 144 bytes    | 12.25 KB   |
| 0.9.4   | A busy button's dots, with too little room left                                 | 12,523 bytes    | 154 bytes    | 12.5 KB    |
| 0.9.4   | A field held to the measure, with too little room left                          | 12,661 bytes    | 155 bytes    | 12.75 KB   |
| 0.9.4   | The root's room written in em, with too little room left                        | 12,909 bytes    | 181 bytes    | 13 KB      |
| 0.9.4   | A read-only value of words sized to its value, with too little room left        | 13,173 bytes    | 180 bytes    | 13.25 KB   |

| Release | What set it                                                                              | Every function | Median function | Budget set |
| ------- | ---------------------------------------------------------------------------------------- | -------------- | --------------- | ---------- |
| 0.6.0   | The size audit                                                                           | 5,777 bytes    | 600 bytes       | 6.25 KB    |
| 0.8.4   | `attachPanel`, and the fixes for an off button and a button attached later               | 6,898 bytes    | 668 bytes       | 7.5 KB     |
| 0.9.0   | A stepper's range in words, its limits said, and a page's words and line                 | 8,112 bytes    | 655 bytes       | 8.75 KB    |
| 0.9.0   | `moveFocus`, and `attachRoving` for a group's cells                                      | 10,372 bytes   | 650 bytes       | 11 KB      |
| 0.9.0   | `attachForm`, which refuses a form, and `attachBusy`                                     | 11,524 bytes   | 672 bytes       | 12 KB      |
| 0.9.0   | `attachProgress` and its polite words                                                    | 12,340 bytes   | 622 bytes       | 12.75 KB   |
| 0.9.0   | `attachForm` checking the browser's constraints, as record 21 has it                     | 15,034 bytes   | 620 bytes       | 15.5 KB    |
| 0.9.0   | `focusOnArrival`, which tells a press from a key that moves                              | 16,730 bytes   | 608 bytes       | 17 KB      |
| 0.9.0   | The release measured whole, with too little room left                                    | 16,985 bytes   | 622 bytes       | 17.25 KB   |
| 0.9.3   | Record 22's helper under the theme switch and the copy button, with too little room left | 17,532 bytes   | 586 bytes       | 17.75 KB   |
| 0.9.3   | The other attaches moved onto the helper                                                 | 18,269 bytes   | 606 bytes       | 18.5 KB    |
| 0.9.3   | Record 23's holders, with too little room left                                           | 18,553 bytes   | 635 bytes       | 18.75 KB   |
| 0.9.3   | One rule for handing focus back, with too little room left                               | 18,638 bytes   | 641 bytes       | 19 KB      |
| 0.9.3   | A handback that takes an SVG element as well as an HTML one, with too little room left   | 18,975 bytes   | 636 bytes       | 19.25 KB   |
| 0.9.3   | Focus falling to the body and followed into a frame, with too little room left           | 19,222 bytes   | 624 bytes       | 19.5 KB    |
| 0.9.3   | A control kept clear inside a frame of the page's own origin, with too little room left  | 19,609 bytes   | 633 bytes       | 20 KB      |
| 0.9.4   | A dated field's limit in words a visitor reads, with too little room left                | 20,708 bytes   | 626 bytes       | 21 KB      |
| 0.9.4   | A toast's mark on its frame, with too little room left                                   | 21,112 bytes   | 627 bytes       | 21.25 KB   |
| 0.9.4   | A stepper quiet as its form refuses it, with too little room left                        | 21,224 bytes   | 644 bytes       | 21.5 KB    |
| 0.9.4   | A focus request dropped as the page leaves sight, with too little room left              | 21,506 bytes   | 622 bytes       | 21.75 KB   |
| 0.9.4   | Letters shown as a stepper is left and its field named, with too little room left        | 21,751 bytes   | 651 bytes       | 22 KB      |
| 0.9.4   | A stepper's error held back while a press outside it is down, with too little room left  | 21,921 bytes   | 655 bytes       | 22.25 KB   |

Between the last raises of 0.9.3, a cleanup of the status line brought the controls from 18,269
bytes to 18,117, which record 23's holders took to 18,553. Record 22's helper took them from 17,331
bytes. The sheets at 0.8.4 held its bands, its icon sizes and the app frame's named sides, and the
controls at 0.8.5 held a panel's focus on closing, as record 19 has it, and a toast's buttons given
their tabindex. The raise of 0.8.0 also brought three parts into the package record, the site's
header, the content page and the icon. The grid of 0.8.6 works out a column's width at each count
from two to six in the sheet, since no page media query may do it. The prototype of 0.9.0 held a
dock row for a compact action, a busy button, a region that is loading, a mark for a required or
optional field, the stack's steps, a split row, a note, a large numeral, progress, a read-only
field, an empty state and a hero beside its picture, and the package record measures the pieces as
they ship. The controls measured whole for 0.9.0 held a stepper's own `say` and the lookups that
find a piece's parts inside a shadow root. The other attaches moved onto record 22's helper in 0.9.3
were the status line, the toast, the form, the panels and the rest, and the one rule for handing
focus back, shared by the toast, the dialog and the panels, came with a focus request asked before a
handback still landing and a toast that forgets focus a visitor moved while it is off the page.

Since 0.9.4 three entries of the controls carry budgets of their own beside the whole, because a
page pays for the functions it imports and no page imports every one. They are the module imported
bare, which sends the listeners it adds as it loads, and the attaches that send the least and the
most alone, `attachTable` and `attachForm`. Each is measured from the package laid out as npm ships
it, as the package record measures a function alone, so a bundler reads the manifest's
`sideEffects` and keeps the module's listeners on a bare import. From 0.9.4 every budget of the
controls, the whole and each entry, is measured from that layout, with one median. Each budget is
set and set again by the rule above, its size with room for one more function of the usual size,
rounded up to the next quarter of a kilobyte. The median function comes from the same layout. A
function's cost is what every function sends less what every other sends without it, the costs are
sorted, and the median is the middle cost, or the upper of the middle two where the count is even.
Measured so at 0.9.4, every function comes to 21,541 bytes with a median function of 637, which
fits the whole's budget of 21.75 KB, so it stays.

| Release | Entry                    | What set it                   | Sent        | Median function | Budget set |
| ------- | ------------------------ | ----------------------------- | ----------- | --------------- | ---------- |
| 0.9.4   | The module imported bare | The first budget for an entry | 706 bytes   | 637 bytes       | 1.5 KB     |
| 0.9.4   | `attachTable` alone      | The first budget for an entry | 2,016 bytes | 637 bytes       | 2.75 KB    |
| 0.9.4   | `attachForm` alone       | The first budget for an entry | 8,632 bytes | 637 bytes       | 9.25 KB    |

Each table stays the ledger, a row for each budget set and what set it. Since 0.9.4 the rule lowers
a budget as well as raising one. Where a release, measured as the audit was, leaves more room under
a budget, the budget less the size, than twice the median piece or function taken in the same
measure, the budget may be set again by the rule, lower, from that size and that median, with a row
that names what returned the bytes. This holds for the sheets, the controls' whole and each entry,
and not for the theme script, whose budget is a kilobyte of its own.

## The sheets beside other systems

When the sheets' budget was raised to 11.5 KB, other systems' stylesheets were measured beside them
on 2026-11-18, to judge whether the kit's weight still fits what it covers. Each file in the table
was fetched from jsDelivr at the path named, minified by Lightning CSS 1.33.0 and gzipped at level
9 by Node's zlib, with Web Awesome's sheet first bundled with the sheets it imports. The kit's three
sheets were joined in the order a page loads them, as a bundler sends them, and measured the same
way. The budget measures them another way, stripping only comments and blank lines and gzipping at
the default level, so the 9,579 bytes here and the 11,394 bytes of the 0.8.6 row are the same
sheets measured two ways. Sent as three files and each measured alone, the kit's sheets come to
10,201 bytes. The figures are a snapshot of the versions named, kept so the next raise starts from
them, and a row is checked again by fetching its file.

| System and file measured                                                    | What it covers                                     | Sent gzipped |
| --------------------------------------------------------------------------- | -------------------------------------------------- | ------------ |
| Simple.css, `simpledotcss@2.3.7/simple.min.css`                             | Plain HTML only, light and dark                    | 2,763 bytes  |
| Open Props, `open-props@1.7.23/open-props.min.css`                          | Tokens only, no pieces                             | 7,595 bytes  |
| The kit at 0.8.6, its three sheets joined                                   | Tokens, plain HTML and every piece, light and dark | 9,579 bytes  |
| Pico, `@picocss/pico@2.1.1/css/pico.classless.min.css`                      | Plain HTML, forms, light and dark                  | 9,984 bytes  |
| Pico, `@picocss/pico@2.1.1/css/pico.min.css`                                | The classless sheet plus a grid and a few pieces   | 11,293 bytes |
| Web Awesome, `@awesome.me/webawesome@3.15.0/dist-cdn/styles/webawesome.css` | Native elements, utilities and a theme             | 14,160 bytes |
| GOV.UK Frontend, `govuk-frontend@6.6.0/dist/govuk/govuk-frontend.min.css`   | Its pieces                                         | 15,814 bytes |
| Bootstrap, `bootstrap@5.3.9/dist/css/bootstrap.min.css`                     | Its pieces, a grid and utilities                   | 30,357 bytes |
| Bulma, `bulma@1.0.4/css/bulma.min.css`                                      | Its pieces, a grid and helpers                     | 64,651 bytes |

Measured the table's way when the budget was raised to 12 KB, the kit's sheets come to 9,587
bytes at 0.8.7 and 10,126 bytes with the prototype of the usability defaults in place, so with
every piece planned the kit stays between Pico's classless sheet and its full one.

The kit's sheets weigh about what Pico's do, a few hundred bytes either way by how they are sent,
while Pico draws plain pages, forms and a few pieces, and the kit also draws an app's frame, its tab
bar and toast, the dialog, the stepper, the rows and a grid of buttons. The larger systems weigh
more, though the figures compare sheets alone. Script is left out on every side, the kit's controls
included, which were held to 7.5 KB of their own then. Web Awesome keeps its pieces' styles in the
script that draws each one, so its sheet holds little of them, and GOV.UK's tabs and accordion and
Bootstrap's dialog and toast need script to work. The comparison is context for a raise and sets no
ceiling, since the rule above sets the budget.

## How it is tested

The paths are in `packages/design-kit`, and those of the budgets in the repository's `scripts`.

- `src/controls.test.ts` imports the module in plain Node and finds no export but its functions.
- `scripts/controls.test.ts` holds what a page's bundler sends for every function, without comments,
  to the controls' budget, the module imported bare, `attachTable` alone and `attachForm` alone to
  theirs, and the theme script to its own, and finds nothing of the theme script in a bundle of the
  theme names the controls import. `src/theme.test.ts` finds each theme word written in quotes as
  JSON writes it. `scripts/sheets.test.ts` holds the three sheets to theirs, and
  `scripts/parts.test.ts` the measure the record takes of each part.
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
- `e2e/panel.spec.ts` attaches a panel by its button and finds it started as the button says, opened
  and closed by the button and by its corner Close by pointer and keyboard with focus back on the
  button, every button that names it in step, a panel drawn again closed past a handler that stops
  the press, focus moved out of a panel the page's code closes, to what follows it or the main
  content, a Close in later content that reuses its id ignored, a button with no `aria-controls`
  refused, the same returned for a button attached twice, a stale detach leaving a button attached
  again alone, focus back on the button whose `set` opened the panel, the listener taken off only
  once every button is let go, a button the page points at another panel followed, an off button's
  press ignored and focus kept off it, a button attached later or drawn again following the panel as
  it is, and no accessibility violation with the panel open or closed, and in WebKit as well, a Done
  of the page's own pressed as Safari presses it, one that waits, one drawn away and one that moves
  focus first, an outer and an inner panel closed by one press, and a WebKit pointer press leaving
  the button unfocused, a link in the panel that closes it keeping the focus it moves or handing
  focus back where it moves none, and the Close tapped on a touch screen in WebKit.
- `e2e/pieces.spec.ts` holds how the switch, the pill and the copy button's words are drawn, that
  none cuts a word off under the wider text spacing a visitor may set, on a phone, and that the
  switch collapses to its name and one button in a demo's strip on a screen narrower than 20rem
  and keeps its row everywhere else.
