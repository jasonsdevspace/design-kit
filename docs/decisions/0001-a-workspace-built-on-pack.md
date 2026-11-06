# 1. The kit is a workspace, built on pack and installed from npm

**Status:** accepted

## Context

The kit is meant to be a dependency of every demo on jasonsdevspace.com. Its sheets are plain CSS,
but its theme module and its Vite plugin are TypeScript, and a demo imports them compiled, from
`dist`, which the repository does not commit. Something has to build `dist` before a demo can load
`./theme` or `./vite`. The repository also holds the tools that check the kit, its lint, format,
prose and Node checks, its unit and browser tests and its commit hooks, and none of those belong in
what a demo is meant to install.

## Options

**A. A workspace, built on pack.** The root is a private workspace that holds the tools. The package
sits in `packages/design-kit` with a manifest of its own, which names only `dist` in its files, a
`prepack` that builds it, and Vite as an optional peer. A demo installs from npm what `npm pack`
produces, already built.

**B. A single root package.** The package's manifest is the repository's, so it carries the
repository's scripts, its development tools, its staged-file rules and the `prepare` that sets up
the commit hooks. Rejected, since the manifest a demo installs would be mostly about how the kit is
checked rather than what it exports.

**C. Installed from git.** A demo names the repository in its dependencies, and a `prepare` script
builds `dist` when npm installs it. Rejected on what it measured:

- npm installs a git dependency's development tools to run its `prepare`, so a git install ran
  every tool the repository checks itself with, taking about 13 s from a clean cache.
- npm's `allowScripts` warns about the kit's `prepare` script in each demo, which would then have
  to allow it.
- With install scripts off, `dist` is missing, and `./theme` and `./vite` fail at import.

## Decision

Option A. The kit is the workspace `packages/design-kit`, built by its `prepack`, and it reaches a
demo from npm as it was packed, with no script of the kit's to run.

## Consequences

- A clone has no `dist` until `npm run build` or a pack. The unit and browser tests read the
  sources, so only the packed install exercises `dist`.
- npm packs a package's license from the package's own folder, so `packages/design-kit` keeps a
  copy of the repository's `LICENSE`, held to the root's by a test.
- The package keeps a README of its own, written for a reader who never sees the repository, and
  its homepage points at that folder rather than at the root.
- A demo can install the kit with install scripts off and lose nothing, since the kit has no
  install script.

## How it is tested

- The oldest Node job in CI packs the package, which builds it, checks the manifest with publint,
  installs the tarball into an empty project with `--ignore-scripts` on the lowest Node the package
  admits, finds each sheet where its export resolves, and imports `./theme`, `./vite` and `./react`
  by the names a demo uses, with Vite not installed and React installed, as a page that draws the
  components has it. `smoke/package.test.ts` holds the list of what it loads to the package's
  exports.
- `scripts/license.test.ts` holds each package's `LICENSE` to the one at the root.
