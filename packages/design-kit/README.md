# @jasonsdevspace/design-kit

Design tokens, base styles, a theme script, page chrome, buttons, fields and callouts, and an
explainer layout, for the demos on [jasonsdevspace.com](https://jasonsdevspace.com). The styles are
plain CSS in cascade layers, so a page's own rules outside a layer win without extra weight. The
theme script sets the theme a visitor chose on the portfolio before the page paints. The chrome and
the controls come as markup a sheet styles and as React components that draw it. The explainer is
markup a page writes by hand.

```sh
npm install @jasonsdevspace/design-kit
```

The package loads on Node 22.12 or later, the lowest Node 22 that Vite 8 runs on. It takes Vite 8
or later as an optional peer for its plugin, and React `^19.3.0` as an optional peer for its
components. Prereleases are under npm's `next` tag, as `@jasonsdevspace/design-kit@next`. What
changed in each version is in
[CHANGELOG.md](https://github.com/jasonsdevspace/design-kit/blob/main/packages/design-kit/CHANGELOG.md).

A page with cascade layers of its own must name where the kit's layers go, as [Layers and
palettes](#layers-and-palettes) describes. The cut to motion for a visitor who asks for less holds
over a page's ordinary styles, as that section explains.

A page loads the sheets, tokens first, through a bundler that resolves package exports, such as
Vite.

```css
@import '@jasonsdevspace/design-kit/tokens.css';
@import '@jasonsdevspace/design-kit/base.css';
@import '@jasonsdevspace/design-kit/components.css';
```

A page built with Vite takes the theme script from the plugin, and marks where it goes in its head.

```ts
import { themeScriptPlugin } from '@jasonsdevspace/design-kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({ plugins: [themeScriptPlugin()] });
```

```html
<head>
    <!-- theme-script -->
</head>
```

## What it exports

- `@jasonsdevspace/design-kit/tokens.css` declares the kit's layer order and the named values, each
  with the `--dk-` prefix. The color roles, each holding a value for both themes, are `--dk-bg`,
  `--dk-surface`, `--dk-raised`, `--dk-fg`, `--dk-muted`, `--dk-line`, `--dk-control`,
  `--dk-accent`, `--dk-on-accent`, `--dk-highlight`, `--dk-success`, `--dk-success-bg`,
  `--dk-danger`, `--dk-danger-bg` and the scrim, `--dk-scrim`. Beside them are steps of space, text
  size and corners, a code size in em that follows the text around it, line heights, weights, a sans
  and a mono font stack, the focus ring's width and offset, a field's height and inline padding, the
  size of a touch target, the height of the portfolio's strip and the width of a demo's switches in
  it, `auto` until a demo names one, the measure and column widths, a shadow and a short duration.
- `@jasonsdevspace/design-kit/base.css` gives the page its type and colors, one focus ring in the
  accent for every link and control the keyboard reaches, code in running text a step under the text
  around it, the `.dk-visually-hidden` class for a label a screen reader reads and the eye does not,
  a pointer on a disclosure's summary and on a box or a dot with the label that holds it, and less
  motion for a visitor who asks for it. It loads after the tokens, since the tokens' first statement
  declares the kit's layer order.
- `@jasonsdevspace/design-kit/components.css` styles the page chrome, the skip link, the strip and
  the footer, the buttons, fields and callouts, and the explainer page with its steps, panels,
  tables and code blocks, by the classes in the markup the sections below give. It loads after
  the tokens too.
- `@jasonsdevspace/design-kit/theme` exports `THEME_KEY`, the storage key the portfolio saves a
  visitor's theme under, `THEMES`, the two themes the script sets, their type `Theme`, and
  `themeScript`, the script itself as a string to put inline.
- `@jasonsdevspace/design-kit/react` exports `SkipLink`, `PortfolioStrip` and `DemoFooter`, which
  draw the chrome's markup, and `Button`, `InputField`, `SelectField` and `Callout`, which draw the
  markup of the buttons, fields and callouts, with the types `ButtonProps`, `InputFieldProps`,
  `SelectFieldProps`, `CalloutProps` and `CalloutTone`. It also exports `PORTFOLIO_URL`,
  `PORTFOLIO_WORK_URL` and `GITHUB_PROFILE_URL`: the portfolio and the GitHub profile, which the
  chrome links to, and the portfolio's list of work, for a page that links to it. It has no
  component for the explainer or the pieces in it, which a page writes by hand. It takes React
  `^19.3.0` as an optional peer, which a page that writes the markup itself never needs.
- `@jasonsdevspace/design-kit/vite` exports `themeScriptPlugin()`, the Vite plugin that puts the
  script inline in place of `THEME_PLACEHOLDER`, the comment `<!-- theme-script -->`,
  `themeScriptHash`, the script's hash as a Content Security Policy source, and `browserFloor()` and
  `lightningcssFloor()`, the kit's browser floor as a build target and as Lightning CSS targets. The
  entry runs in Node, and takes Vite 8 or later as an optional peer, which a page that does not use
  it never needs.

A page with no placeholder fails the build, since without the script it would draw the system's
theme rather than the visitor's, and so does a page with two. A page built without Vite writes the
script into its head itself, before the body.

```ts
import { themeScript } from '@jasonsdevspace/design-kit/theme';

const head = `<script>${themeScript}</script>`;
```

## Page chrome

The page chrome a demo draws around its page is a skip link, a strip above the page that says whose
demo it is, and a footer below it. `components.css` styles the markup below, which a page without
React writes by hand and the components in `./react` draw. The components ship no stylesheet and
set no `style` attribute, so a page loads `components.css` itself, and a page whose policy allows
styles only from its own origin, `style-src 'self'`, still draws them.

The skip link is the keyboard's first stop, out of sight until it takes focus, and then at the
column's inset, where the strip's links start. Following it moves focus to the page's main content,
which has a tabindex of -1 so it can take focus.

<!-- example: skipLink -->

```html
<a class="dk-skip" href="#main-content">Skip to content</a>
<main id="main-content" tabindex="-1">...</main>
```

A skip link can also sit inside a box of the page's own, such as one at the top of a column of
filters that leads past them to the results. It waits in its own place as the visually hidden class
does, one pixel clipped to nothing, so it draws nothing and takes no click wherever the box starts
on the page. A box that is positioned holds it, and it shows at the top of that box, inset as it is
at the top of a page, when a keyboard reaches it.

The strip holds a navigation landmark named Portfolio, with links in this order: the author's name,
which leads to the portfolio as the footer's does, how it works and the source. The name reads
"Jason Poteet", which fits a demo and the kit's own site alike. The strip on the demo's explainer
marks the explainer's link with `aria-current="page"`. A demo with switches of its own puts them in
a section after the links, named for them, and a demo with none leaves the section out.

<!-- example: strip -->

```html
<div class="dk-strip">
    <nav class="dk-strip-links" aria-label="Portfolio">
        <a href="https://jasonsdevspace.com/">Jason Poteet</a>
        <a href="./about/">How it works</a>
        <a href="https://github.com/jasonsdevspace/example">Source on GitHub</a>
    </nav>
    <section class="dk-strip-tools" aria-label="Demo">
        <button type="button" class="dk-button">Tour</button>
    </section>
</div>
```

A demo whose switches are still on their way, drawn by a script that has not run yet, keeps their
room so nothing below the strip moves when they come. The section is drawn with no name and holds
only the room, with no text, so it is no landmark and a screen reader finds nothing in it. When the
switches come they take the room's place in the same section, and the section takes its name.

<!-- example: stripWaiting -->

```html
<section class="dk-strip-tools"><span class="dk-strip-room"></span></section>
```

The room holds the height of one row of the kit's buttons or fields, beside the links on a wide
screen and on a row of their own on a phone. Switches of another height, or more than fit on one
row, still move what is below them when they come. On a wide screen the room has no width of its
own, so a demo whose switches would make the strip wrap where the room did not names their width in
`--dk-strip-tools`, in the strip's own text size, such as `:root { --dk-strip-tools: 20em; }`. The
room and the switches then take that width, and the strip wraps before they come as it does after.
On a phone the switches have a row of their own and the width is left aside.

On a wide screen the strip is one 2.5rem row over a 1px rule, in the small text, with its links
1.5rem apart and the switches on the right. At 48rem wide or less the text steps down to the
caption size, the links close to 1rem apart and wrap where they must, and the switches take a row
of their own below them.

The footer is one paragraph that says whose project the demo is, with the author's name linking the
portfolio, and links how it works, the source, the rest of the work and the license. The footer on
the demo's explainer marks the link to how it works with `aria-current="page"`, as the strip does.
Anything the demo adds follows the license, as sentences of its own. The sentence holds to the
measure, as prose does, while the footer's rule runs the page's width. Every link in the chrome
keeps its underline, and in the footer's sentence the underline is what tells a link from the text
around it. The link marked as the current page, in the strip or the footer, stands in the page's
text at the heading's weight, so it is told from the links around it by more than its color, in
forced colors too, and still reads as a link.

<!-- example: footer -->

```html
<footer class="dk-footer">
    <p>
        Example is a portfolio project by <a href="https://jasonsdevspace.com/">Jason Poteet</a>.
        <a href="./about/">How it works</a>, in plain words. The
        <a href="https://github.com/jasonsdevspace/example">source</a> and
        <a href="https://github.com/jasonsdevspace">more work</a> are on GitHub, under the
        <a href="https://github.com/jasonsdevspace/example/blob/main/LICENSE">MIT license</a>.
    </p>
</footer>
```

The strip and the footer run their rules the width of the page and line their content up with the
page's column, `--dk-column`, 72rem wide by default and centered, inset by 1rem. A page whose column
is another width sets `--dk-column` to it, as it sets a color role.

A page with React draws the same markup from the components.

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

- `SkipLink` leads to `main-content` unless `target` names another id, and its children replace
  the words "Skip to content".
- `PortfolioStrip` takes `about`, the demo's explainer, and `source`, its repository. `current` set
  to `about` marks the explainer's link as the current page. `tools` holds the demo's own switches,
  and `toolsLabel` names their landmark, `Demo` unless given. With `tools` undefined, null, false,
  an empty string, or a list or a fragment of only those, the strip draws no section for them, so a
  demo can pass `hasTour && <Tour />`. `toolsWaiting` keeps the room of one row of the kit's
  controls while `tools` draws nothing, for a page drawn before the switches can be, in the same
  section unnamed until they come.
- `DemoFooter` takes `name`, the demo's name as the sentence opens with it, `about` and `source`.
  `current` set to `about` marks the explainer's link as the current page, as on the strip.
  `license` is the link to the license, `LICENSE` on the main branch of `source` unless given, with
  any trailing slash on `source` dropped first. `licenseName` is the license's name in the sentence,
  `MIT license` unless given. Its children follow the license, and children that are undefined,
  null, false, an empty string, or a list or a fragment of only those, add nothing.

The strip's and the footer's `about`, `source` and `license` go into their links unchecked, so each
is a URL the demo's author writes, never one taken from the page's address or a visitor's input,
since one taken from either could send a visitor anywhere.

## Buttons, fields and callouts

`components.css` styles a button, a text field, a select and a callout by the markup below, which a
page without React writes by hand and the components in `./react` draw. A control's state is the
native or ARIA attribute a screen reader already reads, such as `aria-pressed` or `aria-invalid`,
never a class of the kit's, so what a visitor sees and what a screen reader says come from one
attribute. Every rule for these pieces sits in one `:where()`, the resting look included, so each
weighs nothing and a state wins over the resting look by coming after it in the sheet. A resting
look written as a bare class would outweigh every state. A page's own rule outside a layer still
wins over all of them.

### Buttons

<!-- example: buttons -->

```html
<button type="button" class="dk-button">Filters</button>
<button type="button" class="dk-button dk-button-accent">Save rule</button>
<button type="button" class="dk-button" aria-pressed="true">Members only</button>
<button aria-describedby="previous-why" type="button" class="dk-button" aria-disabled="true">
    Previous
</button>
<p id="previous-why" class="dk-field-hint">This is the first page.</p>
```

A button is `type="button"` unless the page gives it another type, so it never submits a form by
surprise. `dk-button-accent` fills the one action a view leads with in the accent. It is a
class, since it is a kind of button rather than a state, and an accent button is never a toggle. A
toggle that stands alone carries `aria-pressed`, `"true"` or `"false"`, and keeps the same label in
both states, since the attribute already says which it is. An action carries no `aria-pressed` at
all. A button with `aria-expanded="true"`, whose panel is open, is drawn as a pressed one.

An unavailable button, `off` in React, carries `aria-disabled="true"` rather than `disabled`. A
disabled button that has focus drops it, and leaves the tab order, while an aria-disabled one stays
where the keyboard can reach it and find out why. The attribute does nothing by itself, so a page
that writes this markup makes its own click handler check `aria-disabled` and return early, calling
`preventDefault()` so a submit button does not submit. The sheet draws a `disabled` button, and one
inside a disabled fieldset, the same as an off one, and an accent button that is off keeps its class
and is drawn as any off button is. A page says why a button is off in text beside it, such as a
`.dk-field-hint` paragraph the button's `aria-describedby` names, a class that works beside any
control. A form's submit button is better left on while the form is incomplete, so a press shows the
errors rather than doing nothing.

A button is 2.25rem tall, `--dk-field-height`, as tall as a field, and 2.75rem, `--dk-target`, at
48rem wide or less, and it is never narrower than it is tall. It has no ground of its own, so it
takes the ground of whatever it sits on, a callout included. A link with the class looks the same.
Where a pointer can hover, the edge turns to the accent under it, and the accent button underlines
its words instead. Pressed is the highlight with an edge twice as thick in the accent, and its words
in the page's text, an accent button's included. Off is the muted text on no ground with an edge in
the line color, rather than a fade, so its words keep a ratio the palette measures, and an off
toggle that is on keeps the thicker edge, in the line color. In forced colors a pressed button
takes the system's `Highlight`, an off one `GrayText` on the page's ground, accent or not, and an
off toggle that is on an edge in `Highlight`.

### Fields

<!-- example: fields -->

```html
<div class="dk-field">
    <label class="dk-field-label" for="email">Email</label>
    <p class="dk-field-hint" id="email-hint">Where the receipt goes</p>
    <p class="dk-field-error" id="email-error">
        <span class="dk-visually-hidden">Error: </span>
        Enter an email address
    </p>
    <input
        class="dk-input"
        type="email"
        id="email"
        aria-describedby="email-hint email-error"
        aria-invalid="true"
    />
</div>
<div class="dk-field">
    <label class="dk-field-label" for="sort">Sort by</label>
    <select class="dk-select" id="sort">
        <option value="">Choose an order</option>
        <option value="price">Price</option>
    </select>
</div>
```

A field is its label, a hint when it has one, an error when it has one, and then the control,
`.dk-input` or `.dk-select`. The error sits above the control, so a phone's keyboard or an open list
never covers it, and the hint stays while the error shows, since it often says how to put the error
right. The error starts with a visually hidden "Error: ", so it is told from the hint by more than
its color. `aria-describedby` lists only what is drawn, the hint and then the error, followed by any
description of the page's own, and is left off when there is none. `aria-invalid="true"` is there
only while an error is drawn.

The error is not live, since a form that fails in several fields at once would speak over itself.
The page says when errors appear, and on a submit that fails it moves focus to the first invalid
control or to an error summary. The kit does no validation, so the page decides when to show an
error, best after a submit is tried rather than while someone is typing.

A control is as tall as a button, at both widths, and its text is never under 16px, so a phone does
not zoom the page when the field is tapped. It sits on the page's own ground, so it reads as a well
on a card. The hint and the error are in the caption size, the error in the danger color, and an
invalid control's edge in the danger color too. In forced colors, where that color is gone, an
invalid control gains a dashed line around its edge in `CanvasText`, which moves nothing as the
error comes and goes, and gives way to the focus ring when it has focus. A disabled control is drawn
on the surface ground in the muted text. The select is a native `<select>`, its caret drawn as a
background, and in forced colors the browser's own arrow comes back. A select that shows its options
as a list, with `multiple` or a `size`, is left as the browser draws it, with no caret. A field a
visitor cannot change uses `disabled`, unlike a button, which stays in the tab order when it is off.
The field's hint says why it cannot be changed, and a screen reader reads that hint wherever it
announces the field. A button's reason sits beside it in text its `aria-describedby` names, read
when the keyboard reaches the button.

### Callouts

<!-- example: callout -->

```html
<div class="dk-callout dk-callout-danger">
    <div class="dk-callout-body">
        <p class="dk-callout-title">
            <span class="dk-visually-hidden">Error: </span>
            The products could not be loaded
        </p>
        <p>Check the file, then load it again.</p>
    </div>
    <div class="dk-callout-actions"><button type="button" class="dk-button">Try again</button></div>
</div>
```

A callout is `dk-callout` alone for news, on the highlight, or adds `dk-callout-success` or
`dk-callout-danger` for something that went right or wrong, on that color's own ground. The words
stay in the page's text color in every tone. A success or danger callout starts its title, or its
message when it has no title, with a visually hidden "Success: " or "Error: ", so the tone is not
told by color alone. The title is a paragraph, or a heading from `h2` to `h6` where the callout is a
section a visitor would jump to, and opens `.dk-callout-body`, the message. The actions, when there
are some, follow the message, outside it.

A callout has no role unless the page gives it one, whatever its tone. A message on the page when it
loads gets none, since a live region created with its text already in it is read unreliably across
screen readers and interrupts the reading of the page's title. A message that arrives after the page
has loaded takes `role="status"`, read when the screen reader is next idle, or `role="alert"`, read
at once, on `.dk-callout-body`, so the title and the tone's word are read with the message and the
actions are not. The page puts a live callout on the page empty first and fills it after, which is
when a screen reader reads it. A page filling a success or danger callout puts the hidden word in
with the message, as `<span class="dk-visually-hidden">Success: </span>Saved.`, since the word is
part of what is read. A live callout whose message holds nothing at all, not even a space, a line
break or the tone's word, and that has no actions draws nothing, no ground, padding or edge, until
it is filled, so a page puts it where its words will go with no holder of its own to hide it. It
still takes its place in the flow, so a margin or a gap around it stays. The rule reads the message
with `:has()`, which Firefox has from 121, so in Firefox 120 an empty live callout still draws its
ground.

A callout's edge is transparent, and shows only in forced colors, where the ground is dropped and
the edge marks where the callout starts and ends.

### From React

```tsx
import { useState } from 'react';

import { Button, Callout, InputField, SelectField } from '@jasonsdevspace/design-kit/react';

type Props = { readonly error?: string; readonly saved?: string };

export const Checkout = ({ error, saved }: Props) => {
    const [gift, setGift] = useState(false);
    return (
        <form>
            <InputField label="Email" hint="Where the receipt goes" error={error} type="email" />
            <SelectField label="Delivery">
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

Every optional prop of every component takes `undefined` as if it were left out, so a wrapper that
passes on a prop it may not have been given compiles under `exactOptionalPropertyTypes` too.

- `Button` takes the props of a `<button>` but `style`, `disabled`, `aria-disabled` and
  `aria-pressed`, and is `type="button"` unless `type` says otherwise. `accent` adds
  `dk-button-accent`. `pressed` writes `aria-pressed`, `false` included, and left undefined makes
  the button an action. The types refuse `accent` and `pressed` together. `off` writes
  `aria-disabled="true"` and puts a click handler that calls `preventDefault()` in place of
  `onClick`, so the page's click handler does not run and a submit button does not submit. Any
  other handler the page passes, for keys or a pointer, still runs, and checks `off` itself. A
  `className` follows the kit's classes. A `ref` holds the `<button>` drawn, for a page that moves
  focus to it, such as the button that opened a panel when the panel closes.
- `InputField` takes `label`, and `hint` and `error`, each drawn only when given, an empty string,
  null, false, or a list or a fragment of only those drawing nothing. `id` is the control's, made
  with React's `useId` unless given, and a page gives one when something links to the field, such as
  an error summary. Every other prop goes to the `<input>` but `style` and `aria-invalid`. A
  `className` follows `dk-input`, and an `aria-describedby` of the page's own is listed after the
  hint and the error. A `ref` holds the `<input>` drawn, for a page that moves focus to the field,
  such as a form that fails.
- `SelectField` takes the same props, with its children as the options of the `<select>` and its
  `ref` holding the `<select>`.
- `Callout` takes `tone`, `info` unless given, `success` or `danger`, and `title`, drawn at the
  start of the message as a paragraph or, with `headingLevel` from 2 to 6, as that heading, and as a
  paragraph for any other level. `actions` are drawn after the message. `prefix` is the word read
  before the title or the message, the tone's own unless given, and an empty string drops it.
  `live`, `status` or `alert`, puts that role on the message and draws the message even when it is
  empty, and a live callout whose message draws nothing, with no title or actions, draws nothing
  until it is filled. Every other prop goes to the callout's `<div>` but `style`, `role` and the
  `title` attribute, inner HTML and the live attributes, since its message takes its role from
  `live` alone, so a page gives it an `id`, such as one an error summary is linked by, and a
  `className`, which follows the kit's. A `ref` holds the `<div>` drawn, for a page that moves focus
  to it, as to a summary of what went wrong in a form that fails.

## Explainer pages

An explainer is the page that says how a demo works, the one the strip's "How it works" link
leads to. `components.css` styles its layout and the steps, panels, tables and code blocks it
holds, by the markup below, which every page writes by hand. `./react` draws none of it, since
none of these pieces has logic to hide. Every rule for them sits in one `:where()`, the layout
included, so where the layout and a piece set inside it both set something, the later rule in
the sheet wins, and a page's own rule outside a layer wins over both. A layout written as a bare
class would outweigh every piece set inside it.

### The page

<!-- example: explainerPage -->

```html
<a class="dk-skip" href="#main-content">Skip to content</a>
<div class="dk-strip">
    <nav class="dk-strip-links" aria-label="Portfolio">
        ... <a href="./" aria-current="page">How it works</a> ...
    </nav>
</div>
<header class="dk-explainer-header"><a href="../">Example</a></header>
<main id="main-content" tabindex="-1" class="dk-explainer">
    <h1>How Example works</h1>
    <p class="dk-explainer-lead">What the demo does, in a sentence or two.</p>
    <p><a class="dk-button dk-button-accent" href="../">Open the demo</a></p>
    <section>
        <p class="dk-explainer-number" aria-hidden="true">01</p>
        <h2 id="order">What happens when an order comes in</h2>
        <p>...</p>
        <h3>What usually goes wrong</h3>
        <p>...</p>
    </section>
</main>
<footer class="dk-footer">
    <p>... <a href="./" aria-current="page">How it works</a>, in plain words. ...</p>
</footer>
```

The header holds a link back to the demo, outside `main`, so the skip link passes it and reading
starts at the h1. `main` holds the h1, the lead, the one action as an accent button, and then
the sections. Each section holds its number, hidden from a screen reader since its heading says
what the section is, then an h2 with an id, then its text, with an h3 for each part of it.

A section is a plain `<section>`, with no `aria-labelledby` or `aria-label`. A named section becomes
a region landmark, and the page's landmarks stay the strip's navigation, the demo's switches when it
has some, the header, the main content, the footer and the frames that scroll. A reader moves
between sections by their headings. The h2 ids are a contract other pages link to, so a page keeps
an id when it rewords its heading. An in-page link needs no tabindex on the heading, since a jump to
a fragment moves where the keyboard goes next. Each h2 has a scroll margin, so a jump stops short of
it and leaves the section's number and rule in sight above it. The kit draws no table of contents,
since an explainer is short enough to move through by its headings.

The header and the explainer start their text at the column's inset, where the strip's links start,
and every part of the explainer holds to `--dk-measure`, 34rem, no more than 80 characters a line in
the body size. Each part is spaced from the one before it, so a list, a table, a panel and a code
block space alike. The h1 is the display size and the lead a step over the body. A section opens on
a rule in the line color, with 2rem of space above and below it, then its number in the muted
caption size, its heading in the title size, and its text, with an h3 at the body size.

### Steps

<!-- example: steps -->

```html
<ol class="dk-steps" role="list">
    <li>
        <strong class="dk-steps-title">The order names a product.</strong>
        <span class="dk-steps-note">It says how many it wants.</span>
    </li>
    <li>
        <span class="dk-steps-arrow" aria-hidden="true">↓</span>
        <strong class="dk-steps-title">It waits its turn.</strong>
        <span class="dk-steps-note">Behind any order for the same product.</span>
    </li>
</ol>
```

Steps a demo takes one after another, each in a box of its own with an edge in the line color and
large corners, in the small text. A step's title is at medium weight, with its note in the muted
text on a line below. Every step after the first opens with an arrow, a span holding ↓ that the
sheet sets in the gap above the step, hidden from a screen reader. It is a span because a
component's selectors allow nothing after a `:where()` but a focus pseudo-class, and a
pseudo-element cannot sit inside one. The list keeps `role="list"`, since WebKit with VoiceOver
drops a list's meaning when its markers are gone.

### Panels

<!-- example: panel -->

```html
<div class="dk-panel">
    <p class="dk-panel-title">How the numbers were taken</p>
    <p>
        Each strategy ran three times on the same laptop with the same orders, and the table shows
        the middle run.
    </p>
</div>
```

A panel sets a part of a page apart on the card ground, `--dk-surface`, with an edge in the line
color and large corners. The edge is what draws it, since the card ground is close to the page's,
and it stays in forced colors. A panel is padded 1.5rem, and 1rem at 48rem wide or less, and what it
holds is spaced 0.75rem from the one before it, a step closer than an explainer's parts. Its title
is a paragraph, or a heading one level under its section's where a reader would jump to it, and
inside an explainer it steps down to the body size.

A panel differs from a callout in having no tone, no hidden word and no live role, and in being
at the body size rather than the small text. It has no role at all. It is not an `aside`, since
inside `main` an aside becomes a complementary landmark, and a box in the reading flow is not
complementary to it. Nor is it a named `section`, which would be a region landmark, or a
`figure`.

### Tables

<!-- example: table -->

```html
<p class="dk-table-title" id="bench-title">Orders a second under each strategy</p>
<div class="dk-table-scroll" role="region" aria-labelledby="bench-title" tabindex="0">
    <table class="dk-table" aria-labelledby="bench-title">
        <thead>
            <tr>
                <th scope="col">Scenario</th>
                <th scope="col" class="dk-table-number">Orders a second</th>
                <th scope="col" class="dk-table-number">Slowest 1%, ms</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <th scope="row">Hot product, row lock</th>
                <td class="dk-table-number">700</td>
                <td class="dk-table-number">48.5</td>
            </tr>
        </tbody>
    </table>
</div>
```

The title is a paragraph above the frame, never a `<caption>`, since a caption takes the table's
width and scrolls off a phone with it. The one title names both the frame and the table. Its id is
unique on the page, and both `aria-labelledby` attributes point to it. The frame is a region with a
tabindex of 0 at every width, so a keyboard can reach it and scroll it with the arrow keys. A page
written by hand cannot tell when its table overflows, which changes with zoom and text size, so the
frame is a region whether or not it scrolls, which costs one tab stop on a wide screen where it does
not. A frame holds to the measure as the prose does, so a table wider than 34rem scrolls on a wide
screen too.

A column's header is `th scope="col"`, the cell that names a row is `th scope="row"`, and every
cell of a numeric column, its header included, is `.dk-table-number`. A table is never stacked
into cards on a phone, since `display: block` on a table's parts drops its table semantics in
WebKit. It scrolls in its frame instead.

A table is in the small text, with each row ruled in the line color. Its column headers are the
muted text at medium weight, and a row's header is at medium weight too. The outer cells keep no
padding on their outer side, so the table's text lines up with the prose around it. Figures sit to
the right and never wrap, while text in a cell wraps and keeps its first line level with the rest of
its row. Code in a cell stays on one line, hyphens and spaces alike, so a token's name never breaks
after `--dk-`, and a long expression scrolls the frame as a wide table does. A header gives its unit
in words a screen reader says well, "Slowest 1%, ms" rather than "p99 ms".

### Code blocks

<!-- example: code -->

```html
<p class="dk-code-title" id="lock-title">The statement that holds the stock</p>
<pre
    class="dk-code"
    role="region"
    aria-labelledby="lock-title"
    tabindex="0"
    translate="no"
><code>UPDATE stock SET held = held + 1
WHERE product_id = $1 AND held &lt; on_hand;</code></pre>
```

A block of code keeps its lines as written and scrolls inside itself, since wrapping would break its
indentation and show line breaks the code does not have. It is a named region with a tabindex of 0,
for the same reasons as a table's frame. Its title says what the code is for, such as "Run it
yourself", rather than naming its language. `translate="no"` keeps a browser's translation of the
page off the identifiers. A block never takes `lang` for its programming language, since `lang`
names a human language. The code starts right after `<code>`, since a line break there shows as a
blank first line, and a `<` or `&` in it is written `&lt;` or `&amp;`.

A block sits on the card ground, or on the page's own ground inside a panel, so it reads as set
into what holds it. Its edge is transparent, and shows only in forced colors. The kit ships no
script, so a block has no copy button.

### Code in running text

`base.css` sets code in running text on every page, not only an explainer, at `--dk-text-code`,
0.9em, so it follows the size of the text around it, a step under it since a mono face looks larger
at the same size. It breaks anywhere it must, with `overflow-wrap: anywhere`, since a long name has
no spaces to break at and would push a narrow column wider, except in a table cell, as Tables
describes. Inside a `pre` it takes the block's size and keeps its lines whole. It has no ground of
its own, and in a link it keeps the link's underline.

## Layers and palettes

The tokens declare `dk.tokens`, `dk.base` and `dk.components`, in that order, and each sheet fills
its own. A page's own rule outside a layer wins over every rule of the kit's but the cut to motion,
however little it weighs and wherever its sheet loads. Inside the layers, every selector is either
one of the kit's own classes, such as `.dk-strip` or `.dk-visually-hidden`, or one `:where()`,
followed at most by a focus pseudo-class. The base alone follows a `:where()` with a pseudo-element,
so the border box reaches a page's `::before` and `::after`, and the cut to motion reaches those, a
dialog's `::backdrop` and each part of a view transition, since a pseudo-element inside a `:where()`
matches nothing. That adds the weight of one element, which counts for nothing against a page's own
rule outside a layer.

A page with layers of its own names where `dk` goes among them. A layer takes its place where its
name first appears, so a page whose layers load before the kit's sheets, without naming `dk`, puts
the kit's rules over its own. `@layer dk, page;` puts the page's layer over the kit's when it is
written before any rule of the page's layer. `@layer page, dk;` puts the kit's over the page's only
when written before the kit's sheets.

The cut to motion is held with `!important`, since it is the visitor's choice. It wins over every
normal rule a page writes, and over an important one in a sheet, outside a layer or in a layer
after the kit's. An important declaration in a `style` attribute still wins over it, as does an
important rule in a layer the page orders before the kit's.

Each color role holds its light and its dark value in one `light-dark()`. A page with its own
palette sets the roles again, with both values at once. Set on `:root`, they win whichever sheet
loads first, as long as the rule sits outside a layer or in one after the kit's. Set on one
container, they always win, and restyle only what is inside it. A role set to one color draws that
color in both themes.

```css
:root {
    --dk-accent: light-dark(#2f5bd3, #7b9cff);
}
```

The default palette is measured in both themes, against the pairings it is meant for. Text, muted
text, the accent, and the success and danger colors pass 4.5 to 1 on the page, a card and anything
raised, and a control's edge passes 3 to 1 on each of those. Text on the accent passes 4.5 to 1.
Text, muted text and the accent pass 4.5 to 1 on the highlight and on the success and danger grounds
as well, and a control's edge passes 3 to 1 on them, so a button or a field keeps its edge inside a
callout of any tone. The success and danger colors pass 4.5 to 1 on their own grounds. The focus
ring is drawn in the accent, so it is held as a link is. A pairing outside that list, such as a line
against its ground, carries no ratio, and a page that sets its own palette answers for its own
pairings.

## The theme contract

The portfolio saves a visitor's theme in `localStorage` under `theme`, as `light`, `dark` or
`system`. The script sets `data-theme` on the root to the theme saved, and follows the system's when
nothing is saved, when `system` or any other value is, and when the browser refuses the page its
storage. It sets the theme again when the system's changes, and when the portfolio saves a choice or
clears it in another tab. Where the browser cannot report the system's scheme, the script reads it
as light, so a saved theme still applies there. Storage belongs to an origin, so a page reads the
visitor's choice only on the portfolio's own origin, and anywhere else follows the system.

`themeScriptHash` holds while nothing after the plugin rewrites the inline script, as a minifier of
a page's HTML would. It is the hash of the script in the installed version, so a policy reads it
from the package rather than keeping a copy.

## Browser support

The colors are written with `light-dark()`, which sets the floor: Chrome and Edge 123, Firefox 120
and Safari 17.5. An empty live callout draws nothing by `:has()`, which Firefox has from 121, so in
Firefox 120 it draws its ground until it is filled, and a label that holds a checkbox or a radio
shows no pointer there, though the box or the dot does. The kit's browser tests run in Chromium.

A page built with Vite takes the floor from the kit as its build target, so its sheets keep each
`light-dark()` as written. A lower target rewrites each one into switches set once on the root, and
any part of the page set to the other scheme keeps the page's colors. Taken from the kit, the target
moves with the kit when the kit raises its floor. Each call gives a new value, so a page may change
its own.

```ts
import { browserFloor, themeScriptPlugin } from '@jasonsdevspace/design-kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [themeScriptPlugin()],
    build: { target: browserFloor() },
});
```

A page whose `css.transformer` is `'lightningcss'` passes the floor to Lightning CSS too, since Vite
gives that transformer targets of its own, lower than the floor, and the transformer rewrites each
`light-dark()` before the build target applies.

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

## License

MIT. See [LICENSE](https://github.com/jasonsdevspace/design-kit/blob/main/LICENSE). The tests, and
the decisions behind the kit, are in [the repository](https://github.com/jasonsdevspace/design-kit).
