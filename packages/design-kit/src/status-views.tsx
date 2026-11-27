import { type ReactNode, type Ref, useId } from 'react';

import { filled, spaced } from './react-parts.js';

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
 * A status line, out of sight: what a screen reader hears a message on without focus moving, such
 * as a seat's new place or a copy button's result. One is enough for a screen, and it is on the
 * page from the start, prerender included, since a line added at the moment it speaks may go
 * unheard. `attachStatus` from `@jasonsdevspace/design-kit/controls` says messages on it.
 */
export type StatusLineProps = {
    /** A page's class, after the kit's. */
    readonly className?: string | undefined;
    /** The line drawn, for a page that hands it to `attachStatus` or a copy button's attach. */
    readonly ref?: Ref<HTMLParagraphElement> | undefined;
};

export const StatusLine = ({ className, ref }: StatusLineProps = {}) => (
    <p ref={ref} className={spaced('dk-visually-hidden', className)} role="status" />
);

/** The props of the status line, under the name a copy button's line was given first. */
export type CopyStatusProps = StatusLineProps;

/** The status line, under the name a copy button's line was given first, so no page breaks. */
export const CopyStatus = StatusLine;

/**
 * A progress bar's own props: what it measures, how far it has come and the words that say so. A
 * bar with an amount carries its words, since its track is too faint to tell how much is left by
 * color alone, and the words say it.
 */
export type ProgressProps = {
    /** What is progressing, such as "Importing products", which names the bar. */
    readonly label: ReactNode;
    /** The whole amount, 1 until a page gives another. */
    readonly max?: number | undefined;
    /** The bar's id, made with useId unless a page gives one, and what the words' id starts with. */
    readonly id?: string | undefined;
    /** A page's class, after the kit's, on the field that holds the bar. */
    readonly className?: string | undefined;
    /** The bar drawn, for a page that hands it to `useProgress` or `attachProgress`. */
    readonly ref?: Ref<HTMLProgressElement> | undefined;
} & (
    | {
          /** How far it has come, out of `max`. */
          readonly value: number;
          /** Words that say the amount, such as "12 of 40", drawn under the bar. */
          readonly words: ReactNode;
      }
    | {
          /** Left out while the amount is not yet known, which draws an empty track. */
          readonly value?: undefined;
          readonly words?: ReactNode;
      }
);

/**
 * Progress with a known amount: its label, the native bar and the words that say the amount, which
 * describe the bar, so a screen reader reads the label, the amount in hundredths and then the
 * words. A bar with no value draws an empty track, for an amount not yet known.
 */
export const Progress = ({ label, value, max, words, id, className, ref }: ProgressProps) => {
    const made = useId();
    const bar = id ?? made;
    const said = filled(words);
    return (
        <div className={spaced('dk-field', className)}>
            <label className="dk-field-label" htmlFor={bar}>
                {label}
            </label>
            <progress
                ref={ref}
                id={bar}
                className="dk-progress"
                value={value}
                max={max}
                aria-describedby={said ? `${bar}-words` : undefined}
            />
            {said ? (
                <p className="dk-field-hint" id={`${bar}-words`}>
                    {words}
                </p>
            ) : null}
        </div>
    );
};
