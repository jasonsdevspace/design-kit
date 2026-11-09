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

`npm run verify` runs the type-check, lint, the format, prose and Node checks, and the unit tests.
`npm run e2e` runs the browser tests in Chromium, after `npx playwright install chromium` the first
time. `npm run lighthouse` builds the site and audits every page. A change to a piece's markup also
needs `npm run examples`, which writes the blocks the package README prints from the examples. CI
also builds and packs the package and installs it on the oldest Node it supports, as Dev setup
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

## Security and accessibility

Report a security issue privately, as the [security policy](SECURITY.md) says, not in a public
issue. Report a barrier to using the kit or its site as the [accessibility statement](ACCESSIBILITY.md)
says.
