# design-kit

The repository for `@jasonsdevspace/design-kit`, the design tokens, base styles and components
meant to be shared by the demos on [jasonsdevspace.com](https://jasonsdevspace.com). It holds the
checks, hooks and CI the package is developed under. The package is marked private and exports
nothing.

## Dev setup

`npm run verify` runs the type-check, lint, the format, prose and Node checks, and the unit tests,
as CI does on every pull request. It needs the Node 24 that `.nvmrc` names.

```sh
npm ci
npm run verify
```

Installing also sets up the hooks, which lint and format what is staged and check each commit
message.

## Project layout

`scripts/` holds the prose, Node and commit message checks, their tests, and the helper that runs
each check in a throwaway repository.

## License

MIT, in [LICENSE](LICENSE).
