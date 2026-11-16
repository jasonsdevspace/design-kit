# Package size

Run `npm run bench:package` to reproduce it. The raw results are in [package-size.json](package-size.json).

What a demo installs when it adds the kit, measured from the tarball `npm pack` makes, which is what npm publishes. Each file is shown as it sits in the package and gzipped, as a server would send it. A page loads the sheets it imports, and each sheet is also shown gzipped without its comments and blank lines, which is most of what a page's minifier takes out, and which the sheets' budget holds for the three together. Of the modules, the plugin in `vite.js` runs only in a build, the theme script from `theme.js` goes inline in the page's head, `react.js` reaches a visitor only on a page that renders React in the browser, and `controls.js` reaches one on a page that attaches a control.

| Recorded   | Commit    | Machine                                  | Node     |
| ---------- | --------- | ---------------------------------------- | -------- |
| 2026-11-16 | `d510aea` | AMD EPYC 7763 64-Core Processor, 4 cores | v24.22.2 |

`@jasonsdevspace/design-kit@0.8.1`, 71.9 KB packed. The sheets a page loads come to 10.1 KB gzipped together without their comments, the figure their budget holds. Since the record of version 0.8.0 on 2026-11-16 at `2caf42c`, it packs 71.9 KB where it packed 70.7 KB, and the sheets together came to 10.0 KB.

The sheets a page loads:

| File                | Raw      | Gzipped | Without comments |
| ------------------- | -------- | ------- | ---------------- |
| dist/base.css       | 8.9 KB   | 2.9 KB  | 1.1 KB           |
| dist/components.css | 125.0 KB | 27.9 KB | 8.2 KB           |
| dist/tokens.css     | 15.7 KB  | 5.0 KB  | 1.4 KB           |

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
| package.json              | 2.4 KB  | 0.8 KB  |
| README.md                 | 18.9 KB | 5.5 KB  |

What each piece costs the three sheets, as what they save sent together without their comments and gzipped once its rules are taken out, the costliest first. A rule belongs to the piece it draws. The costs add up to less than the whole, since a piece that repeats another saves little once taken out. The costliest are the page's own elements, tokens and app frame.

| Piece                   | Rules | Costs |
| ----------------------- | ----- | ----- |
| the page's own elements | 31    | 979 B |
| tokens                  | 6     | 943 B |
| app frame               | 46    | 863 B |
| button                  | 29    | 622 B |
| strip                   | 20    | 469 B |
| rows                    | 29    | 435 B |
| field                   | 19    | 428 B |
| explainer               | 22    | 414 B |
| table                   | 17    | 360 B |
| button grid             | 12    | 298 B |
| dialog                  | 14    | 265 B |
| stepper                 | 11    | 257 B |
| choice                  | 15    | 232 B |
| theme switch            | 14    | 230 B |
| tab bar                 | 15    | 219 B |
| toast                   | 10    | 184 B |
| pills                   | 12    | 151 B |
| tabs                    | 9     | 146 B |
| callout                 | 10    | 125 B |
| footer                  | 6     | 122 B |
| animations              | 4     | 116 B |
| icon                    | 3     | 92 B  |
| site header             | 5     | 92 B  |
| skip link               | 2     | 76 B  |
| steps                   | 5     | 73 B  |
| code block              | 5     | 65 B  |
| panel                   | 6     | 65 B  |
| content page            | 4     | 63 B  |
| eyebrow                 | 2     | 58 B  |
| copy button             | 3     | 53 B  |
| visually hidden         | 1     | 17 B  |
| actions                 | 1     | 10 B  |

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
