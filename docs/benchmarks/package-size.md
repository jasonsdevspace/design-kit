# Package size

Run `npm run bench:package` to reproduce it. The raw results are in [package-size.json](package-size.json).

What a demo installs when it adds the kit, measured from the tarball `npm pack` makes, which is what npm publishes. Each file is shown as it sits in the package and gzipped, as a server would send it. A page loads the sheets it imports, and each sheet is also shown gzipped without its comments and blank lines, which is most of what a page's minifier takes out, and which the sheets' budget holds for the three together. Of the modules, the plugin in `vite.js` runs only in a build, the theme script from `theme.js` goes inline in the page's head, `react.js` reaches a visitor only on a page that renders React in the browser, and `controls.js` reaches one on a page that attaches a control.

| Recorded   | Commit    | Machine                                  | Node     |
| ---------- | --------- | ---------------------------------------- | -------- |
| 2026-11-10 | `b412755` | AMD EPYC 7763 64-Core Processor, 4 cores | v24.22.2 |

`@jasonsdevspace/design-kit@0.4.0`, 37.4 KB packed.

The sheets a page loads:

| File                | Raw     | Gzipped | Without comments |
| ------------------- | ------- | ------- | ---------------- |
| dist/base.css       | 8.3 KB  | 2.8 KB  | 1.0 KB           |
| dist/components.css | 48.9 KB | 11.1 KB | 3.8 KB           |
| dist/tokens.css     | 7.5 KB  | 2.7 KB  | 0.8 KB           |

The modules a page's build imports:

| File             | Raw     | Gzipped |
| ---------------- | ------- | ------- |
| dist/controls.js | 13.1 KB | 4.0 KB  |
| dist/react.js    | 15.7 KB | 5.0 KB  |
| dist/theme.js    | 4.7 KB  | 1.7 KB  |
| dist/vite.js     | 2.9 KB  | 1.3 KB  |

Every other file the package carries, which a page never loads:

| File               | Raw     | Gzipped |
| ------------------ | ------- | ------- |
| dist/controls.d.ts | 1.6 KB  | 0.7 KB  |
| dist/react.d.ts    | 15.6 KB | 4.6 KB  |
| dist/theme.d.ts    | 2.5 KB  | 1.0 KB  |
| dist/vite.d.ts     | 2.2 KB  | 1.0 KB  |
| LICENSE            | 1.0 KB  | 0.6 KB  |
| package.json       | 2.1 KB  | 0.7 KB  |
| README.md          | 12.2 KB | 4.2 KB  |
