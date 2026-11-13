# 8. A frame that scrolls is always a named region

**Status:** accepted, amended in 0.6.0 to say a frame shows whole on paper, its code and figures
wrapping

## Context

An explainer holds tables of figures and blocks of code, and either can be wider than its column, on
a phone or at a larger text size. The page itself must never scroll sideways, so whatever is wider
scrolls inside a frame of its own. A keyboard can scroll only what it can focus, and axe's
`scrollable-region-focusable` rule fails a frame that scrolls when neither it nor anything in it can
take focus. A frame that takes focus is announced as the keyboard reaches it, so it needs a name
that says what it holds. The explainers are hand-written HTML, and the kit ships no script for them.

## Options

**A. Code that wraps.** A block set to wrap its lines, so it never needs a frame. Rejected, since a
wrapped line loses its indentation and shows a line break the code does not have, so a reader
copying from it or reading its layout is misled.

**B. A frame that is a region only when it overflows.** A script measures each frame and adds the
role, the name and the tabindex only where it scrolls, so a wide screen keeps its tab stops.
Rejected, since a hand-written page would need a script the kit does not ship, and overflow
changes with zoom, text size and the window's width, so the script would measure again on every
change, and a frame it missed would fail the axe rule and be out of the keyboard's reach.

**C. The table's title as its `<caption>`.** Rejected, since a caption takes the table's width and
scrolls with it, and on a 320px screen it scrolled out of sight with the columns.

**D. A frame that is always a region, titled from outside it.** The title is a paragraph above the
frame. The frame is `role="region"`, named by the title through `aria-labelledby`, with
`tabindex="0"`, at every width. A table inside it is named by the same title. A code block is its
own frame, a `<pre>` with the same attributes, and keeps its lines as written on screen.

## Decision

Option D. A table sits in `.dk-table-scroll` under a `.dk-table-title`, and a block of code is a
`pre.dk-code` under a `.dk-code-title`. On screen both scroll sideways inside themselves, so the
page never does, and the title stays in place while the frame scrolls. On paper, where nothing
scrolls, both show whole, their code and figures wrapping so nothing is cut off, and a code block
keeps an edge in the line color, since the browser drops its ground. A code block's title says what
the code is for rather than its language, and the block carries `translate="no"`, never `lang`, so a
browser's translation of the page leaves the identifiers alone. A table is never stacked into cards
on a phone, since `display: block` on a table's parts drops its table semantics in WebKit, so its
frame is the one way a wide table fits.

## Consequences

- A frame takes a tab stop on a wide screen where it has nothing to scroll.
- Each frame is a landmark, so a page's list of landmarks grows with its tables and code blocks.
  Record 9 keeps the sections out of that list.
- The frame and the table share a name, so a screen reader entering the table through its frame
  can say the title twice.
- A page keeps each title's id in step with every `aria-labelledby` that points to it.
- On screen a long line of code is read by scrolling its block sideways, on a phone most of all.
- A code block gets a copy button only from a page's script, which sets it beside the title in a
  `.dk-code-head` and attaches it, so with no script a block has none.

## How it is tested

The paths are in `packages/design-kit`.

- `e2e/explainer.spec.tsx` draws an explainer with a table, and a code block in a section, in a
  panel and in a callout. It finds nothing to scroll the page sideways at 320, 390, 768 and 1280px
  wide, at the browser's text size and at twice it, and finds the table and each code block are
  what scroll at 320px. It finds each frame by its role and its title and the table by the same
  title, the keyboard tabbing to each frame in turn and scrolling the table with an arrow key, and
  a pointer press in a frame drawing no ring. It holds a code block to `white-space: pre` and
  `translate="no"`, and finds no axe findings in either theme, wide and on a phone.
- `e2e/print.spec.tsx` prints a code block and a scrolling table whole rather than cut at the frame,
  and a code block's edge in the line color.
