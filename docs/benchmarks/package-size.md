# Package size

Run `npm run bench:package` to reproduce it. The raw results are in [package-size.json](package-size.json).

What a demo installs when it adds the kit, measured from the tarball `npm pack` makes, which is what npm publishes. Each file is shown as it sits in the package and gzipped, as a server would send it. A page loads the sheets it imports. Of the modules, the plugin in `vite.js` runs only in a build, the theme script from `theme.js` goes inline in the page's head, and `react.js` reaches a visitor only on a page that renders React in the browser.

| Recorded   | Commit    | Machine                | Node     |
| ---------- | --------- | ---------------------- | -------- |
| 2026-11-09 | `feea743` | Apple M2 Max, 12 cores | v24.22.2 |

`@jasonsdevspace/design-kit@0.2.0`, 28.2 KB packed.

The sheets a page loads:

| File                | Raw     | Gzipped |
| ------------------- | ------- | ------- |
| dist/base.css       | 6.0 KB  | 2.1 KB  |
| dist/components.css | 25.8 KB | 6.5 KB  |
| dist/tokens.css     | 5.7 KB  | 2.1 KB  |

The modules a page's build imports:

| File          | Raw     | Gzipped |
| ------------- | ------- | ------- |
| dist/react.js | 10.6 KB | 3.8 KB  |
| dist/theme.js | 2.4 KB  | 1.0 KB  |
| dist/vite.js  | 2.9 KB  | 1.3 KB  |

Every other file the package carries, which a page never loads:

| File            | Raw     | Gzipped |
| --------------- | ------- | ------- |
| CHANGELOG.md    | 16.2 KB | 6.0 KB  |
| dist/react.d.ts | 8.6 KB  | 2.8 KB  |
| dist/theme.d.ts | 1.3 KB  | 0.6 KB  |
| dist/vite.d.ts  | 2.2 KB  | 1.0 KB  |
| LICENSE         | 1.0 KB  | 0.6 KB  |
| package.json    | 2.0 KB  | 0.7 KB  |
| README.md       | 11.8 KB | 4.1 KB  |
