/**
 * Uses the kit the way a page that installed it from npm does, on the lowest Node its engines
 * field admits.
 *
 * CI packs the kit, installs the tarball into an empty project outside the repository with the
 * React a page that draws the components has, and copies the smoke files in beside it. The first
 * run is on that Node, with no Vite installed, which the plugin takes only as an optional peer. The
 * second is on the Node the project builds on, after the type-check step has installed Vite. Only
 * plain Node is used, with no test runner, so it runs on any Node the package could declare. Each
 * assertion's message says what it holds.
 *
 * Run by the "Package on oldest Node" job, `floor` in .github/workflows/ci.yml.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SHEETS, VALUE_EXPORTS } from './exports.mjs';

// The job's setup step can quietly install a newer Node than the one asked for, and then
// everything below proves nothing about the Node it names.
const floor = process.env.FLOOR;
assert.ok(floor, 'FLOOR names the Node this run is meant to be on');
assert.equal(process.version, `v${floor}`, 'runs on the Node the job set up');

// Each import resolves from the installed tarball, not from a link back to the repository.
const theme = import.meta.resolve('@jasonsdevspace/design-kit/theme');
assert.match(
    theme,
    /\/node_modules\/@jasonsdevspace\/design-kit\/dist\/theme\.js$/,
    'imports the installed package'
);

// What the tarball holds: the build, its types and the sheets, and none of the sources, the
// examples, the tests or this smoke test.
const installed = join(dirname(fileURLToPath(theme)), '..');
const shipped = readdirSync(installed, { recursive: true }).map(String);
for (const wanted of [
    'dist/theme.d.ts',
    'dist/vite.d.ts',
    'README.md',
    'CHANGELOG.md',
    'LICENSE',
]) {
    assert.ok(shipped.includes(wanted), `ships ${wanted}`);
}
for (const unwanted of [/^src/, /^examples/, /^smoke/, /^e2e/, /\.test\./, /\.tsbuildinfo$/]) {
    const found = shipped.filter((path) => unwanted.test(path));
    assert.deepEqual(found, [], `ships nothing matching ${unwanted}`);
}

// Every sheet resolves to a file, and the tokens declare the kit's layers before any rule.
for (const sheet of SHEETS) {
    const path = fileURLToPath(import.meta.resolve(sheet));
    assert.ok(existsSync(path), `${sheet} resolves to a file`);
}
const tokens = readFileSync(fileURLToPath(import.meta.resolve(SHEETS[0])), 'utf8');
const firstStatement = tokens
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim()
    .split(';')[0];
assert.equal(
    firstStatement,
    '@layer dk.tokens, dk.base, dk.components',
    'the tokens declare the kit layers before any rule'
);

// Every module loads, and exports exactly what the smoke test lists.
for (const [name, values] of Object.entries(VALUE_EXPORTS)) {
    const module = await import(name);
    assert.deepEqual(
        Object.keys(module).sort(),
        [...values].sort(),
        `${name} exports what it lists`
    );
}

// The theme script and the plugin work as a page uses them.
const { THEME_KEY, themeScript } = await import('@jasonsdevspace/design-kit/theme');
assert.equal(THEME_KEY, 'theme', 'reads the key the portfolio saves under');
assert.ok(themeScript.includes('data-theme'), 'the script sets the theme on the root');
const { THEME_PLACEHOLDER, themeScriptHash, themeScriptPlugin } =
    await import('@jasonsdevspace/design-kit/vite');
const hook = themeScriptPlugin().transformIndexHtml;
const page = hook.handler(`<head>${THEME_PLACEHOLDER}</head>`, {});
assert.equal(page, `<head><script>${themeScript}</script></head>`, 'the plugin writes the script');
assert.match(themeScriptHash, /^'sha256-[A-Za-z0-9+/]+=*'$/, 'the hash is a policy source');

// The components draw their markup from the installed package, with the React a page has.
const { createElement } = await import('react');
const { renderToStaticMarkup } = await import('react-dom/server');
const { PortfolioStrip } = await import('@jasonsdevspace/design-kit/react');
const strip = renderToStaticMarkup(
    createElement(PortfolioStrip, { about: './about/', source: 'https://github.com/example' })
);
assert.match(
    strip,
    /^<div class="dk-strip"><nav class="dk-strip-links" aria-label="Portfolio">/,
    'the strip draws its markup'
);

// A field makes its own ids with React's useId, which has to work in a server render too.
const { InputField } = await import('@jasonsdevspace/design-kit/react');
const field = renderToStaticMarkup(
    createElement(InputField, { label: 'Email', hint: 'For the receipt' })
);
const [, made] = /<input class="dk-input" id="([^"]+)"/.exec(field) ?? [];
assert.ok(made, 'the field draws its input with an id');
assert.ok(
    field.includes(`aria-describedby="${made}-hint"`),
    'the field ties its hint to the input'
);

console.log(`design-kit works on Node ${process.version}`);
