/*
 * The specs that run in WebKit and in Firefox as well as in Chromium, each named with the reason it
 * runs there, and with the tests the reason covers where it covers fewer than all. A spec whose
 * every test is about what the engine does its own way runs whole. One whose reason covers a few
 * names them, and one whose reason covers all but a few, the kit's own words, marks and options
 * that no engine draws or orders its own way, names those it leaves out, so a test added to it runs
 * in the engine until it is named. A spec left out runs in Chromium alone. The names, of specs and
 * of tests, are checked against the files by scripts/engines.test.ts, so a name typed wrong fails
 * there rather than matching nothing.
 */

/**
 * Why a spec runs in an engine: every test in it, the tests named, as each test's title is written
 * after its describes and their ` › `, or every test but those named.
 */
export type Run =
    | string
    | { readonly reason: string; readonly tests: readonly string[] }
    | { readonly reason: string; readonly except: readonly string[] };

/** A spec's name, the file's without `.spec.ts` or `.spec.tsx`, and why it runs in the engine. */
export type Engine = Readonly<Record<string, Run>>;

/** The reason a spec runs in an engine, whichever of its tests run. */
export const reasonOf = (run: Run): string => (typeof run === 'string' ? run : run.reason);

/** What Safari draws or does its own way, and what every engine does its own way. */
export const WEBKIT: Engine = {
    clock: "The still clock the specs share, which each engine's page runs.",
    app: {
        reason: "A bar that stays put and a height that follows the browser's own bars.",
        tests: [
            'shows the bar, the body and the dock, and scrolls only the body',
            'clears what the phone keeps at each edge, by the safe area tokens',
            "scrolls the body's last line clear of everything below it, at a doubled text size",
            'carries a swipe that reaches the end of the body on to the page, and ends clear of the home indicator',
            'scrolls the page whole on a phone too short at a doubled text size for a body between the bar and the dock',
            'keeps what the body holds out of sight from lengthening the page',
            'is as tall as the screen at any height, by the dynamic height',
            'squeezes no row where the bar and the dock come to more than the screen, and scrolls the page',
            'takes the keyboard through the bar, then the body, then the dock',
            "scrolls the body by the keyboard once it has focus, with its ring inside the screen's edges",
            'lets the page scroll whole on a screen too short for a body between the bar and the dock',
            'pads past a side safe area only by what the column leaves uncleared, on a phone on its side',
            'keeps a frame with no dock and no tab bar clear of the home indicator',
            "keeps the bar's rule in sight over a toast at twice the text size on a narrow phone",
            "sets a toast above the dock and clear of the body's last line, with a dock of one row and of two",
            'draws the skip link below the top safe area and past the side one',
            'gives a pictured frame drawn taller than what it holds the room in its body, its bars at its foot',
            'draws a pictured frame and a pictured page that ends in a tab bar at what they hold, their bars in place and clear of no safe area, 390 by 800',
            'draws a pictured frame and a pictured page that ends in a tab bar at what they hold, their bars in place and clear of no safe area, 1280 by 500',
        ],
    },
    tabbar: {
        reason: 'A bar stuck to the bottom of the screen, clear of the home indicator.',
        tests: [
            'stays at the bottom of the screen while the page scrolls, and on a page shorter than the screen',
            'clears the home indicator, by the bottom safe area token',
            'takes no placing of its own in a wrapper, so a frame clears the home indicator once',
            "scrolls the page's last line clear of the bar",
            'stays as tall as the screen on a page with padding of its own',
            "is the last row of an app's frame, clear of the home indicator once, and the keyboard's last stops",
            'scrolls what takes focus clear of the bar, so the bar never covers it',
            'scrolls what takes focus clear of a bar whose labels take two lines',
            'scrolls what the keyboard reaches clear of the bar on a page 390px wide that doubles its root size',
            'scrolls what the keyboard reaches clear of the bar on a page 320px wide that doubles its root size',
            'scrolls with the page on a phone at twice the text size, where its labels wrap further',
            'scrolls with the page on a screen too short to give it a row of its own',
        ],
    },
    toast: {
        reason: 'Where focus is after a press by pointer, which Safari leaves off the button.',
        except: [
            'has no audit findings in the light theme, shown and not',
            'has no audit findings in the dark theme, shown and not',
            'returns the one function it showed with when attached again',
            'prints no toast, shown or not',
        ],
    },
    dialog: {
        reason: 'The native dialog, its scrim and its sheet at the bottom edge.',
        except: [
            'says what an answer leads to before the answers',
            'takes the options it is attached with again, and keeps them when attached again with none',
            'has no audit findings in the light theme, open',
            'has no audit findings in the dark theme, open',
        ],
    },
    close: {
        reason: "A dialog's Close closing it with no script, in the native dialog.",
        tests: [
            "opens a dialog on its first answer, meets the Close after the title's question, and closes by it with no script",
            "names a panel's Close for what it closes, and draws a closed dialog with a Close not at all",
        ],
    },
    stepper: "A number field's inner room, and a press by pointer that gives no focus.",
    'stepper-takedown': "Where focus goes as a stepper is taken down, which is each engine's own.",
    'stepper-say': 'A stepper attached again from a focusout handler, an event each engine fires.',
    'stepper-height': "A stepper's height beside a field's, by each engine's number field.",
    table: {
        reason: "What a table's frame scrolls to as the keyboard reaches a link in it.",
        tests: [
            'brings a link the frame cuts off fully into view when the keyboard reaches it',
            'brings a link out from under a pinned column wider than the room kept for it',
            'brings a link out from under a pinned column in a table inside a frame the page attached',
            'brings a link into view the same way in a table that reads right to left',
            'brings a link cut by no more than a target into view without script',
            'lets the frame go, leaving a link under the pinned column to the browser',
            'shows the first words of a link wider than the room, either way a table reads',
            'leaves a link a pointer presses to the browser, and the press lands',
            'refuses an element that is in no frame, rather than attach nothing',
            'moves the frame once a step, where the browser would leave it, under a narrow pinned column',
        ],
    },
    icon: "How an svg's stroke is drawn.",
    rows: {
        reason: "How a phone's list of rows is pressed and reached by the keyboard.",
        tests: [
            'makes a link row one stop named by its words, title first, with its ring around the whole row',
            "makes a button at a row's end its own stop, named for what it does and to which row",
            'keeps a row with a button as tall as one without, the button in the middle and every ring off the words',
            "reaches a row's group of buttons in order by the keyboard at 1x the text size, each named for its seat",
            "reaches a row's group of buttons in order by the keyboard at 2x the text size, each named for its seat",
            "underlines a tile's title under a pointer, and rings it outside, as a separate control",
            "underlines a tile's title under a pressing thumb, on a phone where nothing hovers",
            "keeps a tile's whole ring in view as the keyboard scrolls an app's body to it",
            'flows tiles into columns on a wide page, one column on a phone, in reading order for the keyboard',
        ],
    },
    panel: {
        reason: "Where focus goes after a real press, built around Safari's way.",
        except: [
            'refuses a button that names no panel, saying what it needs',
            'attaching and letting go › leaves a button attached again alone when what was returned before is detached',
        ],
    },
    attach: {
        reason: 'The clipboard, which Safari lets a press write to and refuses a read from.',
        tests: [
            'follows a choice saved in another tab',
            'holds a choice the browser will not save, through a page restored by Back',
            'copies the source on a click or on Enter, says Copied on the button and the status line, then Copy again',
            'keeps the choices open, with focus on them, when a press on a choice is dragged off and lifted outside',
            'collapses the switch in a strip on a screen narrower than 20rem to one button naming the choice shown',
            'keeps the choices open through a swipe beside them, so a touch can scroll to them, and closes on a tap there',
            'opens the choices under the button, one to a row at the target, and closes on a pick by pointer with focus on the button',
            'moves the choice with the arrow keys without closing, and closes on Escape or a press outside',
            'closes the choices where they are when focus leaves the switch, and keeps them when it lands on the button',
            'moves no focus on a press on the button or a choice, so the choices stay until the click',
            "keeps the choices open on a press on the list's own padding, and closes them on one on the name",
            'selects the source where the clipboard is refused, says how to copy it, and keeps focus on the button pressed by Space',
            'follows a choice another tab saves after a choice made with no switch, on a switch attached later',
            'leaves a copy button taken away mid-press hidden, at Copy, and silent once the clipboard answers',
            'says what a press did but selects nothing when its source changed before the clipboard answered',
        ],
    },
    pieces: {
        reason: 'How a pressing thumb and a pointer change the pieces, the theme switch collapsed in a strip, and the focus rings Safari draws.',
        tests: [
            "collapses to its name and one button naming the choice in a demo's strip narrower than 20rem",
            "keeps the row of three choices in a demo's strip at 20rem and wider, and outside the strip at any width",
            "rings focus and edges a pointer's button in the focus color a page sets",
            "draws the switch's own ring, on the chosen word, in the focus color",
            "changes a resting pill, a resting tab and the site's brand under a pressing thumb, where nothing hovers",
            'underlines a pill and a tab under a press in forced colors, where their color is replaced',
        ],
    },
    'buttongrid-columns':
        "A grid's columns, which rest on each engine's sums of a share and clamps.",
    roving: 'The stop placed on a cell a press lands on, where Safari gives the press no focus.',
    dock: "Two actions sharing a phone's row, by each engine's widths of the words.",
    'try-again': {
        reason: "Focus moved to a heading as a load starts again, by each engine's own focus.",
        tests: [
            'fills the callout at the first failure and moves no focus',
            'reads the failure and never the button in the alert',
            'reads the same failure twice with focus left on what is loading again',
            'puts a failure that comes back at once in a moment after the callout empties',
            'draws the list and marks the callout empty again when Try again works',
            'mounts the callout empty and out of sight beside the loading line',
        ],
    },
    stack: {
        reason: "The list role Safari drops with a list's markers.",
        tests: [
            'draws a stack on a list with no marker, indent or room of its own',
            "writes the list's role in the example, which Safari drops with the markers",
        ],
    },
    split: "A long first word broken at a phone's width, by each engine's line breaks.",
    empty: {
        reason: 'Focus back on the search field as the list comes back.',
        tests: [
            'the saved games › waits for typing to stop, then says the search matches nothing and names it',
            'the saved games › brings the list back with focus on the search when Clear is pressed by Enter',
            'the saved games › brings the list back with focus on the search when Clear is pressed by a pointer',
            'the saved games › brings the list back when the search is emptied in the field itself',
        ],
    },
    hero: "A heading broken between words only, by each engine's line breaks.",
    progress: 'The native bar, which each engine draws its own way.',
    checked: {
        reason: 'Focus on the first field in error after a submit by Enter.',
        except: [
            'marks every field not in error so before anything is submitted',
            'names a field without the mark its label hides from a screen reader',
            "gives an error the page drew for a field the kit's words, and puts the page's back once it passes",
            "takes away the mark a stepper put back once its form's attach is taken down",
            'takes away the mark of a stepper taken down before its form, once both are down',
            'leaves the mark a later check of its form set on a stepper that outlived the first',
            'keeps the mark of a stepper taken down and attached again on the same value',
            "counts a page's own set of boxes of different names once",
            'gives fields with no id errors of their own',
            'lets a field marked off pass, since no one could put it right',
            "draws a field's error after its hint, and describes it after the hint",
            "lets the form's own attach take over the check from a part attached first",
        ],
    },
    shadow: 'Focus handed back inside a shadow root, from where Safari leaves it.',
    teardown: "A signal's abort and what follows it, the dialog's close event among them.",
    focus: "Where focus falls as a control leaves, which is each engine's own.",
    leaks: 'What a piece leaves running once taken down, counted in every engine.',
    strict: {
        reason: "The hooks under StrictMode, whose second run meets each engine's focus and events.",
        except: [
            "keeps words said in a part's first effect on the provider's line through the second run",
        ],
    },
    busy: {
        reason: "A busy button's dots, a gradient each engine draws and places on its own.",
        tests: [
            'marks a busy button off and ignores a press by pointer, Enter, Space or a form',
            'shows and says the wait once it outlasts the token, with motion no-preference',
            'shows and says the wait once it outlasts the token, with motion reduce',
            'draws three dots past the wait, which an off button lacks, its name and box kept',
            'centers its dots whatever the alignment, three across at every text size',
            'holds its dots out of sight for the wait',
            'pulses its dots no fainter than a floor that keeps them clear',
            'draws its dots still under reduced motion',
            "draws its dots in the system's gray in forced colors",
            'draws no dots on a busy button not yet drawn off, as on its accent fill',
            'keeps its dots clear of its words and its icon, every button its resting size',
            'in React › saves once for a double press, and says it is saving only while it is',
        ],
    },
    hooks: "Each hook letting go of an element swapped, through each engine's events.",
    form: {
        reason: 'Where focus is after a refusal and a reset, which Safari sets its own way.',
        except: [
            'says nothing on a reset with no refusal standing, and the form is cleared on one after the page refused',
        ],
    },
    fields: "A row of fields holding each engine's stepper and labels inside the length it wraps by.",
    flow: 'One step between pieces, over the margins each engine gives a list, a form and a dialog.',
    dated: 'A date or a time field, which Safari never counts as focused by the keyboard.',
    readonly: "A read-only value sized to its words, by each engine's field-sizing and line box.",
    seen: "Focus read through frames, by each engine's record of focus in a frame.",
    'frame-scrollbar': "A press on a frame's scrollbar, which takes no focus in Safari either.",
    'focus-grid': 'Every place focus can be against every piece that reads it, in each engine.',
};

/** What Firefox draws or does its own way, and what every engine does its own way. */
export const FIREFOX: Engine = {
    clock: "The still clock the specs share, which each engine's page runs.",
    history: 'The words a browser keeps from a form sent, which Firefox lists over the page.',
    busy: {
        reason: "A busy button's dots, a gradient each engine draws and places on its own.",
        tests: [
            'marks a busy button off and ignores a press by pointer, Enter, Space or a form',
            'shows and says the wait once it outlasts the token, with motion no-preference',
            'shows and says the wait once it outlasts the token, with motion reduce',
            'draws three dots past the wait, which an off button lacks, its name and box kept',
            'centers its dots whatever the alignment, three across at every text size',
            'holds its dots out of sight for the wait',
            'pulses its dots no fainter than a floor that keeps them clear',
            'draws its dots still under reduced motion',
            "draws its dots in the system's gray in forced colors",
            'draws no dots on a busy button not yet drawn off, as on its accent fill',
            'keeps its dots clear of its words and its icon, every button its resting size',
            'in React › saves once for a double press, and says it is saving only while it is',
        ],
    },
    stepper: 'A number field keeps its spin buttons unless `appearance: textfield` takes them.',
    'stepper-takedown': "Where focus goes as a stepper is taken down, which is each engine's own.",
    'stepper-say': 'A stepper attached again from a focusout handler, an event each engine fires.',
    'stepper-height': "A stepper's height beside a field's, by each engine's number field.",
    controls: 'Lengths Firefox rounds to a sixty-fourth of a pixel.',
    pieces: 'Lengths Firefox rounds to a sixty-fourth of a pixel.',
    table: {
        reason: "A frame's shade, drawn only where a browser ties an animation to a scroll.",
        tests: [
            'shades the edges a frame scrolls toward, and neither end once it is in view',
            "hides the start's shade under a pinned column, and shades the end beside it",
            "shades a frame on a ground of its own with no band of the page's ground",
            'shades the frame for a visitor who asks for less motion too',
            'shades no edge of a frame whose table fits, nor any in forced colors',
            'fits a five column table of a word and four short figures on a 320px phone, in a content page',
            "fits a five column table of a word and four short figures on a 320px phone, in an app's frame",
        ],
    },
    icon: "How an svg's stroke is drawn.",
    'buttongrid-columns':
        "A grid's columns, which rest on each engine's sums of a share and clamps.",
    progress: 'The native bar, which each engine draws its own way.',
    checked: {
        reason: 'Focus on the first field in error after a submit by Enter.',
        except: [
            'marks every field not in error so before anything is submitted',
            'names a field without the mark its label hides from a screen reader',
            "gives an error the page drew for a field the kit's words, and puts the page's back once it passes",
            "takes away the mark a stepper put back once its form's attach is taken down",
            'takes away the mark of a stepper taken down before its form, once both are down',
            'leaves the mark a later check of its form set on a stepper that outlived the first',
            'keeps the mark of a stepper taken down and attached again on the same value',
            "counts a page's own set of boxes of different names once",
            'gives fields with no id errors of their own',
            'lets a field marked off pass, since no one could put it right',
            "draws a field's error after its hint, and describes it after the hint",
            "lets the form's own attach take over the check from a part attached first",
        ],
    },
    shadow: 'Focus handed back inside a shadow root.',
    teardown: "A signal's abort and what follows it, the dialog's close event among them.",
    focus: "Where focus falls as a control leaves, which is each engine's own.",
    leaks: 'What a piece leaves running once taken down, counted in every engine.',
    toast: {
        reason: 'Focus handed back by where it came from, and by a key past a frame of another origin.',
        except: [
            'has no audit findings in the light theme, shown and not',
            'has no audit findings in the dark theme, shown and not',
            'returns the one function it showed with when attached again',
            'prints no toast, shown or not',
        ],
    },
    strict: {
        reason: "The hooks under StrictMode, whose second run meets each engine's focus and events.",
        except: [
            "keeps words said in a part's first effect on the provider's line through the second run",
        ],
    },
    hooks: "Each hook letting go of an element swapped, through each engine's events.",
    dialog: {
        reason: "Focus handed back to the dialog's opener, an SVG link too, by each engine's focus.",
        except: [
            'says what an answer leads to before the answers',
            'takes the options it is attached with again, and keeps them when attached again with none',
            'has no audit findings in the light theme, open',
            'has no audit findings in the dark theme, open',
        ],
    },
    panel: {
        reason: "Focus handed back as the panel closes, to an SVG link too, by each engine's focus.",
        except: [
            'refuses a button that names no panel, saying what it needs',
            'attaching and letting go › leaves a button attached again alone when what was returned before is detached',
        ],
    },
    form: {
        reason: "Where focus is after a refusal, and a field's error drawn again while it stands.",
        except: [
            'says nothing on a reset with no refusal standing, and the form is cleared on one after the page refused',
        ],
    },
    fields: "A row of fields holding each engine's stepper and labels inside the length it wraps by.",
    flow: 'One step between pieces, over the margins each engine gives a list, a form and a dialog.',
    hero: "A heading broken between words only, by each engine's line breaks.",
    split: "A long first word broken at a phone's width, by each engine's line breaks.",
    dock: "Two actions sharing a phone's row, by each engine's widths of the words.",
    dated: "A date or a time field's ring, drawn once where the field is focused two ways.",
    tabbar: {
        reason: 'What the keyboard reaches kept clear of the bar at a root size the page sets.',
        tests: [
            'scrolls what the keyboard reaches clear of the bar on a page 390px wide that doubles its root size',
            'scrolls what the keyboard reaches clear of the bar on a page 320px wide that doubles its root size',
            'scrolls what takes focus clear of the bar, so the bar never covers it',
            'scrolls what takes focus clear of a bar whose labels take two lines',
        ],
    },
    readonly: "A read-only value sized to its words, by each engine's field-sizing and line box.",
    seen: "Focus read through frames, by each engine's record of focus in a frame.",
    'focus-grid': 'Every place focus can be against every piece that reads it, in each engine.',
};

/**
 * The patterns that match the specs an engine names, one for each, since a brace of one name
 * matches nothing where a brace of several matches each.
 */
export const specsOf = (engine: Engine): string[] =>
    Object.keys(engine).map((name) => `*/e2e/${name}.spec.{ts,tsx}`);

const escaped = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The start of what Playwright filters a test by in a spec: its file, as the project lists it. */
const fileOf = (name: string): string =>
    `design-kit[\\\\/]e2e[\\\\/]${escaped(name)}\\.spec\\.tsx? `;

/** A test of a spec, by its title after its describes, which Playwright joins with spaces. */
const testOf = (name: string, title: string): RegExp =>
    new RegExp(`${fileOf(name)}${escaped(title.split(' › ').join(' '))}$`);

/**
 * What a project filters its tests by, from the engine's list: each spec that runs whole or but for
 * the tests it names, and each test named of a spec that runs those alone, and the tests a spec
 * leaves out. Playwright matches them against the project, the file and the title of each test.
 */
export const filtersOf = (
    engine: Engine
): { readonly grep: RegExp[]; readonly grepInvert: RegExp[] } => {
    const grep: RegExp[] = [];
    const grepInvert: RegExp[] = [];
    for (const [name, run] of Object.entries(engine)) {
        if (typeof run !== 'string' && 'tests' in run)
            grep.push(...run.tests.map((title) => testOf(name, title)));
        else grep.push(new RegExp(fileOf(name)));
        if (typeof run !== 'string' && 'except' in run)
            grepInvert.push(...run.except.map((title) => testOf(name, title)));
    }
    return { grep, grepInvert };
};
