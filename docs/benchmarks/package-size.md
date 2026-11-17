# Package size

Run `npm run bench:package` to reproduce it. The raw results are in [package-size.json](package-size.json).

What a demo installs when it adds the kit, measured from the tarball `npm pack` makes, which is what npm publishes. Each file is shown as it sits in the package and gzipped, as a server would send it. A page loads the sheets it imports, and each sheet is also shown gzipped without its comments and blank lines, which is most of what a page's minifier takes out, and which the sheets' budget holds for the three together. Of the modules, the plugin in `vite.js` runs only in a build, the theme script from `theme.js` goes inline in the page's head, `react.js` reaches a visitor only on a page that renders React in the browser, and `controls.js` reaches one on a page that attaches a control.

| Recorded   | Commit    | Machine                                  | Node     |
| ---------- | --------- | ---------------------------------------- | -------- |
| 2026-11-17 | `881cba2` | AMD EPYC 7763 64-Core Processor, 4 cores | v24.22.2 |

`@jasonsdevspace/design-kit@0.8.3`, 73.2 KB packed. The sheets a page loads come to 10.4 KB gzipped together without their comments, the figure their budget holds. Since the record of version 0.8.2 on 2026-11-17 at `8f1544d`, it packs 73.2 KB where it packed 73.1 KB, and the sheets together came to 10.4 KB.

The sheets a page loads:

| File                | Raw      | Gzipped | Without comments |
| ------------------- | -------- | ------- | ---------------- |
| dist/base.css       | 8.9 KB   | 2.9 KB  | 1.1 KB           |
| dist/components.css | 127.8 KB | 28.3 KB | 8.5 KB           |
| dist/tokens.css     | 16.8 KB  | 5.2 KB  | 1.4 KB           |

The modules a page's build imports:

| File             | Raw     | Gzipped |
| ---------------- | ------- | ------- |
| dist/controls.js | 40.5 KB | 11.7 KB |
| dist/react.js    | 20.0 KB | 6.0 KB  |
| dist/theme.js    | 4.7 KB  | 1.7 KB  |
| dist/vite.js     | 2.9 KB  | 1.3 KB  |

Every other file the package carries, which a page never loads:

| File                      | Raw     | Gzipped |
| ------------------------- | ------- | ------- |
| dist/controls.d.ts        | 9.4 KB  | 3.3 KB  |
| dist/react.d.ts           | 20.4 KB | 5.8 KB  |
| dist/theme.d.ts           | 2.5 KB  | 1.0 KB  |
| dist/tokens.resolver.json | 30.9 KB | 1.9 KB  |
| dist/vite.d.ts            | 2.2 KB  | 1.0 KB  |
| LICENSE                   | 1.0 KB  | 0.6 KB  |
| package.json              | 2.4 KB  | 0.8 KB  |
| README.md                 | 18.9 KB | 5.5 KB  |

What each piece costs the three sheets, as what they save sent together without their comments and gzipped once its rules are taken out, the costliest first. A rule belongs to the piece it draws. The costs add up to less than the whole, since a piece that repeats another saves little once taken out. The costliest are the page's own elements, tokens and app frame.

| Piece                   | Rules | Costs  |
| ----------------------- | ----- | ------ |
| the page's own elements | 31    | 1020 B |
| tokens                  | 6     | 960 B  |
| app frame               | 47    | 923 B  |
| button                  | 29    | 635 B  |
| strip                   | 20    | 476 B  |
| rows                    | 29    | 462 B  |
| field                   | 19    | 434 B  |
| explainer               | 22    | 419 B  |
| table                   | 17    | 370 B  |
| button grid             | 12    | 325 B  |
| panel                   | 14    | 297 B  |
| stepper                 | 11    | 271 B  |
| tab bar                 | 16    | 260 B  |
| choice                  | 15    | 242 B  |
| theme switch            | 14    | 232 B  |
| toast                   | 10    | 214 B  |
| dialog                  | 10    | 211 B  |
| pills                   | 12    | 174 B  |
| tabs                    | 9     | 157 B  |
| callout                 | 10    | 136 B  |
| footer                  | 6     | 132 B  |
| animations              | 4     | 120 B  |
| site header             | 5     | 99 B   |
| icon                    | 3     | 96 B   |
| steps                   | 5     | 84 B   |
| skip link               | 2     | 83 B   |
| code block              | 5     | 80 B   |
| content page            | 4     | 66 B   |
| eyebrow                 | 2     | 61 B   |
| copy button             | 3     | 51 B   |
| picture                 | 1     | 35 B   |
| visually hidden         | 1     | 25 B   |
| actions                 | 1     | 17 B   |

What each function of the controls costs a page, as its bundler takes them without comments and gzipped: alone, on a page that imports only that one, and added, to a page that imports every other. The costliest added are `attachToast` and `attachStepper`.

| Function            | Alone  | Added  |
| ------------------- | ------ | ------ |
| `attachToast`       | 1668 B | 1054 B |
| `attachStepper`     | 1466 B | 976 B  |
| `attachDialog`      | 1246 B | 802 B  |
| `attachThemeSwitch` | 1781 B | 685 B  |
| `attachCopyButton`  | 1005 B | 598 B  |
| `attachTable`       | 747 B  | 481 B  |
| `attachStatus`      | 332 B  | 63 B   |
| `chooseTheme`       | 865 B  | 4 B    |
