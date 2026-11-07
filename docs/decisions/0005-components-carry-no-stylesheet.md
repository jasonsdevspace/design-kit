# 5. The components carry no stylesheet of their own

**Status:** accepted

## Context

ShelfLens and inventory-reservations draw the same page chrome, each from a copy of its own: a skip
link, a strip above the page that says whose demo it is, and a footer below it. The kit is to hold
one copy of that chrome, for a page that renders with React and for one that writes its markup by
hand. The components have to load wherever a page renders them, plain Node included, and draw
under a policy that allows styles only from the page's own origin, `style-src 'self'`.

## Options

**A. Each component imports its own CSS.** `react.tsx` imports the sheet that styles it, so a page
that renders a component gets its styles with it. Rejected, since the compiled import of a `.css`
file throws in plain Node, where the smoke test and a server render load the module, and whether a
bundler keeps an import that nothing reads from rests on how it treats side effects under tree
shaking. Setting the styles inline instead, the way around both, breaks `style-src 'self'`.

**B. A sheet per component.** A `skip.css`, a `strip.css` and a `footer.css`, each exported on its
own. Rejected, since ShelfLens and inventory-reservations each draw all three, and the choice runs
one way. Splitting one sheet later only adds exports, while merging sheets later removes exports a
page already imports.

**C. One sheet, and markup alone from the components.** One `components.css` in the `dk.components`
layer styles the chrome by its classes. The components draw that markup and nothing else, and a
piece's state is an ARIA attribute, such as `aria-current` on the link to the page the strip sits
on, rather than a class of the kit's.

## Decision

Option C. `components.css` holds the skip link, the strip and the footer in `dk.components`, under
the page's own rules and over the base. `./react` exports `SkipLink`, `PortfolioStrip` and
`DemoFooter`, which import no sheet and set no `style` attribute, so they load in plain Node and
draw under `style-src 'self'`. The package README gives the markup each one draws.

## Consequences

- A page has to load `components.css` itself, after the tokens. A page that forgets it draws the
  chrome unstyled, and nothing fails.
- The markup is the contract a page without React writes by hand, so a change to a class, a
  landmark, a name or the order of the links is a change to every such page as well as to the
  components.
- A page that draws only some of the chrome still loads the rules for all of it.
- The sheet sits in a layer of the kit's, so a page's own rule outside a layer wins over it, as over
  the rest of the kit.

## How it is tested

The paths are in `packages/design-kit`.

- `src/react.test.tsx` renders each component to a string and holds its markup to the contract: the
  elements and their classes, the landmarks and their names, the links in their order,
  `aria-current` on the current page in the strip and the footer, the switches' section only when
  there are switches, and unnamed with only their room in it while they are on their way, the
  footer's markup exactly, with what a demo adds after it, and no link anywhere in the chrome
  opening a new tab. Switches or footer additions that are null or false draw nothing.
- `e2e/chrome.spec.tsx` draws that markup with the kit's sheets in Chromium and finds the strip one
  row over its rule on a wide screen and rows of links on a phone, whatever the font, the switches
  beside the links or on a row below them, the room of switches on their way holding the strip at
  the height they give it, the skip link out of sight until the keyboard reaches it and then at the
  column's inset where the strip's links start, one inside a positioned box down the page out of
  sight and out of the way of a click until focused and then at the top of its box, each landing on
  what it skips to, the footer's rule the width of the page with its text in the column, the link
  to the current page on an explainer drawn apart from the others by its weight in each theme and
  in forced colors, and no axe findings in either theme, on a wide screen or a phone, with the
  switches or their room, on a demo or its explainer.
- The same spec serves that markup and the kit's sheets from an origin of its own under
  `style-src 'self'`, and finds the strip laid out as before with nothing refused.
- `src/scope.test.ts` reads every sheet, `components.css` among them, and holds its rules to
  `dk.components`, its selectors to the kit's own classes or one `:where()` followed at most by a
  focus pseudo-class, and its custom properties to none.
- The oldest Node job in CI installs the packed package into an empty project with React beside
  it, where `smoke/consumer.mjs` finds `components.css` where its export resolves and draws the
  strip from `./react` in plain Node, and `smoke/types.ts` type-checks the strip's props as Node
  and as a bundler resolve them.
