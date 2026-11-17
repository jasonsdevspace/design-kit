# Package size

Run `npm run bench:package` to reproduce it. The raw results are in [package-size.json](package-size.json).

What a demo installs when it adds the kit, measured from the tarball `npm pack` makes, which is what npm publishes. Each file is shown as it sits in the package and gzipped, as a server would send it. A page loads the sheets it imports, and each sheet is also shown gzipped without its comments and blank lines, which is most of what a page's minifier takes out, and which the sheets' budget holds for the three together. Of the modules, the plugin in `vite.js` runs only in a build, the theme script from `theme.js` goes inline in the page's head, `react.js` reaches a visitor only on a page that renders React in the browser, and `controls.js` reaches one on a page that attaches a control.

| Recorded   | Commit    | Machine                                  | Node     |
| ---------- | --------- | ---------------------------------------- | -------- |
| 2026-11-17 | `26dd384` | AMD EPYC 9V74 80-Core Processor, 4 cores | v24.22.2 |

`@jasonsdevspace/design-kit@0.8.4`, 76.6 KB packed. The sheets a page loads come to 10.7 KB gzipped together without their comments, the figure their budget holds. Since the record of version 0.8.3 on 2026-11-17 at `881cba2`, it packs 76.6 KB where it packed 73.2 KB, and the sheets together came to 10.4 KB.

The sheets a page loads:

| File                | Raw      | Gzipped | Without comments |
| ------------------- | -------- | ------- | ---------------- |
| dist/base.css       | 8.9 KB   | 2.9 KB  | 1.1 KB           |
| dist/components.css | 131.3 KB | 29.4 KB | 8.7 KB           |
| dist/tokens.css     | 17.6 KB  | 5.4 KB  | 1.5 KB           |

The modules a page's build imports:

| File             | Raw     | Gzipped |
| ---------------- | ------- | ------- |
| dist/controls.js | 46.6 KB | 13.3 KB |
| dist/react.js    | 20.1 KB | 6.0 KB  |
| dist/theme.js    | 4.7 KB  | 1.7 KB  |
| dist/vite.js     | 2.9 KB  | 1.3 KB  |

Every other file the package carries, which a page never loads:

| File                      | Raw     | Gzipped |
| ------------------------- | ------- | ------- |
| dist/controls.d.ts        | 10.9 KB | 3.8 KB  |
| dist/react.d.ts           | 20.8 KB | 5.9 KB  |
| dist/theme.d.ts           | 2.5 KB  | 1.0 KB  |
| dist/tokens.resolver.json | 30.9 KB | 1.9 KB  |
| dist/vite.d.ts            | 2.2 KB  | 1.0 KB  |
| LICENSE                   | 1.0 KB  | 0.6 KB  |
| package.json              | 2.5 KB  | 0.9 KB  |
| README.md                 | 19.3 KB | 5.5 KB  |

What each piece costs the three sheets, as what they save sent together without their comments and gzipped once its rules are taken out, the costliest first. A rule belongs to the piece it draws. The costs add up to less than the whole, since a piece that repeats another saves little once taken out. The costliest are the page's own elements, app frame and tokens.

| Piece                   | Rules | Costs  |
| ----------------------- | ----- | ------ |
| the page's own elements | 31    | 1032 B |
| app frame               | 47    | 954 B  |
| tokens                  | 6     | 953 B  |
| button                  | 31    | 687 B  |
| strip                   | 20    | 498 B  |
| rows                    | 29    | 479 B  |
| explainer               | 22    | 445 B  |
| field                   | 19    | 441 B  |
| table                   | 17    | 383 B  |
| button grid             | 12    | 305 B  |
| panel                   | 14    | 282 B  |
| stepper                 | 11    | 257 B  |
| tab bar                 | 16    | 256 B  |
| choice                  | 15    | 253 B  |
| theme switch            | 14    | 234 B  |
| toast                   | 10    | 211 B  |
| dialog                  | 10    | 201 B  |
| pills                   | 12    | 165 B  |
| tabs                    | 9     | 162 B  |
| callout                 | 10    | 133 B  |
| footer                  | 6     | 132 B  |
| animations              | 4     | 123 B  |
| content page            | 5     | 105 B  |
| site header             | 5     | 100 B  |
| icon                    | 3     | 89 B   |
| steps                   | 5     | 89 B   |
| skip link               | 2     | 84 B   |
| code block              | 5     | 66 B   |
| eyebrow                 | 2     | 59 B   |
| copy button             | 3     | 49 B   |
| sections                | 1     | 49 B   |
| band                    | 2     | 29 B   |
| picture                 | 1     | 27 B   |
| visually hidden         | 1     | 20 B   |
| actions                 | 1     | 10 B   |

What each function of the controls costs a page, as its bundler takes them without comments and gzipped: alone, on a page that imports only that one, and added, to a page that imports every other. The costliest added are `attachToast` and `attachStepper`.

| Function            | Alone  | Added  |
| ------------------- | ------ | ------ |
| `attachToast`       | 1691 B | 1027 B |
| `attachStepper`     | 1485 B | 967 B  |
| `attachDialog`      | 1252 B | 712 B  |
| `attachPanel`       | 1245 B | 692 B  |
| `attachThemeSwitch` | 1781 B | 668 B  |
| `attachCopyButton`  | 1005 B | 597 B  |
| `attachTable`       | 747 B  | 487 B  |
| `attachStatus`      | 332 B  | 62 B   |
| `chooseTheme`       | 865 B  | 4 B    |
