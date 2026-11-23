# Decision records

The decisions in the kit that had a real alternative, with the options rejected, what the choice
costs, and the test behind it.

1. [The kit is a workspace, built on pack and installed from
   npm](0001-a-workspace-built-on-pack.md): how the compiled entries reach a demo, and why a git
   install was measured and turned down.
2. [The kit's rules sit in dk layers, with a prefix and no weight](0002-rules-sit-in-dk-layers.md):
   how the kit loads beside a page's own styles without taking its names or winning over its rules.
3. [Each color holds both themes in one light-dark()](0003-one-light-dark-per-color.md): one value
   per role for both themes, and the browser floor that sets.
4. [One theme contract with the portfolio, set before the first paint](0004-one-theme-contract.md):
   the key, the themes and the script in one place, put inline by a plugin that fails the build of
   a page without it.
5. [The components carry no stylesheet of their own](0005-components-carry-no-stylesheet.md): one
   `components.css` a page loads itself, and markup alone from the React components, which is the
   contract a page without React writes by hand.
6. [A control's state is an attribute, and its rules weigh
   nothing](0006-a-control-state-is-an-attribute.md): pressed, open, invalid and off drawn from the
   attributes a screen reader reads, off as `aria-disabled` so it keeps its focus, and every rule in
   `:where()` so a state wins by order.
7. [A callout takes a role only when a page asks for
   one](0007-a-callout-takes-a-role-only-when-asked.md): no role from the tone, so a message on the
   page at load is not read out of turn, and a live message's role on the message alone.
8. [A frame that scrolls is always a named region](0008-a-scroll-frame-is-always-a-region.md):
   tables and code that scroll inside themselves on screen at every width with no script, titled
   from outside the frame rather than by a caption, and code that wraps only on paper, with a copy
   button only from a page's script.
9. [An explainer's sections are never landmarks](0009-explainer-sections-are-never-landmarks.md):
   plain sections a reader moves between by their headings, ids other pages link to, and jumps
   that keep a section's number in sight.
10. [The markup each piece draws lives in one module of examples](0010-one-module-of-examples.md):
    the reference's blocks written from React elements the browser tests import too, rather than
    kept in step by hand, and why a documentation framework was turned down.
11. [The site is built with Vite and React's static render, with no script of
    React's](0011-the-site-is-built-with-vite-and-a-static-render.md): static pages drawn from the
    published kit's components under the policy a demo sets, and why Storybook, docs frameworks and
    pages written by hand were turned down.
12. [The site has a script of its own, from its own path, beside the kit's theme
    script](0012-the-site-has-a-script-of-its-own.md): a script of the site's own, allowed from its
    own path alone, that puts the kit's theme switch in the room the strip keeps and copy buttons
    beside the code, and why React in the browser and a second inline script were turned down.
13. [The kit's controls ship their behavior as a module a page attaches to their
    markup](0013-controls-attach-to-markup.md): the theme switch, the copy button, the stepper, the
    toast, the dialog, the panel and the table as markup from a component and a function a page
    calls on it, from `./controls`, and the behaviors added since, a form's check and refusal, a
    busy button, progress, moving focus and a group's keys, the size budgets of the sheets and the
    controls with each raise, and why a stateful component and a script that builds the DOM were
    turned down.
14. [A piece with no state of its own ships as classes
    alone](0014-stateless-pieces-ship-as-classes.md): tabs, pills and the eyebrow as classes a page
    writes by hand, with the roles the page writes, the keys `attachRoving` runs and the chosen tab
    the page owns, and why a component for each was turned down.
15. [A toast's attach function returns what shows a
    message](0015-a-toast-attach-returns-what-shows-a-message.md): a toast as markup on the page
    from the start and a function that shows each message in it, said with its action's name, and
    the status line's attach, which says words at once, once they settle or politely, and why a
    separate export to show a message and a toast built by script were turned down.
16. [A page changes how a piece draws only through the properties it
    names](0016-a-page-changes-how-a-piece-draws-only-through-the-properties-it-names.md): a ground,
    a shadow or a width a page sets through a property the kit reads with a fallback and leaves
    unset, listed with its default and its contrast duty, and why a page's own class over a kit
    piece and a token for each were turned down.
17. [A content page is a container of its own](0017-a-content-page-is-a-container.md): `dk-page`
    spacing a landing or an about page's blocks and sections by the flow and holding its prose and
    its lead to the measure, with bands, stacks and groups of sections for a landing page in bands,
    and why a reset of every block's margins, the explainer and a content page per band were turned
    down.
18. [The tokens ship in the design tokens format, written by hand and held by a
    test](0018-the-tokens-ship-in-the-design-tokens-format-written-by-hand.md):
    `tokens.resolver.json` as one 2025.10 resolver document shipped as written, renaming or dropping
    a token in it or moving to a later edition a breaking change, and why generating it from the
    sheet or the sheet from it were turned down.
19. [A closing panel hands focus to its button only where the visitor's place was in
    it](0019-a-closing-panel-hands-focus-back-only-where-the-visitors-place-was-in-it.md): focus
    handed back where it is in the panel, or where it is on the body or nowhere and the visitor's
    last focus or press was in it, the rule the toast and a dialog taken down share, a panel and its
    buttons given a tabindex for Safari, focus sent on to where a link in the panel jumps, Escape, a
    panel kept the kit's while an attached button names it, `moveFocus` falling back by the same
    walk, and why the path of the last click and a flag for interaction outside were turned down.
20. [The kit's React hooks wrap its attach
    functions](0020-react-hooks-wrap-the-attach-functions.md):
    a hook for each attach a React page needs, a form, a busy button, progress and a group of cells,
    the status line through `StatusProvider`, and for moving focus, each attaching through a
    callback ref whose cleanup aborts the signal it gave its attach and taking its part down at
    once, while the kit keeps the control through a ref made afresh, setting its options again only
    when one changes, and making a focus request once the page's change is drawn or as its component
    unmounts, a form React still draws refused only through `useFormRefusal`, the markup components
    held free of effects by the lint, and why leaving pages to attach in an effect, behavior written
    in React, three ways of telling a stale focus request apart, and a mark on every React field
    and an observer that repairs React's markup were turned down.
21. [A refused form checks the browser's constraints
    itself](0021-a-refused-form-checks-the-browsers-constraints-itself.md):
    the browser's constraints as the truth and the kit's errors in place of its bubble, `noValidate`
    from script so a page without script keeps the browser's check, words for each failure a field
    or a page can replace, the research behind it, and why leaving the check on, leaving the check
    to each page and canceling each `invalid` event were turned down.
22. [Every attach takes a signal that takes its piece
    down](0022-every-attach-takes-a-signal-that-takes-its-piece-down.md):
    `{ signal }` on every attach, nothing attached for a signal already aborted, an abort that does
    what the detach does, a teardown complete and safe to repeat, calls after it that do nothing, a
    later attach joining the piece, which record 23 settles, the internal helper that keeps it, the
    research behind it, and why a release function for each piece, `Symbol.dispose`, one handle from
    every attach and calls that throw or warn were turned down.
23. [A control outlives a takedown and an attach in one
    task](0023-a-control-outlives-a-takedown-and-an-attach-in-one-task.md):
    every signal that attaches an element holding its control, a takedown a microtask after the last
    of them aborts that an attach before then cancels, a detach that still takes it down at once,
    the newest holder's options, the hooks taking their part down at once, a stepper handing focus
    back from its buttons, and why deferring the takedown in the hooks and leaving it to pages were
    turned down.
24. [A plain form spaces only the kit's blocks](0024-a-plain-form-spaces-only-the-kits-blocks.md):
    a field, a row of fields, a row of actions and a callout that is not empty in a form with no
    class attribute each stand a step below what sits above them once another has come before, a
    page's own markup there drawn as in a form with a class, buttons in a row of actions, and why
    spacing every part by tag names and a flex column were turned down.
25. [A row of fields sizes each field by a length, never by its
    content](0025-a-row-of-fields-sizes-each-field-by-a-length-never-by-its-content.md): `dk-fields`
    starting every field from `--dk-fields-least` and sharing the rest, a field narrowed by
    `--dk-field-measure`, and why a stepper's field sized by its stepper, a grid of equal tracks, a
    container query, fixed widths and no row were turned down.
26. [A `:has()` on an element that holds the page is written only where the rule draws that
    element](0027-a-has-on-an-element-that-holds-the-page-is-written-only-where-the-rule-draws-that-element.md):
    Chromium restyling everything inside the root, the body or a frame whose `:has()` draws
    something else, the body as the subject of its own rule under a page's toast, `attachToast`
    marking a frame's body with `data-toast-rows`, a dialog told by the frame it sits in or beside,
    and why a property the root sets, a sibling `:has()`, a class on each subject and the body's own
    padding were turned down.
