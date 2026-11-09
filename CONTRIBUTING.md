# Contributing

The design kit is a portfolio project, and it is held to the checks below whoever opens a pull
request. Everyone taking part follows the [code of
conduct](https://github.com/jasonsdevspace/.github/blob/main/CODE_OF_CONDUCT.md).

## Setting up and running the checks

[Dev setup](README.md#dev-setup) in the README says how to install and what each check covers.
Before a pull request, run these checks, which CI runs too:

```bash
npm run verify
npm run e2e
npm run lighthouse
```

`npm run e2e` needs `npx playwright install chromium` the first time. A change to a piece's markup
also needs `npm run examples`, which writes the blocks the package's reference prints from the
examples.
CI also builds and packs the package and installs it on the oldest Node it supports, as Dev setup
describes.

## Writing

Every file is held to one style, which the prose check enforces: no em dashes, no semicolons joining
clauses, American spelling, no issue numbers in comments, and no notes about the process, such as a
list of what is left to do, in anything a reader sees. A commit message says what changed and why in
plain sentences, with no em dash or semicolon, and names the work rather than whatever tool wrote it,
which the commit message check enforces. Installing with `npm ci` sets that check up as a hook on
each commit, and CI runs it on a pull request's title and body.

## Issues

Issues follow the repository's templates, for a piece of work, a parent issue that holds several,
and a bug. Each piece of work says what is wrong or missing, what is already settled, and criteria a
test or a look can check. A bug says what happens, what should happen and how to see it.

## Pull requests

A pull request follows the template. Pull requests are squashed, so the title becomes the commit on
main, and the title and the body both pass the commit message check. The body says what changed and
why, with no counts, no checklist and no notes to the reviewer, and ends with "Closes #N", or "Part
of #N" when the issue has more to do. Every check in CI passes before a pull request is merged, the
browser tests and the Lighthouse audit among them.

## Releasing

[Dev setup](README.md#dev-setup) in the README says how a release reaches npm, under "How a
release reaches npm". Around it, a maintainer:

- bumps the version in `packages/design-kit/package.json`, adds a `## VERSION` entry to its
  `CHANGELOG.md` and points the package README's links to the reference at the new version's tag,
  in a pull request of its own. The entry opens with an **Upgrading.** bullet when a page has to
  change anything, and files the rest under the lead-ins the entries before it use
- tags main with `design-kit-vVERSION` once that merges, which starts the release workflow
- promotes the staged version on the package's npm page
- moves npm's `next` tag to a stable version once it is promoted and no newer prerelease is staged,
  with `npm dist-tag add @jasonsdevspace/design-kit@VERSION next`, so `next` is never older than
  `latest`
- moves the site's pin in `packages/site/package.json` to the promoted version, in a pull request,
  as a demo's pin moves, with no record in it
- reviews the pull request the release workflow opens with the package's and the site's records,
  taken from the tagged commit, when either changed

The workflow stops on a version npm already holds, staged or published, since it cannot tell one
staged by an earlier run from one staged from other code. A run whose later step failed is repeated
with "Re-run failed jobs", which keeps the staging and runs only what failed.

## Security and accessibility

Report a security issue privately, as the [security policy](SECURITY.md) says, not in a public
issue. Report a barrier to using the kit or its site as the [accessibility statement](ACCESSIBILITY.md)
says.
