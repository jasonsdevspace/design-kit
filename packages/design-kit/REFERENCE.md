# @jasonsdevspace/design-kit reference

The markup, the rules and the React props for every piece of the kit. The package README links it at
each release's tag, so it matches the version a page installs. [The package README](README.md) says
what the kit is and how to set it up, and [the site](https://jasonsdevspace.com/design-kit/) shows
each piece live in both themes.

## The sheets

`base.css` and `components.css` load after `tokens.css`, since the tokens' first statement declares
the kit's layer order. `base.css` draws selected text on the accent rather than on the browser's
blue, since a page keeps one accent, and in the text the accent carries. It sets inline code a step
smaller than the text around it and lets a long name break anywhere rather than push a narrow
column wider. Inside a `pre` code takes the
block's size, and inside a link it keeps the link's underline. The base also puts a pointer cursor
on a `<summary>`, and on a checkbox or radio and the label around it.

Every token's value, each color in both themes, and the contrast of each color pairing are on [the
tokens page](https://jasonsdevspace.com/design-kit/tokens/).

<details>
<summary>Every token, with its value or role</summary>

| Tokens                                                                                            | Value or role                                                                                                                   |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `--dk-bg`, `--dk-surface`, `--dk-raised`                                                          | the page, a card, and what floats over both                                                                                     |
| `--dk-fg`, `--dk-muted`                                                                           | text, and text that steps back                                                                                                  |
| `--dk-line`, `--dk-control`                                                                       | a rule, and a control's edge                                                                                                    |
| `--dk-accent`, `--dk-on-accent`                                                                   | links, the lead action, and text on it                                                                                          |
| `--dk-focus`                                                                                      | unset, the focus ring and hover edge when a page sets it                                                                        |
| `--dk-highlight`                                                                                  | what is chosen or pointed at                                                                                                    |
| `--dk-success`, `--dk-success-bg`                                                                 | what went right, and its ground                                                                                                 |
| `--dk-danger`, `--dk-danger-bg`                                                                   | what went wrong, and its ground                                                                                                 |
| `--dk-warning`, `--dk-warning-bg`                                                                 | what needs care before it goes wrong, and its ground                                                                            |
| `--dk-scrim`                                                                                      | what dims the page behind a dialog                                                                                              |
| `--dk-space-1` to `--dk-space-8`                                                                  | 0.25, 0.5, 0.75, 1, 1.5, 2, 3 and 4rem                                                                                          |
| `--dk-text-caption`, `--dk-text-small`, `--dk-text-body`                                          | 0.85, 0.9 and 1rem                                                                                                              |
| `--dk-text-lead`, `--dk-text-title`                                                               | 1.1 and 1.25rem                                                                                                                 |
| `--dk-text-heading`, `--dk-text-display`                                                          | 1.5 and 1.75rem                                                                                                                 |
| `--dk-text-numeral`                                                                               | 3.5rem, a figure read from across a room                                                                                        |
| `--dk-text-code`                                                                                  | 0.9em, a step under the text around it                                                                                          |
| `--dk-leading-tight`, `--dk-leading-body`                                                         | 1.2 and 1.5                                                                                                                     |
| `--dk-weight-normal`, `--dk-weight-medium`, `--dk-weight-strong`                                  | 400, 500 and 600                                                                                                                |
| `--dk-tracking-caps`                                                                              | 0.06em, the tracking of a label in caps                                                                                         |
| `--dk-font-sans`, `--dk-font-mono`                                                                | the system's sans and mono stacks                                                                                               |
| `--dk-radius-small`, `--dk-radius`, `--dk-radius-large`                                           | 0.25, 0.375 and 0.5rem                                                                                                          |
| `--dk-radius-pill`                                                                                | 999px, round ends on a tab or a tag                                                                                             |
| `--dk-ring-width`, `--dk-ring-offset`                                                             | 2px and 2px                                                                                                                     |
| `--dk-field-height`, `--dk-field-inline`                                                          | a field's height, 2.25rem, and its inline padding, 0.75rem                                                                      |
| `--dk-target`                                                                                     | 2.75rem, the touch target on a phone                                                                                            |
| `--dk-target-large`                                                                               | 3.5rem, a target pressed at arm's length                                                                                        |
| `--dk-strip`, `--dk-strip-tools`                                                                  | 2.5rem, and `auto`, the room kept for switches                                                                                  |
| `--dk-measure`, `--dk-column`                                                                     | 34rem and 72rem                                                                                                                 |
| `--dk-app-column`, `--dk-app-bar`                                                                 | 28rem, the widest an app's frame grows, and 4rem, the least height of its bar                                                   |
| `--dk-stack-pinned`, `--dk-stack-raised`, `--dk-stack-bar`, `--dk-stack-toast`, `--dk-stack-skip` | the order things sit over one another, lowest first: a pinned cell, a list that opens, a bar at an edge, a toast, the skip link |
| `--dk-shadow-raised`                                                                              | `0 6px 24px light-dark(rgb(0 0 0 / 0.18), rgb(0 0 0 / 0.5))`                                                                    |
| `--dk-duration-short`, `--dk-duration-medium`                                                     | 150ms and 250ms, a change of state and a surface arriving                                                                       |
| `--dk-safe-top`, `--dk-safe-right`, `--dk-safe-bottom`, `--dk-safe-left`                          | what a phone keeps at each edge, zero unless the viewport meta says `viewport-fit=cover`                                        |
| `--dk-button-shadow`, `--dk-button-press`                                                         | unset, a shadow under a button and how a press moves it                                                                         |
| `--dk-button-grid-columns`                                                                        | unset, and read as 3, the columns a grid of buttons asks for                                                                    |
| `--dk-table-ground`, `--dk-table-pinned-size`                                                     | unset, the ground under a pinned column, read as the page's or a panel's, and its width, read as 8rem                           |
| `--dk-stepper-digits`                                                                             | unset, and read as 2, how many figures a stepper's value has room for                                                           |

</details>

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

The footer's text holds to the measure, as prose does, while its rule runs the page's width.
Every link in the chrome keeps its underline, and in the footer's text the underline is what
tells a link from the text around it. The link marked as the current page stands in the page's text
at the heading's weight, so it is told from the links around it by more than its color, in forced
colors too, and still reads as a link.

</details>

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
<button type="button" class="dk-button">Filters</button>
<button type="button" class="dk-button dk-button-accent">Save rule</button>
<button type="button" class="dk-button dk-button-large">Try it with your own products</button>
<button type="button" class="dk-button dk-button-accent dk-button-large dk-button-tall">
    Save the round
</button>
<button type="button" class="dk-button dk-button-text">Show the markup</button>
<button type="button" class="dk-button" aria-pressed="true">Members only</button>
<button aria-describedby="previous-why" type="button" class="dk-button" aria-disabled="true">
    Previous
</button>
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

A toggle that stands alone carries `aria-pressed`, `"true"` or `"false"`, and keeps the same label
in both states, since the attribute already says which it is. An action carries no `aria-pressed` at
all. A button with `aria-expanded="true"`, whose panel is open, is drawn as a pressed one, and a
text button with it keeps its link look, since it has no padding around its words for the pressed
look to fill and the open panel is the sign.

Mark an unavailable button `aria-disabled="true"`, never `disabled`. This reference calls such a
button off, as the React prop does. A disabled button drops focus and leaves the tab order, while an
aria-disabled one stays where the keyboard can reach it and find out why. The sheet draws a
`disabled` button, and one inside a disabled fieldset, the same as an off one.

The attribute does nothing by itself. A page that writes this markup makes its click handler check
`aria-disabled` and return early, calling `preventDefault()` so a submit button does not submit.

Say why a button is off in text beside it, such as a `.dk-field-hint` paragraph the button's
`aria-describedby` names. A form's submit button is better left on while the form is incomplete, so
a press shows the errors rather than doing nothing.

<details>
<summary>How a button is drawn</summary>

A button is 2.25rem tall, `--dk-field-height`, as tall as a field, and 2.75rem, `--dk-target`, at
48rem wide or less, and it is never narrower than it is tall. It has no ground of its own, so it
takes the ground of whatever it sits on, a callout included. A large button is 2.75rem tall at every
width, with wider inline padding and the body text size. A tall button is 3.5rem tall at every
width and never narrower than that, and changes nothing else. A text button has no edge, no inline
padding and no minimum width, in the accent and underlined at the size of the text around it, and
keeps the button's height, so its target holds, which is why it sits beside a block rather than in
running text, whose line it would push taller. Pointed at, its underline thickens, since it has no
edge to color. Open, it keeps that thicker underline and nothing else. Off, it keeps its underline, in the muted text and still with no edge. Where a
pointer can hover, the edge turns to the focus color under it, and the accent button underlines its
words instead. Pressed is the highlight with an edge twice as thick in the accent, and its words in
the page's text, an accent button's included. Off is the muted text on no ground with an edge in the
line color, rather than a fade, so its words keep a ratio the palette measures. An off toggle that
is on keeps the thicker edge, in the line color. In forced colors a pressed button takes the
system's `Highlight`, and an off one takes `GrayText` on the page's ground, accent or not. An off
toggle that is on keeps an edge in `Highlight`.

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
<div class="dk-field">
    <label class="dk-field-label" for="note">Note</label>
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
`aria-invalid="true"` is there only while an error is drawn. A field after another in a form with no
class of its own stands `--dk-space-4` below it. A form with a class lays out its own fields.

The error is not live, since a form that fails in several fields at once would speak over itself.
The page says when errors appear, and on a submit that fails it moves focus to the first invalid
control or to an error summary. The kit does no validation, so the page decides when to show an
error, best after a submit is tried rather than while someone is typing.

A field a visitor cannot change uses `disabled`, unlike a button, and its hint says why, which a
screen reader reads wherever it announces the field.

<details>
<summary>How a field is drawn</summary>

A control is as tall as a button, at both widths, and padded as one is, so its text starts where a
button's label does. Its text is never under 16px, so a phone does not zoom the page when the field
is tapped. It sits on the page's own ground, so it reads as a well
on a card. The hint and the error are in the caption size, the error in the danger color, and an
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
a radio may read nothing of its group. Checkboxes are each a stop of their own, so each carries `aria-invalid="true"`
instead. The arrow keys move and check among radios, as the browser has them, and a choice a visitor
cannot make uses `disabled` on its control.

<details>
<summary>How a choice is drawn</summary>

A choice is the field's height, and a thumb's target on a phone, and takes the highlight under a
pointer and after the keyboard, as the ring does, so the whole word reads as one target with the
ring on the control itself, and a tap leaves no choice lit once it is done. The highlight reaches
past the control by the choice's own padding, so the control stays in line with the legend, into the
room around the field, which a container that clips must leave. A gloss is in the muted text at the
caption size, and a choice whose control is disabled is in the muted text with no highlight. Every
control of an invalid set draws a thin line in the danger color around it, and a dashed line in
`CanvasText` in forced colors, each giving way to the ring. The theme switch's choice is the same
label of a radio and its word, drawn by rules of its own as a pill word with the radio under it, as
the Theme switch section says.

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
it loads is read in its place rather than over the page's title, as
[decision 0007](https://github.com/jasonsdevspace/design-kit/blob/main/docs/decisions/0007-a-callout-takes-a-role-only-when-asked.md)
explains. A message that arrives after the page has loaded is made live in three steps.

1. Put the callout on the page with `role="status"` on `.dk-callout-body`, read when the screen
   reader is next idle, or `role="alert"`, read at once. The title and the tone's word are read with
   the message, and the actions are not.
2. Leave the message empty at first. A live callout whose message holds nothing at all, not even a
   space, a line break or the tone's word, and that has no actions leaves the flow, drawn as
   visually hidden text is, so it takes no room and opens no gap, and stays in the tree a screen
   reader reads.
3. Fill the message when there is something to say, which is when a screen reader reads it. For
   success, warning or danger, put the hidden word in with it, as
   `<span class="dk-visually-hidden">Success: </span>Saved.`

A callout's edge is transparent, and shows only in forced colors and on paper, where the ground is dropped and
the edge marks where the callout starts and ends.

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
`.dk-tab` in a `.dk-tabs` row over a rule. The classes draw the row alone, and ship no script and no
React component, since a tab's role and its keys belong to the page that owns the panels. The chosen
tab carries the attribute a screen reader already reads for its control: `aria-selected="true"` on a
tab, `aria-current` on a link among pages, or `aria-pressed="true"` on a toggle, each drawn alike.
It keeps the resting weight, so no tab moves as the choice does. In forced colors the chosen tab
stands in the system's selection colors, as the current pill does, and a resting tab has no line for
them to paint. A tab is the strip's height, and a thumb wide and tall on a phone, and its first word
sits in from the rule's end by its padding, as a pill's does. A row of links keeps `role="list"`, as
the pills do, and each link fills its item down to the rule.

A row with `role="tablist"` takes the tabs pattern's keys from the page: one tab in the tab order,
the arrow keys moving the choice along the row, and `aria-controls` naming each tab's panel. The
base sheet keeps the focus ring on a tab the row has given a tabindex of -1, so the ring follows the
arrow keys.

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
a dialog it stands one of the container's steps from what is around it.

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
passes on a prop it might not have been given compiles under `exactOptionalPropertyTypes` too.

**`Button` props**

| `Button`  | Default    | What it does                                                                     |
| --------- | ---------- | -------------------------------------------------------------------------------- |
| `accent`  | `false`    | Adds `dk-button-accent`. TypeScript refuses it with `pressed` or `text`          |
| `large`   | `false`    | Adds `dk-button-large`. TypeScript refuses it with `text`                        |
| `text`    | `false`    | Adds `dk-button-text`. TypeScript refuses it with `accent`, `pressed` or `large` |
| `pressed` | none       | Writes `aria-pressed`, even when `false`. Leave it out for an action             |
| `off`     | `false`    | Writes `aria-disabled="true"`, and a click runs no `onClick`                     |
| `type`    | `'button'` | The button's type                                                                |

Every other prop goes to the `<button>`, `ref` and `className` included, except `style`, `disabled`,
`aria-disabled` and `aria-pressed`. A click on an off button calls `preventDefault()`, so a submit
button does not submit. Other handlers, for keys or a pointer, still run, so they must check `off`
themselves.

**`InputField`, `SelectField` and `TextareaField` props**

| `InputField`, `SelectField`, `TextareaField` | Default      | What it does                                                    |
| -------------------------------------------- | ------------ | --------------------------------------------------------------- |
| `label`                                      | required     | Names the control                                               |
| `hint`                                       | none         | Drawn when it holds something, and read as a description        |
| `error`                                      | none         | Drawn when it holds something, and marks the control invalid    |
| `id`                                         | from `useId` | The control's id. Set it when something else links to the field |

Every other prop goes to the control, `ref` and `className` included, except `style` and
`aria-invalid`. A select field's children are its options, and a textarea field's text is its
`defaultValue` or `value`, never children, with three rows unless given `rows`. An `aria-describedby`
of the page's own is listed after the hint and the error.

**`ChoiceField` props**

| `ChoiceField`         | Default      | What it does                                                          |
| --------------------- | ------------ | --------------------------------------------------------------------- |
| `label`               | required     | Names the set, as its legend                                          |
| `name`                | required     | The controls' name, shared by every choice                            |
| `choices`             | required     | Each a `value`, a `label`, a `hint` and the control's own props       |
| `type`                | `'radio'`    | `'checkbox'` where any number of choices can be on                    |
| `row`                 | `false`      | Draws the choices in a row that wraps                                 |
| `hint`, `error`, `id` | as a field's | The hint and the error describe the set, and the id is the fieldset's |

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

A live callout's message is drawn even when it is empty, so the page can fill it later. Every other
prop goes to the callout's `<div>`, `id`, `ref` and `className` included, except `style`, `role`,
the `title` attribute, `dangerouslySetInnerHTML` and the live attributes, since the message takes
its role from `live` alone.

## Theme switch and copy button

Two of the kit's controls that do something in the browser: a switch for the theme a visitor saves,
and a button that copies a block's text. Each is markup the components draw, or a page writes by
hand, and a function from `@jasonsdevspace/design-kit/controls` that a page calls on it, which
returns a function that takes it away again. The markup is hidden until it is attached, so a visitor
without script meets no control that does nothing, and the functions set no style, so a page's
policy can refuse every style it did not serve. Nothing runs when the module is imported.

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
of the site, which a page can word for itself. `attachThemeSwitch(element)` takes the switch, or
an element that holds it, checks the choice the page draws, shows the switch, and saves and draws a
choice under the theme contract's key, `system` following the system's scheme. It follows a choice
saved in another tab and a page restored by Back, and where the browser refuses storage it holds
the choice for as long as the page is open. The chosen word is drawn as a pressed button is, with an
edge twice as thick in the accent. The choices keep one row wherever it fits, and wrap onto as many
as they need where the switch's column is narrower, as at a large text size on a phone, so every
choice stays in sight.

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

Attaching one switch again before it is taken away attaches it once, and taking it away hides it
again. A switch attached after every switch was taken away shows, and draws, the choice saved
meanwhile, or the one the page holds where the browser would not save it. Every switch on a page
shows one choice, each with radios named for its own id. After the switch the component draws a
line inside `noscript`, "With scripts on, a Theme switch sits here.", which only a visitor without
script sees, and which a page words for itself or turns off with an empty `noscript`. A page that
writes the switch by hand adds the line as it likes.

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

`attachCopyButton(button, { source, status })` copies the text of the element `source()` returns
when the button is pressed, read at each press, so a button beside tabs copies the block its tab
shows. Where the browser refuses the clipboard, it selects that text instead. The button says Copied
or Selected for a moment, its three words sharing one cell so it keeps its width, and the status
line says which to a screen reader, with how to copy a selection with the keys or the device's own
command. One status line serves every button on a page, and it is on the page from the start, since
a line added at the moment it speaks may go unheard. Taking a button away hides it and puts it back
to Copy.

**`CopyButton` props**

| `CopyButton` | Default  | What it does                    |
| ------------ | -------- | ------------------------------- |
| `name`       | required | What it copies, read after Copy |
| `className`  | none     | A page's class, after the kit's |
| `ref`        | none     | The button drawn                |

`CopyStatus` takes `className` and `ref` the same way, its ref the line drawn, for a page that hands
it to a copy button's attach function.

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
starts at the h1. `main` holds the h1, the lead, the one action as an accent button, and then the
sections. Each section holds its number, hidden from a screen reader since its heading says what the
section is, then an h2 with an id, then its text, with an h3 for each part of it.

A section is a plain `<section>`, never named, and its h2 ids are a contract other pages link to, so
a page keeps an id when it rewords its heading, as
[decision 0009](https://github.com/jasonsdevspace/design-kit/blob/main/docs/decisions/0009-explainer-sections-are-never-landmarks.md)
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
padded 1.5rem, and 1rem at 48rem wide or less, and what it holds is spaced 0.75rem from the one
before it, a step closer than an explainer's parts. Inside an explainer its title steps down to the
body size.

</details>

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
region whether or not it scrolls, as
[decision 0008](https://github.com/jasonsdevspace/design-kit/blob/main/docs/decisions/0008-a-scroll-frame-is-always-a-region.md)
explains.

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
the right and never wrap, while text in a cell wraps and keeps its first line level with the rest of
its row. Code in a cell stays on one line, hyphens and spaces alike, so a token's name never breaks
after `--dk-`, and a long expression scrolls the frame as a wide table does.

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

The pinned cells take the page's ground, or a panel's, so the cells passing under them never show
through, and a rule at their end says where the pinned column stops. A table on a ground of its own,
such as a callout's, sets that ground in `--dk-table-ground`. The table draws its borders cell by
cell, so a pinned cell's rule travels with it. Only the first column is pinned, and the header row
scrolls with the table, since a table of a few rows needs no pinned header.

A table whose cells hold a link or a button sets `--dk-table-pinned-size` on its frame to the pinned
column's width, 8rem unless it does, so what the keyboard reaches stops beside the pinned column and
never under it. The names in the pinned column are kept short, since a long one widens the column
and leaves little of the table to scroll on a phone, and no cell in the first column spans rows,
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

A block of code keeps its lines as written and scrolls inside itself on screen and wraps on paper, since wrapping would break its
indentation and show line breaks the code does not have. It is a named region with a tabindex of 0,
for the same reasons as a table's frame. Its title says what the code is for, such as "Run it
yourself", rather than naming its language. `translate="no"` keeps a browser's translation of the
page off the identifiers. A block never takes `lang` for its programming language, since `lang`
names a human language. The code starts right after `<code>`, since a line break there shows as a
blank first line, and a `<` or `&` in it is written `&lt;` or `&amp;`. The kit adds no behavior
beyond the theme script, so a block has no copy button.

<details>
<summary>How a code block is drawn</summary>

A block sits on the card ground, or on the page's own ground inside a panel, so it reads as set into
what holds it. Its edge is transparent, and shows only in forced colors.

</details>

## App frame

An app's screen is a frame as tall as the screen: a bar across the top that says where the visitor
is, a body that scrolls between, and a dock at the bottom for what the screen is for. `components.css`
styles the markup below with no script. The frame is the page's whole content, with nothing above or
below it but a skip link, since anything else would add to the screen's height and push the dock out
of view.

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
            <button
                type="button"
                class="dk-button dk-button-text dk-toast-action"
                hidden=""
            ></button>
            <button type="button" class="dk-button dk-button-text dk-toast-close" hidden="">
                <span aria-hidden="true">×</span>
                <span class="dk-visually-hidden">Dismiss</span>
            </button>
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
the body. It holds that button at the larger target, and a second one below it where a screen has
two.

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
Nothing reads a height. A dock grows with what it holds and a tab bar grows at a large text size, so
the body ends where the rows below it begin. A toast floats over the foot of the body, just above
the dock, so showing or hiding one never moves the dock under a thumb about to press it again. While
one is shown its place opens on a rule, under which the body scrolls as it does under the bar, and
the body leaves room for a toast of two rows after its last element, so its last line scrolls clear
of the toast and what the keyboard reaches in it stops short of the toast, in a browser with
`:has()`. The room is that element's margin, so the body ends in a block, such as a paragraph or a
list, as its content does. On a screen too short for the frame the toast takes its row above the
dock, and the page keeps the dock in place as the toast comes and goes, in a browser that keeps a
scroll position by what is on screen, as Chrome and Firefox do. Each row but the body's is never
shorter than what it holds, and the body keeps 8rem, a few lines, so where the rows come to more
than the screen the page scrolls and no row covers its neighbor or squeezes the body to nothing.
What the body holds out of sight, such as a row's words for a screen reader, scrolls with it and
never lengthens the page.

The frame's height is `100dvh`, the dynamic height, so a phone browser's own bars coming and going
do not push the dock out of view. A browser without that unit reads `100vh`. The bar pads itself
past `--dk-safe-top`, so its ground runs up under a notch and its title starts below it. The frame
pads itself past the side safe areas, and its lowest part, the tab bar, or the dock or the body
where nothing comes after it, pads itself past `--dk-safe-bottom`, so its ground runs down under the
home indicator and what it holds stays clear of it, even where the page scrolls whole.

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

## Tab bar

A tab bar holds an app's top-level places at the bottom of a phone, under the thumb. It is a `nav`
holding a list of links, from two to five, each a label with room for an icon over it.

<!-- example: tabBar -->

```html
<nav class="dk-tabbar" aria-label="Sections">
    <ul>
        <li>
            <a href="/" aria-current="page">
                <svg aria-hidden="true" viewBox="0 0 24 24">...</svg>
                Play
            </a>
        </li>
        <li>
            <a href="/history/">
                <svg aria-hidden="true" viewBox="0 0 24 24">...</svg>
                History
            </a>
        </li>
        <li>
            <a href="/players/">
                <svg aria-hidden="true" viewBox="0 0 24 24">...</svg>
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
scrolls, over the page at `--dk-stack-bar`, and pads itself past `--dk-safe-bottom`. On a short page
it is still at the bottom. At the page's end it sits after the last of the content and never over
it, so the page pads by no height. The page's root has a `scroll-padding-bottom` of the bar's height
with a label on two lines, so what the keyboard reaches, or a link within the page leads to, stops
short of the bar and is never under it, in a browser with `:has()`. A label that wraps past two
lines makes the bar taller than that, so a label is a short word or two.

On a screen less than 24rem tall, a phone on its side or a page zoomed until its window is a few
lines tall, the bar scrolls with the page and waits at its end, so it takes no part of a screen that
short. So it does on a screen less than 18rem wide, a phone at a large text size, where its labels
wrap further than the room the page could keep for them.

Only the current link has a line, and the others are padded to its depth, so forced colors draw one
line. A tab bar does not print, and a page that ends in one prints as long as what it holds.

</details>

## Stepper

A stepper is a field for a small whole number, such as a bid from nothing to ten, that is quicker
to step than to type on a phone: a number field with a button to lower the value before it and one
to raise it after.

<!-- example: stepper -->

```html
<div class="dk-field dk-stepper-inline">
    <label class="dk-field-label" for="players">Players</label>
    <p class="dk-field-error dk-stepper-range" id="players-range" hidden="">
        <span class="dk-visually-hidden">Error: </span>
        Enter a number from 2 to 8.
    </p>
    <div class="dk-stepper dk-stepper-tall">
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
        <span class="dk-visually-hidden dk-stepper-status" role="status"></span>
    </div>
</div>
```

```js
import { attachStepper } from '@jasonsdevspace/design-kit/controls';

attachStepper(document.querySelector('.dk-stepper'));
```

It is the kit's field, so its label, hint and error work as every field's do, around a native
`input type="number"` that says its value to a screen reader. Most screen readers do not say its
limits, so where they matter the hint states them. The buttons are hidden until
`attachStepper(element)` shows them, so without script it is a number field alone, and they are
named for what they do and to which field, "Lower the number of players" and "Raise the number of
players". A status line out of sight says the value a press sets, since focus stays on the button,
and is emptied once the value is typed over, its form is reset or the stepper is taken away.

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
a form's reset set is followed. The field still takes a typed value. One outside the limits, or none
at all, shows the stepper's own error, which waits hidden in the markup, once the value is changed,
and the status line says it. The error is cleared as soon as the value is right again, and the
attach function adds and takes away only its own error, so an error or a hint the page draws keeps
its place. It takes the stepper or its field, attaches each stepper once whichever it is given, and
returns what takes it away again.

**`StepperField` props**

| `StepperField`        | Default                           | What it does                                                                                     |
| --------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `label`               | required                          | names the field                                                                                  |
| `min`, `max`          | required                          | the least and the greatest value                                                                 |
| `step`                | 1                                 | what a press adds or takes away                                                                  |
| `subject`             | the label, where it is words      | the words after Lower and Raise in the buttons' names, needed where the label is more than words |
| `rangeError`          | "Enter a number from min to max." | what a value outside the limits, or none, is told                                                |
| `inline`              | false                             | the label to the left, on one line with the stepper                                              |
| `tall`                | false                             | buttons and value at `--dk-target-large`                                                         |
| `hint`, `error`, `id` | none                              | as for every field                                                                               |

<details>
<summary>How a stepper is drawn</summary>

The buttons are `--dk-target` both ways, or `--dk-target-large` in a tall stepper. Where a large
text size leaves the stepper less room than its buttons take, on a phone, the buttons grow narrower,
never under the target at the usual text size, and keep their height, so the stepper fits its field,
in an app's dock too. The value is in the mono face with figures of one width, centered, with room
for two figures unless `--dk-stepper-digits` says more, and for the spacing between letters WCAG
asks a page to allow, so the field does not change width as the value changes and no figure is cut
off, and in a tall stepper it is at the heading size. With its label to the left the label takes the
room the stepper leaves and wraps within it, and the stepper moves under the label where a large
text size leaves no room for both. Its errors sit on lines above it, as every field's do, and its
hint on a line below. The number field's own spin buttons are taken away, since the stepper's
buttons stand in for them and they would keep their room even out of sight.

</details>

## Toast

A toast is a short message that appears over the page, says what just happened and offers one
action, such as Undo, in place of asking before a save or a delete. The markup holds its live region
and its two buttons, empty and hidden, and draws nothing until a message is shown.

<!-- example: toast -->

```html
<div class="dk-toast">
    <p class="dk-toast-message" aria-hidden="true"></p>
    <p class="dk-visually-hidden dk-toast-status" role="status"></p>
    <button type="button" class="dk-button dk-button-text dk-toast-action" hidden=""></button>
    <button type="button" class="dk-button dk-button-text dk-toast-close" hidden="">
        <span aria-hidden="true">×</span>
        <span class="dk-visually-hidden">Dismiss</span>
    </button>
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
it. With an action, the line says its
name too, as in "Round 3 saved. Undo is available.", so a visitor who cannot see the toast learns
there is a way back, and the same words shown twice are heard twice. The function returns what
dismisses that message, which does nothing once another has replaced it or it has gone.

A toast leaves when its close button, its action, or Escape with focus in it dismisses it, or the
next message replaces it. One with an action stays until then, since a timer would take the action
away from anyone slower than it. One with no action also leaves after five seconds, a wait held
while the pointer is over it or focus is in it. When a message arrives, what has focus stays in
view, scrolled clear of the toast where the toast would cover it. When a toast leaves with focus in
it, focus goes back to the last control outside the toast that had focus when a message arrived, and
where there was none, or it no longer takes focus, to the body of the app's frame, or on a page with
no frame to its main content where that takes focus. An action runs after the toast has left, so
where it takes away what focus came from, it moves focus itself. A message with no action replaces
one with an action and its way back, so a page shows one another only when the first is done with.
More than one action is a dialog's job.

One toast serves a page. In an app's frame it sits in the frame's place for it, `dk-app-toast`,
floating over the foot of the body just above the dock, so it never moves the dock, and the body
pads so its last line scrolls clear of it. On a page with no frame it
sits at the bottom of the screen, over the page and clear of the safe areas, in the app's column.
While it is shown there, what the keyboard reaches stops short of a toast of two rows, a line of
message over its buttons as at a large text size, and the page's end scrolls clear of it. A longer
message makes the toast taller than that, so a toast's message is a short sentence. A page that
ends in a tab bar and shows toasts is drawn in the frame, where the toast clears the bar. A toast shown while a dialog is open sits under the dialog's
scrim, out of sight and out of a screen reader's reach, so a page shows its message once the dialog
has closed.

**`Toast` props**

| `Toast`     | Default | What it does                                               |
| ----------- | ------- | ---------------------------------------------------------- |
| `className` | none    | a page's class, after the kit's                            |
| `ref`       | none    | the toast drawn, for a page that hands it to `attachToast` |

<details>
<summary>How the toast is drawn</summary>

Shown, the toast is a raised card on `--dk-raised` with an edge in the line color, which forced
colors draw where the shadow is gone, and it rises into place over `--dk-duration-medium` each time
it is shown, at once for a visitor who asks for less motion. A message of a few lines wraps beside the buttons. On a phone at a
large text size, under 20rem wide, the message takes a row of its own and the buttons share the row
under it, at its end. The close button is at least the target wide. Outside a
frame the toast sits at `--dk-stack-toast`, over a bar. A toast does not print.

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
Tab key. A page with many cells may give the group one stop instead, with a roving tabindex, so the
arrow keys move between cells and Home and End reach the ends. That is the page's to write, as a
tab list's keys are.

The page sets how many columns it wants in `--dk-button-grid-columns`, in its own sheet, three
unless it does:

```css
.hand {
    --dk-button-grid-columns: 6;
}
```

<details>
<summary>How the grid is drawn</summary>

Where the columns asked for would make a cell narrower than `--dk-target`, the grid draws as many as
fit, so six asked for in an app's frame on a phone 320px wide, inside its 1rem gutters, draws five.
Each cell is at least the target tall. In a `dk-button-grid-tall` grid each is at least
`--dk-target-large` both ways, for keys pressed at arm's length, and a `dk-button-tall` cell is that
tall in any grid. The cells are spaced by 0.5rem, and a label wraps within its cell at a large text
size. The grid takes the width of what holds it, so it sits in a block with a width of its own,
never in a box that shrinks to fit what it holds, where it would draw one column.

A toggle that is on is filled in the accent with its words at the strong weight, so on and off
differ by how light the cell is and by weight, not by hue alone, and forced colors fill it in the
system's selection colors. A cell that is off, by `disabled` or by `aria-disabled`, has a dashed
edge and keeps the page's text color, where a faded one is hard to tell from a toggle that is only
not pressed, and in forced colors takes the system's gray as any off button does. One that is off
and on keeps a thicker edge in the control's color, or in the highlight in forced colors. A cell reads the button's `--dk-button-shadow` and `--dk-button-press`, so a page that
sets them gives every cell a shadow and a press, and a toggle that is on rests where a held one
lands.

</details>

## Rows

A list of rows holds the games played, the players or the steps to install: each row a title, a
muted line of detail under it, and room at its end for a figure, a tag or one button, with a rule
between rows. It is classes alone, since a row holds no state of its own.

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
a page puts a sentence in its place that says what is missing and how to add one.

A row is a link or holds a button, never both, so a tap never does two things. A row that leads
somewhere is one `a.dk-row` across its width, one stop for the keyboard, ending in a chevron, a
`dk-row-sign` hidden from a screen reader, that says so on a phone, where nothing hovers. It is named by all of its words with the title first, so a screen reader says the title
before the rest, and a visitor who speaks to their device can say any of what they see. A comma out
of sight after the title and before the figure makes a pause between them when read aloud, and a
figure's unit out of sight says what it counts. A row with an action of its own, such as
removing it, is a `div.dk-row` with the button at its end, named for what it does and to which row,
with the row's name out of sight where the button's face says only the action. An action that
removes a row acts at once with a toast that offers Undo, as the kit's app does in place of asking
first. A figure at the end is a `dk-row-figure`, and a tag a `dk-pill`.

<details>
<summary>How the rows are drawn</summary>

Each row is at least `--dk-target` tall, and at least `--dk-target-large` in a list whose classes
are `dk-rows dk-rows-tall`. A row is inset at each side by the room a focus ring takes, and a button
at its end sits in the middle of its height. The rule between rows is in the line color, which forced colors keep as an edge, and
a row takes no ground of its own, so a list sits on a page or a panel alike. The end sits on the line
of the title's first line, so a long title wraps and the row grows with its end still beside where
the title starts, and a row of one line sits in the middle of its height.

A link row's chevron is in the muted color. Its focus ring is
drawn inside it, around the whole row, and a pointer over it, or a thumb pressing it, underlines the
title. A figure is in the mono face with figures of one width, so a column of them lines up.

</details>

## Dialog

A dialog asks a question over the page, and its sheet form opens a panel from the bottom of a
phone. Both are the native `dialog` element opened as a modal, so the browser holds focus inside,
closes it on Escape and makes the page behind it inert.

<!-- example: dialog -->

```html
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
        <label class="dk-field-label" for="dealt">Cards dealt</label>
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
document.querySelector('#end').addEventListener('click', open);
```

A dialog is named by its heading, a `dk-dialog-title` its `aria-labelledby` points to. A short
question is also described by its text, through `aria-describedby`, so a screen reader says what
an answer leads to before the answers. Its answers sit in a `form method="dialog"`, so a press of
one closes it and leaves the answer in the dialog's `returnValue`. The first of them takes focus as
it opens, so an answer that cannot be taken back comes last and the one that keeps things as they
are first, and a press of Enter as the dialog opens changes nothing. A sheet whose title and
options come before its first control gives its title `tabindex="-1"` and `autofocus`, so it opens
at its top with its title said, rather than scrolled to a control further down.

`attachDialog(dialog)` returns the function that opens it, and focus goes back to what opened it
when the dialog closes, however it is closed. Handed the event of the press that opened it, from a
listener on the button, on a part of the page that holds it or in React, it finds the button the
press landed on, since Safari gives a clicked button no focus to remember. Called otherwise, it
takes the element to return to, or remembers what had focus. Where nothing had focus, or what it
returns to is gone from the page by the time the dialog closes, focus goes to what `returnTo` gives.
It also closes the dialog on a tap on the scrim around it, one that starts and ends there so a drag
out of the dialog closes nothing.

A dialog that must be answered is attached with `{ stay: true }`, and then stays open on Escape, a
phone's Back and the scrim. That is held by the dialog's `closedby` attribute, which Chrome reads
from version 134. Chrome 123 to 133, at the kit's floor, lets a page refuse a close once and closes
the dialog on a second Escape or Back, so a page there treats a dialog that must be answered as one
that can be dismissed too. Attaching a dialog again sets the options given and returns the same
function. Its listeners are on the dialog, so a dialog taken from the page takes them with it.

The kit's app takes an action at once and offers Undo in a toast rather than asking first, so it
asks in a dialog only where nothing could undo the answer.

<details>
<summary>How a dialog is drawn</summary>

A dialog sits in the middle of the screen, at most 32rem wide, on the raised ground with the raised
shadow and an edge forced colors keep, over a scrim in `--dk-scrim`. It scrolls inside itself when
it holds more than the screen does, and while one is open as a modal the page behind it does not
scroll, in a browser with `:has()`. It stands what it holds `--dk-space-3` apart, and its actions
further. Its title is at the title size, and its actions sit at its end, wrapping under one another
where the room runs out. Its margins from the screen's edges and its padding stop growing with the
text past their usual size, so on a phone at a large text size what it holds, such as a stepper,
keeps its room. They stop there too where a page sets the space tokens larger.

A `dk-dialog-sheet` sits at the bottom edge, the app's column wide, with its top corners rounded and
its last line clear of the home indicator. It rises into place over `--dk-duration-medium` as it
opens, at once for a visitor who asks for less motion.

</details>

## Layers and palettes

The tokens declare three layers, `dk.tokens`, `dk.base` and `dk.components`, in that order, and each
sheet fills its own. A page's own rule outside a layer, however little it weighs and wherever its
sheet loads, wins over every rule of the kit's except the reduced-motion rule and the rule that hides
a kit element marked `hidden`, or anything marked `hidden` inside one, as
[decision 0002](https://github.com/jasonsdevspace/design-kit/blob/main/docs/decisions/0002-rules-sit-in-dk-layers.md)
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
button loses its edge. Such a page puts the kit's layer first in its own order, then its reset's, then
one for the components, and imports the components sheet into that one:

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
meant for, in both themes, as
[the accessibility statement](https://github.com/jasonsdevspace/design-kit/blob/main/ACCESSIBILITY.md#how-it-is-checked)
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
layer sets them back to light in print too. On paper a callout and a code block keep an edge in the line
color, a code block wraps and a scrolling table shows whole with its code and figures wrapping, and
the theme switch, the copy button, the skip link and a strip's switches do not print.

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
