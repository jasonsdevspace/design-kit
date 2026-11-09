# Site pages

Run `npm run bench:pages` to reproduce it. It runs the audit `npm run lighthouse` runs, and writes the record only when every page passes. The raw results are in [site-pages.json](site-pages.json).

Each page of jasonsdevspace.com/design-kit/, built and served locally, on a first visit as Lighthouse makes one: a phone on a slow network, its processor slowed, with nothing cached. CI holds every page to accessibility of a hundred, performance of at least ninety, a largest paint within 2,500 ms and layout shift within 0.1. Where a page misses a performance gate on its first trace, it is measured twice more and judged on the middle of the three. The local server gzips each file, as GitHub Pages does, so what a page downloads is close to what a visitor's browser receives.

| Recorded   | Commit    | Machine                | Node     |
| ---------- | --------- | ---------------------- | -------- |
| 2026-11-09 | `cc3f409` | Apple M2 Max, 12 cores | v24.22.2 |

Measured with Lighthouse 13.5.0 in Chrome 156, the site drawing from version 0.1.2 of the kit.

| Page                          | Accessibility | Performance | Largest paint | Layout shift | Downloads | Requests |
| ----------------------------- | ------------- | ----------- | ------------- | ------------ | --------- | -------- |
| /design-kit/                  | 100           | 100         | 909 ms        | 0.000        | 12.6 KB   | 3        |
| /design-kit/tokens/           | 100           | 100         | 914 ms        | 0.000        | 15.5 KB   | 3        |
| /design-kit/controls/         | 100           | 100         | 913 ms        | 0.000        | 15.9 KB   | 3        |
| /design-kit/page-chrome/      | 100           | 100         | 912 ms        | 0.000        | 13.8 KB   | 3        |
| /design-kit/explainer-pieces/ | 100           | 100         | 912 ms        | 0.000        | 14.0 KB   | 3        |
| /design-kit/how-it-works/     | 100           | 100         | 908 ms        | 0.000        | 13.3 KB   | 3        |
