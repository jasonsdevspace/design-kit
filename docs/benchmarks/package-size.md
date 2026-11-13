# Package size

Run `npm run bench:package` to reproduce it. The raw results are in [package-size.json](package-size.json).

What a demo installs when it adds the kit, measured from the tarball `npm pack` makes, which is what npm publishes. Each file is shown as it sits in the package and gzipped, as a server would send it. A page loads the sheets it imports, and each sheet is also shown gzipped without its comments and blank lines, which is most of what a page's minifier takes out, and which the sheets' budget holds for the three together. Of the modules, the plugin in `vite.js` runs only in a build, the theme script from `theme.js` goes inline in the page's head, `react.js` reaches a visitor only on a page that renders React in the browser, and `controls.js` reaches one on a page that attaches a control.

| Recorded   | Commit    | Machine                                  | Node     |
| ---------- | --------- | ---------------------------------------- | -------- |
| 2026-11-13 | `816565f` | AMD EPYC 7763 64-Core Processor, 4 cores | v24.22.2 |

`@jasonsdevspace/design-kit@0.6.0`, 61.7 KB packed. Since the record of version 0.5.0 on 2026-11-12 at `7048d11`, it packs 61.7 KB where it packed 51.6 KB, and the sheets a page loads come to 9.2 KB gzipped without their comments where they came to 7.7 KB.

The sheets a page loads:

| File                | Raw      | Gzipped | Without comments |
| ------------------- | -------- | ------- | ---------------- |
| dist/base.css       | 8.9 KB   | 2.9 KB  | 1.1 KB           |
| dist/components.css | 104.6 KB | 23.4 KB | 7.1 KB           |
| dist/tokens.css     | 10.9 KB  | 3.8 KB  | 1.0 KB           |

The modules a page's build imports:

| File             | Raw     | Gzipped |
| ---------------- | ------- | ------- |
| dist/controls.js | 37.7 KB | 10.8 KB |
| dist/react.js    | 19.0 KB | 5.7 KB  |
| dist/theme.js    | 4.7 KB  | 1.7 KB  |
| dist/vite.js     | 2.9 KB  | 1.3 KB  |

Every other file the package carries, which a page never loads:

| File               | Raw     | Gzipped |
| ------------------ | ------- | ------- |
| dist/controls.d.ts | 8.6 KB  | 3.1 KB  |
| dist/react.d.ts    | 18.9 KB | 5.4 KB  |
| dist/theme.d.ts    | 2.5 KB  | 1.0 KB  |
| dist/vite.d.ts     | 2.2 KB  | 1.0 KB  |
| LICENSE            | 1.0 KB  | 0.6 KB  |
| package.json       | 2.2 KB  | 0.7 KB  |
| README.md          | 14.5 KB | 4.6 KB  |

What each piece costs the three sheets, as what they save sent together without their comments and gzipped once its rules are taken out, the costliest first. A rule belongs to the piece it draws. The costs add up to less than the whole, since a piece that repeats another saves little once taken out. The costliest are the page's own elements, app frame and tokens.

| Piece                   | Rules | Costs |
| ----------------------- | ----- | ----- |
| the page's own elements | 31    | 926 B |
| app frame               | 44    | 902 B |
| tokens                  | 4     | 821 B |
| strip                   | 20    | 497 B |
| button                  | 22    | 492 B |
| field                   | 19    | 451 B |
| explainer               | 21    | 374 B |
| button grid             | 13    | 337 B |
| dialog                  | 14    | 261 B |
| stepper                 | 11    | 257 B |
| theme switch            | 14    | 240 B |
| choice                  | 15    | 234 B |
| table                   | 15    | 232 B |
| tab bar                 | 14    | 210 B |
| rows                    | 14    | 186 B |
| toast                   | 9     | 164 B |
| pills                   | 10    | 136 B |
| tabs                    | 7     | 127 B |
| callout                 | 10    | 123 B |
| skip link               | 2     | 101 B |
| footer                  | 4     | 80 B  |
| steps                   | 5     | 76 B  |
| code block              | 5     | 69 B  |
| eyebrow                 | 2     | 62 B  |
| panel                   | 6     | 51 B  |
| copy button             | 3     | 44 B  |
| animations              | 2     | 33 B  |
| visually hidden         | 1     | 18 B  |
| actions                 | 1     | 3 B   |

What each function of the controls costs a page, as its bundler takes them without comments and gzipped: alone, on a page that imports only that one, and added, to a page that imports every other. The costliest added are `attachToast` and `attachStepper`.

| Function            | Alone  | Added  |
| ------------------- | ------ | ------ |
| `attachToast`       | 1668 B | 1059 B |
| `attachStepper`     | 1466 B | 978 B  |
| `attachThemeSwitch` | 1781 B | 698 B  |
| `attachCopyButton`  | 1005 B | 600 B  |
| `attachTable`       | 747 B  | 485 B  |
| `attachDialog`      | 886 B  | 470 B  |
| `chooseTheme`       | 865 B  | 4 B    |
