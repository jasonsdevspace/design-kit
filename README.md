# design-kit

`@jasonsdevspace/design-kit` is what the demos on [jasonsdevspace.com](https://jasonsdevspace.com)
are meant to share: the design tokens, base styles, theme script, page chrome, buttons, fields and
callouts, and the explainer page with its steps, panels, tables and code blocks. Each version from
`0.1.0-next.1` on is staged on npm from a tag, and goes live when it is promoted.

**Why I built it.** My demos each carry their own copy of the same things. ShelfLens and
inventory-reservations both ship a `theme.js` that reads the theme a visitor saved on the portfolio
and sets it before the first paint, the same script line for line, and each names its colors in
custom properties of its own, such as `--bg` and `--accent`. A change to how a theme is chosen has
to be made in every repository, and a new demo would copy it again. I wanted one package a
demo could load beside the styles it already has, without either side taking the other's names or
overruling the other's rules, and I wanted each of those promises held by a test, since a
stylesheet that loses the cascade fails without an error.

## Using it in a demo

A page loads the sheets, tokens first, through a bundler that resolves package exports, such as
Vite.

```css
@import '@jasonsdevspace/design-kit/tokens.css';
@import '@jasonsdevspace/design-kit/base.css';
@import '@jasonsdevspace/design-kit/components.css';
```

The tokens are the scale a page's styles are drawn from and the color roles, every name with the
`--dk-` prefix. The base gives the page its type and colors, one focus ring for every link and
control, a `.dk-visually-hidden` class, code in running text a step under the text around it, and
less motion for a visitor who asks for it. The components sheet styles the page chrome a demo draws
around its page, a skip link, a strip above the page that says whose demo it is and a footer below
it, the buttons, text fields, selects and callouts on the page itself, and the explainer, the page
that says how a demo works, with the steps, panels, tables and code blocks it holds. A control's
state is the attribute a screen reader already reads, such as `aria-pressed` or `aria-invalid`, and
every rule in `components.css` past the page chrome weighs nothing, so a state wins over the resting
look, and a piece over the layout it sits in, by its order in the sheet, and a page's own rule
outside a layer wins over all of them.

A page built with Vite takes the theme script from the plugin, and marks where it goes in its head
with a placeholder.

```ts
import { themeScriptPlugin } from '@jasonsdevspace/design-kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({ plugins: [themeScriptPlugin()] });
```

```html
<head>
    <!-- theme-script -->
</head>
```

The plugin puts the script inline in place of the comment. A page with no placeholder fails the
build, since without the script it would draw the system's theme rather than the visitor's, and so
does a page with two. Vite 8 or later is an optional peer of the package, needed only by a page that
uses the plugin.

A page built some other way writes the script into its head itself, inside a `<script>` element
before the body, from `@jasonsdevspace/design-kit/theme`.

```ts
import { themeScript } from '@jasonsdevspace/design-kit/theme';

const head = `<script>${themeScript}</script>`;
```

A page with React draws the chrome and the controls from `@jasonsdevspace/design-kit/react`, and a
page without it writes the same markup by hand, as the package README gives it for
[the chrome](packages/design-kit/README.md#page-chrome) and for
[buttons, fields and callouts](packages/design-kit/README.md#buttons-fields-and-callouts). Every
page writes [an explainer](packages/design-kit/README.md#explainer-pages) by hand, since
`./react` draws none of it. React `^19.3.0` is an optional peer of the package, needed only by a
page that imports `./react`.

```tsx
import { DemoFooter, PortfolioStrip, SkipLink } from '@jasonsdevspace/design-kit/react';

export const Page = () => (
    <>
        <SkipLink />
        <PortfolioStrip about="./about/" source="https://github.com/jasonsdevspace/example" />
        <main id="main-content" tabIndex={-1}>
            <h1>Example</h1>
        </main>
        <DemoFooter
            name="Example"
            about="./about/"
            source="https://github.com/jasonsdevspace/example"
        />
    </>
);
```

The components ship no stylesheet and set no `style` attribute, so a page loads `components.css`
itself, and a page whose policy allows styles only from its own origin still draws them. The strip
and the footer line their content up with the page's column, `--dk-column`, which a page whose
column is another width sets to it.

## Themes and palettes

Each color role holds its light and its dark value in one `light-dark()`. A page follows the
system's color scheme, or the theme set as `data-theme="light"` or `data-theme="dark"` on its root.
A page with its own palette sets the roles again on `:root`, both values at once, and wins whichever
sheet loads first, as long as that rule sits outside a layer or in one after the kit's. A page can
also set them on one container, which restyles only what is inside it, in both themes.

```css
:root {
    --dk-accent: light-dark(#2f5bd3, #7b9cff);
}
```

`packages/design-kit/src/tokens.test.ts` measures the default palette in both themes, against the
pairings it is meant for. Text, muted text, the accent, and the success and danger colors pass 4.5
to 1 on the page, a card and anything raised, and a control's edge passes 3 to 1 on each of those.
Text on the accent passes 4.5 to 1. Text, muted text and the accent pass 4.5 to 1 on the highlight
and on the success and danger grounds as well, and a control's edge passes 3 to 1 on them, so a
button or a field keeps its edge inside a callout of any tone. The success and danger colors pass
4.5 to 1 on their own grounds. The focus ring is drawn in the accent, so it is held as a link is. A
pairing outside that list, such as a line against its ground, carries no ratio, and a page that
sets its own palette answers for its own pairings.

## Layers, and how a page's own styles win

Every rule in the kit sits in one of its cascade layers, `dk.tokens`, `dk.base` and `dk.components`,
which the tokens declare in that order, and each sheet fills its own. A page's own rule outside a
layer wins over every rule of the kit's but the cut to motion, however little it weighs and
wherever its sheet loads. Inside the layers, every selector is either one of the kit's own classes,
such as `.dk-strip` or `.dk-visually-hidden`, or one `:where()`, followed at most by a focus
pseudo-class. The base alone follows a `:where()` with a pseudo-element instead, such as `::before`
or `::backdrop`, where a rule for every element has to reach it too, since a pseudo-element inside
a `:where()` matches nothing. So only the kit's classes, the focus rules and those pseudo-elements
carry any weight, and none of that weight counts against a page's own rule outside a layer.

A page with layers of its own names where `dk` goes among them, and this is where load order bites.
A layer takes its place in the order where its name first appears. A page whose own layers load
before the kit's sheets, without naming `dk`, has put its layers first, and the kit's rules then win
over its own. `@layer dk, page;` puts the page's layer over the kit's when it is written before
any rule of the page's layer. `@layer page, dk;` puts the kit's over the page's only when written
before the kit's sheets. So a page whose own layers load first names `dk` first, before any of
their rules, if it means its own to win.

The cut to motion is held with `!important`, since it is the visitor's choice. It wins over every
normal rule a page writes, and over an important one in a sheet, outside a layer or in a layer
after the kit's. An important declaration in a `style` attribute still wins over it, as does an
important rule in a layer the page orders before the kit's.

## The theme a visitor saved

The portfolio saves a visitor's theme in `localStorage` under the key `theme`, as `light`, `dark` or
`system`. `@jasonsdevspace/design-kit/theme` exports that key as `THEME_KEY`, the two themes as
`THEMES`, and `themeScript`, the script that sets `data-theme` on the root before anything paints.
It follows the system's theme when nothing is saved, when `system` or any value but the two themes
is saved, and when the browser refuses the page its storage, as the portfolio's own script does. It
sets the theme again when the system's changes, and when the portfolio saves a choice or clears it
in another tab. Where the browser cannot report the system's scheme, the script reads it as light,
as the portfolio's does too, so a saved theme still applies there.

Storage belongs to an origin, so the script reads what the portfolio saved only on the portfolio's
own origin, where each demo is served under a path of jasonsdevspace.com. A demo served anywhere
else, a dev server on localhost included, finds nothing saved and follows the system.

`@jasonsdevspace/design-kit/vite` also exports `themeScriptHash`, the script's hash as a Content
Security Policy source, for a page whose policy allows inline script only by its hash. It holds
while nothing after the plugin rewrites the inline script, as a minifier of a page's HTML would,
and it is the hash of the script in the installed version, so a policy reads it from the package
rather than keeping a copy.

## Browser support

The color roles are written with `light-dark()`, which sets the floor: Chrome and Edge 123, Firefox
120 and Safari 17.5. Cascade layers and `:where()` are older than that. The browser tests run only
in Chromium, so the other engines are held to the floor by what they document, not by a test here.

## The gotchas, and the test behind each

| Gotcha                                                                                                | Where it is tested                           |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| A page's own rule outside a layer wins, however little it weighs                                      | `packages/design-kit/e2e/sheets.spec.ts`     |
| A page's layers placed before the kit's lose to it unless they name `dk` first                        | `packages/design-kit/e2e/sheets.spec.ts`     |
| Each rule is in its own dk layer, and only a class, a focus rule or a base pseudo-element adds weight | `packages/design-kit/src/scope.test.ts`      |
| Every rule past the page chrome sits in a `:where()`, the explainer's layout included                 | `packages/design-kit/src/scope.test.ts`      |
| A page's `::before` and `::after` take the border box                                                 | `packages/design-kit/e2e/sheets.spec.ts`     |
| Reduced motion reaches `::before`, `::after`, `::backdrop` and a view transition                      | `packages/design-kit/e2e/sheets.spec.ts`     |
| Reduced motion cuts a page's important transition, unlayered or layered after the kit                 | `packages/design-kit/e2e/sheets.spec.ts`     |
| A palette set on a container restyles only what is inside it                                          | `packages/design-kit/e2e/sheets.spec.ts`     |
| The focus ring is drawn in the accent, and not on a section a skip link moves focus to                | `packages/design-kit/e2e/sheets.spec.ts`     |
| A label hidden from the eye is still read by a screen reader                                          | `packages/design-kit/e2e/sheets.spec.ts`     |
| Every measured pairing passes its WCAG ratio in both themes                                           | `packages/design-kit/src/tokens.test.ts`     |
| Text, the accent and a control's edge pass on the highlight and each callout's ground                 | `packages/design-kit/src/tokens.test.ts`     |
| Nothing saved, `system`, an unknown value and refused storage follow the system                       | `packages/design-kit/e2e/theme.spec.ts`      |
| A browser that cannot report its scheme draws light or the saved theme, and hears other tabs          | `packages/design-kit/e2e/theme.spec.ts`      |
| The theme is set before the body is parsed                                                            | `packages/design-kit/e2e/theme.spec.ts`      |
| The theme follows the system as it changes, while nothing is saved                                    | `packages/design-kit/e2e/theme.spec.ts`      |
| A choice saved in another tab, or storage cleared there, reaches the page                             | `packages/design-kit/e2e/theme.spec.ts`      |
| The key and themes are the portfolio's, and the tokens have a rule for each                           | `packages/design-kit/src/theme.test.ts`      |
| The script holds nothing that would end its element, and compiles                                     | `packages/design-kit/src/theme.test.ts`      |
| A page with no placeholder, or with two, fails the build                                              | `packages/design-kit/src/vite.test.ts`       |
| The hash is of the script exactly as the plugin writes it                                             | `packages/design-kit/src/vite.test.ts`       |
| The chrome draws the markup a page without React writes, and opens no link in a new tab               | `packages/design-kit/src/react.test.tsx`     |
| A button never submits unless a page says so, and an off one runs no click handler                    | `packages/design-kit/src/react.test.tsx`     |
| A toggle has `aria-pressed` whether on or off, and an action has none                                 | `packages/design-kit/src/react.test.tsx`     |
| A button hands its ref on to the `<button>` it draws                                                  | `packages/design-kit/src/react.test.tsx`     |
| Focus moved through a button's ref lands on the kit's button                                          | `packages/design-kit/e2e/ref.spec.ts`        |
| A field lists only what it draws in `aria-describedby`, and is invalid only with an error             | `packages/design-kit/src/react.test.tsx`     |
| A callout has a role only when the page asks, and its actions sit outside the message                 | `packages/design-kit/src/react.test.tsx`     |
| A live callout is drawn empty, and success and danger say their tone in words                         | `packages/design-kit/src/react.test.tsx`     |
| The strip is one row over its rule on a wide screen, and rows of links on a phone                     | `packages/design-kit/e2e/chrome.spec.tsx`    |
| A demo's switches sit beside the links on a wide screen, and on a row below them on a phone           | `packages/design-kit/e2e/chrome.spec.tsx`    |
| The strip keeps the room of switches on their way, at the height they give it at every width          | `packages/design-kit/e2e/chrome.spec.tsx`    |
| The skip link is out of sight until the keyboard reaches it, and lands on the content                 | `packages/design-kit/e2e/chrome.spec.tsx`    |
| A skip link inside a positioned box stays out of sight and out of the way of a click until focused    | `packages/design-kit/e2e/chrome.spec.tsx`    |
| The footer's rule spans the page, and its text and the strip's links line up in the column            | `packages/design-kit/e2e/chrome.spec.tsx`    |
| The chrome has no axe findings in either theme, on a wide screen and on a phone                       | `packages/design-kit/e2e/chrome.spec.tsx`    |
| The chrome draws with no inline style, under a policy that allows styles only from its origin         | `packages/design-kit/e2e/chrome.spec.tsx`    |
| A button and a field stand level, at the field height wide and the target on a phone                  | `packages/design-kit/e2e/controls.spec.tsx`  |
| Field text is 16px or more on a phone, and every control fits 320px wide                              | `packages/design-kit/e2e/controls.spec.tsx`  |
| An off button stays in the tab order, and is drawn as a disabled one is                               | `packages/design-kit/e2e/controls.spec.tsx`  |
| A pressed toggle has a thicker edge as well as a ground, and keeps its name                           | `packages/design-kit/e2e/controls.spec.tsx`  |
| A field is named by its label, and described by its hint and then its error                           | `packages/design-kit/e2e/controls.spec.tsx`  |
| The focus ring follows the keyboard, on the accent button and inside every callout                    | `packages/design-kit/e2e/controls.spec.tsx`  |
| Pressed and off stay apart in forced colors, a callout keeps its edge, and the select's arrow returns | `packages/design-kit/e2e/controls.spec.tsx`  |
| The controls have no axe findings in any state, in either theme, wide and on a phone                  | `packages/design-kit/e2e/controls.spec.tsx`  |
| An explainer marks its link to how it works as the current page in the strip and the footer           | `packages/design-kit/e2e/explainer.spec.tsx` |
| An explainer's text starts where the strip's links do, and holds to the measure                       | `packages/design-kit/e2e/explainer.spec.tsx` |
| A line of the lead and of body text runs to 80 characters or fewer on a wide screen                   | `packages/design-kit/e2e/explainer.spec.tsx` |
| A section opens with its rule, its number, its heading and then its text                              | `packages/design-kit/e2e/explainer.spec.tsx` |
| The page never scrolls sideways at any width or text size, and only the frames do                     | `packages/design-kit/e2e/explainer.spec.tsx` |
| Nothing clips text spaced out as far as WCAG asks, on a phone                                         | `packages/design-kit/e2e/explainer.spec.tsx` |
| Each frame is named by its title, and the keyboard reaches and scrolls it                             | `packages/design-kit/e2e/explainer.spec.tsx` |
| A table reads by its column and row headers, with its figures set to the right                        | `packages/design-kit/e2e/explainer.spec.tsx` |
| Code keeps its lines whole, and inline code is a step under the text and breaks where it must         | `packages/design-kit/e2e/explainer.spec.tsx` |
| The skip link lands on the content, and an in-page link keeps its section's number in sight           | `packages/design-kit/e2e/explainer.spec.tsx` |
| No section is a landmark, each frame is, and the steps stay a list                                    | `packages/design-kit/e2e/explainer.spec.tsx` |
| A panel sits on the card ground, with an edge that stays in forced colors                             | `packages/design-kit/e2e/explainer.spec.tsx` |
| An explainer page has no axe findings in either theme, wide and on a phone                            | `packages/design-kit/e2e/explainer.spec.tsx` |
| Each sheet resolves and each module loads from the packed package, on the oldest Node                 | `packages/design-kit/smoke/consumer.mjs`     |
| The strip draws its markup from the packed package, with the React a page has                         | `packages/design-kit/smoke/consumer.mjs`     |
| A field makes its ids with `useId` in a server render of the packed package                           | `packages/design-kit/smoke/consumer.mjs`     |

## Decisions

Each choice with a real alternative is a record in [docs/decisions](docs/decisions), with the
options rejected, what the choice costs, and the test behind it.

1. [The kit is a workspace, built on pack and installed from npm](docs/decisions/0001-a-workspace-built-on-pack.md).
   A demo installs what npm packs, with no script of the kit's to run, rather than
   building the kit from git with every tool the repository checks itself with.
2. [The kit's rules sit in dk layers, with a prefix and no weight](docs/decisions/0002-rules-sit-in-dk-layers.md).
   A page's own rule wins however plain it is, at the cost of a load order a page with layers of
   its own has to get right.
3. [Each color holds both themes in one light-dark()](docs/decisions/0003-one-light-dark-per-color.md).
   A palette is set in one place for both themes, at the cost of a browser floor and of anything
   but a color varying by theme.
4. [One theme contract with the portfolio, set before the first paint](docs/decisions/0004-one-theme-contract.md).
   The key, the themes and the script live in the kit, and a page that forgets the script fails its
   build, at the cost of a contract that holds only on the portfolio's origin.
5. [The components carry no stylesheet of their own](docs/decisions/0005-components-carry-no-stylesheet.md).
   The components draw markup and nothing else, so they load in plain Node and draw under
   `style-src 'self'`, at the cost of a sheet each page loads itself and markup a page without
   React has to keep to.
6. [A control's state is an attribute, and its rules weigh nothing](docs/decisions/0006-a-control-state-is-an-attribute.md).
   What a visitor sees and what a screen reader hears come from one attribute, and an off button
   keeps its focus, at the cost of a click handler a page without React has to write itself.
7. [A callout takes a role only when a page asks for one](docs/decisions/0007-a-callout-takes-a-role-only-when-asked.md).
   A message on the page when it loads is never read out of turn, at the cost of a page deciding
   for each message whether it is live.
8. [A frame that scrolls is always a named region](docs/decisions/0008-a-scroll-frame-is-always-a-region.md).
   A wide table or block of code scrolls inside a frame the keyboard reaches, with no script, at
   the cost of a tab stop on a wide screen where nothing scrolls.
9. [An explainer's sections are never landmarks](docs/decisions/0009-explainer-sections-are-never-landmarks.md).
   The page's landmarks stay few and a reader reaches a section by its heading, at the cost of no
   landmark stop at a section.

## Dev setup

You need [Node.js 24](https://nodejs.org/) and Git. The version is in `.nvmrc`, so `nvm use`
picks it.

```bash
git clone https://github.com/jasonsdevspace/design-kit.git
cd design-kit
npm ci
npm run verify
```

`npm run verify` runs the type-check, lint, the format, prose and Node checks, and the unit tests.
CI runs the same checks and the build in one job. A second packs the package, checks its manifest
with publint, and installs it into an empty project on the lowest Node its engines field admits,
with install scripts off, no Vite and the React a page that draws the components has, where each
sheet must resolve and each module must load by the name a demo imports it by, and then type-checks
a page's use of it as Node and as a bundler resolve it. The browser tests run in a job of their own.
The jobs run at the same time.

`npm run build` compiles the theme module, the plugin and the components into the package's `dist`,
beside a copy of each sheet, which is what the package's entries load from. Packing the package
builds it first. `npm run e2e` runs the browser tests in Chromium, after `npx playwright install
chromium` the first time. They read the sources, so they need no build.

```bash
npx playwright install chromium
npm run e2e
```

Installing also sets up the hooks, which lint and format what is staged and check each commit
message.

## Releasing

A release is a tag on main named for the package's version, such as `design-kit-v0.1.0`. The tag,
the version in `packages/design-kit/package.json` and a heading for it in the package's
`CHANGELOG.md` have to agree, or the release workflow stops. It runs every check CI runs, then
stages on npm, with provenance, the tarball the oldest Node job proved, and only if its checksum is
the one that job reported. Trusted publishing means no npm token is stored anywhere. A staged
version goes live only when it is promoted on the package page. A version with a hyphen is staged
under npm's `next` tag and marked as a prerelease on GitHub. The workflow then creates the release
on GitHub with the changelog entry as its notes.

The job that stages holds the publish token, so it installs nothing but a pinned npm, from a
tarball checked against the checksum npm's registry gives for that version, and fetches nothing
else. It stops on a version npm already holds, staged or published, since it cannot tell one staged
by an earlier run from one staged from other code, so a run whose later step failed is repeated
with "Re-run failed jobs", which keeps the staging and runs only what failed.

## Project layout

```
packages/
└── design-kit/       the package, with its own README written for its npm page
    ├── src/          tokens.css, base.css, components.css, theme.ts (the contract and the
    │                 script), vite.ts (the plugin and the hash), react.tsx (the page chrome,
    │                 the buttons, the fields and the callouts), and their tests
    ├── e2e/          the sheets, the theme script, the page chrome, the controls, a button's
    │                 ref and an explainer page as Chromium runs them
    └── smoke/        the packed package as a page installs it, on the oldest Node
scripts/              the prose, Node and commit message checks, the tests of those, of the
                      license and of the lint rules and workflows, the helper that runs each
                      check in a throwaway repository, and the one that creates a GitHub release
docs/
└── decisions/        the decision records
.github/workflows/    CI, the release from a tag, and the check of a pull request's title and body
```

## License

MIT. See [LICENSE](LICENSE).
