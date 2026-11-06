# 7. A callout takes a role only when a page asks for one

**Status:** accepted

## Context

A callout sets a message apart from the page, as news, as something that went right or as
something that went wrong. Some of those messages are on the page when it loads, such as a notice
that a store is closed or an error the server drew. Others arrive after something the visitor did,
such as a save that worked. A screen reader reads a message that arrives only from a live region,
`role="status"` to be read when it is next idle or `role="alert"` to be read at once, and only when
the text changes after the region is on the page. An alert created with its text already in it is
read by some screen readers, read twice by some and not read by others, and it interrupts the
reading of the page's title.

## Options

**A. A role chosen from the tone.** Danger takes `role="alert"`, and success and info take
`role="status"`. Rejected, since every callout on the page at load would then be a live region
created with its text in it, read unreliably and over the page's title. A tone says what a message
is about, not whether it just arrived.

**B. No role unless the page asks.** A callout of any tone is plain markup, and `live` set to
`status` or `alert` puts that role on it.

## Decision

Option B. `Callout` draws no role in any tone unless the page passes `live`. The role goes on
`.dk-callout-body`, the message alone, so the actions after it are not read with it. A live callout
is drawn even when it is empty, so a page mounts it first and fills it after, which is when a
screen reader reads it. The tone is told by a visually hidden "Success: " or "Error: " before the
title, or before the message when there is no title, rather than by a role or by color alone.
`prefix` gives another word, and an empty string drops it.

## Consequences

- A page decides for each callout whether its message arrives after the page has loaded, and a
  page that forgets `live` on one that does leaves a screen reader saying nothing until the visitor
  reaches it.
- A page has to mount a live callout before it fills it. A live callout mounted with its message
  already in it is the case option A was rejected for.
- A field's error is not live either, for the same reason and one more: a form that fails in
  several fields at once would speak over itself. The page moves focus to the first invalid control
  or to an error summary instead.
- No test reads a callout aloud. The tests hold the markup, and the screen readers' behavior above
  is the reason for it.

## How it is tested

The paths are in `packages/design-kit`.

- `src/react.test.tsx` holds a callout of each tone to no role and no `aria-live` without `live`,
  to `role="status"` or `role="alert"` on `.dk-callout-body` with it, to a live body drawn when it
  is empty, to its actions outside the body, to the hidden word before the title or the message, to
  the word a `prefix` gives and to none for an empty one, and to a title drawn as the heading
  `headingLevel` names.
- `e2e/controls.spec.tsx` draws a callout of each tone with a link, a field and a button in it, and
  finds the focus ring on the button in each, the edge drawn in forced colors, and no axe findings
  in either theme.
- `src/tokens.test.ts` measures text, muted text and the accent at 4.5 to 1, and a control's edge at
  3 to 1, on the highlight and on each callout's ground, in both themes.
- `smoke/types.ts` fails to compile a tone outside the three against the packed package.
