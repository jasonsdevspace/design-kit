/*
 * The specs that run in WebKit and in Firefox as well as in Chromium, each named with the reason it
 * runs there. A spec left out runs in Chromium alone. The names are checked against the files by
 * scripts/engines.test.ts, so a name typed wrong fails there rather than matching nothing.
 */

/** A spec's name, the file's without `.spec.ts` or `.spec.tsx`, and why it runs in the engine. */
export type Engine = Readonly<Record<string, string>>;

/** What Safari draws or does its own way, and what every engine does its own way. */
export const WEBKIT: Engine = {
    app: "A bar that stays put and a height that follows the browser's own bars.",
    tabbar: 'A bar stuck to the bottom of the screen, clear of the home indicator.',
    toast: 'Where focus is after a press by pointer, which Safari leaves off the button.',
    dialog: 'The native dialog, its scrim and its sheet at the bottom edge.',
    close: "A dialog's Close closing it with no script, in the native dialog.",
    stepper: "A number field's inner room, and a press by pointer that gives no focus.",
    'stepper-say': 'A stepper attached again from a focusout handler, an event each engine fires.',
    table: "What a table's frame scrolls to as the keyboard reaches a link in it.",
    icon: "How an svg's stroke is drawn.",
    rows: "How a phone's list of rows is pressed and reached by the keyboard.",
    panel: "Where focus goes after a real press, built around Safari's way.",
    attach: 'The clipboard, which Safari lets a press write to and refuses a read from.',
    pieces: "How the theme switch's choices open and close by pointer and by tap.",
    'buttongrid-columns':
        "A grid's columns, which rest on each engine's sums of a share and clamps.",
    roving: 'The stop placed on a cell a press lands on, where Safari gives the press no focus.',
    dock: "Two actions sharing a phone's row, by each engine's widths of the words.",
    'try-again': "Focus moved to a heading as a load starts again, by each engine's own focus.",
    stack: "The list role Safari drops with a list's markers.",
    split: "A long first word broken at a phone's width, by each engine's line breaks.",
    empty: 'Focus back on the search field as the list comes back.',
    hero: "A heading broken between words only, by each engine's line breaks.",
    progress: 'The native bar, which each engine draws its own way.',
    checked: 'Focus on the first field in error after a submit by Enter.',
    shadow: 'Focus handed back inside a shadow root, from where Safari leaves it.',
    teardown: "A signal's abort and what follows it, the dialog's close event among them.",
    focus: "Where focus falls as a control leaves, which is each engine's own.",
    leaks: 'What a piece leaves running once taken down, counted in every engine.',
    strict: "The hooks under StrictMode, whose second run meets each engine's focus and events.",
    busy: "A busy button's dots, a gradient each engine draws and places on its own.",
    hooks: "Each hook letting go of an element swapped, through each engine's events.",
    form: 'Where focus is after a refusal and a reset, which Safari sets its own way.',
};

/** What Firefox draws or does its own way, and what every engine does its own way. */
export const FIREFOX: Engine = {
    busy: "A busy button's dots, a gradient each engine draws and places on its own.",
    stepper: 'A number field keeps its spin buttons unless `appearance: textfield` takes them.',
    'stepper-say': 'A stepper attached again from a focusout handler, an event each engine fires.',
    controls: 'Lengths Firefox rounds to a sixty-fourth of a pixel.',
    pieces: 'Lengths Firefox rounds to a sixty-fourth of a pixel.',
    table: "A frame's shade, drawn only where a browser ties an animation to a scroll.",
    icon: "How an svg's stroke is drawn.",
    'buttongrid-columns':
        "A grid's columns, which rest on each engine's sums of a share and clamps.",
    progress: 'The native bar, which each engine draws its own way.',
    checked: 'Focus on the first field in error after a submit by Enter.',
    shadow: 'Focus handed back inside a shadow root.',
    teardown: "A signal's abort and what follows it, the dialog's close event among them.",
    focus: "Where focus falls as a control leaves, which is each engine's own.",
    leaks: 'What a piece leaves running once taken down, counted in every engine.',
    toast: 'Focus handed back by where it came from, and by a key past a frame of another origin.',
    strict: "The hooks under StrictMode, whose second run meets each engine's focus and events.",
    hooks: "Each hook letting go of an element swapped, through each engine's events.",
    dialog: "Focus handed back to the dialog's opener, an SVG link too, by each engine's focus.",
    panel: "Focus handed back as the panel closes, to an SVG link too, by each engine's focus.",
};

/**
 * The patterns that match the specs an engine names, one for each, since a brace of one name
 * matches nothing where a brace of several matches each.
 */
export const specsOf = (engine: Engine): string[] =>
    Object.keys(engine).map((name) => `*/e2e/${name}.spec.{ts,tsx}`);
