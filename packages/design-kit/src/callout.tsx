import { type ComponentPropsWithRef, type ReactNode } from 'react';

import { filled, spaced } from './react-parts.js';

/*
 * The callout, a message in one of four tones with its heading, said as it arrives where a page
 * makes it live as a status or an alert.
 */

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

/** Whether a callout is live with nothing to say yet: no title, no message and no actions. */
const waitingFor = (live: CalloutProps['live'], holds: readonly boolean[]): boolean =>
    live !== undefined && !holds.includes(true);

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
    const acting = filled(actions);
    const waiting = waitingFor(live, [titled, said, acting]);
    return (
        // The page's own props first and the kit's after, as a button's are, so a role, a style,
        // inner HTML or a live region plain JavaScript passes never lands on the callout, whose
        // message takes its role from `live` alone.
        <div
            // A live callout with nothing to say yet is marked, so it is out of sight and out of
            // the flow in every browser the kit supports, and the mark goes once it has words. It
            // comes before the page's own props, so a page that marks it itself is left to.
            data-empty={waiting ? '' : undefined}
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
            {acting ? <div className="dk-callout-actions">{actions}</div> : null}
        </div>
    );
};
