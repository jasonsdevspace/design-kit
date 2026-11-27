import {
    Children,
    type ComponentPropsWithRef,
    Fragment,
    isValidElement,
    type ReactNode,
} from 'react';

/*
 * The parts every markup component uses: whether a slot holds something to draw, a list of names an
 * attribute holds, and the label a choice and the theme switch share.
 */

/**
 * Whether a slot holds something to draw: a demo's `cond && <X />` leaves false or null, an empty
 * string draws nothing either, and nor does a list or a fragment of only those. Every slot a
 * component leaves out when it is empty is read the same way. A number draws, 0 included, as React
 * draws it, so a page that writes `count && <X />` writes `count > 0 && <X />` instead.
 */
export const filled = (node: ReactNode): boolean =>
    Children.toArray(node).some((child) =>
        isValidElement<{ readonly children?: ReactNode }>(child) && child.type === Fragment
            ? filled(child.props.children)
            : child !== ''
    );

/**
 * A list of names an attribute holds, such as the classes a component draws, its own first and a
 * page's after them, or the ids that describe a control, with any left out or empty dropped.
 */
export const spaced = (...names: readonly (string | false | undefined)[]): string =>
    names.filter((name) => typeof name === 'string' && name !== '').join(' ');

/**
 * One choice among a set: a label holding a native radio or checkbox and its word, with a gloss
 * after the word when it has one. The theme switch's choices are drawn by it too, under their own
 * class, so the two cannot drift apart.
 */
export const ChoiceLabel = ({
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
