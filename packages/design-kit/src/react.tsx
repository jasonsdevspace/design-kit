import {
    type ButtonHTMLAttributes,
    type InputHTMLAttributes,
    type ReactNode,
    type Ref,
    type SelectHTMLAttributes,
    useId,
} from 'react';

/*
 * The page chrome a demo draws around its page, a skip link, a strip above the page that says
 * whose demo it is and a footer below it, and the buttons, fields and callouts on the page itself.
 * Each component draws the markup components.css styles and nothing else, with no stylesheet of
 * its own and no style attribute, so a page without React writes the same markup by hand, and a
 * page whose policy allows styles only from its own origin draws it. A control's state is a
 * native or ARIA attribute, never a class of the kit's.
 */

/** Whether a slot holds something to draw: a demo's `cond && <X />` leaves false or null. */
const drawn = (node: ReactNode): boolean => node !== undefined && node !== null && node !== false;

/** Where the portfolio is, and the section of it that lists the work. */
export const PORTFOLIO_URL = 'https://jasonsdevspace.com/';
export const PORTFOLIO_WORK_URL = 'https://jasonsdevspace.com/#work';
/** Where the rest of the work is. */
export const GITHUB_PROFILE_URL = 'https://github.com/jasonsdevspace';

/**
 * The first stop for the keyboard, out of sight until it takes focus, and then at the column's
 * inset. Following it moves focus past the strip to the element whose id it names, the page's main
 * content, which has a tabindex of -1 so it can take focus.
 */
export const SkipLink = ({
    target = 'main-content',
    children = 'Skip to content',
}: {
    /** The id of the element the link leads to. */
    readonly target?: string;
    readonly children?: ReactNode;
}) => (
    <a className="dk-skip" href={`#${target}`}>
        {children}
    </a>
);

/**
 * Whose demo this is, above the page, with three links together on the left. It is a navigation
 * landmark in a plain div rather than a header, so the demo's own header stays the page's one
 * banner. A demo with switches of its own puts them beside the links, in a landmark of their own
 * named for them.
 */
export const PortfolioStrip = ({
    about,
    source,
    current,
    tools,
    toolsLabel = 'Demo',
}: {
    /** The demo's explainer, relative to the page or absolute. */
    readonly about: string;
    /** The demo's repository. */
    readonly source: string;
    /** The link that is the page the strip sits on, marked as the current page. */
    readonly current?: 'about';
    /** The demo's own switches, drawn beside the links. */
    readonly tools?: ReactNode;
    /** The name a screen reader gives the switches' landmark. */
    readonly toolsLabel?: string;
}) => (
    <div className="dk-strip">
        <nav className="dk-strip-links" aria-label="Portfolio">
            <a href={PORTFOLIO_WORK_URL}>A demo by Jason Poteet</a>
            <a href={about} aria-current={current === 'about' ? 'page' : undefined}>
                How it works
            </a>
            <a href={source}>Source on GitHub</a>
        </nav>
        {!drawn(tools) ? null : (
            <section className="dk-strip-tools" aria-label={toolsLabel}>
                {tools}
            </section>
        )}
    </div>
);

/**
 * The exit after a long scroll: whose project this is, how it works, where the source and the rest
 * of the work are, and the license, with anything the demo adds of its own after them.
 */
export const DemoFooter = ({
    name,
    about,
    source,
    license = `${source.endsWith('/') ? source.slice(0, -1) : source}/blob/main/LICENSE`,
    licenseName = 'MIT license',
    children,
}: {
    /** The demo's name, as the footer's sentence opens with it. */
    readonly name: string;
    /** The demo's explainer, relative to the page or absolute. */
    readonly about: string;
    /** The demo's repository. */
    readonly source: string;
    /** The demo's license, the LICENSE file on the repository's main branch unless given. */
    readonly license?: string;
    /** What the license is called, as the footer's sentence names it. */
    readonly licenseName?: string;
    /** What the demo adds after the license, as sentences of its own. */
    readonly children?: ReactNode;
}) => (
    <footer className="dk-footer">
        <p>
            {name} is a portfolio project by <a href={PORTFOLIO_URL}>Jason Poteet</a>.{' '}
            <a href={about}>How it works</a>, in plain words. The <a href={source}>source</a> and{' '}
            <a href={GITHUB_PROFILE_URL}>more work</a> are on GitHub, under the{' '}
            <a href={license}>{licenseName}</a>.{drawn(children) ? <> {children}</> : null}
        </p>
    </footer>
);

/** Whether a slot holds words to draw, an empty string being none. */
const filled = (node: ReactNode): boolean => drawn(node) && node !== '';

/**
 * A list of names an attribute holds, such as the classes a component draws, its own first and a
 * page's after them, or the ids that describe a control, with any left out or empty dropped.
 */
const spaced = (...names: readonly (string | false | undefined)[]): string =>
    names.filter((name) => typeof name === 'string' && name !== '').join(' ');

type NativeButton = Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'style' | 'disabled' | 'aria-disabled' | 'aria-pressed'
>;

/**
 * A button's own props: the accent for the one action a view leads with, `pressed` for a toggle
 * that stands alone, and `off`. The accent is never a toggle, so the two do not go together.
 */
export type ButtonProps = NativeButton & {
    /** Off, but still in the tab order, so a keyboard keeps its place and finds out why. */
    readonly off?: boolean;
    /** The button drawn, for a page that moves focus to it, such as when its panel closes. */
    readonly ref?: Ref<HTMLButtonElement>;
} & (
        | { readonly accent: true; readonly pressed?: never }
        | {
              readonly accent?: false;
              /** Whether the toggle is on. False still marks it a toggle, undefined an action. */
              readonly pressed?: boolean;
          }
    );

/**
 * A button, of type button unless a page gives another, so it never submits a form by surprise.
 * Off, it is marked aria-disabled rather than disabled, since a disabled button that has focus
 * drops it, and a press of it runs no click handler of the page's and stops the form it would
 * submit. The page's other handlers, for keys or a pointer, still run, and check `off` themselves.
 */
export const Button = ({
    accent,
    pressed,
    off = false,
    type = 'button',
    className,
    onClick,
    children,
    ...native
}: ButtonProps) => (
    <button
        {...native}
        type={type}
        className={spaced('dk-button', accent === true && 'dk-button-accent', className)}
        aria-pressed={pressed}
        aria-disabled={off ? true : undefined}
        onClick={
            off
                ? (event) => {
                      event.preventDefault();
                  }
                : onClick
        }
    >
        {children}
    </button>
);

/** What a field draws around its control. */
type FieldParts = {
    /** The label, which names the control and focuses it when pressed. */
    readonly label: ReactNode;
    /** What helps a visitor fill the field, read as its description. */
    readonly hint?: ReactNode;
    /** What is wrong with the value, drawn only when given, which marks the control invalid. */
    readonly error?: ReactNode;
    /** The control's id, made with useId unless a page gives one, as it does for a link to it. */
    readonly id?: string;
};

/**
 * The attributes that tie a control to its label, hint and error. Only what is drawn is listed,
 * the hint before the error as they are read, then any description the page gives of its own.
 */
const useField = (
    { id, hint, error }: FieldParts,
    own: string | undefined
): {
    readonly id: string;
    readonly hint: boolean;
    readonly error: boolean;
    readonly wired: {
        readonly id: string;
        readonly 'aria-describedby': string | undefined;
        readonly 'aria-invalid': true | undefined;
    };
} => {
    const made = useId();
    // An empty id would tie nothing, so it is made as one left out is.
    const control = id === undefined || id === '' ? made : id;
    const hinted = filled(hint);
    const wrong = filled(error);
    const describedBy = spaced(hinted && `${control}-hint`, wrong && `${control}-error`, own);
    return {
        id: control,
        hint: hinted,
        error: wrong,
        wired: {
            id: control,
            'aria-describedby': describedBy === '' ? undefined : describedBy,
            'aria-invalid': wrong ? true : undefined,
        },
    };
};

/**
 * A field's label, hint and error around its control. The error sits above the control, so a
 * phone's keyboard never covers it, and starts with a word a screen reader reads, so the error is
 * told from the hint by more than its color. It is not live, since a form that fails in several
 * fields at once would speak over itself, so the page says when an error appears.
 */
const Field = ({
    parts,
    field,
    children,
}: {
    readonly parts: FieldParts;
    readonly field: ReturnType<typeof useField>;
    readonly children: ReactNode;
}) => (
    <div className="dk-field">
        <label className="dk-field-label" htmlFor={field.id}>
            {parts.label}
        </label>
        {field.hint ? (
            <p className="dk-field-hint" id={`${field.id}-hint`}>
                {parts.hint}
            </p>
        ) : null}
        {field.error ? (
            <p className="dk-field-error" id={`${field.id}-error`}>
                <span className="dk-visually-hidden">Error: </span>
                {parts.error}
            </p>
        ) : null}
        {children}
    </div>
);

export type InputFieldProps = FieldParts &
    Omit<InputHTMLAttributes<HTMLInputElement>, 'style' | 'id' | 'aria-invalid' | 'children'>;

/** A text input with its label, hint and error, the input taking every other prop given. */
export const InputField = (props: InputFieldProps) => {
    const { label: _label, hint: _hint, error: _error, id: _id, className, ...rest } = props;
    const { 'aria-describedby': own, ...native } = rest;
    const field = useField(props, own);
    return (
        <Field parts={props} field={field}>
            <input className={spaced('dk-input', className)} {...native} {...field.wired} />
        </Field>
    );
};

export type SelectFieldProps = FieldParts &
    Omit<SelectHTMLAttributes<HTMLSelectElement>, 'style' | 'id' | 'aria-invalid'>;

/** A native select with its label, hint and error, its children the options. */
export const SelectField = (props: SelectFieldProps) => {
    const { label: _label, hint: _hint, error: _error, id: _id, className, ...rest } = props;
    const { 'aria-describedby': own, children, ...native } = rest;
    const field = useField(props, own);
    return (
        <Field parts={props} field={field}>
            <select className={spaced('dk-select', className)} {...native} {...field.wired}>
                {children}
            </select>
        </Field>
    );
};

/** What a callout is about: news, something that went right, or something that went wrong. */
export type CalloutTone = 'info' | 'success' | 'danger';

/** The word a screen reader reads before each tone's message, so the tone is not color alone. */
const TONE_WORDS: Readonly<Record<CalloutTone, string>> = {
    info: '',
    success: 'Success: ',
    danger: 'Error: ',
};

/** The element a callout's title is drawn as, at each heading level a page may give it. */
const HEADINGS = { 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' } as const;

/**
 * A message set apart from the page, with an optional title before it and actions after it. It has
 * no role unless the page gives `live`, whatever its tone, since a message on the page when it
 * loads is read in its place. A live message is drawn even when empty, so the page can mount it
 * first and fill it after, which is when a screen reader reads it. The role sits on the message,
 * which holds the title and the tone's word too, so they are read with it, and the actions are
 * not.
 */
export const Callout = ({
    tone = 'info',
    title,
    headingLevel,
    live,
    prefix = TONE_WORDS[tone],
    actions,
    children,
}: {
    readonly tone?: CalloutTone;
    /** What the callout is about, drawn before its message. */
    readonly title?: ReactNode;
    /** The title's heading level, where the callout is a section a visitor would jump to. */
    readonly headingLevel?: 2 | 3 | 4 | 5 | 6;
    /** A message a screen reader reads when it changes, politely or at once. */
    readonly live?: 'status' | 'alert';
    /** The word read before the title or the message, the tone's own unless given. */
    readonly prefix?: string;
    /** Buttons or links that act on the message. */
    readonly actions?: ReactNode;
    readonly children?: ReactNode;
}) => {
    // A level the types refuse, as a page in plain JavaScript can pass, draws a paragraph.
    const Title = (headingLevel === undefined ? undefined : HEADINGS[headingLevel]) ?? 'p';
    const titled = filled(title);
    const said = filled(children);
    const word = prefix === '' ? null : <span className="dk-visually-hidden">{prefix}</span>;
    return (
        <div className={spaced('dk-callout', tone !== 'info' && `dk-callout-${tone}`)}>
            {titled || said || live !== undefined ? (
                <div className="dk-callout-body" role={live}>
                    {titled ? (
                        <Title className="dk-callout-title">
                            {word}
                            {title}
                        </Title>
                    ) : null}
                    {!titled && said ? word : null}
                    {said ? children : null}
                </div>
            ) : null}
            {filled(actions) ? <div className="dk-callout-actions">{actions}</div> : null}
        </div>
    );
};
