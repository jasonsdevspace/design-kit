# Decision records

The decisions in the kit that had a real alternative, with the options rejected, what the choice
costs, and the test behind it.

1. [The kit is a workspace, built on pack and installed from npm](0001-a-workspace-built-on-pack.md):
   how the compiled entries reach a demo, and why a git install was measured and turned down.
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
6. [A control's state is an attribute, and its rules weigh nothing](0006-a-control-state-is-an-attribute.md):
   pressed, open, invalid and off drawn from the attributes a screen reader reads, off as
   `aria-disabled` so it keeps its focus, and every rule in `:where()` so a state wins by order.
7. [A callout takes a role only when a page asks for one](0007-a-callout-takes-a-role-only-when-asked.md):
   no role from the tone, so a message on the page at load is not read out of turn, and a live
   message's role on the message alone.
