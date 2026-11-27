# @jasonsdevspace/prose-check

[![npm version](https://img.shields.io/npm/v/@jasonsdevspace/prose-check)](https://www.npmjs.com/package/@jasonsdevspace/prose-check)
[![CI](https://github.com/jasonsdevspace/design-kit/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/jasonsdevspace/design-kit/actions/workflows/ci.yml)
[![MIT license](https://img.shields.io/npm/l/@jasonsdevspace/prose-check)](https://github.com/jasonsdevspace/design-kit/blob/main/packages/prose-check/LICENSE)

A check that fails a build on prose that should never reach a reader: an em dash, a semicolon
joining clauses, a marker such as `TODO`, an issue number in a comment, a British spelling, or
writing that fills space rather than saying something. It reads the comments in code, Markdown and
the text a page shows, and leaves code alone, so a semicolon ending a statement passes. The `check-prose` command reads a whole repository, and the
`proseProblems` function reads one piece of text, such as a pull request's body.

[Changelog](https://github.com/jasonsdevspace/design-kit/blob/main/packages/prose-check/CHANGELOG.md) ·
[Source](https://github.com/jasonsdevspace/design-kit/tree/main/packages/prose-check)

## What it checks

- **An em dash**, U+2014, anywhere in a file it reads, code included.
- **A semicolon joining clauses**, one that follows a word, a digit, a closing bracket or a quote,
  as in `It saves; then it closes.` or `Fixed in version 12; see the notes.`
- **A process artifact**, a word that tells a reader something was missing or unsure when it was
  written: `TODO`, `FIXME`, `XXX`, `HACK` and `TBD` as whole words, and `coming soon`,
  `not implemented`, `waiting on`, `to be decided`, `to be determined`, and `for now` followed by
  `leave`, `left` or `skip`, in any case.
- **An issue or pull request number** in a comment or a page, as in `// See issue #12`, `PR 7`,
  `(#12)` or `GH-12`, since the number means nothing once the tracker moves on. Markdown is left
  out, so a pull request's body can say `Closes #12`.
- **A British spelling** from a list of the words code and docs use, such as `behaviour`,
  `colour`, `organise`, `cancelled`, `catalogue`, `centre`, `licence` and `whilst`, and `grey` in
  any of its forms. A name such as `Earl Grey Tea` passes.
- **An en dash used as a dash**, spaced between words, as in `It reads comments – not code.` One
  between numbers in a range, as in `4–6`, passes.
- **A trailing -ing clause**, one tacked on after a comma that restates what the sentence showed,
  as in `It sits in front of the API, ensuring reads stay fast.` Only verbs that rarely lead a real
  result are listed, so `, leaving a stepper short` passes.
- **An inflated word**, such as `leverage`, `utilize`, `seamless`, `pivotal`, `crucial`, `delve`
  or `testament to`. A word with a technical meaning in code or docs, such as `highlight`,
  `harness` or `dynamic`, is left out.
- **An empty opener**, one that only announces, such as `Additionally,`, `Moreover,` or
  `It's worth noting`.
- **A canned closer**, a stock line such as `I hope this helps` or `In summary`, or a sentence
  opening with `Overall,`.
- **A wordy phrase**, `in order to`, where `to` says the same.
- **An intensifier**, `extremely` or `incredibly`.
- **A leftover placeholder**, such as `[Name]`, `[insert link]`, `2026-XX-XX` or `lorem ipsum`. A
  Markdown link and an index into code, such as `env[name]`, pass.
- **An emoji** in prose, such as `🚀`. A symbol that is text, such as `✓`, `→` or `©`, passes.

The whole list of words and patterns is in
[the rules](https://github.com/jasonsdevspace/design-kit/blob/prose-check-v0.2.0/packages/prose-check/src/rules.mjs).
Each rule reads one line at a time, so a phrase wrapped across two lines is not found. Rhythm,
structure and tone, such as a list of three or a run of sentences of one length, are left to people,
since a check that reads one line at a time would get them wrong.

## What it reads

- **Code**, in `.js`, `.mjs`, `.cjs`, `.ts`, `.tsx` and `.jsx` files: each line that starts with `//`,
  `/*` or `*`, up to where the comment closes. A comment after code on the same line is not read.
- **Workflows, scripts and queries**: each line that starts with `#` in `.yml`, `.yaml` and `.sh`
  files and Dockerfiles, and with `--` in `.sql` files.
- **Markdown**, in `.md` files: the text, leaving out fenced blocks, inline code and entities.
- **Pages**, in `.html` files: the text a visitor reads, the comments, the `alt`, `title`,
  `aria-label`, `aria-description` and `placeholder` attributes, and a description or title meta
  tag, leaving out scripts, styles and the text of a code sample.

Any other file, `.css` and `.json` among them, is not read.

## Setup

```sh
npm install --save-dev --save-exact @jasonsdevspace/prose-check
```

It needs Node 24 or later and git. The install pins one exact version, since a minor version can
fail a build that passed, as [Versions and license](#versions-and-license) explains.

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
and every new one git would add, leaving out what the repository ignores. A repository names the
files the check should not read in the `package.json` at its top, never in a copy of the rules:

```json
{
    "proseCheck": {
        "skip": ["vendor/", "docs/imported.md"]
    }
}
```

Each path, from the top of the repository, names a file, or a folder and everything in it, written
with or without a leading `./` or `/` and a trailing slash. A path that matches no file fails the
check, so the list never outlives what it was written for.

## What a failure looks like

```text
Prose check failed with 3 problem(s):

README.md:3  semicolon in prose
    The colour is grey; it works.
README.md:3  British spelling
    The colour is grey; it works.
src/save.js:1  issue reference
    Fixes issue #12 by saving first.
```

Each problem names the file, the line and the rule, with the line beneath it. The command exits 0
when the repository passes, and 1 when it finds a problem, when it is given an argument, or when it
cannot start, such as outside git, with a `package.json` that is not valid JSON or with a skipped
path that matches no file. A failure to start is one line that says why.

## In CI and a pre-commit hook

In a GitHub Actions job, after the checkout step, which leaves the git repository the check reads:

```yaml
- run: npm ci
- run: npm run prose
```

As a pre-commit hook, in `.git/hooks/pre-commit`, made executable with `chmod +x`:

```sh
#!/bin/sh
exec npm run prose
```

The hook reads the files as they are on disk, not as they are staged, so a line fixed on disk but
left unstaged passes the hook and is still committed.

## What it exports

`proseProblems(path, text, label?)` checks one piece of text and returns its problems in the form
the command prints, an empty list when there are none. The path says what kind of text it is, so a
pull request's or an issue's body goes in as Markdown. A path of a kind the check does not read,
such as the text itself, finds nothing. The label, when given, names each problem in place of the
path.

```js
import { proseProblems } from '@jasonsdevspace/prose-check';

const problems = proseProblems('body.md', body);
if (problems.length > 0) throw new Error(problems.join('\n'));
```

The command is built from the rest of the exports: `repositoryProblems(root)` for every problem in
a repository, `repositoryRoot(folder)` for the top of the repository a folder sits in,
`skippedIn(root)` for its skip list, `isScanned(path)` and `isDockerfile(path)` for whether a file
is read, and `problemsIn(text, { issues })` for the rules one line of prose breaks. Each comes with
its types.

## Versions and license

The rules live in this package and nowhere else, so a repository takes a fix by moving its exact
pin to the version that holds it. The package is versioned apart from the design kit, and before
1.0.0 a version says what a build may do once a repository moves to it:

- **A minor version** can fail a build that passed before: a new rule, or a rule that matches more
  than it did.
- **A patch** never fails a build that passed: a rule that matches less than it did, or a fix that
  stops a rule from finding a problem that is not one.

Read the
[changelog](https://github.com/jasonsdevspace/design-kit/blob/main/packages/prose-check/CHANGELOG.md)
before moving to a minor version, since a new rule may name lines written before it. The package is
MIT licensed, and the terms are in
[LICENSE](https://github.com/jasonsdevspace/design-kit/blob/main/packages/prose-check/LICENSE).
