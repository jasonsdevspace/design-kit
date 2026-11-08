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
preview and the audits alike, so every link the tests follow is the one a visitor follows. It
installs the kit from npm at one exact version, as ShelfLens does, under the alias
`design-kit-release`, so npm fetches the published package rather than linking the workspace beside
it, and its sheets, components and theme plugin all come from that version. What a visitor sees is
then what a demo installs, and the site's tests and audit hold what ships. Each page has a meta
element for its policy: nothing by default, scripts only by the theme script's hash, styles and
images only from the site's origin, no base element and no form posts. The footer names the version
of the kit a page is drawn from and the commit it was built at, so it never names a version npm
cannot give. The strip's and the footer's link to how the kit works leads to the site's own
explainer, drawn in the kit's explainer layout as a demo's is. The site's navigation leaves it out,
as a demo's pages leave out theirs. The explainer links the README and the decision records at the
commit the site was built at. CI builds and uploads the site from a job with read access alone once
every check has passed on main, and a job that runs only GitHub's Pages actions deploys it.

## Consequences

- A change to the kit reaches the site only once it is released and a pull request moves the pin,
  as it reaches a demo, so the site never shows a piece a demo cannot yet install.
- The site's browser tests also run over each commit's own kit, packed and installed under the
  alias without saving it, so a change that breaks the site's audits or its policy fails its own
  pull request rather than the one that later moves the pin, after the version is on npm.
- A policy in a meta element cannot say which pages may frame the site, which only a header can, and
  GitHub Pages sends none, so the site can be framed.
- A script the site adds is refused until the policy names it, and the browser tests fail on
  anything the policy refuses.
- The build, the browser tests and the Lighthouse audit read one list of the site's pages, so a
  page added to it is built, tested and audited alike.
- Lighthouse is a dependency of the repository's own, for development alone, and the package gains
  nothing.
- The build's CSS target is the kit's own browser floor. With Vite's wider default, the minifier
  rewrites each `light-dark()` into variables the root sets, so a copy of a piece drawn in the other
  scheme, as the controls, page chrome and explainer pieces pages draw each state and the tokens
  page each swatch, would keep the page's colors.

## How it is tested

The paths are in `packages/site`.

- `e2e/site.spec.ts` opens every page in the site's routes, from the preview the Playwright config
  serves, and finds no axe findings in either theme on a phone or a wide screen, no sideways scroll
  at any width or at twice the text size, no text cut off under the spacing a reader may set, one
  main, one footer and one portfolio navigation outside the inert copies, at most one banner, no id
  twice, and nothing the page's policy refuses, with the theme script setting the theme only
  because its hash lets it run. It also finds the keyboard never stopping inside a copy drawn in the
  other theme, each such copy inert and drawn in a ground and text that differ from the page's, and
  each state's copy in the visitor's theme carrying the attribute printed under it. On the controls
  page it finds a live copy of every state. On the tokens page it finds each swatch drawn in the
  value printed beside it, in both themes, and every pairing at or above what it needs, listed
  tightest first. On the page chrome page it finds the page's own skip link, strip and footer live
  and every copy of a state inert, and on the explainer pieces page each piece live in the visitor's
  theme and the explainer's layout drawn only as a picture. It finds the explainer marked as the
  current page in its strip and footer, with a header that leads back to the site, every other
  page's strip and footer leading to it, an id on each of its section headings, and every link
  within the site leading to one of its pages and to the id it names, where it names one, outside
  the inert copies.
- `src/published.test.ts` finds the kit pinned to one exact version of the npm package, installed
  from the registry, and no file the site is built, tested or audited from reaching the kit by any
  other name or path.
- `bench/lighthouse.ts` audits every page in the site's routes, held to the gates ShelfLens is held
  to: accessibility at a hundred, and on a first visit, performance at ninety or more, the largest
  paint within two and a half seconds and a layout shift of no more than a tenth.
