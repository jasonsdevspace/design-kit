/** Tests of the kit that hold one group the site shows, all from one file. */
export interface Held {
    /** The file, from the package's folder. */
    readonly file: string;
    /** Each test's full name as the runner reports it, its groups' titles before its own. */
    readonly titles: readonly string[];
}

const BOTH_THEMES = (title: (theme: string) => string) => [title('light'), title('dark')];

/** The audits a newer piece's own spec runs, in each theme and in forced colors. */
const EVERY_AUDIT = [
    ...BOTH_THEMES((theme) => `has no audit findings in the ${theme} theme`),
    'has no audit findings in forced colors',
];

/** The tests that hold every state on the controls page alike. */
const EVERY_CONTROL = [
    'fits a phone 320px wide without scrolling the page sideways',
    'in forced colors keeps every state in sight where the page loses its own colors',
    ...BOTH_THEMES(
        (theme) => `has no audit findings for any state in the ${theme} theme, wide and on a phone`
    ),
];

/** The tests that hold the skip link, the strip and the footer alike. */
const EVERY_CHROME = [
    ...BOTH_THEMES(
        (theme) => `has no audit findings in the ${theme} theme, on a wide screen and a phone`
    ),
    "draws the chrome under a policy that allows styles only from the page's own origin",
];

/** The tests that hold the strip and the footer alike. */
const STRIP_AND_FOOTER = {
    unit: [
        'the chrome opens no link in a new tab',
        'an empty slot is nothing in the strip and the footer, as it is in a field and a callout',
    ],
    browser: [
        'draws the link to the current page apart from the others in the strip and the footer',
        ...EVERY_CHROME,
    ],
    explainer: [
        'marks the link to how it works as the current page in the strip and the footer alike',
    ],
};

/** The tests that hold every piece on an explainer alike. */
const EVERY_PIECE = [
    'never scrolls the page sideways, at any width or text size, but the frames scroll',
    'clips no text when a visitor spaces it out further',
    ...BOTH_THEMES((theme) => `has no audit findings in the ${theme} theme, wide and on a phone`),
];

/** The tests that hold every piece the pieces spec draws alike. */
const PIECES_SPACED_AND_AUDITED = [
    'cuts no word off the pill, the copy button or the switch under the wider spacing a visitor may set',
    ...BOTH_THEMES((theme) => `has no audit findings in the ${theme} theme`),
];

/** The tests that hold a frame, a table's and a code block's alike. */
const EVERY_FRAME = [
    'sets a frame a short step under its title, a table and a code block alike',
    'sets a title a short step over its frame on any page, not only an explainer',
    'names each frame by its title, and lets the keyboard reach and scroll it',
];

/**
 * The tests that hold each group the site shows, by the group's heading, under the file each is in.
 * A test that holds a whole page, such as its audit, is listed under each group it holds. The test
 * beside this module fails on any name its file's runner does not report.
 */
export const HELD = {
    Buttons: [
        {
            file: 'src/react.test.tsx',
            titles: [
                'the button is a plain button unless a page says otherwise, never a form submit by default',
                'the button marks the one action a view leads with by a class, and keeps a page class after it',
                'the button says a toggle is a toggle whether it is pressed or not, and leaves an action alone',
                'the button stays in the tab order when off, rather than dropping focus as disabled does',
                "the button calls nothing when pressed while off, and stops a form's submit",
                'the button hands a ref to the button it draws, for a page that moves focus to it',
                'the button takes neither a style nor accent and pressed together',
                'the button draws a large button and a text button by a class each',
                'the button draws a tall button by its class, with the large button or without',
                'the button draws a button whose face is an icon alone by its class, a toggle among them',
            ],
        },
        {
            file: 'e2e/icon.spec.ts',
            titles: [
                "grows an icon-only button's icon with the text, to twice its size at twice the text size",
            ],
        },
        {
            file: 'e2e/controls.spec.tsx',
            titles: [
                'sets a button and a field level and their text at one inset, at the field height wide and the target on a phone',
                'keeps an off button in the tab order, and skips a disabled one, drawn alike',
                'draws a button in a disabled fieldset as off, and keeps the keyboard off it',
                'turns the edge to the focus color under a pointer, and underlines the accent instead',
                "tells a pressed toggle by its edge as well as its color, and keeps the toggle's name",
                'draws an open accent button in the page text on the highlight, so its words stay read',
                'keeps a pressed toggle that is off told apart from one that is not pressed',
                'draws the focus ring after the keyboard, on the accent and in every callout',
                'draws a large button at the target at every width, with wider inline padding and the body text',
                "draws a text button as a link, at the button's height, with its states",
                'draws a tall button at the larger target at every width, alone and with the large button',
                'draws a shadow under a button and moves it when pressed, where a page sets the two, and neither where it does not',
                "leaves a toggle's edge as it was after a tap on a touch screen, where no pointer rests",
                ...EVERY_CONTROL,
            ],
        },
        {
            file: 'e2e/ref.spec.ts',
            titles: [
                'moves focus back to the button a ref holds when its panel closes',
                'swallows Enter, Space and a click on an off button alike, and keeps focus on it',
            ],
        },
        {
            file: 'e2e/busy.spec.tsx',
            titles: [
                'marks a busy button off and ignores a press by pointer, Enter, Space or a form',
                'holds its look and says nothing for a fast save',
                'drops its words where the work ends after the wait but before they are said',
                ...['no-preference', 'reduce'].map(
                    (motion) =>
                        `shows and says the wait once it outlasts the token, with motion ${motion}`
                ),
                'says its words again for a busy that ends and starts again at once',
                'holds its look for the wait in forced colors too',
                'in React saves once for a double press, and says it is saving only while it is',
                'in React says nothing late for a save that ends just after the wait',
            ],
        },
    ],
    Fields: [
        {
            file: 'src/react.test.tsx',
            titles: [
                'the field takes a ref typed as the control it draws, and refuses one of another element',
                'the field ties a label to the control, and draws nothing it was not given',
                'the field describes the control by its hint, then its error, and marks it invalid only with one',
                "the field keeps a page's own description after the field's, and draws an empty slot as none",
                'the field announces nothing itself, since the page says when an error appears',
                'the field gives each field on a page an id of its own when the page gives none',
                'the field makes an id of its own when the page gives an empty one',
                "the field passes the control's own attributes through",
                'the field draws a native select with its options, wired the same way',
                'the field draws a textarea with its text as a value, wired the same way',
                'the field draws an action beside the control in the field action row, after the control',
                'the field draws a field with no action as it did, and wires its hint and error with one',
                'the choice field draws a fieldset with its label as the legend, and a label of a radio and its word for each choice',
                'the choice field describes the set by its hint, then its error, and marks a radio group invalid only with one',
                'the choice field draws checkboxes in a row where the field asks, with a gloss after a word, each marked by an error',
            ],
        },
        {
            file: 'e2e/controls.spec.tsx',
            titles: [
                'sets a button and a field level and their text at one inset, at the field height wide and the target on a phone',
                'draws text in a field at 16px or more on a phone, so tapping it does not zoom',
                'draws a list that shows its options as the browser does, with no caret',
                'draws the focus ring after the keyboard, on the accent and in every callout',
                'reads a field by its label, and describes it by its hint and then its error',
                'draws an invalid control in the danger color, and the error beside the hint',
                'draws a textarea as a field, three rows tall, that resizes in height alone',
                "draws a choice at the field height, a thumb's target on a phone, lit under a pointer, and a row on one line",
                'moves and checks among radios with the arrow keys, ringing the control and lighting its word',
                'reads a set by its legend, describes it by its hint or error, and marks an invalid set',
                'cuts no text off a callout or a field under the wider spacing a visitor may set',
                ...EVERY_CONTROL,
                'marks an invalid field with a dashed line in forced colors, where its red is gone',
            ],
        },
        {
            file: 'e2e/ref.spec.ts',
            titles: ["moves focus to the control each field's ref holds"],
        },
        {
            file: 'e2e/layouts.spec.ts',
            titles: [
                "reaches the React field's button after its control, and names it by its own words",
                "stands a field's control and its button at one height at every width and text size",
                "wraps a long label on a field's button and a dialog's action rather than run past the page",
            ],
        },
        {
            file: 'e2e/marks.spec.tsx',
            titles: [
                'names a required field without its words, which its aria-required says, and an optional one with them',
                ...BOTH_THEMES(
                    (theme) =>
                        `draws the mark muted at the normal weight, with no audit findings, in the ${theme} theme`
                ),
                'shows the mark in forced colors, and keeps it whole at 320px with twice the text size and under wider spacing',
            ],
        },
        {
            file: 'e2e/readonly.spec.tsx',
            titles: [
                ...BOTH_THEMES(
                    (theme) =>
                        `draws a read-only field as a value, apart from one that can change or is off, in the ${theme} theme`
                ),
                'keeps the error edge on a read-only field with an error, and draws a disabled one disabled',
                'draws a read-only edge in the ground color in forced colors',
                "draws a read-only select as a field with its option's words, and sends its value",
                'draws a read-only stepper with its value alone, which a keyboard still reaches',
                'keeps every field whole at 320px with twice the text size and under wider spacing',
            ],
        },
    ],
    Callouts: [
        {
            file: 'src/react.test.tsx',
            titles: [
                'the callout draws the info tone by default, with no role, so nothing reads it out of turn',
                'the callout says its tone in words a screen reader reads, as well as in color',
                'the callout takes a role only when the page asks for one, whatever its tone',
                'the callout draws a live message empty, so the page can fill it once it is on the page',
                'the callout puts its title before the message, as a heading at the level the page gives',
                'the callout reads its title and its tone word with a live message, since both are in it',
                'the callout keeps its actions outside the message, so a live message reads only its words',
                'the callout takes an id and a class of the page, after its own, as a button and a field do',
                'the callout hands a ref to the callout it draws, for a page that moves focus to it',
                'the callout takes no props of its own that would break it, and drops a role or style plain JavaScript passes',
                'the callout draws news for a tone plain JavaScript can pass that the kit has no rule for',
                'the callout draws a paragraph for a heading level plain JavaScript can pass that names no heading',
            ],
        },
        {
            file: 'e2e/controls.spec.tsx',
            titles: [
                'draws the focus ring after the keyboard, on the accent and in every callout',
                "draws nothing for an empty live callout, and the callout's look once it is filled",
                ...EVERY_CONTROL,
                'pads a callout as the other boxed text at its size is padded',
            ],
        },
        {
            file: 'e2e/try-again.spec.tsx',
            titles: [
                'mounts the callout empty and out of sight beside the loading line',
                'fills the callout at the first failure and moves no focus',
                'reads the failure and never the button in the alert',
                'reads the same failure twice with focus left on what is loading again',
                'puts a failure that comes back at once in a moment after the callout empties',
                'draws the list and marks the callout empty again when Try again works',
                'stays whole on a 320px phone at twice the text size',
                'stays whole under wider text spacing',
                ...EVERY_AUDIT,
            ],
        },
    ],
    'Loading and progress': [
        {
            file: 'e2e/loading.spec.tsx',
            titles: [
                ...['no-preference', 'reduce'].map(
                    (motion) =>
                        `keeps the loading line out of sight for the wait, then shows it, with motion ${motion}`
                ),
                'keeps the wait in forced colors',
                ...BOTH_THEMES(
                    (theme) =>
                        `draws the line in the muted text, with no audit findings, in the ${theme} theme`
                ),
                'keeps its words whole under wider spacing and at 320px with twice the text size',
            ],
        },
        {
            file: 'e2e/progress.spec.tsx',
            titles: [
                'draws a short track in the line color on pill corners, filled in the accent',
                'draws an empty track with no fill for a bar with no value',
                'fills in the highlight on an edged canvas track in forced colors',
                'reads the label, the amount and the words',
                'says each quarter once, and the end once',
                'waits three seconds between steps, and never before the end',
                'says the end of a run that never pauses, and nothing after it',
                'says a jump across several quarters once',
                "gives way to a page's own words said just before it",
                'says the done words in place of the end',
                'says a run that starts again, and not the amount a bar first shows once known',
                'counts its steps again when the page sets new ones, and says nothing once taken away',
                'names a bar by its own label, and says hundredths where it has no words',
                'in React says each quarter and the done words through useProgress',
                'stays whole on a 320px phone at twice the text size',
                'stays whole under wider text spacing',
                ...EVERY_AUDIT,
            ],
        },
    ],
    Stepper: [
        {
            file: 'e2e/stepper.spec.tsx',
            titles: [
                'shows the buttons only once attached, each named for what it does and to which field',
                'steps once a press, firing the events a typed value fires, and stops at the limits with focus kept',
                'says the value a press sets on its status line, since focus stays on the button',
                'leaves a disabled field as it is, with both buttons off',
                'follows a value a form reset sets, and fires nothing for a press that changes nothing',
                'reports a typed value outside the limits, or none where one is required, as a field reports an error, says it, and clears it once right',
                'clears its error as a script makes the field optional or changes its step, with no input event',
                'reports letters typed into a blank field as focus leaves it, though no change fires',
                "keeps a page's own hint and error in place through its own error",
                'asks a phone for a keyboard with a minus only where the least value is below nothing',
                'keeps its width as the value changes, with figures of one width',
                "sits on one line with its label beside it at a phone's narrowest width",
                "draws its buttons the target wide, at the field's height on a wide page and the target's on a phone, and at the larger target when tall",
                'takes the keyboard through lower, the value and raise, pressing by Space and Enter',
                'has no audit findings in the light theme',
                'has no audit findings in the dark theme',
            ],
        },
        {
            file: 'e2e/stepper-height.spec.tsx',
            titles: [
                "draws a stepper the field's height beside a text field on a wide page, their labels and controls level",
                "draws a stepper the target tall and level with a text field on an app's frame at 1280",
                'keeps a tall stepper at the larger target at every width, its buttons as wide',
            ],
        },
    ],
    Dialog: [
        {
            file: 'e2e/dialog.spec.ts',
            titles: [
                'opens over the scrim on the raised ground, named by its heading, with focus inside',
                'returns focus to what opened it, however it closes',
                'stays open on a tap inside it and on a drag that ends outside it',
                'stays open on Escape pressed twice and on the scrim when it asks to stay',
                'says what an answer leads to before the answers',
                'finds the button a press landed on from a listener on the page or an event from React',
                'sends focus where it is told when what opened the dialog has gone',
                'takes the options it is attached with again, and keeps them when attached again with none',
                'opens a long sheet at its top, with focus on its title',
                'keeps the page behind it still while it is open',
                'draws the sheet at the bottom edge, clear of the home indicator, scrolling inside itself',
                'rises the sheet into place, and opens it in place for less motion',
                'has no audit findings in the light theme, open',
                'has no audit findings in the dark theme, open',
            ],
        },
    ],
    Toast: [
        {
            file: 'e2e/toast.spec.tsx',
            titles: [
                'draws nothing before a message, with or without script',
                'draws a message and says it politely, without moving focus or adding an element',
                'reaches the action by the keyboard, and choosing it runs it and dismisses the toast',
                'dismisses by its named close button, and by Escape, with focus back where it was',
                'keeps a toast with an action until dismissed, and lets one without leave after its time',
                'holds the wait while the toast is hovered or has focus, and starts it again after',
                'replaces one message with the next, and says the same words again',
                'dismisses only its own message, by what showing it returned',
                'holds a toast that appears under a pointer resting where the last one was',
                'rises into place each time it is shown',
                'moves focus off an action the next message does not have',
                'wraps a message of three lines inside the toast, with its action still in reach',
                "sits in an app's frame above the dock, its action one step back from the dock's button",
                'sits at the foot of a page clear of the home indicator, in the app column',
                'keeps what the keyboard reaches, and the end of the page, clear of the toast on a page 390px wide',
                'keeps what the keyboard reaches, and the end of the page, clear of the toast on a page 320px wide',
                'has no audit findings in the light theme, shown and not',
                'has no audit findings in the dark theme, shown and not',
            ],
        },
    ],
    'App frame': [
        {
            file: 'e2e/app.spec.ts',
            titles: [
                'shows the bar, the body and the dock, and scrolls only the body',
                'clears what the phone keeps at each edge, by the safe area tokens',
                "has one top heading, the bar's title",
                "scrolls the body's last line clear of everything below it, at a doubled text size",
                "sets a toast above the dock and clear of the body's last line, with a dock of one row and of two",
                'is as tall as the screen at any height, by the dynamic height',
                'is a column of 28rem in the middle of a wide screen, and the full width of a phone',
                'wraps a long title at a large text size, and cuts nothing off',
                'squeezes no row where the bar and the dock come to more than the screen, and scrolls the page',
                'takes the keyboard through the bar, then the body, then the dock',
                "scrolls the body by the keyboard once it has focus, with its ring inside the screen's edges",
                'lets the page scroll whole on a screen too short for a body between the bar and the dock',
                'pads past a side safe area only by what the column leaves uncleared, on a phone on its side',
                'draws the skip link below the top safe area and past the side one',
                'prints as long and as wide as what it holds, with the body whole',
                'has no audit findings in the light theme',
                'has no audit findings in the dark theme',
            ],
        },
        {
            file: 'e2e/dock.spec.ts',
            titles: [
                ...[1, 2].map(
                    (scale) =>
                        `holds Scores and a main action on one row on a 320px phone at ${String(scale)}x the text size`
                ),
                'takes two rows, rather than a page scrolled sideways or a word cut, where the two cannot share one',
                "draws the reference's pair with the main action last in the keyboard order",
                'keeps every word whole under wider spacing',
                ...EVERY_AUDIT,
            ],
        },
    ],
    'Tab bar': [
        {
            file: 'e2e/tabbar.spec.ts',
            titles: [
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
                'scrolls what takes focus clear of the bar, so the bar never covers it',
                'scrolls with the page on a screen too short to give it a row of its own',
                'stays as tall as the screen on a page with padding of its own',
                "is the last row of an app's frame, clear of the home indicator once, and the keyboard's last stops",
                "draws a link's focus ring inside the bar, where the screen's edge would cut it",
                'does not print, and leaves a page as long and as wide as what it holds',
                'has no audit findings in the light theme',
                'has no audit findings in the dark theme',
            ],
        },
    ],
    'Button grid': [
        {
            file: 'e2e/buttongrid.spec.ts',
            titles: [
                'draws the columns asked for where they fit, and fewer where a cell would be under the target',
                'names the group, says whether each toggle is on, and names each plain key for what it enters',
                'tells a toggle that is on by how light it is and its weight, in forced colors too',
                'draws a cell that is off with a dashed edge, at full contrast, and lets nothing press it',
                "reads the button's shadow and press, and draws neither without them",
                'reaches each cell by Tab, past one that is off, and presses it by Space and by Enter',
                'draws a tall button at the larger target in a grid that is not tall',
                'has no audit findings in the light theme',
                'has no audit findings in the dark theme',
            ],
        },
    ],
    'Raised panel': [
        {
            file: 'e2e/app.spec.ts',
            titles: [
                ...BOTH_THEMES(
                    (theme) =>
                        `draws a raised panel on the raised ground, lifted by the resting shadow or the page's own, in the ${theme} theme`
                ),
                'keeps a pinned column and a code block apart from a raised panel on grounds of their own',
                'gives a piece the ground of the nearest container that holds it, however they nest',
            ],
        },
        {
            file: 'e2e/rows.spec.ts',
            titles: [
                ...BOTH_THEMES(
                    (theme) =>
                        `steps a tile's ground off a plain panel to the page's, and off a raised one to the card's, in the ${theme} theme`
                ),
                ...['on a wide page', 'on a phone', "on an app's frame"].map(
                    (where) =>
                        `starts a tile's words on the line a raised panel's start on above it, ${where}`
                ),
            ],
        },
    ],
    Rows: [
        {
            file: 'e2e/rows.spec.ts',
            titles: [
                'draws a rule between rows and none after the last, in both themes and forced colors',
                'draws each row at the target, and the larger target in a tall list',
                'makes a link row one stop named by its words, title first, with its ring around the whole row',
                "makes a button at a row's end its own stop, named for what it does and to which row",
                'wraps a long title, and keeps the end beside its first line',
                'lines a row of one line up in the middle of its height, and its figures in one width',
                'says how many rows a list holds, and draws an empty list not at all',
                'keeps a row with a button as tall as one without, the button in the middle and every ring off the words',
                'has no audit findings in the light theme',
                'has no audit findings in the dark theme',
            ],
        },
        {
            file: 'e2e/empty.spec.tsx',
            titles: [
                'draws no ground and no edge, its words where a row title starts in a page',
                'starts its words where a row title does at a bare edge too',
                'is not live, so it is read where it is',
                'draws its words muted at the body size and a plain button under them',
                'stays whole on a 320px phone at twice the text size',
                'stays whole under wider text spacing',
                ...EVERY_AUDIT,
                'the saved games waits for typing to stop, then says the search matches nothing and names it',
                'the saved games brings the list back when the search is emptied in the field itself',
            ],
        },
    ],
    Tiles: [
        {
            file: 'e2e/rows.spec.ts',
            titles: [
                'draws each tile on the ground its page sets, with an edge and a gap in place of the rule',
                'draws a tile on the surface with no ground set and no shadow, unless the page sets its own',
                ...BOTH_THEMES(
                    (theme) =>
                        `holds a tile's words at 4.5 to 1 and its sign and ring at 3 to 1, on the page's grounds in the ${theme} theme`
                ),
                "underlines a tile's title under a pointer, and rings it outside, as a separate control",
                "underlines a tile's title under a pressing thumb, on a phone where nothing hovers",
                "keeps a tile's edge in forced colors, in the system's link color",
                'keeps a tile at the larger target, its detail wrapping inside it at twice the text size',
                "keeps a tile's whole ring in view as the keyboard scrolls an app's body to it",
                ...BOTH_THEMES(
                    (theme) => `has no audit findings for a list of tiles in the ${theme} theme`
                ),
                "draws no tile's shadow in forced colors, a page's own included",
                'draws an empty list of tiles not at all',
            ],
        },
    ],
    'Pinned table': [
        {
            file: 'e2e/pinned.spec.ts',
            titles: [
                'keeps the column naming each row in view while the rest scrolls sideways',
                'lets nothing that passes under the pinned cells show through, on a page and on a panel, in both themes',
                'takes the ground a page sets for a table on a ground of its own',
                'keeps the pinned cells on top, on a ground that hides what passes under, in forced colors',
                "draws each row's rule under a pinned cell as it travels, and a rule where the column stops",
                'scrolls what the keyboard reaches in a cell clear of the pinned column',
                'takes the keyboard into its frame, named, and scrolls by the arrow keys',
                'leaves a table without the class as it was',
                'has no audit findings in the light theme',
                'has no audit findings in the dark theme',
            ],
        },
    ],
    'Theme switch': [
        {
            file: 'src/react.test.tsx',
            titles: [
                "the switch, the copy button and the status line take a ref and a class of the page after the kit's, with nothing in the markup moved",
                'the switch, the copy button and the status line draws the switch as its name, a button naming the choice for the collapsed form, and the group of radios described by the note',
                'the switch, the copy button and the status line draws a line after the switch for a visitor without script, worded by the page or turned off',
            ],
        },
        {
            file: 'e2e/pieces.spec.ts',
            titles: [
                'marks the chosen theme by an edge in the accent, not by its ground alone',
                'keeps every word in place as the choice moves',
                'makes each choice the field height tall, and a thumb wide and tall on a phone',
                'wraps its choices in a narrow column at a large text size, rather than scroll them away',
                'keeps its name and choices on one row at the usual text size, phone to wide',
                "collapses to its name and one button naming the choice in a demo's strip narrower than 20rem",
                "keeps the row of three choices in a demo's strip at 20rem and wider, and outside the strip at any width",
                "draws the switch's own ring, on the chosen word, in the focus color",
                ...PIECES_SPACED_AND_AUDITED,
            ],
        },
        {
            file: 'e2e/attach.spec.tsx',
            titles: [
                'keeps both controls hidden where no script attaches them',
                'says what sits where the switch would be, only to a visitor without script',
                'shows the saved choice, then saves and draws a new one, with nothing the policy refuses',
                'saves once a choice made on a switch attached twice',
                'follows a choice saved in another tab',
                'holds a choice the browser will not save, through a page restored by Back',
                'shows one choice on every switch, one attached through the element that holds it',
                'hides a switch again once it is taken away',
                'shows the choice saved meanwhile on a switch attached again after every switch was taken away',
                'draws a choice the page holds on a switch attached again after every switch was taken away',
                'reads the switch by its name, and describes it by its note',
                'collapses the switch in a strip on a screen narrower than 20rem to one button naming the choice shown',
                'opens the choices under the button, one to a row at the target, and closes on a pick by pointer with focus on the button',
                'moves the choice with the arrow keys without closing, and closes on Escape or a press outside',
                'closes the choices where they are when focus leaves the switch, and keeps them when it lands on the button',
                'moves no focus on a press on the button or a choice, so the choices stay until the click',
                "keeps the choices open on a press on the list's own padding, and closes them on one on the name",
            ],
        },
    ],
    'Copy button': [
        {
            file: 'src/react.test.tsx',
            titles: [
                "the switch, the copy button and the status line take a ref and a class of the page after the kit's, with nothing in the markup moved",
            ],
        },
        {
            file: 'e2e/pieces.spec.ts',
            titles: [
                'keeps the copy button as wide as its longest word, whichever word shows',
                ...PIECES_SPACED_AND_AUDITED,
            ],
        },
        {
            file: 'e2e/attach.spec.tsx',
            titles: [
                'keeps both controls hidden where no script attaches them',
                'attaches one element as a copy button though it was attached as a switch first',
                'puts a copy button back to Copy, hidden, when it is taken away mid-message',
                'copies the source on a click or on Enter, says Copied on the button and the status line, then Copy again',
                'selects the source where the clipboard is refused, says how to copy it, and keeps focus on the button pressed by Space',
            ],
        },
    ],
    Pills: [
        {
            file: 'e2e/pieces.spec.ts',
            titles: [
                'draws a chip that never reads as a control, and marks the current page by weight',
                ...PIECES_SPACED_AND_AUDITED,
            ],
        },
    ],
    Tabs: [
        {
            file: 'e2e/pieces.spec.ts',
            titles: [
                "marks the chosen tab by the page's text over an accent line, and by the system's selection in forced colors, the others on the rule's line",
                'stands every tab on a line when the row wraps, in both themes and forced colors',
                'draws a tab, a link among pages and a toggle alike, chosen or not',
                'keeps every tab in place as the choice moves',
                "keeps the chosen link's line on the rule when a neighbor's words wrap",
                "makes each tab the strip's height, and a thumb wide and tall on a phone",
                ...PIECES_SPACED_AND_AUDITED,
            ],
        },
    ],
    Eyebrows: [
        {
            file: 'e2e/pieces.spec.ts',
            titles: [
                'draws an eyebrow in caps at the caption size in the muted text, tracked, with no margin of its own',
                ...PIECES_SPACED_AND_AUDITED,
            ],
        },
    ],
    'Skip link': [
        {
            file: 'src/react.test.tsx',
            titles: ['the skip link leads to the main content by default, and to the target given'],
        },
        {
            file: 'e2e/chrome.spec.tsx',
            titles: [
                'keeps the skip link out of sight until the keyboard reaches it, and lands on the content',
                'keeps a skip link inside a positioned box out of sight and out of the way of a click',
                ...EVERY_CHROME,
            ],
        },
        {
            file: 'e2e/explainer.spec.tsx',
            titles: ['lands the skip link on the content, and an in-page link on its section'],
        },
    ],
    Strip: [
        {
            file: 'src/react.test.tsx',
            titles: [
                "the strip links the author's portfolio by name, how it works and where the source is, in that order",
                'the strip marks the explainer as the current page when the strip sits on it',
                "the strip holds the demo's own switches in a landmark named by the demo, only when there are some",
                'the strip keeps the room of switches on their way, with no landmark and no text until they come',
                ...STRIP_AND_FOOTER.unit,
            ],
        },
        {
            file: 'e2e/chrome.spec.tsx',
            titles: [
                'draws the strip on a wide screen in one row over its rule, its links in the column',
                'draws the strip on a phone in rows of links 16px apart',
                "puts the demo's switches beside the links on a wide screen and below them on a phone",
                'keeps the room of switches on their way, so nothing below the strip moves when they come',
                "holds the switches' room and the switches to the width a demo names, on a wide screen",
                'wraps a strip too narrow for its links and named switches the same before and after',
                ...STRIP_AND_FOOTER.browser,
            ],
        },
        { file: 'e2e/explainer.spec.tsx', titles: STRIP_AND_FOOTER.explainer },
    ],
    Footer: [
        {
            file: 'src/react.test.tsx',
            titles: [
                'the footer marks the explainer as the current page when the footer sits on it, as the strip does',
                'the footer names the project and its author, and links the explainer, the source, the work and the license',
                'the footer names the license a demo gives, and builds the default link without a doubled slash',
                'the footer ends with what a demo adds of its own, and with nothing when it adds nothing',
                ...STRIP_AND_FOOTER.unit,
            ],
        },
        {
            file: 'e2e/chrome.spec.tsx',
            titles: [
                "runs the footer's rule the width of the page, with its text in the column",
                ...STRIP_AND_FOOTER.browser,
            ],
        },
        { file: 'e2e/explainer.spec.tsx', titles: STRIP_AND_FOOTER.explainer },
    ],
    'Content page': [
        {
            file: 'e2e/layouts.spec.ts',
            titles: [
                'spaces a content page by the flow, its sections further apart, and holds its prose to the measure',
                "takes a content page's controls in the markup's order, and cuts nothing off at 320 wide, twice the text size and the wider text spacing",
            ],
        },
        {
            file: 'e2e/bands.spec.ts',
            titles: [
                "keeps a content page's section a section's step under the page's own heading",
            ],
        },
    ],
    'Bands and a hero': [
        {
            file: 'e2e/bands.spec.ts',
            titles: [
                "sizes a band's title, its heading and its sections, and keeps a group under the heading that names it",
                "lines a band's content up with the column and spaces it by the flow",
                "spaces a grid's items in a band by its gap alone, and a stack's pieces by the flow",
                "holds a band's and a stack's own prose to the measure, as a content page's",
                "reaches a row and a switch past a band's column by their ring, as on a content page",
                'keeps every word whole and nothing sideways on a 320px phone at twice the text size',
                "holds a band's sides at a phone's step on an app's page at twice the text size",
                'has no audit findings',
            ],
        },
        {
            file: 'e2e/hero.spec.ts',
            titles: [
                'sets the words beside the picture from 48rem, centered, the picture at 28rem',
                'holds the picture to 45% of the row, and breaks a display heading between words only, at 48rem',
                'sets the picture at the width a page names, held to 45% of the row',
                'stands the words over the picture a step apart on a phone, in their own proportions',
                ...['band', 'content page'].map(
                    (holder) => `keeps its own spacing written on a ${holder}`
                ),
                'holds the picture to its named height on a wider phone, cropped',
                ...['picture', 'figure'].map(
                    (kind) => `fits a picture in a ${kind} to its cell at every width`
                ),
                "lays out the reference's band example with nothing pushed sideways",
                'fills its cell beside taller words by cropping the picture, never stretching it',
                'pushes nothing sideways on a 320px phone at twice the text size',
                'pushes nothing sideways written on a content page at 320px and twice the text size',
                'pushes nothing sideways under wider text spacing at 48rem',
                ...EVERY_AUDIT,
            ],
        },
    ],
    'Groups of sections': [
        {
            file: 'e2e/bands.spec.ts',
            titles: [
                "sizes a band's title, its heading and its sections, and keeps a group under the heading that names it",
                ...[
                    [2, 1280],
                    [1, 390],
                ].map(
                    ([many, width]) =>
                        `sets a group of sections ${String(many)} to a row at ${String(width)} wide, each with a page section's heading and steps`
                ),
            ],
        },
        {
            file: 'e2e/split.spec.ts',
            titles: [
                'lines up the sections of a group written on a band, and a split row written on a stack',
                'sets a group of sections at --dk-sections-least, 20rem until a page sets it',
            ],
        },
    ],
    Stacks: [
        {
            file: 'e2e/stack.spec.ts',
            titles: [
                "spaces a pair, a heading's stack and its list at their steps",
                'spaces a plain stack at the step of what holds it, and a stack in a pair at the pair step',
                'keeps a named step under a title and under a page section heading',
                'gives a step class alone nothing, and a stack outside any container only its named step',
                ...['plain', 'dk-stack-pair', 'dk-stack-heading'].map(
                    (step) => `adds no step for a hidden piece in a ${step} stack`
                ),
                'draws a stack on a list with no marker, indent or room of its own',
                "writes the list's role in the example, which Safari drops with the markers",
                'stays whole on a 320px phone at twice the text size, a wrapped pair at its step',
                'keeps its steps between the pieces under wider text spacing',
                ...EVERY_AUDIT,
            ],
        },
    ],
    'Split rows, notes and numerals': [
        {
            file: 'e2e/split.spec.ts',
            titles: [
                'sets the start and the end on one line, on their baseline, at the ends of the row',
                'puts the end under the start a small step apart where they do not fit',
                'breaks a long first word rather than push the page sideways at twice the text size',
                'draws a note muted at the small size, and a numeral at its size in tabular mono',
                ...BOTH_THEMES(
                    (theme) =>
                        `draws a note beside a label's words at the normal weight in the ${theme} theme`
                ),
                'keeps the numeral and the row whole under wider text spacing',
                'reads the numeral with its unit',
                ...['-1234', '12345'].map(
                    (score) =>
                        `keeps a score of ${score} on one line on a 320px phone at twice the text size`
                ),
                'breaks a long word at the end of the row too',
                'holds a split row to the measure on a wide page',
                ...EVERY_AUDIT,
            ],
        },
    ],
    'The layout': [
        {
            file: 'e2e/explainer.spec.tsx',
            titles: [
                'lines the explainer up with the strip, and holds its prose to the measure',
                'keeps a line of prose to eighty characters or fewer on a wide screen',
                'opens each section with its rule, its number, its heading and then its text',
                'makes a landmark of no section, and of each frame, and keeps the steps a list',
                ...EVERY_PIECE,
            ],
        },
    ],
    Steps: [
        {
            file: 'e2e/explainer.spec.tsx',
            titles: [
                'makes a landmark of no section, and of each frame, and keeps the steps a list',
                ...EVERY_PIECE,
            ],
        },
    ],
    Panels: [
        {
            file: 'e2e/explainer.spec.tsx',
            titles: [
                'sets a panel on the card ground, with an edge that stays in forced colors',
                ...EVERY_PIECE,
            ],
        },
    ],
    Tables: [
        {
            file: 'e2e/explainer.spec.tsx',
            titles: [
                ...EVERY_FRAME,
                'keeps code in a table cell whole, so the frame scrolls rather than the code breaking',
                'reads a table by its column and row headers, with its figures set to the right',
                ...EVERY_PIECE,
            ],
        },
    ],
    'Code blocks': [
        {
            file: 'e2e/explainer.spec.tsx',
            titles: [
                ...EVERY_FRAME,
                'keeps code as it is written, its lines whole, and breaks inline code where it must',
                ...EVERY_PIECE,
            ],
        },
    ],
    Color: [
        {
            file: 'src/tokens.test.ts',
            titles: [
                "the tokens names every custom property with the kit prefix, a token's or the kit's own",
                'the tokens declares every color role with a light and a dark value',
            ],
        },
        {
            file: 'e2e/sheets.spec.ts',
            titles: [
                "takes a demo's own palette whichever sheet loads first",
                ...BOTH_THEMES(
                    (theme) =>
                        `restyles only the container a page sets the tokens on, in the ${theme} theme`
                ),
            ],
        },
    ],
    Contrast: [
        {
            file: 'src/tokens.test.ts',
            titles: BOTH_THEMES(
                (theme) => `the tokens holds every pairing to its ratio in the ${theme} theme`
            ),
        },
    ],
    Scale: [
        {
            file: 'src/tokens.test.ts',
            titles: [
                "the tokens names every custom property with the kit prefix, a token's or the kit's own",
                "the tokens reads the tokens without the kit's own working properties, which the sheet also declares",
                'the tokens reads a token from the root before any piece, and leaves out what a page sets and the kit works out',
                'the tokens reads the tokens of the three sheets without a property a page sets',
                'the tokens declares the scale a component is built from',
            ],
        },
    ],
    'How the theme is chosen': [
        {
            file: 'src/theme.test.ts',
            titles: [
                'the theme contract is the key the portfolio saves under and the two themes it saves',
                'the theme contract is the key and the values the script reads',
                'the theme contract sets a value the tokens have a rule for',
                'the theme contract is a script a page can put inline, with nothing that would end its element',
            ],
        },
        {
            file: 'src/vite.test.ts',
            titles: [
                'the theme script plugin puts the script inline where the page says',
                'the theme script plugin refuses a page with no place for the script, rather than leave it to flash',
                'the theme script plugin refuses a page that asks for the script more than once',
                "the theme script plugin gives the hash a page's policy names the script by",
            ],
        },
        {
            file: 'e2e/theme.spec.ts',
            titles: [
                ...BOTH_THEMES(
                    (system) => `draws the saved theme whatever the system, here ${system}`
                ),
                ...BOTH_THEMES(
                    (system) => `follows a system set to ${system} when nothing usable is saved`
                ),
                'sets the theme before the body is parsed',
                'follows the system when it changes, while nothing is saved',
                'takes a choice the portfolio saves in another tab',
                'follows the system where the browser refuses the page its storage',
                ...[
                    'has no matchMedia',
                    'throws from matchMedia',
                    'answers matchMedia as older browsers do, with addListener alone',
                    'throws from matchMedia().matches',
                ].map(
                    (how) =>
                        `draws light, or the saved theme, and hears another tab, where the browser ${how}`
                ),
            ],
        },
    ],
} satisfies Readonly<Record<string, readonly Held[]>>;

/** A group the site shows, by its heading. */
export type Group = keyof typeof HELD;
