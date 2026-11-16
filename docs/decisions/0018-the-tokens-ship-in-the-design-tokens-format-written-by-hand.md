# 18. The tokens ship in the design tokens format, written by hand and held by a test

**Status:** accepted

## Context

The kit's tokens lived in `tokens.css` alone, so a design tool or a build that reads the Design
Tokens Community Group's format could not read them. The format reached its first stable edition,
2025.10, with a Resolver module for a value that differs by context, such as a color in a light and
a dark theme. A file in that format is a second public copy of the tokens: a tool reads its token
names, its set and its contexts, so it is a contract as `tokens.css` is, and it has to stay in step
with the sheet.

## Options

**A. Generate the file from `tokens.css` at build time.** Rejected, since the sheet holds what the
format cannot write, such as a length in `em`, a `min()` held to the text size and a value worked
out from the page, so a generator needs a rule for each of those and its output is read by no one
until it ships. A generator also sits between the source and the package, where a mistake in it
reaches every release.

**B. Generate `tokens.css` from the file.** Rejected, since the sheet is what every page loads, its
comments say why each value is what it is, and the values the format cannot write would have to
live somewhere else again.

**C. Write the file by hand, ship it as written, and hold it to the sheet by a test.** The source,
the shipped file and the file the test reads are the same bytes, and a value changed in one and not
the other fails a named test.

## Decision

Option C. `src/tokens.resolver.json` is one resolver document of the 2025.10 edition, named as the
Resolver module asks: a base set with every token the two themes share, and a theme modifier with
each color and shadow in a light and a dark context, light by default. The build copies it into
`dist` as written and the package exports it as `./tokens.resolver.json`. A token the format cannot
write stays in `tokens.css` alone, and the test names each with its reason.

The file's token names, the set's name, the modifier's name and its contexts are public, so renaming
any of them is a breaking change, as renaming a custom property in the sheet is. A move to a later
edition of the format is a breaking change too, made in the same file under the same name, with an
Upgrading note, rather than a second file for each edition.

## Consequences

- A tool that reads the format reads the kit's tokens from the package, and a page that does not
  import the file pays nothing for it.
- A token added to `tokens.css` fails the test until it is written in the file or named as one the
  format cannot hold, so the two cannot drift apart quietly.
- The file is read and diffed by people as well as tools, so it ships formatted rather than
  minified, at a cost of a few hundred bytes in the packed package.

## How it is tested

The path is in `packages/design-kit`.

- `src/tokens.resolver.test.ts` checks the document's edition, its order and its contexts, draws
  each token back as the CSS it stands for and holds it to what `tokens.css` declares on the root in
  both themes, fails on a token in one file and not the other, and names why each token left out
  cannot be written.
- `smoke/consumer.mjs` imports the file as a JSON module from the packed package on the lowest Node
  the package supports, and `smoke/package.test.ts` holds it among the package's exports.
