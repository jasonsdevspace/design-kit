# @jasonsdevspace/design-kit reference

The markup, the rules and the React props for every piece of the kit. The package README links it at
each release's tag, so it matches the version a page installs. [The package README](README.md) says
what the kit is and how to set it up, and [the site](https://jasonsdevspace.com/design-kit/) shows
each piece live in both themes.

## The sheets

`base.css` and `components.css` load after `tokens.css`, since the tokens' first statement declares
the kit's layer order. `base.css` draws selected text on the accent rather than on the browser's
blue, since a page keeps one accent, and in the text the accent carries. It sets inline code a step
smaller than the text around it and lets a long name break anywhere rather than push a narrow column
wider. Inside a `pre` code takes the block's size, and inside a link it keeps the link's underline.
The kit leaves the browser's underline on a link in running text, in a paragraph, a list, a callout,
a panel, a dialog, a table, a toast, the strip or the footer, since the accent stands too close to
the text around it to mark a link by its color alone, and a footer's link takes the footer's own
muted color. A piece that is a link, such as a button, a pill, a tab, a row or a tab bar's link,
takes the underline off in its own class, since its edge, its sign or its place in a row of links
marks it instead, and the site header's brand stands at the header's start, where a link home is
looked for. A text button puts the underline back, having no edge. The base also puts a pointer
cursor on a `<summary>`, and on a checkbox or radio and the label around it.

Every token's value, each color in both themes, and the contrast of each color pairing are on [the
tokens page](https://jasonsdevspace.com/design-kit/tokens/).

The tokens `tokens.css` declares on the root are also in the Design Tokens Community Group's format,
2025.10, in `tokens.resolver.json`, which the package exports for a tool that reads that format. It
is one resolver document: its base set holds every token the two themes share, and its theme
modifier splits each color's and shadow's `light-dark()` into a light and a dark context, light by
default. A token the format cannot write is in `tokens.css` alone: a length in `em`, the keyword
`auto`, and a value the browser works out as it draws, from the visitor's text size, the page's
width or what a phone keeps at its edges, as the paddings held by `min()`, the safe area, the
column's inset and where a band's content starts are. A token set on a piece rather than the root,
such as `--dk-flow-step`, is left out too. A test holds the two files to each other, and a token
renamed in the file breaks a tool that reads it as a custom property renamed in the sheet breaks a
page.

<details>
<summary>Every token, with its value or role</summary>

| Tokens                                                                                            | Value or role                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dk-bg`, `--dk-surface`, `--dk-raised`                                                          | the page, a card, and what floats over both                                                                                                                                                                                                                                                                                                                                                        |
| `--dk-fg`, `--dk-muted`                                                                           | text, and text that steps back                                                                                                                                                                                                                                                                                                                                                                     |
| `--dk-line`, `--dk-control`                                                                       | a rule, and a control's edge                                                                                                                                                                                                                                                                                                                                                                       |
| `--dk-accent`, `--dk-on-accent`                                                                   | links, the lead action, and text on it                                                                                                                                                                                                                                                                                                                                                             |
| `--dk-highlight`                                                                                  | what is chosen or pointed at                                                                                                                                                                                                                                                                                                                                                                       |
| `--dk-success`, `--dk-success-bg`                                                                 | what went right, and its ground                                                                                                                                                                                                                                                                                                                                                                    |
| `--dk-danger`, `--dk-danger-bg`                                                                   | what went wrong, and its ground                                                                                                                                                                                                                                                                                                                                                                    |
| `--dk-warning`, `--dk-warning-bg`                                                                 | what needs care before it goes wrong, and its ground                                                                                                                                                                                                                                                                                                                                               |
| `--dk-scrim`                                                                                      | what dims the page behind a dialog                                                                                                                                                                                                                                                                                                                                                                 |
| `--dk-space-1` to `--dk-space-8`                                                                  | 0.25, 0.5, 0.75, 1, 1.5, 2, 3 and 4rem                                                                                                                                                                                                                                                                                                                                                             |
| `--dk-text-caption`, `--dk-text-small`, `--dk-text-body`                                          | 0.85, 0.9 and 1rem                                                                                                                                                                                                                                                                                                                                                                                 |
| `--dk-text-lead`, `--dk-text-title`                                                               | 1.1 and 1.25rem                                                                                                                                                                                                                                                                                                                                                                                    |
| `--dk-text-heading`, `--dk-text-display`                                                          | 1.5 and 1.75rem                                                                                                                                                                                                                                                                                                                                                                                    |
| `--dk-text-numeral`                                                                               | 3.5rem, a figure read from across a room                                                                                                                                                                                                                                                                                                                                                           |
| `--dk-text-code`                                                                                  | 0.9em, a step under the text around it                                                                                                                                                                                                                                                                                                                                                             |
| `--dk-leading-tight`, `--dk-leading-body`                                                         | 1.2 and 1.5                                                                                                                                                                                                                                                                                                                                                                                        |
| `--dk-weight-normal`, `--dk-weight-medium`, `--dk-weight-strong`                                  | 400, 500 and 600                                                                                                                                                                                                                                                                                                                                                                                   |
| `--dk-tracking-caps`                                                                              | 0.06em, the tracking of a label in caps                                                                                                                                                                                                                                                                                                                                                            |
| `--dk-font-sans`, `--dk-font-mono`                                                                | the system's sans and mono stacks                                                                                                                                                                                                                                                                                                                                                                  |
| `--dk-radius-small`, `--dk-radius`, `--dk-radius-large`                                           | 0.25, 0.375 and 0.5rem                                                                                                                                                                                                                                                                                                                                                                             |
| `--dk-radius-pill`                                                                                | 999px, round ends on a tab or a tag                                                                                                                                                                                                                                                                                                                                                                |
| `--dk-ring-width`, `--dk-ring-offset`                                                             | 2px and 2px                                                                                                                                                                                                                                                                                                                                                                                        |
| `--dk-indicator-width`                                                                            | 2px, the line under a chosen tab and over a tab bar's current place                                                                                                                                                                                                                                                                                                                                |
| `--dk-field-height`, `--dk-field-inline`                                                          | a field's height, 2.25rem, and its inline padding, 0.75rem                                                                                                                                                                                                                                                                                                                                         |
| `--dk-target`                                                                                     | 2.75rem, the touch target on a phone and in an app                                                                                                                                                                                                                                                                                                                                                 |
| `--dk-target-large`                                                                               | 3.5rem, a target pressed at arm's length                                                                                                                                                                                                                                                                                                                                                           |
| `--dk-strip`, `--dk-strip-tools`                                                                  | 2.5rem, and `auto`, the room kept for switches                                                                                                                                                                                                                                                                                                                                                     |
| `--dk-measure`, `--dk-column`                                                                     | 34rem and 72rem                                                                                                                                                                                                                                                                                                                                                                                    |
| `--dk-app-column`, `--dk-app-bar`                                                                 | 28rem, the widest an app's frame grows, and 4rem, the least height of its bar                                                                                                                                                                                                                                                                                                                      |
| `--dk-app-body`                                                                                   | 8rem, the least height of an app's body, a few lines it can scroll, and none in a picture                                                                                                                                                                                                                                                                                                          |
| `--dk-dialog-width`                                                                               | 32rem, the widest a dialog grows in the middle of a screen                                                                                                                                                                                                                                                                                                                                         |
| `--dk-space-4-held`                                                                               | `--dk-space-4` stopping at 16px: a panel's and a tile's inset on a phone and in an app, through `--dk-card-inset`, a dialog's on a phone and in an app, an app frame's sides through `--dk-app-side`, and a dialog's gap from the screen's edges                                                                                                                                                   |
| `--dk-space-5-held`                                                                               | `--dk-space-5` stopping at 24px, a dialog's padding on a wide screen                                                                                                                                                                                                                                                                                                                               |
| `--dk-field-inline-held`                                                                          | `--dk-field-inline` stopping at 12px, a stepper's inline padding                                                                                                                                                                                                                                                                                                                                   |
| `--dk-stack-pinned`, `--dk-stack-raised`, `--dk-stack-bar`, `--dk-stack-toast`, `--dk-stack-skip` | the order things sit over one another, lowest first: a pinned cell, a list that opens, a bar at an edge, a toast, the skip link                                                                                                                                                                                                                                                                    |
| `--dk-shadow-raised`                                                                              | `0 6px 24px light-dark(rgb(0 0 0 / 0.18), rgb(0 0 0 / 0.5))`                                                                                                                                                                                                                                                                                                                                       |
| `--dk-shadow-resting`                                                                             | `0 1px 3px light-dark(rgb(0 0 0 / 0.12), rgb(0 0 0 / 0.4))`, the lift of a raised panel                                                                                                                                                                                                                                                                                                            |
| `--dk-duration-short`, `--dk-duration-medium`                                                     | 150ms and 250ms, a change of state and a surface arriving                                                                                                                                                                                                                                                                                                                                          |
| `--dk-wait`                                                                                       | 400ms, how long a wait goes unremarked before a loading line shows                                                                                                                                                                                                                                                                                                                                 |
| `--dk-safe-top`, `--dk-safe-right`, `--dk-safe-bottom`, `--dk-safe-left`                          | what a phone keeps at each edge, zero unless the viewport meta says `viewport-fit=cover`                                                                                                                                                                                                                                                                                                           |
| `--dk-column-inset`                                                                               | how far the column stands in from each side of a band the width of the page, `max(0px, (100% - var(--dk-column)) / 2)`                                                                                                                                                                                                                                                                             |
| `--dk-app-inset`                                                                                  | how far an app's column stands in from each side of the screen, `max(0px, (100vw - var(--dk-app-column)) / 2)`                                                                                                                                                                                                                                                                                     |
| `--dk-app-side`                                                                                   | `--dk-space-4-held`, how far an app frame's words stand in from its sides, which a toast's sides and a band's on an app's page match                                                                                                                                                                                                                                                               |
| `--dk-icon-size`                                                                                  | 1.25rem on an icon-only button's icon and 1.5rem on a tab bar's, set by the kit on those icons, which a stroke of two in twenty four of it follows                                                                                                                                                                                                                                                 |
| `--dk-band-left`, `--dk-band-right`                                                               | where content starts on each side of a band the width of the page: the column's inset, or what a phone keeps at that side where that is more, then `--dk-space-4`, or `--dk-app-side` on an app's page                                                                                                                                                                                             |
| `--dk-flow-step`                                                                                  | the step between the pieces a column holds, `--dk-space-4` in an explainer, a content page, a band, their sections, a section in a group and an app's body, and `--dk-space-3` in a panel and a dialog, set on what each holds, and in a stack the step of what holds it, or `--dk-space-2` in a pair's stack and `--dk-space-3` in a heading's, and how tall a title beside a corner Close stands |
| `--dk-ground`, `--dk-ground-step`                                                                 | the ground of what holds a piece, and the one a code block or a tile steps to on it: the page's and the card's, a panel's and the page's, a dialog's or a raised panel's and the card's                                                                                                                                                                                                            |
| `--dk-card-inset`                                                                                 | how far a panel's and a tile's words stand in, `--dk-space-5`, and `--dk-space-4-held` at 48rem or less and in an app's frame, a tab bar's page and a dialog on either                                                                                                                                                                                                                             |
| `--dk-dialog-inset`                                                                               | how far a dialog's content stands in, which its corner Close is placed from, `--dk-space-5-held`, and `--dk-space-4-held` at 48rem or less and on a page with an app's frame or a tab bar's page                                                                                                                                                                                                   |

</details>

### Properties a page sets

The kit leaves these unset on the root, so each piece draws its default until a page sets one, on
its root or on the piece by a class of its own. They are the one way a page changes how a piece
draws, and a page writes no rule over a kit class for it, as [decision
0016](https://github.com/jasonsdevspace/design-kit/blob/main/docs/decisions/0016-a-page-changes-how-a-piece-draws-only-through-the-properties-it-names.md)
sets out. Where a property sets a ground, the page chooses a value that keeps what sits on it to its
contrast, in both themes, which `light-dark()` writes in one value.

A property whose name starts with `--_dk-` is the kit's own working value, such as a width a grid of
buttons works its columns out with. It is not one of these, a page never reads or sets it, and it
may change in any release.

| Property                   | Default                                                            | What it sets, and what it must hold                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dk-focus`               | the accent                                                         | The focus ring and a control's edge under a pointer, at 3 to 1 against every ground it rings                                                               |
| `--dk-button-shadow`       | none                                                               | A shadow under a button at rest. The button's edge still marks it, so the shadow holds no ratio of its own                                                 |
| `--dk-button-press`        | none, so a held button does not move                               | How a held button moves, and where a toggle that is on or a button whose panel is open rests, as a whole `translate`, such as `0 2px`                      |
| `--dk-panel-shadow`        | the resting shadow                                                 | A shadow under a raised panel                                                                                                                              |
| `--dk-tile-ground`         | `--dk-ground-step`, the card's on a page and the page's in a panel | A tile's ground. A tile's title and detail hold 4.5 to 1 on it, and its sign 3 to 1                                                                        |
| `--dk-tile-shadow`         | none                                                               | A shadow under a tile                                                                                                                                      |
| `--dk-row-picture-size`    | the target                                                         | The width and height of a picture at a row's start, at most a quarter of the screen. A tile in columns lays its picture across its top instead             |
| `--dk-tile-least`          | 15rem                                                              | The least width of a tile in a list of tiles in columns, so a name of a few words fits                                                                     |
| `--dk-button-grid-columns` | 3                                                                  | The columns a grid of buttons asks for                                                                                                                     |
| `--dk-button-grid-least`   | the target, and the larger target in a tall grid                   | The least width of a grid's cell. A tall grid sets its own, so a page sets this on the grid itself to change it there                                      |
| `--dk-table-ground`        | the nearest container's, `--dk-ground`                             | The ground under a pinned column. The cells' text holds 4.5 to 1 on it                                                                                     |
| `--dk-table-pinned-size`   | 8rem, with no room kept under 17.5rem wide                         | The width of a pinned column                                                                                                                               |
| `--dk-field-measure`       | `--dk-measure`                                                     | The widest a field, a row of fields or a callout beside them grows inside a page, a band or a stack, a panel there included. `none` for its column's width |
| `--dk-stepper-digits`      | 2                                                                  | The figures a stepper's field keeps room for                                                                                                               |
| `--dk-fields-least`        | 10rem                                                              | The width each field in a row of fields starts from, so two share a line only where both fit. At least a stepper's width where the row holds one           |
| `--dk-band-room`           | `--dk-space-7`                                                     | The room above and below a band, inside its ground                                                                                                         |
| `--dk-sections-least`      | 20rem                                                              | The least width of a section in a group of sections, so a group of short sections can stand more to a row                                                  |
| `--dk-band-hero-picture`   | 28rem, never past 45% of the row                                   | The width of a hero's picture beside its words from 48rem wide, and the tallest it stands over them on a narrower screen                                   |

## Page chrome

The page chrome a demo draws around its page is a skip link, a strip above the page that says whose
demo it is, and a footer below it, each shown live on
[the page chrome page](https://jasonsdevspace.com/design-kit/page-chrome/). `components.css` styles
the markup below, which a page without React writes by hand and the components in
`@jasonsdevspace/design-kit/react` draw. The components ship no stylesheet, so a page loads
`components.css` itself.

The skip link is the keyboard's first stop, out of sight until it takes focus, and then at the
column's inset, where the strip's links start. Following it moves focus to the page's main content,
which has a tabindex of -1 so it can take focus. Shown, it has a transparent edge, which forced
colors draw in the link's color, so a page that resets the link's border loses its box there.

<!-- example: skipLink -->

```html
<a class="dk-skip" href="#main-content">Skip to content</a>
<main id="main-content" tabindex="-1">...</main>
```

<details>
<summary>A skip link inside a box of the page's own</summary>

A skip link can also sit inside a box on the page, such as one at the top of a column of filters
that leads past them to the results. It stays hidden and takes no clicks until the keyboard reaches
it. Give the box a position, and the link shows at the top of that box when it takes focus.

</details>

The strip holds a navigation landmark named Portfolio, with the author's name linking to the
portfolio, as in the footer, then "How it works" and "Source on GitHub". On the demo's explainer,
the explainer's link carries `aria-current="page"`. A demo with switches of its own puts them in a
section after the links, named for them, and a demo with none leaves the section out.

<!-- example: strip -->

```html
<div class="dk-strip">
    <nav class="dk-strip-links" aria-label="Portfolio">
        <a href="https://jasonsdevspace.com/">Jason Poteet</a>
        <a href="./about/">How it works</a>
        <a href="https://github.com/jasonsdevspace/example">Source on GitHub</a>
    </nav>
    <section class="dk-strip-tools" aria-label="Tour">
        <button type="button" class="dk-button">Tour</button>
    </section>
</div>
```

<details>
<summary>Switches that arrive after the page</summary>

A demo whose switches are drawn by a script that has not run yet keeps their room, so nothing below
the strip moves when they come. The section has no name and holds only the room, so it is no
landmark and a screen reader finds nothing in it. When the switches come they take the room's place,
and the section takes its name.

<!-- example: stripWaiting -->

```html
<section class="dk-strip-tools"><span class="dk-strip-room"></span></section>
```

The room is the height of one row of the kit's buttons or fields, beside the links on a wide screen
and on a row of its own on a phone. Switches of another height, or more than fit on one row, still
move what is below them. On a wide screen the room has no width of its own, so a demo whose switches
would make the strip wrap names their width in `--dk-strip-tools`, in the strip's own text size,
such as `:root { --dk-strip-tools: 20em; }`. The strip then wraps the same before the switches come
as after. On a phone they take a row of their own and the width is left aside.

</details>

The footer is a few short sentences that say whose project the demo is. The author's name links to
the portfolio and "more work" to the author's GitHub, then come "How it works" and the demo's source
under its license. On the explainer it marks the "How it works" link with `aria-current="page"`, as
the strip does. Anything the demo adds comes after the license's name, as sentences of its own. A
line of the demo's own that is not part of the footer's text, such as the version and commit the
page was built from, is a second paragraph, `.dk-footer-aside`. It sits at the end of the text's row
on a wide screen, and under the text on a phone or wherever the row has no room.

<!-- example: footer -->

```html
<footer class="dk-footer">
    <p>
        Example is a portfolio project by <a href="https://jasonsdevspace.com/">Jason Poteet</a>,
        who has <a href="https://github.com/jasonsdevspace">more work</a> on GitHub.
        <a href="./about/">How it works</a> is explained in plain words. The
        <a href="https://github.com/jasonsdevspace/example">source</a> is on GitHub under the
        <a href="https://github.com/jasonsdevspace/example/blob/main/LICENSE">MIT license</a>.
    </p>
    <p class="dk-footer-aside">Built at commit abc1234.</p>
</footer>
```

<details>
<summary>How the strip and footer are drawn</summary>

On a wide screen the strip is one 2.5rem row over a 1px rule, in the small text, with its links
1.5rem apart and the switches on the right. At 48rem wide or less the text steps down to the caption
size, the links close to 1rem apart and wrap where they must, and the switches take a row of their
own below them.

The footer's text holds to the measure, as prose does, while its rule runs the page's width. Every
link in the strip and the footer keeps its underline, and in the footer's text the underline is what
tells a link from the text around it. The link marked current, by `aria-current="page"` or by
`"true"` on a page beneath the one it names, stands in the page's text at the heading's weight, so
it is told from the links around it by more than its color, in forced colors too, and still reads as
a link.

</details>

The strip and the footer run their rules the width of the page and line their content up with the
page's column, `--dk-column`, 72rem wide by default and centered, inset by 1rem. A page whose column
is another width sets `--dk-column` to it on `:root`, as it sets a color role.

On a page that says `viewport-fit=cover`, the strip starts its links below what a phone held upright
keeps at its top, and on a phone held on its side the strip, the footer, an explainer and its header
start their content past what the phone keeps at each side, where that is more than the column's
inset. Unless a tab bar follows the footer, its last line ends a step above what the phone keeps at
its foot, whether a toast, a dialog or a script comes after it or nothing does. On a page that ends
in a tab bar, whose column already clears the phone's sides and whose bar clears its foot, the
chrome pads for neither again. `--dk-band-left` and `--dk-band-right` hold where that content
starts, so a page's own band that runs the width of the page, such as a colored section, lines its
content up with the strip by padding its sides with them. Each takes its percentage from the width
of the box that holds the element it pads, so a band that fills the page reads the page's width, and
reads `--dk-column` from the root.

A page with React draws the same markup from the components.

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

**`SkipLink` props**

| `SkipLink` | Default             | What it does                      |
| ---------- | ------------------- | --------------------------------- |
| `target`   | `'main-content'`    | The id of the element it leads to |
| `children` | `'Skip to content'` | The link's words                  |

**`PortfolioStrip` props**

| `PortfolioStrip` | Default                       | What it does                                                          |
| ---------------- | ----------------------------- | --------------------------------------------------------------------- |
| `about`          | required                      | The demo's explainer, relative or absolute                            |
| `source`         | required                      | The demo's repository                                                 |
| `current`        | none                          | `'about'` marks the explainer's link as the current page              |
| `tools`          | none                          | The demo's own switches, in a section after the links                 |
| `toolsLabel`     | required with `tools`         | The name of the switches' landmark, such as Settings                  |
| `toolsWaiting`   | `false`                       | Keeps one row of room, unnamed, while `tools` draws nothing           |
| `toolsNoscript`  | a sentence about the switches | The line a visitor without script reads in the room. Empty draws none |

With `tools` undefined, null, false, an empty string, or a list or a fragment of only those, the
strip draws no section for them, so a demo can pass `hasTour && <Tour />`. Whenever `tools` is
given, `toolsLabel` is too, since the name a screen reader hears has to say what the section holds,
and TypeScript refuses the one without the other. A blank name, as plain JavaScript can pass,
names nothing, so the section goes unnamed and is no landmark, as the room is. The room carries a
line inside `noscript`, "With scripts on, the demo's switches sit here.", for the visitor the
switches never come for, which a page words for itself or turns off with an empty `toolsNoscript`.
A switch drawn into a template and copied out by the page's script leaves its own such line behind,
which is why the room has one.

**`DemoFooter` props**

| `DemoFooter`  | Default               | What it does                             |
| ------------- | --------------------- | ---------------------------------------- |
| `name`        | required              | The demo's name, which opens the footer  |
| `about`       | required              | As on the strip                          |
| `source`      | required              | As on the strip                          |
| `current`     | none                  | As on the strip                          |
| `license`     | `LICENSE` in `source` | The link to the license                  |
| `licenseName` | `'MIT license'`       | The license's name in the footer         |
| `children`    | none                  | Sentences of the demo's own at the end   |
| `aside`       | none                  | A line of the demo's own beside the text |

The default `license` is `LICENSE` on the main branch of `source`, with any trailing slash on
`source` dropped first. Children that draw nothing, as for `tools`, add nothing, and an `aside`
that draws nothing leaves the footer one paragraph.

The strip and the footer put `about`, `source` and `license` into their links unchecked. Each must
be a URL the demo's author writes, never one taken from the page's address or a visitor's input,
which could send a visitor anywhere.

### Site header

<!-- example: siteHeader -->

```html
<header class="dk-site-header">
    <a class="dk-site-brand" href="/"
        ><svg class="dk-site-mark" aria-hidden="true" focusable="false" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="currentColor"></rect></svg
        >Scorekeeper</a
    >
    <nav aria-label="Site">
        <ul class="dk-pills" role="list">
            <li><a class="dk-pill" href="/" aria-current="page">Home</a></li>
            <li><a class="dk-pill" href="/about/">About</a></li>
            <li><a class="dk-pill" href="/app/">Open the app</a></li>
        </ul>
    </nav>
</header>
```

A site's own pages, such as a landing page and an about page, open under the strip with a `header
class="dk-site-header"`, the page's one banner. It holds a `dk-site-brand` link home with the site's
mark and its name, and the site's pages as pills in a `nav`, the current page's link marked
`aria-current="page"`. The nav is named Site, never the site's own name, which the brand link
already says, so a screen reader hears the name once, and never Pages, which the pills example uses.
The mark is the site's own drawing in a `dk-site-mark` slot, 1.75em square so it grows with the
text, hidden from a screen reader, and a header with no mark draws the name alone. The skip link
lands on `main`, past the header.

The header starts its brand at the strip's content edge, by the same band insets, and ends on a rule
in the line color. On a wide screen the brand and the pages share a row, the pages at its end, and
on a phone or at a large text size the pages wrap onto a row of their own under the brand, starting
on the same edge, in the order written, so the keyboard still takes the brand and then the pages.
The brand's name is at the body size and the strong weight, `--dk-space-2` from the mark, and the
rows stand `--dk-space-3` apart and `--dk-space-5` across. The brand and each page are at least the
target tall. The kit ships no component for it, since each site renders its links through its own
router.

## Buttons, fields and callouts

`components.css` styles a button, a text field, a select, a set of choices and a callout by the
markup below, each in every state on [the controls
page](https://jasonsdevspace.com/design-kit/controls/). A control's state is the native or ARIA
attribute a screen reader already reads, such as `aria-pressed` or `aria-invalid`, never a class of
the kit's. Every rule for these pieces adds no weight, so a state wins over the resting look by
coming later in the sheet, and a page's own rule outside a layer wins over both, as [decision
0006](https://github.com/jasonsdevspace/design-kit/blob/main/docs/decisions/0006-a-control-state-is-an-attribute.md)
explains.

### Buttons

<!-- example: buttons -->

```html
<div class="dk-actions">
    <button type="button" class="dk-button">Filters</button>
    <button type="button" class="dk-button dk-button-accent">Save rule</button>
    <button type="button" class="dk-button dk-button-large">Try it with your own products</button>
    <button type="button" class="dk-button dk-button-accent dk-button-large dk-button-tall">
        Save the round
    </button>
    <button type="button" class="dk-button dk-button-text">Show the markup</button>
    <button type="button" class="dk-button dk-button-text dk-button-quiet">
        <span aria-hidden="true">×</span>
        <span class="dk-visually-hidden">Close</span>
    </button>
    <button type="button" class="dk-button" aria-pressed="true">Members only</button>
    <button aria-describedby="previous-why" type="button" class="dk-button" aria-disabled="true">
        Previous
    </button>
</div>
<p id="previous-why" class="dk-field-hint">This is the first page.</p>
```

A button is `type="button"` unless the page gives it another type, so it never submits a form by
surprise, and a link with `dk-button` looks the same as a button. `dk-button-accent` fills the one
action a view leads with in the accent, and an accent button is never a toggle. `dk-button-large` is
a bigger target for the action a page leads with, such as the way into a demo, with or without the
accent. `dk-button-tall` takes the larger target, `--dk-target-large`, for what a screen is for
where it is pressed at arm's length, as on a phone passed around a table. It sets the height, and
the least width with it, so it goes with `dk-button-large` or without. `dk-button-text` draws a
button as a link, for an action that sits beside a block or on a line of its own, such as showing
the markup under a demo. It is never the accent button, never a toggle, never large and never tall.
`dk-button-quiet` beside `dk-button-text` makes it quiet, for a Close at the corner of a panel, a
tour or a dialog, which a `dk-close` sets there as [A Close in the corner](#a-close-in-the-corner)
shows: muted with no underline, so it does not compete with the view's one strong action. It says
one word, Close, written out of sight beside a × hidden from a screen reader, as the toast's close
does, and it is never off, since a Close always closes.

A toggle that stands alone carries `aria-pressed`, `"true"` or `"false"`, and keeps the same label
in both states, since the attribute already says which it is. An action carries no `aria-pressed` at
all. A button with `aria-expanded="true"`, whose panel is open, is drawn as a pressed one, and a
text button with it keeps its link look, since it has no padding around its words for the pressed
look to fill and the open panel is the sign.

A row of buttons, such as a page's actions under its lead, sits in a `dk-actions`, as above. It
spaces the buttons by `--dk-space-2` and wraps them onto rows the same step apart, where spaces
between buttons would leave the rows touching. It sets no margin of its own. In a form with no class
attribute a bare button stands no step below a field above it, where a `dk-actions` does, so a
form's buttons go in a `dk-actions`, a lone submit too.

Mark an unavailable button `aria-disabled="true"`, never `disabled`. This reference calls such a
button off, as the React prop does. A disabled button drops focus and leaves the tab order, while an
aria-disabled one stays where the keyboard can reach it and find out why. The sheet draws a
`disabled` button, and one inside a disabled fieldset, the same as an off one.

The attribute does nothing by itself. A page that writes this markup makes its click handler check
`aria-disabled` and return early, calling `preventDefault()` so a submit button does not submit.

Say why a button is off in text beside it, such as a `.dk-field-hint` paragraph the button's
`aria-describedby` names. A form's submit button is better left on while the form is incomplete, so
a press shows the errors rather than doing nothing.

#### A busy button

<!-- example: busyButton -->

```html
<button
    type="button"
    class="dk-button dk-button-accent"
    aria-disabled="true"
    data-busy="Saving the rule."
>
    Save rule
</button>
```

A button whose press has started something still running, such as a save, is busy: marked
`data-busy`, with the words to say as its value, and `aria-disabled="true"`, as `Button` writes them
with `busy`. It is off at once, so a second press does nothing, but it keeps its look for
`--dk-wait` before it is drawn off, so a fast save does not flash it gray, and the pointer shows the
wait at once. The wait is a delay rather than a motion, so it stands under reduced motion and in
forced colors, where the button then takes `GrayText` as an off one does. Drawn off, it also shows a
row of three dots centered at its foot, so a visitor who sees it can tell a button at work from one
that cannot be pressed. The dots pulse, never fainter than 3:1 on the kit's grounds, and stand still
under reduced motion and in forced colors. They take `--dk-fg`, the system's gray in forced colors,
so a page that recolors a busy button's words, as on a dark band, sets `--dk-fg` there too. They sit
in the band every button keeps below its words, so they never meet words that wrap or grow. They
take no place in the row, so the button keeps its size, an icon alone or a text button included, and
they hold no words, so its name stays as it was. Only a busy button marked off draws them, so markup
that marks a button busy before an attach runs, or with no script, draws no dots on the accent's
fill. A screen reader hears the off state at once, as it must for the press to be stopped.

`attachBusy(button, { status, signal })` from `./controls`, or `useBusy()` in React, which speaks on
the screen's `StatusProvider`, marks a busy button `aria-disabled` where the page has not, and takes
away only that mark once the work is done. A press by pointer, Enter or Space, or by Enter in a
field of the form it submits, is stopped before the button's own handlers and React's `onClick` hear
it, though a capture listener further up still does. Once the wait the sheet holds the look back by
has passed, the button's words are said once on the status line, politely, so they wait for words
already there and the end of a progress beside them takes their place. `busy` set to true says
"Saving.", which fits a save alone, so any other action, such as a delete or a send, gives its own
words. Words not yet said when the work is done are dropped, so a result a toast says is never
followed by a late "Saving." Taken down, by the function it returns or by its `signal`, as [Taking a
control down](#taking-a-control-down) has it, it no longer stops a press, takes away the mark it set
and drops words not yet said. A page that sets a transition of its own on a busy button replaces
the wait, and the button is drawn off at once, though its dots still wait.

The dots are a busy button's `::after`, so a page draws nothing of its own there while it is busy.
They set `content`, `position`, `inset-block-end`, `inset-inline`, `margin-inline`, `width`,
`height`, `color`, `background` and `animation`, and `forced-color-adjust` in forced colors, so a
page whose own rule draws something in a kit button's `::after` resets those it does not set
itself. A busy button is `position: relative`, as its dots are placed against it, so an element a
page places absolutely inside it sits against the button while it is busy.

Pressed, off and busy say different things. Pressed is a toggle that is on. Off is a button that
can do nothing now, with the reason beside it. Busy is a button whose press is still being carried
out, and it goes back to resting on its own once the work is done.

```tsx
import { Button, useBusy } from '@jasonsdevspace/design-kit/react';

export const SaveRound = ({ saving, save }: { saving: boolean; save: () => void }) => {
    const busy = useBusy<HTMLButtonElement>();
    return (
        <Button ref={busy} accent busy={saving ? 'Saving the round.' : false} onClick={save}>
            Save the round
        </Button>
    );
};
```

<details>
<summary>How a button is drawn</summary>

A button is 2.25rem tall, `--dk-field-height`, as tall as a field, and 2.75rem, `--dk-target`, at
48rem wide or less, and at every width in an app's frame, on a page that ends in a tab bar, in a
dialog on either and in a toast, and it is never narrower than it is tall. It keeps a band of
0.375rem above and below its words, which a button of one line fits inside its height, so only
words that wrap stand it taller. A text button keeps only what the leading around it leaves short of
that band, so a line of it in ordinary text keeps the button's height. It takes a tap at once, with
no wait for a second tap that would zoom the page. It has no ground of its own, so it takes the
ground of whatever it sits on, a callout included. A large button is 2.75rem tall at every width,
with wider inline padding and the body text size. A tall button is 3.5rem tall at every width and
never narrower than that, and changes nothing else. A text button has no edge, no inline padding and
no minimum width, in the accent and underlined at the size of the text around it, and keeps the
button's height, so its target holds, which is why it sits beside a block rather than in running
text, whose line it would push taller. Pointed at, its underline thickens, since it has no edge to
color. Open, it keeps that thicker underline and nothing else. Off, it keeps its underline, in the
muted text and still with no edge. Where a pointer can hover, the edge turns to the focus color
under it, and the accent button, or a link drawn as one, underlines its words instead, its one cue
under a pointer since its edge is already the accent. Pressed is the highlight with an edge twice as
thick in the accent, and its words in the page's text, an accent button's included. Off is the muted
text on no ground with an edge in the line color, rather than a fade, so its words keep a ratio the
palette measures. An off toggle that is on keeps the thicker edge, in the line color. In forced
colors a pressed button takes the system's `Highlight`, and an off one takes `GrayText` on the
page's ground, accent or not. An off toggle that is on keeps an edge in `Highlight`. A quiet button
has no edge and no underline, in the muted text at rest and the page's text under a pointer and
while held, open or off alike. It keeps a button's least width, so a × alone is as wide as the
button is tall, and in forced colors its words take `ButtonText`, underlined under a pointer and
while held.

A page with a look of its own for a button sets two custom properties and writes no rule over the
kit's class. `--dk-button-shadow` is a shadow drawn under a button at rest, such as a hard edge
that reads as something to press. `--dk-button-press` is how a button moves while it is held, as a
whole `translate`, such as `0 2px`. Held down, the shadow is dropped, so the button lands where its
shadow was. Neither is set by the kit, so a button has no shadow and is never moved. Set on a
button's class, such as the accent's, a property gives that button a shadow of its own. The shadow
takes no room, so a page leaves the gap under a row of buttons that it fills.

A toggle that is on, and a button whose panel is open, rests where a held button lands, with its
own inner edge in place of the shadow, and holding it down moves it no further. An off button and
a text button take neither property. In forced colors the browser draws no shadow, so a button is
not moved there.

</details>

### Fields

<!-- example: fields -->

```html
<div class="dk-field">
    <label class="dk-field-label" for="email" id="email-label">Email</label>
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
    <label class="dk-field-label" for="sort" id="sort-label">Sort by</label>
    <select class="dk-select" id="sort">
        <option value="">Choose an order</option>
        <option value="price">Price</option>
    </select>
</div>
<div class="dk-field">
    <label class="dk-field-label" for="note" id="note-label">Note</label>
    <p class="dk-field-hint" id="note-hint">Shown to the picker</p>
    <textarea class="dk-textarea" rows="3" id="note" aria-describedby="note-hint"></textarea>
</div>
```

A field is its label, a hint when it has one, an error when it has one, and then the control,
`.dk-input`, `.dk-select` or `.dk-textarea`. The error sits above the control, so a phone's keyboard
or an open list never covers it, and the hint stays while the error shows, since it often says how
to put the error right. The error starts with a visually hidden "Error: ", so it is told from the
hint by more than its color. `aria-describedby` lists only what is drawn, the hint and then the
error, followed by any description of the page's own, and is left off when there is none.
`aria-invalid="true"` is there only while an error is drawn. A field holds to the width of its
column, so a word with no place to break, such as an email address in an error, breaks inside it
rather than pushing the field past the column's edge. In a page, a band or a stack, in a form there
too, a field holds to `--dk-measure` as the prose beside it does, so a field for a short name never
runs the width of a wide panel, and a callout in its form ends where the fields end. So does a
callout written after a field or a row of fields in what holds them, for a page that draws its
fields with no form. A callout with no field before it there, one above the first field among them,
runs the column's width, so a message over a column of fields with no form goes in the form a page
gives them or under the field it speaks of. A page sets `--dk-field-measure` on a field or on its
form, a shorter length for a short answer such as a ZIP code, or `none` for the column's width.
Fields set side by side go in a `dk-fields` row, as [fields side by side](#fields-side-by-side)
shows, and a row of the page's own sets `none` on the row, so each field fills its cell. In a page's
own row, a field shorter than the tallest beside it keeps its control at its own height, with the
spare room below it, and in a `dk-fields` row the fields line up along their foot instead. In a
dialog or a popover the property has no effect, since the dialog's own width sizes its fields. An
inline stepper in a page's row keeps its label and stepper at the top of its cell, its label level
with the labels beside it. A field given more height than its parts, by a height or a flex grow of
the page's own, leaves the room below them too, so a control meant to fill its field, such as a
textarea that fills a panel, takes the room by the page's own `grid-template-rows` on the field,
which gives the control's row `1fr`, as `auto 1fr` for a label and its control or `auto auto 1fr`
with a hint. In a form with no class attribute, a field, a row of fields, a row of actions or a
callout that is not empty stands `--dk-space-4` below what sits above it, once another of those has
come before it, so a form's buttons go in a `dk-actions`, a lone submit too. Nothing else in a plain
form is given room. A form with a class attribute lays out its own parts. An error's words allow a
break after each "@", by a `<wbr>`, so an address too long for its line breaks there rather than at
whichever letter or stop the line runs out on, and the kit's own words keep punctuation away from
the address they show. A page that puts an address in its own label or hint can add `<wbr>` after
the "@" for the same break.

<details>
<summary>How a field is drawn</summary>

A control is as tall as a button, at both widths, and padded as one is, so its text starts where a
button's label does. Its text is never under 16px, so a phone does not zoom the page when the field
is tapped. On a screen under 11rem wide, a 320 pixel phone at twice the text size, a field for a
date, a month or a week pads its sides by `--dk-space-1` instead, so its words stand clear of the
picker's icon Chromium draws at its end. It sits on the page's own ground, so it reads as a well on
a card. The hint and the error are in the caption size, the error in the danger color, and an
invalid control's edge in the danger color too. In forced colors, where that color is gone, an
invalid control gains a dashed line around its edge in `CanvasText`, which moves nothing as the
error comes and goes, and gives way to the focus ring when it has focus. A disabled control is drawn
on the surface ground in the muted text. The select is a native `<select>`, its caret drawn as a
background, and in forced colors the browser's own arrow comes back. A select that shows its options
as a list, with `multiple` or a `size`, is left as the browser draws it, with no caret. A textarea
takes the same look but is as tall as its rows, three unless given, its lines at the body's leading
and its text at the top rather than centered, and it resizes in height alone, since a wider one
would push its column.

</details>

#### A required or an optional field

<!-- example: fieldMarks -->

```html
<div class="dk-field">
    <label class="dk-field-label" for="rule-name" id="rule-name-label"
        >Rule name <span class="dk-field-mark" aria-hidden="true">(required)</span></label
    ><input class="dk-input" required="" id="rule-name" aria-required="true" />
</div>
<div class="dk-field">
    <label class="dk-field-label" for="rule-note" id="rule-note-label"
        >Note <span class="dk-field-mark">(optional)</span></label
    ><input class="dk-input" id="rule-note" />
</div>
```

A field is marked required or optional in words in its label, `mark="required"` or
`mark="optional"`, never by an asterisk alone, which needs a key to explain it. The words are in the
muted text at the normal weight, so they do not compete with the label. Required is said by the
control's `aria-required`, so its words are hidden from a screen reader, which would otherwise say
it twice, and optional is said in the label's name, since nothing else says it. A form where most
fields are required marks the optional ones instead, and a form uses one kind of mark, never both,
as the example shows each kind only to draw it. A set of choices keeps "(required)" in its legend's
name, since not every screen reader says a group is required, and a set of radios is marked
`aria-required` as well. A required set of checkboxes says in its hint how many to choose, such as
"Choose at least one." The words are the kit's unless a page gives its own as `markWords`, as a page
in another language does. The mark does no checking. `required` stays the native attribute, since
the kit's check on submit reads it and it tells a screen reader a field is required where a form
marks its optional fields. `attachForm` turns the browser's own check off. The field, select,
textarea, stepper and set of choices all take `mark`. In forced colors the mark takes the text's
color and is told apart by its words.

#### Read only, off, busy and disabled

<!-- example: readOnlyFields -->

```html
<div class="dk-field">
    <label class="dk-field-label" for="round" id="round-label">Round</label>
    <input class="dk-input" readonly="" id="round" value="Round 3 of 10" />
</div>
<div class="dk-field">
    <label class="dk-field-label" for="game" id="game-label">Game</label>
    <input class="dk-input" readonly="" id="game" value="Wizard" />
    <input type="hidden" name="game" value="wizard" />
</div>
<div class="dk-field">
    <label class="dk-field-label" for="cards" id="cards-label">Cards each</label>
    <p class="dk-field-error dk-stepper-range" id="cards-range" hidden="">
        <span class="dk-visually-hidden">Error: </span>
        Enter a whole number from 1 to 10.
    </p>
    <div class="dk-stepper" role="group" aria-labelledby="cards-label">
        <button type="button" class="dk-button dk-stepper-down" aria-controls="cards" hidden="">
            <span aria-hidden="true">−</span>
            <span class="dk-visually-hidden">Lower Cards each</span>
        </button>
        <input
            class="dk-input dk-stepper-value"
            type="number"
            inputmode="numeric"
            min="1"
            max="10"
            step="1"
            readonly=""
            id="cards"
            value="3"
        />
        <button type="button" class="dk-button dk-stepper-up" aria-controls="cards" hidden="">
            <span aria-hidden="true">+</span>
            <span class="dk-visually-hidden">Raise Cards each</span>
        </button>
        <span class="dk-visually-hidden dk-stepper-limits" id="cards-limits"></span>
        <span class="dk-visually-hidden dk-stepper-status" role="status"></span>
    </div>
</div>
```

A value a visitor should read but not change, such as a saved round's total or a setting fixed for
this game, is read only, `readOnly` on the field. It stays in the tab order, so a keyboard reaches
it and a screen reader reads it, and its words can be copied. It keeps its edge's width, drawn
clear on a clear ground with its text in the page's color, so it lines up with the fields beside it
and reads as a value, while a field that can be changed keeps its edge and its well. In forced
colors its edge takes the ground's color. A select has no read-only state, so a read-only
`SelectField` draws a read-only field with the chosen option's words, and a hidden field carries
its value, so the form still sends it, and it is read only for the page rather than for a moment,
since turning it on or off draws a new control. A read-only stepper shows its value alone, its
buttons hidden while the field is read only, and with both hidden its figures start where a
read-only field's words start, at a field's height, so it keeps the edge of a column of read-only
values, in a browser with `:has()`. Without it the figures stay centered. A tall one keeps the
larger target. An inline stepper's value sits at its row's end, after its label, with no column to
line up with, so it keeps its centered figures and the target's height. A stepper is read only for
the page, as a setting fixed for the game is, since hiding its buttons changes its row, and on a
wide screen outside an app its height too.

A button that can do nothing for now is off, `aria-disabled`, kept in the tab order with the reason
beside it. `aria-disabled` does not stop typing in a field, so a field held for a moment is read
only, or the button that saves it is busy. A button whose press is still being carried out is busy.
A field is `disabled` only where the form must not send it, since Tab passes over a disabled field
and a screen reader reads it only while browsing, as unavailable, and its hint says why. A stepper
whose field turns read only while a button has focus keeps that button, marked off, and its value
where it stood, the other button keeping its room out of sight in a browser with `:has()`, until
focus leaves it, so focus is never dropped and nothing moves under it. A stepper in the middle of a
save is busy, not read only.

#### A field with a button

<!-- example: fieldAction -->

```html
<form class="dk-field" role="search">
    <label class="dk-field-label" for="search" id="search-label">Search the products</label>
    <div class="dk-field-action">
        <input class="dk-input" type="search" id="search" name="q" />
        <button type="submit" class="dk-button">Search</button>
    </div>
</form>
```

A control with a button beside it, such as a search with the button that runs it, sits in a
`dk-field-action` under the field's label. The control takes the room the button leaves, and both
stand one height, the taller of the two, at every width and text size. Where the button would leave
the control too narrow to type in, as at a large text size on a phone, the button moves under it.
The button is a kit button, and its words say what it does, as Search rather than Go.

A page with React draws the same field from `InputField` or `SelectField` with an `action`, inside
a form of its own. The field draws its label, hint and error as always, and puts the control and the
action in a `dk-field-action` row. The action comes after the control in the tab order, as on the
screen, and is named by its own words, not the field's label.

```tsx
<form role="search">
    <InputField
        label="Search the products"
        type="search"
        name="q"
        action={<Button type="submit">Search</Button>}
    />
</form>
```

#### Fields side by side

<!-- example: fieldsRow -->

```html
<div class="dk-fields">
    <div class="dk-field">
        <label class="dk-field-label" for="bid" id="bid-label">Bid</label>
        <p class="dk-field-error dk-stepper-range" id="bid-range" hidden="">
            <span class="dk-visually-hidden">Error: </span>Enter a whole number from 0 to 10.
        </p>
        <div class="dk-stepper" role="group" aria-labelledby="bid-label">
            <button type="button" class="dk-button dk-stepper-down" aria-controls="bid" hidden="">
                <span aria-hidden="true">−</span
                ><span class="dk-visually-hidden">Lower Bid</span></button
            ><input
                class="dk-input dk-stepper-value"
                type="number"
                inputmode="numeric"
                min="0"
                max="10"
                step="1"
                id="bid"
                value="3"
            /><button type="button" class="dk-button dk-stepper-up" aria-controls="bid" hidden="">
                <span aria-hidden="true">+</span
                ><span class="dk-visually-hidden">Raise Bid</span></button
            ><span class="dk-visually-hidden dk-stepper-limits" id="bid-limits"></span
            ><span class="dk-visually-hidden dk-stepper-status" role="status"></span>
        </div>
    </div>
    <div class="dk-field">
        <label class="dk-field-label" for="player" id="player-label">Player</label
        ><input class="dk-input" id="player" />
    </div>
</div>
```

Fields set side by side, such as a stepper's field beside a player's name, sit in a `dk-fields` row,
which needs no rules of the page's own. Every field in the row starts from one length,
`--dk-fields-least`, 10rem until a page sets it, a stepper's width rounded up, and the fields share
what is left, so a field's width comes from the row alone and a long label, a hint or an error never
moves the field beside it. Two fields share a line where the row is at least 21rem wide, two lengths
and the gap, which in a page's column is a screen from 368 pixels, and a narrower row or a larger
text size stacks them, each on a line of its own with its label whole. The fields stand
`--dk-space-4` apart both ways, a plain form's step, and a row written straight in a panel, a
dialog, a stack or anything else that spaces what it holds by `--dk-flow-step` stands its lines that
step apart, so a wrapped field sits as far below as a field under another wherever the row is
written. The fields line up along their foot, so their controls stand level where one label takes
two lines or one field shows a hint or an error. An inline stepper and a choice field each
take a line of their own in the row. The row holds to `--dk-field-measure` as a field does, so in a
page, a band or a stack it ends where the fields and the callout around it end, and a page sets
`none` on the row for its column's width. A field in the row narrows by the same property, as a ZIP
code's field with `--dk-field-measure: 6rem` does, and the others share the rest. A row with a
stepper wider than 10rem sets `--dk-fields-least` to hold it at its full size: 10.5rem for a stepper
of three figures, by `--dk-stepper-digits`, 12rem for a tall stepper and 13.25rem for a tall one of
three figures. Left at 10rem, such a stepper keeps its field as wide as itself in a browser with
`:has()`, a tall one with its buttons narrowed toward the target but never under it, and the pair
stacks on a screen where the two do not fit. A page that wants two fields side by side on a screen
360 pixels wide sets the length to 9.75rem, still as wide as a stepper of two figures. A row whose
fields are all hidden still takes a plain form's step, so a page that hides every field in a row
hides the row itself, with `hidden`. In a form with no class attribute the row is one of the kit's
blocks, and stands `--dk-space-4` from a field or a row of actions above or below it. A page with
React writes the `div` around the fields' components.

```tsx
<div className="dk-fields">
    <StepperField label="Bid" min={0} max={10} />
    <InputField label="Player" />
</div>
```

#### A refused form

The error is not live, since a form that fails in several fields at once would speak over itself. On
a submit that fails a check of the page's own, the page draws its errors and calls the function
`attachForm(form, { status, summary })` from `./controls` returns, or the one
`useFormRefusal({ invalid })` returns in React, which speaks on the screen's `StatusProvider`, and
the kit does the same itself for the browser's constraints, as below. Once the errors are drawn, a
frame after the call in a page without React, and in React a frame after the render that draws them
commits, even where the page set them after an await, as a page that saves to the browser's storage
first does, focus moves to an error summary where the page names one, else the first field in error
that can take focus, passing over one that is disabled, inert, marked off, itself or by its set, or
out of sight, or in a set its checked radio or its first control that can take focus, since the
set's fieldset takes none. A set counts once, however many of its choices are marked. One message is
said. Where focus moves to a summary, which reads its own words, nothing is said, and where the
summary already had focus, its words are said. Where focus moves to a field or was already on it,
that field's name and error are said, with how many fields need attention where more are wrong, or
its name and the count where it shows no error. VoiceOver on iOS reads a field's error only as a
hint, after a pause, which other speech cuts off and which a visitor who turns hints off never
hears, and focus moved by script may not land, so the error is always said. A screen reader that
reads the error as focus lands hears it twice, which slows a visitor less than an error never heard.
A reset that goes through calls off a refusal not yet landed, since it would say errors no longer
shown. A second refusal calls off one not yet landed, moves focus and speaks again, so a visitor who
submits again hears it again, and what each refusal returns calls off that refusal alone. Focus a
visitor moved after the refusal was asked for stays where they put it, and a page that refuses later
than it was asked passes `{ from }`, where focus was then, as `moveFocus` takes it. In React,
`refuse` is called in the submit handler, after an await in it too, or in an effect with
dependencies, never as the component renders nor in an effect that runs on every render, since
refusing renders the component again. Errors set in a transition are refused inside the same
`startTransition`, and errors drawn in another React root are not waited for. Refused with nothing
wrong and no summary, focus stays where it is, and refused with fields in error that none can take
focus in, as one out of sight, focus stays too and the first field's name and error are said, with
the count where more are wrong. In React, a form with no `StatusProvider` above it and no `say`
throws, since its refusal would reach no one. A form is attached as it is drawn, never from its
submit handler, since the kit's check and `noValidate` must already be in place when the first
submit comes.

`attachForm(form, { status, signal })` is taken down by its `signal`, as [Taking a control
down](#taking-a-control-down) has it. Its listeners come off, a refusal not yet landed and a reset
still waiting are called off, and the errors it drew go, so nothing is said after, not even "Form
cleared.", and a refusal the page calls after does nothing. The form keeps the kit's check, its
`noValidate` and the `aria-invalid="false"` marks while any attach in it is still attached, and gets
back its own `noValidate` and loses the marks once the last is taken down, so the browser checks it
again. A signal already aborted leaves the form as its markup drew it.

The browser's constraints decide what is valid, `required`, `type`, `pattern`, `min`, `max`,
`minlength`, `maxlength` and `step`, and the kit, never the browser's bubble, draws the errors, as
record 21 has it. An attached form takes `noValidate` from script, or the form around an attached
part of one, so a page without script still gets the browser's own check. On a submit the kit reads
the `validity` of each of the form's fields, the whole form even where a part of it is attached and
fields tied to it from outside by `form` among them, before the page's handler, passing over a field
marked off. Where any field fails it stops the submit, draws each failing field's error as the kit's
field draws one, after its hint and marked as the kit's set of choices marks one, and refuses. An
error the page already drew for the field takes the kit's words until the field passes, and a
stepper's range error is left as the one error. Where every field passes, the page's handler runs as
ever, for the checks the constraints cannot express, such as two fields that must match or a name
already taken, and it draws those errors and refuses itself, clearing its own errors as it checks
again. A button marked `formnovalidate` submits unchecked and clears the errors the kit drew. Errors
the kit drew go once their fields pass on a later checked submit, or the form is reset, unless the
page calls the reset off, and a reset that goes through where the kit drew errors says "Form
cleared." on the status line, since focus stays on the button and the errors go out of hearing.
Errors a page drew are its own to clear on a reset. A form's own attach checks it where a part of it
was attached first, so its options are the ones the check takes, and a refusal the page calls looks
only in the part it attached. Fields not in error are marked `aria-invalid="false"` as the form is
attached, so a browser does not read an empty required field as invalid before anything is
submitted.

`attachForm` draws into the markup it finds, so a page lets it draw errors only in markup nothing
will draw again, such as a page written by hand or the React components rendered to static HTML and
attached from plain script. A form React still draws refuses through `useFormRefusal`, whose
`invalid` hands the failures to the page to draw, since React writes a field's error, its id and the
control's `aria-describedby` and `aria-invalid` again whenever the field's props change, and would
find the kit's words and marks in what it holds as its own. `attachForm` drawing its own errors in a
form React still draws, as from an effect, is not supported.

Each way a field fails takes words that say what to do: "Enter a value." for an empty field, "Choose
an option." for an empty set or select and "Check the box to go on." for a box that stands alone,
"Enter an email address like name@example.com here." for a malformed address, "Enter the full web
address, with https:// at the start." for a malformed web address, "Enter at least 8 characters."
for one too short, "Enter 18 or more." for a number under its least, "Enter November 22, 2026 at
9:00 AM or later." for a date and time before its least, "Enter a whole number." for a fraction, and
the page's own words from `setCustomValidity`. A dated field's limit is the wall time written, with
no zone moving it, in the nearest `lang` around the field, past any shadow root it sits in, where
that language is English and in US English otherwise, since the words around it are English, with
"or later" or "or earlier" after it: a date as "November 22, 2026", a time as "9:00 AM", a date and
time joined by "at", a month as "November 2026" and a week as "the week of November 23, 2026", from
its Monday. A limit past any date a script can hold is shown as written, and a fraction of a second
is shown to the limit's own digits. A time whose limits both parse with its most before its least is
a window overnight, and a time in its gap takes "Enter a time between 10:00 PM and 6:00 AM the next
day." Safari and Firefox draw a month or week field as a text field, which has no limits to fail. A
field's own words for a failure come first, as `data-error-value-missing="Enter your name."` on the
control or on its set's fieldset, then the words a page gives the form as `errorWords`, as a page in
another language gives them, then the kit's. Each attribute is the failure's `validity` name in
kebab case after `data-error-`, such as `data-error-pattern-mismatch` or `data-error-too-short`. A
field with a `pattern` gives words of its own, since the kit cannot put a pattern in words, and
without them it asks for the format its hint shows. In React, `useFormRefusal` asks for `invalid`,
since the markup is the page's: the failures go to it, the page sets its errors from them, keyed by
each failure's `field`, which is a set's fieldset for a set, and the refusal follows once they are
drawn. `invalid` is called only for a submit that fails, so the page's own submit handler clears the
errors it set.

```js
import { attachForm } from '@jasonsdevspace/design-kit/controls';

const form = document.querySelector('#rule');
attachForm(form, { status: document.querySelector('.screen-status') });
form.addEventListener('submit', (event) => {
    // Only a submit whose fields pass the browser's constraints reaches the page.
    event.preventDefault();
});
```

```tsx
const [form] = useFormRefusal<HTMLFormElement>({
    errorWords: { valueMissing: 'Enter your name.' },
    invalid: (failures) => {
        setErrors(Object.fromEntries(failures.map(({ field, words }) => [field.id, words])));
    },
});
const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
};
// <form ref={form} onSubmit={submit}>
```

The kit checks only on a submit, never while someone is typing or as they leave a field, and checks
beyond the browser's constraints are the page's.

### Choice fields

<!-- example: choiceField -->

```html
<fieldset
    class="dk-field dk-choice-field"
    id="rule"
    role="radiogroup"
    aria-describedby="rule-hint rule-error"
    aria-invalid="true"
>
    <legend class="dk-field-label">What the rule does</legend>
    <p class="dk-field-hint" id="rule-hint">A rule applies to every search</p>
    <p class="dk-field-error" id="rule-error">
        <span class="dk-visually-hidden">Error: </span>
        Choose what the rule does
    </p>
    <div class="dk-choices">
        <label class="dk-choice">
            <input type="radio" aria-describedby="rule-error" name="rule" value="pin" />
            <span>
                Pin
                <span class="dk-choice-hint"> to the top of the results</span>
            </span>
        </label>
        <label class="dk-choice">
            <input type="radio" aria-describedby="rule-error" name="rule" value="hide" />
            <span>Hide</span>
        </label>
    </div>
</fieldset>
<fieldset class="dk-field dk-choice-field" id="facets">
    <legend class="dk-field-label">Show</legend>
    <div class="dk-choices dk-choices-row">
        <label class="dk-choice">
            <input type="checkbox" name="facets" checked="" value="brand" />
            <span>Brand</span>
        </label>
        <label class="dk-choice">
            <input type="checkbox" name="facets" value="price" />
            <span>Price</span>
        </label>
    </div>
</fieldset>
```

A set of radios or checkboxes is a `fieldset` with the field's class and `.dk-choice-field`, whose
legend is the field's label, then the hint and the error as a field has them, then the choices in
`.dk-choices`, one under the other, or `.dk-choices-row` for a row that wraps. Each choice is a
`label.dk-choice` holding a native radio or checkbox and its word, with a gloss in `.dk-choice-hint`
after the word, inside its span, which is read as part of the choice's name. The hint and the error
describe the set, through `aria-describedby` on the fieldset. A set of radios carries
`role="radiogroup"`, and `aria-invalid="true"` on the fieldset while an error is drawn, since the
keyboard enters a radio group at the chosen radio, wherever that is, and a radio takes no invalid
state of its own. Each radio is described by the error as well, since a screen reader that lands on
a radio may read nothing of its group. Checkboxes are each a stop of their own, so each carries
`aria-invalid="true"` instead. The arrow keys move and check among radios, as the browser has them,
and a choice a visitor cannot make uses `disabled` on its control.

<details>
<summary>How a choice is drawn</summary>

A choice is the field's height, and a thumb's target on a phone and at every width in an app's frame
and on a page that ends in a tab bar, and takes the highlight under a pointer and after the
keyboard, as the ring does, so the whole word reads as one target with the ring on the control
itself, and a tap leaves no choice lit once it is done. The highlight reaches past the control by
the choice's own padding, so the control stays in line with the legend, into the room around the
field, which a container that clips must leave. A gloss is in the muted text at the caption size,
and a choice whose control is disabled is in the muted text with no highlight. Every control of an
invalid set draws a thin line in the danger color around it, and a dashed line in `CanvasText` in
forced colors, each giving way to the ring. The theme switch's choice is the same label of a radio
and its word, drawn by rules of its own as a pill word with the radio under it, as the Theme switch
section says.

</details>

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

A plain `dk-callout` is for information, the `'info'` tone, and sits on the highlight. Add
`dk-callout-success`, `dk-callout-warning` or `dk-callout-danger` for something that went right,
that needs care before it goes wrong, such as stock running low, or that went wrong, and it sits on
that color's own ground. The words stay in the page's text color in every tone. A success, warning
or danger callout starts its title, or its message when it has no title, with a visually hidden
"Success: ", "Warning: " or "Error: ", so the tone is not told by color alone. The title is a
paragraph, or a heading from `h2` to `h6` where the callout is a section a visitor would jump to,
and opens `.dk-callout-body`, the message. The actions, when there are some, follow the message,
outside it.

A callout has no role unless the page gives it one, whatever its tone, so a message on the page when
it loads is read in its place rather than over the page's title, as [decision
0007](https://github.com/jasonsdevspace/design-kit/blob/main/docs/decisions/0007-a-callout-takes-a-role-only-when-asked.md)
explains. A message that arrives after the page has loaded is made live in three steps.

1. Put the callout on the page with `role="status"` on `.dk-callout-body`, read when the screen
   reader is next idle, or `role="alert"`, read at once. The title and the tone's word are read with
   the message, and the actions are not.
2. Leave the message empty at first, and mark the callout `data-empty`, as `Callout` does for a
   live callout with no title, message or actions. A marked callout leaves the flow, drawn as
   visually hidden text is, so it takes no room and opens no gap, the flow's step and the room kept
   for a toast pass over it, and it stays in the tree a screen reader reads. The mark needs no
   `:has()`, so the oldest browsers the kit supports draw no empty box. A callout with an empty
   message and no actions is also taken out of sight where `:has()` works, so one written without
   the mark is never drawn empty in a current browser.
3. Fill the message when there is something to say, which is when a screen reader reads it, and take
   the mark away, as a page does when it gives the callout actions. A page that empties the message
   again, with no actions, marks it again. For success, warning or danger, put the hidden word in
   with it, as `<span class="dk-visually-hidden">Success: </span>Saved.`

#### A failure with Try again

A failure that loading or saving meets is a live callout of the danger tone, mounted empty with
`role="alert"` and filled with what happened and a way forward. Try again goes in the actions, so
the alert reads the failure and never the button's words, and is named Try again unless the page
words it otherwise.

<!-- example: tryAgain -->

```html
<div data-empty="" class="dk-callout dk-callout-danger">
    <div class="dk-callout-body" role="alert"></div>
</div>
```

Try again empties the callout and puts the part's `.dk-loading` line back while the load runs
again, with the callout outside the part's `aria-busy`, so a screen reader holds back nothing the
callout says. A failure is put in a moment after the callout empties, so one that comes back at once
is still a change a screen reader hears, and the same failure is read a second time. Emptying the
callout takes away Try again, the control that had focus, so `useFocusAfterDraw` sends focus to what
is loading again, the part's heading, which takes it by its tabindex of -1. A failure moves no
focus, since the alert reads it, and focus moved as an alert is read would cut it short or read it
twice. The next Tab from the heading reaches Try again.

<!-- source: products -->

```tsx
import { type ReactNode, useEffect, useId, useState } from 'react';

import { Button, Callout, useFocusAfterDraw } from '@jasonsdevspace/design-kit/react';

/**
 * How long a failure waits after the callout empties, so a failure that comes back at once is
 * still a change a screen reader hears.
 */
const SETTLE = 100;

type Loading = 'loading' | 'failed' | 'loaded';

/**
 * A part of the page that loads its products, says so when the load fails and offers Try again.
 * `load` is the same across renders, as a module's own function is, since the first load runs
 * again when it changes.
 */
export const Products = ({
    load,
    children,
}: {
    readonly load: () => Promise<void>;
    readonly children: ReactNode;
}) => {
    const [state, setState] = useState<Loading>('loading');
    const heading = useId();
    const focusNext = useFocusAfterDraw();
    const start = () => {
        setState('loading');
        load().then(
            () => {
                setState('loaded');
            },
            () => {
                window.setTimeout(() => {
                    setState('failed');
                }, SETTLE);
            }
        );
    };
    // The first load, whose failure is read where it is and moves no focus.
    useEffect(start, [load]);
    const tryAgain = () => {
        start();
        // Try again goes with the failure, so focus goes to what is loading again.
        focusNext(heading);
    };
    const failed = state === 'failed';
    return (
        <section aria-labelledby={heading}>
            <h2 id={heading} tabIndex={-1}>
                Products
            </h2>
            <Callout
                tone="danger"
                live="alert"
                title={failed ? 'The products could not be loaded' : undefined}
                actions={failed ? <Button onClick={tryAgain}>Try again</Button> : undefined}
            >
                {failed ? <p>Check your connection.</p> : null}
            </Callout>
            <div aria-busy={state === 'loading'}>
                {state === 'loading' ? <p className="dk-loading">Loading the products.</p> : null}
                {state === 'loaded' ? children : null}
            </div>
        </section>
    );
};
```

A callout's edge is transparent, and shows only in forced colors and on paper, where the ground is
dropped and the edge marks where the callout starts and ends.

### Pills

<!-- example: pills -->

```html
<ul class="dk-pills" role="list">
    <li class="dk-pill">TypeScript</li>
    <li class="dk-pill">React</li>
</ul>
<nav aria-label="Pages">
    <ul class="dk-pills" role="list">
        <li><a class="dk-pill" href="./" aria-current="page">Home</a></li>
        <li><a class="dk-pill" href="./tokens/">Tokens</a></li>
    </ul>
</nav>
```

A pill is a chip that names something, or a link among others in a row, both `.dk-pill` in a
`.dk-pills` list. A chip has a faint edge in the line color and no states, so it never reads as a
control, and it is no target. A link has no edge and steps back in the muted text as the strip's
links do, and the one that is the current page carries `aria-current` and stands on the highlight at
the heading's weight, which forced colors keep. A link pill is the field height, and a thumb's on a
phone. The list keeps room for the focus ring at its sides, its text still on the column's line, and
no margin above or below, so a container's step stands it from what is around it. It keeps
`role="list"`, since WebKit with VoiceOver drops a list's meaning when its markers are gone. A row
that switches what one part of a page shows, or pages or toggles underlined where chosen, is tabs,
below.

### Tabs

<!-- example: tabs -->

```html
<div class="dk-tabs" role="tablist" aria-label="Code">
    <button
        type="button"
        class="dk-tab"
        role="tab"
        id="markup-tab"
        aria-selected="true"
        aria-controls="markup"
    >
        Markup
    </button>
    <button
        type="button"
        class="dk-tab"
        role="tab"
        id="react-tab"
        aria-selected="false"
        aria-controls="react"
        tabindex="-1"
    >
        React
    </button>
</div>
<div id="markup" role="tabpanel" aria-labelledby="markup-tab">…</div>
<div id="react" role="tabpanel" aria-labelledby="react-tab" hidden="">…</div>
<nav aria-label="Categories">
    <ul class="dk-tabs" role="list">
        <li><a class="dk-tab" href="./" aria-current="page">All</a></li>
        <li><a class="dk-tab" href="./books/">Books</a></li>
    </ul>
</nav>
<div class="dk-tabs">
    <button type="button" class="dk-tab" aria-pressed="true">Open</button>
    <button type="button" class="dk-tab" aria-pressed="false">Go</button>
</div>
```

Tabs are a row of muted words with the chosen one in the page's text over an accent line, each
`.dk-tab` in a `.dk-tabs` row over a rule. Each tab draws the rule along its own foot and stands on
the row's, so a row too wide for its place wraps onto more lines with every tab on a line, the
chosen one's line over it. The classes draw the row, with no React component, since the chosen tab
and its panel belong to the page. The keys come from `attachRoving`, below. The chosen tab carries
the attribute a screen reader already reads for its control: `aria-selected="true"` on a tab,
`aria-current` on a link among pages, or `aria-pressed="true"` on a toggle, each drawn alike. It
keeps the resting weight, so no tab moves as the choice does. In forced colors the chosen tab stands
in the system's selection colors, as the current pill does, and a resting tab keeps its line. A tab
is the strip's height, and a thumb wide and tall on a phone, and its first word sits in from the
rule's end by its padding, as a pill's does. A row of links keeps `role="list"`, as the pills do,
and each link fills its item down to the rule.

A row with `role="tablist"` takes the tabs pattern's keys from `attachRoving(row, { onMove })` in
`./controls`, or `useRoving()` in React: one tab in the tab order, the chosen one, and the left and
right arrows, Home and End moving focus along the row, wrapping from one end to the other, with up
and down left alone. A tab marked off is reached, to hear why, but never handed to `onMove`. The kit
moves focus and the page chooses, as it owns the panels: a page that chooses a tab as focus reaches
it does so in `onMove`, and one whose panel is slow to draw leaves the choice to Enter or Space.
`aria-controls` names each tab's panel. The base sheet keeps the focus ring on a tab given a
tabindex of -1, so the ring follows the arrow keys. A row attached while it is drawn at no size, in
a closed `details`, under `hidden` or `display: none`, or in a dialog not yet open, places its stop
as it comes into sight, so a page can attach it as the page loads. A row under `inert`, or hidden in
a way that keeps its size, places its stop as its cells next change or are reached.

```js
import { attachRoving } from '@jasonsdevspace/design-kit/controls';

attachRoving(document.querySelector('[role="tablist"]'), {
    onMove: (tab) => choose(tab),
});
```

#### A tab row on its container's rule

```html
<header class="masthead">
    <h1>Shelf</h1>
    <nav aria-label="Categories">
        <ul class="dk-tabs dk-tabs-on-rule" role="list">
            <li><a class="dk-tab" href="./" aria-current="page">All</a></li>
            <li><a class="dk-tab" href="./books/">Books</a></li>
        </ul>
    </nav>
</header>
```

Where the row sits at the foot of a container that draws a rule of its own, such as a masthead,
`dk-tabs-on-rule` beside `dk-tabs` draws no rule and stands a pixel lower, so the chosen tab's line
lies over the container's rule and the resting tabs' edges lie on it, rather than two rules
stacking. The container draws its rule as a border of the kit's 1px line and keeps no padding at its
foot, so the row reaches its rule, and the row keeps to that foot in a bar that centers what it
holds. It suits a container whose rule sits right under the row, so a bar where something can wrap
under the row, such as a copy button beside it on a phone, gives the row the room it has left and
lets the row draw its own rule instead. In forced colors the row draws no rule of its own there
either, and the chosen tab's mark reaches the container's.

### Icons

<!-- example: icon -->

```html
<div class="dk-actions">
    <button type="button" class="dk-button">
        <svg class="dk-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14"></path>
        </svg>
        Add a player
    </button>
    <button type="button" class="dk-button dk-button-icon" aria-pressed="false">
        <svg class="dk-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
            <path
                fill="currentColor"
                d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"
            ></path>
        </svg>
        <span class="dk-visually-hidden">Favorite game</span>
    </button>
</div>
```

An icon is an inline `svg` with `dk-icon`, one em square so it grows with the text around it, at
twice the text size too. The sheet strokes it in the text's color, at `max(1.5px, 0.125em)` with
round caps and joins and no fill, and keeps that width whatever the drawing's scale, so a path drawn
in a 24 unit box holds its weight at a small size. Forced colors redraw it with the text, in the
system's text or link color. A mark drawn in fill, such as a brand's, writes `fill="currentColor"`
on its path, so it takes the text's color too, and the sheet leaves it with no outline. The sheet
reaches only paths written inside the icon, so a page draws them there rather than through a `use`
of a sprite, whose paths keep a stroke that scales. The kit ships no icons, so a page draws the few
it needs in a helper of its own. A button whose face is an icon alone, such as the star above, adds
`dk-button-icon`, which draws its icon at 1.25rem rather than at the button's small text, so it
reads in a square the target wide and still grows with the text. A tab bar's icons are drawn at
1.5rem. Both are sized by `--dk-icon-size` and stroked at two in twenty four of it,
`max(1.5px, var(--dk-icon-size) / 12)`, so an icon weighs no more than the words beside it.

An icon says nothing to a screen reader. The markup carries `aria-hidden="true"`, which a sheet
cannot set, and `focusable="false"`, and every icon sits beside words, in sight or out of it, so an
icon is never a control's only name. A toggle whose face is an icon alone names itself in a
`dk-visually-hidden` span, as the star above does. An svg `title` is left out, since a screen reader
would say it beside the control's own name.

### Eyebrows

<!-- example: eyebrow -->

```html
<p class="dk-eyebrow">Signed in as a guest</p>
<h2>Your basket</h2>
```

An eyebrow is a small label in caps over a heading or a group, such as a hero's theme or a list's
name, in the muted text at the caption size and the heading's weight, tracked by
`--dk-tracking-caps` so the caps read at that size. It is text, not a heading, so it adds nothing to
the page's outline, and it has no margin of its own, so in the explainer, a panel, an app's body or
a dialog it stands one of the container's steps from what is above it, and `--dk-space-1` from a
heading after it, since it names that heading.

### React components

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
            <div className="dk-actions">
                <Button pressed={gift} onClick={() => setGift(!gift)}>
                    Gift wrap
                </Button>
                <Button type="submit" accent>
                    Place order
                </Button>
            </div>
            <Callout tone="success" live="status">
                {saved}
            </Callout>
        </form>
    );
};
```

Every optional prop of every component takes `undefined` as if it were left out, so a wrapper that
passes on a prop it might not have been given compiles under `exactOptionalPropertyTypes` too.

**`Button` props**

| `Button`  | Default    | What it does                                                                                                                                  |
| --------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `accent`  | `false`    | Adds `dk-button-accent`. TypeScript refuses it with `pressed` or `text`                                                                       |
| `large`   | `false`    | Adds `dk-button-large`. TypeScript refuses it with `text`                                                                                     |
| `tall`    | `false`    | Adds `dk-button-tall`. TypeScript refuses it with `text`                                                                                      |
| `icon`    | `false`    | Adds `dk-button-icon`, for a face that is an icon alone. TypeScript refuses it with `text`                                                    |
| `text`    | `false`    | Adds `dk-button-text`. TypeScript refuses it with `accent`, `pressed`, `large`, `tall` or `icon`                                              |
| `quiet`   | `false`    | Adds `dk-button-quiet`, and with no children draws a hidden × beside Close out of sight. TypeScript asks for `text` with it and refuses `off` |
| `pressed` | none       | Writes `aria-pressed`, even when `false`. Leave it out for an action                                                                          |
| `off`     | `false`    | Writes `aria-disabled="true"`, and a click runs no `onClick`                                                                                  |
| `busy`    | `false`    | Writes `aria-disabled="true"` and `data-busy`, its value the words to say where it is a string, and a click runs no `onClick`                 |
| `type`    | `'button'` | The button's type                                                                                                                             |

Every other prop goes to the `<button>`, `ref` and `className` included, except `style`, `disabled`,
`aria-disabled` and `aria-pressed`. A click on an off button calls `preventDefault()`, so a submit
button does not submit. Other handlers, for keys or a pointer, still run, so they must check `off`
themselves.

**`InputField`, `SelectField` and `TextareaField` props**

| `InputField`, `SelectField`, `TextareaField` | Default         | What it does                                                                                               |
| -------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------- |
| `label`                                      | required        | Names the control                                                                                          |
| `hint`                                       | none            | Drawn when it holds something, and read as a description                                                   |
| `error`                                      | none            | Drawn when it holds something, and marks the control invalid                                               |
| `id`                                         | from `useId`    | The control's id. Set it when something else links to the field                                            |
| `action`                                     | none            | Drawn after the control in a `dk-field-action` row, on `InputField` and `SelectField`                      |
| `mark`                                       | none            | `'required'` or `'optional'`, drawn in words in the label, apart from the native `required`                |
| `markWords`                                  | the kit's words | The mark's words in place of the kit's, as in another language                                             |
| `readOnly`                                   | `false`         | On `SelectField`, draws a read-only field with the chosen option's words and a hidden field for each value |

Every other prop goes to the control, `ref` and `className` included, except `style`, `aria-invalid`
and `action`, which the field draws beside the control. A select field's children are its options,
and a textarea field's text is its `defaultValue` or `value`, never children, with three rows unless
given `rows`. An `aria-describedby` of the page's own is listed after the hint and the error.

**`ChoiceField` props**

| `ChoiceField`         | Default      | What it does                                                                                    |
| --------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `label`               | required     | Names the set, as its legend                                                                    |
| `name`                | required     | The controls' name, shared by every choice                                                      |
| `choices`             | required     | Each a `value`, a `label`, a `hint` and the control's own props                                 |
| `type`                | `'radio'`    | `'checkbox'` where any number of choices can be on                                              |
| `row`                 | `false`      | Draws the choices in a row that wraps                                                           |
| `hint`, `error`, `id` | as a field's | The hint and the error describe the set, and the id is the fieldset's                           |
| `mark`, `markWords`   | as a field's | The mark in the legend, kept in its name since not every screen reader says a group is required |

Every other prop goes to the `<fieldset>`, `ref` and `className` included, except `style` and
`aria-invalid`. A choice's own props go to its control, `ref` among them, except `style`,
`className` and `aria-invalid`, and `type` and `name`, which the set gives. Its `value` tells the
choices apart.

**`Callout` props**

| `Callout`      | Default         | What it does                                                                         |
| -------------- | --------------- | ------------------------------------------------------------------------------------ |
| `tone`         | `'info'`        | `'success'`, `'warning'` or `'danger'` for what went right, needs care or went wrong |
| `title`        | none            | Drawn at the start of the message                                                    |
| `headingLevel` | none            | 2 to 6 draws the title as that heading                                               |
| `live`         | none            | `'status'` or `'alert'`, the role the message takes                                  |
| `prefix`       | the tone's word | The word read first. An empty string drops it                                        |
| `actions`      | none            | Drawn after the message, outside it                                                  |

A live callout's message is drawn even when it is empty, so the page can fill it later, and the
callout marks itself `data-empty` until it has words or actions. Every other prop goes to the
callout's `<div>`, `id`, `ref` and `className` included, except `style`, `role`, the `title`
attribute, `dangerouslySetInnerHTML` and the live attributes, since the message takes its role from
`live` alone.

**Hooks**

Where `./react` gives a hook for a control, it attaches that control's function from `./controls` to
the element its ref lands on, and returns what the function returns, the same across renders, as
[decision
0020](https://github.com/jasonsdevspace/design-kit/blob/main/docs/decisions/0020-react-hooks-wrap-the-attach-functions.md)
has it. It sets its options again only when one changes. Its ref makes an `AbortController` as the
element arrives, hands the function its `signal`, and returns the cleanup that aborts it, which
React 19 calls as the element leaves, so the hook's part is taken down at once and the control comes
down as [taking a control down](#taking-a-control-down) has it, a form's check included, a microtask
after the last signal holding it aborts. React calls a ref's cleanup and the next ref in one commit,
so a ref made afresh on every render, as an arrow that returns what the hook's ref returns, such as
`ref={(el) => form(el)}`, or a helper that merges refs and passes the cleanup on, keeps its control,
and so does an element passed from one hook's ref to another's, as `ref={editing ? edit : add}` on
one form, which then runs on the hook it went to. Two hooks on one element, through a ref that
merges both, each hold its control, so dropping one leaves the other working on its own options. The
hook keeps every element its ref is on, so one ref on several elements keeps those left working as
one goes, and a form refuses a failed submit through itself. A ref called with null, as a helper
written to merge refs before React 19 calls it, dropping the cleanup, lets every element go in the
same way. Under `StrictMode` in development, React runs the cleanup and the ref again as the page
first draws, and the control stays attached as it was, with nothing doubled or dropped, so words a
part says on `StatusProvider`'s line in a first effect are kept through that second run, and the
function `useStatus` returns keeps speaking. A page without React calls the same function on the
same markup and gets the same behavior.

## Taking a control down

The theme switch, the copy button, the status line, the toast, a form's check, a panel's button, the
stepper, a table's frame, a group the arrow keys move through, a busy button, progress and the
dialog take an `AbortSignal` as `signal` in their options, as `addEventListener` does. `moveFocus`
takes one too, which calls off a request not yet landed, as the function `moveFocus` returns does,
and the rest of this section covers the attaches. The status line, the toast, a form's check and the
dialog return what says, shows, refuses or opens rather than what takes them down, so the signal
alone takes them down: the line is let go, the toast's message is dismissed as its Close dismisses
it, and an open dialog closes with focus handed back to what opened it, and what each returned does
nothing after. The others return a function that takes them down. Once a control is taken down,
nothing it started acts, such as a copy the clipboard answers late, and calling that function or
aborting a signal again does nothing. A signal already aborted does nothing: the control stays as
the markup drew it, a control already attached keeps the options it had, and what the attach returns
does nothing.

Each signal an attach of an element is given holds that element's control, and a control attached
again returns what its first attach returned, as [decision
0022](https://github.com/jasonsdevspace/design-kit/blob/main/docs/decisions/0022-every-attach-takes-a-signal-that-takes-its-piece-down.md)
and [decision
0023](https://github.com/jasonsdevspace/design-kit/blob/main/docs/decisions/0023-a-control-outlives-a-takedown-and-an-attach-in-one-task.md)
set out. Once every signal holding a control has aborted, the control is taken down a microtask
later, unless the same element is attached again by then, which keeps the control as it was, with
its state, such as a busy wait, a form's check and its errors, an open dialog or a shown toast. So a
page that aborts and attaches the same element in one task keeps its control, and one that attaches
after a microtask starts afresh. Until the takedown lands, the control is whole, so a call in the
abort's own task, such as a panel's `set`, still acts, and a dialog left open keeps the page behind
it inert. The function an attach returns takes the control down at once, whoever holds it, so a page
that means to start afresh within the task calls it. A call with no signal holds the control for the
page's life where nothing else holds it, an attach in the abort's own task among them, is filed
under that hold where the page already holds the control without a signal, and elsewhere speaks for
the newest holder without holding. An attach made from inside a control's own takedown, as a
dialog's close handler that attaches it again, gets a control of its own. A page that passes a fresh
signal it never aborts on every call keeps each one as a holder, so it aborts what it no longer
needs. The kit hands focus back as a toast, a dialog, a panel or a stepper is taken down. A toast, a
dialog or a panel hands it back only where focus is in it, inside a shadow tree within it too, such
as on a page's own button component in a toast or a dialog's form, or where focus is on the body or
nowhere and the piece had it as it left, and a dialog also where focus is still on what the browser
handed it to as the dialog closed. A stepper hands it back only where focus is on one of the buttons
it hides. Either way, focus a page sets in the abort's own task stays, and a `moveFocus` asked in
that task still lands. A control slotted into a piece drawn inside a shadow root counts as in the
piece. Each place a piece hands focus back to can be any HTML or SVG element that takes focus, such
as a link in an inline chart, and one that is hidden, inert or disabled is passed over for the next.
A control marked off with `aria-disabled` still takes focus, so it is passed over only where a piece
checks for it, as a panel does for its buttons. The toast and the dialog hand focus to it, though a
toast does not follow a frame on to a control marked off inside it.

As the kit hands focus back, it tries each place in turn and counts one as taken where focus moves
onto it or inside it, in a shadow tree it holds or on a control slotted into it too, as a host that
delegates focus hands it on, or where it has focus already. One that refuses focus is passed over
though focus is inside it, as a section with no tabindex is. Where a page's own listener moves focus
elsewhere as one is tried, it goes no further and that focus stays. A walk that focuses nothing is
not taken for a handback, so a `moveFocus` asked before it leaves alone what the page focused. A
dialog lists what the browser handed focus to as it closed last, so where its opener has gone and
nothing else takes focus, a `moveFocus` asked in the task that closed it still lands.

A control runs on its newest holder's options. A new holder's options apply at once. A later call
from the newest holder, or from the holder whose options apply, replaces them, and a call from an
older holder is kept and applies once every newer holder that gave options has let go. When the
holder whose options apply lets go, the newest one left that gave options takes over with them a
microtask later, unless a newer holder has given its own by then. A call with no signal applies its
options at once, and they stay with the page where the page holds the control without a signal, and
elsewhere leave with the newest holder they are filed under. Options count as given only where a key
other than `signal` has a value, `null` and `false` among values, so `{}`, `{ signal }` and options
whose every other key is `undefined` count as none, and a call that gives none keeps its holder's
last ones. Options that count as given replace the holder's last ones whole, so a key left out goes
back to its default, and a page puts every default back by giving one option the value it has by
default, as `{ stay: false }` for a dialog, which puts back its `returnTo` too. Where no holder left
gave options, the control goes back to its defaults, as a first attach that gave none has them,
though a copy button keeps the source and status line it has.

A page that draws its screens itself gives each screen's controls one controller, and aborts the old
screen's as it attaches the next, so a control the next screen draws afresh is attached afresh and
the old one comes down, while one it keeps on the page is kept, its state with it. Until it is
aborted, a signal keeps what its controls hold alive, so a page hands over one that lives no longer
than the controls. A control that stays for the page's whole life, such as the switch in the strip,
is attached once with no signal.

```js
import { attachCopyButton, attachThemeSwitch } from '@jasonsdevspace/design-kit/controls';

attachThemeSwitch(document.querySelector('.dk-theme-switch'));

let screen = new AbortController();
const showScreen = () => {
    screen.abort();
    screen = new AbortController();
    // Draw the screen, then attach its controls.
    attachCopyButton(document.querySelector('.dk-copy'), {
        source: () => document.querySelector('#install-command'),
        status: document.querySelector('[role="status"]'),
        signal: screen.signal,
    });
};
```

## Theme switch and copy button

Two of the kit's controls that do something in the browser: a switch for the theme a visitor saves,
and a button that copies a block's text. Each is markup the components draw, or a page writes by
hand, and a function from `@jasonsdevspace/design-kit/controls` that a page calls on it, which
returns a function that takes it down again. The markup is hidden until it is attached, so a visitor
without script meets no control that does nothing, and the functions set no style, so a page's
policy can refuse every style it did not serve. Nothing runs when the module is imported but
listeners on the document for keys, clicks and submits, which note the visitor's last press for
`focusOnArrival`.

### Theme switch

<!-- example: themeSwitch -->

```html
<div class="dk-theme-switch" hidden="">
    <span class="dk-theme-switch-name" id="theme-name">Theme</span>
    <button
        type="button"
        class="dk-theme-switch-button"
        id="theme-button"
        aria-labelledby="theme-name theme-button"
        aria-expanded="false"
        aria-controls="theme-choices"
    >
        System
    </button>
    <div
        class="dk-theme-switch-choices"
        id="theme-choices"
        role="radiogroup"
        aria-labelledby="theme-name"
        aria-describedby="theme-note"
    >
        <label class="dk-theme-switch-choice">
            <input type="radio" name="theme" value="system" />
            <span>System</span>
        </label>
        <label class="dk-theme-switch-choice">
            <input type="radio" name="theme" value="light" />
            <span>Light</span>
        </label>
        <label class="dk-theme-switch-choice">
            <input type="radio" name="theme" value="dark" />
            <span>Dark</span>
        </label>
    </div>
    <span class="dk-visually-hidden" id="theme-note">
        Your choice is saved for every page of this site.
    </span>
</div>
<noscript>
    <p class="dk-theme-switch-noscript">With scripts on, a Theme switch sits here.</p>
</noscript>
```

The switch is its name, Theme, a button for the collapsed form, and a group named Theme of three
native radios, System, Light and Dark, described by a note that the choice is saved for every page
of the site, which a page can word for itself. `attachThemeSwitch(element)` takes the switch, or an
element that holds it, checks the choice the page draws, shows the switch, and saves and draws a
choice under the theme contract's key, `system` following the system's scheme. It follows a choice
saved in another tab and a page restored by Back, and where the browser refuses storage it holds the
choice for as long as the page is open. The chosen word is drawn as a pressed button is, with an
edge twice as thick in the accent. The choices keep one row wherever it fits, and wrap onto as many
as they need where the switch's column is narrower, as at a large text size on a phone, so every
choice stays in sight. In a demo's strip and footer, an explainer and its header, a panel, a
callout, an app's bar and body or a dialog, the switch reaches past the column by the room it keeps
for its ring, so its name starts on the column's line. At a page's bare edge it stays inside, so
nothing scrolls sideways.

In a demo's strip on a screen narrower than 20rem, which is a phone with the browser's text set
larger, three choices at a thumb's target no longer fit the row, so the sheet collapses the switch
to its name and the button. The button names the current choice, is drawn as the chosen word is, and
is heard as the switch's name and the choice, "Theme System". It is in every switch's markup and
shown by the sheet alone, so the markup is one whatever the width, and the strip's room of one row
holds the switch either way. Pressed, the button opens the group under itself, over the page, one
choice to a row at a thumb's target and focus on the chosen one, so the arrow keys move the choice
without closing it. A choice picked by a pointer closes the group with focus back on the button, as
Escape does, and a tap outside or focus leaving the switch closes it where it is, while a swipe
beside it leaves it open so a touch can scroll to choices below the screen's edge. At 20rem and
wider, and outside a strip at any width, the button stays hidden and the choices keep their row,
wrapping as they do outside a strip where the column is narrower.

`attachThemeSwitch(element, { signal })` attaches a switch once however often it is called before it
is taken down, and taking it down, by the function it returns or by its `signal`, as [Taking a
control down](#taking-a-control-down) has it, hides it again. A switch attached after every switch
was taken down shows, and draws, the choice saved meanwhile, or the one the page holds where the
browser would not save it. Every switch on a page shows one choice, each with radios named for its
own id. After the switch the component draws a line inside `noscript`, "With scripts on, a Theme
switch sits here.", which only a visitor without script sees, and which a page words for itself or
turns off with an empty `noscript`. A page that writes the switch by hand adds the line as it likes.

```tsx
import { attachThemeSwitch } from '@jasonsdevspace/design-kit/controls';
import { ThemeSwitch } from '@jasonsdevspace/design-kit/react';
import { useEffect, useRef } from 'react';

export const Settings = () => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => (ref.current ? attachThemeSwitch(ref.current) : undefined), []);
    return (
        <div ref={ref}>
            <ThemeSwitch />
        </div>
    );
};
```

In a demo's strip it goes in `tools`, with `toolsLabel="Settings"`, so its landmark is not named
Theme as its group is. A page that writes the switch by hand writes the button and the group around
the radios as the markup above has them, since the attach function wires the button it finds.
`chooseTheme(choice)` saves and draws a choice from anywhere else on the page, and every switch on
the page shows it. It listens as a switch does, so on a page with no switch a choice saved in
another tab is followed, and one the browser will not save is held on the page. A value that is
not `light`, `dark` or `system` is ignored.

**`ThemeSwitch` props**

| `ThemeSwitch` | Default                     | What it does                                                              |
| ------------- | --------------------------- | ------------------------------------------------------------------------- |
| `id`          | from `useId`                | What the name's and note's ids start with                                 |
| `name`        | the id                      | The radios' name, unique on a page                                        |
| `note`        | where the choice is saved   | What the group is described by                                            |
| `noscript`    | a sentence about the switch | The line a visitor without script reads after the group. Empty draws none |
| `className`   | none                        | A page's class, after the kit's                                           |
| `ref`         | none                        | The switch drawn                                                          |

### Copy button

<!-- example: copyButton -->

```html
<button type="button" class="dk-button dk-copy" hidden="">
    <span class="dk-copy-words">
        <span>Copy</span>
        <span aria-hidden="true">Copied</span>
        <span aria-hidden="true">Selected</span>
    </span>
    <span class="dk-visually-hidden"> install command</span>
</button>
<p class="dk-visually-hidden" role="status"></p>
```

`attachCopyButton(button, { source, status, signal })` copies the text of the element `source()`
returns when the button is pressed, read at each press, so a button beside tabs copies the block its
tab shows. Where the browser refuses the clipboard, it selects that text instead. The button says
Copied or Selected for a moment, its three words sharing one cell so it keeps its width, and the
status line says which to a screen reader, with how to copy a selection with the keys or the
device's own command. One status line serves every button on a page, and it is on the page from the
start, since a line added at the moment it speaks may go unheard. Attaching a button again takes its
new `source` and `status`, by the rule for whose options apply that the section linked below sets
out, so a page that draws it again with a new source copies from that one, puts a word shown for the
last source back to Copy where the new source gives another element, and returns the function it
returned the first time. Taking a button down, by that function or by its `signal`, as [Taking a
control down](#taking-a-control-down) has it, hides it and puts it back to Copy.

**`CopyButton` props**

| `CopyButton` | Default  | What it does                    |
| ------------ | -------- | ------------------------------- |
| `name`       | required | What it copies, read after Copy |
| `className`  | none     | A page's class, after the kit's |
| `ref`        | none     | The button drawn                |

`CopyStatus` takes `className` and `ref` the same way, its ref the line drawn, for a page that hands
it to a copy button's attach function.

#### A copy button for a code block

<!-- example: codeHead -->

```html
<div class="dk-code-head">
    <p class="dk-code-title" id="install-title">Install the kit</p>
    <button type="button" class="dk-button dk-copy" hidden="">
        <span class="dk-copy-words">
            <span>Copy</span>
            <span aria-hidden="true">Copied</span>
            <span aria-hidden="true">Selected</span>
        </span>
        <span class="dk-visually-hidden"> install command</span>
    </button>
</div>
<pre
    class="dk-code"
    role="region"
    aria-labelledby="install-title"
    tabindex="0"
    translate="no"
><code>npm install @jasonsdevspace/design-kit</code></pre>
```

A code block's copy button sits in a `dk-code-head` with the block's title, at the end of the
title's line, and wraps under the title where the line has no room. The block follows the head as
it follows a title on its own. The button is hidden until it is attached, so without script the
head shows the title alone, as an explainer's block does.

## Status, focus, waits and progress

The pieces that speak on a screen's status line, a refused form, a busy button, progress and a
stepper given one, take turns on it, so what a visitor must hear is said once and in turn. Focus
moves after a change to where a visitor carries on, and to a view's heading on an arrival a press
brought. A wait shows as a busy button, a loading line or progress, by what is known of it. A busy
button is under [Buttons](#buttons), a failure with Try again under [Callouts](#callouts), and an
empty state under [Rows](#rows).

### Status line

<!-- example: statusLine -->

```html
<p class="dk-visually-hidden screen-status" role="status"></p>
```

A status line is what a screen reader hears a message on without focus moving, such as a seat's new
place in a list, a name saved or a copy button's result. It is out of sight, and it is on the page
from the start, prerendered with the screen, since a line added at the moment it speaks may go
unheard. One is enough for a screen, with one more inside a dialog that speaks.

```js
import { attachStatus } from '@jasonsdevspace/design-kit/controls';

const line = document.querySelector('.screen-status');
if (line) {
    const say = attachStatus(line);
    say('Ann moves to seat 2.');
}
```

`attachStatus(line)` returns the function that says a message on the line. It empties the line and
puts the message in a tenth of a second later, so the same words said twice are heard twice, and
empties the line again two seconds after, so a visitor reading line by line finds no old words. A
message said over another replaces it, so only the last of a quick run is heard. It speaks as the
copy button does, through the same function, so a line a page hands to both keeps one timer.
`attachStatus(line, { signal })` is taken down by its signal, as [Taking a control
down](#taking-a-control-down) has it, and `StatusProvider` takes its line down the same way as it
unmounts. Taken down, the line is let go: its timers are cleared and the words said or held for it
are dropped, so nothing more is said there, by any piece given the line, until it is attached again.
A toast's own line, which the toast lets go as it is taken down, is attached afresh by the page's
next `attachStatus` where the page had attached it too, and that call takes the old attach down. The
function an attach returned says nothing once that attach is taken down, while a piece given the
line itself as its `status` speaks on the line's next attach, so a page that attaches a line again
hands its pieces the new function, or the line. `useStatus` hands out a function of its provider's
that always calls the line's current attach. A piece's own timers, such as a busy button's wait,
still come due, and say nothing there. A stepper, a form, a busy button or progress given the line
speaks on it without attaching it, so none of them holds the line, and a line a page attaches with a
signal is taken down once every signal holding it has aborted.

Every piece that speaks on a line follows one policy. Words are said at once. Words that change with
each press, such as a count still to enter, ask to settle, as `say(words, { settle: 700 })`, and
wait that long for their words to stop changing, so a screen reader hears the count once the presses
stop rather than every step of it or none. Words said again in the meantime take the place of those
not yet said, and firm words, any not asked to be polite, drop words still settling, so the last
words said are the ones heard. The same words said twice are heard twice. Words that must be heard,
such as a save's result or the end of a progress, never wait to settle, and words that settle never
drop words already said. A stepper's press words are put in a tenth of a second after each press, so
a quick run of presses is heard once, at its end, and on a page's line they leave as every message
there does.

Words that should give way to a result, such as a progress's steps and its end, or a busy button's
notice that work goes on, ask to be polite, as `say(words, { polite: true })`. Polite words said in
the same moment as firm words, or while firm words settle, are left unsaid, so a result said with
them is heard in their place. Polite words said while firm words are being said wait for them to
leave and are said then, the last of them alone, so the end of a progress is heard after a
stepper's press or a copy, however many follow, and polite words not yet put in when firm words
come wait for those in turn. Polite words given as a function, such as the busy notice, wait for
any words on the line, polite ones too, and are read as they are put in, so they never put out the
end of a progress and say nothing once the work is done.

Attached again, a line returns the function it returned first, with its words, unless it was let go
of, as a toast lets its own line go when the toast is taken down, when it returns one afresh. A
stepper speaks on a line of its own inside its field, and the toast on one of its own, so a page
finds its screen's line by a class of its own rather than by its role, which those share.

A screen whose action shows a toast leaves its own line quiet for that action, since the toast says
what happened on its own line and the two would speak over each other. A field's error is never said
on the line, since a form that fails in several fields at once would speak over itself. While a
dialog is open the page behind it is inert, and a line there is not heard, so a screen that speaks
while a dialog is open puts a line inside the dialog and says its messages there.

React's `StatusLine` draws the line, taking `className` and `ref`, its ref the line drawn.
`CopyStatus` is the same component under the name a copy button's line was given first.

In React, `StatusProvider` draws a screen's line and attaches it, and `useStatus()` returns the
function that says a message on it from any part of the screen under the provider, the same across
renders. The line is attached before the effects of the parts under it run, so a part's first
effect is heard, and words said before the line is in the page are held and said once it is. A
provider inside the dialog element itself takes the calls of the parts inside it on a line of its
own, so they are heard while the page behind is inert. Words said as a dialog closes, such as a
save's result, go through the page's own `say`, since the dialog's line leaves with it. A part with
no provider above it throws.

```tsx
import { StatusProvider, useStatus } from '@jasonsdevspace/design-kit/react';

const Seats = () => {
    const say = useStatus();
    return <button onClick={() => say('Ann moves to seat 2.')}>Move Ann</button>;
};

export const Screen = () => (
    <StatusProvider>
        <Seats />
    </StatusProvider>
);
```

### Moving focus after a change

When a change takes away the control that had focus or brings a visitor somewhere new, focus goes
where they can carry on, so a keyboard and a screen reader never fall back to the top of the page,
as WCAG 2.4.3 asks. `moveFocus(target, { fallbacks })` from `./controls` moves focus to a control,
given as an element or an id, once the change is drawn, a frame later, so a control the page draws
in answer to the same press or key is there. Ask in the handler of the press or key that makes the
change, or, for a change React draws later, in a transition or behind a suspense, in an effect once
it is drawn. A page in React asks through `useFocusAfterDraw`, below, which waits for the render
that draws the change rather than a frame alone, so a change set after an await is drawn too. Where
the target is gone, hidden, inert, disabled or marked off, focus goes to the first of the fallbacks
that takes it, and then to the app frame's body or the page's main content, by the walk a closing
panel hands focus back by. A target or a fallback, here and for `focusOnArrival` below, can be any
HTML or SVG element that takes focus, such as a link in an inline chart. Focus a visitor has moved
since the request is left where they put it: focus is free only while it is where it was when asked,
or on the page's body, as it is once the control that had it is removed, or where the kit has handed
it back since, as a toast, a dialog or a panel does as it closes and a stepper as it is taken down,
or on what the browser hands it to as a dialog closes, until the dialog's close is handled. A
request still waiting a second later, as in a tab out of sight, is dropped, so focus does not jump
when the visitor comes back. Each request is new, so the same control asked for twice is focused
twice, and the function `moveFocus` returns calls a request off before it lands, as aborting the
`signal` it is given does. A request asked as its component unmounts is given no signal that unmount
aborts, so it still lands. An id is looked for in the root where focus was when the request was
made, so a widget drawn inside a shadow root finds its own control, never an element of the page
around it that shares the id, and the form's refusal, a stepper and progress find the errors, hints
and labels they read in their own element's root. A panel and its button are found from the page's
document, which the panel listens on. `activeOf()` from `./controls` returns what has focus,
followed into each shadow root that holds it, as a request reads where focus was, for a page that
asks later and passes `from` itself.

```js
import { moveFocus } from '@jasonsdevspace/design-kit/controls';

// Ann's row and its Remove button go, so focus goes to the next player's, or the list's heading.
moveFocus('remove-ben', { fallbacks: ['players-heading'] });
```

In React, `useFocusAfterDraw()` returns the same function, the same across renders, and makes each
request once the render it was asked in commits, so it lands in the frame that paints the change. A
page that sets its state after an await, as a save to the browser's storage does, and then asks
finds the control drawn and on, though React draws that state in a task of its own and a frame can
come before it, and so does a page whose change is drawn by another component. Where focus was is
read as the request is asked, inside a shadow root too. Ask in a handler, after an await in it too,
or in an effect with dependencies, never as the component renders nor in an effect that runs on
every render, since asking renders the component again. A change made in a transition is asked for
inside the same `startTransition`, and a change drawn in another React root is not waited for. A
request takes the place of one not yet landed, so the last asked for wins, and what it returns calls
off that request alone. One asked as the component first draws, from a ref on its own markup, waits
for its render as any other does. One still waiting when the component unmounts, or when an
`Activity` hides it, is made then, with where focus was read as it was asked, so a row that asks for
focus on the next as its press removes it moves focus there, at once, after an await, from a timer
or in a transition. Nothing at unmount calls a request off, only what it returned or a newer
request, and it lands only where focus is still where it was or has fallen to the page's body, so a
visitor who moved on keeps their place. React tells the hook nothing of which update unmounted the
component, so a request in a transition an urgent update overtook lands before the transition draws,
and goes to its fallbacks where the transition draws its target. One asked after the component has
gone, as a panel that closes itself and then asks after an await, waits a frame and is made then,
taking focus only from the page's body, whatever `from` it was given, and only where its target is
in sight, so a visitor already on the next screen is left where they are. One whose target an
`Activity` hides with the component is held until the component shows, and is made then.
`useArrivalFocus(key)` returns a ref for a view's heading, gives the heading a tabindex of -1 where
it has none, and focuses it when the key changes, such as the round on screen, and when the view is
first drawn by a visitor's press on a button or a link, or a submit, as a tab bar's view is. A first
draw takes nothing as the page first draws, after a key that moves or types, such as Tab or an arrow
along a row of tabs, after a press on nothing or on a control that is off, or more than five seconds
after the press, as a view a poll brings. A row of tabs' panels take no focus on arrival, since a
tab keeps focus as its panel changes, so they leave the hook out. Views first drawn by one press
land together, and the first in the page takes focus, so a view's title is heard before a section of
it. Focus a view placed itself as it drew, as a field with autofocus does, is never taken. What
decides a first draw is `focusOnArrival(heading, { from })` from `./controls`, which a page without
React calls as each view draws, and with `changed` as a view already drawn changes on a press, which
then lands with any view first drawn for that press, so the first in the page still takes focus. The
key is a string, a number or a boolean, compared by value, and changes on a press or a submit, never
as a visitor chooses in a list or a set of radios, which would move them as they choose, as WCAG
3.2.2 has it.

```tsx
import { useArrivalFocus } from '@jasonsdevspace/design-kit/react';

export const Round = ({ round }: { readonly round: number }) => {
    const heading = useArrivalFocus<HTMLHeadingElement>(round);
    return <h2 ref={heading}>Round {round}</h2>;
};
```

### A part of the page that is loading

<!-- example: loading -->

```html
<article aria-labelledby="product" aria-busy="true">
    <h2 id="product">Product</h2>
    <p class="dk-loading">Loading the product.</p>
</article>
```

A part of the page waiting for its content, such as a product on its way, carries
`aria-busy="true"` while it waits, so a screen reader holds off reading it half drawn, and holds a
`.dk-loading` line that says what is coming. The page puts the line in with the mark, since the
line's wait is timed from when it first matches. The line shows only once the wait outlasts
`--dk-wait`, 400ms, so a fast answer shows nothing. The wait is a delay rather than a motion, so it
stands under reduced motion and in forced colors. The line is words in the muted text, with no
spinner, since its words already show what is happening.

Once the content is drawn, the page takes the line out and the mark away in one change, since the
line shows at once the moment the mark goes. Where the wait fails, the page puts a danger callout
with a way forward in the line's place and takes the mark away, so the line never stays up.

The line is out of the tree a screen reader reads while it waits, and is not live, so nothing is
heard of it. Where the wait follows a visitor's own action and focus stays where it was, the page
says the line's words on the screen's status line once the wait outlasts `--dk-wait`, then says the
result. Said as a function with a settle of the same wait, the words are dropped where the load
finished first, as a busy button's are, and the result said after them takes their place:

```tsx
const say = useStatus();
const loading = useRef(false);

// On the press that starts the load, settled for --dk-wait, 400ms.
const load = () => {
    loading.current = true;
    say(() => (loading.current ? 'Loading the products.' : null), { settle: 400 });
};
```

A region that loads as the page opens says nothing, since a visitor arriving finds it as they read.
A button that starts the wait is busy, not loading, and a wait with a known amount is progress.

### Progress

Something that works through a known amount, such as an import through a file or an upload, shows
how far it has come with `dk-progress` on the native `progress` element, labeled by what is
progressing, with words under it that say the amount:

<!-- example: progress -->

```html
<div class="dk-field">
    <label class="dk-field-label" for="import">Importing products</label>
    <progress
        id="import"
        class="dk-progress"
        value="12"
        max="40"
        aria-describedby="import-words"
    ></progress>
    <p class="dk-field-hint" id="import-words">12 of 40</p>
</div>
```

The bar is a short track in the line color with the fill in the accent, which stands 4.5 to 1 and
more against it in both themes, its leading edge square so it marks the amount exactly, and in
forced colors the fill takes the highlight on an edged track. The track is too faint to tell how
much is left by color alone, so a bar with an amount always carries its words, which `Progress`
asks for. The browser gives the bar its role, its value and its range, so a screen reader reads the
label, how far it has come in hundredths and then the words, which describe it. A bar with no
`value` draws an empty track, not the browser's looping motion, since a wait with no amount to
measure is [a loading line's](#a-part-of-the-page-that-is-loading). `Progress` in React draws the
label, the bar and the words, from its `label`, `value`, `max` and `words`.

Progress is said on the screen's [status line](#status-line) by
`attachProgress(bar, { status, signal })` from `./controls`, or `useProgress()` in React, which
speaks on the line of the nearest `StatusProvider`. It says the bar's name, from its label or the
words it is labeled by, and its words, such as "Importing products, 12 of 40.", at steps the page
sets with `steps`, each quarter until it sets others, and once at the end, or the `done` words in
its place, such as "Imported 40 products.". Each is said at once, with no wait for the amount to
stop changing, since a steady import never stops, and at least three seconds after the last step, so
one is heard before the next, while the end never waits. Nothing replaces the end until the amount
goes back for another run. The amount a bar first shows is not said, an amount that becomes known at
the end, after the bar is attached, aside, so a bar attached already full says nothing, and a bar
with no amount says nothing. Taken down, by the function it returns or by its `signal`, as [Taking a
control down](#taking-a-control-down) has it, it says nothing more, and a step not yet heard on the
`status` line it was given is dropped, while one handed to a page's `say` is the page's. What it
says is polite, `say(words, { polite: true })`, so it gives way to a page's own result said with it,
and waits for firm words already being said, while a busy button's words beside it, polite too, give
way to it:

<!-- source: importing -->

```tsx
import { Progress, useProgress } from '@jasonsdevspace/design-kit/react';

/**
 * An import working through a file, under a `StatusProvider`, said each quarter and once at the
 * end on the screen's status line, where the page's own words win over it.
 */
export const Importing = ({ done, total }: { readonly done: number; readonly total: number }) => {
    const bar = useProgress({ done: `Imported ${String(total)} products.` });
    return (
        <Progress
            ref={bar}
            label="Importing products"
            value={done}
            max={total}
            words={`${String(done)} of ${String(total)}`}
        />
    );
};
```

**`Progress` props**

| `Progress`  | Default                 | What it does                                                                                        |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------------------- |
| `label`     | required                | Names the bar, as what is progressing                                                               |
| `value`     | none                    | How far it has come, out of `max`. Left out while the amount is unknown, which draws an empty track |
| `max`       | `1`                     | The whole amount                                                                                    |
| `words`     | required with a `value` | Words that say the amount, such as "12 of 40", drawn under the bar and read as its description      |
| `id`        | from `useId`            | The bar's id, and what the words' id starts with                                                    |
| `className` | none                    | A page's class, after the kit's, on the field that holds the bar                                    |
| `ref`       | none                    | The bar, for a page that hands it to `useProgress` or `attachProgress`                              |

A run that fails partway takes the bar's `value` away, so it says no more, and puts a live danger
callout with a way forward beside it, as a failed load does. The callout reads the failure, so the
status line says nothing of it and the failure is heard once. A run that works says its result, in
`done` or in words of the page's own, which the end gives way to.

## Content pages

A content page, such as a landing page or an about page, is a `dk-page` on its main content: its
title, its lead, its one action and its sections, spaced by the kit with no rule of the page's own.

<!-- example: contentPage -->

```html
<main id="main-content" tabindex="-1" class="dk-page">
    <h1>Scorekeeper</h1>
    <p class="dk-lead">Keep score for any card game on one phone passed around the table.</p>
    <p><a class="dk-button dk-button-accent" href="/app/">Start a game</a></p>
    <section>
        <h2 id="how">How it works</h2>
        <p>...</p>
        <ul>
            <li>...</li>
        </ul>
    </section>
    <section>
        <h2 id="games">The games it knows</h2>
        ...
    </section>
</main>
```

`dk-page` spaces what it holds by `--dk-flow-step`, `--dk-space-4`, as an explainer does, with
`--dk-space-6` above its first child under the header's rule and nothing added by a child out of
sight, and stands its sections `--dk-space-7` apart, with no rule between them. Its `h1` is at the
display size, with the lead `--dk-space-2` under it, as an explainer's is, and a section's `h2` at
the title size, `--dk-space-3` over its text. It starts its text at the strip's inset, by the same
band insets, so the page reads as one column from the strip to the footer and keeps clear of a
phone's sides. Only its prose holds to the measure, its paragraphs, its plain lists and a quote, and
its [fields](#fields), so a table, a grid of tiles or a figure takes the column. The spacing is set
on the page, between what it holds, never on a paragraph's own margin, so a reader's own sheet that
adds room under a paragraph adds the room it asks for and breaks nothing, and nothing is reordered,
so focus and reading follow the markup. `dk-lead` is the lead, in the page's text color at the lead
size and held to the measure, the explainer's lead under a name of its own. [Decision
0017](https://github.com/jasonsdevspace/design-kit/blob/main/docs/decisions/0017-a-content-page-is-a-container.md)
says why a content page is a container of its own.

### Bands and groups of sections

A landing page that runs in bands the width of the screen, each on a ground of its own, draws each
band with `dk-band` rather than a content page, and a group of sections side by side with
`dk-sections`:

<!-- example: bands -->

```html
<main id="main-content" tabindex="-1">
    <section class="dk-band" aria-labelledby="title">
        <div class="dk-band-hero">
            <div class="dk-stack">
                <p class="dk-eyebrow">For game night</p>
                <h1 id="title">Scorekeeper</h1>
                <p class="dk-lead">Keep score for any card game on one phone.</p>
            </div>
            <img src="table.jpg" width="880" height="1008" alt="" />
        </div>
    </section>
    <section class="dk-band" aria-labelledby="install">
        <h2 id="install">Install it</h2>
        <div class="dk-sections">
            <section aria-labelledby="iphone">
                <h3 id="iphone">On an iPhone</h3>
                <p>...</p>
            </section>
            <section aria-labelledby="android">
                <h3 id="android">On an Android phone</h3>
                <p>...</p>
            </section>
        </div>
    </section>
</main>
```

A band starts its content at the band insets, as the strip and a content page do, and spaces what it
holds by the flow, with `--dk-band-room` above and below it, `--dk-space-7` until a page sets it,
and the ground and the edge are the page's to set. Its `h1` is at the display size, in a stack too,
and its `h2` at the heading size, and a section it holds spaces as a content page's does. Its own
prose and a stack's are held to the measure. A grid the band holds is one piece of its flow, so the
grid's items stand apart by its gap alone, and a column of pieces in a grid's cell, such as a hero's
words beside its picture, is a `dk-stack`, the flow with no room of its own, at the step of what
holds it. `dk-sections` sets its sections as many to a row as fit at `--dk-sections-least` or more,
20rem until a page sets it, one to a row on a phone, `--dk-space-7` apart, each with its heading, an
`h2` under a page's `h1` or an `h3` under a band's `h2`, at the title size and `--dk-space-3` over
its text, and its prose held to the measure. A group stands a section's step from what comes before
it, or the flow's step under the heading that names it, so a group and a section under it read as
one page.

#### A hero

A hero, the words that open a page beside its picture, is a `dk-band-hero` holding the words' stack
and then the picture, so a reader hears what the page is before the picture. The class can sit on an
element inside a band, or on the band or the content page itself, and the hero spaces its words and
picture the same in each. On a phone the two stand one over the other, `--dk-space-6` apart, the
picture no taller than `--dk-band-hero-picture`. From 48rem they stand side by side, centered on
each other, with the picture that wide, 28rem until a page sets it, and never past 45% of the row,
so the words keep room for a display heading. An `img`, a `video` or a `picture` fills its cell and
keeps its proportions, cropped rather than stretched, and one in a `figure` keeps its own shape with
its caption under it. Give a picture the width and height it was made at, so it holds its room while
it loads. A picture that only sets a mood, beside words that already say what the page is, takes
`alt=""`. One that shows what the words do not, such as the app's screen, says so in its `alt` and
keeps its subject in frame, with an `object-position` of the page's own or `object-fit: contain`,
since the crop grows as a visitor's text does, and a picture with words in it goes in a `figure`,
uncropped. A hero video does not play by itself, or carries `controls` so a visitor can stop it.

### Stacks

A stack, a split row, a note and a numeral work the same in a content page, a band, a panel, a
dialog and an app's body.

A column of pieces inside another piece, such as a hero's words, a label over its value or a heading
over a list, is a `dk-stack`, the flow with no room of its own. A plain stack spaces what it holds
at the step of what holds it, a page, a band, a panel, a dialog or an app's body, and one outside
them names its own step. Written beside
`dk-stack`, `dk-stack-pair` spaces what it holds at `--dk-space-2`, for a label over its value or a
header's lines, and `dk-stack-heading` at `--dk-space-3`, for a heading over what it heads:

<!-- example: stacks -->

```html
<div class="dk-stack dk-stack-pair">
    <p>Next to play</p>
    <p>Ann</p>
</div>
<div class="dk-stack dk-stack-heading">
    <h2>Round 3</h2>
    <ul class="dk-stack" role="list">
        <li>Ann, 42 points</li>
        <li>Ben, 37 points</li>
    </ul>
</div>
```

Each step sets `--dk-flow-step` on what the stack holds, and holds between all of it, under a title
or a section's heading too, so a pair drawn as a page's section still spaces as a pair. A stack
inside one takes its step for its own pieces unless it names its own. A piece out of sight, hidden
or visually hidden, adds no step, and the spacing is set between the pieces, never on a paragraph's
own margin, so a reader's own sheet that adds room under a paragraph adds the room it asks for. A
group with a heading needs no `section` of its own, since a named section is a landmark, and one
for every round fills a screen reader's list of landmarks.

A stack on a `ul` or an `ol` drops the list's markers, its indent and its own room. Give it
`role="list"`, since VoiceOver in Safari, on an iPhone most of all, stops calling a list a list once
its markers are gone, and then no longer says how many items it holds. On an `ol` whose numbers
matter, such as a ranking, put the number in each item's words, since the numbers drawn go too. A
list nested in one keeps its own markers. Scores compared across players and rounds are a table
rather than a stack of lists. The step between a page's sections stays the page's, since that is
the page's rhythm rather than a piece's.

### Split rows, notes and numerals

A title with a figure or a control at its end, such as a player's name and the round, is a
`dk-split`. A note that is not a field's hint or error, such as the round under a name or a word
beside a label's, is a `dk-note`, and a figure read from across a room, such as a score, is a
`dk-numeral`:

<!-- example: splitRow -->

```html
<div class="dk-stack dk-stack-pair">
    <div class="dk-split">
        <h2>Ana</h2>
        <p class="dk-note">Round 4 of 10</p>
    </div>
    <p class="dk-numeral">212<span class="dk-visually-hidden"> points</span></p>
    <p class="dk-note">The first to 300 points wins.</p>
</div>
```

`dk-split` sets what it holds on one line, the first at the start and the last at the end, lined up
on their first line's baseline, and puts the end under the start, `--dk-space-1` apart, where the
two do not fit, with `--dk-space-3` between them on one line. What it holds keeps no room of its
own, and each piece breaks a word too long for the line, so a long name holds on a 320px phone
rather than push the page sideways. `dk-note` is the muted text at the small size and the normal
weight, so one beside a label's words reads as a note rather than at the label's weight, and it
holds 4.5 to 1 on every ground the kit draws, so a note adds no color to check. `dk-numeral` is
`--dk-text-numeral` in the mono face with tabular figures, so a score that changes keeps its width,
at the strong weight on a line no taller than the figure. A numeral never breaks, since a score
split over two lines reads as two numbers, so on a phone at a large text size it stops at a size
five figures fit in, such as `-1234`. Give a numeral its unit, out of sight where the screen shows
it elsewhere, so a screen reader says what it counts. A numeral that changes is not a live region,
which would read every score on every change, so say the change on the screen's [status
line](#status-line), with whose score it is, as `say('Ana, 212 points.')`. A number in a row is a
`dk-row-figure`, which lines up digits the same way, rather than a numeral. A split row on a page, a
band or a stack holds to the measure with the prose around it, so its end stays near its start.

## Explainer pages

An explainer is the page that says how a demo works, the one the strip's "How it works" link leads
to, with each piece live on
[the explainer pieces page](https://jasonsdevspace.com/design-kit/explainer-pieces/).
`components.css` styles its layout and the steps, panels, tables and code blocks it holds, by the
markup below, which every page writes by hand, since none of these pieces has logic to hide.

### Page layout

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
    <p>... <a href="./" aria-current="page">How it works</a> is explained in plain words. ...</p>
</footer>
```

The header holds a link back to the demo, outside `main`, so the skip link passes it and reading
starts at the h1. The link is the target tall, so a thumb finds the way back, and it moves neither
the header nor the title. `main` holds the h1, the lead, the one action as an accent button, and
then the sections. Each section holds its number, hidden from a screen reader since its heading says
what the section is, then an h2 with an id, then its text, with an h3 for each part of it.

A section is a plain `<section>`, never named, and its h2 ids are a contract other pages link to, so
a page keeps an id when it rewords its heading, as [decision
0009](https://github.com/jasonsdevspace/design-kit/blob/main/docs/decisions/0009-explainer-sections-are-never-landmarks.md)
explains.

<details>
<summary>Sections, landmarks and spacing</summary>

A named section would become a region landmark. Left unnamed, the page's landmarks stay the strip's
navigation, the demo's switches when it has some, the header, the main content, the footer and the
frames that scroll. A reader moves between sections by their headings. An in-page link needs no
tabindex on the heading, since a jump to a fragment moves where the keyboard goes next. Each h2 has
a scroll margin, so a jump stops short of it and leaves the section's number and rule in sight above
it. The kit draws no table of contents, since an explainer is short enough to move through by its
headings.

The header and the explainer start their text at the column's inset, where the strip's links start,
and every part of the explainer holds to `--dk-measure`, 34rem, no more than 80 characters a line in
the body size. Each part is spaced from the one before it, so a list, a table, a panel and a code
block space alike. The h1 is the display size and the lead a step over the body. A section opens on
a rule in the line color, with 2rem of space above and below it, then its number in the muted
caption size, its heading in the title size, and its text, with an h3 at the body size.

</details>

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

Steps show what a demo does one after another, each in a box of its own with an edge in the line
color and large corners, in the small text. A step's title is at medium weight, with its note in the
muted text on a line below. Every step after the first opens with an arrow, hidden from a screen
reader. The list keeps `role="list"`, since WebKit with VoiceOver drops a list's meaning when its
markers are gone.

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

A panel sets a part of a page apart on the card ground. Its title is a paragraph, or a heading one
level under its section's where a reader would jump to it. A panel differs from a callout in having
no tone, no hidden word and no live role, and in being at the body size rather than the small text.
It has no role at all. It is not an `aside`, since inside `main` an aside becomes a complementary
landmark, and a box in the reading flow is not complementary to it. Nor is it a named `section`,
which would be a region landmark, or a `figure`.

<details>
<summary>How a panel is drawn</summary>

A panel sits on `--dk-surface` with an edge in the line color and large corners. The edge is what
draws it, since the card ground is close to the page's, and it stays in forced colors. A panel is
padded by `--dk-card-inset`, which a tile's sides share: 1.5rem, and at 48rem wide or less 1rem held
at no more than 16px at any text size, so a panel and the tiles in it leave their words room on a
phone at twice the text size. In an app's frame, on a page that ends in a tab bar and in a dialog on
either, where the column is a phone's, it is padded the same held 1rem at every width. What it holds
is spaced 0.75rem from the one before it, a step closer than an explainer's parts. Inside an
explainer its title steps down to the body size, as a tile's title there does.

</details>

#### A raised panel

<!-- example: panelRaised -->

```html
<div class="dk-panel dk-panel-raised">
    <p class="dk-panel-title">Flip 7, round 4</p>
    <p>Ana is next to score.</p>
    <a class="dk-button dk-button-accent dk-button-tall" href="/game/?id=12">Continue the game</a>
</div>
```

`dk-panel-raised` sets a panel above the cards on a page, for the one thing to pick up again above a
list, such as a game in play above the games to start. It sits on `--dk-raised`, a step above the
card ground in both themes, where a plain panel would match a page's cards. In the light theme the
raised ground is the page's own, so its edge and its shadow draw the panel there. A page with a
shadow of its own for it sets `--dk-panel-shadow`, or `none` for no shadow, and writes no rule over
the kit's class. With none set, a raised panel casts the kit's resting shadow,
`--dk-shadow-resting`, which a page's own replaces. It keeps the panel's edge, its corners and its
padding, and stays a block with no role. A pinned column or a code block inside it takes grounds of
its own that stand apart from the raised one. A raised panel belongs on a page or in an app's body,
since a dialog is drawn on the raised ground already.

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
tabindex of 0 at every width, so a keyboard can reach it and scroll it with the arrow keys. It is a
region whether or not it scrolls, as [decision
0008](https://github.com/jasonsdevspace/design-kit/blob/main/docs/decisions/0008-a-scroll-frame-is-always-a-region.md)
explains.

```js
import { attachTable } from '@jasonsdevspace/design-kit/controls';

attachTable(document.querySelector('.dk-table-scroll'));
```

A table whose cells hold a link or a button attaches each frame with `attachTable(element)` once its
markup is on the page, passing the frame or anything in it. What the keyboard reaches then comes
fully into view, clear of a pinned column, where Chromium and Safari would leave one that is partly
in view cut by the frame's edge. Focus a pointer brings is left to the browser. A frame added later
is attached on its own. The function `attachTable(element, { signal })` returns takes it down, and
so does its `signal`, as [Taking a control down](#taking-a-control-down) has it. Without script the
frame keeps a target's room at its end, so a link with no more than that showing still comes into
view.

A column's header is `th scope="col"`, the cell that names a row is `th scope="row"`, and every cell
of a numeric column, its header included, is `.dk-table-number`. A table is never stacked into cards
on a phone, since `display: block` on a table's parts drops its table semantics in WebKit. It
scrolls in its frame instead. A header gives its unit in words a screen reader says well, "Slowest
1%, ms" rather than "p99 ms".

<details>
<summary>How a table is drawn</summary>

A frame holds to the measure as the prose does, so a table wider than 34rem scrolls on a wide screen
too. A table is in the small text, with each row ruled in the line color. Its column headers are the
muted text at medium weight, and a row's header is at medium weight too. The outer cells keep no
padding on their outer side, so the table's text lines up with the prose around it. Figures sit to
the right and on screen never wrap, while text in a cell wraps and keeps its first line level with
the rest of its row. On screen code in a cell stays on one line, hyphens and spaces alike, so a
token's name never breaks after `--dk-`, and a long expression scrolls the frame as a wide table
does. On paper the table shows whole and its figures and code wrap. The frame's scroll padding keeps
a target's room at its end edge, which a browser counts as out of view.

A frame that scrolls further shows a shade at each edge it scrolls toward, since a phone hides its
scroll bar, and none at an end that is in view, so a frame whose table fits shows none. Each shade
grows as the frame's own scroll leaves that end, on any ground, either way the table reads, and for
a visitor who asks for less motion too. It is drawn behind the cells and reaches only the last few
pixels of a cell the edge cuts, and under a pinned column the start's shade is hidden, where the
column's rule marks the edge. A browser that cannot tie an animation to a scroll shows no shade, and
neither do forced colors or paper.

</details>

#### A pinned first column

A table wider than a phone, such as the scores of each player across every round, can keep the
cells that name its rows in view while the rest scrolls sideways under them, so a reader in the
middle of it still knows whose row it is. The table takes `dk-table-pinned` beside `dk-table`, and
stays one table in its named frame, so a screen reader reads its heads as before.

<!-- example: pinnedTable -->

```html
<p class="dk-table-title" id="scores-title">Scores by round</p>
<div class="dk-table-scroll" role="region" aria-labelledby="scores-title" tabindex="0">
    <table class="dk-table dk-table-pinned" aria-labelledby="scores-title">
        <thead>
            <tr>
                <th scope="col">Player</th>
                <th scope="col" class="dk-table-number">Round 1</th>
                <th scope="col" class="dk-table-number">Round 2</th>
                <th scope="col" class="dk-table-number">...</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <th scope="row">Ana</th>
                <td class="dk-table-number">24</td>
                <td class="dk-table-number">31</td>
                <td class="dk-table-number">...</td>
            </tr>
        </tbody>
    </table>
</div>
```

The pinned cells take the page's ground, or a panel's, or a dialog's raised one, so the cells
passing under them never show through, and a rule at their end says where the pinned column stops. A
table on a ground of its own, such as a callout's, sets that ground in `--dk-table-ground`. The
table draws its borders cell by cell, so a pinned cell's rule travels with it. Only the first column
is pinned, and the header row scrolls with the table, since a table of a few rows needs no pinned
header.

A table whose cells hold a link or a button sets `--dk-table-pinned-size` on its frame to the pinned
column's width, 8rem unless it does, so what the browser scrolls into view stops beside the pinned
column, and once `attachTable` is attached the column's own width counts wherever it is wider. On a
phone at a large text size, under 17.5rem wide, the column scrolls with the rest and the frame keeps
no room for it, since a column of names would leave no space for a figure beside it. At 17.5rem and
wider, as on any phone at the usual text size, it stays pinned. Names in the pinned column are kept
short all the same, since a long one widens the column wherever it stays pinned, and the wider text
spacing a reader may set narrows what is left beside it. No cell in the first column spans rows,
since the cell after it would be the one pinned.

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

On screen a block of code keeps its lines as written and scrolls inside itself, since wrapping would
break its indentation and show line breaks the code does not have. On paper it shows whole and wraps
its lines, so nothing is cut off. It is a named region with a tabindex of 0, for the same reasons as
a table's frame. Its title says what the code is for, such as "Run it yourself", rather than naming
its language. `translate="no"` keeps a browser's translation of the page off the identifiers. A
block never takes `lang` for its programming language, since `lang` names a human language. The
code starts right after `<code>`, since a line break there shows as a blank first line, and a `<` or
`&` in it is written `&lt;` or `&amp;`. The markup alone draws no copy button. A block gets one only
from a page's script, which sets it beside the title in a `dk-code-head` and attaches it, as the
copy button's section shows.

<details>
<summary>How a code block is drawn</summary>

A block sits on the card ground, or on the page's own ground inside a panel, so it reads as set into
what holds it. Its edge is transparent, and shows in forced colors and on paper, where the ground is
dropped.

</details>

## App frame

An app's screen is a frame as tall as the screen: a bar across the top that says where the visitor
is, a body that scrolls between, and a dock at the bottom for what the screen is for.
`components.css` styles the markup below with no script. The frame is the page's whole content, with
nothing above or below it but a skip link, since anything else would add to the screen's height and
push the dock out of view.

<!-- example: appFrame -->

```html
<div class="dk-app">
    <header class="dk-app-bar">
        <h1 class="dk-app-title">Round 3</h1>
        <button type="button" class="dk-button dk-button-text">Scores</button>
    </header>
    <main id="main-content" tabindex="0" class="dk-app-body">...</main>
    <div class="dk-app-toast">
        <div class="dk-toast">
            <p class="dk-toast-message" aria-hidden="true"></p>
            <p class="dk-visually-hidden dk-toast-status" role="status"></p>
            <div class="dk-toast-buttons">
                <button
                    type="button"
                    tabindex="0"
                    class="dk-button dk-button-text dk-toast-action"
                    hidden=""
                ></button>
                <button
                    type="button"
                    tabindex="0"
                    class="dk-button dk-button-text dk-button-quiet dk-toast-close"
                    hidden=""
                >
                    <span aria-hidden="true">×</span>
                    <span class="dk-visually-hidden">Close</span>
                </button>
            </div>
        </div>
    </div>
    <section class="dk-app-dock" aria-label="Actions">
        <button type="button" class="dk-button dk-button-accent dk-button-tall">
            Save the round
        </button>
    </section>
    <nav class="dk-app-tabs dk-tabbar" aria-label="Sections">...</nav>
</div>
```

The bar's title is the page's only `h1`, so each screen has one and a screen reader finds it by its
heading. The bar has room for a mark before the title and one action after it. The body is the
page's `main`, and the one part that scrolls, so the bar and the dock stay in view. It stands what
it holds `--dk-space-4` apart, as an explainer does, and its padding puts the first of it that far
under the bar. It has `tabindex="0"` on every screen, so the keyboard reaches it and the arrow keys
scroll it whatever it holds, as a frame that scrolls always does in the kit. The dock is a `section`
named for what it holds, so a screen reader moving by landmark finds the screen's main button after
the body. It holds that button at the larger target, and a second one below it, or a compact one
beside it in a row, where a screen has two.

`dk-app-toast` is a toast's place, above the dock, and `dk-app-tabs` is a tab bar's, at the bottom
edge. A screen leaves out any part it does not have, the dock included, and its row closes to
nothing. Each part names its row, so the order they are written in is the order the keyboard and a
screen reader take them, and it is the order above.

A page drawn in the frame says `viewport-fit=cover` in its viewport meta, which is what gives the
safe area tokens their values:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

<details>
<summary>How the frame is drawn</summary>

The frame is a grid of rows: the bar, the body, the toast's place, the dock and the tab bar's place.
Its column is a phone's whatever the screen, so every button, field, select and choice in it is the
target tall at every width, as on a phone, and one screen has one height of control. A page that
ends in a tab bar does the same, as does a dialog on either, and so do a theme switch, pills and
tabs there, and a button in a toast. A demo's strip and footer stay as they are on every page. A
page that shows a picture of a screen, such as a page of a kit's pieces, gives `dk-picture` to the
picture's wrapper or to the frame itself and makes it `inert`, so the keyboard and a screen reader
pass it by. A frame, a page that ends in a tab bar or a shown toast is a picture when it carries
`dk-picture` or sits inside an element with the class, and the page around a picture keeps its
column, its dialogs and its foot as a content page does. A pictured toast sits in its place rather
than over the foot of the page. A pictured frame or page that ends in a tab bar is as tall as what
it holds, its bars in their places in it rather than held to the screen, and the page draws the
edge, the corners and the room around it. Only a toast's attach function reads a height, the toast's
and the body's, as it shows and while it stays. A dock grows with what it holds and a tab bar grows
at a large text size, so the body ends where the rows below it begin. A toast floats over the foot
of the body, just above the dock, so showing or hiding one never moves the dock under a thumb about
to press it again. While one is shown its place opens on a rule, under which the body scrolls as it
does under the bar, and the body leaves room for the toast after its last element, as many rows as
its attach function measured it at, up to five, so its last line scrolls clear of the toast and what
the keyboard reaches in it stops short of the toast, in a browser with `:has()`. Where the body
would keep less than a row and a half above that room, as on a phone on its side or at a large text
size, the toast takes its row above the dock instead, so nothing in the body is covered by it or the
bar, and the attach function scrolls the page by as much as the dock moved, so the dock stays under
the thumb. The toast is measured again while it stays, as the screen turns or the text size changes.
The room is that element's margin, so the body ends in a block, such as a paragraph or a list, as
its content does. On a screen too short for the frame the toast takes its row above the dock, and
the page keeps the dock in place as the toast comes and goes, in a browser that keeps a scroll
position by what is on screen, as Chrome and Firefox do. Each row but the body's is never shorter
than what it holds, and the body keeps `--dk-app-body`, 8rem, a few lines, so where the rows come to
more than the screen the page scrolls and no row covers its neighbor or squeezes the body to
nothing. What the body holds out of sight, such as a row's words for a screen reader, scrolls with
it and never lengthens the page.

The frame's height is `100dvh`, the dynamic height, so a phone browser's own bars coming and going
do not push the dock out of view. A pictured frame is as tall as what it holds instead, as the app
frame's first paragraph says. The bar pads itself past `--dk-safe-top`, so its ground runs up under
a notch and its title starts below it. The frame pads itself past the side safe areas, and its
lowest part, the tab bar, or the dock or the body where nothing comes after it, pads itself past
`--dk-safe-bottom`, so its ground runs down under the home indicator and what it holds stays clear
of it, even where the page scrolls whole. The bar, the body, the toast's place and the dock pad
their sides by `--dk-app-side`, the held step, no more than 16px at any text size, as a panel's
words stand in, so at a large text size the frame's words keep their room. On a page with an app's
frame or a tab bar, the band insets take the same held step, so the skip link and a demo's strip
start where the frame's words do.

The bar is `--dk-app-bar` tall, 4rem, or taller where a long title wraps, which it does within the
room the mark and the action leave. On a phone at a large text size, under 16rem wide, the title
takes a row of its own under the mark and the action, across the bar's whole width, keeping its size
and every word, and it stays first in the markup. On a wide screen the frame stays within
`--dk-app-column`, 28rem, in the middle. Where the rows come to more than the screen and the page
scrolls whole, a swipe that reaches the body's end carries on to the page, so the dock and the tab
bar below are reached the same way. The page under the frame neither reloads on a pull past the top
of the body nor bounces. The body is the containing block for what it holds, so a menu that should
draw over the frame is drawn in the top layer, as a `popover` is, not by `position: absolute` alone.

On a screen less than 24rem tall, a phone on its side or a page zoomed until its window is a few
lines tall, the frame is as long as what it holds and the page scrolls whole, so the bar and the
dock never squeeze the body out of reach. On a phone on its side the frame pads past a side safe
area only by what the column's own margin does not already clear. On paper the frame is as long and
as wide as what it holds and the body prints whole.

</details>

### A compact action beside the main one

<!-- example: dockInline -->

```html
<section class="dk-app-dock" aria-label="Actions">
    <div class="dk-app-dock-inline">
        <button type="button" class="dk-button dk-button-tall">Scores</button>
        <button type="button" class="dk-button dk-button-accent dk-button-tall">
            Save the round
        </button>
    </div>
</section>
```

Where a screen has a compact action beside its main one, such as Scores beside the button that moves
a round on, `dk-app-dock-inline` holds the two on one row: the compact action at its own width and
the main one taking the rest, never under the target's width or its own longest word, its words
wrapping inside it where they must, and the two stretched to one height. Each keeps the target as
its least width, with a step less padding at its sides, so at twice the text size on a 320px phone a
compact word such as Scores still shares the row, and the main action can be narrower than it is
tall, though never under the target. Where the two cannot share it, as a compact word as long as
Scoreboard or a compact action of several words cannot at that size, they take two rows rather than
scroll the page sideways or cut a word. Keep the compact action to a short word. The main action is
last, so it sits nearest the thumb and comes last in the keyboard's order, after the one used now
and then.

## Tab bar

A tab bar holds an app's top-level places at the bottom of a phone, under the thumb. It is a `nav`
holding a list of links, from two to five, each a label with room for an icon over it.

<!-- example: tabBar -->

```html
<nav class="dk-tabbar" aria-label="Sections">
    <ul>
        <li>
            <a href="/" aria-current="page">
                <svg class="dk-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                    ...
                </svg>
                Play
            </a>
        </li>
        <li>
            <a href="/history/">
                <svg class="dk-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                    ...
                </svg>
                History
            </a>
        </li>
        <li>
            <a href="/players/">
                <svg class="dk-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                    ...
                </svg>
                Players
            </a>
        </li>
    </ul>
</nav>
```

Each place has an address, so the links are links and take no tab role. The link for the place the
visitor is in carries `aria-current="page"`, or `aria-current="true"` on a page beneath that place,
and is drawn in the page's text color at the strong weight under an accent line, so it is told apart
by more than its color. Every link has a label, one short word where it can be, since five links
share a phone's width. An icon is an `svg` before the label, hidden from a screen reader, which the
bar draws at 1.5rem.

In an app's frame the bar is the frame's last part, `class="dk-app-tabs dk-tabbar"`, after the dock
in the keyboard's order, and the frame keeps it clear of the home indicator. On a page that scrolls
whole, the bar is the last child of an element with `dk-tabbar-page`, the `body` as a rule:

```html
<body class="dk-tabbar-page">
    <main>...</main>
    <nav class="dk-tabbar" aria-label="Sections">...</nav>
</body>
```

Such a page says `viewport-fit=cover` in its viewport meta, as a frame's does, which is what gives
the safe area tokens their values. `dk-tabbar-page` makes its element a column, so the page's other
children are that column's items, each as wide as the column unless it sets a width of its own.

<details>
<summary>How the bar is drawn</summary>

The links share the bar's width evenly, and each is at least `--dk-target-large` tall. A label
wraps within its share at a large text size and the bar grows with it, so nothing is cut off.

`dk-tabbar` draws the bar and places nothing. `dk-tabbar-page` is the app's column, as a frame is:
`--dk-app-column` wide at most, in the middle of a wide screen, at least as tall as the screen, and
padded past the side safe areas. The bar in it sticks to the bottom of the screen while the page
scrolls, over the page at `--dk-stack-bar`, and pads itself past `--dk-safe-bottom`. In a picture
the page is as tall as what it holds and its bar sits at its foot, raised over nothing and with no
room for a phone's edges. On a short page it is still at the bottom. At the page's end it sits after
the last of the content and never over it, so the page pads by no height. The page's root has a
`scroll-padding-bottom` of the bar's height with a label on two lines, so what the keyboard reaches,
or a link within the page leads to, stops short of the bar and is never under it, in a browser with
`:has()`. A label that wraps past two lines makes the bar taller than that, so a label is a short
word or two.

On a screen less than 24rem tall, a phone on its side or a page zoomed until its window is a few
lines tall, the bar scrolls with the page and waits at its end, so it takes no part of a screen that
short. So it does on a screen less than 18rem wide, a phone at a large text size, where its labels
wrap further than the room the page could keep for them.

Only the current link has a line, and the others are padded to its depth, so forced colors draw one
line, and there the current link stands on `Highlight`, as the current tab and pill do. A tab bar
does not print, and a page that ends in one prints as long as what it holds.

</details>

## Stepper

A stepper is a field for a small whole number, such as a bid from nothing to ten, that is quicker
to step than to type on a phone: a number field with a button to lower the value before it and one
to raise it after.

<!-- example: stepper -->

```html
<div class="dk-field dk-stepper-inline">
    <label class="dk-field-label" for="players" id="players-label">Players</label>
    <p class="dk-field-error dk-stepper-range" id="players-range" hidden="">
        <span class="dk-visually-hidden">Error: </span>
        Enter a whole number from 2 to 8.
    </p>
    <div class="dk-stepper dk-stepper-tall" role="group" aria-labelledby="players-label">
        <button type="button" class="dk-button dk-stepper-down" aria-controls="players" hidden="">
            <span aria-hidden="true">−</span>
            <span class="dk-visually-hidden">Lower the number of players</span>
        </button>
        <input
            class="dk-input dk-stepper-value"
            type="number"
            inputmode="numeric"
            min="2"
            max="8"
            step="1"
            id="players"
            value="4"
        />
        <button type="button" class="dk-button dk-stepper-up" aria-controls="players" hidden="">
            <span aria-hidden="true">+</span>
            <span class="dk-visually-hidden">Raise the number of players</span>
        </button>
        <span class="dk-visually-hidden dk-stepper-limits" id="players-limits"></span>
        <span class="dk-visually-hidden dk-stepper-status" role="status"></span>
    </div>
</div>
```

```js
import { attachStepper } from '@jasonsdevspace/design-kit/controls';

attachStepper(document.querySelector('.dk-stepper'));
```

It is the kit's field, so its label, hint and error work as every field's do, around a native `input
type="number"` that says its value to a screen reader. Most screen readers do not say a number
field's limits, so once attached the field is described by its range in words, such as "From 2 to
8.", after any description the page gives it, from a span out of sight with `dk-stepper-limits`,
which the attach function fills and follows as the limits change, or "Only 3." where the least and
the greatest are one value. A page no longer states the range in its hint, which would read it
twice. While the stepper's error shows, the error, which names the range, describes the field in its
place. The buttons are hidden until `attachStepper(element)` shows them, so without script it is a
number field alone, and they are named for what they do and to which field, "Lower the number of
players" and "Raise the number of players". A status line out of sight says the value a press sets,
since focus stays on the button, and that it is the least or the most where a press lands on a
limit, as "8, the most", or on the last value a step reaches short of the greatest, so a press that
does nothing next is expected. The line is emptied once the value is typed over, its form is reset
or the stepper is taken down, by the function `attachStepper(element, { signal })` returns or by its
`signal`. Its box is a group named by the label, with `role="group"` and `aria-labelledby` naming
the label's id, so the place focus may land has a name. A stepper taken down while one of its
buttons has focus hands focus to the value where the value is read only and enabled, and otherwise,
or where the value refuses focus, to the box, so a keyboard user keeps their place and an editable
value does not open a phone's keyboard. Where the box has no tabindex, the kit gives it one of -1 as
focus goes to it, and leaves it there, so a script can focus the box while the tab order passes it
by. A tabindex the page gave the box is kept, and the box draws the kit's focus ring where the
browser shows focus. Where the box refuses focus too, the tabindex it was given goes again at once,
and focus goes on to the app frame's body or the page's main content, as it does from a toast, a
dialog or a panel.

A page that says something of its own after each press, such as how many tricks are still to enter,
gives `attachStepper` its words as `words`, a function of the value read as the message is put on
the line, a moment after the press, so the page's own state has caught up with it. One message then
says the value and the page's words, "2, the most. Every trick is in.", rather than two lines
changing at once, which can drop one. A page with a status line of its own gives it as `status`, and
the stepper says each press there in place of its own line, where it leaves as every message there
does, and clears only what it said there when the value is typed over, the form is reset or the
stepper is taken down, so the page's own words stay. A page that has a function for its line
already, as React's `useStatus` returns, gives it as `say`, and each press is said through it, and
is the one used where both are given. Words said through it leave when the line's time for them is
up, since the stepper cannot take them back from a function. A message still waiting then is not
said. Options given when the stepper is attached again take the place of the last, by the rule
[Taking a control down](#taking-a-control-down) sets for whose options apply. A stepper taken down
and attached again as focus leaves it, as a page that checks a field on leaving and draws it again
does, keeps its buttons.

```js
attachStepper(document.querySelector('.dk-stepper'), {
    status: document.querySelector('#page-status'),
    words: (players) => `${players} seats at the table.`,
});
```

```tsx
const say = useStatus();
const box = useRef<HTMLDivElement>(null);
useEffect(() => {
    const stepper = box.current?.querySelector<HTMLElement>('.dk-stepper');
    return stepper ? attachStepper(stepper, { say }) : undefined;
}, [say]);
// <div ref={box}><StepperField id="seats" label="Seats" min={2} max={8} /></div>
```

`StepperField` draws it, taking `min`, `max` and a `step` of 1 unless given. Its `subject` is the
words after Lower and Raise, the label unless given, and a label that is more than words needs one.
`inline` puts the label to the left on one line with the stepper, and `tall` gives the buttons the
larger target. A field whose least value is below nothing asks a phone for its full keyboard, since
the numeric one has no minus. A value that needs more than two figures, such as a score in the
hundreds, takes `--dk-stepper-digits` in the page's sheet, so the value is never cut.

A press steps the value by the step, and one that changes it fires the `input` and `change` events a
typed value fires. A button that would pass the least or the greatest value is off, by
`aria-disabled` so focus stays on it, as both are on a field that is disabled or read only, and a
press of an off button does nothing. Each press reads the value again first, so a value a script or
a form's reset set is followed. The field still takes a typed value. One outside the limits, none at
all, or between steps, such as 2.5 with a step of 1, shows the stepper's own error, which waits
hidden in the markup, once the value is changed, and the status line says it. A refusal the page
sets of its own with `setCustomValidity` is left to the page. A value drawn outside the limits or
between steps shows the error as the stepper is attached, and again when a form's reset brings it
back, with nothing said, so a page that draws that state writes no code of its own for it. A field
drawn blank shows none until it is changed, so a stepper attached again, as on a remount, shows the
error for a value past its limits but not for a field left blank. A field that is disabled or read
only shows none, since no one can put it right, and where the page draws its own error in the field,
the page's error is the one shown as the page loads. The error is cleared as soon as the value is
right again, and the attach function adds and takes away only its own error, so an error or a hint
the page draws keeps its place. A page that draws the field again, as React does when the page's own
error comes or goes, rewrites the field's description and its invalid mark, and the attach function
puts its shown error back in both at once. It takes the stepper or its field, attaches each stepper
once whichever it is given, and returns what takes it down again.

**`StepperField` props**

| `StepperField`        | Default                                         | What it does                                                                                     |
| --------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `label`               | required                                        | Names the field                                                                                  |
| `min`, `max`          | required                                        | The least and the greatest value                                                                 |
| `step`                | `1`                                             | What a press adds or takes away                                                                  |
| `subject`             | the label, where it is words                    | The words after Lower and Raise in the buttons' names, needed where the label is more than words |
| `rangeError`          | a sentence giving the limits and any step but 1 | What a value the field refuses is told, such as `'Enter a whole number from 2 to 8.'`            |
| `inline`              | `false`                                         | Puts the label to the left, on one line with the stepper                                         |
| `tall`                | `false`                                         | Draws the buttons and the value at `--dk-target-large`                                           |
| `hint`, `error`, `id` | none                                            | As for every field                                                                               |
| `mark`, `markWords`   | as a field's                                    | As for every field                                                                               |

<details>
<summary>How a stepper is drawn</summary>

The buttons are `--dk-target` both ways, or `--dk-target-large` in a tall stepper. Where a large
text size leaves the stepper less room than its buttons take, on a phone, the buttons grow narrower,
never under the target at the usual text size, and keep their height, so the stepper fits its field,
in an app's dock too. A stepper's field with its label above is in turn never narrower than the
stepper at that least width, in a browser with `:has()`, wherever the page's row leaves its items
their own least width, so beside a text field the field keeps its stepper and the row's other fields
take the room left. The stepper alone sets that width, so a long word, a picture or words that never
wrap in its label, hint or error leave the field as wide as its stepper. A row whose items or tracks
have no least width, such as `min-width: 0` or `minmax(0, 1fr)`, can still squeeze the field below
its stepper, which is the row's choice. A stepper's field with its label to the left keeps that
least width in such a row too, in every browser, its stepper moving under the label where the row
leaves no room for both. Set beside other fields in a `dk-fields` row, as [fields side by
side](#fields-side-by-side) shows, the stepper's field starts from the row's length, wider than a
stepper of two figures, and a field with no room left beside it moves to a line of its own. In a
page's own row that cannot wrap, the stepper's field keeps its least width and the fields beside it
take what is left, which at a large text size can be too little for a word in their labels. The
value is in the mono face with figures of one width, centered, with room for two figures unless
`--dk-stepper-digits` says more, and for the spacing between letters WCAG asks a page to allow, so
the field does not change width as the value changes and no figure is cut off, and in a tall stepper
it is at the heading size. Its height, edge included, is its buttons', so it stands level with them.
At 48rem wide or less, in an app's frame and on a page that ends in a tab bar, where a field and a
button are the target tall, a stepper that is not tall stands level with one beside it. With its
label to the left the label takes the room the stepper leaves and wraps within it, and the stepper
moves under the label where a large text size leaves no room for both. Its errors sit on lines above
it, as every field's do, and its hint on a line below, which only the inline stepper does. In a
stepper with its label above, the hint sits under the label and over the errors, as in any field.
The number field's own spin buttons are taken away, since the stepper's buttons stand in for them
and they would keep their room even out of sight.

</details>

## Toast

A toast is a short message that appears over the page, says what just happened and offers one
action, such as Undo, in place of asking before a save or a delete. The markup holds its live region
and its two buttons, empty and hidden, in the group that keeps them together, and draws nothing
until a message is shown.

<!-- example: toast -->

```html
<div class="dk-toast">
    <p class="dk-toast-message" aria-hidden="true"></p>
    <p class="dk-visually-hidden dk-toast-status" role="status"></p>
    <div class="dk-toast-buttons">
        <button
            type="button"
            tabindex="0"
            class="dk-button dk-button-text dk-toast-action"
            hidden=""
        ></button>
        <button
            type="button"
            tabindex="0"
            class="dk-button dk-button-text dk-button-quiet dk-toast-close"
            hidden=""
        >
            <span aria-hidden="true">×</span>
            <span class="dk-visually-hidden">Close</span>
        </button>
    </div>
</div>
```

```js
import { attachToast } from '@jasonsdevspace/design-kit/controls';

const show = attachToast(document.querySelector('.dk-toast'));
show('Round 3 saved.', { label: 'Undo', onAction: () => undoLastRound() });
```

`attachToast(element)` returns the function that shows a message, with one action or none. The
message is drawn in the toast and said on its status line, which is out of sight and on the page
from the start, so a screen reader hears it without focus moving. The line keeps the message until
the toast leaves, and is the one copy a screen reader reads, since the words drawn are hidden from
it. With an action, the line says its name too, as in "Round 3 saved. Undo is available.", so a
visitor who cannot see the toast learns there is a way back, and the same words shown twice are
heard twice. The function returns what dismisses that message, which does nothing once another has
replaced it or it has gone. A shown toast is drawn from its `data-shown` attribute, which a page
that draws the toast again, as React does when its class changes, leaves alone. `dk-toast-shown` is
still set beside it for a page that reads the class, though such a redraw takes it away while the
toast stays shown, so `data-shown` is the one to read.

A toast leaves when its close button, its action, or Escape with focus in it dismisses it, or the
next message replaces it. One with an action stays until then, since a timer would take the action
away from anyone slower than it. One with no action also leaves after five seconds, a wait held
while the pointer is over it or focus is in it. When a message arrives, what has focus stays in
view, scrolled clear of the toast where the toast, measured where it comes to rest, would cover it.
A control counts as covered only where it meets the toast across as well as down, so one beside a
narrow toast on a wide screen stays where it is. With focus inside a frame of the page's own origin,
that is the control that has focus there, which the toast reads as the message comes and measures
where the frame places it, past the frame's border and padding, scaled across and down as the frame
is drawn and cut to what the frame shows inside its scrollbars, so a tall frame does not hide it. A
control the frame has scrolled out of its own sight is left where it is, and a frame rotated or
skewed is measured by its bounding box. WebKit 27.2 lays out the document of a frame scaled by
`zoom` larger than it draws it, so there a control in such a frame can sit past what the frame shows
and be left where it is. A frame of another origin, whose controls a page cannot reach, or one where
only its body has focus, is measured whole. A control taller than the room above the toast, such a
frame included, is left where it is. When a toast leaves with focus in it, focus goes to the first
of these that takes it: the control focus last came into the toast from, then the control outside
the toast that had focus as the latest message came, then the body of the app's frame, or on a page
with no frame its main content where that takes focus, as the `tabindex="-1"` the skip link's markup
puts on it lets it. The first is passed over where focus last came into the toast from nowhere. So a
keyboard user who moved on from where they were as the message came lands where they left off. Its
Close and its action carry `tabindex="0"`, which `Toast` draws and `attachToast` adds where a page's
markup has none, so Safari, which focuses a pressed button only where it has a tabindex, leaves
focus in the toast on a press and focus goes back as the toast leaves. An action runs after the
toast has left, so where it takes away what focus came from, it moves focus itself. A message with
no action replaces one with an action and its way back, so a page shows one another only when the
first is done with. More than one action is a dialog's job.

Focus leaves the toast where nothing on that list takes it, so it falls to the page's body in every
engine rather than staying on the toast's hidden button. The toast takes off its shown state before
it hands focus back, so the room the sheet keeps under a shown toast does not scroll the control
focus goes to. Where a page's own listener moves focus elsewhere as the toast hands it back, the
toast goes no further down the list and that focus stays. A page sees focus inside a frame only as
the frame, and focus that comes into the toast from inside a frame as coming from nowhere. Where the
toast's handback focuses a frame of the page's own origin, it goes on to the control that had focus
there as the latest message came, which the toast reads as the message comes. It stays on the frame
where that control is gone, marked off, on a page the frame has since replaced, and on a frame of
another origin, whose controls a page cannot reach. A frame inside that frame is not followed, so
focus goes back to the inner frame rather than to the control inside it. Firefox does not focus a
frame of another origin while a key is being pressed, so a dismiss by keyboard there goes on down
the list, to the body of the app's frame or the main content.

A page that takes a toast down while the toast stays on the page, such as on a screen it draws
itself, attaches it as `attachToast(element, { signal })`, as [Taking a control
down](#taking-a-control-down) has it. Taken down, the toast dismisses its message as its Close does,
takes off its listeners, its observer, its listener on the window's size and its timer, takes away a
tabindex it added that the page has not changed since and lets its line go. Focus goes back where a
dismiss sends it only where it is in the toast, inside a shadow tree within it or on a control
slotted into it too, or where the page has taken the toast away with focus in it so that focus has
fallen to the body or to nothing, while focus a visitor has put anywhere else stays. A toast missing
a part is refused even with a signal already aborted.

One toast serves a page. In an app's frame it sits in the frame's place for it, `dk-app-toast`,
floating over the foot of the body just above the dock, so it never moves the dock, and the body
pads so its last line scrolls clear of it. On a page with no frame of its own it sits at the bottom
of the screen, over the page and clear of the safe areas, in the app's column. While it is shown
there, what the keyboard reaches stops short of it and the page's end scrolls clear of it, by the
rows the toast takes, two at least and five at most, which its attach function marks in its
`data-rows` attribute as it shows and while it stays. A message longer than five rows can cover what
the keyboard reaches, so a toast's message is a short sentence. A page that ends in a tab bar and
shows toasts is drawn in the frame, where the toast clears the bar. A toast shown while a dialog is
open sits under the dialog's scrim, out of sight and out of a screen reader's reach, so a page shows
its message once the dialog has closed.

**`Toast` props**

| `Toast`     | Default | What it does                                               |
| ----------- | ------- | ---------------------------------------------------------- |
| `className` | none    | A page's class, after the kit's                            |
| `ref`       | none    | The toast drawn, for a page that hands it to `attachToast` |

<details>
<summary>How the toast is drawn</summary>

Shown, the toast is a raised card on `--dk-raised` with an edge in the line color, which forced
colors draw where the shadow is gone. It rises into place over `--dk-duration-medium` as it arrives,
at once for a visitor who asks for less motion. A message that replaces one still shown takes its
place in the card without rising again, since the toast stays shown. A message of a few lines wraps
beside the buttons. Where the buttons do not fit beside the message, as on a phone at a large text
size, with a long action or in a frame narrower than the screen, their group takes the row under it,
at its end, the action and the close button together. A toast written before 0.7.0, with no group,
does so only on a screen under 20rem wide. The close button carries `dk-button-quiet` beside
`dk-toast-close`, and that class alone draws it, so it stays quiet beside the action, and is the
target both ways at every width. Outside a frame the toast sits at `--dk-stack-toast`, over a bar. A
toast does not print.

</details>

## Button grid

A grid of buttons is a set picked from, such as the cards in a hand, each a toggle that says
whether it is on, or a pad of plain keys that act when pressed, as a number pad's do. It is classes
alone, since the cells' state is the page's.

<!-- example: buttonGrid -->

```html
<div class="dk-button-grid" role="group" aria-label="Cards in hand">
    <button type="button" class="dk-button" aria-pressed="true">7</button>
    <button type="button" class="dk-button" aria-pressed="false">8</button>
    <button type="button" class="dk-button" aria-pressed="true">9</button>
    <button type="button" class="dk-button" aria-pressed="false" aria-disabled="true">10</button>
</div>
<div class="dk-button-grid dk-button-grid-tall" role="group" aria-label="Score">
    <button type="button" class="dk-button">1</button>
    <button type="button" class="dk-button">2</button>
    <button type="button" class="dk-button">
        <span aria-hidden="true">⌫</span>
        <span class="dk-visually-hidden">Delete</span>
    </button>
</div>
```

The grid is a `role="group"` named for what it holds, by `aria-labelledby` where the screen shows
that name already, and each cell is a kit button, never an accent one, since a filled cell reads as
a toggle that is on. A toggle carries `aria-pressed`, so a screen reader says whether it is on, and
acts at once, so it is never a checkbox in a form. A plain key carries no pressed state, and is
named for what it enters, with a name out of sight where its face is a symbol, as Delete is above. A
grid where only one can be on is a choice field.

A cell marked `aria-disabled` keeps its place in the tab order and still fires its click, so the
page's handler ignores it, as the kit's `Button` does when it is off. Each cell is a stop for the
Tab key. A page with many cells gives the group one stop instead with
`attachRoving(grid, { signal })` in `./controls`, or `useRoving()` in React, so the arrow keys move
between cells and Home and End reach the ends. Up and down move to the nearest cell in the row above
or below as the grid is drawn, so it holds at any count of columns, left and right follow the page's
reading direction, and an arrow held with Alt, Control or Command is left to the browser. A cell
marked off keeps its place, a cell that is disabled or out of sight is passed over and never the
stop, and where the cell that had focus is taken out, focus goes to the next cell still there, or
the one before. A grid attached while it is drawn at no size, as in a closed `details` or under
`hidden`, places its stop as it comes into sight, and a cell a page's rule hides as it resizes the
grid hands the stop on. A grid with the group's role, as above, or none takes the toolbar's while
attached, so a screen reader says the arrows move within it, and keeps its `aria-label`, which a
toolbar needs. Taken down, as [Taking a control down](#taking-a-control-down) has it, each cell
takes back its own tabindex and the grid its own role.

The page sets how many columns it wants in `--dk-button-grid-columns`, in its own sheet, three
unless it does:

```css
.hand {
    --dk-button-grid-columns: 6;
}
```

<details>
<summary>How the grid is drawn</summary>

Where the columns asked for would make a cell narrower than `--dk-target`, the grid draws fewer.
A grid of four, six, eight, nine, ten or twelve cells draws the most columns that fit and divide its
cells evenly, so six cells asked for in six columns, in an app's frame on a phone 320px wide inside
its 1rem gutters, draw as two rows of three, never five and one. Where none larger fits, the grid
draws two columns, and where not even two fit, one. A grid of fewer cells than the columns asked
for keeps them in one row wherever they all fit. A grid of any other count, such as thirteen, draws
as many as fit, five on that phone. Where the columns asked for fit, the grid draws them, whatever
count of cells it holds, and the grid counts its cells again as a page adds or takes one away.
Each cell is at least the target tall. In a `dk-button-grid-tall` grid each is at least
`--dk-target-large` both ways, for keys pressed at arm's length, and a `dk-button-tall` cell is that
tall in any grid. The cells are spaced by 0.5rem, and a label wraps within its cell at a large text
size. The grid takes the width of what holds it, so it sits in a block with a width of its own,
never in a box that shrinks to fit what it holds, where it would draw one column.

A toggle that is on is filled in the text color with the page's ground as its words, at the strong
weight, so on and off differ by how light the cell is and by weight, not by hue alone, and the
accent is left to the one action the view leads with. Under a pointer its edge turns to the accent,
text selected on it swaps the pair so it stays in sight, and forced colors fill it in the system's
selection colors. A cell that is off, by `disabled` or by `aria-disabled`, has a dashed edge and
keeps the page's text color, where a faded one is hard to tell from a toggle that is only not
pressed, and in forced colors takes the system's gray as any off button does. One that is off and on
keeps a thicker edge in the control's color, or in the highlight in forced colors, and the strong
weight of a toggle that is on. A cell reads the button's `--dk-button-shadow` and
`--dk-button-press`, so a page that sets them gives every cell a shadow and a press, and a toggle
that is on rests where a held one lands.

</details>

## Rows

A list of rows holds the games played, the players or the steps to install: each row a title, a
muted line of detail under it, and room at its end for a figure, a tag, one button or a group of
buttons, with a rule between rows. It is classes alone, since a row holds no state of its own.

<!-- example: rows -->

```html
<ul class="dk-rows" role="list">
    <li>
        <a class="dk-row" href="/games/12/">
            <span class="dk-row-text">
                <span class="dk-row-title">Flip 7</span>
                <span class="dk-visually-hidden">, </span>
                <span class="dk-row-detail">Four players, won by Ana</span>
            </span>
            <span class="dk-visually-hidden">, </span>
            <span class="dk-row-figure">
                212
                <span class="dk-visually-hidden"> points</span>
            </span>
            <span class="dk-row-sign" aria-hidden="true">›</span>
        </a>
    </li>
    <li>...</li>
</ul>
<ul class="dk-rows" role="list">
    <li>
        <div class="dk-row">
            <span class="dk-row-text">
                <span class="dk-row-title">Ana</span>
                <span class="dk-row-detail">Played 12 games</span>
            </span>
            <button type="button" class="dk-button dk-button-text">
                Remove
                <span class="dk-visually-hidden"> Ana</span>
            </button>
        </div>
    </li>
    <li>...</li>
</ul>
```

The list is a `ul` with `role="list"`, since Safari drops a list's role from one drawn with no
bullets, and with it the number of rows a screen reader says. A list with no rows is not drawn, so
a page puts an empty state in its place, as below.

A row is a link or holds a button, never both, so a tap never does two things. A row that leads
somewhere is one `a.dk-row` across its width, one stop for the keyboard, ending in a chevron, a
`dk-row-sign` hidden from a screen reader, that says so on a phone, where nothing hovers. It is
named by all of its words with the title first, so a screen reader says the title before the rest,
and a visitor who speaks to their device can say any of what they see. A comma out of sight after
the title and before the figure makes a pause between them when read aloud, and a figure's unit out
of sight says what it counts. A row with an action of its own, such as removing it, is a
`div.dk-row` with the button at its end, named for what it does and to which row, with the row's
name out of sight where the button's face says only the action. An action that removes a row acts at
once with a toast that offers Undo, as the kit's app does in place of asking first. A figure at the
end is a `dk-row-figure`, and a tag a `dk-pill`.

<details>
<summary>How the rows are drawn</summary>

Each row is at least `--dk-target` tall, and at least `--dk-target-large` in a list whose classes
are `dk-rows dk-rows-tall`. A row pads each side by the room a focus ring takes. In an explainer, a
panel, a callout, an app's body or a dialog it reaches past the column by as much, as the pills and
the choices do, so its words start on the column's line, while a list at a page's bare edge or in a
table's cell keeps its rows inside it, so nothing scrolls sideways. A button at its end sits in the
middle of its height. The rule between rows is in the line color, which forced colors keep as an
edge, and a row takes no ground of its own, so a list sits on a page or a panel alike. The end sits
on the line of the title's first line, so a long title wraps and the row grows with its end still
beside where the title starts, and a row of one line sits in the middle of its height.

A link row's chevron is in the muted color. Its focus ring is drawn inside it, around the whole row,
and a pointer over it, or a thumb pressing it, underlines the title. A figure is in the mono face
with figures of one width, so a column of them lines up.

</details>

### An empty state

A list, a table or a set of rows with nothing in it yet draws a `dk-empty` in its place: what is
missing, in words, and the next step as a button under it, with no picture needed:

<!-- example: empty -->

```html
<div class="dk-empty">
    <p>No players yet.</p>
    <button type="button" class="dk-button">Add a player</button>
</div>
```

The words are the muted text at the body size, and the empty state has no ground and no edge, so it
never reads as a callout. Its sides are a row's, so its words start where a row's title would, on
the column's line in a page, a panel, a dialog or an app's body and inside a bare edge, with
`--dk-space-3` above and below. Its button is a plain `dk-button`, never the accent one, since the
accent action is the dock's, and a screen whose add control is already in view leaves it out and
says in the words where that control is. It is not live: it is read where it is, as the list would
be.

A list a visitor empties, as a search that matches nothing does, says so on the screen's
[status line](#status-line) once they stop typing, naming what they searched for so a typo is
heard, and its empty state offers to clear the search. Clearing it takes away the button just
pressed, which a keyboard or a screen reader was on, so focus goes back to the search field, with
the whole list under it again:

<!-- source: games -->

```tsx
import { useId, useState } from 'react';

import { Button, InputField, useFocusAfterDraw, useStatus } from '@jasonsdevspace/design-kit/react';

const GAMES = ['Flip 7', 'Skyjo', 'Wizard'] as const;

/** The games whose names hold the search, matched whatever the case. */
const matching = (search: string) =>
    GAMES.filter((game) => game.toLowerCase().includes(search.trim().toLowerCase()));

/** What the empty state and the status line say when the search matches nothing. */
const noMatch = (search: string) => `No games match “${search.trim()}”.`;

/** What the status line says once a visitor stops typing. */
const counted = (search: string) => {
    const found = matching(search).length;
    if (found === 0) return noMatch(search);
    return `${String(found)} ${found === 1 ? 'game matches' : 'games match'}.`;
};

/**
 * Saved games narrowed by a search, under a `StatusProvider`. A search that matches nothing puts
 * the empty state in the list's place, with a way to clear the search.
 */
export const Games = () => {
    const [search, setSearch] = useState('');
    const field = useId();
    const say = useStatus();
    const focusNext = useFocusAfterDraw();
    const shown = matching(search);
    const clear = () => {
        setSearch('');
        say(`Search cleared, ${String(GAMES.length)} games.`);
        // The empty state and the button pressed go, so focus goes back to the search.
        focusNext(field);
    };
    return (
        <section className="dk-stack dk-stack-heading" aria-labelledby={`${field}-heading`}>
            <h2 id={`${field}-heading`}>Saved games</h2>
            <InputField
                id={field}
                label="Search the games"
                type="search"
                value={search}
                onChange={(event) => {
                    setSearch(event.target.value);
                    say(counted(event.target.value), { settle: 700 });
                }}
            />
            {shown.length > 0 ? (
                <ul className="dk-rows" role="list">
                    {shown.map((game) => (
                        <li key={game}>
                            <a
                                className="dk-row"
                                href={`/games/${game.toLowerCase().replaceAll(/\s+/g, '-')}/`}
                            >
                                <span className="dk-row-text">
                                    <span className="dk-row-title">{game}</span>
                                </span>
                                <span className="dk-row-sign" aria-hidden="true">
                                    ›
                                </span>
                            </a>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="dk-empty">
                    <p>{noMatch(search)}</p>
                    <Button onClick={clear}>Clear the search</Button>
                </div>
            )}
        </section>
    );
};
```

### A row with several buttons

<!-- example: rowActions -->

```html
<ul class="dk-rows" role="list">
    <li>
        <div class="dk-row">
            <span class="dk-row-text">
                <span class="dk-row-title">Ana</span>
                <span class="dk-visually-hidden">, </span>
                <span class="dk-row-detail">Seat 1</span>
            </span>
            <span class="dk-row-actions">
                <button type="button" class="dk-button dk-button-icon" aria-disabled="true">
                    <svg class="dk-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                        <path d="M12 19V5M6 11l6-6 6 6"></path>
                    </svg>
                    <span class="dk-visually-hidden">Move Ana up</span>
                </button>
                <button type="button" class="dk-button dk-button-icon">
                    <svg class="dk-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                        <path d="M12 5v14M6 13l6 6 6-6"></path>
                    </svg>
                    <span class="dk-visually-hidden">Move Ana down</span>
                </button>
                <button type="button" class="dk-button dk-button-icon">
                    <svg class="dk-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                        <path d="M6 6l12 12M18 6L6 18"></path>
                    </svg>
                    <span class="dk-visually-hidden">Remove Ana</span>
                </button>
            </span>
        </div>
    </li>
    <li>...</li>
</ul>
```

A row whose end holds more than one button, such as a seat's move up, move down and remove, puts
them in a `dk-row-actions` group after its text, a step apart. The text keeps room for about twelve
characters of its own size beside the group, and where the row has less, at a large text size or on
a narrow phone, the group moves under the text to the row's end, so a name reads across rather than
down the screen a letter at a time. Every row in a list moves its group at the same size, so the
buttons stay in one column down the list. A group wider than the row, at twice the text size on the
narrowest phone, wraps inside itself, and a row with a picture keeps it beside the text. The buttons
keep their order, and the keyboard reaches them after the row's text, as it does one button. A row
with one button at its end needs no group.

Each button is named for what it does and to which row, as a single one is, with the name out of
sight where the button shows only an icon. A button that cannot act for this row, such as the first
seat's Move up, is off with `aria-disabled="true"` rather than taken away, so the buttons keep their
places down the list, and a press of it that moved the seat to the top keeps focus on it.

### A row with a picture

<!-- example: rowPicture -->

```html
<ul class="dk-rows" role="list">
    <li>
        <a class="dk-row" href="/players/ana/">
            <img class="dk-row-picture" src="/players/ana.jpg" alt="" loading="lazy" />
            <span class="dk-row-text">
                <span class="dk-row-title">Ana</span>
                <span class="dk-visually-hidden">, </span>
                <span class="dk-row-detail">Played 12 games</span>
            </span>
            <span class="dk-row-sign" aria-hidden="true">›</span>
        </a>
    </li>
    <li>...</li>
</ul>
```

A `dk-row-picture` as a row's first child, such as a player's face, sits at the row's start in a
column of its own, so every title in the list starts on one line. It is `--dk-target` wide and tall
and cropped to fill that square, or the size a page sets with `--dk-row-picture-size`, with the
kit's corners, and never more than a quarter of the screen's width, so the text keeps its room on a
phone. The title names the link, so the picture has empty alt text, and the link's name starts with
its title. It sits inside the room the row keeps for its focus ring, so the ring never covers it.

### Tiles

A list of tiles offers a few places to go, such as the games to start, each on a ground of its own.

<!-- example: rowTiles -->

```html
<ul class="dk-rows dk-rows-tiles" role="list">
    <li>
        <a class="dk-row game-flip-7" href="/new/?game=flip-7">
            <span class="dk-row-text">
                <span class="dk-row-title">Flip 7</span>
                <span class="dk-visually-hidden">, </span>
                <span class="dk-row-detail">3 or more players</span>
            </span>
            <span class="dk-row-sign" aria-hidden="true">›</span>
        </a>
    </li>
    <li>...</li>
</ul>
```

```css
.game-flip-7 {
    --dk-tile-ground: light-dark(rgb(255 236 214), rgb(74 46 20));
}
```

A list of tiles is a list of rows with `dk-rows-tiles` beside `dk-rows`, each a link row on a ground
of its own. The page sets the ground with `--dk-tile-ground` by a class of its own on the row, never
a style attribute, which a strict `style-src` refuses, and chooses a ground that holds the title and
the muted detail at 4.5 to 1, and the muted sign at 3 to 1, in both themes, such as with
`light-dark()`. A ground that holds the title can still leave the detail or the sign faint, so the
page checks each. The focus ring sits outside the tile, on the ground the kit holds it to, so a
tile's ground asks nothing of it. A tile keeps what a link row has: the sign that says it leads
somewhere on a phone, where nothing hovers, its title underlined under a pointer and under a
pressing thumb, and its focus ring, drawn outside it, as a separate control's is. A tile casts no
shadow, so a raised panel above the list stays the one thing lifted, and a page that wants its tiles
lifted sets `--dk-tile-shadow`, such as to `var(--dk-shadow-resting)`. A list with no tiles is not
drawn, as a list of rows is not.

A tile takes a picture at its start as a row does. Where it sits in a panel and the page sets no
ground, a tile steps off the panel's ground, as a code block does, to the page's ground in a plain
panel and to the card's, `--dk-surface`, in a raised one.

#### Tiles in columns

<!-- example: tileColumns -->

```html
<ul class="dk-rows dk-rows-tiles dk-rows-columns" role="list">
    <li>
        <a class="dk-row" href="/design-kit/buttons/">
            <img
                class="dk-row-picture"
                src="/previews/buttons.png"
                alt=""
                width="480"
                height="270"
                loading="lazy"
            />
            <span class="dk-row-text">
                <span class="dk-row-title">Buttons</span>
                <span class="dk-visually-hidden">, </span>
                <span class="dk-row-detail">Every kind and state</span>
            </span>
            <span class="dk-row-sign" aria-hidden="true">›</span>
        </a>
    </li>
    <li>...</li>
</ul>
```

`dk-rows-columns` beside `dk-rows-tiles` flows the tiles into as many columns as fit, each at least
`--dk-tile-least` wide, in the order they are written, row by row, so the keyboard visits them as
they are read. On a phone they fall to one column, and a lone last tile keeps one column's width. A
tile there sets its title at the body size, and its picture across its top at the picture's own
shape, which its `width` and `height` attributes give before it loads, with the text and the sign on
the line under it. The tiles on one line end together, and a short tile beside a tall one starts its
picture and title at its top, level with the tall one's, with the room it gains under its text.
Without `dk-rows-columns` a list of tiles stays one column. A card that leads to several places is
not one link and is not a tile.

How many tiles a list holds and how wide its column is decide whether one is left alone on the last
line, so at some widths one always is. The lone tile stays at the start of its line and in the
list's order, since it reads as part of the list there. Stretched across the line or set in its
middle it would look like the one that matters most, and moving tiles to fill the line would take
the keyboard out of the order the eye reads.

A page whose count of tiles leaves one alone at the widths its readers use most sets
`--dk-tile-least` on its list by a class of its own, so more stand on a line. A line holds as many
tiles as fit at the least width with a `--dk-space-3` gap between each two, so in a content page's
column of 70rem, at the default text size, five tiles fit at a least width up to 13.4rem and six up
to about 11rem. A value at that edge drops a tile onto the next line at a larger text size or in a
panel, which is narrower by its padding, so a page leaves some room under it. Five tiles at 13.25rem
stand on one line at 1280 pixels wide and wider, and four over one at 1024, as on a tablet held
sideways. The value is worked out for one count of tiles, so a list whose count changes works it out
again. The default of 15rem is the width a name of a few words fits, so a page that goes below it
keeps its tiles' names short.

```css
.game-list {
    --dk-tile-least: 13.25rem;
}
```

<details>
<summary>How the tiles are drawn</summary>

A tile's title is at the lead size, since a tile is a place to go that stands alone, and at the body
size in an explainer, as a panel's title there is. Tiles stand `--dk-space-3` apart, each with an
edge in the line color and large corners, in place of the rule between rows. Each is at least
`--dk-target-large` tall, padded `--dk-space-3` above and below and `--dk-card-inset` at its sides,
as a panel is, so its words start on a raised panel's line, and its detail wraps within it at any
text size. With no ground set, a tile sits on the ground its container steps to, `--dk-ground-step`,
`--dk-surface` on a page, and casts no shadow. A tile stays inside the column in an explainer, a
panel, a callout, an app's body or a dialog, where a row reaches past it, since its edge, not its
words, lines up with the column. In forced colors the edge stays, in the system's color, and the
ground and any shadow give way to the system's.

</details>

## Dialog

A dialog asks a question over the page, and its sheet form opens a panel from the bottom of a
phone. Both are the native `dialog` element opened as a modal, so the browser holds focus inside,
closes it on Escape and makes the page behind it inert.

<!-- example: dialog -->

```html
<button type="button" class="dk-button" id="finish">Finish the game</button>
<dialog
    class="dk-dialog"
    id="end-game"
    aria-labelledby="end-game-title"
    aria-describedby="end-game-text"
>
    <h2 class="dk-dialog-title" id="end-game-title">End the game now?</h2>
    <p id="end-game-text">The scores so far are kept in the history.</p>
    <form class="dk-dialog-actions" method="dialog">
        <button type="submit" class="dk-button" value="keep">Keep playing</button>
        <button type="submit" class="dk-button dk-button-accent" value="end">End the game</button>
    </form>
</dialog>
<dialog class="dk-dialog dk-dialog-sheet" id="round-options" aria-labelledby="round-options-title">
    <h2 class="dk-dialog-title" id="round-options-title" tabindex="-1" autofocus="">
        Round options
    </h2>
    <div class="dk-field">
        <label class="dk-field-label" for="dealt" id="dealt-label">Cards dealt</label>
        <select class="dk-select" id="dealt">
            <option value="10">Ten each</option>
            <option value="7">Seven each</option>
        </select>
    </div>
    <form class="dk-dialog-actions" method="dialog">
        <button type="submit" class="dk-button dk-button-accent">Done</button>
    </form>
</dialog>
```

```js
import { attachDialog } from '@jasonsdevspace/design-kit/controls';

const open = attachDialog(document.querySelector('#end-game'));
document.querySelector('#finish').addEventListener('click', open);
```

A dialog is named by its heading, a `dk-dialog-title` its `aria-labelledby` points to. A short
question is also described by its text, through `aria-describedby`, so a screen reader says what
an answer leads to before the answers. Its answers sit in a `form method="dialog"`, so a press of
one closes it and leaves the answer in the dialog's `returnValue`. The first of them takes focus as
it opens, so an answer that cannot be taken back comes last and the one that keeps things as they
are first, and a press of Enter as the dialog opens changes nothing. A sheet whose title and
options come before its first control gives its title `tabindex="-1"` and `autofocus`, so it opens
at its top with its title said, rather than scrolled to a control further down.

`attachDialog(dialog, { stay, returnTo, signal })` returns the function that opens it, and focus
goes back to what opened it when the dialog closes, however it is closed. Handed the event of the
press that opened it, from a listener on the button, on a part of the page that holds it or in
React, it finds the button the press landed on, since Safari gives a clicked button no focus to
remember. Called otherwise, it takes the element to return to, or remembers what had focus. Where
nothing had focus, or what it returns to is gone from the page by the time the dialog closes, focus
goes to what `returnTo` gives. A page that has somewhere more useful for focus, such as the next
field after a Save, asks for it with `moveFocus` in the task that closes the dialog, whether that
task closes it, takes it from the page or takes it down, and focus goes there rather than to the
opener. Focus the page moves elsewhere in that task stays where it put it, while focus it puts back
on what had focus as the dialog opened counts as the browser's handing it back. A request asked in
an earlier task, such as before an awaited save, lands only where its frame comes after the dialog
closes, so a page that awaits before closing asks again just before it closes. It also closes the
dialog on a tap on the scrim around it, one that starts and ends there so a drag out of the dialog
closes nothing.

A dialog that must be answered is attached with `{ stay: true }`, and then stays open on Escape, a
phone's Back and the scrim. That is held by the dialog's `closedby` attribute, which Chrome reads
from version 134. Chrome 123 to 133, at the kit's floor, lets a page refuse a close once and closes
the dialog on a second Escape or Back, so a page there treats a dialog that must be answered as one
that can be dismissed too. Attaching a dialog again with options replaces them, by the rule for
whose options apply that the section linked below sets out, and attaching it again with none leaves
them as they were, so a dialog attached to stay still stays, and either returns the same function,
an open dialog staying open. Options with no key but `signal` given a value, as `{}`, `{ signal }`
or `{ stay: undefined }`, count as none, so a dialog attached through a ref made afresh on every
render, or with props that leave `stay` undefined, keeps `stay`, and a page that means it to be
dismissed again attaches it with `{ stay: false }`. Its listeners are on the dialog, so a dialog
taken from the page takes them with it. Taken down by its `signal`, as [Taking a control
down](#taking-a-control-down) has it, an open dialog closes, with focus handed back to what opened
it where focus is in the dialog, inside a shadow tree within it too, has fallen to the body or is
still where the browser handed it as the dialog closed, and the function that opens it does nothing.

The kit's app takes an action at once and offers Undo in a toast rather than asking first, so it
asks in a dialog only where nothing could undo the answer.

<details>
<summary>How a dialog is drawn</summary>

A dialog sits in the middle of the screen, at most `--dk-dialog-width` wide, on the raised ground
with the raised shadow and an edge forced colors keep, over a scrim in `--dk-scrim`. It scrolls
inside itself when it holds more than the screen does, and while one is open as a modal the page
behind it does not scroll, in a browser with `:has()`. It stands what it holds `--dk-space-3` apart,
and its actions further. Its title is at the title size, and its actions sit at its end, wrapping
under one another where the room runs out. On a phone, and on a page that holds an app or ends in a
tab bar of its own, the actions grow to fill their row, so stacked ones are the dialog's width
rather than two widths at its end, and a text button keeps its link's width. It pads by
`--dk-space-5`, and by `--dk-space-4` at 48rem wide or less and on a page that holds an app or ends
in a tab bar of its own, as a panel does, with a sheet still clear of the home indicator. Its
margins from the screen's edges and its padding stop growing with the text past their usual size, so
on a phone at a large text size what it holds, such as a stepper, keeps its room. They stop there
too where a page sets the space tokens larger.

A `dk-dialog-sheet` sits at the bottom edge, the app's column wide, with its top corners rounded and
its last line clear of the home indicator. It rises into place over `--dk-duration-medium` as it
opens, at once for a visitor who asks for less motion.

</details>

### A Close in the corner

<!-- example: cornerClose -->

```html
<dialog
    class="dk-dialog"
    id="leave-game"
    aria-labelledby="leave-game-title"
    aria-describedby="leave-game-text"
>
    <h2 class="dk-dialog-title" id="leave-game-title">Leave the game for now?</h2>
    <form class="dk-close" method="dialog">
        <button type="submit" class="dk-button dk-button-text dk-button-quiet" value="close">
            <span aria-hidden="true">×</span><span class="dk-visually-hidden">Close</span>
        </button>
    </form>
    <p id="leave-game-text">The scores are kept, and the game waits where you left it.</p>
    <form class="dk-dialog-actions" method="dialog">
        <button type="submit" class="dk-button" value="stay" autofocus="">Keep playing</button
        ><button type="submit" class="dk-button dk-button-accent" value="leave">
            Leave the game
        </button>
    </form>
</dialog>
<div class="dk-panel" id="round-tips">
    <h3 class="dk-panel-title">Round tips</h3>
    <div class="dk-close">
        <button type="button" class="dk-button dk-button-text dk-button-quiet">
            <span aria-hidden="true">×</span
            ><span class="dk-visually-hidden">Close round tips</span>
        </button>
    </div>
    <p>Ana deals first, and the cards go round to the left.</p>
</div>
```

A quiet Close sits in the top corner of a dialog or a panel in a `dk-close` right after the title,
which wraps beside it rather than run under it. In a dialog the `dk-close` is a `form
method="dialog"`, so a press closes the dialog with no script and leaves `close` in its
`returnValue`, apart from an answer. The Close comes after the title, so the keyboard and a screen
reader meet the dialog's name first, and it never takes focus as the dialog opens: a dialog that
asks a question gives its first answer `autofocus`, and a sheet its title, as above. Where nothing
asks for focus, as when React's `autoFocus` writes no attribute, `attachDialog` moves it off the
Close to the first field or answer after it that takes focus, or to the title where nothing can. It
keeps the ×, with Close out of sight beside it, and is the target at every width, centered on the
title's first line wherever the padding leaves it room. At a large text size, where a dialog's or a
phone's panel padding is held at no more than 16px, it keeps its ring inside instead and sits a
little below that line. It is placed in the corner rather than laid out, so what the dialog or panel
holds stays in its order and at its own width, and what comes before the Close keeps free the room
it takes, so a title or an eyebrow wraps beside it. Its ring stays inside the dialog and clear of
what follows the title. A dialog has one Close, in the corner or among its actions, never both, and
a dialog attached to stay, which must be answered, has none.

A panel's Close names what it closes out of sight, such as Close round tips, since a panel has no
name of its own. A panel a button opens, the button naming it in `aria-controls` and saying in
`aria-expanded` whether it starts open, is attached by its button:

```js
import { attachPanel } from '@jasonsdevspace/design-kit/controls';

const tips = attachPanel(document.querySelector('[aria-controls="round-tips"]'));
```

Then the button opens and closes the panel, every attached button that names it follows, and the
Close closes it and marks the buttons collapsed, with no script of the page's own. A panel that
starts closed carries `hidden` in its markup, so it never shows before the script runs. What it
returns, of the type `PanelControl`, holds `set`, of the type `SetPanel`, which opens or closes the
panel from the page's own code, as `tips.set(false)`, and `detach`, which takes the button down, as
a page does before it removes the button, after which `set` does nothing. The first button attached
for a panel starts it as its markup says, and a button attached for it later, one drawn again among
them, marks itself as the panel is and leaves the panel alone. A press of a button that is off, with
`aria-disabled="true"`, does nothing, and focus never goes back to one. A button attached again
returns the same, and one with no `aria-controls` is refused with an error that says so. The button
and the panel are found at each press, so a panel drawn again keeps working, and listeners on the
page serve every panel, taken off once every button is taken down. Escape with focus in a panel or
on its button closes the innermost such panel and marks the press handled, so a dialog around the
panel stays open. It leaves alone an Escape the page has already handled, one that ends typing in a
script such as Japanese, one on a panel's button that is off, one in an open dialog or an open
popover inside the panel, and one on a search with words in it or on a combobox or a button whose
list or menu is open. Those checks read where the key was pressed, inside a page's own component
where the component's shadow root is open, and the component's host among them, so a component that
marks its host as an open combobox keeps its Escape. Inside a closed shadow root the panel sees only
the host. An element inside a component's shadow tree that shares a panel's id closes nothing, since
only the page's own elements name a panel. A panel's id must be the only one on the page, so a page
that shows markup its visitors wrote prefixes or strips the ids in it.

`attachPanel(button, { signal })` takes the button down when `signal` aborts, as `detach` does and
as [Taking a control down](#taking-a-control-down) has it, and a signal already aborted attaches
nothing. A button taken from the page without being taken down stays held by the kit until it is, so
a page takes a button down before it removes it. An open panel stays the kit's while an attached
button names it. Once the button that opened it is taken down, Escape and its Close both still close
it, and focus goes back to the first attached button in the page that names it, as [decision
0019](https://github.com/jasonsdevspace/design-kit/blob/main/docs/decisions/0019-a-closing-panel-hands-focus-back-only-where-the-visitors-place-was-in-it.md)
has it. A button taken down, by its signal or `detach`, takes `aria-expanded="false"`, since it no
longer follows the panel and would otherwise go on saying the panel is open after another button
closes it. A button attached for it while it is open takes it where no attached button named it, so
a button drawn again, the only one among them, keeps the panel open whatever its new markup says and
closes it by Escape. Once no attached button names it, neither Escape nor its Close closes it, and
it stays as it is for the page to hide.

However a panel closes, by its button, its Close, Escape, a Done of the page's own or `set`, focus
goes to the button that opened it where focus is in the panel, inside a shadow tree within it too,
or where nothing has focus and the visitor's last place, the last focus that moved or their last
press, was in it, as [decision
0019](https://github.com/jasonsdevspace/design-kit/blob/main/docs/decisions/0019-a-closing-panel-hands-focus-back-only-where-the-visitors-place-was-in-it.md)
sets out. Focus anywhere else, where the visitor or the page put it, stays where it is, so a Done or
a link that moves focus to what it shows keeps it there, before or after it closes the panel, and a
close from the page's code after the visitor focused or pressed something outside the panel leaves
them where they are. Where focus goes back and the visitor's last press was a link in the panel to a
place on the same page outside it, one that opens no new tab and downloads nothing, focus goes to
that place instead. Where the button that opened the panel takes no focus, focus goes to the first
other attached button that names it, else the first thing after the panel the keyboard reaches by
Tab, else the app frame's body or the page's main content. Safari focuses a pressed button only
where it has a tabindex, so the kit writes `tabindex="0"` on an attached button and the corner
Close, and `tabindex="-1"` on the panel, so a press anywhere in it leaves focus in it, and on the
place a link sends focus to, each where the page set none, and keeps a tabindex the page set. A
panel the page draws again while it is open takes them as a press in it begins. A page closes a
panel from a press's `click`, since a close from its `pointerdown` comes before the browser moves
focus for the press. A panel no button opens is closed by the page's own script, which moves focus
to what comes after the panel, or to the heading before it where nothing follows.

## What the package exports

Import each entry by the package name and the entry's own, such as
`@jasonsdevspace/design-kit/controls`. Each heading here lists what that entry holds.

### `@jasonsdevspace/design-kit/tokens.css`

The layer order and every named value, each under the `--dk-` prefix, and the values the kit works
out for itself under `--_dk-`.

### `@jasonsdevspace/design-kit/tokens.resolver.json`

Every named value the format can hold, in the Design Tokens Community Group's format, 2025.10, for a
tool that reads that format, with light and dark as the theme's two contexts.

### `@jasonsdevspace/design-kit/base.css`

Type, colors, the selection, the focus ring, `.dk-visually-hidden`, inline code and the
reduced-motion rule.

### `@jasonsdevspace/design-kit/components.css`

The page chrome and a site header, buttons and a row of them, a quiet button, fields and a field
with a button, callouts, pills, tabs and a tab row on its container's rule, the eyebrow, an icon,
the theme switch, the copy button and a code block's head, a content page and its lead, a band, a
stack and a group of sections, the explainer page and its tables, a pinned first column among them,
panels and a raised panel, rows, with a picture at a row's start or a group of buttons at its end,
as tiles and as tiles in columns, and an app's frame, tab bar, toast, grid of buttons, stepper and
dialog, a dock row for a compact action beside the main one, a busy button, a loading line, a
field's required or optional mark, read-only fields, the stack's steps, a split row, a note and a
large numeral, a hero beside its picture, an empty state and progress.

### `@jasonsdevspace/design-kit/theme`

`themeScript`, `THEME_KEY`, `THEMES`, `THEME_CHOICES` and the types `Theme` and `ThemeChoice`.

### `@jasonsdevspace/design-kit/controls`

`attachThemeSwitch()`, `attachCopyButton()`, `attachStepper()`, `attachToast()`, `attachDialog()`,
`attachPanel()`, `attachTable()`, `attachStatus()` and `chooseTheme()`, which make the controls
work, `moveFocus()`, which moves focus once a change is drawn, `activeOf()`, which reads what has
focus inside a shadow root too, `focusOnArrival()`, which focuses a view's heading on an arrival a
press brought, `attachRoving()`, which moves among a group's cells by the arrow keys,
`attachForm()`, which checks a form against the browser's constraints on submit, draws the errors
and refuses it, `attachBusy()`, which says a busy button's wait, `attachProgress()`, which says
progress at its steps, and the types `AttachOptions`, which carries the `signal` that holds a
control, `CopyOptions`, `ShowToast`, `ToastAction`, `OpenDialog`, `DialogOpener`, `DialogOptions`,
`PanelControl`, `SetPanel`, `StepperOptions`, `Say`, `SayOptions`, `FocusTarget`,
`MoveFocusOptions`, `ArrivalOptions`, `RovingOptions`, `RovingOrientation`, `FormOptions`,
`Failure`, `FailureWords`, `FieldFailure`, `Refuse`, `BusyOptions` and `ProgressOptions`.

### `@jasonsdevspace/design-kit/react`

It holds `SkipLink`, `PortfolioStrip`, `DemoFooter`, `Button`, `InputField`, `SelectField`,
`TextareaField`, `ChoiceField`, `StepperField`, `Callout`, `ThemeSwitch`, `CopyButton`,
`StatusLine`, which `CopyStatus` also names, `Progress`, `Toast` and `StatusProvider`, a props type
for each named after it, such as `ButtonProps`, the hooks `useStatus()`, `useFocusAfterDraw()`,
`useArrivalFocus()`, `useRoving()`, `useFormRefusal()`, `useBusy()` and `useProgress()`, the
`FocusAfterDraw` and `ArrivalKey` types they use, the `Choice` and `CalloutTone` types a page writes
a choice or a tone with, and the URLs the chrome links, `PORTFOLIO_URL`, `PORTFOLIO_WORK_URL` and
`GITHUB_PROFILE_URL`.

### `@jasonsdevspace/design-kit/vite`

`themeScriptPlugin()`, `themeScriptHash`, `THEME_PLACEHOLDER`, `browserFloor()` and
`lightningcssFloor()`.

## Layers and palettes

The tokens declare three layers, `dk.tokens`, `dk.base` and `dk.components`, in that order, and each
sheet fills its own. A page's own rule outside a layer, however little it weighs and wherever its
sheet loads, wins over every rule of the kit's except the reduced-motion rule and the rule that
hides a kit element marked `hidden`, or anything marked `hidden` inside one, as [decision
0002](https://github.com/jasonsdevspace/design-kit/blob/main/docs/decisions/0002-rules-sit-in-dk-layers.md)
explains. A page shows a hidden kit element again by taking the attribute away.

A page with layers of its own names where `dk` goes, before any rule of its own. A layer takes its
place where its name first appears, so a page whose layers come first without naming `dk` puts the
kit's rules over its own.

Write one of these, never both, since only the first order written counts. To keep the page's layer
over the kit's, before any rule of the page's layer:

```css
@layer dk, page;
```

To put the kit's layer over the page's, before the kit's sheets load:

```css
@layer page, dk;
```

Each sheet declares the layer it fills, so a sheet a page imports into a layer of its own keeps its
rules in the kit's layer nested inside that one. A page with a reset in a layer, as a framework's
base is, has the reset win over the kit's components wherever its layer comes after `dk`, and a
button loses its edge. Such a page puts the kit's layer first in its own order, then its reset's,
then one for the components, and imports the components sheet into that one:

```css
@layer dk, reset, kit;
@import '@jasonsdevspace/design-kit/tokens.css';
@import '@jasonsdevspace/design-kit/base.css';
@import '@jasonsdevspace/design-kit/components.css' layer(kit);
```

The tokens and the base stay in `dk`, under the page's own rules, and the components draw over the
reset. A reset outside any layer wins over every layer, the components' included, so a page keeps
its reset in one.

For a visitor who asks for less motion, the reduced-motion rule in `base.css` cuts every animation
and transition to a hundredth of a millisecond, plays every animation once, and turns smooth
scrolling into a jump. A delay before either is kept, since a delay moves nothing and a page may use
one as a timer, such as a waiting line shown only once a load has taken a moment. Entrances a page
staggers by delay come in sequence for this visitor, each at once, so a page that wants them
together zeroes its own delays under the same query. The rule is held with `!important`, since it is
the visitor's choice. It wins over every normal rule a page writes, and over an important one in a
sheet, outside a layer or in a layer after the kit's. An important declaration in a `style`
attribute still wins over it, as does an important rule in a layer the page orders before the kit's.

Each color role holds its light and its dark value in one `light-dark()`. A page with its own
palette sets the roles again, with both values at once. Set on `:root`, outside a layer or in one
after the kit's, they win whichever sheet loads first. Set on one container, they restyle only what
is inside it. A role set to one color draws that color in both themes.

```css
:root {
    --dk-accent: light-dark(#2f5bd3, #7b9cff);
}
```

The default palette passes 4.5 to 1 for text and 3 to 1 for a control's edge on every ground it is
meant for, in both themes, as [the accessibility
statement](https://github.com/jasonsdevspace/design-kit/blob/main/ACCESSIBILITY.md#how-it-is-checked)
lists. A page that sets its own palette answers for its own pairings.

## The theme contract

The portfolio saves a visitor's theme in `localStorage` under `theme`, and the script sets
`data-theme` on the root from it.

| Saved under `theme`                                  | `data-theme` on the root                                      |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| `light` or `dark`                                    | the same                                                      |
| `system`, nothing, another value, or storage refused | the system's scheme, or `light` where the browser cannot tell |

It sets the theme again when the system's scheme changes, when another tab saves or clears a choice,
and when the browser restores the page from its back and forward cache. Storage belongs to an
origin, so only a page on the portfolio's origin reads the visitor's choice, and anywhere else
follows the system. Print always draws the light values, whatever the theme, since paper is light
and the browser drops backgrounds. A page that sets `color-scheme` on its own elements outside a
layer sets them back to light in print too. On paper a callout and a code block keep an edge in the
line color, a code block and a scrolling table show whole with their code and figures wrapping, and
an app's frame, or a page that ends in a tab bar, is as long as what it holds. What does nothing on
paper does not print: the theme switch, the copy button, the skip link, a tab bar, a toast, and a
strip's section of switches with the room it keeps for them.

A page that names its theme color for each scheme, two `<meta name="theme-color">` whose media
queries are exactly `(prefers-color-scheme: light)` and `(prefers-color-scheme: dark)`, before the
script, gets the browser's bar in the ground of the theme the page draws. The script points both at
that ground on the first paint and on every change of the root's theme, the switch's, another tab's,
the system's and a page restored by Back included, so the bar never shows the other theme's ground.
A theme color with any other query is left alone, and so are both when either is missing or without
content.

A page whose Content Security Policy allows inline script only by its hash names the script with
`themeScriptHash`, already quoted as a policy source. It is the hash of the script in the installed
version, so the policy reads it from the package rather than keeping a copy that goes stale when the
script changes. It holds as long as nothing after the plugin rewrites the inline script, as an HTML
minifier would.

```ts
import { themeScriptHash } from '@jasonsdevspace/design-kit/vite';

const policy = `script-src 'self' ${themeScriptHash}`;
```
