# @jasonsdevspace/design-kit

[![npm version](https://img.shields.io/npm/v/@jasonsdevspace/design-kit)](https://www.npmjs.com/package/@jasonsdevspace/design-kit)
[![CI](https://github.com/jasonsdevspace/design-kit/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/jasonsdevspace/design-kit/actions/workflows/ci.yml)
[![MIT license](https://img.shields.io/npm/l/@jasonsdevspace/design-kit)](https://github.com/jasonsdevspace/design-kit/blob/main/LICENSE)

A design system for a web page or a small app, with React or without it. It gives you colors, type,
light and dark themes, and ready-made pieces such as buttons, fields, dialogs and page layouts, and
every piece is built to work by keyboard and screen reader. Three stylesheets draw the pieces, and
plain JavaScript functions or React hooks make them work. The demos on
[jasonsdevspace.com](https://jasonsdevspace.com) are built from it.

<img src="https://jasonsdevspace.com/design-kit/light-and-dark.png" alt="The kit's controls in the light theme on the left and the dark theme on the right: four buttons, one of them pressed and one off, an email field showing an error, a sort select, and a success callout and an error callout" width="720">

**[See the pieces live, in both themes, with their code](https://jasonsdevspace.com/design-kit/)** ·
[Reference](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.3/packages/design-kit/REFERENCE.md) ·
[Changelog](https://github.com/jasonsdevspace/design-kit/blob/main/packages/design-kit/CHANGELOG.md) ·
[Source](https://github.com/jasonsdevspace/design-kit)

**Contents:** [What is in it](#what-is-in-it) · [Setup](#setup) ·
[A first example](#a-first-example) · [What it exports](#what-it-exports) ·
[Foundations](#foundations) · [Theme and policy](#the-theme-and-a-strict-policy) ·
[Going further](#going-further) · [Browser support](#browser-support) ·
[Versions](#versions-and-license)

- **Keyboard and screen reader behavior built in.** After a change, focus moves to where a visitor
  needs it next, and announcements take turns on one status line, so one does not cut off another.
- **Measured contrast.** Every color pairing the palette is meant for passes WCAG AA in both themes,
  and a test keeps it that way.
- **Works under a strict security policy.** The components add no inline styles, and a strict
  `script-src` allows the theme script by a hash the kit exports.
- **No flash of the wrong theme.** A small script in the head sets the theme before the page draws.
- **Tested where layouts break.** Browser tests draw the pieces in both themes, 320 pixels wide, at
  twice the text size, under wider text spacing and in forced colors.

More on [what it is built for](https://jasonsdevspace.com/design-kit/#built-for).

## What is in it

- **Controls.** Buttons, fields, tabs, pills, callouts, a theme switch and a copy button, on
  [the controls page](https://jasonsdevspace.com/design-kit/controls/).
- **An app's frame.** A tab bar, a dock, a toast, a grid of buttons, a stepper and a dialog, on
  [the app pieces page](https://jasonsdevspace.com/design-kit/app-pieces/).
- **Pages.** A site header, a footer and a "How it works" page, on [the page chrome
  page](https://jasonsdevspace.com/design-kit/page-chrome/) and [the explainer pieces page](https://jasonsdevspace.com/design-kit/explainer-pieces/),
  and a content page, bands and a hero, on [the layouts page](https://jasonsdevspace.com/design-kit/layouts/).
- **Lists and layout.** Rows, tiles and panels, under [Rows](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.3/packages/design-kit/REFERENCE.md#rows) and
  [Panels](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.3/packages/design-kit/REFERENCE.md#panels) in the reference, and for a content page a hero, stacks, split rows and
  numerals, under [Content pages](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.3/packages/design-kit/REFERENCE.md#content-pages).
- **Waits and behavior.** A busy button, a loading line, a failure with Try again, focus moved
  after a change, the arrow keys through a grid and a form that says what is wrong when a submit is
  refused, working, with what each says on the status line, on
  [the behavior page](https://jasonsdevspace.com/design-kit/behavior/). Progress is on
  [the controls page](https://jasonsdevspace.com/design-kit/controls/#loading-and-progress).

The portfolio strip and the demo footer link to the author's portfolio and are meant for its demos.
Everything else works on any page, and your own styles win over the kit's without extra
specificity.

## Setup

```sh
npm install @jasonsdevspace/design-kit
```

Load the sheets in this order, tokens first, through a bundler that resolves package exports, such
as Vite.

```css
@import '@jasonsdevspace/design-kit/tokens.css';
@import '@jasonsdevspace/design-kit/base.css';
@import '@jasonsdevspace/design-kit/components.css';
```

With Vite, `themeScriptPlugin()` writes the theme script into the head where the marker comment
sits, and `browserFloor()` sets a build target that keeps the kit's colors as written.

```ts
import { browserFloor, themeScriptPlugin } from '@jasonsdevspace/design-kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [themeScriptPlugin()],
    build: { target: browserFloor() },
});
```

```html
<head>
    <!-- theme-script -->
</head>
```

The build fails if the marker is missing or appears twice, since without the script the page would
show the system's theme rather than the visitor's choice. Without Vite, write the script into the
head yourself, before the body.

```ts
import { themeScript } from '@jasonsdevspace/design-kit/theme';

const head = `<script>${themeScript}</script>`;
```

<details>
<summary>With Lightning CSS as the transformer</summary>

A page whose `css.transformer` is `'lightningcss'` passes the floor to Lightning CSS too, since Vite
gives that transformer lower targets of its own, and the transformer rewrites each `light-dark()`
before the build target applies.

```ts
import {
    browserFloor,
    lightningcssFloor,
    themeScriptPlugin,
} from '@jasonsdevspace/design-kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [themeScriptPlugin()],
    css: { transformer: 'lightningcss', lightningcss: { targets: lightningcssFloor() } },
    build: { target: browserFloor() },
});
```

</details>

Every entry loads on Node 22.12 or later. Vite 8 or later and React `^19.3.0` are optional peers,
needed only for the `vite` entry and the `react` entry.

## A first example

Buttons and fields take their state from the attribute a screen reader already reads, such as
`aria-pressed` or `aria-invalid`, rather than a class. With React, the components write it.

```tsx
import { useState } from 'react';

import { Button, Callout, InputField, SelectField } from '@jasonsdevspace/design-kit/react';

type Props = { readonly error?: string; readonly saved?: string };

export const Checkout = ({ error, saved }: Props) => {
    const [gift, setGift] = useState(false);
    return (
        <form>
            <InputField
                label="Email"
                name="email"
                hint="Where the receipt goes"
                error={error}
                type="email"
            />
            <SelectField label="Delivery" name="delivery">
                <option value="standard">Standard</option>
                <option value="express">Express</option>
            </SelectField>
            <Button pressed={gift} onClick={() => setGift(!gift)}>
                Gift wrap
            </Button>
            <Button type="submit" accent>
                Place order
            </Button>
            <Callout tone="success" live="status">
                {saved}
            </Callout>
        </form>
    );
};
```

Without React, write the same markup by hand and `components.css` styles it. A piece with behavior,
such as the copy button or the dialog, works through an attach function from the `controls` entry,
or through a hook in React. Wrap a screen in `StatusProvider` and the hooks share one status line, as
[the behavior page](https://jasonsdevspace.com/design-kit/behavior/) shows.
Every control, in each state, with its markup and its React, is on
[the controls page](https://jasonsdevspace.com/design-kit/controls/).

## What it exports

| Entry                  | What it gives a page                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| `tokens.css`           | Every named value as a `--dk-` custom property, and the layer order                              |
| `base.css`             | Type, colors, the focus ring and the reduced-motion rule                                         |
| `components.css`       | The classes every piece is drawn with                                                            |
| `tokens.resolver.json` | The tokens in the Design Tokens Community Group format, for a tool that reads it                 |
| `theme`                | The theme script and the names of the themes                                                     |
| `controls`             | Plain JavaScript functions that make the pieces work and move focus                              |
| `react`                | The components, a props type for each, and the hooks                                             |
| `vite`                 | The plugin that writes the theme script into the head, the script's hash, and the browser floors |

Import each entry by the package name and the entry's own, such as
`@jasonsdevspace/design-kit/controls`. [What the package
exports](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.3/packages/design-kit/REFERENCE.md#what-the-package-exports) in the reference names every function, hook, component and
type each entry holds.

## Foundations

- **Color.** Backgrounds, text, an accent, a highlight, and success, warning and danger, each with
  its light and dark value in one `light-dark()`. Every pairing the palette is meant for passes WCAG
  AA.
- **Type.** The system's sans and mono, from a 0.85rem caption to a 1.75rem display heading, a
  3.5rem numeral, and weights of 400, 500 and 600.
- **Space.** Eight steps from 0.25rem to 4rem.
- **Radius.** Small, the default, large and a pill.
- **Motion.** 150ms for a change of state and 250ms for a surface arriving, both cut under reduced
  motion, and a 400ms delay, `--dk-wait`, before a wait shows.

[The tokens page](https://jasonsdevspace.com/design-kit/tokens/) shows every value in both themes.

## The theme and a strict policy

The theme script sets `data-theme` on the root from the theme saved in `localStorage` under `theme`,
or follows the system where nothing is saved. Storage belongs to an origin, so only a page on the
portfolio's origin reads the visitor's choice, and any other site follows the system. If your
Content Security Policy allows inline script only by its hash, add `themeScriptHash` to
`script-src`. The hash matches only while nothing after the plugin rewrites the script, as an HTML
minifier would.

```ts
import { themeScriptHash } from '@jasonsdevspace/design-kit/vite';

const policy = `script-src 'self' ${themeScriptHash}`;
```

A strict `style-src` also refuses a `style` attribute, so set a property the kit names, such as
`--dk-tile-ground`, from a class of your own. The portfolio strip and the demo footer put their
`about`, `source` and `license` values into links unchecked. Pass a URL you wrote yourself, never
one taken from the page's address or a visitor's input, since that could send a visitor anywhere.

## Going further

- [A page's own palette](https://jasonsdevspace.com/design-kit/own-palette/), to give the kit your
  own palette, column or layers, with every property a page sets.
- [The theme contract](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.3/packages/design-kit/REFERENCE.md#the-theme-contract), for what the theme script sets for each saved value.
- [React components](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.3/packages/design-kit/REFERENCE.md#react-components), for each component's props.
- [A refused form](https://jasonsdevspace.com/design-kit/behavior/#a-refused-form), for the form
  check and what it says.
- [App frame](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.3/packages/design-kit/REFERENCE.md#app-frame), [Page chrome](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.3/packages/design-kit/REFERENCE.md#page-chrome) and [Explainer
  pages](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.3/packages/design-kit/REFERENCE.md#explainer-pages), for each piece's markup and rules.

## Browser support

The colors are written with `light-dark()`, which sets the floor: Chrome and Edge 123, Firefox 120
and Safari 17.5. What falls short at the floor, such as the missing pointer over a checkbox's label
in Firefox 120, is listed under [known
limitations](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.3/ACCESSIBILITY.md#known-limitations).
With `browserFloor()` as the build target, each `light-dark()` color stays as written, and the
target rises when the kit raises its floor. A lower target rewrites each one into custom properties
set once on the root, so a part of the page set to the other scheme keeps the page's colors.

## Versions and license

The kit follows semantic versioning. Until 1.0.0, a minor version can rename a token or change what
the theme script reads, and a patch changes neither. The
[changelog](https://github.com/jasonsdevspace/design-kit/blob/main/packages/design-kit/CHANGELOG.md)
lists each version's changes, and its Upgrading notes say what a page must change. Prereleases go
out under npm's `next` tag, so install `@jasonsdevspace/design-kit@next` to try one. The tests and
the decisions behind the kit are in [the repository](https://github.com/jasonsdevspace/design-kit).
The kit is MIT licensed, and the terms are in
[LICENSE](https://github.com/jasonsdevspace/design-kit/blob/main/LICENSE).
