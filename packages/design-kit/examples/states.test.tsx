import { readFileSync } from 'node:fs';

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import * as kit from '../src/react.js';
import { CONTROLS } from './states.js';

/*
 * The states a page shows, drawn from the kit's sources: each one draws the attribute the page
 * prints under it, and the module takes its components rather than importing them, so a page can
 * draw the states from the version of the kit it pins.
 */

const states = CONTROLS.flatMap((control) => control.states);

describe('the states of the controls', () => {
    it('each draw the attribute printed under them', () => {
        expect(states.length).toBeGreaterThan(0);
        for (const state of states) {
            const markup = renderToStaticMarkup(state.draw(kit, (name) => name));
            // An attribute with a value is found whole, its closing quote included, and one with
            // none by its own name, not as the end of another such as aria-disabled.
            const drawn = state.attribute.includes('=')
                ? markup.includes(` ${state.attribute}`)
                : new RegExp(`(?<![-\\w])${state.attribute}(=""|[\\s/>])`).test(markup);
            expect(drawn, `${state.name}: ${state.attribute}`).toBe(true);
        }
    });

    it('give each copy ids of its own', () => {
        for (const state of states) {
            const ids = (draw: string) =>
                [...draw.matchAll(/ id="([^"]+)"/g)].map((match) => match[1] ?? '');
            const one = ids(renderToStaticMarkup(state.draw(kit, (name) => name)));
            const other = ids(renderToStaticMarkup(state.draw(kit, (name) => `${name}-other`)));
            expect(
                one.filter((id) => other.includes(id)),
                state.name
            ).toEqual([]);
        }
    });

    it('import nothing of the kit but its types', () => {
        const source = readFileSync(new URL('states.tsx', import.meta.url), 'utf8');
        // Every import, however it is wrapped: React's types, and the kit's by any path or name.
        const imports = [...source.matchAll(/^import\s+([\s\S]*?)\s+from\s+'([^']+)';/gm)];
        const fromKit = imports.filter(([, , from]) => from !== 'react');
        expect(fromKit.length).toBeGreaterThan(0);
        expect(fromKit.filter(([, what]) => !what?.startsWith('type '))).toEqual([]);
    });
});
