# Package size

Run `npm run bench:package` to reproduce it. The raw results are in [package-size.json](package-size.json).

What a demo installs when it adds the kit, measured from the tarball `npm pack` makes, which is what npm publishes. Each file is shown as it sits in the package and gzipped, as a server would send it. A page loads the sheets it imports, and each sheet is also shown gzipped without its comments and blank lines, which is most of what a page's minifier takes out, and which the sheets' budget holds for the three together. Of the modules, the plugin in `vite.js` runs only in a build, the theme script from `theme.js` goes inline in the page's head, `react.js` reaches a visitor only on a page that renders React in the browser, and `controls.js` reaches one on a page that attaches a control.

| Recorded   | Commit    | Machine                                  | Node     |
| ---------- | --------- | ---------------------------------------- | -------- |
| 2026-11-18 | `b07bd18` | AMD EPYC 9V45 96-Core Processor, 4 cores | v24.22.2 |

`@jasonsdevspace/design-kit@0.8.7`, 80.1 KB packed. The sheets a page loads come to 11.1 KB gzipped together without their comments, the figure their budget holds. Since the record of version 0.8.6 on 2026-11-18 at `d060cc2`, it packs 80.1 KB where it packed 80.0 KB, and the sheets together came to 11.1 KB.

The sheets a page loads:

| File                | Raw      | Gzipped | Without comments |
| ------------------- | -------- | ------- | ---------------- |
| dist/base.css       | 8.9 KB   | 2.9 KB  | 1.1 KB           |
| dist/components.css | 133.0 KB | 29.8 KB | 8.8 KB           |
| dist/tokens.css     | 23.5 KB  | 6.4 KB  | 1.9 KB           |

The modules a page's build imports:

| File             | Raw     | Gzipped |
| ---------------- | ------- | ------- |
| dist/controls.js | 53.3 KB | 15.1 KB |
| dist/react.js    | 20.1 KB | 6.0 KB  |
| dist/theme.js    | 4.7 KB  | 1.7 KB  |
| dist/vite.js     | 2.9 KB  | 1.3 KB  |

Every other file the package carries, which a page never loads:

| File                      | Raw     | Gzipped |
| ------------------------- | ------- | ------- |
| dist/controls.d.ts        | 11.2 KB | 3.9 KB  |
| dist/react.d.ts           | 20.8 KB | 5.9 KB  |
| dist/theme.d.ts           | 2.5 KB  | 1.0 KB  |
| dist/tokens.resolver.json | 30.9 KB | 1.9 KB  |
| dist/vite.d.ts            | 2.2 KB  | 1.0 KB  |
| LICENSE                   | 1.0 KB  | 0.6 KB  |
| package.json              | 2.5 KB  | 0.9 KB  |
| README.md                 | 19.7 KB | 5.5 KB  |

What each piece costs the three sheets, as what they save sent together without their comments and gzipped once its rules are taken out, the costliest first. A rule belongs to the piece it draws. The costs add up to less than the whole, since a piece that repeats another saves little once taken out. The costliest are the page's own elements, tokens and app frame.

| Piece                   | Rules | Costs  |
| ----------------------- | ----- | ------ |
| the page's own elements | 31    | 1022 B |
| tokens                  | 6     | 949 B  |
| app frame               | 47    | 948 B  |
| button grid             | 19    | 690 B  |
| button                  | 31    | 672 B  |
| rows                    | 33    | 555 B  |
| strip                   | 20    | 491 B  |
| explainer               | 22    | 441 B  |
| field                   | 19    | 429 B  |
| table                   | 17    | 367 B  |
| panel                   | 14    | 289 B  |
| stepper                 | 11    | 263 B  |
| tab bar                 | 16    | 239 B  |
| choice                  | 15    | 236 B  |
| theme switch            | 14    | 236 B  |
| toast                   | 10    | 210 B  |
| dialog                  | 10    | 203 B  |
| pills                   | 12    | 169 B  |
| tabs                    | 9     | 159 B  |
| callout                 | 10    | 125 B  |
| footer                  | 6     | 120 B  |
| animations              | 4     | 115 B  |
| content page            | 5     | 100 B  |
| site header             | 5     | 94 B   |
| icon                    | 3     | 88 B   |
| steps                   | 5     | 86 B   |
| skip link               | 2     | 77 B   |
| code block              | 5     | 67 B   |
| eyebrow                 | 2     | 58 B   |
| copy button             | 3     | 48 B   |
| sections                | 1     | 45 B   |
| band                    | 2     | 27 B   |
| picture                 | 1     | 22 B   |
| visually hidden         | 1     | 19 B   |
| actions                 | 1     | 7 B    |

What each function of the controls costs a page, as its bundler takes them without comments and gzipped: alone, on a page that imports only that one, and added, to a page that imports every other. The costliest added are `attachPanel` and `attachToast`.

| Function            | Alone  | Added  |
| ------------------- | ------ | ------ |
| `attachPanel`       | 2092 B | 1412 B |
| `attachToast`       | 1739 B | 1053 B |
| `attachStepper`     | 1485 B | 968 B  |
| `attachDialog`      | 1267 B | 689 B  |
| `attachThemeSwitch` | 1781 B | 657 B  |
| `attachCopyButton`  | 1005 B | 602 B  |
| `attachTable`       | 747 B  | 487 B  |
| `attachStatus`      | 332 B  | 63 B   |
| `chooseTheme`       | 865 B  | 4 B    |
