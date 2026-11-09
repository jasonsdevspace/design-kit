# Contributing

The design kit is a portfolio project, and it is held to the checks below whoever opens a pull
request. Everyone taking part follows the [code of
conduct](https://github.com/jasonsdevspace/.github/blob/main/CODE_OF_CONDUCT.md).

## Setting up and running the checks

[Dev setup](README.md#dev-setup) in the README says how to install and what each check covers.
Before a pull request, run the checks CI runs:

```bash
npm run verify
npm run e2e
npm run lighthouse
```

`npm run verify` runs the type-check, lint, the format, prose and Node checks, and the unit tests.
`npm run e2e` runs the browser tests in Chromium, after `npx playwright install chromium` the first
time. `npm run lighthouse` builds the site and audits every page. A change to a piece's markup also
needs `npm run examples`, which writes the blocks the package README prints from the examples.

## Writing

Every file and message is held to one style, which the prose check and the commit message check
enforce: no em dashes, no semicolons joining clauses, American spelling, and no notes about the
process, such as a list of what is left to do, in anything a reader sees. A commit message says what
changed and why in a plain sentence, and names the work rather than whatever tool wrote it. The
commit message check runs as a hook when `npm ci` installs it, and again in CI.

## Issues

Issues follow the repository's templates, for a piece of work, a parent issue that holds several,
and a bug. Each piece of work says what is wrong or missing, what is already settled, and criteria a
test or a look can check. A bug says what happens, what should happen and how to see it.

## Pull requests

A pull request follows the template. Its title becomes the commit on main, since pull requests are
squashed, so it is checked as a commit message is, and its body says what changed and why and ends
with "Closes #N" or "Part of #N". Every check in CI passes before a pull request is merged, the
browser tests and the Lighthouse audit among them.

## Security and accessibility

Report a security issue privately, as the [security policy](SECURITY.md) says, not in a public
issue. Report a barrier to using the kit or its site as the [accessibility statement](ACCESSIBILITY.md)
says.
