# @jasonsdevspace/design-kit

[![npm version](https://img.shields.io/npm/v/@jasonsdevspace/design-kit)](https://www.npmjs.com/package/@jasonsdevspace/design-kit)
[![CI](https://github.com/jasonsdevspace/design-kit/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/jasonsdevspace/design-kit/actions/workflows/ci.yml)
[![MIT license](https://img.shields.io/npm/l/@jasonsdevspace/design-kit)](https://github.com/jasonsdevspace/design-kit/blob/main/LICENSE)

Colors, type, light and dark themes and basic controls, shared by the demos on
[jasonsdevspace.com](https://jasonsdevspace.com). Three stylesheets give a page colors and type in a
light and a dark theme, a strip above the page and a footer below it, buttons, form fields and
callouts for messages, and the layout of the "How it works" page beside each demo, called the
explainer.

It is made for those demos, so its strip and footer link to the author's portfolio. The colors, base
styles and controls work on any page, and a page's own styles win over the kit's without extra
weight.

<img src="https://jasonsdevspace.com/design-kit/light-and-dark.png" alt="The kit's controls in the light theme on the left and the dark theme on the right: four buttons, one of them pressed and one off, an email field showing an error, a sort select, and a success callout and an error callout" width="720">

**[See every piece live, in both themes, with its code](https://jasonsdevspace.com/design-kit/)** ·
[Reference](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.3.1/packages/design-kit/REFERENCE.md) ·
[Changelog](https://github.com/jasonsdevspace/design-kit/blob/main/packages/design-kit/CHANGELOG.md)
· [Source](https://github.com/jasonsdevspace/design-kit)

- **No flash of the wrong theme.** A small script in the head sets the theme before the page draws.
- **Measured contrast.** Every color pairing the palette is meant for passes WCAG AA in both themes,
  and a test keeps it that way.
- **Works under a strict security policy.** The components add no inline styles, so they render
  under `style-src 'self'`, and a strict `script-src` allows the theme script by the hash the kit
  gives.

## Setup

```sh
npm install @jasonsdevspace/design-kit
```

A page loads the sheets, tokens first, through a bundler that resolves package exports, such as
Vite.

```css
@import '@jasonsdevspace/design-kit/tokens.css';
@import '@jasonsdevspace/design-kit/base.css';
@import '@jasonsdevspace/design-kit/components.css';
```

In a Vite build, the plugin puts the theme script inline where the page's head holds its marker, and
`browserFloor()` keeps each `light-dark()` color as written. A page that uses Lightning CSS as
Vite's CSS transformer passes it `lightningcssFloor()` too, as [Browser support](#browser-support)
shows.

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

A page with no marker, or with two, fails the build, since without the script it would draw the
system's theme rather than the visitor's. A page built without Vite writes the script into its head
itself, before the body.

```ts
import { themeScript } from '@jasonsdevspace/design-kit/theme';

const head = `<script>${themeScript}</script>`;
```

The theme module, the plugin and the components load on Node 22.12 or later. Vite 8 or later and
React `^19.3.0` are optional peers, needed only for the plugin and the components.

## What it exports

| Entry                                       | What it gives                                                                                                     |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `@jasonsdevspace/design-kit/tokens.css`     | The layer order and every named value, each under the `--dk-` prefix                                              |
| `@jasonsdevspace/design-kit/base.css`       | Type, colors, the selection, the focus ring, `.dk-visually-hidden`, inline code and the reduced-motion rule       |
| `@jasonsdevspace/design-kit/components.css` | The page chrome, buttons, fields, callouts and the explainer page                                                 |
| `@jasonsdevspace/design-kit/theme`          | `themeScript`, `THEME_KEY`, `THEMES`, `THEME_CHOICES` and the types `Theme` and `ThemeChoice`                     |
| `@jasonsdevspace/design-kit/controls`       | `attachThemeSwitch()`, `attachCopyButton()` and `chooseTheme()`, which make the controls work                     |
| `@jasonsdevspace/design-kit/react`          | The components, the theme switch's and copy button's markup, the props types, `CalloutTone` and the chrome's URLs |
| `@jasonsdevspace/design-kit/vite`           | `themeScriptPlugin()`, `themeScriptHash`, `browserFloor()` and `lightningcssFloor()`                              |

The `react` entry holds `SkipLink`, `PortfolioStrip`, `DemoFooter`, `Button`, `InputField`,
`SelectField`, `ChoiceField`, `Callout`, `ThemeSwitch`, `CopyButton` and `CopyStatus`, the types
`ButtonProps`, `InputFieldProps`, `SelectFieldProps`, `ChoiceFieldProps`, `Choice`, `CalloutProps`
and `CalloutTone`, and the URLs the chrome links, `PORTFOLIO_URL`, `PORTFOLIO_WORK_URL` and
`GITHUB_PROFILE_URL`.

## Using it

A demo's page draws a skip link, a strip above the page that says whose demo it is, and a footer
below it. With React, the components draw them.

```tsx
import { Button, DemoFooter, PortfolioStrip, SkipLink } from '@jasonsdevspace/design-kit/react';

const source = 'https://github.com/jasonsdevspace/example';

export const Page = () => (
    <>
        <SkipLink />
        <PortfolioStrip about="./about/" source={source} tools={<Button>Tour</Button>} />
        <main id="main-content" tabIndex={-1}>
            <h1>Example</h1>
        </main>
        <DemoFooter name="Example" about="./about/" source={source} />
    </>
);
```

The strip and the footer put `about`, `source` and `license` into their links unchecked, so each
must be a URL the demo's author writes, never one taken from the page's address or a visitor's
input, which could send a visitor anywhere. The skip link, strip and footer are live in each state
on [the page chrome page](https://jasonsdevspace.com/design-kit/page-chrome/), and their markup,
rules and props are under [Page
chrome](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.3.1/packages/design-kit/REFERENCE.md#page-chrome)
in the reference.

Buttons and fields take their state from the attribute a screen reader already reads, such as
`aria-pressed` or `aria-invalid`, never a class of the kit's.

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

Every button, field and callout is live in each state on [the controls
page](https://jasonsdevspace.com/design-kit/controls/). [Buttons, fields and
callouts](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.3.1/packages/design-kit/REFERENCE.md#buttons-fields-and-callouts)
in the reference gives each component's props and the rules a page follows, such as why an
unavailable button is `aria-disabled` and how a message is made live.

A page without React writes the same markup by hand, and `components.css` styles it. The reference
gives the markup for each piece, and [Explainer
pages](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.3.1/packages/design-kit/REFERENCE.md#explainer-pages)
there gives the steps, panels, tables and code blocks of a "How it works" page.

## Your own layers and palette

Every rule of the kit's sits in a cascade layer named `dk`. A page with layers of its own names `dk`
first, before any rule of its own, so its layers stay over the kit's.

```css
@layer dk, page;
```

Each color role holds its light and its dark value in one `light-dark()`, and a page with its own
palette sets the roles again, with both values at once.

```css
:root {
    --dk-accent: light-dark(#2f5bd3, #7b9cff);
}
```

[Layers and
palettes](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.3.1/packages/design-kit/REFERENCE.md#layers-and-palettes)
in the reference gives the other order, the reduced-motion rule that holds over a page's own, and
how far the contrast promise reaches.

## The theme and a strict policy

The portfolio saves a visitor's theme in `localStorage` under `theme`, and the script sets
`data-theme` on the root from it. Storage belongs to an origin, so only a page on the portfolio's
origin reads the visitor's choice, and anywhere else follows the system. A page whose Content
Security Policy allows inline script only by its hash names the script with `themeScriptHash`.

```ts
import { themeScriptHash } from '@jasonsdevspace/design-kit/vite';

const policy = `script-src 'self' ${themeScriptHash}`;
```

The hash holds as long as nothing after the plugin rewrites the inline script, as an HTML minifier
would. [The theme
contract](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.3.1/packages/design-kit/REFERENCE.md#the-theme-contract)
in the reference gives what the script sets for each saved value, and when it sets the theme again.

## Browser support

The colors are written with `light-dark()`, which sets the floor: Chrome and Edge 123, Firefox 120
and Safari 17.5. What falls short at the floor, such as an empty live callout in Firefox 120, is
listed under [known
limitations](https://github.com/jasonsdevspace/design-kit/blob/main/ACCESSIBILITY.md#known-limitations).

A Vite build that takes `browserFloor()` as its target, as Setup shows, keeps each `light-dark()` as
written. A lower target rewrites each one into custom properties set once on the root, so a part of
the page set to the other scheme keeps the page's colors. Taken from the kit, the target rises when
the kit raises its floor.

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

## Versions and license

The kit follows semantic versioning. Until 1.0.0, a minor version can rename a token or change what
the theme script reads, and a patch changes neither. Prereleases are under npm's `next` tag, as
`@jasonsdevspace/design-kit@next`. The tests and the decisions behind the kit are in
[the repository](https://github.com/jasonsdevspace/design-kit). The kit is MIT licensed, as
[LICENSE](https://github.com/jasonsdevspace/design-kit/blob/main/LICENSE) states.
