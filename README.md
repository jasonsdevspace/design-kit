# design-kit

The repository for `@jasonsdevspace/design-kit`, the design tokens, base styles and components
meant to be shared by the demos on [jasonsdevspace.com](https://jasonsdevspace.com). The package
is marked private and is not published.

## What it holds

- `tokens.css`: the scale every component is built from, and the color roles. Every name carries
  the `--dk-` prefix, so the kit can load beside a page's own styles.
- `base.css`: the page's type and colors, one focus ring for every link and control, a
  `.dk-visually-hidden` class, and less motion for a visitor who asks for it. Every rule but that
  class sits inside `:where()`, so a page's own rule always wins over the kit's.

```css
@import '@jasonsdevspace/design-kit/tokens.css';
@import '@jasonsdevspace/design-kit/base.css';
```

## Themes and palettes

Each color role holds its light and its dark value in one `light-dark()`. A page follows the
system's color scheme, or the theme set as `data-theme="light"` or `data-theme="dark"` on its root.
A page with its own palette sets the roles again on `:root`, both values at once:

```css
:root {
    --dk-accent: light-dark(#2f5bd3, #7b9cff);
}
```

The default palette passes WCAG's 4.5 to 1 for every text pairing in both themes, and 3 to 1 for a
control's edge and the focus ring. `src/tokens.test.ts` holds it there, and a page that sets its
own palette is responsible for its own pairings.

## Dev setup

`npm run verify` runs the type-check, lint, the format, prose and Node checks, and the unit tests,
as CI does on every pull request. `npm run e2e` runs the browser tests, after
`npx playwright install chromium` the first time. Both need the Node 24 that `.nvmrc` names.

```sh
npm ci
npm run verify
npm run e2e
```

Installing also sets up the hooks, which lint and format what is staged and check each commit
message.

## Project layout

- `src/`: the sheets, and the tests that hold the palette's contrast and what each sheet styles.
- `e2e/`: browser tests of the sheets as Chromium draws them, the themes and the focus ring.
- `scripts/`: the prose, Node and commit message checks, their tests, and the helper that runs
  each check in a throwaway repository.

## License

MIT, in [LICENSE](LICENSE).
