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
                ...EVERY_CONTROL,
            ],
        },
        {
            file: 'e2e/ref.spec.ts',
            titles: ['moves focus back to the button a ref holds when its panel closes'],
        },
    ],
    Fields: [
        {
            file: 'src/react.test.tsx',
            titles: [
                'a field takes a ref typed as the control it draws, and refuses one of another element',
                'a field ties a label to the control, and draws nothing it was not given',
                'a field describes the control by its hint, then its error, and marks it invalid only with one',
                "a field keeps a page's own description after the field's, and draws an empty slot as none",
                'a field announces nothing itself, since the page says when an error appears',
                'a field gives each field on a page an id of its own when the page gives none',
                'a field makes an id of its own when the page gives an empty one',
                "a field passes the control's own attributes through",
                'a field draws a native select with its options, wired the same way',
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
                'a callout draws the info tone by default, with no role, so nothing reads it out of turn',
                'a callout says its tone in words a screen reader reads, as well as in color',
                'a callout takes a role only when the page asks for one, whatever its tone',
                'a callout draws a live message empty, so the page can fill it once it is on the page',
                'a callout puts its title before the message, as a heading at the level the page gives',
                'a callout reads its title and its tone word with a live message, since both are in it',
                'a callout keeps its actions outside the message, so a live message reads only its words',
                'the callout, beside the other controls takes an id and a class of the page, after its own, as a button and a field do',
                'the callout, beside the other controls hands a ref to the callout it draws, for a page that moves focus to it',
                'the callout, beside the other controls takes no props of its own that would break it, and drops a role or style plain JavaScript passes',
                'the callout, beside the other controls draws news for a tone plain JavaScript can pass that the kit has no rule for',
                'the callout, beside the other controls draws a paragraph for a heading level plain JavaScript can pass that names no heading',
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
                "the strip holds the demo's own switches in a landmark of their own, only when there are some",
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
