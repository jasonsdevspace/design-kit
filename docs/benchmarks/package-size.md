# Package size

Run `npm run bench:package` to reproduce it. The raw results are in [package-size.json](package-size.json).

What a demo installs when it adds the kit, measured from the tarball `npm pack` makes, which is what npm publishes. Each file is shown as it sits in the package and gzipped, as a server would send it. A page loads the sheets it imports, and each sheet is also shown gzipped without its comments and blank lines, which is most of what a page's minifier takes out, and which the sheets' budget holds for the three together. Of the modules, the plugin in `vite.js` runs only in a build, the theme script from `theme.js` goes inline in the page's head, `react.js` reaches a visitor only on a page that renders React in the browser, and `controls.js` reaches one on a page that attaches a control.

| Recorded   | Commit    | Machine                                  | Node     |
| ---------- | --------- | ---------------------------------------- | -------- |
| 2026-11-20 | `abf0d60` | AMD EPYC 9V45 96-Core Processor, 4 cores | v24.22.3 |

`@jasonsdevspace/design-kit@0.9.0`, 114.7 KB packed. The sheets a page loads come to 11.9 KB gzipped together without their comments, the figure their budget holds. Since the record of version 0.8.7 on 2026-11-18 at `b07bd18`, it packs 114.7 KB where it packed 80.1 KB, and the sheets together came to 11.1 KB.

The sheets a page loads:

| File                | Raw      | Gzipped | Without comments |
| ------------------- | -------- | ------- | ---------------- |
| dist/base.css       | 8.9 KB   | 2.9 KB  | 1.1 KB           |
| dist/components.css | 145.4 KB | 32.8 KB | 9.6 KB           |
| dist/tokens.css     | 24.1 KB  | 6.6 KB  | 1.9 KB           |

The modules a page's build imports:

| File             | Raw      | Gzipped |
| ---------------- | -------- | ------- |
| dist/controls.js | 116.4 KB | 32.8 KB |
| dist/hooks.js    | 14.9 KB  | 4.3 KB  |
| dist/react.js    | 25.4 KB  | 7.5 KB  |
| dist/theme.js    | 4.7 KB   | 1.7 KB  |
| dist/vite.js     | 2.9 KB   | 1.3 KB  |

Every other file the package carries, which a page never loads:

| File                      | Raw     | Gzipped |
| ------------------------- | ------- | ------- |
| dist/controls.d.ts        | 27.0 KB | 8.4 KB  |
| dist/hooks.d.ts           | 6.7 KB  | 2.4 KB  |
| dist/react.d.ts           | 24.2 KB | 6.9 KB  |
| dist/theme.d.ts           | 2.5 KB  | 1.0 KB  |
| dist/tokens.resolver.json | 31.1 KB | 2.0 KB  |
| dist/vite.d.ts            | 2.2 KB  | 1.0 KB  |
| LICENSE                   | 1.0 KB  | 0.6 KB  |
| package.json              | 2.4 KB  | 0.8 KB  |
| README.md                 | 27.6 KB | 7.4 KB  |

What each piece costs the three sheets, as what they save sent together without their comments and gzipped once its rules are taken out, the costliest first. A rule belongs to the piece it draws. The costs add up to less than the whole, since a piece that repeats another saves little once taken out. The costliest are app frame, the page's own elements and tokens.

| Piece                   | Rules | Costs  |
| ----------------------- | ----- | ------ |
| app frame               | 51    | 1078 B |
| the page's own elements | 31    | 970 B  |
| tokens                  | 6     | 957 B  |
| button                  | 32    | 750 B  |
| button grid             | 19    | 707 B  |
| strip                   | 20    | 554 B  |
| rows                    | 33    | 538 B  |
| field                   | 22    | 500 B  |
| explainer               | 22    | 448 B  |
| table                   | 17    | 396 B  |
| panel                   | 14    | 290 B  |
| theme switch            | 14    | 278 B  |
| tab bar                 | 16    | 256 B  |
| stepper                 | 11    | 252 B  |
| choice                  | 15    | 249 B  |
| toast                   | 10    | 225 B  |
| dialog                  | 10    | 199 B  |
| pills                   | 12    | 196 B  |
| tabs                    | 9     | 186 B  |
| progress                | 10    | 162 B  |
| animations              | 5     | 155 B  |
| band-hero               | 6     | 144 B  |
| callout                 | 11    | 134 B  |
| icon                    | 3     | 112 B  |
| footer                  | 6     | 100 B  |
| content page            | 5     | 99 B   |
| site header             | 5     | 80 B   |
| code block              | 5     | 77 B   |
| eyebrow                 | 2     | 77 B   |
| skip link               | 2     | 69 B   |
| steps                   | 5     | 69 B   |
| copy button             | 3     | 57 B   |
| sections                | 1     | 50 B   |
| numeral                 | 1     | 46 B   |
| stack                   | 4     | 45 B   |
| loading line            | 2     | 38 B   |
| empty                   | 2     | 33 B   |
| band                    | 2     | 27 B   |
| picture                 | 1     | 23 B   |
| visually hidden         | 1     | 18 B   |
| split                   | 2     | 10 B   |
| actions                 | 1     | 8 B    |
| note                    | 1     | 5 B    |

What each function of the controls costs a page, as its bundler takes them without comments and gzipped: alone, on a page that imports only that one, and added, to a page that imports every other. The costliest added are `attachForm` and `attachStepper`.

| Function            | Alone  | Added  |
| ------------------- | ------ | ------ |
| `attachForm`        | 5978 B | 3571 B |
| `attachStepper`     | 3615 B | 1939 B |
| `attachRoving`      | 2712 B | 1704 B |
| `attachPanel`       | 2595 B | 1452 B |
| `attachToast`       | 2868 B | 1087 B |
| `attachDialog`      | 1813 B | 716 B  |
| `attachThemeSwitch` | 2333 B | 692 B  |
| `attachCopyButton`  | 2019 B | 622 B  |
| `attachProgress`    | 2412 B | 545 B  |
| `attachTable`       | 1279 B | 482 B  |
| `attachBusy`        | 2189 B | 464 B  |
| `focusOnArrival`    | 1722 B | 449 B  |
| `attachStatus`      | 1476 B | 5 B    |
| `chooseTheme`       | 1403 B | 5 B    |
| `moveFocus`         | 1276 B | 2 B    |
