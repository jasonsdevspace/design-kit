import {
    Children,
    type ComponentPropsWithRef,
    Fragment,
    isValidElement,
    type ReactNode,
    type Ref,
    useId,
} from 'react';

import { THEME_CHOICES, type ThemeChoice } from './theme.js';
/*
 * The page chrome a demo draws around its page, a skip link, a strip above the page that says
 * whose demo it is and a footer below it, and the buttons, fields and callouts on the page itself.
 * Each component draws the markup components.css styles and nothing else, with no stylesheet of
 * its own and no style attribute, so a page without React writes the same markup by hand, and a
 * page whose policy allows styles only from its own origin draws it. A control's state is a
 * native or ARIA attribute, never a class of the kit's. A component trusts its types, and guards
 * at run time only where a value plain JavaScript can pass would become a class, an element or an
 * attribute of its own, as a callout's tone, heading level, role and live region would.
 */

/**
 * Whether a slot holds something to draw: a demo's `cond && <X />` leaves false or null, an empty
 * string draws nothing either, and nor does a list or a fragment of only those. Every slot a
 * component leaves out when it is empty is read the same way. A number draws, 0 included, as React
 * draws it, so a page that writes `count && <X />` writes `count > 0 && <X />` instead.
 */
const filled = (node: ReactNode): boolean =>
    Children.toArray(node).some((child) =>
        isValidElement<{ readonly children?: ReactNode }>(child) && child.type === Fragment
            ? filled(child.props.children)
            : child !== ''
    );

/**
 * A list of names an attribute holds, such as the classes a component draws, its own first and a
 * page's after them, or the ids that describe a control, with any left out or empty dropped.
 */
const spaced = (...names: readonly (string | false | undefined)[]): string =>
    names.filter((name) => typeof name === 'string' && name !== '').join(' ');

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
export type SkipLinkProps = {
    /** The id of the element the link leads to. */
    readonly target?: string | undefined;
    readonly children?: ReactNode;
};

export const SkipLink = ({
    target = 'main-content',
    children = 'Skip to content',
}: SkipLinkProps) => (
    <a className="dk-skip" href={`#${target}`}>
        {children}
    </a>
);

/** A page of the demo's that the chrome links to, and can mark as the one it sits on. */
type ChromePage = 'about';

/** The mark a link to `page` takes when it is the page the chrome sits on, and none otherwise. */
const currentAs = (current: ChromePage | undefined, page: ChromePage) =>
    current === page ? 'page' : undefined;

/**
 * Whose demo this is, above the page, with three links together on the left: the author's name,
 * which leads to the portfolio as the footer's does, how it works and the source. It is a
 * navigation landmark in a plain div rather than a header, so the demo's own header stays the
 * page's one banner. A demo with switches of its own puts them beside the links, in a landmark of
 * their own named for them, since a name a screen reader hears has to say what the section holds,
 * and while
 * they are on their way the strip keeps their room in that section, unnamed and so no landmark,
 * with a line in it that only a visitor without script sees, since for them the switches never
 * come. A switch drawn into a template and copied out by a page's script leaves its own such line
 * behind, which is why the room carries one.
 */
export type PortfolioStripProps = {
    /** The demo's explainer, relative to the page or absolute, written by the demo's author. */
    readonly about: string;
    /** The demo's repository, written by the demo's author. */
    readonly source: string;
    /** The link that is the page the strip sits on, marked as the current page. */
    readonly current?: ChromePage | undefined;
    /**
     * The switches are on their way, so the strip keeps the room of one row of the kit's controls
     * in their section, empty and unnamed, so no landmark, until `tools` holds them and the section
     * takes its name.
     */
    readonly toolsWaiting?: boolean | undefined;
    /**
     * What a visitor without script reads in the room, since the switches never come for them.
     * Empty draws no line.
     */
    readonly toolsNoscript?: ReactNode;
} & (
    | {
          /** The demo's own switches, drawn beside the links. */
          readonly tools: ReactNode;
          /** The name a screen reader hears for the switches' landmark, such as Settings. */
          readonly toolsLabel: string;
      }
    | { readonly tools?: undefined; readonly toolsLabel?: undefined }
);

export const PortfolioStrip = ({
    about,
    source,
    current,
    tools,
    toolsLabel,
    toolsWaiting = false,
    toolsNoscript = "With scripts on, the demo's switches sit here.",
}: PortfolioStripProps) => (
    <div className="dk-strip">
        <nav className="dk-strip-links" aria-label="Portfolio">
            <a href={PORTFOLIO_URL}>Jason Poteet</a>
            <a href={about} aria-current={currentAs(current, 'about')}>
                How it works
            </a>
            <a href={source}>Source on GitHub</a>
        </nav>
        {filled(tools) ? (
            // A blank name would be an attribute that names nothing, so the section goes unnamed,
            // and is no landmark, as the room is.
            <section
                className="dk-strip-tools"
                aria-label={toolsLabel === '' ? undefined : toolsLabel}
            >
                {tools}
            </section>
        ) : toolsWaiting ? (
            <section className="dk-strip-tools">
                <span className="dk-strip-room" />
                {filled(toolsNoscript) ? (
                    <noscript>
                        <p className="dk-strip-noscript">{toolsNoscript}</p>
                    </noscript>
                ) : null}
            </section>
        ) : null}
    </div>
);

/**
 * The exit after a long scroll: whose project this is, how it works, where the source and the rest
 * of the work are, and the license, with anything the demo adds of its own after them.
 */
export type DemoFooterProps = {
    /** The demo's name, as the footer's text opens with it. */
    readonly name: string;
    /** The demo's explainer, relative to the page or absolute, written by the demo's author. */
    readonly about: string;
    /** The demo's repository, written by the demo's author. */
    readonly source: string;
    /** The link that is the page the footer sits on, marked as the current page. */
    readonly current?: ChromePage | undefined;
    /**
     * The demo's license, written by the demo's author, or `LICENSE` on the main branch of `source`
     * unless given.
     */
    readonly license?: string | undefined;
    /** What the license is called, as the footer's text names it. */
    readonly licenseName?: string | undefined;
    /** What the demo adds at the end, as sentences of its own. */
    readonly children?: ReactNode;
    /**
     * A line of the demo's own beside the footer's text on a wide screen and under it on a phone,
     * such as the version and commit the page was built from. It is drawn in a paragraph, so it
     * holds text, links and code, never a block.
     */
    readonly aside?: ReactNode;
};

export const DemoFooter = ({
    name,
    about,
    source,
    current,
    license = `${source.endsWith('/') ? source.slice(0, -1) : source}/blob/main/LICENSE`,
    licenseName = 'MIT license',
    children,
    aside,
}: DemoFooterProps) => (
    <footer className="dk-footer">
        <p>
            {name} is a portfolio project by <a href={PORTFOLIO_URL}>Jason Poteet</a>, who has{' '}
            <a href={GITHUB_PROFILE_URL}>more work</a> on GitHub.{' '}
            <a href={about} aria-current={currentAs(current, 'about')}>
                How it works
            </a>{' '}
            is explained in plain words. The <a href={source}>source</a> is on GitHub under the{' '}
            <a href={license}>{licenseName}</a>.{filled(children) ? <> {children}</> : null}
        </p>
        {filled(aside) ? <p className="dk-footer-aside">{aside}</p> : null}
    </footer>
);

type NativeButton = Omit<
    ComponentPropsWithRef<'button'>,
    'style' | 'disabled' | 'aria-disabled' | 'aria-pressed'
>;

/**
 * A button's own props: the accent for the one action a view leads with, `large` for a bigger
 * target, `tall` for the larger target what a screen is for takes, `text` for a button drawn as
 * a link, `pressed` for a toggle that stands alone, and `off`, beside a `<button>`'s own, its
 * `ref` among them, which holds the button drawn for a page that moves focus to it. The accent is
 * never a toggle and never a text button, and a text button is never a toggle, never large and
 * never tall, so none of those go together.
 */
export type ButtonProps = NativeButton & {
    /** Off, but still in the tab order, so a keyboard keeps its place and finds out why. */
    readonly off?: boolean | undefined;
} & (
        | {
              /** The one action a view leads with, filled in the accent. */
              readonly accent?: boolean | undefined;
              readonly pressed?: undefined;
              readonly text?: false | undefined;
              /**
               * A thumb's target tall at every width, with wider inline padding and the body text
               * size.
               */
              readonly large?: boolean | undefined;
              /**
               * The larger target tall at every width, for what a screen is for. It sets the
               * height, and the least width with it, so it goes with `large` or without.
               */
              readonly tall?: boolean | undefined;
          }
        | {
              readonly accent?: false | undefined;
              /** Whether the toggle is on. False still marks it a toggle, undefined an action. */
              readonly pressed?: boolean | undefined;
              readonly text?: false | undefined;
              readonly large?: boolean | undefined;
              readonly tall?: boolean | undefined;
          }
        | {
              readonly accent?: false | undefined;
              readonly pressed?: undefined;
              /**
               * Drawn as a link, with no edge and no inline padding, in the accent and underlined.
               */
              readonly text: true;
              readonly large?: undefined;
              readonly tall?: undefined;
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
    large,
    tall,
    text,
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
        className={spaced(
            'dk-button',
            accent === true && 'dk-button-accent',
            large === true && 'dk-button-large',
            tall === true && 'dk-button-tall',
            text === true && 'dk-button-text',
            className
        )}
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
    /**
     * The label, which names the control and focuses it when pressed, or names a set as its
     * legend.
     */
    readonly label: ReactNode;
    /** What helps a visitor fill the field, read as its description. */
    readonly hint?: ReactNode;
    /** What is wrong with the value, drawn only when given, which marks the control invalid. */
    readonly error?: ReactNode;
    /** The control's id, made with useId unless a page gives one, as it does for a link to it. */
    readonly id?: string | undefined;
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
 * A field's hint and error, each drawn only when it holds something. The error sits above the
 * control, so a phone's keyboard never covers it, and starts with a word a screen reader reads, so
 * the error is told from the hint by more than its color. It is not live, since a form that fails
 * in several fields at once would speak over itself, so the page says when an error appears.
 */
const FieldText = ({
    parts,
    field,
}: {
    readonly parts: FieldParts;
    readonly field: ReturnType<typeof useField>;
}) => (
    <>
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
    </>
);

/** A field's label, hint and error around its control. */
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
        <FieldText parts={parts} field={field} />
        {children}
    </div>
);

/**
 * What a field hands its control: every prop but the field's own parts, with the page's own
 * description taken out for the wiring, and the wiring itself.
 */
const useControl = <P extends FieldParts & { readonly 'aria-describedby'?: string | undefined }>(
    props: P
) => {
    const { label: _label, hint: _hint, error: _error, id: _id, ...rest } = props;
    const { 'aria-describedby': own, ...native } = rest;
    return { native, field: useField(props, own) };
};

export type InputFieldProps = FieldParts &
    Omit<ComponentPropsWithRef<'input'>, 'style' | 'id' | 'aria-invalid' | 'children'>;

/**
 * A text input with its label, hint and error, the input taking every other prop given, its `ref`
 * among them, which holds the input drawn for a page that moves focus to it.
 */
export const InputField = (props: InputFieldProps) => {
    const { native, field } = useControl(props);
    const { className, ...rest } = native;
    return (
        <Field parts={props} field={field}>
            <input className={spaced('dk-input', className)} {...rest} {...field.wired} />
        </Field>
    );
};

export type SelectFieldProps = FieldParts &
    Omit<ComponentPropsWithRef<'select'>, 'style' | 'id' | 'aria-invalid'>;

/**
 * A native select with its label, hint and error, its children the options, and the select taking
 * every other prop given, its `ref` among them, which holds the select drawn for a page that moves
 * focus to it.
 */
export const SelectField = (props: SelectFieldProps) => {
    const { native, field } = useControl(props);
    const { className, children, ...rest } = native;
    return (
        <Field parts={props} field={field}>
            <select className={spaced('dk-select', className)} {...rest} {...field.wired}>
                {children}
            </select>
        </Field>
    );
};

export type TextareaFieldProps = FieldParts &
    Omit<ComponentPropsWithRef<'textarea'>, 'style' | 'id' | 'aria-invalid' | 'children'>;

/**
 * A textarea with its label, hint and error, three rows tall unless given its rows, the textarea
 * taking every other prop given, its `ref` among them, which holds the textarea drawn for a page
 * that moves focus to it. Its text is `defaultValue` or `value`, never children, as React has it.
 */
export const TextareaField = (props: TextareaFieldProps) => {
    const { native, field } = useControl(props);
    const { className, rows = 3, ...rest } = native;
    return (
        <Field parts={props} field={field}>
            <textarea
                className={spaced('dk-textarea', className)}
                rows={rows}
                {...rest}
                {...field.wired}
            />
        </Field>
    );
};

/**
 * One choice among a set: a label holding a native radio or checkbox and its word, with a gloss
 * after the word when it has one. The theme switch's choices are drawn by it too, under their own
 * class, so the two cannot drift apart.
 */
const ChoiceLabel = ({
    className,
    word,
    gloss,
    ...input
}: Omit<ComponentPropsWithRef<'input'>, 'className' | 'children'> & {
    readonly className: string;
    readonly word: ReactNode;
    readonly gloss?: ReactNode;
}) => (
    <label className={className}>
        <input {...input} />
        <span>
            {word}
            {filled(gloss) ? <span className="dk-choice-hint"> {gloss}</span> : null}
        </span>
    </label>
);

/** A choice in a choice field, beside its control's own props, such as `checked` or `disabled`. */
export type Choice = Omit<
    ComponentPropsWithRef<'input'>,
    'style' | 'type' | 'name' | 'aria-invalid' | 'className' | 'children' | 'value' | 'key'
> & {
    /** What the control submits, and what tells the choices apart. */
    readonly value: string;
    /** The word beside the control, which names it. */
    readonly label: ReactNode;
    /** A gloss after the word, in the muted text, read as part of the choice's name. */
    readonly hint?: ReactNode;
};

export type ChoiceFieldProps = FieldParts &
    Omit<
        ComponentPropsWithRef<'fieldset'>,
        'style' | 'id' | 'role' | 'aria-invalid' | 'children'
    > & {
        /** The controls' name, shared by every choice in the set. */
        readonly name: string;
        /** Radios, where one choice is on, or checkboxes, where any number are. */
        readonly type?: 'radio' | 'checkbox' | undefined;
        readonly choices: readonly Choice[];
        /** The choices in a row that wraps, rather than one under the other. */
        readonly row?: boolean | undefined;
    };

/**
 * A set of radios or checkboxes with its label, hint and error: a fieldset whose legend is the
 * label, described by the hint and the error as a control is. A set of radios is a radio group,
 * which is marked invalid as a whole while an error is drawn, since the keyboard enters it at the
 * chosen radio, wherever that is. Checkboxes are each a stop of their own, so each is marked.
 * Every control of the set is described by the error too, after any description of its own, since
 * a screen reader that lands on a control may read nothing of its group. The fieldset takes every
 * other prop given, its `ref` among them, and no role, since the set's role follows its type.
 */
export const ChoiceField = (props: ChoiceFieldProps) => {
    const { native, field } = useControl(props);
    const { name, type = 'radio', choices, row = false, className, ...rest } = native;
    const errorId = field.error ? `${field.id}-error` : undefined;
    return (
        <fieldset
            {...rest}
            className={spaced('dk-field', 'dk-choice-field', className)}
            id={field.id}
            role={type === 'radio' ? 'radiogroup' : undefined}
            aria-describedby={field.wired['aria-describedby']}
            aria-invalid={type === 'radio' && field.error ? true : undefined}
        >
            <legend className="dk-field-label">{props.label}</legend>
            <FieldText parts={props} field={field} />
            <div className={spaced('dk-choices', row && 'dk-choices-row')}>
                {choices.map(
                    ({ value, label: word, hint: gloss, 'aria-describedby': own, ...input }) => (
                        <ChoiceLabel
                            key={value}
                            className="dk-choice"
                            word={word}
                            gloss={gloss}
                            type={type}
                            name={name}
                            value={value}
                            aria-invalid={type === 'checkbox' && field.error ? true : undefined}
                            aria-describedby={spaced(errorId, own) || undefined}
                            {...input}
                        />
                    )
                )}
            </div>
        </fieldset>
    );
};

/**
 * What a callout is about: news, something that went right, something that went wrong, or
 * something that needs care before it goes wrong, such as stock running low.
 */
export type CalloutTone = 'info' | 'success' | 'warning' | 'danger';

/** The word a screen reader reads before each tone's message, so the tone is not color alone. */
const TONE_WORDS: Readonly<Record<CalloutTone, string>> = {
    info: '',
    success: 'Success: ',
    warning: 'Warning: ',
    danger: 'Error: ',
};

/** The element a callout's title is drawn as, at each heading level a page may give it. */
const HEADINGS = { 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' } as const;

/**
 * A tone or a heading level the types refuse, as a page in plain JavaScript can pass, draws news
 * and a paragraph, rather than a class the sheet has no rule for or an element React refuses.
 */
const toneOf = (tone: CalloutTone): CalloutTone =>
    Object.hasOwn(TONE_WORDS, tone) ? tone : 'info';
const titleOf = (level: CalloutProps['headingLevel']) =>
    level !== undefined && Object.hasOwn(HEADINGS, level) ? HEADINGS[level] : 'p';

/**
 * A callout's own props, beside a `<div>`'s own, its `id`, a page's class, drawn after the kit's,
 * and its `ref` among them, which holds the callout drawn for a page that moves focus to it, such
 * as a summary of what went wrong in a form. Its `title` is the callout's, not the attribute.
 */
export type CalloutProps = Omit<
    ComponentPropsWithRef<'div'>,
    | 'style'
    | 'role'
    | 'title'
    | 'children'
    | 'dangerouslySetInnerHTML'
    | 'aria-live'
    | 'aria-atomic'
    | 'aria-relevant'
> & {
    readonly tone?: CalloutTone | undefined;
    /** What the callout is about, drawn before its message. */
    readonly title?: ReactNode;
    /** The title's heading level, where the callout is a section a visitor would jump to. */
    readonly headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined;
    /** A message a screen reader reads when it changes, politely or at once. */
    readonly live?: 'status' | 'alert' | undefined;
    /** The word read before the title or the message, the tone's own unless given. */
    readonly prefix?: string | undefined;
    /** Buttons or links that act on the message. */
    readonly actions?: ReactNode;
    readonly children?: ReactNode;
};

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
    prefix,
    actions,
    className,
    children,
    ...native
}: CalloutProps) => {
    const kind = toneOf(tone);
    const spoken = prefix ?? TONE_WORDS[kind];
    const Title = titleOf(headingLevel);
    const titled = filled(title);
    const said = filled(children);
    const word = spoken === '' ? null : <span className="dk-visually-hidden">{spoken}</span>;
    return (
        // The page's own props first and the kit's after, as a button's are, so a role, a style,
        // inner HTML or a live region plain JavaScript passes never lands on the callout, whose
        // message takes its role from `live` alone.
        <div
            {...native}
            role={undefined}
            style={undefined}
            dangerouslySetInnerHTML={undefined}
            aria-live={undefined}
            aria-atomic={undefined}
            aria-relevant={undefined}
            className={spaced('dk-callout', kind !== 'info' && `dk-callout-${kind}`, className)}
        >
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

/** The word each theme choice is shown by. */
const CHOICE_WORDS: Readonly<Record<ThemeChoice, string>> = {
    system: 'System',
    light: 'Light',
    dark: 'Dark',
};

/**
 * The theme switch's markup: its name, Theme, a button that names the current choice for the
 * collapsed form, and a group named Theme of three native radios, described by a note that says
 * where the choice is kept. It is hidden and no radio is checked until `attachThemeSwitch` from
 * `@jasonsdevspace/design-kit/controls` shows it with the choice the page draws, so a visitor
 * without script meets no control that does nothing, and a line after the switch, inside `noscript`
 * so only a visitor without script sees it, says what sits there with scripts on. The radios carry
 * no checked prop, so React never undoes what the attach function sets. The button is drawn in
 * every switch and shown by the sheet alone, in a demo's strip on a screen narrower than 20rem,
 * where it opens the group under itself, so the markup is one whatever the width. The switch takes
 * a ref and a page's class after the kit's own, and nothing in its markup moves.
 */
export type ThemeSwitchProps = {
    /** What the name's and the note's ids start with, made with useId unless a page gives one. */
    readonly id?: string | undefined;
    /** The radios' name, unique on the page, the id unless a page gives one. */
    readonly name?: string | undefined;
    /** What the group is described by, out of sight. */
    readonly note?: string | undefined;
    /** What a visitor without script reads where the switch would be. Empty draws no line. */
    readonly noscript?: ReactNode;
    /** A page's class, after the kit's. */
    readonly className?: string | undefined;
    /** The switch drawn, for a page that attaches it through the element. */
    readonly ref?: Ref<HTMLDivElement> | undefined;
};

export const ThemeSwitch = ({
    id,
    name,
    note = 'Your choice is saved for every page of this site.',
    noscript = 'With scripts on, a Theme switch sits here.',
    className,
    ref,
}: ThemeSwitchProps) => {
    const made = useId();
    // An empty id would start every part's id with a hyphen, which two switches on a page would
    // share, so it is made as one left out is, as a field's is.
    const base = id === undefined || id === '' ? made : id;
    return (
        <>
            <div ref={ref} className={spaced('dk-theme-switch', className)} hidden>
                <span className="dk-theme-switch-name" id={`${base}-name`}>
                    Theme
                </span>
                <button
                    type="button"
                    className="dk-theme-switch-button"
                    id={`${base}-button`}
                    aria-labelledby={`${base}-name ${base}-button`}
                    aria-expanded={false}
                    aria-controls={`${base}-choices`}
                >
                    {CHOICE_WORDS.system}
                </button>
                <div
                    className="dk-theme-switch-choices"
                    id={`${base}-choices`}
                    role="radiogroup"
                    aria-labelledby={`${base}-name`}
                    aria-describedby={`${base}-note`}
                >
                    {THEME_CHOICES.map((value) => (
                        <ChoiceLabel
                            key={value}
                            className="dk-theme-switch-choice"
                            type="radio"
                            name={name ?? base}
                            value={value}
                            word={CHOICE_WORDS[value]}
                        />
                    ))}
                </div>
                <span className="dk-visually-hidden" id={`${base}-note`}>
                    {note}
                </span>
            </div>
            {filled(noscript) ? (
                <noscript>
                    <p className="dk-theme-switch-noscript">{noscript}</p>
                </noscript>
            ) : null}
        </>
    );
};

/**
 * A copy button's markup, named for what it copies. It is hidden until `attachCopyButton` from
 * `@jasonsdevspace/design-kit/controls` shows it, and its three words share one cell, so it keeps
 * the width of the longest whichever shows.
 */
export type CopyButtonProps = {
    /** What the button copies, read after Copy, such as "install command". */
    readonly name: string;
    /** A page's class, after the kit's. */
    readonly className?: string | undefined;
    /** The button drawn, for a page that hands it to its attach function. */
    readonly ref?: Ref<HTMLButtonElement> | undefined;
};

export const CopyButton = ({ name, className, ref }: CopyButtonProps) => (
    <button ref={ref} type="button" className={spaced('dk-button', 'dk-copy', className)} hidden>
        <span className="dk-copy-words">
            <span>Copy</span>
            <span aria-hidden="true">Copied</span>
            <span aria-hidden="true">Selected</span>
        </span>
        <span className="dk-visually-hidden"> {name}</span>
    </button>
);

/**
 * The line a screen reader hears a copy button's result on, out of sight. One is enough for a page,
 * and it is on the page from the start, since a line added at the moment it speaks may go unheard.
 */
export type CopyStatusProps = {
    /** A page's class, after the kit's. */
    readonly className?: string | undefined;
    /** The line drawn, for a page that hands it to a copy button's attach function. */
    readonly ref?: Ref<HTMLParagraphElement> | undefined;
};

export const CopyStatus = ({ className, ref }: CopyStatusProps = {}) => (
    <p ref={ref} className={spaced('dk-visually-hidden', className)} role="status" />
);
