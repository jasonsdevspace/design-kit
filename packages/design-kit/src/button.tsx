import { type ComponentPropsWithRef } from 'react';

import { spaced } from './react-parts.js';

type NativeButton = Omit<
    ComponentPropsWithRef<'button'>,
    'style' | 'disabled' | 'aria-disabled' | 'aria-pressed'
>;

/**
 * A button's own props: the accent for the one action a view leads with, `large` for a bigger
 * target, `tall` for the larger target what a screen is for takes, `icon` for a face that is an
 * icon alone, `text` for a button drawn as a link, `quiet` beside it for a Close, `pressed` for a
 * toggle that stands alone, and `off`, beside a `<button>`'s own, its `ref` among them, which
 * holds the button drawn for a page that moves focus to it. The accent is never a toggle and never
 * a text button, a text button is never a toggle, never large, never tall and never an icon, and a
 * quiet one is never off, so none of those go together.
 */
export type ButtonProps = NativeButton & {
    /** Off, but still in the tab order, so a keyboard keeps its place and finds out why. */
    readonly off?: boolean | undefined;
    /**
     * Busy while what its press started runs, such as a save: off at once, drawn off only once the
     * wait outlasts --dk-wait, then with a row of dots that shows it at work, and said by
     * `attachBusy` or `useBusy` in the words given, or "Saving." where it is just true.
     */
    readonly busy?: boolean | string | undefined;
} & (
        | {
              /** The one action a view leads with, filled in the accent. */
              readonly accent?: boolean | undefined;
              readonly pressed?: undefined;
              readonly text?: false | undefined;
              readonly quiet?: undefined;
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
              /**
               * A face that is an icon alone, its icon drawn at 1.25rem so it reads in the
               * square, with the button's name in words out of sight beside it.
               */
              readonly icon?: boolean | undefined;
          }
        | {
              readonly accent?: false | undefined;
              /** Whether the toggle is on. False still marks it a toggle, undefined an action. */
              readonly pressed?: boolean | undefined;
              readonly text?: false | undefined;
              readonly quiet?: undefined;
              readonly large?: boolean | undefined;
              readonly tall?: boolean | undefined;
              readonly icon?: boolean | undefined;
          }
        | {
              readonly accent?: false | undefined;
              readonly pressed?: undefined;
              /**
               * Drawn as a link, with no edge and no inline padding, in the accent and underlined.
               */
              readonly text: true;
              readonly quiet?: false | undefined;
              readonly large?: undefined;
              readonly tall?: undefined;
              readonly icon?: undefined;
          }
        | {
              readonly accent?: false | undefined;
              readonly pressed?: undefined;
              readonly text: true;
              /**
               * Quiet, for a Close at a panel's corner: muted with no underline. With no children
               * it draws a × hidden from a screen reader beside Close out of sight. A Close always
               * closes, so a quiet button is never off.
               */
              readonly quiet: true;
              readonly off?: false | undefined;
              readonly large?: undefined;
              readonly tall?: undefined;
              readonly icon?: undefined;
          }
    );

/** The words a busy button is said with, empty for the default, or nothing where it is not busy. */
const busyWords = (busy: ButtonProps['busy']): string | null =>
    busy === true ? '' : typeof busy === 'string' ? busy : null;

/**
 * A button, of type button unless a page gives another, so it never submits a form by surprise.
 * Off, it is marked aria-disabled rather than disabled, since a disabled button that has focus
 * drops it, and a press of it runs no click handler of the page's and stops the form it would
 * submit. The page's other handlers, for keys or a pointer, still run, and check `off` themselves.
 * Busy, it is off in the same way, and marked `data-busy` with the words `attachBusy` says.
 */
export const Button = ({
    accent,
    large,
    tall,
    icon,
    text,
    quiet,
    pressed,
    off = false,
    busy,
    type = 'button',
    className,
    onClick,
    children,
    ...native
}: ButtonProps) => {
    const words = busyWords(busy);
    // Off or busy, a press does nothing.
    const stopped = off || words !== null;
    return (
        <button
            {...native}
            type={type}
            className={spaced(
                'dk-button',
                accent === true && 'dk-button-accent',
                large === true && 'dk-button-large',
                tall === true && 'dk-button-tall',
                icon === true && 'dk-button-icon',
                text === true && 'dk-button-text',
                quiet === true && 'dk-button-quiet',
                className
            )}
            aria-pressed={pressed}
            aria-disabled={stopped ? true : undefined}
            data-busy={words ?? undefined}
            onClick={
                stopped
                    ? (event) => {
                          event.preventDefault();
                      }
                    : onClick
            }
        >
            {children ??
                (quiet === true ? (
                    <>
                        <span aria-hidden="true">×</span>
                        <span className="dk-visually-hidden">Close</span>
                    </>
                ) : null)}
        </button>
    );
};
