# 17. A content page is a container of its own

**Status:** accepted

## Context

A plain content page, such as a landing page or an about page, holds a title, a lead, an action and
sections of prose, tables and grids. The kit spaced the pieces in an explainer, a panel, an app's
body and a dialog, but a page that was none of these had no container, and the kit resets the body
alone. Each page that wanted its blocks and sections spaced reset the browser's margins and spaced
its sections by hand, and none held its lead to the same measure. The kit needed a way for such a
page to space and hold its content with kit classes alone.

## Options

**A. A reset of every block's margins in the base sheet.** Rejected, since it reaches every page
that loads the base, the ones with layouts of their own among them, and takes away the browser's
spacing where a page relied on it, a change no page asked for. A reset also spaces nothing, so each
page would still set its steps.

**B. The explainer, used for a content page too.** Rejected, since the explainer is a page about a
demo: it holds every part to the measure, opens each section on a rule and a number and pads above
itself for the header it follows. A content page sets a table or a grid of tiles at the column's
width and has no numbered sections, so it would override most of what the explainer draws.

**C. A container of its own, `dk-page`, on the page's main content.** It spaces what it holds by the
same flow the explainer uses, and draws nothing else.

## Decision

Option C. `dk-page` spaces its children by `--dk-flow-step` and its sections by `--dk-space-7`,
with nothing above its first child, sets its `h1` at the display size, and holds only its prose to
the measure. The spacing is set between its children, never on their own margins, so a reader's
own sheet that adds room under a paragraph adds room and breaks nothing. `dk-lead` is the
explainer's lead under a name of its own, held to the measure wherever it sits.

## Consequences

- A content page needs no rule of its own to space its content, and a page with its own layout is
  left as it was, since nothing reaches it without the class.
- The page sets its column's width and side padding, as it would around any content, since a
  landing page and an about page differ in both.
- The explainer and the content page share the flow's rules, so a change to the flow's step changes
  both, which is what a reader moving between them expects.

## How it is tested

The path is in `packages/design-kit`.

- `e2e/layouts.spec.ts` draws a content page and holds the step between its blocks, the larger step
  between its sections, nothing above its first child, prose and the lead at the measure beside a
  table at the column's width, its `h1` at the display size, its keyboard order at a phone's width
  and a wide one, and nothing cut off or scrolling sideways at 320 wide, at twice the text size and
  under the wider text spacing WCAG allows.
