import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
    attachDialog,
    attachForm,
    attachPanel,
    attachRoving,
    attachStepper,
    attachTable,
    attachThemeSwitch,
    attachToast,
    focusOnArrival,
    moveFocus,
} from '../src/controls.js';
import { useArrivalFocus, useFocusAfterDraw, useFormRefusal, useRoving } from '../src/react.js';

/*
 * The page focus-grid.spec.tsx draws: a place focus can be, built on request, and the pieces that
 * read focus, drawn in that place or on the page, from the source rather than the package. Each
 * place holds a button named `c` and a field named `typed`. A place the page cannot reach, a frame
 * of another origin, holds them in a page the spec serves.
 */

/** Where a piece is drawn in a place, and what the place does as a square runs. */
type Place = {
    /** The element a piece is drawn into, or null where the page cannot reach the place. */
    readonly holder: HTMLElement | null;
    /** Sends the place's frame on to its next page, and resolves once the frame is where it goes. */
    readonly leave?: () => Promise<void>;
};

/** The shadow roots closed to the page's script, by their hosts, for the spec to read focus in. */
const closedRoots = new WeakMap<Element, ShadowRoot>();

/** How long a place has to load before its square fails, naming what it waited for. */
const PATIENCE = 10_000;

/**
 * Waits for an element's load, and fails with the name given on an error or past the patience. A
 * stylesheet's link fires an error where its sheet fails, while a frame fires load for a page that
 * failed too, so a frame's failure shows in what waits on its page.
 */
const loadOf = (target: EventTarget, name: string): Promise<void> =>
    new Promise((done, fail) => {
        const timer = setTimeout(() => {
            fail(new Error(`${name} did not load`));
        }, PATIENCE);
        target.addEventListener(
            'load',
            () => {
                clearTimeout(timer);
                done();
            },
            { once: true }
        );
        target.addEventListener(
            'error',
            () => {
                clearTimeout(timer);
                fail(new Error(`${name} failed to load`));
            },
            { once: true }
        );
    });

/** The document a node belongs to, or the node itself where it is one, read across realms. */
const docOf = (node: Node): Document =>
    node.nodeType === Node.DOCUMENT_NODE ? (node as Document) : (node.ownerDocument as Document);

/** Where markup goes in a parent: a document's body, or the parent itself. */
const bodyOf = (parent: Node): ParentNode =>
    parent.nodeType === Node.DOCUMENT_NODE ? (parent as Document).body : (parent as ParentNode);

/** A frame of the page's origin, written with the kit's sheet, appended to the parent given. */
const frameIn = async (parent: Node, name: string): Promise<HTMLIFrameElement> => {
    const frame = document.createElement('iframe');
    frame.name = name;
    frame.title = name;
    frame.srcdoc = `<!doctype html><html lang="en"><title>${name}</title><link rel="stylesheet" href="/kit.css"><body></body></html>`;
    const done = loadOf(frame, `the frame ${name}`);
    bodyOf(parent).append(frame);
    await done;
    return frame;
};

/** A host holding a shadow root with the kit's sheet, appended to the parent given. */
const shadowIn = async (parent: Node, mode: ShadowRootMode): Promise<ShadowRoot> => {
    const doc = docOf(parent);
    const host = doc.createElement('div');
    host.id = 'host';
    bodyOf(parent).append(host);
    const root = host.attachShadow({ mode });
    if (mode === 'closed') closedRoots.set(host, root);
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/kit.css';
    const done = loadOf(link, `the ${mode} shadow root's sheet`);
    root.append(link);
    await done;
    return root;
};

/** A holder with a button and a field, appended to the parent given. */
const holderIn = (parent: Node): HTMLElement => {
    const holder = docOf(parent).createElement('div');
    holder.className = 'holder';
    holder.innerHTML =
        '<button type="button" data-name="c">Here</button><input data-name="typed" aria-label="Typed">';
    bodyOf(parent).append(holder);
    return holder;
};

/** Waits until a frame of the page's origin inside one of another origin has loaded its page. */
const innerOf = async (outer: Window): Promise<Document> => {
    const until = Date.now() + PATIENCE;
    while (Date.now() < until) {
        try {
            const inner = outer[0]?.document;
            if (inner?.readyState === 'complete' && inner.title === 'Inner') return inner;
        } catch {
            // The inner frame still shows the outer frame's origin while it loads.
        }
        await new Promise((next) => setTimeout(next, 20));
    }
    throw new Error("the frame of the page's origin inside one of another origin did not load");
};

/** A frame of the page's origin whose next page is the address given, sent there by `leave`. */
const leaving = async (spot: HTMLElement, name: string, next: string, arrives: boolean) => {
    const frame = await frameIn(spot, name);
    const doc = frame.contentDocument as Document;
    return {
        holder: holderIn(doc),
        leave: async () => {
            const done = arrives ? loadOf(frame, `the frame ${name}'s next page`) : undefined;
            (frame.contentWindow as Window).location.href = next;
            await done;
        },
    };
};

/** Builds the place a row names, from the page's #place. */
const build = async (row: string): Promise<Place> => {
    const spot = document.querySelector('#place') as HTMLElement;
    switch (row) {
        case 'page':
            return { holder: holderIn(spot) };
        case 'frame':
            return { holder: holderIn((await frameIn(spot, 'f')).contentDocument as Document) };
        case 'other': {
            const frame = document.createElement('iframe');
            frame.name = 'x';
            frame.title = 'x';
            frame.src = 'https://other.test/x';
            const done = loadOf(frame, 'the frame of another origin');
            spot.append(frame);
            await done;
            return { holder: null };
        }
        case 'open':
        case 'closed':
            return { holder: holderIn(await shadowIn(spot, row)) };
        case 'frame in shadow': {
            const frame = await frameIn(await shadowIn(spot, 'open'), 'fs');
            return { holder: holderIn(frame.contentDocument as Document) };
        }
        case 'shadow in frame': {
            const frame = await frameIn(spot, 'sf');
            return { holder: holderIn(await shadowIn(frame.contentDocument as Document, 'open')) };
        }
        case 'ours in other': {
            const frame = document.createElement('iframe');
            frame.name = 'xo';
            frame.title = 'xo';
            frame.src = 'https://other.test/holder';
            // The kit hears the inner frame at the outer frame's load, which can come after the inner
            // frame's page is complete, so the place is built once both have happened.
            const done = loadOf(frame, 'the frame of another origin');
            spot.append(frame);
            const [inner] = await Promise.all([innerOf(frame.contentWindow as Window), done]);
            return { holder: holderIn(inner) };
        }
        case 'loading':
            return leaving(spot, 'fl', '/held', false);
        case 'arrived':
            return leaving(spot, 'fa', '/next', true);
        case 'removed': {
            const frame = await frameIn(spot, 'fr');
            return {
                holder: holderIn(frame.contentDocument as Document),
                leave: () => {
                    frame.remove();
                    return Promise.resolve();
                },
            };
        }
        default:
            throw new Error(`no place named ${row}`);
    }
};

let place: Place = { holder: null };
const controller = new AbortController();

/** Draws markup into the place's holder. */
const draw = (markup: string): HTMLElement => {
    const { holder } = place;
    if (!holder) throw new Error('the page cannot draw in this place');
    holder.insertAdjacentHTML('beforeend', markup);
    return holder;
};

/** Renders a component into the place's holder. */
const render = (element: React.ReactNode): void => {
    const holder = draw('<div data-name="react"></div>');
    createRoot(holder.querySelector('[data-name="react"]') as HTMLElement).render(element);
};

/** A button that asks for focus on another after the render its press brings. */
const Ask = () => {
    const target = useRef<HTMLButtonElement>(null);
    const focusAfterDraw = useFocusAfterDraw();
    return (
        <>
            <button
                type="button"
                data-name="ask"
                onClick={() => {
                    if (target.current) focusAfterDraw(target.current);
                }}
            >
                Ask
            </button>
            <button type="button" data-name="target" ref={target}>
                Target
            </button>
        </>
    );
};

/** A view whose heading takes focus as a press brings the next round. */
const Round = () => {
    const [round, setRound] = useState(1);
    const heading = useArrivalFocus<HTMLHeadingElement>(round);
    return (
        <>
            <button
                type="button"
                data-name="next"
                onClick={() => {
                    setRound(round + 1);
                }}
            >
                Next round
            </button>
            <h3 data-name="heading" ref={heading}>
                Round {round}
            </h3>
        </>
    );
};

/** A form whose refused submit focuses its field in error. */
const Seat = () => {
    const [error, setError] = useState('');
    const [form] = useFormRefusal<HTMLFormElement>({
        say: () => undefined,
        invalid: () => {
            setError('Enter a seat.');
        },
    });
    return (
        <form ref={form} noValidate>
            <label htmlFor="seat">Seat</label>
            <input
                id="seat"
                data-name="field"
                required
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'seat-error' : undefined}
            />
            {error ? <p id="seat-error">{error}</p> : null}
            <button type="submit" data-name="save">
                Save
            </button>
        </form>
    );
};

/** A row of cells the arrows move along. */
const Cells = () => (
    <div data-name="cells" role="group" aria-label="Cells" ref={useRoving<HTMLDivElement>()}>
        <button type="button" data-name="one">
            1
        </button>
        <button type="button" data-name="two">
            2
        </button>
        <button type="button" data-name="three">
            3
        </button>
    </div>
);

const show = attachToast(document.querySelector('.dk-toast') as HTMLElement);
const ask = attachDialog(document.querySelector('#ask') as HTMLDialogElement);

/** The element named in the place. */
const named = (name: string): HTMLElement => {
    const found = place.holder?.querySelector<HTMLElement>(`[data-name="${name}"]`);
    if (!found) throw new Error(`nothing named ${name} in the place`);
    return found;
};

const grid = {
    build: async (row: string): Promise<void> => {
        place = await build(row);
    },
    leave: async (): Promise<void> => {
        await place.leave?.();
    },
    named,
    /** Takes the element named from the place, as a page removes a control. */
    remove: (name: string): void => {
        named(name).remove();
    },
    /** Whether the element named is drawn in the place yet. */
    has: (name: string): boolean => place.holder?.querySelector(`[data-name="${name}"]`) !== null,
    /** Opens the page's dialog from the field in the place, or from nothing where it is out of reach. */
    ask: (): void => {
        if (place.holder) ask(named('typed'));
        else ask();
    },
    show: (): void => {
        show('Round 3 saved.', { label: 'Undo', onAction: () => undefined });
    },
    panel: (markup: string): void => {
        const holder = draw(markup);
        attachPanel(holder.querySelector('[data-name="opener"]') as HTMLButtonElement);
    },
    /** Whether the panel opened. */
    opened: (): boolean => place.holder?.querySelector<HTMLElement>('#tips')?.hidden === false,
    stepper: (markup: string): void => {
        const holder = draw(markup);
        const box = holder.querySelector('.dk-stepper') as HTMLElement;
        box.dataset.name = 'box';
        (box.querySelector('.dk-stepper-up') as HTMLElement).dataset.name = 'up';
        (box.querySelector('.dk-stepper-down') as HTMLElement).dataset.name = 'down';
        (box.querySelector('input') as HTMLElement).dataset.name = 'value';
        attachStepper(box, { signal: controller.signal });
    },
    readOnly: (): void => {
        (named('value') as HTMLInputElement).readOnly = true;
    },
    /** How the stepper's buttons stand: whether the raising one is marked off and the other hidden. */
    marks: (): string =>
        `${named('up').getAttribute('aria-disabled') === 'true' ? 'marked' : 'unmarked'}, ` +
        `down ${named('down').hidden ? 'hidden' : 'shown'}`,
    takeDown: (): void => {
        controller.abort();
    },
    form: (markup: string): void => {
        const holder = draw(markup);
        (holder.querySelector('form input') as HTMLElement).dataset.name = 'field';
        attachForm(holder.querySelector('form') as HTMLFormElement, {
            status: document.querySelector<HTMLElement>('.line'),
        });
    },
    cells: (markup: string): void => {
        const holder = draw(markup);
        attachRoving(holder.querySelector('[data-name="cells"]') as HTMLElement);
    },
    table: (markup: string): void => {
        const holder = draw(markup);
        attachTable(holder.querySelector('.dk-table-scroll') as HTMLElement);
    },
    /**
     * Scrolls the table's frame so the link named shows a few pixels past the pinned column, the
     * rest of it under the column, where the frame's scroll padding is narrower than the column.
     */
    cut: (name: string): void => {
        const link = named(name);
        const frame = link.closest('.dk-table-scroll') as HTMLElement;
        const pinned = (link.closest('tr') as HTMLTableRowElement).cells[0] as HTMLElement;
        frame.scrollLeft +=
            link.getBoundingClientRect().right - (pinned.getBoundingClientRect().right + 6);
    },
    /** Whether the link named is clear of its table's pinned column. */
    whole: (name: string): string => {
        const link = named(name);
        const pinned = (link.closest('tr') as HTMLTableRowElement).cells[0] as HTMLElement;
        return link.getBoundingClientRect().left >= pinned.getBoundingClientRect().right - 1
            ? 'whole'
            : 'cut';
    },
    theme: (markup: string): void => {
        const holder = draw(markup);
        const element = holder.querySelector('.dk-theme-switch') as HTMLElement;
        (element.querySelector('button') as HTMLElement).dataset.name = 'switch';
        (element.querySelector('input[value="light"]') as HTMLElement).dataset.name = 'light';
        (element.querySelector('input[value="system"]') as HTMLElement).dataset.name = 'system';
        attachThemeSwitch(element);
    },
    hooks: (): void => {
        render(<Ask />);
    },
    round: (): void => {
        render(<Round />);
    },
    seat: (): void => {
        render(<Seat />);
    },
    roving: (): void => {
        render(<Cells />);
    },
    moveFocus: (): void => {
        moveFocus('view');
    },
    arrive: (): void => {
        focusOnArrival('view', {});
    },
    /** The point at the middle of the element named, scrolled into view, for a press there. */
    point: (name: string): { readonly x: number; readonly y: number } => {
        const element = named(name);
        element.scrollIntoView({ block: 'center' });
        const { left, top, width, height } = element.getBoundingClientRect();
        return { x: left + width / 2, y: top + height / 2 };
    },
};

Object.assign(window, { grid, closedRoots });
