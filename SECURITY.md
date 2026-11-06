# Security

## Reporting a vulnerability

Please report security issues privately through
[GitHub's private vulnerability reporting](https://github.com/jasonsdevspace/design-kit/security/advisories/new)
rather than in a public issue.

## Supported versions

Fixes land in a new release on npm's `latest` tag. Older versions and prereleases are not
patched, so upgrade to pick up a fix.

## Dependencies

The tools used to build and check the kit are not shipped. A moderate advisory in a pattern
matcher that the lint tools depend on waits for those tools to take its fix, and touches nothing
that ships.
