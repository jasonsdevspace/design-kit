# 11. The site is built with Vite and React's static render, with no script of React's

**Status:** accepted

## Context

The kit needs a site that says what it is and draws it as a demo draws it, served at
jasonsdevspace.com/design-kit/ from GitHub Pages as the demos are. Whatever builds it has to draw
the kit from its own sheets, under a policy that allows styles only from the page's origin, with
the theme script inline and named by its hash, and held to the same audits. GitHub Pages sends no
headers a project sets, so the policy has to travel in each page. The site's pages are drawn from
the kit's own React components, which draw markup alone, so nothing on a page needs React in the
browser.

## Options

**A. Storybook.** The usual home for a component library's examples, with a page for each story
and controls to change its props. Rejected, since every story is drawn in the browser by a client
app of Storybook's, so React and Storybook's own script would reach every page and the policy would
have to allow them beside the theme script, and the site exists to show a page with no script but
that one.

**B. A documentation or static site framework, such as Astro, Eleventy or Docusaurus.** Each builds
static pages well. Rejected, since Astro and Eleventy write pages in templating languages of their
own beside the React the components are written in, Docusaurus draws every page as a React app in
the browser, and each adds its own conventions for where pages, styles and assets live, for a site
this small.

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

**Amended to draw the published kit.** The site installs the kit from npm at one exact version, as
ShelfLens does, under the alias `design-kit-release` so npm fetches the published package rather
than linking the workspace beside it. Its sheets, components and theme plugin all come from that
version, and its footer names it. What a visitor sees is then what a demo installs, the site's tests
and audit hold what ships, and the footer never names a version npm cannot give. A change to the
kit reaches the site a release later, in a pull request that moves the pin, as it reaches a demo.

## Consequences

- The site draws the published kit under the policy a demo would set, so a version whose sheets or
  components break that promise fails the site's own tests when the pin moves to it.
- A policy in a meta element cannot say which pages may frame the site, which only a header can, and
  GitHub Pages sends none, so the site can be framed.
- A script the site adds is refused until the policy names it, and the browser tests fail on
  anything the policy refuses.
- The build, the browser tests and the Lighthouse audit read one list of the site's pages, so a
  page added to it is built, tested and audited alike.
- Lighthouse is a dependency of the repository's own, for development alone, and the package gains
  nothing.

## How it is tested

The paths are in `packages/site`.

- `src/published.test.ts` finds the kit pinned to one exact published version, and no file the site
  is built from reaching into the kit's sources.
- `e2e/site.spec.ts` opens every page in the site's routes, from the preview the Playwright config
  serves, and finds no axe findings in either theme on a phone or a wide screen, no sideways scroll
  at any width or at twice the text size, no text cut off under the spacing a reader may set, one
  main, one footer and one portfolio navigation, at most one banner, and no id twice, and nothing the page's policy refuses, with the theme script
  setting the theme only because its hash lets it run.
- `bench/lighthouse.ts` audits every page in the site's routes, held to the gates ShelfLens is held to: accessibility
  at a hundred, and on a first visit, performance at ninety or more, the largest paint within two and
  a half seconds and a layout shift of no more than a tenth.
