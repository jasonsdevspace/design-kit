# design-kit

The repository for `@jasonsdevspace/design-kit`, the design tokens, base styles and theme script
meant to be shared by the demos on [jasonsdevspace.com](https://jasonsdevspace.com). The package
is marked private and is not published.

## What it holds

- `tokens.css`: the scale a page's styles are drawn from, and the color roles. Every name carries
  the `--dk-` prefix, so the kit can load beside a page's own styles.
- `base.css`: the page's type and colors, one focus ring for every link and control, a
  `.dk-visually-hidden` class, and less motion for a visitor who asks for it.
- `theme`: the key the portfolio saves a visitor's theme under, the two themes, and the script
  that sets the saved one before a page paints.
- `vite`: a Vite plugin that puts that script into each page, and the script's hash for a Content
  Security Policy.

Every rule in the kit sits in one of its cascade layers, `dk.tokens` and `dk.base`, which the tokens
declare in that order with `dk.components` after them. A page's own rule outside a layer wins over
every rule of the kit's but the cut to motion, however little it weighs and wherever its sheet
loads. A page with layers of its own names where `dk` goes among them. `@layer dk, page;` puts its
own layer over the kit's wherever it is written. `@layer page, dk;` puts the kit's over its own only
when written before the kit's sheets, since a layer takes its place where it is first named. So a
page whose own layers load before the kit's sheets names `dk` first if it means its own to win.

Inside the layers, every rule but the visually hidden class sits inside `:where()`, so the kit's
rules stay flat against each other. The cut to motion is held with `!important`, since it is the
visitor's choice. It wins over every normal rule a page writes, and over an important one unless
the page puts that in a layer it orders before the kit's.

A page loads both sheets, tokens first, through a bundler that resolves package exports, such as
Vite:

```css
@import '@jasonsdevspace/design-kit/tokens.css';
@import '@jasonsdevspace/design-kit/base.css';
```

## Themes and palettes

Each color role holds its light and its dark value in one `light-dark()`. A page follows the
system's color scheme, or the theme set as `data-theme="light"` or `data-theme="dark"` on its root.
A page with its own palette sets the roles again on `:root`, both values at once, and wins whichever
sheet loads first, as long as that rule sits outside a layer or in one after the kit's. A page can
also set them on one container, which restyles only what is inside it, in both themes:

```css
:root {
    --dk-accent: light-dark(#2f5bd3, #7b9cff);
}
```

The default palette passes WCAG's 4.5 to 1 for every text pairing in both themes, the accent and so
the focus ring included, and 3 to 1 for a control's edge. `packages/design-kit/src/tokens.test.ts`
holds it there, and a page that sets its own palette is responsible for its own pairings.

## The theme a visitor saved

The portfolio saves a visitor's theme in `localStorage` under the key `theme`, as `light`, `dark`
or `system`. `@jasonsdevspace/design-kit/theme` exports that key as `THEME_KEY`, the two themes as
`THEMES`, and `themeScript`, the script a page runs inline in its head to set `data-theme` before
anything paints. The script follows the system's theme when `system` or nothing usable is saved,
and sets the theme again when the system's changes or the portfolio saves a choice in another tab.

A page built with Vite puts the script in with the plugin from `@jasonsdevspace/design-kit/vite`,
where its head holds `<!-- theme-script -->`. A page without that comment fails the build.

```ts
import { themeScriptPlugin } from '@jasonsdevspace/design-kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({ plugins: [themeScriptPlugin()] });
```

The same module exports `themeScriptHash`, the script's hash as a Content Security Policy source,
for a page whose policy allows inline script only by its hash.

## Dev setup

`npm run verify` runs the type-check, lint, the format, prose and Node checks, and the unit tests,
as CI's first job does before it builds. `npm run build` compiles the theme module and the plugin
into the package's `dist`, beside a copy of each sheet, which is what the package's entries load
from. Packing the package builds it first. `npm run e2e` runs the browser tests CI's browser job
runs, after `npx playwright install chromium` the first time. All need the Node 24 that `.nvmrc`
names.

```sh
npm ci
npm run verify
npm run build
npm run e2e
```

Installing also sets up the hooks, which lint and format what is staged and check each commit
message.

## Project layout

- `packages/design-kit/`: the package.
    - `src/`: the sheets, the theme script and its Vite plugin, and their tests.
    - `e2e/`: browser tests of the sheets and of the theme script as Chromium runs them.
- `scripts/`: the prose, Node and commit message checks, the tests of those and of the lint rules
  and workflows, and the helper that runs each check in a throwaway repository.

## License

MIT, in [LICENSE](LICENSE).
