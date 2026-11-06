# 2. The kit's rules sit in dk layers, with a prefix and no weight

**Status:** accepted

## Context

The kit loads beside styles a demo already has. Those styles came first and use plain names, such
as `--bg` and `--accent` in both ShelfLens and inventory-reservations, and the portfolio's own
styles sit in layers of their own, `@layer base` and `@layer utilities`. The kit must take none of
a page's names, and a page's own rule must win over the kit's without the page having to outweigh
it.

## Options

**A. Unprefixed names.** The tokens as `--bg` and `--accent`, and the base as plain element
selectors. Rejected, since the names are the ones the demos already use, so loading the kit would
change what a demo's own rules draw, and a plain selector of the kit's ties with a page's and wins
whenever its sheet loads later.

**B. A prefix and `:where()` alone.** Every name prefixed, and every selector inside `:where()`, so
each rule weighs nothing, with no layer. Rejected, since a rule outside any layer wins over every
layered rule whatever its weight, so the portfolio's `@layer base` would lose to the kit's
unlayered rules.

**C. A prefix, dk layers, and `:where()` inside them.** Every name prefixed, every rule in a layer
of the kit's, and every selector but the kit's own classes inside `:where()`.

## Decision

Option C. The tokens open with `@layer dk.tokens, dk.base, dk.components;`, which fixes the order
of the kit's layers inside one `dk` layer, and each sheet fills only the layer it is named for.
Every custom property starts with `--dk-` and every class with `.dk-`. Inside the layers, every
selector but `.dk-visually-hidden` sits inside one `:where()`, so the kit's rules stay flat against
each other.

## Consequences

- A page's own rule outside a layer wins over the kit's however little it weighs and wherever its
  sheet loads, so a plain `body` or `h2` of a demo's needs nothing added.
- A page with layers of its own has a load order to get right. A layer takes its place in the order
  where its name first appears, so a page whose layers load before the kit's sheets, without naming
  `dk`, has put them first, and the kit's rules then win over its own. `@layer dk, page;` puts the
  page's layer over the kit's wherever it is written, and the README says so.
- The cut to motion for a visitor who asks for less is held with `!important`, since it is the
  visitor's choice. Important declarations run the layer order in reverse, so the kit's wins over a
  page's important rule outside a layer and in a layer after `dk`. An important rule in a layer the
  page orders before `dk` still wins over it.
- The visually hidden class carries a class's weight, since a page names it on purpose. It still
  loses to a page's rule outside a layer.

## How it is tested

The paths are in `packages/design-kit`.

- `src/scope.test.ts` reads each sheet and holds the layer order to the first statement of the
  tokens and nowhere else, every block to the layer its sheet is named for, every selector to the
  kit's own class or one `:where()` followed only by plain pseudo-classes, and custom properties to
  the tokens.
- `src/tokens.test.ts` holds every custom property to the `--dk-` prefix.
- `e2e/sheets.spec.ts` loads the kit in Chromium beside a page's own rules, before and after its
  sheets, and finds a plain rule and a weightless one of the page's winning, a page's layer winning
  when the kit loads first or when the page names `dk` first, the kit winning when the page names
  `dk` last or not at all, and a page's important transition cut short for a visitor who asks for
  less motion, outside a layer and in a layer after the kit's.
