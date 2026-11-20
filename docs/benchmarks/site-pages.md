# Site pages

Run `npm run bench:pages` to reproduce it. It runs the audit `npm run lighthouse` runs, and writes the record only when every page passes. The raw results are in [site-pages.json](site-pages.json).

Each page of jasonsdevspace.com/design-kit/, built and served locally, on a first visit as Lighthouse makes one: a phone on a slow network, its processor slowed, with nothing cached. CI holds every page to accessibility of a hundred, performance of at least ninety, a largest paint within 2,500 ms and layout shift within 0.1. Where a page misses a performance gate on its first trace, it is measured twice more and judged on the middle of the three. The local server gzips each file, as GitHub Pages does, so what a page downloads is close to what a visitor's browser receives.

| Recorded   | Commit    | Machine                                  | Node     |
| ---------- | --------- | ---------------------------------------- | -------- |
| 2026-11-20 | `01da151` | AMD EPYC 9V74 80-Core Processor, 4 cores | v24.22.2 |

Measured with Lighthouse 13.6.0 in Chrome 158, the site drawing from version 0.9.0 of the kit. Since the record on 2026-11-20 at `142e4f7`, when the site drew from version 0.8.7 of the kit, the pages download 244.6 KB together where they downloaded 227.6 KB.

| Page                          | Accessibility | Performance | Largest paint | Layout shift | Downloads | Requests |
| ----------------------------- | ------------- | ----------- | ------------- | ------------ | --------- | -------- |
| /design-kit/                  | 100           | 100         | 755 ms        | 0.000        | 27.1 KB   | 4        |
| /design-kit/tokens/           | 100           | 100         | 755 ms        | 0.000        | 31.2 KB   | 4        |
| /design-kit/controls/         | 100           | 100         | 905 ms        | 0.000        | 41.7 KB   | 4        |
| /design-kit/app-pieces/       | 100           | 100         | 756 ms        | 0.000        | 33.2 KB   | 4        |
| /design-kit/page-chrome/      | 100           | 100         | 754 ms        | 0.000        | 28.9 KB   | 4        |
| /design-kit/explainer-pieces/ | 100           | 100         | 755 ms        | 0.000        | 28.3 KB   | 4        |
| /design-kit/together/         | 100           | 100         | 754 ms        | 0.000        | 26.6 KB   | 4        |
| /design-kit/how-it-works/     | 100           | 100         | 754 ms        | 0.000        | 27.6 KB   | 4        |
