import * as kit from 'design-kit-release/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { elementOf } from '../../design-kit/examples/elements.js';
import { APP, CHROME } from '../../design-kit/examples/pieces.js';
import { CONTROLS } from '../../design-kit/examples/states.js';

/*
 * The React the site shows beside each state, held to the version of the kit the site pins, since
 * the site shows it beside the markup that version draws. The kit's own test holds the same React
 * to its sources, so a change in the sources before a release fails one of the two.
 */

const shown = [...CONTROLS, ...APP, ...CHROME]
    .flatMap((control) => control.states)
    .filter((state) => state.react !== undefined);

describe('the React each state shows', () => {
    it('draws what the pinned version draws for the state', () => {
        expect(shown.length).toBeGreaterThan(0);
        for (const state of shown) {
            expect(renderToStaticMarkup(elementOf(state.react ?? '', kit)), state.name).toBe(
                renderToStaticMarkup(state.draw(kit, (name) => name))
            );
        }
    });
});
