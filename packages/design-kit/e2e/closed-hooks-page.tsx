import { type ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { useArrivalFocus, useFocusAfterDraw, useFormRefusal } from '../src/react.js';

/*
 * The page shadow.spec.ts draws for the React hooks inside a closed shadow root, from the source
 * rather than the package: a component that asks for focus on its target, by one button with
 * nothing more and by another that then moves focus to a second button before the request lands,
 * as a visitor who moves on would, and a round whose heading takes focus as its key changes, by
 * one button with nothing more and by another after which focus moves on once the round is drawn,
 * and a view a press brings, drawn for the first time, whose heading takes focus unless the visitor
 * moves on once it is drawn or the view focuses a field of its own above or below its heading. The
 * round's heading is drawn in the root as the page loads, so the kit hears presses there from the
 * first. A second widget holds the view alone, so the first press in it reaches the kit as one on
 * its host. A third widget, in an open shadow root, holds a form whose submit brings the view, so a
 * submit inside an open root, which never leaves it, can be seen to count as a press, and the closed
 * widget holds the same form in an open root of its own. Where the page asks for them, a fourth
 * widget's field takes focus as it draws and sends its form itself once a code is filled in, as a
 * phone fills one, a root the page wrote has a field focused before the kit loaded, a frame the page
 * wrote has one too, and a fifth widget's heading, which the kit reads focus through, sits beside a
 * form a script submits. The closed widget holds two refusal forms side by side.
 */

const Ask = () => {
    const target = useRef<HTMLButtonElement>(null);
    const second = useRef<HTMLButtonElement>(null);
    const focusAfterDraw = useFocusAfterDraw();
    return (
        <>
            <button
                type="button"
                id="ask-only"
                onClick={() => {
                    if (target.current) focusAfterDraw(target.current);
                }}
            >
                Ask
            </button>
            <button
                type="button"
                id="ask"
                onClick={() => {
                    if (target.current) focusAfterDraw(target.current);
                    second.current?.focus();
                }}
            >
                Ask and move on
            </button>
            <button type="button" id="second" ref={second}>
                Second
            </button>
            <button type="button" id="target" ref={target}>
                Target
            </button>
        </>
    );
};

const Round = () => {
    const [round, setRound] = useState(1);
    const [moving, setMoving] = useState(false);
    const heading = useArrivalFocus<HTMLHeadingElement>(round);
    const other = useRef<HTMLButtonElement>(null);
    // The visitor moves on once the new round is drawn, after the hook read where focus was and
    // before its heading takes focus.
    useLayoutEffect(() => {
        if (moving) other.current?.focus();
    }, [moving, round]);
    return (
        <>
            <button
                type="button"
                id="next-only"
                onClick={() => {
                    setRound(round + 1);
                    setMoving(false);
                }}
            >
                Next round
            </button>
            <button
                type="button"
                id="next"
                onClick={() => {
                    setRound(round + 1);
                    setMoving(true);
                }}
            >
                Next round and move on
            </button>
            <button type="button" id="other" ref={other}>
                Other
            </button>
            <h2 id="heading" ref={heading}>
                Round {round}
            </h2>
        </>
    );
};

/**
 * How the view a press brings is drawn: plain, with the visitor moving on, or with a field of its
 * own.
 */
type ViewKind = 'only' | 'move' | 'field-above' | 'field-below';

/** A view drawn for the first time, whose heading takes focus as it arrives by a press. */
const View = ({ kind, other }: { kind: ViewKind; other: HTMLButtonElement | null }) => {
    const heading = useArrivalFocus<HTMLHeadingElement>('view');
    // The visitor moves on once the view is drawn, after the hook read where focus was and before
    // its heading takes focus.
    useLayoutEffect(() => {
        if (kind === 'move') other?.focus();
    }, [kind, other]);
    const field = <input id="view-field" aria-label="Name" autoFocus />;
    return (
        <section aria-label="View">
            {kind === 'field-above' ? field : null}
            <h2 id="view-heading" ref={heading}>
                The view
            </h2>
            {kind === 'field-below' ? field : null}
        </section>
    );
};

/** Buttons that each bring the view, drawn for the first time, and a control to move on to. */
const Opener = () => {
    const [kind, setKind] = useState<ViewKind | null>(null);
    const [other, setOther] = useState<HTMLButtonElement | null>(null);
    return (
        <>
            <button
                type="button"
                id="open-later"
                onClick={() => {
                    // Drawn a moment after the press, as a view a load brings is, so an input in
                    // between counts.
                    window.setTimeout(() => {
                        setKind('only');
                    }, 300);
                }}
            >
                Open the view a moment later
            </button>
            <p id="view-note">Nothing to press here.</p>
            {(['only', 'move', 'field-above', 'field-below'] as const).map((each) => (
                <button
                    key={each}
                    type="button"
                    id={`open-${each}`}
                    onClick={() => {
                        setKind(each);
                    }}
                >
                    Open the view, {each}
                </button>
            ))}
            <button type="button" id="view-other" ref={setOther}>
                Elsewhere
            </button>
            {kind === null ? null : <View key={kind} kind={kind} other={other} />}
        </>
    );
};

/**
 * A form whose fields' own failed submit focuses the first in error, and whose page refusal, asked
 * by a button that then moves focus to another field once the errors are drawn, leaves it there.
 */
const Seat = () => {
    const [error, setError] = useState(false);
    const [moving, setMoving] = useState(false);
    const other = useRef<HTMLInputElement>(null);
    const [form, refuse] = useFormRefusal<HTMLFormElement>({
        say: () => undefined,
        invalid: () => {
            setError(true);
            const counts = window as unknown as { seatRefused?: number };
            counts.seatRefused = (counts.seatRefused ?? 0) + 1;
        },
    });
    useLayoutEffect(() => {
        if (moving) other.current?.focus();
    }, [moving, error]);
    return (
        <form ref={form} noValidate>
            <input id="name" aria-label="Name" defaultValue="Ann" />
            <input id="seat" aria-label="Seat" required aria-invalid={error ? true : undefined} />
            <input id="other-field" aria-label="Other" ref={other} />
            <button type="submit">Save</button>
            <button
                type="button"
                id="refuse-move"
                onClick={() => {
                    setError(true);
                    refuse();
                    setMoving(true);
                }}
            >
                Refuse and move on
            </button>
        </form>
    );
};

/**
 * A second form beside the first, whose own failed submit focuses its own first field in error and
 * counts its own refusals, so each form is refused for its own submit alone.
 */
const Score = () => {
    const [error, setError] = useState(false);
    const [form] = useFormRefusal<HTMLFormElement>({
        say: () => undefined,
        invalid: () => {
            setError(true);
            const counts = window as unknown as { scoreRefused?: number };
            counts.scoreRefused = (counts.scoreRefused ?? 0) + 1;
        },
    });
    return (
        <form ref={form} noValidate>
            <input id="score-name" aria-label="Player" defaultValue="Bo" />
            <input id="score" aria-label="Score" required aria-invalid={error ? true : undefined} />
            <button type="submit">Save the score</button>
        </form>
    );
};

/** Rows that each remove themselves and ask for focus on the next. */
const Rows = () => {
    const [rows, setRows] = useState(['one', 'two', 'three']);
    const buttons = useRef(new Map<string, HTMLButtonElement>());
    const focusAfterDraw = useFocusAfterDraw();
    return (
        <ul>
            {rows.map((row, index) => (
                <li key={row}>
                    <button
                        type="button"
                        id={`remove-${row}`}
                        ref={(button) => {
                            if (button) buttons.current.set(row, button);
                            else buttons.current.delete(row);
                        }}
                        onClick={() => {
                            const next = rows[index + 1];
                            if (next) focusAfterDraw(buttons.current.get(next) ?? null);
                            setRows(rows.filter((each) => each !== row));
                        }}
                    >
                        Remove {row}
                    </button>
                </li>
            ))}
        </ul>
    );
};

/** A form whose every submit brings the view, drawn afresh. */
const SubmitOpener = () => {
    const [sent, setSent] = useState(0);
    return (
        <>
            <p id="open-note">Search the games.</p>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    setSent((count) => count + 1);
                }}
            >
                <input id="search" aria-label="Search" />
                <button type="submit" id="send">
                    Search
                </button>
            </form>
            {sent > 0 ? <View key={sent} kind="only" other={null} /> : null}
        </>
    );
};

/** A second view, with a heading of its own, drawn for the first time. */
const Second = () => {
    const heading = useArrivalFocus<HTMLHeadingElement>('second');
    return (
        <section aria-label="Second view">
            <h2 id="second-heading" ref={heading}>
                The second view
            </h2>
        </section>
    );
};

/**
 * A heading drawn as the page loads, which the kit reads focus through, and a form a script
 * submits to bring a second view, with no focus, key or click in the root.
 */
const ReadOpener = () => {
    const heading = useArrivalFocus<HTMLHeadingElement>('read');
    const [shown, setShown] = useState(false);
    return (
        <>
            <h2 id="read-heading" ref={heading}>
                Results
            </h2>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    setShown(true);
                }}
            >
                <input id="read-search" aria-label="Search" />
            </form>
            {shown ? <Second /> : null}
        </>
    );
};

/**
 * A field for a code that takes focus as it draws and sends its form itself once the code is
 * whole, with no key or click, as a field a phone fills does.
 */
const CodeOpener = () => {
    const [shown, setShown] = useState(false);
    return (
        <>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    setShown(true);
                }}
            >
                <input
                    id="code"
                    aria-label="Code"
                    autoFocus
                    onInput={(event) => {
                        if (event.currentTarget.value.length === 4)
                            event.currentTarget.form?.requestSubmit();
                    }}
                />
            </form>
            {shown ? <View kind="only" other={null} /> : null}
        </>
    );
};

/** Draws a component into a new open shadow root on the host given, and hands back the root. */
const drawOpen = (host: Element, element: ReactNode): ShadowRoot => {
    const shadow = host.attachShadow({ mode: 'open' });
    const inner = document.createElement('div');
    shadow.append(inner);
    createRoot(inner).render(element);
    return shadow;
};

const root = (document.querySelector('#widget') as HTMLElement).attachShadow({ mode: 'closed' });
const holder = document.createElement('div');
root.append(holder);
const nestedHost = document.createElement('div');
root.append(nestedHost);
createRoot(holder).render(
    <>
        <Ask />
        <Round />
        <Opener />
        <Seat />
        <Score />
        <Rows />
    </>
);
// An open root inside the closed one, holding the form, which the page never sees into.
const nested = drawOpen(nestedHost, <SubmitOpener />);
// A widget the kit is handed no node of before its first press.
const fresh = (document.querySelector('#fresh') as HTMLElement).attachShadow({ mode: 'closed' });
const freshHolder = document.createElement('div');
fresh.append(freshHolder);
createRoot(freshHolder).render(<Opener />);
// A widget in an open shadow root, whose form the kit is handed no node of before its submit.
const open = drawOpen(document.querySelector('#open') as HTMLElement, <SubmitOpener />);
// The widget whose field takes focus as it draws, where the page asks for it.
const autoHost = document.querySelector('#auto');
const auto = autoHost ? drawOpen(autoHost, <CodeOpener />) : null;
// The widget whose heading the kit reads focus through, where the page asks for it.
const readHost = document.querySelector('#read');
const read = readHost ? drawOpen(readHost, <ReadOpener />) : null;
// A frame the page wrote, whose open root's field had focus before the kit loaded.
const frameRoot =
    document.querySelector<HTMLIFrameElement>('#frame-early')?.contentDocument?.getElementById('h')
        ?.shadowRoot ?? null;
const frameHolder = frameRoot?.getElementById('frame-holder');
if (frameRoot && frameHolder) {
    const view = createRoot(frameHolder);
    frameRoot.querySelector('form')?.addEventListener('submit', (event) => {
        event.preventDefault();
        view.render(<View kind="only" other={null} />);
    });
}
// A root the page wrote, whose field had focus before the kit loaded, and whose form brings the view.
const early = document.querySelector('#early')?.shadowRoot ?? null;
const earlyHolder = early?.getElementById('early-holder');
if (early && earlyHolder) {
    const view = createRoot(earlyHolder);
    early.querySelector('form')?.addEventListener('submit', (event) => {
        event.preventDefault();
        view.render(<View kind="only" other={null} />);
    });
}
Object.assign(window, {
    closedRoot: root,
    freshRoot: fresh,
    openRoot: open,
    nestedRoot: nested,
    autoRoot: auto,
    earlyRoot: early,
    readRoot: read,
    frameRoot,
    ready: true,
});
