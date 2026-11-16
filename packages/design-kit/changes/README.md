# Changes for the next release

A pull request that changes what the package ships writes its changelog text here, in a file of its
own named for the issue it closes, such as `284.md`, and leaves `CHANGELOG.md` alone. Pull requests
open side by side then never edit the same lines, so merging one leaves the others free of
conflicts.

A file opens with what the change adds to the entry's opening sentence, written as a sentence of its
own, then holds a bullet under each lead-in the changelog's entries use, with **Upgrading.** first
when a page has to change anything:

```markdown
A row can hold a picture at its start, with tiles flowing into columns.

- **Sheets.** `dk-row-picture` as a row's first child sits at its start in a column of its own.
- **Tests.** Browser tests start every title in a list on one line beside its picture.
```

The pull request that bumps the version folds every file here into the version's entry, its opening
into the entry's opening sentence and each bullet into the paragraph under the same lead-in, and
deletes the files. The release workflow stops while any file other than this one is left.
