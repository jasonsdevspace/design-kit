# Package size

Run `npm run bench:package` to reproduce it. The raw results are in [package-size.json](package-size.json).

What a demo installs when it adds the kit, measured from the tarball `npm pack` makes, which is what npm publishes. Each file is shown as it sits in the package and gzipped, as a server would send it. A page loads the sheets it imports, and each sheet is also shown gzipped without its comments and blank lines, which is most of what a page's minifier takes out, and which the sheets' budget holds for the three together. Of the modules, the plugin in `vite.js` runs only in a build, the theme script from `theme.js` goes inline in the page's head, `react.js` reaches a visitor only on a page that renders React in the browser, and `controls.js` reaches one on a page that attaches a control.

| Recorded   | Commit    | Machine                                  | Node     |
| ---------- | --------- | ---------------------------------------- | -------- |
| 2026-11-20 | `1401468` | AMD EPYC 7763 64-Core Processor, 4 cores | v24.22.3 |

`@jasonsdevspace/design-kit@0.9.2`, 115.9 KB packed. The sheets a page loads come to 12.0 KB gzipped together without their comments, the figure their budget holds. Since the record of version 0.9.1 on 2026-11-20 at `d54ff06`, it packs 115.9 KB where it packed 116.5 KB, and the sheets together came to 12.0 KB.

The sheets a page loads:

| File                | Raw      | Gzipped | Without comments |
| ------------------- | -------- | ------- | ---------------- |
| dist/base.css       | 8.9 KB   | 2.9 KB  | 1.1 KB           |
| dist/components.css | 146.1 KB | 33.0 KB | 9.6 KB           |
| dist/tokens.css     | 24.1 KB  | 6.6 KB  | 1.9 KB           |

The modules a page's build imports:

| File             | Raw      | Gzipped |
| ---------------- | -------- | ------- |
| dist/controls.js | 119.2 KB | 33.4 KB |
| dist/hooks.js    | 19.3 KB  | 5.5 KB  |
| dist/line.js     | 1.4 KB   | 0.6 KB  |
| dist/react.js    | 25.4 KB  | 7.5 KB  |
| dist/theme.js    | 4.7 KB   | 1.7 KB  |
| dist/vite.js     | 2.9 KB   | 1.3 KB  |

Every other file the package carries, which a page never loads:

| File                      | Raw     | Gzipped |
| ------------------------- | ------- | ------- |
| dist/controls.d.ts        | 27.6 KB | 8.6 KB  |
| dist/hooks.d.ts           | 8.0 KB  | 2.8 KB  |
| dist/line.d.ts            | 2.0 KB  | 0.9 KB  |
| dist/react.d.ts           | 24.2 KB | 6.9 KB  |
| dist/theme.d.ts           | 2.5 KB  | 1.0 KB  |
| dist/tokens.resolver.json | 31.1 KB | 2.0 KB  |
| dist/vite.d.ts            | 2.2 KB  | 1.0 KB  |
| LICENSE                   | 1.0 KB  | 0.6 KB  |
| package.json              | 2.4 KB  | 0.8 KB  |
| README.md                 | 14.2 KB | 4.7 KB  |

What each piece costs the three sheets, as what they save sent together without their comments and gzipped once its rules are taken out, the costliest first. A rule belongs to the piece it draws. The costs add up to less than the whole, since a piece that repeats another saves little once taken out. The costliest are app frame, the page's own elements and tokens.

| Piece                   | Rules | Costs  |
| ----------------------- | ----- | ------ |
| app frame               | 51    | 1084 B |
| the page's own elements | 31    | 968 B  |
| tokens                  | 6     | 957 B  |
| button                  | 32    | 755 B  |
| button grid             | 19    | 705 B  |
| strip                   | 20    | 557 B  |
| rows                    | 33    | 537 B  |
| field                   | 22    | 507 B  |
| explainer               | 22    | 450 B  |
| table                   | 17    | 398 B  |
| panel                   | 14    | 286 B  |
| theme switch            | 14    | 280 B  |
| tab bar                 | 16    | 254 B  |
| choice                  | 15    | 252 B  |
| stepper                 | 11    | 251 B  |
| toast                   | 10    | 224 B  |
| pills                   | 12    | 197 B  |
| dialog                  | 10    | 196 B  |
| tabs                    | 9     | 184 B  |
| band-hero               | 7     | 165 B  |
| progress                | 10    | 162 B  |
| animations              | 5     | 155 B  |
| callout                 | 11    | 138 B  |
| icon                    | 3     | 112 B  |
| content page            | 5     | 103 B  |
| footer                  | 6     | 101 B  |
| site header             | 5     | 83 B   |
| eyebrow                 | 2     | 78 B   |
| code block              | 5     | 76 B   |
| skip link               | 2     | 70 B   |
| steps                   | 5     | 68 B   |
| copy button             | 3     | 56 B   |
| sections                | 1     | 51 B   |
| numeral                 | 1     | 46 B   |
| stack                   | 4     | 45 B   |
| loading line            | 2     | 39 B   |
| empty                   | 2     | 32 B   |
| band                    | 2     | 28 B   |
| picture                 | 1     | 22 B   |
| visually hidden         | 1     | 17 B   |
| split                   | 2     | 10 B   |
| actions                 | 1     | 8 B    |
| note                    | 1     | 3 B    |

What each function of the controls costs a page, as its bundler takes them without comments and gzipped: alone, on a page that imports only that one, and added, to a page that imports every other. The costliest added are `attachForm` and `attachStepper`.

| Function            | Alone  | Added  |
| ------------------- | ------ | ------ |
| `attachForm`        | 6138 B | 3668 B |
| `attachStepper`     | 3683 B | 1954 B |
| `attachRoving`      | 2733 B | 1711 B |
| `attachPanel`       | 2595 B | 1478 B |
| `attachToast`       | 2920 B | 1099 B |
| `attachDialog`      | 1813 B | 746 B  |
| `attachThemeSwitch` | 2346 B | 700 B  |
| `attachCopyButton`  | 2091 B | 621 B  |
| `attachProgress`    | 2512 B | 547 B  |
| `attachTable`       | 1299 B | 510 B  |
| `attachBusy`        | 2287 B | 461 B  |
| `focusOnArrival`    | 1722 B | 456 B  |
| `attachStatus`      | 1555 B | 5 B    |
| `chooseTheme`       | 1403 B | 5 B    |
| `activeOf`          | 727 B  | 2 B    |
| `moveFocus`         | 1276 B | 2 B    |
