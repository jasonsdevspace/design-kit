# Security

## Reporting a vulnerability

Please report security issues privately through
[GitHub's private vulnerability reporting](https://github.com/jasonsdevspace/design-kit/security/advisories/new)
rather than in a public issue.

## Supported versions

The package is not published, so fixes land on main.

## What is in scope

This is a package of stylesheets and a theme script, not a deployed service. Reports about the code
are welcome, especially a saved value that reaches the page as anything but one of the two themes,
a script that could end its own element once it is inline, or a hash that would let a policy admit
a script other than the one the plugin writes.

## Dependencies and licenses

The package depends on nothing at run time, and takes Vite as an optional peer for its plugin,
which a page that does not use the plugin never installs. Everything the repository installs is a
tool for checking the code, and none of it ships. Among them, a lint plugin is under the GNU Lesser
General Public License, and a CSS parser the test runner depends on is under the Mozilla Public
License. Both are accepted for tools that run only in development.
