# 16. A page changes how a piece draws only through the properties it names

**Status:** accepted, amended in 0.8.7 to start with `--_dk-` the name of a property the kit declares only for its own sums, once a grid of buttons put its working values in the tokens sheet, where the tokens page listed them as tokens

## Context

Every kit piece is a drop-in: a page writes it as the reference writes it, and it aligns, spaces
itself and works with no rule of the page's own over it. Some pieces still need a page's choice,
which the kit cannot make for every page: a scorekeeping app lays a game's color under each game to
start, lifts its keys and cards on a lip of its own, and fits its stepper to scores of three
figures. The raised panel and the tiles came from those needs, and the pinned table column, the grid
of buttons and the stepper already asked for the same kind of choice, a ground or a width. The kit
needed one way for a page to make such a choice that neither breaks the drop-in promise nor ties the
page to the kit's inner rules.

## Options

**A. A page's own class over a kit piece.** The page writes `.games .dk-row { background: ... }`
for its tiles. Rejected, since a rule over a kit class is what the drop-in promise turns down: it
reaches into rules the kit may change in a patch, it has to win on weight against rules the kit
keeps weightless on purpose, and nothing tells the page which of a piece's declarations are safe to
replace.

**B. A token for each choice.** The kit declares `--dk-tile-ground` and the rest in `tokens.css`
with a value of its own, and a page sets it again. Rejected, since a token is a value every page
shares, and many of these are a choice for one piece in one place, such as one game's ground among
several, which a page sets on that piece rather than on its root. A token with a default also
reads as part of the palette, so a page could not tell a role it must fill from a knob it may leave.

**C. A property the kit names and leaves unset.** The sheets read `var(--dk-tile-ground,
var(--dk-ground-step, var(--dk-surface)))`, and a page sets `--dk-tile-ground` on its root or on the
piece by a class of its own. The kit draws the piece, and the property is the one thing the page
changes.

## Decision

Option C. A page changes how a piece draws only through a property the kit names for it. The sheets
read each with a fallback, so the piece draws its default until a page sets one, and the kit leaves
each unset on the page's root, setting one only on a piece of its own whose default differs, as a
tall grid of buttons sets its cell's least width. The reference lists every such property in its
table of properties a page sets, with its default and, where it sets a ground, the contrast what
sits on it must hold. A page sets a ground's light and dark values in one `light-dark()`, so it
holds in both themes.

Since 0.8.7 a property the kit declares only for its own sums, such as the widths a grid of buttons
works its columns out with, has a name that starts with `--_dk-`. A leading underscore is the common
sign in CSS that a custom property is private to what declares it, and the `dk-` after it keeps the
kit's names from meeting a page's. Such a property is never in the reference and never for a page to
read or set, so any release, a patch included, may rename or drop it, and the site's tokens page
leaves it out. It beat filtering the grid's names on the tokens page alone, which would leave the
next piece's working values to look like tokens the same way.

## Consequences

- A page reaches a piece without a rule over a kit class, so a page's look survives the kit's
  changes to how a piece is drawn, as long as the property keeps its name and its meaning.
- A property that sets a ground hands the page the duty to keep the piece's text and signs to their
  contrast on it, which the kit's palette test cannot check, so the reference states each duty and a
  page's own audit holds it.
- Renaming or dropping a property a page sets is a change a page must act on, so it goes under
  Upgrading in the changelog, as a token's would.
- A new piece that needs a page's choice adds a property of this kind, named for the piece and the
  choice, rather than a token or a class a page writes over.
- A new piece that works a value out for itself names it with `--_dk-`, so renaming or dropping it
  later asks nothing of a page.

## How it is tested

The path is in `packages/design-kit`.

- `src/scope.test.ts` reads every property the sheets read with a fallback and fails when one is
  missing from the reference's table of properties a page sets, when the table lists one the sheets
  no longer read, when a row leaves its default or what it sets empty, or when a default written as
  a number is not the sheets' fallback, so the table cannot fall behind the sheets.
- It also fails when a rule in the tokens sheet outside a `:where(:root)` rule declares a property
  the reference does not name and whose name does not start with `--_dk-`, or when the reference
  names a `--_dk-` property. `src/tokens.test.ts` fails when the sheet declares a property whose
  name starts with neither `--dk-` nor `--_dk-`, or when the tokens read from it, which the site's
  tokens page lists, hold a `--_dk-` property, and it checks that the sheet declares one, so the
  second check cannot pass on a sheet with none.
