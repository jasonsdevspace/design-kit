# 13. The kit's controls ship their behavior as a module a page attaches to their markup

**Status:** accepted, amended by record 15, for the toast and the dialog, whose attach functions
return what shows or opens them, by record 20, for React pages, which draw the status line with
`StatusProvider`, which `useStatus` finds, and attach a form, a busy button, progress and a group of
cells and move focus through a kit hook rather than an effect of their own, in 0.7.0 to set the
sheets' budget at 9.25 KB by the same rule, once the toast's group of buttons and a table frame's
shade took the sheets past 9 KB, in 0.8.0 to set it at 10.25 KB, once the pieces planned for it took
the sheets past 9.25 KB, in 0.8.2 to set it at 10.75 KB, once its corner Close took the sheets past
10.25 KB, in 0.8.4 to set the controls' budget at 7.5 KB, once `attachPanel` took them past 6.25 KB,
in 0.8.6 to set the sheets' budget at 11.5 KB, once a grid of buttons dropping to a count that
divides its cells took the sheets past 10.75 KB, for 0.9.0 to set it at 12 KB, once the pieces
planned for it took the sheets past 11.5 KB, and to set the controls' budget at 8.75 KB, once a
stepper's range in words, its limits said and a page's own words and line took them past 7.5 KB,
then at 11 KB, once moving focus after a change and among a group's cells took them past 8.75 KB,
and then at 12 KB, once refusing a form and a busy button took them past 11 KB, and then at 12.75
KB, once saying progress at its steps took them past 12 KB, and then at 15.5 KB, once checking a
form against the browser's constraints took them past 12.75 KB, and then at 17 KB, once telling a
press that brings a view from a key that moves took them past 15.5 KB, and in 0.9.0 to set the
controls' budget at 17.25 KB and the sheets' at 12.25 KB, once the release, measured whole, left
less room under each than a function or a piece of the usual size, and for the listener the module
adds to the document as it loads, which notes the visitor's last press for `focusOnArrival`, and
which the package marks as a side effect so a bundler keeps the module where a page imports it for
that alone

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
whether the visitor's last input was a press for `focusOnArrival`, as the 0.9.0 amendment has it.
The package's `sideEffects` lets a bundler drop the module, listeners and all, from a page that
imports nothing from it or only imports it bare, so a page that counts on the first press being
heard imports something it uses from the module as it starts, and the listeners wait for a document,
so the module loads in Node. The functions set no style. The choices a switch saves, `system` and
the two themes, are `THEME_CHOICES` in `./theme`, beside the key the theme script reads, and the
theme script itself does not change, so its hash holds.

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

By the same rule, for 0.8.0 the sheets were measured with every piece planned for it in place. They
weigh 10,220 bytes sent together, against 9,432 without them, and the median a piece costs is now
177 bytes, so the rule sets the sheets at 10.25 KB. The package record measures three more parts,
the site's header, the content page and the icon.

For 0.8.2 the sheets were measured with its three changes in place, a tile in a panel holding its
inset, a Close in the corner and a picture drawn at its content's height, the last of which lands
after the Close. They weigh 10,695 bytes sent together, and the median a piece costs is now 193
bytes, so the rule sets the sheets at 10.75 KB.

For 0.8.4 the controls were measured with `attachPanel` in place, which a page that opens a panel
with a button attaches so its corner Close needs no script of the page's own, and with the fixes
that keep an off button from acting and a button attached later from moving the panel. Every
function sent together weighs 6,898 bytes, past the 6.25 KB the budget held, and the median a
function adds is now 668 bytes, so the rule sets the controls at 7.5 KB.

The sheets were measured for 0.8.4 too, with its bands, its icon sizes and the app frame's named
sides in place. They weigh 10,916 bytes sent together, 92 bytes under the 10.75 KB they hold, and
the median a piece costs is now 165 bytes. A piece of the usual size would take them past the
budget, and the rule then sets them at 11 KB. The budget stays at 10.75 KB until a piece outgrows
it, as the rule has it, so the piece that does says so with its figures.

For 0.8.5 the controls were measured with a panel's focus on closing settled, as record 19 has it,
and a toast's buttons given their tabindex. Every function sent together weighs 7,661 bytes, 19
bytes under the 7.5 KB they hold, and the median a function adds is now 657 bytes. A function of the
usual size would take them past the budget, and the rule then sets them at 8 KB. The budget stays at
7.5 KB until a function outgrows it, as the rule has it.

For 0.8.6 the sheets were measured with a grid of buttons dropping to a count of columns that
divides its cells, which works out a column's width at each count from two to six in the sheet,
since no page media query may do it. They weigh 11,394 bytes sent together, past the 10.75 KB they
held, and the median a piece costs is now 169 bytes, so the rule sets the sheets at 11.5 KB.

For 0.9.0 the sheets were measured with every piece planned for it in place, as they were for 0.8.0:
a dock row for a compact action, a busy button, a region that is loading, a mark for a required or
optional field, the stack's steps, a split row, a note, a large numeral, progress, a read-only
field, an empty state and a hero beside its picture. Their rules were written as a prototype and
formatted as the sheets are, since the pieces land one at a time and the budget is raised once for
them. The sheets weigh 11,398 bytes sent together at 0.8.7 and 12,112 with the prototype in place,
and the median a piece costs is still 169 bytes, so the rule sets the sheets at 12 KB. A piece that
lands heavier than its prototype and outgrows that says so with its figures, as the rule has it, and
the package record measures the pieces as they ship.

For 0.9.0 the controls were measured with a stepper that describes its field by its range in
words, says when a press lands on a limit, and takes a page's own words to say after the value and
a page's own status line to say them on. Every function sent together weighs 8,112 bytes, past the
7.5 KB they held, and the median a function adds is now 655 bytes, so the rule sets the controls at
8.75 KB.

The controls were measured again with `moveFocus`, which moves focus once a change is drawn, and
`attachRoving`, which moves among a group's cells by the arrow keys, in place, as 0.9.0
gives them with its other behaviors. Every function sent together weighs 10,372 bytes, past the 8.75
KB they held, and the median a function adds is now 650 bytes, so the rule sets the controls at 11
KB.

The controls were measured again with `attachForm`, which refuses a form, and `attachBusy`, which
says a busy button's wait, in place. Every function sent together weighs 11,524 bytes, past the 11
KB they held, and the median a function adds is now 672 bytes, so the rule sets the controls at 12
KB.

The controls were measured again with `attachProgress`, which says progress at its steps, and the
polite words it says, in place. Every function sent together weighs 12,340 bytes, past the 12 KB
they held, and the median a function adds is now 622 bytes, so the rule sets the controls at 12.75
KB.

The controls were measured again with `attachForm` checking a form against the browser's
constraints itself, with the words for each way a field fails, as record 21 has it. Every function
sent together weighs 15,034 bytes, past the 12.75 KB they held, and the median a function adds is
now 620 bytes, so the rule sets the controls at 15.5 KB.

The controls were measured again with `focusOnArrival`, which tells a press that brings a view from
a key that moves or typing, in place, beside the form's check. Every function sent together weighs
16,730 bytes, past the 15.5 KB they held, and the median a function adds is now 608 bytes, so the
rule sets the controls at 17 KB.

The controls were measured again with every function of the release in place, a stepper's own `say`
and the lookups that find a piece's parts inside a shadow root among them. Every function sent
together weighs 16,985 bytes, under the 17 KB they held but with less room than a function of the
usual size, and the median a function adds is now 622 bytes, so the rule sets the controls at 17.25
KB. It is set again here, before anything outgrows it, since a release is measured whole, as the
audit of 0.6.0 was, and leaves room for one more of the usual size.

With every piece of the release landed, the sheets weigh 12,225 bytes sent together, 113 heavier
than the prototype and with less room under 12 KB than a piece of the usual size, and the median a
piece costs is now 144 bytes, so the rule sets the sheets at 12.25 KB. It is set again here, before
anything outgrows it, for the same reason as the controls'.

## The sheets beside other systems

When the sheets' budget was raised to 11.5 KB, other systems' stylesheets were measured beside them
on 2026-11-18, to judge whether the kit's weight still fits what it covers. Each file in the table
was fetched from jsDelivr at the path named, minified by Lightning CSS 1.33.0 and gzipped at level
9 by Node's zlib, with Web Awesome's sheet first bundled with the sheets it imports. The kit's three
sheets were joined in the order a page loads them, as a bundler sends them, and measured the same
way. The budget measures them another way, stripping only comments and blank lines and gzipping at
the default level, so the 9,579 bytes here and the 11,394 bytes of the 0.8.6 paragraph are the same
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
