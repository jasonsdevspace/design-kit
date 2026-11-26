import { useRef } from 'react';
import { createRoot } from 'react-dom/client';

import {
    attachDialog,
    attachForm,
    attachPanel,
    attachRoving,
    attachStepper,
    attachTable,
    attachToast,
    focusOnArrival,
    moveFocus,
} from '../src/controls.js';
import { useFocusAfterDraw } from '../src/react.js';

/*
 * The page focus-grid.spec.tsx draws: a place focus can be, built on request, and the pieces that
 * read focus, drawn in that place or on the page, from the source rather than the package. Each
 * place holds a button named `c`, where focus starts, and a field named `typed`. A place the page
 * cannot reach, a frame of another origin, holds them in a page the spec serves.
 */

/** Where a piece is drawn in a place, and what the place does as a square runs. */
type Place = {
    /** The document or shadow root that holds the place, or null where the page cannot reach it. */
    readonly root: Document | ShadowRoot | null;
    /** The element a piece is drawn into. */
    readonly holder: HTMLElement | null;
    /** Sends the place's frame on to its next page, which the spec holds loading. */
    readonly leave?: () => void;
};

/** The shadow roots closed to the page's script, by their hosts, for the spec to read focus in. */
const closedRoots = new WeakMap<Element, ShadowRoot>();

const loaded = (frame: HTMLIFrameElement): Promise<void> =>
    new Promise((done) => {
        frame.addEventListener(
            'load',
            () => {
                done();
            },
            { once: true }
        );
    });

/** A frame of the page's origin, written with the kit's sheet, appended to the parent given. */
const frameIn = async (parent: Node, name: string): Promise<HTMLIFrameElement> => {
    const frame = document.createElement('iframe');
    frame.name = name;
    frame.title = name;
    frame.srcdoc = `<!doctype html><html lang="en"><title>${name}</title><link rel="stylesheet" href="/kit.css"><body></body></html>`;
    const done = loaded(frame);
    bodyOf(parent).append(frame);
    await done;
    return frame;
};

/** The document a node belongs to, or the node itself where it is one, read across realms. */
const docOf = (node: Node): Document =>
    node.nodeType === Node.DOCUMENT_NODE ? (node as Document) : (node.ownerDocument as Document);

/** Where markup goes in a parent: a document's body, or the parent itself. */
const bodyOf = (parent: Node): ParentNode =>
    parent.nodeType === Node.DOCUMENT_NODE ? (parent as Document).body : (parent as ParentNode);

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
    const done = new Promise((ready) => {
        link.addEventListener('load', ready, { once: true });
    });
    root.append(link);
    await done;
    return root;
};

/** A holder with the button focus starts on, appended to the parent given. */
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
    for (;;) {
        try {
            const inner = outer[0]?.document;
            if (inner?.readyState === 'complete' && inner.title === 'Inner') return inner;
        } catch {
            // The inner frame still shows the outer frame's origin while it loads.
        }
        await new Promise((next) => setTimeout(next, 20));
    }
};

/** Builds the place a row names, from the page's #place. */
const build = async (row: string): Promise<Place> => {
    const spot = document.querySelector('#place') as HTMLElement;
    switch (row) {
        case 'page':
            return { root: document, holder: holderIn(spot) };
        case 'frame': {
            const frame = await frameIn(spot, 'f');
            const doc = frame.contentDocument as Document;
            return { root: doc, holder: holderIn(doc) };
        }
        case 'other': {
            const frame = document.createElement('iframe');
            frame.name = 'x';
            frame.title = 'x';
            frame.src = 'https://other.test/x';
            const done = loaded(frame);
            spot.append(frame);
            await done;
            return { root: null, holder: null };
        }
        case 'open':
        case 'closed': {
            const root = await shadowIn(spot, row);
            return { root, holder: holderIn(root) };
        }
        case 'frame in shadow': {
            const root = await shadowIn(spot, 'open');
            const frame = await frameIn(root, 'fs');
            const doc = frame.contentDocument as Document;
            return { root: doc, holder: holderIn(doc) };
        }
        case 'shadow in frame': {
            const frame = await frameIn(spot, 'sf');
            const root = await shadowIn(frame.contentDocument as Document, 'open');
            return { root, holder: holderIn(root) };
        }
        case 'ours in other': {
            const frame = document.createElement('iframe');
            frame.name = 'xo';
            frame.title = 'xo';
            frame.src = 'https://other.test/holder';
            spot.append(frame);
            const doc = await innerOf(frame.contentWindow as Window);
            return { root: doc, holder: holderIn(doc) };
        }
        case 'loading': {
            const frame = await frameIn(spot, 'fl');
            const doc = frame.contentDocument as Document;
            return {
                root: doc,
                holder: holderIn(doc),
                leave: () => {
                    (frame.contentWindow as Window).location.href = '/held';
                },
            };
        }
        default:
            throw new Error(`no place named ${row}`);
    }
};

let place: Place = { root: null, holder: null };
const controller = new AbortController();

/** Draws markup into the place's holder, or onto the page where the place cannot be reached. */
const draw = (markup: string): HTMLElement => {
    const holder = place.holder ?? document.getElementById('beside');
    if (!holder) throw new Error('the page has no room beside the place');
    holder.insertAdjacentHTML('beforeend', markup);
    return holder;
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

const show = attachToast(document.querySelector('.dk-toast') as HTMLElement);
const ask = attachDialog(document.querySelector('#ask') as HTMLDialogElement);

const grid = {
    build: async (row: string): Promise<void> => {
        place = await build(row);
    },
    leave: (): void => {
        place.leave?.();
    },
    /** The element named in the place, or on the page where the place cannot be reached. */
    named: (name: string): HTMLElement | null =>
        (place.holder ?? document).querySelector<HTMLElement>(`[data-name="${name}"]`),
    ask: (): void => {
        ask();
    },
    show: (): void => {
        show('Round 3 saved.', { label: 'Undo', onAction: () => undefined });
    },
    panel: (markup: string): void => {
        const holder = draw(markup);
        attachPanel(holder.querySelector('[data-name="opener"]') as HTMLButtonElement);
    },
    stepper: (markup: string): void => {
        const holder = draw(markup);
        const box = holder.querySelector('.dk-stepper') as HTMLElement;
        box.dataset.name = 'box';
        (box.querySelector('.dk-stepper-up') as HTMLElement).dataset.name = 'up';
        (box.querySelector('input') as HTMLElement).dataset.name = 'value';
        attachStepper(box, { signal: controller.signal });
    },
    readOnly: (): void => {
        (grid.named('value') as HTMLInputElement).readOnly = true;
    },
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
        const frame = holder.querySelector('.dk-table-scroll') as HTMLElement;
        attachTable(frame);
        frame.scrollLeft = frame.scrollWidth;
    },
    /** Whether the table's first link is clear of its pinned column. */
    whole: (): string => {
        const link = grid.named('first') as HTMLElement;
        const pinned = (link.closest('tr') as HTMLTableRowElement).cells[0] as HTMLElement;
        return link.getBoundingClientRect().left >= pinned.getBoundingClientRect().right - 1
            ? 'whole'
            : 'cut';
    },
    hooks: (): void => {
        const holder = draw('<div data-name="react"></div>');
        createRoot(holder.querySelector('[data-name="react"]') as HTMLElement).render(<Ask />);
    },
    moveFocus: (): void => {
        moveFocus('view');
    },
    arrive: (): void => {
        focusOnArrival('view', {});
    },
};

Object.assign(window, { grid, closedRoots });
