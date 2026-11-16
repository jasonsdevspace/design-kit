# Package size

Run `npm run bench:package` to reproduce it. The raw results are in [package-size.json](package-size.json).

What a demo installs when it adds the kit, measured from the tarball `npm pack` makes, which is what npm publishes. Each file is shown as it sits in the package and gzipped, as a server would send it. A page loads the sheets it imports, and each sheet is also shown gzipped without its comments and blank lines, which is most of what a page's minifier takes out, and which the sheets' budget holds for the three together. Of the modules, the plugin in `vite.js` runs only in a build, the theme script from `theme.js` goes inline in the page's head, `react.js` reaches a visitor only on a page that renders React in the browser, and `controls.js` reaches one on a page that attaches a control.

| Recorded   | Commit    | Machine                                  | Node     |
| ---------- | --------- | ---------------------------------------- | -------- |
| 2026-11-16 | `2caf42c` | AMD EPYC 7763 64-Core Processor, 4 cores | v24.22.2 |

`@jasonsdevspace/design-kit@0.8.0`, 70.7 KB packed. The sheets a page loads come to 10.0 KB gzipped together without their comments, the figure their budget holds. Since the record of version 0.7.0 on 2026-11-13 at `0ea7947`, it packs 70.7 KB where it packed 62.6 KB.

The sheets a page loads:

| File                | Raw      | Gzipped | Without comments |
| ------------------- | -------- | ------- | ---------------- |
| dist/base.css       | 8.9 KB   | 2.9 KB  | 1.1 KB           |
| dist/components.css | 122.1 KB | 27.5 KB | 8.1 KB           |
| dist/tokens.css     | 15.5 KB  | 4.9 KB  | 1.3 KB           |

The modules a page's build imports:

| File             | Raw     | Gzipped |
| ---------------- | ------- | ------- |
| dist/controls.js | 38.7 KB | 11.1 KB |
| dist/react.js    | 20.0 KB | 6.0 KB  |
| dist/theme.js    | 4.7 KB  | 1.7 KB  |
| dist/vite.js     | 2.9 KB  | 1.3 KB  |

Every other file the package carries, which a page never loads:

| File                      | Raw     | Gzipped |
| ------------------------- | ------- | ------- |
| dist/controls.d.ts        | 9.4 KB  | 3.3 KB  |
| dist/react.d.ts           | 20.4 KB | 5.8 KB  |
| dist/theme.d.ts           | 2.5 KB  | 1.0 KB  |
| dist/tokens.resolver.json | 30.6 KB | 1.9 KB  |
| dist/vite.d.ts            | 2.2 KB  | 1.0 KB  |
| LICENSE                   | 1.0 KB  | 0.6 KB  |
| package.json              | 2.3 KB  | 0.8 KB  |
| README.md                 | 15.0 KB | 4.7 KB  |

What each piece costs the three sheets, as what they save sent together without their comments and gzipped once its rules are taken out, the costliest first. A rule belongs to the piece it draws. The costs add up to less than the whole, since a piece that repeats another saves little once taken out. The costliest are the page's own elements, tokens and app frame.

| Piece                   | Rules | Costs |
| ----------------------- | ----- | ----- |
| the page's own elements | 31    | 959 B |
| tokens                  | 6     | 950 B |
| app frame               | 46    | 864 B |
| button                  | 29    | 621 B |
| strip                   | 20    | 490 B |
| rows                    | 28    | 431 B |
| field                   | 19    | 427 B |
| explainer               | 22    | 421 B |
| table                   | 17    | 376 B |
| button grid             | 12    | 308 B |
| stepper                 | 11    | 279 B |
| dialog                  | 14    | 262 B |
| theme switch            | 14    | 246 B |
| tab bar                 | 15    | 244 B |
| choice                  | 15    | 237 B |
| toast                   | 10    | 219 B |
| pills                   | 12    | 175 B |
| tabs                    | 8     | 143 B |
| callout                 | 10    | 127 B |
| animations              | 4     | 121 B |
| footer                  | 6     | 119 B |
| icon                    | 3     | 104 B |
| site header             | 5     | 92 B  |
| skip link               | 2     | 76 B  |
| steps                   | 5     | 71 B  |
| code block              | 5     | 67 B  |
| content page            | 4     | 67 B  |
| panel                   | 6     | 65 B  |
| eyebrow                 | 2     | 57 B  |
| copy button             | 3     | 46 B  |
| visually hidden         | 1     | 15 B  |
| actions                 | 1     | 8 B   |

What each function of the controls costs a page, as its bundler takes them without comments and gzipped: alone, on a page that imports only that one, and added, to a page that imports every other. The costliest added are `attachToast` and `attachStepper`.

| Function            | Alone  | Added  |
| ------------------- | ------ | ------ |
| `attachToast`       | 1668 B | 1061 B |
| `attachStepper`     | 1466 B | 981 B  |
| `attachThemeSwitch` | 1781 B | 693 B  |
| `attachCopyButton`  | 1005 B | 602 B  |
| `attachTable`       | 747 B  | 487 B  |
| `attachDialog`      | 886 B  | 473 B  |
| `attachStatus`      | 332 B  | 63 B   |
| `chooseTheme`       | 865 B  | 4 B    |
