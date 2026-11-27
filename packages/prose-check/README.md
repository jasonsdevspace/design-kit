# @jasonsdevspace/prose-check

**Fails a build on prose that should never reach a reader.**

It reads the comments in code, Markdown, the text a page shows and the comments in workflows,
Dockerfiles and SQL, and leaves code alone, so a semicolon ending a statement passes. It refuses:

- an em dash, anywhere in a file
- a semicolon joining clauses in prose
- a process artifact, a marker or a phrase that tells a reader something was missing, pending
  or unsure while it was written
- an issue or pull request number in a comment, which means nothing once the tracker moves on
- a British spelling, gray's among them, to agree with the identifiers beside it

## Adding it to a repository

```sh
npm install --save-dev --save-exact @jasonsdevspace/prose-check
```

Run it in `verify`, beside the other checks:

```json
{
    "scripts": {
        "prose": "check-prose",
        "verify": "npm run prose && npm run test:run"
    }
}
```

It reads the whole repository it is run in, whatever folder it starts from: every file git tracks
and every new one git would add, leaving out what the repository ignores. A repository that keeps
files the check should not read names them in its own `package.json`, never in a copy of the rules:

```json
{
    "proseCheck": {
        "skip": ["vendor/", "docs/imported.md"]
    }
}
```

A path ending in a slash skips the folder and everything in it, and any other names one file.

## Checking a pull request's body

`proseProblems` checks one piece of text. The path says what kind of text it is, so a pull
request's or an issue's body goes in as Markdown:

```js
import { proseProblems } from '@jasonsdevspace/prose-check';

const problems = proseProblems('body.md', body);
```

A path of a kind the check does not read, such as the text itself, finds nothing.

## How a fix reaches every repository

The rules live here and nowhere else. A fix is made in this package, and a repository takes it by
moving its exact pin to the version that holds it. The package is versioned on its own, so a
release of the check never moves the design kit's version, and a release of the kit never moves the
check's. A release workflow for the package is added in a change of its own.

## Versions

Before 1.0.0, a version says what a repository's build may do once it moves to it:

- **A minor version** can fail a build that passed before: a new rule, or a rule that matches more
  than it did.
- **A patch** never fails a build that passed: a rule that matches less than it did, or a fix that
  stops a rule from finding a problem that is not one.

Read the changelog before moving to a minor version, since a new rule may name lines that were
written before it.

## License

[MIT](LICENSE).
