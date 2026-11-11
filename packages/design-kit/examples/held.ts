/** Tests of the kit that hold one group the site shows, all from one file. */
export interface Held {
    /** The file, from the package's folder. */
    readonly file: string;
    /** Each test's full name as the runner reports it, its groups' titles before its own. */
    readonly titles: readonly string[];
}

const BOTH_THEMES = (title: (theme: string) => string) => [title('light'), title('dark')];

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
                "marks the chosen tab by the page's text over an accent line, and by the system's selection in forced colors, with no line under the others",
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
                'the tokens names every custom property with the kit prefix',
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
                'the tokens names every custom property with the kit prefix',
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
