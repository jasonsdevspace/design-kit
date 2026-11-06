# @jasonsdevspace/design-kit

Design tokens, base styles and a theme script for the demos on
[jasonsdevspace.com](https://jasonsdevspace.com). Every rule sits in a cascade layer of the kit's
own, so a page's own rule outside a layer wins over every rule of the kit's but the cut to motion,
without any extra weight. A page with layers of its own has to name where the kit's go among them,
in the order the section on layers below gives. The script sets the theme a visitor chose on the
portfolio before the page paints.

A page loads both sheets, tokens first, through a bundler that resolves package exports, such as
Vite.

```css
@import '@jasonsdevspace/design-kit/tokens.css';
@import '@jasonsdevspace/design-kit/base.css';
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
- `@jasonsdevspace/design-kit/theme` exports `THEME_KEY`, the storage key the portfolio saves a
  visitor's theme under, `THEMES`, the two themes the script sets, their type `Theme`, and
  `themeScript`, the script itself as a string to put inline.
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

## Layers and palettes

The tokens declare `dk.tokens`, `dk.base` and `dk.components`, in that order, and each sheet fills
its own. A page's own rule outside a layer wins over every rule of the kit's but the cut to motion,
however little it weighs and wherever its sheet loads. Inside the layers, every selector but the
visually hidden class is one `:where()`, followed at most by a focus pseudo-class.

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
`system`. The script sets `data-theme` on the root to the theme saved, and follows the system's
when nothing is saved, when `system` or any other value is, and when the browser refuses the page
its storage. It sets the theme again when the system's changes, and when the portfolio saves a
choice or clears it in another tab. Storage belongs to an origin, so a page reads the visitor's
choice only on the portfolio's own origin, and anywhere else follows the system.

`themeScriptHash` holds while nothing after the plugin rewrites the inline script, as a minifier of
a page's HTML would. It is the hash of the script in the installed version, so a policy reads it
from the package rather than keeping a copy.

## Browser support

The colors are written with `light-dark()`, which sets the floor: Chrome and Edge 123, Firefox 120
and Safari 17.5. The kit's browser tests run in Chromium.

## License

MIT. See [LICENSE](https://github.com/jasonsdevspace/design-kit/blob/main/LICENSE). The tests, and
the decisions behind the kit, are in [the repository](https://github.com/jasonsdevspace/design-kit).
