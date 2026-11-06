# @jasonsdevspace/design-kit

Design tokens, base styles, a theme script and the page chrome for the demos on
[jasonsdevspace.com](https://jasonsdevspace.com). Every rule sits in a cascade layer of the kit's
own, so a page's own rule outside a layer wins over every rule of the kit's but the cut to motion,
without any extra weight. A page with layers of its own has to name where the kit's go among them,
in the order the section on layers below gives. The script sets the theme a visitor chose on the
portfolio before the page paints. The page chrome a demo draws around its page is a skip link, a
strip and a footer, as markup a sheet styles and as React components that draw it.

```sh
npm install @jasonsdevspace/design-kit
```

The package loads on Node 22.12 or later, the lowest Node 22 that Vite 8 runs on. It takes Vite 8
or later as an optional peer for its plugin, and React `^19.3.0` as an optional peer for its
components. Prereleases are under npm's `next` tag, as `@jasonsdevspace/design-kit@next`. What
changed in each version is in
[CHANGELOG.md](https://github.com/jasonsdevspace/design-kit/blob/main/packages/design-kit/CHANGELOG.md).

A page loads the sheets, tokens first, through a bundler that resolves package exports, such as
Vite.

```css
@import '@jasonsdevspace/design-kit/tokens.css';
@import '@jasonsdevspace/design-kit/base.css';
@import '@jasonsdevspace/design-kit/components.css';
```

A page built with Vite takes the theme script from the plugin, and marks where it goes in its head.

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

## What it exports

- `@jasonsdevspace/design-kit/tokens.css` declares the kit's layer order and the named values, each
  with the `--dk-` prefix. The color roles, each holding a value for both themes, are `--dk-bg`,
  `--dk-surface`, `--dk-raised`, `--dk-fg`, `--dk-muted`, `--dk-line`, `--dk-control`,
  `--dk-accent`, `--dk-on-accent`, `--dk-highlight`, `--dk-success`, `--dk-success-bg`,
  `--dk-danger`, `--dk-danger-bg` and the scrim, `--dk-scrim`. Beside them are steps of space, text
  size and corners, two line heights, three weights, a sans and a mono font stack, the focus ring's
  width and offset, a field's height and inline padding, the size of a touch target, the height of
  the portfolio's strip, the measure and column widths, a shadow and a short duration.
- `@jasonsdevspace/design-kit/base.css` gives the page its type and colors, one focus ring in the
  accent for every link and control the keyboard reaches, the `.dk-visually-hidden` class for a
  label a screen reader reads and the eye does not, and less motion for a visitor who asks for it.
  It loads after the tokens, since the tokens' first statement declares the kit's layer order.
- `@jasonsdevspace/design-kit/components.css` styles the page chrome, the skip link, the strip and
  the footer, by the classes in the markup the section on page chrome below gives. It loads after
  the tokens too.
- `@jasonsdevspace/design-kit/theme` exports `THEME_KEY`, the storage key the portfolio saves a
  visitor's theme under, `THEMES`, the two themes the script sets, their type `Theme`, and
  `themeScript`, the script itself as a string to put inline.
- `@jasonsdevspace/design-kit/react` exports `SkipLink`, `PortfolioStrip` and `DemoFooter`, which
  draw that markup, and `PORTFOLIO_URL`, `PORTFOLIO_WORK_URL` and `GITHUB_PROFILE_URL`, the
  portfolio, its list of work and the GitHub profile the chrome links to. It takes React `^19.3.0`
  as an optional peer, which a page that writes the markup itself never needs.
- `@jasonsdevspace/design-kit/vite` exports `themeScriptPlugin()`, the Vite plugin that puts the
  script inline in place of `THEME_PLACEHOLDER`, the comment `<!-- theme-script -->`, and
  `themeScriptHash`, the script's hash as a Content Security Policy source. It runs in Node, and
  takes Vite 8 or later as an optional peer, which a page that does not use the plugin never needs.

A page with no placeholder fails the build, since without the script it would draw the system's
theme rather than the visitor's, and so does a page with two. A page built without Vite writes the
script into its head itself, before the body.

```ts
import { themeScript } from '@jasonsdevspace/design-kit/theme';

const head = `<script>${themeScript}</script>`;
```

## Page chrome

The page chrome a demo draws around its page is a skip link, a strip above the page that says whose
demo it is, and a footer below it. `components.css` styles the markup below, which a page without
React writes by hand and the components in `./react` draw. The components ship no stylesheet and
set no `style` attribute, so a page loads `components.css` itself, and a page whose policy allows
styles only from its own origin, `style-src 'self'`, still draws them.

The skip link is the keyboard's first stop, out of sight until it takes focus, and then at the
column's inset, where the strip's links start. Following it moves focus to the page's main content,
which has a tabindex of -1 so it can take focus.

```html
<a class="dk-skip" href="#main-content">Skip to content</a>
<main id="main-content" tabindex="-1">...</main>
```

The strip holds a navigation landmark named Portfolio, with three links in this order: whose demo
it is, how it works and the source. The strip on the demo's explainer marks the explainer's link
with `aria-current="page"`. A demo with switches of its own puts them in a section after the links,
named for them, and a demo with none leaves the section out.

```html
<div class="dk-strip">
    <nav class="dk-strip-links" aria-label="Portfolio">
        <a href="https://jasonsdevspace.com/#work">A demo by Jason Poteet</a>
        <a href="./about/">How it works</a>
        <a href="https://github.com/jasonsdevspace/example">Source on GitHub</a>
    </nav>
    <section class="dk-strip-tools" aria-label="Demo">
        <button type="button">Tour</button>
    </section>
</div>
```

On a wide screen the strip is one 2.5rem row over a 1px rule, in the small text, with its links
1.5rem apart and the switches on the right. At 48rem wide or less the text steps down to the
caption size, the links close to 1rem apart and wrap where they must, and the switches take a row
of their own below them.

The footer is one paragraph that says whose project the demo is, with the author's name linking the
portfolio, and links how it works, the source, the rest of the work and the license. Anything the
demo adds follows the license, as sentences of its own. Every link in the chrome keeps its
underline, and in the footer's sentence the underline is what tells a link from the text around it.

```html
<footer class="dk-footer">
    <p>
        Example is a portfolio project by <a href="https://jasonsdevspace.com/">Jason Poteet</a>.
        <a href="./about/">How it works</a>, in plain words. The
        <a href="https://github.com/jasonsdevspace/example">source</a> and
        <a href="https://github.com/jasonsdevspace">more work</a> are on GitHub, under the
        <a href="https://github.com/jasonsdevspace/example/blob/main/LICENSE">MIT license</a>.
    </p>
</footer>
```

The strip and the footer run their rules the width of the page and line their content up with the
page's column, `--dk-column`, 72rem wide by default and centered, inset by 1rem. A page whose column
is another width sets `--dk-column` to it, as it sets a color role.

A page with React draws the same markup from the components.

```tsx
import { DemoFooter, PortfolioStrip, SkipLink } from '@jasonsdevspace/design-kit/react';

const source = 'https://github.com/jasonsdevspace/example';

export const Page = () => (
    <>
        <SkipLink />
        <PortfolioStrip
            about="./about/"
            source={source}
            tools={<button type="button">Tour</button>}
        />
        <main id="main-content" tabIndex={-1}>
            <h1>Example</h1>
        </main>
        <DemoFooter name="Example" about="./about/" source={source} />
    </>
);
```

- `SkipLink` leads to `main-content` unless `target` names another id, and its children replace
  the words "Skip to content".
- `PortfolioStrip` takes `about`, the demo's explainer, and `source`, its repository. `current`
  set to `about` marks the explainer's link as the current page. `tools` holds the demo's own
  switches, and `toolsLabel` names their landmark, `Demo` unless given. With `tools` undefined,
  null or false the strip draws no section for them, so a demo can pass `hasTour && <Tour />`.
- `DemoFooter` takes `name`, the demo's name as the sentence opens with it, `about` and `source`.
  `license` is the link to the license, `LICENSE` on the main branch of `source` unless given, with
  any trailing slash on `source` dropped first. `licenseName` is the license's name in the
  sentence, `MIT license` unless given. Its children follow the license, and children that are
  undefined, null or false add nothing.

## Layers and palettes

The tokens declare `dk.tokens`, `dk.base` and `dk.components`, in that order, and each sheet fills
its own. A page's own rule outside a layer wins over every rule of the kit's but the cut to motion,
however little it weighs and wherever its sheet loads. Inside the layers, every selector is either
one of the kit's own classes, such as `.dk-strip` or `.dk-visually-hidden`, or one `:where()`,
followed at most by a focus pseudo-class.

A page with layers of its own names where `dk` goes among them. A layer takes its place where its
name first appears, so a page whose layers load before the kit's sheets, without naming `dk`, puts
the kit's rules over its own. `@layer dk, page;` puts the page's layer over the kit's when it is
written before any rule of the page's layer. `@layer page, dk;` puts the kit's over the page's only
when written before the kit's sheets.

The cut to motion is held with `!important`, since it is the visitor's choice. It wins over every
normal rule a page writes, and over an important one in a sheet, outside a layer or in a layer
after the kit's. An important declaration in a `style` attribute still wins over it, as does an
important rule in a layer the page orders before the kit's.

Each color role holds its light and its dark value in one `light-dark()`. A page with its own
palette sets the roles again, with both values at once. Set on `:root`, they win whichever sheet
loads first, as long as the rule sits outside a layer or in one after the kit's. Set on one
container, they always win, and restyle only what is inside it. A role set to one color draws that
color in both themes.

```css
:root {
    --dk-accent: light-dark(#2f5bd3, #7b9cff);
}
```

The default palette is measured in both themes, against the pairings it is meant for. Text, muted
text, the accent, and the success and danger colors pass 4.5 to 1 on the page, a card and anything
raised, and a control's edge passes 3 to 1 on each of those. Text on the accent passes 4.5 to 1, as
do text and muted text on the highlight and on each callout's ground, the accent on the highlight,
and the success and danger colors on their own grounds. The focus ring is drawn in the accent, so
it is held as a link is. A pairing outside that list, such as a line against its ground, carries no
ratio, and a page that sets its own palette answers for its own pairings.

## The theme contract

The portfolio saves a visitor's theme in `localStorage` under `theme`, as `light`, `dark` or
`system`. The script sets `data-theme` on the root to the theme saved, and follows the system's when
nothing is saved, when `system` or any other value is, and when the browser refuses the page its
storage. It sets the theme again when the system's changes, and when the portfolio saves a choice or
clears it in another tab. Where the browser cannot report the system's scheme, the script reads it
as light, so a saved theme still applies there. Storage belongs to an origin, so a page reads the
visitor's choice only on the portfolio's own origin, and anywhere else follows the system.

`themeScriptHash` holds while nothing after the plugin rewrites the inline script, as a minifier of
a page's HTML would. It is the hash of the script in the installed version, so a policy reads it
from the package rather than keeping a copy.

## Browser support

The colors are written with `light-dark()`, which sets the floor: Chrome and Edge 123, Firefox 120
and Safari 17.5. The kit's browser tests run in Chromium.

## License

MIT. See [LICENSE](https://github.com/jasonsdevspace/design-kit/blob/main/LICENSE). The tests, and
the decisions behind the kit, are in [the repository](https://github.com/jasonsdevspace/design-kit).
