import { type Ref } from 'react';

import { spaced } from './react-parts.js';

/*
 * The toast's markup, a message line with an action and a Close, apart from the other pieces so a
 * page that shows no toast sends none of it.
 */

/**
 * A toast's markup: the place its message is drawn, hidden from a screen reader, and the status
 * line it is said and read on, out of sight, both empty, and its action's button and close button,
 * hidden, in a group that keeps the two together where they wrap under the message. It draws
 * nothing until `attachToast` from `@jasonsdevspace/design-kit/controls` shows a message in it,
 * and showing one adds no element, since a status line added at the moment it speaks may go
 * unheard. One is enough for a page, or for an app's frame, in the frame's place for it.
 */
export type ToastProps = {
    /** A page's class, after the kit's. */
    readonly className?: string | undefined;
    /** The toast drawn, for a page that hands it to its attach function. */
    readonly ref?: Ref<HTMLDivElement> | undefined;
};

export const Toast = ({ className, ref }: ToastProps = {}) => (
    <div ref={ref} className={spaced('dk-toast', className)}>
        <p className="dk-toast-message" aria-hidden="true" />
        <p className="dk-visually-hidden dk-toast-status" role="status" />
        <div className="dk-toast-buttons">
            {/* A tabindex of their own lets Safari focus them on a press, so focus can go back. */}
            <button
                type="button"
                tabIndex={0}
                className="dk-button dk-button-text dk-toast-action"
                hidden
            />
            <button
                type="button"
                tabIndex={0}
                className="dk-button dk-button-text dk-button-quiet dk-toast-close"
                hidden
            >
                <span aria-hidden="true">×</span>
                <span className="dk-visually-hidden">Close</span>
            </button>
        </div>
    </div>
);
