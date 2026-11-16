# Changes for the next release

A pull request that changes the kit, its reference or its tests writes its changelog text here, in a
file of its own named for the issue it closes or is part of, such as `284.md`, and leaves
`CHANGELOG.md` alone. Two pull requests open at once write different files, so merging one leaves
the other free of conflicts. A later pull request for the same issue adds to its file.

A file opens with a sentence for the entry's opening paragraph, then holds a bullet for each part of
the change, each opened by the lead-in the changelog's entries use, in their order: **Upgrading.**
when a page has to change anything, then **Tokens.**, **Sheets.**, **Controls.**, **React.**,
**Docs.** and **Tests.**, each only where the change has something to say:

```markdown
A row can hold a picture at its start, with tiles flowing into columns.

- **Sheets.** `dk-row-picture` as a row's first child sits at its start in a column of its own.
- **Tests.** Browser tests start every title in a list on one line beside its picture.
```

The pull request that bumps the version folds every file here into the version's entry, its opening
into the entry's opening paragraph and each bullet into the bullet with the same lead-in, and
deletes the files. The release workflow stops while anything but this file is left, a link included,
or while the changelog keeps its `## Unreleased` heading.
