# Package size

Run `npm run bench:package` to reproduce it. The raw results are in [package-size.json](package-size.json).

What a demo installs when it adds the kit, measured from the tarball `npm pack` makes, which is what npm publishes. Each file is shown as it sits in the package and gzipped, as a server would send it. A page loads the sheets it imports. Of the modules, the plugin in `vite.js` runs only in a build, the theme script from `theme.js` goes inline in the page's head, `react.js` reaches a visitor only on a page that renders React in the browser, and `controls.js` reaches one on a page that attaches the theme switch or a copy button.

| Recorded   | Commit    | Machine                | Node     |
| ---------- | --------- | ---------------------- | -------- |
| 2026-11-09 | `c18ec3c` | Apple M2 Max, 12 cores | v24.22.2 |

`@jasonsdevspace/design-kit@0.3.0`, 34.9 KB packed.

The sheets a page loads:

| File                | Raw     | Gzipped |
| ------------------- | ------- | ------- |
| dist/base.css       | 6.0 KB  | 2.1 KB  |
| dist/components.css | 31.6 KB | 7.5 KB  |
| dist/tokens.css     | 6.4 KB  | 2.3 KB  |

The modules a page's build imports:

| File             | Raw     | Gzipped |
| ---------------- | ------- | ------- |
| dist/controls.js | 9.2 KB  | 3.0 KB  |
| dist/react.js    | 13.0 KB | 4.5 KB  |
| dist/theme.js    | 2.8 KB  | 1.1 KB  |
| dist/vite.js     | 2.9 KB  | 1.3 KB  |

Every other file the package carries, which a page never loads:

| File               | Raw     | Gzipped |
| ------------------ | ------- | ------- |
| CHANGELOG.md       | 19.4 KB | 7.0 KB  |
| dist/controls.d.ts | 1.1 KB  | 0.5 KB  |
| dist/react.d.ts    | 10.1 KB | 3.3 KB  |
| dist/theme.d.ts    | 1.8 KB  | 0.8 KB  |
| dist/vite.d.ts     | 2.2 KB  | 1.0 KB  |
| LICENSE            | 1.0 KB  | 0.6 KB  |
| package.json       | 2.1 KB  | 0.7 KB  |
| README.md          | 12.2 KB | 4.2 KB  |
