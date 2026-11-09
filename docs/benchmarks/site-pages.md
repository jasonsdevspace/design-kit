# Site pages

Run `npm run bench:pages` to reproduce it, which runs the audit `npm run lighthouse` runs and records what it measured. The raw results are in [site-pages.json](site-pages.json).

Each page of jasonsdevspace.com/design-kit/, built and served locally, on a first visit as Lighthouse makes one: a phone on a slow network, its processor slowed, with nothing cached. CI holds every page to accessibility of a hundred, performance of at least ninety, a largest paint within 2,500 ms and layout shift within 0.1. Where a page misses on its first trace, it is measured twice more and judged on the middle. The local server gzips each file, as GitHub Pages does, so what a page downloads is close to what a visitor's browser receives.

| Recorded   | Commit    | Machine                | Node     |
| ---------- | --------- | ---------------------- | -------- |
| 2026-11-09 | `ec735d4` | Apple M2 Max, 12 cores | v24.22.2 |

| Page                          | Accessibility | Performance | Largest paint | Layout shift | Downloads | Requests |
| ----------------------------- | ------------- | ----------- | ------------- | ------------ | --------- | -------- |
| /design-kit/                  | 100           | 100         | 908 ms        | 0.000        | 12.6 KB   | 3        |
| /design-kit/tokens/           | 100           | 100         | 914 ms        | 0.000        | 15.5 KB   | 3        |
| /design-kit/controls/         | 100           | 100         | 913 ms        | 0.000        | 15.9 KB   | 3        |
| /design-kit/page-chrome/      | 100           | 100         | 911 ms        | 0.000        | 13.8 KB   | 3        |
| /design-kit/explainer-pieces/ | 100           | 100         | 911 ms        | 0.000        | 14.0 KB   | 3        |
| /design-kit/how-it-works/     | 100           | 100         | 907 ms        | 0.000        | 13.3 KB   | 3        |
