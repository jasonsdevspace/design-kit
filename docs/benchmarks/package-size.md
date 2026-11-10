# Package size

Run `npm run bench:package` to reproduce it. The raw results are in [package-size.json](package-size.json).

What a demo installs when it adds the kit, measured from the tarball `npm pack` makes, which is what npm publishes. Each file is shown as it sits in the package and gzipped, as a server would send it. A page loads the sheets it imports, and each sheet is also shown gzipped without its comments, as a page's minifier sends it, which is the figure the sheets' budget holds. Of the modules, the plugin in `vite.js` runs only in a build, the theme script from `theme.js` goes inline in the page's head, `react.js` reaches a visitor only on a page that renders React in the browser, and `controls.js` reaches one on a page that attaches the theme switch or a copy button.

| Recorded   | Commit    | Machine                | Node     |
| ---------- | --------- | ---------------------- | -------- |
| 2026-11-10 | `270efaf` | Apple M2 Max, 12 cores | v24.22.2 |

`@jasonsdevspace/design-kit@0.3.1`, 35.6 KB packed.

The sheets a page loads:

| File                | Raw     | Gzipped | Without comments |
| ------------------- | ------- | ------- | ---------------- |
| dist/base.css       | 8.0 KB  | 2.8 KB  | 1.0 KB           |
| dist/components.css | 44.1 KB | 10.2 KB | 3.6 KB           |
| dist/tokens.css     | 7.5 KB  | 2.7 KB  | 0.8 KB           |

The modules a page's build imports:

| File             | Raw     | Gzipped |
| ---------------- | ------- | ------- |
| dist/controls.js | 9.2 KB  | 3.0 KB  |
| dist/react.js    | 17.1 KB | 5.6 KB  |
| dist/theme.js    | 4.7 KB  | 1.7 KB  |
| dist/vite.js     | 2.9 KB  | 1.3 KB  |

Every other file the package carries, which a page never loads:

| File               | Raw     | Gzipped |
| ------------------ | ------- | ------- |
| dist/controls.d.ts | 1.1 KB  | 0.5 KB  |
| dist/react.d.ts    | 14.8 KB | 4.4 KB  |
| dist/theme.d.ts    | 2.5 KB  | 1.0 KB  |
| dist/vite.d.ts     | 2.2 KB  | 1.0 KB  |
| LICENSE            | 1.0 KB  | 0.6 KB  |
| package.json       | 2.1 KB  | 0.7 KB  |
| README.md          | 12.1 KB | 4.2 KB  |
