# @jasonsdevspace/design-kit

[![npm version](https://img.shields.io/npm/v/@jasonsdevspace/design-kit)](https://www.npmjs.com/package/@jasonsdevspace/design-kit)
[![CI](https://github.com/jasonsdevspace/design-kit/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/jasonsdevspace/design-kit/actions/workflows/ci.yml)
[![MIT license](https://img.shields.io/npm/l/@jasonsdevspace/design-kit)](https://github.com/jasonsdevspace/design-kit/blob/main/LICENSE)

Colors, type, light and dark themes and the pieces a page is built from, with the behavior that
makes them work by keyboard and screen reader. It is the design system the demos on
[jasonsdevspace.com](https://jasonsdevspace.com) are built from, and any page or small app can use
it. Three stylesheets draw the pieces, and plain script or React hooks make them work.

- **Pages.** A strip above the page, a site header, a footer, a content page with its lead, bands
  with a hero beside its picture and groups of sections, and the "How it works" page beside each
  demo, called the explainer.
- **Controls.** Buttons, a busy button and a quiet button for Close, fields marked required or
  optional, read-only fields, errors the kit draws on a refused submit, a field with a button,
  callouts, pills, tabs, an icon, a theme switch, a copy button and a status line a screen reader
  speaks.
- **Waits and results.** A loading line that shows only once a wait is long enough to notice,
  progress through a known amount, a failure with Try again, and an empty state that offers the
  next step.
- **Lists and layout.** Rows with a picture at their start or a group of buttons at their end, rows
  as tiles, which can flow into columns, a panel that can sit raised above a list, stacks spaced at
  a pair's or a heading's step, a split row, a note and a large numeral.
- **An app's frame.** A tab bar, a dock that can hold a compact action beside the main one, a
  toast, a grid of buttons, a stepper and a dialog.
- **Behavior.** Script, or React hooks, that move focus after a change and on arrival, move through
  a grid or a row of tabs by the arrow keys, check a form against the browser's constraints and
  draw the kit's errors, and take turns on a screen's status line.

The tokens also ship in the Design Tokens Community Group format, for a tool that reads it.

Its strip and footer link to the author's portfolio. The rest works on any page, and a page's own
styles win over the kit's without extra weight.

<img src="https://jasonsdevspace.com/design-kit/light-and-dark.png" alt="The kit's controls in the light theme on the left and the dark theme on the right: four buttons, one of them pressed and one off, an email field showing an error, a sort select, and a success callout and an error callout" width="720">

**[See every piece live, in both themes, with its code](https://jasonsdevspace.com/design-kit/)** ·
[Reference](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.0/packages/design-kit/REFERENCE.md) ·
[Changelog](https://github.com/jasonsdevspace/design-kit/blob/main/packages/design-kit/CHANGELOG.md) ·
[Source](https://github.com/jasonsdevspace/design-kit)

- **No flash of the wrong theme.** A small script in the head sets the theme before the page draws.
- **Measured contrast.** Every color pairing the palette is meant for passes WCAG AA in both themes,
  and a test keeps it that way.
- **Works under a strict security policy.** The components add no inline styles, so they render
  under `style-src 'self'`, and a strict `script-src` allows the theme script by the hash the kit
  gives.
- **Clear of a phone's edges.** On a page that draws to the edge of the screen, the strip, a site
  header, the footer, a content page, an explainer and an app's frame keep their content clear of a
  phone's notch and corners.
- **Keyboard and screen reader behavior built in.** After a change, focus lands where a visitor
  needs it next, and the pieces that speak on a screen's status line take turns on it, so words a
  visitor must hear are not lost.
- **Quiet about short waits.** Through a wait under 400ms a busy button keeps its look and a loading
  line stays out of sight. Only then do they say what is happening, in words rather than a spinner.
- **Tested where layouts break.** Browser tests draw the pieces in both themes, 320 pixels wide, at
  twice the text size, under wider text spacing and in forced colors.

**New in 0.9.0.** React hooks attach the controls, and the controls move focus after a change,
move by the arrow keys, check a form themselves and say a wait on a shared status line. The release
adds a busy button, a loading line, progress, read-only fields, required and optional marks, empty
states, a hero, stacks, split rows, notes, numerals and a dock row. A page that writes a stepper, a
list marked as a stack, or a live callout by hand has a step to take, under Upgrading in the
[changelog](https://github.com/jasonsdevspace/design-kit/blob/main/packages/design-kit/CHANGELOG.md).

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

In a Vite build, `themeScriptPlugin()` puts the theme script inline where the page's head holds its
marker, and `browserFloor()` keeps each `light-dark()` color as written. A page that uses Lightning
CSS as Vite's CSS transformer passes it `lightningcssFloor()` too, as Browser support below shows.

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
React `^19.3.0` are optional peers, needed only for the plugin and for the components and hooks.

## What it exports

| Entry                                             | What it gives                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@jasonsdevspace/design-kit/tokens.css`           | The layer order and every named value, each under the `--dk-` prefix, and the values the kit works out for itself under `--_dk-`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `@jasonsdevspace/design-kit/tokens.resolver.json` | Every named value the format can hold, in the Design Tokens Community Group's format, 2025.10, for a tool that reads that format, with light and dark as the theme's two contexts                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `@jasonsdevspace/design-kit/base.css`             | Type, colors, the selection, the focus ring, `.dk-visually-hidden`, inline code and the reduced-motion rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `@jasonsdevspace/design-kit/components.css`       | The page chrome and a site header, buttons and a row of them, a quiet button, fields and a field with a button, callouts, pills, tabs and a tab row on its container's rule, the eyebrow, an icon, the theme switch, the copy button and a code block's head, a content page and its lead, a band, a stack and a group of sections, the explainer page and its tables, a pinned first column among them, panels and a raised panel, rows, with a picture at a row's start or a group of buttons at its end, as tiles and as tiles in columns, and an app's frame, tab bar, toast, grid of buttons, stepper and dialog, a dock row for a compact action beside the main one, a busy button, a loading line, a field's required or optional mark, read-only fields, the stack's steps, a split row, a note and a large numeral, a hero beside its picture, an empty state and progress                                                                                                                               |
| `@jasonsdevspace/design-kit/theme`                | `themeScript`, `THEME_KEY`, `THEMES`, `THEME_CHOICES` and the types `Theme` and `ThemeChoice`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `@jasonsdevspace/design-kit/controls`             | `attachThemeSwitch()`, `attachCopyButton()`, `attachStepper()`, `attachToast()`, `attachDialog()`, `attachPanel()`, `attachTable()`, `attachStatus()` and `chooseTheme()`, which make the controls work, `moveFocus()`, which moves focus once a change is drawn, `focusOnArrival()`, which focuses a view's heading on an arrival a press brought, `attachRoving()`, which moves among a group's cells by the arrow keys, `attachForm()`, which checks a form against the browser's constraints on submit, draws the errors and refuses it, `attachBusy()`, which says a busy button's wait, `attachProgress()`, which says progress at its steps, and the types `ShowToast`, `ToastAction`, `OpenDialog`, `DialogOpener`, `DialogOptions`, `PanelControl`, `SetPanel`, `StepperOptions`, `Say`, `SayOptions`, `FocusTarget`, `MoveFocusOptions`, `ArrivalOptions`, `RovingOptions`, `RovingOrientation`, `FormOptions`, `Failure`, `FailureWords`, `FieldFailure`, `Refuse`, `BusyOptions` and `ProgressOptions` |
| `@jasonsdevspace/design-kit/react`                | The components, a props type for each, the hooks `useStatus()` with its `StatusProvider`, `useFocusAfterDraw()`, `useArrivalFocus()`, `useRoving()`, `useFormRefusal()`, `useBusy()` and `useProgress()`, the types `FocusAfterDraw`, `ArrivalKey`, `Choice` and `CalloutTone`, and the chrome's URLs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `@jasonsdevspace/design-kit/vite`                 | `themeScriptPlugin()`, `themeScriptHash`, `THEME_PLACEHOLDER`, `browserFloor()` and `lightningcssFloor()`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

The `react` entry holds `SkipLink`, `PortfolioStrip`, `DemoFooter`, `Button`, `InputField`,
`SelectField`, `TextareaField`, `ChoiceField`, `StepperField`, `Callout`, `ThemeSwitch`,
`CopyButton`, `StatusLine`, which `CopyStatus` also names, `Progress`, `Toast` and `StatusProvider`,
a props type for each named after it, such as `ButtonProps`, the hooks and the `FocusAfterDraw` and
`ArrivalKey` types they use, the `Choice` and `CalloutTone` types a page writes a choice or a tone
with, and the URLs the chrome links, `PORTFOLIO_URL`, `PORTFOLIO_WORK_URL` and `GITHUB_PROFILE_URL`.

## Using it

A demo's page draws a skip link, a strip above the page that says whose demo it is, and a footer
below it. With React, the components draw them.

```tsx
import { Button, DemoFooter, PortfolioStrip, SkipLink } from '@jasonsdevspace/design-kit/react';

const source = 'https://github.com/jasonsdevspace/example';

export const Page = () => (
    <>
        <SkipLink />
        <PortfolioStrip
            about="./about/"
            source={source}
            tools={<Button>Tour</Button>}
            toolsLabel="Tour"
        />
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
chrome](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.0/packages/design-kit/REFERENCE.md#page-chrome)
in the reference, which also gives the markup of a site header, drawn under the strip.

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
callouts](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.0/packages/design-kit/REFERENCE.md#buttons-fields-and-callouts)
in the reference gives each component's props and the rules a page follows, such as why an
unavailable button is `aria-disabled` and how a message is made live.

A piece with behavior works through an attach function from `./controls`, or a hook in React. A
screen draws its status line with `StatusProvider`, and the hooks under it speak there. A busy
button ignores a second press at once, and says its wait only once the wait is long enough to
notice.

```tsx
import { Button, StatusProvider, useBusy } from '@jasonsdevspace/design-kit/react';

type Props = { readonly saving: boolean; readonly save: () => void };

const SaveRound = ({ saving, save }: Props) => {
    const busy = useBusy<HTMLButtonElement>();
    return (
        <Button ref={busy} accent busy={saving ? 'Saving the round.' : false} onClick={save}>
            Save the round
        </Button>
    );
};

export const Screen = (props: Props) => (
    <StatusProvider>
        <SaveRound {...props} />
    </StatusProvider>
);
```

[Status, focus, waits and
progress](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.0/packages/design-kit/REFERENCE.md#status-focus-waits-and-progress)
in the reference gives the status line, the focus hooks, a loading line and progress, and
[A refused form](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.0/packages/design-kit/REFERENCE.md#a-refused-form)
gives a form that checks the browser's constraints and draws the kit's errors.

A page without React writes the same markup by hand, and `components.css` styles it. The reference
gives the markup for each piece, [Content
pages](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.0/packages/design-kit/REFERENCE.md#content-pages)
there gives a landing or an about page spaced by one class, and [Explainer
pages](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.0/packages/design-kit/REFERENCE.md#explainer-pages)
there gives the steps, panels, tables and code blocks of a "How it works" page.

An app drawn for a phone takes its frame from [App
frame](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.0/packages/design-kit/REFERENCE.md#app-frame)
in the reference: a bar, a body that scrolls and a dock, clear of the phone's safe areas. The
sections after it give the tab bar, the stepper, the toast, the grid of buttons, the rows and the
dialog, each with its markup and, where it has behavior, the attach function that makes it work. A
page drawn in the frame says `viewport-fit=cover` in its viewport meta, which gives the safe areas
their values. A page that shows a picture of a screen rather than being one, such as a page of an
app's pieces, gives the picture `dk-picture` and makes it `inert`, so the page around it stays a
content page.

## Foundations

- **Color.** Page, card and raised grounds, text and muted text, a line and a control's edge, the
  accent with the text on it, the highlight, success, warning and danger with their grounds, and
  the scrim behind a dialog. Each role holds light and dark in one `light-dark()`, and every pairing
  the palette is meant for passes WCAG AA.
- **Type.** The system's sans and mono, from a 0.85rem caption to a 1.75rem display heading, a
  3.5rem numeral, and weights of 400, 500 and 600.
- **Space.** Eight steps from 0.25rem to 4rem.
- **Radius.** Small, the default, large and a pill.
- **Motion.** 150ms for a change of state and 250ms for a surface arriving, both cut under reduced
  motion, and `--dk-wait`, 400ms, a delay before a wait shows, which reduced motion keeps.

[The tokens page](https://jasonsdevspace.com/design-kit/tokens/) draws them, and the next section
changes their values.

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

A page whose column, app column or spacing differs from the kit's sets `--dk-column`,
`--dk-app-column`, `--dk-space-4`, `--dk-space-5` or `--dk-field-inline` on `:root`, since the band
insets, an app's inset and the paddings that stop growing at a size are worked out there from them.
Past the tokens, a page changes how a piece draws only through the properties the reference lists
under [Properties a page
sets](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.0/packages/design-kit/REFERENCE.md#properties-a-page-sets),
never by a rule over a kit class.

[Layers and
palettes](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.0/packages/design-kit/REFERENCE.md#layers-and-palettes)
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
contract](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.0/packages/design-kit/REFERENCE.md#the-theme-contract)
in the reference gives what the script sets for each saved value, and when it sets the theme again.

A strict `style-src` refuses a `style` attribute, so a page sets a property the kit names, such as
`--dk-tile-ground`, by a class of its own, as the reference's examples do.

## Browser support

The colors are written with `light-dark()`, which sets the floor: Chrome and Edge 123, Firefox 120
and Safari 17.5. What falls short at the floor, such as a label that holds a checkbox showing no
pointer in Firefox 120, is listed under [known
limitations](https://github.com/jasonsdevspace/design-kit/blob/design-kit-v0.9.0/ACCESSIBILITY.md#known-limitations).

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
