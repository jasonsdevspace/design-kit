# Site pages

Run `npm run bench:pages` to reproduce it. It runs the audit `npm run lighthouse` runs, and writes the record only when every page passes. The raw results are in [site-pages.json](site-pages.json).

Each page of jasonsdevspace.com/design-kit/, built and served locally, on a first visit as Lighthouse makes one: a phone on a slow network, its processor slowed, with nothing cached. CI holds every page to accessibility of a hundred, performance of at least ninety, a largest paint within 2,500 ms and layout shift within 0.1. Where a page misses a performance gate on its first trace, it is measured twice more and judged on the middle of the three. The local server gzips each file, as GitHub Pages does, so what a page downloads is close to what a visitor's browser receives.

| Recorded   | Commit    | Machine                                  | Node     |
| ---------- | --------- | ---------------------------------------- | -------- |
| 2026-11-25 | `37860dd` | AMD EPYC 9V74 80-Core Processor, 4 cores | v24.22.3 |

Measured with Lighthouse 13.6.0 in Chrome 158, the site drawing from version 0.9.4 of the kit. Since the record on 2026-11-22 at `0a52cd7`, when the site drew from version 0.9.3 of the kit, the pages download 407.3 KB together where they downloaded 265.6 KB.

| Page                          | Accessibility | Performance | Largest paint | Layout shift | Downloads | Requests |
| ----------------------------- | ------------- | ----------- | ------------- | ------------ | --------- | -------- |
| /design-kit/                  | 100           | 100         | 755 ms        | 0.000        | 32.7 KB   | 4        |
| /design-kit/tokens/           | 100           | 100         | 756 ms        | 0.000        | 37.3 KB   | 4        |
| /design-kit/controls/         | 100           | 100         | 910 ms        | 0.000        | 51.3 KB   | 4        |
| /design-kit/app-pieces/       | 100           | 100         | 756 ms        | 0.000        | 39.5 KB   | 4        |
| /design-kit/layouts/          | 100           | 100         | 755 ms        | 0.000        | 35.3 KB   | 5        |
| /design-kit/page-chrome/      | 100           | 100         | 757 ms        | 0.000        | 33.6 KB   | 4        |
| /design-kit/explainer-pieces/ | 100           | 100         | 754 ms        | 0.000        | 33.8 KB   | 4        |
| /design-kit/together/         | 100           | 100         | 755 ms        | 0.000        | 32.1 KB   | 4        |
| /design-kit/behavior/         | 100           | 100         | 756 ms        | 0.000        | 42.4 KB   | 5        |
| /design-kit/own-palette/      | 100           | 100         | 907 ms        | 0.000        | 36.2 KB   | 5        |
| /design-kit/how-it-works/     | 100           | 100         | 755 ms        | 0.000        | 33.1 KB   | 4        |
