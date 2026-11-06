# Changelog

The kit follows semantic versioning from its first release. Until 1.0.0, a minor version may rename
a token or change what the theme script reads, and a patch changes neither. A change to the theme
script changes `themeScriptHash`, so a page reads the hash from the installed package rather than
keeping a copy. Each version is staged on npm from a tag by the release workflow, with provenance,
goes live when it is promoted, and has a release on GitHub with the entry below as its notes.

## 0.1.0-next.1

Nothing in the package changed. This is the first version the release workflow stages, through
npm's trusted publishing with provenance, where `0.1.0-next.0` was published by hand.

## 0.1.0-next.0

The kit's first prerelease: the tokens, the base and the theme script the demos on
jasonsdevspace.com share.

- **Tokens.** The scale and the color roles, every name under the `--dk-` prefix, each color holding
  its light and its dark value in one `light-dark()`. The default palette passes 4.5 to 1 for each
  text pairing it is measured on, in both themes, and 3 to 1 for a control's edge.
- **Base.** The page's type and colors, one focus ring in the accent for everything the keyboard
  reaches, `.dk-visually-hidden`, and less motion for a visitor who asks for it.
- **Layers.** Every rule sits in the kit's cascade layers, `dk.tokens` and `dk.base`, declared with
  `dk.components` after them, so a page's own rule outside a layer wins over the kit's.
- **The theme script.** `THEME_KEY`, `THEMES` and `themeScript`, which sets the theme the portfolio
  saved before a page paints, or the system's, and follows a change made in another tab.
- **The Vite plugin.** `themeScriptPlugin` writes the script where a page holds
  `<!-- theme-script -->` and fails the build of a page without it or with two, and
  `themeScriptHash` names the script for a Content Security Policy.
- **Node.** The theme module and the plugin load on Node 22.12 or later, the lowest Node the
  package is tested on and the lowest Vite 8 runs on on Node 22.
