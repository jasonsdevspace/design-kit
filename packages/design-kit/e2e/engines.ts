/*
 * The specs that run in WebKit and in Firefox as well as in Chromium, each named with the reason it
 * runs there, and with the tests the reason covers where it covers fewer than all. A spec whose
 * every test is about what the engine does its own way runs whole. One whose reason covers a few
 * names them and every test it leaves out, so a test added to it is sorted into one or the other,
 * and one whose reason covers all but a few, the kit's own words, marks, options and audits that no
 * engine draws or orders its own way, names those it leaves out, so a test added to it runs in the
 * engine until it is named. A spec left out runs in Chromium alone. The names, of specs and of
 * tests, are checked against the files by scripts/engines.test.ts, so a name typed wrong fails
 * there rather than matching nothing.
 */

/**
 * Why a spec runs in an engine: every test in it, the tests named and every other named as left
 * out, each test's title written after its describes and their ` › `, or every test but those
 * named.
 */
export type Run =
    | string
    | {
          readonly reason: string;
          readonly tests: readonly string[];
          /** Every other test of the spec, so a test added to it is sorted into one or the other. */
          readonly except: readonly string[];
      }
    | { readonly reason: string; readonly except: readonly string[] };

/** A spec's name, the file's without `.spec.ts` or `.spec.tsx`, and why it runs in the engine. */
export type Engine = Readonly<Record<string, Run>>;

/** The reason a spec runs in an engine, whichever of its tests run. */
export const reasonOf = (run: Run): string => (typeof run === 'string' ? run : run.reason);

/** What Safari draws or does its own way, and what every engine does its own way. */
export const WEBKIT: Engine = {
    clock: "The still clock the specs share, which each engine's page runs.",
    app: {
        reason: "A bar that stays put and a height that follows the browser's own bars, and a title's words measured in the Mac's system font.",
        tests: [
            'shows the bar, the body and the dock, and scrolls only the body',
            'clears what the phone keeps at each edge, by the safe area tokens',
            "scrolls the body's last line clear of everything below it, at a doubled text size",
            'carries a swipe that reaches the end of the body on to the page, and ends clear of the home indicator',
            'keeps what the body holds out of sight from lengthening the page',
            'is as tall as the screen at any height, by the dynamic height',
            'squeezes no row where the bar and the dock come to more than the screen, and scrolls the page',
            'takes the keyboard through the bar, then the body, then the dock',
            "scrolls the body by the keyboard once it has focus, with its ring inside the screen's edges",
            'lets the page scroll whole on a screen too short for a body between the bar and the dock',
            'pads past a side safe area only by what the column leaves uncleared, on a phone on its side',
            'keeps a frame with no dock and no tab bar clear of the home indicator',
            "sets a toast above the dock and clear of the body's last line, with a dock of one row and of two",
            'draws the skip link below the top safe area and past the side one',
            'gives a pictured frame drawn taller than what it holds the room in its body, its bars at its foot',
            'draws a pictured frame and a pictured page that ends in a tab bar at what they hold, their bars in place and clear of no safe area, 390 by 800',
            'draws a pictured frame and a pictured page that ends in a tab bar at what they hold, their bars in place and clear of no safe area, 1280 by 500',
            "keeps a floating toast's place to itself: over pinned cells, taking taps around the toast, and not on paper",
            'wraps a long title at a large text size, and cuts nothing off',
            'breaks a title of one long word inside the bar on a 320px phone at twice the text size',
        ],
        except: [
            "has one top heading, the bar's title",
            'is a column of 28rem in the middle of a wide screen, and the full width of a phone',
            "gives the title the bar's whole width under its action on a phone at twice the text size",
            "draws the skip link where the strip's links start on a page with a tab bar, 390 wide",
            "draws the skip link where the strip's links start on a page with a tab bar, 1440 wide",
            "draws the skip link where the strip's links start on a page with an app's frame, 1440 wide",
            'prints as long and as wide as what it holds, with the body whole',
            'has no audit findings in the light theme',
            'has no audit findings in the dark theme',
            'holds every control in an app to the target on a wide screen, and leaves the rest of a page as it was',
            "leaves a demo's strip as it is on a page that ends in a tab bar",
            "draws the toast's close button at the target both ways on a wide screen, in a frame or not",
            "draws a raised panel on the raised ground, lifted by the resting shadow or the page's own, in the light theme",
            "draws a raised panel on the raised ground, lifted by the resting shadow or the page's own, in the dark theme",
            "pads a panel alike at every width in an app's frame, and by the page's width outside one",
            "pads the frame's bar, body, toast and dock by a phone's step on a 320px phone at twice the text size",
            "pads the frame's sides by a phone's step at the default text size",
            "starts the skip link where the frame's words start, on a 320px phone at twice the text size",
            "keeps a panel in an app's frame to a phone's padding at twice the text size",
            'keeps a pinned column and a code block apart from a raised panel on grounds of their own',
            'gives a piece the ground of the nearest container that holds it, however they nest',
            "draws a panel's title as a heading as it draws it as a paragraph, so either reads alike",
            'draws a content page the same with a picture of an app and its toast as without one',
            "draws a page with an app's frame of its own as an app's, a picture of another beside it or not",
            "draws a dialog as an app's where it sits inside a frame or beside one, and as a content page's set apart from it",
            "keeps the bar's rule in sight over a toast at twice the text size on a narrow phone",
            'scrolls the page whole on a phone too short at a doubled text size for a body between the bar and the dock',
        ],
    },
    tabbar: {
        reason: "A bar stuck to the bottom of the screen, clear of the home indicator, and its labels measured in the Mac's system font.",
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
            'scrolls with the page on a screen too short to give it a row of its own',
            "draws a link's focus ring inside the bar, where the screen's edge would cut it",
            "shares a phone's narrowest width evenly, from two links to five",
            'wraps a long label at a doubled text size, and grows to hold it',
        ],
        except: [
            'tells the current link apart by its weight and a line, forced colors included',
            'draws one line in forced colors, over the current link, in a system color',
            'draws every link at the larger target or taller, with its icon over its label',
            "is the app's column in the middle of a wide screen, with the page held to it",
            'does not print, and leaves a page as long and as wide as what it holds',
            'has no audit findings in the light theme',
            'has no audit findings in the dark theme',
            'scrolls with the page on a phone at twice the text size, where its labels wrap further',
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
        reason: "A dialog's Close closing it with no script, in the native dialog, its ring on focus, and its place measured in the Mac's system font.",
        tests: [
            "opens a dialog on its first answer, meets the Close after the title's question, and closes by it with no script",
            "names a panel's Close for what it closes, and draws a closed dialog with a Close not at all",
            'sets a quiet Close in the top corner of a dialog and a panel, at the target and clear of the title, 320 wide at 1 times the text',
            'sets a quiet Close in the top corner of a dialog and a panel, at the target and clear of the title, 1280 wide at 1 times the text',
            'keeps the Close drawn in forced colors, its × in the text and its ring on focus',
        ],
        except: [
            'sets a quiet Close in the top corner of a dialog and a panel, at the target and clear of the title, 320 wide at 2 times the text',
            'sets a quiet Close in the top corner of a dialog and a panel, at the target and clear of the title, 1280 wide at 2 times the text',
            "pads a dialog on a page with an app by a phone's step at every width, its Close on its title's line",
            'has no audit findings with a Close in the corner, in the light theme',
            'has no audit findings with a Close in the corner, in the dark theme',
        ],
    },
    stepper: "A number field's inner room, and a press by pointer that gives no focus.",
    'stepper-takedown': "Where focus goes as a stepper is taken down, which is each engine's own.",
    'stepper-say': 'A stepper attached again from a focusout handler, an event each engine fires.',
    'stepper-height': "A stepper's height beside a field's, by each engine's number field.",
    table: "What a table's frame scrolls to as the keyboard reaches a link, its shade where a browser ties an animation to a scroll, and a narrow table's fit in the Mac's system font.",
    icon: "How an svg's stroke is drawn.",
    rows: {
        reason: "How a phone's list of rows is pressed and reached by the keyboard, the rings that shows, and words measured in the Mac's system font.",
        tests: [
            'makes a link row one stop named by its words, title first, with its ring around the whole row',
            "makes a button at a row's end its own stop, named for what it does and to which row",
            'keeps a row with a button as tall as one without, the button in the middle and every ring off the words',
            "reaches a row's group of buttons in order by the keyboard at 1x the text size, each named for its seat",
            "underlines a tile's title under a pointer, and rings it outside, as a separate control",
            "underlines a tile's title under a pressing thumb, on a phone where nothing hovers",
            "keeps a tile's whole ring in view as the keyboard scrolls an app's body to it",
            'flows tiles into columns on a wide page, one column on a phone, in reading order for the keyboard',
            "keeps a row's group of buttons beside twelve characters of text on a 390px phone at the default size",
            "holds a tile's words at 4.5 to 1 and its sign and ring at 3 to 1, on the page's grounds in the light theme",
            "holds a tile's words at 4.5 to 1 and its sign and ring at 3 to 1, on the surface in the light theme",
            "holds a tile's words at 4.5 to 1 and its sign and ring at 3 to 1, on the page's grounds in the dark theme",
            "holds a tile's words at 4.5 to 1 and its sign and ring at 3 to 1, on the surface in the dark theme",
            'starts every title on one line beside a picture, in a row and a tile, with the ring clear of it',
        ],
        except: [
            'draws a rule between rows and none after the last, in both themes and forced colors',
            'draws each row at the target, and the larger target in a tall list',
            'wraps a long title, and keeps the end beside its first line',
            'lines a row of one line up in the middle of its height, and its figures in one width',
            'says how many rows a list holds, and draws an empty list not at all',
            "moves a row's group of buttons under its text on a 320px phone at twice the text size, the title on one line",
            "moves a row's group of buttons under its text on a 390px phone at twice the text size, the title on one line",
            "keeps a row's group inside the narrowest phone at twice the text size and the wider spacing",
            "keeps a row's picture beside its title with a group at twice the text size",
            'has no audit findings for a list of seats in the light theme',
            'has no audit findings for a list of seats in the dark theme',
            'has no audit findings in the light theme',
            'has no audit findings in the dark theme',
            "starts a row's words on the column's line in what pads, and keeps it inside a bare page",
            'draws a row of one line at the target tall, no taller',
            "keeps a row's end inside the row on a 320px phone at twice the text size",
            'draws each tile on the ground its page sets, with an edge and a gap in place of the rule',
            'draws a tile on the surface with no ground set and no shadow, unless the page sets its own',
            "draws no tile's shadow in forced colors, a page's own included",
            "keeps a tile's edge in forced colors, in the system's link color",
            'draws an empty list of tiles not at all',
            'keeps a tile at the larger target, its detail wrapping inside it at twice the text size',
            "wraps a tile's long detail pretty, so its last line holds more than one word",
            'has no audit findings for a list of tiles in the light theme',
            'has no audit findings for a list of tiles in the dark theme',
            "starts a tile's words on the line a raised panel's start on above it, on a wide page",
            "starts a tile's words on the line a raised panel's start on above it, on a phone",
            "starts a tile's words on the line a raised panel's start on above it, on an app's frame",
            "sets a tile's title in an explainer at the body size, as a panel's title there",
            'starts each title, and each picture, on one line across tiles in columns, a short tile beside a tall one',
            'keeps tiles in one column on the narrowest phone at twice the text size and the wider spacing, a word cut off nowhere',
            "keeps every word of a tile whole in a plain and a raised panel on the narrowest phone at twice the text size, a panel and a tile holding the card's inset",
            "steps a tile's ground off a plain panel to the page's, and off a raised one to the card's, in the light theme",
            "steps a tile's ground off a plain panel to the page's, and off a raised one to the card's, in the dark theme",
            "reaches a row's group of buttons in order by the keyboard at 2x the text size, each named for its seat",
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
        except: [
            'keeps both controls hidden where no script attaches them',
            'says what sits where the switch would be, only to a visitor without script',
            'shows the saved choice, then saves and draws a new one, with nothing the policy refuses',
            'saves once a choice made on a switch attached twice',
            'shows one choice on every switch, one attached through the element that holds it',
            'hides a switch again once it is taken away',
            'shows the choice saved meanwhile on a switch attached again after every switch was taken away',
            'draws a choice the page holds on a switch attached again after every switch was taken away',
            'attaches one element as a copy button though it was attached as a switch first',
            'copies from the new source and speaks on the new line when attached again with them, its word back to Copy',
            'puts a copy button back to Copy, hidden, when it is taken away mid-message',
            'reads the switch by its name, and describes it by its note',
            'ignores a theme that is no choice, as plain JavaScript can pass',
            'leaves a theme switch with no choices hidden and unattached, to be attached once they are drawn',
            'keeps a choice the browser will not save drawn over one another tab saves',
            "says a screen's messages on its own status line, the same words twice, with no element added",
        ],
    },
    pieces: {
        reason: "How a pressing thumb and a pointer change the pieces, the focus rings Safari draws, and words measured in the Mac's system font. The theme switch collapsed in a strip runs in WebKit under attach.",
        tests: [
            "keeps the row of three choices in a demo's strip at 20rem and wider, and outside the strip at any width",
            "rings focus and edges a pointer's button in the focus color a page sets",
            "draws the switch's own ring, on the chosen word, in the focus color",
            "changes a resting pill, a resting tab and the site's brand under a pressing thumb, where nothing hovers",
            'rings in the accent a part of the page sets, where the page sets no focus color',
            'wraps its choices in a narrow column at a large text size, rather than scroll them away',
            'keeps its name and choices on one row at the usual text size, phone to wide',
            'cuts no word off the pill, the copy button or the switch under the wider spacing a visitor may set',
            'keeps the copy button as wide as its longest word, whichever word shows',
        ],
        except: [
            'marks the chosen theme by an edge in the accent, not by its ground alone',
            'keeps every word in place as the choice moves',
            'makes each choice the field height tall, and a thumb wide and tall on a phone',
            'draws a chip that never reads as a control, and marks the current page by weight',
            "marks the chosen tab by the page's text over an accent line, and by the system's selection in forced colors, the others on the rule's line",
            'draws a tab, a link among pages and a toggle alike, chosen or not',
            'keeps every tab in place as the choice moves',
            "keeps the chosen link's line on the rule when a neighbor's words wrap",
            'stands every tab on a line when the row wraps, in both themes and forced colors',
            "lays a tab row on its container's rule, the chosen line over it, and a plain row as it was",
            "makes each tab the strip's height, and a thumb wide and tall on a phone",
            'draws an eyebrow in caps at the caption size in the muted text, tracked, with no margin of its own',
            'has no audit findings in the light theme',
            'has no audit findings in the dark theme',
            "draws every chosen thing's words in forced colors, on the system's selection",
            "rings every chosen thing in the system's text in forced colors, the theme word too",
            "collapses to its name and one button naming the choice in a demo's strip narrower than 20rem",
            'underlines a pill and a tab under a press in forced colors, where their color is replaced',
        ],
    },
    'buttongrid-columns':
        "A grid's columns, which rest on each engine's sums of a share and clamps.",
    roving: 'The stop placed on a cell a press lands on, where Safari gives the press no focus.',
    dock: "Two actions sharing a phone's row, by each engine's widths of the words.",
    'try-again': {
        reason: "Focus moved to a heading as a load starts again, by each engine's own focus, and its words measured in the Mac's system font.",
        tests: [
            'fills the callout at the first failure and moves no focus',
            'reads the failure and never the button in the alert',
            'reads the same failure twice with focus left on what is loading again',
            'puts a failure that comes back at once in a moment after the callout empties',
            'draws the list and marks the callout empty again when Try again works',
            'mounts the callout empty and out of sight beside the loading line',
            'stays whole under wider text spacing',
        ],
        except: [
            'stays whole on a 320px phone at twice the text size',
            'has no audit findings in the light theme',
            'has no audit findings in the dark theme',
            'has no audit findings in forced colors',
        ],
    },
    stack: {
        reason: "The list role Safari drops with a list's markers, and words measured in the Mac's system font.",
        tests: [
            'draws a stack on a list with no marker, indent or room of its own',
            "writes the list's role in the example, which Safari drops with the markers",
            'stays whole on a 320px phone at twice the text size, a wrapped pair at its step',
            'keeps its steps between the pieces under wider text spacing',
        ],
        except: [
            "spaces a pair, a heading's stack and its list at their steps",
            'spaces a plain stack at the step of what holds it, and a stack in a pair at the pair step',
            'keeps a named step under a title and under a page section heading',
            'gives a step class alone nothing, and a stack outside any container only its named step',
            'adds no step for a hidden piece in a plain stack',
            'adds no step for a hidden piece in a dk-stack-pair stack',
            'adds no step for a hidden piece in a dk-stack-heading stack',
            'has no audit findings in the light theme',
            'has no audit findings in the dark theme',
            'has no audit findings in forced colors',
            'holds a field and a callout in its form to the measure in a wide stack, a page or a band, and a field a page, a dialog or a popover widens to its column',
            'ends a callout beside a field with no form where the fields end, and runs one with no field beside it the column',
            'ends a callout beside a field with no form where the fields end, and runs one with no field beside it the column, without :has()',
        ],
    },
    split: "A long first word broken at a phone's width, by each engine's line breaks.",
    empty: {
        reason: "Focus back on the search field as the list comes back, and words measured in the Mac's system font.",
        tests: [
            'the saved games › waits for typing to stop, then says the search matches nothing and names it',
            'the saved games › brings the list back with focus on the search when Clear is pressed by Enter',
            'the saved games › brings the list back with focus on the search when Clear is pressed by a pointer',
            'the saved games › brings the list back when the search is emptied in the field itself',
            'stays whole on a 320px phone at twice the text size',
            'stays whole under wider text spacing',
        ],
        except: [
            'draws no ground and no edge, its words where a row title starts in a page',
            'starts its words where a row title does at a bare edge too',
            'is not live, so it is read where it is',
            'draws its words muted at the body size and a plain button under them',
            'has no audit findings in the light theme',
            'has no audit findings in the dark theme',
            'has no audit findings in forced colors',
            'the saved games › says how many games match a search that finds some',
            'the saved games › has no audit findings with the empty state drawn',
        ],
    },
    hero: "A heading broken between words only, by each engine's line breaks.",
    progress: 'The native bar, which each engine draws its own way.',
    checkbox: {
        reason: "A lone box's name and description in each engine's tree, a refused submit that focuses it, and its label's target and reflow in each engine's layout.",
        except: [
            'draws an invalid box with a dashed line and one that is off in the system color for it, in forced colors',
        ],
    },
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
        except: [
            'holds its look and says nothing for a fast save',
            'drops its words where the work ends after the wait but before they are said',
            'says its words again for a busy that ends and starts again at once',
            'holds its look for the wait in forced colors too',
            'in React › says nothing late for a save that ends just after the wait',
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
        except: [
            'holds its look and says nothing for a fast save',
            'drops its words where the work ends after the wait but before they are said',
            'says its words again for a busy that ends and starts again at once',
            'holds its look for the wait in forced colors too',
            'in React › says nothing late for a save that ends just after the wait',
        ],
    },
    stepper: 'A number field keeps its spin buttons unless `appearance: textfield` takes them.',
    'stepper-takedown': "Where focus goes as a stepper is taken down, which is each engine's own.",
    'stepper-say': 'A stepper attached again from a focusout handler, an event each engine fires.',
    'stepper-height': "A stepper's height beside a field's, by each engine's number field.",
    controls: 'Lengths Firefox rounds to a sixty-fourth of a pixel.',
    pieces: 'Lengths Firefox rounds to a sixty-fourth of a pixel.',
    table: "A frame's shade, drawn only where a browser ties an animation to a scroll, what the frame scrolls to as the keyboard reaches a link, and a narrow table's fit.",
    icon: "How an svg's stroke is drawn.",
    'buttongrid-columns':
        "A grid's columns, which rest on each engine's sums of a share and clamps.",
    progress: 'The native bar, which each engine draws its own way.',
    checkbox: {
        reason: "A lone box's name and description in each engine's tree, a refused submit that focuses it, and its label's target and reflow in each engine's layout.",
        except: [
            'draws an invalid box with a dashed line and one that is off in the system color for it, in forced colors',
        ],
    },
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
            "is the last row of an app's frame, clear of the home indicator once, and the keyboard's last stops",
            "draws a link's focus ring inside the bar, where the screen's edge would cut it",
        ],
        except: [
            'stays at the bottom of the screen while the page scrolls, and on a page shorter than the screen',
            'clears the home indicator, by the bottom safe area token',
            "scrolls the page's last line clear of the bar",
            'tells the current link apart by its weight and a line, forced colors included',
            'draws one line in forced colors, over the current link, in a system color',
            'takes no placing of its own in a wrapper, so a frame clears the home indicator once',
            "shares a phone's narrowest width evenly, from two links to five",
            'wraps a long label at a doubled text size, and grows to hold it',
            'draws every link at the larger target or taller, with its icon over its label',
            "is the app's column in the middle of a wide screen, with the page held to it",
            'scrolls with the page on a phone at twice the text size, where its labels wrap further',
            'scrolls with the page on a screen too short to give it a row of its own',
            'stays as tall as the screen on a page with padding of its own',
            'does not print, and leaves a page as long and as wide as what it holds',
            'has no audit findings in the light theme',
            'has no audit findings in the dark theme',
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

/**
 * A test of a spec, by its title after its describes, which Playwright joins with spaces, and any
 * tags it ends in.
 */
const testOf = (name: string, title: string): RegExp =>
    new RegExp(`${fileOf(name)}${escaped(title.split(' › ').join(' '))}(?: @\\S+)*$`);

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
        if (typeof run !== 'string' && !('tests' in run))
            grepInvert.push(...run.except.map((title) => testOf(name, title)));
    }
    return { grep, grepInvert };
};
