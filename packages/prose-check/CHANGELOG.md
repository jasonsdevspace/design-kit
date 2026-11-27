# Changelog

## 0.1.0

The prose check as a package of its own, which every repository installs in place of its own copy.

- **Rules.** Em dashes anywhere, semicolons joining clauses, process artifacts held to word boundaries, issue and pull request numbers in comments, and British spellings, the British spelling of gray among them, in comments, Markdown, page text and workflows.
- **Command.** `check-prose` reads every file of the repository it is run in that git tracks or would add, leaving out what the repository ignores and the files and folders its `proseCheck.skip` names, written with or without a leading `./` or `/` and a trailing slash. It takes no arguments, refuses a skipped path that matches no file, and ends with one line where it cannot start, such as outside git or with a `package.json` it cannot read.
- **Function.** `proseProblems` checks one piece of text, given a path that says what kind it is, such as `body.md` for a pull request's body. Its types are written from the code's own JSDoc.
