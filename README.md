# design-kit

The shared look of the demos on [jasonsdevspace.com](https://jasonsdevspace.com): colors and type,
a light and dark theme that follows the visitor's choice, the strip and footer around each demo,
buttons, form fields and callouts for messages, the layout of each "How it works" page, and an
app's frame, tab bar, toast, button grid, rows, stepper and dialog. It ships on npm as
`@jasonsdevspace/design-kit`, and ShelfLens is built on it.

[See every piece live](https://jasonsdevspace.com/design-kit/) ·
[The package on npm](https://www.npmjs.com/package/@jasonsdevspace/design-kit) ·
[The reference](packages/design-kit/REFERENCE.md)

- **A page's own styles win.** The kit never fights the page it sits in, so a demo can load it
  beside the styles it already has. The one thing it holds over a page is the reduced-motion rule,
  for a visitor who asks for less.
- **The theme never flashes.** A visitor's light or dark choice on the portfolio is set before a
  demo draws anything.
- **Each promise has a test.** The default colors are measured for contrast in both themes, and
  every page of the site is checked for accessibility and speed on each change.

**Why I built it.** My demos each carried their own copy of the same things. ShelfLens and
inventory-reservations both shipped the same script to set the visitor's theme, line for line, and
each named its colors its own way. A change to how a theme is chosen had to be made in every
repository, and each new demo would have copied it again. I wanted one package a demo could load
beside its own styles without either side overruling the other, and each of those promises held by
a test, since a style that quietly loses to another one shows no error. ShelfLens now draws from the
published package, pinned to one version.

## A path through the site

Start at [the home page](https://jasonsdevspace.com/design-kit/), then open
[Tokens and theme](https://jasonsdevspace.com/design-kit/tokens/) for every color role in both
themes and the contrast of each pairing it is meant for.
[Controls](https://jasonsdevspace.com/design-kit/controls/) shows buttons, fields and callouts in
every state with the code that draws each, and
[Page chrome](https://jasonsdevspace.com/design-kit/page-chrome/) the skip link, strip and footer
around a demo. [Explainer pieces](https://jasonsdevspace.com/design-kit/explainer-pieces/) holds the
layout of the page that says how a demo works, and
[How it works](https://jasonsdevspace.com/design-kit/how-it-works/) is that page written for the kit
itself. The theme switch in the strip saves the same choice the portfolio does, so it holds across
jasonsdevspace.com.

## Using it

```sh
npm install @jasonsdevspace/design-kit
```

A page loads the sheets, tokens first, through a bundler that resolves package exports, such as
Vite. A Vite build takes the theme script from the plugin, which puts it inline where the page's
head holds `<!-- theme-script -->`, and its browser target from the kit.

```css
@import '@jasonsdevspace/design-kit/tokens.css';
@import '@jasonsdevspace/design-kit/base.css';
@import '@jasonsdevspace/design-kit/components.css';
```

```ts
import { browserFloor, themeScriptPlugin } from '@jasonsdevspace/design-kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [themeScriptPlugin()],
    build: { target: browserFloor() },
});
```

[The package README](packages/design-kit/README.md) covers the rest of setup and [what each entry
exports](packages/design-kit/README.md#what-it-exports). [The
reference](packages/design-kit/REFERENCE.md) gives the markup, rules and React props for [the page
chrome](packages/design-kit/REFERENCE.md#page-chrome), [buttons, fields and
callouts](packages/design-kit/REFERENCE.md#buttons-fields-and-callouts) and [explainer
pages](packages/design-kit/REFERENCE.md#explainer-pages). It also covers [layers and
palettes](packages/design-kit/REFERENCE.md#layers-and-palettes), including how a page with layers of
its own names where the kit's go, and [the theme
contract](packages/design-kit/REFERENCE.md#the-theme-contract).

## Browser support

The color roles are written with `light-dark()`, which sets the floor: Chrome and Edge 123, Firefox
120 and Safari 17.5. Cascade layers and `:where()` are older than that. A Vite build takes the
floor from the kit with `browserFloor()`, so its sheets keep each `light-dark()` as written. A page
that compiles its CSS with Lightning CSS passes `lightningcssFloor()` to it as well, since Vite
otherwise gives that transformer lower targets of its own, as
[the package README](packages/design-kit/README.md#browser-support) shows. What falls short at the
floor, and what no test here covers, is under
[known limitations](ACCESSIBILITY.md#known-limitations).

## The gotchas, and the test behind each

Each promise the kit makes is held by a test. These are the ones a page leans on most, and the rest
follow by area.

| Gotcha                                                                                                    | Where it is tested                          |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| A page's own rule outside a layer wins, however little it weighs, and a kit piece marked `hidden` is gone | `packages/design-kit/e2e/sheets.spec.ts`    |
| Every measured pairing passes its WCAG ratio in both themes                                               | `packages/design-kit/src/tokens.test.ts`    |
| The theme is set before the body is parsed                                                                | `packages/design-kit/e2e/theme.spec.ts`     |
| A button and a field stand level, at the field height wide and the target on a phone                      | `packages/design-kit/e2e/controls.spec.tsx` |
| A build that takes the kit's floor keeps each `light-dark()` as written, with either CSS transformer      | `packages/design-kit/src/vite.test.ts`      |
| Every page of the site meets the Lighthouse gates ShelfLens is held to                                    | `packages/site/bench/lighthouse.ts`         |

<details>
<summary>Cascade layers, weight and contrast</summary>

| Gotcha                                                                                                    | Where it is tested                       |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| A page's layers placed before the kit's lose to it unless they name `dk` first                            | `packages/design-kit/e2e/sheets.spec.ts` |
| Each rule is in its own dk layer, and only a class, a focus rule or an allowed pseudo-element adds weight | `packages/design-kit/src/scope.test.ts`  |
| Every rule past the page chrome sits in a `:where()`, the explainer's layout included                     | `packages/design-kit/src/scope.test.ts`  |
| A page's `::before` and `::after` take the border box                                                     | `packages/design-kit/e2e/sheets.spec.ts` |
| Reduced motion reaches `::before`, `::after`, `::backdrop` and a view transition                          | `packages/design-kit/e2e/sheets.spec.ts` |
| Reduced motion cuts a page's important transition, unlayered or layered after the kit                     | `packages/design-kit/e2e/sheets.spec.ts` |
| A palette set on a container restyles only what is inside it                                              | `packages/design-kit/e2e/sheets.spec.ts` |
| The focus ring is drawn in the accent, and not on a section a skip link moves focus to                    | `packages/design-kit/e2e/sheets.spec.ts` |
| A label hidden from the eye is still read by a screen reader                                              | `packages/design-kit/e2e/sheets.spec.ts` |
| Text, the accent and a control's edge pass on the highlight and each callout's ground                     | `packages/design-kit/src/tokens.test.ts` |

</details>

<details>
<summary>The theme script and the Vite plugin</summary>

| Gotcha                                                                                       | Where it is tested                        |
| -------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Nothing saved, `system`, an unknown value and refused storage follow the system              | `packages/design-kit/e2e/theme.spec.ts`   |
| A browser that cannot report its scheme draws light or the saved theme, and hears other tabs | `packages/design-kit/e2e/theme.spec.ts`   |
| The theme follows the system as it changes, while nothing is saved                           | `packages/design-kit/e2e/theme.spec.ts`   |
| A choice saved in another tab, or storage cleared there, reaches the page                    | `packages/design-kit/e2e/theme.spec.ts`   |
| A page restored by Back draws the theme saved while it was away                              | `packages/design-kit/e2e/theme.spec.ts`   |
| A page in the dark theme prints the light values                                             | `packages/design-kit/e2e/chrome.spec.tsx` |
| The key and themes are the portfolio's, and the tokens have a rule for each                  | `packages/design-kit/src/theme.test.ts`   |
| The script holds nothing that would end its element, and compiles                            | `packages/design-kit/src/theme.test.ts`   |
| A page with no placeholder, or with two, fails the build                                     | `packages/design-kit/src/vite.test.ts`    |
| The hash is of the script exactly as the plugin writes it                                    | `packages/design-kit/src/vite.test.ts`    |
| The floor both READMEs and the accessibility statement give is the one the kit gives a build | `packages/design-kit/src/vite.test.ts`    |

</details>

<details>
<summary>The React components</summary>

| Gotcha                                                                                        | Where it is tested                       |
| --------------------------------------------------------------------------------------------- | ---------------------------------------- |
| The chrome draws the markup a page without React writes, and opens no link in a new tab       | `packages/design-kit/src/react.test.tsx` |
| A button never submits unless a page says so, and an off one runs no click handler            | `packages/design-kit/src/react.test.tsx` |
| A toggle has `aria-pressed` whether on or off, and an action has none                         | `packages/design-kit/src/react.test.tsx` |
| A button hands its ref on to the `<button>` it draws                                          | `packages/design-kit/src/react.test.tsx` |
| Focus moved through a button's ref lands on the kit's button                                  | `packages/design-kit/e2e/ref.spec.ts`    |
| A field's ref is typed as the `<input>` or `<select>` it draws, and one of another is refused | `packages/design-kit/src/react.test.tsx` |
| Focus moved through a field's ref, after the field is drawn again, lands on its control       | `packages/design-kit/e2e/ref.spec.ts`    |
| A field lists only what it draws in `aria-describedby`, and is invalid only with an error     | `packages/design-kit/src/react.test.tsx` |
| A callout has a role only when the page asks, and its actions sit outside the message         | `packages/design-kit/src/react.test.tsx` |
| A live callout is drawn empty, and success, warning and danger say their tone in words        | `packages/design-kit/src/react.test.tsx` |

</details>

<details>
<summary>The page chrome in the browser</summary>

| Gotcha                                                                                             | Where it is tested                        |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| The strip is one row over its rule on a wide screen, and rows of links on a phone                  | `packages/design-kit/e2e/chrome.spec.tsx` |
| A demo's switches sit beside the links on a wide screen, and on a row below them on a phone        | `packages/design-kit/e2e/chrome.spec.tsx` |
| The strip keeps the room of switches on their way, at the height they give it at every width       | `packages/design-kit/e2e/chrome.spec.tsx` |
| The skip link is out of sight until the keyboard reaches it, and lands on the content              | `packages/design-kit/e2e/chrome.spec.tsx` |
| A skip link inside a positioned box stays out of sight and out of the way of a click until focused | `packages/design-kit/e2e/chrome.spec.tsx` |
| The focused skip link is a box in forced colors, by an edge in the link's color                    | `packages/design-kit/e2e/chrome.spec.tsx` |
| The footer's rule spans the page, and its text and the strip's links line up in the column         | `packages/design-kit/e2e/chrome.spec.tsx` |
| The chrome's link to the current page stands apart by its weight, in each theme and forced colors  | `packages/design-kit/e2e/chrome.spec.tsx` |
| The chrome has no axe findings in either theme, at both widths, on a demo and its explainer        | `packages/design-kit/e2e/chrome.spec.tsx` |
| The chrome draws with no inline style, under a policy that allows styles only from its origin      | `packages/design-kit/e2e/chrome.spec.tsx` |

</details>

<details>
<summary>Buttons, fields and callouts in the browser</summary>

| Gotcha                                                                                                | Where it is tested                          |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Field text is 16px or more on a phone, and every control fits 320px wide                              | `packages/design-kit/e2e/controls.spec.tsx` |
| An off button stays in the tab order, and is drawn as a disabled one is                               | `packages/design-kit/e2e/controls.spec.tsx` |
| A pressed toggle has a thicker edge as well as a ground, and keeps its name                           | `packages/design-kit/e2e/controls.spec.tsx` |
| A field is named by its label, and described by its hint and then its error                           | `packages/design-kit/e2e/controls.spec.tsx` |
| The focus ring follows the keyboard, on the accent button and inside every callout                    | `packages/design-kit/e2e/controls.spec.tsx` |
| Pressed and off stay apart in forced colors, a callout keeps its edge, and the select's arrow returns | `packages/design-kit/e2e/controls.spec.tsx` |
| An empty live callout draws nothing, and takes the callout's look once it is filled                   | `packages/design-kit/e2e/controls.spec.tsx` |
| The controls have no axe findings in any state, in either theme, wide and on a phone                  | `packages/design-kit/e2e/controls.spec.tsx` |

</details>

<details>
<summary>Explainer pages</summary>

| Gotcha                                                                                        | Where it is tested                           |
| --------------------------------------------------------------------------------------------- | -------------------------------------------- |
| An explainer marks its link to how it works as the current page in the strip and the footer   | `packages/design-kit/e2e/explainer.spec.tsx` |
| An explainer's text starts where the strip's links do, and holds to the measure               | `packages/design-kit/e2e/explainer.spec.tsx` |
| A line of the lead and of body text runs to 80 characters or fewer on a wide screen           | `packages/design-kit/e2e/explainer.spec.tsx` |
| A section opens with its rule, its number, its heading and then its text                      | `packages/design-kit/e2e/explainer.spec.tsx` |
| The page never scrolls sideways at any width or text size, and only the frames do             | `packages/design-kit/e2e/explainer.spec.tsx` |
| Nothing clips text spaced out as far as WCAG asks, on a phone                                 | `packages/design-kit/e2e/explainer.spec.tsx` |
| Each frame is named by its title, and the keyboard reaches and scrolls it                     | `packages/design-kit/e2e/explainer.spec.tsx` |
| A table reads by its column and row headers, with its figures set to the right                | `packages/design-kit/e2e/explainer.spec.tsx` |
| Code keeps its lines whole, and inline code is a step under the text and breaks where it must | `packages/design-kit/e2e/explainer.spec.tsx` |
| The skip link lands on the content, and an in-page link keeps its section's number in sight   | `packages/design-kit/e2e/explainer.spec.tsx` |
| No section is a landmark, each frame is, and the steps stay a list                            | `packages/design-kit/e2e/explainer.spec.tsx` |
| A panel sits on the card ground, with an edge that stays in forced colors                     | `packages/design-kit/e2e/explainer.spec.tsx` |
| An explainer page has no axe findings in either theme, wide and on a phone                    | `packages/design-kit/e2e/explainer.spec.tsx` |

</details>

<details>
<summary>The packed package and the markup the docs print</summary>

| Gotcha                                                                                                                                                       | Where it is tested                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Each sheet resolves and each module loads from the packed package, on the oldest Node                                                                        | `packages/design-kit/smoke/consumer.mjs`       |
| The strip draws its markup from the packed package, with the React a page has                                                                                | `packages/design-kit/smoke/consumer.mjs`       |
| A field makes its ids with `useId` in a server render of the packed package                                                                                  | `packages/design-kit/smoke/consumer.mjs`       |
| Each block of a piece's markup in the reference is what its example draws                                                                                    | `packages/design-kit/examples/readme.test.ts`  |
| Each state the site shows draws the attribute printed under it                                                                                               | `packages/design-kit/examples/states.test.tsx` |
| Each state's React draws the state's own markup, laid out as the repository lays out code                                                                    | `packages/design-kit/examples/states.test.tsx` |
| Each state's React draws what the version the site pins draws for the state                                                                                  | `packages/site/src/code.test.ts`               |
| The package exports what the smoke test loads and nothing else, has a changelog entry for its version, and packs its build, its README and its license alone | `packages/design-kit/smoke/package.test.ts`    |

</details>

<details>
<summary>The showcase site</summary>

| Gotcha                                                                                                            | Where it is tested                    |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Every page of the site has no axe findings in either theme, on a phone and a wide screen                          | `packages/site/e2e/site.spec.ts`      |
| No page of the site scrolls sideways at any width or at twice the text size, or cuts off text under wider spacing | `packages/site/e2e/site.spec.ts`      |
| The site draws under `style-src 'self'`, its scripts the theme script by its hash and its own path                | `packages/site/e2e/site.spec.ts`      |
| The site draws the published kit at one exact version, and nothing from the kit's sources                         | `packages/site/src/published.test.ts` |
| The deployed policy allows scripts from the site's own path and the theme script's hash, never the whole origin   | `packages/site/src/policy.test.ts`    |
| A copy of a state in the other theme draws in that theme, and the keyboard never stops inside it                  | `packages/site/e2e/site.spec.ts`      |
| The tokens page draws each swatch in the value printed beside it, and lists every pairing tightest first          | `packages/site/e2e/site.spec.ts`      |
| The page chrome page draws each state as a picture, around the kit's own live chrome                              | `packages/site/e2e/site.spec.ts`      |
| The explainer pieces page draws each piece live, and the explainer's layout as a picture                          | `packages/site/e2e/site.spec.ts`      |
| The site's explainer marks itself the current page, and every other page's strip and footer lead to it            | `packages/site/e2e/site.spec.ts`      |
| Every link within the site leads to one of its pages, and to the id it names, where it names one                  | `packages/site/e2e/site.spec.ts`      |
| The theme switch shows and saves the portfolio's choice, follows another tab, and works without storage           | `packages/site/e2e/site.spec.ts`      |
| Each live state's code shows the markup its copy draws, and copies or selects it with the status saying which     | `packages/site/e2e/site.spec.ts`      |
| Each state's copies fill the column, both named, and its live toggle and panel change when pressed                | `packages/site/e2e/site.spec.ts`      |

</details>

## What was measured

- **What the kit costs a page.** The three sheets are a few kilobytes gzipped without their
  comments, which a test holds to a budget, and the theme script goes inline in the page's head. A
  page that attaches a control loads the controls too, which a test holds, as a bundler sends every
  function, to 6.25 KB gzipped without their comments, and the theme script to 1 KB of its own. The
  package npm publishes is 52 KB packed, the sheets and modules a page loads together with the
  README and the types it never does. [The record](docs/benchmarks/package-size.md) lists every
  file, raw and gzipped, each sheet without its comments, and from the next release what each piece
  of the sheets and each function of the controls costs.
- **The site's pages.** On a first visit as Lighthouse makes one, a phone on a slow network with its
  processor slowed, every page scores a hundred for accessibility and at least 99 for performance,
  shows its main content in under a second with nothing jumping as it loads, and downloads 16.5 to
  25.4 KB in four requests. CI fails any page under a hundred for accessibility or ninety for
  performance, that takes longer than two and a half seconds to show its main content, or whose
  layout shifts by more than a tenth. [The record](docs/benchmarks/site-pages.md) gives each page.

## Decisions

Each choice with a real alternative is a record in [docs/decisions](docs/decisions), with the
options rejected, what the choice costs, and the test behind it.

<details>
<summary>The decisions behind the kit, and what each one costs</summary>

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
10. [The markup each piece draws lives in one module of examples](docs/decisions/0010-one-module-of-examples.md).
    The reference shows what the components draw, held to them by a unit test, at the cost of a
    command to run after each change to a piece's markup.
11. [The site is built with Vite and React's static render, with no script of React's](docs/decisions/0011-the-site-is-built-with-vite-and-a-static-render.md).
    The site draws the published kit under the policy a demo sets, with no runtime of a framework's,
    at the cost of a policy in a meta element, which cannot stop another site framing it, and of a
    change to the kit reaching the site a release later.
12. [The site has a script of its own, from its own path, beside the kit's theme script](docs/decisions/0012-the-site-has-a-script-of-its-own.md).
    A visitor chooses a theme on the site and it holds across jasonsdevspace.com, with nothing
    moving when the switch comes, at the cost of a policy written for jasonsdevspace.com alone, so
    a build served anywhere else, as the tests and the audit serve theirs, names its own origin.
13. [The kit's controls ship their behavior as a module a page attaches to their markup](docs/decisions/0013-controls-attach-to-markup.md).
    The theme switch, the copy button, the stepper, the toast and the dialog work the same on a page
    with React and one without, from one copy of their behavior, at the cost of a second script in
    the browser, held to a budget.
14. [A piece with no state of its own ships as classes alone](docs/decisions/0014-stateless-pieces-ship-as-classes.md).
    Tabs, pills and the eyebrow look the same on every site from classes a page writes, at the cost
    of each page running its own tabs' keys.
15. [A toast's attach function returns what shows a message](docs/decisions/0015-a-toast-attach-returns-what-shows-a-message.md).
    A page attaches a toast once and calls one function for every message, which a screen reader
    hears with its way back, at the cost of the one control whose attach function takes nothing
    away.

</details>

## Dev setup

How to contribute is in [CONTRIBUTING.md](CONTRIBUTING.md), and what the kit holds itself to for
accessibility, and how to report a barrier, is in [ACCESSIBILITY.md](ACCESSIBILITY.md).

You need [Node.js 24](https://nodejs.org/) and Git. The version is in `.nvmrc`, so `nvm use`
picks it.

```bash
git clone https://github.com/jasonsdevspace/design-kit.git
cd design-kit
npm ci
npm run verify
```

`npm run verify` runs the type-check, lint, the format, prose and Node checks, and the unit tests.
`npm run e2e` runs the browser tests in Chromium, an app's frame, tab bar, toast, dialog, stepper
and a table's frame in WebKit too, and the stepper, the controls and the pieces in Firefox. `npm run
lighthouse` builds the site and audits every page against the gates CI holds it to. Nothing needs
building first, since the kit's tests read the sources and the site's tests build and serve the site
themselves. `npm run build` compiles the theme module, the controls, the plugin and the components
into the package's `dist`, beside a copy of each sheet, and builds the site. Installing also sets up
the hooks, which lint and format what is staged and check each commit message.

```bash
npx playwright install chromium webkit firefox
npm run e2e
npm run lighthouse
```

The site in `packages/site` is built with `npm run site` and served under `/design-kit/` as GitHub
Pages serves it. It draws the kit as npm publishes it, at the version its `package.json` pins, so a
change to the kit reaches the site once it is released and the pin moves. A build to be served from
anywhere but jasonsdevspace.com names that origin in `SITE_ORIGIN`, or its policy refuses the theme
switch.

<details>
<summary>What CI checks on every pull request</summary>

CI runs the checks `npm run verify` runs, a check that the lockfile matches the manifests, and the
build in one job. Another packs the package, checks its manifest with publint, and installs it into
an empty project on the lowest Node its engines field admits, with install scripts off and no Vite,
where each sheet must resolve and each module load by the name a demo imports it by, then
type-checks a page's use of it as Node and as a bundler resolve it. The browser tests run in a job
of their own, and in WebKit and in Firefox in a job each on a Mac, and the site's run again over
each commit's own packed kit, so a change that would break the site fails before it is released. The
Lighthouse audit runs in another. Once every job passes on main, a job with read access alone builds
the site, and a job that runs only GitHub's Pages actions deploys it. Each job runs on a named
image, Ubuntu but for those two, within a time limit, which a test holds, and each check writes what
it found to its run's page on GitHub, from `scripts/summary.mjs`.

</details>

<details>
<summary>How a release reaches npm</summary>

A release is a tag on main named for the package's version, such as `design-kit-v0.1.0`. The tag,
the version in `packages/design-kit/package.json` and a heading for it in the package's
`CHANGELOG.md` have to agree, or the release workflow stops. It runs every check CI runs, then
stages on npm, with provenance, the tarball the oldest Node job proved, and only if its checksum is
the one that job reported. Trusted publishing means no npm token is stored anywhere, and a staged
version goes live only when it is promoted on the package page. The job that stages installs
nothing but a pinned npm, checked against the checksum npm's registry gives for it, and fetches
nothing else. A version with a hyphen is staged under npm's `next` tag and marked as a prerelease
on GitHub, and each release has a GitHub release with its changelog entry as the notes. The steps a
maintainer takes around a release are in [CONTRIBUTING.md](CONTRIBUTING.md#releasing).

</details>

<details>
<summary>Recording the benchmarks</summary>

`npm run bench:package` records what the package weighs, and `npm run bench:pages` records how each
page scores through the same audit `npm run lighthouse` runs, writing only when every page passes.
Each record sits in `docs/benchmarks` beside its raw results, with the date, commit, machine and
Node it ran on, and a recording run refuses a working tree with uncommitted changes, so the commit
it names is the code it measured. The release workflow records both from each stable version's
tagged commit, which is on main, and opens one pull request with them, with a token from the records
app, since a pull request opened with the run's own token runs no other workflow. To measure a
change before it ships, run `npm run lighthouse`, which audits the same pages and writes no record.

```bash
npm run bench:package
npm run bench:pages
```

</details>

## Project layout

<details>
<summary>What each folder holds</summary>

```
packages/
├── design-kit/       the package, its npm README and the reference
│   ├── src/          the sheets, the theme script, the Vite plugin, the React components and tests
│   ├── examples/     the markup the reference prints and the site shows, and its tests
│   ├── e2e/          the browser tests
│   └── smoke/        the packed package installed as a page would install it
└── site/             the site at jasonsdevspace.com/design-kit/, its browser tests and audit
scripts/              the prose, Node and commit checks, run summaries, benchmark writer
docs/
├── benchmarks/       what the package weighs and how the site's pages score
└── decisions/        the decision records
.github/workflows/    CI and deploy, release, and the pull request check
CONTRIBUTING.md       how a change is made, checked and released
ACCESSIBILITY.md      what the kit holds itself to for accessibility, and how it is checked
```

</details>

## License

MIT. See [LICENSE](LICENSE).
