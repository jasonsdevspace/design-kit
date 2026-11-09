# Package size

Run `npm run bench:package` to reproduce it. The raw results are in [package-size.json](package-size.json).

What a demo installs when it adds the kit, measured from the tarball `npm pack` makes, which is what npm publishes. Each file is shown as it sits in the package and gzipped, as a server would send it. A page loads only the sheets and scripts it imports, and a page that draws its markup by hand loads no script of the kit's at all.

| Recorded   | Commit    | Machine                | Node     |
| ---------- | --------- | ---------------------- | -------- |
| 2026-11-09 | `ec735d4` | Apple M2 Max, 12 cores | v24.22.2 |

`@jasonsdevspace/design-kit@0.1.0-next.5`, 36.0 KB packed.

The sheets and scripts a page may load:

| File                | Raw     | Gzipped |
| ------------------- | ------- | ------- |
| dist/base.css       | 6.0 KB  | 2.1 KB  |
| dist/components.css | 24.9 KB | 6.3 KB  |
| dist/react.js       | 10.5 KB | 3.7 KB  |
| dist/theme.js       | 2.4 KB  | 1.0 KB  |
| dist/tokens.css     | 5.6 KB  | 2.1 KB  |
| dist/vite.js        | 2.9 KB  | 1.3 KB  |

Every other file the package carries, which a page never loads:

| File            | Raw     | Gzipped |
| --------------- | ------- | ------- |
| CHANGELOG.md    | 14.1 KB | 5.4 KB  |
| dist/react.d.ts | 8.3 KB  | 2.7 KB  |
| dist/theme.d.ts | 1.3 KB  | 0.6 KB  |
| dist/vite.d.ts  | 2.2 KB  | 1.0 KB  |
| LICENSE         | 1.0 KB  | 0.6 KB  |
| package.json    | 2.0 KB  | 0.7 KB  |
| README.md       | 40.6 KB | 13.6 KB |
