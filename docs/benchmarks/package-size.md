# Package size

Run `npm run bench:package` to reproduce it. The raw results are in [package-size.json](package-size.json).

What a demo installs when it adds the kit, measured from the tarball `npm pack` makes, which is what npm publishes. Each file is shown as it sits in the package and gzipped, as a server would send it. A page loads the sheets it imports, and each sheet is also shown gzipped without its comments and blank lines, which is most of what a page's minifier takes out, and which the sheets' budget holds for the three together. Of the modules, the plugin in `vite.js` runs only in a build, the theme script from `theme.js` goes inline in the page's head, `react.js` reaches a visitor only on a page that renders React in the browser, and `controls.js` reaches one on a page that attaches a control.

| Recorded   | Commit    | Machine                                  | Node     |
| ---------- | --------- | ---------------------------------------- | -------- |
| 2026-11-25 | `cb3b2c0` | INTEL(R) XEON(R) PLATINUM 8573C, 4 cores | v24.22.3 |

`@jasonsdevspace/design-kit@0.9.4`, 165.0 KB packed. The sheets a page loads come to 12.8 KB gzipped together without their comments, the figure their budget holds. Since the record of version 0.9.3 on 2026-11-22 at `5909b7d`, it packs 165.0 KB where it packed 132.5 KB, and the sheets together came to 12.0 KB.

The sheets a page loads:

| File                | Raw      | Gzipped | Without comments |
| ------------------- | -------- | ------- | ---------------- |
| dist/base.css       | 9.3 KB   | 3.1 KB  | 1.1 KB           |
| dist/components.css | 163.0 KB | 37.0 KB | 10.4 KB          |
| dist/tokens.css     | 25.3 KB  | 6.9 KB  | 1.9 KB           |

The modules a page's build imports:

| File                 | Raw     | Gzipped |
| -------------------- | ------- | ------- |
| dist/busy.js         | 4.4 KB  | 1.8 KB  |
| dist/controls.js     | 2.3 KB  | 1.0 KB  |
| dist/copy.js         | 4.7 KB  | 1.7 KB  |
| dist/dialog.js       | 10.1 KB | 3.5 KB  |
| dist/find.js         | 5.8 KB  | 2.2 KB  |
| dist/focus.js        | 8.7 KB  | 3.0 KB  |
| dist/form.js         | 24.0 KB | 7.5 KB  |
| dist/hooks.js        | 27.0 KB | 7.9 KB  |
| dist/line.js         | 8.9 KB  | 2.8 KB  |
| dist/marks.js        | 1.3 KB  | 0.6 KB  |
| dist/panel.js        | 18.2 KB | 5.8 KB  |
| dist/progress.js     | 5.1 KB  | 2.0 KB  |
| dist/react.js        | 27.2 KB | 8.0 KB  |
| dist/request.js      | 11.2 KB | 3.9 KB  |
| dist/roving.js       | 11.9 KB | 4.0 KB  |
| dist/state.js        | 12.7 KB | 4.4 KB  |
| dist/status.js       | 2.8 KB  | 1.1 KB  |
| dist/stepper.js      | 24.8 KB | 7.6 KB  |
| dist/table.js        | 3.3 KB  | 1.4 KB  |
| dist/teardown.js     | 6.6 KB  | 2.4 KB  |
| dist/theme-switch.js | 11.6 KB | 3.6 KB  |
| dist/theme.js        | 4.8 KB  | 1.7 KB  |
| dist/toast.js        | 25.3 KB | 7.7 KB  |
| dist/vite.js         | 2.9 KB  | 1.3 KB  |
| dist/words.js        | 8.8 KB  | 3.3 KB  |

Every other file the package carries, which a page never loads:

| File                      | Raw     | Gzipped |
| ------------------------- | ------- | ------- |
| dist/busy.d.ts            | 1.8 KB  | 0.8 KB  |
| dist/controls.d.ts        | 1.1 KB  | 0.4 KB  |
| dist/copy.d.ts            | 1.2 KB  | 0.6 KB  |
| dist/dialog.d.ts          | 3.7 KB  | 1.5 KB  |
| dist/find.d.ts            | 3.4 KB  | 1.2 KB  |
| dist/focus.d.ts           | 6.2 KB  | 2.2 KB  |
| dist/form.d.ts            | 5.9 KB  | 2.2 KB  |
| dist/hooks.d.ts           | 9.8 KB  | 3.4 KB  |
| dist/line.d.ts            | 4.8 KB  | 1.8 KB  |
| dist/marks.d.ts           | 0.6 KB  | 0.4 KB  |
| dist/panel.d.ts           | 2.7 KB  | 1.1 KB  |
| dist/progress.d.ts        | 2.3 KB  | 1.0 KB  |
| dist/react.d.ts           | 25.3 KB | 7.2 KB  |
| dist/request.d.ts         | 4.5 KB  | 1.8 KB  |
| dist/roving.d.ts          | 2.9 KB  | 1.2 KB  |
| dist/state.d.ts           | 3.9 KB  | 1.6 KB  |
| dist/status.d.ts          | 2.8 KB  | 1.2 KB  |
| dist/stepper.d.ts         | 4.9 KB  | 2.0 KB  |
| dist/table.d.ts           | 0.9 KB  | 0.5 KB  |
| dist/teardown.d.ts        | 4.9 KB  | 1.8 KB  |
| dist/theme-switch.d.ts    | 1.7 KB  | 0.8 KB  |
| dist/theme.d.ts           | 4.8 KB  | 1.7 KB  |
| dist/toast.d.ts           | 5.8 KB  | 2.2 KB  |
| dist/tokens.resolver.json | 31.1 KB | 2.0 KB  |
| dist/vite.d.ts            | 2.2 KB  | 1.0 KB  |
| dist/words.d.ts           | 1.8 KB  | 0.9 KB  |
| LICENSE                   | 1.0 KB  | 0.6 KB  |
| package.json              | 2.4 KB  | 0.8 KB  |
| README.md                 | 14.9 KB | 4.9 KB  |

What each piece costs the three sheets, as what they save sent together without their comments and gzipped once its rules are taken out, the costliest first. A rule belongs to the piece it draws. The costs add up to less than the whole, since a piece that repeats another saves little once taken out. The costliest are app frame, the page's own elements and tokens.

| Piece                   | Rules | Costs  |
| ----------------------- | ----- | ------ |
| app frame               | 53    | 1267 B |
| the page's own elements | 31    | 1037 B |
| tokens                  | 6     | 985 B  |
| button                  | 34    | 956 B  |
| button grid             | 19    | 694 B  |
| field                   | 29    | 651 B  |
| strip                   | 20    | 581 B  |
| rows                    | 33    | 532 B  |
| explainer               | 23    | 474 B  |
| table                   | 17    | 417 B  |
| stepper                 | 14    | 360 B  |
| theme switch            | 14    | 283 B  |
| panel                   | 14    | 280 B  |
| choice                  | 15    | 261 B  |
| tab bar                 | 16    | 247 B  |
| toast                   | 10    | 233 B  |
| content page            | 6     | 202 B  |
| pills                   | 12    | 194 B  |
| animations              | 6     | 187 B  |
| dialog                  | 9     | 184 B  |
| band-hero               | 7     | 183 B  |
| tabs                    | 9     | 183 B  |
| progress                | 10    | 170 B  |
| callout                 | 11    | 153 B  |
| footer                  | 6     | 112 B  |
| icon                    | 3     | 111 B  |
| steps                   | 5     | 91 B   |
| code block              | 5     | 83 B   |
| skip link               | 2     | 83 B   |
| site header             | 5     | 81 B   |
| eyebrow                 | 2     | 70 B   |
| copy button             | 3     | 53 B   |
| numeral                 | 1     | 52 B   |
| stack                   | 4     | 51 B   |
| sections                | 1     | 44 B   |
| fields                  | 3     | 42 B   |
| empty                   | 2     | 34 B   |
| band                    | 2     | 27 B   |
| loading line            | 2     | 26 B   |
| picture                 | 1     | 23 B   |
| visually hidden         | 1     | 9 B    |
| split                   | 2     | 7 B    |
| note                    | 1     | 4 B    |
| actions                 | 1     | 3 B    |

What each function of the controls costs a page, as its bundler takes them without comments and gzipped: alone, on a page that imports only that one, and added, to a page that imports every other. The costliest added are `attachForm` and `attachStepper`.

| Function            | Alone  | Added  |
| ------------------- | ------ | ------ |
| `attachForm`        | 9959 B | 5164 B |
| `attachStepper`     | 6767 B | 2647 B |
| `attachToast`       | 6096 B | 2299 B |
| `attachPanel`       | 4879 B | 1926 B |
| `attachRoving`      | 4288 B | 1730 B |
| `attachDialog`      | 3915 B | 937 B  |
| `attachThemeSwitch` | 3884 B | 679 B  |
| `attachCopyButton`  | 3519 B | 671 B  |
| `attachProgress`    | 3981 B | 642 B  |
| `focusOnArrival`    | 3788 B | 513 B  |
| `attachBusy`        | 3562 B | 494 B  |
| `attachTable`       | 2699 B | 442 B  |
| `attachStatus`      | 3131 B | 123 B  |
| `activeOf`          | 1489 B | 57 B   |
| `moveFocus`         | 3319 B | 7 B    |
| `chooseTheme`       | 2062 B | 5 B    |
