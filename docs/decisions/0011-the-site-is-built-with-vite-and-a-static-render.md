# 11. The site is built with Vite and React's static render, with no script of React's

**Status:** accepted

## Context

The kit needs a site that shows each piece at work beside the markup a page writes for it, served
at jasonsdevspace.com/design-kit/ from GitHub Pages as the demos are. Whatever builds it has to
draw the kit as a demo draws it: from the kit's own sheets, under a policy that allows styles only
from the page's origin, with the theme script inline and named by its hash, and held to the same
audits. GitHub Pages sends no headers a project sets, so the policy has to travel in each page. The
examples the site draws are React elements, from the module record 10 sets out, and the kit's
components draw markup alone, so nothing on a page needs React in the browser.

## Options

**A. Storybook.** The usual home for a component library's examples, with a page for each story
and controls to change its props. Rejected, since its manager and preview run their own script and
inject styles of their own, so the examples could not be drawn under `style-src 'self'`, which is
the promise the site exists to show. It also draws each story in a frame, where a reader's text
size and theme do not reach as they reach a demo.

**B. A documentation or static site framework, such as Astro, Eleventy or Docusaurus.** Each builds
static pages well. Rejected, since each brings a templating language or a runtime of its own beside
the React the examples are written in, Docusaurus ships a client app to every page, and each adds
its own conventions for where pages, styles and assets live, for a site of a few pages.

**C. Pages written by hand.** HTML files with the kit's markup typed in. Rejected, since the markup
would be a third copy beside the README and the tests, which record 10 removes, and nothing would
hold it to what the components draw.

**D. Vite and React's static render.** Vite builds each page from an HTML file, bundles the kit's
sheets into one file served from the site's origin, and puts the theme script inline with the kit's
own plugin. A plugin of the site's draws each page's body with `renderToStaticMarkup` as the page is
built, and writes its policy. No script of React's reaches the browser.

## Decision

Option D. `packages/site` is a private workspace, served under `/design-kit/` in the build, the
preview and the audits alike, so every link the tests follow is the one a visitor follows. Each page
has a meta element for its policy: nothing by default, scripts only by the theme script's hash,
styles and images only from the site's origin, no base element and no form posts. The footer names
the version of the kit a page is drawn from and the commit it was built at. CI builds and uploads the
site from a job with read access alone once every check has passed on main, and a job that runs only
GitHub's Pages actions deploys it.

## Consequences

- The site is a demo of the kit under the policy a demo would set, so a change that breaks that
  promise breaks the site's own tests before it reaches a page that installs the kit.
- A policy in a meta element cannot say which pages may frame the site, which only a header can, and
  GitHub Pages sends none, so the site can be framed.
- A page whose script the site adds later is named in its policy by hash or served from the site's
  origin, and the browser tests refuse anything else.
- A new page is held to the browser tests and the Lighthouse audit as soon as the build writes it,
  since both find the pages in the build rather than in a list.
- Lighthouse is a dependency of the repository's own, for development alone, and the package gains
  nothing.

## How it is tested

The paths are in `packages/site`.

- `e2e/site.spec.ts` opens every page the build writes, from the preview the Playwright config
  serves, and finds no axe findings in either theme on a phone or a wide screen, no sideways scroll
  at any width or at twice the text size, no text cut off under the spacing a reader may set, one of
  each landmark and no id twice, and nothing the page's policy refuses, with the theme script
  setting the theme only because its hash lets it run.
- `bench/lighthouse.ts` audits every page the build writes, held to the demos' gates: accessibility
  at a hundred, and on a first visit, performance at ninety or more, the largest paint within two and
  a half seconds and a layout shift of no more than a tenth.
